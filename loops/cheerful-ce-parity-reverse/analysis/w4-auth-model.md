# w4-auth-model — Authentication Model Analysis

**Wave 4 aspect**: Full verification of the per-user authentication model against source code.
**Source files verified**:
- `context-engine/app/src_v2/mcp/context.py` — RequestContext, ToolContext dataclasses
- `context-engine/app/src_v2/mcp/tools/cheerful/tools.py` — _resolve_user_id(), tool handler signature
- `context-engine/app/src_v2/mcp/tools/cheerful/constants.py` — SLACK_USER_MAPPING
- `context-engine/app/src_v2/mcp/tools/cheerful/api.py` — API client, auth headers, timeout
- `context-engine/app/src_v2/mcp/registry.py` — ToolRegistry, @tool decorator, call_tool()
- `context-engine/app/src_v2/mcp/meta_tools.py` — create_meta_tools(), _execute_tool()
- `context-engine/app/src_v2/services/agent/sdk_tools.py` — create_sdk_tools(), meta-tool wrapping
- `context-engine/app/src_v2/services/execution.py` — execute_message() pipeline
- `context-engine/app/src_v2/entrypoints/slack/handlers.py` — handle_message(), RequestContext creation
- `backend/src/api/dependencies/auth.py` — AuthService, get_current_user(), get_optional_user()
- `backend/src/api/dependencies/service_auth.py` — verify_service_api_key()
- `backend/src/api/dependencies/impersonation.py` — dev-only impersonation
- `webapp/utils/supabase/middleware.ts` — Next.js middleware, session, protected routes

---

## Verified Facts

### Context Engine Side

#### RequestContext dataclass (context.py)
```python
@dataclass(frozen=True)
class RequestContext:
    slack_user_id: str = ""
    cheerful_user_id: str = ""
```
Both fields default to empty string. Frozen (immutable once created).

#### ToolContext cheerful fields (context.py)
```python
cheerful_api_url: str = ""
cheerful_api_key: str = ""
deploy_environment: str = "development"  # "production", "staging", or "development"
```
The `deploy_environment` field drives which SLACK_USER_MAPPING to use.

#### _resolve_user_id() (tools.py)
```python
def _resolve_user_id(request_context: RequestContext | None) -> str:
    if request_context and request_context.cheerful_user_id:
        return request_context.cheerful_user_id
    raise ToolError("Could not resolve Cheerful user. Ensure user mapping exists.")
```
Raises ToolError if context is None OR if cheerful_user_id is "" (empty string).

#### _creds() helper (tools.py)
```python
def _creds(ctx: ToolContext) -> tuple[str, str]:
    if not ctx.cheerful_api_url:
        raise ToolError("Cheerful API URL not configured (CHEERFUL_API_URL)")
    if not ctx.cheerful_api_key:
        raise ToolError("Cheerful API key not configured (CHEERFUL_API_KEY)")
    return ctx.cheerful_api_url, ctx.cheerful_api_key
```
Second pre-request failure mode: environment variables not set.

#### @tool decorator (registry.py)
Tools must have EXACTLY this signature:
```python
async def tool_name(
    tool_context: ToolContext,
    db_context: DatabaseContext | None,
    request_context: RequestContext | None,
    params: SomeInputModel,
) -> str:
```
The `params` type hint is introspected by `get_type_hints(fn)` to find the Pydantic input model.

#### ToolRegistry.call_tool() (registry.py)
```python
async def call_tool(self, name: str, params: dict[str, Any], request_context: "RequestContext | None" = None) -> str:
    tool_def = self._tools.get(name)
    if not tool_def:
        raise ToolNotFoundError(name, list(self._tools.keys()))
    validated = tool_def.input_model.model_validate(params)
    return await tool_def.handler(self._tool_context, self._db_context, request_context, validated)
```
The request_context is the 3rd positional argument to the handler.

#### SLACK_USER_MAPPING (constants.py)
Exact sizes:
- staging: **9 mappings** — keys: U099FQLC9PG, U06RVRANR7Z, U0743LW0DA8, U079CJSSNRL, U094DDEDZDM, U07G023P53Q, U0944JDPLRF, U0895KUSPKP, U09GMJT4WPK
- production: **8 mappings** — keys: U099FQLC9PG, U06RVRANR7Z, U0743LW0DA8, U094DDEDZDM, U07G023P53Q, U0944JDPLRF, U0895KUSPKP, U09GMJT4WPK
- **Difference**: U079CJSSNRL is in staging only (not in production). Same Slack user IDs map to different Cheerful UUIDs across environments (except U06RVRANR7Z and U0895KUSPKP which have the same UUID in both).

#### API client auth_headers() (api.py)
```python
def auth_headers(api_key: str) -> dict[str, str]:
    return {"X-Service-Api-Key": api_key}
```
The header name is `X-Service-Api-Key` (capital X, capital S, capital A, capital K — title case).

#### API client timeout (api.py)
```python
_TIMEOUT = 30
```
30-second timeout on ALL requests. No retry. httpx.AsyncClient() is created fresh for each call.

#### Full request_context propagation chain (verified)
```
handlers.py: handle_message()
│   user_mapping = get_slack_user_mapping(registry._tool_context.deploy_environment)
│   request_context = RequestContext(
│       slack_user_id=core_msg.author_id,
│       cheerful_user_id=user_mapping.get(core_msg.author_id, "")
│   )
│
└── services/execution.py: execute_message(request_context=request_context)
    │
    └── services/agent/sdk_tools.py: create_sdk_tools(registry, request_context)
        │
        └── mcp/meta_tools.py: create_meta_tools(registry, request_context)
            │   # request_context captured in closure
            │
            └── When Claude calls execute_tool:
                │
                └── _execute_tool(registry, name, params, request_context)
                    │
                    └── registry.call_tool(name, params, request_context)
                        │
                        └── tool_def.handler(tool_context, db_context, request_context, validated)
                            │
                            └── _resolve_user_id(request_context)
                                └── returns cheerful_user_id
```
8-step chain from Slack event to resolved user_id.

### Backend Side

#### verify_service_api_key() (service_auth.py)
```python
def verify_service_api_key(
    x_service_api_key: str = Header(alias="X-Service-Api-Key"),
) -> None:
    if not x_service_api_key or x_service_api_key != settings.SERVICE_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid service API key")
```
**CORRECTION**: The existing spec says "constant-time comparison". THIS IS WRONG. The actual code uses Python's `!=` operator (string equality, NOT hmac.compare_digest or similar). This is a minor security gap (timing attack on the service API key), but it is what the code does. All new service route specs must document the accurate behavior: simple string equality check.

Returns 401 (not 403) if the key is missing or invalid.

#### get_current_user() (auth.py)
- Extracts `Authorization: Bearer <jwt>` header
- Verifies JWT via AuthService
- Returns: `{"user_id": payload["sub"], "email": payload["email"], "role": payload["role"], "payload": payload}`
- Supports dev-only impersonation via `x-impersonate-user` header

#### get_optional_user() (auth.py)
- Same as get_current_user() but returns None instead of raising if no token provided
- Used by routes where auth is optional

#### Backend JWT verification (auth.py — AuthService)
Dual-algorithm support:
1. Reads `jwt.get_unverified_header(token)` to check `alg` field
2. If `alg == "ES256"`:
   - Uses JWKS endpoint: `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`
   - PyJWKClient with `lifespan=300` (5-minute key cache)
   - Decodes with `algorithms=["ES256"]`, `verify_aud=False`, `leeway=60` (60s clock skew)
3. Else (HS256, default for older Supabase/production):
   - Uses `SUPABASE_JWT_SECRET` env var
   - Decodes with `algorithms=["HS256"]`, `verify_aud=False`, `leeway=60`
4. Required claims: `sub` (returns 401 if missing), `role` (returns 401 if missing)
5. Error responses:
   - Expired token → 401 "Token has expired"
   - Invalid token → 401 "Invalid token: {reason}"
   - Other errors → 401 "Token verification failed"

#### Dev-only impersonation (impersonation.py)
- Trigger: `x-impersonate-user: email@example.com` header on any JWT-authenticated request
- Gate: `settings.DEPLOY_ENVIRONMENT == "development"` (FAILS in staging/production → 403)
- Lookup: `user_gmail_account WHERE gmail_email = email AND is_active = true`
- If not found: 404 "Gmail account not found: {email}"
- Returns impersonated user dict with `is_impersonated: true` and `real_user_id`
- All actions logged via structlog

### Webapp Side

#### middleware.ts — protected routes
```
const protectedRoutes = ["/mail", "/settings", "/dashboard", "/campaigns"];
```
Plus separately:
```
if (!user && isOnboardingRoute) → redirect to /sign-in
if (!user && pathname === "/") → redirect to /sign-in
```
Full list of routes requiring authentication:
- `/mail` and all sub-paths
- `/settings` and all sub-paths
- `/dashboard` and all sub-paths
- `/campaigns` and all sub-paths
- `/onboarding` and all sub-paths
- `/` (root page — redirect if not logged in)

#### middleware.ts — user identity forwarding
When user is authenticated, middleware sets two request headers for downstream Next.js API routes:
- `x-cheerful-user: {user.email}` — user's email address
- `x-user-logged-in: 1` — presence flag

#### middleware.ts — onboarding logic
- Checks `user_onboarding.onboarding_completed` from Supabase DB
- Caches result in `onboarding_completed` cookie (1-year expiry)
- If completed: redirects from onboarding to `/mail`
- If not completed: redirects from `/`, `/sign-in`, `/sign-up` to `/onboarding`
- Exception: `/onboarding/connect-email` is always accessible even if onboarding completed

#### middleware.ts — Supabase client setup
- Uses `@supabase/ssr` createServerClient
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars
- Cookies-based session (reads from request, writes to response)
- Auth check: `supabase.auth.getUser()` (validates session with Supabase API)

---

## Corrections Needed in shared-conventions.md

1. **Section 1.3**: Remove "Comparison is constant-time (no timing attacks)" — replace with "Comparison is simple string equality (`!=`). Not constant-time."
2. **Section 1.2**: Expand identity chain to show the full 8-step chain including meta_tools.py and sdk_tools.py intermediaries
3. **New Section 1.6**: Webapp authentication details (middleware, protected routes, headers, onboarding)
4. **New Section 1.7**: Backend JWT verification details (dual-algorithm, JWKS, leeway)
5. **New Section 1.8**: Dev-only impersonation system
6. **Section 1.3**: Add `get_optional_user()` note
7. **Section 1.3**: Add SLACK_USER_MAPPING exact sizes
8. **Section 1.3**: Add `ToolContext.deploy_environment` detail
9. **Section 1.3**: Add `_creds()` helper documentation

---

## Summary

The auth model documented in shared-conventions.md Section 1 is **mostly accurate** but missing:
- The full 8-step request_context pipeline (shows 5 steps, misses meta_tools/sdk_tools)
- Webapp middleware details (protected routes, header forwarding)
- Backend JWT dual-algorithm details
- Dev-only impersonation
- SLACK_USER_MAPPING exact sizes and differences between environments
- ToolContext.deploy_environment field purpose

And has **one correction**:
- service_auth.py does NOT use constant-time comparison — it uses simple Python `!=`
