# Frontier — TaxKlaro Platform Completion

## Statistics
- Total aspects discovered: 32
- Analyzed: 0
- Pending: 32
- Convergence: 0%

## Pending Aspects (ordered by dependency)

### Wave 1: Input Validation
Verify existing domain/engine spec and catalog wrong-stack assumptions.
- [ ] validate-domain-spec — Read all domain/ and engine/ files, verify completeness for Rust implementation
- [ ] validate-engine-spec — Verify pipeline is pure computation (no I/O), types are suitable for Rust, algorithms use exact arithmetic
- [ ] audit-stack-assumptions — Catalog every Next.js/Express/Vercel/Drizzle reference in the old spec, create translation map

### Wave 2: Bridge Contract
Depends on Wave 1. Design the WASM boundary between Rust engine and JavaScript frontend.
- [ ] wasm-export-signature — Define compute_json() and other WASM exports with exact parameter/return types
- [ ] serde-wire-format — Document exact JSON serialization rules for every struct/enum (rename_all, deny_unknown_fields, Optional as null)
- [ ] error-contract — Define error JSON shape from WASM, severity levels, frontend handling
- [ ] initialization-patterns — Document initSync vs init for Node.js (vitest) vs browser, bridge.ts pattern

### Wave 3: Frontend Data Model
Depends on Wave 2. Map Rust types to TypeScript + Zod with exact field alignment.
- [ ] typescript-types — Map every Rust struct/enum to TypeScript interface (exact field names matching serde)
- [ ] zod-schemas — Write strict Zod schemas matching serde wire format (no coercion, null not undefined)
- [ ] frontend-state-management — Design state flow: wizard state, computation results, auto-save, hooks (useAuth, useAutoSave, useOrganization, useTaxBridge)

### Wave 4: Platform Layer
Depends on Wave 3. The biggest wave — where inheritance had the most issues.
- [ ] supabase-auth-flow — PKCE email/password, magic link, sign-in/sign-up UI, callback route, password reset, session management
- [ ] supabase-migrations — Full SQL: tables, RLS policies, RPC functions, triggers, storage buckets (idempotent)
- [ ] route-table — Complete TanStack Router route table with beforeLoad auth guards, 18+ routes
- [ ] env-configuration — All VITE_* env vars, .env.local.example, graceful missing-var handling (SetupPage pattern)
- [ ] navigation — Auth-aware sidebar (desktop) + drawer (mobile), active states, sign-out
- [ ] org-model — Organizations, members, roles, invitations, seat limits, useOrganization() hook
- [ ] computation-management — CRUD for computations, auto-save, status workflow, ComputationCard grid
- [ ] sharing — Token-based read-only sharing, get_shared_computation() RPC, /share/$token route

### Wave 5: Component Wiring + UI
Depends on Wave 4. Every component must have a home.
- [ ] component-wiring-map — Every component -> parent route, navigation path, trigger, props source (zero orphans)
- [ ] design-system-alignment — Map TaxKlaro palette to shadcn/ui + Radix + Tailwind CSS 4 theming
- [ ] empty-states-and-loading — Skeleton loaders, EmptyState components, error states for every async page
- [ ] toast-catalog — Every user action that produces feedback, with message text and variant
- [ ] pdf-export-layout — @react-pdf/renderer layout, sections, firm branding, BIR form reference

### Wave 6: Testing + Deployment
Depends on Wave 5. Production readiness.
- [ ] playwright-e2e-specs — E2E test scenarios for every critical flow (auth, wizard, compute, save, share, export)
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
(Empty — loop hasn't started yet)
