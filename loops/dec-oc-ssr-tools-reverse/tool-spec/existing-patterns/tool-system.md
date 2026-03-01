# Daimon Tool System — Patterns for SSR Tool Implementation

> Source: `apps/bot/src_v2/mcp/registry.py`, `mcp/catalog.py`, `mcp/context.py`, `mcp/tags.py`, `core/xml.py`, `mcp/tools/CLAUDE.md`
> Analyzed: 2026-03-01

---

## Overview

Daimon uses a custom, lightweight tool registry that replaces FastMCP. Tools are defined with the `@tool` decorator, stored as `ToolDef` dataclass instances in a `ToolRegistry`, and dispatched via `call_tool()` which injects `ToolContext`, `UserContext`, and `DatabaseContext`.

Every tool must:
1. Be defined as an `async def` with the exact four-parameter signature
2. Use a Pydantic `BaseModel` subclass for its `params` argument
3. Return `str`
4. Be imported into `catalog.py` and added to `ALL_TOOLS`

---

## 1. The `@tool` Decorator

**Location**: `apps/bot/src_v2/mcp/registry.py`

```python
def tool(
    description: str,
    tags: AbstractSet[Platform | Action | Scope],
    requires_credential: CredentialPlatform | None = None,
) -> Callable[..., ToolDef]:
```

The decorator:
- Takes `description`, `tags`, and optional `requires_credential`
- Introspects the decorated function's type hints to extract the `params` argument's type (must be a `BaseModel` subclass)
- Returns a `ToolDef` dataclass — **not the original function**
- The resulting `ToolDef` is a module-level variable with the function's `__name__` as its tool name

### Usage pattern

```python
from src_v2.mcp.registry import tool, ToolError
from src_v2.mcp.tags import Action, Platform
from src_v2.mcp.context import DatabaseContext, ToolContext, UserContext
from pydantic import BaseModel, Field

class MyInput(BaseModel):
    some_field: str = Field(description="What this field does")
    optional_field: int = Field(default=10, ge=1, le=100, description="Bounded integer")

@tool(
    description="One-sentence description of what this tool does and when to use it.",
    tags={Platform.DISCORD, Action.READ},
)
async def my_tool_name(
    tool_context: ToolContext,
    user_context: UserContext,
    db_context: DatabaseContext | None,
    params: MyInput,
) -> str:
    ...
    return result_string
```

After decoration, `my_tool_name` is a `ToolDef` instance, not a callable function.

---

## 2. `ToolDef` Dataclass

**Location**: `apps/bot/src_v2/mcp/registry.py`

```python
@dataclass(frozen=True)
class ToolDef:
    description: str                                    # Human+Claude-facing description
    input_model: type[BaseModel]                        # Pydantic model class for params
    tags: AbstractSet[Platform | Action | Scope]        # Filtering and display tags
    handler: Callable[..., Awaitable[str]]              # The async function
    requires_credential: CredentialPlatform | None = None  # Optional credential gate

    @property
    def name(self) -> str:
        """Derived from handler.__name__. Must be unique across all tools."""
        return self.handler.__name__

    @property
    def input_schema(self) -> dict[str, Any]:
        """JSON Schema produced from input_model.model_json_schema()."""
        return self.input_model.model_json_schema()
```

Key implications for SSR tools:
- Tool names are **function names**. Use `ssr_panel_create`, `ssr_panel_run`, `ssr_panel_results`, etc.
- `input_schema` is auto-generated from the Pydantic model — field descriptions in `Field(description=...)` become the JSON schema descriptions Claude sees.
- `requires_credential` can gate a tool behind a linked platform account. SSR tools do not require user credentials (they use system-level Anthropic API key from `ToolContext`).

---

## 3. `ToolError`

**Location**: `apps/bot/src_v2/mcp/registry.py`

```python
class ToolError(Exception):
    """Error raised by tools for user-facing error messages."""
```

- Simple `Exception` subclass
- Raise when the tool cannot complete due to user error or missing state
- The error message string is returned to Claude as error text
- Do NOT raise for internal/unexpected errors — those should propagate normally

### Usage

```python
raise ToolError("Panel 'abc-123' not found. Use ssr_panel_list to see available panels.")
raise ToolError("Panel size must be between 5 and 100.")
raise ToolError("stimulus_text exceeds 4000 character limit.")
```

---

## 4. `ToolRegistry`

**Location**: `apps/bot/src_v2/mcp/registry.py`

```python
class ToolRegistry:
    def __init__(self, tool_context: ToolContext, db_context: DatabaseContext | None = None) -> None: ...
    def register(self, tool_def: ToolDef) -> None: ...  # Raises ValueError on duplicate
    def list_tools(self, platforms: set[Platform] | None = None) -> list[ToolDef]: ...
    async def call_tool(self, name: str, params: dict[str, Any], user_context: UserContext) -> str: ...
    def get_tool_names(self) -> list[str]: ...
```

`call_tool()` flow:
1. Look up `ToolDef` by name (raises `ToolNotFoundError` if missing)
2. Check `requires_credential` gate (raises `ToolError` with link instructions if not met)
3. Check `Scope` tags (raises `ToolError` if user lacks role)
4. Validate `params` dict via `tool_def.input_model.model_validate(params)`
5. Call `handler(tool_context, user_context, db_context, validated_params)`

---

## 5. `ToolContext`

**Location**: `apps/bot/src_v2/mcp/context.py`

```python
@dataclass(frozen=True)
class ToolContext:
    discord_token: str            # Discord bot token
    discord_guild_id: str         # Discord guild/server ID
    fly_api_token: str            # Fly.io API token
    fly_org_slug: str             # Fly.io organization slug
    onyx_api_key: str             # Onyx RAG service API key
    onyx_base_url: str            # Onyx API base URL
    toggl_workspace_id: int       # Toggl workspace ID
    toggl_organization_id: int    # Toggl organization ID
    anthropic_api_key: str        # Anthropic API key ← SSR tools use this
    supabase_url: str             # Supabase project URL
    supabase_service_role_key: str  # Supabase service role key
```

**For SSR tools**: Use `tool_context.anthropic_api_key` to call Claude for persona generation, stimulus presentation, and response elicitation. No new `ToolContext` fields are needed.

---

## 6. `DatabaseContext`

**Location**: `apps/bot/src_v2/mcp/context.py`

```python
@dataclass(frozen=True)
class DatabaseContext:
    session_factory: Callable[[], Session]  # Returns a SQLAlchemy Session
```

### Usage pattern in tools

```python
async def my_tool(
    tool_context: ToolContext,
    user_context: UserContext,
    db_context: DatabaseContext | None,
    params: MyInput,
) -> str:
    if not db_context:
        raise ToolError("Database not available.")

    session = db_context.session_factory()
    # Use session for synchronous SQLAlchemy queries
    result = my_repo.get_by_id(session, params.some_id)
    ...
```

The session is synchronous SQLAlchemy (`sqlalchemy.orm.Session`). Repository functions are flat functions that take a `Session` and return Pydantic models.

**SSR tools will always require `db_context`** since they read/write panel state. Always check `if not db_context` and raise `ToolError`.

---

## 7. `UserContext`

**Location**: `apps/bot/src_v2/mcp/context.py`

```python
@dataclass(frozen=True)
class UserContext:
    user_id: uuid.UUID | None     # Supabase Auth user ID (None if not linked)
    discord_id: str               # Discord user ID (always available)
    credentials: dict[CredentialPlatform, str]  # Platform → decrypted token
    credential_metadata: dict[CredentialPlatform, dict[str, Any]]  # Extra metadata
    impersonating_user_id: uuid.UUID | None  # Set during admin impersonation

    @property
    def is_authenticated(self) -> bool:
        return self.user_id is not None
```

**For SSR tools**: `user_context.discord_id` identifies whose panel is being created/run. SSR tools do not require authentication (no `requires_credential`), so `user_id` may be `None`. Store `discord_id` as the panel owner.

---

## 8. Tags

**Location**: `apps/bot/src_v2/mcp/tags.py`, `apps/bot/src_v2/core/platforms.py`

```python
class Platform(StrEnum):
    DISCORD = "discord"
    BLUEDOT = "bluedot"
    ACP = "acp"
    FLY = "fly"
    ONYX = "onyx"
    GITHUB = "github"
    TOGGL = "toggl"
    # SSR tools will require a new entry: SSR = "ssr"

class Action(StrEnum):
    READ = "read"
    WRITE = "write"
    HEALTH = "health"
    SESSION = "session"
    TOOLS = "tools"
    COMMUNICATION = "communication"
    # Consider adding: PANEL = "panel" for SSR panel operations

class Scope(StrEnum):
    TOGGL_WORKSPACE_ADMIN = "toggl_workspace_admin"
```

**For SSR tools**: Add `Platform.SSR = "ssr"` to `apps/bot/src_v2/core/platforms.py`. Tag SSR tools with `{Platform.SSR, Action.WRITE}` for panel creation/runs and `{Platform.SSR, Action.READ}` for results/listing.

---

## 9. XML Output Helpers

**Location**: `apps/bot/src_v2/core/xml.py`

Tools return XML-formatted strings. Claude was trained with XML, making it effective at parsing structured responses.

```python
from src_v2.core.xml import tag, wrap, hint

# Single element
tag("panel-id", "abc-123")
# → <panel-id>abc-123</panel-id>

# With attributes
tag("persona", "Urban professional, 32", gender="female", age="32")
# → <persona gender="female" age="32">Urban professional, 32</persona>

# Nested XML (raw=True skips escaping)
tag("panel", tag("id", "abc") + tag("size", "20"), raw=True)
# → <panel><id>abc</id><size>20</size></panel>

# Container with count
wrap("personas", [tag("persona", "..."), tag("persona", "...")])
# → <personas count="2">
#     <persona>...</persona>
#     <persona>...</persona>
#   </personas>

# Actionable guidance when empty
hint("Panel not found. Use ssr_panel_list to see available panels.")
# → <hint>Panel not found. Use ssr_panel_list to see available panels.</hint>
```

All SSR tool output must use these helpers. Format numbers as strings, UUIDs as strings.

---

## 10. Tool Organization Pattern

**From**: `apps/bot/src_v2/mcp/tools/CLAUDE.md`

For SSR tools (which will have >3 tool definitions and substantial business logic), use the **split pattern**:

```
mcp/tools/ssr/
├── __init__.py          # Re-exports all ToolDef instances
├── tools.py             # @tool-decorated functions (thin wrappers)
├── api.py               # Business logic (pipeline orchestration, DB access)
└── models.py            # Shared internal models (not Pydantic input models)
```

This keeps `tools.py` thin — each function just validates, calls `api.py`, formats output, returns.

---

## 11. Registration in `catalog.py`

**Location**: `apps/bot/src_v2/mcp/catalog.py`

Pattern for adding SSR tools:

```python
# In catalog.py, add imports:
from src_v2.mcp.tools.ssr import (
    ssr_panel_create,
    ssr_panel_run,
    ssr_panel_results,
    ssr_panel_list,
    ssr_panel_delete,
)

# In ALL_TOOLS list, add a new section:
ALL_TOOLS: list[ToolDef] = [
    # ... existing tools ...
    # SSR Consumer Panel (5)
    ssr_panel_create,
    ssr_panel_run,
    ssr_panel_results,
    ssr_panel_list,
    ssr_panel_delete,
]
```

`create_tool_registry()` is unchanged — it registers everything in `ALL_TOOLS` automatically.

---

## 12. Repository Pattern

Repositories are **flat functions** that take a `Session` and return Pydantic models. They live in `db/repositories/`.

```python
# db/repositories/ssr_panels.py

from sqlalchemy import select
from sqlalchemy.orm import Session
from src_v2.db.models.ssr import SsrPanelORM
from src_v2.core.models.ssr import SsrPanel, SsrPanelCreate

def get_by_id(session: Session, panel_id: str) -> SsrPanel | None:
    row = session.execute(
        select(SsrPanelORM).where(SsrPanelORM.id == panel_id)
    ).scalar_one_or_none()
    return _to_panel(row) if row else None

def create(session: Session, panel: SsrPanelCreate) -> SsrPanel:
    row = SsrPanelORM(**panel.model_dump())
    session.add(row)
    session.commit()
    session.refresh(row)
    return _to_panel(row)
```

---

## 13. Key Constraints for SSR Tool Implementation

1. **Platform enum**: Must add `SSR = "ssr"` to `Platform` in `core/platforms.py`
2. **No new ToolContext fields needed**: `anthropic_api_key` already exists for LLM calls
3. **SSR tools always require db_context**: Check at start of every tool handler
4. **Owner is `discord_id`**: Use `user_context.discord_id` as panel owner; do not require `user_id`
5. **All returns are `str`**: Use `tag()`, `wrap()`, `hint()` from `src_v2.core.xml`
6. **Concurrency in `api.py`**: Panel runs involve calling Claude N times (once per persona). Use `asyncio.gather()` in `api.py`, not in the tool handler itself
7. **Error messages are user-facing**: Write `ToolError` messages as if Claude is telling the user
8. **Tool names are function names**: Name functions `ssr_panel_create`, `ssr_panel_run`, etc. — these become the MCP tool names

---

## Cross-References

- [reference-tools.md](reference-tools.md) — Study 2-3 existing tool implementations
- [catalog-registration.md](../integration/catalog-registration.md) — Exact code for SSR tool registration
- [pydantic-models.md](../data-model/pydantic-models.md) — Input/output model definitions
