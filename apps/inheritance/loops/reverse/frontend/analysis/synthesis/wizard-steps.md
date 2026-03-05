# Wizard Steps Specification
## Philippine Inheritance Distribution Engine — React/TypeScript Frontend

**Wave**: 3 (Synthesis)
**Depends on**: All Wave 1 + Wave 2 analysis files
**Design doc**: `docs/plans/2026-02-24-inheritance-frontend-design.md`

---

## Overview

The wizard has **6 steps**. Step 4 is conditionally visible (testate only). All steps
share a global form state (React Context or Zustand) to support cross-step data flows.

```
Step 1 — Estate Details          (always visible)
Step 2 — Decedent Details        (always visible)
Step 3 — Family Tree             (always visible)
Step 4 — Will & Dispositions     (visible only when hasWill = true)
Step 5 — Donations               (always visible; skippable)
Step 6 — Review & Config         (always visible)
```

**Top-level wizard state (not part of EngineInput):**
```typescript
interface WizardMeta {
  /** User-facing toggle that controls will presence and Step 4 visibility */
  hasWill: boolean;
}
```

---

## Step 1 — Estate Details

**Component**: `EstateStep.tsx`
**Rust source**: `types.rs:1-18` (`EngineInput` top-level fields)
**Analysis refs**: `engine-input-root.md`, `money.md`, `engine-config.md`

### Fields

| Order | Field Path | Label | Input Type | Default | Required | Validation |
|-------|-----------|-------|-----------|---------|----------|-----------|
| 1 | `net_distributable_estate` | Net Distributable Estate | MoneyInput | — | Yes | > 0 centavos (hard error) |
| 2 | `hasWill` (wizard meta) | Succession Type | Toggle/Radio | `false` | Yes | — |

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Net Distributable Estate                               │
│  ₱ [________________________]                           │
│  Hint: Total estate value after debts, taxes,           │
│        and funeral expenses.                            │
│                                                         │
│  Succession Type                                        │
│  ○ Intestate (No Will)   ● Testate (With Will)         │
│                                                         │
│  [If estate = 0]: ⚠ Estate must be greater than zero  │
└─────────────────────────────────────────────────────────┘
```

### Serialization

- `net_distributable_estate`: pesos entered by user → `Math.round(pesos * 100)` → `{ centavos: number }`
- `hasWill = true` → `will: { ... }` (non-null Will object)
- `hasWill = false` → `will: null`

### Validation Rules

```typescript
// Hard error: Source: pipeline.rs:21
if (netDistributableEstate.centavos <= 0) → "Estate must be greater than zero"

// Warning: Source: money.md
if (netDistributableEstate.centavos < 100) → "Amount seems very small — did you mean ₱{pesos}?"
```

---

## Step 2 — Decedent Details

**Component**: `DecedentStep.tsx`
**Rust source**: `types.rs:86-112` (`Decedent` struct)
**Analysis refs**: `decedent.md`, `conditional-visibility.md §2`

### Fields — Always Visible

| Order | Field Path | Label | Input Type | Default | Required | Validation |
|-------|-----------|-------|-----------|---------|----------|-----------|
| 1 | `decedent.id` | — | Hidden, auto-set to `"d"` | `"d"` | Yes | Fixed |
| 2 | `decedent.name` | Full Name | TextInput | `""` | Yes | Non-empty |
| 3 | `decedent.date_of_death` | Date of Death | DateInput | today | Yes | Valid ISO-8601 date |
| 4 | `decedent.is_illegitimate` | Decedent is Illegitimate | Toggle | `false` | Yes | — |
| 5 | `decedent.is_married` | Was Married at Time of Death | Toggle | `false` | Yes | — |

### Fields — Conditional on `is_married = true`

| Order | Field Path | Label | Input Type | Default | Required | Visibility Condition |
|-------|-----------|-------|-----------|---------|----------|---------------------|
| 6 | `decedent.date_of_marriage` | Date of Marriage | DateInput | `null` | Yes | `is_married` |
| 7 | `decedent.years_of_cohabitation` | Years of Cohabitation | NumberInput (int ≥ 0) | `0` | Yes | `is_married` |
| 8 | `decedent.has_legal_separation` | Legal Separation Decreed | Toggle | `false` | No | `is_married` |
| 9 | `decedent.marriage_solemnized_in_articulo_mortis` | Marriage Solemnized in Articulo Mortis | Toggle | `false` | No | `is_married` |

### Fields — Conditional on `is_married && marriage_solemnized_in_articulo_mortis = true`

| Order | Field Path | Label | Input Type | Default | Required | Visibility Condition |
|-------|-----------|-------|-----------|---------|----------|---------------------|
| 10 | `decedent.was_ill_at_marriage` | Was Ill at Time of Marriage | Toggle | `false` | No | `is_married && marriage_solemnized_in_articulo_mortis` |

### Fields — Conditional on `is_married && marriage_solemnized_in_articulo_mortis && was_ill_at_marriage = true`

| Order | Field Path | Label | Input Type | Default | Required | Visibility Condition |
|-------|-----------|-------|-----------|---------|----------|---------------------|
| 11 | `decedent.illness_caused_death` | Illness Caused Death | Toggle | `false` | No | `is_married && marriage_solemnized_in_articulo_mortis && was_ill_at_marriage` |

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Full Name                                              │
│  [_____________________________]                        │
│                                                         │
│  Date of Death                                          │
│  [YYYY-MM-DD]                                          │
│                                                         │
│  ☐ Decedent is Illegitimate                            │
│    (Note: Only affects scenario when no descendants     │
│     and will exists — Arts. T14/T15 via Art. 903)      │
│                                                         │
│  ☐ Was Married at Time of Death                        │
│  └─ (if checked) ──────────────────────────────────┐  │
│     Date of Marriage: [YYYY-MM-DD]                  │  │
│     Years of Cohabitation: [___]                    │  │
│     ☐ Legal Separation Decreed                      │  │
│     ☐ Marriage Solemnized in Articulo Mortis        │  │
│     └─ (if checked) ──────────────────────────────┐│  │
│        ☐ Was Ill at Time of Marriage               ││  │
│        └─ (if checked) ────────────────────────┐  ││  │
│           ☐ Illness Caused Death               │  ││  │
│           └────────────────────────────────────┘  ││  │
│        └───────────────────────────────────────────┘│  │
│     └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Articulo Mortis Warning Banner

Display when ALL four conditions are true AND `years_of_cohabitation < 5`:

```
⚠ Articulo mortis marriage detected — surviving spouse's legitime will be
  reduced from E/2 to E/3 under Art. 900 ¶2.
```

Source: `step1_classify.rs:226-231`, `step5_legitimes.rs:431-436`

### Reset on Toggle-Off

```typescript
// Source: conditional-visibility.md §2
// When is_married → false: reset all marriage-gated fields
const MARRIAGE_DEFAULTS = {
  date_of_marriage: null,
  years_of_cohabitation: 0,
  has_legal_separation: false,
  marriage_solemnized_in_articulo_mortis: false,
  was_ill_at_marriage: false,
  illness_caused_death: false,
};

// When marriage_solemnized_in_articulo_mortis → false
const ARTICULO_MORTIS_DEFAULTS = {
  was_ill_at_marriage: false,
  illness_caused_death: false,
};

// When was_ill_at_marriage → false
const ILLNESS_DEFAULTS = { illness_caused_death: false };
```

### Cross-Step Side Effects

- When `is_married` toggles ON → show prompt in Step 3: "Add a Surviving Spouse to the family tree?"
- When `is_married` toggles OFF and a SurvivingSpouse exists in `family_tree` → show warning: "A Surviving Spouse is in the family tree but the decedent is marked as unmarried."
- `has_legal_separation = true` → gates `is_guilty_party_in_legal_separation` on SurvivingSpouse persons in Step 3
- `date_of_death` → used as `maxDate` constraint on DateInputs in Steps 4 and 5

---

## Step 3 — Family Tree

**Component**: `FamilyTreeStep.tsx`
**Rust source**: `types.rs:115-210` (`Person` struct), `types.rs:1-18` (`EngineInput.family_tree`)
**Analysis refs**: `person.md`, `relationship-enum.md`, `filiation-proof.md`, `blood-type.md`, `adoption.md`, `conditional-visibility.md §3-4`

### Top-Level State

```typescript
// family_tree is a Vec<Person> (can be empty)
// Each person is rendered as an expandable card
```

### Person Form — Always Visible Fields

| Order | Field Path | Label | Input Type | Default | Required | Validation |
|-------|-----------|-------|-----------|---------|----------|-----------|
| 1 | `person.id` | — | Hidden, auto-generated | slug from relationship+index | Yes | Unique across all persons |
| 2 | `person.name` | Full Name | TextInput | `""` | Yes | Non-empty |
| 3 | `person.relationship_to_decedent` | Relationship to Decedent | EnumSelect (grouped) | — | Yes | One of 11 valid variants |
| 4 | `person.is_alive_at_succession` | Alive at Time of Succession | Toggle | `true` | Yes | — |
| 5 | `person.degree` | Degree of Relationship | NumberInput (int) | auto by relationship | When editable | ≥ 1; see DEGREE_RANGE per relationship |
| 6 | `person.has_renounced` | Has Renounced Inheritance | Toggle | `false` | No | — |
| 7 | `person.is_unworthy` | Declared Unworthy | Toggle | `false` | No | — |

### Person Form — Conditional Fields

| Field Path | Label | Visibility Condition | Input Type | Default | Required | Validation |
|-----------|-------|---------------------|-----------|---------|----------|-----------|
| `person.line` | Line of Descent | `relationship ∈ {LegitimateParent, LegitimateAscendant}` | EnumSelect (`Paternal`/`Maternal`) | `null` | Yes (when visible) | Non-null |
| `person.filiation_proved` | Filiation Proved | `relationship = IllegitimateChild` | Toggle | `true` | Yes (when IC) | — |
| `person.filiation_proof_type` | Proof of Filiation | `relationship = IllegitimateChild && filiation_proved = true` | EnumSelect (6 FiliationProof variants) | `null` | Yes (when visible) | Non-null |
| `person.adoption` | Adoption Record | `relationship = AdoptedChild` | AdoptionSubForm | `null` | Yes (when AdoptedChild) | Non-null when AC; `adoption.md` |
| `person.blood_type` | Blood Type | `relationship ∈ {Sibling}` | EnumSelect (`Full`/`Half`) | `null` | Yes (when Sibling) | Non-null — silent exclusion if missing |
| `person.is_guilty_party_in_legal_separation` | Guilty Party in Legal Separation | `relationship = SurvivingSpouse && decedent.has_legal_separation = true` | Toggle | `false` | No | — |
| `person.unworthiness_condoned` | Unworthiness Condoned | `person.is_unworthy = true` | Toggle | `false` | No | — |
| `person.children` | Children (for Representation) | `!is_alive_at_succession && children_relevant[relationship]` | PersonPicker (multi-select) | `[]` | No | All IDs must exist in family_tree |

### Relationship Dropdown Options (Grouped)

```typescript
// Source: relationship-enum.md — 3 groups, 11 variants
const RELATIONSHIP_OPTIONS = [
  // Group: Compulsory Heirs (Art. 887)
  { value: "LegitimateChild",      label: "Legitimate Child",      group: "Compulsory Heirs" },
  { value: "LegitimatedChild",     label: "Legitimated Child",     group: "Compulsory Heirs" },
  { value: "AdoptedChild",         label: "Adopted Child",         group: "Compulsory Heirs" },
  { value: "IllegitimateChild",    label: "Illegitimate Child",    group: "Compulsory Heirs" },
  { value: "SurvivingSpouse",      label: "Surviving Spouse",      group: "Compulsory Heirs" },
  { value: "LegitimateParent",     label: "Legitimate Parent",     group: "Compulsory Heirs" },
  { value: "LegitimateAscendant",  label: "Legitimate Ascendant",  group: "Compulsory Heirs" },
  // Group: Collateral Relatives (Intestate Only)
  { value: "Sibling",              label: "Sibling",               group: "Collateral Relatives" },
  { value: "NephewNiece",          label: "Nephew / Niece",        group: "Collateral Relatives" },
  { value: "OtherCollateral",      label: "Other Collateral",      group: "Collateral Relatives" },
  // Group: Other
  { value: "Stranger",             label: "Stranger",              group: "Other" },
];
```

### Degree Defaults and Ranges

```typescript
// Source: conditional-visibility.md §3
const DEFAULT_DEGREE: Record<Relationship, number> = {
  LegitimateChild: 1, LegitimatedChild: 1, AdoptedChild: 1,
  IllegitimateChild: 1, SurvivingSpouse: 1, LegitimateParent: 1,
  LegitimateAscendant: 2, Sibling: 2, NephewNiece: 3,
  OtherCollateral: 4, Stranger: 0,
};

// null = non-editable (fixed)
const DEGREE_RANGE: Record<Relationship, [min: number, max: number] | null> = {
  LegitimateChild: [1, 5], LegitimatedChild: [1, 5],
  AdoptedChild: null,      // fixed at 1
  IllegitimateChild: [1, 5], SurvivingSpouse: null,
  LegitimateParent: null,  LegitimateAscendant: [2, 5],
  Sibling: null,           NephewNiece: null,
  OtherCollateral: [3, 5], Stranger: null,
};
```

### Adoption Sub-Form (when relationship = AdoptedChild)

| Order | Field Path | Label | Input Type | Default | Required | Validation |
|-------|-----------|-------|-----------|---------|----------|-----------|
| 1 | `adoption.decree_date` | Adoption Decree Date | DateInput | `null` | Yes | ≤ `decedent.date_of_death` |
| 2 | `adoption.regime` | Adoption Law | EnumSelect (`Ra8552`/`Ra11642`) | `"Ra8552"` | Yes | — |
| 3 | `adoption.adopter` | Adopter | Hidden, auto-set to `decedent.id` | `decedent.id` | Yes | Auto-filled |
| 4 | `adoption.adoptee` | Adoptee | Hidden, auto-set to `person.id` | `person.id` | Yes | Auto-filled |
| 5 | `adoption.is_stepparent_adoption` | Stepparent Adoption | Toggle | `false` | No | — |
| 6 | `adoption.biological_parent_spouse` | Biological Parent (Spouse) | PersonPicker | `null` | When `is_stepparent_adoption` | Must be SurvivingSpouse in family_tree |
| 7 | `adoption.is_rescinded` | Adoption Rescinded | Toggle | `false` | No | — |
| 8 | `adoption.rescission_date` | Rescission Date | DateInput | `null` | When `is_rescinded` | ≥ `decree_date`; ≤ `date_of_death` |

Rescission warning banner:
```
⚠ Rescinded adoption (RA 8552 Sec. 20): This adopted child will be EXCLUDED
  from inheritance.
```

### Filiation Sub-Fields (when relationship = IllegitimateChild)

```
☐ Filiation Proved (default: true)
   ├── true → Proof Type: [dropdown — 6 FiliationProof variants]
   └── false → ⚠ "Art. 887 ¶3: Illegitimate child without proven filiation
                   will be EXCLUDED from inheritance."
```

**FiliationProof options:**
```typescript
// Source: filiation-proof.md — 6 variants, Arts. 172-175 FC
const FILIATION_PROOF_OPTIONS = [
  { value: "BirthCertificate",            label: "Birth Certificate (Art. 172 ¶1)" },
  { value: "FinalJudgment",               label: "Final Judgment (Art. 172 ¶1)" },
  { value: "PublicDocumentAdmission",     label: "Public Document Admission (Art. 172 ¶2)" },
  { value: "PrivateHandwrittenAdmission", label: "Private Handwritten Admission (Art. 172 ¶2)" },
  { value: "OpenContinuousPossession",    label: "Open & Continuous Possession of Status (Art. 172 ¶3)" },
  { value: "OtherEvidence",              label: "Other Admissible Evidence (Art. 172 ¶4)" },
];
```

### Per-Person Info Badges (not blocking, no form action needed)

| Condition | Badge Text |
|-----------|-----------|
| `relationship ∈ {LegitimateParent, LegitimateAscendant}` AND LC-group alive+non-renounced exists | "Will be excluded — legitimate descendants take priority (Art. 887 ¶2)" |
| `relationship ∈ {Sibling, NephewNiece, OtherCollateral}` AND compulsory heir alive exists | "Will be excluded — collaterals only inherit when no compulsory heirs exist" |
| `is_guilty_party_in_legal_separation = true` | "Art. 1002: Excluded from intestate succession" |
| `is_unworthy = true && unworthiness_condoned = false` | "Art. 1032: Excluded unless condoned (Art. 1033)" |
| `relationship = SurvivingSpouse` AND count > 1 | "Only one surviving spouse allowed" (hard error) |

### Relationship Change Reset

```typescript
// Source: conditional-visibility.md §3
function resetPersonForRelationship(relationship: Relationship): Partial<Person> {
  return {
    degree: DEFAULT_DEGREE[relationship],
    line: null,
    filiation_proved: true,
    filiation_proof_type: null,
    adoption: null,
    blood_type: null,
    is_guilty_party_in_legal_separation: false,
  };
}
```

### Auto-Generated Person ID Convention

```typescript
// Source: shared-components.md §Auto-Generated IDs
const PERSON_ID_PREFIXES: Record<Relationship, string> = {
  LegitimateChild: "lc", LegitimatedChild: "ltc", AdoptedChild: "ac",
  IllegitimateChild: "ic", SurvivingSpouse: "sp", LegitimateParent: "lp",
  LegitimateAscendant: "la", Sibling: "sib", NephewNiece: "nn",
  OtherCollateral: "oc", Stranger: "str",
};
// Example: first LegitimateChild → "lc1", second → "lc2"
```

### Person Card Layout

```
┌──────────────────────────────────────────────────────────┐
│  [Relationship Badge]  [Name]                 [▼ expand] │
│                                              [🗑 remove] │
├──────────────────────────────────────────────────────────┤
│  (expanded)                                              │
│  Name: [_______________]  Relationship: [select ▼]      │
│  ☑ Alive at Succession    Degree: [1]                   │
│                                                          │
│  [Conditional sections — shown per relationship]        │
│                                                          │
│  ☐ Has Renounced           ☐ Declared Unworthy          │
│  (if unworthy) ☐ Unworthiness Condoned                  │
│                                                          │
│  (if dead + children_relevant)                          │
│  Children (for representation): [PersonPicker multi]    │
└──────────────────────────────────────────────────────────┘
```

### Hard Error Validations (superRefine at family_tree level)

```typescript
// 1. Duplicate person IDs — causes PANIC in step2_lines.rs:81
// 2. Max 1 SurvivingSpouse — engine models only one spouse
// 3. person.children[] IDs must all exist in family_tree — causes PANIC in step2_lines.rs:81
// 4. AdoptedChild must have non-null adoption record (step1_classify.rs:188)
```

---

## Step 4 — Will & Dispositions

**Component**: `WillStep.tsx`
**Visibility**: Only when `hasWill = true` (Step 1 toggle)
**Rust source**: `types.rs:362-368` (`Will` struct), `types.rs:371-443`
**Analysis refs**: `will.md`, `institution-of-heir.md`, `legacy.md`, `devise.md`, `disinheritance.md`, `condition-substitute.md`, `conditional-visibility.md §6`

### Top-Level Will Fields

| Order | Field Path | Label | Input Type | Default | Required | Validation |
|-------|-----------|-------|-----------|---------|----------|-----------|
| 1 | `will.date_executed` | Date Will Was Executed | DateInput | `null` | Yes | ≤ `decedent.date_of_death` (Art. 838) |

### Sub-Tabs

The Will step uses 4 sub-tabs (all always visible within Step 4):

```
[Institutions]  [Legacies]  [Devises]  [Disinheritances]
```

---

### Sub-Tab: Institutions

Array: `will.institutions[]` — InstitutionOfHeir repeater

**Institution card — always visible fields:**

| Order | Field Path | Label | Input Type | Default | Required |
|-------|-----------|-------|-----------|---------|----------|
| 1 | `institution.id` | — | Hidden, auto-generated | `"i1"`, `"i2"`, ... | Yes |
| 2 | `institution.heir.person_id` | Heir | PersonPicker (from family_tree, or null=stranger) | `null` | No |
| 3 | `institution.heir.name` | Heir Name | TextInput (editable when person_id=null, else read-only) | `""` | Yes |
| 4 | `institution.heir.is_collective` | Collective Gift | Toggle | `false` | No |
| 5 | `institution.heir.class_designation` | Class Description | TextInput | `null` | When `is_collective` | Non-empty |
| 6 | `institution.is_residuary` | Residuary Heir (receives leftover) | Toggle | `false` | No |

**Institution card — conditional: share (hidden when `is_residuary = true`):**

| Order | Field Path | Label | Input Type | Default | Required |
|-------|-----------|-------|-----------|---------|----------|
| 7 | `institution.share` (type selector) | Share Type | EnumSelect (6 ShareSpec variants) | `"EntireFreePort"` | When `!is_residuary` |
| 7a | `institution.share` (Fraction value) | Fraction | FractionInput (`"n/d"` string) | `null` | When share type = `"Fraction"` |

**ShareSpec options:**
```typescript
// Source: institution-of-heir.md — 6 variants
// Unit variants serialize as plain strings; Fraction → {"Fraction":"n/d"}
const SHARE_SPEC_OPTIONS = [
  { value: "EntireFreePort",  label: "Entire Free Portion" },
  { value: "EntireEstate",    label: "Entire Estate" },
  { value: "Residuary",       label: "Residuary (leftover)" },
  { value: "EqualWithOthers", label: "Equal Share with Other Heirs" },
  { value: "Fraction",        label: "Specific Fraction (e.g. 1/3)" },
  // Note: "Residuary" variant vs is_residuary FLAG — use is_residuary FLAG (step7:987)
];
```

**Conditions repeater (collapsible, default empty):**

| Field | Label | Input Type | Default |
|-------|-------|-----------|---------|
| `condition.condition_type` | Type | EnumSelect (`Suspensive`/`Resolutory`/`Impossible`) | `"Suspensive"` |
| `condition.description` | Description | TextArea | `""` |
| `condition.status` | Status | EnumSelect (`Pending`/`Fulfilled`/`Failed`/`Waived`) | `"Pending"` |

**Substitutes repeater (collapsible, default empty):**

| Field | Label | Input Type | Default |
|-------|-------|-----------|---------|
| `substitute.substitution_type` | Type | EnumSelect (`Simple`/`Reciprocal`/`Fideicommissary`) | `"Simple"` |
| `substitute.substitute_heir` | Substitute Heir | HeirReferenceForm (requirePersonId=true) | — |
| `substitute.triggers` | Triggers | Multi-select checkboxes | `["Predecease","Renunciation","Incapacity"]` |

Pre-submission preterition warning (Layer 3 validation):
```
⚠ Art. 854: {N} compulsory heir(s) are totally omitted from the will.
  All institutions will be ANNULLED and distribution will follow intestate rules.
  Tip: Adding any legacy, devise, or disinheritance clause prevents preterition.
```

---

### Sub-Tab: Legacies

Array: `will.legacies[]` — Legacy repeater

| Order | Field Path | Label | Input Type | Default | Required |
|-------|-----------|-------|-----------|---------|----------|
| 1 | `legacy.id` | — | Hidden, auto-generated | `"l1"`, `"l2"`, ... | Yes |
| 2 | `legacy.legatee` | Legatee | HeirReferenceForm (allowStranger=true) | — | Yes |
| 3 | `legacy.property` (type selector) | Legacy Type | EnumSelect (3 LegacySpec variants) | `"FixedAmount"` | Yes |

**Variant-specific fields:**

| Variant | Additional Fields | Input Type | Serialization |
|---------|-----------------|-----------|--------------|
| `FixedAmount` | `property.FixedAmount` — Amount | MoneyInput | `{"FixedAmount":{"centavos":N}}` |
| `SpecificAsset` | `property.SpecificAsset` — Asset Identifier | TextInput | `{"SpecificAsset":"id"}` |
| `GenericClass` | `property.GenericClass[0]` — Description | TextInput | `{"GenericClass":["desc",{"centavos":N}]}` |
| `GenericClass` | `property.GenericClass[1]` — Estimated Value | MoneyInput | (same 2-tuple) |

| Field | Label | Input Type | Default | Required |
|-------|-------|-----------|---------|----------|
| `legacy.is_preferred` | Preferred Legacy (Art. 911) | Toggle | `false` | No |
| `legacy.conditions[]` | Conditions | ConditionForm repeater | `[]` | No |
| `legacy.substitutes[]` | Substitutes | SubstituteForm repeater | `[]` | No |

SpecificAsset warning badge:
```
ℹ The engine cannot compute a monetary value for specific assets.
  The legacy will be noted but not included in the peso distribution.
  An independent appraisal is required.
```

---

### Sub-Tab: Devises

Array: `will.devises[]` — Devise repeater

| Order | Field Path | Label | Input Type | Default | Required |
|-------|-----------|-------|-----------|---------|----------|
| 1 | `devise.id` | — | Hidden, auto-generated | `"dev1"`, `"dev2"`, ... | Yes |
| 2 | `devise.devisee` | Devisee | HeirReferenceForm (allowStranger=true) | — | Yes |
| 3 | `devise.property` (type selector) | Devise Type | EnumSelect (2 DeviseSpec variants) | `"SpecificProperty"` | Yes |

**Variant-specific fields:**

| Variant | Additional Fields | Input Type | Serialization |
|---------|-----------------|-----------|--------------|
| `SpecificProperty` | `property.SpecificProperty` — Property Identifier | TextInput | `{"SpecificProperty":"prop-id"}` |
| `FractionalInterest` | `property.FractionalInterest[0]` — Property Identifier | TextInput | `{"FractionalInterest":["prop-id","n/d"]}` |
| `FractionalInterest` | `property.FractionalInterest[1]` — Fractional Share | FractionInput | (same 2-tuple) |

| Field | Label | Input Type | Default | Required |
|-------|-------|-----------|---------|----------|
| `devise.is_preferred` | Preferred Devise | Toggle | `false` | No |
| `devise.conditions[]` | Conditions | ConditionForm repeater | `[]` | No |
| `devise.substitutes[]` | Substitutes | SubstituteForm repeater | `[]` | No |

Info banner (all devises):
```
ℹ The engine currently assigns no monetary value to devises.
  Devises are recorded but do not affect the peso distribution computation.
```

---

### Sub-Tab: Disinheritances

Array: `will.disinheritances[]` — Disinheritance repeater

| Order | Field Path | Label | Input Type | Default | Required | Validation |
|-------|-----------|-------|-----------|---------|----------|-----------|
| 1 | `disinheritance.heir_reference.person_id` | Heir to Disinherit | PersonPicker (filtered: compulsory heirs only) | `null` | Yes | Must be compulsory heir |
| 2 | `disinheritance.cause_code` | Cause of Disinheritance | EnumSelect (filtered by heir relationship) | `null` | Yes | Must match heir's relationship group |
| 3 | `disinheritance.cause_specified_in_will` | Cause Stated in Will | Toggle | `true` | Yes | — |
| 4 | `disinheritance.cause_proven` | Cause Proven | Toggle | `true` | Yes | — |
| 5 | `disinheritance.reconciliation_occurred` | Reconciliation Occurred | Toggle | `false` | No | — |

**Real-time validity indicator (ValidityIndicator component):**
```
ValidityIndicator:
  isValid = cause_specified_in_will && cause_proven && !reconciliation_occurred
  validLabel: "Valid Disinheritance"
  invalidLabel: "Invalid — Heir Will Be Reinstated"
  reasons: [
    !cause_specified → "Art. 916: Cause not specified in will",
    !cause_proven → "Art. 917: Cause not proven",
    reconciliation → "Art. 922: Reconciliation occurred"
  ]
```

**DisinheritanceCause options (grouped by Article):**
```typescript
// Source: disinheritance.md — 22 causes, 3 groups
// Child causes (Art. 919): 8 codes
// Parent causes (Art. 920): 8 codes
// Spouse causes (Art. 921): 6 codes
// Filter shown options by getValidCauseCodes(heir.relationship)
```

---

## Step 5 — Donations

**Component**: `DonationsStep.tsx`
**Rust source**: `types.rs:465-522` (`Donation` struct)
**Analysis refs**: `donation.md`, `conditional-visibility.md §7`

### Donation Card — Always Visible Fields

| Order | Field Path | Label | Input Type | Default | Required | Validation |
|-------|-----------|-------|-----------|---------|----------|-----------|
| 1 | `donation.id` | — | Hidden, auto-generated | `"don1"`, `"don2"`, ... | Yes | Unique |
| 2 | `donation.recipient_is_stranger` | Recipient is Not in Family Tree | Toggle | `false` | Yes | — |
| 3 | `donation.value_at_time_of_donation` | Value at Time of Donation | MoneyInput | — | Yes | > 0 |
| 4 | `donation.date` | Donation Date | DateInput | — | Yes | ≤ `decedent.date_of_death` |
| 5 | `donation.description` | Description | TextInput | `""` | Yes | Non-empty |

### Donation Card — Conditional on `!recipient_is_stranger`

| Field | Label | Input Type | Default | Required |
|-------|-------|-----------|---------|----------|
| `donation.recipient_heir_id` | Recipient | PersonPicker (from family_tree) | `null` | Yes (when !stranger) |

**Exemption flags (all visible when `!recipient_is_stranger`, all default `false`):**

| Field | Label | Note |
|-------|-------|------|
| `is_expressly_exempt` | Expressly Exempt (donor declared) | — |
| `is_support_education_medical` | Support, Education, or Medical | — |
| `is_customary_gift` | Customary Gift | — |
| `is_professional_expense` | Professional/Business Expense | → shows sub-fields |
| `is_joint_from_both_parents` | Joint Gift from Both Parents | — |
| `is_to_child_spouse_only` | Gift to Child's Spouse Only | — |
| `is_joint_to_child_and_spouse` | Joint Gift to Child and Spouse | — |
| `is_wedding_gift` | Wedding Gift | — |
| `is_debt_payment_for_child` | Debt Payment for Child | — |
| `is_election_expense` | Election Expense | — |
| `is_fine_payment` | Fine Payment | — |

**Conditional on `is_professional_expense = true`:**

| Field | Label | Input Type | Default | Required |
|-------|-------|-----------|---------|----------|
| `professional_expense_parent_required` | Parent Co-Signature Required | Toggle | `false` | No |
| `professional_expense_imputed_savings` | Imputed Savings Amount | MoneyInput | `null` | When `parent_required = true` |

### Stranger Toggle Reset

When `recipient_is_stranger` toggles to `true`:
- Set `recipient_heir_id = null`
- Reset all 11 exemption flags to `false`
- Set `professional_expense_imputed_savings = null`
- Set `professional_expense_parent_required = false`

Info banner when `recipient_is_stranger = true`:
```
ℹ Stranger donations are always collatable (Art. 909 ¶2).
  Exemption flags do not apply to donations to non-heirs.
```

### Cross-Step Note

The `recipient_heir_id` PersonPicker is populated from `family_tree` (Step 3).
When a person is removed from Step 3, validate that no donation references their ID.

---

## Step 6 — Review & Config

**Component**: `ReviewStep.tsx`
**Rust source**: `types.rs:453-460` (`EngineConfig` struct)
**Analysis refs**: `engine-config.md`, `engine-input-root.md`, `conditional-visibility.md §8`

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  REVIEW & RUN                                           │
│                                                         │
│  [Read-only summary sections, one per step]             │
│  ├── Estate: ₱{amount} | {Intestate/Testate}           │
│  ├── Decedent: {name} | Died {date} | {married/single} │
│  ├── Family Tree: {N} persons                           │
│  ├── Will: {N institutions, N legacies, N devises}     │
│  │   (shown only when hasWill)                         │
│  ├── Donations: {N donations}                           │
│  └── [Predicted Scenario Badge: {T1/I2/...}]           │
│                                                         │
│  [Validation errors listed inline, by step]            │
│  [Pre-submission warnings (dismissable)]                │
│                                                         │
│  ▼ Advanced Settings (collapsed by default)             │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Max Pipeline Restarts: [10]  (range 1-100)      │  │
│  │  ☐ Retroactive RA 11642 (experimental)           │  │
│  │    (Note: RA 8552 adoptees present — this flag    │  │
│  │     may affect their classification in future    │  │
│  │     engine versions)                              │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  [Compute Distribution]   (disabled until no hard errors)│
└─────────────────────────────────────────────────────────┘
```

### Config Fields

| Field Path | Label | Input Type | Default | Required | Validation |
|-----------|-------|-----------|---------|----------|-----------|
| `config.max_pipeline_restarts` | Max Pipeline Restarts | NumberInput (int) | `10` | Yes | 1 ≤ N ≤ 100 |
| `config.retroactive_ra_11642` | Retroactive RA 11642 | Toggle | `false` | No | — |

### Pre-Submission Warnings (Layer 3)

The following warnings are computed and displayed before the user clicks "Compute Distribution". They are **dismissable** but not blocking:

| # | Warning Condition | Severity | Message |
|---|------------------|----------|---------|
| 1 | IC with `filiation_proved = false` | Warning | "Art. 887 ¶3: IC will be excluded" |
| 2 | Rescinded adoption | Warning | "RA 8552 Sec. 20: AC excluded" |
| 3 | Unworthy + not condoned | Warning | "Art. 1032: Heir excluded" |
| 4 | Spouse guilty in legal sep | Warning | "Art. 1002: Spouse excluded" |
| 5 | Invalid disinheritance | Warning | "Art. 918: Heir reinstated" |
| 6 | Preterition detected | Warning | "Art. 854: All institutions annulled" |
| 7 | Inofficiousness risk | Info | "Legacies may exceed free portion — Art. 911 reduction may apply" |
| 8 | LC-group present + ascendants | Info | "Ascendants excluded by descendants" |
| 9 | Compulsory heirs + collaterals | Info | "Collaterals excluded by compulsory heirs" |
| 10 | Empty will | Info | "Will has no dispositions" |
| 11 | Spouse without married decedent | Warning | "Inconsistency: spouse in tree but decedent unmarried" |
| 12 | Empty family tree | Info | "No heirs — estate will escheat to the State (I15)" |
| 13 | All heirs marked deceased | Info | "All heirs predeceased — pipeline restart likely" |

### Predicted Scenario Badge

Computed from `predictScenario()` (see `scenario-field-mapping.md §5`). Shown as a
badge with description above the Submit button:

```
Predicted: [I4 — LC + IC + Spouse (intestate)]
Note: Final scenario may differ if Mixed succession or Preterition is detected.
```

---

## Shared State Requirements

All wizard steps share a global `EngineInput` state. Cross-step dependencies:

| Source Step | Data | Consumer Steps |
|------------|------|---------------|
| Estate (1) | `hasWill` | Step 4 visibility; Step 6 summary |
| Decedent (2) | `decedent.date_of_death` | DateInput max on Steps 4, 5 |
| Decedent (2) | `decedent.has_legal_separation` | `is_guilty_party` visibility in Step 3 |
| Decedent (2) | `decedent.id` | Adoption.adopter auto-fill in Step 3 |
| Family Tree (3) | `family_tree` persons | PersonPicker in Steps 4, 5 |
| Family Tree (3) | Person relationships | Disinheritance cause filter in Step 4 |
| Family Tree (3) | Person IDs | ID uniqueness validation in Steps 4, 5 |

**Recommended state management:** React Context + useReducer, or Zustand store,
with the full `EngineInput` as the single source of truth plus `WizardMeta.hasWill`.

---

## Serialization Summary

When the wizard serializes `EngineInput` for the engine:

| Wizard State | EngineInput Field | Serialization Rule |
|-------------|------------------|-------------------|
| `hasWill = false` | `will` | `null` |
| `hasWill = true` | `will` | `{ date_executed, institutions, legacies, devises, disinheritances }` |
| MoneyInput (pesos) | `*.centavos` | `Math.round(pesos * 100)` as `number` |
| FractionInput `"n/d"` | `share.Fraction` | `{"Fraction": "n/d"}` |
| FractionInput `"n/d"` | `FractionalInterest[1]` | `"n/d"` (bare string in array) |
| LegacySpec GenericClass | `property` | `["description", {"centavos": N}]` (2-tuple array) |
| ShareSpec unit variants | `share` | Plain string: `"EntireFreePort"`, `"Residuary"`, etc. |
| Dates | all date fields | ISO-8601 string `"YYYY-MM-DD"` |
| Person.children[] | `children` | Array of person ID strings |
