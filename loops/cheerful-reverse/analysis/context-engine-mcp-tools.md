# Context Engine MCP Tools Analysis

## Overview

The context engine exposes **38 tools** across **7 platform integrations** via the Model Context Protocol (MCP). These tools are the primary mechanism through which Claude (running in the context engine) interacts with external services on behalf of users. Tools are invoked during Slack conversations and Fly.io session interactions.

**User Problem Solved**: Users need a conversational AI assistant that can take actions across many systems (analytics, email campaigns, meeting data, cloud infrastructure) without switching apps. The MCP tool layer enables Claude to act as a universal operator across the entire tech stack.

---

## Architecture

### Core Files

| File | Purpose |
|------|---------|
| `app/src_v2/mcp/registry.py` | Tool registration, validation, invocation infrastructure |
| `app/src_v2/mcp/catalog.py` | Master list of all 38 tools; factory for creating registry |
| `app/src_v2/mcp/context.py` | Context dataclasses injected into every tool handler |
| `app/src_v2/mcp/tags.py` | Platform and Action enums for tool categorization |
| `app/src_v2/mcp/meta_tools.py` | Dynamic tool discovery wrapper |

### `ToolDef` Dataclass (`registry.py:41-67`)

Frozen dataclass representing a registered tool:

```python
@dataclass(frozen=True)
class ToolDef:
    description: str
    input_model: Type[BaseModel]   # Pydantic model for input validation
    tags: frozenset[Platform | Action]
    handler: AsyncCallable         # async (tool_context, db_context, request_context, params) -> str

    @property
    def name(self) -> str:         # Derived from handler function name

    @property
    def input_schema(self) -> dict: # JSON Schema from input_model
```

### `ToolRegistry` Class (`registry.py:69-112`)

- `register(tool_def)` — Adds tool, raises `ValueError` on duplicate names
- `list_tools(platforms)` — Filter tools by Platform tags
- `call_tool(name, params, request_context)` — Validates params via Pydantic, calls handler with injected context
- `get_tool_names()` — Returns all registered tool names

### `@tool` Decorator (`registry.py:115-154`)

Decorator factory that:
1. Introspects function signature to extract Pydantic `input_model` from `params` type hint
2. Returns a `ToolDef` (replaces the original function)
3. Enforces signature: `async def name(tool_context, db_context, request_context, params) -> str`

### Context Injection (`context.py:1-64`)

Three context dataclasses passed into every tool handler:

**`ToolContext`** (`context.py:14-40`) — Credentials/clients (always provided):
```
slack_bot_token, slack_user_token
fly_api_token, fly_org_slug
anthropic_api_key, gh_token (forwarded to Fly sessions)
onyx_api_key, onyx_base_url
posthog_api_key, posthog_project_id, posthog_host
cheerful_api_url, cheerful_api_key
deploy_environment: "production" | "staging" | "development"
```

**`DatabaseContext`** (`context.py:44-51`) — Optional, DB-backed tools only:
```
session_factory: Callable → SQLAlchemy Session
```

**`RequestContext`** (`context.py:55-63`) — Optional, per-request user identity:
```
slack_user_id: str
cheerful_user_id: str
```

### Tag System (`tags.py:1-36`)

```python
class Platform(Enum): SLACK, CLARIFY, ACP, FLY, ONYX, POSTHOG, CHEERFUL
class Action(Enum):   READ, WRITE, HEALTH, SESSION, TOOLS, COMMUNICATION
```

Used by `list_tools(platforms)` to return only relevant tools per conversation type.

### Meta-Tools (`meta_tools.py:1-79`)

Temporary wrapper until Anthropic Tool Search Tool is available:
- `DiscoverFn`: `(platforms: list[Platform]) -> list[ToolSchema]`
- `ExecuteFn`: `(name: str, params: dict) -> Awaitable[str]`
- `create_meta_tools()`: Returns `(discover_tools, execute_tool)` closures

These allow Claude to dynamically discover and call tools without having all 38 loaded at once.

### Catalog (`catalog.py:60-118`)

Master `ALL_TOOLS` list with 38 `ToolDef` instances. `create_tool_registry()` factory registers all tools at startup.

**Tool counts by platform:**
- Slack: 4 | Fly: 8 | Clarify: 4 | ACP: 4 | Onyx: 2 | PostHog: 9 | Cheerful: 7

---

## Platform Tool Specifications

### 1. Slack Tools (`tools/slack/`)

**Purpose**: Read Slack workspace data during conversations. Users can ask the bot to summarize threads, search for messages, or extract information from shared links.

**API Layer** (`tools/slack/api.py`):
- `parse_slack_link(url)` — Regex parse Slack permalink → `{channel_id, message_ts, link_type}`
- `get_channel_history(channel_id, limit=50)` — Fetch recent messages (newest-first)
- `get_thread_replies(channel_id, thread_ts, limit=100)` — Fetch thread conversation
- `search_messages(query, count=25)` — Slack search syntax, requires user token (xoxp-)
- `get_channel_info(channel_id)` — Channel metadata (name, topic)

**Tools** (`tools/slack/read.py`):

| Tool | Input | Output | Side Effects |
|------|-------|--------|--------------|
| `slack_read_thread` | `channel_id`, `thread_ts` | XML `<messages>` (oldest-first, role-marked) | None (read-only) |
| `slack_read_channel` | `channel_id`, `limit` (1-100, default 50) | XML `<messages>` (oldest-first) | None |
| `slack_parse_link` | `slack_link` | XML with `channel-id`, `message-ts`, `link-type` | None |
| `slack_search_messages` | `query`, `count` (1-100, default 25) | XML search results | None |

All tools: **READ-only**.

---

### 2. Fly Tools (`tools/fly/`)

**Purpose**: Manage ephemeral development sessions. Users can launch, monitor, and stop cloud IDE sessions from Slack without touching a terminal.

**Models** (`tools/fly/models.py`):
```
SessionTemplate: slug, name, fly_app, features, created_by, is_public, timestamps, launch_count
LaunchResult: app_name, template, region, urls, machine_id
SessionStatus: app_name, state, region, machine_id, urls
```

**System Templates** (hardcoded in `api.py`):
- `cheerful-session` — Web IDE (code-server) + ACP agent server + monorepo

**Key API Functions** (`tools/fly/api.py`):

- `gather_session_secrets()` (`api.py:36-47`) — Extracts bot-level secrets (ANTHROPIC_API_KEY, FLY_API_TOKEN, GH_TOKEN) for injection into sessions
- `get_template_config()` (`api.py:74-124`) — Looks up system templates first, then DB; validates visibility
- `launch_session()` (`api.py:127-219`) — Full flow: get config → generate app name → create app → allocate IPs → merge secrets → create machine → wait for startup. Cleans up on failure.
- `stop_session()` (`api.py:222-233`) — Deletes app entirely
- `get_session_status()` (`api.py:236-268`) — Returns machine state and URLs
- `list_sessions()` (`api.py:271-301`) — Filters `cheerful-*` apps (excludes template apps)
- `save_template()` (`api.py:353-428`) — Validates slug format, checks ownership, validates fly_app exists
- `delete_template()` (`api.py:431-458`) — Creator-only deletion

**Tools** (`tools/fly/tools.py`):

| Tool | Input | Output | Side Effects |
|------|-------|--------|--------------|
| `fly_launch_session` | `template`, `region`, `cpu_kind`, `cpus`, `memory_mb` | XML `<launch-result>` | Creates Fly app + machine, allocates IPs, injects secrets |
| `fly_stop_session` | `app_name` | XML `<stop-result>` | Deletes Fly app completely |
| `fly_get_session_status` | `app_name` | XML `<session>` | None |
| `fly_list_sessions` | (none) | XML `<sessions>` | None |
| `fly_list_images` | (none) | XML `<images>` | None |
| `fly_list_templates` | `user_id` (optional) | XML `<template-catalog>` | None |
| `fly_save_template` | `slug`, `name`, `fly_app`, `description`, `source_repos` (comma-sep), `framework`, `is_public`, `user_id`, `user_name` | XML `<save-result>` | DB insert/update |
| `fly_delete_template` | `slug`, `user_id` | XML `<delete-result>` | DB delete |

---

### 3. Clarify Tools (`tools/clarify/`)

**Purpose**: Access meeting recordings and transcripts. Users can ask the bot to recall what was discussed in meetings, search for decisions, or retrieve summaries.

**Models** (`tools/clarify/models.py`):
```
TranscriptLine: {speaker, text}
ClarifyMeeting: {meeting_id, title, attendees, duration, meeting_date, has_transcript, has_summary}
ClarifyTranscript: {meeting_id, title, attendees, duration, meeting_date, transcript: list[TranscriptLine]}
ClarifyMeetingSummary: {meeting_id, title, summary}
```

**API Layer** (`tools/clarify/api.py`):
- `list_meetings()` — All meetings
- `get_transcript(meeting_id)` — Full transcript with speaker attribution; raises ToolError if not found
- `get_summary(meeting_id)` — AI-generated summary; raises ToolError if not found
- `search_transcripts(query, limit=25)` — Keyword search; raises ToolError on empty query

**Tools** (`tools/clarify/read.py`):

| Tool | Input | Output | Side Effects |
|------|-------|--------|--------------|
| `clarify_list_meetings` | (none) | XML `<meetings>` | None; requires DatabaseContext |
| `clarify_get_transcript` | `meeting_id`, `max_lines` (optional) | XML `<transcript>` | None |
| `clarify_get_summary` | `meeting_id` | XML `<summary>` | None |
| `clarify_search_transcripts` | `query`, `limit` (default 25) | XML `<meetings>` | None |

All tools: **READ-only**. Require `DatabaseContext` (raises ToolError if absent).

---

### 4. ACP Tools (`tools/acp/`)

**Purpose**: Claude-to-Claude communication. The context engine (Slack bot Claude) can delegate tasks to Claude instances running in Fly.io sessions, enabling multi-agent workflows where one Claude spawns and directs another.

**ACP** = Anthropic Claude Protocol — proprietary Claude-to-Claude messaging protocol over HTTP to Fly.io sessions.

**Tools** (`tools/acp/tools.py`):

| Tool | Input | Output | Tags | Side Effects |
|------|-------|--------|------|--------------|
| `acp_health_check` | `app_name` (Fly app or local address) | XML `<health>` (status, clients, model) | ACP, SESSION, HEALTH | None |
| `acp_list_tools` | `app_name` | XML `<tools>` (max 20 shown) | ACP, SESSION, TOOLS | None |
| `acp_send_message` | `app_name`, `message`, `timeout` (10-600s, default 120) | XML `<response>` | ACP, SESSION, COMMUNICATION | Sends to remote Claude; may trigger remote side effects |
| `acp_call_tool` | `app_name`, `server` (e.g., "marimo"), `tool`, `params` (JSON string) | XML `<tool-result>` | ACP, SESSION, TOOLS | Executes tool on remote session |

**Output formatters**: `_fmt_health()`, `_fmt_tools()`, `_fmt_message_result()`, `_fmt_tool_result()`

---

### 5. Onyx Tools (`tools/onyx/`)

**Purpose**: Query organizational knowledge base via RAG. Users can ask questions answered from internal documents, wikis, and data sources indexed in Onyx.

**Onyx** = Open-source RAG/knowledge base service. Credentials: `onyx_api_key`, `onyx_base_url` from ToolContext.

**Tools** (`tools/onyx/query.py`):

| Tool | Input | Output | Side Effects |
|------|-------|--------|--------------|
| `onyx_list_agents` | (none) | XML `<agents>` (name, description, knowledge/doc sets) | None |
| `onyx_query` | `message`, `persona_id` (default 0) | XML `<query-result>` with answer + up to 5 cited documents | None |

All tools: **READ-only**.

---

### 6. PostHog Tools (`tools/posthog/`)

**Purpose**: Query product analytics. Users can ask about user behavior, funnel metrics, feature flag status, and session recordings without opening the PostHog dashboard.

**API Layer** (`tools/posthog/api.py`):

Auth: `Authorization: Bearer {api_key}` header.

- `query_hogql(query, limit=100)` — Execute HogQL (PostHog SQL dialect) → `{columns, results, hasMore}`
- `list_event_definitions(limit)` → `{results: [{name, volume_30_day, query_usage_30_day}]}`
- `list_property_definitions(property_type="event"|"person", limit)` → `{results: [{name, property_type, query_usage_30_day}]}`
- `list_session_recordings(date_from, date_to, person_uuid, limit, offset)` → recordings with click/keypress/error counts
- `get_session_recording(session_id)` → full session metadata
- `list_insights(limit, saved=True)` → `{results: [{id, name, description, filters, last_refresh}]}`
- `get_insight(insight_id)` → full insight config + result data
- `list_annotations(limit, date_from, date_to)` → deployment markers/incident notes
- `list_feature_flags(limit)` → `{results: [{id, key, name, active, rollout_percentage}]}`

**Tools** (`tools/posthog/tools.py`):

| Tool | Input | Output | Side Effects |
|------|-------|--------|--------------|
| `posthog_query` | `query` (HogQL), `limit` (default 100) | XML `<query-result>` | None |
| `posthog_list_event_definitions` | `limit` (default 100) | XML `<event-definitions>` | None |
| `posthog_list_property_definitions` | `property_type`, `limit` | XML `<property-definitions>` | None |
| `posthog_list_sessions` | `date_from`, `date_to`, `person_uuid`, `limit`, `offset` | XML `<recordings>` | None |
| `posthog_get_session` | `session_id` | XML `<recording>` | None |
| `posthog_list_insights` | `limit` (default 50) | XML `<insights>` | None |
| `posthog_get_insight` | `insight_id` (int) | XML `<insight-detail>` | None |
| `posthog_list_annotations` | `limit`, `date_from`, `date_to` | XML `<annotations>` | None |
| `posthog_list_feature_flags` | `limit` (default 100) | XML `<feature-flags>` | None |

All tools: **READ-only**.

---

### 7. Cheerful Tools (`tools/cheerful/`)

**Purpose**: Access email campaign data from Slack. Users can query campaign status, search email threads, look up creator details, and find semantically similar emails without logging into the webapp.

**User Mapping** (`tools/cheerful/constants.py`):
- 9 Slack user IDs mapped to Cheerful UUIDs per environment (staging/production)
- Used as fallback when RequestContext lacks `cheerful_user_id`

**API Layer** (`tools/cheerful/api.py`):

Auth: `X-Service-Api-Key` header.

- `list_campaigns(user_id)` → list of campaign dicts
- `search_threads(user_id, campaign_id, query, direction, limit=20)` → thread dicts
- `get_thread(user_id, gmail_thread_id)` → full thread with all messages
- `list_campaign_creators(user_id, campaign_id, gifting_status, role, limit=50)` → `{creators, total}`
- `get_campaign_creator(user_id, campaign_id, creator_id)` → full creator object
- `search_creators(user_id, query, campaign_id, limit=20)` → `{results: [creators]}`
- `find_similar(user_id, campaign_id, query OR thread_id, limit=5, min_similarity=0.3)` → similar emails with similarity scores (pgvector RAG)

**Tools** (`tools/cheerful/tools.py`):

| Tool | Input | Output | Side Effects |
|------|-------|--------|--------------|
| `cheerful_list_campaigns` | (none) | XML `<campaigns>` | None |
| `cheerful_search_emails` | `campaign_id`, `query`, `direction` (optional), `limit` (1-50, default 20) | XML `<threads>` | None |
| `cheerful_get_thread` | `gmail_thread_id` | XML `<thread-detail>` | None |
| `cheerful_find_similar_emails` | `campaign_id`, `query` OR `thread_id`, `limit` (1-10), `min_similarity` (default 0.3) | XML `<similar-emails>` | None |
| `cheerful_list_campaign_creators` | `campaign_id`, `gifting_status` (optional), `role` (optional), `limit` | XML `<creators>` | None |
| `cheerful_get_campaign_creator` | `campaign_id`, `creator_id` | XML `<creator-detail>` | None |
| `cheerful_search_campaign_creators` | `query`, `campaign_id` (optional), `limit` | XML `<search-results>` | None |

All tools: **READ-only**.

---

## Complete Tool Inventory (38 tools)

| # | Platform | Tool Name | Action Tags | Write? |
|---|----------|-----------|-------------|--------|
| 1 | Slack | `slack_read_thread` | READ | No |
| 2 | Slack | `slack_read_channel` | READ | No |
| 3 | Slack | `slack_parse_link` | READ | No |
| 4 | Slack | `slack_search_messages` | READ | No |
| 5 | Fly | `fly_launch_session` | SESSION, WRITE | Yes |
| 6 | Fly | `fly_stop_session` | SESSION, WRITE | Yes |
| 7 | Fly | `fly_get_session_status` | SESSION, READ | No |
| 8 | Fly | `fly_list_sessions` | SESSION, READ | No |
| 9 | Fly | `fly_list_images` | READ | No |
| 10 | Fly | `fly_list_templates` | READ | No |
| 11 | Fly | `fly_save_template` | WRITE | Yes (DB) |
| 12 | Fly | `fly_delete_template` | WRITE | Yes (DB) |
| 13 | Clarify | `clarify_list_meetings` | READ | No |
| 14 | Clarify | `clarify_get_transcript` | READ | No |
| 15 | Clarify | `clarify_get_summary` | READ | No |
| 16 | Clarify | `clarify_search_transcripts` | READ | No |
| 17 | ACP | `acp_health_check` | SESSION, HEALTH | No |
| 18 | ACP | `acp_list_tools` | SESSION, TOOLS | No |
| 19 | ACP | `acp_send_message` | SESSION, COMMUNICATION | Remote side effects |
| 20 | ACP | `acp_call_tool` | SESSION, TOOLS | Remote side effects |
| 21 | Onyx | `onyx_list_agents` | READ | No |
| 22 | Onyx | `onyx_query` | READ | No |
| 23 | PostHog | `posthog_query` | READ | No |
| 24 | PostHog | `posthog_list_event_definitions` | READ | No |
| 25 | PostHog | `posthog_list_property_definitions` | READ | No |
| 26 | PostHog | `posthog_list_sessions` | READ | No |
| 27 | PostHog | `posthog_get_session` | READ | No |
| 28 | PostHog | `posthog_list_insights` | READ | No |
| 29 | PostHog | `posthog_get_insight` | READ | No |
| 30 | PostHog | `posthog_list_annotations` | READ | No |
| 31 | PostHog | `posthog_list_feature_flags` | READ | No |
| 32 | Cheerful | `cheerful_list_campaigns` | READ | No |
| 33 | Cheerful | `cheerful_search_emails` | READ | No |
| 34 | Cheerful | `cheerful_get_thread` | READ | No |
| 35 | Cheerful | `cheerful_find_similar_emails` | READ | No |
| 36 | Cheerful | `cheerful_list_campaign_creators` | READ | No |
| 37 | Cheerful | `cheerful_get_campaign_creator` | READ | No |
| 38 | Cheerful | `cheerful_search_campaign_creators` | READ | No |

**Write tools: 4** (fly_launch_session, fly_stop_session, fly_save_template, fly_delete_template)
**Read-only tools: 34**

---

## Error Handling

**`ToolError`** (`registry.py:24-29`) — User-facing error raised by any tool:
- Caught by meta-tools, returned as error text to Claude
- Used for: missing credentials, missing DB context, API failures, validation errors, resource not found, ownership violations

Common patterns:
```python
if not tool_context.some_api_key:
    raise ToolError("Missing credentials for X service")

if not db_context:
    raise ToolError("Database context required")

# API errors translated:
raise ToolError(f"API returned {status}: {message}")
```

---

## Design Patterns

1. **Stateless handlers** — No global state; all credentials/context via parameters
2. **Async throughout** — All handlers `async` for I/O concurrency
3. **Pydantic validation** — Input validation happens before handler invocation in registry
4. **Separation of concerns** — `api.py` (HTTP layer) separate from `tools.py`/`read.py` (Claude interface)
5. **XML output** — All tools return XML-formatted strings; Claude parses structured XML for downstream reasoning
6. **Tag-based filtering** — Platform tags enable dynamic tool set selection per conversation context
7. **Ownership enforcement** — Fly template operations validate creator ownership
8. **User identity resolution** — Cheerful tools use `RequestContext.cheerful_user_id` with fallback to hardcoded Slack→UUID mapping
9. **Meta-tool pattern** — Dynamic tool discovery defers full tool list loading; designed for future Anthropic Tool Search Tool integration
10. **Context injection by registry** — Handlers never fetch their own credentials; always injected by registry at call time

---

## Key Design Decision: Why XML Output?

All 38 tools return XML strings rather than Python dicts or JSON. This is intentional:
- Claude's training makes it effective at parsing XML in context
- XML attributes carry metadata (counts, status) alongside content
- XML tags serve as semantic markers Claude can reference in reasoning
- Consistent format reduces per-tool parsing logic in the agent loop
