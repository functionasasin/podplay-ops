# SSR Consumer Panel — Supabase Schema

> Status: Complete (w2-supabase-schema).
> Cross-references: [migration.sql](migration.sql) · [pydantic-models.md](pydantic-models.md) · [panel-create.md](../tools/panel-create.md) · [panel-run.md](../tools/panel-run.md) · [panel-results.md](../tools/panel-results.md) · [db-patterns.md](../existing-patterns/db-patterns.md) · [embedding-options.md](../existing-patterns/embedding-options.md)

---

## Overview

The SSR consumer panel system uses **6 tables** (plus `ssr_anchor_set` which is a seed table):

| Table | Purpose | Mutable? | `updated_at`? |
|-------|---------|---------|--------------|
| `ssr_panel` | Panel definitions (demographics, psychographics) | Yes | Yes |
| `ssr_persona` | Generated synthetic consumer personas | Append-only | No |
| `ssr_run` | SSR pipeline executions (one per stimulus tested) | Yes (status) | Yes |
| `ssr_response` | Free-text reactions elicited from each persona | Append-only | No |
| `ssr_score` | Per-persona per-dimension Likert scores | Append-only | No |
| `ssr_anchor_set` | Likert anchor statements with pre-computed embeddings | Append-only | No |

**Design decision — stimulus in `ssr_run`**: The original design proposed a separate `ssr_stimulus` table.
After implementing the `ssr_panel_run` tool handler, the stimulus text and type are stored directly on
`ssr_run`. This avoids an extra join for all common queries (load run → get stimulus). The stimulus is
already constrained to 4000 characters (Pydantic), so a `TEXT` column on `ssr_run` is sufficient.

**FK cascade**: All child tables use `ON DELETE CASCADE`. Deleting an `ssr_panel` cascades to all
personas, runs, responses, and scores. Deleting an `ssr_run` cascades to responses and scores.

**RLS**: None. The bot connects via `service_role` key which bypasses RLS entirely. Discord ID
ownership checks are enforced at the application layer (repository functions).

**Migration filename**: `20260301_create_ssr_panel_tables.sql`

---

## Table 1: `ssr_panel`

Panel definitions. One row per consumer panel created by a user.

### Columns

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PRIMARY KEY |
| `discord_id` | `TEXT` | NOT NULL | — | — |
| `panel_name` | `TEXT` | NOT NULL | — | — |
| `product_category` | `TEXT` | NOT NULL | — | — |
| `demographics` | `JSONB` | NOT NULL | `'{}'::jsonb` | — |
| `psychographics` | `JSONB` | NULL | — | — |
| `panel_size` | `INTEGER` | NOT NULL | — | — |
| `actual_size` | `INTEGER` | NULL | — | — |
| `custom_instructions` | `TEXT` | NULL | — | — |
| `status` | `TEXT` | NOT NULL | `'generating'` | `CHECK (status IN ('generating', 'ready', 'partial', 'failed'))` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | — |

### Column Notes

**`discord_id`**: Discord user ID (snowflake) of the panel owner. Stored as `TEXT` — consistent with
`session_templates.created_by_discord_id TEXT` and `user_identity_discord.discord_id text`. Used for
ownership scoping on every tool that reads or modifies this panel.

**`demographics`**: JSONB object containing the `PersonaDemographics` model serialized by
`demographics.model_dump()`. Expected structure:
```json
{
  "age_min": 30,
  "age_max": 45,
  "genders": ["female"],
  "locations": ["Philippines"],
  "income_brackets": ["lower_middle", "middle"],
  "education_levels": ["high_school", "some_college", "bachelors"],
  "languages": ["English", "Filipino"]
}
```
All keys are optional except `age_min` and `age_max` (which are always present since `PersonaDemographics`
has them as required fields).

**`psychographics`**: JSONB object containing the `PersonaPsychographics` model serialized by
`psychographics.model_dump()`, or `NULL` if psychographics were omitted. Expected structure when present:
```json
{
  "interests": ["cooking", "K-drama", "budget travel"],
  "values": ["family-first", "frugality"],
  "lifestyle_descriptors": ["busy working mom"],
  "media_consumption": ["heavy Facebook user", "watches noontime TV"]
}
```

**`panel_size`**: The *requested* number of personas (5–50). May differ from `actual_size` if partial
generation occurred.

**`actual_size`**: The *actual* number of successfully generated and inserted personas. Set by
`panels_repo.update_status()` after generation completes. `NULL` while `status = 'generating'`.

**`custom_instructions`**: Free-text instructions appended to the persona generation prompt. `NULL`
if the user did not provide any. Maximum 1000 characters (enforced in Pydantic, not DB).

**`status`**:
- `'generating'`: Panel has been created and persona generation is in progress.
- `'ready'`: All `panel_size` personas successfully generated.
- `'partial'`: Between 50% and 99% of personas generated (some Claude failures occurred). Panel is
  usable — `actual_size` reflects how many personas exist.
- `'failed'`: Fewer than 50% of personas were generated. Panel is NOT usable — it will be deleted
  immediately by the create handler on this condition (so this status should never persist in production,
  but is included for safety).

### Triggers

```sql
CREATE TRIGGER ssr_panel_updated_at
    BEFORE UPDATE ON ssr_panel
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

Reuses the shared `update_updated_at_column()` function already defined in the initial migration.

### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_ssr_panel_discord_id ON ssr_panel(discord_id);
CREATE INDEX IF NOT EXISTS idx_ssr_panel_created_at ON ssr_panel(created_at DESC);
```

**`idx_ssr_panel_discord_id`**: Used by `ssr_panel_list` (filter by owner), `ssr_panel_delete` (ownership
check), and any time the bot needs to scope panel access to a user.

**`idx_ssr_panel_created_at`**: Used by `ssr_panel_list` (default order: most recent first).

---

## Table 2: `ssr_persona`

Synthetic consumer personas generated by Claude Haiku. One row per persona, many per panel.

### Columns

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PRIMARY KEY |
| `panel_id` | `UUID` | NOT NULL | — | `REFERENCES ssr_panel(id) ON DELETE CASCADE` |
| `persona_index` | `INTEGER` | NOT NULL | — | — |
| `name` | `TEXT` | NOT NULL | — | — |
| `age` | `INTEGER` | NOT NULL | — | `CHECK (age >= 18 AND age <= 99)` |
| `location` | `TEXT` | NOT NULL | — | — |
| `occupation` | `TEXT` | NOT NULL | — | — |
| `income_bracket` | `TEXT` | NOT NULL | — | `CHECK (income_bracket IN ('low', 'lower_middle', 'middle', 'upper_middle', 'high'))` |
| `education` | `TEXT` | NOT NULL | — | `CHECK (education IN ('high_school', 'some_college', 'bachelors', 'graduate', 'postgraduate'))` |
| `summary` | `TEXT` | NOT NULL | — | — |
| `full_profile` | `TEXT` | NOT NULL | — | — |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | — |

### Unique Constraints

```sql
CONSTRAINT ssr_persona_panel_index_unique UNIQUE (panel_id, persona_index)
```

Enforces that each panel has exactly one persona at each 1-based index position. Prevents duplicate
persona insertions on retry.

### Column Notes

**`persona_index`**: 1-based ordinal position of this persona in the panel. Assigned at generation time
(`index` field in the generation loop from 1 to `panel_size`). Used for deterministic ordering when
displaying the panel.

**`name`**: Full name generated by Claude (e.g., `"Maria Santos"`, `"Liza Reyes"`). Plain text.

**`age`**: Exact age in years. Generated within the `[age_min, age_max]` range from the panel's
demographic constraints. DB constraint mirrors Pydantic validation (18–99).

**`location`**: City and country of residence in free text (e.g., `"Quezon City, Philippines"`).
Not normalized — stored as Claude generated it.

**`occupation`**: Job title or life situation (e.g., `"Elementary School Teacher"`,
`"Small Business Owner (Sari-sari Store)"`). Free text.

**`income_bracket`**: Relative income bracket within the persona's country. One of:
- `'low'`: Below median (below 20th percentile)
- `'lower_middle'`: 20th–40th percentile
- `'middle'`: 40th–60th percentile
- `'upper_middle'`: 60th–80th percentile
- `'high'`: Top 20%

**`education`**: Highest completed education. One of:
- `'high_school'`
- `'some_college'`
- `'bachelors'`
- `'graduate'` (master's degree or equivalent)
- `'postgraduate'` (PhD or equivalent)

**`summary`**: 2–3 sentence human-readable display summary. Extracted from the Claude output and used
in tool result display (`<persona>` tags in `_fmt_panel_created()`). Maximum ~300 characters in practice.

**`full_profile`**: Complete raw text output from Claude Haiku persona generation prompt — all labeled
sections (`NAME:`, `AGE:`, `LOCATION:`, `OCCUPATION:`, `HOUSEHOLD:`, `INCOME_BRACKET:`, `EDUCATION:`,
`BACKGROUND:`, `VALUES:`, `LIFESTYLE:`, `MEDIA_HABITS:`, `PRODUCT_CATEGORY_ATTITUDES:`, `VOICE:`).
Used as the system prompt content when `_build_ssr_system_prompt()` inhabits the persona during a run.
Typical length: 400–700 characters.

### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_ssr_persona_panel_id ON ssr_persona(panel_id);
```

**`idx_ssr_persona_panel_id`**: Used by `ssr_personas_repo.list_by_panel()` (load all personas for a run)
and `ssr_panel_list` (could count personas per panel if needed).

---

## Table 3: `ssr_run`

A single execution of the SSR pipeline: one stimulus tested against all personas in a panel.
Contains both the stimulus (denormalized for query efficiency) and run metadata.

### Columns

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PRIMARY KEY |
| `panel_id` | `UUID` | NOT NULL | — | `REFERENCES ssr_panel(id) ON DELETE CASCADE` |
| `discord_id` | `TEXT` | NOT NULL | — | — |
| `run_label` | `TEXT` | NOT NULL | — | — |
| `stimulus` | `TEXT` | NOT NULL | — | — |
| `stimulus_type` | `TEXT` | NOT NULL | — | `CHECK (stimulus_type IN ('ad_copy', 'headline', 'tagline', 'product_concept', 'brand_message', 'campaign_theme', 'influencer_pitch', 'pricing_message', 'packaging_description', 'social_caption'))` |
| `evaluation_dimensions` | `TEXT[]` | NOT NULL | `'{}'` | — |
| `status` | `TEXT` | NOT NULL | `'pending'` | `CHECK (status IN ('pending', 'running', 'completed', 'failed'))` |
| `personas_scored` | `INTEGER` | NULL | — | — |
| `dimension_means` | `JSONB` | NULL | — | — |
| `started_at` | `TIMESTAMPTZ` | NULL | — | — |
| `completed_at` | `TIMESTAMPTZ` | NULL | — | — |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | — |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | — |

### Column Notes

**`discord_id`**: Denormalized from the parent `ssr_panel.discord_id`. Enables ownership checks on
`ssr_run` rows without joining `ssr_panel`. Added per the cross-correction in `panel-results.md`.
Always set to `user_context.discord_id` at run creation time.

**`run_label`**: Human-readable label for this run. Auto-generated as `"Run {ISO_TIMESTAMP}"` if the
user did not provide one. Maximum 120 characters (enforced by Pydantic, not DB). Used in tool output
and comparison display.

**`stimulus`**: The full text of the marketing asset being tested. Maximum 4000 characters (enforced
by Pydantic `PanelRunInput.stimulus`). Stored in full for retrieval by `ssr_panel_results`.

**`stimulus_type`**: The category of the marketing asset. The 10 valid values are:
- `'ad_copy'` — Full display or video ad body copy
- `'headline'` — Advertising headline or title
- `'tagline'` — Brand tagline or slogan
- `'product_concept'` — Product idea description
- `'brand_message'` — Brand positioning statement
- `'campaign_theme'` — Campaign creative theme
- `'influencer_pitch'` — Influencer collaboration pitch
- `'pricing_message'` — Price offer or value proposition
- `'packaging_description'` — Packaging text/visual description
- `'social_caption'` — Social media post caption

**`evaluation_dimensions`**: `TEXT[]` array of dimension names evaluated in this run. Populated
from `[d.value for d in params.evaluation_dimensions]` at run creation. Example: `{purchase_intent,message_clarity,overall_appeal}`.
Empty array default (`'{}'`) is the PostgreSQL syntax for empty native arrays (NOT `'[]'::jsonb`).

**`status`** lifecycle:
- `'pending'` → set at `ssr_runs_repo.create()` before pipeline begins
- `'running'` → set immediately after the run record is created (same create call with `status='running'` per implementation)
- `'completed'` → set by `ssr_runs_repo.update_status(session, run_id, "completed", ...)` after all responses and scores are inserted
- `'failed'` → set by `ssr_runs_repo.update_status(session, run_id, "failed")` in the exception handler

**`personas_scored`**: Count of personas that produced scoreable responses. `NULL` until the run
completes. May be less than `ssr_panel.actual_size` if some personas failed during the pipeline but
≥50% threshold was met.

**`dimension_means`**: JSONB dict of `{dimension_name: mean_score}` populated on run completion.
Example: `{"purchase_intent": 3.85, "message_clarity": 4.40, "personal_relevance": 4.10}`.
Stored for fast preview queries without loading all `ssr_score` rows. `NULL` until the run completes.

**`started_at`**: Timestamp when the SSR pipeline began executing. Set when `ssr_runs_repo.update_status()`
transitions the run to `'running'`. `NULL` while `status = 'pending'`.

**`completed_at`**: Timestamp when the pipeline finished (success or failure). Set when
`ssr_runs_repo.update_status()` transitions the run to `'completed'` or `'failed'`. `NULL` until then.
Added per the cross-correction in `panel-results.md`.

### Triggers

```sql
CREATE TRIGGER ssr_run_updated_at
    BEFORE UPDATE ON ssr_run
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_ssr_run_panel_id ON ssr_run(panel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ssr_run_discord_id ON ssr_run(discord_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ssr_run_status ON ssr_run(status) WHERE status IN ('pending', 'running');
```

**`idx_ssr_run_panel_id`**: Used by `ssr_panel_results` when looking up the most recent completed run
for a panel (ordered by `created_at DESC`). Also used for `ssr_panel_list` if run counts are shown.

**`idx_ssr_run_discord_id`**: Used for any user-scoped query across all their runs, not tied to a
specific panel.

**`idx_ssr_run_status`**: Partial index on in-progress runs only. Used for monitoring/debugging —
finding stuck runs. At steady state, this index is tiny (most runs complete within seconds).

---

## Table 4: `ssr_response`

Free-text consumer reactions elicited from each persona for a panel run. One row per persona per run.

### Columns

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PRIMARY KEY |
| `run_id` | `UUID` | NOT NULL | — | `REFERENCES ssr_run(id) ON DELETE CASCADE` |
| `persona_id` | `UUID` | NOT NULL | — | `REFERENCES ssr_persona(id) ON DELETE CASCADE` |
| `response_text` | `TEXT` | NOT NULL | — | — |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | — |

### Unique Constraints

```sql
CONSTRAINT ssr_response_run_persona_unique UNIQUE (run_id, persona_id)
```

Enforces that each persona produces exactly one response per run. Prevents duplicate response
insertions on retry.

### Column Notes

**`run_id`**: The pipeline run this response belongs to. FK to `ssr_run`.

**`persona_id`**: The persona that produced this response. FK to `ssr_persona`. Note: `ssr_persona`
rows cascade-delete when their parent `ssr_panel` is deleted. Because `ssr_response` also references
`ssr_persona` with `ON DELETE CASCADE`, deleting a panel cascades through both paths (via `ssr_run →
ssr_response` and via `ssr_persona → ssr_response`). PostgreSQL handles this correctly.

**`response_text`**: The raw free-text output from Claude Haiku when inhabiting the persona and
reacting to the stimulus. This text is then embedded (not stored here — see `ssr_score.response_embedding`)
and scored. Typical length: 100–450 tokens / 300–1800 characters. Not truncated or parsed before storage.

### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_ssr_response_run_id ON ssr_response(run_id);
CREATE INDEX IF NOT EXISTS idx_ssr_response_persona_run ON ssr_response(persona_id, run_id);
```

**`idx_ssr_response_run_id`**: Used to load all responses for a run in `ssr_panel_results` (RAW format
includes all persona responses).

**`idx_ssr_response_persona_run`**: Used to look up a specific persona's response for a specific run
(composite lookup).

---

## Table 5: `ssr_score`

Per-persona, per-dimension Likert scores computed by cosine similarity against anchor embeddings.
One row per persona per dimension per run (N personas × D dimensions rows per run).

### Columns

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PRIMARY KEY |
| `response_id` | `UUID` | NOT NULL | — | `REFERENCES ssr_response(id) ON DELETE CASCADE` |
| `run_id` | `UUID` | NOT NULL | — | `REFERENCES ssr_run(id) ON DELETE CASCADE` |
| `persona_id` | `UUID` | NOT NULL | — | `REFERENCES ssr_persona(id) ON DELETE CASCADE` |
| `dimension` | `TEXT` | NOT NULL | — | — |
| `hard_score` | `INTEGER` | NOT NULL | — | `CHECK (hard_score >= 1 AND hard_score <= 5)` |
| `weighted_score` | `FLOAT8` | NOT NULL | — | — |
| `similarities` | `JSONB` | NOT NULL | `'{}'::jsonb` | — |
| `response_embedding` | `FLOAT8[]` | NULL | — | — |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | — |

### Unique Constraints

```sql
CONSTRAINT ssr_score_response_dimension_unique UNIQUE (response_id, dimension)
```

Enforces that each response is scored against each dimension exactly once.

### Column Notes

**`response_id`**: FK to `ssr_response`. The response whose embedding produced this score.

**`run_id`**: Denormalized from the parent `ssr_response.run_id`. Allows fast run-level score queries
(`SELECT * FROM ssr_score WHERE run_id = $1`) without joining through `ssr_response`. This is the
primary access pattern for `ssr_panel_results` aggregation.

**`persona_id`**: Denormalized from the parent `ssr_response.persona_id`. Allows fast persona-level
queries and joining score rows to persona names for highlight extraction.

**`dimension`**: The evaluation dimension this score corresponds to. One of the 10 `EvaluationDimension`
enum values: `purchase_intent`, `brand_favorability`, `message_clarity`, `emotional_response`,
`personal_relevance`, `uniqueness`, `trust_credibility`, `value_perception`, `share_worthiness`,
`overall_appeal`. Stored as plain `TEXT` (not FK to `ssr_anchor_set`) — consistent with Daimon
pattern of using CHECK constraints rather than FK for enum-like values. No CHECK constraint here
because new dimensions may be added in the future without a migration.

**`hard_score`**: Integer Likert score 1–5. The argmax of cosine similarities across all 5 anchor
embeddings for this dimension. Computed by `score_against_anchors()` in `api.py`.

**`weighted_score`**: Continuous score 1.0–5.0 computed as the softmax-weighted mean of anchor point
values, where weights are derived from cosine similarities. Provides a more nuanced score than `hard_score`
for statistical aggregation (mean, std dev, confidence intervals). Always within [1.0, 5.0] by construction.

**`similarities`**: JSONB dict of `{scale_point: cosine_similarity}`. Example:
```json
{"1": 0.182, "2": 0.241, "3": 0.389, "4": 0.712, "5": 0.834}
```
Keys are string representations of integers 1–5 (JSONB requires string keys).
Values are raw cosine similarities in range [-1.0, 1.0], typically [0.2, 0.9] for on-topic texts.
Stored for debugging, re-scoring with different anchor sets, and future analysis.

**`response_embedding`**: The 1536-dimensional float32 embedding of the parent `ssr_response.response_text`,
as returned by `text-embedding-3-small`. Stored as `FLOAT8[]` (unbounded array; 1536 elements by
application contract). `NULL` by default — storing is optional and can be controlled by configuration.
When stored: enables future re-scoring against new anchor sets without making API calls.
Storage cost: 1536 × 8 bytes = 12,288 bytes per row ≈ 12 KB. For a 20-persona, 3-dimension run:
60 rows × 12 KB = 720 KB. Acceptable for infrequent research use.

### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_ssr_score_run_id ON ssr_score(run_id);
CREATE INDEX IF NOT EXISTS idx_ssr_score_response_id ON ssr_score(response_id);
```

**`idx_ssr_score_run_id`**: Primary index. Used by `ssr_panel_results` to load all scores for a run:
`SELECT * FROM ssr_score WHERE run_id = $1`. Also used for run-level aggregation and highlight extraction.

**`idx_ssr_score_response_id`**: Used to load all dimension scores for a specific persona's response.

---

## Table 6: `ssr_anchor_set`

Pre-defined Likert anchor statements per evaluation dimension, with pre-computed embeddings.
This is a **seed table** — rows are populated by `scripts/seed_anchor_embeddings.py` at deployment time,
not by the SSR tool handlers. The handlers read from this table but never write to it.

### Columns

| Column | Type | Nullable | Default | Constraint |
|--------|------|----------|---------|------------|
| `id` | `UUID` | NOT NULL | `gen_random_uuid()` | PRIMARY KEY |
| `dimension_name` | `TEXT` | NOT NULL | — | — |
| `scale_point` | `INTEGER` | NOT NULL | — | `CHECK (scale_point >= 1 AND scale_point <= 5)` |
| `anchor_text` | `TEXT` | NOT NULL | — | — |
| `anchor_embedding` | `FLOAT8[]` | NULL | — | — |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | `NOW()` | — |

### Unique Constraints

```sql
CONSTRAINT ssr_anchor_set_dimension_point_unique UNIQUE (dimension_name, scale_point)
```

Enforces one anchor statement per (dimension, scale point) pair. Makes the anchor set deterministic
and prevents duplicate embeddings.

### Column Notes

**`dimension_name`**: The evaluation dimension. Must be one of the 10 `EvaluationDimension` values
(not enforced at DB level — enforced by the seeding script). The 10 valid values:
`purchase_intent`, `brand_favorability`, `message_clarity`, `emotional_response`, `personal_relevance`,
`uniqueness`, `trust_credibility`, `value_perception`, `share_worthiness`, `overall_appeal`.

**`scale_point`**: Likert scale point this anchor statement represents. Always 1–5.
- `1`: Strongly negative response (e.g., "I would definitely not buy this")
- `2`: Mildly negative response
- `3`: Neutral / indifferent response
- `4`: Mildly positive response
- `5`: Strongly positive response (e.g., "I would definitely buy this")

**`anchor_text`**: The anchor statement sentence. This is the text that gets embedded and compared
against persona response embeddings. Must be a naturalistic English sentence describing a consumer
attitude (not "Rating 5" or "Strongly agree" — the SSR methodology requires semantically rich anchors).
See [anchor-statements.md](../pipeline/anchor-statements.md) for all 50 anchor statements (10 dimensions × 5 points).

**`anchor_embedding`**: Pre-computed 1536-dimensional embedding of `anchor_text` using
`text-embedding-3-small`. `NULL` until the seeding script runs. The `ssr_panel_run` tool handler
checks for `NULL` embeddings and raises `ToolError` if any requested dimension lacks embeddings.
Storage cost: same as `ssr_score.response_embedding` — 12 KB per row.
Total anchor set storage: 50 rows × 12 KB = 600 KB.

### Seeding

The anchor embeddings must be seeded before any `ssr_panel_run` call succeeds. Seed script path:
`apps/bot/scripts/seed_anchor_embeddings.py`. The seeding process:
1. Read all `ssr_anchor_set` rows where `anchor_embedding IS NULL`
2. Batch-embed `anchor_text` values using `text-embedding-3-small`
3. Update rows with computed embeddings

The script is idempotent — rows with existing embeddings are skipped.

Run as: `python -m scripts.seed_anchor_embeddings` from `apps/bot/`.

If anchor embeddings are missing, `ssr_panel_run` raises:
```
ToolError: Missing anchor embeddings for dimensions: ['purchase_intent', 'message_clarity'].
The database may need to be re-seeded.
Contact an admin to run: python -m scripts.seed_anchor_embeddings
```

### Repository Function

```python
# db/repositories/ssr_anchors.py

def get_by_dimensions(
    session: Session,
    dimension_names: list[str],
) -> dict[str, "AnchorSet"]:
    """Load all anchor rows for the requested dimensions.

    Returns:
        Dict mapping dimension_name → AnchorSet. AnchorSet has:
          - dimension: str
          - anchors: dict[int, AnchorPoint]  (scale_point → AnchorPoint)
        Each AnchorPoint has:
          - scale_point: int
          - anchor_text: str
          - embedding: list[float]  (the FLOAT8[] from DB as Python list)
    """
```

### Index

```sql
CREATE INDEX IF NOT EXISTS idx_ssr_anchor_set_dimension ON ssr_anchor_set(dimension_name);
```

Used to load all 5 anchor rows for a dimension:
`SELECT * FROM ssr_anchor_set WHERE dimension_name = $1 ORDER BY scale_point`

---

## FK Dependency Graph

```
ssr_panel (root)
├── ssr_persona (panel_id → ssr_panel.id CASCADE)
└── ssr_run (panel_id → ssr_panel.id CASCADE)
    └── ssr_response (run_id → ssr_run.id CASCADE)
                   (persona_id → ssr_persona.id CASCADE)
        └── ssr_score (response_id → ssr_response.id CASCADE)
                     (run_id → ssr_run.id CASCADE)           ← denormalized
                     (persona_id → ssr_persona.id CASCADE)   ← denormalized

ssr_anchor_set (standalone — no FK relationships)
```

Deleting `ssr_panel` cascades: `ssr_persona` → deleted; `ssr_run` → deleted → `ssr_response` →
deleted → `ssr_score` deleted. All user data is fully cleaned up with one `DELETE FROM ssr_panel WHERE id = $1`.

---

## Query Patterns

### `ssr_panel_list` — list panels for a user

```sql
SELECT
    p.id,
    p.panel_name,
    p.product_category,
    p.actual_size,
    p.status,
    p.created_at,
    COUNT(r.id) AS run_count
FROM ssr_panel p
LEFT JOIN ssr_run r ON r.panel_id = p.id
WHERE p.discord_id = $1
GROUP BY p.id
ORDER BY p.created_at DESC
LIMIT $2 OFFSET $3;
```

Uses: `idx_ssr_panel_discord_id`, `idx_ssr_run_panel_id` (implicit via join).

### `ssr_panel_run` — load personas for a panel

```sql
SELECT * FROM ssr_persona
WHERE panel_id = $1
ORDER BY persona_index;
```

Uses: `idx_ssr_persona_panel_id`.

### `ssr_panel_run` — load anchor embeddings for dimensions

```sql
SELECT dimension_name, scale_point, anchor_text, anchor_embedding
FROM ssr_anchor_set
WHERE dimension_name = ANY($1)
ORDER BY dimension_name, scale_point;
```

Uses: `idx_ssr_anchor_set_dimension`.

### `ssr_panel_results` — load run by ID with ownership check

```sql
SELECT r.*, p.discord_id AS panel_owner
FROM ssr_run r
JOIN ssr_panel p ON p.id = r.panel_id
WHERE r.id = $1;
```

Uses: PK lookup on `ssr_run.id`.

### `ssr_panel_results` — load most recent completed run for a panel

```sql
SELECT * FROM ssr_run
WHERE panel_id = $1
  AND status = 'completed'
ORDER BY created_at DESC
LIMIT 1;
```

Uses: `idx_ssr_run_panel_id` (panel_id + created_at DESC).

### `ssr_panel_results` — load all scores for a run

```sql
SELECT
    s.dimension,
    s.hard_score,
    s.weighted_score,
    s.similarities,
    s.persona_id,
    per.name AS persona_name,
    r.response_text
FROM ssr_score s
JOIN ssr_response r ON r.id = s.response_id
JOIN ssr_persona per ON per.id = s.persona_id
WHERE s.run_id = $1
ORDER BY s.dimension, s.hard_score DESC;
```

Uses: `idx_ssr_score_run_id`.

---

## Repository Files

Six repository files, one per table:

| File | Table | Key Functions |
|------|-------|--------------|
| `db/repositories/ssr_panels.py` | `ssr_panel` | `create()`, `get_by_id()`, `list_by_discord_id()`, `update_status()`, `delete()` |
| `db/repositories/ssr_personas.py` | `ssr_persona` | `bulk_create()`, `list_by_panel()` |
| `db/repositories/ssr_runs.py` | `ssr_run` | `create()`, `get_by_id()`, `get_latest_for_panel()`, `update_status()` |
| `db/repositories/ssr_responses.py` | `ssr_response` | `bulk_create()`, `list_by_run()` |
| `db/repositories/ssr_scores.py` | `ssr_score` | `bulk_create()`, `list_by_run()` |
| `db/repositories/ssr_anchors.py` | `ssr_anchor_set` | `get_by_dimensions()` |

All files follow the split-file pattern documented in [reference-tools.md](../existing-patterns/reference-tools.md):
- Repository functions take `session: Session` as first argument
- No async — SQLAlchemy operations are synchronous
- Each function maps 1:1 to a SQL query pattern
- No business logic — only SQL and data transformation

---

## Applied Pattern Summary

| Pattern | Application |
|---------|-------------|
| Table prefix | `ssr_` on all 6 tables |
| Primary key | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` |
| Timestamps | `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` on all; `updated_at` + trigger on `ssr_panel`, `ssr_run` |
| Discord user ID | `discord_id TEXT NOT NULL` on `ssr_panel` (ownership) and `ssr_run` (denormalized ownership) |
| Status column | `TEXT NOT NULL DEFAULT '...'` + `CHECK (status IN (...))` |
| FK delete | `ON DELETE CASCADE` on all child table FKs |
| JSONB | `demographics`, `psychographics`, `dimension_means`, `similarities` |
| TEXT arrays | `evaluation_dimensions TEXT[] NOT NULL DEFAULT '{}'` |
| Float arrays | `anchor_embedding FLOAT8[]`, `response_embedding FLOAT8[]` |
| RLS | None — service_role access only |
| Schema prefix | None — implicit public |
| Indexes | Prefix `idx_ssr_*`, DESC for time-ordered, partial for status filter |
| `updated_at` trigger | Reuses existing `update_updated_at_column()` |
| Migration filename | `20260301_create_ssr_panel_tables.sql` |
