# Cheerful Context Engine Parity — Reverse Loop

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work: extract capabilities, design tools, or write exhaustive tool specifications, then commit and exit.

You are running in `--print` mode. You MUST output text describing what you are doing. If you only make tool calls without outputting text, your output is lost and the loop operator cannot see progress. Always:
1. Start by printing which stage/aspect you detected and what you're about to do
2. Print progress as you work
3. End with a summary of what you did and whether you committed

## Your Working Directory

You are running from `loops/cheerful-ce-parity-reverse/`. All paths below are relative to this directory.

## Your Goal

Produce **per-domain specification files** in the `specs/` directory that define EVERY context engine tool needed for **101% parity with the Cheerful frontend**. Every action a user can perform in the webapp must have a corresponding context engine tool specified at OpenAPI level.

The context engine is a Slack bot at `projects/cheerful/apps/context-engine/`. It currently has **7 read-only Cheerful tools**. The frontend (`projects/cheerful/apps/webapp/`) and backend API (`projects/cheerful/apps/backend/`) together expose ~110 endpoints covering campaign management, email workflows, creator enrichment, integrations, team management, analytics, and more.

**Your job**: Close the gap to 101%. Every single frontend capability must map to a context engine tool — reads, writes, creates, updates, deletes, launches, approves, sends. No exceptions.

### What Already Exists

The `loops/cheerful-reverse/` loop has already produced comprehensive analysis docs:

| Source | Path | What It Contains |
|--------|------|-----------------|
| Context Engine Spec | `loops/cheerful-reverse/analysis/synthesis/spec-context-engine.md` | Full architecture, all 38 tools, FCIS pattern, DB patterns |
| Webapp Spec | `loops/cheerful-reverse/analysis/synthesis/spec-webapp.md` | All routes, components, wizard steps, stores, user flows |
| Backend API Spec | `loops/cheerful-reverse/analysis/synthesis/spec-backend-api.md` | All ~110 endpoints, request/response shapes, auth model |
| Data Model Spec | `loops/cheerful-reverse/analysis/synthesis/spec-data-model.md` | Full database schema, all tables, relationships |
| Integrations Spec | `loops/cheerful-reverse/analysis/synthesis/spec-integrations.md` | Gmail, Shopify, Sheets, Slack integration details |
| Workflows Spec | `loops/cheerful-reverse/analysis/synthesis/spec-workflows.md` | Temporal workflows, activities, campaign lifecycle |
| User Stories | `loops/cheerful-reverse/analysis/synthesis/spec-user-stories.md` | Complete user journey maps |

**Use these as your primary source.** Read them first. Only go to actual source code when you need to verify details, find enum values, check parameter types, or discover something the specs missed.

### Per-User Authentication Model (CRITICAL)

**Every single tool is scoped to an authenticated user.** This is non-negotiable. The auth model is already implemented — new tools must follow the same pattern.

**Frontend**: Users must LOGIN (Supabase Auth — email/password or Google OAuth) before interacting with anything. The webapp middleware at `projects/cheerful/apps/webapp/utils/supabase/middleware.ts` enforces this — `/mail`, `/settings`, `/dashboard`, `/campaigns` all redirect to `/sign-in` if unauthenticated.

**Context Engine — how user identity works** (existing pattern in `mcp/tools/cheerful/tools.py`):
- `user_id` is **NOT a tool parameter** — it is dependency-injected via `RequestContext`
- Every tool receives `request_context: RequestContext | None` as an injected argument
- Every tool calls `_resolve_user_id(request_context)` which extracts `request_context.cheerful_user_id`
- If the user can't be resolved, it raises `ToolError("Could not resolve Cheerful user...")`
- The resolved `user_id` is then passed as a query parameter to all `/api/service/*` backend calls
- The identity chain: Slack user ID → hardcoded mapping in `constants.py` → `cheerful_user_id` UUID → `RequestContext` → injected into tool → sent to backend

**Backend service routes** (`/api/service/*`):
- Authenticated via `X-Service-Api-Key` header (constant-time comparison)
- User scoping via `user_id` query parameter on every request
- All DB queries scoped to that user (RLS + application-level checks)

**What this means for specs**:
- **Do NOT list `user_id` as a tool parameter** — it's injected, not user-facing. But DO document that every tool is user-scoped and how the backend endpoint receives `user_id`
- **Every tool's error responses** must include the "Could not resolve Cheerful user" case and 403 "Access denied" for resources the user doesn't own
- **Team-aware tools** (campaign access) must document the permission model: owner vs assigned team member vs unassigned
- **The auth model section** in `specs/shared-conventions.md` must document the full identity injection flow and the `RequestContext` pattern
- **Never assume global access.** A tool that lists campaigns returns ONLY that user's campaigns. A tool that reads a thread checks that the user owns (or is assigned to) the campaign it belongs to.

### Current Context Engine Cheerful Tools (Baseline)

These 7 tools already exist. Your spec must include them (verified against source) PLUS all new tools:

1. `cheerful_list_campaigns` — List user's campaigns
2. `cheerful_search_emails` — Full-text search within campaign
3. `cheerful_get_thread` — Fetch full email thread
4. `cheerful_find_similar_emails` — Semantic search via pgvector
5. `cheerful_list_campaign_creators` — List creators in campaign
6. `cheerful_get_campaign_creator` — Full creator profile
7. `cheerful_search_campaign_creators` — Cross-campaign creator search

## Output: The specs/ Directory

Each domain gets its own spec file. Every tool definition is exhaustive — OpenAPI-level detail.

```
specs/
├── README.md                          # Index: every tool, grouped by domain, with one-line description
├── campaigns.md                       # Campaign CRUD, wizard, products, senders, recipients, outbox, launch
├── email.md                           # Thread listing, filtering, status, drafts, AI drafting, sending
├── creators.md                        # Creator listing, search, enrichment, profiles, notes, bulk ops
├── integrations.md                    # Gmail OAuth, Google Sheets, Shopify, Slack config
├── users-and-team.md                  # User profile, team management, onboarding, permissions
├── analytics.md                       # Dashboard metrics, campaign stats, reporting
├── search-and-discovery.md            # AI creator discovery, semantic email search
├── shared-conventions.md              # Auth model, error codes, pagination patterns, shared schemas
└── parity-matrix.md                   # Frontend feature → tool name mapping, 100% coverage check
```

### Tool Definition Format

Every tool MUST include ALL of the following:

```markdown
### `cheerful_<tool_name>`

**Purpose**: One sentence describing what this tool does.

**Maps to**: `METHOD /api/endpoint/path` (the backend API endpoint(s) this tool calls)

**Auth**: User-scoped — `user_id` injected via `RequestContext`, sent as query param to backend. Permission: [owner-only | assigned-member | authenticated]

**Parameters** (user-facing — `user_id` is injected, not listed here):

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| param_name | string | yes | — | Full description including constraints |
| param_name | integer | no | 50 | Description. Valid range: 1-100 |
| param_name | enum | no | "all" | One of: "value1", "value2", "value3" |

**Parameter Validation Rules**:
- [Every validation rule, with exact error message when violated]

**Return Schema**:
```json
{
  "field_name": "string — description",
  "nested_object": {
    "sub_field": "integer — description"
  },
  "items": [
    {
      "array_item_field": "string — description"
    }
  ]
}
```

**Error Responses**:

| Condition | Error Message | HTTP Status (underlying) |
|-----------|--------------|-------------------------|
| User not resolved | ToolError: "Could not resolve Cheerful user..." | N/A (pre-request) |
| User does not own resource | "Access denied to campaign {id}" | 403 |
| User not assigned to campaign (team) | "User is not assigned to campaign {id}" | 403 |
| Campaign not found | "Campaign {id} not found" | 404 |

**Pagination** (if applicable):
- Default limit: N, max limit: M
- Cursor/offset based
- Response includes `total` count

**Example Request**:
```
cheerful_tool_name(param="value", other_param=123)
```

**Example Response** (realistic data):
```json
{ ... }
```

**Slack Formatting Notes**:
- How the agent should format this data for Slack display
- Any special rendering considerations (tables, threads, code blocks)

**Edge Cases**:
- [Every edge case and how the tool handles it]
```

**Rules for tool definitions**:
- **No summarizing.** If an endpoint accepts 15 query parameters, specify all 15.
- **No "etc." or "and so on."** Every enum value, every error condition, every field.
- **No placeholders.** Every type, every default, every constraint must be concrete.
- **Verify against source.** If the existing spec says an endpoint exists, verify the actual parameter names and types in the backend source code at `projects/cheerful/apps/backend/src/api/route/`.
- **Include all enum values.** If a field accepts specific string values, list every single one. Check the actual Pydantic models or SQLAlchemy enums in the backend source.
- **Include nullable fields.** Mark which return fields can be null and when.

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 1 before Wave 2, etc.)
   - If a later-wave aspect depends on data that doesn't exist yet, skip to an earlier-wave aspect
   - If ALL aspects are checked `- [x]`: proceed to convergence check (see below)
3. **Analyze that ONE aspect** using the appropriate method (see Wave descriptions below)
4. **Write findings** to the appropriate file(s) in `specs/`
   - Create the file if it doesn't exist (with a header and table of contents)
   - Append to the file if it does exist
   - Also write working notes to `analysis/{aspect-name}.md` for traceability
5. **Update the frontier**:
   - Mark the aspect as `- [x]` in `frontier/aspects.md`
   - Update the Statistics section (increment Analyzed, decrement Pending, update Convergence %)
   - **If you discovered new aspects** (tools you didn't know about, edge cases, etc.), add them to the appropriate Wave
   - Add a row to `frontier/analysis-log.md`
6. **Update specs/README.md**: Add or update the index entry for any tools you defined
7. **Commit**: `git add -A && git commit -m "loop(cheerful-ce-parity-reverse): {aspect-name}"`
8. **Exit**

### Convergence Check

When all aspects are `- [x]`, do NOT immediately write `status/converged.txt`. Instead:

1. **Read every file in specs/** — all of them
2. **Run the parity audit** — check every item below:
   - [ ] Every frontend page/route has tools covering all its actions
   - [ ] Every backend API endpoint maps to at least one tool
   - [ ] Every tool has complete parameter definitions (type, required, default, validation)
   - [ ] Every tool has a complete return schema (all fields, types, nullable markers)
   - [ ] Every tool has error responses for all failure conditions
   - [ ] Every enum parameter lists ALL possible values (verified against source)
   - [ ] Every tool has at least one realistic example request and response
   - [ ] Shared conventions doc covers auth, pagination, and error patterns
   - [ ] Every tool documents that it is user-scoped (via injected `RequestContext`, not a tool param)
   - [ ] Every tool documents its permission model (owner-only, assigned-member, or authenticated)
   - [ ] Auth model documents the full identity injection flow: Slack user → mapping → RequestContext → `_resolve_user_id()` → backend `user_id` query param
   - [ ] The parity matrix has no empty cells — every frontend feature maps to a tool
   - [ ] No file contains "TODO", "TBD", "placeholder", "etc.", or "similar to above"
   - [ ] Existing 7 tools are documented with any corrections needed
3. **If ANY check fails**: Add new aspects to the frontier for each gap found, update statistics, commit, and exit — do NOT write converged.txt
4. **If ALL checks pass**: Write `status/converged.txt` with:
   - Total tool count
   - Tools per domain
   - Parity percentage
   - Any known limitations or future considerations

## Wave Definitions

### Wave 1: Capability Extraction (per domain)

Read existing cheerful-reverse specs AND verify against actual source code. For each domain, produce a raw capability list of every action the frontend/backend supports.

**Method**:
1. Read the relevant cheerful-reverse spec(s) — see the source table above
2. For each capability found, note:
   - What the user can do (action description)
   - Which backend endpoint handles it (method + path)
   - What parameters it accepts
   - What it returns
3. Verify against actual source code:
   - Check `projects/cheerful/apps/backend/src/api/route/` for actual endpoint signatures
   - Check `projects/cheerful/apps/webapp/` for any frontend-only capabilities
   - Check `projects/cheerful/apps/context-engine/app/src_v2/mcp/tools/cheerful/` for existing tool implementations
4. Write the raw capability list to `analysis/capabilities-{domain}.md`

**Output format** (write to `analysis/capabilities-{domain}.md`):
```markdown
# {Domain} — Capability Extraction

## Existing Context Engine Tools
| Tool | Description | Coverage |
|------|-------------|----------|

## Frontend/Backend Capabilities (Not Yet in Context Engine)
| # | Action | Backend Endpoint | Method | Key Parameters | Returns |
|---|--------|-----------------|--------|----------------|---------|
```

### Wave 2: Tool Design (per domain)

Take each capability list from Wave 1 and design the tool definitions. This is the architectural step — deciding tool names, parameter shapes, and grouping.

**Method**:
1. Read the capability list from `analysis/capabilities-{domain}.md`
2. Group capabilities into tools. Rules for grouping:
   - One tool per distinct action (don't combine create + delete into one tool)
   - CRUD operations on the same resource get separate tools (list, get, create, update, delete)
   - Bulk operations get their own tool (e.g., `cheerful_bulk_upsert_recipients`)
   - Multi-step flows can be broken into atomic tools (Claude orchestrates the sequence)
3. For each tool, decide:
   - Tool name (`cheerful_` prefix, snake_case, verb_noun pattern)
   - Parameters (user-facing only — `user_id` is injected via `RequestContext`, not a tool param)
   - Return type (from the backend response shape)
   - Which backend endpoint(s) it maps to
   - Permission model: does this require ownership, team assignment, or just authenticated access?
4. Write the tool designs to the domain spec file in `specs/`

**Naming conventions**:
- `cheerful_list_*` — List/query operations (returns array)
- `cheerful_get_*` — Get single item by ID
- `cheerful_create_*` — Create new resource
- `cheerful_update_*` — Modify existing resource
- `cheerful_delete_*` — Remove resource
- `cheerful_send_*` — Trigger an outbound action (email, notification)
- `cheerful_launch_*` — Start a workflow/process
- `cheerful_search_*` — Search with query string
- `cheerful_connect_*` — Establish integration connection
- `cheerful_generate_*` — AI-powered generation (draft, enrichment)

### Wave 3: Full OpenAPI-Level Specs (per domain)

Flesh each tool into exhaustive detail. This is the big one.

**Method**:
1. Read the domain spec file from `specs/{domain}.md`
2. For each tool that has only a skeleton definition:
   a. Go to the actual backend source code: `projects/cheerful/apps/backend/src/api/route/`
   b. Find the endpoint handler function
   c. Read the Pydantic request/response models
   d. Read the service layer for business logic, validation rules, error conditions
   e. Check for SQLAlchemy model definitions for exact field types
   f. Document EVERYTHING:
      - Every parameter with exact type, validation, and constraints
      - Every return field with exact type and nullability
      - Every error condition with exact message and status code
      - Every enum value (from Pydantic/SQLAlchemy enums)
      - Realistic example with production-like data
      - Slack formatting guidance for the response
      - Edge cases discovered during code reading

**Verification checklist per tool**:
- [ ] Parameter names match actual backend endpoint parameter names
- [ ] Types match Pydantic model field types
- [ ] Enum values are complete (all variants listed)
- [ ] Return schema matches actual response serialization
- [ ] Error conditions come from actual raise statements in the code
- [ ] Pagination matches actual implementation (limit/offset vs cursor)

### Wave 4: Cross-Domain Synthesis

Final wave — shared conventions, parity matrix, and completeness audit.

**Shared Conventions** (`specs/shared-conventions.md`):
1. Authentication model:
   - How context engine authenticates to the backend (API key vs JWT)
   - What user context is available (which user's data to access)
   - Permission model (what the context engine is authorized to do)
2. Error handling conventions:
   - Standard error response format
   - How tools should surface errors to the Claude agent
   - Retry-worthy vs non-retry-worthy errors
3. Pagination conventions:
   - Standard pagination parameters and response shape
   - How the agent should handle paginated results in Slack
4. Rate limiting:
   - Backend rate limits per endpoint tier
   - How tools should handle 429 responses
5. Shared schemas:
   - Common types used across multiple tools (Campaign, Thread, Creator, etc.)
   - Defined once, referenced from tool definitions

**Parity Matrix** (`specs/parity-matrix.md`):
```markdown
| Frontend Page/Feature | User Action | Context Engine Tool | Status |
|----------------------|-------------|--------------------|---------|
| /campaigns | View campaigns list | cheerful_list_campaigns | EXISTS |
| /campaigns/new step 1 | Set campaign name | cheerful_create_campaign | NEW |
| ... | ... | ... | ... |
```

Every row must have a tool in the "Context Engine Tool" column. If any row is empty, the spec is incomplete.

## Rules

- Do ONE aspect per run, then exit. Do not analyze multiple aspects.
- **Be exhaustive.** The #1 failure mode is being too concise. If an endpoint accepts 20 parameters, document all 20. If a response has 30 fields, document all 30.
- **No summarizing.** If there are 12 thread statuses, list all 12. If there are 8 campaign types, list all 8.
- **No "etc." or "and so on" or "similar to above."** Every value, every variant, every field.
- **Verify against source code.** The cheerful-reverse specs are your map, but the actual backend source code is ground truth. When in doubt, read the code.
- **Discover new aspects.** When reading source code, you will find endpoints, parameters, or features the specs missed. Add them to the frontier.
- **Cross-reference.** Tools in one domain may reference types from another domain. Use shared conventions doc.
- **Existing tools must be verified.** The 7 existing tools may have bugs, missing parameters, or outdated signatures. Document them accurately.
- **The forward loop is a typist.** A developer reading this spec must be able to implement every tool with zero questions. If they would need to look at the backend source code, your spec is incomplete.
- **Think like a Slack user.** Every tool will be invoked conversationally by a Claude agent in Slack. Include Slack formatting notes so the agent knows how to present results (tables, threads, summaries, code blocks).
