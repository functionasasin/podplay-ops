# Philippine Inheritance Distribution Engine — Software Specification

**Version**: 1.0
**Date**: 2026-02-23
**Status**: Complete
**Source**: Synthesized from 24 analysis files in `loops/inheritance-reverse/analysis/`

---

## Table of Contents

1. [Overview and Purpose](#1-overview-and-purpose)
2. [Scope and System Context](#2-scope-and-system-context)
3. [Legal Background (Required Reading)](#3-legal-background-required-reading)
4. [Data Model — Complete Type Definitions](#4-data-model--complete-type-definitions)
5. [Computation Pipeline — 10 Steps](#5-computation-pipeline--10-steps)
6. [Legitime Fraction Table (All 15 Testate Scenarios)](#6-legitime-fraction-table-all-15-testate-scenarios)
7. [Intestate Distribution Rules (All 15 Scenarios)](#7-intestate-distribution-rules-all-15-scenarios)
8. [Testate Validation Rules](#8-testate-validation-rules)
9. [Special Computation Modules](#9-special-computation-modules)
10. [Narrative Generation System](#10-narrative-generation-system)
11. [Complete Test Vectors](#11-complete-test-vectors)
12. [Manual Review Flags](#12-manual-review-flags)
13. [Edge Case Catalog](#13-edge-case-catalog)
14. [Implementation Requirements](#14-implementation-requirements)

---

## 1. Overview and Purpose

This document is a **complete, self-contained software specification** for a Philippine Inheritance Distribution Engine. A developer with **zero knowledge of Philippine law** must be able to build a fully correct, production-grade engine from this specification alone.

### What the Engine Does

Given:
1. A **net distributable estate** (Philippine Pesos, after estate tax) — this is the output of a separate estate-tax engine
2. A **family tree** with heir classifications
3. A **will** (optional)
4. **Inter vivos donations** made by the decedent during their lifetime (optional)

The engine produces:
1. **Per-heir peso amounts** — exact breakdown of who gets what, centavo-precise
2. **Plain-English narrative per heir** — explaining WHY they received that amount, citing the specific Philippine law articles

### What the Engine Does NOT Do

- Compute estate tax (that's a separate engine's job)
- Evaluate will validity in terms of form (probate — handled by courts)
- Handle property partition mechanics (who gets which specific assets)
- Make judgments on contested facts (filiation disputes, reconciliation, etc.) — these are **inputs**

### Design Principles

| Principle | Requirement |
|-----------|-------------|
| **Fully deterministic** | Same inputs → same outputs. No randomness, no LLM in the computation loop |
| **Rational arithmetic** | All intermediate computations use exact fractions (BigInt numerator/denominator). Convert to peso amounts only at the final output step |
| **Immutable pipeline** | Each step produces a new result struct; no mutation of inputs |
| **Explicit over implicit** | Every heir category, cause, and scenario has an explicit enum value |
| **Auditable** | Every output includes a computation log tracing every decision to its legal basis |

---

## 2. Scope and System Context

### System Position

```
[Gross Estate]
      ↓
[Estate Tax Engine]  ← SEPARATE SYSTEM
      ↓
 net_distributable_estate  ←─── THIS ENGINE'S INPUT
      ↓
[Inheritance Distribution Engine]  ← THIS SPEC
      ↓
 per_heir_amounts + narratives
```

The inheritance distribution engine is **downstream** of the estate-tax engine. It receives the net estate after tax as its starting point and does not know or care about the tax calculation.

### Succession Types Covered

| Type | Description |
|------|-------------|
| **Intestate** | No will — distribute per statutory rules |
| **Testate** | Valid will — validate it respects compulsory heirs, distribute per will |
| **Mixed** | Will disposes of only part of the estate — will governs the disposed portion, intestate rules govern the remainder |
| **Post-preterition** | Will existed but was annulled by Art. 854 (total omission of a direct-line heir) — distributes intestate |

### Legal Sources (Philippine Law)

All rules in this engine derive from:
- **Civil Code of the Philippines (Republic Act 386)**, Book III — Succession, Arts. 774-1105
- **Family Code (Executive Order 209)**, Arts. 163-193 — legitimacy, filiation, adoption
- **Republic Act 8552** — Domestic Adoption Act of 1998
- **Republic Act 11642** — Domestic Administrative Adoption Act of 2022

When this spec says "Art. X", it refers to the Civil Code unless otherwise noted (e.g., "Art. 176, Family Code").

---

## 3. Legal Background (Required Reading)

This section provides the minimum Philippine succession law context needed to implement the engine. It is intentionally simplified for developers, not lawyers.

### 3.1 Compulsory Heirs — Who Always Inherits

Philippine law reserves a guaranteed minimum share (**legitime**) for certain relatives, called **compulsory heirs**. A testator cannot exclude them from their minimum share.

| Heir Type | Article | Notes |
|-----------|---------|-------|
| Legitimate children and descendants | Art. 887(1) | Includes adopted (RA 8552) and legitimated (FC Art. 179) |
| Legitimate parents and ascendants | Art. 887(2) | Only when no legitimate descendants survive |
| Surviving spouse | Art. 887(3) | Always concurs with whoever else is present |
| Illegitimate children | Art. 887(5) | Always concur with whoever else is present; require proven filiation |

**Critical**: Legitimate children (Group 1) and legitimate ascendants (Group 2) are **mutually exclusive** — if any legitimate descendant survives, no ascendant is a compulsory heir. Groups 3 (spouse) and 4 (illegitimate children) always concur with any surviving group.

### 3.2 The Legitime — What Each Compulsory Heir Gets Minimum

The **legitime** is the minimum fraction of the estate guaranteed by law to each compulsory heir. It cannot be reduced by the testator's will (though it can be zero if the heir is validly disinherited).

The fraction varies based on **who else is surviving** — called "concurrence." See Section 6 for the complete table.

### 3.3 The Free Portion — What the Testator Can Freely Dispose Of

```
Free Portion = Estate - Sum of all compulsory heirs' legitimes
```

The testator may give the free portion to anyone (including compulsory heirs) via their will. If the free portion is exceeded (will gives away more than it has), the excess dispositions are reduced — called **inofficiousness**.

### 3.4 Intestate vs Testate — Different Rules

- **Intestate** (no will): The law distributes everything. Compulsory heirs get MORE than their mere legitime in most scenarios.
- **Testate** (with will): Compulsory heirs get their minimum legitime. The testator controls the rest.
- **Key difference**: In intestate succession, there is **no cap** on illegitimate children's shares (they just get the 2:1 unit ratio). In testate, illegitimate children's shares are **capped** by the available free portion (Art. 895 ¶3).

### 3.5 The Art. 895 ¶3 Cap Rule (Testate Only)

When illegitimate children concur with legitimate children in **testate succession**:
1. Each illegitimate child is entitled to ½ of each legitimate child's share
2. BUT: The total of all illegitimate children's shares **cannot exceed the free portion**
3. AND: The surviving spouse is satisfied **first** from the free portion before illegitimate children are considered

This cap frequently reduces illegitimate children's shares significantly. See Sections 6.4 and 11 (TV-13) for examples.

### 3.6 Right of Representation — Stepping Into Deceased Heir's Shoes

When an heir **predeceases** the decedent, is **disinherited**, or is declared **incapacitated/unworthy**, their descendants may step into their place and inherit the share they would have received. This is called **right of representation** (Art. 970).

Key rules:
- Distribution within the line is **per stirpes** (equally among the representatives, not per capita across all heirs)
- Renouncing heirs **cannot** be represented (Art. 977) — if you renounce, nobody steps in for you
- In the collateral line (siblings/nephews-nieces), representation is limited to children of siblings only (Art. 972)

### 3.7 Preterition — The Nuclear Option (Art. 854)

If a testator's will **completely omits** a compulsory heir who is in the direct line (children, parents — NOT spouse), the law **annuls the entire institution of heirs** in the will. The estate distributes intestate, except that legacies and devises (specific gifts) survive if they don't impair anyone's legitime.

The spouse is **never** subject to preterition — their omission triggers Art. 855 (underprovision recovery) instead.

### 3.8 Collation — Accounting for Prior Gifts (Arts. 1061-1077)

Donations (gifts) the decedent made during their lifetime to compulsory heirs are **fictitiously added back** to the estate for computing shares, then deducted from that heir's inheritance. This ensures fairness — an heir who received a large gift during the decedent's lifetime should receive less from the estate.

Collation **does not** require the donation to be physically returned. It's a mathematical accounting exercise.

---

## 4. Data Model — Complete Type Definitions

All types are language-agnostic. Translate to your language's type system (TypeScript interfaces, Rust structs, Python dataclasses, etc.).

### 4.1 Primitive Types

```
// Exact rational arithmetic — mandatory for all intermediate computations
struct Fraction {
    numerator: BigInt,
    denominator: BigInt,
}
// Invariant: always stored in lowest terms (GCD-reduced)
// Operations: add, subtract, multiply, divide, compare, to_decimal, to_money

// Peso amount with centavo precision — used ONLY for Step 10 final output
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

// Date
type Date = ISO-8601 date string  // e.g., "2026-01-15"

// Ascendant line (paternal/maternal side)
enum LineOfDescent { PATERNAL, MATERNAL }
```

### 4.2 Engine Input

```
struct EngineInput {
    net_distributable_estate: Money,    // Output of estate-tax engine (after tax)
    decedent: Decedent,
    family_tree: List<Person>,          // All potential heirs (raw, pre-classification)
    will: Will?,                        // null = intestate succession
    donations: List<Donation>,          // Inter vivos donations by decedent
    config: EngineConfig,
}

struct Decedent {
    id: PersonId,
    name: String,
    date_of_death: Date,

    // Civil status
    is_married: bool,
    date_of_marriage: Date?,
    marriage_solemnized_in_articulo_mortis: bool,   // Art. 900 ¶2: marriage at death's door
    was_ill_at_marriage: bool,                       // Art. 900 ¶2 condition 2
    illness_caused_death: bool,                      // Art. 900 ¶2 condition 3
    years_of_cohabitation: int,                      // ≥5 years exempts articulo mortis
    has_legal_separation: bool,                      // Court decree in effect at death

    // Is the decedent themselves illegitimate?
    // (Affects ascendant succession rules — Art. 903 uses "parents" not "ascendants")
    is_illegitimate: bool,
}

struct Person {
    id: PersonId,
    name: String,
    is_alive_at_succession: bool,
    relationship_to_decedent: Relationship,
    degree: int,                                // Degree of relationship from decedent
    line: LineOfDescent?,                        // PATERNAL or MATERNAL (for ascendants only)
    children: List<PersonId>,                   // For representation chain

    // Filiation (illegitimate children only)
    filiation_proved: bool,
    filiation_proof_type: FiliationProof?,

    // Spouse flags
    is_guilty_party_in_legal_separation: bool,

    // Adoption (if applicable)
    adoption: Adoption?,

    // Disqualification inputs (facts determined by courts, not by engine)
    is_unworthy: bool,                          // Art. 1032
    unworthiness_condoned: bool,                // Art. 1033 (must be in writing)
    has_renounced: bool,
    filiation_contested_and_lost: bool,
}

enum Relationship {
    LEGITIMATE_CHILD,
    LEGITIMATED_CHILD,          // FC Art. 179
    ADOPTED_CHILD,              // RA 8552 / RA 11642
    ILLEGITIMATE_CHILD,
    SURVIVING_SPOUSE,
    LEGITIMATE_PARENT,
    LEGITIMATE_ASCENDANT,       // Grandparent or higher
    SIBLING,                    // Full or half blood
    NEPHEW_NIECE,               // Child of sibling
    OTHER_COLLATERAL,           // Within 5th degree
    STRANGER,
}

enum FiliationProof {
    BIRTH_CERTIFICATE,                  // FC Art. 172(1)
    FINAL_JUDGMENT,                     // FC Art. 172(1)
    PUBLIC_DOCUMENT_ADMISSION,          // FC Art. 172(2)
    PRIVATE_HANDWRITTEN_ADMISSION,      // FC Art. 172(2)
    OPEN_CONTINUOUS_POSSESSION,         // FC Art. 172(3)
    OTHER_EVIDENCE,                     // FC Art. 172(4)
}

struct Adoption {
    decree_date: Date,
    regime: AdoptionRegime,
    adopter: PersonId,
    adoptee: PersonId,
    is_stepparent_adoption: bool,       // Bio ties preserved if bio parent married to adopter
    biological_parent_spouse: PersonId?,
    is_rescinded: bool,
    rescission_date: Date?,
}

enum AdoptionRegime {
    RA_8552,    // 1998: exclusivity rule (adoption severs ties to bio relatives)
    RA_11642,   // 2022: Sec. 41 extends filiation to adopter's relatives
}

struct EngineConfig {
    retroactive_ra_11642: bool,     // Default true: apply 2022 extended filiation to pre-2022 adoptions
    max_pipeline_restarts: int,     // Default: count of heirs. Prevents infinite loops.
}
```

### 4.3 Will and Testamentary Dispositions

```
struct Will {
    institutions: List<InstitutionOfHeir>,
    legacies: List<Legacy>,
    devises: List<Devise>,
    disinheritances: List<Disinheritance>,
    date_executed: Date,
    is_valid: bool,                     // Form validity (probated — outside engine scope). MUST be true on input.
}

**Input boundary rule for `Will.is_valid`**: If `will.is_valid == false`, the engine MUST reject the input with an error before executing any pipeline step. It does NOT silently fall back to intestate succession — that decision requires a court ruling outside the engine's scope. Will formal validity (notarial requirements, probate) is determined by courts prior to calling this engine. Submit only wills where probate has confirmed formal validity.

struct InstitutionOfHeir {
    id: DispositionId,
    heir: HeirReference,
    share: ShareSpec,
    conditions: List<Condition>,
    substitutes: List<Substitute>,
    is_residuary: bool,
}

enum ShareSpec {
    Fraction(Fraction),                 // "I leave ½ to A"
    EqualWithOthers,                    // "I leave to A, B, C equally" (Art. 846)
    EntireEstate,
    EntireFreePort,
    Unspecified,                        // Named as heir, no share → equal (Art. 846)
    Residuary,                          // "the remainder to A"
}

struct HeirReference {
    person_id: PersonId?,               // null if class designation
    name: String,
    is_collective: bool,                // "children of C" — Art. 847
}

// Legacy = specific gift of personal property
struct Legacy {
    id: DispositionId,
    legatee: HeirReference,
    property: LegacySpec,
    conditions: List<Condition>,
    substitutes: List<Substitute>,
    is_preferred: bool,                 // Art. 911: testator-designated, reduced last
}

enum LegacySpec {
    FixedAmount(Money),
    SpecificAsset(AssetId),
    GenericClass(String, Money),
}

// Devise = specific gift of real property
struct Devise {
    id: DispositionId,
    devisee: HeirReference,
    property: DeviseSpec,
    conditions: List<Condition>,
    substitutes: List<Substitute>,
    is_preferred: bool,
}

enum DeviseSpec {
    SpecificProperty(AssetId),
    FractionalInterest(AssetId, Fraction),
}

struct Condition {
    type: ConditionType,
    description: String,
    status: ConditionStatus,
}

enum ConditionType {
    SUSPENSIVE,     // Heir inherits only IF condition fulfilled
    RESOLUTORY,     // Heir inherits immediately, loses if condition occurs
    MODAL,          // Heir must fulfill a purpose (not a true condition)
}

enum ConditionStatus {
    PENDING, FULFILLED, FAILED, NOT_APPLICABLE
}

struct Substitute {
    type: SubstitutionType,
    substitute_heir: HeirReference,
    triggers: List<SubstitutionTrigger>,
}

enum SubstitutionType {
    SIMPLE,             // Art. 859
    RECIPROCAL,         // Art. 861
    FIDEICOMMISSARY,    // Art. 863: fiduciary holds and transfers to second heir
}

enum SubstitutionTrigger { PREDECEASE, RENUNCIATION, INCAPACITY }

struct Disinheritance {
    heir_reference: HeirReference,
    cause_code: DisinheritanceCause,
    cause_specified_in_will: bool,      // Art. 916
    cause_proven: bool,                 // Art. 917 — input from courts/facts
    reconciliation_occurred: bool,      // Art. 922 — input
}

enum DisinheritanceCause {
    // Art. 919 — Children/descendants (apply to both legitimate AND illegitimate)
    CHILD_ATTEMPT_ON_LIFE,              // 919(1)
    CHILD_GROUNDLESS_ACCUSATION,        // 919(2)
    CHILD_ADULTERY_WITH_SPOUSE,         // 919(3)
    CHILD_FRAUD_UNDUE_INFLUENCE,        // 919(4)
    CHILD_REFUSAL_TO_SUPPORT,           // 919(5)
    CHILD_MALTREATMENT,                 // 919(6)
    CHILD_DISHONORABLE_LIFE,            // 919(7)
    CHILD_CIVIL_INTERDICTION,           // 919(8)

    // Art. 920 — Parents/ascendants
    PARENT_ABANDONMENT_CORRUPTION,      // 920(1)
    PARENT_ATTEMPT_ON_LIFE,             // 920(2)
    PARENT_GROUNDLESS_ACCUSATION,       // 920(3)
    PARENT_ADULTERY_WITH_SPOUSE,        // 920(4)
    PARENT_FRAUD_UNDUE_INFLUENCE,       // 920(5)
    PARENT_LOSS_PARENTAL_AUTHORITY,     // 920(6)
    PARENT_REFUSAL_TO_SUPPORT,          // 920(7)
    PARENT_ATTEMPT_ON_OTHER,            // 920(8): built-in reconciliation exception

    // Art. 921 — Spouse
    SPOUSE_ATTEMPT_ON_LIFE,             // 921(1)
    SPOUSE_GROUNDLESS_ACCUSATION,       // 921(2)
    SPOUSE_FRAUD_UNDUE_INFLUENCE,       // 921(3)
    SPOUSE_CAUSE_LEGAL_SEPARATION,      // 921(4)
    SPOUSE_LOSS_PARENTAL_AUTHORITY,     // 921(5)
    SPOUSE_REFUSAL_TO_SUPPORT,          // 921(6)
}
```

**IMPORTANT**: Art. 919 causes apply to children only. Art. 920 to parents only. Art. 921 to spouse only. An engine must validate that the cause_code matches the heir's category — using an Art. 919 cause for a parent disinheritance is invalid.

### 4.4 Donations (Inter Vivos Gifts)

```
struct Donation {
    id: DonationId,
    recipient_heir_id: HeirId?,                 // null if stranger (not a compulsory heir)
    value_at_time_of_donation: Money,           // ALWAYS use this value (Art. 1071)
    date: Date,                                 // For reverse-chrono reduction (Art. 911)
    description: String,
    is_gratuitous: bool,                // true = gratuitous gift; false = fair-consideration transfer (sale/exchange).
                                        // If false, the engine does NOT collate this item — it is not a donation in the legal sense.

    // Collatability flags (Arts. 1061-1070)
    is_expressly_exempt: bool,                  // Art. 1062: donor stated exemption
    is_support_education_medical: bool,         // Art. 1067: always exempt
    is_customary_gift: bool,                    // Art. 1067: always exempt
    is_professional_expense: bool,              // Art. 1068: conditionally exempt
    professional_expense_parent_required: bool,  // Art. 1068: parent required collation
    professional_expense_imputed_savings: Money?,
    is_joint_from_both_parents: bool,           // Art. 1072: ½ to each estate
    is_to_child_spouse_only: bool,              // Art. 1066 ¶1: exempt
    is_joint_to_child_and_spouse: bool,         // Art. 1066 ¶2: ½ collatable
    is_wedding_gift: bool,                      // Art. 1070: 1/10 FP threshold
    is_debt_payment_for_child: bool,            // Art. 1069: collatable
    is_election_expense: bool,                  // Art. 1069: collatable
    is_fine_payment: bool,                      // Art. 1069: collatable
}
```

**Valuation rule (Art. 1071)**: Collatable donations are **always** valued at the time of donation — not at the time of death. Appreciation, depreciation, or destruction is at the donee's risk.

### 4.5 Classified Heir (Pipeline Internal)

This struct is produced by Step 1 and enriched throughout the pipeline.

```
struct Heir {
    id: HeirId,
    name: String,

    // Classification
    raw_category: HeirCategory,
    effective_category: EffectiveCategory,
    is_compulsory: bool,

    // Status
    is_alive: bool,
    is_eligible: bool,                          // Passes all disqualification gates

    // Filiation
    filiation_proved: bool,
    filiation_proof_type: FiliationProof?,
    filiation_contested_and_lost: bool,

    // Unworthiness
    is_unworthy: bool,
    unworthiness_condoned: bool,

    // Disinheritance (set in Step 6)
    is_disinherited: bool,
    disinheritance_valid: bool,

    // Renunciation
    has_renounced: bool,

    // Adoption
    adoption: Adoption?,
    has_valid_adoption: bool,

    // Spouse-specific
    legal_separation_guilty: bool,
    articulo_mortis_marriage: bool,
    cohabitation_over_5_years: bool,

    // Ascendant-specific
    degree_from_decedent: int,
    line: LineOfDescent?,

    // Collateral-specific
    blood_type: BloodType?,                     // FULL or HALF (Art. 967/1006)

    // Representation (set in Step 2)
    representation_trigger: RepresentationTrigger?,
    represented_by: List<HeirId>,
    represents: HeirId?,
    inherits_by: InheritanceMode,               // OWN_RIGHT or REPRESENTATION
    line_ancestor: HeirId?,

    // Family links
    children: List<HeirId>,
}

enum HeirCategory {
    LEGITIMATE_CHILD,
    LEGITIMATED_CHILD,      // FC Art. 179 — maps to LEGITIMATE_CHILD_GROUP
    ADOPTED_CHILD,          // RA 8552/11642 — maps to LEGITIMATE_CHILD_GROUP
    ILLEGITIMATE_CHILD,
    SURVIVING_SPOUSE,
    LEGITIMATE_PARENT,
    LEGITIMATE_ASCENDANT,
}

enum EffectiveCategory {
    LEGITIMATE_CHILD_GROUP,     // Legitimate + legitimated + adopted
    ILLEGITIMATE_CHILD_GROUP,
    SURVIVING_SPOUSE_GROUP,
    LEGITIMATE_ASCENDANT_GROUP, // Parents + higher ascendants
}

enum InheritanceMode { OWN_RIGHT, REPRESENTATION }

enum RepresentationTrigger {
    PREDECEASE,         // Arts. 981-982
    DISINHERITANCE,     // Art. 923
    INCAPACITY,         // Art. 1035
    UNWORTHINESS,       // Art. 1035
    // RENUNCIATION is NOT a valid trigger (Art. 977)
}

enum BloodType {
    FULL,   // Heir's parent and the decedent share BOTH the same father AND the same mother
    HALF,   // Heir's parent and the decedent share only ONE common parent (same father OR same mother, not both)
}
// BloodType is used only for collateral heirs (siblings, nephews/nieces, cousins).
// Art. 1006: A full-blood sibling receives double the share of a half-blood sibling in I13.
```

**Category derivation rule**:
- `LEGITIMATE_CHILD | LEGITIMATED_CHILD | ADOPTED_CHILD` → `LEGITIMATE_CHILD_GROUP`
- `ILLEGITIMATE_CHILD` → `ILLEGITIMATE_CHILD_GROUP`
- `SURVIVING_SPOUSE` → `SURVIVING_SPOUSE_GROUP`
- `LEGITIMATE_PARENT | LEGITIMATE_ASCENDANT` → `LEGITIMATE_ASCENDANT_GROUP`

### 4.6 Scenario Enums

```
enum SuccessionType {
    TESTATE,
    INTESTATE,
    MIXED,
    INTESTATE_BY_PRETERITION,   // Will annulled by Art. 854
}

enum TestateScenario {
    T1,   // n legitimate children only (Art. 888)
    T2,   // 1 legitimate child + spouse (Arts. 888, 892)
    T3,   // n≥2 legitimate children + spouse (Arts. 888, 892)
    T4,   // n legitimate + m illegitimate, no spouse (Arts. 888, 895)
    T5a,  // n=1 LC + m IC + spouse (Arts. 888, 892, 895)
    T5b,  // n≥2 LC + m IC + spouse (Arts. 888, 892, 895)
    T6,   // Ascendants only (Art. 889)
    T7,   // Ascendants + spouse (Arts. 889, 893)
    T8,   // Ascendants + m IC (Arts. 889, 896)
    T9,   // Ascendants + m IC + spouse (Arts. 889, 899)
    T10,  // m IC + spouse (Art. 894)
    T11,  // m IC only (Art. 901)
    T12,  // Spouse only (Art. 900)
    T13,  // No compulsory heirs
    T14,  // Illegitimate decedent — parents only (Art. 903)
    T15,  // Illegitimate decedent — parents + spouse (Art. 903)
}

enum IntestateScenario {
    I1,   // n legitimate children only (Art. 980)
    I2,   // n legitimate children + spouse (Art. 996)
    I3,   // n legitimate + m illegitimate (Arts. 983, 895)
    I4,   // n legitimate + m illegitimate + spouse (Arts. 999, 983)
    I5,   // Ascendants only (Art. 985)
    I6,   // Ascendants + spouse (Art. 997)
    I7,   // m illegitimate only (Art. 988)
    I8,   // m illegitimate + spouse (Art. 998)
    I9,   // Ascendants + m illegitimate (Art. 991)
    I10,  // Ascendants + m illegitimate + spouse (Art. 1000)
    I11,  // Spouse only (Art. 995)
    I12,  // Spouse + siblings/nephews-nieces (Art. 1001)
    I13,  // Collateral relatives — siblings/nephews-nieces (Arts. 1003-1008)
    I14,  // Other collateral relatives within 5th degree (Arts. 1009-1010)
    I15,  // No heirs → State (Arts. 1011-1014)
}
```

### 4.7 Engine Output

```
struct EngineOutput {
    per_heir_shares: List<InheritanceShare>,
    narratives: List<HeirNarrative>,
    computation_log: ComputationLog,
    warnings: List<ManualFlag>,
    succession_type: SuccessionType,
    scenario_code: String,           // "T1"-"T15" or "I1"-"I15" or "MIXED"
}

struct InheritanceShare {
    heir_id: HeirId,
    heir_name: String,
    heir_category: EffectiveCategory,
    inherits_by: InheritanceMode,
    represents: HeirId?,

    // Amounts (all Money — centavo precision)
    from_legitime: Money,
    from_free_portion: Money,
    from_intestate: Money,
    total: Money,

    // For display/audit
    legitime_fraction: String,      // e.g., "1/4"
    legal_basis: List<String>,      // Article citations

    // Collation adjustment
    donations_imputed: Money,
    gross_entitlement: Money,
    net_from_estate: Money,
}

struct HeirNarrative {
    heir_id: HeirId,
    heir_name: String,
    heir_category_label: String,
    text: String,                   // The complete narrative paragraph
    summary_line: String,           // First sentence only
}

struct ComputationLog {
    steps: List<StepLog>,
    total_restarts: int,
    final_scenario: String,
}

struct StepLog {
    step_number: int,
    step_name: String,
    inputs_summary: String,
    outputs_summary: String,
    decisions: List<String>,
    legal_citations: List<String>,
}

struct ManualFlag {
    code: ManualFlagCode,
    article: String,
    description: String,
}

enum ManualFlagCode {
    GRANDPARENT_OF_ILLEGITIMATE,    // Art. 903: "parents" not "ascendants" — gray area
    CROSS_CLASS_ACCRETION,          // Art. 1018 vs Art. 968 — scholarly debate
    RESERVA_TRONCAL,                // Art. 891: post-distribution property encumbrance
    COLLATION_DISPUTE,              // Art. 1077: contested collation item
    RA_11642_RETROACTIVITY,         // Pre-2022 adoption + Sec. 41 extended filiation
    ARTICULO_MORTIS,                // Art. 900 ¶2: verify all 3 conditions
    USUFRUCT_ANNUITY_OPTION,        // Art. 911 ¶3: testator or compulsory heir may elect usufruct/annuity instead of cash reduction; computation depends on election made outside the engine
    DUAL_LINE_ASCENDANT,            // Art. 890: consanguineous union places one ascendant in both paternal and maternal lines; by-line split algorithm is ambiguous
    POSTHUMOUS_DISINHERITANCE,      // Will disinherits a child conceived but not yet born at time of execution; disinheritance validity for posthumous children is legally uncertain
    CONTRADICTORY_DISPOSITIONS,     // Will contains internally contradictory clauses (e.g., heir X is given ½ in one institution and ⅓ in another); testator intent cannot be mechanically resolved
}
```

---

## 5. Computation Pipeline — 10 Steps

The engine executes these steps sequentially. Two restart conditions exist (documented in Steps 6 and 9).

```
EngineInput
    → Step 1: Classify Heirs
    → Step 2: Build Representation Lines
    → Step 3: Determine Succession Type + Scenario
    → Step 4: Compute Estate Base (Collation)
    → Step 5: Compute Legitimes
    → Step 6: Testate Validation  [may restart from Step 3]
    → Step 7: Distribute Estate
    → Step 8: Collation Adjustment
    → Step 9: Vacancy Resolution  [may restart from Step 3]
    → Step 10: Finalize + Generate Narratives
EngineOutput
```

### Step 1: Classify Heirs

**Purpose**: Assign each person in the family tree their legal category and check eligibility.

```
function step1_classify_heirs(
    family_tree: List<Person>,
    decedent: Decedent
) -> List<Heir>:

    for each person in family_tree:
        raw_category = determine_raw_category(person.relationship_to_decedent)
        effective_category = map_to_effective_category(raw_category)
        eligible = check_eligibility(person, raw_category)
        // Build Heir struct and add to result

function check_eligibility(person, category) -> bool:
    if category == ILLEGITIMATE_CHILD AND NOT person.filiation_proved:
        return false  // Art. 887 ¶3: hard gate
    if category == ADOPTED_CHILD AND person.adoption.is_rescinded:
        return false  // RA 8552 Sec. 20
    if category == SURVIVING_SPOUSE AND person.is_guilty_party_in_legal_separation:
        return false  // Art. 1002
    if person.is_unworthy AND NOT person.unworthiness_condoned:
        return false  // Art. 1032
    return true
```

**Adoption rule (RA 8552 Sec. 17)**: An adopted child is classified as `LEGITIMATE_CHILD_GROUP` for ALL computation purposes. ANY code that produces a different share for an adopted child vs a biological legitimate child is a bug.

### Step 2: Build Representation Lines

**Purpose**: For each child of the decedent (alive or not), determine whether that child's share should be distributed directly or through representatives. Count eligible lines (`n` for legitimate, `m` for illegitimate).

```
function step2_build_lines(heirs, decedent) -> LineResult:
    for each direct child of decedent:
        if child is_alive AND is_eligible AND NOT has_renounced:
            create line: mode = OWN_RIGHT, heir = child
        else:
            trigger = get_representation_trigger(child)
            if trigger == RENUNCIATION:
                // Art. 977: NO line created. Renouncing heirs CANNOT be represented.
            elif trigger in [PREDECEASE, DISINHERITANCE, INCAPACITY, UNWORTHINESS]:
                reps = find_eligible_representatives(child)
                if len(reps) > 0:
                    create line: mode = REPRESENTATION, representatives = reps
                // else: line extinct

    n = count(legitimate lines)
    m = count(illegitimate lines)
```

**Lines vs heads**: The count `n` and `m` are the number of **lines**, not the number of individual heirs. A predeceased child with 3 grandchildren counts as 1 line, not 3. This matters for legitime fractions.

**Representation is recursive**: A grandchild who also predeceased can be represented by great-grandchildren, with no depth limit in the descending line.

**Collateral representation (Art. 972)**: In the collateral line, only children of siblings can represent (nephews/nieces). More remote collateral relatives do NOT get representation. If the siblings are all dead but their children survive, the nephews/nieces inherit per capita (Art. 975), not per stirpes.

### Step 3: Determine Succession Type + Scenario

**Purpose**: Map the heir pool to one of 15 testate scenarios (T1-T15) and/or 15 intestate scenarios (I1-I15).

```
function step3_determine_succession(will, heirs, lines, decedent) -> SuccessionResult:

    // Determine succession type
    if will == null OR will.is_empty:
        succession_type = INTESTATE
    elif will disposes entire estate:
        succession_type = TESTATE
    else:
        succession_type = MIXED

    // Determine which groups survive
    has_group1 = lines.n > 0                          // Legitimate descendants
    has_group2 = any ascendant is alive and eligible   // Legitimate ascendants
    has_group3 = spouse is alive and eligible           // Surviving spouse
    has_group4 = lines.m > 0                           // Illegitimate children

    // MUTUAL EXCLUSION: Group 1 excludes Group 2
    if has_group1:
        has_group2 = false  // Art. 887(2): ascendants only when no descendants

    // Map to testate scenario
    testate_scenario = map_testate_scenario(has_group1, has_group2, has_group3, has_group4,
                                             lines.n, decedent.is_illegitimate)

    // Map to intestate scenario (for intestate/mixed succession)
    intestate_scenario = map_intestate_scenario(has_group1, has_group2, has_group3, has_group4,
                                                 collaterals, lines.n)
```

**Testate Scenario Mapping**:

| Group1 (LD) | Group2 (Asc) | Group3 (Spouse) | Group4 (IC) | n | Scenario |
|-------------|-------------|-----------------|------------|---|---------|
| ✓ | — | — | — | any | T1 |
| ✓ | — | ✓ | — | 1 | T2 |
| ✓ | — | ✓ | — | ≥2 | T3 |
| ✓ | — | — | ✓ | any | T4 |
| ✓ | — | ✓ | ✓ | 1 | T5a |
| ✓ | — | ✓ | ✓ | ≥2 | T5b |
| — | ✓ | — | — | — | T6 |
| — | ✓ | ✓ | — | — | T7 |
| — | ✓ | — | ✓ | — | T8 |
| — | ✓ | ✓ | ✓ | — | T9 |
| — | — | ✓ | ✓ | — | T10 |
| — | — | — | ✓ | — | T11 |
| — | — | ✓ | — | — | T12 |
| — | — | — | — | — | T13 |
| Illegitimate decedent + parents only | T14 |
| Illegitimate decedent + parents + spouse | T15 |

### Step 4: Compute Estate Base (Collation)

**Purpose**: Add back collatable inter vivos donations to compute the correct estate base for legitime computation (Art. 908).

```
estate_base = net_estate + sum(collatable donations at their donation-time values)
```

**Collatability Rules**:

| Donation type | Collatable? | Legal basis |
|---------------|-------------|-------------|
| Support, education, medical expenses | NO | Art. 1067 |
| Customary gifts (baptism, graduation, etc.) | NO | Art. 1067 |
| Professional career expenses (if not required by parent, and doesn't impair legitime) | NO | Art. 1068 |
| Wedding gifts ≤ 1/10 of FP | NO | Art. 1070 |
| Donation to sole compulsory heir (no co-heirs) | NO | Art. 1061 |
| Donor-expressly-exempt donation | NO (but still check inofficiousness) | Art. 1062 |
| Donation only to child's spouse (not child) | NO | Art. 1066 ¶1 |
| Stranger donation (non-heir) | YES, charged to FP | Art. 909 ¶2 |
| Donation to legitimate child | YES, charged to legitime | Art. 909 ¶1 |
| Donation to illegitimate child | YES, charged to legitime | Art. 910 |
| Joint donation to child AND spouse | YES, ½ charged | Art. 1066 ¶2 |
| Debt, election expense, fine payment for child | YES, charged to legitime | Art. 1069 |
| Professional expense (parent required OR impairs legitime) | YES (minus imputed savings) | Art. 1068 |

**Imputation targets**:
- Donations to legitimate children → charged to their legitime (Art. 909 ¶1)
- Donations to illegitimate children → charged to their legitime (Art. 910)
- Donations to strangers or unrelated → charged to free portion (Art. 909 ¶2)

### Step 5: Compute Legitimes

**Purpose**: Apply the legitime fraction table (Section 6) to the estate base to compute each compulsory heir's guaranteed minimum share.

Two free portion values are computed and must be tracked separately:
- **FP_gross**: Half of the estate base (before any deductions). Used as the base for the Art. 895 ¶3 cap calculation.
- **FP_disposable**: FP_gross minus all FP-sourced heir legitimes (spouse in Regime A/B, illegitimate children). This is what the testator can actually give away.

See Section 6 for the complete legitime fraction table.

### Step 6: Testate Validation

**Purpose**: Check whether the will respects all compulsory heirs' legitimes. Correct violations. This step runs only for TESTATE or MIXED succession.

**Five ordered checks** — run in this exact order, as preterition terminates the pipeline:

#### Check 1: Preterition (Art. 854)

Preterition = total omission of a compulsory heir **in the direct line** from a will.

**Who can be preterited**: Legitimate children, illegitimate children, adopted children, legitimated children, legitimate parents, legitimate ascendants.

**Who CANNOT be preterited**: Surviving spouse (spouse omission → Art. 855 underprovision, not preterition).

**What constitutes total omission**: The heir is not named as an institution, not given any legacy or devise, not named as a substitute, and was not disinherited (even invalid disinheritance prevents preterition — the heir was "addressed").

**Effect (Art. 854)**:
1. ALL institutions in the will are **annulled** (not just the preterited heir's portion)
2. Legacies and devises **survive** insofar as they are not inofficious (measured against the testate-regime free portion)
3. The remainder distributes **intestate**

```
function check_preterition(will, heirs) -> PreteritionResult:
    for each heir where heir.effective_category in [LEGITIMATE_CHILD_GROUP, LEGITIMATE_ASCENDANT_GROUP]:
        if NOT mentioned_in_will(heir, will):
            // Totally omitted!
            return PreteritionResult {
                is_preterition: true,
                preterited_heirs: [heir],
                // ...
            }
    return PreteritionResult { is_preterition: false }
```

**Art. 854 ¶2 (predeceased preterited heir)**: If the preterited heir predeceased the testator, the institution remains effectual UNLESS the heir's descendants also survive and are ALL also omitted. In that case, preterition applies "through representation."

#### Check 2: Disinheritance Validity (Arts. 915-922)

A valid disinheritance requires ALL four conditions:
1. Made in a valid will (Art. 916)
2. Cause specified in the will (Art. 916)
3. Cause proven — or acknowledged in writing by the disinherited heir in the same will or another document (Art. 917)
4. No subsequent reconciliation (Art. 922)

**Effect of INVALID disinheritance (Art. 918)**: Partial annulment — only the heir's legitime is restored. This is NOT preterition (which annuls everything). The engine restarts from Step 3 with the reinstated heir, as the scenario may change.

**Effect of VALID disinheritance (Art. 915)**: Heir is excluded from their legitime. Their descendants may represent them (Art. 923). The disinherited heir has no right of usufruct or administration over the representatives' inheritance (Art. 923 ¶2). There is NO representation for a disinherited spouse.

#### Check 3: Underprovision (Art. 855)

If the will gives a compulsory heir LESS than their legitime (including ₱0), the deficit must be recovered from three sources in order:
1. Undisposed portion of the estate
2. Pro rata from compulsory heirs' shares in excess of their own legitimes
3. Pro rata from voluntary heirs' shares

The spouse is the most common case — omitted from a will but not preterited, their legitime must be recovered.

#### Check 4: Inofficiousness (Arts. 908-912)

If the total of all testamentary dispositions to voluntary heirs + stranger donations exceeds FP_disposable, the excess must be reduced.

**Art. 911 Three-Phase Reduction Order**:
1. **Phase 1a**: Non-preferred legacies and devises — pro rata proportionally
2. **Phase 1b**: Preferred legacies and devises (testator designated) — reduced next
3. **Phase 2**: Voluntary institutions (heirs named in will but not compulsory) — pro rata
4. **Phase 3**: Inter vivos donations — in reverse chronological order (most recent first)

**Art. 912 Indivisible Realty**: If a devise of real property must be reduced, and the reduction is:
- **Less than ½** the property's value: The devisee keeps the property and reimburses the compulsory heirs in cash
- **½ or more** of the property's value: The compulsory heirs receive the property and reimburse the devisee in cash

#### Check 5: Condition Stripping (Art. 872)

The testator **cannot** impose conditions, charges, or substitutions on the **legitime portion** of a compulsory heir's inheritance. Any such condition is deemed not imposed. Conditions may only apply to the heir's free-portion share.

The engine splits compulsory heirs' total shares into:
- Legitime portion: unconditional
- Free-portion portion: conditions survive

### Step 7: Distribute Estate

**Purpose**: Allocate the actual estate (not the collation-adjusted base) among heirs.

**For testate succession**:
1. Compulsory heirs receive their legitime amounts
2. The free portion is distributed per the will's dispositions (subject to Step 6 corrections)
3. Any undisposed free portion distributes intestate (Art. 960(2) — mixed succession)
4. Per-stirpes distribution within representation lines

**For intestate succession**:
- Apply the intestate distribution rules from Section 7

**Note**: Amounts in Step 7 are computed on the **net estate at death** (not the collation-adjusted base). The collation-adjusted base (Step 4) was used only for computing legitime fractions in Step 5.

### Step 8: Collation Adjustment

**Purpose**: Reduce donee-heirs' shares by the amount they already received as donations. Co-heirs receive equivalent amounts from the actual estate.

```
for each collatable donation:
    donee = donation.recipient_heir
    reduce donee's share from Step 7 by the donation amount (at donation-time value)
    if reduction > donee's legitime portion:
        excess reduces donee's free-portion share
        if excess > free-portion share:
            donation is inofficious — donee must return excess
```

**Art. 1064 (Representation Collation)**: Grandchildren inheriting by representation must collate the donations their parent received — even though the grandchildren never received the property themselves. This can result in grandchildren receiving ₱0 from the estate if the parent's donation was large.

**Collation is mathematical**: The donee does not physically return the property. Co-heirs receive equivalent assets from the actual estate.

### Step 9: Vacancy Resolution

**Purpose**: Resolve vacant shares (renounced, predeceased without representation, incapacitated).

**Priority chain — in this exact order**:

1. **Substitution** (Art. 859) — testate only: the will designated a substitute
2. **Representation** (Arts. 970-977) — descendants step in
3. **Accretion** (Arts. 1015-1021) — remaining co-heirs receive the vacant share
4. **Intestate fallback** (Art. 1022(2)) — vacant share passes under intestate rules

**Critical Art. 1021 distinction**:
- **Vacant LEGITIME** → Co-heirs succeed "in their own right." This is NOT proportional accretion. The engine must **remove the vacating heir and restart from Step 3** with a recomputed scenario. All fractions change.
- **Vacant FREE PORTION** → True accretion. Proportional to existing co-heir shares (Art. 1019). No restart needed.

**Renunciation and accretion** (Art. 977): A renouncing heir cannot be represented. Their share accretes to co-heirs or falls to intestate rules.

**Pipeline restart guard**: `max_restarts = len(heirs)`. If the pipeline restarts more than this many times, raise an error requiring manual review.

### Step 10: Finalize + Generate Narratives

**Purpose**: Convert rational fractions to peso amounts; generate plain-English narratives.

**Rounding algorithm**:
1. Use rational arithmetic for all fractions
2. Convert each share to centavos by floor (round down)
3. Sum all shares — if total < net_estate, distribute the remainder 1 centavo at a time to the largest shares
4. Verify: sum of all shares == net_estate (assertion)

**Narrative generation**: See Section 10.

---

## 6. Legitime Fraction Table (All 15 Testate Scenarios)

All fractions are of the **collation-adjusted estate base** (E). `n` = legitimate child lines, `m` = illegitimate child lines.

### Regime A: Descendants Present (Arts. 888-895)

#### T1 — Legitimate Children Only

| Heir | Fraction | Notes |
|------|---------|-------|
| Each LC line | `½ ÷ n` | Collective ½, equal share per line |
| FP_gross | `½` | |
| FP_disposable | `½` | |

#### T2 — 1 Legitimate Child + Spouse (n=1)

| Heir | Fraction | Notes |
|------|---------|-------|
| LC1 | `½` | Art. 888 |
| Spouse | `¼` | Art. 892 ¶1 (from FP) |
| FP_disposable | `¼` | |

#### T3 — n≥2 Legitimate Children + Spouse

| Heir | Fraction | Notes |
|------|---------|-------|
| Each LC line | `½ ÷ n` = `1/(2n)` | |
| Spouse | `1/(2n)` | Art. 892 ¶2: equals one child's share (from FP) |
| FP_disposable | `½ - 1/(2n)` | |

#### T4 — n Legitimate + m Illegitimate, No Spouse

| Heir | Fraction | Cap? |
|------|---------|------|
| Each LC line | `½ ÷ n` | |
| Each IC (uncapped) | `½ ÷ n ÷ 2` = `1/(4n)` | Art. 895 ¶1 |
| Total IC (uncapped) | `m/(4n)` | |
| Cap check | Total IC ≤ FP_gross = `½`? | Art. 895 ¶3 |
| **If capped** (m > 2n): each IC | `½ ÷ m` | |
| FP_disposable | `½ - min(total_ic, ½)` | |

Cap triggers when: `m > 2n`

#### T5a — n=1 LC + m IC + Spouse

| Heir | Fraction | Notes |
|------|---------|-------|
| LC1 | `½` | Art. 888 |
| Spouse | `¼` | Art. 892 ¶1 (from FP) |
| FP after spouse | `½ - ¼ = ¼` | |
| Each IC (uncapped) | `¼` = (½ × LC share) | |
| Total IC uncapped | `m × ¼` | |
| **Cap check**: m > 1? | If yes, total IC > ¼ → CAP TRIGGERED | |
| Each IC (capped) | `¼ ÷ m` | |
| FP_disposable | `¼ - min(total_ic, ¼)` | |

Cap triggers when: `m > 1`

#### T5b — n≥2 LC + m IC + Spouse

| Heir | Fraction | Notes |
|------|---------|-------|
| Each LC line | `1/(2n)` | Art. 888 |
| Spouse | `1/(2n)` | Art. 892 ¶2 (from FP) |
| FP after spouse | `½ - 1/(2n)` | |
| Each IC (uncapped) | `1/(4n)` | |
| Total IC uncapped | `m/(4n)` | |
| **Cap check**: `m > 2(n-1)`? | | |
| Each IC (capped) | `(½ - 1/(2n)) ÷ m` | |
| FP_disposable | `(½ - 1/(2n)) - min(total_ic, ½ - 1/(2n))` | |

Cap triggers when: `m > 2(n-1)`

**Art. 895 ¶3 Spouse Priority Rule**: The spouse's legitime is ALWAYS satisfied FIRST from the free portion before computing the cap for illegitimate children. This is the defining feature of the cap rule.

### Regime B: Ascendants Present, No Descendants (Arts. 889-899)

#### T6 — Ascendants Only

| Heir | Fraction | Notes |
|------|---------|-------|
| Ascendants (collective) | `½` | Art. 889 |
| FP_disposable | `½` | |

Division algorithm: See ascendant division sub-algorithm below.

#### T7 — Ascendants + Spouse

| Heir | Fraction | Notes |
|------|---------|-------|
| Ascendants (collective) | `½` | Art. 889 |
| Spouse | `¼` | Art. 893 (from FP) |
| FP_disposable | `¼` | |

#### T8 — Ascendants + m IC

| Heir | Fraction | Notes |
|------|---------|-------|
| Ascendants (collective) | `½` | Art. 889 |
| IC (collective) | `¼` | Art. 896 — flat (no cap in Regime B!) |
| Each IC | `¼ ÷ m` | |
| FP_disposable | `¼` | |

**Note**: No cap rule in Regime B. Illegitimate children get a flat `¼` regardless of how many there are.

#### T9 — Ascendants + m IC + Spouse

| Heir | Fraction | Notes |
|------|---------|-------|
| Ascendants (collective) | `½` | Art. 889 |
| IC (collective) | `¼` | Art. 899 |
| Spouse | `⅛` | Art. 899 (the most constrained testate scenario) |
| FP_disposable | `⅛` | |

### Regime C: No Primary/Secondary Compulsory Heirs (Arts. 894-901)

#### T10 — m IC + Spouse

| Heir | Fraction | Notes |
|------|---------|-------|
| IC (collective) | `⅓` | Art. 894 |
| Spouse | `⅓` | Art. 894 |
| FP_disposable | `⅓` | |

#### T11 — m IC Only

| Heir | Fraction | Notes |
|------|---------|-------|
| IC (collective) | `½` | Art. 901 |
| FP_disposable | `½` | |

#### T12 — Spouse Only

| Scenario | Fraction | Notes |
|----------|---------|-------|
| Normal | `½` | Art. 900 |
| Articulo mortis (Art. 900 ¶2) | `⅓` | Only if: (1) marriage in articulo mortis, (2) decedent died within 3 months, (3) illness known at marriage. Exception: if they cohabited ≥5 years before marriage, normal ½ applies |

#### T13 — No Compulsory Heirs

FP_disposable = entire estate. Testator may freely dispose of all.

### Special: Illegitimate Decedent (Art. 903)

These scenarios apply when the **decedent** is illegitimate (not the heirs).

#### T14 — Parents of Illegitimate Decedent

| Heir | Fraction | Notes |
|------|---------|-------|
| Parents (collective) | `½` | Art. 903: "parents" specifically — grandparents = gray area (flag GRANDPARENT_OF_ILLEGITIMATE) |
| FP_disposable | `½` | |

#### T15 — Parents + Spouse of Illegitimate Decedent

| Heir | Fraction | Notes |
|------|---------|-------|
| Parents (collective) | `¼` | Art. 903 |
| Spouse | `¼` | Art. 903 |
| FP_disposable | `½` | |

### Ascendant Division Sub-Algorithm (Art. 890)

When multiple ascendants survive, their collective share is divided as follows:

```
function divide_among_ascendants(ascendants, total):
    // Tier 1: Parents (degree 1) — equal split between both surviving parents
    parents = [a for a in ascendants if a.degree == 1]
    if len(parents) > 0:
        return divide_equally(parents, total)

    // Tier 2: Nearest degree among higher ascendants
    min_degree = min(a.degree for a in ascendants)
    nearest = [a for a in ascendants if a.degree == min_degree]

    // Tier 3: By-line split (Art. 890 ¶2)
    paternal = [a for a in nearest if a.line == PATERNAL]
    maternal = [a for a in nearest if a.line == MATERNAL]

    if len(paternal) > 0 AND len(maternal) > 0:
        // Half to paternal line, half to maternal line
        return divide_equally(paternal, total/2) + divide_equally(maternal, total/2)
    else:
        // Only one line survives — takes all
        surviving = paternal if len(paternal) > 0 else maternal
        return divide_equally(surviving, total)
```

**Note**: There is NO right of representation in the ascending line (Art. 972). If a grandparent predeceases, their share goes to the other surviving ascendants of the same or nearer degree — not to their siblings.

---

## 7. Intestate Distribution Rules (All 15 Scenarios)

In intestate succession, the ENTIRE estate distributes per these rules (there is no "legitime" vs "free portion" distinction). The statutory shares are generally larger than the testate legitime.

**Critical difference from testate**: In intestate succession, the Art. 895 ¶3 cap rule **does NOT apply**. Illegitimate children use the 2:1 unit ratio method for the entire estate.

### I1 — n Legitimate Children Only (Art. 980)

Each child inherits equally: `1/n`

### I2 — n Legitimate Children + Spouse (Art. 996)

Spouse receives a share **equal to each child**:
- Total shares = n + 1
- Per share = E ÷ (n + 1)

### I3 — n Legitimate + m Illegitimate Children, No Spouse (Arts. 983, 895)

**2:1 Unit Ratio Method**:
- Each LC = 2 units
- Each IC = 1 unit
- Total units = 2n + m
- Per unit = E ÷ (2n + m)
- Each LC = 2 × per_unit, Each IC = 1 × per_unit

**No cap**: In intestate, this ratio distributes the ENTIRE estate. No Art. 895 ¶3 cap applies.

### I4 — n Legitimate + m Illegitimate + Spouse (Art. 999)

**2:1 Unit Ratio Method** with spouse:
- Each LC = 2 units
- Each IC = 1 unit
- Spouse = 2 units (equal to one LC per Art. 999)
- Total units = 2n + m + 2
- Per unit = E ÷ (2n + m + 2)

### I5 — Legitimate Ascendants Only (Arts. 985-987)

Ascendants inherit the entire estate. Apply ascendant division sub-algorithm (Section 6 Ascendant Division).

**No right of representation in ascending line** (Art. 972) — key difference from descending line.

### I6 — Ascendants + Spouse (Art. 997)

- Spouse: `½`
- Ascendants: `½`
- Apply ascendant division sub-algorithm to the ½ ascendant share.

### I7 — m Illegitimate Children Only (Art. 988)

IC children divide the entire estate equally: `1/m`

### I8 — m Illegitimate + Spouse (Art. 998)

- Spouse: `½`
- IC collective: `½`, each IC: `½ ÷ m`

### I9 — Ascendants + m Illegitimate (Art. 991)

- Ascendants: `½`
- IC collective: `½`, each IC: `½ ÷ m`
- Apply ascendant division sub-algorithm to the ½ ascendant share.

### I10 — Ascendants + m Illegitimate + Spouse (Art. 1000)

- Ascendants: `½`
- IC collective: `¼`, each IC: `¼ ÷ m`
- Spouse: `¼`

### I11 — Surviving Spouse Only (Art. 995)

Spouse inherits the entire estate.

### I12 — Surviving Spouse + Siblings / Nephews-Nieces (Art. 1001)

- Spouse: `½`
- Siblings / nephews-nieces: `½`

**Scope of Art. 1001**: ONLY siblings and their children (nephews/nieces) participate with the spouse under Art. 1001. More remote collaterals (cousins, etc.) are excluded if the spouse is present.

For distribution within the sibling share: apply collateral distribution rules below.

### I13 — Collateral Relatives — Siblings / Nephews-Nieces (Arts. 1003-1008)

Collateral distribution sub-algorithm:

```
For siblings inheriting in own right (no nephews/nieces):
    Full-blood sibling = 2 units (Art. 1006)
    Half-blood sibling = 1 unit
    Distribute by units

For siblings + nephews-nieces:
    Each sibling (alive) = their own share
    Each predeceased sibling = represented per stirpes by nephews-nieces (Art. 972)
    Nephews-nieces divide their parent-sibling's share equally

For nephews-nieces only (all siblings predeceased):
    Nephews-nieces inherit per capita in equal shares (NOT per stirpes — Art. 975 switch)
    Full-blood nephews = double share of half-blood nephews (Art. 1006)
```

**Iron Curtain (Art. 992)**: Illegitimate nephews/nieces cannot represent their illegitimate parent in the collateral line. The illegitimate child and the deceased's legitimate relatives are barred from inheriting from each other.

**5th degree limit (Art. 1010)**: Collateral relatives beyond the 5th degree do not inherit.

### I14 — Other Collateral Relatives (Arts. 1009-1010)

Applies when no siblings or nephews-nieces survive. Nearest collateral relatives within the 5th degree inherit. Equal shares within the same degree.

### I15 — No Heirs → State (Arts. 1011-1014)

State inherits. Under Art. 1013:
- Personal property → municipality/city of decedent's last residence
- Real property → municipality/city where located
- Purpose: for public schools and charitable institutions

Under Art. 1014, a legitimate heir who later appears may reclaim the estate within 5 years of delivery to the State.

---

## 8. Testate Validation Rules

This section expands on Step 6 with complete algorithms for each validation check.

### 8.1 Preterition Detection (Art. 854)

```
function is_preterited(heir, will) -> bool:
    // Must be in direct line
    if heir.effective_category not in [LEGITIMATE_CHILD_GROUP, LEGITIMATE_ASCENDANT_GROUP]:
        return false  // Spouse is NEVER preterited

    // Check total omission
    if any_institution_names(heir, will): return false
    if any_legacy_names(heir, will): return false
    if any_devise_names(heir, will): return false
    if any_disinheritance_names(heir, will): return false  // Even invalid disinheritance prevents preterition

    return true  // Totally omitted → preterition
```

### 8.2 Disinheritance Validation

```
function validate_disinheritance(d: Disinheritance) -> DisinheritanceOutcome:
    if NOT d.cause_specified_in_will:
        return INVALID_NO_CAUSE_SPECIFIED  // Art. 916
    if NOT valid_cause_for_heir_category(d.cause_code, heir.effective_category):
        return INVALID_CAUSE_NOT_IN_CODE   // Wrong article for this heir type
    if NOT d.cause_proven:
        return INVALID_CAUSE_NOT_PROVEN    // Art. 917
    if d.reconciliation_occurred:
        return INVALID_RECONCILIATION      // Art. 922
    if has_descendants(heir) AND willing_to_represent:
        return VALID_WITH_REPRESENTATION   // Art. 923
    return VALID_NO_REPRESENTATION
```

### 8.3 Art. 911 Reduction — Complete Algorithm

```
function reduce_to_free_portion(excess: Fraction, will: Will, donations: List<Donation>)
        -> List<Reduction>:

    remaining = excess
    reductions = []

    // Phase 1a: Non-preferred legacies + devises — pro rata
    non_preferred = [d for d in will.legacies + will.devises if NOT d.is_preferred]
    total_np = sum(d.amount for d in non_preferred)
    if remaining > 0 and total_np > 0:
        reduce_pct = min(remaining, total_np) / total_np
        for d in non_preferred:
            r = d.amount * reduce_pct
            record Reduction(d, r, "Art. 911(2) Phase 1a")
            remaining -= r

    // Phase 1b: Preferred legacies + devises
    preferred = [d for d in will.legacies + will.devises if d.is_preferred]
    total_p = sum(d.amount for d in preferred)
    if remaining > 0 and total_p > 0:
        reduce_pct = min(remaining, total_p) / total_p
        for d in preferred:
            r = d.amount * reduce_pct
            record Reduction(d, r, "Art. 911(2) Phase 1b")
            remaining -= r

    // Phase 2: Voluntary institutions
    voluntary = [i for i in will.institutions if NOT i.heir.is_compulsory]
    total_v = sum(i.share_value for i in voluntary)
    if remaining > 0 and total_v > 0:
        reduce_pct = min(remaining, total_v) / total_v
        for i in voluntary:
            r = i.share_value * reduce_pct
            record Reduction(i, r, "Art. 911 Phase 2")
            remaining -= r

    // Phase 3: Donations — reverse chronological (most recent first)
    sorted_donations = sort(donations, by=date, descending=True)
    for d in sorted_donations:
        if remaining <= 0: break
        r = min(remaining, d.value_at_time_of_donation)
        record Reduction(d, r, "Art. 911(1) Phase 3")
        remaining -= r

    return reductions
```

---

## 9. Special Computation Modules

### 9.1 Collation Sub-Engine (Arts. 1061-1077)

**When donations exceed the heir's share**:

If a donation to a legitimate child exceeds the child's legitime:
- Excess is charged to the child's free-portion share
- If it also exceeds the free-portion share: the donation is inofficious
- Inofficious amount must be returned to the estate (Art. 911)

**Representation collation (Art. 1064)**:
When grandchildren inherit by representation, they inherit their parent's (the predeceased child's) share. BUT they must also "collate" (account for) donations that were made to their parent. This can result in the representatives receiving ₱0 from the estate if the parent received a large donation during their lifetime.

### 9.2 Vacancy Resolution — Full Decision Tree

For each vacant share (renounced, predeceased without representation, incapacitated):

```
Priority 1: SUBSTITUTION (testate only, Art. 859)
    → If the will designated a substitute and the substitute is eligible
    → Substitute takes the original heir's share with all charges and conditions (Art. 862)

Priority 2: REPRESENTATION (Arts. 970-977)
    → If the vacancy is due to PREDECEASE, DISINHERITANCE, INCAPACITY, or UNWORTHINESS
    → NOT triggered by RENUNCIATION (Art. 977)
    → Descendants inherit the share per stirpes

Priority 3a: ACCRETION — Vacant Legitime (Art. 1021)
    → If no substitution or representation available
    → AND the vacant share is legitime (not free portion)
    → RESTART pipeline from Step 3 with this heir removed
    → ALL shares recomputed (not just a proportional add-on)

Priority 3b: ACCRETION — Vacant Free Portion (Arts. 1015-1019)
    → Testate: pro indiviso requirement (Art. 1016) — heirs must be called to same undivided thing
    → Art. 1017: "equal shares" clauses do NOT block accretion; only "exclusive owner of determinate property" blocks
    → Distribute vacant FP proportionally to co-heirs' existing shares (Art. 1019)
    → Intestate: always applies (Art. 1018), no pro indiviso needed

Priority 4: INTESTATE FALLBACK (Art. 1022(2))
    → Vacant share passes under intestate rules to legal heirs
```

### 9.3 Accretion in Intestate (Art. 1018)

In intestate succession:
- **Partial renunciation** of a share → accretes to co-heirs (Art. 1018)
- **Total renunciation** of all nearest-degree heirs → **next degree inherits in own right** (Art. 969), NOT accretion. This requires a pipeline restart from Step 3.

### 9.4 Reserva Troncal (Art. 891)

The reserva troncal is a **post-distribution encumbrance** on certain property, not a change in the distribution calculation itself.

It applies when:
1. Property was acquired by the decedent gratuitously (by inheritance, donation, etc.) from a relative
2. The decedent dies and this property passes to an ascendant
3. That ascendant is obligated to preserve the property for the decedent's relatives within the 3rd degree belonging to the line of origin

The engine **flags** this with a RESERVA_TRONCAL warning when detected, but does not change the distribution amounts. The implementation of the reserva troncal obligation requires tracking which specific assets came from which family line — outside the scope of this engine's monetary computation.

---

## 10. Narrative Generation System

### 10.1 Overview

Every heir receives a **self-contained plain-English explanation** of why they received their amount. The narrative is a single paragraph (3-15 sentences) that:
1. States the amount
2. Explains the heir's legal category
3. Shows the computation (fractions × estate = peso amounts)
4. Cites specific articles
5. Notes any special events (cap rule, collation, preterition, etc.)

Each narrative is **self-contained** — a reader needs no other document to understand why the heir received that amount.

### 10.2 Data Model

```
struct HeirNarrative {
    heir_id: HeirId,
    heir_name: String,
    heir_category_label: String,        // e.g., "illegitimate child", "surviving spouse"
    text: String,                       // The complete narrative paragraph
    summary_line: String,               // Bold one-liner: "{Name} ({label}) receives ₱{amount}"
    sections: List<NarrativeSection>,   // Ordered blocks composing the full text
}

struct NarrativeSection {
    section_type: NarrativeSectionType,
    text: String,
    legal_basis: List<String>,          // Article citations used in this section
}

enum NarrativeSectionType {
    HEADER,           // "{Name} ({label}) receives ₱{amount}."
    SUCCESSION_TYPE,  // "The decedent died {testate|intestate}..."
    CATEGORY,         // "As a {category} (Art. X)..."
    LEGITIME,         // "...entitled to a legitime of ₱X..."
    CAP_RULE,         // "However, Art. 895 ¶3 cap was applied..."
    FREE_PORTION,     // "...also receives ₱X from the free portion..."
    INTESTATE_SHARE,  // "Under Art. X, {heir}'s intestate share is..."
    COLLATION,        // "Note: ₱X donation imputed against share..."
    REPRESENTATION,   // "...inherits by right of representation..."
    DISINHERITANCE,   // "...was validly disinherited..." or "...disinheritance invalid..."
    PRETERITION,      // "...was completely omitted (Art. 854)..."
    INOFFICIOUS,      // "...reduced from ₱X to ₱Y (Art. 911)..."
    UNDERPROVISION,   // "...recovers ₱X under Art. 855..."
    CONDITION,        // "...condition stripped from legitime (Art. 872)..."
    ACCRETION,        // "...receives additional ₱X by accretion..."
    SUBSTITUTION,     // "...takes {original}'s place as substitute (Art. 859)..."
    RESERVATION,      // "Note: property subject to reserva troncal (Art. 891)..."
    ARTICULO_MORTIS,  // "Note: articulo mortis rule applied (Art. 900 ¶2)..."
    COMPARISON,       // Optional: "Under intestate, {heir} would have received ₱X"
}
```

### 10.3 Narrative Composition Order

Every narrative assembles sections in this fixed order. Sections are included only when applicable.

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER (always)                                              │
│ "{Name} ({category_label}) receives ₱{total}."              │
├─────────────────────────────────────────────────────────────┤
│ SUCCESSION_TYPE (always)                                     │
│ "The decedent died {testate/intestate/partially testate}."  │
├─────────────────────────────────────────────────────────────┤
│ CATEGORY (always for compulsory heirs)                       │
│ "As a {category} (Art. X), {Name} is a compulsory heir."   │
├─────────────────────────────────────────────────────────────┤
│ LEGITIME (testate, compulsory heir)     OR                   │
│ INTESTATE_SHARE (intestate succession)                       │
├─────────────────────────────────────────────────────────────┤
│ CAP_RULE (if Art. 895 ¶3 applied to this IC)                │
├─────────────────────────────────────────────────────────────┤
│ FREE_PORTION (if heir receives from FP beyond legitime)      │
├─────────────────────────────────────────────────────────────┤
│ SPECIAL EVENTS (0 or more, in this order):                   │
│   REPRESENTATION → DISINHERITANCE → PRETERITION →           │
│   INOFFICIOUS → UNDERPROVISION → CONDITION →                 │
│   COLLATION → ACCRETION → SUBSTITUTION →                    │
│   ARTICULO_MORTIS → RESERVATION                             │
├─────────────────────────────────────────────────────────────┤
│ COMPARISON (optional, controlled by NarrativeConfig)         │
└─────────────────────────────────────────────────────────────┘
```

### 10.4 HEADER Templates

**Always present. First sentence of every narrative.**

#### Standard Header
```
**{name} ({category_label})** receives **₱{total}**.
```
Example:
> **Maria Cruz (legitimate child)** receives **₱5,000,000**.

#### Collation Header (heir received a prior donation)
```
**{name} ({category_label})** receives **₱{net_from_estate} from the estate** (plus ₱{donations_imputed} previously received as a donation, for a total of ₱{gross_entitlement}).
```
Example:
> **Pilar Navarro (legitimate child)** receives **₱3,000,000 from the estate** (plus ₱2,000,000 previously received as a donation, for a total of ₱5,000,000).

#### Zero-Share Header (validly disinherited, no representatives)
```
**{name} ({category_label}, disinherited)** receives **₱0**.
```
Example:
> **Karen Villanueva (legitimate child, disinherited)** receives **₱0**.

#### Donation Return Header (inofficious donation — must return money)
```
**{name} ({category_label})** must **return ₱{return_amount} to the estate**.
```
Example:
> **Pedro Garcia (legitimate child)** must **return ₱500,000 to the estate**.

#### Reduced Voluntary Heir Header
```
**{name} ({designation})** receives **₱{reduced_amount}** (reduced from ₱{original_amount}).
```
Example:
> **Friend H (legatee, voluntary heir)** receives **₱2,500,000** (reduced from ₱6,000,000).

### 10.5 SUCCESSION_TYPE Templates

**Always present. Sets the legal regime.**

#### Intestate
```
The decedent died intestate (without a valid will). The estate distributes under the rules of intestate succession (Arts. 960-1014 of the Civil Code).
```

#### Testate
```
The decedent left a valid will disposing of the estate. The distribution follows the testamentary dispositions, subject to the compulsory heirs' legitimes (Arts. 842-856 of the Civil Code).
```

#### Mixed (undisposed free portion)
```
The decedent left a will that disposes of only part of the estate. The disposed portion follows the will; the undisposed portion distributes under intestate succession (Art. 960(2) of the Civil Code).
```

#### Preterition-Converted (testate → intestate)
```
Although the decedent left a will, {preterited_heir_name} — a compulsory heir in the direct line — was completely omitted. Under Art. 854 of the Civil Code, this preterition annuls the institution of heirs. {If legacies survive: "Legacies and devises survive insofar as they are not inofficious."} The estate distributes under intestate succession rules.
```

### 10.6 CATEGORY Templates

**Always present for compulsory heirs. Establishes legal standing.**

#### Legitimate Child (biological)
```
As a legitimate child (Art. 887(1) of the Civil Code), {name} is a compulsory heir entitled to an equal share of the collective legitime.
```

#### Adopted Child
```
As an adopted child (Art. 887(1) of the Civil Code; RA 8552 Sec. 17: adopted children have the same successional rights as legitimate children), {name} is a compulsory heir entitled to an equal share of the collective legitime.
```

#### Legitimated Child
```
As a legitimated child (Art. 887(1) of the Civil Code; Art. 179, Family Code: legitimated children have the same rights as legitimate children), {name} is a compulsory heir entitled to an equal share of the collective legitime.
```

#### Illegitimate Child
```
As an illegitimate child (Art. 176, Family Code), {name} is a compulsory heir. {Name}'s filiation is established by {filiation_description(proof)} (Art. {filiation_article}, Family Code).
```
Example:
> As an illegitimate child (Art. 176, Family Code), Carlo is a compulsory heir. Carlo's filiation is established by open and continuous possession of the status of an illegitimate child (Art. 172(3), Family Code).

#### Surviving Spouse
```
As the surviving spouse (Art. 887(3) of the Civil Code), {name} is a compulsory heir.
```
With qualifiers when applicable:
- Articulo mortis: append " Note: the marriage was contracted in articulo mortis (Art. 900 ¶2)."
- Legal separation (guilty spouse): "Note: {name} was legally separated from the decedent. Under Art. 1002, the guilty spouse forfeits succession rights." (Only if this heir is the GUILTY spouse.)

#### Legitimate Ascendant
```
As a legitimate {ascendant_label} of the decedent (Art. 887(2) of the Civil Code), {name} is a compulsory heir. {Name} inherits because the decedent left no surviving legitimate children or descendants.
```
Where `{ascendant_label}` is "parent" / "grandfather" / "grandmother" / "great-grandparent" per degree.

#### Voluntary Heir (testate only)
```
{Name} is a voluntary heir, instituted in the testator's will to receive {share_description} of the estate.
```

#### Legatee / Devisee
```
The testator's will provides a {legacy_or_devise} of {description} to {name}.
```
Where `{legacy_or_devise}` is "legacy" (personal property) or "devise" (real property).

#### Collateral / State (intestate only)
```
{Name} is a {collateral_label} of the decedent who inherits under intestate succession (Art. {article}) in the absence of any surviving compulsory heir.
```
State (escheat): no CATEGORY section — the INTESTATE_SHARE section (I15 template below) serves as the sole explanation.

### 10.7 LEGITIME Templates (Testate — Compulsory Heirs)

**Present only for compulsory heirs in testate succession (not intestate).**

#### Legitimate Child (Art. 888)
```
Under Art. 888 of the Civil Code, the collective legitime of the legitimate children is one-half (½) of the estate. The estate is ₱{estate_base}{if_collated: " (adjusted to ₱{e_adj} under Art. 908 after adding back ₱{collation_total} in collatable donations)"}. The collective legitime is ₱{lc_collective} (½ × ₱{estate_base}), divided equally among {n} legitimate child line{s}, giving each line ₱{per_line}.
```
Example:
> Under Art. 888 of the Civil Code, the collective legitime of the legitimate children is one-half (½) of the estate. The estate is ₱10,000,000. The collective legitime is ₱5,000,000 (½ × ₱10,000,000), divided equally among 2 legitimate child lines, giving each line ₱2,500,000.

#### Illegitimate Child — Uncapped (Art. 895)
```
Under Art. 895 of the Civil Code, an illegitimate child's legitime is one-half (½) of that of a legitimate child. Each legitimate child's legitime is ₱{per_lc}, so {name}'s legitime is ₱{per_lc} × ½ = ₱{ic_legitime}. This share is taken from the free portion (Art. 895 ¶3).
```

#### Illegitimate Child — Capped (Art. 895 ¶3)
```
Under Art. 895 of the Civil Code, an illegitimate child's computed legitime would be ₱{uncapped} (½ × ₱{per_lc}). However, Art. 895 ¶3 provides that the total legitime of all illegitimate children cannot exceed the free portion of the estate. The free portion is ₱{fp_gross} (½ of ₱{estate}). The surviving spouse's legitime of ₱{spouse_share} ({spouse_article}) is satisfied first from this free portion, leaving ₱{fp_remaining}. This remaining amount is divided equally among {m} illegitimate children, giving {name} ₱{capped_amount}.
```
Example:
> Under Art. 895 of the Civil Code, an illegitimate child's computed legitime would be ₱5,000,000 (½ × ₱10,000,000). However, Art. 895 ¶3 provides that the total legitime of all illegitimate children cannot exceed the free portion of the estate. The free portion is ₱10,000,000 (½ of ₱20,000,000). The surviving spouse's legitime of ₱5,000,000 (Art. 892) is satisfied first from this free portion, leaving ₱5,000,000. This remaining amount is divided equally among 3 illegitimate children, giving Carlo ₱1,666,666.67.

#### Surviving Spouse — With Legitimate Children (Regime A, Art. 892)
```
Under Art. 892 of the Civil Code, the surviving spouse's legitime when concurring with legitimate children is {fraction_description}. {If n=1: "With one legitimate child, the spouse receives one-fourth (¼) of the estate = ₱{amount}." | If n≥2: "With {n} legitimate children, the spouse receives a share equal to each child's legitime = ₱{amount} (same as one legitimate child's share: ½E ÷ {n})."}
```

#### Surviving Spouse — With Ascendants (Regime B, Art. 893)
```
Under Art. 893 of the Civil Code, when the decedent leaves legitimate ascendants and a surviving spouse, the spouse's legitime is one-fourth (¼) of the estate = ₱{amount}.
```

#### Surviving Spouse — With Illegitimate Children Only (Regime C, Art. 900)
```
Under Art. 900 of the Civil Code, when the surviving spouse concurs only with illegitimate children, the spouse's legitime is one-third (⅓) of the estate = ₱{amount}.
```

#### Surviving Spouse — Sole Compulsory Heir (Art. 900)
```
Under Art. 900 of the Civil Code, when the surviving spouse is the sole compulsory heir, the spouse's legitime is one-half (½) of the estate = ₱{amount}.
```

#### Surviving Spouse — With Ascendants + Illegitimate Children (Art. 899)
```
Under Art. 899 of the Civil Code, when legitimate ascendants, illegitimate children, and the surviving spouse all concur, the spouse receives one-eighth (⅛) of the estate = ₱{amount}.
```

#### Legitimate Ascendant (Arts. 889-890)
```
Under Art. 889 of the Civil Code, in the absence of legitimate descendants, the legitimate ascendants' collective legitime is one-half (½) of the estate = ₱{collective}.
```
Division sub-templates (append as applicable):
- Both parents: "Both parents share equally, receiving ₱{per_parent} each."
- One surviving parent: "As the sole surviving parent, {name} receives the entire ₱{collective}."
- Higher ascendants: "Under Art. 890, nearer ascendants exclude more remote ones. At the {degree} degree, the ascendant legitime is divided one-half (½) paternal / one-half (½) maternal, with each line's share split equally among ascendants of the same degree."

### 10.8 INTESTATE_SHARE Templates

**Present only in intestate succession, replaces LEGITIME.**

#### Descendants Only — Equal Shares (I1)
```
Under Art. 980 of the Civil Code, children of the deceased inherit in their own right, dividing the inheritance in equal shares. With {n} legitimate child line{s}, the ₱{estate} estate is divided into {n} equal shares of ₱{per_share} each.
```

#### Descendants + Spouse — Equal Shares (I2)
```
Under Art. 996 of the Civil Code, the surviving spouse is entitled to a share equal to that of each legitimate child. With {n} legitimate children and the surviving spouse, there are {n+1} equal shares. The ₱{estate} estate is divided into {n+1} shares of ₱{per_share} each.
```

#### Descendants + Illegitimate Children — 2:1 Ratio (I3, I4)
```
Under Arts. 983 and 895 of the Civil Code, when illegitimate children concur with legitimate children, each illegitimate child receives one-half (½) the share of each legitimate child. {If spouse: "The surviving spouse receives a share equal to one legitimate child (Art. 999)."} Using the proportional unit method: each legitimate child = 2 units{if_spouse: ", surviving spouse = 2 units"}, each illegitimate child = 1 unit. Total units = {total}. Per unit = ₱{estate} ÷ {total} = ₱{per_unit}. {Name} receives {units} unit(s) = ₱{amount}. Note: in intestate succession, the Art. 895 ¶3 cap rule does not apply.
```
Example:
> Under Arts. 983 and 895 of the Civil Code, when illegitimate children concur with legitimate children, each illegitimate child receives one-half (½) the share of each legitimate child. Using the proportional unit method: each legitimate child = 2 units, each illegitimate child = 1 unit. Total units = 5. Per unit = ₱10,000,000 ÷ 5 = ₱2,000,000. Gloria receives 1 unit = ₱2,000,000. Note: in intestate succession, the Art. 895 ¶3 cap rule does not apply.

#### Ascendants Only (I5)
```
Under Art. 985 of the Civil Code, in the absence of descendants, the legitimate ascendants inherit the whole estate. {Ascendant division per Arts. 986-987 and Art. 890.}
```

#### Ascendants + Spouse (I6)
```
Under Art. 997 of the Civil Code, when the surviving spouse concurs with legitimate ascendants, the spouse receives one-half (½) of the estate = ₱{spouse_amount}, and the ascendants receive the other half = ₱{asc_amount}. {Ascendant division per Art. 890.}
```

#### Ascendants + Illegitimate Children (I7)
```
Under Art. 991 of the Civil Code, illegitimate children and legitimate parents or ascendants concurring split the estate equally: one-half (½) to the illegitimate children and one-half (½) to the ascendants.
```

#### Ascendants + Illegitimate Children + Spouse (I8)
```
Under Art. 998 of the Civil Code, when legitimate ascendants, illegitimate children, and the surviving spouse all survive, the ascendants receive one-half (½) = ₱{asc}, the illegitimate children one-fourth (¼) = ₱{ic}, and the surviving spouse one-fourth (¼) = ₱{sp}.
```

#### Illegitimate Children Only (I9)
```
Under Art. 988 of the Civil Code, illegitimate children inherit the entire estate when no legitimate descendants or ascendants survive. The estate of ₱{estate} is divided equally among {m} illegitimate children at ₱{per_ic} each.
```

#### Illegitimate Children + Spouse (I10)
```
Under Art. 1000 of the Civil Code, when illegitimate children concur with the surviving spouse, each receives one-half (½) of the estate. The illegitimate children share ₱{ic_total} equally at ₱{per_ic} each; the surviving spouse receives ₱{spouse_amount}.
```

#### Surviving Spouse Alone (I11)
```
Under Art. 995 of the Civil Code, when the surviving spouse is the sole heir (no descendants, ascendants, or illegitimate children), the spouse inherits the entire estate of ₱{estate}.
```

#### Spouse + Siblings (I12)
```
Under Art. 1001 of the Civil Code, when brothers and sisters (or their children) survive with the surviving spouse and no descendants, ascendants, or illegitimate children exist, the spouse receives one-half (½) of the estate (₱{sp_amount}) and the siblings share the other half (₱{sib_total}). {If full/half blood mix: "Under Art. 1006, full-blood siblings receive double the share of half-blood siblings."}
```

#### Collaterals — Siblings (I13)
```
Under Art. 1003 of the Civil Code, in the absence of descendants, ascendants, illegitimate children, and a surviving spouse, brothers and sisters inherit the entire estate. {If full/half blood mix: "Under Art. 1006, full-blood siblings receive double the share of half-blood siblings. Using the unit method: full-blood = 2 units, half-blood = 1 unit. Total units = {total}. Per unit = ₱{per_unit}."} {If nephews per stirpes: "Nephews and nieces inherit by representation under Art. 972, each dividing their parent's share equally."}
```

#### Collaterals — Other (I14)
```
Under Art. 1009 of the Civil Code, other collateral relatives within the fifth degree inherit when no nearer heirs exist. {Name} is a {collateral_degree_label} of the decedent and inherits ₱{amount}.
```

#### Escheat to State (I15)
```
The decedent died intestate with no surviving heirs within the degrees prescribed by law. Under Art. 1011 of the Civil Code, the State inherits the entire estate. Per Art. 1013, personal property is assigned to the municipality or city of the decedent's last residence, and real estate to the municipalities or cities where situated, for the benefit of public schools and charitable institutions.
```

### 10.9 CAP_RULE Template

**Present only when Art. 895 ¶3 cap rule reduced illegitimate children's shares.**

```
Note: The Art. 895 ¶3 cap rule was applied. The uncapped total of all illegitimate children's legitimes (₱{uncapped_total}) exceeds the remaining free portion (₱{fp_remaining}) after the surviving spouse's share of ₱{spouse_amount} was fully satisfied first. Each illegitimate child's share is therefore reduced from ₱{uncapped_per_ic} to ₱{capped_per_ic}.
```

### 10.10 FREE_PORTION Templates

**Present when heir receives amounts from the free portion.**

#### Voluntary Heir / Legatee
```
{Name} receives ₱{fp_amount} from the free portion, as directed by the testator's will. The free portion (₱{fp_total}) is the remaining estate after all compulsory heirs' legitimes (totaling ₱{total_legitime}) are satisfied. The testator may freely dispose of the free portion under Art. 842 of the Civil Code.
```

#### Compulsory Heir Receiving Above Legitime
```
In addition to the legitime of ₱{legitime_amount}, {name} receives ₱{fp_excess} from the free portion, as the testator's will grants {name} more than the minimum legitime. The excess comes from the testator's disposable free portion (Art. 842 of the Civil Code).
```

#### Mixed Succession — Undisposed FP
```
The free portion of ₱{fp} was not disposed of in the will. Under Art. 960(2) of the Civil Code, undisposed property passes under intestate succession. {Name}'s intestate share of the free portion is ₱{amount}.
```

### 10.11 REPRESENTATION Template

**Present when heir inherits by right of representation.**

```
{Name} inherits by right of representation (Art. 970 of the Civil Code) in place of {represented_name}, who {trigger_description}. Under Art. 974, {represented_name}'s line receives ₱{line_share}, which is divided equally among {count} representative(s) at ₱{per_rep} each.
```
Where `{trigger_description}` maps:
- PREDECEASE → "predeceased the decedent"
- DISINHERITANCE → "was validly disinherited (Art. 923)"
- INCAPACITY → "was declared incapable of succeeding (Art. 1032)"
- UNWORTHINESS → "was declared unworthy to succeed (Art. 1032)"

Additional note for disinheritance representation:
```
Note: {represented_name} has no right of usufruct or administration over {name}'s inheritance (Art. 923 ¶2).
```

Example:
> Luis inherits by right of representation (Art. 970 of the Civil Code) in place of Karen, who was validly disinherited (Art. 923). Under Art. 974, Karen's line receives ₱2,666,666.67, which is divided equally among 2 representatives at ₱1,333,333.33 each. Note: Karen has no right of usufruct or administration over Luis's inheritance (Art. 923 ¶2).

### 10.12 DISINHERITANCE Templates

**Present for the disinherited heir (₱0 share) and for their representatives.**

#### Valid Disinheritance — Heir Receives ₱0
```
{Name} is validly disinherited in the testator's will. The disinheritance is based on Art. {cause_article} of the Civil Code: {cause_description}. Under Art. 915, a compulsory heir may be deprived of their legitime for causes expressly stated by law. {If has_representatives: "{Name}'s descendants ({rep_names}) inherit by representation under Art. 923."} {If no_representatives: "{Name}'s share is redistributed among the remaining heirs."}
```

#### Invalid Disinheritance — Heir Reinstated (Art. 918)
```
The testator's will purported to disinherit {name}. However, the disinheritance is invalid under Art. 918 of the Civil Code because {invalidity_reason}. {Name} is reinstated as a compulsory heir and receives the full legitime of ₱{amount}.
```
Where `{invalidity_reason}` maps:
- NO_CAUSE → "the will does not specify a cause (Art. 916 requires a specified legal cause)"
- WRONG_CATEGORY → "the stated cause ({cause}) is not among those enumerated in Art. {article} for {heir_category_description}"
- NOT_PROVEN → "the stated cause was not proven (Art. 917 requires proof or acknowledgment)"
- RECONCILED → "the offender and testator subsequently reconciled, voiding the disinheritance under Art. 922"

### 10.13 PRETERITION Templates

**Present when Art. 854 applies (total omission of a direct-line compulsory heir).**

#### For the Preterited Heir
```
{Name}, a compulsory heir in the direct line, was completely omitted from the testator's will — {name} was neither instituted as an heir, nor given any legacy, devise, or other testamentary provision. Under Art. 854 of the Civil Code, the preterition (total omission) of a compulsory heir in the direct line annuls the institution of heirs. {If legacies_survive: "The testator's legacies and devises survive insofar as they do not impair the compulsory heirs' legitimes (Art. 854)."} {If no_legacies: "Since the will contained no separate legacies or devises, the entire estate distributes under intestate succession rules."} Under Art. {intestate_article}, {intestate_distribution_explanation}.
```

#### For Other Heirs Affected by Preterition
```
Because {preterited_name} was preterited under Art. 854 of the Civil Code, the testator's institutions were annulled. The estate distributes under intestate succession, where {name}'s share is ₱{amount} under Art. {article}.
```

#### Preterition Through Representation (Art. 854 ¶2)
```
{Predeceased_name}, a compulsory heir in the direct line, predeceased the testator and was also omitted from the will. Under Art. 854 ¶2, the institution would ordinarily remain effectual. However, {predeceased_name}'s descendants ({rep_names}) also survive and were completely omitted. Preterition applies through representation, annulling the institution.
```

#### Spouse Omission — NOT Preterition (Art. 855)
```
Although {name} was not mentioned in the testator's will, this does not constitute preterition under Art. 854. Art. 854 applies only to compulsory heirs in the direct line (children, descendants, parents, ascendants). The surviving spouse, while a compulsory heir under Art. 887(3), is not in the direct line. {Name}'s omission is treated as an underprovision, and the legitime of ₱{amount} is recovered under Art. 855.
```

### 10.14 INOFFICIOUS Reduction Templates (Art. 911)

**Present for voluntary heirs / legatees / devisees whose shares were reduced.**

```
The testator's will directed ₱{original} to {name}. However, the total testamentary dispositions to voluntary heirs (₱{total_voluntary}) exceed the free portion (₱{fp_disposable}), making this disposition inofficious under Art. 911 of the Civil Code. {Reduction_detail}. {Name} receives ₱{after_reduction}.
```
Where `{Reduction_detail}` depends on reduction phase:
- Phase 1a (non-preferred, pro rata): "As a non-preferred disposition, it is reduced pro rata with other non-preferred dispositions."
- Phase 1b (preferred): "Although designated as a preferred disposition, the non-preferred reductions were insufficient. This preferred disposition is reduced by ₱{reduction}."
- Phase 2 (voluntary institutions): "The excess is charged against voluntary institutions pro rata."
- Phase 3 (donations): "Inter vivos donations are reduced in reverse chronological order."

#### Art. 912 — Indivisible Realty
```
The devise of {property_description} (valued at ₱{value}) to {devisee} must be reduced by ₱{reduction} to protect the compulsory heirs' legitime. Under Art. 912 of the Civil Code, since the reduction {comparison} half of the property's value: {outcome}.
```
Where `{outcome}`:
- reduction < ½ value → "{Devisee} retains the property and must reimburse the compulsory heirs ₱{cash} in cash."
- reduction ≥ ½ value → "The compulsory heirs receive the property and must reimburse {devisee} ₱{cash} in cash."

### 10.15 UNDERPROVISION Recovery Template (Art. 855)

**Present when a compulsory heir receives less than their legitime from the will.**

```
{Name} is entitled to a legitime of ₱{legitime} under Art. {article} of the Civil Code. The testator's will provided only ₱{will_provision}, leaving a deficit of ₱{deficit}. Under Art. 855 of the Civil Code, this deficit is recovered: {recovery_description}.
```
Where `{recovery_description}` follows the 3-source waterfall (include only applicable sources):
1. "₱{from_undisposed} from the undisposed portion of the estate."
2. "₱{from_compulsory} pro rata from other compulsory heirs' shares in excess of their own legitimes."
3. "₱{from_voluntary} pro rata from the voluntary heirs' shares."

### 10.16 COLLATION Templates (Arts. 1061-1077)

**Present when inter vivos donations affect the heir's distribution.**

#### Basic — Donation Within Share
```
Note: {Name} previously received ₱{donation_value} as an inter vivos donation during the decedent's lifetime. Under Art. 1061 of the Civil Code, this donation must be collated (fictitiously added back) to compute each heir's share. The collation-adjusted estate is ₱{e_adj} (Art. 908). {Name}'s {share_label} is ₱{gross_entitlement}. Under Art. {imputation_article}, the donation is charged against this share, leaving ₱{net_from_estate} to be received from the actual estate.
```
Where `{imputation_article}` is Art. 909 (legitimate children) or Art. 910 (illegitimate children).

#### Exceeds Share — No Return
```
Note: {Name} previously received ₱{donation_value} as a donation, which exceeds {name}'s share of ₱{gross_entitlement}. Under Art. 909 of the Civil Code, the excess of ₱{excess} is charged to the free portion. {Name} does not return any amount but receives nothing further from the estate.
```

#### Inofficious — Must Return
```
Note: {Name}'s prior donation of ₱{donation_value} exceeds both {name}'s share (₱{gross_entitlement}) and the available free portion. Under Arts. 909 and 911, the donation is inofficious (impairs co-heirs' legitimes). {Name} must return ₱{return_amount} to the estate.
```

#### Representation Collation (Art. 1064)
```
Note: Under Art. 1064 of the Civil Code, grandchildren inheriting by representation must collate donations their parent ({parent_name}) would have been obliged to bring. {Parent_name} received ₱{parent_donation} during the decedent's lifetime. After collation, {name}'s line receives ₱{net_line_share}, divided among {count} grandchildren at ₱{per_gc} each.
```

#### Donor-Exempt (Art. 1062)
```
Note: The decedent expressly exempted {name}'s donation of ₱{donation_value} from collation under Art. 1062 of the Civil Code. This donation is NOT deducted from {name}'s share. {If inofficious: "However, the donation is still subject to reduction under Art. 911 insofar as it impairs co-heirs' legitimes."}
```

### 10.17 CONDITION Stripping Template (Art. 872)

**Present when a will imposes a condition on a compulsory heir's legitime.**

```
The testator's will imposed a condition on {name}'s inheritance: "{condition_description}". Under Art. 872 of the Civil Code, the testator cannot impose any charge, condition, or substitution upon the legitime. The condition is deemed not imposed with respect to {name}'s legitime of ₱{legitime}. {If fp_excess: "The condition applies only to the ₱{fp_excess} received from the free portion."}
```

### 10.18 ACCRETION Templates

**Present when heir receives additional share from a vacant co-heir's portion.**

#### Art. 1021 — Vacant Legitime (Recomputation, Not True Accretion)
```
{Vacant_heir_name} {vacancy_cause_description}. Since {vacant_heir_name} {representation_explanation}, {vacant_heir_name}'s share of the legitime became vacant. Under Art. 1021 of the Civil Code, when a compulsory heir's legitime is repudiated, the remaining compulsory heirs succeed to it in their own right, not by accretion. The inheritance was recomputed as if only {remaining_count} {heir_description} survived, resulting in {name}'s share of ₱{new_amount}.
```

#### Art. 1015/1019 — Free Portion Accretion (Proportional)
```
{Vacant_heir_name}'s share of the free portion (₱{vacant_amount}) became vacant because {vacancy_cause}. Under Art. 1015 of the Civil Code, {vacant_heir_name}'s share accretes to the remaining co-heirs. Per Art. 1019, this accretion is proportional to each co-heir's existing share. {Name} receives an additional ₱{accretion_amount}.
```

#### Art. 1018 — Intestate Accretion
```
{Vacant_heir_name} {vacancy_cause_description}. Under Art. 1018 of the Civil Code, in intestate succession, the share of a person who repudiates the inheritance accretes to the co-heirs. {Name} receives an additional ₱{accretion_amount}, bringing the total to ₱{new_total}.
```

### 10.19 SUBSTITUTION Template

**Present when heir takes the place of an original heir via testamentary substitution.**

```
{Name} takes the place of {original_name} as a substitute designated in the testator's will. {Original_name} {trigger_description}. Under Art. 859 of the Civil Code, {name} inherits {original_name}'s share of ₱{amount}. {If obligations_transfer: "Under Art. 862, the charges and conditions imposed on {original_name} apply equally to {name}."}
```

### 10.20 RESERVATION Template (Art. 891)

**Warning annotation — appears at end of narrative for affected ascendants.**

```
WARNING — Reserva Troncal: The property "{property_description}" inherited by {ascendant_name} is subject to reserva troncal under Art. 891 of the Civil Code. This property was originally acquired by the decedent through {acquisition_method} from {source_person} ({relationship}). {Ascendant_name} is obligated to reserve this property for qualifying relatives within the third degree of the decedent belonging to the {paternal_or_maternal} line. This obligation does not affect the amount inherited but creates a future encumbrance on the specific property.
```

### 10.21 ARTICULO_MORTIS Template (Art. 900 ¶2)

**Present only when the articulo mortis rule applies to the surviving spouse.**

```
Note: Art. 900 ¶2 of the Civil Code applies. The decedent's marriage was contracted in articulo mortis (at the point of death), the decedent died within three months of the marriage, and the illness was known at the time of the ceremony. The surviving spouse's legitime is reduced from one-half (½) to one-third (⅓) of the estate: from ₱{normal_amount} to ₱{reduced_amount}.
```

### 10.22 COMPARISON Template (Optional)

**Optionally appended when `NarrativeConfig.include_comparison = true`.**

```
Note: Under {alternative} succession with the same family composition, {name} would have received ₱{alt_amount} — {comparison_description}.
```
Examples:
> Note: Under intestate succession with the same family composition, Carlo would have received ₱2,857,142.86 — 71% more than the testate share of ₱1,666,666.67, because the Art. 895 ¶3 cap rule does not apply in intestate succession.

> Note: Under testate succession, Ana would have received only ₱2,500,000 as her legitime. The intestate distribution of ₱3,000,000 is more favorable.

### 10.23 Narrative Generation Algorithm

```
function generate_narrative(
    heir: Heir,
    share: InheritanceShare,
    succession: SuccessionResult,
    legitime_result: LegitimeResult,
    validation: ValidationResult,
    collation: CollationResult,
    vacancy: VacancyResolutionResult,
    log: ComputationLog,
    config: NarrativeConfig
) -> HeirNarrative {

    sections = []

    // ── HEADER ──
    if share.disposition_type == INOFFICIOUS_DONATION:
        sections.append(return_header(heir, share))          // Section 10.4 Donation Return
    elif share.total == 0 and heir.is_disinherited:
        sections.append(zero_header(heir))                   // Section 10.4 Zero-Share
    elif share.donations_imputed > 0:
        sections.append(collation_header(heir, share))       // Section 10.4 Collation
    elif share.disposition_type in [VOLUNTARY, LEGACY, DEVISE] and share.original_amount != share.total:
        sections.append(reduced_voluntary_header(heir, share)) // Section 10.4 Reduced Voluntary
    else:
        sections.append(standard_header(heir, share))        // Section 10.4 Standard

    // ── SUCCESSION TYPE ──
    if validation.preterition_applied:
        sections.append(preterition_converted_succession(validation)) // Section 10.5
    elif succession.succession_type == INTESTATE:
        sections.append(intestate_succession_section())
    elif succession.succession_type == TESTATE:
        sections.append(testate_succession_section())
    elif succession.succession_type == MIXED:
        sections.append(mixed_succession_section())

    // ── CATEGORY ──
    if heir.is_compulsory:
        sections.append(category_section(heir))              // Section 10.6
    elif share.disposition_type in [LEGACY, DEVISE]:
        sections.append(legatee_section(heir, share))
    elif heir.effective_category == COLLATERAL_GROUP:
        sections.append(collateral_section(heir))
    else:
        sections.append(voluntary_heir_section(heir, share))

    // ── MAIN SHARE EXPLANATION ──
    if succession.succession_type == INTESTATE or validation.preterition_applied:
        sections.append(intestate_share_section(heir, share, succession)) // Section 10.8
    elif heir.is_compulsory and share.from_legitime > 0:
        sections.append(legitime_section(heir, share, legitime_result))   // Section 10.7

    // ── CAP RULE ──
    if heir.effective_category == ILLEGITIMATE_CHILD_GROUP and legitime_result.cap_applied:
        sections.append(cap_rule_section(heir, legitime_result))          // Section 10.9

    // ── FREE PORTION ──
    if share.from_free_portion > 0:
        sections.append(free_portion_section(heir, share, succession))    // Section 10.10

    // ── SPECIAL EVENTS (in pipeline order) ──
    if heir.inherits_by == REPRESENTATION:
        sections.append(representation_section(heir))        // Section 10.11

    if heir.is_disinherited or heir.disinheritance_invalid:
        sections.append(disinheritance_section(heir, validation))         // Section 10.12

    if validation.preterition_applied and heir == validation.preterited_heir:
        sections.append(preterition_heir_section(heir, validation))       // Section 10.13
    elif validation.preterition_applied and heir != validation.preterited_heir:
        sections.append(preterition_effect_section(heir, validation))     // Section 10.13

    for correction in validation.corrections_affecting(heir):
        match correction.type:
            INOFFICIOUS → sections.append(inofficious_section(heir, correction))    // 10.14
            UNDERPROVISION → sections.append(underprovision_section(heir, correction)) // 10.15
            CONDITION_STRIPPED → sections.append(condition_section(heir, correction)) // 10.17

    if heir in collation.affected_heirs:
        sections.append(collation_section(heir, collation))              // Section 10.16

    if heir in vacancy.beneficiaries:
        sections.append(accretion_section(heir, vacancy))                // Section 10.18

    if heir.is_substitute:
        sections.append(substitution_section(heir))                      // Section 10.19

    if heir.articulo_mortis_applied:
        sections.append(articulo_mortis_section(heir, share))            // Section 10.21

    // ── RESERVA TRONCAL WARNING (always last if applicable) ──
    if heir.has_reserva_troncal_flag:
        sections.append(reserva_troncal_section(heir))                   // Section 10.20

    // ── OPTIONAL COMPARISON ──
    if config.include_comparison and share.comparison_available:
        sections.append(comparison_section(heir, share))                 // Section 10.22

    // ── ASSEMBLE ──
    full_text = join(sections.map(s -> s.text), " ")
    return HeirNarrative {
        heir_id: heir.id,
        heir_name: heir.name,
        heir_category_label: category_label(heir),
        text: full_text,
        summary_line: sections[0].text,
        sections: sections,
    }
}
```

### 10.24 Helper Functions

```
function category_label(heir: Heir) -> String {
    match heir.effective_category:
        LEGITIMATE_CHILD_GROUP:
            match heir.relationship:
                LEGITIMATE_CHILD → "legitimate child"
                ADOPTED_CHILD → "adopted child"
                LEGITIMATED_CHILD → "legitimated child"
                LEGITIMATE_GRANDCHILD → "grandchild, by representation"
        ILLEGITIMATE_CHILD_GROUP → "illegitimate child"
        SURVIVING_SPOUSE_GROUP → "surviving spouse"
        LEGITIMATE_ASCENDANT_GROUP:
            match heir.relationship:
                LEGITIMATE_PARENT → "legitimate parent"
                LEGITIMATE_ASCENDANT → "legitimate {degree_label(heir.degree)}"
}

function filiation_description(proof: FiliationProof) -> String {
    match proof:
        BIRTH_CERTIFICATE → "record of birth in the civil register (Art. 172(1), FC)"
        COURT_JUDGMENT → "final judgment establishing filiation (Art. 172(1), FC)"
        PUBLIC_DOCUMENT → "admission of filiation in a public document (Art. 172(2), FC)"
        PRIVATE_HANDWRITTEN → "private handwritten instrument signed by the parent (Art. 172(2), FC)"
        OPEN_POSSESSION → "open and continuous possession of the status of an illegitimate child (Art. 172(3), FC)"
        OTHER_EVIDENCE → "evidence as provided by the Rules of Court (Art. 172(4), FC)"
}

function format_peso(amount: Money) -> String {
    if amount.centavos == 0:
        return "₱{amount.pesos:,}"     // e.g., "₱5,000,000"
    else:
        return "₱{amount:,.2f}"        // e.g., "₱1,666,666.67"
}

function format_fraction(frac: Fraction) -> String {
    // Map common fractions to Unicode; others use slash notation
    known = { (1,2): "½", (1,3): "⅓", (2,3): "⅔", (1,4): "¼", (3,4): "¾",
              (1,5): "⅕", (1,6): "⅙", (1,8): "⅛", (3,8): "⅜" }
    if (frac.num, frac.den) in known:
        return known[(frac.num, frac.den)]
    else:
        return "{frac.num}/{frac.den}"
}

function spouse_article(scenario: TestateScenario | IntestateScenario) -> String {
    // Map scenario to the article governing the spouse's share
    T1|T2|T3|T4|T5a|T5b → "Art. 892"    // Regime A (with LC)
    T7|T8 → "Art. 893"                   // Regime B (with ascendants)
    T9 → "Art. 899"                       // Regime B (ascendants + IC)
    T11 → "Art. 894"                     // Regime C (IC only)
    T12|T13 → "Art. 900"                 // Regime C (spouse alone / articulo mortis)
    I2|I4 → "Art. 996/999"              // Intestate with LC
    I6 → "Art. 997"                      // Intestate with ascendants
    I8 → "Art. 998"                      // Intestate with ascendants + IC
    I10 → "Art. 1000"                    // Intestate IC + spouse
    I11 → "Art. 995"                     // Intestate spouse alone
    I12 → "Art. 1001"                    // Intestate spouse + siblings
}
```

### 10.25 Category Labels Reference

| `effective_category` | `relationship` | Display Label |
|---------------------|----------------|---------------|
| LEGITIMATE_CHILD_GROUP | LEGITIMATE_CHILD | "legitimate child" |
| LEGITIMATE_CHILD_GROUP | ADOPTED_CHILD | "adopted child" |
| LEGITIMATE_CHILD_GROUP | LEGITIMATED_CHILD | "legitimated child" |
| LEGITIMATE_CHILD_GROUP | LEGITIMATE_GRANDCHILD (representing) | "grandchild, by representation" |
| ILLEGITIMATE_CHILD_GROUP | any | "illegitimate child" |
| SURVIVING_SPOUSE_GROUP | any | "surviving spouse" |
| LEGITIMATE_ASCENDANT_GROUP | LEGITIMATE_PARENT | "legitimate parent" |
| LEGITIMATE_ASCENDANT_GROUP | LEGITIMATE_ASCENDANT (degree > 1) | "legitimate [grandmother/grandfather/great-grandparent/...]" |

### 10.26 Formatting Rules

| Element | Format |
|---------|--------|
| Heir name | **Bold** on first mention |
| Peso amounts | ₱ prefix, comma thousands separator. Centavos only when non-zero. Example: ₱5,000,000 or ₱1,666,666.67 |
| Fractions | Words + symbol on first use: "one-half (½)". Symbol only (½) on repeat |
| Computation | Show multiplication: "½ × ₱10,000,000 = ₱5,000,000" |
| Article references | "Art. {n} of the Civil Code" (first mention), "Art. {n}" (subsequent) |
| Family Code refs | "Art. {n}, Family Code" |
| RA references | "RA {n} Sec. {n}" |
| Notes/warnings | Prefixed with "Note:" or "WARNING —" |
| Sentence order | Legal basis BEFORE conclusion: "Under Art. 888... the legitime is ₱X" not "The legitime is ₱X per Art. 888" |
| Paragraph length | 3-8 sentences for simple cases; up to 12 for complex (collation + cap + representation). Maximum 15 sentences before splitting into Summary + Detail |

### 10.27 Narrative Validation Rules

1. The peso amount in the HEADER MUST match `InheritanceShare.total`
2. Every legal conclusion must cite at least one article number
3. If `share.donations_imputed > 0`, the COLLATION section MUST be present
4. If `heir.inherits_by == REPRESENTATION`, the REPRESENTATION section MUST be present
5. Every `Correction` in the validation result affecting this heir must have a corresponding narrative section
6. The computation (fraction × amount = result) must be shown explicitly, not just stated
7. The narrative is self-contained — a reader needs no other context to understand it
8. If `validation.preterition_applied`, the SUCCESSION_TYPE section MUST use the preterition-converted template
9. If `legitime_result.cap_applied` for an IC heir, the CAP_RULE section MUST be present
10. If `heir.has_reserva_troncal_flag`, the RESERVATION section MUST be present (always last before COMPARISON)

---

## 11. Complete Test Vectors

These 13 test cases verify every major pathway. Each includes inputs, expected outputs, and at least one complete narrative.

### TV-01: Simple Intestate — Single Legitimate Child

| Field | Value |
|-------|-------|
| Estate | ₱5,000,000 |
| Heirs | Maria Cruz (legitimate child, alive) |
| Will | null |
| Scenario | I1 |

**Distribution**:
| Heir | Amount | Fraction |
|------|--------|---------|
| Maria Cruz | ₱5,000,000 | 1/1 |

**Invariant check**: Sum = ₱5M = E ✓

**Narrative (Maria Cruz)**:
> **Maria Cruz (legitimate child)** receives **₱5,000,000**. The decedent died intestate (without a valid will). As a legitimate child (Art. 887(1) of the Civil Code), Maria is a compulsory heir. Under Art. 980, children of the deceased inherit in their own right, dividing the inheritance in equal shares. As the sole legitimate child with no other surviving heirs, Maria inherits the entire net distributable estate of ₱5,000,000.

---

### TV-02: Standard Intestate — Married with 3 Legitimate Children

| Field | Value |
|-------|-------|
| Estate | ₱12,000,000 |
| Heirs | Ana, Ben, Carlos (legitimate children), Rosa (spouse) |
| Will | null |
| Scenario | I2 |

**Distribution** (Art. 996 — spouse = one child's share):
- Total shares = 3 + 1 = 4
- Per share = ₱3,000,000

| Heir | Amount | Fraction |
|------|--------|---------|
| Ana | ₱3,000,000 | 1/4 |
| Ben | ₱3,000,000 | 1/4 |
| Carlos | ₱3,000,000 | 1/4 |
| Rosa (spouse) | ₱3,000,000 | 1/4 |

**Invariant check**: Sum = ₱12M = E ✓; Spouse = one child's share ✓

---

### TV-03: Illegitimate Mix — 2:1 Unit Ratio, No Cap in Intestate

| Field | Value |
|-------|-------|
| Estate | ₱10,000,000 |
| Heirs | Elena, Felix (LC), Gloria (IC, filiation by birth certificate) |
| Will | null |
| Scenario | I3 |

**Distribution** (2:1 unit ratio, Art. 983):
- Units: Elena = 2, Felix = 2, Gloria = 1 → Total = 5
- Per unit = ₱10M ÷ 5 = ₱2,000,000

| Heir | Units | Amount |
|------|-------|--------|
| Elena (LC) | 2 | ₱4,000,000 |
| Felix (LC) | 2 | ₱4,000,000 |
| Gloria (IC) | 1 | ₱2,000,000 |

**Invariant check**: IC share = ½ × LC share ✓; No cap applied (intestate) ✓

**Narrative (Gloria)**:
> **Gloria Reyes (illegitimate child)** receives **₱2,000,000**. The decedent died intestate (without a valid will). As an illegitimate child (Art. 176, Family Code), Gloria is a compulsory heir. Gloria's filiation is established by record of birth in the civil register (Art. 172(1), Family Code). Under Arts. 983 and 895 of the Civil Code, when illegitimate children concur with legitimate children, each illegitimate child receives one-half (½) the share of each legitimate child. Using the proportional unit method: each legitimate child = 2 units, each illegitimate child = 1 unit. Total units = 5. Per unit = ₱10,000,000 ÷ 5 = ₱2,000,000. Gloria receives 1 unit = ₱2,000,000. Note: in intestate succession, the Art. 895 ¶3 cap rule does not apply.

---

### TV-04: Surviving Spouse Only

| Field | Value |
|-------|-------|
| Estate | ₱8,000,000 |
| Heirs | Lucia (spouse only — no children, no ascendants) |
| Scenario | I11 |

**Distribution** (Art. 995): Spouse inherits entire estate.

| Heir | Amount |
|------|--------|
| Lucia | ₱8,000,000 |

---

### TV-05: Ascendant + Spouse Intestate

| Field | Value |
|-------|-------|
| Estate | ₱10,000,000 |
| Heirs | Teresa (spouse), Manuel (father), Dolores (mother) |
| Will | null |
| Scenario | I6 |

**Distribution** (Art. 997 — ½/½ split):
- Spouse: ₱5,000,000 (½)
- Ascendants: ₱5,000,000 (½), split equally between both parents: ₱2,500,000 each

| Heir | Amount | Fraction |
|------|--------|---------|
| Teresa (spouse) | ₱5,000,000 | ½ |
| Manuel (father) | ₱2,500,000 | ¼ |
| Dolores (mother) | ₱2,500,000 | ¼ |

**Invariant check**: Spouse ½, ascendants ½ ✓; Parents equal shares ✓

---

### TV-06: Testate Simple — Will with Charity FP

| Field | Value |
|-------|-------|
| Estate | ₱10,000,000 |
| Heirs | Daniel, Eva (legitimate children); Charity C (voluntary) |
| Scenario | T1 |

**Legitime** (Art. 888): Collective ½ = ₱5,000,000, per child = ₱2,500,000
**FP** = ₱5,000,000 → given to Charity C per will

| Heir | Legitime | FP | Total |
|------|----------|---|-------|
| Daniel (LC) | ₱2,500,000 | — | ₱2,500,000 |
| Eva (LC) | ₱2,500,000 | — | ₱2,500,000 |
| Charity C | — | ₱5,000,000 | ₱5,000,000 |

**Validation**: No preterition, no reduction needed ✓

---

### TV-07: Preterition — Will Omits Legitimate Child

| Field | Value |
|-------|-------|
| Estate | ₱12,000,000 |
| Heirs | Bea, Cris, Dina (LC), Flora (spouse) |
| Will | Institutions: Bea (½), Cris (½). Dina totally omitted. |
| Initial scenario | T3 |

**Step 6 — Preterition Check**:
- Dina is in the direct line (legitimate child), totally omitted → PRETERITION (Art. 854)
- ALL institutions annulled
- No legacies/devises → entire estate distributes intestate

**Post-preterition intestate (Scenario I2)**:
- 3 children + spouse → 4 equal shares = ₱3,000,000 each

| Heir | Amount |
|------|--------|
| Bea | ₱3,000,000 |
| Cris | ₱3,000,000 |
| Dina | ₱3,000,000 |
| Flora | ₱3,000,000 |

**Narrative (Dina)**:
> **Dina Ramos (legitimate child)** receives **₱3,000,000**. Although the decedent left a will, Dina — a compulsory heir in the direct line — was completely omitted from the will with no institution, legacy, devise, or disinheritance. Under Art. 854 of the Civil Code, the preterition (total omission) of a compulsory heir in the direct line annuls the institution of heirs. Since the will contained no separate legacies or devises, the entire estate distributes under intestate succession rules. Under Art. 996 of the Civil Code, the surviving spouse is entitled to a share equal to that of each legitimate child. With 3 legitimate children and 1 spouse, there are 4 equal shares of ₱3,000,000 each.

---

### TV-08: Disinheritance — Valid with Representation

| Field | Value |
|-------|-------|
| Estate | ₱16,000,000 |
| Heirs | Irene, Jorge, Karen (LC); Luis, Marta (Karen's children); Nora (spouse) |
| Will | Disinherits Karen (Art. 919(6): maltreatment, proven, no reconciliation); FP to Friend F |
| Scenario | T3 (n=3 lines, including Karen's line via representation) |

**Disinheritance validation**: All 4 conditions met → VALID
**Art. 923**: Karen's children Luis and Marta represent Karen per stirpes

**Legitimes** (Art. 888, 892):
- Collective LC = ₱8,000,000, per line = ₱8M ÷ 3 = ₱2,666,666.67
- Spouse = one line's share = ₱2,666,666.67
- FP_disposable = ₱16M − ₱8M − ₱2,666,666.67 = ₱5,333,333.33

**Distribution**:
| Heir | Source | Amount |
|------|--------|--------|
| Irene (LC) | Legitime | ₱2,666,666.67 |
| Jorge (LC) | Legitime | ₱2,666,666.67 |
| Luis (GC, rep. Karen) | Legitime (per stirpes) | ₱1,333,333.33 |
| Marta (GC, rep. Karen) | Legitime (per stirpes) | ₱1,333,333.33 |
| Nora (spouse) | Legitime | ₱2,666,666.67 |
| Friend F | Free portion | ₱5,333,333.33 |
| **Total** | | **₱16,000,000** |

**Rounding note**: ₱8M ÷ 3 = ₱2,666,666.666... Use rational arithmetic throughout; largest-remainder method for final centavo allocation.

---

### TV-09: Adopted Child — Equal Treatment Verification

| Field | Value |
|-------|-------|
| Estate | ₱15,000,000 |
| Heirs | Quentin, Rita (biological LC); Sam (adopted, RA 8552); Victor (spouse) |
| Scenario | T3 (n=3, treating adopted as legitimate) |

**RA 8552 Sec. 17 rule**: Sam is classified as LEGITIMATE_CHILD_GROUP and treated identically to Quentin and Rita.

**Legitimes** (T3, n=3):
- Each LC line = ₱15M ÷ (2×3) = ₱2,500,000
- Spouse = one line's share = ₱2,500,000
- FP = ₱5,000,000

| Heir | Amount |
|------|--------|
| Quentin (LC) | ₱2,500,000 |
| Rita (LC) | ₱2,500,000 |
| Sam (adopted) | ₱2,500,000 |
| Victor (spouse) | ₱2,500,000 |
| University U (FP) | ₱5,000,000 |

**Bug check**: Sam.amount == Quentin.amount == Rita.amount is REQUIRED. Any difference is a bug.

---

### TV-10: Representation — Predeceased Child with 3 Grandchildren

| Field | Value |
|-------|-------|
| Estate | ₱20,000,000 |
| Heirs | Faye, Helen (LC, alive); Gil (LC, predeceased); Ian, Joy, Ken (Gil's children); Lorna (spouse) |
| Will | null |
| Scenario | I2 (n=3 lines: Faye, Gil's line, Helen; spouse) |

**Line counting**: n=3 (not 5 individuals — Gil's 3 children count as 1 line)

**Distribution** (Art. 996, 974):
- Per line/share = ₱20M ÷ 4 = ₱5,000,000
- Gil's line: ₱5M ÷ 3 grandchildren = ₱1,666,666.67 each

| Heir | Amount |
|------|--------|
| Faye (LC) | ₱5,000,000 |
| Ian (GC, rep. Gil) | ₱1,666,666.67 |
| Joy (GC, rep. Gil) | ₱1,666,666.67 |
| Ken (GC, rep. Gil) | ₱1,666,666.67 |
| Helen (LC) | ₱5,000,000 |
| Lorna (spouse) | ₱5,000,000 |

**Invariant check**: Ian + Joy + Ken = ₱5M = one line ✓

---

### TV-11: Complex — T5b with Collation, Inofficiousness, Cap Check

| Field | Value |
|-------|-------|
| Estate | ₱18,000,000 (net at death) |
| Heirs | Pilar, Ramon (LC); Sofia (IC, filiation by judgment); Tina (spouse); Friend G (voluntary) |
| Donations | D1: ₱2,000,000 to Pilar (valued at donation time) |
| Will | Gives FP to Friend G (₱3,000,000 requested) |
| Scenario | T5b (n=2, m=1) |

**Step 4 — Estate base** (Art. 908):
- E_adj = ₱18M + ₱2M = ₱20,000,000

**Step 5 — Legitimes** (T5b, n=2, m=1 on E_adj = ₱20M):
- Each LC = ₱20M ÷ 4 = ₱5,000,000
- FP_gross = ₱10,000,000
- Spouse = ₱5,000,000 (= per LC, from FP)
- FP after spouse = ₱5,000,000
- IC uncapped = ½ × ₱5M = ₱2,500,000
- Cap check: m=1 ≤ 2(n-1)=2 → NOT CAPPED
- FP_disposable = ₱5M − ₱2.5M = ₱2,500,000

**Step 6 — Validation**:
- No preterition ✓
- Friend G gets ₱3M but FP_disposable = ₱2.5M → INOFFICIOUS by ₱500K
- Reduce Friend G to ₱2,500,000 (Art. 911 Phase 1a)

**Step 8 — Collation adjustment** (on actual estate ₱18M):
- LC1 (Pilar) entitlement = ₱5M, donation = ₱2M → from estate: ₱3M

| Heir | Gross Entitlement | Donation | From Estate |
|------|------------------|----------|-------------|
| Pilar (LC) | ₱5,000,000 | ₱2,000,000 | ₱3,000,000 |
| Ramon (LC) | ₱5,000,000 | — | ₱5,000,000 |
| Sofia (IC) | ₱2,500,000 | — | ₱2,500,000 |
| Tina (spouse) | ₱5,000,000 | — | ₱5,000,000 |
| Friend G | ₱2,500,000 | — | ₱2,500,000 |
| **Sum from estate** | | | **₱18,000,000** ✓ |

---

### TV-12: Inofficious Will — Art. 911 Reduction, Art. 855 Spouse Recovery

| Field | Value |
|-------|-------|
| Estate | ₱10,000,000 |
| Heirs | Wes (LC); Xena (spouse — NOT mentioned in will); Friend H (legatee: ₱6M) |
| Scenario | T2 |

**Legitimes** (T2):
- Wes (LC) = ½ = ₱5,000,000
- Spouse = ¼ = ₱2,500,000
- FP = ₱2,500,000

**Step 6 — Validation**:
1. Preterition check: Xena omitted but spouse ≠ direct line → NOT preterition
2. Inofficiousness: Friend H gets ₱6M but FP = ₱2.5M → reduce legacy to ₱2.5M (Art. 911)
3. Underprovision: Xena gets ₱0 from will, needs ₱2.5M → recover from undisposed estate (Art. 855)

| Heir | Amount |
|------|--------|
| Wes (LC) | ₱5,000,000 |
| Xena (spouse) | ₱2,500,000 |
| Friend H | ₱2,500,000 |

---

### TV-13: Cap Rule Triggered — T5a with 3 Illegitimate Children

| Field | Value |
|-------|-------|
| Estate | ₱20,000,000 |
| Heirs | Bianca (1 LC); Carlo, Dante, Elisa (3 IC); Fiona (spouse) |
| Scenario | T5a (n=1, m=3) |

**Legitimes** (T5a):
- Bianca (LC) = ½ = ₱10,000,000
- FP_gross = ₱10,000,000
- Spouse = ¼ = ₱5,000,000 (satisfied FIRST from FP)
- FP after spouse = ₱5,000,000
- IC uncapped each = ½ × ₱10M = ₱5,000,000; total = ₱15,000,000
- Cap check: ₱15M > ₱5M → **CAP TRIGGERED** (m=3 > 1)
- Each IC capped = ₱5M ÷ 3 = ₱1,666,666.67
- FP_disposable = ₱0

| Heir | Amount | Without cap (intestate) |
|------|--------|------------------------|
| Bianca (LC) | ₱10,000,000 | ₱5,714,285.71 |
| Carlo (IC) | ₱1,666,666.67 | ₱2,857,142.86 |
| Dante (IC) | ₱1,666,666.67 | ₱2,857,142.86 |
| Elisa (IC) | ₱1,666,666.67 | ₱2,857,142.86 |
| Fiona (spouse) | ₱5,000,000 | ₱5,714,285.71 |

**Intestate comparison (I4)**: ICs get 71% more without cap.

**Narrative (Carlo)**:
> **Carlo Bautista (illegitimate child)** receives **₱1,666,666.67**. The decedent left a valid will disposing of the estate. As an illegitimate child (Art. 176, Family Code), Carlo is a compulsory heir. Carlo's filiation is established by open and continuous possession of the status of an illegitimate child (Art. 172(3), Family Code). Under Art. 895 of the Civil Code, an illegitimate child's computed legitime would be ₱5,000,000 (½ × ₱10,000,000, the sole legitimate child's share). However, Art. 895 ¶3 provides that the total legitime of all illegitimate children cannot exceed the free portion of the estate. The free portion is ₱10,000,000 (½ of ₱20,000,000). The surviving spouse's legitime of ₱5,000,000 (Art. 892) is satisfied first from this free portion, leaving ₱5,000,000. This remaining amount is divided equally among 3 illegitimate children, giving Carlo ₱1,666,666.67. Note: under intestate succession with the same family composition, Carlo would have received ₱2,857,142.86 — 71% more, because the Art. 895 ¶3 cap rule does not apply in intestate succession.

---

### TV-14: T4 — Legitimate Children + Illegitimate Child (No Spouse, Uncapped)

| Field | Value |
|-------|-------|
| Estate | ₱12,000,000 |
| Heirs | Alma, Bruno (LC); Cita (IC, filiation by judgment); Friend F (voluntary) |
| Will | FP to Friend F |
| Scenario | T4 (n=2, m=1; cap threshold m > 2n=4 → NOT CAPPED) |

**Legitimes** (Art. 888, Art. 895):
- Each LC = E × ½ / 2 = **₱3,000,000** (fraction: ¼)
- IC uncapped = ½ × LC share = **₱1,500,000** (fraction: ⅛)
- FP_disposable = E − ₱3M − ₱3M − ₱1.5M = **₱4,500,000** (fraction: 3/8)

| Heir | Legitime | FP | Total | Fraction |
|------|---------|-----|-------|---------|
| Alma (LC) | ₱3,000,000 | — | ₱3,000,000 | ¼ |
| Bruno (LC) | ₱3,000,000 | — | ₱3,000,000 | ¼ |
| Cita (IC) | ₱1,500,000 | — | ₱1,500,000 | ⅛ |
| Friend F | — | ₱4,500,000 | ₱4,500,000 | 3/8 |

**Invariant checks**: Sum = ₱12M ✓; IC = ½ × LC ✓; Σ(IC) ≤ FP_gross (₱1.5M ≤ ₱6M) ✓; no cap ✓

---

### TV-15: T6 — Legitimate Ascendants Only (Testate)

| Field | Value |
|-------|-------|
| Estate | ₱8,000,000 |
| Heirs | Ernesto (father), Felisa (mother); Charity C (voluntary) |
| Will | FP to Charity C |
| Scenario | T6 (Regime B) |

**Legitimes** (Art. 889, Art. 986):
- Ascendants collective = E × ½ = **₱4,000,000**
- Both parents alive → equal shares: each **₱2,000,000**
- FP = ½ = **₱4,000,000**

| Heir | Legitime | FP | Total | Fraction |
|------|---------|-----|-------|---------|
| Ernesto (father) | ₱2,000,000 | — | ₱2,000,000 | ¼ |
| Felisa (mother) | ₱2,000,000 | — | ₱2,000,000 | ¼ |
| Charity C | — | ₱4,000,000 | ₱4,000,000 | ½ |

**Invariant checks**: Sum = ₱8M ✓; Parents equal shares ✓ (Art. 986); Ascendants = ½ ✓

---

### TV-16: T7 — Legitimate Ascendants + Surviving Spouse (Testate)

| Field | Value |
|-------|-------|
| Estate | ₱10,000,000 |
| Heirs | Gilberto (father, mother predeceased); Herminia (spouse); Foundation F (voluntary) |
| Will | FP to Foundation F |
| Scenario | T7 (Regime B) |

**Legitimes** (Art. 889, Art. 893):
- Ascendants (½) = **₱5,000,000** — all to Gilberto (sole surviving parent, Art. 986 ¶2)
- Spouse (¼, from FP per Art. 893) = **₱2,500,000**
- FP_disposable = ¼ = **₱2,500,000**

| Heir | Legitime | FP Source | Total | Fraction |
|------|---------|----------|-------|---------|
| Gilberto (father) | ₱5,000,000 | — | ₱5,000,000 | ½ |
| Herminia (spouse) | ₱2,500,000 | Art. 893 | ₱2,500,000 | ¼ |
| Foundation F | — | FP_disposable | ₱2,500,000 | ¼ |

**Invariant checks**: Sum = ₱10M ✓; ½ + ¼ + ¼ = 1 ✓
**Testate vs intestate**: In intestate I6 with same heirs, Herminia would receive ½ = ₱5M (double the testate share).

---

### TV-17: T8 — Legitimate Ascendants + Illegitimate Children (Testate)

| Field | Value |
|-------|-------|
| Estate | ₱12,000,000 |
| Heirs | Ignacio (father), Juliana (mother); Katrina, Leon (IC, filiation by birth certificate); Friend G (voluntary) |
| Will | FP to Friend G |
| Scenario | T8 (Regime B — flat ¼ for IC group, no cap rule) |

**Legitimes** (Art. 889, Art. 896):
- Ascendants (½) = **₱6,000,000** → each parent **₱3,000,000**
- IC group (¼ flat per Art. 896) = **₱3,000,000** → each IC **₱1,500,000**
- FP = ¼ = **₱3,000,000**

| Heir | Legitime | FP | Total | Fraction |
|------|---------|-----|-------|---------|
| Ignacio (father) | ₱3,000,000 | — | ₱3,000,000 | ¼ |
| Juliana (mother) | ₱3,000,000 | — | ₱3,000,000 | ¼ |
| Katrina (IC) | ₱1,500,000 | — | ₱1,500,000 | ⅛ |
| Leon (IC) | ₱1,500,000 | — | ₱1,500,000 | ⅛ |
| Friend G | — | ₱3,000,000 | ₱3,000,000 | ¼ |

**Invariant checks**: Sum = ₱12M ✓; ½ + ¼ + ¼ = 1 ✓
**Key Regime B distinction**: Art. 896 gives IC a FLAT ¼ as a group — not derived from Art. 888 per-LC shares. No cap rule applies; the ¼ is fixed regardless of IC count.

---

### TV-18: T9 — Ascendants + Illegitimate Children + Surviving Spouse (Testate)

| Field | Value |
|-------|-------|
| Estate | ₱16,000,000 |
| Heirs | Marcos (father, mother predeceased); Nina, Otto (IC, filiation by public document); Perla (spouse); NGO N (voluntary) |
| Will | FP to NGO N |
| Scenario | T9 (most constrained — FP = ⅛) |

**Legitimes** (Art. 899):
- Ascendants (½) = **₱8,000,000** — all to Marcos
- IC group (¼) = **₱4,000,000** → each IC **₱2,000,000**
- Spouse (⅛) = **₱2,000,000**
- FP = ⅛ = **₱2,000,000**

| Heir | Legitime | FP | Total | Fraction |
|------|---------|-----|-------|---------|
| Marcos (father) | ₱8,000,000 | — | ₱8,000,000 | ½ |
| Nina (IC) | ₱2,000,000 | — | ₱2,000,000 | ⅛ |
| Otto (IC) | ₱2,000,000 | — | ₱2,000,000 | ⅛ |
| Perla (spouse) | ₱2,000,000 | — | ₱2,000,000 | ⅛ |
| NGO N | — | ₱2,000,000 | ₱2,000,000 | ⅛ |

**Invariant checks**: Sum = ₱16M ✓; ½ + ¼ + ⅛ + ⅛ = 1 ✓; FP = ⅛ ✓ (most constrained testate scenario)

**Narrative (Perla — spouse in T9)**:
> **Perla Garces (surviving spouse)** receives **₱2,000,000**. The decedent left a valid will. As the surviving spouse (Art. 887(3) of the Civil Code), Perla is a compulsory heir. Under Art. 899 of the Civil Code, when the surviving spouse concurs with legitimate ascendants and illegitimate children — and no legitimate descendants survive — the spouse is entitled to one-eighth (⅛) of the estate as legitime. The net distributable estate is ₱16,000,000, so Perla's legitime is ₱16,000,000 × ⅛ = ₱2,000,000. Scenario T9 is the most constrained testate scenario: the ascendants claim one-half (½), illegitimate children claim one-quarter (¼), the spouse receives one-eighth (⅛), and the testator's free portion is only one-eighth (⅛) — the least freedom available to any testator under Philippine succession law.

---

### TV-19: T10 — Illegitimate Children + Surviving Spouse (Testate, Regime C)

| Field | Value |
|-------|-------|
| Estate | ₱9,000,000 |
| Heirs | Queenie, Renato (IC, filiation by open continuous possession); Sonia (spouse); Friend H (voluntary) |
| Will | FP to Friend H |
| Scenario | T10 (Regime C — no LC, no ascendants) |

**Legitimes** (Art. 894):
- IC group (⅓) = **₱3,000,000** → each IC **₱1,500,000**
- Spouse (⅓) = **₱3,000,000**
- FP = ⅓ = **₱3,000,000**

| Heir | Legitime | FP | Total | Fraction |
|------|---------|-----|-------|---------|
| Queenie (IC) | ₱1,500,000 | — | ₱1,500,000 | ⅙ |
| Renato (IC) | ₱1,500,000 | — | ₱1,500,000 | ⅙ |
| Sonia (spouse) | ₱3,000,000 | — | ₱3,000,000 | ⅓ |
| Friend H | — | ₱3,000,000 | ₱3,000,000 | ⅓ |

**Invariant checks**: Sum = ₱9M ✓; ⅓ + ⅓ + ⅓ = 1 ✓ (Art. 894)

---

### TV-20: T11 — Illegitimate Children Only (Testate, Regime C)

| Field | Value |
|-------|-------|
| Estate | ₱6,000,000 |
| Heirs | Tomas, Ursula, Vicente (IC, recognized in will); Foundation F (voluntary) |
| Will | FP to Foundation F |
| Scenario | T11 (Regime C — IC alone, no LC, no ascendants, no spouse) |

**Legitimes** (Art. 901):
- IC group (½) = **₱3,000,000** → each IC **₱1,000,000**
- FP = ½ = **₱3,000,000**

| Heir | Legitime | FP | Total | Fraction |
|------|---------|-----|-------|---------|
| Tomas (IC) | ₱1,000,000 | — | ₱1,000,000 | ⅙ |
| Ursula (IC) | ₱1,000,000 | — | ₱1,000,000 | ⅙ |
| Vicente (IC) | ₱1,000,000 | — | ₱1,000,000 | ⅙ |
| Foundation F | — | ₱3,000,000 | ₱3,000,000 | ½ |

**Invariant checks**: Sum = ₱6M ✓; IC collective = ½ ✓ (Art. 901); FP = ½ ✓

---

### TV-21: T12 — Surviving Spouse Only (Testate, Regime C)

| Field | Value |
|-------|-------|
| Estate | ₱10,000,000 |
| Heirs | Wilma (spouse, normal marriage); Orphanage O (voluntary) |
| Will | FP to Orphanage O |
| Scenario | T12 (normal case — no articulo mortis) |

**Legitimes** (Art. 900):
- Spouse (½ normal) = **₱5,000,000**
- FP = ½ = **₱5,000,000**

| Heir | Legitime | FP | Total | Fraction |
|------|---------|-----|-------|---------|
| Wilma (spouse) | ₱5,000,000 | — | ₱5,000,000 | ½ |
| Orphanage O | — | ₱5,000,000 | ₱5,000,000 | ½ |

**Articulo mortis sub-case** (Art. 900 ¶2): If `decedent.marriage_in_articulo_mortis = true` AND died within 3 months of marriage AND cohabitation < 5 years, spouse legitime = ⅓ = ₱3,333,333.33 and FP = ⅔ = ₱6,666,666.67.

**Invariant checks**: Sum = ₱10M ✓; Spouse = ½ ✓ (Art. 900); FP = ½ ✓

---

### TV-22: T14 — Parents of Illegitimate Decedent (No Descendants or Spouse, Testate)

| Field | Value |
|-------|-------|
| Estate | ₱8,000,000 |
| Decedent | Xavier (is_illegitimate = true; no children, no spouse) |
| Heirs | Yolanda (mother), Zandro (father); Church C (voluntary) |
| Will | FP to Church C |
| Scenario | T14 |

**Prerequisite**: Decedent is illegitimate. If Xavier had any children (LC or IC), parents would receive nothing (Art. 903 ¶2 — "if only legitimate or illegitimate children are left, the parents are not entitled to any legitime whatsoever").

**Legitimes** (Art. 903 ¶1):
- Parents collective (½) = **₱4,000,000** → each parent **₱2,000,000**
- FP = ½ = **₱4,000,000**

| Heir | Legitime | FP | Total | Fraction |
|------|---------|-----|-------|---------|
| Yolanda (mother) | ₱2,000,000 | — | ₱2,000,000 | ¼ |
| Zandro (father) | ₱2,000,000 | — | ₱2,000,000 | ¼ |
| Church C | — | ₱4,000,000 | ₱4,000,000 | ½ |

**Invariant checks**: Sum = ₱8M ✓; Parents collective = ½ ✓; `decedent.is_illegitimate = true` required ✓

---

### TV-23: T15 — Parents of Illegitimate Decedent + Surviving Spouse (Testate)

| Field | Value |
|-------|-------|
| Estate | ₱8,000,000 |
| Decedent | Aling Ana (is_illegitimate = true; no children) |
| Heirs | Benedicto (father, mother predeceased); Carmen (spouse); University U (voluntary) |
| Will | FP to University U |
| Scenario | T15 |

**Legitimes** (Art. 903 ¶2):
- Parents collective (¼) = **₱2,000,000** — all to Benedicto (sole surviving parent)
- Spouse (¼) = **₱2,000,000**
- FP = ½ = **₱4,000,000**

| Heir | Legitime | FP | Total | Fraction |
|------|---------|-----|-------|---------|
| Benedicto (father) | ₱2,000,000 | — | ₱2,000,000 | ¼ |
| Carmen (spouse) | ₱2,000,000 | — | ₱2,000,000 | ¼ |
| University U | — | ₱4,000,000 | ₱4,000,000 | ½ |

**Invariant checks**: Sum = ₱8M ✓; Parents ¼ + Spouse ¼ + FP ½ = 1 ✓ (Art. 903 ¶2)

---

### TV-24: I4 — Legitimate Children + Illegitimate Child + Surviving Spouse (Intestate)

| Field | Value |
|-------|-------|
| Estate | ₱14,000,000 |
| Heirs | Ana, Berto (LC); Cora (IC, filiation by birth certificate); Delia (spouse) |
| Will | null |
| Scenario | I4 |

**Distribution** (Art. 999 — spouse = one LC share; 2:1 ratio for LC/IC):
- Units: (2 LC × 2) + (1 IC × 1) + (spouse × 2) = 7
- Per unit: ₱14M / 7 = **₱2,000,000**

| Heir | Units | Amount | Fraction |
|------|-------|--------|---------|
| Ana (LC) | 2 | ₱4,000,000 | 2/7 |
| Berto (LC) | 2 | ₱4,000,000 | 2/7 |
| Cora (IC) | 1 | ₱2,000,000 | 1/7 |
| Delia (spouse) | 2 | ₱4,000,000 | 2/7 |

**Invariant checks**: Sum = ₱14M ✓; IC = ½ × LC: ₱2M = ½ × ₱4M ✓; Spouse = LC ✓ (Art. 999); No cap (intestate) ✓

---

### TV-25: I7 — Illegitimate Children Only (Intestate)

| Field | Value |
|-------|-------|
| Estate | ₱9,000,000 |
| Heirs | Erna, Fely, Gino (IC, filiation proven) |
| Will | null |
| Scenario | I7 |

**Distribution** (Art. 988 — IC take entire estate equally):
- Per IC: ₱9M / 3 = **₱3,000,000**

| Heir | Amount | Fraction |
|------|--------|---------|
| Erna (IC) | ₱3,000,000 | ⅓ |
| Fely (IC) | ₱3,000,000 | ⅓ |
| Gino (IC) | ₱3,000,000 | ⅓ |

**Invariant checks**: Sum = ₱9M ✓; Equal shares ✓ (Art. 988); Prerequisite: no legitimate descendants or ascendants ✓

---

### TV-26: I8 — Illegitimate Children + Surviving Spouse (Intestate)

| Field | Value |
|-------|-------|
| Estate | ₱10,000,000 |
| Heirs | Hugo, Iris (IC, filiation proven); Jun (spouse) |
| Will | null |
| Scenario | I8 |

**Distribution** (Art. 998 — ½ to spouse, ½ to IC):
- Spouse: ½ = **₱5,000,000**
- IC collective: ½ = ₱5M → each IC **₱2,500,000**

| Heir | Amount | Fraction |
|------|--------|---------|
| Hugo (IC) | ₱2,500,000 | ¼ |
| Iris (IC) | ₱2,500,000 | ¼ |
| Jun (spouse) | ₱5,000,000 | ½ |

**Invariant checks**: Sum = ₱10M ✓; Spouse = ½ ✓; IC collective = ½ ✓ (Art. 998)
**Testate comparison**: In T10, each heir gets ⅓. Spouse gets 50% more intestate (½ vs ⅓).

---

### TV-27: I9 — Legitimate Ascendants + Illegitimate Child (Intestate)

| Field | Value |
|-------|-------|
| Estate | ₱10,000,000 |
| Heirs | Karen (father), Luz (mother); Marco (IC, filiation proven) |
| Will | null |
| Scenario | I9 |

**Distribution** (Art. 991 — ½ to ascendants, ½ to IC, fixed regardless of counts):
- Ascendants (½ total): ₱5M → each parent **₱2,500,000**
- IC (½ total): **₱5,000,000** (all to Marco, sole IC)

| Heir | Amount | Fraction |
|------|--------|---------|
| Karen (father) | ₱2,500,000 | ¼ |
| Luz (mother) | ₱2,500,000 | ¼ |
| Marco (IC) | ₱5,000,000 | ½ |

**Invariant checks**: Sum = ₱10M ✓; Ascendants = ½ ✓; IC = ½ ✓; "whatever be the number" = fixed split ✓
**Testate comparison**: In T8 with 1 IC, IC gets ¼ = ₱2.5M. Intestate gives IC 100% more (₱5M).

---

### TV-28: I10 — Legitimate Ascendants + Illegitimate Children + Surviving Spouse (Intestate)

| Field | Value |
|-------|-------|
| Estate | ₱12,000,000 |
| Heirs | Noel (father, mother predeceased); Ofelia, Pedro (IC, filiation proven); Queenie (spouse) |
| Will | null |
| Scenario | I10 |

**Distribution** (Art. 1000 — ascendants ½, IC ¼, spouse ¼):
- Ascendants (½) = **₱6,000,000** — all to Noel
- IC (¼ total) = ₱3M → each IC **₱1,500,000**
- Spouse (¼) = **₱3,000,000**

| Heir | Amount | Fraction | Legal Basis |
|------|--------|---------|------------|
| Noel (father) | ₱6,000,000 | ½ | Art. 1000 |
| Ofelia (IC) | ₱1,500,000 | ⅛ | Art. 1000 |
| Pedro (IC) | ₱1,500,000 | ⅛ | Art. 1000 |
| Queenie (spouse) | ₱3,000,000 | ¼ | Art. 1000 |

**Invariant checks**: Sum = ₱12M ✓; ½ + ¼ + ¼ = 1 ✓ (Art. 1000)

**Narrative (Queenie — spouse in I10)**:
> **Queenie Navarro (surviving spouse)** receives **₱3,000,000**. The decedent died intestate (without a valid will). As the surviving spouse (Art. 887(3) of the Civil Code), Queenie is a compulsory heir. Under Art. 1000 of the Civil Code, when the surviving spouse concurs with legitimate ascendants and illegitimate children, the estate is divided as follows: one-half (½) to the legitimate ascendants, one-fourth (¼) to the illegitimate children, and one-fourth (¼) to the surviving spouse. With the net distributable estate at ₱12,000,000, Queenie's share is ₱12,000,000 × ¼ = ₱3,000,000. Note: under testate succession with the same family composition (Scenario T9), Queenie would receive only one-eighth (⅛) = ₱1,500,000 — half the intestate amount — because in testate succession the free portion is preserved for the testator's testamentary dispositions, leaving the spouse with a reduced statutory fraction.

**Testate comparison**: Queenie gets 100% more intestate (₱3M vs ₱1.5M in T9).

---

### TV-29: I12 — Surviving Spouse + Siblings (Intestate, Art. 1001)

| Field | Value |
|-------|-------|
| Estate | ₱8,000,000 |
| Heirs | Romy (spouse); Stella, Tino, Uma (full-blood siblings of decedent) |
| Will | null |
| Scenario | I12 |

**Distribution** (Art. 1001 — ½ to spouse, ½ to siblings):
- Spouse (½) = **₱4,000,000**
- Siblings (½ total) = ₱4M / 3 = **₱1,333,333.33** each

| Heir | Amount | Fraction |
|------|--------|---------|
| Romy (spouse) | ₱4,000,000 | ½ |
| Stella (sibling) | ₱1,333,333.33 | 1/6 |
| Tino (sibling) | ₱1,333,333.33 | 1/6 |
| Uma (sibling) | ₱1,333,333.34 | 1/6 |

**Rounding**: ₱4M / 3 = ₱1,333,333.333... Largest-remainder: two heirs get ₱1,333,333.33, one gets ₱1,333,333.34. Total siblings = ₱4,000,000 ✓

**Invariant checks**: Sum = ₱8M ✓; Spouse = ½ ✓; Siblings = ½ ✓ (Art. 1001)
**Scope check**: Art. 1001 scope is siblings and their children only. Remote collaterals (cousins) do not concur — spouse would take all under Art. 995.

---

### TV-30: I13 — Siblings Only (Full + Half Blood)

| Field | Value |
|-------|-------|
| Estate | ₱10,000,000 |
| Heirs | Victor, Willa (full-blood siblings); Ximena (half-blood sibling) |
| Will | null |
| Scenario | I13 |

**Distribution** (Art. 1006 — full blood = 2 × half blood):
- Units: (2 full × 2) + (1 half × 1) = 5
- Per unit: ₱10M / 5 = **₱2,000,000**

| Heir | Blood | Units | Amount | Fraction |
|------|-------|-------|--------|---------|
| Victor (sibling) | Full | 2 | ₱4,000,000 | 2/5 |
| Willa (sibling) | Full | 2 | ₱4,000,000 | 2/5 |
| Ximena (sibling) | Half | 1 | ₱2,000,000 | 1/5 |

**Invariant checks**: Sum = ₱10M ✓; Full blood = 2 × half blood: ₱4M = 2 × ₱2M ✓ (Art. 1006)
**Engine requirement**: `blood_type: BloodType` field (FULL or HALF) required on each collateral heir. See BloodType definition in Section 4.

---

### TV-31: I14 — Other Collateral Relatives (First Cousins)

| Field | Value |
|-------|-------|
| Estate | ₱6,000,000 |
| Heirs | Yvonne, Zack (first cousins — 4th degree collateral; no nearer collaterals survive) |
| Will | null |
| Scenario | I14 |

**Distribution** (Art. 1009 — nearest degree, equal shares, no line or blood distinction):
- Both at 4th degree → equal shares
- Per cousin: ₱6M / 2 = **₱3,000,000**

| Heir | Collateral Degree | Amount | Fraction |
|------|-----------------|--------|---------|
| Yvonne (first cousin) | 4th | ₱3,000,000 | ½ |
| Zack (first cousin) | 4th | ₱3,000,000 | ½ |

**Invariant checks**: Sum = ₱6M ✓; Degree ≤ 5th ✓ (Art. 1010); No line/blood distinction ✓ (Art. 1009 — unlike sibling rules in Art. 1006)

---

### TV-32: I15 — No Heirs (Escheat to State)

| Field | Value |
|-------|-------|
| Estate | ₱5,000,000 |
| Heirs | None within the legal hierarchy |
| Will | null |
| Scenario | I15 |

**Distribution** (Arts. 1011-1013):
- Entire estate to the State
- Art. 1013 split: personal property → municipality/city of decedent's last residence; real property → municipality/city where situated; for benefit of public schools and charitable institutions
- Art. 1014 reclaim window: legitimate heir may appear within 5 years of date of death

| Heir | Amount | Note |
|------|--------|------|
| State (Republic of the Philippines) | ₱5,000,000 | Art. 1011 |

**Invariant checks**: Sum = ₱5M ✓; No eligible heir within 5th collateral degree ✓ (Art. 1010)
**Engine output requirements**: `HeirCategory = STATE`; `escheat_deadline = decedent.date_of_death + 5 years`; narrative explains Art. 1014 reclaim right.

---

### Test Invariants

Every engine implementation must satisfy these invariants for all test vectors and all inputs:

1. **Sum invariant**: Σ(from_estate amounts) = net_distributable_estate (centavo-exact after rounding)
2. **Legitime floor**: For every compulsory heir, total_amount ≥ legitime_amount (unless validly disinherited)
3. **Art. 895 ratio**: In testate, IC_share ≤ ½ × LC_share per line (may be less if capped)
4. **Cap invariant**: In T4/T5a/T5b, Σ(IC_legitimes) ≤ FP_remaining_after_spouse
5. **Representation invariant**: Σ(representative amounts in a line) = line_ancestor's share
6. **Adoption invariant**: adopted_child.amount == biological_legitimate_child.amount (same family)
7. **Preterition invariant**: If preterition detected, all institutions annulled, all heirs inherit intestate
8. **Disinheritance invariant**: Valid disinheritance → heir gets ₱0ero (representatives may get their line share)
9. **Collation invariant**: estate_base = net_estate + Σ(collatable_donations); from_estate_sum = net_estate
10. **Scenario consistency**: The scenario code matches the actual surviving heir combination
11. **Regime B no-cap invariant**: In T6–T9, Art. 895 ¶3 cap does NOT apply. IC share = Art. 896 flat ¼/m (not derived from ½ × per-LC share). Engine must detect Regime B before applying cap logic.
12. **Art. 1001 scope invariant**: In I12, only siblings and nephews/nieces of the decedent concur with spouse — not remote collaterals. Engine must filter using sibling/niece/nephew relationship check.
13. **Illegitimate decedent prerequisite**: T14 and T15 activate ONLY when `decedent.is_illegitimate = true`. If decedent has any children (LC or IC), parents receive nothing (Art. 903 ¶2). Engine must apply this gate before computing T14/T15 legitimes.
14. **BloodType invariant**: In I13/I13a, full-blood siblings receive double the share of half-blood siblings. Engine must store and use the `blood_type` field (BloodType enum) on each collateral heir.
15. **Escheat output invariant**: In I15, engine output must include: `total = E`, `HeirCategory = STATE`, and `escheat_deadline = decedent.date_of_death + 5 years`.

---

## 12. Manual Review Flags

The engine is fully deterministic, but certain legal gray areas require human judgment. The engine flags these and continues with a conservative default, but outputs a warning.

| Flag Code | Trigger | Default Behavior | Legal Basis |
|-----------|---------|-----------------|-------------|
| `GRANDPARENT_OF_ILLEGITIMATE` | Decedent is illegitimate and grandparents survive | Include grandparents as heirs (Art. 989 vs Art. 903 "parents" textual ambiguity) | Art. 903 says "parents" not "ascendants" — gray area |
| `CROSS_CLASS_ACCRETION` | Vacant intestate share with no same-class co-heirs | Default: accrete to all co-heirs proportionally | Art. 1018 vs Art. 968 "same degree" ambiguity |
| `RESERVA_TRONCAL` | Ascendant inherits property that may trace to specific family origin | Flag only; no distribution change | Art. 891: requires asset-level metadata |
| `COLLATION_DISPUTE` | Disputed collatability of a specific donation (Art. 1077) | Output dual computations (with/without collation) | Art. 1077: disputes don't block partition with adequate security |
| `RA_11642_RETROACTIVITY` | Pre-2022 adoption + Sec. 41 extended filiation claimed | Use `config.retroactive_ra_11642` setting | Transitional ambiguity |
| `ARTICULO_MORTIS` | Art. 900 ¶2 conditions detected | Apply ⅓ reduction; require verification of all 3 conditions | Art. 900 ¶2 |
| `USUFRUCT_ANNUITY_OPTION` | Art. 911 ¶3: reduction of an inofficious disposition affects a compulsory heir whose legitime may alternatively be satisfied by usufruct or annuity | Default: apply monetary cash reduction (Art. 911 ¶1-¶2); flag for human election of usufruct/annuity alternative | Art. 911 ¶3 |
| `DUAL_LINE_ASCENDANT` | Family tree contains an ascendant who appears in both the paternal and maternal lines due to a consanguineous (within-family) union | Default: count ascendant in the line from which they are nearer in degree; flag for legal review | Art. 890 (by-line split ambiguous when one person occupies both lines) |
| `POSTHUMOUS_DISINHERITANCE` | Will contains a disinheritance clause naming a person who was conceived but not yet born at the date the will was executed | Default: treat as valid disinheritance if all formal requirements are met and the child is born alive (Art. 1025); flag for legal review of cause timing | Arts. 915-917, 1025 |
| `CONTRADICTORY_DISPOSITIONS` | Will contains two or more clauses that assign incompatible shares to the same heir (e.g., heir A is given ½ in one clause and ⅓ in a separate clause) | Default: use the larger share (most favorable to the heir); flag for legal review of testator intent | Arts. 788-789, 847 (testamentary intent interpretation rules do not resolve arithmetic contradictions) |

---

## 13. Edge Case Catalog

Critical edge cases that the engine MUST handle correctly:

### 13.1 Renunciation

- **Single heir renounces**: Their share accretes to co-heirs (Art. 1018/1015)
- **All nearest-degree heirs renounce**: Next degree inherits in own right (Art. 969) — restart from Step 3
- **Renouncing heir cannot be represented** (Art. 977): No descendants step in for a renouncing heir
- **Renunciation for price = deemed acceptance** (Art. 1050): Triggers no accretion
- **Vacant legitime after renunciation** (Art. 1021): Co-heirs succeed in own right → restart Step 3; NOT proportional accretion

### 13.2 Preterition vs Other Situations

- **Token legacy (₱1) defeats preterition**: ANY testamentary provision prevents total omission — even ₱1
- **Named as substitute-only does NOT prevent preterition**: Being named as a fallback substitute, without direct institution, constitutes total omission
- **Invalid disinheritance ≠ preterition**: If the will disinherited the heir (even invalidly), the heir was "addressed" and Art. 854 does not apply. Use Art. 918 instead.
- **All heirs preterited**: If all compulsory heirs are preterited, the entire estate distributes intestate
- **Spouse is NEVER preterited**: Spouse omission → Art. 855 recovery only

### 13.3 Disinheritance

- **No partial disinheritance** (Art. 915): All-or-nothing. Cannot disinherit from only part of the estate.
- **Reconciliation voids disinheritance** (Art. 922): Any form of reconciliation (not just written), after the offense and before death, voids the disinheritance.
- **Art. 920(8) built-in exception**: The "attempt on the life of the other" ground for parents has an implicit reconciliation exception.
- **Disinheritance + unworthiness gap**: Art. 922 reconciliation (any form) voids disinheritance, but Art. 1033 condonation (must be in writing or known when will made) is required to void unworthiness. A verbally-reconciled parent may still be unworthy.

### 13.4 Cap Rule Edge Cases

- **Cap in T5a (n=1)**: Triggers when m > 1. With just 1 IC and 1 LC and 1 spouse: LC=½, spouse=¼, IC=¼. Add a second IC and the cap is already triggered.
- **Cap in T5b (n≥2)**: Triggers when m > 2(n-1). With n=2, triggers when m > 2.
- **No cap in intestate**: In I3/I4, the 2:1 unit ratio distributes the ENTIRE estate with no cap whatsoever.
- **IC share under cap may be less than ½ × LC share**: This is correct per Art. 895 ¶3 — the cap overrides the ½ ratio.

### 13.5 Collation

- **Art. 1064 — Grandchildren collate parent's donations**: Representatives must collate donations their parent (the predeceased/excluded child) would have collated. Can result in ₱0 distribution.
- **Donor-exempt donation still checked for inofficiousness**: Exemption (Art. 1062) means no equalization deduction, but the donation still counts against the FP for inofficiousness purposes.
- **Valuation always at donation time** (Art. 1071): Destroyed, depreciated, or appreciated property is still valued at what it was worth when given.
- **Wedding gifts below 1/10 FP threshold** (Art. 1070): Exempt up to 1/10 of FP. Only excess is collatable.

### 13.6 Iron Curtain Rule (Art. 992)

In collateral succession, if the decedent is legitimate, the illegitimate relatives of the decedent's sibling (e.g., illegitimate nephew) cannot represent their parent to inherit from the decedent. The illegitimate child and the legitimate relatives of the parent are barred from inheriting from each other's families.

### 13.7 Simultaneous Death (Commorientes)

When two people who inherit from each other die simultaneously and it cannot be proven who died first (Art. 43, Family Code): neither is considered to have survived the other for purposes of the succession between them. The engine treats each as if the other predeceased them.

### 13.8 Articulo Mortis Spouse (Art. 900 ¶2)

The surviving spouse's legitime is reduced from ½ to ⅓ ONLY when ALL THREE conditions are met:
1. Marriage was contracted in articulo mortis (at the point of death)
2. The decedent died within three months of the marriage
3. The illness that caused death was already existing at the time of the marriage

**Exception**: If the couple had cohabited for at least 5 years before the marriage, the normal ½ applies (Art. 900 ¶2 last sentence).

### 13.9 Adoption Edge Cases

- **Rescission before death**: Rescission after death cannot affect inheritance already vested (RA 8552 Sec. 20)
- **Stepparent adoption**: When a biological parent's new spouse adopts the child, both biological and adoptive succession rights are preserved (RA 8552 Sec. 16 / RA 11642 Sec. 42)
- **RA 11642 extended filiation** (Sec. 41): The adoptee gains inheritance rights from/to the adopter's relatives (parents, legitimate siblings, legitimate descendants). Flag with RA_11642_RETROACTIVITY if the adoption decree predates 2022.

---

## 14. Implementation Requirements

### 14.1 Arithmetic

- **Mandatory**: All intermediate computations MUST use exact rational arithmetic (BigInt numerator, BigInt denominator, GCD-reduced)
- **Forbidden**: Do NOT use floating-point (float, double) for any monetary or fractional computation
- **Centavo conversion**: Only convert to Money (centavos) in Step 10 (finalize)
- **Rounding method**: Floor each individual share to centavos, then distribute remainder by largest-remainder method (1 centavo at a time to largest shares first)

### 14.2 Validation

- Implement all 10 test invariants as runtime assertions in test mode
- Every `DisinheritanceCause` must be validated against the heir's category at classification time
- Log every legal decision with its article citation

### 14.3 Pipeline Restart

- Implement the restart counter and guard: `max_restarts = len(heirs)` (configurable via `EngineConfig.max_pipeline_restarts`)
- On exceeding the limit, raise an error with a `PIPELINE_RESTART_LIMIT_EXCEEDED` warning

### 14.4 Determinism

The engine must be fully deterministic:
- No randomness
- No external state
- No LLM or AI in the computation path
- Iteration order over data structures must be deterministic (sort heirs by ID before processing)

### 14.5 Narrative Generation

- Narrative generation is template-based, not AI-generated
- Every peso amount displayed must be derived directly from the InheritanceShare struct
- Every article citation in a narrative must correspond to an actual decision made during computation
- Self-containment: Each narrative is comprehensible without reference to any other document

### 14.6 Testing Requirements

- Unit test each legitime scenario (T1-T15) with both cap-triggered and non-cap cases
- Unit test each intestate scenario (I1-I15)
- Integration test all 13 test vectors above
- Test all 19 NarrativeSectionType variants: verify each section type is generated correctly for at least one test vector (see Section 10.3 composition order and Sections 10.4-10.22 templates)
- Test the 10 invariants against all test vectors

---

*This specification was synthesized from 24 analysis files produced by the `loops/inheritance-reverse/` reverse-Ralph loop. All legal rules are grounded in the Philippine Civil Code (RA 386), Family Code (EO 209), RA 8552 (Domestic Adoption Act of 1998), and RA 11642 (Domestic Administrative Adoption Act of 2022).*

*For the complete analysis files, edge case catalog, and worked examples, see `loops/inheritance-reverse/analysis/`.*
