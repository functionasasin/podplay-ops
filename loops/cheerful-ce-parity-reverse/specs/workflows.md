# Workflows Domain — Tool Specifications

**Domain**: Workflows
**Spec file**: `specs/workflows.md`
**Wave 2 status**: Tool design complete
**Wave 3 status**: Pending (full OpenAPI-level specs)

---

## Table of Contents

1. [Campaign Workflow CRUD](#campaign-workflow-crud) (5 tools)
2. [Workflow Execution History](#workflow-execution-history) (2 tools)
3. [Tool Discovery](#tool-discovery) (1 tool)

**Total**: 8 tools (0 existing + 8 new)

> **Service routes needed**: 8 new `/api/service/*` endpoints. All 8 existing backend endpoints are JWT-auth only (`get_current_user`). The context engine authenticates via API key to `/api/service/*` routes. Every endpoint needs a corresponding service route accepting `X-Service-Api-Key` header + `user_id` query parameter.

> **Cross-reference — Campaign wizard**: Workflows are created as part of the campaign wizard step 7 (Integrations section). The frontend creates/updates workflows via the CRUD API during campaign draft save or launch. The `cheerful_launch_campaign` tool in `specs/campaigns.md` creates workflows as part of its orchestration. The workflow tools here cover direct CRUD outside the wizard flow.

> **Cross-reference — Thread execution display**: Workflow execution results are displayed in the mail detail view (`mail-display.tsx`). The `cheerful_get_thread_workflow_execution` tool here maps to that view — the agent can fetch the latest execution result for any thread.

> **Scope boundary**: Only user-defined campaign workflows (CRUD + executions + tool discovery) are covered here. The 24 Temporal infrastructure workflows (Gmail polling, thread processing, outbox sending, follow-up scheduling, etc.) are NOT user-facing and have no API endpoints — they are excluded from the context engine.

> **Design rationale — separate domain**: Although workflow endpoints live under `/v1/campaigns/{campaign_id}/workflows`, they form a distinct domain with their own lifecycle (CRUD + append-only execution history + tool composition). Campaign tools in `specs/campaigns.md` explicitly defer workflow tools here.

---

## Campaign Workflow CRUD

Campaign workflows are AI automation workflows attached to a campaign. Each workflow has a name, instructions (prompt), a set of tool slugs it can use, optional configuration, and an optional output schema. Workflows are executed automatically by Temporal activities when triggered by campaign events (e.g., new thread, opt-in).

### `cheerful_list_campaign_workflows`

**Status**: NEW

**Purpose**: List all enabled workflows for a campaign. Returns only workflows where `is_enabled=true`, ordered by creation time.

**Maps to**: `GET /api/service/campaigns/{campaign_id}/workflows` (new service route needed; main route: `GET /api/v1/campaigns/{campaign_id}/workflows`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-or-assigned (user must own the campaign or be assigned to it via `campaign_member_assignment`).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | The campaign to list workflows for |

**Parameter Validation Rules**:
- `campaign_id` must be a valid UUID. Invalid format returns 422.

**Return Schema**:
```json
[
  {
    "id": "uuid — workflow ID",
    "campaign_id": "uuid — parent campaign ID",
    "name": "string — workflow name (e.g., 'GoAffPro Discount Code Creation')",
    "instructions": "string — AI prompt/instructions for the workflow",
    "tool_slugs": ["string — list of tool slugs this workflow uses"],
    "config": "object — workflow-specific configuration (varies by type)",
    "output_schema": "object | null — optional JSON schema for structured output",
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
| Campaign not found | "Campaign {campaign_id} not found" | 404 |
| User does not own/is not assigned to campaign | "Access denied to campaign {campaign_id}" | 403 |

**Pagination**: None — returns all enabled workflows for the campaign. Typical campaigns have 0-3 workflows.

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

**Edge Cases**:
- Returns empty array `[]` if the campaign has no enabled workflows
- Disabled workflows (`is_enabled=false`) are excluded from results — there is no parameter to include them
- Deleted workflows are permanently removed (not soft-deleted), so they never appear

---

### `cheerful_get_campaign_workflow`

**Status**: NEW

**Purpose**: Get a specific workflow by ID, including full configuration and instructions.

**Maps to**: `GET /api/service/campaigns/{campaign_id}/workflows/{workflow_id}` (new service route needed; main route: `GET /api/v1/campaigns/{campaign_id}/workflows/{workflow_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-or-assigned.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | The campaign the workflow belongs to |
| workflow_id | uuid | yes | — | The workflow to retrieve |

**Parameter Validation Rules**:
- Both `campaign_id` and `workflow_id` must be valid UUIDs. Invalid format returns 422.
- The workflow must belong to the specified campaign (verified server-side: `workflow.campaign_id != campaign_id` returns 404).

**Return Schema**:
```json
{
  "id": "uuid — workflow ID",
  "campaign_id": "uuid — parent campaign ID",
  "name": "string — workflow name",
  "instructions": "string — AI prompt/instructions",
  "tool_slugs": ["string — list of tool slugs"],
  "config": "object — workflow-specific configuration",
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
| Campaign not found | "Campaign {campaign_id} not found" | 404 |
| User does not own/is not assigned to campaign | "Access denied to campaign {campaign_id}" | 403 |
| Workflow not found or doesn't belong to campaign | "Workflow {workflow_id} not found" | 404 |

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
- Display workflow name as bold header, then key details: enabled status, tool list, creation/update dates.
- Show instructions in a quote block if the user asks for them (can be long).
- Show config keys (but potentially redact sensitive values like API keys — agent should show "gaf_abc1...").

**Edge Cases**:
- Returns disabled workflows (unlike list) — this is a direct get by ID
- If the workflow was deleted, returns 404
- The `workflow.campaign_id != campaign_id` check means you can't use a wrong campaign_id to access a workflow from another campaign

---

### `cheerful_create_campaign_workflow`

**Status**: NEW

**Purpose**: Create a new AI automation workflow for a campaign. The workflow defines instructions and tools for automated actions triggered by campaign events.

**Maps to**: `POST /api/service/campaigns/{campaign_id}/workflows` (new service route needed; main route: `POST /api/v1/campaigns/{campaign_id}/workflows`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-or-assigned.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | The campaign to add the workflow to |
| name | string | yes | — | Workflow name. Min 1 char, max 255 chars. Convention: descriptive name like "GoAffPro Discount Code Creation" |
| instructions | string | yes | — | AI prompt/instructions for the workflow. Min 1 char, no max length. This is the prompt given to Claude when the workflow executes. |
| tool_slugs | list[string] | no | [] | List of tool slugs the workflow can use. Must be valid slugs from `cheerful_list_workflow_tools`. |
| config | object | no | {} | Workflow-specific configuration. Shape varies by workflow type. See "Known Workflow Types" below. |
| output_schema | object | no | null | Optional JSON schema for structured output from Claude. |
| is_enabled | boolean | no | true | Whether the workflow is active. Disabled workflows are not executed. |

**Parameter Validation Rules**:
- `campaign_id` must be a valid UUID (422 on invalid format)
- `name` must be 1-255 characters (422 on violation)
- `instructions` must be at least 1 character (422 on violation)
- `tool_slugs` items are not validated against the tool registry at creation time — invalid slugs will cause execution-time failures
- `config` and `output_schema` are opaque JSON — no server-side schema validation

**Known Workflow Types** (by convention — not enforced by backend):

| Workflow Type | Name | Typical Tool Slugs | Config Shape |
|---------------|------|--------------------|--------------|
| GoAffPro Discount | "GoAffPro Discount Code Creation" | goaffpro_search_affiliate, goaffpro_create_affiliate, goaffpro_create_discount | `{ goaffpro_api_key: string, discount_type: "percentage" \| "fixed_amount", discount_value: number, discount_currency?: "USD" \| "CAD" \| "EUR" \| "GBP" \| "AUD" \| "JPY" \| "INR", campaign_name: string, product_name: string, formatting_instructions?: string }` |
| Order Drafting | "Shopify Order Drafting" | goaffpro_search_affiliate, goaffpro_create_affiliate | `{ goaffpro_api_key: string, campaign_name: string, product_name: string }` |
| Creator Profile Scraping | "Creator Profile Scraping" | (varies — Instagram analysis tools) | (varies) |

**Return Schema**:
```json
{
  "id": "uuid — newly created workflow ID",
  "campaign_id": "uuid — parent campaign ID",
  "name": "string — workflow name",
  "instructions": "string — AI prompt/instructions",
  "tool_slugs": ["string — list of tool slugs"],
  "config": "object — workflow configuration",
  "output_schema": "object | null — structured output schema",
  "is_enabled": "boolean",
  "created_at": "datetime — ISO 8601",
  "updated_at": "datetime — ISO 8601"
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found | "Campaign {campaign_id} not found" | 404 |
| User does not own/is not assigned to campaign | "Access denied to campaign {campaign_id}" | 403 |
| Duplicate workflow ID (IntegrityError) | "Workflow already exists" | 409 |
| Invalid name length | Validation error: name must be 1-255 chars | 422 |
| Empty instructions | Validation error: instructions must not be empty | 422 |

**Example Request**:
```
cheerful_create_campaign_workflow(
  campaign_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  name="GoAffPro Discount Code Creation",
  instructions="When a creator opts in, search for an existing GoAffPro affiliate by their email. If not found, create a new affiliate account. Then generate a discount code with the configured percentage off.",
  tool_slugs=["goaffpro_search_affiliate", "goaffpro_create_affiliate", "goaffpro_create_discount"],
  config={
    "goaffpro_api_key": "gaf_abc123...",
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
  "instructions": "When a creator opts in, search for an existing GoAffPro affiliate by their email...",
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
  "created_at": "2026-03-01T09:00:00Z",
  "updated_at": "2026-03-01T09:00:00Z"
}
```

**Slack Formatting Notes**:
- Confirm creation: "Created workflow **GoAffPro Discount Code Creation** for campaign *Summer Gifting 2026* with 3 tools."
- Include the workflow ID for future reference.
- If the config contains API keys, redact them in the confirmation message.

**Edge Cases**:
- The 409 Conflict for duplicate workflow ID is rare — IDs are server-generated UUIDs. This would only occur from an extremely unlikely UUID collision or a race condition.
- `tool_slugs` are not validated at creation time. Invalid slugs will cause the workflow to fail at execution time. The agent should validate slugs against `cheerful_list_workflow_tools` before creating.
- Empty `tool_slugs` list is valid — the workflow may be purely prompt-based with no tool calls.
- Workflows are campaign-scoped — deleting the campaign cascades and deletes all its workflows.

---

### `cheerful_update_campaign_workflow`

**Status**: NEW

**Purpose**: Update an existing workflow's configuration. All fields are optional — only provided fields are updated (partial update / PATCH semantics).

**Maps to**: `PATCH /api/service/campaigns/{campaign_id}/workflows/{workflow_id}` (new service route needed; main route: `PATCH /api/v1/campaigns/{campaign_id}/workflows/{workflow_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-or-assigned.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | The campaign the workflow belongs to |
| workflow_id | uuid | yes | — | The workflow to update |
| name | string | no | — | Updated workflow name. Min 1 char, max 255 chars. |
| instructions | string | no | — | Updated AI prompt/instructions. Min 1 char. |
| tool_slugs | list[string] | no | — | Updated list of tool slugs (replaces entire list) |
| config | object | no | — | Updated configuration (replaces entire config) |
| output_schema | object | no | — | Updated output schema (replaces; set to null to remove) |
| is_enabled | boolean | no | — | Enable or disable the workflow |

**Parameter Validation Rules**:
- `campaign_id` and `workflow_id` must be valid UUIDs (422 on invalid format)
- `name`, if provided, must be 1-255 characters (422 on violation)
- `instructions`, if provided, must be at least 1 character (422 on violation)
- `tool_slugs`, `config`, and `output_schema` replace the entire value (not merged) — provide the full list/object
- Fields not included in the request are left unchanged

**Return Schema**: Same as `cheerful_get_campaign_workflow` — returns the full updated workflow object.

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found | "Campaign {campaign_id} not found" | 404 |
| User does not own/is not assigned to campaign | "Access denied to campaign {campaign_id}" | 403 |
| Workflow not found or doesn't belong to campaign | "Workflow {workflow_id} not found" | 404 |
| Invalid name length | Validation error: name must be 1-255 chars | 422 |
| Empty instructions | Validation error: instructions must not be empty | 422 |

**Example Request**:
```
cheerful_update_campaign_workflow(
  campaign_id="a1b2c3d4-...",
  workflow_id="f1e2d3c4-...",
  discount_value=25,
  is_enabled=false
)
```

Wait — config is a single object. The correct way:

```
cheerful_update_campaign_workflow(
  campaign_id="a1b2c3d4-...",
  workflow_id="f1e2d3c4-...",
  config={"goaffpro_api_key": "gaf_abc123...", "discount_type": "percentage", "discount_value": 25, "campaign_name": "Summer Gifting 2026", "product_name": "SPF Moisturizer"},
  is_enabled=false
)
```

**Example Response**: (same shape as `cheerful_get_campaign_workflow` with updated values)

**Slack Formatting Notes**:
- Confirm update: "Updated workflow **GoAffPro Discount Code Creation** — disabled."
- List changed fields only, not the entire config.

**Edge Cases**:
- Updating `tool_slugs` replaces the entire list — to add a slug, the agent must include all existing slugs plus the new one
- Updating `config` replaces the entire config object — to change one field, include all existing fields plus the change
- Disabling a workflow (`is_enabled=false`) hides it from `cheerful_list_campaign_workflows` but it can still be retrieved via `cheerful_get_campaign_workflow`
- In-flight executions are not affected by updates — changes apply to future executions only

---

### `cheerful_delete_campaign_workflow`

**Status**: NEW

**Purpose**: Permanently delete a workflow and all its execution history. This is irreversible.

**Maps to**: `DELETE /api/service/campaigns/{campaign_id}/workflows/{workflow_id}` (new service route needed; main route: `DELETE /api/v1/campaigns/{campaign_id}/workflows/{workflow_id}`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-or-assigned.

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | The campaign the workflow belongs to |
| workflow_id | uuid | yes | — | The workflow to delete |

**Parameter Validation Rules**:
- Both must be valid UUIDs (422 on invalid format)
- The workflow must belong to the specified campaign

**Return Schema**: No response body (204 No Content).

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found | "Campaign {campaign_id} not found" | 404 |
| User does not own/is not assigned to campaign | "Access denied to campaign {campaign_id}" | 403 |
| Workflow not found or doesn't belong to campaign | "Workflow {workflow_id} not found" | 404 |

**Example Request**:
```
cheerful_delete_campaign_workflow(campaign_id="a1b2c3d4-...", workflow_id="f1e2d3c4-...")
```

**Example Response**: (empty — 204 No Content)

**Slack Formatting Notes**:
- Confirm deletion: "Deleted workflow **GoAffPro Discount Code Creation** from campaign *Summer Gifting 2026*."
- The agent should confirm the workflow name before deleting by calling `cheerful_get_campaign_workflow` first.

**Side Effects**:
- All `CampaignWorkflowExecution` records linked to this workflow are CASCADE deleted
- This is permanent — there is no soft delete or undo
- In-flight Temporal executions referencing this workflow may fail if the workflow record is looked up during execution

**Edge Cases**:
- Deleting a workflow that has running executions: the Temporal activity may fail when it tries to look up the workflow record
- Double-delete: returns 404 on second attempt (workflow already gone)

---

## Workflow Execution History

Workflow executions are append-only records created by Temporal activities when a workflow runs against a thread. Users cannot create, update, or delete executions — they are read-only.

### `cheerful_list_workflow_executions`

**Status**: NEW

**Purpose**: List execution history for a specific workflow, ordered by most recent first. Shows status, output data, errors, and timing.

**Maps to**: `GET /api/service/campaigns/{campaign_id}/workflows/{workflow_id}/executions` (new service route needed; main route: `GET /api/v1/campaigns/{campaign_id}/workflows/{workflow_id}/executions`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-or-assigned (via campaign ownership/assignment).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| campaign_id | uuid | yes | — | The campaign the workflow belongs to |
| workflow_id | uuid | yes | — | The workflow to list executions for |
| limit | integer | no | 100 | Max number of executions to return. Valid range: 1-1000. |

**Parameter Validation Rules**:
- `campaign_id` and `workflow_id` must be valid UUIDs (422 on invalid format)
- `limit` must be 1-1000 (422 on violation). Default is 100.

**Return Schema**:
```json
[
  {
    "id": "uuid — execution ID",
    "gmail_thread_state_id": "uuid | null — linked Gmail thread state (null if SMTP)",
    "smtp_thread_state_id": "uuid | null — linked SMTP thread state (null if Gmail)",
    "workflow_id": "uuid — parent workflow ID",
    "campaign_id": "uuid — campaign ID",
    "temporal_workflow_id": "string | null — Temporal workflow run ID (internal reference)",
    "temporal_run_id": "string | null — Temporal run ID",
    "temporal_activity_id": "string | null — Temporal activity ID",
    "output_data": "object | null — structured JSON output from Claude (if output_schema was set)",
    "raw_response": "string | null — full Claude response text",
    "status": "string — one of: 'pending', 'running', 'completed', 'failed'",
    "error_message": "string | null — error details if status='failed'",
    "executed_at": "datetime — ISO 8601 when execution started",
    "execution_duration_ms": "integer | null — execution time in milliseconds (null if still running or pending)",
    "created_at": "datetime — ISO 8601 record creation time"
  }
]
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| Campaign not found | "Campaign {campaign_id} not found" | 404 |
| User does not own/is not assigned to campaign | "Access denied to campaign {campaign_id}" | 403 |
| Workflow not found | "Workflow {workflow_id} not found" | 404 |

**Pagination**: Limit-based only (no offset). Returns up to `limit` most recent executions ordered by `executed_at DESC`. No total count or cursor. For most workflows, the full history fits in a single page.

**Example Request**:
```
cheerful_list_workflow_executions(
  campaign_id="a1b2c3d4-...",
  workflow_id="f1e2d3c4-...",
  limit=10
)
```

**Example Response**:
```json
[
  {
    "id": "11111111-2222-3333-4444-555555555555",
    "gmail_thread_state_id": "aaaa-bbbb-cccc-dddd",
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
    "gmail_thread_state_id": "eeee-ffff-0000-1111",
    "smtp_thread_state_id": null,
    "workflow_id": "f1e2d3c4-b5a6-7890-fedc-ba0987654321",
    "campaign_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "temporal_workflow_id": "campaign-workflow-exec-def456",
    "temporal_run_id": "run-uvw321",
    "temporal_activity_id": "activity-002",
    "output_data": null,
    "raw_response": null,
    "status": "failed",
    "error_message": "GoAffPro API returned 429: rate limit exceeded",
    "executed_at": "2026-02-28T14:00:00Z",
    "execution_duration_ms": 1205,
    "created_at": "2026-02-28T14:00:00Z"
  }
]
```

**Slack Formatting Notes**:
- Show a summary table: status emoji, thread reference, executed time, duration, outcome
- Status emojis: pending (hourglass), running (spinner), completed (checkmark), failed (X)
- For completed executions: show `output_data` key fields or a one-line summary from `raw_response`
- For failed executions: show `error_message`
- The `temporal_*` fields are internal — don't display to user unless debugging

**Edge Cases**:
- Returns empty array `[]` if the workflow has never been executed
- Executions with `status="running"` will have `execution_duration_ms=null` and `output_data=null`
- Executions with `status="pending"` have not started yet — all output fields are null
- The `gmail_thread_state_id` and `smtp_thread_state_id` are mutually exclusive — exactly one is set per execution (never both, never neither for a valid execution)

---

### `cheerful_get_thread_workflow_execution`

**Status**: NEW

**Purpose**: Get the latest workflow execution result for a specific thread. This is what the mail detail view shows — the most recent run of a given workflow against a particular thread.

**Maps to**: `GET /api/service/threads/{thread_state_id}/workflows/{workflow_id}/latest-execution` (new service route needed; main route: `GET /api/v1/threads/{thread_state_id}/workflows/{workflow_id}/latest-execution`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: owner-or-assigned (verified by checking that the execution's campaign is owned by or assigned to the user).

**Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| thread_state_id | uuid | yes | — | The thread state ID (Gmail or SMTP thread state). The backend checks Gmail thread states first, then SMTP. |
| workflow_id | uuid | yes | — | The workflow to check execution for |

**Parameter Validation Rules**:
- Both must be valid UUIDs (422 on invalid format)
- The `thread_state_id` can refer to either a Gmail thread state or an SMTP thread state — the backend searches both tables

**Return Schema**: Same as a single item from `cheerful_list_workflow_executions`:
```json
{
  "id": "uuid — execution ID",
  "gmail_thread_state_id": "uuid | null",
  "smtp_thread_state_id": "uuid | null",
  "workflow_id": "uuid",
  "campaign_id": "uuid",
  "temporal_workflow_id": "string | null",
  "temporal_run_id": "string | null",
  "temporal_activity_id": "string | null",
  "output_data": "object | null",
  "raw_response": "string | null",
  "status": "string — one of: 'pending', 'running', 'completed', 'failed'",
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
| No execution found for this thread + workflow combination | "No execution found" | 404 |
| User does not own the campaign referenced by the execution | "Access denied" | 403 |

**Example Request**:
```
cheerful_get_thread_workflow_execution(
  thread_state_id="aaaa-bbbb-cccc-dddd",
  workflow_id="f1e2d3c4-..."
)
```

**Example Response**:
```json
{
  "id": "11111111-2222-3333-4444-555555555555",
  "gmail_thread_state_id": "aaaa-bbbb-cccc-dddd",
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
- For failed executions: "Workflow **GoAffPro Discount Code Creation** failed 2h ago: GoAffPro API returned 429."
- If no execution found (404): "No workflow execution for this thread yet."

**Edge Cases**:
- The backend tries Gmail thread state first, then SMTP thread state. If the `thread_state_id` doesn't match either, returns 404.
- Returns only the LATEST execution — if the workflow ran multiple times against this thread (e.g., thread state was reprocessed), only the most recent is returned.
- The "latest" is determined by whichever execution matches the thread state and workflow, then ordered by `executed_at DESC` — the first result is returned.

---

## Tool Discovery

### `cheerful_list_workflow_tools`

**Status**: NEW

**Purpose**: List all available tool slugs that can be used in workflow composition. Returns the complete catalog of tools a workflow can be configured to use.

**Maps to**: `GET /api/service/tools` (new service route needed; main route: `GET /api/v1/tools`)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: authenticated (any logged-in user can list available tools — not campaign-scoped).

**Parameters**: None.

**Return Schema**:
```json
[
  {
    "slug": "string — unique tool identifier used in tool_slugs arrays",
    "description": "string — human-readable description of what the tool does"
  }
]
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |

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
- Group by category: GoAffPro (3), Instagram Analysis (5), Media Processing (3), Instagram Scraper (2)
- Display as a categorized list with slug in monospace and description

**Edge Cases**:
- The tool list is static — defined in `tool_registry.py`. It does not change per-user or per-campaign.
- If the tool registry is empty (unlikely), returns empty array `[]`
- Tool slugs may be added or removed in future deployments — the agent should call this tool to get the current list rather than relying on a cached list

---

## Service Routes Summary

All 8 service routes needed for this domain:

| # | Service Route | Method | Maps To (JWT Route) | Notes |
|---|--------------|--------|---------------------|-------|
| 1 | `/api/service/campaigns/{campaign_id}/workflows` | GET | `GET /api/v1/campaigns/{campaign_id}/workflows` | List enabled workflows |
| 2 | `/api/service/campaigns/{campaign_id}/workflows/{workflow_id}` | GET | `GET /api/v1/campaigns/{campaign_id}/workflows/{workflow_id}` | Get workflow |
| 3 | `/api/service/campaigns/{campaign_id}/workflows` | POST | `POST /api/v1/campaigns/{campaign_id}/workflows` | Create workflow |
| 4 | `/api/service/campaigns/{campaign_id}/workflows/{workflow_id}` | PATCH | `PATCH /api/v1/campaigns/{campaign_id}/workflows/{workflow_id}` | Update workflow |
| 5 | `/api/service/campaigns/{campaign_id}/workflows/{workflow_id}` | DELETE | `DELETE /api/v1/campaigns/{campaign_id}/workflows/{workflow_id}` | Delete workflow |
| 6 | `/api/service/campaigns/{campaign_id}/workflows/{workflow_id}/executions` | GET | `GET /api/v1/campaigns/{campaign_id}/workflows/{workflow_id}/executions` | List executions |
| 7 | `/api/service/threads/{thread_state_id}/workflows/{workflow_id}/latest-execution` | GET | `GET /api/v1/threads/{thread_state_id}/workflows/{workflow_id}/latest-execution` | Get latest execution for thread |
| 8 | `/api/service/tools` | GET | `GET /api/v1/tools` | List available tool slugs |

All service routes authenticate via `X-Service-Api-Key` header and accept `user_id` as a query parameter. Routes 1-6 must implement `verify_campaign_ownership()` logic (user owns campaign OR is assigned via `campaign_member_assignment`). Route 7 must verify user owns the campaign referenced by the execution. Route 8 has no per-user filtering.

---

## Agent Workflow Patterns

### Creating a workflow during campaign setup
```
1. cheerful_list_workflow_tools()  → show available tools
2. User selects workflow type and tools
3. cheerful_create_campaign_workflow(campaign_id=..., name=..., instructions=..., tool_slugs=[...], config={...})
4. Confirm creation
```

### Monitoring workflow health
```
1. cheerful_list_campaign_workflows(campaign_id=...)  → see active workflows
2. For each workflow: cheerful_list_workflow_executions(campaign_id=..., workflow_id=..., limit=5)
3. Summarize: X completed, Y failed, Z pending across all workflows
```

### Checking workflow result for a thread
```
1. cheerful_get_thread(thread_id=...)  → get thread context
2. cheerful_list_campaign_workflows(campaign_id=...)  → find relevant workflow
3. cheerful_get_thread_workflow_execution(thread_state_id=..., workflow_id=...)  → get result
4. Display result inline with thread summary
```

### Disabling a failing workflow
```
1. cheerful_list_workflow_executions(campaign_id=..., workflow_id=..., limit=10)  → check failure rate
2. If high failure rate: cheerful_update_campaign_workflow(campaign_id=..., workflow_id=..., is_enabled=false)
3. Report: "Disabled workflow X — 8/10 recent executions failed. Error: {common error}"
```
