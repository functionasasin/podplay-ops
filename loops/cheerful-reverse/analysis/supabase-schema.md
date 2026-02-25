# Cheerful Platform — Comprehensive Database Schema Analysis

## 1. Entity-Relationship Diagram (ASCII)

```
auth.users (Supabase built-in)
    |
    |--- user_setting (1:1)
    |--- user_onboarding (1:1)
    |--- user_gmail_account (1:N)
    |         |--- gmail_message (1:N)
    |         |         |--- email_attachment (1:N)
    |         |         |         |--- email_attachment_llm_extracted_content (1:1)
    |         |         |--- latest_gmail_message_per_thread [trigger-maintained] (N:1)
    |         |--- gmail_thread_state (1:N)
    |         |         |--- gmail_thread_llm_draft (1:N) [also FK to smtp_thread_state]
    |         |         |--- gmail_thread_ui_draft (1:N)
    |         |         |--- gmail_thread_state_follow_up_schedule (1:1)
    |         |--- gmail_thread_user_preferences (1:N)
    |
    |--- user_smtp_account (1:N)
    |         |--- smtp_message (1:N)
    |         |         |--- latest_smtp_message_per_thread [trigger-maintained]
    |         |--- smtp_thread_state (1:N)
    |
    |--- email_dispatch_queue (1:N)
    |
    |--- product (1:N)
    |         |--- campaign_product [junction] (N:M with campaign)
    |
    |--- campaign (1:N)
    |         |--- campaign_sender (1:N) ----FK---> user_gmail_account
    |         |                        \---FK---> user_smtp_account
    |         |--- campaign_recipient (1:N)
    |         |--- campaign_thread (1:N) [unique: gmail_thread_id | email_thread_id]
    |         |--- campaign_outbox_queue (1:N) ----FK---> campaign_sender
    |         |         |                       \----FK---> campaign_recipient
    |         |         |--- campaign_follow_up_outbox_queue (1:N)
    |         |--- campaign_workflow (1:N)
    |         |         |--- campaign_workflow_execution (1:N)
    |         |--- campaign_creator (1:N)
    |         |         |--- campaign_lookalike_suggestion (1:N) [seed FK]
    |         |         |--- creator_post (1:N)
    |         |--- campaign_rule_suggestion_analytics (1:N)
    |         |--- campaign_csv (1:N)
    |         |--- email_reply_example (1:N)
    |         |--- campaign_member_assignment (N:M)---FK---> auth.users
    |         |--- campaign_product [junction] --------FK---> product
    |
    |--- team (1:N)
    |         |--- team_member (1:N) --------FK---> auth.users
    |
    |--- creator_list (1:N)
    |         |--- creator_list_item (N:M) ---FK---> creator
    |
    |--- email_signature (1:N)
    |         |--- campaign (optional FK: campaign_id)
    |
    |--- email_dispatch_queue (1:N)
    |
    |--- debug_upload (1:N)

creator (global, not user-scoped)
    |--- creator_enrichment_attempt (1:N)
    |--- creator_list_item (N:M) ---FK---> creator_list

campaign_creator ---FK---> campaign
                 ---FK (optional)---> creator  [no explicit FK; enrichment_status links conceptually]

thread_flag [standalone, keyed on gmail_thread_id | email_thread_id]

-- Discord subsystem (no FK to auth.users - uses Discord IDs) --
discord_workflow (1:N)
    |--- discord_workflow_scope (1:N)
    |--- discord_workflow_execution (1:N)

discord_thread_sessions (standalone)
discord_channel_mapping (standalone)

-- Meta/infra tables --
session_templates
n8n_workflows
thread_tool_contexts
clarify_meetings

-- Legacy --
channel_sessions
thread_sessions
```

---

## 2. Table-by-Table Specification

### `user_gmail_account`

**Purpose:** Stores Gmail OAuth connections per user. The backend uses the `refresh_token` to call the Gmail API. Tracks sync state for incremental polling via Gmail history IDs.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | FK → auth.users(id) |
| gmail_email | text | NO | — | UNIQUE |
| refresh_token | text | NO | — | Encrypted OAuth token |
| last_poll_history_id | bigint | YES | — | Gmail history API watermark |
| sync_in_progress | boolean | YES | false | Mutex flag |
| is_active | boolean | YES | true | Soft-disable |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

**PK:** `id`
**Unique:** `gmail_email`
**Indexes:** `idx_user_gmail_account_user_id` on `(user_id)`

---

### `gmail_message`

**Purpose:** Immutable event-sourced log of all Gmail messages (inbound and outbound) synced from Gmail. Single table for both directions; `direction` field discriminates.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |
| user_id | uuid | NO | — | FK → auth.users(id) ON DELETE CASCADE |
| gmail_account_id | uuid | NO | — | FK → user_gmail_account(id) ON DELETE CASCADE |
| gmail_message_id | text | NO | — | Gmail's native ID |
| gmail_thread_id | text | NO | — | Gmail's thread ID |
| direction | text | NO | — | `'inbound'` or `'outbound'` |
| sender_email | text | NO | — | |
| recipient_emails | text[] | NO | '{}' | |
| cc_emails | text[] | NO | '{}' | |
| bcc_emails | text[] | NO | '{}' | |
| subject | text | YES | — | |
| body_text | text | YES | — | |
| body_html | text | YES | — | |
| history_id | bigint | YES | — | |
| size_estimate | integer | YES | — | |
| labels | text[] | NO | '{}' | Gmail label array |
| message_id_header | text | YES | — | RFC 2822 Message-ID |
| in_reply_to_header | text | YES | — | |
| references_header | text | YES | — | |
| internal_date | timestamptz | NO | — | Gmail's timestamp |
| storage_key_gmail_raw | text | YES | — | Supabase Storage key for raw MIME |

**PK:** `id`
**Unique:** `idx_gmail_message_unique` on `(gmail_account_id, gmail_message_id)`
**Indexes:**
- `idx_gmail_message_gmail_message_id` on `(gmail_message_id)`
- `idx_gmail_message_gmail_thread_id` on `(gmail_thread_id)`
- `idx_gmail_message_user_id` on `(user_id)`
- `idx_gmail_message_gmail_account_id` on `(gmail_account_id)`
- `idx_gmail_message_direction` on `(direction)`
- `idx_gmail_message_internal_date` on `(internal_date DESC)`
- `idx_gmail_message_thread_direction` on `(gmail_thread_id, direction)`
- `idx_gmail_message_thread_internal_date` on `(gmail_thread_id, internal_date DESC)`
- `idx_gmail_message_account_internal_date` on `(gmail_account_id, internal_date DESC)`
- `idx_gmail_message_sender_email_trgm` GIN `(sender_email gin_trgm_ops)` — for ILIKE
- `idx_gmail_message_body_text_trgm` GIN `(body_text gin_trgm_ops)` — for ILIKE

---

### `latest_gmail_message_per_thread`

**Purpose:** A denormalized "high water mark" table that tracks the latest message per Gmail thread ID. Maintained exclusively by the `trigger_update_latest_gmail_message_per_thread` trigger — never written directly.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| gmail_thread_id | text | NO | — | PK |
| gmail_message_id | uuid | NO | — | FK → gmail_message(id) ON DELETE CASCADE |
| internal_date | timestamptz | NO | — | |
| direction | text | NO | — | |

**PK:** `gmail_thread_id`
**Indexes:** `idx_latest_message_per_thread_message_id` on `(gmail_message_id)`

---

### `email_attachment`

**Purpose:** Metadata for email attachments; actual bytes stored in Supabase Storage. References the parent `gmail_message`.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| gmail_message_id | uuid | YES | — | FK → gmail_message(id) ON DELETE CASCADE |
| part_id | text | NO | — | MIME part identifier |
| filename | text | YES | — | |
| mime_type | text | NO | — | |
| size | integer | NO | — | Bytes |
| gmail_attachment_id | text | YES | — | Gmail's attachment ID for fetching |
| storage_key | text | NO | — | Supabase Storage path |
| sha256 | text | YES | — | Deduplication hash |
| mime_part_index | integer | YES | — | |
| created_at | timestamptz | YES | now() | |

**PK:** `id`
**Indexes:** `idx_email_attachment_gmail_message_id` on `(gmail_message_id)`

---

### `email_attachment_llm_extracted_content`

**Purpose:** Stores LLM-extracted text/structured content from attachments (PDFs, images, etc.). One-to-one with `email_attachment`.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| email_attachment_id | uuid | YES | — | FK → email_attachment(id) ON DELETE CASCADE |
| extracted_content | jsonb | NO | — | |
| created_at | timestamptz | YES | now() | |

**PK:** `id`
**Unique:** `(email_attachment_id)`

---

### `gmail_thread_state`

**Purpose:** Versioned state for Gmail threads. Each time a thread's status changes a new row is inserted (event-sourcing style via the `UNIQUE` on `(user_id, gmail_account_id, gmail_thread_id, latest_internal_date)`). Latest state is the row with the maximum `latest_internal_date` for a given thread.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | FK → auth.users(id) |
| gmail_account_id | uuid | NO | — | FK → user_gmail_account(id) |
| gmail_thread_id | text | NO | — | |
| status | text | NO | — | e.g. WAITING_FOR_DRAFT_REVIEW, WAITING_FOR_INBOUND, IGNORE |
| latest_internal_date | timestamptz | YES | — | High water mark |
| latest_gmail_message_id | uuid | YES | — | FK → gmail_message(id) |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

**PK:** `id`
**Unique:** `(user_id, gmail_account_id, gmail_thread_id, latest_internal_date)`
**Indexes:**
- `idx_gmail_thread_state_latest_version` on `(gmail_thread_id, latest_internal_date DESC)`
- `idx_gmail_thread_state_user_latest` on `(user_id, gmail_account_id, gmail_thread_id, latest_internal_date DESC)`
- `idx_gmail_thread_state_gmail_account_id` on `(gmail_account_id)`
- `idx_gmail_thread_state_latest_gmail_message_id` on `(latest_gmail_message_id)`
- `idx_gmail_thread_state_status` on `(status)`
- `idx_gmail_thread_state_user_thread_latest_covering` on `(user_id, gmail_thread_id, latest_internal_date DESC) INCLUDE (id, status, latest_gmail_message_id, gmail_account_id)` — covering index for thread list query
- `idx_gmail_thread_state_user_latest_date` on `(user_id, latest_internal_date DESC)` — sort-elimination index

---

### `gmail_thread_llm_draft`

**Purpose:** LLM-generated draft replies for email threads. Supports both Gmail and SMTP backends after migration 20251127. One draft per (account, thread, state) combination.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | FK → auth.users(id) |
| gmail_account_id | uuid | YES | — | FK → user_gmail_account(id); nullable after SMTP added |
| smtp_account_id | uuid | YES | — | FK → user_smtp_account(id) |
| gmail_thread_id | text | NO | — | |
| gmail_thread_state_id | uuid | YES | — | FK → gmail_thread_state(id); nullable after SMTP added |
| smtp_thread_state_id | uuid | YES | — | FK → smtp_thread_state(id) |
| draft_subject | text | YES | — | |
| draft_body_text | text | YES | — | |
| draft_body_html | text | YES | — | |
| gmail_draft_id | text | YES | — | Gmail draft ID if synced |
| created_at | timestamptz | YES | now() | |

**PK:** `id`
**Unique (functional):** `unique_thread_llm_draft_per_state` on `(COALESCE(gmail_account_id,...), COALESCE(smtp_account_id,...), gmail_thread_id, COALESCE(gmail_thread_state_id,...), COALESCE(smtp_thread_state_id,...))`
**Check constraints:**
- `chk_gmail_thread_llm_draft_one_account`: exactly one of `gmail_account_id` / `smtp_account_id` must be set
- `chk_gmail_thread_llm_draft_one_state`: exactly one of `gmail_thread_state_id` / `smtp_thread_state_id` must be set
**Indexes:** `idx_gmail_thread_llm_draft_gmail_thread_state_id`, `idx_gmail_thread_llm_draft_smtp`, `idx_gmail_thread_llm_draft_smtp_state`

---

### `gmail_thread_ui_draft`

**Purpose:** User-edited drafts (UI layer), parallel structure to `gmail_thread_llm_draft`. Not synced to Gmail.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | FK → auth.users(id) |
| gmail_account_id | uuid | NO | — | FK → user_gmail_account(id) |
| gmail_thread_id | text | NO | — | |
| gmail_thread_state_id | uuid | NO | — | FK → gmail_thread_state(id) |
| draft_subject | text | YES | — | |
| draft_body_text | text | YES | — | |
| draft_body_html | text | YES | — | |
| gmail_draft_id | text | YES | — | |
| created_at | timestamptz | YES | now() | |

**Unique:** `(gmail_thread_id, gmail_thread_state_id)`
**Indexes:** `idx_gmail_thread_ui_draft_gmail_thread_state_id`

---

### `gmail_thread_state_follow_up_schedule`

**Purpose:** Schedules automatic follow-up emails for a thread state (legacy mechanism predating the outbox queue follow-up system).

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| gmail_thread_state_id | uuid | NO | — | FK → gmail_thread_state(id) |
| gmail_thread_llm_draft_id | uuid | YES | — | FK → gmail_thread_llm_draft(id) |
| follow_up_number | integer | NO | — | 1-indexed |
| scheduled_at | timestamptz | NO | — | |
| created_at | timestamptz | YES | now() | |

**Unique:** `(gmail_thread_state_id)` — one schedule per thread state

---

### `gmail_thread_user_preferences`

**Purpose:** Per-user preferences for individual Gmail threads (hidden, pinned, custom labels). Allows users to archive threads from view without affecting processing.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |
| user_id | uuid | NO | — | FK → auth.users(id) ON DELETE CASCADE |
| gmail_account_id | uuid | NO | — | FK → user_gmail_account(id) ON DELETE CASCADE |
| gmail_thread_id | text | NO | — | |
| is_hidden | boolean | NO | false | |
| is_pinned | boolean | YES | — | |
| custom_label | text | YES | — | |
| notes | text | YES | — | |

**Unique:** `uq_thread_user_preferences_user_account_thread` on `(user_id, gmail_account_id, gmail_thread_id)`
**Indexes:** `idx_thread_prefs_user_hidden` on `(user_id, is_hidden)`, `idx_thread_prefs_user_account`, `idx_thread_prefs_thread_id`

---

### `user_smtp_account`

**Purpose:** SMTP/IMAP email account credentials for users who do not use Gmail OAuth. Passwords stored encrypted. Sync tracked via IMAP UID watermarks. Added in migration `20251127000000_smtp_support.sql`.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | FK → auth.users(id) ON DELETE CASCADE |
| email_address | text | NO | — | |
| display_name | text | YES | — | |
| smtp_host | text | NO | — | |
| smtp_port | integer | NO | 587 | |
| smtp_username | text | NO | — | |
| smtp_password | text | NO | — | Encrypted |
| smtp_use_tls | boolean | NO | true | |
| imap_host | text | NO | — | |
| imap_port | integer | NO | 993 | |
| imap_username | text | NO | — | |
| imap_password | text | NO | — | Encrypted |
| imap_use_ssl | boolean | NO | true | |
| sync_in_progress | boolean | NO | false | |
| last_sync_uid | bigint | YES | — | IMAP UID watermark |
| last_sync_uidvalidity | bigint | YES | — | Detects mailbox rebuild |
| last_sync_timestamp | timestamptz | YES | — | |
| is_active | boolean | NO | true | |
| last_verified_at | timestamptz | YES | — | |
| verification_error | text | YES | — | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**Unique:** `uq_user_smtp_account_user_email` on `(user_id, email_address)`
**Indexes:** `idx_user_smtp_account_user_id`, `idx_user_smtp_account_email`, `idx_user_smtp_account_active`

---

### `smtp_message`

**Purpose:** IMAP-synced messages for SMTP accounts, parallel to `gmail_message`. Thread identity uses RFC 2822 `Message-ID` of the first message.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |
| user_id | uuid | NO | — | FK → auth.users(id) |
| smtp_account_id | uuid | NO | — | FK → user_smtp_account(id) |
| message_id_header | text | NO | — | RFC 2822 Message-ID |
| email_thread_id | text | NO | — | First message's Message-ID |
| in_reply_to_header | text | YES | — | |
| references_header | text | YES | — | |
| direction | text | NO | — | |
| sender_email | text | NO | — | |
| recipient_emails | text[] | NO | '{}' | |
| cc_emails | text[] | NO | '{}' | |
| bcc_emails | text[] | NO | '{}' | |
| subject | text | YES | — | |
| body_text | text | YES | — | |
| body_html | text | YES | — | |
| imap_uid | bigint | YES | — | |
| internal_date | timestamptz | NO | — | |

**Unique:** `idx_smtp_message_unique` on `(smtp_account_id, message_id_header)`
**Indexes:** `idx_smtp_message_thread`, `idx_smtp_message_account`, `idx_smtp_message_direction`, `idx_smtp_message_internal_date`

---

### `latest_smtp_message_per_thread`

**Purpose:** SMTP equivalent of `latest_gmail_message_per_thread`. Maintained by trigger.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| smtp_account_id | uuid | NO | — | FK → user_smtp_account(id) ON DELETE CASCADE |
| email_thread_id | text | NO | — | |
| smtp_message_id | uuid | NO | — | FK → smtp_message(id) ON DELETE CASCADE |
| internal_date | timestamptz | NO | — | |
| direction | text | NO | — | |

**PK:** `(smtp_account_id, email_thread_id)`

---

### `smtp_thread_state`

**Purpose:** Versioned state tracking for SMTP email threads, parallel to `gmail_thread_state`.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | FK → auth.users(id) ON DELETE CASCADE |
| smtp_account_id | uuid | NO | — | FK → user_smtp_account(id) ON DELETE CASCADE |
| email_thread_id | text | NO | — | |
| status | text | NO | 'READY_FOR_CAMPAIGN_ASSOCIATION' | |
| latest_smtp_message_id | uuid | YES | — | FK → smtp_message(id) ON DELETE SET NULL |
| latest_internal_date | timestamptz | NO | — | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**Unique:** `unique_smtp_thread_state_version` on `(user_id, smtp_account_id, email_thread_id, latest_internal_date)`
**Indexes:** `idx_smtp_thread_state_lookup`, `idx_smtp_thread_state_status`

---

### `product`

**Purpose:** Product catalog entries for the brand. Products can be associated with campaigns (now via `campaign_product` junction table). URL scraping was initially required but made optional.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | FK → auth.users(id) |
| name | text | NO | — | |
| description | text | NO | — | |
| url_to_scrape | text | YES | — | Made nullable in migration 13 |
| created_at | timestamptz | YES | now() | |

**Unique:** `(user_id, name)`
**Indexes:** `idx_product_user_id`

---

### `campaign`

**Purpose:** Core campaign entity. Represents an outreach campaign (gifting, paid promotion, etc.) with all its configuration: email templates, LLM instructions, follow-up settings, Google Sheet integration, and Slack/discovery settings.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | FK → auth.users(id) |
| product_id | uuid | YES | — | FK → product(id); nullable; superseded by campaign_product |
| name | text | NO | — | |
| campaign_type | text | NO | — | `'gifting'`, `'paid_promotion'`, `'other'` |
| subject_template | text | NO | — | |
| body_template | text | NO | — | |
| agent_name_for_llm | text | NO | '' | |
| rules_for_llm | text | NO | '' | |
| goal_for_llm | text | NO | '' | |
| frequently_asked_questions_for_llm | jsonb | YES | NULL | Converted from text in migration 16 |
| sample_emails_for_llm | jsonb | YES | NULL | Converted from text in migration 16 |
| is_follow_up_enabled | boolean | NO | false | |
| follow_up_gap_in_days | integer | NO | 3 | |
| max_follow_ups | integer | NO | 3 | |
| follow_up_templates | jsonb | YES | — | Added migration 33 |
| google_sheet_url | text | YES | — | |
| google_sheet_tab_name | text | YES | — | |
| google_sheet_data_instructions | text | YES | — | |
| google_sheet_columns_to_skip | text[] | YES | '{}' | |
| google_sheet_error | text | YES | — | Error type when sheet access fails |
| google_sheet_error_at | timestamptz | YES | — | |
| status | text | NO | 'active' | Added migration 10; NOT NULL migration 11 |
| is_external | boolean | NO | false | UI field |
| automation_level | text | YES | — | UI field |
| image_url | text | YES | — | UI field |
| is_lookalike_suggestions_enabled | boolean | NO | false | |
| draft_metadata | jsonb | YES | — | Temp form state before launch |
| slack_channel_id | text | YES | — | For order approval digests |
| discovery_enabled | boolean | NO | false | |
| discovery_config | jsonb | YES | — | `{seed_profiles, search_keywords, follower_min, follower_max, platform}` |
| post_tracking_enabled | boolean | NO | false | |
| post_opt_in_follow_up_enabled | boolean | NO | false | |
| post_opt_in_follow_up_body_template | text | YES | — | |
| post_opt_in_follow_up_delay_hours | integer | NO | 48 | |
| completed_at | timestamptz | YES | — | When campaign was closed |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

**PK:** `id`
**Indexes:**
- `idx_campaign_user_id` on `(user_id)`
- `idx_campaign_google_sheet_error` partial on `google_sheet_error IS NOT NULL`
- `idx_campaign_post_tracking_enabled` partial on `post_tracking_enabled = true`
- `idx_campaign_completed_at` partial on `completed_at IS NOT NULL`

**Note:** `email_signature` and `email_signature_enabled` columns were added in migration 37 and dropped in migration 43 after data was migrated to `email_signature` table.

---

### `campaign_recipient`

**Purpose:** The list of influencer/creator email contacts who will receive outreach for a campaign.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| campaign_id | uuid | NO | — | FK → campaign(id) |
| email | text | NO | — | |
| name | text | YES | — | Made nullable in migration 14 |
| custom_fields | jsonb | NO | '{}' | Added migration 10 |
| created_at | timestamptz | YES | now() | |

**Unique:** `(campaign_id, email)`
**Indexes:** `idx_campaign_recipient_campaign_id`, `idx_campaign_creator_campaign_id_email` on `(campaign_id, email)`, `idx_campaign_recipient_campaign_created` on `(campaign_id, created_at DESC)`

---

### `campaign_sender`

**Purpose:** Maps campaigns to sending email accounts (Gmail or SMTP). A campaign can have multiple senders.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| campaign_id | uuid | NO | — | FK → campaign(id) |
| gmail_account_id | uuid | YES | — | FK → user_gmail_account(id); nullable after SMTP added |
| smtp_account_id | uuid | YES | — | FK → user_smtp_account(id) |
| created_at | timestamptz | YES | now() | |

**Unique:** `(campaign_id, gmail_account_id)`, `uq_campaign_sender_smtp` on `(campaign_id, smtp_account_id)`
**Check:** `chk_campaign_sender_account_type`: exactly one of `gmail_account_id` / `smtp_account_id` must be set
**Indexes:** `idx_campaign_sender_campaign_id`, `idx_campaign_sender_gmail_account_id`, `idx_campaign_sender_smtp`

---

### `campaign_thread`

**Purpose:** Associates email threads with campaigns. A thread belongs to exactly one campaign. Supports both Gmail (`gmail_thread_id`) and SMTP (`email_thread_id`) thread IDs.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| campaign_id | uuid | NO | — | FK → campaign(id) |
| gmail_thread_id | text | YES | — | Nullable after SMTP support added |
| email_thread_id | text | YES | — | SMTP thread ID |
| associated_at | timestamptz | YES | now() | |

**Unique:** `campaign_thread_gmail_thread_id_key` on `(gmail_thread_id)` — one campaign per thread; `campaign_thread_email_thread_id_key` on `(email_thread_id)`
**Check:** `chk_campaign_thread_one_thread_id`: exactly one of `gmail_thread_id` / `email_thread_id` must be set
**Indexes:** `idx_campaign_thread_campaign_id`, `idx_campaign_thread_gmail_thread_id`, `idx_campaign_thread_email_thread_id`

---

### `campaign_outbox_queue`

**Purpose:** Queue of personalized outbound campaign emails waiting to be sent. Workers claim items by transitioning `pending → processing`, then mark `sent` or `failed`. The `'cancelled'` status was added to support campaign completion.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| campaign_id | uuid | NO | — | FK → campaign(id) ON DELETE CASCADE |
| campaign_recipient_id | uuid | NO | — | FK → campaign_recipient(id) ON DELETE CASCADE |
| campaign_sender_id | uuid | NO | — | FK → campaign_sender(id) ON DELETE CASCADE |
| subject | text | NO | — | Pre-personalized |
| body | text | NO | — | Pre-personalized |
| cc_emails | text[] | NO | '{}' | |
| status | text | NO | 'pending' | CHECK IN ('pending','processing','sent','failed','cancelled') |
| sent_at | timestamptz | YES | — | |
| gmail_thread_id | text | YES | — | Set after send |
| email_thread_id | text | YES | — | Universal thread ID (Gmail or SMTP) |
| error_message | text | YES | — | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | For crash recovery of stuck `processing` items |

**Unique:** `idx_campaign_outbox_queue_unique` on `(campaign_sender_id, campaign_recipient_id)` — one queue entry per sender+recipient pair
**Check:** `campaign_outbox_queue_status_check`
**Indexes:** `idx_campaign_outbox_queue_status`, `idx_campaign_outbox_queue_campaign_id`, `idx_campaign_outbox_queue_sender_status`, `idx_campaign_outbox_queue_created_at`, `idx_campaign_outbox_queue_campaign_sender_id`, `idx_campaign_outbox_queue_email_thread_id`, `idx_campaign_outbox_queue_gmail_thread_id`

---

### `campaign_follow_up_outbox_queue`

**Purpose:** Follow-up emails for initial outbound campaign messages. Each row is one follow-up in a numbered sequence, referencing the initial `campaign_outbox_queue` item.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| campaign_outbox_queue_id | uuid | NO | — | FK → campaign_outbox_queue(id) ON DELETE CASCADE |
| index | integer | NO | — | 0-indexed position in sequence |
| hours_since_last_email | integer | NO | — | Delay from previous email |
| scheduled_at | timestamptz | YES | — | NULL until initial sent |
| body | text | NO | — | No subject; continues thread |
| gmail_message_id | text | YES | — | After sending |
| email_message_id | text | YES | — | Universal message ID |
| status | text | NO | 'pending' | CHECK IN ('pending','processing','sent','failed','cancelled') |
| sent_at | timestamptz | YES | — | |
| error_message | text | YES | — | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**Unique:** `(campaign_outbox_queue_id, index)`
**Indexes:** `idx_follow_up_queue_scheduled` on `(scheduled_at, status)`, `idx_follow_up_queue_outbox`

---

### `campaign_workflow`

**Purpose:** AI workflow definitions scoped to a campaign. Each workflow specifies Claude instructions, available tool slugs, and optional structured output schema. Triggered per email thread.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| campaign_id | uuid | NO | — | FK → campaign(id) ON DELETE CASCADE |
| name | text | NO | — | |
| instructions | text | NO | — | Claude system prompt |
| tool_slugs | jsonb | NO | '[]' | Array of tool identifiers |
| config | jsonb | NO | '{}' | |
| output_schema | jsonb | YES | — | JSON Schema for structured output; NULL = unstructured text |
| is_enabled | boolean | NO | true | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**Indexes:** `idx_campaign_workflow_campaign_id`, `idx_campaign_workflow_campaign_id_enabled`

---

### `campaign_workflow_execution`

**Purpose:** Append-only execution history for campaign workflow runs. Multiple rows per (thread, workflow) pair; query with `ORDER BY executed_at DESC LIMIT 1` for latest result.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| gmail_thread_state_id | uuid | YES | — | FK → gmail_thread_state(id) ON DELETE CASCADE; nullable for API-triggered |
| workflow_id | uuid | NO | — | FK → campaign_workflow(id) ON DELETE CASCADE |
| campaign_id | uuid | NO | — | FK → campaign(id) ON DELETE CASCADE |
| temporal_workflow_id | text | YES | — | |
| temporal_run_id | text | YES | — | |
| temporal_activity_id | text | YES | — | |
| output_data | jsonb | YES | — | |
| raw_response | text | YES | — | |
| status | text | NO | — | |
| error_message | text | YES | — | |
| executed_at | timestamptz | NO | now() | |
| execution_duration_ms | integer | YES | — | |
| created_at | timestamptz | NO | now() | |

**Indexes:** `idx_workflow_execution_thread`, `idx_workflow_execution_workflow`, `idx_workflow_execution_campaign`, `idx_workflow_execution_thread_workflow_time`, `idx_workflow_execution_temporal`

---

### `campaign_rule_suggestion_analytics`

**Purpose:** Tracks AI rule suggestions presented to users — whether accepted/edited, what the final rule was. Used to measure and improve the "Rewrite with AI" feature.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| campaign_id | uuid | NO | — | FK → campaign(id) |
| gmail_account_id | uuid | NO | — | FK → user_gmail_account(id) |
| gmail_thread_id | text | NO | — | |
| action | text | YES | 'accepted' | |
| rule_original | text | NO | — | |
| rule_final | text | NO | — | |
| was_edited | boolean | NO | false | |
| custom_instructions | text | YES | — | User's custom input for AI rewrite |
| created_at | timestamptz | YES | now() | |

**Indexes:** `idx_campaign_rule_suggestion_analytics_campaign_id`, `idx_campaign_rule_suggestion_analytics_gmail_account_id`

---

### `campaign_csv`

**Purpose:** Tracks CSV files uploaded by users for bulk recipient import. Preview stored as JSONB; actual file in Supabase Storage.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | FK → auth.users(id) |
| campaign_id | uuid | NO | — | FK → campaign(id) |
| original_filename | text | YES | — | |
| preview | jsonb | NO | — | First N rows |
| storage_key | text | NO | — | Supabase Storage path |
| created_at | timestamptz | YES | now() | |

---

### `campaign_creator`

**Purpose:** Represents an influencer/creator entity within a campaign. Richer than `campaign_recipient` — includes gifting workflow state, paid promotion status, post tracking, talent manager info, notes history, Slack and Shopify integration fields, and enrichment status.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| campaign_id | uuid | NO | — | FK → campaign(id) |
| email | text | YES | — | |
| name | text | YES | — | |
| social_media_handles | jsonb | NO | '[]' | |
| gifting_status | text | YES | — | Gifting campaign field |
| gifting_address | text | YES | — | |
| gifting_discount_code | text | YES | — | |
| paid_promotion_status | text | YES | — | e.g. NEW, NEGOTIATING, POSTED, PAID... |
| paid_promotion_rate | text | YES | — | e.g. "$500 flat" |
| notes_history | jsonb | NO | '[]' | Max 3 notes: `[{content, generated_at, is_manual, source}]` |
| source_gmail_thread_id | text | YES | — | Origin thread |
| role | text | NO | 'unknown' | creator, talent_manager, agency_staff, internal, unknown |
| talent_manager_name | text | YES | — | |
| talent_manager_email | text | YES | — | |
| talent_agency | text | YES | — | |
| confidence_score | float | NO | 0.0 | LLM extraction confidence (0.0–1.0) |
| manually_verified | boolean | NO | false | |
| post_tracking_started_at | timestamptz | YES | — | |
| post_tracking_ends_at | timestamptz | YES | — | started_at + 90 days |
| post_last_checked_at | timestamptz | YES | — | |
| last_seen_post_id | text | YES | — | Instagram post ID watermark |
| latest_interaction_at | timestamptz | YES | — | Most recent email interaction |
| latest_interaction_campaign_id | uuid | YES | — | FK → campaign(id) ON DELETE SET NULL |
| slack_digest_message_ts | text | YES | — | |
| slack_approval_status | text | YES | — | pending, approved, skipped |
| shopify_order_id | text | YES | — | |
| post_opt_in_follow_up_status | text | YES | — | |
| post_opt_in_follow_up_scheduled_at | timestamptz | YES | — | |
| post_opt_in_follow_up_delay_hours_at_schedule | integer | YES | — | Snapshot of delay at scheduling time |
| enrichment_status | text | YES | NULL | pending, enriching, enriched, no_email_found |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |

**Indexes:**
- `idx_campaign_creator_role` on `(campaign_id, role)`
- `idx_campaign_creator_source_thread` on `(source_gmail_thread_id)`
- `idx_campaign_creator_has_notes` partial on `(notes_history != '[]')`
- `idx_campaign_creator_email` on `(email)`
- `idx_campaign_creator_campaign_id_email` on `(campaign_id, email)`
- `idx_campaign_creator_tracking` partial on `post_tracking_ends_at IS NOT NULL`
- `idx_campaign_creator_campaign_created` on `(campaign_id, created_at DESC)`
- `idx_campaign_creator_campaign_id_lower_name` on `(campaign_id, lower(name))`
- `idx_cc_post_opt_in_follow_up_pending` partial on `(post_opt_in_follow_up_scheduled_at)` WHERE status = 'PENDING'

---

### `campaign_lookalike_suggestion`

**Purpose:** Stores lookalike creator suggestions generated by Apify actor. Seeded by a `campaign_creator` (the "seed creator"), lists similar creators for user review/acceptance.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| campaign_id | uuid | NO | — | FK → campaign(id) ON DELETE CASCADE |
| seed_creator_id | uuid | NO | — | FK → campaign_creator(id) ON DELETE CASCADE |
| seed_platform_handle | text | NO | — | Renamed from seed_instagram_handle |
| platform | text | NO | 'instagram' | Added migration 45 |
| suggested_username | text | NO | — | |
| suggested_full_name | text | YES | — | |
| suggested_biography | text | YES | — | |
| suggested_follower_count | integer | NO | 0 | |
| suggested_profile_pic_url | text | YES | — | |
| suggested_is_verified | boolean | NO | false | |
| suggested_external_url | text | YES | — | |
| suggested_category | text | YES | — | |
| suggested_email | text | YES | — | Public email from Apify |
| apify_run_id | text | NO | — | |
| similarity_score | numeric(5,2) | YES | — | |
| status | text | NO | 'pending' | pending, accepted, rejected |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**Unique:** `campaign_lookalike_suggestion_campaign_platform_username_key` on `(campaign_id, platform, suggested_username)`
**Indexes:** `idx_lookalike_suggestion_campaign_id`, `idx_lookalike_suggestion_seed_creator_id`, `idx_lookalike_suggestion_status`, `idx_lookalike_suggestion_username`, `idx_lookalike_suggestion_email_not_null` (partial), `idx_campaign_lookalike_suggestion_platform`

---

### `email_reply_example`

**Purpose:** Training data for RAG-based draft generation. Stores (inbound email, human reply) pairs with pgvector embeddings for cosine similarity search. Used to generate in-style draft replies.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| thread_id | text | NO | — | |
| campaign_id | uuid | NO | — | FK → campaign(id) ON DELETE CASCADE |
| thread_summary | text | NO | — | LLM-generated context |
| inbound_email_text | text | NO | — | The email being replied to |
| embedding | vector(1536) | YES | — | pgvector embedding of (summary + inbound) |
| sent_reply_text | text | NO | — | The human-written reply |
| sanitized_reply_text | text | YES | — | Reply with creator-specific details replaced by placeholders |
| reply_summary | text | YES | — | Brief label: "brief acceptance", "brief decline", etc. |
| created_at | timestamptz | NO | now() | |

**Unique:** `idx_email_reply_example_unique_pair` on `(campaign_id, thread_id, md5(inbound_email_text), md5(sent_reply_text))`
**Indexes:**
- `idx_email_reply_example_embedding` HNSW using `vector_cosine_ops`
- `idx_email_reply_example_campaign` on `(campaign_id)`
- `idx_email_reply_example_thread` on `(thread_id)`

---

### `email_dispatch_queue`

**Purpose:** Generic scheduled email delivery queue for deferred sending (follow-ups, timed outreach). Supports both Gmail and SMTP accounts.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | FK → auth.users(id) ON DELETE CASCADE |
| gmail_account_id | uuid | YES | — | FK → user_gmail_account(id) ON DELETE CASCADE |
| smtp_account_id | uuid | YES | — | FK → user_smtp_account(id) ON DELETE CASCADE |
| recipient_email | text | NO | — | |
| recipient_name | text | YES | — | |
| cc_emails | text[] | YES | — | |
| bcc_emails | text[] | YES | — | |
| subject | text | NO | — | |
| body_text | text | YES | — | |
| body_html | text | YES | — | |
| in_reply_to_message_id | text | YES | — | Threading |
| references_header | text | YES | — | |
| gmail_thread_id | text | YES | — | |
| dispatch_at | timestamptz | NO | — | When to send |
| user_timezone | text | NO | 'UTC' | |
| status | email_dispatch_status | NO | 'pending' | ENUM: pending, processing, sent, failed, cancelled |
| sent_at | timestamptz | YES | — | |
| gmail_message_id | text | YES | — | After send |
| smtp_message_id | text | YES | — | After send |
| error_message | text | YES | — | |
| retry_count | integer | NO | 0 | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**Check:**
- `email_dispatch_queue_account_check`: exactly one of gmail/smtp account set
- `email_dispatch_queue_body_check`: at least one of body_text/body_html set
**Indexes:** `idx_email_dispatch_queue_ready`, `idx_email_dispatch_queue_user`, `idx_email_dispatch_queue_gmail_account`, `idx_email_dispatch_queue_smtp_account`

---

### `email_signature`

**Purpose:** Reusable email signatures. Can be user-level (campaign_id IS NULL) or campaign-specific (campaign_id IS NOT NULL). Only one default per user; only one signature per campaign.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | FK → auth.users(id) ON DELETE CASCADE |
| name | varchar(255) | NO | — | |
| content | text | NO | — | HTML signature content |
| is_default | boolean | NO | false | |
| campaign_id | uuid | YES | — | FK → campaign(id) ON DELETE CASCADE |
| is_enabled | boolean | NO | false | For campaign signatures |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**Unique:** `idx_email_signature_user_default` partial on `(user_id)` WHERE `is_default = true`; `idx_email_signature_campaign_unique` on `(campaign_id)` WHERE `campaign_id IS NOT NULL`
**Indexes:** `idx_email_signature_user_id`, `idx_email_signature_campaign_id`

---

### `user_setting`

**Purpose:** Placeholder user settings row. Currently just a marker (created at first login). No configuration columns as of latest migration.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| user_id | uuid | NO | — | PK, FK → auth.users(id) |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

---

### `user_onboarding`

**Purpose:** Tracks user onboarding survey responses and completion state. Used by webapp middleware to redirect new users through onboarding flow.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| user_id | uuid | NO | — | PK, FK → auth.users(id) ON DELETE CASCADE |
| user_role | text | YES | — | brand-agency, creator-agency, creator, sales, other |
| referral_source | text | YES | — | google, social-media, friend, linkedin, other |
| referral_other_text | text | YES | — | |
| onboarding_completed | boolean | NO | false | |
| completed_at | timestamptz | YES | — | |
| setup_checklist_completed | boolean | YES | false | |
| setup_checklist_completed_at | timestamptz | YES | — | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

---

### `creator`

**Purpose:** Global, platform-agnostic creator profile registry. Not user-scoped — all authenticated users can read. Backend writes only (service role). Tracks profile data, follower count, keywords, and historical snapshots.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| platform | text | NO | — | e.g. 'instagram', 'youtube' |
| handle | text | NO | — | Username on platform |
| email | text | YES | — | |
| follower_count | integer | NO | 0 | |
| is_verified | boolean | NO | false | |
| location | text | YES | — | |
| keywords | text[] | NO | '{}' | |
| profile_data | jsonb | NO | '{}' | Platform-specific data blob |
| snapshots | jsonb | NO | '[]' | Historical profile snapshots |
| profile_image_path | text | YES | — | Supabase Storage path |
| profile_image_etag | text | YES | — | CDN ETag for deduplication |
| first_seen_at | timestamptz | NO | now() | |
| last_updated_at | timestamptz | NO | now() | |
| source | text | YES | — | Where found (apify, enrichment, etc.) |

**Unique:** `creator_platform_handle_unique` on `(platform, handle)`
**Indexes:** `idx_creator_platform`, `idx_creator_email` (partial, not null), `idx_creator_follower_count`, `idx_creator_is_verified` (partial, verified only), `idx_creator_location` (partial), `idx_creator_keywords` GIN, `idx_creator_last_updated_at`, `idx_creator_first_seen_at`

---

### `creator_enrichment_attempt`

**Purpose:** Tracks email enrichment attempts per creator with timestamps for 15-day cooldown enforcement.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| creator_id | uuid | NO | — | FK → creator(id) ON DELETE CASCADE |
| platform | text | NO | — | |
| status | text | NO | — | success, no_email_found, failed |
| email_found | text | YES | — | |
| source | text | YES | — | apify, bio_crawl, influencer_club |
| attempted_at | timestamptz | NO | now() | |

**Indexes:** `idx_enrichment_attempt_creator_id`, `idx_enrichment_attempt_creator_status` on `(creator_id, attempted_at DESC)`

---

### `creator_list`

**Purpose:** User-defined lists for organizing creators before adding them to campaigns. Supports search and bookmarking of `creator` table records.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | FK → auth.users(id) ON DELETE CASCADE |
| title | varchar(255) | NO | — | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**Note:** `auto_enrich` and `enrichment_status` columns were added (migration `20260216120001`) and removed (migration `20260220110000`).
**Indexes:** `idx_creator_list_user_id`

---

### `creator_list_item`

**Purpose:** Many-to-many join table between `creator_list` and `creator`.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| list_id | uuid | NO | — | FK → creator_list(id) ON DELETE CASCADE |
| creator_id | uuid | NO | — | FK → creator(id) ON DELETE CASCADE |
| created_at | timestamptz | NO | now() | |

**Unique:** `(list_id, creator_id)`
**Indexes:** `idx_creator_list_item_list_id`, `idx_creator_list_item_creator_id`

---

### `creator_post`

**Purpose:** Instagram posts detected from opted-in campaign creators. Supports post tracking workflow that monitors creator content after opt-in.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| campaign_id | uuid | NO | — | FK → campaign(id) ON DELETE CASCADE |
| campaign_creator_id | uuid | NO | — | FK → campaign_creator(id) ON DELETE CASCADE |
| instagram_post_id | text | NO | — | Native Instagram ID |
| post_type | text | NO | — | CHECK IN ('post', 'story', 'reel') |
| post_url | text | NO | — | |
| caption | text | YES | — | |
| media_urls | jsonb | YES | '[]' | |
| media_storage_path | text | YES | — | Permanent Supabase Storage copy |
| thumbnail_url | text | YES | — | |
| like_count | integer | YES | 0 | |
| view_count | integer | YES | — | |
| comment_count | integer | YES | 0 | |
| posted_at | timestamptz | YES | — | |
| matched_at | timestamptz | NO | now() | |
| match_method | text | NO | — | CHECK IN ('caption', 'llm') |
| match_reason | text | YES | — | |
| created_at | timestamptz | NO | now() | |

**Unique:** `unique_post_per_creator` on `(campaign_creator_id, instagram_post_id)`
**Indexes:** `idx_creator_post_campaign` on `(campaign_id, matched_at DESC)`, `idx_creator_post_creator`

---

### `campaign_product`

**Purpose:** Many-to-many junction table linking campaigns to products. Created in migration `20260220010000` to replace the single `campaign.product_id` FK.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() | PK |
| campaign_id | uuid | NO | — | FK → campaign(id) ON DELETE CASCADE |
| product_id | uuid | NO | — | FK → product(id) |
| created_at | timestamptz | YES | now() |

**Unique:** `(campaign_id, product_id)`
**Indexes:** `idx_campaign_product_campaign_id`

---

### `team`

**Purpose:** A team owned by a user. Team members can be granted access to specific campaigns.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() | PK |
| name | text | NO | — | |
| owner_user_id | uuid | NO | — | FK → auth.users(id) ON DELETE CASCADE |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

**Indexes:** `idx_team_owner_user_id`

---

### `team_member`

**Purpose:** Membership roster for teams. The team owner is also added as a member with `role='owner'`.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() | PK |
| team_id | uuid | NO | — | FK → team(id) ON DELETE CASCADE |
| user_id | uuid | NO | — | FK → auth.users(id) ON DELETE CASCADE |
| role | text | NO | 'member' | CHECK IN ('owner', 'member') |
| created_at | timestamptz | NO | now() |

**Unique:** `(team_id, user_id)`
**Indexes:** `idx_team_member_team_id`, `idx_team_member_user_id`

---

### `campaign_member_assignment`

**Purpose:** Assigns specific campaigns to team members for shared access. Campaign ownership stays with `campaign.user_id`; this table grants view/edit rights to assignees.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() | PK |
| campaign_id | uuid | NO | — | FK → campaign(id) ON DELETE CASCADE |
| user_id | uuid | NO | — | FK → auth.users(id) ON DELETE CASCADE |
| created_at | timestamptz | NO | now() |

**Unique:** `(campaign_id, user_id)`
**Indexes:** `idx_campaign_member_assignment_user_campaign`, `idx_campaign_member_assignment_campaign`

---

### `thread_flag`

**Purpose:** LLM-extracted flags per email thread indicating special conditions: creator wants paid promotion, has questions, or has issues. One row per thread.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() | PK |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |
| gmail_thread_id | text | YES | — |
| email_thread_id | text | YES | — |
| wants_paid | boolean | NO | false |
| has_question | boolean | NO | false |
| has_issue | boolean | NO | false |
| wants_paid_reason | text | YES | — |
| has_question_reason | text | YES | — |
| has_issue_reason | text | YES | — |
| source_message_id | uuid | YES | — |

**Check:** `chk_thread_flag_one_thread_id`
**Unique:** `uq_thread_flag_gmail`, `uq_thread_flag_email`
**Indexes:** `idx_thread_flag_gmail`, `idx_thread_flag_email`

---

### `discord_workflow`

**Purpose:** Defines AI workflow bots for Discord. Each workflow has instructions, tools, interaction mode (autonomous/interactive/hybrid), and trigger type (ambient=any message, active=bot mention required).

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| name | text | NO | — | UNIQUE (added migration 35) |
| instructions | text | NO | — | Claude system prompt |
| tool_slugs | jsonb | NO | '[]' | |
| config | jsonb | NO | '{}' | e.g. `{"model": "...", "temperature": 0.7}` |
| output_schema | jsonb | YES | — | |
| interaction_mode | text | NO | 'autonomous' | CHECK IN ('autonomous','interactive','hybrid') |
| trigger_type | varchar(50) | NO | 'ambient' | CHECK IN ('ambient','active') |
| is_enabled | boolean | NO | true | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**Check:** `discord_workflow_name_length`, `discord_workflow_instructions_not_empty`, `discord_workflow_interaction_mode_valid`, `discord_workflow_trigger_type_valid`
**Indexes:** `idx_discord_workflow_enabled` (partial), `idx_discord_workflow_trigger_enabled` (partial)

---

### `discord_workflow_scope`

**Purpose:** Maps Discord workflows to specific servers/channels (or globally if server_id/channel_id are NULL).

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() | PK |
| workflow_id | uuid | NO | — | FK → discord_workflow(id) ON DELETE CASCADE |
| server_id | bigint | YES | — | |
| channel_id | bigint | YES | — | |
| is_enabled | boolean | NO | true | |
| created_at | timestamptz | NO | now() |

**Unique:** `discord_workflow_scope_unique` on `(workflow_id, server_id, channel_id)`
**Indexes:** `idx_discord_workflow_scope_lookup`, `idx_discord_workflow_scope_workflow`

---

### `discord_workflow_execution`

**Purpose:** Append-only execution log for Discord workflow runs.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| workflow_id | uuid | NO | — | FK → discord_workflow(id) ON DELETE CASCADE |
| server_id | bigint | YES | — | |
| channel_id | bigint | NO | — | |
| thread_id | bigint | YES | — | |
| message_id | bigint | NO | — | |
| user_id | bigint | NO | — | Discord user ID |
| temporal_workflow_id | text | YES | — | |
| temporal_run_id | text | YES | — | |
| temporal_activity_id | text | YES | — | |
| output_data | jsonb | YES | — | |
| raw_response | text | YES | — | |
| tool_calls | jsonb | YES | — | |
| status | text | NO | — | CHECK IN ('completed','error','schema_validation_failed') |
| error_message | text | YES | — | |
| executed_at | timestamptz | NO | now() | |
| execution_duration_ms | integer | YES | — | |
| created_at | timestamptz | NO | now() | |

**Indexes:** `idx_discord_workflow_execution_workflow_time`, `idx_discord_workflow_execution_message`, `idx_discord_workflow_execution_channel_time`, `idx_discord_workflow_execution_thread_time` (partial), `idx_discord_workflow_execution_temporal`

---

### `discord_thread_sessions`

**Purpose:** Tracks persistent Claude Agent SDK session state per Discord thread. Stripped down significantly from original design — no longer tracks session IDs, expiry, or status. Now a simple record of which Discord thread is in an interactive session with a pending tool call.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| thread_id | bigint | NO | — | UNIQUE; Discord thread ID |
| server_id | bigint | YES | — | |
| channel_id | bigint | NO | — | |
| user_id | bigint | NO | — | |
| pending_tool_name | text | YES | — | |
| pending_tool_input | jsonb | YES | — | |
| pending_message_id | bigint | YES | — | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | Renamed from last_interaction_at |

**Indexes:** `idx_discord_thread_sessions_thread`, `idx_discord_thread_sessions_user`, `idx_discord_thread_sessions_expiry` (partial — was for active sessions)

---

### `discord_channel_mapping`

**Purpose:** Maps client-facing Discord channels to internal response channels.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() | PK |
| client_channel_id | bigint | NO | — | UNIQUE |
| internal_channel_id | bigint | NO | — | |
| server_id | bigint | NO | — | |
| is_enabled | boolean | NO | true | |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

**Indexes:** `idx_discord_channel_mapping_client` (partial)

---

### `session_templates`

**Purpose:** Templates for launching pre-configured development/demo sessions from Discord. Simplified in migration `20260107` to reference a Fly.io app name instead of inline image/service config.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| slug | text | NO | — | UNIQUE |
| name | text | NO | — | |
| description | text | YES | — | |
| fly_app | text | NO | — | Fly.io app name (replaces image_ref + services) |
| features | text[] | YES | '{}' | |
| source_repos | text[] | YES | '{}' | |
| framework | text | YES | — | |
| created_by_discord_id | text | YES | — | |
| created_by_discord_name | text | YES | — | |
| is_public | boolean | YES | false | |
| created_at | timestamptz | YES | now() | |
| updated_at | timestamptz | YES | now() | |
| last_launched_at | timestamptz | YES | — | |
| launch_count | integer | YES | 0 | |

**Indexes:** `idx_session_templates_slug`, `idx_session_templates_public`, `idx_session_templates_created_by`, `idx_session_templates_fly_app`

---

### `n8n_workflows`

**Purpose:** Configuration for n8n webhook workflows that appear as tools to Claude. Slug must follow `CUSTOM_N8N_*` pattern.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| name | varchar(255) | NO | — | UNIQUE |
| slug | varchar(255) | NO | — | UNIQUE; CHECK `^CUSTOM_N8N_[A-Z_]+$` |
| description | text | NO | — | |
| webhook_url | text | NO | — | |
| webhook_method | varchar(10) | NO | 'POST' | CHECK IN ('POST','GET') |
| auth_type | varchar(50) | YES | — | CHECK IN ('bearer','api_key','none') |
| auth_value | text | YES | — | Plaintext token (TODO: encrypt) |
| input_schema | jsonb | YES | — | Custom JSON Schema for tool inputs |
| timeout_seconds | integer | NO | 30 | CHECK > 0 AND <= 300 |
| enabled | boolean | NO | true | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**Indexes:** `idx_n8n_workflows_enabled` (partial), `idx_n8n_workflows_slug` (partial)

---

### `thread_tool_contexts`

**Purpose:** Persists tool selections per Discord thread for conversation continuity across interactions.

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | serial | NO | — | PK |
| thread_id | text | NO | — | UNIQUE |
| tool_slugs | text[] | NO | '{}' |
| session_uuid | text | NO | — |
| user_id | text | NO | — |
| channel_id | text | NO | — |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | — |

**Indexes:** `idx_thread_tool_contexts_thread_id`

---

### `clarify_meetings`

**Purpose:** Meeting transcripts and summaries from Clarify integration (replaced Bluedot in migration 20260213). Used by the Discord Clarify Meeting Assistant workflow.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| meeting_id | text | NO | — | UNIQUE |
| recording_id | text | YES | — | |
| title | text | YES | — | |
| attendees | jsonb | YES | '[]' | |
| duration | numeric | YES | — | |
| meeting_date | timestamptz | YES | — | |
| transcript | jsonb | YES | — | |
| has_transcript | boolean | NO | false | |
| summary | text | YES | — | |
| has_summary | boolean | NO | false | |
| raw_payload | jsonb | YES | — | |
| source | text | NO | 'webhook' | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

**Indexes:** `idx_clarify_meetings_meeting_id`, `idx_clarify_meetings_date`

---

### `debug_upload`

**Purpose:** Tracks debug file uploads (CSVs, bulk operations) referencing the private `debug-uploads` storage bucket.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | PK |
| user_id | uuid | NO | — | FK → auth.users(id) ON DELETE CASCADE |
| upload_context | text | NO | — | e.g. 'campaign_creators_csv' |
| original_filename | text | NO | — | |
| file_size_bytes | integer | NO | — | |
| file_type | text | YES | — | |
| storage_key | text | NO | — | |
| campaign_id | uuid | YES | — | FK → campaign(id) ON DELETE SET NULL |
| extra_metadata | jsonb | YES | — | |
| created_at | timestamptz | NO | now() | |

**Indexes:** `idx_debug_upload_user_id`, `idx_debug_upload_upload_context`, `idx_debug_upload_created_at`

---

### `channel_sessions` (legacy)

**Purpose:** Legacy Discord channel session tracking (predates migration system). Used by `src/` legacy code.

| Column | Type | Notes |
|--------|------|-------|
| channel_id | bigint | PK |
| session_id | text | |
| created_at | timestamptz | |
| last_message_at | timestamptz | |

---

### `thread_sessions` (legacy)

**Purpose:** Legacy Discord thread session tracking.

| Column | Type | Notes |
|--------|------|-------|
| id | integer GENERATED | PK |
| thread_id | bigint | UNIQUE |
| session_id | text | |
| user_id | bigint | |
| created_at | timestamptz | |
| last_message_at | timestamptz | |
| langfuse_trace_id | text | |
| langfuse_observation_id | text | |

---

## 3. RLS Policy Inventory

### `user_gmail_account`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own gmail accounts" | SELECT | `auth.uid() = user_id` |
| "Team members can view gmail accounts via campaign assignment" | SELECT | Added then DROPPED in `20260217100003`; credentials now fetched via service role only |

---

### `gmail_message`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own gmail messages" | SELECT | `auth.uid() = user_id` |

---

### `latest_gmail_message_per_thread`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own thread latest messages" | SELECT | EXISTS (SELECT 1 FROM gmail_message WHERE id = latest_gmail_message_per_thread.gmail_message_id AND user_id = auth.uid()) |

---

### `email_attachment`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own email attachments" | SELECT | EXISTS (SELECT 1 FROM gmail_message WHERE id = email_attachment.gmail_message_id AND user_id = auth.uid()) |

---

### `email_attachment_llm_extracted_content`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own attachment extracted content" | SELECT | EXISTS (JOIN gmail_message through email_attachment where user_id = auth.uid()) |

---

### `gmail_thread_state`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own thread states" | SELECT | `auth.uid() = user_id` |

---

### `gmail_thread_llm_draft`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own llm drafts" | SELECT | `auth.uid() = user_id` |

---

### `gmail_thread_ui_draft`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own ui drafts" | SELECT | `auth.uid() = user_id` |

---

### `gmail_thread_state_follow_up_schedule`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own follow up schedules" | SELECT | EXISTS (SELECT 1 FROM gmail_thread_state WHERE id = ... AND user_id = auth.uid()) |

---

### `gmail_thread_user_preferences`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own thread preferences" | SELECT | `auth.uid() = user_id` |
| "Users can insert own thread preferences" | INSERT | `auth.uid() = user_id` |
| "Users can update own thread preferences" | UPDATE | `auth.uid() = user_id` |
| "Users can delete own thread preferences" | DELETE | `auth.uid() = user_id` |

---

### `user_smtp_account`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own smtp accounts" | SELECT | `auth.uid() = user_id` |
| "Users can insert own smtp accounts" | INSERT | `auth.uid() = user_id` |
| "Users can update own smtp accounts" | UPDATE | `auth.uid() = user_id` |
| "Users can delete own smtp accounts" | DELETE | `auth.uid() = user_id` |

---

### `product`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own products" | SELECT | `auth.uid() = user_id` |
| "Users can insert own products" | INSERT | `auth.uid() = user_id` |
| "Users can update own products" | UPDATE | `auth.uid() = user_id` |
| "Users can delete own products" | DELETE | `auth.uid() = user_id` |

---

### `campaign`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own or assigned campaigns" | SELECT | `auth.uid() = user_id` OR EXISTS in `campaign_member_assignment` |
| "Users can insert own campaigns" | INSERT | `auth.uid() = user_id` |
| "Users can update own campaigns" | UPDATE | `auth.uid() = user_id` |
| "Users can delete own campaigns" | DELETE | `auth.uid() = user_id` |

**Note:** SELECT policy was widened in `20260210000000_team_campaign_assignment.sql` to include assigned team members.

---

### `campaign_recipient`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own or assigned campaign recipients" | SELECT | `can_access_campaign(campaign_id)` |
| "Users can insert own or assigned campaign recipients" | INSERT | `can_access_campaign(campaign_id)` |
| "Users can update own or assigned campaign recipients" | UPDATE | `can_access_campaign(campaign_id)` |
| "Users can delete own or assigned campaign recipients" | DELETE | `can_access_campaign(campaign_id)` |

---

### `campaign_sender`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own or assigned campaign senders" | SELECT | `can_access_campaign(campaign_id)` |
| "Users can insert own campaign senders" | INSERT | EXISTS campaign with user_id = auth.uid() |
| "Users can update own campaign senders" | UPDATE | EXISTS campaign with user_id = auth.uid() |
| "Users can delete own campaign senders" | DELETE | EXISTS campaign with user_id = auth.uid() |

---

### `campaign_thread`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own or assigned campaign threads" | SELECT | `can_access_campaign(campaign_id)` |
| "Users can insert own campaign threads" | INSERT | EXISTS campaign with user_id = auth.uid() |
| "Users can update own campaign threads" | UPDATE | EXISTS campaign with user_id = auth.uid() |
| "Users can delete own campaign threads" | DELETE | EXISTS campaign with user_id = auth.uid() |

---

### `campaign_outbox_queue`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own or assigned campaign queue" | SELECT | `can_access_campaign(campaign_id)` |

Backend manages writes via service role.

---

### `campaign_follow_up_outbox_queue`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own or assigned campaign follow-ups" | SELECT | `can_access_campaign` via campaign_outbox_queue join |
| "Users can insert their own campaign follow-ups" | INSERT | EXISTS join through campaign_outbox_queue |
| "Users can update their own campaign follow-ups" | UPDATE | EXISTS join through campaign_outbox_queue |
| "Users can delete their own campaign follow-ups" | DELETE | EXISTS join through campaign_outbox_queue |

---

### `campaign_workflow`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own or assigned campaign workflows" | SELECT | `can_access_campaign(campaign_id)` |
| "campaign_workflow_insert_own" | INSERT | EXISTS campaign with user_id = auth.uid() |
| "campaign_workflow_update_own" | UPDATE | EXISTS campaign with user_id = auth.uid() |
| "campaign_workflow_delete_own" | DELETE | EXISTS campaign with user_id = auth.uid() |

---

### `campaign_workflow_execution`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own or assigned campaign workflow executions" | SELECT | `can_access_campaign(campaign_id)` |

---

### `campaign_rule_suggestion_analytics`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own or assigned campaign analytics" | SELECT | `can_access_campaign(campaign_id)` |
| Insert/Update/Delete | — | EXISTS campaign with user_id = auth.uid() |

---

### `campaign_csv`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own campaign csvs" | SELECT | `auth.uid() = user_id` |
| "Users can insert own campaign csvs" | INSERT | `auth.uid() = user_id` |
| "Users can update own campaign csvs" | UPDATE | `auth.uid() = user_id` |
| "Users can delete own campaign csvs" | DELETE | `auth.uid() = user_id` |

---

### `campaign_lookalike_suggestion`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own or assigned campaign suggestions" | SELECT | `can_access_campaign(campaign_id)` |
| "Users can insert own or assigned campaign suggestions" | INSERT | `can_access_campaign(campaign_id)` |
| "Users can update own or assigned campaign suggestions" | UPDATE | `can_access_campaign(campaign_id)` |

---

### `email_reply_example`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own or assigned email reply examples" | SELECT | `can_access_campaign(campaign_id)` |
| `email_reply_example_insert_own` | INSERT | EXISTS campaign with user_id = auth.uid() |
| `email_reply_example_delete_own` | DELETE | EXISTS campaign with user_id = auth.uid() |

---

### `email_dispatch_queue`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own dispatches" | SELECT | `user_id = auth.uid()` |
| "Users can insert own dispatches" | INSERT | `user_id = auth.uid()` |
| "Users can update own dispatches" | UPDATE | `user_id = auth.uid()` |
| "Users can delete own dispatches" | DELETE | `user_id = auth.uid()` |

---

### `email_signature`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own signatures" | SELECT | `auth.uid() = user_id` |
| "Users can create own signatures" | INSERT | `auth.uid() = user_id` |
| "Users can update own signatures" | UPDATE | `auth.uid() = user_id` |
| "Users can delete own signatures" | DELETE | `auth.uid() = user_id` |
| "Service role can manage signatures" | ALL | `true` (service_role only) |

---

### `user_setting`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own settings" | SELECT | `auth.uid() = user_id` |

---

### `user_onboarding`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own onboarding" | SELECT | `auth.uid() = user_id` |

INSERT/UPDATE handled by backend via service role.

---

### `creator`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view all creators" | SELECT | `true` (any authenticated user) |
| "Service role can manage creators" | ALL | `true` (service_role only) |

---

### `creator_enrichment_attempt`

| Policy | Type | Expression |
|--------|------|------------|
| "Service role can manage enrichment attempts" | ALL | `true` (service_role only) |
| "Users can view enrichment attempts" | SELECT | `true` (any authenticated user) |

---

### `creator_list`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view own creator lists" | SELECT | `auth.uid() = user_id` |
| "Users can create own creator lists" | INSERT | `auth.uid() = user_id` |
| "Users can update own creator lists" | UPDATE | `auth.uid() = user_id` |
| "Users can delete own creator lists" | DELETE | `auth.uid() = user_id` |
| "Service role can manage creator lists" | ALL | `true` |

---

### `creator_list_item`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view items in own lists" | SELECT | EXISTS (creator_list where user_id = auth.uid()) |
| "Users can add items to own lists" | INSERT | EXISTS (creator_list where user_id = auth.uid()) |
| "Users can remove items from own lists" | DELETE | EXISTS (creator_list where user_id = auth.uid()) |
| "Service role can manage creator list items" | ALL | `true` |

---

### `creator_post`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view posts for own or assigned campaigns" | SELECT | `can_access_campaign(campaign_id)` |
| "Service role full access" | ALL | `auth.role() = 'service_role'` |

---

### `campaign_product`

| Policy | Type | Expression |
|--------|------|------------|
| `campaign_product_select_policy` | SELECT | `can_access_campaign(campaign_id)` |
| `campaign_product_insert_policy` | INSERT | `can_access_campaign(campaign_id)` |
| `campaign_product_delete_policy` | DELETE | `can_access_campaign(campaign_id)` |

---

### `team`

| Policy | Type | Expression |
|--------|------|------------|
| "Team owners can manage their teams" | ALL | `auth.uid() = owner_user_id` |
| "Team members can view their teams" | SELECT | `owner_user_id = auth.uid()` OR `is_member_of_team(team.id)` |

---

### `team_member`

| Policy | Type | Expression |
|--------|------|------------|
| "Team owners can manage team members" | ALL | EXISTS team with owner_user_id = auth.uid() |
| "Users can view team memberships of their teams" | SELECT | `user_id = auth.uid()` OR EXISTS team with owner_user_id = auth.uid() |

---

### `campaign_member_assignment`

| Policy | Type | Expression |
|--------|------|------------|
| "Campaign owners can manage assignments" | ALL | `is_campaign_owner(campaign_id)` |
| "Users can view their own assignments" | SELECT | `user_id = auth.uid()` |

---

### `debug_upload`

| Policy | Type | Expression |
|--------|------|------------|
| "Users can view their own debug uploads" | SELECT | `auth.uid() = user_id` |
| "Users can insert their own debug uploads" | INSERT | `auth.uid() = user_id` |
| "Service role can manage debug uploads" | ALL | `true` |

---

## 4. Database Functions and Triggers

### Functions

#### `update_latest_gmail_message_per_thread()` — `20250903000000_initial.sql`
**Purpose:** Trigger function that upserts into `latest_gmail_message_per_thread` when a new `gmail_message` is inserted. Only updates if the new message is more recent than the current record.
```sql
-- AFTER INSERT ON gmail_message FOR EACH ROW
```

#### `update_updated_at_column()` — `20251104000000_create_discord_workflow_system.sql`
**Purpose:** Generic `updated_at` timestamp refresh trigger function. Used by `discord_workflow` and `discord_channel_mapping` and `n8n_workflows`.
```sql
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
```

#### `cleanup_expired_thread_sessions()` — `20251104000000` (DROPPED in `20251105000000`)
**Purpose:** Was a statement-level trigger to expire Discord sessions. DROPPED due to infinite recursion.

#### `update_campaign_lookalike_suggestion_updated_at()` — `20251121000001`
**Purpose:** Trigger function for `campaign_lookalike_suggestion.updated_at`.

#### `update_latest_smtp_message_per_thread()` — `20251127000000_smtp_support.sql`
**Purpose:** SMTP parallel to the Gmail trigger. Upserts into `latest_smtp_message_per_thread` on new `smtp_message` insert.

#### `update_email_dispatch_queue_updated_at()` — `20251215155437`
**Purpose:** Updates `email_dispatch_queue.updated_at` only if it hasn't been manually set (checks `NEW.updated_at = OLD.updated_at`).

#### `update_session_templates_updated_at()` — `20251216204538`
**Purpose:** Updated_at trigger for `session_templates`.

#### `update_creator_updated_at()` — `20260123000000`
**Purpose:** Updated_at trigger for `creator` table (`last_updated_at` column).

#### `upsert_creator(...)` — `20260123100000`
**Purpose:** Atomic upsert for `creator` table. Preserves existing email if new value is null; atomically appends new snapshot to `snapshots` array on conflict.
```sql
CREATE OR REPLACE FUNCTION upsert_creator(
    p_platform TEXT, p_handle TEXT, p_email TEXT, p_follower_count INTEGER,
    p_is_verified BOOLEAN, p_location TEXT, p_keywords TEXT[],
    p_profile_data JSONB, p_snapshot JSONB, p_source TEXT
) RETURNS void ...
```

#### `check_email_exists(email_to_check TEXT)` — `20260124000000`
**Purpose:** SECURITY DEFINER function to check if an email exists in `auth.users`. Restricted to `service_role` only (errors if called by other roles). Used by unified auth flow for sign-in vs. sign-up routing.
```sql
SECURITY DEFINER SET search_path = public
-- Checks current_setting('role') = 'service_role'
```

#### `update_team_updated_at()` — `20260210000000`
**Purpose:** Updated_at trigger for `team` table.

#### `is_member_of_team(p_team_id uuid)` — `20260210000000` / refined in `20260216000001`
**Purpose:** SECURITY DEFINER helper to check team membership without triggering RLS recursion.

#### `is_campaign_owner(p_campaign_id uuid)` — `20260210000000` / refined in `20260216000002`
**Purpose:** SECURITY DEFINER helper to check campaign ownership without triggering RLS cross-table recursion.

#### `can_access_campaign(p_campaign_id UUID)` — `20260217100000`
**Purpose:** SECURITY DEFINER function that returns true if the current user either owns the campaign or is assigned to it via `campaign_member_assignment`. Used extensively by child-table RLS SELECT policies. STABLE (cacheable within a transaction).

#### `update_updated_at()` — `20260127061714`
**Purpose:** Generic `updated_at` trigger function (different name from `update_updated_at_column()`). Used by `creator_list`.

#### `can_view_gmail_account_via_campaign(p_account_id UUID)` / `can_view_smtp_account_via_campaign(p_account_id UUID)` — `20260217100001` (DROPPED in `20260217100003`)
**Purpose:** Were SECURITY DEFINER helpers allowing team members to view email account rows. Dropped because PostgreSQL RLS cannot restrict columns, exposing credentials (refresh_token, smtp_password) to team members.

---

### Triggers

| Trigger | Table | Event | Timing | Function |
|---------|-------|-------|--------|----------|
| `trigger_update_latest_gmail_message_per_thread` | `gmail_message` | INSERT | AFTER | `update_latest_gmail_message_per_thread()` |
| `discord_workflow_updated_at` | `discord_workflow` | UPDATE | BEFORE | `update_updated_at_column()` |
| `discord_thread_sessions_cleanup` | `discord_thread_sessions` | INSERT/UPDATE | AFTER STATEMENT | `cleanup_expired_thread_sessions()` — **DROPPED** `20251105000000` |
| `discord_channel_mapping_updated_at` | `discord_channel_mapping` | UPDATE | BEFORE | `update_updated_at_column()` |
| `campaign_lookalike_suggestion_updated_at` | `campaign_lookalike_suggestion` | UPDATE | BEFORE | `update_campaign_lookalike_suggestion_updated_at()` |
| `trigger_update_latest_smtp_message_per_thread` | `smtp_message` | INSERT | AFTER | `update_latest_smtp_message_per_thread()` |
| `update_email_dispatch_queue_updated_at` | `email_dispatch_queue` | UPDATE | BEFORE | `update_email_dispatch_queue_updated_at()` |
| `session_templates_updated_at` | `session_templates` | UPDATE | BEFORE | `update_session_templates_updated_at()` |
| `creator_updated_at` | `creator` | UPDATE | BEFORE | `update_creator_updated_at()` |
| `n8n_workflows_updated_at` | `n8n_workflows` | UPDATE | BEFORE | `update_updated_at_column()` |
| `team_updated_at` | `team` | UPDATE | BEFORE | `update_team_updated_at()` |
| `creator_list_updated_at` | `creator_list` | UPDATE | BEFORE | `update_updated_at()` |

---

## 5. Extensions Used

| Extension | Migration | Purpose |
|-----------|-----------|---------|
| `vector` | `20251210000000_create_email_reply_example_vector.sql` | pgvector for 1536-dimensional embeddings (OpenAI) and cosine similarity search (HNSW index) |
| `pgcrypto` | `20251210000000_create_email_reply_example_vector.sql` | Cryptographic functions (gen_salt, crypt — used implicitly in Supabase Auth seed data) |
| `pg_trgm` | `20260112000000_add_pg_trgm_search_indexes.sql` | Trigram-based text search for fast `ILIKE '%query%'` on `gmail_message.sender_email` and `body_text` |

---

## 6. Enum Types

### `email_dispatch_status`

Defined in `20251215155437_create_email_dispatch_queue.sql`:

```sql
CREATE TYPE email_dispatch_status AS ENUM (
    'pending',
    'processing',
    'sent',
    'failed',
    'cancelled'
);
```

Used on `email_dispatch_queue.status`. All other status columns across the schema use plain `text` with `CHECK` constraints rather than enum types.

---

## 7. Migration History Summary

### Phase 1: Core Email Infrastructure (September 2025)

**`20250903000000_initial.sql`** — Established the entire foundational schema: `user_gmail_account`, `gmail_message` (event-sourced, single table for all directions), `latest_gmail_message_per_thread` (trigger-maintained), `email_attachment`, `email_attachment_llm_extracted_content`, `gmail_thread_state` (versioned), `gmail_thread_llm_draft`, `gmail_thread_ui_draft`, `gmail_thread_state_follow_up_schedule`, `product`, `campaign`, `campaign_recipient`, `campaign_sender`, `campaign_thread`, `user_setting`. Set up the `update_latest_gmail_message_per_thread` trigger.

**`20250903000001_rls_policies.sql`** — Applied RLS to all initial tables with user-scoped policies.

### Phase 2: Campaign Analytics & CSV (October 2025, early)

**`20251015032231`** — Added `campaign_rule_suggestion_analytics` for tracking AI rule suggestion acceptance.
**`20251015041512`** — Added `campaign_csv` for tracking bulk recipient CSV imports.
**`20251015123950`** — Applied RLS to both new tables.

### Phase 3: Outbox Queue & Campaign Refinements (October 2025, mid)

**`20251017150322`** — Created `campaign_outbox_queue` with a 4-state workflow (pending → processing → sent/failed). Temporal-worker-based sending.
**`20251017162309`** — Added `name`, `custom_fields` to `campaign_recipient`; added `status` to `campaign`; dropped `custom_fields_for_llm` from `campaign`.
**`20251017163000`** — Made `campaign.status` NOT NULL with default `'active'`.
**`20251022140258`** — Made `product.url_to_scrape` nullable.
**`20251022143128`** — Made `campaign_recipient.name` nullable.
**`20251023091852`** — Created `campaign_workflow` table for AI workflow definitions per campaign, with full RLS.
**`20251023093210`** — Made `campaign.product_id` nullable.

### Phase 4: Campaign UI Refinements & Performance (October 2025, late)

**`20251025072428`** — Converted `campaign.frequently_asked_questions_for_llm` and `sample_emails_for_llm` from text to jsonb.
**`20251025075658`** — Added UI fields to `campaign`: `is_external`, `automation_level`, `image_url`.
**`20251026204807`** — Major performance index sweep: FK indexes on `campaign_recipient`, `campaign_sender`, `email_attachment`, `campaign_outbox_queue`, `campaign_thread`, `gmail_thread_state`, plus composite indexes on `gmail_message`.
**`20251029061249`** — Added `output_schema` jsonb to `campaign_workflow` for structured Claude output.
**`20251029070000`** — Created `campaign_workflow_execution` for execution history with Temporal tracing support.
**`20251030`** — Changed `campaign_thread` unique constraint: one campaign per Gmail thread (global uniqueness on `gmail_thread_id`).

### Phase 5: Discord & User Preferences (November 2025, early)

**`20251103233323`** — Created `gmail_thread_user_preferences` (hidden, pinned, custom labels per thread).
**`20251104000000`** — Full Discord subsystem: `discord_workflow`, `discord_workflow_scope`, `discord_workflow_execution`, `discord_thread_sessions`, `discord_channel_mapping`. Introduced `update_updated_at_column()` function.
**`20251105000000`** — Dropped the recursive `discord_thread_sessions_cleanup` trigger that caused stack overflow.
**`20251108000000`** — Simplified `discord_thread_sessions`: removed `claude_session_id`, `expires_at`, `status` (session resumption no longer needed; thread history rebuilt per message).
**`20251108171941`** — Added `trigger_type` ('ambient'/'active') to `discord_workflow`.

### Phase 6: Creator Management (November 2025)

**`20251113113540`** — Created `campaign_creator` table for rich influencer/creator tracking within campaigns (gifting workflow, social handles, discount codes).
**`20251113500000`** — Removed Langfuse observability columns from `discord_thread_sessions`.
**`20251121000000`** — Added `is_lookalike_suggestions_enabled` toggle to `campaign`.
**`20251121000001`** — Created `campaign_lookalike_suggestion` with Apify-sourced lookalike discovery, RLS, and update trigger.
**`20251125000000`** — Added `suggested_email` to `campaign_lookalike_suggestion` (Apify public_email field).

### Phase 7: Follow-up System & SMTP Support (November–December 2025)

**`20251126000000`** — Created `campaign_follow_up_outbox_queue` for automated follow-up email sequences.
**`20251126000001`** — Added `follow_up_templates` jsonb to `campaign`.
**`20251127000000`** — Major SMTP support migration: `user_smtp_account`, `smtp_message`, `latest_smtp_message_per_thread` (trigger), `smtp_thread_state`; made `campaign_sender.gmail_account_id` nullable and added mutually-exclusive CHECK constraint; extended `campaign_thread`, `campaign_outbox_queue`, `campaign_follow_up_outbox_queue`, `gmail_thread_llm_draft` to support SMTP.
**`20251204`** — Seeded Xero Accounting Assistant Discord workflow; added UNIQUE constraint on `discord_workflow.name`.
**`20251210000000`** — Added pgvector support (`email_reply_example` table) for RAG-based draft generation. Added `vector` and `pgcrypto` extensions.
**`20251212000000`** — Replaced `campaign_name TEXT` with `campaign_id UUID FK` on `email_reply_example`; added RLS.
**`20251215155437`** — Created `email_dispatch_queue` with `email_dispatch_status` enum for scheduled email delivery.
**`20251216204538`** — Created `session_templates` for Discord-launchable dev session templates.
**`20251220000000`** — Made `campaign_workflow_execution.gmail_thread_state_id` nullable (supports API-triggered executions without email context).
**`20251221000000`** — Added `sanitized_reply_text` and `reply_summary` to `email_reply_example` for hallucination prevention.

### Phase 8: Creator Discovery & Platform Expansion (January 2026)

**`20260103`** — Removed `onyx_session_id` from `discord_thread_sessions`.
**`20260107`** — Simplified `session_templates`: replaced `image_ref + services` with `fly_app` reference.
**`20260112000000`** — Enabled `pg_trgm` extension; added GIN trigram indexes on `gmail_message.sender_email` and `subject` for fast ILIKE search.
**`20260112100000`** — Created `user_onboarding` with survey response tracking and setup checklist state.
**`20260113000000`** — Added `platform` column to `campaign_lookalike_suggestion`; renamed `seed_instagram_handle` → `seed_platform_handle`; updated unique constraint to include platform.
**`20260113500000`** — Created `n8n_workflows` table for webhook workflow integrations as Claude tools.
**`20260115000000`** — Added `notes_history` jsonb to `campaign_creator` (max 3 notes with timestamps and source).
**`20260115232223`** — Added `google_sheet_error` and `google_sheet_error_at` to `campaign` for sheet access failure tracking.
**`20260121000000`** — Added `custom_instructions` to `campaign_rule_suggestion_analytics`.
**`20260121500000`** — Dropped legacy `public.schema_migrations` table.

### Phase 9: Creator Profile & List Management (January–February 2026)

**`20260122090346`** — Added `paid_promotion_status` and `paid_promotion_rate` to `campaign_creator`.
**`20260122500000`** — Created `bluedot_transcripts` table and `bluedot_accessible_meetings` view; created `bluedot_webhook_writer` and `discord_bot_reader` roles.
**`20260123000000`** — Created global `creator` table (platform-agnostic, not user-scoped, with pgvector-adjacent keyword GIN index).
**`20260123100000`** — Created `upsert_creator()` function for atomic creator upserts with snapshot append.
**`20260124000000`** — Created `check_email_exists()` SECURITY DEFINER function for auth flow routing.
**`20260124500000`** — Seeded Bluedot Meeting Assistant Discord workflow and scope.
**`20260125022235`** — Added role classification, talent manager info, confidence score, and manual verification flag to `campaign_creator`.
**`20260127061714`** — Created `creator_list` and `creator_list_item` tables; added `update_updated_at()` function.
**`20260127172052`** — Added `profile_image_path` and `profile_image_etag` to `creator`.
**`20260128163621`** — Created `creator-images` Supabase Storage bucket with public read / service-role write policies.
**`20260128200000`** — Added `setup_checklist_completed` and timestamp to `user_onboarding`.
**`20260129000000`** — Added `draft_metadata` jsonb to `campaign` for draft form state persistence.
**`20260130`** — Created `thread_tool_contexts` for Discord thread tool selection persistence.

### Phase 10: Post Tracking & Email Signatures (February 2026, early)

**`20260204000000`** — Added `email_signature` and `email_signature_enabled` to `campaign` (later migrated out and dropped).
**`20260204000001`** — Created `creator_post` for Instagram post tracking per campaign creator.
**`20260204000002`** — Added post tracking timestamps to `campaign_creator`.
**`20260204000003`** — Created `post-media` Supabase Storage bucket.
**`20260205000000`** — Added email index on `campaign_creator.email`.
**`20260205000001`** — Added `post_tracking_enabled` boolean to `campaign`.
**`20260205000002`** — Added `last_seen_post_id` to `campaign_creator`.
**`20260205000003`** — Created standalone `email_signature` table (user-level and campaign-level signatures).
**`20260205100000`** — Added `latest_interaction_at` and `latest_interaction_campaign_id` to `campaign_creator`.
**`20260205100001`** — Query optimizations: covering index on `gmail_thread_state`; index on `latest_gmail_message_per_thread.gmail_message_id`; dropped unused subject trigram index.

### Phase 11: Team Collaboration & Integrations (February 2026, mid)

**`20260209000000`** — Added `completed_at` to `campaign`.
**`20260209100000`** — Added `'cancelled'` status to `campaign_outbox_queue` CHECK constraint.
**`20260210000000`** — Major team campaign assignment feature: `team`, `team_member`, `campaign_member_assignment` tables; SECURITY DEFINER functions `is_member_of_team()` and `is_campaign_owner()`; widened `campaign` SELECT RLS to include assigned members.
**`20260211000000`** — Created `thread_flag` for LLM-extracted thread signals (wants_paid, has_question, has_issue).
**`20260211000001–000003`** — Added `campaign_id` to `email_signature`, migrated campaign signatures from `campaign` table columns, dropped those columns.
**`20260211100000`** — Added `slack_channel_id` to `campaign`, `slack_digest_message_ts` and `slack_approval_status` to `campaign_creator`.
**`20260211500000`** — Captured legacy `channel_sessions` and `thread_sessions` tables in migration system.
**`20260211600000`** — Added `discovery_enabled` and `discovery_config` to `campaign` for automated creator discovery.
**`20260213000000`** — Replaced Bluedot with Clarify: dropped `bluedot_transcripts`, created `clarify_meetings`.
**`20260213000001`** — Replaced Bluedot Meeting Assistant Discord workflow with Clarify Meeting Assistant.

### Phase 12: RLS Hardening & Enrichment (February 2026, mid-late)

**`20260215000000`** — Added composite pagination indexes for `campaign_recipient` and `campaign_creator`.
**`20260216000000–000002`** — Three-part RLS recursion fix series: fixed `team_member` self-referential policy; fixed team↔team_member cross-table recursion with SECURITY DEFINER; fixed campaign↔campaign_member_assignment cross-table recursion.
**`20260216120000`** — Added GIN trigram index on `gmail_message.body_text` for body content search.
**`20260216120001`** — Added `auto_enrich` and `enrichment_status` columns to `creator_list` (later removed).
**`20260216120002`** — Created `creator_enrichment_attempt` for email enrichment cooldown tracking.
**`20260217000001`** — Performance indexes v2: sort-elimination index on `gmail_thread_state`; index on `campaign_outbox_queue.gmail_thread_id`.
**`20260217100000`** — Created `can_access_campaign()` SECURITY DEFINER function; updated SELECT RLS policies on all campaign child tables to allow assigned team members.
**`20260217100001`** — Added team-member SELECT policies on `user_gmail_account` and `user_smtp_account` (then reverted).
**`20260217100002`** — Fixed WRITE policies on `campaign_lookalike_suggestion` and `campaign_recipient` for team members.
**`20260217100003`** — Dropped team-member SELECT policies on credential tables (security fix — RLS cannot restrict columns).

### Phase 13: Post Opt-in & Products (February 2026, late)

**`20260219000000`** — Added post-opt-in follow-up configuration to `campaign` and tracking columns to `campaign_creator`.
**`20260219010000`** — Added `post_opt_in_follow_up_delay_hours_at_schedule` snapshot column to `campaign_creator`.
**`20260220000000`** — Added `shopify_order_id` to `campaign_creator`.
**`20260220010000`** — Created `campaign_product` junction table (many-to-many campaign↔product); migrated existing `campaign.product_id` data.
**`20260220100000`** — Added `source` column to `creator_enrichment_attempt`.
**`20260220110000`** — Removed `auto_enrich` and `enrichment_status` from `creator_list`.
**`20260221000000`** — Added case-insensitive name index on `campaign_creator`.
**`20260221010000`** — Retry migration to ensure `shopify_order_id` on `campaign_creator`.
**`20260221020000`** — Created `debug_upload` table and `debug-uploads` private Storage bucket.
**`20260224000000`** — Added `enrichment_status` to `campaign_creator` (pending/enriching/enriched/no_email_found).

---

### Seed File (`seed.sql`)

The seed file establishes a complete local development environment:
- Test user `devs@nutsandbolts.ai` (UUID `00000000-0000-0000-0000-000000000001`) with completed onboarding
- A Gmail account linked to the test user with an encrypted refresh token
- A "Local Dev Campaign" of type `'other'` with a linked campaign sender
- Three sample Gmail threads in states: `WAITING_FOR_DRAFT_REVIEW`, `WAITING_FOR_INBOUND`, and `IGNORE`
- An LLM draft pre-loaded for Thread 1 to test the draft injection flow