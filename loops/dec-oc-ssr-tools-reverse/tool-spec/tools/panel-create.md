# `ssr_panel_create` — Tool Specification

> Status: Stub (w1-ssr-primitives). Full specification: w2-tool-panel-create.

---

## Established From w1-ssr-primitives

**Tool name (function name)**: `ssr_panel_create`
**Tags**: `{Platform.SSR, Action.WRITE}`
**requires_credential**: None
**db_context**: Required (raises ToolError if None)
**Owner field**: `user_context.discord_id`

**Responsibility**: Create a consumer panel and eagerly generate all N synthetic personas.
Does NOT run any stimulus — that is `ssr_panel_run`'s job.

**Internal call chain**:
```
ssr_panel_create (tool handler)
  └── api.create_panel_with_personas(db, tool_ctx, discord_id, demographics, psychographics, product_category, panel_size, custom_instructions)
        ├── db insert: ssr_panel → panel_id
        └── api._generate_all_personas() [asyncio.gather over panel_size]
              └── api._generate_single_persona() × N [calls Claude claude-haiku-4-5-20251001]
              └── db bulk insert: ssr_persona × N
```

**LLM model for persona generation**: `claude-haiku-4-5-20251001`

**Panel size cap**: max 50 (Discord interaction timeout constraint)

**What to specify in w2-tool-panel-create**:
- [ ] Full MCP input schema (demographics object, psychographics object, product_category, panel_size, custom_persona_instructions, optional panel_name)
- [ ] Full MCP output schema (panel_id, persona summaries list, estimated_run_cost_usd)
- [ ] Persona generation system prompt (full text)
- [ ] Persona generation user prompt (full text)
- [ ] Validation rules (minimum demographics requirements, panel_size 5-50)
- [ ] Error cases (demographic conflicts, Claude failure partial recovery)
- [ ] Output formatter: _fmt_panel_created()
- [ ] Cross-write to pipeline/persona-generation.md

---

## Cross-References

- [ssr-primitives.md](../existing-patterns/ssr-primitives.md) — Section 1.3, Section 2.1
- [persona-generation.md](../pipeline/persona-generation.md) — Persona prompt templates (pending)
- [pydantic-models.md](../data-model/pydantic-models.md) — PanelCreateInput, PersonaDemographics, PersonaPsychographics (pending)
