# Spec: Creator Resolution — IGSID → campaign_creator Matching

**Aspect**: `spec-creator-resolution`
**Wave**: 3 — Component Implementation Specs
**Date**: 2026-03-01
**Input files**:
- `analysis/audit/db-schemas.md` — `campaign_creator` schema, `social_media_handles` JSONB format
- `analysis/audit/backend-services.md` — service patterns, `Candidate`, DI conventions
- `analysis/spec/db-migrations.md` — `ig_igsid_cache`, `ig_igsid` column on `campaign_creator`, GIN index
- `analysis/spec/pydantic-models.md` — `IgDmMessage`, `IgDmThreadState`, `Candidate` extension
- `analysis/spec/temporal-interfaces.md` — `ig_igsid_resolution_activity` signature (§5), `IgIsidResolutionWorkflow` reference
- `../cheerful-ig-dm-reverse/analysis/current-creator-identity.md` — identity problem analysis, option catalog

---

## Overview

When an Instagram DM arrives via webhook, the `sender.id` is an **Instagram Scoped ID (IGSID)** — an opaque numeric string like `"17841400000123456"`. This is NOT a username. Cheerful's `campaign_creator` records store Instagram handles in the `social_media_handles` JSONB array. A multi-step resolution pipeline bridges the gap:

```
IGSID (from webhook)
    │
    ▼
ig_igsid_cache (check 7-day TTL)
    │ miss
    ▼
Meta Graph API GET /{igsid}?fields=name,username
    │
    ▼
ig_igsid_cache (upsert result)
    │
    ▼
campaign_creator.ig_igsid (O(1) direct match)
    │ miss
    ▼
campaign_creator.social_media_handles @> [{platform:instagram, handle:username}] (GIN index)
    │
    ▼
Disambiguation (if >1 match)
    │
    ▼
IgIdentityResult (campaign_creator_id or None)
```

This pipeline runs as a **fire-and-forget child workflow** (`IgIsidResolutionWorkflow`) spawned from `IgDmIngestWorkflow` after the message is stored. It does not block the ingest path.

---

## Files

### New Files

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `apps/backend/src/temporal/workflow/ig_igsid_resolution_workflow.py` | `IgIsidResolutionWorkflow` — wrapper for retry isolation |
| CREATE | `apps/backend/src/temporal/activity/ig_igsid_resolution_activity.py` | `ig_igsid_resolution_activity` — full resolution pipeline |
| CREATE | `apps/backend/src/repositories/ig_igsid_cache.py` | `IgIsidCacheRepository` — cache CRUD |
| CREATE | `apps/backend/src/models/temporal/ig_igsid_resolution.py` | `IgIsidResolutionInput`, `IgIdentityResult` |

### Modified Files

| Action | Path | What Changes |
|--------|------|-------------|
| MODIFY | `apps/backend/src/repositories/campaign_creator.py` | Add `find_by_ig_igsid()`, `find_by_instagram_handle()`, `update_ig_igsid()` |
| MODIFY | `apps/backend/src/services/external/ig_dm.py` | Add `get_user_info_by_igsid()` to `IgDmService` |
| MODIFY | `apps/backend/src/temporal/workflow/__init__.py` | Add `IgIsidResolutionWorkflow` to `__all__` |
| MODIFY | `apps/backend/src/temporal/activity/__init__.py` | Add `ig_igsid_resolution_activity` to `__all__` |

---

## 1. Temporal Models

### New File: `apps/backend/src/models/temporal/ig_igsid_resolution.py`

```python
"""Input/output models for IGSID resolution workflow and activity."""

import uuid
from pydantic import BaseModel


class IgIsidResolutionInput(BaseModel):
    """Input to IgIsidResolutionWorkflow and ig_igsid_resolution_activity."""
    sender_igsid: str
    # IGSID from Meta webhook: e.g. "17841400000123456"
    ig_dm_account_id: uuid.UUID
    # Which connected IG account received this DM (used to fetch access_token)
    ig_dm_message_id: uuid.UUID
    # ig_dm_message.id that triggered resolution (used for sender_username backfill)
    user_id: uuid.UUID
    # Owning user (scopes campaign_creator search to this user's campaigns)


class IgIdentityResult(BaseModel):
    """Output from ig_igsid_resolution_activity."""
    igsid: str
    # The resolved IGSID (same as input — included for tracing)
    username: str | None
    # Instagram @handle (e.g. "janedoe"); None if Graph API call failed or returned no data
    display_name: str | None
    # Human display name from Meta (e.g. "Jane Doe"); may be None
    was_cache_hit: bool
    # True if username was found in ig_igsid_cache without a Graph API call
    campaign_creator_id: uuid.UUID | None
    # campaign_creator.id if matched; None if no match found across any campaign
    match_method: str | None
    # How the match was made: "igsid_direct" | "handle_gin" | "disambiguated" | None
    was_ambiguous: bool
    # True if multiple campaign_creator rows matched; best-effort disambiguation was applied
```

---

## 2. `IgIsidResolutionWorkflow`

**File**: `apps/backend/src/temporal/workflow/ig_igsid_resolution_workflow.py`
**Purpose**: Wrapper workflow that isolates the IGSID resolution activity with its own retry policy and timeout, decoupled from the parent `IgDmIngestWorkflow`.

```python
"""IgIsidResolutionWorkflow — fire-and-forget IGSID resolution child workflow."""

from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy

from src.models.temporal.ig_igsid_resolution import IgIsidResolutionInput, IgIdentityResult


@workflow.defn
class IgIsidResolutionWorkflow:
    @workflow.run
    async def run(self, params: IgIsidResolutionInput) -> IgIdentityResult: ...
```

**Workflow ID**: `igsid-resolve-{sender_igsid}`
**ID Reuse Policy**: `ALLOW_DUPLICATE_FAILED_ONLY`
— Re-resolution only if a previous attempt failed. Successful resolutions are cached and do not need re-running per message.

**Execution Timeout**: `timedelta(minutes=5)`

**Step-by-step flow**:

```
Step 1: Execute ig_igsid_resolution_activity
    await workflow.execute_activity(
        ig_igsid_resolution_activity,
        params,
        schedule_to_close_timeout=timedelta(minutes=4),
        retry_policy=RetryPolicy(
            maximum_attempts=3,
            initial_interval=timedelta(seconds=1),
            backoff_coefficient=2.0,
            maximum_interval=timedelta(seconds=8),
            non_retryable_error_types=[
                "MetaApiNotFoundError",   # 404 — IGSID does not exist
                "MetaApiRateLimitError",  # 429 — exhausted; wait for cache TTL reset
                "MetaApiInvalidError",    # 400 — malformed IGSID
            ],
        ),
    )

Return: IgIdentityResult
```

**Why a wrapper workflow?**: The activity is fire-and-forget from `IgDmIngestWorkflow`. A wrapper workflow gives it:
- Independent retry policy (non-retryable errors don't propagate to the parent)
- Own execution history (visible in Temporal UI for debugging)
- `ALLOW_DUPLICATE_FAILED_ONLY` deduplication per IGSID (avoids re-resolution for same sender across multiple DMs)

**Registration**: Add to `src/temporal/workflow/__init__.py`:
```python
from src.temporal.workflow.ig_igsid_resolution_workflow import IgIsidResolutionWorkflow

__all__ = [
    ...  # existing
    "IgIsidResolutionWorkflow",
]
```

---

## 3. `ig_igsid_resolution_activity`

**File**: `apps/backend/src/temporal/activity/ig_igsid_resolution_activity.py`

```python
"""IGSID→creator resolution activity."""

import uuid
import logging

from temporalio import activity

from src.models.temporal.ig_igsid_resolution import IgIsidResolutionInput, IgIdentityResult

logger = logging.getLogger(__name__)


@activity.defn
async def ig_igsid_resolution_activity(
    params: IgIsidResolutionInput,
) -> IgIdentityResult:
    """
    Resolve an Instagram Scoped ID (IGSID) to a username and campaign_creator row.

    Resolution pipeline:
    1. Cache check: IgIsidCacheRepository.get_by_igsid(params.sender_igsid)
       - Hit: return immediately (no Graph API call)
       - Miss: call Graph API, cache result, continue to creator match

    2. Graph API call (cache miss path):
       IgDmService.get_user_info_by_igsid(params.sender_igsid, ig_dm_account_id)
       → {id, name, username}
       Raises MetaApiNotFoundError on 404 (non-retryable).
       Raises MetaApiRateLimitError on 429 (non-retryable — wait for TTL reset).

    3. Cache upsert (after Graph API call):
       IgIsidCacheRepository.upsert(igsid, username, display_name)
       → INSERT ... ON CONFLICT (igsid) DO UPDATE SET username=?, display_name=?, resolved_at=NOW()

    4. Backfill sender_username on ig_dm_message rows:
       UPDATE ig_dm_message
       SET sender_username = username
       WHERE sender_igsid = params.sender_igsid
         AND ig_dm_account_id = params.ig_dm_account_id
         AND sender_username IS NULL
       (Backfills all prior messages from this sender, not just the triggering one)

    5. Campaign creator match (after username resolved — cache hit or API call):
       a. Direct IGSID match (O(1)):
          CampaignCreatorRepository.find_by_ig_igsid(params.sender_igsid, params.user_id)
          → campaign_creator row or None

       b. Handle GIN match (if step a returns None):
          CampaignCreatorRepository.find_by_instagram_handle(username, params.user_id)
          → list[CampaignCreator] (may be empty, one, or many)

       c. Disambiguation (if step b returns >1 row):
          Select the campaign_creator row from the most recently created campaign
          (ORDER BY campaign.created_at DESC LIMIT 1).
          Set was_ambiguous=True in result. Log warning for observability.

       d. Write-through cache (if step b or c matched):
          CampaignCreatorRepository.update_ig_igsid(campaign_creator_id, params.sender_igsid)
          UPDATE campaign_creator SET ig_igsid = sender_igsid WHERE id = ?
          (Subsequent DMs from same creator skip GIN lookup entirely)

       e. No match:
          Return IgIdentityResult(campaign_creator_id=None, match_method=None)
          The thread is created as "unmatched" — campaign association is deferred
          to the normal ThreadAssociateToCampaignWorkflow (which uses LLM on text content).

    Return: IgIdentityResult

    Timeout: 30s. Retry: 3 (from workflow retry policy — not configured here).
    Non-retryable: MetaApiNotFoundError, MetaApiRateLimitError, MetaApiInvalidError.
    """
```

**Registration**: Add to `src/temporal/activity/__init__.py`:
```python
from src.temporal.activity.ig_igsid_resolution_activity import ig_igsid_resolution_activity
```

---

## 4. `IgIsidCacheRepository`

**File**: `apps/backend/src/repositories/ig_igsid_cache.py`
**Purpose**: CRUD for the `ig_igsid_cache` table. No user_id scoping (global system table).

```python
"""Repository for the ig_igsid_cache table (system-level, no user scoping)."""

from datetime import datetime, timezone, timedelta

from sqlalchemy.orm import Session

# Note: ig_igsid_cache has no SQLAlchemy model (see spec-pydantic-models.md §Design Decision 5).
# All queries use SQLAlchemy Core (text() or table()/column() expressions).


CACHE_TTL_DAYS = 7
# Re-resolve after 7 days in case username changed


class IgIsidCacheRepository:
    def __init__(self, db_session: Session)

    def get_by_igsid(self, igsid: str) -> dict | None:
        """
        Retrieve a cached IGSID entry if within CACHE_TTL_DAYS.

        Query:
            SELECT igsid, username, display_name, resolved_at, last_seen_at
            FROM ig_igsid_cache
            WHERE igsid = :igsid
              AND resolved_at > NOW() - INTERVAL '7 days'

        Side effect: If found, UPDATE ig_igsid_cache SET last_seen_at = NOW() WHERE igsid = :igsid

        Returns: dict with keys {igsid, username, display_name, resolved_at} or None
        """

    def upsert(
        self,
        igsid: str,
        username: str,
        display_name: str | None,
    ) -> None:
        """
        Insert or update an IGSID cache entry.

        Query:
            INSERT INTO ig_igsid_cache (igsid, username, display_name, resolved_at, last_seen_at)
            VALUES (:igsid, :username, :display_name, NOW(), NOW())
            ON CONFLICT (igsid)
            DO UPDATE SET
                username     = EXCLUDED.username,
                display_name = EXCLUDED.display_name,
                resolved_at  = NOW(),
                last_seen_at = NOW()
        """
```

**Table definition** (from `spec-db-migrations.md §Section 4`):
```sql
CREATE TABLE IF NOT EXISTS ig_igsid_cache (
    igsid        TEXT PRIMARY KEY,
    username     TEXT NOT NULL,
    display_name TEXT,
    resolved_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ig_igsid_cache_username ON ig_igsid_cache (username);
```

**No SQLAlchemy model**: Per `spec-pydantic-models.md §Design Decision 5`, this table has no SQLAlchemy ORM class. It is a system-level lookup table with no user_id, no RLS, and no FK relationships requiring ORM navigation. Raw Core queries are sufficient.

---

## 5. Modified: `CampaignCreatorRepository`

**File**: `apps/backend/src/repositories/campaign_creator.py`
**Existing class**: `CampaignCreatorRepository` (already exists)

### New Methods

```python
def find_by_ig_igsid(
    self,
    igsid: str,
    user_id: uuid.UUID,
) -> CampaignCreator | None:
    """
    Direct O(1) IGSID lookup (write-through cache path).

    Query:
        SELECT cc.*
        FROM campaign_creator cc
        JOIN campaign c ON cc.campaign_id = c.id
        WHERE cc.ig_igsid = :igsid
          AND c.user_id = :user_id
        LIMIT 1

    Scopes to user_id to prevent cross-user IGSID collisions.
    Returns: first matching CampaignCreator or None.
    """

def find_by_instagram_handle(
    self,
    username: str,
    user_id: uuid.UUID,
) -> list[CampaignCreator]:
    """
    GIN-indexed JSONB containment search on social_media_handles.

    Query:
        SELECT cc.*
        FROM campaign_creator cc
        JOIN campaign c ON cc.campaign_id = c.id
        WHERE cc.social_media_handles @> :handle_filter::jsonb
          AND c.user_id = :user_id

    Where :handle_filter = '[{"platform": "instagram", "handle": "<username>"}]'

    Uses the GIN index: idx_campaign_creator_social_handles_gin
    (added in spec-db-migrations.md §Section 10).

    Returns: list of matching CampaignCreator rows (may be empty, one, or many).
    Multi-result: caller must disambiguate (see activity step 5c).
    """

def update_ig_igsid(
    self,
    campaign_creator_id: uuid.UUID,
    igsid: str,
) -> None:
    """
    Write-through cache: set ig_igsid column once a match is confirmed.

    Query:
        UPDATE campaign_creator
        SET ig_igsid = :igsid, updated_at = NOW()
        WHERE id = :campaign_creator_id

    Subsequent DMs from same sender use find_by_ig_igsid() (O(1)) instead of GIN search.
    """
```

**Index used by `find_by_instagram_handle`** (from `spec-db-migrations.md`):
```sql
CREATE INDEX IF NOT EXISTS idx_campaign_creator_social_handles_gin
    ON campaign_creator USING GIN (social_media_handles);
```

**Existing `cast(... as text) ILIKE` pattern** (current code at `repositories/campaign_creator.py:108`): NOT used for DM resolution. The GIN containment operator `@>` is used instead — it correctly respects the JSON structure and is indexed. The old ILIKE pattern remains in the existing `find_candidates_by_signals()` method and is not changed.

---

## 6. Modified: `IgDmService`

**File**: `apps/backend/src/services/external/ig_dm.py`
**Existing class**: `IgDmService` (created in `spec-api-contracts.md`)

### New Method

```python
def get_user_info_by_igsid(self, igsid: str) -> dict:
    """
    Resolve an IGSID to username + display name via Meta Graph API.

    API call:
        GET /{igsid}?fields=name,username
        Authorization: Bearer {self._access_token}

    Expected response:
        {"id": "17841400000123456", "name": "Jane Doe", "username": "janedoe"}

    Returns: dict with keys {id, name, username}

    Raises:
        MetaApiNotFoundError   — HTTP 404 (IGSID does not exist or not accessible)
        MetaApiRateLimitError  — HTTP 429 (rate limit exceeded)
        MetaApiInvalidError    — HTTP 400 (malformed IGSID)
        MetaApiError           — Other HTTP errors (retryable)

    Rate limit context:
        Standard Access: 200 calls/hour per user (not per token).
        This method is called only on cache miss, which after initial warmup
        represents new senders only (~handful per day for typical campaigns).
    """
```

**Error classes** (defined in `apps/backend/src/services/external/ig_dm.py`):

```python
class MetaApiError(Exception):
    """Base class for Meta Graph API errors."""
    status_code: int
    error_code: int | None
    message: str

class MetaApiNotFoundError(MetaApiError):
    """HTTP 404 — IGSID not found or not accessible."""

class MetaApiRateLimitError(MetaApiError):
    """HTTP 429 — rate limit exceeded. Non-retryable in Temporal context."""
    retry_after_seconds: int | None

class MetaApiInvalidError(MetaApiError):
    """HTTP 400 — malformed request (bad IGSID format, missing permissions)."""
```

---

## 7. Campaign Disambiguation

When `find_by_instagram_handle()` returns multiple `CampaignCreator` rows (one creator in multiple campaigns for the same user), the activity applies this disambiguation algorithm:

### Algorithm: Pick Newest Campaign

```python
# In ig_igsid_resolution_activity, after step 5b returns matches:

if len(matches) > 1:
    # Fetch campaign.created_at for each match
    # Select the campaign_creator whose campaign was created most recently
    # Rationale: If a creator is in two campaigns, the DM is most likely a reply
    # to the most recent outreach (where the creator relationship is freshest).
    best_match = max(matches, key=lambda cc: get_campaign_created_at(cc.campaign_id))
    result_creator_id = best_match.id
    was_ambiguous = True
    logger.warning(
        "IGSID resolution: ambiguous match",
        extra={
            "igsid": params.sender_igsid,
            "username": username,
            "match_count": len(matches),
            "selected_campaign_creator_id": str(best_match.id),
            "all_campaign_creator_ids": [str(cc.id) for cc in matches],
        }
    )
```

**Rationale**: The "newest campaign" heuristic is a practical default. The `was_ambiguous=True` flag in `IgIdentityResult` surfaces this to:
1. The context engine notification (`spec-ce-ig-dm-notifications.md`) — can show a disambiguation hint
2. Observability (Temporal + logging) — engineering can tune if disambiguation causes errors

**Future improvement** (out of scope for this phase): Allow users to manually resolve ambiguous IGSID→campaign mappings via the context engine (`cheerful_connect_ig_account` or a new tool). Store the manual override in `ig_igsid_cache` or a new `ig_dm_creator_mapping` table.

---

## 8. No-Match Handling

When neither `find_by_ig_igsid()` nor `find_by_instagram_handle()` returns a result:

```python
# IgIdentityResult(campaign_creator_id=None, match_method=None, ...)
```

**What happens downstream**:
1. The `campaign_creator_id` is None — no creator-level data (gifting_status, etc.) on the thread view
2. The `ig_dm_thread_state` row already exists with `status=READY_FOR_CAMPAIGN_ASSOCIATION`
3. `ThreadProcessingCoordinatorWorkflow` runs as normal:
   - `ThreadAssociateToCampaignWorkflow` runs LLM-based campaign association on the DM text content
   - If LLM finds a campaign match → thread gets associated → drafting continues
   - If LLM finds no match → status transitions to `IGNORE`
4. The CE tool `cheerful_get_ig_dm_thread` shows `sender_username` (if resolved) but no creator fields
5. The CE notification for "new inbound DM" fires with `sender_username` and "(creator not matched)" note

**Coverage gap acknowledgment**: Per `current-creator-identity.md §8`, many campaign_creator rows have `social_media_handles = []` (empty — no Instagram handle stored). These DMs will not match via GIN index. They flow through the LLM campaign association path, which may successfully route the DM by other signals (text content, campaign context). This is acceptable for the initial phase.

---

## 9. Rate Limit Strategy

| Scenario | Rate consumption |
|----------|-----------------|
| First DM from a new sender | 1 Graph API call (cache population) |
| Repeat DMs from known sender (cache hit) | 0 calls |
| 7-day cache TTL expiry | 1 call per unique sender per week |
| Initial sync (100 conversations) | Up to 100 calls (one per unique sender) |

**Budget**: 200 calls/hour per user (Standard Access). Even with initial sync of 100 conversations, calls are spread over the `IgDmInitialSyncWorkflow`'s 0.5s sleep between conversations (~200s for 100 conversations = well within rate limit).

**On 429 response**: The `MetaApiRateLimitError` is declared non-retryable in the workflow's retry policy. The activity fails, the workflow fails, and resolution is skipped for this IGSID. Next time a DM from the same sender arrives, `IgIsidResolutionWorkflow` will be re-attempted (because the previous run failed, `ALLOW_DUPLICATE_FAILED_ONLY` permits a new run).

---

## 10. Trigger: From `IgDmIngestWorkflow`

From `spec-temporal-interfaces.md §IgDmIngestWorkflow Step 5`:

```python
# Step 5: IGSID resolution (fire-and-forget child, if direction == INBOUND)
if not params.is_echo and params.direction == "INBOUND":
    await workflow.start_child_workflow(
        IgIsidResolutionWorkflow.run,
        IgIsidResolutionInput(
            sender_igsid=params.sender_igsid,
            ig_dm_account_id=params.ig_dm_account_id,
            ig_dm_message_id=store_result.ig_dm_message_id,
            user_id=params.user_id,
        ),
        id=f"igsid-resolve-{params.sender_igsid}",
        id_reuse_policy=ALLOW_DUPLICATE_FAILED_ONLY,
        parent_close_policy=ABANDON,   # Non-blocking: parent does not wait
    )
```

**Important**: `parent_close_policy=ABANDON` means `IgDmIngestWorkflow` completes immediately without waiting for resolution. The `ThreadProcessingCoordinatorWorkflow` is already spawned (Step 6) concurrently. IGSID resolution is a background enrichment task — it backfills `sender_username` and `campaign_creator_id` when complete, but it does NOT block campaign association or draft generation.

---

## 11. Ingest Workflow: `IgIsidResolutionInput` Fields from Webhook Payload

How each field of `IgIsidResolutionInput` is populated from the webhook context (see `spec-ingest-workflow.md`):

| Field | Source |
|-------|--------|
| `sender_igsid` | `webhook_payload.entry[0].messaging[0].sender.id` |
| `ig_dm_account_id` | Resolved from `webhook_payload.entry[0].id` (FB Page ID → `user_ig_dm_account.id`) |
| `ig_dm_message_id` | Returned by `ig_dm_store_message_activity` as `IgDmIngestStoreResult.ig_dm_message_id` |
| `user_id` | From `user_ig_dm_account.user_id` (fetched during webhook dispatch via `IgDmWebhookDispatchRepository`) |

---

## 12. Data Flow Summary

```
IgDmIngestWorkflow (Step 5, fire-and-forget)
    │
    ▼
IgIsidResolutionWorkflow
    │
    ▼
ig_igsid_resolution_activity
    │
    ├─── IgIsidCacheRepository.get_by_igsid()
    │       └── Cache hit → skip API → go to step 5
    │       └── Cache miss ──────────────────────────────────────────┐
    │                                                                 │
    │                                                    IgDmService.get_user_info_by_igsid()
    │                                                        └── GET /{igsid}?fields=name,username
    │                                                    IgIsidCacheRepository.upsert()
    │                                                                 │
    │◄────────────────────────────────────────────────────────────────┘
    │
    ├─── UPDATE ig_dm_message SET sender_username = ? WHERE sender_igsid = ?
    │
    ├─── CampaignCreatorRepository.find_by_ig_igsid()
    │       └── Match: → CampaignCreatorRepository.update_ig_igsid() (no-op, already set)
    │       └── Miss ─────────────────────────────────────────────────┐
    │                                                                  │
    │                                          CampaignCreatorRepository.find_by_instagram_handle()
    │                                              └── 0 results → campaign_creator_id=None
    │                                              └── 1 result → use it
    │                                              └── N results → pick newest campaign
    │                                          CampaignCreatorRepository.update_ig_igsid()
    │                                                                  │
    │◄─────────────────────────────────────────────────────────────────┘
    │
    └─── Return IgIdentityResult
            (campaign_creator_id is INFORMATIONAL for Phase 1 — not wired into coordinator)
```

**Phase 1 note**: In Phase 1, `IgIdentityResult.campaign_creator_id` is resolved and logged, but NOT automatically injected into the `Candidate` or thread state. The `ThreadAssociateToCampaignWorkflow` performs its own campaign association via LLM (which is the existing authoritative path). Creator-level data (gifting_status etc.) is enriched into the thread view at query time by the API route joining `campaign_creator` via `ig_igsid_cache`. In Phase 2+, a direct `campaign_creator_id` → `campaign_id` short-circuit can be added.

---

## Dependencies

- **`spec-db-migrations.md`** — Defines `ig_igsid_cache` table, `ig_igsid` column on `campaign_creator`, GIN index on `social_media_handles`
- **`spec-pydantic-models.md`** — Defines `Candidate`, `IgDmMessage`, context for why no `IgIsidCache` SQLAlchemy model
- **`spec-temporal-interfaces.md`** — Defines `IgDmIngestWorkflow` trigger (Step 5), `ig_igsid_resolution_activity` signature
- **`spec-ingest-workflow.md`** — Defines the parent trigger context

## Referenced By

- **`spec-ingest-workflow.md`** — Steps 5 in `IgDmIngestWorkflow`
- **`spec-api-contracts.md`** — Thread view endpoints join `ig_igsid_cache` for `sender_username` enrichment
- **`spec-ce-ig-dm-tools.md`** — `cheerful_get_ig_dm_thread` uses resolved creator data
- **`spec-ce-ig-dm-notifications.md`** — "Creator matched" notification fires on successful resolution
