# Test Case Field Coverage Analysis

**Aspect**: test-case-field-coverage (Wave 2)
**Sources**: 21 main cases (`examples/cases/01-20` + `simple-intestate.json`), 20 testate cases (`examples/testate-cases/01-20`), 100 fuzz cases (`examples/fuzz-cases/001-100`), all 17 Wave 1 analysis files
**Total test inputs analyzed**: 141 JSON files

---

## 1. Test Case Corpus Overview

| Corpus | Count | Focus |
|--------|-------|-------|
| Main cases (`cases/`) | 21 | Core intestate + 2 testate (06, 14), representation (15), adoption (17), collation (20), escheat (12) |
| Testate cases (`testate-cases/`) | 20 | All testate: institutions, legacies, disinheritances, articulo mortis (11) |
| Fuzz cases (`fuzz-cases/`) | 100 | Broad: intestate (001-035), testate fractions/strangers (036-045), disinheritance + grandchildren (047-060), legacies (061-070), donations (071-080), representation (081), preterition (082), renunciation (083-090), disinheritance combos (091-098), edge cases (099-100) |

---

## 2. Field Coverage Matrix

### 2.1 `EngineInput` (top-level)

| Field | Wave 1 Spec | Test Coverage | Status |
|-------|-------------|---------------|--------|
| `net_distributable_estate` | Required `Money` | All 141 cases; range 33–9,854,180,000 centavos | **FULL** |
| `decedent` | Required `Decedent` | All 141 cases | **FULL** |
| `family_tree` | Required `Person[]` | All 141 cases; empty in case 12 (escheat) | **FULL** |
| `will` | `Will \| null` | `null` in ~90 intestate cases, non-null in ~51 testate cases | **FULL** |
| `donations` | Required `Donation[]` | `[]` in ~130 cases, populated in ~11 cases (main/20, testate/12,20, fuzz/071-080) | **FULL** |
| `config` | Required `EngineConfig` | All 141 cases | **FULL** |

### 2.2 `Decedent` Fields

| Field | Wave 1 Spec | Exercised Values | Unexercised | Status |
|-------|-------------|------------------|-------------|--------|
| `id` | `string`, min(1) | `"d"`, `"decedent"` | — | **FULL** |
| `name` | `string`, min(1) | 40+ distinct names | — | **FULL** |
| `date_of_death` | ISO-8601 date | `"2026-01-15"` (all cases) | Other dates | **PARTIAL** (single date value) |
| `is_married` | `boolean` | `true`, `false` | — | **FULL** |
| `date_of_marriage` | `string \| null` | `null`, various dates | — | **FULL** |
| `marriage_solemnized_in_articulo_mortis` | `boolean` | `true` (testate/11), `false` | — | **FULL** |
| `was_ill_at_marriage` | `boolean` | `true` (testate/11), `false` | — | **FULL** |
| `illness_caused_death` | `boolean` | `true` (testate/11), `false` | — | **FULL** |
| `years_of_cohabitation` | `number`, int ≥ 0 | 0, 1 | Values ≥ 5 (cohabitation threshold) | **PARTIAL** |
| `has_legal_separation` | `boolean` | `true` (fuzz/085-089), `false` | — | **FULL** |
| `is_illegitimate` | `boolean` | `false` only | `true` never in JSON (only Rust unit test TV-20) | **GAP** |

### 2.3 `Person` Fields

| Field | Wave 1 Spec | Exercised Values | Unexercised | Status |
|-------|-------------|------------------|-------------|--------|
| `id` | `string`, alphanumeric+dash+underscore | `"c1"`, `"lc1"`, `"sp"`, `"gc1_1"`, etc. | — | **FULL** |
| `name` | `string`, min(1) | 100+ names | — | **FULL** |
| `is_alive_at_succession` | `boolean` | `true`, `false` (main/15, fuzz/081) | — | **FULL** |
| `relationship_to_decedent` | `Relationship` enum (11 variants) | See §3.1 | 5 variants never in JSON | **GAP** |
| `degree` | `number`, int 1-5 | 1, 2 | 3, 4, 5 | **PARTIAL** |
| `line` | `"Paternal" \| "Maternal" \| null` | `"Paternal"`, `"Maternal"`, `null` | — | **FULL** |
| `children` | `string[]` | `[]`, `["gc1", "gc2"]`, etc. | — | **FULL** |
| `filiation_proved` | `boolean` | `true` only | `false` never in JSON | **GAP** |
| `filiation_proof_type` | `FiliationProof \| null` | `null`, `"BirthCertificate"`, `"FinalJudgment"` | 4 variants never in JSON | **GAP** |
| `is_guilty_party_in_legal_separation` | `boolean` | `true` (fuzz/085-089), `false` | — | **FULL** |
| `adoption` | `Adoption \| null` | `null`, full Adoption obj (main/17) | — | **FULL** (struct partially) |
| `is_unworthy` | `boolean` | `false` only | `true` never in JSON | **GAP** |
| `unworthiness_condoned` | `boolean` | `false` only | `true` never in JSON | **GAP** |
| `has_renounced` | `boolean` | `true` (fuzz/083-090), `false` | — | **FULL** |
| `blood_type` | `"Full" \| "Half" \| null` | `"Full"`, `"Half"`, `null` | — | **FULL** |

### 2.4 `Adoption` Fields

| Field | Wave 1 Spec | Exercised Values | Unexercised | Status |
|-------|-------------|------------------|-------------|--------|
| `decree_date` | ISO-8601 date | `"2015-01-01"` | Other dates | **PARTIAL** (single value) |
| `regime` | `AdoptionRegime` enum | `"Ra8552"` | `"Ra11642"` | **GAP** |
| `adopter` | `string` | `"d"` | — | **FULL** |
| `adoptee` | `string` | `"ac1"` | — | **FULL** |
| `is_stepparent_adoption` | `boolean` | `false` only | `true` never in JSON | **GAP** |
| `biological_parent_spouse` | `string \| null` | `null` only | Non-null never in JSON | **GAP** |
| `is_rescinded` | `boolean` | `false` only | `true` never in JSON | **GAP** |
| `rescission_date` | `string \| null` | `null` only | Non-null never in JSON | **GAP** |

### 2.5 `Will` Fields

| Field | Wave 1 Spec | Exercised Values | Unexercised | Status |
|-------|-------------|------------------|-------------|--------|
| `institutions` | `InstitutionOfHeir[]` | Empty and populated (many cases) | — | **FULL** |
| `legacies` | `Legacy[]` | Empty and populated | — | **FULL** |
| `devises` | `Devise[]` | `[]` only | Non-empty never in JSON | **GAP** |
| `disinheritances` | `Disinheritance[]` | Empty and populated (15+ cases) | — | **FULL** |
| `date_executed` | ISO-8601 date | `"2025-06-01"`, `"2024-11-01"` | — | **FULL** |

### 2.6 `InstitutionOfHeir` Fields

| Field | Wave 1 Spec | Exercised Values | Unexercised | Status |
|-------|-------------|------------------|-------------|--------|
| `id` | `string` | `"i1"`, `"i2"`, etc. | — | **FULL** |
| `heir` | `HeirReference` | Family members + strangers | — | **FULL** |
| `share` | `ShareSpec` (6 variants) | See §3.4 | 1 variant never in JSON | **GAP** |
| `conditions` | `Condition[]` | `[]` only | Non-empty never in JSON | **GAP** |
| `substitutes` | `Substitute[]` | `[]` only | Non-empty never in JSON | **GAP** |
| `is_residuary` | `boolean` | `true`, `false` | — | **FULL** |

### 2.7 `HeirReference` Fields

| Field | Wave 1 Spec | Exercised Values | Unexercised | Status |
|-------|-------------|------------------|-------------|--------|
| `person_id` | `string \| null` | Family IDs, `null` (strangers) | — | **FULL** |
| `name` | `string` | Various names | — | **FULL** |
| `is_collective` | `boolean` | `false` only | `true` never in JSON | **GAP** |
| `class_designation` | `string \| null` | `null` only | Non-null never in JSON | **GAP** |

### 2.8 `Legacy` Fields

| Field | Wave 1 Spec | Exercised Values | Unexercised | Status |
|-------|-------------|------------------|-------------|--------|
| `id` | `string` | `"l1"`, `"leg1"`, etc. | — | **FULL** |
| `legatee` | `HeirReference` | Strangers only (person_id=null) | Family member legatees | **PARTIAL** |
| `property` | `LegacySpec` (3 variants) | See §3.5 | 2 variants never in JSON | **GAP** |
| `conditions` | `Condition[]` | `[]` only | Non-empty never in JSON | **GAP** |
| `substitutes` | `Substitute[]` | `[]` only | Non-empty never in JSON | **GAP** |
| `is_preferred` | `boolean` | `true` (testate/17), `false` | — | **FULL** |

### 2.9 `Disinheritance` Fields

| Field | Wave 1 Spec | Exercised Values | Unexercised | Status |
|-------|-------------|------------------|-------------|--------|
| `heir_reference` | `HeirReference` | Family members (person_id non-null) | — | **FULL** |
| `cause_code` | `DisinheritanceCause` (22 variants) | See §3.6 | 15 variants never in JSON | **GAP** |
| `cause_specified_in_will` | `boolean` | `true` only | `false` never in JSON | **GAP** |
| `cause_proven` | `boolean` | `true` only | `false` never in JSON | **GAP** |
| `reconciliation_occurred` | `boolean` | `false` only | `true` never in JSON | **GAP** |

### 2.10 `Donation` Fields

| Field | Wave 1 Spec | Exercised Values | Unexercised | Status |
|-------|-------------|------------------|-------------|--------|
| `id` | `string` | `"don1"`, `"d1"`, etc. | — | **FULL** |
| `recipient_heir_id` | `string` | `"c1"`, `"lc1"`, etc. | — | **FULL** |
| `recipient_is_stranger` | `boolean` | `false` only | `true` never in JSON | **GAP** |
| `value_at_time_of_donation` | `Money` | Various amounts | — | **FULL** |
| `date` | ISO-8601 date | `"2020-01-01"` | Other dates | **PARTIAL** |
| `description` | `string` | `"advance on inheritance"` | Other descriptions | **PARTIAL** |
| `is_expressly_exempt` | `boolean` | `true` (fuzz/073-078), `false` | — | **FULL** |
| `is_support_education_medical` | `boolean` | `false` only | `true` never in JSON | **GAP** |
| `is_customary_gift` | `boolean` | `false` only | `true` never in JSON | **GAP** |
| `is_professional_expense` | `boolean` | `false` only | `true` never in JSON | **GAP** |
| `professional_expense_parent_required` | `boolean` | `false` only | `true` never in JSON | **GAP** |
| `professional_expense_imputed_savings` | `Money \| null` | `null` only | Non-null never in JSON | **GAP** |
| `is_joint_from_both_parents` | `boolean` | `false` only | `true` never in JSON | **GAP** |
| `is_to_child_spouse_only` | `boolean` | `false` only | `true` never in JSON | **GAP** |
| `is_joint_to_child_and_spouse` | `boolean` | `false` only | `true` never in JSON | **GAP** |
| `is_wedding_gift` | `boolean` | `false` only | `true` never in JSON | **GAP** |
| `is_debt_payment_for_child` | `boolean` | `false` only | `true` never in JSON | **GAP** |
| `is_election_expense` | `boolean` | `false` only | `true` never in JSON | **GAP** |
| `is_fine_payment` | `boolean` | `false` only | `true` never in JSON | **GAP** |

### 2.11 `EngineConfig` Fields

| Field | Wave 1 Spec | Exercised Values | Unexercised | Status |
|-------|-------------|------------------|-------------|--------|
| `retroactive_ra_11642` | `boolean`, default `false` | `false` only | `true` never in JSON | **GAP** (forward-looking, not consumed) |
| `max_pipeline_restarts` | `number`, default `10` | `10` only | Other values | **PARTIAL** (single value) |

---

## 3. Enum Variant Coverage

### 3.1 `Relationship` (11 variants)

| Variant | Wave 1 Spec | Test Cases | Status |
|---------|-------------|------------|--------|
| `LegitimateChild` | Yes | 100+ occurrences across all corpora | **EXERCISED** |
| `LegitimatedChild` | Yes | **Never in any JSON** | **UNEXERCISED** |
| `AdoptedChild` | Yes | main/17 only | **EXERCISED** (1 case) |
| `IllegitimateChild` | Yes | main/03,09,10,18,19; testate/09,12,19; fuzz/019-025 | **EXERCISED** |
| `SurvivingSpouse` | Yes | 40+ cases | **EXERCISED** |
| `LegitimateParent` | Yes | main/05,08,16; testate/13,18; fuzz/027-035,100 | **EXERCISED** |
| `LegitimateAscendant` | Yes | **Never in any JSON** | **UNEXERCISED** |
| `Sibling` | Yes | main/11; fuzz/027-032 | **EXERCISED** |
| `NephewNiece` | Yes | **Never in any JSON** | **UNEXERCISED** |
| `OtherCollateral` | Yes | **Never in any JSON** | **UNEXERCISED** |
| `Stranger` | Yes | **Never in any JSON** (strangers use HeirReference with person_id=null, not family_tree) | **UNEXERCISED** (by design) |

**Frontend impact**: All 11 variants must be in the dropdown. The 5 unexercised variants are valid engine inputs — the spec correctly includes them. Stranger is special (excluded from family_tree by design; strangers enter via HeirReference in will dispositions).

### 3.2 `FiliationProof` (6 variants)

| Variant | Test Cases | Status |
|---------|------------|--------|
| `BirthCertificate` | main/simple-intestate; testate/09; fuzz (IC cases) | **EXERCISED** |
| `FinalJudgment` | main/03(ic3); testate/09,12 | **EXERCISED** |
| `PublicDocumentAdmission` | Never | **UNEXERCISED** |
| `PrivateHandwrittenAdmission` | Never | **UNEXERCISED** |
| `OpenContinuousPossession` | Never | **UNEXERCISED** |
| `OtherEvidence` | Never | **UNEXERCISED** |

**Frontend impact**: All 6 must be in dropdown. Engine only checks `filiation_proved` boolean, not proof type — so unexercised variants are still valid inputs.

### 3.3 `AdoptionRegime` (2 variants)

| Variant | Test Cases | Status |
|---------|------------|--------|
| `Ra8552` | main/17 | **EXERCISED** |
| `Ra11642` | Never | **UNEXERCISED** |

**Frontend impact**: Both must be in dropdown. Engine treats them identically currently.

### 3.4 `ShareSpec` (6 variants)

| Variant | Test Cases | Status |
|---------|------------|--------|
| `Fraction` | testate/02,10,14; fuzz/036 | **EXERCISED** |
| `EqualWithOthers` | testate/01,04,08,09,10,11,12,19,20; fuzz/082 | **EXERCISED** |
| `EntireEstate` | testate/03,13 | **EXERCISED** |
| `EntireFreePort` | main/06; testate/15,18; fuzz/036-045 | **EXERCISED** |
| `Unspecified` | Never | **UNEXERCISED** |
| `Residuary` | testate/01,04,08,11; fuzz/061-070 | **EXERCISED** |

**Frontend impact**: `Unspecified` resolves to zero (like `EqualWithOthers`). Include in dropdown but may want to default to a more explicit choice.

### 3.5 `LegacySpec` (3 variants)

| Variant | Test Cases | Status |
|---------|------------|--------|
| `FixedAmount` | main/14; testate/05-08,12,16,17,20; fuzz/061-070 | **EXERCISED** |
| `SpecificAsset` | Never | **UNEXERCISED** |
| `GenericClass` | Never | **UNEXERCISED** |

**Frontend impact**: SpecificAsset and GenericClass both resolve to zero in engine (no property valuation). Include in UI but note they produce zero value. GenericClass uses **tuple serialization** `["desc", {"centavos": N}]` — critical to test even without engine test cases.

### 3.6 `DisinheritanceCause` (22 variants)

| Variant | Test Cases | Status |
|---------|------------|--------|
| `ChildMaltreatment` | testate/04; fuzz/047,055,091 | **EXERCISED** |
| `ChildAdulteryWithSpouse` | fuzz/050,059,091,098 | **EXERCISED** |
| `ChildCivilInterdiction` | fuzz/050,098 | **EXERCISED** |
| `ChildRefusalToSupport` | testate/20; fuzz/057,059 | **EXERCISED** |
| `ChildFraudUndueInfluence` | fuzz/058,091 | **EXERCISED** |
| `ChildDishonorableLife` | fuzz/058,059 | **EXERCISED** |
| `ChildAttemptOnLife` | fuzz/060,091,098 | **EXERCISED** |
| `ChildGroundlessAccusation` | testate/15 | **EXERCISED** |
| `ParentAbandonmentCorruption` | Never | **UNEXERCISED** |
| `ParentAttemptOnLife` | Never | **UNEXERCISED** |
| `ParentGroundlessAccusation` | Never | **UNEXERCISED** |
| `ParentAdulteryWithSpouse` | Never | **UNEXERCISED** |
| `ParentFraudUndueInfluence` | Never | **UNEXERCISED** |
| `ParentLossParentalAuthority` | Never | **UNEXERCISED** |
| `ParentRefusalToSupport` | Never | **UNEXERCISED** |
| `ParentAttemptOnOther` | Never | **UNEXERCISED** |
| `SpouseAttemptOnLife` | Never | **UNEXERCISED** |
| `SpouseGroundlessAccusation` | Never | **UNEXERCISED** |
| `SpouseFraudUndueInfluence` | Never | **UNEXERCISED** |
| `SpouseCauseLegalSeparation` | Never | **UNEXERCISED** |
| `SpouseLossParentalAuthority` | Never | **UNEXERCISED** |
| `SpouseRefusalToSupport` | Never | **UNEXERCISED** |

**Frontend impact**: All 8 Child causes exercised. All 8 Parent and 6 Spouse causes unexercised. Frontend must still include all 22 and filter by heir relationship (Child causes for children, Parent for parents, Spouse for spouse).

### 3.7 `ConditionType` / `ConditionStatus` / `SubstitutionType` / `SubstitutionTrigger`

| Enum | Variants | Test Cases | Status |
|------|----------|------------|--------|
| `ConditionType` (3) | Suspensive, Resolutory, Modal | **Never** (all conditions arrays empty) | **UNEXERCISED** |
| `ConditionStatus` (4) | Pending, Fulfilled, Failed, NotApplicable | **Never** | **UNEXERCISED** |
| `SubstitutionType` (3) | Simple, Reciprocal, Fideicommissary | **Never** (all substitutes arrays empty) | **UNEXERCISED** |
| `SubstitutionTrigger` (3) | Predecease, Renunciation, Incapacity | **Never** | **UNEXERCISED** |

**Frontend impact**: These are informational fields. Engine strips conditions (compulsory heirs) and resolves substitutes by person_id only. Still needed in UI for legal completeness.

### 3.8 `DeviseSpec` (2 variants)

| Variant | Test Cases | Status |
|---------|------------|--------|
| `SpecificProperty` | Never (all devises arrays empty) | **UNEXERCISED** |
| `FractionalInterest` | Never | **UNEXERCISED** |

**Frontend impact**: Both resolve to zero. FractionalInterest uses tuple serialization `["asset-id", "n/d"]`.

---

## 4. Serialization Format Verification

Cross-referencing test case JSON with Wave 1 serialization specs:

| Format | Wave 1 Spec | Test Case Evidence | Confirmed? |
|--------|-------------|-------------------|------------|
| Money: `{"centavos": N}` | `number \| string` | All cases use `number` (integer); no string-form BigInt seen | **Confirmed** (number only) |
| Frac: `"n/d"` string | NOT `{numer, denom}` | Seen in testate/02,10,14: `{"Fraction": "1/3"}`, `{"Fraction": "1/2"}` | **Confirmed** |
| Enum: PascalCase strings | All enums | `"LegitimateChild"`, `"SurvivingSpouse"`, `"BirthCertificate"`, `"Ra8552"`, etc. | **Confirmed** |
| ShareSpec unit variants: bare strings | Not tagged objects | `"EntireFreePort"`, `"EqualWithOthers"`, `"Residuary"`, `"EntireEstate"` | **Confirmed** |
| ShareSpec Fraction: `{"Fraction": "n/d"}` | Externally tagged | `{"Fraction": "1/3"}`, `{"Fraction": "2/3"}`, `{"Fraction": "1/10"}`, `{"Fraction": "1/1"}` | **Confirmed** |
| LegacySpec FixedAmount: `{"FixedAmount": {"centavos": N}}` | Externally tagged | All legacy test cases | **Confirmed** |
| LegacySpec GenericClass: `{"GenericClass": ["desc", Money]}` | Tuple variant → JSON array | **No test case** | **Unconfirmed** |
| DeviseSpec: `{"SpecificProperty": "id"}`, `{"FractionalInterest": ["id", "n/d"]}` | Tuple variant → JSON array | **No test case** | **Unconfirmed** |
| Date: ISO-8601 `"YYYY-MM-DD"` | String | All date fields | **Confirmed** |
| `null` for optional fields | Not absent keys | All cases include every field (null, not absent) | **Confirmed** |

---

## 5. Gap Analysis Summary

### 5.1 Enum Variants Never Exercised in Any Test Case (34 total)

```typescript
// Relationship (5 of 11 unexercised)
type UnexercisedRelationship =
  | "LegitimatedChild"      // Legal concept distinct from LegitimateChild
  | "LegitimateAscendant"   // Grandparents (degree ≥ 2)
  | "NephewNiece"           // Collateral
  | "OtherCollateral"       // Collateral
  | "Stranger";             // By design: strangers don't go in family_tree

// FiliationProof (4 of 6 unexercised)
type UnexercisedFiliationProof =
  | "PublicDocumentAdmission"
  | "PrivateHandwrittenAdmission"
  | "OpenContinuousPossession"
  | "OtherEvidence";

// AdoptionRegime (1 of 2 unexercised)
type UnexercisedAdoptionRegime = "Ra11642";

// ShareSpec (1 of 6 unexercised)
type UnexercisedShareSpec = "Unspecified";

// LegacySpec (2 of 3 unexercised)
type UnexercisedLegacySpec = "SpecificAsset" | "GenericClass";

// DeviseSpec (2 of 2 unexercised)
type UnexercisedDeviseSpec = "SpecificProperty" | "FractionalInterest";

// DisinheritanceCause (14 of 22 unexercised)
type UnexercisedDisinheritanceCause =
  | "ParentAbandonmentCorruption" | "ParentAttemptOnLife"
  | "ParentGroundlessAccusation" | "ParentAdulteryWithSpouse"
  | "ParentFraudUndueInfluence" | "ParentLossParentalAuthority"
  | "ParentRefusalToSupport" | "ParentAttemptOnOther"
  | "SpouseAttemptOnLife" | "SpouseGroundlessAccusation"
  | "SpouseFraudUndueInfluence" | "SpouseCauseLegalSeparation"
  | "SpouseLossParentalAuthority" | "SpouseRefusalToSupport";

// ConditionType (3 of 3 unexercised)
// ConditionStatus (4 of 4 unexercised)
// SubstitutionType (3 of 3 unexercised)
// SubstitutionTrigger (3 of 3 unexercised)
```

### 5.2 Boolean Fields Never Set to `true` in Any Test Case

```typescript
// These fields exist in Wave 1 specs but no test case sets them to true:
interface NeverTrueFields {
  // Decedent
  "decedent.is_illegitimate": boolean;              // Only in Rust unit test TV-20

  // Person
  "person.is_unworthy": boolean;                    // Unworthiness path untested
  "person.unworthiness_condoned": boolean;           // Depends on is_unworthy
  "person.filiation_proved": false;                  // Always true in all tests

  // Adoption
  "adoption.is_stepparent_adoption": boolean;        // Stepparent path untested
  "adoption.is_rescinded": boolean;                  // Rescission path untested

  // HeirReference
  "heir_reference.is_collective": boolean;           // Collective designation untested

  // Disinheritance
  "disinheritance.cause_specified_in_will": false;   // Always true
  "disinheritance.cause_proven": false;              // Always true
  "disinheritance.reconciliation_occurred": true;    // Always false

  // Donation (10 of 11 exemption flags never true)
  "donation.recipient_is_stranger": boolean;
  "donation.is_support_education_medical": boolean;
  "donation.is_customary_gift": boolean;
  "donation.is_professional_expense": boolean;
  "donation.professional_expense_parent_required": boolean;
  "donation.is_joint_from_both_parents": boolean;
  "donation.is_to_child_spouse_only": boolean;
  "donation.is_joint_to_child_and_spouse": boolean;
  "donation.is_wedding_gift": boolean;
  "donation.is_debt_payment_for_child": boolean;
  "donation.is_election_expense": boolean;
  "donation.is_fine_payment": boolean;
  // Only is_expressly_exempt is exercised as true (fuzz/073-078)

  // Config
  "config.retroactive_ra_11642": boolean;            // Forward-looking, not consumed
}
```

### 5.3 Structural Patterns Never Exercised

| Pattern | Description | Frontend Impact |
|---------|-------------|-----------------|
| Non-empty `conditions[]` | No test case has conditions on institutions/legacies/devises | Condition sub-form UI is specified but untestable against engine |
| Non-empty `substitutes[]` | No test case has substitutes | Substitute sub-form same situation |
| Non-empty `devises[]` | No test case has devises | Devise sub-form entirely untestable |
| `class_designation` non-null | Collective heir designations never used | Class designation input untestable |
| `is_collective: true` | Never used | Collective heir toggle untestable |
| String-form centavos | BigInt overflow path (centavos > MAX_SAFE_INTEGER) | Money input string serialization path unconfirmed |
| GenericClass tuple format | `["desc", {"centavos": N}]` | Tuple serialization unconfirmed by test data |
| FractionalInterest tuple format | `["asset-id", "n/d"]` | Tuple serialization unconfirmed by test data |

---

## 6. Findings Affecting Wave 1 Specs

### 6.1 Confirmed Spec Accuracy

All Wave 1 TypeScript interfaces and Zod schemas are **structurally correct** — every field that appears in test cases matches the documented type, and no test case field is missing from specs. Specifically:

1. **All top-level fields**: Present in every JSON, matching `EngineInput` interface exactly
2. **All field names**: snake_case as documented
3. **All enum serialization**: PascalCase strings as documented
4. **ShareSpec polymorphism**: Both bare string and `{"Fraction": "n/d"}` formats confirmed
5. **LegacySpec tagging**: `{"FixedAmount": {"centavos": N}}` format confirmed
6. **Null vs absent**: All fields always present (null, not omitted) — matches serde behavior
7. **Grandchild representation**: `relationship=LegitimateChild, degree=2, children=[]` on grandchild; parent has `children=["gcId"]` — matches spec
8. **Money always integer in practice**: No string-form BigInt seen (but spec correctly allows it)

### 6.2 Spec Corrections/Additions Needed

**None identified.** All Wave 1 specs accurately cover the test case data. The gaps are all in the direction of "spec covers more than tests exercise" which is correct (the spec mirrors the Rust types, which support more than the test cases demonstrate).

### 6.3 Observations for Frontend Defaults

The test cases reveal commonly-used default patterns that should inform wizard UX:

| Field | Common Default in Tests | Recommendation |
|-------|------------------------|----------------|
| `decedent.id` | `"d"` | Auto-fill, hidden |
| `decedent.date_of_death` | `"2026-01-15"` | User must provide |
| `config.retroactive_ra_11642` | `false` | Default false, Advanced Settings |
| `config.max_pipeline_restarts` | `10` | Default 10, hidden or Advanced |
| `person.filiation_proved` | `true` | Default true |
| `person.is_alive_at_succession` | `true` | Default true |
| `person.degree` | `1` for direct heirs | Auto-fill from relationship |
| All donation exemption flags | `false` | Default false |
| `disinheritance.cause_specified_in_will` | `true` | Default true |
| `disinheritance.cause_proven` | `true` | Default true |
| `disinheritance.reconciliation_occurred` | `false` | Default false |

---

## 7. Test Case Coverage by Scenario Type

| Scenario | Main Cases | Testate Cases | Fuzz Cases | Total |
|----------|-----------|---------------|------------|-------|
| Intestate, LC only | 01, 07, 15, 20 | — | 001-015 | 19 |
| Intestate, LC + Spouse | 02, 13 | — | 001-013 | 15+ |
| Intestate, LC + IC | 03, 09, 10 | — | 019-025 | 10+ |
| Intestate, Spouse only | 04 | — | — | 1 |
| Intestate, Parents | 05, 08, 16 | — | 029-035 | 10+ |
| Intestate, Siblings | 11 | — | 027-032 | 7+ |
| Intestate, Escheat | 12 | — | — | 1 |
| Testate, basic | 06 | 01-14 | 036-045 | 25+ |
| Testate, disinheritance | — | 04, 15, 20 | 047-060 | 18+ |
| Testate, legacies | 14 | 05-08, 12, 16, 17, 20 | 061-070 | 20+ |
| Donations/collation | 20 | 12, 20 | 071-080 | 13 |
| Renunciation | — | — | 083-090 | 8 |
| Legal separation | — | — | 085-089 | 5 |
| Representation | 15 | — | 081 | 2 |
| Adopted child | 17 | — | — | 1 |
| Articulo mortis | — | 11 | — | 1 |

**Weakly covered scenarios** (≤ 2 test cases): Escheat, spouse-only intestate, adopted child, articulo mortis, representation. These warrant extra frontend validation attention.

---

## 8. Recommendations for Synthesis Phase

1. **All enum dropdowns must include all variants** — even unexercised ones. The Rust types define the valid set; test coverage is irrelevant to schema correctness.

2. **Serialization for unconfirmed formats** (`GenericClass` tuple, `FractionalInterest` tuple, string-form centavos): The Wave 1 specs derived these from Rust source code analysis, which is authoritative. Mark them as "derived from source, not confirmed by test data" in synthesis.

3. **Conditions and Substitutes sub-forms**: Include in spec but mark as "no integration test coverage". The engine consumes only `description` (conditions) and `substitute_heir.person_id` (substitutes) — the rest is informational.

4. **Donation exemption flags**: Only `is_expressly_exempt` has test coverage. All 10 other exemption flags should still be included — the engine's 14-rule collatability decision tree (step4) handles them all.

5. **Default values from test patterns** should be hardcoded in Zod `.default()` calls for optimal UX (see §6.3).

6. **The `filiation_proved: false` path** is never tested but the engine gates on it (step1:178). Frontend should allow it as a boolean toggle on IC heirs.

7. **Devises** are fully specified in Wave 1 but completely unexercised. Include in synthesis but consider making the devise sub-form a "hidden/advanced" feature in the wizard, since both variants resolve to zero monetary value.
