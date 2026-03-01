# `ssr_panel_create` — Tool Specification

> Status: Complete (w2-tool-panel-create).
> Cross-references: [persona-generation.md](../pipeline/persona-generation.md) · [pydantic-models.md](../data-model/pydantic-models.md) · [supabase-schema.md](../data-model/supabase-schema.md) · [tool-system.md](../existing-patterns/tool-system.md) · [reference-tools.md](../existing-patterns/reference-tools.md)

---

## 1. Tool Definition

```python
@tool(
    description="""\
Create a synthetic consumer panel for marketing research.

Use when a user wants to test any marketing asset (ad copy, product concept, tagline,
pricing message, influencer pitch, etc.) with a specific consumer segment.

Creates N synthetic consumer personas matching the specified demographics and
psychographics. Personas are generated immediately and stored in the database.
After creation, use ssr_panel_run to test a specific marketing asset against this panel.

Returns a panel ID, a summary of each generated persona, and the estimated cost
per future run.""",
    tags={Platform.SSR, Action.WRITE},
)
async def ssr_panel_create(
    tool_context: ToolContext,
    user_context: UserContext,
    db_context: DatabaseContext | None,
    params: PanelCreateInput,
) -> str:
```

**Tool name (MCP)**: `ssr_panel_create`
**File location**: `apps/bot/src_v2/mcp/tools/ssr/tools.py`
**tags**: `{Platform.SSR, Action.WRITE}` — requires `Platform.SSR = "ssr"` added to `core/platforms.py`
**requires_credential**: `None` — uses `tool_context.anthropic_api_key` (system key)
**db_context**: Required — always raises `ToolError` if `None`

---

## 2. Input Schema

### `PanelCreateInput` (Pydantic v2 BaseModel)

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

### `PersonaDemographics` (Pydantic v2 BaseModel)

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
            "'low' = below median, 'lower_middle' = 20th–40th percentile, "
            "'middle' = 40th–60th percentile, 'upper_middle' = 60th–80th percentile, "
            "'high' = top 20%. Must not be an empty list."
        ),
    )
    education_levels: list[Literal["high_school", "some_college", "bachelors", "graduate", "postgraduate"]] | None = Field(
        default=None,
        description=(
            "Allowed highest completed education levels. Omit for any education level. "
            "Must not be an empty list."
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
        if self.age_max < self.age_min:
            raise ValueError(
                f"age_max ({self.age_max}) must be >= age_min ({self.age_min})"
            )
        return self

    @model_validator(mode="after")
    def validate_non_empty_lists(self) -> "PersonaDemographics":
        if self.genders is not None and len(self.genders) == 0:
            raise ValueError("genders must not be an empty list — pass null for any gender")
        if self.income_brackets is not None and len(self.income_brackets) == 0:
            raise ValueError("income_brackets must not be an empty list — pass null for any income level")
        if self.education_levels is not None and len(self.education_levels) == 0:
            raise ValueError("education_levels must not be an empty list — pass null for any education level")
        return self
```

### `PersonaPsychographics` (Pydantic v2 BaseModel)

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

---

## 3. Output Format

The tool returns XML using `tag()`, `wrap()`, and `hint()` from `src_v2.core.xml`.

### Output formatter: `_fmt_panel_created()`

```python
def _fmt_panel_created(
    panel_id: str,
    panel_name: str,
    personas: list[SsrPersonaSummary],
    panel_size: int,
    estimated_run_cost_usd: float,
    partial: bool = False,
) -> str:
    """Format the panel creation result as XML for Claude."""
    persona_tags = [
        tag(
            "persona",
            p.summary,
            index=str(p.index),
            name=p.name,
            age=str(p.age),
            location=p.location,
            occupation=p.occupation,
        )
        for p in personas
    ]
    personas_wrapped = wrap("personas", persona_tags, total=str(len(personas)))

    parts = [
        tag("panel-id", panel_id),
        tag("panel-name", panel_name),
        personas_wrapped,
        tag("estimated-run-cost-usd", f"{estimated_run_cost_usd:.4f}"),
    ]

    if partial:
        parts.append(
            hint(
                f"Panel was partially generated: {len(personas)} of {panel_size} personas "
                f"completed before an error occurred. The panel is usable but results "
                f"may show less demographic diversity than requested. "
                f"Use ssr_panel_run with panel_id='{panel_id}' to proceed."
            )
        )
    else:
        parts.append(
            hint(
                f"Panel '{panel_id}' is ready with {len(personas)} personas. "
                f"Use ssr_panel_run with panel_id='{panel_id}' to test a marketing asset."
            )
        )

    return tag(
        "panel-created",
        "".join(parts),
        raw=True,
        size=str(len(personas)),
        requested_size=str(panel_size),
        status="partial" if partial else "ready",
    )
```

### Example output (20-persona Filipino moms panel)

```xml
<panel-created size="20" requested_size="20" status="ready">
  <panel-id>a1b2c3d4-e5f6-7890-abcd-ef1234567890</panel-id>
  <panel-name>Filipino Moms 30-45</panel-name>
  <personas total="20">
    <persona index="1" name="Maria Santos" age="37" location="Quezon City, Philippines" occupation="Elementary School Teacher">
      Married with two boys (8 and 11). Manages family grocery budget carefully. Trusts brands recommended by teachers or church community. Skeptical of premium pricing but loyal once trust is established.
    </persona>
    <persona index="2" name="Liza Reyes" age="42" location="Davao City, Philippines" occupation="Small Business Owner (Sari-sari Store)">
      Widowed, runs a neighborhood store, three children (14, 17, 22). Highly practical — evaluates products by value-for-money and shelf life. Frequent TikTok user. Favors local brands when quality is comparable.
    </persona>
    <persona index="3" name="Joy Dela Cruz" age="31" location="Makati, Philippines" occupation="Customer Service Representative">
      Single renting with a roommate. Sends remittances to parents in Iloilo. Budget-conscious but aspires to trade up on personal care. Heavy Instagram user. Influenced by beauty vloggers.
    </persona>
    <!-- ... 17 more personas ... -->
  </personas>
  <estimated-run-cost-usd>0.0600</estimated-run-cost-usd>
  <hint>Panel 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' is ready with 20 personas. Use ssr_panel_run with panel_id='a1b2c3d4-e5f6-7890-abcd-ef1234567890' to test a marketing asset.</hint>
</panel-created>
```

---

## 4. Tool Handler Implementation

```python
# apps/bot/src_v2/mcp/tools/ssr/tools.py

@tool(
    description="""\
Create a synthetic consumer panel for marketing research.

Use when a user wants to test any marketing asset (ad copy, product concept, tagline,
pricing message, influencer pitch, etc.) with a specific consumer segment.

Creates N synthetic consumer personas matching the specified demographics and
psychographics. Personas are generated immediately and stored in the database.
After creation, use ssr_panel_run to test a specific marketing asset against this panel.

Returns a panel ID, a summary of each generated persona, and the estimated cost
per future run.""",
    tags={Platform.SSR, Action.WRITE},
)
async def ssr_panel_create(
    tool_context: ToolContext,
    user_context: UserContext,
    db_context: DatabaseContext | None,
    params: PanelCreateInput,
) -> str:
    if db_context is None:
        raise ToolError("Database context required for SSR panel tools.")

    panel_name = params.panel_name or _auto_panel_name(params.demographics, params.product_category)

    result = await api.create_panel_with_personas(
        db=db_context,
        tool_ctx=tool_context,
        discord_id=user_context.discord_id,
        panel_name=panel_name,
        demographics=params.demographics,
        psychographics=params.psychographics,
        product_category=params.product_category,
        panel_size=params.panel_size,
        custom_instructions=params.custom_persona_instructions,
    )

    estimated_run_cost = _estimate_run_cost_usd(len(result.personas))

    return _fmt_panel_created(
        panel_id=result.panel_id,
        panel_name=panel_name,
        personas=result.personas,
        panel_size=params.panel_size,
        estimated_run_cost_usd=estimated_run_cost,
        partial=result.partial,
    )


def _auto_panel_name(demographics: PersonaDemographics, product_category: str) -> str:
    """Generate a descriptive panel name from demographics when none is provided."""
    parts = []
    age_part = f"Ages {demographics.age_min}–{demographics.age_max}"
    parts.append(age_part)
    if demographics.locations:
        parts.append(", ".join(demographics.locations[:2]))
    parts.append(product_category.title())
    return " · ".join(parts)


def _estimate_run_cost_usd(panel_size: int) -> float:
    """Estimate the cost in USD for one ssr_panel_run call on this panel.

    Based on Haiku 4.5 pricing ($0.80/MTok input, $4.00/MTok output):
    - Stimulus presentation: ~500 tokens input + ~200 tokens output per persona
    - Response elicitation: ~400 tokens input + ~300 tokens output per persona
    - Total per persona: 900 input + 500 output
    - Cost: (900 * 0.80 + 500 * 4.00) / 1_000_000 = $0.000272 + $0.002 = $0.002272
    - Embedding cost (text-embedding-3-small): negligible (~$0.000003/persona)
    - Rounded up for safety: $0.003/persona
    """
    return round(panel_size * 0.003, 4)
```

---

## 5. API Layer Implementation

```python
# apps/bot/src_v2/mcp/tools/ssr/api.py (create_panel_with_personas section)

import asyncio
import uuid
from anthropic import AsyncAnthropic

from src_v2.db.repositories import ssr_panels as panels_repo
from src_v2.db.repositories import ssr_personas as personas_repo
from src_v2.mcp.context import DatabaseContext, ToolContext
from src_v2.mcp.registry import ToolError
from .models import CreatePanelResult, SsrPersonaSummary


async def create_panel_with_personas(
    db: DatabaseContext,
    tool_ctx: ToolContext,
    discord_id: str,
    panel_name: str,
    demographics: "PersonaDemographics",
    psychographics: "PersonaPsychographics | None",
    product_category: str,
    panel_size: int,
    custom_instructions: str | None,
) -> CreatePanelResult:
    """Create a panel record and eagerly generate all N personas.

    On partial failure (Claude error mid-generation):
    - If >= 50% of personas generated: keep panel with status='partial', return result
    - If < 50% generated: delete panel record, raise ToolError

    Returns CreatePanelResult with panel_id, list of SsrPersonaSummary, and partial flag.
    """
    session = db.session_factory()

    # 1. Insert panel record (status='generating')
    panel_id = str(uuid.uuid4())
    panels_repo.create(
        session,
        panel_id=panel_id,
        discord_id=discord_id,
        panel_name=panel_name,
        product_category=product_category,
        demographics=demographics.model_dump(),
        psychographics=psychographics.model_dump() if psychographics else None,
        panel_size=panel_size,
        custom_instructions=custom_instructions,
        status="generating",
    )

    # 2. Generate all personas concurrently
    client = AsyncAnthropic(api_key=tool_ctx.anthropic_api_key)
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

    # 3. Separate successes from failures
    personas: list[SsrPersonaSummary] = []
    errors: list[Exception] = []
    for result in raw_results:
        if isinstance(result, Exception):
            errors.append(result)
        else:
            personas.append(result)

    # 4. Check minimum completion threshold
    if len(personas) < panel_size * 0.5:
        # Too few personas — clean up and raise
        panels_repo.delete(session, panel_id)
        raise ToolError(
            f"Panel generation failed: only {len(personas)} of {panel_size} personas "
            f"were generated before an error occurred. Please try again. "
            f"If the problem persists, reduce panel_size or simplify the demographic constraints."
        )

    # 5. Bulk insert successful personas
    partial = len(errors) > 0
    personas_repo.bulk_create(session, panel_id=panel_id, personas=personas)

    # 6. Update panel status
    final_status = "partial" if partial else "ready"
    panels_repo.update_status(session, panel_id, final_status, actual_size=len(personas))

    return CreatePanelResult(
        panel_id=panel_id,
        personas=personas,
        partial=partial,
    )
```

---

## 6. Single Persona Generation

```python
# In api.py — the internal persona generator

_PERSONA_MODEL = "claude-haiku-4-5-20251001"
_PERSONA_MAX_TOKENS = 800

async def _generate_single_persona(
    client: AsyncAnthropic,
    index: int,
    total: int,
    demographics: "PersonaDemographics",
    psychographics: "PersonaPsychographics | None",
    product_category: str,
    custom_instructions: str | None,
) -> "SsrPersonaSummary":
    """Call Claude Haiku to generate one realistic consumer persona.

    Returns SsrPersonaSummary. Raises Exception on Claude API failure
    (caught by gather() in create_panel_with_personas).
    """
    system_prompt = _build_persona_system_prompt()
    user_prompt = _build_persona_user_prompt(
        index=index,
        total=total,
        demographics=demographics,
        psychographics=psychographics,
        product_category=product_category,
        custom_instructions=custom_instructions,
    )

    response = await client.messages.create(
        model=_PERSONA_MODEL,
        max_tokens=_PERSONA_MAX_TOKENS,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )

    raw_text = response.content[0].text
    return _parse_persona_response(raw_text, index)
```

---

## 7. Validation Rules

All validation is done by Pydantic before the handler is called, plus one check in the handler:

| Rule | Where Enforced | Error Text |
|------|---------------|------------|
| `age_min` in range [18, 99] | Pydantic `ge=18, le=99` on `age_min` | Pydantic default |
| `age_max` in range [18, 99] | Pydantic `ge=18, le=99` on `age_max` | Pydantic default |
| `age_max >= age_min` | `@model_validator` on `PersonaDemographics` | `"age_max (X) must be >= age_min (Y)"` |
| `genders` not empty list | `@model_validator` on `PersonaDemographics` | `"genders must not be an empty list — pass null for any gender"` |
| `income_brackets` not empty list | `@model_validator` on `PersonaDemographics` | `"income_brackets must not be an empty list — pass null for any income level"` |
| `education_levels` not empty list | `@model_validator` on `PersonaDemographics` | `"education_levels must not be an empty list — pass null for any education level"` |
| `panel_size` in range [5, 50] | Pydantic `ge=5, le=50` on `panel_size` | Pydantic default |
| `product_category` not empty | Pydantic `min_length=1` | Pydantic default |
| `product_category` max length | Pydantic `max_length=200` | Pydantic default |
| `custom_persona_instructions` max length | Pydantic `max_length=1000` | Pydantic default |
| `panel_name` max length | Pydantic `max_length=120` | Pydantic default |
| `db_context` is not None | Tool handler first line | `"Database context required for SSR panel tools."` |

---

## 8. Error Cases

| Scenario | Error Type | Message |
|----------|-----------|---------|
| `db_context` is `None` | `ToolError` | `"Database context required for SSR panel tools."` |
| `age_min > age_max` | `ToolError` (via Pydantic) | `"age_max (X) must be >= age_min (Y)"` |
| `genders = []` | `ToolError` (via Pydantic) | `"genders must not be an empty list — pass null for any gender"` |
| `panel_size < 5` or `> 50` | `ToolError` (via Pydantic) | Pydantic range message |
| < 50% of personas generated (Claude failure) | `ToolError` | `"Panel generation failed: only N of M personas were generated before an error occurred. Please try again. If the problem persists, reduce panel_size or simplify the demographic constraints."` |
| 50–99% personas generated (partial success) | No error — partial result returned | Output XML has `status="partial"`, hint explains the partial state |
| `product_category` empty string | `ToolError` (via Pydantic) | Pydantic min_length message |

---

## 9. Internal Models

```python
# apps/bot/src_v2/mcp/tools/ssr/models.py

from dataclasses import dataclass, field


@dataclass
class SsrPersonaSummary:
    """Compact persona representation used in tool output and persona list."""
    index: int           # 1-based position in the panel
    persona_id: str      # UUID assigned at generation time
    name: str            # Full name (e.g. "Maria Santos")
    age: int             # Exact age
    location: str        # "City, Country" (e.g. "Quezon City, Philippines")
    occupation: str      # Job title or life situation
    income_bracket: str  # One of: low / lower_middle / middle / upper_middle / high
    education: str       # One of: high_school / some_college / bachelors / graduate / postgraduate
    summary: str         # 2-3 sentence human-readable summary for display in tool output
    full_profile: str    # Complete structured text output from Claude (all labeled sections)


@dataclass
class CreatePanelResult:
    """Result of create_panel_with_personas()."""
    panel_id: str
    personas: list[SsrPersonaSummary] = field(default_factory=list)
    partial: bool = False  # True if fewer than panel_size personas were generated
```

---

## 10. Persona Parsing

```python
# In api.py

import re
import uuid as uuid_lib


def _parse_persona_response(raw_text: str, index: int) -> SsrPersonaSummary:
    """Parse Claude's labeled-section persona output into SsrPersonaSummary.

    Expected format (each field on its own line):
        NAME: Maria Santos
        AGE: 37
        LOCATION: Quezon City, Philippines
        OCCUPATION: Elementary School Teacher
        HOUSEHOLD: Married, 2 kids (8 and 11)
        INCOME_BRACKET: middle
        EDUCATION: bachelors
        BACKGROUND: ...
        VALUES: ...
        LIFESTYLE: ...
        MEDIA_HABITS: ...
        PRODUCT_CATEGORY_ATTITUDES: ...
        VOICE: ...

    Raises ValueError if required fields are missing or malformed (will be
    caught as Exception by asyncio.gather in create_panel_with_personas).
    """
    def extract(label: str) -> str:
        pattern = rf"^{label}:\s*(.+?)(?=\n[A-Z_]+:|$)"
        match = re.search(pattern, raw_text, re.MULTILINE | re.DOTALL)
        if not match:
            raise ValueError(f"Missing required field '{label}' in persona response")
        return match.group(1).strip()

    name = extract("NAME")
    age_str = extract("AGE")
    location = extract("LOCATION")
    occupation = extract("OCCUPATION")
    income_bracket = extract("INCOME_BRACKET").lower()
    education = extract("EDUCATION").lower()
    background = extract("BACKGROUND")
    lifestyle = extract("LIFESTYLE")
    product_attitudes = extract("PRODUCT_CATEGORY_ATTITUDES")

    try:
        age = int(re.search(r"\d+", age_str).group())
    except (AttributeError, ValueError):
        raise ValueError(f"Could not parse age from '{age_str}'")

    # Validate income_bracket and education are known values
    valid_income = {"low", "lower_middle", "middle", "upper_middle", "high"}
    if income_bracket not in valid_income:
        # Fuzzy-fix common variants
        income_bracket = "middle"  # Safe default

    valid_education = {"high_school", "some_college", "bachelors", "graduate", "postgraduate"}
    if education not in valid_education:
        education = "some_college"  # Safe default

    # Build a 2-3 sentence display summary
    summary = f"{background[:150].rstrip('.')}. {product_attitudes[:150].rstrip('.')}."

    return SsrPersonaSummary(
        index=index,
        persona_id=str(uuid_lib.uuid4()),
        name=name,
        age=age,
        location=location,
        occupation=occupation,
        income_bracket=income_bracket,
        education=education,
        summary=summary,
        full_profile=raw_text.strip(),
    )
```

---

## 11. Repository Functions Required

The following repository functions must exist (defined in `db/repositories/ssr_panels.py` and `db/repositories/ssr_personas.py`):

```python
# db/repositories/ssr_panels.py

def create(
    session: Session,
    panel_id: str,
    discord_id: str,
    panel_name: str,
    product_category: str,
    demographics: dict,
    psychographics: dict | None,
    panel_size: int,
    custom_instructions: str | None,
    status: str,
) -> None:
    """Insert a new ssr_panel row."""

def update_status(
    session: Session,
    panel_id: str,
    status: str,
    actual_size: int,
) -> None:
    """Update panel status and actual_size after generation completes."""

def delete(session: Session, panel_id: str) -> None:
    """Delete a panel (used for cleanup on catastrophic generation failure)."""
```

```python
# db/repositories/ssr_personas.py

def bulk_create(
    session: Session,
    panel_id: str,
    personas: list[SsrPersonaSummary],
) -> None:
    """Bulk-insert all generated personas for a panel in a single transaction."""
```

---

## 12. Cross-References

- [persona-generation.md](../pipeline/persona-generation.md) — Full system prompt and user prompt templates, parsing logic
- [supabase-schema.md](../data-model/supabase-schema.md) — `ssr_panel` and `ssr_persona` table definitions
- [pydantic-models.md](../data-model/pydantic-models.md) — `PanelCreateInput`, `PersonaDemographics`, `PersonaPsychographics` definitions
- [panel-run.md](panel-run.md) — Next step after panel creation
- [panel-manage.md](panel-manage.md) — `ssr_panel_list` and `ssr_panel_delete`
- [tool-system.md](../existing-patterns/tool-system.md) — `@tool` decorator, `ToolDef`, `ToolError`, context objects
- [reference-tools.md](../existing-patterns/reference-tools.md) — Split-file pattern, DB access, formatter conventions
- [embedding-options.md](../existing-patterns/embedding-options.md) — `text-embedding-3-small`, cost analysis
