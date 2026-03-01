# w2-analytics — Tool Design Working Notes

## Design Decision: Single Comprehensive Tool

**Decision**: 1 tool (`cheerful_get_dashboard_analytics`) instead of 3 (separate pipeline + follow-up tools).

**Rationale**:
1. Backend has exactly 1 endpoint (`GET /dashboard/analytics`) that runs a single composite query
2. All 10 data sections are returned together — no way to request partial data from the backend
3. Splitting into multiple CE tools would mean 3 identical backend calls returning the same payload
4. The Claude agent can selectively format relevant sections based on user questions
5. The Wave 1 analysis recommended this approach

**Alternative considered**: Separate `cheerful_get_gifting_pipeline` and `cheerful_get_paid_pipeline` tools. Rejected because they'd call the same endpoint and waste bandwidth. If users frequently ask about only one pipeline, the agent can still answer from the full response.

## Tool Summary

| # | Tool | Backend Endpoint | Service Route | Status |
|---|------|-----------------|---------------|--------|
| 1 | `cheerful_get_dashboard_analytics` | `GET /dashboard/analytics` | `GET /api/service/dashboard/analytics` (NEW) | NEW |

## Key Design Notes

1. **Only 1 user-facing parameter**: `recent_optins_days` (int, 1-30, default 7). Everything else is computed from the user's campaign data.
2. **3 nullable sections**: `gifting_pipeline`, `paid_promotion_pipeline`, `follow_up_stats` — all return `null` when no relevant data exists. Other sections return empty arrays `[]` or `0`.
3. **4 nullable rate fields**: `opt_in_rate`, `response_rate`, `cancellation_rate`, per-type `conversion_rate` — all return `null` instead of dividing by zero.
4. **response_rate is special**: Only counts internal campaigns (`is_external=false`). External campaigns are excluded from the calculation.
5. **AI-drafted emails in sent count**: `emails_sent` includes LLM-drafted emails that have been sent (thread state != WAITING_FOR_DRAFT_REVIEW).
6. **campaign_type_stats data exists but frontend doesn't display it**: The API returns per-type conversion rates, but the dashboard page doesn't render `CampaignTypeComparisonCard` (component exists but isn't imported). The CE tool still exposes this data — the agent can answer "which type performs best?" questions.
7. **Top campaign is computed client-side**: Not in the API response. Frontend computes it from `active_campaigns` array (highest opt-in rate). Agent should do the same.

## Cross-Domain Overlaps

- `cheerful_list_campaigns(include_stats=true)` in campaigns.md provides per-campaign metrics but via a different endpoint
- Dashboard `active_campaigns` array has pre-computed opt-in/reply metrics not in the campaigns service route
- Email stats here are aggregated totals; individual email status is in email.md tools

## No New Aspects Discovered

The analytics domain is well-contained. No new endpoints, parameters, or capabilities were found during tool design that aren't already covered in the W1 capability extraction.
