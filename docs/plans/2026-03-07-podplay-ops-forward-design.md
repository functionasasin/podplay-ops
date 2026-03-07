# PodPlay Ops Forward Loop Design

**Date**: 2026-03-07
**Loop**: `podplay-ops-forward`
**Status**: Design approved, pending implementation plan

## Overview

Build the PodPlay Ops Wizard webapp from the converged reverse loop spec. The app replaces a 24-sheet Google Sheets MRP spreadsheet used by PodPlay's ops team to manage customer lifecycle: intake, hardware procurement, 15-phase deployment, and financial close.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scope | Full spec, single loop | Spec is complete (40K lines, zero ambiguity), no reason to phase |
| App directory | `apps/podplay/` | Frontend-only (no backend server), flat structure |
| Stage granularity | Maximum (~185 stages) | Separate test + implementation stages, one feature per stage, max 3 files |
| Database | Supabase local via Docker | `supabase start` in CI + local dev, no cloud project needed |
| CI | Existing `ralph-loops.yml` | Manual trigger: `gh workflow run ralph-loops.yml -f loop=podplay-ops-forward` |

## Tech Stack

- React 19 + Vite + TypeScript (strict)
- TanStack Router (file-based routing)
- Tailwind 4 + shadcn/radix
- React Hook Form + Zod
- Supabase (Postgres + Auth + RLS)
- Vitest (unit/integration tests)
- Playwright (browser verification)

## Source of Truth

`loops/podplay-ops-reverse/final-mega-spec/` — 41 files, 40,430 lines covering:

- **Data model**: 28 enums, 18 tables, RLS policies, indexes, seed data (50 hardware items)
- **Business logic**: BOM generation, cost chain, inventory lifecycle, deployment tracking, invoicing, P&L, HER
- **UI spec**: 16 routes, dashboard, 4 wizard stages, inventory view, financials view, 4 settings pages
- **UI constants**: 21 enum label maps, 140+ validation messages, 19 empty states, 10 page skeletons, 65 toast operations, 17 confirmation dialogs, keyboard nav, responsive breakpoints, 13 formatters
- **Deployment**: Fly.io config, Dockerfile, data migration plan
- **Testing**: Test strategy, smoke tests, form validation, BOM generation tests

## Loop Structure

```
loops/podplay-ops-forward/
├── PROMPT.md                    # Read every iteration
├── loop.sh                      # Local runner
├── frontier/
│   ├── current-stage.md         # Progress tracker
│   └── stages/
│       ├── 001.md ... 185.md    # One file per stage
└── status/                      # Marker files
```

## PROMPT Priority System

Each iteration picks the FIRST applicable priority:

1. **SCAFFOLD** — if files for current stage don't exist
2. **WRITE TESTS** — if stage has <5 test assertions
3. **IMPLEMENT** — if tests exist but fail/stub
4. **FIX FAILURES** — if tests fail
5. **ADVANCE** — if all tests pass, mark complete, bump current-stage.md

One unit of work per iteration. Commit and exit.

## Stage Breakdown (185 stages)

### Phase 1: Scaffold & Tooling (1-7)

| # | Stage |
|---|-------|
| 1 | Vite + React 19 + TypeScript strict scaffold |
| 2 | Tailwind 4 + shadcn/radix setup |
| 3 | TanStack Router setup |
| 4 | Supabase client + local Docker setup (`supabase init` + `supabase start`) |
| 5 | React Hook Form + Zod setup |
| 6 | Test infrastructure (Vitest) |
| 7 | Lint + formatting (ESLint, Prettier) |

### Phase 2: Database Schema (8-17)

| # | Stage |
|---|-------|
| 8 | Enums migration (all 28 enums) |
| 9 | Tests: enum values |
| 10 | Core tables: projects, installers, settings |
| 11 | Tests: core tables |
| 12 | Hardware tables: hardware_catalog, bom_templates, project_bom_items |
| 13 | Tests: hardware tables |
| 14 | Inventory tables: inventory, inventory_movements |
| 15 | Tests: inventory tables |
| 16 | Financial tables: invoices, expenses, cc_terminals, replay_signs |
| 17 | Tests: financial tables |

### Phase 3: Seed Data (18-21)

| # | Stage |
|---|-------|
| 18 | Hardware catalog seed (50 items) |
| 19 | Tests: hardware catalog seed |
| 20 | BOM templates + deployment checklists + defaults seed |
| 21 | Tests: seed data completeness |

### Phase 4: Auth (22-26)

| # | Stage |
|---|-------|
| 22 | Auth context + provider + `useAuth` hook |
| 23 | Tests: auth hooks |
| 24 | Login page (`/login`) |
| 25 | Auth callback (`/auth/callback`) |
| 26 | Route guards |

### Phase 5: Shared UI (27-34)

| # | Stage |
|---|-------|
| 27 | App shell + sidebar layout |
| 28 | Tests: layout renders nav links |
| 29 | Enum label utilities (21 types) |
| 30 | Tests: enum labels |
| 31 | Formatter utilities (13 functions) |
| 32 | Tests: formatters |
| 33 | Toast system (65 operations) |
| 34 | Tests: toast messages |

### Phase 6: Dashboard (35-41)

| # | Stage |
|---|-------|
| 35 | Dashboard route (`/projects`) |
| 36 | Tests: dashboard query |
| 37 | Project list table (status pills, tier, progress) |
| 38 | Tests: status pills |
| 39 | Dashboard filters + search |
| 40 | Tests: filters |
| 41 | Dashboard metrics bar |

### Phase 7: Create Project (42-44)

| # | Stage |
|---|-------|
| 42 | New project route (`/projects/new`) |
| 43 | Tests: project creation |
| 44 | Project creation logic (insert + seed checklist + redirect) |

### Phase 8: Wizard Stage 1 -- Intake (45-62)

| # | Stage |
|---|-------|
| 45 | Intake route shell + stepper UI |
| 46 | Tests: intake stepper |
| 47 | Step 1: Customer info form |
| 48 | Tests: customer info validation |
| 49 | Step 2: Venue config form |
| 50 | Tests: venue config validation |
| 51 | Step 3: Service tier selection |
| 52 | Tests: tier selection |
| 53 | Step 4: ISP info form |
| 54 | Tests: ISP validation (speed thresholds, Starlink warning) |
| 55 | Step 5: Installer selection |
| 56 | Tests: installer selection |
| 57 | Step 6: Financial setup |
| 58 | Tests: financial setup validation |
| 59 | Step 7: Review & submit |
| 60 | Tests: review renders all fields |
| 61 | Intake submit logic (BOM generation, cost chain, status transition) |
| 62 | Tests: intake submit |

### Phase 9: BOM Generation Engine (63-68)

| # | Stage |
|---|-------|
| 63 | BOM generation function (tier + counts -> items) |
| 64 | Tests: BOM generation per tier |
| 65 | SSD/switch sizing logic |
| 66 | Tests: sizing edge cases (boundary court counts) |
| 67 | Cost chain calculation |
| 68 | Tests: cost chain |

### Phase 10: Wizard Stage 2 -- Procurement (69-86)

| # | Stage |
|---|-------|
| 69 | Procurement route shell + tabs |
| 70 | Tests: procurement tabs render |
| 71 | BOM review table (editable qty, SKU swap, cost override) |
| 72 | Tests: BOM edit |
| 73 | BOM cost recalculation on edit |
| 74 | Tests: cost recalc |
| 75 | Inventory check panel (stock levels, low-stock flags) |
| 76 | Tests: inventory check |
| 77 | PO creation form |
| 78 | Tests: PO creation |
| 79 | PO receiving workflow |
| 80 | Tests: PO receiving |
| 81 | Packing list generation |
| 82 | Tests: packing list |
| 83 | CC terminal ordering |
| 84 | Tests: CC terminal |
| 85 | Replay sign fulfillment |
| 86 | Tests: replay signs |

### Phase 11: Wizard Stage 3 -- Deployment (87-104)

| # | Stage |
|---|-------|
| 87 | Deployment route shell + phase list + progress bar |
| 88 | Tests: deployment shell (15 phases, 0% progress) |
| 89 | Smart checklist component (checkable steps, auto-fill tokens) |
| 90 | Tests: checklist tokens |
| 91 | Phases 1-3: Pre-Config, iPad Setup, Network Config |
| 92 | Tests: phases 1-3 |
| 93 | Phases 4-6: Server Config, Camera Setup, Access Control |
| 94 | Tests: phases 4-6 |
| 95 | Phases 7-9: Surveillance, Display Setup, Audio Config |
| 96 | Tests: phases 7-9 |
| 97 | Phases 10-12: Scoring, Lighting, Front Desk |
| 98 | Tests: phases 10-12 |
| 99 | Phases 13-15: Final QC, Handoff, Go-Live |
| 100 | Tests: phases 13-15 |
| 101 | Phase warnings (PoE port count, power calculations) |
| 102 | Tests: phase warnings |
| 103 | Troubleshooting tips (14 known issues) |
| 104 | Tests: troubleshooting |

### Phase 12: Progress Calculation (105-106)

| # | Stage |
|---|-------|
| 105 | Progress % engine + status machine |
| 106 | Tests: progress at various completion states |

### Phase 13: Wizard Stage 4 -- Financials (107-120)

| # | Stage |
|---|-------|
| 107 | Financials route shell + tabs |
| 108 | Tests: financials tabs |
| 109 | Deposit invoice form |
| 110 | Tests: deposit invoice |
| 111 | Final invoice form (balance = total - deposit) |
| 112 | Tests: final invoice |
| 113 | Expense tracking (12 categories) |
| 114 | Tests: expense CRUD |
| 115 | P&L summary (COGS, margin %) |
| 116 | Tests: P&L calculation |
| 117 | HER calculation (hardware revenue / team spend) |
| 118 | Tests: HER |
| 119 | Go-live + project close |
| 120 | Tests: project close (all invoices paid gate) |

### Phase 14: Global Inventory View (121-126)

| # | Stage |
|---|-------|
| 121 | Inventory route (`/inventory`) |
| 122 | Tests: inventory page |
| 123 | Stock levels table (category grouping, low-stock highlights) |
| 124 | Tests: stock levels |
| 125 | Movement history timeline |
| 126 | Tests: movement history |

### Phase 15: Global Financials View (127-132)

| # | Stage |
|---|-------|
| 127 | Financials route (`/financials`) |
| 128 | Tests: financials page |
| 129 | Revenue funnel visualization |
| 130 | Tests: revenue funnel |
| 131 | P&L + HER charts |
| 132 | Tests: charts |

### Phase 16: Settings Pages (133-142)

| # | Stage |
|---|-------|
| 133 | Settings layout + subnav |
| 134 | Tests: settings nav |
| 135 | Pricing settings (`/settings/pricing`) |
| 136 | Tests: pricing settings |
| 137 | Catalog settings (`/settings/catalog`) |
| 138 | Tests: catalog settings |
| 139 | Team settings (`/settings/team`) |
| 140 | Tests: team settings |
| 141 | Travel settings (`/settings/travel`) |
| 142 | Tests: travel settings |

### Phase 17: UI Polish (143-150)

| # | Stage |
|---|-------|
| 143 | Empty states (19 components) |
| 144 | Tests: empty states |
| 145 | Loading states (10 skeletons, 35 form-submit loaders) |
| 146 | Tests: loading states |
| 147 | Validation messages (140+ wired to forms) |
| 148 | Tests: validation messages |
| 149 | Confirmation dialogs (17 with exact copy) |
| 150 | Tests: confirmation dialogs |

### Phase 18: Keyboard & Accessibility (151-152)

| # | Stage |
|---|-------|
| 151 | Keyboard navigation (tab order, Enter/Escape, focus, ARIA) |
| 152 | Tests: keyboard nav |

### Phase 19: Responsive / Mobile (153-155)

| # | Stage |
|---|-------|
| 153 | Responsive sidebar (hamburger at md) |
| 154 | Responsive tables (scroll/card at sm) |
| 155 | Responsive forms (single column at sm) |

### Phase 20: Playwright Desktop Verification (156-171)

One stage per route at 1280x800:

| # | Route |
|---|-------|
| 156 | `/login` |
| 157 | `/auth/callback` |
| 158 | `/projects` (dashboard) |
| 159 | `/projects/new` |
| 160 | `/projects/$id/intake` |
| 161 | `/projects/$id/procurement` |
| 162 | `/projects/$id/deployment` |
| 163 | `/projects/$id/financials` |
| 164 | `/inventory` |
| 165 | `/financials` |
| 166 | `/settings/pricing` |
| 167 | `/settings/catalog` |
| 168 | `/settings/team` |
| 169 | `/settings/travel` |
| 170 | Full wizard flow (intake -> procurement -> deployment -> financials) |
| 171 | Dashboard after project completion |

### Phase 21: Playwright Mobile Verification (172-179)

At 375x812:

| # | Routes |
|---|--------|
| 172 | `/login` + `/projects` |
| 173 | `/projects/new` + `/projects/$id/intake` |
| 174 | `/projects/$id/procurement` |
| 175 | `/projects/$id/deployment` |
| 176 | `/projects/$id/financials` |
| 177 | `/inventory` + `/financials` |
| 178 | All 4 settings pages |
| 179 | Full wizard flow mobile |

### Phase 22: Discovery + Convergence (180-185)

| # | Stage |
|---|-------|
| 180 | Orphan component sweep |
| 181 | Schema mismatch audit (Supabase columns vs TS types vs form fields) |
| 182 | Placeholder/stub hunt (grep + Playwright) |
| 183 | Build + full test suite (zero failures) |
| 184 | Discovery: gap hunting (browse every route) |
| 185 | Convergence gate (all verified, `converged.txt` written) |
