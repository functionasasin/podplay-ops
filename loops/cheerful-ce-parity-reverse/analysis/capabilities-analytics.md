# Analytics — Capability Extraction

**Aspect:** w1-analytics
**Date:** 2026-03-01
**Sources consulted:**
- `loops/cheerful-reverse/analysis/synthesis/spec-backend-api.md` (Domain 25)
- `loops/cheerful-reverse/analysis/synthesis/spec-webapp.md` (Dashboard section)
- `projects/cheerful/apps/backend/src/api/route/dashboard.py` (source of truth)
- `projects/cheerful/apps/backend/src/models/api/dashboard.py` (Pydantic models)
- `projects/cheerful/apps/webapp/app/(mail)/dashboard/page.tsx` (frontend consumer)
- `projects/cheerful/apps/webapp/hooks/use-dashboard-analytics.ts` (API hook)
- `projects/cheerful/apps/context-engine/app/src_v2/mcp/tools/cheerful/api.py` (CE call pattern)

---

## Existing Context Engine Tools

| Tool | Description | Coverage |
|------|-------------|----------|
| (none) | No analytics tools exist in the CE | 0% |

---

## Critical Architecture Gap: No Service Route for Analytics

The dashboard analytics endpoint (`GET /dashboard/analytics`) uses **JWT authentication** (`get_current_user` dependency), NOT the service API key pattern used by all existing CE tools.

All existing CE tools call `/api/service/*` routes authenticated via `X-Service-Api-Key`. There is **no** `/api/service/dashboard/analytics` endpoint.

**Implication for spec:** The `cheerful_get_dashboard_analytics` tool spec must document that a new service route must be added: `GET /api/service/dashboard/analytics` with `user_id` query param and `X-Service-Api-Key` auth. The spec must describe what that route should implement (mirroring the JWT route's logic with service auth).

---

## Frontend Dashboard Components and Their Data Sources

The `/dashboard` page (`DashboardPage` component) shows 9 distinct UI sections, all populated from ONE endpoint response:

| UI Component | Data Field(s) Used | Notes |
|---|---|---|
| Metric: Total Creators | `total_contacts` | Count of all creators across all campaigns |
| Metric: Response Rate / Total Opted In | `response_rate` (if non-null) else `total_opted_in` | Response rate = responses ÷ emails_sent (internal campaigns only) |
| Metric: Emails Sent (+ pending/failed) | `email_stats.emails_sent`, `.emails_pending`, `.emails_failed` | Includes initial outreach + follow-ups + AI-sent emails |
| Metric: Total Opt-in Rate | `opt_in_rate` | Percentage (0-100), null if no contacts |
| Active Campaigns Table | `active_campaigns[]` | Up to 10 campaigns; sorted by created_at desc, status=active only |
| Follow-up Stats Card | `follow_up_stats` | null if no follow-ups exist |
| Top Campaign Card | Computed from `active_campaigns[]` (frontend) | Best opt-in rate; computed on frontend, no additional API call |
| Gifting Pipeline Card | `gifting_pipeline` | null if no gifting campaign creators exist |
| Paid Promotion Pipeline Card | `paid_promotion_pipeline` | null if no paid promotion creators exist |
| Recent Opt-ins List | `recent_optins[]` | Up to 20 entries; ordered by updated_at desc |

---

## Backend Capabilities

### Endpoint: `GET /dashboard/analytics`

**Auth:** `get_current_user` (JWT — webapp only; CE needs service route)
**Query Parameters:**

| Param | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| `recent_optins_days` | integer | no | 7 | ge=1, le=30 |

**Business Logic (from source code):**

The handler performs 9 sequential database queries in a single session:

1. **Campaign counts**: Groups user's campaigns by `status` → yields `active_campaigns_count`, `paused_campaigns_count`

2. **Cross-campaign opt-in stats**: Counts `CampaignCreator` rows across ALL user's campaigns:
   - `total_opted_in`: creators where `gifting_status IN GIFTING_OPTED_IN_STATUSES` OR `paid_promotion_status IN PAID_PROMOTION_OPTED_IN_STATUSES`
   - `total_opted_out`: creators where either status = "OPTED_OUT"
   - `total_contacts`: total creator rows across all campaigns
   - `total_new`: creators where either status = "NEW"

3. **Response rate** (internal campaigns only): `responded / emails_sent * 100`. Denominator = CampaignOutboxQueue rows with `status="sent"` for non-external campaigns. Numerator = CampaignCreator rows with gifting replied statuses OR paid promotion replied statuses.

4. **Recent opt-ins**: Creators with opted-in status and `updated_at >= cutoff`. Joins to get `campaign_name`. Limit: 20. Includes social media handles.

5. **Email stats**: Aggregates `CampaignOutboxQueue.status` counts across all user's campaigns. Adds follow-up queue counts. Adds AI-sent drafts (GmailThreadLlmDraft rows where status != WAITING_FOR_DRAFT_REVIEW).

6. **Active campaigns with stats**: Top 10 active campaigns (status="active"), each with:
   - `total_creators`, `opted_in_count`, `opted_out_count`, `order_sent_count` (legacy), `replied_count`
   - `replied_count` uses union of GIFTING_REPLIED_STATUSES + PAID_PROMOTION_REPLIED_STATUSES

7. **Gifting pipeline**: Status breakdown for creators in gifting-type campaigns. Returns null if zero total. SHIPPED and DELIVERED are folded into `ordered` bucket.

8. **Paid promotion pipeline**: Status breakdown for creators in paid_promotion-type campaigns. Returns null if zero total.

9. **Follow-up stats**: Aggregated `CampaignFollowUpOutboxQueue` status counts + conversions by follow-up index number.

10. **Campaign type stats**: Aggregated by `campaign_type` across ALL user's campaigns (not just active). Computes `conversion_rate` per type.

**Gifting status constants (from source):**

```python
GIFTING_OPTED_IN_STATUSES = [
    "OPTED_IN",         # Legacy
    "ORDER_SENT",       # Legacy
    "SHIPPED",          # Legacy - product was shipped
    "DELIVERED",        # Legacy - product was delivered
    "PENDING_DETAILS",  # Creator expressed interest but missing shipping info
    "READY_TO_SHIP",    # Interest confirmed + all shipping details collected
    "ORDERED",          # Product ordered (final fulfillment status)
]

GIFTING_REPLIED_STATUSES = GIFTING_OPTED_IN_STATUSES + [
    "OPTED_OUT",  # Replied to decline
    "DECLINED",   # Explicitly declined
]
```

**Paid promotion status constants (from source):**

```python
PAID_PROMOTION_OPTED_IN_STATUSES = [
    "CONTRACT_SIGNED",      # Contract signed
    "CONTENT_IN_PROGRESS",  # Creator producing content
    "AWAITING_REVIEW",      # Content draft submitted
    "CHANGES_REQUESTED",    # Brand requested revisions
    "CONTENT_APPROVED",     # Content approved
    "POSTED",               # Content published
    "AWAITING_PAYMENT",     # Waiting for payment
    "PAID",                 # Payment processed
]

PAID_PROMOTION_REPLIED_STATUSES = PAID_PROMOTION_OPTED_IN_STATUSES + [
    "NEGOTIATING",          # Responded, discussing terms
    "AWAITING_CONTRACT",    # Agreed on terms, pending signature
    "OPTED_OUT",            # Replied to decline
    "DECLINED",             # Explicitly declined
]
```

**Full Response Schema (from `DashboardAnalyticsResponse` Pydantic model):**

```python
class DashboardAnalyticsResponse:
    active_campaigns_count: int
    paused_campaigns_count: int
    total_opted_in: int       # All opted-in statuses for both campaign types
    total_opted_out: int      # Both gifting and paid OPTED_OUT
    total_new: int            # NEW status (not yet responded)
    total_contacts: int       # Total CampaignCreator rows across all campaigns
    opt_in_rate: float | None # (total_opted_in / total_contacts) * 100, rounded to 1 decimal; None if total_contacts==0
    response_rate: float | None  # (responded / emails_sent) * 100 (internal campaigns only); None if no emails sent

    email_stats: EmailStats
        emails_sent: int      # Outbox "sent" + follow-up "sent" + AI-sent drafts
        emails_pending: int   # Outbox "pending"+"processing" + follow-up same
        emails_failed: int    # Outbox "failed" + follow-up "failed"

    recent_optins: list[RecentOptinResponse]  # Up to 20, ordered by updated_at desc
        id: UUID
        creator_name: str | None
        creator_email: str | None
        campaign_id: UUID
        campaign_name: str
        gifting_status: str | None
        updated_at: datetime
        source_gmail_thread_id: str | None
        social_media_handles: list[SocialMediaHandle]  # default []
            platform: str
            handle: str
            url: str | None

    active_campaigns: list[ActiveCampaignStats]  # Up to 10, status=active, ordered by created_at desc
        id: UUID
        name: str
        campaign_type: str    # "gifting", "paid_promotion", "creator", "sales", "other"
        status: str           # always "active"
        created_at: datetime
        total_creators: int
        opted_in_count: int   # Union of gifting + paid opted-in statuses
        opted_out_count: int  # Union of gifting + paid OPTED_OUT
        order_sent_count: int # Legacy: gifting_status=="ORDER_SENT" only; kept for backwards compat
        replied_count: int    # Union of GIFTING_REPLIED_STATUSES + PAID_PROMOTION_REPLIED_STATUSES

    gifting_pipeline: GiftingPipeline | None  # None if no gifting campaign creators exist
        new: int
        contacted: int
        opted_in: int         # Legacy OPTED_IN only (not the full opted-in set)
        pending_details: int
        ready_to_ship: int
        ordered: int          # ORDERED + SHIPPED + DELIVERED (legacy folded in)
        opted_out: int
        total: int

    paid_promotion_pipeline: PaidPromotionPipeline | None  # None if no paid_promotion creators exist
        new: int
        negotiating: int
        contract_signed: int
        content_in_progress: int
        awaiting_review: int
        changes_requested: int
        content_approved: int
        posted: int
        awaiting_payment: int
        paid: int
        opted_out: int
        total: int

    follow_up_stats: FollowUpStats | None  # None if no follow-up records exist
        total_follow_ups: int
        sent_count: int
        pending_count: int        # "pending" + "processing" combined
        cancelled_count: int
        failed_count: int
        cancellation_rate: float | None  # (cancelled / total) * 100; None if total==0
        conversions_by_follow_up_number: dict[int, int]  # {1: 5, 2: 3, 3: 1} (1-indexed)

    campaign_type_stats: list[CampaignTypeStats]  # One entry per distinct campaign_type
        campaign_type: str        # Defaults to "other" if NULL
        total_creators: int
        converted: int            # Union of gifting + paid opted-in statuses
        conversion_rate: float | None  # (converted / total_creators) * 100; None if total==0
```

---

## Tool Design (Preliminary)

| Tool | Action | Backend Endpoint (needed) | Auth Pattern |
|------|--------|--------------------------|--------------|
| `cheerful_get_dashboard_analytics` | Get full dashboard analytics summary | NEW: `GET /api/service/dashboard/analytics` | Service API Key + user_id query param |

**Note:** Only ONE tool is needed for the analytics domain. The entire dashboard is one API call.

**Note:** There is no per-campaign analytics endpoint in this domain. Per-campaign stats are obtained via:
- `GET /campaigns/?include_stats=true` (in campaigns domain → yields `sent_count`, `pending_count`, `failed_count`, `total_recipients`, `thread_count` per campaign)
- `GET /dashboard/analytics` active_campaigns field (top 10 active campaigns with opt-in stats)

---

## Discovered Gaps / New Aspects

1. **Service route gap**: `GET /dashboard/analytics` has no `/api/service/` equivalent. The Wave 3 spec must note that implementation requires adding `GET /api/service/dashboard/analytics` to `service.py`.

2. **Campaign type enum**: The frontend TypeScript type shows `CampaignType = 'paid_promotion' | 'creator' | 'gifting' | 'sales' | 'other'`. This exact enum is needed in the analytics tool spec.

3. **Follow-up index is 0-indexed in DB, 1-indexed in response**: `conversions_by_follow_up_number` dict keys are `row.index + 1` (verified from source).

4. **AI-sent emails counted in email_stats.emails_sent**: AI-drafted emails sent via `GmailThreadLlmDraft` are included if their thread status != `WAITING_FOR_DRAFT_REVIEW`. This cross-table join is not obvious from the response schema alone.

---

## Frontend-Only Capabilities (No Additional Endpoint Needed)

| UI Feature | How Computed |
|------------|--------------|
| "Top Campaign" card | Computed on frontend from `active_campaigns[]`: campaign with highest `opted_in_count / total_creators` ratio |
| WelcomeModal / WalkthroughModal | Uses `GET /user/onboarding-status` (users domain, not analytics) |
| Empty state detection | `active_campaigns_count === 0 && paused_campaigns_count === 0` |

---

## Summary

**Analytics domain is minimal: 1 backend endpoint, 1 CE tool needed.**

The tool `cheerful_get_dashboard_analytics` will expose the full dashboard analytics summary with all 9 metric sections. Key constraint: requires adding a new service route since the existing endpoint uses JWT auth incompatible with the CE's service-key authentication model.
