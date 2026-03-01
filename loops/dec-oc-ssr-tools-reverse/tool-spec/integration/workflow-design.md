# Workflow Design — SSR Consumer Panel Tools in Daimon

> Status: Complete (w3-workflow-design).
> Cross-references: [catalog-registration.md](catalog-registration.md) · [discord-ux.md](discord-ux.md) · [panel-create.md](../tools/panel-create.md) · [panel-run.md](../tools/panel-run.md) · [panel-results.md](../tools/panel-results.md) · [panel-manage.md](../tools/panel-manage.md)

---

## Overview

SSR panel tools integrate into Daimon as **standard tools in `ALL_TOOLS`** — they do not require a dedicated workflow type. Daimon's single-agent architecture means the Claude agent has access to every registered tool for every invocation; the agent decides which tools to use based on user intent and the system prompt's guidance.

This document specifies:
1. The trigger mechanism (how SSR requests reach Daimon)
2. Channel and user scoping (no restrictions)
3. Keyword additions needed in `selection.py` for future tool filtering
4. System prompt additions needed in `base.txt` for SSR guidance
5. How multi-step panel operations chain within a single agent turn
6. The discover → execute meta-tool pattern for SSR

---

## 1. Architecture: No Dedicated Workflow Type

### 1.1 Existing Daimon Architecture

Daimon uses a **single-agent architecture**:

```
Discord Message → on_message (handlers.py)
    → execute_message (execution.py)
        → resolve_user_context (credentials, admin status)
        → extract_platforms_from_message (keyword hinting)
        → select_prompt (base.txt or routed_client.txt)
        → run_claude_agent (claude_agent.py)
            → ClaudeSDKClient with ALL_TOOLS accessible via meta-tools
                → discover_tools(platforms=[...])  ← Claude calls this first
                → execute_tool(name, params)        ← Then calls specific tools
```

There is no `WorkflowDef`, `WorkflowRouter`, or named workflow object in the codebase. The agent's behavior is shaped by:
- The system prompt (`base.txt` or `routed_client.txt`)
- Which tools are registered in `ALL_TOOLS`
- The `KEYWORD_PLATFORM_MAP` in `selection.py` (currently disabled, future-ready)

### 1.2 How SSR Tools Fit

SSR tools are added to `ALL_TOOLS` exactly like Discord, Bluedot, or Toggl tools. No new workflow infrastructure is needed. The agent discovers and executes them identically to any other tool.

**No new files in `services/` or `entrypoints/`**: SSR tools live entirely in `mcp/tools/ssr/` and `db/repositories/ssr_*.py`. The rest of the agent pipeline is unchanged.

---

## 2. Trigger Mechanism

### 2.1 SSR Requests Trigger Via Active Mention

SSR tools are **active-only**: they run when the user explicitly requests them. There are no passive or scheduled triggers.

Three trigger paths:

| Path | Trigger Condition | SSR Example |
|------|------------------|-------------|
| **Direct Message** | Any message in Daimon's DM channel | *"Test this headline with a panel of 25-35 yo urban Filipino women"* |
| **@mention in channel** | Message @-mentions `@Daimon` (bot user) | *"@Daimon run a consumer panel on this concept for me"* |
| **Channel routing** | Channel is configured in `channel_mappings` table to route messages to Daimon's internal thread | Varies by workspace setup |

**DM path is the primary path for panel work.** Panel runs take 30–90 seconds, and long-form results benefit from the DM session's thread context. Channel @-mention works equally well but is noisier in shared channels.

### 2.2 No Passive Triggers

SSR tools **do not** support:
- Scheduled panel runs (cron-triggered)
- Webhook-triggered panel runs
- Event-driven panel runs (e.g., "run panel whenever a new campaign brief is posted")

These patterns could be added later as Fly.io session templates, but are out of scope for the initial tool implementation.

---

## 3. Channel and User Scoping

### 3.1 No Channel Restrictions

SSR tools are available in all channels where Daimon is active. There is no channel-level scoping.

Rationale: Panel testing is a general-purpose capability (like GitHub tools or Toggl tools). Restricting it to specific channels would reduce discoverability without meaningful benefit.

### 3.2 No Authentication Required

SSR tools do NOT require `requires_credential`. Users do not need to link any external account. The only requirement is:
- Daimon is active in the channel (or user sends a DM)
- `OPENAI_API_KEY` is set in the bot's environment (operator requirement, not user requirement)

From the tool perspective, `user_context.discord_id` is used as the panel owner. Any Discord user can create and run panels.

### 3.3 No Scope Gates

SSR tools do NOT use `Scope.TOGGL_WORKSPACE_ADMIN` or any other scope gate. All authenticated Discord users can use all 5 SSR tools (`ssr_panel_create`, `ssr_panel_run`, `ssr_panel_results`, `ssr_panel_list`, `ssr_panel_delete`).

Users can only see and operate on panels they own (filtered by `discord_id` in all repository queries). Cross-user panel access is not supported.

---

## 4. Keyword Additions in `selection.py`

### 4.1 Why This Matters

`selection.py` contains `KEYWORD_PLATFORM_MAP` which maps message keywords to `Platform` enum values. When `TOOL_FILTERING_ENABLED` is set to `True` (currently `False`), the agent receives only tools relevant to detected platforms. SSR keywords must be added so SSR tools are included when users request panel testing.

### 4.2 Current State

```python
# apps/bot/src_v2/core/selection.py

KEYWORD_PLATFORM_MAP: dict[str, str] = {
    # Direct platform names
    Platform.DISCORD: Platform.DISCORD,
    Platform.BLUEDOT: Platform.BLUEDOT,
    Platform.ACP: Platform.ACP,
    Platform.FLY: Platform.FLY,
    Platform.ONYX: Platform.ONYX,
    # Synonyms / related keywords
    "meeting": Platform.BLUEDOT,
    "transcript": Platform.BLUEDOT,
    "recording": Platform.BLUEDOT,
    "call": Platform.BLUEDOT,
    "deploy": Platform.FLY,
    "server": Platform.FLY,
    "machine": Platform.FLY,
    "session": Platform.ACP,
    "agent": Platform.ACP,
    "search": Platform.ONYX,
    "knowledge": Platform.ONYX,
}
```

### 4.3 Required Addition

Add an SSR section to `KEYWORD_PLATFORM_MAP`. Insert after the `Platform.ONYX` synonym block:

```python
    # SSR (Consumer Panel)
    Platform.SSR: Platform.SSR,
    "panel": Platform.SSR,
    "consumer": Platform.SSR,
    "persona": Platform.SSR,
    "ad copy": Platform.SSR,
    "ad test": Platform.SSR,
    "copy test": Platform.SSR,
    "audience test": Platform.SSR,
    "focus group": Platform.SSR,
    "test this": Platform.SSR,
    "test my": Platform.SSR,
    "purchase intent": Platform.SSR,
    "brand perception": Platform.SSR,
    "message clarity": Platform.SSR,
```

**Full `KEYWORD_PLATFORM_MAP` after change:**

```python
KEYWORD_PLATFORM_MAP: dict[str, str] = {
    # Direct platform names
    Platform.DISCORD: Platform.DISCORD,
    Platform.BLUEDOT: Platform.BLUEDOT,
    Platform.ACP: Platform.ACP,
    Platform.FLY: Platform.FLY,
    Platform.ONYX: Platform.ONYX,
    Platform.SSR: Platform.SSR,
    # Synonyms / related keywords
    "meeting": Platform.BLUEDOT,
    "transcript": Platform.BLUEDOT,
    "recording": Platform.BLUEDOT,
    "call": Platform.BLUEDOT,
    "deploy": Platform.FLY,
    "server": Platform.FLY,
    "machine": Platform.FLY,
    "session": Platform.ACP,
    "agent": Platform.ACP,
    "search": Platform.ONYX,
    "knowledge": Platform.ONYX,
    "panel": Platform.SSR,
    "consumer": Platform.SSR,
    "persona": Platform.SSR,
    "ad copy": Platform.SSR,
    "ad test": Platform.SSR,
    "copy test": Platform.SSR,
    "audience test": Platform.SSR,
    "focus group": Platform.SSR,
    "test this": Platform.SSR,
    "test my": Platform.SSR,
    "purchase intent": Platform.SSR,
    "brand perception": Platform.SSR,
    "message clarity": Platform.SSR,
}
```

**Exact diff:**

```diff
     # Direct platform names
     Platform.DISCORD: Platform.DISCORD,
     Platform.BLUEDOT: Platform.BLUEDOT,
     Platform.ACP: Platform.ACP,
     Platform.FLY: Platform.FLY,
     Platform.ONYX: Platform.ONYX,
+    Platform.SSR: Platform.SSR,
     # Synonyms / related keywords
     "meeting": Platform.BLUEDOT,
     ...
     "search": Platform.ONYX,
     "knowledge": Platform.ONYX,
+    "panel": Platform.SSR,
+    "consumer": Platform.SSR,
+    "persona": Platform.SSR,
+    "ad copy": Platform.SSR,
+    "ad test": Platform.SSR,
+    "copy test": Platform.SSR,
+    "audience test": Platform.SSR,
+    "focus group": Platform.SSR,
+    "test this": Platform.SSR,
+    "test my": Platform.SSR,
+    "purchase intent": Platform.SSR,
+    "brand perception": Platform.SSR,
+    "message clarity": Platform.SSR,
 }
```

**File**: `apps/bot/src_v2/core/selection.py`

### 4.4 Keyword Design Rationale

| Keyword | Rationale |
|---------|-----------|
| `"panel"` | Core concept — "run a panel of 30 personas" |
| `"consumer"` | "consumer test", "consumer panel", "consumer feedback" |
| `"persona"` | "create a persona panel", "run this against my personas" |
| `"ad copy"` | Primary use case — "test this ad copy with a panel" |
| `"ad test"` | Shorthand — "ad test with Filipino moms" |
| `"copy test"` | Variant — "run a copy test on this tagline" |
| `"audience test"` | Brand-neutral phrasing — "audience test for this concept" |
| `"focus group"` | Common mental model — "run a focus group on this" |
| `"test this"` | Shortest trigger — "test this headline" |
| `"test my"` | "test my ad copy / tagline / concept" |
| `"purchase intent"` | Evaluation dimension keyword (user may ask for this directly) |
| `"brand perception"` | Evaluation dimension keyword |
| `"message clarity"` | Evaluation dimension keyword |

**Multi-word keywords**: `"ad copy"`, `"ad test"`, `"copy test"`, `"audience test"`, `"focus group"`, `"test this"`, `"test my"` use substring matching (the existing `if keyword in content_lower` pattern) — they work correctly as multi-word keywords.

---

## 5. System Prompt Addition in `base.txt`

### 5.1 Why a System Prompt Addition

The base system prompt's `<tools>` section says: *"Determine which platforms are relevant from context — users do not need to name them."* SSR panel tools need additional guidance because:

1. **Chaining behavior**: For a single user request like "test this ad copy", Claude must chain `ssr_panel_create` → `ssr_panel_run` automatically without asking for a panel ID.
2. **Progressive disclosure**: Claude should not ask for all demographics upfront — it should use sensible defaults and ask for what's missing.
3. **Reuse behavior**: If the user already has a panel matching their description, Claude should reuse it (via `ssr_panel_list`) rather than creating a duplicate.
4. **Result interpretation**: Claude should synthesize the XML tool output into a natural-language summary, not dump raw XML.

### 5.2 Addition to `base.txt`

Insert the following section immediately before `</ad-hoc-scripts>` (after the existing `<tools>` section):

```
<consumer-panel>
When a user wants to test marketing assets (ad copy, headlines, taglines, concepts, briefs, product ideas, influencer fit) with a simulated consumer audience, use the SSR consumer panel tools.

User intent signals: "test this", "run a panel on", "how would [audience] react to", "copy test", "focus group", "ad test", "what would Filipino moms think of", "consumer feedback on".

Chaining rules:
1. If the user provides audience demographics and a marketing asset in one message, chain ssr_panel_create → ssr_panel_run immediately without asking for confirmation.
2. Before creating a new panel, call ssr_panel_list to check if a panel with the same demographic profile already exists for this user. If it does, reuse it.
3. After ssr_panel_run, always show results inline using ssr_panel_results with format="summary" unless the user asks for more detail.
4. Use evaluation_dimensions that match the marketing objective: "purchase_intent + message_clarity" for direct-response copy; "brand_favorability + emotional_response" for brand/awareness copy; "personal_relevance + uniqueness" for positioning statements; "overall_appeal" as a catch-all when not specified.

Default parameters (use when not specified by user):
- panel_size: 20
- evaluation_dimensions: ["purchase_intent", "message_clarity", "overall_appeal"]
- response_format: "summary"

Ask for clarification only when the target audience is completely absent (no demographic signal at all). Do not ask about every parameter — infer from context.

When presenting results: translate the numeric distributions into natural language ("7 out of 20 scored this a 5 for purchase intent, with a mean of 3.85"). Show the highlight quotes. Give a 1–2 sentence bottom line recommendation.
</consumer-panel>
```

**File**: `apps/bot/src_v2/core/prompts/base.txt`

**Exact placement** (after line 36, before line 38 in the current file):

```diff
 </tools>

+<consumer-panel>
+When a user wants to test marketing assets (ad copy, headlines, taglines, concepts, briefs, product ideas, influencer fit) with a simulated consumer audience, use the SSR consumer panel tools.
+
+User intent signals: "test this", "run a panel on", "how would [audience] react to", "copy test", "focus group", "ad test", "what would Filipino moms think of", "consumer feedback on".
+
+Chaining rules:
+1. If the user provides audience demographics and a marketing asset in one message, chain ssr_panel_create → ssr_panel_run immediately without asking for confirmation.
+2. Before creating a new panel, call ssr_panel_list to check if a panel with the same demographic profile already exists for this user. If it does, reuse it.
+3. After ssr_panel_run, always show results inline using ssr_panel_results with format="summary" unless the user asks for more detail.
+4. Use evaluation_dimensions that match the marketing objective: "purchase_intent + message_clarity" for direct-response copy; "brand_favorability + emotional_response" for brand/awareness copy; "personal_relevance + uniqueness" for positioning statements; "overall_appeal" as a catch-all when not specified.
+
+Default parameters (use when not specified by user):
+- panel_size: 20
+- evaluation_dimensions: ["purchase_intent", "message_clarity", "overall_appeal"]
+- response_format: "summary"
+
+Ask for clarification only when the target audience is completely absent (no demographic signal at all). Do not ask about every parameter — infer from context.
+
+When presenting results: translate the numeric distributions into natural language ("7 out of 20 scored this a 5 for purchase intent, with a mean of 3.85"). Show the highlight quotes. Give a 1–2 sentence bottom line recommendation.
+</consumer-panel>
+
 <ad-hoc-scripts>
```

### 5.3 `routed_client.txt` — No Change

The `routed_client.txt` prompt is used for routed (client-context) messages. No SSR-specific section is needed there — clients who route to Daimon will use it in the same natural way via the base context the `<consumer-panel>` section provides. If a specific client deployment needs SSR-specific behavior, that can be added to `routed_client.txt` later.

---

## 6. Multi-Step Panel Operations — Chaining

### 6.1 Standard Single-Turn Flow

The most common user flow is a **single message that triggers 3–4 sequential tool calls** in one agent turn:

```
User: "@Daimon test this tagline with 30-45 yo Filipino moms: 'Ang sarap ng tipid!'"

Agent turn:
  1. discover_tools(platforms=["ssr"])
  2. ssr_panel_list(limit=10, offset=0)   ← check for existing matching panel
     → Result: no "Filipino Moms 30-45" panel found
  3. ssr_panel_create(
         panel_name="Filipino Moms 30-45",
         demographics={age_min:30, age_max:45, genders:["female"],
                       locations:["Philippines"], income_brackets:["middle"],
                       education_levels:["high_school","some_college","bachelors"],
                       languages:["Filipino","Tagalog","English"]},
         psychographics={interests:["cooking","family","frugal living","grocery shopping"],
                         values:["family","value for money","practicality"],
                         lifestyle_descriptors:["household decision maker","mother of 2-3 children"],
                         media_consumption:["Facebook","TikTok","TV"]},
         product_category="packaged food / instant noodles",
         panel_size=20,
     )
     → Result: panel_id="abc-123", 20 personas generated
  4. ssr_panel_run(
         panel_id="abc-123",
         stimulus_text="Ang sarap ng tipid!",
         stimulus_type="tagline",
         evaluation_dimensions=["purchase_intent","message_clarity","personal_relevance"],
         response_format="summary",
         run_label="Initial tagline test",
     )
     → Result: run_id="def-456", inline results included in output

  Agent posts results to Discord.
```

The agent chains these calls **without user confirmation** in accordance with the `<consumer-panel>` system prompt rule. Steps 3 and 4 happen in one agent turn.

### 6.2 Reuse Flow — Existing Panel

When the user already has a panel for this demographic:

```
User: "@Daimon test this new tagline: 'Masarap, mura, at para sa pamilya!'"

Agent turn:
  1. discover_tools(platforms=["ssr"])
  2. ssr_panel_list(limit=10, offset=0)
     → Result: found "Filipino Moms 30-45" (panel_id="abc-123", size=20)
  3. ssr_panel_run(
         panel_id="abc-123",
         stimulus_text="Masarap, mura, at para sa pamilya!",
         stimulus_type="tagline",
         evaluation_dimensions=["purchase_intent","message_clarity","personal_relevance"],
         response_format="summary",
         run_label="Variant 2 tagline test",
     )
     → Result: run_id="ghi-789", inline results

  Agent posts results to Discord.
```

No `ssr_panel_create` call needed. The agent recognizes the existing panel and reuses it.

### 6.3 Comparison Flow — Two Runs

When the user wants to compare two versions:

```
User: "@Daimon compare these two taglines on the Filipino moms panel:
  A: 'Ang sarap ng tipid!'
  B: 'Masarap, mura, at para sa pamilya!'"

Agent turn:
  1. discover_tools(platforms=["ssr"])
  2. ssr_panel_list(limit=10, offset=0)
     → Found "Filipino Moms 30-45" (panel_id="abc-123")
  3. ssr_panel_run(
         panel_id="abc-123",
         stimulus_text="Ang sarap ng tipid!",
         stimulus_type="tagline",
         evaluation_dimensions=["purchase_intent","message_clarity","personal_relevance"],
         run_label="Tagline A",
     )
     → Result: run_id="def-456"
  4. ssr_panel_run(
         panel_id="abc-123",
         stimulus_text="Masarap, mura, at para sa pamilya!",
         stimulus_type="tagline",
         evaluation_dimensions=["purchase_intent","message_clarity","personal_relevance"],
         run_label="Tagline B",
     )
     → Result: run_id="ghi-789"
  5. ssr_panel_results(
         panel_id="abc-123",
         run_id="def-456",
         format="summary",
         comparison_run_id="ghi-789",
     )
     → Result: comparison output

  Agent posts comparison to Discord.
```

Steps 3 and 4 may run concurrently (the agent can issue both `execute_tool` calls without waiting for the first to finish — depends on Claude SDK behavior; if sequential, total time = 2× run time).

### 6.4 Explicit Panel Management Flow

When the user wants explicit control:

```
User: "@Daimon create a panel of 25 Gen Z Filipino women aged 18-24"

Agent turn:
  1. discover_tools(platforms=["ssr"])
  2. ssr_panel_create(
         panel_name="Gen Z Filipinas 18-24",
         demographics={age_min:18, age_max:24, genders:["female"],
                       locations:["Philippines"], income_brackets:["lower","middle"],
                       education_levels:["high_school","some_college","bachelors"],
                       languages:["Filipino","English"]},
         psychographics={interests:["social media","beauty","K-pop","gaming","fashion"],
                         values:["authenticity","self-expression","social connection"],
                         lifestyle_descriptors:["digital native","student or early career"],
                         media_consumption:["TikTok","Instagram","YouTube","Twitter/X"]},
         product_category="general",
         panel_size=25,
     )
     → Result: panel_id="xyz-321", 25 personas generated

  Agent: "Panel 'Gen Z Filipinas 18-24' created with 25 personas.
  Panel ID: xyz-321. Use this panel to test any marketing asset."
```

Then later:

```
User: "@Daimon test this TikTok caption with Gen Z Filipinas: 'POV: you finally found the skincare that actually works ✨'"

Agent turn:
  1. ssr_panel_list → finds "Gen Z Filipinas 18-24" (panel_id="xyz-321")
  2. ssr_panel_run(
         panel_id="xyz-321",
         stimulus_text="POV: you finally found the skincare that actually works ✨",
         stimulus_type="social_caption",
         evaluation_dimensions=["purchase_intent","emotional_response","share_worthiness"],
         run_label="TikTok caption v1",
     )
     → Results inline
```

### 6.5 Parallel Tool Calls in agent_run

The Claude Agent SDK processes tool calls sequentially by default. However, `ssr_panel_run` internally uses `asyncio.gather()` to parallelize persona elicitation. The external API call count is:

| Operation | External API Calls | Agent SDK Tool Calls |
|-----------|------------------|---------------------|
| `ssr_panel_create` (20 personas) | 20 parallel Anthropic calls (Haiku) | 1 |
| `ssr_panel_run` (20 personas, 3 dims) | 20 parallel Anthropic calls (Haiku) + 1 OpenAI embedding batch | 1 |
| `ssr_panel_results` | 0 (DB read only) | 1 |
| `ssr_panel_list` | 0 (DB read only) | 1 |
| `ssr_panel_delete` | 0 (DB delete only) | 1 |

**Total for a full create → run → results flow**: 2 agent-side tool calls with parallelized internal work. The bottleneck is `ssr_panel_run` (20 concurrent LLM calls + embedding). Expected wall time: 8–25 seconds depending on Haiku latency.

---

## 7. The Discover → Execute Pattern

### 7.1 How SSR Tools Are Discovered

Daimon uses a meta-tool pattern where Claude calls `discover_tools(platforms=[...])` before calling specific tools. For SSR requests, Claude calls:

```
discover_tools(platforms=["ssr"])
```

This returns:
- Tool schemas for all 5 SSR tools (`ssr_panel_create`, `ssr_panel_run`, `ssr_panel_results`, `ssr_panel_list`, `ssr_panel_delete`)
- Field-level descriptions from `Field(description=...)` in each Pydantic input model
- Platform context string (see §7.2 below)

### 7.2 Platform Context String for SSR

The `get_platform_context()` function in `meta_tools.py` returns platform-specific context alongside tool schemas. For `Platform.SSR`, the context string should be:

```
Consumer panel testing via SSR (Semantic Similarity Rating). Use ssr_panel_create to define
a synthetic persona panel, ssr_panel_run to test a marketing asset against the panel, and
ssr_panel_results to retrieve and compare results. Panels are reusable — always check
ssr_panel_list before creating a new panel with the same demographic profile.
```

**File change required**: `apps/bot/src_v2/mcp/meta_tools.py` — add `Platform.SSR` case to `get_platform_context()`.

The current `get_platform_context()` function returns a dict of platform → context string. Add:

```python
Platform.SSR: (
    "Consumer panel testing via SSR (Semantic Similarity Rating). Use ssr_panel_create to "
    "define a synthetic persona panel, ssr_panel_run to test a marketing asset against the "
    "panel, and ssr_panel_results to retrieve and compare results. Panels are reusable — "
    "always check ssr_panel_list before creating a new panel with the same demographic profile."
),
```

**File**: `apps/bot/src_v2/mcp/meta_tools.py`

### 7.3 Execute Tool Pattern

After discovery, Claude calls `execute_tool(name, params)` with:

```python
# Example: running a panel
execute_tool(
    name="ssr_panel_run",
    params={
        "panel_id": "abc-123",
        "stimulus_text": "Ang sarap ng tipid!",
        "stimulus_type": "tagline",
        "evaluation_dimensions": ["purchase_intent", "message_clarity", "personal_relevance"],
        "response_format": "summary",
        "run_label": "Initial tagline test",
    }
)
```

The `ToolRegistry.call_tool()` method validates params against `PanelRunInput`, injects contexts, and calls the handler.

---

## 8. Summary of Code Changes Required

| File | Change | Reason |
|------|--------|--------|
| `src_v2/core/selection.py` | Add 13 SSR keyword entries to `KEYWORD_PLATFORM_MAP` | Future tool filtering when `TOOL_FILTERING_ENABLED = True` |
| `src_v2/core/prompts/base.txt` | Add `<consumer-panel>` section (~20 lines) | Guide Claude on chaining, defaults, result presentation |
| `src_v2/mcp/meta_tools.py` | Add `Platform.SSR` case to `get_platform_context()` | Context string returned with SSR tool schemas on `discover_tools` call |
| `src_v2/core/platforms.py` | Add `SSR = "ssr"` | Required for tag system (specified in catalog-registration.md) |
| `src_v2/bootstrap/config.py` | Add `OpenAISettings` + `openai` field | Required for embedding (specified in catalog-registration.md) |
| `src_v2/mcp/context.py` | Add `openai_api_key` field | Required for embedding (specified in catalog-registration.md) |
| `src_v2/entrypoints/discord/main.py` | Pass `openai_api_key` to `ToolContext` | Required for embedding (specified in catalog-registration.md) |
| `src_v2/mcp/tools/ssr/__init__.py` | Create (new) | Package entry point (specified in catalog-registration.md) |
| `src_v2/mcp/catalog.py` | Add SSR imports + `ALL_TOOLS` entries | Register tools (specified in catalog-registration.md) |

The first 3 entries in this table are **new** changes identified by this aspect. The remaining 6 are already specified in [catalog-registration.md](catalog-registration.md).

---

## 9. What Is Explicitly Out of Scope

The following were considered and deliberately excluded:

| Pattern | Reason Excluded |
|---------|----------------|
| Dedicated "consumer panel workflow" type | No workflow infrastructure exists; not needed |
| Channel-level SSR gating | Adds friction without security benefit |
| User authentication requirement | SSR uses system API keys; no per-user credentials needed |
| Scheduled/automated panel runs | Out of scope for initial tools; can be added via Fly.io sessions later |
| Panel sharing between Discord users | Not supported; each `discord_id` sees only their own panels |
| Rate limiting per user | Not implemented; can be added later if abuse occurs |
| Panel templates (pre-defined demographic presets) | Not implemented; the agent can construct demographics from natural language |

---

## Cross-References

- [catalog-registration.md](catalog-registration.md) — Exact code for `platforms.py`, `config.py`, `context.py`, `main.py`, `catalog.py` changes
- [discord-ux.md](discord-ux.md) — How panel results render in Discord threads; progress indicators
- [panel-create.md](../tools/panel-create.md) — `ssr_panel_create` MCP definition, `PanelCreateInput` schema
- [panel-run.md](../tools/panel-run.md) — `ssr_panel_run` MCP definition, pipeline steps
- [panel-results.md](../tools/panel-results.md) — `ssr_panel_results` MCP definition, comparison mode
- [panel-manage.md](../tools/panel-manage.md) — `ssr_panel_list`, `ssr_panel_delete` MCP definitions
