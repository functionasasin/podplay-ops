# Forward Ralph Loop — Inheritance Distribution Engine (Rust)

You are a development agent in a forward ralph loop. Each time you run, you do ONE unit of work: write tests, implement code, or fix failures for a single pipeline stage, then commit and exit.

## Your Working Directories

- **Loop + Engine dir**: `loops/inheritance-rust-forward/` (both loop frontier AND Rust crate)
- **Spec**: `docs/plans/inheritance-engine-spec.md` (your source of truth for ALL types, algorithms, and parameters)

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/current-stage.md`
2. **Identify your work priority** (pick the FIRST that applies):

   **Priority 1 — SCAFFOLD** (if `Cargo.toml` doesn't exist):
   - Create the Rust project skeleton:
     - `Cargo.toml` with dependencies: `num-rational`, `num-bigint`, `num-traits`, `serde`, `serde_json`, `thiserror`
     - `src/lib.rs` — crate root, module declarations
     - `src/main.rs` — CLI entry point (placeholder)
     - `src/types.rs` — ALL data model types from Spec §3 (Fraction, Money, EngineInput, Decedent, Person, Heir, Will, Donation, EngineOutput, etc.)
     - `src/fraction.rs` — Exact rational arithmetic wrapper around `num_rational::BigRational` with helpers: `frac(n, d)`, `money_to_frac()`, `frac_to_centavos()`, GCD reduction
   - Write tests for fraction operations (add, sub, mul, div, comparison, GCD reduction, centavo conversion)
   - Ensure `cargo build` and `cargo test` pass
   - Commit: `forward: stage 0 - scaffold project, types, and fraction lib`
   - Exit

   **Priority 2 — WRITE TESTS** (if `src/step{N}_{name}.rs` doesn't exist or its `#[cfg(test)] mod tests` has < 5 test functions):
   - Read the spec sections listed in the stage table below
   - Write comprehensive tests covering: happy path, edge cases, and any test vectors from Spec §14 that exercise this step
   - Use `BigRational` fractions for all assertions — never floating-point
   - Tests must compile and run (they will fail since implementation doesn't exist yet — that's expected)
   - Create stub functions that return `todo!()` or `unimplemented!()` so tests compile
   - Commit: `forward: stage {N} - write tests`
   - Exit

   **Priority 3 — IMPLEMENT** (if tests exist but the step module is mostly stubs/`todo!()`):
   - Read the spec sections carefully — use exact algorithms, fractions, and rules
   - Implement the step's public functions
   - Focus on making as many tests pass as possible in one iteration
   - Every parameter and threshold comes from the spec — never invent values
   - Commit: `forward: stage {N} - implement {description}`
   - Exit

   **Priority 4 — FIX FAILURES** (if tests exist and some are failing):
   - Read the test output in `frontier/current-stage.md`
   - Identify the root cause of 1-3 related failures
   - Fix the implementation code (NOT the tests, unless a test contradicts the spec)
   - Commit: `forward: stage {N} - fix {description}`
   - Exit

   **Priority 5 — DONE** (if ALL tests in `cargo test step{N}` pass):
   - This shouldn't happen (the loop detects convergence externally)
   - But if you see it: write `status/stage-{N}-complete.txt`
   - Exit

3. **Commit your work** before exiting. Always. Even partial progress.

## Stage Table

| Stage | Name | Module | Spec Sections | Pipeline Step |
|-------|------|--------|---------------|---------------|
| 0 | Scaffold + Types + Fractions | `types.rs`, `fraction.rs` | §3, §15 | — |
| 1 | Classify Heirs | `step1_classify.rs` | §4 (Heir Classification) | Step 1 |
| 2 | Build Lines | `step2_lines.rs` | §5 (Representation) | Step 2 |
| 3 | Determine Succession Type + Scenario | `step3_scenario.rs` | §3.7, §2.4 | Step 3 |
| 4 | Compute Estate Base (Collation Add) | `step4_estate_base.rs` | §8.1-8.3 (which donations are collatable) | Step 4 |
| 5 | Compute Legitimes + Free Portion | `step5_legitimes.rs` | §6, §2.3 (FP pipeline) | Step 5 |
| 6 | Testate Validation | `step6_validation.rs` | §9 (preterition, disinheritance, underprovision, inofficiousness) | Step 6 |
| 7 | Distribute Estate | `step7_distribute.rs` | §7 (intestate), §7.5 (mixed), testate distribution | Step 7 |
| 8 | Collation Adjustment | `step8_collation.rs` | §8.4-8.7 (impute donations against shares) | Step 8 |
| 9 | Vacancy Resolution | `step9_vacancy.rs` | §10 (substitution, representation, accretion, intestate fallback) | Step 9 |
| 10 | Finalize + Narrate | `step10_finalize.rs` | §11 (narrative templates), §12 (rounding) | Step 10 |
| 11 | Integration (End-to-End) | `tests/integration.rs` | §14 (23 test vectors), §14.2 (10 invariants) | All |
| 12 | Fuzz Invariants (100 random) | `tests/fuzz_invariants.rs` | §14.2 (all 10 invariants on 100 randomized cases) | All |

### Stage 12 — Fuzz Invariants (Special)

Stage 12 runs 100 pre-generated randomized test cases (`examples/fuzz-cases/*.json`) through the full pipeline and checks all 10 invariants plus safety checks on each output. Unlike other stages, **stage 12 requires 4 consecutive passing iterations** to confirm stability (no regressions from fixes).

**Test file:** `tests/fuzz_invariants.rs` — loads all JSON fixtures, runs `run_pipeline()`, checks invariants.
**Fixtures:** `examples/fuzz-cases/` — 100 JSON files generated by `examples/generate-fuzz-cases.py`.

**What to do each iteration:**
1. Read `frontier/current-stage.md` for the current fuzz test output
2. Identify which cases fail and which invariants they violate
3. Focus on fixing the **root cause** in the engine code (steps 1-10), not the test or the fixtures
4. Common failure patterns:
   - **INV1 + INV8 together** (sum > estate + disinherited heir has nonzero share): Disinheritance double-counting bug in `step7_distribute.rs`. Disinherited heirs' shares are being added to the distribution instead of being excluded.
   - **INV1 alone** (sum != estate): Distribution logic in `step7_distribute.rs` or rounding in `step10_finalize.rs`
   - **INV3** (IC > LC ratio): Cap rule or IC share computation in `step5_legitimes.rs` or `step7_distribute.rs`
5. Fix 1-3 related failures per iteration. Do NOT try to fix everything at once.
6. After fixing, run `cargo test --test fuzz_invariants` to verify progress.
7. Also run `cargo test --test integration` to make sure the existing 30 tests still pass (no regressions).
8. Commit: `forward: stage 12 - fix {description}`

**Important:** Do NOT modify the test fixtures or the fuzz test file. Fix the engine.

## Key Spec References

### Data Model (§3) — Types You Must Define

```
Fraction (BigRational wrapper)     Money (centavos: BigInt)
EngineInput                        EngineOutput
Decedent                           Person
Heir                               HeirCategory / EffectiveCategory
Will                               InstitutionOfHeir / Legacy / Devise
Donation                           Disinheritance
InheritanceShare                   HeirNarrative
ScenarioCode (T1-T15, I1-I15)     SuccessionType
```

### Fraction Arithmetic (§15.2)

- ALL intermediate computations use exact `BigRational`
- Convert to `Money` (centavos) ONLY in Step 10
- Rounding: banker's rounding, remainder distributed to largest-share heir (§12)

### Test Vectors (§14)

23 test vectors cover 17 scenarios. The integration stage (11) must run all of them end-to-end. Individual stages should test the subset of vectors relevant to their step.

Key vectors per stage:
- Stage 1: TV-17 (filiation gate), TV-09 (adopted = legitimate)
- Stage 2: TV-10 (representation per stirpes), TV-08 (disinheritance + representation)
- Stage 3: TV-06/TV-07 (testate vs preterition), TV-14 (mixed detection)
- Stage 4: TV-11 (collation), TV-22 (representation collation)
- Stage 5: TV-13 (cap rule), TV-16 (articulo mortis)
- Stage 6: TV-07 (preterition annuls), TV-08 (valid disinheritance), TV-12 (inofficious legacy)
- Stage 7: TV-02/TV-03 (intestate formulas), TV-14 (mixed 3-phase)
- Stage 8: TV-22 (donation imputation)
- Stage 9: TV-19 (total renunciation restart)
- Stage 10: All vectors (narrative + rounding verification)
- Stage 11: ALL 23 vectors end-to-end + 10 invariants

### Invariants (§14.2)

Every test case must satisfy:
1. **Sum**: total distributed from estate = net_distributable_estate
2. **Legitime floor**: compulsory heirs receive >= legitime (except valid disinheritance)
3. **Art. 895 ratio**: IC_share <= 1/2 * LC_share (testate only)
4. **Cap**: total IC legitimes <= FP_remaining_after_spouse (testate only)
5. **Representation**: sum of representatives = line ancestor's share
6. **Adoption**: adopted_child.share == legitimate_child.share
7. **Preterition**: if detected -> ALL institutions annulled
8. **Disinheritance**: if valid -> heir gets 0 but descendants may represent
9. **Collation**: estate_base = net_estate + collatable_donations; from_estate_sum = net_estate
10. **Scenario consistency**: scenario code matches surviving heir combination

## Rules

- Do ONE unit of work, then exit. Do not do multiple priorities in one iteration.
- Always read the spec before writing code. The spec is the source of truth.
- Every algorithm, fraction, threshold, and rule comes from the spec — never invent values.
- Use `BigRational` for ALL intermediate arithmetic. Zero tolerance for floating-point in computation paths.
- Never modify a passing test to keep it passing after a code change.
- If a test contradicts the spec, fix the test AND note it in your commit message.
- Keep modules focused: one pipeline step per file.
- Public API for each step: `pub fn step{N}_{name}(input: &StepNInput) -> StepNOutput`
- Re-export all step functions from `lib.rs` for integration use.

## Commit Convention

```
forward: stage {N} - {description}
```

Examples:
- `forward: stage 0 - scaffold project, types, and fraction lib`
- `forward: stage 1 - write heir classification tests`
- `forward: stage 1 - implement classify_heirs`
- `forward: stage 5 - fix cap rule spouse priority`
- `forward: stage 11 - integration test vectors TV-01 through TV-10`
