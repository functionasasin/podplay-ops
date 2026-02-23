# Data Model — Complete Type Definitions for the Inheritance Distribution Engine

**Aspect**: data-model
**Wave**: 5 (Synthesis)
**Depends On**: ALL Wave 1-4 aspects + computation-pipeline

---

## Overview

This document defines every type, struct, and enum required by the Philippine Inheritance Distribution Engine. These types are language-agnostic — they describe the data shape, not the implementation language. A developer should be able to translate these directly into any typed language (TypeScript, Rust, Python dataclasses, etc.).

### Design Principles

1. **Rational arithmetic**: All monetary intermediate computations use `Fraction` (exact rationals). Convert to centavo-precision `Money` only in Step 10 (finalize).
2. **Immutable pipeline**: Each pipeline step produces a new result struct; it never mutates inputs.
3. **Explicit over implicit**: Every legal category, cause, and scenario has an explicit enum value — no string-matching.
4. **Nullable = optional**: Fields marked with `?` are optional/nullable. All others are required.
5. **IDs are opaque strings**: `HeirId`, `DonationId`, `DispositionId`, `AssetId` are string identifiers for cross-referencing.

---

## 1. Primitive / Utility Types

```
// Exact rational arithmetic — mandatory for all intermediate computations
struct Fraction {
    numerator: BigInt,
    denominator: BigInt,
}
// Operations: add, subtract, multiply, divide, compare, to_decimal, to_money
// Invariant: always stored in lowest terms (GCD-reduced)

// Peso amount with centavo precision — used only for final output (Step 10)
struct Money {
    centavos: BigInt,   // ₱1.00 = 100, ₱1,234,567.89 = 123456789
}
// Display: "₱{centavos / 100}" with comma separators

// Opaque identifiers
type HeirId = String
type DonationId = String
type DispositionId = String
type AssetId = String
type PersonId = String

// Date (no time component needed)
type Date = ISO-8601 date string  // "2026-01-15"

// Paternal/maternal line for ascendants
enum LineOfDescent { PATERNAL, MATERNAL }
```

---

## 2. Core Input Types

### 2.1 EngineInput — Top-Level Input

```
struct EngineInput {
    net_distributable_estate: Money,    // Output of estate-tax engine (after tax)
    decedent: Decedent,                 // Decedent's civil status and legal context
    family_tree: List<Person>,          // All potential heirs (raw, pre-classification)
    will: Will?,                        // Testamentary dispositions (null = intestate)
    donations: List<Donation>,          // Inter vivos donations by decedent
    config: EngineConfig,               // Configurable legal parameters
}
```

### 2.2 Decedent

```
struct Decedent {
    id: PersonId,
    name: String,
    date_of_death: Date,

    // Civil status
    is_married: bool,                               // At time of death
    date_of_marriage: Date?,                         // If married
    marriage_solemnized_in_articulo_mortis: bool,    // Art. 900 ¶2
    was_ill_at_marriage: bool,                       // Art. 900 ¶2 condition 2
    illness_caused_death: bool,                      // Art. 900 ¶2 condition 3
    years_of_cohabitation: int,                      // Exception to articulo mortis (≥5 years)
    has_legal_separation: bool,                      // Court decree in effect at death

    // Legitimacy of the decedent themselves
    is_illegitimate: bool,              // Art. 903/992: affects ascendant rights + Iron Curtain
}
```

### 2.3 Person (Pre-Classification Input)

```
struct Person {
    id: PersonId,
    name: String,
    is_alive_at_succession: bool,
    relationship_to_decedent: Relationship,     // See enum below
    degree: int,                                // Degree of relationship (1=child/parent, 2=grandchild/grandparent, etc.)
    line: LineOfDescent?,                        // PATERNAL or MATERNAL (for ascendants)
    children: List<PersonId>,                   // For representation chain

    // Filiation (for illegitimate children)
    filiation_proved: bool,
    filiation_proof_type: FiliationProof?,

    // Marital status flags (for surviving spouse)
    is_guilty_party_in_legal_separation: bool,

    // Adoption
    adoption: Adoption?,

    // Disqualification inputs (from court/factual determinations)
    is_unworthy: bool,                          // Art. 1032
    unworthiness_condoned: bool,                // Art. 1033 (written condonation)
    has_renounced: bool,                        // Heir renounced inheritance
    filiation_contested_and_lost: bool,         // FC Art. 176: father proved non-filiation
}

enum Relationship {
    LEGITIMATE_CHILD,
    LEGITIMATED_CHILD,          // FC Art. 179
    ADOPTED_CHILD,              // RA 8552 / RA 11642
    ILLEGITIMATE_CHILD,
    SURVIVING_SPOUSE,
    LEGITIMATE_PARENT,
    LEGITIMATE_ASCENDANT,       // Grandparent or higher
    SIBLING,                    // Full or half
    NEPHEW_NIECE,               // Child of sibling
    OTHER_COLLATERAL,           // Within 5th degree
    STRANGER,                   // Not a legal heir
}

enum FiliationProof {
    BIRTH_CERTIFICATE,                  // FC Art. 172(1)
    FINAL_JUDGMENT,                     // FC Art. 172(1)
    PUBLIC_DOCUMENT_ADMISSION,          // FC Art. 172(2)
    PRIVATE_HANDWRITTEN_ADMISSION,      // FC Art. 172(2)
    OPEN_CONTINUOUS_POSSESSION,         // FC Art. 172 ¶2(1)
    OTHER_EVIDENCE,                     // FC Art. 172 ¶2(2), Rules of Court
}
```

### 2.4 Adoption

```
struct Adoption {
    decree_date: Date,
    regime: AdoptionRegime,             // Determined by decree_date
    adopter: PersonId,                  // Adopting parent (or couple)
    adoptee: PersonId,
    is_stepparent_adoption: bool,       // FC/RA 8552 Sec. 16 / RA 11642 Sec. 42
    biological_parent_spouse: PersonId?, // Bio parent married to adopter (ties preserved)
    is_rescinded: bool,
    rescission_date: Date?,
    rescission_grounds: String?,        // For narrative
}

enum AdoptionRegime {
    RA_8552,        // Domestic Adoption Act of 1998 — exclusivity rule
    RA_11642,       // Domestic Administrative Adoption and Alternative Child Care Act of 2022
                    // — Sec. 41 extends filiation to adopter's relatives
}
```

### 2.5 EngineConfig

```
struct EngineConfig {
    retroactive_ra_11642: bool,         // Default true: apply Sec. 41 extended filiation to pre-2022 adoptions
    max_pipeline_restarts: int,         // Default: count of heirs. Guard against infinite loops.
}
```

---

## 3. Will and Testamentary Dispositions

### 3.1 Will

```
struct Will {
    institutions: List<InstitutionOfHeir>,   // Universal heirs (fractional shares)
    legacies: List<Legacy>,                  // Particular — personal property
    devises: List<Devise>,                   // Particular — real property
    disinheritances: List<Disinheritance>,   // Arts. 915-923
    date_executed: Date,
    is_valid: bool,                          // Form validity (probated — outside engine scope)
}
```

### 3.2 InstitutionOfHeir

```
struct InstitutionOfHeir {
    id: DispositionId,
    heir: HeirReference,                // Who is instituted
    share: ShareSpec,                   // What portion
    conditions: List<Condition>,        // Art. 871 conditions
    substitutes: List<Substitute>,      // Arts. 857-863 substitutes
    is_residuary: bool,                 // "the rest of my estate to..."
}

enum ShareSpec {
    Fraction(Fraction),                 // "I leave ½ to A"
    EqualWithOthers,                    // "I leave to A, B, C equally" (Art. 846)
    EntireEstate,                       // "I leave everything to A"
    EntireFreePort,                     // "I leave the free portion to A"
    Unspecified,                        // Named as heir, no share → equal (Art. 846)
    Residuary,                          // "the remainder to A" (Art. 851)
}

struct HeirReference {
    person_id: PersonId?,               // Resolved person ID (null if class designation)
    name: String,                       // Name as written in will
    description: String?,               // Additional identifying info (Art. 843-845)
    is_collective: bool,                // "children of C" — Art. 847
    contrary_intent: bool,              // Testator intended collective as single slot
    class_designation: ClassDesignation?,  // For class beneficiaries
}

struct ClassDesignation {
    class_description: String,          // "the poor of Makati"
    amount_or_share: ShareSpec,
    // Resolution handled by executor, not engine — engine flags for manual handling
}
```

### 3.3 Legacy (Personal Property Gift)

```
struct Legacy {
    id: DispositionId,
    legatee: HeirReference,
    property: LegacySpec,
    conditions: List<Condition>,
    substitutes: List<Substitute>,
    is_preferred: bool,                 // Art. 911: testator-designated preference in reduction
}

enum LegacySpec {
    FixedAmount(Money),                 // "I leave ₱2,000,000 to F"
    SpecificAsset(AssetId),             // "I leave my car to F"
    GenericClass(String, Money),        // "I leave gold worth ₱500,000 to F"
}
```

### 3.4 Devise (Real Property Gift)

```
struct Devise {
    id: DispositionId,
    devisee: HeirReference,
    property: DeviseSpec,
    conditions: List<Condition>,
    substitutes: List<Substitute>,
    is_preferred: bool,                 // Art. 911 preference
}

enum DeviseSpec {
    SpecificProperty(AssetId),                  // "I leave my house in Makati to F"
    FractionalInterest(AssetId, Fraction),      // "I leave ½ of my farm to F"
}
```

### 3.5 Conditions (Art. 871)

```
struct Condition {
    type: ConditionType,
    description: String,
    status: ConditionStatus,
}

enum ConditionType {
    SUSPENSIVE,         // Heir inherits only IF condition fulfilled
    RESOLUTORY,         // Heir inherits immediately, loses if condition occurs
    MODAL,              // Heir must fulfill a purpose/obligation (not a true condition)
}

enum ConditionStatus {
    PENDING,            // Not yet determined
    FULFILLED,          // Condition met
    FAILED,             // Condition failed
    NOT_APPLICABLE,     // Removed per Art. 872 or declared invalid
}
```

### 3.6 Substitutions (Arts. 857-863)

```
struct Substitute {
    type: SubstitutionType,
    substitute_heir: HeirReference,
    triggers: List<SubstitutionTrigger>,   // Art. 859: when substitute steps in
}

enum SubstitutionType {
    SIMPLE,             // Arts. 857, 859: substitute replaces original
    RECIPROCAL,         // Art. 861: co-heirs substitute each other
    FIDEICOMMISSARY,    // Art. 863: fiduciary preserves & transmits to second heir
}

enum SubstitutionTrigger {
    PREDECEASE,         // Heir died before testator
    RENUNCIATION,       // Heir refuses inheritance
    INCAPACITY,         // Heir cannot legally inherit
}

struct FideicommissarySubstitution {
    fiduciary: HeirReference,           // First heir — obligated to preserve
    fideicommissary: HeirReference,     // Second heir — ultimate beneficiary
    property_scope: ShareSpec,          // What must be preserved
    // Validity: (1) one degree only, (2) both alive at death, (3) express, (4) cannot burden legitime
}
```

### 3.7 Disinheritance (Arts. 915-923)

```
struct Disinheritance {
    heir_reference: HeirReference,              // Who is disinherited
    cause_code: DisinheritanceCause,            // Which Art. 919/920/921 ground
    cause_specified_in_will: bool,              // Art. 916: cause stated in will
    cause_proven: bool,                         // Art. 917: adjudicated as true (engine input)
    reconciliation_occurred: bool,              // Art. 922: post-offense reconciliation (engine input)
}

enum DisinheritanceCause {
    // Art. 919 — Children/descendants (8 causes, apply to BOTH legitimate and illegitimate)
    CHILD_ATTEMPT_ON_LIFE,                      // 919(1)
    CHILD_GROUNDLESS_ACCUSATION,                // 919(2)
    CHILD_ADULTERY_WITH_SPOUSE,                 // 919(3)
    CHILD_FRAUD_UNDUE_INFLUENCE,                // 919(4)
    CHILD_REFUSAL_TO_SUPPORT,                   // 919(5)
    CHILD_MALTREATMENT,                         // 919(6)
    CHILD_DISHONORABLE_LIFE,                    // 919(7)
    CHILD_CIVIL_INTERDICTION,                   // 919(8)

    // Art. 920 — Parents/ascendants (8 causes)
    PARENT_ABANDONMENT_CORRUPTION,              // 920(1)
    PARENT_ATTEMPT_ON_LIFE,                     // 920(2)
    PARENT_GROUNDLESS_ACCUSATION,               // 920(3)
    PARENT_ADULTERY_WITH_SPOUSE,                // 920(4)
    PARENT_FRAUD_UNDUE_INFLUENCE,               // 920(5)
    PARENT_LOSS_PARENTAL_AUTHORITY,             // 920(6)
    PARENT_REFUSAL_TO_SUPPORT,                  // 920(7)
    PARENT_ATTEMPT_ON_OTHER,                    // 920(8) — built-in reconciliation exception

    // Art. 921 — Spouse (6 causes)
    SPOUSE_ATTEMPT_ON_LIFE,                     // 921(1)
    SPOUSE_GROUNDLESS_ACCUSATION,               // 921(2)
    SPOUSE_FRAUD_UNDUE_INFLUENCE,               // 921(3)
    SPOUSE_CAUSE_LEGAL_SEPARATION,              // 921(4)
    SPOUSE_LOSS_PARENTAL_AUTHORITY,             // 921(5)
    SPOUSE_REFUSAL_TO_SUPPORT,                  // 921(6)
}
```

---

## 4. Donation (Inter Vivos Gifts)

```
struct Donation {
    id: DonationId,
    recipient_heir_id: HeirId?,                 // Null if stranger
    recipient_is_stranger: bool,
    value_at_time_of_donation: Money,           // Art. 1071: ALWAYS this value (not at-death)
    date: Date,                                 // For Art. 911(3) reverse-chrono reduction
    description: String,
    is_gratuitous: bool,                        // Must be gratuitous to be collatable

    // Collatability flags (Arts. 1061-1070)
    is_expressly_exempt: bool,                  // Art. 1062: donor provided exemption
    is_support_education_medical: bool,         // Art. 1067: automatically exempt
    is_customary_gift: bool,                    // Art. 1067: automatically exempt
    is_professional_expense: bool,              // Art. 1068: conditionally exempt
    professional_expense_parent_required: bool,  // Art. 1068: parent required collation
    professional_expense_imputed_savings: Money?, // Art. 1068: deduction for home-living
    is_joint_from_both_parents: bool,           // Art. 1072: split ½ to each estate
    is_to_child_spouse_only: bool,              // Art. 1066 ¶1: exempt
    is_joint_to_child_and_spouse: bool,         // Art. 1066 ¶2: ½ collatable
    is_wedding_gift: bool,                      // Art. 1070: special 1/10 FP threshold
    is_debt_payment_for_child: bool,            // Art. 1069: collatable
    is_election_expense: bool,                  // Art. 1069: collatable
    is_fine_payment: bool,                      // Art. 1069: collatable
}
```

---

## 5. Classified Heir (Pipeline Internal)

This is the enriched heir struct produced by Step 1 (classification) and progressively updated through the pipeline.

```
struct Heir {
    id: HeirId,
    name: String,

    // Classification
    raw_category: HeirCategory,                 // From input
    effective_category: EffectiveCategory,       // Computed from raw_category
    is_compulsory: bool,                        // Computed based on who else survives

    // Status
    is_alive: bool,
    is_eligible: bool,                          // Passes all disqualification gates

    // Filiation (illegitimate children only)
    filiation_proved: bool,
    filiation_proof_type: FiliationProof?,
    filiation_contested_and_lost: bool,         // FC Art. 176
    recognized_in_will: bool,                   // Whether the will itself recognizes the child

    // Unworthiness (Art. 1032)
    is_unworthy: bool,
    unworthiness_condoned: bool,                // Art. 1033 (written)

    // Disinheritance (set in Step 6)
    is_disinherited: bool,
    disinheritance_valid: bool,

    // Renunciation
    has_renounced: bool,

    // Adoption
    adoption: Adoption?,
    has_valid_adoption: bool,                   // Derived: adoption != null AND not rescinded before death
    adoption_regime: AdoptionRegime?,
    is_stepparent_adoptee: bool,
    biological_parent_tie_preserved: PersonId?, // Bio parent whose ties survive (stepparent adoption)

    // Spouse-specific
    legal_separation_guilty: bool,              // Art. 1002
    articulo_mortis_marriage: bool,             // Art. 900 ¶2
    cohabitation_over_5_years: bool,            // Exception to articulo mortis

    // Ascendant-specific
    degree_from_decedent: int,                  // 1=parent, 2=grandparent, etc.
    line: LineOfDescent?,                       // PATERNAL or MATERNAL

    // Collateral-specific
    blood_type: BloodType?,                     // FULL or HALF (Art. 967/1006)
    sibling_parent_side: LineOfDescent?,        // For half-blood siblings

    // Representation (set in Step 2)
    representation_trigger: RepresentationTrigger?,
    represented_by: List<HeirId>,               // Representatives (empty if in own right)
    represents: HeirId?,                        // Person this heir represents (null if own right)
    inherits_by: InheritanceMode,               // OWN_RIGHT or REPRESENTATION
    line_ancestor: HeirId?,                     // Original child of decedent this line traces to

    // Family links
    children: List<HeirId>,                     // For representation chain
    prior_donations: Money,                     // For collation (Art. 910/1061)
}

enum HeirCategory {
    LEGITIMATE_CHILD,
    LEGITIMATED_CHILD,
    ADOPTED_CHILD,
    ILLEGITIMATE_CHILD,
    SURVIVING_SPOUSE,
    LEGITIMATE_PARENT,
    LEGITIMATE_ASCENDANT,
}

enum EffectiveCategory {
    LEGITIMATE_CHILD_GROUP,         // Includes legitimate, legitimated, adopted
    ILLEGITIMATE_CHILD_GROUP,
    SURVIVING_SPOUSE_GROUP,
    LEGITIMATE_ASCENDANT_GROUP,     // Includes parents and higher ascendants
}

enum InheritanceMode {
    OWN_RIGHT,          // Heir inherits directly
    REPRESENTATION,     // Heir represents a predeceased/excluded person (Art. 970)
}

enum RepresentationTrigger {
    PREDECEASE,         // Arts. 981-982
    DISINHERITANCE,     // Art. 923
    INCAPACITY,         // Art. 1035
    UNWORTHINESS,       // Art. 1035
    // Note: RENUNCIATION is NOT a trigger (Art. 977)
}

enum BloodType { FULL, HALF }
```

---

## 6. Pipeline Step Results

### 6.1 LineInfo (Step 2 Output)

```
struct LineInfo {
    original_heir: HeirId,                      // The child of decedent (may be dead/excluded)
    effective_category: EffectiveCategory,       // LEGITIMATE_CHILD_GROUP or ILLEGITIMATE_CHILD_GROUP
    mode: InheritanceMode,                       // OWN_RIGHT or REPRESENTATION
    representatives: List<HeirId>,              // Who actually receives (empty if original inherits)
    line_share: Fraction?,                       // Computed in Step 5/7
}

struct SiblingLine {
    original_sibling: HeirId,
    blood_type: BloodType,
    mode: InheritanceMode,
    representatives: List<HeirId>,              // Nephews/nieces if represented
}
```

### 6.2 SuccessionResult (Step 3 Output)

```
struct SuccessionResult {
    succession_type: SuccessionType,
    scenario_code: String,                      // "T1"-"T15" or "I1"-"I15" or "MIXED"
    eligible_heirs: List<Heir>,                 // Heirs in the active pool
    n: int,                                     // Count of legitimate child lines
    m: int,                                     // Count of illegitimate child lines
    has_spouse: bool,
    has_ascendants: bool,
    has_collaterals: bool,
}

enum SuccessionType {
    TESTATE,                    // Will disposes of entire estate
    INTESTATE,                  // No will
    MIXED,                      // Will disposes of only part; remainder intestate
    INTESTATE_BY_PRETERITION,   // Will annulled by Art. 854
}

enum TestateScenario {
    T1,   // Legitimate children only (Art. 888)
    T2,   // Legitimate children + spouse (Art. 892)
    T3,   // Legitimate children + spouse (n≥2) (Art. 892)
    T4,   // Legitimate + illegitimate children (Art. 895)
    T5a,  // LC + IC + spouse (n=1) (Arts. 892, 895)
    T5b,  // LC + IC + spouse (n≥2) (Arts. 892, 895)
    T6,   // Legitimate ascendants only (Art. 889)
    T7,   // Legitimate ascendants + spouse (Art. 893)
    T8,   // Legitimate ascendants + IC (Art. 896)
    T9,   // Legitimate ascendants + IC + spouse (Art. 899)
    T10,  // IC + spouse (Art. 894)
    T11,  // IC only (Art. 901)
    T12,  // Spouse only (Art. 900)
    T13,  // No compulsory heirs — entire estate is free portion
    T14,  // Illegitimate decedent — parents only (Art. 903)
    T15,  // Illegitimate decedent — parents + spouse (Art. 903)
}

enum IntestateScenario {
    I1,   // Legitimate children only (Art. 980)
    I2,   // Legitimate children + spouse (Arts. 994, 996)
    I3,   // Legitimate + illegitimate children (Arts. 983, 895)
    I4,   // Legitimate + illegitimate + spouse (Arts. 999, 983, 895)
    I5,   // Legitimate ascendants only (Arts. 985, 986, 987)
    I6,   // Legitimate ascendants + spouse (Art. 997)
    I7,   // Illegitimate children only (Art. 988)
    I8,   // Illegitimate children + spouse (Art. 998)
    I9,   // Legitimate ascendants + IC (Art. 991)
    I10,  // Legitimate ascendants + IC + spouse (Art. 1000)
    I11,  // Surviving spouse only (Art. 995)
    I12,  // Surviving spouse + siblings (Art. 1001)
    I13,  // Collateral relatives — siblings/nephews/nieces (Arts. 1003-1008)
    I14,  // Collateral relatives — other within 5th degree (Arts. 1009-1010)
    I15,  // No heirs — State (Arts. 1011-1014)
}
```

### 6.3 EstateBaseResult (Step 4 Output)

```
struct EstateBaseResult {
    net_estate_at_death: Money,                 // Input value
    total_collatable_donations: Money,          // Sum of collatable donation values
    estate_base: Money,                         // net_estate + collatable_donations (Art. 908)
    collatable_donations: List<CollatableDonation>,
    donations_to_legitime: List<CollatableDonation>,   // Heir donations → charged to their legitime
    donations_to_fp: List<CollatableDonation>,         // Stranger donations → charged to FP
}

struct CollatableDonation {
    donation: Donation,
    collatable_amount: Money,                   // At donation-time value (Art. 1071)
    charged_to: ChargeTarget,                   // LEGITIME or FREE_PORTION
    donee: HeirId?,
}

enum ChargeTarget { LEGITIME, FREE_PORTION }
```

### 6.4 LegitimeResult (Step 5 Output)

```
struct LegitimeResult {
    estate_base: Fraction,                      // As rational number
    per_heir_legitimes: List<HeirLegitime>,
    total_legitime: Fraction,
    fp_gross: Fraction,                         // Before spouse/IC deduction
    fp_after_spouse: Fraction,                  // After spouse's FP-sourced legitime
    fp_disposable: Fraction,                    // After all FP-sourced heirs — testator's freedom
    cap_applied: bool,                          // Art. 895 ¶3 cap triggered
    cap_details: CapDetails?,                   // Details if cap applied
}

struct HeirLegitime {
    heir_id: HeirId,
    legitime_fraction: Fraction,                // Share as fraction of estate_base
    legitime_source: LegitimeSource,            // Where the legitime comes from
    legal_basis: String,                        // Article citation
}

enum LegitimeSource {
    DIRECT,             // Legitime comes from the ½ collective (Regime A/B/C)
    FREE_PORTION,       // Spouse/IC in Regime A/B — sourced from FP
}

struct CapDetails {
    uncapped_ic_total: Fraction,                // What ICs would get without cap
    cap_amount: Fraction,                       // FP_remaining after spouse (the actual cap)
    reduction_per_ic: Fraction,                 // How much each IC was reduced
    legal_basis: String,                        // "Art. 895 ¶3"
}
```

### 6.5 FreePortionResult (Step 5, Extended)

```
struct FreePortionResult {
    gross: Fraction,                            // FP before spouse/IC deduction
    after_spouse: Fraction,                     // FP after spouse's legitime deducted
    after_ic: Fraction,                         // FP after IC legitime deducted = disposable
    disposable: Fraction,                       // Final: testator can freely dispose of this
    testamentary_consumed: Fraction?,           // Amount consumed by will dispositions (if testate)
    undisposed: Fraction?,                      // disposable - consumed (passes intestate if mixed)
    is_inofficious: bool,                       // Dispositions exceed disposable
    inofficious_excess: Fraction?,              // Excess amount
}
```

### 6.6 ValidationResult (Step 6 Output)

```
struct ValidationResult {
    valid: bool,                                // True if will needs no correction
    corrections: List<Correction>,              // Ordered list of corrections applied
    succession_type: SuccessionType,            // May change (e.g., INTESTATE_BY_PRETERITION)
    flags: List<ManualFlag>,                    // Scenarios requiring human decision
    restart_required: bool,                     // True if pipeline must restart from Step 3
    restart_reason: String?,                    // Why restart is needed
}

enum Correction {
    PRETERITION_ANNULMENT {
        preterited_heirs: List<HeirId>,
        through_representation: Map<HeirId, List<HeirId>>,
        surviving_legacies: List<DispositionId>,
        surviving_devises: List<DispositionId>,
    },
    DISINHERITANCE_INVALID {
        heir_id: HeirId,
        reason: String,                         // e.g., "No cause specified (Art. 916)"
        effect: DisinheritanceOutcome,
    },
    UNDERPROVISION {
        heir_id: HeirId,
        will_gives: Fraction,
        entitled_to: Fraction,
        deficit: Fraction,
        recovery_sources: List<RecoverySource>,
    },
    INOFFICIOUS_REDUCTION {
        excess: Fraction,
        reductions: List<Reduction>,
    },
    INDIVISIBLE_REALTY {
        property: AssetId,
        result: IndivisibleRealtyResult,
    },
    CONDITION_STRIPPED {
        heir_id: HeirId,
        conditions: List<Condition>,
        reason: String,                         // "Art. 872: conditions on legitime deemed not imposed"
    },
}

struct RecoverySource {
    source_type: RecoverySourceType,
    amount: Fraction,
}

enum RecoverySourceType {
    UNDISPOSED_ESTATE,              // Art. 855 source 1
    EXCESS_COMPULSORY_HEIRS,        // Art. 855 source 2 (pro rata)
    VOLUNTARY_HEIRS,                // Art. 855 source 3 (pro rata)
}

struct Reduction {
    disposition_id: DispositionId,
    disposition_type: DispositionType,
    original: Fraction,
    reduction: Fraction,
    remaining: Fraction,
    phase: ReductionPhase,
    legal_basis: String,
}

enum ReductionPhase {
    PHASE_1A_NON_PREFERRED_LEGACIES,    // Art. 911 — pro rata
    PHASE_1B_PREFERRED_LEGACIES,        // Art. 911 — testator-designated
    PHASE_2_VOLUNTARY_INSTITUTIONS,     // Art. 911 — voluntary heirs
    PHASE_3_DONATIONS,                  // Art. 911 — reverse-chronological
}

struct IndivisibleRealtyResult {
    property_awarded_to: AwardTarget,
    cash_reimbursement: CashReimbursement,
    narrative: String,
}

struct CashReimbursement {
    from: AwardTarget,
    to: AwardTarget,
    amount: Fraction,
}

enum AwardTarget {
    DEVISEE(HeirId),
    COMPULSORY_HEIRS(List<HeirId>),
}

struct ManualFlag {
    code: ManualFlagCode,
    article: String,
    description: String,
}

enum ManualFlagCode {
    GRANDPARENT_OF_ILLEGITIMATE,        // Art. 903: "parents" not "ascendants"
    CROSS_CLASS_ACCRETION,              // Art. 1018 vs Art. 968 ambiguity
    RESERVA_TRONCAL,                    // Art. 891 asset-level encumbrance
    COLLATION_DISPUTE,                  // Art. 1077 uncertain item
    RA_11642_RETROACTIVITY,             // Pre-2022 adoption + Sec. 41
    ARTICULO_MORTIS,                    // Art. 900 ¶2 conditions detected
}
```

### 6.7 DisinheritanceEffect (Step 6 Sub-Result)

```
struct DisinheritanceEffect {
    heir_id: HeirId,
    outcome: DisinheritanceOutcome,
    representatives: List<HeirId>?,             // Art. 923 descendants (if any)
    line_count_change: int,                     // 0 if represented, -1 if not
    scenario_change: bool,                      // True if scenario needs re-evaluation
    usufruct_bar: HeirId?,                      // Disinherited parent barred (Art. 923 ¶2)
    corrections: List<Correction>,              // For invalid disinheritance (Art. 918)
}

enum DisinheritanceOutcome {
    VALID_WITH_REPRESENTATION,
    VALID_NO_REPRESENTATION,
    INVALID_NO_CAUSE_SPECIFIED,                 // Art. 916
    INVALID_CAUSE_NOT_PROVEN,                   // Art. 917
    INVALID_CAUSE_NOT_IN_CODE,                  // Wrong article for heir type
    INVALID_RECONCILIATION,                     // Art. 922
}

struct UnworthinessGround {
    ground_code: UnworthinessCause,             // Art. 1032 ground
    condoned_in_writing: bool,                  // Art. 1033
    known_when_will_made: bool,                 // Art. 1033 alternative
}

// Art. 1032 grounds (for overlap with disinheritance)
enum UnworthinessCause {
    CONVICTED_ATTEMPT_ON_LIFE,                  // 1032(1)
    ACCUSATION_OF_CRIME_PUNISHABLE,             // 1032(2)
    ADULTERY_CONCUBINAGE_WITH_SPOUSE,           // 1032(3)
    FRAUD_VIOLENCE_INTIMIDATION_ON_WILL,        // 1032(4)
    FALSIFICATION_FORGED_WILL,                  // 1032(5)
}
```

### 6.8 PreteritionResult (Step 6 Sub-Result)

```
struct PreteritionResult {
    is_preterition: bool,
    preterited_heirs: List<HeirId>,
    through_representation: Map<HeirId, List<HeirId>>,
    annulment_scope: AnnulmentScope,
    surviving_dispositions: SurvivingDispositions?,
}

enum AnnulmentScope {
    TOTAL_INSTITUTION,          // Art. 854: ALL institutions voided
    PARTIAL,                    // Art. 918: only insofar as prejudices heir
    NONE,
}

struct SurvivingDispositions {
    legacies: List<DispositionId>,
    devises: List<DispositionId>,
    total_value: Fraction,
    remaining_estate: Fraction,             // Estate available for intestate distribution
    reductions: List<Reduction>,            // Reductions applied for inofficiousness
}
```

### 6.9 DistributionResult (Step 7 Output)

```
struct DistributionResult {
    per_heir_shares: List<HeirShare>,
    distribution_mode: DistributionMode,
}

struct HeirShare {
    heir_id: HeirId,
    from_legitime: Fraction,                // Compulsory portion
    from_free_portion: Fraction,            // Voluntary portion (from will)
    from_intestate: Fraction,               // If mixed succession
    total: Fraction,
    conditions: List<Condition>,            // Surviving conditions (after Art. 872 strip)
    fideicommissary: FideicommissarySubstitution?,
    disposition_type: DispositionType,
}

enum DispositionType {
    INSTITUTION,            // Universal heir (fractional share)
    LEGACY,                 // Particular — personal property
    DEVISE,                 // Particular — real property
    INTESTATE,              // From intestate fallback
    LEGITIME_ONLY,          // Compulsory heir not in will, gets only legitime
}

enum DistributionMode {
    TESTATE,                // Full testate distribution
    INTESTATE,              // Full intestate distribution
    MIXED,                  // Surviving legacies/devises + intestate for remainder
}

enum TestatorIntent {
    SOLE_HEIRS,             // Art. 852: intended named heirs to take everything
    PARTIAL,                // Art. 851: named some heirs, left rest undisposed
    AMBIGUOUS,              // Cannot determine — flag for executor/court
}
```

### 6.10 CollationResult (Step 8 Output)

```
struct CollationResult {
    collation_adjusted_estate: Fraction,
    collatable_donations: List<DonationId>,
    non_collatable_donations: List<DonationId>,
    collatable_sum: Fraction,

    imputation_results: List<ImputationResult>,
    stranger_donations_total: Fraction,
    excess_over_legitime_total: Fraction,

    inofficious: bool,
    inofficious_amount: Fraction,
    donation_reductions: List<DonationReduction>?,

    disputes: List<CollationDispute>,
    partition_allocations: List<PartitionAllocation>,
}

struct ImputationResult {
    heir_id: HeirId,
    gross_entitlement: Fraction,                // Legitime or intestate share (on adjusted estate)
    donations_received: Fraction,               // Total donations at time given
    charged_to_legitime: Fraction,              // Min(donations, legitime)
    charged_to_fp: Fraction,                    // Excess over legitime
    net_from_estate: Fraction,                  // gross_entitlement - donations (≥ 0)
    is_excess: bool,                            // Donations > entitlement
    excess_amount: Fraction,                    // Donations - entitlement (if excess)
}

struct DonationReduction {
    donation_id: DonationId,
    original_value: Fraction,
    reduced_by: Fraction,
    remaining_value: Fraction,
    return_required: Fraction,                  // Donee must return this to estate
}

struct PartitionAllocation {
    heir_id: HeirId,
    total_entitlement: Fraction,
    already_received: Fraction,                 // Donations at time given (Art. 1071)
    from_actual_estate: Fraction,               // total_entitlement - already_received (≥ 0)
    partition_note: String?,                    // "Art. 1074: co-heirs receive cash equivalent"
}

struct CollationDispute {
    donation_id: DonationId,
    reason: String,
    with_collation: DistributionResult,
    without_collation: DistributionResult,
    security_required: Fraction,                // Difference between the two computations
}
```

### 6.11 VacancyResolution (Step 9 Output)

```
struct VacancyResolutionResult {
    vacancies: List<VacantShare>,
    resolutions: List<AccretionResult>,
    restart_required: bool,                     // Art. 1021/969 scenario re-evaluation needed
    restart_reason: String?,
}

struct VacantShare {
    heir_id: HeirId,
    cause: VacancyCause,
    amount: Fraction,
    source: ShareSource,
    disposition_id: DispositionId?,             // Null for intestate
    charges: List<Charge>,                      // Art. 1020: carried obligations
}

enum VacancyCause {
    PREDECEASE,
    RENUNCIATION,
    INCAPACITY,
    UNWORTHINESS,
}

enum ShareSource {
    LEGITIME,
    FREE_PORTION,
    INTESTATE,
}

struct Charge {
    description: String,
    amount: Fraction?,
    legal_basis: String,
}

struct AccretionResult {
    original_vacancy: VacantShare,
    resolution_method: ResolutionMethod,
    redistributions: List<Redistribution>,
}

enum ResolutionMethod {
    SUBSTITUTION,                   // Art. 859/1022(1)
    REPRESENTATION,                 // Arts. 970-977
    ACCRETION_FP,                  // Arts. 1016-1019, 1021 ¶1 (free portion accretion)
    ACCRETION_INTESTATE,           // Art. 1018 (intestate accretion)
    OWN_RIGHT_LEGITIME,            // Art. 1021 ¶2 (vacant legitime → scenario re-evaluation)
    INTESTATE_FALLBACK,            // Art. 1022(2)
    SCENARIO_RECOMPUTE,            // Art. 969 (total repudiation)
    ESCHEAT,                       // Art. 1011 (to the State)
}

struct Redistribution {
    recipient: RedistributionTarget,
    amount: Fraction,
    basis: String,                              // Legal citation
    inherited_charges: List<Charge>,            // Art. 1020
    inherited_conditions: List<Condition>,
}

enum RedistributionTarget {
    HEIR(HeirId),
    RECOMPUTE_SCENARIO,             // Pipeline restart from Step 3
    STATE,                          // Art. 1011 escheat
    INTESTATE,                      // Falls to intestate distribution
}
```

### 6.12 CollateralHeir (For Intestate Collateral Distribution)

```
struct CollateralHeir {
    heir_id: HeirId,
    collateral_degree: int,                     // 2=sibling, 3=nephew, 4=cousin, etc.
    is_sibling_of_decedent: bool,
    is_child_of_sibling: bool,                  // Nephew/niece
    blood_type: BloodType,                      // FULL or HALF (Art. 967/1006)
    sibling_parent_side: LineOfDescent?,         // PATERNAL or MATERNAL (half-blood)
}
```

---

## 7. Engine Output Types

### 7.1 EngineOutput — Top-Level Output

```
struct EngineOutput {
    per_heir_shares: List<InheritanceShare>,     // Exact peso amount per heir
    narratives: List<HeirNarrative>,             // Plain-English explanation per heir
    computation_log: ComputationLog,             // Step-by-step audit trail
    warnings: List<ManualFlag>,                  // Manual review flags
    succession_type: SuccessionType,
    scenario_code: String,                       // "T1"-"T15" or "I1"-"I15" or "MIXED"
}
```

### 7.2 InheritanceShare

```
struct InheritanceShare {
    heir_id: HeirId,
    heir_name: String,
    heir_category: EffectiveCategory,
    inherits_by: InheritanceMode,               // OWN_RIGHT or REPRESENTATION
    represents: HeirId?,                        // If inheriting by representation

    // Amount breakdown (all in Money — centavo precision)
    from_legitime: Money,                       // Compulsory portion
    from_free_portion: Money,                   // From will (testamentary)
    from_intestate: Money,                      // If mixed succession
    total: Money,                               // Sum of all sources

    // Fraction breakdown (for audit/display)
    legitime_fraction: String,                  // e.g., "1/4" — human-readable
    fp_fraction: String?,
    intestate_fraction: String?,

    // Metadata
    legal_basis: List<String>,                  // Article citations
    conditions: List<Condition>,                // Surviving conditions (post-Art. 872)
    fideicommissary: FideicommissarySubstitution?,
    disposition_type: DispositionType,

    // Collation adjustment
    donations_imputed: Money,                   // Donations already received (deducted)
    gross_entitlement: Money,                   // Before donation deduction
    net_from_estate: Money,                     // What the heir actually receives from the estate
}
```

### 7.3 HeirNarrative

```
struct HeirNarrative {
    heir_id: HeirId,
    heir_name: String,
    heir_category_label: String,                // e.g., "illegitimate child", "surviving spouse"
    text: String,                               // The complete narrative paragraph
    // Template variables embedded in text:
    // - Category and why
    // - Legitime share with legal basis
    // - Free portion share (if any) and why
    // - Collation adjustments (if any)
    // - Total inheritance (peso amount)
    // - Key article citations
}
```

### 7.4 ComputationLog

```
struct ComputationLog {
    steps: List<StepLog>,
    total_restarts: int,
    final_scenario: String,
    rational_arithmetic_used: bool,             // Always true
}

struct StepLog {
    step_number: int,                           // 1-10
    step_name: String,                          // e.g., "CLASSIFY_HEIRS"
    inputs_summary: String,                     // Key inputs for this step
    outputs_summary: String,                    // Key outputs from this step
    decisions: List<String>,                    // Significant decisions made
    legal_citations: List<String>,              // Articles applied
    warnings: List<ManualFlag>,                 // Flags raised in this step
}
```

---

## 8. Type Relationship Diagram

```
EngineInput
├── Decedent
├── List<Person>
│   └── Adoption?
│       └── AdoptionRegime
├── Will?
│   ├── List<InstitutionOfHeir>
│   │   ├── HeirReference
│   │   │   └── ClassDesignation?
│   │   ├── ShareSpec
│   │   ├── List<Condition>
│   │   └── List<Substitute>
│   │       └── FideicommissarySubstitution?
│   ├── List<Legacy>
│   │   └── LegacySpec
│   ├── List<Devise>
│   │   └── DeviseSpec
│   └── List<Disinheritance>
│       └── DisinheritanceCause
├── List<Donation>
└── EngineConfig

Pipeline (internal):
Step 1 → List<Heir> (classified)
Step 2 → List<LineInfo>, List<SiblingLine>
Step 3 → SuccessionResult (TestateScenario | IntestateScenario)
Step 4 → EstateBaseResult
Step 5 → LegitimeResult + FreePortionResult
Step 6 → ValidationResult
         ├── PreteritionResult
         ├── DisinheritanceEffect
         └── List<Correction> (Reduction, IndivisibleRealtyResult, etc.)
Step 7 → DistributionResult (List<HeirShare>)
Step 8 → CollationResult (ImputationResult, PartitionAllocation, CollationDispute)
Step 9 → VacancyResolutionResult (VacantShare, AccretionResult, Redistribution)
Step 10 → EngineOutput
          ├── List<InheritanceShare>
          ├── List<HeirNarrative>
          ├── ComputationLog
          └── List<ManualFlag>
```

---

## 9. Enum Summary

| Enum | Values | Source |
|------|--------|--------|
| `LineOfDescent` | PATERNAL, MATERNAL | Art. 890/987 |
| `Relationship` | 11 values | Art. 887, general |
| `FiliationProof` | 6 values | FC Art. 172 |
| `AdoptionRegime` | RA_8552, RA_11642 | Adoption statutes |
| `ShareSpec` | 6 variants | Arts. 846-853 |
| `LegacySpec` | 3 variants | Testate law |
| `DeviseSpec` | 2 variants | Testate law |
| `ConditionType` | SUSPENSIVE, RESOLUTORY, MODAL | Art. 871 |
| `ConditionStatus` | 4 values | Art. 872 |
| `SubstitutionType` | SIMPLE, RECIPROCAL, FIDEICOMMISSARY | Arts. 857-863 |
| `SubstitutionTrigger` | 3 values | Art. 859 |
| `DisinheritanceCause` | 22 values | Arts. 919-921 |
| `HeirCategory` | 7 values | Art. 887 |
| `EffectiveCategory` | 4 values | Engine design |
| `InheritanceMode` | OWN_RIGHT, REPRESENTATION | Art. 970 |
| `RepresentationTrigger` | 4 values (no renunciation) | Arts. 970-977 |
| `BloodType` | FULL, HALF | Art. 967 |
| `SuccessionType` | 4 values | Arts. 840, 960 |
| `TestateScenario` | T1-T15 | Arts. 888-903 |
| `IntestateScenario` | I1-I15 | Arts. 960-1014 |
| `ChargeTarget` | LEGITIME, FREE_PORTION | Arts. 909-910 |
| `LegitimeSource` | DIRECT, FREE_PORTION | Arts. 892-895 |
| `AnnulmentScope` | 3 values | Arts. 854, 918 |
| `DispositionType` | 5 values | Engine design |
| `DistributionMode` | TESTATE, INTESTATE, MIXED | Art. 960 |
| `TestatorIntent` | 3 values | Arts. 851-852 |
| `DisinheritanceOutcome` | 6 values | Arts. 915-922 |
| `UnworthinessCause` | 5 values | Art. 1032 |
| `VacancyCause` | 4 values | Arts. 970-977, 1032 |
| `ShareSource` | LEGITIME, FREE_PORTION, INTESTATE | Engine design |
| `ResolutionMethod` | 8 values | Arts. 859, 970, 1016-1022 |
| `RedistributionTarget` | 4 variants | Engine design |
| `ReductionPhase` | 4 values | Art. 911 |
| `RecoverySourceType` | 3 values | Art. 855 |
| `ManualFlagCode` | 6 values | Various gray areas |

**Total**: 34 enums, 42 structs.

---

## 10. Cross-Reference: Which Analysis Defined Each Type

| Type | Primary Source | Refined In |
|------|---------------|------------|
| `EngineInput`, `EngineOutput` | computation-pipeline | data-model (this) |
| `Decedent` | illegitimate-children-rights, legitime-surviving-spouse | data-model |
| `Person` | compulsory-heirs-categories | data-model |
| `Heir` | compulsory-heirs-categories | representation-rights, adopted-children-rights, illegitimate-children-rights, legitime-surviving-spouse |
| `Will`, `InstitutionOfHeir`, `Legacy`, `Devise` | testate-institution | data-model |
| `ShareSpec`, `LegacySpec`, `DeviseSpec` | testate-institution | — |
| `Condition`, `Substitute`, `FideicommissarySubstitution` | testate-institution | — |
| `Disinheritance`, `DisinheritanceCause` | disinheritance-rules | — |
| `DisinheritanceEffect`, `DisinheritanceOutcome` | disinheritance-rules | — |
| `UnworthinessGround`, `UnworthinessCause` | disinheritance-rules | — |
| `Donation` | free-portion-rules, collation | collation (18-field version) |
| `LineInfo`, `SiblingLine` | representation-rights | intestate-order |
| `SuccessionResult`, `TestateScenario`, `IntestateScenario` | heir-concurrence-rules | intestate-order, computation-pipeline |
| `EstateBaseResult` | computation-pipeline | — |
| `LegitimeResult`, `HeirLegitime`, `CapDetails` | legitime-table | computation-pipeline |
| `FreePortionResult` | free-portion-rules | — |
| `ValidationResult`, `Correction` | testate-validation | — |
| `PreteritionResult`, `AnnulmentScope`, `SurvivingDispositions` | preterition | — |
| `Reduction`, `IndivisibleRealtyResult`, `CashReimbursement` | testate-validation | — |
| `ManualFlag`, `ManualFlagCode` | computation-pipeline | — |
| `DistributionResult`, `HeirShare` | computation-pipeline | testate-institution |
| `CollationResult`, `ImputationResult`, `DonationReduction` | collation | — |
| `PartitionAllocation`, `CollationDispute` | collation | — |
| `VacantShare`, `AccretionResult`, `Redistribution` | accretion-rules | — |
| `CollateralHeir` | intestate-order | — |
| `InheritanceShare`, `HeirNarrative` | computation-pipeline | data-model |
| `ComputationLog`, `StepLog` | computation-pipeline | data-model |
| `Fraction`, `Money` | computation-pipeline | data-model |

---

## 11. Validation Rules

These invariants must hold across the data model:

1. **Heir effective_category derivation**: `LEGITIMATE_CHILD | LEGITIMATED_CHILD | ADOPTED_CHILD → LEGITIMATE_CHILD_GROUP`; `ILLEGITIMATE_CHILD → ILLEGITIMATE_CHILD_GROUP`; `SURVIVING_SPOUSE → SURVIVING_SPOUSE_GROUP`; `LEGITIMATE_PARENT | LEGITIMATE_ASCENDANT → LEGITIMATE_ASCENDANT_GROUP`.

2. **Mutual exclusion**: A person has exactly one `raw_category`. Groups 1 (LEGITIMATE_CHILD_GROUP) and 4 (LEGITIMATE_ASCENDANT_GROUP) are mutually exclusive — if any descendant survives, no ascendant is a compulsory heir.

3. **Concurrence**: Groups 3 (SURVIVING_SPOUSE_GROUP) and 2 (ILLEGITIMATE_CHILD_GROUP) always concur with any other group present.

4. **Sum invariant**: `∑ per_heir_shares.total == net_distributable_estate` (centavo-exact after Step 10 rounding).

5. **Legitime floor**: For every compulsory heir `h`, `h.from_legitime >= h.legitime_fraction * estate_base` (after collation adjustment). Violated only by valid disinheritance.

6. **Rational precision**: All `Fraction` fields must be exact (no floating-point). Only `Money` fields may be approximate (centavo-rounded).

7. **Scenario consistency**: The `scenario_code` determines which heirs participate and what fractions apply. Changing the heir pool requires re-running Step 3.

8. **Art. 895 ¶3 cap**: In testate scenarios T4/T5a/T5b, `total_ic_legitime <= fp_after_spouse`. If exceeded, each IC's share is reduced proportionally.

9. **Disinheritance cause validation**: `DisinheritanceCause` must match heir type — Art. 919 causes for children only, Art. 920 for parents only, Art. 921 for spouse only.

10. **Representation non-trigger**: `RepresentationTrigger` never includes RENUNCIATION (Art. 977).

---

*Compiled from all 20 analysis files. Primary structural sources: computation-pipeline, compulsory-heirs-categories, testate-institution, disinheritance-rules, collation, accretion-rules, preterition, testate-validation, free-portion-rules, intestate-order, representation-rights, adopted-children-rights, illegitimate-children-rights, legitime-table, legitime-with-illegitimate, legitime-surviving-spouse, legitime-ascendants.*
