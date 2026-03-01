# SSR Consumer Panel Tools — Tool Spec Index

Implementation-ready specification for adding SSR (Semantic Similarity Rating) consumer panel tools to Daimon (decision-orchestrator Discord bot).

## Status

Wave 1: Audit & Map — 5/5 complete
Wave 2: Design — 0/7 complete
Wave 3: Synthesis & Integration — 0/4 complete

---

## existing-patterns/

Audit of the existing Daimon codebase — patterns a developer must understand before implementing new tools.

| File | Status | Contents |
|------|--------|----------|
| [tool-system.md](existing-patterns/tool-system.md) | ✅ Complete | `@tool` decorator, `ToolDef`, `ToolError`, `ToolRegistry`, `ToolContext`, `DatabaseContext`, `UserContext`, registration in `catalog.py`, XML output helpers |
| [reference-tools.md](existing-patterns/reference-tools.md) | ✅ Complete | Patterns from `discord/read.py`, `bluedot/read.py`+`api.py`, `github/tools.py`, `acp/tools.py` — split-file structure, DB access, formatters, error handling, pagination, credential gates |
| [ssr-primitives.md](existing-patterns/ssr-primitives.md) | ✅ Complete | 5 tools, full pipeline decomposition (persona gen → elicitation → embed → score → aggregate), 6 DB tables, design decisions (eager personas, sync blocking, asyncio.gather, haiku model, softmax scoring) |
| [db-patterns.md](existing-patterns/db-patterns.md) | ✅ Complete | UUID PKs, TIMESTAMPTZ NOT NULL, shared updated_at trigger, TEXT enums with CHECK, ON DELETE CASCADE, no RLS (service_role), discord_id TEXT ownership, FLOAT8[] embeddings, index naming/patterns, migration filename convention |
| [embedding-options.md](existing-patterns/embedding-options.md) | ✅ Complete | `text-embedding-3-small` recommended; cost $0.00006/run; required changes to `ToolContext`, `config.py`, `main.py`; scoring logic (cosine similarity, softmax-weighted mean); anchor pre-embedding strategy |

---

## tools/

MCP-compatible tool definitions for the SSR panel tools.

| File | Status | Contents |
|------|--------|----------|
| [panel-create.md](tools/panel-create.md) | 🔶 Stub | `ssr_panel_create` — call chain, design decisions, Wave 2 checklist |
| [panel-run.md](tools/panel-run.md) | 🔶 Stub | `ssr_panel_run` — full pipeline call chain, scoring algorithm outline, Wave 2 checklist |
| [panel-results.md](tools/panel-results.md) | 🔶 Stub | `ssr_panel_results` — retrieval + comparison call chain, Wave 2 checklist |
| [panel-manage.md](tools/panel-manage.md) | 🔶 Stub | `ssr_panel_list`, `ssr_panel_delete` — call chains, design notes, Wave 2 checklists |

---

## pipeline/

Internal SSR pipeline — how the methodology is implemented.

| File | Status | Contents |
|------|--------|----------|
| [persona-generation.md](pipeline/persona-generation.md) | ⬜ Pending | Persona prompt templates, demographic schemas |
| [stimulus-presentation.md](pipeline/stimulus-presentation.md) | ⬜ Pending | How marketing assets are presented to personas |
| [response-elicitation.md](pipeline/response-elicitation.md) | ⬜ Pending | Prompts for eliciting naturalistic text responses |
| [anchor-statements.md](pipeline/anchor-statements.md) | ⬜ Pending | Likert anchor statement sets per evaluation dimension |
| [scoring-aggregation.md](pipeline/scoring-aggregation.md) | ⬜ Pending | Embedding → anchor mapping → aggregation math |

---

## data-model/

Database schema and Python type definitions.

| File | Status | Contents |
|------|--------|----------|
| [supabase-schema.md](data-model/supabase-schema.md) | ⬜ Pending | Every table, column, type, constraint |
| [migration.sql](data-model/migration.sql) | ⬜ Pending | Ready-to-run Supabase migration |
| [pydantic-models.md](data-model/pydantic-models.md) | ⬜ Pending | Python type definitions (Pydantic v2) |

---

## integration/

How SSR tools fit into Daimon.

| File | Status | Contents |
|------|--------|----------|
| [catalog-registration.md](integration/catalog-registration.md) | ⬜ Pending | How tools register in `catalog.py` |
| [workflow-design.md](integration/workflow-design.md) | ⬜ Pending | How SSR tools become Daimon workflows |
| [discord-ux.md](integration/discord-ux.md) | ⬜ Pending | Discord UX — how panels look in threads |

---

## examples/

End-to-end worked examples.

| File | Status | Contents |
|------|--------|----------|
| [example-ad-copy-test.md](examples/example-ad-copy-test.md) | ⬜ Pending | Full walkthrough: ad copy → panel → results |
| [example-product-concept.md](examples/example-product-concept.md) | ⬜ Pending | Full walkthrough: product concept → panel → results |
| [example-influencer-fit.md](examples/example-influencer-fit.md) | ⬜ Pending | Full walkthrough: influencer fit → panel → results |
