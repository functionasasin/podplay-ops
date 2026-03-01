# `ssr_panel_results` — Tool Specification

> Status: Stub (w1-ssr-primitives). Full specification: w2-tool-panel-results.

---

## Established From w1-ssr-primitives

**Tool name (function name)**: `ssr_panel_results`
**Tags**: `{Platform.SSR, Action.READ}`
**requires_credential**: None
**db_context**: Required (raises ToolError if None)
**Owner verification**: Verify run belongs to requesting discord_id

**Responsibility**: Retrieve and format results for a completed run. Optionally compare two runs.
`ssr_panel_run` already returns results — this tool is for later retrieval or comparison.

**Internal call chain**:
```
ssr_panel_results (tool handler)
  ├── [if run_id provided]:
  │     └── api.get_run_results(db, run_id, discord_id) → SsrRunResult
  ├── [if panel_id provided (no run_id)]:
  │     └── api.get_latest_run_for_panel(db, panel_id, discord_id) → SsrRunResult
  ├── [if comparison_run_id provided]:
  │     └── api.get_run_results(db, comparison_run_id, discord_id) → SsrRunResult (second)
  │     └── _compute_deltas(result_1, result_2) → ComparisonResult
  └── _fmt_results(result, format) OR _fmt_comparison(comparison, format)
```

**What to specify in w2-tool-panel-results**:
- [ ] Full MCP input schema (panel_id | run_id — at least one required; format; comparison_run_id)
- [ ] Full MCP output schema (run metadata, per-dimension results, comparison deltas if applicable)
- [ ] Discord output format by format level (summary: 1 table; detailed: full distribution + quotes; raw: JSON-like)
- [ ] Comparison delta computation: delta_mean per dimension, direction arrows (↑↓), significance note
- [ ] Error cases (run_id not found, run not completed, no runs for panel_id)
- [ ] Output formatters: _fmt_run_results(), _fmt_comparison_results()
- [ ] Cross-write to integration/discord-ux.md

---

## Cross-References

- [ssr-primitives.md](../existing-patterns/ssr-primitives.md) — Section 1.3 (ssr_panel_results)
- [discord-ux.md](../integration/discord-ux.md) — Discord result rendering (pending)
- [pydantic-models.md](../data-model/pydantic-models.md) — SsrRunResult, DimensionAggregate (pending)
