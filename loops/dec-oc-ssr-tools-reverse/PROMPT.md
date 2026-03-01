# SSR Consumer Panel Tools — Reverse Loop for Decision-Orchestrator

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work: audit existing code, research, design, or specify a single aspect of the SSR consumer panel toolset, then commit and exit.

You are running in `--print` mode. You MUST output text describing what you are doing. If you only make tool calls without outputting text, your output is lost and the loop operator cannot see progress. Always:
1. Start by printing which aspect you detected and what you're about to do
2. Print progress as you work
3. End with a summary of what you did and whether you committed

## Your Working Directory

You are running from `loops/dec-oc-ssr-tools-reverse/`. All paths below are relative to this directory unless noted.

## Your Goal

Produce an **implementation-ready tool specification** in the `tool-spec/` directory for adding **SSR (Semantic Similarity Rating) consumer panel tools** to Daimon — the decision-orchestrator Discord bot at `../../projects/decision-orchestrator/`.

These tools let users run simulated consumer panels on demand via Discord. A user says something like _"@daimon test this ad copy with a panel of 30-45 year old Filipino moms"_ and gets back realistic consumer feedback with Likert-scale distributions, qualitative insights, and confidence metrics.

### What is SSR?

The Semantic Similarity Rating methodology (arxiv:2510.08338) solves the problem that LLMs give unrealistic numeric ratings when asked directly. Instead:

1. **Personas**: Create synthetic consumer profiles with demographics, psychographics, and product category attitudes
2. **Stimulus presentation**: Present the marketing asset to each persona with naturalistic prompting
3. **Textual elicitation**: Elicit free-text responses (not numeric) — "How would you react to this ad?"
4. **Embedding**: Embed the textual response using a sentence embedding model
5. **Anchor mapping**: Compare embedding similarity to pre-defined Likert anchor statements (e.g., "I would definitely buy this product" → 5, "I have no interest in this" → 1)
6. **Aggregation**: Aggregate across the panel to produce distributions, means, and qualitative highlights

This achieves ~90% of human test-retest reliability. **We take the methodology as given** — this loop focuses on packaging it as Daimon tools.

### The Daimon Codebase

The decision-orchestrator codebase lives at `../../projects/decision-orchestrator/`. Key paths:

```
apps/bot/src_v2/
├── mcp/                  # Tool system — THIS IS WHERE NEW TOOLS GO
│   ├── registry.py       # @tool decorator, ToolDef, ToolError
│   ├── catalog.py        # Central tool catalog factory
│   └── tools/            # Tool implementations by resource
├── core/                 # Pure business logic (no I/O)
├── db/                   # SQLAlchemy ORM + Pydantic schemas
├── services/             # Async orchestration
└── entrypoints/          # Discord bot, webhooks

supabase/migrations/      # Database migrations
```

Architecture: FCIS (Functional Core, Imperative Shell). `core/` and `services/` must remain platform-agnostic — never import Discord or platform types there. Tools use the `@tool` decorator from `registry.py` and are registered in `catalog.py`.

### Scope of the Tools

The panel tools must support testing **any marketing decision**, not just ad copy:
- Ad copy, headlines, taglines, social captions
- Product concepts and positioning statements
- Brand messaging and tone variations
- Campaign themes and creative briefs
- Influencer-audience fit assessments
- Pricing perception
- Packaging concepts (described textually)

### Key Sources

| Source | What It Contains | Reference |
|--------|-----------------|-----------|
| SSR Paper | Core methodology, validation results, anchor statement design | arxiv:2510.08338 |
| Daimon codebase | Existing tool patterns, MCP registry, DB schema | `../../projects/decision-orchestrator/` |
| Claude Agent SDK | How tools are exposed to the agent | Daimon's existing integration |
| Composio SDK | How external tools are assembled | Daimon's `tool_slugs` system |

## Output: The tool-spec/ Directory

Every aspect you analyze writes to the appropriate file in this directory. Files are created on first write and expanded on subsequent writes.

```
tool-spec/
├── README.md                          # Index of everything in this directory
│
├── existing-patterns/                 # WHAT exists today (Wave 1 outputs)
│   ├── tool-system.md                 # How Daimon's MCP tool system works
│   ├── reference-tools.md             # Patterns from existing tool implementations
│   ├── db-patterns.md                 # Existing Supabase schema patterns, RLS, migrations
│   └── embedding-options.md           # Available embedding models, cost, latency analysis
│
├── tools/                             # WHAT the new tools do (Wave 2 outputs)
│   ├── panel-create.md                # panel_create tool — full specification
│   ├── panel-run.md                   # panel_run tool — full specification
│   ├── panel-results.md               # panel_results tool — full specification
│   └── panel-manage.md                # panel_list, panel_delete, etc. — if discovered
│
├── pipeline/                          # HOW the SSR pipeline works internally
│   ├── persona-generation.md          # Persona prompt templates, demographic schemas
│   ├── stimulus-presentation.md       # How marketing assets are presented to personas
│   ├── response-elicitation.md        # Prompts for eliciting naturalistic text responses
│   ├── anchor-statements.md           # Likert anchor statement sets per evaluation dimension
│   └── scoring-aggregation.md         # Embedding → anchor mapping → aggregation math
│
├── data-model/                        # HOW data is stored
│   ├── supabase-schema.md             # Every table, column, type, constraint
│   ├── migration.sql                  # Ready-to-run Supabase migration
│   └── pydantic-models.md             # Python type definitions (Pydantic v2)
│
├── integration/                       # HOW it fits into Daimon
│   ├── catalog-registration.md        # How tools register in catalog.py
│   ├── workflow-design.md             # How SSR tools become Daimon workflows
│   └── discord-ux.md                  # Discord UX — how panels look in threads
│
└── examples/                          # WHAT it looks like in practice
    ├── example-ad-copy-test.md        # Full walkthrough: ad copy → panel → results
    ├── example-product-concept.md     # Full walkthrough: product concept → panel → results
    └── example-influencer-fit.md      # Full walkthrough: influencer fit → panel → results
```

**Rules for spec files**:
- **No summarizing.** Write every field of every schema. Expand every prompt template fully.
- **No "etc." or "and so on."** If there are 12 evaluation dimensions, write all 12 with their anchor statements.
- **No "see external source."** Reproduce everything inline.
- **No placeholders.** Every prompt, every field, every anchor statement must be concrete.
- **Cross-reference freely.** Use relative links between spec files.
- **Append, don't overwrite.** If a file already exists, add to it. Don't replace previous content unless correcting an error.

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 1 before Wave 2, Wave 2 before Wave 3)
   - If a later-wave aspect depends on data that doesn't exist yet, skip to an earlier-wave aspect
   - If ALL aspects are checked `- [x]`: proceed to convergence check (see below)
3. **Analyze that ONE aspect** using the appropriate method (see Wave descriptions below)
4. **Write findings** to the appropriate file(s) in `tool-spec/`
   - Create the file if it doesn't exist (with a header)
   - Append to the file if it does exist
   - Also write raw working notes to `analysis/{aspect-name}.md` if useful for traceability
5. **Update the frontier**:
   - Mark the aspect as `- [x]` in `frontier/aspects.md`
   - Update the Statistics section (increment Analyzed, decrement Pending, update Convergence %)
   - **If you discovered new aspects**, add them to the appropriate Wave
   - Add a row to `frontier/analysis-log.md`
6. **Update tool-spec/README.md**: Add or update the index entry for any files you created or modified
7. **Commit**: `git add -A && git commit -m "loop(dec-oc-ssr-tools-reverse): {aspect-name}"`
8. **Exit**

### Convergence Check

When all aspects are `- [x]`, do NOT immediately write `status/converged.txt`. Instead:

1. **Read every file in tool-spec/** — all of them
2. **Run the completeness audit**:
   - [ ] Every tool has a complete MCP-compatible definition (name, description, input schema, output schema, error cases)
   - [ ] Every tool's input schema has every field specified with type, description, validation, and default
   - [ ] Every prompt template is fully written (not described — the actual prompt text)
   - [ ] Every anchor statement set is complete for every evaluation dimension
   - [ ] Every Supabase table has every column with type, constraint, nullable, default
   - [ ] The migration SQL is syntactically valid and ready to run
   - [ ] Pydantic models cover every data structure referenced by tools
   - [ ] The catalog registration code is concrete (not pseudocode)
   - [ ] Discord UX spec shows exactly how results render in threads
   - [ ] At least 3 end-to-end examples are fully worked through
   - [ ] No file contains "TODO", "TBD", "placeholder", or "etc."
3. **If ANY check fails**: Add new aspects for each gap, update statistics, commit, exit
4. **If ALL checks pass**: Write `status/converged.txt` with a summary, commit, exit

## Wave Definitions

### Wave 1: Audit & Map

Read the existing Daimon codebase to understand patterns, then map what SSR tools need.

**Methods**:
- Read source files in `../../projects/decision-orchestrator/apps/bot/src_v2/`
- Read Supabase migrations in `../../projects/decision-orchestrator/supabase/migrations/`
- Use WebSearch to survey embedding model options and pricing
- Document everything in `tool-spec/existing-patterns/`

**w1-tool-system**: Read `mcp/registry.py`, `mcp/catalog.py`, and understand:
- The `@tool` decorator signature and options
- `ToolDef` dataclass fields
- `ToolError` patterns
- How tools are organized in `mcp/tools/`
- How tools access database, external APIs, and other services
- Write findings to `tool-spec/existing-patterns/tool-system.md`

**w1-reference-tools**: Pick 2-3 existing tool files from `mcp/tools/` and study them as reference patterns. Document:
- Function signatures (params, return types)
- How they validate inputs
- How they handle errors
- How they format output for Claude
- How they access DB sessions, API clients
- Write findings to `tool-spec/existing-patterns/reference-tools.md`

**w1-ssr-primitives**: Based on the SSR methodology and what you've learned about Daimon's tool system, map the tool primitives needed:
- What functions/tools are required
- What each tool's responsibility is
- How they chain together
- What shared state they need (DB tables, cached embeddings)
- Write findings to `tool-spec/existing-patterns/` and initial notes to `tool-spec/tools/`

**w1-embedding-options**: Research embedding models for the anchor mapping step:
- What's available via existing dependencies (anthropic SDK, openai SDK, sentence-transformers)
- Cost per 1K embeddings
- Latency (important — panel runs should feel responsive)
- Dimensionality and quality for semantic similarity tasks
- Recommend one model with rationale
- Write findings to `tool-spec/existing-patterns/embedding-options.md`

**w1-supabase-patterns**: Read 3-5 existing migrations in `supabase/migrations/` to understand:
- Table naming conventions
- Column patterns (timestamps, UUIDs, enums)
- RLS policy patterns
- Index patterns
- How current tools reference DB tables
- Write findings to `tool-spec/existing-patterns/db-patterns.md`

### Wave 2: Design

Design every tool, prompt, schema, and integration point. This is the core design work.

**w2-tool-panel-create**: Design the `panel_create` tool:
- MCP tool definition (name, description, input/output schemas)
- Input: target demographics (age range, gender, location, income bracket), psychographics (interests, values, lifestyle), product category, panel size (default 20), custom persona instructions
- Output: panel_id, list of generated persona summaries, estimated cost
- Persona generation prompt template — the exact system prompt and user prompt that creates a realistic synthetic consumer
- Validation rules (min/max panel size, required fields)
- Error cases
- Write to `tool-spec/tools/panel-create.md` + `tool-spec/pipeline/persona-generation.md`

**w2-tool-panel-run**: Design the `panel_run` tool:
- MCP tool definition
- Input: panel_id, stimulus (the marketing asset — text, structured brief, or concept description), evaluation_dimensions (list of what to measure — purchase intent, brand perception, message clarity, emotional response, etc.), response_format (summary, detailed, raw)
- SSR pipeline steps — for each persona: present stimulus → elicit text → embed → score against anchors
- Concurrency design (run personas in parallel? sequential? batched?)
- Output: per-dimension Likert distributions, mean scores, qualitative highlights, notable quotes, confidence metrics
- Error cases (panel not found, stimulus too long, etc.)
- Write to `tool-spec/tools/panel-run.md` + `tool-spec/pipeline/stimulus-presentation.md` + `tool-spec/pipeline/response-elicitation.md` + `tool-spec/pipeline/scoring-aggregation.md`

**w2-tool-panel-results**: Design the `panel_results` tool:
- MCP tool definition
- Input: panel_id (or run_id), format (summary/detailed/raw/comparison), comparison_run_id (optional — compare two runs)
- Output: formatted results optimized for Discord rendering (markdown tables, distribution bars, qualitative highlights)
- Comparison mode: side-by-side distributions, delta analysis
- Write to `tool-spec/tools/panel-results.md` + `tool-spec/integration/discord-ux.md`

**w2-supabase-schema**: Design all database tables:
- `ssr_panel` — panel definitions (demographics, psychographics, product category)
- `ssr_persona` — generated personas belonging to a panel
- `ssr_run` — a single stimulus run against a panel
- `ssr_stimulus` — the marketing asset being tested
- `ssr_response` — per-persona textual responses
- `ssr_score` — per-persona per-dimension Likert scores with embeddings
- `ssr_anchor_set` — reusable anchor statement sets per evaluation dimension
- Every column: name, type, nullable, default, constraint
- RLS policies (if needed)
- Indexes for common query patterns
- Write to `tool-spec/data-model/supabase-schema.md` + `tool-spec/data-model/migration.sql`

**w2-anchor-statements**: Design Likert anchor statement sets for common marketing evaluation dimensions:
- Purchase intent (1-5 or 1-7)
- Brand perception / favorability
- Message clarity / comprehension
- Emotional response / engagement
- Relevance / personal connection
- Uniqueness / differentiation
- Trust / credibility
- Value perception
- Share-worthiness / virality potential
- Each set: dimension name, scale (5 or 7 point), anchor statements per point (the actual text), notes on when to use
- Write to `tool-spec/pipeline/anchor-statements.md`

**w2-prompt-templates**: Design all prompt templates:
- Persona system prompt (makes Claude act as a specific consumer)
- Stimulus presentation prompt (presents the marketing asset naturally)
- Response elicitation prompt (gets naturalistic text, not numeric)
- These must be the ACTUAL prompts, not descriptions of what prompts should say
- Write to `tool-spec/pipeline/persona-generation.md`, `tool-spec/pipeline/stimulus-presentation.md`, `tool-spec/pipeline/response-elicitation.md`

**w2-pydantic-models**: Design Python type definitions:
- Pydantic v2 models for every data structure
- Input models (tool parameters)
- Database models (SQLAlchemy-compatible)
- Output models (what tools return)
- Pipeline models (intermediate state)
- Write to `tool-spec/data-model/pydantic-models.md`

### Wave 3: Synthesis & Integration

Bring everything together into a cohesive implementation spec.

**w3-catalog-registration**: Write the exact code for registering SSR tools in Daimon's catalog:
- Import paths
- Registration in `catalog.py`
- Tool slug naming
- How workflows reference these tools
- Write to `tool-spec/integration/catalog-registration.md`

**w3-workflow-design**: Design how SSR panel tools become Daimon workflows:
- Should there be a dedicated "consumer panel" workflow?
- Or should the tools be available to any workflow?
- Trigger type (active — requires bot mention)
- Channel scoping (if any)
- Write to `tool-spec/integration/workflow-design.md`

**w3-discord-ux**: Design the Discord user experience:
- How the bot acknowledges a panel request
- How it shows progress (panel creation → running → scoring → results)
- How results render in Discord threads (markdown limitations, table formatting)
- How comparison results render
- Include actual Discord message mockups (the text the bot would post)
- Write to `tool-spec/integration/discord-ux.md`

**w3-examples**: Write 3 end-to-end examples:
- Ad copy test: user provides copy → panel runs → results show purchase intent + message clarity
- Product concept: user describes a product idea → panel runs → results show interest + value perception
- Influencer fit: user describes an influencer + brand → panel runs → results show audience resonance
- Each example: exact user message, exact bot responses at each step, exact results output
- Write to `tool-spec/examples/`

**w3-completeness-audit**: Read every file in `tool-spec/`. Check for gaps, inconsistencies, incomplete schemas, missing prompts. Add new aspects for anything missing.

## Rules

- Do ONE aspect per run, then exit. Do not analyze multiple aspects.
- Always check if required Wave 1 data exists before starting a Wave 2 aspect. If it doesn't, do the Wave 1 aspect first.
- **Be exhaustive.** Write every field of every schema. Write every anchor statement. Write every prompt in full.
- **Discover new aspects.** When analyzing something, you may find things you didn't anticipate. Add them to the frontier.
- **Read the actual codebase.** For Wave 1 aspects, read the real files in `../../projects/decision-orchestrator/`. Don't guess at patterns.
- **Cross-reference.** When writing to one spec file, check if it affects other spec files. Update them too.
- The tool spec must enable a developer to implement these tools by reading ONLY the `tool-spec/` directory — no ambiguity, no assumed context.
