# `ssr_panel_results` — Tool Specification

> Status: Complete (w2-tool-panel-results).
> Cross-references: [panel-run.md](panel-run.md) · [panel-create.md](panel-create.md) · [scoring-aggregation.md](../pipeline/scoring-aggregation.md) · [supabase-schema.md](../data-model/supabase-schema.md) · [pydantic-models.md](../data-model/pydantic-models.md) · [discord-ux.md](../integration/discord-ux.md) · [tool-system.md](../existing-patterns/tool-system.md) · [reference-tools.md](../existing-patterns/reference-tools.md)

---

## 1. Tool Definition

```python
@tool(
    description="""\
Retrieve or compare results from a completed consumer panel run.

Use when a user wants to:
- Look up results from a previous ssr_panel_run (by run_id or panel_id)
- Compare results between two runs to see which marketing asset performed better
- See results in more detail than originally requested (summary → detailed → raw)

This tool is for retrieval only — to run a new panel, use ssr_panel_run.

Results include per-dimension Likert distributions, mean scores, standard
deviations, and qualitative highlights. Comparison mode shows per-dimension
deltas and direction arrows between two runs.

Provide either run_id (specific run) or panel_id (retrieves the most recent
completed run for that panel). At least one is required.

For comparison mode, also provide comparison_run_id — the second run to
compare against. Both runs must belong to the same owner.""",
    tags={Platform.SSR, Action.READ},
)
async def ssr_panel_results(
    tool_context: ToolContext,
    user_context: UserContext,
    db_context: DatabaseContext | None,
    params: PanelResultsInput,
) -> str:
```

**Tool name (MCP)**: `ssr_panel_results`
**File location**: `apps/bot/src_v2/mcp/tools/ssr/tools.py`
**tags**: `{Platform.SSR, Action.READ}` — read-only retrieval
**requires_credential**: `None` — uses owner verification via `discord_id`
**db_context**: Required — always raises `ToolError` if `None`

---

## 2. Input Schema

### `PanelResultsInput` (Pydantic v2 BaseModel)

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
            "all dimension scores — for offline analysis."
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
        if self.run_id is None and self.panel_id is None:
            raise ValueError(
                "Provide either run_id (specific run) or panel_id (most recent run). "
                "Both cannot be null."
            )
        return self
```

**Notes**:
- `ResponseFormat` is the same enum defined in `panel-run.md` (shared in `models.py`):
  - `ResponseFormat.SUMMARY` — compact output, fits in one Discord message
  - `ResponseFormat.DETAILED` — full stats + 3 highlights per valence, long output (thread recommended)
  - `ResponseFormat.RAW` — per-persona breakdown, very long output (thread required)
- `comparison_run_id` is independent of `run_id` — it's always the "Run B" in the comparison.
- When `run_id` and `panel_id` are both provided, `run_id` takes precedence.

---

## 3. Output Format

### 3.1 Single-Run Output: `_fmt_retrieved_results()`

```python
def _fmt_retrieved_results(
    result: "RetrievedRunResult",
    response_format: ResponseFormat,
) -> str:
    """Format retrieved run results as XML for Claude.

    Uses the same _fmt_dimension_result() helper as _fmt_run_result() (from ssr_panel_run).
    Outer tag is <panel-results> (not <panel-run-results>) to distinguish retrieval from inline output.

    Args:
        result: Retrieved run data reconstructed from DB.
        response_format: Level of detail for each dimension's output.

    Returns:
        XML string.
    """
    stimulus_short = result.stimulus[:120].rstrip() + ("..." if len(result.stimulus) > 120 else "")
    dimension_tags = [
        _fmt_dimension_result(dim_result, response_format)
        for dim_result in result.aggregated_dimensions
    ]
    parts = [
        tag("run-id", result.run_id),
        tag("panel-id", result.panel_id),
        tag("run-label", result.run_label),
        tag("stimulus", stimulus_short, type=result.stimulus_type),
        tag("personas-scored", str(result.personas_scored)),
        tag("run-date", result.created_at.strftime("%Y-%m-%d %H:%M UTC")),
        wrap("dimensions", dimension_tags, count=str(len(dimension_tags))),
    ]
    if response_format == ResponseFormat.RAW:
        persona_tags = [_fmt_persona_raw(pr) for pr in result.persona_responses]
        parts.append(wrap("persona-responses", persona_tags, count=str(len(persona_tags))))
    parts.append(
        hint(
            f"Results retrieved for run '{result.run_id}'. "
            f"To compare with another run, call ssr_panel_results again with "
            f"run_id='{result.run_id}' and comparison_run_id='<other-run-id>'."
        )
    )
    return tag(
        "panel-results",
        "".join(parts),
        raw=True,
        run_id=result.run_id,
        panel_id=result.panel_id,
        personas_scored=str(result.personas_scored),
        dimensions=str(len(result.aggregated_dimensions)),
        format=response_format.value,
    )
```

### 3.2 Comparison Output: `_fmt_comparison_results()`

```python
def _fmt_comparison_results(
    result_a: "RetrievedRunResult",
    result_b: "RetrievedRunResult",
    comparisons: list["DimensionComparison"],
    response_format: ResponseFormat,
) -> str:
    """Format a side-by-side comparison between two runs as XML.

    Args:
        result_a: Primary run (the "baseline" — identified by run_id or latest-for-panel).
        result_b: Comparison run (identified by comparison_run_id).
        comparisons: Per-dimension comparison data (only shared dimensions).
        response_format: Level of detail. 'summary' shows means and delta only.
            'detailed' also shows CIs and per-run highlights.
            'raw' is not applicable to comparison mode — falls back to 'detailed'.

    Returns:
        XML string with <panel-comparison> outer tag.
    """
    # In comparison mode, raw falls back to detailed
    effective_format = (
        ResponseFormat.DETAILED if response_format == ResponseFormat.RAW else response_format
    )

    def _fmt_run_meta(r: "RetrievedRunResult", label: str) -> str:
        stimulus_short = r.stimulus[:100].rstrip() + ("..." if len(r.stimulus) > 100 else "")
        return tag(
            label,
            tag("run-id", r.run_id)
            + tag("run-label", r.run_label)
            + tag("stimulus", stimulus_short, type=r.stimulus_type)
            + tag("personas-scored", str(r.personas_scored))
            + tag("run-date", r.created_at.strftime("%Y-%m-%d %H:%M UTC")),
            raw=True,
        )

    # Note dimensions only in one run
    all_dims_a = {d.dimension.value for d in result_a.aggregated_dimensions}
    all_dims_b = {d.dimension.value for d in result_b.aggregated_dimensions}
    compared_dims = {c.dimension for c in comparisons}
    dims_only_in_a = all_dims_a - compared_dims
    dims_only_in_b = all_dims_b - compared_dims

    comparison_tags = [
        _fmt_dimension_comparison(comp, effective_format)
        for comp in comparisons
    ]

    parts = [
        _fmt_run_meta(result_a, "run-a"),
        _fmt_run_meta(result_b, "run-b"),
        wrap("dimensions", comparison_tags, count=str(len(comparison_tags))),
    ]

    # Build hint message
    hint_parts = [
        f"Comparison: '{result_a.run_label}' (A) vs '{result_b.run_label}' (B). "
        f"Positive delta = Run B scored higher. * marks statistically notable differences "
        f"(non-overlapping 95% confidence intervals)."
    ]
    if dims_only_in_a:
        hint_parts.append(
            f"Dimensions only in Run A (not compared): {sorted(dims_only_in_a)}."
        )
    if dims_only_in_b:
        hint_parts.append(
            f"Dimensions only in Run B (not compared): {sorted(dims_only_in_b)}."
        )
    parts.append(hint(" ".join(hint_parts)))

    return tag(
        "panel-comparison",
        "".join(parts),
        raw=True,
        run_a_id=result_a.run_id,
        run_b_id=result_b.run_id,
        panel_id=result_a.panel_id,
        dimensions_compared=str(len(comparisons)),
        format=effective_format.value,
    )
```

### 3.3 Per-Dimension Comparison Formatter: `_fmt_dimension_comparison()`

```python
def _fmt_dimension_comparison(
    comp: "DimensionComparison",
    response_format: ResponseFormat,
) -> str:
    """Format one dimension's comparison between two runs as XML.

    Summary format: means, distributions, and delta.
    Detailed format: adds CIs, std devs, and top 2 highlights per run.

    Args:
        comp: DimensionComparison dataclass for one dimension.
        response_format: ResponseFormat.SUMMARY or ResponseFormat.DETAILED.

    Returns:
        XML <dimension> element with run-a, run-b, and delta sub-elements.
    """
    dist_a = " ".join(f"{s}:{c}" for s, c in sorted(comp.run_a.distribution.items()))
    dist_b = " ".join(f"{s}:{c}" for s, c in sorted(comp.run_b.distribution.items()))

    delta_str = f"{comp.delta_mean:+.2f} {comp.delta_direction}"
    if comp.significant:
        delta_str += " *"  # Non-overlapping 95% CIs — statistically notable

    # Build run-a element
    run_a_attrs: dict[str, str] = {
        "mean": f"{comp.run_a.mean:.2f}",
        "mode": str(comp.run_a.mode),
        "distribution": dist_a,
    }
    if response_format == ResponseFormat.DETAILED:
        run_a_attrs["std"] = f"{comp.run_a.std_dev:.2f}"
        ci_a = comp.run_a.confidence_interval_95
        run_a_attrs["ci-95"] = f"{ci_a[0]:.2f}–{ci_a[1]:.2f}"
    run_a_tag = tag("run-a", "", raw=True, **run_a_attrs)

    # Build run-b element
    run_b_attrs: dict[str, str] = {
        "mean": f"{comp.run_b.mean:.2f}",
        "mode": str(comp.run_b.mode),
        "distribution": dist_b,
    }
    if response_format == ResponseFormat.DETAILED:
        run_b_attrs["std"] = f"{comp.run_b.std_dev:.2f}"
        ci_b = comp.run_b.confidence_interval_95
        run_b_attrs["ci-95"] = f"{ci_b[0]:.2f}–{ci_b[1]:.2f}"
    run_b_tag = tag("run-b", "", raw=True, **run_b_attrs)

    parts = [run_a_tag, run_b_tag, tag("delta", delta_str)]

    # In detailed mode, add top 2 highlights per run
    if response_format == ResponseFormat.DETAILED:
        if comp.run_a.highlights:
            h_tags_a = [
                tag("highlight", h.quote, valence=h.valence, persona=h.persona_name)
                for h in comp.run_a.highlights[:2]
            ]
            parts.append(tag("run-a-highlights", "".join(h_tags_a), raw=True))
        if comp.run_b.highlights:
            h_tags_b = [
                tag("highlight", h.quote, valence=h.valence, persona=h.persona_name)
                for h in comp.run_b.highlights[:2]
            ]
            parts.append(tag("run-b-highlights", "".join(h_tags_b), raw=True))

    return tag("dimension", "".join(parts), raw=True, name=comp.dimension)
```

### 3.4 Single-Run Retrieval Example — Summary Format

Request: `run_id="f9e1c2d3-a4b5-6789-cdef-012345678901"`, `response_format="summary"`

```xml
<panel-results run_id="f9e1c2d3-a4b5-6789-cdef-012345678901" panel_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890" personas_scored="20" dimensions="3" format="summary">
  <run-id>f9e1c2d3-a4b5-6789-cdef-012345678901</run-id>
  <panel-id>a1b2c3d4-e5f6-7890-abcd-ef1234567890</panel-id>
  <run-label>Version A — emotional approach</run-label>
  <stimulus type="social_caption">Ang sarap, tipid pa! Lucky Me na naman kasama ko sa hapag-kainan.</stimulus>
  <personas-scored>20</personas-scored>
  <run-date>2026-03-01 14:30 UTC</run-date>
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
        <highlight valence="negative" persona="Joy Dela Cruz">I get what it's saying but it's just obvious? Nothing new here.</highlight>
      </highlights>
    </dimension>
    <dimension name="personal_relevance">
      <mean>4.10</mean>
      <std>0.78</std>
      <mode>4</mode>
      <distribution>1:0 2:2 3:4 4:9 5:5</distribution>
      <highlights count="2">
        <highlight valence="positive" persona="Ana Bautista">This is literally my life. I cook Lucky Me at least twice a week when I run out of ulam budget.</highlight>
        <highlight valence="negative" persona="Grace Mendoza">I've been trying to cook more fresh food. My kids have been eating too many instant noodles.</highlight>
      </highlights>
    </dimension>
  </dimensions>
  <hint>Results retrieved for run 'f9e1c2d3-a4b5-6789-cdef-012345678901'. To compare with another run, call ssr_panel_results again with run_id='f9e1c2d3-a4b5-6789-cdef-012345678901' and comparison_run_id='&lt;other-run-id&gt;'.</hint>
</panel-results>
```

### 3.5 Comparison Example — Summary Format

Request: `run_id="f9e1c2d3-..."`, `comparison_run_id="a4b5c6d7-..."`, `response_format="summary"`

```xml
<panel-comparison run_a_id="f9e1c2d3-a4b5-6789-cdef-012345678901" run_b_id="a4b5c6d7-e8f9-0123-abcd-456789012345" panel_id="a1b2c3d4-e5f6-7890-abcd-ef1234567890" dimensions_compared="3" format="summary">
  <run-a>
    <run-id>f9e1c2d3-a4b5-6789-cdef-012345678901</run-id>
    <run-label>Version A — emotional approach</run-label>
    <stimulus type="social_caption">Ang sarap, tipid pa! Lucky Me na naman kasama ko sa hapag-kainan.</stimulus>
    <personas-scored>20</personas-scored>
    <run-date>2026-03-01 14:30 UTC</run-date>
  </run-a>
  <run-b>
    <run-id>a4b5c6d7-e8f9-0123-abcd-456789012345</run-id>
    <run-label>Version B — practical approach</run-label>
    <stimulus type="social_caption">Lucky Me — masustansya, abot-kaya, at pampamilya. ₱8 lang sa tindahan.</stimulus>
    <personas-scored>20</personas-scored>
    <run-date>2026-03-01 14:45 UTC</run-date>
  </run-b>
  <dimensions count="3">
    <dimension name="purchase_intent">
      <run-a mean="3.85" mode="4" distribution="1:1 2:2 3:4 4:9 5:4" />
      <run-b mean="4.12" mode="4" distribution="1:0 2:1 3:3 4:11 5:5" />
      <delta>+0.27 ↑</delta>
    </dimension>
    <dimension name="message_clarity">
      <run-a mean="4.40" mode="5" distribution="1:0 2:1 3:2 4:8 5:9" />
      <run-b mean="4.55" mode="5" distribution="1:0 2:0 3:2 4:7 5:11" />
      <delta>+0.15 ↑</delta>
    </dimension>
    <dimension name="personal_relevance">
      <run-a mean="4.10" mode="4" distribution="1:0 2:2 3:4 4:9 5:5" />
      <run-b mean="3.88" mode="4" distribution="1:1 2:2 3:5 4:8 5:4" />
      <delta>-0.22 ↓</delta>
    </dimension>
  </dimensions>
  <hint>Comparison: 'Version A — emotional approach' (A) vs 'Version B — practical approach' (B). Positive delta = Run B scored higher. * marks statistically notable differences (non-overlapping 95% confidence intervals).</hint>
</panel-comparison>
```

### 3.6 Comparison Example — Detailed Format with Significance Marker

Same runs as above, `response_format="detailed"`. Note the `*` on `purchase_intent` (non-overlapping CIs):

```xml
<panel-comparison run_a_id="f9e1c2d3-..." run_b_id="a4b5c6d7-..." panel_id="a1b2c3d4-..." dimensions_compared="3" format="detailed">
  <run-a>
    <run-id>f9e1c2d3-a4b5-6789-cdef-012345678901</run-id>
    <run-label>Version A — emotional approach</run-label>
    <stimulus type="social_caption">Ang sarap, tipid pa! Lucky Me na naman kasama ko sa hapag-kainan.</stimulus>
    <personas-scored>20</personas-scored>
    <run-date>2026-03-01 14:30 UTC</run-date>
  </run-a>
  <run-b>
    <run-id>a4b5c6d7-e8f9-0123-abcd-456789012345</run-id>
    <run-label>Version B — practical approach</run-label>
    <stimulus type="social_caption">Lucky Me — masustansya, abot-kaya, at pampamilya. ₱8 lang sa tindahan.</stimulus>
    <personas-scored>20</personas-scored>
    <run-date>2026-03-01 14:45 UTC</run-date>
  </run-b>
  <dimensions count="3">
    <dimension name="purchase_intent">
      <run-a mean="3.85" mode="4" distribution="1:1 2:2 3:4 4:9 5:4" std="0.91" ci-95="3.43–4.27" />
      <run-b mean="4.12" mode="4" distribution="1:0 2:1 3:3 4:11 5:5" std="0.76" ci-95="3.77–4.47" />
      <delta>+0.27 ↑ *</delta>
      <run-a-highlights>
        <highlight valence="positive" persona="Maria Santos">I'd definitely grab another pack — we always have Lucky Me at home.</highlight>
        <highlight valence="negative" persona="Celine Vera">I don't buy Lucky Me anymore. I switched to a cheaper brand.</highlight>
      </run-a-highlights>
      <run-b-highlights>
        <highlight valence="positive" persona="Ana Bautista">₱8 is nothing for a whole meal — this makes me want to stock up.</highlight>
        <highlight valence="negative" persona="Rosa Lim">I know it's cheap, but I try not to give my kids too much processed food.</highlight>
      </run-b-highlights>
    </dimension>
    <dimension name="message_clarity">
      <run-a mean="4.40" mode="5" distribution="1:0 2:1 3:2 4:8 5:9" std="0.62" ci-95="4.11–4.69" />
      <run-b mean="4.55" mode="5" distribution="1:0 2:0 3:2 4:7 5:11" std="0.58" ci-95="4.28–4.82" />
      <delta>+0.15 ↑</delta>
    </dimension>
    <dimension name="personal_relevance">
      <run-a mean="4.10" mode="4" distribution="1:0 2:2 3:4 4:9 5:5" std="0.78" ci-95="3.74–4.46" />
      <run-b mean="3.88" mode="4" distribution="1:1 2:2 3:5 4:8 5:4" std="0.84" ci-95="3.49–4.27" />
      <delta>-0.22 ↓</delta>
    </dimension>
  </dimensions>
  <hint>Comparison: 'Version A — emotional approach' (A) vs 'Version B — practical approach' (B). Positive delta = Run B scored higher. * marks statistically notable differences (non-overlapping 95% confidence intervals).</hint>
</panel-comparison>
```

---

## 4. Tool Handler Implementation

```python
# apps/bot/src_v2/mcp/tools/ssr/tools.py

@tool(
    description="""\
Retrieve or compare results from a completed consumer panel run.

Use when a user wants to:
- Look up results from a previous ssr_panel_run (by run_id or panel_id)
- Compare results between two runs to see which marketing asset performed better
- See results in more detail than originally requested (summary → detailed → raw)

This tool is for retrieval only — to run a new panel, use ssr_panel_run.

Results include per-dimension Likert distributions, mean scores, standard
deviations, and qualitative highlights. Comparison mode shows per-dimension
deltas and direction arrows between two runs.

Provide either run_id (specific run) or panel_id (retrieves the most recent
completed run for that panel). At least one is required.

For comparison mode, also provide comparison_run_id — the second run to
compare against. Both runs must belong to the same owner.""",
    tags={Platform.SSR, Action.READ},
)
async def ssr_panel_results(
    tool_context: ToolContext,
    user_context: UserContext,
    db_context: DatabaseContext | None,
    params: PanelResultsInput,
) -> str:
    if db_context is None:
        raise ToolError("Database context required for SSR panel tools.")

    # 1. Resolve primary run (run_id takes precedence over panel_id)
    if params.run_id is not None:
        result_a = api.get_run_results(db_context, params.run_id, user_context.discord_id)
    else:
        # params.panel_id is guaranteed non-None by @model_validator
        result_a = api.get_latest_run_for_panel(
            db_context, params.panel_id, user_context.discord_id
        )

    # 2. Optional comparison
    if params.comparison_run_id is not None:
        result_b = api.get_run_results(
            db_context, params.comparison_run_id, user_context.discord_id
        )
        comparisons = api.compute_dimension_comparisons(result_a, result_b)
        return _fmt_comparison_results(result_a, result_b, comparisons, params.response_format)

    # 3. Single-run retrieval
    return _fmt_retrieved_results(result_a, params.response_format)
```

**Notes**:
- `api.get_run_results()` raises `ToolError` if not found, not owned, or not completed. No try/except needed in handler.
- `api.get_latest_run_for_panel()` raises `ToolError` if panel not found, not owned, or no completed runs.
- `api.compute_dimension_comparisons()` is pure computation — does not raise.
- Handler is intentionally thin: no business logic, no validation beyond what Pydantic handles.

---

## 5. API Layer Implementation

All functions in `apps/bot/src_v2/mcp/tools/ssr/api.py`.

### 5.1 `get_run_results()` — Load Single Run from DB

```python
def get_run_results(
    db: DatabaseContext,
    run_id: str,
    discord_id: str,
) -> "RetrievedRunResult":
    """Load a completed run from the database and reconstruct aggregated results.

    Ownership is verified via the run's discord_id field.

    Steps:
        1. Load ssr_run record — verify ownership and status='completed'
        2. Load ssr_persona rows — for persona names (needed for highlights)
        3. Load ssr_response rows — full response texts per persona
        4. Load ssr_score rows — hard_score + weighted_score per persona × dimension
        5. Reconstruct PersonaResponse list from steps 2–4
        6. Re-run _aggregate_scores() to produce AggregatedDimensionResult list
           (includes highlight re-selection from stored response texts)

    Args:
        db: DatabaseContext providing session_factory().
        run_id: UUID string of the run to retrieve.
        discord_id: Discord user ID — must match the run's discord_id field.

    Returns:
        RetrievedRunResult with all aggregated data reconstructed from DB.

    Raises:
        ToolError: Run not found or not owned by discord_id.
        ToolError: Run status is 'running' (still in progress).
        ToolError: Run status is 'failed' (no results available).
        ToolError: Run status is any other non-'completed' value.
    """
    session = db.session_factory()

    # Step 1: Load run record
    run = ssr_runs_repo.get_by_id(session, run_id)
    if run is None or run.discord_id != discord_id:
        raise ToolError(
            f"Run '{run_id}' not found. "
            f"Use ssr_panel_list to see your available panels and their runs."
        )

    # Check run status
    if run.status == "running":
        raise ToolError(
            f"Run '{run_id}' is still in progress. The panel is still being scored. "
            f"Wait a few seconds and try again."
        )
    if run.status == "failed":
        raise ToolError(
            f"Run '{run_id}' failed and has no results. "
            f"Use ssr_panel_run to start a new run on the same panel."
        )
    if run.status != "completed":
        raise ToolError(
            f"Run '{run_id}' has status '{run.status}' — only completed runs have results."
        )

    # Step 2: Load personas (for names in highlights)
    personas = ssr_personas_repo.list_by_panel(session, run.panel_id)
    persona_by_id: dict[str, "SsrPersonaSummary"] = {p.persona_id: p for p in personas}

    # Step 3: Load response texts
    responses = ssr_responses_repo.list_by_run(session, run_id)
    response_by_persona: dict[str, str] = {r.persona_id: r.response_text for r in responses}

    # Step 4: Load scores
    scores = ssr_scores_repo.list_by_run(session, run_id)

    # Step 5: Group scores by persona, build DimensionScore dicts
    scores_by_persona: dict[str, dict[str, "DimensionScore"]] = {}
    for score_record in scores:
        pid = score_record.persona_id
        if pid not in scores_by_persona:
            scores_by_persona[pid] = {}
        scores_by_persona[pid][score_record.dimension] = DimensionScore(
            hard_score=score_record.hard_score,
            weighted_score=score_record.weighted_score,
            similarities={},  # Not stored in DB — similarity values are diagnostic only
        )

    # Step 6: Reconstruct PersonaResponse list
    persona_responses: list["PersonaResponse"] = []
    for persona_id, dim_scores in scores_by_persona.items():
        persona = persona_by_id.get(persona_id)
        persona_name = persona.name if persona else f"Persona {persona_id[:8]}"
        response_text = response_by_persona.get(persona_id, "")
        persona_responses.append(PersonaResponse(
            persona_id=persona_id,
            persona_name=persona_name,
            response_text=response_text,
            dimension_scores=dim_scores,
        ))

    # Step 7: Re-aggregate using the stored scores
    evaluation_dimensions = [EvaluationDimension(d) for d in run.dimensions]
    aggregated = _aggregate_scores(persona_responses, evaluation_dimensions)

    return RetrievedRunResult(
        run_id=run.id,
        panel_id=run.panel_id,
        run_label=run.run_label,
        stimulus=run.stimulus,
        stimulus_type=run.stimulus_type,
        dimensions=run.dimensions,
        personas_scored=run.personas_scored,
        created_at=run.created_at,
        aggregated_dimensions=aggregated,
        persona_responses=persona_responses,
    )
```

### 5.2 `get_latest_run_for_panel()` — Get Most Recent Completed Run

```python
def get_latest_run_for_panel(
    db: DatabaseContext,
    panel_id: str,
    discord_id: str,
) -> "RetrievedRunResult":
    """Retrieve the most recent completed run for a panel.

    Verifies panel ownership first, then finds the latest completed run.

    Args:
        db: DatabaseContext providing session_factory().
        panel_id: UUID string of the panel.
        discord_id: Discord user ID — must match the panel's discord_id field.

    Returns:
        RetrievedRunResult for the latest completed run.

    Raises:
        ToolError: Panel not found or not owned by discord_id.
        ToolError: Panel has no completed runs.
    """
    session = db.session_factory()

    # Verify panel ownership
    panel = ssr_panels_repo.get_by_id(session, panel_id)
    if panel is None or panel.discord_id != discord_id:
        raise ToolError(
            f"Panel '{panel_id}' not found. "
            f"Use ssr_panel_list to see your available panels."
        )

    # Find latest completed run
    latest_run = ssr_runs_repo.get_latest_completed_for_panel(session, panel_id)
    if latest_run is None:
        raise ToolError(
            f"No completed runs found for panel '{panel_id}'. "
            f"Use ssr_panel_run with panel_id='{panel_id}' to test a marketing asset."
        )

    # Delegate to get_run_results() — already has all the loading logic
    return get_run_results(db, latest_run.id, discord_id)
```

### 5.3 `compute_dimension_comparisons()` — Delta Calculation

```python
def compute_dimension_comparisons(
    result_a: "RetrievedRunResult",
    result_b: "RetrievedRunResult",
) -> list["DimensionComparison"]:
    """Compute per-dimension deltas between two runs.

    Only dimensions present in BOTH runs are compared. Dimensions unique to
    one run are silently excluded — the hint in _fmt_comparison_results() notes them.

    Dimensions are returned in result_a's order — dimensions only in result_b
    are appended in result_b's order after all shared dimensions.

    Delta: run_b.mean - run_a.mean (positive = B is higher than A).

    Significance test: non-overlapping 95% confidence intervals.
    Conservative but interpretable without statistics expertise.

    Args:
        result_a: Primary run ("baseline" — A).
        result_b: Comparison run (B).

    Returns:
        List of DimensionComparison, one per dimension present in both runs.
        Ordered by result_a.aggregated_dimensions order.
    """
    # Index result_b dimensions by name
    b_by_dim: dict[str, "AggregatedDimensionResult"] = {
        r.dimension.value: r for r in result_b.aggregated_dimensions
    }

    comparisons: list["DimensionComparison"] = []
    for dim_a in result_a.aggregated_dimensions:
        dim_name = dim_a.dimension.value
        if dim_name not in b_by_dim:
            continue  # Dimension not in both runs — skip

        dim_b = b_by_dim[dim_name]
        delta_mean = round(dim_b.mean - dim_a.mean, 4)

        # Direction arrow
        if abs(delta_mean) < 0.05:
            direction = "→"   # Negligible (<0.05 on a 5-point scale)
        elif delta_mean > 0:
            direction = "↑"   # B scored higher
        else:
            direction = "↓"   # B scored lower

        # Non-overlapping 95% CI significance check
        ci_a_low, ci_a_high = dim_a.confidence_interval_95
        ci_b_low, ci_b_high = dim_b.confidence_interval_95
        significant = (ci_a_high < ci_b_low) or (ci_b_high < ci_a_low)

        comparisons.append(DimensionComparison(
            dimension=dim_name,
            run_a=dim_a,
            run_b=dim_b,
            delta_mean=delta_mean,
            delta_direction=direction,
            significant=significant,
        ))

    return comparisons
```

**Direction threshold rationale**: A delta of <0.05 on a 5-point Likert scale is within the noise floor of the embedding similarity step. Differences of 0.05–0.15 are marginal. Differences >0.25 are practically meaningful. The `*` marker (non-overlapping CIs) provides a separate, statistically grounded signal for noteworthy differences.

---

## 6. Data Models

### 6.1 `RetrievedRunResult` — DB-Reconstructed Run (in `models.py`)

```python
# apps/bot/src_v2/mcp/tools/ssr/models.py

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class RetrievedRunResult:
    """Results reconstructed from DB for a completed run.

    Parallel to PanelRunResult (used inline during ssr_panel_run) but includes
    run metadata fields (run_label, stimulus, stimulus_type, created_at) that are
    stored in ssr_run and not in PanelRunResult.

    Used by ssr_panel_results for single-run retrieval and comparison mode.
    """
    run_id: str                              # UUID of the ssr_run row
    panel_id: str                            # UUID of the parent ssr_panel row
    run_label: str                           # Human-readable run label
    stimulus: str                            # Full stimulus text as submitted
    stimulus_type: str                       # StimulusType.value, e.g. "social_caption"
    dimensions: list[str]                    # List of EvaluationDimension.value strings
    personas_scored: int                     # Count of personas that successfully scored
    created_at: datetime                     # Timestamp of the run (UTC)
    aggregated_dimensions: list["AggregatedDimensionResult"]  # Re-aggregated from stored scores
    persona_responses: list["PersonaResponse"]  # Reconstructed from ssr_response + ssr_score tables
```

### 6.2 `DimensionComparison` — Per-Dimension Delta (in `models.py`)

```python
@dataclass
class DimensionComparison:
    """Comparison data for one evaluation dimension between two runs.

    Produced by compute_dimension_comparisons() — used in _fmt_comparison_results().

    Fields:
        dimension: EvaluationDimension.value string, e.g. 'purchase_intent'.
        run_a: Aggregated results for the primary run (the baseline).
        run_b: Aggregated results for the comparison run.
        delta_mean: run_b.mean - run_a.mean. Positive = B is higher than A.
            Range: approximately [-4.0, 4.0]. Practically meaningful if |delta| > 0.25.
        delta_direction: Direction arrow string.
            '↑' = B is higher (delta > 0.05).
            '↓' = B is lower (delta < -0.05).
            '→' = negligible difference (|delta| <= 0.05).
        significant: True if the 95% CIs for A and B do not overlap.
            Non-overlapping CIs = the difference is statistically notable
            for this panel size. Marked with '*' in the formatted output.
    """
    dimension: str
    run_a: "AggregatedDimensionResult"
    run_b: "AggregatedDimensionResult"
    delta_mean: float
    delta_direction: str   # One of: '↑', '↓', '→'
    significant: bool
```

### 6.3 `SsrRunRecord` — DB Row Model (in `models.py`)

```python
@dataclass
class SsrRunRecord:
    """Row from the ssr_run table. Returned by ssr_runs_repo functions."""

    id: str                      # UUID PK
    panel_id: str                # FK → ssr_panel.id
    discord_id: str              # Owner's Discord user ID — for ownership verification
    stimulus: str                # Full stimulus text
    stimulus_type: str           # StimulusType.value string
    dimensions: list[str]        # Ordered list of EvaluationDimension.value strings
    run_label: str               # Human-readable label (auto-generated if not provided)
    status: str                  # 'running' | 'completed' | 'failed'
    personas_scored: int         # 0 until status='completed', then actual count
    dimension_means: dict[str, float]  # {dim_name: mean} for completed runs — for quick lookup
    created_at: datetime         # TIMESTAMPTZ of INSERT
    completed_at: datetime | None  # TIMESTAMPTZ of status update to 'completed', None if not complete
```

### 6.4 `SsrScoreRecord` — DB Row Model (in `models.py`)

```python
@dataclass
class SsrScoreRecord:
    """Row from the ssr_score table. One row per (persona, dimension) pair per run."""

    id: str             # UUID PK
    run_id: str         # FK → ssr_run.id
    persona_id: str     # FK → ssr_persona.id
    dimension: str      # EvaluationDimension.value string, e.g. 'purchase_intent'
    hard_score: int     # Argmax Likert score (1–5)
    weighted_score: float  # Softmax-weighted mean Likert score ([1.0, 5.0])
    created_at: datetime   # TIMESTAMPTZ of INSERT
```

### 6.5 `SsrResponseRecord` — DB Row Model (in `models.py`)

```python
@dataclass
class SsrResponseRecord:
    """Row from the ssr_response table. One row per persona per run."""

    id: str              # UUID PK
    run_id: str          # FK → ssr_run.id
    persona_id: str      # FK → ssr_persona.id
    response_text: str   # Full free-text response from Claude Haiku (not truncated)
    created_at: datetime  # TIMESTAMPTZ of INSERT
```

---

## 7. Validation Rules

| Rule | Where Enforced | Error Text |
|------|---------------|------------|
| `db_context` is not None | Tool handler first line | `"Database context required for SSR panel tools."` |
| At least one of `run_id` or `panel_id` provided | `@model_validator` on `PanelResultsInput` | `"Provide either run_id (specific run) or panel_id (most recent run). Both cannot be null."` |
| `run_id` run exists and belongs to user | `api.get_run_results()` | `"Run '{id}' not found. Use ssr_panel_list to see your available panels and their runs."` |
| `run_id` run is completed | `api.get_run_results()` | (see status-specific messages in §8) |
| `panel_id` panel exists and belongs to user | `api.get_latest_run_for_panel()` | `"Panel '{id}' not found. Use ssr_panel_list to see your available panels."` |
| `panel_id` has at least one completed run | `api.get_latest_run_for_panel()` | `"No completed runs found for panel '{id}'. Use ssr_panel_run with panel_id='{id}' to test a marketing asset."` |
| `comparison_run_id` run exists and belongs to user | `api.get_run_results()` called for comparison run | `"Run '{comparison_id}' not found. Use ssr_panel_list to see your available panels and their runs."` |
| `comparison_run_id` run is completed | `api.get_run_results()` called for comparison run | (see status-specific messages in §8) |
| `response_format` is valid enum value | Pydantic enum validation | Pydantic default |

---

## 8. Error Cases

| Scenario | Error Type | Message |
|----------|-----------|---------|
| `db_context` is `None` | `ToolError` | `"Database context required for SSR panel tools."` |
| Both `run_id` and `panel_id` are `None` | `ToolError` (Pydantic) | `"Provide either run_id (specific run) or panel_id (most recent run). Both cannot be null."` |
| `run_id` not found or wrong owner | `ToolError` | `"Run '{id}' not found. Use ssr_panel_list to see your available panels and their runs."` |
| `comparison_run_id` not found or wrong owner | `ToolError` | `"Run '{comparison_id}' not found. Use ssr_panel_list to see your available panels and their runs."` |
| Run status is `'running'` | `ToolError` | `"Run '{id}' is still in progress. The panel is still being scored. Wait a few seconds and try again."` |
| Run status is `'failed'` | `ToolError` | `"Run '{id}' failed and has no results. Use ssr_panel_run to start a new run on the same panel."` |
| Run status is other non-`'completed'` value | `ToolError` | `"Run '{id}' has status '{status}' — only completed runs have results."` |
| `panel_id` not found or wrong owner | `ToolError` | `"Panel '{id}' not found. Use ssr_panel_list to see your available panels."` |
| `panel_id` has no completed runs | `ToolError` | `"No completed runs found for panel '{id}'. Use ssr_panel_run with panel_id='{id}' to test a marketing asset."` |
| Comparison runs have no shared dimensions | Not an error — returns comparison with 0 dimensions and a hint | Hint: `"These runs have no evaluation dimensions in common. Run A measured: [...]. Run B measured: [...]."` |

**Note on comparison with 0 shared dimensions**: This is an unusual edge case (user compared runs with completely different dimension sets). It is not an error — the tool returns an empty `<dimensions count="0">` with a helpful hint listing what each run measured.

---

## 9. DB Operations

### 9.1 Reads

```python
# Step 1: Load run record (with discord_id for ownership verification)
run = ssr_runs_repo.get_by_id(session, run_id)
# SQL: SELECT id, panel_id, discord_id, stimulus, stimulus_type, dimensions,
#             run_label, status, personas_scored, dimension_means, created_at, completed_at
#      FROM ssr_run
#      WHERE id = :run_id

# Step 2: Load personas for the panel
personas = ssr_personas_repo.list_by_panel(session, run.panel_id)
# SQL: SELECT id, panel_id, panel_index, name, age, location, occupation, ...
#      FROM ssr_persona
#      WHERE panel_id = :panel_id
#      ORDER BY panel_index ASC

# Step 3: Load response texts
responses = ssr_responses_repo.list_by_run(session, run_id)
# SQL: SELECT id, run_id, persona_id, response_text, created_at
#      FROM ssr_response
#      WHERE run_id = :run_id

# Step 4: Load scores
scores = ssr_scores_repo.list_by_run(session, run_id)
# SQL: SELECT id, run_id, persona_id, dimension, hard_score, weighted_score, created_at
#      FROM ssr_score
#      WHERE run_id = :run_id
```

**For `get_latest_run_for_panel()`**: One additional query:

```python
latest_run = ssr_runs_repo.get_latest_completed_for_panel(session, panel_id)
# SQL: SELECT id, panel_id, discord_id, stimulus, stimulus_type, dimensions,
#             run_label, status, personas_scored, dimension_means, created_at, completed_at
#      FROM ssr_run
#      WHERE panel_id = :panel_id
#        AND status = 'completed'
#      ORDER BY completed_at DESC
#      LIMIT 1
```

### 9.2 Writes

`ssr_panel_results` is a **read-only tool** — it makes zero writes to the database.

---

## 10. Repository Functions Required

The following repository functions must exist:

```python
# db/repositories/ssr_runs.py

def get_by_id(session: Session, run_id: str) -> SsrRunRecord | None:
    """Load one ssr_run row by primary key. Returns None if not found."""

def get_latest_completed_for_panel(session: Session, panel_id: str) -> SsrRunRecord | None:
    """Load the most recently completed run for a panel.

    Returns None if no completed runs exist for this panel.
    Orders by completed_at DESC, LIMIT 1, WHERE status = 'completed'.
    """
```

```python
# db/repositories/ssr_scores.py

def list_by_run(session: Session, run_id: str) -> list[SsrScoreRecord]:
    """Load all ssr_score rows for a run.

    Returns all (persona × dimension) scores for the run, unordered.
    For a 20-persona, 3-dimension run: returns 60 rows.
    Empty list if no scores exist (e.g. run was never completed).
    """
```

```python
# db/repositories/ssr_responses.py

def list_by_run(session: Session, run_id: str) -> list[SsrResponseRecord]:
    """Load all ssr_response rows for a run.

    Returns one row per persona. Full response_text — not truncated.
    For a 20-persona run: returns 20 rows.
    Empty list if no responses exist.
    """
```

---

## 11. Cross-Correction to `panel-run.md`

The `ssr_panel_results` tool requires ownership verification of runs via `run.discord_id`. However, the `ssr_runs_repo.create()` call in `panel-run.md` Section 4 does NOT include `discord_id`:

```python
# Current (in panel-run.md) — MISSING discord_id:
ssr_runs_repo.create(
    session,
    run_id=run_id,
    panel_id=params.panel_id,
    stimulus=params.stimulus,
    ...
)
```

**Required correction**: Add `discord_id` to the `create()` call:

```python
# Corrected — includes discord_id:
ssr_runs_repo.create(
    session,
    run_id=run_id,
    panel_id=params.panel_id,
    discord_id=user_context.discord_id,  # ← ADD THIS
    stimulus=params.stimulus,
    stimulus_type=params.stimulus_type.value,
    dimensions=[d.value for d in params.evaluation_dimensions],
    run_label=run_label,
    status="running",
)
```

This also means:
1. `ssr_run` table must have a `discord_id TEXT NOT NULL` column (see `supabase-schema.md` — add this column when specifying `ssr_run`)
2. `ssr_runs_repo.create()` must accept `discord_id: str` as a parameter
3. `SsrRunRecord` dataclass includes `discord_id: str` (already specified in §6.3 above)

Additionally, the `ssr_runs_repo.update_status()` call should set `completed_at = NOW()` when marking a run as `'completed'`:

```python
# Corrected update_status call (add completed_at):
ssr_runs_repo.update_status(
    session,
    run_id,
    "completed",
    personas_scored=result.personas_scored,
    dimension_means={d.dimension.value: d.mean for d in result.aggregated_dimensions},
    completed_at=datetime.now(tz=timezone.utc),  # ← ADD THIS for get_latest_completed_for_panel ordering
)
```

---

## 12. Edge Cases

### 12.1 Comparison with 0 Shared Dimensions

When `compute_dimension_comparisons()` finds no dimensions in common between two runs:

```python
# In _fmt_comparison_results(), detect this case:
if not comparisons:
    dims_a_names = [d.dimension.value for d in result_a.aggregated_dimensions]
    dims_b_names = [d.dimension.value for d in result_b.aggregated_dimensions]
    parts.append(
        hint(
            f"These runs have no evaluation dimensions in common and cannot be compared. "
            f"Run A measured: {dims_a_names}. "
            f"Run B measured: {dims_b_names}. "
            f"Run both panels with at least one shared dimension to compare."
        )
    )
```

### 12.2 Partially-Scored Personas

If some personas failed during `ssr_panel_run` (partial success), `ssr_score` rows exist only for successful personas. The reconstruction in `get_run_results()` naturally handles this — it groups scores by `persona_id` and only creates `PersonaResponse` for personas that have scores. The `PersonaResponse` count will match `run.personas_scored` (which was set to the actual scored count, not the full panel size).

### 12.3 Comparison Between Panels (Different panel_id)

The comparison mode does NOT validate that both runs belong to the same panel. A user may legitimately compare runs from two different panels (e.g., "Filipino moms panel" vs "Gen Z panel" with the same stimulus). The `panel_id` in `<panel-comparison>` is set to `result_a.panel_id`. If `panel_id` differs between runs, the attributes will reflect Run A's panel.

---

## 13. Cross-References

- [panel-run.md](panel-run.md) — `ssr_panel_run` tool; `PanelRunResult`, `AggregatedDimensionResult`, `PersonaResponse`, `DimensionScore`, `HighlightQuote`, `_fmt_dimension_result()`, `_fmt_persona_raw()` (reused here); **cross-correction**: add `discord_id` to `ssr_runs_repo.create()` and `completed_at` to `update_status()`
- [panel-create.md](panel-create.md) — `ssr_panel_create` tool; `ssr_panels_repo.get_by_id()` used in `get_latest_run_for_panel()`
- [scoring-aggregation.md](../pipeline/scoring-aggregation.md) — `_aggregate_scores()` is called during results reconstruction; `DimensionScore`, `PersonaResponse` dataclasses
- [supabase-schema.md](../data-model/supabase-schema.md) — `ssr_run` table (must include `discord_id`, `completed_at`); `ssr_score` table; `ssr_response` table
- [pydantic-models.md](../data-model/pydantic-models.md) — `PanelResultsInput`, `RetrievedRunResult`, `DimensionComparison`, `SsrRunRecord`, `SsrScoreRecord`, `SsrResponseRecord` type definitions
- [discord-ux.md](../integration/discord-ux.md) — Panel results rendering in Discord threads (single-run and comparison format sizing)
- [tool-system.md](../existing-patterns/tool-system.md) — `@tool` decorator, `ToolDef`, `ToolError`, context objects
- [reference-tools.md](../existing-patterns/reference-tools.md) — `api.py` synchronous pattern, `_fmt_*()` pure function convention, DB check pattern
