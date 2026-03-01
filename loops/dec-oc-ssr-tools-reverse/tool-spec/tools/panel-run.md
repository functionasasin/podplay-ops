# `ssr_panel_run` — Tool Specification

> Status: Complete (w2-tool-panel-run).
> Cross-references: [panel-create.md](panel-create.md) · [stimulus-presentation.md](../pipeline/stimulus-presentation.md) · [response-elicitation.md](../pipeline/response-elicitation.md) · [scoring-aggregation.md](../pipeline/scoring-aggregation.md) · [anchor-statements.md](../pipeline/anchor-statements.md) · [supabase-schema.md](../data-model/supabase-schema.md) · [pydantic-models.md](../data-model/pydantic-models.md) · [embedding-options.md](../existing-patterns/embedding-options.md) · [tool-system.md](../existing-patterns/tool-system.md)

---

## 1. Tool Definition

```python
@tool(
    description="""\
Run a simulated consumer research panel on a marketing asset.

Use when a user wants to test ad copy, a headline, tagline, product concept,
brand message, campaign theme, influencer pitch, pricing message, packaging
description, or social media caption with an existing synthetic consumer panel.

For each persona in the panel, the SSR pipeline:
  1. Presents the marketing asset to the persona (inhabiting their full profile)
  2. Elicits a naturalistic free-text reaction (not numeric ratings)
  3. Embeds the response using a semantic embedding model
  4. Scores the embedding against pre-defined Likert anchor statements per dimension
  5. Aggregates scores across the full panel into distributions and highlights

Returns Likert score distributions, mean scores, standard deviations, and
qualitative highlights (representative positive, negative, and neutral quotes)
for each requested evaluation dimension.

Requires an existing panel created with ssr_panel_create.
Returns a run_id — use ssr_panel_results to retrieve results later.""",
    tags={Platform.SSR, Action.WRITE},
)
async def ssr_panel_run(
    tool_context: ToolContext,
    user_context: UserContext,
    db_context: DatabaseContext | None,
    params: PanelRunInput,
) -> str:
```

**Tool name (MCP)**: `ssr_panel_run`
**File location**: `apps/bot/src_v2/mcp/tools/ssr/tools.py`
**tags**: `{Platform.SSR, Action.WRITE}` — requires `Platform.SSR = "ssr"` in `core/platforms.py`
**requires_credential**: `None` — uses `tool_context.anthropic_api_key` and `tool_context.openai_api_key` (system keys)
**db_context**: Required — always raises `ToolError` if `None`

---

## 2. Input Schema

### `PanelRunInput` (Pydantic v2 BaseModel)

```python
class PanelRunInput(BaseModel):
    """Input for ssr_panel_run."""

    panel_id: str = Field(
        description=(
            "UUID of the consumer panel to run. "
            "Must be a panel created with ssr_panel_create. "
            "Panel must have status 'ready' or 'partial'."
        ),
    )
    stimulus: str = Field(
        min_length=1,
        max_length=4000,
        description=(
            "The marketing asset to test — the full text of the ad copy, "
            "headline, tagline, product concept description, brand message, "
            "campaign brief, influencer pitch, pricing message, packaging copy, "
            "or social caption. Include all relevant text as it would appear "
            "to the consumer. Maximum 4000 characters."
        ),
    )
    stimulus_type: StimulusType = Field(
        description=(
            "The category of marketing asset being tested. Shapes how the "
            "stimulus is presented to personas. One of: "
            "'ad_copy' (display or video ad body copy), "
            "'headline' (advertising headline or title), "
            "'tagline' (brand tagline or slogan), "
            "'product_concept' (product idea description), "
            "'brand_message' (brand positioning statement), "
            "'campaign_theme' (campaign creative theme or direction), "
            "'influencer_pitch' (influencer collaboration pitch), "
            "'pricing_message' (price offer or value proposition), "
            "'packaging_description' (packaging text/design description), "
            "'social_caption' (social media post caption)."
        ),
    )
    evaluation_dimensions: list[EvaluationDimension] = Field(
        min_length=1,
        max_length=10,
        description=(
            "Which dimensions to evaluate. Each dimension produces its own "
            "Likert score distribution from 1–5. Available dimensions: "
            "'purchase_intent' (likelihood to buy/try), "
            "'brand_favorability' (overall brand impression), "
            "'message_clarity' (comprehension of the communication), "
            "'emotional_response' (strength of positive emotional reaction), "
            "'personal_relevance' (how relevant to their life), "
            "'uniqueness' (perceived distinctiveness vs. competitors), "
            "'trust_credibility' (believability and trustworthiness), "
            "'value_perception' (perceived value for the price), "
            "'share_worthiness' (likelihood to share with others), "
            "'overall_appeal' (overall attractiveness of the asset). "
            "Default: ['purchase_intent', 'message_clarity', 'overall_appeal']."
        ),
        default=[
            EvaluationDimension.PURCHASE_INTENT,
            EvaluationDimension.MESSAGE_CLARITY,
            EvaluationDimension.OVERALL_APPEAL,
        ],
    )
    response_format: ResponseFormat = Field(
        default=ResponseFormat.SUMMARY,
        description=(
            "Level of detail in the returned results. "
            "'summary': one section per dimension with mean, mode, distribution, "
            "and top 2 qualitative highlights — best for Discord display. "
            "'detailed': full distribution, top 3 highlights per valence (positive, "
            "negative, neutral), standard deviation, confidence interval. "
            "'raw': full per-persona breakdown with response text excerpts and "
            "all dimension scores — for offline analysis."
        ),
    )
    run_label: str | None = Field(
        default=None,
        max_length=120,
        description=(
            "Optional human-readable label for this run "
            "(e.g. 'Version A — emotional headline', 'Control copy'). "
            "Useful when running multiple stimuli against the same panel "
            "for comparison. Shown in ssr_panel_results output."
        ),
    )
```

### `StimulusType` (StrEnum)

```python
class StimulusType(str, Enum):
    """Category of marketing asset being tested. Shapes the presentation prompt."""

    AD_COPY = "ad_copy"
    # Full display or video advertisement body copy. Multi-sentence.
    # Examples: print ad text, digital banner copy, video script excerpt.
    # Display label in prompt: "advertisement"

    HEADLINE = "headline"
    # Advertising headline or title. Typically 3–12 words.
    # Examples: "The Coffee That Never Quits", "Your Morning, Upgraded."
    # Display label in prompt: "advertising headline"

    TAGLINE = "tagline"
    # Brand tagline or slogan. Typically 2–8 words.
    # Examples: "Just Do It", "I'm Lovin' It", "Think Different."
    # Display label in prompt: "brand tagline"

    PRODUCT_CONCEPT = "product_concept"
    # Product or service idea description. Can be 1–3 paragraphs explaining
    # what the product is, what problem it solves, key features.
    # Display label in prompt: "product concept"

    BRAND_MESSAGE = "brand_message"
    # Brand positioning or values statement. Examples: "Our brand stands for
    # accessibility, quality, and family."
    # Display label in prompt: "brand message"

    CAMPAIGN_THEME = "campaign_theme"
    # Campaign creative direction or theme description. Examples: "A campaign
    # about Filipino mothers building businesses while raising families."
    # Display label in prompt: "campaign theme"

    INFLUENCER_PITCH = "influencer_pitch"
    # Pitch for an influencer partnership — content the influencer would post,
    # or the influencer's profile + brand match description.
    # Display label in prompt: "influencer content"

    PRICING_MESSAGE = "pricing_message"
    # Price offer, value proposition, or pricing communication.
    # Examples: "₱99/month for the whole family", "Buy 2 get 1 free."
    # Display label in prompt: "pricing offer"

    PACKAGING_DESCRIPTION = "packaging_description"
    # Textual/visual description of packaging. Describe colors, imagery,
    # text, feel, shelf presence — since visuals cannot be shown.
    # Display label in prompt: "product packaging"

    SOCIAL_CAPTION = "social_caption"
    # Social media post caption (Instagram, Facebook, TikTok).
    # Include hashtags and emoji if part of the post.
    # Display label in prompt: "social media post"
```

### `StimulusType` → Display Label Mapping

```python
_STIMULUS_TYPE_LABELS: dict[StimulusType, str] = {
    StimulusType.AD_COPY: "advertisement",
    StimulusType.HEADLINE: "advertising headline",
    StimulusType.TAGLINE: "brand tagline",
    StimulusType.PRODUCT_CONCEPT: "product concept",
    StimulusType.BRAND_MESSAGE: "brand message",
    StimulusType.CAMPAIGN_THEME: "campaign theme",
    StimulusType.INFLUENCER_PITCH: "influencer content",
    StimulusType.PRICING_MESSAGE: "pricing offer",
    StimulusType.PACKAGING_DESCRIPTION: "product packaging",
    StimulusType.SOCIAL_CAPTION: "social media post",
}
```

### `EvaluationDimension` (StrEnum)

```python
class EvaluationDimension(str, Enum):
    """Evaluation dimensions available for SSR scoring. Each maps to a pre-embedded anchor set."""

    PURCHASE_INTENT = "purchase_intent"
    # Likelihood to buy, try, subscribe to, or engage with the product/service.
    # Scale: 1 (no interest) → 5 (would buy immediately)

    BRAND_FAVORABILITY = "brand_favorability"
    # Overall impression of the brand based on the marketing asset.
    # Scale: 1 (negative impression) → 5 (very positive impression)

    MESSAGE_CLARITY = "message_clarity"
    # How well the persona understood what was being communicated.
    # Scale: 1 (completely unclear) → 5 (immediately understood)

    EMOTIONAL_RESPONSE = "emotional_response"
    # Strength of positive emotional engagement with the asset.
    # Scale: 1 (no emotional reaction) → 5 (genuinely excited and moved)

    PERSONAL_RELEVANCE = "personal_relevance"
    # How relevant the asset is to the persona's life, needs, and circumstances.
    # Scale: 1 (not relevant at all) → 5 (directly relevant right now)

    UNIQUENESS = "uniqueness"
    # Perceived distinctiveness — how different it feels from alternatives.
    # Scale: 1 (completely generic) → 5 (never seen anything like it)

    TRUST_CREDIBILITY = "trust_credibility"
    # Believability of the claims or authenticity of the communication.
    # Scale: 1 (feels dishonest/too good to be true) → 5 (completely credible)

    VALUE_PERCEPTION = "value_perception"
    # Perceived value relative to price or perceived product worthiness.
    # Scale: 1 (overpriced/not worth it) → 5 (excellent value)

    SHARE_WORTHINESS = "share_worthiness"
    # Likelihood to share, recommend, or forward to others.
    # Scale: 1 (would never share) → 5 (would share immediately)

    OVERALL_APPEAL = "overall_appeal"
    # General attractiveness and likeability of the marketing asset.
    # Scale: 1 (unappealing, would ignore) → 5 (love it, would catch attention)
```

### `ResponseFormat` (StrEnum)

```python
class ResponseFormat(str, Enum):
    """Output verbosity level for ssr_panel_run results."""

    SUMMARY = "summary"
    # Per-dimension: mean, mode, compact distribution (e.g. "1:1 2:2 3:5 4:8 5:4"),
    # top 2 qualitative highlights (1 most positive, 1 most negative).
    # Optimized for Discord display — fits in a single readable message.

    DETAILED = "detailed"
    # Per-dimension: mean, mode, std dev, 95% confidence interval, full distribution,
    # top 3 positive highlights, top 3 negative highlights, 2 neutral highlights.
    # May generate long output — best used in threads.

    RAW = "raw"
    # Full per-persona breakdown: each persona's name, response text excerpt
    # (first 200 chars), and all dimension scores. Includes aggregated stats.
    # Use when the user wants to read individual responses.
```

---

## 3. Output Format

The tool returns XML using `tag()`, `wrap()`, and `hint()`. Structure varies by `response_format`.

### 3.1 Output Formatter: `_fmt_run_result()`

```python
def _fmt_run_result(
    result: "PanelRunResult",
    stimulus: str,
    stimulus_type: StimulusType,
    response_format: ResponseFormat,
) -> str:
    """Format the panel run result as XML for Claude."""
    stimulus_short = stimulus[:120].rstrip() + ("..." if len(stimulus) > 120 else "")
    dimension_tags = [
        _fmt_dimension_result(dim_result, response_format)
        for dim_result in result.aggregated_dimensions
    ]
    parts = [
        tag("run-id", result.run_id),
        tag("panel-id", result.panel_id),
        tag("stimulus", stimulus_short, type=stimulus_type.value),
        tag("personas-scored", str(result.personas_scored)),
        wrap("dimensions", dimension_tags, count=str(len(dimension_tags))),
    ]
    if response_format == ResponseFormat.RAW:
        persona_tags = [_fmt_persona_raw(pr) for pr in result.persona_responses]
        parts.append(wrap("persona-responses", persona_tags, count=str(len(persona_tags))))
    parts.append(
        hint(
            f"Run complete. Use ssr_panel_results with run_id='{result.run_id}' "
            f"to retrieve these results again or compare with another run."
        )
    )
    return tag(
        "panel-run-results",
        "".join(parts),
        raw=True,
        run_id=result.run_id,
        panel_id=result.panel_id,
        personas_scored=str(result.personas_scored),
        dimensions=str(len(result.aggregated_dimensions)),
        format=response_format.value,
    )
```

### 3.2 Per-Dimension Formatter: `_fmt_dimension_result()`

```python
def _fmt_dimension_result(
    dim: "AggregatedDimensionResult",
    response_format: ResponseFormat,
) -> str:
    """Format one dimension's aggregated result as XML."""
    dist_str = " ".join(
        f"{score}:{count}"
        for score, count in sorted(dim.distribution.items())
    )
    # e.g. "1:1 2:2 3:5 4:8 5:4"
    parts = [
        tag("mean", f"{dim.mean:.2f}"),
        tag("std", f"{dim.std_dev:.2f}"),
        tag("mode", str(dim.mode)),
        tag("distribution", dist_str),
    ]
    if response_format == ResponseFormat.DETAILED:
        ci_low, ci_high = dim.confidence_interval_95
        parts.append(tag("confidence-interval-95", f"{ci_low:.2f}–{ci_high:.2f}"))
    n_highlights = 3 if response_format == ResponseFormat.DETAILED else 2
    highlight_tags = [
        tag("highlight", h.quote, valence=h.valence, persona=h.persona_name)
        for h in dim.highlights[:n_highlights]
    ]
    if highlight_tags:
        parts.append(wrap("highlights", highlight_tags, count=str(len(highlight_tags))))
    return tag("dimension", "".join(parts), raw=True, name=dim.dimension.value)
```

### 3.3 Per-Persona Raw Formatter: `_fmt_persona_raw()`

```python
def _fmt_persona_raw(pr: "PersonaResponse") -> str:
    """Format one persona's response and scores for raw output."""
    response_excerpt = pr.response_text[:200].rstrip() + ("..." if len(pr.response_text) > 200 else "")
    score_tags = [
        tag("score", f"{ds.weighted_score:.2f}", dimension=dim, hard=str(ds.hard_score))
        for dim, ds in pr.dimension_scores.items()
    ]
    return tag(
        "persona-response",
        tag("response-excerpt", response_excerpt) + "".join(score_tags),
        raw=True,
        name=pr.persona_name,
        persona_id=pr.persona_id,
    )
```

### 3.4 Summary Format Example

20-persona Filipino moms panel, social caption: "Ang sarap, tipid pa! Lucky Me na naman kasama ko sa hapag-kainan.", dimensions: `purchase_intent`, `message_clarity`, `personal_relevance`.

```xml
<panel-run-results run_id="f9e1c2d3-a4b5-6789-cdef-012345678901" panel_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890" personas_scored="20" dimensions="3" format="summary">
  <run-id>f9e1c2d3-a4b5-6789-cdef-012345678901</run-id>
  <panel-id>a1b2c3d4-e5f6-7890-abcd-ef1234567890</panel-id>
  <stimulus type="social_caption">Ang sarap, tipid pa! Lucky Me na naman kasama ko sa hapag-kainan.</stimulus>
  <personas-scored>20</personas-scored>
  <dimensions count="3">
    <dimension name="purchase_intent">
      <mean>3.85</mean>
      <std>0.91</std>
      <mode>4</mode>
      <distribution>1:1 2:2 3:4 4:9 5:4</distribution>
      <highlights count="2">
        <highlight valence="positive" persona="Maria Santos">I'd definitely grab another pack — we always have Lucky Me at home and this just reminded me to stock up.</highlight>
        <highlight valence="negative" persona="Celine Vera">I don't buy Lucky Me anymore. I switched to a cheaper brand from the wet market. This doesn't make me want to go back.</highlight>
      </highlights>
    </dimension>
    <dimension name="message_clarity">
      <mean>4.40</mean>
      <std>0.62</std>
      <mode>5</mode>
      <distribution>1:0 2:1 3:2 4:8 5:9</distribution>
      <highlights count="2">
        <highlight valence="positive" persona="Liza Reyes">Simple lang, diretso — masarap at mura. Gets mo agad. That's Lucky Me.</highlight>
        <highlight valence="negative" persona="Joy Dela Cruz">I get what it's saying but it's just… obvious? Nothing new here.</highlight>
      </highlights>
    </dimension>
    <dimension name="personal_relevance">
      <mean>4.10</mean>
      <std>0.78</std>
      <mode>4</mode>
      <distribution>1:0 2:2 3:4 4:9 5:5</distribution>
      <highlights count="2">
        <highlight valence="positive" persona="Ana Bautista">This is literally my life. I cook Lucky Me at least twice a week when I run out of ulam budget.</highlight>
        <highlight valence="negative" persona="Grace Mendoza">I've been trying to cook more fresh food. My kids have been eating too many instant noodles. This doesn't appeal to me right now.</highlight>
      </highlights>
    </dimension>
  </dimensions>
  <hint>Run complete. Use ssr_panel_results with run_id='f9e1c2d3-a4b5-6789-cdef-012345678901' to retrieve these results again or compare with another run.</hint>
</panel-run-results>
```

---

## 4. Tool Handler Implementation

```python
# apps/bot/src_v2/mcp/tools/ssr/tools.py

import uuid
from src_v2.core.xml import tag, wrap, hint
from src_v2.mcp.context import DatabaseContext, ToolContext, UserContext
from src_v2.mcp.registry import tool, ToolError
from src_v2.mcp.tags import Action, Platform
from src_v2.db.repositories import ssr_panels as ssr_panels_repo
from src_v2.db.repositories import ssr_personas as ssr_personas_repo
from src_v2.db.repositories import ssr_anchors as ssr_anchors_repo
from src_v2.db.repositories import ssr_runs as ssr_runs_repo
from src_v2.db.repositories import ssr_responses as ssr_responses_repo
from src_v2.db.repositories import ssr_scores as ssr_scores_repo
from . import api
from .models import (
    EvaluationDimension,
    PanelRunInput,
    ResponseFormat,
    StimulusType,
    AggregatedDimensionResult,
    PanelRunResult,
    PersonaResponse,
)


@tool(
    description="""\
Run a simulated consumer research panel on a marketing asset.
[... full description as shown in Section 1 ...]""",
    tags={Platform.SSR, Action.WRITE},
)
async def ssr_panel_run(
    tool_context: ToolContext,
    user_context: UserContext,
    db_context: DatabaseContext | None,
    params: PanelRunInput,
) -> str:
    if db_context is None:
        raise ToolError("Database context required for SSR panel tools.")

    session = db_context.session_factory()

    # 1. Load and validate panel ownership
    panel = ssr_panels_repo.get_by_id(session, params.panel_id)
    if panel is None or panel.discord_id != user_context.discord_id:
        raise ToolError(
            f"Panel '{params.panel_id}' not found. "
            f"Use ssr_panel_list to see your available panels."
        )

    # 2. Check panel is runnable
    if panel.status not in ("ready", "partial"):
        raise ToolError(
            f"Panel '{params.panel_id}' has status '{panel.status}' and cannot be run. "
            f"Only panels with status 'ready' or 'partial' can be used for runs."
        )

    # 3. Load personas
    personas = ssr_personas_repo.list_by_panel(session, params.panel_id)
    if not personas:
        raise ToolError(
            f"Panel '{params.panel_id}' has no personas. "
            f"This may indicate a corrupted panel. Please create a new panel."
        )

    # 4. Load anchor embeddings for requested dimensions
    anchor_sets = ssr_anchors_repo.get_by_dimensions(
        session,
        [dim.value for dim in params.evaluation_dimensions],
    )
    missing_anchors = [
        dim.value for dim in params.evaluation_dimensions
        if dim.value not in anchor_sets
    ]
    if missing_anchors:
        raise ToolError(
            f"Missing anchor embeddings for dimensions: {missing_anchors}. "
            f"The database may need to be re-seeded. "
            f"Contact an admin to run: python -m scripts.seed_anchor_embeddings"
        )

    # 5. Create run record (status='running')
    run_id = str(uuid.uuid4())
    run_label = params.run_label or f"Run {_iso_timestamp()}"
    ssr_runs_repo.create(
        session,
        run_id=run_id,
        panel_id=params.panel_id,
        stimulus=params.stimulus,
        stimulus_type=params.stimulus_type.value,
        dimensions=[d.value for d in params.evaluation_dimensions],
        run_label=run_label,
        status="running",
    )

    # 6. Execute SSR pipeline
    try:
        result = await api.run_ssr_pipeline(
            tool_ctx=tool_context,
            run_id=run_id,
            stimulus=params.stimulus,
            stimulus_type=params.stimulus_type,
            personas=personas,
            anchor_sets=anchor_sets,
            evaluation_dimensions=params.evaluation_dimensions,
        )
    except ToolError:
        ssr_runs_repo.update_status(session, run_id, "failed")
        raise
    except Exception as exc:
        ssr_runs_repo.update_status(session, run_id, "failed")
        raise ToolError(
            f"Panel run failed unexpectedly: {exc}. "
            f"The run has been marked as failed (run_id='{run_id}'). "
            f"Please try again."
        ) from exc

    # 7. Persist results
    ssr_responses_repo.bulk_create(session, run_id=run_id, responses=result.persona_responses)
    ssr_scores_repo.bulk_create(session, run_id=run_id, responses=result.persona_responses)

    # 8. Update run record to completed
    ssr_runs_repo.update_status(
        session,
        run_id,
        "completed",
        personas_scored=result.personas_scored,
        dimension_means={d.dimension.value: d.mean for d in result.aggregated_dimensions},
    )

    # 9. Format and return
    return _fmt_run_result(
        result=result,
        stimulus=params.stimulus,
        stimulus_type=params.stimulus_type,
        response_format=params.response_format,
    )


def _iso_timestamp() -> str:
    """Return a compact ISO timestamp string for auto-labeling runs."""
    from datetime import datetime, timezone
    return datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M")
```

---

## 5. API Layer Implementation: `run_ssr_pipeline()`

```python
# apps/bot/src_v2/mcp/tools/ssr/api.py (run section)

import asyncio
import numpy as np
from anthropic import AsyncAnthropic
from openai import AsyncOpenAI

from src_v2.mcp.context import ToolContext
from src_v2.mcp.registry import ToolError
from .models import (
    AnchorSet,
    AggregatedDimensionResult,
    DimensionScore,
    EvaluationDimension,
    PanelRunResult,
    PersonaResponse,
    SsrPersonaSummary,
    StimulusType,
)

_ELICITATION_MODEL = "claude-haiku-4-5-20251001"
_ELICITATION_MAX_TOKENS = 450


async def run_ssr_pipeline(
    tool_ctx: ToolContext,
    run_id: str,
    stimulus: str,
    stimulus_type: StimulusType,
    personas: list[SsrPersonaSummary],
    anchor_sets: dict[str, AnchorSet],
    evaluation_dimensions: list[EvaluationDimension],
) -> PanelRunResult:
    """Execute the full SSR pipeline for a panel run.

    Steps:
        1. Elicit free-text responses from all personas concurrently (Claude Haiku)
        2. Embed all responses in one batch API call (OpenAI text-embedding-3-small)
        3. Score each embedding against anchor sets per dimension (cosine similarity)
        4. Aggregate scores into distributions, means, std devs, and highlights

    Args:
        tool_ctx: ToolContext containing both anthropic_api_key and openai_api_key.
        run_id: UUID of the ssr_run row already inserted (status='running').
        stimulus: The marketing asset text to present to each persona.
        stimulus_type: Category of the marketing asset — shapes the user prompt framing.
        personas: List of SsrPersonaSummary loaded from ssr_persona table.
        anchor_sets: Dict mapping dimension name → AnchorSet with pre-embedded anchors.
        evaluation_dimensions: List of EvaluationDimension to score.

    Returns:
        PanelRunResult with per-persona responses and aggregated dimension results.

    Raises:
        ToolError: If fewer than 50% of personas produced scoreable responses.
        ToolError: If the OpenAI embedding call fails.
    """
    # Stage 1: Elicit responses from all personas concurrently
    anthropic_client = AsyncAnthropic(api_key=tool_ctx.anthropic_api_key)
    elicitation_tasks = [
        _elicit_persona_response(
            client=anthropic_client,
            persona=persona,
            stimulus=stimulus,
            stimulus_type=stimulus_type,
        )
        for persona in personas
    ]
    raw_results = await asyncio.gather(*elicitation_tasks, return_exceptions=True)

    # Separate successes from failures
    successful_pairs: list[tuple[SsrPersonaSummary, str]] = []
    for persona, result in zip(personas, raw_results):
        if not isinstance(result, Exception):
            successful_pairs.append((persona, result))

    if len(successful_pairs) < len(personas) * 0.5:
        raise ToolError(
            f"Panel run failed: only {len(successful_pairs)} of {len(personas)} personas "
            f"produced responses before an error occurred. Please try again."
        )

    # Stage 2: Embed all responses in one batch API call
    openai_client = AsyncOpenAI(api_key=tool_ctx.openai_api_key)
    response_texts = [resp for _, resp in successful_pairs]
    embeddings = await embed_texts(openai_client, response_texts)
    # embeddings: list of np.ndarray shape (1536,), one per successful persona

    # Stage 3: Score each embedding against each dimension's anchor set
    persona_responses: list[PersonaResponse] = []
    for (persona, response_text), embedding in zip(successful_pairs, embeddings):
        dimension_scores: dict[str, DimensionScore] = {}
        for dim in evaluation_dimensions:
            anchor_set = anchor_sets[dim.value]
            anchor_embedding_dict: dict[int, np.ndarray] = {
                point: np.array(anchor.embedding, dtype=np.float32)
                for point, anchor in anchor_set.anchors.items()
            }
            hard_score, weighted_score, similarities = score_against_anchors(
                response_embedding=embedding,
                anchor_embeddings=anchor_embedding_dict,
            )
            dimension_scores[dim.value] = DimensionScore(
                hard_score=hard_score,
                weighted_score=weighted_score,
                similarities=similarities,
            )
        persona_responses.append(PersonaResponse(
            persona_id=persona.persona_id,
            persona_name=persona.name,
            response_text=response_text,
            dimension_scores=dimension_scores,
        ))

    # Stage 4: Aggregate
    aggregated = _aggregate_scores(persona_responses, evaluation_dimensions)

    return PanelRunResult(
        run_id=run_id,
        panel_id=personas[0].panel_id if personas else "",
        persona_responses=persona_responses,
        aggregated_dimensions=aggregated,
        personas_scored=len(persona_responses),
    )
```

---

## 6. Elicitation Call: `_elicit_persona_response()`

```python
# In api.py

async def _elicit_persona_response(
    client: AsyncAnthropic,
    persona: SsrPersonaSummary,
    stimulus: str,
    stimulus_type: StimulusType,
) -> str:
    """Elicit a naturalistic free-text response from one persona for one stimulus.

    Args:
        client: AsyncAnthropic client.
        persona: The persona whose full_profile drives the system prompt.
        stimulus: The marketing asset text.
        stimulus_type: The category — shapes the framing label in the user prompt.

    Returns:
        Raw response text from Claude (not parsed — used directly for embedding).

    Raises:
        Exception: On Anthropic API failure. Caught by asyncio.gather in caller.
    """
    system_prompt = _build_ssr_system_prompt(persona)
    user_prompt = _build_ssr_user_prompt(stimulus, stimulus_type)

    response = await client.messages.create(
        model=_ELICITATION_MODEL,
        max_tokens=_ELICITATION_MAX_TOKENS,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return response.content[0].text
```

See [stimulus-presentation.md](../pipeline/stimulus-presentation.md) for `_build_ssr_system_prompt()`.
See [response-elicitation.md](../pipeline/response-elicitation.md) for `_build_ssr_user_prompt()`.

---

## 7. Batch Embedding: `embed_texts()`

```python
# In api.py

async def embed_texts(client: AsyncOpenAI, texts: list[str]) -> list[np.ndarray]:
    """Embed a batch of texts using OpenAI text-embedding-3-small.

    All texts are submitted in a single API call for efficiency.
    Returns one 1536-dimensional float32 numpy array per input, in input order.

    Args:
        client: AsyncOpenAI client initialized with tool_ctx.openai_api_key.
        texts: List of strings to embed. Typical SSR responses are 50–300 tokens.

    Returns:
        List of np.ndarray shape (1536,), dtype float32, in input order.

    Raises:
        ToolError: On OpenAI API failure (network error, auth, rate limit).
    """
    try:
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=texts,
            encoding_format="float",
        )
    except Exception as exc:
        raise ToolError(f"Embedding API call failed: {exc}") from exc

    sorted_data = sorted(response.data, key=lambda x: x.index)
    return [np.array(item.embedding, dtype=np.float32) for item in sorted_data]
```

---

## 8. Concurrency Design

### Execution Structure

```
ssr_panel_run() [tool handler]
└── api.run_ssr_pipeline() [orchestrator]
    ├── asyncio.gather(*[_elicit_persona_response(p) for p in personas])
    │   # All N personas run in parallel — wall time = max individual latency
    │   # Typical: 2–5 seconds for 5–50 personas
    │
    ├── embed_texts(all_N_responses)       [1 OpenAI API call, batch of N texts]
    │   # ~100–300 ms
    │
    └── score_against_anchors(embedding_i, anchor_set_j) × (N personas × D dimensions)
        # Pure NumPy, synchronous — <5 ms total for 50 × 10 = 500 operations
```

### Timing Estimates

| Panel Size | Elicitation (parallel) | Embedding (batch) | Scoring (sync) | Total |
|-----------|----------------------|-------------------|----------------|-------|
| 5 personas, 3 dims | 2–4 s | 100–200 ms | <1 ms | 2–4 s |
| 20 personas, 3 dims | 2–5 s | 100–300 ms | <2 ms | 2–5 s |
| 50 personas, 10 dims | 3–8 s | 150–400 ms | <5 ms | 3–8 s |

### Partial Failure Handling

`asyncio.gather(*tasks, return_exceptions=True)` isolates individual persona failures. The minimum threshold is **50% of panel personas**:

- If ≥50% respond: proceed with successful subset, `personas_scored < panel_size`
- If <50% respond: raise `ToolError`, mark run as `"failed"` in DB

The 50% threshold (not the 80% from the w1-ssr-primitives stub) is used because the embedding and scoring steps are robust — even a 12-persona subset from a 20-persona panel produces meaningful distributions. Statistical reliability degrades below 10 personas; the 50% threshold on a 20-persona default panel means a minimum of 10 personas always scored.

### No Semaphore on First Version

Haiku's concurrent call limits are sufficient for 50 parallel calls. If rate-limit errors appear in production, wrap each `_elicit_persona_response` with `asyncio.Semaphore(20)`.

---

## 9. Validation Rules

| Rule | Where Enforced | Error Text |
|------|---------------|------------|
| `db_context` is not None | Tool handler first line | `"Database context required for SSR panel tools."` |
| Panel exists and owned by user | Handler after DB load | `"Panel '{id}' not found. Use ssr_panel_list to see your available panels."` |
| Panel status in ('ready', 'partial') | Handler after ownership check | `"Panel '{id}' has status '{status}' and cannot be run. Only panels with status 'ready' or 'partial' can be used for runs."` |
| Panel has personas | Handler after persona load | `"Panel '{id}' has no personas. This may indicate a corrupted panel. Please create a new panel."` |
| All dimensions have anchor embeddings | Handler after anchor load | `"Missing anchor embeddings for dimensions: {list}. The database may need to be re-seeded..."` |
| `stimulus` min length 1 | Pydantic `min_length=1` | Pydantic default |
| `stimulus` max length 4000 | Pydantic `max_length=4000` | Pydantic default |
| `evaluation_dimensions` min 1 | Pydantic `min_length=1` on list | Pydantic default |
| `evaluation_dimensions` max 10 | Pydantic `max_length=10` on list | Pydantic default |
| `stimulus_type` valid enum value | Pydantic enum validation | Pydantic default |
| `evaluation_dimensions` valid enum values | Pydantic enum validation | Pydantic default |
| `run_label` max 120 chars | Pydantic `max_length=120` | Pydantic default |
| ≥50% personas respond | `api.run_ssr_pipeline()` | `"Panel run failed: only N of M personas produced responses before an error occurred. Please try again."` |

---

## 10. Error Cases

| Scenario | Error Type | Message |
|----------|-----------|---------|
| `db_context` is `None` | `ToolError` | `"Database context required for SSR panel tools."` |
| Panel not found or wrong owner | `ToolError` | `"Panel '{id}' not found. Use ssr_panel_list to see your available panels."` |
| Panel status is `'generating'` | `ToolError` | `"Panel '{id}' has status 'generating' and cannot be run. The panel may still be generating personas."` |
| Panel status is `'failed'` | `ToolError` | `"Panel '{id}' has status 'failed' and cannot be run. Please create a new panel."` |
| Panel has no personas | `ToolError` | `"Panel '{id}' has no personas. This may indicate a corrupted panel. Please create a new panel."` |
| Missing anchor embeddings | `ToolError` | `"Missing anchor embeddings for dimensions: ['uniqueness']. The database may need to be re-seeded with anchor embeddings. Contact an admin to run: python -m scripts.seed_anchor_embeddings"` |
| `stimulus` empty string | `ToolError` (Pydantic) | Pydantic `min_length=1` message |
| `stimulus` > 4000 chars | `ToolError` (Pydantic) | Pydantic `max_length=4000` message |
| `stimulus_type` invalid value | `ToolError` (Pydantic) | Pydantic enum error listing valid values |
| `evaluation_dimensions` empty | `ToolError` (Pydantic) | Pydantic `min_length=1` message |
| `evaluation_dimensions` > 10 | `ToolError` (Pydantic) | Pydantic `max_length=10` message |
| `evaluation_dimensions` has invalid value | `ToolError` (Pydantic) | Pydantic enum error listing valid values |
| <50% personas respond | `ToolError` (pipeline) | `"Panel run failed: only N of M personas produced responses before an error occurred. Please try again."` |
| OpenAI embedding call fails | `ToolError` (embed_texts) | `"Embedding API call failed: {details}"` |
| Unexpected exception in pipeline | `ToolError` (handler catch) | `"Panel run failed unexpectedly: {exc}. The run has been marked as failed (run_id='{id}'). Please try again."` |

---

## 11. DB Operations

### Reads (before pipeline)

```python
# Load panel to verify ownership and status
panel = ssr_panels_repo.get_by_id(session, panel_id)
# SQL: SELECT * FROM ssr_panel WHERE id = $1

# Load all personas for the panel
personas = ssr_personas_repo.list_by_panel(session, panel_id)
# SQL: SELECT * FROM ssr_persona WHERE panel_id = $1 ORDER BY panel_index ASC

# Load pre-embedded anchors for requested dimensions
anchor_sets = ssr_anchors_repo.get_by_dimensions(session, dimension_names)
# SQL: SELECT * FROM ssr_anchor WHERE dimension = ANY($1)
```

### Writes (surrounding pipeline)

```python
# At start: create run record with status='running'
ssr_runs_repo.create(session, run_id, panel_id, stimulus, stimulus_type, dimensions, run_label, "running")
# SQL: INSERT INTO ssr_run (id, panel_id, stimulus, stimulus_type, dimensions, run_label, status, created_at)

# After pipeline: bulk insert N response texts
ssr_responses_repo.bulk_create(session, run_id, persona_responses)
# SQL: INSERT INTO ssr_response (id, run_id, persona_id, response_text) VALUES (...) [N rows]

# After pipeline: bulk insert N×D scores
ssr_scores_repo.bulk_create(session, run_id, persona_responses)
# SQL: INSERT INTO ssr_score (id, run_id, persona_id, dimension, hard_score, weighted_score) VALUES (...) [N×D rows]

# Final: update run to completed with summary stats
ssr_runs_repo.update_status(session, run_id, "completed", personas_scored=N, dimension_means={...})
# SQL: UPDATE ssr_run SET status='completed', personas_scored=$1, dimension_means=$2, completed_at=NOW() WHERE id=$3
```

---

## 12. Repository Functions Required

### `db/repositories/ssr_panels.py`

```python
def get_by_id(session: Session, panel_id: str) -> SsrPanelRow | None:
    """Fetch panel by ID. Returns None if not found."""
```

### `db/repositories/ssr_personas.py`

```python
def list_by_panel(session: Session, panel_id: str) -> list[SsrPersonaSummary]:
    """All personas for a panel, ordered by panel_index ascending."""
```

### `db/repositories/ssr_anchors.py` (new file)

```python
def get_by_dimensions(
    session: Session,
    dimensions: list[str],
) -> dict[str, AnchorSet]:
    """Load pre-embedded anchor sets for the given dimension names.

    Returns a dict mapping dimension name → AnchorSet. Missing dimensions
    are absent from the dict — caller checks for missing keys.

    SQL:
        SELECT id, dimension, scale_points, anchor_point, anchor_statement, embedding, embedding_model
        FROM ssr_anchor
        WHERE dimension = ANY($1)
        ORDER BY dimension, anchor_point
    """
```

### `db/repositories/ssr_runs.py` (new file)

```python
def create(
    session: Session,
    run_id: str,
    panel_id: str,
    stimulus: str,
    stimulus_type: str,
    dimensions: list[str],
    run_label: str,
    status: str,
) -> None:
    """Insert ssr_run row with status='running'.

    SQL:
        INSERT INTO ssr_run (id, panel_id, stimulus, stimulus_type, dimensions, run_label, status, created_at)
        VALUES ($1, $2, $3, $4, $5::TEXT[], $6, $7, NOW())
    """

def update_status(
    session: Session,
    run_id: str,
    status: str,
    personas_scored: int | None = None,
    dimension_means: dict[str, float] | None = None,
) -> None:
    """Update run status. On 'completed', also sets personas_scored, dimension_means, completed_at.

    SQL (completion):
        UPDATE ssr_run
        SET status='completed', personas_scored=$2, dimension_means=$3::JSONB, completed_at=NOW()
        WHERE id=$1
    SQL (failure):
        UPDATE ssr_run SET status='failed', completed_at=NOW() WHERE id=$1
    """

def get_by_id(session: Session, run_id: str) -> SsrRunRow | None:
    """Fetch run by ID. Used by ssr_panel_results."""

def list_by_panel(session: Session, panel_id: str) -> list[SsrRunRow]:
    """All runs for a panel, ordered by created_at DESC. Used by ssr_panel_results."""
```

### `db/repositories/ssr_responses.py` (new file)

```python
def bulk_create(
    session: Session,
    run_id: str,
    responses: list[PersonaResponse],
) -> None:
    """Bulk-insert one ssr_response row per PersonaResponse.

    SQL:
        INSERT INTO ssr_response (id, run_id, persona_id, response_text, created_at)
        VALUES ($1, $2, $3, $4, NOW()), ... [N rows in one statement]
    """

def list_by_run(session: Session, run_id: str) -> list[SsrResponseRow]:
    """All responses for a run. Used by ssr_panel_results."""
```

### `db/repositories/ssr_scores.py` (new file)

```python
def bulk_create(
    session: Session,
    run_id: str,
    responses: list[PersonaResponse],
) -> None:
    """Bulk-insert N×D ssr_score rows (one per persona × dimension).

    SQL:
        INSERT INTO ssr_score (id, run_id, persona_id, dimension, hard_score, weighted_score, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW()), ... [N×D rows in one statement]
    """

def list_by_run(session: Session, run_id: str) -> list[SsrScoreRow]:
    """All scores for a run. Used by ssr_panel_results."""
```

---

## 13. Internal Models (in `models.py`)

```python
# apps/bot/src_v2/mcp/tools/ssr/models.py — additions for ssr_panel_run

from dataclasses import dataclass, field


@dataclass
class DimensionScore:
    """Scores for one persona on one evaluation dimension."""
    hard_score: int
    # The Likert point (1–5) of the single closest anchor by argmax cosine similarity.
    # Used for distribution counting and mode calculation.
    weighted_score: float
    # Softmax-weighted mean over anchor cosine similarities (float in [1.0, 5.0]).
    # Used for panel mean and standard deviation calculations.
    similarities: dict[int, float]
    # Raw cosine similarity per anchor point, e.g. {1: 0.32, 2: 0.41, 3: 0.59, 4: 0.78, 5: 0.65}.
    # Diagnostic only — not stored in DB.


@dataclass
class PersonaResponse:
    """One persona's elicited response and all dimension scores from a single run."""
    persona_id: str              # UUID from SsrPersonaSummary
    persona_name: str            # Full name (e.g. "Maria Santos")
    response_text: str           # Raw free-text response from Claude Haiku
    dimension_scores: dict[str, DimensionScore]  # dimension_name → DimensionScore


@dataclass
class HighlightQuote:
    """A representative quote selected as a qualitative highlight."""
    persona_name: str            # Full name of the persona
    persona_id: str              # UUID for cross-reference
    quote: str                   # Excerpt of the response text (≤200 chars)
    valence: str                 # "positive", "negative", or "neutral"
    weighted_score: float        # The persona's weighted_score for this dimension


@dataclass
class AggregatedDimensionResult:
    """Aggregated scoring results for one dimension across all personas in a run."""
    dimension: EvaluationDimension
    distribution: dict[int, int]
    # {1: count, 2: count, 3: count, 4: count, 5: count}
    # Counts are based on hard_score (argmax). Sum equals personas_scored.
    mean: float
    # Mean of weighted_score values across all personas. Range: [1.0, 5.0].
    std_dev: float
    # Standard deviation of weighted_score values. Lower = more consensus.
    mode: int
    # Most frequent hard_score (1–5). If tie, lowest-scoring mode wins.
    confidence_interval_95: tuple[float, float]
    # (lower, upper) 95% CI using t-distribution: mean ± t_0.025(n-1) × (std_dev / sqrt(n)).
    # For n≥30, t_0.025 ≈ 1.96. For n=20, t_0.025 ≈ 2.093. For n=10, t_0.025 ≈ 2.262.
    highlights: list[HighlightQuote]
    # Up to 6 highlights: top 3 positive (highest weighted_score), top 3 negative
    # (lowest weighted_score). Neutral (closest to mean) added if n_highlights > 6.
    # In summary format, only the first 2 are shown.


@dataclass
class PanelRunResult:
    """Complete result of a run_ssr_pipeline() call."""
    run_id: str
    panel_id: str
    persona_responses: list[PersonaResponse]   # All successful persona responses
    aggregated_dimensions: list[AggregatedDimensionResult]  # One per dimension
    personas_scored: int
    # Actual personas scored — may be < panel_size if some elicitations failed.


@dataclass
class AnchorPoint:
    """One pre-embedded anchor statement at a Likert point."""
    point: int                   # 1, 2, 3, 4, or 5
    statement: str               # The anchor statement text
    embedding: list[float]       # Pre-embedded 1536-dim vector from text-embedding-3-small


@dataclass
class AnchorSet:
    """Full anchor set for one evaluation dimension, loaded from DB."""
    dimension: str               # e.g. "purchase_intent"
    scale: int                   # 5 (all current dimensions use 5-point scale)
    anchors: dict[int, AnchorPoint]  # {1: AnchorPoint, ..., 5: AnchorPoint}
    embedding_model: str         # "text-embedding-3-small" — for version checks
```

---

## 14. Cross-References

- [stimulus-presentation.md](../pipeline/stimulus-presentation.md) — `_build_ssr_system_prompt()`: persona inhabitation system prompt, token counts
- [response-elicitation.md](../pipeline/response-elicitation.md) — `_build_ssr_user_prompt()`: stimulus framing and elicitation user prompt
- [scoring-aggregation.md](../pipeline/scoring-aggregation.md) — `score_against_anchors()`, `_aggregate_scores()`, `_select_highlights()`, CI calculation
- [anchor-statements.md](../pipeline/anchor-statements.md) — The 5 anchor statements per dimension for all 10 EvaluationDimension values
- [panel-create.md](panel-create.md) — Prerequisite: panel must be created before running
- [panel-results.md](panel-results.md) — Retrieves and re-formats results by run_id; comparison mode
- [panel-manage.md](panel-manage.md) — `ssr_panel_list`: lists available panels for a user
- [supabase-schema.md](../data-model/supabase-schema.md) — `ssr_run`, `ssr_response`, `ssr_score`, `ssr_anchor` table DDL
- [pydantic-models.md](../data-model/pydantic-models.md) — Full Pydantic v2 model definitions for all types
- [embedding-options.md](../existing-patterns/embedding-options.md) — `embed_texts()` and `score_against_anchors()` implementations; OpenAI integration details
- [tool-system.md](../existing-patterns/tool-system.md) — `@tool` decorator, `ToolError`, context objects, XML output helpers
