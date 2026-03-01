# Spec: `IgDmSendReplyWorkflow` — Instagram DM Reply Pipeline

**Aspect**: `spec-send-reply`
**Wave**: 3 — Component Implementation Specs
**Date**: 2026-03-01
**Input files**:
- `analysis/spec/temporal-interfaces.md` — `IgDmSendReplyWorkflow` class signature, step-by-step flow, idempotency strategy
- `analysis/spec/api-contracts.md` — `POST /api/ig-dm/threads/{id}/reply` route signature, error codes, pre-flight window check
- `analysis/spec/pydantic-models.md` — `IgDmSendReplyInput`, `IgDmReplyRequest`, `IgDmReplyResponse`, `UpdateStateStatusParams`
- `analysis/spec/db-migrations.md` — `ig_dm_message` schema, `ig_dm_thread_state` schema, `user_ig_dm_account` schema
- `analysis/spec/ingest-workflow.md` — `ig_dm_store_message_activity` (reused here for outbound message storage)
- `../cheerful-ig-dm-reverse/analysis/meta-instagram-messaging-api.md` — Meta send API, 24h window, rate limits, message types
- `analysis/audit/temporal-workflows.md` — `update_state_status_activity` dispatch pattern

---

## Files

### New Files

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `apps/backend/src/temporal/workflow/ig_dm_send_reply_workflow.py` | `IgDmSendReplyWorkflow` — orchestrates window check, send, store, state update |
| CREATE | `apps/backend/src/temporal/activity/ig_dm_send_reply_activity.py` | `ig_dm_check_reply_window_activity`, `ig_dm_send_reply_activity` |

### Modified Files

| Action | Path | What Changes |
|--------|------|-------------|
| MODIFY | `apps/backend/src/temporal/workflow/__init__.py` | Add `IgDmSendReplyWorkflow` to `__all__` |
| MODIFY | `apps/backend/src/temporal/activity/__init__.py` | Add `ig_dm_check_reply_window_activity`, `ig_dm_send_reply_activity` to `__all__` |
| MODIFY | `apps/backend/src/models/temporal/ig_dm_send_reply.py` | Add `IgDmSendReplyActivityInput` model |
| MODIFY | `apps/backend/src/services/external/ig_dm.py` | Add `send_message()` method to `IgDmService` |

> **Note**: `apps/backend/src/api/route/ig_dm_thread.py` is already specced in `analysis/spec/api-contracts.md §10`.
> The reply route is reproduced here with clarifications on the Temporal dispatch pattern.

---

## Overview

### Trigger Chain

```
Context Engine: cheerful_send_ig_dm_reply tool
    → POST /api/ig-dm/threads/{ig_conversation_id}/reply
        → Route handler: pre-flight window check (fast rejection)
        → Route handler: temporal_client.execute_workflow(IgDmSendReplyWorkflow)
             (blocking — awaits result for synchronous UX)

IgDmSendReplyWorkflow (short-lived, per-send)
    → ig_dm_check_reply_window_activity   [Step 1: re-check window (race guard)]
    → ig_dm_send_reply_activity            [Step 2: POST to Meta API]
    → ig_dm_store_message_activity         [Step 3: store outbound ig_dm_message]
    → update_state_status_activity         [Step 4: WAITING_FOR_INBOUND state]
```

Contrast with email:
- **Gmail**: `send_gmail_draft_activity` → Gmail API sends from draft; state advances to `WAITING_FOR_INBOUND`
- **SMTP**: `smtp_send_reply_activity` → SMTP relay; state advances
- **IG DM**: `ig_dm_send_reply_activity` → Meta Graph API; state advances — **no draft upload step** (DMs have no draft API; reply is sent directly)

### Idempotency Strategy

| Layer | Key | Guard |
|-------|-----|-------|
| Workflow ID | `f"ig-dm-reply-{ig_dm_account_id}-{ig_conversation_id}-{uuid4()}"` | New UUID per send → no reuse; **not** idempotent by design (each send attempt is unique) |
| `ig_dm_store_message_activity` | `UNIQUE (ig_dm_account_id, mid)` | `ON CONFLICT DO NOTHING` guards against Temporal retries storing duplicate outbound messages |

**Why a new UUID per workflow ID instead of a fixed key?**
Unlike ingest (where `mid` is the natural idempotency key), send retries may be intentional (user manually retrying after a failure). Using a random UUID allows multiple send attempts for the same thread state without the second attempt being rejected by `ALLOW_DUPLICATE_FAILED_ONLY`. The Meta API `mid` returned by a successful send becomes the dedup key at the DB level.

### 24-Hour Window Enforcement

The 24h window is checked at **two points**:

1. **Route handler (fast path)**: Queries `window_expires_at` from `ig_dm_thread_state` BEFORE starting the workflow. Returns `409 Conflict` immediately if window is closed. This avoids the Temporal round-trip for the most common failure mode.

2. **Step 1 of workflow (race guard)**: Re-checks `window_expires_at` inside the Temporal activity. Protects against the race condition where the window expires between the route's check and the Meta API call. If expired at this point: raises `ApplicationError("WINDOW_EXPIRED", non_retryable=True)` → workflow fails → route surfaces 409.

---

## 1. New Model: `IgDmSendReplyActivityInput`

**File**: `apps/backend/src/models/temporal/ig_dm_send_reply.py`

Extends the file already containing `IgDmSendReplyResult` (defined in `spec-temporal-interfaces.md §Additional Input/Output Models`).

```python
"""Input/output models for IgDmSendReplyWorkflow and its activities."""

import uuid
from pydantic import BaseModel


class IgDmSendReplyResult(BaseModel):
    """Output from IgDmSendReplyWorkflow. (Already defined — reproduced for context.)"""
    sent_mid: str
    # MID returned by Meta API (used to store the outbound ig_dm_message)
    stored_ig_dm_message_id: uuid.UUID
    # ig_dm_message.id of the stored outbound message
    window_was_active: bool
    # True if the 24h window was open at send time (always True if workflow completes successfully)


class IgDmSendReplyActivityInput(BaseModel):
    """Input to ig_dm_send_reply_activity (the Meta API call step).

    Separated from IgDmSendReplyInput to carry the resolved ig_business_account_id
    (fetched from user_ig_dm_account inside the workflow or in the window-check activity).
    """
    ig_dm_account_id: uuid.UUID
    # UserIgDmAccount.id — used to fetch access_token from DB
    ig_business_account_id: str
    # UserIgDmAccount.instagram_business_account_id — e.g. "17841400000123456"
    # This is the Graph API endpoint prefix: POST /{ig_business_account_id}/messages
    recipient_igsid: str
    # IGSID of the creator (the DM recipient)
    message_text: str | None
    # Plain text body. Max 1,000 characters (Meta API limit).
    # If None and media_url is set, sends as media-only message (type = "image" or "video")
    media_url: str | None
    # Publicly accessible URL for the media to send (image or video).
    # Must be accessible by Meta's servers (Supabase Storage public bucket or signed URL).
    # If None and message_text is set, sends as text-only message.
    message_type: str
    # "text" | "image" | "video" — determines the Meta API payload shape
    # Derived from: "text" if message_text and not media_url,
    #               "image" if media_url with image MIME type,
    #               "video" if media_url with video MIME type
```

**Validation note**: `IgDmSendReplyActivityInput` assumes at least one of `message_text` or `media_url` is non-None. The route handler enforces this constraint before dispatching — the activity can assume valid input.

---

## 2. `IgDmSendReplyWorkflow`

**File**: `apps/backend/src/temporal/workflow/ig_dm_send_reply_workflow.py`

```python
"""IgDmSendReplyWorkflow — send a DM reply via Meta API with 24h window enforcement."""

from datetime import timedelta
from temporalio import workflow
from temporalio.common import RetryPolicy

from src.models.database.gmail_thread_state import GmailThreadStatus
from src.models.temporal.ig_dm_ingest import IgDmSendReplyInput, IgDmIngestStoreInput
from src.models.temporal.ig_dm_send_reply import IgDmSendReplyResult, IgDmSendReplyActivityInput


@workflow.defn
class IgDmSendReplyWorkflow:
    """Send a DM reply to an Instagram creator via the Meta Graph API.

    Triggered by POST /api/ig-dm/threads/{id}/reply. Awaited synchronously by
    the route handler (execute_workflow, not start_workflow) so the user sees
    immediate confirmation or failure.

    Enforces the Instagram 24-hour messaging window at the Temporal layer
    (double-check after the route's pre-flight check) to guard against race
    conditions.

    Duration: Short-lived (typically 1–5 seconds for Meta API RTT).
    Task queue: TEMPORAL_TASK_QUEUE ("main")
    """

    @workflow.run
    async def run(self, params: IgDmSendReplyInput) -> IgDmSendReplyResult: ...
```

**Workflow metadata**:

| Field | Value |
|-------|-------|
| Workflow ID | `f"ig-dm-reply-{params.ig_dm_account_id}-{params.ig_conversation_id}-{workflow_uuid}"` where `workflow_uuid` is generated by the caller (route handler) via `uuid4()` |
| ID Reuse Policy | `ALLOW_DUPLICATE_FAILED_ONLY` (per-UUID ID means effectively no reuse) |
| Execution Timeout | `timedelta(minutes=5)` |
| Task Queue | `TEMPORAL_TASK_QUEUE = "main"` |

### Step-by-Step Flow

```
─────────────────────────────────────────────────────────────────────────────
Step 1: Re-check 24h reply window (race condition guard)
─────────────────────────────────────────────────────────────────────────────
window_info = await workflow.execute_activity(
    ig_dm_check_reply_window_activity,
    args=[params.ig_dm_account_id, params.ig_conversation_id, params.ig_dm_thread_state_id],
    start_to_close_timeout=timedelta(seconds=10),
    retry_policy=RetryPolicy(maximum_attempts=3),
    activity_id=f"ig-dm-window-{params.ig_conversation_id}",
)
# Returns: IgDmWindowCheckResult
#   window_expires_at: datetime | None — None if window is closed (NULL or expired)
#   ig_business_account_id: str — fetched from user_ig_dm_account for Step 2
#   recipient_igsid: str — the creator's IGSID (sender of the last inbound message)

if window_info.window_expires_at is None:
    raise ApplicationError(
        "WINDOW_EXPIRED",
        "Instagram 24-hour reply window is closed for this conversation",
        non_retryable=True,
    )
# The route handler catches ApplicationError("WINDOW_EXPIRED") and returns HTTP 409.

─────────────────────────────────────────────────────────────────────────────
Step 2: Send DM via Meta Graph API
─────────────────────────────────────────────────────────────────────────────
sent_mid = await workflow.execute_activity(
    ig_dm_send_reply_activity,
    IgDmSendReplyActivityInput(
        ig_dm_account_id=params.ig_dm_account_id,
        ig_business_account_id=window_info.ig_business_account_id,
        recipient_igsid=window_info.recipient_igsid,
        message_text=params.message_text,
        media_url=params.media_url,
        message_type=_derive_message_type(params.message_text, params.media_url),
    ),
    start_to_close_timeout=timedelta(seconds=30),
    retry_policy=RetryPolicy(
        maximum_attempts=3,
        initial_interval=timedelta(seconds=1),
        backoff_coefficient=2.0,
        # Retries handle transient Meta API failures (5xx, network timeouts).
        # Non-retryable errors (4xx) are raised as non_retryable=True ApplicationError.
    ),
    activity_id=f"ig-dm-send-{params.ig_conversation_id}",
)
# Returns: str — the message_id (MID) from Meta API response

─────────────────────────────────────────────────────────────────────────────
Step 3: Store outbound ig_dm_message
─────────────────────────────────────────────────────────────────────────────
store_result = await workflow.execute_activity(
    ig_dm_store_message_activity,  # Reused from ig_dm_ingest_activity.py
    IgDmIngestStoreInput(
        ig_dm_account_id=params.ig_dm_account_id,
        user_id=params.user_id,
        mid=sent_mid,
        ig_conversation_id=params.ig_conversation_id,
        sender_igsid=window_info.ig_business_account_id,  # Business account sent it
        sender_username=None,   # Business username resolved separately; echo will carry it
        recipient_igsid=window_info.recipient_igsid,
        direction="OUTBOUND",
        is_echo=False,  # This is the authoritative outbound record (not a Meta echo)
        body_text=params.message_text,
        message_type=_derive_message_type(params.message_text, params.media_url),
        sent_at_ms=int(workflow.now().timestamp() * 1000),
        # workflow.now() = Temporal-safe current time (deterministic)
        reply_to_mid=None,  # DM replies don't carry reply_to on the outbound side
        media_storage_paths=None,  # Outbound: media was uploaded by user before send
        media_original_urls=[params.media_url] if params.media_url else None,
    ),
    start_to_close_timeout=timedelta(seconds=15),
    retry_policy=RetryPolicy(maximum_attempts=3),
    activity_id=f"ig-dm-store-outbound-{sent_mid}",
)
# Returns: IgDmIngestStoreResult(ig_dm_message_id, was_duplicate)
# was_duplicate=True is benign here — means Meta's echo was processed first;
# the store is idempotent (ON CONFLICT DO NOTHING returns the existing row's id).

─────────────────────────────────────────────────────────────────────────────
Step 4: Advance thread state to WAITING_FOR_INBOUND
─────────────────────────────────────────────────────────────────────────────
await workflow.execute_activity(
    update_state_status_activity,  # From gmail_thread_state.py (extended for IG DM)
    UpdateStateStatusParams(
        state__id=params.ig_dm_thread_state_id,
        status=GmailThreadStatus.WAITING_FOR_INBOUND,
        ig_dm_account_id=params.ig_dm_account_id,
        # smtp_account_id and gmail_account_id remain None → dispatcher uses IG DM path
    ),
    start_to_close_timeout=timedelta(seconds=15),
    retry_policy=RetryPolicy(maximum_attempts=3),
    activity_id=f"ig-dm-state-waiting-{params.ig_dm_thread_state_id}",
)
# Appends a new ig_dm_thread_state row:
#   status = WAITING_FOR_INBOUND
#   window_expires_at = NULL (window resets when creator replies; outbound doesn't set it)

─────────────────────────────────────────────────────────────────────────────
Return
─────────────────────────────────────────────────────────────────────────────
return IgDmSendReplyResult(
    sent_mid=sent_mid,
    stored_ig_dm_message_id=store_result.ig_dm_message_id,
    window_was_active=True,
)
```

**Imports within `run` method** (lazy, matching existing codebase pattern):
```python
from temporalio.exceptions import ApplicationError
from src.temporal.activity.ig_dm_send_reply_activity import (
    ig_dm_check_reply_window_activity,
    ig_dm_send_reply_activity,
)
from src.temporal.activity.ig_dm_ingest_activity import ig_dm_store_message_activity
from src.temporal.activity.gmail_thread_state import update_state_status_activity
from src.models.temporal.ig_dm_send_reply import IgDmSendReplyActivityInput
from src.models.temporal.ig_dm_ingest import IgDmIngestStoreInput
from src.models.temporal.gmail_thread_state import UpdateStateStatusParams
from src.models.database.gmail_thread_state import GmailThreadStatus
```

**Helper** (module-level, not inside `run`):
```python
def _derive_message_type(message_text: str | None, media_url: str | None) -> str:
    """Derive IgDmMessageType value from send parameters.

    Args:
        message_text: Plain text content, or None if media-only.
        media_url: Supabase Storage URL for media, or None if text-only.

    Returns:
        "text" | "image" | "video"
        Returns "text" if both are provided (text + media combined sends as text;
        separate media sends require their own message).
    """
```

---

## 3. Activity Specs

**File**: `apps/backend/src/temporal/activity/ig_dm_send_reply_activity.py`

**Parallel to**: `apps/backend/src/temporal/activity/smtp_thread_state_sync_activity.py` (SMTP send pattern)

### 3.1 Supporting Model: `IgDmWindowCheckResult`

**File**: `apps/backend/src/models/temporal/ig_dm_send_reply.py` (extend existing file)

```python
class IgDmWindowCheckResult(BaseModel):
    """Output from ig_dm_check_reply_window_activity."""
    window_expires_at: datetime | None
    # None if window is closed (NULL in DB or past expiry).
    # Non-None means the window is still open.
    ig_business_account_id: str
    # UserIgDmAccount.instagram_business_account_id — needed for Meta API call in Step 2
    recipient_igsid: str
    # IGSID of the last inbound message sender (= the creator to reply to).
    # Fetched from ig_dm_message WHERE direction=INBOUND ORDER BY sent_at DESC LIMIT 1.
```

### 3.2 `ig_dm_check_reply_window_activity`

```python
@activity.defn
def ig_dm_check_reply_window_activity(
    ig_dm_account_id: uuid.UUID,
    ig_conversation_id: str,
    ig_dm_thread_state_id: uuid.UUID,
) -> IgDmWindowCheckResult:
    """Check the 24-hour reply window and fetch account + recipient context.

    Performs a single DB round-trip to:
    1. Verify the thread state is still current (not superseded by a newer inbound)
    2. Check window_expires_at on the latest ig_dm_thread_state row
    3. Fetch ig_business_account_id from user_ig_dm_account
    4. Fetch recipient_igsid from the most recent inbound ig_dm_message

    Args:
        ig_dm_account_id: UUID of the UserIgDmAccount owning this conversation.
        ig_conversation_id: Meta conversation ID.
        ig_dm_thread_state_id: The thread state ID that the caller scoped the reply to.
            Used to detect if a new inbound message arrived since the route handler
            checked the window (which would have reset the window — not a problem,
            but the state_id passed to update_state_status_activity in Step 4 should
            be the LATEST state, not the original one).

    Returns:
        IgDmWindowCheckResult:
          window_expires_at: The window expiry datetime if open; None if closed.
          ig_business_account_id: String IG Business Account ID for Meta API endpoint.
          recipient_igsid: IGSID of the creator to DM back.

    Window closed conditions:
    - Latest ig_dm_thread_state.window_expires_at IS NULL (last message was outbound)
    - Latest ig_dm_thread_state.window_expires_at <= NOW() (window expired)
    - No ig_dm_thread_state rows exist for this conversation (edge case)
    """
```

**SQL** (pseudocode):
```sql
-- Step A: Get latest thread state (may differ from ig_dm_thread_state_id if new inbound arrived)
SELECT ts.window_expires_at, a.instagram_business_account_id
FROM ig_dm_thread_state ts
JOIN user_ig_dm_account a ON a.id = ts.ig_dm_account_id
WHERE ts.ig_dm_account_id = :ig_dm_account_id
  AND ts.ig_conversation_id = :ig_conversation_id
ORDER BY ts.latest_internal_date DESC
LIMIT 1;

-- Step B: Get the creator's IGSID (last inbound sender)
SELECT sender_igsid
FROM ig_dm_message
WHERE ig_dm_account_id = :ig_dm_account_id
  AND ig_conversation_id = :ig_conversation_id
  AND direction = 'INBOUND'
ORDER BY sent_at DESC
LIMIT 1;
```

**Window evaluation**:
```python
# window_expires_at is None (window closed):
if window_expires_at is None or window_expires_at <= datetime.now(tz=timezone.utc):
    return IgDmWindowCheckResult(
        window_expires_at=None,
        ig_business_account_id=account_row.instagram_business_account_id,
        recipient_igsid=latest_inbound.sender_igsid,
    )
```

---

### 3.3 `ig_dm_send_reply_activity`

```python
@activity.defn
def ig_dm_send_reply_activity(
    params: IgDmSendReplyActivityInput,
) -> str:
    """Send a DM reply via the Meta Graph API.

    Calls POST /{ig_business_account_id}/messages using the account's stored
    access_token. Returns the MID of the sent message.

    Message type dispatch:
    - params.message_type == "text":
        payload = {"recipient": {"id": igsid}, "message": {"text": message_text}}
    - params.message_type == "image":
        payload = {"recipient": {"id": igsid}, "message": {"attachment": {"type": "image",
            "payload": {"url": media_url, "is_reusable": false}}}}
    - params.message_type == "video":
        payload = {"recipient": {"id": igsid}, "message": {"attachment": {"type": "video",
            "payload": {"url": media_url, "is_reusable": false}}}}

    Args:
        params: IgDmSendReplyActivityInput (account, recipient, content, type).

    Returns:
        str — message_id (MID) from Meta API response.
             Format: "mid.{base64_encoded_content}" (Meta-assigned, globally unique).

    Raises:
        ApplicationError("META_API_ERROR_INVALID_RECIPIENT", non_retryable=True):
            Meta returns 400 with error code 100/551 (invalid IGSID or recipient blocked).
        ApplicationError("META_API_ERROR_WINDOW_CLOSED", non_retryable=True):
            Meta returns 400 with error code 10 (messaging outside window).
        ApplicationError("META_API_ERROR_TEXT_TOO_LONG", non_retryable=True):
            message_text exceeds 1,000 characters (should be caught earlier, belt-and-suspenders).
        ApplicationError("META_API_ERROR_PERMISSION", non_retryable=True):
            Meta returns 200-level error indicating missing instagram_manage_messages permission.
        ApplicationError("META_API_ERROR_RATE_LIMIT", non_retryable=False):
            Meta returns 429 or error code 4 (rate limited). Temporal retries with backoff.
        ApplicationError("META_API_ERROR_SERVER", non_retryable=False):
            Meta returns 5xx. Temporal retries with backoff.
    """
```

**Meta API endpoint**: `POST https://graph.facebook.com/v22.0/{ig_business_account_id}/messages`

**Request headers**:
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request body shapes**:

```python
# Text message:
{
    "recipient": {"id": "{recipient_igsid}"},
    "message": {"text": "{message_text}"}
}

# Image message (URL-referenced):
{
    "recipient": {"id": "{recipient_igsid}"},
    "message": {
        "attachment": {
            "type": "image",
            "payload": {
                "url": "{media_url}",
                "is_reusable": False
            }
        }
    }
}

# Video message (URL-referenced):
{
    "recipient": {"id": "{recipient_igsid}"},
    "message": {
        "attachment": {
            "type": "video",
            "payload": {
                "url": "{media_url}",
                "is_reusable": False
            }
        }
    }
}
```

**Successful Meta API response**:
```json
{
    "recipient_id": "17841400000123456",
    "message_id": "mid.0987654321xxxyyy"
}
```

Extract: `response["message_id"]` → return as `str`.

**Meta error code → Cheerful behavior**:

| Meta Error Code | `error.code` | Behavior |
|-----------------|-------------|----------|
| 100 | Invalid parameter (bad IGSID) | `non_retryable=True` — log error, surface in CE as "DM send failed: invalid recipient" |
| 551 | `OAuthException` / user blocked | `non_retryable=True` — log, surface as "Creator has blocked DMs from this account" |
| 10 | `PermissionError` (window closed) | `non_retryable=True` — window closed between pre-flight and send; 409 to caller |
| 4 | App call limit exceeded | `non_retryable=False` — Temporal retries (rate limit; 200 DM/hr budget) |
| 32 | Page call limit | `non_retryable=False` — retry |
| 200-level meta errors | Various | Log and raise `non_retryable=True` for unknown 4xx errors |
| 500, 503 | Meta server error | `non_retryable=False` — retry (3 attempts, 1s/2s/4s backoff) |

**IgDmService integration**:
The activity delegates to `IgDmService.send_message()` (see §4 below) to isolate Meta API client logic from Temporal activity boilerplate:

```python
# Inside ig_dm_send_reply_activity (pseudocode flow):
access_token = fetch_access_token_from_db(params.ig_dm_account_id)
service = IgDmService(access_token=access_token)
sent_mid = service.send_message(
    ig_business_account_id=params.ig_business_account_id,
    recipient_igsid=params.recipient_igsid,
    message_text=params.message_text,
    media_url=params.media_url,
    message_type=params.message_type,
)
return sent_mid
```

---

## 4. `IgDmService.send_message()` Method

**File**: `apps/backend/src/services/external/ig_dm.py`

This file already has `get_user_info_by_igsid()` added (see `spec-creator-resolution.md §Modified Files`). Add `send_message()`:

```python
def send_message(
    self,
    ig_business_account_id: str,
    recipient_igsid: str,
    message_text: str | None,
    media_url: str | None,
    message_type: str,
) -> str:
    """Send a DM via the Meta Graph API.

    Builds the appropriate payload for the given message_type and POSTs to
    the Graph API messages endpoint. Parses the response for the assigned MID.

    Args:
        ig_business_account_id: The IG Business Account ID (endpoint prefix).
        recipient_igsid: IGSID of the message recipient (the creator).
        message_text: Plain text content (max 1,000 chars). None for media-only.
        media_url: Publicly accessible URL for image/video. None for text-only.
            URL must be accessible by Meta's servers — use Supabase Storage
            public bucket or a signed URL with sufficient TTL (>= 1 hour).
        message_type: "text" | "image" | "video"

    Returns:
        str — message_id (MID) from Meta API response.

    Raises:
        IgDmApiError: On Meta API error response (wraps error code and message
            for the activity to map to ApplicationError variants).
    """
```

**`IgDmApiError` exception class** (add to `ig_dm.py`):

```python
class IgDmApiError(Exception):
    """Raised when the Meta Graph API returns an error response."""
    def __init__(self, error_code: int, error_message: str, error_type: str) -> None: ...
    error_code: int
    # Meta error.code (e.g. 100, 551, 10, 4)
    error_message: str
    # Meta error.message string
    error_type: str
    # Meta error.type (e.g. "OAuthException", "PermissionError")
    is_retryable: bool
    # Computed: True if error_code in {4, 32, 500, 503} — Temporal should retry
```

---

## 5. Route Handler: Pre-Flight Window Check

**File**: `apps/backend/src/api/route/ig_dm_thread.py`
**Route**: `POST /api/ig-dm/threads/{ig_conversation_id}/reply`
**Full spec**: `analysis/spec/api-contracts.md §10`

Reproduced here with the Temporal dispatch pattern:

```python
@router.post(
    "/threads/{ig_conversation_id}/reply",
    response_model=IgDmReplyResponse,
)
async def send_ig_dm_reply(
    ig_conversation_id: str,
    request: IgDmReplyRequest,
    ig_dm_account_id: uuid.UUID = Query(..., description="IG DM account UUID"),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    temporal_client: TemporalClient = Depends(get_temporal_client),
) -> IgDmReplyResponse:
    """Send a DM reply. Awaits Temporal workflow synchronously for UX."""
```

**Route handler behavior** (exact steps):

```
Step 1: Authorization
    - Verify user_id owns ig_dm_account_id
      (SELECT 1 FROM user_ig_dm_account WHERE id = :id AND user_id = :user_id)
    - If not found: 404
    - If wrong owner: 403

Step 2: Input validation
    - if not request.message_text and not request.media_url:
          raise HTTPException(422, "At least one of message_text or media_url is required")
    - if request.message_text and len(request.message_text) > 1000:
          raise HTTPException(422, "message_text exceeds 1000 character limit")

Step 3: Pre-flight window check (fast path — avoid Temporal round-trip)
    - Query:
          SELECT window_expires_at
          FROM ig_dm_thread_state
          WHERE ig_dm_account_id = :id AND ig_conversation_id = :conv_id
          ORDER BY latest_internal_date DESC LIMIT 1
    - If result is None or window_expires_at is None or window_expires_at <= now():
          raise HTTPException(
              409,
              detail="DM window expired",
              headers={"X-Window-Expires-At": str(window_expires_at or "")},
          )

Step 4: Fetch thread state ID (needed by workflow for state transition)
    - state_id: uuid.UUID from the same query as Step 3
      (use the latest ig_dm_thread_state.id)

Step 5: Start Temporal workflow (blocking — execute_workflow waits for result)
    workflow_id = f"ig-dm-reply-{ig_dm_account_id}-{ig_conversation_id}-{uuid4()}"
    try:
        result: IgDmSendReplyResult = await temporal_client.execute_workflow(
            IgDmSendReplyWorkflow.run,
            IgDmSendReplyInput(
                ig_dm_account_id=ig_dm_account_id,
                ig_dm_thread_state_id=state_id,
                ig_conversation_id=ig_conversation_id,
                user_id=user_id,
                recipient_igsid=recipient_igsid,  # resolved in Step 3's query
                message_text=request.message_text,
                media_url=request.media_url,
            ),
            id=workflow_id,
            task_queue=settings.TEMPORAL_TASK_QUEUE,
        )
    except WorkflowFailureError as e:
        cause = e.cause  # ApplicationError
        if "WINDOW_EXPIRED" in str(cause):
            raise HTTPException(409, detail="DM window expired")
        if "META_API_ERROR_INVALID_RECIPIENT" in str(cause):
            raise HTTPException(502, detail="Failed to send DM: invalid recipient")
        if "META_API_ERROR_PERMISSION" in str(cause):
            raise HTTPException(502, detail="Failed to send DM: permission error")
        raise HTTPException(502, detail=f"Failed to send DM: {cause}")

Step 6: Return response
    return IgDmReplyResponse(
        sent_mid=result.sent_mid,
        stored_message_id=result.stored_ig_dm_message_id,
    )
```

**`recipient_igsid` resolution** (Step 3/4): The route handler resolves `recipient_igsid` from the conversation at Step 3 query time (fetch the latest inbound message's `sender_igsid`). This is the same query done in `ig_dm_check_reply_window_activity`, creating mild redundancy — but the route handler needs it to construct `IgDmSendReplyInput`, and the activity re-fetches it to guard against race conditions where a new inbound arrives between Steps 3 and 5.

```sql
-- Combined query for Step 3 + 4 + recipient resolution:
WITH latest_state AS (
    SELECT id, window_expires_at
    FROM ig_dm_thread_state
    WHERE ig_dm_account_id = :account_id
      AND ig_conversation_id = :conversation_id
    ORDER BY latest_internal_date DESC
    LIMIT 1
),
latest_inbound AS (
    SELECT sender_igsid
    FROM ig_dm_message
    WHERE ig_dm_account_id = :account_id
      AND ig_conversation_id = :conversation_id
      AND direction = 'INBOUND'
    ORDER BY sent_at DESC
    LIMIT 1
)
SELECT ls.id, ls.window_expires_at, li.sender_igsid
FROM latest_state ls, latest_inbound li;
```

---

## 6. Supported Message Types

### Text Messages

- **Constraint**: Max 1,000 characters (UTF-8). Meta API returns error code 100 for oversized text.
- **Validation**: Enforced in route handler (Step 2) before workflow dispatch. Belt-and-suspenders in `IgDmService.send_message()`.
- **Encoding**: UTF-8. Emoji and Unicode supported.

### Image Messages

- **Supported formats**: PNG, JPEG, GIF (animated GIFs play in Instagram DM)
- **Max file size**: 8 MB
- **URL requirement**: Must be **publicly accessible** by Meta's servers. Supabase Storage URLs must be either:
  - From a public bucket (preferred for sent media)
  - A signed URL with TTL >= 1 hour (minimum; 24h recommended)
- **Combined text + image**: Not supported in a single API call. If both `message_text` and `media_url` are provided, the route handler should split into two sequential sends (or require the caller to pick one). **Initial implementation**: enforce "only one of text or media per call" via 422 validation.

### Video Messages

- **Supported formats**: MP4, OGG, AVI, MOV, WEBM
- **Max file size**: 25 MB
- **URL requirement**: Same as image (public or long-lived signed URL)

### Unsupported in MVP

- Voice messages (no send support)
- Rich cards / Generic Templates
- Quick Replies
- Reaction messages

---

## 7. 24-Hour Window Details

### Window State Machine

```
Creator sends inbound DM
    → IgDmIngestWorkflow runs
    → ig_dm_thread_state inserted with window_expires_at = sent_at + 24h
    → status = READY_FOR_CAMPAIGN_ASSOCIATION → ... → WAITING_FOR_DRAFT_REVIEW

Brand approves/sends reply via IgDmSendReplyWorkflow
    → Step 1: window_expires_at > now() ✓ (open)
    → Step 2: Meta API send succeeds
    → Step 4: update_state_status_activity appends new row:
          status = WAITING_FOR_INBOUND
          window_expires_at = NULL  ← window is "closed" from Cheerful's perspective
          latest_internal_date = now() (reply sent time)

Creator replies again
    → IgDmIngestWorkflow runs for new inbound message
    → ig_dm_thread_state inserted with new window_expires_at = new_sent_at + 24h
    → window resets; coordinator re-runs
```

### Window Expiry Edge Cases

| Scenario | Behavior |
|----------|----------|
| Creator sends DM, brand reply takes > 24h | Route returns 409. CE tool notifies "Window expired" |
| Creator sends DM, Meta clock differs from Cheerful clock | Use `sent_at_ms` from Meta webhook (not `received_at`) to compute window. Meta's clock is authoritative |
| Reconciliation sources old message (7 days ago) | `window_expires_at` is already expired. Draft is generated but coordinator logs a warning. CE tool shows "Window closed" badge |
| Multiple inbound messages in quick succession | Each creates a new `ig_dm_thread_state` row. Latest `window_expires_at` applies |
| Brand sends reply, Meta echo arrives before workflow completes | Echo stored in Step 3 as `is_echo=True`, `direction=OUTBOUND`. `ig_dm_store_message_activity` ON CONFLICT DO NOTHING handles it |

### HUMAN_AGENT Tag (Future)

Meta allows a 7-day window via the `HUMAN_AGENT` message tag. This is **not** implemented in the MVP. The `IgDmSendReplyActivityInput` has a placeholder for this:

```python
# NOT in MVP — reserved for future implementation
# message_tag: Literal["HUMAN_AGENT"] | None = None
# If set, append &message_tag=HUMAN_AGENT to the Meta API payload
# (allows reply up to 7 days after last inbound)
```

---

## 8. Rate Limiting

Meta's rate limit for IG DM sends (as of October 2024): **200 DMs/hour**.

At Cheerful's scale (creator campaign management), 200/hr is unlikely to be a bottleneck in MVP. No additional rate limiting is implemented in the send path.

**If rate limiting becomes an issue** (future):
- `IgDmApiError.is_retryable = True` for error code 4 → Temporal retries with exponential backoff (1s, 2s, 4s)
- Add a rate-limiter token bucket in `IgDmService` using Redis or Temporal signals

---

## 9. State Transitions (Thread Lifecycle After Send)

The `WAITING_FOR_INBOUND` state inserted by Step 4 means the thread is "waiting for the creator to reply again". This is the correct resting state after a successful brand reply.

```
Before reply:          WAITING_FOR_DRAFT_REVIEW   (draft generated, pending approval)
After reply sent:      WAITING_FOR_INBOUND         (brand replied, waiting for creator)
After next inbound:    READY_FOR_CAMPAIGN_ASSOCIATION → ... → WAITING_FOR_DRAFT_REVIEW
```

The new `ig_dm_thread_state` row inserted by `update_state_status_activity` in Step 4:

```sql
INSERT INTO ig_dm_thread_state (
    user_id, ig_dm_account_id, ig_conversation_id,
    status,
    latest_internal_date,
    window_expires_at,       -- NULL: no window after outbound
    triggered_by_mid,        -- sent_mid (the outbound message's MID)
    latest_ig_dm_message_id, -- stored_ig_dm_message_id from Step 3
    created_at
)
VALUES (...)
```

**`update_state_status_activity` extension**: The existing activity dispatches to `IgDmThreadStateRepository.update_status()` when `ig_dm_account_id is not None` (see `spec-ingest-workflow.md §5.8`). For `WAITING_FOR_INBOUND`, the repository looks up the current state row (by `state__id`), copies `ig_conversation_id`, and appends the new row.

---

## 10. Error Handling Matrix

| Scenario | Source | Behavior | HTTP |
|----------|--------|----------|------|
| Window `NULL` (outbound was last message) | Route pre-flight | `HTTPException(409)` | 409 |
| Window expired (`window_expires_at <= now()`) | Route pre-flight | `HTTPException(409)` | 409 |
| Neither `message_text` nor `media_url` | Route validation | `HTTPException(422)` | 422 |
| `message_text` > 1,000 chars | Route validation | `HTTPException(422)` | 422 |
| Thread not found | Route handler | `HTTPException(404)` | 404 |
| User doesn't own account | Route handler | `HTTPException(403)` | 403 |
| Window closed between pre-flight and Step 1 | Workflow Step 1 | `ApplicationError("WINDOW_EXPIRED")` → route: 409 | 409 |
| Meta API: invalid IGSID (code 100) | Workflow Step 2 | `ApplicationError(non_retryable=True)` → route: 502 | 502 |
| Meta API: blocked by user (code 551) | Workflow Step 2 | `ApplicationError(non_retryable=True)` → route: 502 "Creator blocked DMs" | 502 |
| Meta API: window closed (code 10) | Workflow Step 2 | `ApplicationError(non_retryable=True)` → route: 409 | 409 |
| Meta API: rate limited (code 4) | Workflow Step 2 | Temporal retries 3x with backoff → 502 if exhausted | 502 |
| Meta API: server error (5xx) | Workflow Step 2 | Temporal retries 3x with backoff → 502 if exhausted | 502 |
| `ig_dm_store_message_activity` fails | Workflow Step 3 | Temporal retries 3x → 502 if exhausted (message WAS sent to Meta but not stored) | 502 |
| `update_state_status_activity` fails | Workflow Step 4 | Temporal retries 3x → 502 if exhausted (message sent + stored, state not advanced) | 502 |

**Store failure after successful send**: If Step 3 fails after Step 2 succeeds, the message was delivered to Instagram but not stored in Cheerful's DB. Meta's echo webhook will re-deliver the message, and `IgDmIngestWorkflow` will store it (with `is_echo=True`). The outbound record is eventually stored via the echo path. This is an acceptable eventual-consistency trade-off — the message reached the creator regardless.

---

## 11. Logging

All log events use `structlog` (`workflow.logger` inside the workflow, `activity.logger` inside activities).

| Event key | Level | Fields | Location |
|-----------|-------|--------|----------|
| `ig_dm_window_preflight_pass` | `debug` | `ig_conversation_id`, `window_expires_at` | Route handler Step 3 |
| `ig_dm_window_preflight_fail` | `info` | `ig_conversation_id`, `window_expires_at` | Route handler Step 3 (409) |
| `ig_dm_send_reply_start` | `info` | `ig_conversation_id`, `has_text`, `has_media` | Workflow start |
| `ig_dm_window_check_pass` | `debug` | `ig_conversation_id`, `window_expires_at` | Step 1 pass |
| `ig_dm_window_check_fail_race` | `warning` | `ig_conversation_id`, `window_expires_at` | Step 1 fail (race condition) |
| `ig_dm_send_reply_api_success` | `info` | `ig_conversation_id`, `sent_mid` | Step 2 success |
| `ig_dm_send_reply_api_error` | `error` | `ig_conversation_id`, `error_code`, `error_message` | Step 2 Meta error |
| `ig_dm_send_reply_api_retry` | `warning` | `ig_conversation_id`, `attempt`, `error_code` | Step 2 retry |
| `ig_dm_outbound_stored` | `info` | `ig_conversation_id`, `sent_mid`, `stored_id` | Step 3 success |
| `ig_dm_state_waiting_for_inbound` | `info` | `ig_conversation_id`, `state_id` | Step 4 success |

---

## 12. Worker Registration

### `apps/backend/src/temporal/workflow/__init__.py`

Add to `__all__`:
```python
from .ig_dm_send_reply_workflow import IgDmSendReplyWorkflow
```

### `apps/backend/src/temporal/activity/__init__.py`

Add to `__all__`:
```python
from .ig_dm_send_reply_activity import (
    ig_dm_check_reply_window_activity,
    ig_dm_send_reply_activity,
)
```

---

## 13. Cross-References

| Topic | Reference |
|-------|-----------|
| `IgDmSendReplyInput` fields | `analysis/spec/pydantic-models.md §10` |
| `IgDmSendReplyResult` definition | `analysis/spec/temporal-interfaces.md §Additional Input/Output Models` |
| `IgDmReplyRequest`, `IgDmReplyResponse` | `analysis/spec/pydantic-models.md §8` |
| Route signature (`POST /api/ig-dm/threads/{id}/reply`) | `analysis/spec/api-contracts.md §10` |
| `ig_dm_store_message_activity` (reused in Step 3) | `analysis/spec/ingest-workflow.md §3.1` |
| `update_state_status_activity` IG DM dispatch | `analysis/spec/ingest-workflow.md §5.8` |
| `IgDmSendReplyWorkflow` interfaces summary | `analysis/spec/temporal-interfaces.md §2` |
| `IgDmService` (OAuth token, base class) | `analysis/spec/meta-oauth.md §IgDmService` |
| `IgDmService.get_user_info_by_igsid()` (related method) | `analysis/spec/creator-resolution.md §Modified Files` |
| 24h window spec (Meta docs) | `../cheerful-ig-dm-reverse/analysis/meta-instagram-messaging-api.md §24-Hour Messaging Window` |
| Window expiry display in CE | `analysis/spec/ce-ig-dm-tools.md` (next aspect) |
| AI draft approval send path | `analysis/spec/ce-ig-dm-tools.md §cheerful_approve_ig_dm_draft` |
