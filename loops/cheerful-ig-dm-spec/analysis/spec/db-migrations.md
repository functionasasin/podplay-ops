# Spec: Database Migrations — Instagram DM Support

**Aspect**: `spec-db-migrations`
**Wave**: 2 — Schema & Interface Design
**Date**: 2026-02-28
**Input files**:
- `analysis/audit/db-schemas.md` — exact current schema baseline
- `../cheerful-ig-dm-reverse/analysis/option-parallel-tables.md` — parallel tables design
- `../cheerful-ig-dm-reverse/analysis/synthesis/options-catalog.md` — cross-cutting constraints

---

## Files

| Action | Path |
|--------|------|
| CREATE | `projects/cheerful/supabase/migrations/20260228000000_ig_dm_support.sql` |

A single migration file contains all new tables, all table modifications, all new indexes, all trigger functions, and all RLS policies. This matches the SMTP precedent (`20251127000000_smtp_support.sql`).

---

## Migration Overview

The migration file is organized into numbered sections following the SMTP precedent pattern:

```
Section 1:  user_ig_dm_account (new table)
Section 2:  campaign_sender modifications
Section 3:  ig_dm_message (new table)
Section 4:  ig_igsid_cache (new table)
Section 5:  ig_dm_thread_state (new table)
Section 6:  latest_ig_dm_message_per_thread (new table + trigger)
Section 7:  ig_dm_llm_draft (new table)
Section 8:  campaign_thread modifications
Section 9:  thread_flag modifications
Section 10: campaign_creator modifications
Section 11: RLS policies
```

**Why `20260228000000`**: Latest existing migration is `20260224000000`. New migration uses today's date (2026-02-28) with `000000` suffix to allow subsequent same-day migrations.

---

## Section 1: `user_ig_dm_account` (New Table)

Parallel to `user_gmail_account` and `user_smtp_account`. Stores per-user Instagram Business Account credentials, OAuth tokens, and webhook subscription state.

```sql
--------------------------------------------------------------------------------
-- 1. USER_IG_DM_ACCOUNT
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_ig_dm_account (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Meta account identifiers
    instagram_business_account_id TEXT NOT NULL,  -- e.g. "17841400000123456"
    facebook_page_id              TEXT NOT NULL,  -- linked FB Page ID
    ig_username                   TEXT NOT NULL,  -- e.g. "brandname"

    -- OAuth tokens (long-lived page token, 60-day expiry)
    access_token             TEXT NOT NULL,
    access_token_expires_at  TIMESTAMPTZ NOT NULL,
    token_type               TEXT NOT NULL DEFAULT 'page',  -- 'page' | 'user'

    -- Webhook subscription state
    webhook_subscribed       BOOLEAN NOT NULL DEFAULT FALSE,
    webhook_subscription_id  TEXT,
    webhook_subscribed_at    TIMESTAMPTZ,

    -- Initial sync / backfill state
    initial_sync_completed   BOOLEAN NOT NULL DEFAULT FALSE,
    last_sync_cursor         TEXT,   -- Graph API /conversations pagination cursor

    -- Account health
    is_active                BOOLEAN NOT NULL DEFAULT TRUE,
    last_verified_at         TIMESTAMPTZ,
    verification_error       TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_user_ig_dm_account UNIQUE (user_id, instagram_business_account_id)
);

CREATE INDEX IF NOT EXISTS idx_user_ig_dm_account_user_id
    ON user_ig_dm_account (user_id);

CREATE INDEX IF NOT EXISTS idx_user_ig_dm_account_active
    ON user_ig_dm_account (user_id, is_active);
```

**Design notes**:
- `access_token` is stored in plaintext following the pattern of `user_smtp_account.smtp_password`. Supabase RLS restricts access to the owning user.
- `access_token_expires_at` is novel vs Gmail/SMTP — requires a Temporal cron job to refresh before expiry (see `spec-temporal-interfaces.md`).
- `facebook_page_id` is required by the current Meta API (Instagram Messaging requires a linked Facebook Page). May be deprecated by Instagram Login API changes — store it now, make it NOT NULL, and migrate if Meta's requirements change.
- `last_sync_cursor` is used by the reconciliation polling workflow (cron-based webhook recovery) — stores a Graph API conversations pagination cursor.

---

## Section 2: `campaign_sender` Modifications

Extends the existing 2-way Gmail/SMTP mutual exclusivity to a 3-way constraint.

```sql
--------------------------------------------------------------------------------
-- 2. CAMPAIGN_SENDER: Add ig_dm_account_id, expand CHECK to 3-way
--------------------------------------------------------------------------------
ALTER TABLE campaign_sender
    ADD COLUMN IF NOT EXISTS ig_dm_account_id UUID REFERENCES user_ig_dm_account(id);

ALTER TABLE campaign_sender
    DROP CONSTRAINT IF EXISTS chk_campaign_sender_account_type;

ALTER TABLE campaign_sender
    ADD CONSTRAINT chk_campaign_sender_account_type CHECK (
        (gmail_account_id IS NOT NULL AND smtp_account_id IS NULL     AND ig_dm_account_id IS NULL) OR
        (gmail_account_id IS NULL     AND smtp_account_id IS NOT NULL AND ig_dm_account_id IS NULL) OR
        (gmail_account_id IS NULL     AND smtp_account_id IS NULL     AND ig_dm_account_id IS NOT NULL)
    );

DO $$ BEGIN
    ALTER TABLE campaign_sender
        ADD CONSTRAINT uq_campaign_sender_ig_dm UNIQUE (campaign_id, ig_dm_account_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_campaign_sender_ig_dm
    ON campaign_sender (ig_dm_account_id);

COMMENT ON COLUMN campaign_sender.ig_dm_account_id IS
    'Instagram DM account for receiving DMs - mutually exclusive with gmail_account_id and smtp_account_id';
```

**Why `campaign_sender` gets the IG DM account**: One campaign uses one IG Business Account. The `campaign_sender` row formalizes the campaign ↔ IG account assignment. This is the same semantics as Gmail/SMTP (one campaign uses one sending account).

---

## Section 3: `ig_dm_message` (New Table)

Parallel to `gmail_message` and `smtp_message`. Stores individual DM messages. Diverges from email shape: no subject, no CC/BCC, no RFC 2822 headers; adds `media_storage_paths`, `is_echo`, `sender_igsid`.

```sql
--------------------------------------------------------------------------------
-- 3. IG_DM_MESSAGE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ig_dm_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ownership
    user_id          UUID NOT NULL REFERENCES auth.users(id),
    ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id) ON DELETE CASCADE,

    -- Meta identifiers
    mid                  TEXT NOT NULL,  -- Message ID from Meta (global, unique per sender)
    ig_conversation_id   TEXT NOT NULL,  -- Meta conversation thread ID

    -- Sender / recipient (IGSIDs are opaque numeric strings from Meta)
    sender_igsid     TEXT NOT NULL,   -- IGSID of the message sender
    sender_username  TEXT,            -- @username resolved from ig_igsid_cache; NULL until resolved
    recipient_igsid  TEXT NOT NULL,   -- IGSID of the recipient

    -- Direction
    direction TEXT NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    is_echo   BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE if this is a Meta webhook echo of an outbound msg

    -- Content
    body_text    TEXT,  -- NULL for media-only messages
    message_type TEXT NOT NULL DEFAULT 'text'
        CHECK (message_type IN ('text', 'image', 'video', 'audio', 'story_reply', 'unsupported')),

    -- Media (Meta CDN URLs are ephemeral ~1 hour; download and re-store in Supabase Storage)
    media_storage_paths TEXT[],  -- Supabase Storage object paths (permanent)
    media_original_urls TEXT[],  -- Original Meta CDN URLs (stored for reference, may expire)

    -- Timestamps
    sent_at     TIMESTAMPTZ NOT NULL,           -- From Meta webhook timestamp field
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- When Cheerful stored it

    -- Threading
    reply_to_mid TEXT,  -- MID of the message this is a reply to (if any)

    -- Deduplication
    CONSTRAINT uq_ig_dm_message UNIQUE (ig_dm_account_id, mid)
);

CREATE INDEX IF NOT EXISTS idx_ig_dm_message_conversation
    ON ig_dm_message (ig_dm_account_id, ig_conversation_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_ig_dm_message_sender_igsid
    ON ig_dm_message (sender_igsid);

CREATE INDEX IF NOT EXISTS idx_ig_dm_message_user_id
    ON ig_dm_message (user_id);

CREATE INDEX IF NOT EXISTS idx_ig_dm_message_sent_at
    ON ig_dm_message (ig_dm_account_id, sent_at DESC);
```

**Key design decisions**:

| Email field | IG DM equivalent | Notes |
|-------------|-----------------|-------|
| `gmail_message_id` / `message_id_header` | `mid` | Meta's opaque message ID |
| `gmail_thread_id` / `email_thread_id` | `ig_conversation_id` | Meta's conversation ID |
| `sender_email` | `sender_igsid` + `sender_username` | IGSID is the identity; username is cached |
| `subject` | *(absent)* | DMs have no subject |
| `body_html` | *(absent)* | DMs are always plain text |
| `recipient_emails[]` | `recipient_igsid` | Single recipient only |
| Attachments (DB-level) | `media_storage_paths[]` | DMs use URL-based media |
| `internal_date` | `sent_at` | Semantic equivalent |

**Idempotent ingestion**: `ON CONFLICT (ig_dm_account_id, mid) DO NOTHING` — the webhook handler deduplicates using this unique constraint.

---

## Section 4: `ig_igsid_cache` (New Table)

No email parallel. Caches IGSID → username/display_name resolution to avoid repeated Graph API calls. Not user-scoped — a single cache serves all users (same IGSID may appear across multiple Cheerful accounts).

```sql
--------------------------------------------------------------------------------
-- 4. IG_IGSID_CACHE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ig_igsid_cache (
    igsid        TEXT PRIMARY KEY,  -- Meta IGSID, e.g. "17841400000123456"
    username     TEXT NOT NULL,     -- Instagram @username, e.g. "janedoe"
    display_name TEXT,              -- Full display name, e.g. "Jane Doe"
    resolved_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ig_igsid_cache_username
    ON ig_igsid_cache (username);
```

**Design notes**:
- No `user_id` column — this is a shared system cache, not per-user data.
- `last_seen_at` is updated each time the IGSID appears in a webhook event, enabling TTL-based cache eviction (future: delete rows where `last_seen_at < NOW() - INTERVAL '90 days'`).
- No RLS — this table is read/written by the backend service only (never exposed directly to frontend). Backend enforces access control in application logic.
- Usernames can change on Instagram. The `resolved_at` timestamp allows cache invalidation logic (re-resolve if `resolved_at < NOW() - INTERVAL '7 days'`).

---

## Section 5: `ig_dm_thread_state` (New Table)

Parallel to `gmail_thread_state` and `smtp_thread_state`. Append-only event-sourced state log. Adds `window_expires_at` — the Instagram 24-hour messaging window — which has no email equivalent.

```sql
--------------------------------------------------------------------------------
-- 5. IG_DM_THREAD_STATE
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ig_dm_thread_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ownership
    user_id          UUID NOT NULL REFERENCES auth.users(id),
    ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id),

    -- Thread identity
    ig_conversation_id TEXT NOT NULL,  -- Meta conversation ID (= campaign_thread.ig_dm_thread_id)

    -- State machine
    -- Values: READY_FOR_CAMPAIGN_ASSOCIATION | READY_FOR_RESPONSE_DRAFT |
    --         WAITING_FOR_DRAFT_REVIEW | WAITING_FOR_INBOUND | IGNORE | DONE | NOT_LATEST
    -- Note: READY_FOR_ATTACHMENT_EXTRACTION is never used for DMs (no attachments)
    status TEXT NOT NULL,

    -- Version (append-only pattern — one row per state transition)
    latest_internal_date TIMESTAMPTZ NOT NULL,  -- sent_at of the message that triggered this row

    -- DM-specific: 24-hour messaging window
    -- Non-NULL when a new inbound message arrived (window opens).
    -- = latest_internal_date + INTERVAL '24 hours'.
    -- NULL for system-generated state rows (IGNORE, DONE) where window is not relevant.
    window_expires_at TIMESTAMPTZ,

    -- Causation tracing
    triggered_by_mid TEXT,  -- ig_dm_message.mid that caused this state transition

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_ig_dm_thread_state_version
        UNIQUE (user_id, ig_dm_account_id, ig_conversation_id, latest_internal_date)
);

CREATE INDEX IF NOT EXISTS idx_ig_dm_thread_state_latest
    ON ig_dm_thread_state (ig_dm_account_id, ig_conversation_id, latest_internal_date DESC);

CREATE INDEX IF NOT EXISTS idx_ig_dm_thread_state_user_latest
    ON ig_dm_thread_state (user_id, ig_dm_account_id, ig_conversation_id, latest_internal_date DESC);

CREATE INDEX IF NOT EXISTS idx_ig_dm_thread_state_user_latest_date
    ON ig_dm_thread_state (user_id, latest_internal_date DESC);

CREATE INDEX IF NOT EXISTS idx_ig_dm_thread_state_covering
    ON ig_dm_thread_state (user_id, ig_conversation_id, latest_internal_date DESC)
    INCLUDE (id, status, ig_dm_account_id, window_expires_at);
```

**Why reuse `GmailThreadStatus` enum (Python StrEnum) rather than a new enum**:
- The existing 7 status values are semantically valid for DMs (see mapping table below).
- PostgreSQL stores status as `TEXT` (not a DB ENUM type) — no DB-level migration needed for the new values.
- The `READY_FOR_ATTACHMENT_EXTRACTION` status is simply never emitted for DM threads (coordinator branch skips that step).
- A new Python `IgDmThreadStatus = GmailThreadStatus` alias can be added for code clarity without any DB migration.

| Status | DM Semantics |
|--------|-------------|
| `READY_FOR_CAMPAIGN_ASSOCIATION` | New DM arrived; needs campaign routing via IG account → campaign mapping |
| `READY_FOR_RESPONSE_DRAFT` | Campaigned associated; ready for AI draft generation |
| `WAITING_FOR_DRAFT_REVIEW` | AI draft generated; pending user review/send |
| `WAITING_FOR_INBOUND` | Reply sent; waiting for creator to reply |
| `IGNORE` | DM not associated with any campaign |
| `DONE` | Conversation complete |
| `NOT_LATEST` | Superseded by a newer state row (append-only marker) |
| `READY_FOR_ATTACHMENT_EXTRACTION` | **Never used for DMs** |

---

## Section 6: `latest_ig_dm_message_per_thread` (New Table + Trigger)

Parallel to `latest_gmail_message_per_thread` and `latest_smtp_message_per_thread`. Trigger-maintained denormalized table for fast latest-message lookups (used by inbox API for thread list rendering).

```sql
--------------------------------------------------------------------------------
-- 6. LATEST_IG_DM_MESSAGE_PER_THREAD + TRIGGER
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS latest_ig_dm_message_per_thread (
    ig_dm_account_id      UUID NOT NULL REFERENCES user_ig_dm_account(id) ON DELETE CASCADE,
    ig_conversation_id    TEXT NOT NULL,
    latest_message_id     UUID NOT NULL REFERENCES ig_dm_message(id) ON DELETE CASCADE,
    latest_message_sent_at TIMESTAMPTZ NOT NULL,
    direction             TEXT NOT NULL,  -- 'INBOUND' | 'OUTBOUND' (for inbox preview)
    PRIMARY KEY (ig_dm_account_id, ig_conversation_id)
);

-- Trigger function: maintain latest_ig_dm_message_per_thread on INSERT to ig_dm_message
CREATE OR REPLACE FUNCTION update_latest_ig_dm_message_per_thread()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO latest_ig_dm_message_per_thread
        (ig_dm_account_id, ig_conversation_id, latest_message_id, latest_message_sent_at, direction)
    VALUES
        (NEW.ig_dm_account_id, NEW.ig_conversation_id, NEW.id, NEW.sent_at, NEW.direction)
    ON CONFLICT (ig_dm_account_id, ig_conversation_id)
    DO UPDATE SET
        latest_message_id      = EXCLUDED.latest_message_id,
        latest_message_sent_at = EXCLUDED.latest_message_sent_at,
        direction              = EXCLUDED.direction
    WHERE EXCLUDED.latest_message_sent_at > latest_ig_dm_message_per_thread.latest_message_sent_at;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_latest_ig_dm_message
    AFTER INSERT ON ig_dm_message
    FOR EACH ROW EXECUTE FUNCTION update_latest_ig_dm_message_per_thread();
```

**Structural differences vs Gmail counterpart**:
- Primary key is `(ig_dm_account_id, ig_conversation_id)` (composite) vs Gmail's `(gmail_thread_id)` (single column) — because IG DM conversation IDs are not globally unique across accounts.
- Adds `direction` column (parallel to SMTP version's pattern) for inbox preview (shows whether latest message was sent by us or received from creator).
- Trigger fires on INSERT only (same as Gmail/SMTP pattern) — no UPDATE trigger needed since messages are immutable once stored.

---

## Section 7: `ig_dm_llm_draft` (New Table)

**Decision: Option B — new isolated table** (not extending `gmail_thread_llm_draft`). Per the architectural decision in the loop prompt: clean isolation over naming debt.

```sql
--------------------------------------------------------------------------------
-- 7. IG_DM_LLM_DRAFT
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ig_dm_llm_draft (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ownership
    user_id          UUID NOT NULL REFERENCES auth.users(id),
    ig_dm_account_id UUID NOT NULL REFERENCES user_ig_dm_account(id),

    -- Thread references
    ig_dm_thread_state_id UUID NOT NULL REFERENCES ig_dm_thread_state(id),
    ig_conversation_id    TEXT NOT NULL,  -- Denormalized for query convenience

    -- Draft content (plain text only — no subject, no HTML for DMs)
    draft_body_text TEXT NOT NULL,

    -- Observability
    langfuse_session_id TEXT,  -- Langfuse session ID for this draft generation run

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One draft per thread state version
    CONSTRAINT uq_ig_dm_llm_draft_per_state
        UNIQUE (ig_dm_account_id, ig_conversation_id, ig_dm_thread_state_id)
);

CREATE INDEX IF NOT EXISTS idx_ig_dm_llm_draft_account
    ON ig_dm_llm_draft (ig_dm_account_id);

CREATE INDEX IF NOT EXISTS idx_ig_dm_llm_draft_state
    ON ig_dm_llm_draft (ig_dm_thread_state_id);
```

**Why Option B (new table) vs Option A (extend `gmail_thread_llm_draft`)**:
- Avoids adding a 3rd mutually-exclusive account FK column (`ig_dm_account_id`) to an already-confused table named `gmail_thread_llm_draft`.
- No nullable `draft_subject` or `gmail_draft_id` noise columns for DM rows.
- Email draft logic is untouched; IG DM draft logic is fully isolated.
- Cost: Coordinator must branch on which draft table to query — same pattern as the existing Gmail vs SMTP branch.

**Column differences vs `gmail_thread_llm_draft`**:
| `gmail_thread_llm_draft` column | `ig_dm_llm_draft` equivalent | Notes |
|--------------------------------|------------------------------|-------|
| `gmail_thread_id TEXT NOT NULL` | `ig_conversation_id TEXT NOT NULL` | Different ID type |
| `gmail_thread_state_id UUID` | `ig_dm_thread_state_id UUID NOT NULL` | NOT NULL (always scoped to a state) |
| `draft_subject TEXT` | *(absent)* | DMs have no subject |
| `draft_body_text TEXT` | `draft_body_text TEXT NOT NULL` | Same semantics, NOT NULL for DMs |
| `draft_body_html TEXT` | *(absent)* | DMs are always plain text |
| `gmail_draft_id TEXT` | *(absent)* | No Gmail draft integration for DMs |
| `gmail_account_id UUID` | `ig_dm_account_id UUID NOT NULL` | Different account reference, NOT NULL |
| `smtp_account_id UUID` | *(absent)* | Not applicable |
| `smtp_thread_state_id UUID` | *(absent)* | Not applicable |

---

## Section 8: `campaign_thread` Modifications

Adds the IG DM thread identifier and expands the 2-way mutual-exclusivity CHECK to 3-way.

```sql
--------------------------------------------------------------------------------
-- 8. CAMPAIGN_THREAD: Add ig_dm_thread_id + ig_dm_account_id, expand CHECK to 3-way
--------------------------------------------------------------------------------
ALTER TABLE campaign_thread
    ADD COLUMN IF NOT EXISTS ig_dm_thread_id  TEXT,
    ADD COLUMN IF NOT EXISTS ig_dm_account_id UUID REFERENCES user_ig_dm_account(id);

-- Expand 2-way CHECK to 3-way
ALTER TABLE campaign_thread
    DROP CONSTRAINT IF EXISTS chk_campaign_thread_one_thread_id;

ALTER TABLE campaign_thread
    ADD CONSTRAINT chk_campaign_thread_one_thread_id CHECK (
        -- Gmail path
        (gmail_thread_id IS NOT NULL AND email_thread_id IS NULL     AND ig_dm_thread_id IS NULL) OR
        -- SMTP path
        (gmail_thread_id IS NULL     AND email_thread_id IS NOT NULL AND ig_dm_thread_id IS NULL) OR
        -- Instagram DM path
        (gmail_thread_id IS NULL     AND email_thread_id IS NULL     AND ig_dm_thread_id IS NOT NULL)
    );

-- Ensure ig_dm_account_id is set when ig_dm_thread_id is set
ALTER TABLE campaign_thread
    ADD CONSTRAINT chk_campaign_thread_ig_dm_account CHECK (
        (ig_dm_thread_id IS NULL AND ig_dm_account_id IS NULL) OR
        (ig_dm_thread_id IS NOT NULL AND ig_dm_account_id IS NOT NULL)
    );

-- Unique index: one campaign_thread per (account, conversation) pair
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_thread_ig_dm
    ON campaign_thread (ig_dm_account_id, ig_dm_thread_id)
    WHERE ig_dm_thread_id IS NOT NULL;

COMMENT ON COLUMN campaign_thread.ig_dm_thread_id IS
    'Instagram DM conversation ID (Meta ig_conversation_id) - mutually exclusive with gmail_thread_id and email_thread_id';
COMMENT ON COLUMN campaign_thread.ig_dm_account_id IS
    'Instagram DM account associated with this thread - required when ig_dm_thread_id is set';
```

**Semantic mapping**: `campaign_thread.ig_dm_thread_id` = `ig_dm_message.ig_conversation_id` = `ig_dm_thread_state.ig_conversation_id`. All three use the same Meta conversation ID string.

**Why `ig_dm_account_id` on `campaign_thread` (unlike email)**:
- `gmail_thread_id` is globally unique across Gmail (Google's guarantee), so no account context is needed for `campaign_thread` lookup.
- `ig_conversation_id` from Meta is unique within an account but NOT globally unique across accounts. The composite `(ig_dm_account_id, ig_dm_thread_id)` is the true unique key.

---

## Section 9: `thread_flag` Modifications

Parallel to `campaign_thread` modification. Expands the 2-way mutual-exclusivity to 3-way.

```sql
--------------------------------------------------------------------------------
-- 9. THREAD_FLAG: Add ig_dm_thread_id + ig_dm_account_id, expand CHECK to 3-way
--------------------------------------------------------------------------------
ALTER TABLE thread_flag
    ADD COLUMN IF NOT EXISTS ig_dm_thread_id  TEXT,
    ADD COLUMN IF NOT EXISTS ig_dm_account_id UUID REFERENCES user_ig_dm_account(id);

ALTER TABLE thread_flag
    DROP CONSTRAINT IF EXISTS chk_thread_flag_one_thread_id;

ALTER TABLE thread_flag
    ADD CONSTRAINT chk_thread_flag_one_thread_id CHECK (
        (gmail_thread_id IS NOT NULL AND email_thread_id IS NULL     AND ig_dm_thread_id IS NULL) OR
        (gmail_thread_id IS NULL     AND email_thread_id IS NOT NULL AND ig_dm_thread_id IS NULL) OR
        (gmail_thread_id IS NULL     AND email_thread_id IS NULL     AND ig_dm_thread_id IS NOT NULL)
    );

ALTER TABLE thread_flag
    ADD CONSTRAINT chk_thread_flag_ig_dm_account CHECK (
        (ig_dm_thread_id IS NULL AND ig_dm_account_id IS NULL) OR
        (ig_dm_thread_id IS NOT NULL AND ig_dm_account_id IS NOT NULL)
    );

DO $$ BEGIN
    ALTER TABLE thread_flag
        ADD CONSTRAINT uq_thread_flag_ig_dm UNIQUE (ig_dm_account_id, ig_dm_thread_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_thread_flag_ig_dm
    ON thread_flag (ig_dm_account_id, ig_dm_thread_id)
    WHERE ig_dm_thread_id IS NOT NULL;
```

---

## Section 10: `campaign_creator` Modifications

Adds `ig_igsid` column for direct IGSID → creator mapping after resolution, and a GIN index on `social_media_handles` for efficient JSONB containment queries.

```sql
--------------------------------------------------------------------------------
-- 10. CAMPAIGN_CREATOR: Add ig_igsid column + GIN index on social_media_handles
--------------------------------------------------------------------------------
ALTER TABLE campaign_creator
    ADD COLUMN IF NOT EXISTS ig_igsid TEXT;

-- Direct lookup: IGSID → campaign_creator (after first resolution)
CREATE INDEX IF NOT EXISTS idx_campaign_creator_ig_igsid
    ON campaign_creator (ig_igsid)
    WHERE ig_igsid IS NOT NULL;

-- GIN index for JSONB containment queries against social_media_handles
-- Enables: WHERE social_media_handles @> '[{"platform":"instagram","handle":"janedoe"}]'::jsonb
CREATE INDEX IF NOT EXISTS idx_campaign_creator_social_handles_gin
    ON campaign_creator USING GIN (social_media_handles);
```

**Creator resolution flow (context for these schema changes)**:
1. DM arrives with `sender_igsid = "17841400123456"`.
2. Check `ig_igsid_cache` for username → get `"janedoe"`.
3. Query: `SELECT * FROM campaign_creator WHERE ig_igsid = '17841400123456'` — O(1) if previously resolved.
4. If no `ig_igsid` match: `SELECT * FROM campaign_creator WHERE social_media_handles @> '[{"platform":"instagram","handle":"janedoe"}]'::jsonb` — uses GIN index.
5. On match: `UPDATE campaign_creator SET ig_igsid = '17841400123456'` — caches for next time.

---

## Section 11: RLS Policies

```sql
--------------------------------------------------------------------------------
-- 11. RLS POLICIES
--------------------------------------------------------------------------------

-- user_ig_dm_account: Full owner CRUD (matches user_smtp_account pattern)
ALTER TABLE user_ig_dm_account ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ig dm accounts"
    ON user_ig_dm_account FOR SELECT
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own ig dm accounts"
    ON user_ig_dm_account FOR INSERT
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own ig dm accounts"
    ON user_ig_dm_account FOR UPDATE
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own ig dm accounts"
    ON user_ig_dm_account FOR DELETE
    USING ((SELECT auth.uid()) = user_id);

-- ig_dm_message: Owner SELECT (matches gmail_message pattern)
ALTER TABLE ig_dm_message ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ig dm messages"
    ON ig_dm_message FOR SELECT
    USING ((SELECT auth.uid()) = user_id);

-- ig_dm_thread_state: Owner SELECT (matches gmail_thread_state pattern)
ALTER TABLE ig_dm_thread_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ig dm thread states"
    ON ig_dm_thread_state FOR SELECT
    USING ((SELECT auth.uid()) = user_id);

-- ig_igsid_cache: NO RLS (system-level shared cache; backend-only access)
-- ig_dm_message table is already RLS-protected; cache contains no user data.

-- ig_dm_llm_draft: Owner SELECT (matches gmail_thread_llm_draft pattern)
ALTER TABLE ig_dm_llm_draft ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ig dm llm drafts"
    ON ig_dm_llm_draft FOR SELECT
    USING ((SELECT auth.uid()) = user_id);

-- latest_ig_dm_message_per_thread: Owner SELECT via ig_dm_account join
-- (matches latest_gmail_message_per_thread pattern which joins to gmail_message.user_id)
ALTER TABLE latest_ig_dm_message_per_thread ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own latest ig dm messages"
    ON latest_ig_dm_message_per_thread FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_ig_dm_account
            WHERE user_ig_dm_account.id = latest_ig_dm_message_per_thread.ig_dm_account_id
            AND user_ig_dm_account.user_id = (SELECT auth.uid())
        )
    );
```

---

## Complete Schema Summary

### New Tables

| Table | Rows represent | PK | Key FKs |
|-------|---------------|-----|---------|
| `user_ig_dm_account` | One connected Instagram Business Account | `id` | `auth.users(id)` |
| `ig_dm_message` | One DM message (inbound or outbound) | `id` | `user_ig_dm_account(id)`, `auth.users(id)` |
| `ig_igsid_cache` | One resolved IGSID → username mapping | `igsid` | — |
| `ig_dm_thread_state` | One state transition event (append-only) | `id` | `user_ig_dm_account(id)`, `auth.users(id)` |
| `latest_ig_dm_message_per_thread` | Latest message per conversation (denormalized) | `(ig_dm_account_id, ig_conversation_id)` | `user_ig_dm_account(id)`, `ig_dm_message(id)` |
| `ig_dm_llm_draft` | One AI-generated draft for a thread state | `id` | `user_ig_dm_account(id)`, `ig_dm_thread_state(id)`, `auth.users(id)` |

### Modified Tables

| Table | New Columns | Constraint Change |
|-------|------------|-------------------|
| `campaign_sender` | `ig_dm_account_id UUID` | 2-way CHECK → 3-way |
| `campaign_thread` | `ig_dm_thread_id TEXT`, `ig_dm_account_id UUID` | 2-way CHECK → 3-way + new subsidiary CHECK |
| `thread_flag` | `ig_dm_thread_id TEXT`, `ig_dm_account_id UUID` | 2-way CHECK → 3-way + new subsidiary CHECK |
| `campaign_creator` | `ig_igsid TEXT` | No constraint change; GIN index added |

### RLS Status After Migration

| Table | RLS | Pattern |
|-------|-----|---------|
| `user_ig_dm_account` | Enabled | Owner CRUD |
| `ig_dm_message` | Enabled | Owner SELECT |
| `ig_dm_thread_state` | Enabled | Owner SELECT |
| `ig_igsid_cache` | Disabled | System-level shared cache |
| `ig_dm_llm_draft` | Enabled | Owner SELECT |
| `latest_ig_dm_message_per_thread` | Enabled | Owner SELECT via account JOIN |

### New Enum Values (Python only — no DB migration needed)

In `apps/backend/src/models/database/account_type.py`:
```python
class AccountType(StrEnum):
    GMAIL        = "gmail"
    SMTP         = "smtp"
    INSTAGRAM_DM = "instagram_dm"  # NEW
```

In `apps/backend/src/models/database/ig_dm_thread_state.py` (new file — see `spec-pydantic-models.md`):
```python
# Alias for code clarity — uses same underlying string values as GmailThreadStatus
IgDmThreadStatus = GmailThreadStatus
```

---

## Migration Safety Notes

See `analysis/spec/migration-safety.md` for full rollback plan and zero-downtime deployment guidance.

**Key safety facts**:
- All new tables: purely additive, zero risk to existing code.
- All `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`: additive, zero risk.
- CHECK constraint expansion (`DROP CONSTRAINT IF EXISTS` + `ADD CONSTRAINT`): runs in a transaction. Existing rows satisfy the new 3-way constraint because they have `ig_dm_*` columns as NULL (null satisfies the existing gmail or smtp branch).
- The new subsidiary `chk_campaign_thread_ig_dm_account` and `chk_thread_flag_ig_dm_account` constraints pass for all existing rows (both new columns are NULL → first branch: `NULL IS NULL AND NULL IS NULL` = TRUE).
