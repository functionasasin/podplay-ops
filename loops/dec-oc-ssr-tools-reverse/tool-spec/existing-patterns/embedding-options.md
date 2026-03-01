# Embedding Options for SSR Anchor Mapping

> Analyzed: 2026-03-01
> Aspect: w1-embedding-options
> Purpose: Survey embedding models available to Daimon for the SSR anchor mapping step; recommend one with full integration spec

---

## Context: What Embeddings Are Used For in SSR

The SSR pipeline uses embeddings in exactly one place: **anchor mapping**.

After a persona produces a free-text response to a stimulus, that response embedding is compared via cosine similarity against pre-embedded anchor statements (e.g., "I would definitely buy this product" = 5, "I have no interest in this" = 1). The closest anchor determines the persona's Likert score for that evaluation dimension.

Anchor embeddings are **pre-computed once** at migration time and stored in the `ssr_anchor_set` table. Per panel run, only the **persona response embeddings** need to be computed — one embedding per persona.

This means embedding costs are minimal and call count is very predictable:
- Default panel size 20 → 20 embeddings per run (batched in one API call)
- Panel size 50 (max) → 50 embeddings per run (one API call)

---

## Existing Dependencies Audit

From `apps/bot/pyproject.toml`:

| Package | Version Constraint | Relevance to Embedding |
|---------|-------------------|----------------------|
| `anthropic` | `>=0.40.0` | Claude API — **no embeddings endpoint** |
| `openai` | `>=1.57.0` | OpenAI API — **text-embedding-3-small available** |
| `langfuse` | `>=3.6.1` | Observability — no embedding capability |
| `composio` | `>=0.8.20` | Tool integration — no embedding capability |

`openai` is already present in dependencies. No embedding-specific packages (sentence-transformers, voyageai, cohere) are present.

**From `bootstrap/config.py`**: There is NO `OpenAISettings` class. No `OPENAI_API_KEY` env var is declared.

**From `mcp/context.py`**: `ToolContext` has `anthropic_api_key: str` but **no `openai_api_key` field**.

**Finding**: `openai` package is present (likely pulled in by langfuse or future-proofed) but not yet wired up with an API key in the application bootstrap.

---

## Candidate Models Evaluated

### Candidate 1: OpenAI `text-embedding-3-small` ← RECOMMENDED

| Property | Value |
|----------|-------|
| Package | `openai` (already in `pyproject.toml`) |
| New package needed | No |
| New API key needed | Yes — `OPENAI_API_KEY` env var |
| Model ID | `text-embedding-3-small` |
| Output dimensions | 1536 (default); can reduce via API param |
| Max input tokens | 8,191 |
| Encoding | Float or base64 |
| Cost | $0.020 per 1M tokens |
| Cost per 20-persona run | 20 × ~150 tokens = 3,000 tokens → **$0.00006** |
| Cost per 50-persona run | 50 × ~150 tokens = 7,500 tokens → **$0.00015** |
| Batch support | Yes — single API call with `input: list[str]` |
| MTEB STS Benchmark | 0.513 (Pearson) |
| MTEB overall (56 tasks) | 62.3 (best-in-class for model size) |
| API latency (batch 20) | ~100–300ms |
| Python client | `AsyncOpenAI(api_key=...).embeddings.create(...)` |

**Why recommended**: Zero new package dependencies. Negligible per-run cost (less than 0.1% of total panel run cost dominated by Haiku inference). Excellent semantic similarity quality for short texts. Supports batching all 20 personas in one API call. Already in pyproject.toml.

---

### Candidate 2: OpenAI `text-embedding-3-large`

| Property | Value |
|----------|-------|
| Package | `openai` (already in `pyproject.toml`) |
| New API key needed | Yes — `OPENAI_API_KEY` env var (same as small) |
| Model ID | `text-embedding-3-large` |
| Output dimensions | 3072 |
| Max input tokens | 8,191 |
| Cost | $0.130 per 1M tokens |
| Cost per 20-persona run | $0.00039 |
| MTEB STS Benchmark | 0.554 (Pearson) — higher than small |
| MTEB overall (56 tasks) | 64.6 |

**Why not recommended**: 6.5× more expensive than `text-embedding-3-small` for a 4% quality improvement on STS tasks. The anchor comparison involves very short texts (10–30 tokens per anchor) for which the small model is sufficient. The quality delta is not perceptible in practice for marketing response similarity.

---

### Candidate 3: OpenAI `text-embedding-ada-002` (legacy)

| Property | Value |
|----------|-------|
| Model ID | `text-embedding-ada-002` |
| Output dimensions | 1536 |
| Cost | $0.100 per 1M tokens |
| MTEB overall | 61.0 |

**Why not recommended**: Older model, worse performance than `text-embedding-3-small` at 5× higher cost. Ada-002 is deprecated in favor of the v3 models. Never use for new projects.

---

### Candidate 4: Voyage AI `voyage-3-lite`

| Property | Value |
|----------|-------|
| Package | `voyageai` — **NOT in pyproject.toml** |
| New package needed | Yes |
| New API key needed | Yes — `VOYAGE_API_KEY` |
| Model ID | `voyage-3-lite` |
| Output dimensions | 512 |
| Max input tokens | 32,000 |
| Cost | $0.020 per 1M tokens (same as text-embedding-3-small) |
| MTEB STS Benchmark | ~0.51 (competitive) |

**Why not recommended**: Same cost as text-embedding-3-small, requires adding a new package dependency and new API key. No quality advantage justifies the operational overhead.

---

### Candidate 5: Cohere `embed-multilingual-v3.0`

| Property | Value |
|----------|-------|
| Package | `cohere` — **NOT in pyproject.toml** |
| New package needed | Yes |
| New API key needed | Yes — `COHERE_API_KEY` |
| Output dimensions | 1024 |
| Cost | $0.100 per 1M tokens |

**Why not recommended**: More expensive than text-embedding-3-small. New package + key. Multilingual capability is not a requirement (all anchor statements and responses are in English). No advantage.

---

### Candidate 6: Sentence Transformers `all-MiniLM-L6-v2` (local)

| Property | Value |
|----------|-------|
| Package | `sentence-transformers` — **NOT in pyproject.toml** |
| Model size | ~80MB download |
| Memory at runtime | ~400MB+ process memory |
| API cost | $0 (local inference) |
| Output dimensions | 384 |
| Inference latency (after load) | ~5–15ms for batch 20 |
| Cold start latency | 3–10s (model load from disk) |
| MTEB STS Benchmark | ~0.68 (Pearson) |

**Why not recommended**: The Discord bot runs as a hosted persistent process. Loading an ML model into process memory adds 400MB+ memory pressure, increases container image size, and introduces cold-start risk. If the process restarts, every first panel run takes 3–10 seconds just for model load. Cloud API is simpler, more reliable, and already cheaper than the operational overhead. Additionally, `all-MiniLM-L6-v2` has 384 dimensions vs 1536 for text-embedding-3-small, which may slightly reduce cosine similarity resolution for closely-scored responses.

---

### Candidate 7: Anthropic API

**Why not applicable**: Anthropic does not offer a text embedding API endpoint. The `anthropic` Python SDK has no `embeddings.create()` method. While `tool_context.anthropic_api_key` is already available, it cannot be used for embeddings.

---

## Decision

**Recommendation: `openai.text-embedding-3-small`**

Model ID: `text-embedding-3-small`
API endpoint: `https://api.openai.com/v1/embeddings`
SDK: `AsyncOpenAI` from the `openai` package (already in `pyproject.toml`)
Access via: `tool_context.openai_api_key` (new field — see Required Changes below)

---

## Cost Analysis: Full Panel Run

Panel size: 20 personas (default)

| Operation | Model | Tokens | Cost |
|-----------|-------|--------|------|
| Persona generation (×20) | claude-haiku-4-5-20251001 | 20 × 500 avg = 10,000 | ~$0.040 |
| Response elicitation (×20) | claude-haiku-4-5-20251001 | 20 × 950 avg = 19,000 | ~$0.027 |
| Response embedding (×20) | text-embedding-3-small | 20 × 150 avg = 3,000 | ~$0.000060 |
| Anchor embeddings | Pre-computed at migration | 0 (cached in DB) | $0 |
| **Total per run (20 personas)** | | | **~$0.067** |

Embedding cost = $0.00006 / $0.067 = **0.09% of total run cost**. Negligible.

Panel size 50 (max):

| Operation | Tokens | Cost |
|-----------|--------|------|
| Haiku inference | ~72,500 | ~$0.168 |
| Embedding | 50 × 150 = 7,500 | $0.00015 |
| **Total** | | **~$0.168** |

---

## Anchor Pre-embedding Strategy

Anchor statements are embedded **once** during database migration and stored in `ssr_anchor_set` as `FLOAT8[]` (PostgreSQL float8 array).

At anchor embed time:
- Total anchor statements: 8 dimensions × 5 anchors = 40 statements
- Average tokens per anchor statement: ~12 tokens
- Total tokens: ~480 tokens → **$0.0000096** (one-time cost at migration)

This means every panel run only needs to embed the 20 persona responses (not any anchors).

If the embedding model changes, a migration script must re-embed all stored anchors.

---

## Required Changes to Daimon

Three files require modification to wire up the OpenAI API key:

### 1. `apps/bot/src_v2/bootstrap/config.py`

Add new settings class after the `AnthropicSettings` class:

```python
class OpenAISettings(BaseSettings):
    """OpenAI API configuration.

    Uses OPENAI_ env prefix. Required for SSR anchor embedding.
    """

    api_key: NonEmptyStr

    model_config = {"env_prefix": "OPENAI_"}
```

Add to `AppSettings`:

```python
openai: OpenAISettings = Field(
    default_factory=lambda: OpenAISettings()  # pyright: ignore[reportCallIssue]
)
```

### 2. `apps/bot/src_v2/mcp/context.py`

Add to `ToolContext` dataclass (after `anthropic_api_key`):

```python
openai_api_key: str
```

Full updated `ToolContext` docstring addition:
```
openai_api_key: OpenAI API key for text embedding (SSR anchor mapping).
```

### 3. `apps/bot/src_v2/entrypoints/discord/main.py`

In the `ToolContext(...)` constructor call (around line 41–53), add:

```python
openai_api_key=settings.openai.api_key,
```

### 4. Environment variable

Add to `.env` and Fly.io secrets:

```
OPENAI_API_KEY=sk-...
```

---

## Usage Pattern in `mcp/tools/ssr/api.py`

The embedding function lives in `api.py` (the async I/O layer), following the existing pattern where `api.py` handles external API calls.

```python
import numpy as np
from openai import AsyncOpenAI


async def embed_texts(texts: list[str], openai_api_key: str) -> list[np.ndarray]:
    """Embed a batch of texts using OpenAI text-embedding-3-small.

    All texts are embedded in a single API call for efficiency.
    Returns one embedding vector per input text, in input order.

    Args:
        texts: List of strings to embed. Each should be < 8,191 tokens.
            Typical SSR responses are 50–200 tokens.
        openai_api_key: OpenAI API key from tool_context.openai_api_key.

    Returns:
        List of numpy arrays, shape (1536,), dtype float32, in input order.

    Raises:
        ToolError: If the OpenAI API call fails (network error, invalid key,
            rate limit). Error message includes HTTP status.
    """
    client = AsyncOpenAI(api_key=openai_api_key)
    response = await client.embeddings.create(
        model="text-embedding-3-small",
        input=texts,
        encoding_format="float",
    )
    # Sort by index — OpenAI guarantees order but explicit sort is defensive
    sorted_data = sorted(response.data, key=lambda x: x.index)
    return [np.array(item.embedding, dtype=np.float32) for item in sorted_data]


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Compute cosine similarity between two unit-normalizable vectors.

    Args:
        a: First embedding vector, shape (1536,).
        b: Second embedding vector, shape (1536,).

    Returns:
        Cosine similarity in range [-1, 1]. Typical range for semantically
        related English texts: [0.3, 0.95].
    """
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def score_against_anchors(
    response_embedding: np.ndarray,
    anchor_embeddings: dict[int, np.ndarray],
) -> tuple[int, float, dict[int, float]]:
    """Map a response embedding to a Likert score via anchor cosine similarity.

    Implements the core SSR scoring step: compare the response embedding
    to each anchor embedding, apply softmax over similarities to get weights,
    compute weighted mean, and find the closest integer Likert score.

    Args:
        response_embedding: Embedding of the persona's free-text response.
            Shape (1536,), from text-embedding-3-small.
        anchor_embeddings: Dict mapping Likert score (int, 1–5 or 1–7) to
            its pre-embedded anchor statement vector. Shape (1536,) each.

    Returns:
        Tuple of:
            - hard_score: The Likert point (1–5) of the single closest anchor
              (argmax cosine similarity). Used for mode and distribution.
            - weighted_score: Softmax-weighted mean Likert score (float).
              Used for panel mean and distribution center of mass.
            - similarities: Dict mapping each Likert point to its raw cosine
              similarity. Used for diagnostic/debug output.
    """
    scores = sorted(anchor_embeddings.keys())
    sims_array = np.array(
        [cosine_similarity(response_embedding, anchor_embeddings[s]) for s in scores],
        dtype=np.float64,
    )

    # Softmax over cosine similarities to get per-anchor weight
    exp_sims = np.exp(sims_array - np.max(sims_array))  # numerically stable
    weights = exp_sims / exp_sims.sum()

    # Hard score: argmax
    hard_score = scores[int(np.argmax(sims_array))]

    # Weighted mean score
    weighted_score = float(np.dot(weights, scores))

    similarities = {scores[i]: float(sims_array[i]) for i in range(len(scores))}

    return hard_score, weighted_score, similarities
```

**Note on numpy**: `numpy` is not listed in `pyproject.toml` but `pandas>=2.3.3` is, and pandas depends on numpy. Numpy will be available transitively. No new dependency needed.

---

## Anchor Embedding Storage Format

Anchor statement embeddings are stored in the `ssr_anchor_set` table as PostgreSQL `FLOAT8[]` (double precision arrays) with a fixed length of 1536 elements.

When loading from DB for scoring:
```python
# From DB: anchor row has field `embedding: list[float]` (1536 elements)
anchor_embedding = np.array(anchor_row.embedding, dtype=np.float32)
```

When seeding anchors at migration time (pseudo-code for the migration script):
```python
# Run once at migration time, using a one-off OpenAI client
from openai import OpenAI
client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

all_anchor_texts = [...]  # 40 texts: 8 dimensions × 5 anchors
response = client.embeddings.create(
    model="text-embedding-3-small",
    input=all_anchor_texts,
    encoding_format="float",
)
# Insert each embedding into ssr_anchor_set.embedding column
```

The migration script is a Python script run once with:
```
python -m scripts.seed_anchor_embeddings
```

See `tool-spec/data-model/migration.sql` for the table DDL and `tool-spec/pipeline/anchor-statements.md` for the 40 anchor statements.

---

## Model Versioning Risk

OpenAI may deprecate `text-embedding-3-small` in the future. Mitigations:

1. Store the model name used to generate each embedding in `ssr_anchor_set.embedding_model` column (default `'text-embedding-3-small'`). This enables detecting stale embeddings.
2. When model changes, run a migration script to re-embed all anchor sets.
3. Per-persona response embeddings are ephemeral (used for scoring, not stored beyond the run). No re-embedding needed for historical data.

The `embedding_model` field is documented in `tool-spec/data-model/supabase-schema.md`.

---

## Summary

| Decision | Value |
|----------|-------|
| Model | `text-embedding-3-small` |
| Provider | OpenAI |
| SDK | `openai` (already in `pyproject.toml`) |
| New package | None |
| New env var | `OPENAI_API_KEY` |
| New `ToolContext` field | `openai_api_key: str` |
| New `AppSettings` group | `OpenAISettings` (env prefix `OPENAI_`) |
| Output dimensions | 1536 |
| Cost per 20-persona run | $0.00006 (< 0.1% of total) |
| Cost per 50-persona run | $0.00015 |
| Anchor embedding | Pre-computed at migration, stored as `FLOAT8[1536]` in DB |
| Batch strategy | All persona responses in one API call per run |
| Scoring function | Softmax-weighted mean + argmax hard score |
| numpy | Available transitively via pandas — no new dep needed |
