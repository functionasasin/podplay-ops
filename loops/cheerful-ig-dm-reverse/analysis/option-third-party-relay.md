# Option: Third-Party Relay via Bird (formerly MessageBird)

**Aspect**: `option-third-party-relay`
**Wave**: 3 — Options Cross-Product
**Date**: 2026-02-28
**References**:
- Wave 1: `third-party-messagebird-bird.md`, `third-party-manychat.md`, `third-party-others.md`, `meta-instagram-messaging-api.md`, `meta-webhooks-realtime.md`
- Wave 2: `current-thread-model.md`, `current-email-pipeline.md`, `current-creator-identity.md`, `current-inbox-ui.md`, `current-ai-drafting.md`

---

## Overview

This option routes Instagram DM ingestion through **Bird** (formerly MessageBird) as a middleware layer between Meta's APIs and Cheerful's backend. Bird is a developer-first omnichannel messaging platform that has already completed Meta's App Review for Instagram messaging permissions. It exposes clean webhook and REST API surfaces that align naturally with Cheerful's event-sourced architecture.

**Why Bird, not the other third-party options?** The Wave 1 survey (`third-party-others.md`) evaluated Sendbird, Twilio, Zendesk Sunshine Conversations, Intercom, Freshdesk, Chatwoot, and Trengo. All of them are destination platforms (support desks, ticketing systems) that ingest Instagram DMs into their own data stores for human agents — none are designed as transparent relays to external systems. Bird is the only platform in the third-party landscape with an **explicitly relay-oriented design**: per-message webhook delivery, full sender metadata (including IGSID equivalent), bidirectional send/receive, and a developer-first API. ManyChat was also evaluated and rejected for this role due to flow-gated forwarding (not all DMs captured), text-only content access, no thread/message IDs, and significant creator onboarding friction.

**Core premise**: Cheerful registers a Bird workspace and connects each creator's Instagram Business account as a separate Bird channel. Bird manages the Meta webhook subscription and delivers all inbound DMs to Cheerful via its own webhook. Cheerful handles thread mapping, creator resolution, AI drafting, and reply sending (via Bird's Channels API). No Meta App Review is required on Cheerful's side.

---

## End-to-End Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  SETUP PHASE (one-time — Cheerful operator)                          │
│                                                                      │
│  1. Create Bird workspace account                                    │
│  2. Configure Bird Channels API webhook endpoint:                    │
│     POST https://api.cheerful.com/webhooks/bird-ig-dm               │
│  3. Store Bird API credentials in Cheerful environment:              │
│     BIRD_API_KEY, BIRD_WORKSPACE_ID                                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  CREATOR ONBOARDING PHASE (per Cheerful user, one-time per creator) │
│                                                                      │
│  Cheerful UI → Settings → Instagram Connect                          │
│      ↓                                                               │
│  Cheerful backend calls Bird to initiate Instagram channel creation  │
│  POST https://api.bird.com/workspaces/{workspaceId}/channels        │
│  → { "type": "instagram", ... }                                      │
│      ↓                                                               │
│  Bird returns OAuth redirect URL                                     │
│      ↓                                                               │
│  Creator completes Meta OAuth (Facebook Login → authorize IG acct)  │
│  (same UX as direct Meta OAuth; Bird manages the app consent)        │
│      ↓                                                               │
│  Bird registers the Instagram channel, assigns channelId             │
│      ↓                                                               │
│  Cheerful stores: ig_dm_account (user_id, bird_channel_id, ig_acct) │
│  Bird begins receiving Meta webhooks for this IG account             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  INBOUND PATH (per creator DM, real-time)                            │
│                                                                      │
│  Creator sends DM on Instagram                                       │
│      ↓ (Meta webhook → Bird platform, ~50ms)                        │
│  Bird normalizes to Channels API event format                        │
│      ↓ (Bird webhook → HTTP POST, ~100ms)                           │
│  POST /webhooks/bird-ig-dm                                           │
│      ├─ Verify Bird signing header                                    │
│      ├─ Parse: sender_id, conversation_id, message_body, message_id │
│      ├─ Respond 200 immediately (async processing)                   │
│      └─ Enqueue: start Temporal workflow                             │
│             ↓                                                        │
│      IgDmIngestWorkflow (Temporal)                                   │
│      ├─ Resolve sender: IGSID → campaign_creator                    │
│      ├─ Upsert ig_dm_thread (keyed by bird_conversation_id)         │
│      ├─ INSERT ig_dm_message (ON CONFLICT DO NOTHING)               │
│      ├─ INSERT ig_dm_thread_state (READY_FOR_CAMPAIGN_ASSOCIATION)  │
│      └─ Fire ThreadProcessingCoordinatorWorkflow (existing)         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  COORDINATOR PHASE (shared with Gmail/SMTP, minimal changes)        │
│                                                                      │
│  ThreadProcessingCoordinatorWorkflow                                 │
│  ├─ Campaign association (LLM, same as email path)                   │
│  ├─ AI draft generation (DM-format prompt variant)                   │
│  ├─ WAITING_FOR_DRAFT_REVIEW → Cheerful inbox UI                    │
│  └─ On user approve: IgDmSendReplyActivity                          │
│         ↓                                                            │
│  POST api.bird.com/workspaces/{wId}/channels/{chId}/messages        │
│         ↓ (Bird → Meta Messaging API)                               │
│  Creator receives reply DM on Instagram                              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Auth Flow Detail

### Setup: Bird Workspace & Webhook

Bird uses a workspace model. Cheerful operates **one Bird workspace** for all creators. This is Option A from the Bird analysis — the most operationally viable model:

```
Cheerful's Bird workspace
├── Channel: creator_A instagram account  (channelId: ch_aaa)
├── Channel: creator_B instagram account  (channelId: ch_bbb)
└── Channel: creator_C instagram account  (channelId: ch_ccc)
```

Cheerful configures one workspace-level webhook endpoint that receives events from all channels. Each event payload includes the `channelId`, allowing Cheerful to route to the correct `ig_dm_account` record.

**Webhook registration** (one-time setup):
```http
POST https://api.bird.com/workspaces/{workspaceId}/webhooks
Authorization: AccessKey {bird_api_key}
Content-Type: application/json

{
  "url": "https://api.cheerful.com/webhooks/bird-ig-dm",
  "events": ["instagram.inbound"],
  "signingKey": "{generated_signing_key}"
}
```

### Creator Onboarding: Instagram Channel OAuth

When a Cheerful user connects an Instagram account:

1. **Cheerful backend → Bird**: Create a new Instagram channel for this workspace
2. **Bird → Cheerful**: Returns a hosted OAuth URL pointing to Meta's authorization page (Bird's Meta app)
3. **Creator → Meta OAuth**: Creator clicks the link and completes Instagram Business account authorization
4. **Bird callback**: Instagram account is now connected as a channel in Cheerful's workspace
5. **Cheerful stores**:
   ```sql
   INSERT INTO ig_dm_account (user_id, bird_channel_id, instagram_account_id, ig_username, created_at)
   VALUES (...);
   ```

**Creator UX**: One OAuth flow (equivalent to Google OAuth for Gmail). The creator doesn't create a Bird account — they only authorize via the familiar Meta/Instagram OAuth consent screen.

**Auth token management**: Bird manages the Instagram access token and refresh lifecycle. Cheerful stores only the `bird_channel_id` as its reference. No direct Meta access token is stored in Cheerful's database for this option.

---

## Webhook Handler

**New FastAPI endpoint**: `apps/backend/src/api/routers/webhooks/bird_ig_dm.py`

```python
@router.post("/webhooks/bird-ig-dm")
async def bird_ig_dm_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    # 1. Verify Bird webhook signature
    signing_key = settings.BIRD_WEBHOOK_SIGNING_KEY
    signature = request.headers.get("Authorization")  # Bird uses AccessKey header
    body = await request.body()
    if not verify_bird_signature(signature, body, signing_key):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = await request.json()

    # 2. Dispatch to background processing (return 200 fast)
    if payload.get("type") == "instagram.inbound":
        event = BirdInstagramInboundEvent.model_validate(payload)
        background_tasks.add_task(handle_bird_ig_dm_inbound, db, event)

    return {"status": "ok"}


async def handle_bird_ig_dm_inbound(db: AsyncSession, event: BirdInstagramInboundEvent):
    # Resolve channel → ig_dm_account
    ig_dm_account = await get_ig_dm_account_by_channel_id(db, event.channel_id)
    if not ig_dm_account:
        logger.warning(f"No ig_dm_account for channel_id={event.channel_id}")
        return

    # Start Temporal ingest workflow
    await temporal_client.start_workflow(
        IgDmIngestWorkflow.run,
        IgDmIngestParams(
            user_id=ig_dm_account.user_id,
            ig_dm_account_id=ig_dm_account.id,
            bird_conversation_id=event.conversation.id,
            bird_message_id=event.message.id,
            sender_igsid=event.contact.identifier_value,
            sender_display_name=event.contact.display_name,
            message_body=event.message.body.text.text if event.message.body.type == "text" else None,
            message_type=event.message.body.type,
            created_at=event.message.created_at,
        ),
        id=f"ig-dm-ingest-{event.message.id}",  # deduplication key
        task_queue=TEMPORAL_TASK_QUEUE,
    )
```

**Webhook event model** (Pydantic):
```python
class BirdContactIdentifier(BaseModel):
    identifier_value: str  # Bird's IGSID-equivalent (Instagram Scoped User ID)
    display_name: str | None = None

class BirdMessageBody(BaseModel):
    type: str  # "text", "image", "file", etc.
    text: BirdTextBody | None = None

class BirdInstagramInboundEvent(BaseModel):
    type: str  # "instagram.inbound"
    channel_id: str
    contact: BirdContactIdentifier
    message: BirdMessage
    conversation: BirdConversation
```

---

## Message Ingestion: Temporal Workflow

**New workflow**: `IgDmIngestWorkflow`

```
IgDmIngestWorkflow
├─ Activity: resolve_sender_activity
│   Input:  sender_igsid, ig_dm_account_id
│   Action: Bird IGSID → username → campaign_creator lookup
│   Output: campaign_creator_id (nullable), ig_username
│
├─ Activity: upsert_ig_dm_thread_activity
│   Input:  bird_conversation_id, ig_dm_account_id, campaign_creator_id
│   Action: INSERT INTO ig_dm_thread ... ON CONFLICT DO UPDATE
│   Output: ig_dm_thread_id
│
├─ Activity: insert_ig_dm_message_activity
│   Input:  ig_dm_thread_id, bird_message_id, message_body, direction
│   Action: INSERT INTO ig_dm_message ... ON CONFLICT (bird_message_id) DO NOTHING
│   Output: ig_dm_message_id
│
├─ Activity: insert_ig_dm_thread_state_activity
│   Input:  ig_dm_thread_id, ig_dm_account_id
│   Action: INSERT INTO ig_dm_thread_state (status=READY_FOR_CAMPAIGN_ASSOCIATION)
│   Output: ig_dm_thread_state_id
│
└─ Trigger: ThreadProcessingCoordinatorWorkflow
    Input:  Candidate(ig_dm_account_id=..., ig_dm_thread_id=..., ...)
```

This mirrors the existing Gmail pattern (`ingest_single_message_activity` → `batch_insert_latest_state_and_get_candidates_activity` → `ThreadProcessingCoordinatorWorkflow`), adapted for the webhook-driven ingest path.

---

## Thread Mapping

### Bird `conversation.id` as Thread Key

Bird assigns a stable `conversation.id` per DM conversation thread. This maps directly to Cheerful's thread ID concept:

| Email Path | Instagram DM Path (Bird) |
|------------|--------------------------|
| `gmail_thread_id` (Google-assigned) | `bird_conversation_id` (Bird-assigned) |
| `email_thread_id` (RFC 2822 header) | (N/A) |

**Thread continuity**: Bird maintains the same `conversation.id` for all messages in a DM thread, regardless of when they were sent. If a creator sends multiple DMs over days, they all share the same `bird_conversation_id`.

**Deduplication**: `bird_message_id` (Bird's internal message ID) is used as the idempotency key for `ig_dm_message` inserts (`ON CONFLICT (bird_message_id) DO NOTHING`). This ensures webhook retries don't create duplicate messages.

**Campaign thread link**: The `campaign_thread` table needs a new `ig_dm_thread_id` column (UUID FK to `ig_dm_thread`). The 3-way mutual exclusivity check constraint:

```sql
ALTER TABLE campaign_thread
    ADD COLUMN ig_dm_thread_id UUID REFERENCES ig_dm_thread(id);

ALTER TABLE campaign_thread DROP CONSTRAINT chk_campaign_thread_one_thread_id;
ALTER TABLE campaign_thread ADD CONSTRAINT chk_campaign_thread_one_thread_id CHECK (
    (gmail_thread_id IS NOT NULL AND email_thread_id IS NULL AND ig_dm_thread_id IS NULL) OR
    (gmail_thread_id IS NULL AND email_thread_id IS NOT NULL AND ig_dm_thread_id IS NULL) OR
    (gmail_thread_id IS NULL AND email_thread_id IS NULL AND ig_dm_thread_id IS NOT NULL)
);
```

---

## Creator Resolution

### Bird-Specific Advantage

Bird exposes the Instagram Scoped User ID (IGSID) via `contact.identifierValue` in webhook payloads. This is the same identifier returned by Meta's native API — Bird does not obscure or replace it with an internal ID (unlike ManyChat, which uses its own subscriber IDs).

However, resolution from IGSID → campaign_creator still requires the same steps as the direct Meta API option:

```
Bird webhook → contact.identifier_value = "17841400000123456" (IGSID)

Step 1: Check ig_identity cache
   SELECT * FROM ig_identity WHERE igsid = '17841400000123456'
   → If cache hit: get username + campaign_creator_id (O(1) lookup)
   → If cache miss: proceed to Step 2

Step 2: Resolve IGSID → username via Bird API (or cached direct)
   GET https://api.bird.com/workspaces/{wId}/contacts/{identifier_value}
   (or Meta Graph API: GET /{igsid}?fields=name,username via Bird action)
   → { "displayName": "janedoe", "identifierValue": "17841400000123456" }

Step 3: Match username → campaign_creator
   SELECT * FROM campaign_creator
   WHERE social_media_handles @> '[{"platform":"instagram","handle":"janedoe"}]'::jsonb
   AND campaign_id IN (SELECT id FROM campaign WHERE user_id = ?)
   → Returns 0, 1, or N matches

Step 4: Cache result
   INSERT INTO ig_identity (igsid, username, campaign_creator_id, resolved_at)
   ON CONFLICT (igsid) DO UPDATE SET ...

Step 5: If no match found
   → Create ig_dm_thread with NULL campaign_creator_id
   → Surface in Cheerful inbox as "Unknown Creator DM" for manual routing
```

**Key dependency**: GIN index on `campaign_creator.social_media_handles` (see `current-creator-identity.md` §9 Option C):
```sql
CREATE INDEX idx_campaign_creator_handles_gin
ON campaign_creator USING GIN (social_media_handles);
```
Without this index, the JSONB containment query is a full-table scan.

**Bird-vs-direct-Meta difference**: In the direct Meta API option, IGSID resolution requires a Graph API call using Cheerful's stored access token. In the Bird option, Cheerful can use Bird's Contact API (`GET /workspaces/{wId}/contacts/{identifierValue}`) which returns cached contact metadata without consuming Meta rate limits directly. Bird may have already resolved the IGSID → display name from its own Meta webhook processing.

---

## Data Model Changes

### New Tables

**`ig_dm_account`** — Bird channel registration per Cheerful user
```sql
CREATE TABLE ig_dm_account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    bird_channel_id TEXT NOT NULL UNIQUE,  -- Bird's channelId
    instagram_account_id TEXT,             -- Instagram Business Account ID (from Bird)
    ig_username TEXT,                      -- Instagram username (display)
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ig_dm_account_user_id ON ig_dm_account(user_id);
CREATE INDEX idx_ig_dm_account_bird_channel_id ON ig_dm_account(bird_channel_id);
```

**`ig_dm_thread`** — One row per Instagram DM conversation
```sql
CREATE TABLE ig_dm_thread (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ig_dm_account_id UUID NOT NULL REFERENCES ig_dm_account(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    bird_conversation_id TEXT NOT NULL,    -- Bird's conversation.id
    sender_igsid TEXT NOT NULL,            -- Instagram Scoped User ID
    sender_username TEXT,                  -- Resolved Instagram username
    campaign_creator_id UUID REFERENCES campaign_creator(id),  -- nullable (unresolved)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (ig_dm_account_id, bird_conversation_id)
);
CREATE INDEX idx_ig_dm_thread_bird_conv_id ON ig_dm_thread(bird_conversation_id);
CREATE INDEX idx_ig_dm_thread_sender_igsid ON ig_dm_thread(sender_igsid);
```

**`ig_dm_message`** — Individual messages in a DM thread
```sql
CREATE TABLE ig_dm_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ig_dm_thread_id UUID NOT NULL REFERENCES ig_dm_thread(id),
    bird_message_id TEXT NOT NULL UNIQUE,  -- Bird's message.id (dedup key)
    direction TEXT NOT NULL,               -- 'INBOUND' | 'OUTBOUND'
    message_type TEXT NOT NULL DEFAULT 'text',  -- 'text', 'image', 'file', etc.
    body_text TEXT,                        -- For text messages
    media_url TEXT,                        -- For media messages
    created_at TIMESTAMPTZ NOT NULL,       -- From Bird event timestamp
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ig_dm_message_thread_id ON ig_dm_message(ig_dm_thread_id);
```

**`ig_dm_thread_state`** — Event-sourced state (mirrors `gmail_thread_state` / `smtp_thread_state`)
```sql
CREATE TABLE ig_dm_thread_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    ig_dm_account_id UUID NOT NULL REFERENCES ig_dm_account(id),
    ig_dm_thread_id UUID NOT NULL REFERENCES ig_dm_thread(id),
    status TEXT NOT NULL,                  -- GmailThreadStatus values (reused)
    latest_message_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (ig_dm_account_id, ig_dm_thread_id, latest_message_at)
);
CREATE INDEX idx_ig_dm_thread_state_thread_id ON ig_dm_thread_state(ig_dm_thread_id);
```

**`ig_identity`** — IGSID resolution cache
```sql
CREATE TABLE ig_identity (
    igsid TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    display_name TEXT,
    campaign_creator_id UUID REFERENCES campaign_creator(id),
    resolved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**`latest_ig_dm_message_per_thread`** — Denormalized latest message (trigger-maintained)
```sql
CREATE TABLE latest_ig_dm_message_per_thread (
    ig_dm_thread_id UUID PRIMARY KEY REFERENCES ig_dm_thread(id),
    ig_dm_message_id UUID NOT NULL REFERENCES ig_dm_message(id),
    updated_at TIMESTAMPTZ NOT NULL
);
-- Trigger: after INSERT on ig_dm_message, upsert into this table
```

### Modified Tables

**`campaign_thread`** — Add `ig_dm_thread_id` column + update 3-way check constraint (see Thread Mapping section above)

**`campaign_sender`** — Add `ig_dm_account_id` (nullable, mutually exclusive with `gmail_account_id` / `smtp_account_id`)

**`thread_flag`** — Add `ig_dm_thread_id` column (same extensibility pattern as other channels)

---

## Coordinator Integration

### `Candidate` Object Extension

```python
@dataclass
class Candidate:
    state__id: UUID

    # Channel discriminators (exactly one set)
    gmail_thread_id: str | None = None
    email_thread_id: str | None = None
    ig_dm_thread_id: UUID | None = None  # NEW

    gmail_account_id: UUID | None = None
    smtp_account_id: UUID | None = None
    ig_dm_account_id: UUID | None = None  # NEW

    # Shared metadata (unchanged)
    user_id: UUID = ...
    campaign_id: UUID | None = None
    latest_gmail_message__direction: GmailMessageDirection = ...
    force_campaign_id: UUID | None = None
    force_reply: bool = False
```

### `ThreadProcessingCoordinatorWorkflow` Branch

New discriminator branch in the coordinator:

```python
# Existing
if candidate.gmail_account_id is not None:
    await self._run_gmail_path(candidate)
elif candidate.smtp_account_id is not None:
    await self._run_smtp_path(candidate)
# NEW
elif candidate.ig_dm_account_id is not None:
    await self._run_ig_dm_path(candidate)
```

IG DM path skips Gmail-specific steps:
- ❌ `ensure_complete_thread_ingested` (Gmail only)
- ❌ `ThreadAttachmentExtractWorkflow` (Gmail only)
- ✅ `ThreadAssociateToCampaignWorkflow` (shared, unchanged)
- ✅ `execute_campaign_workflows` (shared, unchanged)
- ✅ `check_domain_and_classify` (shared, may need DM-aware tweaks)
- ✅ `ThreadResponseDraftWorkflow` (shared, DM format variant)
- ✅ `IgDmSendReplyActivity` (NEW — calls Bird Channels API)

---

## Outbound Sending

When a Cheerful user approves an AI-drafted DM reply, a new activity sends it via Bird:

```python
async def send_ig_dm_reply_activity(
    params: IgDmSendReplyParams,
) -> str:
    """Send a reply DM via Bird Channels API. Returns Bird message ID."""
    bird_channel_id = await get_bird_channel_id_for_ig_dm_account(params.ig_dm_account_id)

    response = await httpx_client.post(
        f"https://api.bird.com/workspaces/{settings.BIRD_WORKSPACE_ID}"
        f"/channels/{bird_channel_id}/messages",
        headers={"Authorization": f"AccessKey {settings.BIRD_API_KEY}"},
        json={
            "receiver": {
                "contacts": [{"identifierValue": params.sender_igsid}]
            },
            "body": {
                "type": "text",
                "text": {"text": params.reply_text}
            }
        },
    )
    response.raise_for_status()
    data = response.json()
    return data["id"]  # Bird message ID for the sent reply
```

**24-hour window enforcement**: The reply send activity must check whether the 24-hour messaging window is still open before attempting to send. Options:
1. **Optimistic send**: Attempt to send; if Bird returns a "window expired" error (from Meta), surface it in the UI.
2. **Window tracking**: Store `last_creator_message_at` on `ig_dm_thread`; before sending, check `now() - last_creator_message_at < 24h`. If expired, show warning in inbox UI rather than attempting the send.

The window tracking approach (Option 2) provides better UX but requires updating `ig_dm_thread.last_creator_message_at` on each inbound message.

---

## UI Changes

### Inbox Thread List

The inbox currently renders email threads. With Bird relay, the thread list needs to show IG DM threads alongside email threads. Changes mirror those described in `current-inbox-ui.md`:

- Thread type indicator: DM icon vs. email icon (e.g., Instagram logo for DM threads)
- Thread list query: must UNION across `gmail_thread_state`, `smtp_thread_state`, and `ig_dm_thread_state`
- Thread preview: message snippet (from `ig_dm_message.body_text` instead of email body)
- No subject line for DM threads (the creator's username serves as the "subject")

### Thread Detail View

- Message bubbles instead of email-style quoted threads
- Creator Instagram handle + profile picture (fetched from Bird contact or from `creator.profile_data`)
- No "Reply All", no CC/BCC fields
- 24-hour window indicator: if window is expired, show "DM window closed — creator must message first"
- DM character count guidance (Instagram DMs support up to 1,000 characters per message)

### Settings / Account Connection

- New "Instagram" section under Settings → Email & Channels
- "Connect Instagram Account" button → initiates Bird OAuth flow
- Displays connected account username + connection status
- Option to disconnect (removes `ig_dm_account` record, disables that Bird channel)

---

## Compatibility with Cheerful's Architecture

### Temporal Workflows

Bird's webhook-first ingest maps cleanly to Temporal:

| Concern | Email path | Bird relay path |
|---------|------------|-----------------|
| Ingest trigger | Perpetual polling workflow | Webhook → `start_workflow` |
| Idempotency | `ON CONFLICT DO NOTHING` + history checkpoint | `workflow_id = f"ig-dm-ingest-{bird_message_id}"` (Temporal dedup) |
| At-least-once delivery | Retry with polling checkpoint | Webhook retry + Temporal retry policy |
| Missed delivery recovery | Re-poll Gmail/IMAP | Poll Bird Conversations API for missed events |
| Reply sending | Gmail API / SMTP send | Bird Channels API `POST /messages` |

The key architectural difference: no perpetual Temporal polling loop for IG DMs. Instead, a **reconciliation cron** (e.g., hourly) can query Bird's Conversations API for any conversations that had messages in the last 2 hours, cross-reference against `ig_dm_message`, and backfill any gaps. This is a safety net for missed webhooks, not the primary path.

### Event-Sourced Thread Model

`ig_dm_thread_state` follows identical patterns to `gmail_thread_state` and `smtp_thread_state`:
- Append-only rows
- Unique on `(ig_dm_account_id, ig_dm_thread_id, latest_message_at)`
- Same `GmailThreadStatus` enum values (the enum name is a misnomer — it's already channel-agnostic in practice, per `current-thread-model.md` §6)
- State transitions managed by Temporal workflow, not DB triggers

### Supabase RLS

New tables inherit the same RLS pattern: each table has `user_id` column; policies restrict reads to `auth.uid() = user_id`. Bird channel IDs are scoped to Cheerful's workspace (not per-user in Bird's model), so RLS must be enforced at the application layer for `ig_dm_account.bird_channel_id` lookups.

---

## Bird-Specific Constraints

### 24-Hour Messaging Window

Meta's 24-hour rule (documented in `meta-instagram-messaging-api.md`) applies identically through the Bird relay:
- Every inbound creator DM opens a 24-hour reply window
- Creator inactivity for 24 hours closes the window
- The "Human Agent" tag extends to 7 days (Bird can set this tag via API)
- No template message bypass for Instagram (unlike WhatsApp)

**Bird does not bypass this constraint** — it is enforced at Meta's API level. Bird relays the Meta error when an attempt is made outside the window.

### Professional Account Requirement

Creators must have Instagram Professional accounts (Business or Creator type) connected to a Facebook Page. Personal accounts cannot be connected via Bird (same Meta constraint as direct API). This is an onboarding gate that applies regardless of relay choice.

### Rate Limits

- Meta: 200 automated messages per hour per Instagram account (Bird is subject to this)
- Bird: 50 RPS write limit (Standard), 500 RPS (Enterprise) — not a bottleneck for Cheerful's scale
- Bird webhook delivery: no documented delivery guarantee SLA; Bird's enterprise tier includes SLA agreements

### Per-Message Cost

Bird charges **$0.005 per message** (sent or received). From the Bird analysis:
- 500 creators × 4 messages/thread avg → 2,000 messages/month → **$10/month** at early scale
- 10,000 creators × 4 messages → 40,000 messages → **$200/month** at growth scale

This is the primary ongoing cost difference vs. the direct Meta API (which is free). At Cheerful's expected usage pattern (inbound-first: one DM conversation per creator per campaign, short exchanges), costs remain low and predictable.

### API Versioning

Bird is migrating from the Conversations API (legacy MessageBird) to the Channels API (current). This option uses the Channels API. The Conversations API is being deprecated; integrating against it would incur future migration work. Using the Channels API is the forward-compatible choice.

---

## Differences vs. Direct Meta API Option

| Factor | Bird Relay | Direct Meta API |
|--------|-----------|-----------------|
| Meta App Review required | ❌ Bird already approved | ✅ Cheerful needs Advanced Access (weeks-long wait) |
| Time-to-first-DM-in-Cheerful | Fast (days to set up Bird) | Slow (weeks for App Review) |
| Token management | Bird manages; Cheerful stores `bird_channel_id` | Cheerful manages Meta access tokens + refresh |
| Webhook infrastructure | Bird handles Meta webhook subscription | Cheerful handles Meta webhook subscription directly |
| Thread/message IDs | Bird's own IDs (not native Meta) | Native Meta `mid`, thread_id, IGSID |
| If migrating away from Bird | ID remapping needed; conversation history may be lost | N/A |
| Per-message cost | $0.005/message | Free |
| Vendor dependency | Bird SLA + availability | Meta only |
| Implementation effort | **Medium** (faster than direct; no App Review) | **Medium-High** (App Review + Meta OAuth + webhook infra) |
| Multi-channel future | Bird supports WhatsApp, SMS, etc. (future expansion easy) | Instagram-only; each new channel is a separate integration |
| Native IGSID access | ✅ Exposed as `contact.identifierValue` | ✅ Native |
| Message history API | ✅ Bird Conversations API | ✅ Meta Graph API `/conversations` |

---

## Effort Estimate

| Component | Relative Size | Notes |
|-----------|--------------|-------|
| Bird workspace setup + webhook config | XS | One-time; hours |
| `ig_dm_account` OAuth UI flow | S | Button + OAuth redirect; similar to Gmail connect |
| New DB tables + migrations | M | 5 new tables, 3 modified; standard migrations |
| Webhook handler (FastAPI) | S | Simple event parsing + Temporal trigger |
| `IgDmIngestWorkflow` (Temporal) | M | New workflow; mirrors existing patterns |
| Creator resolution + `ig_identity` cache | M | New logic, GIN index migration |
| `Candidate` + Coordinator extension | S | New discriminator branch; skip Gmail-specific steps |
| `ThreadProcessingCoordinatorWorkflow` IG DM path | S | Minimal changes to existing workflow |
| AI draft adaptation (DM format) | S | New prompt variant; minimal logic changes |
| Reply sending via Bird API | S | Single HTTP activity |
| Inbox UI changes (DM threads) | M | Thread type indicator, bubble layout, window warning |
| Settings UI (connect Instagram) | S | Similar to Gmail settings |
| Reconciliation cron (webhook gap fill) | S | Optional but recommended |
| Testing | M | Integration tests against Bird webhook format |

**Total relative effort**: **Medium** — lower than direct Meta API primarily because App Review is bypassed. The per-message cost is the main ongoing trade-off.

---

## Risk Register

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Bird platform outage | Medium | Low | Temporal retry on webhook; reconciliation cron fills gaps after recovery |
| Bird API breaking changes (Channels API v2?) | Medium | Low-Medium | Pin to API version; monitor Bird changelog |
| Per-message cost growth at scale | Low | Medium | Cost scales predictably; budget threshold alerts; migrate to direct Meta API if cost exceeds threshold |
| Bird ID ≠ Meta native IDs (migration lock-in) | Low-Medium | High (if migrating) | Store `sender_igsid` in `ig_dm_thread`; if migrating to direct Meta API, can re-key by IGSID |
| Creator not matching to campaign_creator | Medium | High (initially) | `ig_identity` cache + fallback to "Unknown Creator" inbox bucket with manual routing |
| 24-hour window expires before user reviews draft | Medium | Medium | Inbox shows window status; AI draft is still generated for future use / email follow-up |
| Bird changes pricing model | Low | Low | Contract terms; minimal cost at expected scale |
| Meta changes Instagram DM API rules (affects Bird) | High | Low-Medium | Bird would be affected equally; mitigation is the same as direct Meta API |
| Creator cannot connect (personal account) | Medium | Medium | Clear onboarding messaging; Cheerful can note which creators have Professional accounts |
| IGSID resolution rate limit | Low | Low | Bird Contact API likely cached; `ig_identity` cache prevents repeat lookups |
| Data residency (creator DM content in Bird infra) | Low-Medium | Definite | Document in Cheerful privacy policy; acceptable for most use cases |

---

## Recommendation Context

This option presents a **speed-vs-cost** trade-off against the direct Meta API:
- **Bird wins on speed**: No App Review wait; operational in days vs. weeks
- **Meta API wins on cost**: Free vs. $0.005/message ongoing
- **Bird wins on simplicity**: No Meta token management, no webhook subscription management
- **Meta API wins on purity**: Native IDs, no vendor intermediary, no lock-in

Bird is most suitable if Cheerful wants to **ship Instagram DM support quickly** before Meta App Review completes, or if the team wants to **defer the complexity** of managing Meta OAuth tokens and webhooks directly. The architecture is designed to be migrated: `sender_igsid` is stored natively on `ig_dm_thread`, and the Bird `bird_conversation_id` is a supplementary key. A future migration to direct Meta API would require re-keying conversation IDs but could preserve creator identity data.

This option does **not** preclude combining it with an architecture pattern (channel abstraction vs. parallel tables) — those are orthogonal choices documented in `option-channel-abstraction.md` and `option-parallel-tables.md`.

---

## Sources

- Bird Instagram DM Integration: https://bird.com/en-us/omnichannel/instagram-direct
- Bird Channels API: https://docs.bird.com/api
- Bird Pricing ($0.005/message): https://bird.com/en-us/pricing/instagram
- Bird Webhooks API: https://docs.bird.com/api/notifications-api/api-reference/webhooks
- Wave 1: `third-party-messagebird-bird.md` — full Bird capability assessment
- Wave 1: `third-party-manychat.md` — why ManyChat rejected for this role
- Wave 1: `third-party-others.md` — survey confirming Bird is the only relay-oriented third-party
- Wave 2: `current-thread-model.md` — thread identity model, parallel path pattern
- Wave 2: `current-email-pipeline.md` — ingest pipeline, Candidate abstraction, coordinator
- Wave 2: `current-creator-identity.md` — IGSID resolution, GIN index requirement, ig_identity cache design
- Wave 2: `current-inbox-ui.md` — inbox UI changes required
- Wave 2: `current-ai-drafting.md` — AI draft adaptation for DMs
