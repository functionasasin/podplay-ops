# Context Engine — Core Architecture Analysis

**Aspect:** `context-engine-core`
**Source:** `apps/context-engine/`
**Architecture pattern:** Functional Core, Imperative Shell (FCIS)

---

## Purpose

The Context Engine is a Slack bot powered by Claude (claude-opus-4-6) that gives internal teams AI-assisted access to cross-platform information — Slack messages, meeting transcripts, Fly.io infrastructure, Onyx knowledge base, PostHog analytics, and the Cheerful platform itself — all without leaving Slack.

**User problems it solves:**
- "What did we discuss about topic X in Slack last week?" — search without leaving chat
- "Summarize #channel for the last 3 days" — catch-up without reading everything
- "Launch an agent session on the cheerful codebase" — interactive coding environments via chat
- "What do we know about Y in the knowledge base?" — RAG-powered search
- "How many users hit the checkout funnel yesterday?" — analytics queries in natural language

---

## Architecture Overview

```
Slack (Socket Mode)
      │
      ▼
[entrypoints/slack/]        ← Platform boundary: converts Slack → internal types
      │  app.py / handlers.py / converters.py / main.py
      │
      ▼
[services/execution.py]     ← Orchestration: routes, selects tools, calls agent, persists
      │
      ├── [core/]           ← Pure business logic (no I/O)
      │   ├── routing.py    — Channel routing decisions
      │   ├── selection.py  — Keyword-based tool selection
      │   ├── history.py    — Message history → XML for Claude
      │   ├── chunking.py   — Markdown → Slack-sized chunks
      │   ├── slack_format.py — Markdown → Slack mrkdwn conversion
      │   ├── xml.py        — XML tag utilities for Claude context
      │   ├── environment.py — DeployEnvironment enum
      │   └── prompts/      — System prompt selection + templates
      │
      ├── [services/agent/] ← Claude Agent SDK execution
      │   ├── claude_agent.py — Runs claude-opus-4-6 with meta-tools + Langfuse
      │   ├── sdk_tools.py   — Wraps ToolRegistry as SDK MCP server
      │   └── langfuse_logging.py — Trace/span logging to Langfuse
      │
      ├── [mcp/]            ← Tool registry and meta-tool layer
      │   ├── registry.py   — ToolDef + ToolRegistry (dispatch engine)
      │   ├── catalog.py    — ALL_TOOLS list + create_tool_registry()
      │   ├── meta_tools.py — discover_tools + execute_tool factory
      │   ├── context.py    — ToolContext, DatabaseContext, RequestContext
      │   └── tags.py       — Platform + Action StrEnums
      │
      ├── [db/]             ← Database access (Supabase PostgreSQL)
      │   ├── models/thread_context.py — ThreadToolContext schema
      │   └── repositories/thread_context.py — CRUD for thread persistence
      │
      └── [clients/]        ← HTTP clients for external services
          ├── acp.py, clarify.py, fly/, onyx/
```

---

## Layer-by-Layer Breakdown

### 1. Entrypoints Layer (`entrypoints/slack/`)

**Purpose:** Only place where Slack SDK types are allowed. Converts platform events to internal domain objects.

**File:** `app.py` — Slack Bolt `AsyncApp` factory
- Listens for `app_mention` events (channel @mentions)
- Listens for `message` events (DMs only, filters out bot messages)
- Wires both to `handlers.handle_message()` with all dependencies injected

**File:** `handlers.py` — Event handler orchestration
- `is_dm(event)` — checks `channel_type == "im"`
- `get_thread_id(event)` — returns `thread_ts` if in thread, else `ts` (starts new thread)
- `_fetch_thread_history()` — fetches up to 50 prior thread replies via `conversations_replies`
- `_StatusUpdater` — live "working" status indicator:
  - Posts `:hourglass_flowing_sand: Thinking...` placeholder immediately
  - Updates Slack message every 1.5s (rate-limited) with tool call progress
  - Final update marks `:white_check_mark: Done`
  - Format: header + list of `{icon} {text}` events
- `handle_message()` — main orchestration:
  1. Convert Slack event → `Message` (via `converters.py`)
  2. Resolve Slack user ID → Cheerful user ID (via static mapping)
  3. Build `RequestContext` with both user IDs
  4. Post placeholder message to Slack thread
  5. Fetch thread history if continuing existing thread
  6. Call `execute_message()` from services layer
  7. Convert Markdown → mrkdwn (`markdown_to_mrkdwn`)
  8. Post response + finalize status message

**File:** `converters.py` — Slack → core domain conversion
- `slack_event_to_core_message()` — strips bot mention, extracts file URLs, converts Slack ts (float) to datetime
- `slack_reply_to_core_message()` — for thread history replies (no full user_info, uses user_id as name)

**File:** `main.py` — Bootstrap + Socket Mode startup
- Loads `AppSettings` from environment variables
- Builds `ToolContext` (all API credentials)
- Creates SQLAlchemy engine with `NullPool` (short-lived connections only)
- Creates `ToolRegistry` via `create_tool_registry()`
- Creates `Langfuse` client
- Creates Slack `AsyncApp` via `create_app()`
- Starts `AsyncSocketModeHandler`

---

### 2. Core Layer (`core/`) — Pure Functions Only

**Design rule:** No I/O, no async, no side effects. All functions are synchronous and deterministic.

#### `routing.py` — Channel Routing

```python
get_target_channel(channel_id, parent_channel_id, channel_mappings) -> RoutingDecision
```
- Looks up channel in `channel_mappings` dict (external → internal)
- Thread messages use `parent_channel_id` for lookup (message came from thread but route by parent)
- Returns `RoutingDecision(is_routed=True, target_channel_id=..., suppress_typing=True, suppress_status=True)`
- Returns `RoutingDecision.no_routing()` if no mapping found
- **Purpose:** Allows "routed client" mode where Slack messages from a client channel get forwarded to an internal channel with a different (more restricted) prompt

#### `selection.py` — Tool Selection via Keyword Matching

```python
extract_platforms_from_message(content: str) -> set[str]
filter_tools_by_platforms(tools, platforms) -> list[str]
merge_tool_slugs(existing, new) -> list[str]
filter_valid_slugs(stored_slugs, available_tools) -> list[str]
```

**Keyword → Platform mapping** (`KEYWORD_PLATFORM_MAP`):
| Keywords | Platform |
|----------|---------|
| "slack", "channel", "thread", "message" | `Platform.SLACK` |
| "clarify", "meeting", "transcript", "recording", "call" | `Platform.CLARIFY` |
| "fly", "deploy", "server", "machine" | `Platform.FLY` |
| "acp", "session", "agent" | `Platform.ACP` |
| "onyx", "search", "knowledge" | `Platform.ONYX` |
| "posthog", "analytics", "funnel", "hogql", "insight", "feature flag" | `Platform.POSTHOG` |
| "cheerful", "email", "campaign", "inbox", "draft", "creator", "gifting", "talent" | `Platform.CHEERFUL` |

**Note:** `TOOL_FILTERING_ENABLED = False` — keyword filtering is not currently active. Claude receives all tools regardless of keywords. The code is in place for future enabling.

**Thread continuity:** `merge_tool_slugs()` does additive merge — tools are never removed from a thread's context once added. `filter_valid_slugs()` provides graceful degradation if a tool is renamed (old slug silently dropped).

#### `history.py` — Message History Formatting

```python
format_messages_for_claude(messages: list[Message]) -> str
```
Formats thread history as XML for Claude context:
```xml
<user author_id="U123" author_name="Alice" timestamp="2024-01-01T12:00:00+00:00">
  What's the status of the campaign?
</user>

<assistant timestamp="2024-01-01T12:00:01+00:00">
  The campaign is currently in the launch phase...
</assistant>
```

#### `chunking.py` — Slack Character Limit Management

```python
chunk_message(content: str, limit: int = 1800) -> list[str]
```
- Slack limit is 4000 chars but 1800 used for safety margin (block formatting overhead)
- Parsing priority: code blocks first → newline boundaries → hard split at limit
- Preserves code block integrity when possible
- Returns list of chunks, each within limit

#### `slack_format.py` — Markdown → Slack mrkdwn

```python
markdown_to_mrkdwn(text: str) -> str
```
- `**bold**` / `__bold__` → `*bold*`
- `[text](url)` → `<url|text>`
- `## headers` → `*header*`
- `---` → `───────────────`
- Skips code blocks entirely (tracked via state machine)

#### `xml.py` — Claude-Optimized XML Utilities

```python
tag(name, content="", raw=False, **attrs) -> str   # <name attr="v">content</name>
wrap(name, items, **attrs) -> str                   # <name count="N">...</name>
hint(message) -> str                                # <hint>...</hint>
```
- Claude was trained on XML, making structured XML an effective communication format for tool outputs
- `hint()` provides actionable guidance when results are empty

#### `prompts/` — System Prompt Selection

```python
select_prompt(context: PromptSelectionContext) -> str
```
- `PromptSelectionContext.is_routed` → selects prompt
- `is_routed=False` → `base.txt` (full agent with all capabilities)
- `is_routed=True` → `routed_client.txt` (restricted knowledge base assistant)

**`base.txt` prompt key sections:**
- Identity: "You are Context, a tool-using assistant"
- Tool protocol: Use `discover_tools` then `execute_tool`; platform inference from context
- Slack mrkdwn formatting rules (not standard Markdown)
- Tone: direct, no filler, no emojis unless user uses them first
- Session management: follow `platform:fly-sessions` skill for Fly.io
- GitHub: use `github_run_gh` tool (links user account via `/connect github`)

**`routed_client.txt` prompt:**
- "You are an assistant that answers client questions about the codebase/project by querying the knowledge base Onyx using Onyx tools."
- More restricted scope — only Onyx queries, not full platform access

#### `core/slack/status.py` — Status State Machine

Pure functional status tracker for the "working" indicator:
```
StatusState(events: tuple[Event, ...])  # immutable
add_event(state, icon, text) -> StatusState  # evicts oldest if > 10 events
build_status_text(state, header) -> str  # renders as mrkdwn
```

Event types created by handlers.py callbacks:
- `create_tool_start_event(name, params)` — pencil emoji + tool name
- `create_tool_end_event(name, params)` — checkmark + tool name
- `create_finalize_event(success=True/False)` — ✅ Done / ❌ Error

Meta-tool display formatting:
- `discover_tools` with `platforms` → "📜 Discovered: slack, fly"
- `execute_tool` with `name` + `params` → "🖋️ slack_read_channel(channel=C123)"

---

### 3. Services Layer (`services/`)

#### `execution.py` — Full Pipeline Orchestration

```python
async def execute_message(...) -> ExecutionResult
```

**Flow:**
1. **Session 1 (read):** Load `ThreadToolContext` from DB by `thread_id`; release connection immediately
2. **Tool selection:** `extract_platforms_from_message()` → keyword platforms; `filter_tools_by_platforms()` → slugs
3. **Thread merging:** If existing context, merge stored slugs (additive, graceful degradation for renamed tools)
4. **Session UUID:** Use existing `session_uuid` from DB or generate new UUID
5. **Prompt selection:** `select_prompt(PromptSelectionContext(is_routed=routing_decision.is_routed))`
6. **Agent execution:** `create_sdk_tools()` + `run_claude_agent()` — DB connection NOT held during this
7. **Session 2 (write):** Create or update `ThreadToolContext` in DB; commit

**Why two sessions?** PgBouncer/Supabase kills idle connections. Agent execution can take 30+ seconds. Holding a connection open during LLM inference would cause connection timeouts. The split ensures connections are used only for brief DB operations.

**`ExecutionResult`:**
```python
@dataclass
class ExecutionResult:
    response_text: str        # Final text from Claude
    tool_slugs_used: list[str]  # Tools that were selected
    session_uuid: str         # Langfuse session ID
```

#### `services/agent/claude_agent.py` — Claude Agent SDK Execution

```python
async def run_claude_agent(...) -> AgentResult
```

**Key setup:**
- Model: `claude-opus-4-6`
- Permission mode: `bypassPermissions` (no sandboxing)
- MCP servers: only `meta-tools` server (discover_tools + execute_tool)
- Allowed tools: `["mcp__meta-tools__discover_tools", "mcp__meta-tools__execute_tool"]`

**Message formatting:**
```xml
<conversation-history>
  <user author_id="U123" ...>prior message</user>
  <assistant ...>prior response</assistant>
</conversation-history>

<current-message author_id="U456">current user message</current-message>
```

**SDK hooks:** Optional async callbacks wired to `_StatusUpdater` in handlers.py:
- `PreToolUse` → `on_tool_start(tool_name, tool_input)`
- `PostToolUse` → `on_tool_end(tool_name, tool_input)`

**Response streaming:** Iterates `client.receive_response()` collecting:
- `AssistantMessage` → `TextBlock` (final text) + `ToolUseBlock` (tool calls)
- `UserMessage` → `ToolResultBlock` (tool responses, attached to matching AgentStep by `tool_use_id`)
- `final_text` = last text part received (Claude's final answer)

**Langfuse logging:** After execution, logs full trace with all steps.

#### `services/agent/sdk_tools.py` — Meta-Tool MCP Server

```python
create_sdk_tools(registry, request_context) -> SdkToolConfig
```

Wraps the ToolRegistry as a single MCP server with 2 tools:

**`discover_tools(platforms: list[Platform]) -> str`**
- Calls `registry.list_tools(platforms=...)`
- Returns formatted text: tool names, descriptions, parameter types
- Claude uses this to find what's available before executing

**`execute_tool(name: str, params: dict) -> str`**
- Calls `registry.call_tool(name, params, request_context)`
- Returns tool result as string
- Errors from `ToolError` propagated back to Claude as text

**Two-level indirection pattern:**
1. Claude calls `discover_tools(["slack"])` → gets list of available Slack tools
2. Claude calls `execute_tool("slack_read_channel", {"channel": "C123"})` → gets channel messages

*Note: This meta-tool pattern is marked as temporary. Future: Anthropic Tool Search Tool (track issue #525) will allow direct tool discovery, eliminating need for meta-tools.*

---

### 4. MCP Layer (`mcp/`)

#### `registry.py` — ToolDef + ToolRegistry

**`@tool` decorator:**
```python
@tool(
    description="Read messages from a Slack channel",
    tags={Platform.SLACK, Action.READ},
)
async def slack_read_channel(
    tool_context: ToolContext,
    db_context: DatabaseContext | None,
    request_context: RequestContext | None,
    params: SlackReadChannelParams,
) -> str:
    ...
```

The decorator:
1. Introspects `params` type hint to get Pydantic model
2. Produces `ToolDef(description, input_model, tags, handler)`
3. `ToolDef.name` = function name
4. `ToolDef.input_schema` = Pydantic model's JSON Schema

**`ToolRegistry.call_tool()`:**
1. Lookup `ToolDef` by name → `ToolNotFoundError` if missing
2. `input_model.model_validate(params)` → validates + coerces params
3. Call `handler(tool_context, db_context, request_context, validated_params)`

**Tool filtering:**
```python
registry.list_tools(platforms={Platform.SLACK, Platform.FLY})
# Returns all ToolDefs whose tags intersect with platforms
```

#### `catalog.py` — Tool Registration

38 total tools registered across 7 platforms:
| Platform | Count | Tools |
|----------|-------|-------|
| Slack | 4 | `slack_read_thread`, `slack_read_channel`, `slack_parse_link`, `slack_search_messages` |
| Fly | 8 | `fly_launch_session`, `fly_stop_session`, `fly_get_session_status`, `fly_list_sessions`, `fly_list_images`, `fly_list_templates`, `fly_save_template`, `fly_delete_template` |
| Clarify | 4 | `clarify_list_meetings`, `clarify_get_transcript`, `clarify_get_summary`, `clarify_search_transcripts` |
| Onyx | 2 | `onyx_list_agents`, `onyx_query` |
| ACP | 4 | `acp_health_check`, `acp_list_tools`, `acp_send_message`, `acp_call_tool` |
| PostHog | 9 | `posthog_query`, `posthog_list_event_definitions`, `posthog_list_property_definitions`, `posthog_list_sessions`, `posthog_get_session`, `posthog_list_insights`, `posthog_get_insight`, `posthog_list_annotations`, `posthog_list_feature_flags` |
| Cheerful | 7 | `cheerful_list_campaigns`, `cheerful_search_emails`, `cheerful_get_thread`, `cheerful_find_similar_emails`, `cheerful_list_campaign_creators`, `cheerful_get_campaign_creator`, `cheerful_search_campaign_creators` |

#### `context.py` — Dependency Injection Contexts

Three flat dataclasses injected into every tool handler:

```python
@dataclass(frozen=True)
class ToolContext:      # Credentials for all platforms
    slack_bot_token, slack_user_token
    fly_api_token, fly_org_slug
    anthropic_api_key, gh_token
    onyx_api_key, onyx_base_url
    posthog_api_key, posthog_project_id, posthog_host
    cheerful_api_url, cheerful_api_key
    deploy_environment: str

@dataclass(frozen=True)
class DatabaseContext:   # DB access (for tools that need it)
    session_factory: Callable[[], Session]

@dataclass(frozen=True)
class RequestContext:    # Per-request user identity
    slack_user_id: str
    cheerful_user_id: str
```

#### `tags.py` — Platform + Action Tags

```python
class Platform(StrEnum):
    SLACK = "slack"
    CLARIFY = "clarify"
    ACP = "acp"
    FLY = "fly"
    ONYX = "onyx"
    POSTHOG = "posthog"
    CHEERFUL = "cheerful"

class Action(StrEnum):
    READ = "read"
    WRITE = "write"
    HEALTH = "health"
    SESSION = "session"
    TOOLS = "tools"
    COMMUNICATION = "communication"
```

---

### 5. Database Layer (`db/`) — Thread Context Persistence

**`ThreadToolContext` model:**
```python
class ThreadToolContext(BaseModel):
    id: int | None
    thread_id: str         # Slack thread_ts (unique per thread)
    tool_slugs: list[str]  # Tool names available in this thread
    session_uuid: str      # Langfuse session grouping ID
    user_id: str           # Slack user who started thread
    channel_id: str        # Parent channel
    created_at, updated_at: datetime | None
```

**Purpose:** Enables thread continuity — when a user continues a conversation in a thread, the same tools are available without re-discovering them. Tools are additive: once a platform is mentioned, those tools stay available for the entire thread.

---

### 6. Bootstrap Layer (`bootstrap/`)

**`config.py`** — Pydantic settings grouped by service with env var prefixes:
| Class | Prefix | Required fields |
|-------|--------|----------------|
| `SlackSettings` | `SLACK_` | `bot_token`, `app_token`, `signing_secret` |
| `DatabaseSettings` | `DATABASE_` | `url` |
| `FlySettings` | `FLY_` | `api_token` |
| `OnyxSettings` | `ONYX_` | all optional |
| `PosthogSettings` | `POSTHOG_` | all optional |
| `ClarifySettings` | `CLARIFY_` | all optional |
| `CheerfulSettings` | `CHEERFUL_` | all optional |
| `AnthropicSettings` | `ANTHROPIC_` | `api_key` |
| `LangfuseSettings` | `LANGFUSE_` | `public_key`, `secret_key` |

---

## Key Design Patterns

### FCIS Architecture

The codebase follows Functional Core, Imperative Shell:
- **Core** (`core/`) = pure functions, synchronous, trivially testable without mocks
- **Shell** (`entrypoints/`, `services/`, `clients/`) = async I/O, side effects, tested with mocks

### Dependency Injection via Function Arguments

No global state. All dependencies passed explicitly:
```python
# Every tool handler receives 3 context objects positionally:
async def my_tool(tool_context: ToolContext, db_context: DatabaseContext | None, request_context: RequestContext | None, params: MyParams) -> str: ...
```

### Meta-Tool Pattern (Temporary)

Claude can't call 38 tools directly (too many tokens). Solution: 2 meta-tools:
1. `discover_tools(platforms)` → returns tool catalog as text
2. `execute_tool(name, params)` → dispatches to any tool

This means Claude must **reason** about which tools exist before calling them. The pattern adds a reasoning step but keeps the API footprint minimal.

Future: Anthropic's Tool Search Tool will make this unnecessary.

### User Identity Propagation

Slack user IDs → Cheerful user IDs via static mapping (`get_slack_user_mapping()` in `tools/cheerful/constants.py`). The mapping is environment-aware (dev vs prod different IDs). `RequestContext` carries both IDs into every tool call so tools can make API calls on behalf of the correct user.

### Thread State Machine

Each Slack thread gets a `ThreadToolContext` DB record:
- First message in thread → `extract_platforms` → `filter_tools` → create record
- Subsequent messages → load record → merge (additive) → update record
- Additive merge ensures tools don't "disappear" mid-conversation

---

## Message Flow (End-to-End)

```
User: "@context search for messages about the campaign launch"
  │
  ▼
Slack sends app_mention event
  │
  ▼
handlers.handle_message()
  ├── converters.slack_event_to_core_message() → Message(author_id, content, ...)
  ├── RequestContext(slack_user_id, cheerful_user_id)
  ├── POST placeholder ":hourglass_flowing_sand: Thinking..."
  ├── _fetch_thread_history() → [Message, Message, ...] (if in thread)
  │
  ▼
services.execute_message()
  ├── Session1: load ThreadToolContext for thread_ts (or None)
  ├── extract_platforms("search for messages about the campaign launch")
  │   → {Platform.SLACK}  ("messages" keyword)
  ├── filter_tools_by_platforms(..., {Platform.SLACK})
  │   → ["slack_read_thread", "slack_read_channel", "slack_parse_link", "slack_search_messages"]
  │   (note: TOOL_FILTERING_ENABLED=False, so all 38 tools used anyway)
  ├── select_prompt(is_routed=False) → base.txt content
  │
  ▼
services.agent.run_claude_agent()
  ├── Format message as XML with conversation history
  ├── ClaudeSDKClient(claude-opus-4-6, meta-tools MCP server)
  ├── Claude receives: current message + history
  │
  │   [Claude reasons: "user wants Slack messages → use discover_tools(['slack'])"]
  ├── Claude calls discover_tools(platforms=["slack"])
  │   → "Available tools: slack_read_thread, slack_read_channel, slack_parse_link, slack_search_messages\n..."
  │
  │   [Claude reasons: "use slack_search_messages for keyword search"]
  ├── Claude calls execute_tool(name="slack_search_messages", params={query: "campaign launch"})
  │   → XML result with matching messages
  │
  │   [Claude synthesizes results into response]
  ├── Claude emits TextBlock: "I found 3 messages about the campaign launch..."
  │
  ▼
  AgentResult(final_text="I found 3 messages...", steps=[...])
  │
  ├── Session2: create/update ThreadToolContext
  │
  ▼
handlers.handle_message() (continued)
  ├── markdown_to_mrkdwn(result.response_text)
  ├── status_updater.finalize(success=True) → updates placeholder: "✅ Done"
  └── POST final response in thread

User sees: Threaded reply with formatted Slack message results
```

---

## Configuration Summary

| Setting | Env Var | Notes |
|---------|---------|-------|
| Slack bot token | `SLACK_BOT_TOKEN` | xoxb-... for API calls |
| Slack app token | `SLACK_APP_TOKEN` | xapp-... for Socket Mode |
| Slack signing secret | `SLACK_SIGNING_SECRET` | Request verification |
| Slack user token | `SLACK_USER_TOKEN` | xoxp-... for search API |
| Database | `DATABASE_URL` | Supabase PostgreSQL |
| Fly API | `FLY_API_TOKEN`, `FLY_ORG_SLUG` | Machines API access |
| Anthropic | `ANTHROPIC_API_KEY` | Claude Agent SDK |
| Langfuse | `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY` | Observability |
| Onyx | `ONYX_API_KEY`, `ONYX_BASE_URL` | RAG knowledge base |
| PostHog | `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`, `POSTHOG_HOST` | Analytics |
| Clarify | `CLARIFY_API_KEY`, `CLARIFY_WORKSPACE_ID` | Meeting transcripts |
| Cheerful | `CHEERFUL_API_URL`, `CHEERFUL_API_KEY` | Cheerful backend access |
| Deploy env | `DEPLOY_ENVIRONMENT` | production/staging/development |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src_v2/entrypoints/slack/main.py` | Bootstrap + Socket Mode startup |
| `src_v2/entrypoints/slack/app.py` | Slack Bolt app factory, event wiring |
| `src_v2/entrypoints/slack/handlers.py` | Event handling, status updater |
| `src_v2/entrypoints/slack/converters.py` | Slack event → core Message |
| `src_v2/services/execution.py` | Full pipeline orchestration |
| `src_v2/services/agent/claude_agent.py` | Claude Agent SDK execution |
| `src_v2/services/agent/sdk_tools.py` | Meta-tool MCP server creation |
| `src_v2/mcp/registry.py` | ToolDef + ToolRegistry + @tool decorator |
| `src_v2/mcp/catalog.py` | ALL_TOOLS list + create_tool_registry() |
| `src_v2/mcp/meta_tools.py` | discover_tools + execute_tool factory |
| `src_v2/mcp/context.py` | ToolContext, DatabaseContext, RequestContext |
| `src_v2/mcp/tags.py` | Platform + Action StrEnums |
| `src_v2/core/selection.py` | Keyword → platform → tool filtering |
| `src_v2/core/routing.py` | Channel routing decisions |
| `src_v2/core/history.py` | Message history → XML for Claude |
| `src_v2/core/prompts/base.txt` | Main system prompt |
| `src_v2/core/prompts/routed_client.txt` | Restricted client prompt |
| `src_v2/core/prompts/selector.py` | Prompt selection based on routing |
| `src_v2/core/chunking.py` | Markdown → Slack-sized chunks |
| `src_v2/core/slack_format.py` | Markdown → mrkdwn conversion |
| `src_v2/core/xml.py` | XML utilities for Claude context |
| `src_v2/core/slack/status.py` | Live status state machine |
| `src_v2/db/models/thread_context.py` | ThreadToolContext schema |
| `src_v2/bootstrap/config.py` | Pydantic settings (all env vars) |
