# Analysis: spec-draft

**Wave**: 4 — Synthesis
**Date**: 2026-03-04
**Method**: Assembled all findings from 21 Wave 1/2/3 analysis files into `docs/plans/inheritance-platform-spec.md`

---

## What Was Done

Assembled the comprehensive platform layer spec from the following source analysis files:

**Wave 1 sources (8 files)**:
- `catalog-routes.md` — 10 registered routes, 5 missing routes, zero route-level auth guards
- `catalog-components.md` — 70+ component files, 4 orphaned results components
- `catalog-lib-hooks.md` — 18 lib modules, `useAutoSave` is dead code, `supabase.ts` white-screen bug
- `catalog-config.md` — env vars, package.json, no toast library
- `catalog-migrations.md` — 7 existing migrations, 2/3/8 missing, duplicate 006
- `read-premium-spec.md` — 23 platform features specified; 8 routes, 3 fully absent
- `read-failure-logs.md` — 5 forward failures + 3 reverse spec failures documented
- `verify-migration-columns.md` — 003/008 confirmed missing; `get_shared_case` needs update

**Wave 2 sources (5 files)**:
- `journey-new-visitor.md` — BROKEN (JNV-001 to JNV-019)
- `journey-signup-signin.md` — BROKEN (JSS-001 to JSS-016)
- `journey-first-case.md` — BROKEN (JFC-001 to JFC-020)
- `journey-share-case.md` — BROKEN (JSC-001 to JSC-009)
- `journey-return-visit.md` — BROKEN (JRV-001 to JRV-016)
- `journey-settings-team.md` — BROKEN (JST-001 to JST-017)

**Wave 3 sources (4 files)**:
- `design-layout-nav.md` — 11 layout gaps; full sidebar + drawer modernization spec
- `design-wizard-components.md` — 24 wizard gaps; native input replacement, validation
- `design-results-components.md` — 11 results gaps; 4 orphaned components, ActionsBar missing 3 buttons
- `design-shared-components.md` — 21 shared form gaps; print.css never imported
- `design-mobile-responsive.md` — 13 mobile gaps; 5 critical overflow/touch-target issues
- `design-loading-empty-states.md` — 14 loading gaps, 8 empty state gaps; 2 new components

---

## Spec Sections Written

All 10 sections fully written per the synthesis template:

| Section | Content |
|---------|---------|
| §1 Overview | Source references, overall app status, design direction |
| §2 Route Table | 18-row route inventory (13 existing + 5 missing), auth guard pattern |
| §3 Auth Flow | Sign-up, sign-in, session, sign-out, password reset, PKCE callback, layout isolation |
| §4 Env Config | 3 required vars, exact `.env.local.example`, graceful missing-var `SetupPage` |
| §5 Migrations | 12-migration inventory, idempotency rules, Migration 011 DDL, Migration 012 DDL, fresh setup steps |
| §6 Navigation | Full sidebar + mobile drawer spec with exact JSX |
| §7 Landing Page | Unauthenticated hero + feature grid; authenticated dashboard with cases list |
| §8 Journey Fixes | Per-journey gap tables (5 journeys) with exact file paths and fix summary |
| §9 Design Modernization | Token updates, per-component specs, animation standards, loading states, empty states, mobile fixes |
| §10 Onboarding | 3-step flow spec with route registration |
| Appendix A | Complete file inventory (routes, components, lib, hooks) |
| Appendix B | All known failures with fix status; gap count by category (104 total) |

---

## Statistics

- Total gaps addressed: **104** (24 critical, 31 high, 29 medium, 20 low)
- New files to create: **11** (5 routes + 2 UI components + 2 lib functions + 2 migrations)
- Files to modify: **30+**
- Orphaned components: 4 (never rendered in ResultsView)
- Dead code hooks: 1 (useAutoSave imported but never called)

---

## Status

**COMPLETE** — spec written to `docs/plans/inheritance-platform-spec.md`
