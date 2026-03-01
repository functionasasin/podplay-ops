# `ssr_panel_list` + `ssr_panel_delete` — Tool Specifications

> Status: Stub (w1-ssr-primitives). Full specification: w2-tool-panel-manage (add to frontier if needed).

---

## Established From w1-ssr-primitives

### `ssr_panel_list`

**Tool name (function name)**: `ssr_panel_list`
**Tags**: `{Platform.SSR, Action.READ}`
**requires_credential**: None
**db_context**: Required

**Responsibility**: List all panels owned by the requesting user. Discovery tool for when user doesn't know their panel_id.

**Internal call chain**:
```
ssr_panel_list (tool handler)
  └── api.list_panels(db, discord_id, limit, offset) → list[SsrPanelSummary]
        └── db: query ssr_panel WHERE discord_id=?, join run count from ssr_run
  └── _fmt_panel_list(panels)
```

**What to specify (w2)**:
- [ ] Full MCP input schema (limit 1-50 default 10, offset 0+)
- [ ] Full MCP output schema (panel list with id, name, size, product_category, created_at, run_count)
- [ ] Output formatter: _fmt_panel_list()
- [ ] Pagination hint pattern (from reference-tools.md)
- [ ] Empty case: hint("You have no panels. Use ssr_panel_create to create one.")

---

### `ssr_panel_delete`

**Tool name (function name)**: `ssr_panel_delete`
**Tags**: `{Platform.SSR, Action.WRITE}`
**requires_credential**: None
**db_context**: Required

**Responsibility**: Delete a panel and all associated data (personas, runs, responses, scores).

**Internal call chain**:
```
ssr_panel_delete (tool handler)
  └── api.delete_panel(db, panel_id, discord_id) → SsrDeleteResult
        ├── db: verify ownership (ToolError if not found/not owner)
        └── db: DELETE ssr_panel WHERE id=? AND discord_id=? CASCADE
              [cascades to ssr_persona, ssr_run → ssr_response → ssr_score]
  └── _fmt_delete_result(result)
```

**Design note**: Deletion is cascaded at the DB level via foreign key constraints with `ON DELETE CASCADE`.
The tool does NOT issue individual deletes per child table.

**What to specify (w2)**:
- [ ] Full MCP input schema (panel_id)
- [ ] Full MCP output schema (panel_id, personas_deleted, runs_deleted, confirmation message)
- [ ] Error case: panel_id not found OR belongs to different user → same ToolError ("Panel not found") — do not distinguish between missing and wrong-owner for security
- [ ] Output formatter: _fmt_delete_result()

---

## Cross-References

- [ssr-primitives.md](../existing-patterns/ssr-primitives.md) — Section 1.3 (tool inventories)
- [supabase-schema.md](../data-model/supabase-schema.md) — CASCADE constraints on ssr_panel FK (pending)
