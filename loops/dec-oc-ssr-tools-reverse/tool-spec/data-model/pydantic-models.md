# SSR Consumer Panel — Python Type Definitions (Pydantic v2)

> Status: Complete (w2-pydantic-models).
> Cross-references: [supabase-schema.md](supabase-schema.md) · [migration.sql](migration.sql) · [panel-create.md](../tools/panel-create.md) · [panel-run.md](../tools/panel-run.md) · [panel-results.md](../tools/panel-results.md) · [panel-manage.md](../tools/panel-manage.md) · [scoring-aggregation.md](../pipeline/scoring-aggregation.md) · [anchor-statements.md](../pipeline/anchor-statements.md) · [tool-system.md](../existing-patterns/tool-system.md)

---

## Overview

All Python type definitions for the SSR consumer panel system live in one file:

**`apps/bot/src_v2/mcp/tools/ssr/models.py`**

This file contains:
1. **Enums** — `StimulusType`, `EvaluationDimension`, `ResponseFormat`
2. **Pydantic v2 Input Models** — tool parameter models, validated before handlers run
3. **Pipeline Dataclasses** — internal intermediate types used in `api.py`
4. **DB Row Dataclasses** — returned by repository functions (one per table row)
5. **Output/Summary Dataclasses** — for `ssr_panel_list`, `ssr_panel_delete`

### Module-Level Imports

```python
# apps/bot/src_v2/mcp/tools/ssr/models.py

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, model_validator
```

### Design Decisions

**Pydantic for inputs, dataclasses for internals**: Tool parameter models (`PanelCreateInput`, `PanelRunInput`, `PanelResultsInput`, etc.) are Pydantic v2 `BaseModel` subclasses because Daimon's MCP registry deserializes tool parameters using Pydantic. Internal pipeline types (`PersonaResponse`, `AggregatedDimensionResult`, etc.) and DB row types (`SsrRunRecord`, `SsrScoreRecord`, etc.) are plain `@dataclass` because they are never deserialized from JSON and do not need Pydantic's validation overhead.

**Enums as `str, Enum`**: All enums inherit from `(str, Enum)` so they are JSON-serializable and work naturally in Pydantic v2 fields without `use_enum_values=True`.

**All models in one file**: Avoids circular imports across the `ssr/` package. `tools.py`, `api.py`, and `db/repositories/ssr_*.py` all import from `models.py`.

---

## Section 1: Enums

### 1.1 `StimulusType`

Category of marketing asset being tested. Shapes how the stimulus is presented to personas. Used as `PanelRunInput.stimulus_type`, stored as `ssr_run.stimulus_type TEXT`.

```python
class StimulusType(str, Enum):
    """Category of marketing asset being tested. Shapes the presentation prompt."""

    AD_COPY = "ad_copy"
    # Full display or video advertisement body copy. Multi-sentence.
    # Examples: print ad text, digital banner copy, video script excerpt.
    # Presentation label in prompt: "advertisement"

    HEADLINE = "headline"
    # Advertising headline or title. Typically 3–12 words.
    # Examples: "The Coffee That Never Quits", "Your Morning, Upgraded."
    # Presentation label in prompt: "advertising headline"

    TAGLINE = "tagline"
    # Brand tagline or slogan. Typically 2–8 words.
    # Examples: "Just Do It", "I'm Lovin' It", "Think Different."
    # Presentation label in prompt: "brand tagline"

    PRODUCT_CONCEPT = "product_concept"
    # Product or service idea description. Can be 1–3 paragraphs explaining
    # what the product is, what problem it solves, key features.
    # Presentation label in prompt: "product concept"

    BRAND_MESSAGE = "brand_message"
    # Brand positioning or values statement.
    # Examples: "Our brand stands for accessibility, quality, and family."
    # Presentation label in prompt: "brand message"

    CAMPAIGN_THEME = "campaign_theme"
    # Campaign creative direction or theme description.
    # Examples: "A campaign about Filipino mothers building businesses while raising families."
    # Presentation label in prompt: "campaign theme"

    INFLUENCER_PITCH = "influencer_pitch"
    # Pitch for an influencer partnership — content the influencer would post,
    # or the influencer's profile + brand match description.
    # Presentation label in prompt: "influencer content"

    PRICING_MESSAGE = "pricing_message"
    # Price offer, value proposition, or pricing communication.
    # Examples: "₱99/month for the whole family", "Buy 2 get 1 free."
    # Presentation label in prompt: "pricing offer"

    PACKAGING_DESCRIPTION = "packaging_description"
    # Textual/visual description of packaging. Describe colors, imagery,
    # text, feel, shelf presence — since visuals cannot be shown.
    # Presentation label in prompt: "product packaging"

    SOCIAL_CAPTION = "social_caption"
    # Social media post caption (Instagram, Facebook, TikTok).
    # Include hashtags and emoji if part of the post.
    # Presentation label in prompt: "social media post"
```

**Presentation label mapping** (used in `_build_ssr_user_prompt()` in `api.py`):

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

---

### 1.2 `EvaluationDimension`

Available evaluation dimensions for SSR scoring. Each dimension maps to a pre-embedded anchor set in `ssr_anchor_set`. Used in `PanelRunInput.evaluation_dimensions`, stored in `ssr_run.evaluation_dimensions TEXT[]` and `ssr_score.dimension TEXT`.

```python
class EvaluationDimension(str, Enum):
    """Evaluation dimensions available for SSR scoring. Each maps to a pre-embedded anchor set."""

    PURCHASE_INTENT = "purchase_intent"
    # Likelihood to buy, try, subscribe to, or engage with the product/service.
    # Scale: 1 (no interest) → 5 (would buy immediately)
    # Use for: ad copy, product concepts, pricing messages, social captions

    BRAND_FAVORABILITY = "brand_favorability"
    # Overall impression of the brand based on the marketing asset.
    # Scale: 1 (negative impression) → 5 (very positive impression)
    # Use for: brand messages, campaign themes, taglines, influencer pitches

    MESSAGE_CLARITY = "message_clarity"
    # How well the persona understood what was being communicated.
    # Scale: 1 (completely unclear) → 5 (immediately understood)
    # Use for: all stimulus types, especially ad copy and product concepts

    EMOTIONAL_RESPONSE = "emotional_response"
    # Strength of positive emotional engagement with the asset.
    # Scale: 1 (no emotional reaction) → 5 (genuinely excited and moved)
    # Use for: campaign themes, brand messages, social captions

    PERSONAL_RELEVANCE = "personal_relevance"
    # How relevant the asset is to the persona's life, needs, and circumstances.
    # Scale: 1 (not relevant at all) → 5 (directly relevant right now)
    # Use for: product concepts, influencer pitches, pricing messages

    UNIQUENESS = "uniqueness"
    # Perceived distinctiveness — how different it feels from alternatives.
    # Scale: 1 (completely generic) → 5 (never seen anything like it)
    # Use for: taglines, campaign themes, product concepts

    TRUST_CREDIBILITY = "trust_credibility"
    # Believability of the claims or authenticity of the communication.
    # Scale: 1 (feels dishonest/too good to be true) → 5 (completely credible)
    # Use for: pricing messages, product concepts, influencer pitches

    VALUE_PERCEPTION = "value_perception"
    # Perceived value relative to price or perceived product worthiness.
    # Scale: 1 (overpriced/not worth it) → 5 (excellent value)
    # Use for: pricing messages, product concepts, packaging descriptions

    SHARE_WORTHINESS = "share_worthiness"
    # Likelihood to share, recommend, or forward to others.
    # Scale: 1 (would never share) → 5 (would share immediately)
    # Use for: social captions, ad copy, campaign themes

    OVERALL_APPEAL = "overall_appeal"
    # General attractiveness and likeability of the marketing asset.
    # Scale: 1 (unappealing, would ignore) → 5 (love it, would catch attention)
    # Use for: any stimulus type; good default for initial testing
```

---

### 1.3 `ResponseFormat`

Output verbosity level for `ssr_panel_run` and `ssr_panel_results` results. Controls how much detail is included in the returned XML.

```python
class ResponseFormat(str, Enum):
    """Output verbosity level for panel run results."""

    SUMMARY = "summary"
    # Per-dimension: mean, mode, compact distribution (e.g. "1:1 2:2 3:5 4:8 5:4"),
    # top 2 qualitative highlights (1 most positive, 1 most negative).
    # Optimized for Discord display — fits in a single readable message.
    # Use for: initial testing, sharing results in chat

    DETAILED = "detailed"
    # Per-dimension: mean, mode, std dev, 95% confidence interval, full distribution,
    # top 3 positive highlights, top 3 negative highlights, 2 neutral highlights.
    # May generate long output — best used in Discord threads.
    # Use for: deep analysis, presenting to stakeholders

    RAW = "raw"
    # Full per-persona breakdown: each persona's name, response text excerpt
    # (first 200 chars), and all dimension scores. Includes aggregated stats.
    # Very long output — thread required.
    # Use for: reading individual responses, offline analysis
    # Note: in comparison mode (ssr_panel_results with comparison_run_id),
    # RAW falls back to DETAILED — per-persona data is not meaningful across two runs.
```

---

## Section 2: Pydantic v2 Input Models

Input models are Pydantic v2 `BaseModel` subclasses. They are the `params` argument to each tool handler. Daimon's `@tool` decorator deserializes tool input arguments into the model automatically.

### 2.1 `PersonaDemographics`

Demographic constraints for a consumer panel. All fields define bounds — each generated persona falls within these constraints.

```python
class PersonaDemographics(BaseModel):
    """Demographic constraints for a consumer panel. All fields are bounds — personas fall within them."""

    age_min: int = Field(
        ge=18,
        le=99,
        description="Minimum age of panel members (inclusive). Must be 18 or older.",
    )
    age_max: int = Field(
        ge=18,
        le=99,
        description="Maximum age of panel members (inclusive). Must be >= age_min.",
    )
    genders: list[Literal["male", "female", "nonbinary"]] | None = Field(
        default=None,
        description=(
            "Allowed genders. Omit or pass null for any gender. "
            "Pass ['male', 'female'] to exclude nonbinary personas. "
            "Must not be an empty list."
        ),
    )
    locations: list[str] | None = Field(
        default=None,
        description=(
            "Countries, regions, or cities where personas live "
            "(e.g. ['Philippines', 'Indonesia'], ['Manila', 'Cebu'], ['Southeast Asia']). "
            "Omit for any location. The LLM interprets these naturally — "
            "use plain English place names."
        ),
    )
    income_brackets: list[Literal["low", "lower_middle", "middle", "upper_middle", "high"]] | None = Field(
        default=None,
        description=(
            "Allowed income brackets. Omit for any income level. "
            "Brackets are relative to the persona's country: "
            "'low' = below 20th percentile, 'lower_middle' = 20th–40th percentile, "
            "'middle' = 40th–60th percentile, 'upper_middle' = 60th–80th percentile, "
            "'high' = top 20%. Must not be an empty list."
        ),
    )
    education_levels: list[Literal["high_school", "some_college", "bachelors", "graduate", "postgraduate"]] | None = Field(
        default=None,
        description=(
            "Allowed highest completed education levels. Omit for any education level. "
            "Values: 'high_school', 'some_college', 'bachelors', 'graduate' (master's), "
            "'postgraduate' (PhD). Must not be an empty list."
        ),
    )
    languages: list[str] = Field(
        default=["English"],
        description=(
            "Primary languages personas use. Used to shape communication style and "
            "cultural framing. Personas may be multilingual but will respond "
            "conceptually in these languages. Default: ['English']."
        ),
    )

    @model_validator(mode="after")
    def validate_age_range(self) -> "PersonaDemographics":
        """age_max must be >= age_min."""
        if self.age_max < self.age_min:
            raise ValueError(
                f"age_max ({self.age_max}) must be >= age_min ({self.age_min})"
            )
        return self

    @model_validator(mode="after")
    def validate_non_empty_lists(self) -> "PersonaDemographics":
        """None is allowed (any value); empty list [] is not."""
        if self.genders is not None and len(self.genders) == 0:
            raise ValueError("genders must not be an empty list — pass null for any gender")
        if self.income_brackets is not None and len(self.income_brackets) == 0:
            raise ValueError("income_brackets must not be an empty list — pass null for any income level")
        if self.education_levels is not None and len(self.education_levels) == 0:
            raise ValueError("education_levels must not be an empty list — pass null for any education level")
        return self
```

**DB serialization**: Stored as `ssr_panel.demographics JSONB` via `demographics.model_dump()`. All keys present even when `None`.

---

### 2.2 `PersonaPsychographics`

Optional psychographic context for persona generation. Provides personality texture beyond demographics. All fields are lists-or-None.

```python
class PersonaPsychographics(BaseModel):
    """Optional psychographic context for persona generation."""

    interests: list[str] | None = Field(
        default=None,
        description=(
            "Hobbies, activities, or interest areas "
            "(e.g. ['cooking', 'K-drama', 'budget travel', 'church activities']). "
            "Not all personas need all interests — used to provide texture."
        ),
    )
    values: list[str] | None = Field(
        default=None,
        description=(
            "Core values or worldview descriptors "
            "(e.g. ['family-first', 'frugality', 'brand loyalty', 'environmental consciousness']). "
            "Shapes persona decision-making styles."
        ),
    )
    lifestyle_descriptors: list[str] | None = Field(
        default=None,
        description=(
            "Lifestyle context phrases "
            "(e.g. ['busy working mom', 'health-conscious', 'urban professional', "
            "'traditional household', 'community-oriented']). "
            "Free-text — the LLM interprets these naturally."
        ),
    )
    media_consumption: list[str] | None = Field(
        default=None,
        description=(
            "Media habits descriptors "
            "(e.g. ['heavy Facebook user', 'watches noontime TV', 'podcast listener', "
            "'avoids social media', 'YouTube cooking channels']). "
            "Shapes how personas encounter and respond to marketing."
        ),
    )
```

**DB serialization**: Stored as `ssr_panel.psychographics JSONB` via `psychographics.model_dump()`, or `NULL` if omitted.

---

### 2.3 `PanelCreateInput`

Input model for `ssr_panel_create`. Validated by Pydantic before the tool handler runs.

```python
class PanelCreateInput(BaseModel):
    """Input for ssr_panel_create."""

    panel_name: str | None = Field(
        default=None,
        max_length=120,
        description=(
            "Optional human-readable label for this panel "
            "(e.g. 'Filipino Moms 30-45', 'Gen Z Gamers'). "
            "If omitted, a name is auto-generated from the demographics."
        ),
    )
    demographics: PersonaDemographics = Field(
        description=(
            "Demographic constraints for the consumer panel. "
            "All generated personas will fall within these bounds."
        ),
    )
    psychographics: PersonaPsychographics | None = Field(
        default=None,
        description=(
            "Optional psychographic context (interests, values, lifestyle, media habits). "
            "Provides personality texture beyond demographics. Omit for a more diverse panel."
        ),
    )
    product_category: str = Field(
        min_length=1,
        max_length=200,
        description=(
            "The product or service category this panel is being built for "
            "(e.g. 'skincare', 'fast food', 'personal finance apps', "
            "'athletic footwear', 'Filipino street food'). "
            "Shapes each persona's category attitudes and purchase history."
        ),
    )
    panel_size: int = Field(
        default=20,
        ge=5,
        le=50,
        description=(
            "Number of synthetic consumer personas to generate (5–50). "
            "Default 20. Larger panels give more reliable distributions "
            "but cost more and take longer (~3s per persona)."
        ),
    )
    custom_persona_instructions: str | None = Field(
        default=None,
        max_length=1000,
        description=(
            "Additional free-text instructions for persona generation "
            "(e.g. 'Personas should be practicing Catholics', "
            "'Include a mix of urban and rural respondents', "
            "'All personas should be first-time homebuyers'). "
            "Appended verbatim to each persona generation prompt."
        ),
    )
```

**Validation summary**:

| Field | Constraint | Error |
|-------|-----------|-------|
| `panel_name` | max 120 chars, optional | Pydantic max_length |
| `demographics.age_min` | 18–99 | Pydantic ge/le |
| `demographics.age_max` | 18–99, >= age_min | Pydantic + @model_validator |
| `demographics.genders` | None or non-empty list | @model_validator |
| `demographics.income_brackets` | None or non-empty list | @model_validator |
| `demographics.education_levels` | None or non-empty list | @model_validator |
| `product_category` | 1–200 chars | Pydantic min/max_length |
| `panel_size` | 5–50 | Pydantic ge/le |
| `custom_persona_instructions` | max 1000 chars, optional | Pydantic max_length |

---

### 2.4 `PanelRunInput`

Input model for `ssr_panel_run`. Validated by Pydantic before the tool handler runs.

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
        default=[
            EvaluationDimension.PURCHASE_INTENT,
            EvaluationDimension.MESSAGE_CLARITY,
            EvaluationDimension.OVERALL_APPEAL,
        ],
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

**Validation summary**:

| Field | Constraint | Error |
|-------|-----------|-------|
| `panel_id` | non-empty string | Pydantic default |
| `stimulus` | 1–4000 chars | Pydantic min/max_length |
| `stimulus_type` | valid StimulusType enum value | Pydantic enum validation |
| `evaluation_dimensions` | 1–10 items, each a valid EvaluationDimension | Pydantic + enum validation |
| `response_format` | valid ResponseFormat enum value | Pydantic enum validation |
| `run_label` | max 120 chars, optional | Pydantic max_length |

---

### 2.5 `PanelResultsInput`

Input model for `ssr_panel_results`. Validated by Pydantic before the tool handler runs.

```python
class PanelResultsInput(BaseModel):
    """Input for ssr_panel_results."""

    run_id: str | None = Field(
        default=None,
        description=(
            "UUID of a specific run to retrieve results for. "
            "Provide either run_id or panel_id — at least one is required. "
            "run_id takes precedence over panel_id if both are provided."
        ),
    )
    panel_id: str | None = Field(
        default=None,
        description=(
            "UUID of a panel. When provided without run_id, retrieves the most recent "
            "completed run for that panel. "
            "Provide either run_id or panel_id — at least one is required."
        ),
    )
    response_format: ResponseFormat = Field(
        default=ResponseFormat.SUMMARY,
        description=(
            "Level of detail for results. "
            "'summary': mean, mode, compact distribution, and top 2 qualitative "
            "highlights per dimension — best for Discord display. "
            "'detailed': full distribution, std dev, 95% confidence interval, "
            "top 3 highlights per valence (positive/negative/neutral). "
            "'raw': full per-persona breakdown with response text excerpts and "
            "all dimension scores — for offline analysis. "
            "In comparison mode, 'raw' falls back to 'detailed'."
        ),
    )
    comparison_run_id: str | None = Field(
        default=None,
        description=(
            "UUID of a second run to compare against the primary run. "
            "When provided, returns a side-by-side comparison with per-dimension "
            "deltas (Run B mean − Run A mean) and direction indicators (↑ ↓ →). "
            "Both runs must belong to the requesting user. "
            "Omit for single-run retrieval."
        ),
    )

    @model_validator(mode="after")
    def validate_at_least_one_id(self) -> "PanelResultsInput":
        """At least one of run_id or panel_id must be provided."""
        if self.run_id is None and self.panel_id is None:
            raise ValueError(
                "Provide either run_id (specific run) or panel_id (most recent run). "
                "Both cannot be null."
            )
        return self
```

**Resolution logic** (enforced in the tool handler, not Pydantic):
- If `run_id` is provided: fetch that specific run
- If only `panel_id` is provided: fetch the most recent completed run for that panel
- If both `run_id` and `panel_id` are provided: `run_id` takes precedence
- If `comparison_run_id` is also provided: return comparison output, not single-run

---

### 2.6 `PanelListInput`

Input model for `ssr_panel_list`. Lists all panels owned by the requesting user.

```python
class PanelListInput(BaseModel):
    """Input for ssr_panel_list."""

    limit: int = Field(
        default=10,
        ge=1,
        le=50,
        description=(
            "Maximum number of panels to return (1–50). Default 10. "
            "Panels are ordered by created_at DESC (most recent first)."
        ),
    )
    offset: int = Field(
        default=0,
        ge=0,
        description=(
            "Number of panels to skip before returning results. "
            "Use for pagination. Default 0 (start from the most recent)."
        ),
    )
```

**Validation summary**:

| Field | Constraint | Error |
|-------|-----------|-------|
| `limit` | 1–50 | Pydantic ge/le |
| `offset` | >= 0 | Pydantic ge |

---

### 2.7 `PanelDeleteInput`

Input model for `ssr_panel_delete`. Deletes a panel and all associated data via DB cascade.

```python
class PanelDeleteInput(BaseModel):
    """Input for ssr_panel_delete."""

    panel_id: str = Field(
        description=(
            "UUID of the panel to delete. Must be a panel you own. "
            "All associated data (personas, runs, responses, scores) will be "
            "permanently deleted via cascade. This action cannot be undone."
        ),
    )
```

**Security note**: The tool handler verifies `ssr_panel.discord_id == user_context.discord_id` before deleting. If the panel is not found OR is not owned by the requesting user, the same `ToolError` is raised: `"Panel '{id}' not found."` — the error message does not distinguish between missing and wrong-owner to prevent enumeration.

---

## Section 3: Pipeline Dataclasses

These are the internal intermediate types used within `api.py` during pipeline execution. They are constructed at runtime, never deserialized from JSON. All are plain `@dataclass`.

### 3.1 `SsrPersonaSummary`

Compact persona representation. Built by `_parse_persona_response()` in `api.py` after Claude Haiku generates a persona. Stored in DB via `bulk_create()` and also used as in-memory state throughout the pipeline.

```python
@dataclass
class SsrPersonaSummary:
    """Compact persona representation used in tool output and pipeline state."""

    index: int
    # 1-based position of this persona in the panel (1 through panel_size).
    # Assigned at generation time. Used for deterministic ordering in display.

    persona_id: str
    # UUID assigned at generation time (str(uuid.uuid4())).
    # Used as the PK when inserting into ssr_persona.id.

    name: str
    # Full name generated by Claude (e.g. "Maria Santos", "Liza Reyes").
    # Plain text, no normalization.

    age: int
    # Exact age in years (18–99). Generated within [age_min, age_max].

    location: str
    # City and country of residence as free text (e.g. "Quezon City, Philippines").
    # Not normalized — stored as Claude generated it.

    occupation: str
    # Job title or life situation (e.g. "Elementary School Teacher",
    # "Small Business Owner (Sari-sari Store)"). Free text.

    income_bracket: str
    # One of: 'low' | 'lower_middle' | 'middle' | 'upper_middle' | 'high'
    # Relative to the persona's country. See ssr_persona.income_bracket CHECK constraint.

    education: str
    # One of: 'high_school' | 'some_college' | 'bachelors' | 'graduate' | 'postgraduate'
    # Highest completed education. See ssr_persona.education CHECK constraint.

    summary: str
    # 2–3 sentence human-readable display summary built from BACKGROUND + PRODUCT_CATEGORY_ATTITUDES
    # sections of the Claude response. Used in _fmt_panel_created() XML output.
    # Maximum ~300 characters in practice.

    full_profile: str
    # Complete raw text output from the Claude Haiku persona generation prompt.
    # All labeled sections: NAME:, AGE:, LOCATION:, OCCUPATION:, HOUSEHOLD:,
    # INCOME_BRACKET:, EDUCATION:, BACKGROUND:, VALUES:, LIFESTYLE:,
    # MEDIA_HABITS:, PRODUCT_CATEGORY_ATTITUDES:, VOICE:
    # Used as the system prompt content when _build_ssr_system_prompt() inhabits
    # the persona during a panel run. Typical length: 400–700 characters.
    # Stored as ssr_persona.full_profile TEXT.
```

---

### 3.2 `CreatePanelResult`

Result of `api.create_panel_with_personas()`. Returned to `ssr_panel_create` tool handler.

```python
@dataclass
class CreatePanelResult:
    """Result of create_panel_with_personas()."""

    panel_id: str
    # UUID of the newly created ssr_panel row.

    personas: list[SsrPersonaSummary] = field(default_factory=list)
    # List of successfully generated personas (may be < panel_size on partial failure).
    # Always has len >= ceil(panel_size * 0.5) — otherwise ToolError is raised instead.

    partial: bool = False
    # True if any persona generation failed and len(personas) < panel_size.
    # When True, the panel status is 'partial' (not 'ready').
    # The panel is still usable — run SSR against the actual_size personas.
```

---

### 3.3 `DimensionScore`

Scores for one persona on one evaluation dimension. Created by `score_against_anchors()` in `api.py`. Stored in DB via `ssr_scores_repo.bulk_create()`.

```python
@dataclass
class DimensionScore:
    """Scores for one persona on one evaluation dimension."""

    hard_score: int
    # The Likert point (1–5) of the single closest anchor by argmax cosine similarity.
    # Used for distribution counting (how many personas land at each score)
    # and mode calculation. Range: 1–5 (enforced by CHECK constraint in DB).

    weighted_score: float
    # Softmax-weighted mean over anchor cosine similarities.
    # Range: [1.0, 5.0] by construction — cannot exceed Likert bounds.
    # Used for panel mean, standard deviation, and CI calculations.
    # More nuanced than hard_score — captures semantic position across all anchors.

    similarities: dict[int, float]
    # Raw cosine similarity per anchor point.
    # Example: {1: 0.32, 2: 0.41, 3: 0.59, 4: 0.78, 5: 0.65}
    # Keys are integer Likert points (1–5).
    # Values are in range [-1.0, 1.0], typically [0.2, 0.9] for on-topic texts.
    # Diagnostic only — NOT stored in DB (adds ~240 bytes/row with no query benefit).
```

---

### 3.4 `PersonaResponse`

One persona's elicited response and all dimension scores from a single panel run. Created during `run_ssr_pipeline()` and also reconstructed by `get_run_results()` for retrieval.

```python
@dataclass
class PersonaResponse:
    """One persona's elicited response and all dimension scores from a single run."""

    persona_id: str
    # UUID from SsrPersonaSummary — FK to ssr_persona.id in DB.

    persona_name: str
    # Full name (e.g. "Maria Santos"). Used in qualitative highlights.
    # When reconstructed from DB, taken from ssr_persona.name.

    response_text: str
    # Raw free-text response from Claude Haiku when inhabiting this persona.
    # Not parsed or truncated. Typical length: 150–600 characters.
    # Stored as ssr_response.response_text TEXT.
    # When reconstructed from DB in get_run_results(), loaded from ssr_response.

    dimension_scores: dict[str, DimensionScore]
    # Maps dimension name (EvaluationDimension.value) → DimensionScore.
    # Example: {"purchase_intent": DimensionScore(hard_score=4, weighted_score=3.86, ...)}
    # Only contains dimensions that were evaluated in this run.
    # When reconstructed from DB, similarities will be empty dict {} (not stored).
```

---

### 3.5 `HighlightQuote`

A representative qualitative quote selected from persona responses. Created by `_select_highlights()` in `api.py`. Used in `AggregatedDimensionResult.highlights`.

```python
@dataclass
class HighlightQuote:
    """A representative quote selected as a qualitative highlight for a dimension."""

    persona_name: str
    # Full name of the persona. Displayed in tool output XML.

    persona_id: str
    # UUID for cross-reference to SsrPersonaSummary. Not displayed in output
    # but available for programmatic use.

    quote: str
    # Excerpt of the persona's response text, at most 200 characters.
    # Cut at sentence boundary when possible (see _extract_response_excerpt()).
    # Followed by "..." if truncated.

    valence: str
    # One of: "positive" | "negative" | "neutral"
    # "positive" = this persona had one of the highest weighted_scores for this dimension.
    # "negative" = this persona had one of the lowest weighted_scores.
    # "neutral"  = this persona's weighted_score was closest to the panel mean.

    weighted_score: float
    # The persona's weighted_score for this dimension.
    # Allows the tool formatter to sort highlights by score if needed.
```

---

### 3.6 `AggregatedDimensionResult`

Aggregated scoring results for one dimension across all personas in a run. Created by `_aggregate_scores()` in `api.py`. Stored in `PanelRunResult` and `RetrievedRunResult`.

```python
@dataclass
class AggregatedDimensionResult:
    """Aggregated scoring results for one evaluation dimension across all personas in a run."""

    dimension: EvaluationDimension
    # The evaluation dimension this result corresponds to.
    # Used as the `name` attribute on the <dimension> XML tag in output.

    distribution: dict[int, int]
    # Count of personas at each hard_score point.
    # Always has all 5 keys: {1: count, 2: count, 3: count, 4: count, 5: count}.
    # All counts are non-negative integers. Sum equals personas_scored for this dimension.
    # Example: {1: 1, 2: 2, 3: 4, 4: 9, 5: 4}

    mean: float
    # Mean of weighted_score values across all personas (rounded to 4 decimal places).
    # Range: [1.0, 5.0]. Computed from continuous weighted_score, not hard_score.

    std_dev: float
    # Sample standard deviation of weighted_score values (rounded to 4 decimal places).
    # 0.0 when n=1 (only one persona). Lower = more consensus. Higher = more polarization.
    # Typical values: 0.5–1.2 for real marketing assets.

    mode: int
    # Most frequently occurring hard_score (1–5).
    # If tie, lowest score wins (conservative bias in marketing research).

    confidence_interval_95: tuple[float, float]
    # (lower_bound, upper_bound) 95% confidence interval for the mean.
    # Computed using the t-distribution (appropriate for small samples n=5–50):
    #   CI = [mean - t_0.025(n-1) × (std_dev / sqrt(n)),
    #         mean + t_0.025(n-1) × (std_dev / sqrt(n))]
    # Clipped to [1.0, 5.0]. Both values rounded to 4 decimal places.
    # When n=1: CI = (mean, mean).

    highlights: list[HighlightQuote]
    # Up to 6 qualitative highlights. Selection strategy (see _select_highlights()):
    #   - Top 3 positive: personas with the highest weighted_score
    #   - Top 3 negative: personas with the lowest weighted_score
    #   - Neutral: personas closest to the mean (fills remaining slots)
    # In 'summary' format, only the first 2 are shown. In 'detailed', up to 6.
    # May have fewer than 6 if the panel is small (e.g. n=5 → 2 positive, 2 negative, 1 neutral).
```

---

### 3.7 `PanelRunResult`

Complete result of a `run_ssr_pipeline()` call. Returned from `api.run_ssr_pipeline()` to the `ssr_panel_run` tool handler.

```python
@dataclass
class PanelRunResult:
    """Complete result of a run_ssr_pipeline() call."""

    run_id: str
    # UUID of the ssr_run row created for this pipeline execution.

    panel_id: str
    # UUID of the ssr_panel that was run against.

    persona_responses: list[PersonaResponse]
    # All successful PersonaResponse objects from the pipeline.
    # Length may be < panel.actual_size if some elicitations failed (partial success).
    # Minimum length: ceil(panel.actual_size * 0.5) — otherwise ToolError raised.

    aggregated_dimensions: list[AggregatedDimensionResult]
    # One AggregatedDimensionResult per requested evaluation dimension.
    # Ordered to match the order of PanelRunInput.evaluation_dimensions.

    personas_scored: int
    # Count of personas that successfully completed elicitation, embedding, and scoring.
    # May be < len(persona_responses) if scoring failed for some (rare).
    # Stored in ssr_run.personas_scored on pipeline completion.
```

---

### 3.8 `AnchorPoint`

One pre-embedded anchor statement at a Likert point. Loaded from `ssr_anchor_set` by `ssr_anchors_repo.get_by_dimensions()`.

```python
@dataclass
class AnchorPoint:
    """One pre-embedded anchor statement at a Likert scale point."""

    point: int
    # The Likert scale point this anchor represents: 1, 2, 3, 4, or 5.

    statement: str
    # The anchor statement text (e.g. "I would definitely buy or try this immediately — I'm very interested").
    # Must be a naturalistic first-person English sentence. See anchor-statements.md for all 50.

    embedding: list[float]
    # Pre-computed 1536-dimensional embedding from text-embedding-3-small.
    # Loaded from ssr_anchor_set.anchor_embedding FLOAT8[] as a Python list.
    # Converted to np.ndarray before passing to score_against_anchors():
    #   np.array(anchor_point.embedding, dtype=np.float32)
```

---

### 3.9 `AnchorSet`

Full anchor set for one evaluation dimension, loaded from DB. Used in the scoring stage of `run_ssr_pipeline()`.

```python
@dataclass
class AnchorSet:
    """Full anchor set for one evaluation dimension, loaded from ssr_anchor_set."""

    dimension: str
    # The evaluation dimension name (EvaluationDimension.value), e.g. "purchase_intent".

    scale: int
    # Number of Likert points in this anchor set. Always 5 for current implementation.
    # Future: may support 7-point scale for specific dimensions.

    anchors: dict[int, AnchorPoint]
    # Maps Likert point integer (1–5) → AnchorPoint.
    # Always has all `scale` keys when loaded from DB (checked by anchor loading code).
    # Example: {1: AnchorPoint(point=1, statement="...", embedding=[...]), ..., 5: AnchorPoint(...)}

    embedding_model: str
    # The embedding model used to pre-compute anchor embeddings.
    # Must be "text-embedding-3-small" — verified by run_ssr_pipeline() before scoring:
    #   if anchor_set.embedding_model != "text-embedding-3-small": raise ToolError(...)
    # Prevents silent scoring errors if anchor embeddings were regenerated with a different model.
```

---

### 3.10 `RetrievedRunResult`

DB-reconstructed run results for `ssr_panel_results`. Parallel to `PanelRunResult` (used inline during `ssr_panel_run`) but includes run metadata fields stored in `ssr_run` (run_label, stimulus, stimulus_type, created_at).

```python
@dataclass
class RetrievedRunResult:
    """Results reconstructed from DB for a completed run.

    Used by ssr_panel_results for single-run retrieval and comparison mode.
    Built by api.get_run_results() — not created during ssr_panel_run.
    """

    run_id: str
    # UUID of the ssr_run row. From ssr_run.id.

    panel_id: str
    # UUID of the parent ssr_panel. From ssr_run.panel_id.

    run_label: str
    # Human-readable label for this run. From ssr_run.run_label.
    # Auto-generated as "Run {ISO_TIMESTAMP}" if not provided at creation.

    stimulus: str
    # Full text of the marketing asset that was tested. From ssr_run.stimulus.

    stimulus_type: str
    # StimulusType.value string (e.g. "social_caption"). From ssr_run.stimulus_type.
    # Stored as str (not StimulusType enum) to avoid validation errors on unknown values.

    dimensions: list[str]
    # Ordered list of EvaluationDimension.value strings evaluated in this run.
    # From ssr_run.evaluation_dimensions TEXT[].

    personas_scored: int
    # Count of personas that successfully scored. From ssr_run.personas_scored.

    created_at: datetime
    # UTC timestamp of when the run was created. From ssr_run.created_at.

    aggregated_dimensions: list[AggregatedDimensionResult]
    # Re-aggregated dimension results reconstructed from ssr_score + ssr_response rows.
    # Produced by re-running _aggregate_scores() on the loaded score data.

    persona_responses: list[PersonaResponse]
    # Reconstructed PersonaResponse list. Used in RAW format output.
    # DimensionScore.similarities will be empty dict {} (not stored in DB).
```

---

### 3.11 `DimensionComparison`

Per-dimension comparison data between two runs. Produced by `api.compute_dimension_comparisons()`. Used in `_fmt_comparison_results()`.

```python
@dataclass
class DimensionComparison:
    """Comparison data for one evaluation dimension between two runs.

    Produced by compute_dimension_comparisons() — used in _fmt_comparison_results().
    Only created for dimensions present in BOTH runs.
    """

    dimension: str
    # EvaluationDimension.value string, e.g. "purchase_intent".

    run_a: AggregatedDimensionResult
    # Aggregated results for the primary run (the "baseline").
    # run_a is the run identified by run_id (or latest for panel_id).

    run_b: AggregatedDimensionResult
    # Aggregated results for the comparison run.
    # run_b is the run identified by comparison_run_id.

    delta_mean: float
    # run_b.mean - run_a.mean (positive = B is higher than A).
    # Range: approximately [-4.0, 4.0] on a 5-point scale.
    # Practically meaningful if |delta| > 0.25.
    # Rounded to 4 decimal places.

    delta_direction: str
    # Direction arrow string:
    #   '↑' = B is higher than A (delta > 0.05)
    #   '↓' = B is lower than A (delta < -0.05)
    #   '→' = negligible difference (|delta| <= 0.05)
    # Threshold of 0.05 is within the noise floor of the embedding similarity step.

    significant: bool
    # True if the 95% confidence intervals for run_a and run_b do NOT overlap.
    # Non-overlapping CIs = statistically notable difference for this panel size.
    # Marked with '*' in the formatted comparison output.
    # Computed as: (ci_a_high < ci_b_low) or (ci_b_high < ci_a_low)
```

---

## Section 4: DB Row Dataclasses

These are the return types of repository functions. They mirror the columns of their respective tables. All are plain `@dataclass`. They are never passed to Pydantic for validation.

### 4.1 `SsrPanelRow`

Row from `ssr_panel`. Returned by `ssr_panels_repo.get_by_id()` and `ssr_panels_repo.list_by_discord_id()`.

```python
@dataclass
class SsrPanelRow:
    """Row from the ssr_panel table."""

    id: str                         # UUID PK, as string
    discord_id: str                 # Discord user ID (owner)
    panel_name: str                 # Human-readable panel name
    product_category: str           # Product/service category
    demographics: dict              # Deserialized JSON from JSONB column
    psychographics: dict | None     # Deserialized JSON from JSONB column, or None
    panel_size: int                 # Requested number of personas (5–50)
    actual_size: int | None         # Actual generated personas, None while generating
    custom_instructions: str | None # Free-text persona generation instructions, or None
    status: str                     # 'generating' | 'ready' | 'partial' | 'failed'
    created_at: datetime            # TIMESTAMPTZ, UTC
    updated_at: datetime            # TIMESTAMPTZ, UTC
```

---

### 4.2 `SsrPersonaRow`

Row from `ssr_persona`. Returned by `ssr_personas_repo.list_by_panel()`. The `list_by_panel()` function returns `list[SsrPersonaSummary]` (not `list[SsrPersonaRow]`) — it converts columns to `SsrPersonaSummary` on retrieval since that is the type used everywhere in the pipeline. This row model is documented here for schema completeness.

```python
@dataclass
class SsrPersonaRow:
    """Row from the ssr_persona table. Mirrors DB columns for documentation purposes.

    Note: ssr_personas_repo.list_by_panel() returns list[SsrPersonaSummary], not
    list[SsrPersonaRow]. The repository converts columns to SsrPersonaSummary.
    SsrPersonaRow is not directly used in application code but documents the DB schema.
    """

    id: str              # UUID PK (same as SsrPersonaSummary.persona_id)
    panel_id: str        # FK → ssr_panel.id
    persona_index: int   # 1-based ordinal position in the panel
    name: str            # Full name
    age: int             # Exact age (18–99)
    location: str        # "City, Country" free text
    occupation: str      # Job title or life situation
    income_bracket: str  # 'low' | 'lower_middle' | 'middle' | 'upper_middle' | 'high'
    education: str       # 'high_school' | 'some_college' | 'bachelors' | 'graduate' | 'postgraduate'
    summary: str         # 2–3 sentence display summary
    full_profile: str    # Complete Claude generation output (all labeled sections)
    created_at: datetime # TIMESTAMPTZ, UTC
```

---

### 4.3 `SsrRunRecord`

Row from `ssr_run`. Returned by `ssr_runs_repo.get_by_id()`, `ssr_runs_repo.get_latest_completed_for_panel()`, and `ssr_runs_repo.list_by_panel()`.

```python
@dataclass
class SsrRunRecord:
    """Row from the ssr_run table. Returned by ssr_runs_repo functions."""

    id: str                           # UUID PK, as string
    panel_id: str                     # FK → ssr_panel.id
    discord_id: str                   # Owner's Discord user ID (denormalized from panel)
    run_label: str                    # Human-readable label (auto-generated if not provided)
    stimulus: str                     # Full stimulus text (up to 4000 chars)
    stimulus_type: str                # StimulusType.value string (e.g. "social_caption")
    evaluation_dimensions: list[str]  # List of EvaluationDimension.value strings
    status: str                       # 'pending' | 'running' | 'completed' | 'failed'
    personas_scored: int | None       # None while running, actual count when completed
    dimension_means: dict[str, float] | None  # {dim_name: mean} for quick preview, None until completed
    started_at: datetime | None       # TIMESTAMPTZ when pipeline began, None while pending
    completed_at: datetime | None     # TIMESTAMPTZ when pipeline finished, None until completed/failed
    created_at: datetime              # TIMESTAMPTZ of INSERT, UTC
    updated_at: datetime              # TIMESTAMPTZ of last UPDATE, UTC
```

**Note**: `evaluation_dimensions` is loaded from `ssr_run.evaluation_dimensions TEXT[]` as a Python list of strings. In `get_run_results()`, it is converted to `[EvaluationDimension(d) for d in run.evaluation_dimensions]` before calling `_aggregate_scores()`.

---

### 4.4 `SsrResponseRecord`

Row from `ssr_response`. Returned by `ssr_responses_repo.list_by_run()`.

```python
@dataclass
class SsrResponseRecord:
    """Row from the ssr_response table. One row per persona per run."""

    id: str              # UUID PK, as string
    run_id: str          # FK → ssr_run.id
    persona_id: str      # FK → ssr_persona.id
    response_text: str   # Full free-text response from Claude Haiku (not truncated)
    created_at: datetime # TIMESTAMPTZ of INSERT, UTC
```

---

### 4.5 `SsrScoreRecord`

Row from `ssr_score`. Returned by `ssr_scores_repo.list_by_run()`.

```python
@dataclass
class SsrScoreRecord:
    """Row from the ssr_score table. One row per (persona, dimension) pair per run."""

    id: str              # UUID PK, as string
    response_id: str     # FK → ssr_response.id
    run_id: str          # FK → ssr_run.id (denormalized for fast run-level queries)
    persona_id: str      # FK → ssr_persona.id (denormalized)
    dimension: str       # EvaluationDimension.value string, e.g. "purchase_intent"
    hard_score: int      # Argmax Likert score (1–5)
    weighted_score: float  # Softmax-weighted mean Likert score ([1.0, 5.0])
    similarities: dict   # JSONB: {str(scale_point): cosine_similarity}, e.g. {"1": 0.32, "4": 0.78}
                         # Note: keys are STRINGS (JSONB requires string keys). Convert with int(k).
    response_embedding: list[float] | None  # 1536-dim vector or None if not stored
    created_at: datetime  # TIMESTAMPTZ of INSERT, UTC
```

**Similarity key conversion**: When loading `SsrScoreRecord.similarities` from JSONB, keys are strings (`"1"`, `"2"`, etc.). Convert to int when constructing `DimensionScore`: `{int(k): v for k, v in score_record.similarities.items()}`.

---

### 4.6 `SsrAnchorSetRow`

Row from `ssr_anchor_set`. Not returned directly — `ssr_anchors_repo.get_by_dimensions()` constructs `AnchorSet` objects from multiple rows. Documented here for schema completeness.

```python
@dataclass
class SsrAnchorSetRow:
    """Row from the ssr_anchor_set table. Used internally by ssr_anchors_repo.

    Note: The repository converts these rows into AnchorSet + AnchorPoint objects.
    SsrAnchorSetRow is not directly used in application code but documents the DB schema.
    """

    id: str                        # UUID PK, as string
    dimension_name: str            # EvaluationDimension.value string
    scale_point: int               # Likert point (1–5)
    anchor_text: str               # The anchor statement text
    anchor_embedding: list[float] | None  # 1536-dim pre-computed embedding, or None (not yet seeded)
    created_at: datetime           # TIMESTAMPTZ of INSERT, UTC
```

---

## Section 5: Output/Summary Dataclasses

These types carry output data for `ssr_panel_list` and `ssr_panel_delete`.

### 5.1 `SsrPanelSummary`

Summary of one panel for display in `ssr_panel_list` output. Built by `api.list_panels()` from `ssr_panel` rows with a joined run count.

```python
@dataclass
class SsrPanelSummary:
    """Summary of one panel for display in ssr_panel_list output."""

    panel_id: str
    # UUID of the ssr_panel row.

    panel_name: str
    # Human-readable label (e.g. "Filipino Moms 30-45").

    product_category: str
    # The product/service category (e.g. "fast food").

    status: str
    # Panel status: 'generating' | 'ready' | 'partial' | 'failed'

    actual_size: int | None
    # Number of successfully generated personas. None while status='generating'.

    run_count: int
    # Number of completed runs for this panel. 0 for new panels.
    # Loaded via COUNT(ssr_run.id) in the list query.

    created_at: datetime
    # UTC creation timestamp. Used for display and ordering.
```

---

### 5.2 `SsrDeleteResult`

Result of `api.delete_panel()`. Returned to `ssr_panel_delete` tool handler.

```python
@dataclass
class SsrDeleteResult:
    """Result of api.delete_panel()."""

    panel_id: str
    # UUID of the deleted panel.

    panel_name: str
    # Human-readable name of the deleted panel (stored before delete for confirmation message).

    personas_deleted: int
    # Count of ssr_persona rows deleted (from actual_size or count query).

    runs_deleted: int
    # Count of ssr_run rows deleted.
```

**Note**: Because all cascades happen at the DB level via `ON DELETE CASCADE`, the repository does not issue separate delete statements for child rows. The counts in `SsrDeleteResult` are retrieved from the row counts *before* the delete, via `SELECT COUNT(*) FROM ssr_persona WHERE panel_id = $1` and `SELECT COUNT(*) FROM ssr_run WHERE panel_id = $1`.

---

## Section 6: Complete `models.py` File Structure

The complete file `apps/bot/src_v2/mcp/tools/ssr/models.py` contains all types in this order:

```python
# apps/bot/src_v2/mcp/tools/ssr/models.py

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, model_validator


# ─── Section 1: Enums ────────────────────────────────────────────────────────

class StimulusType(str, Enum): ...          # 10 values — see §1.1
class EvaluationDimension(str, Enum): ...   # 10 values — see §1.2
class ResponseFormat(str, Enum): ...        # 3 values — see §1.3

_STIMULUS_TYPE_LABELS: dict[StimulusType, str] = { ... }  # See §1.1


# ─── Section 2: Pydantic v2 Input Models ────────────────────────────────────

class PersonaDemographics(BaseModel): ...       # §2.1
class PersonaPsychographics(BaseModel): ...     # §2.2
class PanelCreateInput(BaseModel): ...          # §2.3
class PanelRunInput(BaseModel): ...             # §2.4
class PanelResultsInput(BaseModel): ...         # §2.5
class PanelListInput(BaseModel): ...            # §2.6
class PanelDeleteInput(BaseModel): ...          # §2.7


# ─── Section 3: Pipeline Dataclasses ────────────────────────────────────────

@dataclass class SsrPersonaSummary: ...         # §3.1
@dataclass class CreatePanelResult: ...         # §3.2
@dataclass class DimensionScore: ...            # §3.3
@dataclass class PersonaResponse: ...           # §3.4
@dataclass class HighlightQuote: ...            # §3.5
@dataclass class AggregatedDimensionResult: ... # §3.6
@dataclass class PanelRunResult: ...            # §3.7
@dataclass class AnchorPoint: ...               # §3.8
@dataclass class AnchorSet: ...                 # §3.9
@dataclass class RetrievedRunResult: ...        # §3.10
@dataclass class DimensionComparison: ...       # §3.11


# ─── Section 4: DB Row Dataclasses ──────────────────────────────────────────

@dataclass class SsrPanelRow: ...               # §4.1
@dataclass class SsrPersonaRow: ...             # §4.2
@dataclass class SsrRunRecord: ...              # §4.3
@dataclass class SsrResponseRecord: ...         # §4.4
@dataclass class SsrScoreRecord: ...            # §4.5
@dataclass class SsrAnchorSetRow: ...           # §4.6


# ─── Section 5: Output/Summary Dataclasses ──────────────────────────────────

@dataclass class SsrPanelSummary: ...           # §5.1
@dataclass class SsrDeleteResult: ...           # §5.2
```

Total: **7 Pydantic models + 3 enums + 12 dataclasses = 22 types** in one file.

---

## Section 7: Type Dependency Graph

```
PersonaDemographics   ─┐
PersonaPsychographics  ├─→ PanelCreateInput → (tool: ssr_panel_create)
                       └─→ SsrPanelRow (stored as JSONB)

StimulusType          ─┐
EvaluationDimension   ─┤
ResponseFormat        ─┴─→ PanelRunInput → (tool: ssr_panel_run)

EvaluationDimension   ─┬─→ PanelResultsInput → (tool: ssr_panel_results)
ResponseFormat        ─┘

PanelListInput   → (tool: ssr_panel_list)
PanelDeleteInput → (tool: ssr_panel_delete)

SsrPersonaSummary ──────────────────────────→ CreatePanelResult
                                            → PersonaResponse (persona_id, persona_name)

DimensionScore    ─┐
                   └─→ PersonaResponse (dimension_scores)
                        ─→ HighlightQuote (selected by _select_highlights())
                        ─→ AggregatedDimensionResult (aggregated across all PersonaResponse)
                              ─→ PanelRunResult (used inline during ssr_panel_run)
                              ─→ RetrievedRunResult (reconstructed from DB by ssr_panel_results)
                              ─→ DimensionComparison (run_a, run_b comparison)

AnchorPoint ─┐
             └─→ AnchorSet (loaded from ssr_anchor_set by ssr_anchors_repo)
                  ─→ score_against_anchors() → DimensionScore

SsrPanelRow       ← ssr_panels_repo.get_by_id()
SsrPersonaRow     ← ssr_persona columns (converted to SsrPersonaSummary in repo)
SsrRunRecord      ← ssr_runs_repo.get_by_id() / get_latest_completed_for_panel()
SsrResponseRecord ← ssr_responses_repo.list_by_run()
SsrScoreRecord    ← ssr_scores_repo.list_by_run()
SsrAnchorSetRow   ← ssr_anchor_set columns (converted to AnchorSet in repo)

SsrPanelSummary   ← api.list_panels() → _fmt_panel_list() → (tool: ssr_panel_list)
SsrDeleteResult   ← api.delete_panel() → _fmt_delete_result() → (tool: ssr_panel_delete)
```

---

## Section 8: Import Usage in Other Files

### `apps/bot/src_v2/mcp/tools/ssr/tools.py`

```python
from .models import (
    # Input models (used in tool signatures)
    PanelCreateInput,
    PanelRunInput,
    PanelResultsInput,
    PanelListInput,
    PanelDeleteInput,
    # Enums (used in formatters and type annotations)
    EvaluationDimension,
    ResponseFormat,
    StimulusType,
    # Pipeline types (used in formatter function annotations)
    AggregatedDimensionResult,
    CreatePanelResult,
    DimensionComparison,
    HighlightQuote,
    PanelRunResult,
    PersonaResponse,
    RetrievedRunResult,
    SsrPanelSummary,
    SsrDeleteResult,
    SsrPersonaSummary,
)
```

### `apps/bot/src_v2/mcp/tools/ssr/api.py`

```python
from .models import (
    # Input models (function parameter types)
    PersonaDemographics,
    PersonaPsychographics,
    EvaluationDimension,
    StimulusType,
    ResponseFormat,
    # Pipeline types (constructed and returned)
    AggregatedDimensionResult,
    AnchorPoint,
    AnchorSet,
    CreatePanelResult,
    DimensionComparison,
    DimensionScore,
    HighlightQuote,
    PanelRunResult,
    PersonaResponse,
    RetrievedRunResult,
    SsrDeleteResult,
    SsrPanelSummary,
    SsrPersonaSummary,
    # Stimulus label mapping
    _STIMULUS_TYPE_LABELS,
)
```

### `apps/bot/src_v2/db/repositories/ssr_*.py`

```python
# Each repository file imports only the types it returns:

# ssr_panels.py
from src_v2.mcp.tools.ssr.models import SsrPanelRow, SsrPanelSummary

# ssr_personas.py
from src_v2.mcp.tools.ssr.models import SsrPersonaSummary  # returns this type

# ssr_runs.py
from src_v2.mcp.tools.ssr.models import SsrRunRecord

# ssr_responses.py
from src_v2.mcp.tools.ssr.models import SsrResponseRecord, PersonaResponse  # bulk_create takes PersonaResponse

# ssr_scores.py
from src_v2.mcp.tools.ssr.models import SsrScoreRecord, PersonaResponse  # bulk_create takes PersonaResponse

# ssr_anchors.py
from src_v2.mcp.tools.ssr.models import AnchorSet, AnchorPoint
```

---

## Section 9: Cross-References

- [panel-create.md](../tools/panel-create.md) — `PanelCreateInput`, `PersonaDemographics`, `PersonaPsychographics`, `SsrPersonaSummary`, `CreatePanelResult` usage
- [panel-run.md](../tools/panel-run.md) — `PanelRunInput`, `StimulusType`, `EvaluationDimension`, `ResponseFormat`, `DimensionScore`, `PersonaResponse`, `HighlightQuote`, `AggregatedDimensionResult`, `PanelRunResult`, `AnchorPoint`, `AnchorSet`
- [panel-results.md](../tools/panel-results.md) — `PanelResultsInput`, `RetrievedRunResult`, `DimensionComparison`, `SsrRunRecord`, `SsrScoreRecord`, `SsrResponseRecord`
- [panel-manage.md](../tools/panel-manage.md) — `PanelListInput`, `PanelDeleteInput`, `SsrPanelSummary`, `SsrDeleteResult`
- [supabase-schema.md](supabase-schema.md) — Table column definitions that these types mirror
- [scoring-aggregation.md](../pipeline/scoring-aggregation.md) — `DimensionScore` construction, `AggregatedDimensionResult` aggregation, `HighlightQuote` selection
- [anchor-statements.md](../pipeline/anchor-statements.md) — `AnchorPoint.statement` values (all 50 anchor texts)
- [reference-tools.md](../existing-patterns/reference-tools.md) — Why dataclasses for internals vs Pydantic for tool inputs
