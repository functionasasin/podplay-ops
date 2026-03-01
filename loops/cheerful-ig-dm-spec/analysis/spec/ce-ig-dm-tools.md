# Spec: Context Engine — IG DM MCP Tools

**Aspect**: `spec-ce-ig-dm-tools`
**Wave**: 3 — Component Implementation Specs
**Date**: 2026-03-01
**Input files**:
- `analysis/spec/api-contracts.md` — service routes 14–17 (CE-facing backend endpoints)
- `analysis/audit/api-routes.md` — existing service route patterns
- Context engine codebase reads:
  - `app/src_v2/mcp/tools/cheerful/tools.py` — @tool decorator pattern, XML formatters
  - `app/src_v2/mcp/tools/cheerful/api.py` — httpx client pattern, auth headers
  - `app/src_v2/mcp/tools/cheerful/__init__.py` — export pattern
  - `app/src_v2/mcp/catalog.py` — ALL_TOOLS list, create_tool_registry
  - `app/src_v2/mcp/registry.py` — ToolDef, ToolRegistry, @tool decorator, ToolError
  - `app/src_v2/mcp/context.py` — ToolContext, DatabaseContext, RequestContext
  - `app/src_v2/mcp/tags.py` — Platform, Action StrEnums
  - `app/src_v2/core/xml.py` — tag(), wrap(), hint()
  - `app/src_v2/bootstrap/config.py` — CheerfulSettings, AppSettings

---

## Strategic Context

The context engine (Slack bot) is the **sole** interaction point for IG DM operations. There is no
webapp UI for IG DMs. All 8 tools defined here call the backend service API routes
(`/api/service/ig-dm/*`) using `X-Service-Api-Key` auth — the same mechanism as existing
`cheerful_search_emails`, `cheerful_get_thread`, etc.

Users interact with IG DMs entirely through Slack. The tools replace all webapp functionality
described in `analysis/audit/frontend-components.md`.

---

## Files

### New Files

| Action | Path |
|--------|------|
| CREATE | `apps/context-engine/app/src_v2/mcp/tools/cheerful/ig_dm_api.py` |
| CREATE | `apps/context-engine/app/src_v2/mcp/tools/cheerful/ig_dm_tools.py` |

### Modified Files

| Action | Path | What Changes |
|--------|------|-------------|
| MODIFY | `apps/context-engine/app/src_v2/mcp/tools/cheerful/__init__.py` | Export 8 new IG DM ToolDef instances |
| MODIFY | `apps/context-engine/app/src_v2/mcp/catalog.py` | Import and add 8 tools to ALL_TOOLS list under `# Cheerful IG DM (8)` |

**No other files change.** `ToolContext`, `ToolRegistry`, `RequestContext`, `AppSettings` require no
modification — `cheerful_api_url` and `cheerful_api_key` are already present.

---

## Architecture

```
Slack message
     │
     ▼
context-engine (Slack Bolt → ClaudeAgent → ToolRegistry)
     │
     ▼  cheerful_list_ig_dm_threads / cheerful_get_ig_dm_thread / etc.
     │
     ▼  httpx → X-Service-Api-Key
backend service routes
  GET  /api/service/ig-dm/threads/search
  GET  /api/service/ig-dm/threads/{id}
  GET  /api/service/ig-dm/accounts
  POST /api/service/ig-dm/threads/{id}/reply
     │
     ▼
Supabase + Temporal workflows
```

---

## 1. `ig_dm_api.py` — HTTP Client Layer

**File**: `apps/context-engine/app/src_v2/mcp/tools/cheerful/ig_dm_api.py`
**Parallel to**: `apps/context-engine/app/src_v2/mcp/tools/cheerful/api.py`

### Module docstring

```python
"""Cheerful backend API client — Instagram DM endpoints.

Thin HTTP layer for the Cheerful backend /api/service/ig-dm/* routes.
Raises ToolError for user-facing errors. All functions take credentials
as explicit parameters (no global state).
"""
```

### Imports

```python
from typing import Any

import httpx

from src_v2.mcp.registry import ToolError

_TIMEOUT = 30
```

### Helper functions

```python
def auth_headers(api_key: str) -> dict[str, str]:
    """Build X-Service-Api-Key authorization headers."""
    return {"X-Service-Api-Key": api_key}


def build_url(base_url: str, path: str) -> str:
    """Build Cheerful backend API URL."""
    return f"{base_url.rstrip('/')}{path}"
```

### `search_ig_dm_threads`

```python
async def search_ig_dm_threads(
    base_url: str,
    api_key: str,
    user_id: str,
    campaign_id: str | None = None,
    query: str | None = None,
    status: str | None = None,
    window_open: bool | None = None,
    limit: int = 20,
    offset: int = 0,
) -> dict[str, Any]:
    """Search IG DM threads for a user.

    Maps to: GET /api/service/ig-dm/threads/search
    Response shape: {"threads": [...], "total": int}
    Each thread item: see ServiceIgDmThreadSummary in spec-api-contracts.md §14
    """
```

**Error handling**:
- `status_code != 200`: raise `ToolError(f"DM thread search failed ({resp.status_code}): {resp.text[:500]}")`

### `get_ig_dm_thread`

```python
async def get_ig_dm_thread(
    base_url: str,
    api_key: str,
    user_id: str,
    ig_conversation_id: str,
) -> dict[str, Any]:
    """Fetch full DM thread with all messages, creator info, and draft.

    Maps to: GET /api/service/ig-dm/threads/{ig_conversation_id}
    Response shape: ServiceIgDmThreadDetailResponse (see spec-api-contracts.md §15)
    """
```

**Error handling**:
- `status_code == 404`: raise `ToolError(f"IG DM thread '{ig_conversation_id}' not found")`
- `status_code != 200`: raise `ToolError(f"Failed to get DM thread ({resp.status_code}): {resp.text[:500]}")`

### `list_ig_dm_accounts`

```python
async def list_ig_dm_accounts(
    base_url: str,
    api_key: str,
    user_id: str,
) -> list[dict[str, Any]]:
    """List connected Instagram accounts for a user.

    Maps to: GET /api/service/ig-dm/accounts
    Response shape: list of ServiceIgDmAccountItem (see spec-api-contracts.md §16)
    Each item: {id, ig_business_account_id, ig_username, is_active,
                webhook_subscribed, token_expires_at, created_at}
    """
```

**Error handling**:
- `status_code != 200`: raise `ToolError(f"Failed to list IG accounts ({resp.status_code}): {resp.text[:500]}")`

### `send_ig_dm_reply`

```python
async def send_ig_dm_reply(
    base_url: str,
    api_key: str,
    user_id: str,
    ig_conversation_id: str,
    message_text: str,
    draft_id: str | None = None,
) -> dict[str, Any]:
    """Send a DM reply via the backend (which calls Meta API).

    Maps to: POST /api/service/ig-dm/threads/{ig_conversation_id}/reply
    Request body: {"message_text": str, "draft_id": str | None, "user_id": str}
    Response shape: {"mid": str, "sent_at": str, "window_expires_at": str | None}
    """
```

**Error handling**:
- `status_code == 400`: raise `ToolError(f"DM send rejected: {resp.json().get('detail', resp.text[:200])}")`
  - Backend returns 400 with `detail: "24h window closed"` when window expired
- `status_code == 422`: raise `ToolError(f"Invalid DM content: {resp.text[:200]}")`
- `status_code != 200`: raise `ToolError(f"Failed to send DM reply ({resp.status_code}): {resp.text[:500]}")`

### `get_meta_oauth_url`

```python
async def get_meta_oauth_url(
    base_url: str,
    api_key: str,
    user_id: str,
) -> dict[str, Any]:
    """Get the Meta OAuth authorization URL for connecting an IG account.

    Maps to: GET /api/service/ig-dm/oauth-url
    Response shape: {"oauth_url": str, "state": str}
    The state token is stored server-side; tool polls /api/service/ig-dm/accounts
    to detect when the OAuth flow completes.
    """
```

**Note**: This is an additional service route beyond the 4 specified in `spec-api-contracts.md`.
Add to `service.py`:
```
GET /api/service/ig-dm/oauth-url  → returns {oauth_url: str, state: str}
```

---

## 2. `ig_dm_tools.py` — Tool Definitions

**File**: `apps/context-engine/app/src_v2/mcp/tools/cheerful/ig_dm_tools.py`
**Parallel to**: `apps/context-engine/app/src_v2/mcp/tools/cheerful/tools.py`

### Module docstring

```python
"""Cheerful Instagram DM tools.

Tools for managing Instagram DM conversations via the Cheerful backend API.
Supports listing/searching DM threads, reading full conversations, sending
replies, managing IG accounts, and approving AI-generated draft replies.

Primary interaction point: all IG DM operations are via Slack (no webapp UI).
"""
```

### Imports

```python
import asyncio
from typing import Any

from pydantic import BaseModel, Field

from src_v2.core.xml import hint, tag, wrap
from src_v2.mcp.context import DatabaseContext, RequestContext, ToolContext
from src_v2.mcp.registry import ToolError, tool
from src_v2.mcp.tags import Action, Platform
from src_v2.mcp.tools.cheerful import ig_dm_api as api
```

---

### Input Models

#### `ListIgDmThreadsInput`

```python
class ListIgDmThreadsInput(BaseModel):
    campaign_id: str | None = Field(
        default=None,
        description="Filter by campaign UUID. Use cheerful_list_campaigns to get IDs.",
    )
    status: str | None = Field(
        default=None,
        description="Filter by thread status: PENDING, REPLIED, UNMATCHED, ARCHIVED",
    )
    window_open: bool | None = Field(
        default=None,
        description="If True, only threads with open 24h reply window. If False, only expired.",
    )
    limit: int = Field(default=20, description="Max results", le=50)
    offset: int = Field(default=0, description="Pagination offset")
```

#### `GetIgDmThreadInput`

```python
class GetIgDmThreadInput(BaseModel):
    ig_conversation_id: str = Field(
        description="Instagram conversation ID (ig_conversation_id from thread listing)"
    )
```

#### `SendIgDmReplyInput`

```python
class SendIgDmReplyInput(BaseModel):
    ig_conversation_id: str = Field(
        description="Instagram conversation ID to reply to"
    )
    message_text: str = Field(
        description="Message text to send (max 1000 characters)",
        max_length=1000,
    )
```

#### `ApproveIgDmDraftInput`

```python
class ApproveIgDmDraftInput(BaseModel):
    ig_conversation_id: str = Field(
        description="Instagram conversation ID with a pending AI draft"
    )
    edited_text: str | None = Field(
        default=None,
        description=(
            "Optional edited version of the draft. If omitted, sends the AI draft as-is. "
            "Max 1000 characters."
        ),
        max_length=1000,
    )
```

#### `SearchIgDmsInput`

```python
class SearchIgDmsInput(BaseModel):
    query: str = Field(
        description="Search text (matches message body and creator @handle)"
    )
    campaign_id: str | None = Field(
        default=None,
        description="Restrict search to a specific campaign UUID",
    )
    limit: int = Field(default=20, description="Max results", le=50)
```

#### `ConnectIgAccountInput`

```python
class ConnectIgAccountInput(BaseModel):
    pass  # No params — returns OAuth URL for the calling user
```

#### `ListIgAccountsInput`

```python
class ListIgAccountsInput(BaseModel):
    pass  # No params — lists all IG accounts for the calling user
```

#### `IgDmCampaignSummaryInput`

```python
class IgDmCampaignSummaryInput(BaseModel):
    campaign_id: str = Field(
        description="Campaign UUID. Use cheerful_list_campaigns to get IDs."
    )
```

---

### XML Formatters

#### `_fmt_window_status`

```python
def _fmt_window_status(window_expires_at: str | None) -> str:
    """Format 24h window status as a readable string.

    Returns:
        str — one of: "open (expires <timestamp>)", "expired", "n/a (outbound)"
    Behavior:
        - If window_expires_at is None: return "n/a"
        - Parse as ISO8601 datetime, compare to now (UTC)
        - If future: return f"open (expires {window_expires_at})"
        - If past: return "EXPIRED"
    """
```

#### `_fmt_ig_dm_thread_summary`

```python
def _fmt_ig_dm_thread_summary(thread: dict[str, Any]) -> str:
    """Format a single DM thread as XML for list views.

    Fields rendered:
        ig_conversation_id (as XML attribute id=)
        ig_username        → <ig-handle>@{username}</ig-handle>
        creator_name       → <creator-name>{name}</creator-name>  (if resolved)
        campaign_name      → <campaign>{name}</campaign>  (if matched)
        status             → <status>{status}</status>
        latest_message_at  → <last-message-at>{timestamp}</last-message-at>
        latest_snippet     → <snippet>{text[:120]}</snippet>
        window_expires_at  → <reply-window>{_fmt_window_status(...)}</reply-window>
        has_draft          → <has-draft>true</has-draft>  (only if True)

    Returns: tag("dm-thread", content, raw=True, id=ig_conversation_id)
    """
```

#### `_fmt_ig_dm_thread_list`

```python
def _fmt_ig_dm_thread_list(data: dict[str, Any]) -> str:
    """Format list of DM threads as XML.

    data shape: {"threads": [...], "total": int}
    Returns: wrap("dm-threads", items, total=str(total))
    Empty case: wrap("dm-threads", [hint("No DM threads found. Try adjusting filters.")], count=0)
    """
```

#### `_fmt_ig_dm_message`

```python
def _fmt_ig_dm_message(message: dict[str, Any]) -> str:
    """Format a single DM message as XML.

    Fields rendered:
        mid        → attribute id=
        direction  → attribute direction="INBOUND"/"OUTBOUND"
        from_ig    → <from>@{ig_username}</from>  (if INBOUND) or <from>you</from>
        sent_at    → <sent-at>{timestamp}</sent-at>
        body       → <body>{text[:2000]}</body>  (truncated at 2000 chars)
        media_type → <media type="{image|video|audio|story_mention}" />  (if present)

    Returns: tag("message", content, raw=True, id=mid, direction=direction)
    """
```

#### `_fmt_ig_dm_draft`

```python
def _fmt_ig_dm_draft(draft: dict[str, Any]) -> str:
    """Format an AI-generated draft reply as XML.

    Fields rendered:
        id         → attribute id=
        draft_text → <draft-text>{text}</draft-text>
        created_at → <generated-at>{timestamp}</generated-at>
        status     → <status>{PENDING|APPROVED|REJECTED}</status>

    Returns: tag("ai-draft", content, raw=True, id=draft_id)
    """
```

#### `_fmt_ig_dm_thread_detail`

```python
def _fmt_ig_dm_thread_detail(thread: dict[str, Any]) -> str:
    """Format full DM thread detail with messages and draft as XML.

    Renders:
        ig_conversation_id → <ig-conversation-id>{id}</ig-conversation-id>
        ig_username        → <ig-handle>@{username}</ig-handle>
        creator info block → if creator resolved: <creator id=...>name, campaign, handles</creator>
        status             → <status>{status}</status>
        reply-window block → <reply-window>{_fmt_window_status(...)}</reply-window>
        messages           → wrap("messages", [_fmt_ig_dm_message(m) for m in messages])
        ai_draft           → if present: _fmt_ig_dm_draft(draft)

    Returns: tag("dm-thread-detail", content, raw=True)
    """
```

#### `_fmt_ig_account`

```python
def _fmt_ig_account(account: dict[str, Any]) -> str:
    """Format a connected IG account as XML.

    Fields rendered:
        id                    → attribute id=
        ig_username           → <ig-handle>@{username}</ig-handle>
        ig_business_account_id → <ig-business-account-id>{id}</ig-business-account-id>
        is_active             → <status>active</status>  or  <status>inactive</status>
        webhook_subscribed    → <webhook>subscribed</webhook>  or  <webhook>NOT subscribed</webhook>
        token_expires_at      → <token-expires>{timestamp}</token-expires>
        created_at            → <connected-at>{timestamp}</connected-at>

    Returns: tag("ig-account", content, raw=True, id=account_id)
    """
```

#### `_fmt_ig_account_list`

```python
def _fmt_ig_account_list(accounts: list[dict[str, Any]]) -> str:
    """Format list of IG accounts as XML.

    Empty case: wrap("ig-accounts", [hint("No Instagram accounts connected. Use cheerful_connect_ig_account to add one.")], count=0)
    Returns: wrap("ig-accounts", items)
    """
```

#### `_fmt_ig_dm_campaign_summary`

```python
def _fmt_ig_dm_campaign_summary(data: dict[str, Any]) -> str:
    """Format campaign DM summary as XML.

    data shape (from backend): {
        "campaign_name": str,
        "campaign_id": str,
        "total_threads": int,
        "pending_threads": int,
        "replied_threads": int,
        "unmatched_threads": int,
        "window_open_count": int,
        "window_expiring_soon_count": int,  # expiring in < 2 hours
        "pending_drafts_count": int,
    }

    Returns: tag("ig-dm-campaign-summary", content, raw=True, id=campaign_id)
    """
```

---

### Credential Helper

```python
def _creds(ctx: ToolContext) -> tuple[str, str]:
    """Extract Cheerful credentials from ToolContext.

    Raises ToolError if CHEERFUL_API_URL or CHEERFUL_API_KEY not configured.
    Returns: (base_url, api_key)
    """


def _resolve_user_id(request_context: RequestContext | None) -> str:
    """Resolve the calling user's Cheerful user ID from RequestContext.

    Raises ToolError if user mapping is missing.
    """
```

These are direct copies of the same helpers in `tools.py`.

---

### Tool 1: `cheerful_list_ig_dm_threads`

```python
@tool(
    description=(
        "List Instagram DM threads in Cheerful. Returns @handle, message snippet, "
        "reply window status, AI draft indicator, and campaign association. "
        "Filter by campaign_id, status (PENDING/REPLIED/UNMATCHED/ARCHIVED), "
        "or window_open (True = only threads where you can still reply). "
        "Use cheerful_list_campaigns to get campaign IDs."
    ),
    tags={Platform.CHEERFUL, Action.READ},
)
async def cheerful_list_ig_dm_threads(
    tool_context: ToolContext,
    db_context: DatabaseContext | None,
    request_context: RequestContext | None,
    params: ListIgDmThreadsInput,
) -> str:
    """List DM threads, optionally filtered.

    API call: GET /api/service/ig-dm/threads/search
    Returns: XML-formatted list of dm-thread elements via _fmt_ig_dm_thread_list()
    Error path: re-raises ToolError from api.search_ig_dm_threads()
    """
```

### Tool 2: `cheerful_get_ig_dm_thread`

```python
@tool(
    description=(
        "Fetch a full Instagram DM conversation with all messages, creator info, "
        "campaign association, reply window status, and AI draft (if available). "
        "Use cheerful_list_ig_dm_threads first to get ig_conversation_id."
    ),
    tags={Platform.CHEERFUL, Action.READ},
)
async def cheerful_get_ig_dm_thread(
    tool_context: ToolContext,
    db_context: DatabaseContext | None,
    request_context: RequestContext | None,
    params: GetIgDmThreadInput,
) -> str:
    """Fetch full DM thread detail.

    API call: GET /api/service/ig-dm/threads/{ig_conversation_id}
    Returns: XML via _fmt_ig_dm_thread_detail()
    Error path: 404 → ToolError("Thread not found"); other → ToolError with status code
    """
```

### Tool 3: `cheerful_send_ig_dm_reply`

```python
@tool(
    description=(
        "Send an Instagram DM reply to a creator. "
        "IMPORTANT: Instagram DMs have a 24-hour reply window — you can only send "
        "if the creator messaged within the last 24 hours. Use cheerful_get_ig_dm_thread "
        "to check the reply window before sending. Max 1000 characters."
    ),
    tags={Platform.CHEERFUL, Action.WRITE},
)
async def cheerful_send_ig_dm_reply(
    tool_context: ToolContext,
    db_context: DatabaseContext | None,
    request_context: RequestContext | None,
    params: SendIgDmReplyInput,
) -> str:
    """Send a DM reply via the backend Meta API call.

    API call: POST /api/service/ig-dm/threads/{ig_conversation_id}/reply
    Body: {message_text, user_id}
    Returns on success: XML tag <ig-dm-sent mid="{mid}" sent_at="{timestamp}" />
    Error path:
        - 400 "24h window closed" → ToolError("Cannot send — 24h reply window has closed. "
          "The creator must message first to re-open the window.")
        - 400 other → ToolError with backend detail
        - Other → ToolError with status code
    """
```

### Tool 4: `cheerful_approve_ig_dm_draft`

```python
@tool(
    description=(
        "Approve an AI-generated draft reply for an Instagram DM thread. "
        "Optionally provide edited_text to modify the draft before sending. "
        "If omitted, the AI draft is sent as-is. "
        "Use cheerful_get_ig_dm_thread to see the current draft."
    ),
    tags={Platform.CHEERFUL, Action.WRITE},
)
async def cheerful_approve_ig_dm_draft(
    tool_context: ToolContext,
    db_context: DatabaseContext | None,
    request_context: RequestContext | None,
    params: ApproveIgDmDraftInput,
) -> str:
    """Approve (and optionally edit) an AI draft, then send it.

    Flow:
        1. Fetch thread via api.get_ig_dm_thread() to get draft_id and draft_text
        2. If no draft: raise ToolError("No pending AI draft for this thread.")
        3. Determine final_text = params.edited_text or draft.draft_text
        4. Call api.send_ig_dm_reply(ig_conversation_id, final_text, draft_id=draft.id)
        5. Return success XML with mid, sent_at, whether text was edited

    API calls:
        GET  /api/service/ig-dm/threads/{ig_conversation_id}  (to fetch draft)
        POST /api/service/ig-dm/threads/{ig_conversation_id}/reply  (to send)

    Returns: tag("ig-dm-draft-approved", ...) with mid, draft_id, edited=true/false
    Error path: same as cheerful_send_ig_dm_reply; propagates 24h window error
    """
```

### Tool 5: `cheerful_search_ig_dms`

```python
@tool(
    description=(
        "Full-text search across Instagram DM messages and creator handles. "
        "Optionally restrict to a specific campaign. "
        "Parallel to cheerful_search_emails for DMs."
    ),
    tags={Platform.CHEERFUL, Action.READ},
)
async def cheerful_search_ig_dms(
    tool_context: ToolContext,
    db_context: DatabaseContext | None,
    request_context: RequestContext | None,
    params: SearchIgDmsInput,
) -> str:
    """Search DM threads by keyword.

    API call: GET /api/service/ig-dm/threads/search?query={query}&...
    Uses api.search_ig_dm_threads(query=params.query, campaign_id=params.campaign_id)
    Returns: XML via _fmt_ig_dm_thread_list()
    """
```

### Tool 6: `cheerful_connect_ig_account`

```python
@tool(
    description=(
        "Initiate connecting a new Instagram Business Account to Cheerful. "
        "Returns a Meta OAuth URL — open it in your browser to complete the connection. "
        "After authorizing, the account will appear in cheerful_list_ig_accounts."
    ),
    tags={Platform.CHEERFUL, Action.WRITE},
)
async def cheerful_connect_ig_account(
    tool_context: ToolContext,
    db_context: DatabaseContext | None,
    request_context: RequestContext | None,
    params: ConnectIgAccountInput,
) -> str:
    """Get Meta OAuth URL for connecting an IG account.

    API call: GET /api/service/ig-dm/oauth-url
    Returns on success: XML with oauth_url formatted for Slack
        <ig-oauth>
          <instruction>Open this URL in your browser to connect your Instagram account:</instruction>
          <oauth-url>{url}</oauth-url>
          <note>After authorizing, use cheerful_list_ig_accounts to confirm the connection.</note>
        </ig-oauth>
    Error path: ToolError if backend returns non-200
    """
```

### Tool 7: `cheerful_list_ig_accounts`

```python
@tool(
    description=(
        "List Instagram Business Accounts connected to Cheerful for your user. "
        "Shows connection status, webhook subscription state, and token health. "
        "Use to verify an account connected successfully after cheerful_connect_ig_account."
    ),
    tags={Platform.CHEERFUL, Action.READ},
)
async def cheerful_list_ig_accounts(
    tool_context: ToolContext,
    db_context: DatabaseContext | None,
    request_context: RequestContext | None,
    params: ListIgAccountsInput,
) -> str:
    """List connected IG DM accounts for the calling user.

    API call: GET /api/service/ig-dm/accounts
    Returns: XML via _fmt_ig_account_list()
    """
```

### Tool 8: `cheerful_ig_dm_campaign_summary`

```python
@tool(
    description=(
        "Get an Instagram DM campaign overview: total threads, reply counts, "
        "pending AI drafts, and 24h window status breakdown. "
        "Use cheerful_list_campaigns to get the campaign_id."
    ),
    tags={Platform.CHEERFUL, Action.READ},
)
async def cheerful_ig_dm_campaign_summary(
    tool_context: ToolContext,
    db_context: DatabaseContext | None,
    request_context: RequestContext | None,
    params: IgDmCampaignSummaryInput,
) -> str:
    """Campaign-level DM overview: totals, pending drafts, window breakdown.

    API call: GET /api/service/ig-dm/threads/search?campaign_id={id}&aggregate=true
    (OR a dedicated /api/service/ig-dm/campaigns/{id}/summary endpoint — see note below)
    Returns: XML via _fmt_ig_dm_campaign_summary()

    Implementation note: The backend aggregation can be done in one of two ways:
        Option A: Add GET /api/service/ig-dm/campaigns/{campaign_id}/summary  (preferred)
        Option B: CE fetches all threads and aggregates client-side (simpler, slower)
    Spec leaves choice to backend implementation; CE tool calls whichever endpoint is built.
    In either case, the returned data shape matches _fmt_ig_dm_campaign_summary().
    """
```

---

## 3. `__init__.py` — Updated Exports

**File**: `apps/context-engine/app/src_v2/mcp/tools/cheerful/__init__.py`

```python
"""Cheerful email campaign tools and Instagram DM tools."""

from .tools import (
    cheerful_find_similar_emails,
    cheerful_get_campaign_creator,
    cheerful_get_thread,
    cheerful_list_campaign_creators,
    cheerful_list_campaigns,
    cheerful_search_campaign_creators,
    cheerful_search_emails,
)
from .ig_dm_tools import (
    cheerful_approve_ig_dm_draft,
    cheerful_connect_ig_account,
    cheerful_get_ig_dm_thread,
    cheerful_ig_dm_campaign_summary,
    cheerful_list_ig_accounts,
    cheerful_list_ig_dm_threads,
    cheerful_search_ig_dms,
    cheerful_send_ig_dm_reply,
)

__all__ = [
    # Email tools (existing)
    "cheerful_find_similar_emails",
    "cheerful_get_campaign_creator",
    "cheerful_get_thread",
    "cheerful_list_campaign_creators",
    "cheerful_list_campaigns",
    "cheerful_search_campaign_creators",
    "cheerful_search_emails",
    # IG DM tools (new)
    "cheerful_approve_ig_dm_draft",
    "cheerful_connect_ig_account",
    "cheerful_get_ig_dm_thread",
    "cheerful_ig_dm_campaign_summary",
    "cheerful_list_ig_accounts",
    "cheerful_list_ig_dm_threads",
    "cheerful_search_ig_dms",
    "cheerful_send_ig_dm_reply",
]
```

---

## 4. `catalog.py` — Registration

**File**: `apps/context-engine/app/src_v2/mcp/catalog.py`

Add to imports:
```python
from src_v2.mcp.tools.cheerful import (
    # existing...
    cheerful_approve_ig_dm_draft,
    cheerful_connect_ig_account,
    cheerful_get_ig_dm_thread,
    cheerful_ig_dm_campaign_summary,
    cheerful_list_ig_accounts,
    cheerful_list_ig_dm_threads,
    cheerful_search_ig_dms,
    cheerful_send_ig_dm_reply,
)
```

Add to `ALL_TOOLS` list after existing `# Cheerful (7)` block:
```python
# Cheerful IG DM (8)
cheerful_list_ig_dm_threads,
cheerful_get_ig_dm_thread,
cheerful_send_ig_dm_reply,
cheerful_approve_ig_dm_draft,
cheerful_search_ig_dms,
cheerful_connect_ig_account,
cheerful_list_ig_accounts,
cheerful_ig_dm_campaign_summary,
```

**No changes to `create_tool_registry()`** — the existing loop already registers all tools in `ALL_TOOLS`.

---

## 5. Feature Flag Gating

Per `spec-migration-safety.md`, all IG DM tools are gated behind `ENABLE_IG_DM` env var.

Add to `ig_dm_tools.py`:

```python
import os

_IG_DM_ENABLED = os.getenv("ENABLE_IG_DM", "false").lower() == "true"
```

Each tool body should start with:
```python
if not _IG_DM_ENABLED:
    raise ToolError("Instagram DM support is not enabled (ENABLE_IG_DM=false)")
```

Alternatively, add a `_guard()` helper at module level and call `_guard()` first in each tool.

---

## 6. XML Output Formats (Reference)

### Thread List Output (from `cheerful_list_ig_dm_threads`)

```xml
<dm-threads count="3" total="47">
  <dm-thread id="17841234567890">
    <ig-handle>@glossy.lips.creator</ig-handle>
    <creator-name>Sofia Reyes</creator-name>
    <campaign>Summer Glow 2026</campaign>
    <status>PENDING</status>
    <last-message-at>2026-03-01T14:23:00Z</last-message-at>
    <snippet>Hey! Just posted the reel you sent the...</snippet>
    <reply-window>open (expires 2026-03-02T14:23:00Z)</reply-window>
    <has-draft>true</has-draft>
  </dm-thread>
  <dm-thread id="17841234567891">
    <ig-handle>@makeup.by.jess</ig-handle>
    <status>UNMATCHED</status>
    <last-message-at>2026-03-01T09:10:00Z</last-message-at>
    <snippet>Hi! I saw your ad and I'm interested...</snippet>
    <reply-window>EXPIRED</reply-window>
  </dm-thread>
</dm-threads>
```

### Thread Detail Output (from `cheerful_get_ig_dm_thread`)

```xml
<dm-thread-detail>
  <ig-conversation-id>17841234567890</ig-conversation-id>
  <ig-handle>@glossy.lips.creator</ig-handle>
  <creator id="creator-uuid-abc">
    <name>Sofia Reyes</name>
    <campaign>Summer Glow 2026</campaign>
    <email>sofia@example.com</email>
  </creator>
  <status>PENDING</status>
  <reply-window>open (expires 2026-03-02T14:23:00Z)</reply-window>
  <messages count="3">
    <message id="m_abc123" direction="INBOUND">
      <from>@glossy.lips.creator</from>
      <sent-at>2026-03-01T14:23:00Z</sent-at>
      <body>Hey! Just posted the reel you sent the brief for. Check it out!</body>
    </message>
    <message id="m_def456" direction="INBOUND">
      <from>@glossy.lips.creator</from>
      <sent-at>2026-03-01T14:24:00Z</sent-at>
      <body>Also, do I get the discount code now or after review?</body>
    </message>
  </messages>
  <ai-draft id="draft-uuid-xyz">
    <draft-text>Hi Sofia! Congrats on the reel — it looks amazing. Your discount code is GLOW20. ...</draft-text>
    <generated-at>2026-03-01T14:25:30Z</generated-at>
    <status>PENDING</status>
  </ai-draft>
</dm-thread-detail>
```

### Send Success Output (from `cheerful_send_ig_dm_reply`)

```xml
<ig-dm-sent mid="m_ghi789" sent_at="2026-03-01T15:02:00Z" />
```

### Account List Output (from `cheerful_list_ig_accounts`)

```xml
<ig-accounts count="1">
  <ig-account id="acct-uuid-123">
    <ig-handle>@glossy.brand</ig-handle>
    <ig-business-account-id>17841234567000</ig-business-account-id>
    <status>active</status>
    <webhook>subscribed</webhook>
    <token-expires>2026-05-01T00:00:00Z</token-expires>
    <connected-at>2026-01-15T09:00:00Z</connected-at>
  </ig-account>
</ig-accounts>
```

---

## 7. Tool Summary Table

| Tool Name | Action | Backend Endpoint | Auth |
|-----------|--------|-----------------|------|
| `cheerful_list_ig_dm_threads` | READ | `GET /api/service/ig-dm/threads/search` | X-Service-Api-Key |
| `cheerful_get_ig_dm_thread` | READ | `GET /api/service/ig-dm/threads/{id}` | X-Service-Api-Key |
| `cheerful_send_ig_dm_reply` | WRITE | `POST /api/service/ig-dm/threads/{id}/reply` | X-Service-Api-Key |
| `cheerful_approve_ig_dm_draft` | WRITE | `GET` + `POST /api/service/ig-dm/threads/{id}/reply` | X-Service-Api-Key |
| `cheerful_search_ig_dms` | READ | `GET /api/service/ig-dm/threads/search` | X-Service-Api-Key |
| `cheerful_connect_ig_account` | WRITE | `GET /api/service/ig-dm/oauth-url` | X-Service-Api-Key |
| `cheerful_list_ig_accounts` | READ | `GET /api/service/ig-dm/accounts` | X-Service-Api-Key |
| `cheerful_ig_dm_campaign_summary` | READ | `GET /api/service/ig-dm/campaigns/{id}/summary` | X-Service-Api-Key |

---

## 8. Backend Service Route Additions (Context Engine Requirements)

The following service routes are required by CE tools but not all were in `spec-api-contracts.md §14–17`:

| Route | Required By | Status |
|-------|------------|--------|
| `GET /api/service/ig-dm/threads/search` | tools 1, 5 | In spec (§14) |
| `GET /api/service/ig-dm/threads/{id}` | tools 2, 4 | In spec (§15) |
| `GET /api/service/ig-dm/accounts` | tool 7 | In spec (§16) |
| `POST /api/service/ig-dm/threads/{id}/reply` | tools 3, 4 | In spec (§17) |
| `GET /api/service/ig-dm/oauth-url` | tool 6 | **ADD to spec-api-contracts** |
| `GET /api/service/ig-dm/campaigns/{id}/summary` | tool 8 | **ADD to spec-api-contracts** |

The `oauth-url` and campaign summary routes must be added to `service.py` in the backend.
See `analysis/spec/api-contracts.md` for the existing service.py pattern.

`GET /api/service/ig-dm/oauth-url` response model:
```python
class ServiceIgDmOauthUrlResponse(BaseModel):
    oauth_url: str
    state: str  # CSRF state token; stored server-side pending callback completion
```

`GET /api/service/ig-dm/campaigns/{campaign_id}/summary` response model:
```python
class ServiceIgDmCampaignSummaryResponse(BaseModel):
    campaign_id: str
    campaign_name: str
    total_threads: int
    pending_threads: int
    replied_threads: int
    unmatched_threads: int
    archived_threads: int
    window_open_count: int
    window_expiring_soon_count: int  # expires in < 2 hours
    pending_drafts_count: int
```

---

## 9. Dependencies

- Wave 2 specs complete: `spec-api-contracts`, `spec-pydantic-models`, `spec-db-migrations`
- Backend must implement service routes 14–17 (Phase 2) before CE tools function end-to-end
- Context engine tools can be developed and tested against mock responses before backend is live
- `ENABLE_IG_DM` env var must be set to `true` in CE deployment for tools to activate
