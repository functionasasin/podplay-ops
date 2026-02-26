# Spec: Data Model
**Synthesizes**: `supabase-schema` + `data-flow-map` + `auth-permissions`
**Wave**: 3 — Synthesis
**Date**: 2026-02-26

---

## 1. Architecture Overview

Cheerful uses **Supabase (PostgreSQL 15)** as its sole database. Key architectural choices:

- **Event-sourced thread state**: `gmail_thread_state` / `smtp_thread_state` are append-only — each state transition creates a new row. Current state = latest row by `latest_internal_date` DESC.
- **Dual-path email**: Gmail (OAuth) and SMTP (IMAP/SMTP credentials) are supported. Tables for each mirror each other in structure. Check constraints enforce exactly one path per row.
- **Two-tier storage**: Email body text is stored in PostgreSQL (capped: body_text ≤ 64 KB, body_html ≤ 256 KB) while raw MIME bytes go to Supabase Storage. This prevents DB bloat from large attachments.
- **pgvector RAG**: `email_reply_example` stores 1536-dim OpenAI embeddings with an HNSW index for cosine similarity search used in draft generation.
- **Service-role backend**: All Python API writes use the `service_role` key (bypassing RLS). RLS protects direct frontend-to-Supabase reads only.
- **Trigger-maintained denormalization**: `latest_gmail_message_per_thread` and `latest_smtp_message_per_thread` are maintained by PostgreSQL triggers, never written directly.

---

## 2. Complete ER Diagram

```
auth.users (Supabase built-in)
  │
  ├── user_setting (1:1)           -- placeholder user settings
  ├── user_onboarding (1:1)        -- onboarding survey + completion flag
  │
  ├── user_gmail_account (1:N)
  │     ├── gmail_message (1:N)
  │     │     ├── email_attachment (1:N)
  │     │     │     └── email_attachment_llm_extracted_content (1:1)
  │     │     └── latest_gmail_message_per_thread [trigger] (N:1 per thread)
  │     ├── gmail_thread_state (1:N)    [append-only event log]
  │     │     ├── gmail_thread_llm_draft (0:N)
  │     │     ├── gmail_thread_ui_draft (0:1)
  │     │     └── gmail_thread_state_follow_up_schedule (0:1)
  │     └── gmail_thread_user_preferences (1:N)
  │
  ├── user_smtp_account (1:N)
  │     ├── smtp_message (1:N)
  │     │     └── latest_smtp_message_per_thread [trigger] (N:1 per thread)
  │     └── smtp_thread_state (1:N)    [append-only event log]
  │
  ├── product (1:N)
  │     └── campaign_product [junction] (N:M with campaign)
  │
  ├── campaign (1:N)
  │     ├── campaign_sender (1:N)         → user_gmail_account OR user_smtp_account
  │     ├── campaign_recipient (1:N)       -- target creator emails
  │     ├── campaign_thread (1:N)          -- links threads to this campaign
  │     ├── campaign_outbox_queue (1:N)
  │     │     └── campaign_follow_up_outbox_queue (1:N)
  │     ├── campaign_workflow (1:N)
  │     │     └── campaign_workflow_execution (1:N)
  │     ├── campaign_creator (1:N)
  │     │     ├── campaign_lookalike_suggestion (1:N)
  │     │     └── creator_post (1:N)
  │     ├── campaign_rule_suggestion_analytics (1:N)
  │     ├── campaign_csv (1:N)
  │     ├── email_reply_example (1:N)     -- RAG training pairs
  │     ├── email_signature (0:1)         -- campaign-specific signature
  │     ├── campaign_member_assignment (N:M) → auth.users
  │     └── campaign_product [junction] (N:M) → product
  │
  ├── team (1:N)
  │     └── team_member (1:N) → auth.users
  │
  ├── creator_list (1:N)
  │     └── creator_list_item (N:M) → creator
  │
  ├── email_signature (1:N)   -- user-level signatures (campaign_id IS NULL)
  ├── email_dispatch_queue (1:N)   -- generic scheduled email delivery
  └── debug_upload (1:N)

creator (global, not user-scoped)
  ├── creator_enrichment_attempt (1:N)   -- email discovery audit log
  └── creator_list_item (N:M) → creator_list

thread_flag (keyed on gmail_thread_id OR email_thread_id; no FK to auth.users)

-- Discord subsystem (separate identity namespace, no FK to auth.users) --
discord_workflow (1:N)
  ├── discord_workflow_scope (1:N)       -- server/channel targeting
  └── discord_workflow_execution (1:N)  -- append-only run log
discord_thread_sessions (1:1 per Discord thread)
discord_channel_mapping (standalone)

-- Infrastructure/meta tables --
session_templates   -- Fly.io session templates triggered from Discord
n8n_workflows       -- n8n webhook tools registered as Claude tools
thread_tool_contexts -- persists tool selections per Discord thread
clarify_meetings    -- meeting transcripts from Clarify webhook
```

---

## 3. Domain Groups

The schema is organized into six functional domains:

| Domain | Tables | Purpose |
|--------|--------|---------|
| **Identity** | `user_setting`, `user_onboarding` | User profile, onboarding gate |
| **Email Accounts** | `user_gmail_account`, `user_smtp_account` | Email sending/receiving credentials |
| **Email Messages** | `gmail_message`, `smtp_message`, `latest_*_per_thread`, `email_attachment`, `email_attachment_llm_extracted_content`, `thread_flag` | Immutable email event log |
| **Thread State** | `gmail_thread_state`, `smtp_thread_state`, `gmail_thread_llm_draft`, `gmail_thread_ui_draft`, `gmail_thread_ui_draft`, `gmail_thread_state_follow_up_schedule`, `gmail_thread_user_preferences` | Email workflow orchestration state |
| **Campaigns** | `campaign`, `campaign_sender`, `campaign_recipient`, `campaign_creator`, `campaign_thread`, `campaign_outbox_queue`, `campaign_follow_up_outbox_queue`, `campaign_workflow`, `campaign_workflow_execution`, `campaign_rule_suggestion_analytics`, `campaign_csv`, `campaign_member_assignment`, `campaign_product`, `campaign_lookalike_suggestion`, `creator_post`, `email_reply_example`, `email_signature`, `email_dispatch_queue` | Campaign lifecycle + creator engagement |
| **Creators** | `creator`, `creator_enrichment_attempt`, `creator_list`, `creator_list_item` | Global creator database |
| **Teams** | `team`, `team_member`, `campaign_member_assignment` | Multi-user collaboration |
| **Product** | `product`, `campaign_product` | Brand product catalog |
| **Discord/Meta** | `discord_workflow`, `discord_workflow_scope`, `discord_workflow_execution`, `discord_thread_sessions`, `discord_channel_mapping`, `session_templates`, `n8n_workflows`, `thread_tool_contexts`, `clarify_meetings`, `debug_upload` | Internal tooling, not customer-facing |

---

## 4. Table-by-Table Specification

### 4.1 Identity Tables

#### `user_setting`
**Purpose**: Marker row created at first login. No configuration columns yet — serves as an existence check.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `user_id` | uuid | PK, FK → auth.users(id) | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS**: Owner SELECT only.

---

#### `user_onboarding`
**Purpose**: Captures onboarding survey responses and tracks completion. The `onboarding_completed` flag gates access to the app — middleware redirects incomplete users to `/onboarding`.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `user_id` | uuid | PK, FK → auth.users(id) ON DELETE CASCADE | |
| `user_role` | text | nullable | `brand-agency`, `creator-agency`, `creator`, `sales`, `other` |
| `referral_source` | text | nullable | `google`, `social-media`, `friend`, `linkedin`, `other` |
| `referral_other_text` | text | nullable | Free-text when `referral_source='other'` |
| `onboarding_completed` | boolean | NOT NULL DEFAULT false | App access gate |
| `completed_at` | timestamptz | nullable | |
| `setup_checklist_completed` | boolean | DEFAULT false | Secondary checklist after onboarding |
| `setup_checklist_completed_at` | timestamptz | nullable | |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | |

**Business rule**: `onboarding_completed` is cached in a 1-year httpOnly cookie after completion to avoid DB round-trips on every page load.

---

### 4.2 Email Account Tables

#### `user_gmail_account`
**Purpose**: Gmail OAuth connection per user. The `refresh_token` is used by the backend to call the Gmail API. `last_poll_history_id` is the incremental sync watermark for the Gmail History API.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK DEFAULT gen_random_uuid() | |
| `user_id` | uuid | NOT NULL, FK → auth.users(id) | |
| `gmail_email` | text | NOT NULL, UNIQUE | Unique globally (not per user) |
| `refresh_token` | text | NOT NULL | Encrypted OAuth token |
| `last_poll_history_id` | bigint | nullable | Gmail History API watermark |
| `sync_in_progress` | boolean | DEFAULT false | Mutex to prevent concurrent sync |
| `is_active` | boolean | DEFAULT true | Soft disable |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**Indexes**: `idx_user_gmail_account_user_id` on `(user_id)`
**RLS**: Owner SELECT only. Team members have **zero direct access** — credential rows fetched via service_role at API layer after access check.

---

#### `user_smtp_account`
**Purpose**: SMTP/IMAP credentials for non-Gmail email accounts. Passwords stored encrypted. Sync uses IMAP UID watermarks (`last_sync_uid`, `last_sync_uidvalidity`). `uidvalidity` detects IMAP mailbox rebuilds.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | |
| `email_address` | text | NOT NULL | |
| `display_name` | text | nullable | |
| `smtp_host` | text | NOT NULL | |
| `smtp_port` | integer | NOT NULL DEFAULT 587 | |
| `smtp_username` | text | NOT NULL | |
| `smtp_password` | text | NOT NULL | Encrypted |
| `smtp_use_tls` | boolean | NOT NULL DEFAULT true | |
| `imap_host` | text | NOT NULL | |
| `imap_port` | integer | NOT NULL DEFAULT 993 | |
| `imap_username` | text | NOT NULL | |
| `imap_password` | text | NOT NULL | Encrypted |
| `imap_use_ssl` | boolean | NOT NULL DEFAULT true | |
| `sync_in_progress` | boolean | NOT NULL DEFAULT false | Mutex |
| `last_sync_uid` | bigint | nullable | IMAP UID watermark |
| `last_sync_uidvalidity` | bigint | nullable | Detects mailbox rebuild |
| `last_sync_timestamp` | timestamptz | nullable | |
| `is_active` | boolean | NOT NULL DEFAULT true | |
| `last_verified_at` | timestamptz | nullable | |
| `verification_error` | text | nullable | |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | |

**Unique**: `(user_id, email_address)`
**Indexes**: `idx_user_smtp_account_user_id`, `idx_user_smtp_account_email`, `idx_user_smtp_account_active` (partial)
**RLS**: Same as Gmail — owner SELECT only; team members have zero access.

---

### 4.3 Email Message Tables

#### `gmail_message`
**Purpose**: Immutable event-sourced log of all Gmail messages. Both inbound and outbound messages land here — `direction` discriminates. Never modified after insert.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | |
| `user_id` | uuid | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | |
| `gmail_account_id` | uuid | NOT NULL, FK → user_gmail_account(id) ON DELETE CASCADE | |
| `gmail_message_id` | text | NOT NULL | Gmail's native message ID |
| `gmail_thread_id` | text | NOT NULL | Gmail's thread grouping ID |
| `direction` | text | NOT NULL CHECK IN ('inbound','outbound') | |
| `sender_email` | text | NOT NULL | |
| `recipient_emails` | text[] | NOT NULL DEFAULT '{}' | |
| `cc_emails` | text[] | NOT NULL DEFAULT '{}' | |
| `bcc_emails` | text[] | NOT NULL DEFAULT '{}' | |
| `subject` | text | nullable | |
| `body_text` | text | nullable | Capped at 64 KB |
| `body_html` | text | nullable | Capped at 256 KB |
| `history_id` | bigint | nullable | Gmail's history ID at ingestion |
| `size_estimate` | integer | nullable | Gmail's reported size |
| `labels` | text[] | NOT NULL DEFAULT '{}' | Gmail label array |
| `message_id_header` | text | nullable | RFC 2822 Message-ID header |
| `in_reply_to_header` | text | nullable | RFC 2822 In-Reply-To |
| `references_header` | text | nullable | RFC 2822 References |
| `internal_date` | timestamptz | NOT NULL | Gmail's authoritative timestamp |
| `storage_key_gmail_raw` | text | nullable | Supabase Storage key for full raw MIME |

**Unique**: `(gmail_account_id, gmail_message_id)` — idempotent insert guard
**Indexes** (performance-critical, 12 total):
- Composite: `(gmail_thread_id, direction)`, `(gmail_thread_id, internal_date DESC)`, `(gmail_account_id, internal_date DESC)`, `(user_id, gmail_account_id, gmail_thread_id, latest_internal_date DESC)` (covering)
- GIN trigram: `sender_email`, `body_text` — enables ILIKE search
- Sort: `(internal_date DESC)`, `(user_id, latest_internal_date DESC)`

**Insert trigger**: `trigger_update_latest_gmail_message_per_thread` — AFTER INSERT, UPSERTS `latest_gmail_message_per_thread`.

**Storage note**: Full MIME stored separately at `raw-emails/{user_id}/{gmail_message_id}` in Supabase Storage. This allows the DB row to be compact while preserving full fidelity for re-processing.

---

#### `latest_gmail_message_per_thread`
**Purpose**: Denormalized high-watermark table: latest message per Gmail thread ID. Maintained exclusively by the `trigger_update_latest_gmail_message_per_thread` trigger. Never written directly.

**Why it exists**: Efficient inbox rendering — the thread list query needs the latest message timestamp and direction without scanning all messages. This avoids an expensive MAX() aggregation per thread.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `gmail_thread_id` | text | PK | |
| `gmail_message_id` | uuid | NOT NULL, FK → gmail_message(id) ON DELETE CASCADE | |
| `internal_date` | timestamptz | NOT NULL | |
| `direction` | text | NOT NULL | |

---

#### `email_attachment`
**Purpose**: Attachment metadata from Gmail messages. Actual bytes are stored in Supabase Storage; this table stores only metadata and the storage key.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `gmail_message_id` | uuid | nullable, FK → gmail_message(id) ON DELETE CASCADE | |
| `part_id` | text | NOT NULL | MIME part identifier |
| `filename` | text | nullable | |
| `mime_type` | text | NOT NULL | |
| `size` | integer | NOT NULL | Bytes |
| `gmail_attachment_id` | text | nullable | Gmail's attachment ID for lazy fetch |
| `storage_key` | text | NOT NULL | Supabase Storage path |
| `sha256` | text | nullable | Deduplication hash |
| `mime_part_index` | integer | nullable | |
| `created_at` | timestamptz | DEFAULT now() | |

**Lazy fetch strategy**: Attachments are not fetched on message ingestion. `ThreadAttachmentExtractWorkflow` fetches bytes only when campaign association exists.

---

#### `email_attachment_llm_extracted_content`
**Purpose**: LLM-extracted text/structured content from attachments (PDFs, images). One-to-one with `email_attachment`.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `email_attachment_id` | uuid | nullable, FK → email_attachment(id) ON DELETE CASCADE | |
| `extracted_content` | jsonb | NOT NULL | |
| `created_at` | timestamptz | DEFAULT now() | |

**Unique**: `(email_attachment_id)` — one extraction per attachment.

---

#### `smtp_message`
**Purpose**: IMAP-synced messages for SMTP accounts. Thread identity uses RFC 2822 `Message-ID` of the first message in a thread (since SMTP has no server-side thread IDs like Gmail's `threadId`).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | NOT NULL, FK → auth.users(id) | |
| `smtp_account_id` | uuid | NOT NULL, FK → user_smtp_account(id) | |
| `message_id_header` | text | NOT NULL | RFC 2822 Message-ID |
| `email_thread_id` | text | NOT NULL | First message's Message-ID = thread key |
| `in_reply_to_header` | text | nullable | |
| `references_header` | text | nullable | |
| `direction` | text | NOT NULL | `inbound` or `outbound` |
| `sender_email` | text | NOT NULL | |
| `recipient_emails` | text[] | NOT NULL DEFAULT '{}' | |
| `cc_emails` | text[] | NOT NULL DEFAULT '{}' | |
| `bcc_emails` | text[] | NOT NULL DEFAULT '{}' | |
| `subject` | text | nullable | |
| `body_text` | text | nullable | |
| `body_html` | text | nullable | |
| `imap_uid` | bigint | nullable | IMAP sequence number |
| `internal_date` | timestamptz | NOT NULL | |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | |

**Unique**: `(smtp_account_id, message_id_header)` — idempotent insert guard

---

#### `latest_smtp_message_per_thread`
**Purpose**: SMTP equivalent of `latest_gmail_message_per_thread`. Maintained by trigger.

| Column | Type | Constraints |
|--------|------|-------------|
| `smtp_account_id` | uuid | PK (composite) |
| `email_thread_id` | text | PK (composite) |
| `smtp_message_id` | uuid | NOT NULL, FK → smtp_message(id) ON DELETE CASCADE |
| `internal_date` | timestamptz | NOT NULL |
| `direction` | text | NOT NULL |

---

#### `thread_flag`
**Purpose**: LLM-extracted flags per email thread indicating special conditions. Flags are updated on each processing cycle. One row per thread (not per campaign).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `gmail_thread_id` | text | nullable | Mutually exclusive with email_thread_id |
| `email_thread_id` | text | nullable | |
| `wants_paid` | boolean | NOT NULL DEFAULT false | Creator wants paid deal |
| `wants_paid_reason` | text | nullable | LLM explanation |
| `has_question` | boolean | NOT NULL DEFAULT false | Creator has a question |
| `has_question_reason` | text | nullable | |
| `has_issue` | boolean | NOT NULL DEFAULT false | Creator has a problem |
| `has_issue_reason` | text | nullable | |
| `source_message_id` | uuid | nullable | FK → gmail_message(id) |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | |

**Check**: `chk_thread_flag_one_thread_id` — exactly one thread ID set.
**Unique**: `uq_thread_flag_gmail` on `(gmail_thread_id)` WHERE NOT NULL; `uq_thread_flag_email` on `(email_thread_id)` WHERE NOT NULL.

**LLM extraction model**: `gpt-4.1-mini` (speed/cost tradeoff).

---

### 4.4 Thread State Tables

#### `gmail_thread_state`
**Purpose**: Versioned state machine for Gmail threads. Append-only — each state transition inserts a new row. Current state = row with MAX(`latest_internal_date`) for a given `(user_id, gmail_account_id, gmail_thread_id)`.

**Why append-only**: Full audit trail of state transitions. If the system crashes mid-processing, the old state row remains; the new processing cycle inserts a fresh row.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | NOT NULL, FK → auth.users(id) | |
| `gmail_account_id` | uuid | NOT NULL, FK → user_gmail_account(id) | |
| `gmail_thread_id` | text | NOT NULL | |
| `status` | text | NOT NULL | See status enum below |
| `latest_internal_date` | timestamptz | nullable | High-watermark for versioning |
| `latest_gmail_message_id` | uuid | nullable, FK → gmail_message(id) | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**Unique**: `(user_id, gmail_account_id, gmail_thread_id, latest_internal_date)` — version key.
**Status values**:
- `NEW` — Thread just detected, not yet classified
- `READY_FOR_RESPONSE_DRAFT` — Inbound reply received, LLM draft generated, awaiting operator review
- `WAITING_FOR_DRAFT_REVIEW` — Draft being reviewed
- `WAITING_FOR_INBOUND` — Outbound sent, waiting for creator reply
- `IGNORE` / `IGNORED` — Thread classified as irrelevant or opted out
- `AUTO_REPLIED` — System sent automatic opt-out response
- `DONE` — Thread completed (gifting confirmed, post detected, etc.)
- `READY_FOR_CAMPAIGN_ASSOCIATION` — Waiting to be linked to a campaign

**Performance indexes** (covering index for thread list query):
```sql
idx_gmail_thread_state_user_thread_latest_covering
ON (user_id, gmail_thread_id, latest_internal_date DESC)
INCLUDE (id, status, latest_gmail_message_id, gmail_account_id)
```

---

#### `smtp_thread_state`
**Purpose**: SMTP equivalent of `gmail_thread_state`. Same versioning pattern.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | |
| `smtp_account_id` | uuid | NOT NULL, FK → user_smtp_account(id) ON DELETE CASCADE | |
| `email_thread_id` | text | NOT NULL | |
| `status` | text | NOT NULL DEFAULT 'READY_FOR_CAMPAIGN_ASSOCIATION' | |
| `latest_smtp_message_id` | uuid | nullable, FK → smtp_message(id) ON DELETE SET NULL | |
| `latest_internal_date` | timestamptz | NOT NULL | |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | |

**Unique**: `(user_id, smtp_account_id, email_thread_id, latest_internal_date)`

---

#### `gmail_thread_llm_draft`
**Purpose**: AI-generated draft reply for an email thread+state pair. After SMTP support was added, this table supports both email backends (despite the `gmail_` prefix).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | NOT NULL, FK → auth.users(id) | |
| `gmail_account_id` | uuid | nullable, FK → user_gmail_account(id) | Exactly one of gmail/smtp set |
| `smtp_account_id` | uuid | nullable, FK → user_smtp_account(id) | |
| `gmail_thread_id` | text | NOT NULL | Thread identifier |
| `gmail_thread_state_id` | uuid | nullable, FK → gmail_thread_state(id) | Exactly one of gmail/smtp state |
| `smtp_thread_state_id` | uuid | nullable, FK → smtp_thread_state(id) | |
| `draft_subject` | text | nullable | |
| `draft_body_text` | text | nullable | |
| `draft_body_html` | text | nullable | |
| `gmail_draft_id` | text | nullable | Gmail draft ID if synced to Gmail |
| `created_at` | timestamptz | DEFAULT now() | |

**Check constraints**:
- `chk_gmail_thread_llm_draft_one_account` — exactly one of `gmail_account_id` / `smtp_account_id`
- `chk_gmail_thread_llm_draft_one_state` — exactly one of `gmail_thread_state_id` / `smtp_thread_state_id`

**Functional unique**: `(COALESCE(gmail_account_id,...), COALESCE(smtp_account_id,...), gmail_thread_id, COALESCE(gmail_thread_state_id,...), COALESCE(smtp_thread_state_id,...))` — one draft per (account, thread, state).

---

#### `gmail_thread_ui_draft`
**Purpose**: User-edited version of the LLM draft. Created when operator edits the AI draft in the UI. Not synced to Gmail's native draft system. Deleted after send.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `user_id` | uuid | NOT NULL, FK → auth.users(id) |
| `gmail_account_id` | uuid | NOT NULL, FK → user_gmail_account(id) |
| `gmail_thread_id` | text | NOT NULL |
| `gmail_thread_state_id` | uuid | NOT NULL, FK → gmail_thread_state(id) |
| `draft_subject` | text | nullable |
| `draft_body_text` | text | nullable |
| `draft_body_html` | text | nullable |
| `gmail_draft_id` | text | nullable |
| `created_at` | timestamptz | DEFAULT now() |

**Unique**: `(gmail_thread_id, gmail_thread_state_id)` — one UI draft per thread state.

---

#### `gmail_thread_state_follow_up_schedule`
**Purpose**: Legacy follow-up scheduling tied to thread state. Superseded by `campaign_follow_up_outbox_queue` for campaign outreach, but still used for opt-in follow-ups.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `gmail_thread_state_id` | uuid | NOT NULL, FK → gmail_thread_state(id) |
| `gmail_thread_llm_draft_id` | uuid | nullable, FK → gmail_thread_llm_draft(id) |
| `follow_up_number` | integer | NOT NULL |
| `scheduled_at` | timestamptz | NOT NULL |
| `created_at` | timestamptz | DEFAULT now() |

**Unique**: `(gmail_thread_state_id)` — one schedule per thread state.

---

#### `gmail_thread_user_preferences`
**Purpose**: Per-user UI preferences for individual threads (hide, pin, label, notes). Allows operators to archive threads from view without affecting processing pipeline.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `user_id` | uuid | NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| `gmail_account_id` | uuid | NOT NULL, FK → user_gmail_account(id) ON DELETE CASCADE |
| `gmail_thread_id` | text | NOT NULL |
| `is_hidden` | boolean | NOT NULL DEFAULT false |
| `is_pinned` | boolean | nullable |
| `custom_label` | text | nullable |
| `notes` | text | nullable |
| `created_at` | timestamptz | NOT NULL DEFAULT now() |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() |

**Unique**: `(user_id, gmail_account_id, gmail_thread_id)`

---

### 4.5 Campaign Tables

#### `campaign`
**Purpose**: Core campaign entity. Holds all configuration: email templates, LLM instructions (agent persona, rules, goals, FAQs, sample emails), follow-up settings, Google Sheets integration, Slack channel, discovery config, and post tracking settings.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | NOT NULL, FK → auth.users(id) | Owner |
| `product_id` | uuid | nullable, FK → product(id) | Legacy; superseded by `campaign_product` |
| `name` | text | NOT NULL | |
| `campaign_type` | text | NOT NULL | `'gifting'`, `'paid_promotion'`, `'other'` |
| `subject_template` | text | NOT NULL | Initial email subject with `{placeholders}` |
| `body_template` | text | NOT NULL | Initial email body with `{placeholders}` |
| `agent_name_for_llm` | text | NOT NULL DEFAULT '' | AI persona name shown to Claude |
| `rules_for_llm` | text | NOT NULL DEFAULT '' | LLM behavior rules (e.g. max discount) |
| `goal_for_llm` | text | NOT NULL DEFAULT '' | Campaign objective for LLM context |
| `frequently_asked_questions_for_llm` | jsonb | nullable | Q&A pairs for LLM context |
| `sample_emails_for_llm` | jsonb | nullable | Example reply pairs for LLM context |
| `is_follow_up_enabled` | boolean | NOT NULL DEFAULT false | |
| `follow_up_gap_in_days` | integer | NOT NULL DEFAULT 3 | Days between follow-ups |
| `max_follow_ups` | integer | NOT NULL DEFAULT 3 | Max follow-up count |
| `follow_up_templates` | jsonb | nullable | Array of follow-up body templates |
| `google_sheet_url` | text | nullable | Linked Google Sheet for data export |
| `google_sheet_tab_name` | text | nullable | |
| `google_sheet_data_instructions` | text | nullable | LLM instructions for Sheet writes |
| `google_sheet_columns_to_skip` | text[] | DEFAULT '{}' | Column names to exclude from writes |
| `google_sheet_error` | text | nullable | Error type when sheet access fails |
| `google_sheet_error_at` | timestamptz | nullable | |
| `status` | text | NOT NULL DEFAULT 'active' | `draft`, `active`, `paused`, `completed` |
| `is_external` | boolean | NOT NULL DEFAULT false | UI display field |
| `automation_level` | text | nullable | `FULL_AUTOMATION`, `SEMI_AUTOMATION`, `MANUAL` |
| `image_url` | text | nullable | Campaign cover image |
| `is_lookalike_suggestions_enabled` | boolean | NOT NULL DEFAULT false | Enable AI-powered similar creator discovery |
| `draft_metadata` | jsonb | nullable | Serialized wizard form state for draft save/resume |
| `slack_channel_id` | text | nullable | Slack channel for Shopify order approval digests |
| `discovery_enabled` | boolean | NOT NULL DEFAULT false | Enable autonomous creator discovery |
| `discovery_config` | jsonb | nullable | `{seed_profiles[], search_keywords[], follower_min, follower_max, platform}` |
| `post_tracking_enabled` | boolean | NOT NULL DEFAULT false | Monitor creator posts after opt-in |
| `post_opt_in_follow_up_enabled` | boolean | NOT NULL DEFAULT false | Auto follow-up after opt-in detected |
| `post_opt_in_follow_up_body_template` | text | nullable | |
| `post_opt_in_follow_up_delay_hours` | integer | NOT NULL DEFAULT 48 | |
| `completed_at` | timestamptz | nullable | When campaign was closed |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**Status transitions**:
```
draft → active (on launch)
active → paused (manual)
paused → active (manual re-enable)
active → completed (manual)
```

**Partial indexes**: `idx_campaign_google_sheet_error` (non-null sheet errors), `idx_campaign_post_tracking_enabled`, `idx_campaign_completed_at`

---

#### `campaign_sender`
**Purpose**: Maps campaigns to sending email accounts. A campaign can have multiple senders; recipients are distributed round-robin across senders.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `campaign_id` | uuid | NOT NULL, FK → campaign(id) | |
| `gmail_account_id` | uuid | nullable, FK → user_gmail_account(id) | Exactly one set |
| `smtp_account_id` | uuid | nullable, FK → user_smtp_account(id) | |
| `created_at` | timestamptz | DEFAULT now() | |

**Check**: `chk_campaign_sender_account_type` — exactly one of `gmail_account_id` / `smtp_account_id`.
**Unique**: `(campaign_id, gmail_account_id)`, `(campaign_id, smtp_account_id)`

---

#### `campaign_recipient`
**Purpose**: Target creator email contacts for a campaign. Each recipient gets exactly one initial outreach email. Email + name + custom_fields are the personalization data for template substitution.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `campaign_id` | uuid | NOT NULL, FK → campaign(id) | |
| `email` | text | NOT NULL | |
| `name` | text | nullable | |
| `custom_fields` | jsonb | NOT NULL DEFAULT '{}' | Arbitrary fields for `{placeholder}` substitution |
| `created_at` | timestamptz | DEFAULT now() | |

**Unique**: `(campaign_id, email)` — prevents duplicate outreach per campaign.
**Personalization**: `{name}`, `{email}`, and any key in `custom_fields` are available in email templates.

---

#### `campaign_thread`
**Purpose**: Associates email threads with campaigns. A thread belongs to exactly one campaign. This is the JOIN between the email pipeline and the campaign system.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `campaign_id` | uuid | NOT NULL, FK → campaign(id) | |
| `gmail_thread_id` | text | nullable | Mutually exclusive |
| `email_thread_id` | text | nullable | |
| `associated_at` | timestamptz | DEFAULT now() | |

**Check**: `chk_campaign_thread_one_thread_id` — exactly one thread ID set.
**Unique**: One campaign per Gmail thread ID; one campaign per SMTP thread ID.

**Association logic** (priority order):
1. `force_campaign_id` override from workflow
2. DB lookup: existing `campaign_thread` row for this thread
3. LLM matching: compare thread against campaign sender emails (claude-haiku)

---

#### `campaign_outbox_queue`
**Purpose**: Queue of personalized outbound campaign emails waiting to be sent. Workers claim rows by transitioning `pending → processing` atomically with `FOR UPDATE SKIP LOCKED`. Idempotent by `(campaign_sender_id, campaign_recipient_id)`.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `campaign_id` | uuid | NOT NULL, FK → campaign(id) ON DELETE CASCADE | |
| `campaign_recipient_id` | uuid | NOT NULL, FK → campaign_recipient(id) ON DELETE CASCADE | |
| `campaign_sender_id` | uuid | NOT NULL, FK → campaign_sender(id) ON DELETE CASCADE | |
| `subject` | text | NOT NULL | Pre-personalized (placeholders already substituted) |
| `body` | text | NOT NULL | Pre-personalized |
| `cc_emails` | text[] | NOT NULL DEFAULT '{}' | |
| `status` | text | NOT NULL DEFAULT 'pending' | CHECK IN ('pending','processing','sent','failed','cancelled') |
| `sent_at` | timestamptz | nullable | |
| `gmail_thread_id` | text | nullable | Set after successful send |
| `email_thread_id` | text | nullable | Universal thread ID |
| `error_message` | text | nullable | |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | For crash recovery |

**Crash recovery**: Any row with `status='processing'` AND `updated_at < 30 minutes ago` is reset to `'pending'` at worker startup.

---

#### `campaign_follow_up_outbox_queue`
**Purpose**: Sequence of follow-up emails for each initial outbound message. Each row is one follow-up in a numbered sequence. `scheduled_at` is populated after the initial email is sent (`sent_at` of parent + `hours_since_last_email`).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `campaign_outbox_queue_id` | uuid | NOT NULL, FK → campaign_outbox_queue(id) ON DELETE CASCADE | |
| `index` | integer | NOT NULL | 0-indexed position in follow-up sequence |
| `hours_since_last_email` | integer | NOT NULL | Delay from previous email |
| `scheduled_at` | timestamptz | nullable | NULL until initial email sent |
| `body` | text | NOT NULL | No subject — continues thread |
| `gmail_message_id` | text | nullable | After sending |
| `email_message_id` | text | nullable | |
| `status` | text | NOT NULL DEFAULT 'pending' | CHECK IN ('pending','processing','sent','failed','cancelled') |
| `sent_at` | timestamptz | nullable | |
| `error_message` | text | nullable | |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | |

**Unique**: `(campaign_outbox_queue_id, index)` — one row per sequence position.
**Index**: `idx_follow_up_queue_scheduled` on `(scheduled_at, status)` — efficiently finds due follow-ups.

---

#### `campaign_workflow`
**Purpose**: AI workflow definition scoped to a campaign. Each workflow specifies Claude's system prompt, available MCP tool slugs, optional output JSON Schema, and enable flag. Multiple workflows can be active per campaign.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `campaign_id` | uuid | NOT NULL, FK → campaign(id) ON DELETE CASCADE | |
| `name` | text | NOT NULL | Human-readable label |
| `instructions` | text | NOT NULL | Claude system prompt |
| `tool_slugs` | jsonb | NOT NULL DEFAULT '[]' | Array of MCP tool identifiers |
| `config` | jsonb | NOT NULL DEFAULT '{}' | Additional config (model, temperature, etc.) |
| `output_schema` | jsonb | nullable | JSON Schema for structured output; NULL = unstructured text |
| `is_enabled` | boolean | NOT NULL DEFAULT true | |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | |

---

#### `campaign_workflow_execution`
**Purpose**: Append-only execution log for each campaign workflow run. One row per execution. Multiple rows per (thread, workflow) — query with `ORDER BY executed_at DESC LIMIT 1` for latest result.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `gmail_thread_state_id` | uuid | nullable, FK → gmail_thread_state(id) ON DELETE CASCADE | |
| `workflow_id` | uuid | NOT NULL, FK → campaign_workflow(id) ON DELETE CASCADE | |
| `campaign_id` | uuid | NOT NULL, FK → campaign(id) ON DELETE CASCADE | |
| `temporal_workflow_id` | text | nullable | Temporal correlation ID |
| `temporal_run_id` | text | nullable | |
| `temporal_activity_id` | text | nullable | |
| `output_data` | jsonb | nullable | Structured output matching `workflow.output_schema` |
| `raw_response` | text | nullable | Raw LLM text output |
| `status` | text | NOT NULL | `completed`, `error`, `schema_validation_failed` |
| `error_message` | text | nullable | |
| `executed_at` | timestamptz | NOT NULL DEFAULT now() | |
| `execution_duration_ms` | integer | nullable | |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |

---

#### `campaign_creator`
**Purpose**: Influencer/creator representation within a campaign. Richer than `campaign_recipient` — includes gifting workflow state, paid promotion negotiation status, notes history, talent manager info, Slack approval state, Shopify order tracking, and post tracking. This is the primary CRM record per creator per campaign.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `campaign_id` | uuid | NOT NULL, FK → campaign(id) | |
| `email` | text | nullable | Discovered via enrichment |
| `name` | text | nullable | |
| `social_media_handles` | jsonb | NOT NULL DEFAULT '[]' | `[{platform, handle}]` |
| `gifting_status` | text | nullable | Gifting workflow state |
| `gifting_address` | text | nullable | Shipping address for gifting |
| `gifting_discount_code` | text | nullable | Shopify discount code |
| `paid_promotion_status` | text | nullable | `NEW`, `NEGOTIATING`, `POSTED`, `PAID`, etc. |
| `paid_promotion_rate` | text | nullable | e.g. `"$500 flat"` |
| `notes_history` | jsonb | NOT NULL DEFAULT '[]' | Max 3 notes: `[{content, generated_at, is_manual, source}]` |
| `source_gmail_thread_id` | text | nullable | Origin thread |
| `role` | text | NOT NULL DEFAULT 'unknown' | `creator`, `talent_manager`, `agency_staff`, `internal`, `unknown` |
| `talent_manager_name` | text | nullable | |
| `talent_manager_email` | text | nullable | |
| `talent_agency` | text | nullable | |
| `confidence_score` | float | NOT NULL DEFAULT 0.0 | LLM extraction confidence (0.0–1.0) |
| `manually_verified` | boolean | NOT NULL DEFAULT false | |
| `post_tracking_started_at` | timestamptz | nullable | |
| `post_tracking_ends_at` | timestamptz | nullable | `started_at + 90 days` |
| `post_last_checked_at` | timestamptz | nullable | |
| `last_seen_post_id` | text | nullable | Instagram post ID watermark |
| `latest_interaction_at` | timestamptz | nullable | Most recent email interaction |
| `latest_interaction_campaign_id` | uuid | nullable, FK → campaign(id) ON DELETE SET NULL | |
| `slack_digest_message_ts` | text | nullable | Slack message timestamp for digest update |
| `slack_approval_status` | text | nullable | `pending`, `approved`, `skipped` |
| `shopify_order_id` | text | nullable | Created order ID |
| `post_opt_in_follow_up_status` | text | nullable | |
| `post_opt_in_follow_up_scheduled_at` | timestamptz | nullable | |
| `enrichment_status` | text | nullable | `pending`, `enriching`, `enriched`, `no_email_found` |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

---

#### `campaign_lookalike_suggestion`
**Purpose**: AI-discovered similar creators generated by Apify actor. Seeded by an opted-in `campaign_creator`. Operators review/accept/reject suggestions to add them to outreach.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `campaign_id` | uuid | NOT NULL, FK → campaign(id) ON DELETE CASCADE | |
| `seed_creator_id` | uuid | NOT NULL, FK → campaign_creator(id) ON DELETE CASCADE | The creator who prompted the suggestion |
| `seed_platform_handle` | text | NOT NULL | |
| `platform` | text | NOT NULL DEFAULT 'instagram' | |
| `suggested_username` | text | NOT NULL | |
| `suggested_full_name` | text | nullable | |
| `suggested_biography` | text | nullable | |
| `suggested_follower_count` | integer | NOT NULL DEFAULT 0 | |
| `suggested_profile_pic_url` | text | nullable | |
| `suggested_is_verified` | boolean | NOT NULL DEFAULT false | |
| `suggested_external_url` | text | nullable | |
| `suggested_category` | text | nullable | |
| `suggested_email` | text | nullable | Public email from Apify |
| `apify_run_id` | text | NOT NULL | |
| `similarity_score` | numeric(5,2) | nullable | |
| `status` | text | NOT NULL DEFAULT 'pending' | `pending`, `accepted`, `rejected` |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | |

**Unique**: `(campaign_id, platform, suggested_username)` — no duplicate suggestions.

---

#### `email_reply_example`
**Purpose**: Training corpus for RAG-based draft generation. Stores (inbound email, human reply) pairs with pgvector embeddings. When a new reply is needed, cosine similarity search finds the most stylistically similar past replies to use as few-shot examples.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `thread_id` | text | NOT NULL | Source thread |
| `campaign_id` | uuid | NOT NULL, FK → campaign(id) ON DELETE CASCADE | |
| `thread_summary` | text | NOT NULL | LLM-generated thread context |
| `inbound_email_text` | text | NOT NULL | The creator's email being replied to |
| `embedding` | vector(1536) | nullable | OpenAI text-embedding-3-small |
| `sent_reply_text` | text | NOT NULL | The human-written reply |
| `sanitized_reply_text` | text | nullable | PII-scrubbed version with placeholders |
| `reply_summary` | text | nullable | Label: "brief acceptance", "brief decline", etc. |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |

**Unique**: `(campaign_id, thread_id, md5(inbound_email_text), md5(sent_reply_text))`
**Indexes**: HNSW index on `embedding` with `vector_cosine_ops` for ANN search; standard indexes on `campaign_id`, `thread_id`.

---

#### `campaign_rule_suggestion_analytics`
**Purpose**: Audit trail for the "Rewrite with AI" feature. When an operator manually edits thread flags, the system generates a campaign-wide rule suggestion. This table tracks whether the suggestion was accepted, what edits were made, and what the final rule looked like.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `campaign_id` | uuid | NOT NULL, FK → campaign(id) | |
| `gmail_account_id` | uuid | NOT NULL, FK → user_gmail_account(id) | |
| `gmail_thread_id` | text | NOT NULL | |
| `action` | text | DEFAULT 'accepted' | |
| `rule_original` | text | NOT NULL | AI-generated suggestion |
| `rule_final` | text | NOT NULL | Accepted/edited version |
| `was_edited` | boolean | NOT NULL DEFAULT false | |
| `custom_instructions` | text | nullable | User's custom input for AI rewrite |
| `created_at` | timestamptz | DEFAULT now() | |

---

#### `campaign_csv`
**Purpose**: Tracks CSV files uploaded for bulk recipient import. Stores preview (first N rows as JSON) for the UI wizard mapping screen. Full file in Supabase Storage.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | NOT NULL, FK → auth.users(id) | |
| `campaign_id` | uuid | NOT NULL, FK → campaign(id) | |
| `original_filename` | text | nullable | |
| `preview` | jsonb | NOT NULL | First N rows as array of objects |
| `storage_key` | text | NOT NULL | Supabase Storage path |
| `created_at` | timestamptz | DEFAULT now() | |

---

#### `email_dispatch_queue`
**Purpose**: Generic scheduled email delivery queue. Used for deferred sending (e.g., follow-ups, timed sequences). Distinct from `campaign_outbox_queue` (which is campaign-specific bulk outreach). Supports both Gmail and SMTP backends.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | |
| `gmail_account_id` | uuid | nullable, FK → user_gmail_account(id) ON DELETE CASCADE | Exactly one set |
| `smtp_account_id` | uuid | nullable, FK → user_smtp_account(id) ON DELETE CASCADE | |
| `recipient_email` | text | NOT NULL | |
| `recipient_name` | text | nullable | |
| `cc_emails` | text[] | nullable | |
| `bcc_emails` | text[] | nullable | |
| `subject` | text | NOT NULL | |
| `body_text` | text | nullable | At least one of body_text/body_html required |
| `body_html` | text | nullable | |
| `in_reply_to_message_id` | text | nullable | RFC 2822 threading |
| `references_header` | text | nullable | |
| `gmail_thread_id` | text | nullable | |
| `dispatch_at` | timestamptz | NOT NULL | Scheduled send time |
| `user_timezone` | text | NOT NULL DEFAULT 'UTC' | |
| `status` | email_dispatch_status | NOT NULL DEFAULT 'pending' | ENUM: pending, processing, sent, failed, cancelled |
| `sent_at` | timestamptz | nullable | |
| `gmail_message_id` | text | nullable | After send |
| `smtp_message_id` | text | nullable | |
| `error_message` | text | nullable | |
| `retry_count` | integer | NOT NULL DEFAULT 0 | |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | |

**Check constraints**: exactly one account set; at least one body set.

---

#### `email_signature`
**Purpose**: Reusable email signatures. Can be user-level (`campaign_id IS NULL`) or campaign-specific. Only one default signature per user; only one signature per campaign.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | |
| `name` | varchar(255) | NOT NULL | |
| `content` | text | NOT NULL | HTML signature content |
| `is_default` | boolean | NOT NULL DEFAULT false | |
| `campaign_id` | uuid | nullable, FK → campaign(id) ON DELETE CASCADE | |
| `is_enabled` | boolean | NOT NULL DEFAULT false | For campaign signatures |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | |

**Partial unique**: `(user_id)` WHERE `is_default = true` — one default per user.
**Partial unique**: `(campaign_id)` WHERE `campaign_id IS NOT NULL` — one signature per campaign.

---

#### `campaign_product`
**Purpose**: Many-to-many junction linking campaigns to products. Replaced the legacy single `campaign.product_id` FK to support multi-product campaigns.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `campaign_id` | uuid | NOT NULL, FK → campaign(id) ON DELETE CASCADE |
| `product_id` | uuid | NOT NULL, FK → product(id) |
| `created_at` | timestamptz | DEFAULT now() |

**Unique**: `(campaign_id, product_id)`

---

#### `campaign_member_assignment`
**Purpose**: Grants team members access to specific campaigns. Campaign ownership stays with `campaign.user_id`; this table grants view/edit rights to non-owners.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `campaign_id` | uuid | NOT NULL, FK → campaign(id) ON DELETE CASCADE |
| `user_id` | uuid | NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| `created_at` | timestamptz | NOT NULL DEFAULT now() |

**Unique**: `(campaign_id, user_id)` — one assignment per user per campaign.

---

### 4.6 Creator Tables

#### `product`
**Purpose**: Brand's product catalog. Products can be linked to multiple campaigns. URL scraping is optional (made nullable in migration 13 after brands without product URLs needed support).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | NOT NULL, FK → auth.users(id) | |
| `name` | text | NOT NULL | |
| `description` | text | NOT NULL | |
| `url_to_scrape` | text | nullable | Product page URL |
| `created_at` | timestamptz | DEFAULT now() | |

**Unique**: `(user_id, name)`

---

#### `creator`
**Purpose**: Global, platform-agnostic creator profile registry. **Not user-scoped** — all authenticated users can read. Backend writes via service_role only. This is the shared database of all known influencers.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `platform` | text | NOT NULL | `instagram`, `youtube`, `tiktok`, etc. |
| `handle` | text | NOT NULL | Platform username |
| `email` | text | nullable | Discovered via enrichment |
| `follower_count` | integer | NOT NULL DEFAULT 0 | |
| `is_verified` | boolean | NOT NULL DEFAULT false | |
| `location` | text | nullable | |
| `keywords` | text[] | NOT NULL DEFAULT '{}' | Content categories |
| `profile_data` | jsonb | NOT NULL DEFAULT '{}' | Platform-specific data blob |
| `snapshots` | jsonb | NOT NULL DEFAULT '[]' | Historical profile snapshots for trend analysis |
| `profile_image_path` | text | nullable | Supabase Storage path |
| `profile_image_etag` | text | nullable | CDN ETag for deduplication |
| `first_seen_at` | timestamptz | NOT NULL DEFAULT now() | |
| `last_updated_at` | timestamptz | NOT NULL DEFAULT now() | |
| `source` | text | nullable | `apify`, `enrichment`, `manual`, etc. |

**Unique**: `(platform, handle)` — one profile per platform handle.
**Indexes**: GIN on `keywords`, partial indexes on `email NOT NULL`, `is_verified = true`, `location IS NOT NULL`.

---

#### `creator_enrichment_attempt`
**Purpose**: Audit log for email discovery attempts per creator. Used to enforce a 15-day cooldown before re-attempting enrichment on the same creator.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `creator_id` | uuid | NOT NULL, FK → creator(id) ON DELETE CASCADE | |
| `platform` | text | NOT NULL | |
| `status` | text | NOT NULL | `success`, `no_email_found`, `failed` |
| `email_found` | text | nullable | The email discovered (if successful) |
| `source` | text | nullable | `apify`, `bio_link_crawl`, `influencer_club` |
| `attempted_at` | timestamptz | NOT NULL DEFAULT now() | |

**Enrichment waterfall** (in order):
1. Check `creator.email` (cached)
2. Apify scraper (Instagram/YouTube profile)
3. Bio link crawl (Linktree, Beacons, etc. via Firecrawl)
4. Influencer Club API (paid, final fallback)

---

#### `creator_list`
**Purpose**: User-defined lists for organizing and bookmarking creators before adding them to campaigns.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `user_id` | uuid | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | |
| `title` | varchar(255) | NOT NULL | |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | |

---

#### `creator_list_item`
**Purpose**: Many-to-many join between `creator_list` and `creator`. Allows bookmarking creators in named collections.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `list_id` | uuid | NOT NULL, FK → creator_list(id) ON DELETE CASCADE |
| `creator_id` | uuid | NOT NULL, FK → creator(id) ON DELETE CASCADE |
| `created_at` | timestamptz | NOT NULL DEFAULT now() |

**Unique**: `(list_id, creator_id)`

---

#### `creator_post`
**Purpose**: Instagram/social media posts detected from opted-in campaign creators. Populated by the post-tracking workflow that monitors creator content after they opt into a campaign.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `campaign_id` | uuid | NOT NULL, FK → campaign(id) ON DELETE CASCADE | |
| `campaign_creator_id` | uuid | NOT NULL, FK → campaign_creator(id) ON DELETE CASCADE | |
| `instagram_post_id` | text | NOT NULL | Native Instagram ID |
| `post_type` | text | NOT NULL CHECK IN ('post', 'story', 'reel') | |
| `post_url` | text | NOT NULL | |
| `caption` | text | nullable | |
| `media_urls` | jsonb | DEFAULT '[]' | |
| `media_storage_path` | text | nullable | Permanent Supabase Storage copy |
| `thumbnail_url` | text | nullable | |
| `like_count` | integer | DEFAULT 0 | |
| `view_count` | integer | nullable | |
| `comment_count` | integer | DEFAULT 0 | |
| `posted_at` | timestamptz | nullable | |
| `matched_at` | timestamptz | NOT NULL DEFAULT now() | When detected |
| `match_method` | text | NOT NULL CHECK IN ('caption', 'llm') | How post was identified |
| `match_reason` | text | nullable | LLM explanation |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |

**Unique**: `(campaign_creator_id, instagram_post_id)`

---

### 4.7 Team Tables

#### `team`
**Purpose**: Organizational unit for multi-user collaboration. A user can own multiple teams.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK |
| `name` | text | NOT NULL |
| `owner_user_id` | uuid | NOT NULL, FK → auth.users(id) ON DELETE CASCADE |
| `created_at` | timestamptz | NOT NULL DEFAULT now() |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() |

---

#### `team_member`
**Purpose**: Membership roster. The team owner is **also** inserted as a member with `role='owner'` — simplifies "get all members" queries.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK | |
| `team_id` | uuid | NOT NULL, FK → team(id) ON DELETE CASCADE | |
| `user_id` | uuid | NOT NULL, FK → auth.users(id) ON DELETE CASCADE | |
| `role` | text | NOT NULL DEFAULT 'member' CHECK IN ('owner', 'member') | |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |

**Unique**: `(team_id, user_id)`

---

## 5. Database Triggers

| Trigger | Table | Event | Function | Purpose |
|---------|-------|-------|----------|---------|
| `trigger_update_latest_gmail_message_per_thread` | `gmail_message` | AFTER INSERT | `update_latest_gmail_message_per_thread()` | UPSERTS the high-watermark row for thread list rendering |
| `trigger_update_latest_smtp_message_per_thread` | `smtp_message` | AFTER INSERT | `update_latest_smtp_message_per_thread()` | SMTP equivalent |

These triggers keep `latest_*_message_per_thread` always consistent with the messages table, eliminating the need for expensive MAX() queries in the inbox API.

---

## 6. SECURITY DEFINER Functions

These PostgreSQL functions execute with the function definer's privileges (bypassing RLS for the caller), preventing cross-table policy recursion:

| Function | Signature | Used By | Logic |
|----------|-----------|---------|-------|
| `is_member_of_team(team_id uuid)` | Returns boolean | `team` SELECT policy | `EXISTS (SELECT 1 FROM team_member WHERE team_id=$1 AND user_id=auth.uid())` |
| `is_campaign_owner(campaign_id uuid)` | Returns boolean | `campaign_member_assignment` ALL policy | `EXISTS (SELECT 1 FROM campaign WHERE id=$1 AND user_id=auth.uid())` |
| `can_access_campaign(campaign_id uuid)` | Returns boolean | All campaign child table SELECT policies | `is_campaign_owner(campaign_id) OR EXISTS (SELECT 1 FROM campaign_member_assignment WHERE campaign_id=$1 AND user_id=auth.uid())` |

All use `SECURITY DEFINER SET search_path = public STABLE`.

---

## 7. Index Strategy

### Performance-Critical Indexes

| Index | Table | Type | Purpose |
|-------|-------|------|---------|
| `idx_gmail_thread_state_user_thread_latest_covering` | `gmail_thread_state` | BTREE covering | Thread list query: fetch status + message ID without heap access |
| `idx_gmail_thread_state_user_latest_date` | `gmail_thread_state` | BTREE | Sort-elimination for inbox ordering by date |
| `idx_gmail_message_sender_email_trgm` | `gmail_message` | GIN trigram | ILIKE search on sender email |
| `idx_gmail_message_body_text_trgm` | `gmail_message` | GIN trigram | ILIKE full-text search on email bodies |
| `idx_email_reply_example_embedding` | `email_reply_example` | HNSW (cosine) | ANN search for RAG similar-reply lookup |
| `idx_follow_up_queue_scheduled` | `campaign_follow_up_outbox_queue` | BTREE | Efficiently find due follow-ups by (scheduled_at, status) |
| `idx_campaign_outbox_queue_sender_status` | `campaign_outbox_queue` | BTREE | Worker claims by (sender, status) |

### Partial Indexes (Performance + Storage)

| Index | Condition | Purpose |
|-------|-----------|---------|
| `idx_campaign_google_sheet_error` | `google_sheet_error IS NOT NULL` | Find campaigns with sheet errors |
| `idx_campaign_post_tracking_enabled` | `post_tracking_enabled = true` | Post-tracking workflow target selection |
| `idx_campaign_completed_at` | `completed_at IS NOT NULL` | Completed campaign reporting |
| `idx_creator_email` | `email IS NOT NULL` | Filter to creators with known emails |
| `idx_creator_is_verified` | `is_verified = true` | Filter to verified creators |
| `idx_cc_post_opt_in_follow_up_pending` | `post_opt_in_follow_up_status = 'PENDING'` | Due follow-up selection |

---

## 8. Row Level Security Summary

### Architecture

- **All tables have RLS enabled**
- **Backend always uses `service_role`** — bypasses RLS entirely; all row-level isolation is explicit in `WHERE user_id = ?` clauses
- **Frontend uses anon key + session** — subject to RLS for all direct reads
- **Defense in depth**: RLS is a backstop; primary enforcement is at the API layer

### Access Levels

| Level | Tables | Select Policy |
|-------|--------|---------------|
| Owner only | `user_gmail_account`, `user_smtp_account`, `gmail_message`, `gmail_thread_state`, `gmail_thread_llm_draft`, `gmail_thread_ui_draft`, `email_attachment`, `user_setting`, `email_dispatch_queue`, `product`, `email_signature` | `user_id = auth.uid()` |
| Owner OR assigned | `campaign`, `campaign_recipient`, `campaign_sender`, `campaign_thread`, `campaign_outbox_queue`, `campaign_workflow`, `campaign_workflow_execution`, `campaign_creator`, `creator_post`, `email_reply_example`, `campaign_rule_suggestion_analytics`, `campaign_member_assignment` | `can_access_campaign(campaign_id)` |
| Team-aware | `team`, `team_member` | `owner_user_id = auth.uid()` OR `is_member_of_team(team_id)` |
| Global read | `creator`, `creator_enrichment_attempt` | Any authenticated user |
| User-scoped | `creator_list`, `creator_list_item` | `user_id = auth.uid()` |

### Credential Protection (Critical Security Decision)

Team members have **zero direct RLS access** to `user_gmail_account` and `user_smtp_account`. The team-member SELECT policy was intentionally dropped (migration `20260217100003`) because PostgreSQL RLS controls rows not columns — a broad SELECT would expose `refresh_token` and `smtp_password`.

Routes needing sender email addresses for team members use `createServiceClient()` (bypasses RLS) after verifying campaign access at the API layer.

### Permission Matrix

| Action | Campaign Owner | Assigned Member | Unassigned Member | Unauthenticated |
|--------|---------------|-----------------|-------------------|-----------------|
| View own campaigns | ✓ | — | — | ✗ |
| View assigned campaigns | — | ✓ | — | ✗ |
| Create campaign | ✓ | ✗ | ✗ | ✗ |
| Launch campaign | ✓ | ✗ | ✗ | ✗ |
| Edit campaign config | ✓ | ✗ | ✗ | ✗ |
| View recipients/threads | ✓ | ✓ | ✗ | ✗ |
| Add/edit recipients | ✓ | ✓ | ✗ | ✗ |
| View/accept creator suggestions | ✓ | ✓ | ✗ | ✗ |
| View email credentials | ✓ (direct) | ✗ (API layer) | ✗ | ✗ |
| Assign campaigns to members | Owner (team owner only) | ✗ | ✗ | ✗ |

---

## 9. Data Lifecycle Patterns

### Pattern A: Two-Tier Content Storage

| Tier | What | Where | Access Pattern |
|------|------|-------|----------------|
| Database | Parsed body (capped), structured metadata, headers | `gmail_message.body_text` / `body_html` | Fast reads for display + GIN search |
| Object Storage | Full raw MIME bytes, uncapped HTML | Supabase Storage `raw-emails/{user_id}/{gmail_message_id}` | Audit, re-processing, legal hold |

Prevents PostgreSQL bloat from multi-MB emails while keeping searchable content in-database.

### Pattern B: Append-Only Event Sourcing (Thread State)

`gmail_thread_state` / `smtp_thread_state` never UPDATE existing rows. Each state transition = new INSERT. Current state = MAX(`latest_internal_date`).

Benefits:
- Full audit trail of every state change
- Crash safety: stale processing rows don't corrupt state
- Point-in-time queries for debugging

### Pattern C: Idempotent Bulk Insert

All batch operations use `INSERT ... ON CONFLICT DO NOTHING`:
- `gmail_message`: conflict on `(gmail_account_id, gmail_message_id)`
- `campaign_outbox_queue`: conflict on `(campaign_sender_id, campaign_recipient_id)`
- `campaign_recipient`: conflict on `(campaign_id, email)`
- `email_reply_example`: conflict on content hash

This makes all workers safe to retry without coordination.

### Pattern D: Worker Queue with Crash Recovery

`campaign_outbox_queue` and `campaign_follow_up_outbox_queue` use a `status` state machine with `FOR UPDATE SKIP LOCKED` for concurrent workers:
```
pending → processing (worker claims)
processing → sent (success)
processing → failed (error)
processing → pending (crash recovery: updated_at < 30 min ago)
pending/processing → cancelled (campaign completion)
```

### Pattern E: RAG Training Pipeline

Every sent reply trains the campaign's draft model:
1. `ingest_sent_reply_as_example_activity` sanitizes PII
2. `EmbeddingService` generates 1536-dim vector
3. Stored in `email_reply_example` with HNSW index
4. Future drafts use cosine similarity search (threshold: 0.3) to find stylistically similar past replies

---

## 10. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Append-only thread state | Audit trail, crash safety, point-in-time queries |
| `campaign_thread` UNIQUE on thread ID | Enforce one-campaign-per-thread business rule at DB level |
| Check constraints on dual-path tables | Enforce exactly-one-path invariant at DB level, not just application |
| `latest_*_message_per_thread` via trigger | Eliminate MAX() aggregation from hot inbox query path |
| `draft_metadata` JSONB on campaign | Store wizard state server-side for cross-device draft resume without a separate draft schema |
| `notes_history` capped at 3 entries | Prevent unbounded growth; oldest notes are evicted |
| `email_reply_example` sanitized copy | RAG training needs PII-free content; original preserved for audit |
| `creator` table is global, not user-scoped | Amortize enrichment cost across all users who encounter the same creator |
| 15-day enrichment cooldown | Prevent hammering external APIs for the same creator repeatedly |
| No `team_id` on `campaign` | Campaign sharing is per-campaign assignment, not team-wide |
