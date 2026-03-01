# Spec: Temporal Workflow & Activity Interfaces — Instagram DM Support

**Aspect**: `spec-temporal-interfaces`
**Wave**: 2 — Schema & Interface Design
**Date**: 2026-03-01
**Input files**:
- `analysis/audit/temporal-workflows.md` — exact current workflow inventory, coordinator logic, activity signatures
- `analysis/spec/db-migrations.md` — new tables and columns
- `analysis/spec/pydantic-models.md` — Candidate, UpdateStateStatusParams, IgDmIngestInput, IgDmSendReplyInput
- `../cheerful-ig-dm-reverse/analysis/option-direct-meta-api.md` — webhook-first ingest design
- `../cheerful-ig-dm-reverse/analysis/option-parallel-tables.md` — coordinator branching design

---

## Files

### New Files

| Action | Path |
|--------|------|
| CREATE | `apps/backend/src/temporal/workflow/ig_dm_ingest_workflow.py` |
| CREATE | `apps/backend/src/temporal/workflow/ig_dm_send_reply_workflow.py` |
| CREATE | `apps/backend/src/temporal/workflow/ig_dm_reconciliation_workflow.py` |
| CREATE | `apps/backend/src/temporal/workflow/ig_dm_initial_sync_workflow.py` |
| CREATE | `apps/backend/src/temporal/workflow/ig_dm_token_refresh_workflow.py` |
| CREATE | `apps/backend/src/temporal/activity/ig_dm_ingest_activity.py` |
| CREATE | `apps/backend/src/temporal/activity/ig_dm_media_download_activity.py` |
| CREATE | `apps/backend/src/temporal/activity/ig_dm_thread_state_activity.py` |
| CREATE | `apps/backend/src/temporal/activity/ig_igsid_resolution_activity.py` |
| CREATE | `apps/backend/src/temporal/activity/ig_dm_send_reply_activity.py` |
| CREATE | `apps/backend/src/temporal/activity/ig_dm_draft_activity.py` |
| CREATE | `apps/backend/src/temporal/activity/ig_dm_account_activity.py` |
| CREATE | `apps/backend/src/models/temporal/ig_dm_send_reply.py` |

### Modified Files

| Action | Path | What Changes |
|--------|------|-------------|
| MODIFY | `apps/backend/src/temporal/workflow/__init__.py` | Add 5 new IG DM workflows to `__all__` |
| MODIFY | `apps/backend/src/temporal/activity/__init__.py` | Add ~10 new IG DM activities to `__all__` |
| MODIFY | `apps/backend/src/temporal/workflow/thread_processing_coordinator_workflow.py` | Add `is_ig_dm` branch, 24h window check, IG DM-specific draft/send path |
| MODIFY | `apps/backend/src/temporal/workflow/thread_response_draft_workflow.py` | Add IG DM branch: `ig_dm_generate_draft_activity` + `ig_dm_save_draft_to_db_activity` instead of Gmail upload |
| MODIFY | `apps/backend/src/temporal/activity/gmail_thread_state.py` | Extend `update_state_status_activity` and `check_is_latest_for_thread_state_activity` for IG DM dispatch |
| MODIFY | `apps/backend/src/temporal/activity/gmail_thread_llm_draft.py` | Extend `maybe_get_draft_by_thread_state_id_activity` and `maybe_get_draft_by_thread_id_activity` for IG DM |
| MODIFY | `apps/backend/src/temporal/search_attributes.py` | Add `IG_DM_ACCOUNT_ID_KEY`, `IG_CONVERSATION_ID_KEY`, `build_search_attributes_for_ig_dm_candidate()` |
| MODIFY | `apps/backend/src/models/temporal/ig_dm_ingest.py` | Add `IgDmSendReplyResult`, `IgDmInitialSyncInput`, `IgDmTokenRefreshInput` |

---

## Design Principles

### Ingest Trigger: Webhook (not Perpetual Poll)

IG DM is **event-driven**, not poll-driven. The ingest trigger chain is:

```
Meta POST → /webhooks/instagram/
    → FastAPI handler (immediate 200)
    → BackgroundTask: enqueue_ig_dm_events()
    → temporal_client.start_workflow(IgDmIngestWorkflow, ...)
    → IgDmIngestWorkflow (short-lived, per message)
        → insert ig_dm_message
        → insert ig_dm_thread_state
        → spawn ThreadProcessingCoordinatorWorkflow
```

This contrasts with Gmail (`AllPollHistoryWorkflow` looping via `continue_as_new`) and SMTP (`AllSmtpInboxSyncWorkflow` with periodic `BatchSmtpInboxSyncWorkflow` spawns).

### Idempotency Strategy

| Workflow | Idempotency Key | Guard |
|----------|----------------|-------|
| `IgDmIngestWorkflow` | `mid` (Meta message ID) | `UNIQUE (ig_dm_account_id, mid)` + `ON CONFLICT DO NOTHING`; also checked in `ig_dm_ingest_activity` — returns `was_duplicate=True` if already stored |
| `IgDmSendReplyWorkflow` | `ig_dm_thread_state_id` | Workflow ID = `ig-dm-send-reply-{state_id}`; `ALLOW_DUPLICATE_FAILED_ONLY` policy |
| `IgDmReconciliationWorkflow` | account ID + timestamp window | Cron-scheduled; per-account workflow ID ensures single instance |
| `IgDmInitialSyncWorkflow` | `ig_dm_account_id` | Single-run on connect; gated by `initial_sync_completed` flag |
| `IgDmTokenRefreshWorkflow` | `ig_dm_account_id` | Cron-scheduled; single instance per account |

### Task Queue

All new IG DM workflows and activities run on `TEMPORAL_TASK_QUEUE = "main"` (same as existing Gmail/SMTP). No new task queue needed.

### Coordinator Branch Pattern

IG DM follows the established SMTP branching pattern:

```python
# Current (2 channels):
is_smtp = candidate.smtp_account_id is not None
if not is_smtp:   # Gmail-only steps
    ...

# After IG DM (3 channels):
is_smtp   = candidate.smtp_account_id  is not None
is_ig_dm  = candidate.ig_dm_account_id is not None
if not is_smtp and not is_ig_dm:   # Gmail-only steps
    ...
```

---

## Additional Input/Output Models

These extend `apps/backend/src/models/temporal/ig_dm_ingest.py` (partially defined in `spec-pydantic-models.md`).

### `IgDmSendReplyResult`

**File**: `apps/backend/src/models/temporal/ig_dm_send_reply.py` (new file, kept separate to avoid import cycles)

```python
"""Output models for IgDmSendReplyWorkflow."""

import uuid
from pydantic import BaseModel


class IgDmSendReplyResult(BaseModel):
    """Output from IgDmSendReplyWorkflow."""
    sent_mid: str
    # MID returned by Meta API (used to store the outbound ig_dm_message)
    stored_ig_dm_message_id: uuid.UUID
    # ig_dm_message.id of the stored outbound message
    window_was_active: bool
    # True if the 24h window was open at send time
```

### Additional models appended to `ig_dm_ingest.py`

```python
class IgDmInitialSyncInput(BaseModel):
    """Input to IgDmInitialSyncWorkflow (one-time on account connect)."""
    ig_dm_account_id: uuid.UUID
    user_id: uuid.UUID
    max_conversations: int = 100
    # Limit initial sync scope to avoid overwhelming the system on first connect


class IgDmTokenRefreshInput(BaseModel):
    """Input to IgDmTokenRefreshWorkflow (cron-scheduled)."""
    ig_dm_account_id: uuid.UUID | None = None
    # None = refresh ALL accounts expiring within days_before_expiry
    days_before_expiry: int = 7
    # Refresh tokens expiring within this many days


class IgDmMediaDownloadInput(BaseModel):
    """Input to ig_dm_media_download_activity."""
    ig_dm_account_id: uuid.UUID
    ig_dm_message_id: uuid.UUID
    # ig_dm_message.id (for storage path construction and DB update)
    media_original_urls: list[str]
    # Ephemeral Meta CDN URLs to download (~1 hour TTL)
    ig_conversation_id: str
    # Used to construct Supabase Storage path: ig-dm/{account_id}/{conversation_id}/{mid}/


class IgDmMediaDownloadResult(BaseModel):
    """Output from ig_dm_media_download_activity."""
    media_storage_paths: list[str]
    # Supabase Storage object paths for each downloaded file
    failed_urls: list[str]
    # URLs that failed to download (expired, network error)


class IgDmIngestStoreInput(BaseModel):
    """Input to ig_dm_store_message_activity (step 2 of ingest, after dedup check)."""
    ig_dm_account_id: uuid.UUID
    user_id: uuid.UUID
    mid: str
    ig_conversation_id: str
    sender_igsid: str
    recipient_igsid: str
    direction: str
    # 'INBOUND' | 'OUTBOUND'
    is_echo: bool
    body_text: str | None
    message_type: str
    # IgDmMessageType value
    sent_at_ms: int
    # Unix milliseconds from Meta webhook timestamp
    reply_to_mid: str | None
    media_storage_paths: list[str] | None
    # Populated after ig_dm_media_download_activity completes; None if no media
    media_original_urls: list[str] | None


class IgDmIngestStoreResult(BaseModel):
    """Output from ig_dm_store_message_activity."""
    ig_dm_message_id: uuid.UUID
    # ig_dm_message.id of the stored (or previously-stored) message
    was_duplicate: bool
    # True if mid already existed (ON CONFLICT DO NOTHING triggered; all downstream skipped)


class IgDmStateCandidateInput(BaseModel):
    """Input to batch_insert_ig_dm_state_and_get_candidate_activity."""
    ig_dm_account_id: uuid.UUID
    user_id: uuid.UUID
    ig_conversation_id: str
    latest_ig_dm_message_id: uuid.UUID
    latest_message_sent_at_ms: int
    # Unix milliseconds for latest_internal_date
    direction: str
    # 'INBOUND' | 'OUTBOUND' — determines whether window_expires_at is set
    triggered_by_mid: str


class IgDmListConversationsInput(BaseModel):
    """Input to ig_dm_list_conversations_activity (reconciliation polling)."""
    ig_dm_account_id: uuid.UUID
    user_id: uuid.UUID
    cursor: str | None = None
    # Graph API pagination cursor; None = start from most recent
    max_conversations: int = 50
    lookback_hours: int = 2
    # Only return conversations updated within this window
```

---

## New Workflows

### 1. `IgDmIngestWorkflow`

**File**: `apps/backend/src/temporal/workflow/ig_dm_ingest_workflow.py`
**Purpose**: Process a single inbound or outbound DM event from Meta's webhook.
**Trigger**: `BackgroundTask` in webhook POST handler → `temporal_client.start_workflow()`
**Duration**: Short-lived (seconds to minutes).

```python
import uuid
from datetime import timedelta
from temporalio import workflow
from temporalio.common import RetryPolicy

from src.models.temporal.ig_dm_ingest import IgDmIngestInput, IgDmIngestResult


@workflow.defn
class IgDmIngestWorkflow:
    @workflow.run
    async def run(self, params: IgDmIngestInput) -> IgDmIngestResult: ...
```

**Workflow ID**: `ig-dm-ingest-{mid}`
**ID Reuse Policy**: `ALLOW_DUPLICATE_FAILED_ONLY` — prevents reprocessing already-stored messages.
**Execution Timeout**: `timedelta(minutes=10)`

**Step-by-step flow**:

```
Step 1: Dedup check
    ig_dm_dedup_check_activity(ig_dm_account_id, mid) → bool
    # Queries SELECT 1 FROM ig_dm_message WHERE ig_dm_account_id = ? AND mid = ?
    # If True: return IgDmIngestResult(was_duplicate=True, ...)
    # If False: continue

Step 2: Media download (if params.media_original_urls is not None)
    ig_dm_media_download_activity(IgDmMediaDownloadInput) → IgDmMediaDownloadResult
    # Downloads each ephemeral Meta CDN URL to Supabase Storage
    # Timeout: 60s per file. Retry: 3. Do NOT wait for retry if URL is expired (fail fast).
    # Storage path format: ig-dm/{ig_dm_account_id}/{ig_conversation_id}/{mid}/{index}

Step 3: Store message
    ig_dm_store_message_activity(IgDmIngestStoreInput) → IgDmIngestStoreResult
    # INSERT INTO ig_dm_message ON CONFLICT (ig_dm_account_id, mid) DO NOTHING
    # Returns was_duplicate=True if INSERT was a no-op (race condition dedup)
    # If was_duplicate: return IgDmIngestResult(was_duplicate=True, ...)

Step 4: Upsert thread state
    batch_insert_ig_dm_state_and_get_candidate_activity(IgDmStateCandidateInput) → Candidate | None
    # INSERT INTO ig_dm_thread_state (status=READY_FOR_CAMPAIGN_ASSOCIATION, window_expires_at=sent_at+24h for INBOUND)
    # Returns Candidate with ig_dm_account_id set; None if no-op (duplicate state)

Step 5: IGSID resolution (fire-and-forget child, if direction == INBOUND)
    workflow.start_child_workflow(
        IgIsidResolutionWorkflow.run,   # wrapper workflow for retry isolation
        IgIsidResolutionInput(sender_igsid, ig_dm_account_id, ig_dm_message_id),
        id=f"igsid-resolve-{sender_igsid}",
        id_reuse_policy=ALLOW_DUPLICATE_FAILED_ONLY,
        parent_close_policy=ABANDON,
    )
    # Non-blocking: IGSID resolution may take time due to Graph API rate limits

Step 6: Spawn coordinator (if candidate is not None)
    workflow.start_child_workflow(
        ThreadProcessingCoordinatorWorkflow.run,
        candidate,
        id=f"ig-dm-coordinator-{candidate.state__id}",
        id_reuse_policy=ALLOW_DUPLICATE_FAILED_ONLY,
        parent_close_policy=ABANDON,
    )

Return: IgDmIngestResult(ig_dm_message_id, ig_conversation_id, was_duplicate=False)
```

**Notes**:
- Echo messages (`is_echo=True`) are stored but do NOT trigger coordinator or IGSID resolution.
- Echo messages represent outbound DMs sent by the IG Business Account (webhook echoes our own sends back to us). Store them for conversation completeness but do not re-process.
- Media download failure is non-fatal: store `media_storage_paths=[]` and `media_original_urls` (original ephemeral URLs for debugging). Log a warning.

---

### 2. `IgDmSendReplyWorkflow`

**File**: `apps/backend/src/temporal/workflow/ig_dm_send_reply_workflow.py`
**Purpose**: Send a DM reply via Meta API with 24h window enforcement.
**Trigger**: `POST /api/ig-dm/threads/{id}/reply` → route handler → `temporal_client.execute_workflow()`
**Duration**: Short-lived (seconds).

```python
from temporalio import workflow

from src.models.temporal.ig_dm_ingest import IgDmSendReplyInput
from src.models.temporal.ig_dm_send_reply import IgDmSendReplyResult


@workflow.defn
class IgDmSendReplyWorkflow:
    @workflow.run
    async def run(self, params: IgDmSendReplyInput) -> IgDmSendReplyResult: ...
```

**Workflow ID**: `ig-dm-send-reply-{ig_dm_thread_state_id}`
**ID Reuse Policy**: `ALLOW_DUPLICATE_FAILED_ONLY` — each reply attempt is scoped to a specific thread state.
**Execution Timeout**: `timedelta(minutes=5)`

**Step-by-step flow**:

```
Step 1: Window check
    ig_dm_check_reply_window_activity(ig_dm_account_id, ig_conversation_id) → datetime | None
    # SELECT window_expires_at FROM ig_dm_thread_state WHERE ...
    # ORDER BY latest_internal_date DESC LIMIT 1
    # Returns None if window is closed (NULL or expired)
    # If window expired: raise ApplicationError("WINDOW_EXPIRED") → route returns 409

Step 2: Send via Meta API
    ig_dm_send_reply_activity(IgDmSendReplyActivityInput) → str
    # Returns sent_mid from Meta API response
    # POST /{ig_business_account_id}/messages
    # Timeout: 30s. Retry: 3 (exponential backoff 1s, 2s, 4s).
    # On Meta 400 (invalid recipient): raise non-retryable ApplicationError

Step 3: Store outbound message (echo)
    ig_dm_store_message_activity(IgDmIngestStoreInput) → IgDmIngestStoreResult
    # Store the outbound message with direction=OUTBOUND, is_echo=False
    # (This is the authoritative outbound record; Meta may also echo it via webhook)

Step 4: Update thread state
    update_state_status_activity(UpdateStateStatusParams(
        state__id=params.ig_dm_thread_state_id,
        status=GmailThreadStatus.WAITING_FOR_INBOUND,
        ig_dm_account_id=params.ig_dm_account_id,
    ))
    # Marks thread as waiting for creator's next reply

Return: IgDmSendReplyResult(
    sent_mid=sent_mid,
    stored_ig_dm_message_id=store_result.ig_dm_message_id,
    window_was_active=True,
)
```

**24h window notes**:
- Instagram's 24h messaging window opens when a creator sends a DM. The brand can reply within 24h.
- After 24h of creator silence, the window closes and the brand cannot send a DM (Meta API returns error).
- The route handler checks the window before starting the workflow (fast rejection). The workflow re-checks in Step 1 (guard against race conditions between check and actual send).
- If `window_expires_at` is `NULL` for an OUTBOUND-direction state (we sent last, waiting for them), the window is closed.

---

### 3. `IgDmReconciliationWorkflow`

**File**: `apps/backend/src/temporal/workflow/ig_dm_reconciliation_workflow.py`
**Purpose**: Cron-based polling recovery for missed webhook events.
**Trigger**: Temporal Schedule (cron), every 30 minutes.

```python
from temporalio import workflow

from src.models.temporal.ig_dm_ingest import IgDmReconciliationInput


@workflow.defn
class IgDmReconciliationWorkflow:
    @workflow.run
    async def run(self, params: IgDmReconciliationInput) -> IgDmReconciliationResult: ...
```

**Temporal Schedule**: `cron_string="*/30 * * * *"` (every 30 minutes)
**Workflow ID** (for schedule): `ig-dm-reconciliation-{ig_dm_account_id}`
**Execution Timeout**: `timedelta(minutes=25)` (must complete before next cron fires)

**Input**: `IgDmReconciliationInput` (from `spec-pydantic-models.md`):
```python
class IgDmReconciliationInput(BaseModel):
    ig_dm_account_id: uuid.UUID
    user_id: uuid.UUID
    lookback_hours: int = 2
```

**Output**:
```python
class IgDmReconciliationResult(BaseModel):
    conversations_checked: int
    missed_messages_ingested: int
    # Count of messages found via Graph API but not in ig_dm_message table
```

**Step-by-step flow**:

```
Step 1: List recent conversations via Graph API
    ig_dm_list_conversations_activity(IgDmListConversationsInput) → list[IgConversationSummary]
    # GET /{ig_business_account_id}/conversations?platform=instagram&fields=id,updated_time,participants
    # Filter: updated_time >= now() - lookback_hours
    # Uses last_sync_cursor from user_ig_dm_account for pagination

Step 2: For each conversation, check latest stored message
    ig_dm_get_latest_stored_message_activity(ig_dm_account_id, ig_conversation_id) → datetime | None
    # SELECT MAX(sent_at) FROM ig_dm_message WHERE ...

Step 3: If Graph API shows newer messages, fetch them
    ig_dm_fetch_conversation_messages_activity(ig_dm_account_id, ig_conversation_id, since) → list[IgRawMessage]
    # GET /{ig_conversation_id}/messages?fields=id,message,from,created_time,attachments

Step 4: For each missed message, trigger ingest
    workflow.start_child_workflow(
        IgDmIngestWorkflow.run,
        IgDmIngestInput(...),
        id=f"ig-dm-ingest-{mid}",
        id_reuse_policy=ALLOW_DUPLICATE_FAILED_ONLY,
        parent_close_policy=ABANDON,
    )

Step 5: Update cursor
    ig_dm_update_sync_cursor_activity(ig_dm_account_id, new_cursor)
    # UPDATE user_ig_dm_account SET last_sync_cursor = ? WHERE id = ?
```

**Notes**:
- This workflow is per-account. A separate scheduler (see `IgDmTokenRefreshWorkflow` pattern) spawns one per active account.
- Graph API quota: 200 calls/hour (Standard Access). Each reconciliation run uses ~2-3 calls per account. At 30-minute intervals, 2 runs/hour × 3 calls = 6 calls/account/hour — well within budget.
- Media in reconciliation-sourced messages follows the same `ig_dm_media_download_activity` path.

---

### 4. `IgDmInitialSyncWorkflow`

**File**: `apps/backend/src/temporal/workflow/ig_dm_initial_sync_workflow.py`
**Purpose**: One-time conversation history import when a user connects a new IG account.
**Trigger**: `POST /api/v1/ig-dm-accounts` route handler after OAuth token exchange completes.

```python
from temporalio import workflow

from src.models.temporal.ig_dm_ingest import IgDmInitialSyncInput


@workflow.defn
class IgDmInitialSyncWorkflow:
    @workflow.run
    async def run(self, params: IgDmInitialSyncInput) -> IgDmInitialSyncResult: ...
```

**Output**:
```python
class IgDmInitialSyncResult(BaseModel):
    conversations_imported: int
    messages_imported: int
    errors: list[str]
```

**Workflow ID**: `ig-dm-initial-sync-{ig_dm_account_id}`
**ID Reuse Policy**: `REJECT_DUPLICATE` — only one initial sync per account.
**Execution Timeout**: `timedelta(hours=2)`

**Step-by-step flow**:

```
Step 1: Fetch conversation list (paginated)
    ig_dm_list_conversations_activity(IgDmListConversationsInput(
        ig_dm_account_id=params.ig_dm_account_id,
        cursor=None,  # start from most recent
        max_conversations=params.max_conversations,
        lookback_hours=24 * 30,  # 30 days lookback for initial sync
    )) → list[IgConversationSummary]

Step 2: For each conversation (sequential, rate-limit-aware)
    a. ig_dm_fetch_conversation_messages_activity(ig_dm_account_id, ig_conversation_id, since=None)
       → list[IgRawMessage] (newest first)
    b. For each message: start_child_workflow(IgDmIngestWorkflow, ..., parent_close_policy=ABANDON)
    c. workflow.sleep(timedelta(seconds=0.5))  # 200-call/hr rate limit spread

Step 3: Mark sync complete
    ig_dm_mark_initial_sync_complete_activity(ig_dm_account_id)
    # UPDATE user_ig_dm_account SET initial_sync_completed = TRUE WHERE id = ?

Return: IgDmInitialSyncResult(...)
```

**Notes**:
- Sequential processing (not concurrent) to respect the 200 calls/hour Graph API rate limit.
- `max_conversations=100` default limits scope to prevent overwhelming first-time users.
- If the workflow fails midway, it can be retried. `IgDmIngestWorkflow`'s `ALLOW_DUPLICATE_FAILED_ONLY` policy prevents re-processing already-stored messages.

---

### 5. `IgDmTokenRefreshWorkflow`

**File**: `apps/backend/src/temporal/workflow/ig_dm_token_refresh_workflow.py`
**Purpose**: Refresh Meta access tokens before 60-day expiry.
**Trigger**: Temporal Schedule (cron), daily at 02:00 UTC.

```python
from temporalio import workflow

from src.models.temporal.ig_dm_ingest import IgDmTokenRefreshInput


@workflow.defn
class IgDmTokenRefreshWorkflow:
    @workflow.run
    async def run(self, params: IgDmTokenRefreshInput) -> IgDmTokenRefreshResult: ...
```

**Output**:
```python
class IgDmTokenRefreshResult(BaseModel):
    accounts_checked: int
    accounts_refreshed: int
    accounts_failed: list[uuid.UUID]
```

**Temporal Schedule**: `cron_string="0 2 * * *"` (daily at 02:00 UTC)
**Workflow ID** (for schedule): `ig-dm-token-refresh-daily`
**Execution Timeout**: `timedelta(hours=1)`

**Step-by-step flow**:

```
Step 1: Find accounts needing refresh
    ig_dm_get_expiring_accounts_activity(days_before_expiry=7) → list[uuid.UUID]
    # SELECT id FROM user_ig_dm_account
    # WHERE is_active = TRUE
    # AND access_token_expires_at < NOW() + INTERVAL '7 days'

Step 2: For each expiring account (parallel, asyncio.gather)
    ig_dm_refresh_token_activity(ig_dm_account_id) → bool
    # GET /oauth/access_token?grant_type=fb_exchange_token&...
    # UPDATE user_ig_dm_account SET access_token=?, access_token_expires_at=?
    # Timeout: 30s. Retry: 3 (exponential backoff).
    # On failure: UPDATE user_ig_dm_account SET verification_error=?, is_active=FALSE

Return: IgDmTokenRefreshResult(...)
```

**Notes**:
- Meta long-lived page tokens have a 60-day expiry. Refresh with at least 7 days remaining.
- Token refresh uses the `GET /oauth/access_token?grant_type=fb_exchange_token` endpoint with the current long-lived token.
- On failure, the account is marked `is_active=FALSE` to prevent attempting to receive webhooks with a broken token. A Slack notification is triggered via the context engine notification pathway.

---

## Modified Workflows

### 6. `ThreadProcessingCoordinatorWorkflow` (Modified)

**File**: `apps/backend/src/temporal/workflow/thread_processing_coordinator_workflow.py`

#### Changes Summary

1. Add `is_ig_dm = candidate.ig_dm_account_id is not None` discriminator at top of `run()`.
2. Replace the unconditional Gmail-only setup block with a 3-way channel check.
3. Add IG DM-specific branch: skip ensure_complete_thread, skip attachments, add 24h window check.
4. Extend `OUTBOUND` handling to call `ig_dm_ingest_sent_reply_as_example_activity` (parallel to email's `ingest_sent_reply_as_example_activity`).

#### Exact Modified `run()` Structure

```python
@workflow.defn
class ThreadProcessingCoordinatorWorkflow:
    @workflow.run
    async def run(self, candidate: Candidate) -> None:
        # --- Discriminators ---
        is_smtp   = candidate.smtp_account_id  is not None
        is_ig_dm  = candidate.ig_dm_account_id is not None
        # (implicitly: is_gmail = not is_smtp and not is_ig_dm)

        # --- Channel-specific pre-processing ---
        if not is_smtp and not is_ig_dm:
            # GMAIL ONLY: ensure complete thread + attachment extraction
            await workflow.execute_activity(
                ensure_complete_thread_ingested_activity,
                EnsureCompleteThreadParams(state__id=candidate.state__id),
                schedule_to_close_timeout=timedelta(minutes=5),
                retry_policy=RetryPolicy(maximum_attempts=3),
                activity_id=f"ensure-complete-thread-{candidate.state__id}",
            )
            await workflow.start_child_workflow(
                ThreadAttachmentExtractWorkflow.run,
                candidate,
                id=f"thread-attachment-extract-{candidate.state__id}",
                id_reuse_policy=ALLOW_DUPLICATE,
            )

        elif is_ig_dm:
            # IG DM: check 24h window before any processing
            # If window is expired AND this is an INBOUND trigger, still process (window tracking)
            # Window check is only relevant for OUTBOUND draft generation (see Step 7 below)
            pass  # No pre-processing needed; media already downloaded at ingest

        # elif is_smtp: (no pre-processing — existing code, unchanged)

        # --- Step 3: Transition to READY_FOR_CAMPAIGN_ASSOCIATION ---
        await workflow.execute_activity(
            update_state_status_activity,
            UpdateStateStatusParams(
                state__id=candidate.state__id,
                status=GmailThreadStatus.READY_FOR_CAMPAIGN_ASSOCIATION,
                smtp_account_id=candidate.smtp_account_id,
                ig_dm_account_id=candidate.ig_dm_account_id,  # NEW: passed for dispatch
            ),
            activity_id=f"update-state-status-after-attachment-extract-{candidate.state__id}",
        )

        # --- Step 4: Campaign association (shared across all channels) ---
        campaign_result: CampaignAssociationResult = await workflow.execute_child_workflow(
            ThreadAssociateToCampaignWorkflow.run,
            candidate,
            id=f"thread-associate-to-campaign-{candidate.state__id}",
            id_reuse_policy=ALLOW_DUPLICATE,
        )
        maybe_campaign_id = campaign_result.campaign_id

        # --- Step 5: Creator interaction update ---
        if maybe_campaign_id is not None and (is_smtp or is_ig_dm):  # CHANGED: add is_ig_dm
            await workflow.execute_activity(
                update_creator_latest_interaction_activity,
                UpdateCreatorInteractionParams(
                    candidate=candidate,
                    campaign_id=maybe_campaign_id,
                ),
            )

        # --- Step 6: Campaign workflows (Gmail ONLY — unchanged) ---
        if maybe_campaign_id is not None and not is_smtp and not is_ig_dm:  # CHANGED: exclude is_ig_dm
            # ... existing Gmail campaign workflow steps (unchanged) ...

        # --- Step 7: Direction-based branching ---
        if candidate.latest_gmail_message__direction == GmailMessageDirection.INBOUND:
            if maybe_campaign_id:
                if not is_ig_dm:  # Gmail/SMTP: cancel follow-ups
                    await workflow.execute_activity(cancel_follow_ups_on_reply_activity, ...)
                status = GmailThreadStatus.READY_FOR_RESPONSE_DRAFT
            else:
                status = GmailThreadStatus.IGNORE

            # IG DM: 24h window check before draft generation
            if is_ig_dm and status == GmailThreadStatus.READY_FOR_RESPONSE_DRAFT:
                window_expires_at = candidate.state__window_expires_at
                if window_expires_at is None or window_expires_at < workflow.now():
                    # Window closed — cannot draft (would be unsendable)
                    status = GmailThreadStatus.IGNORE
                    # Log warning: window expired before draft could be generated

            # ... metrics extraction (Gmail/SMTP only, is_ig_dm skips) ...

            await workflow.execute_activity(
                update_state_status_activity,
                UpdateStateStatusParams(
                    state__id=candidate.state__id,
                    status=status,
                    smtp_account_id=candidate.smtp_account_id,
                    ig_dm_account_id=candidate.ig_dm_account_id,  # NEW
                ),
            )

            if status == GmailThreadStatus.READY_FOR_RESPONSE_DRAFT:
                if is_ig_dm:
                    # IG DM: no domain behavior classification; skip straight to draft
                    await workflow.execute_child_workflow(
                        ThreadResponseDraftWorkflow.run,
                        candidate,
                        id=f"ig-dm-response-draft-{candidate.state__id}",
                        id_reuse_policy=ALLOW_DUPLICATE,
                    )
                    await workflow.execute_activity(
                        update_state_status_activity,
                        UpdateStateStatusParams(
                            state__id=candidate.state__id,
                            status=GmailThreadStatus.WAITING_FOR_DRAFT_REVIEW,
                            ig_dm_account_id=candidate.ig_dm_account_id,
                        ),
                    )
                else:
                    # Gmail/SMTP: existing domain_behavior + automation_level flow (unchanged)
                    ...

        elif candidate.latest_gmail_message__direction == GmailMessageDirection.OUTBOUND:
            if maybe_campaign_id:
                if is_ig_dm:
                    # IG DM: RAG example ingestion (parallel to Gmail's ingest_sent_reply_as_example)
                    await workflow.execute_activity(
                        ig_dm_ingest_sent_reply_as_example_activity,
                        IgDmIngestReplyExampleParams(
                            candidate=candidate,
                            campaign_id=maybe_campaign_id,
                        ),
                    )
                else:
                    # Gmail/SMTP: existing ingest_sent_reply_as_example_activity (unchanged)
                    ...
                # ... is_thread_done check + status update (same pattern, dispatch via ig_dm_account_id) ...
```

**Key coordinator changes table**:

| Step | Gmail | SMTP | IG DM (new) |
|------|-------|------|-------------|
| `ensure_complete_thread_ingested` | ✅ Run | ❌ Skip | ❌ Skip |
| `ThreadAttachmentExtractWorkflow` | ✅ Run | ❌ Skip | ❌ Skip |
| `cancel_follow_ups_on_reply` | ✅ Run | ❌ Skip | ❌ Skip |
| 24h window check before draft | ❌ N/A | ❌ N/A | ✅ New |
| Domain behavior classification | ✅ Run | ✅ Run | ❌ Skip (DMs: generate draft immediately) |
| `ThreadResponseDraftWorkflow` | ✅ Run | ✅ Run | ✅ Run (simplified path) |
| `ingest_sent_reply_as_example` | ✅ Gmail version | ✅ SMTP version | ✅ IG DM version (new activity) |
| `schedule_follow_up` | ✅ Run | ✅ Run | ❌ Skip (no DM follow-up scheduling) |
| `ThreadExtractMetricsWorkflow` | ✅ Run | ❌ Skip | ❌ Skip |

---

### 7. `ThreadResponseDraftWorkflow` (Modified)

**File**: `apps/backend/src/temporal/workflow/thread_response_draft_workflow.py`

#### Changes Required

Add a third dispatch branch for IG DM. The existing 2-branch pattern (Gmail uses RAG, SMTP uses standard LLM) becomes:

```python
@workflow.defn
class ThreadResponseDraftWorkflow:
    @workflow.run
    async def run(self, candidate: Candidate) -> ThreadResponseDraftResult: ...
```

**Modified flow (additions highlighted)**:

```
Step 1: check_is_latest_for_thread_state_activity(candidate) → bool
    # Dispatches to IgDmThreadStateRepository when is_ig_dm (see modified activities)

Step 2: maybe_get_draft_by_thread_state_id_activity(candidate) → uuid.UUID | None
    # Dispatches to ig_dm_llm_draft table when is_ig_dm (see modified activities)
    # If found: return existing draft ID (no re-generation)

Step 3: Dispatch draft generation
    is_smtp   = candidate.smtp_account_id  is not None
    is_ig_dm  = candidate.ig_dm_account_id is not None

    if is_ig_dm:                              # NEW BRANCH
        draft_result = await workflow.execute_activity(
            ig_dm_generate_draft_activity,    # New: DM-specific LLM prompt + no RAG initially
            candidate,
            schedule_to_close_timeout=timedelta(minutes=5),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )
    elif is_smtp:
        draft_result = await workflow.execute_activity(
            generate_draft_using_llm_activity,  # Existing SMTP (no RAG)
            candidate, ...
        )
    else:
        draft_result = await workflow.execute_activity(
            generate_draft_with_rag_activity,   # Existing Gmail (RAG)
            candidate, ...
        )

Step 4: Store/upload draft
    if is_ig_dm:                              # NEW BRANCH
        await workflow.execute_activity(
            ig_dm_save_draft_to_db_activity,  # New: writes to ig_dm_llm_draft
            IgDmSaveDraftInput(
                candidate=candidate,
                draft_body_text=draft_result.draft_body_text,
                langfuse_session_id=draft_result.langfuse_session_id,
            ),
        )
        # No upload to Gmail API (no ig_dm_draft_id — DM drafts are DB-only)
    elif not is_smtp:
        await workflow.execute_activity(
            upload_llm_draft_to_gmail_activity, ...  # Existing Gmail (unchanged)
        )

Step 5: write_llm_draft_to_db_activity(...)  # Gmail/SMTP only — skip for IG DM
    # IG DM: draft already written in Step 4 by ig_dm_save_draft_to_db_activity
```

**`IgDmDraftResult`** (new type for Step 3 output):

```python
# In apps/backend/src/models/temporal/ig_dm_ingest.py, append:
class IgDmDraftResult(BaseModel):
    """Output from ig_dm_generate_draft_activity."""
    draft_body_text: str
    langfuse_session_id: str | None


class IgDmSaveDraftInput(BaseModel):
    """Input to ig_dm_save_draft_to_db_activity."""
    candidate: Candidate
    draft_body_text: str
    langfuse_session_id: str | None
```

---

## New Activities

### 1. `ig_dm_dedup_check_activity`

**File**: `apps/backend/src/temporal/activity/ig_dm_ingest_activity.py`

```python
@activity.defn
async def ig_dm_dedup_check_activity(
    ig_dm_account_id: uuid.UUID,
    mid: str,
) -> bool:
    """
    Check if a message with this (ig_dm_account_id, mid) already exists.

    Returns:
        True if message already stored (duplicate → skip ingest)
        False if new message (proceed with ingest)

    Query: SELECT 1 FROM ig_dm_message WHERE ig_dm_account_id = ? AND mid = ?
    Timeout: 10s. Retry: 3 (idempotent read).
    """
```

---

### 2. `ig_dm_media_download_activity`

**File**: `apps/backend/src/temporal/activity/ig_dm_media_download_activity.py`

```python
@activity.defn
async def ig_dm_media_download_activity(
    params: IgDmMediaDownloadInput,
) -> IgDmMediaDownloadResult:
    """
    Download ephemeral Meta CDN media URLs to Supabase Storage.

    Meta CDN URLs expire in approximately 1 hour. This activity downloads
    each URL immediately (called within IgDmIngestWorkflow step 2) and
    re-stores in Supabase Storage for permanent access.

    Storage path: ig-dm/{ig_dm_account_id}/{ig_conversation_id}/{mid}/{index}

    Behavior:
        - Downloads each URL in sequence (not parallel — each file may be large)
        - Uses supabase_client.storage.from_("ig-dm").upload(path, content)
        - Skips URLs that return HTTP 4xx (URL expired — log warning, add to failed_urls)
        - Does NOT fail the entire activity if one URL fails
        - Returns partial success (successful paths + failed URLs)

    Timeout: 120s (per activity invocation; file sizes vary 1KB–10MB)
    Retry: 2 (Meta URLs are ephemeral — retry window is short)
    """
```

---

### 3. `ig_dm_store_message_activity`

**File**: `apps/backend/src/temporal/activity/ig_dm_ingest_activity.py`

```python
@activity.defn
async def ig_dm_store_message_activity(
    params: IgDmIngestStoreInput,
) -> IgDmIngestStoreResult:
    """
    Insert ig_dm_message row. Idempotent via ON CONFLICT DO NOTHING.

    Converts sent_at_ms (Unix milliseconds) to TIMESTAMPTZ.
    Sets direction=INBOUND if sender_igsid != ig_business_account_id.
    Sets direction=OUTBOUND if sender_igsid == ig_business_account_id (or is_echo=True).

    On conflict: returns was_duplicate=True (all downstream steps can skip).
    On insert: returns ig_dm_message.id and was_duplicate=False.

    Timeout: 30s. Retry: 3.
    """
```

---

### 4. `batch_insert_ig_dm_state_and_get_candidate_activity`

**File**: `apps/backend/src/temporal/activity/ig_dm_thread_state_activity.py`

```python
@activity.defn
async def batch_insert_ig_dm_state_and_get_candidate_activity(
    params: IgDmStateCandidateInput,
) -> Candidate | None:
    """
    Create ig_dm_thread_state row and build a Candidate for the coordinator.

    Parallel to batch_insert_latest_state_and_get_candidates_activity (Gmail)
    and batch_insert_latest_smtp_state_and_get_candidates_activity (SMTP).

    1. INSERT INTO ig_dm_thread_state (
           user_id, ig_dm_account_id, ig_conversation_id,
           status=READY_FOR_CAMPAIGN_ASSOCIATION,
           latest_internal_date=sent_at,
           window_expires_at = sent_at + 24h IF direction=INBOUND ELSE NULL,
           triggered_by_mid=params.triggered_by_mid,
           latest_ig_dm_message_id=params.latest_ig_dm_message_id,
       )
       ON CONFLICT (user_id, ig_dm_account_id, ig_conversation_id, latest_internal_date) DO NOTHING
       RETURNING id

    2. If INSERT was no-op (conflict): return None

    3. Build Candidate:
       Candidate(
           gmail_thread_id=params.ig_conversation_id,  # Reuse field (naming artifact — see spec-pydantic-models §Design Decision 3)
           ig_dm_account_id=params.ig_dm_account_id,
           ig_conversation_id=params.ig_conversation_id,
           user_id=params.user_id,
           state__id=new_state_id,
           state__latest_internal_date=sent_at,
           state__latest_gmail_message_id=params.latest_ig_dm_message_id,  # Naming artifact
           state__window_expires_at=window_expires_at,
           latest_gmail_message__direction=params.direction,
       )

    Timeout: 30s. Retry: 3.
    """
```

---

### 5. `ig_igsid_resolution_activity`

**File**: `apps/backend/src/temporal/activity/ig_igsid_resolution_activity.py`

```python
@activity.defn
async def ig_igsid_resolution_activity(
    sender_igsid: str,
    ig_dm_account_id: uuid.UUID,
) -> IgIdentityResult:
    """
    Resolve IGSID to Instagram username via cache or Graph API.

    Resolution flow:
    1. Check ig_igsid_cache WHERE igsid = sender_igsid
       → If found AND resolved_at > NOW() - 7 days: return (cache hit)
       → Also UPDATE last_seen_at = NOW() on cache hit

    2. Cache miss: call Meta Graph API
       GET /{sender_igsid}?fields=name,username
       Authorization: Bearer {ig_dm_account.access_token}
       → Parse response: {id, name, username}

    3. Cache result:
       INSERT INTO ig_igsid_cache (igsid, username, display_name, resolved_at)
       ON CONFLICT (igsid) DO UPDATE SET username=?, display_name=?, resolved_at=NOW()

    4. Update ig_dm_message rows for this sender (denormalized sender_username):
       UPDATE ig_dm_message SET sender_username = username WHERE sender_igsid = ?
       AND ig_dm_account_id = ? AND sender_username IS NULL

    5. Attempt campaign_creator match:
       a. SELECT id FROM campaign_creator WHERE ig_igsid = sender_igsid (O(1) — direct IGSID match)
       b. If no match: SELECT id FROM campaign_creator
                        WHERE social_media_handles @> '[{"platform":"instagram","handle":"{username}"}]'::jsonb
                        (GIN index — O(log n))
       c. If match found: UPDATE campaign_creator SET ig_igsid = sender_igsid WHERE id = ?
                          (cache for next time)

    Rate limit awareness:
        - 200 Graph API calls/hour (Standard Access)
        - Cache TTL: 7 days (re-resolve stale entries)
        - On 429 (rate limit exceeded): raise ApplicationError with non-retryable flag
          (activity will not retry; IGSID remains unresolved until next cache miss window)

    Timeout: 30s. Retry: 3 (exponential backoff 1s, 2s, 4s).
    Non-retryable errors: 404 (IGSID not found), 400 (invalid IGSID format).
    """
```

---

### 6. `ig_dm_send_reply_activity`

**File**: `apps/backend/src/temporal/activity/ig_dm_send_reply_activity.py`

```python
@activity.defn
async def ig_dm_send_reply_activity(
    params: IgDmSendReplyActivityInput,
) -> str:
    """
    Send a DM reply via Meta Graph API. Returns sent_mid.

    params:
        ig_dm_account_id: uuid.UUID        — look up access_token + ig_business_account_id
        recipient_igsid: str               — IGSID of the DM recipient (creator)
        message_text: str | None           — Plain text content (max 1000 chars)
        media_url: str | None              — Supabase Storage public URL (for image/video sends)
        ig_thread_state_id: uuid.UUID      — For logging/observability only

    API call:
        POST /{ig_business_account_id}/messages
        Authorization: Bearer {access_token}
        Content-Type: application/json
        Body:
            {
              "recipient": {"id": recipient_igsid},
              "message": {"text": message_text}           // for text
            }
            OR:
            {
              "recipient": {"id": recipient_igsid},
              "message": {"attachment": {"type": "image", "payload": {"url": media_url}}}
            }

    Response: {"recipient_id": "...", "message_id": "mid.xxx"}
    Returns: message_id (the sent_mid)

    Error handling:
        - 400 (invalid_parameter / recipient error): non-retryable ApplicationError
          (e.g., creator has blocked the account, privacy settings)
        - 400 (message_window_24h_exceeded): non-retryable ApplicationError("WINDOW_EXPIRED")
        - 429 (rate_limit): retryable, backoff 30s
        - 500/503: retryable

    Timeout: 30s. Retry: 3 (except non-retryable errors above).
    """
```

**Supporting input type** (append to `ig_dm_send_reply.py`):
```python
class IgDmSendReplyActivityInput(BaseModel):
    ig_dm_account_id: uuid.UUID
    recipient_igsid: str
    message_text: str | None
    media_url: str | None
    ig_dm_thread_state_id: uuid.UUID
```

---

### 7. `ig_dm_check_reply_window_activity`

**File**: `apps/backend/src/temporal/activity/ig_dm_send_reply_activity.py`

```python
@activity.defn
async def ig_dm_check_reply_window_activity(
    ig_dm_account_id: uuid.UUID,
    ig_conversation_id: str,
) -> datetime | None:
    """
    Return the active window_expires_at for a conversation, or None if window closed.

    Query:
        SELECT window_expires_at
        FROM ig_dm_thread_state
        WHERE ig_dm_account_id = ?
          AND ig_conversation_id = ?
        ORDER BY latest_internal_date DESC
        LIMIT 1

    Returns:
        window_expires_at if window_expires_at IS NOT NULL AND window_expires_at > NOW()
        None if window_expires_at IS NULL OR window_expires_at <= NOW()

    Timeout: 10s. Retry: 3.
    """
```

---

### 8. `ig_dm_generate_draft_activity`

**File**: `apps/backend/src/temporal/activity/ig_dm_draft_activity.py`

```python
@activity.defn
async def ig_dm_generate_draft_activity(
    candidate: Candidate,
) -> IgDmDraftResult:
    """
    Generate an AI draft reply for an Instagram DM thread.

    Uses LlmService with DM-specific Langfuse prompt templates.
    Parallel to generate_draft_with_rag_activity (Gmail) and
    generate_draft_using_llm_activity (SMTP).

    Key differences from email draft generation:
        1. Uses IgDmLoaderService.convert_thread_to_xml() instead of EmailLoaderService
           (produces <ig_dm_thread> XML with <message handle="@user" direction="INBOUND"> tags;
            no subject/to/cc/bcc fields; includes window_expires_at for context)
        2. Langfuse prompt name: f"ig-dm-{campaign_type}-reply" (4 templates per campaign type)
           Campaign types: gifting, ugc, ambassador, affiliate
        3. ResponseDraftResult.subject is ignored; only draft_body_text is used
        4. draft_body_text is validated: len <= 1000 chars (Instagram DM limit)
           If over limit: LLM is re-prompted once to shorten, then truncated if still over

    Flow:
        1. Fetch thread context: SELECT ig_dm_message ORDER BY sent_at ASC
        2. IgDmLoaderService.convert_thread_to_xml(messages, ig_dm_account, window_expires_at)
        3. fetch campaign/creator context (existing pattern, unchanged)
        4. LlmService.generate_draft(prompt_name, context_xml, langfuse_session_id)
        5. Validate 1000-char limit; re-prompt if needed
        6. Return IgDmDraftResult(draft_body_text, langfuse_session_id)

    Timeout: 120s (LLM calls may be slow). Retry: 3.
    """
```

---

### 9. `ig_dm_save_draft_to_db_activity`

**File**: `apps/backend/src/temporal/activity/ig_dm_draft_activity.py`

```python
@activity.defn
async def ig_dm_save_draft_to_db_activity(
    params: IgDmSaveDraftInput,
) -> uuid.UUID:
    """
    Write AI-generated draft to ig_dm_llm_draft table. Returns draft ID.

    INSERT INTO ig_dm_llm_draft (
        user_id, ig_dm_account_id, ig_dm_thread_state_id, ig_conversation_id,
        draft_body_text, langfuse_session_id
    )
    ON CONFLICT (ig_dm_account_id, ig_conversation_id, ig_dm_thread_state_id)
    DO UPDATE SET draft_body_text = EXCLUDED.draft_body_text, updated_at = NOW()
    RETURNING id

    No upload to Gmail API (DM drafts are DB-only; no external draft concept).
    Draft is retrieved by the CE tool via GET /api/ig-dm/threads/{id}/draft.

    Timeout: 15s. Retry: 3.
    """
```

---

### 10. `get_all_active_ig_dm_accounts_activity`

**File**: `apps/backend/src/temporal/activity/ig_dm_account_activity.py`

```python
@activity.defn
async def get_all_active_ig_dm_accounts_activity() -> list[IgDmAccountSummary]:
    """
    List all active Instagram DM accounts for reconciliation scheduling.

    Parallel to get_all_active_gmail_emails_activity() and
    get_all_active_smtp_emails_activity().

    Query:
        SELECT id, user_id, instagram_business_account_id, ig_username, access_token
        FROM user_ig_dm_account
        WHERE is_active = TRUE
          AND webhook_subscribed = TRUE

    Returns: list of IgDmAccountSummary (id, user_id, ig_business_account_id)

    Timeout: 30s. Retry: 3.
    """
```

**Supporting type**:
```python
class IgDmAccountSummary(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    instagram_business_account_id: str
    ig_username: str
```

---

### 11. `ig_dm_ingest_sent_reply_as_example_activity`

**File**: `apps/backend/src/temporal/activity/ig_dm_draft_activity.py`

```python
@activity.defn
async def ig_dm_ingest_sent_reply_as_example_activity(
    params: IgDmIngestReplyExampleParams,
) -> None:
    """
    Store a sent DM reply as a RAG example in ig_dm_reply_example table.

    Parallel to ingest_sent_reply_as_example_activity (email).

    Triggered by coordinator OUTBOUND branch when campaign is associated.
    Trains the DM-specific RAG corpus for future draft generation.

    Flow:
        1. Fetch the outbound ig_dm_message by state__latest_gmail_message_id
        2. Fetch preceding INBOUND message (the creator's DM being replied to)
        3. Generate embedding via EmbeddingService.embed(inbound_body_text)
        4. INSERT INTO ig_dm_reply_example (
               campaign_id, ig_conversation_id, ig_dm_account_id, user_id,
               inbound_body_text, outbound_body_text, embedding,
               created_at
           )
           ON CONFLICT DO NOTHING

    ig_dm_reply_example table: see spec-ai-drafting.md for full schema.

    Timeout: 60s (embedding generation). Retry: 3.
    """


class IgDmIngestReplyExampleParams(BaseModel):
    candidate: Candidate
    campaign_id: uuid.UUID
```

---

## Modified Activities

### Modified: `update_state_status_activity`

**File**: `apps/backend/src/temporal/activity/gmail_thread_state.py`

**Change**: Extend dispatch logic to include `IgDmThreadStateRepository` when `ig_dm_account_id` is set.

```python
@activity.defn
async def update_state_status_activity(params: UpdateStateStatusParams) -> None:
    """
    Update thread state status in the appropriate repository.

    Dispatch logic (MODIFIED):
        if params.ig_dm_account_id is not None:   # NEW BRANCH
            repo = IgDmThreadStateRepository(db)
            repo.update_status(params.state__id, params.status)
        elif params.smtp_account_id is not None:
            repo = SmtpThreadStateRepository(db)
            repo.update_status(params.state__id, params.status)
        else:
            repo = GmailThreadStateRepository(db)
            repo.update_status(params.state__id, params.status)

    UpdateStateStatusParams (already modified per spec-pydantic-models.md):
        state__id: uuid.UUID
        status: GmailThreadStatus
        smtp_account_id: uuid.UUID | None = None
        ig_dm_account_id: uuid.UUID | None = None  # NEW
    """
```

---

### Modified: `check_is_latest_for_thread_state_activity`

**File**: `apps/backend/src/temporal/activity/gmail_thread_state.py`

**Change**: Dispatch to `IgDmThreadStateRepository` when `candidate.ig_dm_account_id is not None`.

```python
@activity.defn
async def check_is_latest_for_thread_state_activity(candidate: Candidate) -> bool:
    """
    Check if this state is still the latest for the thread (stale guard).

    Dispatch logic (MODIFIED):
        if candidate.ig_dm_account_id is not None:   # NEW BRANCH
            repo = IgDmThreadStateRepository(db)
            return repo.is_latest(candidate.state__id, candidate.ig_conversation_id, candidate.ig_dm_account_id)
        elif candidate.smtp_account_id is not None:
            # existing SMTP dispatch
        else:
            # existing Gmail dispatch
    """
```

---

### Modified: `maybe_get_draft_by_thread_state_id_activity`

**File**: `apps/backend/src/temporal/activity/gmail_thread_llm_draft.py`

**Change**: Dispatch to `ig_dm_llm_draft` table when `candidate.ig_dm_account_id is not None`.

```python
@activity.defn
async def maybe_get_draft_by_thread_state_id_activity(candidate: Candidate) -> uuid.UUID | None:
    """
    Return existing draft ID if one exists for this thread state, else None.

    Dispatch logic (MODIFIED):
        if candidate.ig_dm_account_id is not None:   # NEW BRANCH
            # SELECT id FROM ig_dm_llm_draft
            # WHERE ig_dm_thread_state_id = candidate.state__id
            # LIMIT 1
        elif candidate.smtp_account_id is not None:
            # existing SMTP dispatch (gmail_thread_llm_draft with smtp_thread_state_id)
        else:
            # existing Gmail dispatch (gmail_thread_llm_draft with gmail_thread_state_id)

    Returns: uuid.UUID (draft ID) if found, else None.
    """
```

---

## Search Attributes

**File**: `apps/backend/src/temporal/search_attributes.py`

```python
# NEW: IG DM search attributes (parallel to existing Gmail attributes)
IG_DM_ACCOUNT_ID_KEY    = SearchAttributeKey.for_keyword("IgDmAccountId")
IG_CONVERSATION_ID_KEY  = SearchAttributeKey.for_keyword("IgConversationId")


def build_search_attributes_for_ig_dm_candidate(
    candidate: Candidate,
) -> TypedSearchAttributes:
    """
    Build TypedSearchAttributes for IG DM coordinator workflows.

    Sets:
        IG_DM_ACCOUNT_ID_KEY  → str(candidate.ig_dm_account_id)
        IG_CONVERSATION_ID_KEY → candidate.ig_conversation_id
        USER_EMAIL_KEY         → candidate.user__email (if set)

    Parallel to build_search_attributes_for_candidate() (Gmail/SMTP).
    Used in IgDmIngestWorkflow and ThreadProcessingCoordinatorWorkflow
    to enable workflow search/filter in Temporal UI.
    """
```

**Usage in `IgDmIngestWorkflow`**:
```python
# In IgDmIngestWorkflow.run():
workflow.upsert_search_attributes(
    build_search_attributes_for_ig_dm_candidate(candidate)
)
```

---

## Worker Registration

**File**: `apps/backend/src/temporal/workflow/__init__.py`

Append to `__all__`:
```python
__all__ = [
    # ... existing workflows (unchanged) ...
    "IgDmIngestWorkflow",
    "IgDmSendReplyWorkflow",
    "IgDmReconciliationWorkflow",
    "IgDmInitialSyncWorkflow",
    "IgDmTokenRefreshWorkflow",
]
```

**File**: `apps/backend/src/temporal/activity/__init__.py`

Append to `__all__`:
```python
__all__ = [
    # ... existing 67 activities (unchanged) ...
    "ig_dm_dedup_check_activity",
    "ig_dm_media_download_activity",
    "ig_dm_store_message_activity",
    "batch_insert_ig_dm_state_and_get_candidate_activity",
    "ig_igsid_resolution_activity",
    "ig_dm_send_reply_activity",
    "ig_dm_check_reply_window_activity",
    "ig_dm_generate_draft_activity",
    "ig_dm_save_draft_to_db_activity",
    "ig_dm_ingest_sent_reply_as_example_activity",
    "get_all_active_ig_dm_accounts_activity",
    "ig_dm_get_expiring_accounts_activity",
    "ig_dm_refresh_token_activity",
    "ig_dm_mark_initial_sync_complete_activity",
    "ig_dm_update_sync_cursor_activity",
    "ig_dm_list_conversations_activity",
    "ig_dm_fetch_conversation_messages_activity",
    "ig_dm_get_latest_stored_message_activity",
]
```

---

## Retry Policies Reference

| Activity | Timeout | Max Attempts | Non-retryable Errors |
|----------|---------|--------------|---------------------|
| `ig_dm_dedup_check_activity` | 10s | 3 | — |
| `ig_dm_media_download_activity` | 120s | 2 | 404 (URL expired) |
| `ig_dm_store_message_activity` | 30s | 3 | — |
| `batch_insert_ig_dm_state_and_get_candidate_activity` | 30s | 3 | — |
| `ig_igsid_resolution_activity` | 30s | 3 | 404 (unknown IGSID), 400, 429 (rate limit — non-retryable; wait for cache TTL reset) |
| `ig_dm_send_reply_activity` | 30s | 3 | 400 (recipient error), 400 (window expired) |
| `ig_dm_check_reply_window_activity` | 10s | 3 | — |
| `ig_dm_generate_draft_activity` | 120s | 3 | — |
| `ig_dm_save_draft_to_db_activity` | 15s | 3 | — |
| `ig_dm_ingest_sent_reply_as_example_activity` | 60s | 3 | — |
| `get_all_active_ig_dm_accounts_activity` | 30s | 3 | — |
| `ig_dm_refresh_token_activity` | 30s | 3 | 400 (invalid token — account disabled) |
| `ig_dm_list_conversations_activity` | 60s | 3 | 401 (invalid token — account disabled) |
| `ig_dm_fetch_conversation_messages_activity` | 60s | 3 | 401 |

---

## Complete File Manifest

### New Files Created

| File | Purpose |
|------|---------|
| `apps/backend/src/temporal/workflow/ig_dm_ingest_workflow.py` | `IgDmIngestWorkflow` |
| `apps/backend/src/temporal/workflow/ig_dm_send_reply_workflow.py` | `IgDmSendReplyWorkflow` |
| `apps/backend/src/temporal/workflow/ig_dm_reconciliation_workflow.py` | `IgDmReconciliationWorkflow` |
| `apps/backend/src/temporal/workflow/ig_dm_initial_sync_workflow.py` | `IgDmInitialSyncWorkflow` |
| `apps/backend/src/temporal/workflow/ig_dm_token_refresh_workflow.py` | `IgDmTokenRefreshWorkflow` |
| `apps/backend/src/temporal/activity/ig_dm_ingest_activity.py` | `ig_dm_dedup_check_activity`, `ig_dm_store_message_activity` |
| `apps/backend/src/temporal/activity/ig_dm_media_download_activity.py` | `ig_dm_media_download_activity` |
| `apps/backend/src/temporal/activity/ig_dm_thread_state_activity.py` | `batch_insert_ig_dm_state_and_get_candidate_activity` |
| `apps/backend/src/temporal/activity/ig_igsid_resolution_activity.py` | `ig_igsid_resolution_activity` |
| `apps/backend/src/temporal/activity/ig_dm_send_reply_activity.py` | `ig_dm_send_reply_activity`, `ig_dm_check_reply_window_activity` |
| `apps/backend/src/temporal/activity/ig_dm_draft_activity.py` | `ig_dm_generate_draft_activity`, `ig_dm_save_draft_to_db_activity`, `ig_dm_ingest_sent_reply_as_example_activity` |
| `apps/backend/src/temporal/activity/ig_dm_account_activity.py` | `get_all_active_ig_dm_accounts_activity`, `ig_dm_get_expiring_accounts_activity`, `ig_dm_refresh_token_activity`, `ig_dm_mark_initial_sync_complete_activity`, `ig_dm_update_sync_cursor_activity` |
| `apps/backend/src/models/temporal/ig_dm_send_reply.py` | `IgDmSendReplyResult`, `IgDmSendReplyActivityInput` |

### Modified Files

| File | Change |
|------|--------|
| `apps/backend/src/temporal/workflow/__init__.py` | Add 5 workflows to `__all__` |
| `apps/backend/src/temporal/activity/__init__.py` | Add ~18 activities to `__all__` |
| `apps/backend/src/temporal/workflow/thread_processing_coordinator_workflow.py` | Add `is_ig_dm` branch; 24h window check; IG DM draft/state dispatch |
| `apps/backend/src/temporal/workflow/thread_response_draft_workflow.py` | Add IG DM branch in draft generation dispatch; add `ig_dm_save_draft_to_db_activity` path |
| `apps/backend/src/temporal/activity/gmail_thread_state.py` | Extend `update_state_status_activity` + `check_is_latest_for_thread_state_activity` |
| `apps/backend/src/temporal/activity/gmail_thread_llm_draft.py` | Extend `maybe_get_draft_by_thread_state_id_activity` + `maybe_get_draft_by_thread_id_activity` |
| `apps/backend/src/temporal/search_attributes.py` | Add `IG_DM_ACCOUNT_ID_KEY`, `IG_CONVERSATION_ID_KEY`, `build_search_attributes_for_ig_dm_candidate()` |
| `apps/backend/src/models/temporal/ig_dm_ingest.py` | Add `IgDmInitialSyncInput`, `IgDmTokenRefreshInput`, `IgDmMediaDownloadInput/Result`, `IgDmIngestStoreInput/Result`, `IgDmStateCandidateInput`, `IgDmListConversationsInput`, `IgDmDraftResult`, `IgDmSaveDraftInput`, `IgDmIngestReplyExampleParams`, `IgDmInitialSyncResult`, `IgDmTokenRefreshResult`, `IgDmReconciliationResult`, `IgDmAccountSummary` |
