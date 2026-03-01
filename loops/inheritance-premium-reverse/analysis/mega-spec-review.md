# Mega-Spec Review

**Aspect:** mega-spec-review (Wave 3 final gate)
**Date:** 2026-03-01
**Reviewer:** Loop iteration
**Input files:** `/docs/plans/inheritance-premium-spec.md`, `analysis/placeholder-validation.md`

---

## Checklist Results

| # | Check | Status |
|---|-------|--------|
| 1 | Every feature has: data model, UI wireframe, API contract, edge cases, acceptance criteria | **FAIL** — 11 features missing ASCII wireframes in mega-spec (wireframes exist in analysis files; not carried over to synthesis) |
| 2 | All cross-feature dependencies are resolved (no circular deps) | PASS |
| 3 | Implementation order is feasible (dependencies come before dependents) | PASS |
| 4 | Data model is normalized (no duplicate tables, clean FK relationships) | PASS |
| 5 | No feature re-specifies inheritance algorithm or estate tax rules | PASS |
| 6 | All monetary values use ₱ / centavos consistently | PASS |
| 7 | All legal citations use consistent NCC format | PASS — "Art. XXX NCC" used consistently; §8 global criteria defines the pattern |
| 8 | Migration path from ephemeral → persisted is non-breaking | PASS — §7 migration, §2.3 route `/cases/new` works anonymously or authenticated |
| 9 | Anonymous usage (no auth) still works for basic computation | **FAIL** — route structure implies anonymous use but §4.2 lacks explicit description of the ephemeral / zero-auth flow |
| 10 | ZERO placeholders, stubs, or deferred content — `placeholder-validation` shows PASS | PASS — placeholder-validation verdict: PASS |
| 11 | Every ASCII wireframe has real labels (not "Label 1", "Button Text") | PASS — all wireframes that exist use real PH-context labels |
| 12 | Every SQL DDL has real column names, types, constraints, and default values | PASS — §3.4–3.15 complete DDL with CHECK constraints, default values, indexes |
| 13 | Every API contract has real endpoint paths, HTTP methods, request/response JSON shapes | PASS — `lib/cases.ts` functions, Supabase RPCs (get_shared_case, run_conflict_check, get_case_deadline_summaries), Supabase Storage paths, all specified |
| 14 | No section consists solely of a heading with no content beneath it | PASS — confirmed by placeholder-validation §7 |

---

## Failures Requiring Fixes

### Failure 1: Missing ASCII Wireframes (11 Features)

The mega-spec synthesis did not carry over ASCII wireframes from the Wave 2 analysis files. These wireframes exist in the corresponding `analysis/spec-*.md` files and must be included in the mega-spec for a developer to implement without additional questions.

| Section | Feature | Wireframe Source |
|---------|---------|-----------------|
| §4.3 | Client Profiles | `analysis/spec-client-profiles.md` — client list page |
| §4.5 | Statute Citations UI | `analysis/spec-statute-citations-ui.md` — expanded row + tooltip |
| §4.8 | Scenario Comparison | `analysis/spec-scenario-comparison.md` — comparison panel |
| §4.12 | Share Breakdown Panel | `analysis/spec-share-breakdown-panel.md` — expanded heir row |
| §4.14 | Representation Display | `analysis/spec-represents-display.md` — heir table with sub-label |
| §4.15 | Donation Summary | `analysis/spec-donation-summary-in-results.md` — donations panel |
| §4.17 | Conflict Check | `analysis/spec-conflict-check.md` — pre-intake check screen |
| §4.18 | Guided Intake Form | `analysis/spec-intake-form.md` — progress bar + step screens |
| §4.19 | Family Tree Visualizer | `analysis/spec-family-tree-visualizer.md` — node diagram |
| §4.21 | Timeline Report | `analysis/spec-timeline-report.md` — timeline panel + client view |
| §4.23 | Estate Tax Inputs Wizard | `analysis/spec-estate-tax-inputs-wizard.md` — tab nav + Tab 1 form |

### Failure 2: Anonymous (Zero-Auth) Flow Not Described in §4.2

§4.2 Auth & Persistence specifies the authenticated save/load flow and the route `/cases/new (anonymous or authenticated)` but does not explicitly describe what happens when a user runs the computation without signing in. The analysis file `spec-auth-persistence.md` specifies this behavior; it was not synthesized into the mega-spec.

---

## Fixes Applied

Both failures are fixed in-place in `/docs/plans/inheritance-premium-spec.md` in this same iteration:

1. **Wireframes added** to §4.3, §4.5, §4.8, §4.12, §4.14, §4.15, §4.17, §4.18, §4.19, §4.21, §4.23 — taken from the respective analysis spec files.

2. **Anonymous flow description added** to §4.2 — "Anonymous Computation Flow" paragraph added, describing ephemeral mode, localStorage persistence, and the prompt-to-save on auth.

---

## Re-Verification After Fixes

After applying fixes:

| # | Check | Status |
|---|-------|--------|
| 1 | Every feature has wireframe | PASS — 11 wireframes added to mega-spec |
| 9 | Anonymous usage described | PASS — ephemeral flow documented in §4.2 |
| All other checks | (unchanged) | PASS |

**Final verdict: PASS — all 14 checks pass after fixes. Loop may converge.**
