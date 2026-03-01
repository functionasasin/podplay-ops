# Shared Conventions — Cheerful Context Engine

**Spec file**: `specs/shared-conventions.md`
**Wave 4 status**: In progress — w4-shared-schemas ✓, w4-auth-model ✓, w4-error-conventions ✓

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
   - 2.1 [Error Response Formats](#21-error-response-formats) — 5 formats (ToolError, FastAPI 422, business error, Pydantic ValidationError, ToolNotFoundError)
   - 2.2 [Error Tiers and Retry Behavior](#22-error-tiers-and-retry-behavior) — complete table with all tiers
   - 2.3 [Error Propagation Chain](#23-error-propagation-chain) — 8-step path from tool to Claude
   - 2.4 [Two Categories of Tools](#24-two-categories-of-tools-error-behavior-differs) — backend-proxied vs CE-native
   - 2.5 [Tool Handler Error Pattern](#25-tool-handler-error-pattern-standard-template) — required try/except pattern
   - 2.6 [API Client Error Pattern](#26-api-client-error-pattern-standard-template) — api.py standard pattern
   - 2.7 [Common Error Messages by Domain](#27-common-error-messages-by-domain) — exact messages from source
   - 2.8 [Retry Logic](#28-retry-logic) — decision matrix and rules
   - 2.9 [Slack Error Surfacing Guide](#29-slack-error-surfacing-guide) — natural language translation
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

### 2.1 Error Response Formats

There are **four distinct error formats** that tools produce. The format depends on where in the pipeline the error originates.

---

#### Format A: `ToolError` — Pre-request or API-layer failure (most common)

`ToolError` is a plain Python `Exception` subclass defined in `src_v2/mcp/registry.py`. It carries a single string message and is the standard error type for all user-facing errors from CE tools.

**Source**: Raised by `tools.py` helper functions, `api.py` API client, or tool handler catch-all.

**What Claude sees** (as error tool result content):
```
<error message string>
```

The message is a raw string — no JSON, no structure. Examples:
- `"Could not resolve Cheerful user. Ensure user mapping exists."`
- `"Cheerful API URL not configured (CHEERFUL_API_URL)"`
- `"Thread 'abc123' not found"`
- `"Failed to list campaigns (500): Internal server error"`
- `"Email search failed (422): [{\"loc\":[\"query\",\"limit\"],\"msg\":\"ensure this value...\"}]"`

---

#### Format B: FastAPI business logic error — surfaced inside ToolError message

When the backend returns a 400, 401, 403, 404, or 409, the `api.py` client reads the response body and embeds it in the ToolError message. The underlying FastAPI error format is:

```json
{
  "detail": "<error message string>"
}
```

The ToolError wraps this as: `"Operation failed (404): {\"detail\": \"Campaign not found\"}"`

The `resp.text[:500]` truncation applies — so very long backend error bodies are cut to 500 characters.

---

#### Format C: FastAPI 422 Pydantic validation error — surfaced inside ToolError message

When the backend returns 422 (Pydantic validation failure on query params), the response body has a list of error objects:

```json
{
  "detail": [
    {
      "loc": ["query", "field_name"],
      "msg": "<human readable message>",
      "type": "<pydantic error type>"
    }
  ]
}
```

Common `type` values from backend validation:
- `"type_error.uuid"` — field expected UUID format
- `"value_error.number.not_le"` — number exceeds maximum
- `"value_error.number.not_ge"` — number below minimum
- `"value_error.missing"` — required field not provided
- `"value_error"` — general value validation failure

This entire JSON blob is truncated to 500 chars and embedded in the ToolError message as `"Operation (422): {full 422 body truncated to 500 chars}"`.

---

#### Format D: Pydantic `ValidationError` from registry parameter validation

When Claude passes parameters that fail the Pydantic `BaseModel` schema for a tool's `params` argument, `registry.py`'s `model_validate(params)` raises a Pydantic `ValidationError`. This is **not** a `ToolError`. It propagates directly to the `claude_agent_sdk`, which returns it as an error tool result.

**Format** (verbose Pydantic error repr):
```
1 validation error for ListThreadsInput
limit
  Input should be less than or equal to 100 [type=less_than_equal, input_value=200, input_url=...]
```

This can be multi-line and verbose. The Claude agent sees this as the raw Pydantic error and should interpret it as: "a parameter I passed was invalid — fix the value."

This error type occurs at the CE registry layer, before any backend call is made.

---

#### Format E: `ToolNotFoundError` from registry dispatch

When `execute_tool` is called with a tool name that doesn't exist in the registry, `registry.py` raises `ToolNotFoundError(name, list(self._tools.keys()))`. Message format:

```
Tool '{name}' not found. Available: ['cheerful_list_campaigns', 'cheerful_search_emails', ...]
```

This should never happen in normal operation (Claude discovers tools via `discover_tools` first), but can occur if the tool registry is incomplete or the agent tries a non-existent tool name.

---

### 2.2 Error Tiers and Retry Behavior

| Tier | Origin | ToolError message format | Retry? | Root cause action |
|------|--------|--------------------------|--------|------------------|
| **User not resolved** | `_resolve_user_id()` | `"Could not resolve Cheerful user. Ensure user mapping exists."` | Never | Add Slack user ID to `SLACK_USER_MAPPING` in `constants.py` |
| **Config missing** | `_creds()` | `"Cheerful API URL not configured (CHEERFUL_API_URL)"` or `"...API_KEY"` | Never | Fix deployment environment variables |
| **Pre-call validation** | `api.py` before HTTP | `"Either query or thread_id is required for similarity search"` | No | Fix tool call parameters |
| **Schema validation** | `registry.model_validate` | Pydantic `ValidationError` (Format D above) | No | Fix parameter type/value |
| **401 Unauthorized** | Backend auth check | `"Operation (401): {\"detail\":\"Invalid service API key\"}"` | Never | Fix CHEERFUL_API_KEY env var |
| **400 Bad Request** | Backend business logic | `"Operation (400): {\"detail\":\"<message>\"}"` | No — client error | Fix parameters; message usually explains the issue |
| **403 Forbidden** | Backend permission check | `"Operation (403): {\"detail\":\"<message>\"}"` | No — permission issue | User needs access (campaign ownership or assignment) |
| **404 Not Found** | Backend: resource missing | `"Operation (404): {\"detail\":\"<message>\"}"` OR special-cased `"Thread '{id}' not found"` | No — wrong ID | Verify the UUID is correct and user has access |
| **409 Conflict** | Backend: constraint violation | `"Operation (409): {\"detail\":\"<message>\"}"` | No — duplicate | Resource already exists |
| **422 Validation** | Backend Pydantic validation | `"Operation (422): {\"detail\":[{\"loc\":[...],\"msg\":\"...\"}]}"` | No — fix params | Fix parameter type/value |
| **429 Rate Limited** | External API (Apify, IC) | `"Operation (429): {\"detail\":\"Service rate limit exceeded. Please try again later.\"}"` | Yes — wait 5s | Retry once; if still 429, report to user |
| **500 Server Error** | Backend unhandled exception | `"Operation (500): {\"detail\":\"<message>\"}"` | Yes — once | Infrastructure issue; report if persists |
| **Timeout** | httpx after 30s | `"Failed to {op}: ReadTimeout"` (wrapped by handler) | Yes — once | Long-running operation; try again |
| **Connection Error** | httpx network failure | `"Failed to {op}: ConnectError"` (wrapped by handler) | Yes — once | Network issue; try again |
| **Tool not found** | `registry.call_tool()` | `ToolNotFoundError: "Tool '{name}' not found. Available: [...]"` | No | Bug; use `discover_tools` to find correct name |

---

### 2.3 Error Propagation Chain

**CRITICAL**: `ToolError` is NOT caught anywhere in the CE pipeline before reaching the Claude Agent SDK. The full propagation:

```
Step 1: Tool handler raises ToolError
        (in src_v2/mcp/tools/cheerful/tools.py)
        ↓
Step 2: registry.call_tool() — NO try/except — propagates
        (in src_v2/mcp/registry.py:108)
        ↓
Step 3: meta_tools._execute_tool() — NO try/except — propagates
        (in src_v2/mcp/meta_tools.py:54)
        ↓
Step 4: meta_tools closure execute_fn() — NO try/except — propagates
        (in src_v2/mcp/meta_tools.py:76)
        ↓
Step 5: sdk_tools.execute_tool_sdk() — NO try/except — propagates
        (in src_v2/services/agent/sdk_tools.py:101)
        ↓
Step 6: claude_agent_sdk (create_sdk_mcp_server) — CATCHES exception
        Returns error content block: {"is_error": true, "content": "<ToolError.args[0]>"}
        ↓
Step 7: Claude Agent receives error tool result
        Claude sees: the raw ToolError message string
        ↓
Step 8: Claude decides how to respond in Slack
```

**What this means for implementors**:
- Every tool must follow the `try/except ToolError: raise; except Exception as e: raise ToolError(f"...: {e}") from e` pattern
- Unhandled Python exceptions (AttributeError, KeyError, etc.) from anywhere in the tool handler WILL be wrapped by the catch-all `except Exception`
- Network errors (httpx ReadTimeout, ConnectError) are caught by the tool handler's catch-all

**Note on handlers.py**: The outer `handle_message()` function in `entrypoints/slack/handlers.py` does NOT catch exceptions from `execute_message()`. If `execute_message` raises an unhandled exception, the bot silently fails without responding to the Slack message. This is a known limitation.

---

### 2.4 Two Categories of Tools (Error Behavior Differs)

#### Category A: Backend-Proxied Tools

Tools that call `/api/service/*` endpoints via `api.py`. Error behavior:

1. `api.py` makes HTTP request with 30s timeout
2. Non-200 response → `ToolError(f"<op> ({status_code}): {resp.text[:500]}")`
3. Special-case 404s: `get_thread` and `get_campaign_creator` return descriptive `ToolError` without status code
4. Timeout → httpx raises exception → caught by handler's `except Exception` → wrapped as `ToolError(f"Failed to {op}: ReadTimeout")`

All domain tools (campaigns, email, creators, integrations, users-team, analytics, workflows, search) are Category A.

#### Category B: CE-Native Tools

Tools that perform all logic within the CE process, making no calls to the Cheerful backend:

| Tool | CE-internal dependencies | Error patterns |
|------|------------------------|---------------|
| `cheerful_improve_email` | Internal LLM call via Claude Anthropic API | LLM errors, content policy errors |
| `cheerful_summarize_thread` | Internal `ThreadSummarizer` RAG service | RAG errors, embedding failures |

For Category B tools:
- No HTTP status codes in error messages
- Errors are CE-internal exceptions wrapped as `ToolError`
- No 403/404 from backend (access is pre-validated by the CE)

---

### 2.5 Tool Handler Error Pattern (Standard Template)

Every tool MUST implement this error handling pattern (verified against existing 7 tools in `tools.py`):

```python
async def cheerful_some_tool(
    tool_context: ToolContext,
    db_context: DatabaseContext | None,
    request_context: RequestContext | None,
    params: SomeInput,
) -> str:
    try:
        # 1. Validate credentials and user identity (pre-request)
        base_url, api_key = _creds(tool_context)     # raises ToolError if config missing
        user_id = _resolve_user_id(request_context)  # raises ToolError if user not mapped

        # 2. Call API client (may raise ToolError for HTTP errors)
        result = await api.some_operation(base_url, api_key, user_id, ...)

        # 3. Format and return
        return _fmt_result(result)

    except ToolError:
        raise  # Re-raise ToolErrors as-is (don't double-wrap)

    except Exception as e:
        # Catch-all: wrap any unexpected exception as ToolError
        raise ToolError(f"Failed to {operation_description}: {e}") from e
```

**Rule**: `except ToolError: raise` MUST come BEFORE `except Exception as e`. Otherwise, ToolErrors would be caught by the catch-all and their messages double-wrapped.

---

### 2.6 API Client Error Pattern (Standard Template)

Every function in `api.py` MUST follow this pattern:

```python
async def some_operation(
    base_url: str,
    api_key: str,
    user_id: str,
    # ... other params
) -> dict[str, Any]:
    url = build_url(base_url, "/api/service/some/path")
    params: dict[str, Any] = {"user_id": user_id}

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            url,
            headers=auth_headers(api_key),
            params=params,
            timeout=_TIMEOUT,  # Always 30 seconds
        )
        # Optional: special-case 404
        if resp.status_code == 404:
            raise ToolError(f"Resource '{id}' not found")
        # Generic non-200 handler
        if resp.status_code != 200:
            raise ToolError(f"Operation description ({resp.status_code}): {resp.text[:500]}")
        return resp.json()
```

**Rules**:
- Always use `timeout=_TIMEOUT` (30 seconds)
- Always use `auth_headers(api_key)` — produces `{"X-Service-Api-Key": api_key}`
- Always send `user_id` as a query param
- Body truncation is `[:500]` to prevent oversized error messages
- 404s MAY be special-cased for better UX; all others use the generic format

---

### 2.7 Common Error Messages by Domain

The following are the **exact error messages** from the backend source code, organized by domain. These appear inside ToolError messages after the status code prefix.

#### Campaign Errors

| Condition | HTTP Status | Detail message |
|-----------|------------|----------------|
| Draft campaign not found | 404 | `"Draft campaign not found: {campaign_id}"` |
| Not authorized to launch | 403 | `"Not authorized to launch this campaign"` |
| Campaign not a draft | 400 | `"Campaign is not a draft"` |
| No valid senders | 400 | `"No valid sender accounts found. Check that the email addresses exist and are active."` |
| No recipients (non-creator campaign) | 400 | `"Non-creator, non-external campaigns require at least one recipient."` |
| Invalid campaign data (Pydantic) | 422 | `"Invalid campaign data: {pydantic error string}"` |
| Personalization template failure | 400 | `"Personalization failed: {error}. Check that all template placeholders have matching recipient fields."` |
| Product not found | 404 | `"Product not found: {product_id}"` |
| Not authorized for product | 403 | `"Not authorized to use this product"` |
| Sender account not found | 400 | `"Sender account not found or inactive: {email}"` |
| Not authorized for sender | 403 | `"Not authorized to use sender account: {email}"` |
| CSV missing email column | 400 | `"CSV must contain an 'email' column. Found columns: {col1}, {col2}, ..."` |
| Invalid image type | 400 | `"Invalid image type '{content_type}'. Allowed: jpeg, jpg, png, gif, webp"` |
| Image upload failed | 500 | `"Failed to upload campaign image: {error}"` |
| Email signature too long | 400 | `"Email signature exceeds maximum length of 10,000 characters"` |

#### Email / Thread Errors

| Condition | HTTP Status | Detail message |
|-----------|------------|----------------|
| Thread not found | 404 | `"Thread '{gmail_thread_id}' not found"` (special-cased — no status prefix) |
| Draft version mismatch (conflict) | 409 | `"State ID doesn't match thread"` |
| Draft not found | 404 | `"Draft not found"` |
| Email dispatch validation | 422 | `"Either gmail_account_id or smtp_account_id must be provided, but not both"` |
| Dispatch time validation | 422 | `"dispatch_at must be in the future"` |
| Team member send restriction | 403 | `"Team members cannot send emails for campaigns they don't own"` |

#### Creator Errors

| Condition | HTTP Status | Detail message |
|-----------|------------|----------------|
| Creator not found | 404 | `"Creator '{creator_id}' not found in campaign '{campaign_id}'"` (special-cased) |
| Creator not in campaign | 400 | `"Creator {creator_id} is not in campaign {campaign_id}"` |
| Duplicate creator email | 409 | `"Creator with email {email} already exists in campaign"` |
| Enrichment not found | 404 | `"Enrichment attempt not found"` |
| Creator list not found | 404 | `"Creator list not found"` |
| Not authorized to add to campaign | 403 | `"Not authorized to add creators to this campaign"` |

#### Integration Errors

| Condition | HTTP Status | Detail message |
|-----------|------------|----------------|
| Gmail account not connected | 400 | `"No Gmail account connected"` |
| SMTP account not found | 404 | `"SMTP account not found"` |
| SMTP duplicate email | 409 | `"SMTP account with email {email} already exists"` |
| IMAP verification failed | 400 | `"Failed to verify IMAP connection: {error}"` |
| Sheet not found | 404 | `"Sheet not found or access denied"` |
| Invalid Shopify key | 400 | `"Invalid GoAffPro API key"` |
| Instantly not connected | 400 | `"Instantly not connected. Please connect via the webapp."` |

#### Team / User Errors

| Condition | HTTP Status | Detail message |
|-----------|------------|----------------|
| Not a team member | 403 | `"Not a member of this team"` |
| Already a team member | 400 | `"User is already a member of this team"` |
| Member not found | 404 | `"Member not found"` |
| Supabase invite error | 400 | `"Could not invite user: {supabase_error_message}"` |
| Campaign doesn't belong to team | 400 | `"Campaign does not belong to this team's owner"` |
| Creator already assigned | 400 | `"Creator is already assigned to this campaign"` (campaign assignment) |
| Invalid service API key | 401 | `"Invalid service API key"` |

#### Workflow Errors

| Condition | HTTP Status | Detail message |
|-----------|------------|----------------|
| Workflow not found | 404 | `"Workflow not found"` |
| Workflow already exists | 409 | `"Workflow with this ID already exists"` |
| Execution not found | 404 | `"Execution not found"` |
| Tool not found (registry) | 404 | `"Tool {slug} not found"` |
| Invalid workflow config | 422 | `"Invalid workflow configuration: {pydantic error}"` |

#### Search / Discovery Errors

| Condition | HTTP Status | Detail message |
|-----------|------------|----------------|
| IC API error | 400/500 | `"Influencer Club API error: {error}"` |
| Apify rate limited | 429 | `"Service rate limit exceeded. Please try again later."` |
| YouTube rate limited | 429 | `"Service rate limit exceeded. Please try again later."` |
| IC profile not found | 404 | `"Profile not found for handle: {handle}"` |
| Similarity search: no query or thread | Pre-call | `"Either query or thread_id is required for similarity search"` |

---

### 2.8 Retry Logic

Tools have **NO automatic retry logic**. All errors are raised immediately on first failure. The Claude agent is responsible for deciding whether to retry.

#### Agent Retry Decision Matrix

| Error type | Should retry? | Wait before retry | Max retries | Agent action if still failing |
|-----------|--------------|-------------------|-------------|-------------------------------|
| 5xx Server Error | Yes | 0s (immediate) | 1 | Report: "The Cheerful backend returned a server error. Please try again in a moment." |
| Timeout (ReadTimeout) | Yes | 0s (immediate) | 1 | Report: "The request timed out after 30 seconds. This operation may be too slow to run from Slack." |
| Connection error | Yes | 0s (immediate) | 1 | Report: "Could not connect to Cheerful backend. Check if the service is running." |
| 429 Rate limited | Yes | 5 seconds | 1 | Report: "The external service is rate-limited. Please try again in a few minutes." |
| 400 Bad Request | No | — | 0 | Parse detail message; fix parameters or report the business logic error to user |
| 401 Unauthorized | No | — | 0 | Report: "Authentication failed. The service API key may be misconfigured." |
| 403 Forbidden | No | — | 0 | Report: "You don't have permission to perform this action. The campaign owner may need to grant you access." |
| 404 Not Found | No | — | 0 | Report: "The resource was not found. Verify the ID is correct." |
| 409 Conflict | No | — | 0 | Report the specific conflict (e.g., "This creator is already in the campaign.") |
| 422 Validation | No | — | 0 | Fix the parameter that failed validation |
| User not resolved | No | — | 0 | Report: "Your Slack account is not linked to a Cheerful account. Contact the workspace admin." |
| Config missing | No | — | 0 | Report: "The Cheerful integration is not configured. Contact the workspace admin." |
| Pydantic ValidationError (Format D) | No | — | 0 | Fix the parameter type/value |
| Tool not found | No | — | 0 | Use `discover_tools` to find the correct tool name |

#### Agent Retry Rules
- Never retry the same parameters that caused a 4xx error — the same parameters will produce the same error
- For 5xx and timeouts: retry exactly **once**, immediately, with identical parameters
- For 429: wait **5 seconds** before retrying once
- Never retry more than once automatically — surface the error to the user for manual resolution
- Do NOT retry if the error message says the user has a permission issue (403) — retrying won't help

---

### 2.9 Slack Error Surfacing Guide

When the Claude agent receives an error from a tool, it should translate it into natural language for the Slack user. Rules:

1. **Never show raw ToolError strings** like `"Failed to list campaigns (500): Internal server error"` — this is confusing to non-technical users
2. **Parse the error** to understand the category (auth, permission, not-found, validation, server)
3. **Translate to plain English** with actionable guidance when possible
4. **Include the key detail** from the error message — don't lose the specific campaign ID, email, or constraint that failed

#### Error Translation Examples

| Raw ToolError message | Slack-formatted response |
|-----------------------|--------------------------|
| `"Could not resolve Cheerful user. Ensure user mapping exists."` | "Your Slack account isn't linked to Cheerful. Ask your admin to add you to the Cheerful user mapping." |
| `"Thread 'abc123' not found"` | "I couldn't find that email thread. The thread ID may be incorrect or the thread may have been deleted." |
| `"Failed to list campaigns (401): {\"detail\":\"Invalid service API key\"}"` | "The Cheerful integration isn't configured correctly. Please contact your workspace admin." |
| `"Failed to launch campaign (400): {\"detail\":\"No valid sender accounts found...\"}"` | "The campaign can't be launched yet — no sender Gmail accounts are configured. Add sender accounts in the campaign settings first." |
| `"Failed to launch campaign (403): {\"detail\":\"Not authorized to launch this campaign\"}"` | "Only the campaign owner can launch campaigns. Ask the owner to launch it, or have them assign you." |
| `"Failed to send email (422): {\"detail\":\"dispatch_at must be in the future\"}"` | "The scheduled send time you specified has already passed. Please choose a future time." |
| `"Creator search failed: ReadTimeout"` | "The search timed out after 30 seconds. Try a more specific search query, or try again in a moment." |
| `"Failed to list campaigns (429): {\"detail\":\"Service rate limited...\"}"` | "The discovery service is temporarily rate-limited. I'll try again in a moment." (then retry after 5s) |

#### When to Ask for Clarification

If a 400 error message is ambiguous (e.g., `"Personalization failed: {error}. Check template placeholders..."`), the agent should:
1. Quote the specific error detail to the user
2. Ask: "Which creator fields are you trying to reference in the email template? I can help you check that the placeholders match."

#### Permission Errors (403) — Special Handling

403 errors require explaining the permission model to the user:
- **Owner-only operations** (launch, integrations, team management): "This action requires campaign ownership. [Tool X] can only be performed by the person who created the campaign."
- **Assignment-required operations** (viewing campaign data): "You need to be assigned to this campaign to access it. Ask the campaign owner to assign you."
- **User-scoped operations** (profile, settings): Should not produce 403 unless there's a bug

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
