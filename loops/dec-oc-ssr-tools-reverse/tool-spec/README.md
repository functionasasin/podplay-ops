# SSR Consumer Panel Tools — Tool Spec Index

Implementation-ready specification for adding SSR (Semantic Similarity Rating) consumer panel tools to Daimon (decision-orchestrator Discord bot).

## Status

Wave 1: Audit & Map — 5/5 complete
Wave 2: Design — 7/7 complete
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
| [panel-create.md](tools/panel-create.md) | ✅ Complete | `ssr_panel_create` — full MCP definition, `PanelCreateInput`/`PersonaDemographics`/`PersonaPsychographics` schemas, handler, API layer, `_fmt_panel_created()`, `_parse_persona_response()`, validation rules, error cases, repository signatures |
| [panel-run.md](tools/panel-run.md) | ✅ Complete | `ssr_panel_run` — full MCP definition, `PanelRunInput`/`StimulusType`/`EvaluationDimension`/`ResponseFormat` schemas, 4-stage pipeline handler, `run_ssr_pipeline()` API, formatters, concurrency design, validation, errors, 5 repository file specs |
| [panel-results.md](tools/panel-results.md) | ✅ Complete | `ssr_panel_results` — full MCP definition, `PanelResultsInput` schema, `_fmt_retrieved_results()` + `_fmt_comparison_results()` + `_fmt_dimension_comparison()` formatters, `get_run_results()` + `get_latest_run_for_panel()` + `compute_dimension_comparisons()` API, `RetrievedRunResult`/`DimensionComparison`/`SsrRunRecord`/`SsrScoreRecord`/`SsrResponseRecord` data models, 3 worked examples (summary retrieval, summary comparison, detailed comparison), validation, errors, repository signatures, cross-correction to panel-run.md (add discord_id + completed_at to ssr_run) |
| [panel-manage.md](tools/panel-manage.md) | 🔶 Stub | `ssr_panel_list`, `ssr_panel_delete` — call chains, design notes, Wave 2 checklists |

---

## pipeline/

Internal SSR pipeline — how the methodology is implemented.

| File | Status | Contents |
|------|--------|----------|
| [persona-generation.md](pipeline/persona-generation.md) | ✅ Complete | Full system prompt (~420 tokens), full user prompt template with all substitution logic, rendered example, expected Claude response example, `_parse_persona_response()` parsing table, cost accounting ($0.003/persona), concurrency architecture, diversity enforcement, storage mapping to `ssr_persona` table; §10 format failure handling + `_build_persona_retry_prompt()` + `_generate_single_persona_with_retry()` (v1 not used) |
| [stimulus-presentation.md](pipeline/stimulus-presentation.md) | ✅ Complete | `_build_ssr_system_prompt()` — persona inhabitation system prompt (~840 tokens), rendered example, design rationale (why full_profile, why no numeric ratings, VOICE instruction), token estimate |
| [response-elicitation.md](pipeline/response-elicitation.md) | ✅ Complete | `_build_ssr_user_prompt()` — `_STIMULUS_LABELS` and `_STIMULUS_CONTEXT` for all 10 StimulusType values, 3 rendered examples each with expected responses (social caption/Maria Santos, product_concept/Gen Z gamer, headline/professional woman), response quality notes, dimension coverage table, token estimate; §6 multilingual handling (text-embedding-3-small cross-lingual alignment, English anchor design rationale); §7 break-character detection (`_is_break_character()` heuristic, 30% failure threshold warning) |
| [anchor-statements.md](pipeline/anchor-statements.md) | ✅ Complete | All 10 evaluation dimensions with full when-to-use guidance and design rationale; all 50 anchor statements; 5-point scale rationale; 5 anchor quality principles (first-person voice, monotonicity, distinctiveness, genuine neutrality, dimensional purity); dimension-by-stimulus recommendation matrix; full `seed_anchor_embeddings.py` implementation; `EvaluationDimension` enum reference |
| [scoring-aggregation.md](pipeline/scoring-aggregation.md) | ✅ Complete | `cosine_similarity()`, `score_against_anchors()` (softmax+argmax), `_aggregate_scores()` (mean, std, mode, t-CI with hardcoded t-table), `_select_highlights()`, `_extract_response_excerpt()`, anchor loading from DB, embedding version check, DB storage spec |

---

## data-model/

Database schema and Python type definitions.

| File | Status | Contents |
|------|--------|----------|
| [supabase-schema.md](data-model/supabase-schema.md) | ✅ Complete | All 6 tables (ssr_panel, ssr_persona, ssr_run, ssr_response, ssr_score, ssr_anchor_set): every column with type/nullable/default/constraint, FK graph, 14 indexes, 2 updated_at triggers, 6 query pattern examples, repository file list |
| [migration.sql](data-model/migration.sql) | ✅ Complete | Ready-to-run Supabase migration: 6 CREATE TABLE, 14 indexes, 2 triggers, 50 anchor statement seed rows (NULL embeddings — populated by seed script) |
| [pydantic-models.md](data-model/pydantic-models.md) | ✅ Complete | 22 types: 3 enums (`StimulusType`, `EvaluationDimension`, `ResponseFormat`); 7 Pydantic v2 input models (`PersonaDemographics`, `PersonaPsychographics`, `PanelCreateInput`, `PanelRunInput`, `PanelResultsInput`, `PanelListInput`, `PanelDeleteInput`); 11 pipeline/output dataclasses (`SsrPersonaSummary`, `CreatePanelResult`, `DimensionScore`, `PersonaResponse`, `HighlightQuote`, `AggregatedDimensionResult`, `PanelRunResult`, `AnchorPoint`, `AnchorSet`, `RetrievedRunResult`, `DimensionComparison`); 6 DB row dataclasses (`SsrPanelRow`, `SsrPersonaRow`, `SsrRunRecord`, `SsrResponseRecord`, `SsrScoreRecord`, `SsrAnchorSetRow`); 2 output/summary dataclasses (`SsrPanelSummary`, `SsrDeleteResult`). Includes type dependency graph and module-level import lists per file. |

---

## integration/

How SSR tools fit into Daimon.

| File | Status | Contents |
|------|--------|----------|
| [catalog-registration.md](integration/catalog-registration.md) | ⬜ Pending | How tools register in `catalog.py` |
| [workflow-design.md](integration/workflow-design.md) | ⬜ Pending | How SSR tools become Daimon workflows |
| [discord-ux.md](integration/discord-ux.md) | 🔶 Partial | Discord UX — panel results rendering (message sizing, thread delivery thresholds, comparison format, character budget); full interactive flow pending w3-discord-ux |

---

## examples/

End-to-end worked examples.

| File | Status | Contents |
|------|--------|----------|
| [example-ad-copy-test.md](examples/example-ad-copy-test.md) | ⬜ Pending | Full walkthrough: ad copy → panel → results |
| [example-product-concept.md](examples/example-product-concept.md) | ⬜ Pending | Full walkthrough: product concept → panel → results |
| [example-influencer-fit.md](examples/example-influencer-fit.md) | ⬜ Pending | Full walkthrough: influencer fit → panel → results |
