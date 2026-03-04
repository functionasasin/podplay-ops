# Current Stage: 3

## Stage 3 — Campaign Recipients + Outbox (7 tools)

Create backend service routes and CE tools for campaign recipient management, sender configuration, and outbox operations.

| # | Tool | Backend Route |
|---|------|--------------|
| 18 | `cheerful_add_campaign_recipients` | `POST /api/service/campaigns/{id}/recipients` |
| 19 | `cheerful_add_campaign_recipients_from_search` | `POST /api/service/campaigns/{id}/recipients/from-search` |
| 21 | `cheerful_list_campaign_recipients` | `GET /api/service/campaigns/{id}/recipients` |
| 22 | `cheerful_update_campaign_sender` | `PUT /api/service/campaigns/{id}/sender` |
| 23 | `cheerful_remove_campaign_sender` | `DELETE /api/service/campaigns/{id}/sender` |
| 24 | `cheerful_populate_campaign_outbox` | `POST /api/service/campaigns/{id}/outbox/populate` |
| 25 | `cheerful_get_campaign_outbox` | `GET /api/service/campaigns/{id}/outbox` |

**Priority**: WRITE TESTS — tests exist for #18, #19, #21, #22. Write tests for remaining tools (#23, #24, #25) next. Also created full tool implementations (`tools_recipients.py`) and API client functions for all 7 tools.

## Work Log
- 2026-03-04: Stage 2 complete (33 tests passing, 6 tools implemented). Advancing to Stage 3.
- 2026-03-04: Scaffold complete — created `recipients_fixtures.py` with mock responses for all 7 Stage 3 tools.
- 2026-03-04: Backend routes complete — all 7 service routes created: add_campaign_recipients (#18), add_campaign_recipients_from_search (#19), list_campaign_recipients (#21), update_campaign_sender (#22), remove_campaign_sender (#23), populate_campaign_outbox (#24), get_campaign_outbox (#25).
- 2026-03-04: Tests batch 1 (31 tests) + tool implementations + API functions — created `tools_recipients.py` with all 7 tool implementations, added 7 API client functions to `api.py`, wrote 31 tests for tools #18 (7 tests), #19 (7 tests), #21 (9 tests), #22 (8 tests). All 113 tests passing.
