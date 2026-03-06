# Frontier — TaxKlaro Platform Completion

## Statistics
- Total aspects discovered: 37
- Analyzed: 15
- Pending: 22
- Convergence: 41%

## Pending Aspects (ordered by dependency)

### Wave 1: Input Validation
Verify existing domain/engine spec and catalog wrong-stack assumptions.
- [x] validate-domain-spec — Read all domain/ and engine/ files, verify completeness for Rust implementation
- [x] validate-engine-spec — Verify pipeline is pure computation (no I/O), types are suitable for Rust, algorithms use exact arithmetic
- [x] audit-stack-assumptions — Catalog every Next.js/Express/Vercel/Drizzle reference in the old spec, create translation map

### Wave 2: Bridge Contract
Depends on Wave 1. Design the WASM boundary between Rust engine and JavaScript frontend.
- [x] wasm-export-signature — Define compute_json() and other WASM exports with exact parameter/return types
- [x] serde-wire-format — Document exact JSON serialization rules for every struct/enum (rename_all, deny_unknown_fields, Optional as null)
- [x] error-contract — Define error JSON shape from WASM, severity levels, frontend handling
- [x] initialization-patterns — Document initSync vs init for Node.js (vitest) vs browser, bridge.ts pattern

### Wave 3: Frontend Data Model
Depends on Wave 2. Map Rust types to TypeScript + Zod with exact field alignment.
- [x] typescript-types — Map every Rust struct/enum to TypeScript interface (exact field names matching serde)
- [x] zod-schemas — Write strict Zod schemas matching serde wire format (no coercion, null not undefined)
- [x] frontend-state-management — Design state flow: wizard state, computation results, auto-save, hooks (useAuth, useAutoSave, useOrganization, useTaxBridge)

### Wave 4: Platform Layer
Depends on Wave 3. The biggest wave — where inheritance had the most issues.
- [x] supabase-auth-flow — PKCE email/password, magic link, sign-in/sign-up UI, callback route, password reset, session management
- [x] supabase-migrations — Full SQL: tables, RLS policies, RPC functions, triggers, storage buckets (idempotent)
- [x] route-table — Complete TanStack Router route table with beforeLoad auth guards, 18+ routes
- [x] env-configuration — All VITE_* env vars, .env.local.example, graceful missing-var handling (SetupPage pattern)
- [x] navigation — Auth-aware sidebar (desktop) + drawer (mobile), active states, sign-out
- [ ] org-model — Organizations, members, roles, invitations, seat limits, useOrganization() hook
- [ ] computation-management — CRUD for computations, auto-save, status workflow, ComputationCard grid
- [ ] sharing — Token-based read-only sharing, get_shared_computation() RPC, /share/$token route

### Wave 5: Component Wiring + UI
Depends on Wave 4. Every component must have a home.
- [ ] component-wiring-map — Every component -> parent route, navigation path, trigger, props source (zero orphans)
- [ ] action-trigger-map — Every action-triggered feature (PDF export, share toggle, delete, etc.) -> which button triggers it, which parent has the button, onClick handler. Prevents "PDF infra built but no button" failure.
- [ ] design-system-alignment — Map TaxKlaro palette to shadcn/ui + Radix + Tailwind CSS 4 theming
- [ ] visual-verification-checklist — For every major component: required shadcn wrapper (Card/Alert/Badge), key Tailwind classes, lucide icon, color variant. Prevents unstyled test-scaffolding shipping as "complete."
- [ ] empty-states-and-loading — Skeleton loaders, EmptyState components, error states for every async page
- [ ] toast-catalog — Every user action that produces feedback, with message text and variant
- [ ] pdf-export-layout — @react-pdf/renderer layout, sections, firm branding, BIR form reference

### Wave 6: Testing + Deployment
Depends on Wave 5. Production readiness.
- [ ] playwright-e2e-specs — E2E test scenarios for every critical flow (auth, wizard, compute, save, share, export)
- [ ] production-build-verification — Vite plugin inventory, production build smoke test requirements, tree-shaking-sensitive libraries (d3, recharts), WASM loading in prod mode. Prevents "dev works, prod white page" failure.
- [ ] migration-verification — supabase db reset test plan, RPC call tests with real data, parameter type match verification (UUID vs TEXT). Prevents "SQL written but never run" failure.
- [ ] supabase-gotchas — Anon grants for public RPCs, search_path on SECURITY DEFINER, RLS bypass patterns, storage bucket policies. Prevents "works in Supabase dashboard, fails from client" failures.
- [ ] fly-io-deployment — Dockerfile, fly.toml, build args, Supabase project setup, domain config
- [ ] ci-cd-pipeline — GitHub Actions: typecheck -> lint -> test -> build -> e2e -> deploy
- [ ] monitoring-and-alerts — Sentry, health checks, client-side error tracking

### Wave 7: Synthesis
Depends on ALL previous waves. **Strict internal dependency order — do NOT skip ahead.**
- [ ] unified-mega-spec — Assemble docs/plans/freelance-tax-spec.md from all analysis files + imported domain content
- [ ] placeholder-validation — **HARD GATE.** Line-by-line scan for banned patterns. MUST return PASS before proceeding.
- [ ] completeness-audit — Per-feature PASS/FAIL: types match, schemas match, routes wired, components wired, migrations complete, E2E defined
- [ ] cross-layer-consistency — Field-by-field verification: Rust <-> JSON <-> TypeScript <-> Zod
- [ ] spec-review — Final review: can the forward loop build the ENTIRE product from this spec alone?

## Recently Analyzed
| Aspect | Wave | Date | Result |
|--------|------|------|--------|
| validate-domain-spec | 1 | 2026-03-06 | PASS — Domain/engine spec complete for Rust impl. 6 minor issues flagged for Bridge Contract wave. |
| validate-engine-spec | 1 | 2026-03-06 | PASS — Pipeline is pure (no I/O), Decimal arithmetic throughout, all 20+ types concrete. 4 minor inconsistencies flagged. Action items for Bridge Contract wave documented. |
| audit-stack-assumptions | 1 | 2026-03-06 | COMPLETE — 13 files to DISCARD, 9 files need adaptation (specific line-by-line refs cataloged), 27 files fully reusable. Comprehensive translation map produced for all 6 layer types. |
| wasm-export-signature | 2 | 2026-03-06 | COMPLETE — Single compute_json() + validate_json() exports. WasmResult discriminated union envelope. Decimal→string serialization. bridge.ts pattern with Node.js/browser init detection. useTaxBridge hook interface defined. |
| serde-wire-format | 2 | 2026-03-06 | COMPLETE — camelCase fields, SCREAMING_SNAKE_CASE enums, Decimal→string, Option→null, Date→"YYYY-MM-DD", FormOutputUnion adjacently tagged, deny_unknown_fields on inputs only. Full Cargo.toml deps + wire examples. |
| error-contract | 2 | 2026-03-06 | COMPLETE — All 29 ERR_* codes, 5 ineligibility errors, 8 assertion errors, 9 WARN_* codes, 5 IN-* codes, MRF_* types. Rust serde attrs, JSON wire format, TypeScript interfaces, Zod schemas, frontend handling (ValidationError vs ComputeError vs Sentry). Dynamic field name mapping table. |
| typescript-types | 3 | 2026-03-06 | COMPLETE — 4 files (common.ts, engine-input.ts, engine-output.ts, index.ts). All 14 enums mapped with string literal unions + as-const arrays. All input/output structs mapped with exact camelCase fields. FormOutputUnion discriminated union with type guards. Default factory function. Cross-layer consistency table with critical traps for digit-in-name fields and formType vs formVariant distinction. |
| zod-schemas | 3 | 2026-03-06 | COMPLETE — 6 files (primitives, enums, input, output, bridge, index). All input schemas use .strict(). Output schemas no .strict(). .nullable() throughout (not .optional()). z.boolean() no coerce. Per-step wizard schemas for WS-01/03/04/07C/08. WasmResultSchema factory. 8 critical traps documented. Full cross-layer consistency table. |
| supabase-auth-flow | 4 | 2026-03-06 | COMPLETE — main.tsx bootstrap with getSession+onAuthStateChange, supabase.ts with supabaseConfigured guard, lib/auth.ts wrappers, all 5 auth routes (auth, callback, reset, reset-confirm, onboarding), SetupPage, beforeLoad guard pattern, RouterContext type, email redirect URLs, 6 critical traps documented. |
| supabase-migrations | 4 | 2026-03-06 | COMPLETE — 4 migration files: 001 (8 tables, 5 enums, 2 triggers, RLS enable), 002 (user_org_ids() helper + 32 RLS policies), 003 (6 RPCs with explicit GRANTs incl. anon for public RPCs), 004 (firm-logos storage bucket). All p_token params are UUID. Column-type match table. 8 critical traps. lib/organizations.ts, lib/clients.ts, lib/computation-notes.ts. |
