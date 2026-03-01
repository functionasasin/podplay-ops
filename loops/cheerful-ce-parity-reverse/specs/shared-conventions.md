# Shared Conventions — Cheerful Context Engine

**Spec file**: `specs/shared-conventions.md`
**Wave 4 status**: Complete — w4-shared-schemas

This document defines cross-cutting conventions: the authentication model, error handling, pagination, rate limiting, and canonical shared schemas referenced by all domain specs.

---

## Table of Contents

1. [Authentication & Identity Model](#1-authentication--identity-model)
   - 1.1 [Overview](#11-overview)
   - 1.2 [Identity Injection Chain](#12-identity-injection-chain)
   - 1.3 [Key Implementation Details](#13-key-implementation-details)
   - 1.4 [Permission Tiers](#14-permission-tiers)
   - 1.5 [What This Means for New Tool Specs](#15-what-this-means-for-new-tool-specs)
   - 1.6 [Webapp Authentication Details](#16-webapp-authentication-details)
   - 1.7 [Backend JWT Verification Details](#17-backend-jwt-verification-details)
   - 1.8 [Dev-Only Impersonation](#18-dev-only-impersonation)
2. [Error Handling Conventions](#2-error-handling-conventions)
3. [Pagination Conventions](#3-pagination-conventions)
4. [Rate Limiting](#4-rate-limiting)
5. [Shared Schemas](#5-shared-schemas)
   - 5.1 [Campaign](#51-campaign)
   - 5.2 [Thread (Search Result)](#52-threadsearchresult)
   - 5.3 [Thread (Full Detail)](#53-threaddetailresponse--threadmessage)
   - 5.4 [SimilarEmailResult](#54-similaremailresult)
   - 5.5 [Creator Summary (Campaign)](#55-servicecampaigncreatorsummary)
   - 5.6 [Creator Detail (Campaign)](#56-servicecampaigncreatordetailresponse)
   - 5.7 [Creator Search Result](#57-servicecreatorsearchresult)
   - 5.8 [SocialMediaHandle](#58-socialmediahandle)
   - 5.9 [Draft](#59-draftresponse)
   - 5.10 [EmailSignature](#510-emailsignature)
   - 5.11 [CampaignWorkflow](#511-campaignworkflow)
   - 5.12 [WorkflowExecution](#512-workflowexecution)
   - 5.13 [Team](#513-team)
   - 5.14 [TeamMember](#514-teammember)
   - 5.15 [Creator (Standalone)](#515-creator-standalone)
   - 5.16 [NoteHistoryEntry](#516-notehistoryentry)
   - 5.17 [FollowUpTemplate](#517-followuptemplate)
6. [Enum Reference](#6-enum-reference)
   - 6.1 [CampaignType](#61-campaigntype)
   - 6.2 [CampaignStatus](#62-campaignstatus)
   - 6.3 [CampaignOutboxQueueStatus](#63-campaignoutboxqueuestatus)
   - 6.4 [GmailThreadStatus](#64-gmailthreadstatus)
   - 6.5 [WorkflowExecutionStatus](#65-workflowexecutionstatus)
   - 6.6 [PostOptInFollowUpStatus](#66-postoptinfollowupstatus)
   - 6.7 [TeamMemberRole](#67-teammemberrole)
   - 6.8 [ContactRole](#68-contactrole)
   - 6.9 [SocialMediaPlatform](#69-socialmediaplatform)
   - 6.10 [DraftSource](#610-draftsource)
   - 6.11 [EmailDirection](#611-emaildirection)
7. [Thread ID Formats](#7-thread-id-formats)
8. [Service Route Gaps (New Routes Needed)](#8-service-route-gaps-new-routes-needed)

---

## 1. Authentication & Identity Model

### 1.1 Overview

Every Cheerful context engine tool is **scoped to the authenticated Slack user**. There are three systems involved:

| System | Auth Method | User Identity Source |
|--------|-------------|---------------------|
| Webapp (frontend) | Supabase Auth — email/password or Google OAuth | Supabase session cookie |
| Backend `/api/v1/*` | JWT validation via `get_current_user` dependency | `auth.users.id` from JWT claims |
| Backend `/api/service/*` | `X-Service-Api-Key` header (constant-time comparison) | `user_id` query parameter (sent by CE) |

The context engine uses the **service route** path exclusively.

### 1.2 Identity Injection Chain

The full chain from Slack message to backend user scope:

```
Slack event arrives
    │
    ▼ [Step 1] handlers.py: handle_message()
    │   - Extracts core_msg.author_id (Slack user ID, e.g. "U099FQLC9PG")
    │   - Reads registry._tool_context.deploy_environment ("production"/"staging"/"development")
    │   - Calls get_slack_user_mapping(deploy_environment) → reads SLACK_USER_MAPPING in constants.py
    │   - Maps: Slack user ID → Cheerful user UUID (e.g. "83a3177e-...")
    │   - Constructs: RequestContext(
    │       slack_user_id="U099FQLC9PG",
    │       cheerful_user_id=user_mapping.get(author_id, "")  # "" if not found
    │     )
    │   - Calls execute_message(..., request_context=request_context)
    │
    ▼ [Step 2] services/execution.py: execute_message()
    │   - Receives request_context
    │   - Calls create_sdk_tools(registry, request_context)
    │
    ▼ [Step 3] services/agent/sdk_tools.py: create_sdk_tools()
    │   - Calls create_meta_tools(registry, request_context)
    │   - Wraps result as Claude Agent SDK tools (discover_tools + execute_tool)
    │
    ▼ [Step 4] mcp/meta_tools.py: create_meta_tools()
    │   - Captures request_context in closure over _execute_tool()
    │   - Returns (discover_fn, execute_fn) tuple
    │   - execute_fn is async lambda: (name, params) → _execute_tool(registry, name, params, request_context)
    │
    ▼ [Step 5] When Claude calls execute_tool with a cheerful tool name
    │
    ▼ [Step 6] mcp/meta_tools.py: _execute_tool()
    │   - Calls registry.call_tool(name, params, request_context)
    │
    ▼ [Step 7] mcp/registry.py: ToolRegistry.call_tool()
    │   - Validates params via Pydantic input_model
    │   - Calls: tool_def.handler(self._tool_context, self._db_context, request_context, validated)
    │
    ▼ [Step 8] Tool handler (e.g. cheerful_list_campaigns)
    │   - Calls _creds(tool_context) — raises ToolError if CHEERFUL_API_URL/CHEERFUL_API_KEY missing
    │   - Calls _resolve_user_id(request_context)
    │   - If request_context is None OR cheerful_user_id is "":
    │       raises ToolError("Could not resolve Cheerful user. Ensure user mapping exists.")
    │   - Otherwise returns cheerful_user_id (UUID string)
    │
    ▼ [Step 9] api.py client function (e.g. api.list_campaigns)
    │   - Sends GET /api/service/campaigns
    │   - Headers: {"X-Service-Api-Key": api_key}
    │   - Params: {"user_id": "83a3177e-..."}
    │   - Timeout: 30 seconds
    │
    ▼ [Step 10] Backend FastAPI handler
        - verify_service_api_key dependency validates X-Service-Api-Key (401 if invalid)
        - user_id query param scopes all DB queries to that user
        - RLS policies provide defense-in-depth at DB level
```

### 1.3 Key Implementation Details

**`RequestContext` dataclass** (defined in `context.py`):
```python
@dataclass(frozen=True)
class RequestContext:
    slack_user_id: str = ""
    cheerful_user_id: str = ""
```

**`_resolve_user_id()` function** (in `mcp/tools/cheerful/tools.py`):
```python
def _resolve_user_id(request_context: RequestContext | None) -> str:
    if request_context and request_context.cheerful_user_id:
        return request_context.cheerful_user_id
    raise ToolError("Could not resolve Cheerful user. Ensure user mapping exists.")
```

**`SLACK_USER_MAPPING`** (in `mcp/tools/cheerful/constants.py`):
- Hardcoded dict — staging and production environments have separate mappings
- Key: Slack user ID string (e.g. `"U099FQLC9PG"`)
- Value: Cheerful user UUID string (e.g. `"83a3177e-0307-4e5f-ae4e-4bc823db56e9"`)
- If a Slack user ID is NOT in the mapping, `user_mapping.get(author_id, "")` returns `""`, which causes `_resolve_user_id` to raise a ToolError
- Current sizes: **staging = 9 mappings**, **production = 8 mappings** (U079CJSSNRL is staging-only)
- Same Slack IDs may map to different Cheerful UUIDs between environments (important for data isolation)

**`ToolContext.deploy_environment`** (in `mcp/context.py`):
- Values: `"production"`, `"staging"`, or `"development"` (default: `"development"`)
- Read in `handlers.py`: `registry._tool_context.deploy_environment`
- Drives `get_slack_user_mapping(deploy_environment)` call — selects which SLACK_USER_MAPPING dict to use
- When `deploy_environment` is `"development"`, `get_slack_user_mapping` returns `{}` (no mappings → all CE Cheerful tool calls fail with ToolError)

**`_creds()` helper** (in `mcp/tools/cheerful/tools.py`):
```python
def _creds(ctx: ToolContext) -> tuple[str, str]:
    if not ctx.cheerful_api_url:
        raise ToolError("Cheerful API URL not configured (CHEERFUL_API_URL)")
    if not ctx.cheerful_api_key:
        raise ToolError("Cheerful API key not configured (CHEERFUL_API_KEY)")
    return ctx.cheerful_api_url, ctx.cheerful_api_key
```
Every tool calls `_creds(tool_context)` before `_resolve_user_id()`. Config errors are pre-request failures.

**Optional auth dependency** (in `api/dependencies/auth.py`):
- `get_current_user(credentials)` — required auth, raises 401 if no/invalid token
- `get_optional_user(credentials)` — optional auth, returns `None` if no token provided
- Some read-only backend routes use `get_optional_user` to allow both authenticated and unauthenticated access

**Backend service authentication** (in `auth/service_auth.py`):
- Header: `X-Service-Api-Key: <CHEERFUL_SERVICE_API_KEY>`
- Comparison uses Python `!=` operator — **not** constant-time (simple string equality)
- Returns HTTP 401 (not 403) if key is missing or incorrect: `{"detail": "Invalid service API key"}`
- All `/api/service/*` routes require this header via the `verify_service_api_key` dependency

**`user_id` parameter** in backend service routes:
- Sent as a query parameter by the CE API client
- **Critical gap**: Several existing service routes do NOT validate this parameter — they accept it but the FastAPI endpoint ignores it. These are documented in the relevant domain specs. All new service routes MUST declare and enforce the `user_id` parameter.

### 1.4 Permission Tiers

All tools operate within one of three permission tiers:

| Tier | Who Can Use | What It Means |
|------|-------------|---------------|
| **owner-only** | Campaign owner (`campaign.user_id == user_id`) | Full access including launch, delete, integrations, enrichment |
| **owner-or-assigned** | Owner OR team member with a `campaign_member_assignment` row | Can view/edit campaign data, send emails, manage threads |
| **authenticated** | Any valid Cheerful user (mapped in `SLACK_USER_MAPPING`) | Access to own profile, settings, team membership info |

**Team access model**:
- A team has one owner (`team.owner_user_id`) and N members (`team_member` rows)
- Team members can be assigned to specific campaigns (`campaign_member_assignment`)
- Credential isolation: team members cannot access the owner's Gmail tokens or SMTP credentials via DB (enforced by RLS `SECURITY DEFINER` functions)

**`user_id` is NOT a tool parameter.** It is injected via `RequestContext` and sent to the backend automatically. Tool implementations MUST NOT expose `user_id` as a user-facing input parameter. This is a security requirement — the CE derives identity from the Slack user mapping, not from what the user types.

### 1.5 What This Means for New Tool Specs

Every new tool MUST:
1. Accept `request_context: RequestContext | None` as a dependency-injected argument
2. Call `_resolve_user_id(request_context)` before any API call
3. Pass the resolved `user_id` as a query parameter to all `/api/service/*` requests
4. Include `ToolError: "Could not resolve Cheerful user. Ensure user mapping exists."` in its Error Responses table

Every new `/api/service/*` backend route MUST:
1. Accept `X-Service-Api-Key` header (via `verify_service_api_key` dependency)
2. Declare `user_id: str = Query(...)` as a required query parameter
3. Scope all DB queries to that `user_id`

### 1.6 Webapp Authentication Details

The Next.js webapp uses Supabase Auth with the `@supabase/ssr` package.

**Session management** (`utils/supabase/middleware.ts`):
- Client created with `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Session stored in cookies; middleware reads/writes cookies on each request
- Auth check: `supabase.auth.getUser()` — validates cookie session with Supabase API server-side

**Protected routes** — redirect to `/sign-in` if user is not authenticated:
- `/mail` and all sub-paths
- `/settings` and all sub-paths
- `/dashboard` and all sub-paths
- `/campaigns` and all sub-paths
- `/onboarding` and all sub-paths
- `/` (root page — redirected to `/sign-in` if unauthenticated)

**Public routes** (no auth required):
- `/sign-in`
- `/sign-up`
- `/shopify` (special: always passes through, handles its own redirects)
- `/api/*` routes (depend on individual route's auth implementation)

**User identity forwarding** — when a user IS authenticated, middleware sets these request headers on downstream Next.js API route handlers:
- `x-cheerful-user: user@email.com` — authenticated user's email address
- `x-user-logged-in: 1` — presence flag for quick auth check

**Onboarding flow**:
- Onboarding status stored in `user_onboarding.onboarding_completed` (Supabase DB)
- After first check, cached in `onboarding_completed` cookie (HttpOnly, Secure in prod, SameSite=lax, 1-year expiry) — subsequent requests skip DB query
- Logged-in users at `/`, `/sign-in`, `/sign-up` are redirected to `/mail` (if onboarding done) or `/onboarding` (if not)
- Exception: `/onboarding/connect-email` is always accessible for completed users (re-connection)

### 1.7 Backend JWT Verification Details

The backend `AuthService` (in `api/dependencies/auth.py`) supports dual JWT algorithm:

**Algorithm detection**: Reads `jwt.get_unverified_header(token)["alg"]`

**HS256 path** (older Supabase / production):
- Secret: `SUPABASE_JWT_SECRET` environment variable
- Decode: `jwt.decode(token, jwt_secret, algorithms=["HS256"], verify_aud=False, leeway=60)`
- 60-second clock skew leeway applied

**ES256 path** (newer Supabase CLI):
- JWKS endpoint: `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`
- `PyJWKClient` with `lifespan=300` (5-minute signing key cache)
- Decode: `jwt.decode(token, signing_key.key, algorithms=["ES256"], verify_aud=False, leeway=60)`
- 60-second clock skew leeway applied

**Required JWT claims** (validated after decode):
- `sub` — user UUID (becomes `user_id` in `get_current_user()` return value)
- `role` — Supabase role (e.g. `"authenticated"`)

**`get_current_user()` return shape**:
```python
{
    "user_id": payload["sub"],    # UUID string — Supabase auth.users.id
    "email": payload["email"],    # User's email (may be None in some token shapes)
    "role": payload["role"],      # Supabase role string
    "payload": payload,           # Full decoded JWT payload dict
}
```

**Error responses from `get_current_user()`**:
- Missing Authorization header → 401 "Authorization header required"
- Token expired → 401 "Token has expired"
- Invalid token → 401 "Invalid token: {reason}"
- Other verification error → 401 "Token verification failed"
- Missing `sub` claim → 401 "Token missing 'sub' claim"
- Missing `role` claim → 401 "Token missing 'role' claim"

### 1.8 Dev-Only Impersonation

The backend supports developer impersonation via `x-impersonate-user` header. This is completely irrelevant to the context engine (which uses the service auth path, not JWT auth), but is documented here for completeness.

**Activation**:
- Add `x-impersonate-user: target@email.com` header to any JWT-authenticated request
- Only works when `settings.DEPLOY_ENVIRONMENT == "development"`
- In staging/production → HTTP 403 "Impersonation is only allowed in development mode"

**Resolution**:
- Looks up `user_gmail_account WHERE gmail_email = email AND is_active = true`
- Not found → HTTP 404 "Gmail account not found: {email}"
- Found → replaces `get_current_user()` return value with impersonated user dict

**Impersonated user dict**:
```python
{
    "user_id": impersonated_user_id,    # UUID from user_gmail_account
    "email": impersonate_user,          # The email from the header
    "role": "authenticated",
    "is_impersonated": True,
    "real_user_id": real_user["user_id"],
    "real_user_email": real_user["email"],
}
```

**CE context**: The context engine never uses JWT auth or impersonation — it uses service auth exclusively. This feature only affects direct webapp API calls in development.

---

## 2. Error Handling Conventions

### 2.1 Error Response Format

The CE raises `ToolError` for user-facing errors. FastAPI returns JSON for validation failures.

**`ToolError` format** — string message surfaced directly to Claude agent:
```
ToolError: "<message string>"
```

**FastAPI 422 validation error format** — returned from backend when query params fail Pydantic validation:
```json
{
  "detail": [
    {
      "loc": ["query", "limit"],
      "msg": "ensure this value is less than or equal to 100",
      "type": "value_error.number.not_le"
    }
  ]
}
```

**FastAPI application error format** — returned for 400/403/404 business logic errors:
```json
{
  "detail": "<error message string>"
}
```

### 2.2 Error Tiers

| Tier | When | Example | Retry? |
|------|------|---------|--------|
| Pre-request — user not resolved | `_resolve_user_id` fails (user not in mapping) | `"Could not resolve Cheerful user. Ensure user mapping exists."` | No — must add user to SLACK_USER_MAPPING |
| Pre-request — config missing | `cheerful_api_url` or `cheerful_api_key` not set | `"Cheerful API URL not configured (CHEERFUL_API_URL)"` | No — env config issue |
| 400 Bad Request | Business logic validation failed | `"Campaign already exists"`, `"State ID doesn't match thread"` | No — client error |
| 403 Forbidden | User does not have permission | `"Not authorized to access this campaign"` | No — permission error |
| 404 Not Found | Resource does not exist | `"Campaign not found"`, `"Thread not found"` | No — wrong ID |
| 409 Conflict | Unique constraint violation | `"Workflow with this ID already exists"` | No — client error |
| 422 Unprocessable Entity | Pydantic/query validation failure | `"value is not a valid uuid"` | No — fix parameter |
| 5xx Server Error | Backend infrastructure error | `"Failed to list campaigns (500): ..."` | Yes — transient |
| Timeout | Request exceeded 30s | httpx `ReadTimeout` | Yes — retry once |

### 2.3 How Tools Surface Errors

The CE API client (`api.py`) wraps all non-200 responses in `ToolError` with the format:
```
"{operation} ({status_code}): {response_body[:500]}"
```

Examples from existing tools:
- `"Failed to list campaigns (500): Internal server error"`
- `"Email search failed (422): value is not a valid uuid"`
- `"Thread 'abc123' not found"` (special-cased 404 in `get_thread`)
- `"Creator 'uuid' not found in campaign 'uuid'"` (special-cased 404 in `get_campaign_creator`)

**Error escalation rule**: ToolErrors propagate directly to the Claude agent as error content. The agent should surface the message to the user in Slack in plain language (not the raw ToolError string).

### 2.4 Retry Logic

Tools have NO automatic retry logic — all errors are raised immediately. The Claude agent is responsible for deciding whether to retry. Guidelines for the agent:
- **Do retry**: 5xx errors, timeout errors (only once — exponential backoff not available)
- **Do NOT retry**: 4xx errors (they indicate client errors that won't resolve on retry)
- **Ask user**: 403 permission errors (user may need the owner to assign them)

---

## 3. Pagination Conventions

### 3.1 Standard Pagination Model

Most list tools use **offset-based pagination**:

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | integer | 50 | varies by endpoint | Max items per page |
| `offset` | integer | 0 | unlimited | Skip first N results |

**Standard paginated response shape**:
```json
{
  "items": [...],
  "total": 142
}
```

Note: Not all endpoints use a generic wrapper. Some return `{"campaigns": [...], "total": N}`, `{"creators": [...], "total": N}`, etc. The exact shape is documented per-tool.

### 3.2 Per-Domain Pagination Defaults

| Domain | Default Limit | Max Limit | Notes |
|--------|--------------|-----------|-------|
| Campaigns | 50 | 100 | `list_campaigns` returns all (no pagination in service route) |
| Threads | 50 | 100 | `list_threads` — 12 filter params |
| Creators (campaign) | 50 | 100 | `list_campaign_creators` — offset bug in existing tool |
| Creators (search) | 20 | 50 | `search_campaign_creators` |
| Email search | 20 | 50 | `search_emails` — max 50 |
| Similar emails | 5 | 20 | `find_similar_emails` — min similarity 0.3 |
| Workflow executions | 50 | 1000 | `list_workflow_executions` — only `le=1000` |
| SMTP accounts | no pagination | — | returns full list |
| Team members | no pagination | — | returns full list |
| Email signatures | no pagination | — | returns full list |

### 3.3 Slack Presentation of Paginated Results

When presenting paginated results in Slack:
- If `total` > `limit`, always state: `"Showing X of Y results. Use offset=N to see more."`
- For large lists (>20 items), use a numbered list or table, not inline prose
- For campaign/creator lists, always include the most relevant identifier (campaign_id, creator name + email) so the user can make follow-up requests
- When paginating, suggest the next `offset` value explicitly

---

## 4. Rate Limiting

### 4.1 CE API Client Timeout

All API calls use a 30-second timeout (`_TIMEOUT = 30` in `api.py`). There is no retry logic in the client. Long-running operations (e.g., AI draft generation, bulk enrichment) may exceed this timeout.

### 4.2 Slack Status Updates

The CE status updater rate-limits Slack message updates to at most once every 1.5 seconds (`_UPDATE_INTERVAL_S = 1.5` in `handlers.py`) to avoid Slack API rate limits.

### 4.3 Backend Rate Limits

The Cheerful backend does not implement explicit rate limiting in the application layer (no 429 responses observed in the codebase). Rate limiting, if any, occurs at the infrastructure level (load balancer, Supabase). If the agent receives a 429 from the backend, it should:
1. Wait at least 5 seconds
2. Retry once
3. If still 429, report to the user and stop

### 4.4 External API Dependencies

Some tools call external services that have their own rate limits:
- **Influencer Club** (creator search/enrichment): Unknown rate limits. Profile cache is 24 hours (`_PROFILE_CACHE_HOURS=24`). Search is capped at 10 results (`_SEARCH_LIMIT=10`).
- **Apify** (Instagram profile scraping): Results cached per `apify_run_id`. Do not call repeatedly for the same profile.
- **OpenAI/Claude** (AI draft generation, bulk draft edit): Standard API limits. Bulk draft edit uses Temporal workflow with 5-minute timeout.
- **Gmail API** (thread polling): Managed by Temporal infrastructure, not directly callable.
- **GoAffPro** (Shopify integration): Called via Cheerful backend proxy. Unknown rate limits.
- **Composio/Instantly** (email warm-up): Standard API limits. Uses user email as Composio entity_id.

---

## 5. Shared Schemas

These types appear in multiple domain specs. They are defined once here and referenced by domain specs.

### 5.1 Campaign

**Source**: `models/api/service.py` `ServiceCampaignResponse` (used by `list_campaigns` service route)

```json
{
  "id": "string (uuid) — Campaign UUID",
  "name": "string — Campaign display name",
  "campaign_type": "string — One of: paid_promotion, creator, gifting, sales, other",
  "status": "string — One of: active, paused, draft, completed",
  "slack_channel_id": "string | null — Slack channel ID for order approvals (null if not configured)",
  "created_at": "datetime — ISO 8601 timestamp with timezone"
}
```

**Full Campaign** (from DB model `models/database/campaign.py` — returned by detailed GET endpoints):

```json
{
  "id": "string (uuid)",
  "user_id": "string (uuid) — Owner's Supabase auth.users.id",
  "product_id": "string (uuid) | null — Associated product",
  "name": "string",
  "campaign_type": "string — One of: paid_promotion, creator, gifting, sales, other",
  "status": "string — One of: active, paused, draft, completed",
  "is_external": "boolean — Always false (backend placeholder)",
  "automation_level": "string | null",
  "image_url": "string | null",
  "brand_id": "string (uuid) | null",
  "subject_template": "string — Email subject template with {placeholders}",
  "body_template": "string — Email body template with {placeholders}",
  "agent_name_for_llm": "string — Name the AI agent uses when composing replies (default empty string)",
  "rules_for_llm": "string — Rules/persona for AI response generation (default empty string)",
  "goal_for_llm": "string — Goal context for AI (default empty string)",
  "frequently_asked_questions_for_llm": "array | null — FAQ list for AI context",
  "sample_emails_for_llm": "object | null — Sample email pairs for AI training",
  "is_follow_up_enabled": "boolean",
  "follow_up_gap_in_days": "integer — Default 3",
  "max_follow_ups": "integer — Default 3",
  "is_lookalike_suggestions_enabled": "boolean",
  "follow_up_templates": "array | null — Array of FollowUpTemplate objects",
  "post_opt_in_follow_up_enabled": "boolean",
  "post_opt_in_follow_up_body_template": "string | null",
  "post_opt_in_follow_up_delay_hours": "integer — Default 48",
  "google_sheet_url": "string | null",
  "google_sheet_tab_name": "string | null",
  "google_sheet_data_instructions": "string | null",
  "google_sheet_columns_to_skip": "string[] — Default []",
  "google_sheet_error": "string | null — Last sheet sync error message",
  "google_sheet_error_at": "datetime | null",
  "draft_metadata": "object | null — JSONB blob: wizard form state for DRAFT campaigns",
  "post_tracking_enabled": "boolean — Default false",
  "discovery_enabled": "boolean — Default false",
  "discovery_config": "object | null — DiscoveryConfig JSONB",
  "slack_channel_id": "string | null",
  "created_at": "datetime",
  "updated_at": "datetime",
  "completed_at": "datetime | null"
}
```

### 5.2 ThreadSearchResult

**Source**: `models/api/service.py` `ThreadSearchResult` (returned by `GET /api/service/threads/search`)

```json
{
  "gmail_thread_id": "string — Gmail hex thread ID (e.g. '18f3a2b4c5d6e7f8') or SMTP angle-bracket ID (e.g. '<msg@smtp.example.com>')",
  "subject": "string — Email subject line",
  "sender_email": "string — Email address of the sender",
  "recipient_emails": ["string — Recipient email addresses"],
  "direction": "string — One of: 'inbound', 'outbound' (lowercase, from GmailMessageDirection enum)",
  "message_count": "integer — Number of messages in the thread",
  "latest_date": "datetime — ISO 8601 timestamp of most recent message",
  "matched_snippet": "string — Text snippet surrounding the search match"
}
```

**Formatter bug (existing tools)**: `cheerful_search_emails` incorrectly reads `sender` (not `sender_email`) and `snippet` (not `matched_snippet`), producing empty XML tags. New implementations must use `sender_email` and `matched_snippet`.

### 5.3 ThreadDetailResponse + ThreadMessage

**Source**: `models/api/service.py` `ThreadDetailResponse` and `ThreadMessage` (returned by `GET /api/service/threads/{thread_id}`)

```json
{
  "gmail_thread_id": "string — Thread ID (Gmail hex or SMTP angle-bracket format)",
  "messages": [
    {
      "gmail_message_id": "string — Individual message ID within the thread",
      "direction": "string — One of: 'inbound', 'outbound'",
      "sender_email": "string — Sender email address",
      "recipient_emails": ["string — Recipient email addresses"],
      "subject": "string — Message subject",
      "body_text": "string — Plain text body of the message",
      "internal_date": "datetime — ISO 8601 timestamp when the message was received"
    }
  ]
}
```

**Formatter bug (existing tool)**: `cheerful_get_thread` reads `from` (not `sender_email`) and `to` (not `recipient_emails`) and `date` (not `internal_date`), producing empty XML tags. **The top-level `ThreadDetailResponse` does NOT contain a `subject` field** — subject is on each individual `ThreadMessage`. New implementations must iterate messages and read `sender_email`, `recipient_emails`, `internal_date`.

### 5.4 SimilarEmailResult

**Source**: `models/api/service.py` `SimilarEmailResult` (returned by `GET /api/service/rag/similar`)

```json
{
  "thread_id": "string — Thread ID (Gmail hex or SMTP angle-bracket format)",
  "campaign_id": "string (uuid) — Campaign this thread belongs to",
  "thread_summary": "string — LLM-generated summary of the email thread",
  "inbound_email_text": "string — Plain text of the inbound email",
  "sent_reply_text": "string — The actual reply that was sent",
  "sanitized_reply_text": "string | null — Sanitized version of the reply (may be null)",
  "similarity": "float — Cosine similarity score (0.0 to 1.0). Default filter: >= 0.3"
}
```

**Formatter bug (existing tool)**: `cheerful_find_similar_emails` reads `summary` (not `thread_summary`), `reply_text` (not `sent_reply_text`), and attempts to read a `subject` field that doesn't exist in the response model, producing empty XML tags.

### 5.5 ServiceCampaignCreatorSummary

**Source**: `models/api/service.py` `ServiceCampaignCreatorSummary` (items in `ServiceCampaignCreatorListResponse`)

```json
{
  "id": "string (uuid) — campaign_creator.id (NOT creator.id)",
  "name": "string | null — Creator display name",
  "email": "string | null — Creator email (null if not yet enriched)",
  "role": "string — One of: creator, talent_manager, agency_staff, internal, unknown",
  "gifting_status": "string | null — Gifting pipeline status (free-form string)",
  "paid_promotion_status": "string | null — Paid promotion pipeline status (free-form string)",
  "latest_interaction_at": "string | null — ISO 8601 datetime of last email interaction (serialized as string, not datetime object)",
  "social_media_handles": [
    {
      "platform": "string — One of: instagram, twitter, facebook, youtube, tiktok, linkedin, other",
      "handle": "string",
      "url": "string | null"
    }
  ]
}
```

**Formatter bug (existing tool)**: `cheerful_list_campaign_creators` drops `status` and `slack_channel_id` from the display. The `status` field is not present in this schema (it's on the Campaign, not the creator). The formatter does not surface `gifting_status` prominently.

### 5.6 ServiceCampaignCreatorDetailResponse

**Source**: `models/api/service.py` `ServiceCampaignCreatorDetailResponse` (returned by `GET /api/service/campaigns/{id}/creators/{creator_id}`)

```json
{
  "id": "string (uuid) — campaign_creator.id",
  "campaign_id": "string (uuid)",
  "name": "string | null",
  "email": "string | null",
  "role": "string — One of: creator, talent_manager, agency_staff, internal, unknown",
  "gifting_status": "string | null",
  "gifting_address": "string | null",
  "gifting_discount_code": "string | null",
  "paid_promotion_status": "string | null",
  "paid_promotion_rate": "string | null",
  "talent_manager_name": "string | null",
  "talent_manager_email": "string | null",
  "talent_agency": "string | null",
  "social_media_handles": [
    { "platform": "string", "handle": "string", "url": "string | null" }
  ],
  "notes_history": [
    {
      "content": "string — Note text",
      "generated_at": "string — ISO 8601 datetime",
      "is_manual": "boolean — true if manually entered by user",
      "source": "string — Source of the note (e.g. 'llm', 'user')"
    }
  ],
  "confidence_score": "float — Match confidence (0.0 to 1.0)",
  "manually_verified": "boolean — Whether a human confirmed this creator's identity",
  "latest_interaction_at": "string | null — ISO 8601 datetime",
  "created_at": "string | null — ISO 8601 datetime",
  "updated_at": "string | null — ISO 8601 datetime"
}
```

**CRITICAL AUDIT FINDING**: `enrichment_status`, `enrichment_source`, and `post_opt_in_follow_up_status` are NOT in this response model, despite appearing in the Wave 2 spec. They live only in the full `campaign_creator` DB row, not in the service API response.

### 5.7 ServiceCreatorSearchResult

**Source**: `models/api/service.py` `ServiceCreatorSearchResult` (items in `ServiceCreatorSearchResponse`)

```json
{
  "id": "string (uuid) — campaign_creator.id",
  "campaign_id": "string (uuid)",
  "campaign_name": "string — Campaign display name",
  "name": "string | null",
  "email": "string | null",
  "role": "string — One of: creator, talent_manager, agency_staff, internal, unknown",
  "gifting_status": "string | null",
  "social_media_handles": [
    { "platform": "string", "handle": "string", "url": "string | null" }
  ]
}
```

**Security gap (existing tool)**: `cheerful_search_campaign_creators` with no `campaign_id` searches ALL campaigns globally (not just the user's). The service route does not filter by `user_id`. This is a known bug — see `analysis/existing-tools-audit.md`.

### 5.8 SocialMediaHandle

**Source**: `models/database/campaign_creator.py` `SocialMediaHandleAndUrl` Pydantic model

This type appears in creator listings, creator detail, search results, and creator list items.

```json
{
  "platform": "string — One of: instagram, twitter, facebook, youtube, tiktok, linkedin, other",
  "handle": "string — The username/handle (e.g. 'john_doe'). Do not infer this from URL.",
  "url": "string | null — Explicit URL if provided. null if only handle was given."
}
```

**Rule**: The `url` field MUST NOT be inferred from `handle`. Only populate if an explicit URL was provided in the source data.

### 5.9 DraftResponse

**Source**: `models/api/draft.py` `DraftResponse` (returned by GET/POST/PATCH `/api/v1/threads/{thread_id}/drafts`)

```json
{
  "gmail_thread_state_id": "string (uuid) — Version marker for race condition handling. Must be echoed back in create/update requests.",
  "internal_date": "datetime — ISO 8601 timestamp. For display/debugging only.",
  "draft_subject": "string | null — Draft email subject. null if no draft exists.",
  "draft_body_text": "string | null — Draft email body text. null if no draft exists.",
  "source": "string — One of: 'human' (written in UI), 'llm' (AI-generated)",
  "alternative_drafts": "array | null — List of alternative draft objects [{subject, body_text}]. null if not generated."
}
```

**Race condition model**: `gmail_thread_state_id` is a version anchor. Creating or updating a draft requires providing the current `gmail_thread_state_id`. If it doesn't match the server's current state (i.e., a new email arrived and updated the state), the backend returns 400 `"State ID doesn't match thread"`.

### 5.10 EmailSignature

**Source**: `models/database/email_signature.py` and `models/api/email_signature.py`

```json
{
  "id": "string (uuid)",
  "user_id": "string (uuid) — Owner",
  "campaign_id": "string (uuid) | null — null for user-level signatures, uuid for campaign-specific",
  "name": "string — Display name (max 255 chars)",
  "content": "string — HTML signature content (sanitized, max 10,000 chars)",
  "is_default": "boolean — For user-level signatures: marks this as the default choice. False for campaign signatures.",
  "is_enabled": "boolean — For campaign signatures: auto-appended to drafts when true. False for user-level signatures.",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**Dual-level model**:
- `campaign_id IS NULL` → user-level signature. `is_default` matters. `is_enabled` is always false.
- `campaign_id IS NOT NULL` → campaign-specific signature. `is_enabled` matters. `is_default` is always false.
- The two types are stored in the same table but have different semantics.
- Setting `is_default=true` on a user-level signature automatically sets all other user-level signatures for that user to `is_default=false` (database trigger or application logic).

### 5.11 CampaignWorkflow

**Source**: `models/database/campaign_workflow.py`

```json
{
  "id": "string (uuid)",
  "campaign_id": "string (uuid)",
  "name": "string — Workflow display name",
  "instructions": "string — Natural language description of when/how to execute",
  "tool_slugs": ["string — Tool slug from tool registry (e.g. 'shopify_lookup', 'web_search')"],
  "config": "object — Tool configuration key-value pairs (e.g. {\"goaffpro_api_key\": \"...\"})",
  "output_schema": "object | null — JSON Schema for expected output. null if no structured output required.",
  "is_enabled": "boolean — Only enabled workflows are executed by Temporal",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**Known tool slugs** (from `tool_registry.py` — 13 total as of last verification):
- `shopify_lookup`, `web_search`, `google_maps`, `instagram_lookup`, `tiktok_lookup`, `youtube_lookup`, `twitter_lookup`, `email_lookup`, `phone_lookup`, `company_lookup`, `linkedin_lookup`, `reddit_lookup`, `news_lookup`

### 5.12 WorkflowExecution

**Source**: `models/database/campaign_workflow_execution.py`

```json
{
  "id": "string (uuid)",
  "campaign_workflow_id": "string (uuid)",
  "campaign_id": "string (uuid)",
  "gmail_thread_id": "string — Thread that triggered this execution",
  "status": "string — One of: 'completed', 'error', 'skipped', 'schema_validation_failed' (NOT 'pending'/'running'/'failed')",
  "output_data": "object | null — Structured output if status='completed' and output_schema was set",
  "raw_response": "string | null — Raw LLM response text. null if status='skipped' or 'error'.",
  "error_message": "string | null — Error details if status='error' or 'schema_validation_failed'",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**Status warning**: The webapp TypeScript types include `'pending'` and `'running'` but the Temporal activity NEVER writes these values. The Pydantic model uses `status: str` with no enum validation. The CE should not assume these values exist in production data.

### 5.13 Team

**Source**: `models/database/team.py` `Team`

```json
{
  "id": "string (uuid)",
  "name": "string — Team display name",
  "owner_user_id": "string (uuid) — Supabase auth.users.id of the owner",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### 5.14 TeamMember

**Source**: `models/database/team.py` `TeamMember`

```json
{
  "id": "string (uuid) — team_member row ID",
  "team_id": "string (uuid)",
  "user_id": "string (uuid) — Member's Supabase auth.users.id",
  "role": "string — One of: 'owner', 'member'",
  "created_at": "datetime",
  "email": "string | null — Member's email address (joined from auth.users, always null in list_my_assignments tool due to service key scope)"
}
```

**Note**: The team owner is ALSO inserted as a `team_member` row with `role='owner'` when the team is created. This simplifies "get all team members" queries.

### 5.15 Creator (Standalone)

**Source**: `models/database/creator.py` `Creator` (the canonical creator record, distinct from `campaign_creator`)

```json
{
  "id": "string (uuid) — creator.id (distinct from campaign_creator.id)",
  "platform": "string — One of: instagram, youtube, tiktok, twitter, etc.",
  "handle": "string — Platform username",
  "email": "string | null",
  "follower_count": "integer — Default 0",
  "is_verified": "boolean — Platform verification badge",
  "location": "string | null",
  "keywords": ["string — Topic/niche tags"],
  "profile_data": "object — Platform-specific data (bio, post counts, engagement rate, etc.)",
  "snapshots": "array — Historical profile data snapshots",
  "profile_image_path": "string | null — Storage path for cached profile image",
  "profile_image_etag": "string | null — ETag for cache invalidation",
  "first_seen_at": "datetime",
  "last_updated_at": "datetime",
  "source": "string | null — How this creator was discovered (e.g. 'influencer_club', 'apify', 'manual')"
}
```

**Uniqueness constraint**: `(platform, handle)` must be unique. A creator is identified by platform + handle.

### 5.16 NoteHistoryEntry

**Source**: `models/database/campaign_creator.py` `notes_history` JSONB field (stores last 3 notes)

```json
{
  "content": "string — Note text content",
  "generated_at": "string — ISO 8601 datetime string",
  "is_manual": "boolean — true if entered by user via UI, false if AI-generated",
  "source": "string — Origin of the note (e.g. 'user', 'llm', 'enrichment')"
}
```

**Limit**: Only the last 3 notes are stored. Older notes are discarded.

### 5.17 FollowUpTemplate

**Source**: `models/api/campaign.py` lines 34-69

```json
{
  "index": "integer (>= 0) — 0-based position in follow-up sequence. 0 = first follow-up.",
  "body_template": "string (min_length=1) — Email body with {placeholder} variables for personalization.",
  "hours_since_last_email": "integer (> 0) — Hours to wait after the previous email in the sequence."
}
```

**Validation rules**:
- Indices must be sequential 0-based integers with no gaps or duplicates
- Maximum 10 follow-up templates per campaign
- `body_template` minimum length is 1 character

---

## 6. Enum Reference

### 6.1 CampaignType

**Source**: `models/database/campaign.py` lines 22-27

| Value | Description |
|-------|-------------|
| `"paid_promotion"` | Creator is paid for promotion |
| `"creator"` | Creator collaboration (non-gifting, non-paid) |
| `"gifting"` | Product gifting in exchange for content |
| `"sales"` | Direct sales outreach |
| `"other"` | Catch-all type |

**Frontend mapping** (from `CAMPAIGN_TYPE_MAP` in campaign wizard): Frontend uses human-readable display labels. Backend stores the snake_case value.

### 6.2 CampaignStatus

**Source**: `models/database/campaign.py` lines 30-34

| Value | Description |
|-------|-------------|
| `"active"` | Campaign is live and processing threads |
| `"paused"` | Campaign is temporarily stopped |
| `"draft"` | Campaign in wizard — not yet launched |
| `"completed"` | Campaign is finished |

**Service route filter**: `GET /api/service/campaigns` (existing route) returns only ACTIVE and PAUSED campaigns for the user — it explicitly excludes DRAFT and COMPLETED. This is a documented behavior in `specs/campaigns.md`.

### 6.3 CampaignOutboxQueueStatus

**Source**: `models/database/campaign.py` lines 309-314

| Value | Description |
|-------|-------------|
| `"pending"` | Queued, waiting to be picked up by Temporal |
| `"processing"` | Currently being sent by Temporal activity |
| `"sent"` | Successfully sent |
| `"failed"` | Send failed (error_message populated) |
| `"cancelled"` | Cancelled before sending |

**Analytics note**: Cancelled outbox items are silently excluded from email_stats calculations. Only pending/processing/sent/failed items are counted.

### 6.4 GmailThreadStatus

**Source**: `models/database/gmail_thread_state.py` lines 13-25

| Value | Phase | Description |
|-------|-------|-------------|
| `"READY_FOR_ATTACHMENT_EXTRACTION"` | Processing | New thread, attachments not yet extracted |
| `"READY_FOR_CAMPAIGN_ASSOCIATION"` | Processing | Attachments done, campaign not yet identified |
| `"READY_FOR_RESPONSE_DRAFT"` | Processing | Campaign identified, AI draft not yet generated |
| `"WAITING_FOR_DRAFT_REVIEW"` | Waiting | AI draft generated, waiting for human review |
| `"WAITING_FOR_INBOUND"` | Waiting | Response sent, waiting for reply |
| `"IGNORE"` | Terminal | Thread should not be processed further |
| `"DONE"` | Terminal | Thread processing complete |
| `"NOT_LATEST"` | Terminal | A newer version of this thread state exists |

**Note**: SMTP threads use a parallel `SmtpThreadState` table with a similar status model (verified in `smtp_thread_state.py`). Thread listing tools auto-detect Gmail vs SMTP based on thread ID format.

### 6.5 WorkflowExecutionStatus

**Source**: Temporal activity writes in `temporal/activity/workflow_execution.py`

| Value | Meaning |
|-------|---------|
| `"completed"` | Workflow ran successfully. `output_data` and `raw_response` populated. |
| `"error"` | Execution encountered an error. `error_message` populated. |
| `"skipped"` | Workflow classifier determined no workflow applied. `output_data` null. |
| `"schema_validation_failed"` | Claude output didn't match `output_schema`. `error_message` has JSON Schema details. |

**Incorrect values** (do NOT use): `"pending"`, `"running"`, `"failed"` appear in webapp TypeScript types but are NEVER written by the backend. The Pydantic model accepts any string with no validation.

### 6.6 PostOptInFollowUpStatus

**Source**: `models/database/campaign_creator.py` lines 23-28

| Value | Description |
|-------|-------------|
| `"PENDING"` | Follow-up scheduled but not yet sent |
| `"PROCESSING"` | Currently being sent |
| `"SENT"` | Follow-up successfully sent |
| `"FAILED"` | Send failed |
| `"CANCELLED"` | Cancelled before sending |

### 6.7 TeamMemberRole

**Source**: `models/database/team.py` lines 15-19

| Value | Description |
|-------|-------------|
| `"owner"` | Team owner (also inserted as team_member). Full access to all team campaigns. |
| `"member"` | Team member. Access limited to explicitly assigned campaigns. |

### 6.8 ContactRole

**Source**: `models/database/campaign_creator.py` `CONTACT_ROLES` Literal type

| Value | Description |
|-------|-------------|
| `"creator"` | The creator/influencer themselves |
| `"talent_manager"` | Talent manager representing the creator |
| `"agency_staff"` | Staff at a talent agency |
| `"internal"` | Internal user (e.g. brand employee) |
| `"unknown"` | Role not yet determined (default) |

### 6.9 SocialMediaPlatform

**Source**: `SocialMediaHandleAndUrl.platform` field description in `models/database/campaign_creator.py`

| Value |
|-------|
| `"instagram"` |
| `"twitter"` |
| `"facebook"` |
| `"youtube"` |
| `"tiktok"` |
| `"linkedin"` |
| `"other"` |

### 6.10 DraftSource

**Source**: `models/api/draft.py` `DraftResponse.source` Literal type

| Value | Meaning |
|-------|---------|
| `"human"` | Draft was written by a human in the UI |
| `"llm"` | Draft was AI-generated |

### 6.11 EmailDirection

**Source**: `GmailMessageDirection` enum referenced across thread models

| Value | Meaning | Where Used |
|-------|---------|-----------|
| `"INBOUND"` | Incoming email (from creator to brand) | Used as QUERY PARAMETER filter in `search_emails` (uppercase) |
| `"OUTBOUND"` | Outgoing email (from brand to creator) | Used as QUERY PARAMETER filter (uppercase) |
| `"inbound"` | Same concept | Returned in RESPONSE bodies (lowercase) |
| `"outbound"` | Same concept | Returned in RESPONSE bodies (lowercase) |

**Important**: The `direction` query parameter for `search_emails` is CASE-SENSITIVE and must be UPPERCASE (`"INBOUND"` or `"OUTBOUND"`). Response bodies return lowercase. This inconsistency exists in the current backend implementation.

---

## 7. Thread ID Formats

Threads can be Gmail threads or SMTP threads. Thread IDs have different formats:

| Type | Format | Example |
|------|--------|---------|
| Gmail | Hex string (no angle brackets) | `"18f3a2b4c5d6e7f8"` |
| SMTP | RFC 2822 Message-ID with angle brackets | `"<msg-abc123@smtp.example.com>"` |

**Auto-detection** (in backend `_is_smtp_thread_id()`):
- If thread_id starts with `<` and ends with `>` → SMTP thread
- Otherwise → Gmail thread

All tools that accept a `thread_id` parameter must support both formats. The backend handles routing internally based on this detection.

---

## 8. Service Route Gaps (New Routes Needed)

Many domain specs require new `/api/service/*` routes. The following is a consolidated list of domains where ALL tools need new service routes (0 existing service routes):

| Domain | Tools Needing New Service Routes | Notes |
|--------|----------------------------------|-------|
| Integrations | 18 tools (all) | Gmail accounts, SMTP CRUD, Google Sheets, Shopify, Instantly, Slack, YouTube, Brand lookup |
| Users & Team | 13 tools (all) | User settings, connected accounts, team management, campaign assignments, onboarding |
| Analytics | 1 tool | `cheerful_get_dashboard_analytics` |
| Workflows | 8 tools (all) | All workflow CRUD + execution history + tool discovery |
| Email (partial) | ~10 of 24 tools | Draft CRUD, email sending, dispatch scheduling, email signatures, bulk draft edit |
| Campaigns (partial) | ~20 of 31 tools | Recipients, senders, outbox, merge tags, enrichment |
| Creators (partial) | ~24 of 27 tools | Creator lists, creator posts, IC search, enrichment |
| Search & Discovery | 4 of 8 tools | Lookalike suggestion management (webapp Next.js routes only) |

**Total new service routes needed**: approximately 90+ new `/api/service/*` endpoints across all domains.

**Pattern for new service routes** (follow the existing 7 service routes as template):
```python
@router.get("/new-endpoint")
async def new_endpoint(
    user_id: str = Query(...),  # REQUIRED — enforces user scoping
    _: None = Depends(verify_service_api_key),
    db: AsyncSession = Depends(get_db),
) -> ResponseModel:
    ...
```
