# Workflows Domain — Tool Specifications

**Domain**: Workflows
**Spec file**: `specs/workflows.md`
**Wave 2 status**: Complete
**Wave 3 status**: Complete (w3-workflows-full)

---

## Table of Contents

1. [Campaign Workflow CRUD](#campaign-workflow-crud) (5 tools)
2. [Workflow Execution History](#workflow-execution-history) (2 tools)
3. [Tool Discovery](#tool-discovery) (1 tool)

**Total**: 8 tools (0 existing + 8 new)

> **Service routes needed**: 8 new `/api/service/*` endpoints. All 8 existing backend endpoints are JWT-auth only (`get_current_user`). The context engine authenticates via API key to `/api/service/*` routes. Every endpoint needs a corresponding service route accepting `X-Service-Api-Key` header + `user_id` query parameter.

> **Cross-reference — Campaign wizard**: Workflows are created as part of the campaign wizard step 7 (Integrations section). The frontend creates/updates workflows via the CRUD API during campaign draft save or launch. The `cheerful_launch_campaign` tool in `specs/campaigns.md` creates workflows as part of its orchestration. The workflow tools here cover direct CRUD outside the wizard flow.

> **Cross-reference — Thread execution display**: Workflow execution results are displayed in the mail detail view (`mail-display.tsx`). The `cheerful_get_thread_workflow_execution` tool here maps to that view — the agent can fetch the latest execution result for any thread.

> **Cross-reference — Shopify-workflow tools**: `cheerful_list_shopify_products` and `cheerful_create_shopify_order` (tools #92-93 in `specs/integrations.md`) map to the Shopify-workflow backend endpoints (`GET /api/v1/shopify/workflows/{workflow_id}/products` and `POST /api/v1/shopify/workflow-executions/{workflow_execution_id}/orders`). They are specified in the Integrations domain because Wave 1 analysis (w1-integrations) identified them first. Both are owner-only tools that use `workflow.config.goaffpro_api_key` and `execution.output_data`. The "Creating a Shopify order" workflow pattern references these tools.

> **Scope boundary**: Only user-defined campaign workflows (CRUD + executions + tool discovery) are covered here. The Shopify order creation tools are in `specs/integrations.md`. The 24 Temporal infrastructure workflows (Gmail polling, thread processing, outbox sending, follow-up scheduling, etc.) are NOT user-facing and have no API endpoints — they are excluded from the context engine.

---

## Wave 3 Corrections from Wave 2

The following corrections were discovered during source code verification (`campaign_workflow.py`, `campaign_workflow_execution.py`, `tools.py`, `shopify.py`, and all Pydantic model files):

1. **Error messages do not interpolate IDs**: Campaign not found → `"Campaign not found"` (not `"Campaign {id} not found"`); workflow not found → `"Workflow not found"`; unauthorized → `"Not authorized to access this campaign"` (not `"Access denied to campaign {id}"`)
2. **Integrity error exact string**: `"Workflow with this ID already exists"` (not `"Workflow already exists"`)
3. **Execution status values**: Actual values written by Temporal are `"completed"`, `"error"`, `"skipped"`, `"schema_validation_failed"` — NOT `"pending"`, `"running"`, `"failed"` as webapp TypeScript types suggest. The Pydantic response model has `status: str` with no enum validation, so these are purely by convention.
4. **list_workflow_executions limit range**: Only `le=1000` constraint, no `ge=` minimum. Values of 0 or negative are not rejected by the API but return empty results.
5. **list_workflow_executions has NO workflow existence validation**: The endpoint does NOT check that `workflow_id` exists or belongs to the campaign. It calls `repo.get_by_campaign_workflow_id(workflow_id, limit=limit)` after campaign-ownership check only. An unknown `workflow_id` returns `[]` rather than 404.
6. **update_campaign_workflow cannot set output_schema to null**: Handler uses `if request.output_schema is not None: workflow.output_schema = request.output_schema`. Since `None` is the "field not provided" signal, there is no way to unset `output_schema` back to null once set.
7. **get_latest_execution error message**: `"No execution found for this thread and workflow"` (not `"No execution found"`)
8. **get_latest_execution unauthorized message**: `"Not authorized to access this execution"` (not `"Access denied"`)
9. **Shopify-workflow tools confirmed in integrations domain**: The 2 Shopify-workflow tools identified in Wave 1 Sub-Domain 4 (`GET /api/v1/shopify/workflows/{workflow_id}/products` and `POST /api/v1/shopify/workflow-executions/{workflow_execution_id}/orders`) are already fully specified in `specs/integrations.md` as `cheerful_list_shopify_products` (#92) and `cheerful_create_shopify_order` (#93). They are not duplicated here. This domain remains at 8 tools.
10. **Total unchanged**: 8 tools, 8 service routes (Shopify tools are in integrations domain).

---

## Execution Status Values

This is a cross-cutting concern for both `cheerful_list_workflow_executions` and `cheerful_get_thread_workflow_execution`. The actual status values written to the database by the Temporal activity (`temporal/activity/workflow_execution.py`) are:

| Status | Meaning |
|--------|---------|
| `"completed"` | Workflow executed successfully. If `output_schema` is set, output was validated against it and passed. `output_data` and `raw_response` are populated. |
| `"error"` | Workflow execution encountered an error. `error_message` is populated. NOT `"failed"` — frontend TypeScript types are wrong. |
| `"skipped"` | The workflow classifier determined that no workflows applied to this thread (either no enabled workflows exist, or none matched). `output_data` and `raw_response` are null. |
| `"schema_validation_failed"` | Claude produced output but it didn't match the workflow's `output_schema` JSON Schema. `error_message` contains JSON Schema validation details. |

**Note**: `"pending"` and `"running"` appear in webapp TypeScript types (`'pending' | 'running' | 'completed' | 'failed'`) but are **never written to the database by the backend**. The Pydantic model `CampaignWorkflowExecutionResponse` has `status: str` with no validation — it accepts any string. The CE should not assume these values exist in practice.

---

## Campaign Workflow CRUD

Campaign workflows are AI automation workflows attached to a campaign. Each workflow has a name, instructions (prompt), a set of tool slugs it can use, optional configuration, and an optional output schema. Workflows are executed automatically by Temporal activities when triggered by campaign events (e.g., new thread, opt-in). **Users cannot trigger workflow execution directly** — the CE can only CRUD workflows and read execution results.

---

### `cheerful_list_campaign_workflows`

**Status**: NEW

**Purpose**: List all enabled workflows for a campaign. Returns only workflows where `is_enabled=true`, ordered by creation time ascending.

**Maps to**: `GET /api/service/campaigns/{campaign_id}/workflows` (new service route needed; main route: `GET /api/v1/campaigns/{campaign_id}/workflows`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-or-assigned — user must own the campaign (`campaign.user_id == user_id`) OR be assigned to it via `campaign_member_assignment`.

**Parameters** (user-facing — `user_id` is injected, not listed):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | The campaign to list workflows for. Must be a valid UUID. |

**Parameter Validation Rules**:
- `campaign_id` must be a valid UUID — invalid format returns 422 Unprocessable Entity.
- The authenticated user must own or be assigned to the campaign — 403 otherwise.
- The campaign must exist — 404 if not found.

**Return Schema**:
```json
[
  {
    "id": "uuid — workflow UUID (unique, server-generated)",
    "campaign_id": "uuid — parent campaign UUID",
    "name": "string — workflow name (e.g., 'GoAffPro Discount Code Creation')",
    "instructions": "string — AI prompt/instructions for the workflow",
    "tool_slugs": ["string — list of tool slugs this workflow uses (may be empty)"],
    "config": "object — workflow-specific configuration (varies by type, may be empty {})",
    "output_schema": "object | null — optional JSON schema for structured output from Claude",
    "is_enabled": "boolean — always true (list filters to enabled only)",
    "created_at": "datetime — ISO 8601 creation timestamp",
    "updated_at": "datetime — ISO 8601 last update timestamp"
  }
]
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found | "Campaign not found" | 404 |
| User does not own and is not assigned to campaign | "Not authorized to access this campaign" | 403 |

**Pagination**: None — returns all enabled workflows for the campaign. Typical campaigns have 0–3 workflows. There is no pagination parameter.

**Example Request**:
```
cheerful_list_campaign_workflows(campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890")
```

**Example Response**:
```json
[
  {
    "id": "f1e2d3c4-b5a6-7890-fedc-ba0987654321",
    "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "GoAffPro Discount Code Creation",
    "instructions": "When a creator opts in, search for an existing GoAffPro affiliate. If not found, create one. Then create a discount code using the configured settings.",
    "tool_slugs": ["goaffpro_search_affiliate", "goaffpro_create_affiliate", "goaffpro_create_discount"],
    "config": {
      "goaffpro_api_key": "gaf_abc123...",
      "discount_type": "percentage",
      "discount_value": 20,
      "campaign_name": "Summer Gifting 2026",
      "product_name": "SPF Moisturizer"
    },
    "output_schema": null,
    "is_enabled": true,
    "created_at": "2026-02-15T10:30:00Z",
    "updated_at": "2026-02-15T10:30:00Z"
  }
]
```

**Slack Formatting Notes**:
- If no workflows: "No active workflows for this campaign."
- If workflows exist: numbered list with name, tool count, and creation date. Example: "1. **GoAffPro Discount Code Creation** — 3 tools — created Feb 15"
- Include the workflow ID for reference if the user might want to update/delete/view executions.
- Redact API keys in config (e.g., show `"gaf_abc1..."` not the full key).

**Edge Cases**:
- Returns empty array `[]` if the campaign has no enabled workflows.
- Disabled workflows (`is_enabled=false`) are excluded from results — there is no parameter to include them.
- Deleted workflows are permanently removed (hard delete), so they never appear.

---

### `cheerful_get_campaign_workflow`

**Status**: NEW

**Purpose**: Get a specific workflow by ID, including full configuration and instructions. Returns both enabled and disabled workflows (unlike the list endpoint).

**Maps to**: `GET /api/service/campaigns/{campaign_id}/workflows/{workflow_id}` (new service route needed; main route: `GET /api/v1/campaigns/{campaign_id}/workflows/{workflow_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-or-assigned.

**Parameters** (user-facing — `user_id` is injected):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | The campaign the workflow belongs to. |
| workflow_id | uuid | yes | — | The workflow to retrieve. |

**Parameter Validation Rules**:
- Both `campaign_id` and `workflow_id` must be valid UUIDs — invalid format returns 422.
- The user must own or be assigned to the campaign — 403 otherwise.
- The workflow must exist AND belong to the specified campaign — 404 if either is not true (server checks: `workflow.campaign_id != campaign_id`).

**Return Schema**:
```json
{
  "id": "uuid — workflow UUID",
  "campaign_id": "uuid — parent campaign UUID",
  "name": "string — workflow name",
  "instructions": "string — AI prompt/instructions",
  "tool_slugs": ["string — list of tool slugs (may be empty)"],
  "config": "object — workflow-specific configuration (may be empty {})",
  "output_schema": "object | null — optional structured output schema",
  "is_enabled": "boolean — whether the workflow is active",
  "created_at": "datetime — ISO 8601",
  "updated_at": "datetime — ISO 8601"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found | "Campaign not found" | 404 |
| User not authorized | "Not authorized to access this campaign" | 403 |
| Workflow not found or belongs to a different campaign | "Workflow not found" | 404 |

**Example Request**:
```
cheerful_get_campaign_workflow(campaign_id="a1b2c3d4-...", workflow_id="f1e2d3c4-...")
```

**Example Response**:
```json
{
  "id": "f1e2d3c4-b5a6-7890-fedc-ba0987654321",
  "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Shopify Order Drafting",
  "instructions": "When a creator opts in and provides their shipping address, search for their GoAffPro affiliate account. If they don't have one, create it. Then prepare the order details for Slack approval.",
  "tool_slugs": ["goaffpro_search_affiliate", "goaffpro_create_affiliate"],
  "config": {
    "goaffpro_api_key": "gaf_abc123...",
    "campaign_name": "Summer Gifting 2026",
    "product_name": "SPF Moisturizer"
  },
  "output_schema": {
    "type": "object",
    "properties": {
      "affiliate_id": {"type": "string"},
      "discount_code": {"type": "string"},
      "shipping_address": {"type": "string"}
    }
  },
  "is_enabled": true,
  "created_at": "2026-02-15T10:30:00Z",
  "updated_at": "2026-02-20T14:15:00Z"
}
```

**Slack Formatting Notes**:
- Display workflow name as bold header, then: enabled status, tool count with names, creation/update dates.
- Show instructions in a quote block if the user asks for them (can be long).
- Show config keys but redact sensitive values like API keys (show first 8 chars + `...`).
- If `output_schema` is set, mention: "Has structured output schema."

**Edge Cases**:
- Returns disabled workflows (unlike list) — this is a direct get by ID.
- If the workflow was deleted, returns 404.
- The `workflow.campaign_id != campaign_id` check prevents accessing a workflow from another campaign by using a wrong `campaign_id`.

---

### `cheerful_create_campaign_workflow`

**Status**: NEW

**Purpose**: Create a new AI automation workflow for a campaign. The workflow defines instructions and tools for automated actions triggered by campaign events (e.g., new thread, opt-in).

**Maps to**: `POST /api/service/campaigns/{campaign_id}/workflows` (new service route needed; main route: `POST /api/v1/campaigns/{campaign_id}/workflows`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-or-assigned.

**Parameters** (user-facing — `user_id` is injected):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | The campaign to add the workflow to. |
| name | string | yes | — | Workflow name. Min 1 char, max 255 chars. Convention: descriptive name like "GoAffPro Discount Code Creation". |
| instructions | string | yes | — | AI prompt/instructions for the workflow. Min 1 char, no max length. This is the prompt given to Claude when the workflow executes against a thread. |
| tool_slugs | list[string] | no | [] | List of tool slugs the workflow can use. Use `cheerful_list_workflow_tools` to get valid slugs. Slugs are NOT validated at creation time — invalid slugs cause execution-time failures. |
| config | object | no | {} | Workflow-specific configuration. Shape varies by workflow type. See Known Workflow Types below. Stored as opaque JSONB — no server-side schema validation. |
| output_schema | object | no | null | Optional JSON schema for structured output from Claude. If provided, Claude's output is validated against this schema and the execution status is `"schema_validation_failed"` if it doesn't match. |
| is_enabled | boolean | no | true | Whether the workflow is active. Disabled workflows are not executed by Temporal activities. |

**Parameter Validation Rules**:
- `campaign_id` must be a valid UUID — 422 on invalid format.
- `name` must be 1–255 characters — 422 on violation.
- `instructions` must be at least 1 character — 422 on violation.
- `tool_slugs` items are not validated against the tool registry at creation time.
- `config` and `output_schema` are opaque JSON — no server-side schema validation.
- No limit on number of workflows per campaign.

**Known Workflow Types** (by convention — names and config shapes are not enforced by the backend):

| Workflow Type | Name Convention | Typical Tool Slugs | Config Shape |
|---------------|------|--------------------|--------------|
| GoAffPro Discount | "GoAffPro Discount Code Creation" | `goaffpro_search_affiliate`, `goaffpro_create_affiliate`, `goaffpro_create_discount` | `{ "goaffpro_api_key": string, "discount_type": "percentage" \| "fixed_amount", "discount_value": number, "discount_currency": "USD" \| "CAD" \| "EUR" \| "GBP" \| "AUD" \| "JPY" \| "INR" (optional), "campaign_name": string, "product_name": string, "formatting_instructions": string (optional) }` |
| Order Drafting | "Shopify Order Drafting" | `goaffpro_search_affiliate`, `goaffpro_create_affiliate` | `{ "goaffpro_api_key": string, "campaign_name": string, "product_name": string }` |
| Creator Profile Scraping | "Creator Profile Scraping" | Instagram analysis tools (varies) | (varies) |

**Return Schema**:
```json
{
  "id": "uuid — newly created workflow UUID (server-generated)",
  "campaign_id": "uuid — parent campaign UUID",
  "name": "string — workflow name",
  "instructions": "string — AI prompt/instructions",
  "tool_slugs": ["string — list of tool slugs"],
  "config": "object — workflow configuration",
  "output_schema": "object | null — structured output schema",
  "is_enabled": "boolean — whether workflow is active",
  "created_at": "datetime — ISO 8601",
  "updated_at": "datetime — ISO 8601"
}
```

**HTTP Status**: 201 Created on success.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found | "Campaign not found" | 404 |
| User not authorized | "Not authorized to access this campaign" | 403 |
| IntegrityError on INSERT (UUID collision — extremely rare) | "Workflow with this ID already exists" | 409 |
| `name` too short or too long | 422 Validation Error | 422 |
| `instructions` is empty | 422 Validation Error | 422 |

**Example Request**:
```
cheerful_create_campaign_workflow(
  campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  name="GoAffPro Discount Code Creation",
  instructions="When a creator opts in, search for an existing GoAffPro affiliate by their email. If not found, create a new affiliate account. Then generate a discount code with the configured percentage off.",
  tool_slugs=["goaffpro_search_affiliate", "goaffpro_create_affiliate", "goaffpro_create_discount"],
  config={
    "goaffpro_api_key": "gaf_abc123xyz456",
    "discount_type": "percentage",
    "discount_value": 20,
    "campaign_name": "Summer Gifting 2026",
    "product_name": "SPF Moisturizer"
  },
  is_enabled=true
)
```

**Example Response**:
```json
{
  "id": "f1e2d3c4-b5a6-7890-fedc-ba0987654321",
  "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "GoAffPro Discount Code Creation",
  "instructions": "When a creator opts in, search for an existing GoAffPro affiliate by their email. If not found, create a new affiliate account. Then generate a discount code with the configured percentage off.",
  "tool_slugs": ["goaffpro_search_affiliate", "goaffpro_create_affiliate", "goaffpro_create_discount"],
  "config": {
    "goaffpro_api_key": "gaf_abc123xyz456",
    "discount_type": "percentage",
    "discount_value": 20,
    "campaign_name": "Summer Gifting 2026",
    "product_name": "SPF Moisturizer"
  },
  "output_schema": null,
  "is_enabled": true,
  "created_at": "2026-03-01T09:00:00Z",
  "updated_at": "2026-03-01T09:00:00Z"
}
```

**Slack Formatting Notes**:
- Confirm creation: "Created workflow **GoAffPro Discount Code Creation** for campaign *Summer Gifting 2026* with 3 tools."
- Include the workflow ID for future reference.
- Redact API keys in the confirmation (show first 8 chars + `...`).

**Edge Cases**:
- The 409 Conflict for duplicate workflow ID is essentially impossible in practice — IDs are server-generated UUIDs (`uuid.uuid4()`). This would require an astronomically unlikely UUID collision.
- `tool_slugs` are not validated at creation time. Invalid slugs will cause execution-time failures when Temporal tries to instantiate the MCP server. The agent should validate slugs against `cheerful_list_workflow_tools` before creating.
- Empty `tool_slugs` list `[]` is valid — the workflow may be purely prompt-based with no tool calls.
- Workflows are campaign-scoped — deleting the campaign cascades and deletes all its workflows (FK `cascade="all, delete-orphan"`).

---

### `cheerful_update_campaign_workflow`

**Status**: NEW

**Purpose**: Update an existing workflow's configuration. Only provided fields are updated (partial update / PATCH semantics). Fields not included in the request are left unchanged.

**Maps to**: `PATCH /api/service/campaigns/{campaign_id}/workflows/{workflow_id}` (new service route needed; main route: `PATCH /api/v1/campaigns/{campaign_id}/workflows/{workflow_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-or-assigned.

**Parameters** (user-facing — `user_id` is injected):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | The campaign the workflow belongs to. |
| workflow_id | uuid | yes | — | The workflow to update. |
| name | string | no | — | Updated workflow name. Min 1 char, max 255 chars. |
| instructions | string | no | — | Updated AI prompt/instructions. Min 1 char. |
| tool_slugs | list[string] | no | — | Updated list of tool slugs. Replaces the entire list (not merged). To add a slug, include all existing slugs plus the new one. |
| config | object | no | — | Updated configuration. Replaces the entire config object (not merged). To change one field, include all existing fields plus the change. |
| output_schema | object | no | — | Updated output schema. Replaces the entire schema. **Cannot be set to null once set** — see limitation below. |
| is_enabled | boolean | no | — | Enable or disable the workflow. Setting to false hides it from list but it can still be retrieved by ID. |

**Parameter Validation Rules**:
- `campaign_id` and `workflow_id` must be valid UUIDs — 422 on invalid format.
- `name`, if provided, must be 1–255 characters — 422 on violation.
- `instructions`, if provided, must be at least 1 character — 422 on violation.
- `tool_slugs`, `config`, and `output_schema` replace the entire existing value when provided.
- Fields not included in the request body are left unchanged (true partial PATCH semantics).

**Critical Limitation — output_schema cannot be unset**: The backend handler uses `if request.output_schema is not None: workflow.output_schema = request.output_schema`. Since `None` is the signal for "field not provided", there is no way to set `output_schema` back to `null` after it has been set. This is a backend limitation. The agent cannot remove an output schema once it has been added.

**Return Schema**: Same as `cheerful_get_campaign_workflow` — returns the full updated workflow object.
```json
{
  "id": "uuid",
  "campaign_id": "uuid",
  "name": "string",
  "instructions": "string",
  "tool_slugs": ["string"],
  "config": "object",
  "output_schema": "object | null",
  "is_enabled": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime — reflects the update time"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found | "Campaign not found" | 404 |
| User not authorized | "Not authorized to access this campaign" | 403 |
| Workflow not found or belongs to a different campaign | "Workflow not found" | 404 |
| `name` validation failure | 422 Validation Error | 422 |
| `instructions` validation failure | 422 Validation Error | 422 |

**Example Request**:
```
cheerful_update_campaign_workflow(
  campaign_id="a1b2c3d4-...",
  workflow_id="f1e2d3c4-...",
  config={
    "goaffpro_api_key": "gaf_abc123xyz456",
    "discount_type": "percentage",
    "discount_value": 25,
    "campaign_name": "Summer Gifting 2026",
    "product_name": "SPF Moisturizer"
  },
  is_enabled=false
)
```

**Example Response**:
```json
{
  "id": "f1e2d3c4-b5a6-7890-fedc-ba0987654321",
  "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "GoAffPro Discount Code Creation",
  "instructions": "When a creator opts in, search for an existing GoAffPro affiliate...",
  "tool_slugs": ["goaffpro_search_affiliate", "goaffpro_create_affiliate", "goaffpro_create_discount"],
  "config": {
    "goaffpro_api_key": "gaf_abc123xyz456",
    "discount_type": "percentage",
    "discount_value": 25,
    "campaign_name": "Summer Gifting 2026",
    "product_name": "SPF Moisturizer"
  },
  "output_schema": null,
  "is_enabled": false,
  "created_at": "2026-02-15T10:30:00Z",
  "updated_at": "2026-03-01T11:45:00Z"
}
```

**Slack Formatting Notes**:
- Confirm update with changed fields only: "Updated workflow **GoAffPro Discount Code Creation** — discount value changed to 25%, workflow disabled."
- Do not display the full config in the confirmation.
- If disabling: note that it's hidden from the list but can still be re-enabled.

**Edge Cases**:
- Updating `tool_slugs` replaces the entire list — to add a slug, the agent must include all existing slugs plus the new one. Use `cheerful_get_campaign_workflow` first to get the current list.
- Updating `config` replaces the entire config object — same pattern, get current config first.
- Disabling a workflow (`is_enabled=false`) hides it from `cheerful_list_campaign_workflows` but it can still be retrieved via `cheerful_get_campaign_workflow`. Re-enabling sets `is_enabled=true`.
- In-flight Temporal executions are not affected by updates — changes apply only to future executions.
- `output_schema` cannot be set to null once set (backend limitation). If needed, the workflow must be deleted and recreated.

---

### `cheerful_delete_campaign_workflow`

**Status**: NEW

**Purpose**: Permanently delete a workflow and all its execution history. This is irreversible — there is no soft delete or undo.

**Maps to**: `DELETE /api/service/campaigns/{campaign_id}/workflows/{workflow_id}` (new service route needed; main route: `DELETE /api/v1/campaigns/{campaign_id}/workflows/{workflow_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-or-assigned.

**Parameters** (user-facing — `user_id` is injected):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | The campaign the workflow belongs to. |
| workflow_id | uuid | yes | — | The workflow to permanently delete. |

**Parameter Validation Rules**:
- Both must be valid UUIDs — 422 on invalid format.
- The workflow must exist and belong to the specified campaign — 404 if not.

**Return Schema**: No response body (204 No Content).

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found | "Campaign not found" | 404 |
| User not authorized | "Not authorized to access this campaign" | 403 |
| Workflow not found or belongs to a different campaign | "Workflow not found" | 404 |

**Example Request**:
```
cheerful_delete_campaign_workflow(campaign_id="a1b2c3d4-...", workflow_id="f1e2d3c4-...")
```

**Example Response**: (empty — 204 No Content)

**Slack Formatting Notes**:
- The agent should confirm the workflow name with the user before deleting — call `cheerful_get_campaign_workflow` first.
- Confirm deletion: "Deleted workflow **GoAffPro Discount Code Creation** from campaign *Summer Gifting 2026*. This is permanent and cannot be undone."

**Side Effects**:
- All `CampaignWorkflowExecution` records linked to this workflow are CASCADE deleted.
- This is a hard delete — the workflow record is removed from the database.
- In-flight Temporal executions referencing this workflow may fail if the activity tries to look up the workflow record during execution.

**Edge Cases**:
- Attempting to delete a workflow that is currently being executed by Temporal: the Temporal activity may fail mid-execution when it tries to look up the (now deleted) workflow record.
- Double-delete: returns 404 on the second attempt (workflow already gone).

---

## Workflow Execution History

Workflow executions are append-only records created by Temporal activities when a workflow runs against a thread. Users cannot create, update, or delete executions via the API — they are read-only from the CE perspective.

---

### `cheerful_list_workflow_executions`

**Status**: NEW

**Purpose**: List execution history for a specific workflow, ordered by most recent first. Shows status, output data, errors, and timing for each execution.

**Maps to**: `GET /api/service/campaigns/{campaign_id}/workflows/{workflow_id}/executions` (new service route needed; main route: `GET /api/v1/campaigns/{campaign_id}/workflows/{workflow_id}/executions`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-or-assigned (via campaign ownership/assignment).

**Parameters** (user-facing — `user_id` is injected):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | The campaign the workflow belongs to. |
| workflow_id | uuid | yes | — | The workflow to list executions for. |
| limit | integer | no | 100 | Max number of executions to return. Max value: 1000. No minimum validation — 0 or negative values are accepted by the API but return empty results. |

**Parameter Validation Rules**:
- `campaign_id` and `workflow_id` must be valid UUIDs — 422 on invalid format.
- `limit` must be at most 1000 (`le=1000`) — 422 if exceeded. No minimum constraint in the backend code.
- **Critical**: The endpoint verifies that the campaign exists and the user is authorized, but does NOT verify that `workflow_id` exists or belongs to the campaign. An unknown `workflow_id` returns `[]` (empty list) rather than 404.

**Return Schema**:
```json
[
  {
    "id": "uuid — execution UUID",
    "gmail_thread_state_id": "uuid | null — linked Gmail thread state (null if SMTP thread)",
    "smtp_thread_state_id": "uuid | null — linked SMTP thread state (null if Gmail thread)",
    "workflow_id": "uuid — parent workflow UUID",
    "campaign_id": "uuid — campaign UUID",
    "temporal_workflow_id": "string | null — Temporal workflow run ID (internal reference, null if not yet started)",
    "temporal_run_id": "string | null — Temporal run ID (internal reference)",
    "temporal_activity_id": "string | null — Temporal activity ID (internal reference)",
    "output_data": "object | null — structured JSON output from Claude (populated if status='completed' and output_schema was set)",
    "raw_response": "string | null — full Claude response text (null if status='skipped' or 'error' before Claude ran)",
    "status": "string — one of: 'completed', 'error', 'skipped', 'schema_validation_failed' (see Execution Status Values section above)",
    "error_message": "string | null — error details (populated if status='error' or 'schema_validation_failed')",
    "executed_at": "datetime — ISO 8601 when execution ran",
    "execution_duration_ms": "integer | null — execution time in milliseconds (null if execution is still being written)",
    "created_at": "datetime — ISO 8601 record creation time"
  }
]
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found | "Campaign not found" | 404 |
| User not authorized | "Not authorized to access this campaign" | 403 |
| Unknown workflow_id | (none — returns empty list `[]`) | 200 |

**Pagination**: Limit-based only (no offset, no cursor, no total count). Returns up to `limit` most recent executions ordered by `executed_at DESC`. For most workflows, the full history fits in a single page (default limit=100).

**Example Request**:
```
cheerful_list_workflow_executions(
  campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  workflow_id="f1e2d3c4-b5a6-7890-fedc-ba0987654321",
  limit=10
)
```

**Example Response**:
```json
[
  {
    "id": "11111111-2222-3333-4444-555555555555",
    "gmail_thread_state_id": "aaaa1111-bbbb-2222-cccc-dddd33334444",
    "smtp_thread_state_id": null,
    "workflow_id": "f1e2d3c4-b5a6-7890-fedc-ba0987654321",
    "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "temporal_workflow_id": "campaign-workflow-exec-abc123",
    "temporal_run_id": "run-xyz789",
    "temporal_activity_id": "activity-001",
    "output_data": {
      "affiliate_id": "aff_12345",
      "discount_code": "CREATOR20",
      "discount_type": "percentage",
      "discount_value": 20
    },
    "raw_response": "I searched for the creator's GoAffPro affiliate account and found an existing one (aff_12345). I then created a 20% discount code 'CREATOR20' for them.",
    "status": "completed",
    "error_message": null,
    "executed_at": "2026-02-28T15:30:00Z",
    "execution_duration_ms": 4523,
    "created_at": "2026-02-28T15:30:00Z"
  },
  {
    "id": "66666666-7777-8888-9999-000000000000",
    "gmail_thread_state_id": "eeee5555-ffff-6666-0000-111122223333",
    "smtp_thread_state_id": null,
    "workflow_id": "f1e2d3c4-b5a6-7890-fedc-ba0987654321",
    "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "temporal_workflow_id": "campaign-workflow-exec-def456",
    "temporal_run_id": "run-uvw321",
    "temporal_activity_id": "activity-002",
    "output_data": null,
    "raw_response": null,
    "status": "error",
    "error_message": "GoAffPro API returned 429: rate limit exceeded",
    "executed_at": "2026-02-28T14:00:00Z",
    "execution_duration_ms": 1205,
    "created_at": "2026-02-28T14:00:00Z"
  }
]
```

**Slack Formatting Notes**:
- Show a summary table: status indicator, thread reference (gmail/smtp id), execution time, duration, outcome.
- Status indicators: completed (✓), error (✗), skipped (→), schema_validation_failed (⚠).
- For completed: show key `output_data` fields or first line of `raw_response`.
- For error: show `error_message`.
- The `temporal_*` fields are internal Temporal infrastructure IDs — do not display to user unless debugging.

**Edge Cases**:
- Returns empty array `[]` if the workflow has never been executed OR if the `workflow_id` is unknown/invalid (no workflow existence check).
- The `gmail_thread_state_id` and `smtp_thread_state_id` are mutually exclusive per execution — exactly one is set (the thread that triggered the execution), never both, never neither.
- The `"skipped"` status means the workflow classifier determined this workflow didn't apply to the thread — `output_data` and `raw_response` are null.
- The `"schema_validation_failed"` status means Claude ran but produced output that didn't match `output_schema`. Check `error_message` for JSON Schema validation details.

---

### `cheerful_get_thread_workflow_execution`

**Status**: NEW

**Purpose**: Get the latest workflow execution result for a specific thread and workflow combination. This is what the mail detail view shows — the most recent run of a given workflow against a particular thread.

**Maps to**: `GET /api/service/threads/{thread_state_id}/workflows/{workflow_id}/latest-execution` (new service route needed; main route: `GET /api/v1/threads/{thread_state_id}/workflows/{workflow_id}/latest-execution`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: owner-or-assigned — verified by checking that the execution's campaign is owned by or assigned to the user.

**Parameters** (user-facing — `user_id` is injected):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| thread_state_id | uuid | yes | — | The thread state UUID (Gmail or SMTP). The backend tries Gmail thread states first, then SMTP thread states — the same UUID input is used for both lookups. |
| workflow_id | uuid | yes | — | The workflow UUID to check execution for. |

**Parameter Validation Rules**:
- Both must be valid UUIDs — 422 on invalid format.
- The `thread_state_id` can refer to either a Gmail thread state or an SMTP thread state — the backend searches both.
- The backend resolves authorization via the execution's `campaign_id` (not a campaign_id parameter from the caller).

**Return Schema**: Same shape as a single item from `cheerful_list_workflow_executions`:
```json
{
  "id": "uuid — execution UUID",
  "gmail_thread_state_id": "uuid | null",
  "smtp_thread_state_id": "uuid | null",
  "workflow_id": "uuid",
  "campaign_id": "uuid",
  "temporal_workflow_id": "string | null",
  "temporal_run_id": "string | null",
  "temporal_activity_id": "string | null",
  "output_data": "object | null",
  "raw_response": "string | null",
  "status": "string — one of: 'completed', 'error', 'skipped', 'schema_validation_failed'",
  "error_message": "string | null",
  "executed_at": "datetime — ISO 8601",
  "execution_duration_ms": "integer | null",
  "created_at": "datetime — ISO 8601"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| No execution found for this thread + workflow | "No execution found for this thread and workflow" | 404 |
| Campaign associated with execution not found | "Not authorized to access this execution" | 403 |
| User does not own/is not assigned to the campaign | "Not authorized to access this execution" | 403 |

**Example Request**:
```
cheerful_get_thread_workflow_execution(
  thread_state_id="aaaa1111-bbbb-2222-cccc-dddd33334444",
  workflow_id="f1e2d3c4-b5a6-7890-fedc-ba0987654321"
)
```

**Example Response**:
```json
{
  "id": "11111111-2222-3333-4444-555555555555",
  "gmail_thread_state_id": "aaaa1111-bbbb-2222-cccc-dddd33334444",
  "smtp_thread_state_id": null,
  "workflow_id": "f1e2d3c4-b5a6-7890-fedc-ba0987654321",
  "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "temporal_workflow_id": "campaign-workflow-exec-abc123",
  "temporal_run_id": "run-xyz789",
  "temporal_activity_id": "activity-001",
  "output_data": {
    "affiliate_id": "aff_12345",
    "discount_code": "CREATOR20"
  },
  "raw_response": "Successfully created discount code CREATOR20 for the creator.",
  "status": "completed",
  "error_message": null,
  "executed_at": "2026-02-28T15:30:00Z",
  "execution_duration_ms": 4523,
  "created_at": "2026-02-28T15:30:00Z"
}
```

**Slack Formatting Notes**:
- Show as inline context when displaying thread details: "Workflow **GoAffPro Discount Code Creation** ran 2h ago — completed in 4.5s. Output: discount code CREATOR20."
- For error: "Workflow **GoAffPro Discount Code Creation** failed 2h ago: GoAffPro API returned 429."
- For skipped: "Workflow **GoAffPro Discount Code Creation** was skipped for this thread — not applicable."
- If no execution found (404): "No workflow execution for this thread + workflow combination yet."

**Edge Cases**:
- The backend tries Gmail thread state first (`get_latest_by_gmail_thread_state_id_and_campaign_workflow_id`), then SMTP (`get_latest_by_smtp_thread_state_id_and_campaign_workflow_id`). If the `thread_state_id` doesn't match either table, returns 404.
- Returns only the LATEST execution — if the workflow ran multiple times against this thread (e.g., thread was reprocessed), only the most recent is returned.
- The "latest" is determined by `executed_at DESC` ordering in the repository query.
- If the workflow ran and produced `status="skipped"`, this still returns a record (not 404) — the skipped execution is the "latest" result.

---

## Tool Discovery

### `cheerful_list_workflow_tools`

**Status**: NEW

**Purpose**: List all available tool slugs that can be used in workflow composition. Returns the complete catalog of tools a workflow can be configured to use. This is the authoritative source — use it before creating or updating workflows to validate slugs.

**Maps to**: `GET /api/service/tools` (new service route needed; main route: `GET /api/v1/tools`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`. Permission: authenticated (any logged-in user — not campaign-scoped). The tool list is global, not per-user.

**Parameters**: None (no user-facing parameters, no `user_id` filtering).

**Return Schema**:
```json
[
  {
    "slug": "string — unique tool identifier used in tool_slugs arrays",
    "description": "string — human-readable description of what the tool does (extracted from function docstring)"
  }
]
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |

**Available Tool Slugs** (from `src/services/tools/tool_registry.py` — 13 tools at time of spec):

| Category | Slug | Description |
|----------|------|-------------|
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

**Example Request**:
```
cheerful_list_workflow_tools()
```

**Example Response**:
```json
[
  {"slug": "goaffpro_create_affiliate", "description": "Create GoAffPro affiliate account"},
  {"slug": "goaffpro_create_discount", "description": "Create discount code via GoAffPro"},
  {"slug": "goaffpro_search_affiliate", "description": "Search for existing GoAffPro affiliate"},
  {"slug": "apify_get_instagram_profile", "description": "Get Instagram profile data via Apify"},
  {"slug": "apify_get_instagram_posts", "description": "Get Instagram posts via Apify"},
  {"slug": "apify_find_similar_profiles", "description": "Find similar Instagram profiles via Apify"},
  {"slug": "download_media_file", "description": "Download media file from URL"},
  {"slug": "extract_audio_from_video", "description": "Extract audio track from video file"},
  {"slug": "convert_image_to_base64", "description": "Convert image to base64 encoding"},
  {"slug": "transcribe_audio", "description": "Transcribe audio file to text"},
  {"slug": "analyze_video_custom", "description": "Custom video analysis"},
  {"slug": "apify_scrape_instagram_hashtags", "description": "Scrape Instagram posts by hashtag"},
  {"slug": "apify_scrape_instagram_mentions", "description": "Scrape Instagram mentions"}
]
```

**Slack Formatting Notes**:
- Group by category with section headers: **GoAffPro** (3), **Instagram Analysis** (3), **Media Processing** (5), **Instagram Scraper** (2).
- Display slug in monospace (backtick format) and description inline.
- Total: 13 tools (as of spec; may change with deployments).

**Edge Cases**:
- The tool list is static — defined in `tool_registry.py`. It does not vary per-user or per-campaign.
- If the tool registry is empty (unlikely), returns `[]`.
- The list may grow in future deployments — the agent should call this tool rather than relying on a cached list.
- Descriptions come from function docstring first lines — format is consistent but terse.

---

## Shopify-Workflow Integration (Cross-Reference)

The Shopify order creation workflow uses data extracted by workflow executions. The relevant tools are specified in `specs/integrations.md`:

- **`cheerful_list_shopify_products`** (tool #92) — `GET /api/v1/shopify/workflows/{workflow_id}/products` — retrieves Shopify products via GoAffPro using the API key from `workflow.config.goaffpro_api_key`. **Owner-only**.
- **`cheerful_create_shopify_order`** (tool #93) — `POST /api/v1/shopify/workflow-executions/{workflow_execution_id}/orders` — creates a Shopify order using `execution.output_data` (must contain `email`, `shipping_address`, `line_items`). Execution status must be `"completed"`. **Owner-only**.

Both require the `goaffpro_api_key` in the workflow's config and are OWNER-ONLY (no team-assignment access). See `specs/integrations.md` for full parameter and error documentation.

---

## Webapp-Only Capability: Execution Output Update

**Source**: `webapp/app/api/workflow-executions/[id]/route.ts` (Next.js API route, Supabase direct)

The webapp allows users to manually edit a workflow execution's `output_data` before creating a Shopify order. This is a PATCH operation that merges new values into existing `output_data`.

**Status**: NOT YET SPECIFIABLE AS A CE TOOL — this is a Next.js API route (not a FastAPI backend endpoint) that uses Supabase session auth and requires a CSRF token. The CE cannot call it directly.

**Gap**: A new backend endpoint `PATCH /api/service/workflow-executions/{id}/output-data` would be needed to expose this capability to the CE. This gap should be noted in the parity matrix.

**What the webapp does**:
- Shallow-merges `output_data` updates (deep-merges nested `shipping_address`)
- Validates user owns the campaign (via Supabase RLS: execution → workflow → campaign → user_id)
- Requires CSRF token in request body

---

## Service Routes Summary

All 8 service routes needed for this domain:

| # | Service Route | Method | Maps To (JWT Route) | Auth | Permission |
|---|--------------|--------|---------------------|------|-----------|
| 1 | `/api/service/campaigns/{campaign_id}/workflows` | GET | `GET /api/v1/campaigns/{campaign_id}/workflows` | `X-Service-Api-Key` + `user_id` query param | owner-or-assigned |
| 2 | `/api/service/campaigns/{campaign_id}/workflows/{workflow_id}` | GET | `GET /api/v1/campaigns/{campaign_id}/workflows/{workflow_id}` | `X-Service-Api-Key` + `user_id` query param | owner-or-assigned |
| 3 | `/api/service/campaigns/{campaign_id}/workflows` | POST | `POST /api/v1/campaigns/{campaign_id}/workflows` | `X-Service-Api-Key` + `user_id` query param | owner-or-assigned |
| 4 | `/api/service/campaigns/{campaign_id}/workflows/{workflow_id}` | PATCH | `PATCH /api/v1/campaigns/{campaign_id}/workflows/{workflow_id}` | `X-Service-Api-Key` + `user_id` query param | owner-or-assigned |
| 5 | `/api/service/campaigns/{campaign_id}/workflows/{workflow_id}` | DELETE | `DELETE /api/v1/campaigns/{campaign_id}/workflows/{workflow_id}` | `X-Service-Api-Key` + `user_id` query param | owner-or-assigned |
| 6 | `/api/service/campaigns/{campaign_id}/workflows/{workflow_id}/executions` | GET | `GET /api/v1/campaigns/{campaign_id}/workflows/{workflow_id}/executions` | `X-Service-Api-Key` + `user_id` query param | owner-or-assigned |
| 7 | `/api/service/threads/{thread_state_id}/workflows/{workflow_id}/latest-execution` | GET | `GET /api/v1/threads/{thread_state_id}/workflows/{workflow_id}/latest-execution` | `X-Service-Api-Key` + `user_id` query param | owner-or-assigned (via execution.campaign_id) |
| 8 | `/api/service/tools` | GET | `GET /api/v1/tools` | `X-Service-Api-Key` + `user_id` query param | authenticated (no per-user filtering) |

**Notes**:
- Routes 1–6: implement `verify_campaign_ownership()` logic (user owns campaign OR is assigned via `campaign_member_assignment`).
- Route 7: authorization is resolved via the execution's `campaign_id` (not a URL parameter). Also owner-or-assigned.
- Route 8: no per-user filtering — any authenticated user can list available tools.
- Shopify-workflow routes (`/api/service/shopify/...`) are counted in the integrations domain (see `specs/integrations.md` tools #92-93).

---

## Agent Workflow Patterns

### Creating a workflow during campaign setup
```
1. cheerful_list_workflow_tools()  → show available tools
2. User selects workflow type and tools
3. cheerful_create_campaign_workflow(campaign_id=..., name=..., instructions=..., tool_slugs=[...], config={...})
4. Confirm creation with workflow ID for future reference
```

### Monitoring workflow health
```
1. cheerful_list_campaign_workflows(campaign_id=...)  → see active workflows
2. For each workflow: cheerful_list_workflow_executions(campaign_id=..., workflow_id=..., limit=10)
3. Summarize: X completed, Y error, Z skipped across all workflows
4. If errors: show error_message for the most recent failures
```

### Checking workflow result for a thread
```
1. cheerful_get_thread(thread_id=...)  → get thread context with thread_state_id
2. cheerful_list_campaign_workflows(campaign_id=...)  → find relevant workflow
3. cheerful_get_thread_workflow_execution(thread_state_id=..., workflow_id=...)  → get result
4. Display result inline with thread summary
```

### Creating a Shopify order from a workflow execution
```
1. cheerful_get_thread_workflow_execution(thread_state_id=..., workflow_id=...)  → get execution (status must be "completed")
2. cheerful_list_shopify_products(workflow_id=...) → lookup product variant IDs (see integrations.md tool #92)
3. (Optional) Present output_data to user for review/confirmation of shipping_address and line_items
4. cheerful_create_shopify_order(workflow_execution_id=...)  → create order (see integrations.md tool #93)
5. Report: order name, total, currency
```

### Disabling a failing workflow
```
1. cheerful_list_workflow_executions(campaign_id=..., workflow_id=..., limit=20)  → check failure rate
2. Count by status: completed vs error vs schema_validation_failed
3. If high error rate: cheerful_update_campaign_workflow(campaign_id=..., workflow_id=..., is_enabled=false)
4. Report: "Disabled workflow X — 8/20 recent executions had errors. Common error: {most frequent error_message}"
```

### Re-enabling and fixing a disabled workflow
```
1. cheerful_get_campaign_workflow(campaign_id=..., workflow_id=...)  → see current config (disabled workflows visible here)
2. cheerful_update_campaign_workflow(campaign_id=..., workflow_id=..., config={...new config...}, is_enabled=true)
3. Confirm: "Re-enabled workflow X with updated config."
```
