# Persona Generation Pipeline

> Status: Complete (w2-tool-panel-create).
> Cross-references: [panel-create.md](../tools/panel-create.md) · [stimulus-presentation.md](stimulus-presentation.md) · [pydantic-models.md](../data-model/pydantic-models.md)

---

## Overview

The persona generation step creates N synthetic consumer profiles before any stimulus is presented. Each persona is an independent Claude Haiku call that produces a structured, labeled text output. Personas are generated concurrently (via `asyncio.gather`) and stored in the `ssr_persona` table.

**Model**: `claude-haiku-4-5-20251001`
**Max tokens**: 800 per persona
**Concurrency**: All N personas generated in parallel via `asyncio.gather`
**Parse format**: Labeled sections (`NAME: ...`, `AGE: ...`, etc.) — regex-extracted
**Storage**: Full profile text stored in `ssr_persona.full_profile`; extracted fields stored in individual columns

---

## 1. System Prompt

The system prompt is constant across all personas in a panel. It is sent as the `system` parameter to `client.messages.create()`.

```
You are a synthetic consumer persona generator for marketing research. Your job is to create realistic, specific, and internally consistent consumer profiles that will be used in simulated consumer research panels.

Each persona you create is a real individual — not an archetype or a demographic average. They have a specific name, a specific life situation, particular opinions, and a distinctive voice.

GUIDELINES:

SPECIFICITY: Give every persona a real name, exact age, specific city, concrete job, and detailed life circumstances. "Maria Santos, 37, elementary school teacher in Quezon City, mother of two boys (8 and 11)" is correct. "A middle-aged Filipino woman" is wrong.

INTERNAL CONSISTENCY: A persona's demographics, values, media habits, and product attitudes must make sense together. A 58-year-old construction worker in rural Cebu should not have the same media habits as a 28-year-old content creator in Manila. Their attitudes toward premium products should reflect their actual income and life stage.

REALISM: Real consumers have nuance and contradictions. A budget-conscious consumer might splurge on one category. A health-conscious person might have guilty pleasures. A skeptic of advertising might still be brand-loyal for certain products. Include these dimensions — they make personas more realistic and produce more varied research responses.

PRODUCT CATEGORY GROUNDING: Each persona's attitudes toward the product category must be specific to their circumstances. Do not describe generic category attitudes. Describe THIS person's relationship with THIS category, shaped by their actual income, lifestyle, past experiences, and values.

PANEL DIVERSITY: Each persona in a panel must be a genuinely distinct individual. When you see "Persona X of Y", vary age, occupation, household situation, income, and product attitudes across the allowed ranges. Do not create personas that sound similar to each other.

RESPONSE FORMAT: You must use exactly this labeled format. Each label appears at the start of a new line, followed by a colon and a space, followed by the content. Multi-sentence content appears on the same line as the label (do not add line breaks within a field).

NAME: [First and last name — a realistic name for the persona's culture and location]
AGE: [A single integer]
LOCATION: [City, Country or City, State — e.g. "Quezon City, Philippines" or "Austin, Texas, USA"]
OCCUPATION: [Job title or life situation, e.g. "Retired elementary school teacher", "Freelance graphic designer", "Stay-at-home parent", "University student"]
HOUSEHOLD: [Brief household composition, e.g. "Married, 2 kids (ages 4 and 7)", "Single, lives alone in a studio apartment", "Lives with parents and younger sibling"]
INCOME_BRACKET: [Exactly one of: low / lower_middle / middle / upper_middle / high — relative to the persona's country]
EDUCATION: [Exactly one of: high_school / some_college / bachelors / graduate / postgraduate]
BACKGROUND: [2–3 sentences of biographical context that explains how they got to where they are — formative experiences, career path, significant life events]
VALUES: [3–5 core values as a comma-separated list, e.g. "family security, practicality, loyalty to community, religious faith"]
LIFESTYLE: [2–3 sentences about daily life — routines, how they spend weekday evenings and weekends, what they prioritize, any notable habits]
MEDIA_HABITS: [2–3 sentences — specifically which platforms they use, how many hours per day, what content they consume, any influencers or media they follow]
PRODUCT_CATEGORY_ATTITUDES: [2–3 sentences about their specific relationship with the product category in context — how often they buy or engage with it, what drives their decisions, any strong opinions or memorable past experiences]
VOICE: [2–3 sentences describing how this person communicates — formal or casual, emotional or analytical, quick to trust or naturally skeptical, how they'd talk to a friend about a product they liked or disliked]
```

---

## 2. User Prompt Template

The user prompt is generated per-persona using `_build_persona_user_prompt()`. All placeholder values are substituted at call time.

```python
def _build_persona_user_prompt(
    index: int,
    total: int,
    demographics: "PersonaDemographics",
    psychographics: "PersonaPsychographics | None",
    product_category: str,
    custom_instructions: str | None,
) -> str:
    """Build the per-persona user prompt with all demographic and psychographic constraints."""

    # --- DEMOGRAPHICS section ---
    genders_str = (
        " / ".join(demographics.genders)
        if demographics.genders
        else "any gender"
    )
    locations_str = (
        ", ".join(demographics.locations)
        if demographics.locations
        else "any location"
    )
    income_str = (
        " or ".join(demographics.income_brackets)
        if demographics.income_brackets
        else "any income bracket"
    )
    education_str = (
        " or ".join(demographics.education_levels)
        if demographics.education_levels
        else "any education level"
    )
    languages_str = ", ".join(demographics.languages)

    # --- PSYCHOGRAPHICS section ---
    if psychographics:
        interests_str = (
            ", ".join(psychographics.interests)
            if psychographics.interests
            else "not specified"
        )
        values_str = (
            ", ".join(psychographics.values)
            if psychographics.values
            else "not specified"
        )
        lifestyle_str = (
            ", ".join(psychographics.lifestyle_descriptors)
            if psychographics.lifestyle_descriptors
            else "not specified"
        )
        media_str = (
            ", ".join(psychographics.media_consumption)
            if psychographics.media_consumption
            else "not specified"
        )
        psycho_block = f"""
PSYCHOGRAPHIC CONTEXT (use these to shape personality and lifestyle — not hard limits):
- Interests: {interests_str}
- Values: {values_str}
- Lifestyle: {lifestyle_str}
- Media consumption patterns: {media_str}
"""
    else:
        psycho_block = "\nPSYCHOGRAPHIC CONTEXT: Not specified — vary personality and lifestyle naturally within the demographic constraints.\n"

    # --- CUSTOM INSTRUCTIONS ---
    custom_block = f"\nADDITIONAL INSTRUCTIONS:\n{custom_instructions}\n" if custom_instructions else "\nADDITIONAL INSTRUCTIONS: None.\n"

    return f"""Create a synthetic consumer persona with the following constraints.

DEMOGRAPHIC CONSTRAINTS (these are hard limits — do not create a persona outside these bounds):
- Age range: {demographics.age_min} to {demographics.age_max} years old
- Gender: {genders_str}
- Location: {locations_str}
- Income bracket: {income_str}
- Education level: {education_str}
- Primary language: {languages_str}
{psycho_block}{custom_block}
PRODUCT CATEGORY CONTEXT:
{product_category}

PANEL DIVERSITY NOTE:
This is persona {index} of {total}. Each persona in this panel must be a genuinely distinct individual with a meaningfully different life situation and relationship with the product category. Vary age, occupation, household composition, and attitudes within the allowed demographic ranges. Do not echo or closely resemble other personas in the panel.

Generate exactly one specific, realistic consumer persona using the labeled format described in your system instructions."""
```

---

## 3. Rendered Example

For a 20-persona panel targeting Filipino moms, ages 30–45, with psychographics `{interests: ["cooking", "K-drama", "church activities"], values: ["family-first", "frugality"], lifestyle_descriptors: ["busy working mom"]}` and product category `"instant noodles and affordable packaged food"`, persona 1's user prompt would render as:

```
Create a synthetic consumer persona with the following constraints.

DEMOGRAPHIC CONSTRAINTS (these are hard limits — do not create a persona outside these bounds):
- Age range: 30 to 45 years old
- Gender: female
- Location: Philippines
- Income bracket: low or lower_middle or middle
- Education level: any education level
- Primary language: Filipino, English

PSYCHOGRAPHIC CONTEXT (use these to shape personality and lifestyle — not hard limits):
- Interests: cooking, K-drama, church activities
- Values: family-first, frugality
- Lifestyle: busy working mom
- Media consumption patterns: not specified

ADDITIONAL INSTRUCTIONS: None.

PRODUCT CATEGORY CONTEXT:
instant noodles and affordable packaged food

PANEL DIVERSITY NOTE:
This is persona 1 of 20. Each persona in this panel must be a genuinely distinct individual with a meaningfully different life situation and relationship with the product category. Vary age, occupation, household composition, and attitudes within the allowed demographic ranges. Do not echo or closely resemble other personas in the panel.

Generate exactly one specific, realistic consumer persona using the labeled format described in your system instructions.
```

---

## 4. Expected Claude Response

The response from Claude for the above prompt would look like:

```
NAME: Maria Santos
AGE: 37
LOCATION: Quezon City, Philippines
OCCUPATION: Elementary School Teacher (public school)
HOUSEHOLD: Married, 2 kids (ages 8 and 11), husband works as a delivery driver
INCOME_BRACKET: lower_middle
EDUCATION: bachelors
BACKGROUND: Maria grew up in Bulacan province, moved to Quezon City after college for her first teaching assignment. She has been at the same school for 12 years. Her household income is modest — her husband's delivery work is inconsistent — and she has become very skilled at stretching the family budget.
VALUES: family security, practicality, religious faith, resourcefulness
LIFESTYLE: Maria wakes at 5:30am to prepare school lunches before the school day begins. Weekday evenings are for homework help and cooking. On Sundays, the family goes to mass and she visits the wet market for the week's groceries. She rarely eats out except for special occasions.
MEDIA_HABITS: Active on Facebook (1–2 hours per day, mostly family groups and church community pages). Watches ABS-CBN noontime shows when home and K-dramas on TikTok in the evening. Not a YouTube user. Follows a few "budget ulam" Facebook pages for recipe ideas.
PRODUCT_CATEGORY_ATTITUDES: Instant noodles are a weekly staple in Maria's household — she buys at least 3–4 packs per week, primarily Lucky Me and Payless brands. She has clear brand loyalty built on years of consistent quality and affordable price. She is skeptical of premium-priced instant noodles ("why would I pay twice as much for noodles?") but has been known to buy Nissin Cup Noodles as a treat for her kids on exam weeks.
VOICE: Maria speaks in a warm, direct, Tagalog-inflected way even in English. She is naturally skeptical of advertising claims ("ads always say everything is the best") but responds strongly to practical evidence — a neighbor's recommendation or a visible coupon. She would tell a friend "sulit ba talaga?" (is it really worth it?) before trying anything new.
```

---

## 5. Parsing Logic

See [panel-create.md § 10 — Persona Parsing](../tools/panel-create.md#10-persona-parsing) for the full `_parse_persona_response()` implementation.

### Summary of parsing behavior

| Field | Regex Label | Post-Processing |
|-------|------------|-----------------|
| `name` | `NAME` | Strip whitespace |
| `age` | `AGE` | `re.search(r"\d+")` → `int()` |
| `location` | `LOCATION` | Strip whitespace |
| `occupation` | `OCCUPATION` | Strip whitespace |
| `income_bracket` | `INCOME_BRACKET` | `.lower()` → validate against `{"low", "lower_middle", "middle", "upper_middle", "high"}`; fallback `"middle"` |
| `education` | `EDUCATION` | `.lower()` → validate against `{"high_school", "some_college", "bachelors", "graduate", "postgraduate"}`; fallback `"some_college"` |
| `background` | `BACKGROUND` | Captured as-is; used in `summary` construction |
| `product_attitudes` | `PRODUCT_CATEGORY_ATTITUDES` | Captured as-is; used in `summary` construction |
| `full_profile` | — | The entire raw response text; stored verbatim in `ssr_persona.full_profile` |

**Summary construction**: `summary = f"{background[:150].rstrip('.')}. {product_attitudes[:150].rstrip('.')}."` — truncated to keep output compact without losing key information.

**Error handling**: If a required field (`NAME`, `AGE`, `LOCATION`, `OCCUPATION`, `INCOME_BRACKET`, `EDUCATION`, `BACKGROUND`, `PRODUCT_CATEGORY_ATTITUDES`) is missing, `_parse_persona_response()` raises `ValueError`. This propagates as an exception returned by `asyncio.gather()`, counted as a generation failure.

---

## 6. Cost Accounting

### Per-persona token estimate (Haiku 4.5)

| Component | Input tokens | Output tokens |
|-----------|-------------|--------------|
| System prompt | ~420 | — |
| User prompt (demographics, psychographics, instructions) | ~250–350 | — |
| Claude response (full profile) | — | ~500–700 |
| **Totals** | **~700–770** | **~600** |

### Cost per persona (Haiku 4.5 pricing: $0.80/MTok input, $4.00/MTok output)

```
Input cost:   750 tokens × $0.80 / 1,000,000 = $0.00060
Output cost:  600 tokens × $4.00 / 1,000,000 = $0.00240
Total:        $0.00300 per persona
```

### Panel creation cost

| Panel size | Cost |
|-----------|------|
| 5 personas | $0.015 |
| 10 personas | $0.030 |
| 20 personas (default) | $0.060 |
| 30 personas | $0.090 |
| 50 personas (max) | $0.150 |

---

## 7. Concurrency Architecture

```python
# In api.py — asyncio.gather over all personas
tasks = [
    _generate_single_persona(
        client=client,
        index=i + 1,
        total=panel_size,
        demographics=demographics,
        psychographics=psychographics,
        product_category=product_category,
        custom_instructions=custom_instructions,
    )
    for i in range(panel_size)
]
raw_results = await asyncio.gather(*tasks, return_exceptions=True)
```

**Why concurrent**: Haiku latency is ~1–3 seconds per call. Sequential generation for 20 personas would take 20–60 seconds — unacceptable for a Discord interaction. Concurrent generation takes 3–8 seconds total regardless of panel size.

**Rate limiting**: Anthropic Haiku tier limits are high enough that 50 concurrent calls do not typically hit rate limits. No explicit rate limiting is implemented in the first version. If rate limit errors appear in production, add a semaphore: `asyncio.Semaphore(20)` wrapping each `_generate_single_persona` call.

**Return exceptions**: `asyncio.gather(*tasks, return_exceptions=True)` returns exceptions as values instead of raising on first failure. This allows partial success — if 18 of 20 personas succeed, the panel is created with 18 personas.

---

## 8. Diversity Enforcement

Diversity is enforced through prompting only — the user prompt explicitly tells Claude this is persona N of M and to create a distinct individual. No algorithmic diversity enforcement is applied.

**Known limitation**: With pure prompting, there is some risk of clustering (multiple personas with similar backgrounds). This is acceptable for the initial implementation. If diversity is insufficient in practice, a post-generation deduplication check could be added: compare persona names and occupations, re-generate duplicates.

**Diversity prompt text** (from user prompt):
> "This is persona {index} of {total}. Each persona in this panel must be a genuinely distinct individual with a meaningfully different life situation and relationship with the product category. Vary age, occupation, household composition, and attitudes within the allowed demographic ranges. Do not echo or closely resemble other personas in the panel."

---

## 9. Storage in `ssr_persona` Table

Each parsed persona is inserted into `ssr_persona` with:

| Column | Value | Source |
|--------|-------|--------|
| `id` | UUID v4 | `SsrPersonaSummary.persona_id` |
| `panel_id` | FK → `ssr_panel.id` | Provided to `bulk_create()` |
| `panel_index` | 1–N | `SsrPersonaSummary.index` |
| `name` | Full name | `SsrPersonaSummary.name` |
| `age` | Integer | `SsrPersonaSummary.age` |
| `location` | "City, Country" | `SsrPersonaSummary.location` |
| `occupation` | Job/situation | `SsrPersonaSummary.occupation` |
| `income_bracket` | Enum value | `SsrPersonaSummary.income_bracket` |
| `education` | Enum value | `SsrPersonaSummary.education` |
| `summary` | 2-3 sentence summary | `SsrPersonaSummary.summary` |
| `full_profile` | Complete labeled text | `SsrPersonaSummary.full_profile` |
| `created_at` | `NOW()` | DB default |

See [supabase-schema.md](../data-model/supabase-schema.md) for the full `ssr_persona` table definition.

---

## 10. Cross-References

- [panel-create.md](../tools/panel-create.md) — `ssr_panel_create` tool definition, handler, and `_parse_persona_response()`
- [stimulus-presentation.md](stimulus-presentation.md) — Next pipeline stage: presenting marketing assets to personas
- [supabase-schema.md](../data-model/supabase-schema.md) — `ssr_panel` and `ssr_persona` table definitions
- [pydantic-models.md](../data-model/pydantic-models.md) — `PersonaDemographics`, `PersonaPsychographics`, `SsrPersonaSummary`
- [embedding-options.md](../existing-patterns/embedding-options.md) — `text-embedding-3-small` for anchor scoring (used in `ssr_panel_run`, not here)
