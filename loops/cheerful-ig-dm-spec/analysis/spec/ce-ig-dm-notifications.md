# Spec: IG DM Proactive Slack Notifications

**Aspect**: `spec-ce-ig-dm-notifications`
**Wave**: 3 — Component Implementation Specs
**Date**: 2026-03-01
**Input files**:
- Context engine codebase reads:
  - `app/src_v2/entrypoints/slack/app.py` — Slack Bolt app, event listener pattern
  - `app/src_v2/entrypoints/slack/handlers.py` — `chat_postMessage` usage pattern
  - `app/src_v2/entrypoints/slack/main.py` — Socket Mode bootstrap, `AppSettings` usage
  - `app/src_v2/bootstrap/config.py` — `SlackSettings`, `CheerfulSettings` patterns
  - `app/src_v2/mcp/tools/cheerful/constants.py` — `SLACK_USER_MAPPING`, `get_slack_user_mapping()`
  - `app/src_v2/webhooks/clarify.py` — FastAPI webhook receiver pattern (reference; not used here)
- Backend codebase reads:
  - `apps/backend/src/services/external/slack_service.py` — `SlackService.post_message()`, `build_order_digest_blocks()` — **exact pattern to follow**
  - `apps/backend/src/temporal/activity/slack_order_digest_activity.py` — `post_slack_order_digest_activity` — **exact pattern to follow**
- Spec files:
  - `analysis/spec/temporal-interfaces.md` — workflow/activity signatures for hook points
  - `analysis/spec/ingest-workflow.md` — `IgDmIngestWorkflow` step sequence
  - `analysis/spec/send-reply.md` — `IgDmSendReplyWorkflow` and 24h window semantics
  - `analysis/spec/creator-resolution.md` — `IgIdentityResult.was_newly_matched` flag
  - `analysis/spec/db-migrations.md` — `ig_dm_thread_state` columns
  - `analysis/spec/ce-ig-dm-tools.md` — CE tool names (for Slack command hints in notifications)

---

## Strategic Context

The CE currently has **no proactive notification capability** — it only responds to Slack messages
(`app_mention`, `message` events). Proactive alerts require a push mechanism.

**Architecture decision**: Backend Temporal activities post to Slack directly via the existing
`SlackService` class (`src/services/external/slack_service.py`), using `slack-sdk` (already a
backend dependency). This mirrors `post_slack_order_digest_activity` exactly — no new CE webhook
endpoint, no inter-service HTTP, no CE code changes.

The CE role:
- Provides interactive DM management (the 8 CE tools from `spec-ce-ig-dm-tools.md`)
- Notifications are informational only; all actions are via Slack text commands to the CE bot

**Channel routing**: A single configured `IG_DM_NOTIFICATION_CHANNEL` env var (Slack channel ID).
All IG DM notifications go to this channel. Future: per-user DM routing when `user.slack_user_id`
is added to the user profile.

---

## Files

### New Backend Files

| Action | Path | Purpose |
|--------|------|---------|
| CREATE | `apps/backend/src/temporal/activity/ig_dm_notify_activity.py` | Temporal activity that builds and posts Slack IG DM notifications |
| CREATE | `apps/backend/src/models/temporal/ig_dm_notify.py` | Input/output Pydantic models for the notify activity |

### Modified Backend Files

| Action | Path | What Changes |
|--------|------|-------------|
| MODIFY | `apps/backend/src/services/external/slack_service.py` | Add 5 new `build_ig_dm_*_blocks()` methods |
| MODIFY | `apps/backend/src/temporal/activity/__init__.py` | Add `ig_dm_notify_activity` to `__all__` |
| MODIFY | `apps/backend/src/temporal/workflow/ig_dm_ingest_workflow.py` | Step 7: fire-and-forget `ig_dm_notify_new_inbound_activity` |
| MODIFY | `apps/backend/src/temporal/workflow/thread_processing_coordinator_workflow.py` | IG DM branch: fire-and-forget `ig_dm_notify_draft_ready_activity` after draft saved |
| MODIFY | `apps/backend/src/temporal/workflow/ig_dm_reconciliation_workflow.py` | Alert on expiring/expired windows using `ig_dm_notify_window_expiring_activity` |
| MODIFY | `apps/backend/src/temporal/workflow/ig_igsid_resolution_workflow.py` | Fire-and-forget `ig_dm_notify_creator_matched_activity` when `was_newly_matched=True` |
| MODIFY | `apps/backend/src/bootstrap/config.py` (or equivalent) | Add `IG_DM_NOTIFICATION_CHANNEL`, `IG_DM_NOTIFICATION_BOT_TOKEN` to settings |
| MODIFY | `apps/backend/supabase/migrations/20260228000000_ig_dm_support.sql` | Add `window_expiry_notified_at TIMESTAMPTZ` column to `ig_dm_thread_state` |

**No CE files change.** The CE (context engine) requires zero modifications for notifications.

---

## Notification Events

Five notification types cover the full IG DM lifecycle:

| Event Type | Trigger | Slack Content |
|------------|---------|---------------|
| `ig_dm.new_inbound` | New creator DM stored by `IgDmIngestWorkflow` | @handle, preview, window timer, command hint |
| `ig_dm.draft_ready` | AI draft saved by `ThreadProcessingCoordinatorWorkflow` | Draft preview, approve command hint |
| `ig_dm.creator_matched` | IGSID resolved to campaign creator by `IgIsidResolutionWorkflow` | Creator name, campaign association |
| `ig_dm.window_expiring` | `IgDmReconciliationWorkflow` detects window < 2 hours remaining | Handle, exact expiry time, draft status |
| `ig_dm.window_expired` | `IgDmReconciliationWorkflow` detects thread with no reply after window close | Handle, campaign, when it expired |

---

## 1. DB Schema Addition — `window_expiry_notified_at`

**File**: `apps/backend/supabase/migrations/20260228000000_ig_dm_support.sql`
_(addendum to the existing `spec-db-migrations.md` migration file)_

Add to the `ig_dm_thread_state` CREATE TABLE block:

```sql
window_expiry_notified_at TIMESTAMPTZ, -- set when "window expiring" Slack alert fires; prevents duplicate alerts
```

This single column prevents the `IgDmReconciliationWorkflow` (which runs every 30 minutes) from
re-alerting on the same thread's expiry window.

---

## 2. `ig_dm_notify.py` — Input/Output Models

**File**: `apps/backend/src/models/temporal/ig_dm_notify.py`
**Parallel to**: `apps/backend/src/models/temporal/slack_order_digest.py`

```python
"""Pydantic models for IG DM Slack notification activity I/O."""
from enum import StrEnum

from pydantic import BaseModel


class IgDmNotificationType(StrEnum):
    NEW_INBOUND = "ig_dm.new_inbound"
    DRAFT_READY = "ig_dm.draft_ready"
    CREATOR_MATCHED = "ig_dm.creator_matched"
    WINDOW_EXPIRING = "ig_dm.window_expiring"
    WINDOW_EXPIRED = "ig_dm.window_expired"


class IgDmNotifyInput(BaseModel):
    """Input for ig_dm_notify_activity.

    All monetary/sensitive data excluded. Provide enough info for Slack message copy.
    slack_channel_id and slack_bot_token come from backend settings (env vars); they are
    passed explicitly so the activity is stateless and testable.
    """

    notification_type: IgDmNotificationType

    # Slack routing
    slack_channel_id: str  # from IG_DM_NOTIFICATION_CHANNEL env var
    slack_bot_token: str   # from IG_DM_NOTIFICATION_BOT_TOKEN env var (or SLACK_DIGEST_BOT_TOKEN)

    # Thread identity (always present)
    ig_conversation_id: str
    ig_username: str  # without "@"; used as "@{ig_username}" in messages

    # Campaign context (present if thread is matched; None if UNMATCHED)
    campaign_id: str | None = None
    campaign_name: str | None = None
    campaign_creator_name: str | None = None  # resolved creator name, if known

    # Message content (for new_inbound only)
    message_preview: str | None = None  # first 200 chars of the inbound message body

    # Draft content (for draft_ready only)
    draft_preview: str | None = None   # first 200 chars of AI draft
    draft_id: str | None = None

    # Window timing (for new_inbound, window_expiring, window_expired)
    window_expires_at: str | None = None   # ISO8601 UTC; None = already expired or outbound
    minutes_remaining: int | None = None   # pre-computed for window_expiring


class IgDmNotifyResult(BaseModel):
    """Result of ig_dm_notify_activity."""

    posted: bool         # True if message posted successfully
    message_ts: str | None = None  # Slack message timestamp (for future threading)
    skipped_reason: str | None = None  # e.g. "no_channel_configured", "slack_api_error"
```

---

## 3. `slack_service.py` — New Block Builders

**File**: `apps/backend/src/services/external/slack_service.py`
**Pattern**: Add 5 new methods, parallel to `build_order_digest_blocks()`.

### Method signatures

```python
def build_ig_dm_new_inbound_blocks(
    self,
    ig_username: str,
    ig_conversation_id: str,
    message_preview: str | None,
    campaign_name: str | None,
    window_expires_at: str | None,
    bot_name: str = "Cheerful",
) -> list[dict]:
    """Build Block Kit blocks for a new inbound IG DM notification.

    Sections:
        header      — "📨 New Instagram DM"
        section     — "@{handle}" · "{preview}" · Campaign: {name or 'Unmatched'}
        context     — Reply window: open (expires {timestamp}) or EXPIRED
        section     — Command hint: to view: "@{bot_name} get IG DM thread: {id}"
    """


def build_ig_dm_draft_ready_blocks(
    self,
    ig_username: str,
    ig_conversation_id: str,
    draft_preview: str | None,
    campaign_name: str | None,
    bot_name: str = "Cheerful",
) -> list[dict]:
    """Build Block Kit blocks for an AI draft ready notification.

    Sections:
        header      — "🤖 AI Draft Ready — Instagram DM"
        section     — "@{handle}" (Campaign: {name}) — draft preview (200 chars, truncated)
        section     — Command hint: to approve: "@{bot_name} approve IG DM draft: {id}"
                                    to view:    "@{bot_name} get IG DM thread: {id}"
    """


def build_ig_dm_creator_matched_blocks(
    self,
    ig_username: str,
    ig_conversation_id: str,
    campaign_creator_name: str,
    campaign_name: str,
    bot_name: str = "Cheerful",
) -> list[dict]:
    """Build Block Kit blocks for a creator-matched notification.

    Sections:
        header      — "✅ Creator Matched — Instagram DM"
        section     — "@{handle}" identified as {creator_name} · Campaign: {name}
        section     — Command hint: to view: "@{bot_name} get IG DM thread: {id}"
    """


def build_ig_dm_window_expiring_blocks(
    self,
    ig_username: str,
    ig_conversation_id: str,
    campaign_name: str | None,
    minutes_remaining: int,
    has_draft: bool,
    bot_name: str = "Cheerful",
) -> list[dict]:
    """Build Block Kit blocks for a reply window expiring alert.

    Sections:
        header      — "⚠️ Reply Window Closing — {minutes_remaining} minutes left"
        section     — "@{handle}" (Campaign: {name or 'Unmatched'})
                      has_draft=True  → "AI draft is ready. Approve now to send before window closes."
                      has_draft=False → "No draft yet. Reply now or the window will close."
        section     — Command hint:
                        if has_draft: "@{bot_name} approve IG DM draft: {id}"
                        else:         "@{bot_name} get IG DM thread: {id}"
    """


def build_ig_dm_window_expired_blocks(
    self,
    ig_username: str,
    ig_conversation_id: str,
    campaign_name: str | None,
    window_expires_at: str,
    bot_name: str = "Cheerful",
) -> list[dict]:
    """Build Block Kit blocks for a reply window expired notification.

    Sections:
        header      — "🔒 Reply Window Closed — Instagram DM"
        section     — "@{handle}" (Campaign: {name or 'Unmatched'})
                      Window closed at {window_expires_at} without a reply.
                      The creator must send another message to re-open the window.
        context     — "No action needed. This is for your records."
    """
```

### Block Kit examples (for reference)

#### `ig_dm.new_inbound` blocks

```json
[
  {
    "type": "header",
    "text": {"type": "plain_text", "text": "📨 New Instagram DM"}
  },
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "*@glossy.lips.creator*\n*Campaign:* Summer Glow 2026\n*Message:* Hey! Just posted the reel you sent the brief for..."
    }
  },
  {
    "type": "context",
    "elements": [
      {
        "type": "mrkdwn",
        "text": "⏳ Reply window open — expires 2026-03-02T14:23:00Z (24h)"
      }
    ]
  },
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "💬 *To view:* `@Cheerful get IG DM thread: 17841234567890`"
    }
  }
]
```

#### `ig_dm.draft_ready` blocks

```json
[
  {
    "type": "header",
    "text": {"type": "plain_text", "text": "🤖 AI Draft Ready — Instagram DM"}
  },
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "*@glossy.lips.creator* · Summer Glow 2026\n> Hi Sofia! Congrats on the reel — it looks amazing. Your discount code is GLOW20..."
    }
  },
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "✅ *To approve:* `@Cheerful approve IG DM draft: 17841234567890`\n👁 *To review first:* `@Cheerful get IG DM thread: 17841234567890`"
    }
  }
]
```

#### `ig_dm.window_expiring` blocks

```json
[
  {
    "type": "header",
    "text": {"type": "plain_text", "text": "⚠️ Reply Window Closing — 87 minutes left"}
  },
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "*@glossy.lips.creator* · Summer Glow 2026\nAI draft is ready. Approve now to send before the window closes."
    }
  },
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "✅ *Approve draft:* `@Cheerful approve IG DM draft: 17841234567890`"
    }
  }
]
```

---

## 4. `ig_dm_notify_activity.py` — Temporal Activity

**File**: `apps/backend/src/temporal/activity/ig_dm_notify_activity.py`
**Pattern**: Parallel to `apps/backend/src/temporal/activity/slack_order_digest_activity.py`

```python
"""Temporal activities for posting IG DM Slack notifications."""

import structlog
from slack_sdk.errors import SlackApiError
from temporalio import activity

from src.models.temporal.ig_dm_notify import (
    IgDmNotificationKind,
    IgDmNotifyInput,
    IgDmNotifyResult,
)
from src.services.external.slack_service import SlackService

log = structlog.get_logger()


@activity.defn
def ig_dm_notify_activity(params: IgDmNotifyInput) -> IgDmNotifyResult:
    """Post a proactive IG DM notification to Slack.

    Uses the existing SlackService and the configured IG_DM_NOTIFICATION_CHANNEL.
    All notification types route through this single activity to keep the activity
    count low and simplify retry configuration.

    Behavior:
        - Builds the appropriate Block Kit blocks for params.notification_type
        - Calls SlackService.post_message(channel_id=params.slack_channel_id, ...)
        - Returns IgDmNotifyResult(posted=True, message_ts=...) on success
        - Returns IgDmNotifyResult(posted=False, skipped_reason="slack_api_error") on
          SlackApiError — does NOT raise (non-retryable; notifications are best-effort)
        - If params.slack_channel_id is empty string: returns
          IgDmNotifyResult(posted=False, skipped_reason="no_channel_configured")

    Non-retryable: SlackApiError failures are logged and swallowed.
    Notification loss is acceptable — never block DM processing for a failed alert.

    Registered name: "ig_dm_notify_activity"
    """
```

### Dispatch logic inside `ig_dm_notify_activity`

```python
# Guard: no-op if channel not configured
if not params.slack_channel_id or not params.slack_bot_token:
    return IgDmNotifyResult(posted=False, skipped_reason="no_channel_configured")

slack = SlackService(bot_token=params.slack_bot_token)

# Build blocks based on notification type
if params.notification_type == IgDmNotificationKind.NEW_INBOUND:
    blocks = slack.build_ig_dm_new_inbound_blocks(
        ig_username=params.ig_username,
        ig_conversation_id=params.ig_conversation_id,
        message_preview=params.message_preview,
        campaign_name=params.campaign_name,
        window_expires_at=params.window_expires_at,
    )
    fallback_text = f"New IG DM from @{params.ig_username}"

elif params.notification_type == IgDmNotificationKind.DRAFT_READY:
    blocks = slack.build_ig_dm_draft_ready_blocks(...)
    fallback_text = f"AI draft ready for @{params.ig_username}"

elif params.notification_type == IgDmNotificationKind.CREATOR_MATCHED:
    blocks = slack.build_ig_dm_creator_matched_blocks(...)
    fallback_text = f"@{params.ig_username} matched to {params.campaign_creator_name}"

elif params.notification_type == IgDmNotificationKind.WINDOW_EXPIRING:
    has_draft = params.draft_id is not None
    blocks = slack.build_ig_dm_window_expiring_blocks(
        ..., has_draft=has_draft,
    )
    fallback_text = f"Reply window closing — @{params.ig_username} ({params.minutes_remaining}m)"

elif params.notification_type == IgDmNotificationKind.WINDOW_EXPIRED:
    blocks = slack.build_ig_dm_window_expired_blocks(...)
    fallback_text = f"Reply window closed — @{params.ig_username}"

# Post (best-effort; swallow SlackApiError)
try:
    message_ts = slack.post_message(
        channel_id=params.slack_channel_id,
        blocks=blocks,
        text=fallback_text,
    )
    return IgDmNotifyResult(posted=True, message_ts=message_ts)
except SlackApiError as e:
    log.error("ig_dm_notify_activity: Slack post failed", error=str(e), ...)
    return IgDmNotifyResult(posted=False, skipped_reason="slack_api_error")
```

### Retry policy

```python
# In workflow that calls this activity:
ig_dm_notify_retry = RetryPolicy(maximum_attempts=1)  # best-effort; never retry
```

---

## 5. Workflow Integration Points

### 5.1 `IgDmIngestWorkflow` — New Inbound DM

**File**: `apps/backend/src/temporal/workflow/ig_dm_ingest_workflow.py`

**Where**: After Step 3 (ig_dm_message stored) and Step 4 (ig_dm_thread_state inserted).
Skip if `result.was_duplicate=True` (dedup handled by ALLOW_DUPLICATE_FAILED_ONLY).
Skip if `input.is_echo=True` (echo messages are not inbound from creators).

**New Step 7** (fire-and-forget):

```python
# Step 7: Notify — new inbound DM (fire-and-forget, best-effort)
if not ingest_result.was_duplicate and not self.input.is_echo:
    await workflow.execute_activity(
        ig_dm_notify_activity,
        IgDmNotifyInput(
            notification_type=IgDmNotificationType.NEW_INBOUND,
            slack_channel_id=os.getenv("IG_DM_NOTIFICATION_CHANNEL", ""),
            slack_bot_token=os.getenv("IG_DM_NOTIFICATION_BOT_TOKEN", ""),
            ig_conversation_id=self.input.ig_conversation_id,
            ig_username=self.input.sender_username or self.input.sender_igsid,
            campaign_name=None,  # not yet resolved at ingest time; resolution is async
            message_preview=self.input.message_text[:200] if self.input.message_text else None,
            window_expires_at=self.input.timestamp,  # window opens at message time
        ),
        start_to_close_timeout=timedelta(seconds=10),
        retry_policy=RetryPolicy(maximum_attempts=1),
    )
```

**Note**: `campaign_name` is `None` at ingest time because creator resolution is async (fires
`IgIsidResolutionWorkflow` separately). The notification tells the team about the new DM; creator
matching notification (5.3) follows asynchronously.

---

### 5.2 `ThreadProcessingCoordinatorWorkflow` — Draft Ready

**File**: `apps/backend/src/temporal/workflow/thread_processing_coordinator_workflow.py`

**Where**: IG DM branch, after `ig_dm_save_draft_to_db_activity` returns successfully.

```python
# After draft saved — notify (fire-and-forget)
await workflow.execute_activity(
    ig_dm_notify_activity,
    IgDmNotifyInput(
        notification_type=IgDmNotificationType.DRAFT_READY,
        slack_channel_id=os.getenv("IG_DM_NOTIFICATION_CHANNEL", ""),
        slack_bot_token=os.getenv("IG_DM_NOTIFICATION_BOT_TOKEN", ""),
        ig_conversation_id=candidate.ig_conversation_id,
        ig_username=candidate.sender_username or candidate.ig_conversation_id,
        campaign_name=campaign_name,  # resolved from candidate.campaign_id
        draft_preview=draft_result.body_text[:200] if draft_result.body_text else None,
        draft_id=draft_result.draft_id,
    ),
    start_to_close_timeout=timedelta(seconds=10),
    retry_policy=RetryPolicy(maximum_attempts=1),
)
```

---

### 5.3 `IgIsidResolutionWorkflow` — Creator Matched

**File**: `apps/backend/src/temporal/workflow/ig_igsid_resolution_workflow.py`

**Where**: After `ig_igsid_resolution_activity` returns, if `result.was_newly_matched=True`
(i.e., `campaign_creator_id` was just set for the first time on this thread).

```python
if identity_result.was_newly_matched and identity_result.campaign_creator_id:
    await workflow.execute_activity(
        ig_dm_notify_activity,
        IgDmNotifyInput(
            notification_type=IgDmNotificationType.CREATOR_MATCHED,
            slack_channel_id=os.getenv("IG_DM_NOTIFICATION_CHANNEL", ""),
            slack_bot_token=os.getenv("IG_DM_NOTIFICATION_BOT_TOKEN", ""),
            ig_conversation_id=self.input.ig_conversation_id,
            ig_username=identity_result.username or self.input.sender_igsid,
            campaign_name=None,  # not directly available in this workflow; omit or pre-fetch
            campaign_creator_name=identity_result.display_name,
        ),
        start_to_close_timeout=timedelta(seconds=10),
        retry_policy=RetryPolicy(maximum_attempts=1),
    )
```

**Note on `campaign_name`**: The resolution workflow doesn't directly have the campaign name.
Two options:
1. Add a `get_campaign_name_for_creator_activity` call before notify (1 extra DB call)
2. Omit campaign_name from this notification (acceptable for MVP — creator name is the key info)

Spec recommendation: **omit campaign_name in this notification for MVP** — include only
`campaign_creator_name` and `ig_username`. The `build_ig_dm_creator_matched_blocks` method
accepts `campaign_name: str | None` and shows "Campaign: Unknown" when None.

---

### 5.4 `IgDmReconciliationWorkflow` — Window Expiring / Expired

**File**: `apps/backend/src/temporal/workflow/ig_dm_reconciliation_workflow.py`
**Schedule**: Cron, every 30 minutes (as per `spec-temporal-interfaces.md`)

**Query**: For each user's IG DM accounts, find threads where:

```sql
-- Window expiring (< 2 hours remaining, not yet notified)
SELECT its.*, idm.sender_username, idm.ig_conversation_id
FROM ig_dm_thread_state its
JOIN ig_dm_message idm ON idm.ig_conversation_id = its.ig_conversation_id
WHERE its.ig_dm_account_id = :account_id
  AND its.status IN ('PENDING', 'MATCHED')  -- actively awaiting reply
  AND its.window_expires_at > NOW()
  AND its.window_expires_at <= NOW() + INTERVAL '2 hours'
  AND its.window_expiry_notified_at IS NULL  -- not yet alerted
ORDER BY its.window_expires_at ASC
LIMIT 50;
```

```sql
-- Window expired without reply (and notification not yet fired)
SELECT its.*, idm.sender_username, idm.ig_conversation_id
FROM ig_dm_thread_state its
JOIN ig_dm_message idm ON idm.ig_conversation_id = its.ig_conversation_id
WHERE its.ig_dm_account_id = :account_id
  AND its.status NOT IN ('REPLIED', 'ARCHIVED')  -- no reply was sent
  AND its.window_expires_at < NOW()
  AND its.window_expiry_notified_at IS NULL       -- combined flag for both alert types
ORDER BY its.window_expires_at DESC
LIMIT 50;
```

**Workflow logic for each expiring thread** (new activity: `ig_dm_check_and_notify_expiry_activity`):

```python
@activity.defn
def ig_dm_check_and_notify_expiry_activity(
    params: IgDmExpiryNotifyInput,
) -> None:
    """Check window status, send notification, and mark notified.

    Input:
        ig_dm_thread_state_id: UUID
        ig_dm_account_id: UUID
        ig_conversation_id: str
        sender_username: str | None
        window_expires_at: datetime (UTC)
        slack_channel_id: str
        slack_bot_token: str
        campaign_name: str | None   # pre-fetched from campaign_thread join

    Behavior:
        1. Compute minutes_remaining = (window_expires_at - now()).total_seconds() / 60
        2. If minutes_remaining > 0: fire WINDOW_EXPIRING notification
        3. If minutes_remaining <= 0: fire WINDOW_EXPIRED notification
        4. Get pending draft id from ig_dm_llm_draft (for has_draft flag in expiring alert)
        5. UPDATE ig_dm_thread_state SET window_expiry_notified_at = NOW()
           WHERE id = :ig_dm_thread_state_id
        6. Log result
    """
```

**Model** (add to `ig_dm_notify.py`):

```python
class IgDmExpiryNotifyInput(BaseModel):
    ig_dm_thread_state_id: UUID
    ig_dm_account_id: UUID
    ig_conversation_id: str
    sender_username: str | None
    window_expires_at: datetime
    slack_channel_id: str
    slack_bot_token: str
    campaign_name: str | None = None
```

**Reconciliation loop** (within `IgDmReconciliationWorkflow.run()`):

```python
# Existing reconciliation tasks (Graph API sync, token health check)

# NEW: Window expiry notifications
expiring_threads = await workflow.execute_activity(
    ig_dm_fetch_expiry_candidates_activity,
    IgDmFetchExpiryCandidatesInput(
        ig_dm_account_ids=active_account_ids,
        window_expiry_horizon_minutes=120,
    ),
    start_to_close_timeout=timedelta(seconds=30),
)

for thread in expiring_threads:
    await workflow.execute_activity(
        ig_dm_check_and_notify_expiry_activity,
        IgDmExpiryNotifyInput(
            ig_dm_thread_state_id=thread.ig_dm_thread_state_id,
            ig_dm_account_id=thread.ig_dm_account_id,
            ig_conversation_id=thread.ig_conversation_id,
            sender_username=thread.sender_username,
            window_expires_at=thread.window_expires_at,
            slack_channel_id=os.getenv("IG_DM_NOTIFICATION_CHANNEL", ""),
            slack_bot_token=os.getenv("IG_DM_NOTIFICATION_BOT_TOKEN", ""),
            campaign_name=thread.campaign_name,
        ),
        start_to_close_timeout=timedelta(seconds=15),
        retry_policy=RetryPolicy(maximum_attempts=2),
    )
```

---

## 6. Environment Variables

| Variable | Where Used | Description | Required |
|----------|-----------|-------------|---------|
| `IG_DM_NOTIFICATION_CHANNEL` | Backend activities | Slack channel ID for all IG DM alerts | Yes (if notifications enabled) |
| `IG_DM_NOTIFICATION_BOT_TOKEN` | Backend activities | Slack bot token (xoxb-...) with `chat:write` scope; may reuse `SLACK_DIGEST_BOT_TOKEN` | Yes (if notifications enabled) |
| `ENABLE_IG_DM` | Backend activities (existing) | Feature flag; notifications are gated by same flag | Yes |

**Sharing `SLACK_DIGEST_BOT_TOKEN`**: Acceptable if the bot has `chat:write` to the IG DM channel.
Add `IG_DM_NOTIFICATION_BOT_TOKEN` as a separate env var to allow independent rotation.

---

## 7. Deduplication Strategy

| Event | Dedup Mechanism |
|-------|----------------|
| `ig_dm.new_inbound` | Implicit: `IgDmIngestWorkflow` uses `ALLOW_DUPLICATE_FAILED_ONLY` + `mid` uniqueness; notification fires exactly once per unique DM |
| `ig_dm.draft_ready` | Implicit: draft generated once per `ig_dm_thread_state` row; coordinator runs once per state; acceptable rare duplicate if state retried |
| `ig_dm.creator_matched` | `IgIdentityResult.was_newly_matched=True` gate; only fires when IGSID is resolved for the first time |
| `ig_dm.window_expiring` | `ig_dm_thread_state.window_expiry_notified_at` column; set after first alert; reconciliation skips `WHERE window_expiry_notified_at IS NULL` |
| `ig_dm.window_expired` | Same `window_expiry_notified_at` column covers both expiring and expired (combined flag) |

---

## 8. Activity Registration

**File**: `apps/backend/src/temporal/activity/__init__.py`

Add to `__all__`:
```python
"ig_dm_notify_activity",
"ig_dm_check_and_notify_expiry_activity",
"ig_dm_fetch_expiry_candidates_activity",
```

---

## 9. New Activity Summary

| Activity Name | File | Purpose |
|--------------|------|---------|
| `ig_dm_notify_activity` | `ig_dm_notify_activity.py` | Universal notification poster; dispatches based on `IgDmNotificationType`; best-effort (1 attempt) |
| `ig_dm_check_and_notify_expiry_activity` | `ig_dm_notify_activity.py` | Compute window time, post expiry alert, set `window_expiry_notified_at`; used by reconciliation workflow |
| `ig_dm_fetch_expiry_candidates_activity` | `ig_dm_notify_activity.py` | DB query to find threads needing expiry alerts; returns list of `IgDmExpiryNotifyInput` |

All three can live in the same file (`ig_dm_notify_activity.py`) to keep notification logic
co-located.

---

## 10. Full Notification Flow Diagrams

### New Inbound DM

```
Creator sends DM on Instagram
  → Meta webhook → /webhooks/instagram/
  → IgDmIngestWorkflow
      Step 3: ig_dm_message stored (mid: m_abc123)
      Step 4: ig_dm_thread_state inserted
      Step 7: ig_dm_notify_activity(NEW_INBOUND, @handle, preview, ...)
                → SlackService.post_message(channel_id=IG_DM_NOTIFICATION_CHANNEL, ...)
                → Slack: "📨 New IG DM from @glossy.lips.creator"
```

### Draft Ready

```
IgDmIngestWorkflow → ThreadProcessingCoordinatorWorkflow (IG DM branch)
    → ig_dm_generate_draft_activity
    → ig_dm_save_draft_to_db_activity (draft saved)
    → ig_dm_notify_activity(DRAFT_READY, @handle, draft_preview, ...)
         → Slack: "🤖 AI Draft Ready — @glossy.lips.creator"
```

### Creator Matched

```
IgIsidResolutionWorkflow
    → ig_igsid_resolution_activity → Graph API → cache → GIN match
    → was_newly_matched=True
    → ig_dm_notify_activity(CREATOR_MATCHED, @handle, creator_name, ...)
         → Slack: "✅ Creator Matched — @glossy.lips.creator = Sofia Reyes"
```

### Window Expiring / Expired

```
IgDmReconciliationWorkflow (cron every 30 min)
    → ig_dm_fetch_expiry_candidates_activity
         → DB query: window_expires_at near, window_expiry_notified_at IS NULL
    → ig_dm_check_and_notify_expiry_activity (per thread)
         → minutes_remaining > 0: notify WINDOW_EXPIRING
         → minutes_remaining <= 0: notify WINDOW_EXPIRED
         → UPDATE ig_dm_thread_state SET window_expiry_notified_at = NOW()
         → Slack: "⚠️ Reply Window Closing — 87 minutes left"
```

---

## 11. Dependencies

- `spec-db-migrations.md` — `window_expiry_notified_at` column added to `ig_dm_thread_state`
- `spec-temporal-interfaces.md` — `IgDmIngestWorkflow`, `IgDmReconciliationWorkflow`,
  `ThreadProcessingCoordinatorWorkflow` (hook points identified above)
- `spec-ingest-workflow.md` — Step 7 placement for `ig_dm_notify_activity`
- `spec-creator-resolution.md` — `IgIdentityResult.was_newly_matched` field
- Existing `SlackService` — extended with 5 new block-builder methods (no interface change)
- `SLACK_DIGEST_BOT_TOKEN` may be shared, or new `IG_DM_NOTIFICATION_BOT_TOKEN` added

## 12. No CE Changes

The context engine requires **zero changes** for notifications. The CE Slack bot continues
responding to user queries via the 8 IG DM tools (`spec-ce-ig-dm-tools.md`). Notifications are
posted by the backend directly to Slack using `SlackService`. No new CE webhook endpoints,
no new CE env vars, no changes to `app.py`, `handlers.py`, or any CE file.

---

## 13. Backend Settings Addition

**File**: `apps/backend/src/bootstrap/config.py` (or equivalent settings module)

Add:
```python
class IgDmNotificationSettings(BaseSettings):
    """Slack notification settings for IG DM alerts.

    Uses IG_DM_ env prefix.
    """

    notification_channel: str = ""  # Slack channel ID; empty = notifications disabled
    notification_bot_token: str = ""  # xoxb-...; falls back to SLACK_DIGEST_BOT_TOKEN if empty

    model_config = {"env_prefix": "IG_DM_"}
```

Both fields are optional with empty-string defaults so the backend starts without Slack
configured (notifications silently no-op via `skipped_reason="no_channel_configured"`).
