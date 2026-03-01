# Campaign Domain — Tool Specifications

**Domain**: Campaigns
**Spec file**: `specs/campaigns.md`
**Wave 2 status**: Tool design complete
**Wave 3 status**: In progress — CRUD section complete (w3-campaigns-crud)

---

## Table of Contents

1. [Campaign Core CRUD](#campaign-core-crud) (6 tools) — **Wave 3 COMPLETE**
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
