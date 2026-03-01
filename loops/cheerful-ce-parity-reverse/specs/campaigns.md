# Campaign Domain — Tool Specifications

**Domain**: Campaigns
**Spec file**: `specs/campaigns.md`
**Wave 2 status**: Tool design complete
**Wave 3 status**: Pending (full OpenAPI-level specs)

---

## Table of Contents

1. [Campaign Core CRUD](#campaign-core-crud) (6 tools)
2. [Campaign Draft / Wizard](#campaign-draft--wizard) (5 tools)
3. [Campaign Recipients](#campaign-recipients) (4 tools)
4. [Campaign Senders](#campaign-senders) (2 tools)
5. [Campaign Outbox](#campaign-outbox) (2 tools)
6. [Campaign Signatures](#campaign-signatures) (3 tools)
7. [Merge Tags & Template Helpers](#merge-tags--template-helpers) (2 tools)
8. [Google Sheet Validation](#google-sheet-validation) (1 tool)
9. [Client Summary (AI)](#client-summary-ai) (1 tool)
10. [Products](#products) (3 tools)
11. [Campaign Enrichment](#campaign-enrichment) (2 tools)

**Total**: 31 tools (1 existing + 30 new)

> **Note**: Campaign workflows (5 tools) and workflow executions (2 tools) are documented in `specs/workflows.md` despite living under `/v1/campaigns/{campaign_id}/workflows` endpoints, because they form a distinct domain with their own CRUD lifecycle and execution model.

---

## Campaign Core CRUD

### `cheerful_list_campaigns`

**Status**: EXISTS — needs enhancement

**Purpose**: List the authenticated user's campaigns with optional stats and status filtering.

**Maps to**: `GET /api/service/campaigns`

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (returns only user's own campaigns).

**Current implementation gaps** (to be addressed in Wave 3):
- Existing tool takes NO parameters — `ListCampaignsInput` is an empty model
- Service route filters to only ACTIVE/PAUSED — no DRAFT or COMPLETED campaigns
- Response includes `status` and `slack_channel_id` but XML formatter drops them (only outputs id, name, type, gmail_account_id, created_at)
- Main API endpoint supports `include_stats` and `campaign_ids` params — not exposed in service route

**Proposed parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| include_stats | boolean | no | false | Include per-campaign stats (sent_count, thread_count, pending_count, failed_count, total_recipients) |
| statuses | string[] | no | ["active", "paused"] | Filter by status. Values: "active", "paused", "draft", "completed" |
| campaign_ids | uuid[] | no | — | Filter to specific campaign IDs |

**Returns**: Array of campaign objects with id, name, campaign_type, status, slack_channel_id, created_at, and optionally stats.

**Service route changes needed**: Update `GET /api/service/campaigns` to accept `include_stats`, `statuses[]`, `campaign_ids[]` query params. Remove hardcoded ACTIVE/PAUSED filter.

---

### `cheerful_get_campaign`

**Status**: NEW

**Purpose**: Get a single campaign by ID with full details and optional sender breakdown.

**Maps to**: `GET /api/service/campaigns/{campaign_id}` (new service route needed; main route: `GET /campaigns/{campaign_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member (via `campaign_member_assignment`).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID |
| include_sender_details | boolean | no | false | Include per-sender thread counts |

**Returns**: Full campaign object including all configuration fields (name, campaign_type, status, is_external, automation_level, subject_template, body_template, LLM config fields, follow-up config, discovery config, Google Sheet config, cc_emails, slack_channel_id, image_url, created_at, updated_at). When `include_sender_details=true`, includes sender array with per-sender thread_count.

**Error responses**: Campaign not found (404), access denied (403).

---

### `cheerful_create_campaign`

**Status**: NEW

**Purpose**: Create a new campaign with full configuration.

**Maps to**: `POST /api/service/campaigns` (new service route needed; main route: `POST /campaigns/`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (any user can create campaigns).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | yes | — | Campaign name |
| campaign_type | enum | yes | — | One of: "gifting", "paid_promotion", "sales", "creator", "other" |
| status | enum | no | "active" | One of: "active", "paused", "draft", "completed" |
| product_id | uuid | no | — | Primary product ID |
| product_ids | uuid[] | no | — | Additional product IDs |
| is_external | boolean | no | false | External campaign flag |
| automation_level | string | no | — | Automation level setting |
| subject_template | string | no | — | Email subject template (supports merge tags) |
| body_template | string | no | — | Email body template (supports merge tags) |
| agent_name_for_llm | string | no | — | Agent display name for AI drafting |
| rules_for_llm | string | no | — | Rules/constraints for AI drafting |
| goal_for_llm | string | no | — | Campaign goal for AI drafting context |
| frequently_asked_questions_for_llm | string | no | — | FAQ context for AI drafting |
| sample_emails_for_llm | string | no | — | Example emails for AI tone matching |
| senders | object[] | no | — | Sender accounts (gmail_account_id or smtp_account_id per entry) |
| recipients | object[] | no | — | Initial recipients (email, name, custom_fields per entry) |
| is_follow_up_enabled | boolean | no | false | Enable automated follow-ups |
| follow_up_gap_in_days | integer | no | — | Days between follow-ups |
| max_follow_ups | integer | no | — | Maximum follow-up count |
| follow_up_templates | object[] | no | — | Follow-up email templates |
| is_lookalike_suggestions_enabled | boolean | no | false | Enable lookalike creator suggestions |
| discovery_enabled | boolean | no | false | Enable auto-discovery |
| discovery_config | object | no | — | Auto-discovery configuration |
| google_sheet_url | string | no | — | Google Sheet URL for recipient import |
| google_sheet_tab_name | string | no | — | Sheet tab name |
| google_sheet_data_instructions | string | no | — | Instructions for sheet data parsing |
| google_sheet_columns_to_skip | string[] | no | — | Columns to exclude from import |
| cc_emails | string[] | no | — | CC email addresses |
| slack_channel_id | string | no | — | Slack channel for notifications |
| image_url | string | no | — | Campaign image URL |

**Returns**: Full campaign response object with generated ID, timestamps, and all config fields.

**Notes**: This is the direct-create path (bypasses wizard). Most users will use the draft/wizard flow (save draft → launch) instead. The Slack agent may use this for quick campaign creation with minimal config.

---

### `cheerful_update_campaign`

**Status**: NEW

**Purpose**: Update an existing campaign's configuration. All fields are optional — only provided fields are updated.

**Maps to**: `PUT /api/service/campaigns/{campaign_id}` (new service route needed; main route: `PUT /campaigns/{campaign_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID to update |
| name | string | no | — | Campaign name |
| campaign_type | enum | no | — | One of: "gifting", "paid_promotion", "sales", "creator", "other" |
| status | enum | no | — | One of: "active", "paused", "draft", "completed". Status transitions: ACTIVE→COMPLETED auto-cancels pending outbox/follow-ups; COMPLETED→ACTIVE reactivates |
| *(all other fields from create)* | | no | — | Same optional fields as cheerful_create_campaign |

**Returns**: Updated campaign response object.

**Error responses**: Campaign not found (404), access denied (403).

**Side effects**:
- Setting status to "completed" cancels all pending outbox entries and follow-ups
- Setting status back to "active" reactivates the campaign

---

### `cheerful_delete_campaign`

**Status**: NEW

**Purpose**: Permanently delete a campaign and all associated data.

**Maps to**: `DELETE /api/service/campaigns/{campaign_id}` (new service route needed; main route: `DELETE /campaigns/{campaign_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID to delete |

**Returns**: Success confirmation (204 No Content from backend).

**Error responses**: Campaign not found (404), access denied — not owner (403).

**Side effects**: Cascading delete of recipients, senders, threads, creators, thread_links, outbox entries, workflows, workflow executions, and all related data.

**Slack formatting notes**: Agent should confirm the campaign name before deletion and warn about cascade. Recommend a confirmation step in conversation.

---

### `cheerful_duplicate_campaign`

**Status**: NEW

**Purpose**: Create a copy of an existing campaign with DRAFT status. Copies configuration, senders, workflows, and signature but not recipients or threads.

**Maps to**: `POST /api/service/campaigns/{campaign_id}/duplicate` (new service route needed; main route: `POST /campaigns/{campaign_id}/duplicate`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Source campaign ID to duplicate |

**Returns**: New campaign response object (status = "draft") with copied configuration.

**Notes**: The new campaign has a fresh ID, DRAFT status, and copied config/senders/workflows/signature. Recipients and threads are NOT copied. The user can then modify the draft and launch it.

---

## Campaign Draft / Wizard

### `cheerful_save_campaign_draft`

**Status**: NEW

**Purpose**: Save a new campaign wizard draft. Creates a draft record that can be iteratively updated and eventually launched.

**Maps to**: `POST /api/service/campaigns/draft` (new service route needed; main route: `POST /campaigns/draft`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_name | string | no | — | Campaign name |
| campaign_type | enum | no | — | One of: "gifting", "paid_promotion", "sales", "creator", "other" |
| is_external | boolean | no | false | External campaign flag |
| product_id | uuid | no | — | Existing product ID |
| product_ids | uuid[] | no | — | Additional product IDs |
| product_name | string | no | — | New product name (if not using existing) |
| product_description | string | no | — | Product description |
| additional_products | object[] | no | — | Additional products (name, description per entry) |
| subject_template | string | no | — | Email subject template |
| body_template | string | no | — | Email body template |
| campaign_goal | string | no | — | Campaign goal for AI context |
| campaign_faqs | string | no | — | FAQs for AI context |
| sample_emails | string | no | — | Sample emails for AI tone |
| follow_up_templates | object[] | no | — | Follow-up templates |
| google_sheet_url | string | no | — | Google Sheet URL for recipients |
| google_sheet_tab_name | string | no | — | Sheet tab name |
| tracking_rules | string | no | — | Tracking rules configuration |
| selected_accounts | object[] | no | — | Selected sender accounts |
| cc_emails | string[] | no | — | CC emails |
| creators_csv_data | string | no | — | Raw CSV data for creators |
| creators_csv_headers | string[] | no | — | CSV column headers |
| search_creators | object[] | no | — | Creators found via search |
| search_merged_emails | object[] | no | — | Merged email results from search |
| email_signature | string | no | — | HTML email signature |
| email_signature_enabled | boolean | no | — | Whether signature is enabled |

**Returns**: `{ campaign_id: uuid, message: string }`

**Notes**: This corresponds to the campaign wizard's "save progress" functionality. The draft stores all wizard state across steps 0-7 so users can resume later.

---

### `cheerful_update_campaign_draft`

**Status**: NEW

**Purpose**: Update an existing campaign wizard draft with new data.

**Maps to**: `PUT /api/service/campaigns/draft/{campaign_id}` (new service route needed; main route: `PUT /campaigns/draft/{campaign_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner (draft creator).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Draft campaign ID to update |
| *(all fields from save_campaign_draft)* | | no | — | Same optional fields — only provided fields are updated |

**Returns**: `{ campaign_id: uuid, message: string }`

**Error responses**: Draft not found (404), access denied (403).

---

### `cheerful_get_campaign_draft`

**Status**: NEW

**Purpose**: Load a saved campaign wizard draft with all stored state.

**Maps to**: `GET /api/service/campaigns/draft/{campaign_id}` (new service route needed; main route: `GET /campaigns/draft/{campaign_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner (draft creator).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Draft campaign ID to load |

**Returns**: Full draft response object including all stored wizard fields, product info, CSV data, search creators, signature, and timestamps.

**Error responses**: Draft not found (404), access denied (403).

---

### `cheerful_delete_campaign_draft`

**Status**: NEW

**Purpose**: Delete a campaign wizard draft.

**Maps to**: `DELETE /api/service/campaigns/draft/{campaign_id}` (new service route needed; main route: `DELETE /campaigns/draft/{campaign_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner (draft creator).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Draft campaign ID to delete |

**Returns**: Success confirmation (204 No Content).

**Error responses**: Draft not found (404), access denied (403).

---

### `cheerful_launch_campaign`

**Status**: NEW

**Purpose**: Launch a campaign from a saved draft. This is the culmination of the wizard flow — it creates the live campaign, populates the outbox, and starts workflows.

**Maps to**: `POST /api/service/campaigns/launch` (new service route needed; main route: `POST /campaigns/launch`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (creates a new campaign owned by user).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| draft_campaign_id | uuid | no | — | ID of draft to launch from (if using wizard flow) |
| campaign_type | enum | yes | — | One of: "gifting", "paid_promotion", "sales", "creator", "other" |
| campaign_name | string | yes | — | Campaign name |
| product_name | string | no | — | Product name |
| product_description | string | no | — | Product description |
| product_url | string | no | — | Product URL (triggers Firecrawl scraping) |
| existing_product_id | uuid | no | — | Use existing product instead of creating new |
| additional_product_ids | uuid[] | no | — | Additional product IDs |
| is_external | boolean | no | false | External campaign flag |
| campaign_goal | string | no | — | Campaign goal for AI |
| campaign_faqs | string | no | — | FAQs for AI |
| sample_emails | string | no | — | Sample emails for AI tone |
| tracking_rules | string | no | — | Tracking rules |
| google_sheet_url | string | no | — | Google Sheet URL |
| google_sheet_tab_title | string | no | — | Sheet tab title |
| selected_accounts | object[] | no | — | Sender account selections |
| email_draft | object | no | — | Email draft with subject + body templates |
| recipients | object[] | no | — | Recipient list (email, name, custom_fields, social handles) |
| follow_up_templates | object[] | no | — | Follow-up email templates |
| integrations | object | no | — | Integration configs (workflows to create) |
| cc_emails | string[] | no | — | CC email addresses |
| is_lookalike_suggestions_enabled | boolean | no | false | Enable lookalike suggestions |
| has_creators_pending_enrichment | boolean | no | false | Flag that enrichment is in progress |
| automation_level | string | no | — | Automation level |
| slack_channel_id | string | no | — | Slack channel for notifications |
| email_signature | string | no | — | HTML email signature |
| email_signature_enabled | boolean | no | — | Whether signature is enabled |

**Returns**: `{ campaign_id: uuid, status: "launched", workflow_id: string }`

**Notes**:
- The main API endpoint accepts `multipart/form-data` with optional `csv_file` and `image_file` uploads. The CE tool will need to handle this differently — either accept file content as base64/text params or require files to be uploaded separately first.
- This is a complex orchestration endpoint that: creates/links products, creates the campaign, adds senders, adds recipients, populates outbox, creates workflows, triggers enrichment, and starts background processes.
- The Slack agent should use this for the complete "set up and launch" flow, typically after walking the user through configuration via conversation.

**Side effects**: Creates campaign, creates/links products, adds senders, adds recipients, populates outbox, creates workflows, optionally starts enrichment.

---

## Campaign Recipients

### `cheerful_add_campaign_recipients`

**Status**: NEW

**Purpose**: Bulk add recipients to a campaign by email/name. Idempotent by (campaign_id, email) — duplicates are skipped.

**Maps to**: `POST /api/service/campaigns/{campaign_id}/recipients` (new service route needed; main route: `POST /campaigns/{campaign_id}/recipients`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID |
| recipients | object[] | yes | — | Array of { email: string, name: string?, custom_fields: object? } |

**Returns**: Array of created `CampaignRecipientResponse` objects (skips duplicates silently).

**Side effects**: Auto-populates outbox queue for new recipients (round-robin sender assignment).

---

### `cheerful_add_campaign_recipients_from_search`

**Status**: NEW

**Purpose**: Add recipients discovered via creator search. Creates both campaign_recipient and campaign_creator records. Starts enrichment for creators without verified email.

**Maps to**: `POST /api/service/campaigns/{campaign_id}/recipients-from-search` (new service route needed; main route: `POST /campaigns/{campaign_id}/recipients-from-search`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID |
| recipients | object[] | yes | — | Array of { email: string?, name: string?, custom_fields: object?, social_media_handles: string[] } |

**Returns**: Array of `RecipientFromSearchResponse` objects (includes creator_id, enrichment_status).

**Side effects**: Creates campaign_creator records, triggers enrichment workflow for creators without email.

**Notes**: Unlike `add_campaign_recipients`, this creates the full creator record with social handles and triggers the enrichment pipeline. Used when adding creators found via Influencer Club search.

---

### `cheerful_upload_campaign_recipients_csv`

**Status**: NEW

**Purpose**: Upload a CSV file of recipients to a campaign. Requires an `email` column. Gifting/paid_promotion campaigns also require social profile columns.

**Maps to**: `POST /api/service/campaigns/{campaign_id}/recipients/csv` (new service route needed; main route: `POST /campaigns/{campaign_id}/recipients/csv`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID |
| csv_content | string | yes | — | Raw CSV text content (with headers row) |
| populate_queue | boolean | no | true | Whether to auto-populate outbox queue |

**Returns**: `{ added_count: integer, skipped_count: integer, invalid_count: integer, recipients: CampaignRecipientResponse[] }`

**Notes**: The main API endpoint accepts multipart file upload. The CE tool should accept CSV as a text parameter since Slack doesn't support file uploads in tool calls. The service route will need to parse the text as CSV.

**Error responses**: Missing required `email` column, missing social profile columns for gifting/paid_promotion campaigns.

---

### `cheerful_list_campaign_recipients`

**Status**: NEW

**Purpose**: List campaign recipients with rich filtering, sorting, and unified view combining recipient + creator data.

**Maps to**: `GET /api/service/campaigns/{campaign_id}/unified-recipients` (new service route needed; main route: `GET /campaigns/{campaign_id}/unified-recipients`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID |
| limit | integer | no | 50 | Results per page. Max: 10000 |
| offset | integer | no | 0 | Pagination offset |
| status | string[] | no | — | Filter by outbox status(es). Values: "pending", "processing", "sent", "failed", "cancelled" |
| include_all_contacts | boolean | no | false | Include contacts without outbox entries |
| search | string | no | — | Text search across name/email |
| sort_by | string | no | "created_at" | Sort field |
| sort_dir | enum | no | "desc" | One of: "asc", "desc" |
| social_platforms | string[] | no | — | Filter by social platform presence |
| interaction_period | string | no | — | Filter by recent interaction timeframe |
| has_notes | boolean | no | — | Filter to recipients with notes |
| post_status | string[] | no | — | Filter by post tracking status |
| has_address | boolean | no | — | Filter to recipients with gifting address |
| has_discount_code | boolean | no | — | Filter to recipients with discount code |

**Returns**: `{ rows: UnifiedRecipientResponse[], total: integer }`

**UnifiedRecipientResponse fields**: id, email, name, outbox_status, gifting_status, paid_promotion_status, outreach_status, enrichment_status, gifting_address, gifting_discount_code, sent_at, latest_email_at, social_media_handles[], custom_fields, notes_history[], source, recipient_id, creator_id, match_confidence, created_at, role, talent_manager_name, talent_manager_email, talent_agency, confidence_score, latest_interaction_at, latest_interaction_campaign_id, latest_interaction_campaign_name, post_count, post_last_checked_at, post_tracking_ends_at, flags (wants_paid, wants_paid_reason, has_question, has_question_reason, has_issue, has_issue_reason).

**Slack formatting notes**: Agent should present as a summary table (name, email, status, social handles) with drill-down available via `cheerful_get_campaign_creator`.

---

## Campaign Senders

### `cheerful_update_campaign_sender`

**Status**: NEW

**Purpose**: Swap a sender email on a campaign. Replaces the Gmail/SMTP account assignment for one sender.

**Maps to**: `PATCH /api/service/campaigns/{campaign_id}/senders` (new service route needed; main route: `PATCH /campaigns/{campaign_id}/senders`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID |
| old_sender_email | string | yes | — | Current sender email to replace |
| new_sender_email | string | yes | — | New sender email to assign |

**Returns**: `{ success: boolean, affected_emails: integer, message: string }`

**Error responses**: Campaign not found (404), old sender not found on campaign, new sender account not connected.

---

### `cheerful_remove_campaign_sender`

**Status**: NEW

**Purpose**: Remove a sender from a campaign. Validates that at least one sender remains.

**Maps to**: `DELETE /api/service/campaigns/{campaign_id}/senders` (new service route needed; main route: `DELETE /campaigns/{campaign_id}/senders`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-only.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID |
| sender_email | string | yes | — | Sender email to remove |

**Returns**: `{ success: boolean, deleted_emails_count: integer, remaining_senders: integer, message: string }`

**Error responses**: Campaign not found (404), sender not found on campaign, cannot remove last sender (must have at least 1).

**Side effects**: Deletes associated outbox entries for the removed sender.

---

## Campaign Outbox

### `cheerful_populate_campaign_outbox`

**Status**: NEW

**Purpose**: Populate the outbound email queue for a campaign. Idempotent — only creates entries for recipients not already queued. Distributes recipients across senders via round-robin.

**Maps to**: `POST /api/service/campaigns/{campaign_id}/outbound` (new service route needed; main route: `POST /campaigns/{campaign_id}/outbound`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID |
| cc_emails | string[] | no | — | CC email addresses to include on all outbound emails |

**Returns**: `{ status: string, message: string, entries_created: integer }`

**Error responses**: Campaign not found (404), no senders configured, template placeholder validation failure.

**Side effects**: Creates outbox queue entries in PENDING status. Validates template merge tags against recipient custom fields.

---

### `cheerful_get_campaign_outbox`

**Status**: NEW

**Purpose**: Get the outbox table showing all queued/sent/failed emails for a campaign.

**Maps to**: `GET /api/service/campaigns/{campaign_id}/outbox-table` (new service route needed; main route: `GET /campaigns/{campaign_id}/outbox-table`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID |
| limit | integer | no | 100 | Results per page. Max: 1000 |
| offset | integer | no | 0 | Pagination offset |

**Returns**: `{ rows: OutboxTableRow[], definitions: ColumnDefinition[], total: integer }`

**OutboxTableRow fields**: id, email, recipient_name, status (pending/processing/sent/failed/cancelled), sent_at, error_message, sender_email, custom_fields, created_at, updated_at.

**Slack formatting notes**: Agent should present as a status summary (e.g., "15 sent, 3 pending, 1 failed") with option to drill into failed entries.

---

## Campaign Signatures

### `cheerful_get_campaign_signature`

**Status**: NEW

**Purpose**: Get the email signature configured for a specific campaign.

**Maps to**: `GET /api/service/campaigns/{campaign_id}/signature` (new service route needed; main route: `GET /campaigns/{campaign_id}/signature`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID |

**Returns**: `{ signature: string | null, enabled: boolean }`

**Notes**: `signature` is HTML content. Null means no signature set for this campaign (may fall back to user-level default).

---

### `cheerful_update_campaign_signature`

**Status**: NEW

**Purpose**: Set or update the email signature for a specific campaign.

**Maps to**: `PUT /api/service/campaigns/{campaign_id}/signature` (new service route needed; main route: `PUT /campaigns/{campaign_id}/signature`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID |
| signature | string | yes | — | HTML email signature content. Max 10000 characters. Server-side sanitized. |
| enabled | boolean | yes | — | Whether to append signature to outgoing emails |

**Returns**: `{ signature: string, enabled: boolean }`

**Error responses**: Signature exceeds 10000 characters.

---

### `cheerful_list_campaign_signatures`

**Status**: NEW

**Purpose**: List all email signatures the user can use across campaigns (global signature index).

**Maps to**: `GET /api/service/campaigns/signatures` (new service route needed; main route: `GET /campaigns/signatures`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated.

**Parameters**: None (user-scoped via injected context).

**Returns**: Array of signature objects with campaign associations.

**Notes**: This returns the user's signature library — signatures that can be applied to any campaign. See also `specs/users-and-team.md` for user-level signature CRUD.

---

## Merge Tags & Template Helpers

### `cheerful_get_campaign_merge_tags`

**Status**: NEW

**Purpose**: Get available merge tags for a campaign's email templates. Returns all unique custom field keys from the campaign's recipients.

**Maps to**: `GET /api/service/campaigns/{campaign_id}/merge-tags` (new service route needed; main route: `GET /campaigns/{campaign_id}/merge-tags`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID |

**Returns**: `{ headers: string[] }` — sorted unique custom field keys (e.g., ["company", "first_name", "product_interest"]).

**Slack formatting notes**: Agent should present as a bullet list of available `{{merge_tag}}` placeholders the user can reference in their email templates.

---

### `cheerful_get_campaign_required_columns`

**Status**: NEW

**Purpose**: Get the CSV columns required for a campaign based on its email template placeholders.

**Maps to**: `GET /api/service/campaigns/{campaign_id}/required-columns` (new service route needed; main route: `GET /campaigns/{campaign_id}/required-columns`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID |

**Returns**: `{ required_columns: string[] }` — column names needed in CSV to satisfy template merge tags.

**Notes**: Useful before CSV upload to validate the file has all required columns.

---

## Google Sheet Validation

### `cheerful_validate_campaign_sheet`

**Status**: NEW

**Purpose**: Validate that a campaign's configured Google Sheet is accessible and has valid data. Reads the `google_sheet_url` from the campaign config and checks connectivity + column structure.

**Maps to**: `POST /api/service/campaigns/{campaign_id}/validate-sheet` (new service route needed; main route: `POST /campaigns/{campaign_id}/validate-sheet`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID (must have google_sheet_url set) |

**Returns**: `{ success: boolean, message: string }`

**Side effects**: On success, clears any previous sheet error on the campaign. On failure, sets error state on the campaign.

**Error responses**: Campaign has no Google Sheet URL configured, sheet is inaccessible, sheet format invalid.

---

## Client Summary (AI)

### `cheerful_generate_campaign_summary`

**Status**: NEW

**Purpose**: Generate an AI-powered client summary for a campaign. Summarizes campaign performance, creator engagement, and key metrics. Only available for non-external campaigns.

**Maps to**: `POST /api/service/campaigns/{campaign_id}/generate-summary` (new service route needed; main route: `POST /campaigns/{campaign_id}/generate-summary`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID. Must not be an external campaign. |

**Returns**: `{ campaign_id: uuid, campaign_name: string, generated_at: datetime, summary_text: string, total_creators: integer, stats: object }`

**Error responses**: Campaign not found (404), campaign is external (400), access denied (403).

**Slack formatting notes**: Agent should present the summary text directly — it's already formatted as a readable narrative. Include campaign name and generated_at timestamp as context.

---

## Products

### `cheerful_create_product`

**Status**: NEW

**Purpose**: Create a new product that can be linked to campaigns.

**Maps to**: `POST /api/service/products` (new service route needed; main route: `POST /products/`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | yes | — | Product name |
| description | string | no | — | Product description |
| url_to_scrape | string | no | — | Product URL (triggers Firecrawl scraping for auto-enrichment) |

**Returns**: Full product response object with generated ID and timestamps.

**Notes**: If `url_to_scrape` is provided, the backend uses Firecrawl to scrape product details and may auto-create a Brand entity via BrandfetchService.

---

### `cheerful_list_products`

**Status**: NEW

**Purpose**: List all products owned by the authenticated user.

**Maps to**: `GET /api/service/products` (new service route needed; main route: `GET /products/`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated.

**Parameters**: None (user-scoped via injected context).

**Returns**: Array of product response objects (id, name, description, url, created_at).

---

### `cheerful_get_product`

**Status**: NEW

**Purpose**: Get a single product by ID.

**Maps to**: `GET /api/service/products/{product_id}` (new service route needed; main route: `GET /products/{product_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (product must belong to user).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| product_id | uuid | yes | — | Product ID |

**Returns**: Full product response object with all fields.

**Error responses**: Product not found (404), access denied (403).

---

## Campaign Enrichment

> **Cross-reference**: These tools operate on creators within a campaign context. See also `specs/creators.md` for creator-level tools.

### `cheerful_get_campaign_enrichment_status`

**Status**: NEW

**Purpose**: Get the enrichment status of creators in a campaign. Returns only creators in pending or enriching state (i.e., those still being processed).

**Maps to**: `GET /api/service/v1/campaigns/{campaign_id}/creators/enrichment-status` (new service route needed; main route: `GET /v1/campaigns/{campaign_id}/creators/enrichment-status`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID |

**Returns**: Array of creators with pending/enriching enrichment status (id, name, email, enrichment_status, social handles).

**Slack formatting notes**: Agent should present as a progress summary (e.g., "3 creators still enriching, 12 completed"). Useful for checking status after adding creators from search.

---

### `cheerful_override_creator_email`

**Status**: NEW

**Purpose**: Manually override a creator's email address within a campaign. Useful when enrichment fails to find the correct email or finds the wrong one.

**Maps to**: `POST /api/service/v1/campaigns/{campaign_id}/creators/{creator_id}/override-email` (new service route needed; main route: `POST /v1/campaigns/{campaign_id}/creators/{creator_id}/override-email`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner or assigned team member.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID |
| creator_id | uuid | yes | — | Creator ID within the campaign |
| email | string | yes | — | New email address to set |

**Returns**: `{ creator_id: uuid, email: string, queued: boolean }` — `queued` indicates whether the outbox was updated with the new email.

**Error responses**: Campaign not found (404), creator not found in campaign (404), invalid email format (400), access denied (403).

---

## Enums Reference

### CampaignType

| Value | Description |
|-------|-------------|
| `gifting` | Product gifting / seeding campaign |
| `paid_promotion` | Paid promotion / sponsorship |
| `sales` | Sales outreach |
| `creator` | General creator outreach |
| `other` | Other / custom type |

### CampaignStatus

| Value | Description |
|-------|-------------|
| `active` | Live campaign, actively sending |
| `paused` | Temporarily paused |
| `draft` | Draft / not yet launched |
| `completed` | Finished campaign |

### CampaignOutboxQueueStatus

| Value | Description |
|-------|-------------|
| `pending` | Queued, not yet sent |
| `processing` | Currently being sent |
| `sent` | Successfully delivered |
| `failed` | Send failed (see error_message) |
| `cancelled` | Cancelled (e.g., campaign completed) |

---

## Service Route Summary

The following new backend service routes are needed (all under `/api/service/` prefix, authenticated via `X-Service-Api-Key` + `user_id` query param):

| # | Method | Service Route | Maps to Main Route | Tool(s) |
|---|--------|--------------|-------------------|---------|
| 1 | GET | `/campaigns` | `GET /campaigns/` | cheerful_list_campaigns (update existing) |
| 2 | GET | `/campaigns/{id}` | `GET /campaigns/{id}` | cheerful_get_campaign |
| 3 | POST | `/campaigns` | `POST /campaigns/` | cheerful_create_campaign |
| 4 | PUT | `/campaigns/{id}` | `PUT /campaigns/{id}` | cheerful_update_campaign |
| 5 | DELETE | `/campaigns/{id}` | `DELETE /campaigns/{id}` | cheerful_delete_campaign |
| 6 | POST | `/campaigns/{id}/duplicate` | `POST /campaigns/{id}/duplicate` | cheerful_duplicate_campaign |
| 7 | POST | `/campaigns/draft` | `POST /campaigns/draft` | cheerful_save_campaign_draft |
| 8 | PUT | `/campaigns/draft/{id}` | `PUT /campaigns/draft/{id}` | cheerful_update_campaign_draft |
| 9 | GET | `/campaigns/draft/{id}` | `GET /campaigns/draft/{id}` | cheerful_get_campaign_draft |
| 10 | DELETE | `/campaigns/draft/{id}` | `DELETE /campaigns/draft/{id}` | cheerful_delete_campaign_draft |
| 11 | POST | `/campaigns/launch` | `POST /campaigns/launch` | cheerful_launch_campaign |
| 12 | POST | `/campaigns/{id}/recipients` | `POST /campaigns/{id}/recipients` | cheerful_add_campaign_recipients |
| 13 | POST | `/campaigns/{id}/recipients-from-search` | `POST /campaigns/{id}/recipients-from-search` | cheerful_add_campaign_recipients_from_search |
| 14 | POST | `/campaigns/{id}/recipients/csv` | `POST /campaigns/{id}/recipients/csv` | cheerful_upload_campaign_recipients_csv |
| 15 | GET | `/campaigns/{id}/unified-recipients` | `GET /campaigns/{id}/unified-recipients` | cheerful_list_campaign_recipients |
| 16 | PATCH | `/campaigns/{id}/senders` | `PATCH /campaigns/{id}/senders` | cheerful_update_campaign_sender |
| 17 | DELETE | `/campaigns/{id}/senders` | `DELETE /campaigns/{id}/senders` | cheerful_remove_campaign_sender |
| 18 | POST | `/campaigns/{id}/outbound` | `POST /campaigns/{id}/outbound` | cheerful_populate_campaign_outbox |
| 19 | GET | `/campaigns/{id}/outbox-table` | `GET /campaigns/{id}/outbox-table` | cheerful_get_campaign_outbox |
| 20 | GET | `/campaigns/{id}/signature` | `GET /campaigns/{id}/signature` | cheerful_get_campaign_signature |
| 21 | PUT | `/campaigns/{id}/signature` | `PUT /campaigns/{id}/signature` | cheerful_update_campaign_signature |
| 22 | GET | `/campaigns/signatures` | `GET /campaigns/signatures` | cheerful_list_campaign_signatures |
| 23 | GET | `/campaigns/{id}/merge-tags` | `GET /campaigns/{id}/merge-tags` | cheerful_get_campaign_merge_tags |
| 24 | GET | `/campaigns/{id}/required-columns` | `GET /campaigns/{id}/required-columns` | cheerful_get_campaign_required_columns |
| 25 | POST | `/campaigns/{id}/validate-sheet` | `POST /campaigns/{id}/validate-sheet` | cheerful_validate_campaign_sheet |
| 26 | POST | `/campaigns/{id}/generate-summary` | `POST /campaigns/{id}/generate-summary` | cheerful_generate_campaign_summary |
| 27 | POST | `/products` | `POST /products/` | cheerful_create_product |
| 28 | GET | `/products` | `GET /products/` | cheerful_list_products |
| 29 | GET | `/products/{id}` | `GET /products/{id}` | cheerful_get_product |
| 30 | GET | `/v1/campaigns/{id}/creators/enrichment-status` | `GET /v1/campaigns/{id}/creators/enrichment-status` | cheerful_get_campaign_enrichment_status |
| 31 | POST | `/v1/campaigns/{id}/creators/{cid}/override-email` | `POST /v1/campaigns/{id}/creators/{cid}/override-email` | cheerful_override_creator_email |

**Total new service routes needed**: 30 (1 existing route needs update)
