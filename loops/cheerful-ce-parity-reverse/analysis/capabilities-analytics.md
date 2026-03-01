# Analytics — Capability Extraction

## Existing Context Engine Tools

| Tool | Description | Coverage |
|------|-------------|----------|
| (none) | No analytics tools exist in the context engine | 0% coverage |

## Service Route Status

**No service route exists for dashboard analytics.** The `GET /dashboard/analytics` endpoint uses JWT auth (`get_current_user`). A new `GET /api/service/dashboard/analytics` endpoint must be created for the context engine to access this data.

Existing service routes (`/api/service/*`) in `service.py` cover: campaigns, threads/search, threads/{id}, rag/similar, campaign creators (list, detail), creators/search — but NO analytics/dashboard endpoints.

## Backend Endpoints

There is exactly **1 dedicated analytics endpoint** in the backend:

### Endpoint 1: `GET /dashboard/analytics`

**Source**: `src/api/route/dashboard.py`
**Auth**: JWT required (`get_current_user`)
**Router prefix**: `/dashboard`

**Query Parameters**:

| Parameter | Type | Required | Default | Validation | Description |
|-----------|------|----------|---------|------------|-------------|
| `recent_optins_days` | int | no | 7 | ge=1, le=30 | Days to look back for recent opt-ins |

**Response Model**: `DashboardAnalyticsResponse` (from `src/models/api/dashboard.py`)

**Response contains 10 data sections**:

#### Section 1: Campaign Counts
- `active_campaigns_count: int` — Count of campaigns with status="active" for this user
- `paused_campaigns_count: int` — Count of campaigns with status="paused" for this user

#### Section 2: Opt-in Stats (aggregated across ALL user campaigns)
- `total_opted_in: int` — Creators where gifting_status IN GIFTING_OPTED_IN_STATUSES OR paid_promotion_status IN PAID_PROMOTION_OPTED_IN_STATUSES
- `total_opted_out: int` — Creators where gifting_status="OPTED_OUT" OR paid_promotion_status="OPTED_OUT"
- `total_new: int` — Creators where gifting_status="NEW" OR paid_promotion_status="NEW"
- `total_contacts: int` — Total creators across all user campaigns (unfiltered count)

#### Section 3: Calculated Metrics
- `opt_in_rate: float | None` — `round((total_opted_in / total_contacts) * 100, 1)`. None if total_contacts=0. Percentage 0-100.
- `response_rate: float | None` — `round((internal_responded / internal_emails_sent) * 100, 1)`. Only for internal campaigns (is_external=False). None if no internal campaigns or no emails sent. Percentage 0-100.

**Response rate calculation details**:
- Only counts campaigns where `is_external=False`
- `internal_emails_sent` = count of outbox queue items with status="sent" for internal campaigns
- `internal_responded` = count of creators in internal campaigns where gifting_status IN (GIFTING_OPTED_IN_STATUSES + ["OPTED_OUT"]) OR paid_promotion_status IN (PAID_PROMOTION_OPTED_IN_STATUSES + ["OPTED_OUT"])

#### Section 4: Email Stats (`EmailStats` sub-model)
- `emails_sent: int` — Total sent emails (initial outreach + follow-ups + AI-drafted emails that were actually sent)
- `emails_pending: int` — Total pending emails (initial "pending"+"processing" + follow-up "pending"+"processing")
- `emails_failed: int` — Total failed emails (initial "failed" + follow-up "failed")

**AI sent count detail**: Counts `GmailThreadLlmDraft` records for this user where the associated `GmailThreadState` or `SmtpThreadState` status != `WAITING_FOR_DRAFT_REVIEW`. This is added to the `emails_sent` total.

#### Section 5: Recent Opt-ins (`list[RecentOptinResponse]`, max 20)
Each item:
- `id: UUID` — CampaignCreator.id
- `creator_name: str | None` — CampaignCreator.name
- `creator_email: str | None` — CampaignCreator.email
- `campaign_id: UUID` — CampaignCreator.campaign_id
- `campaign_name: str` — Campaign.name (joined)
- `gifting_status: str | None` — CampaignCreator.gifting_status
- `updated_at: datetime` — CampaignCreator.updated_at
- `source_gmail_thread_id: str | None` — CampaignCreator.source_gmail_thread_id
- `social_media_handles: list[SocialMediaHandle]` — Each has: platform (str), handle (str), url (str|None)

**Selection criteria**: CampaignCreator.campaign_id in user's campaigns AND (gifting_status IN GIFTING_OPTED_IN_STATUSES OR paid_promotion_status IN PAID_PROMOTION_OPTED_IN_STATUSES) AND updated_at >= cutoff_date. Ordered by updated_at DESC, limit 20.

#### Section 6: Active Campaigns (`list[ActiveCampaignStats]`, max 10)
Each item:
- `id: UUID` — Campaign.id
- `name: str` — Campaign.name
- `campaign_type: str` — Campaign.campaign_type
- `status: str` — Campaign.status (always "active" since filtered)
- `created_at: datetime` — Campaign.created_at
- `total_creators: int` — Count of CampaignCreator for this campaign
- `opted_in_count: int` — Count where gifting_status IN GIFTING_OPTED_IN_STATUSES OR paid_promotion_status IN PAID_PROMOTION_OPTED_IN_STATUSES
- `opted_out_count: int` — Count where gifting_status="OPTED_OUT" OR paid_promotion_status="OPTED_OUT"
- `order_sent_count: int` — Count where gifting_status="ORDER_SENT" (backward compat, included in opted_in_count already)
- `replied_count: int` — Count where gifting_status IN GIFTING_REPLIED_STATUSES OR paid_promotion_status IN PAID_PROMOTION_REPLIED_STATUSES

**Selection**: user_id=user, status="active", ordered by created_at DESC, limit 10.

#### Section 7: Gifting Pipeline (`GiftingPipeline | None`)
Only populated if there are gifting campaigns (campaign_type="gifting") with creators:
- `new: int`
- `contacted: int`
- `opted_in: int`
- `pending_details: int`
- `ready_to_ship: int`
- `ordered: int` — Folds ORDERED + legacy SHIPPED + DELIVERED
- `opted_out: int`
- `total: int`

Returns None if no gifting campaigns or total=0.

#### Section 8: Paid Promotion Pipeline (`PaidPromotionPipeline | None`)
Only populated if there are paid_promotion campaigns:
- `new: int`
- `negotiating: int`
- `contract_signed: int`
- `content_in_progress: int`
- `awaiting_review: int`
- `changes_requested: int`
- `content_approved: int`
- `posted: int`
- `awaiting_payment: int`
- `paid: int`
- `opted_out: int`
- `total: int`

Returns None if no paid_promotion campaigns or total=0.

#### Section 9: Follow-up Stats (`FollowUpStats | None`)
Only populated if there are follow-up outbox queue items:
- `total_follow_ups: int` — Sum of all follow-up queue item counts
- `sent_count: int` — Follow-ups with status="sent"
- `pending_count: int` — Follow-ups with status="pending" or "processing"
- `cancelled_count: int` — Follow-ups with status="cancelled"
- `failed_count: int` — Follow-ups with status="failed"
- `cancellation_rate: float | None` — `round((cancelled_count / total_follow_ups) * 100, 1)`. None if total=0. Percentage 0-100.
- `conversions_by_follow_up_number: dict[int, int]` — Map of (follow-up index + 1) → sent count. E.g., {1: 5, 2: 3} means follow-up #1 had 5 sent, #2 had 3 sent.

Returns None if no follow-up queue items exist.

#### Section 10: Campaign Type Stats (`list[CampaignTypeStats]`)
Aggregated by campaign_type across all user's campaigns:
- `campaign_type: str` — One of: "gifting", "paid_promotion", "creator", "sales", "other" (or null → "other")
- `total_creators: int` — Total CampaignCreator count for campaigns of this type
- `converted: int` — Count where gifting_status IN GIFTING_OPTED_IN_STATUSES OR paid_promotion_status IN PAID_PROMOTION_OPTED_IN_STATUSES
- `conversion_rate: float | None` — `round((converted / total_creators) * 100, 1)`. None if total_creators=0. Percentage 0-100.

## Enum Values Referenced (verified from source)

### GIFTING_OPTED_IN_STATUSES
- "OPTED_IN" (legacy)
- "ORDER_SENT" (legacy)
- "SHIPPED" (legacy)
- "DELIVERED" (legacy)
- "PENDING_DETAILS"
- "READY_TO_SHIP"
- "ORDERED"

### PAID_PROMOTION_OPTED_IN_STATUSES
- "CONTRACT_SIGNED"
- "CONTENT_IN_PROGRESS"
- "AWAITING_REVIEW"
- "CHANGES_REQUESTED"
- "CONTENT_APPROVED"
- "POSTED"
- "AWAITING_PAYMENT"
- "PAID"

### GIFTING_REPLIED_STATUSES (GIFTING_OPTED_IN_STATUSES + these)
- "OPTED_OUT"
- "DECLINED"

### PAID_PROMOTION_REPLIED_STATUSES (PAID_PROMOTION_OPTED_IN_STATUSES + these)
- "NEGOTIATING"
- "AWAITING_CONTRACT"
- "OPTED_OUT"
- "DECLINED"

### CampaignType Values (from frontend TypeScript)
- "paid_promotion"
- "creator"
- "gifting"
- "sales"
- "other"

### Follow-up Queue Statuses (from dashboard.py logic)
- "sent"
- "pending"
- "processing"
- "cancelled"
- "failed"

### Outbox Queue Statuses (from dashboard.py logic)
- "sent"
- "pending"
- "processing"
- "failed"

### GmailThreadStatus used in AI count
- `WAITING_FOR_DRAFT_REVIEW` — drafts in this status are NOT counted as sent

## Frontend Capabilities (Dashboard Page)

**Source**: `app/(mail)/dashboard/page.tsx` + `hooks/use-dashboard-analytics.ts`

The dashboard page fetches `GET /api/dashboard/analytics` and renders:

| # | Visual Component | Data Source | User Action |
|---|-----------------|-------------|-------------|
| 1 | MetricCard: "Total Creators" | `analytics.total_contacts` | View-only |
| 2 | MetricCard: "Response Rate" (gauge) OR MetricCard: "Total Opted In" | `analytics.response_rate` (if not null) OR `analytics.total_opted_in` | View-only. Shows gauge if response_rate exists (internal campaigns), otherwise plain number. |
| 3 | EmailStatsCard: emails sent/pending/failed | `analytics.email_stats` | View-only |
| 4 | MetricCard: "Total Opt-in Rate" (gauge) | `analytics.opt_in_rate` | View-only |
| 5 | ActiveCampaignsCard: table of active campaigns | `analytics.active_campaigns` | View-only. "View All" links to /campaigns. "Create Campaign" navigates to /campaigns/new. Per-campaign: name, type badge, creators count, opt-ins count, opt-in rate %, reply rate %. |
| 6 | FollowUpStatsCard: follow-up effectiveness | `analytics.follow_up_stats` | View-only. Shows total follow-ups, cancellation rate, status breakdown (sent/pending/cancelled/failed), most effective follow-up #, conversions by follow-up number. |
| 7 | TopCampaignCard: best performing campaign | Computed client-side from `analytics.active_campaigns` (highest opt-in rate) | View-only |
| 8 | PipelineCard: "Gifting Pipeline" | `analytics.gifting_pipeline` | View-only. Shows 7-stage stacked bar: New, Contacted, Opted In, Pending Details, Ready to Ship, Ordered, Opted Out. Only renders if total > 0. |
| 9 | PipelineCard: "Paid Promotion Pipeline" | `analytics.paid_promotion_pipeline` | View-only. Shows 11-stage stacked bar: New, Negotiating, Contract Signed, Content In Progress, Awaiting Review, Changes Requested, Content Approved, Posted, Awaiting Payment, Paid, Opted Out. Only renders if total > 0. |
| 10 | RecentOptinsCard: recent opt-ins list | `analytics.recent_optins` | View-only. Shows creator name/email, campaign name, timestamp, social media handles. |

### Components Defined But NOT Currently Rendered
- `CampaignTypeComparisonCard` — Component exists at `dashboard/components/campaign-type-comparison-card.tsx` but is NOT imported/used in `page.tsx`. Data (`campaign_type_stats`) is returned by the API but not displayed.
- `RecentPostsCard` — Component file exists but not imported in `page.tsx`.
- `TopCreatorCard` — Component file exists but not imported in `page.tsx`.
- `ReachChartCard` — Component file exists but not imported in `page.tsx`.
- `FilterDropdown` — Component file exists but not imported in `page.tsx`.
- `TrendBadge` — Component file exists but not imported in `page.tsx`.

### Modal/Walkthrough Components (not analytics)
- `WelcomeModal` — First-visit welcome, not analytics
- `WalkthroughModal` — App walkthrough, not analytics
- `SetupModal` — Email connection prompt, not analytics

## Per-Campaign Stats (Cross-Domain)

The `GET /campaigns?include_stats=true` endpoint on the campaigns router also provides per-campaign metrics:
- `sent_count: int | None` — Outbox queue sent count
- `pending_count: int | None` — Outbox queue pending count
- `failed_count: int | None` — Outbox queue failed count
- `total_recipients: int | None` — Unified participant count
- `thread_count: int | None` — CampaignThread record count

**Note**: This is in the **campaigns** domain, not analytics. The existing CE tool `cheerful_list_campaigns` uses the service route `GET /api/service/campaigns` which does NOT include these stats. The user-facing campaign list (`GET /campaigns?include_stats=true`) provides them but requires JWT auth.

## Gap Analysis

| Capability | Backend | Service Route | CE Tool | Gap |
|-----------|---------|--------------|---------|-----|
| Dashboard analytics (full composite) | GET /dashboard/analytics | MISSING | MISSING | Need service route + CE tool |
| Per-campaign stats on campaign list | GET /campaigns?include_stats=true | GET /api/service/campaigns (NO stats) | cheerful_list_campaigns (basic) | Partial — service route needs stats support |

## Tool Estimates

**Minimum 1, maximum 3 new CE tools needed**:

1. `cheerful_get_dashboard_analytics` — Full dashboard overview (the primary tool)
2. Optional: `cheerful_get_gifting_pipeline` — Dedicated gifting pipeline view (could be subset of #1)
3. Optional: `cheerful_get_paid_pipeline` — Dedicated paid promotion pipeline view (could be subset of #1)

**Recommendation**: Keep it as 1 comprehensive tool matching the single backend endpoint. The data is already well-structured by the API. The Claude agent can extract relevant sections from the composite response based on user questions.

**Backend prerequisite**: A new service route `GET /api/service/dashboard/analytics` must be created, mirroring the logic from `GET /dashboard/analytics` but using service API key auth + user_id query parameter instead of JWT auth.

## Status Constants Defined in dashboard.py

These constants are defined at module level in `dashboard.py` and control which creator statuses count toward various metrics. They are NOT configurable — they are hardcoded:

**GIFTING_OPTED_IN_STATUSES** (7 values): OPTED_IN, ORDER_SENT, SHIPPED, DELIVERED, PENDING_DETAILS, READY_TO_SHIP, ORDERED

**PAID_PROMOTION_OPTED_IN_STATUSES** (8 values): CONTRACT_SIGNED, CONTENT_IN_PROGRESS, AWAITING_REVIEW, CHANGES_REQUESTED, CONTENT_APPROVED, POSTED, AWAITING_PAYMENT, PAID

**GIFTING_REPLIED_STATUSES** (9 values): All GIFTING_OPTED_IN_STATUSES + OPTED_OUT, DECLINED

**PAID_PROMOTION_REPLIED_STATUSES** (12 values): All PAID_PROMOTION_OPTED_IN_STATUSES + NEGOTIATING, AWAITING_CONTRACT, OPTED_OUT, DECLINED
