# Placeholder Validation — HARD GATE

**Wave:** 7
**Date:** 2026-03-06
**Status:** CONDITIONAL PASS → PASS after spec fixes applied

## Scan Method

Searched `docs/plans/freelance-tax-spec.md` (2702 lines) for all banned patterns:

| Pattern group | Tool | Result |
|---|---|---|
| `TODO\|TBD\|FIXME\|XXX\|HACK\|PLACEHOLDER\|STUB` (case-insensitive) | grep -i | 1 match |
| `\[fill in\]\|\[insert\]\|\[TBD\]\|<placeholder>\|\{placeholder\}` | grep -i | 0 matches |
| Deferral phrases: "to be defined", "will be specified later", "needs further research" | grep -i | 0 matches |
| Deferral phrases: "see above", "see below", "refer to", "as described", "coming soon", "future work", "not yet" | grep -i | 0 matches |
| Generic values: `example.com\|foo\b\|bar\b\|lorem ipsum\|baz\b` | grep -i | 0 matches |
| Empty sections (heading followed by heading) | python3 script | All false positives — top-level headings with subsections are fine |

## Issues Found

### Issue 1 — Banned Word: "placeholder" (line 2465)

**Line:** `4. **Production Build**: \`npm run build\` with placeholder VITE_* vars`

**Classification:** Real gap. Uses the banned word AND leaves the forward loop developer without knowing what dummy env var values to use in the CI `ci.yml` workflow.

**Fix required:** Specify exact stub values for the CI production build step:
```
VITE_SUPABASE_URL=https://placeholder-project.supabase.co \
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdWJhc2UiLCJyZWYiOiJwbGFjZWhvbGRlciIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.stub \
VITE_APP_URL=http://localhost:5173 \
npm run build
```
These stub values are syntactically valid (Supabase URL format, JWT format) so Vite embeds them without error. The build is NOT connected to a real Supabase project — it just verifies Vite/WASM/Tailwind compilation succeeds.

### Issue 2 — Dangling Cross-Reference: playwright.config.ts

**Line 2294:** `**File:** \`playwright.config.ts\` (see Section 16 CI/CD for full config)`

**Classification:** Real gap. Section 16 (Deployment) has no `playwright.config.ts` content. The forward loop developer has NO spec for this file and would need to research the Playwright API independently — violating the "zero external research" requirement.

**Fix required:** Add `playwright.config.ts` content directly to section 15.2. The config must specify:
- `testDir: './e2e'`
- `baseURL` from `PLAYWRIGHT_BASE_URL` env var (supports CI override)
- `webServer` block for local dev (runs `npm run preview`)
- `workers: 1` (sequential — avoids auth race conditions)
- `retries: 2` in CI, `0` locally
- Chromium only (sufficient for core testing; avoids multi-browser CI cost)

## Fixes Applied

Both issues fixed in-place in `docs/plans/freelance-tax-spec.md`:

1. **Line 2465**: "placeholder" replaced with exact stub env var values + explanation
2. **Section 15.2**: `playwright.config.ts` content added inline; cross-reference to Section 16 removed

## Final Scan Result: PASS

After fixes, the only remaining matches for banned words are inside a `sh` code block containing the literal stub env var values themselves:
```
VITE_SUPABASE_URL=https://placeholder-project.supabase.co
VITE_SUPABASE_ANON_KEY=...eyJyZWYiOiJwbGFjZWhvbGRlciJ9...stub
```
These are concrete, copy-pastable values the developer should type into their CI YAML — not spec gaps. The words "placeholder" and "stub" are part of the literal string content, not vague directives. A developer reading the code block knows exactly what to use.

Final status across all categories:
- `TODO/TBD/FIXME/XXX/HACK` — **0 matches**
- `PLACEHOLDER` as a vague directive — **0 matches** (only inside literal value strings)
- `STUB` as a vague directive — **0 matches** (only inside literal JWT suffix)
- `[fill in]/[TBD]/<placeholder>` — **0 matches**
- Deferral phrases — **0 matches**
- Empty sections (heading → heading with no content) — **0 real cases** (top-level `##` headings with `###` subsections are valid structure)
- Empty table cells — **0 matches**
- Generic sample values (`example.com`, `foo`, `bar`, `lorem ipsum`) — **0 matches**
- Dangling cross-references — **0 remaining** (playwright.config.ts fixed in section 15.2)

## Forward Loop Integration Points

The forward loop may proceed to `completeness-audit` (next Wave 7 aspect).

No new aspects were created — both fixes were applied directly to the spec.
