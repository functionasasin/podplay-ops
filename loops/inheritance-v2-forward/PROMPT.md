# Forward Ralph Loop — Philippine Inheritance Distribution Engine v2 (Integrated Full-Stack)

You are a development agent in a forward ralph loop. Each time you run, you do ONE unit of work: write tests, implement code, or fix failures for a single stage, then commit and exit.

This is an **integrated** forward loop. You build the Rust engine, WASM bridge, AND React frontend in a single loop, in phases. There are no mocks — from Phase 3 onward, every test calls the real WASM engine.

## Your Working Directories

- **Loop dir**: `loops/inheritance-v2-forward/` (frontier, status tracking)
- **Engine dir**: `loops/inheritance-v2-forward/engine/` (Rust crate — Cargo.toml, src/, tests/)
- **Frontend dir**: `loops/inheritance-v2-forward/frontend/` (Vite + React — package.json, src/, etc.)
- **Spec**: `docs/plans/inheritance-v2-spec.md` (your source of truth for ALL types, algorithms, wire format, UI, and design)

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/current-stage.md`
2. **Identify your work priority** (pick the FIRST that applies):

   **Priority 1 — SCAFFOLD** (if the phase's project skeleton doesn't exist):
   - Phase 1: Create `engine/Cargo.toml` with deps (`num-rational`, `num-bigint`, `num-traits`, `serde`, `serde_json`, `thiserror`, `wasm-bindgen`), `engine/src/lib.rs`, `engine/src/types.rs`, `engine/src/fraction.rs`
   - Phase 3: Create `frontend/` via Vite React-TS template, install deps (`react-hook-form`, `@hookform/resolvers`, `zod`, `recharts`, `lucide-react`, `vite-plugin-wasm`, `vite-plugin-top-level-await`), configure vitest
   - Write smoke tests to verify the skeleton compiles/builds
   - Commit: `forward: stage {N} - scaffold {description}`
   - Exit

   **Priority 2 — WRITE TESTS** (if current stage has < 5 test functions):
   - Read the relevant spec sections
   - Write comprehensive tests covering: happy path, edge cases, and test vectors from the spec
   - For engine stages: use `BigRational` fractions for assertions — never floating-point
   - For frontend stages: test against real WASM engine (not mocks)
   - Create stub implementations (`todo!()` in Rust, empty components in React) so tests compile
   - Commit: `forward: stage {N} - write tests`
   - Exit

   **Priority 3 — IMPLEMENT** (if tests exist but mostly stubs):
   - Read spec sections carefully — use exact algorithms, types, and rules
   - Implement to pass as many tests as possible in one iteration
   - Every parameter comes from the spec — never invent values
   - Commit: `forward: stage {N} - implement {description}`
   - Exit

   **Priority 4 — FIX FAILURES** (if tests exist and some are failing):
   - Read the test output in `frontier/current-stage.md`
   - Identify root cause of 1-3 related failures
   - Fix the implementation code (NOT the tests, unless a test contradicts the spec)
   - Commit: `forward: stage {N} - fix {description}`
   - Exit

   **Priority 5 — DONE** (if ALL tests for current stage pass):
   - Write `status/stage-{N}-complete.txt`
   - Exit

3. **Commit your work** before exiting. Always. Even partial progress.

## Phase + Stage Table

### Phase 1: Engine Core (Rust)
Build the computation engine in `engine/`. Tests run via `cargo test`.

| Stage | Name | Module | Spec Sections |
|-------|------|--------|---------------|
| 0 | Scaffold + Types + Fractions | `types.rs`, `fraction.rs` | §3 (Data Model), §12 (Rounding) |
| 1 | Classify Heirs | `step1_classify.rs` | §4 (Heir Classification) |
| 2 | Build Lines | `step2_lines.rs` | §5 (Representation) |
| 3 | Succession Type + Scenario | `step3_scenario.rs` | §2 (Pipeline), §4 (Concurrence) |
| 4 | Compute Estate Base | `step4_estate_base.rs` | §8 (Collation) |
| 5 | Compute Legitimes + Free Portion | `step5_legitimes.rs` | §6 (Legitime Computation) |
| 6 | Testate Validation | `step6_validation.rs` | §9 (Testate Validation) |
| 7 | Distribute Estate | `step7_distribute.rs` | §7 (Distribution) |
| 8 | Collation Adjustment | `step8_collation.rs` | §8 (Collation Adjustment) |
| 9 | Vacancy Resolution | `step9_vacancy.rs` | §10 (Vacancy Resolution) |
| 10 | Finalize + Narrate | `step10_finalize.rs` | §11 (Narratives), §12 (Rounding) |
| 11 | Integration Tests | `tests/integration.rs` | §18 (Test Vectors), §19 (Invariants) |
| 12 | Fuzz Invariants | `tests/fuzz_invariants.rs` | §19 (Invariants) — 100 random cases, 4 consecutive passes |

### Phase 2: WASM Bridge
Compile engine to WebAssembly. Tests run via `cargo check --target wasm32` + `wasm-pack build`.

| Stage | Name | Work | Spec Sections |
|-------|------|------|---------------|
| P2-1 | WASM Export | Add `src/wasm.rs` with `#[wasm_bindgen] pub fn compute_json(input: &str) -> Result<String, String>` | §13 (Bridge Contract) |
| P2-2 | WASM Build + Verify | Run `wasm-pack build --target web`, verify `.wasm` artifact, copy `pkg/` to `frontend/src/wasm/pkg/` | §13 (Bridge Contract) |

### Phase 3: Frontend Foundation
Scaffold React app and connect to real WASM. Tests run via `vitest` with real WASM loaded.

| Stage | Name | Work | Spec Sections |
|-------|------|------|---------------|
| P3-1 | Vite + React Scaffold | Create Vite project with React 19, TypeScript strict, vitest, `@tailwindcss/vite` plugin | — |
| P3-2 | Types + Schemas | TypeScript interfaces from §14, strict Zod schemas from §15 | §14, §15 |
| P3-3 | WASM Bridge | `bridge.ts`: import real WASM pkg, `compute()` function, dual init (Node sync + browser async), error handling | §13 |

**Critical**: Stage P3-3 connects to the REAL engine. From this point forward, every test calls real WASM. No mocks.

### Phase 4: Frontend Components
Build all UI. Tests run via `vitest` with real WASM.

| Stage | Name | Components | Spec Sections |
|-------|------|------------|---------------|
| P4-1 | Shared Form Components | MoneyInput, DateInput, FractionInput, PersonPicker, EnumSelect | §16.3 |
| P4-2 | Wizard Shell + Estate + Decedent | WizardContainer, EstateStep, DecedentStep | §16.1 |
| P4-3 | Family Tree Step | FamilyTreeStep, PersonCard, AdoptionSubForm, FiliationSection | §16.1 |
| P4-4 | Will Step | WillStep (4 tabs), InstitutionsTab, LegaciesTab, DevisesTab, DisinheritancesTab | §16.1 |
| P4-5 | Donations + Review | DonationsStep, DonationCard, ReviewStep | §16.1 |
| P4-6 | Results View | ResultsHeader, DistributionSection, NarrativePanel, WarningsPanel, ComputationLog, ActionsBar | §16.2 |
| P4-7 | Validation + Integration | End-to-end: wizard fill → form validation → WASM compute → results display | §20 (Cross-Layer) |

### Phase 5: UI Polish
Apply design system. Tests must continue passing + CSS bundle > 20KB.

| Stage | Name | Work | Spec Sections |
|-------|------|------|---------------|
| P5-1 | Design System Setup | Install shadcn/ui, configure palette from spec, add fonts, verify tests + build + CSS > 20KB | §17 |
| P5-2 | Component Restyle | Apply design system to all components (shared → wizard → results) | §17 |
| P5-3 | Responsive + Polish | Mobile breakpoints, spacing audit, typography audit, focus states, empty states | §17 |

## Stage Dependencies

```
Phase 1: 0 → 1 → 2 → 3
                       ↘
              0 → 4     → 5 → 6 → 7
                                    ↘
                          4 → 8     → 9 → 10
                               ↗         ↗
                              7 --------→
         0-10 → 11 → 12

Phase 2: 12 → P2-1 → P2-2

Phase 3: P2-2 → P3-1 → P3-2 → P3-3

Phase 4: P3-3 → P4-1 → P4-2 → P4-3 → P4-4 → P4-5 → P4-6 → P4-7

Phase 5: P4-7 → P5-1 → P5-2 → P5-3
```

## Phase Transitions

- **Phase 1 → Phase 2**: No transition needed (same Rust crate, wasm-bindgen already in Cargo.toml)
- **Phase 2 → Phase 3**: `wasm-pack build --target web --out-dir pkg` then copy `engine/pkg/` to `frontend/src/wasm/pkg/`
- **Phase 3 → Phase 4**: No transition needed
- **Phase 4 → Phase 5**: No transition needed

## Key Spec References

### Data Model (§3)
```
Fraction (BigRational)        Money { centavos: u64 }
EngineInput                   EngineOutput
Decedent                      Person
Relationship (11 variants)    FiliationProof (6 types)
Will                          InstitutionOfHeir / ShareSpec
Legacy / Devise               Disinheritance / DisinheritanceCause (22 values)
Donation                      InheritanceShare
HeirNarrative                 ComputationLog
ScenarioCode (T1-T15, I1-I15) SuccessionType
```

### Arithmetic (§12)
- ALL intermediate computations use exact `BigRational`
- Convert to centavos ONLY in Step 10
- Rounding: Hare-Niemeyer (largest remainder) — sum(all shares) == net_estate exactly

### Bridge Contract — Serde Rules (§13)
```
#[serde(deny_unknown_fields)]     — rejects unknown JSON keys
#[serde(rename_all = "PascalCase")]  — enum variants
Boolean: true/false only            — serde rejects "true" string
Money.centavos: number or string    — for BigInt support
Optional: null in JSON              — NOT absent, NOT undefined
Dates: ISO-8601 strings
Fractions: "numer/denom" string
```

**Zod schemas MUST use strict mode**:
```typescript
z.object({ ... }).strict()    // matches deny_unknown_fields
z.boolean()                   // NOT z.coerce.boolean()
z.number()                    // NOT z.coerce.number()
z.nullable()                  // NOT z.optional() — null not undefined
```

### Test Vectors (§18)
20+ test vectors covering all 30 scenarios. Integration stage (11) runs all end-to-end. Individual stages test the subset relevant to their step.

### Invariants (§19)
10 invariants checked on every test case:
1. Sum conservation (shares == net_estate)
2. Legitime floor (compulsory heirs >= legitime)
3. Art. 895 ratio (IC <= ½ LC in testate)
4. Cap rule (total IC legitimes <= FP after spouse)
5. Representation (sum of reps == ancestor share)
6. Adoption equality (adopted == legitimate)
7. Preterition (if detected → all institutions annulled)
8. Disinheritance (if valid → heir gets 0, descendants may represent)
9. Collation (estate_base == net_estate + collatable_donations)
10. Scenario consistency (code matches surviving heir combo)

### Stage 12 — Fuzz Invariants (Special)
100 randomized test cases, ALL 10 invariants checked on each. **Requires 4 consecutive passing iterations** for stability. Fix the engine, NOT the tests or fixtures.

## Rules

- Do ONE unit of work, then exit.
- Always read the spec before writing code. The spec is the source of truth.
- Every algorithm, type, field name comes from the spec — never invent values.
- Use `BigRational` for ALL intermediate arithmetic. Zero tolerance for floating-point.
- Never modify a passing test to keep it passing after a code change.
- **No mocks.** From P3-3 onward, all frontend tests hit the real WASM engine.
- **CSS bundle size check** in Phase 5: `npm run build` must produce CSS > 20KB.
- **BUG-001 is fixed in the spec.** Follow the spec's algorithm for multiple disinheritances.

## Commit Convention

```
forward: stage {N} - {description}
```

Examples:
- `forward: stage 0 - scaffold Rust crate with types and fraction lib`
- `forward: stage 5 - implement legitime computation with cap rule`
- `forward: stage P2-1 - add wasm-bindgen export`
- `forward: stage P3-3 - wire real WASM bridge`
- `forward: stage P4-3 - implement family tree step`
- `forward: stage P5-1 - install shadcn, configure palette, verify CSS`
