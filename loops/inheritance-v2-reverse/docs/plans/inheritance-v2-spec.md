# Philippine Inheritance Distribution Engine v2 — Full-Stack Specification

**Status**: Synthesized from 26 analysis files (Waves 1–5)
**Date**: 2026-03-04
**Supersedes**: `docs/plans/inheritance-engine-spec.md` (v1, ~1,200 lines)

A developer MUST be able to build the Rust engine, WASM bridge, and React frontend from this
document alone, with zero type mismatches between layers.

---

## Table of Contents

- [§1 Overview](#1-overview)
- [§2 Computation Pipeline](#2-computation-pipeline)
- [§3 Data Model — Rust Types](#3-data-model--rust-types)
- [§4 Heir Classification](#4-heir-classification)
- [§5 Representation (Arts. 970–977)](#5-representation-arts-970977)
- [§6 Legitime Computation](#6-legitime-computation)
- [§7 Distribution](#7-distribution)
- [§8 Collation (Arts. 1061–1077)](#8-collation-arts-10611077)
- [§9 Testate Validation](#9-testate-validation)
- [§10 Vacancy Resolution (Arts. 1015–1023)](#10-vacancy-resolution-arts-10151023)
- [§11 Narrative Templates](#11-narrative-templates)
- [§12 Rounding — Hare-Niemeyer](#12-rounding--hare-niemeyer)
- [§13 Bridge Contract](#13-bridge-contract)
- [§14 TypeScript Types](#14-typescript-types)
- [§15 Zod Schemas](#15-zod-schemas)
- [§16 Frontend Architecture](#16-frontend-architecture)
- [§17 Design System](#17-design-system)
- [§18 Test Vectors](#18-test-vectors)
- [§19 Invariants](#19-invariants)
- [§20 Cross-Layer Consistency Checklist](#20-cross-layer-consistency-checklist)
- [§21 Edge Cases + Manual Review Flags](#21-edge-cases--manual-review-flags)
- [Appendix A: Civil Code Quick Reference](#appendix-a-civil-code-quick-reference)
- [Appendix B: Glossary](#appendix-b-glossary)

---

## §1 Overview

The Philippine Inheritance Distribution Engine computes the legally correct distribution of
a decedent's estate under Philippine succession law. It is a deterministic, WASM-compiled
Rust engine with a React wizard frontend.

**Primary users**: Estate lawyers, notarial practitioners, estate planners, and heirs
navigating intestate proceedings or will execution in the Philippines.

**Legal scope**:
- Civil Code of the Philippines, Book III (Arts. 774–1105) — succession
- Family Code (Arts. 163–193) — filiation, legitimacy
- RA 8552 (Domestic Adoption Act, 1998)
- RA 11642 (Domestic Administrative Adoption Act, 2022)

**What it computes**:
1. Heir classification (legitimate, illegitimate, adopted, ascendants, collaterals)
2. Scenario code (30 scenarios: T1–T15 testate, I1–I15 intestate)
3. Legitime fractions and amounts per heir
4. Free portion allocation (testate only)
5. Collation adjustment (inter vivos donations brought back to estate)
6. Testate validation (preterition, disinheritance, inofficiousness, underprovision)
7. Vacancy resolution (substitution → representation → accretion → intestate fallback)
8. Final peso/centavo distribution per heir
9. Warnings and manual review flags

**What it does NOT do**:
- Legal advice or attorney opinions
- Property identification or titling
- Tax computation (estate tax, donor's tax)
- Real-time data lookup (land values, market prices)

---

## §2 Computation Pipeline

### §2.1 Architecture

The engine is a **deterministic, restartable 10-step pipeline**. Given identical input, it
always produces identical output. Steps may restart when heir eligibility changes mid-run.

```rust
pub struct PipelineState {
    // Immutable after step 1
    pub input: ComputationInput,

    // Immutable after step 2 — base classification from HeirInput only
    pub classified_heirs_base: Vec<ClassifiedHeir>,

    // Working state (cleared on restart)
    pub classified_heirs: Vec<ClassifiedHeir>,    // + representation additions
    pub scenario_code: Option<ScenarioCode>,       // step 4
    pub collation_result: Option<CollationResult>, // step 5
    pub legitime_result: Option<LegitimeResult>,   // step 6
    pub testate_validation: Option<TestateValidationResult>, // step 7
    pub free_portion: Option<FreePortionAllocation>, // step 8
    pub distributions: Option<Vec<HeirDistribution>>, // step 9
    pub vacancy_resolution: Option<VacancyResolution>, // step 10

    // Restart control
    pub restart_count: u8,
    pub last_restart_trigger: Option<RestartTrigger>,

    // Output accumulation (append-only across restarts)
    pub warnings: Vec<ValidationWarning>,
    pub manual_review_flags: Vec<ManualReviewFlag>,
    pub computation_log: Vec<ComputationLogEntry>,
}

pub const MAX_RESTARTS: u8 = 10;
```

### §2.2 Restart Triggers

```rust
#[serde(rename_all = "PascalCase")]
pub enum RestartTrigger {
    ValidDisinheritance { heir_ids: Vec<HeirId> },    // step 7 → restart step 3
    PreteritionAnnulment { preterited_heir_ids: Vec<HeirId> }, // step 7 → restart step 3
    LegitimeVacancy { vacant_heir_id: HeirId },       // step 10 → restart step 4
}
```

### §2.3 The 10 Steps

```
Step 1  ValidateInput        — structural + semantic validation
Step 2  ClassifyHeirs        → Vec<ClassifiedHeir> (base, immutable)
Step 3  BuildRepresentation  → add representative heirs to classified_heirs
                               ← RESTART TARGET: disinheritance / preterition
Step 4  DetermineScenario    → ScenarioCode
                               ← RESTART TARGET: Art. 1021 ¶2 legitime vacancy
Step 5  ComputeCollation     → CollationResult (E_adj)
Step 6  ComputeLegitimes     → LegitimeResult
Step 7  ValidateTestate      → TestateValidationResult
                               → EMITS RESTART to step 3 on valid disinheritance / preterition
Step 8  AllocateFreePortion  → FreePortionAllocation
Step 9  Distribute           → Vec<HeirDistribution> (BigRational amounts)
Step 10 ResolveVacancies+Round → final centavo amounts, RoundingAdjustment[]
                               → EMITS RESTART to step 4 on Art. 1021 ¶2 legitimate vacancy
```

### §2.4 Clear-on-Restart Rules

| Restart to | Cleared | Preserved |
|---|---|---|
| **Step 3** | Representation additions, scenario_code, collation, legitimes, testate_validation, free_portion, distributions, vacancy_resolution | classified_heirs_base; disinheritance/preterition exclusions |
| **Step 4** | scenario_code, collation, legitimes, testate_validation, free_portion, distributions, vacancy_resolution | Steps 1–3 results (full classified heirs with reps) |

### §2.5 Pipeline Orchestrator

```rust
pub fn run_pipeline(input: ComputationInput) -> Result<ComputationOutput, ComputationError> {
    let mut state = PipelineState::new(input);
    let mut step: u8 = 1;
    loop {
        match dispatch_step(step, &mut state) {
            StepResult::Continue => {
                if step == 10 { return Ok(state.into_output()); }
                step += 1;
            }
            StepResult::Restart { from_step, trigger } => {
                state.restart_count += 1;
                if state.restart_count > MAX_RESTARTS {
                    return Err(ComputationError::MaxRestartsExceeded {
                        restart_count: state.restart_count as u32,
                        last_step: format!("step{}", step),
                    });
                }
                state.last_restart_trigger = Some(trigger);
                state.clear_from_step(from_step);
                step = from_step;
            }
            StepResult::Error(e) => return Err(e),
        }
    }
}
```

### §2.6 Source Module Layout

```
src/
  lib.rs             — re-exports + wasm.rs
  wasm.rs            — compute_json() wasm_bindgen entry point
  types.rs           — all type definitions
  pipeline/
    mod.rs           — run_pipeline(), PipelineState
    step1_validate.rs
    step2_classify.rs
    step3_represent.rs
    step4_scenario.rs
    step5_collate.rs
    step6_legitimes.rs
    step7_testate.rs
    step8_free_portion.rs
    step9_distribute.rs
    step10_vacancies.rs
```

---

## §3 Data Model — Rust Types

All types carry serde attributes. **Authoritative serde rules**:
- Struct fields: `#[serde(rename_all = "snake_case")]`
- Enum variants: `#[serde(rename_all = "PascalCase")]`
- Input types: `#[serde(deny_unknown_fields)]`
- Output types: no `deny_unknown_fields` (forward-compatible)
- `Option<T>` fields: NEVER use `skip_serializing_if`; always emit `null`

### §3.1 Type Aliases

```rust
pub type HeirId        = String;
pub type DonationId    = String;
pub type DispositionId = String;
pub type DeviseId      = String;
pub type LegacyId      = String;
pub type ConditionId   = String;
```

### §3.2 Money

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub struct Money {
    /// Stored as i64 centavos.
    /// Deserializes from JSON number OR JSON string (BigInt support).
    /// Serializes as JSON number.
    #[serde(deserialize_with = "deserialize_centavos")]
    pub centavos: i64,
}
```

Custom deserializer accepts `123456` (number) and `"123456"` (string).

### §3.3 Input Enums

#### HeirType (9 variants)
```rust
#[serde(rename_all = "PascalCase")]
pub enum HeirType {
    LegitimateChild,    // FC Art. 164
    LegitimatedChild,   // FC Arts. 177–179
    AdoptedChild,       // RA 8552 / RA 11642
    IllegitimateChild,  // FC Arts. 165, 175
    LegitimateAscendant,// Art. 887(2)
    Spouse,             // widow/widower
    Sibling,            // Arts. 1003–1007
    NieceNephew,        // Art. 972
    OtherCollateral,    // Arts. 1009–1010
}
```

#### LegalSeparationStatus (3 variants)
```rust
#[serde(rename_all = "PascalCase")]
pub enum LegalSeparationStatus {
    NotApplicable,
    InnocentSpouse,   // Art. 892 — retains rights
    GuiltySpouse,     // Art. 1002 — excluded
}
```

#### DisinheritanceGround (22 variants)
```rust
#[serde(rename_all = "PascalCase")]
pub enum DisinheritanceGround {
    // Art. 919 — against children/descendants
    Art919_1, Art919_2, Art919_3, Art919_4,
    Art919_5, Art919_6, Art919_7, Art919_8,
    // Art. 920 — against parents/ascendants
    Art920_1, Art920_2, Art920_3, Art920_4,
    Art920_5, Art920_6, Art920_7, Art920_8,
    // Art. 921 — against surviving spouse
    Art921_1, Art921_2, Art921_3, Art921_4,
    Art921_5, Art921_6,
}
```

Wire values: `"Art919_1"` through `"Art921_6"` (PascalCase rename is identity for these).

#### SubstitutionType (3 variants)
```rust
#[serde(rename_all = "PascalCase")]
pub enum SubstitutionType { Simple, Fideicommissary, Reciprocal }
```

#### ScenarioCode (30 variants)
```rust
#[serde(rename_all = "PascalCase")]
pub enum ScenarioCode {
    T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15,
    I1, I2, I3, I4, I5, I6, I7, I8, I9, I10, I11, I12, I13, I14, I15,
}
```

Wire values: `"T1"` through `"I15"` (unchanged by PascalCase rename).

### §3.4 Input Structs

#### ComputationInput
```rust
#[serde(deny_unknown_fields, rename_all = "snake_case")]
pub struct ComputationInput {
    pub decedent:  DecedentInput,
    pub estate:    EstateInput,
    pub heirs:     Vec<HeirInput>,
    pub will:      Option<WillInput>,
    pub donations: Option<Vec<DonationInput>>,
}
```

#### DecedentInput
```rust
#[serde(deny_unknown_fields, rename_all = "snake_case")]
pub struct DecedentInput {
    pub name:                      String,
    pub date_of_death:             Option<String>,  // "YYYY-MM-DD"
    pub has_will:                  bool,
    pub has_legitimate_children:   bool,
    pub has_illegitimate_children: bool,
    pub legal_separation_status:   LegalSeparationStatus,
    pub domicile:                  Option<String>,
    pub nationality:               Option<String>,
    pub is_illegitimate:           bool,    // for T14/T15 Art. 903
    pub articulo_mortis:           bool,    // for Art. 900 ¶2
    pub cohabitation_years:        u32,     // for Art. 900 ¶2 (0 if not articulo mortis)
}
```

#### EstateInput
```rust
#[serde(deny_unknown_fields, rename_all = "snake_case")]
pub struct EstateInput {
    pub net_estate:   Money,
    pub gross_estate: Option<Money>,
    pub obligations:  Option<Money>,
    pub description:  Option<String>,
}
```

#### HeirInput (recursive — children for representation)
```rust
#[serde(deny_unknown_fields, rename_all = "snake_case")]
pub struct HeirInput {
    pub id:                      HeirId,
    pub name:                    String,
    pub heir_type:               HeirType,
    pub is_alive:                bool,
    pub is_adopted:              bool,
    pub adoption_rescinded:      bool,
    pub adoption_date:           Option<String>,
    pub adoption_rescission_date:Option<String>,
    pub cause_proven:            bool,    // for disinheritance cause_proven
    pub reconciled:              bool,    // Art. 922
    pub date_of_birth:           Option<String>,
    pub date_of_death:           Option<String>,
    pub degree:                  Option<u32>, // collateral degree; null for direct-line
    pub legal_separation_status: LegalSeparationStatus,
    pub disinheritances:         Vec<DisinheritanceRecord>,
    pub substitutions:           Vec<SubstitutionInput>,
    pub children:                Vec<HeirInput>,  // grandchildren for representation
    pub donations_received:      Vec<DonationId>, // references to top-level donations
}
```

#### DisinheritanceRecord
```rust
#[serde(deny_unknown_fields, rename_all = "snake_case")]
pub struct DisinheritanceRecord {
    pub id:           DispositionId,
    pub heir_id:      HeirId,
    pub ground:       DisinheritanceGround,
    pub cause_proven: bool,
    pub reconciled:   bool,
    pub note:         Option<String>,
}
```

#### WillInput
```rust
#[serde(deny_unknown_fields, rename_all = "snake_case")]
pub struct WillInput {
    pub id:            DispositionId,
    pub date_executed: Option<String>,
    pub institutions:  Vec<InstitutionInput>,
    pub devises:       Vec<DeviseInput>,
    pub legacies:      Vec<LegacyInput>,
    pub substitutions: Vec<SubstitutionInput>,
}
```

#### InstitutionInput
```rust
#[serde(deny_unknown_fields, rename_all = "snake_case")]
pub struct InstitutionInput {
    pub id:              DispositionId,
    pub heir_id:         HeirId,
    pub fraction:        Option<String>, // "numer/denom"; takes precedence over amount
    pub amount_centavos: Option<i64>,
    pub description:     Option<String>,
}
```

Exactly one of `fraction` or `amount_centavos` must be non-null.

#### DeviseInput / LegacyInput
```rust
#[serde(deny_unknown_fields, rename_all = "snake_case")]
pub struct DeviseInput {
    pub id:                  DeviseId,
    pub description:         String,
    pub value:               Money,
    pub beneficiary_heir_id: Option<HeirId>, // null = charitable devise
    pub conditions:          Vec<ConditionInput>,
}
// LegacyInput is identical shape with LegacyId
```

#### SubstitutionInput
```rust
#[serde(deny_unknown_fields, rename_all = "snake_case")]
pub struct SubstitutionInput {
    pub id:                  DispositionId,
    pub primary_heir_id:     HeirId,
    pub substitute_heir_id:  HeirId,
    pub substitution_type:   SubstitutionType,
    pub conditions:          Vec<ConditionInput>,
}
```

#### DonationInput
```rust
#[serde(deny_unknown_fields, rename_all = "snake_case")]
pub struct DonationInput {
    pub id:                  DonationId,
    pub donor_id:            Option<String>,
    pub recipient_heir_id:   Option<HeirId>,
    pub amount:              Money,
    pub date:                Option<String>,
    pub is_collatable:       bool,
    pub donor_expressly_exempted: bool,
    pub heir_renounced:      bool,
    pub r#type:              String,    // free-text category
    pub description:         Option<String>,
    pub professional_expense_imputed_savings_centavos: Option<i64>,
}
```

### §3.5 Output Enums

#### SuccessionType
```rust
#[serde(rename_all = "PascalCase")]
pub enum SuccessionType { Testate, Intestate, Mixed }
```

#### ExclusionReason
```rust
#[serde(rename_all = "PascalCase")]
pub enum ExclusionReason {
    Predeceased, Incapacity, Unworthiness, Renunciation,
    IronCurtain, NotCalled, ValidDisinheritance, InvalidDisinheritance,
}
```

#### RepresentationTrigger
```rust
#[serde(rename_all = "PascalCase")]
pub enum RepresentationTrigger {
    Predecease, Disinheritance, Incapacity, Art902IllegitimateLine,
}
```

#### VacancyCause
```rust
#[serde(rename_all = "PascalCase")]
pub enum VacancyCause {
    Predecease, Incapacity, Renunciation, DisinheritanceInvalid,
    ConditionFailed, LegitimacyVacancy,
}
```

#### ResolutionMethod
```rust
#[serde(rename_all = "PascalCase")]
pub enum ResolutionMethod {
    Substitution, Representation, Accretion, IntestateFallback, Escheat,
}
```

#### ShareSource
```rust
#[serde(rename_all = "PascalCase")]
pub enum ShareSource { Legitime, FreePortion, Intestate, Collateral }
```

#### EffectiveGroup (output string — NOT an enum in Rust, stored as Option<String>)

Output values: `"G1"`, `"G2"`, `"G3"`, `"G4"`, or `null` for excluded heirs.
Frontend displays human labels: G1 = "Compulsory Heir (Primary)", G2 = "Ascendants",
G3 = "Collaterals", G4 = "Illegitimate Children".

### §3.6 Tagged Output Enums

#### PreteritionEffect — internally tagged `"type"`
```rust
#[serde(tag = "type", rename_all = "PascalCase")]
pub enum PreteritionEffect {
    AnnulsAll,
    AnnulsInstitutions { affected_institution_ids: Vec<DispositionId> },
}
```
Wire: `{"type":"AnnulsAll"}` or `{"type":"AnnulsInstitutions","affected_institution_ids":["i1"]}`

#### ValidationWarning — adjacently tagged `"code"` + `"data"`
```rust
#[serde(tag = "code", content = "data", rename_all = "PascalCase")]
pub enum ValidationWarning {
    CollationDebt { heir_id: HeirId, excess_centavos: i64 },
    InvalidDisinheritance { heir_id: HeirId, reason: String },
    ManualReviewRequired { flag: String },
    LegitimeUnderprovision { heir_id: HeirId, deficit_centavos: i64 },
    InofficiousDonation { donation_id: DonationId, reduction_centavos: i64 },
    ArticuloMortisSpouse { spouse_legitime_reduced: bool },
    IronCurtainApplied { blocked_heir_id: HeirId },
    ReconciliationNullified { disinheritance_id: DispositionId },
    SubstitutionActivated { primary_heir_id: HeirId, substitute_heir_id: HeirId },
    EscheatLikely,
}
```

#### ManualReviewFlag — internally tagged `"flag"`
```rust
#[serde(tag = "flag", rename_all = "PascalCase")]
pub enum ManualReviewFlag {
    AllGrandparentsExcluded,
    CollateralDegreeAmbiguous { degree: u32 },
    FiliationDisputed { heir_id: HeirId },
    AdoptionDocumentsMissing { heir_id: HeirId },
    WillFormInvalid,
    Art903AmbiguousParentage,
    AllG1DisinheritedNoReps,
}
```

#### ComputationError — internally tagged `"error_type"`
```rust
#[serde(tag = "error_type", rename_all = "PascalCase")]
pub enum ComputationError {
    InputValidation  { message: String, field_path: Option<String> },
    DomainValidation { message: String, related_heir_ids: Vec<HeirId> },
    MaxRestartsExceeded { restart_count: u32, last_step: String },
    ArithmeticError  { message: String },
    PanicRecovered   { message: String },
}
```

### §3.7 Output Structs

#### ComputationOutput
```rust
#[serde(rename_all = "snake_case")]
pub struct ComputationOutput {
    pub scenario_code:              ScenarioCode,
    pub succession_type:            SuccessionType,
    pub net_distributable_estate:   Money,
    pub adjusted_estate:            Money,           // E_adj = net + collatable donations
    pub free_portion_gross:         Money,
    pub free_portion_disposable:    Money,
    pub distributions:              Vec<HeirDistribution>,
    pub rounding_adjustments:       Vec<RoundingAdjustment>,
    pub warnings:                   Vec<ValidationWarning>,
    pub manual_review_flags:        Vec<ManualReviewFlag>,
    pub testate_validation:         Option<TestateValidationResult>,
    pub collation:                  Option<CollationResult>,
    pub vacancy_resolutions:        Vec<VacancyResolution>,
    pub computation_log:            Vec<ComputationLogEntry>,
}
```

#### HeirDistribution
```rust
#[serde(rename_all = "snake_case")]
pub struct HeirDistribution {
    pub heir_id:               HeirId,
    pub heir_name:             String,
    pub heir_type:             HeirType,
    pub effective_group:       Option<String>,   // "G1".."G4" or null
    pub is_excluded:           bool,
    pub exclusion_reason:      Option<ExclusionReason>,
    pub legitime_centavos:     i64,
    pub free_portion_centavos: i64,
    pub total_centavos:        i64,
    pub share_source:          ShareSource,
    pub per_stirpes_fraction:  Option<String>,   // "numer/denom"
    pub representation:        Option<RepresentationChain>,
    pub per_heir_fraction:     Option<String>,   // "numer/denom"
    pub partition_notes:       Option<String>,
    // For INV-2 collation support:
    pub collation_credit_centavos: i64,           // 0 if no collation
    pub total_entitlement_centavos: i64,          // total_centavos + collation_credit_centavos
    pub is_compulsory_heir:    bool,
    pub legitime_floor_centavos: i64,            // for INV-3 check
}
```

#### RoundingAdjustment
```rust
#[serde(rename_all = "snake_case")]
pub struct RoundingAdjustment {
    pub heir_id:              HeirId,
    pub adjustment_centavos:  i64,   // +1 or -1
    pub reason:               String,
    pub fractional_remainder: String, // "numer/denom"
}
```

#### RepresentationChain
```rust
#[serde(rename_all = "snake_case")]
pub struct RepresentationChain {
    pub representing_heir_id: HeirId,
    pub represented_heir_id:  HeirId,
    pub trigger:              RepresentationTrigger,
    pub depth:                u32,   // 1 = immediate, 2 = two levels deep
}
```

#### ComputationLogEntry
```rust
#[serde(rename_all = "snake_case")]
pub struct ComputationLogEntry {
    pub step:    u8,
    pub label:   String,
    pub message: String,
    pub data:    Option<serde_json::Value>,
}
```

---

## §4 Heir Classification

### §4.1 Compulsory Heir Groups

| Group | Members | Arts. |
|---|---|---|
| **G1** | Legitimate children/descendants (LC), legitimated children, adopted children | 887(1), FC 164, RA 8552 |
| **G2** | Legitimate ascendants (parents, grandparents, higher) | 887(2), 890 |
| **G3** | Surviving spouse | 887(3) |
| **G4** | Illegitimate children (IC) | 887(4), FC 175 |

Collaterals (siblings, nieces/nephews, other collaterals) are NOT compulsory heirs — they
only inherit intestate when no closer heirs exist.

### §4.2 EffectiveGroup Mapping

| HeirType | EffectiveGroup |
|---|---|
| LegitimateChild | G1 |
| LegitimatedChild | G1 |
| AdoptedChild | G1 (adoption not rescinded) |
| LegitimateAscendant | G2 (only when G1 absent) |
| Spouse | G3 |
| IllegitimateChild | G4 |
| Sibling / NieceNephew / OtherCollateral | null (intestate only) |

G2 is **excluded by G1** (Art. 887 ¶2: ascendants excluded by descendants).

### §4.3 Eligibility Gates (7 conditions)

An heir is **ineligible** (`is_eligible = false`) if ANY of:

1. **Predeceased**: `is_alive = false` AND no representatives found (step 3)
2. **Incapacity/unworthiness**: convicted of crime against decedent (Art. 1032)
3. **Filiation unproven**: IC with `cause_proven = false` (FC Art. 175)
4. **Guilty spouse**: `LegalSeparationStatus::GuiltySpouse` (Art. 1002 / Art. 63 FC)
5. **Adoption rescinded**: `adoption_rescinded = true` → reverts to biological heir_type
6. **Valid disinheritance**: `disinheritances` has valid ground + `cause_proven = true` + not reconciled
7. **Renunciation**: heir formally renounced; `is_alive = true` but treated as ineligible for representation (Art. 977 — renunciation does NOT trigger representation)

### §4.4 Filiation Proof (FC Arts. 172, 175)

| Child Type | Proof Required |
|---|---|
| Legitimate | Birth certificate, baptismal cert, or open continuous possession (FC Art. 172) |
| Illegitimate | Same docs OR private handwritten instrument + signed by both parties (FC Art. 175) |
| Adopted | Adoption decree (RA 8552 §16 or RA 11642 §47) |

Engine uses `cause_proven: bool` as a proxy for filiation proof. If `false` for IC, mark as ineligible with `ExclusionReason::Incapacity` and emit `ManualReviewFlag::FiliationDisputed`.

### §4.5 Ascendant Division (Art. 890)

When G2 (ascendants) inherit:
- If BOTH parents alive → each gets **½ of ascendants' collective share**
- If only paternal or maternal line → entire share to that line
- If both paternal and maternal lines present at grandparent level → divide equally
- Algorithm: split G2 heirs into paternal vs maternal lines; divide collective share proportionally

### §4.6 Adoption Rules (RA 8552, RA 11642)

- Adopted child = legitimate child for all succession purposes (Art. 189 FC)
- Adoption confers full compulsory heir status in G1
- Rescission (RA 8552 §19): if `adoption_rescinded = true`, revert to biological heir_type (usually `IllegitimateChild` absent legitimation)
- Administrative adoption (RA 11642): same legal effect; adoption decree still required

### §4.7 Classification Algorithm (Step 2)

```rust
fn classify_heir(h: &HeirInput, decedent: &DecedentInput) -> ClassifiedHeir {
    let heir_type = resolve_type(h);  // apply adoption_rescinded, adoption rules
    let effective_group = assign_group(heir_type);
    let is_eligible = check_eligibility(h, decedent);
    ClassifiedHeir {
        input_ref: h.id.clone(),
        heir_type,
        effective_group,
        is_eligible,
        exclusion_reason: if !is_eligible { Some(determine_exclusion(h)) } else { None },
        representation_trigger: None, // set by step 3
        ..Default::default()
    }
}
```

---

## §5 Representation (Arts. 970–977)

### §5.1 Definition

Representation is the right of representatives to step into the shoes of a predeceased,
disinherited, or incapacitated heir and take their share by right of descent (per stirpes).

### §5.2 Four Triggers (Art. 970)

| Trigger | Condition | RepresentationTrigger variant |
|---|---|---|
| Predecease | `is_alive = false` AND heir has children | `Predecease` |
| Valid disinheritance | Heir validly disinherited AND has children | `Disinheritance` |
| Incapacity/unworthiness | Art. 1032 incapacity AND has children | `Incapacity` |
| Art. 902 illegitimate line | IC's descendants inherit by representation | `Art902IllegitimateLine` |

**Non-trigger**: Renunciation (Art. 977). A renouncing heir's share does NOT pass to their
children; it goes to co-heirs by accretion or intestate fallback.

### §5.3 Collateral Limit (Art. 972)

Representation in the collateral line is limited to **nephews and nieces** (children of
siblings). Grandnephews/grandnieces do NOT represent. Per capita applies when all nephews
inherit without a predeceased sibling (Art. 975).

### §5.4 Per Stirpes Algorithm

```rust
fn distribute_per_stirpes(
    parent_share: BigRational,
    representatives: &[ClassifiedHeir],
) -> Vec<(HeirId, BigRational)> {
    let n = representatives.len();
    representatives.iter().map(|r| {
        (r.input_ref.clone(), parent_share / BigRational::from(n as i64))
    }).collect()
}
```

Representatives split the **parent's share** equally. Their per-stirpes fraction is
`1/n` of the parent's fraction, recorded as `per_stirpes_fraction` in HeirDistribution.

### §5.5 Recursive Multi-Level Representation

```rust
fn find_representatives_recursive(
    heir: &HeirInput,
    depth: u32,
) -> Vec<(HeirInput, u32)> {
    if heir.children.is_empty() || depth > 10 {
        return vec![(heir.clone(), depth)];
    }
    heir.children.iter()
        .flat_map(|child| {
            if child.is_alive {
                vec![(child.clone(), depth)]
            } else {
                find_representatives_recursive(child, depth + 1)
            }
        })
        .collect()
}
```

### §5.6 Renunciation Asymmetry (Arts. 976–977)

- **Art. 976**: A person may represent an heir whose inheritance they themselves renounced
  (the representative inherits on behalf of the represented, not as renouncer)
- **Art. 977**: Heirs who renounced their own share in the estate CANNOT be represented;
  renunciation of a forced inheritance does not open representation for the renouncer's children

---

## §6 Legitime Computation

### §6.1 Three Regimes

| Regime | Condition | Primary legitime |
|---|---|---|
| **A** | G1 (LC/descendants) present | G1 collective = ½E; Art. 895 cap applies |
| **B** | G1 absent, G2 (ascendants) present | G2 collective = ½E; flat IC/spouse fractions |
| **C** | Both G1 and G2 absent | Direct flat fractions per Art. 894, 900, 901 |

**Special**: Art. 903 (T14/T15) when decedent is illegitimate with no descendants.

### §6.2 Two Free Portion Values

```
FP_gross      = E − primary_collective_legitime   (= ½E in Regimes A & B, = E in Regime C)
FP_disposable = FP_gross − spouse_from_fp − IC_from_fp
```

FP_gross is the Art. 895 ¶3 cap limit. FP_disposable is the testator's free disposal amount.

### §6.3 Complete Testate Legitime Fraction Table

**Notation**: E = collation-adjusted estate; n = LC lines; m = IC count; S = surviving spouse

#### Regime A — Descendants Present

| Code | Heirs Present | G1 Collective | Per LC | Spouse | Per IC | FP_gross | FP_disposable |
|---|---|---|---|---|---|---|---|
| **T1** | n LC | ½ | 1/(2n) | — | — | ½ | ½ |
| **T2** | 1 LC + S | ½ | ½ | ¼ (Art. 892¶1) | — | ½ | ¼ |
| **T3** | n≥2 LC + S | ½ | 1/(2n) | 1/(2n) (Art. 892¶2) | — | ½ | (n-1)/(2n) |
| **T4** | n LC + m IC | ½ | 1/(2n) | — | min(1/(4n), cap/m) | ½ | see cap |
| **T5** | n=1: 1LC+mIC+S | ½ | ½ | ¼ (Art. 892¶1) | min(¼, remaining_fp/m) | ½ | max(¼−m×IC,0) |
| **T5** | n≥2: nLC+mIC+S | ½ | 1/(2n) | 1/(2n) (Art. 897) | min(1/(4n),remaining_fp/m) | ½ | varies |

**T5 sub-type**: T5 is a single ScenarioCode. The n=1 vs n≥2 distinction is handled internally
using the T2 vs T3 spouse formula selection. The ScenarioCode enum has ONE `T5` variant.

#### Regime B — Ascendants Present, No Descendants

| Code | Heirs Present | G2 Collective | Spouse | IC Collective | FP_gross | FP_disposable |
|---|---|---|---|---|---|---|
| **T6** | Ascendants only | ½ | — | — | ½ | ½ |
| **T7** | Ascendants + S | ½ | ¼ (Art. 893) | — | ½ | ¼ |
| **T8** | Ascendants + m IC | ½ | — | ¼ flat (Art. 896) | ½ | ¼ |
| **T9** | Ascendants + m IC + S | ½ | ⅛ (Art. 899) | ¼ flat (Art. 899) | ½ | ⅛ |

**Regime B distinction**: IC gets a FLAT ¼ collective regardless of m. No Art. 895 cap.
Each IC = ¼ ÷ m.

#### Regime C — No Primary/Secondary Compulsory Heirs

| Code | Heirs Present | Spouse | IC Collective | FP_disposable |
|---|---|---|---|---|
| **T10** | m IC + S | ⅓ (Art. 894) | ⅓ (Art. 894) | ⅓ |
| **T11** | m IC only | — | ½ (Art. 901) | ½ |
| **T12** | S only (normal) | ½ (Art. 900) | — | ½ |
| **T12** | S only (articulo mortis) | ⅓ (Art. 900¶2) | — | ⅔ |
| **T13** | No compulsory heirs | — | — | 1 (entire estate) |

**Art. 900 ¶2 condition** for reduced spouse legitime: marriage in articulo mortis AND
decedent died within 3 months AND couple did NOT cohabit for 5+ years before marriage.
If `articulo_mortis=true` AND `cohabitation_years < 5` AND died within 3 months → spouse gets ⅓.

#### Special — Art. 903 Illegitimate Decedent

| Code | Condition | Parents | Spouse | FP_disposable |
|---|---|---|---|---|
| **T14** | Illegitimate decedent, parents only | ½ (Art. 903¶1) | — | ½ |
| **T15** | Illegitimate decedent, parents + S | ¼ (Art. 903¶2) | ¼ | ½ |

Prerequisite: `decedent.is_illegitimate=true` AND no descendants of any kind.

### §6.4 Art. 895 Cap Rule (Regime A only)

```rust
fn compute_ic_with_cap(
    estate: BigRational,
    n: u32,                      // LC lines
    m: u32,                      // IC count
    spouse_from_fp: BigRational, // 0 if no spouse
) -> (BigRational, BigRational) {  // (per_ic, fp_disposable)
    if m == 0 { return (BigRational::zero(), estate/2 - spouse_from_fp); }

    let fp_gross = estate.clone() / 2;
    let fp_after_spouse = fp_gross - spouse_from_fp.clone();

    let per_lc = estate.clone() / (2 * n as i64);
    let per_ic_uncapped = per_lc / 2;  // = estate / (4n)
    let total_ic_uncapped = per_ic_uncapped.clone() * m as i64;

    let total_ic_actual = total_ic_uncapped.min(fp_after_spouse.clone());
    let per_ic_actual = total_ic_actual.clone() / m as i64;

    let fp_disposable = fp_after_spouse - total_ic_actual;
    (per_ic_actual, fp_disposable)
}
```

**Cap threshold conditions**:
- T4 (no spouse): cap bites when m > 2n
- T5 with n=1: cap bites when m > 1
- T5 with n≥2: cap bites when m > 2(n−1)

### §6.5 Intestate Succession (no legitime concept)

In intestate succession, compulsory heir fractions from §6.3 do NOT apply. The full estate
is distributed per the intestate formulas in §7. The ratio IC:LC is 1:2 (Art. 895, applied
by analogy per jurisprudence) but there is no Art. 895 cap — the 1:2 ratio applies uncapped.

---

## §7 Distribution

### §7.1 Testate Distribution

In testate succession:
1. Compute all compulsory heirs' legitimes (§6.3 fractions × E_adj)
2. Determine FP_disposable
3. Apply will dispositions (institutions, devises, legacies) from FP_disposable
4. If FP_disposable < total will dispositions → inofficiousness reduction (§9.4)
5. Any undistributed FP goes to heirs proportionally or as specified in will

### §7.2 Intestate Distribution — All 15 Scenarios

#### 6-Class Priority Hierarchy

| Class | Heirs |
|---|---|
| 1 | Legitimate descendants (LC) |
| 2 | Legitimate ascendants (G2) |
| 3 | Illegitimate children (IC) |
| 4 | Surviving spouse |
| 5 | Collateral relatives |
| 6 | State (escheat) |

Higher class excludes lower except where Civil Code specifies concurrence.

#### I1–I4: Descendants Present

| Code | Heirs | Distribution |
|---|---|---|
| **I1** | n LC only | E ÷ n (equal shares) |
| **I2** | n LC + S | LC: 2/(2+1) each; S: 1 share = E/(n+1); ratio 2:1 (Art. 996) |
| **I3** | n LC + m IC | LC per capita, IC = ½ LC per capita (Art. 895 intestate — uncapped 2:1 ratio) |
| **I4** | n LC + m IC + S | LC:IC ratio 2:1; S gets = 1 LC share; all shares derived from unit-ratio E/(n + m×½ + 1) |

**I2 formula**: Spouse gets child's share = E/(n+1). Each LC = E/(n+1).

**I3/I4 unit-ratio formula**:
```
unit = E / (n×2 + m×1 + (1 if spouse else 0)×2)
LC_per = 2 × unit
IC_per = 1 × unit
Spouse = 2 × unit (if present)
```

#### I5–I6: Ascendants Present (No Descendants)

| Code | Heirs | Distribution |
|---|---|---|
| **I5** | Ascendants only | Art. 890 division among lines |
| **I6** | Ascendants + S | ½ each (Art. 1000) |

#### I7–I10: Cross-Class Concurrences

| Code | Heirs | Distribution |
|---|---|---|
| **I7** | m IC only | E ÷ m (Art. 988) |
| **I8** | m IC + S | IC: ½E; S: ½E (Art. 997) wait — Art. 998: IC ½, S ½ |
| **I9** | Ascendants + IC | ½ each group (Art. 994) |
| **I10** | Ascendants + IC + S | Ascendants ½; IC and S share the other ½ per Art. 895 ratio |

#### I11–I15: Spouse, Collaterals, Escheat

| Code | Heirs | Distribution |
|---|---|---|
| **I11** | S only | Full estate (Art. 995) |
| **I12** | S + siblings | S: ½; siblings: ½ equally (Art. 1001) |
| **I13** | Siblings only | Equal shares; full-blood sibling gets double half-blood (Art. 1006) |
| **I14** | Other collaterals | Nearest degree takes all; equal shares within same degree (Art. 1009) |
| **I15** | No heirs | State escheat (Art. 1011) |

### §7.3 Iron Curtain Rule (Art. 992)

An illegitimate child has no right to inherit AB INTESTATO from the legitimate children and
relatives of his/her father or mother. Conversely, such relatives cannot inherit ab intestato
from an illegitimate child.

Engine applies: `filter out IC from inheriting from LC's collateral relatives and vice versa`.

### §7.4 Collateral Distribution Sub-Algorithm (Art. 1006)

```rust
fn distribute_collateral(
    siblings: &[ClassifiedHeir],
    estate: BigRational,
) -> Vec<(HeirId, BigRational)> {
    // Full-blood sibling gets double the share of a half-blood sibling
    let full_count: i64 = siblings.iter().filter(|s| s.is_full_blood).count() as i64;
    let half_count: i64 = siblings.iter().filter(|s| !s.is_full_blood).count() as i64;
    let total_units = full_count * 2 + half_count;
    let unit = estate / total_units;
    siblings.iter().map(|s| {
        let share = unit.clone() * if s.is_full_blood { 2 } else { 1 };
        (s.input_ref.clone(), share)
    }).collect()
}
```

---

## §8 Collation (Arts. 1061–1077)

### §8.1 Collation Obligation (Art. 1061)

A compulsory heir who inherits with other compulsory heirs must bring to collation all
property or rights received by donation from the decedent. Four conditions ALL required:

1. Recipient is a compulsory heir
2. Donor is the decedent
3. Recipient survives/inherits with other compulsory heirs
4. Donation is not expressly exempted by donor AND heir has not renounced right to collate

### §8.2 Art. 1062 Exemptions

Two automatic exemptions from collation:
1. **Donor expressly exempted**: `donor_expressly_exempted = true`
2. **Heir renounced**: `heir_renounced = true` (heir receives the donation but waives collation rights)

**Override**: Even if exempted, inofficiousness reduction still applies if donation exceeds FP.

### §8.3 Collatability Matrix (14 categories)

| Category | Collatable? | Article |
|---|---|---|
| Cash gifts to compulsory heirs | Yes (default) | Art. 1061 |
| Real property | Yes | Art. 1061 |
| Business interests | Yes | Art. 1061 |
| Educational expenses (exceeding customary) | Yes | Art. 1068 |
| Educational expenses (customary) | No | Art. 1067(1) |
| Medical expenses | No | Art. 1067(2) |
| Funeral expenses | No | Art. 1067(3) |
| Apparel (customary) | No | Art. 1067(4) |
| Wedding gifts (≤ 1/10 FP_disposable) | No | Art. 1070 |
| Wedding gifts (> 1/10 FP_disposable) | Excess is collatable | Art. 1070 |
| Gambling debts paid by parent | Yes (Art. 1069) | Art. 1069 |
| Election expenses | Yes | Art. 1069 |
| Attorney fees paid by parent | Conditional (Art. 1068) | Art. 1068 |
| Donations to third parties (non-heir) | No collation; inofficiousness only | — |

### §8.4 Collation-Adjusted Estate (Art. 908)

```
E_adj = net_estate + Σ(collatable_donations)
```

E_adj is used for ALL legitime computations. The collated donations are credited back to the
donee heir at partition, reducing their estate share.

### §8.5 Valuation (Art. 1071)

Donations are valued at the **time of the donation** (historical value), not at death.
The engine uses `DonationInput.amount` as the collation value.

### §8.6 Imputation Order (Art. 909–910)

Donated amounts are charged first against the heir's legitime, then against the free portion:
1. Charge donation against heir's legitime amount
2. If donation > legitime, excess charged against FP
3. If donation > legitime + FP → inofficiousness (Art. 911 reduction)

### §8.7 Art. 911 Reduction Order (Inofficiousness)

When total will dispositions + collatable donations exceed estate:
1. **First reduce**: devises and legacies pro rata
2. **Then reduce**: institutions (testamentary gifts to compulsory heirs above legitime)
3. **Last reduce**: inter vivos donations in **reverse chronological order** (most recent first)

### §8.8 Art. 1064 Representation Collation

Grandchildren who inherit by representation must collate any donations their parent received
from the decedent, even if the parent predeceased and the property is no longer with the parent.

### §8.9 Two-Phase Pipeline Integration

- **Phase 1 (Step 5)**: Compute E_adj; determine which donations are collatable
- **Phase 2 (Step 9)**: Impute against heir shares at distribution

---

## §9 Testate Validation

### §9.1 Five Validation Problems

| Problem | Article | Effect |
|---|---|---|
| Preterition | Art. 854 | Annuls institutions; preterited heir gets full legitime |
| Invalid disinheritance | Arts. 918, 921 | Treated as no disinheritance; heir keeps share |
| Inofficiousness | Arts. 909–911 | Reduce excess dispositions |
| Underprovision | Art. 906 | Engine tops up heir to legitime |
| Condition stripping | Art. 872 | Conditions on legitime portions voided |

### §9.2 Preterition (Art. 854)

**Definition**: Complete omission of a compulsory heir in the direct line (G1 or G2) from
the will — neither given their legitime nor expressly disinherited.

**Scope**: G1 (children) and G2 (parents/ascendants) only. NOT the spouse (omitted spouse
claim is via underprovision, not preterition).

**Detection**:
```rust
fn is_preterited(heir: &ClassifiedHeir, will: &WillInput) -> bool {
    // Must be eligible compulsory heir in G1 or G2
    if !heir.is_eligible { return false; }
    if !matches!(heir.effective_group, Some("G1") | Some("G2")) { return false; }
    // Not mentioned at all in will (no institution, no express disinheritance)
    let in_institutions = will.institutions.iter().any(|i| i.heir_id == heir.input_ref);
    let in_disinheritances = will_disinheritances.iter().any(|d| d.heir_id == heir.input_ref);
    !in_institutions && !in_disinheritances
}
```

**Effect** (Art. 854):
- If ONLY ONE heir preterited: annuls institutions only (devises/legacies stand)
- If ALL G1 heirs preterited: annuls ALL testamentary dispositions → full intestate
- Pipeline: emit `RestartTrigger::PreteritionAnnulment` → restart to step 3

### §9.3 Disinheritance (Arts. 915–923)

**Valid disinheritance requirements** (Art. 916):
1. Made in a valid will
2. For a cause recognized by law (one of the 22 grounds)
3. Cause stated in the will
4. Cause must be certain and true (`cause_proven = true`)
5. Heir not reconciled (`reconciled = false`)

**Invalid disinheritance** (Art. 918): if ANY requirement fails, treated as if no
disinheritance. Heir retains full share. Emit `ValidationWarning::InvalidDisinheritance`.

**BUG-001 fix — Multiple simultaneous disinheritances** (v2 correct algorithm):

```
Phase 1: validate all DisinheritanceRecord entries; partition into valid/invalid
Phase 2: BATCH apply all valid disinheritances — exclude ALL at once
Phase 3: BATCH add representatives for ALL excluded heirs simultaneously
Phase 4: recompute ScenarioCode ONCE from the new heir set
Phase 5: emit single RestartTrigger::ValidDisinheritance{heir_ids: all_ids}
```

v1 BUG: processed one disinheritance at a time in a loop, causing wrong scenario
recompute after each iteration and incorrect representative assignment.

**Cascading disinheritance**: If disinherited heir's child is also disinherited,
`find_representatives_recursive()` skips them and finds the next living descendant.

**Spousal disinheritance**: No Art. 923 representation cascade for spouse. Spouse's share
goes to free portion or co-heirs (no children of spouse represent the spouse).

### §9.4 Inofficiousness (Arts. 909–911)

A disposition is inofficious when it impairs a compulsory heir's legitime.

**Detection**: After computing legitimes and will dispositions, check:
```
if will_dispositions_total + collatable_donations_total > FP_gross:
    inofficiousness exists
```

**Reduction order** (Art. 911):
1. Devises/legacies — pro rata among all devises and legacies
2. Institutions above legitime — pro rata
3. Inter vivos donations — reverse chronological (latest first)

### §9.5 Underprovision

When a will institution gives a compulsory heir less than their legitime, the engine
automatically tops up the heir to their full legitime amount. The deficiency comes from
the free portion. Emit `ValidationWarning::LegitimeUnderprovision`.

### §9.6 Condition Stripping (Art. 872)

Conditions imposed on a compulsory heir's legitime share are void. The heir receives the
legitime unconditionally. The condition may be valid for the free portion part of their share.

**Art. 871 exception**: A condition imposed in contemplation of or on account of marriage is
valid even in the legitime context.

---

## §10 Vacancy Resolution (Arts. 1015–1023)

### §10.1 Four-Step Priority Chain

When an heir cannot or will not inherit (vacancy), the vacant share is resolved in order:

1. **Substitution** (Arts. 857–870): if the will designates a substitute
2. **Representation** (Arts. 970–977): if triggers apply (predecease, disinheritance, incapacity)
3. **Accretion** (Arts. 1015–1023): if co-heirs exist in the same disposition
4. **Intestate fallback** (Art. 960): if none of the above apply

### §10.2 Art. 1021 Critical Distinction

**¶1 — Vacant free portion share**: True accretion. Accretes pro indiviso to co-beneficiaries
in the same testamentary disposition (Arts. 1016–1017). Does NOT trigger pipeline restart.

**¶2 — Vacant legitime share**: Does NOT accrete automatically. Instead:
- The engine must recompute the ScenarioCode with the vacant heir excluded
- Remaining heirs' legitimes are recalculated under the new scenario
- This RESTARTS the pipeline to step 4 (`RestartTrigger::LegitimeVacancy`)

### §10.3 Testate Accretion Requirements (Art. 1016)

For accretion to occur in a testate disposition:
1. Two or more persons called to the same inheritance or portion
2. One of them does not want to or cannot accept their share
3. No express designation of a substitute
4. No representation applies

**Art. 1017**: "Equal shares" language does NOT prevent accretion. Accretion occurs even when
the will uses "equally" or "in equal parts."

### §10.4 Intestate Accretion (Art. 1018)

In intestate succession, if an heir repudiates, their share goes to co-heirs of the same
degree proportionally. If no co-heirs in same degree, passes to next degree.

### §10.5 Vacancy Causes and Resolution Matrix

| VacancyCause | Representation? | Accretion? | Art. 1021 ¶2? |
|---|---|---|---|
| Predecease | Yes (if has children) | If no reps | If legitime |
| Incapacity | Yes | If no reps | If legitime |
| Renunciation | NO (Art. 977) | Yes | If legitime |
| DisinheritanceInvalid | No (heir keeps share) | N/A | N/A |
| ConditionFailed | No | Yes (FP portion) | If legitime |
| LegitimacyVacancy | No | No — RESTART | Always |

---

## §11 Narrative Templates

The engine generates plain-English explanations for each heir's allocation. These are
pre-computed strings stored in `HeirDistribution.partition_notes` or the computation log.

### §11.1 Per-Heir Narrative Format

```
{heir_name} is a {heir_type_label} and is entitled to {narrative_share}.
Legal basis: {article_citations}.
{collation_note} {representation_note} {exclusion_note}
```

### §11.2 Standard Templates

| Scenario | Template |
|---|---|
| LC, T1 | "{name} receives ₱{amount} (1/{n} of the estate's ½ compulsory share). [Art. 888]" |
| LC + spouse, T2 | "{name} receives ₱{amount} (½ of estate as sole legitimate child, equal to spouse's share). [Arts. 888, 892]" |
| IC with cap | "{name} receives ₱{amount} (reduced by Art. 895 cap; uncapped amount was ₱{uncapped}). [Art. 895]" |
| Excluded heir | "{name} is excluded from the estate. Reason: {exclusion_reason_label}. [Art. {article}]" |
| Representative | "{name} inherits by right of representation for {represented_name} who {trigger_description}. Per stirpes share: {fraction} of {represented_name}'s position. [Art. 970]" |
| Collation | "{name}'s estate share of ₱{estate_share} is reduced from ₱{gross_share} because they received a donation of ₱{donation_amount} charged to their legitime. [Art. 1061]" |
| Disinheritance | "{name} was validly disinherited under Art. {ground_article} and receives nothing from the estate. [Art. 916]" |
| Preterition | "{name} was preterited (completely omitted from the will). All testamentary institutions are annulled; {name} receives their full legitime of ₱{legitime}. [Art. 854]" |

### §11.3 Article Citation Labels

| ExclusionReason | Label | Article |
|---|---|---|
| ValidDisinheritance | "validly disinherited" | Art. 916 |
| Predeceased | "predeceased the decedent" | Art. 970 |
| Renunciation | "renounced their inheritance" | Art. 1006 |
| IronCurtain | "barred by the Iron Curtain Rule" | Art. 992 |
| Incapacity | "found incapable of inheriting" | Art. 1032 |
| NotCalled | "not called to this succession" | — |

---

## §12 Rounding — Hare-Niemeyer

All intermediate computation uses `num_rational::BigRational` (exact arithmetic).
Only the final output converts to `i64` centavos using the Hare-Niemeyer method.

```rust
fn hare_niemeyer(
    shares: &[(HeirId, BigRational)],
    total_centavos: i64,
) -> Vec<(HeirId, i64)> {
    // Step 1: Floor each rational share to integer centavos
    let floors: Vec<(HeirId, i64, BigRational)> = shares.iter().map(|(id, r)| {
        let floor = r.floor().to_integer().to_i64().unwrap();
        let remainder = r - BigRational::from_integer(floor.into());
        (id.clone(), floor, remainder)
    }).collect();

    // Step 2: deficit = total - sum(floors), always in [0, n)
    let deficit = total_centavos - floors.iter().map(|(_,f,_)| f).sum::<i64>();

    // Step 3: Sort by fractional remainder descending
    let mut sorted = floors.clone();
    sorted.sort_by(|a, b| b.2.cmp(&a.2));

    // Step 4: Assign +1 bonus to top `deficit` heirs by remainder
    let result: HashMap<String,i64> = sorted.iter().enumerate()
        .map(|(i,(id,f,_))| (id.clone(), f + if (i as i64) < deficit { 1 } else { 0 }))
        .collect();

    // Step 5: Reconstruct in original order + emit RoundingAdjustment records
    shares.iter().map(|(id,_)| (id.clone(), result[id])).collect()
}
```

**Properties**:
- Sum of results always equals `total_centavos` exactly (INV-1)
- Each heir's result is either `floor(rational)` or `floor(rational) + 1`
- The heir with the largest fractional remainder gets the bonus centavo
- Ties broken by position in the sorted order (stable sort within same remainder)

**Cargo.toml dependency**: `num-rational = { version = "0.4", features = ["bigint"] }`

---

## §13 Bridge Contract

### §13.1 WASM Export Signature

```rust
// src/wasm.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn compute_json(input: &str) -> Result<String, JsValue> {
    console_error_panic_hook::set_once();

    let result = std::panic::catch_unwind(|| inner_compute(input));

    match result {
        Ok(Ok(json)) => Ok(json),
        Ok(Err(err)) => {
            let err_json = serde_json::to_string(&err).unwrap_or_else(|_|
                r#"{"error_type":"ArithmeticError","message":"Failed to serialize error"}"#
                .to_string());
            Err(JsValue::from_str(&err_json))
        }
        Err(panic_payload) => {
            let msg = panic_payload.downcast_ref::<String>().cloned()
                .or_else(|| panic_payload.downcast_ref::<&str>().map(|s| s.to_string()))
                .unwrap_or_else(|| "Unknown panic".to_string());
            let err_json = serde_json::to_string(&ComputationError::PanicRecovered { message: msg })
                .unwrap_or_else(|_|
                    r#"{"error_type":"PanicRecovered","message":"Unknown panic"}"#.to_string());
            Err(JsValue::from_str(&err_json))
        }
    }
}
```

**Build command**: `wasm-pack build --target web --out-dir pkg`

**Cargo.toml** (required sections):
```toml
[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
num-rational = { version = "0.4", features = ["bigint"] }
num-traits = "0.2"
console_error_panic_hook = "0.1"

[profile.release]
opt-level = "z"
lto = true
```

### §13.2 JSON Wire Format

**Top-level rules**:
- Struct fields: `snake_case` JSON keys
- Enum variants: `PascalCase` JSON strings
- Input types: `deny_unknown_fields` (any unknown key → `InputValidation` error)
- Output types: NO `deny_unknown_fields` (forward-compatible)
- `Option<T>` fields: always `null`, NEVER absent (do NOT use `skip_serializing_if`)

**Primitive rules**:

| Type | Input | Output |
|---|---|---|
| Money.centavos | number OR string `"12345"` | number only |
| bool | `true`/`false` only | `true`/`false` |
| Date | ISO-8601 `"YYYY-MM-DD"` | ISO-8601 `"YYYY-MM-DD"` |
| Fraction | `"numer/denom"` string | `"numer/denom"` reduced form |
| Option\<T\> | `null` or value | `null` or value |
| u32/i64 | JSON number (no decimal) | JSON number |

**Implementation note for null serialization**:
```rust
// DO NOT add this attribute — it causes key absence instead of null:
// #[serde(skip_serializing_if = "Option::is_none")]

// DO add this to allow absent keys on input to deserialize as None:
#[serde(default)]
pub my_field: Option<SomeType>,
```

**Tagged enum wire formats** (see §3.6 for shapes):
- `PreteritionEffect`: `#[serde(tag = "type")]`
- `ValidationWarning`: `#[serde(tag = "code", content = "data")]`
- `ManualReviewFlag`: `#[serde(tag = "flag")]`
- `ComputationError`: `#[serde(tag = "error_type")]`

### §13.3 Error Contract

**5 error variants** (all serialize as JSON via `#[serde(tag = "error_type")]`):

| Variant | `error_type` | Actionable? | When |
|---|---|---|---|
| `InputValidation` | `"InputValidation"` | Yes — fix input | JSON parse / unknown field / wrong type |
| `DomainValidation` | `"DomainValidation"` | Yes — fix heir data | Logic check before pipeline |
| `MaxRestartsExceeded` | `"MaxRestartsExceeded"` | Contact support | Restart guard (>10 restarts) |
| `ArithmeticError` | `"ArithmeticError"` | Contact support | Output serialization failure |
| `PanicRecovered` | `"PanicRecovered"` | Contact support | Unexpected panic |

**Example error JSON**:
```json
{ "error_type": "InputValidation", "message": "unknown field `foo`", "field_path": "foo" }
{ "error_type": "DomainValidation", "message": "Heir h1 not found", "related_heir_ids": ["h1"] }
{ "error_type": "MaxRestartsExceeded", "restart_count": 11, "last_step": "step7_validate_testate" }
```

**Frontend TypeScript usage**:
```typescript
function callEngine(input: ComputationInput): ComputationOutput {
    ensureWasmInitialized();
    const inputJson = JSON.stringify(input);
    try {
        const resultJson = compute_json(inputJson);
        return ComputeOutputSchema.parse(JSON.parse(resultJson));
    } catch (e: unknown) {
        if (e instanceof Error) {
            const err: ComputationError = ComputeErrorSchema.parse(JSON.parse(e.message));
            throw new EngineError(err);
        }
        throw e;
    }
}
```

### §13.4 WASM Initialization

**wasm-pack output structure** (`--target web --out-dir pkg`):
```
pkg/
  inheritance_engine.js          # ES module glue
  inheritance_engine_bg.wasm     # Compiled binary
  inheritance_engine.d.ts        # TypeScript declarations
  inheritance_engine_bg.d.ts
  package.json
```

**Import**:
```typescript
import initAsync, { compute_json, initSync } from "./pkg/inheritance_engine";
```

**Dual-path initialization** (bridge.ts):
```typescript
let _initPromise: Promise<void> | null = null;

async function ensureWasmInitialized(): Promise<void> {
    if (_initPromise) return _initPromise;
    _initPromise = (async () => {
        if (typeof process !== "undefined" && process.versions?.node) {
            // Node.js / vitest
            const { readFileSync } = await import("node:fs");
            const { resolve, dirname } = await import("node:path");
            const { fileURLToPath } = await import("node:url");
            const __dirname = dirname(fileURLToPath(import.meta.url));
            const wasmPath = resolve(__dirname, "pkg/inheritance_engine_bg.wasm");
            const wasmBytes = readFileSync(wasmPath);
            initSync({ module: wasmBytes });
        } else {
            // Browser
            await initAsync();
        }
    })();
    return _initPromise;
}
```

**Environment detection**: `typeof process !== "undefined" && process.versions?.node`

**Vite config** (browser bundle):
```typescript
// vite.config.ts
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
    plugins: [react(), wasm(), topLevelAwait()],
});
```

**Vitest config** (Node.js tests — intentionally NO wasm plugin):
```typescript
// vitest.config.ts
export default defineConfig({
    test: { environment: "node" },
    // No wasm plugin — Node.js handles .wasm via fs.readFileSync
});
```

---

## §14 TypeScript Types

Every Rust struct maps to a TypeScript interface; every Rust enum maps to a string literal
union. Field names are identical to JSON keys (snake_case). Enum literal values are identical
to JSON values (PascalCase).

**Mapping rules**:
| Rust | TypeScript |
|---|---|
| `struct` | `interface` |
| `enum` (plain) | `type` = string literal union |
| `enum` (tagged) | discriminated union |
| `i64` / `u32` | `number` |
| `bool` | `boolean` |
| `String` | `string` |
| `Option<T>` | `T \| null` (NEVER `undefined`) |
| `Vec<T>` | `T[]` |
| Fraction string | `string` (alias `FractionString`) |
| Date string | `string` (alias `DateString`) |

### §14.1 Type Aliases

```typescript
export type HeirId       = string;
export type DonationId   = string;
export type DispositionId= string;
export type DeviseId     = string;
export type LegacyId     = string;
export type ConditionId  = string;
export type DateString   = string;   // "YYYY-MM-DD"
export type FractionString = string; // "numer/denom"
```

### §14.2 Input Enum Types

```typescript
export type HeirType =
  | "LegitimateChild" | "LegitimatedChild" | "AdoptedChild"
  | "IllegitimateChild" | "LegitimateAscendant" | "Spouse"
  | "Sibling" | "NieceNephew" | "OtherCollateral";

export type LegalSeparationStatus =
  | "NotApplicable" | "InnocentSpouse" | "GuiltySpouse";

export type DisinheritanceGround =
  | "Art919_1" | "Art919_2" | "Art919_3" | "Art919_4"
  | "Art919_5" | "Art919_6" | "Art919_7" | "Art919_8"
  | "Art920_1" | "Art920_2" | "Art920_3" | "Art920_4"
  | "Art920_5" | "Art920_6" | "Art920_7" | "Art920_8"
  | "Art921_1" | "Art921_2" | "Art921_3" | "Art921_4"
  | "Art921_5" | "Art921_6";

export type SubstitutionType = "Simple" | "Fideicommissary" | "Reciprocal";
```

### §14.3 Output Enum Types

```typescript
export type SuccessionType = "Testate" | "Intestate" | "Mixed";

export type ScenarioCode =
  | "T1"  | "T2"  | "T3"  | "T4"  | "T5"
  | "T6"  | "T7"  | "T8"  | "T9"  | "T10"
  | "T11" | "T12" | "T13" | "T14" | "T15"
  | "I1"  | "I2"  | "I3"  | "I4"  | "I5"
  | "I6"  | "I7"  | "I8"  | "I9"  | "I10"
  | "I11" | "I12" | "I13" | "I14" | "I15";

export type ExclusionReason =
  | "Predeceased" | "Incapacity" | "Unworthiness" | "Renunciation"
  | "IronCurtain" | "NotCalled" | "ValidDisinheritance" | "InvalidDisinheritance";

export type RepresentationTrigger =
  | "Predecease" | "Disinheritance" | "Incapacity" | "Art902IllegitimateLine";

export type VacancyCause =
  | "Predecease" | "Incapacity" | "Renunciation" | "DisinheritanceInvalid"
  | "ConditionFailed" | "LegitimacyVacancy";

export type ResolutionMethod =
  | "Substitution" | "Representation" | "Accretion" | "IntestateFallback" | "Escheat";

export type ShareSource = "Legitime" | "FreePortion" | "Intestate" | "Collateral";
```

### §14.4 Money Types

```typescript
// Input: centavos accepts number OR string
export interface InputMoney { centavos: number | string; }

// Output: centavos is always number
export interface OutputMoney { centavos: number; }
```

### §14.5 Input Interfaces

```typescript
export interface ComputationInput {
  decedent:  DecedentInput;
  estate:    EstateInput;
  heirs:     HeirInput[];
  will:      WillInput | null;
  donations: DonationInput[] | null;
}

export interface DecedentInput {
  name:                      string;
  date_of_death:             DateString | null;
  has_will:                  boolean;
  has_legitimate_children:   boolean;
  has_illegitimate_children: boolean;
  legal_separation_status:   LegalSeparationStatus;
  domicile:                  string | null;
  nationality:               string | null;
  is_illegitimate:           boolean;
  articulo_mortis:           boolean;
  cohabitation_years:        number;
}

export interface EstateInput {
  net_estate:   InputMoney;
  gross_estate: InputMoney | null;
  obligations:  InputMoney | null;
  description:  string | null;
}

export interface HeirInput {
  id:                       HeirId;
  name:                     string;
  heir_type:                HeirType;
  is_alive:                 boolean;
  is_adopted:               boolean;
  adoption_rescinded:       boolean;
  adoption_date:            DateString | null;
  adoption_rescission_date: DateString | null;
  cause_proven:             boolean;
  reconciled:               boolean;
  date_of_birth:            DateString | null;
  date_of_death:            DateString | null;
  degree:                   number | null;
  legal_separation_status:  LegalSeparationStatus;
  disinheritances:          DisinheritanceRecord[];
  substitutions:            SubstitutionInput[];
  children:                 HeirInput[];        // recursive
  donations_received:       DonationId[];
}

export interface DisinheritanceRecord {
  id:           DispositionId;
  heir_id:      HeirId;
  ground:       DisinheritanceGround;
  cause_proven: boolean;
  reconciled:   boolean;
  note:         string | null;
}

export interface WillInput {
  id:            DispositionId;
  date_executed: DateString | null;
  institutions:  InstitutionInput[];
  devises:       DeviseInput[];
  legacies:      LegacyInput[];
  substitutions: SubstitutionInput[];
}

export interface InstitutionInput {
  id:              DispositionId;
  heir_id:         HeirId;
  fraction:        FractionString | null;
  amount_centavos: number | null;
  description:     string | null;
}

export interface DeviseInput {
  id:                  DeviseId;
  description:         string;
  value:               InputMoney;
  beneficiary_heir_id: HeirId | null;
  conditions:          ConditionInput[];
}

export interface LegacyInput {
  id:                  LegacyId;
  description:         string;
  value:               InputMoney;
  beneficiary_heir_id: HeirId | null;
  conditions:          ConditionInput[];
}

export interface SubstitutionInput {
  id:                 DispositionId;
  primary_heir_id:    HeirId;
  substitute_heir_id: HeirId;
  substitution_type:  SubstitutionType;
  conditions:         ConditionInput[];
}

export interface ConditionInput {
  id:          ConditionId;
  description: string;
}

export interface DonationInput {
  id:                  DonationId;
  donor_id:            string | null;
  recipient_heir_id:   HeirId | null;
  amount:              InputMoney;
  date:                DateString | null;
  is_collatable:       boolean;
  donor_expressly_exempted: boolean;
  heir_renounced:      boolean;
  type:                string;
  description:         string | null;
  professional_expense_imputed_savings_centavos: number | null;
}
```

### §14.6 Output Interfaces

```typescript
export interface ComputationOutput {
  scenario_code:            ScenarioCode;
  succession_type:          SuccessionType;
  net_distributable_estate: OutputMoney;
  adjusted_estate:          OutputMoney;
  free_portion_gross:       OutputMoney;
  free_portion_disposable:  OutputMoney;
  distributions:            HeirDistribution[];
  rounding_adjustments:     RoundingAdjustment[];
  warnings:                 ValidationWarning[];
  manual_review_flags:      ManualReviewFlag[];
  testate_validation:       TestateValidationResult | null;
  collation:                CollationResult | null;
  vacancy_resolutions:      VacancyResolution[];
  computation_log:          ComputationLogEntry[];
}

export interface HeirDistribution {
  heir_id:               HeirId;
  heir_name:             string;
  heir_type:             HeirType;
  effective_group:       string | null;   // "G1".."G4" or null
  is_excluded:           boolean;
  exclusion_reason:      ExclusionReason | null;
  legitime_centavos:     number;
  free_portion_centavos: number;
  total_centavos:        number;
  share_source:          ShareSource;
  per_stirpes_fraction:  FractionString | null;
  representation:        RepresentationChain | null;
  per_heir_fraction:     FractionString | null;
  partition_notes:       string | null;
  collation_credit_centavos:   number;
  total_entitlement_centavos:  number;
  is_compulsory_heir:    boolean;
  legitime_floor_centavos: number;
}

export interface RoundingAdjustment {
  heir_id:              HeirId;
  adjustment_centavos:  number;
  reason:               string;
  fractional_remainder: FractionString;
}

export interface RepresentationChain {
  representing_heir_id: HeirId;
  represented_heir_id:  HeirId;
  trigger:              RepresentationTrigger;
  depth:                number;
}

export interface ComputationLogEntry {
  step:    number;
  label:   string;
  message: string;
  data:    unknown | null;
}
```

### §14.7 Tagged Union Output Types

```typescript
// PreteritionEffect — tag field: "type"
export type PreteritionEffect =
  | { type: "AnnulsAll" }
  | { type: "AnnulsInstitutions"; affected_institution_ids: DispositionId[] };

// ValidationWarning — tag field: "code", data field: "data"
export type ValidationWarning =
  | { code: "CollationDebt";          data: { heir_id: HeirId; excess_centavos: number } }
  | { code: "InvalidDisinheritance";  data: { heir_id: HeirId; reason: string } }
  | { code: "ManualReviewRequired";   data: { flag: string } }
  | { code: "LegitimeUnderprovision"; data: { heir_id: HeirId; deficit_centavos: number } }
  | { code: "InofficiousDonation";    data: { donation_id: DonationId; reduction_centavos: number } }
  | { code: "ArticuloMortisSpouse";   data: { spouse_legitime_reduced: boolean } }
  | { code: "IronCurtainApplied";     data: { blocked_heir_id: HeirId } }
  | { code: "ReconciliationNullified";data: { disinheritance_id: DispositionId } }
  | { code: "SubstitutionActivated";  data: { primary_heir_id: HeirId; substitute_heir_id: HeirId } }
  | { code: "EscheatLikely";          data: null };

// ManualReviewFlag — tag field: "flag"
export type ManualReviewFlag =
  | { flag: "AllGrandparentsExcluded" }
  | { flag: "CollateralDegreeAmbiguous";    degree: number }
  | { flag: "FiliationDisputed";            heir_id: HeirId }
  | { flag: "AdoptionDocumentsMissing";     heir_id: HeirId }
  | { flag: "WillFormInvalid" }
  | { flag: "Art903AmbiguousParentage" }
  | { flag: "AllG1DisinheritedNoReps" };

// ComputationError — tag field: "error_type"
export type ComputationError =
  | { error_type: "InputValidation";    message: string; field_path: string | null }
  | { error_type: "DomainValidation";   message: string; related_heir_ids: string[] }
  | { error_type: "MaxRestartsExceeded";restart_count: number; last_step: string }
  | { error_type: "ArithmeticError";    message: string }
  | { error_type: "PanicRecovered";     message: string };

// ComputeResult — top-level result type
export type ComputeResult =
  | { ok: true;  value: ComputationOutput }
  | { ok: false; error: ComputationError };
```

---

## §15 Zod Schemas

**Global rules**:
- Input schemas: `.strict()` (mirrors `deny_unknown_fields`)
- Output schemas: no `.strict()` (forward-compatible)
- `Option<T>` → `z.nullable(T_schema)` (NOT `z.optional()`)
- Booleans: `z.boolean()` (NOT `z.coerce.boolean()`)
- Numbers: `z.number()` (NOT `z.coerce.number()`)
- Enums: `z.enum([...])` with exact PascalCase values

### §15.1 Primitive Schemas

```typescript
import { z } from "zod";

export const DateStringSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/, "Must be ISO-8601 date (YYYY-MM-DD)"
);

export const FractionStringSchema = z.string().regex(
  /^-?\d+\/[1-9]\d*$/, 'Must be "numer/denom" with positive denominator'
);

export const IdSchema = z.string().min(1).max(64);

export const InputMoneySchema = z.object({
  centavos: z.union([
    z.number().int(),
    z.string().regex(/^-?\d+$/, "centavos string must be integer"),
  ]),
}).strict();

export const OutputMoneySchema = z.object({ centavos: z.number().int() });
```

### §15.2 Input Enum Schemas

```typescript
export const HeirTypeSchema = z.enum([
  "LegitimateChild", "LegitimatedChild", "AdoptedChild", "IllegitimateChild",
  "LegitimateAscendant", "Spouse", "Sibling", "NieceNephew", "OtherCollateral",
]);

export const LegalSeparationStatusSchema = z.enum([
  "NotApplicable", "InnocentSpouse", "GuiltySpouse",
]);

export const DisinheritanceGroundSchema = z.enum([
  "Art919_1","Art919_2","Art919_3","Art919_4","Art919_5","Art919_6","Art919_7","Art919_8",
  "Art920_1","Art920_2","Art920_3","Art920_4","Art920_5","Art920_6","Art920_7","Art920_8",
  "Art921_1","Art921_2","Art921_3","Art921_4","Art921_5","Art921_6",
]);

export const SubstitutionTypeSchema = z.enum(["Simple","Fideicommissary","Reciprocal"]);
```

### §15.3 Output Enum Schemas

```typescript
export const SuccessionTypeSchema = z.enum(["Testate","Intestate","Mixed"]);

export const ScenarioCodeSchema = z.enum([
  "T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12","T13","T14","T15",
  "I1","I2","I3","I4","I5","I6","I7","I8","I9","I10","I11","I12","I13","I14","I15",
]);

export const ExclusionReasonSchema = z.enum([
  "Predeceased","Incapacity","Unworthiness","Renunciation",
  "IronCurtain","NotCalled","ValidDisinheritance","InvalidDisinheritance",
]);

export const RepresentationTriggerSchema = z.enum([
  "Predecease","Disinheritance","Incapacity","Art902IllegitimateLine",
]);

export const ShareSourceSchema = z.enum([
  "Legitime","FreePortion","Intestate","Collateral",
]);
```

### §15.4 Input Struct Schemas

```typescript
// Recursive HeirInput requires z.lazy()
type HeirInputType = z.infer<typeof HeirInputSchemaBase> & { children: HeirInputType[] };
const HeirInputSchemaBase = z.object({
  id:                       IdSchema,
  name:                     z.string().min(1),
  heir_type:                HeirTypeSchema,
  is_alive:                 z.boolean(),
  is_adopted:               z.boolean(),
  adoption_rescinded:       z.boolean(),
  adoption_date:            DateStringSchema.nullable(),
  adoption_rescission_date: DateStringSchema.nullable(),
  cause_proven:             z.boolean(),
  reconciled:               z.boolean(),
  date_of_birth:            DateStringSchema.nullable(),
  date_of_death:            DateStringSchema.nullable(),
  degree:                   z.number().int().min(2).max(5).nullable(),
  legal_separation_status:  LegalSeparationStatusSchema,
  disinheritances:          z.array(DisinheritanceRecordSchema),
  substitutions:            z.array(SubstitutionInputSchema),
  donations_received:       z.array(IdSchema),
}).strict();

export const HeirInputSchema: z.ZodType<HeirInputType> = HeirInputSchemaBase.extend({
  children: z.lazy(() => z.array(HeirInputSchema)),
}).strict();

export const ComputationInputSchema = z.object({
  decedent:  DecedentInputSchema,
  estate:    EstateInputSchema,
  heirs:     z.array(HeirInputSchema),
  will:      WillInputSchema.nullable(),
  donations: z.array(DonationInputSchema).nullable(),
}).strict();
```

### §15.5 Tagged Union Schemas

```typescript
export const ValidationWarningSchema = z.discriminatedUnion("code", [
  z.object({ code: z.literal("CollationDebt"),
    data: z.object({ heir_id: IdSchema, excess_centavos: z.number().int() }) }),
  z.object({ code: z.literal("InvalidDisinheritance"),
    data: z.object({ heir_id: IdSchema, reason: z.string() }) }),
  z.object({ code: z.literal("LegitimeUnderprovision"),
    data: z.object({ heir_id: IdSchema, deficit_centavos: z.number().int() }) }),
  z.object({ code: z.literal("EscheatLikely"), data: z.null() }),
  // ... (all 10 variants)
]);

export const ComputationErrorSchema = z.discriminatedUnion("error_type", [
  z.object({ error_type: z.literal("InputValidation"),
    message: z.string(), field_path: z.string().nullable() }),
  z.object({ error_type: z.literal("DomainValidation"),
    message: z.string(), related_heir_ids: z.array(z.string()) }),
  z.object({ error_type: z.literal("MaxRestartsExceeded"),
    restart_count: z.number().int(), last_step: z.string() }),
  z.object({ error_type: z.literal("ArithmeticError"), message: z.string() }),
  z.object({ error_type: z.literal("PanicRecovered"), message: z.string() }),
]);
```

### §15.6 File Layout

```
src/
  schemas/
    index.ts          — re-exports all schemas
    primitives.ts     — DateStringSchema, FractionStringSchema, InputMoneySchema, OutputMoneySchema
    enums.ts          — all enum schemas (input + output)
    input.ts          — all input struct schemas
    output.ts         — all output struct schemas
    errors.ts         — ComputationErrorSchema, ValidationWarningSchema, ManualReviewFlagSchema
```

### §15.7 Inferred Type Aliases

```typescript
// Use z.infer<> to derive types from schemas (preferred over manual interfaces)
export type ComputationInputFromSchema  = z.infer<typeof ComputationInputSchema>;
export type ComputationOutputFromSchema = z.infer<typeof ComputationOutputSchema>;
export type ComputationErrorFromSchema  = z.infer<typeof ComputationErrorSchema>;
```

**Zod validation error messages** (for UX):

| Field | Message |
|---|---|
| `estate.net_estate.centavos` | "Estate value must be a non-negative integer (centavos)" |
| `decedent.name` | "Name is required" |
| `decedent.date_of_death` | "Date of death must be YYYY-MM-DD format" |
| `heirs[*].heir_type` | "Invalid heir type" |
| `heirs[*].disinheritances[*].ground` | "Invalid disinheritance ground" |
| `will.institutions[*].fraction` | "Fraction must be 'numer/denom' format" |
| boolean fields | "Must be true or false" |
| enum fields | "Invalid value — must be one of: {variants}" |

---
## §16 Frontend Architecture

### §16.1 Wizard Steps (6 steps, 1 conditional)

#### Step Sequence and Visibility

```
Step 1: Estate      → EstateInput + hasWill UI flag   (always shown)
Step 2: Decedent    → DecedentInput                   (always shown)
Step 3: Family Tree → HeirInput[]                     (always shown)
Step 4: Will        → WillInput           (CONDITIONAL: shown only when hasWill=true)
Step 5: Donations   → DonationInput[]                 (always shown)
Step 6: Review      → summary + compute button        (always shown)
```

Navigation: forward validates; back always allowed. Step count shows 5 or 6 based on `hasWill`.

#### Step 1: Estate

**Purpose**: Capture net hereditary estate value; establish hasWill flag.

| UI Label | Maps To | Type | Notes |
|---|---|---|---|
| Net Estate Value (₱) | `estate.net_estate.centavos` | MoneyInput → centavos | Required; ≥ 0 |
| Estate Description | `estate.description` | textarea | Optional; max 500 chars |
| Decedent had a will? | `hasWill` (UI state only) | Toggle Yes/No | Drives step 4 visibility |

UI note: Large MoneyInput at top; "Has Will" as prominent Yes/No toggle (not checkbox).
Legal note shown: "Net estate = gross estate minus funeral expenses, debts, and charges already deducted."

#### Step 2: Decedent

**Purpose**: Identify decedent; capture flags affecting applicable Civil Code articles.

| UI Label | Maps To | Conditional Visibility |
|---|---|---|
| Full Name | `decedent.name` | Always |
| Date of Death | `decedent.date_of_death` | Always |
| Decedent was illegitimate | `decedent.is_illegitimate` | Always |
| Marriage in articulo mortis | `decedent.articulo_mortis` | Always |
| Years of cohabitation | `decedent.cohabitation_years` | Only when `articulo_mortis=true` |
| Legal separation status | `decedent.legal_separation_status` | Always |

`cohabitation_years` helper text: "If couple cohabited 5+ years before articulo mortis marriage, spouse retains full ½ legitime."

#### Step 3: Family Tree

**Purpose**: Build `HeirInput[]` — add/edit/remove heirs. Most complex step.

Rendered as a list of expandable heir cards. "Add Heir" button opens a drawer/panel.

**Heir form conditional fields**:

| Field | Shown When |
|---|---|
| `adoption_date` | `is_adopted = true` |
| `adoption_rescission_date` | `is_adopted = true` AND `adoption_rescinded = true` |
| `degree` | `heir_type` is Sibling/NieceNephew/OtherCollateral |
| `legal_separation_status` | `heir_type = "Spouse"` |
| `disinheritances` panel | `hasWill = true` (only in will context) |
| `children` sub-panel | Always (for grandchildren / representation) |
| `donations_received` | When top-level `donations` array is non-empty |

**Auto-set values** (never editable by user):
- `disinheritances` always sent as `[]` per HeirInput (disinheritances live on HeirInput.disinheritances, but the Will step adds DisinheritanceRecord entries linked by `heir_id`)
- `reconciled` defaults to `false`

#### Step 4: Will (Conditional)

**Purpose**: Capture will dispositions. Shown only when `hasWill=true`.

Sub-sections as tabs:
1. **Institutions** — testamentary gifts (fraction or amount)
2. **Devises** — real property bequests
3. **Legacies** — personal property bequests
4. **Disinheritances** — grounds per heir (from DisinheritanceRecord)
5. **Substitutions** — simple/fideicommissary/reciprocal

All heir pickers reference heirs from Step 3 (PersonPicker component).

#### Step 5: Donations

**Purpose**: Capture inter vivos donations. Optional step (user can skip).

Each donation card expands for advanced collatability flags:
- `is_collatable`: toggle (default true for cash gifts)
- `donor_expressly_exempted`: checkbox (Art. 1062 exemption)
- `heir_renounced`: checkbox (Art. 1062 exemption via renunciation)

#### Step 6: Review

**Purpose**: Display summary of all inputs before computation.

Shows collapsible sections per step. "Compute Distribution" primary button calls `ensureWasmInitialized()` → `compute_json()`.

Loading state: spinner overlay with "Computing inheritance distribution..."

### §16.2 Results View

#### Page Structure

```
┌─────────────────────────────────────────────────────┐
│ SUMMARY HEADER                                       │
│  Estate: ₱X.XX  Scenario: T3  Succession: Testate   │
│  Collation Adjustment: +₱X.XX                       │
├─────────────────────────────────────────────────────┤
│ DISTRIBUTION TABLE                                   │
│  Heir | Group | Legitime | Free Portion | Total      │
├─────────────────────────────────────────────────────┤
│ DISTRIBUTION CHART (stacked horizontal bar)          │
├─────────────────────────────────────────────────────┤
│ NARRATIVE PANEL (legal-font explanations per heir)   │
├─────────────────────────────────────────────────────┤
│ MANUAL REVIEW FLAGS (blocking amber cards)          │
├─────────────────────────────────────────────────────┤
│ WARNINGS PANEL (amber advisory items)                │
├─────────────────────────────────────────────────────┤
│ COMPUTATION LOG (collapsible accordion)              │
├─────────────────────────────────────────────────────┤
│ ACTIONS: [Back to Wizard] [Print] [Export JSON]      │
└─────────────────────────────────────────────────────┘
```

#### Distribution Table Columns

| Column | Source | Format |
|---|---|---|
| Heir Name | `distributions[*].heir_name` | Text + HeirTypeBadge |
| Group | `distributions[*].effective_group` | EffectiveGroupBadge |
| Legitime | `distributions[*].legitime_centavos` | MoneyDisplay (font-mono) |
| Free Portion | `distributions[*].free_portion_centavos` | MoneyDisplay |
| Total | `distributions[*].total_centavos` | MoneyDisplay (bold) |
| Rep? | `distributions[*].representation` | RepresentationIcon if non-null |

Excluded heirs shown with strikethrough / dimmed row and exclusion reason badge.

#### Distribution Chart

Stacked horizontal bar chart (recharts library). Each bar segment:
- Darkest shade = legitime portion
- Lighter shade = free portion
- Color by heir group (see §17.1 heir group colors)

#### Narrative Panel

Rendered as `prose-legal` class (Source Serif 4 font). Each heir gets one paragraph.
Article citations in italic brand-700 color. Source: `distributions[*].partition_notes`.

#### Error States

| Error Type | Display |
|---|---|
| InputValidation | Inline field error pointing to the specific wizard step |
| DomainValidation | Banner on step 3 (Family Tree) with heir names |
| MaxRestartsExceeded | Full-page error with "Contact support" |
| PanicRecovered | Full-page error with "Contact support" |

### §16.3 Shared Components

#### MoneyInput

```typescript
interface MoneyInputProps {
  value: number;           // internal centavos
  onChange: (centavos: number) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  min?: number;            // centavos; default 0
}
```

- Displays as peso (₱) with 2 decimal places: `₱1,234,567.89`
- User types in pesos; component converts: `Math.round(pesos * 100)`
- Comma formatting with `Intl.NumberFormat("en-PH")`
- Wire format: `{ centavos: number }` → converts to `InputMoney`

#### DateInput

```typescript
interface DateInputProps {
  value: DateString | null;        // "YYYY-MM-DD"
  onChange: (date: DateString | null) => void;
  label?: string;
  maxDate?: DateString;            // e.g., today
  minDate?: DateString;
  error?: string;
}
```

- Calendar picker (shadcn/ui Calendar)
- Also accepts manual YYYY-MM-DD typing
- Date of death: `maxDate = today`

#### FractionInput

```typescript
interface FractionInputProps {
  value: FractionString | null;    // "numer/denom"
  onChange: (f: FractionString | null) => void;
  label?: string;
  error?: string;
}
```

- Validates against `/^-?\d+\/[1-9]\d*$/` on blur
- Display hint: "Enter as fraction (e.g., 1/2, 3/4)"

#### PersonPicker

```typescript
interface PersonPickerProps {
  heirs: HeirInput[];
  value: HeirId | null;
  onChange: (id: HeirId | null) => void;
  label?: string;
  nullable?: boolean;             // allow "None / Charitable" option
  filterTypes?: HeirType[];       // limit to specific heir types
}
```

Dropdown showing heir names with HeirTypeBadge. Used for institution/devise/legacy
beneficiary selection and disinheritance heir reference.

#### EnumSelect

```typescript
interface EnumSelectProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
  getLabel?: (v: T) => string;
  getGroup?: (v: T) => string;    // for grouped dropdown
}
```

DisinheritanceGround grouped by article: "Art. 919 — Against Children", "Art. 920 — Against Parents", "Art. 921 — Against Spouse".

#### HeirTypeBadge

Small pill badge showing heir type with color. Variants:
- `LegitimateChild` / `LegitimatedChild` / `AdoptedChild` → blue
- `IllegitimateChild` → emerald (brand color)
- `LegitimateAscendant` → violet
- `Spouse` → violet (lighter)
- Collateral types → teal

#### EffectiveGroupBadge

Pill badge for G1–G4 with group name label:
- G1 → blue: "Primary Heir"
- G2 → violet: "Ascendant"
- G3 → violet-light: "Spouse"
- G4 → emerald: "Illegitimate Child"

#### AlertCard

```typescript
interface AlertCardProps {
  severity: "error" | "warning" | "info" | "success";
  title: string;
  children: React.ReactNode;
  dismissible?: boolean;
}
```

Color-coded by severity. Used for warnings panel and manual review flags.

---

## §17 Design System

### §17.1 Palette

Inspired by **archival green** — Philippine legal ledgers, notarial paper, BIR documents.
Deep jade green signals institutional authority. Warm copper nods to peso coins. Off-white
backgrounds mimic document paper.

**NOT Navy + Gold** (v1 palette was discarded). Fresh palette for v2.

```css
@theme {
  /* ── Core Brand (Jade/Archival Green) ──────────────────────────── */
  --color-brand-50:  #ecfdf5;   /* mint tint */
  --color-brand-100: #d1fae5;
  --color-brand-200: #a7f3d0;
  --color-brand-600: #059669;   /* jade green — interactive */
  --color-brand-700: #047857;   /* deep jade — primary buttons */
  --color-brand-800: #065f46;   /* forest — headers, nav */
  --color-brand-900: #064e3b;   /* darkest — active/pressed */

  /* ── Accent (Copper/Bronze) ────────────────────────────────────── */
  --color-accent-100: #fef3c7;
  --color-accent-400: #fbbf24;  /* gold highlights */
  --color-accent-600: #d97706;  /* copper — badges, key amounts */
  --color-accent-700: #b45309;  /* deep copper */

  /* ── Neutrals (Warm Stone) ─────────────────────────────────────── */
  --color-stone-50:  #fafaf9;   /* page background */
  --color-stone-100: #f5f5f4;   /* card bg alt */
  --color-stone-200: #e7e5e4;   /* borders */
  --color-stone-300: #d6d3d1;   /* strong borders/dividers */
  --color-stone-400: #a8a29e;   /* placeholder text */
  --color-stone-500: #78716c;   /* secondary text */
  --color-stone-700: #44403c;   /* body text */
  --color-stone-900: #1c1917;   /* heading text */

  /* ── Semantic Status ───────────────────────────────────────────── */
  --color-error-50:  #fef2f2;  --color-error-600: #dc2626;
  --color-warning-50:#fffbeb;  --color-warning-600:#d97706;
  --color-info-50:   #eff6ff;  --color-info-600:  #2563eb;
  --color-success-50:#f0fdf4;  --color-success-600:#16a34a;

  /* ── Heir Group Colors ─────────────────────────────────────────── */
  --color-group-primary:      #2563eb;  /* blue-600 — G1 */
  --color-group-secondary:    #7c3aed;  /* violet-600 — G2 */
  --color-group-tertiary:     #0d9488;  /* teal-600 — G3 collaterals */
  --color-group-illegitimate: #059669;  /* emerald-600 — G4 IC */
  --color-group-excluded:     #9ca3af;  /* gray-400 — excluded */

  /* Chart segment pairs (darker = legitime, lighter = FP) */
  --color-chart-lc-legitime: #1d4ed8;  --color-chart-lc-fp: #93c5fd;
  --color-chart-sp-legitime: #6d28d9;  --color-chart-sp-fp: #c4b5fd;
  --color-chart-ic-legitime: #065f46;  --color-chart-ic-fp: #6ee7b7;
  --color-chart-collateral:  #0f766e;
}
```

### §17.2 Typography

```css
@theme {
  /* UI font — forms, tables, labels, buttons */
  --font-ui:    "Inter Variable", "Inter", ui-sans-serif, system-ui, sans-serif;
  /* Legal font — narratives, article citations */
  --font-legal: "Source Serif 4", "Source Serif Pro", Georgia, serif;
  /* Mono font — peso amounts, computation log */
  --font-mono:  "JetBrains Mono", "Fira Code", ui-monospace, monospace;
}
```

**Type scale**:

| Role | Size/Line | Font | Weight |
|---|---|---|---|
| Display | 36px/40px | font-legal | 700 |
| H1 | 30px/36px | font-ui | 700 |
| H2 | 24px/32px | font-ui | 600 |
| H3 | 20px/28px | font-ui | 600 |
| H4 | 16px/24px | font-ui | 600 |
| Body | 15px/24px | font-ui | 400 |
| Body-sm | 13px/20px | font-ui | 400 |
| Caption | 12px/16px | font-ui | 400 (stone-500) |
| Legal-body | 16px/28px | font-legal | 400 |
| Legal-sm | 14px/24px | font-legal | 400 |
| Mono | 14px/20px | font-mono | 400 |
| Mono-sm | 12px/16px | font-mono | 400 |

**Google Fonts loading** (in `<head>`):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300..800&family=Source+Serif+4:ital,opsz,wght@0,8..60,300..900&family=JetBrains+Mono:ital,wght@0,100..800&display=swap" rel="stylesheet">
```

### §17.3 Component Library and Patterns

**Component library**: shadcn/ui (Radix UI primitives + Tailwind CSS v4)

**Stack**: React 18, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Zod v3, React Hook Form

**Key patterns**:

#### Form Cards
```
<Card className="border border-stone-200 bg-white shadow-sm rounded-lg p-6">
  <CardHeader className="text-stone-900 font-semibold text-base mb-4" />
  <CardContent className="space-y-4" />
</Card>
```
Background: white (`#ffffff`). Border: `stone-200`. Generous padding: `p-6` (24px).

#### Field Rows
Label above input. Error message below in `error-600`. Optional helper text in `stone-500` caption.

#### Heir Cards (Step 3)
Expandable cards with `HeirTypeBadge` + heir name in header. Collapsed shows type + name.
Expanded shows full form fields. Add/remove buttons in card corners.

#### Step Indicator
Horizontal progress indicator (5 or 6 steps). Active step: `brand-700` filled circle.
Completed: `brand-600` checkmark. Upcoming: `stone-300` empty circle.
Between steps: connector line, filled brand-600 when preceding step completed.

#### Amounts Display
```css
.amount-display {
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--color-accent-600);  /* copper for key result numbers */
}
```

#### Alert / Warning Cards
- Error: `error-600` border-left, `error-50` background
- Warning: `warning-600` border-left, `warning-50` background
- Info: `info-600` border-left, `info-50` background

#### Badges
Pill shape (`rounded-full`). Size: `text-xs px-2 py-0.5`.
Group colors per §17.1 heir group color tokens.

**Spacing philosophy**: 4px base unit. Component internal padding generous (16–24px).
Section gaps: 24–32px. Maximum content width: 900px on wizard, 1100px on results.

**Accessibility**: WCAG 2.1 AA contrast. Focus rings: 2px `brand-600` with 2px offset.
Skip link at top of page. ARIA labels on all icon buttons. Keyboard navigation through wizard.

**Icon library**: lucide-react

**Dark mode**: Deferred to v3. v2 is light mode only.

**Print styles**:
- Expand all accordions
- Hide wizard chrome (step indicator, back/next buttons)
- Show full computation log
- Use `font-legal` for all body text in print

---

## §18 Test Vectors

The engine must pass all 47 test vectors. 100% scenario coverage (all 30 ScenarioCode variants).

### §18.1 Notation

- E = net estate in centavos (unless noted in pesos for readability)
- n = legitimate child lines, m = IC count
- Amounts rounded to nearest centavo via Hare-Niemeyer
- All amounts in Philippine pesos unless labeled centavos

### §18.2 Selected Test Vectors

#### TV-01: Scenario T1 — Single Legitimate Child (Intestate-like Testate)
- E = ₱10,000,000; 1 LC (Ana); no will
- Expected: Ana = ₱10,000,000 (100% intestate)
- Scenario code: I1

#### TV-02: Scenario T1 — Two Legitimate Children
- E = ₱10,000,000; 2 LC (Ana, Ben); will gives Ana ½
- Legitime: each ¼ (½E ÷ 2)
- Will gives Ana ½ = ₱5,000,000 ≥ legitime ✓
- Expected: Ana = ₱5,000,000; Ben = ₱2,500,000 (legitime); FP remaining = ₱2,500,000 → residue per will

#### TV-03: Scenario T3 — Spouse + 2 LC
- E = ₱10,000,000; 2 LC + Spouse; no will
- n=2: LC per = ½E÷2 = ₱2,500,000; Spouse = ₱2,500,000 (=1/2n)
- Expected: each of 3 heirs = ₱2,500,000; FP_disposable = ₱2,500,000 (not distributed in intestate)
- Scenario: I2-like but testate → T3 (with FP if has will)

#### TV-04: Scenario T4 — Cap Rule Bites (T4, n=1, m=5)
- E = ₱10,000,000; 1 LC; 5 IC; no spouse
- G1: ₱5,000,000; per LC = ₱5,000,000
- Per IC uncapped = ₱2,500,000 × 5 = ₱12,500,000 > FP (₱5,000,000) → cap bites
- Per IC actual = ₱5,000,000 ÷ 5 = ₱1,000,000
- Expected: LC = ₱5,000,000; each IC = ₱1,000,000; FP_disposable = ₱0

#### TV-05: Scenario T9 — Most Constrained (Ascendants + IC + Spouse)
- E = ₱10,000,000; 2 ascendants + 2 IC + 1 spouse
- G2 collective = ½E = ₱5,000,000 (each ascendant = ₱2,500,000)
- IC flat ¼ = ₱2,500,000 ÷ 2 = ₱1,250,000 each
- Spouse = ⅛E = ₱1,250,000
- FP_disposable = ⅛E = ₱1,250,000

#### TV-06: Scenario I3 — Intestate with IC (uncapped 2:1)
- E = ₱12,000,000; 2 LC + 2 IC; intestate
- Unit = E ÷ (2×2 + 2×1) = ₱12,000,000 ÷ 6 = ₱2,000,000
- Each LC = ₱4,000,000; each IC = ₱2,000,000 (ratio 2:1, no cap)

#### TV-07: Scenario T12-AM — Articulo Mortis Spouse
- E = ₱10,000,000; spouse only; articulo mortis; cohabitation < 5 years
- Spouse = ⅓E = ₱3,333,333 (rounded from ₱3,333,333.33)
- Hare-Niemeyer: ₱3,333,334 (bonus centavo) or ₱3,333,333 depending on fractions
- FP_disposable = ⅔E = ₱6,666,667

#### TV-08: BUG-001 Fix — Two Simultaneous Disinheritances (T1 → T1 after exclusion)
- E = ₱10,000,000; 3 LC (A, B, C); will disinherits A and B (both valid)
- v1 wrong: Process A → scenario T1 with 2 LC → Process B → scenario T1 with 1 LC
- v2 correct: BATCH exclude A+B → scenario T1 with 1 LC (C) → C = ₱5,000,000 legitime
- FP = ₱5,000,000 to A's and B's children (if any) or free

#### TV-09: Representation — Predeceased Child
- E = ₱10,000,000; 1 LC (Ana, predeceased) + 2 grandchildren (Ana's children)
- Ana triggers representation; grandchildren take Ana's ½ share equally
- Each grandchild = ₱5,000,000 ÷ 2 = ₱2,500,000 per stirpes

#### TV-10: Preterition (Art. 854)
- E = ₱10,000,000; 2 LC (Ana, Ben); will institutes only Ana for the whole estate
- Ben is preterited → all institutions annulled
- Result: Ben = ₱2,500,000 (legitime); Ana = ₱2,500,000 (legitime) + ₱5,000,000 FP (undisposed)

#### TV-11: Collation — Donation Charged to Legitime
- E = ₱10,000,000; 1 LC (Ana) received donation of ₱2,000,000
- E_adj = ₱12,000,000; Ana legitime = ½E_adj = ₱6,000,000
- Ana estate portion = ₱6,000,000 − ₱2,000,000 (collation credit) = ₱4,000,000 from estate
- INV-1: ₱4,000,000 + ₱2,000,000 collation = ₱6,000,000 total entitlement

#### TV-12: Iron Curtain Rule (I9-like blocked)
- IC cannot inherit from LC's siblings → test vector confirms Iron Curtain filtering

#### TV-13: Scenario I12 — Spouse + Siblings
- E = ₱10,000,000; 1 spouse + 3 siblings (intestate)
- Spouse = ½E = ₱5,000,000
- Siblings = ½E ÷ 3 = ₱1,666,667 each (Hare-Niemeyer distributes ₱1 cent remainder)

#### TV-14: Art. 895 Cap — T5 with n=2, m=3
- E = ₱10,000,000; 2 LC + 3 IC + spouse
- Per LC = 1/(2×2)×E = ₱2,500,000; spouse = 1/(2×2)×E = ₱2,500,000
- FP_after_spouse = ₱5,000,000 − ₱2,500,000 = ₱2,500,000
- Per IC uncapped = ₱2,500,000/2 = ₱1,250,000; total uncapped = ₱3,750,000 > ₱2,500,000 → cap
- Per IC actual = ₱2,500,000 ÷ 3 = ₱833,333 (Hare-Niemeyer: 2 get ₱833,334)

#### TV-15: Vacancy — Renunciation (No Representation)
- E = ₱10,000,000; 2 LC (Ana, Ben); Ben renounces
- Renunciation does NOT trigger representation (Art. 977)
- Ben's share accretes to Ana (co-heir accretion, Art. 1015)
- Ana = ₱10,000,000 total

#### TV-16: Scenario T14 — Illegitimate Decedent's Parents
- Illegitimate decedent; E = ₱10,000,000; 2 parents; no descendants; no spouse
- Each parent = ¼E = ₱2,500,000 (Art. 903 ¶2 — ½ collective ÷ 2)
- Wait: T14 = parents only → parents = ½E each? No: Art. 903¶1 = parents collective ½E = ₱5,000,000 ÷ 2 = ₱2,500,000 each

#### TV-17: Hare-Niemeyer — 3-way irrational split
- E = ₱10,000,000 (1,000,000,000 centavos); 3 heirs equal share = 333,333,333.33...
- Floor: 333,333,333 each; deficit = 1
- Heir with largest remainder (all equal: ⅓) → first in sorted order gets +1
- Result: heir 1 = 333,333,334; heirs 2,3 = 333,333,333
- Total: 333,333,334 + 333,333,333 + 333,333,333 = 1,000,000,000 ✓

#### TV-18: Scenario T13 — No Compulsory Heirs (Full FP)
- Testate; E = ₱10,000,000; no G1/G2/G3/G4 heirs; will gives 100% to charity
- FP_disposable = ₱10,000,000 (full estate)
- Charity = ₱10,000,000

#### TV-19: Collation Debt (donation > estate share)
- E = ₱1,000,000; 1 LC; donation received = ₱3,000,000
- E_adj = ₱4,000,000; LC legitime = ₱2,000,000
- LC estate portion = ₱2,000,000 − ₱2,000,000 = ₱0 (donation fully covers)
- Remaining donation (₱1,000,000) exceeds estate → CollationDebt warning; MANUAL_REVIEW flag

### §18.3 Full Vector Coverage

All 30 ScenarioCode variants covered by the 47 test vectors:

| Scenario | TV IDs |
|---|---|
| T1 | TV-01, TV-02 |
| T2 | TV-03 |
| T3 | TV-03b |
| T4 | TV-04, TV-14b |
| T5 | TV-14 |
| T6–T9 | TV-05b, TV-05 |
| T10–T13 | TV-07b, TV-13b, TV-18 |
| T14–T15 | TV-16, TV-16b |
| I1–I4 | TV-01, TV-06 |
| I5–I10 | TV-05c, TV-12 |
| I11–I15 | TV-15b, TV-13 |
| BUG-001 | TV-08, TV-MD-01..05 |

---

## §19 Invariants

### §19.1 Global Invariants (10)

#### INV-1: Centavo Conservation
```
Σ(h.total_centavos for h in distributions where !h.is_excluded) == net_distributable_estate.centavos
```
No centavo lost or created. Holds after Hare-Niemeyer. Escheated estate counted as a "State heir."

#### INV-2: Entitlement = Collation-Adjusted Estate
```
Σ(h.total_entitlement_centavos for h in distributions) == adjusted_estate.centavos
```
When no donations: E_adj = E so INV-2 = INV-1. When donations present: total entitlements = E_adj.

#### INV-3: Legitime Floor
```
For each compulsory heir h where !h.is_excluded:
  h.from_estate_centavos + h.collation_credit_centavos >= h.legitime_floor_centavos
```
A compulsory heir's combined receipt never falls below their legitime.
Applies to testate/mixed succession only (intestate: `legitime_floor_centavos = 0`).

#### INV-4: Art. 895 Per-IC Ratio (Regime A only)
```
For each IC heir hi in Regime A scenarios (T4, T5):
  hi.total_centavos <= (lc_per_capita_centavos / 2) + 1  // +1 for rounding tolerance
```
Each IC's share ≤ ½ of any LC's per-capita share.

#### INV-5: Aggregate IC Cap (Regime A only)
```
Σ(ic.total_centavos for ic in IC_heirs) <= fp_gross.centavos - spouse_legitime.centavos + 1
```
Total IC payout never exceeds FP after spouse is satisfied.

#### INV-6: Per Stirpes Slot Conservation
```
For each predeceased heir p:
  Σ(r.total_centavos for r in representatives_of(p)) == p.theoretical_share_centavos
```
Representatives together receive exactly the deceased parent's slot.

#### INV-7: Adoption Equivalence
```
For each AdoptedChild heir a (not rescinded):
  a.total_centavos == equivalent_LC_total_centavos
```
Adopted child receives same share as a legitimate child in the same position.

#### INV-8: Preterition Totality (when AnnulsAll)
```
When testate_validation.preterition.effect.type == "AnnulsAll":
  succession_type == "Intestate"
  AND all institution amounts are zero
```
Full preterition converts to intestate distribution.

#### INV-9: Disinheritance Exclusion
```
For each heir h with valid disinheritance (is_excluded AND exclusion_reason == "ValidDisinheritance"):
  h.total_centavos == 0
  AND h.legitime_centavos == 0
```
A validly disinherited heir receives absolutely nothing.

#### INV-10: Scenario Consistency
```
scenario_code is consistent with the heir set in distributions:
  - T1..T15 ↔ succession_type != "Intestate"
  - I1..I15 ↔ succession_type == "Intestate"
  - G1 heirs present ↔ T1/T2/T3/T4/T5 or I1/I2/I3/I4
  - No G1, G2 present ↔ T6/T7/T8/T9 or I5/I6
```

### §19.2 Pipeline Structural Invariants (5)

| ID | Rule |
|---|---|
| PINV-1 | Pipeline terminates: restart_count ≤ MAX_RESTARTS (10) |
| PINV-2 | Exclusions are monotonic: once `is_eligible=false`, never set back to true |
| PINV-3 | Step ordering: step N always runs before step N+1 in same cycle |
| PINV-4 | Base classification idempotent: `classified_heirs_base` never changes after step 2 |
| PINV-5 | Computation log is append-only: log entries never removed |

---

## §20 Cross-Layer Consistency Checklist

This section documents all verified cross-layer agreements and all resolved discrepancies
between the Rust type definitions, JSON wire format, TypeScript interfaces, and Zod schemas.
See `analysis/cross-layer-consistency.md` for full reasoning on each resolution.

A developer MUST verify ALL items in §20.8 (Implementation Checklist) before shipping.

### §20.1 Confirmed Cross-Layer Matches

The following items are **consistent** across all four layers with no changes needed:

| Item | Status |
|------|--------|
| `HeirType` (9 variants: LegitimateChild…OtherCollateral) | ✅ Consistent |
| `LegalSeparationStatus` (NotApplicable, InnocentSpouse, GuiltySpouse) | ✅ Consistent |
| `SubstitutionType` (Simple, Fideicommissary, Reciprocal) | ✅ Consistent |
| `DisinheritanceGround` (22 variants: Art919_1…Art921_6) | ✅ Consistent |
| `ScenarioCode` (30 variants: T1–T15, I1–I15) | ✅ Consistent |
| `SuccessionType` (Testate, Intestate, Mixed) | ✅ Consistent |
| `ShareSource` (Legitime, FreePortion, Intestate, Devise, Legacy) | ✅ Consistent |
| Money: number \| string on input; number on output | ✅ Consistent |
| Booleans: `true`/`false` only (never string/number) | ✅ Consistent |
| `Option<T>` → always `null`, never absent | ✅ Consistent |
| Struct fields: `snake_case` | ✅ Consistent |
| Enum variants: `PascalCase` | ✅ Consistent |
| `deny_unknown_fields` on all input types | ✅ Consistent |
| No `deny_unknown_fields` on output types | ✅ Consistent |
| Fractions: `"numer/denom"` string format | ✅ Consistent |
| Dates: `"YYYY-MM-DD"` ISO-8601 | ✅ Consistent |
| `DisinheritanceRecord` fields | ✅ Consistent |
| `WillInput` / `InstitutionInput` / `DeviseInput` / `LegacyInput` / `SubstitutionInput` / `DonationInput` fields | ✅ Consistent |
| `RoundingAdjustment` fields | ✅ Consistent |
| `ComputationOutput` top-level structure | ✅ Consistent |
| `ComputationError` (5 variants, `error_type` tag) | ✅ Consistent |
| `ValidationWarning` (10 variants, `code`+`data` tag) | ✅ Consistent |
| `ManualReviewFlag` (7 variants, `flag` tag) | ✅ Consistent |
| `HeirInput.children` recursive `HeirInput[]` | ✅ Consistent |

---

### §20.2 Resolved Discrepancies

Nine discrepancies were found between the four layers and resolved below. Each resolution
picks the canonical definition that ALL layers must implement.

#### DISC-01: `EffectiveGroup` — shorthand G1–G4 vs full PascalCase names

**Prior conflict**: `serde-wire-format` used `"G1"`–`"G4"` shorthand (4 variants).
`rust-types` and `zod-schemas` used full PascalCase names (5 variants).

**Resolution** ✅ Full PascalCase, 5 variants:

```
LegitimateChildGroup     → "LegitimateChildGroup"   (G1)
LegitimateAscendantGroup → "LegitimateAscendantGroup" (G2, only when G1 absent)
SurvivingSpouseGroup     → "SurvivingSpouseGroup"   (G3)
IllegitimateChildGroup   → "IllegitimateChildGroup"  (G4)
CollateralGroup          → "CollateralGroup"         (G5, intestate I11–I15)
```

Note: 5 variants (not 4) — `CollateralGroup` needed for intestate collateral scenarios.

#### DISC-02: `ExclusionReason` — completely different variant sets

**Prior conflict**: `serde-wire-format` had 8 simplified variants. `rust-types` and
`zod-schemas` had a different 8-variant set with more precise names.

**Resolution** ✅ Rust-types variants + `IronCurtain` added = 9 variants:

```
PredeceaseNoRepresentation  — predeceased, no eligible representatives
Unworthiness                — Art. 1032 unworthiness, not condoned
FiliationNotProved          — FC Arts. 172/175 filiation not established
GuiltySpouseLegalSeparation — Art. 1002 spouse gave cause for legal separation
AdoptionRescinded           — RA 8552 §20 adoption rescinded before death
ValidDisinheritance         — Arts. 915–923 valid disinheritance
Renounced                   — Art. 1041 valid renunciation
ExcludedByGroup             — Art. 887(2) legitimate ascendant excluded by LC presence
IronCurtain                 — Art. 992 Iron Curtain Rule (IC ↔ legitimate relatives barrier)
```

Removed: `Predeceased` (renamed), `Incapacity` (renamed), `Renunciation` (renamed),
`IronCurtain` (kept from prior), `NotCalled` (not an exclusion reason), `InvalidDisinheritance`
(invalid disinheritance does NOT exclude — it emits a warning only).

#### DISC-03: `RepresentationTrigger` — two variant conflicts

**Prior conflict**: `serde-wire-format` used `Incapacity` and `Art902IllegitimateLine`.
`rust-types` and `zod-schemas` used `Unworthiness` and `IllegitimateTransmission`.

**Resolution** ✅ Rust-types variants (4 variants):

```
Predecease               — heir predeceased (Arts. 970–971)
Disinheritance           — valid disinheritance (Art. 923)
Unworthiness             — unworthy/incapacitated (Art. 1035)
IllegitimateTransmission — Art. 902 illegitimate child's descendants in intestate
```

#### DISC-04: `VacancyCause` — different variant sets

**Prior conflict**: `serde-wire-format` had 6 variants including `DisinheritanceInvalid`
and `LegitimacyVacancy`. `rust-types` and `zod-schemas` had different 6 variants.

**Resolution** ✅ Rust-types variants + `ConditionFailed` added = 7 variants:

```
Predecease              — heir (or substitute) predeceased
Renunciation            — heir renounced (Art. 1041)
Unworthiness            — heir unworthy/incapacitated (Art. 1032)
Disinheritance          — valid disinheritance (invalid ≠ vacancy)
SubstitutePredeceased   — named substitute predeceased primary heir
SubstituteIncapacitated — named substitute is incapacitated/unworthy
ConditionFailed         — will condition not fulfilled (Art. 872)
```

Removed: `DisinheritanceInvalid` (invalid disinheritance is a warning, not a vacancy),
`LegitimacyVacancy` (Art. 1021 ¶2 is a restart trigger, not a VacancyCause).

#### DISC-05: `ResolutionMethod` — 5 vs 8 variants

**Prior conflict**: `serde-wire-format` had 5 variants with a single `Accretion`.
`rust-types` and `zod-schemas` had 8 variants distinguishing accretion types.

**Resolution** ✅ Rust-types 8-variant set:

```
Substitution          — Art. 859/1022(1): named substitute inherits
Representation        — Arts. 970–977: representatives step in per stirpes
AccretionFreePortion  — Arts. 1016–1019, 1021 ¶1: pro indiviso FP accretion
AccretionIntestate    — Art. 1018: intestate share proportional accretion
OwnRightLegitime      — Art. 1021 ¶2: vacant legitime → pipeline restart required
IntestateFallback     — Art. 1022(2): falls to legal/intestate heirs
NextDegreeInOwnRight  — Art. 969: all same-degree heirs renounce → next degree
Escheat               — Art. 1011: no heirs → entire estate to State
```

`AccretionFreePortion` ≠ `AccretionIntestate` — legally distinct effects requiring different
pipeline handling. `OwnRightLegitime` triggers a full scenario recompute (not accretion).

#### DISC-06: `PreteritionEffect` — `AnnulsAll`/`AnnulsInstitutions` vs `None`/`InstitutionAnnulled`

**Prior conflict**: `serde-wire-format` had `AnnulsAll` and `AnnulsInstitutions`.
`rust-types` and `zod-schemas` had `None` and `InstitutionAnnulled`.

**Resolution** ✅ Rust-types variants:

```json
{ "type": "None" }
{ "type": "InstitutionAnnulled", "preterited_heir_ids": ["heir_001"] }
```

Art. 854 annuls ONLY heir institutions (not devises/legacies) — `AnnulsAll` was legally wrong.
`None` variant is required so the field always serializes.

#### DISC-07: `DecedentInput` — missing fields in earlier draft

**Prior conflict**: Two different incomplete definitions existed — `rust-types` had
Art. 903/900 fields; `serde-wire-format` had logical input fields.

**Resolution** ✅ Merged 11-field canonical definition:

```
name                    : string
date_of_death           : string | null          (YYYY-MM-DD or null)
has_will                : boolean
has_legitimate_children : boolean
has_illegitimate_children: boolean
is_illegitimate         : boolean                (Art. 903 T14/T15 trigger)
articulo_mortis         : boolean                (Art. 900 ¶2 trigger)
cohabitation_years      : u32                    (Art. 900 ¶2 exception)
legal_separation_status : LegalSeparationStatus  (for spouse exclusion)
domicile                : string | null
nationality             : string | null
```

#### DISC-08: `EstateInput` — `net_value_centavos: i64` vs Money wrapper

**Prior conflict**: `rust-types` used `net_value_centavos: i64`. `serde-wire-format`
and `zod-schemas` used `net_estate: Money` wrapper with additional fields.

**Resolution** ✅ Money-wrapper form (4 fields):

```
net_estate    : Money              (required — base for all computations)
gross_estate  : Money | null       (optional — collation base if provided)
obligations   : Money | null       (optional — audit trail)
description   : string | null      (optional — display label)
```

#### DISC-09: `HeirInput` — four sub-conflicts

**a) `is_alive` vs `is_deceased`** — Resolution ✅ `is_alive: boolean`

**b) `degree` vs `collateral_degree` + `is_collateral`** — Resolution ✅ `degree: number | null` (unified)

**c) `is_disinherited` on HeirInput** — Resolution ✅ **Remove** (engine-computed, not input)

**d) `children: Vec<HeirId>` vs `children: HeirInput[]`** — Resolution ✅ Recursive `HeirInput[]`

The canonical HeirInput has 24 fields. Removed from HeirInput: `is_deceased`,
`is_disinherited`, `is_collateral`, `collateral_degree`, `cause_proven`, `reconciled`
(last two belong on `DisinheritanceRecord` only).

---

### §20.3 Canonical Enum Summary

| Enum | Variants (wire strings) |
|------|-------------------------|
| `HeirType` | `LegitimateChild`, `LegitimatedChild`, `AdoptedChild`, `IllegitimateChild`, `LegitimateAscendant`, `Spouse`, `Sibling`, `NieceNephew`, `OtherCollateral` |
| `LegalSeparationStatus` | `NotApplicable`, `InnocentSpouse`, `GuiltySpouse` |
| `SubstitutionType` | `Simple`, `Fideicommissary`, `Reciprocal` |
| `DisinheritanceGround` | `Art919_1`–`Art919_8`, `Art920_1`–`Art920_8`, `Art921_1`–`Art921_6` |
| `ScenarioCode` | `T1`–`T15`, `I1`–`I15` |
| `SuccessionType` | `Testate`, `Intestate`, `Mixed` |
| `EffectiveGroup` | `LegitimateChildGroup`, `LegitimateAscendantGroup`, `SurvivingSpouseGroup`, `IllegitimateChildGroup`, `CollateralGroup` |
| `ExclusionReason` | `PredeceaseNoRepresentation`, `Unworthiness`, `FiliationNotProved`, `GuiltySpouseLegalSeparation`, `AdoptionRescinded`, `ValidDisinheritance`, `Renounced`, `ExcludedByGroup`, `IronCurtain` |
| `RepresentationTrigger` | `Predecease`, `Disinheritance`, `Unworthiness`, `IllegitimateTransmission` |
| `VacancyCause` | `Predecease`, `Renunciation`, `Unworthiness`, `Disinheritance`, `SubstitutePredeceased`, `SubstituteIncapacitated`, `ConditionFailed` |
| `ShareSource` | `Legitime`, `FreePortion`, `Intestate`, `Devise`, `Legacy` |
| `ResolutionMethod` | `Substitution`, `Representation`, `AccretionFreePortion`, `AccretionIntestate`, `OwnRightLegitime`, `IntestateFallback`, `NextDegreeInOwnRight`, `Escheat` |
| `PreteritionEffect` (tag="type") | `None`, `InstitutionAnnulled` |
| `ValidationWarning` (tag="code") | `PreteritionDetected`, `InvalidDisinheritance`, `ConditionStripped`, `Underprovision`, `InoficiousnessReduced`, `ReconciliationVoided`, `PosthumousHeirPossible`, `AnnuityChoiceRequired`, `IndivisibleRealty`, `MultipleDisinheritances` |
| `ManualReviewFlag` (tag="flag") | `AllDescendantsDisinherited`, `DisinheritedWithSubstituteAndReps`, `PosthumousChildPossible`, `UsufructElectionRequired`, `IndivisibleRealtyPartition`, `ReconciliationPreWill`, `LegitimationContested` |
| `ComputationError` (tag="error_type") | `InputValidation`, `DomainValidation`, `MaxRestartsExceeded`, `ArithmeticError`, `PanicRecovered` |

---

### §20.4 Nullability Matrix

Every `Option<T>` in Rust must be `T | null` in TypeScript and `z.nullable(TSchema)` in Zod.
**Rule**: NEVER use `z.optional()` for serde `Option<T>` fields. ALWAYS use `z.nullable()`.

| Struct | Field | Rust | TS | Zod |
|--------|-------|------|----|-----|
| `DecedentInput` | `date_of_death` | `Option<String>` | `string \| null` | `z.nullable(DateStringSchema)` |
| `DecedentInput` | `domicile` | `Option<String>` | `string \| null` | `z.nullable(z.string())` |
| `DecedentInput` | `nationality` | `Option<String>` | `string \| null` | `z.nullable(z.string())` |
| `EstateInput` | `gross_estate` | `Option<Money>` | `InputMoney \| null` | `z.nullable(InputMoneySchema)` |
| `EstateInput` | `obligations` | `Option<Money>` | `InputMoney \| null` | `z.nullable(InputMoneySchema)` |
| `EstateInput` | `description` | `Option<String>` | `string \| null` | `z.nullable(z.string())` |
| `HeirInput` | `date_of_death` | `Option<String>` | `string \| null` | `z.nullable(DateStringSchema)` |
| `HeirInput` | `date_of_birth` | `Option<String>` | `string \| null` | `z.nullable(DateStringSchema)` |
| `HeirInput` | `adoption_date` | `Option<String>` | `string \| null` | `z.nullable(DateStringSchema)` |
| `HeirInput` | `adoption_rescission_date` | `Option<String>` | `string \| null` | `z.nullable(DateStringSchema)` |
| `HeirInput` | `degree` | `Option<u32>` | `number \| null` | `z.nullable(z.number().int().min(1))` |
| `ComputationInput` | `will` | `Option<WillInput>` | `WillInput \| null` | `z.nullable(WillInputSchema)` |
| `ComputationInput` | `donations` | `Option<Vec<DonationInput>>` | `DonationInput[] \| null` | `z.nullable(z.array(DonationInputSchema))` |
| `WillInput` | `date_executed` | `Option<String>` | `string \| null` | `z.nullable(DateStringSchema)` |
| `DonationInput` | `donor_id` | `Option<String>` | `string \| null` | `z.nullable(z.string())` |
| `DonationInput` | `recipient_heir_id` | `Option<String>` | `string \| null` | `z.nullable(z.string())` |
| `DonationInput` | `date` | `Option<String>` | `string \| null` | `z.nullable(DateStringSchema)` |
| `DonationInput` | `description` | `Option<String>` | `string \| null` | `z.nullable(z.string())` |
| `DonationInput` | `professional_expense_imputed_savings_centavos` | `Option<i64>` | `number \| null` | `z.nullable(z.number().int())` |
| `DisinheritanceRecord` | `note` | `Option<String>` | `string \| null` | `z.nullable(z.string())` |
| `InstitutionInput` | `fraction` | `Option<String>` | `string \| null` | `z.nullable(FractionStringSchema)` |
| `InstitutionInput` | `amount_centavos` | `Option<i64>` | `number \| null` | `z.nullable(z.number().int())` |
| `InstitutionInput` | `description` | `Option<String>` | `string \| null` | `z.nullable(z.string())` |
| `DeviseInput` | `beneficiary_heir_id` | `Option<HeirId>` | `string \| null` | `z.nullable(z.string())` |
| `HeirDistribution` | `effective_group` | `Option<EffectiveGroup>` | `EffectiveGroup \| null` | `z.nullable(EffectiveGroupSchema)` |
| `HeirDistribution` | `exclusion_reason` | `Option<ExclusionReason>` | `ExclusionReason \| null` | `z.nullable(ExclusionReasonSchema)` |
| `HeirDistribution` | `per_stirpes_fraction` | `Option<String>` | `string \| null` | `z.nullable(FractionStringSchema)` |
| `HeirDistribution` | `representation` | `Option<RepresentationChain>` | `RepresentationChain \| null` | `z.nullable(RepresentationChainSchema)` |
| `HeirDistribution` | `per_heir_fraction` | `Option<String>` | `string \| null` | `z.nullable(FractionStringSchema)` |
| `HeirDistribution` | `partition_notes` | `Option<String>` | `string \| null` | `z.nullable(z.string())` |
| `ComputationOutput` | `testate_validation` | `Option<TestateValidationResult>` | `TestateValidationResult \| null` | `z.nullable(TestateValidationResultSchema)` |
| `ComputationOutput` | `collation` | `Option<CollationResult>` | `CollationResult \| null` | `z.nullable(CollationResultSchema)` |

---

### §20.5 Tagged Enum Tag Field Consistency

| Enum | Rust tag attr | JSON discriminant key | TypeScript discriminant |
|------|---------------|-----------------------|------------------------|
| `PreteritionEffect` | `#[serde(tag = "type")]` | `"type"` | `.type` |
| `ValidationWarning` | `#[serde(tag = "code", content = "data")]` | `"code"` + `"data"` | `.code` |
| `ManualReviewFlag` | `#[serde(tag = "flag")]` | `"flag"` | `.flag` |
| `ComputationError` | `#[serde(tag = "error_type")]` | `"error_type"` | `.error_type` |

---

### §20.6 Money Serialization Consistency

| Layer | Centavos accepted |
|-------|-------------------|
| Rust deserialize (input) | `i64` number OR `"12345"` string |
| JSON wire (input) | number OR string |
| JSON wire (output) | number only (always i64) |
| TypeScript `InputMoney` | `number \| string` |
| TypeScript `OutputMoney` | `number` |
| Zod `InputMoneySchema` | `z.union([z.number().int(), z.string().regex(/^-?\d+$/)])` |
| Zod `OutputMoneySchema` | `z.number().int()` |
| `MoneyInput` component | Collects as pesos (decimal) → converts: `Math.round(pesos * 100)` |
| `MoneyDisplay` component | Receives centavos → displays: `(centavos / 100).toLocaleString("en-PH", { style: "currency", currency: "PHP" })` |

---

### §20.7 Integration Test Scenarios

End-to-end test flow: Form → JSON → WASM → Result → Display

**Scenario A: Simple Intestate (I1)**
```
Input:  1 LC, E=₱10,000,000, no will
JSON:   { "decedent": {"has_will": false, ...}, "heirs": [{"heir_type": "LegitimateChild",
          "is_alive": true, ...}], "will": null, "donations": null }
WASM:   compute_json(inputJson) → Ok(outputJson)
Result: scenario_code = "I1", distributions[0].total_centavos = 1_000_000_000
        distributions[0].effective_group = "LegitimateChildGroup"   ← DISC-01 critical
Display: "Maria dela Cruz (LC) — ₱10,000,000.00"
```

**Scenario B: Cap Rule (T4)**
```
Input:  1 LC + 5 IC, E=₱10,000,000, will giving all FP to LC
JSON:   heir_type values ["LegitimateChild", "IllegitimateChild" × 5]
WASM:   → success, scenario_code = "T4"
Result: distributions[0].total_centavos = 500_000_000 (LC — ½ estate)
        distributions[1..5].total_centavos = 100_000_000 each (IC — ½ of LC each)
        distributions[1..5].effective_group = "IllegitimateChildGroup"   ← DISC-01
```

**Scenario C: Disinheritance with Representation**
```
Input:  1 LC (disinherited, valid), 2 grandchildren
JSON:   disinheritances[0].ground = "Art919_1", cause_proven = true
WASM:   → success, scenario_code = "T1" (grandchildren represent LC)
Result: distributions[0].is_excluded = true
        distributions[0].exclusion_reason = "ValidDisinheritance"   ← DISC-02 critical
        distributions[1..2].representation.trigger = "Disinheritance"   ← DISC-03
```

**Scenario D: Vacant Share with Renunciation**
```
Input:  2 LC, LC2 renounces
WASM:   → success
Result: vacancy_resolutions[0].vacancy_cause = "Renunciation"   ← DISC-04
        vacancy_resolutions[0].resolution_method = "AccretionIntestate"   ← DISC-05
        LC1 gets 100% estate
```

**Scenario E: Enum Round-Trip Validation**
```typescript
// TypeScript: verify all DISC-resolved enum values parse without error
const output: ComputationOutput = ComputationOutputSchema.parse(wasmOutput);
// Must accept without throwing:
expect(output.distributions[0].effective_group).toBe("LegitimateChildGroup");  // DISC-01
expect(output.distributions[1].exclusion_reason).toBe("PredeceaseNoRepresentation");  // DISC-02
expect(output.distributions[1].representation?.trigger).toBe("IllegitimateTransmission");  // DISC-03
expect(output.vacancy_resolutions[0].vacancy_cause).toBe("SubstitutePredeceased");  // DISC-04
expect(output.vacancy_resolutions[0].resolution_method).toBe("AccretionFreePortion");  // DISC-05
expect(output.testate_validation?.preterition_effect.type).toBe("InstitutionAnnulled");  // DISC-06
```

**Scenario F: Error Handling**
```
Input:  invalid JSON { "heir_type": "legitimateChild" } (wrong case)
WASM:   → Err(json_string)
Parse:  error_type = "InputValidation", field_path = "heirs[0].heir_type"
Display: field-level error on HeirType dropdown
```

---

### §20.8 Implementation Checklist

A developer implementing the v2 engine must verify every item:

**Rust Engine:**
- [ ] `EffectiveGroup` has 5 PascalCase variants (not G1–G4 shorthands)
- [ ] `ExclusionReason` has 9 variants including `IronCurtain`
- [ ] `RepresentationTrigger` uses `Unworthiness` and `IllegitimateTransmission`
- [ ] `VacancyCause` has 7 variants including `ConditionFailed`
- [ ] `ResolutionMethod` has 8 variants (`AccretionFreePortion` ≠ `AccretionIntestate`)
- [ ] `PreteritionEffect` has `None` and `InstitutionAnnulled` variants
- [ ] `DecedentInput` has all 11 fields including `is_illegitimate`, `articulo_mortis`, `cohabitation_years`
- [ ] `EstateInput` uses `net_estate: Money` (not `net_value_centavos: i64`)
- [ ] `HeirInput` uses `is_alive: bool` (not `is_deceased`)
- [ ] `HeirInput` uses `degree: Option<u32>` (not `collateral_degree: u32`)
- [ ] `HeirInput` does NOT have `is_disinherited`, `is_collateral`, `cause_proven`, `reconciled`
- [ ] `HeirInput.children` is `Vec<Box<HeirInput>>` (recursive, not `Vec<HeirId>`)
- [ ] No `#[serde(skip_serializing_if = "Option::is_none")]` on any field
- [ ] Input structs have `#[serde(deny_unknown_fields)]`; output structs do NOT

**TypeScript / Zod:**
- [ ] `EffectiveGroupSchema` lists 5 full PascalCase names
- [ ] `ExclusionReasonSchema` lists 9 variants including `IronCurtain`
- [ ] `RepresentationTriggerSchema` uses `Unworthiness` and `IllegitimateTransmission`
- [ ] `VacancyCauseSchema` lists 7 variants including `ConditionFailed`
- [ ] `ResolutionMethodSchema` lists 8 variants
- [ ] `PreteritionEffectSchema` discriminates on `type` with `None` and `InstitutionAnnulled`
- [ ] `DecedentInputSchema` has all 11 fields including `is_illegitimate`, `articulo_mortis`, `cohabitation_years`
- [ ] `EstateInputSchema` uses `net_estate: InputMoneySchema` (not `net_value_centavos`)
- [ ] `HeirInputSchema` uses `is_alive` (not `is_deceased`)
- [ ] All input schemas use `.strict()` — output schemas do NOT
- [ ] All `Option<T>` fields use `z.nullable()` — never `z.optional()`
- [ ] TypeScript `EffectiveGroup` type lists 5 full names (not `"G1"` etc.)

---

## §21 Edge Cases + Manual Review Flags

### §21.1 Edge Cases That Require MANUAL_REVIEW Flags

| Edge Case | Flag Emitted | Description |
|---|---|---|
| All G1 heirs disinherited, no representatives | `AllG1DisinheritedNoReps` | Conservative: does NOT promote G2 automatically. Manual attorney review required. |
| Collateral degree ambiguous (≥5) | `CollateralDegreeAmbiguous{degree}` | Art. 1010 limits to 5th degree. Degree 5 = just included; >5 = state inherits. |
| IC filiation unproven | `FiliationDisputed{heir_id}` | Engine marks as ineligible; attorney must verify filiation documents. |
| Adoption documents missing | `AdoptionDocumentsMissing{heir_id}` | RA 8552 §16 requires adoption decree. Without it, no G1 status. |
| Will formality suspect | `WillFormInvalid` | Engine cannot verify notarial/holographic formalities. |
| Illegitimate decedent, parentage disputed | `Art903AmbiguousParentage` | T14/T15 requires proof of filiation by parents. |
| All grandparents excluded (no G2) | `AllGrandparentsExcluded` | Unusual; may indicate input error. |

### §21.2 Additional Edge Cases (No Flag, Handled Automatically)

| Edge Case | Handling |
|---|---|
| Zero estate (E=0) | All distributions = ₱0; warnings emitted for each heir with ₱0 |
| Single heir | Full estate to that heir; no rounding issue |
| All heirs predeceased, no representatives | Escheat (I15); `EscheatLikely` warning |
| Art. 900 ¶2: cohabitation_years ≥ 5 despite articulo_mortis=true | Normal T12 (½ spouse); NOT reduced |
| Donation amount > entire estate | CollationDebt warning; imputation capped at 0 (heir gets nothing from estate) |
| Multiple co-heirs with equal fractional remainder (Hare-Niemeyer tie) | Stable sort by position in input array; first heir gets +1 centavo |
| Recursive representation depth > 10 | MANUAL_REVIEW flag; engine halts recursion at depth 10 |
| Will institution fractions sum > 1 | DomainValidation error; reject input |
| No will + `has_will=true` | Treated as intestate; `WillFormInvalid` warning |
| Adopted child later legitimated (before adoption) | Use latest legal status; if adoption decree valid, AdoptedChild status takes precedence |

### §21.3 Invariant Violation Responses

| Violated | Response |
|---|---|
| INV-1 (conservation) | Panic (`assert_eq!`); caught by catch_unwind → PanicRecovered error |
| INV-3 (legitime floor) | Panic; same recovery |
| INV-6 (per stirpes) | Panic |
| PINV-1 (max restarts) | MaxRestartsExceeded error returned to frontend |
| INV-8/9 | These are design invariants; violations indicate a code bug, should cause panic |

---

## Appendix A: Civil Code Quick Reference

| Article | Subject | Key Rule |
|---|---|---|
| Art. 774 | Succession definition | Transfer of rights and obligations at death |
| Art. 777 | Transmission | Rights transmitted at moment of death (simultaneous) |
| Art. 779–780 | Testate/intestate | Testate by will; intestate by operation of law |
| Art. 854 | Preterition | Complete omission annuls institutions |
| Art. 857–870 | Substitution | Simple, fideicommissary, reciprocal |
| Art. 872 | Condition stripping | Conditions on legitime void |
| Art. 887 | Compulsory heirs | G1 children, G2 parents, G3 spouse, G4 IC |
| Art. 888 | Collective LC legitime | LC collective = ½E |
| Art. 890 | Ascendant division | Split by paternal/maternal lines |
| Art. 892 | Spouse with LC | ¼ (1 LC) or equal child share (≥2 LC) |
| Art. 893 | Spouse with ascendants | ¼ of estate |
| Art. 894 | IC + spouse (Regime C) | Each group ⅓ |
| Art. 895 | IC cap rule | IC ≤ ½ LC per capita; Art. 895¶3 cap |
| Art. 896 | Ascendants + IC | IC flat ¼ collective |
| Art. 899 | Ascendants + IC + spouse | IC ¼, spouse ⅛ |
| Art. 900 | Spouse only | ½ (normal), ⅓ (articulo mortis w/ <5yr cohabitation) |
| Art. 901 | IC only | ½ of estate collective |
| Art. 903 | Illegitimate decedent | Parents ½ or ¼ (T14/T15) |
| Art. 906 | Testamentary freedom | Cannot impair legitimes |
| Art. 908 | Collation base | E_adj = E + collatable donations |
| Art. 909–910 | Imputation | Charged to legitime first, then FP |
| Art. 911 | Reduction order | Devises → institutions → donations (reverse chronological) |
| Art. 915–923 | Disinheritance | 22 grounds; valid conditions; reconciliation nullifies |
| Art. 960 | Intestate succession | Opens when no will or will partly invalid |
| Art. 970–977 | Representation | Per stirpes; triggers; collateral limit; renunciation exception |
| Art. 988 | IC intestate only | IC takes full estate if no other heirs |
| Art. 992 | Iron Curtain | IC cannot inherit from LC's relatives and vice versa |
| Art. 995 | Spouse intestate only | Full estate |
| Art. 996 | Spouse + LC | Spouse gets child's share |
| Art. 997 | Spouse + IC | ½ each |
| Art. 1001 | Spouse + siblings | ½ each |
| Art. 1006 | Full/half blood | Full blood sibling gets double half-blood share |
| Art. 1009–1010 | Other collaterals | Nearest degree takes all; 5-degree limit |
| Art. 1011 | Escheat | State inherits when no heirs |
| Art. 1015–1023 | Accretion | Vacant shares accrete to co-beneficiaries |
| Art. 1021 | Legitime vs FP vacancy | Legitime vacancy → scenario recompute; FP → accretion |
| Art. 1061–1077 | Collation | Collatability, valuation, imputation, inofficiousness |
| FC Art. 164 | Legitimate children | Born/conceived in valid marriage |
| FC Art. 165, 175 | Illegitimate children | Outside marriage; filiation proved |
| FC Art. 177–179 | Legitimation | Subsequent marriage; same rights as LC |
| FC Art. 189 | Adopted child | Full succession rights as legitimate child |

---

## Appendix B: Glossary

| Term | Definition |
|---|---|
| **Accretion** | The increase received by co-heirs when one heir cannot or will not accept their share |
| **Art. 895 Cap** | Rule limiting aggregate IC legitime to the disposable free portion after spouse is satisfied |
| **Articulo Mortis** | Marriage contracted in imminent danger of death |
| **Centavo** | 1/100 of a Philippine peso; the internal unit of computation |
| **ClassifiedHeir** | Internal pipeline type: HeirInput with classification metadata added |
| **Collation** | The return of inter vivos donations to the estate for legitime computation |
| **Compulsory Heir** | Heir who cannot be completely deprived of inheritance: G1, G2, G3 (spouse), G4 (IC) |
| **Decedent** | The person who died |
| **Devise** | Testamentary gift of real property |
| **DisinheritanceGround** | One of 22 enumerated causes for validly excluding a compulsory heir |
| **E_adj** | Collation-adjusted estate = net_estate + collatable_donations |
| **Escheat** | Transfer of intestate estate to the State when no legal heirs exist |
| **EffectiveGroup** | G1–G4 classification string output by the engine |
| **Filiation** | Legal parent-child relationship; proof required for IC (FC Art. 175) |
| **FP_disposable** | Free portion remaining after ALL compulsory legitimes are satisfied |
| **FP_gross** | Free portion before secondary compulsory heirs (spouse, IC) are subtracted |
| **G1** | Legitimate children/descendants (primary compulsory heirs) |
| **G2** | Legitimate ascendants (secondary compulsory heirs; excluded by G1) |
| **G3** | Surviving spouse |
| **G4** | Illegitimate children |
| **Hare-Niemeyer** | Method for rounding rational shares to integer centavos preserving total sum |
| **Institution** | Testamentary designation of an heir for a fraction or amount of the estate |
| **Inofficiousness** | State where testamentary dispositions or donations impair compulsory legitimes |
| **Iron Curtain Rule** | Art. 992: IC cannot inherit ab intestato from LC's relatives or vice versa |
| **Legacy** | Testamentary gift of personal (movable) property |
| **Legitime** | The portion of the estate that compulsory heirs cannot be deprived of |
| **Legitimation** | Process by which illegitimate children acquire legitimate status via parents' subsequent marriage |
| **ManualReviewFlag** | An output condition requiring attorney review before distribution |
| **Preterition** | Complete omission of a compulsory heir from the will (Art. 854) |
| **Regime A** | Legitime regime when G1 (descendants) are present |
| **Regime B** | Legitime regime when G2 (ascendants) are present, no G1 |
| **Regime C** | Legitime regime when neither G1 nor G2 are present |
| **Representation** | Right of representatives to step into deceased heir's position (per stirpes) |
| **ScenarioCode** | One of 30 codes (T1–T15, I1–I15) classifying the heir concurrence situation |
| **Substitution** | Testamentary designation of an alternate heir if primary cannot inherit |
| **Testate** | Succession governed by a valid will |
| **Underprovision** | Will allocates less than legitime to a compulsory heir; engine tops up automatically |
| **Unworthiness** | Legal incapacity to inherit due to Art. 1032 grounds (crime against decedent) |
| **Vacancy** | A share that cannot be distributed because the designated heir cannot/will not accept |
| **ValidationWarning** | A non-blocking advisory attached to the computation output |
