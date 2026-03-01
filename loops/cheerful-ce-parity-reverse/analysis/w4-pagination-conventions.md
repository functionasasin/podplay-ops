# w4-pagination-conventions — Analysis Notes

**Date**: 2026-03-01
**Status**: Complete

## Sources Verified

- `projects/cheerful/apps/backend/src/api/route/service.py` — all existing service routes
- `projects/cheerful/apps/backend/src/api/route/gmail_message.py` — thread listing endpoint
- `projects/cheerful/apps/backend/src/api/route/campaign.py` — list_campaigns, outbox-table, unified-recipients
- `projects/cheerful/apps/backend/src/api/route/creator_list.py` — creator list items
- `projects/cheerful/apps/backend/src/api/route/campaign_workflow_execution.py` — execution history
- `projects/cheerful/apps/backend/src/api/route/creator_search.py` — IC search, page-based model
- `projects/cheerful/apps/context-engine/app/src_v2/mcp/tools/cheerful/api.py` — CE client
- `projects/cheerful/apps/context-engine/app/src_v2/mcp/tools/cheerful/tools.py` — CE tools

## Three Pagination Models Identified

### Model A: Offset-Based
- Parameters: `limit` (with `le=` max, optional `ge=1` min) + `offset` (with `ge=0`)
- Some endpoints have `ge=1` min on limit, others have no minimum
- Response: flat list OR wrapped `{items/creators/results, total}`
- Used by: thread listing, thread search, similar emails, creator listing, creator search, creator list items, outbox-table, unified-recipients, workflow executions

### Model B: Page-Based (IC Search only)
- Parameter: `page` (1-indexed integer)
- Page size hardcoded: `_SEARCH_LIMIT = 10` (not a parameter)
- Response: `{results, total, page, has_more}`
- `has_more = (total or 0) > page * 10`
- Used by: IC keyword discovery, IC similar creator discovery

### Model C: No Pagination
- Returns complete list unconditionally
- Used by: list_campaigns (service route), all campaign list, SMTP accounts, email signatures, creator lists, workflow list, team members, tool slugs

## Critical Bugs Found in Existing Skeleton

1. **Similar emails max was wrong**: skeleton said 20, actual is `le=10` from service.py line 153
2. **Workflow executions default was wrong**: skeleton said 50, actual is `default=100` from campaign_workflow_execution.py line 56

## Critical Behavior: Creator Listing Total is Unfiltered

`GET /api/service/campaigns/{id}/creators` returns `total` = count of ALL creators in the campaign, not the count of filtered results. This is because:
1. It calls `repo.get_by_campaign_id_paginated(limit+1, offset)` for the items
2. It THEN calls `repo.get_by_campaign_id()` (no filters) to get the total
3. Filters (`gifting_status`, `role`) are applied AFTER fetch as Python list comprehensions

So a campaign with 50 creators where only 3 have `gifting_status=OPTED_IN` will return `total=50` not `total=3`. The Slack agent MUST NOT use `total` to determine filtered result count.

## Thread Listing Pagination Warning

`GET /api/v1/campaigns/{id}/threads` (gmail_message.py):
- The `offset` parameter is applied only to the Gmail query
- SMTP threads are fetched WITHOUT offset (all SMTP threads for the campaign)
- The two lists are merged, re-sorted, and trimmed to `limit`
- This means: for mixed Gmail+SMTP campaigns, `offset` is approximate
- Documented in Section 3.5 Slack presentation notes

## Limit+1 Trick

The creator listing endpoint fetches `limit + 1` rows to detect whether more pages exist. However, it trims to `limit` before returning — `has_more` is NOT exposed in the response. The CE must detect this by comparing `offset + len(results)` to `total` (but remember: total is unfiltered).

## What Was Added to shared-conventions.md

Section 3 replaced with 5 subsections:
- 3.1 Three Pagination Models (A, B, C) with full explanations
- 3.2 Verified Parameters per Endpoint (service routes + new routes needed)
- 3.3 Corrections to Prior Skeleton (2 errors documented)
- 3.4 Per-Tool Pagination Summary (20 tools tabulated)
- 3.5 Slack Presentation Guide (general rules + per-domain formatting)

ToC and status line updated.
