# Scoring & Aggregation — SSR Pipeline Stages 2–4

> Status: Complete (w2-tool-panel-run).
> Cross-references: [panel-run.md](../tools/panel-run.md) · [response-elicitation.md](response-elicitation.md) · [anchor-statements.md](anchor-statements.md) · [embedding-options.md](../existing-patterns/embedding-options.md) · [supabase-schema.md](../data-model/supabase-schema.md)

---

## Overview

After each persona's free-text response is elicited (stage 1), the SSR pipeline continues through three more stages:

| Stage | What happens | I/O |
|-------|-------------|-----|
| **Stage 2: Batch embedding** | All N persona responses embedded at once | N texts → N vectors (1536-dim) |
| **Stage 3: Per-persona scoring** | Each response vector compared to anchor sets per dimension | N vectors × D anchor sets → N×D scores |
| **Stage 4: Aggregation** | Scores aggregated across all personas per dimension | N×D scores → D AggregatedDimensionResult |

All three stages are implemented in `api.py`. This file specifies the full implementation of each stage.

---

## 1. Stage 2: Batch Embedding

### `embed_texts()` — already specified in [embedding-options.md](../existing-patterns/embedding-options.md)

```python
# In apps/bot/src_v2/mcp/tools/ssr/api.py

import numpy as np
from openai import AsyncOpenAI


async def embed_texts(client: AsyncOpenAI, texts: list[str]) -> list[np.ndarray]:
    """Embed a batch of texts using OpenAI text-embedding-3-small.

    All texts submitted in one API call for efficiency.
    Returns one 1536-dim float32 numpy array per input text, in input order.

    Args:
        client: AsyncOpenAI client (initialized with tool_ctx.openai_api_key).
        texts: Persona response strings. Typical length: 200–450 tokens each.
            All texts submitted together in a single API call.

    Returns:
        List of np.ndarray, shape (1536,), dtype float32, matching input order.

    Raises:
        ToolError: On OpenAI API failure (network error, invalid key, rate limit).
    """
    try:
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=texts,
            encoding_format="float",
        )
    except Exception as exc:
        raise ToolError(f"Embedding API call failed: {exc}") from exc

    # Sort by index — OpenAI guarantees order but explicit sort is defensive
    sorted_data = sorted(response.data, key=lambda x: x.index)
    return [np.array(item.embedding, dtype=np.float32) for item in sorted_data]
```

### Why Batch (Not Individual) Embedding

With a default panel of 20 personas, batching all 20 response texts into one API call:
- **Reduces latency**: 1 round trip instead of 20 (saves ~1,500ms of network overhead)
- **Reduces cost**: Same per-token rate, but fewer API calls reduces any per-request overhead
- **Simplifies concurrency**: No need for a semaphore or rate limiting — one call regardless of panel size

OpenAI's `text-embedding-3-small` supports batches of up to 2,048 inputs. The maximum panel size of 50 is well within this limit.

---

## 2. Stage 3: Per-Persona Scoring

### `cosine_similarity()` — utility function

```python
def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two vectors.

    Args:
        a: First embedding vector, shape (1536,), dtype float32.
        b: Second embedding vector, shape (1536,), dtype float32.

    Returns:
        Cosine similarity in range [-1.0, 1.0].
        For semantically related English texts, typical range: [0.3, 0.95].
        Vectors from text-embedding-3-small are not pre-normalized by the API,
        so explicit norm computation is required.
    """
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))
```

### `score_against_anchors()` — per-persona per-dimension scoring

```python
def score_against_anchors(
    response_embedding: np.ndarray,
    anchor_embeddings: dict[int, np.ndarray],
) -> tuple[int, float, dict[int, float]]:
    """Map a response embedding to a Likert score via anchor cosine similarity.

    Implements the core SSR scoring step:
    1. Compute cosine similarity between response and each anchor embedding
    2. Apply softmax over similarities to get per-anchor weights
    3. Compute softmax-weighted mean Likert score (continuous)
    4. Find the argmax anchor (discrete hard score for distribution counting)

    The softmax-weighted mean captures the semantic position of the response
    across the full Likert spectrum, not just the closest single anchor.
    This produces more nuanced scores — a response that's moderately close
    to both anchor 3 and anchor 4 gets a weighted score like 3.6, not just 3 or 4.

    Args:
        response_embedding: Embedding of the persona's free-text response.
            Shape (1536,), dtype float32, from text-embedding-3-small.
        anchor_embeddings: Dict mapping Likert point (int, 1–5) to pre-embedded
            anchor statement vector. Shape (1536,), dtype float32 each.
            Loaded from ssr_anchor table (stored as FLOAT8[1536]).

    Returns:
        Tuple of:
            hard_score (int): Likert point (1–5) of the single closest anchor
                by argmax cosine similarity. Used for distribution counting and
                mode calculation. Range: 1–5.
            weighted_score (float): Softmax-weighted mean Likert score.
                Used for panel mean, standard deviation, and CI calculations.
                Range: [1.0, 5.0] for a 5-point scale.
            similarities (dict[int, float]): Raw cosine similarity per Likert
                point, e.g. {1: 0.32, 2: 0.41, 3: 0.59, 4: 0.78, 5: 0.65}.
                Used for diagnostic output — not stored in DB.
    """
    scores = sorted(anchor_embeddings.keys())
    # scores: [1, 2, 3, 4, 5] for a 5-point scale

    # Step 1: Compute cosine similarity between response and each anchor
    sims_array = np.array(
        [cosine_similarity(response_embedding, anchor_embeddings[s]) for s in scores],
        dtype=np.float64,
    )
    # sims_array: e.g. [0.32, 0.41, 0.59, 0.78, 0.65]

    # Step 2: Softmax over similarities to get per-anchor weights
    # Subtract max for numerical stability before exponentiation
    exp_sims = np.exp(sims_array - np.max(sims_array))
    weights = exp_sims / exp_sims.sum()
    # weights: e.g. [0.028, 0.047, 0.144, 0.595, 0.186] — sum to 1.0

    # Step 3: Argmax → hard score
    hard_score = scores[int(np.argmax(sims_array))]
    # hard_score: 4 (the highest similarity is to anchor 4)

    # Step 4: Weighted mean → continuous score
    weighted_score = float(np.dot(weights, np.array(scores, dtype=np.float64)))
    # weighted_score: e.g. 3.86 (pulled toward 5 by 0.186 weight on anchor 5)

    # Return raw similarities for diagnostic output
    similarities = {scores[i]: float(sims_array[i]) for i in range(len(scores))}

    return hard_score, weighted_score, similarities
```

### Worked Example

Persona response: "I'd definitely grab another pack — we always have Lucky Me at home."

Embedding: vector of shape (1536,) — specific values not reproducible without running the model.

Hypothetical anchor cosine similarities for `purchase_intent`:

| Anchor point | Anchor statement | Cosine similarity |
|-------------|-----------------|------------------|
| 1 | "I have absolutely no interest in buying or trying this" | 0.31 |
| 2 | "I'm not very interested in buying this — I probably wouldn't" | 0.38 |
| 3 | "I might buy or try this, but I'm not sure — it depends on the circumstances" | 0.54 |
| 4 | "I'm fairly likely to buy or try this — it appeals to me" | 0.79 |
| 5 | "I would definitely buy or try this immediately — I'm very interested" | 0.71 |

Softmax weights:
```
exp([0.31, 0.38, 0.54, 0.79, 0.71]) =
exp([0.31-0.79, 0.38-0.79, 0.54-0.79, 0.79-0.79, 0.71-0.79]) =
exp([-0.48, -0.41, -0.25, 0.00, -0.08]) =
[0.619, 0.664, 0.779, 1.000, 0.923]

Sum = 3.985

Weights = [0.155, 0.167, 0.196, 0.251, 0.232]
```

Weighted score:
```
(1 × 0.155) + (2 × 0.167) + (3 × 0.196) + (4 × 0.251) + (5 × 0.232)
= 0.155 + 0.334 + 0.588 + 1.004 + 1.160
= 3.241
```

Hard score: 4 (argmax at index 3, value 0.79)

This means: Maria Santos's response is closest to anchor 4 (hard score = 4), but her weighted score is 3.24 — pulled down by moderate similarities to anchors 2 and 3, reflecting some ambiguity in her response ("we always have Lucky Me" is habitual, not necessarily enthusiastic). The weighted score captures this nuance while the hard score gives a definitive bin for distribution counting.

---

## 3. Stage 4: Aggregation

### `_aggregate_scores()` — aggregate across all personas for all dimensions

```python
# In apps/bot/src_v2/mcp/tools/ssr/api.py

import statistics
from scipy.stats import t as t_dist  # For t-distribution CI calculation


def _aggregate_scores(
    persona_responses: list[PersonaResponse],
    evaluation_dimensions: list[EvaluationDimension],
) -> list[AggregatedDimensionResult]:
    """Aggregate per-persona scores into panel-level distributions and statistics.

    For each evaluation dimension, computes:
    - Distribution: count of personas at each hard_score (1–5)
    - Mean: mean of weighted_score values
    - Std dev: standard deviation of weighted_score values
    - Mode: most common hard_score
    - 95% CI: confidence interval for the mean using t-distribution
    - Highlights: up to 6 qualitative highlights (most positive, most negative, neutral)

    Args:
        persona_responses: List of PersonaResponse from run_ssr_pipeline().
            Each contains dimension_scores for all requested dimensions.
        evaluation_dimensions: The list of dimensions to aggregate. Must match
            the keys present in each PersonaResponse.dimension_scores.

    Returns:
        List of AggregatedDimensionResult, one per evaluation dimension,
        in the same order as evaluation_dimensions.
    """
    results: list[AggregatedDimensionResult] = []

    for dim in evaluation_dimensions:
        dim_key = dim.value

        # Collect scores for this dimension from all personas
        hard_scores: list[int] = []
        weighted_scores: list[float] = []
        persona_dim_pairs: list[tuple[PersonaResponse, DimensionScore]] = []

        for pr in persona_responses:
            if dim_key in pr.dimension_scores:
                ds = pr.dimension_scores[dim_key]
                hard_scores.append(ds.hard_score)
                weighted_scores.append(ds.weighted_score)
                persona_dim_pairs.append((pr, ds))

        n = len(weighted_scores)
        if n == 0:
            # Edge case: no personas scored this dimension (shouldn't happen,
            # but guard against it)
            continue

        # Distribution: count per hard_score point
        distribution: dict[int, int] = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        for hs in hard_scores:
            distribution[hs] = distribution.get(hs, 0) + 1

        # Mean and standard deviation of weighted scores
        mean = statistics.mean(weighted_scores)
        std_dev = statistics.stdev(weighted_scores) if n > 1 else 0.0

        # Mode: most common hard_score (lowest wins ties)
        mode = min(
            distribution,
            key=lambda k: (-distribution[k], k),
        )

        # 95% CI using t-distribution (appropriate for small samples like n=10–50)
        if n >= 2:
            # t_critical: two-tailed, alpha=0.05, df=n-1
            t_critical = t_dist.ppf(0.975, df=n - 1)
            margin = t_critical * (std_dev / (n ** 0.5))
            ci_low = max(1.0, mean - margin)
            ci_high = min(5.0, mean + margin)
        else:
            ci_low = mean
            ci_high = mean

        # Qualitative highlights
        highlights = _select_highlights(persona_dim_pairs, mean)

        results.append(AggregatedDimensionResult(
            dimension=dim,
            distribution=distribution,
            mean=round(mean, 4),
            std_dev=round(std_dev, 4),
            mode=mode,
            confidence_interval_95=(round(ci_low, 4), round(ci_high, 4)),
            highlights=highlights,
        ))

    return results
```

### `_select_highlights()` — pick representative qualitative quotes

```python
def _select_highlights(
    persona_dim_pairs: list[tuple[PersonaResponse, DimensionScore]],
    mean: float,
) -> list[HighlightQuote]:
    """Select up to 6 qualitative highlights from persona responses for one dimension.

    Selection strategy:
    - 3 "positive" highlights: the 3 personas with the highest weighted_score
    - 3 "negative" highlights: the 3 personas with the lowest weighted_score
    - If n < 6, neutral highlights (closest to the mean) fill remaining slots

    Each highlight is a truncated excerpt of the persona's response text.
    Excerpts are cut at the nearest sentence boundary within 200 characters
    to preserve readability.

    Args:
        persona_dim_pairs: List of (PersonaResponse, DimensionScore) tuples
            for all personas that scored this dimension.
        mean: Mean weighted_score for this dimension (used to find neutral highlights).

    Returns:
        List of HighlightQuote, ordered: positives first, negatives second.
        Maximum 6 items. May have fewer if the panel is small.
    """
    n = len(persona_dim_pairs)

    # Sort by weighted_score descending for positives
    sorted_desc = sorted(persona_dim_pairs, key=lambda x: x[1].weighted_score, reverse=True)
    # Sort by weighted_score ascending for negatives
    sorted_asc = sorted(persona_dim_pairs, key=lambda x: x[1].weighted_score)
    # Sort by distance from mean for neutrals
    sorted_neutral = sorted(
        persona_dim_pairs,
        key=lambda x: abs(x[1].weighted_score - mean),
    )

    highlights: list[HighlightQuote] = []
    seen_persona_ids: set[str] = set()

    def add_highlight(pr: PersonaResponse, ds: DimensionScore, valence: str) -> bool:
        if pr.persona_id in seen_persona_ids:
            return False
        seen_persona_ids.add(pr.persona_id)
        excerpt = _extract_response_excerpt(pr.response_text, max_chars=200)
        highlights.append(HighlightQuote(
            persona_name=pr.persona_name,
            persona_id=pr.persona_id,
            quote=excerpt,
            valence=valence,
            weighted_score=ds.weighted_score,
        ))
        return True

    # Add top 3 positive (highest scores)
    n_positive = min(3, max(1, n // 4))  # at least 1, up to 3
    for pr, ds in sorted_desc[:n_positive]:
        add_highlight(pr, ds, "positive")

    # Add top 3 negative (lowest scores)
    n_negative = min(3, max(1, n // 4))  # at least 1, up to 3
    for pr, ds in sorted_asc[:n_negative]:
        add_highlight(pr, ds, "negative")

    # Fill remaining slots with neutral (closest to mean), up to 6 total
    remaining_slots = 6 - len(highlights)
    if remaining_slots > 0:
        for pr, ds in sorted_neutral:
            if len(highlights) >= 6:
                break
            add_highlight(pr, ds, "neutral")

    return highlights


def _extract_response_excerpt(response_text: str, max_chars: int = 200) -> str:
    """Extract a readable excerpt from a persona response.

    Tries to cut at a sentence boundary ('. ', '! ', '? ') within max_chars.
    If no sentence boundary found, cuts at the last word boundary before max_chars.
    Appends '...' if truncated.

    Args:
        response_text: Full response text from Claude Haiku.
        max_chars: Maximum character length of the excerpt.

    Returns:
        Excerpt string, at most max_chars characters plus optional '...'.
    """
    if len(response_text) <= max_chars:
        return response_text.strip()

    # Look for sentence boundary before max_chars
    chunk = response_text[:max_chars]
    for sep in ['. ', '! ', '? ']:
        idx = chunk.rfind(sep)
        if idx > max_chars // 2:  # Only cut at sentence if it's past the halfway point
            return response_text[:idx + 1].strip() + "..."

    # Fallback: cut at last word boundary
    last_space = chunk.rfind(' ')
    if last_space > 0:
        return response_text[:last_space].strip() + "..."

    return chunk.strip() + "..."
```

---

## 4. Aggregation Statistics: Full Formulas

### Mean

```
mean = Σ(weighted_score_i) / n
```

Where `n` is the number of personas that scored the dimension (= `personas_scored` if all scored successfully).

### Standard Deviation

Uses `statistics.stdev()` (sample standard deviation, ddof=1):

```
std_dev = sqrt(Σ(weighted_score_i - mean)² / (n - 1))
```

A low std_dev indicates consensus among the panel. A high std_dev indicates polarized reactions.

### Mode

The most frequently occurring `hard_score` value (1–5):

```
mode = argmax over {1, 2, 3, 4, 5} of distribution[k]
```

Ties are broken by choosing the **lower** score. Rationale: in marketing research, conservatively understating consumer enthusiasm is preferred over overstating it.

### 95% Confidence Interval

For the mean `weighted_score` using a two-tailed t-distribution:

```
CI₉₅ = [mean - t₀.₀₂₅(n-1) × (std_dev / √n),  mean + t₀.₀₂₅(n-1) × (std_dev / √n)]
```

Where `t₀.₀₂₅(df)` is the 97.5th percentile of the t-distribution with `df = n - 1` degrees of freedom.

**Reference t-values for common panel sizes**:

| Panel size (n) | df | t₀.₀₂₅(df) | Margin on a typical std_dev of 0.8 |
|---------------|-----|------------|-----------------------------------|
| 5 | 4 | 2.776 | ±0.994 |
| 10 | 9 | 2.262 | ±0.572 |
| 15 | 14 | 2.145 | ±0.443 |
| 20 | 19 | 2.093 | ±0.375 |
| 30 | 29 | 2.045 | ±0.299 |
| 50 | 49 | 2.010 | ±0.228 |

The CI is clipped to [1.0, 5.0] to keep it within valid Likert bounds.

**Implementation note**: `scipy.stats.t.ppf(0.975, df=n-1)` computes the critical value. `scipy` is not currently in `pyproject.toml` and must be added as a dependency. Alternatively, a hardcoded lookup table of t-values for df 1–100+ can be used to avoid the dependency:

```python
# Hardcoded t₀.₀₂₅ values (97.5th percentile, two-tailed 95% CI) for n=2..50+
_T_CRITICAL: dict[int, float] = {
    1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
    6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
    11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
    16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
    21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060,
    26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045, 30: 2.042,
    40: 2.021, 49: 2.010,
}
_T_CRITICAL_DEFAULT = 1.960  # large-n approximation (z-score for 95% CI)


def _t_critical(n: int) -> float:
    """Return t₀.₀₂₅ for df = n-1 (two-tailed 95% CI critical value)."""
    df = n - 1
    if df in _T_CRITICAL:
        return _T_CRITICAL[df]
    # Linear interpolation between known values or use normal approximation
    return _T_CRITICAL_DEFAULT
```

**Decision**: Use the hardcoded lookup table. No new `scipy` dependency needed.

---

## 5. Distribution Interpretation

The `distribution` dict (`{1: count, 2: count, 3: count, 4: count, 5: count}`) represents **how many personas landed at each hard_score point**. It is displayed in compact string form in the tool output:

```
"1:1 2:2 3:5 4:8 5:4"
```

This means: 1 persona at score 1, 2 at score 2, 5 at score 3, 8 at score 4, 4 at score 5.

The sum always equals `personas_scored`.

### Reading the Distribution

| Pattern | What it means |
|---------|--------------|
| All mass at 4–5 | Strong positive consensus |
| All mass at 1–2 | Strong negative consensus |
| Bell curve centered at 3 | Mixed/neutral reaction — low polarization |
| Bimodal (mass at 1–2 and 4–5, low at 3) | Polarized reaction — some love it, some hate it |
| Right-skewed (mostly 3–4, tail at 5) | Moderate positive with enthusiastic minority |
| Left-skewed (mostly 2–3, tail at 1) | Moderate negative with strong rejectors |

---

## 6. DB Storage for Scores

### `ssr_score` table

Each (persona, dimension) score is stored as one row with:

| Column | Value | Source |
|--------|-------|--------|
| `id` | UUID v4 | Generated at insert time |
| `run_id` | FK → `ssr_run.id` | From `run_id` parameter |
| `persona_id` | FK → `ssr_persona.id` | `PersonaResponse.persona_id` |
| `dimension` | TEXT | `DimensionScore` key (e.g. "purchase_intent") |
| `hard_score` | SMALLINT | `DimensionScore.hard_score` (1–5) |
| `weighted_score` | FLOAT8 | `DimensionScore.weighted_score` (float in [1.0, 5.0]) |
| `created_at` | TIMESTAMPTZ | `NOW()` at insert time |

`similarities` (the raw cosine similarity dict) is **not stored in DB** — it's diagnostic only and would add ~240 bytes per row for no querying benefit.

For a 20-persona panel with 3 dimensions, the `bulk_create` call inserts 60 rows (20 × 3) in one statement.

### `ssr_response` table

Each persona's response text is stored as one row with:

| Column | Value | Source |
|--------|-------|--------|
| `id` | UUID v4 | Generated at insert time |
| `run_id` | FK → `ssr_run.id` | From `run_id` parameter |
| `persona_id` | FK → `ssr_persona.id` | `PersonaResponse.persona_id` |
| `response_text` | TEXT | `PersonaResponse.response_text` — full response, not truncated |
| `created_at` | TIMESTAMPTZ | `NOW()` at insert time |

The full response text is stored (not just the excerpt shown in highlights). This enables future retrieval of complete qualitative data via `ssr_panel_results` with `response_format='raw'`.

---

## 7. Anchor Loading from DB

Before scoring, anchor embeddings are loaded from the `ssr_anchor` table:

```python
# db/repositories/ssr_anchors.py

def get_by_dimensions(
    session: Session,
    dimensions: list[str],
) -> dict[str, AnchorSet]:
    """Load pre-embedded anchor sets for the given dimension names.

    Each AnchorSet contains all 5 anchor points for that dimension,
    with pre-embedded 1536-dim vectors loaded as float lists.

    SQL:
        SELECT id, dimension, anchor_point, anchor_statement, embedding, embedding_model
        FROM ssr_anchor
        WHERE dimension = ANY(:dimensions)
        ORDER BY dimension, anchor_point
    """
    rows = session.execute(
        text("""
            SELECT id, dimension, anchor_point, anchor_statement, embedding, embedding_model
            FROM ssr_anchor
            WHERE dimension = ANY(:dimensions)
            ORDER BY dimension, anchor_point
        """),
        {"dimensions": dimensions},
    ).fetchall()

    # Group by dimension
    result: dict[str, dict] = {}
    for row in rows:
        dim = row.dimension
        if dim not in result:
            result[dim] = {
                "dimension": dim,
                "scale": 5,
                "anchors": {},
                "embedding_model": row.embedding_model,
            }
        result[dim]["anchors"][row.anchor_point] = AnchorPoint(
            point=row.anchor_point,
            statement=row.anchor_statement,
            embedding=row.embedding,  # list[float], 1536 elements from FLOAT8[]
        )

    # Convert to AnchorSet objects
    return {
        dim: AnchorSet(
            dimension=data["dimension"],
            scale=data["scale"],
            anchors=data["anchors"],
            embedding_model=data["embedding_model"],
        )
        for dim, data in result.items()
    }
```

### Embedding Version Check

Before scoring, verify the anchor embeddings were generated with the correct model:

```python
# In run_ssr_pipeline(), after loading anchor_sets:
for dim_name, anchor_set in anchor_sets.items():
    if anchor_set.embedding_model != "text-embedding-3-small":
        raise ToolError(
            f"Anchor embeddings for '{dim_name}' were generated with "
            f"'{anchor_set.embedding_model}', but the current embedding model is "
            f"'text-embedding-3-small'. Re-seed anchor embeddings: "
            f"python -m scripts.seed_anchor_embeddings"
        )
```

This check prevents silent scoring errors if the anchor embedding model was changed after initial migration.

---

## 8. Cost Summary for Scoring Stage

The scoring stage (embedding + cosine similarity) costs are negligible:

| Operation | Cost per 20-persona run, 3 dimensions |
|-----------|--------------------------------------|
| `embed_texts()` — 20 responses @ ~200 tokens avg | 20 × 200 × $0.020/1M = $0.000080 |
| `score_against_anchors()` × 60 calls | NumPy only — $0 API cost |
| Anchor loading from DB | DB read — $0 |
| `_aggregate_scores()` | Python computation — $0 |
| **Total scoring stage cost** | **$0.000080** |

Compared to the elicitation stage (~$0.067 for 20 personas), scoring costs less than 0.1% of total run cost.

---

## 9. Cross-References

- [anchor-statements.md](anchor-statements.md) — The 5 anchor statement texts and their pre-embedded status for all 10 EvaluationDimension values
- [panel-run.md](../tools/panel-run.md) — `run_ssr_pipeline()` that calls all three scoring stages; `PanelRunResult`, `AggregatedDimensionResult` dataclasses
- [response-elicitation.md](response-elicitation.md) — Stage 1: what produces the response text that gets embedded here
- [embedding-options.md](../existing-patterns/embedding-options.md) — Full `embed_texts()` spec, `score_against_anchors()` spec, OpenAI integration requirements
- [supabase-schema.md](../data-model/supabase-schema.md) — `ssr_score`, `ssr_response`, `ssr_anchor` table DDL
- [pydantic-models.md](../data-model/pydantic-models.md) — `DimensionScore`, `PersonaResponse`, `AnchorSet`, `AggregatedDimensionResult` type definitions
