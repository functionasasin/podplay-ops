# w3-analytics-full — Source Code Verification

**Aspect:** w3-analytics-full
**Date:** 2026-03-01

## Source Files Verified

| File | Lines | What Was Verified |
|------|-------|-------------------|
| `backend/src/api/route/dashboard.py` | 668 | All 9 query steps, status constant definitions, AI-sent count dual-join, response rate formula |
| `backend/src/models/api/dashboard.py` | 142 | All 10 Pydantic response models, field types, nullability |
| `backend/src/api/route/service.py` | 360 | Confirmed NO `/api/service/dashboard/analytics` route exists |
| `backend/src/models/database/campaign.py` | — | `CampaignStatus` enum (4 values), `CampaignOutboxQueueStatus` enum (5 values) |
| `backend/src/models/database/campaign_follow_up_outbox_queue.py` | — | `CampaignFollowUpOutboxQueueStatus` enum (5 values), `index` field (0-based integer) |
| `backend/src/models/database/gmail_thread_state.py` | — | `GmailThreadStatus` enum (8 values), confirmed `WAITING_FOR_DRAFT_REVIEW` value |
| `backend/src/models/database/smtp_thread_state.py` | — | `status` field uses same `GmailThreadStatus` enum |
| `backend/src/models/database/gmail_thread_llm_draft.py` | 63 | XOR nullable FKs: `gmail_thread_state_id` OR `smtp_thread_state_id`, `gmail_account_id` OR `smtp_account_id` |

## Corrections from Wave 2

### Correction 1: Response Rate "Responded" Count

**Wave 2 said:** "internal_responded = creators in internal campaigns where status is in replied statuses (opted-in + opted-out)"

**Actual code (dashboard.py lines 219-226):** Uses `GIFTING_OPTED_IN_STATUSES + ["OPTED_OUT"]` (8 statuses) and `PAID_PROMOTION_OPTED_IN_STATUSES + ["OPTED_OUT"]` (9 statuses).

**Difference from REPLIED_STATUSES constants:**
- Response rate EXCLUDES "DECLINED" from gifting (GIFTING_REPLIED_STATUSES has it)
- Response rate EXCLUDES "NEGOTIATING", "AWAITING_CONTRACT", "DECLINED" from paid promotion (PAID_PROMOTION_REPLIED_STATUSES has all three)

**Impact:** Response rate counts a narrower set of "responded" creators than the `replied_count` field in active campaigns. This is intentional — response rate measures "any reply" (opted in OR explicitly opted out), while "DECLINED" is likely a system-level classification distinct from a direct email reply.

### Correction 2: Cancelled Emails Excluded from email_stats

**Wave 2 said:** email_stats has sent/pending/failed counts.

**Actual code (dashboard.py lines 338-342):** The "cancelled" outbox status is NOT counted in any of the 3 email_stats buckets. Cancelled outbox items (both initial and follow-up) are silently excluded.

**Impact:** `emails_sent + emails_pending + emails_failed` may be LESS than the total outbox + follow-up queue item count. The difference = cancelled items. The spec should document this.

### Correction 3: AI-Sent Count Uses COALESCE Dual-Join Pattern

**Wave 2 said:** "AI-drafted emails sent via GmailThreadLlmDraft are included if their thread status != WAITING_FOR_DRAFT_REVIEW"

**Actual code (dashboard.py lines 354-372):**
```python
.outerjoin(GmailThreadState, GmailThreadLlmDraft.gmail_thread_state_id == GmailThreadState.id)
.outerjoin(SmtpThreadState, GmailThreadLlmDraft.smtp_thread_state_id == SmtpThreadState.id)
.where(func.coalesce(GmailThreadState.status, SmtpThreadState.status) != GmailThreadStatus.WAITING_FOR_DRAFT_REVIEW)
```

Uses COALESCE to pick whichever thread state is non-null (Gmail or SMTP). Each `GmailThreadLlmDraft` has exactly one of `gmail_thread_state_id` or `smtp_thread_state_id` set (CHECK constraint in DB).

### Correction 4: campaign_type Can Be NULL in ActiveCampaignStats

**Wave 2 said:** campaign_type is `string — one of: 'gifting', 'paid_promotion', 'creator', 'sales', 'other'`

**Actual Pydantic model:** `campaign_type: str` (not optional). But `Campaign.campaign_type` in the DB can be NULL. If an active campaign has NULL `campaign_type`, Pydantic v2 would raise a validation error (500 Internal Server Error). This is a latent bug (unlikely in practice since the campaign wizard requires type selection, but possible for campaigns created via API or migration).

### Correction 5: Gifting Pipeline Null Condition Precision

**Wave 2 said:** "null if the user has no gifting campaigns or the total is 0"

**Actual code (dashboard.py lines 478-479):** `gifting_total = sum(gifting_status_counts.values())` then `if gifting_total > 0`. The query filters by `Campaign.campaign_type == "gifting"`. So it's null when:
- `user_campaign_ids` is empty (no campaigns at all), OR
- The sum of ALL creator status counts across gifting-type campaigns is 0 (which means no creators exist in any gifting campaign, even if gifting campaigns exist with 0 creators)

## New Discoveries

### Discovery 1: Outbox Queue Status Enums

Both `CampaignOutboxQueueStatus` and `CampaignFollowUpOutboxQueueStatus` have identical 5 values: `pending`, `processing`, `sent`, `failed`, `cancelled`. The dashboard uses string comparison, not the enum directly.

### Discovery 2: CampaignStatus Enum

`CampaignStatus` has 4 values: `active`, `paused`, `draft`, `completed`. The dashboard `campaign_counts` query groups ALL statuses but only reports `active` and `paused` counts. `draft` and `completed` campaign counts are computed but discarded.

### Discovery 3: GmailThreadStatus Full Enum

8 values: `READY_FOR_ATTACHMENT_EXTRACTION`, `READY_FOR_CAMPAIGN_ASSOCIATION`, `READY_FOR_RESPONSE_DRAFT`, `WAITING_FOR_DRAFT_REVIEW`, `WAITING_FOR_INBOUND`, `IGNORE`, `DONE`, `NOT_LATEST`. The AI-sent count excludes only `WAITING_FOR_DRAFT_REVIEW`; all other statuses (including processing states) are counted as "sent."

### Discovery 4: Follow-up `conversions_by_follow_up_number` Counts Sent, Not Conversions

The field name is misleading. `conversions_by_follow_up_number` counts follow-up emails with status="sent" grouped by follow-up index+1. It does NOT measure actual conversions (opt-ins). The name suggests conversion tracking but the query is `WHERE status == "sent" GROUP BY index`.

## Verification Checklist

- [x] Parameter names match actual backend endpoint parameter names: `recent_optins_days` confirmed at dashboard.py:79-81
- [x] Types match Pydantic model field types: All 10 Pydantic models verified field-by-field
- [x] Enum values are complete: All status enums verified (5 outbox statuses, 5 follow-up statuses, 4 campaign statuses, 8 thread statuses, 7+8 opted-in statuses, 9+12 replied statuses)
- [x] Return schema matches actual response serialization: All fields confirmed in DashboardAnalyticsResponse constructor at dashboard.py:648-668
- [x] Error conditions come from actual raise statements: Only 422 validation error from FastAPI Query validation
- [x] Pagination matches actual implementation: N/A — hardcoded limits (20 recent opt-ins, 10 active campaigns)
- [x] No service route exists: Confirmed service.py has no dashboard endpoint
