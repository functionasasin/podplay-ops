# w2-workflows — Tool Design Working Notes

## Summary

Designed 8 workflow-domain tools (0 existing + 8 new) across 3 sub-domains.

## Tool Grouping

### Campaign Workflow CRUD (5 tools)
| # | Tool | Endpoint | Permission |
|---|------|----------|-----------|
| 1 | `cheerful_list_campaign_workflows` | GET /campaigns/{id}/workflows | owner-or-assigned |
| 2 | `cheerful_get_campaign_workflow` | GET /campaigns/{id}/workflows/{wf_id} | owner-or-assigned |
| 3 | `cheerful_create_campaign_workflow` | POST /campaigns/{id}/workflows | owner-or-assigned |
| 4 | `cheerful_update_campaign_workflow` | PATCH /campaigns/{id}/workflows/{wf_id} | owner-or-assigned |
| 5 | `cheerful_delete_campaign_workflow` | DELETE /campaigns/{id}/workflows/{wf_id} | owner-or-assigned |

### Workflow Execution History (2 tools)
| # | Tool | Endpoint | Permission |
|---|------|----------|-----------|
| 6 | `cheerful_list_workflow_executions` | GET /campaigns/{id}/workflows/{wf_id}/executions | owner-or-assigned |
| 7 | `cheerful_get_thread_workflow_execution` | GET /threads/{tsid}/workflows/{wf_id}/latest-execution | owner-or-assigned (via campaign) |

### Tool Discovery (1 tool)
| # | Tool | Endpoint | Permission |
|---|------|----------|-----------|
| 8 | `cheerful_list_workflow_tools` | GET /tools | authenticated |

## Key Design Decisions

1. **All 8 endpoints need new service routes** — zero `/api/service/` coverage exists today. Every existing endpoint is JWT-only.

2. **CRUD follows standard pattern**: list/get/create/update/delete, all campaign-scoped. Permission is owner-or-assigned via `verify_campaign_ownership()`.

3. **List returns enabled-only**: Disabled workflows are hidden from the list endpoint but accessible via get. No parameter to include disabled workflows (matching existing backend behavior).

4. **Executions are read-only**: Users cannot create/update/delete executions — they are append-only records from Temporal activities. The CE only exposes list + get-latest-for-thread.

5. **Tool discovery is user-agnostic**: The tool list is global (from `tool_registry.py`), not per-user or per-campaign. Permission is just "authenticated".

6. **Known workflow types documented but not enforced**: The backend does not validate workflow types — name/config are free-form. The spec documents the 3 known conventions (GoAffPro Discount, Shopify Order Drafting, Creator Profile Scraping) with their typical tool_slugs and config shapes.

7. **Execution status is convention-based**: "pending", "running", "completed", "failed" — stored as free-form string, not a backend enum. The 4 values are documented from `workflow-api-client.ts`.

8. **Thread state dual-lookup**: `cheerful_get_thread_workflow_execution` accepts a `thread_state_id` that can be either Gmail or SMTP — the backend checks both tables. This is unique to this tool.

9. **No tools for internal repository queries**: The `CampaignWorkflowExecutionRepository` has additional methods (cross-version execution lookup, creator profile by handle, unique creator profiles) that don't have API endpoints. These could be future CE tools but would need new backend endpoints first. Not included in this wave.

## Cross-References

- `specs/campaigns.md` explicitly defers workflow tools here (note on line 26)
- `cheerful_launch_campaign` in campaigns.md creates workflows as part of launch orchestration
- Campaign deletion CASCADE deletes all workflows and executions
- `mail-display.tsx` shows workflow execution results (→ `cheerful_get_thread_workflow_execution`)
- Campaign wizard step 7 (integrations section) configures workflows via CRUD API

## Service Routes Enumerated

8 new routes needed:
1. `GET /api/service/campaigns/{campaign_id}/workflows`
2. `GET /api/service/campaigns/{campaign_id}/workflows/{workflow_id}`
3. `POST /api/service/campaigns/{campaign_id}/workflows`
4. `PATCH /api/service/campaigns/{campaign_id}/workflows/{workflow_id}`
5. `DELETE /api/service/campaigns/{campaign_id}/workflows/{workflow_id}`
6. `GET /api/service/campaigns/{campaign_id}/workflows/{workflow_id}/executions`
7. `GET /api/service/threads/{thread_state_id}/workflows/{workflow_id}/latest-execution`
8. `GET /api/service/tools`

## No New Aspects Discovered

The Wave 1 capability extraction was thorough. No new endpoints, parameters, or features were found during tool design. The Temporal infrastructure workflows (24 classes) and additional repository queries are documented but correctly excluded from the CE tool scope.
