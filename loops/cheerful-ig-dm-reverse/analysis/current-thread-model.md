# Current Thread Model Analysis
**Aspect**: `current-thread-model`
**Wave**: 2 — Internal Landscape
**Date**: 2026-02-28

---

## 1. Thread Identity Model

Cheerful uses a **dual-path thread identity system** — one per email provider. Thread IDs are channel-native and opaque strings:

| Path | Thread ID Source | Column Name | Uniqueness Scope |
|------|-----------------|-------------|-----------------|
| Gmail | Assigned by Google API | `gmail_thread_id` | Global (unique per Gmail account) |
| SMTP | First message's RFC 2822 `Message-ID` header | `email_thread_id` | Per SMTP account + thread |

**Key migration evidence** — `20251030_make_gmail_thread_unique_per_campaign.sql`:
> Each thread can only belong to one campaign. A `gmail_thread_id` has a UNIQUE constraint on `campaign_thread`.

**Key migration evidence** — `20251127000000_smtp_support.sql` (section 6):
```sql
ALTER TABLE campaign_thread
    ADD COLUMN IF NOT EXISTS email_thread_id TEXT;
ALTER TABLE campaign_thread
    ADD CONSTRAINT chk_campaign_thread_one_thread_id
    CHECK (
        (gmail_thread_id IS NOT NULL AND email_thread_id IS NULL) OR
        (gmail_thread_id IS NULL AND email_thread_id IS NOT NULL)
    );
```

The `campaign_thread` table is the **canonical join** between a thread and a campaign. It uses a check constraint to enforce exactly one thread-id type per row.

---

## 2. Thread State Machine

Thread state is managed through `GmailThreadStatus` (file: `apps/backend/src/models/database/gmail_thread_state.py:13`), a `StrEnum` shared by both Gmail and SMTP paths:

```python
class GmailThreadStatus(StrEnum):
    # Processing steps
    READY_FOR_ATTACHMENT_EXTRACTION = "READY_FOR_ATTACHMENT_EXTRACTION"
    READY_FOR_CAMPAIGN_ASSOCIATION = "READY_FOR_CAMPAIGN_ASSOCIATION"
    READY_FOR_RESPONSE_DRAFT = "READY_FOR_RESPONSE_DRAFT"
    WAITING_FOR_DRAFT_REVIEW = "WAITING_FOR_DRAFT_REVIEW"
    WAITING_FOR_INBOUND = "WAITING_FOR_INBOUND"
    # Terminal States
    IGNORE = "IGNORE"
    DONE = "DONE"
    NOT_LATEST = "NOT_LATEST"
```

**State transitions** (from `thread_processing_coordinator_workflow.py`):
```
INBOUND MESSAGE ARRIVES
        ↓
READY_FOR_ATTACHMENT_EXTRACTION  (Gmail only — SMTP skips this)
        ↓
READY_FOR_CAMPAIGN_ASSOCIATION
        ↓
   [campaign association + opt-in classification]
        ↓
┌── NOT a campaign reply → IGNORE
├── Campaign reply, thread complete → DONE
├── Campaign reply, inbound → READY_FOR_RESPONSE_DRAFT
│        ↓
│   [AI draft generated]
│        ↓
│   WAITING_FOR_DRAFT_REVIEW
│        ↓  [user reviews/sends]
│   WAITING_FOR_INBOUND  (await creator reply)
│        ↓  [new message triggers new state row]
│   → READY_FOR_RESPONSE_DRAFT  (cycle repeats)
└── (previous state becomes NOT_LATEST)
```

**Event-sourced append-only storage**: Each state transition creates a new row. Current state = `MAX(latest_internal_date)` per `(user_id, account_id, thread_id)`. Superseded states get `NOT_LATEST` via the workflow (not a DB trigger — the workflow writes the new row, then marks old as `NOT_LATEST`).

**Separate state tables per channel** (both use the same `GmailThreadStatus` enum):
- `gmail_thread_state` — keyed by `(user_id, gmail_account_id, gmail_thread_id, latest_internal_date)`
- `smtp_thread_state` — keyed by `(user_id, smtp_account_id, email_thread_id, latest_internal_date)`

**Denormalized latest-message tracking** (trigger-maintained):
- `latest_gmail_message_per_thread` — PRIMARY KEY on `gmail_thread_id`
- `latest_smtp_message_per_thread` — PRIMARY KEY on `(smtp_account_id, email_thread_id)`

---

## 3. How Threads Link to Campaigns

```
campaign (1)
    └── campaign_thread (N) ←— one thread per row
            ├── gmail_thread_id TEXT (nullable, mutually exclusive)
            └── email_thread_id TEXT (nullable, mutually exclusive)

campaign_thread → identifies the thread
thread_id → used to look up gmail_thread_state or smtp_thread_state
```

The `campaign_sender` table determines which account is active for a campaign:
```sql
CHECK (
    (gmail_account_id IS NOT NULL AND smtp_account_id IS NULL) OR
    (gmail_account_id IS NULL AND smtp_account_id IS NOT NULL)
)
```

---

## 4. How Threads Link to Creators

Two separate creator identity systems exist:

### 4a. `campaign_creator` (campaign-scoped)
`apps/backend/src/...migrations/20251113113540_add_campaign_creator_table.sql`:
```sql
CREATE TABLE campaign_creator (
    campaign_id UUID NOT NULL REFERENCES campaign(id),
    email TEXT,                              -- primary identity key for email matching
    name TEXT,
    social_media_handles JSONB DEFAULT '[]', -- e.g. [{"platform": "instagram", "handle": "creator123"}]
    gifting_status TEXT,
    latest_interaction_at TIMESTAMPTZ,       -- tracks last email interaction
    latest_interaction_campaign_id UUID      -- which campaign had the last interaction
);
```

Creator-to-thread matching for email works by matching `sender_email` (from inbound message) against `campaign_creator.email`. The `social_media_handles` JSONB field stores Instagram handles but **is not currently used for thread matching**.

### 4b. `creator` (global, platform-agnostic)
`20260123000000_create_creator_table.sql`:
```sql
CREATE TABLE creator (
    platform TEXT NOT NULL,
    handle TEXT NOT NULL,
    email TEXT,              -- optional link to email identity
    profile_data JSONB,      -- platform-specific enrichment
    UNIQUE (platform, handle)
);
```

This global `creator` table is newer and used for discovery/enrichment. It has a `platform` field that already supports `'instagram'`. The `email` field provides a bridge back to email identity.

**Creator-to-DM-sender resolution gap**: There is currently no mechanism to match an Instagram DM sender (`instagram_scoped_user_id` or handle) to a `campaign_creator` row. The existing matching is email-address-only.

---

## 5. What Is Email-Specific vs Channel-Agnostic

### Email-specific (would need new parallel implementations for DMs)

| Component | Location | Why Email-Specific |
|-----------|----------|-------------------|
| `gmail_thread_id` / `email_thread_id` column names | `campaign_thread`, `thread_flag` | Named for email channels; DMs would need `ig_dm_thread_id` |
| `gmail_thread_state` table | migrations/initial | Gmail-specific account FK, Gmail thread ID |
| `smtp_thread_state` table | migrations/smtp_support | SMTP-specific account FK, email thread ID |
| `gmail_message` / `smtp_message` tables | migrations | Contain `subject`, `cc_emails`, `bcc_emails`, `body_html`, email headers |
| `latest_gmail_message_per_thread` trigger | migrations/initial | Gmail-specific |
| `latest_smtp_message_per_thread` trigger | migrations/smtp_support | SMTP-specific |
| `gmail_thread_llm_draft` table | migrations/initial + smtp_support | Gmail-named; has `draft_subject`, `gmail_draft_id`; extended for SMTP but still Gmail-named |
| `gmail_thread_ui_draft` table | migrations/initial | Gmail-named, email-specific |
| `QUOTE_HEADER_PATTERNS` | `services/email/loader.py:32` | Email-only (quote stripping) |
| Thread XML format fields | `services/email/loader.py:138-159` | `<from>`, `<to>`, `<cc>`, `<bcc>`, `<subject>` are email-specific |
| `EmailThreadMessageView.sender_email` | `models/dto/domain/email_thread.py:14` | Named `sender_email`, not `sender_handle` |
| `EmailThreadView.gmail_thread_id` | `models/dto/domain/email_thread.py:27` | Field reused for SMTP (comment: "Reusing field") but named Gmail |
| `thread_flag.gmail_thread_id` / `email_thread_id` | migrations/thread_flag | Channel-specific columns |
| Campaign association lookup | workflow coordinator | Queries `gmail_message`/`smtp_message` tables by sender_email |
| `READY_FOR_ATTACHMENT_EXTRACTION` status | `gmail_thread_state.py:15` | Gmail-only — SMTP threads skip this step |

### Channel-agnostic (can be reused or extended for DMs)

| Component | Location | How It's Abstract |
|-----------|----------|-----------------|
| `GmailThreadStatus` enum | `models/database/gmail_thread_state.py:13` | Already shared between Gmail and SMTP paths |
| `campaign_thread` linking pattern | migrations/initial + smtp_support | Check-constraint pattern is extendable |
| `campaign` table | migrations/initial | No channel-specific columns |
| `campaign_creator` + `social_media_handles` JSONB | migrations/campaign_creator | IG handle already storable |
| `creator` table (`platform` field) | migrations/create_creator_table | Already platform-agnostic design |
| `thread_flag` structure | migrations/thread_flag | Pattern is extendable |
| Temporal workflow state machine | `temporal/workflow/thread_processing_coordinator_workflow.py` | Logic is channel-agnostic conceptually |
| AI draft content | `gmail_thread_llm_draft.draft_body_text` | Text content reusable; `draft_subject` not needed for DMs |
| `campaign` AI configuration columns | `campaign` table | `rules_for_llm`, `goal_for_llm` etc. are channel-agnostic |
| `email_reply_example` RAG table | migrations | Could theoretically store DM examples too |

---

## 6. Abstraction Opportunities

### 6a. Pattern: The "Third Parallel Path"
Gmail added tables, then SMTP mirrored them (`ig_dm_*` would follow same pattern):
```
user_gmail_account   →  user_smtp_account  →  user_ig_dm_account
gmail_message        →  smtp_message       →  ig_dm_message
gmail_thread_state   →  smtp_thread_state  →  ig_dm_thread_state
latest_gmail_...     →  latest_smtp_...    →  latest_ig_dm_...
```

**Pros**: Minimal disruption to existing code. Each channel stays isolated.

**Cons**: `campaign_thread` already has Gmail and SMTP columns; adding a third (`ig_dm_thread_id`) means the check constraint expands to 3-way mutual exclusivity. `gmail_thread_llm_draft` already had SMTP columns added via migration. This table is growing into a kitchen-sink cross-channel draft store.

### 6b. Pattern: Abstract `channel_thread` Table
Replace channel-specific thread ID columns with a `channel_type` + `channel_thread_id` pair:
```sql
CREATE TABLE thread (
    id UUID PRIMARY KEY,
    channel_type TEXT NOT NULL,  -- 'gmail', 'smtp', 'ig_dm'
    channel_thread_id TEXT NOT NULL,
    account_id UUID NOT NULL,    -- polymorphic FK (no referential integrity)
    ...
);
```

**Pros**: Extensible — new channels without schema changes.

**Cons**: Loses FK referential integrity. More complex queries. Requires migrating existing data.

### 6c. Minimal Change: `campaign_thread` Extension
Add `ig_dm_thread_id` column to `campaign_thread` with a 3-way check constraint. Extend `thread_flag` similarly. All other IG-specific tables are additive.

**Pros**: Surgical change. Easy migration.

**Cons**: Check constraint becomes `(A IS NOT NULL AND B IS NULL AND C IS NULL) OR ...` — 3 cases.

---

## 7. Key Structural Observations for IG DM Integration

1. **`gmail_thread_llm_draft` is already cross-channel**: The table name is misleading — SMTP draft support was retrofitted via migration. Adding DM draft support would continue this pattern (add `ig_dm_account_id` + `ig_dm_thread_state_id` columns) or require a rename/new table.

2. **Thread ID semantics differ**: Gmail threads are server-assigned; SMTP threads are derived from email headers (first Message-ID); IG DM threads have a `conversation_id` assigned by Meta. All are opaque strings — the abstraction layer can treat them the same way.

3. **`GmailThreadStatus` is already generalized**: SMTP threads use the Gmail status enum. Adding DMs to this enum requires no changes — the states (`READY_FOR_CAMPAIGN_ASSOCIATION`, `WAITING_FOR_INBOUND`, etc.) are conceptually valid for DM conversations.

4. **Creator matching is the biggest gap**: Email threads are matched to creators by email address. DM threads would need matching by Instagram handle/IGSID. The `campaign_creator.social_media_handles` JSONB and global `creator.handle` fields store this data but no matching logic exists.

5. **24-hour DM window changes state machine semantics**: The Instagram 24-hour messaging window means that once a creator goes 24h without messaging, outbound DMs are restricted. The `WAITING_FOR_INBOUND` state would need to track window expiry. This is a DM-specific constraint with no email equivalent.

6. **No concept of "account" for DMs yet**: `user_gmail_account` and `user_smtp_account` are the account containers. A `user_ig_dm_account` (or equivalent) would need to store the Meta access token, Instagram Professional Account ID, and webhook subscription state.

7. **`EmailLoaderService` would need a `get_complete_thread_ig_dm()` method**: Following the existing pattern (`get_complete_thread` for Gmail, `get_complete_thread_smtp` for SMTP). However, DM threads have fundamentally different structure (no subject, no CC/BCC, possibly media messages) — the `EmailThreadView` DTO would need extension or a new `DmThreadView` DTO.

---

## 8. Summary: Abstraction Map for DM Integration

```
THREAD LAYER ABSTRACTION OPPORTUNITIES

Already abstract (shared between Gmail+SMTP, safe to extend):
  ✓ GmailThreadStatus enum
  ✓ campaign (table)
  ✓ creator (table, platform-agnostic)
  ✓ campaign_creator.social_media_handles JSONB
  ✓ Temporal workflow state machine (conceptually)

Would need a new parallel implementation:
  ➕ user_ig_dm_account (new account container)
  ➕ ig_dm_message (new message store)
  ➕ ig_dm_thread_state (new state table, references GmailThreadStatus)
  ➕ latest_ig_dm_message_per_thread (new trigger table)
  ➕ ig_dm_llm_draft (new draft table, OR extend gmail_thread_llm_draft)

Would need extension:
  ≈ campaign_thread (add ig_dm_thread_id column, extend check constraint)
  ≈ campaign_sender (add ig_dm_account_id column, extend check constraint)
  ≈ thread_flag (add ig_dm_thread_id column, extend check constraint)
  ≈ EmailLoaderService (add get_complete_thread_ig_dm method)
  ≈ EmailThreadMessageView DTO (add sender_handle, media_urls fields)

Would need new logic:
  ★ Creator matching: IG sender handle/IGSID → campaign_creator
  ★ 24-hour window tracking in thread state
  ★ IG DM webhook handler (replaces Gmail push/IMAP polling)
  ★ IG DM send API call (replaces Gmail send / SMTP send)
```
