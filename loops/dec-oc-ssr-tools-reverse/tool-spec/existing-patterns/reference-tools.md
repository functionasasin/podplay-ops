# Reference Tool Implementations — Patterns for SSR Tools

> Source: `apps/bot/src_v2/mcp/tools/discord/read.py`, `mcp/tools/bluedot/read.py`,
> `mcp/tools/bluedot/api.py`, `mcp/tools/github/tools.py`, `mcp/tools/acp/tools.py`,
> `mcp/tools/credentials/tools.py`, `mcp/tools/toggl/tools.py`
> Analyzed: 2026-03-01

---

## Overview

This document captures concrete implementation patterns from existing Daimon tools.
SSR tools must follow these patterns exactly for consistency with the codebase.

Four tools/groups are analyzed in depth:
1. **`discord/read.py`** — HTTP client tools with pagination, error translation, XML formatters
2. **`bluedot/read.py` + `api.py`** — DB-access tools, split-file pattern, not-found handling
3. **`github/tools.py`** — Credential-gated tool, subprocess, minimal formatting
4. **`acp/tools.py`** — Manual field validation, JSON parsing, multi-action tool group

---

## 1. `discord/read.py` — HTTP Tools With XML Formatters

### File Header Pattern

```python
"""Discord read tools.

Tools for reading Discord channels, threads, and searching messages.
Calls clients/discord directly -- no intermediate api.py adapter.
"""
```

Module docstring explains: (1) what tools do, (2) what client they call, (3) any architectural notes.

### Import Ordering

```python
from typing import NoReturn          # stdlib first
import httpx                         # third-party second

from orchestrator_clients import ... # internal clients third
from src_v2.core.xml import hint, tag, wrap     # core utils
from src_v2.mcp.context import DatabaseContext, ToolContext, UserContext  # MCP context
from src_v2.mcp.registry import ToolError, tool  # MCP registry
from src_v2.mcp.tags import Action, Platform     # tags
```

### Error Handler Pattern

When all tools share the same error translation logic, extract it to a private `_handle_*_error()` function:

```python
def _handle_discord_error(e: httpx.HTTPStatusError, resource: str) -> NoReturn:
    """Translate httpx errors to ToolError. Always raises.

    Args:
        e: The HTTP error from the Discord client.
        resource: Description for error message (e.g. "Channel 123", "Guild 456").

    Raises:
        ToolError: Always.
    """
    status = e.response.status_code
    if status == 202:
        raise ToolError("Search index is building. Retry in a few seconds.") from e
    if status == 404:
        raise ToolError(f"{resource} not found") from e
    if status == 403:
        raise ToolError(f"Bot lacks access to {resource}") from e
    raise ToolError(f"Discord API error: {status} — {e.response.text[:200]}") from e
```

Key aspects:
- Return type is `NoReturn` — signals to type checker that it always raises
- Uses `from e` to preserve exception chain for debugging
- Truncates error text with `[:200]` to avoid huge error messages
- Most specific HTTP codes first (202, 404, 403), generic fallthrough last
- The `resource` parameter is a human-readable description, not an ID

### Formatter Pattern

All formatters are private `_fmt_*()` functions at module level. They are pure functions (no side effects, no I/O):

```python
def _fmt_message(msg: MessageResponse) -> str:
    """Format a message as XML."""
    author = msg.author
    display = author.global_name or author.username
    role = "assistant" if author.bot else "user"
    ts = str(msg.timestamp)[:16].replace("T", " ") if msg.timestamp else "unknown"

    author_tag = tag(
        "author",
        display,
        id=_snowflake_str(author.id),
        username=author.username,
        role=role,
    )
    content_tag = tag("content", msg.content or "")

    return tag("message", author_tag + content_tag, raw=True, id=_snowflake_str(msg.id), timestamp=ts)
```

Key aspects:
- Handle `None` with `or "unknown"` / `or ""` — never pass `None` into `tag()`
- Build nested XML by concatenating `tag()` calls, then wrapping with `raw=True`
- Use meaningful attribute names (kebab-case where multi-word: `channel-id`, `has-transcript`)
- Truncate display strings before putting them into attributes

Container formatter pattern:
```python
def _fmt_messages(messages: list[MessageResponse], channel_id: str | int, channel_name: str | None = None) -> str:
    if not messages:
        return wrap(
            "messages",
            [hint("No messages found.")],
            channel=channel_name or "",
            **{"channel-id": str(channel_id)},
        )
    items = [_fmt_message(m) for m in reversed(messages)]  # reversed = oldest first
    return wrap("messages", items, channel=channel_name or "", **{"channel-id": str(channel_id)})
```

Key aspects:
- Empty case: return `wrap(...)` with `[hint("...")]` — never return empty string
- Non-empty case: list comprehension of `_fmt_item()` calls, then `wrap()`
- Use `**{"hyphenated-key": value}` syntax for kwarg keys with hyphens

### Input Model Pattern

```python
class ReadChannelInput(BaseModel):
    """Input for discord_read_channel."""

    channel_id: str = Field(description="Discord channel ID (numeric string, not a URL)")
    limit: int = Field(default=50, ge=1, le=100, description="Max messages to fetch (1-100)")
```

Key aspects:
- Docstring format: `"Input for {tool_function_name}."`
- Every field has `description=` — this is what Claude sees in the JSON schema
- Bounded integers use both `ge`/`le` and put the range in the description: `(1-100)`
- Optional fields always have explicit `default=`
- `str` for IDs even when they're numeric — avoids integer overflow on large Discord snowflakes

Multi-filter model (search tools):
```python
class SearchMessagesInput(BaseModel):
    content: str | None = Field(default=None, description="Text to search for (max 1024 chars)")
    author_ids: list[str] | None = Field(default=None, description="Filter to messages from these user IDs")
    limit: int = Field(default=25, ge=1, le=25, description="Results per request (1-25)")
    offset: int = Field(default=0, ge=0, le=9975, description="Skip this many results for pagination")
```

Key aspects:
- Optional filters use `X | None = Field(default=None, ...)`
- Pagination: `limit` (page size) + `offset` (skip count) is the standard pattern
- Upper bound on `offset` prevents unbounded pagination

### Tool Function Pattern (No DB, HTTP Client)

```python
@tool(
    description="""\
Read message history from a Discord thread.

Use when a user shares a thread link or asks about a thread conversation.
Returns messages oldest-first. Bot messages marked [assistant], humans [user].

Each message includes:
- Role ([user] or [assistant])
- Display name, @username, and user ID
- Timestamp
- Message content""",
    tags={Platform.DISCORD, Action.READ},
)
async def discord_read_thread(
    tool_context: ToolContext,
    user_context: UserContext,
    db_context: DatabaseContext | None,
    params: ReadThreadInput,
) -> str:
    try:
        thread = await discord.get_thread(tool_context.discord_token, int(params.thread_id))
        messages = await discord.get_channel_messages(
            tool_context.discord_token,
            int(params.thread_id),
            params=ChannelsChannelIdMessagesGetParametersQuery(limit=100),
        )
    except httpx.HTTPStatusError as e:
        _handle_discord_error(e, resource=f"Thread {params.thread_id}")

    return _fmt_messages(messages, channel_id=params.thread_id, channel_name=thread.name)
```

Key aspects:
- Multi-line description using `"""\` format with actual newlines (not `\n`)
- Description starts with one-sentence summary, then "Use when..." guidance, then output format
- `tags=` is always a `set` literal `{A, B}`
- No `requires_credential` for tools that use system tokens from `tool_context`
- `try/except` wraps ALL HTTP calls together (not each one separately)
- `db_context` is in the signature even when unused — it's always the third parameter
- `int(params.thread_id)` — string IDs are parsed to int for client calls
- Return is the formatter output directly, no intermediate variable

### Pagination Hint Pattern

```python
if params.offset + len(result.messages) < result.total_results:
    items.append(hint(f"More results available. Use offset={params.offset + params.limit} to continue."))
```

The hint gives Claude the exact value to use for the next request — not just "there are more results".

---

## 2. `bluedot/read.py` + `api.py` — DB Access with Split-File Pattern

### File Structure

```
mcp/tools/bluedot/
├── __init__.py    # Re-exports all ToolDef instances
├── read.py        # @tool-decorated functions (thin wrappers calling api.py)
├── api.py         # Business logic — manages session lifecycle, ToolError for domain errors
└── models.py      # Internal data models (not Pydantic input models)
```

This is the **split-file pattern** used for tool groups with database access and/or substantial business logic. SSR tools must use this pattern.

### `api.py` — Session Management Layer

```python
"""Bluedot API layer.

Thin wrapper managing session lifecycle and ToolError handling.
All functions take DatabaseContext as first parameter.
"""

from src_v2.db.repositories import bluedot as bluedot_repo
from src_v2.mcp.context import DatabaseContext
from src_v2.mcp.registry import ToolError

from .models import BluedotMeeting, BluedotSummary, BluedotTranscript


def list_meetings(db: DatabaseContext) -> list[BluedotMeeting]:
    """List all accessible meetings."""
    session = db.session_factory()
    return bluedot_repo.list_meetings(session)


_NOT_FOUND_MSG = (
    "Meeting '{}' not found. Possible causes: "
    "(1) the meeting is private, or "
    "(2) it was recorded before January 22, 2026 — meetings before that date were never "
    "ingested because the webhook integration wasn't active yet. "
    "..."
)


def get_transcript(db: DatabaseContext, meeting_id: str) -> BluedotTranscript:
    """Fetch transcript. Raises ToolError if not found."""
    session = db.session_factory()
    result = bluedot_repo.get_transcript(session, meeting_id)
    if not result:
        raise ToolError(_NOT_FOUND_MSG.format(meeting_id))
    return result


def search_transcripts(db: DatabaseContext, query: str, limit: int = 25) -> list[BluedotMeeting]:
    """Search transcripts by keyword. Raises ToolError for empty query."""
    if not query.strip():
        raise ToolError("Search query cannot be empty")
    session = db.session_factory()
    return bluedot_repo.search_transcripts(session, query, limit)
```

Key aspects:
- `api.py` functions are **synchronous** — SQLAlchemy sessions are sync
- Session is acquired with `db.session_factory()` at the start of each function
- Not-found errors: check result, raise `ToolError` with helpful context (not just "not found")
- Validation errors (`not query.strip()`) are checked BEFORE acquiring a session
- Not-found messages are extracted to module-level constants for reuse
- Functions return domain models (from `models.py`), not raw DB rows
- `api.py` never imports `tag`, `wrap`, `hint` — formatting is the tool's job

### `read.py` — Tool Functions Calling `api.py`

```python
from . import api
from .models import BluedotMeeting, BluedotSummary, BluedotTranscript

@tool(
    description=(
        "List all accessible Bluedot meetings. "
        "Returns meetings from the workspace that have been shared or are public. "
        "Private meetings are not included. Each entry shows date, title, "
        "duration, attendees, and available content (transcript/summary)."
    ),
    tags={Platform.BLUEDOT, Action.READ},
)
async def bluedot_list_meetings(
    tool_context: ToolContext,
    user_context: UserContext,
    db_context: DatabaseContext | None,
    params: ListMeetingsInput,
) -> str:
    if db_context is None:
        raise ToolError("Database context required for Bluedot tools")
    meetings = api.list_meetings(db_context)
    return _fmt_meetings(meetings)
```

Key aspects:
- **Always** check `if db_context is None` before using it — raise `ToolError` with an informative message
- `api.*` functions are called synchronously (they're sync; `async def` tools can call sync functions)
- The tool itself does NO business logic — just: check db → call api → format → return
- `api.py` raises `ToolError` for domain errors; the tool doesn't need to catch them

### `models.py` — Internal Domain Models

```python
# models.py contains internal data models — NOT Pydantic input models
# These are the types that api.py returns, separate from DB ORM models

from dataclasses import dataclass
from datetime import datetime

@dataclass
class BluedotMeeting:
    meeting_id: str
    title: str | None
    meeting_created_at: datetime | None
    duration: float | None
    attendees: list[str]
    has_transcript: bool
    has_summary: bool
```

Key aspects:
- `models.py` holds the intermediate "domain" layer between raw DB rows and tool output
- Can be dataclasses or Pydantic models — bluedot uses dataclasses
- SSR tools should use Pydantic v2 models here for consistency with the spec

---

## 3. `github/tools.py` — Credential-Gated Tool

### Credential Gate Pattern

```python
@tool(
    description="Run a GitHub CLI (gh) command using the requesting user's credentials.",
    tags={Platform.GITHUB, Action.WRITE},
    requires_credential=CredentialPlatform.GITHUB,
)
async def github_run_gh(
    tool_context: ToolContext,
    user_context: UserContext,
    db_context: DatabaseContext | None,
    params: RunGhInput,
) -> str:
    token = user_context.credentials[CredentialPlatform.GITHUB]
    ...
```

Key aspects:
- `requires_credential=CredentialPlatform.GITHUB` — registry checks this before calling the handler
- If the credential is not linked, the registry raises `ToolError` automatically (with link instructions)
- Inside the handler, access the token with `user_context.credentials[CredentialPlatform.GITHUB]`
- Use dict access `[...]` not `.get(...)` — if `requires_credential` is set, the key is guaranteed to be present
- **SSR tools do NOT use `requires_credential`** — they use `tool_context.anthropic_api_key` (system key)

### Subprocess + Timeout Pattern

```python
_TIMEOUT_SECONDS = 30

async def github_run_gh(...) -> str:
    process = await asyncio.create_subprocess_exec(
        "gh",
        *args,
        env={**os.environ, "GH_TOKEN": token},
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    try:
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=_TIMEOUT_SECONDS)
    except TimeoutError:
        process.kill()
        raise ToolError(f"gh command timed out after {_TIMEOUT_SECONDS}s: gh {command}") from None
```

Key aspects:
- Module-level timeout constant (not hardcoded in function)
- Kill the process on timeout before raising
- `from None` suppresses exception chaining when the original exception isn't useful

### Multi-Part Output Formatter

```python
def _fmt_gh_result(command: str, returncode: int, stdout: str, stderr: str) -> str:
    attrs: dict[str, str] = {"command": command}
    if returncode != 0:
        attrs["exit-code"] = str(returncode)

    parts: list[str] = []
    if stdout.strip():
        parts.append(tag("stdout", stdout.strip()))
    if stderr.strip():
        parts.append(tag("stderr", stderr.strip()))
    if returncode != 0 and not stderr.strip():
        parts.append(hint("Command failed with no error output."))

    content = "\n".join(parts)
    return tag("gh-result", content, raw=True, **attrs)
```

Key aspects:
- Build attrs dict first, then conditionally add more keys
- Build parts list, filter empty, join with newline, wrap in outer tag
- Conditional `hint()` for ambiguous states (failed but no error output)
- Always include command in attributes for traceability

---

## 4. `acp/tools.py` — Manual Validation and JSON Parsing

### Manual Validation Before External Calls

```python
@tool(...)
async def acp_send_message(...) -> str:
    if params.timeout < 10 or params.timeout > 600:
        raise ToolError("timeout must be between 10 and 600 seconds")
    response = await acp_send_message_client(params.app_name, params.message, params.timeout)
    return _fmt_message_result(response)
```

Note: validation here is done in the tool handler, not in the Pydantic model. This is an **older pattern** — prefer Pydantic `ge`/`le` validators in the input model (as in `ReadChannelInput` above). Both patterns appear in the codebase; the Pydantic approach is cleaner.

### JSON-String Field Pattern

```python
class CallToolInput(BaseModel):
    params: str = Field(default="{}", description='Tool parameters as JSON string (default: "{}")')
```

Then in the handler:
```python
try:
    params_dict = json.loads(params.params)
except json.JSONDecodeError as e:
    raise ToolError(f"Invalid JSON params: {e}") from e
```

Key aspects:
- When a tool needs to accept arbitrary structured data, use a JSON string field
- Validate and parse in the handler, raise `ToolError` with the parse error detail
- The default `"{}"` covers the common "no params" case

---

## 5. Consolidated SSR Tool Implementation Patterns

Based on all reference tools, here are the patterns SSR tools must follow:

### File Structure

```
mcp/tools/ssr/
├── __init__.py     # Re-export all ToolDef instances named in catalog.py
├── tools.py        # @tool-decorated functions — thin wrappers
├── api.py          # Business logic, session management, pipeline orchestration
└── models.py       # Internal domain models (SsrPersona, SsrRunResult, etc.)
```

### `__init__.py` Export Pattern

```python
# __init__.py
from .tools import (
    ssr_panel_create,
    ssr_panel_run,
    ssr_panel_results,
    ssr_panel_list,
    ssr_panel_delete,
)

__all__ = [
    "ssr_panel_create",
    "ssr_panel_run",
    "ssr_panel_results",
    "ssr_panel_list",
    "ssr_panel_delete",
]
```

### DB Check at Start of Every SSR Tool

```python
async def ssr_panel_create(
    tool_context: ToolContext,
    user_context: UserContext,
    db_context: DatabaseContext | None,
    params: PanelCreateInput,
) -> str:
    if db_context is None:
        raise ToolError("Database context required for SSR panel tools.")
    # ... proceed
```

### Owner Identification

```python
# Use discord_id as panel owner — no auth required
owner_discord_id = user_context.discord_id
```

### Anthropic API Key Access

```python
# SSR tools call Claude for persona generation, stimulus presentation, response elicitation
api_key = tool_context.anthropic_api_key
```

### Concurrency for Panel Runs

```python
# In api.py — run all personas in parallel
async def run_panel(db: DatabaseContext, tool_ctx: ToolContext, run_id: str) -> SsrRunResult:
    personas = get_personas_for_run(db, run_id)
    tasks = [_run_single_persona(tool_ctx, persona, stimulus) for persona in personas]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    # Handle any exceptions in results
    ...
```

### Not-Found Error Messages

```python
_PANEL_NOT_FOUND_MSG = (
    "Panel '{}' not found. "
    "Use ssr_panel_list to see your available panels."
)

def get_panel(db: DatabaseContext, panel_id: str, discord_id: str) -> SsrPanel:
    session = db.session_factory()
    result = ssr_repo.get_panel(session, panel_id, discord_id)
    if not result:
        raise ToolError(_PANEL_NOT_FOUND_MSG.format(panel_id))
    return result
```

### Output Formatting for SSR Results

SSR results will include Likert distributions, means, and qualitative highlights. Use nested `tag()` calls:

```python
def _fmt_dimension_result(dim: DimensionResult) -> str:
    """Format one evaluation dimension's results as XML."""
    distribution = "".join(
        tag("bar", str(pct), score=str(i + 1))
        for i, pct in enumerate(dim.distribution_pct)
    )
    distribution_wrapped = tag("distribution", distribution, raw=True)
    quotes = "".join(tag("quote", q, persona=q_meta) for q, q_meta in dim.highlight_quotes[:3])
    quotes_wrapped = tag("quotes", quotes, raw=True) if quotes else ""

    return tag(
        "dimension",
        distribution_wrapped + quotes_wrapped,
        raw=True,
        name=dim.name,
        mean=f"{dim.mean:.2f}",
        n=str(dim.n_responses),
    )
```

---

## Cross-References

- [tool-system.md](tool-system.md) — `@tool` decorator, ToolDef, ToolError, contexts
- [db-patterns.md](db-patterns.md) — SQLAlchemy migration conventions, RLS, indexes
- [pydantic-models.md](../data-model/pydantic-models.md) — Full Pydantic model definitions for SSR
- [panel-create.md](../tools/panel-create.md) — `ssr_panel_create` tool specification
- [panel-run.md](../tools/panel-run.md) — `ssr_panel_run` tool specification
- [panel-results.md](../tools/panel-results.md) — `ssr_panel_results` tool specification
