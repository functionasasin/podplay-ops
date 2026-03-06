# Frontier — RA 7641 Retirement Pay Calculator

## Statistics
- Total aspects discovered: 55
- Analyzed: 0
- Pending: 55
- Convergence: 0%

## Pending Aspects (ordered by dependency)

### Wave 1: Domain Source Acquisition
Fetch and cache primary legal sources.
- [ ] cache-existing-analysis — Import deep-dive from loops/ph-compliance-moats-reverse/analysis/deepdive-retirement-pay-ra7641.md into input/sources/
- [ ] fetch-ra7641-full-text — Fetch RA 7641 (Retirement Pay Law) full text from Official Gazette or LawPhil
- [ ] fetch-labor-code-art302 — Fetch Labor Code Art. 302 (renumbered from Art. 287) on retirement
- [ ] fetch-elegir-v-pal — Fetch Supreme Court ruling Elegir v. Philippine Airlines confirming 22.5 days
- [ ] fetch-nirc-tax-exemption — Fetch NIRC Sec. 32(B)(6)(a) + Revenue Regulation 1-68 on retirement pay tax exemption
- [ ] fetch-separation-pay-rules — Fetch Labor Code Art. 298-299 (authorized causes for separation pay)
- [ ] fetch-dole-final-pay — Fetch DOLE Labor Advisory 06-20 on final pay computation rules
- [ ] fetch-bir-approved-plans — Fetch BIR requirements for approved retirement plans (RR 1-68 conditions)

### Wave 2: Domain Rule Extraction
Depends on Wave 1 sources being cached.
- [ ] core-formula-22-5-days — Extract the 22.5-day formula: 15 days + 5 days SIL + 1/12 of 13th month pay
- [ ] eligibility-rules — Age thresholds (60 optional, 65 compulsory), 5-year service minimum, employer size exemption (<=10 employees)
- [ ] credited-years-rounding — 6-month rounding rule: partial year >= 6 months rounds up, < 6 months drops
- [ ] salary-basis-inclusions — What's included (basic, integrated COLA, contractual allowances) and excluded (OT, NSD, variable allowances)
- [ ] tax-treatment-conditions — Four conditions for tax exemption: age >= 50, service >= 10 years, first-time benefit, BIR-approved plan
- [ ] separation-pay-interaction — Art. 298 authorized causes overlap, pay-the-higher rule, dual entitlement scenarios
- [ ] company-plan-comparison-rules — How statutory minimum compares to company plans, which prevails, gap calculation
- [ ] death-before-retirement — Heirs' entitlement to retirement pay as if employee retired on date of death
- [ ] batch-computation-rules — CSV input schema, per-employee computation, aggregation rules, summary statistics
- [ ] nlrc-worksheet-format — NLRC money claim statement of computation format, required fields, exhibit structure
- [ ] edge-cases-catalog — Company transfers, contractual vs regular employees, CBA retirement provisions, DOLE exemptions

### Wave 3: Engine Design
Depends on Wave 2 rule extraction.
- [ ] data-model — Define all Rust types: RetirementInput, RetirementOutput, EligibilityResult, TaxTreatment, SeparationPayComparison, BatchInput, BatchOutput, NlrcWorksheet, CompanyPlanAnalysis
- [ ] computation-pipeline — Design ordered pipeline: eligibility check -> credited years -> daily rate -> retirement pay -> tax treatment -> separation pay comparison -> company plan gap
- [ ] algorithms — Exact arithmetic: integer centavos, rational fractions for 22.5-day decomposition, rounding rules
- [ ] batch-engine — Batch processing pipeline: CSV parse -> validate rows -> compute per-employee -> aggregate -> summary
- [ ] nlrc-worksheet-generator — NLRC worksheet output: computation breakdown, legal basis citations, exhibit formatting
- [ ] test-vectors — 20+ test vectors: basic case, 15-day error case, rounding edge cases, tax exempt/taxable, death, batch, separation pay overlap
- [ ] invariants — Rules that must hold: retirement pay >= 0, credited years >= 5 (if eligible), 22.5-day formula always used, tax exemption requires all 4 conditions

### Wave 4: Bridge Contract
Depends on Wave 3 data model.
- [ ] wasm-export-signature — Define exports: compute_single_json(input: &str) -> String, compute_batch_json(input: &str) -> String, generate_nlrc_json(input: &str) -> String
- [ ] serde-wire-format — Exact JSON rules: deny_unknown_fields, rename_all = "camelCase", null for Optional, boolean as true/false, money as integer centavos
- [ ] error-contract — Error JSON shape: { error: string, code: string, field?: string, severity: "error" | "warning" | "info" }
- [ ] initialization-patterns — initSync for Node.js (vitest), init for browser, bridge.ts wrapper pattern

### Wave 5: Frontend Data Model + UI Design
Depends on Wave 3 + Wave 4.
- [ ] typescript-types — Map every Rust struct/enum to TypeScript interface (exact field names matching serde camelCase)
- [ ] zod-schemas — Strict Zod schemas: z.object({}).strict(), z.boolean() not z.coerce.boolean(), z.nullable() not z.optional()
- [ ] wizard-steps — Single employee wizard: Step 1 (employee info), Step 2 (employment details), Step 3 (salary & benefits), Step 4 (retirement details), Step 5 (company plan optional)
- [ ] batch-upload-ui — CSV upload component, file validation, progress bar, results table with per-employee rows, summary card, export options
- [ ] company-plan-ui — Company plan input form, side-by-side comparison view, gap analysis per employee
- [ ] nlrc-worksheet-ui — NLRC worksheet display component, legal citation formatting, print/PDF layout
- [ ] results-view — Results components: eligibility badge, pay breakdown card, tax treatment alert, separation pay comparison, 15-day vs 22.5-day visual comparison
- [ ] shared-components — Reusable widgets: MoneyInput (centavo precision), DateInput, EnumSelect, CsvUploader, ComparisonTable, LegalCitation
- [ ] design-system — Palette (professional/trustworthy for labor law), typography, spacing, shadcn/ui + Radix + Tailwind CSS 4
- [ ] auth-flow — Supabase PKCE: email/password + magic link, sign-in/sign-up pages, callback route, password reset, session management
- [ ] landing-page — Unauthenticated experience: product description, the 33% underpayment hook, clear sign-in/sign-up CTA, sample computation teaser
- [ ] route-table — Complete TanStack Router table: /, /auth, /auth/callback, /dashboard, /compute/new, /compute/$id, /compute/$id/results, /compute/$id/nlrc, /batch/new, /batch/$id, /share/$token, /settings, /org/*
- [ ] env-configuration — VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, .env.local.example, SetupPage pattern for missing vars
- [ ] database-migrations — Tables (computations, organizations, members, invitations, shared_links), RLS policies, RPC functions (get_shared_computation, create_org), triggers, idempotent (IF NOT EXISTS)
- [ ] navigation — Auth-aware sidebar (desktop) + drawer (mobile), active states, sign-out, org switcher
- [ ] org-model — Organizations for HR departments, members, roles (owner/admin/member), invitations, seat limits, useOrganization() hook
- [ ] computation-management — CRUD for saved computations, auto-save, status workflow (draft/computed/shared), ComputationCard grid
- [ ] sharing — Token-based read-only sharing, get_shared_computation() RPC with UUID parameter, /share/$token route, anon GRANT
- [ ] component-wiring-map — Every component -> parent route/page/tab/dialog, navigation path from home, trigger (for modals), props source. Zero orphans.
- [ ] action-trigger-map — Every action (PDF export, share toggle, delete, batch export, NLRC print) -> which button triggers it, which parent has the button, onClick handler, feedback (toast/download/navigation)
- [ ] visual-verification-checklist — Every major component -> required shadcn wrapper (Card/Alert/Badge/Table), key Tailwind classes, lucide icon, color variant, status indicator styling
- [ ] empty-states-and-loading — Skeleton loaders for every async page, EmptyState components (no computations yet, no org members, empty batch), error states
- [ ] toast-catalog — Every user action that produces feedback: save (success/error), delete (confirm + success), share (link copied), PDF (downloading), batch upload (processing/complete/errors), auth (signed in/out/error)
- [ ] pdf-export-layout — @react-pdf/renderer layouts: single computation PDF, batch summary PDF, NLRC worksheet PDF, firm branding, legal disclaimers

### Wave 6: Testing + Deployment
Depends on Wave 5.
- [ ] playwright-e2e-specs — E2E scenarios: auth flow, single computation wizard, batch upload, share link, PDF export, NLRC worksheet, org management
- [ ] production-build-verification — Vite plugin inventory (exact order), production build smoke test (npm run build + npx serve dist), tree-shaking-sensitive libs, WASM loading in prod mode
- [ ] migration-verification — supabase db reset test plan, RPC call tests with real data, parameter type matching (UUID vs TEXT), RLS policy verification
- [ ] supabase-gotchas — Anon grants for public RPCs (sharing), search_path on SECURITY DEFINER, RLS bypass patterns, storage bucket policies, auth email confirmation in dev
- [ ] fly-io-deployment — Dockerfile (multi-stage: wasm-pack + node build), fly.toml (app name, region, env), build args, Supabase project setup, domain config
- [ ] ci-cd-pipeline — GitHub Actions: typecheck -> lint -> vitest -> build -> playwright -> deploy to Fly.io

### Wave 7: Synthesis
Depends on ALL previous waves. **Strict internal dependency order — do NOT skip ahead.**
- [ ] spec-draft — Assemble docs/plans/retirement-pay-spec.md from all analysis files + domain content. Every section fully written.
- [ ] placeholder-validation — **HARD GATE.** Line-by-line scan for banned patterns. MUST return PASS before proceeding. If FAIL: create new aspects to resolve each gap.
- [ ] completeness-audit — Per-feature PASS/FAIL: types match, schemas match, routes wired, components wired, migrations complete, E2E defined. Includes orphan check on component wiring map.
- [ ] cross-layer-consistency — Field-by-field verification: Rust <-> JSON <-> TypeScript <-> Zod for every struct, enum, and field
- [ ] spec-review — Final review: can the forward loop build the ENTIRE product from this spec alone?

## Recently Analyzed
(Empty — loop hasn't started yet)
