# Current Stage: 15

## Stage 15 — Workflows (8 tools)

Create backend service routes and CE tools for campaign workflow automation.

| # | Tool | Backend Route |
|---|------|--------------|
| 119 | `cheerful_list_campaign_workflows` | `GET /api/service/campaigns/{id}/workflows` |
| 120 | `cheerful_get_campaign_workflow` | `GET /api/service/campaigns/{id}/workflows/{workflow_id}` |
| 121 | `cheerful_create_campaign_workflow` | `POST /api/service/campaigns/{id}/workflows` |
| 122 | `cheerful_update_campaign_workflow` | `PATCH /api/service/campaigns/{id}/workflows/{workflow_id}` |
| 123 | `cheerful_delete_campaign_workflow` | `DELETE /api/service/campaigns/{id}/workflows/{workflow_id}` |
| 124 | `cheerful_list_workflow_executions` | `GET /api/service/campaigns/{id}/workflows/{workflow_id}/executions` |
| 125 | `cheerful_get_thread_workflow_execution` | `GET /api/service/threads/{thread_id}/workflow-execution/{workflow_id}` |
| 126 | `cheerful_list_workflow_tools` | `GET /api/service/workflows/tools` |

**Priority**: IMPLEMENT — Tests written for all 8 tools, implement tools_workflows.py with tool definitions + API client + formatters.

## Work Log
- 2026-03-05: Stage 14 complete (5 analytics + search tools implemented, catalog registered). Advancing to Stage 15.
- 2026-03-05: Scaffold complete — workflow_fixtures.py with mock responses for all 8 tools.
- 2026-03-05: Backend routes for 5 workflow CRUD endpoints (#119-123) added to service.py with ownership/assignment checks.
- 2026-03-05: Backend routes for 3 remaining endpoints (#124-126): list_workflow_executions, get_thread_workflow_execution, list_workflow_tools.
- 2026-03-05: Tests written for all 8 workflow tools (#119-126) in test_workflows.py — 56 test cases covering happy path, errors, API URLs, XML formatting.
