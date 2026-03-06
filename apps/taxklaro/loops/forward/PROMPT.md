# Forward Ralph Loop — TaxKlaro Full-Stack Build

You are running in `--print` mode. You MUST output text describing what you are doing. If you only make tool calls without outputting text, your output is lost and the loop operator cannot see progress. Always:
1. Start by printing which stage you detected and what you're about to do
2. Print progress as you work
3. End with a summary of what you did and whether you committed

You are a development agent in a forward ralph loop. Each time you run, you do ONE unit of work: scaffold, write tests, implement code, or fix failures for a single stage, then commit and exit.

## Your Working Directories

- **Loop dir**: `apps/taxklaro/loops/forward/` (frontier, status, loop script)
- **App dir**: `apps/taxklaro/` (engine/ and frontend/ — YOUR BUILD TARGET)
- **Spec**: `apps/taxklaro/specs/taxklaro-spec.md` (your SOLE source of truth — 20 sections, 6742 lines)

## Tech Stack

- **Engine**: Rust + `rust_decimal` + `serde_json` + `serde_with` → WASM (wasm-pack `--target web`)
- **Frontend**: React 19, Vite 6, TanStack Router v1, shadcn/ui (New York style), Radix, Tailwind CSS 4
- **Forms**: React Hook Form + @hookform/resolvers/zod
- **Validation**: Zod (strict on inputs, permissive on outputs)
- **Auth/DB**: Supabase (PKCE email/password, magic link, PostgreSQL with RLS, Storage)
- **PDF**: @react-pdf/renderer v4.x
- **Testing**: Vitest (unit), Playwright (E2E)
- **Monitoring**: Sentry Browser SDK
- **Hosting**: Docker → nginx:alpine → Fly.io (Singapore)

## What To Do This Iteration

1. **Read the frontier**: Open `apps/taxklaro/loops/forward/frontier/current-stage.md`
2. **Identify your work priority** (pick the FIRST that applies):

   **Priority 1 — SETUP** (if stage requires scaffolding, packages, or config):
   - Read the spec sections for the current stage
   - Create project structure, install packages, write config files
   - Commit: `taxklaro: stage {N} - setup {description}`
   - Exit

   **Priority 2 — WRITE TESTS** (if the stage's test file has < 5 test functions):
   - Read the spec sections listed in the stage table
   - Write comprehensive tests covering: happy path, edge cases, validation rules
   - Tests MUST compile and run (they may fail if implementation doesn't exist yet)
   - Create stub exports so tests can import (empty functions, placeholder components)
   - Commit: `taxklaro: stage {N} - write tests`
   - Exit

   **Priority 3 — IMPLEMENT** (if tests exist but the module is mostly stubs):
   - Read the spec sections carefully — use exact types, field names, enums, and validation rules
   - Implement the module/component to pass as many tests as possible
   - Every type name, field name, and behavior comes from the spec — never invent
   - Focus on one cohesive piece per iteration (don't try to implement everything)
   - Commit: `taxklaro: stage {N} - implement {description}`
   - Exit

   **Priority 4 — FIX FAILURES** (if tests exist and some are failing):
   - Run the appropriate test command for the stage
   - Identify the root cause of 1-3 related failures
   - Fix the implementation code (NOT the tests, unless a test contradicts the spec)
   - Commit: `taxklaro: stage {N} - fix {description}`
   - Exit

   **Priority 5 — ADVANCE** (if ALL tests pass for the current stage):
   - Write `apps/taxklaro/loops/forward/status/stage-{N}-complete.txt` with timestamp and summary
   - Update `apps/taxklaro/loops/forward/frontier/current-stage.md` to the NEXT stage
   - Commit: `taxklaro: stage {N} complete, advancing to stage {N+1}`
   - Exit

3. **Commit your work** before exiting. Always. Even partial progress.

## Stage Table

| Stage | Name | Spec Sections | Test Command | Depends On | Phase |
|-------|------|---------------|-------------|------------|-------|
| 1 | Engine Scaffold | §3.1, §3.2 | `cargo check` | — | Engine |
| 2 | Engine Types + Rates | §3.3, §3.4 | `cargo check` | 1 | Engine |
| 3 | Engine Pipeline | §3.5, §3.6, §3.7 | `cargo test` | 2 | Engine |
| 4 | Engine WASM Build | §3.8 | `wasm-pack build --target web` | 3 | Engine |
| 5 | Frontend Scaffold + WASM Bridge | §2, §4, §7.1 | `npx vitest run --reporter=verbose` | 4 | Frontend |
| 6 | TypeScript Types | §5 | `npx tsc --noEmit` | 5 | Frontend |
| 7 | Zod Schemas | §6 | `npx vitest run src/schemas/` | 6 | Frontend |
| 8 | Design System | §8.1, §8.2, §8.3 | `npx vite build` | 5 | Frontend |
| 9 | Wizard State + Step Routing | §7.2, §7.3, §7.4 | `npx vitest run src/hooks/` | 6, 7 | Frontend |
| 10 | Wizard Steps WS-01 → WS-09 | §7.7 | `npx vitest run src/components/wizard/` | 8, 9 | Frontend |
| 11 | Wizard Steps WS-10 → WS-17 | §7.7 | `npx vitest run src/components/wizard/` | 10 | Frontend |
| 12 | Results View + Compute | §7.4, §14 (results) | `npx vitest run src/components/results/` | 9 | Frontend |
| 13 | Supabase + Migrations | §10 | `npx supabase db reset` | 5 | Platform |
| 14 | Auth | §9 | `npx vitest run src/lib/auth` | 13 | Platform |
| 15 | Routes + Navigation | §11, §12 | `npx vitest run src/routes/` | 8, 14 | Platform |
| 16 | Org Model + Computations CRUD | §13, §7.5 | `npx vitest run src/lib/computations` | 14 | Platform |
| 17 | Sharing + Auto-save | §7.6, §7.4 (useAutoSave) | `npx vitest run src/lib/share` | 16 | Platform |
| 18 | Component Wiring | §14 | `npx vitest run src/__tests__/wiring` | 10-17 | Wiring |
| 19 | Empty States + Toasts + Loading | §8.4, §8.5 | `npx vitest run src/__tests__/ui-states` | 18 | Polish |
| 20 | Monitoring | §17 | `npx vitest run src/lib/monitoring` | 5 | Polish |
| 21 | Deployment Config | §16.1–§16.4 | `docker build .` | 4 | Deploy |
| 22 | CI/CD Workflows | §16.5, §16.6 | lint yaml | 21 | Deploy |
| 23 | Unit Tests (full suite) | §15.1 | `npx vitest run --reporter=verbose` | 18 | Testing |
| 24 | E2E Tests | §15.2 | `npx playwright test` | 18 | Testing |
| 25 | Integration Sweep | — | grep + build + full tests | all | Final |

## Stage Details

### Stage 1 — Engine Scaffold (§3.1, §3.2)

Create the Rust crate with correct Cargo.toml and stub WASM exports.

**Tasks:**
1. Create `apps/taxklaro/engine/Cargo.toml` exactly as spec §3.1
2. Create `src/lib.rs` with module declarations
3. Create `src/wasm.rs` with `compute_json()` and `validate_json()` stubs (return empty WasmResult)
4. Run `cargo check` in engine directory

**Advance when:** `cargo check` passes

---

### Stage 2 — Engine Types + Rates (§3.3, §3.4)

Implement all Rust domain types with correct serde attributes.

**Tasks:**
1. Create `src/types.rs` — all enums (14) and structs from spec §3.4
2. Create `src/rates.rs` — graduated tax brackets, OSD rate, 8% threshold
3. Create `src/errors.rs` — EngineError, ValidationWarning, IneligibilityCode, AssertionCode from spec §3.6
4. Serde conventions: `rename_all = "camelCase"` on structs, `rename_all = "SCREAMING_SNAKE_CASE"` on enums, `deny_unknown_fields` on input types only

**Critical traps (from spec §19):**
- `rust_decimal::Decimal` for ALL monetary amounts — never f64
- `serde_with::DisplayFromStr` for Decimal serialization (JSON string "1234.56")
- FormType enum: `Form1701A`, `Form1701`, `Form1701Q` (digit-in-name — serde rename carefully)
- TaxpayerType: `PURELY_SE` not `PurelySe` in SCREAMING_SNAKE_CASE

**Advance when:** `cargo check` passes, all types compile

---

### Stage 3 — Engine Pipeline (§3.5, §3.6, §3.7)

Implement the 16-step computation pipeline.

**Tasks:**
1. Create `src/pipeline.rs` — `pub fn run_pipeline(input: &TaxpayerInput) -> EngineOutput`
2. Implement steps PL-01 through PL-17 from spec §3.5
3. Implement WasmResult envelope (spec §3.7) — `{ ok: true, data }` or `{ ok: false, errors }`
4. Write unit tests for pipeline: basic graduated, OSD, 8% flat, mixed income, ineligibility

**Critical traps:**
- 8% flat: `0.08 * (gross - 250_000)` — the ₱250K is subtracted BEFORE applying 8%
- OSD: `0.40 * gross_receipts` — NOT gross income
- PATH_C eligibility: gross ≤ ₃,000,000 AND taxpayer type ∈ {PURELY_SE, MIXED_BUT_SE_ONLY, PROFESSIONAL}
- `recommended_regime` is the path with lowest `tax_due` among eligible paths

**Advance when:** `cargo test` passes — at least 5 test cases covering all 3 paths

---

### Stage 4 — Engine WASM Build (§3.8)

Wire WASM exports and verify build.

**Tasks:**
1. Complete `src/wasm.rs` — `compute_json(input_json: &str) -> String` and `validate_json(input_json: &str) -> String`
2. `compute_json` deserializes input, calls `run_pipeline`, serializes WasmResult
3. `validate_json` deserializes input, runs validation-only checks, returns WasmResult with warnings
4. Run `wasm-pack build --target web` in engine directory

**Advance when:** `wasm-pack build --target web` succeeds, produces `pkg/` directory

---

### Stage 5 — Frontend Scaffold + WASM Bridge (§2, §4, §7.1)

Create the Vite project and wire WASM loading.

**Tasks:**
1. Create `apps/taxklaro/frontend/package.json` with deps from spec §7.1
2. Create `vite.config.ts` from spec §4.4 (WASM plugin config)
3. Create `tsconfig.json` (strict mode)
4. Create `vitest.config.ts`
5. Create `src/main.tsx` (React root — NO auth bootstrap yet, just render App)
6. Create `src/wasm/bridge.ts` from spec §4.2 — `initWasm()`, `compute()`, `validate()`
7. Create `src/test-setup.ts` from spec §4.3 (Node.js WASM init via `initSync`)
8. Run `npm install`

**Critical traps:**
- Bridge must use `init()` (async, browser) not `initSync()` — except in Vitest where `initSync` with `readFileSync` is required
- `vite.config.ts` must handle `.wasm` files — use `vite-plugin-wasm` + `vite-plugin-top-level-await`

**Advance when:** `npx vitest run` passes (even if 0 tests), `npx vite build` succeeds

---

### Stage 6 — TypeScript Types (§5)

Map all Rust types to TypeScript with exact field name alignment.

**Tasks:**
1. Create `src/types/common.ts` — spec §5.1 (14 enums as string literal unions + as-const arrays)
2. Create `src/types/engine-input.ts` — spec §5.2 (TaxpayerInput, ItemizedExpenseInput, Form2307Entry, etc.)
3. Create `src/types/engine-output.ts` — spec §5.3 (EngineOutput, PathResult, FormOutputUnion, all BIR form output types)
4. Create `src/types/org.ts` — spec §5.4 (Organization, Computation, UserProfile, etc.)
5. Create `src/types/index.ts` — re-export all

**Critical traps:**
- Field names must match serde camelCase exactly (e.g. `grossReceipts` not `grossReceiptsAmount`)
- FormOutputUnion is discriminated on `formType` field
- All monetary values are `string` (Decimal serializes as string in JSON)
- Nullable fields use `| null`, never `?` (matches serde Option → null)

**Advance when:** `npx tsc --noEmit` passes with zero errors

---

### Stage 7 — Zod Schemas (§6)

Strict Zod schemas matching serde wire format.

**Tasks:**
1. Create `src/schemas/primitives.ts` — spec §6.3 (decimal, money, date)
2. Create `src/schemas/enums.ts` — spec §6.4 (all 14 enum schemas)
3. Create `src/schemas/input.ts` — spec §6.5 (TaxpayerInputSchema with `.strict()`)
4. Create `src/schemas/output.ts` — (EngineOutputSchema, no `.strict()`)
5. Create `src/schemas/bridge.ts` — (WasmResultSchema factory)
6. Create `src/schemas/index.ts` — re-export + per-step wizard schemas from spec §6.6

**Critical traps:**
- `.strict()` on ALL input schemas (deny unknown fields)
- `.nullable()` throughout — NOT `.optional()` (matches serde null, not undefined)
- `z.boolean()` — NO `.coerce()` (serde sends true/false, not "true"/"false")
- Per-step wizard schemas for WS-01, WS-03, WS-04, WS-07C, WS-08

**Advance when:** `npx vitest run src/schemas/` passes — schema parse/reject tests

---

### Stage 8 — Design System (§8.1, §8.2, §8.3)

Set up visual foundation.

**Tasks:**
1. Create `src/index.css` with CSS custom properties from spec §8.1
2. Install and configure shadcn/ui (New York style) — spec §8.2 component list
3. Install lucide-react icons — spec §8.3 icon mapping
4. Install Sonner for toasts (NOT shadcn toast — spec §8.4 critical trap)
5. Verify `npx vite build` produces > 20KB CSS

**Advance when:** `npx vite build` succeeds

---

### Stage 9 — Wizard State + Step Routing (§7.2, §7.3, §7.4)

Wizard data model and conditional step visibility.

**Tasks:**
1. Create `WizardFormData` type and `DEFAULT_WIZARD_DATA` from spec §7.2
2. Create `computeActiveSteps(data: WizardFormData): WizardStepId[]` from spec §7.3
3. Create `src/hooks/useCompute.ts` — calls bridge.compute(), returns typed result
4. Create `src/hooks/useAutoSave.ts` — 1500ms debounced save (stub Supabase calls)
5. Create `WizardContainer` component — step navigation, progress bar, mobile-friendly

**Critical traps:**
- Steps are CONDITIONAL — e.g. WS-07A/B/C only shown based on regimePreference
- `computeActiveSteps` must match spec §7.3 routing matrix exactly

**Advance when:** `npx vitest run src/hooks/` passes — step routing logic tests

---

### Stage 10 — Wizard Steps WS-01 → WS-09 (§7.7)

First 9 wizard steps with full field specs.

**Tasks:**
1. WS-01: Taxpayer Type (radio group)
2. WS-02: Tax Year + Period
3. WS-03: Personal Info (name, TIN, RDO, address, ZIP)
4. WS-04: Income Sources (gross receipts, non-operating income, CWT 2307 entries)
5. WS-05: Regime Preference (radio: let engine decide / specific path)
6. WS-06: OSD Confirmation (shown only if OSD-eligible)
7. WS-07A: Itemized Expenses (23 fields from spec — exact field names)
8. WS-07B: OSD Review (read-only computed OSD)
9. WS-07C: 8% Review (read-only computed flat tax)
10. WS-08: Tax Credits + CWT (withholding, prior payments, penalties)
11. WS-09: Review + Compute

**Each step:**
- React Hook Form + Zod per-step schema
- shadcn/ui form components
- All field labels, placeholders, validation, and error messages from spec §7.7

**Advance when:** `npx vitest run src/components/wizard/` — render + validation tests pass

---

### Stage 11 — Wizard Steps WS-10 → WS-17 (§7.7)

Remaining wizard steps (conditional/advanced).

**Tasks:**
1. WS-10: NOLCO Schedule (Net Operating Loss Carry-Over, 3-year table)
2. WS-11: Mixed Income — Employment Details
3. WS-12: Mixed Income — Compensation Breakdown
4. WS-13: Mixed Income — Employment Tax Credits
5. WS-14: Quarterly Filing (Q1-Q3 cumulative data)
6. WS-15: Partner/Spouse Info (for married filing)
7. WS-16: Additional BIR Schedules
8. WS-17: Final Confirmation + Submit

**Advance when:** `npx vitest run src/components/wizard/` — all step tests pass

---

### Stage 12 — Results View + Compute (§7.4, §14 results)

Display engine output with all result components.

**Tasks:**
1. Create `ResultsView.tsx` — main results container
2. Create `PathComparisonTable.tsx` — side-by-side 3-path comparison
3. Create `RecommendedBadge.tsx` — highlights lowest-tax path
4. Create `FormOutputPanel.tsx` — displays BIR form line items
5. Create `WarningsPanel.tsx` — validation warnings + ineligibility notices
6. Create `NarrativePanel.tsx` — plain-language explanation
7. Wire `useCompute` hook — compute on wizard submit, display results

**Advance when:** `npx vitest run src/components/results/` — render tests pass

---

### Stage 13 — Supabase + Migrations (§10)

Initialize Supabase and create all database objects.

**Tasks:**
1. Run `npx supabase init` in `apps/taxklaro/frontend/`
2. Create `supabase/migrations/001_initial_schema.sql` from spec §10.2 (8 tables, 5 enums, triggers)
3. Create `supabase/migrations/002_rls_policies.sql` from spec §10.3 (32 RLS policies, `user_org_ids()` helper)
4. Create `supabase/migrations/003_rpc_functions.sql` from spec §10.4 (6 RPCs with explicit GRANTs)
5. Create `supabase/migrations/004_storage.sql` from spec §10.5 (firm-logos bucket)
6. Create `.env.local.example`

**Critical traps (from spec §10.6 + §19):**
- `p_token` parameters MUST be `UUID` not `TEXT` — inheritance app failure root cause
- `GRANT EXECUTE ON FUNCTION ... TO anon` for public RPCs (get_shared_computation)
- `SET search_path = public` on all SECURITY DEFINER functions
- `ENABLE ROW LEVEL SECURITY` explicit on every table (Supabase doesn't auto-enable)
- UNIQUE constraint on `computation_deadlines(computation_id, milestone_key)` for idempotency

**DB Verification (run before advancing):**
- `npx supabase db reset` succeeds without errors
- All 6 RPCs callable with test data
- RLS policies verified: user in org A cannot see org B data

**Advance when:** `npx supabase db reset` succeeds cleanly

---

### Stage 14 — Auth (§9)

Supabase PKCE auth with email/password and magic link.

**Tasks:**
1. Create `src/lib/supabase.ts` from spec §9.2 (supabaseConfigured guard)
2. Update `src/main.tsx` from spec §9.3 (getSession + onAuthStateChange bootstrap)
3. Create `src/lib/auth.ts` — signInWithPassword, signInWithOtp, signUp, signOut, resetPassword
4. Create `src/hooks/useAuth.ts` — auth state hook (user, loading, signIn, signUp, signOut)
5. Create auth routes: `/auth`, `/auth/callback`, `/auth/reset`, `/auth/reset-confirm`
6. Create `SetupPage.tsx` — shown when VITE_SUPABASE_URL is missing

**Critical traps:**
- getSession() BEFORE onAuthStateChange listener — spec §9.5
- PKCE flow: callback route handles code exchange
- Email redirect URLs must be whitelisted in Supabase dashboard

**Advance when:** `npx vitest run src/lib/auth` — auth helper tests pass

---

### Stage 15 — Routes + Navigation (§11, §12)

TanStack Router with 18 routes and auth-aware layout.

**Tasks:**
1. Create `src/router.ts` from spec §11.1 (createRouter with context)
2. Create all 18 route files from spec §11.2 (route table)
3. Implement `beforeLoad` auth guard pattern from spec §11.3
4. Create `AppLayout.tsx` from spec §12.1 (sidebar desktop + drawer mobile)
5. Create `SidebarContent.tsx` from spec §12.2 (auth-aware nav items)

**Critical traps:**
- Public routes (/, /auth/*, /share/$token) must NOT have auth guard
- Route file naming must follow TanStack Router file conventions exactly
- RouterContext type must include `auth: { user: User | null }`

**Advance when:** `npx vitest run src/routes/` — route render + guard tests pass

---

### Stage 16 — Org Model + Computations CRUD (§13, §7.5)

Organizations, members, and computation persistence.

**Tasks:**
1. Create `src/hooks/useOrganization.ts` from spec §13.2
2. Implement plan tiers from spec §13.1 (solo: 1, team: 5, firm: unlimited)
3. Create `src/lib/computations.ts` from spec §7.5 — full CRUD
4. Create `ComputationCard.tsx` — grid card with status, regime, last modified
5. Create computations list page with status tabs (draft/computed/finalized/archived)

**Advance when:** `npx vitest run src/lib/computations` — CRUD tests pass

---

### Stage 17 — Sharing + Auto-save (§7.6, §7.4)

Token-based sharing and debounced auto-save.

**Tasks:**
1. Create `src/lib/share.ts` from spec §7.6 — toggleShare, getSharedComputation
2. Create `ShareView.tsx` — read-only results at `/share/$token`
3. Wire `useAutoSave` hook to real Supabase calls (1500ms debounce)
4. Create `SaveStatusIndicator.tsx` — "Saving..." / "Saved" / "Error"

**Advance when:** `npx vitest run src/lib/share` — share + auto-save tests pass

---

### Stage 18 — Component Wiring (§14)

Wire all 90 components to their parent routes — zero orphans.

**Tasks:**
1. Walk spec §14.1 directory structure — verify every component file exists
2. Walk spec §14.2 orphan prevention rules — verify every component is imported by a route
3. Walk spec §14.3 action trigger map — verify every button has an onClick handler
4. Walk spec §14.4 visibility rules — verify auth-gated components check user state
5. Wire `ResultsView` readOnly contract from spec §14.5
6. Create `src/__tests__/wiring.test.ts` — import scan for orphaned exports

**Advance when:** `npx vitest run src/__tests__/wiring` — zero orphans, all wired

---

### Stage 19 — Empty States + Toasts + Loading (§8.4, §8.5)

User feedback for every async state.

**Tasks:**
1. Create `EmptyState.tsx` and `ErrorState.tsx` shared components from spec §8.5
2. Add skeleton loaders for all async pages from spec §8.5
3. Configure Sonner toasts from spec §8.4 (41 toasts across 8 categories)
4. Wire loading/error/empty states to every page that fetches data
5. Create `src/__tests__/ui-states.test.ts` — verify no page renders blank on empty data

**Critical traps:**
- Do NOT install `@shadcn/ui` toast alongside Sonner — they conflict
- Loading toast pattern: `toast.loading()` → `toast.success()` / `toast.error()` for PDF export

**Advance when:** `npx vitest run src/__tests__/ui-states` — all state tests pass

---

### Stage 20 — Monitoring (§17)

Sentry + health checks.

**Tasks:**
1. Create `src/lib/monitoring.ts` from spec §17.3
2. Init Sentry BEFORE React render in main.tsx from spec §17.1
3. Create `ErrorBoundary.tsx` with Sentry.captureException
4. Wire error categories from spec §17.2 (ValidationError → no Sentry, ComputeError → Sentry)

**Advance when:** `npx vitest run src/lib/monitoring` — error categorization tests pass

---

### Stage 21 — Deployment Config (§16.1–§16.4)

Docker + nginx + Fly.io config.

**Tasks:**
1. Create `apps/taxklaro/frontend/Dockerfile` from spec §16.1 (multi-stage: Rust WASM build → Node build → nginx)
2. Create `nginx.conf` from spec §16.2 (SPA fallback, cache headers, gzip)
3. Create `fly.toml` from spec §16.3 (Singapore region, health check)
4. Document required secrets from spec §16.4

**Advance when:** Dockerfile syntax valid, fly.toml valid TOML

---

### Stage 22 — CI/CD Workflows (§16.5, §16.6)

GitHub Actions for CI and deploy.

**Tasks:**
1. Create `.github/workflows/ci.yml` from spec §16.5 (typecheck → lint → test → build → e2e)
2. Create `.github/workflows/deploy.yml` from spec §16.6 (build Docker → fly deploy)
3. Include migration verification step: `supabase db reset` + RPC verification

**Advance when:** YAML lint passes on both workflow files

---

### Stage 23 — Unit Tests (full suite) (§15.1)

Comprehensive Vitest test coverage.

**Tasks:**
1. Audit test coverage for all src/lib/, src/hooks/, src/components/
2. Add missing tests to reach spec §15.1 requirements
3. Run full `npx vitest run --reporter=verbose`
4. Fix any failures

**Advance when:** Full test suite passes with zero failures

---

### Stage 24 — E2E Tests (§15.2)

Playwright end-to-end tests.

**Tasks:**
1. Create `playwright.config.ts` from spec §15.2
2. Create test data fixtures
3. Implement 13 test suites from spec §15.2 (T-AUTH-01 through T-ERROR-03)
4. Create orphan-scan test script

**Advance when:** `npx playwright test` passes (or tests are written and ready for CI)

---

### Stage 25 — Integration Sweep

Final cleanup — zero placeholders, zero stubs, production-ready.

**Tasks (each iteration picks ONE):**
1. **Scan for placeholders** — grep `src/` for: `coming in`, `coming soon`, `placeholder`, `TODO`, `stub`, any component rendering static text instead of real implementation
2. **Fix route pages** — replace all placeholder renders with real component imports
3. **Fix stub exports** — replace all stub functions with real implementations or remove
4. **Full test suite** — `npx vitest run --reporter=verbose` + fix failures
5. **Production build** — `npx vite build` succeeds, bundle reasonable size
6. **Cross-layer consistency** — verify spec §18 checklist (Rust ↔ JSON ↔ TypeScript ↔ Zod field names match)

**Advance/Converge when:** Zero grep hits for placeholder/stub in `src/` (excluding node_modules, test mocks, HTML placeholder attrs). All tests pass. Build succeeds.

When this stage is complete, write `status/converged.txt` with final summary.

---

## Rules

- Do ONE unit of work, then exit. Do not do multiple priorities in one iteration.
- Always read the spec before writing code. `apps/taxklaro/specs/taxklaro-spec.md` is the SOLE source of truth.
- Every type name, field name, and behavior comes from the spec — never invent.
- Use `rust_decimal::Decimal` for ALL monetary amounts in the engine — never f64.
- Serde conventions: camelCase structs, SCREAMING_SNAKE_CASE enums, deny_unknown_fields on inputs.
- TypeScript: `| null` not `?` for nullable fields. `string` for Decimal values.
- Zod: `.strict()` on inputs, `.nullable()` not `.optional()`, no `.coerce()` on booleans.
- Use TanStack Router for all navigation — no manual window.location.
- Use Supabase client for all DB operations — no direct SQL from frontend.
- All Supabase tables use RLS — never use service role key in frontend.
- Use React Hook Form + Zod for all forms.
- shadcn/ui for all UI primitives (Button, Dialog, Tabs, Badge, etc.).
- Tailwind CSS 4 for styling.
- Sonner for toasts — NOT shadcn toast.
- Lazy-load heavy packages: `@react-pdf/renderer`.
- All monetary amounts in Philippine Peso (₱) with comma formatting.
- All dates: Philippine locale display in UI, ISO in storage.
- Never modify a passing test to keep it passing.
- If a test contradicts the spec, fix the test AND note it in your commit message.
- Do NOT import from spec directories at runtime.

## Commit Convention

```
taxklaro: stage {N} - {description}
```

Examples:
- `taxklaro: stage 1 - scaffold rust engine crate`
- `taxklaro: stage 3 - write pipeline tests`
- `taxklaro: stage 10 - implement wizard steps WS-01 through WS-05`
- `taxklaro: stage 13 - fix RLS policies for org scoping`
- `taxklaro: stage 4 complete, advancing to stage 5`
