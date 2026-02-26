# Spec: Context Engine

**Synthesized from:** `context-engine-core`, `context-engine-mcp-tools`, `ai-orchestration`
**Purpose:** Implementation-ready specification for rebuilding the Context Engine from scratch.

---

## 1. What Is the Context Engine?

The Context Engine is a **Slack bot powered by Claude (claude-opus-4-6)** that gives internal team members conversational access to cross-platform data without leaving Slack. It is a completely separate service from the Cheerful backend — a standalone Python application deployed to Fly.io alongside the backend.

**User problems it solves:**
- "What did we discuss about X in Slack last week?" → search without leaving chat
- "Summarize #channel for the last 3 days" → catch-up without reading everything
- "What do we know about Y in our knowledge base?" → RAG-powered organizational search
- "How many users hit checkout yesterday?" → analytics queries in natural language
- "Launch an agent session on the cheerful codebase" → cloud IDE via Slack
- "What's the status of this campaign's creator threads?" → campaign data in Slack

**What it is NOT:**
- Not part of the email processing pipeline (that is the backend AI pipeline)
- Not a user-facing product (internal team only)
- Not a write interface to Cheerful (all Cheerful tools are read-only)

---

## 2. Architecture Overview

```
Slack (Socket Mode, WebSocket)
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│ entrypoints/slack/                                          │
│   app.py — Bolt AsyncApp; listens on app_mention + DM msgs │
│   handlers.py — Event handling, StatusUpdater              │
│   converters.py — Slack event types → internal Message     │
│   main.py — Bootstrap, dependency injection, startup        │
└─────────────────────┬───────────────────────────────────────┘
                      │ internal Message + RequestContext
                      ▼
┌─────────────────────────────────────────────────────────────┐
│ services/execution.py — Pipeline orchestrator               │
│   1. Load ThreadToolContext from DB (Session 1, read)       │
│   2. Keyword → platform detection (disabled, unused)        │
│   3. Merge tool slugs (additive, never removes tools)       │
│   4. Select system prompt (routed vs. base)                 │
│   5. Run Claude agent (no DB connection held)               │
│   6. Save ThreadToolContext to DB (Session 2, write)        │
└──────────┬──────────────────────────┬───────────────────────┘
           │                          │
           ▼                          ▼
┌─────────────────────┐   ┌───────────────────────────────────┐
│ services/agent/     │   │ db/                               │
│ claude_agent.py     │   │   models/thread_context.py        │
│ sdk_tools.py        │   │   repositories/thread_context.py  │
│ langfuse_logging.py │   └───────────────────────────────────┘
└──────────┬──────────┘
           │ 2 meta-tools (discover_tools + execute_tool)
           ▼
┌─────────────────────────────────────────────────────────────┐
│ mcp/                                                        │
│   registry.py — ToolDef + ToolRegistry + @tool decorator   │
│   catalog.py — ALL_TOOLS (38 tools across 7 platforms)     │
│   meta_tools.py — discover_tools + execute_tool closures   │
│   context.py — ToolContext, DatabaseContext, RequestContext │
│   tags.py — Platform + Action StrEnums                     │
│   tools/                                                    │
│     slack/ — 4 tools (read thread/channel/link/search)     │
│     fly/ — 8 tools (launch/stop/status sessions+templates) │
│     clarify/ — 4 tools (meetings, transcripts, summaries)  │
│     acp/ — 4 tools (Claude-to-Claude via Fly sessions)     │
│     onyx/ — 2 tools (list agents, RAG query)               │
│     posthog/ — 9 tools (HogQL, sessions, insights, flags)  │
│     cheerful/ — 7 tools (campaigns, emails, creators)      │
└─────────────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│ core/ — Pure functions, no I/O                              │
│   routing.py — Channel → routing decision                   │
│   selection.py — Keyword → platform → tool filtering       │
│   history.py — Message list → XML for Claude               │
│   chunking.py — Markdown → Slack-sized chunks (1800 chars) │
│   slack_format.py — Markdown → mrkdwn conversion           │
│   xml.py — XML tag builder utilities                        │
│   prompts/ — base.txt, routed_client.txt, selector.py      │
│   slack/status.py — Live status state machine              │
└─────────────────────────────────────────────────────────────┘
```

**Architecture pattern:** Functional Core, Imperative Shell (FCIS)
- **Core** (`core/`) = pure functions, synchronous, deterministic, no I/O — trivially unit-testable
- **Shell** (`entrypoints/`, `services/`, `clients/`) = async I/O, side effects, tested with mocks

---

## 3. End-to-End Message Flow

### 3.1 New Thread Message

```
User: "@context what did we discuss about the campaign launch in #product?"
                      │
                      ▼
Slack sends app_mention event to Socket Mode WebSocket
                      │
                      ▼
app.py: on_app_mention → handlers.handle_message(event, say, client)
                      │
                      ▼
handlers.handle_message():
  1. is_dm(event) → False (channel mention)
  2. get_thread_id(event) → event["ts"] (new thread)
  3. converters.slack_event_to_core_message(event, client)
       - Strips "@context" mention from text
       - Extracts file URLs from attachments
       - Converts Slack ts (float) → datetime
       → Message(author_id="U123", author_name="Alice", content="what did we discuss...", ts=...)
  4. get_slack_user_mapping()["U123"] → cheerful_user_id="abc-uuid"
  5. RequestContext(slack_user_id="U123", cheerful_user_id="abc-uuid")
  6. POST to Slack: "⏳ Thinking..." placeholder message → placeholder_ts
  7. _fetch_thread_history() → [] (new thread, no history)
  8. execute_message(message, thread_id, [], routing_decision, request_context)
                      │
                      ▼
services/execution.py:execute_message():
  Session 1 (DB read, immediately released):
    ThreadToolContextRepository.get_by_thread_id(thread_id) → None
  keyword_platforms = extract_platforms_from_message("what did we discuss...campaign launch")
    → {Platform.SLACK, Platform.CHEERFUL}  ("campaign" → CHEERFUL, "discuss" → none)
  [TOOL_FILTERING_ENABLED=False → platforms ignored, all tools used]
  select_prompt(PromptSelectionContext(is_routed=False)) → base.txt content
  session_uuid = str(uuid.uuid4())  # New Langfuse session
                      │
                      ▼
services/agent/claude_agent.py:run_claude_agent():
  Format input:
    """
    <conversation-history>
    </conversation-history>   ← empty for new thread
    <current-message author_id="U123" author_name="Alice" timestamp="...">
    what did we discuss about the campaign launch in #product?
    </current-message>
    """
  Create SDK MCP server with meta-tools (discover_tools + execute_tool)
  client = ClaudeSDKClient(
    model="claude-opus-4-6",
    system_prompt=base.txt,
    permission_mode=bypassPermissions,
    mcp_servers=[meta-tools],
    allowed_tools=["mcp__meta-tools__discover_tools", "mcp__meta-tools__execute_tool"],
  )
  client.send_message(formatted_input)
                      │
                      ▼
  [Claude reasoning loop]:
    Claude infers: user wants Slack messages AND campaign data

    Claude calls: discover_tools(platforms=["slack", "cheerful"])
    → "Available tools:
       slack_read_thread(channel_id, thread_ts) - Read messages from a thread
       slack_read_channel(channel_id, limit) - Read recent channel messages
       slack_search_messages(query, count) - Search messages with Slack syntax
       slack_parse_link(slack_link) - Parse a Slack permalink
       cheerful_list_campaigns() - List your campaigns
       cheerful_search_emails(campaign_id, query...) - Search email threads
       ..."

    Claude calls: execute_tool("slack_search_messages", {"query": "campaign launch"})
    → StatusUpdater fires: "🖋️ slack_search_messages(query=campaign launch)" (live update to Slack)
    → <messages count="4">
        <message channel="#product" user="Alice" ts="...">
          We decided to push the launch to next Thursday...
        </message>
        ...
      </messages>

    Claude calls: execute_tool("cheerful_list_campaigns", {})
    → <campaigns>
        <campaign id="uuid1" name="Spring 2026 Gifting" status="active">...
      </campaigns>

    Claude synthesizes → final TextBlock response
                      │
                      ▼
  AgentResult(final_text="Here's what we discussed about the campaign launch...", steps=[...])

  Session 2 (DB write):
    ThreadToolContextRepository.create(ThreadToolContext(
      thread_id=thread_ts,
      tool_slugs=["slack_search_messages", "cheerful_list_campaigns", ...],
      session_uuid=session_uuid,
      user_id="U123",
      channel_id="C123",
    ))

  ExecutionResult(response_text=final_text, tool_slugs_used=[...], session_uuid=...)
                      │
                      ▼
handlers.handle_message() (continued):
  response_mrkdwn = markdown_to_mrkdwn(result.response_text)
  chunks = chunk_message(response_mrkdwn, limit=1800)
  for chunk in chunks:
    POST to Slack thread (reply in thread)
  status_updater.finalize(success=True)
    → UPDATE placeholder message: "✅ Done"

User sees: Threaded Slack reply with formatted results
```

### 3.2 Continuing Thread Message

Same flow except:
- `get_thread_id(event)` → `event["thread_ts"]` (existing thread)
- `_fetch_thread_history()` → last 50 replies from `conversations_replies`
- `converters.slack_reply_to_core_message()` for each reply
- `execute_message()` → Session 1 loads existing `ThreadToolContext`
- Tool slugs: `merge_tool_slugs(stored_slugs, new_slugs)` — additive union, never removes
- `session_uuid` reused from `ThreadToolContext.session_uuid` — all turns grouped in Langfuse

### 3.3 DM Message

Same as mention flow except:
- `app.py` listens on `message` event (not `app_mention`)
- `is_dm(event)` → True (channel_type == "im")
- Bot messages filtered: `if event.get("bot_id"): skip`
- No mention stripping needed (no @context prefix)
- `get_thread_id(event)` uses same logic (thread_ts or ts)

---

## 4. Core Layer — Pure Function Specifications

### 4.1 `routing.py` — Channel Routing

```python
@dataclass
class RoutingDecision:
    is_routed: bool
    target_channel_id: str | None   # Internal channel to post to (None if not routed)
    suppress_typing: bool            # Don't show "typing" if routed (already done by sender)
    suppress_status: bool            # Don't show status updates in source channel

def get_target_channel(
    channel_id: str,
    parent_channel_id: str | None,
    channel_mappings: dict[str, str],  # {source_channel_id: target_channel_id}
) -> RoutingDecision
```

**Purpose:** "Routed client" mode — messages from a client-facing Slack channel get forwarded to an internal channel with a restricted system prompt (Onyx-only, no direct system access).

- Thread messages: lookup by `parent_channel_id` (route by parent, not thread)
- Returns `RoutingDecision.no_routing()` if channel not in mappings
- Currently configured via `AppSettings.channel_mappings` (env var JSON)

### 4.2 `selection.py` — Keyword-Based Tool Preselection

```python
KEYWORD_PLATFORM_MAP: dict[str, Platform] = {
    "slack": Platform.SLACK, "channel": Platform.SLACK,
    "thread": Platform.SLACK, "message": Platform.SLACK,
    "clarify": Platform.CLARIFY, "meeting": Platform.CLARIFY,
    "transcript": Platform.CLARIFY, "recording": Platform.CLARIFY, "call": Platform.CLARIFY,
    "fly": Platform.FLY, "deploy": Platform.FLY,
    "server": Platform.FLY, "machine": Platform.FLY,
    "acp": Platform.ACP, "session": Platform.ACP, "agent": Platform.ACP,
    "onyx": Platform.ONYX, "search": Platform.ONYX, "knowledge": Platform.ONYX,
    "posthog": Platform.POSTHOG, "analytics": Platform.POSTHOG,
    "funnel": Platform.POSTHOG, "hogql": Platform.POSTHOG,
    "insight": Platform.POSTHOG, "feature flag": Platform.POSTHOG,
    "cheerful": Platform.CHEERFUL, "email": Platform.CHEERFUL,
    "campaign": Platform.CHEERFUL, "inbox": Platform.CHEERFUL,
    "draft": Platform.CHEERFUL, "creator": Platform.CHEERFUL,
    "gifting": Platform.CHEERFUL, "talent": Platform.CHEERFUL,
}

TOOL_FILTERING_ENABLED: bool = False  # Currently disabled — all tools always available
```

**Note:** The keyword detection and platform filtering logic exists and works, but `TOOL_FILTERING_ENABLED = False` means Claude always receives all 38 tools. The code is ready to enable if token budget becomes a concern.

**Thread merging semantics:**
```python
def merge_tool_slugs(existing: list[str], new: list[str]) -> list[str]:
    # Union, not replacement. Tools never removed once a platform is mentioned.
    return list(dict.fromkeys(existing + new))  # preserves order, deduplicates

def filter_valid_slugs(stored_slugs: list[str], available_tools: list[str]) -> list[str]:
    # Graceful degradation if a tool was renamed between versions
    return [s for s in stored_slugs if s in available_tools]
```

### 4.3 `history.py` — Message History Formatting

```python
def format_messages_for_claude(messages: list[Message]) -> str
```

Formats thread history as XML:
```xml
<user author_id="U123" author_name="Alice" timestamp="2024-01-01T12:00:00+00:00">
  What's the status of the campaign?
</user>

<assistant timestamp="2024-01-01T12:00:01+00:00">
  The campaign is currently in the launch phase...
</assistant>
```

**Why XML?** Claude's training on structured data makes XML reliable for parsing conversation boundaries. Author/timestamp attributes provide context without polluting message content.

### 4.4 `chunking.py` — Slack Character Limit Management

```python
def chunk_message(content: str, limit: int = 1800) -> list[str]
```

Slack API limit: 4000 chars. Uses 1800 for safety (block formatting overhead, Slack rendering buffer).

Splitting priority:
1. Code blocks — never split mid-code-block (state machine tracking ` ``` `)
2. Newline boundaries — prefer splitting at `\n` within limit
3. Hard split — if no newline, split at limit character

Returns list of chunks; each chunk posted as separate Slack message in thread.

### 4.5 `slack_format.py` — Markdown → mrkdwn

```python
def markdown_to_mrkdwn(text: str) -> str
```

Transformations:
| Markdown | Slack mrkdwn |
|----------|-------------|
| `**bold**` / `__bold__` | `*bold*` |
| `[text](url)` | `<url\|text>` |
| `## Heading` | `*Heading*` |
| `---` | `───────────────` |
| Code blocks | Preserved unchanged (state machine skip) |

**Why not standard Markdown?** Slack renders its own mrkdwn format in messages. Standard Markdown renders as plain text in Slack. The conversion ensures proper bold, link, and divider rendering.

### 4.6 `xml.py` — Claude-Optimized XML Utilities

```python
def tag(name: str, content: str = "", raw: bool = False, **attrs) -> str
# → <name attr="v">content</name>

def wrap(name: str, items: list[str], **attrs) -> str
# → <name count="N">item1\nitem2\n...</name>

def hint(message: str) -> str
# → <hint>message</hint>
```

**`hint()` purpose:** When a tool returns empty results, a `<hint>` guides Claude's next action (e.g., "No messages found. Try broadening your search query or checking the channel ID."). Prevents Claude from hallucinating results when tools return nothing.

### 4.7 `core/slack/status.py` — Live Status State Machine

```python
@dataclass(frozen=True)
class StatusState:
    events: tuple[Event, ...]  # immutable, max 10 events (oldest evicted)

def add_event(state: StatusState, icon: str, text: str) -> StatusState
def build_status_text(state: StatusState, header: str) -> str
```

**Status message format:**
```
🤖 Context is working on it:
• 🖋️ discover_tools(platforms=["slack"])
• ✅ discover_tools
• 🖋️ slack_search_messages(query=campaign launch)
• ✅ slack_search_messages
```

**Event creation** (called by handler SDK hooks):
```python
# Tool start (PreToolUse hook):
create_tool_start_event("discover_tools", {"platforms": ["slack"]})
→ Event(icon="🖋️", text="discover_tools(platforms=['slack'])")

# Tool end (PostToolUse hook):
create_tool_end_event("discover_tools", {"platforms": ["slack"]})
→ Event(icon="✅", text="discover_tools")

# Finalize:
create_finalize_event(success=True) → Event(icon="✅", text="Done")
create_finalize_event(success=False) → Event(icon="❌", text="Error")
```

**StatusUpdater** (in `handlers.py`): Rate-limited Slack message updater
- Posts placeholder immediately on message receipt
- Updates placeholder via `client.chat_update()` every 1.5s (rate limit)
- Runs as background task during agent execution
- Final update on agent completion (success or error)

---

## 5. Agent Execution Layer

### 5.1 `services/agent/claude_agent.py` — Agent Setup

```python
async def run_claude_agent(
    message: Message,
    thread_history: list[Message],
    sdk_tool_config: SdkToolConfig,
    system_prompt: str,
    session_uuid: str,
    on_tool_start: Callable[[str, dict], Awaitable[None]] | None,
    on_tool_end: Callable[[str, dict], Awaitable[None]] | None,
    langfuse_client: Langfuse,
) -> AgentResult
```

**Configuration:**
```python
ClaudeCodeOptions(
    model="claude-opus-4-6",
    permission_mode=PermissionMode.BYPASS_PERMISSIONS,  # No sandboxing
    mcp_servers=[sdk_tool_config.server],               # Only meta-tools MCP
    allowed_tools=sdk_tool_config.tool_names,           # Only discover + execute
    system_prompt=system_prompt,                         # base.txt or routed_client.txt
)
```

**Input formatting:**
```xml
<conversation-history>
  <user author_id="U123" author_name="Alice" timestamp="...">prior message</user>
  <assistant timestamp="...">prior response</assistant>
</conversation-history>

<current-message author_id="U456" author_name="Bob" timestamp="...">
  current user message
</current-message>
```

**SDK hook wiring:**
```python
hooks = ClaudeCodeHooks(
    pre_tool_use=lambda event: on_tool_start(event.tool_name, event.tool_input),
    post_tool_use=lambda event: on_tool_end(event.tool_name, event.tool_input),
)
```

**Response collection:**
```python
async for message in client.receive_response():
    if isinstance(message, AssistantMessage):
        for block in message.content:
            if isinstance(block, TextBlock):
                final_text = block.text
            elif isinstance(block, ToolUseBlock):
                steps.append(AgentStep(tool_use_id=block.id, tool_name=block.name, ...))
    elif isinstance(message, UserMessage):
        for block in message.content:
            if isinstance(block, ToolResultBlock):
                # Match to step by tool_use_id
                matching_step.tool_result = block.content
```

**Returns:**
```python
@dataclass
class AgentResult:
    final_text: str              # Claude's last TextBlock
    steps: list[AgentStep]       # All tool calls with inputs + outputs
    usage: TokenUsage            # Input/output token counts
```

### 5.2 `services/agent/sdk_tools.py` — Meta-Tool MCP Server

```python
def create_sdk_tools(
    registry: ToolRegistry,
    request_context: RequestContext,
) -> SdkToolConfig
```

Creates a single MCP server (`meta-tools`) with exactly 2 tools:

**`discover_tools(platforms: list[Platform]) -> str`**
```
Input: {"platforms": ["slack", "cheerful"]}
Output: "Available tools:
  slack_read_thread(channel_id: str, thread_ts: str) - Read messages from a Slack thread
  slack_read_channel(channel_id: str, limit: int) - Read recent messages from a channel
  ...
  cheerful_list_campaigns() - List your active campaigns
  ..."
```

**`execute_tool(name: str, params: dict) -> str`**
```
Input: {"name": "slack_search_messages", "params": {"query": "campaign launch", "count": 25}}
Output: "<messages count='4'>...</messages>"  ← or ToolError message
```

Error handling: `ToolError` raised by handlers is caught, returned as error text to Claude. Claude can then try alternative tools or report the error to the user.

### 5.3 `services/execution.py` — Two-Session DB Pattern

```python
async def execute_message(
    message: Message,
    thread_id: str,
    thread_history: list[Message],
    routing_decision: RoutingDecision,
    request_context: RequestContext,
) -> ExecutionResult
```

**Why two DB sessions?** Supabase/PgBouncer kills idle connections after ~30s. Claude agent execution takes 10-90s. Holding a DB connection open during LLM inference → connection timeout/error.

```python
# Session 1: Read (brief)
async with db_session() as session:
    context = await repo.get_by_thread_id(thread_id, session)
# Session released immediately

# [Agent execution — NO DB connection held here]
agent_result = await run_claude_agent(...)

# Session 2: Write (brief)
async with db_session() as session:
    await repo.upsert(ThreadToolContext(...), session)
# Session released
```

---

## 6. MCP Tool Registry

### 6.1 Tool Definition

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

The `@tool` decorator:
1. Introspects signature to extract `params` type (must be Pydantic `BaseModel`)
2. Returns `ToolDef(description, input_model, tags, handler)` replacing the function
3. `ToolDef.name` = function name (`"slack_read_channel"`)
4. `ToolDef.input_schema` = Pydantic model's JSON Schema (passed to `discover_tools`)

**`ToolRegistry.call_tool()` sequence:**
1. Lookup `ToolDef` by name → `ToolNotFoundError` if missing
2. `params_model.model_validate(raw_params)` → validate + coerce
3. Call `handler(tool_context, db_context, request_context, validated_params)`

### 6.2 Context Injection

Every tool handler receives exactly 3 context objects injected by the registry:

```python
@dataclass(frozen=True)
class ToolContext:
    # Credentials for all platforms (always present)
    slack_bot_token: str    # xoxb-... for API calls
    slack_user_token: str   # xoxp-... for search API (requires user token)
    fly_api_token: str
    fly_org_slug: str
    anthropic_api_key: str  # Forwarded into Fly sessions
    gh_token: str           # Forwarded into Fly sessions for GitHub
    onyx_api_key: str
    onyx_base_url: str
    posthog_api_key: str
    posthog_project_id: str
    posthog_host: str
    cheerful_api_url: str
    cheerful_api_key: str
    deploy_environment: str  # "production" | "staging" | "development"

@dataclass(frozen=True)
class DatabaseContext:
    # Optional — only tools that need DB (Clarify, Fly templates)
    session_factory: Callable[[], Session]

@dataclass(frozen=True)
class RequestContext:
    # Optional — user identity for per-user API calls
    slack_user_id: str
    cheerful_user_id: str
```

**User identity resolution:**
```python
# In tools/cheerful/constants.py:
SLACK_USER_MAPPING = {
    "production": {"U123": "uuid1", "U456": "uuid2", ...},  # 9 users
    "staging": {"U789": "uuid3", ...},
}

def get_cheerful_user_id(slack_user_id: str, env: str) -> str | None:
    return SLACK_USER_MAPPING.get(env, {}).get(slack_user_id)
```

Cheerful tools prefer `request_context.cheerful_user_id` and fall back to the static mapping.

### 6.3 Error Handling Contract

```python
class ToolError(Exception):
    """User-facing error from any tool handler."""
    def __init__(self, message: str): ...
```

All tool errors must raise `ToolError`. The meta-tool layer catches it and returns the message as a string to Claude. Claude then reports the error to the user or tries alternative approaches.

Common patterns:
```python
# Missing credentials:
if not tool_context.onyx_api_key:
    raise ToolError("Onyx is not configured. Missing ONYX_API_KEY.")

# Missing DB context:
if not db_context:
    raise ToolError("Database access required for this operation.")

# API errors:
if response.status_code == 404:
    raise ToolError(f"Meeting {meeting_id} not found in Clarify.")

# Validation:
if not query.strip():
    raise ToolError("Search query cannot be empty.")
```

---

## 7. MCP Tool Specifications (38 Tools)

### 7.1 Slack Tools (Platform.SLACK)

All read-only. Require `tool_context.slack_bot_token` (+ `slack_user_token` for search).

| Tool | Input Parameters | Output Format | Notes |
|------|-----------------|---------------|-------|
| `slack_read_thread` | `channel_id: str`, `thread_ts: str` | `<messages count="N">` with oldest-first, role-marked | Fetches up to 100 replies |
| `slack_read_channel` | `channel_id: str`, `limit: int` (1-100, default 50) | `<messages count="N">` newest-first | General channel history |
| `slack_parse_link` | `slack_link: str` | `<link channel-id="C" message-ts="ts" link-type="message\|file">` | Regex parse permalink |
| `slack_search_messages` | `query: str`, `count: int` (1-100, default 25) | `<messages count="N">` | Requires user token (xoxp-) |

**Output structure:**
```xml
<messages count="3">
  <message channel="#product" user="Alice" ts="1234567890.123456" role="user">
    We decided to push the launch to Thursday
  </message>
  ...
</messages>
```

### 7.2 Fly Tools (Platform.FLY)

Manage ephemeral cloud development sessions. Mix of read and write.

| Tool | Input | Output | Write? |
|------|-------|--------|--------|
| `fly_launch_session` | `template: str`, `region: str`, `cpu_kind: str`, `cpus: int`, `memory_mb: int` | `<launch-result>` with app_name, urls, machine_id | YES |
| `fly_stop_session` | `app_name: str` | `<stop-result>` | YES (deletes app) |
| `fly_get_session_status` | `app_name: str` | `<session>` with state, region, urls | No |
| `fly_list_sessions` | (none) | `<sessions count="N">` | No |
| `fly_list_images` | (none) | `<images>` | No |
| `fly_list_templates` | `user_id: str` (optional) | `<template-catalog>` | No |
| `fly_save_template` | `slug`, `name`, `fly_app`, `description`, `source_repos`, `framework`, `is_public`, `user_id`, `user_name` | `<save-result>` | YES (DB) |
| `fly_delete_template` | `slug: str`, `user_id: str` | `<delete-result>` | YES (DB, creator-only) |

**Session launch flow:**
```
fly_launch_session("cheerful-session", region="iad")
  → get_template_config("cheerful-session")  # Hardcoded system template
  → generate_app_name("cheerful", user_slug)  # e.g., "cheerful-alice-a1b2"
  → Fly API: create app
  → Fly API: allocate dedicated IPv4 + shared IPv6
  → gather_session_secrets()  # ANTHROPIC_API_KEY, FLY_API_TOKEN, GH_TOKEN from bot env
  → merge with template secrets
  → Fly API: create machine (Docker image + resources)
  → Wait for machine to enter "started" state
  → Return {app_name, urls: {ide: "https://...", acp: "https://..."}}
  → On failure: delete app (cleanup)
```

**System templates (hardcoded):**
```python
SYSTEM_TEMPLATES = {
    "cheerful-session": SessionTemplate(
        slug="cheerful-session",
        name="Cheerful Dev Session",
        fly_app="cheerful-session-template",
        features=["code-server (web IDE)", "ACP agent server", "monorepo"],
    )
}
```

### 7.3 Clarify Tools (Platform.CLARIFY)

Access meeting transcripts. All read-only. Require `DatabaseContext`.

| Tool | Input | Output |
|------|-------|--------|
| `clarify_list_meetings` | (none) | `<meetings count="N">` with id, title, attendees, date, has_transcript/summary |
| `clarify_get_transcript` | `meeting_id: str`, `max_lines: int` (optional) | `<transcript>` with speaker-attributed lines |
| `clarify_get_summary` | `meeting_id: str` | `<summary>` AI-generated summary |
| `clarify_search_transcripts` | `query: str`, `limit: int` (default 25) | `<meetings>` keyword search results |

**Data model:**
```python
@dataclass
class ClarifyTranscript:
    meeting_id: str
    title: str
    attendees: list[str]
    duration: int  # seconds
    meeting_date: datetime
    transcript: list[TranscriptLine]  # [{speaker: str, text: str}]
```

### 7.4 ACP Tools (Platform.ACP)

Claude-to-Claude communication. The Slack-bot Claude (context engine) can delegate tasks to Claude instances running in Fly.io sessions.

**ACP** = Anthropic Claude Protocol — HTTP messaging to Fly.io sessions running `acp` server.

| Tool | Input | Output | Side Effects |
|------|-------|--------|--------------|
| `acp_health_check` | `app_name: str` | `<health>` status, clients, model | None |
| `acp_list_tools` | `app_name: str` | `<tools>` list (max 20) | None |
| `acp_send_message` | `app_name: str`, `message: str`, `timeout: int` (10-600s, default 120) | `<response>` | Remote Claude executes |
| `acp_call_tool` | `app_name: str`, `server: str`, `tool: str`, `params: str` (JSON) | `<tool-result>` | Remote tool executes |

**Multi-agent pattern:**
```
Slack user: "@context run analysis on cheerful codebase"
           ↓
Context Engine Claude (claude-opus-4-6)
  → fly_launch_session("cheerful-session") → app_name="cheerful-alice-a1b2"
  → acp_health_check("cheerful-alice-a1b2") → OK
  → acp_send_message("cheerful-alice-a1b2", "Analyze the backend auth flow")
           ↓
Remote Claude (in Fly session) executes
  [reads code, analyzes, responds]
           ↓
  → returns response to context engine Claude
  → context engine Claude synthesizes → Slack reply
```

### 7.5 Onyx Tools (Platform.ONYX)

Query organizational RAG knowledge base. All read-only.

| Tool | Input | Output |
|------|-------|--------|
| `onyx_list_agents` | (none) | `<agents>` with name, description, knowledge/doc sets |
| `onyx_query` | `message: str`, `persona_id: int` (default 0) | `<query-result>` with answer + up to 5 cited documents |

**Auth:** `Authorization: Bearer {onyx_api_key}` header to `{onyx_base_url}/api/...`

**Output:**
```xml
<query-result>
  <answer>The authentication system uses Supabase Auth with...</answer>
  <citations>
    <citation title="Auth Architecture Doc" url="..." excerpt="..."/>
    <citation title="API Security Guidelines" url="..." excerpt="..."/>
  </citations>
</query-result>
```

### 7.6 PostHog Tools (Platform.POSTHOG)

Product analytics queries. All read-only.

| Tool | Input | Key Notes |
|------|-------|-----------|
| `posthog_query` | `query: str` (HogQL), `limit: int` | HogQL = PostHog SQL dialect |
| `posthog_list_event_definitions` | `limit: int` | Volume + query usage stats |
| `posthog_list_property_definitions` | `property_type: str`, `limit: int` | Event or person properties |
| `posthog_list_sessions` | `date_from`, `date_to`, `person_uuid`, `limit`, `offset` | Click/keypress/error counts |
| `posthog_get_session` | `session_id: str` | Full session metadata |
| `posthog_list_insights` | `limit: int` (default 50) | Saved dashboard insights |
| `posthog_get_insight` | `insight_id: int` | Full insight config + data |
| `posthog_list_annotations` | `limit`, `date_from`, `date_to` | Deployment markers, incidents |
| `posthog_list_feature_flags` | `limit: int` | Active flags with rollout % |

**Auth:** `Authorization: Bearer {posthog_api_key}` to `{posthog_host}/api/projects/{project_id}/...`

**HogQL example:**
```sql
SELECT
  event, count() as cnt
FROM events
WHERE timestamp > now() - interval 7 day
GROUP BY event
ORDER BY cnt DESC
LIMIT 20
```

### 7.7 Cheerful Tools (Platform.CHEERFUL)

Access Cheerful campaign/email/creator data. All read-only. Authenticate as the requesting user.

| Tool | Input | Output |
|------|-------|--------|
| `cheerful_list_campaigns` | (none) | `<campaigns>` list |
| `cheerful_search_emails` | `campaign_id: str`, `query: str`, `direction: str?`, `limit: int` (1-50, default 20) | `<threads count="N">` |
| `cheerful_get_thread` | `gmail_thread_id: str` | `<thread-detail>` with all messages |
| `cheerful_find_similar_emails` | `campaign_id: str`, `query: str` OR `thread_id: str`, `limit: int` (1-10), `min_similarity: float` (default 0.3) | `<similar-emails>` with similarity scores |
| `cheerful_list_campaign_creators` | `campaign_id: str`, `gifting_status: str?`, `role: str?`, `limit: int` | `<creators>` |
| `cheerful_get_campaign_creator` | `campaign_id: str`, `creator_id: str` | `<creator-detail>` |
| `cheerful_search_campaign_creators` | `query: str`, `campaign_id: str?`, `limit: int` | `<search-results>` |

**Auth:** `X-Service-Api-Key: {cheerful_api_key}` header + user ID param on all requests.

**Semantic search (`cheerful_find_similar_emails`):** Uses pgvector cosine similarity on 1536-dim embeddings. Can search by text query or find emails similar to a specific thread. Used for "find me other creator emails that look like this one."

---

## 8. System Prompt Specifications

### 8.1 `base.txt` — Main Agent Prompt

Loaded for all non-routed conversations (internal team).

**Structure:**
```
Identity:
  "You are Context, a tool-using assistant for the internal team.
   You have access to Slack, meeting transcripts, analytics, cloud infrastructure,
   knowledge base, and Cheerful campaign data."

Tool Protocol:
  1. Use discover_tools(platforms=[...]) to find available tools
  2. Infer platform from message context (explicit keywords or semantic inference)
  3. Use execute_tool(name, params) to call tools
  4. Multi-step: discover → execute → synthesize → respond
  5. If tool fails, try alternative tools or report what you can't access

Formatting Rules (Slack mrkdwn, NOT standard Markdown):
  - Bold: *text* not **text**
  - Links: <url|text> not [text](url)
  - No headers (## doesn't render in Slack)
  - Dividers: use ───── (en-dash repeated)
  - Lists: use • or -
  - No trailing whitespace

Tone:
  - Direct, no filler ("Certainly!" / "Great question!" forbidden)
  - No emojis unless user uses them first
  - Concise — Slack is not a document editor

Special Capabilities:
  - GitHub: use github_run_gh tool (connects to user's linked GitHub account)
  - Fly sessions: follow platform:fly-sessions skill for launch/manage workflow
  - Multi-agent: can delegate to running Fly sessions via ACP tools
```

### 8.2 `routed_client.txt` — Restricted Client Prompt

Loaded when `routing_decision.is_routed = True` (external client-facing channel).

```
Identity:
  "You are an assistant that answers client questions about the codebase and project
   by querying the knowledge base using Onyx tools."

Scope:
  - Only use Onyx tools (onyx_list_agents, onyx_query)
  - Do not access Slack, Fly, PostHog, Cheerful, or other internal systems
  - If a question can't be answered from the knowledge base, say so clearly

Tone:
  - Professional, client-appropriate
  - Acknowledge when information is unavailable
```

### 8.3 Prompt Selection

```python
def select_prompt(context: PromptSelectionContext) -> str:
    if context.is_routed:
        return load_prompt("routed_client.txt")
    return load_prompt("base.txt")
```

---

## 9. Thread Context Persistence

### 9.1 `ThreadToolContext` Schema

```python
class ThreadToolContext(BaseModel):
    id: int | None              # DB primary key (None before insert)
    thread_id: str              # Slack thread_ts — unique per thread
    tool_slugs: list[str]       # Tool names used/available in this thread
    session_uuid: str           # Langfuse session grouping ID (UUID4)
    user_id: str                # Slack user_id who started thread
    channel_id: str             # Parent channel_id
    created_at: datetime | None
    updated_at: datetime | None
```

**Purpose:** Enables thread continuity. When a user continues a Slack thread conversation, the same tools are available (loaded from DB) without re-discovering. Tools accumulate additively — never removed once a platform is mentioned.

**DB table:** `thread_tool_context` in the context engine's Supabase instance.

### 9.2 Repository Operations

```python
class ThreadToolContextRepository:
    async def get_by_thread_id(self, thread_id: str, session: Session) -> ThreadToolContext | None
    async def create(self, context: ThreadToolContext, session: Session) -> ThreadToolContext
    async def update(self, context: ThreadToolContext, session: Session) -> ThreadToolContext
    async def upsert(self, context: ThreadToolContext, session: Session) -> ThreadToolContext
```

---

## 10. Observability

### 10.1 Langfuse Integration

```python
# langfuse_logging.py
async def log_agent_trace(
    langfuse_client: Langfuse,
    session_uuid: str,
    user_id: str,
    result: AgentResult,
) -> None
```

Each Slack conversation = one Langfuse session:
- `session_id` = `session_uuid` (persisted in `ThreadToolContext`, same across turns)
- `user_id` = Slack user_id
- One trace per message, all linked to same session
- Traces contain: full message, all tool calls (input + output), final response, token counts

Langfuse lets developers inspect exactly what Claude saw, what tools it called, and what it received — critical for debugging wrong or hallucinated responses.

### 10.2 Live Status Indicator

The `_StatusUpdater` in `handlers.py` provides real-time feedback:

```python
class _StatusUpdater:
    async def start(self, placeholder_ts: str) -> None:
        # Begin background update loop

    async def add_event(self, icon: str, text: str) -> None:
        # Add event to state machine + update Slack (rate-limited 1.5s)

    async def finalize(self, success: bool) -> None:
        # Final update, cancel background loop
```

This is critical UX — Claude agent execution can take 30-90 seconds. Without live updates, users don't know if the bot is working or broken.

---

## 11. Configuration Reference

### 11.1 Environment Variables

| Env Var | Required | Purpose |
|---------|----------|---------|
| `SLACK_BOT_TOKEN` | Yes | xoxb-... for Slack API calls |
| `SLACK_APP_TOKEN` | Yes | xapp-... for Socket Mode WebSocket |
| `SLACK_SIGNING_SECRET` | Yes | Request verification |
| `SLACK_USER_TOKEN` | Yes | xoxp-... for search API (user-token required) |
| `DATABASE_URL` | Yes | Supabase PostgreSQL for thread_tool_context |
| `ANTHROPIC_API_KEY` | Yes | Claude Agent SDK |
| `LANGFUSE_PUBLIC_KEY` | Yes | Langfuse observability |
| `LANGFUSE_SECRET_KEY` | Yes | Langfuse observability |
| `FLY_API_TOKEN` | No | Fly session management |
| `FLY_ORG_SLUG` | No | Fly organization |
| `ONYX_API_KEY` | No | Knowledge base queries |
| `ONYX_BASE_URL` | No | Knowledge base URL |
| `POSTHOG_API_KEY` | No | Analytics queries |
| `POSTHOG_PROJECT_ID` | No | Analytics project scope |
| `POSTHOG_HOST` | No | PostHog instance URL |
| `CLARIFY_API_KEY` | No | Meeting transcripts |
| `CLARIFY_WORKSPACE_ID` | No | Meeting workspace |
| `CHEERFUL_API_URL` | No | Cheerful backend URL |
| `CHEERFUL_API_KEY` | No | Cheerful service API key |
| `DEPLOY_ENVIRONMENT` | No | "production"\|"staging"\|"development" |
| `CHANNEL_MAPPINGS` | No | JSON dict of source→target channel routing |

Optional services degrade gracefully: missing credentials → `ToolError` from that platform's tools, not startup failure.

---

## 12. Deployment

**Service:** Standalone Fly.io app (`context-engine`)
**Process type:** Single long-running Python process (Socket Mode)
**Startup:** `python -m src_v2.entrypoints.slack.main`

**Resource requirements:**
- Memory: Low (Claude SDK calls are async HTTP, no heavy computation)
- Concurrency: Socket Mode handles multiple simultaneous messages
- DB: NullPool (short-lived connections only — never idle)

**Fly.io configuration:**
```toml
[processes]
  app = "python -m src_v2.entrypoints.slack.main"

[[services]]
  internal_port = 8080
  protocol = "tcp"
```

**Docker image:** Includes Claude Code CLI baked in (for Fly session operations).

---

## 13. Key Design Decisions

### Decision 1: Meta-Tool Pattern (Temporary)

**Problem:** 38 tools × average tool schema ≈ too many tokens in every Claude prompt.
**Solution:** 2 meta-tools (`discover_tools` + `execute_tool`) wrap the entire catalog. Claude sees minimal tool definitions, then requests the tools it needs.
**Tradeoff:** Adds one extra LLM step (discover before execute). Worth it for token savings.
**Future:** Will be replaced by Anthropic's Tool Search Tool (issue #525).

### Decision 2: FCIS Architecture

**Problem:** Async code with Slack SDK and DB calls is hard to test.
**Solution:** Pure functions in `core/` (no I/O), impure shell in `entrypoints/` and `services/`.
**Benefit:** Core functions (`routing.py`, `selection.py`, `history.py`, `chunking.py`) test without mocks.

### Decision 3: Two-Session DB Pattern

**Problem:** Supabase PgBouncer kills idle connections; Claude takes 30-90s.
**Solution:** Read context (Session 1), release, run Claude, write context (Session 2).
**Invariant:** No DB connection held during LLM inference.

### Decision 4: Additive Tool Merging

**Problem:** If user asks about Slack in message 1 and PostHog in message 2, message 2 should still have Slack tools.
**Solution:** `merge_tool_slugs()` is a union, not replacement. Tools accumulate per-thread.
**Benefit:** Natural conversational continuity without re-discovery every message.

### Decision 5: XML Output for All Tools

**Problem:** How should tools return data to Claude?
**Solution:** All 38 tools return XML strings.
**Reasoning:** Claude's training makes it effective at parsing XML with semantic tags. XML attributes carry metadata (counts, status). Consistent format simplifies tool development.

### Decision 6: Keyword Filtering (Currently Disabled)

**Why it exists:** Could reduce tokens by giving Claude only relevant-platform tools.
**Why it's disabled:** Risk of wrong keyword matching causing tools to be missing. With Langfuse, full tool set is debuggable. Token cost is acceptable.
**Re-enable path:** Set `TOOL_FILTERING_ENABLED = True` in `selection.py`.

### Decision 7: Routed Client Mode

**Why:** Some Slack channels are client-facing. External clients shouldn't have internal system access.
**How:** Channel mapping (env var) routes messages to an internal channel with a restricted Onyx-only prompt.
**UX:** Client sees a response from a dedicated bot; internal team sees the forwarded conversation.

### Decision 8: Thread History Limit (50 Replies)

**Why 50:** Balance between context quality and token cost. Old thread history provides diminishing returns. `ThreadToolContext` provides the tool-continuity that matters most.
**Implementation:** `conversations_replies` with `limit=50`.

### Decision 9: Static Slack→Cheerful User Mapping

**Why static:** Supabase Auth IDs don't appear in Slack events. Dynamic lookup would require an API call on every message.
**Tradeoff:** New team members must be added manually to `constants.py`.
**Future:** Could be replaced with a DB lookup at startup that caches the mapping.

### Decision 10: bypassPermissions Mode

**Why:** Context Engine Claude calls tools that perform infrastructure operations (launch Fly sessions, delete sessions). Sandbox mode would block these.
**Risk mitigation:** Filesystem tools (`Read`, `Write`, `Edit`) are not available (not in allowed_tools). Only meta-tools MCP server is mounted.

---

## 14. Developer Onboarding Notes

**To add a new platform:**
1. Add `Platform.NEW_PLATFORM` to `mcp/tags.py`
2. Add keyword → platform mapping in `core/selection.py` (for when filtering is re-enabled)
3. Create `mcp/tools/new_platform/` with `api.py` (HTTP layer) + `tools.py` (handler functions)
4. Add `@tool` decorated functions to `tools.py`
5. Import and add to `ALL_TOOLS` in `mcp/catalog.py`
6. Add credentials to `mcp/context.py` ToolContext + `bootstrap/config.py` AppSettings
7. Add env vars to Fly.io secrets

**To add a new tool to an existing platform:**
1. Add `@tool` function in the platform's `tools.py`/`read.py`
2. Add to `ALL_TOOLS` in `mcp/catalog.py`
3. No other changes needed — discovery and dispatch are automatic

**To test a tool locally:**
```python
# Tools are pure async functions — test without Slack or full app
tool_context = ToolContext(slack_bot_token="xoxb-test", ...)
params = SlackReadChannelParams(channel_id="C123", limit=10)
result = await slack_read_channel(tool_context, None, None, params)
assert "<messages" in result
```
