# Forward Ralph Loop — Cheerful Context Engine Parity

You are running in `--print` mode. You MUST output text describing what you are doing. If you only make tool calls without outputting text, your output is lost and the loop operator cannot see progress. Always:
1. Start by printing which stage you detected and what priority you're executing
2. Print progress as you work (e.g., "Creating backend route for cheerful_get_campaign...")
3. End with a summary of what you did and whether you committed

You are a development agent in a forward ralph loop. Each time you run, you do ONE unit of work: create backend service routes, write tests, implement CE tools, or fix failures for a single stage, then commit and exit.

## Your Working Directories

- **Loop dir**: `loops/cheerful-ce-parity-forward/` (frontier, status, loop script)
- **Reverse spec**: `loops/cheerful-ce-parity-reverse/specs/` (exhaustive tool specifications — YOUR SOURCE OF TRUTH)
- **Backend routes**: `projects/cheerful/apps/backend/src/api/route/service.py` (existing service router)
- **Backend models**: `projects/cheerful/apps/backend/src/models/` (Pydantic API + DB models)
- **Backend repo**: `projects/cheerful/apps/backend/src/` (repositories, services, enums)
- **CE tools**: `projects/cheerful/apps/context-engine/app/src_v2/mcp/tools/cheerful/` (tool definitions + API client)
- **CE catalog**: `projects/cheerful/apps/context-engine/app/src_v2/mcp/catalog.py` (tool registration)
- **CE core**: `projects/cheerful/apps/context-engine/app/src_v2/core/` (xml.py for formatters, slack_format.py)

## Tech Stack

**Backend** (FastAPI + SQLAlchemy):
- Python 3.11+, FastAPI, SQLAlchemy 2.0, Pydantic v2
- Service routes use `X-Service-Api-Key` header auth (global dependency on service router)
- DB sessions via `get_db_session_context()` context manager (NOT Depends injection)
- `user_id` passed as UUID query parameter on all service routes
- Response models are Pydantic `BaseModel` classes in `src/models/api/`

**Context Engine** (MCP Tools):
- Python 3.11+, async/await, httpx for HTTP calls
- Tools defined with `@tool(description=..., tags={Platform.CHEERFUL, Action.READ|WRITE})` decorator
- Every tool signature: `async def tool_name(tool_context: ToolContext, db_context: DatabaseContext | None, request_context: RequestContext | None, params: InputModel) -> str`
- User ID extracted via `_resolve_user_id(request_context)` — NEVER a tool parameter
- API calls via `api.py` module — thin async HTTP wrapper using tool_context credentials
- Responses formatted as XML via `tag()`, `wrap()`, `hint()` from `core/xml.py`
- Tools registered in `catalog.py` → `ALL_TOOLS` list

**Testing**:
- pytest + pytest-asyncio for CE tool tests
- httpx mock or respx for mocking HTTP calls
- Tests verify: input validation, API call correctness, response parsing, XML formatting, error handling

## Scope

**113 tools total**: 7 existing (fix bugs) + 106 new (implement from scratch).
**~90+ new backend service routes** mirroring existing v1 endpoints.
**13 tools cut** from the reverse spec (not useful for Slack bot): wizard drafts (#13-16), CSV uploads (#20, #73), public profiles (#80-82), bulk SMTP import (#90), campaign signature update (#27), sheet validation (#31), bulk campaign assign (#112).

## What To Do This Iteration

1. **Read the frontier**: Open `loops/cheerful-ce-parity-forward/frontier/current-stage.md`
2. **Identify your work priority** (pick the FIRST that applies):

   **Priority 1 — SCAFFOLD** (if this stage hasn't started — no test fixtures exist):
   - For Stage 0: Create shared test conftest, mock HTTP helpers, base test fixtures
   - For Stage 1: No scaffold needed, go to Priority 2
   - For Stages 2-15: Create test fixture file for this domain with mock API responses based on spec examples
   - For Stage 16: No scaffold needed, go to Priority 4
   - Commit: `ce-parity: stage {N} - scaffold {domain} test fixtures`
   - Exit

   **Priority 2 — BACKEND ROUTES** (if this stage needs service routes AND they don't exist yet):
   - For Stage 1: Modify existing 6 service routes to validate `user_id` owns the requested resource
   - For Stages 2-15: Create new `/api/service/*` routes in `service.py` (or domain sub-routers)
     - Read the tool spec in `loops/cheerful-ce-parity-reverse/specs/{domain}.md`
     - Find the existing v1 endpoint in `projects/cheerful/apps/backend/src/api/route/`
     - Create the service equivalent with `X-Service-Api-Key` auth + `user_id` query param
     - Create response model in `src/models/api/service.py` if needed
   - Do 2-5 routes per iteration (don't try to do all at once)
   - Commit: `ce-parity: stage {N} - backend routes for {tools}`
   - Exit

   **Priority 3 — WRITE TESTS** (if backend routes exist but tests are missing/sparse):
   - Read the tool spec from `loops/cheerful-ce-parity-reverse/specs/{domain}.md`
   - Write pytest tests for 2-4 tools per iteration
   - Each tool gets tests for: happy path, parameter validation, error responses, XML formatting
   - Mock HTTP calls to the backend (use httpx mock / respx)
   - Tests must compile and run (may fail if tool not yet implemented)
   - Create stub tool functions so tests can import
   - Commit: `ce-parity: stage {N} - tests for {tools}`
   - Exit

   **Priority 4 — IMPLEMENT** (if tests exist but tools are stubs/missing):
   - For Stage 1: Fix existing tool bugs — formatters, pagination, security
     - P1: Fix field name mismatches in formatters (4 tools)
     - P2: Add missing `offset` param to `list_campaign_creators` API call
     - P2: Correct `get_campaign_creator` spec inaccuracies
     - P3: Add `user_id` filtering to `search_campaign_creators` backend route
   - For Stages 2-15: Implement 2-4 CE tools per iteration
     - Follow existing tool pattern in `tools.py` (decorator, input model, handler, formatter)
     - Add HTTP client functions to `api.py`
     - Register in `catalog.py` → `ALL_TOOLS` list
   - For Stage 16: Run full parity sweep
     - Run ALL tests: `cd projects/cheerful/apps/context-engine && python -m pytest tests/ -v 2>&1 | tail -100`
     - Verify every tool in the stage plan is registered in `catalog.py`
     - Check no TODOs or stubs remain
     - If gaps found: add notes and DO NOT converge
     - If all clear: write `status/converged.txt`
   - Commit: `ce-parity: stage {N} - implement {tools}`
   - Exit

   **Priority 5 — FIX FAILURES** (if tests exist and some are failing):
   - Run tests for this stage: `cd projects/cheerful/apps/context-engine && python -m pytest tests/tools/cheerful/ -k "{stage_filter}" -v 2>&1 | tail -80`
   - Identify root cause of 1-3 related failures
   - Fix the implementation code (NOT the tests, unless a test contradicts the spec)
   - Commit: `ce-parity: stage {N} - fix {description}`
   - Exit

   **Priority 6 — ADVANCE** (if ALL tests pass for the current stage):
   - Write `loops/cheerful-ce-parity-forward/status/stage-{N}-complete.txt` with timestamp and tool count
   - Update `loops/cheerful-ce-parity-forward/frontier/current-stage.md` to the NEXT stage
   - Update `loops/cheerful-ce-parity-forward/frontier/stage-plan.md` status column
   - Commit: `ce-parity: stage {N} complete — {summary}`
   - Exit

3. **Always commit before exiting.** Even partial progress gets committed.

## Stage Table

| Stage | Name | Tools | Spec File | Test Filter | Depends On | Phase |
|-------|------|-------|-----------|-------------|------------|-------|
| 0 | Shared Infrastructure | — | — | `conftest` | — | Infra |
| 1 | Security + Bug Fixes | 7 fix | all specs | `existing\|security` | 0 | Infra |
| 2 | Campaign CRUD + Launch | 6 | `campaigns.md` | `campaign-crud\|launch` | 1 | Campaigns |
| 3 | Campaign Recipients + Outbox | 7 | `campaigns.md` | `recipients\|outbox\|sender` | 2 | Campaigns |
| 4 | Campaign Extras | 10 | `campaigns.md` | `signature\|merge-tag\|product\|enrichment\|summary` | 2 | Campaigns |
| 5 | Email Threads & Ops | 4 | `email.md` | `list-threads\|hide\|unhide\|attachment` | 1 | Email |
| 6 | Email Drafts & Sending | 8 | `email.md` | `draft\|send-email\|schedule` | 5 | Email |
| 7 | Email Signatures & AI | 9 | `email.md` | `email-sig\|bulk-edit\|improve\|thread-summary` | 5 | Email |
| 8 | Creators & Discovery | 6 | `creators.md` | `enrichment\|ic-search\|creator-profile` | 1 | Creators |
| 9 | Creator Lists & Items | 10 | `creators.md` | `creator-list` | 8 | Creators |
| 10 | Creator Posts | 4 | `creators.md` | `creator-post` | 8 | Creators |
| 11 | Integrations: SMTP & Accounts | 7 | `integrations.md` | `gmail\|smtp\|connected-account` | 1 | Integrations |
| 12 | Integrations: External | 10 | `integrations.md` | `sheets\|shopify\|instantly\|slack-digest\|youtube\|brand` | 1 | Integrations |
| 13 | Users & Team | 12 | `users-and-team.md` | `user-settings\|team\|assignment\|onboarding` | 1 | Users |
| 14 | Analytics + Search | 5 | `analytics.md` + `search-and-discovery.md` | `analytics\|lookalike` | 1 | Analytics |
| 15 | Workflows | 8 | `workflows.md` | `workflow` | 1 | Workflows |
| 16 | Integration Sweep | — | all specs | — | all | Final |

## Stage Details

### Stage 0 — Shared Infrastructure

Set up the test harness and shared patterns for all subsequent stages.

**Tasks:**
1. Create `projects/cheerful/apps/context-engine/tests/tools/cheerful/conftest.py`:
   - Shared fixtures: `mock_tool_context`, `mock_request_context`, `mock_db_context`
   - Helper: `mock_http_response(status, json_body)` for mocking API calls
   - Helper: `assert_xml_contains(xml_str, tag_name, **attrs)` for testing XML output
2. Create `projects/cheerful/apps/context-engine/tests/tools/cheerful/__init__.py`
3. Verify existing test structure — check if tests dir exists, create if needed
4. Verify `api.py` has the base HTTP client pattern (it does — extend later)

### Stage 1 — Security + Bug Fixes

Fix all 7 existing tool bugs and 6 service route security gaps. See `loops/cheerful-ce-parity-reverse/analysis/existing-tools-audit.md` for full bug details.

**Security fixes** (backend `service.py`):
- All 6 service routes (except campaigns) accept `user_id` but don't validate ownership
- Fix: Add ownership/access checks to each route handler (verify user owns the campaign, thread, etc.)

**Bug fixes** (CE `tools.py`):
1. **P1** `cheerful_list_campaigns`: formatter reads `type` → should be `campaign_type`; reads nonexistent `gmail_account_id`; drops `status`
2. **P1** `cheerful_search_emails`: formatter reads `sender`/`snippet` → should be `sender_email`/`matched_snippet`
3. **P1** `cheerful_get_thread`: formatter reads `from`/`to`/`date` → should be `sender_email`/`recipient_emails`/`internal_date`
4. **P1** `cheerful_find_similar_emails`: formatter reads `summary`/`reply_text` → should be `thread_summary`/`sent_reply_text`
5. **P2** `cheerful_list_campaign_creators`: API call missing `offset` parameter → pagination broken
6. **P2** `cheerful_get_campaign_creator`: spec inaccuracy — `enrichment_status`/`source`/`post_opt_in_follow_up_status` NOT in response
7. **P3** `cheerful_search_campaign_creators`: backend searches ALL campaigns globally (no user_id filter)

### Stage 2 — Campaign CRUD + Launch (6 tools)

Spec: `loops/cheerful-ce-parity-reverse/specs/campaigns.md`

| # | Tool | Backend Route |
|---|------|--------------|
| 8 | `cheerful_get_campaign` | `GET /api/service/campaigns/{campaign_id}` |
| 9 | `cheerful_create_campaign` | `POST /api/service/campaigns` |
| 10 | `cheerful_update_campaign` | `PATCH /api/service/campaigns/{campaign_id}` |
| 11 | `cheerful_delete_campaign` | `DELETE /api/service/campaigns/{campaign_id}` |
| 12 | `cheerful_duplicate_campaign` | `POST /api/service/campaigns/{campaign_id}/duplicate` |
| 17 | `cheerful_launch_campaign` | `POST /api/service/campaigns/{campaign_id}/launch` |

### Stage 3 — Campaign Recipients + Outbox (7 tools)

Spec: `loops/cheerful-ce-parity-reverse/specs/campaigns.md`

| # | Tool | Backend Route |
|---|------|--------------|
| 18 | `cheerful_add_campaign_recipients` | `POST /api/service/campaigns/{id}/recipients` |
| 19 | `cheerful_add_campaign_recipients_from_search` | `POST /api/service/campaigns/{id}/recipients/from-search` |
| 21 | `cheerful_list_campaign_recipients` | `GET /api/service/campaigns/{id}/recipients` |
| 22 | `cheerful_update_campaign_sender` | `PUT /api/service/campaigns/{id}/sender` |
| 23 | `cheerful_remove_campaign_sender` | `DELETE /api/service/campaigns/{id}/sender` |
| 24 | `cheerful_populate_campaign_outbox` | `POST /api/service/campaigns/{id}/outbox/populate` |
| 25 | `cheerful_get_campaign_outbox` | `GET /api/service/campaigns/{id}/outbox` |

### Stage 4 — Campaign Extras (10 tools)

Spec: `loops/cheerful-ce-parity-reverse/specs/campaigns.md`

| # | Tool | Backend Route |
|---|------|--------------|
| 26 | `cheerful_get_campaign_signature` | `GET /api/service/campaigns/{id}/signature` |
| 28 | `cheerful_list_campaign_signatures` | `GET /api/service/campaigns/{id}/signatures` |
| 29 | `cheerful_get_campaign_merge_tags` | `GET /api/service/campaigns/{id}/merge-tags` |
| 30 | `cheerful_get_campaign_required_columns` | `GET /api/service/campaigns/{id}/required-columns` |
| 32 | `cheerful_generate_campaign_summary` | `POST /api/service/campaigns/{id}/summary` |
| 33 | `cheerful_create_product` | `POST /api/service/products` |
| 34 | `cheerful_list_products` | `GET /api/service/products` |
| 35 | `cheerful_get_product` | `GET /api/service/products/{id}` |
| 36 | `cheerful_get_campaign_enrichment_status` | `GET /api/service/campaigns/{id}/enrichment-status` |
| 37 | `cheerful_override_creator_email` | `POST /api/service/campaigns/{id}/creators/{creator_id}/override-email` |

### Stage 5 — Email Threads & Ops (4 tools)

Spec: `loops/cheerful-ce-parity-reverse/specs/email.md`

| # | Tool | Backend Route |
|---|------|--------------|
| 38 | `cheerful_list_threads` | `GET /api/service/threads` |
| 39 | `cheerful_hide_thread` | `POST /api/service/threads/{id}/hide` |
| 40 | `cheerful_unhide_thread` | `POST /api/service/threads/{id}/unhide` |
| 41 | `cheerful_list_message_attachments` | `GET /api/service/threads/{thread_id}/messages/{message_id}/attachments` |

### Stage 6 — Email Drafts & Sending (8 tools)

Spec: `loops/cheerful-ce-parity-reverse/specs/email.md`

| # | Tool | Backend Route |
|---|------|--------------|
| 42 | `cheerful_get_thread_draft` | `GET /api/service/threads/{id}/draft` |
| 43 | `cheerful_create_thread_draft` | `POST /api/service/threads/{id}/draft` |
| 44 | `cheerful_update_thread_draft` | `PATCH /api/service/threads/{id}/draft` |
| 45 | `cheerful_send_email` | `POST /api/service/email/send` |
| 46 | `cheerful_schedule_email` | `POST /api/service/email/schedule` |
| 47 | `cheerful_list_scheduled_emails` | `GET /api/service/email/scheduled` |
| 48 | `cheerful_cancel_scheduled_email` | `DELETE /api/service/email/scheduled/{id}` |
| 49 | `cheerful_reschedule_email` | `PATCH /api/service/email/scheduled/{id}` |

### Stage 7 — Email Signatures & AI (9 tools)

Spec: `loops/cheerful-ce-parity-reverse/specs/email.md`

| # | Tool | Backend Route | Notes |
|---|------|--------------|-------|
| 50 | `cheerful_list_email_signatures` | `GET /api/service/signatures` | |
| 51 | `cheerful_get_email_signatures_for_reply` | `GET /api/service/signatures/for-reply` | |
| 52 | `cheerful_create_email_signature` | `POST /api/service/signatures` | |
| 53 | `cheerful_get_email_signature` | `GET /api/service/signatures/{id}` | |
| 54 | `cheerful_update_email_signature` | `PATCH /api/service/signatures/{id}` | |
| 55 | `cheerful_delete_email_signature` | `DELETE /api/service/signatures/{id}` | |
| 56 | `cheerful_bulk_edit_drafts` | `POST /api/service/campaigns/{id}/bulk-edit-drafts` | Temporal workflow |
| 57 | `cheerful_improve_email_content` | — | CE-native (calls Claude, no backend route) |
| 58 | `cheerful_get_thread_summary` | — | CE-native (ThreadSummarizer, no backend route) |

### Stage 8 — Creators & Discovery (6 tools)

Spec: `loops/cheerful-ce-parity-reverse/specs/creators.md`

| # | Tool | Backend Route |
|---|------|--------------|
| 59 | `cheerful_start_creator_enrichment` | `POST /api/service/campaigns/{id}/enrichment` |
| 60 | `cheerful_get_enrichment_workflow_status` | `GET /api/service/campaigns/{id}/enrichment/{workflow_id}` |
| 61 | `cheerful_search_similar_creators` | `GET /api/service/creators/search/similar` |
| 62 | `cheerful_search_creators_by_keyword` | `GET /api/service/creators/search/keyword` |
| 63 | `cheerful_enrich_creator` | `POST /api/service/creators/enrich` |
| 64 | `cheerful_get_creator_profile` | `GET /api/service/creators/profile/{handle}` |

### Stage 9 — Creator Lists & Items (10 tools)

Spec: `loops/cheerful-ce-parity-reverse/specs/creators.md`

| # | Tool | Backend Route |
|---|------|--------------|
| 65 | `cheerful_list_creator_lists` | `GET /api/service/creator-lists` |
| 66 | `cheerful_create_creator_list` | `POST /api/service/creator-lists` |
| 67 | `cheerful_get_creator_list` | `GET /api/service/creator-lists/{id}` |
| 68 | `cheerful_update_creator_list` | `PATCH /api/service/creator-lists/{id}` |
| 69 | `cheerful_delete_creator_list` | `DELETE /api/service/creator-lists/{id}` |
| 70 | `cheerful_list_creator_list_items` | `GET /api/service/creator-lists/{id}/items` |
| 71 | `cheerful_add_creators_to_list` | `POST /api/service/creator-lists/{id}/items` |
| 72 | `cheerful_add_search_creators_to_list` | `POST /api/service/creator-lists/{id}/items/from-search` |
| 74 | `cheerful_remove_creator_from_list` | `DELETE /api/service/creator-lists/{id}/items/{item_id}` |
| 75 | `cheerful_add_list_creators_to_campaign` | `POST /api/service/creator-lists/{id}/add-to-campaign` |

### Stage 10 — Creator Posts (4 tools)

Spec: `loops/cheerful-ce-parity-reverse/specs/creators.md`

| # | Tool | Backend Route |
|---|------|--------------|
| 76 | `cheerful_list_posts` | `GET /api/service/posts` |
| 77 | `cheerful_list_creator_posts` | `GET /api/service/campaigns/{id}/creators/{creator_id}/posts` |
| 78 | `cheerful_refresh_creator_posts` | `POST /api/service/campaigns/{id}/creators/{creator_id}/posts/refresh` |
| 79 | `cheerful_delete_post` | `DELETE /api/service/posts/{id}` |

### Stage 11 — Integrations: SMTP & Accounts (7 tools)

Spec: `loops/cheerful-ce-parity-reverse/specs/integrations.md`

| # | Tool | Backend Route |
|---|------|--------------|
| 83 | `cheerful_list_gmail_accounts` | `GET /api/service/accounts/gmail` |
| 84 | `cheerful_list_connected_accounts` | `GET /api/service/accounts` |
| 85 | `cheerful_list_smtp_accounts` | `GET /api/service/accounts/smtp` |
| 86 | `cheerful_get_smtp_account` | `GET /api/service/accounts/smtp/{id}` |
| 87 | `cheerful_create_smtp_account` | `POST /api/service/accounts/smtp` |
| 88 | `cheerful_update_smtp_account` | `PATCH /api/service/accounts/smtp/{id}` |
| 89 | `cheerful_delete_smtp_account` | `DELETE /api/service/accounts/smtp/{id}` |

### Stage 12 — Integrations: External Services (10 tools)

Spec: `loops/cheerful-ce-parity-reverse/specs/integrations.md`

| # | Tool | Backend Route |
|---|------|--------------|
| 91 | `cheerful_get_google_sheet_tabs` | `GET /api/service/integrations/sheets/tabs` |
| 92 | `cheerful_list_shopify_products` | `GET /api/service/integrations/shopify/products` |
| 93 | `cheerful_create_shopify_order` | `POST /api/service/integrations/shopify/orders` |
| 94 | `cheerful_get_instantly_status` | `GET /api/service/integrations/instantly/status` |
| 95 | `cheerful_connect_instantly` | `POST /api/service/integrations/instantly/connect` |
| 96 | `cheerful_disconnect_instantly` | `DELETE /api/service/integrations/instantly` |
| 97 | `cheerful_test_instantly` | `POST /api/service/integrations/instantly/test` |
| 98 | `cheerful_trigger_slack_digest` | `POST /api/service/integrations/slack/digest` |
| 99 | `cheerful_find_youtube_lookalikes` | `POST /api/service/integrations/youtube/lookalikes` |
| 100 | `cheerful_lookup_brand` | `GET /api/service/integrations/brand` |

### Stage 13 — Users & Team (12 tools)

Spec: `loops/cheerful-ce-parity-reverse/specs/users-and-team.md`

| # | Tool | Backend Route |
|---|------|--------------|
| 101 | `cheerful_get_user_settings` | `GET /api/service/user/settings` |
| 102 | `cheerful_list_teams` | `GET /api/service/teams` |
| 103 | `cheerful_create_team` | `POST /api/service/teams` |
| 104 | `cheerful_get_team` | `GET /api/service/teams/{id}` |
| 105 | `cheerful_delete_team` | `DELETE /api/service/teams/{id}` |
| 106 | `cheerful_add_team_member` | `POST /api/service/teams/{id}/members` |
| 107 | `cheerful_remove_team_member` | `DELETE /api/service/teams/{id}/members/{member_id}` |
| 108 | `cheerful_list_my_campaign_assignments` | `GET /api/service/assignments/mine` |
| 109 | `cheerful_list_campaign_assignments` | `GET /api/service/teams/{id}/assignments` |
| 110 | `cheerful_assign_campaign` | `POST /api/service/teams/{id}/assignments` |
| 111 | `cheerful_unassign_campaign` | `DELETE /api/service/teams/{id}/assignments/{assignment_id}` |
| 113 | `cheerful_get_onboarding_status` | `GET /api/service/user/onboarding` |

### Stage 14 — Analytics + Search (5 tools)

Specs: `loops/cheerful-ce-parity-reverse/specs/analytics.md` + `search-and-discovery.md`

| # | Tool | Backend Route |
|---|------|--------------|
| 114 | `cheerful_get_dashboard_analytics` | `GET /api/service/analytics/dashboard` |
| 115 | `cheerful_list_lookalike_suggestions` | `GET /api/service/campaigns/{id}/suggestions` |
| 116 | `cheerful_update_lookalike_suggestion` | `PUT /api/service/campaigns/{id}/suggestions/{suggestion_id}` |
| 117 | `cheerful_bulk_accept_lookalike_suggestions` | `POST /api/service/campaigns/{id}/suggestions/bulk-accept` |
| 118 | `cheerful_bulk_reject_lookalike_suggestions` | `POST /api/service/campaigns/{id}/suggestions/bulk-reject` |

### Stage 15 — Workflows (8 tools)

Spec: `loops/cheerful-ce-parity-reverse/specs/workflows.md`

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

### Stage 16 — Integration Sweep

Full cross-domain verification.

**Checks:**
1. Run ALL CE tool tests: `cd projects/cheerful/apps/context-engine && python -m pytest tests/tools/cheerful/ -v`
2. Verify every tool is registered in `catalog.py` → `ALL_TOOLS` list
3. Verify every new backend route is wired into the service router
4. Check for any TODOs, stubs, or placeholder implementations
5. Cross-reference against `loops/cheerful-ce-parity-reverse/specs/README.md` tool index
6. If ALL checks pass: write `status/converged.txt`
7. If gaps found: log them, create notes, DO NOT converge

## Implementation Patterns

### Backend Service Route Pattern

Follow the existing pattern in `service.py`:

```python
@router.get("/campaigns/{campaign_id}", response_model=ServiceCampaignDetailResponse)
def get_campaign(
    campaign_id: uuid.UUID = Path(...),
    user_id: uuid.UUID = Query(..., description="Cheerful user ID"),
):
    """Get a single campaign by ID."""
    with get_db_session_context() as db:
        repo = CampaignRepository(db)
        campaign = repo.get_by_id(campaign_id)
        if not campaign:
            raise HTTPException(status_code=404, detail=f"Campaign {campaign_id} not found")
        if str(campaign.user_id) != str(user_id):
            raise HTTPException(status_code=403, detail=f"Access denied to campaign {campaign_id}")
        return ServiceCampaignDetailResponse(...)
```

Key patterns:
- Always validate `user_id` owns the resource (Stage 1 fixes the existing routes that don't)
- Use `get_db_session_context()` context manager
- Return Pydantic response models
- Use `HTTPException` for errors (401 service auth is global, 403/404 in handler)
- Route path should match the existing v1 endpoint where possible

### CE Tool Pattern

Follow the existing pattern in `tools.py`:

```python
class GetCampaignInput(BaseModel):
    campaign_id: str = Field(description="Campaign ID (UUID)")

@tool(
    description="Get a single campaign by ID with full details.",
    tags={Platform.CHEERFUL, Action.READ},
)
async def cheerful_get_campaign(
    tool_context: ToolContext,
    db_context: DatabaseContext | None,
    request_context: RequestContext | None,
    params: GetCampaignInput,
) -> str:
    try:
        base_url, api_key = _creds(tool_context)
        user_id = _resolve_user_id(request_context)
        result = await api.get_campaign(base_url, api_key, user_id, params.campaign_id)
        return _fmt_campaign_detail(result)
    except ToolError:
        raise
    except Exception as e:
        raise ToolError(f"Failed to get campaign: {e}") from e
```

Key patterns:
- Input model is a Pydantic `BaseModel` — `user_id` is NEVER a parameter
- Extract credentials via `_creds(tool_context)`
- Resolve user via `_resolve_user_id(request_context)`
- Call `api.py` function (never direct HTTP)
- Format response as XML via private `_fmt_*` helpers
- Catch generic exceptions and wrap as `ToolError`

### CE API Client Pattern

Follow the existing pattern in `api.py`:

```python
async def get_campaign(
    base_url: str, api_key: str, user_id: str, campaign_id: str
) -> dict[str, Any]:
    """Get a single campaign by ID."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{base_url}/api/service/campaigns/{campaign_id}",
            headers={"X-Service-Api-Key": api_key},
            params={"user_id": user_id},
        )
        if resp.status_code == 404:
            raise ToolError(f"Campaign {campaign_id} not found")
        if resp.status_code == 403:
            raise ToolError(f"Access denied to campaign {campaign_id}")
        resp.raise_for_status()
        return resp.json()
```

Key patterns:
- Thin async HTTP wrapper
- Headers: `X-Service-Api-Key`
- `user_id` as query parameter
- Raise `ToolError` for known error codes (404, 403)
- `raise_for_status()` for unexpected errors

### XML Formatter Pattern

Use `tag()`, `wrap()`, `hint()` from `core/xml.py`:

```python
def _fmt_campaign_detail(data: dict[str, Any]) -> str:
    """Format campaign detail as XML for Claude."""
    return tag("campaign",
        id=data["id"],
        name=data["name"],
        type=data.get("campaign_type", "unknown"),
        status=data.get("status", "unknown"),
        created_at=data.get("created_at", ""),
    )
```

Key patterns:
- Use `tag()` for individual items with attributes
- Use `wrap()` for collections with count
- Use `hint()` for empty states or guidance
- Field names in XML should be clear for Claude to reference
- Don't include null/empty fields — omit them

### CE Tool File Organization

With 113 tools, split into domain files:

```
src_v2/mcp/tools/cheerful/
├── __init__.py                # Export all tool names
├── tools.py                   # Existing 7 tools (fixed in Stage 1)
├── tools_campaigns.py         # Stages 2-4: 23 campaign tools
├── tools_email.py             # Stages 5-7: 21 email tools
├── tools_creators.py          # Stages 8-10: 20 creator tools
├── tools_integrations.py      # Stages 11-12: 17 integration tools
├── tools_users_team.py        # Stage 13: 12 user/team tools
├── tools_analytics.py         # Stage 14: 1 analytics tool
├── tools_search.py            # Stage 14: 4 search tools
├── tools_workflows.py         # Stage 15: 8 workflow tools
├── api.py                     # HTTP client (extend with new endpoints)
└── constants.py               # Constants (extend as needed)
```

Each new file follows the same pattern as `tools.py`: imports, input models, tool definitions, private formatters.

## Rules

- Do ONE priority per iteration, then commit and exit. Do not do scaffold + tests + implement in one run.
- **Read the spec before implementing.** The reverse loop spec is exhaustive — use exact parameter names, types, enums, and validation rules from the spec. Never invent.
- **Follow existing patterns exactly.** Look at how the 7 existing tools work. New tools should look identical in structure.
- **Backend routes must validate user_id.** Every new service route checks that the requesting user owns or has access to the resource.
- **No shortcuts on formatters.** Every tool needs an XML formatter that produces clean, structured output for Claude. Read the Slack formatting guide at `loops/cheerful-ce-parity-reverse/specs/slack-formatting-guide.md`.
- **2-5 units per iteration.** Create 2-5 backend routes, OR write tests for 2-4 tools, OR implement 2-4 tools. Don't try to do too much.
- **The spec is ground truth.** If you're unsure about a parameter type or error condition, read the spec file. If the spec conflicts with actual source code, follow the source code and note the discrepancy.
- **Register tools in catalog.py.** Every new tool must be imported in `__init__.py`, imported in `catalog.py`, and added to `ALL_TOOLS`. The loop is not done until all tools are registered.
- **Two CE-native tools** (`cheerful_improve_email_content` #57, `cheerful_get_thread_summary` #58) call Claude/internal services directly — they do NOT need backend routes. Implement them with direct LLM calls or internal service calls.
- **Test file naming**: `tests/tools/cheerful/test_{domain}.py` (e.g., `test_campaigns.py`, `test_email.py`)
- **Commit messages**: `ce-parity: stage {N} - {action} {description}` (e.g., `ce-parity: stage 2 - backend routes for campaign CRUD`)
