# Spec: `IgDmIngestWorkflow` — Instagram DM Ingest Pipeline

**Aspect**: `spec-ingest-workflow`
**Wave**: 3 — Component Implementation Specs
**Date**: 2026-03-01
**Input files**:
- `analysis/spec/temporal-interfaces.md` — workflow/activity class signatures, ingest trigger chain, idempotency strategy
- `analysis/spec/db-migrations.md` — `ig_dm_message`, `ig_dm_thread_state`, `ig_igsid_cache` schemas
- `analysis/spec/pydantic-models.md` — `IgDmIngestInput`, `IgDmIngestStoreInput`, `IgDmIngestStoreResult`, `IgDmMediaDownloadInput`, `IgDmMediaDownloadResult`, `IgDmStateCandidateInput`, `IgIdentityResult`
- `analysis/spec/webhook-handler.md` — webhook POST → BackgroundTask → `IgDmIngestWorkflow.run` dispatch
- `analysis/audit/temporal-workflows.md` — coordinator branching pattern, activity registration pattern, `__all__` update requirements
- `analysis/audit/backend-services.md` — `Candidate` object conventions, SMTP discriminator pattern

---

## Files

### New Files

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `apps/backend/src/temporal/workflow/ig_dm_ingest_workflow.py` | `IgDmIngestWorkflow` — main per-message ingest workflow |
| CREATE | `apps/backend/src/temporal/workflow/ig_igsid_resolution_workflow.py` | `IgIsidResolutionWorkflow` — thin wrapper for IGSID→username resolution (retry isolation) |
| CREATE | `apps/backend/src/temporal/activity/ig_dm_ingest_activity.py` | Dedup check, message store, thread state insert, active accounts list |
| CREATE | `apps/backend/src/temporal/activity/ig_dm_media_download_activity.py` | Download ephemeral Meta CDN URLs → Supabase Storage |
| CREATE | `apps/backend/src/temporal/activity/ig_igsid_resolution_activity.py` | IGSID→username cache lookup + Graph API fallback; sender_username update |

### Modified Files

| Action | Path | What Changes |
|--------|------|-------------|
| MODIFY | `apps/backend/src/temporal/workflow/__init__.py` | Add `IgDmIngestWorkflow`, `IgIsidResolutionWorkflow` to `__all__` |
| MODIFY | `apps/backend/src/temporal/activity/__init__.py` | Add all new ingest activities to `__all__` |
| MODIFY | `apps/backend/src/temporal/workflow/thread_processing_coordinator_workflow.py` | Add `is_ig_dm` discriminator; skip Gmail-only steps for IG DM; add 24h window check; use IG DM draft path |
| MODIFY | `apps/backend/src/temporal/activity/gmail_thread_state.py` | Extend `update_state_status_activity` and `check_is_latest_for_thread_state_activity` to dispatch to `IgDmThreadStateRepository` when `ig_dm_account_id` is set |
| MODIFY | `apps/backend/src/temporal/activity/gmail_thread_llm_draft.py` | Extend `maybe_get_draft_by_thread_state_id_activity` and `maybe_get_draft_by_thread_id_activity` to query `ig_dm_llm_draft` table when `ig_dm_account_id` is set |
| MODIFY | `apps/backend/src/temporal/search_attributes.py` | Add `IG_DM_ACCOUNT_ID_KEY`, `IG_CONVERSATION_ID_KEY`, `build_search_attributes_for_ig_dm_candidate()` |
| MODIFY | `apps/backend/src/models/temporal/ig_dm_ingest.py` | Add `IgIsidResolutionInput` (needed by `IgIsidResolutionWorkflow`) |

---

## Overview

### Trigger Chain

```
Meta POST /webhooks/instagram/
    → FastAPI handler (HMAC verified, immediate 200)
    → BackgroundTask: _dispatch_ig_dm_events(payload)
        → DB: lookup UserIgDmAccount by entry.id (instagram_business_account_id)
        → temporal_client.start_workflow(
              IgDmIngestWorkflow.run,
              IgDmIngestInput(...),
              id=f"ig-dm-ingest-{mid}",
              id_reuse_policy=ALLOW_DUPLICATE_FAILED_ONLY,
          )

IgDmIngestWorkflow (per message, short-lived)
    → ig_dm_dedup_check_activity              [Step 1: dedup]
    → ig_dm_media_download_activity           [Step 2: media, if applicable]
    → ig_dm_store_message_activity            [Step 3: persist ig_dm_message]
    → batch_insert_ig_dm_state_and_get_candidate_activity  [Step 4: ig_dm_thread_state]
    → IgIsidResolutionWorkflow (child, fire-and-forget)    [Step 5: IGSID cache+resolve]
    → ThreadProcessingCoordinatorWorkflow (child, fire-and-forget)  [Step 6: coordinator]
```

Contrast with email:
- **Gmail**: `AllPollHistoryWorkflow` (perpetual poll loop) → `ProcessAccountMessagesWorkflow` → `ingest_single_message_activity` → `ThreadSyncWorkflow` → coordinator
- **SMTP**: `AllSmtpInboxSyncWorkflow` (cron-like) → `BatchSmtpInboxSyncWorkflow` → `smtp_inbox_sync_activity` → `SmtpThreadSyncWorkflow` → coordinator
- **IG DM**: Webhook event → `BackgroundTask` → `IgDmIngestWorkflow` → coordinator ← **event-driven, no poll loop**

### Idempotency Strategy

| Layer | Key | Guard |
|-------|-----|-------|
| Workflow ID | `f"ig-dm-ingest-{mid}"` | `ALLOW_DUPLICATE_FAILED_ONLY` reuse policy — webhook replays start a new workflow but skip if already completed |
| `ig_dm_dedup_check_activity` | `(ig_dm_account_id, mid)` | SELECT-based early exit before media download |
| `ig_dm_store_message_activity` | `UNIQUE (ig_dm_account_id, mid)` | `ON CONFLICT DO NOTHING` — DB-level dedup, race-condition safe |
| `batch_insert_ig_dm_state_and_get_candidate_activity` | `UNIQUE (user_id, ig_dm_account_id, ig_conversation_id, latest_internal_date)` | `ON CONFLICT DO NOTHING` — idempotent state insertion |
| `IgIsidResolutionWorkflow` | `f"igsid-resolve-{sender_igsid}"` | `ALLOW_DUPLICATE_FAILED_ONLY` — single resolution per IGSID across all concurrent ingest workflows |
| Coordinator spawn | `f"ig-dm-coordinator-{state__id}"` | `ALLOW_DUPLICATE_FAILED_ONLY` — one coordinator per state version |

### Echo Message Handling

Meta sends webhook echoes for outbound messages sent by the IG Business Account. These arrive with `is_echo=True` in `MetaWebhookMessage`. Behavior:

- **Steps 1-3** (dedup, media, store): Execute normally — echo messages are persisted as `direction=OUTBOUND, is_echo=True` in `ig_dm_message`.
- **Step 4** (thread state): **Skip** — the `IgDmSendReplyWorkflow` already created the `WAITING_FOR_INBOUND` state row when the reply was sent. Inserting another state row for the echo would create a spurious state transition.
- **Steps 5-6** (IGSID resolution, coordinator): **Skip** — echoes don't represent new inbound creator activity requiring processing.

Gate: `if not params.is_echo:` before Steps 4-6.

---

## 1. `IgDmIngestWorkflow`

**File**: `apps/backend/src/temporal/workflow/ig_dm_ingest_workflow.py`

```python
"""IgDmIngestWorkflow — process a single Instagram DM message from Meta webhook."""

from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy, WorkflowIDReusePolicy

from src.models.temporal.ig_dm_ingest import (
    IgDmIngestInput,
    IgDmIngestResult,
    IgDmIngestStoreInput,
    IgDmMediaDownloadInput,
    IgDmStateCandidateInput,
    IgIsidResolutionInput,
)


@workflow.defn
class IgDmIngestWorkflow:
    """Process a single IG DM message from a Meta webhook event.

    Triggered by the webhook BackgroundTask, one instance per message (per `mid`).
    Idempotent: ALLOW_DUPLICATE_FAILED_ONLY reuse policy + DB-level dedup constraints.

    Handles both inbound (creator → brand) and outbound echo (brand → creator) messages.
    Echo messages (is_echo=True) are stored but do NOT trigger coordinator or IGSID resolution.

    Duration: Short-lived (seconds to ~2 minutes for media download).
    Task queue: TEMPORAL_TASK_QUEUE ("main")
    """

    @workflow.run
    async def run(self, params: IgDmIngestInput) -> IgDmIngestResult: ...
```

**Workflow metadata**:

| Field | Value |
|-------|-------|
| Workflow ID | `f"ig-dm-ingest-{params.mid}"` |
| ID Reuse Policy | `ALLOW_DUPLICATE_FAILED_ONLY` |
| Execution Timeout | `timedelta(minutes=10)` |
| Task Queue | `TEMPORAL_TASK_QUEUE = "main"` |
| Search Attributes | `build_search_attributes_for_ig_dm_candidate()` — sets `IG_DM_ACCOUNT_ID_KEY`, `IG_CONVERSATION_ID_KEY` |

### Step-by-Step Flow

```
─────────────────────────────────────────────────────────────────────────────
Step 1: Dedup check (fast path — skip media download for duplicates)
─────────────────────────────────────────────────────────────────────────────
result = await workflow.execute_activity(
    ig_dm_dedup_check_activity,
    args=[params.ig_dm_account_id, params.mid],
    start_to_close_timeout=timedelta(seconds=10),
    retry_policy=RetryPolicy(maximum_attempts=3),
    activity_id=f"ig-dm-dedup-{params.mid}",
)
if result is True:
    return IgDmIngestResult(
        ig_dm_message_id=None,
        ig_conversation_id=params.ig_conversation_id,
        was_duplicate=True,
    )

─────────────────────────────────────────────────────────────────────────────
Step 2: Media download (only if params.media_original_urls is not None)
─────────────────────────────────────────────────────────────────────────────
media_storage_paths: list[str] | None = None
if params.media_original_urls:
    media_result = await workflow.execute_activity(
        ig_dm_media_download_activity,
        IgDmMediaDownloadInput(
            ig_dm_account_id=params.ig_dm_account_id,
            ig_dm_message_id=None,  # not yet stored; path constructed from mid
            media_original_urls=params.media_original_urls,
            ig_conversation_id=params.ig_conversation_id,
            mid=params.mid,
        ),
        start_to_close_timeout=timedelta(minutes=2),
        retry_policy=RetryPolicy(
            maximum_attempts=2,
            # Only 2 retries — CDN URLs expire ~1 hour after webhook delivery.
            # A third retry minutes later will fail on expired URL; waste budget.
        ),
        activity_id=f"ig-dm-media-{params.mid}",
    )
    media_storage_paths = media_result.media_storage_paths or []
    # Non-fatal: if download fails, store empty list and log warning.
    # media_original_urls are preserved in the message row for debugging.

─────────────────────────────────────────────────────────────────────────────
Step 3: Store ig_dm_message
─────────────────────────────────────────────────────────────────────────────
store_result = await workflow.execute_activity(
    ig_dm_store_message_activity,
    IgDmIngestStoreInput(
        ig_dm_account_id=params.ig_dm_account_id,
        user_id=params.user_id,
        mid=params.mid,
        ig_conversation_id=params.ig_conversation_id,
        sender_igsid=params.sender_igsid,
        recipient_igsid=params.recipient_igsid,
        direction="OUTBOUND" if params.is_echo else "INBOUND",
        is_echo=params.is_echo,
        body_text=params.body_text,
        message_type=params.message_type.value,
        sent_at_ms=params.sent_at_ms,
        reply_to_mid=params.reply_to_mid,
        media_storage_paths=media_storage_paths,
        media_original_urls=params.media_original_urls,
    ),
    start_to_close_timeout=timedelta(seconds=30),
    retry_policy=RetryPolicy(maximum_attempts=3),
    activity_id=f"ig-dm-store-{params.mid}",
)
if store_result.was_duplicate:
    # Race condition: another workflow beat us (webhook retry scenario)
    return IgDmIngestResult(
        ig_dm_message_id=store_result.ig_dm_message_id,
        ig_conversation_id=params.ig_conversation_id,
        was_duplicate=True,
    )

─────────────────────────────────────────────────────────────────────────────
Steps 4-6: Echo gate — skip state/coordinator/resolution for echo messages
─────────────────────────────────────────────────────────────────────────────
if params.is_echo:
    # Echo = outbound message sent by the IG Business Account, echoed by Meta.
    # State was already set to WAITING_FOR_INBOUND by IgDmSendReplyWorkflow.
    # No coordinator spawn needed; no IGSID resolution needed (recipient is us).
    return IgDmIngestResult(
        ig_dm_message_id=store_result.ig_dm_message_id,
        ig_conversation_id=params.ig_conversation_id,
        was_duplicate=False,
    )

─────────────────────────────────────────────────────────────────────────────
Step 4: Upsert ig_dm_thread_state + build Candidate
─────────────────────────────────────────────────────────────────────────────
# For INBOUND messages: window_expires_at = sent_at + 24h (computed in activity).
# Status = READY_FOR_CAMPAIGN_ASSOCIATION (coordinator will advance it).
candidate = await workflow.execute_activity(
    batch_insert_ig_dm_state_and_get_candidate_activity,
    IgDmStateCandidateInput(
        ig_dm_account_id=params.ig_dm_account_id,
        user_id=params.user_id,
        ig_conversation_id=params.ig_conversation_id,
        latest_ig_dm_message_id=store_result.ig_dm_message_id,
        latest_message_sent_at_ms=params.sent_at_ms,
        direction="INBOUND",  # All non-echo messages are INBOUND at this point
        triggered_by_mid=params.mid,
    ),
    start_to_close_timeout=timedelta(seconds=30),
    retry_policy=RetryPolicy(maximum_attempts=3),
    activity_id=f"ig-dm-state-{params.mid}",
)
# Returns Candidate with ig_dm_account_id set.
# Returns None if state row already exists for this (account, conversation, sent_at).

─────────────────────────────────────────────────────────────────────────────
Step 5: IGSID resolution (fire-and-forget child workflow)
─────────────────────────────────────────────────────────────────────────────
# Non-blocking: launch and abandon. Resolution may take time due to Graph API
# rate limits. The ig_dm_message.sender_username is initially NULL and updated
# asynchronously by IgIsidResolutionWorkflow when resolution completes.
await workflow.start_child_workflow(
    IgIsidResolutionWorkflow.run,
    IgIsidResolutionInput(
        sender_igsid=params.sender_igsid,
        ig_dm_account_id=params.ig_dm_account_id,
        ig_dm_message_id=store_result.ig_dm_message_id,
    ),
    id=f"igsid-resolve-{params.sender_igsid}",
    id_reuse_policy=WorkflowIDReusePolicy.ALLOW_DUPLICATE_FAILED_ONLY,
    parent_close_policy=ParentClosePolicy.ABANDON,
)

─────────────────────────────────────────────────────────────────────────────
Step 6: Spawn ThreadProcessingCoordinatorWorkflow (if state row was new)
─────────────────────────────────────────────────────────────────────────────
if candidate is not None:
    await workflow.start_child_workflow(
        ThreadProcessingCoordinatorWorkflow.run,
        candidate,  # Candidate with ig_dm_account_id set
        id=f"ig-dm-coordinator-{candidate.state__id}",
        id_reuse_policy=WorkflowIDReusePolicy.ALLOW_DUPLICATE_FAILED_ONLY,
        parent_close_policy=ParentClosePolicy.ABANDON,
    )
# If candidate is None (duplicate state = no new state row),
# skip coordinator — the existing coordinator for this thread is still active.

─────────────────────────────────────────────────────────────────────────────
Return
─────────────────────────────────────────────────────────────────────────────
return IgDmIngestResult(
    ig_dm_message_id=store_result.ig_dm_message_id,
    ig_conversation_id=params.ig_conversation_id,
    was_duplicate=False,
)
```

**Imports within `run` method** (lazy, matching existing codebase pattern):
```python
from temporalio.common import ParentClosePolicy, WorkflowIDReusePolicy
from src.temporal.workflow.ig_igsid_resolution_workflow import IgIsidResolutionWorkflow
from src.temporal.workflow.thread_processing_coordinator_workflow import ThreadProcessingCoordinatorWorkflow
from src.temporal.activity.ig_dm_ingest_activity import (
    ig_dm_dedup_check_activity,
    ig_dm_store_message_activity,
    batch_insert_ig_dm_state_and_get_candidate_activity,
)
from src.temporal.activity.ig_dm_media_download_activity import ig_dm_media_download_activity
```

---

## 2. `IgIsidResolutionWorkflow` (Thin Wrapper)

**File**: `apps/backend/src/temporal/workflow/ig_igsid_resolution_workflow.py`

```python
"""IgIsidResolutionWorkflow — thin wrapper for IGSID→username resolution.

Why a wrapper workflow (not just an activity):
- Retry isolation: IGSID resolution retries (Graph API rate limits) don't affect
  the parent IgDmIngestWorkflow's retry budget.
- Deduplication: multiple concurrent ingest workflows for the same IGSID
  (different messages from the same creator) share one resolution via
  ALLOW_DUPLICATE_FAILED_ONLY workflow ID = igsid-resolve-{igsid}.
- Visibility: distinct Temporal UI entry for IGSID resolution debugging.
"""

from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy

from src.models.temporal.ig_dm_ingest import IgIsidResolutionInput


@workflow.defn
class IgIsidResolutionWorkflow:
    """Resolve IGSID to username via cache then Graph API. Update ig_dm_message."""

    @workflow.run
    async def run(self, params: IgIsidResolutionInput) -> None: ...
```

**Workflow metadata**:

| Field | Value |
|-------|-------|
| Workflow ID | `f"igsid-resolve-{params.sender_igsid}"` |
| ID Reuse Policy | `ALLOW_DUPLICATE_FAILED_ONLY` |
| Execution Timeout | `timedelta(minutes=5)` |
| Task Queue | `TEMPORAL_TASK_QUEUE = "main"` |

**Step-by-step flow**:

```
Step 1: Resolve IGSID
    identity = ig_igsid_resolution_activity(
        params.sender_igsid,
        params.ig_dm_account_id,
    )
    → IgIdentityResult (igsid, username, display_name, resolved_from_cache)
    # start_to_close_timeout=60s, retry=5 (exponential, handles rate limits)
    # activity_id=f"igsid-resolve-activity-{params.sender_igsid}"

Step 2: Update sender_username on ig_dm_message (if resolution succeeded)
    if identity.username is not None:
        ig_dm_update_sender_username_activity(
            ig_dm_message_id=params.ig_dm_message_id,
            sender_username=identity.username,
        )
    # start_to_close_timeout=10s, retry=3
    # activity_id=f"igsid-update-username-{params.ig_dm_message_id}"
```

---

## 3. Activity Specs

### 3.1 `apps/backend/src/temporal/activity/ig_dm_ingest_activity.py`

Contains activities for the core ingest path (dedup check, message store, state insert).

**Parallel to**: `src/temporal/activity/smtp_thread_state_sync_activity.py` and `ingest_single_message_activity.py`

#### `ig_dm_dedup_check_activity`

```python
@activity.defn
def ig_dm_dedup_check_activity(ig_dm_account_id: uuid.UUID, mid: str) -> bool:
    """Check if a message has already been stored by MID.

    Performs a lightweight SELECT query before media download to fast-path
    duplicate webhook deliveries (Meta retries up to 3x on non-200 responses).

    Args:
        ig_dm_account_id: UUID of the UserIgDmAccount this message belongs to.
        mid: Meta message ID from the webhook payload.

    Returns:
        True if a row with (ig_dm_account_id, mid) exists in ig_dm_message.
        False if this is a new message.
    """
```

**SQL**: `SELECT 1 FROM ig_dm_message WHERE ig_dm_account_id = :account_id AND mid = :mid LIMIT 1`
**Dependencies**: `AsyncEngine` / database session from DI (matches existing activity pattern).

#### `ig_dm_store_message_activity`

```python
@activity.defn
def ig_dm_store_message_activity(params: IgDmIngestStoreInput) -> IgDmIngestStoreResult:
    """Insert an ig_dm_message row. Idempotent via ON CONFLICT DO NOTHING.

    Args:
        params: Full message data including resolved media_storage_paths.

    Returns:
        IgDmIngestStoreResult with ig_dm_message_id and was_duplicate flag.
        was_duplicate=True means the INSERT was a no-op (race condition dedup).
        In that case the returned ig_dm_message_id is the pre-existing row's ID.
    """
```

**SQL** (pseudocode):
```sql
INSERT INTO ig_dm_message (
    user_id, ig_dm_account_id, mid, ig_conversation_id,
    sender_igsid, sender_username, recipient_igsid,
    direction, is_echo, body_text, message_type,
    media_storage_paths, media_original_urls,
    sent_at, reply_to_mid
)
VALUES (...)
ON CONFLICT (ig_dm_account_id, mid) DO NOTHING
RETURNING id;
-- If RETURNING is empty (conflict), SELECT id WHERE ig_dm_account_id=? AND mid=?
```

**`sent_at` conversion**: `datetime.fromtimestamp(params.sent_at_ms / 1000, tz=timezone.utc)` — converts Unix milliseconds from Meta webhook to Python `datetime` for `TIMESTAMPTZ`.

**`sender_username`**: Set to `None` on initial insert (not yet resolved). Updated asynchronously by `IgIsidResolutionWorkflow`.

#### `batch_insert_ig_dm_state_and_get_candidate_activity`

```python
@activity.defn
def batch_insert_ig_dm_state_and_get_candidate_activity(
    params: IgDmStateCandidateInput,
) -> Candidate | None:
    """Insert ig_dm_thread_state row and return a Candidate for coordinator spawn.

    Parallel to batch_insert_latest_smtp_state_and_get_candidates_activity.
    Named "batch" for consistency with the SMTP pattern (even though IG DM
    processes one state at a time).

    Status is always READY_FOR_CAMPAIGN_ASSOCIATION on first insert.
    window_expires_at = sent_at + 24h (only for INBOUND direction messages).

    Args:
        params: Message metadata needed to construct the state row and Candidate.

    Returns:
        Candidate with ig_dm_account_id set and ig_conversation_id populated.
        Returns None if INSERT was a no-op (duplicate state = same conversation
        received another message at the exact same sent_at millisecond, edge case).
    """
```

**SQL** (pseudocode):
```sql
INSERT INTO ig_dm_thread_state (
    user_id, ig_dm_account_id, ig_conversation_id,
    status, latest_internal_date, window_expires_at,
    triggered_by_mid, latest_ig_dm_message_id, created_at
)
VALUES (
    :user_id, :ig_dm_account_id, :ig_conversation_id,
    'READY_FOR_CAMPAIGN_ASSOCIATION',
    :sent_at,
    CASE WHEN :direction = 'INBOUND' THEN :sent_at + INTERVAL '24 hours' ELSE NULL END,
    :mid,
    :latest_ig_dm_message_id,
    NOW()
)
ON CONFLICT (user_id, ig_dm_account_id, ig_conversation_id, latest_internal_date)
DO NOTHING
RETURNING id;
```

**Candidate construction** (on success):
```python
Candidate(
    gmail_thread_id=params.ig_conversation_id,  # Legacy field reuse (SMTP precedent)
    ig_dm_account_id=params.ig_dm_account_id,
    ig_conversation_id=params.ig_conversation_id,
    user_id=params.user_id,
    state__id=new_state_id,  # ig_dm_thread_state.id from INSERT RETURNING
    state__latest_internal_date=sent_at,
    state__latest_gmail_message_id=params.latest_ig_dm_message_id,
    latest_gmail_message__direction=GmailMessageDirection.INBOUND,
    state__window_expires_at=sent_at + timedelta(hours=24),  # if direction == INBOUND
    # gmail_account_id and smtp_account_id are None
)
```

#### `ig_dm_get_all_active_accounts_activity`

```python
@activity.defn
def ig_dm_get_all_active_accounts_activity() -> list[uuid.UUID]:
    """List IDs of all active UserIgDmAccount rows.

    Used by IgDmReconciliationWorkflow to spawn per-account reconciliation runs.
    Parallel to get_all_active_gmail_emails_activity and get_all_active_smtp_emails_activity.

    Returns:
        List of user_ig_dm_account.id UUIDs where is_active=TRUE.
    """
```

**SQL**: `SELECT id FROM user_ig_dm_account WHERE is_active = TRUE ORDER BY created_at`

---

### 3.2 `apps/backend/src/temporal/activity/ig_dm_media_download_activity.py`

Contains activities for downloading ephemeral Meta CDN media URLs to durable Supabase Storage.

#### `ig_dm_media_download_activity`

```python
@activity.defn
def ig_dm_media_download_activity(
    params: IgDmMediaDownloadInput,
) -> IgDmMediaDownloadResult:
    """Download ephemeral Meta CDN media URLs to Supabase Storage.

    Meta CDN URLs in webhook payloads expire approximately 1 hour after delivery.
    This activity must run promptly after the webhook is received.

    For each URL in params.media_original_urls:
      1. HTTP GET the URL with the ig_dm_account's access_token as Bearer auth
         (Meta requires auth for private media URLs).
      2. Upload the raw bytes to Supabase Storage at the canonical path.
      3. Record the storage path in media_storage_paths.

    Storage path format:
        ig-dm/{ig_dm_account_id}/{ig_conversation_id}/{mid}/{index}
    Example:
        ig-dm/550e8400-e29b-41d4-a716-446655440000/17841400123/mid.xxx/0

    Args:
        params: IgDmMediaDownloadInput (account, message reference, URLs, conversation).

    Returns:
        IgDmMediaDownloadResult with:
          media_storage_paths: list of Supabase Storage object paths (permanent)
          failed_urls: list of URLs that failed (expired, network error)
    """
```

**Implementation notes** (no function body):
- Uses `httpx.AsyncClient` with `Bearer {access_token}` auth header for authenticated Meta CDN requests.
- `access_token` fetched from `user_ig_dm_account` by `ig_dm_account_id`.
- Supabase Storage bucket: `"ig-dm-media"` (new bucket, created as part of setup — see `spec-meta-oauth.md §Storage`).
- Upload via `supabase.storage.from_("ig-dm-media").upload(path, data)` using existing Supabase client pattern.
- URL expiry: if HTTP GET returns 403/410, add to `failed_urls`, continue to next URL (non-fatal).
- `media_storage_paths` positions correspond 1:1 with `media_original_urls` positions. Failed downloads leave `None` at their position (filtered out before returning).
- Returned `media_storage_paths` excludes `None` entries — list length may be < `len(media_original_urls)`.

---

### 3.3 `apps/backend/src/temporal/activity/ig_igsid_resolution_activity.py`

Contains activities for resolving an IGSID (opaque Meta user ID) to a human-readable `@username`.

#### `ig_igsid_resolution_activity`

```python
@activity.defn
def ig_igsid_resolution_activity(
    igsid: str,
    ig_dm_account_id: uuid.UUID,
) -> IgIdentityResult:
    """Resolve an IGSID to a username via cache then Graph API.

    Resolution strategy:
    1. Check ig_igsid_cache WHERE igsid = :igsid (O(1) PK lookup)
    2. If cache miss (or resolved_at > 7 days ago): call Graph API GET /{igsid}
       with the account's access_token; fields=name,username
    3. On success: upsert ig_igsid_cache (igsid, username, display_name)
    4. On Graph API failure (rate limit, invalid IGSID): return IgIdentityResult
       with username=None — caller logs warning and proceeds without username.

    Args:
        igsid: Instagram-Scoped ID, e.g. "17841400000123456".
        ig_dm_account_id: UUID of the account whose access_token to use for
                          the Graph API call.

    Returns:
        IgIdentityResult(igsid, username, display_name, resolved_from_cache).
    """
```

**Graph API call**: `GET https://graph.instagram.com/v22.0/{igsid}?fields=name,username&access_token={access_token}`

**Rate limit handling**:
- HTTP 429 / `{"error": {"code": 4}}` → raise `ApplicationError` with `non_retryable=False` (Temporal will retry with backoff).
- HTTP 400 with `{"error": {"code": 100}}` (invalid IGSID) → raise `ApplicationError("INVALID_IGSID", non_retryable=True)` — no retry.
- Retry policy on this activity: `maximum_attempts=5`, `initial_interval=timedelta(seconds=30)`, `backoff_coefficient=2.0`.

**Cache TTL**: Re-resolve if `resolved_at < NOW() - INTERVAL '7 days'`. Usernames can change on Instagram.

**`ig_igsid_cache` upsert SQL**:
```sql
INSERT INTO ig_igsid_cache (igsid, username, display_name, resolved_at, last_seen_at)
VALUES (:igsid, :username, :display_name, NOW(), NOW())
ON CONFLICT (igsid) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    resolved_at = NOW(),
    last_seen_at = NOW()
```

#### `ig_dm_update_sender_username_activity`

```python
@activity.defn
def ig_dm_update_sender_username_activity(
    ig_dm_message_id: uuid.UUID,
    sender_username: str,
) -> None:
    """Update ig_dm_message.sender_username after IGSID resolution.

    Called after ig_igsid_resolution_activity succeeds. Updates the message
    row that was stored with sender_username=NULL during ingest.

    Args:
        ig_dm_message_id: ig_dm_message.id to update.
        sender_username: Resolved @username (without the @ prefix).
    """
```

**SQL**: `UPDATE ig_dm_message SET sender_username = :username WHERE id = :id`

---

## 4. New Models (extending `ig_dm_ingest.py`)

**File**: `apps/backend/src/models/temporal/ig_dm_ingest.py`

Add the following model (not yet in `spec-pydantic-models.md`):

```python
class IgIsidResolutionInput(BaseModel):
    """Input to IgIsidResolutionWorkflow (launched from IgDmIngestWorkflow)."""
    sender_igsid: str
    # IGSID of the message sender to resolve
    ig_dm_account_id: uuid.UUID
    # Account whose access_token is used for Graph API call
    ig_dm_message_id: uuid.UUID
    # ig_dm_message.id — updated with resolved username after resolution
```

---

## 5. Modified: `ThreadProcessingCoordinatorWorkflow`

**File**: `apps/backend/src/temporal/workflow/thread_processing_coordinator_workflow.py`

### 5.1 New discriminator variable

Add after existing `is_smtp = candidate.smtp_account_id is not None` line:

```python
is_smtp  = candidate.smtp_account_id  is not None
is_ig_dm = candidate.ig_dm_account_id is not None  # NEW
```

### 5.2 Gmail-only steps gate

Modify the existing `if not is_smtp:` guard to also exclude IG DM:

```python
# BEFORE:
if not is_smtp:
    # Step 1: ensure_complete_thread_ingested_activity
    # Step 2: ThreadAttachmentExtractWorkflow

# AFTER:
if not is_smtp and not is_ig_dm:
    # Step 1: ensure_complete_thread_ingested_activity (Gmail only — polls Gmail API)
    # Step 2: ThreadAttachmentExtractWorkflow (Gmail only — email attachments)
```

**Why IG DM skips both**:
- `ensure_complete_thread_ingested_activity` calls the Gmail API to download full thread content. IG DM has no Gmail API; messages arrive complete from webhook.
- `ThreadAttachmentExtractWorkflow` extracts text from email attachments (PDF, DOCX). IG DM has no email attachments; media is downloaded in `ig_dm_media_download_activity` during ingest.

### 5.3 Gmail-specific campaign workflows gate

Modify the `if maybe_campaign__id is not None and not is_smtp:` block:

```python
# BEFORE:
if maybe_campaign__id is not None and not is_smtp:
    execute_campaign_workflows_activity(...)
    extract_campaign_creator_activity(...)
    ...

# AFTER:
if maybe_campaign__id is not None and not is_smtp and not is_ig_dm:
    execute_campaign_workflows_activity(...)   # Gmail outbox/follow-up triggers
    extract_campaign_creator_activity(...)     # Scrape creator profile from email sig
    ...
```

**Why IG DM skips**: `execute_campaign_workflows_activity` triggers Gmail-specific outbox/follow-up flows. `extract_campaign_creator_activity` scrapes email signature for creator metadata — not applicable for DMs.

### 5.4 INBOUND direction: IG DM-specific branches

Within the `if candidate.latest_gmail_message__direction == INBOUND:` block:

```python
if has_campaign:
    cancel_follow_ups_on_reply_activity(...)  # Skip for IG DM (no email follow-ups)
    # ... existing logic ...

# NEW: 24h window check for IG DM
if is_ig_dm and has_campaign and status == READY_FOR_RESPONSE_DRAFT:
    if candidate.state__window_expires_at is None or \
       candidate.state__window_expires_at <= datetime.now(tz=timezone.utc):
        # 24h window is already closed (unusual — inbound message should open window)
        # Log warning; still generate draft (window may still open if creator replies)
        log.warning("ig_dm_window_expired_on_inbound", ig_conversation_id=candidate.ig_conversation_id)
```

**Why window check on inbound**: In theory, any inbound message opens a new 24h window. However, reconciliation-sourced messages (from Graph API polling) may be old. If `window_expires_at` is already past, still generate draft but log for alerting.

### 5.5 INBOUND direction: `check_domain_and_classify_activity` skip

```python
# BEFORE (runs for all channels):
if status == READY_FOR_RESPONSE_DRAFT:
    domain_behavior = check_domain_and_classify_activity(candidate)
    # → "opt_out" | "asked_questions" | "opt_in" | None

# AFTER:
if status == READY_FOR_RESPONSE_DRAFT:
    if not is_ig_dm:
        domain_behavior = check_domain_and_classify_activity(candidate)
        # Gmail/SMTP only: detects unsubscribe emails, opt-in confirmations in
        # email domain behavior. Not applicable to Instagram DMs.
    else:
        domain_behavior = None  # IG DM: always use normal automation flow
```

### 5.6 INBOUND direction: draft generation and send path

The `ThreadResponseDraftWorkflow` is shared across channels (Gmail, SMTP, IG DM) but with channel-specific branches inside. The coordinator's call is unchanged:

```python
await workflow.execute_child_workflow(
    ThreadResponseDraftWorkflow.run,
    candidate,
    id=f"thread-response-draft-{candidate.state__id}",
    id_reuse_policy=ALLOW_DUPLICATE_FAILED_ONLY,
)
```

Inside `ThreadResponseDraftWorkflow`, the IG DM branch is detected via `candidate.ig_dm_account_id is not None`:
- **Skip** `upload_llm_draft_to_gmail_activity` (no Gmail draft API for DMs)
- **Use** `ig_dm_save_draft_to_db_activity` instead of `write_llm_draft_to_db_activity` (writes to `ig_dm_llm_draft` table)
- **Use** `generate_draft_using_llm_activity` (same as SMTP — no RAG for IG DM in initial implementation; RAG added in a later phase when `ig_dm_reply_examples` is populated)

Status after draft generation: `WAITING_FOR_DRAFT_REVIEW` (same as SMTP semi-automated flow).

**No auto-send for IG DM in Phase 1-3**: The `auto_send_response_activity` and `send_gmail_draft_activity` calls are gated by `if not is_ig_dm:`. IG DM replies always require human approval via the context engine (`cheerful_approve_ig_dm_draft` tool).

### 5.7 OUTBOUND direction: IG DM skip list

The OUTBOUND coordinator path handles echoes that erroneously trigger coordinator (they shouldn't, per the echo gate in `IgDmIngestWorkflow`, but defensive coding is warranted):

```python
elif candidate.latest_gmail_message__direction == OUTBOUND:
    if has_campaign:
        if not is_ig_dm:
            ingest_sent_reply_as_example_activity(...)  # Gmail/SMTP RAG ingestion only
        is_thread_done = check_if_thread_is_done_activity(candidate)
        ...
```

### 5.8 `update_state_status_activity` dispatch extension

**File**: `apps/backend/src/temporal/activity/gmail_thread_state.py`

The existing `update_state_status_activity` dispatches on `smtp_account_id`:
```python
# BEFORE:
def update_state_status_activity(params: UpdateStateStatusParams) -> None:
    if params.smtp_account_id is not None:
        SmtpThreadStateRepository(...).update_status(...)
    else:
        GmailThreadStateRepository(...).update_status(...)

# AFTER:
def update_state_status_activity(params: UpdateStateStatusParams) -> None:
    if params.ig_dm_account_id is not None:
        IgDmThreadStateRepository(...).update_status(...)
    elif params.smtp_account_id is not None:
        SmtpThreadStateRepository(...).update_status(...)
    else:
        GmailThreadStateRepository(...).update_status(...)
```

**`IgDmThreadStateRepository.update_status` behavior**:
- Appends a new `ig_dm_thread_state` row with `status=params.status` (append-only, matching Gmail/SMTP pattern)
- Uses `ig_conversation_id` from the existing state row (looked up by `state__id`)

**`check_is_latest_for_thread_state_activity` extension** (same file):
```python
def check_is_latest_for_thread_state_activity(candidate: Candidate) -> bool:
    # BEFORE: dispatches on smtp_account_id
    # AFTER: also dispatches on ig_dm_account_id

    if candidate.ig_dm_account_id is not None:
        # Check: is candidate.state__id the max-id state for this conversation?
        # SELECT COUNT(1) FROM ig_dm_thread_state
        # WHERE ig_dm_account_id = :account_id
        # AND ig_conversation_id = :conversation_id
        # AND latest_internal_date > :candidate_date
        # Returns True only if count == 0 (no newer state exists)
        ...
```

---

## 6. Search Attributes Extension

**File**: `apps/backend/src/temporal/search_attributes.py`

### New keys

```python
IG_DM_ACCOUNT_ID_KEY = SearchAttributeKey.for_keyword("IgDmAccountId")
IG_CONVERSATION_ID_KEY = SearchAttributeKey.for_keyword("IgConversationId")
```

### New helper function

```python
def build_search_attributes_for_ig_dm_candidate(candidate: Candidate) -> TypedSearchAttributes:
    """Build Temporal search attributes for an IG DM candidate.

    Parallel to build_search_attributes_for_candidate() (Gmail/SMTP).
    Enables querying: 'IgConversationId = "17841400..."' in Temporal UI.

    Args:
        candidate: Candidate with ig_dm_account_id and ig_conversation_id set.

    Returns:
        TypedSearchAttributes with IG_DM_ACCOUNT_ID_KEY, IG_CONVERSATION_ID_KEY set.
    """
```

---

## 7. Worker Registration

### `apps/backend/src/temporal/workflow/__init__.py`

Add to `__all__`:
```python
from .ig_dm_ingest_workflow import IgDmIngestWorkflow
from .ig_igsid_resolution_workflow import IgIsidResolutionWorkflow
```

### `apps/backend/src/temporal/activity/__init__.py`

Add to `__all__`:
```python
from .ig_dm_ingest_activity import (
    ig_dm_dedup_check_activity,
    ig_dm_store_message_activity,
    batch_insert_ig_dm_state_and_get_candidate_activity,
    ig_dm_get_all_active_accounts_activity,
)
from .ig_dm_media_download_activity import ig_dm_media_download_activity
from .ig_igsid_resolution_activity import (
    ig_igsid_resolution_activity,
    ig_dm_update_sender_username_activity,
)
```

---

## 8. Error Handling Matrix

| Scenario | Behavior | State |
|----------|----------|-------|
| `mid` already in `ig_dm_message` (dedup check) | Return `was_duplicate=True`, exit early | No side effects |
| Media URL expired (HTTP 403/410) | Add to `failed_urls`, continue with empty `media_storage_paths` | Message stored without media |
| `ig_dm_store_message_activity` race condition ON CONFLICT | Return `was_duplicate=True` (pre-existing `id`), exit early | No state created |
| `batch_insert_ig_dm_state_and_get_candidate_activity` ON CONFLICT | Return `None` candidate; skip coordinator spawn | Thread already processing |
| `ig_igsid_resolution_activity` rate limit (429) | Retry up to 5x with exponential backoff (30s, 60s, 120s, 240s, 480s) | `sender_username` stays NULL until resolved |
| `ig_igsid_resolution_activity` invalid IGSID (400) | Non-retryable fail; log error | `sender_username` stays NULL permanently |
| Coordinator spawn fails | Log error; message and state are already stored; manual reprocessing possible | Message/state stored, processing incomplete |
| Echo with `is_echo=True` | Steps 4-6 skipped; only message stored | No state created, no coordinator spawned |

---

## 9. Logging

All log events use `structlog` (`workflow.logger` inside Temporal workflow, `activity.logger` or `structlog.get_logger()` inside activities).

| Event key | Level | Fields | Location |
|-----------|-------|--------|----------|
| `ig_dm_ingest_duplicate` | `info` | `mid`, `ig_conversation_id` | Step 1 early exit |
| `ig_dm_media_download_failed` | `warning` | `mid`, `url`, `error` | Media download failure |
| `ig_dm_media_download_expired` | `warning` | `mid`, `url`, `status_code` | Expired CDN URL |
| `ig_dm_message_stored` | `info` | `mid`, `ig_conversation_id`, `direction`, `has_media` | Step 3 success |
| `ig_dm_echo_stored_skip_processing` | `debug` | `mid`, `ig_conversation_id` | Echo gate |
| `ig_dm_state_inserted` | `info` | `ig_conversation_id`, `state_id`, `window_expires_at` | Step 4 success |
| `ig_dm_state_already_exists` | `debug` | `ig_conversation_id` | Step 4 no-op |
| `ig_dm_igsid_resolved` | `info` | `igsid`, `username`, `resolved_from_cache` | Resolution success |
| `ig_dm_igsid_resolution_failed` | `warning` | `igsid`, `error` | Resolution failure |
| `ig_dm_coordinator_spawned` | `info` | `ig_conversation_id`, `state_id` | Step 6 |
| `ig_dm_coordinator_skip_no_candidate` | `debug` | `ig_conversation_id` | Step 6 no-op |

---

## 10. Cross-References

| Topic | Reference |
|-------|-----------|
| Webhook dispatch trigger | `analysis/spec/webhook-handler.md §3.3 _dispatch_ig_dm_events` |
| `IgDmIngestInput` fields | `analysis/spec/pydantic-models.md §10 IgDmIngestInput` |
| `IgDmIngestStoreInput`, `IgDmMediaDownloadInput` | `analysis/spec/pydantic-models.md §10 Additional models` |
| `IgDmStateCandidateInput`, `IgIdentityResult` | `analysis/spec/pydantic-models.md §10 Additional models` |
| `ig_dm_message` table schema | `analysis/spec/db-migrations.md §Section 3` |
| `ig_dm_thread_state` table schema | `analysis/spec/db-migrations.md §Section 5` |
| `ig_igsid_cache` table schema | `analysis/spec/db-migrations.md §Section 4` |
| IGSID→creator matching (campaign resolution) | `analysis/spec/creator-resolution.md` (next aspect) |
| Send reply workflow (24h window) | `analysis/spec/send-reply.md` |
| Draft generation path (IG DM branch) | `analysis/spec/ai-drafting.md` |
| Coordinator full branching logic | `analysis/audit/temporal-workflows.md §ThreadProcessingCoordinatorWorkflow` |
| Activity registration pattern | `analysis/audit/temporal-workflows.md §Worker Registration Pattern` |
| Temporal interfaces overview | `analysis/spec/temporal-interfaces.md` |
