# w4-error-conventions — Analysis Notes

## Source Files Verified

| File | Lines Read | Key Findings |
|------|-----------|-------------|
| `src_v2/mcp/registry.py` | 154 | ToolError definition, ToolNotFoundError, model_validate, call_tool dispatch |
| `src_v2/mcp/tools/cheerful/api.py` | 217 | Timeout=30s, auth headers, per-endpoint error handling |
| `src_v2/mcp/tools/cheerful/tools.py` | 562 | Pre-request checks, try/except pattern, error wrapping |
| `src_v2/mcp/meta_tools.py` | 79 | No try/catch — propagates all exceptions |
| `src_v2/services/agent/sdk_tools.py` | 125 | execute_tool_sdk — no try/catch, propagates to claude_agent_sdk |
| `src_v2/services/execution.py` | 153 | Orchestration, no error handling around execute_message |
| `src_v2/entrypoints/slack/handlers.py` | 256 | handle_message — no error catch around execute_message |
| `src_v2/services/agent/claude_agent.py` | 266 | ClaudeSDKClient.query() — errors from SDK |
| `backend/src/api/dependencies/service_auth.py` | 21 | 401 for bad API key, `!=` comparison |
| `backend/src/api/route/campaign_launch.py` | Sampled | 400/403/404/422/500 patterns |
| `backend/src/api/route/creator_search.py` | Line 507 | 429 rate limit from IC API |
| `backend/src/api/route/youtube.py` | Lines 238-248 | 429 from Apify rate limit |

## Key Findings

### Error Types at Each Layer

**Layer 1: Pre-request Checks (in tools.py helper functions)**
- `_creds(tool_context)` → ToolError if CHEERFUL_API_URL or CHEERFUL_API_KEY not set
  - `"Cheerful API URL not configured (CHEERFUL_API_URL)"`
  - `"Cheerful API key not configured (CHEERFUL_API_KEY)"`
- `_resolve_user_id(request_context)` → ToolError if user not in mapping
  - `"Could not resolve Cheerful user. Ensure user mapping exists."`
  - Triggered when: Slack user not in SLACK_USER_MAPPING, or deploy_environment="development"

**Layer 2: Pre-call Validation (in api.py)**
- `find_similar`: `ToolError("Either query or thread_id is required for similarity search")`
- This is the only example of a pre-call API-layer validation ToolError

**Layer 3: HTTP Response Errors (in api.py)**
- Status-specific handling:
  - 404 special-cased in `get_thread`: `ToolError(f"Thread '{gmail_thread_id}' not found")`
  - 404 special-cased in `get_campaign_creator`: `ToolError(f"Creator '{creator_id}' not found in campaign '{campaign_id}'")`
  - All other non-200 (including 404 in other endpoints): `ToolError(f"{operation_desc} ({status_code}): {resp.text[:500]}")`
- Response body is truncated at 500 chars to avoid oversized error messages

**Layer 4: Tool Handler Wrapping (in tools.py)**
- Pattern: `except Exception as e: raise ToolError(f"Failed to {op}: {e}") from e`
- This catches: httpx errors (timeout, connection refused, DNS), unexpected exceptions
- ToolError is re-raised directly (not wrapped): `except ToolError: raise`
- Examples of wrapped messages:
  - `"Failed to list campaigns: ReadTimeout"`
  - `"Email search failed: Connect call failed"`
  - `"Failed to list creators: <exception message>"`

**Layer 5: Registry Validation (in registry.py)**
- `model_validate(params)` raises Pydantic `ValidationError` if params are invalid
- This is NOT caught before reaching the SDK
- The Claude agent SDK converts this to an error content block
- Pydantic ValidationError message includes field name, type, and constraint violated

**Layer 6: Registry Dispatch (in registry.py)**
- `ToolNotFoundError` if tool name unknown (subclass of KeyError)
- Message: `"Tool '{name}' not found. Available: {list}"`
- This is NOT caught before reaching the SDK

### Error Propagation Chain

```
Tool handler raises ToolError
         │
         ▼ registry.py call_tool() — no try/catch
         │
         ▼ meta_tools.py _execute_tool() — no try/catch
         │
         ▼ sdk_tools.py execute_tool_sdk() — no try/catch
         │
         ▼ claude_agent_sdk create_sdk_mcp_server — catches exception
         │   - Returns error content block to Claude: {"is_error": true, "content": "<message>"}
         │
         ▼ Claude agent sees error result
         │   - Decides whether to retry, ask user, or report error
         │
         ▼ Claude responds in Slack thread
```

**CRITICAL**: When ToolError is raised, it propagates all the way to the Claude Agent SDK boundary. The SDK converts it to an error tool result. The raw ToolError message is what Claude sees.

**For Pydantic ValidationError / ToolNotFoundError**: Same propagation path. SDK converts to error tool result. The error message may be verbose (Pydantic format).

### Backend Error Formats

**401 Unauthorized (bad API key)**:
```json
{"detail": "Invalid service API key"}
```
Status: 401. Triggered by wrong/missing X-Service-Api-Key header.
CE error: `ToolError(f"Operation ({401}): {resp.text[:500]}")` — wraps in generic format.

**400 Bad Request (business logic)**:
```json
{"detail": "<message string>"}
```
Examples from code:
- `"CSV must contain an 'email' column. Found columns: col1, col2, col3"`
- `"Invalid campaign data: <pydantic error>"`
- `"Sender account not found or inactive: <email>"`
- `"Not authorized to use this product"`
- `"No valid sender accounts found. Check that the email addresses exist and are active."`
- `"Non-creator, non-external campaigns require at least one recipient."`
- `"Email signature exceeds maximum length of 10,000 characters"`
- `"Personalization failed: <e>. Check that all template placeholders have matching recipient fields."`
- `"Campaign already exists"` (SMTP bulk import)
- `"Member not found"` (team management)
- `"Not a member of this team"`
- `"Campaign does not belong to this team's owner"`

**403 Forbidden (permission)**:
```json
{"detail": "<message string>"}
```
Examples:
- `"Not authorized to launch this campaign"`
- `"Not authorized to use sender account: <email>"`
- `"Access denied to campaign {id}"`
- `"Not authorized to use this product"`

**404 Not Found**:
```json
{"detail": "<message string>"}
```
Examples:
- `"Product not found: {id}"`
- `"Draft campaign not found: {id}"`

**409 Conflict**:
```json
{"detail": "<message string>"}
```
Rare — seen in team member duplicate prevention.

**422 Unprocessable Entity** (Pydantic query param validation):
```json
{
  "detail": [
    {
      "loc": ["query", "field_name"],
      "msg": "<human readable message>",
      "type": "<error type>"
    }
  ]
}
```
Examples:
- `{"loc": ["query", "campaign_id"], "msg": "value is not a valid uuid", "type": "type_error.uuid"}`
- `{"loc": ["query", "limit"], "msg": "ensure this value is less than or equal to 100", "type": "value_error.number.not_le"}`

**429 Too Many Requests (rate limit)** — only from specific endpoints:
```json
{"detail": "Service rate limit exceeded. Please try again later."}
```
Triggered by: YouTube lookalike (Apify rate limit), Influencer Club (IC API 429).

**500 Internal Server Error**:
```json
{"detail": "<message string>"}
```
General unhandled exception.

### Two Categories of Tools

**Category A: Backend-Proxied Tools** (call /api/service/* endpoints via api.py)
- All 7 existing tools
- All new domain tools
- Error flow: HTTP response → api.py → ToolError with status code + body

**Category B: CE-Native Tools** (no backend call, pure CE logic)
- `cheerful_improve_email` — uses CE ThreadSummarizer + LLM
- `cheerful_summarize_thread` — uses CE ThreadSummarizer
- Error flow: CE-internal exceptions → wrapped by handler → ToolError

### Rate Limiting Summary
- No rate limiting in the CE itself
- Backend has no application-level rate limiting for most endpoints
- 429 observed only in: YouTube lookalike search, IC creator search
- Slack updates rate-limited at 1.5s intervals (CE-internal, not API)
- httpx timeout is 30 seconds for all requests

### Missing Error Handling Identified
1. **handlers.py** does NOT catch exceptions from `execute_message` — an unhandled exception would silently fail (the bot would just not respond). This is a known limitation.
2. **Most api.py functions** don't special-case 403 — they fall through to the generic `f"op ({status_code}): {body[:500]}"` format. Only 404 gets special-casing in 2 functions.
3. **execute_tool_sdk** doesn't catch Pydantic ValidationError separately — it propagates as a non-ToolError exception.

## Corrections to Existing Spec (Section 2)

1. Section 2.3 says `service_auth.py` uses "constant-time comparison" — CORRECTION: it uses simple `!=` operator (verified in w4-auth-model analysis). This is a minor security issue but is the actual behavior.

2. Section 2.2 table: "401 Unauthorized" is missing — backend returns 401 (not 403) for invalid API key.

3. Section 2.3 example error format: `"{operation} ({status_code}): {response_body[:500]}"` — the prefix varies per function. Should note that body truncation is 500 chars.

4. Need to add Section 2.5: CE-native tools have no backend HTTP errors.

5. Need to add Section 2.6: Pydantic validation at registry layer (NOT ToolError, different format).

6. Need to add per-domain common error table.
