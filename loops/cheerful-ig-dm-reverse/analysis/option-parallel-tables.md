# Option: Parallel Tables Architecture

**Aspect**: `option-parallel-tables`
**Wave**: 3 — Options Cross-Product
**Date**: 2026-02-28
**Type**: ARCHITECTURE PATTERN — independent of API access choice; combinable with any Wave 3 API option.
**References**:
- Wave 2: `current-thread-model.md`, `current-email-pipeline.md`, `current-creator-identity.md`, `current-inbox-ui.md`, `current-ai-drafting.md`
- Wave 3: `option-direct-meta-api.md`, `option-channel-abstraction.md`

---

## Overview

This option adds Instagram DM support by following the **same structural pattern** used when SMTP was added to a Gmail-only codebase: create a new set of `ig_dm_*` tables that mirror the existing per-channel tables, extend shared join tables with a third channel column (and a 3-way mutual-exclusivity CHECK constraint), and add a third `elif` branch to the `ThreadProcessingCoordinatorWorkflow`.

**Core premise**: The existing SMTP addition proves this pattern works. `smtp_message`, `smtp_thread_state`, and `latest_smtp_message_per_thread` were added alongside (not replacing) their Gmail equivalents. Instagram DMs would repeat this approach, creating `ig_dm_message`, `ig_dm_thread_state`, and `latest_ig_dm_message_per_thread`. Existing code is minimally disturbed.

**This is a schema and code organization decision**, not an API choice. The parallel tables pattern is compatible with any API option (Direct Meta API, Composio relay, Bird relay, etc.) — those options determine *how messages arrive*; this option determines *where and how they are stored and processed*.

**The contrast case is `option-channel-abstraction`**, which proposes making the implicit abstraction (the `Candidate` object, the shared coordinator) explicit and complete at the DB, Python, and TypeScript layers. Parallel tables defers that investment entirely.

---

## Context: How SMTP Was Added (The Precedent)

The SMTP addition (`20251127000000_smtp_support.sql`) followed this exact pattern:

```
New tables added (mirroring Gmail equivalents):
  user_smtp_account         ← parallel to user_gmail_account
  smtp_message              ← parallel to gmail_message
  smtp_thread_state         ← parallel to gmail_thread_state
  latest_smtp_message_per_thread ← parallel to latest_gmail_message_per_thread

Existing tables extended (with new nullable column + CHECK constraint):
  campaign_thread   → ADD COLUMN email_thread_id TEXT
                    + CHECK (gmail_thread_id XOR email_thread_id)
  campaign_sender   → ADD COLUMN smtp_account_id UUID
                    + CHECK (gmail_account_id XOR smtp_account_id)
  thread_flag       → ADD COLUMN email_thread_id TEXT
                    + CHECK (gmail_thread_id XOR email_thread_id)

Existing table retrofitted (not a parallel copy):
  gmail_thread_llm_draft → ADD COLUMNS smtp_account_id, smtp_thread_state_id
                          (table name unchanged — first cross-channel accumulation point)
  gmail_thread_ui_draft  → similar extension for SMTP

New Python components:
  AllSmtpInboxSyncWorkflow, BatchSmtpInboxSyncWorkflow (polling orchestration)
  smtp_inbox_sync_activity (IMAP-based ingestion)
  batch_insert_latest_smtp_state_and_get_candidates_activity
  SmtpEmailService (IMAP/SMTP client)
  SmtpMessage, SmtpThreadState (DB models)

Coordinator changes:
  ThreadProcessingCoordinatorWorkflow → second elif branch:
    elif candidate.smtp_account_id is not None: # SMTP path
```

Instagram DMs would add a third iteration of this same pattern. The structural changes at each layer are predictable because the pattern is established.

---

## 1. New Database Tables

### 1.1 `user_ig_dm_account`

Stores per-user Instagram Business Account credentials and webhook subscription state. Parallel to `user_gmail_account` and `user_smtp_account`.

```sql
CREATE TABLE user_ig_dm_account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Meta account identifiers
    instagram_business_account_id TEXT NOT NULL,  -- e.g. "17841400000123456"
    facebook_page_id TEXT NOT NULL,               -- linked FB Page ID
    ig_username TEXT NOT NULL,                    -- e.g. "brandname"

    -- Access token (long-lived, 60-day expiry — must be refreshed)
    access_token TEXT NOT NULL,
    access_token_expires_at TIMESTAMPTZ NOT NULL,
    token_type TEXT NOT NULL DEFAULT 'page',      -- 'page' | 'user'

    -- Webhook subscription state
    webhook_subscribed BOOLEAN NOT NULL DEFAULT FALSE,
    webhook_subscription_id TEXT,
    webhook_subscribed_at TIMESTAMPTZ,

    -- Initial sync state (for the polling backfill variant)
    initial_sync_completed BOOLEAN NOT NULL DEFAULT FALSE,
    last_sync_cursor TEXT,                        -- pagination cursor for Graph API /conversations

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (user_id, instagram_business_account_id)
);

-- RLS: users can only see their own accounts
CREATE POLICY "ig_dm_account_user_isolation" ON user_ig_dm_account
    USING (user_id = auth.uid());
```

**Design notes**:
- `access_token_expires_at` is a novel concern for IG accounts (Gmail and SMTP tokens have different refresh semantics). Needs a background token refresh job.
- `facebook_page_id` is required because Meta's current API requires a linked Facebook Page for Instagram DM access (may change with Instagram Login API, see `meta-graph-api-conversations.md`).

---

### 1.2 `ig_dm_message`

Stores individual DM messages. Parallel to `gmail_message` and `smtp_message`, but with a significantly different shape: no subject, no CC/BCC, no RFC 2822 headers, but with `media_urls` and `is_echo` (outbound message echoes from Meta webhooks).

```sql
CREATE TABLE ig_dm_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id) ON DELETE CASCADE,

    -- Meta identifiers
    mid TEXT NOT NULL,                    -- Message ID from Meta (used for deduplication)
    ig_conversation_id TEXT NOT NULL,     -- Conversation thread ID from Meta

    -- Sender / recipient
    sender_igsid TEXT NOT NULL,           -- IGSID of sender (opaque numeric string)
    sender_username TEXT,                 -- Resolved @username (nullable — may not be known yet)
    recipient_igsid TEXT NOT NULL,        -- IGSID of recipient

    -- Direction
    direction TEXT NOT NULL               -- 'INBOUND' | 'OUTBOUND'
        CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    is_echo BOOLEAN NOT NULL DEFAULT FALSE, -- True if outbound echo from Meta webhook

    -- Content
    body_text TEXT,                       -- Text content (NULL for media-only messages)
    message_type TEXT NOT NULL DEFAULT 'text'
        CHECK (message_type IN ('text', 'image', 'video', 'audio', 'story_reply', 'unsupported')),

    -- Media (ephemeral URLs downloaded and stored in Supabase Storage)
    media_storage_paths TEXT[],           -- Supabase Storage paths for downloaded media
    media_original_urls TEXT[],           -- Original Meta CDN URLs (expire quickly)

    -- Timestamps
    sent_at TIMESTAMPTZ NOT NULL,         -- From Meta webhook timestamp
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- When Cheerful received/stored it

    -- Threading
    reply_to_mid TEXT,                    -- MID of the message being replied to (if any)

    -- Deduplication
    UNIQUE (ig_dm_account_id, mid)       -- On conflict DO NOTHING (idempotent ingestion)
);

CREATE INDEX idx_ig_dm_message_conversation
    ON ig_dm_message (ig_dm_account_id, ig_conversation_id, sent_at DESC);

CREATE INDEX idx_ig_dm_message_sender_igsid
    ON ig_dm_message (sender_igsid);
```

**Structural divergences from email message tables**:
| Field | Gmail / SMTP | IG DM |
|-------|-------------|-------|
| Subject | ✅ `subject TEXT` | ❌ N/A |
| CC / BCC | ✅ `cc_emails`, `bcc_emails` | ❌ N/A |
| HTML body | ✅ `body_html TEXT` | ❌ Always plain text |
| RFC 2822 headers | ✅ `message_id_header`, `in_reply_to_header` | ❌ N/A |
| Thread ID source | Gmail thread ID / RFC 2822 Message-ID chain | Meta `ig_conversation_id` |
| Sender identity | Email address | IGSID (opaque numeric) + optional username |
| Media | Email attachments (arbitrary files) | Images / videos (Media URL, Supabase-stored) |
| Message echoes | N/A — outbound stored separately | `is_echo = TRUE` from webhook |

---

### 1.3 `ig_igsid_cache`

Caches the IGSID → username resolution to avoid repeated Graph API calls per DM event. Has no Gmail/SMTP parallel (email has no equivalent resolution step).

```sql
CREATE TABLE ig_igsid_cache (
    igsid TEXT PRIMARY KEY,               -- e.g. "17841400000123456"
    username TEXT NOT NULL,               -- e.g. "janedoe"
    display_name TEXT,                    -- e.g. "Jane Doe"
    resolved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ig_igsid_cache_username ON ig_igsid_cache (username);
```

**Why separate from `campaign_creator`**: The IGSID → username mapping is a system-level identity resolution cache, not a campaign CRM record. Multiple campaigns across multiple users may involve the same IGSID; a single cache avoids redundant Graph API calls and is not user-scoped.

---

### 1.4 `ig_dm_thread_state`

Event-sourced append-only thread state. Parallel to `gmail_thread_state` and `smtp_thread_state`. Reuses the existing `GmailThreadStatus` enum (which is already used by both Gmail and SMTP despite its confusing name).

```sql
CREATE TABLE ig_dm_thread_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id),
    ig_conversation_id TEXT NOT NULL,     -- Meta conversation ID

    -- State machine (reuses GmailThreadStatus enum)
    status TEXT NOT NULL,
    latest_internal_date TIMESTAMPTZ NOT NULL,

    -- DM-specific window tracking (no email equivalent)
    window_expires_at TIMESTAMPTZ,        -- 24-hour window expiry; NULL if no active window

    -- Causation
    triggered_by_mid TEXT,               -- The ig_dm_message.mid that caused this state row

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (user_id, ig_dm_account_id, ig_conversation_id, latest_internal_date)
);

CREATE INDEX idx_ig_dm_thread_state_latest
    ON ig_dm_thread_state (ig_dm_account_id, ig_conversation_id, latest_internal_date DESC);
```

**Notable divergence**: The `window_expires_at` column tracks the Instagram 24-hour messaging window. This has no email equivalent and represents DM-specific state that must be stored somewhere. In the parallel-tables model, it lives here; in the channel-abstraction model with a unified `thread_state` table, it would need to be in a `channel_metadata JSONB` column or a separate `ig_dm_thread_metadata` table.

**Reuse of `GmailThreadStatus`**: All 7 existing statuses are semantically valid for DMs:
- `READY_FOR_CAMPAIGN_ASSOCIATION` — routes DM to a campaign (by IG account → campaign mapping)
- `READY_FOR_RESPONSE_DRAFT` — AI draft generation triggered
- `WAITING_FOR_DRAFT_REVIEW` — draft pending user approval
- `WAITING_FOR_INBOUND` — draft sent, waiting for creator reply
- `IGNORE` — DM not associated with a campaign
- `DONE` — conversation complete
- `NOT_LATEST` — superseded state row (append-only pattern)

The `READY_FOR_ATTACHMENT_EXTRACTION` status (Gmail-only) is simply never used for DMs — the workflow skips that step conditionally (same as SMTP).

---

### 1.5 `latest_ig_dm_message_per_thread`

Denormalized trigger-maintained table for fast latest-message lookups. Parallel to `latest_gmail_message_per_thread` and `latest_smtp_message_per_thread`.

```sql
CREATE TABLE latest_ig_dm_message_per_thread (
    ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id),
    ig_conversation_id TEXT NOT NULL,
    latest_message_id UUID NOT NULL REFERENCES ig_dm_message(id),
    latest_message_sent_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (ig_dm_account_id, ig_conversation_id)
);

-- Trigger to maintain this table on ig_dm_message INSERT
CREATE OR REPLACE FUNCTION update_latest_ig_dm_message()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO latest_ig_dm_message_per_thread
        (ig_dm_account_id, ig_conversation_id, latest_message_id, latest_message_sent_at)
    VALUES
        (NEW.ig_dm_account_id, NEW.ig_conversation_id, NEW.id, NEW.sent_at)
    ON CONFLICT (ig_dm_account_id, ig_conversation_id)
    DO UPDATE SET
        latest_message_id = EXCLUDED.latest_message_id,
        latest_message_sent_at = EXCLUDED.latest_message_sent_at
    WHERE EXCLUDED.latest_message_sent_at > latest_ig_dm_message_per_thread.latest_message_sent_at;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_latest_ig_dm_message
AFTER INSERT ON ig_dm_message
FOR EACH ROW EXECUTE FUNCTION update_latest_ig_dm_message();
```

---

## 2. Modified Existing Tables

### 2.1 `campaign_thread` — 3-Way Mutual Exclusivity

Current state (after SMTP addition):
```sql
-- Existing 2-way CHECK constraint
CHECK (
    (gmail_thread_id IS NOT NULL AND email_thread_id IS NULL) OR
    (gmail_thread_id IS NULL AND email_thread_id IS NOT NULL)
)
```

After adding IG DM support:
```sql
ALTER TABLE campaign_thread
    ADD COLUMN ig_dm_thread_id TEXT,
    ADD COLUMN ig_dm_account_id UUID REFERENCES user_ig_dm_account(id);

-- Drop old 2-way constraint and replace with 3-way
ALTER TABLE campaign_thread
    DROP CONSTRAINT chk_campaign_thread_one_thread_id;

ALTER TABLE campaign_thread
    ADD CONSTRAINT chk_campaign_thread_one_thread_id CHECK (
        -- Gmail path
        (gmail_thread_id IS NOT NULL AND email_thread_id IS NULL     AND ig_dm_thread_id IS NULL) OR
        -- SMTP path
        (gmail_thread_id IS NULL     AND email_thread_id IS NOT NULL AND ig_dm_thread_id IS NULL) OR
        -- Instagram DM path
        (gmail_thread_id IS NULL     AND email_thread_id IS NULL     AND ig_dm_thread_id IS NOT NULL)
    );

CREATE UNIQUE INDEX idx_campaign_thread_ig_dm
    ON campaign_thread (ig_dm_account_id, ig_dm_thread_id)
    WHERE ig_dm_thread_id IS NOT NULL;
```

**Scalability concern**: Each new channel adds another `OR` clause. A hypothetical 4-channel system (Gmail + SMTP + IG DM + WhatsApp) would require a 4-way constraint with 4 `OR` branches. The constraint's verbosity grows linearly, and its correctness is harder to verify by inspection. At 3 channels this is manageable; at 5+ it becomes a maintenance liability.

---

### 2.2 `campaign_sender` — Third Channel Option

```sql
ALTER TABLE campaign_sender
    ADD COLUMN ig_dm_account_id UUID REFERENCES user_ig_dm_account(id);

-- Replace existing 2-way constraint
ALTER TABLE campaign_sender
    DROP CONSTRAINT chk_campaign_sender_one_account;

ALTER TABLE campaign_sender
    ADD CONSTRAINT chk_campaign_sender_one_account CHECK (
        (gmail_account_id IS NOT NULL AND smtp_account_id IS NULL    AND ig_dm_account_id IS NULL) OR
        (gmail_account_id IS NULL    AND smtp_account_id IS NOT NULL AND ig_dm_account_id IS NULL) OR
        (gmail_account_id IS NULL    AND smtp_account_id IS NULL     AND ig_dm_account_id IS NOT NULL)
    );
```

**IG DM campaign model note**: Unlike Gmail/SMTP where one campaign can use different accounts, Instagram DM campaigns are typically 1:1 with a Business Account. The campaign is implicitly associated with the IG account used to receive DMs. The `campaign_sender` extension formalizes this relationship.

---

### 2.3 `thread_flag` — Same Extension Pattern

```sql
ALTER TABLE thread_flag
    ADD COLUMN ig_dm_thread_id TEXT,
    ADD COLUMN ig_dm_account_id UUID REFERENCES user_ig_dm_account(id);

ALTER TABLE thread_flag
    DROP CONSTRAINT chk_thread_flag_one_thread;

ALTER TABLE thread_flag
    ADD CONSTRAINT chk_thread_flag_one_thread CHECK (
        (gmail_thread_id IS NOT NULL AND email_thread_id IS NULL     AND ig_dm_thread_id IS NULL) OR
        (gmail_thread_id IS NULL     AND email_thread_id IS NOT NULL AND ig_dm_thread_id IS NULL) OR
        (gmail_thread_id IS NULL     AND email_thread_id IS NULL     AND ig_dm_thread_id IS NOT NULL)
    );
```

---

### 2.4 The `gmail_thread_llm_draft` Dilemma

This is the single most structurally awkward decision in the parallel-tables approach.

**Current state**: The `gmail_thread_llm_draft` table was originally Gmail-only, then extended with SMTP columns via migration:
```sql
-- From smtp_support migration (paraphrased)
ALTER TABLE gmail_thread_llm_draft
    ADD COLUMN smtp_account_id UUID REFERENCES user_smtp_account(id),
    ADD COLUMN smtp_thread_state_id UUID REFERENCES smtp_thread_state(id);
-- The table now stores drafts for both Gmail AND SMTP, despite the name
```

**Option A: Continue the pattern — extend `gmail_thread_llm_draft` again**

```sql
ALTER TABLE gmail_thread_llm_draft
    ADD COLUMN ig_dm_account_id UUID REFERENCES user_ig_dm_account(id),
    ADD COLUMN ig_dm_thread_state_id UUID REFERENCES ig_dm_thread_state(id);
-- Note: draft_subject becomes optional (NULL for DMs, since DMs have no subject)
-- gmail_draft_id becomes irrelevant for DMs
```

Pros:
- Follows established pattern (SMTP extension precedent)
- Single draft query surface for the coordinator
- Zero migration risk

Cons:
- `gmail_thread_llm_draft` is now definitively misnamed — stores drafts for 3 channels
- `draft_subject` and `gmail_draft_id` columns are email-specific noise for DM rows
- Three mutually exclusive nullable account ID columns (`gmail_account_id`, `smtp_account_id`, `ig_dm_account_id`) need another 3-way CHECK constraint to enforce exactly-one
- Growing difficulty: a 4th channel would add a 4th set of columns

**Option B: Create a separate `ig_dm_llm_draft` table (cleaner isolation)**

```sql
CREATE TABLE ig_dm_llm_draft (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id),
    ig_dm_thread_state_id UUID NOT NULL REFERENCES ig_dm_thread_state(id),
    ig_conversation_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),

    draft_body_text TEXT NOT NULL,        -- Plain text only (no subject, no HTML)
    draft_version INT NOT NULL DEFAULT 1,
    langfuse_session_id TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Pros:
- Clean isolation — DM drafts stored separately from email drafts
- No nullable columns from other channels; no spurious `draft_subject`/`gmail_draft_id` columns
- Email draft logic untouched

Cons:
- 4th parallel table (not 3rd — joins the table explosion)
- Coordinator must branch on draft table choice (another `elif`)
- Naming asymmetry: `gmail_thread_llm_draft` vs `ig_dm_llm_draft` (two different table designs)
- Does NOT fix the existing `gmail_thread_llm_draft` naming debt (SMTP drafts still live there)

**Verdict for parallel-tables design**: Option B (separate `ig_dm_llm_draft`) is the cleaner choice if starting fresh. However, following Option A (extend `gmail_thread_llm_draft`) maintains the established precedent and avoids creating yet another bifurcation. Teams tolerant of the naming debt would choose Option A; teams bothered by it would choose Option B — or migrate to the channel-abstraction unified `thread_llm_draft` table.

---

## 3. New Python Components

### 3.1 Ingest Path (Webhook-Driven, Not Poll-Driven)

**Critical structural difference from Gmail/SMTP**: Gmail and SMTP use perpetual polling workflows. Instagram DMs are event-driven via webhooks. The "ingest path" for IG DMs therefore does not follow the `AllPollHistoryWorkflow` pattern — instead, Meta sends HTTP POST events to a FastAPI endpoint, which triggers Temporal workflows.

```python
# New: apps/backend/src/api/routers/ig_dm_webhook.py
from fastapi import APIRouter, Request, HTTPException
from fastapi.background import BackgroundTasks

router = APIRouter(prefix="/webhooks/instagram")

@router.get("/")
async def verify_webhook(request: Request):
    """Meta webhook verification (hub.challenge flow)."""
    hub_mode = request.query_params.get("hub.mode")
    hub_verify_token = request.query_params.get("hub.verify_token")
    hub_challenge = request.query_params.get("hub.challenge")
    if hub_mode == "subscribe" and hub_verify_token == settings.WEBHOOK_VERIFY_TOKEN:
        return PlainTextResponse(hub_challenge)
    raise HTTPException(status_code=403, detail="Verification failed")

@router.post("/")
async def receive_ig_dm_event(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Database = Depends(get_db),
):
    """
    Receive Meta webhook POST.
    Must return 200 within 5–10 seconds or Meta retries.
    All processing is async via Temporal.
    """
    payload = await request.json()

    # HMAC-SHA256 signature verification
    signature = request.headers.get("X-Hub-Signature-256", "")
    if not verify_hmac_signature(payload_bytes, signature, settings.APP_SECRET):
        raise HTTPException(status_code=403, detail="Invalid signature")

    # Enqueue each messaging event to Temporal (background task returns 200 immediately)
    background_tasks.add_task(
        enqueue_ig_dm_events,
        payload=payload,
        db=db,
    )
    return {"status": "ok"}
```

**Temporal side** — webhook receipt triggers workflow:

```
Meta POST → FastAPI webhook handler (200 immediately)
    ↓ (BackgroundTask)
IgDmIngestWorkflow (per conversation_id)
    ↓
ig_dm_ingest_activity        # Parse payload, INSERT ig_dm_message ON CONFLICT DO NOTHING
    ↓
ig_igsid_resolution_activity # Cache miss: Graph API call → ig_igsid_cache + campaign_creator.sender_igsid
    ↓
IgDmThreadSyncWorkflow (fire-and-forget)
    ↓
insert_ig_dm_thread_state_and_get_candidate_activity
    ↓
ThreadProcessingCoordinatorWorkflow ← (shared, new branch added)
```

Note: The per-conversation `IgDmIngestWorkflow` replaces the perpetual `AllPollHistoryWorkflow` / `AllSmtpInboxSyncWorkflow` loops. A **reconciliation polling cron** (30–60 min interval) handles webhook delivery failures, parallel to the Gmail History API resync logic.

---

### 3.2 New Activities

```python
# apps/backend/src/temporal/activity/ig_dm_ingest_activity.py
@activity.defn
async def ig_dm_ingest_activity(
    ig_dm_account_id: UUID,
    user_id: UUID,
    raw_payload: dict,
) -> str:
    """
    Parse Meta webhook payload, store to ig_dm_message.
    Returns ig_conversation_id.
    Idempotent: ON CONFLICT (ig_dm_account_id, mid) DO NOTHING.
    """
    ...

# apps/backend/src/temporal/activity/ig_igsid_resolution_activity.py
@activity.defn
async def ig_igsid_resolution_activity(
    sender_igsid: str,
    ig_dm_account_id: UUID,
) -> IgIdentityResult:
    """
    Resolve IGSID → username via cache hit or Graph API call.
    Stores result in ig_igsid_cache.
    Rate limit: 200 Graph API calls/hour (Standard Access).
    Timeout: 30s | Retries: 3 (exponential backoff).
    """
    ...

# apps/backend/src/temporal/activity/ig_dm_thread_state_activity.py
@activity.defn
async def insert_ig_dm_thread_state_and_get_candidate_activity(
    ig_dm_account_id: UUID,
    ig_conversation_id: str,
    user_id: UUID,
) -> Candidate | None:
    """
    Create ig_dm_thread_state row (initial: READY_FOR_CAMPAIGN_ASSOCIATION).
    Mirrors gmail_thread_state.py and smtp_thread_state_sync_activity.py.
    Returns Candidate with ig_dm_account_id set.
    """
    ...
```

---

### 3.3 `Candidate` Object Extension

The shared `Candidate` object is extended with a third nullable account ID discriminator:

```python
# Current Candidate (simplified)
class Candidate:
    state__id: UUID
    gmail_account_id: UUID | None      # Set for Gmail
    smtp_account_id: UUID | None       # Set for SMTP
    gmail_thread_id: str | None
    email_thread_id: str | None
    user_id: UUID
    ...

# Extended Candidate (new field added)
class Candidate:
    state__id: UUID
    gmail_account_id: UUID | None      # Set for Gmail
    smtp_account_id: UUID | None       # Set for SMTP
    ig_dm_account_id: UUID | None      # Set for Instagram DM  ← NEW
    gmail_thread_id: str | None
    email_thread_id: str | None
    ig_conversation_id: str | None     # Set for Instagram DM  ← NEW
    user_id: UUID
    ...
```

The discriminator logic already in the coordinator (`if gmail_account_id is not None else smtp_account_id is not None`) adds a third branch. All three fields remain nullable; exactly one is set per `Candidate`.

---

### 3.4 `ThreadProcessingCoordinatorWorkflow` — Third Branch

```python
# thread_processing_coordinator_workflow.py (simplified diff)

@workflow.run
async def run(self, candidate: Candidate) -> None:

    # BEFORE (2 branches)
    if candidate.gmail_account_id is not None:
        thread_id = candidate.gmail_thread_id
        # ... Gmail-specific setup
    elif candidate.smtp_account_id is not None:
        thread_id = candidate.email_thread_id
        # ... SMTP-specific setup (skip attachment extraction, etc.)

    # AFTER (3 branches)
    if candidate.gmail_account_id is not None:
        thread_id = candidate.gmail_thread_id
        # Gmail: run ensure_complete_thread_ingested, attachment extraction
    elif candidate.smtp_account_id is not None:
        thread_id = candidate.email_thread_id
        # SMTP: skip attachment extraction
    elif candidate.ig_dm_account_id is not None:       # ← NEW BRANCH
        thread_id = candidate.ig_conversation_id
        # IG DM: skip attachment extraction (media already downloaded at ingest)
        # IG DM: check window_expires_at before generating draft
        # IG DM: use ig_dm_thread_state not gmail/smtp_thread_state

    # Shared coordinator logic (unchanged)
    await workflow.execute_child_workflow(ThreadAssociateToCampaignWorkflow, ...)
    await workflow.execute_child_workflow(ThreadResponseDraftWorkflow, ...)
    ...
```

**Coordinator changes per-branch**:

| Step | Gmail | SMTP | IG DM |
|------|-------|------|-------|
| `ensure_complete_thread_ingested` | ✅ Run | ❌ Skip | ❌ Skip |
| `ThreadAttachmentExtractWorkflow` | ✅ Run | ❌ Skip | ❌ Skip (media at ingest) |
| 24h window check | ❌ N/A | ❌ N/A | ✅ New: check `window_expires_at` |
| Campaign association | ✅ Run | ✅ Run | ✅ Run (IG account → campaign mapping) |
| AI draft generation | ✅ Run | ✅ Run | ✅ Run (plain-text, no subject) |
| Send draft | Gmail API | SMTP relay | Instagram Messaging API |

---

### 3.5 New Service: `InstagramDmService`

Parallel to `GmailService` (`services/external/gmail.py`) and `SmtpEmailService` (`services/external/smtp_email.py`).

```python
# apps/backend/src/services/external/instagram_dm.py
class InstagramDmService:
    """Wraps Meta Graph API for Instagram DM send/receive operations."""

    async def send_dm(
        self,
        ig_business_account_id: str,
        access_token: str,
        recipient_igsid: str,
        message_text: str,
        reply_to_mid: str | None = None,
    ) -> str:
        """
        POST /{ig-business-account-id}/messages
        Returns sent message MID.
        """
        ...

    async def resolve_igsid(
        self,
        igsid: str,
        access_token: str,
    ) -> dict:
        """
        GET /{igsid}?fields=name,username
        Returns {name, username, id}.
        """
        ...

    async def list_conversations(
        self,
        ig_business_account_id: str,
        access_token: str,
        cursor: str | None = None,
    ) -> dict:
        """
        GET /{ig-business-account-id}/conversations?platform=instagram
        Used for initial account sync and webhook recovery polling.
        """
        ...
```

---

## 4. Frontend Changes

In the parallel-tables model, frontend changes follow the minimal-disruption approach from `current-inbox-ui.md` **Option A**: extend `GmailThread` with a `channel` discriminator and conditional rendering throughout existing components.

### 4.1 Type Extension

```typescript
// gmail-types.ts (extended, not replaced)
export interface GmailThread {
  // ... existing fields unchanged ...

  // New: channel discriminator (additive, backward compatible)
  channel?: 'gmail' | 'smtp' | 'instagram_dm';

  // New: DM-specific fields (undefined for email threads)
  senderHandle?: string;        // @ig_username (DM sender)
  igAccountId?: string;         // user_ig_dm_account.id
  windowExpiresAt?: string;     // ISO datetime; null if no active window or not a DM thread
}

export interface GmailMessage {
  // ... existing fields unchanged ...

  // New: DM-specific (undefined for email messages)
  senderHandle?: string;        // @ig_username (replaces `email` for DMs)
  mediaUrls?: string[];         // Supabase Storage URLs for DM media
  isEcho?: boolean;             // true if outbound DM
}
```

This approach reuses the existing types with optional additions. `subject` remains in the type but is set to `""` for DM threads. All existing email components continue to work unmodified — they simply receive `subject: ""` for DM threads and render the (empty) subject row (slightly suboptimal UX vs proper conditional rendering).

### 4.2 Conditional Rendering in Existing Components

Key changes required (the minimal-disruption implementation does fewer of these; a proper implementation does all):

```tsx
// mail-list.tsx — thread list item
{thread.channel !== 'instagram_dm' && (
    <div className="subject-row">{thread.subject}</div>   // Hide for DMs
)}
{thread.channel === 'instagram_dm' && (
    <InstagramBadge />                                     // New channel badge
)}

// mail-display.tsx — thread header
{thread.channel === 'instagram_dm' ? (
    <span>@{thread.senderHandle}</span>                   // IG username
) : (
    <span>&lt;{thread.senderEmail}&gt;</span>             // Email address
)}

// mail-display.tsx — reply composer
{thread.channel === 'instagram_dm' ? (
    <DmComposer thread={thread} />                        // New plain-text composer
) : (
    <EmailRichTextEditor ... />                           // Existing HTML editor
)}
```

**`DmComposer`** is a new component — the biggest single new UI piece needed:
- Plain `<textarea>` (no Tiptap/HTML formatting)
- Character count (Instagram DMs support up to 1,000 characters)
- 24-hour window indicator showing time remaining
- No TO/CC/BCC fields — "Replying to @username" static label
- Image upload button (optional, for media DM replies)

### 4.3 Query Layer

New TanStack Query hook (parallel to `use-mail-queries.ts`):

```typescript
// use-ig-dm-queries.ts (new)
export function useIgDmThreads(igAccountId: string) {
    return useQuery({
        queryKey: ['ig-dm-threads', igAccountId],
        queryFn: () => fetchIgDmThreads(igAccountId),  // GET /api/ig-dm/threads
    });
}
```

Or: extend the existing `GET /api/threads` endpoint to also accept `ig_dm_account_ids` and return unified results with `channel` field set — this approach requires less new query infrastructure.

---

## 5. Creator Identity Resolution (Shared Requirement)

Creator identity resolution is the same problem regardless of architecture pattern. See `current-creator-identity.md` for full analysis. Under the parallel-tables approach:

1. **`ig_igsid_cache` table** (defined above) caches IGSID → username lookups.
2. **GIN index on `campaign_creator.social_media_handles`**:
   ```sql
   CREATE INDEX idx_campaign_creator_handles_gin
   ON campaign_creator USING GIN (social_media_handles);
   ```
   Enables efficient JSONB containment query: `social_media_handles @> '[{"platform":"instagram","handle":"janedoe"}]'::jsonb`
3. **Optional: `ig_igsid` column on `campaign_creator`**:
   ```sql
   ALTER TABLE campaign_creator ADD COLUMN ig_igsid TEXT;
   CREATE INDEX ON campaign_creator (ig_igsid) WHERE ig_igsid IS NOT NULL;
   ```
   Populated when a DM is matched to a `campaign_creator`. Allows O(1) lookup for subsequent DMs from the same creator.

These infrastructure changes are additive — they do not modify existing campaign creator query logic.

---

## 6. Compatibility with Temporal Workflow Patterns

**Event-sourced state**: Fully preserved. `ig_dm_thread_state` is append-only with the same `UNIQUE (user_id, ig_dm_account_id, ig_conversation_id, latest_internal_date)` invariant as its Gmail/SMTP counterparts.

**Exactly-once ingestion**: Maintained via `UNIQUE (ig_dm_account_id, mid)` + `ON CONFLICT DO NOTHING`. Activity IDs in Temporal (`ingest-{mid}`) enforce deduplication at the workflow level.

**Coordinator branching**: Adding a third `elif` to `ThreadProcessingCoordinatorWorkflow` is low-risk — the coordinator already has two branches for Gmail and SMTP, and the shared logic (campaign association, AI drafting) is untouched.

**Temporal worker registration**: New activities (`ig_dm_ingest_activity`, `ig_igsid_resolution_activity`, `ig_dm_thread_state_activity`) must be registered in `temporal/worker.py`. No structural changes to the worker — just new activity registrations.

**Webhook vs. perpetual poll**: The ingest trigger differs architecturally (webhook → Temporal workflow start vs. perpetual polling workflow calling activities). Temporal handles both models well. The webhook path is actually simpler for Temporal — each webhook event starts a short-lived workflow, avoiding the `continue_as_new` pattern complexity of the perpetual poll loops.

**24-hour window in state machine**: The `window_expires_at` column on `ig_dm_thread_state` enables the coordinator to check window status before generating a draft. If `window_expires_at < now()` and no new message from creator: skip draft, set status to `WAITING_FOR_INBOUND` with a note. This is new conditional logic in the coordinator, not a structural change to the state machine.

---

## 7. Trade-Off Comparison vs Channel Abstraction

| Dimension | Parallel Tables | Channel Abstraction (Strategy 2: Façade) |
|-----------|----------------|------------------------------------------|
| **Existing code changes** | Minimal — add `elif` to coordinator, extend Candidate | Low — wrap existing services in adapters; coordinator uses registry |
| **New code** | `ig_dm_*` activities, service, workflow, DB tables | Same new code PLUS adapters for Gmail/SMTP |
| **Naming debt** | Increases — `GmailThreadStatus` now for 3 channels; `gmail_thread_llm_draft` if extended | Reduced — adapter layer introduces clean names |
| **FK integrity** | Fully preserved on all tables | Preserved (Façade keeps existing tables) |
| **RLS complexity** | Additive — new table policies follow existing pattern | Same as parallel tables (Façade doesn't change DB) |
| **`campaign_thread` CHECK constraint** | 3-way mutual exclusivity | 3-way (same schema if Façade chosen; normalized if 1A chosen) |
| **4th channel addition** | 4-way CHECK constraint + 4th branch | Add new adapter class; no schema changes |
| **Migration risk** | Near-zero (additive only) | Low (Façade: no existing code changes; existing code wrapped) |
| **Effort vs baseline** | +0–2 days (no extra overhead beyond IG DM feature itself) | +3–5 days (Façade) to +8–12 days (Big Bang) |
| **Team friction** | "We already did this for SMTP" — familiar pattern | "We need to refactor before shipping the feature" |

The parallel-tables approach is strictly lower effort and lower risk than channel abstraction. The cost is accumulated naming debt and growing CHECK constraint complexity. The question is whether that debt is worth paying down now (abstraction) or deferring (parallel).

---

## 8. Effort Estimate

Using `option-direct-meta-api` as the reference baseline (~20–28 engineering days total, calendar-blocked by Meta App Review).

The parallel-tables option describes an **architecture shape**, not an API choice, so its effort is measured as overhead RELATIVE to what any integration must do (build ingestion, activities, coordinator branch, frontend, etc.).

**Overhead of parallel-tables vs no-pattern (i.e., just adding whatever makes it work)**: essentially zero — the parallel pattern IS the natural "just add it" approach. No additional overhead.

| Component | Effort |
|-----------|--------|
| New DB tables (`user_ig_dm_account`, `ig_dm_message`, `ig_dm_thread_state`, `ig_igsid_cache`, `latest_ig_dm...`) | 1–2 days |
| Modified tables (`campaign_thread`, `campaign_sender`, `thread_flag` CHECK constraint expansion) | 0.5 days |
| Draft table decision (extend `gmail_thread_llm_draft` or new `ig_dm_llm_draft`) | 0.5 days |
| `Candidate` extension + coordinator third branch | 1 day |
| GIN index + `ig_igsid` column on `campaign_creator` | 0.5 days |
| Frontend: type extension + conditional rendering + `DmComposer` | 3–5 days |
| **Subtotal (architecture shape overhead)** | **~7–10 days** |

This is the architecture cost within any Direct Meta API or relay integration. The remaining ~10–18 days of the baseline go to API auth, webhook infrastructure, service code, activities, and AI adaptation — those costs are shared regardless of architecture choice.

**Compared to channel abstraction (Façade, +3–5 days)**: Parallel tables saves 3–5 days of abstraction overhead. That 3–5 days is the cost of not paying down naming/structural debt.

---

## 9. Risks

| Risk | Severity | Likelihood | Mitigation |
|------|----------|-----------|------------|
| `campaign_thread` 3-way CHECK constraint is buggy (wrong OR conditions) | High (data integrity) | Low | Thorough migration test; CHECK verified with all 3 channel types |
| `gmail_thread_llm_draft` Option A creates inconsistent rows (ig draft with `draft_subject` NULL, `gmail_draft_id` NULL) | Medium (data quality) | Medium | Add partial index or CHECK on the draft table to enforce exactly-one account FK |
| Naming confusion causes bugs (`GmailThreadStatus.READY_FOR_ATTACHMENT_EXTRACTION` applied to DM threads) | Medium | Low | Status is never set for DMs (coordinator skips that step); but misleading for devs reading DB |
| Webhook delivery failure → missed DMs (no polling fallback) | High (data loss) | Medium | Mandatory reconciliation polling cron (see `option-graph-api-polling.md` Variant B) |
| IGSID resolution rate limit exhaustion (200/hr Standard Access) | High (feature broken) | Medium for high volume | `ig_igsid_cache` mitigates; Advanced Access provides higher limits |
| Token refresh gap → expired access_token blocks all DMs for an account | High (feature broken) | Medium | Token refresh workflow scheduled before `access_token_expires_at` |
| 24-hour window edge case: state shows `WAITING_FOR_INBOUND` but window has expired | Medium (stale UI) | Medium | Check `window_expires_at` at coordinator and in UI; surface warning |
| `campaign_thread` 4-way (WhatsApp next) becomes unmaintainable | Low (future) | Low in near term | Accept: migrate to channel-abstraction if 4th channel is added |
| FB Page dependency removed by Meta (Instagram Login API change) | Medium (auth break) | Low (unclear timeline) | Monitor Meta developer announcements; fallback to page token path |

---

## 10. Combination with API Options

This architecture pattern is **fully orthogonal** to the API access choice:

| API Option | Compatible? | Notes |
|---|---|---|
| `option-direct-meta-api` | ✅ Yes | Parallel tables IS the natural data model for direct Meta API. The 7 tables in that option are a parallel-tables implementation. |
| `option-graph-api-polling` | ✅ Yes | Polling variant replaces webhook trigger; same DB tables, same coordinator branch |
| `option-composio-relay` | ✅ Yes | Composio relay delivers to same `ig_dm_message` table via adapter; watermark cursor stored in new `ig_dm_watermark` table |
| `option-third-party-relay` (Bird) | ✅ Yes | Bird webhook delivers to `ig_dm_message` via normalized fields; `bird_conversation_id` maps to `ig_conversation_id` |

**Note on `option-direct-meta-api` overlap**: The `option-direct-meta-api` analysis already designed the database schema using a parallel-tables pattern (7 new tables, 3 modified tables). The `option-parallel-tables` document formalizes and examines the trade-offs of that implicit choice, particularly around the draft table dilemma and the 3-way CHECK constraint complexity, and compares it against the channel-abstraction alternative.

The recommended combination for minimal effort is:
**Parallel Tables (this option) + Direct Meta API (`option-direct-meta-api`)** — the lowest additional overhead path to full production-grade IG DM integration.

---

## 11. Summary

The parallel-tables architecture adds Instagram DMs to Cheerful by repeating the same structural pattern used when SMTP was added: new `ig_dm_*` tables for isolation, extended shared tables (`campaign_thread`, `campaign_sender`, `thread_flag`) with a 3-way mutual-exclusivity CHECK constraint, and a third branch in `ThreadProcessingCoordinatorWorkflow` via an extended `Candidate` discriminator.

**Strengths**:
- Proven precedent — SMTP was added this way and works
- Near-zero migration risk (purely additive)
- Full FK referential integrity preserved
- RLS policies are additive, not restructured
- Each channel isolated — bugs in IG DM path do not affect email paths
- Zero extra overhead vs "just implement the feature"

**Weaknesses**:
- Naming debt accumulates: `GmailThreadStatus` and (if extended) `gmail_thread_llm_draft` now serve 3 channels
- `campaign_thread` 3-way CHECK constraint is verbose and scales poorly
- A 4th channel repeats all three weaknesses at larger scale
- No improvement to existing email-path naming confusion (which already bothers any developer reading the SMTP code)

This is the "pay later" option relative to channel abstraction — ship now, potentially refactor later if a 4th channel arrives or if the naming debt becomes an active friction source.
