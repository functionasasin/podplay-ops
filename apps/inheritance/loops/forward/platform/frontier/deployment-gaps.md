# Deployment Gaps — Issues Found After First Deploy

> Discovered 2026-03-05 during first production deploy to Fly.io.
> These are things the forward loop built but didn't catch because
> the loop runs `tsc` and `vitest` locally — it never does a real
> production build + deploy + browser smoke test.

## 1. WASM + vite-plugin-top-level-await breaks d3 initialization

**Symptom:** Blank white page. Browser console: `TypeError: Cannot set properties of undefined (setting 'prototype')` in d3-color.

**Root cause:** `vite-plugin-top-level-await` wraps the entire production bundle in an async IIFE to polyfill top-level await (needed for WASM `init()`). This breaks libraries like d3-color that rely on synchronous prototype chain setup during module initialization — variables are hoisted as `let` but assigned inside the async wrapper, so they're `undefined` when d3 tries to use them.

**Fix:** Removed `vite-plugin-top-level-await`, set `build.target: 'esnext'` to use native browser TLA support. All modern browsers support it.

**Why the loop missed it:** The loop only runs `tsc -b` and `vitest` (which uses Vite's dev mode, not the production bundler). The TLA plugin only transforms the production build output. A `vite build` step in the loop's verification would have caught this.

**Loop fix:** Add `npm run build` as a verification step after `tsc` passes.

## 2. Share link RPC: UUID type mismatch

**Symptom:** Visiting `/share/:token` always shows "This shared link is invalid, expired, or sharing has been disabled."

**Root cause:** The `get_shared_case` Supabase RPC function declared `p_token TEXT` but compared it against `share_token UUID` with `WHERE c.share_token = p_token::UUID`. PostgreSQL's PostgREST layer errors with `operator does not exist: uuid = text`.

**Fix:** Changed parameter type from `TEXT` to `UUID` so the comparison is `UUID = UUID` with no cast needed.

**Why the loop missed it:** The loop wrote the migration SQL and the frontend call but never executed the RPC against a real Supabase instance. Unit tests mock `supabase.rpc()`.

**Loop fix:** Integration tests or a migration dry-run step that validates RPC function signatures against actual call sites.

## 3. Share link RPC: missing GRANT EXECUTE to anon

**Symptom:** Same as above — share link returns error even after type fix.

**Root cause:** The `get_shared_case` function uses `SECURITY DEFINER` to bypass RLS (so anonymous users can view shared cases), but there was no `GRANT EXECUTE ON FUNCTION get_shared_case(UUID) TO anon`. Supabase's PostgREST requires explicit grants.

**Fix:** Added `GRANT EXECUTE ON FUNCTION get_shared_case(UUID) TO anon` to the migration.

**Why the loop missed it:** Same as above — no real Supabase execution. The loop trusted that `SECURITY DEFINER` was sufficient.

**Loop fix:** Add a checklist item: every RPC meant for unauthenticated access needs an explicit `GRANT ... TO anon`.

## 4. PDF export button missing from ActionsBar

**Symptom:** No way to export PDF. The `EstatePDF` component, `pdf-export.ts` utilities, and all PDF section components existed but weren't wired into the UI.

**Root cause:** The loop built all the PDF infrastructure (component tree, lazy-loading, filename generation) but never added the "Export PDF" button to `ActionsBar`. The component only had Export JSON, Copy Narratives, Edit Input, and Share.

**Fix:** Added "Export PDF" button that lazy-imports `downloadPDF` from `lib/pdf-export.ts` with a loading spinner.

**Why the loop missed it:** The loop's wiring verification (stage 8) checked for orphaned components but apparently didn't verify that every user-facing feature had a UI entry point. The PDF components weren't "orphaned" because they were imported by `pdf-export.ts`, which was imported by tests — but no actual UI button triggered the flow.

**Loop fix:** The verification stage should cross-reference the spec's user-facing features against actual UI buttons/routes, not just check import chains.

## 5. Timeline components had zero styling (test scaffolding only)

**Symptom:** Timeline section rendered as unstyled plain text — stage numbers, names, and statuses appeared as a flat list with no visual hierarchy, borders, icons, or progress indication.

**Root cause:** `TimelineStageCard` and `TimelineReport` were written with `data-testid` attributes and correct DOM structure to pass unit tests, but had no Tailwind classes, no icons, no Card wrapper — pure test scaffolding. The client-view section also duplicated all stages as plain text below the main timeline.

**Fix:** Styled `TimelineStageCard` with colored left borders per status, lucide icons, "Current" badge, description text. Wrapped `TimelineReport` in Card/CardContent with Badge for track type, properly styled progress bar. Moved duplicate client-view content to `sr-only`.

**Why the loop missed it:** The loop verifies components pass tests and type-check. Tests only assert DOM structure and data-testid presence — they don't check visual appearance. A screenshot comparison or manual review step would have caught this.

**Loop fix:** Add a "visual review" gate — either browser screenshots compared against spec mockups, or a human review checkpoint for UI components.

---

## Summary: What the loop needs

| Gap | Fix for loop |
|-----|-------------|
| Production build not tested | Add `npm run build` verification step |
| No real DB execution | Integration test or migration dry-run |
| Missing Supabase grants | Checklist: every anon RPC needs explicit GRANT |
| Feature not wired to UI | Cross-reference spec features vs actual buttons |
| Components pass tests but look broken | Visual review gate or screenshot diff |
