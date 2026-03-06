# Spec Review — Final Pass

**Aspect:** spec-review
**Wave:** 7 (final)
**Date:** 2026-03-06
**Verdict:** CONDITIONAL PASS — 1 gap found, fill-form-output-types aspect created

---

## Review Question

> Can a developer build the ENTIRE product — engine, WASM bridge, frontend, auth, database, deployment — from `docs/plans/freelance-tax-spec.md` alone, without asking a single clarifying question, and produce an app on par with the inheritance app in polish and completeness?

**Short answer:** Yes, with one exception: BIR form output TypeScript interfaces are referenced to `analysis/typescript-types.md` instead of inlined. See Section 4 below.

---

## Phase-by-Phase Review

### Phase 1: Engine (Rust WASM)

| Check | Result |
|-------|--------|
| All 17 pipeline steps have IDs (PL-01 to PL-17) | PASS |
| Tax rate tables fully specified (TRAIN First/Second schedules, percentage tax CREATE Act) | PASS |
| All 14 enums with exact variant names and serde serialization | PASS |
| TaxpayerInput (25 fields) with exact Rust types and serde attrs | PASS |
| ItemizedExpenseInput (23 fields) complete | PASS |
| Sub-input types complete (Form2307Entry, QuarterlyPayment, DepreciationEntry, NolcoEntry) | PASS |
| TaxComputationResult output type complete | PASS |
| Path result types (PathAResult, PathBResult, PathCResult) complete | PASS |
| Decimal precision rule (full precision through intermediates, round at output) | PASS |
| Cargo.toml with all required dependencies | PASS |
| WasmResult envelope (discriminated union, ok/error) | PASS |
| Error types (EngineError, ValidationWarning, IneligibilityNotification, ManualReviewFlag) | PASS |
| wasm.rs exports (compute_json + validate_json with exact signatures) | PASS |
| Build command (`wasm-pack build --target web --out-dir ...`) | PASS |

**Phase 1: PASS**

---

### Phase 2: WASM Bridge

| Check | Result |
|-------|--------|
| Browser vs Node.js init patterns documented (async init() vs initSync) | PASS |
| bridge.ts full implementation with singleton init pattern | PASS |
| Error handling in bridge (ValidationError vs ComputeError, Sentry integration) | PASS |
| Slow computation warning (>500ms) | PASS |
| vite.config.ts with required plugins (vite-plugin-wasm, vite-plugin-top-level-await) | PASS |
| vitest test-setup.ts with initSync pattern | PASS |
| Production build target: esnext | PASS |
| Plugin ordering documented (wasm before topLevelAwait) | PASS |
| validateInput() function in bridge | PASS |

**Phase 2: PASS**

---

### Phase 3: Frontend Foundation

| Check | Result |
|-------|--------|
| common.ts — all 14 enum types as TS string literal unions with SCREAMING_SNAKE_CASE | PASS |
| common.ts — primitive aliases (Peso, Rate, TaxYear, ISODate, Quarter) | PASS |
| engine-input.ts — TaxpayerInput with all 25 fields, exact camelCase names | PASS |
| engine-output.ts — TaxComputationResult with all fields | PASS |
| engine-output.ts — PathA/B/C results, GrossAggregates, DeductionBreakdown | PASS |
| engine-output.ts — FormOutputUnion discriminated union with type guards | PASS |
| **BIR form output types** (Form1701AOutput, Form1701Output, Form1701QOutput, Form2551QOutput) | **FAIL** |
| Zod schemas — all 6 files specified | PASS |
| Zod schemas — .strict() on input, .nullable() not .optional(), z.boolean() no coerce | PASS |
| WizardFormData type with computeActiveSteps logic | PASS |

**Phase 3: CONDITIONAL PASS — 1 gap (BIR form output types not inlined)**

#### Gap Detail: BIR Form Output Types Not Inlined

At `docs/plans/freelance-tax-spec.md` lines 1496-1503:

```typescript
// ============================================================================
// BIR Form Output Types (abbreviated — full field list in BIR form mapping docs)
// The complete field list for Form1701AOutput, Form1701Output, Form1701QOutput,
// Form2551QOutput is specified in analysis/typescript-types.md Section 3.
// ============================================================================

// (Form output interfaces are large — ~100+ fields each. Forward loop should
//  implement them from analysis/typescript-types.md which has the full specification.)
```

**Problem:** The spec states the forward loop reads ONLY `docs/plans/freelance-tax-spec.md`. This comment directs it to `analysis/typescript-types.md`, which violates the self-containment requirement.

**Impact:** These types are needed for:
- `FormView` component (renders BIR form field values)
- `PdfExport` sections (maps form output fields to PDF layout)
- Type safety in `ResultsView` when accessing `formOutput.fields`
- Zod output schema validation of `formOutput`

**Types missing from spec:**
- `Form1701AOutput` — 55 fields (header, Parts I-V, tax credits)
- `Form1701Output` — 80+ fields (header, Parts I-VII, 6 schedules)
- `Form1701QOutput` — 45 fields (header, Schedules I-IV)
- `Form2551QOutput` — 20 fields + `PT2551QScheduleRow`
- `NolcoScheduleRow` — 7 fields (for Form1701Output Schedule 6)

**Fix:** Create `fill-form-output-types` aspect (Wave 7.5c) to inline all 5 interfaces directly into spec Section 5.3.

---

### Phase 4: Components (Wizard + Results + Wiring)

| Check | Result |
|-------|--------|
| All 17 wizard steps fully specified (WS-00 to WS-15) with field labels, types, defaults, validation, errors | PASS |
| Step routing matrix (which steps appear for which taxpayer types) | PASS |
| Step GV-01–GV-20 global validation rules | PASS |
| Step DA-01–DA-14 dynamic actions documented | PASS |
| ResultsView sections specified (3-regime comparison, balance, credits, PT, penalties, MRF) | PASS |
| All 90 components wiring-mapped to parent routes | PASS |
| Action trigger map — 23 features with button text, onClick handler, parent | PASS |
| PDF export trigger: "Export PDF" button in ResultsActionsBar | PASS |
| Share toggle trigger: ShareToggle component in ComputationDetailPage | PASS |
| Visual verification checklist — shadcn wrapper, Tailwind classes, lucide icons | PASS |
| Empty states for all 11 async pages | PASS |
| Toast catalog — 41 toasts across 8 categories | PASS |
| PDF export layout — all sections, @react-pdf/renderer lazy-load | PASS |

**Phase 4: PASS**

---

### Phase 5: Platform

| Check | Result |
|-------|--------|
| Auth routes — all 5 (auth, callback, reset, reset-confirm, onboarding) | PASS |
| PKCE callback handler documented | PASS |
| main.tsx bootstrap — getSession + onAuthStateChange race condition handling | PASS |
| supabaseConfigured guard + SetupPage pattern | PASS |
| All 4 VITE_* env vars documented with .env.local.example | PASS |
| 18 routes with full beforeLoad guards | PASS |
| Migration 001 — 8 tables, 5 enums, 2 triggers | PASS |
| Migration 002 — user_org_ids() helper + 32 RLS policies | PASS |
| Migration 003 — 6 RPCs with explicit GRANTs (anon for public RPCs) | PASS |
| Migration 004 — Supabase Storage bucket for firm-logos | PASS |
| share_token is UUID (not TEXT) — explicitly called out in migration | PASS |
| get_shared_computation p_token is UUID (not TEXT) | PASS |
| AppLayout with sidebar (desktop) + Drawer (mobile) | PASS |
| Org model: useOrganization hook, roles, invitations, seat limits | PASS |
| Computation CRUD: createComputation, loadComputation, updateComputationInput | PASS |
| Auto-save: 1.5s debounce, SaveStatusIndicator | PASS |
| 12 Supabase-specific gotchas documented | PASS |

**Phase 5: PASS**

---

### Phase 6: Polish (Design + Empty States + Toasts + PDF)

| Check | Result |
|-------|--------|
| Brand palette: Primary #1D4ED8, success #16A34A, warning #D97706, error #DC2626 | PASS |
| CSS custom properties mapped to shadcn/ui theming | PASS |
| shadcn/ui component mapping for all 13 custom components | PASS |
| Empty states for all async pages (icon, title, description, CTA) | PASS |
| Skeleton loaders specified | PASS |
| 41 toasts with exact message text, variant, trigger | PASS |
| Sonner setup with richColors | PASS |
| PDF sections: firm header, computation summary, 3-regime table, breakdown, CWT, quarterly, MRF flags, penalties, disclaimer | PASS |
| PDF @react-pdf/renderer lazy-loaded | PASS |
| Sentry init before React | PASS |
| Error categories: ValidationError (no Sentry), ComputeError (Sentry), WasmInitError (fatal) | PASS |

**Phase 6: PASS**

---

### Phase 7: Verification

| Check | Result |
|-------|--------|
| Production build smoke test specified (npm run build → npx serve dist → curl + Playwright) | PASS |
| Vite plugin risks documented (vite-plugin-top-level-await, WASM, Tailwind) | PASS |
| Orphan scan script included in E2E spec | PASS |
| Migration verification plan (supabase db reset, RPC test calls with expected results) | PASS |
| RPC parameter type match table (p_token UUID not TEXT) | PASS |
| CI/CD pipeline YAML (typecheck → lint → test → build → e2e → deploy) | PASS |
| Dockerfile — multi-stage WASM build + nginx:alpine | PASS |
| fly.toml — all required fields (region, memory, auto_stop) | PASS |
| First deploy checklist | PASS |
| 13 E2E test suites with exact steps, assertions, data-testid | PASS |

**Phase 7: PASS**

---

## Overall Verdict

**CONDITIONAL PASS — 1 gap must be resolved before full sign-off.**

The spec is production-ready at the 41-aspect level. The gap is:

| Gap | Severity | Fix |
|-----|----------|-----|
| BIR form output types (Form1701AOutput, Form1701Output, Form1701QOutput, Form2551QOutput) not inlined in spec | MEDIUM | Inline from analysis/typescript-types.md Section 3 into spec Section 5.3 |

After this fix, the forward loop can build the entire product from the spec alone.

---

## What Would Not Require a Judgment Call (After the Fix)

1. **Engine**: Every computation step has a formula. Tax rate tables are complete. Serde conventions are explicit.
2. **Bridge**: bridge.ts implementation is copy-paste ready. Init patterns cover browser and Node.js.
3. **TypeScript types**: All input/output types will be complete and cross-referenced with serde.
4. **Zod schemas**: Rules are explicit (strict mode, no coerce, null not undefined).
5. **Wizard**: All 17 steps with field labels, types, defaults, validation messages, and conditional logic.
6. **Platform**: Auth routes, migration SQL, RLS policies, RPC functions — all copy-paste ready.
7. **Components**: Every component has a parent, navigation path, and trigger (zero orphans possible).
8. **Design**: Color palette, component mapping, Tailwind classes, icons — all specified.
9. **Testing**: E2E scenarios with exact Playwright steps, data-testid attributes, and fixtures.
10. **Deployment**: Dockerfile and fly.toml are complete and copy-paste ready.

---

## New Aspect Created

**Wave 7.5c: BIR Form Output Type Inline**
- `fill-form-output-types` — Inline Form1701AOutput, Form1701Output, Form1701QOutput, Form2551QOutput, NolcoScheduleRow, PT2551QScheduleRow from `analysis/typescript-types.md` into spec Section 5.3. Replace the "Forward loop should implement them from analysis/typescript-types.md" comment with actual interface definitions.

After fill-form-output-types completes, re-run spec-review one more time (or mark it PASS and close the loop).
