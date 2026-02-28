# DB Schema Audit — Exact Current State

Audited from: `../../projects/cheerful/supabase/migrations/`
Date: 2026-02-28
Wave 1 / aspect: `audit-db-schemas`

This document captures the EXACT current schema for every table the IG DM integration will touch. Migration files were read in chronological order; this reflects the **final net state** after all applied migrations.

---

## `GmailThreadStatus` Enum

**Defined in:** `apps/backend/src/models/database/gmail_thread_state.py` (Python `StrEnum`)
**NOT defined as a PostgreSQL ENUM type** — stored as plain `TEXT` column in DB.

```python
class GmailThreadStatus(StrEnum):
    # Processing steps
    READY_FOR_ATTACHMENT_EXTRACTION = "READY_FOR_ATTACHMENT_EXTRACTION"
    READY_FOR_CAMPAIGN_ASSOCIATION  = "READY_FOR_CAMPAIGN_ASSOCIATION"
    READY_FOR_RESPONSE_DRAFT        = "READY_FOR_RESPONSE_DRAFT"
    WAITING_FOR_DRAFT_REVIEW        = "WAITING_FOR_DRAFT_REVIEW"
    WAITING_FOR_INBOUND             = "WAITING_FOR_INBOUND"
    # Terminal states
    IGNORE    = "IGNORE"
    DONE      = "DONE"
    NOT_LATEST = "NOT_LATEST"
```

**Key insight:** Status is enforced in Python, not in the DB. IG DM will define a parallel `IgDmThreadStatus` StrEnum.

---

## `AccountType` Enum

**Defined in:** `apps/backend/src/models/database/account_type.py`

```python
class AccountType(StrEnum):
    GMAIL = "gmail"
    SMTP  = "smtp"
```

Will need `INSTAGRAM_DM = "instagram_dm"` added.

---

## `can_access_campaign()` Helper Function

**Defined in:** `20260217100000_fix_campaign_child_table_rls_for_team_members.sql`

```sql
CREATE OR REPLACE FUNCTION public.can_access_campaign(p_campaign_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.campaign
    WHERE id = p_campaign_id AND user_id = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.campaign_member_assignment
    WHERE campaign_id = p_campaign_id AND user_id = (SELECT auth.uid())
  );
$$;
```

**Used by:** SELECT policies on all campaign child tables. New IG DM tables must use this same function for RLS.

---

## Table: `user_gmail_account`

**Migration:** `20250903000000_initial.sql`
**Modified by:** `20260217100003_restrict_sensitive_columns_on_email_account_tables.sql` (dropped team SELECT policy)

```sql
CREATE TABLE IF NOT EXISTS user_gmail_account (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES auth.users(id),
  gmail_email          text NOT NULL UNIQUE,
  refresh_token        text NOT NULL,
  last_poll_history_id bigint,
  sync_in_progress     boolean DEFAULT false,
  is_active            boolean DEFAULT true,
  created_at           timestamp with time zone DEFAULT now(),
  updated_at           timestamp with time zone DEFAULT now()
);
```

**RLS:** Enabled
**Policies (final state):**

| Policy | Operation | Condition |
|--------|-----------|-----------|
| "Users can view own gmail accounts" | SELECT | `(select auth.uid()) = user_id` |

> Note: A team-member SELECT policy added in `20260217100001` was **dropped** in `20260217100003`. Only owner-SELECT remains.

---

## Table: `user_smtp_account`

**Migration:** `20251127000000_smtp_support.sql`
**Modified by:** `20260217100003` (dropped team SELECT policy)

```sql
CREATE TABLE IF NOT EXISTS user_smtp_account (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_address    TEXT NOT NULL,
    display_name     TEXT,
    smtp_host        TEXT NOT NULL,
    smtp_port        INTEGER NOT NULL DEFAULT 587,
    smtp_username    TEXT NOT NULL,
    smtp_password    TEXT NOT NULL,
    smtp_use_tls     BOOLEAN NOT NULL DEFAULT TRUE,
    imap_host        TEXT NOT NULL,
    imap_port        INTEGER NOT NULL DEFAULT 993,
    imap_username    TEXT NOT NULL,
    imap_password    TEXT NOT NULL,
    imap_use_ssl     BOOLEAN NOT NULL DEFAULT TRUE,
    sync_in_progress      BOOLEAN NOT NULL DEFAULT FALSE,
    last_sync_uid         BIGINT,
    last_sync_uidvalidity BIGINT,
    last_sync_timestamp   TIMESTAMPTZ,
    is_active             BOOLEAN NOT NULL DEFAULT TRUE,
    last_verified_at      TIMESTAMPTZ,
    verification_error    TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_smtp_account_user_email UNIQUE(user_id, email_address)
);
```

**Indexes:**
```sql
CREATE INDEX IF NOT EXISTS idx_user_smtp_account_user_id  ON user_smtp_account(user_id);
CREATE INDEX IF NOT EXISTS idx_user_smtp_account_email    ON user_smtp_account(email_address);
CREATE INDEX IF NOT EXISTS idx_user_smtp_account_active   ON user_smtp_account(user_id, is_active);
```

**RLS:** Enabled
**Policies (final state — owner-only after 20260217100003 dropped team policy):**

| Policy | Operation | Condition |
|--------|-----------|-----------|
| "Users can view own smtp accounts"   | SELECT | `(SELECT auth.uid()) = user_id` |
| "Users can insert own smtp accounts" | INSERT | `(SELECT auth.uid()) = user_id` |
| "Users can update own smtp accounts" | UPDATE | `(SELECT auth.uid()) = user_id` |
| "Users can delete own smtp accounts" | DELETE | `(SELECT auth.uid()) = user_id` |

---

## Table: `campaign_thread`

**Migration:** `20250903000000_initial.sql`
**Modified by:** `20251030_make_gmail_thread_unique_per_campaign.sql`, `20251127000000_smtp_support.sql`, `20260217100000_fix_campaign_child_table_rls_for_team_members.sql`

```sql
-- Current effective DDL (after all modifications):
CREATE TABLE campaign_thread (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id   uuid NOT NULL REFERENCES campaign(id),
    gmail_thread_id  text,    -- nullable since smtp migration
    email_thread_id  TEXT,    -- added in smtp migration
    associated_at timestamp with time zone DEFAULT now()
);
```

**Constraints (final state):**
```sql
CONSTRAINT campaign_thread_gmail_thread_id_key  UNIQUE (gmail_thread_id)
CONSTRAINT campaign_thread_email_thread_id_key  UNIQUE (email_thread_id)
CONSTRAINT chk_campaign_thread_one_thread_id CHECK (
    (gmail_thread_id IS NOT NULL AND email_thread_id IS NULL) OR
    (gmail_thread_id IS NULL AND email_thread_id IS NOT NULL)
)
```

**Indexes:**
```sql
CREATE INDEX IF NOT EXISTS idx_campaign_thread_email_thread_id
    ON campaign_thread(email_thread_id)
    WHERE email_thread_id IS NOT NULL;
```

**RLS:** Enabled
**Policies (final state after 20260217100000):**

| Policy | Operation | Condition |
|--------|-----------|-----------|
| "Users can view own or assigned campaign threads" | SELECT | `public.can_access_campaign(campaign_id)` |
| "Users can insert own campaign threads"           | INSERT | campaign owner subquery |
| "Users can update own campaign threads"           | UPDATE | campaign owner subquery |
| "Users can delete own campaign threads"           | DELETE | campaign owner subquery |

**IG DM impact:** Must add `ig_dm_thread_id TEXT` column and expand the CHECK constraint to 3-way.

---

## Table: `campaign_sender`

**Migration:** `20250903000000_initial.sql`
**Modified by:** `20251127000000_smtp_support.sql`, `20260217100000`

```sql
-- Current effective DDL:
CREATE TABLE campaign_sender (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id      uuid NOT NULL REFERENCES campaign(id),
    gmail_account_id uuid REFERENCES user_gmail_account(id),  -- nullable since smtp migration
    smtp_account_id  UUID REFERENCES user_smtp_account(id),   -- added in smtp migration
    created_at       timestamp with time zone DEFAULT now()
);
```

**Constraints (final state):**
```sql
UNIQUE(campaign_id, gmail_account_id)
CONSTRAINT uq_campaign_sender_smtp  UNIQUE(campaign_id, smtp_account_id)
CONSTRAINT chk_campaign_sender_account_type CHECK (
    (gmail_account_id IS NOT NULL AND smtp_account_id IS NULL) OR
    (gmail_account_id IS NULL AND smtp_account_id IS NOT NULL)
)
```

**Indexes:**
```sql
CREATE INDEX IF NOT EXISTS idx_campaign_sender_smtp ON campaign_sender(smtp_account_id);
```

**RLS:** Enabled (same pattern as campaign_thread — can_access_campaign for SELECT, owner-only for writes)

**IG DM impact:** Must add `ig_dm_account_id UUID REFERENCES user_ig_dm_account(id)` and expand CHECK to 3-way.

---

## Table: `campaign_creator`

**Migration:** `20251113113540_add_campaign_creator_table.sql`
**Modified by:** Multiple subsequent migrations

```sql
-- Current effective DDL (all columns):
CREATE TABLE campaign_creator (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id         UUID NOT NULL REFERENCES campaign(id),
    email               TEXT,
    name                TEXT,
    social_media_handles JSONB NOT NULL DEFAULT '[]'::jsonb,
    gifting_status      TEXT,
    gifting_address     TEXT,
    gifting_discount_code TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT now(),
    -- Added 20260115:
    notes_history       JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Added 20260122:
    paid_promotion_status TEXT,
    paid_promotion_rate   TEXT,
    -- Added 20260125:
    source_gmail_thread_id TEXT,
    role               TEXT NOT NULL DEFAULT 'unknown',
    talent_manager_name  TEXT,
    talent_manager_email TEXT,
    talent_agency        TEXT,
    confidence_score     FLOAT NOT NULL DEFAULT 0.0,
    manually_verified    BOOLEAN NOT NULL DEFAULT FALSE,
    -- Added 20260211100000:
    slack_digest_message_ts  TEXT,
    slack_approval_status    TEXT,
    -- Added 20260205100000:
    latest_interaction_at          TIMESTAMPTZ,
    latest_interaction_campaign_id UUID REFERENCES campaign(id) ON DELETE SET NULL,
    -- Added 20260220000000:
    shopify_order_id    TEXT,
    -- Added 20260224000000:
    enrichment_status   TEXT DEFAULT NULL
);
```

**Indexes:**
```sql
CREATE INDEX idx_campaign_creator_has_notes     ON campaign_creator ((notes_history != '[]'::jsonb));
CREATE INDEX idx_campaign_creator_role           ON campaign_creator(campaign_id, role);
CREATE INDEX idx_campaign_creator_source_thread  ON campaign_creator(source_gmail_thread_id);
CREATE INDEX IF NOT EXISTS idx_campaign_creator_email              ON public.campaign_creator(email);
CREATE INDEX IF NOT EXISTS idx_campaign_creator_campaign_id_email  ON public.campaign_creator(campaign_id, email);
CREATE INDEX IF NOT EXISTS idx_campaign_creator_campaign_created   ON campaign_creator(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_creator_campaign_id_lower_name ON public.campaign_creator(campaign_id, lower(name));
```

**RLS:** NOT enabled (original migration has `-- TODO: rls policies` comment, no RLS migration ever applied).

**`social_media_handles` JSONB format:** Array of handle objects. The GIN index for IG DM matching will be:
```sql
CREATE INDEX idx_campaign_creator_social_handles_gin ON campaign_creator USING GIN (social_media_handles);
```

**IG DM impact:** Must add `ig_igsid TEXT` column for caching resolved IGSID → creator mapping. Also add GIN index on `social_media_handles`.

---

## Table: `gmail_message`

**Migration:** `20250903000000_initial.sql`
**Modified by:** Indexes only — `20260112000000`, `20260216120000`, `20260205100001`

```sql
CREATE TABLE gmail_message (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gmail_account_id UUID NOT NULL REFERENCES user_gmail_account(id) ON DELETE CASCADE,
    gmail_message_id TEXT NOT NULL,
    gmail_thread_id  TEXT NOT NULL,
    direction        TEXT NOT NULL,
    sender_email     TEXT NOT NULL,
    recipient_emails TEXT[] DEFAULT '{}' NOT NULL,
    cc_emails        TEXT[] DEFAULT '{}' NOT NULL,
    bcc_emails       TEXT[] DEFAULT '{}' NOT NULL,
    subject          TEXT,
    body_text        TEXT,
    body_html        TEXT,
    history_id       BIGINT,
    size_estimate    INTEGER,
    labels           TEXT[] DEFAULT '{}' NOT NULL,
    message_id_header    TEXT,
    in_reply_to_header   TEXT,
    references_header    TEXT,
    internal_date        TIMESTAMPTZ NOT NULL,
    storage_key_gmail_raw TEXT
);
```

**Indexes (final state):**
```sql
CREATE INDEX idx_gmail_message_gmail_message_id  ON gmail_message(gmail_message_id);
CREATE INDEX idx_gmail_message_gmail_thread_id   ON gmail_message(gmail_thread_id);
CREATE INDEX idx_gmail_message_user_id           ON gmail_message(user_id);
CREATE INDEX idx_gmail_message_gmail_account_id  ON gmail_message(gmail_account_id);
CREATE INDEX idx_gmail_message_direction         ON gmail_message(direction);
CREATE INDEX idx_gmail_message_internal_date     ON gmail_message(internal_date DESC);
CREATE UNIQUE INDEX idx_gmail_message_unique     ON gmail_message(gmail_account_id, gmail_message_id);
CREATE INDEX IF NOT EXISTS idx_gmail_message_sender_email_trgm
    ON public.gmail_message USING gin (sender_email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_gmail_message_body_text_trgm
    ON gmail_message USING gin (body_text gin_trgm_ops);
```

**Trigger:**
```sql
CREATE TRIGGER trigger_update_latest_gmail_message_per_thread
AFTER INSERT ON gmail_message
FOR EACH ROW EXECUTE FUNCTION update_latest_gmail_message_per_thread();
```

**RLS:** Enabled — `(select auth.uid()) = user_id` for SELECT.

---

## Table: `smtp_message`

**Migration:** `20251127000000_smtp_support.sql`

```sql
CREATE TABLE IF NOT EXISTS smtp_message (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id         UUID REFERENCES auth.users(id) NOT NULL,
    smtp_account_id UUID REFERENCES user_smtp_account(id) NOT NULL,
    message_id_header  TEXT NOT NULL,
    email_thread_id    TEXT NOT NULL,
    in_reply_to_header TEXT,
    references_header  TEXT,
    direction          TEXT NOT NULL,
    sender_email       TEXT NOT NULL,
    recipient_emails   TEXT[] NOT NULL DEFAULT '{}',
    cc_emails          TEXT[] NOT NULL DEFAULT '{}',
    bcc_emails         TEXT[] NOT NULL DEFAULT '{}',
    subject            TEXT,
    body_text          TEXT,
    body_html          TEXT,
    imap_uid           BIGINT,
    internal_date      TIMESTAMPTZ NOT NULL,
    CONSTRAINT idx_smtp_message_unique UNIQUE (smtp_account_id, message_id_header)
);
```

**Indexes:**
```sql
CREATE INDEX IF NOT EXISTS idx_smtp_message_thread        ON smtp_message(email_thread_id);
CREATE INDEX IF NOT EXISTS idx_smtp_message_account       ON smtp_message(smtp_account_id);
CREATE INDEX IF NOT EXISTS idx_smtp_message_direction     ON smtp_message(email_thread_id, direction);
CREATE INDEX IF NOT EXISTS idx_smtp_message_internal_date ON smtp_message(email_thread_id, internal_date);
```

**Trigger:**
```sql
CREATE TRIGGER trigger_update_latest_smtp_message_per_thread
AFTER INSERT ON smtp_message
FOR EACH ROW EXECUTE FUNCTION update_latest_smtp_message_per_thread();
```

**RLS:** NOT enabled — no `ENABLE ROW LEVEL SECURITY` or policies found.

---

## Table: `gmail_thread_state`

**Migration:** `20250903000000_initial.sql`
**Modified by:** Indexes only — `20260217000001`, `20260205100001`

```sql
CREATE TABLE IF NOT EXISTS gmail_thread_state (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id),
  gmail_account_id uuid NOT NULL REFERENCES user_gmail_account(id),
  gmail_thread_id  text NOT NULL,
  status           text NOT NULL,
  latest_internal_date    timestamp with time zone,
  latest_gmail_message_id uuid REFERENCES gmail_message(id),
  created_at              timestamp with time zone DEFAULT now(),
  updated_at              timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, gmail_account_id, gmail_thread_id, latest_internal_date)
);
```

**Indexes (final state):**
```sql
CREATE INDEX IF NOT EXISTS idx_gmail_thread_state_latest_version
    ON gmail_thread_state(gmail_thread_id, latest_internal_date DESC);
CREATE INDEX IF NOT EXISTS idx_gmail_thread_state_user_latest
    ON gmail_thread_state(user_id, gmail_account_id, gmail_thread_id, latest_internal_date DESC);
CREATE INDEX IF NOT EXISTS idx_gmail_thread_state_user_latest_date
    ON gmail_thread_state(user_id, latest_internal_date DESC);
CREATE INDEX IF NOT EXISTS idx_gmail_thread_state_user_thread_latest_covering
    ON gmail_thread_state (user_id, gmail_thread_id, latest_internal_date DESC)
    INCLUDE (id, status, latest_gmail_message_id, gmail_account_id);
```

**RLS:** Enabled — `(select auth.uid()) = user_id` for SELECT.

---

## Table: `smtp_thread_state`

**Migration:** `20251127000000_smtp_support.sql`

```sql
CREATE TABLE IF NOT EXISTS smtp_thread_state (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    smtp_account_id UUID NOT NULL REFERENCES user_smtp_account(id) ON DELETE CASCADE,
    email_thread_id TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'READY_FOR_CAMPAIGN_ASSOCIATION',
    latest_smtp_message_id UUID REFERENCES smtp_message(id) ON DELETE SET NULL,
    latest_internal_date   TIMESTAMPTZ NOT NULL,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_smtp_thread_state_version
        UNIQUE (user_id, smtp_account_id, email_thread_id, latest_internal_date)
);
```

**Indexes:**
```sql
CREATE INDEX IF NOT EXISTS idx_smtp_thread_state_lookup
    ON smtp_thread_state (smtp_account_id, email_thread_id, latest_internal_date DESC);
CREATE INDEX IF NOT EXISTS idx_smtp_thread_state_status
    ON smtp_thread_state (smtp_account_id, status);
```

**RLS:** NOT enabled — no `ENABLE ROW LEVEL SECURITY` or policies found.

---

## Table: `gmail_thread_llm_draft`

**Migration:** `20250903000000_initial.sql`
**Modified by:** `20251127000000_smtp_support.sql` (added smtp columns, dropped/replaced unique constraint)

```sql
-- Current effective DDL:
CREATE TABLE gmail_thread_llm_draft (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         uuid NOT NULL REFERENCES auth.users(id),
    gmail_account_id uuid REFERENCES user_gmail_account(id),     -- nullable since smtp migration
    gmail_thread_id  text NOT NULL,
    gmail_thread_state_id uuid REFERENCES gmail_thread_state(id), -- nullable since smtp migration
    draft_subject   text,
    draft_body_text text,
    draft_body_html text,
    gmail_draft_id  text,
    created_at      timestamp with time zone DEFAULT now(),
    -- Added in smtp migration:
    smtp_account_id      UUID REFERENCES user_smtp_account(id),
    smtp_thread_state_id UUID REFERENCES smtp_thread_state(id)
);
```

**Constraints (final state):**
```sql
-- Replaces original UNIQUE(gmail_thread_id, gmail_thread_state_id):
CREATE UNIQUE INDEX unique_thread_llm_draft_per_state
    ON gmail_thread_llm_draft (
        COALESCE(gmail_account_id, '00000000-0000-0000-0000-000000000000'),
        COALESCE(smtp_account_id, '00000000-0000-0000-0000-000000000000'),
        gmail_thread_id,
        COALESCE(gmail_thread_state_id, '00000000-0000-0000-0000-000000000000'),
        COALESCE(smtp_thread_state_id, '00000000-0000-0000-0000-000000000000')
    );

CONSTRAINT chk_gmail_thread_llm_draft_one_account CHECK (
    (gmail_account_id IS NOT NULL AND smtp_account_id IS NULL) OR
    (gmail_account_id IS NULL AND smtp_account_id IS NOT NULL)
)
CONSTRAINT chk_gmail_thread_llm_draft_one_state CHECK (
    (gmail_thread_state_id IS NOT NULL AND smtp_thread_state_id IS NULL) OR
    (gmail_thread_state_id IS NULL AND smtp_thread_state_id IS NOT NULL)
)
```

**Indexes:**
```sql
CREATE INDEX IF NOT EXISTS idx_gmail_thread_llm_draft_smtp       ON gmail_thread_llm_draft(smtp_account_id);
CREATE INDEX IF NOT EXISTS idx_gmail_thread_llm_draft_smtp_state ON gmail_thread_llm_draft(smtp_thread_state_id);
```

**RLS:** Enabled — `(select auth.uid()) = user_id` for SELECT.

**IG DM impact:** Per decision, a **new separate table** `ig_dm_llm_draft` will be created (not extending this table). The naming debt of `gmail_thread_llm_draft` covering SMTP is acknowledged; IG DM gets clean isolation.

---

## Table: `thread_flag`

**Migration:** `20260211000000_create_thread_flag_table.sql`

```sql
CREATE TABLE thread_flag (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    gmail_thread_id TEXT,
    email_thread_id TEXT,
    wants_paid      BOOLEAN NOT NULL DEFAULT FALSE,
    has_question    BOOLEAN NOT NULL DEFAULT FALSE,
    has_issue       BOOLEAN NOT NULL DEFAULT FALSE,
    wants_paid_reason  TEXT,
    has_question_reason TEXT,
    has_issue_reason    TEXT,
    source_message_id  UUID,
    CONSTRAINT chk_thread_flag_one_thread_id CHECK (
        (gmail_thread_id IS NOT NULL AND email_thread_id IS NULL) OR
        (gmail_thread_id IS NULL AND email_thread_id IS NOT NULL)
    ),
    CONSTRAINT uq_thread_flag_gmail UNIQUE (gmail_thread_id),
    CONSTRAINT uq_thread_flag_email UNIQUE (email_thread_id)
);
```

**Indexes:**
```sql
CREATE INDEX idx_thread_flag_gmail ON thread_flag(gmail_thread_id);
CREATE INDEX idx_thread_flag_email ON thread_flag(email_thread_id);
```

**RLS:** NOT enabled.

**IG DM impact:** Must add `ig_dm_thread_id TEXT` and expand CHECK to 3-way.

---

## Table: `latest_gmail_message_per_thread`

**Migration:** `20250903000000_initial.sql`
**Modified by:** `20260205100001` (added covering index)

```sql
CREATE TABLE latest_gmail_message_per_thread (
    gmail_thread_id  TEXT PRIMARY KEY,
    gmail_message_id UUID NOT NULL REFERENCES gmail_message(id) ON DELETE CASCADE,
    internal_date    TIMESTAMPTZ NOT NULL,
    direction        TEXT NOT NULL
);
```

**Trigger function:**
```sql
CREATE OR REPLACE FUNCTION update_latest_gmail_message_per_thread() RETURNS trigger AS $$
BEGIN
    INSERT INTO latest_gmail_message_per_thread
        (gmail_thread_id, gmail_message_id, internal_date, direction)
    VALUES (NEW.gmail_thread_id, NEW.id, NEW.internal_date, NEW.direction)
    ON CONFLICT (gmail_thread_id)
    DO UPDATE SET
        gmail_message_id = EXCLUDED.gmail_message_id,
        internal_date    = EXCLUDED.internal_date,
        direction        = EXCLUDED.direction
    WHERE EXCLUDED.internal_date > latest_gmail_message_per_thread.internal_date;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger:**
```sql
CREATE TRIGGER trigger_update_latest_gmail_message_per_thread
AFTER INSERT ON gmail_message
FOR EACH ROW EXECUTE FUNCTION update_latest_gmail_message_per_thread();
```

**Additional index:**
```sql
CREATE INDEX IF NOT EXISTS idx_latest_message_per_thread_message_id
    ON latest_gmail_message_per_thread (gmail_message_id);
```

**RLS:** Enabled — SELECT via subquery join to `gmail_message.user_id`.

---

## Table: `latest_smtp_message_per_thread`

**Migration:** `20251127000000_smtp_support.sql`

```sql
CREATE TABLE IF NOT EXISTS latest_smtp_message_per_thread (
    smtp_account_id  UUID NOT NULL REFERENCES user_smtp_account(id) ON DELETE CASCADE,
    email_thread_id  TEXT NOT NULL,
    smtp_message_id  UUID NOT NULL REFERENCES smtp_message(id) ON DELETE CASCADE,
    internal_date    TIMESTAMPTZ NOT NULL,
    direction        TEXT NOT NULL,
    PRIMARY KEY (smtp_account_id, email_thread_id)
);
```

**Trigger function:**
```sql
CREATE OR REPLACE FUNCTION update_latest_smtp_message_per_thread() RETURNS trigger AS $$
BEGIN
    INSERT INTO latest_smtp_message_per_thread
        (smtp_account_id, email_thread_id, smtp_message_id, internal_date, direction)
    VALUES (NEW.smtp_account_id, NEW.email_thread_id, NEW.id, NEW.internal_date, NEW.direction)
    ON CONFLICT (smtp_account_id, email_thread_id)
    DO UPDATE SET
        smtp_message_id = EXCLUDED.smtp_message_id,
        internal_date   = EXCLUDED.internal_date,
        direction       = EXCLUDED.direction
    WHERE EXCLUDED.internal_date > latest_smtp_message_per_thread.internal_date;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger:**
```sql
CREATE TRIGGER trigger_update_latest_smtp_message_per_thread
AFTER INSERT ON smtp_message
FOR EACH ROW EXECUTE FUNCTION update_latest_smtp_message_per_thread();
```

**RLS:** NOT enabled.

---

## Table: `email_reply_example`

**Migration:** `20251210000000_create_email_reply_example_vector.sql`
**Modified by:** `20251212000000_email_reply_example_campaign_id_fk.sql`, `20251221000000_add_sanitized_reply_columns.sql`

```sql
-- Current effective DDL:
CREATE TABLE email_reply_example (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id       TEXT NOT NULL,
    campaign_id     UUID NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,  -- replaced campaign_name TEXT
    thread_summary  TEXT NOT NULL,
    inbound_email_text TEXT NOT NULL,
    embedding       vector(1536),
    sent_reply_text TEXT NOT NULL,
    sanitized_reply_text TEXT,   -- added 20251221
    reply_summary   TEXT,         -- added 20251221
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Indexes:**
```sql
CREATE UNIQUE INDEX idx_email_reply_example_unique_pair
    ON email_reply_example (campaign_id, thread_id, md5(inbound_email_text), md5(sent_reply_text));
CREATE INDEX idx_email_reply_example_embedding
    ON email_reply_example USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_email_reply_example_campaign ON email_reply_example(campaign_id);
CREATE INDEX idx_email_reply_example_thread   ON email_reply_example(thread_id);
```

**RLS:** Enabled — campaign owner SELECT/INSERT/DELETE (no UPDATE policy).

---

## Summary: Mutual-Exclusivity CHECK Constraints (Current)

| Table | Constraint | Pattern |
|-------|-----------|---------|
| `campaign_thread` | `chk_campaign_thread_one_thread_id` | `(gmail_thread_id IS NOT NULL AND email_thread_id IS NULL) OR (gmail_thread_id IS NULL AND email_thread_id IS NOT NULL)` |
| `campaign_sender` | `chk_campaign_sender_account_type` | `(gmail_account_id IS NOT NULL AND smtp_account_id IS NULL) OR (gmail_account_id IS NULL AND smtp_account_id IS NOT NULL)` |
| `gmail_thread_llm_draft` | `chk_gmail_thread_llm_draft_one_account` | `(gmail_account_id IS NOT NULL AND smtp_account_id IS NULL) OR (gmail_account_id IS NULL AND smtp_account_id IS NOT NULL)` |
| `gmail_thread_llm_draft` | `chk_gmail_thread_llm_draft_one_state` | `(gmail_thread_state_id IS NOT NULL AND smtp_thread_state_id IS NULL) OR (gmail_thread_state_id IS NULL AND smtp_thread_state_id IS NOT NULL)` |
| `thread_flag` | `chk_thread_flag_one_thread_id` | `(gmail_thread_id IS NOT NULL AND email_thread_id IS NULL) OR (gmail_thread_id IS NULL AND email_thread_id IS NOT NULL)` |

**Pattern for IG DM expansion (3-way):**
```sql
-- Example: campaign_thread after adding ig_dm_thread_id
CONSTRAINT chk_campaign_thread_one_thread_id CHECK (
    (gmail_thread_id IS NOT NULL AND email_thread_id IS NULL AND ig_dm_thread_id IS NULL) OR
    (gmail_thread_id IS NULL AND email_thread_id IS NOT NULL AND ig_dm_thread_id IS NULL) OR
    (gmail_thread_id IS NULL AND email_thread_id IS NULL AND ig_dm_thread_id IS NOT NULL)
)
```

---

## Summary: RLS Status

| Table | RLS Enabled | Notes |
|-------|-------------|-------|
| `user_gmail_account` | YES | Owner SELECT only |
| `user_smtp_account` | YES | Owner CRUD |
| `campaign_thread` | YES | can_access_campaign for SELECT, owner-only writes |
| `campaign_sender` | YES | can_access_campaign for SELECT, owner-only writes |
| `campaign_creator` | NO | `-- TODO: rls policies` comment; never implemented |
| `gmail_message` | YES | Owner SELECT only |
| `smtp_message` | NO | — |
| `gmail_thread_state` | YES | Owner SELECT only |
| `smtp_thread_state` | NO | — |
| `gmail_thread_llm_draft` | YES | Owner SELECT only |
| `thread_flag` | NO | — |
| `latest_gmail_message_per_thread` | YES | Via gmail_message.user_id subquery |
| `latest_smtp_message_per_thread` | NO | — |
| `email_reply_example` | YES | Via campaign.user_id |
