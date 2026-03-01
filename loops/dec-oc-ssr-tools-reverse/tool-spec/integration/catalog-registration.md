# SSR Tool Registration — Exact Code Changes

> Status: Complete (w3-catalog-registration).
> Cross-references: [tool-system.md](../existing-patterns/tool-system.md) · [reference-tools.md](../existing-patterns/reference-tools.md) · [embedding-options.md](../existing-patterns/embedding-options.md) · [pydantic-models.md](../data-model/pydantic-models.md) · [panel-create.md](../tools/panel-create.md) · [panel-run.md](../tools/panel-run.md) · [panel-results.md](../tools/panel-results.md) · [panel-manage.md](../tools/panel-manage.md)

---

## Overview

Registering SSR tools in Daimon requires changes to 6 existing files and the creation of 4 new files. The changes are presented in dependency order — later changes depend on earlier ones.

| # | File | Change Type | Reason |
|---|------|-------------|--------|
| 1 | `src_v2/core/platforms.py` | Edit — add enum member | `Platform.SSR` tag for `@tool` decorator |
| 2 | `src_v2/bootstrap/config.py` | Edit — add class + field | `OpenAISettings` / `OPENAI_API_KEY` env var |
| 3 | `src_v2/mcp/context.py` | Edit — add dataclass field | `ToolContext.openai_api_key` |
| 4 | `src_v2/entrypoints/discord/main.py` | Edit — add kwarg | Pass `openai_api_key` into `ToolContext(...)` |
| 5 | `src_v2/mcp/tools/ssr/__init__.py` | Create | Re-export all 5 `ToolDef` instances |
| 6 | `src_v2/mcp/catalog.py` | Edit — add imports + list entries | Register 5 SSR tools in `ALL_TOOLS` |

All paths are relative to `apps/bot/`.

---

## Change 1: `src_v2/core/platforms.py`

**Add `SSR = "ssr"` to the `Platform` enum.** SSR tools use `{Platform.SSR, Action.WRITE}` and `{Platform.SSR, Action.READ}` as their tag sets. Without this value, the `@tool` decorator call raises a `NameError` at import time.

Current file (`apps/bot/src_v2/core/platforms.py`):

```python
"""Platform identifiers used across layers."""

from enum import StrEnum


class Platform(StrEnum):
    """Supported external platforms."""

    DISCORD = "discord"
    BLUEDOT = "bluedot"
    ACP = "acp"
    FLY = "fly"
    ONYX = "onyx"
    GITHUB = "github"
    TOGGL = "toggl"
```

**New file after change:**

```python
"""Platform identifiers used across layers."""

from enum import StrEnum


class Platform(StrEnum):
    """Supported external platforms."""

    DISCORD = "discord"
    BLUEDOT = "bluedot"
    ACP = "acp"
    FLY = "fly"
    ONYX = "onyx"
    GITHUB = "github"
    TOGGL = "toggl"
    SSR = "ssr"
```

**Exact diff:**

```diff
     TOGGL = "toggl"
+    SSR = "ssr"
```

---

## Change 2: `src_v2/bootstrap/config.py`

**Add `OpenAISettings` class and `openai` field in `AppSettings`.** The `text-embedding-3-small` model requires an OpenAI API key that is separate from the Anthropic key. This follows the exact pattern of every other `*Settings` class in the file.

### 2a. Add `OpenAISettings` class

Insert immediately after the `AnthropicSettings` class (line 88, before the `LangfuseSettings` class):

```python
class OpenAISettings(BaseSettings):
    """OpenAI API configuration.

    Uses OPENAI_ env prefix. Required for SSR anchor embedding
    (text-embedding-3-small used to score persona responses against
    Likert anchor statements).
    """

    api_key: NonEmptyStr

    model_config = {"env_prefix": "OPENAI_"}
```

### 2b. Add `openai` field to `AppSettings`

Insert immediately after the `anthropic` field in `AppSettings` (after the `anthropic: AnthropicSettings = Field(...)` block):

```python
    openai: OpenAISettings = Field(
        default_factory=lambda: OpenAISettings()  # pyright: ignore[reportCallIssue]
    )
```

**Full `AppSettings` class after change** (showing the anthropic → openai → langfuse ordering):

```python
class AppSettings(BaseSettings):
    """Root application settings.

    Groups settings by service. Extended as platforms are migrated.
    """

    deploy_environment: DeployEnvironment = DeployEnvironment.DEVELOPMENT

    discord: DiscordSettings = Field(
        default_factory=lambda: DiscordSettings()  # pyright: ignore[reportCallIssue]
    )
    database: DatabaseSettings = Field(
        default_factory=lambda: DatabaseSettings()  # pyright: ignore[reportCallIssue]
    )
    fly: FlySettings = Field(
        default_factory=lambda: FlySettings()  # pyright: ignore[reportCallIssue]
    )
    onyx: OnyxSettings = Field(
        default_factory=lambda: OnyxSettings()  # pyright: ignore[reportCallIssue]
    )
    bluedot: BluedotSettings = Field(
        default_factory=lambda: BluedotSettings()  # pyright: ignore[reportCallIssue]
    )
    anthropic: AnthropicSettings = Field(
        default_factory=lambda: AnthropicSettings()  # pyright: ignore[reportCallIssue]
    )
    openai: OpenAISettings = Field(
        default_factory=lambda: OpenAISettings()  # pyright: ignore[reportCallIssue]
    )
    langfuse: LangfuseSettings = Field(
        default_factory=lambda: LangfuseSettings()  # pyright: ignore[reportCallIssue]
    )
    auth: AuthSettings = Field(
        default_factory=lambda: AuthSettings()  # pyright: ignore[reportCallIssue]
    )
    supabase: SupabaseSettings = Field(
        default_factory=lambda: SupabaseSettings()  # pyright: ignore[reportCallIssue]
    )
    github_oauth: GitHubOAuthSettings = Field(
        default_factory=lambda: GitHubOAuthSettings()  # pyright: ignore[reportCallIssue]
    )
    toggl: TogglSettings = Field(
        default_factory=lambda: TogglSettings()  # pyright: ignore[reportCallIssue]
    )
```

**Exact diff:**

```diff
     anthropic: AnthropicSettings = Field(
         default_factory=lambda: AnthropicSettings()  # pyright: ignore[reportCallIssue]
     )
+    openai: OpenAISettings = Field(
+        default_factory=lambda: OpenAISettings()  # pyright: ignore[reportCallIssue]
+    )
     langfuse: LangfuseSettings = Field(
```

---

## Change 3: `src_v2/mcp/context.py`

**Add `openai_api_key: str` field to `ToolContext`.** SSR tools call `embed_texts()` in `api.py` which requires an `AsyncOpenAI` client. The API key is passed as `tool_context.openai_api_key` so it flows through the standard context injection path.

Current `ToolContext` dataclass fields (from `mcp/context.py`):

```python
@dataclass(frozen=True)
class ToolContext:
    discord_token: str
    discord_guild_id: str
    fly_api_token: str
    fly_org_slug: str
    onyx_api_key: str
    onyx_base_url: str
    toggl_workspace_id: int
    toggl_organization_id: int
    anthropic_api_key: str
    supabase_url: str
    supabase_service_role_key: str
```

**New `ToolContext` after change** (add `openai_api_key` immediately after `anthropic_api_key`):

```python
@dataclass(frozen=True)
class ToolContext:
    discord_token: str
    discord_guild_id: str
    fly_api_token: str
    fly_org_slug: str
    onyx_api_key: str
    onyx_base_url: str
    toggl_workspace_id: int
    toggl_organization_id: int
    anthropic_api_key: str
    openai_api_key: str            # OpenAI API key for SSR anchor embedding
    supabase_url: str
    supabase_service_role_key: str
```

**Exact diff:**

```diff
     anthropic_api_key: str
+    openai_api_key: str            # OpenAI API key for SSR anchor embedding
     supabase_url: str
```

**Note**: `openai_api_key` is positioned immediately after `anthropic_api_key` to group AI provider keys together. The inline comment is acceptable here since it explains the field's purpose and scope in one line.

---

## Change 4: `src_v2/entrypoints/discord/main.py`

**Pass `openai_api_key` to the `ToolContext` constructor.** The `ToolContext` dataclass is frozen (immutable); fields must be set at construction time. This change adds a single keyword argument to the existing `ToolContext(...)` call on line 41.

Current constructor call in `run_discord_bot()`:

```python
tool_context = ToolContext(
    discord_token=settings.discord.bot_token,
    discord_guild_id=str(settings.discord.guild_id),
    fly_api_token=settings.fly.api_token,
    fly_org_slug=settings.fly.org_slug,
    onyx_api_key=settings.onyx.api_key,
    onyx_base_url=settings.onyx.base_url,
    toggl_workspace_id=settings.toggl.workspace_id,
    toggl_organization_id=settings.toggl.organization_id,
    anthropic_api_key=settings.anthropic.api_key,
    supabase_url=settings.supabase.url,
    supabase_service_role_key=settings.supabase.key,
)
```

**New constructor call after change** (add `openai_api_key` immediately after `anthropic_api_key`):

```python
tool_context = ToolContext(
    discord_token=settings.discord.bot_token,
    discord_guild_id=str(settings.discord.guild_id),
    fly_api_token=settings.fly.api_token,
    fly_org_slug=settings.fly.org_slug,
    onyx_api_key=settings.onyx.api_key,
    onyx_base_url=settings.onyx.base_url,
    toggl_workspace_id=settings.toggl.workspace_id,
    toggl_organization_id=settings.toggl.organization_id,
    anthropic_api_key=settings.anthropic.api_key,
    openai_api_key=settings.openai.api_key,
    supabase_url=settings.supabase.url,
    supabase_service_role_key=settings.supabase.key,
)
```

**Exact diff:**

```diff
     anthropic_api_key=settings.anthropic.api_key,
+    openai_api_key=settings.openai.api_key,
     supabase_url=settings.supabase.url,
```

---

## Change 5: Create `src_v2/mcp/tools/ssr/__init__.py`

**Create the `ssr/` package directory and its `__init__.py` re-export file.** This file follows the same pattern as `toggl/__init__.py` and `bluedot/__init__.py`: import all `ToolDef` instances from `tools.py` and re-export them in `__all__` for `catalog.py` to import by name.

**New file** (`apps/bot/src_v2/mcp/tools/ssr/__init__.py`):

```python
"""SSR (Semantic Similarity Rating) consumer panel tools."""

from .tools import (
    ssr_panel_create,
    ssr_panel_delete,
    ssr_panel_list,
    ssr_panel_results,
    ssr_panel_run,
)

__all__ = [
    "ssr_panel_create",
    "ssr_panel_delete",
    "ssr_panel_list",
    "ssr_panel_results",
    "ssr_panel_run",
]
```

**Note on ordering**: Names in `__all__` are sorted alphabetically (matching the style of `bluedot/__init__.py`). The import list in `from .tools import (...)` is also alphabetical. This is consistent with how `bluedot/__init__.py` is sorted.

**Supporting files** that must also exist in `src_v2/mcp/tools/ssr/` for this `__init__.py` to be importable:
- `tools.py` — Contains the 5 `@tool`-decorated functions (`ssr_panel_create`, `ssr_panel_delete`, `ssr_panel_list`, `ssr_panel_results`, `ssr_panel_run`). See [panel-create.md](../tools/panel-create.md), [panel-run.md](../tools/panel-run.md), [panel-results.md](../tools/panel-results.md), [panel-manage.md](../tools/panel-manage.md).
- `api.py` — Business logic called by `tools.py`. Session management, pipeline orchestration, embedding calls. See [panel-create.md](../tools/panel-create.md), [panel-run.md](../tools/panel-run.md), [panel-results.md](../tools/panel-results.md), [panel-manage.md](../tools/panel-manage.md).
- `models.py` — All enums, Pydantic input models, dataclasses. See [pydantic-models.md](../data-model/pydantic-models.md).

---

## Change 6: `src_v2/mcp/catalog.py`

**Add SSR imports and register 5 SSR tools in `ALL_TOOLS`.** This is the final wiring step. Once this change lands, `create_tool_registry()` will register all 5 SSR tools alongside the existing 60 tools.

### 6a. Add import block

Insert the SSR import block after the `toggl` imports and before the `ALL_TOOLS` definition:

```python
from src_v2.mcp.tools.ssr import (
    ssr_panel_create,
    ssr_panel_delete,
    ssr_panel_list,
    ssr_panel_results,
    ssr_panel_run,
)
```

### 6b. Add SSR section to `ALL_TOOLS`

Append the SSR section at the end of `ALL_TOOLS`, after the `# Toggl (34)` section:

```python
    # SSR Consumer Panel (5)
    ssr_panel_create,
    ssr_panel_run,
    ssr_panel_results,
    ssr_panel_list,
    ssr_panel_delete,
```

**Full `catalog.py` after both changes:**

```python
"""Central tool catalog: all registered tools and registry factory.

# FUTURE: When Anthropic Tool Search Tool is available via Agent SDK,
# ALL_TOOLS can be passed directly to the API's `tools` parameter
# with defer_loading: true on each ToolDef. The ToolRegistry still
# dispatches via call_tool() — no tool handler changes needed.
"""

from src_v2.mcp.context import DatabaseContext, ToolContext
from src_v2.mcp.registry import ToolDef, ToolRegistry
from src_v2.mcp.tools.acp import (
    acp_call_tool,
    acp_health_check,
    acp_list_tools,
    acp_send_message,
)
from src_v2.mcp.tools.bluedot import (
    bluedot_get_summary,
    bluedot_get_transcript,
    bluedot_list_meetings,
    bluedot_search_transcripts,
)
from src_v2.mcp.tools.credentials import get_credential
from src_v2.mcp.tools.discord import (
    discord_get_message,
    discord_parse_link,
    discord_read_channel,
    discord_read_thread,
    discord_search_messages,
)
from src_v2.mcp.tools.fly import (
    fly_delete_template,
    fly_get_session_status,
    fly_launch_builder,
    fly_launch_session,
    fly_list_images,
    fly_list_sessions,
    fly_list_templates,
    fly_save_template,
    fly_stop_session,
)
from src_v2.mcp.tools.github import github_run_gh
from src_v2.mcp.tools.onyx import onyx_list_agents, onyx_query
from src_v2.mcp.tools.ssr import (
    ssr_panel_create,
    ssr_panel_delete,
    ssr_panel_list,
    ssr_panel_results,
    ssr_panel_run,
)
from src_v2.mcp.tools.toggl import (
    toggl_add_user_to_project,
    toggl_bulk_edit_time_entries,
    toggl_create_my_time_entry,
    toggl_create_project,
    toggl_create_task,
    toggl_employee_profitability,
    toggl_export_detailed_csv,
    toggl_export_summary_csv,
    toggl_get_my_current_time_entry,
    toggl_get_my_time_entries,
    toggl_get_my_time_entry,
    toggl_get_project,
    toggl_get_project_tasks,
    toggl_get_project_users,
    toggl_get_projects,
    toggl_get_task,
    toggl_get_tasks,
    toggl_get_workspace_members,
    toggl_get_workspace_time_summary,
    toggl_list_project_user_rates,
    toggl_list_report_clients,
    toggl_list_report_projects,
    toggl_list_report_users,
    toggl_project_profitability,
    toggl_project_trends,
    toggl_remove_user_from_project,
    toggl_search_workspace_time_entries,
    toggl_stop_my_time_entry,
    toggl_update_my_time_entry,
    toggl_update_project,
    toggl_update_task,
    toggl_weekly_report,
    toggl_workspace_project_summary,
    toggl_workspace_time_totals,
)

ALL_TOOLS: list[ToolDef] = [
    # Discord (5)
    discord_read_thread,
    discord_read_channel,
    discord_parse_link,
    discord_search_messages,
    discord_get_message,
    # Fly (9)
    fly_launch_session,
    fly_stop_session,
    fly_get_session_status,
    fly_list_sessions,
    fly_list_images,
    fly_list_templates,
    fly_save_template,
    fly_delete_template,
    fly_launch_builder,
    # Bluedot (4)
    bluedot_list_meetings,
    bluedot_get_transcript,
    bluedot_get_summary,
    bluedot_search_transcripts,
    # Onyx (2)
    onyx_list_agents,
    onyx_query,
    # GitHub (1)
    github_run_gh,
    # Credentials (1)
    get_credential,
    # ACP (4)
    acp_health_check,
    acp_list_tools,
    acp_send_message,
    acp_call_tool,
    # Toggl (34)
    toggl_get_my_time_entries,
    toggl_get_my_time_entry,
    toggl_get_my_current_time_entry,
    toggl_create_my_time_entry,
    toggl_update_my_time_entry,
    toggl_stop_my_time_entry,
    toggl_bulk_edit_time_entries,
    toggl_get_projects,
    toggl_get_project,
    toggl_update_project,
    toggl_get_tasks,
    toggl_get_task,
    toggl_get_project_tasks,
    toggl_create_task,
    toggl_update_task,
    toggl_create_project,
    toggl_get_workspace_members,
    toggl_add_user_to_project,
    toggl_get_project_users,
    toggl_remove_user_from_project,
    toggl_search_workspace_time_entries,
    toggl_get_workspace_time_summary,
    toggl_employee_profitability,
    toggl_export_detailed_csv,
    toggl_export_summary_csv,
    toggl_list_project_user_rates,
    toggl_list_report_clients,
    toggl_list_report_projects,
    toggl_list_report_users,
    toggl_project_profitability,
    toggl_project_trends,
    toggl_weekly_report,
    toggl_workspace_project_summary,
    toggl_workspace_time_totals,
    # SSR Consumer Panel (5)
    ssr_panel_create,
    ssr_panel_run,
    ssr_panel_results,
    ssr_panel_list,
    ssr_panel_delete,
]


def create_tool_registry(
    tool_context: ToolContext,
    db_context: DatabaseContext | None = None,
) -> ToolRegistry:
    """Create a ToolRegistry with all tools registered."""
    registry = ToolRegistry(tool_context, db_context)
    for tool_def in ALL_TOOLS:
        registry.register(tool_def)
    return registry
```

**Notes on `ALL_TOOLS` ordering**:
- SSR section appended at the end. No reordering of existing sections — the existing 60 tools stay unchanged.
- Within the SSR section, tools are ordered by workflow: `create` → `run` → `results` → `list` → `delete`. This matches the natural user workflow.
- The `create_tool_registry()` function is unchanged — it registers everything in `ALL_TOOLS` automatically.

**Import placement**: The SSR import block is inserted alphabetically between `onyx` and `toggl` in the import section. This matches the style of existing import blocks, each of which is also alphabetically ordered by platform name.

**Exact diff for imports:**

```diff
 from src_v2.mcp.tools.onyx import onyx_list_agents, onyx_query
+from src_v2.mcp.tools.ssr import (
+    ssr_panel_create,
+    ssr_panel_delete,
+    ssr_panel_list,
+    ssr_panel_results,
+    ssr_panel_run,
+)
 from src_v2.mcp.tools.toggl import (
```

**Exact diff for `ALL_TOOLS`:**

```diff
     toggl_workspace_time_totals,
+    # SSR Consumer Panel (5)
+    ssr_panel_create,
+    ssr_panel_run,
+    ssr_panel_results,
+    ssr_panel_list,
+    ssr_panel_delete,
 ]
```

---

## Environment Variable Setup

### Local Development (`.env` file)

Add to `apps/bot/.env`:

```
OPENAI_API_KEY=sk-proj-...
```

The `AppSettings` loader reads this via `OpenAISettings` with `env_prefix = "OPENAI_"` — the field `api_key` maps to env var `OPENAI_API_KEY`.

### Fly.io Production (Secrets)

```bash
fly secrets set OPENAI_API_KEY=sk-proj-... --app decision-orchestrator
```

This injects the key as an environment variable into the Fly.io machine. No restart needed — Fly.io hot-reloads secrets.

### Verification

After deploying, the bot will fail to start (logged to stderr) if `OPENAI_API_KEY` is missing, because `OpenAISettings.api_key` is typed as `NonEmptyStr` with no default. This makes misconfiguration immediately visible rather than silently broken.

---

## Full File Listing for New `ssr/` Package

The 4 files that must be created:

| File | Purpose | Reference Spec |
|------|---------|----------------|
| `src_v2/mcp/tools/ssr/__init__.py` | Re-export 5 ToolDef instances | This document (Change 5) |
| `src_v2/mcp/tools/ssr/tools.py` | 5 `@tool`-decorated handler functions | [panel-create.md](../tools/panel-create.md), [panel-run.md](../tools/panel-run.md), [panel-results.md](../tools/panel-results.md), [panel-manage.md](../tools/panel-manage.md) |
| `src_v2/mcp/tools/ssr/api.py` | Pipeline orchestration, DB access, embedding | [panel-create.md](../tools/panel-create.md), [panel-run.md](../tools/panel-run.md), [panel-results.md](../tools/panel-results.md), [panel-manage.md](../tools/panel-manage.md), [embedding-options.md](../existing-patterns/embedding-options.md), [scoring-aggregation.md](../pipeline/scoring-aggregation.md) |
| `src_v2/mcp/tools/ssr/models.py` | All enums, Pydantic v2 input models, dataclasses | [pydantic-models.md](../data-model/pydantic-models.md) |

Additionally, 6 repository files must be created in `src_v2/db/repositories/`:

| File | Tables Accessed | Reference Spec |
|------|----------------|----------------|
| `src_v2/db/repositories/ssr_panels.py` | `ssr_panel` | [supabase-schema.md](../data-model/supabase-schema.md) |
| `src_v2/db/repositories/ssr_personas.py` | `ssr_persona` | [supabase-schema.md](../data-model/supabase-schema.md) |
| `src_v2/db/repositories/ssr_runs.py` | `ssr_run` | [supabase-schema.md](../data-model/supabase-schema.md) |
| `src_v2/db/repositories/ssr_responses.py` | `ssr_response` | [supabase-schema.md](../data-model/supabase-schema.md) |
| `src_v2/db/repositories/ssr_scores.py` | `ssr_score` | [supabase-schema.md](../data-model/supabase-schema.md) |
| `src_v2/db/repositories/ssr_anchor_sets.py` | `ssr_anchor_set` | [supabase-schema.md](../data-model/supabase-schema.md), [anchor-statements.md](../pipeline/anchor-statements.md) |

---

## Registration Verification

After all changes are applied, the following validation steps confirm correct registration:

### Step 1: Import smoke test

```python
# Run from apps/bot/ directory:
python -c "
from src_v2.mcp.catalog import ALL_TOOLS
ssr_tools = [t for t in ALL_TOOLS if t.name.startswith('ssr_')]
print(f'SSR tools: {[t.name for t in ssr_tools]}')
assert len(ssr_tools) == 5, f'Expected 5, got {len(ssr_tools)}'
print('OK')
"
```

Expected output:

```
SSR tools: ['ssr_panel_create', 'ssr_panel_run', 'ssr_panel_results', 'ssr_panel_list', 'ssr_panel_delete']
OK
```

### Step 2: Schema validation

```python
python -c "
from src_v2.mcp.catalog import ALL_TOOLS
for t in ALL_TOOLS:
    if t.name.startswith('ssr_'):
        schema = t.input_schema
        assert 'properties' in schema, f'{t.name}: missing properties in schema'
        print(f'{t.name}: {list(schema[\"properties\"].keys())}')
"
```

Expected output (field names per tool's Pydantic model):

```
ssr_panel_create: ['panel_name', 'demographics', 'psychographics', 'product_category', 'panel_size', 'custom_persona_instructions']
ssr_panel_run: ['panel_id', 'stimulus_text', 'stimulus_type', 'evaluation_dimensions', 'response_format', 'run_label']
ssr_panel_results: ['panel_id', 'run_id', 'format', 'comparison_run_id']
ssr_panel_list: ['limit', 'offset']
ssr_panel_delete: ['panel_id']
```

### Step 3: Platform tag check

```python
python -c "
from src_v2.mcp.catalog import ALL_TOOLS
from src_v2.core.platforms import Platform
ssr_tools = [t for t in ALL_TOOLS if t.name.startswith('ssr_')]
for t in ssr_tools:
    assert Platform.SSR in t.tags, f'{t.name} missing Platform.SSR tag'
    print(f'{t.name}: tags={set(t.tags)}')
"
```

Expected output:

```
ssr_panel_create: tags={<Platform.SSR: 'ssr'>, <Action.WRITE: 'write'>}
ssr_panel_run: tags={<Platform.SSR: 'ssr'>, <Action.WRITE: 'write'>}
ssr_panel_results: tags={<Platform.SSR: 'ssr'>, <Action.READ: 'read'>}
ssr_panel_list: tags={<Platform.SSR: 'ssr'>, <Action.READ: 'read'>}
ssr_panel_delete: tags={<Platform.SSR: 'ssr'>, <Action.WRITE: 'write'>}
```

### Step 4: Registry creation

```python
python -c "
import os
os.environ['OPENAI_API_KEY'] = 'sk-test'  # dummy for validation
from src_v2.mcp.catalog import create_tool_registry
from src_v2.mcp.context import ToolContext
ctx = ToolContext(
    discord_token='dummy', discord_guild_id='0',
    fly_api_token='dummy', fly_org_slug='dummy',
    onyx_api_key='dummy', onyx_base_url='http://localhost',
    toggl_workspace_id=0, toggl_organization_id=0,
    anthropic_api_key='dummy',
    openai_api_key='sk-test',
    supabase_url='http://localhost', supabase_service_role_key='dummy',
)
registry = create_tool_registry(ctx)
names = registry.get_tool_names()
assert 'ssr_panel_create' in names
assert 'ssr_panel_run' in names
assert 'ssr_panel_results' in names
assert 'ssr_panel_list' in names
assert 'ssr_panel_delete' in names
print(f'Total tools: {len(names)} (expected 65)')
"
```

Expected output:

```
Total tools: 65 (expected 65)
```

The total is 65: 60 existing + 5 SSR tools.

---

## Tag Reference for SSR Tools

| Tool | Platform Tag | Action Tag | Rationale |
|------|-------------|-----------|-----------|
| `ssr_panel_create` | `Platform.SSR` | `Action.WRITE` | Creates new DB rows (panel + N personas) |
| `ssr_panel_run` | `Platform.SSR` | `Action.WRITE` | Creates new DB rows (run + responses + scores) |
| `ssr_panel_results` | `Platform.SSR` | `Action.READ` | Reads existing run data, writes nothing |
| `ssr_panel_list` | `Platform.SSR` | `Action.READ` | Reads existing panel data, writes nothing |
| `ssr_panel_delete` | `Platform.SSR` | `Action.WRITE` | Deletes panel and all associated rows |

The `Action` tag is used by `ToolRegistry.list_tools(platforms=...)` to filter tools when Claude's context window is limited. `READ` tools are cheaper to include; `WRITE` tools carry risk. Marking destructive tools (`delete`) as `WRITE` enables future read-only modes that can be scoped to `Action.READ` only.

---

## Summary of Touched Files

| File | Lines Changed | Description |
|------|--------------|-------------|
| `src_v2/core/platforms.py` | +1 | Add `SSR = "ssr"` to `Platform` enum |
| `src_v2/bootstrap/config.py` | +10 | Add `OpenAISettings` class + `openai` field in `AppSettings` |
| `src_v2/mcp/context.py` | +1 | Add `openai_api_key: str` to `ToolContext` |
| `src_v2/entrypoints/discord/main.py` | +1 | Pass `openai_api_key=settings.openai.api_key` to `ToolContext(...)` |
| `src_v2/mcp/tools/ssr/__init__.py` | +17 (new file) | Re-export 5 ToolDef instances |
| `src_v2/mcp/catalog.py` | +12 | Import 5 SSR tools, add to `ALL_TOOLS` |

Total: 4 edits to existing files, 1 new file (plus `tools.py`, `api.py`, `models.py`, 6 repository files which are the subject of other spec files).
