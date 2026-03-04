# Pipeline Design — 10-Step Computation Engine

**Aspect**: pipeline-design
**Wave**: 3 (Engine Design)
**Depends On**: all Wave 2 aspects (heir-classification, heir-concurrence, representation,
legitime-fractions, intestate-distribution, testate-validation, collation, vacancy-resolution,
multiple-disinheritance-fix), rust-types

---

## Overview

The v2 engine is a **deterministic, restartable pipeline** of 10 steps. Given the same input,
it always produces the same output. No randomness, no LLM inference. The pipeline may restart
one or more steps when heir eligibility changes mid-computation (disinheritance, preterition
annulment, or legitime vacancy). A restart counter guards against infinite loops.

---

## Architecture: PipelineState

The entire computation shares one mutable state value:

```rust
pub struct PipelineState {
    // ── Immutable after step 1 ─────────────────────────────────────
    pub input: ComputationInput,

    // ── Step 2 output (immutable after step 2) ─────────────────────
    /// Base classification, built from HeirInput only.
    /// Never mutated after step 2. Step 3 always reads from this.
    pub classified_heirs_base: Vec<ClassifiedHeir>,

    // ── Steps 3–10 working state (cleared on restart) ───────────────
    /// Working heir list: classified_heirs_base + representation additions
    /// + eligibility mutations from step 7 (disinheritance / preterition).
    /// On restart to step 3: strip representation additions, keep exclusions.
    pub classified_heirs: Vec<ClassifiedHeir>,

    pub scenario_code: Option<ScenarioCode>,           // step 4
    pub collation_result: Option<CollationResult>,     // step 5
    pub legitime_result: Option<LegitimeResult>,       // step 6
    pub testate_validation: Option<TestateValidationResult>, // step 7
    pub free_portion: Option<FreePortionAllocation>,   // step 8
    pub distributions: Option<Vec<HeirDistribution>>,  // step 9
    pub vacancy_resolution: Option<VacancyResolution>, // step 10

    // ── Restart control ─────────────────────────────────────────────
    pub restart_count: u8,
    pub last_restart_trigger: Option<RestartTrigger>,

    // ── Output accumulation (append-only) ───────────────────────────
    pub warnings: Vec<ValidationWarning>,
    pub manual_review_flags: Vec<ManualReviewFlag>,
    pub computation_log: Vec<ComputationLogEntry>,
}

pub const MAX_RESTARTS: u8 = 10;
```

### Restart Triggers

```rust
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "PascalCase")]
pub enum RestartTrigger {
    /// Step 7: one or more valid disinheritances applied
    ValidDisinheritance { heir_ids: Vec<HeirId> },
    /// Step 7: preterition caused institution annulment
    PreteritionAnnulment { preterited_heir_ids: Vec<HeirId> },
    /// Step 10: Art. 1021 ¶2 — vacant legitime triggers scenario recompute
    LegitimeVacancy { vacant_heir_id: HeirId },
}
```

### StepResult

```rust
pub enum StepResult {
    Continue,
    Restart { from_step: u8, trigger: RestartTrigger },
    Error(ComputationError),
}
```

---

## Clear-on-Restart Rules

When `StepResult::Restart { from_step }` is returned, the pipeline calls
`state.clear_from_step(from_step)` before jumping:

| `from_step` | What is cleared | What is kept |
|-------------|-----------------|--------------|
| **3** | All representation additions from `classified_heirs`; `scenario_code`; `collation_result`; `legitime_result`; `testate_validation`; `free_portion`; `distributions`; `vacancy_resolution` | `classified_heirs_base`; disinheritance/preterition exclusions already applied to `classified_heirs` |
| **4** | `scenario_code`; `collation_result`; `legitime_result`; `testate_validation`; `free_portion`; `distributions`; `vacancy_resolution` | Everything from steps 1–3 (full classified heirs with reps) |

**Clearing representation additions (restart to step 3)**:
```rust
fn clear_representation_additions(classified_heirs: &mut Vec<ClassifiedHeir>) {
    // Retain only heirs that were NOT added as representatives
    // (representatives have representation_trigger.is_some())
    // and ALSO retain heirs from classified_heirs_base regardless of trigger
    classified_heirs.retain(|h| h.representation_trigger.is_none());
    // Heirs with exclusion_reason set by disinheritance/preterition are retained
    // (their is_eligible = false is preserved for the re-run of step 3+)
}
```

---

## Pipeline Orchestrator

```rust
pub fn run_pipeline(input: ComputationInput) -> Result<ComputationOutput, ComputationError> {
    let mut state = PipelineState::new(input);
    let mut step: u8 = 1;

    loop {
        let result = dispatch_step(step, &mut state);
        match result {
            StepResult::Continue => {
                if step == 10 {
                    return Ok(state.into_output());
                }
                step += 1;
            }
            StepResult::Restart { from_step, trigger } => {
                state.restart_count += 1;
                if state.restart_count > MAX_RESTARTS {
                    return Err(ComputationError::MaxRestartsExceeded {
                        restart_count: state.restart_count,
                        last_trigger: trigger,
                    });
                }
                state.last_restart_trigger = Some(trigger.clone());
                state.log(format!("Restart #{}: {:?} → back to step {}",
                    state.restart_count, trigger, from_step));
                state.clear_from_step(from_step);
                step = from_step;
            }
            StepResult::Error(e) => return Err(e),
        }
    }
}
```

---

## Pipeline Flow Diagram

```
ComputationInput (raw JSON)
       │
  ┌────▼────┐
  │ Step 1  │  ValidateInput
  │         │  → ComputationInput (validated)
  └────┬────┘
       │
  ┌────▼────┐
  │ Step 2  │  ClassifyHeirs
  │         │  → Vec<ClassifiedHeir> (base, immutable)
  └────┬────┘
       │
  ┌────▼────┐ ◄─────────────────────────────────────────── Restart from step 3
  │ Step 3  │  BuildRepresentation                          (disinheritance / preterition)
  │         │  → Vec<ClassifiedHeir> (+ reps added)
  └────┬────┘
       │
  ┌────▼────┐ ◄─────────────────────────────────────────── Restart from step 4
  │ Step 4  │  DetermineScenario                            (Art. 1021 ¶2 vacancy)
  │         │  → ScenarioCode
  └────┬────┘
       │
  ┌────▼────┐
  │ Step 5  │  ComputeCollation
  │         │  → CollationResult (E_adj)
  └────┬────┘
       │
  ┌────▼────┐
  │ Step 6  │  ComputeLegitimes
  │         │  → LegitimeResult
  └────┬────┘
       │
  ┌────▼────┐
  │ Step 7  │  ValidateTestate (BUG-001 fix: batch disinheritance)
  │         │  → TestateValidationResult  OR  Restart { from_step: 3 }
  └────┬────┘
       │
  ┌────▼────┐
  │ Step 8  │  AllocateFreePortion
  │         │  → FreePortionAllocation
  └────┬────┘
       │
  ┌────▼────┐
  │ Step 9  │  Distribute
  │         │  → Vec<HeirDistribution> (BigRational amounts)
  └────┬────┘
       │
  ┌────▼────┐
  │ Step 10 │  ResolveVacancies + Round
  │         │  → VacancyResolution  OR  Restart { from_step: 4 }
  └────┬────┘    (Art. 1021 ¶2: legitimate vacancy → scenario recompute)
       │
       ▼
  ComputationOutput  (i64 centavos, narratives, log, warnings)
```

---

## Step Specifications

### Step 1: ValidateInput

**Function**: `step1_validate_input(state: &mut PipelineState) -> StepResult`

**Input**: `state.input` (the raw deserialized `ComputationInput`)

**Output**: validated fields in `state.input`, or `StepResult::Error`

**Actions**:
1. Check `net_estate.centavos >= 0`
2. Check `decedent.date_of_death` is a valid ISO-8601 date not in the future
3. Check all `heir.id` values are unique within `input.heirs`
4. Check `heir.date_of_birth` (if present) is before `decedent.date_of_death`
5. Check `heir.date_of_death` (if present) is before `decedent.date_of_death` (predecease)
6. Check all `donation.heir_id` references exist in `input.heirs`
7. Check all `will.institution[*].heir_id` references exist in `input.heirs`
8. Check will fraction institutions: sum of fractions ≤ 1 (Art. 907)
9. Check `will.disinheritances[*].heir_id` exists in `input.heirs`
10. Check `donation.centavos >= 0`

**Errors on**: `ComputationError::ValidationError { field, message }`

**Restart possible**: NO (step 1 runs once; errors are fatal)

---

### Step 2: ClassifyHeirs

**Function**: `step2_classify_heirs(state: &mut PipelineState) -> StepResult`

**Input**: `state.input.heirs`, `state.input.decedent`

**Output**: `state.classified_heirs_base` and `state.classified_heirs` (same initial value)

**Actions per heir**:
1. Map `HeirInput.heir_type` → `heir_group` (G1/G2/G3/G4):
   - LegitimateChild, LegitimatedChild, AdoptedChild → G1
   - LegitimateParent, LegitimateGrandparent, LegitimateAscendant → G2
   - Spouse → G3
   - IllegitimateChild → G4
2. Apply eligibility gates (7 gates, all must pass):
   - **Gate 1** (predecease): `heir.date_of_death` is None OR after `decedent.date_of_death`
   - **Gate 2** (filiation proof): if `heir_type = LegitimateChild`, `heir.filiation_proof` must be
     `BirthCertificate | MarriageCertificate | FinalJudgment | RecognitionRecord` (FC Art. 172)
   - **Gate 3** (adopted validity): if `heir_type = AdoptedChild`, `heir.adoption_decree_final = true`
   - **Gate 4** (legitimated validity): if `heir_type = LegitimatedChild`,
     `heir.legitimation_basis` must be valid (subsequent marriage, RA 9858, or RA 11222)
   - **Gate 5** (unworthiness): `heir.is_unworthy = false`
   - **Gate 6** (Iron Curtain): `heir_type = IllegitimateChild` cannot inherit from decedent if
     decedent is legitimate AND the IC's legitimate parent is alive (Art. 992)
   - **Gate 7** (ascendant existence): G2 heirs checked against proximity rule —
     nearer ascendant excludes farther (parents exclude grandparents)
3. Set `is_eligible` = all 7 gates pass
4. Set `is_compulsory` = `is_eligible && heir_group in [G1, G2, G3, G4]`
5. Set `exclusion_reason = None` (not yet disinherited)
6. Set `representation_trigger = None` (not yet a representative)
7. Copy result to both `classified_heirs_base` and `classified_heirs`

**Restart possible**: NO

---

### Step 3: BuildRepresentation

**Function**: `step3_build_representation(state: &mut PipelineState) -> StepResult`

**Input**: `state.classified_heirs` (which has disinheritance exclusions from step 7 on restarts)

**Output**: `state.classified_heirs` with representative heirs appended

**Key rule**: Only predecease and unworthiness/incapacity trigger representation at this step.
Disinheritance representation is handled by step 7's `apply_all_disinheritances()`.
However, on a restart-from-3, representatives for disinherited heirs have ALREADY been added
by step 7 before the restart; step 3 must NOT re-add them.

**Actions**:
1. Clear any heirs in `classified_heirs` that were added as representatives
   (i.e., heirs with `representation_trigger.is_some()` AND not in `classified_heirs_base`)
2. For each heir in `classified_heirs` where `is_eligible = false` due to:
   - Predecease (`date_of_death < decedent.date_of_death`)
   - Unworthiness (`is_unworthy = true`)
   (NOT disinheritance — step 7 handles that)
3. Apply representation rules (Arts. 970–977):
   - Find children of the ineligible heir from `HeirInput.children` / `FamilyTree`
   - Recursively: if a child is also ineligible (predecease/unworthiness), find their children
   - Stop at renouncing heirs (Art. 977: renunciation blocks representation)
   - Limit collateral representation to nephews/nieces only (Art. 972)
   - Set `representation_trigger = Some(Predecease | Unworthiness)`
   - Set `represents_heir_id` to the excluded heir's ID
4. Append representative heirs (do NOT add if already in `classified_heirs`)

**Art. 975 per stirpes vs per capita switch**:
- Within a branch (representing a single predeceased heir): per stirpes — divide equally
- Between unrelated nephews/nieces representing different siblings: per capita (each gets full
  nephew's portion)

**Restart possible**: NO (this step is triggered by restart; it does not itself restart)

---

### Step 4: DetermineScenario

**Function**: `step4_determine_scenario(state: &mut PipelineState) -> StepResult`

**Input**: `state.classified_heirs` (post-representation), `state.input.will.is_some()`

**Output**: `state.scenario_code: ScenarioCode`

**Algorithm**:
```rust
fn determine_scenario_code(
    heirs: &[ClassifiedHeir],
    has_will: bool,
) -> ScenarioCode {
    let prefix = if has_will { "T" } else { "I" };

    let g1_eligible = heirs.iter()
        .filter(|h| h.heir_group == G1 && h.is_eligible)
        .count();
    let g1_effective_slots = count_effective_g1_slots(heirs);  // see INV-MD-6
    let g2_eligible = heirs.iter()
        .filter(|h| h.heir_group == G2 && h.is_eligible)
        .count();
    let g3_eligible = heirs.iter()
        .filter(|h| h.heir_group == G3 && h.is_eligible)
        .count();
    let g4_eligible = heirs.iter()
        .filter(|h| h.heir_group == G4 && h.is_eligible)
        .count();
    // illegitimate children of the decedent
    let has_ic = g4_eligible > 0;
    let has_g1 = g1_effective_slots > 0;  // includes representatives
    let has_g2 = g2_eligible > 0;
    let has_spouse = g3_eligible > 0;
    let decedent_is_legitimate = ...;  // from DecedentInput

    // Apply 30-scenario determination (from heir-concurrence.md)
    // Testate scenarios T1–T15; Intestate scenarios I1–I15
    match (has_will, has_g1, has_g2, has_spouse, has_ic, decedent_is_legitimate) {
        (true, true, _, true, false, _)  => T3(n = g1_effective_slots),
        (true, true, _, false, false, _) => T1(n = g1_effective_slots),
        // ... (full table from heir-concurrence.md)
    }
}
```

Full ScenarioCode lookup table: see `analysis/heir-concurrence.md` §4.

**Restart possible**: NO

---

### Step 5: ComputeCollation

**Function**: `step5_compute_collation(state: &mut PipelineState) -> StepResult`

**Input**: `state.input.donations`, `state.classified_heirs`, `state.input.estate.net_estate`

**Output**: `state.collation_result: CollationResult`

```rust
pub struct CollationResult {
    /// Collation-adjusted estate = net_estate + sum of collatable donation values
    pub e_adj: Money,
    /// Donations sorted by collatable/non-collatable/exempt
    pub donations: Vec<DonationClassification>,
    /// Sum of collatable amounts added to E_adj
    pub collatable_sum: Money,
    /// Warnings for express exemptions, spousal split donations, etc.
    pub warnings: Vec<ValidationWarning>,
}
```

**Phase 1 of 2 (this step)**:
1. For each donation, apply 14-category collatability matrix (from `analysis/collation.md`)
2. For collatable donations: use **donation-time valuation** (Art. 1071), NOT current value
3. For joint donations to child + spouse: child collates only ½ (Art. 1066)
4. Sum all collatable values
5. `E_adj = net_estate + collatable_sum`
6. Do NOT yet apply imputation (deduction from heir's share — that is step 9)

**Phase 2 (step 9)**: Imputation is applied during distribution.

**Restart possible**: NO

---

### Step 6: ComputeLegitimes

**Function**: `step6_compute_legitimes(state: &mut PipelineState) -> StepResult`

**Input**: `state.scenario_code`, `state.collation_result.e_adj`, `state.classified_heirs`,
`state.input.decedent`

**Output**: `state.legitime_result: LegitimeResult`

```rust
pub struct LegitimeResult {
    pub per_heir: Vec<LegitimeEntry>,
    pub total_legitime: Money,       // BigRational internally, Money in output
    pub fp_gross: Money,             // E_adj - total_legitime
    pub fp_disposable: Money,        // = fp_gross (testate) or 0 (intestate)
    pub scenario_code: ScenarioCode,
    pub e_adj: Money,                // echoed for traceability
}
```

**Algorithm**:
1. Look up fraction table for `scenario_code` (from `analysis/legitime-fractions.md`)
2. Compute per-heir legitime fraction × E_adj
3. Apply Art. 895 cap rule for IC (G4):
   - IC uncapped = fraction × E_adj
   - IC cap = min(IC uncapped, each_legitimate_child_legitime, fp_gross)
   - Actual IC legitime = min(uncapped, cap)
4. Apply Art. 890 for ascendants: split between paternal and maternal lines
5. For representatives: do NOT compute separate legitime — they share the represented heir's slot
   (their individual amount is computed at distribution step 9)
6. FP_gross = E_adj − total_legitime
7. FP_disposable = FP_gross if testate, 0 if intestate

**Restart possible**: NO

---

### Step 7: ValidateTestate

**Function**: `step7_validate_testate(state: &mut PipelineState) -> StepResult`

**Input**: `state.input.will`, `state.classified_heirs`, `state.legitime_result`

**Output**: `state.testate_validation: TestateValidationResult`
OR `StepResult::Restart { from_step: 3, trigger: ValidDisinheritance | PreteritionAnnulment }`

**If no will (intestate)**: Skip → `StepResult::Continue`

**If will present**:

**Sub-step A: Strip prohibited conditions (Art. 872)**
- For each institution/devise/legacy with conditions, strip:
  - Conditions against future marriage
  - Conditions to remarry a specific person
  - Conditions impossible in nature
- Log each stripped condition as a `CONDITION_STRIPPED` warning

**Sub-step B: Batch disinheritance (BUG-001 FIX)**
```
Call apply_all_disinheritances(
    &mut state.classified_heirs,
    &state.input.will.disinheritances,
    &state.family_tree,
)
```
See `analysis/multiple-disinheritance-fix.md` for the full algorithm.
- Validates grounds (Arts. 919/920/921)
- Partitions valid vs invalid
- Batch-excludes all valid disinheritances
- Adds all representatives atomically
- Returns `DisinheritanceResult { requires_restart: bool }`

**Sub-step C: Detect preterition**
- Operates on post-disinheritance heir set
- Check: does any G1 or G2 compulsory heir appear in the will with ZERO allocation
  AND was not expressly disinherited? (Art. 854)
- Preterition of a compulsory heir in the DIRECT LINE:
  - Annuls ALL testamentary institutions
  - Preserves devises and legacies (to extent FP allows)
  - Add `PRETERITION` warning with `preterited_heir_id`
  - `preterition_effect = InstitutionAnnulled { preterited_heir_ids: [...] }`

**Sub-step D: Check underprovision**
- For each compulsory heir in will: allocated amount < legitime?
  → Add `UNDERPROVISION` warning (heir gets their full legitime by Art. 906)

**Restart logic**:
```rust
let requires_restart = dis_result.requires_restart
    || matches!(preterition_effect, InstitutionAnnulled { .. });

if requires_restart {
    return StepResult::Restart {
        from_step: 3,
        trigger: /* ValidDisinheritance or PreteritionAnnulment */,
    };
}
```

**Restart possible**: YES → `from_step: 3`

---

### Step 8: AllocateFreePortion

**Function**: `step8_allocate_free_portion(state: &mut PipelineState) -> StepResult`

**Input**: `state.input.will` (post-validation), `state.legitime_result`, `state.classified_heirs`

**Output**: `state.free_portion: FreePortionAllocation`

**If intestate**: FP allocation is empty (all goes to formula-based intestate distribution)

**If testate**:
1. Total FP budget = `legitime_result.fp_disposable`
2. For each institution in will: compute peso amount (fraction × E_adj)
3. For each devise/legacy: use specified amount
4. Total requested = sum of all allocations
5. **Inofficiousness check** (Art. 911):
   - If total requested > FP budget:
     - **Step 1**: Reduce monetary institutions pro rata until FP = 0
     - **Step 2**: Reduce devises/legacies pro rata (Art. 911 ¶2)
     - **Step 3**: Reduce inter vivos donations in reverse-chronological order (most recent first)
6. Leftover FP (not disposed by will) → intestate fallback (accumulates as unallocated_fp)

```rust
pub struct FreePortionAllocation {
    pub fp_budget: Money,
    pub institutions: Vec<InstitutionAllocation>,
    pub devises: Vec<DeviseAllocation>,
    pub legacies: Vec<LegacyAllocation>,
    pub unallocated_fp: Money,
    pub reductions: Vec<DonationReduction>,
    pub is_inofficious: bool,
}
```

**Restart possible**: NO

---

### Step 9: Distribute

**Function**: `step9_distribute(state: &mut PipelineState) -> StepResult`

**Input**: `state.legitime_result`, `state.free_portion`, `state.classified_heirs`,
`state.collation_result`

**Output**: `state.distributions: Vec<HeirDistribution>`

**Each `HeirDistribution` is still in `BigRational`** — rounding happens in step 10.

**For each eligible heir**:
1. Start with `base_share = legitime_entry.amount` (from step 6)
2. Add any FP institution allocation (from step 8)
3. Add any devise/legacy allocation (from step 8)
4. For intestate: compute per intestate formula for this scenario (from `analysis/intestate-distribution.md`)
5. Apply collation imputation (Art. 1073):
   - Deduct `donation.value` from heir's share if donation is collatable AND heir is the donee
   - If imputation > share: heir's share → 0 (heir cannot be forced to contribute beyond their share, Art. 1074)
   - Excess imputation does NOT reduce co-heirs' shares (absorbs in estate)
6. For representatives: divide the represented slot equally among all representatives
7. For unallocated FP: distribute to intestate-entitled heirs per Art. 1022(2)

**Invariant at end of step 9 (pre-rounding)**:
```
sum(distributions[i].gross_share for all eligible heirs)
    + sum(devise/legacy allocations to non-heirs)
    + sum(unreduced inofficious amounts absorbed by estate)
    == collation_result.e_adj
```

**Restart possible**: NO

---

### Step 10: ResolveVacancies + Round

**Function**: `step10_resolve_vacancies_and_round(state: &mut PipelineState) -> StepResult`

**Input**: `state.distributions`, `state.input.will`, `state.classified_heirs`

**Output**: `state.vacancy_resolution: VacancyResolution`, updated `state.distributions`,
then Hare-Niemeyer rounding → `ComputationOutput`

**Phase A: Identify vacant shares**
- A share is vacant if an heir cannot or will not receive:
  - Predecease with no representatives (after step 3 found none)
  - Renunciation (`heir.has_renounced = true`)
  - Incapacity (Art. 1027) with no representatives
  - Any remaining case where `distributions[i].gross_share > 0` but heir is ineligible

**Phase B: Resolve each vacancy (priority chain)**
For each vacant share:
1. **Substitution** (testate only): will names a substitute → substitute receives share. DONE.
2. **Representation**: vacancy cause ≠ RENUNCIATION AND heir has descendants → per stirpes. DONE.
   (Note: representatives already added in step 3 for predecease/unworthiness. This phase
    handles late-discovered vacancies or accretion of remaining amounts.)
3. **Accretion**:
   - If `share_source == LEGITIME` (Art. 1021 ¶2):
     → **NOT simple addition**. Remove heir from pool. Trigger:
     `StepResult::Restart { from_step: 4, trigger: LegitimeVacancy { ... } }`
   - If `share_source == FREE_PORTION` (Art. 1021 ¶1):
     → Requires pro indiviso condition (co-heirs from same testamentary institution).
     → Distribute proportionally among co-heirs (Art. 1019).
   - If `share_source == INTESTATE`:
     → Art. 1018: always accrues to co-heirs. Distribute proportionally.
4. **Intestate fallback** (Art. 1022(2), testate only): no accretion possible → pass to legal heirs

**Phase C: Hare-Niemeyer rounding** (only reached if no restart)
1. All `HeirDistribution.gross_share` values are `BigRational`
2. Total exact centavos = `e_adj.centavos` (a known integer)
3. For each heir: `quota_i = gross_share_i × total_centavos`
4. Each heir starts with `floor(quota_i)` centavos
5. Distribute remaining `total - sum(floors)` centavos one at a time to heirs with largest
   fractional remainders (ties broken by heir_id lexicographic order for determinism)
6. Log each rounding adjustment as `RoundingAdjustment { heir_id, added_centavos }`

**Restart possible**: YES → `from_step: 4` (Art. 1021 ¶2 legitime vacancy only)

---

## Restart Scenarios and Expected Counts

| Scenario | Restart trigger | From step | Typical restart count |
|----------|----------------|-----------|----------------------|
| One valid disinheritance, no reps | ValidDisinheritance | 3 | 1 |
| One valid disinheritance, reps added | ValidDisinheritance | 3 | 1 |
| Multiple simultaneous disinheritances | ValidDisinheritance (batch) | 3 | 1 |
| Preterition with institution annulment | PreteritionAnnulment | 3 | 1 |
| Intestate — no will | — | — | 0 |
| Renunciation of legitime | LegitimeVacancy | 4 | 1 |
| Renunciation of legitime + disinheritance | Both | 3 then 4 | 2 |
| Cascading disinheritance | ValidDisinheritance | 3 | 1 |
| All G1 disinherited (conservative rule) | ValidDisinheritance | 3 | 1 |
| Legitimate vacancy of accretion recipient | LegitimeVacancy | 4 | 2 |
| Pathological loop (should not occur) | Any | Any | → MaxRestartsExceeded |

**Guard value `MAX_RESTARTS = 10`** is generous. Real-world estates with any combination of
disinheritances + preterition + renunciations should complete in ≤ 4 restarts.

---

## Pipeline Step Summary Table

| # | Function | Key Input | Key Output | Restart? |
|---|----------|-----------|------------|----------|
| 1 | ValidateInput | raw ComputationInput | validated ComputationInput | No (fatal) |
| 2 | ClassifyHeirs | HeirInput[], DecedentInput | ClassifiedHeir[] (base) | No |
| 3 | BuildRepresentation | ClassifiedHeir[] + FamilyTree | ClassifiedHeir[] + reps | No |
| 4 | DetermineScenario | ClassifiedHeir[], has_will | ScenarioCode | No |
| 5 | ComputeCollation | Donation[], ClassifiedHeir[], net_estate | E_adj, CollationResult | No |
| 6 | ComputeLegitimes | ScenarioCode, E_adj, ClassifiedHeir[] | LegitimeResult | No |
| 7 | ValidateTestate | Will, ClassifiedHeir[], LegitimeResult | TestateValidationResult | YES → step 3 |
| 8 | AllocateFreePortion | Will (validated), LegitimeResult | FreePortionAllocation | No |
| 9 | Distribute | LegitimeResult, FP, ClassifiedHeir[], Collation | HeirDistribution[] (rational) | No |
| 10 | ResolveVacancies+Round | HeirDistribution[], Will, ClassifiedHeir[] | ComputationOutput | YES → step 4 |

---

## Computation Log

Every step appends to `state.computation_log: Vec<ComputationLogEntry>`:

```rust
pub struct ComputationLogEntry {
    pub step: u8,
    pub step_name: String,
    pub restart_count: u8,
    pub description: String,
    pub key_values: Vec<(String, String)>,  // e.g., [("ScenarioCode", "T3(n=2)")]
}
```

The log is included verbatim in `ComputationOutput.computation_log` for display in the
"Computation Log" panel of the frontend results view.

---

## Design Decisions

1. **Steps 1–2 are never re-run on restart.** Input validation and base heir classification
   are based on immutable facts (HeirInput data, civil status). Only the downstream state
   built from that data needs recomputation.

2. **Step 7 restart target is step 3 (not step 5).** Disinheritance changes the heir set,
   which means representation lines must be re-built from scratch (step 3 adds reps for
   predecease/unworthiness; we need clean re-run with the new exclusion set). Step 4 then
   re-determines the scenario. Steps 5–6 re-run on the new scenario.

3. **Step 10 restart target is step 4 (not step 3).** Legitime vacancy (renunciation) does
   not change the heir set from step 3 — no new heirs are added. Only the scenario code and
   downstream need recomputation. The renouncing heir is simply removed from the active pool
   before step 4 re-runs.

4. **Rounding is the final sub-step of step 10**, not a separate step 11. Rounding only runs
   after all vacancy resolution is complete and no further restarts are triggered.

5. **`classified_heirs_base` is truly immutable.** It is the snapshot from step 2.
   All mutations (disinheritance exclusions, representative additions) happen to the working
   copy `classified_heirs`. On restart to step 3, we strip representative additions from
   `classified_heirs` but preserve disinheritance exclusions set by step 7.

6. **Collation phase 2 (imputation) runs in step 9**, not step 5. Imputation depends on
   knowing each heir's gross share (legitime + FP allocation) to know how much to deduct.
   Step 5 only computes E_adj (the estate base adjustment).

---

## Module Layout

The pipeline maps to source files in `src/`:

```
src/
├── lib.rs                    # WASM entry point, calls run_pipeline()
├── types.rs                  # All type definitions (§3 of spec)
├── pipeline.rs               # PipelineState, run_pipeline(), dispatch_step()
├── step1_validate.rs
├── step2_classify.rs
├── step3_representation.rs
├── step4_scenario.rs
├── step5_collation.rs
├── step6_legitimes.rs
├── step7_testate.rs          # includes apply_all_disinheritances() (BUG-001 fix)
├── step8_free_portion.rs
├── step9_distribute.rs
├── step10_vacancies.rs       # includes hare_niemeyer() rounding
└── narratives.rs             # generate_narrative() per heir
```
