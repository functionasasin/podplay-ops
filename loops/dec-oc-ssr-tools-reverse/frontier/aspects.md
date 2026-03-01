# Frontier — SSR Consumer Panel Tools for Decision-Orchestrator

## Statistics
- Total aspects discovered: 16
- Analyzed: 1
- Pending: 15
- Convergence: 6%

## Pending Aspects (ordered by dependency)

### Wave 1: Audit & Map
Read the existing Daimon codebase and map what SSR tools need.
- [x] w1-tool-system — Read mcp/registry.py, catalog.py, understand @tool decorator, ToolDef, ToolError, tool organization
- [ ] w1-reference-tools — Study 2-3 existing tool implementations as reference patterns (signatures, validation, error handling, DB access)
- [ ] w1-ssr-primitives — Map what tool functions the SSR pipeline requires, how they chain, what shared state they need
- [ ] w1-embedding-options — Survey embedding models (cost, latency, quality) for the anchor mapping step, recommend one
- [ ] w1-supabase-patterns — Read existing migrations for table naming, column patterns, RLS, indexes

### Wave 2: Design
Design every tool, prompt, schema, and integration point.
- [ ] w2-tool-panel-create — Design panel_create tool: MCP definition, input/output schemas, persona generation prompt, validation
- [ ] w2-tool-panel-run — Design panel_run tool: MCP definition, SSR pipeline steps, concurrency, scoring, output format
- [ ] w2-tool-panel-results — Design panel_results tool: MCP definition, result formatting for Discord, comparison mode
- [ ] w2-supabase-schema — Design all DB tables (ssr_panel, ssr_persona, ssr_run, ssr_stimulus, ssr_response, ssr_score, ssr_anchor_set)
- [ ] w2-anchor-statements — Design Likert anchor statement sets for all marketing evaluation dimensions
- [ ] w2-prompt-templates — Design all prompt templates (persona system prompt, stimulus presentation, response elicitation)
- [ ] w2-pydantic-models — Design Pydantic v2 models for all data structures (input, DB, output, pipeline)

### Wave 3: Synthesis & Integration
Bring everything together into a cohesive implementation spec.
- [ ] w3-catalog-registration — Write exact code for registering SSR tools in Daimon's catalog
- [ ] w3-workflow-design — Design how SSR tools become Daimon workflows (trigger type, scoping)
- [ ] w3-discord-ux — Design Discord UX (progress indicators, result rendering, comparison views)
- [ ] w3-examples — Write 3 end-to-end examples (ad copy, product concept, influencer fit)

## Recently Analyzed
- [x] w1-tool-system — `@tool` decorator, `ToolDef`, `ToolError`, `ToolRegistry`, `ToolContext`, `DatabaseContext`, `UserContext`, XML output helpers, tool organization, catalog registration pattern. Key finding: need to add `Platform.SSR` to `core/platforms.py`. `anthropic_api_key` already in `ToolContext`.
