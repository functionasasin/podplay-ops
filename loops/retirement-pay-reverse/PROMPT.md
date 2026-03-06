# RA 7641 Retirement Pay Calculator — Full-Stack Reverse Ralph Loop

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work, then exit.

You are running in `--print` mode. You MUST output text describing what you are doing. If you only make tool calls without outputting text, your output is lost and the loop operator cannot see progress. Always:
1. Start by printing which aspect you detected and what you're about to do
2. Print progress as you work
3. End with a summary of what you did and whether you committed

This is a **full-stack** reverse loop. You spec ALL layers — domain rules, engine algorithms, WASM bridge contract, TypeScript types, frontend components, platform layer, and UI design — in a single specification document.

## Your Working Directory

You are running from `loops/retirement-pay-reverse/`. All paths below are relative to this directory.

## Your Goal

Produce a complete, implementation-ready specification at `docs/plans/retirement-pay-spec.md` that covers:

1. **Domain rules** — every rule, formula, edge case from RA 7641, Labor Code Art. 302, Supreme Court jurisprudence, NIRC tax treatment
2. **Engine design** — Rust types, pipeline steps, algorithms, test vectors
3. **Bridge contract** — WASM exported functions, JSON wire format, serde strictness rules
4. **Frontend data model** — TypeScript interfaces (matching Rust serde exactly), Zod schemas (strict mode)
5. **Frontend UI** — component hierarchy, wizard flow, results display, batch mode, NLRC worksheet, PDF export
6. **Platform layer** — Supabase auth, migrations, RLS, route table, navigation, organizations, sharing
7. **Design system** — palette, typography, component library, spacing
8. **Deployment** — Fly.io Dockerfile, fly.toml, CI/CD

A developer should be able to build the entire product from this spec alone — backend, bridge, frontend, platform, deployment — without discovering any type mismatches, missing fields, orphan components, or serialization surprises at integration time.

## The Product

A web application that computes RA 7641 statutory retirement pay for Philippine private-sector employees. The core computation engine runs in Rust compiled to WASM.

### Core Features
- **Single employee calculator** — Wizard-driven form: enter salary, hire date, retirement date, company details. Output: retirement pay amount with full breakdown, eligibility check, tax treatment flag, separation pay comparison.
- **Batch mode** — CSV upload for HR departments computing retirement obligations for multiple employees at once. Results table with per-employee breakdown + summary totals.
- **Company plan gap analysis** — Input company retirement plan formula, compare to RA 7641 statutory minimum, show which employees are undercovered and by how much.
- **NLRC money claim worksheet** — Generate a formatted statement of computation suitable for filing as an exhibit in an NLRC complaint.
- **PDF export** — Professional PDF output for any computation (single, batch, NLRC worksheet) with firm branding.
- **Sharing** — Token-based read-only sharing of computation results.

### The Core Problem This Solves

RA 7641 defines "one-half (1/2) month salary" as a legal term of art that includes 15 days salary + 5 days SIL + 1/12 of 13th month pay = **22.5 days**. Most employers compute using 15 days, underpaying every retiree by exactly 33%. The Supreme Court confirmed this in *Elegir v. Philippine Airlines, Inc.* This is not a gray area — it is a documented, widespread compliance failure affecting hundreds of thousands of retiring workers.

## Existing Analysis

The `ph-compliance-moats-reverse` loop already produced a deep-dive analysis. Import it as a starting point:
- `loops/ph-compliance-moats-reverse/analysis/deepdive-retirement-pay-ra7641.md` — Contains: full formula, eligibility rules, credited years rounding, salary basis inclusions/exclusions, use case with numbers, computation decision tree, edge cases, market analysis, product shape, cross-references.

This file is READ-ONLY. Do not modify it. Use it as a foundation and expand upon it.

## Reference Stack (MANDATORY)

This app uses the EXACT same stack as the inheritance app. Do NOT deviate.

- **Engine**: Rust → compiled to WASM via `wasm-pack build --target web`
- **Bridge**: `initSync()` for Node.js (vitest), `init()` for browser. Single `compute_json(input: &str) -> String` export.
- **Frontend**: React 19 + Vite + TanStack Router (file-based routing)
- **Styling**: Tailwind CSS 4 + shadcn/ui + Radix primitives
- **Auth**: Supabase Auth with PKCE flow (email/password + magic link)
- **Database**: Supabase PostgreSQL with RLS policies
- **State**: Zod schemas for form validation, React hooks for state management
- **PDF**: @react-pdf/renderer
- **Testing**: Vitest (unit/integration) + Playwright (E2E)
- **Deployment**: Docker → Fly.io
- **Monorepo structure**: `apps/retirement-pay/engine/` (Rust) + `apps/retirement-pay/frontend/` (React)

## Lessons from the Inheritance Forward Loops (CRITICAL — Read This First)

Five specific failures occurred during the inheritance app's forward loop that MUST be prevented by this spec. Each lesson adds a concrete spec requirement.

### Failure 1: Production build never tested
The inheritance forward loop declared "complete" while only testing in `npm run dev` mode. The production build (`npm run build` + `npx serve dist`) had different behavior due to Vite plugin ordering, tree-shaking removing code that dev mode kept, and WASM loading differences between dev server and static files.

**Spec requirement**: Wave 6 must include a `production-build-verification` aspect that specifies: Vite plugin inventory (exact order), production build smoke test requirements, tree-shaking-sensitive libraries (d3, recharts), WASM loading in prod mode. The forward loop MUST run `npm run build && npx serve dist` and verify the app works before declaring any stage complete.

### Failure 2: Share RPC type mismatch (TEXT vs UUID)
The Supabase RPC function `get_shared_computation()` declared its parameter as `TEXT` but the frontend passed a `UUID`. Supabase silently returned empty results instead of erroring.

**Spec requirement**: The `database-migrations` aspect must specify exact parameter types for every RPC function, and the `migration-verification` aspect must include test calls with real data to verify RPC functions return expected results. Every RPC parameter type must match what the frontend sends.

### Failure 3: Share RPC missing anon GRANT
The sharing feature was designed to work without authentication (public share links), but the Supabase RPC function was never granted `EXECUTE` permission to the `anon` role. The feature silently failed — no error, just empty results.

**Spec requirement**: The `supabase-gotchas` aspect must specify: which RPCs need `anon` grants (any public-facing RPC), `search_path = public` on SECURITY DEFINER functions, RLS bypass patterns for shared data, and storage bucket policies.

### Failure 4: PDF export button never wired
The PDF generation infrastructure was fully built (@react-pdf/renderer templates, download utilities) but no button in the UI actually triggered it. The forward loop built the feature but forgot to wire the trigger.

**Spec requirement**: The `action-trigger-map` aspect must specify for EVERY action-triggered feature: which button triggers it, which parent component contains the button, the onClick handler, and what feedback the user sees (toast, download, navigation). Prevents "infra built but no trigger" failures.

### Failure 5: Timeline components were unstyled test scaffolding
Several components in the inheritance app shipped with raw HTML (plain `<div>`, `<ul>`, `<li>`) instead of shadcn/ui components with proper Tailwind styling. They looked like test scaffolding, not a production app.

**Spec requirement**: The `visual-verification-checklist` aspect must specify for every major component: required shadcn wrapper (Card/Alert/Badge/Table), key Tailwind classes, lucide icon, color variant, and status indicator styling. Prevents unstyled test scaffolding from shipping as "complete."

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 1 before Wave 2, etc.)
   - If ALL aspects are checked `- [x]`: write convergence summary to `status/converged.txt` and exit
3. **Analyze that ONE aspect** using the appropriate method for its wave
4. **Write findings** to `analysis/{aspect-name}.md`
5. **Update the frontier**:
   - Mark the aspect as `- [x]`
   - Update Statistics (increment Analyzed, decrement Pending, update Convergence %)
   - If you discovered new aspects, add them to the appropriate Wave (or create a new Wave if the discovery doesn't fit any existing one)
   - If a Wave needs to be split, expanded, or reordered based on what you learned, do it — the frontier is a living document, not frozen
   - Update the Total aspects count in Statistics whenever you add new aspects
   - Add a row to `frontier/analysis-log.md`
6. **If this is a synthesis aspect (Wave 7)**, also append to or update the spec document at `docs/plans/retirement-pay-spec.md`
7. **Commit**: `git add -A && git commit -m "loop(retirement-pay-reverse): {aspect-name}"`
8. **Exit**

## Analysis Methods By Wave

### Wave 1: Domain Source Acquisition
**Goal**: Gather and cache raw domain knowledge from primary legal sources.

- Fetch primary sources using web search and web fetch
- Save each source as a markdown file in `input/sources/`
- Import the existing deep-dive from ph-compliance-moats-reverse
- Cross-reference with current BIR and DOLE regulations

**Method**: Use web search for authoritative sources (official gazette, Supreme Court e-library, BIR website, DOLE website). Cache locally so subsequent waves don't need network access.

### Wave 2: Domain Rule Extraction
**Goal**: Extract every computation rule from cached sources into structured analysis files.

- Read cached sources from `input/sources/`
- For each aspect: identify the exact rule, formula, or algorithm
- Document inputs, outputs, preconditions, edge cases
- Write pseudocode for non-trivial algorithms
- Cross-reference between sources for contradictions

### Wave 3: Engine Design
**Goal**: Design the Rust engine — types, pipeline, algorithms.

- Define all data types (structs, enums) with exact field names and types
- Design the computation pipeline (ordered steps with clear inputs/outputs per step)
- Specify algorithms with exact arithmetic (integer centavos for money, no floating point)
- Write test vectors with expected outputs (at least 20 covering all scenarios)
- Define invariants that must hold for any valid input/output pair
- Design batch processing pipeline (CSV parsing, per-employee computation, aggregation)
- Design NLRC worksheet output format

### Wave 4: Bridge Contract
**Goal**: Specify the exact WASM boundary.

- Define WASM exported functions: `compute_single_json()`, `compute_batch_json()`, `generate_nlrc_worksheet_json()`
- Specify exact JSON wire format (serde rules)
- Document serde strictness: deny_unknown_fields, rename_all, null handling
- Specify error contract
- Specify initialization patterns (initSync vs init)

### Wave 5: Frontend Data Model + UI Design
**Goal**: Specify the complete frontend — types, schemas, components, visual design, platform layer.

#### 5a: TypeScript Types + Zod Schemas
- Map every Rust struct to TypeScript interface (exact field names, exact types)
- Write Zod schemas in strict mode (no coercion, null not undefined)
- Document per-field metadata: labels, input types, defaults, conditional visibility

#### 5b: Component Hierarchy + Wizard Flow
- Single employee wizard steps (fields per step, conditional visibility)
- Batch upload UI (CSV upload, progress, results table)
- Company plan comparison UI
- NLRC worksheet display
- Results view components and data mapping
- PDF export layout for all output types

#### 5c: Design System
- shadcn/ui with Radix + Tailwind CSS 4
- Color palette (professional, trustworthy — labor law context)
- Typography, spacing, component patterns

#### 5d: Platform Layer
- Supabase Auth (PKCE, email/password, magic link)
- Database migrations (tables, RLS, RPCs, triggers — all idempotent)
- Route table (TanStack Router, auth guards)
- Environment configuration (.env.local.example, graceful missing-var handling)
- Navigation (auth-aware sidebar + mobile drawer)
- Organization model (HR departments, members, roles)
- Computation management (CRUD, auto-save, status workflow)
- Sharing (token-based read-only, get_shared_computation RPC)

#### 5e: Component Wiring + Verification
- Component wiring map (every component -> parent, navigation path, trigger, props source)
- Action trigger map (every action -> button, parent, onClick, feedback)
- Visual verification checklist (every component -> shadcn wrapper, Tailwind classes, icon, color)
- Empty states and loading skeletons
- Toast catalog (every user action -> feedback message and variant)

### Wave 6: Testing + Deployment
**Goal**: Production readiness specs.

- Playwright E2E test scenarios for every critical flow
- Production build verification (Vite plugins, tree-shaking, WASM loading in prod)
- Migration verification (supabase db reset, RPC test calls, parameter type matching)
- Supabase gotchas (anon grants, search_path, RLS bypass, storage policies)
- Fly.io deployment (Dockerfile, fly.toml, build args, domain config)
- CI/CD pipeline (GitHub Actions: typecheck -> lint -> test -> build -> e2e -> deploy)

### Wave 7: Synthesis
**Goal**: Assemble all findings into the final spec. **Strict internal dependency order.**

1. `spec-draft` — Assemble `docs/plans/retirement-pay-spec.md` from all analysis files. Every section fully written.
2. `placeholder-validation` — **HARD GATE.** Line-by-line scan for banned patterns. MUST return PASS before proceeding.
3. `completeness-audit` — Per-feature PASS/FAIL: types match, schemas match, routes wired, components wired, migrations complete, E2E defined. Includes orphan check.
4. `cross-layer-consistency` — Field-by-field: Rust <-> JSON <-> TypeScript <-> Zod
5. `spec-review` — Final review: can a forward loop build the ENTIRE product from this spec alone?

## Output: The Spec Document

The final spec at `docs/plans/retirement-pay-spec.md` must contain these sections:

```
S1  Overview (product purpose, target users, core value proposition)
S2  Computation Pipeline (ordered steps with I/O types)
S3  Data Model (all Rust types with field descriptions)
S4  Domain: Core Formula (22.5-day breakdown, daily rate, credited years)
S5  Domain: Eligibility Rules (age, service, employer size)
S6  Domain: Salary Basis (inclusions/exclusions, COLA handling)
S7  Domain: Tax Treatment (BIR-approved plan conditions, exempt vs taxable)
S8  Domain: Separation Pay Interaction (Art. 298 overlap, pay-the-higher rule)
S9  Domain: Company Plan Comparison (statutory minimum vs company plan)
S10 Domain: Batch Computation (CSV schema, per-employee processing, aggregation)
S11 Domain: NLRC Worksheet (format, required fields, exhibit structure)
S12 Domain: Edge Cases (death before retirement, company transfers, <=10 employees)
S13 Bridge Contract
    S13.1 WASM Export Signatures
    S13.2 JSON Wire Format (serde rules)
    S13.3 Error Contract
    S13.4 Initialization (Node.js vs Browser)
S14 TypeScript Types (exact interfaces matching S3)
S15 Zod Schemas (strict mode, matching S13.2)
S16 Frontend Architecture
    S16.1 Wizard Steps (single employee — fields per step, conditional visibility)
    S16.2 Batch Upload UI (CSV upload, progress, results table)
    S16.3 Company Plan Comparison UI
    S16.4 NLRC Worksheet View
    S16.5 Results View (components, data mapping)
    S16.6 PDF Export Layout (single, batch, NLRC)
    S16.7 Shared Components (money input, date input, enum select, CSV uploader)
S17 Design System
    S17.1 Palette (CSS custom properties)
    S17.2 Typography
    S17.3 Component Patterns
S18 Platform Layer
    S18.1 Authentication (PKCE, sign-in/sign-up, confirmation, error states)
    S18.2 Route Table (path, component, auth requirement)
    S18.3 Environment Configuration (.env.local.example, graceful handling)
    S18.4 Database Migrations (tables, RLS, RPCs, triggers — all idempotent)
    S18.5 Navigation (auth-aware sidebar/header, mobile, landing page CTA)
    S18.6 Organization Model (HR departments, members, roles, invitations)
    S18.7 Computation Management (CRUD, auto-save, status workflow)
    S18.8 Sharing (token-based, get_shared_computation RPC, /share/$token route)
S19 Test Vectors (at least 20 — single employee, batch, edge cases)
S20 Invariants
S21 Action Trigger Map (every action -> button, parent, handler, feedback)
S22 Component Wiring Map (every component -> parent, nav path, trigger, props)
S23 Visual Verification Checklist (every component -> shadcn wrapper, classes, icon)
S24 E2E Test Scenarios (Playwright specs for every critical flow)
S25 Production Build Verification (Vite plugins, tree-shaking, WASM prod loading)
S26 Migration Verification (db reset test, RPC test calls, type matching)
S27 Supabase Gotchas (anon grants, search_path, RLS, storage)
S28 Deployment (Dockerfile, fly.toml, CI/CD pipeline)
S29 Cross-Layer Consistency Checklist
Appendix A: Glossary (legal terms, RA 7641 definitions)
Appendix B: Edge Cases + Known Limitations
Appendix C: Legal References (RA 7641 full text, Elegir v. PAL, NIRC Sec. 32(B)(6)(a))
```

## Rules

- Do ONE aspect per run, then exit.
- Check dependencies before starting an aspect (Wave 2 needs Wave 1 sources cached, etc.)
- Write findings in markdown with specific numbers, formulas, and examples.
- Discover new aspects and add them to the frontier as you find them. You can add new aspects to existing Waves, create entirely new Waves, or split an existing Wave into sub-waves. The initial frontier is a starting point, not a ceiling.
- Keep analysis files focused. One aspect = one file.
- The spec is the artifact. Everything else (analysis files, frontier) is scaffolding.
- **Cross-layer consistency is paramount.** A field name mismatch between Rust and TypeScript means a runtime crash.
- **Integer arithmetic for money.** All monetary values in the Rust engine must use integer centavos (i64). No floating point. Display formatting happens in the frontend.
- **Exact arithmetic for fractions.** The 22.5-day formula involves fractions (1/12 of 13th month). Use exact rational arithmetic, not floating point approximations.

## HARD CONSTRAINT: Zero Placeholders in Final Spec

The spec document is the SOLE input to the forward loop. Every placeholder becomes a broken feature.

### Banned Patterns (literal matches, case-insensitive)

**Marker words**: `TODO`, `TBD`, `FIXME`, `XXX`, `HACK`, `PLACEHOLDER`, `STUB`

**Deferral phrases**: "to be defined", "to be determined", "will be specified later", "needs further research", "details TBD", "see later", "coming soon", "not yet determined", "left as exercise", "implementation detail"

**Bracket placeholders**: `[fill in]`, `[insert]`, `[TBD]`, `<placeholder>`, `{placeholder}`, `[TODO]`, `[...]`, `...` (as sole content of a section or table cell)

**Empty structures**: Sections with only a heading and no content, table rows with empty cells, code blocks with only comments

**Generic sample values**: `example.com`, `lorem ipsum`, `foo`/`bar`/`baz`, `123` or `0` as placeholder amounts

### What "Implementation-Ready" Means

Every feature must have ALL of:
- **Exact types**: Field names, types, nullability
- **Exact algorithms**: Step-by-step with actual formulas
- **Exact UI behavior**: Component, props, conditional visibility, error states
- **Exact validation rules**: Min/max, required, cross-field dependencies
- **Exact error handling**: Error messages, recovery paths
- **Test vectors**: Concrete input -> expected output pairs

## Commit Convention

```
loop(retirement-pay-reverse): {aspect-name}
```
