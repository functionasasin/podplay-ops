# Campaign Domain — Tool Specifications

**Domain**: Campaigns
**Spec file**: `specs/campaigns.md`
**Wave 2 status**: Tool design complete
**Wave 3 status**: In progress — CRUD complete (w3-campaigns-crud), Wizard + Products complete (w3-campaigns-wizard)

---

## Table of Contents

1. [Campaign Core CRUD](#campaign-core-crud) (6 tools) — **Wave 3 COMPLETE**
2. [Campaign Draft / Wizard](#campaign-draft--wizard) (5 tools) — **Wave 3 COMPLETE**
3. [Campaign Recipients](#campaign-recipients) (4 tools)
4. [Campaign Senders](#campaign-senders) (2 tools)
5. [Campaign Outbox](#campaign-outbox) (2 tools)
6. [Campaign Signatures](#campaign-signatures) (3 tools)
7. [Merge Tags & Template Helpers](#merge-tags--template-helpers) (2 tools)
8. [Google Sheet Validation](#google-sheet-validation) (1 tool)
9. [Client Summary (AI)](#client-summary-ai) (1 tool)
10. [Products](#products) (3 tools) — **Wave 3 COMPLETE**
11. [Campaign Enrichment](#campaign-enrichment) (2 tools)

**Total**: 31 tools (1 existing + 30 new)

> **Note**: Campaign workflows (5 tools) and workflow executions (2 tools) are documented in `specs/workflows.md` despite living under `/v1/campaigns/{campaign_id}/workflows` endpoints, because they form a distinct domain with their own CRUD lifecycle and execution model.

---

## Enums (Verified from Source)

### CampaignType (`src/models/database/campaign.py` lines 22-27)

| Enum Value | String Value |
|------------|-------------|
| `PAID_PROMOTION` | `"paid_promotion"` |
| `CREATOR` | `"creator"` |
| `GIFTING` | `"gifting"` |
| `SALES` | `"sales"` |
| `OTHER` | `"other"` |

### CampaignStatus (`src/models/database/campaign.py` lines 30-34)

| Enum Value | String Value |
|------------|-------------|
| `ACTIVE` | `"active"` |
| `PAUSED` | `"paused"` |
| `DRAFT` | `"draft"` |
| `COMPLETED` | `"completed"` |

### CampaignOutboxQueueStatus (`src/models/database/campaign.py` lines 309-314)

| Enum Value | String Value |
|------------|-------------|
| `PENDING` | `"pending"` |
| `PROCESSING` | `"processing"` |
| `SENT` | `"sent"` |
| `FAILED` | `"failed"` |
| `CANCELLED` | `"cancelled"` |

---

## Shared Sub-Schemas (Campaign Domain)

### FollowUpTemplate (`src/models/api/campaign.py` lines 34-69)

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `index` | integer | yes | `ge=0` | 0-based sequence position (0=first follow-up, 1=second, etc.) |
| `body_template` | string | yes | `min_length=1` | Email body template with `{placeholders}` for personalization. Available placeholders: `{name}`, `{email}`, any custom_fields keys |
| `hours_since_last_email` | integer | yes | `gt=0` | Hours to wait after previous email in sequence. Cumulative: follow-up 0 waits N hours after initial, follow-up 1 waits N hours after follow-up 0, etc. |

**Validation**: Indices in the array must be sequential 0-based integers with no gaps or duplicates. Max 10 follow-up templates per campaign.

### DiscoveryConfig (`src/models/api/campaign.py` lines 72-94)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `seed_profiles` | string[] | no | `[]` | Instagram handles to find lookalike creators for |
| `search_keywords` | string[] | no | `[]` | Keywords to search for creators |
| `follower_min` | integer | no | `1000` | Minimum follower count filter |
| `follower_max` | integer | no | `100000` | Maximum follower count filter |
| `platform` | string | no | `"instagram"` | Platform to search on |

### CampaignSenderCreate

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `gmail_account_id` | uuid | conditional | Gmail account ID. Exactly one of `gmail_account_id` or `smtp_account_id` must be provided. |
| `smtp_account_id` | uuid | conditional | SMTP account ID. Exactly one of `gmail_account_id` or `smtp_account_id` must be provided. |

**Validation**: `validate_exactly_one_account_type` — providing both or neither raises `ValueError`.

### CampaignRecipientCreate

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `email` | EmailStr | yes | — | Validated email format |
| `name` | string | no | `null` | Recipient display name |
| `custom_fields` | object | no | `{}` | Key-value pairs for template merge tags |

### CampaignSenderDetailResponse

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `id` | uuid | no | Sender record ID |
| `sender_email` | string | no | Email address of the sender |
| `thread_count` | integer | no | Number of threads for this sender in the campaign |
| `account_name` | string | no | Derived from email (local part before @) |

---

## Campaign Core CRUD

### `cheerful_list_campaigns`

**Status**: EXISTS — needs enhancement

**Purpose**: List the authenticated user's campaigns with optional stats and status filtering.

**Maps to**: `GET /api/service/campaigns`

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (returns user's own campaigns + campaigns they are assigned to via `campaign_member_assignment`).

**Current implementation (bugs/gaps)**:
- `ListCampaignsInput` is an empty model — tool takes zero user-facing parameters
- Service route (`GET /api/service/campaigns`) accepts only `user_id` query param
- Service route hardcodes filter to `ACTIVE` and `PAUSED` only — no DRAFT or COMPLETED campaigns returned
- `ServiceCampaignResponse` returns 6 fields: `id` (str), `name`, `campaign_type`, `status`, `slack_channel_id`, `created_at`
- XML formatter (`_fmt_campaign`) reads `campaign.get("type")` but backend returns `campaign_type` — **always falls back to "unknown"**
- XML formatter reads `gmail_account_id` which doesn't exist in `ServiceCampaignResponse` — **always empty string**
- XML formatter drops `status` and `slack_channel_id` from output
- Main API endpoint supports `include_stats`, `campaign_ids` — not exposed in service route
- Main API includes team-accessible campaigns (via `CampaignMemberAssignmentRepository.get_accessible_campaign_ids`) — service route uses `get_by_user_id` which is owner-only

**Parameters** (proposed — requires service route update):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| include_stats | boolean | no | `false` | Include per-campaign stats: `sent_count`, `thread_count`, `pending_count`, `failed_count`, `total_recipients`. Stats come from outbox queue aggregation + unified recipient count + campaign thread count. |
| statuses | string[] | no | `["active", "paused"]` | Filter by campaign status. Valid values: `"active"`, `"paused"`, `"draft"`, `"completed"`. Pass all four to get all campaigns. |
| campaign_ids | uuid[] | no | `null` | Filter to specific campaign IDs. Results are intersected with user's accessible campaigns (owned + assigned). |

**Parameter Validation Rules**:
- `statuses` values must each be one of: `"active"`, `"paused"`, `"draft"`, `"completed"`. Invalid values return 422 Unprocessable Entity.
- `campaign_ids` must be valid UUID format. Invalid UUIDs return 422 Unprocessable Entity.

**Return Schema**:
```json
[
  {
    "id": "uuid — Campaign ID",
    "user_id": "uuid — Campaign owner's user ID",
    "product_id": "uuid | null — Primary product ID",
    "product_ids": ["uuid — Additional product IDs (from campaign_product junction table)"],
    "name": "string — Campaign name",
    "campaign_type": "string — One of: paid_promotion, creator, gifting, sales, other",
    "status": "string — One of: active, paused, draft, completed",
    "is_external": "boolean — Whether campaign is external",
    "automation_level": "string | null — Automation level setting",
    "image_url": "string | null — Campaign image URL",
    "brand_logo_url": "string | null — Brand logo URL (from brand table via brand_id FK)",
    "brand_name": "string | null — Brand name (from brand table via brand_id FK)",
    "subject_template": "string — Email subject template with {merge_tags}",
    "body_template": "string — Email body template with {merge_tags}",
    "agent_name_for_llm": "string — Agent display name for AI drafting (default: empty string)",
    "rules_for_llm": "string — Rules/constraints for AI drafting (default: empty string)",
    "goal_for_llm": "string — Campaign goal for AI drafting context (default: empty string)",
    "frequently_asked_questions_for_llm": "list[dict] | null — FAQ entries for AI drafting",
    "sample_emails_for_llm": "dict | null — Sample email data for AI tone matching",
    "is_follow_up_enabled": "boolean — Whether automated follow-ups are enabled",
    "follow_up_gap_in_days": "integer — Days between follow-ups (default: 3)",
    "max_follow_ups": "integer — Maximum number of follow-ups (default: 3)",
    "follow_up_templates": "list[FollowUpTemplate] | null — Follow-up email templates",
    "is_lookalike_suggestions_enabled": "boolean — Whether lookalike creator suggestions are enabled",
    "post_tracking_enabled": "boolean — Whether post tracking is enabled (default: false)",
    "discovery_enabled": "boolean — Whether auto-discovery is enabled (default: false)",
    "discovery_config": "dict | null — Auto-discovery configuration object",
    "slack_channel_id": "string | null — Slack channel ID for notifications",
    "google_sheet_url": "string | null — Google Sheet URL for recipient import",
    "google_sheet_tab_name": "string | null — Sheet tab name",
    "google_sheet_data_instructions": "string | null — Instructions for sheet data parsing",
    "google_sheet_columns_to_skip": "string[] — Columns to exclude from import (default: [])",
    "google_sheet_error": "string | null — Last sheet validation error message",
    "google_sheet_error_at": "datetime | null — Timestamp of last sheet validation error",
    "recipient_emails": ["string — Email addresses of all campaign recipients"],
    "sender_emails": ["string — Email addresses of all campaign senders"],
    "created_at": "datetime — ISO 8601 creation timestamp",
    "updated_at": "datetime — ISO 8601 last update timestamp",
    "sent_count": "integer | null — Outbox entries with status=sent (only when include_stats=true)",
    "thread_count": "integer | null — CampaignThread records count (only when include_stats=true)",
    "pending_count": "integer | null — Outbox entries with status=pending (only when include_stats=true)",
    "failed_count": "integer | null — Outbox entries with status=failed (only when include_stats=true)",
    "total_recipients": "integer | null — Unified participant count (only when include_stats=true)",
    "sender_details": "null — Not populated on list endpoint (only on get-by-ID)"
  }
]
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Invalid status values | "value is not a valid enumeration member..." | 422 |
| Invalid UUID format in campaign_ids | "value is not a valid uuid" | 422 |

**Pagination**: No pagination — returns all matching campaigns. The main API list endpoint has no limit/offset parameters.

**Example Request**:
```
cheerful_list_campaigns()
cheerful_list_campaigns(include_stats=true)
cheerful_list_campaigns(statuses=["active", "draft"], include_stats=true)
cheerful_list_campaigns(campaign_ids=["550e8400-e29b-41d4-a716-446655440000"])
```

**Example Response** (with `include_stats=true`):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "83a3177e-0307-4e5f-ae4e-4bc823db56e9",
    "product_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "product_ids": ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
    "name": "Summer Gifting 2026",
    "campaign_type": "gifting",
    "status": "active",
    "is_external": false,
    "automation_level": null,
    "image_url": null,
    "brand_logo_url": "https://cdn.brandfetch.io/example.png",
    "brand_name": "Example Brand",
    "subject_template": "Hi {name}, free product from Example Brand!",
    "body_template": "Hey {name},\n\nWe love your content and would like to send you...",
    "agent_name_for_llm": "Sarah",
    "rules_for_llm": "Keep it casual and friendly. Don't mention competitors.",
    "goal_for_llm": "Get creators to accept a free product for an Instagram post",
    "frequently_asked_questions_for_llm": [{"q": "What sizes?", "a": "S, M, L, XL"}],
    "sample_emails_for_llm": {"reply_example": "Thanks so much! I'd love to try it..."},
    "is_follow_up_enabled": true,
    "follow_up_gap_in_days": 3,
    "max_follow_ups": 2,
    "follow_up_templates": [
      {"index": 0, "body_template": "Hi {name}, just following up...", "hours_since_last_email": 72}
    ],
    "is_lookalike_suggestions_enabled": true,
    "post_tracking_enabled": false,
    "discovery_enabled": false,
    "discovery_config": null,
    "slack_channel_id": "C0123456789",
    "google_sheet_url": null,
    "google_sheet_tab_name": null,
    "google_sheet_data_instructions": null,
    "google_sheet_columns_to_skip": [],
    "google_sheet_error": null,
    "google_sheet_error_at": null,
    "recipient_emails": ["creator1@example.com", "creator2@example.com"],
    "sender_emails": ["outreach@example.com"],
    "created_at": "2026-01-15T10:30:00Z",
    "updated_at": "2026-02-20T14:45:00Z",
    "sent_count": 45,
    "thread_count": 42,
    "pending_count": 5,
    "failed_count": 2,
    "total_recipients": 50,
    "sender_details": null
  }
]
```

**Slack Formatting Notes**:
- Default (no stats): Present as a numbered list: `1. Summer Gifting 2026 (gifting, active) — created Jan 15`
- With stats: Add inline stats: `1. Summer Gifting 2026 (gifting, active) — 45 sent, 5 pending, 2 failed, 50 recipients`
- If >10 campaigns, summarize by status: "12 campaigns: 8 active, 2 paused, 1 draft, 1 completed"
- Include campaign IDs in a code block for easy reference

**Edge Cases**:
- User with no campaigns: Returns empty array `[]`
- Team member access: Returns campaigns owned by user + campaigns assigned to user via `campaign_member_assignment`
- `campaign_ids` with IDs user can't access: Those IDs are silently filtered out (intersection with accessible IDs)
- Stats for campaign with no outbox entries: `sent_count=0`, `pending_count=0`, `failed_count=0`; `total_recipients` comes from unified participant count (independent of outbox)

**Service Route Changes Needed**:
1. Update `GET /api/service/campaigns` to accept `include_stats` (bool), `statuses` (string[]), `campaign_ids` (uuid[]) query params
2. Replace `repo.get_by_user_id(user_id)` with `CampaignMemberAssignmentRepository.get_accessible_campaign_ids(user_id)` for team access support
3. Remove Python-level ACTIVE/PAUSED filter; use `statuses` param instead
4. Return full `CampaignResponse` instead of `ServiceCampaignResponse` (6 fields → full model)
5. Fix XML formatter: read `campaign_type` not `type`; remove `gmail_account_id`; add `status`, `slack_channel_id`

---

### `cheerful_get_campaign`

**Status**: NEW

**Purpose**: Get a single campaign by ID with full details and optional per-sender thread count breakdown.

**Maps to**: `GET /api/service/campaigns/{campaign_id}` (new service route needed; main route: `GET /campaigns/{campaign_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner or assigned team member (verified via `CampaignMemberAssignmentRepository.can_access_campaign(user_id, campaign_id)`).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID to retrieve |
| include_sender_details | boolean | no | `false` | When `true`, includes `sender_details` array with per-sender thread counts and account names |

**Parameter Validation Rules**:
- `campaign_id` must be a valid UUID. Invalid format returns 422 Unprocessable Entity.

**Return Schema**:
```json
{
  "id": "uuid — Campaign ID",
  "user_id": "uuid — Campaign owner's user ID",
  "product_id": "uuid | null — Primary product ID (null for external campaigns or when no product set)",
  "product_ids": ["uuid — All associated product IDs from campaign_product junction table"],
  "name": "string — Campaign name",
  "campaign_type": "string — One of: paid_promotion, creator, gifting, sales, other",
  "status": "string — One of: active, paused, draft, completed",
  "is_external": "boolean — Whether campaign is external (no product/recipients required)",
  "automation_level": "string | null — Automation level setting",
  "image_url": "string | null — Campaign image URL",
  "brand_logo_url": "string | null — Brand logo URL (resolved from brand table via campaign.brand_id)",
  "brand_name": "string | null — Brand name (resolved from brand table via campaign.brand_id)",
  "subject_template": "string — Email subject template with {merge_tags}",
  "body_template": "string — Email body template with {merge_tags}",
  "agent_name_for_llm": "string — Agent display name for AI drafting",
  "rules_for_llm": "string — Rules/constraints for AI drafting",
  "goal_for_llm": "string — Campaign goal for AI drafting context",
  "frequently_asked_questions_for_llm": "list[dict] | null — FAQ entries for AI drafting",
  "sample_emails_for_llm": "dict | null — Sample email data for AI tone matching",
  "is_follow_up_enabled": "boolean — Whether automated follow-ups are enabled",
  "follow_up_gap_in_days": "integer — Days between follow-ups",
  "max_follow_ups": "integer — Maximum number of follow-ups",
  "follow_up_templates": "list[FollowUpTemplate] | null — Validated via model_validate on read",
  "is_lookalike_suggestions_enabled": "boolean",
  "post_tracking_enabled": "boolean",
  "discovery_enabled": "boolean",
  "discovery_config": "dict | null — Raw dict (not DiscoveryConfig model) on response",
  "slack_channel_id": "string | null",
  "google_sheet_url": "string | null",
  "google_sheet_tab_name": "string | null",
  "google_sheet_data_instructions": "string | null",
  "google_sheet_columns_to_skip": "string[]",
  "google_sheet_error": "string | null — Last sheet validation error message",
  "google_sheet_error_at": "datetime | null — When the last sheet error occurred",
  "recipient_emails": ["string — All campaign recipient email addresses"],
  "sender_emails": ["string — All campaign sender email addresses"],
  "created_at": "datetime — ISO 8601",
  "updated_at": "datetime — ISO 8601",
  "sent_count": "null — Not populated on single-get (use cheerful_list_campaigns with include_stats for this)",
  "thread_count": "null",
  "pending_count": "null",
  "failed_count": "null",
  "total_recipients": "null",
  "sender_details": [
    {
      "id": "uuid — CampaignSender record ID",
      "sender_email": "string — Email address",
      "thread_count": "integer — Number of threads for this sender",
      "account_name": "string — Local part of email (before @)"
    }
  ]
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Campaign not found | "Campaign not found" | 404 |
| User does not own and is not assigned to campaign | "Not authorized" | 403 |
| Invalid campaign_id format | "value is not a valid uuid" | 422 |

**Example Request**:
```
cheerful_get_campaign(campaign_id="550e8400-e29b-41d4-a716-446655440000")
cheerful_get_campaign(campaign_id="550e8400-e29b-41d4-a716-446655440000", include_sender_details=true)
```

**Example Response** (with `include_sender_details=true`, abbreviated):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "83a3177e-0307-4e5f-ae4e-4bc823db56e9",
  "product_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "product_ids": ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
  "name": "Summer Gifting 2026",
  "campaign_type": "gifting",
  "status": "active",
  "is_external": false,
  "automation_level": null,
  "image_url": null,
  "brand_logo_url": "https://cdn.brandfetch.io/example.png",
  "brand_name": "Example Brand",
  "subject_template": "Hi {name}, free product from Example Brand!",
  "body_template": "Hey {name},\n\nWe love your content...",
  "agent_name_for_llm": "Sarah",
  "rules_for_llm": "Keep it casual.",
  "goal_for_llm": "Get creators to accept free product",
  "frequently_asked_questions_for_llm": null,
  "sample_emails_for_llm": null,
  "is_follow_up_enabled": true,
  "follow_up_gap_in_days": 3,
  "max_follow_ups": 2,
  "follow_up_templates": [
    {"index": 0, "body_template": "Just following up...", "hours_since_last_email": 72}
  ],
  "is_lookalike_suggestions_enabled": false,
  "post_tracking_enabled": false,
  "discovery_enabled": false,
  "discovery_config": null,
  "slack_channel_id": "C0123456789",
  "google_sheet_url": null,
  "google_sheet_tab_name": null,
  "google_sheet_data_instructions": null,
  "google_sheet_columns_to_skip": [],
  "google_sheet_error": null,
  "google_sheet_error_at": null,
  "recipient_emails": ["creator1@example.com", "creator2@example.com"],
  "sender_emails": ["outreach@example.com", "outreach2@example.com"],
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-02-20T14:45:00Z",
  "sent_count": null,
  "thread_count": null,
  "pending_count": null,
  "failed_count": null,
  "total_recipients": null,
  "sender_details": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "sender_email": "outreach@example.com",
      "thread_count": 28,
      "account_name": "outreach"
    },
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "sender_email": "outreach2@example.com",
      "thread_count": 14,
      "account_name": "outreach2"
    }
  ]
}
```

**Slack Formatting Notes**:
- Present as a structured block:
  ```
  *Summer Gifting 2026* (gifting, active)
  Product: Example Brand Product
  Senders: outreach@example.com (28 threads), outreach2@example.com (14 threads)
  Recipients: 50 total
  Follow-ups: enabled (max 2, every 3 days)
  Created: Jan 15, 2026
  ```
- If `include_sender_details=true`, show per-sender breakdown
- Omit null/empty fields from display
- For AI config fields (`agent_name_for_llm`, `rules_for_llm`, etc.), only show if explicitly asked

**Edge Cases**:
- Campaign exists but user has no access: Returns 403 "Not authorized"
- Campaign with no senders: `sender_emails` is `[]`, `sender_details` is `[]` (if requested)
- Campaign with no recipients: `recipient_emails` is `[]`
- Campaign with no brand: `brand_logo_url` and `brand_name` are both `null`
- `follow_up_templates` stored as raw JSONB: Re-validated via `FollowUpTemplate.model_validate()` on read — if data is corrupt, may raise validation error

---

### `cheerful_create_campaign`

**Status**: NEW

**Purpose**: Create a new campaign with full configuration. This is the direct-create path — most users will use the draft/wizard flow (`cheerful_save_campaign_draft` → `cheerful_launch_campaign`) instead. The Slack agent may use this for quick campaign creation with minimal config.

**Maps to**: `POST /api/service/campaigns` (new service route needed; main route: `POST /campaigns/`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (any user can create campaigns).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | yes | — | Campaign name. No length limit enforced at API level (DB column is `Text`). |
| campaign_type | enum | yes | — | One of: `"gifting"`, `"paid_promotion"`, `"sales"`, `"creator"`, `"other"` |
| subject_template | string | yes | — | Email subject template. Supports `{merge_tags}` from recipient custom_fields. |
| body_template | string | yes | — | Email body template. Supports `{merge_tags}` from recipient custom_fields. |
| product_id | uuid | conditional | `null` | Primary product ID. Required when `is_external=false` AND `product_ids` is empty. Must be owned by the authenticated user. |
| product_ids | uuid[] | no | `[]` | Additional product IDs. All must be owned by authenticated user. |
| senders | object[] | yes | — | Sender accounts. Array of `CampaignSenderCreate` objects. `min_length=1` — at least one sender required. Each entry must have exactly one of `gmail_account_id` or `smtp_account_id`. All accounts must be owned by authenticated user. |
| recipients | object[] | conditional | — | Array of `CampaignRecipientCreate` objects. `min_length=0`. Must be non-empty when `is_external=false`. Idempotent by `(campaign_id, email)` — duplicates within the array are skipped. |
| status | enum | no | `"active"` | One of: `"active"`, `"paused"`, `"draft"`, `"completed"` |
| is_external | boolean | no | `false` | When `true`, `recipients` can be empty and `product_id` is not required |
| automation_level | string | no | `null` | Automation level setting |
| image_url | string | no | `null` | Campaign image URL |
| agent_name_for_llm | string | no | `""` | Agent display name for AI drafting |
| rules_for_llm | string | no | `""` | Rules/constraints for AI drafting |
| goal_for_llm | string | no | `""` | Campaign goal for AI drafting context |
| frequently_asked_questions_for_llm | list[dict] | no | `null` | FAQ entries for AI drafting |
| sample_emails_for_llm | dict | no | `null` | Sample email data for AI tone matching |
| is_follow_up_enabled | boolean | no | `false` | Enable automated follow-ups |
| follow_up_gap_in_days | integer | no | `3` | Days between follow-ups |
| max_follow_ups | integer | no | `3` | Maximum follow-up count |
| follow_up_templates | FollowUpTemplate[] | no | `null` | Follow-up email templates. Max 10 entries. Indices must be sequential starting from 0 with no gaps or duplicates. |
| is_lookalike_suggestions_enabled | boolean | no | `false` | Enable lookalike creator suggestions |
| discovery_enabled | boolean | no | `false` | Enable auto-discovery |
| discovery_config | DiscoveryConfig | no | `null` | Auto-discovery configuration (see DiscoveryConfig schema above) |
| google_sheet_url | string | no | `null` | Google Sheet URL for recipient import. Must be provided with `google_sheet_tab_name` and `google_sheet_data_instructions` (all-or-nothing). |
| google_sheet_tab_name | string | no | `null` | Sheet tab name. Part of all-or-nothing Google Sheet group. |
| google_sheet_data_instructions | string | no | `null` | Instructions for sheet data parsing. Part of all-or-nothing Google Sheet group. |
| google_sheet_columns_to_skip | string[] | no | `[]` | Columns to exclude from sheet import |
| cc_emails | EmailStr[] | no | `[]` | CC email addresses for all outgoing campaign emails. Validated email format. |
| slack_channel_id | string | no | `null` | Slack channel ID for campaign notifications |

**Parameter Validation Rules**:
- `campaign_type` must be one of the 5 enum values. Invalid value returns 422.
- `senders` must have `min_length=1`. Empty array returns 422.
- `recipients` must be non-empty when `is_external=false`. Violation returns 422: "Recipients cannot be empty for non-external campaigns."
- `product_id` (or at least one entry in `product_ids`) is required when `is_external=false`. Violation returns 422: "Product is required for non-external campaigns."
- Google Sheet fields: providing any one of `google_sheet_url`, `google_sheet_tab_name`, `google_sheet_data_instructions` without the others returns 422: "All Google Sheet fields must be provided together or none at all."
- `follow_up_templates`: indices must be sequential 0-based integers. Gaps or duplicates return 422.
- `follow_up_templates`: max 10 entries. Exceeding returns 422.
- Each sender must have exactly one of `gmail_account_id` or `smtp_account_id`. Both or neither returns 422.
- Each sender account must exist and be owned by authenticated user. Not found returns 404. Not owned returns 403: "Not authorized to use this Gmail account" / "Not authorized to use this SMTP account".
- `product_id` must exist and be owned by authenticated user. Not found returns 404: "Product not found". Not owned returns 403: "Not authorized to use this product".
- Each `product_ids` entry must exist and be owned by user. Same error messages as `product_id`.
- `cc_emails` entries must be valid email format. Invalid returns 422.

**Return Schema**: Same as `cheerful_get_campaign` response (full `CampaignResponse`). Stats fields (`sent_count`, etc.) are `null` (not computed on create). `sender_details` is `null`. `recipient_emails` and `sender_emails` populated from newly created records.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Missing name/campaign_type/subject_template/body_template | Pydantic validation error (field required) | 422 |
| Non-external campaign with empty recipients | "Recipients cannot be empty for non-external campaigns" | 422 |
| Non-external campaign with no product | "Product is required for non-external campaigns" | 422 |
| Google Sheet fields partially provided | "All Google Sheet fields must be provided together or none at all" | 422 |
| Product not found | "Product not found" | 404 |
| Product not owned by user | "Not authorized to use this product" | 403 |
| Gmail account not found | "Gmail account not found: {account_id}" | 404 |
| Gmail account not owned by user | "Not authorized to use this Gmail account" | 403 |
| SMTP account not found | "SMTP account not found: {account_id}" | 404 |
| SMTP account not owned by user | "Not authorized to use this SMTP account" | 403 |
| Sender with both gmail and smtp IDs | Pydantic: "Exactly one of gmail_account_id or smtp_account_id must be provided" | 422 |
| Follow-up template index gaps/duplicates | Pydantic validation error | 422 |
| DB constraint violation (e.g. duplicate campaign name?) | "Campaign creation failed due to constraint violation" | 409 |

**Example Request**:
```
cheerful_create_campaign(
  name="Holiday Gifting Q4",
  campaign_type="gifting",
  subject_template="Hi {name}, holiday gift from us!",
  body_template="Hey {name},\n\nWe'd love to send you our new holiday collection...",
  product_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  senders=[{"gmail_account_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"}],
  recipients=[
    {"email": "creator@example.com", "name": "Jane Creator", "custom_fields": {"size": "M"}},
    {"email": "influencer@example.com", "name": "John Influencer"}
  ],
  is_follow_up_enabled=true,
  max_follow_ups=2,
  follow_up_templates=[
    {"index": 0, "body_template": "Hi {name}, just checking in...", "hours_since_last_email": 72}
  ],
  slack_channel_id="C0123456789"
)
```

**Example Response**:
```json
{
  "id": "new-campaign-uuid-here",
  "user_id": "83a3177e-0307-4e5f-ae4e-4bc823db56e9",
  "product_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "product_ids": ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
  "name": "Holiday Gifting Q4",
  "campaign_type": "gifting",
  "status": "active",
  "is_external": false,
  "subject_template": "Hi {name}, holiday gift from us!",
  "body_template": "Hey {name},\n\nWe'd love to send you our new holiday collection...",
  "recipient_emails": ["creator@example.com", "influencer@example.com"],
  "sender_emails": ["outreach@example.com"],
  "created_at": "2026-03-01T12:00:00Z",
  "updated_at": "2026-03-01T12:00:00Z"
}
```

**Slack Formatting Notes**:
- On success: "Campaign *Holiday Gifting Q4* created successfully (ID: `{id}`). {N} recipients, {M} senders configured."
- Remind user: "Run `cheerful_populate_campaign_outbox` to queue emails for sending."
- If campaign created with `status=draft`: "Campaign saved as draft. Use `cheerful_update_campaign` to modify, then change status to `active` when ready."

**Side Effects**:
- Creates `campaign_recipient` records (idempotent by campaign_id + email)
- Creates `campaign_sender` records (idempotent)
- Creates `campaign_product` junction records (idempotent)
- For Augmentum users (`@augmentumis.com`): triggers a Temporal `SyncSheetCreatorsWorkflow` if `google_sheet_url` is set
- Does NOT automatically populate the outbox queue — user must call `cheerful_populate_campaign_outbox` separately

**Edge Cases**:
- Duplicate recipient emails in the array: Silently deduplicated (idempotent insert)
- Creating campaign with status="draft": Valid — creates a draft that won't process emails
- Creating campaign without recipients but is_external=true: Valid
- Creating campaign with only SMTP senders (no Gmail): Valid — each sender needs exactly one of gmail_account_id or smtp_account_id

---

### `cheerful_update_campaign`

**Status**: NEW

**Purpose**: Update an existing campaign's configuration. All fields are optional — only provided fields are updated. Uses PATCH semantics (null = don't update, explicit value = set).

**Maps to**: `PUT /api/service/campaigns/{campaign_id}` (new service route needed; main route: `PUT /campaigns/{campaign_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner or assigned team member (verified via `CampaignMemberAssignmentRepository.can_access_campaign(user_id, campaign_id)`).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID to update |
| name | string | no | `null` (no change) | Campaign name |
| campaign_type | enum | no | `null` (no change) | One of: `"gifting"`, `"paid_promotion"`, `"sales"`, `"creator"`, `"other"` |
| status | enum | no | `null` (no change) | One of: `"active"`, `"paused"`, `"draft"`, `"completed"`. See side effects for status transitions. |
| is_external | boolean | no | `null` (no change) | External campaign flag |
| automation_level | string | no | `null` (no change) | Automation level setting |
| image_url | string | no | `null` (no change) | Campaign image URL |
| product_id | uuid | no | `null` (no change) | Primary product ID. Must be owned by campaign owner (checked against `campaign.user_id`, not the requesting user). |
| product_ids | uuid[] | no | `null` (no change) | Replaces ALL product associations via junction table (`campaign_product_repo.replace_for_campaign`). All must be owned by campaign owner. |
| subject_template | string | no | `null` (no change) | Email subject template |
| body_template | string | no | `null` (no change) | Email body template |
| agent_name_for_llm | string | no | `null` (no change) | Agent display name for AI drafting |
| rules_for_llm | string | no | `null` (no change) | Rules/constraints for AI drafting |
| goal_for_llm | string | no | `null` (no change) | Campaign goal for AI drafting context |
| frequently_asked_questions_for_llm | list[dict] | no | `null` (no change) | FAQ entries for AI drafting |
| sample_emails_for_llm | dict | no | `null` (no change) | Sample email data for AI tone matching |
| is_follow_up_enabled | boolean | no | `null` (no change) | Enable automated follow-ups |
| follow_up_gap_in_days | integer | no | `null` (no change) | Days between follow-ups |
| max_follow_ups | integer | no | `null` (no change) | Maximum follow-up count |
| follow_up_templates | FollowUpTemplate[] | no | `null` (no change) | Follow-up email templates. Max 10. `null` = don't update, `[]` = clear all templates (stored as `null` in DB). |
| is_lookalike_suggestions_enabled | boolean | no | `null` (no change) | Enable lookalike creator suggestions |
| post_tracking_enabled | boolean | no | `null` (no change) | Enable post tracking (not in create — update only) |
| discovery_enabled | boolean | no | `null` (no change) | Enable auto-discovery |
| discovery_config | DiscoveryConfig | no | `null` (no change) | Auto-discovery configuration |
| slack_channel_id | string | no | `null` (no change) | Slack channel ID. Setting to empty string `""` clears the value (stored as `null`). |
| google_sheet_url | string | no | `null` (no change) | Google Sheet URL. Changing clears `google_sheet_error` and `google_sheet_error_at`. All-or-nothing with tab_name and data_instructions. |
| google_sheet_tab_name | string | no | `null` (no change) | Sheet tab name. Changing clears `google_sheet_error` and `google_sheet_error_at`. |
| google_sheet_data_instructions | string | no | `null` (no change) | Instructions for sheet data parsing. Part of all-or-nothing group. |
| google_sheet_columns_to_skip | string[] | no | `null` (no change) | Columns to exclude from sheet import |

**Parameter Validation Rules**:
- `campaign_type` must be valid enum value if provided. Invalid returns 422.
- `status` must be valid enum value if provided. Invalid returns 422.
- Google Sheet fields: partial update rejected — must provide all three (`google_sheet_url`, `google_sheet_tab_name`, `google_sheet_data_instructions`) or none. Violation returns 422.
- `follow_up_templates`: same sequential 0-based index validation as create. Max 10.
- `product_id` ownership is checked against `campaign.user_id` (the campaign owner), NOT the requesting user. This means a team member updating the campaign must reference products owned by the campaign owner.
- `product_ids` replaces ALL product associations — not additive. Omitting `product_ids` (null) leaves existing associations unchanged.

**Return Schema**: Same as `cheerful_get_campaign` response (full `CampaignResponse`). Stats and `sender_details` are `null`.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Campaign not found | "Campaign not found" | 404 |
| User not authorized | "Not authorized" | 403 |
| Product not found | "Product not found" | 404 |
| Product not owned by campaign owner | "Not authorized to use this product" | 403 |
| Google Sheet fields partially provided | "All Google Sheet fields must be provided together or none at all" | 422 |
| Follow-up template validation failure | Pydantic validation error | 422 |
| DB constraint violation | "Campaign update failed due to constraint violation" | 409 |

**Example Request**:
```
cheerful_update_campaign(
  campaign_id="550e8400-e29b-41d4-a716-446655440000",
  name="Summer Gifting 2026 — Updated",
  status="paused"
)

cheerful_update_campaign(
  campaign_id="550e8400-e29b-41d4-a716-446655440000",
  status="completed"
)

cheerful_update_campaign(
  campaign_id="550e8400-e29b-41d4-a716-446655440000",
  follow_up_templates=[]
)
```

**Example Response** (abbreviated):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Summer Gifting 2026 — Updated",
  "status": "paused",
  "updated_at": "2026-03-01T15:30:00Z"
}
```

**Slack Formatting Notes**:
- On success: "Campaign *{name}* updated. Changed: {list of changed fields}"
- On status change to "completed": "Campaign *{name}* marked as completed. All pending emails and follow-ups have been cancelled."
- On status change to "active" from "completed": "Campaign *{name}* reactivated."
- On pause: "Campaign *{name}* paused. No new emails will be sent until reactivated."

**Side Effects**:
- **Status → `completed`**: Sets `completed_at` timestamp. Cancels ALL pending outbox entries (`status=pending` → `status=cancelled`, `error_message="Campaign marked as completed"`). Cancels ALL pending follow-ups (same status/message change). Logs count of cancelled items.
- **Status → `active` from `completed`**: Clears `completed_at` (set to `null`). Does NOT re-queue cancelled items — those remain cancelled.
- **`google_sheet_url` or `google_sheet_tab_name` changed**: Clears `google_sheet_error` and `google_sheet_error_at` (error was for old sheet config).
- **`google_sheet_url` changed (for Augmentum users)**: Triggers `SyncSheetCreatorsWorkflow` Temporal workflow.
- **`product_ids` provided**: Replaces ALL campaign_product junction records via `replace_for_campaign()`.
- **`slack_channel_id` set to `""`**: Stored as `null` in DB (cleared).
- **`follow_up_templates` set to `[]`**: Stored as `null` in DB (cleared).

**Edge Cases**:
- Updating a campaign you're assigned to (not owner): Works for most fields. Product ownership is validated against campaign owner, not requesting user.
- Setting status to same value: No-op for the cancellation logic (only triggers on actual transition to/from completed).
- Updating only `product_ids` without `product_id`: `product_ids` replaces junction table; `product_id` column unchanged.
- Empty update (no fields provided): Returns current campaign state unchanged (no DB modifications).

---

### `cheerful_delete_campaign`

**Status**: NEW

**Purpose**: Permanently delete a campaign and all associated data. This is destructive and irreversible.

**Maps to**: `DELETE /api/service/campaigns/{campaign_id}` (new service route needed; main route: `DELETE /campaigns/{campaign_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner or assigned team member (verified via `CampaignMemberAssignmentRepository.can_access_campaign(user_id, campaign_id)`).

> **Note**: The main API endpoint uses `can_access_campaign` which allows assigned team members. The CE tool may want to restrict to owner-only for safety. This should be decided during implementation.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Campaign ID to permanently delete |

**Parameter Validation Rules**:
- `campaign_id` must be a valid UUID. Invalid format returns 422.

**Return Schema**:
```json
null
```
Backend returns HTTP 204 No Content. Tool should return a confirmation message string.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Campaign not found | "Campaign not found" | 404 |
| User not authorized | "Not authorized" | 403 |

**Example Request**:
```
cheerful_delete_campaign(campaign_id="550e8400-e29b-41d4-a716-446655440000")
```

**Example Response**:
```
"Campaign 550e8400-e29b-41d4-a716-446655440000 deleted successfully."
```

**Slack Formatting Notes**:
- Agent MUST confirm before deleting: "Are you sure you want to delete campaign *{name}*? This will permanently remove all recipients, threads, emails, workflows, and analytics. This cannot be undone."
- On success: "Campaign *{name}* has been permanently deleted along with all associated data."
- Agent should retrieve campaign name via `cheerful_get_campaign` before deleting so it can display the name in confirmation.

**Side Effects — Cascading Deletions**:

The following data is deleted (in order):

1. **Manual deletions** (no DB CASCADE):
   - `campaign_recipient` — All recipients
   - `campaign_sender` — All senders
   - `campaign_thread` — All thread associations
   - `campaign_creator` — All creator associations
   - `thread_review_queue.linked_thread_link_id` — Set to `NULL` for affected thread_links
   - `thread_link` — All thread links
   - `campaign_rule_suggestion_analytics` — All analytics records

2. **CASCADE deletions** (triggered by `db.delete(campaign)`):
   - `campaign_outbox_queue` — All outbox entries
   - `campaign_follow_up_outbox_queue` — All follow-up entries (cascades from outbox_queue)
   - `campaign_workflow` — All workflows
   - `campaign_workflow_execution` — All workflow executions
   - `campaign_lookalike_suggestion` — All lookalike suggestions
   - `campaign_product` — All product associations

**Edge Cases**:
- Deleting a campaign with active/pending emails in outbox: Emails are deleted, not sent. Any in `processing` state may still be sent if the email worker has already picked them up.
- Deleting a campaign with running Temporal workflows: The campaign record is deleted but Temporal workflows may still be running. They will fail gracefully when they can't find the campaign.
- Deleting a draft campaign: Works the same — all associated draft data is deleted.

---

### `cheerful_duplicate_campaign`

**Status**: NEW

**Purpose**: Create a copy of an existing campaign with DRAFT status. Copies configuration, senders (owner only), workflows, products (owner only), and email signature, but does NOT copy recipients, threads, outbox entries, or analytics.

**Maps to**: `POST /api/service/campaigns/{campaign_id}/duplicate` (new service route needed; main route: `POST /campaigns/{campaign_id}/duplicate`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner or assigned team member (verified via `CampaignMemberAssignmentRepository.can_access_campaign(user_id, campaign_id)`).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Source campaign ID to duplicate |

**Parameter Validation Rules**:
- `campaign_id` must be a valid UUID. Invalid format returns 422.
- Source campaign must exist. Not found returns 404.
- User must have access (owner or assigned member). Unauthorized returns 403.

**Return Schema**: Same as `cheerful_get_campaign` response (full `CampaignResponse`) representing the NEW campaign. Key differences from source:
- `id`: New UUID (not the source campaign ID)
- `user_id`: The requesting user's ID (which may differ from source campaign owner for team members)
- `name`: `"Copy of {source_name}"`
- `status`: Always `"draft"`
- `product_id`: Copied only if duplicator is the campaign owner; `null` for team members
- `product_ids`: Copied only if duplicator is the campaign owner; `[]` for team members
- `sender_emails`: Copied only if duplicator is the campaign owner; `[]` for team members
- `recipient_emails`: Always `[]` (recipients are never copied)
- `slack_channel_id`: `null` (not copied — source has a specific channel binding)
- `sender_details`: `null`
- All stats fields: `null`

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Campaign not found | "Campaign not found" | 404 |
| User not authorized | "Not authorized" | 403 |

**Example Request**:
```
cheerful_duplicate_campaign(campaign_id="550e8400-e29b-41d4-a716-446655440000")
```

**Example Response** (abbreviated):
```json
{
  "id": "new-duplicate-uuid",
  "user_id": "83a3177e-0307-4e5f-ae4e-4bc823db56e9",
  "product_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "product_ids": ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
  "name": "Copy of Summer Gifting 2026",
  "campaign_type": "gifting",
  "status": "draft",
  "is_external": false,
  "subject_template": "Hi {name}, free product from Example Brand!",
  "body_template": "Hey {name},\n\nWe love your content...",
  "recipient_emails": [],
  "sender_emails": ["outreach@example.com"],
  "created_at": "2026-03-01T16:00:00Z",
  "updated_at": "2026-03-01T16:00:00Z"
}
```

**Slack Formatting Notes**:
- On success: "Campaign duplicated! New draft *Copy of {source_name}* created (ID: `{new_id}`). Status: draft. Add recipients and configure as needed, then launch."
- If team member duplicated: "Note: Senders and products were not copied because you are not the campaign owner. You'll need to add your own senders."

**Side Effects — What Gets Copied**:

| Data | Copied? | Notes |
|------|---------|-------|
| Campaign config (name, type, templates, LLM settings, follow-ups, discovery, sheet config) | Yes | Name prefixed with "Copy of ". Status always DRAFT. |
| Brand association (brand_id) | Yes | Same brand_id reference |
| Campaign senders | Owner only | Team members get no senders — they must add their own accounts |
| Campaign products (junction table) | Owner only | Team members get no products |
| Campaign workflows (enabled only) | Yes | All enabled workflows from source are copied with same config |
| Email signature | Yes | Content copied; new EmailSignature record created with `is_default=false` |
| Discovery config (discovery_enabled, discovery_config) | Yes | Copied from source |
| Post tracking config (post_tracking_enabled) | Yes | Copied from source |
| Recipients | No | `recipient_emails` is always `[]` |
| Threads | No | — |
| Outbox entries | No | — |
| Workflow executions | No | — |
| Analytics | No | — |
| Lookalike suggestions | No | — |
| Slack channel | No | `slack_channel_id` is `null` in the duplicate |

**Edge Cases**:
- Duplicating a draft campaign: Works — creates another draft from the draft
- Duplicating a completed campaign: Works — new campaign is DRAFT regardless of source status
- Team member duplicating: New campaign is owned by the team member. Senders, products NOT copied (they belong to the original owner). Signature content IS copied (it's just HTML text).
- Source campaign with disabled workflows: Only enabled workflows (`is_enabled=True`) are copied
- Source campaign with no email signature: No signature created for the duplicate

---

## Campaign Draft / Wizard

> **Context**: The campaign wizard is a multi-step form (steps 0-7) in the webapp. Users can save their progress at any point as a "draft" and resume later. The draft stores all wizard state in a `draft_metadata` JSONB column on the `campaign` table. When the user finishes the wizard, they "launch" the campaign, which converts the draft to an active campaign, creates recipients/senders/outbox/workflows, and starts sending.

### `cheerful_save_campaign_draft`

**Status**: NEW

**Purpose**: Save a new campaign wizard draft. Creates a `campaign` record with `status=draft` and stores all form state in the `draft_metadata` JSONB column. Does NOT create recipients, senders, or outbox entries.

**Maps to**: `POST /api/service/campaigns/draft` (new service route needed; main route: `POST /campaigns/draft` in `campaign_launch.py` line 920)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (creates draft owned by user).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_name | string | no | `null` | Campaign name. If `null`, stored as `"Untitled Draft"` in the `campaign.name` column. |
| campaign_type | enum | no | `null` | Frontend campaign type. One of: `"seeding"`, `"paid"`, `"sales"`, `"creator"`, `"gifting"`. Mapped to backend enum: `seeding`→`gifting`, `gifting`→`gifting`, `paid`→`paid_promotion`, `sales`→`sales`, `creator`→`creator`. If `null`, defaults to `CampaignType.OTHER` in the DB column. |
| is_external | boolean | no | `false` | External campaigns don't require recipients or email templates. |
| product_id | uuid | no | `null` | Existing product ID to link. Stored in the `campaign.product_id` column directly. |
| product_ids | uuid[] | no | `[]` | Additional product IDs. Stored as JSON string array in `draft_metadata.product_ids`. Not written to the `campaign_product` junction table until launch. |
| product_name | string | no | `null` | New product name (for products not yet in the `product` table). Stored in `draft_metadata.product_name`. |
| product_description | string | no | `null` | Product description for new products. Stored in `draft_metadata.product_description`. |
| additional_products | list[dict] | no | `null` | Additional product cards with name/description (for new products not yet in DB). Stored in `draft_metadata.additional_products`. Each dict has `name` (string) and `description` (string) keys. |
| subject_template | string | no | `null` | Email subject template with `{placeholders}`. Stored in both `campaign.subject_template` (as empty string if null) and `draft_metadata.subject_template`. |
| body_template | string | no | `null` | Email body HTML template with `{placeholders}`. Stored in both `campaign.body_template` (as empty string if null) and `draft_metadata.body_template`. |
| campaign_goal | string | no | `null` | Campaign goal text for AI drafting context. Stored in `campaign.goal_for_llm` and `draft_metadata.campaign_goal`. |
| campaign_faqs | list[dict] | no | `null` | FAQ list. Each dict has `question` (string) and `answer` (string) keys. Stored in `campaign.frequently_asked_questions_for_llm` and `draft_metadata.campaign_faqs`. |
| sample_emails | dict | no | `null` | Sample emails for AI tone matching. Freeform dict. Stored in `campaign.sample_emails_for_llm` and `draft_metadata.sample_emails`. |
| follow_up_templates | FollowUpTemplateInput[] | no | `null` | Follow-up email templates. Max 10. Each has `index` (int, ≥0), `body_template` (string, min 1 char), `hours_since_last_email` (int, >0). Indices must be sequential 0-based. Stored as JSON dicts in `campaign.follow_up_templates` and `draft_metadata.follow_up_templates`. Sets `campaign.is_follow_up_enabled=true` if provided. |
| google_sheet_url | string | no | `null` | Google Sheet URL for recipient tracking. Stored in `campaign.google_sheet_url`. |
| google_sheet_tab_name | string | no | `null` | Google Sheet tab name. Stored in `campaign.google_sheet_tab_name`. |
| tracking_rules | list[dict] | no | `null` | Tracking rules configuration. Each dict has `text` (string), optionally `isIgnored` (bool), `column` (string). Stored in `draft_metadata.tracking_rules` only (not in campaign columns until launch). |
| selected_accounts | list[string] | no | `null` | Email addresses of sender accounts. Stored in `draft_metadata.selected_accounts` only (not in `campaign_sender` table until launch). |
| cc_emails | list[string] | no | `null` | CC email addresses. Stored in `draft_metadata.cc_emails`. |
| creators_csv_data | list[dict] | no | `null` | Parsed CSV data with email and custom fields per row. Each dict has `email` (string) plus arbitrary custom field keys. Stored in `draft_metadata.creators_csv_data`. |
| creators_csv_headers | list[string] | no | `null` | CSV column headers in order. Stored in `draft_metadata.creators_csv_headers`. |
| search_creators | list[dict] | no | `null` | Creators added via Influencer Club search. Each dict has `id` (string), `platform` (string), `name` (string), `handle` (string), `email` (string or null), and other IC fields. Stored in `draft_metadata.search_creators`. |
| search_merged_emails | list[string] | no | `null` | Lowercase emails added to CSV data by the search flow (not from CSV upload). Used for removal tracking on hydration. Stored in `draft_metadata.search_merged_emails`. |
| email_signature | string | no | `null` | HTML email signature content. If provided, validated for max length (10,000 chars) and sanitized via `sanitize_signature_html()`. Creates an `EmailSignature` record linked to the campaign with `is_default=false`. |
| email_signature_enabled | boolean | no | `false` | Whether to append the signature to outbound emails. Sets `EmailSignature.is_enabled`. |

**Parameter Validation Rules**:
- `campaign_type`: Must be one of `"seeding"`, `"paid"`, `"sales"`, `"creator"`, `"gifting"` if provided. Invalid value returns 422.
- `follow_up_templates`: If provided, indices must be sequential starting from 0 with no gaps or duplicates. Violation: `ValueError: "follow_up_templates indices must be sequential starting from 0. Got indices {actual}, expected {expected}."` Returns 422.
- `email_signature`: Max 10,000 characters. Exceeded: `HTTPException 400: "Email signature exceeds maximum length of 10,000 characters"`.
- All fields are optional — a completely empty request creates a minimal draft with `name="Untitled Draft"`, `campaign_type=other`, `status=draft`.

**Return Schema**:
```json
{
  "campaign_id": "uuid — ID of the newly created draft campaign",
  "message": "string — Always 'Draft saved successfully'"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Invalid campaign_type value | Pydantic validation error: not a valid enum value | 422 |
| Follow-up template indices not sequential | "follow_up_templates indices must be sequential starting from 0..." | 422 |
| Email signature too long | "Email signature exceeds maximum length of 10,000 characters" | 400 |

**Pagination**: N/A

**Example Request**:
```
cheerful_save_campaign_draft(
  campaign_name="Summer Gifting 2026",
  campaign_type="gifting",
  product_name="Hydration Bottle Pro",
  product_description="Premium stainless steel water bottle, 32oz",
  subject_template="Hi {name}, we'd love to send you a {product}!",
  body_template="Hey {name},\n\nWe're big fans of your content and would love to send you our Hydration Bottle Pro...",
  selected_accounts=["outreach@brand.com", "sarah@brand.com"],
  campaign_goal="Send free products to 50 micro-influencers in the fitness niche"
)
```

**Example Response**:
```json
{
  "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "Draft saved successfully"
}
```

**Slack Formatting Notes**:
- On success: "Draft *{campaign_name}* saved (ID: `{campaign_id}`). Use `cheerful_update_campaign_draft` to continue editing, or `cheerful_launch_campaign` when ready to launch."
- If no campaign_name provided: "Draft saved as *Untitled Draft* (ID: `{campaign_id}`)."

**Edge Cases**:
- Saving a draft with no fields: Creates a minimal draft with `name="Untitled Draft"`, `campaign_type=other`. Valid operation.
- `product_id` references a non-existent product: The product_id is stored in the campaign column directly — no FK validation at save time. Validation happens at launch time.
- `selected_accounts` with invalid emails: Stored in `draft_metadata` as-is. Validation only happens at launch when sender accounts are looked up.
- `creators_csv_data` with invalid emails: Stored as-is. Validation happens at launch.
- Signature with HTML: The signature is sanitized via `sanitize_signature_html()` which strips dangerous tags/attributes. The sanitized version is stored, not the raw input.
- Creating multiple drafts: Each call creates a new draft — there is no "one draft per user" limit.

**Storage Architecture**:
The draft uses a dual-storage model:
1. **Campaign columns**: `name`, `campaign_type`, `status` (=DRAFT), `is_external`, `product_id`, `subject_template`, `body_template`, `goal_for_llm`, `frequently_asked_questions_for_llm`, `sample_emails_for_llm`, `is_follow_up_enabled`, `follow_up_templates`, `google_sheet_url`, `google_sheet_tab_name`
2. **`draft_metadata` JSONB column**: Everything else — including duplicates of some column values for the `campaign_name`/`campaign_type` frontend format, plus `selected_accounts`, `tracking_rules`, `cc_emails`, `creators_csv_data`, `creators_csv_headers`, `search_creators`, `search_merged_emails`, `product_name`, `product_description`, `product_ids`, `additional_products`

---

### `cheerful_update_campaign_draft`

**Status**: NEW

**Purpose**: Update an existing campaign wizard draft with new data. Only campaigns with `status=draft` can be updated via this endpoint.

**Maps to**: `PUT /api/service/campaigns/draft/{campaign_id}` (new service route needed; main route: `PUT /campaigns/draft/{campaign_id}` in `campaign_launch.py` line 1045)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner or assigned team member (verified via `CampaignMemberAssignmentRepository.can_access_campaign(user_id, campaign_id)`).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Draft campaign ID to update |
| campaign_name | string | no | `null` (no change) | Campaign name. If set to empty string, stored as `"Untitled Draft"`. |
| campaign_type | enum | no | `null` (no change) | Frontend campaign type. One of: `"seeding"`, `"paid"`, `"sales"`, `"creator"`, `"gifting"`. |
| is_external | boolean | no | `null` (no change) | External campaign flag. |
| product_id | uuid | no | `null` (no change) | Existing product ID. Stored in `campaign.product_id` column. |
| product_ids | uuid[] | no | `[]` (no change if empty) | Additional product IDs. Stored as JSON string array in `draft_metadata.product_ids`. |
| product_name | string | no | `null` (no change) | New product name for products not yet in DB. |
| product_description | string | no | `null` (no change) | Product description for new products. |
| additional_products | list[dict] | no | `null` (no change) | Additional product cards (name, description per entry). |
| subject_template | string | no | `null` (no change) | Email subject template. |
| body_template | string | no | `null` (no change) | Email body HTML template. |
| campaign_goal | string | no | `null` (no change) | Campaign goal text for AI. |
| campaign_faqs | list[dict] | no | `null` (no change) | FAQ list (question/answer pairs). |
| sample_emails | dict | no | `null` (no change) | Sample emails for AI tone. |
| follow_up_templates | FollowUpTemplateInput[] | no | `null` (no change) | Follow-up templates. Max 10. `null` = don't change, empty array `[]` = clear all follow-ups (sets `campaign.follow_up_templates=null`, `campaign.is_follow_up_enabled=false`). |
| google_sheet_url | string | no | `null` (no change) | Google Sheet URL. |
| google_sheet_tab_name | string | no | `null` (no change) | Sheet tab name. |
| tracking_rules | list[dict] | no | `null` (no change) | Tracking rules configuration. |
| selected_accounts | list[string] | no | `null` (no change) | Sender account email addresses. |
| cc_emails | list[string] | no | `null` (no change) | CC email addresses. |
| creators_csv_data | list[dict] | no | `null` (no change) | Parsed CSV data. |
| creators_csv_headers | list[string] | no | `null` (no change) | CSV column headers. |
| search_creators | list[dict] | no | `null` (no change) | Search-added creators. |
| search_merged_emails | list[string] | no | `null` (no change) | Search-merged email addresses. |
| email_signature | string | no | `null` (no change) | HTML email signature. Set to empty string `""` to remove the campaign's signature. Validated for max 10,000 chars and sanitized if non-empty. |
| email_signature_enabled | boolean | no | `false` | Whether signature is enabled. |

**Parameter Validation Rules**:
- `campaign_id` must be a valid UUID. Invalid format returns 422.
- `campaign_type`: Must be one of `"seeding"`, `"paid"`, `"sales"`, `"creator"`, `"gifting"` if provided. Invalid returns 422.
- Campaign must have `status=draft`. Non-draft returns `HTTPException 400: "Only draft campaigns can be updated via this endpoint"`.
- `follow_up_templates`: Same sequential 0-based index validation as save. Max 10.
- `email_signature`: Max 10,000 characters.
- Update uses merge semantics: the `draft_metadata` JSONB is updated with a full replace of the metadata dict (all keys are written, even if `null`). This means providing `null` for a field OVERWRITES the previously saved value in metadata. Only campaign column fields use `if request.field is not None` conditional update logic.

**Return Schema**:
```json
{
  "campaign_id": "uuid — ID of the updated draft campaign",
  "message": "string — Always 'Draft updated successfully'"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Campaign not found | "Campaign not found: {campaign_id}" | 404 |
| User not authorized | "Not authorized to update this campaign" | 403 |
| Campaign not a draft | "Only draft campaigns can be updated via this endpoint" | 400 |
| Invalid campaign_type | Pydantic validation error | 422 |
| Follow-up template indices not sequential | "follow_up_templates indices must be sequential starting from 0..." | 422 |
| Email signature too long | "Email signature exceeds maximum length of 10,000 characters" | 400 |

**Pagination**: N/A

**Example Request**:
```
cheerful_update_campaign_draft(
  campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  campaign_name="Summer Gifting 2026 — v2",
  follow_up_templates=[
    {"index": 0, "body_template": "Hi {name}, just following up on our gifting offer...", "hours_since_last_email": 72},
    {"index": 1, "body_template": "Hi {name}, last chance to claim your free product!", "hours_since_last_email": 120}
  ],
  selected_accounts=["outreach@brand.com", "sarah@brand.com", "mike@brand.com"]
)
```

**Example Response**:
```json
{
  "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "Draft updated successfully"
}
```

**Slack Formatting Notes**:
- On success: "Draft *{campaign_name}* updated (ID: `{campaign_id}`). Continue editing with `cheerful_update_campaign_draft` or launch with `cheerful_launch_campaign`."
- On 400 (not a draft): "This campaign is no longer a draft (status: {actual_status}). Use `cheerful_update_campaign` instead."

**Side Effects**:
- Updates `campaign.updated_at` timestamp on every update (explicit `datetime.now(timezone.utc)` assignment).
- Email signature management:
  - Non-empty `email_signature`: Creates or updates `EmailSignature` record for the campaign (note: signature belongs to the campaign OWNER, even if a team member is updating).
  - Empty string `email_signature=""`: Deletes the campaign's `EmailSignature` record if one exists.
  - `null` / not provided: No change to signature.

**Edge Cases**:
- Updating a campaign that was already launched (status=active): Returns 400 "Only draft campaigns can be updated via this endpoint". Use `cheerful_update_campaign` instead.
- Team member updating a draft: Works — access is via `can_access_campaign`. However, the email signature record's `user_id` is always set to the campaign OWNER (not the requesting team member).
- `draft_metadata` overwrite behavior: The update does a `dict.update()` on the existing metadata, overwriting ALL keys with the new values (including `null`s). If the save had `selected_accounts=["a@b.com"]` and the update sends `selected_accounts=null`, the metadata will contain `selected_accounts: null`.
- `follow_up_templates=[]` (empty list): Clears follow-ups — sets `campaign.follow_up_templates=null` and `campaign.is_follow_up_enabled=false`.
- `follow_up_templates=null`: No change to follow-ups.

---

### `cheerful_get_campaign_draft`

**Status**: NEW

**Purpose**: Load a saved campaign wizard draft with all stored state for form hydration. Returns data from both campaign columns and the `draft_metadata` JSONB, with product details resolved from the database.

**Maps to**: `GET /api/service/campaigns/draft/{campaign_id}` (new service route needed; main route: `GET /campaigns/draft/{campaign_id}` in `campaign_launch.py` line 1223)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner or assigned team member (verified via `CampaignMemberAssignmentRepository.can_access_campaign(user_id, campaign_id)`).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Draft campaign ID to load |

**Parameter Validation Rules**:
- `campaign_id` must be a valid UUID. Invalid format returns 422.
- Campaign must have `status=draft`. Non-draft returns `HTTPException 400: "Campaign is not a draft"`.

**Return Schema**:
```json
{
  "id": "uuid — Campaign ID",
  "campaign_name": "string | null — From draft_metadata.campaign_name or campaign.name",
  "campaign_type": "string | null — Frontend format: 'seeding', 'paid', 'sales', 'creator', 'gifting'. Resolved from draft_metadata.campaign_type first, then reverse-mapped from campaign.campaign_type (gifting→'gifting', paid_promotion→'paid', sales→'sales', creator→'creator', other→'sales')",
  "is_external": "boolean — Default false",

  "product_id": "uuid | null — Primary product ID from campaign.product_id column",
  "product_ids": "uuid[] — Product IDs from campaign_product junction table, or from draft_metadata.product_ids if junction is empty",
  "product_name": "string | null — If product_id exists: fetched from product.name. Otherwise: from draft_metadata.product_name",
  "product_description": "string | null — If product_id exists: fetched from product.description. Otherwise: from draft_metadata.product_description",
  "products": "list[dict] | null — Array of {id: string, name: string, description: string} for all products in product_ids. Null if no products.",
  "additional_products": "list[dict] | null — Additional product cards from draft_metadata (for new products not yet in DB)",

  "subject_template": "string | null — From draft_metadata.subject_template or campaign.subject_template",
  "body_template": "string | null — From draft_metadata.body_template or campaign.body_template",
  "campaign_goal": "string | null — From draft_metadata.campaign_goal or campaign.goal_for_llm",
  "campaign_faqs": "list[dict] | null — From draft_metadata.campaign_faqs or campaign.frequently_asked_questions_for_llm",
  "sample_emails": "dict | null — From draft_metadata.sample_emails or campaign.sample_emails_for_llm",
  "follow_up_templates": "list[dict] | null — From draft_metadata.follow_up_templates or campaign.follow_up_templates. Each dict: {index: int, body_template: string, hours_since_last_email: int}",

  "google_sheet_url": "string | null — From campaign.google_sheet_url",
  "google_sheet_tab_name": "string | null — From campaign.google_sheet_tab_name",
  "cc_emails": "list[string] | null — From draft_metadata.cc_emails",

  "selected_accounts": "list[string] | null — Sender account email addresses from draft_metadata.selected_accounts",
  "tracking_rules": "list[dict] | null — From draft_metadata.tracking_rules",

  "creators_csv_data": "list[dict] | null — From draft_metadata.creators_csv_data",
  "creators_csv_headers": "list[string] | null — From draft_metadata.creators_csv_headers",

  "search_creators": "list[dict] | null — From draft_metadata.search_creators",
  "search_merged_emails": "list[string] | null — From draft_metadata.search_merged_emails",

  "email_signature": "string | null — From EmailSignature.content if a campaign signature exists, otherwise null",
  "email_signature_enabled": "boolean — From EmailSignature.is_enabled if a campaign signature exists, otherwise false"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Campaign not found | "Campaign not found: {campaign_id}" | 404 |
| User not authorized | "Not authorized to view this campaign" | 403 |
| Campaign not a draft | "Campaign is not a draft" | 400 |

**Pagination**: N/A

**Example Request**:
```
cheerful_get_campaign_draft(campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890")
```

**Example Response**:
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "campaign_name": "Summer Gifting 2026",
  "campaign_type": "gifting",
  "is_external": false,
  "product_id": null,
  "product_ids": [],
  "product_name": "Hydration Bottle Pro",
  "product_description": "Premium stainless steel water bottle, 32oz",
  "products": null,
  "additional_products": null,
  "subject_template": "Hi {name}, we'd love to send you a {product}!",
  "body_template": "Hey {name},\n\nWe're big fans of your content and would love to send you our Hydration Bottle Pro...",
  "campaign_goal": "Send free products to 50 micro-influencers in the fitness niche",
  "campaign_faqs": null,
  "sample_emails": null,
  "follow_up_templates": [
    {"index": 0, "body_template": "Hi {name}, just following up on our gifting offer...", "hours_since_last_email": 72},
    {"index": 1, "body_template": "Hi {name}, last chance to claim your free product!", "hours_since_last_email": 120}
  ],
  "google_sheet_url": null,
  "google_sheet_tab_name": null,
  "cc_emails": null,
  "selected_accounts": ["outreach@brand.com", "sarah@brand.com"],
  "tracking_rules": null,
  "creators_csv_data": [
    {"email": "creator1@gmail.com", "name": "Jane Doe", "instagram": "@janedoe"},
    {"email": "creator2@gmail.com", "name": "John Smith", "tiktok": "@johnsmith"}
  ],
  "creators_csv_headers": ["email", "name", "instagram", "tiktok"],
  "search_creators": null,
  "search_merged_emails": null,
  "email_signature": "<p>Best regards,<br>The Brand Team</p>",
  "email_signature_enabled": true
}
```

**Slack Formatting Notes**:
- Present as a structured summary: "Draft: *{campaign_name}*\n• Type: {campaign_type}\n• Product: {product_name or 'Not set'}\n• Senders: {selected_accounts count} accounts\n• Recipients: {creators_csv_data length} from CSV, {search_creators length} from search\n• Follow-ups: {follow_up_templates length} configured\n• Status: Ready to launch / Missing {list of required fields}"
- If the agent needs to help the user complete the wizard, use this data to identify what's missing (no senders, no recipients, no email content, etc.).

**Edge Cases**:
- Draft with no product_id and no product_name in metadata: Returns `product_id=null`, `product_name=null`, `product_description=null`, `products=null`.
- Draft with `product_id` pointing to a deleted product: Returns `product_id=UUID`, `product_name=null`, `product_description=null` (product SELECT returns None).
- Draft with `product_ids` in metadata but not in junction table: Falls back to `draft_metadata.product_ids` and resolves them from the `product` table.
- `campaign_type` resolution priority: `draft_metadata.campaign_type` (frontend format) takes precedence. If null, reverse-maps from `campaign.campaign_type` using `CAMPAIGN_TYPE_REVERSE_MAP` (which maps `CampaignType.OTHER` → `"sales"`).
- Field resolution priority: For fields stored in both campaign columns and `draft_metadata`, the response prefers `draft_metadata` values first, falling back to column values if metadata is null. This means the frontend format is preserved.

---

### `cheerful_delete_campaign_draft`

**Status**: NEW

**Purpose**: Delete a campaign wizard draft permanently. Only campaigns with `status=draft` can be deleted via this endpoint.

**Maps to**: `DELETE /api/service/campaigns/draft/{campaign_id}` (new service route needed; main route: `DELETE /campaigns/draft/{campaign_id}` in `campaign_launch.py` line 1352)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner or assigned team member (verified via `CampaignMemberAssignmentRepository.can_access_campaign(user_id, campaign_id)`).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | Draft campaign ID to permanently delete |

**Parameter Validation Rules**:
- `campaign_id` must be a valid UUID. Invalid format returns 422.
- Campaign must have `status=draft`. Non-draft returns `HTTPException 400: "Only draft campaigns can be deleted via this endpoint"`.

**Return Schema**:
```json
null
```
Backend returns HTTP 204 No Content. Tool should return a confirmation message string.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Campaign not found | "Campaign not found: {campaign_id}" | 404 |
| User not authorized | "Not authorized to delete this campaign" | 403 |
| Campaign not a draft | "Only draft campaigns can be deleted via this endpoint" | 400 |

**Pagination**: N/A

**Example Request**:
```
cheerful_delete_campaign_draft(campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890")
```

**Example Response**:
```
"Draft campaign a1b2c3d4-e5f6-7890-abcd-ef1234567890 deleted successfully."
```

**Slack Formatting Notes**:
- Agent SHOULD confirm before deleting: "Are you sure you want to delete the draft *{campaign_name}*? This is permanent."
- On success: "Draft *{campaign_name}* has been deleted."
- Agent should retrieve draft name via `cheerful_get_campaign_draft` before deleting so it can display the name.

**Side Effects — Cascading Deletions**:
- The `db.delete(campaign)` triggers the same cascade as `cheerful_delete_campaign` (all campaign sub-resources). However, since the campaign is a draft, most sub-resources (recipients, senders, outbox, workflows) should not exist yet.
- The `EmailSignature` record linked to the campaign (if any) is cascade-deleted.
- Less destructive than deleting an active campaign since drafts typically have no recipients, senders, or outbox entries.

**Edge Cases**:
- Deleting a draft that has an associated `EmailSignature`: The signature is cascade-deleted.
- Deleting a draft that was partially set up (e.g., product_id pointing to a product): The product itself is NOT deleted — only the campaign record.
- Attempting to delete an active/paused/completed campaign: Returns 400 "Only draft campaigns can be deleted via this endpoint". Use `cheerful_delete_campaign` instead.
- Draft with `product_ids` in `draft_metadata`: The `draft_metadata` JSONB is deleted with the campaign — no separate cleanup needed.

---

### `cheerful_launch_campaign`

**Status**: NEW

**Purpose**: Launch a campaign — the culmination of the wizard flow. This complex orchestration endpoint creates or updates the campaign to `status=active`, creates/links products, validates and adds senders, processes recipients (from JSON and optional CSV), populates the outbox queue, creates integration workflows, uploads a campaign image, auto-creates a brand, seeds campaign creators from recipient social data, and sends a Slack notification. All operations happen in a single database transaction.

**Maps to**: `POST /api/service/campaigns/launch` (new service route needed; main route: `POST /campaigns/launch` in `campaign_launch.py` line 445)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (creates new campaign owned by user). If `draft_campaign_id` is provided, permission is owner or assigned team member (via `can_access_campaign`).

> **Important**: The main API endpoint accepts `multipart/form-data` with three fields: `campaign_data` (JSON string), `csv_file` (optional file upload), `image_file` (optional file upload). The CE tool cannot handle file uploads from Slack. The service route must accept `csv_content` (string) and `image_url` (string) as alternatives, or the CE tool should require CSV recipients to be added separately via `cheerful_add_campaign_recipients` or `cheerful_upload_campaign_recipients_csv` after launch.

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| draft_campaign_id | uuid | no | `null` | If provided, converts this existing draft to an active campaign instead of creating a new one. Draft must have `status=draft`. Resource ownership (products, senders) is validated against the draft's original owner, not the launching user (relevant for team members). |
| campaign_type | enum | yes | — | Frontend campaign type. One of: `"seeding"`, `"paid"`, `"sales"`, `"creator"`, `"gifting"`. Mapped to backend: `seeding`→`GIFTING`, `gifting`→`GIFTING`, `paid`→`PAID_PROMOTION`, `sales`→`SALES`, `creator`→`CREATOR`. Unmapped values default to `OTHER`. |
| product_name | string | conditional | `null` | Product name. Required for non-creator, non-external campaigns. If `existing_product_id` is not provided, used to look up or create a product (by `(user_id, name)` unique key). |
| product_description | string | no | `null` | Product description for new products. Used only when creating a new product. |
| product_url | string | no | `null` | Product URL. Used for: (1) setting `product.url_to_scrape` on new products, (2) auto-creating a brand via BrandfetchService (best-effort, failure is non-fatal). |
| existing_product_id | uuid | no | `null` | Explicit product ID to use. Overrides `product_name` lookup. Must be owned by the resource owner (campaign creator or draft owner). |
| additional_product_ids | uuid[] | no | `[]` | Additional existing product IDs to associate. Each must be owned by the resource owner. Duplicates of the primary product ID are silently skipped. |
| is_external | boolean | no | `false` | External campaigns don't require recipients or email templates. |
| campaign_name | string | no | `null` | Campaign name. Defaults to `product_name` if not provided. Falls back to `"Creator Campaign"` if both are null. |
| campaign_goal | string | no | `null` | Campaign goal text for AI context. |
| campaign_faqs | list[dict] | no | `null` | FAQ list (question/answer pairs) for AI context. |
| sample_emails | dict | no | `null` | Sample emails for AI tone matching. |
| tracking_rules | list[dict] | no | `null` | Tracking rules for Google Sheet integration. Each rule dict has `text` (string), optionally `isIgnored` (bool), `column` (string). Active rules (where `isIgnored` is not true) are joined with newlines and stored as `google_sheet_data_instructions`. Ignored rules' column names are stored in `google_sheet_columns_to_skip`. |
| google_sheet_url | string | no | `null` | Google Sheet URL for recipient tracking. |
| google_sheet_tab_title | string | no | `null` | Google Sheet tab title. Note: parameter name is `tab_title` (not `tab_name` as in draft). |
| selected_accounts | list[string] | yes | — | Email addresses of sender accounts to use. Must contain at least 1 (`min_length=1`). Each email is validated against `UserGmailAccount` (checked first) and `UserSmtpAccount`. Must be active (`is_active=True`) and owned by the resource owner. |
| email_draft | EmailDraft | conditional | `null` | Email content template. Required for non-creator, non-external campaigns. Sub-fields: `subject_line` (string, min 1 char) and `email_body` (string, min 1 char), both with `{placeholder}` support. |
| recipients | list[RecipientData] | conditional | `[]` | Recipient list. Each recipient has `email` (EmailStr, required), `name` (string, optional), `custom_fields` (dict, optional). Required for non-creator, non-external campaigns (unless `has_creators_pending_enrichment=true`). Combined with CSV recipients — total must be ≥1 for non-external, non-creator campaigns without pending enrichment. |
| follow_up_templates | list[FollowUpTemplateInput] | no | `null` | Follow-up email templates. Max 10 (`max_length=10`). Each: `index` (int, ≥0), `body_template` (string, min 1 char), `hours_since_last_email` (int, >0). Indices must be sequential 0-based. |
| integrations | dict | no | `null` | Integration configuration for workflow creation. Supported keys: `goaffpro_token` (string — GoAffPro API key), `discount_enabled` (bool — create GoAffPro discount workflow), `discount_type` (string — `"percentage"` or `"fixed_amount"`, default `"percentage"`), `discount_value` (number — default `10`), `orders_enabled` (bool — create Shopify order drafting workflow). |
| cc_emails | list[string] | no | `null` | CC email addresses for all outbound emails. Passed to outbox queue population. |
| is_lookalike_suggestions_enabled | boolean | no | `false` | Enable YouTube lookalike creator suggestions for this campaign. |
| has_creators_pending_enrichment | boolean | no | `false` | If true, creators without emails will be added post-launch for enrichment. Bypasses the empty-recipients check for non-external, non-creator campaigns. |
| automation_level | string | no | `null` | Reply automation level. Convention: `"manual"`, `"semi-automated"`, `"fully-automated"`. No enum validation — stored as-is. |
| slack_channel_id | string | no | `null` | Slack channel ID for campaign notifications (e.g., `"C0ADFMSMZU4"`). |
| email_signature | string | no | `null` | HTML email signature content. Max 10,000 chars. Sanitized via `sanitize_signature_html()`. Creates or updates `EmailSignature` record for the campaign. |
| email_signature_enabled | boolean | no | `false` | Whether to append the signature to outbound emails. |
| csv_content | string | no | `null` | **CE-specific parameter** (not in main API). Raw CSV text content for recipients. Must have an `email` column. Parsed, deduplicated, and combined with `recipients` list. NOTE: The main API accepts `csv_file` as a `multipart/form-data` upload — the service route must accept this as text instead. |

**Parameter Validation Rules (from Pydantic model validators)**:
1. **`validate_follow_up_templates_sequential`**: Follow-up template indices must be sequential starting from 0. `Got indices {actual}, expected {expected}.` Returns 422.
2. **`validate_product_name`**: `product_name` is required for non-creator, non-external campaigns. If `campaign_type="creator"` or `is_external=true`, product_name can be null. Otherwise: `"product_name is required for non-creator, non-external campaigns"`. Returns 422.
3. **`validate_email_draft`**: `email_draft` is required for non-creator, non-external campaigns. Both `subject_line` and `email_body` must be non-empty. `"email_draft is required for non-creator, non-external campaigns"`, `"email_draft.subject_line is required..."`, `"email_draft.email_body is required..."`. Returns 422.
4. **Route-level recipient validation**: After combining JSON recipients and CSV recipients, total must be ≥1 for non-creator, non-external campaigns (unless `has_creators_pending_enrichment=true`). `"Non-creator, non-external campaigns require at least one recipient."` Returns 400.
5. **Sender account validation**: Each email in `selected_accounts` is validated against `UserGmailAccount` (checked first) then `UserSmtpAccount`. Must be active and owned by the resource owner. `"Not authorized to use sender account: {email}"` (403), `"Sender account not found or inactive: {email}"` (404). After validation: `"No valid sender accounts found. Check that the email addresses exist and are active."` (404).
6. **Email signature**: Max 10,000 chars. `"Email signature exceeds maximum length of 10,000 characters"`. Returns 400.
7. **CSV parsing**: Must contain an `email` column. `"CSV must contain an 'email' column. Found columns: {first 5 columns}"`. Returns 400.
8. **Queue population**: Template placeholders must match recipient custom fields. `"Personalization failed: {error}. Check that all template placeholders have matching recipient fields."`. Returns 400.

**Return Schema**:
```json
{
  "campaign_id": "uuid — ID of the launched campaign (new or converted draft)",
  "campaign_name": "string — Final campaign name",
  "recipients_added": "integer — Number of recipients successfully added (deduplicated)",
  "senders_added": "integer — Number of sender accounts linked",
  "queue_entries_created": "integer — Number of outbox queue entries created",
  "workflow_created": "boolean — Whether integration workflows were created (GoAffPro discount and/or Shopify order drafting)",
  "image_uploaded": "boolean — Whether a campaign image was uploaded. Always false for CE (no file upload support)"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Invalid campaign_data JSON | "Invalid campaign data: {error}" | 422 |
| Draft not found (when draft_campaign_id provided) | "Draft campaign not found: {draft_campaign_id}" | 404 |
| User cannot access draft | "Not authorized to launch this campaign" | 403 |
| Draft not in DRAFT status | "Campaign is not a draft" | 400 |
| Product not found (existing_product_id) | "Product not found: {product_id}" | 404 |
| Product not owned by resource owner | "Not authorized to use this product" | 403 |
| Additional product not found | "Product not found: {product_id}" | 404 |
| Additional product not owned | "Not authorized to use this product" | 403 |
| Sender account not found/inactive | "Sender account not found or inactive: {email}" | 404 |
| Sender account not owned | "Not authorized to use sender account: {email}" | 403 |
| No valid sender accounts | "No valid sender accounts found. Check that the email addresses exist and are active." | 404 |
| No recipients (non-external, non-creator) | "Non-creator, non-external campaigns require at least one recipient." | 400 |
| product_name required | "product_name is required for non-creator, non-external campaigns" | 422 |
| email_draft required | "email_draft is required for non-creator, non-external campaigns" | 422 |
| email_draft.subject_line required | "email_draft.subject_line is required for non-creator, non-external campaigns" | 422 |
| email_draft.email_body required | "email_draft.email_body is required for non-creator, non-external campaigns" | 422 |
| Follow-up indices invalid | "follow_up_templates indices must be sequential starting from 0..." | 422 |
| CSV missing email column | "CSV must contain an 'email' column. Found columns: {columns}" | 400 |
| Template personalization failed | "Personalization failed: {error}. Check that all template placeholders have matching recipient fields." | 400 |
| Campaign image invalid type | "Invalid image type '{type}'. Allowed: image/jpeg, image/png, image/gif, image/webp" | 400 |
| Image upload failed | "Failed to upload campaign image: {error}" | 500 |
| Signature too long | "Email signature exceeds maximum length of 10,000 characters" | 400 |

**Pagination**: N/A

**Example Request** (launch from draft):
```
cheerful_launch_campaign(
  draft_campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  campaign_type="gifting",
  campaign_name="Summer Gifting 2026",
  product_name="Hydration Bottle Pro",
  product_description="Premium stainless steel water bottle, 32oz",
  selected_accounts=["outreach@brand.com", "sarah@brand.com"],
  email_draft={"subject_line": "Hi {name}, free product for you!", "email_body": "Hey {name},\n\nWe love your content..."},
  recipients=[
    {"email": "creator1@gmail.com", "name": "Jane Doe", "custom_fields": {"instagram": "@janedoe"}},
    {"email": "creator2@gmail.com", "name": "John Smith", "custom_fields": {"tiktok": "@johnsmith"}}
  ],
  follow_up_templates=[
    {"index": 0, "body_template": "Hi {name}, following up on our offer...", "hours_since_last_email": 72}
  ],
  automation_level="semi-automated",
  is_lookalike_suggestions_enabled=true
)
```

**Example Request** (launch new campaign without draft):
```
cheerful_launch_campaign(
  campaign_type="sales",
  campaign_name="Q2 Outbound",
  product_name="SaaS Platform Pro",
  selected_accounts=["sales@company.com"],
  email_draft={"subject_line": "Quick question, {name}", "email_body": "Hi {name},\n\nI noticed your company {company} is..."},
  recipients=[
    {"email": "lead1@prospect.com", "name": "Alice", "custom_fields": {"company": "TechCorp"}},
    {"email": "lead2@prospect.com", "name": "Bob", "custom_fields": {"company": "StartupInc"}}
  ]
)
```

**Example Request** (external campaign — no recipients/email needed):
```
cheerful_launch_campaign(
  campaign_type="creator",
  campaign_name="Inbound Creator Campaign",
  is_external=true,
  selected_accounts=["outreach@brand.com"],
  campaign_goal="Manage inbound creator applications",
  automation_level="fully-automated"
)
```

**Example Response**:
```json
{
  "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "campaign_name": "Summer Gifting 2026",
  "recipients_added": 2,
  "senders_added": 2,
  "queue_entries_created": 2,
  "workflow_created": false,
  "image_uploaded": false
}
```

**Slack Formatting Notes**:
- On success: ":rocket: Campaign *{campaign_name}* launched!\n• Recipients: {recipients_added}\n• Senders: {senders_added}\n• Emails queued: {queue_entries_created}\n• Workflows: {workflow_created ? 'Created' : 'None'}"
- If `workflow_created=true`: Add "GoAffPro discount codes and/or Shopify order drafting workflows are active."
- If `queue_entries_created=0` and `recipients_added>0`: "Note: Outbox queue was not populated. This may happen if there are no senders configured."
- If launching from a draft, the agent should first use `cheerful_get_campaign_draft` to review the draft state with the user, confirm the settings, then launch.

**Side Effects (Orchestration Steps)**:

The launch endpoint executes the following steps in order, all within a single DB transaction:

1. **Draft access check** (if `draft_campaign_id` provided): Verify campaign exists, user has access (via `can_access_campaign`), and status is DRAFT. Set `resource_owner_id` to the draft's original owner (for product/sender validation).
2. **Product handling**: Create or look up primary product by `existing_product_id` or `product_name` (name-based lookup uses `(user_id, name)` unique key — creates if not found). Validate and add `additional_product_ids`. All products must be owned by the resource owner.
3. **Brand auto-creation**: If `product_url` is provided, attempt to auto-create a brand via `BrandfetchService.get_or_create_brand()`. Failure is non-fatal (logged as warning).
4. **Sender validation**: Each email in `selected_accounts` is looked up in `UserGmailAccount` (first) then `UserSmtpAccount`. Must be active and owned by resource owner. Returns list of `(account_id, account_type)` tuples.
5. **CSV parsing** (if `csv_file` or `csv_content` provided): Parse CSV, require `email` column, deduplicate by email, clean invalid emails.
6. **Combine recipients**: Merge JSON `recipients` with CSV recipients.
7. **Recipient validation**: For non-external, non-creator campaigns without `has_creators_pending_enrichment`, require ≥1 recipient.
8. **Campaign type mapping**: Map frontend type to backend enum.
9. **Follow-up preparation**: Convert templates to dicts.
10. **Tracking rules processing**: Split into active rules (joined as `google_sheet_data_instructions`) and ignored rules (columns stored in `google_sheet_columns_to_skip`).
11. **Signature validation**: Validate length, sanitize HTML.
12. **Campaign create/update**: If `draft_campaign_id`, update existing draft to ACTIVE. Otherwise, create new Campaign with `status=ACTIVE`. Clear `draft_metadata=null` on draft conversion.
13. **Signature record**: Create or update `EmailSignature` record (belongs to resource owner, not requesting user).
14. **Image upload** (if image_file provided — not applicable for CE): Upload to Supabase Storage, set `campaign.image_url`.
15. **Product junction**: Replace `campaign_product` records via `replace_for_campaign()`.
16. **Recipients**: Insert `CampaignRecipient` records (idempotent by campaign_id + email).
17. **Creator seeding**: For each recipient with social handles or name, create `CampaignCreator` record (idempotent by email) with `source="csv_upload"`.
18. **Senders**: Insert `CampaignSender` records (idempotent). Each sender gets either `gmail_account_id` or `smtp_account_id`.
19. **Workflow creation**: If `integrations.goaffpro_token` is set:
    - If `integrations.discount_enabled=true`: Create "GoAffPro Discount Code Creation" workflow with tools `[goaffpro_search_affiliate, goaffpro_create_affiliate, goaffpro_create_discount]` and config `{goaffpro_api_key, discount_type, discount_value}`.
    - If `integrations.orders_enabled=true`: Create "Shopify Order Drafting" workflow with tools `[goaffpro_search_affiliate, goaffpro_create_affiliate]` and config `{goaffpro_api_key}`.
20. **Outbox population**: If `recipients_added > 0` and `senders_added > 0`, call `populate_queue_for_campaign()` with round-robin sender distribution and template placeholder validation. Passes `cc_emails`.
21. **Commit transaction**.
22. **Slack notification** (post-commit, best-effort): Post to hardcoded channel `C0ADFMSMZU4` with campaign launch details including user name and email.

**Edge Cases**:
- **Launch from draft as team member**: Works — access via `can_access_campaign`. Products and senders are validated against the DRAFT OWNER (not the launching team member). The `resource_owner_id` is set to `draft_campaign.user_id`.
- **Launch without draft (direct launch)**: Creates a new campaign. `resource_owner_id` = requesting user.
- **Duplicate recipient emails**: Silently deduplicated — `idempotent_insert` returns 0 for duplicates.
- **CSV + JSON recipients overlap**: Both sources are combined. Deduplication happens at the DB level via idempotent insert.
- **Creator campaign with no recipients**: Valid — creator campaigns skip the recipient requirement entirely.
- **External campaign with no email_draft**: Valid — external campaigns skip the email draft requirement.
- **Product name collision**: If `product_name` matches an existing product for the user, the existing product is reused (not duplicated).
- **Sender account is Gmail AND SMTP**: Gmail is checked first. If found, SMTP is not checked for that email.
- **Template placeholder mismatch**: If `email_draft.email_body` contains `{company}` but no recipient has a `company` custom field, personalization fails with 400. This happens at outbox population (step 20), so the campaign IS created but the queue is not populated. The transaction rolls back entirely.
- **Brand auto-create failure**: Logged as warning, does not prevent campaign launch. `brand_id` is simply `null`.
- **Image upload failure**: Raises 500. Transaction has already been committed at this point — NO, actually the image upload happens BEFORE commit. If it fails, the entire transaction rolls back.
- **Queue population failure (personalization)**: Raises 400. Since this happens before `db.commit()`, the entire transaction rolls back — no campaign, no recipients, nothing is created.

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

> **Context**: Products are standalone entities owned by users. They can be linked to campaigns during the wizard flow (via `product_id` or `product_ids`). Products have a unique constraint on `(user_id, name)`. The product table has 6 columns: `id`, `user_id`, `name`, `description`, `url_to_scrape`, `created_at`.

### `cheerful_create_product`

**Status**: NEW

**Purpose**: Create a new product that can be linked to campaigns. Products have a unique constraint on `(user_id, name)` — creating a product with a duplicate name returns 409.

**Maps to**: `POST /api/service/products` (new service route needed; main route: `POST /products/` in `product.py` line 22)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (product is owned by the user).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| name | string | yes | — | Product name. Must be unique per user (case-sensitive). Stored as `product.name` (Text, NOT NULL). |
| description | string | yes | — | Product description. Stored as `product.description` (Text, NOT NULL). Pass empty string `""` if no description. |
| url_to_scrape | string | no | `null` | Product URL. Stored as `product.url_to_scrape` (Text, nullable). Note: despite the field name suggesting automatic scraping, the product create endpoint does NOT trigger any scraping. Scraping may happen at campaign launch time via BrandfetchService if `product_url` is provided to the launch endpoint. |

**Parameter Validation Rules**:
- `name` is required. Missing returns 422.
- `description` is required. Missing returns 422.
- `(user_id, name)` unique constraint. Duplicate returns `HTTPException 409: "Product with name '{name}' already exists"`.

**Return Schema** (`ProductResponse`):
```json
{
  "id": "uuid — Auto-generated product ID",
  "user_id": "uuid — Owner's user ID",
  "name": "string — Product name",
  "description": "string — Product description",
  "url_to_scrape": "string | null — Product URL",
  "created_at": "datetime — ISO 8601 timestamp with timezone"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Missing name or description | Pydantic validation error | 422 |
| Duplicate product name | "Product with name '{name}' already exists" | 409 |

**Pagination**: N/A

**Example Request**:
```
cheerful_create_product(
  name="Hydration Bottle Pro",
  description="Premium stainless steel water bottle, 32oz, double-wall vacuum insulated",
  url_to_scrape="https://example.com/products/hydration-bottle-pro"
)
```

**Example Response**:
```json
{
  "id": "b5c6d7e8-f9a0-1234-5678-90abcdef1234",
  "user_id": "83a3177e-0307-4e5f-ae4e-4bc823db56e9",
  "name": "Hydration Bottle Pro",
  "description": "Premium stainless steel water bottle, 32oz, double-wall vacuum insulated",
  "url_to_scrape": "https://example.com/products/hydration-bottle-pro",
  "created_at": "2026-03-01T14:00:00+00:00"
}
```

**Slack Formatting Notes**:
- On success: "Product *{name}* created (ID: `{id}`). You can now link it to a campaign using `cheerful_create_campaign` or `cheerful_launch_campaign`."
- On 409 (duplicate): "A product named *{name}* already exists. Use `cheerful_list_products` to find it, or choose a different name."

**Edge Cases**:
- Creating a product with the same name as a product owned by another user: Works — unique constraint is per user, not global.
- `url_to_scrape` with invalid URL format: No validation — stored as-is. Format validation is the caller's responsibility.
- `description` as empty string: Valid — stored as empty string.
- Product has no update or delete endpoints in the main API. To "update" a product, the user must create a new one and re-link campaigns. However, `ProductUpdateRequest` model exists but no route uses it.

---

### `cheerful_list_products`

**Status**: NEW

**Purpose**: List all products owned by the authenticated user. Returns all products with no filtering or pagination.

**Maps to**: `GET /api/service/products` (new service route needed; main route: `GET /products/` in `product.py` line 64)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (returns only user's products).

**Parameters** (user-facing — `user_id` is injected, not listed here):

None. This endpoint has no parameters — it returns all products owned by the authenticated user.

**Parameter Validation Rules**: None.

**Return Schema**:
```json
[
  {
    "id": "uuid — Product ID",
    "user_id": "uuid — Owner's user ID",
    "name": "string — Product name",
    "description": "string — Product description",
    "url_to_scrape": "string | null — Product URL",
    "created_at": "datetime — ISO 8601 timestamp with timezone"
  }
]
```
Returns an array of `ProductResponse` objects. Empty array `[]` if the user has no products.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |

**Pagination**: None — returns ALL products. No limit/offset support. If a user has many products, the full list is returned. In practice, users typically have <50 products.

**Example Request**:
```
cheerful_list_products()
```

**Example Response**:
```json
[
  {
    "id": "b5c6d7e8-f9a0-1234-5678-90abcdef1234",
    "user_id": "83a3177e-0307-4e5f-ae4e-4bc823db56e9",
    "name": "Hydration Bottle Pro",
    "description": "Premium stainless steel water bottle, 32oz",
    "url_to_scrape": "https://example.com/products/hydration-bottle-pro",
    "created_at": "2026-03-01T14:00:00+00:00"
  },
  {
    "id": "c6d7e8f9-a0b1-2345-6789-0abcdef12345",
    "user_id": "83a3177e-0307-4e5f-ae4e-4bc823db56e9",
    "name": "Fitness Tracker Band",
    "description": "Waterproof fitness tracker with heart rate monitor",
    "url_to_scrape": null,
    "created_at": "2026-02-15T10:30:00+00:00"
  }
]
```

**Slack Formatting Notes**:
- Present as a numbered list: "Your products:\n1. *Hydration Bottle Pro* — Premium stainless steel water bottle, 32oz\n2. *Fitness Tracker Band* — Waterproof fitness tracker with heart rate monitor"
- If no products: "You don't have any products yet. Create one with `cheerful_create_product`."
- If the user is looking for a product to link to a campaign, show the product IDs for easy reference.

**Edge Cases**:
- User with no products: Returns empty array `[]`.
- Products are not sorted — order is implementation-dependent (typically by insertion order).

---

### `cheerful_get_product`

**Status**: NEW

**Purpose**: Get a single product by ID. Verifies the product is owned by the authenticated user.

**Maps to**: `GET /api/service/products/{product_id}` (new service route needed; main route: `GET /products/{product_id}` in `product.py` line 78)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (product must be owned by user — `product.user_id == user_id`).

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| product_id | uuid | yes | — | Product ID to retrieve |

**Parameter Validation Rules**:
- `product_id` must be a valid UUID. Invalid format returns 422.

**Return Schema** (`ProductResponse`):
```json
{
  "id": "uuid — Product ID",
  "user_id": "uuid — Owner's user ID",
  "name": "string — Product name",
  "description": "string — Product description",
  "url_to_scrape": "string | null — Product URL",
  "created_at": "datetime — ISO 8601 timestamp with timezone"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user. Ensure user mapping exists." | N/A (pre-request) |
| Product not found | "Product not found" | 404 |
| Product not owned by user | "Not authorized" | 403 |

**Pagination**: N/A

**Example Request**:
```
cheerful_get_product(product_id="b5c6d7e8-f9a0-1234-5678-90abcdef1234")
```

**Example Response**:
```json
{
  "id": "b5c6d7e8-f9a0-1234-5678-90abcdef1234",
  "user_id": "83a3177e-0307-4e5f-ae4e-4bc823db56e9",
  "name": "Hydration Bottle Pro",
  "description": "Premium stainless steel water bottle, 32oz, double-wall vacuum insulated",
  "url_to_scrape": "https://example.com/products/hydration-bottle-pro",
  "created_at": "2026-03-01T14:00:00+00:00"
}
```

**Slack Formatting Notes**:
- Display as a brief card: "*Hydration Bottle Pro*\n_{description}_\nURL: {url_to_scrape or 'None'}\nCreated: {created_at formatted as human-readable date}"

**Edge Cases**:
- Getting a product owned by another user: Returns 403 "Not authorized" (not 404 — information disclosure is acceptable since the user needs to know it exists but isn't theirs).
- Product ID exists but belongs to another user: 403.
- Product ID doesn't exist at all: 404.

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
