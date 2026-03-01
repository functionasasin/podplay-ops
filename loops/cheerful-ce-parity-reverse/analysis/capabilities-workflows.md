# Workflows — Capability Extraction

## Overview

The Workflows domain covers two distinct layers:

1. **User-Defined Campaign Workflows** — CRUD API for campaign-scoped AI automation workflows (discount codes, order drafting, creator profile scraping). These are user-facing and configurable via the campaign wizard.
2. **Temporal Infrastructure Workflows** — 24 background workflow classes (Gmail polling, SMTP sync, thread processing, outbox sending, follow-up scheduling, discovery, enrichment). These are NOT user-facing — they run as infrastructure. No API endpoints to trigger or manage them directly.

For the Context Engine, only Layer 1 (user-defined campaign workflows) is relevant — Layer 2 is invisible to users.

## Existing Context Engine Tools

| Tool | Description | Coverage |
|------|-------------|----------|
| (none) | No workflow tools exist in the context engine | 0% coverage |

**Total existing CE tools: 0**

## Backend API Endpoints — User-Defined Workflows

### Sub-Domain 1: Campaign Workflow CRUD (5 endpoints)

**Source**: `src/api/route/campaign_workflow.py` (292 lines)
**Router prefix**: `/v1` (mounted via `api_router.include_router(campaign_workflow_router, prefix="/v1", tags=["workflows"])`)
**Auth**: JWT (`get_current_user`)
**Permission**: Campaign ownership OR team assignment (via `verify_campaign_ownership()`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 1 | Create workflow for campaign | `/api/v1/campaigns/{campaign_id}/workflows` | POST | Body: `CampaignWorkflowCreateRequest` (name, instructions, tool_slugs, config, output_schema, is_enabled) | `CampaignWorkflowResponse` (201) |
| 2 | List enabled workflows for campaign | `/api/v1/campaigns/{campaign_id}/workflows` | GET | Path: campaign_id | `list[CampaignWorkflowResponse]` |
| 3 | Get specific workflow | `/api/v1/campaigns/{campaign_id}/workflows/{workflow_id}` | GET | Path: campaign_id, workflow_id | `CampaignWorkflowResponse` |
| 4 | Update workflow (partial) | `/api/v1/campaigns/{campaign_id}/workflows/{workflow_id}` | PATCH | Body: `CampaignWorkflowUpdateRequest` (all fields Optional) | `CampaignWorkflowResponse` |
| 5 | Delete workflow | `/api/v1/campaigns/{campaign_id}/workflows/{workflow_id}` | DELETE | Path: campaign_id, workflow_id | 204 No Content |

**Important Notes**:
- List endpoint only returns **enabled** workflows (`is_enabled=True`), ordered by `created_at`
- Create can return 409 Conflict if workflow ID already exists (IntegrityError)
- All 5 endpoints use `verify_campaign_ownership()` which checks: (a) campaign exists (404), (b) user owns campaign OR is assigned via `campaign_member_assignment` (403)
- Get/Update/Delete additionally verify workflow belongs to the campaign (`workflow.campaign_id != campaign_id` → 404)

### Sub-Domain 2: Workflow Execution History (2 endpoints)

**Source**: `src/api/route/campaign_workflow_execution.py` (158 lines)
**Router prefix**: `/v1` (mounted via `api_router.include_router(campaign_workflow_execution_router, prefix="/v1", tags=["workflow-executions"])`)
**Auth**: JWT (`get_current_user`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 6 | List execution history for workflow | `/api/v1/campaigns/{campaign_id}/workflows/{workflow_id}/executions` | GET | Path: campaign_id, workflow_id; Query: `limit` (int, default=100, max=1000) | `list[CampaignWorkflowExecutionResponse]` |
| 7 | Get latest execution for thread | `/api/v1/threads/{thread_state_id}/workflows/{workflow_id}/latest-execution` | GET | Path: thread_state_id (UUID), workflow_id (UUID) | `CampaignWorkflowExecutionResponse` |

**Important Notes**:
- Endpoint #6: Ordered by `executed_at DESC` (most recent first). Permission: campaign ownership/assignment.
- Endpoint #7: Tries Gmail thread state first, then SMTP thread state. Permission: verifies user owns campaign referenced by the execution. Can return 404 if no execution found.
- Execution is append-only — no create/update/delete API for executions (they're created by Temporal activities)

### Sub-Domain 3: Tool Discovery (1 endpoint)

**Source**: `src/api/route/tools.py` (39 lines)
**Router prefix**: `/v1` (mounted via `api_router.include_router(tools_router, prefix="/v1", tags=["tools"])`)
**Auth**: JWT (`get_current_user`)

| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
| 8 | List available tools for workflow composition | `/api/v1/tools` | GET | (none) | `list[ToolInfo]` (slug + description) |

**Available Tool Slugs** (from `src/services/tools/tool_registry.py`, 13 tools total):

| Category | Tool Slug | Description |
|----------|-----------|-------------|
| GoAffPro | `goaffpro_create_affiliate` | Create GoAffPro affiliate account |
| GoAffPro | `goaffpro_create_discount` | Create discount code via GoAffPro |
| GoAffPro | `goaffpro_search_affiliate` | Search for existing GoAffPro affiliate |
| Instagram Analysis | `apify_get_instagram_profile` | Get Instagram profile data via Apify |
| Instagram Analysis | `apify_get_instagram_posts` | Get Instagram posts via Apify |
| Instagram Analysis | `apify_find_similar_profiles` | Find similar Instagram profiles via Apify |
| Media Processing | `download_media_file` | Download media file from URL |
| Media Processing | `extract_audio_from_video` | Extract audio track from video file |
| Media Processing | `convert_image_to_base64` | Convert image to base64 encoding |
| Media Processing | `transcribe_audio` | Transcribe audio file to text |
| Media Processing | `analyze_video_custom` | Custom video analysis |
| Instagram Scraper | `apify_scrape_instagram_hashtags` | Scrape Instagram posts by hashtag |
| Instagram Scraper | `apify_scrape_instagram_mentions` | Scrape Instagram mentions |

### Sub-Domain 4: Campaign Launch Workflow Integration

**Source**: `src/api/route/campaign_launch.py` (part of campaign launch endpoint)
**Note**: Workflows are created as part of the campaign wizard step 7 (Integrations section). The frontend creates workflows via the CRUD API during campaign draft save or launch. This is not a separate endpoint — it's a frontend orchestration pattern.

**Frontend Workflow Types** (from `webapp/lib/workflow-api-client.ts`):

| Workflow Type | Name | Tool Slugs | Config Shape |
|---------------|------|-----------|--------------|
| GoAffPro Discount | "GoAffPro Discount Code Creation" | goaffpro_search_affiliate, goaffpro_create_affiliate, goaffpro_create_discount | `{ goaffpro_api_key, discount_type, discount_value, discount_currency?, campaign_name, product_name, formatting_instructions? }` |
| Order Drafting | "Shopify Order Drafting" | goaffpro_search_affiliate, goaffpro_create_affiliate | `{ goaffpro_api_key, campaign_name, product_name }` |
| Creator Profile Scraping | "Creator Profile Scraping" | (inferred from repository queries) | (used in execution queries) |

**Frontend Config Types** (from `webapp/lib/workflow-api-client.ts`):
- `discount_type`: "percentage" | "fixed_amount"
- `discount_currency`: "USD" | "CAD" | "EUR" | "GBP" | "AUD" | "JPY" | "INR" (from integrations-section.tsx)

### Sub-Domain 5: Webapp-Only Workflow Views

**Source**: Webapp components that display workflow data

| Location | Component | What It Shows |
|----------|-----------|---------------|
| Campaign wizard step 7 | `integrations-section.tsx` | Toggle Shopify discount codes, order drafting; configure GoAffPro token, discount type/value |
| Mail display | `mail-display.tsx` | Workflow execution results for the current thread |
| Campaign details | `campaign-details.tsx` | Lists workflows associated with the campaign |

## Service Routes: NONE

**Critical gap**: There are zero service routes (`/api/service/`) for workflows. All 8 endpoints are JWT-authenticated only. The context engine authenticates via API key to `/api/service/*` endpoints.

**New service routes needed**:
- `GET /api/service/campaigns/{campaign_id}/workflows` — List workflows
- `GET /api/service/campaigns/{campaign_id}/workflows/{workflow_id}` — Get workflow
- `POST /api/service/campaigns/{campaign_id}/workflows` — Create workflow
- `PATCH /api/service/campaigns/{campaign_id}/workflows/{workflow_id}` — Update workflow
- `DELETE /api/service/campaigns/{campaign_id}/workflows/{workflow_id}` — Delete workflow
- `GET /api/service/campaigns/{campaign_id}/workflows/{workflow_id}/executions` — List executions
- `GET /api/service/threads/{thread_state_id}/workflows/{workflow_id}/latest-execution` — Get latest execution for thread
- `GET /api/service/tools` — List available tool slugs

## Data Models — Verified Against Source

### CampaignWorkflow (DB Model)
**Source**: `src/models/database/campaign_workflow.py`

| Field | Type | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| id | UUID | no | gen_random_uuid() | Primary key |
| campaign_id | UUID | no | — | FK → campaign.id, CASCADE delete |
| name | String | no | — | |
| instructions | Text | no | — | |
| tool_slugs | JSON (list[str]) | no | [] | JSONB |
| config | JSON (dict) | no | {} | JSONB |
| output_schema | JSON (dict) | yes | null | |
| is_enabled | bool | no | true | |
| created_at | datetime | no | now() | |
| updated_at | datetime | no | now() | Auto-updates via onupdate |

**Indexes**: `idx_campaign_workflow_campaign_id`, `idx_campaign_workflow_campaign_id_enabled`

### CampaignWorkflowExecution (DB Model)
**Source**: `src/models/database/campaign_workflow_execution.py`

| Field | Type | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| id | UUID | no | gen_random_uuid() | Primary key |
| gmail_thread_state_id | UUID | yes | — | FK → gmail_thread_state.id, CASCADE |
| smtp_thread_state_id | UUID | yes | — | FK → smtp_thread_state.id, CASCADE |
| workflow_id | UUID | no | — | FK → campaign_workflow.id, CASCADE |
| campaign_id | UUID | no | — | FK → campaign.id, CASCADE |
| temporal_workflow_id | String | yes | — | |
| temporal_run_id | String | yes | — | |
| temporal_activity_id | String | yes | — | |
| output_data | JSONB | yes | — | Structured output from Claude |
| raw_response | Text | yes | — | Full Claude response text |
| status | String | no | — | One of: "pending", "running", "completed", "failed" |
| error_message | Text | yes | — | |
| executed_at | datetime | no | now() | When execution ran |
| execution_duration_ms | Integer | yes | — | |
| created_at | datetime | no | now() | |

**Indexes**: `idx_workflow_execution_thread_workflow_time` (gmail_thread_state_id, workflow_id, executed_at DESC), `idx_workflow_execution_temporal` (temporal_workflow_id, temporal_run_id)

**Relationships**: `workflow` → `CampaignWorkflow` (lazy="joined")

### Pydantic Request Models

**CampaignWorkflowCreateRequest**:
- `name`: str, required, min_length=1, max_length=255
- `instructions`: str, required, min_length=1
- `tool_slugs`: list[str], optional, default=[]
- `config`: dict, optional, default={}
- `output_schema`: Optional[dict], default=None
- `is_enabled`: bool, default=True

**CampaignWorkflowUpdateRequest** (all Optional):
- `name`: Optional[str], min_length=1, max_length=255
- `instructions`: Optional[str], min_length=1
- `tool_slugs`: Optional[list[str]]
- `config`: Optional[dict]
- `output_schema`: Optional[dict]
- `is_enabled`: Optional[bool]

### Pydantic Response Models

**CampaignWorkflowResponse**:
- `id`: UUID
- `campaign_id`: UUID
- `name`: str
- `instructions`: str
- `tool_slugs`: list[str]
- `config`: dict
- `output_schema`: Optional[dict]
- `is_enabled`: bool
- `created_at`: datetime
- `updated_at`: datetime

**CampaignWorkflowExecutionResponse**:
- `id`: UUID
- `gmail_thread_state_id`: Optional[UUID]
- `smtp_thread_state_id`: Optional[UUID]
- `workflow_id`: UUID
- `campaign_id`: UUID
- `temporal_workflow_id`: Optional[str]
- `temporal_run_id`: Optional[str]
- `temporal_activity_id`: Optional[str]
- `output_data`: Optional[dict]
- `raw_response`: Optional[str]
- `status`: str (one of: "pending", "running", "completed", "failed")
- `error_message`: Optional[str]
- `executed_at`: datetime
- `execution_duration_ms`: Optional[int]
- `created_at`: datetime

**ToolInfo**:
- `slug`: str
- `description`: str

## Execution Status Values

Verified from `webapp/lib/workflow-api-client.ts`:
- `"pending"` — Queued for execution
- `"running"` — Currently executing
- `"completed"` — Successfully finished
- `"failed"` — Execution failed (error_message populated)

Note: There is no explicit enum in the backend — status is a free-form string field. The above 4 values are used by convention.

## Repository Methods (Additional Queries Beyond API)

**CampaignWorkflowExecutionRepository** has additional query methods used internally but NOT exposed via API:

| Method | What It Does | Used By |
|--------|-------------|---------|
| `get_by_gmail_thread_state_id(id)` | All executions for a Gmail thread state, ordered by time | Internal |
| `get_all_for_gmail_thread_conversation(gmail_thread_id)` | All executions across ALL thread state versions for a Gmail thread | Internal (cross-version) |
| `get_all_for_smtp_thread_conversation(email_thread_id)` | All executions across ALL SMTP thread state versions | Internal (cross-version) |
| `get_creator_profile_by_handle(handle)` | Latest "Creator Profile Scraping" execution by IG username | Internal |
| `get_unique_creator_profiles(limit, offset)` | Deduped creator profiles via DISTINCT ON | Internal |

These could be valuable as CE tools but don't have corresponding API endpoints yet.

## Temporal Workflows (Infrastructure — NOT User-Facing)

24 Temporal workflow classes across 5 tiers. These are background infrastructure and do NOT have user-facing API endpoints. They are included for completeness:

### Tier 1: Perpetual Loops
1. `AllPollHistoryWorkflow` — Gmail polling heartbeat
2. `PostTrackingSchedulerWorkflow` — Instagram post detection (every 48h)

### Tier 2: Triggered Entry Points
3. `ProcessAccountMessagesWorkflow` — Process Gmail messages for one account
4. `AllSmtpInboxSyncWorkflow` / `BatchSmtpInboxSyncWorkflow` — SMTP inbox sync
5. `CampaignDiscoverySchedulerWorkflow` — Weekly creator discovery
6. `TriggerThreadFollowUpDraftWorkflow` — Batch follow-up draft creation
7. `SendCampaignOutboxWorkflow` — Drain campaign outreach emails
8. `SendCampaignFollowUpsWorkflow` — Send campaign-level follow-ups
9. `SendEmailDispatchesWorkflow` — Send scheduled email dispatches
10. `SendPostOptInFollowUpsWorkflow` — Post-opt-in follow-ups (every 4h)

### Tier 3: Per-Thread Processing
11. `ThreadProcessingCoordinatorWorkflow` — Orchestrates all per-thread actions
12. `ThreadSyncWorkflow` — Syncs Gmail thread state
13. `SmtpThreadSyncWorkflow` — Syncs SMTP thread state
14. `ThreadAssociateWorkflow` — Associates thread to campaign
15. `ThreadResponseDraftWorkflow` — AI draft generation
16. `ThreadResponseDraftWithCorrectionsWorkflow` — AI draft with corrections
17. `ThreadFollowUpDraftWorkflow` — AI follow-up draft
18. `ThreadMetricsWorkflow` — Computes thread metrics
19. `ThreadAttachmentExtractWorkflow` — Extracts thread attachments

### Tier 4: Campaign-Level Background
20. `CampaignDiscoveryWorkflow` — Creator discovery for one campaign
21. `EnrichForCampaignWorkflow` — Enrichment for campaign creators
22. `SyncSheetCreatorsWorkflow` — Google Sheets sync
23. `BulkDraftEditWorkflow` — Bulk draft editing
24. `SlackOrderDigestWorkflow` — Slack order approval digest

**None of these have user-facing trigger endpoints.** The CE cannot trigger Temporal workflows directly — they are triggered by the platform's event-driven architecture (Gmail polling, thread ingestion, campaign launch).

## Summary

| Sub-Domain | Endpoints | Existing CE Tools | New Service Routes Needed | New CE Tools Needed |
|------------|-----------|-------------------|--------------------------|---------------------|
| Workflow CRUD | 5 | 0 | 5 | 5 |
| Execution History | 2 | 0 | 2 | 2 |
| Tool Discovery | 1 | 0 | 1 | 1 |
| **Total** | **8** | **0** | **8** | **~8** |

**Key Findings**:
- **Zero CE coverage** — entire domain is new
- **Zero service routes** — all endpoints are JWT-auth only, new service endpoints needed for every capability
- **8 backend endpoints** across 3 sub-domains (CRUD, executions, tool discovery)
- **13 available tool slugs** across GoAffPro, Instagram analysis, and scraping categories
- **4 execution statuses** by convention: pending, running, completed, failed
- **Workflow types defined by name/config** — not an enum; "GoAffPro Discount Code Creation", "Shopify Order Drafting", "Creator Profile Scraping"
- **List only returns enabled** — disabled workflows are hidden from the list endpoint
- **Executions are append-only** — no user-facing create/update/delete
- **Temporal workflows are infrastructure** — 24 background workflows, not user-triggerable via API
- **Additional repository queries** could become CE tools: cross-version execution lookups, creator profile queries by handle
