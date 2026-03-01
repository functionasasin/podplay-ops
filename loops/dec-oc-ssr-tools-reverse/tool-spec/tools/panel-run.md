# `ssr_panel_run` — Tool Specification

> Status: Stub (w1-ssr-primitives). Full specification: w2-tool-panel-run.

---

## Established From w1-ssr-primitives

**Tool name (function name)**: `ssr_panel_run`
**Tags**: `{Platform.SSR, Action.WRITE}`
**requires_credential**: None
**db_context**: Required (raises ToolError if None)
**Owner verification**: Load panel by panel_id + discord_id; raise ToolError if not found

**Responsibility**: Execute the full SSR pipeline against a stimulus. Blocking/synchronous.
Returns complete results (not a job ID).

**Internal call chain**:
```
ssr_panel_run (tool handler)
  └── api.run_ssr_pipeline(db, tool_ctx, panel_id, discord_id, stimulus_text, stimulus_type, evaluation_dimensions)
        ├── db: verify panel ownership
        ├── db: load ssr_persona rows for panel
        ├── db: load ssr_anchor_set rows for requested dimensions
        ├── db insert: ssr_run (status=pending) → run_id
        ├── db insert: ssr_stimulus
        ├── api._run_all_personas() [asyncio.gather over all personas]
        │     └── api._run_single_persona() × N
        │           ├── api._elicit_response() [calls Claude claude-haiku-4-5-20251001 with persona system prompt]
        │           ├── api._embed_text() [calls embedding model — see embedding-options.md]
        │           └── _score_response() [cosine similarity → softmax → expected value]
        ├── db bulk insert: ssr_response × N
        ├── db bulk insert: ssr_score × (N × D)  [D = number of evaluation dimensions]
        ├── aggregate over scores: distributions, means, std devs, highlights
        ├── db update: ssr_run status=completed
        └── return SsrRunResult
```

**Concurrency**: `asyncio.gather(*tasks, return_exceptions=True)`. Partial success ≥80% personas OK.

**Scoring algorithm**:
1. `sim_k = cosine(response_embedding, anchor_k_embedding)` for k=1..scale_points
2. `p_k = softmax([sim_1..sim_K], temperature=1.0)[k]`
3. `score = sum(k * p_k for k in range(1, scale_points+1))`

**LLM model**: `claude-haiku-4-5-20251001` for elicitation

**What to specify in w2-tool-panel-run**:
- [ ] Full MCP input schema (panel_id, stimulus_text, stimulus_type enum, evaluation_dimensions, response_format)
- [ ] Full MCP output schema (run_id, per-dimension results, failed_persona_count, total_cost_usd)
- [ ] Stimulus presentation system + user prompt (full text, by stimulus_type)
- [ ] Response elicitation prompt (full text)
- [ ] Validation rules (stimulus_text max length, valid dimension names, panel must exist and be owned by user)
- [ ] Error cases (panel not found, invalid dimension, embedding failure, <80% persona completion)
- [ ] Output formatter: _fmt_run_results()
- [ ] Cross-write to pipeline/stimulus-presentation.md, pipeline/response-elicitation.md, pipeline/scoring-aggregation.md

---

## Cross-References

- [ssr-primitives.md](../existing-patterns/ssr-primitives.md) — Section 1.3, Section 2, Section 4
- [embedding-options.md](../existing-patterns/embedding-options.md) — Embedding model (pending)
- [anchor-statements.md](../pipeline/anchor-statements.md) — Anchor text + dimension names (pending)
- [scoring-aggregation.md](../pipeline/scoring-aggregation.md) — Full scoring algorithm (pending)
