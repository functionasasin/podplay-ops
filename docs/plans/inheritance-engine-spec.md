# Philippine Inheritance Distribution Engine — Software Specification

**Version**: 1.0
**Date**: 2026-02-23
**Status**: Draft (pending spec-review)

---

## 1. Overview

### 1.1 Purpose

This document specifies a **fully deterministic** software engine that computes the inheritance distribution for a Philippine estate. Given a net distributable estate amount (after tax), a family tree with heir classifications, and an optional will, the engine produces:

1. **Per-heir peso amounts** — exact breakdown of who gets what
2. **Plain-English narrative per heir** — explaining WHY they received that amount, citing specific legal articles

### 1.2 Scope

| In Scope | Out of Scope |
|----------|-------------|
| Testate succession (with a will) | Estate tax computation (upstream engine) |
| Intestate succession (no will) | Will probate / form validity |
| Mixed succession (partial will) | Property regime liquidation |
| Legitime computation | Court dispute resolution |
| Free portion allocation | Physical partition of assets |
| Collation of inter vivos donations | |
| Preterition, disinheritance, accretion | |
| Per-heir narrative explanations | |

### 1.3 Legal Basis

| Source | Coverage |
|--------|----------|
| Civil Code (RA 386), Book III — Succession | Arts. 774-1105: testate, intestate, legitime, disinheritance, collation, accretion |
| Family Code (EO 209) | Arts. 163-176, 179-180: legitimacy, illegitimacy, legitimation |
| RA 8552 (Domestic Adoption Act, 1998) | Sec. 17-18: adopted children = legitimate for succession |
| RA 11642 (Administrative Adoption, 2022) | Sec. 41-47: extended filiation to adopter's relatives |

### 1.4 Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Engine type | Fully deterministic | Inheritance shares must be auditable — no LLM in the computation loop |
| Arithmetic | Exact rational (BigInt fractions) | Floating-point rounding errors are unacceptable for legal computations |
| Input | Net distributable estate + family tree + will + donations | Downstream of estate-tax engine |
| Output | Numbers table + narrative per heir | Users (heirs, executors) need to understand WHY |
| Ambiguities | Resolved by analysis or flagged as manual review warnings | Engine never guesses — deterministic or flagged |

---

## 2. Architecture

### 2.1 Pipeline Overview

The engine is a **10-step sequential pipeline** with two controlled restart points.

```
┌──────────────────────────────────────────────────────────────┐
│                       ENGINE INPUT                            │
│  net_distributable_estate + family_tree + will + donations    │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
             ┌─────────────────────────┐
             │  Step 1: CLASSIFY HEIRS  │  Determine each person's legal category
             └─────────────┬───────────┘
                           │
                           ▼
             ┌─────────────────────────────┐
             │  Step 2: BUILD LINES         │  Representation analysis, line counting
             └─────────────┬───────────────┘
                           │
                           ▼
             ┌──────────────────────────────────┐
             │  Step 3: DETERMINE SUCCESSION     │  Testate/intestate/mixed → scenario code
             │  TYPE + SCENARIO                  │
             └─────────────┬────────────────────┘
                           │
                           ▼
             ┌───────────────────────────────┐
             │  Step 4: COMPUTE ESTATE BASE  │  Add collatable donations (Art. 908)
             └─────────────┬─────────────────┘
                           │
                           ▼
             ┌──────────────────────────────┐
             │  Step 5: COMPUTE LEGITIMES    │  Fraction table + cap rule
             └─────────────┬────────────────┘
                           │
                           ▼
             ┌───────────────────────────────────┐
             │  Step 6: TESTATE VALIDATION        │  Preterition → disinheritance →
             │  [may restart → Step 3]            │  underprovision → inofficiousness
             └─────────────┬─────────────────────┘
                           │
                           ▼
             ┌───────────────────────────────────┐
             │  Step 7: DISTRIBUTE ESTATE         │  Legitime + FP / intestate shares
             └─────────────┬─────────────────────┘
                           │
                           ▼
             ┌────────────────────────────────────┐
             │  Step 8: COLLATION ADJUSTMENT       │  Impute donations against shares
             └─────────────┬──────────────────────┘
                           │
                           ▼
             ┌─────────────────────────────────┐
             │  Step 9: VACANCY RESOLUTION      │  Substitution → representation →
             │  [may restart → Step 3]          │  accretion → intestate fallback
             └─────────────┬───────────────────┘
                           │
                           ▼
             ┌───────────────────────────────┐
             │  Step 10: FINALIZE + NARRATE   │  Rational→peso rounding, narratives
             └─────────────┬─────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                       ENGINE OUTPUT                           │
│  per-heir shares (₱ amounts) + narratives + audit trail       │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Restart Conditions

| Restart | Trigger | From → To | Guard |
|---------|---------|-----------|-------|
| Invalid disinheritance | Art. 918: heir reinstated, scenario may change | Step 6 → Step 3 | max_restarts = heir_count |
| Vacant legitime | Art. 1021: co-heirs succeed "in their own right" | Step 9 → Step 3 | max_restarts = heir_count |
| Total renunciation | Art. 969: next degree inherits in own right | Step 9 → Step 3 | max_restarts = heir_count |

### 2.3 Two Free Portion Values

The engine tracks two distinct FP values throughout:

| Value | Definition | Used By |
|-------|-----------|---------|
| `FP_gross` | Estate base − collective legitimate children's legitime (before spouse/IC deduction) | Art. 895 ¶3 cap base |
| `FP_disposable` | FP_gross − spouse legitime − IC legitime (testator's actual freedom) | Testate validation (Step 6), will distribution (Step 7) |

### 2.4 Mixed Succession Detection

Succession type detection is a **two-pass** process:
- **Step 3 (preliminary)**: If a will exists → TESTATE (tentative). If no will → INTESTATE.
- **After Step 5 (definitive)**: Once `FP_disposable` is known, the engine evaluates will coverage. If testamentary dispositions consume less than `FP_disposable` and no residuary clause exists, the succession type is refined to MIXED. See §7.5 for the detection algorithm and distribution pseudocode.

---

## 3. Data Model

### 3.1 Primitive Types

```
struct Fraction {
    numerator: BigInt,
    denominator: BigInt,
}
// Always stored in lowest terms (GCD-reduced)
// ALL intermediate computations use Fraction
// Convert to Money only in Step 10

struct Money {
    centavos: BigInt,       // ₱1.00 = 100
}

type HeirId = String        // Opaque identifier
type DonationId = String
type DispositionId = String
type AssetId = String
type PersonId = String
type Date = ISO-8601 string // "2026-01-15"

enum LineOfDescent { PATERNAL, MATERNAL }
```

### 3.2 Engine Input

```
struct EngineInput {
    net_distributable_estate: Money,    // Output of estate-tax engine
    decedent: Decedent,
    family_tree: List<Person>,          // All potential heirs (pre-classification)
    will: Will?,                        // null = intestate
    donations: List<Donation>,          // Inter vivos donations by decedent
    config: EngineConfig,
}

struct Decedent {
    id: PersonId,
    name: String,
    date_of_death: Date,
    is_married: bool,
    date_of_marriage: Date?,
    marriage_solemnized_in_articulo_mortis: bool,    // Art. 900 ¶2
    was_ill_at_marriage: bool,                       // Art. 900 ¶2
    illness_caused_death: bool,                      // Art. 900 ¶2
    years_of_cohabitation: int,                      // ≥5 exempts articulo mortis
    has_legal_separation: bool,
    is_illegitimate: bool,                           // Art. 903/992
}

struct Person {
    id: PersonId,
    name: String,
    is_alive_at_succession: bool,
    relationship_to_decedent: Relationship,
    degree: int,                            // 1=child/parent, 2=grandchild, etc.
    line: LineOfDescent?,                   // For ascendants
    children: List<PersonId>,
    filiation_proved: bool,                 // Required for illegitimate children
    filiation_proof_type: FiliationProof?,
    is_guilty_party_in_legal_separation: bool,
    adoption: Adoption?,
    is_unworthy: bool,                      // Art. 1032
    unworthiness_condoned: bool,            // Art. 1033
    has_renounced: bool,
}

enum Relationship {
    LEGITIMATE_CHILD, LEGITIMATED_CHILD, ADOPTED_CHILD,
    ILLEGITIMATE_CHILD, SURVIVING_SPOUSE,
    LEGITIMATE_PARENT, LEGITIMATE_ASCENDANT,
    SIBLING, NEPHEW_NIECE, OTHER_COLLATERAL, STRANGER,
}

enum FiliationProof {
    BIRTH_CERTIFICATE,              // FC Art. 172(1)
    FINAL_JUDGMENT,                 // FC Art. 172(1)
    PUBLIC_DOCUMENT_ADMISSION,      // FC Art. 172(2)
    PRIVATE_HANDWRITTEN_ADMISSION,  // FC Art. 172(2)
    OPEN_CONTINUOUS_POSSESSION,     // FC Art. 172 ¶2(1)
    OTHER_EVIDENCE,                 // FC Art. 172 ¶2(2)
}

struct Adoption {
    decree_date: Date,
    regime: AdoptionRegime,
    adopter: PersonId,
    adoptee: PersonId,
    is_stepparent_adoption: bool,
    biological_parent_spouse: PersonId?,
    is_rescinded: bool,
    rescission_date: Date?,
}

enum AdoptionRegime { RA_8552, RA_11642 }

struct EngineConfig {
    retroactive_ra_11642: bool,     // Default: false
    max_pipeline_restarts: int,     // Default: heir_count
}
```

### 3.3 Will and Testamentary Dispositions

```
struct Will {
    institutions: List<InstitutionOfHeir>,
    legacies: List<Legacy>,
    devises: List<Devise>,
    disinheritances: List<Disinheritance>,
    date_executed: Date,
}

struct InstitutionOfHeir {
    id: DispositionId,
    heir: HeirReference,
    share: ShareSpec,
    conditions: List<Condition>,
    substitutes: List<Substitute>,
    is_residuary: bool,
}

enum ShareSpec {
    Fraction(Fraction),     // "I leave ½ to A"
    EqualWithOthers,        // "I leave to A, B, C equally" (Art. 846)
    EntireEstate,           // "I leave everything to A"
    EntireFreePort,         // "I leave the free portion to A"
    Unspecified,            // Named as heir, no share → equal (Art. 846)
    Residuary,              // "the remainder to A" (Art. 851)
}

struct HeirReference {
    person_id: PersonId?,
    name: String,
    is_collective: bool,            // "children of C" → Art. 847
    class_designation: String?,     // "the poor of Makati"
}

struct Legacy {
    id: DispositionId,
    legatee: HeirReference,
    property: LegacySpec,
    conditions: List<Condition>,
    substitutes: List<Substitute>,
    is_preferred: bool,             // Art. 911 preference in reduction
}

enum LegacySpec {
    FixedAmount(Money),
    SpecificAsset(AssetId),
    GenericClass(String, Money),
}

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
enum ConditionType { SUSPENSIVE, RESOLUTORY, MODAL }
enum ConditionStatus { PENDING, FULFILLED, FAILED, NOT_APPLICABLE }

struct Substitute {
    type: SubstitutionType,
    substitute_heir: HeirReference,
    triggers: List<SubstitutionTrigger>,
}
enum SubstitutionType { SIMPLE, RECIPROCAL, FIDEICOMMISSARY }
enum SubstitutionTrigger { PREDECEASE, RENUNCIATION, INCAPACITY }

struct FideicommissarySubstitution {
    fiduciary: HeirReference,           // First heir — obligated to preserve
    fideicommissary: HeirReference,     // Second heir — ultimate beneficiary
    property_scope: ShareSpec,          // What must be preserved and transmitted
    is_express: bool,                   // Art. 863: must be expressly stated in will
    is_valid: bool,                     // Engine-computed (output of validate_fideicommissary)
    invalidity_reason: String?,         // If invalid, why
}
```

#### Fideicommissary Substitution — Art. 863 Validity Requirements

A fideicommissary substitution obliges the fiduciary (first heir) to **preserve and transmit** property to the fideicommissary (second heir). It is valid only if ALL four conditions are met:

| # | Condition | Legal Basis | Check |
|---|-----------|-------------|-------|
| 1 | **One-degree limit** | Art. 863 | Fideicommissary must be one generation from fiduciary (parent-child). Majority interpretation: "one degree" = one generation, not one transfer. |
| 2 | **Both alive at testator's death** | Art. 863 | Both fiduciary and fideicommissary must be living when the testator dies. Predecease of either voids the substitution. |
| 3 | **Express only** | Art. 863 | Must be expressly stated in the will. Cannot be implied from ambiguous language (e.g., "I hope A will give to B" is NOT fideicommissary). |
| 4 | **Cannot burden legitime** | Art. 863 + Art. 872 | The fideicommissary obligation can only apply to the free portion. If scope overlaps with fiduciary's legitime, Art. 872 strips the obligation from the legitime portion. |

```
function validate_fideicommissary(
    sub: FideicommissarySubstitution,
    persons: Map<PersonId, Person>,
    date_of_death: Date,
    fiduciary_heir: Heir,
    legitimes: Map<HeirId, Fraction>
) -> FideicommissaryValidationResult {

    fiduciary = persons[sub.fiduciary.person_id]
    fideicommissary_person = persons[sub.fideicommissary.person_id]

    // Check 1: Express requirement
    if NOT sub.is_express:
        return INVALID("Art. 863: Fideicommissary substitution must be express")

    // Check 2: Both alive at testator's death
    if NOT fiduciary.is_alive_at(date_of_death):
        return INVALID("Art. 863: Fiduciary not alive at testator's death")
    if NOT fideicommissary_person.is_alive_at(date_of_death):
        return INVALID("Art. 863: Fideicommissary not alive at testator's death")

    // Check 3: One-degree limit (one generation = parent-child)
    if NOT is_parent_child(fiduciary, fideicommissary_person):
        return INVALID("Art. 863: Fideicommissary exceeds one-degree limit")

    // Check 4: Cannot burden legitime (Art. 863 + Art. 872)
    if fiduciary_heir.is_compulsory:
        fiduciary_legitime = legitimes[fiduciary_heir.id]
        fiduciary_fp_share = fiduciary_heir.total_share - fiduciary_legitime
        if sub.property_scope.as_fraction() > fiduciary_fp_share:
            // Art. 872: strip obligation from legitime, apply only to FP share
            return PARTIAL_VALID(
                "Art. 872: Fideicommissary obligation narrowed to FP share only"
            )

    return VALID
}

enum FideicommissaryValidationResult {
    VALID,
    INVALID(reason: String),
    PARTIAL_VALID(reason: String),
        // Scope narrowed: obligation applies only to fiduciary's FP share
}
```

**Engine behavior**:
- **Valid**: Distribute to fiduciary normally. Attach obligation as metadata on `HeirShare.fideicommissary`. Narrative explains preservation-and-transmission duty.
- **Invalid**: Substitution void (treated as not written). Fiduciary keeps property free of obligation. No redistribution.
- **Partial valid** (legitime burden): Split fiduciary's share — legitime portion unconditional, FP portion carries fideicommissary obligation.

**Important**: Fideicommissary substitution is NOT a vacancy resolution mechanism. It does not trigger when the fiduciary dies or refuses. It creates a post-distribution obligation. Vacancy of the fiduciary's share follows the normal priority chain (simple substitution → representation → accretion → intestate).

```

struct Disinheritance {
    heir_reference: HeirReference,
    cause_code: DisinheritanceCause,
    cause_specified_in_will: bool,
    cause_proven: bool,
    reconciliation_occurred: bool,
}

enum DisinheritanceCause {
    // Art. 919 — Children/descendants (8 causes, legitimate AND illegitimate)
    CHILD_ATTEMPT_ON_LIFE,              // 919(1)
    CHILD_GROUNDLESS_ACCUSATION,        // 919(2)
    CHILD_ADULTERY_WITH_SPOUSE,         // 919(3)
    CHILD_FRAUD_UNDUE_INFLUENCE,        // 919(4)
    CHILD_REFUSAL_TO_SUPPORT,           // 919(5)
    CHILD_MALTREATMENT,                 // 919(6)
    CHILD_DISHONORABLE_LIFE,            // 919(7)
    CHILD_CIVIL_INTERDICTION,           // 919(8)
    // Art. 920 — Parents/ascendants (8 causes)
    PARENT_ABANDONMENT_CORRUPTION,      // 920(1)
    PARENT_ATTEMPT_ON_LIFE,             // 920(2)
    PARENT_GROUNDLESS_ACCUSATION,       // 920(3)
    PARENT_ADULTERY_WITH_SPOUSE,        // 920(4)
    PARENT_FRAUD_UNDUE_INFLUENCE,       // 920(5)
    PARENT_LOSS_PARENTAL_AUTHORITY,     // 920(6)
    PARENT_REFUSAL_TO_SUPPORT,          // 920(7)
    PARENT_ATTEMPT_ON_OTHER,            // 920(8)
    // Art. 921 — Spouse (6 causes)
    SPOUSE_ATTEMPT_ON_LIFE,             // 921(1)
    SPOUSE_GROUNDLESS_ACCUSATION,       // 921(2)
    SPOUSE_FRAUD_UNDUE_INFLUENCE,       // 921(3)
    SPOUSE_CAUSE_LEGAL_SEPARATION,      // 921(4)
    SPOUSE_LOSS_PARENTAL_AUTHORITY,     // 921(5)
    SPOUSE_REFUSAL_TO_SUPPORT,          // 921(6)
}
```

### 3.4 Donation (Inter Vivos Gifts)

```
struct Donation {
    id: DonationId,
    recipient_heir_id: HeirId?,
    recipient_is_stranger: bool,
    value_at_time_of_donation: Money,       // Art. 1071: ALWAYS donation-time value
    date: Date,
    description: String,
    // Collatability flags (Arts. 1061-1070)
    is_expressly_exempt: bool,              // Art. 1062
    is_support_education_medical: bool,     // Art. 1067: exempt
    is_customary_gift: bool,                // Art. 1067: exempt
    is_professional_expense: bool,          // Art. 1068: conditionally exempt
    professional_expense_parent_required: bool,
    professional_expense_imputed_savings: Money?,
    is_joint_from_both_parents: bool,       // Art. 1072: split ½
    is_to_child_spouse_only: bool,          // Art. 1066: exempt
    is_joint_to_child_and_spouse: bool,     // Art. 1066 ¶2: ½ collatable
    is_wedding_gift: bool,                  // Art. 1070: 1/10 FP threshold
    is_debt_payment_for_child: bool,        // Art. 1069: collatable
    is_election_expense: bool,              // Art. 1069: collatable
    is_fine_payment: bool,                  // Art. 1069: collatable
}
```

### 3.5 Classified Heir (Pipeline Internal)

```
struct Heir {
    id: HeirId,
    name: String,
    raw_category: HeirCategory,
    effective_category: EffectiveCategory,
    is_compulsory: bool,
    is_alive: bool,
    is_eligible: bool,
    filiation_proved: bool,
    filiation_proof_type: FiliationProof?,
    is_unworthy: bool,
    unworthiness_condoned: bool,
    is_disinherited: bool,              // Set in Step 6
    disinheritance_valid: bool,         // Set in Step 6
    has_renounced: bool,
    adoption: Adoption?,
    has_valid_adoption: bool,
    is_stepparent_adoptee: bool,
    legal_separation_guilty: bool,      // Art. 1002
    articulo_mortis_marriage: bool,     // Art. 900 ¶2
    degree_from_decedent: int,
    line: LineOfDescent?,               // For ascendants
    blood_type: BloodType?,             // For collaterals (Art. 1006)
    representation_trigger: RepresentationTrigger?,
    represented_by: List<HeirId>,
    represents: HeirId?,
    inherits_by: InheritanceMode,
    line_ancestor: HeirId?,
    children: List<HeirId>,
}

enum HeirCategory {
    LEGITIMATE_CHILD, LEGITIMATED_CHILD, ADOPTED_CHILD,
    ILLEGITIMATE_CHILD, SURVIVING_SPOUSE,
    LEGITIMATE_PARENT, LEGITIMATE_ASCENDANT,
}

enum EffectiveCategory {
    LEGITIMATE_CHILD_GROUP,         // Includes legitimate, legitimated, adopted
    ILLEGITIMATE_CHILD_GROUP,
    SURVIVING_SPOUSE_GROUP,
    LEGITIMATE_ASCENDANT_GROUP,
}

enum InheritanceMode { OWN_RIGHT, REPRESENTATION }
enum RepresentationTrigger { PREDECEASE, DISINHERITANCE, INCAPACITY, UNWORTHINESS }
// Note: RENUNCIATION is NOT a trigger (Art. 977)
enum BloodType { FULL, HALF }
```

### 3.6 Engine Output

```
struct EngineOutput {
    per_heir_shares: List<InheritanceShare>,
    narratives: List<HeirNarrative>,
    computation_log: ComputationLog,
    warnings: List<ManualFlag>,
    succession_type: SuccessionType,
    scenario_code: String,
}

struct InheritanceShare {
    heir_id: HeirId,
    heir_name: String,
    heir_category: EffectiveCategory,
    inherits_by: InheritanceMode,
    represents: HeirId?,
    from_legitime: Money,
    from_free_portion: Money,
    from_intestate: Money,
    total: Money,
    legitime_fraction: String,          // Human-readable, e.g., "1/4"
    legal_basis: List<String>,
    donations_imputed: Money,           // Deducted via collation
    gross_entitlement: Money,           // Before donation deduction
    net_from_estate: Money,             // What heir actually receives
}

struct HeirNarrative {
    heir_id: HeirId,
    heir_name: String,
    heir_category_label: String,
    text: String,                       // Complete narrative paragraph
}

struct ComputationLog {
    steps: List<StepLog>,
    total_restarts: int,
    final_scenario: String,
}

enum SuccessionType { TESTATE, INTESTATE, MIXED, INTESTATE_BY_PRETERITION }
```

### 3.7 Scenario Codes

#### Testate Scenarios (T1-T15)

| Code | Surviving Heirs | Regime | Key Articles |
|------|----------------|--------|-------------|
| **T1** | n legitimate children only | A | Art. 888 |
| **T2** | 1 legitimate child + spouse | A | Arts. 888, 892 ¶1 |
| **T3** | n≥2 legitimate children + spouse | A | Arts. 888, 892 ¶2 |
| **T4** | n legitimate + m illegitimate | A | Arts. 888, 895 |
| **T5a** | 1 LC + m IC + spouse | A | Arts. 888, 892 ¶1, 895 |
| **T5b** | n≥2 LC + m IC + spouse | A | Arts. 888, 892 ¶2, 895 |
| **T6** | Legitimate ascendants only | B | Art. 889 |
| **T7** | Ascendants + spouse | B | Arts. 889, 893 |
| **T8** | Ascendants + m illegitimate | B | Arts. 889, 896 |
| **T9** | Ascendants + m IC + spouse | B | Arts. 889, 896, 899 |
| **T10** | m IC + spouse | C | Art. 894 |
| **T11** | m IC only | C | Art. 901 |
| **T12** | Spouse only | C | Art. 900 |
| **T13** | No compulsory heirs | — | Full FP |
| **T14** | Parents of illegitimate decedent | — | Art. 903 |
| **T15** | Parents + spouse of illegitimate decedent | — | Art. 903 |

#### Intestate Scenarios (I1-I15)

| Code | Surviving Heirs | Key Articles |
|------|----------------|-------------|
| **I1** | n legitimate children only | Art. 980 |
| **I2** | n LC + spouse | Arts. 994, 996 |
| **I3** | n LC + m IC | Arts. 983, 895 |
| **I4** | n LC + m IC + spouse | Arts. 999, 983, 895 |
| **I5** | Legitimate ascendants only | Arts. 985-987 |
| **I6** | Ascendants + spouse | Art. 997 |
| **I7** | m IC only | Art. 988 |
| **I8** | m IC + spouse | Art. 998 |
| **I9** | Ascendants + m IC | Art. 991 |
| **I10** | Ascendants + m IC + spouse | Art. 1000 |
| **I11** | Spouse only | Art. 995 |
| **I12** | Spouse + siblings/nephews/nieces | Art. 1001 |
| **I13** | Siblings/nephews/nieces only | Arts. 1003-1008 |
| **I14** | Other collaterals (≤5th degree) | Arts. 1009-1010 |
| **I15** | No heirs → State | Arts. 1011-1014 |

---

## 4. Heir Classification Rules

### 4.1 Compulsory Heir Categories (Art. 887)

There are 4 **effective categories** that determine computation. Seven raw sub-categories map into them:

| Raw Category | Effective Category | Legal Basis |
|-------------|-------------------|-------------|
| Legitimate child | LEGITIMATE_CHILD_GROUP | Art. 887(1) |
| Legitimated child | LEGITIMATE_CHILD_GROUP | FC Art. 179 |
| Adopted child | LEGITIMATE_CHILD_GROUP | RA 8552 Sec. 17 |
| Illegitimate child | ILLEGITIMATE_CHILD_GROUP | Art. 887(5), FC Art. 176 |
| Surviving spouse | SURVIVING_SPOUSE_GROUP | Art. 887(3) |
| Legitimate parent | LEGITIMATE_ASCENDANT_GROUP | Art. 887(2) |
| Legitimate ascendant | LEGITIMATE_ASCENDANT_GROUP | Art. 887(2) |

**Critical rule**: Adopted children receive the **exact same share** as biological legitimate children in ALL computations. Any code that produces a different share for an adopted child is a bug (RA 8552 Sec. 17).

### 4.2 Mutual Exclusion

- **Groups 1 and 4 are mutually exclusive**: If ANY legitimate descendant survives (including by representation), ALL ascendants are excluded from compulsory succession (Art. 887(2))
- **Groups 2 and 3 always concur**: Surviving spouse and illegitimate children concur with whichever primary group (descendants or ascendants) is present

### 4.3 Eligibility Gate

Before an heir can participate in succession, they must pass these checks:

```
function check_eligibility(person, category):
    if category == ILLEGITIMATE_CHILD AND NOT person.filiation_proved:
        return false    // Art. 887 ¶3: filiation must be duly proved

    if category == ADOPTED_CHILD AND person.adoption_rescinded:
        return false    // RA 8552 Sec. 20

    if category == SURVIVING_SPOUSE AND person.legal_separation_guilty:
        return false    // Art. 1002

    if person.is_unworthy AND NOT person.unworthiness_condoned:
        return false    // Art. 1032

    return true
```

### 4.4 Illegitimate Children — Filiation Proof

Filiation is a **hard gate** (Art. 887 ¶3). The 6 proof methods under FC Art. 172:

1. Record of birth in the civil register
2. Final judgment establishing filiation
3. Admission of filiation in a public document
4. Private handwritten instrument signed by the parent
5. Open and continuous possession of the status of an illegitimate child
6. Any other means allowed by the Rules of Court

FC Art. 176 unified classification: ALL illegitimate children get the same share (the old 3-tier system of acknowledged natural / natural by legal fiction / other illegitimate was abolished).

---

## 5. Representation (Arts. 970-977)

### 5.1 Triggers

| Trigger | Art. | Creates Line? |
|---------|------|--------------|
| Predecease | 981-982 | Yes |
| Disinheritance | 923 | Yes |
| Incapacity / Unworthiness | 1035 | Yes |
| **Renunciation** | **977** | **NO** — renouncing heir CANNOT be represented |

### 5.2 Rules

- **Per stirpes** (Art. 974): Representatives divide the ancestor's share equally among themselves
- **Lines not heads**: Count lines (not individuals) for scenario determination. One living child = 1 line. One predeceased child with 5 grandchildren = 1 line.
- **No depth limit** in the direct descending line (Art. 982): grandchildren, great-grandchildren, etc.
- **Collateral limit** (Art. 972): Only children of siblings can represent. Grand-nephews/nieces cannot.
- **Per capita switch** (Art. 975): When ONLY nephews/nieces survive (all siblings predeceased), they inherit equally regardless of which sibling they descend from
- **Illegitimate children can be represented** (Art. 902): Both legitimate and illegitimate descendants can represent a predeceased illegitimate child. The representative inherits the illegitimate share.

### 5.3 Build Lines Algorithm

```
function build_single_line(heir, all_heirs):
    if heir.is_alive AND heir.is_eligible AND NOT heir.has_renounced:
        return Line(mode=OWN_RIGHT, heir=heir)

    trigger = get_representation_trigger(heir)
    if trigger == RENUNCIATION:
        return null     // Art. 977: no representation

    if trigger in {PREDECEASE, DISINHERITANCE, INCAPACITY, UNWORTHINESS}:
        reps = find_representatives_recursive(heir, all_heirs)
        if len(reps) > 0:
            return Line(mode=REPRESENTATION, representatives=reps)

    return null         // Line extinct
```

---

## 6. Complete Legitime Fraction Table (Testate)

All fractions are of the **collation-adjusted estate base** `E_adj` (see Step 4).

### 6.1 Regime A — Descendants Present

**Legitimate children always get a fixed collective ½. Other shares are derived.**

#### T1: n Legitimate Children Only (Art. 888)

| Heir | Fraction |
|------|----------|
| Each LC | 1/(2n) |
| Free portion | ½ |

#### T2: 1 LC + Spouse (Arts. 888, 892 ¶1)

| Heir | Fraction | Source |
|------|----------|--------|
| LC | ½ | Direct from estate |
| Spouse | ¼ | From FP |
| Free portion | ¼ | |

#### T3: n≥2 LC + Spouse (Arts. 888, 892 ¶2)

| Heir | Fraction | Source |
|------|----------|--------|
| Each LC | 1/(2n) | Direct from estate |
| Spouse | 1/(2n) = same as one LC | From FP |
| Free portion | (n−1)/(2n) | |

**Art. 892 discontinuity**: At n=1, spouse gets ¼. At n=2, spouse gets ¼ (coincidental match). At n=3+, spouse gets less than ¼. Different formula paths.

#### T4: n LC + m IC, No Spouse (Arts. 888, 895)

| Heir | Fraction (uncapped) |
|------|-------------------|
| Each LC | 1/(2n) |
| Each IC (uncapped) | 1/(4n) |
| FP_gross | ½ |

**Cap rule** (Art. 895 ¶3): `total_IC ≤ FP_gross`
- Cap bites when: `m > 2n`
- Capped per IC: `(½) / m`

#### T5a: 1 LC + m IC + Spouse (Arts. 888, 892 ¶1, 895)

| Heir | Fraction (uncapped) |
|------|-------------------|
| LC | ½ |
| Spouse | ¼ (from FP) |
| Each IC (uncapped) | ¼ |
| FP_gross | ½ |

**Cap rule with spouse priority**:
1. FP_gross = ½
2. Spouse satisfied first: FP_remaining = ½ − ¼ = ¼
3. Cap = FP_remaining = ¼
4. Cap bites when: `m > 1`
5. Capped per IC: `¼ / m`

#### T5b: n≥2 LC + m IC + Spouse (Arts. 888, 892 ¶2, 895, 897)

| Heir | Fraction (uncapped) |
|------|-------------------|
| Each LC | 1/(2n) |
| Spouse | 1/(2n) (from FP) |
| Each IC (uncapped) | 1/(4n) |
| FP_gross | ½ |

**Cap rule with spouse priority**:
1. FP_gross = ½
2. Spouse = 1/(2n), from FP
3. FP_remaining = ½ − 1/(2n) = (n−1)/(2n)
4. Cap bites when: `m > 2(n−1)`
5. Capped per IC: `(n−1)/(2n) / m`

### 6.2 Regime B — Ascendants Present, No Descendants

**Flat statutory fractions. No cap rule needed.**

#### T6: Ascendants Only (Art. 889)

| Heir | Fraction |
|------|----------|
| Ascendants (collective) | ½ |
| Free portion | ½ |

#### T7: Ascendants + Spouse (Arts. 889, 893)

| Heir | Fraction |
|------|----------|
| Ascendants | ½ |
| Spouse | ¼ (from FP) |
| Free portion | ¼ |

#### T8: Ascendants + m IC (Arts. 889, 896)

| Heir | Fraction |
|------|----------|
| Ascendants | ½ |
| IC (collective) | ¼ (Art. 896 flat) |
| Each IC | ¼/m |
| Free portion | ¼ |

#### T9: Ascendants + m IC + Spouse (Art. 899)

| Heir | Fraction |
|------|----------|
| Ascendants | ½ |
| IC (collective) | ¼ |
| Each IC | ¼/m |
| Spouse | ⅛ |
| Free portion | ⅛ |

**T9 is the most constrained scenario** — only ⅛ free portion.

### 6.3 Regime C — No Primary/Secondary Compulsory Heirs

#### T10: m IC + Spouse (Art. 894)

| Heir | Fraction |
|------|----------|
| IC (collective) | ⅓ |
| Spouse | ⅓ |
| Free portion | ⅓ |

#### T11: m IC Only (Art. 901)

| Heir | Fraction |
|------|----------|
| IC (collective) | ½ |
| Free portion | ½ |

#### T12: Spouse Only (Art. 900)

| Heir | Fraction |
|------|----------|
| Spouse | ½ (normal) or ⅓ (articulo mortis, Art. 900 ¶2) |
| Free portion | ½ or ⅔ |

**Articulo mortis** (Art. 900 ¶2): Spouse's legitime reduced from ½ to ⅓ ONLY when ALL three conditions hold:
1. Marriage contracted during the illness that caused death
2. Decedent did not recover
3. Spouse is the sole compulsory heir (no children, no ascendants, no ICs)

#### T13: No Compulsory Heirs

| Heir | Fraction |
|------|----------|
| Free portion | 1 (entire estate) |

### 6.4 Special: Illegitimate Decedent (Art. 903)

#### T14: Parents of Illegitimate Decedent

| Heir | Fraction |
|------|----------|
| Parents (collective) | ½ |
| Free portion | ½ |

#### T15: Parents + Spouse of Illegitimate Decedent

| Heir | Fraction |
|------|----------|
| Parents (collective) | ¼ |
| Spouse | ¼ |
| Free portion | ½ |

**Note**: Art. 903 says "parents" not "ascendants." Whether grandparents of an illegitimate decedent can inherit is a legal gray area — engine flags `GRANDPARENT_OF_ILLEGITIMATE`.

### 6.5 Ascendant Division Sub-Algorithm (Art. 890)

When multiple ascendants share a collective legitime:

```
function divide_among_ascendants(heirs, total):
    ascendants = filter(heirs, h => h.effective_category == ASCENDANT_GROUP
                                     AND h.is_eligible AND h.is_alive)
    // Tier 1: Parents (degree 1)
    parents = filter(ascendants, a => a.degree == 1)
    if len(parents) > 0:
        return divide_equally(parents, total)

    // Tier 2: Nearest degree among higher ascendants
    min_degree = min(a.degree for a in ascendants)
    nearest = filter(ascendants, a => a.degree == min_degree)

    // Tier 3: By-line split (Art. 890 ¶2, Art. 987)
    paternal = filter(nearest, a => a.line == PATERNAL)
    maternal = filter(nearest, a => a.line == MATERNAL)
    if len(paternal) > 0 AND len(maternal) > 0:
        return { ...divide_equally(paternal, total/2),
                 ...divide_equally(maternal, total/2) }
    else:
        surviving = paternal or maternal (whichever exists)
        return divide_equally(surviving, total)
```

### 6.6 Cap Rule Algorithm (Art. 895 ¶3)

The cap rule ensures that the total legitime of all illegitimate children does not exceed the remaining free portion after the surviving spouse's share is satisfied.

```
function apply_cap_rule(per_lc, n, m, fp_gross, spouse_legitime):
    per_ic_uncapped = per_lc / 2                    // Art. 895
    fp_remaining = fp_gross - spouse_legitime        // Spouse FIRST
    total_ic_uncapped = m * per_ic_uncapped

    if total_ic_uncapped > fp_remaining:
        per_ic_capped = fp_remaining / m             // Cap applied
        fp_disposable = 0
        return { per_ic: per_ic_capped, cap_applied: true, fp_disposable: 0 }
    else:
        fp_disposable = fp_remaining - total_ic_uncapped
        return { per_ic: per_ic_uncapped, cap_applied: false, fp_disposable }
```

**Critical**: The cap rule applies ONLY in testate succession. In intestate, the 2:1 ratio method distributes the entire estate proportionally with no cap.

---

## 7. Intestate Distribution Rules

### 7.1 Priority Hierarchy

```
Class 1: Legitimate descendants (Children → Grandchildren → ...)
Class 2: Legitimate ascendants (Parents → Grandparents → ...)
Class 3: Illegitimate children
Class 4: Surviving spouse
Class 5: Collateral relatives (Siblings → Nephews/Nieces → Others ≤5th degree)
Class 6: State (escheat)
```

Classes 1-4 can concur per specific articles. Classes 5-6 are residual (except Art. 1001: spouse + siblings concur).

### 7.2 Distribution Formulas

#### I1: n LC Only (Art. 980)
Equal shares: each LC gets `E / n`

#### I2: n LC + Spouse (Art. 996)
Spouse = one child's share: each gets `E / (n + 1)`

#### I3: n LC + m IC, No Spouse (Arts. 983, 895)
2:1 unit ratio. **No cap in intestate.**
- LC = 2 units, IC = 1 unit
- Total units = `2n + m`
- Per unit = `E / (2n + m)`
- Each LC = `2 × per_unit`, each IC = `1 × per_unit`

#### I4: n LC + m IC + Spouse (Arts. 999, 983, 895)
Spouse = 1 LC share = 2 units:
- Total units = `2n + m + 2`
- Per unit = `E / (2n + m + 2)`
- Each LC = `2 × per_unit`, each IC = `1 × per_unit`, spouse = `2 × per_unit`

#### I5: Ascendants Only (Arts. 985-987)
Entire estate. Divide per ascendant division algorithm (§6.5).

#### I6: Ascendants + Spouse (Art. 997)
Spouse = ½, ascendants = ½

#### I7: m IC Only (Art. 988)
Equal shares: each IC gets `E / m`

#### I8: m IC + Spouse (Art. 998)
Spouse = ½, ICs split other ½ equally

#### I9: Ascendants + m IC (Art. 991)
Ascendants = ½, ICs = ½

#### I10: Ascendants + m IC + Spouse (Art. 1000)
Ascendants = ½, ICs = ¼, spouse = ¼

#### I11: Spouse Only (Art. 995)
Spouse inherits entire estate

#### I12: Spouse + Siblings/Nephews/Nieces (Art. 1001)
Spouse = ½, siblings/nephews/nieces = ½. Collateral half distributed via `distribute_collaterals()` (§7.6).
**Scope**: Art. 1001 ONLY applies to siblings/nephews/nieces — remote collaterals are excluded (Art. 995).

#### I13: Siblings/Nephews/Nieces Only (Arts. 1003-1008)
Entire estate distributed via `distribute_collaterals()` (§7.6).

#### I14: Other Collateral Relatives (Arts. 1009-1010)
Entire estate distributed via `distribute_other_collaterals()` (§7.6).

#### I15: State (Arts. 1011-1014)
No heirs → estate escheats to the State. Personal property to municipality of last residence; real property to municipalities where situated.

### 7.3 Key Difference: No Cap in Intestate

In intestate succession, the Art. 895 ¶3 cap rule does **not** apply. The 2:1 ratio method distributes the entire estate proportionally. This means illegitimate children consistently receive more under intestate than under testate when the cap triggers.

### 7.4 Iron Curtain Rule (Art. 992)

For illegitimate decedents: bilateral barrier between the illegitimate child and their parent's legitimate relatives. The parent's legitimate relatives cannot inherit from the illegitimate decedent, and vice versa. **Exception**: The decedent's own parents CAN inherit (Art. 903).

### 7.5 Mixed Succession (Art. 960(2))

Mixed succession occurs when a valid will exists but does **not** dispose of the entire estate. The undisposed portion passes intestate.

**Legal basis**: Art. 960(2): "Legal succession takes place... when the will does not institute an heir to, or dispose of all the property belonging to the testator. In such case, legal succession shall take place only with respect to the property of which the testator has not disposed."

#### Detection: Will Coverage

```
function determine_will_coverage(
    will: Will,
    estate_base: Money,
    legitime_result: LegitimeResult
) -> WillCoverage {

    fp_disposable = legitime_result.fp_disposable

    // Sum all testamentary dispositions that draw from the FP
    total_will_dispositions = Money(0)

    for inst in will.institutions:
        heir = resolve_heir(inst.heir)
        if heir.is_compulsory:
            // Only the EXCESS above legitime comes from FP
            institution_value = compute_institution_value(inst, estate_base)
            heir_legitime = get_heir_legitime(heir, legitime_result)
            fp_portion = max(institution_value - heir_legitime, 0)
            total_will_dispositions += fp_portion
        else:
            // Voluntary heir: entire share comes from FP
            total_will_dispositions += compute_institution_value(inst, estate_base)

    for legacy in will.legacies:
        total_will_dispositions += compute_legacy_value(legacy)

    for devise in will.devises:
        total_will_dispositions += compute_devise_value(devise)

    // A residuary clause ("the rest to X") captures any undisposed portion
    has_residuary = any(inst.is_residuary for inst in will.institutions)
    if has_residuary:
        return WillCoverage {
            disposes_of_entire_estate: true,
            total_will_from_fp: fp_disposable,
            undisposed_fp: Money(0),
        }

    undisposed_fp = max(fp_disposable - total_will_dispositions, Money(0))
    return WillCoverage {
        disposes_of_entire_estate: undisposed_fp == Money(0),
        total_will_from_fp: total_will_dispositions,
        undisposed_fp: undisposed_fp,
    }
}

struct WillCoverage {
    disposes_of_entire_estate: bool,
    total_will_from_fp: Money,
    undisposed_fp: Money,          // Passes intestate if > 0
}
```

**Important**: Definitive MIXED detection requires `fp_disposable` from Step 5. Step 3 makes a preliminary classification (`will != null → TESTATE tentative`), which is refined to MIXED after Step 5 if the will does not cover the full FP.

#### 3-Phase Distribution Algorithm

```
function distribute_mixed_succession(
    net_estate: Money,
    estate_base: Money,
    will: Will,
    heirs: List<Heir>,
    lines: LineResult,
    legitime_result: LegitimeResult,
    validation: ValidationResult,
    will_coverage: WillCoverage,
    testate_scenario: String,       // T1-T15
    intestate_scenario: String      // I1-I15
) -> DistributionResult {

    shares = Map<Heir, HeirShare>()

    // PHASE 1: Allocate compulsory heirs' legitimes (identical to testate Step 7a)
    for heir in compulsory_heirs(heirs):
        legitime = get_heir_legitime(heir, legitime_result, lines)
        shares[heir] = HeirShare {
            from_legitime: legitime,
            from_free_portion: Money(0),
            from_intestate: Money(0),
            basis: get_legitime_basis(heir, testate_scenario),
        }

    // PHASE 2: Distribute testamentary FP dispositions
    will_dispositions = get_effective_dispositions(will, validation)
    for disp in will_dispositions:
        recipient = resolve_heir(disp.heir)
        amount = compute_disposition_value(disp, estate_base, validation)
        if recipient in shares:
            shares[recipient].from_free_portion += amount
        else:
            shares[recipient] = HeirShare {
                from_legitime: Money(0),
                from_free_portion: amount,
                from_intestate: Money(0),
            }

    // PHASE 3: Distribute undisposed FP intestate (Art. 960(2))
    undisposed_fp = will_coverage.undisposed_fp
    if undisposed_fp > Money(0):
        // Same intestate rules apply — same heirs participate
        // Non-compulsory heirs (collaterals) may also inherit here
        intestate_shares = compute_intestate_distribution(
            undisposed_fp, heirs, lines
        )
        for (heir, intestate_amount) in intestate_shares:
            if heir in shares:
                shares[heir].from_intestate += intestate_amount
            else:
                shares[heir] = HeirShare {
                    from_legitime: Money(0),
                    from_free_portion: Money(0),
                    from_intestate: intestate_amount,
                }

    return DistributionResult { shares: shares }
}
```

#### Share Merging

When a compulsory heir appears in both testate and intestate portions, their final share is:

```
total = from_legitime + from_free_portion + from_intestate
```

- `from_legitime`: Fixed by Step 5 (testate fraction table)
- `from_free_portion`: Will dispositions
- `from_intestate`: Undisposed FP distributed using intestate rules on just the undisposed amount

The intestate scenario for the undisposed FP uses the **same heir pool** as the testate scenario. Non-compulsory heirs (collaterals) may participate if the intestate rules permit (e.g., I12: spouse + siblings).

#### Worked Example

Estate: ₱10,000,000 | 2 LC + Spouse (T3/I2) | Will gives ₱1,000,000 to charity

| Step | Computation | Result |
|------|------------|--------|
| Legitime (T3, n=2) | LC collective = ₱5M, per LC = ₱2.5M, spouse = ₱2.5M | FP_disposable = ₱2.5M |
| Will coverage | ₱1M disposed of ₱2.5M FP | Undisposed = ₱1.5M → **MIXED** |
| Phase 1 | LC1=₱2.5M, LC2=₱2.5M, Spouse=₱2.5M | Legitimes allocated |
| Phase 2 | Charity=₱1M | Testamentary FP |
| Phase 3 (I2, ₱1.5M) | ₱1.5M ÷ 3 = ₱500K each | LC1, LC2, Spouse each get ₱500K intestate |

| Heir | Legitime | Testamentary FP | Intestate | Total |
|------|----------|----------------|-----------|-------|
| LC1 | ₱2,500,000 | — | ₱500,000 | ₱3,000,000 |
| LC2 | ₱2,500,000 | — | ₱500,000 | ₱3,000,000 |
| Spouse | ₱2,500,000 | — | ₱500,000 | ₱3,000,000 |
| Charity | — | ₱1,000,000 | — | ₱1,000,000 |
| **Total** | | | | **₱10,000,000** ✓ |

#### Key Interactions

- **Preterition** (Art. 854) converts MIXED → INTESTATE_BY_PRETERITION (all institutions annulled)
- **Inofficiousness** (Art. 911) reduces will dispositions before computing undisposed FP
- A **residuary clause** in the will captures undisposed FP → TESTATE, not MIXED
- An **empty will** (all dispositions invalid/lapsed) → INTESTATE, not MIXED

### 7.6 Collateral Distribution Sub-Algorithm (Arts. 1003-1010)

Collateral relatives require a dedicated sub-algorithm because of the interplay between full/half blood rules (Art. 1006), representation by nephews/nieces (Art. 1005), the per capita switch (Art. 975), and the 5th-degree limit (Art. 1010).

#### Master Function

```
function distribute_collaterals(amount: Fraction, collaterals: List<Heir>) -> Map<Heir, Fraction> {
  siblings = filter(c where c.is_sibling_of_decedent, collaterals)
  nephews_nieces = filter(c where c.is_child_of_sibling_of_decedent, collaterals)

  // Branch 1: Siblings + nephews/nieces (per stirpes with blood weighting)
  if count(siblings) > 0 AND count(nephews_nieces) > 0:
    return distribute_siblings_with_representation(amount,
      build_sibling_lines(siblings, nephews_nieces))

  // Branch 2: Siblings only (3-way blood logic)
  if count(siblings) > 0:
    return distribute_siblings(amount, siblings)

  // Branch 3: Nephews/nieces only (per capita switch, Art. 975)
  if count(nephews_nieces) > 0:
    return distribute_nephews_only(amount, nephews_nieces)

  // Branch 4: Other collaterals (nearest-degree + 5th-degree limit)
  return distribute_other_collaterals(amount, collaterals)
}
```

#### Branch 2: Siblings Only — Full/Half Blood Logic (Arts. 1004, 1006, 1007)

```
function distribute_siblings(amount: Fraction, siblings: List<Heir>) -> Map<Heir, Fraction> {
  full_blood = filter(s where s.blood_type == FULL, siblings)
  half_blood = filter(s where s.blood_type == HALF, siblings)

  // Case A: All full blood → equal shares (Art. 1004)
  if count(half_blood) == 0:
    per_sibling = amount / count(siblings)
    return { s: per_sibling for s in siblings }

  // Case B: All half blood → equal shares, no line distinction (Art. 1007)
  //   "...shall inherit in equal shares without distinction as to the origin of the property"
  if count(full_blood) == 0:
    per_sibling = amount / count(siblings)
    return { s: per_sibling for s in siblings }

  // Case C: Mixed full + half blood → 2:1 unit ratio (Art. 1006)
  //   Full blood = 2 units, half blood = 1 unit
  total_units = (count(full_blood) * 2) + (count(half_blood) * 1)
  per_unit = amount / total_units

  result = {}
  for s in full_blood:
    result[s] = per_unit * 2
  for s in half_blood:
    result[s] = per_unit * 1
  return result
}
```

**Example** (Case C): ₱10,000,000 among 2 full-blood + 1 half-blood sibling
- Total units: `(2 × 2) + (1 × 1) = 5`
- Per unit: `₱10M / 5 = ₱2,000,000`
- Each full-blood: ₱4,000,000; half-blood: ₱2,000,000

#### Branch 1: Siblings + Nephews/Nieces — Per Stirpes with Blood Weighting (Arts. 1005, 1006, 1008)

Surviving siblings inherit per capita (in their own right); nephews/nieces of predeceased siblings inherit per stirpes (by representation). Blood weighting applies per **line**, not per individual.

```
struct SiblingLine {
  original_sibling: Heir,         // The sibling (alive or predeceased)
  blood_type: BloodType,          // FULL or HALF
  mode: InheritanceMode,          // OWN_RIGHT (alive) or REPRESENTATION (predeceased)
  representatives: List<Heir>,    // Nephews/nieces if predeceased
}

function build_sibling_lines(siblings: List<Heir>,
    nephews_nieces: List<Heir>) -> List<SiblingLine> {
  lines = []
  // Living siblings: each is a line in OWN_RIGHT
  for s in siblings:
    lines.append(SiblingLine {
      original_sibling: s,
      blood_type: s.blood_type,
      mode: OWN_RIGHT,
      representatives: [],
    })
  // Predeceased siblings whose children survive: each is a REPRESENTATION line
  predeceased_parents = unique(n.parent for n in nephews_nieces)
  for parent in predeceased_parents:
    children = filter(n where n.parent == parent, nephews_nieces)
    lines.append(SiblingLine {
      original_sibling: parent,
      blood_type: parent.blood_type,
      mode: REPRESENTATION,
      representatives: children,
    })
  return lines
}

function distribute_siblings_with_representation(amount: Fraction,
    sibling_lines: List<SiblingLine>) -> Map<Heir, Fraction> {

  // Step 1: Compute per-line units (Art. 1006 + Art. 1008)
  //   Each line gets 2 units if FULL blood, 1 unit if HALF blood
  total_units = 0
  for line in sibling_lines:
    total_units += (2 if line.blood_type == FULL else 1)

  per_unit = amount / total_units
  result = {}

  // Step 2: Distribute per line
  for line in sibling_lines:
    line_units = (2 if line.blood_type == FULL else 1)
    line_share = per_unit * line_units

    if line.mode == OWN_RIGHT:
      // Living sibling: takes full line share
      result[line.original_sibling] = line_share
    else:
      // REPRESENTATION: nephews/nieces split line share equally (per stirpes)
      per_rep = line_share / count(line.representatives)
      for nephew in line.representatives:
        result[nephew] = per_rep

  return result
}
```

**Example**: ₱12,000,000 among: Sib-A (full, alive), Sib-B (full, predeceased → N1, N2), Sib-C (half, alive)
- Lines: A=FULL(2u), B=FULL(2u), C=HALF(1u) → total 5 units
- Per unit: `₱12M / 5 = ₱2,400,000`
- Sib-A: `₱4,800,000` (2 units, own right)
- N1: `₱2,400,000`, N2: `₱2,400,000` (Sib-B's 2-unit share ÷ 2, per stirpes)
- Sib-C: `₱2,400,000` (1 unit, own right)

#### Branch 3: Nephews/Nieces Only — Per Capita Switch (Art. 975)

When ALL siblings have predeceased and only nephews/nieces survive, the per stirpes rule is **overridden** by Art. 975's per capita rule. All nephews/nieces inherit in equal portions regardless of which sibling they descend from.

```
function distribute_nephews_only(amount: Fraction, nephews: List<Heir>) -> Map<Heir, Fraction> {
  // Art. 975: "But if they alone survive, they shall inherit in equal portions."

  // NOTE: Scholarly debate exists on whether Art. 1006 full/half blood doubling
  // applies to nephews/nieces inheriting per capita under Art. 975. Art. 1008
  // says they succeed "in accordance with the rules laid down for the brothers
  // and sisters of the full blood" — suggesting the double-share rule MAY apply.
  //
  // Default: Apply Art. 1006 doubling for consistency with Art. 1008.
  // Config flag: nephews_per_capita_ignore_blood (if true → pure equal shares)

  if config.nephews_per_capita_ignore_blood:
    per_nephew = amount / count(nephews)
    return { n: per_nephew for n in nephews }

  // Default: apply blood weighting even in per capita mode (Art. 1008)
  full_blood = filter(n where n.parent_blood_type == FULL, nephews)
  half_blood = filter(n where n.parent_blood_type == HALF, nephews)

  if count(full_blood) == 0 OR count(half_blood) == 0:
    // All same blood type → equal shares
    per_nephew = amount / count(nephews)
    return { n: per_nephew for n in nephews }

  // Mixed: full-blood nephews = 2 units, half-blood nephews = 1 unit
  total_units = (count(full_blood) * 2) + (count(half_blood) * 1)
  per_unit = amount / total_units

  result = {}
  for n in full_blood:
    result[n] = per_unit * 2
  for n in half_blood:
    result[n] = per_unit * 1
  return result
}
```

**Example** (default mode): ₱6,000,000 among 3 nephews from 2 predeceased siblings (Sib-A full → N1, N2; Sib-B half → N3)
- All siblings predeceased → per capita (Art. 975)
- Blood weighting (Art. 1008): N1=2u, N2=2u (parent full), N3=1u (parent half)
- Total: 5 units. Per unit: `₱1,200,000`
- N1: ₱2,400,000; N2: ₱2,400,000; N3: ₱1,200,000

#### Branch 4: Other Collateral Relatives (Arts. 1009-1010)

When no siblings or nephews/nieces survive, more remote collaterals inherit. Art. 1009 eliminates blood and line distinctions. Art. 1010 imposes a hard 5th-degree limit.

```
function distribute_other_collaterals(amount: Fraction,
    collaterals: List<Heir>) -> Map<Heir, Fraction> {
  // Art. 1009: "without distinction of lines or preference among them
  //   by reason of relationship by the whole blood"
  // Art. 1010: "shall not extend beyond the fifth degree"
  // Art. 962: nearest degree excludes more remote

  // Step 1: Filter to ≤5th degree
  eligible = filter(c where c.collateral_degree <= 5, collaterals)
  if count(eligible) == 0:
    return {}  // No eligible collaterals → estate escheats (I15)

  // Step 2: Nearest degree excludes more remote (Art. 962)
  min_degree = min(c.collateral_degree for c in eligible)
  nearest = filter(c where c.collateral_degree == min_degree, eligible)

  // Step 3: Equal shares — no blood or line distinction (Art. 1009)
  per_heir = amount / count(nearest)
  return { c: per_heir for c in nearest }
}
```

**Degree reference** (Art. 966, collateral line): Siblings = 2nd degree, nephews/nieces = 3rd degree, first cousins = 4th degree, children of first cousins = 5th degree. Beyond 5th degree → no inheritance (Art. 1010), estate escheats to State (I15).

**Example**: ₱8,000,000, 2 first cousins (4th degree) + 1 child of first cousin (5th degree)
- Nearest degree = 4 → 2 first cousins only
- Each: ₱4,000,000 (child of first cousin at 5th degree is excluded by proximity rule)

#### I12 Integration

For I12 (spouse + siblings/nephews/nieces), the spouse takes ½ and the collateral half is distributed via `distribute_collaterals()`:

```
function distribute_I12(estate: Fraction, spouse: Heir,
    collaterals: List<Heir>) -> Map<Heir, Fraction> {
  result = { spouse: estate / 2 }
  collateral_total = estate / 2
  collateral_shares = distribute_collaterals(collateral_total, collaterals)
  result.merge(collateral_shares)
  return result
}
```

**Example**: ₱10,000,000, spouse + 1 full-blood sibling + 1 half-blood sibling
- Spouse: ₱5,000,000
- Collateral ½: ₱5,000,000 → `distribute_siblings(₱5M, [full, half])`
- Full sibling: `₱5M × 2/3 = ₱3,333,333`; Half sibling: `₱5M × 1/3 = ₱1,666,667`

---

## 8. Collation (Arts. 1061-1077)

### 8.1 Estate Base Computation (Art. 908)

```
estate_base = net_estate_at_death + sum(collatable_donations at donation-time value)
```

This adjusted base is used for ALL legitime computations (Steps 5-6).

### 8.2 Who Must Collate

- Only compulsory heirs succeeding with other compulsory heirs (Art. 1061)
- Sole compulsory heir: exempt (no equalization needed)
- Stranger donations: always added to estate base, charged to FP (Art. 909 ¶2)

### 8.3 Collatability Matrix

| Donation Type | Collatable? | Legal Basis |
|--------------|------------|-------------|
| Standard gift to child | Yes → charge to child's legitime | Art. 909 |
| Standard gift to IC | Yes → charge to IC's legitime | Art. 910 |
| Standard gift to stranger | Yes → charge to FP | Art. 909 ¶2 |
| Donor expressly exempted | No (but still check inofficiousness) | Art. 1062 |
| Donee repudiated inheritance | No (but still check inofficiousness) | Art. 1062 ¶2 |
| Support, education, medical | No | Art. 1067 |
| Customary/ordinary gifts | No | Art. 1067 |
| Professional education | Conditional: yes if parent required or impairs legitime | Art. 1068 |
| Debt/election/fine payment | Yes | Art. 1069 |
| Gift to child's spouse only | No | Art. 1066 |
| Joint gift to child + spouse | ½ collatable | Art. 1066 ¶2 |
| Wedding gift ≤ 1/10 FP | No | Art. 1070 |
| Wedding gift > 1/10 FP | Excess collatable | Art. 1070 |
| Joint from both parents | ½ to this estate | Art. 1072 |

### 8.4 Valuation Rule (Art. 1071)

Donations are **always** valued at their worth when given, not at death. Appreciation, depreciation, or total destruction is at the donee's risk.

### 8.5 Imputation (Arts. 1073-1074)

After computing gross entitlements on the collation-adjusted estate, reduce each donee-heir's share by their donations:

1. **Charge to legitime** first (Arts. 909-910)
2. If donation exceeds legitime → excess charges to FP
3. If donation exceeds entire share → donation is inofficious → donee must return excess (Art. 911)

### 8.6 Representation Collation (Art. 1064)

Grandchildren inheriting by representation must collate their predeceased parent's donations, even though they personally never received the property. This can result in a ₱0 distribution.

---

## 9. Testate Validation (Step 6)

### 9.1 Five-Check Ordered Pipeline

The checks MUST run in this order because preterition terminates the pipeline.

#### Check 1: Preterition (Art. 854)

**Scope**: Only direct-line compulsory heirs (LC, IC, adopted, legitimated, ascendants). Surviving spouse omission is **NEVER** preterition.

**Detection**: A direct-line compulsory heir is **totally omitted** — no institution, no legacy, no devise, no disinheritance mention.

**Effect**: ALL institutions are annulled (total annulment). Legacies/devises survive if not inofficious. Remainder distributes intestate. Pipeline terminates.

**Key distinctions**:
- A ₱1 token legacy defeats preterition (Art. 855 underprovision applies instead)
- Invalid disinheritance ≠ preterition (heir was "addressed" in the will)
- Spouse omission → Art. 855 underprovision recovery
- Art. 854 ¶2: If the preterited heir predeceased, the will stands UNLESS their representatives are also all omitted → preterition through representation

#### Check 2: Disinheritance Validity (Arts. 915-922)

4-check validity gate:
1. In the will? (Art. 916)
2. Cause specified? (Art. 916)
3. Cause proven? (Art. 917)
4. No reconciliation? (Art. 922)

If **valid**: Heir excluded. Art. 923: descendants step in per stirpes (children/ascendants). **No representation for disinherited spouse.** If no representatives → scenario re-evaluation.

If **invalid** (Art. 918): Heir reinstated with full legitime. Partial annulment (NOT total like preterition). May trigger pipeline restart from Step 3.

**22 valid grounds**: 8 for children (Art. 919), 8 for parents (Art. 920), 6 for spouse (Art. 921). Cause must match heir category.

#### Check 3: Underprovision (Art. 855)

A compulsory heir receives less than their legitime from the will.

**Recovery waterfall**:
1. Undisposed portion of estate
2. Pro rata from other compulsory heirs' shares in excess of their own legitimes
3. Pro rata from voluntary heirs' shares

#### Check 4: Inofficiousness (Arts. 908-912)

Testamentary dispositions and inter vivos donations exceed the free portion, impairing compulsory heirs' legitimes.

**Detection**: After computing all legitimes (Step 5) and evaluating the will:

```
excess = total_testamentary_dispositions + total_collatable_donations - FP_disposable
if excess > 0:
    reductions = reduce_inofficious(excess, will, donations)
```

Where `total_testamentary_dispositions` = sum of all legacies + devises + voluntary institutions from the will, and `total_collatable_donations` = sum of collatable inter vivos donations (valued at time of donation per Art. 1071). `FP_disposable` is the free portion after all compulsory heirs' legitimes (see §6).

#### 9.1 Art. 911 Three-Phase Reduction Algorithm

The reduction algorithm implements Art. 911's strict priority: testamentary dispositions are reduced before donations, and within testamentary dispositions the testator's preferences are respected. The algorithm stops as soon as the excess is fully absorbed.

```pseudocode
function reduce_inofficious(
    excess: Fraction,          // amount by which dispositions exceed FP_disposable
    will: Will,
    donations: List<Donation>  // collatable donations only
) -> ReductionResult {

    remaining = excess          // tracks how much still needs to be reduced
    reductions = []             // accumulates all reduction actions

    // ═══════════════════════════════════════════════════════════════
    // PHASE 1: Reduce testamentary devises and legacies (Art. 911 ¶1)
    // "Donations shall be respected as long as the legitime can be
    //  covered, reducing or annulling, if necessary, the devises or
    //  legacies made in the will."
    // ═══════════════════════════════════════════════════════════════

    // Step 1a: Separate preferred vs non-preferred dispositions
    // Art. 911 ¶2: "The reduction of the devises or legacies shall be
    //  pro rata, without any distinction whatever. If the testator has
    //  directed that a certain devise or legacy be paid in preference
    //  to others, it shall not be reduced until the latter have been
    //  applied in full to the payment of the legitime."
    all_legacies_devises = will.legacies + will.devises
    non_preferred = filter(all_legacies_devises, d => NOT d.is_preferred)
    preferred = filter(all_legacies_devises, d => d.is_preferred)

    // Step 1b: Reduce NON-PREFERRED pro rata (exhausted first)
    non_pref_total = sum(d.effective_amount for d in non_preferred)
    if remaining > 0 AND non_pref_total > 0:
        // Pro rata ratio: each non-preferred disposition loses the
        // same proportion. If excess > total, all are fully consumed.
        ratio = min(remaining / non_pref_total, Fraction(1, 1))
        for d in non_preferred:
            cut = d.effective_amount * ratio
            reductions.append(Reduction {
                target: d,
                phase: PHASE_1A,
                original_amount: d.effective_amount,
                reduction_amount: cut,
                remaining_amount: d.effective_amount - cut,
                legal_basis: "Art. 911 ¶2: non-preferred legacy/devise reduced pro rata"
            })
            remaining = remaining - cut

    // Step 1c: Reduce PREFERRED pro rata (only if non-preferred fully consumed)
    if remaining > 0:
        pref_total = sum(d.effective_amount for d in preferred)
        if pref_total > 0:
            ratio = min(remaining / pref_total, Fraction(1, 1))
            for d in preferred:
                cut = d.effective_amount * ratio
                reductions.append(Reduction {
                    target: d,
                    phase: PHASE_1B,
                    original_amount: d.effective_amount,
                    reduction_amount: cut,
                    remaining_amount: d.effective_amount - cut,
                    legal_basis: "Art. 911 ¶2: preferred legacy/devise reduced (non-preferred exhausted)"
                })
                remaining = remaining - cut

    // ═══════════════════════════════════════════════════════════════
    // PHASE 2: Reduce voluntary institutions (Art. 911 ¶1, implied)
    // Voluntary heirs instituted as universal heirs receive from the
    // FP. They are reduced before donations but after legacies/devises.
    // ═══════════════════════════════════════════════════════════════

    if remaining > 0:
        voluntary = filter(will.institutions, i => NOT i.heir_ref.is_compulsory)
        vol_total = sum(i.effective_share_amount for i in voluntary)
        if vol_total > 0:
            ratio = min(remaining / vol_total, Fraction(1, 1))
            for i in voluntary:
                cut = i.effective_share_amount * ratio
                reductions.append(Reduction {
                    target: i,
                    phase: PHASE_2,
                    original_amount: i.effective_share_amount,
                    reduction_amount: cut,
                    remaining_amount: i.effective_share_amount - cut,
                    legal_basis: "Art. 911 ¶1: voluntary institution reduced"
                })
                remaining = remaining - cut

    // ═══════════════════════════════════════════════════════════════
    // PHASE 3: Reduce inter vivos donations (Art. 911 ¶1)
    // "Should the legacies or devises not be sufficient to cover the
    //  legitimate portion, the donations shall be suppressed or
    //  reduced as to the excess."
    // Donations are reduced in REVERSE CHRONOLOGICAL order (most
    // recent first). This protects older donees' reliance interests.
    // ═══════════════════════════════════════════════════════════════

    if remaining > 0:
        // Sort collatable donations by date DESCENDING (most recent first)
        sorted_donations = sort(donations, by: d.date, order: DESCENDING)
        for d in sorted_donations:
            if remaining <= 0:
                break
            // Each donation reduced individually (NOT pro rata) —
            // the most recent is fully consumed before moving to the next.
            // Value at time of donation per Art. 1071.
            cut = min(d.value_at_donation, remaining)
            reductions.append(Reduction {
                target: d,
                phase: PHASE_3,
                original_amount: d.value_at_donation,
                reduction_amount: cut,
                remaining_amount: d.value_at_donation - cut,
                legal_basis: "Art. 911 ¶1: donation reduced reverse-chronologically"
            })
            remaining = remaining - cut

    // ═══════════════════════════════════════════════════════════════
    // RESULT
    // ═══════════════════════════════════════════════════════════════

    return ReductionResult {
        reductions: reductions,
        total_reduced: excess - remaining,
        unresolved_excess: remaining,    // should be Fraction(0) if estate is solvent
        phases_used: unique(r.phase for r in reductions)
    }
}
```

**Phase summary**:

| Phase | What is reduced | Method | Legal basis |
|-------|----------------|--------|-------------|
| 1a | Non-preferred legacies/devises | Pro rata (proportional) | Art. 911 ¶2 |
| 1b | Preferred legacies/devises | Pro rata (only after 1a exhausted) | Art. 911 ¶2 |
| 2 | Voluntary institutions | Pro rata | Art. 911 ¶1 (implied) |
| 3 | Inter vivos donations | Reverse chronological (one at a time) | Art. 911 ¶1 |

**Critical distinctions**:
- Phases 1-2 use **pro rata** reduction (proportional across all items in the phase)
- Phase 3 uses **sequential** reduction (most recent donation fully consumed before next)
- A `Reduction` where `remaining_amount = 0` means the disposition is fully annulled
- The algorithm stops (`remaining = 0`) as soon as the excess is covered — later phases are not reached
- If `unresolved_excess > 0` after all phases, the estate cannot satisfy all legitimes (insolvency edge case — flag `MANUAL_REVIEW`)

**Preferred vs non-preferred**: A legacy or devise is "preferred" if the testator expressly designated it for priority payment (Art. 911 ¶2: "the testator has directed that a certain devise or legacy be paid in preference to others"). This is a boolean flag on each `Legacy`/`Devise` parsed from the will.

**Art. 911 ¶3 — Usufruct/annuity option**: When the reduction would result in a compulsory heir receiving a usufruct or life annuity (rather than full ownership), the heir and the voluntary heir/donee may agree to convert the usufruct into full ownership of a smaller portion. The engine flags this as `USUFRUCT_ANNUITY_OPTION` for manual review — it requires party agreement and cannot be computed deterministically.

#### 9.2 Art. 912 Indivisible Realty Algorithm

When a devise of **indivisible real property** must be partially reduced, Art. 912 provides a special rule based on a ½-value threshold:

```pseudocode
function resolve_indivisible_realty(
    property_value: Fraction,      // appraised value of the real property
    reduction_amount: Fraction,    // how much must be reduced from this devise
    devisee: Heir,
    compulsory_heirs: List<Heir>
) -> IndivisibleRealtyResult {

    half_value = property_value * Fraction(1, 2)

    if reduction_amount < half_value:
        // Reduction is LESS than ½ of the property value
        // → Devisee KEEPS the entire property
        // → Devisee reimburses compulsory heirs in cash for the reduction amount
        return IndivisibleRealtyResult {
            property_awarded_to: DEVISEE,
            devisee: devisee,
            cash_reimbursement: CashReimbursement {
                payer: devisee,
                payees: compulsory_heirs,   // distributed pro rata by legitime share
                amount: reduction_amount,
            },
            legal_basis: "Art. 912: reduction < ½ value, devisee keeps property"
        }

    else:
        // Reduction is ≥ ½ of the property value (includes exactly ½)
        // → Compulsory heirs TAKE the entire property
        // → Compulsory heirs reimburse devisee in cash for the unreduced portion
        devisee_reimbursement = property_value - reduction_amount
        return IndivisibleRealtyResult {
            property_awarded_to: COMPULSORY_HEIRS,
            devisee: devisee,
            cash_reimbursement: CashReimbursement {
                payer: compulsory_heirs,
                payees: [devisee],
                amount: devisee_reimbursement,
            },
            legal_basis: "Art. 912: reduction ≥ ½ value, compulsory heirs take property"
        }
}
```

**Key rules**:
- The ½ threshold is **inclusive** on the compulsory heirs' side: if reduction = exactly ½, compulsory heirs take the property
- Cash reimbursement among multiple compulsory heirs is distributed pro rata by their respective legitime shares
- This function is called **per devise** when `reduce_inofficious()` produces a reduction against a `Devise` of indivisible real property
- If multiple indivisible devises are reduced in the same will, each is resolved independently

**Data structures**:

```pseudocode
struct Reduction {
    target: Disposition | Donation   // what was reduced
    phase: ReductionPhase            // PHASE_1A | PHASE_1B | PHASE_2 | PHASE_3
    original_amount: Fraction        // amount before reduction
    reduction_amount: Fraction       // how much was cut
    remaining_amount: Fraction       // amount after reduction (original - cut)
    legal_basis: String              // article citation for narrative
}

enum ReductionPhase { PHASE_1A, PHASE_1B, PHASE_2, PHASE_3 }

struct ReductionResult {
    reductions: List<Reduction>      // all reductions applied
    total_reduced: Fraction          // sum of all reduction amounts
    unresolved_excess: Fraction      // 0 if fully resolved
    phases_used: List<ReductionPhase>
}

struct IndivisibleRealtyResult {
    property_awarded_to: DEVISEE | COMPULSORY_HEIRS
    devisee: Heir
    cash_reimbursement: CashReimbursement
    legal_basis: String
}

struct CashReimbursement {
    payer: Heir | List<Heir>
    payees: List<Heir>
    amount: Fraction
}
```

#### Check 5: Condition Stripping (Art. 872)

Conditions imposed on a compulsory heir's legitime portion are "deemed not imposed." The engine splits the heir's share:
- Unconditional legitime portion
- Conditional FP portion (conditions apply only here)

---

## 10. Vacancy Resolution (Step 9)

### 10.1 Resolution Priority Chain

When a share becomes vacant (predecease without representation, renunciation, incapacity):

```
Priority 1: SUBSTITUTION (Art. 859, testate only)
Priority 2: REPRESENTATION (Arts. 970-977, if not already resolved in Step 2)
Priority 3: ACCRETION (Arts. 1015-1021)
Priority 4: INTESTATE FALLBACK (Art. 1022(2), testate only)
```

### 10.2 Art. 1021 — Critical Distinction

| Vacant Share Source | Resolution Method | Effect |
|--------------------|--------------------|--------|
| **Legitime** | Co-heirs succeed "in their own right" | Full scenario re-evaluation — recompute all fractions as if heir never existed. May change scenario code. |
| **Free Portion** | Accretion proper (Art. 1019) | Proportional distribution to co-heirs' existing shares. No scenario change. |

### 10.3 Accretion Rules

- Testate: requires pro indiviso (Art. 1016), but Art. 1017 is generous — "equal shares" and aliquot parts don't block accretion; only exclusive ownership of determinate property blocks it
- Intestate: always applies (Art. 1018)
- Art. 969: when ALL nearest relatives of a degree renounce → next degree inherits in own right (complete scenario restart)
- Art. 977: renouncing heir cannot be represented → accretion is the primary resolution for renunciation vacancies
- Art. 1020: accreting heirs inherit the vacant share's charges and conditions

---

## 11. Narrative Template System

### 11.1 Structure

Every narrative is a single paragraph composed of ordered sections:

```
HEADER → SUCCESSION TYPE → CATEGORY → LEGITIME/INTESTATE SHARE
    → [CAP RULE] → [FREE PORTION] → [SPECIAL EVENTS*] → [COMPARISON]
```

Special events (included only when applicable):
REPRESENTATION, DISINHERITANCE, PRETERITION, INOFFICIOUS, UNDERPROVISION, CONDITION, ACCRETION, SUBSTITUTION, COLLATION, ARTICULO_MORTIS, RESERVA_TRONCAL

### 11.2 Header Variants

| Variant | Template |
|---------|----------|
| Standard | `**{name} ({label})** receives **₱{total}**.` |
| Collation | `**{name} ({label})** receives **₱{net} from the estate** (plus ₱{donation} previously received as a donation, for a total of ₱{gross}).` |
| Zero-share | `**{name} ({label})** receives **₱0**.` |
| Donation return | `**{name} ({label})** must **return ₱{return_amount} to the estate**.` |
| Reduced | `**{name} ({label})** receives **₱{reduced}** (reduced from ₱{original}).` |

### 11.3 Formatting Rules

- **Peso amounts**: ₱ prefix, comma thousands, centavos only when non-zero (₱5,000,000 not ₱5,000,000.00)
- **Fractions**: Written as words + symbol: "one-half (½)"
- **Article citations**: "Art. {number} of the Civil Code" (first mention), "Art. {number}" (subsequent)
- **Computation visibility**: Show the math — "½ × ₱10,000,000 = ₱5,000,000"
- **Self-contained**: Each narrative stands alone without needing other context

### 11.4 Example Narratives

**Simple intestate (I2)**:
> **Rosa Santos (surviving spouse)** receives **₱3,000,000**. The decedent died intestate (without a valid will). As the surviving spouse (Art. 887(3) of the Civil Code), Rosa is a compulsory heir. Under Art. 996 of the Civil Code, the surviving spouse is entitled to a share equal to that of each legitimate child. With 3 legitimate children, there are 4 equal shares totaling ₱12,000,000. Rosa's share is ₱3,000,000 (¼ of the estate).

**Cap rule applied (T5a)**:
> **Carlo Bautista (illegitimate child)** receives **₱1,666,666.67**. The decedent left a valid will. As an illegitimate child (Art. 176, Family Code), Carlo is a compulsory heir. Carlo's filiation is established by open and continuous possession of the status of an illegitimate child (Art. 172(3), Family Code). Under Art. 895, an illegitimate child's computed legitime would be ₱5,000,000 (½ × ₱10,000,000). However, Art. 895 ¶3 provides that the total legitime of all illegitimate children cannot exceed the free portion. The free portion is ₱10,000,000 (½ of ₱20,000,000). The surviving spouse's legitime of ₱5,000,000 (Art. 892) is satisfied first, leaving ₱5,000,000. This is divided equally among 3 illegitimate children, giving Carlo ₱1,666,666.67.

**Representation after disinheritance (T3)**:
> **Luis Villanueva (grandchild, by representation)** receives **₱1,333,333.33**. The decedent left a valid will. Luis inherits by right of representation (Art. 970 of the Civil Code) in place of Karen, who was validly disinherited for maltreatment under Art. 919(6). Under Art. 923, the children of a disinherited heir step into the disinherited heir's place. The collective legitime is ½ of the estate (₱8,000,000), divided into 3 lines of ₱2,666,666.67 each. Under Art. 974, Karen's line is divided equally among 2 representatives at ₱1,333,333.33 each. Note: Karen has no right of usufruct or administration over Luis's inheritance (Art. 923 ¶2).

**Collation imputation**:
> **Pilar Navarro (legitimate child)** receives **₱3,000,000 from the estate** (plus ₱2,000,000 previously received as a donation, for a total of ₱5,000,000). Under Art. 1061, the ₱2,000,000 donation must be collated. The collation-adjusted estate is ₱20,000,000 (Art. 908). Pilar's legitime is ₱5,000,000 (¼ of the adjusted estate per Art. 888). Since Pilar already received ₱2,000,000, her share from the actual estate is reduced to ₱3,000,000 (Art. 1073).

### 11.5 NarrativeSectionType Enum

Every narrative is composed of ordered sections of the following types. Sections are included only when applicable and assembled in the order listed below into a single paragraph.

```
enum NarrativeSectionType {
    HEADER,              // Always first. "{Name} ({label}) receives ₱{amount}."
    SUCCESSION_TYPE,     // "The decedent died {testate|intestate|partially testate}."
    CATEGORY,            // "As a {category} (Art. X), {Name} is a compulsory heir."
    LEGITIME,            // "Under Art. X, {heir}'s legitime is ₱X."
    CAP_RULE,            // "However, Art. 895 ¶3 cap was applied..."
    FREE_PORTION,        // "...also receives ₱X from the free portion..."
    INTESTATE_SHARE,     // "Under Art. X, {heir}'s intestate share is..."
    COLLATION,           // "Note: ₱X donation imputed against share..."
    REPRESENTATION,      // "...inherits by right of representation..."
    DISINHERITANCE,      // "...was validly disinherited..." or "...invalid..."
    PRETERITION,         // "...was completely omitted (Art. 854)..."
    INOFFICIOUS,         // "...reduced from ₱X to ₱Y (Art. 911)..."
    UNDERPROVISION,      // "...recovers ₱X under Art. 855..."
    CONDITION,           // "...condition stripped from legitime (Art. 872)..."
    ACCRETION,           // "...receives additional ₱X by accretion..."
    SUBSTITUTION,        // "...takes {original}'s place as substitute..."
    RESERVATION,         // "Note: property subject to reserva troncal..."
    ARTICULO_MORTIS,     // "Note: articulo mortis rule applied..."
    COMPARISON,          // Optional: "Under intestate, would have received ₱X"
}

struct NarrativeSection {
    section_type: NarrativeSectionType,
    text: String,
    legal_basis: List<String>,   // Article citations used in this section
}
```

Each `HeirNarrative` contains an ordered list of `NarrativeSection` values. The `text` field of all sections is concatenated with spaces to produce the final paragraph.

### 11.6 Helper Functions

Six helper functions required by the narrative generation algorithm:

```
function category_label(heir: Heir) -> String {
    // Short display label for the heir's category
    match heir.effective_category:
        LEGITIMATE_CHILD_GROUP:
            match heir.relationship:
                LEGITIMATE_CHILD      -> "legitimate child"
                ADOPTED_CHILD         -> "adopted child"
                LEGITIMATED_CHILD     -> "legitimated child"
                LEGITIMATE_GRANDCHILD -> "grandchild, by representation"
        ILLEGITIMATE_CHILD_GROUP  -> "illegitimate child"
        SURVIVING_SPOUSE_GROUP    -> "surviving spouse"
        LEGITIMATE_ASCENDANT_GROUP:
            match heir.relationship:
                LEGITIMATE_PARENT    -> "legitimate parent"
                LEGITIMATE_ASCENDANT -> "legitimate ascendant"
}

function raw_label(heir: Heir) -> String {
    // Full label with legal basis for CATEGORY section
    match heir.relationship:
        LEGITIMATE_CHILD      -> "legitimate child"
        ADOPTED_CHILD         -> "adopted child (RA 8552 Sec. 17: same rights as legitimate)"
        LEGITIMATED_CHILD     -> "legitimated child (Art. 179, Family Code: same rights as legitimate)"
        ILLEGITIMATE_CHILD    -> "illegitimate child (Art. 176, Family Code)"
        SURVIVING_SPOUSE      -> "surviving spouse"
        LEGITIMATE_PARENT     -> "legitimate parent"
        LEGITIMATE_ASCENDANT  -> "legitimate ascendant"
        LEGITIMATE_GRANDCHILD -> "grandchild by representation"
}

function filiation_description(proof: FiliationProof) -> String {
    // Maps filiation proof to readable description with FC article
    match proof:
        BIRTH_CERTIFICATE  -> "record of birth in the civil register (Art. 172(1), FC)"
        COURT_JUDGMENT     -> "final judgment establishing filiation (Art. 172(1), FC)"
        PUBLIC_DOCUMENT    -> "admission of filiation in a public document (Art. 172(2), FC)"
        PRIVATE_HANDWRITTEN-> "private handwritten instrument signed by the parent (Art. 172(2), FC)"
        OPEN_POSSESSION    -> "open and continuous possession of the status of an illegitimate child (Art. 172(3), FC)"
        OTHER_EVIDENCE     -> "evidence as provided by the Rules of Court (Art. 172(4), FC)"
}

function format_peso(amount: Money) -> String {
    // ₱ prefix, comma thousands, centavos only when non-zero
    if amount.centavos == 0:
        return "₱{amount.pesos:,}"      // e.g., "₱5,000,000"
    else:
        return "₱{amount:,.2f}"         // e.g., "₱1,666,666.67"
}

function format_fraction(frac: Fraction) -> String {
    // Unicode symbol for common fractions, slash notation otherwise
    known = {
        (1,2): "½", (1,3): "⅓", (2,3): "⅔", (1,4): "¼", (3,4): "¾",
        (1,5): "⅕", (1,6): "⅙", (1,8): "⅛", (3,8): "⅜",
    }
    if (frac.num, frac.den) in known:
        return known[(frac.num, frac.den)]
    else:
        return "{frac.num}/{frac.den}"
}

function spouse_article(scenario: TestateScenario | IntestateScenario) -> String {
    // Maps scenario code to the article governing the spouse's share
    match scenario:
        T1, T2, T3           -> "Art. 892"
        T4, T5a, T5b         -> "Art. 892"
        T7, T8               -> "Art. 893"
        T9                   -> "Art. 899"
        T11                  -> "Art. 894"
        T12, T13             -> "Art. 900"
        I2, I4               -> "Art. 996/999"
        I6                   -> "Art. 997"
        I8                   -> "Art. 998"
        I10                  -> "Art. 1000"
        I11                  -> "Art. 995"
        I12                  -> "Art. 1001"
}
```

### 11.7 NarrativeConfig

Runtime configuration for narrative generation:

```
struct NarrativeConfig {
    include_comparison: bool,       // Append testate-vs-intestate comparison note
    include_filiation_proof: bool,  // Include filiation proof details for ICs
    include_collation_detail: bool, // Include detailed collation math
    max_sentences: int,             // Maximum sentences before splitting
    language: String,               // "en" (future: "fil" for Filipino)
}
```

**Defaults:**
```
NarrativeConfig {
    include_comparison: false,      // Off by default — enabled by user/executor
    include_filiation_proof: true,
    include_collation_detail: true,
    max_sentences: 15,
    language: "en",
}
```

When `max_sentences` is exceeded, split the narrative into a "Summary" (first 5 sentences) and "Detailed Computation" (remaining). The `include_comparison` flag controls whether the optional COMPARISON section is appended.

### 11.8 Narrative Validation Rules

Every generated narrative must pass all 10 rules. Implement as post-generation assertions in Step 10.

| # | Rule | Check |
|---|------|-------|
| 1 | **Amount consistency** | HEADER peso amount = `InheritanceShare.total` (or `net_from_estate` if collation header, or `return_amount` if donation return header) |
| 2 | **Article citation** | Every legal conclusion cites at least one article |
| 3 | **Category match** | `category_label` in HEADER matches `heir.effective_category` |
| 4 | **Computation visibility** | If the share involves a fraction, the multiplication is shown (e.g., "½ × ₱10,000,000 = ₱5,000,000") |
| 5 | **Special event coverage** | Every `Correction` in `ValidationResult` affecting this heir has a corresponding narrative section |
| 6 | **Collation coverage** | If `InheritanceShare.donations_imputed > 0`, a COLLATION section is present |
| 7 | **Representation coverage** | If `Heir.inherits_by == REPRESENTATION`, a REPRESENTATION section is present |
| 8 | **No orphan references** | No reference to an heir, article, or computation not previously explained in the narrative |
| 9 | **Peso format consistency** | All peso amounts use ₱ prefix, comma thousands separator, centavos only when non-zero |
| 10 | **Self-containment** | A reader with no prior context can understand the entire narrative without any other document |

Rules 1-9 are machine-checkable. Rule 10 is a design principle enforced by the template structure (every legal term explained on first use, every computation shown, every article cited).

---

## 12. Rounding

### 12.1 Rational Arithmetic Mandate

ALL intermediate computations use exact rational arithmetic (`Fraction` with BigInt numerator/denominator). Convert to peso amounts (centavo precision) only in Step 10.

### 12.2 Rounding Algorithm

```
function allocate_with_rounding(shares, total_estate):
    // 1. Floor each share to centavos
    result = {}
    total_allocated = 0
    for (heir, share) in sorted_by_share_desc(shares):
        peso = floor_to_centavo(share.total())
        result[heir] = peso
        total_allocated += peso

    // 2. Distribute remainder (1 centavo at a time, largest share first)
    remainder = total_estate - total_allocated
    for heir in sorted_by_share_desc(result):
        if remainder <= 0: break
        result[heir] += 0.01
        remainder -= 0.01

    return result
```

### 12.3 Sum Invariant

After rounding: `sum(all_heir_amounts) == net_distributable_estate` — this MUST always hold.

---

## 13. Edge Cases and Manual Review Flags

### 13.1 Manual Review Flags

The engine produces deterministic output for all computable scenarios. These 10 situations require human judgment:

| Flag Code | Trigger | Legal Basis |
|-----------|---------|-------------|
| `GRANDPARENT_OF_ILLEGITIMATE` | Art. 903 says "parents" not "ascendants" | Art. 903 |
| `CROSS_CLASS_ACCRETION` | IC renounces when concurring with LCs | Arts. 1018 vs 968 |
| `RESERVA_TRONCAL` | Property subject to Art. 891 reservation | Art. 891 |
| `COLLATION_DISPUTE` | Heirs disagree about collatability/value | Art. 1077 |
| `RA_11642_RETROACTIVITY` | Pre-2022 adoption with Sec. 41 question | RA 8552/11642 |
| `ARTICULO_MORTIS` | Art. 900 ¶2 conditions detected | Art. 900 ¶2 |
| `USUFRUCT_ANNUITY_OPTION` | Compulsory heirs must choose | Art. 911 ¶3 |
| `DUAL_LINE_ASCENDANT` | Same person in both paternal/maternal lines | Art. 890 |
| `POSTHUMOUS_DISINHERITANCE` | Will disinherits unborn child | Arts. 915-923 |
| `CONTRADICTORY_DISPOSITIONS` | Will has conflicting instructions | Court resolution |

### 13.2 Key Edge Cases (82 Total)

**Renunciation** (8 cases):
- Single heir renounces → accretion to co-heirs (Art. 1018/1019)
- All nearest relatives renounce → next degree in own right (Art. 969)
- Renunciation for price → deemed acceptance, no vacancy (Art. 1050)
- Spouse renounces → scenario re-evaluation

**Commorientes** (2 cases):
- Art. 43: simultaneous death → treat as predecease, representation applies

**Unworthiness** (4 cases):
- Art. 1032: excluded but Art. 1035 allows descendant representation
- Art. 1033: written condonation (vs Art. 922 informal reconciliation for disinheritance)

**Preterition** (7 cases):
- Token legacy (₱1) defeats preterition → underprovision instead
- Spouse omission is NEVER preterition (Art. 854: direct line only)
- Invalid disinheritance ≠ preterition (Art. 918 partial vs Art. 854 total annulment)
- Through representation (Art. 854 ¶2)

**Collation** (12 cases):
- Destroyed donated property still collated at donation-time value (Art. 1071)
- Donor-exempt donation (Art. 1062) still checked for inofficiousness
- Grandchildren must collate parent's donations (Art. 1064)
- Dual computation for disputed items (Art. 1077)

**Adoption** (6 cases):
- Rescission before death → child no longer heir
- Stepparent adoption → dual inheritance (biological + adoptive parent)
- RA 11642 retroactivity for pre-2022 adoptions → configurable flag

**Free Portion** (7 cases):
- Zero FP → all voluntary dispositions inofficious
- Negative FP from excessive collation → donation return required
- Mixed succession: undisposed FP passes intestate (Art. 960(2))

See the full edge case catalog (82 cases across 21 categories) in `loops/inheritance-reverse/analysis/edge-cases.md`.

---

## 14. Test Vectors

### 14.1 Summary

13 complete test vectors covering 10 scenarios, 16 features, and 10 invariants.

| # | Scenario | Key Features |
|---|----------|-------------|
| TV-01 | I1 | Single heir, entire estate |
| TV-02 | I2 | Art. 996 spouse equal-to-child (E=₱12M, 3 LC + spouse → ₱3M each) |
| TV-03 | I3 | 2:1 unit ratio, no cap (E=₱10M, 2 LC + 1 IC → ₱4M/₱4M/₱2M) |
| TV-04 | I11 | Spouse only inherits all |
| TV-05 | I6 | ½/½ ascendant+spouse split (E=₱10M → ₱5M spouse, ₱2.5M each parent) |
| TV-06 | T1 | Legitime + FP to charity (E=₱10M, 2 LC → ₱2.5M each, charity ₱5M) |
| TV-07 | T3→I2 | Preterition: omitted LC annuls will (E=₱12M → ₱3M each intestate) |
| TV-08 | T3 | Disinheritance + representation (E=₱16M, 3 lines + spouse + friend) |
| TV-09 | T3 | Adopted child = legitimate (RA 8552 equality verification) |
| TV-10 | I2 | Representation: predeceased child with 3 grandchildren per stirpes |
| TV-11 | T5b | Complex: collation + cap check + inofficiousness |
| TV-12 | T2 | Inofficious legacy reduced, spouse underprovision recovery |
| TV-13 | T5a | Cap rule triggered: n=1, m=3, spouse priority (ICs reduced 66.7%) |

### 14.2 Test Invariants

Every test case must satisfy:

1. **Sum**: Σ(per_heir_amounts from estate) = net_distributable_estate
2. **Legitime floor**: Every compulsory heir receives ≥ their legitime (except valid disinheritance)
3. **Art. 895 ratio**: IC_share ≤ ½ × LC_share (testate only; exact ½ in intestate)
4. **Cap**: Σ(IC_legitimes) ≤ FP_remaining_after_spouse (testate only)
5. **Representation**: Σ(representatives) = line_ancestor_share
6. **Adoption**: adopted_child.share == legitimate_child.share (always)
7. **Preterition**: If detected → ALL institutions annulled
8. **Disinheritance**: If valid → heir gets ₱0 but descendants may represent
9. **Collation**: estate_base = net_estate + Σ(collatable_donations); from_estate_sum = net_estate
10. **Scenario consistency**: Scenario code matches surviving heir combination

### 14.3 Worked Example — TV-13 (Cap Rule)

**Input**: E = ₱20,000,000. 1 LC (Bianca) + 3 IC (Carlo, Dante, Elisa) + Spouse (Fiona). Testate, all receive legitime only.

**Step 3**: Scenario T5a (n=1, m=3)

**Step 5** (legitime computation):
- LC legitime = ₱20M × ½ = ₱10,000,000
- FP_gross = ₱20M × ½ = ₱10,000,000
- Spouse = ₱20M × ¼ = ₱5,000,000 (from FP)
- FP_remaining = ₱10M − ₱5M = ₱5,000,000
- IC uncapped = ½ × ₱10M = ₱5,000,000 each
- Total IC uncapped = 3 × ₱5M = ₱15,000,000
- **Cap triggered**: ₱15M > ₱5M
- IC capped = ₱5M / 3 = ₱1,666,666.67

**Distribution**:

| Heir | Amount |
|------|--------|
| Bianca (LC) | ₱10,000,000 |
| Carlo (IC) | ₱1,666,666.67 |
| Dante (IC) | ₱1,666,666.67 |
| Elisa (IC) | ₱1,666,666.67 |
| Fiona (Spouse) | ₱5,000,000 |
| **Total** | **₱20,000,000** ✓ |

**Intestate comparison** (I4): Per unit = ₱20M / 7 = ₱2,857,142.86 per IC — **71% more** than testate.

---

## 15. Implementation Notes

### 15.1 Language-Agnostic

This spec describes logic, not implementation language. Translate the data model and algorithms to any typed language (TypeScript, Rust, Python, etc.).

### 15.2 Required Library Capabilities

- **Exact rational arithmetic** with BigInt support
- **GCD reduction** for fraction normalization
- **Centavo-precision rounding** with remainder distribution

### 15.3 Determinism Guarantee

Same inputs → same scenario code → same fractions → same peso amounts → same narratives. No randomness, no probabilistic decisions. All legal ambiguities are either resolved (with citation) or flagged as warnings.

### 15.4 Testing Strategy

- Unit test each of the 10 pipeline steps independently
- Integration test all 13 test vectors end-to-end
- Property test the 10 invariants across randomized family trees
- Narrative test: verify 28 narrative section compositions (see explainer-format analysis)

---

## Appendix A: Article Quick Reference

| Article | Rule |
|---------|------|
| 854 | Preterition: total omission of direct-line compulsory heir annuls institution |
| 855 | Underprovision: 3-source waterfall recovery for under-endowed heirs |
| 872 | Conditions on legitime deemed not imposed |
| 887 | Enumeration of compulsory heirs |
| 888 | Legitimate children's collective legitime = ½ |
| 889 | Ascendants' collective legitime = ½ |
| 890 | Division among ascendants (by degree, by line) |
| 892 | Spouse's legitime with children (¼ if n=1, equal-to-child if n≥2) |
| 893 | Spouse's legitime with ascendants = ¼ |
| 894 | IC (⅓) + spouse (⅓) without primary heirs |
| 895 | IC = ½ of LC share; ¶3 cap rule |
| 896 | IC with ascendants = ¼ collective |
| 899 | Three-way: ascendants ½ + IC ¼ + spouse ⅛ |
| 900 | Spouse alone = ½ (⅓ if articulo mortis) |
| 901 | IC alone = ½ |
| 903 | Parents of illegitimate decedent |
| 908 | Estate base = net + collatable donations |
| 911 | Inofficiousness reduction (3 phases) |
| 912 | Indivisible realty: ½-value threshold |
| 915-923 | Disinheritance (grounds, validity, representation) |
| 960 | Intestate succession opens |
| 970-977 | Right of representation |
| 980 | Children inherit equally |
| 992 | Iron Curtain Rule (illegitimate barrier) |
| 995-1001 | Intestate distribution articles |
| 1002 | Guilty spouse forfeits |
| 1015-1023 | Accretion |
| 1032-1035 | Unworthiness |
| 1061-1077 | Collation |

## Appendix B: Glossary

| Term | Definition |
|------|-----------|
| **Legitime** | The reserved portion of the estate that the testator cannot dispose of — it must go to compulsory heirs |
| **Free portion** | The portion of the estate the testator may freely dispose of by will |
| **Compulsory heir** | An heir who is entitled to a legitime by operation of law |
| **Voluntary heir** | An heir named in the will who is not a compulsory heir |
| **Testate** | Succession with a valid will |
| **Intestate** | Succession without a will |
| **Mixed** | Will disposes of only part of the estate |
| **Preterition** | Total omission of a compulsory heir in the direct line from a will |
| **Collation** | The mathematical process of adding back inter vivos donations to compute the correct estate base |
| **Accretion** | The right of co-heirs to receive a proportional increase from a vacant share |
| **Representation** | The right of descendants to step into the place of a predeceased/disinherited/incapacitated ancestor |
| **Cap rule** (Art. 895 ¶3) | Total IC legitime cannot exceed the free portion; spouse satisfied first |
| **Iron Curtain** (Art. 992) | Bilateral barrier between illegitimate child and parent's legitimate relatives |
| **Articulo mortis** (Art. 900 ¶2) | Marriage during terminal illness — reduces spouse's share from ½ to ⅓ |
| **Reserva troncal** (Art. 891) | Obligation to reserve property for relatives of the line of origin |
| **Inofficious** | A testamentary disposition that impairs compulsory heirs' legitimes |

---

*This specification was synthesized from 24 analysis files covering Philippine succession law (Civil Code Book III, Family Code, RA 8552, RA 11642). Each rule is traceable to specific articles. A developer with no knowledge of Philippine law should be able to build the engine from this document alone.*
