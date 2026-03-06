# Completeness Audit — TaxKlaro Unified Spec

**Wave:** 7 (Synthesis)
**Date:** 2026-03-06
**Depends on:** placeholder-validation (PASS), unified-mega-spec, all Wave 1–6 analyses
**Target file:** `docs/plans/freelance-tax-spec.md`

---

## Method

Each checklist item was verified against the spec using Read, Grep, and cross-reference with the
source analysis files. A FAIL means the spec does not contain sufficient detail for the forward
loop to implement that feature without external research or judgment calls.

---

## Checklist Results

### Types and Schemas

- [x] **Every Rust type has a matching TypeScript interface with identical field names**
  - **PASS.** Section 3.4 defines all 14 enums and all input/output structs in Rust. Section 5.1-5.3
    defines matching TypeScript interfaces. Section 18.1-18.2 provides a cross-layer consistency
    table covering critical field name traps (digit-in-name fields, underscore+digit patterns).
    The `createDefaultTaxpayerInput()` factory function confirms every field is accounted for.

- [x] **Every TypeScript interface has a matching Zod schema in strict mode**
  - **PASS.** Section 6 defines all 6 schema files. `TaxpayerInputSchema` in Section 6.5 uses
    `.strict()` and matches every field of `TaxpayerInput`. Output schemas in `output.ts` use
    `z.object({})` without `.strict()` (intentional — forward-compatible). Section 6.1 states
    the strict/non-strict distinction explicitly.

- [x] **Every Zod schema field type matches the serde wire format**
  - **PASS.** Section 6.1 establishes the mapping rules: Decimal→`z.string().regex(PESO_RE)`,
    `Option<T>`→`.nullable()`, booleans→`z.boolean()` (no coerce), enums→`z.enum([...])`.
    Section 18.1 provides a field-by-field table showing Rust type → JSON wire → TypeScript → Zod
    alignments for all critical fields.

---

### Wizard Steps

- [ ] **Every wizard step has all fields specified with label, type, validation, error message**
  - **FAIL.** The spec (Section 7.2-7.3, Section 6.6) defines wizard state types, step routing
    logic, and Zod schemas for 5 key steps (WS-01, WS-03, WS-04, WS-07C, WS-08). However,
    the spec does NOT include per-field specifications for all 17 wizard steps. Missing for each
    field:
    - Exact label text (e.g., "Annual Gross Receipts" vs "Gross Income")
    - Field type (peso, radio, select, checkbox, date, text)
    - Placeholder text
    - Help text / tooltip copy
    - Required / optional
    - Validation rules in order (e.g., "must be > 0", "must not exceed ₱3M for 8% eligibility")
    - Exact error messages (e.g., "This field is required" vs "Gross receipts must be greater than ₱0")
  - The original `loops/freelance-tax-reverse/final-mega-spec/frontend/wizard-steps.md` has all
    this detail for all 17 steps, but it was NOT merged into the new spec.
  - **Impact:** The forward loop developer would need to invent field labels, placeholder text,
    and error messages — or read the old spec independently, violating "zero external research."
  - **New aspect needed:** `fill-wizard-step-fields` — merge wizard-steps.md content into spec.

---

### Routes

- [x] **Every route in the route table has a component file and auth requirement**
  - **PASS.** Section 11.2 provides a complete 18-row table with path, file name, auth
    requirement (Public / Auth only / Auth + beforeLoad), and layout (Bare / AppLayout).
    Section 11.3 provides the exact `beforeLoad` guard code pattern. Section 11.6 documents
    5 critical route traps (PKCE code in query params, reset token in hash, etc.).

---

### Components

- [x] **Every component in the wiring map has a parent route and navigation path**
  - **PASS.** Section 14.1 documents the directory structure with 90 component files organized
    by domain. Section 14.2 documents orphan prevention rules — all wizard steps statically
    imported in WizardPage.tsx, all results sub-components in ResultsView.tsx. Section 14.3
    provides the action trigger map (22 rows) covering every action-triggered component.
    Section 14.4 provides component visibility rules for conditional components.
    The forward loop can trace every component to its rendering parent.

---

### Database

- [x] **Every database table has complete columns with types, constraints, and RLS policies**
  - **PASS.** Section 10.2 (`001_initial_schema.sql`) defines 8 tables with full column
    definitions, NOT NULL constraints, DEFAULT values, FK references, and UNIQUE constraints.
    Section 10.3 (`002_rls_policies.sql`) defines `user_org_ids()` helper and 32 RLS policies
    (SELECT/INSERT/UPDATE/DELETE for each relevant table).

- [x] **Every migration is idempotent**
  - **PASS.** Section 10.1 states explicitly: "All migrations are idempotent (use `IF NOT
    EXISTS`, `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object`)." Section 10.2 shows enums
    wrapped in `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;` and tables
    using `CREATE TABLE IF NOT EXISTS`.

- [x] **Every RPC function has a defined signature, parameters, and return type**
  - **PASS.** Section 10.4 (`003_rpc_functions.sql`) defines 6 RPC functions:
    - `create_organization(p_name TEXT, p_slug TEXT)` → `JSONB`
    - `accept_invitation(p_token UUID)` → `JSONB`
    - `invite_member(p_email TEXT, p_role org_role, p_org_id UUID)` → `JSONB`
    - `get_shared_computation(p_token UUID)` → `JSONB`
    - `get_invitation_by_token(p_token UUID)` → `JSONB`
    - `rotate_share_token(p_computation_id UUID)` → `UUID`
    Each includes GRANT statements (anon + authenticated for public RPCs). Section 18.3 shows
    the UUID vs TEXT parameter type alignment table.

---

### Premium Features

- [x] **Every premium feature has explicit Supabase-level gating (RLS or application check)**
  - **PASS.** Section 13.1 maps PDF export and sharing to `pro` and `enterprise` plans.
    Section 13.2 shows `canExportPdf` and `canShare` gated by `org.plan !== 'free'` in
    `useOrganization()`. The `ROLE_PERMISSIONS` table in Section 5.4 (org.ts) defines
    per-role permissions. The action trigger map (Section 14.3) shows "Export PDF" and "Share"
    buttons check `canExportPdf` and `canShare` before proceeding.

---

### E2E Tests

- [ ] **Every E2E test scenario has steps, assertions, and test data**
  - **FAIL.** Section 15.2 provides the `playwright.config.ts` configuration and a high-level
    table of 5 test files (auth.spec.ts, computation.spec.ts, sharing.spec.ts,
    client-management.spec.ts, smoke.prod.spec.ts) with one-line descriptions. However, the
    spec does NOT include:
    - Step-by-step test code for each scenario
    - Specific assertions (e.g., `expect(page.locator('[data-testid="regime-recommendation"]')).toBeVisible()`)
    - Test data fixtures with exact values
    - Global setup code structure
    - data-testid attribute names required for E2E targeting
  - The `analysis/playwright-e2e-specs.md` analysis has full test code for 12 suites with
    exact steps, assertions, and test data fixtures, but was NOT merged into the spec.
  - **Impact:** The forward loop developer would need to design test assertions independently,
    and might choose different `data-testid` names than what the spec expects — breaking E2E.
  - **New aspect needed:** `fill-e2e-specs` — merge playwright-e2e-specs.md into spec Section 15.

---

### Empty States

- [ ] **Every empty state has icon, title, description, and CTA**
  - **FAIL.** The spec (Section 14.1) lists `EmptyState.tsx` as a shared component. Section
    2731 (Critical Traps) states "EmptyState is shared: One component, not per-page variants.
    Props: `icon`, `title`, `description`, `ctaLabel?`, `onCta?`." However, the spec does NOT
    specify the per-page content:
    - Which `lucide-react` icon for each page
    - Exact title string for each page
    - Exact description string for each page
    - CTA button label and destination for each page
  - The `analysis/empty-states-and-loading.md` analysis has per-page empty state specs for all
    7 async pages (Dashboard, Computations list, Clients list, Client profile, Deadlines,
    Settings, Team), plus skeleton loader shapes for each. These were NOT merged into the spec.
  - **Impact:** Forward loop developer must invent copy for empty states. Each page will have
    different ad-hoc text rather than the specified copy, causing inconsistent UX.
  - **New aspect needed:** `fill-empty-states` — merge empty-states-and-loading.md into spec.

---

### Toasts

- [ ] **Every toast has trigger action, message text, and variant (success/error)**
  - **FAIL.** Section 8.4 states "Key toasts (41 total)" but only documents 13 with trigger
    action, variant, and message text. The remaining 28 toasts are NOT in the spec. Missing
    categories include:
    - Auto-save error variants and recovery messages
    - Team management toasts (member removed, invitation revoked, role changed)
    - Client management toasts (client deleted, client archived)
    - Auth toasts (sign-in failed, sign-up succeeded, reset email sent, password changed)
    - Settings toasts (logo deleted, BIR info saved)
    - Error variants for every documented success toast
  - The `analysis/toast-catalog.md` analysis has all 41 toasts across 8 categories with exact
    message text, variants, and trigger conditions. This was partially merged but incomplete.
  - **Impact:** The forward loop developer will implement some toasts but miss others, leading
    to silent failures on actions like "member removed" or "invitation revoked."
  - **New aspect needed:** `fill-toast-catalog` — merge remaining 28 toasts into spec Section 8.4.

---

### Deployment

- [x] **The Dockerfile builds successfully from the spec alone**
  - **PASS.** Section 16.1 provides the complete multi-stage Dockerfile:
    - Stage 1 (`wasm-build`): Rust/wasm-pack installation + `wasm-pack build engine --target web`
    - Stage 2 (`frontend-build`): `npm ci` + `npm run build` with all 5 VITE_* ARGs
    - Stage 3: `nginx:alpine` serving `/usr/share/nginx/html` on port 8080
    - Section 16.2 provides `nginx.conf` with SPA routing, WASM MIME type, caching, and security headers.

- [x] **The fly.toml is complete with all build args**
  - **PASS.** Section 16.3 provides complete `fly.toml` with: `app = "taxklaro"`,
    `primary_region = "sin"`, HTTP service on port 8080 with force_https, auto_stop/start,
    health check (`GET /` every 30s), and `[[vm]]` block with 512mb memory.
    Section 16.4 lists all 10 GitHub secrets required for CI/CD including all build args.

---

### Design System

- [x] **The design system maps every custom component to a shadcn/ui equivalent**
  - **PASS.** Section 8.2 maps all 19 shadcn/ui component groups to their usage in TaxKlaro
    (Card, Button, Input/Label/Textarea, Select, Switch, Badge, Alert, Tabs, Dialog, Sheet,
    Skeleton, Progress, Accordion, Separator, Tooltip). Every custom component in the wiring
    map uses at least one of these primitives.

---

### Zero Orphans

- [x] **ZERO orphaned components (every component has a render path from a route)**
  - **PASS.** Section 14.2 establishes 5 orphan prevention rules:
    1. Every Page component has a route in router.ts
    2. All 17 wizard step files statically imported in WizardPage.tsx
    3. All 11 results sub-components statically imported in ResultsView.tsx
    4. TaxComputationDocument (lazy-loaded) has a static comment import marker in ActionsBar.tsx
    5. EmptyState is shared — no per-page duplicates that could become orphans
    The forward loop's `orphan_scan()` will verify import paths; the comment marker handles
    the PDF lazy-load exception.

---

## Summary

| Checklist Item | Status | Notes |
|---|---|---|
| Rust types → TypeScript interfaces | **PASS** | Section 3.4 + 5.1-5.3 + Section 18 consistency table |
| TypeScript interfaces → Zod schemas (strict) | **PASS** | Section 6, TaxpayerInputSchema.strict() |
| Zod field types match serde wire format | **PASS** | Section 6.1 rules + Section 18.1 table |
| Every wizard step: all fields with label/type/validation/error | **FAIL** | Per-field specs missing from spec |
| Every route: component file + auth requirement | **PASS** | Section 11.2, 18 routes |
| Every component: parent route + nav path | **PASS** | Section 14.1-14.4 |
| Every DB table: columns + types + constraints + RLS | **PASS** | Section 10.2-10.3 |
| Every migration is idempotent | **PASS** | Section 10.1, IF NOT EXISTS + DO $$ pattern |
| Every RPC function: signature + params + return type | **PASS** | Section 10.4, 6 RPCs with GRANTs |
| Every premium feature: Supabase-level gating | **PASS** | Section 13.1-13.2 + org.ts |
| Every E2E scenario: steps + assertions + test data | **FAIL** | Only file-level table in Section 15.2 |
| Every empty state: icon + title + description + CTA | **FAIL** | Per-page content not in spec |
| Every toast: trigger + message + variant | **FAIL** | Only 13/41 toasts in spec Section 8.4 |
| Dockerfile builds from spec alone | **PASS** | Section 16.1 + 16.2 |
| fly.toml complete with build args | **PASS** | Section 16.3 + 16.4 |
| Design system → shadcn/ui equivalents | **PASS** | Section 8.2 |
| ZERO orphaned components | **PASS** | Section 14.2, 5 orphan prevention rules |

**PASS: 13 / FAIL: 4**

---

## Gaps to Fix

Four new aspects must be resolved before `cross-layer-consistency` and `spec-review` can proceed.
All four are merge tasks — the content exists in analysis files, it just wasn't incorporated
into the mega spec in the unified-mega-spec wave.

### Gap 1: Wizard Step Field Specifications

**Aspect:** `fill-wizard-step-fields`
**Source:** `loops/freelance-tax-reverse/final-mega-spec/frontend/wizard-steps.md`
**Target:** New Section 7.7 in `docs/plans/freelance-tax-spec.md`
**Content needed:** For all 17 steps (WS-00 through WS-13 including WS-07A/B/C/D):
- Step title and subtitle copy
- For each field: ID, label, type, placeholder, default, required, visible-when, validation rules
  (ordered list), exact error messages, help text / tooltip

### Gap 2: E2E Test Scenarios with Steps and Assertions

**Aspect:** `fill-e2e-specs`
**Source:** `analysis/playwright-e2e-specs.md`
**Target:** Expand Section 15.2 in `docs/plans/freelance-tax-spec.md`
**Content needed:** For each of the 12 test suites:
- Step-by-step test pseudocode (not necessarily full TS, but enough to implement)
- data-testid attribute names used in assertions
- Exact assertion conditions
- Test data fixtures with concrete values
- Global setup code (auth state) pattern

### Gap 3: Per-Page Empty States and Skeleton Loaders

**Aspect:** `fill-empty-states`
**Source:** `analysis/empty-states-and-loading.md`
**Target:** New Section 7.8 or expand Section 8 in `docs/plans/freelance-tax-spec.md`
**Content needed:** For each async page (Dashboard, Computations, Clients, Client profile,
Deadlines, Settings, Team):
- Skeleton loader: exact shapes, number of rows, Tailwind classes
- Empty state: icon (lucide-react name), title (exact string), description (exact string),
  CTA label, CTA destination
- Error state: Alert variant (destructive), message template, retry action

### Gap 4: Complete Toast Catalog (Remaining 28 Toasts)

**Aspect:** `fill-toast-catalog`
**Source:** `analysis/toast-catalog.md`
**Target:** Expand Section 8.4 in `docs/plans/freelance-tax-spec.md`
**Content needed:** The remaining 28 toasts across all 8 categories with trigger action,
Sonner call (`toast.success(...)`, `toast.error(...)`, `toast.loading(...)` + update),
and exact message text. Especially:
- Auto-save error variants ("Auto-save failed — changes not saved. Check your connection.")
- Team management (removed, revoked, role changed)
- Auth flows (sign-in failed, sign-up success, reset sent, password changed)
- Client management (client deleted, client archived)
- Settings saves (BIR info, personal info, logo deleted)

---

## New Aspects to Add to Frontier

Four new aspects (Wave 7.5 — Spec Gap Fills), must be resolved before `cross-layer-consistency`:

1. `fill-wizard-step-fields` — Merge wizard-steps.md per-field detail into spec Section 7.7
2. `fill-e2e-specs` — Merge playwright-e2e-specs.md test code into spec Section 15.2
3. `fill-empty-states` — Merge empty-states-and-loading.md per-page specs into spec Section 8.5
4. `fill-toast-catalog` — Merge remaining 28 toasts into spec Section 8.4

**This aspect (`completeness-audit`) is DONE.** The audit is complete and gaps are documented.
The forward loop for `cross-layer-consistency` and `spec-review` must wait until all 4 gap-fill
aspects are resolved.
