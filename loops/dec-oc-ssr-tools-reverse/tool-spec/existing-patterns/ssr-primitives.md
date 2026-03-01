# SSR Tool Primitives — Pipeline Decomposition

> Aspect: w1-ssr-primitives
> Analyzed: 2026-03-01
> Source: SSR methodology (arxiv:2510.08338), existing Daimon patterns from `tool-system.md` + `reference-tools.md`

---

## Overview

This document maps the SSR (Semantic Similarity Rating) methodology onto Daimon's tool system:
which user-facing tools are needed, how they chain together, what internal pipeline functions
each tool calls, and what shared database state they require.

The SSR pipeline has six distinct steps:
1. **Persona creation** — Generate synthetic consumer profiles matching a demographic/psychographic target
2. **Stimulus presentation** — Show the marketing asset to each persona with naturalistic framing
3. **Response elicitation** — Ask each persona to react in natural language (no numeric rating)
4. **Embedding** — Convert each text response to a dense vector
5. **Anchor mapping** — Compute cosine similarity between the response embedding and pre-defined Likert anchor statement embeddings
6. **Aggregation** — Produce distributions, means, and qualitative highlights across the panel

These six steps map onto **5 user-facing MCP tools** and a layered internal pipeline.

---

## Section 1: User-Facing Tools

### 1.1 Tool Inventory

| Tool Function Name | Action Tag | Description |
|---|---|---|
| `ssr_panel_create` | `WRITE` | Create a consumer panel: define demographics/psychographics and eagerly generate all N personas |
| `ssr_panel_run` | `WRITE` | Run a panel against a stimulus: execute the full SSR pipeline, store results, return summary |
| `ssr_panel_results` | `READ` | Retrieve formatted results for a completed run, optionally comparing two runs |
| `ssr_panel_list` | `READ` | List all panels owned by the requesting Discord user |
| `ssr_panel_delete` | `WRITE` | Delete a panel and all associated data (personas, runs, responses, scores) |

All five are tagged `Platform.SSR`. `Platform.SSR = "ssr"` must be added to `apps/bot/src_v2/core/platforms.py`.

### 1.2 Tool Chaining Pattern

```
User request: "test this ad copy with Filipino moms 30-45"
        │
        ▼
ssr_panel_create(demographics=..., panel_size=20)
        │  returns panel_id="p-abc123", 20 persona summaries
        │
        ▼
ssr_panel_run(panel_id="p-abc123", stimulus_text="...", evaluation_dimensions=["purchase_intent", "message_clarity"])
        │  returns run_id="r-xyz789", aggregate results
        │
        ▼
ssr_panel_results(run_id="r-xyz789", format="detailed")   ← optional: retrieve later or compare
        │  returns Discord-formatted result card
        │
        ▼
ssr_panel_list()   ← optional: discovery when user doesn't remember panel_id
ssr_panel_delete(panel_id="p-abc123")   ← optional: cleanup
```

The typical "happy path" requires exactly two tool calls: `ssr_panel_create` followed by `ssr_panel_run`.
Results from `ssr_panel_run` are complete — `ssr_panel_results` is only needed for retrieval or comparison.

### 1.3 Each Tool's Responsibilities

#### `ssr_panel_create`
- **Input**: demographics, psychographics, product_category, panel_size, custom_persona_instructions
- **Actions**:
  1. Validate inputs (panel_size bounds, at least one demographic or psychographic field)
  2. Insert panel row into `ssr_panel`, get `panel_id`
  3. Generate `panel_size` synthetic personas concurrently via Claude
  4. Insert all persona rows into `ssr_persona`
  5. Compute and return estimated cost for a run
- **Output**: `panel_id`, list of persona summary descriptions, estimated cost per run
- **Does NOT** run any stimulus — that is `ssr_panel_run`'s job

Why eager persona generation? The user can review what the panel looks like before running expensive tests.
Why insert into DB before running? Personas are reusable across multiple stimulus runs.

#### `ssr_panel_run`
- **Input**: panel_id, stimulus_text, stimulus_type, evaluation_dimensions, response_format
- **Actions**:
  1. Validate panel_id belongs to the requesting discord_id
  2. Load all personas for the panel
  3. Load anchor sets for each requested evaluation_dimension from `ssr_anchor_set`
  4. Insert `ssr_run` row (status=pending), insert `ssr_stimulus` row
  5. Update run status to 'running'
  6. For each persona concurrently:
     a. Present stimulus and elicit text response via Claude
     b. Embed response text
     c. Score against anchor embeddings for each dimension
  7. Batch insert all `ssr_response` and `ssr_score` rows
  8. Aggregate scores: compute distributions, means, standard deviations, qualitative highlights
  9. Update run status to 'completed'
  10. Format and return aggregate results
- **Output**: run_id, per-dimension Likert distributions, means, confidence intervals, qualitative quotes
- **Blocking**: runs synchronously, returns when all personas are scored

#### `ssr_panel_results`
- **Input**: panel_id or run_id, format ("summary" | "detailed" | "raw"), optional comparison_run_id
- **Actions**:
  1. Load run results from DB (join ssr_run, ssr_score, ssr_response, ssr_persona)
  2. Re-aggregate (same math as ssr_panel_run — idempotent)
  3. Format for Discord markdown output
  4. If comparison_run_id: load second run, compute deltas, format side-by-side
- **Output**: Discord-formatted result card (markdown tables, bar distributions, notable quotes)

#### `ssr_panel_list`
- **Input**: limit (default 10, max 50), offset (default 0)
- **Actions**: Query `ssr_panel` filtered by discord_id, with run counts from `ssr_run`
- **Output**: Panel list with ids, names, sizes, creation dates, run counts

#### `ssr_panel_delete`
- **Input**: panel_id
- **Actions**: Verify ownership, cascade-delete all associated rows (personas, runs, responses, scores)
- **Output**: Confirmation with count of deleted records

---

## Section 2: Internal Pipeline Functions

These functions live in `mcp/tools/ssr/api.py`. They are NOT registered as MCP tools — they are called
by the tool handlers in `mcp/tools/ssr/tools.py`.

### 2.1 Top-Level API Functions (called directly by tool handlers)

```python
# ─────────────────────────────────────────────────────────────────
# Panel Management (synchronous — DB operations only)
# ─────────────────────────────────────────────────────────────────

def get_panel(db: DatabaseContext, panel_id: str, discord_id: str) -> SsrPanel:
    """Load panel by ID, scoped to owner. Raises ToolError if not found or wrong owner."""

def list_panels(db: DatabaseContext, discord_id: str, limit: int, offset: int) -> list[SsrPanelSummary]:
    """List panels with run counts. Returns empty list if none found."""

def delete_panel(db: DatabaseContext, panel_id: str, discord_id: str) -> SsrDeleteResult:
    """Delete panel and all cascaded rows. Returns counts of deleted rows."""

def get_run_results(db: DatabaseContext, run_id: str, discord_id: str) -> SsrRunResult:
    """Load complete run results. Raises ToolError if not found or wrong owner."""

def get_latest_run_for_panel(db: DatabaseContext, panel_id: str, discord_id: str) -> SsrRunResult:
    """Load results for most recent completed run on a panel."""

# ─────────────────────────────────────────────────────────────────
# Async Pipeline Entry Points (called by tool handlers with await)
# ─────────────────────────────────────────────────────────────────

async def create_panel_with_personas(
    db: DatabaseContext,
    tool_ctx: ToolContext,
    discord_id: str,
    demographics: PersonaDemographics,
    psychographics: PersonaPsychographics,
    product_category: str,
    panel_size: int,
    custom_instructions: str | None,
) -> SsrPanel:
    """Create panel row and generate all personas. Returns populated SsrPanel with personas."""

async def run_ssr_pipeline(
    db: DatabaseContext,
    tool_ctx: ToolContext,
    panel_id: str,
    discord_id: str,
    stimulus_text: str,
    stimulus_type: StimulusType,
    evaluation_dimensions: list[str],
) -> SsrRunResult:
    """Execute the full SSR pipeline: present → elicit → embed → score → aggregate."""
```

### 2.2 Mid-Level Functions (called by top-level async functions)

```python
async def _generate_all_personas(
    tool_ctx: ToolContext,
    demographics: PersonaDemographics,
    psychographics: PersonaPsychographics,
    product_category: str,
    panel_size: int,
    custom_instructions: str | None,
) -> list[PersonaProfile]:
    """Generate panel_size personas concurrently via asyncio.gather().
    Returns list of PersonaProfile objects ready for DB insertion."""

async def _generate_single_persona(
    tool_ctx: ToolContext,
    demographics: PersonaDemographics,
    psychographics: PersonaPsychographics,
    product_category: str,
    custom_instructions: str | None,
    index: int,
    total: int,
) -> PersonaProfile:
    """Generate one synthetic consumer profile via Claude.
    Uses claude-haiku-4-5 for cost efficiency at panel creation time."""

async def _run_all_personas(
    tool_ctx: ToolContext,
    personas: list[SsrPersona],
    stimulus_text: str,
    stimulus_type: StimulusType,
    anchor_sets: dict[str, AnchorSet],
) -> list[PersonaRunResult]:
    """Run all personas against a stimulus concurrently via asyncio.gather().
    Exceptions in individual personas are caught; failed personas are flagged, not dropped."""

async def _run_single_persona(
    tool_ctx: ToolContext,
    persona: SsrPersona,
    stimulus_text: str,
    stimulus_type: StimulusType,
    anchor_sets: dict[str, AnchorSet],
) -> PersonaRunResult:
    """Run one persona through the full SSR pipeline.
    Steps: elicit text → embed → score. Returns PersonaRunResult."""

async def _elicit_response(
    tool_ctx: ToolContext,
    persona: SsrPersona,
    stimulus_text: str,
    stimulus_type: StimulusType,
) -> str:
    """Present stimulus to persona and elicit a naturalistic text response.
    Uses claude-haiku-4-5 with persona as system prompt.
    Returns raw text response (50–300 words typically)."""

async def _embed_text(
    tool_ctx: ToolContext,
    text: str,
) -> list[float]:
    """Embed a text string into a dense vector.
    Uses the embedding model selected in w1-embedding-options.
    Returns a float list of dimension D (D depends on model choice)."""
```

### 2.3 Low-Level Scoring Functions (synchronous, pure math)

```python
def _score_response(
    response_embedding: list[float],
    anchor_sets: dict[str, AnchorSet],
) -> list[DimensionScore]:
    """Score a response embedding against all requested anchor sets.
    Returns one DimensionScore per evaluation dimension."""

def _cosine_similarity(a: list[float], b: list[float]) -> float:
    """Compute cosine similarity between two vectors.
    Returns value in [-1.0, 1.0]. Uses numpy for efficiency."""

def _softmax(values: list[float], temperature: float = 1.0) -> list[float]:
    """Apply softmax to a list of similarity scores.
    Temperature controls sharpness (lower = sharper distribution).
    Returns probability distribution summing to 1.0."""

def _expected_score(probabilities: list[float], scale_points: int) -> float:
    """Compute expected Likert score from probability distribution.
    scale_points is 5 or 7. Returns float in [1.0, scale_points].
    Formula: sum(k * p_k for k, p_k in zip(range(1, scale_points+1), probabilities))"""

def _aggregate_dimension(
    scores: list[DimensionScore],
    dimension: str,
    scale_points: int,
) -> DimensionAggregate:
    """Aggregate dimension scores across all personas.
    Returns: distribution (count per scale point), distribution_pct, mean, std_dev, n."""

def _select_highlight_quotes(
    persona_results: list[PersonaRunResult],
    dimension: str,
    n: int = 3,
) -> list[HighlightQuote]:
    """Select the most representative quotes for a dimension.
    Strategy: pick one near scale_top (top scorer), one near scale_mid, one near scale_bottom.
    Returns up to n HighlightQuote objects with persona metadata."""
```

### 2.4 DB Repository Functions (in `db/repositories/ssr_*.py`)

These are flat functions that take a `Session` and execute SQLAlchemy queries:

```python
# db/repositories/ssr_panels.py
def create_panel(session: Session, panel: SsrPanelCreate) -> SsrPanel
def get_panel_by_id(session: Session, panel_id: str, discord_id: str) -> SsrPanel | None
def list_panels_for_user(session: Session, discord_id: str, limit: int, offset: int) -> list[SsrPanel]
def delete_panel(session: Session, panel_id: str, discord_id: str) -> int  # returns deleted count

# db/repositories/ssr_personas.py
def bulk_create_personas(session: Session, personas: list[SsrPersonaCreate]) -> list[SsrPersona]
def get_personas_for_panel(session: Session, panel_id: str) -> list[SsrPersona]

# db/repositories/ssr_runs.py
def create_run(session: Session, run: SsrRunCreate) -> SsrRun
def update_run_status(session: Session, run_id: str, status: RunStatus, error: str | None) -> None
def get_run_by_id(session: Session, run_id: str, discord_id: str) -> SsrRun | None
def get_latest_run_for_panel(session: Session, panel_id: str, discord_id: str) -> SsrRun | None
def get_runs_for_panel(session: Session, panel_id: str) -> list[SsrRun]

# db/repositories/ssr_responses.py
def bulk_create_responses(session: Session, responses: list[SsrResponseCreate]) -> list[SsrResponse]
def get_responses_for_run(session: Session, run_id: str) -> list[SsrResponse]

# db/repositories/ssr_scores.py
def bulk_create_scores(session: Session, scores: list[SsrScoreCreate]) -> list[SsrScore]
def get_scores_for_run(session: Session, run_id: str) -> list[SsrScore]

# db/repositories/ssr_anchors.py
def get_anchor_sets(session: Session, dimensions: list[str]) -> dict[str, AnchorSet]
def get_all_anchor_sets(session: Session) -> list[AnchorSet]
def upsert_anchor_set(session: Session, anchor_set: AnchorSetCreate) -> AnchorSet
```

---

## Section 3: Shared Database State

The SSR tools need 6 tables. Full schema is specified in `data-model/supabase-schema.md`.
Here is the logical structure and the relationships:

### 3.1 Entity-Relationship Summary

```
ssr_anchor_set (system-owned, seeded in migration)
     │ referenced by dimension name (text, not FK)
     │
ssr_panel (owned by discord_id)
  ├── id: UUID PK
  ├── discord_id: text (owner)
  └── demographics, psychographics, product_category, panel_size, custom_instructions
     │
     ├── ssr_persona (N rows per panel)
     │   ├── id: UUID PK
     │   ├── panel_id: FK → ssr_panel
     │   ├── index: int (1..N, ordering within panel)
     │   └── name, age, gender, location, occupation, bio, full_profile, attitudes, motivations
     │
     └── ssr_run (M rows per panel — one per stimulus run)
         ├── id: UUID PK
         ├── panel_id: FK → ssr_panel
         ├── discord_id: text
         ├── status: enum ('pending', 'running', 'completed', 'failed')
         ├── stimulus_text, stimulus_type, evaluation_dimensions (text[])
         └── total_personas, completed_personas, created_at, completed_at
             │
             ├── ssr_response (N rows per run — one per persona)
             │   ├── id: UUID PK
             │   ├── run_id: FK → ssr_run
             │   ├── persona_id: FK → ssr_persona
             │   ├── raw_text: text (elicited response)
             │   └── embedding: JSONB (float array, matches embedding model dimension)
             │
             └── ssr_score (N × D rows per run — one per persona per dimension)
                 ├── id: UUID PK
                 ├── run_id: FK → ssr_run
                 ├── persona_id: FK → ssr_persona
                 ├── response_id: FK → ssr_response
                 ├── dimension: text (e.g., 'purchase_intent')
                 ├── score: float (expected value on 1-5 or 1-7 scale)
                 └── score_distribution: JSONB ({1: pct, 2: pct, 3: pct, 4: pct, 5: pct})
```

### 3.2 Anchor Set Design

`ssr_anchor_set` is **system-owned** (no `discord_id`). It is seeded by the migration, not created by tools.
Each row represents one evaluation dimension with its complete anchor statement texts AND pre-computed embeddings.

```
ssr_anchor_set
├── id: UUID PK
├── dimension: text UNIQUE (e.g., 'purchase_intent')
├── display_name: text (e.g., 'Purchase Intent')
├── scale_points: int (5 or 7)
├── anchors: JSONB array of:
│   └── { score: int, statement: text, embedding: float[] }
├── created_at: timestamptz
└── updated_at: timestamptz
```

Anchor embeddings are pre-computed once (when the migration runs, via a seeding script) and stored
alongside the anchor statements. This avoids re-embedding anchor statements on every run.

See `pipeline/anchor-statements.md` for all anchor statement texts per dimension.

### 3.3 Schema Size Estimates

For a typical run with 20 personas and 4 evaluation dimensions:
- `ssr_response` rows: 20
- `ssr_score` rows: 20 × 4 = 80
- Embedding storage: 20 × 1536 floats × 4 bytes ≈ 120KB (JSONB, not pgvector)

For 100 runs of a 20-persona panel: ~12MB of embedding data in `ssr_response`. Acceptable.

Note: If `pgvector` is available in Supabase, use `vector(1536)` instead of `JSONB` for embeddings.
This enables faster cosine similarity queries (though the SSR scoring path does not use DB-side similarity).
See `embedding-options.md` for the embedding dimension choice.

---

## Section 4: Key Design Decisions

### 4.1 Eager Persona Generation

Personas are generated at `ssr_panel_create` time, not lazily at run time.

Rationale:
- Users can review the panel before committing to a test run
- Multiple stimulus runs against the same panel use the exact same N personas (consistency)
- Persona generation cost (N × Claude haiku call) is paid once, not on every run
- Enables future feature: human-review of personas before running

### 4.2 Synchronous Blocking Execution

`ssr_panel_run` executes the full SSR pipeline synchronously and returns results in one call.
There is no job queue, no background processing, no polling.

Rationale:
- Daimon's tool system returns a single string; there is no streaming or callback mechanism
- Panel runs of 20-50 personas × haiku calls ≈ 20-50 concurrent API calls
- With asyncio.gather, 20 haiku calls at ~0.5-1s each take ~1-2s wall clock time
- 50-persona panel: ~2-5s. Acceptable for a Discord response.
- Cap: `panel_size` max is 50 to stay under Discord's 30-second interaction timeout

If panel_size > 50 is needed in future, the architecture must change to async jobs.

### 4.3 Concurrency Model

Both persona generation and stimulus runs use `asyncio.gather(*tasks)` with all personas in parallel.

Exception handling in gather:
```python
results = await asyncio.gather(*tasks, return_exceptions=True)
successes = [r for r in results if isinstance(r, PersonaRunResult)]
failures = [r for r in results if isinstance(r, Exception)]
# If fewer than 80% succeed, raise ToolError
# Otherwise, aggregate over successes and note failure count in output
```

This means a partial panel run is allowed (e.g., 18/20 personas succeeded) rather than failing entirely.
The run result includes a `failed_personas` count in the output.

### 4.4 Anchor Embedding Strategy

Anchor statement embeddings are:
1. Pre-computed once (seeding script, not at tool call time)
2. Stored in `ssr_anchor_set.anchors[].embedding`
3. Loaded from DB at the start of `ssr_panel_run`
4. Used for cosine similarity against response embeddings

This means the embedding model must be consistent: if anchor embeddings use model M,
response embeddings in `_embed_text()` must also use model M.

If the embedding model changes, all anchor embeddings must be recomputed (migration + seed update).

### 4.5 Scoring Algorithm

The SSR paper specifies semantic similarity to anchor statements. Implementation:

1. Embed response text → `response_vec` (length D)
2. For anchor statement at scale point k (k = 1..5 or 1..7): `anchor_k_vec` (pre-loaded)
3. Compute cosine similarity: `sim_k = dot(response_vec, anchor_k_vec) / (||r|| * ||a_k||)`
4. Apply softmax with temperature τ = 1.0: `p_k = exp(sim_k / τ) / sum(exp(sim_j / τ))`
5. Expected score: `E[score] = sum(k * p_k for k in range(1, scale_points+1))`

The `score_distribution` in `ssr_score` stores `{k: p_k}` (probability mass per scale point).
The `score` column stores `E[score]` (the continuous expected value).

Temperature τ = 1.0 is the default. If all similarities cluster (distribution is flat),
lower τ increases discrimination. This is a tunable parameter but starts at 1.0.

### 4.6 LLM Model Selection

Two Claude models are used in the SSR pipeline:

| Step | Model | Rationale |
|------|-------|-----------|
| Persona generation (ssr_panel_create) | `claude-haiku-4-5-20251001` | Cost: ~$0.25/MTok input. 20 personas × ~500 tokens = $0.0025 total |
| Stimulus presentation + response elicitation (ssr_panel_run) | `claude-haiku-4-5-20251001` | Cost: ~$0.25/MTok input. 20 personas × ~800 tokens = $0.004 total |

Both steps use Haiku. A 20-persona run costs approximately **$0.006-0.010 in LLM calls**.
Sonnet could be used for higher fidelity but costs ~6× more. Haiku is sufficient for consumer simulation.

Model constant in `api.py`:
```python
_PERSONA_MODEL = "claude-haiku-4-5-20251001"   # persona generation
_ELICITATION_MODEL = "claude-haiku-4-5-20251001"  # stimulus + elicitation
```

### 4.7 Ownership and Access Control

Panels are scoped to `discord_id` (the Discord user ID of the tool caller).

Rules:
- `ssr_panel_list`: returns ONLY the caller's panels
- `ssr_panel_run`: verifies `panel.discord_id == user_context.discord_id` before running
- `ssr_panel_results`: verifies `run.discord_id == user_context.discord_id` before returning
- `ssr_panel_delete`: verifies ownership before deleting

There is no concept of "shared panels" in v1. All access is per-user.

---

## Section 5: File Structure for Implementation

Based on the split-file pattern from `reference-tools.md`:

```
apps/bot/src_v2/mcp/tools/ssr/
├── __init__.py          # Re-exports all 5 ToolDef instances
├── tools.py             # @tool-decorated handlers (thin wrappers)
├── api.py               # Pipeline orchestration, session management
└── models.py            # Internal domain models (PersonaProfile, SsrRunResult, etc.)

apps/bot/src_v2/db/
├── repositories/
│   ├── ssr_panels.py    # Panel CRUD
│   ├── ssr_personas.py  # Persona bulk create/read
│   ├── ssr_runs.py      # Run CRUD and status updates
│   ├── ssr_responses.py # Response bulk create/read
│   ├── ssr_scores.py    # Score bulk create/read
│   └── ssr_anchors.py   # Anchor set read (system table)
└── models/
    └── ssr.py           # SQLAlchemy ORM models for all 6 tables

apps/bot/src_v2/core/
└── platforms.py         # ADD: Platform.SSR = "ssr"

supabase/migrations/
└── {timestamp}_create_ssr_tables.sql   # All 6 tables + anchor seed data
```

Additionally, a seeding script is needed to compute and insert anchor embeddings:
```
scripts/seed_ssr_anchors.py   # Compute embeddings for all anchor statements, upsert to DB
```

---

## Section 6: Dependency Map for Wave 2

Wave 2 aspects depend on this analysis. Required reading before each aspect:

| Wave 2 Aspect | Requires From This Doc |
|---|---|
| w2-tool-panel-create | Section 1.3 (ssr_panel_create), Section 2 (create_panel_with_personas, _generate_all_personas) |
| w2-tool-panel-run | Section 1.3 (ssr_panel_run), Section 2 (run_ssr_pipeline, all pipeline steps), Section 4.3 (concurrency), Section 4.5 (scoring) |
| w2-tool-panel-results | Section 1.3 (ssr_panel_results), Section 2 (get_run_results) |
| w2-supabase-schema | Section 3 (all 6 tables, ER diagram) |
| w2-anchor-statements | Section 3.2 (anchor set design), Section 4.5 (scoring algorithm) |
| w2-pydantic-models | Section 2 (all function signatures), Section 3 (all entity structures) |
| w2-prompt-templates | Section 2.2 (_generate_single_persona, _elicit_response), Section 4.6 (model selection) |

---

## Cross-References

- [tool-system.md](tool-system.md) — `@tool` decorator, Platform enum, ToolContext
- [reference-tools.md](reference-tools.md) — Split-file pattern, api.py conventions
- [db-patterns.md](db-patterns.md) — SQLAlchemy migration conventions (pending)
- [embedding-options.md](embedding-options.md) — Embedding model choice (pending — affects column type for `embedding` fields)
- [panel-create.md](../tools/panel-create.md) — Full `ssr_panel_create` specification
- [panel-run.md](../tools/panel-run.md) — Full `ssr_panel_run` specification
- [panel-results.md](../tools/panel-results.md) — Full `ssr_panel_results` specification
- [supabase-schema.md](../data-model/supabase-schema.md) — Full table definitions
- [pydantic-models.md](../data-model/pydantic-models.md) — All type definitions
- [scoring-aggregation.md](../pipeline/scoring-aggregation.md) — Scoring algorithm detail
