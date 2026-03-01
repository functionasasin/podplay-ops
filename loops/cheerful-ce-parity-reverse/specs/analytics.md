# Analytics Domain — Tool Specifications

**Domain**: Analytics
**Spec file**: `specs/analytics.md`
**Wave 3 status**: Complete — verified against source code

**Source files verified**: `dashboard.py` (668 lines), `models/api/dashboard.py` (142 lines), `service.py` (360 lines), `campaign.py` (CampaignOutboxQueueStatus enum), `campaign_follow_up_outbox_queue.py` (CampaignFollowUpOutboxQueueStatus enum), `gmail_thread_state.py` (GmailThreadStatus enum), `smtp_thread_state.py`, `gmail_thread_llm_draft.py` (63 lines)

---

## Table of Contents

1. [Dashboard Analytics](#dashboard-analytics) (1 tool)

**Total**: 1 tool (0 existing + 1 new)

> **Service routes needed**: 1 new `/api/service/dashboard/analytics` endpoint. The existing `GET /dashboard/analytics` is JWT-auth only. The new service route must accept service API key auth + `user_id` query parameter, replicating the same aggregation logic.

> **Cross-reference — Per-campaign stats**: Campaign-level metrics (sent_count, pending_count, failed_count, total_recipients, thread_count) are provided by `cheerful_list_campaigns(include_stats=true)` in `specs/campaigns.md`. That tool covers the per-campaign stats view that the frontend shows on `/campaigns`. The dashboard tool here provides the cross-campaign aggregated view shown on `/dashboard`.

> **Cross-reference — Active campaigns table**: The dashboard response includes `active_campaigns` (max 10) with per-campaign opt-in/reply metrics. This overlaps with `cheerful_list_campaigns` but provides pre-computed metrics not available via the campaigns service route. The agent should use `cheerful_get_dashboard_analytics` for the dashboard overview and `cheerful_list_campaigns` for the full campaign list.

> **Design rationale — single tool**: The backend has exactly 1 endpoint (`GET /dashboard/analytics`) that returns a composite response with 10 data sections. Rather than splitting into separate tools (e.g., pipelines, email stats, follow-ups), all data comes from a single query. The Claude agent can extract and format relevant sections based on what the user asks about. This avoids redundant backend calls and keeps the tool count minimal.

---

## Dashboard Analytics

### `cheerful_get_dashboard_analytics`

**Status**: NEW

**Purpose**: Get a comprehensive analytics dashboard with campaign counts, opt-in rates, email stats, pipelines, follow-up effectiveness, and recent opt-ins across all of the user's campaigns.

**Maps to**: `GET /api/service/dashboard/analytics` (new service route needed; main route: `GET /dashboard/analytics`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (returns aggregated analytics across all campaigns owned by the user).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| recent_optins_days | integer | no | 7 | Number of days to look back for recent opt-ins. Valid range: 1-30. |

**Parameter Validation Rules**:
- `recent_optins_days` must be an integer between 1 and 30 (inclusive). Values outside this range return a 422 validation error.

**Returns**: `DashboardAnalyticsResponse` — composite analytics object with 10 data sections covering all user campaigns.

**Return Schema**:
```json
{
  "active_campaigns_count": "integer — count of user's campaigns with status='active'",
  "paused_campaigns_count": "integer — count of user's campaigns with status='paused'",

  "total_opted_in": "integer — creators across all campaigns where gifting_status IN GIFTING_OPTED_IN_STATUSES OR paid_promotion_status IN PAID_PROMOTION_OPTED_IN_STATUSES",
  "total_opted_out": "integer — creators where gifting_status='OPTED_OUT' OR paid_promotion_status='OPTED_OUT'",
  "total_new": "integer — creators where gifting_status='NEW' OR paid_promotion_status='NEW'",
  "total_contacts": "integer — total creators across all user campaigns (unfiltered count)",

  "opt_in_rate": "float | null — round((total_opted_in / total_contacts) * 100, 1). Percentage 0-100. Null if total_contacts is 0.",
  "response_rate": "float | null — round((internal_responded / internal_emails_sent) * 100, 1). Only for internal campaigns (is_external=false). Percentage 0-100. Null if no internal campaigns or no emails sent.",

  "email_stats": {
    "emails_sent": "integer — total sent emails (initial outreach + follow-ups + AI-drafted emails actually sent)",
    "emails_pending": "integer — total pending emails (initial 'pending'+'processing' + follow-up 'pending'+'processing')",
    "emails_failed": "integer — total failed emails (initial 'failed' + follow-up 'failed')"
  },

  "recent_optins": [
    {
      "id": "uuid — CampaignCreator.id",
      "creator_name": "string | null — creator name (nullable)",
      "creator_email": "string | null — creator email (nullable)",
      "campaign_id": "uuid — campaign the creator belongs to",
      "campaign_name": "string — campaign name (joined from Campaign table)",
      "gifting_status": "string | null — current gifting status (nullable)",
      "updated_at": "datetime — when the status was last updated (ISO 8601)",
      "source_gmail_thread_id": "string | null — linked Gmail thread ID (nullable)",
      "social_media_handles": [
        {
          "platform": "string — social platform name (e.g., 'instagram', 'tiktok', 'youtube')",
          "handle": "string — the handle/username",
          "url": "string | null — full profile URL (nullable)"
        }
      ]
    }
  ],

  "active_campaigns": [
    {
      "id": "uuid — campaign ID",
      "name": "string — campaign name",
      "campaign_type": "string — one of: 'gifting', 'paid_promotion', 'creator', 'sales', 'other'",
      "status": "string — always 'active' (filtered)",
      "created_at": "datetime — campaign creation time (ISO 8601)",
      "total_creators": "integer — total CampaignCreator count for this campaign",
      "opted_in_count": "integer — creators in opted-in statuses (gifting or paid promotion)",
      "opted_out_count": "integer — creators where gifting_status='OPTED_OUT' OR paid_promotion_status='OPTED_OUT'",
      "order_sent_count": "integer — creators where gifting_status='ORDER_SENT' (backward compat, already included in opted_in_count)",
      "replied_count": "integer — creators in replied statuses (gifting or paid promotion)"
    }
  ],

  "gifting_pipeline": {
    "new": "integer — creators with gifting_status='NEW'",
    "contacted": "integer — creators with gifting_status='CONTACTED'",
    "opted_in": "integer — creators with gifting_status='OPTED_IN' (legacy)",
    "pending_details": "integer — creators with gifting_status='PENDING_DETAILS'",
    "ready_to_ship": "integer — creators with gifting_status='READY_TO_SHIP'",
    "ordered": "integer — creators with gifting_status IN ('ORDERED', 'SHIPPED', 'DELIVERED') (folded together)",
    "opted_out": "integer — creators with gifting_status='OPTED_OUT'",
    "total": "integer — sum of all above stages"
  },

  "paid_promotion_pipeline": {
    "new": "integer — creators with paid_promotion_status='NEW'",
    "negotiating": "integer — creators with paid_promotion_status='NEGOTIATING'",
    "contract_signed": "integer — creators with paid_promotion_status='CONTRACT_SIGNED'",
    "content_in_progress": "integer — creators with paid_promotion_status='CONTENT_IN_PROGRESS'",
    "awaiting_review": "integer — creators with paid_promotion_status='AWAITING_REVIEW'",
    "changes_requested": "integer — creators with paid_promotion_status='CHANGES_REQUESTED'",
    "content_approved": "integer — creators with paid_promotion_status='CONTENT_APPROVED'",
    "posted": "integer — creators with paid_promotion_status='POSTED'",
    "awaiting_payment": "integer — creators with paid_promotion_status='AWAITING_PAYMENT'",
    "paid": "integer — creators with paid_promotion_status='PAID'",
    "opted_out": "integer — creators with paid_promotion_status='OPTED_OUT'",
    "total": "integer — sum of all above stages"
  },

  "follow_up_stats": {
    "total_follow_ups": "integer — sum of all follow-up outbox queue item counts",
    "sent_count": "integer — follow-ups with status='sent'",
    "pending_count": "integer — follow-ups with status='pending' or 'processing'",
    "cancelled_count": "integer — follow-ups with status='cancelled'",
    "failed_count": "integer — follow-ups with status='failed'",
    "cancellation_rate": "float | null — round((cancelled_count / total_follow_ups) * 100, 1). Percentage 0-100. Null if total_follow_ups is 0.",
    "conversions_by_follow_up_number": "object (dynamic keys) — Keys are follow-up sequence numbers as strings (e.g., \"1\", \"2\", \"3\"). Values are integer counts of sent follow-ups at that sequence position. Only positions that have sent follow-ups appear as keys. Example: {\"1\": 34, \"2\": 18, \"3\": 7}"
  },

  "campaign_type_stats": [
    {
      "campaign_type": "string — one of: 'gifting', 'paid_promotion', 'creator', 'sales', 'other' (null maps to 'other')",
      "total_creators": "integer — total CampaignCreator count for campaigns of this type",
      "converted": "integer — creators in opted-in statuses for this campaign type",
      "conversion_rate": "float | null — round((converted / total_creators) * 100, 1). Percentage 0-100. Null if total_creators is 0."
    }
  ]
}
```

**Nullable sections**:
- `gifting_pipeline` is `null` if: (a) `user_campaign_ids` is empty (no campaigns at all), OR (b) the sum of ALL creator gifting_status counts across gifting-type campaigns (`Campaign.campaign_type == "gifting"`) is 0. This means it can be `null` even if gifting campaigns exist but have zero creators.
- `paid_promotion_pipeline` is `null` if: (a) `user_campaign_ids` is empty, OR (b) the sum of ALL creator paid_promotion_status counts across paid_promotion-type campaigns (`Campaign.campaign_type == "paid_promotion"`) is 0. Same pattern as gifting.
- `follow_up_stats` is `null` if no follow-up outbox queue items exist for the user's campaigns (i.e., the `follow_up_counts` dict is empty). This happens when either no campaigns have outbox queue items at all, or no outbox queue items have follow-up entries.
- `recent_optins` is an empty array `[]` if no creators opted in within the lookback window.
- `active_campaigns` is an empty array `[]` if the user has no active campaigns. Max 10 items, ordered by `created_at` DESC.
- `campaign_type_stats` is an empty array `[]` if the user has no campaigns.

**Calculated field details**:
- `opt_in_rate`: `round((total_opted_in / total_contacts) * 100, 1)`. Returns `null` when `total_contacts` is 0 (division by zero guard).
- `response_rate`: `round((internal_responded / internal_emails_sent) * 100, 1)`. Only counts campaigns where `is_external=false`. `internal_emails_sent` = CampaignOutboxQueue rows with status="sent" for internal campaigns. `internal_responded` = creators in internal campaigns where `gifting_status IN GIFTING_OPTED_IN_STATUSES + ["OPTED_OUT"]` (8 statuses) OR `paid_promotion_status IN PAID_PROMOTION_OPTED_IN_STATUSES + ["OPTED_OUT"]` (9 statuses). **IMPORTANT**: This is narrower than `GIFTING_REPLIED_STATUSES`/`PAID_PROMOTION_REPLIED_STATUSES` — it excludes "DECLINED" from gifting and excludes "NEGOTIATING", "AWAITING_CONTRACT", "DECLINED" from paid promotion. Returns `null` when there are no internal campaigns or no emails sent.
- `cancellation_rate`: `round((cancelled_count / total_follow_ups) * 100, 1)`. Returns `null` when `total_follow_ups` is 0.
- `conversion_rate` (per campaign type): `round((converted / total_creators) * 100, 1)`. Returns `null` when `total_creators` is 0.

**Status constant sets** (hardcoded in backend `dashboard.py`, not configurable):
- **GIFTING_OPTED_IN_STATUSES** (7 values): `"OPTED_IN"`, `"ORDER_SENT"`, `"SHIPPED"`, `"DELIVERED"`, `"PENDING_DETAILS"`, `"READY_TO_SHIP"`, `"ORDERED"`
- **PAID_PROMOTION_OPTED_IN_STATUSES** (8 values): `"CONTRACT_SIGNED"`, `"CONTENT_IN_PROGRESS"`, `"AWAITING_REVIEW"`, `"CHANGES_REQUESTED"`, `"CONTENT_APPROVED"`, `"POSTED"`, `"AWAITING_PAYMENT"`, `"PAID"`
- **GIFTING_REPLIED_STATUSES** (9 values): All GIFTING_OPTED_IN_STATUSES + `"OPTED_OUT"`, `"DECLINED"` — used for `replied_count` in active campaigns
- **PAID_PROMOTION_REPLIED_STATUSES** (12 values): All PAID_PROMOTION_OPTED_IN_STATUSES + `"NEGOTIATING"`, `"AWAITING_CONTRACT"`, `"OPTED_OUT"`, `"DECLINED"` — used for `replied_count` in active campaigns
- **Response rate responded statuses** (different from replied): Gifting uses OPTED_IN_STATUSES + `"OPTED_OUT"` (8 values, excludes `"DECLINED"`). Paid promotion uses OPTED_IN_STATUSES + `"OPTED_OUT"` (9 values, excludes `"NEGOTIATING"`, `"AWAITING_CONTRACT"`, `"DECLINED"`)

**CampaignType enum values** (from `Campaign.campaign_type` column): `"gifting"`, `"paid_promotion"`, `"creator"`, `"sales"`, `"other"`. NULL values are mapped to `"other"` in `campaign_type_stats` but NOT in `active_campaigns` (potential Pydantic validation error if NULL — see Edge Cases).

**CampaignStatus enum values** (from `CampaignStatus` StrEnum): `"active"`, `"paused"`, `"draft"`, `"completed"`. Dashboard counts group by all statuses but only report `active` and `paused`. `draft` and `completed` counts are computed but discarded.

**CampaignOutboxQueueStatus enum values** (5 values): `"pending"`, `"processing"`, `"sent"`, `"failed"`, `"cancelled"`. Dashboard email_stats maps: "sent" → `emails_sent`, "pending"+"processing" → `emails_pending`, "failed" → `emails_failed`. **"cancelled" is NOT counted** in any email_stats bucket.

**CampaignFollowUpOutboxQueueStatus enum values** (5 values): `"pending"`, `"processing"`, `"sent"`, `"failed"`, `"cancelled"`. Same mapping as outbox queue for email_stats. Follow-up stats separately track all 5 including cancelled.

**GmailThreadStatus enum values** (8 values, from `GmailThreadStatus` StrEnum): `"READY_FOR_ATTACHMENT_EXTRACTION"`, `"READY_FOR_CAMPAIGN_ASSOCIATION"`, `"READY_FOR_RESPONSE_DRAFT"`, `"WAITING_FOR_DRAFT_REVIEW"`, `"WAITING_FOR_INBOUND"`, `"IGNORE"`, `"DONE"`, `"NOT_LATEST"`. SmtpThreadState uses the same enum. AI-sent count excludes only `"WAITING_FOR_DRAFT_REVIEW"` — all other statuses (including processing states like `"READY_FOR_RESPONSE_DRAFT"`) are counted as "sent."

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Invalid recent_optins_days (< 1 or > 30) | Pydantic v2: `{"detail": [{"type": "greater_than_equal", "msg": "Input should be greater than or equal to 1", ...}]}` or `{"type": "less_than_equal", "msg": "Input should be less than or equal to 30", ...}` | 422 |
| Invalid recent_optins_days (not integer) | Pydantic v2: `{"type": "int_parsing", "msg": "Input should be a valid integer", ...}` | 422 |
| Backend unreachable / internal error | ToolError wrapping HTTP 500 | 500 |

**Example Request**:
```
cheerful_get_dashboard_analytics()
cheerful_get_dashboard_analytics(recent_optins_days=14)
```

**Example Response** (realistic data — user with active gifting and paid promotion campaigns):
```json
{
  "active_campaigns_count": 3,
  "paused_campaigns_count": 1,

  "total_opted_in": 47,
  "total_opted_out": 12,
  "total_new": 85,
  "total_contacts": 200,

  "opt_in_rate": 23.5,
  "response_rate": 31.2,

  "email_stats": {
    "emails_sent": 156,
    "emails_pending": 23,
    "emails_failed": 4
  },

  "recent_optins": [
    {
      "id": "cc1a2b3c-d4e5-f6a7-b8c9-d0e1f2a3b4c5",
      "creator_name": "Sarah Chen",
      "creator_email": "sarah@creatorcollective.com",
      "campaign_id": "c1c2c3c4-d5d6-e7e8-f9f0-a1a2a3a4a5a6",
      "campaign_name": "Spring Gifting 2026",
      "gifting_status": "PENDING_DETAILS",
      "updated_at": "2026-02-28T16:42:00Z",
      "source_gmail_thread_id": "18df3a2b1c0e4f5a",
      "social_media_handles": [
        {
          "platform": "instagram",
          "handle": "sarahchenlifestyle",
          "url": "https://instagram.com/sarahchenlifestyle"
        },
        {
          "platform": "tiktok",
          "handle": "sarahchen",
          "url": "https://tiktok.com/@sarahchen"
        }
      ]
    },
    {
      "id": "cc2b3c4d-e5f6-a7b8-c9d0-e1f2a3b4c5d6",
      "creator_name": "Mike Rivera",
      "creator_email": null,
      "campaign_id": "d2d3d4d5-e6e7-f8f9-a0a1-b2b3b4b5b6b7",
      "campaign_name": "Paid Promo Q1",
      "gifting_status": null,
      "updated_at": "2026-02-27T09:15:00Z",
      "source_gmail_thread_id": null,
      "social_media_handles": [
        {
          "platform": "youtube",
          "handle": "MikeRiveraFitness",
          "url": "https://youtube.com/@MikeRiveraFitness"
        }
      ]
    }
  ],

  "active_campaigns": [
    {
      "id": "c1c2c3c4-d5d6-e7e8-f9f0-a1a2a3a4a5a6",
      "name": "Spring Gifting 2026",
      "campaign_type": "gifting",
      "status": "active",
      "created_at": "2026-01-15T10:00:00Z",
      "total_creators": 120,
      "opted_in_count": 32,
      "opted_out_count": 8,
      "order_sent_count": 15,
      "replied_count": 42
    },
    {
      "id": "d2d3d4d5-e6e7-f8f9-a0a1-b2b3b4b5b6b7",
      "name": "Paid Promo Q1",
      "campaign_type": "paid_promotion",
      "status": "active",
      "created_at": "2026-02-01T14:30:00Z",
      "total_creators": 45,
      "opted_in_count": 12,
      "opted_out_count": 3,
      "order_sent_count": 0,
      "replied_count": 18
    },
    {
      "id": "e3e4e5e6-f7f8-a9a0-b1b2-c3c4c5c6c7c8",
      "name": "Creator Outreach March",
      "campaign_type": "creator",
      "status": "active",
      "created_at": "2026-02-20T08:00:00Z",
      "total_creators": 35,
      "opted_in_count": 3,
      "opted_out_count": 1,
      "order_sent_count": 0,
      "replied_count": 5
    }
  ],

  "gifting_pipeline": {
    "new": 45,
    "contacted": 28,
    "opted_in": 5,
    "pending_details": 12,
    "ready_to_ship": 8,
    "ordered": 15,
    "opted_out": 8,
    "total": 121
  },

  "paid_promotion_pipeline": {
    "new": 20,
    "negotiating": 8,
    "contract_signed": 3,
    "content_in_progress": 4,
    "awaiting_review": 2,
    "changes_requested": 1,
    "content_approved": 1,
    "posted": 0,
    "awaiting_payment": 1,
    "paid": 0,
    "opted_out": 3,
    "total": 43
  },

  "follow_up_stats": {
    "total_follow_ups": 89,
    "sent_count": 72,
    "pending_count": 8,
    "cancelled_count": 5,
    "failed_count": 4,
    "cancellation_rate": 5.6,
    "conversions_by_follow_up_number": {
      "1": 45,
      "2": 20,
      "3": 7
    }
  },

  "campaign_type_stats": [
    {
      "campaign_type": "gifting",
      "total_creators": 120,
      "converted": 32,
      "conversion_rate": 26.7
    },
    {
      "campaign_type": "paid_promotion",
      "total_creators": 45,
      "converted": 12,
      "conversion_rate": 26.7
    },
    {
      "campaign_type": "creator",
      "total_creators": 35,
      "converted": 3,
      "conversion_rate": 8.6
    }
  ]
}
```

**Example Response** (new user — no campaigns):
```json
{
  "active_campaigns_count": 0,
  "paused_campaigns_count": 0,

  "total_opted_in": 0,
  "total_opted_out": 0,
  "total_new": 0,
  "total_contacts": 0,

  "opt_in_rate": null,
  "response_rate": null,

  "email_stats": {
    "emails_sent": 0,
    "emails_pending": 0,
    "emails_failed": 0
  },

  "recent_optins": [],
  "active_campaigns": [],
  "gifting_pipeline": null,
  "paid_promotion_pipeline": null,
  "follow_up_stats": null,
  "campaign_type_stats": []
}
```

**Slack Formatting Notes**:
- **For a general "how's my dashboard?" question**, format as a summary block:
  ```
  *Dashboard Overview*

  *Campaigns*: 3 active, 1 paused
  *Contacts*: 200 total — 47 opted in (23.5%), 12 opted out, 85 new
  *Response Rate*: 31.2%

  *Emails*: 156 sent, 23 pending, 4 failed

  *Top Campaign*: Spring Gifting 2026 — 32/120 opted in (26.7%)
  ```
- **For pipeline-specific questions** ("how's my gifting pipeline?"), format the pipeline stages:
  ```
  *Gifting Pipeline* (121 total)
  New: 45 → Contacted: 28 → Opted In: 5 → Pending Details: 12 → Ready to Ship: 8 → Ordered: 15 | Opted Out: 8
  ```
- **For follow-up questions** ("how are my follow-ups performing?"), focus on that section:
  ```
  *Follow-up Stats*: 89 total — 72 sent, 8 pending, 5 cancelled (5.6%), 4 failed
  Most effective: Follow-up #1 (45 conversions), #2 (20), #3 (7)
  ```
- **For recent opt-ins**, show as a list with creator name, campaign, and timestamp:
  ```
  *Recent Opt-ins (last 7 days)*
  1. Sarah Chen (sarahchenlifestyle) → Spring Gifting 2026 — Feb 28
  2. Mike Rivera (MikeRiveraFitness) → Paid Promo Q1 — Feb 27
  ```
- **For campaign comparison**, use the `active_campaigns` data:
  ```
  *Active Campaigns*
  | Campaign | Type | Creators | Opt-in | Rate |
  |----------|------|----------|--------|------|
  | Spring Gifting 2026 | gifting | 120 | 32 | 26.7% |
  | Paid Promo Q1 | paid_promotion | 45 | 12 | 26.7% |
  | Creator Outreach March | creator | 35 | 3 | 8.6% |
  ```
- The agent should compute opt-in rate per campaign client-side: `round((opted_in_count / total_creators) * 100, 1)`.
- The "top campaign" (best performing) is computed client-side: the campaign with the highest opt-in rate.
- `campaign_type_stats` data is returned by the API but NOT currently displayed on the frontend dashboard. The agent can use it to answer "which campaign type performs best?" questions.

**Edge Cases**:
- **New user with no campaigns**: All counts are 0, rates are `null`, pipeline sections are `null`, arrays are empty. Agent should suggest creating a campaign.
- **User with only external campaigns**: `response_rate` will be `null` because it only counts internal campaigns (`is_external=false`). The agent should explain this if the user asks about response rate.
- **User with only gifting campaigns**: `paid_promotion_pipeline` will be `null`. Agent should not display the paid promotion pipeline section.
- **User with only paid_promotion campaigns**: `gifting_pipeline` will be `null`. Agent should not display the gifting pipeline section.
- **Recent opt-ins max 20**: Even if more than 20 creators opted in during the lookback window, only the 20 most recent are returned (ordered by `updated_at` DESC).
- **Active campaigns max 10**: Only the 10 most recently created active campaigns are returned. If the user has more than 10 active campaigns, older ones are omitted.
- **AI-drafted email count (dual-join pattern)**: AI-drafted emails are counted by joining `GmailThreadLlmDraft` to BOTH `GmailThreadState` (via `gmail_thread_state_id`) AND `SmtpThreadState` (via `smtp_thread_state_id`) using LEFT OUTER JOINs. The thread status is resolved via `COALESCE(GmailThreadState.status, SmtpThreadState.status)`. Each draft has exactly one of these FKs set (DB CHECK constraint). Drafts where the resolved status != `WAITING_FOR_DRAFT_REVIEW` are counted as "sent." This includes drafts in processing states like `READY_FOR_RESPONSE_DRAFT`. The count is scoped to `GmailThreadLlmDraft.user_id == user_id`.
- **Cancelled emails excluded from email_stats**: Outbox queue items and follow-up queue items with status="cancelled" are NOT counted in any of the 3 `email_stats` buckets (sent/pending/failed). This means `emails_sent + emails_pending + emails_failed` may be LESS than the total queue item count. The agent should note this if the user asks why their email counts don't add up. Follow-up stats DO separately track `cancelled_count`.
- **Gifting pipeline `ordered` field folds together**: `ORDERED` + legacy `SHIPPED` + `DELIVERED` statuses are all counted under the `ordered` stage in the pipeline.
- **`order_sent_count` in active campaigns**: This field is included for backward compatibility. It represents creators with `gifting_status='ORDER_SENT'` and is already a subset of `opted_in_count`. Do not double-count.
- **`conversions_by_follow_up_number` is a misnomer**: Despite the name, this field counts follow-ups with status="sent" grouped by follow-up position index, NOT actual conversions (opt-ins). Keys are follow-up position numbers (1-indexed) — the backend computes `row.index + 1` where `index` is 0-based in the DB. In JSON serialization, integer keys become strings: `{"1": 45, "2": 20}`.
- **`campaign_type` NULL in active campaigns (latent bug)**: The `ActiveCampaignStats` Pydantic model declares `campaign_type: str` (non-nullable), but `Campaign.campaign_type` can be NULL in the DB. If an active campaign has NULL `campaign_type`, the endpoint would raise a Pydantic validation error (500 Internal Server Error). In practice this is unlikely since the campaign wizard requires type selection, but campaigns created via direct DB manipulation or migration could trigger this. The `campaign_type_stats` section handles this correctly by mapping NULL to `"other"`.
- **Response rate vs. replied_count use different status sets**: `response_rate` uses OPTED_IN_STATUSES + `["OPTED_OUT"]` (excludes "DECLINED"), while `replied_count` in `active_campaigns` uses the full REPLIED_STATUSES (includes "DECLINED", "NEGOTIATING", "AWAITING_CONTRACT"). This means `response_rate` can differ from a manually computed rate based on `replied_count`.

**Pagination**: Not applicable. This endpoint has no user-configurable pagination. Hardcoded limits:
- `recent_optins`: max 20, ordered by `updated_at` DESC
- `active_campaigns`: max 10, ordered by `created_at` DESC
- `campaign_type_stats`: one entry per distinct campaign_type (max 5 possible entries)

**Implementation Notes — Corrections from Wave 2**:
1. **Response rate responded count is NOT REPLIED_STATUSES**: Uses `GIFTING_OPTED_IN_STATUSES + ["OPTED_OUT"]` (excludes "DECLINED") and `PAID_PROMOTION_OPTED_IN_STATUSES + ["OPTED_OUT"]` (excludes "NEGOTIATING", "AWAITING_CONTRACT", "DECLINED"). This is a narrower set than the REPLIED_STATUSES used for `replied_count` in active campaigns.
2. **AI-sent count uses dual-table COALESCE join**: Outer joins to both `GmailThreadState` and `SmtpThreadState`, resolves via `COALESCE(gmail.status, smtp.status)`.
3. **Cancelled outbox items are NOT in email_stats**: Only "sent", "pending"/"processing", and "failed" are counted. "cancelled" items are invisible in email_stats but visible in follow_up_stats.cancelled_count.
4. **Gifting pipeline null when zero creators (not zero campaigns)**: The null check is on `sum(gifting_status_counts.values()) > 0`, not on campaign existence. Empty gifting campaigns (0 creators) yield null pipeline.
5. **`conversions_by_follow_up_number` counts sent emails, not conversions**: Despite the field name, it groups follow-ups with status="sent" by `index + 1`, not actual opt-in conversions.

**Service route changes needed**: New `GET /api/service/dashboard/analytics` endpoint that:
1. Accepts `user_id` query parameter (UUID, required)
2. Accepts `recent_optins_days` query parameter (integer, optional, default 7, range 1-30)
3. Authenticates via `X-Service-Api-Key` header (same as other service routes)
4. Replicates the exact aggregation logic from `GET /dashboard/analytics` in `dashboard.py` — all 9 sequential query steps
5. Returns `DashboardAnalyticsResponse` (same Pydantic model)
6. Should ideally extract the query logic into a shared service function to avoid code duplication with the JWT-auth route

**Source verification checklist**:
- [x] Parameter names match actual backend endpoint parameter names (`recent_optins_days` — `dashboard.py:79-81`)
- [x] Types match Pydantic model field types (all 10 models verified — `models/api/dashboard.py:1-142`)
- [x] All enum values listed (7 gifting opted-in, 8 paid opted-in, 9 gifting replied, 12 paid replied, 5 outbox statuses, 5 follow-up statuses, 4 campaign statuses, 8 thread statuses, 5 campaign types)
- [x] Return schema matches actual response serialization (`dashboard.py:648-668`)
- [x] Error conditions from actual code (only 422 from FastAPI Query validation)
- [x] No service route exists — confirmed in `service.py` (360 lines)
- [x] Null conditions verified against actual conditional checks in source
