# Fill E2E Specs — Gap Fill for Section 15.2

**Wave:** 7.5 (Spec Gap Fills)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** completeness-audit (FAIL for E2E detail), playwright-e2e-specs.md

---

## What This Fills

The completeness audit identified Section 15.2 as FAIL:
- Only had a high-level table of 5 test files with one-line descriptions
- Missing: exact test steps, assertions, data-testid selectors, test fixtures
- Missing: error handling scenarios, responsive tests, orphan verification script
- Missing: CI integration order, environment setup, critical traps

This aspect merges the full content of `analysis/playwright-e2e-specs.md` into Section 15.2 of `docs/plans/freelance-tax-spec.md`.

---

## Content Merged

From `analysis/playwright-e2e-specs.md`:

1. **Complete `playwright.config.ts`** — with `video: 'retain-on-failure'`, `E2E_BASE_URL`, mobile project for all tests (not just smoke)
2. **Directory structure** — all 12 spec files listed
3. **Test data fixtures** (`e2e/fixtures/test-data.ts`) — TEST_USER, TEST_CLIENT, TEST_COMPUTATION (based on TV-BASIC-001), TEST_INVITE_EMAIL
4. **Auth setup fixture** (`e2e/fixtures/auth.setup.ts`) — creates real Supabase user, saves storage state
5. **12 test suites with exact steps and assertions:**
   - T-AUTH-01 through T-AUTH-05 (sign up, sign in, wrong password, redirect, reset)
   - T-WIZARD-01 through T-WIZARD-04 (happy path, validation, mixed income, resume draft)
   - T-AUTOSAVE-01 through T-AUTOSAVE-02 (persist after reload, indicator states)
   - T-ENGINE-01 through T-ENGINE-02 (WASM correctness vs TV-BASIC-001, VAT ineligibility)
   - T-SHARE-01 through T-SHARE-03 (enable, disable+invalidate, invalid token)
   - T-PDF-01 through T-PDF-02 (download correct PDF, gated for free plan)
   - T-CLIENT-01 through T-CLIENT-03 (add, pre-fill wizard, table)
   - T-TEAM-01 through T-TEAM-03 (invite, revoke, seat limit)
   - T-DEADLINES-01 (page loads, empty and non-empty states)
   - T-RESPONSIVE-01 through T-RESPONSIVE-02 (mobile nav, mobile wizard)
   - T-ERROR-01 through T-ERROR-03 (SetupPage, WASM fail, Supabase 503)
6. **Orphan verification script** (`scripts/orphan-scan.ts`) — static analysis of import graph + trigger verification
7. **CI integration order** — 6 phases with exact commands
8. **8 critical traps** — auth.setup.ts ordering, email auto-confirm, UUID share token, PDF headless download, WASM path interception, auto-save timing, PRO plan for PDF/share, test isolation

---

## Section Replacement Strategy

Old Section 15.2 (lines 3698–3776 in spec):
- `playwright.config.ts` (generic, missing video/E2E_BASE_URL)
- Global setup with data-testid pattern (kept as additional pattern in auth.setup.ts)
- High-level table of 5 spec files

New Section 15.2 replaces all content with:
- Full `playwright.config.ts` (harmonized: uses `E2E_BASE_URL` from analysis, keeps `reporter: [['html'], ['line']]`)
- Directory structure (12 spec files)
- `e2e/fixtures/test-data.ts` and `e2e/fixtures/auth.setup.ts`
- All 12 test suites with exact numbered steps and data-testid assertions
- `scripts/orphan-scan.ts` skeleton
- CI integration order (6 phases)
- Environment variables required for E2E
- 8 critical traps

---

## Completeness Verification After Fill

After this fill, Section 15.2 will satisfy:
- [x] Every E2E test scenario has steps, assertions, and test data
- [x] data-testid selectors specified for engine output assertions (T-ENGINE-01)
- [x] Auth setup pattern covers both local auto-confirm and CI admin API paths
- [x] Error handling tested (WASM fail, Supabase 503, missing config)
- [x] Responsive tested at 375px viewport
- [x] Orphan scan integrated into CI
- [x] PRO plan gating tested for PDF and team features
