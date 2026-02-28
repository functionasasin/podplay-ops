# Option: Direct Meta API Integration

**Aspect**: `option-direct-meta-api`
**Wave**: 3 — Options Cross-Product
**Date**: 2026-02-28
**References**:
- Wave 1: `meta-instagram-messaging-api.md`, `meta-webhooks-realtime.md`
- Wave 2: `current-thread-model.md`, `current-email-pipeline.md`, `current-creator-identity.md`, `current-inbox-ui.md`, `current-ai-drafting.md`

---

## Overview

This option implements Instagram DM ingestion by integrating directly with Meta's Instagram Messaging API (Messenger Platform) and its webhook infrastructure. It is the most direct, vendor-controlled path: Cheerful talks to Meta's APIs without any intermediary layer.

**Core premise**: Add Instagram DM as a **third inbound channel** alongside Gmail and SMTP, following the established dual-path pattern in Cheerful's architecture. Each Cheerful user OAuth-connects their Instagram Business account, enabling real-time DM capture via Meta webhooks → Temporal workflow → existing coordinator.

**Scope**: This option covers inbound-first DM capture (creator replies to existing campaign threads, or inbound creator DMs that can be linked to campaigns). Outbound DM sending via the API is described as an optional extension.

---

## End-to-End Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  SETUP PHASE (per Cheerful user, one-time)                          │
│                                                                     │
│  Cheerful UI → /settings/instagram                                  │
│      ↓                                                              │
│  Meta OAuth (Facebook Login)                                        │
│      ↓                                                              │
│  User Access Token → Long-Lived User Token (60d) → Page Token (∞)  │
│      ↓                                                              │
│  INSERT user_ig_dm_account (ig_account_id, page_id, page_token)    │
│      ↓                                                              │
│  POST /{page_id}/subscribed_apps → subscribe to messages field      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  INBOUND DM EVENT FLOW (real-time, per message)                     │
│                                                                     │
│  Creator sends DM on Instagram                                      │
│      ↓                                                              │
│  Meta Webhook → POST /webhooks/instagram (Fly.io FastAPI)           │
│      ↓ [HMAC-SHA256 signature verify — reject if invalid]           │
│  Return HTTP 200 immediately                                        │
│      ↓ [BackgroundTask]                                             │
│  INSERT ig_webhook_events (mid, payload) ON CONFLICT DO NOTHING     │
│      ↓                                                              │
│  Temporal: start_workflow(IgDmIngestWorkflow, payload)              │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  IgDmIngestWorkflow (Temporal)                                      │
│                                                                     │
│  ig_dm_ingest_activity                                              │
│      ├─ Filter: is_echo=true → skip                                 │
│      ├─ Filter: is_unsupported=true → store as unsupported, skip    │
│      ├─ Resolve: IGSID → username via Graph API (cache in ig_igsid) │
│      ├─ INSERT ig_dm_message (mid, igsid, username, body,           │
│      │                        timestamp, ig_dm_account_id)          │
│      └─ Returns: ig_dm_message.id, conversation key                 │
│                                                                     │
│  IgDmThreadSyncWorkflow (fire-and-forget)                           │
│      ↓                                                              │
│  batch_insert_ig_dm_state_and_get_candidates_activity               │
│      ├─ Resolve conversation_key → campaign_thread                  │
│      │   (or create new campaign_thread if new conversation)        │
│      ├─ INSERT ig_dm_thread_state (READY_FOR_CAMPAIGN_ASSOCIATION)  │
│      └─ Returns: Candidate{ig_dm_account_id=..., ig_dm_thread_id=…} │
│                                                                     │
│  ThreadProcessingCoordinatorWorkflow [SHARED, extended]             │
│      ├─ [skip] ensure_complete_thread_ingested (Gmail-only)         │
│      ├─ [skip] ThreadAttachmentExtractWorkflow (Gmail-only)         │
│      ├─ ThreadAssociateToCampaignWorkflow [shared, minimal changes] │
│      ├─ execute_campaign_workflows [shared]                         │
│      ├─ check_domain_and_classify [shared]                          │
│      ├─ ThreadResponseDraftWorkflow [shared, DM prompt variant]     │
│      └─ ThreadExtractMetricsWorkflow [shared]                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  OUTBOUND DM REPLY (optional extension)                             │
│                                                                     │
│  User approves draft in Cheerful UI                                 │
│      ↓                                                              │
│  IgDmSendReplyWorkflow (new)                                        │
│      ↓                                                              │
│  POST https://graph.facebook.com/v21.0/me/messages                  │
│      { recipient: {id: igsid}, message: {text: draft_body} }        │
│      access_token = page_access_token from user_ig_dm_account       │
│      ↓                                                              │
│  Update ig_dm_thread_state → WAITING_FOR_INBOUND                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 1. Authentication Flow

### 1.1 OAuth Setup (per Cheerful user)

**Step 1: Initiate Facebook Login**
```
GET /auth/instagram/authorize
→ Redirect to:
  https://www.facebook.com/v21.0/dialog/oauth
    ?client_id={CHEERFUL_APP_ID}
    &redirect_uri={CHEERFUL_CALLBACK_URL}
    &scope=instagram_basic,instagram_manage_messages,pages_manage_metadata,
           pages_show_list,pages_messaging,business_management
    &response_type=code
    &state={csrf_token}
```

**Step 2: Exchange code → short-lived user access token**
```
POST https://graph.facebook.com/v21.0/oauth/access_token
  ?client_id={APP_ID}
  &client_secret={APP_SECRET}
  &redirect_uri={CALLBACK_URL}
  &code={authorization_code}
→ { access_token: "...", expires_in: 5183944 }
```

**Step 3: Exchange → long-lived user token (60 days)**
```
GET https://graph.facebook.com/v21.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={APP_ID}
  &client_secret={APP_SECRET}
  &fb_exchange_token={short_lived_token}
→ { access_token: "EAAG...", expires_in: 5183944 }
```

**Step 4: Get connected FB Pages + Instagram account IDs**
```
GET https://graph.facebook.com/v21.0/me/accounts
  ?fields=id,name,instagram_business_account
  &access_token={long_lived_user_token}
→ [{ id: page_id, name: "...", instagram_business_account: { id: ig_account_id } }]
```

**Step 5: Get permanent page access token**
```
GET https://graph.facebook.com/v21.0/{page_id}
  ?fields=access_token
  &access_token={long_lived_user_token}
→ { access_token: "EAAG..." }  // Page tokens from long-lived user tokens do not expire
```

**Step 6: Subscribe page to webhooks**
```
POST https://graph.facebook.com/v21.0/{page_id}/subscribed_apps
  ?access_token={page_access_token}
  &subscribed_fields=messages,message_echoes
→ { success: true }
```

**Step 7: Store credentials**
```sql
INSERT INTO user_ig_dm_account (
    user_id, ig_account_id, page_id, page_name,
    page_access_token,   -- encrypted at rest (Supabase Vault / env-level encryption)
    token_expires_at,    -- NULL for permanent page tokens
    webhook_subscribed,  -- true after step 6
    created_at, updated_at
)
```

### 1.2 Token Lifecycle Management

| Token Type | Expiry | Renewal |
|-----------|--------|---------|
| Short-lived user token | ~1 hour | Implicit via OAuth redirect |
| Long-lived user token | 60 days | Re-exchange using `fb_exchange_token` |
| Page access token (from long-lived user token) | **Never expires** | Only if user revokes app permissions |

**Critical**: Page access tokens derived from long-lived user tokens (step 5) are documented as non-expiring by Meta. However, they become invalid if:
- The user removes Cheerful from Facebook's Connected Apps
- The user changes their Facebook password
- The Meta app's permissions are revoked

A token health check background job should periodically validate page tokens and alert the user if their connection needs re-authorization.

### 1.3 Required Permissions and App Review

| Permission | Required Access Level | Review Required |
|-----------|----------------------|----------------|
| `instagram_basic` | Standard | No |
| `instagram_manage_messages` | **Advanced Access** | **Yes** |
| `pages_manage_metadata` | Advanced Access | Yes |
| `pages_show_list` | Advanced Access | Yes |
| `pages_messaging` | Advanced Access | Yes |
| `business_management` | Advanced Access | Yes |

**App Review is the critical path blocker**. Until Advanced Access is granted, the integration can only be tested with users added as App Roles (Admin, Developer, Tester). Timeline: 2–10 business days per submission, with potential rejection cycles.

---

## 2. Webhook Handler

### 2.1 New FastAPI Endpoint

New file: `apps/backend/src/api/routes/webhooks/instagram.py`

```python
from fastapi import APIRouter, Request, Response, Query, BackgroundTasks, HTTPException
from fastapi.responses import PlainTextResponse
import hmac
import hashlib
import json
from src.config import settings
from src.temporal.client import get_temporal_client
from src.temporal.workflow.ig_dm_ingest_workflow import IgDmIngestWorkflow

router = APIRouter(prefix="/webhooks/instagram", tags=["webhooks"])


@router.get("")
async def verify_webhook(
    hub_mode: str = Query(alias="hub.mode"),
    hub_verify_token: str = Query(alias="hub.verify_token"),
    hub_challenge: str = Query(alias="hub.challenge"),
):
    """Meta webhook verification handshake (one-time setup)."""
    if hub_mode == "subscribe" and hub_verify_token == settings.IG_WEBHOOK_VERIFY_TOKEN:
        return PlainTextResponse(hub_challenge)
    raise HTTPException(status_code=403, detail="Invalid verify token")


@router.post("")
async def receive_webhook(request: Request, background_tasks: BackgroundTasks):
    """Receive Instagram DM events from Meta. Return 200 immediately, process async."""
    body = await request.body()

    # 1. Verify HMAC-SHA256 signature (must be before any processing)
    sig_header = request.headers.get("X-Hub-Signature-256", "")
    if not _verify_signature(body, sig_header):
        raise HTTPException(status_code=403, detail="Invalid signature")

    payload = json.loads(body)

    # 2. Return 200 immediately — process asynchronously
    background_tasks.add_task(_enqueue_webhook_events, payload)
    return Response(status_code=200)


def _verify_signature(payload: bytes, signature_header: str) -> bool:
    if not signature_header.startswith("sha256="):
        return False
    received = signature_header[7:]  # Strip "sha256=" prefix
    expected = hmac.new(
        settings.IG_APP_SECRET.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, received)


async def _enqueue_webhook_events(payload: dict):
    """Extract individual messaging events from the batched payload."""
    if payload.get("object") != "instagram":
        return  # Ignore non-Instagram events (defensive)

    temporal = await get_temporal_client()

    for entry in payload.get("entry", []):
        ig_account_id = entry["id"]
        for event in entry.get("messaging", []):
            mid = event.get("message", {}).get("mid")
            if not mid:
                continue  # Skip events without a message ID (postbacks, etc.)

            # Deduplication: use mid as idempotency key for Temporal workflow ID
            workflow_id = f"ig-dm-ingest-{mid}"
            await temporal.start_workflow(
                IgDmIngestWorkflow.run,
                args=[ig_account_id, event],
                id=workflow_id,
                task_queue=settings.TEMPORAL_TASK_QUEUE,
                id_reuse_policy="ALLOW_DUPLICATE_FAILED_ONLY",  # Skip if already succeeded
            )
```

### 2.2 Deduplication Strategy

**Temporal workflow ID** = `ig-dm-ingest-{mid}` provides idempotency at the workflow level:
- First delivery: workflow starts and runs
- Retry/duplicate delivery: `id_reuse_policy=ALLOW_DUPLICATE_FAILED_ONLY` skips re-execution if the workflow already completed successfully

**Fallback deduplication table** for the raw events (for auditability and replay):
```sql
CREATE TABLE ig_webhook_events (
    mid TEXT PRIMARY KEY,
    ig_account_id TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,    -- NULL = not yet processed
    payload JSONB NOT NULL
);
```

### 2.3 Registration in FastAPI Router

Add to `apps/backend/src/api/main.py`:
```python
from src.api.routes.webhooks.instagram import router as instagram_webhook_router
app.include_router(instagram_webhook_router)
```

---

## 3. Data Model Changes

### 3.1 New Tables

#### `user_ig_dm_account` — Account credentials (mirrors `user_gmail_account`)
```sql
CREATE TABLE user_ig_dm_account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ig_account_id TEXT NOT NULL,               -- Instagram Professional Account ID (IGPAID)
    page_id TEXT NOT NULL UNIQUE,              -- Linked Facebook Page ID
    page_name TEXT,                            -- Display name for UI
    page_access_token TEXT NOT NULL,           -- Encrypted; permanent page token
    token_expires_at TIMESTAMPTZ,              -- NULL = non-expiring
    webhook_subscribed BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, ig_account_id)
);

-- RLS: user can only see their own accounts
ALTER TABLE user_ig_dm_account ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_ig_dm_account_select ON user_ig_dm_account
    FOR SELECT USING (auth.uid() = user_id);
```

#### `ig_igsid_cache` — IGSID → username resolution cache
```sql
CREATE TABLE ig_igsid_cache (
    igsid TEXT PRIMARY KEY,                    -- Instagram Scoped User ID (sender.id)
    ig_account_id TEXT NOT NULL,               -- The business account receiving DMs
    username TEXT NOT NULL,                    -- Resolved @username
    display_name TEXT,                         -- Full name from Graph API
    profile_pic_url TEXT,
    resolved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ig_igsid_cache_username_idx ON ig_igsid_cache (ig_account_id, username);
```

Purpose: Avoid repeated Graph API calls for the same sender across multiple DMs. A background job refreshes stale entries (older than 7 days).

#### `ig_dm_message` — Individual DM messages (mirrors `gmail_message` / `smtp_message`)
```sql
CREATE TABLE ig_dm_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    mid TEXT NOT NULL UNIQUE,                  -- Meta message ID (dedup key)
    igsid TEXT NOT NULL,                       -- Sender's Instagram Scoped ID
    sender_username TEXT,                      -- Resolved username (from cache)
    direction TEXT NOT NULL                    -- 'inbound' | 'outbound'
        CHECK (direction IN ('inbound', 'outbound')),
    body_text TEXT,                            -- Message text (NULL for pure media)
    is_unsupported BOOLEAN NOT NULL DEFAULT FALSE,  -- voice/Reels/GIPHY
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    reply_to_mid TEXT,                         -- If this is a reply to another message
    reply_to_story_id TEXT,                    -- If replying to a Story
    attachments JSONB DEFAULT '[]',            -- [{type, url, downloaded_path}]
    ig_timestamp TIMESTAMPTZ NOT NULL,         -- Original Instagram timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Derived conversation key (ig_account_id + igsid = one conversation)
    -- No explicit conversation_id from the basic messaging API; derived from (ig_account_id, igsid)
    CONSTRAINT ig_dm_message_mid_unique UNIQUE (mid)
);

CREATE INDEX ig_dm_message_account_igsid_idx
    ON ig_dm_message (ig_dm_account_id, igsid, ig_timestamp DESC);
CREATE INDEX ig_dm_message_user_idx ON ig_dm_message (user_id);

ALTER TABLE ig_dm_message ENABLE ROW LEVEL SECURITY;
CREATE POLICY ig_dm_message_select ON ig_dm_message
    FOR SELECT USING (auth.uid() = user_id);
```

**Thread identity**: Instagram's Messaging API does not provide an explicit thread/conversation ID in the webhook payload. The implicit thread key is `(ig_dm_account_id, igsid)` — every message from the same `igsid` to the same `ig_dm_account` belongs to the same conversation thread. Cheerful should derive and store a `ig_dm_thread_id` as `CONCAT(ig_dm_account_id, '_', igsid)` or via a lookup in `ig_dm_conversation`.

Alternatively, fetch the explicit `conversation_id` from Graph API at first message:
```
GET /{ig_account_id}/conversations?user_id={igsid}&fields=id
→ { data: [{ id: "t_17841234567890" }] }
```
This ID (`t_...` prefix format) can be stored as the canonical thread ID.

#### `ig_dm_conversation` — Conversation/thread registry
```sql
CREATE TABLE ig_dm_conversation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id),
    igsid TEXT NOT NULL,                       -- Sender's IGSID
    meta_conversation_id TEXT,                 -- Graph API conversation ID (t_...)
    sender_username TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (ig_dm_account_id, igsid)           -- One conversation per sender per account
);
```

This table serves as the thread registry analogous to how `campaign_thread` tracks thread IDs. The `meta_conversation_id` column stores the `t_...` value from the Graph API for reference.

#### `ig_dm_thread_state` — Event-sourced state (mirrors `gmail_thread_state` / `smtp_thread_state`)
```sql
CREATE TABLE ig_dm_thread_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id),
    ig_dm_conversation_id UUID NOT NULL REFERENCES ig_dm_conversation(id),
    status TEXT NOT NULL,                      -- GmailThreadStatus values
    latest_message_at TIMESTAMPTZ NOT NULL,    -- Timestamp of triggering message (sort key)
    dm_window_expires_at TIMESTAMPTZ,          -- latest_message_at + 24h (for outbound)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (ig_dm_account_id, ig_dm_conversation_id, latest_message_at)
);

CREATE INDEX ig_dm_thread_state_account_conv_idx
    ON ig_dm_thread_state (ig_dm_account_id, ig_dm_conversation_id, latest_message_at DESC);
```

**Key difference from email**: `dm_window_expires_at = latest_message_at + INTERVAL '24 hours'`. The coordinator must check this before generating an outbound draft.

#### `ig_dm_llm_draft` — AI-generated DM drafts
```sql
CREATE TABLE ig_dm_llm_draft (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    ig_dm_thread_state_id UUID NOT NULL REFERENCES ig_dm_thread_state(id),
    ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id),
    ig_dm_conversation_id UUID NOT NULL REFERENCES ig_dm_conversation(id),
    draft_body_text TEXT NOT NULL,             -- No subject for DMs
    draft_model TEXT,                          -- Model used for generation
    draft_prompt_version TEXT,                 -- Langfuse prompt version
    correction_applied BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `latest_ig_dm_message_per_conversation` — Trigger-maintained denormalization
```sql
CREATE TABLE latest_ig_dm_message_per_conversation (
    ig_dm_conversation_id UUID PRIMARY KEY REFERENCES ig_dm_conversation(id),
    ig_dm_message_id UUID NOT NULL REFERENCES ig_dm_message(id),
    sender_username TEXT,
    body_text TEXT,
    direction TEXT,
    ig_timestamp TIMESTAMPTZ NOT NULL
);

-- Trigger: update on INSERT to ig_dm_message
CREATE OR REPLACE FUNCTION update_latest_ig_dm_message()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO latest_ig_dm_message_per_conversation
        (ig_dm_conversation_id, ig_dm_message_id, sender_username, body_text, direction, ig_timestamp)
    SELECT
        c.id, NEW.id, NEW.sender_username, NEW.body_text, NEW.direction, NEW.ig_timestamp
    FROM ig_dm_conversation c
    WHERE c.ig_dm_account_id = NEW.ig_dm_account_id AND c.igsid = NEW.igsid
    ON CONFLICT (ig_dm_conversation_id) DO UPDATE SET
        ig_dm_message_id = EXCLUDED.ig_dm_message_id,
        sender_username = EXCLUDED.sender_username,
        body_text = EXCLUDED.body_text,
        direction = EXCLUDED.direction,
        ig_timestamp = EXCLUDED.ig_timestamp
    WHERE EXCLUDED.ig_timestamp > latest_ig_dm_message_per_conversation.ig_timestamp;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_latest_ig_dm_message
    AFTER INSERT ON ig_dm_message
    FOR EACH ROW EXECUTE FUNCTION update_latest_ig_dm_message();
```

### 3.2 Modified Tables

#### `campaign_thread` — Add IG DM column
```sql
ALTER TABLE campaign_thread
    ADD COLUMN ig_dm_conversation_id UUID REFERENCES ig_dm_conversation(id);

-- Extend the check constraint to include IG DM path
ALTER TABLE campaign_thread DROP CONSTRAINT chk_campaign_thread_one_thread_id;
ALTER TABLE campaign_thread ADD CONSTRAINT chk_campaign_thread_one_thread_id CHECK (
    (gmail_thread_id IS NOT NULL AND email_thread_id IS NULL AND ig_dm_conversation_id IS NULL) OR
    (gmail_thread_id IS NULL AND email_thread_id IS NOT NULL AND ig_dm_conversation_id IS NULL) OR
    (gmail_thread_id IS NULL AND email_thread_id IS NULL AND ig_dm_conversation_id IS NOT NULL)
);
```

#### `campaign_sender` — Add IG DM account column
```sql
ALTER TABLE campaign_sender
    ADD COLUMN ig_dm_account_id UUID REFERENCES user_ig_dm_account(id);

-- Extend check constraint for 3-way mutual exclusivity
ALTER TABLE campaign_sender DROP CONSTRAINT chk_campaign_sender_one_account;
ALTER TABLE campaign_sender ADD CONSTRAINT chk_campaign_sender_one_account CHECK (
    (gmail_account_id IS NOT NULL AND smtp_account_id IS NULL AND ig_dm_account_id IS NULL) OR
    (gmail_account_id IS NULL AND smtp_account_id IS NOT NULL AND ig_dm_account_id IS NULL) OR
    (gmail_account_id IS NULL AND smtp_account_id IS NULL AND ig_dm_account_id IS NOT NULL)
);
```

Note: "campaign_sender" for IG DMs has a different semantic meaning — it's the IG account that *receives* DMs, not sends them. The "sender" naming is an email artifact.

#### `campaign_creator` — Add IGSID for direct DM matching
```sql
ALTER TABLE campaign_creator ADD COLUMN ig_igsid TEXT;
CREATE INDEX idx_campaign_creator_ig_igsid ON campaign_creator(ig_igsid)
    WHERE ig_igsid IS NOT NULL;
```

Populated at first DM event: when a creator's IGSID is matched to a `campaign_creator` row, cache the IGSID directly on the row to avoid future handle-resolution overhead.

#### `thread_flag` — Add IG DM conversation column
```sql
ALTER TABLE thread_flag
    ADD COLUMN ig_dm_conversation_id UUID REFERENCES ig_dm_conversation(id);

-- Extend the mutual exclusivity check constraint
```

---

## 4. Temporal Workflow Changes

### 4.1 New Workflows and Activities

#### `IgDmIngestWorkflow` — Entry point for each DM message
```python
# apps/backend/src/temporal/workflow/ig_dm_ingest_workflow.py

@workflow.defn
class IgDmIngestWorkflow:
    @workflow.run
    async def run(self, ig_account_id: str, event: dict) -> None:
        # Activity 1: Parse, deduplicate, and store the DM message
        result = await workflow.execute_activity(
            ig_dm_ingest_activity,
            args=[ig_account_id, event],
            schedule_to_close_timeout=timedelta(minutes=5),
            retry_policy=RetryPolicy(maximum_attempts=3),
        )
        if result.skipped:
            return  # Duplicate, echo, or unsupported — stop here

        # Activity 2 (optional): Download media attachments before URLs expire
        if result.has_attachments:
            await workflow.execute_activity(
                ig_dm_download_media_activity,
                args=[result.ig_dm_message_id],
                schedule_to_close_timeout=timedelta(minutes=10),
            )

        # Start thread sync workflow (fire-and-forget)
        await workflow.execute_child_workflow(
            IgDmThreadSyncWorkflow.run,
            args=[result.ig_dm_account_id, result.igsid],
            id=f"ig-dm-thread-sync-{result.ig_dm_account_id}-{result.igsid}",
            parent_close_policy=ParentClosePolicy.ABANDON,
        )
```

#### `ig_dm_ingest_activity` — Core message processing
```python
# apps/backend/src/temporal/activity/ig_dm_ingest_activity.py

@activity.defn
async def ig_dm_ingest_activity(ig_account_id: str, event: dict) -> IgDmIngestResult:
    msg = event.get("message", {})
    mid = msg.get("mid")
    igsid = event["sender"]["id"]
    recipient_id = event["recipient"]["id"]

    # 1. Filter: echo (outbound sent via API)
    if msg.get("is_echo"):
        # Store as outbound message for thread completeness, but don't trigger processing
        # ... insert with direction='outbound' ...
        return IgDmIngestResult(skipped=True, reason="echo")

    # 2. Filter: unsupported message type (voice, Reels, GIPHY)
    if msg.get("is_unsupported"):
        # Store tombstone record so thread history is complete
        # ... insert with is_unsupported=True, body_text=None ...
        return IgDmIngestResult(skipped=True, reason="unsupported")

    # 3. Resolve IGSID → username (with caching)
    username = await _resolve_igsid_with_cache(igsid, ig_account_id)

    # 4. Resolve ig_dm_account_id from ig_account_id
    ig_dm_account = await ig_dm_account_repo.get_by_ig_account_id(ig_account_id)
    if not ig_dm_account:
        logger.warning(f"Received DM for unknown ig_account_id={ig_account_id}")
        return IgDmIngestResult(skipped=True, reason="unknown_account")

    # 5. Upsert conversation record
    conversation = await ig_dm_conversation_repo.upsert(
        ig_dm_account_id=ig_dm_account.id,
        igsid=igsid,
        sender_username=username,
    )

    # 6. Insert message (idempotent: ON CONFLICT DO NOTHING on mid)
    ig_dm_message = await ig_dm_message_repo.insert_if_not_exists(
        ig_dm_account_id=ig_dm_account.id,
        user_id=ig_dm_account.user_id,
        mid=mid,
        igsid=igsid,
        sender_username=username,
        direction="inbound",
        body_text=msg.get("text"),
        attachments=_parse_attachments(msg.get("attachments", [])),
        reply_to_mid=msg.get("reply_to", {}).get("mid"),
        reply_to_story_id=msg.get("reply_to", {}).get("story", {}).get("id"),
        ig_timestamp=datetime.fromtimestamp(event["timestamp"], tz=timezone.utc),
    )

    return IgDmIngestResult(
        skipped=False,
        ig_dm_message_id=ig_dm_message.id,
        ig_dm_account_id=ig_dm_account.id,
        igsid=igsid,
        has_attachments=bool(msg.get("attachments")),
    )


async def _resolve_igsid_with_cache(igsid: str, ig_account_id: str) -> str | None:
    cached = await ig_igsid_cache_repo.get(igsid, ig_account_id)
    if cached and (now() - cached.last_updated_at) < timedelta(days=7):
        return cached.username

    # Graph API call: GET /{igsid}?fields=name,username
    try:
        result = await graph_api_client.get_user_profile(igsid, ig_account_id)
        await ig_igsid_cache_repo.upsert(igsid, ig_account_id, result.username, result.name)
        return result.username
    except GraphAPIException as e:
        logger.warning(f"Could not resolve IGSID {igsid}: {e}")
        return None  # Proceed without username; resolved later
```

#### `IgDmThreadSyncWorkflow` — Thread state creation (mirrors `ThreadSyncWorkflow`)
```python
@workflow.defn
class IgDmThreadSyncWorkflow:
    @workflow.run
    async def run(self, ig_dm_account_id: UUID, igsid: str) -> None:
        # Create thread state records for new messages
        candidates = await workflow.execute_activity(
            batch_insert_ig_dm_state_and_get_candidates_activity,
            args=[ig_dm_account_id, igsid],
            schedule_to_close_timeout=timedelta(minutes=5),
        )

        for candidate in candidates:
            await workflow.execute_child_workflow(
                ThreadProcessingCoordinatorWorkflow.run,
                args=[candidate],
                id=f"thread-coordinator-ig-{candidate.state_id}",
                parent_close_policy=ParentClosePolicy.ABANDON,
            )
```

#### `batch_insert_ig_dm_state_and_get_candidates_activity`
```python
@activity.defn
async def batch_insert_ig_dm_state_and_get_candidates_activity(
    ig_dm_account_id: UUID,
    igsid: str,
) -> list[Candidate]:
    # Find messages without a corresponding thread state
    new_messages = await ig_dm_message_repo.get_without_state(ig_dm_account_id, igsid)

    candidates = []
    for msg in new_messages:
        # Get or create campaign_thread for this conversation
        conversation = await ig_dm_conversation_repo.get_by_account_and_igsid(
            ig_dm_account_id, igsid
        )

        # Check if this conversation is already linked to a campaign
        campaign_thread = await campaign_thread_repo.get_by_ig_dm_conversation(
            conversation.id
        )

        # Create thread state row
        state = await ig_dm_thread_state_repo.insert(
            user_id=msg.user_id,
            ig_dm_account_id=ig_dm_account_id,
            ig_dm_conversation_id=conversation.id,
            status=GmailThreadStatus.READY_FOR_CAMPAIGN_ASSOCIATION,
            latest_message_at=msg.ig_timestamp,
            dm_window_expires_at=msg.ig_timestamp + timedelta(hours=24),
        )

        candidates.append(Candidate(
            state__id=state.id,
            ig_dm_account_id=ig_dm_account_id,
            ig_dm_conversation_id=conversation.id,
            gmail_account_id=None,
            smtp_account_id=None,
            user_id=msg.user_id,
            campaign_id=campaign_thread.campaign_id if campaign_thread else None,
            latest_gmail_message__direction=GmailMessageDirection.INBOUND,
        ))

    return candidates
```

### 4.2 Changes to Existing Workflows

#### `ThreadProcessingCoordinatorWorkflow` — Add IG DM branch

The coordinator needs a third discriminator branch. Key changes (file: `temporal/workflow/thread_processing_coordinator_workflow.py`):

```python
# Existing discriminator pattern:
if candidate.gmail_account_id is not None:
    # Gmail path
elif candidate.smtp_account_id is not None:
    # SMTP path
elif candidate.ig_dm_account_id is not None:  # NEW
    # Instagram DM path
    await self._process_ig_dm_thread(candidate)

async def _process_ig_dm_thread(self, candidate: Candidate):
    # Skip: ensure_complete_thread_ingested (Gmail-only — IG DMs arrive message-by-message)
    # Skip: ThreadAttachmentExtractWorkflow (Gmail-only)

    # Check 24-hour window before proceeding
    state = await workflow.execute_activity(get_ig_dm_thread_state_activity, candidate)
    if state.dm_window_expires_at < now() and not state.human_agent_active:
        # Window closed — cannot send DM reply; mark for email follow-up or skip
        await self._update_state(GmailThreadStatus.WAITING_FOR_INBOUND)
        return

    # Campaign association [SHARED — requires IG DM → creator → campaign path]
    await workflow.execute_child_workflow(
        ThreadAssociateToCampaignWorkflow.run, candidate
    )

    # Shared: execute_campaign_workflows, check_domain_and_classify
    # ...

    # ThreadResponseDraftWorkflow with DM prompt variant
    await workflow.execute_child_workflow(
        ThreadResponseDraftWorkflow.run,
        args=[candidate, DraftChannel.INSTAGRAM_DM],  # NEW: channel discriminator
    )
```

#### `ThreadResponseDraftWorkflow` — Channel-aware prompt selection

```python
# New channel discriminator in draft workflow
if draft_channel == DraftChannel.INSTAGRAM_DM:
    prompt_name = f"drafting/dm-reply-{campaign_type}"
    rag_table = "ig_reply_examples"
    max_length = 280  # Instagram DM practical limit
    include_subject = False
else:
    prompt_name = f"drafting/reply-drafting-{campaign_type}"
    rag_table = "email_reply_examples"
    include_subject = True
```

#### `ThreadAssociateToCampaignWorkflow` — IG DM campaign matching

The existing campaign association workflow uses email address as the matching key. For IG DMs, a new matching path is needed:

```python
if candidate.ig_dm_account_id is not None:
    # IG DM campaign association:
    # 1. Get conversation's sender_username
    # 2. Find campaign_creator rows matching by:
    #    a. ig_igsid = igsid (fastest — cached after first match)
    #    b. social_media_handles @> [{"platform":"instagram","handle":username}] (GIN index)
    #    c. LLM disambiguation if multiple campaigns match
    # 3. If no match: flag for manual campaign assignment in UI
```

---

## 5. Creator Identity Resolution Flow

Based on `current-creator-identity.md` analysis, the recommended approach for this option is a **two-phase resolution**:

### Phase 1: IGSID Cache (fast path)
```
Webhook arrives (sender.igsid = "1784140000123")
    ↓
SELECT from ig_igsid_cache WHERE igsid = "1784140000123" AND ig_account_id = ...
    ↓ (cache hit, <7 days old)
username = "fitness_creator_jane"
    ↓
SELECT from campaign_creator WHERE ig_igsid = "1784140000123" AND campaign_id IN (user's campaigns)
    ↓ (if found)
MATCH → campaign_creator.id
```

### Phase 2: Handle-Based Match (first-DM path)
```
IGSID not in cache, OR ig_igsid not set on campaign_creator
    ↓
GET /{igsid}?fields=username,name → "janedoe"
    ↓
INSERT/UPDATE ig_igsid_cache
    ↓
SELECT from campaign_creator WHERE
    social_media_handles @> '[{"platform":"instagram","handle":"janedoe"}]'::jsonb
    AND campaign_id IN (user's campaigns)
    ↓
Multiple matches → LLM disambiguation
Zero matches → flag as "unmatched DM" in UI for manual campaign assignment
One match → UPDATE campaign_creator SET ig_igsid = "..." + associate to campaign
```

### Campaign Disambiguation (when multiple campaigns match)
For a user with multiple active campaigns, the DM sender might match campaign_creator rows in several. Resolution strategies (in priority order):
1. If only one campaign has an active `user_ig_dm_account` linked → use that campaign
2. If the conversation already has a `campaign_thread` entry → use that campaign
3. LLM inference from DM text content → classify which campaign topic it references
4. UI prompt → "This DM from @janedoe could be about [Campaign A] or [Campaign B]. Which campaign does this belong to?"

---

## 6. UI Changes

### 6.1 Instagram Account Settings Page

New settings section: `/settings/instagram-accounts`
- List connected Instagram Business accounts (from `user_ig_dm_account`)
- "Connect Instagram Account" button → initiates Meta OAuth flow
- Status indicator: connected / token expired / needs re-auth
- Webhook subscription status

### 6.2 Inbox Integration

**Recommended approach**: Option A from `current-inbox-ui.md` — extend `GmailThread` with channel discriminator and conditional rendering.

New field additions to `GmailThread`:
```typescript
interface GmailThread {
  // ... existing fields ...
  channel: 'email' | 'instagram_dm';    // NEW
  senderHandle?: string;                 // NEW: @username for DMs
  igDmWindowExpiresAt?: string;         // NEW: 24h window for DMs
}
```

**Changes in `mail-list.tsx`**:
- Thread list item: hide subject line row when `channel === 'instagram_dm'`
- Show `@${senderHandle}` instead of `senderEmail` in tooltip
- Add DM window expiry indicator badge (amber/red as window closes)
- Account filter: add IG account entries alongside Gmail accounts

**Changes in `mail-display.tsx`**:
- Thread header: show `@username` + Instagram icon instead of `<email@domain.com>`; hide subject subtitle
- Reply composer: when `channel === 'instagram_dm'`:
  - Replace `EmailRichTextEditor` (Tiptap HTML) → plain `<textarea>` with character count
  - Remove TO/CC recipient editor; show static "Replying to @username"
  - Remove Reply-All toggle
  - Remove Schedule Send (or replace with 24h window countdown)
  - Restrict attachments to image/video only
- Message renderer: skip `bodyHtml` branch; use plain-text rendering only
- Add 24-hour DM window indicator in thread header area

**New UI components** (all new files):
- `DmWindowIndicator` — countdown showing remaining time in 24h DM response window
- `DmComposer` — plain-text reply composer for DM threads (replaces EmailRichTextEditor)
- `IgChannelBadge` — small Instagram icon badge in thread list and detail header
- `IgAccountConnectCard` — OAuth connection card in settings

### 6.3 Backend API Changes

New API endpoint for inbox queries that includes IG DM threads:
```
GET /api/threads?include_ig_dm=true&ig_dm_account_ids=...
```
OR: extend existing `GET /api/threads` to include `ig_dm_threads` in response payload alongside `gmail_threads` / `smtp_threads`.

New API endpoint for sending DM replies (used by DmComposer):
```
POST /api/ig-dm/send
Body: { ig_dm_account_id, igsid, body_text, reply_to_mid? }
```

---

## 7. AI Drafting Adaptations

Based on `current-ai-drafting.md`:

### Minimal Changes Required
- `ResponseDraftResult.subject` → `Optional[str]` (nullable)
- `ThreadResponseDraftWorkflow` → pass channel discriminator to select prompt variant
- Thread context XML format → DM variant (no `<subject>`, `<to>`, `<cc>`; add `<channel>`, `<window_expires_at>`)

### New Langfuse Prompts (9 new)
```
drafting/dm-reply-paid-promotion
drafting/dm-reply-gifting
drafting/dm-reply-sales
drafting/dm-reply-general
drafting/dm-reply-v1-rag-paid-promotion
drafting/dm-reply-v1-rag-gifting
drafting/dm-reply-v1-rag-sales
drafting/dm-reply-v1-rag-general
drafting/dm-window-reopener  (optional: sends a "ping" DM to re-open expired window)
```

### RAG Extension
New table `ig_reply_examples` (parallel to `email_reply_examples`):
- Populated after operators send DM replies via Cheerful
- `RagService` gains `fetch_dm_examples()` method
- Zero impact on existing email RAG pipeline

---

## 8. Effort Estimate

### Phase 1: Foundation (Backend, ~5–8 days)
| Task | Effort |
|------|--------|
| Meta App creation, permissions configuration | 1 day |
| Instagram OAuth flow (new `user_ig_dm_account` table + API route) | 2 days |
| Webhook endpoint (FastAPI: verify + receive + enqueue) | 1 day |
| DB migrations (7 new tables, 3 modified tables) | 1 day |
| `ig_dm_ingest_activity` (parse + cache IGSID + store message) | 2 days |
| IGSID resolution with caching | 1 day |

### Phase 2: Thread Processing (Backend, ~6–9 days)
| Task | Effort |
|------|--------|
| `IgDmThreadSyncWorkflow` + state activity | 2 days |
| Extend `Candidate` object with IG DM discriminator | 0.5 days |
| Extend `ThreadProcessingCoordinatorWorkflow` with IG DM branch | 2 days |
| Creator identity resolution (IGSID → campaign_creator matching) | 2 days |
| Campaign disambiguation logic | 1.5 days |
| `IgDmSendReplyWorkflow` (outbound reply via Graph API) | 1 day |

### Phase 3: AI Drafting (Backend, ~3–4 days)
| Task | Effort |
|------|--------|
| 9 new Langfuse prompt objects | 1 day |
| `ThreadResponseDraftWorkflow` channel discriminator | 1 day |
| DM thread context XML format | 0.5 days |
| `ig_reply_examples` RAG table + `RagService` extension | 1 day |
| DM-specific `ReplySanitizer` patterns | 0.5 days |

### Phase 4: UI (Frontend, ~5–7 days)
| Task | Effort |
|------|--------|
| IG account settings page + OAuth connection UI | 2 days |
| `GmailThread` type extension (channel discriminator) | 0.5 days |
| Thread adapter for IG DM threads | 1 day |
| `mail-list.tsx` changes (hide subject, add DM badge, account filter) | 1 day |
| `mail-display.tsx` changes (header, composer, plain text renderer) | 2 days |
| `DmWindowIndicator` component | 0.5 days |

### Phase 5: App Review + Testing (Variable, ~5–20 days)
| Task | Effort |
|------|--------|
| Meta App Review submission (screenshots, privacy policy, screencast) | 2 days |
| App Review waiting period | 2–10 business days (blocking — external) |
| Integration testing with real Instagram accounts | 2–3 days |
| Edge case handling (token revocation, missed webhooks, unsupported types) | 2 days |

### **Total Estimate**
- **Code + implementation**: ~20–28 engineering days
- **Total calendar time** (including App Review): 6–10 weeks
- **Relative sizing**: Large

---

## 9. Constraints and Limitations

### Hard Constraints

| Constraint | Impact |
|------------|--------|
| **App Review required** | Blocking until Meta approves Advanced Access; 2–10 days minimum per submission; rejection extends timeline |
| **Facebook Page linkage required** | Every Cheerful customer's Instagram account must be linked to a FB Page; adds friction to user onboarding |
| **24-hour outbound messaging window** | Cannot send AI-drafted DM replies if creator hasn't messaged in 24h; requires window-tracking in state machine |
| **IGSID opacity** | Sender identity requires an extra Graph API call per new contact; adds latency and rate limit overhead |
| **200 DMs/hour send limit** | Post-October 2024 reduction; inbound capture is unaffected but outbound at scale could hit this |
| **No explicit conversation ID in webhooks** | Thread identity must be derived from `(ig_dm_account_id, igsid)` pair or fetched separately from Graph API |

### Operational Constraints

| Constraint | Impact |
|------------|--------|
| Webhook downtime = missed events | Meta drops events after retry exhaustion (~24h); webhook receiver must be highly available |
| Ephemeral media URLs | Attachment URLs expire; media must be downloaded immediately upon receipt |
| Development mode restrictions | Until App Review, only explicitly added App Role users can test; limits beta testing |
| Token health management | Page tokens invalidated if user revokes app; requires detection + re-auth flow |
| Out-of-order delivery | Events may arrive out of order; use `ig_timestamp` for sequencing within a conversation |

### Functional Limitations (Instagram DM API)

| Feature | Status |
|---------|--------|
| Voice messages | Not exposed — `is_unsupported: true` |
| Reels DM replies | Not exposed — `is_unsupported: true` |
| Group DMs | Not accessible via API |
| Personal account DMs | API requires Business/Creator account |
| GIPHYs | Not exposed |
| Scheduling outbound DMs | No native support (unlike email schedule-send) |
| Message editing | Not exposed via API |
| Reactions | Not exposed via standard messages webhook |

---

## 10. Risks and Mitigations

| Risk | Severity | Likelihood | Mitigation |
|------|----------|-----------|------------|
| **App Review rejection** | High | Medium | Submit early; have thorough screencasts and privacy policy; expect 1–2 rejection cycles |
| **Meta API policy changes** | High | Low | API is mature (2021+); but October 2024 rate limit reduction shows Meta can change rules; avoid deep coupling to specific API details where possible |
| **Creator identity gap** | High | High | Many campaign_creators lack Instagram handles; new DMs may not match any campaign; need robust "unmatched DM" inbox + manual assignment flow |
| **Facebook Page requirement friction** | Medium | High | Many Instagram Business accounts are not linked to FB Pages; users need guided setup flow |
| **Campaign disambiguation failures** | Medium | High | Users with multiple campaigns may have ambiguous DM matching; need UI-assisted resolution |
| **Webhook delivery failures** | Medium | Low | Meta's retry handles transient failures; implement a reconciliation job using Graph API `/conversations` for recovery |
| **24-hour window violations** | Medium | Medium | If Cheerful auto-sends a draft reply but the window has closed (race condition), the API call will fail; must handle gracefully and notify user |
| **Token revocation** | Medium | Low | Users can revoke app access on Facebook; need health check job and re-auth notification |
| **IGSID resolution rate limits** | Low | Low | At typical creator-outreach scale (100s of unique senders), rate limits are not a concern; cache mitigates repeat calls |

---

## 11. Compatibility with Cheerful's Existing Architecture

### Temporal Workflows
**Compatible**. Instagram DM pipeline follows the same Temporal workflow pattern:
- `IgDmIngestWorkflow` mirrors `ProcessAccountMessagesWorkflow` (Gmail)
- `IgDmThreadSyncWorkflow` mirrors `ThreadSyncWorkflow` / `SmtpThreadSyncWorkflow`
- `ThreadProcessingCoordinatorWorkflow` extended with new branch (same coordinator)
- Same `Candidate` discriminator pattern extended with `ig_dm_account_id`
- Same `GmailThreadStatus` enum (already shared between Gmail+SMTP)

### Event-Sourced State
**Compatible**. `ig_dm_thread_state` follows same append-only pattern as `gmail_thread_state` and `smtp_thread_state`. One new dimension: `dm_window_expires_at` column specific to DMs.

### Supabase / PostgreSQL
**Compatible**. All new tables use same Supabase RLS + auth.users FK pattern. pgvector for RAG (`ig_reply_examples`) follows same pattern as `email_reply_examples`.

### FastAPI Backend
**Compatible**. New webhook endpoint is an additive route. Same FastAPI patterns (BackgroundTasks for async processing, Pydantic models, SQLAlchemy Core for DB access).

### Frontend (Next.js / TanStack Query)
**Compatible with changes**. Existing `GmailThread` type is extended (not replaced). TanStack Query hooks get new endpoints added. Existing email inbox remains unchanged alongside new DM inbox capabilities.

### AI / LLM Pipeline
**Compatible**. `LlmService`, `EmbeddingService`, `ClaudeAgentService` require zero changes. New Langfuse prompt objects follow existing naming conventions. `RagService` gets new method (additive).

---

## 12. Compatibility with Architecture Pattern Options

This option (Direct Meta API) is **compatible with both** Wave 3 architecture pattern options:

| Architecture Pattern | Compatibility |
|---------------------|--------------|
| `option-parallel-tables` (add `ig_dm_*` tables) | **Direct match** — this option proposes the parallel tables approach as the data model |
| `option-channel-abstraction` (generic channel layer) | **Compatible** — the Direct Meta API provides the ingest mechanism regardless of whether the data model is parallel tables or an abstracted channel layer |

The data model described in section 3 of this option follows the **parallel tables** pattern. The same webhook handler, auth flow, and Temporal activities would work equally well if the data model were refactored to use a generic channel abstraction layer.

---

## 13. Summary

**What this option is**:
Direct integration with Meta's Instagram Messaging API using webhooks as the primary delivery mechanism. Cheerful builds and maintains its own Meta App, handles OAuth, receives webhooks, and processes DMs through Temporal workflows into a third channel path alongside Gmail and SMTP.

**Key advantages**:
- No vendor lock-in beyond Meta itself (inevitable for any IG DM approach)
- Full access to all message metadata (IGSID, mid, timestamps, attachments, story replies)
- Lowest per-message cost (no third-party per-message fees)
- Full control over data handling and storage
- Natural extension of existing Temporal workflow architecture
- AI drafting integrates directly with existing pipeline

**Key disadvantages**:
- App Review is a blocking prerequisite (2–10+ days, external dependency)
- Facebook Page linkage requirement adds onboarding friction
- Creator identity resolution requires significant new logic (IGSID cache, handle matching, campaign disambiguation)
- Largest implementation scope of any option (~20–28 engineering days)
- Meta can change API terms, rate limits, or access policies unilaterally

**Best suited for**: Teams who expect to scale IG DM handling significantly, have internal capacity for Meta App Review, and want to minimize ongoing third-party costs. This is the "own the stack" option.
