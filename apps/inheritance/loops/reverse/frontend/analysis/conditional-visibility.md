# Conditional Visibility — Cross-Cutting Analysis

> Wave 2 aspect: Maps every show/hide rule across the wizard, from top-level step gating
> down to individual field cascades. Produces implementation-ready TypeScript predicates.

## 1. Top-Level Step Gating

The wizard has 6 logical steps. Most are always visible; one is conditionally shown.

| Step | Name | Visibility Rule |
|------|------|-----------------|
| 1 | Estate Details | Always visible |
| 2 | Decedent Details | Always visible |
| 3 | Family Tree | Always visible |
| 4 | Will & Dispositions | **Visible only when `hasWill === true`** (user toggle) |
| 5 | Donations | Always visible (skippable — empty `[]` is valid) |
| 6 | Review & Config | Always visible (advanced settings collapsed by default) |

**Evidence:** `pipeline.rs:76-93` — Step 6 validation only runs when `input.will.is_some()`.
All 18 intestate test cases have `will: null`; the 2 testate cases (06, 14) have a Will object.

```typescript
// Step-level visibility predicate
// Source: pipeline.rs:76 — will gate
function isWillStepVisible(hasWill: boolean): boolean {
  return hasWill;
}
```

---

## 2. Decedent Step (Step 2) — Marriage Cascade

The decedent step has a 3-level deep conditional chain rooted in `is_married`.

### Visibility Tree

```
is_married === true
├── date_of_marriage          (DateInput, required)
├── years_of_cohabitation     (NumberInput, default 0)
├── has_legal_separation      (Toggle, default false)
└── marriage_solemnized_in_articulo_mortis  (Toggle, default false)
    └── was_ill_at_marriage === true
        └── illness_caused_death  (Toggle, default false)
```

**When `is_married === false`**, all 6 marriage-gated fields are hidden and reset to defaults.

### Articulo Mortis Warning

When ALL four conditions are true AND `years_of_cohabitation < 5`, display a warning:
> "Articulo mortis marriage detected — surviving spouse's legitime will be reduced under Art. 900."

**Source:** `step1_classify.rs:226-231` — `is_articulo_mortis()` checks all four fields.

### Implementation

```typescript
// Source: step1_classify.rs:226-231, decedent.md analysis
interface DecedentVisibility {
  date_of_marriage: boolean;
  years_of_cohabitation: boolean;
  has_legal_separation: boolean;
  marriage_solemnized_in_articulo_mortis: boolean;
  was_ill_at_marriage: boolean;
  illness_caused_death: boolean;
  articuloMortisWarning: boolean;
}

function getDecedentVisibility(decedent: {
  is_married: boolean;
  marriage_solemnized_in_articulo_mortis: boolean;
  was_ill_at_marriage: boolean;
  illness_caused_death: boolean;
  years_of_cohabitation: number;
}): DecedentVisibility {
  const married = decedent.is_married;
  const articuloMortis = married && decedent.marriage_solemnized_in_articulo_mortis;

  return {
    date_of_marriage: married,
    years_of_cohabitation: married,
    has_legal_separation: married,
    marriage_solemnized_in_articulo_mortis: married,
    was_ill_at_marriage: articuloMortis,
    illness_caused_death: articuloMortis && decedent.was_ill_at_marriage,
    articuloMortisWarning:
      articuloMortis &&
      decedent.was_ill_at_marriage &&
      decedent.illness_caused_death &&
      decedent.years_of_cohabitation < 5,
  };
}
```

### Reset Logic

When a parent toggle is turned OFF, all children reset to defaults:

```typescript
// Source: decedent.md — cascading defaults
const DECEDENT_FIELD_DEFAULTS = {
  date_of_marriage: null,       // reset when is_married → false
  years_of_cohabitation: 0,     // reset when is_married → false
  has_legal_separation: false,  // reset when is_married → false
  marriage_solemnized_in_articulo_mortis: false,  // reset when is_married → false
  was_ill_at_marriage: false,   // reset when articuloMortis toggle → false
  illness_caused_death: false,  // reset when was_ill_at_marriage → false
} as const;
```

---

## 3. Family Tree / Person Step (Step 3) — Relationship-Driven Visibility

The `relationship_to_decedent` enum is the **master driver** of per-person field visibility.
This is the most complex conditional visibility subsystem in the wizard.

### Relationship → Field Effects Map

```typescript
// Source: step1_classify.rs:43-46 (stranger exclusion),
//         step1_classify.rs:176-205 (eligibility gates),
//         step2_lines.rs:68-72 (line assignment),
//         person.md, relationship-enum.md, filiation-proof.md, blood-type.md, adoption.md
type Relationship =
  | "LegitimateChild"
  | "LegitimatedChild"
  | "AdoptedChild"
  | "IllegitimateChild"
  | "SurvivingSpouse"
  | "LegitimateParent"
  | "LegitimateAscendant"
  | "Sibling"
  | "NephewNiece"
  | "OtherCollateral"
  | "Stranger";

interface PersonFieldVisibility {
  line: boolean;                              // Paternal/Maternal selector
  filiation_proved: boolean;                  // IC eligibility toggle
  filiation_proof_type: boolean;              // IC proof type dropdown
  adoption: boolean;                          // AdoptedChild sub-form
  blood_type: boolean;                        // Sibling Full/Half selector
  is_guilty_party_in_legal_separation: boolean; // Spouse + legal sep
  degree_editable: boolean;                   // Can user edit degree?
  children_relevant: boolean;                 // Representation sub-form
}

const RELATIONSHIP_FIELD_EFFECTS: Record<Relationship, PersonFieldVisibility> = {
  LegitimateChild: {
    line: false,
    filiation_proved: false,
    filiation_proof_type: false,
    adoption: false,
    blood_type: false,
    is_guilty_party_in_legal_separation: false,
    degree_editable: true,      // 1 default, 2+ for grandchildren
    children_relevant: true,    // representation possible
  },
  LegitimatedChild: {
    line: false,
    filiation_proved: false,
    filiation_proof_type: false,
    adoption: false,
    blood_type: false,
    is_guilty_party_in_legal_separation: false,
    degree_editable: true,
    children_relevant: true,
  },
  AdoptedChild: {
    line: false,
    filiation_proved: false,
    filiation_proof_type: false,
    adoption: true,             // SHOW adoption sub-form
    blood_type: false,
    is_guilty_party_in_legal_separation: false,
    degree_editable: false,     // always 1
    children_relevant: true,
  },
  IllegitimateChild: {
    line: false,
    filiation_proved: true,     // SHOW filiation toggle
    filiation_proof_type: true, // SHOW proof type (gated on filiation_proved)
    adoption: false,
    blood_type: false,
    is_guilty_party_in_legal_separation: false,
    degree_editable: true,
    children_relevant: true,
  },
  SurvivingSpouse: {
    line: false,
    filiation_proved: false,
    filiation_proof_type: false,
    adoption: false,
    blood_type: false,
    is_guilty_party_in_legal_separation: true, // SHOW (gated on decedent.has_legal_separation)
    degree_editable: false,     // always 1
    children_relevant: false,   // spouse has no representation
  },
  LegitimateParent: {
    line: true,                 // SHOW Paternal/Maternal selector
    filiation_proved: false,
    filiation_proof_type: false,
    adoption: false,
    blood_type: false,
    is_guilty_party_in_legal_separation: false,
    degree_editable: false,     // always 1
    children_relevant: false,
  },
  LegitimateAscendant: {
    line: true,                 // SHOW Paternal/Maternal selector
    filiation_proved: false,
    filiation_proof_type: false,
    adoption: false,
    blood_type: false,
    is_guilty_party_in_legal_separation: false,
    degree_editable: true,      // 2+ (grandparents, great-grandparents)
    children_relevant: false,
  },
  Sibling: {
    line: false,
    filiation_proved: false,
    filiation_proof_type: false,
    adoption: false,
    blood_type: true,           // SHOW Full/Half selector
    is_guilty_party_in_legal_separation: false,
    degree_editable: false,     // always 2
    children_relevant: true,    // nephews/nieces represent
  },
  NephewNiece: {
    line: false,
    filiation_proved: false,
    filiation_proof_type: false,
    adoption: false,
    blood_type: false,
    is_guilty_party_in_legal_separation: false,
    degree_editable: false,     // always 3
    children_relevant: false,
  },
  OtherCollateral: {
    line: false,
    filiation_proved: false,
    filiation_proof_type: false,
    adoption: false,
    blood_type: false,
    is_guilty_party_in_legal_separation: false,
    degree_editable: true,      // 3-5
    children_relevant: false,
  },
  Stranger: {
    line: false,
    filiation_proved: false,
    filiation_proof_type: false,
    adoption: false,
    blood_type: false,
    is_guilty_party_in_legal_separation: false,
    degree_editable: false,     // always 0
    children_relevant: false,
  },
};
```

### Per-Person Computed Visibility

```typescript
// Source: person.md, relationship-enum.md — full per-person visibility computation
interface FullPersonVisibility extends PersonFieldVisibility {
  is_guilty_party_visible: boolean;     // compound: relationship + decedent state
  filiation_proof_type_visible: boolean; // compound: relationship + filiation_proved
  unworthiness_condoned: boolean;       // gated on is_unworthy
  children_prompt: boolean;             // gated on !is_alive OR representation trigger
}

function getPersonVisibility(
  person: { relationship_to_decedent: Relationship; is_alive_at_succession: boolean;
            filiation_proved: boolean; is_unworthy: boolean },
  decedent: { has_legal_separation: boolean },
): FullPersonVisibility {
  const base = RELATIONSHIP_FIELD_EFFECTS[person.relationship_to_decedent];
  return {
    ...base,
    // is_guilty_party: only when relationship=SurvivingSpouse AND decedent has legal separation
    is_guilty_party_visible:
      base.is_guilty_party_in_legal_separation && decedent.has_legal_separation,
    // filiation proof type: only when filiation section is visible AND proved=true
    filiation_proof_type_visible:
      base.filiation_proof_type && person.filiation_proved,
    // unworthiness condoned: only when is_unworthy=true
    unworthiness_condoned: person.is_unworthy,
    // children sub-form: relevant when dead (representation) or representation possible
    children_prompt: base.children_relevant && !person.is_alive_at_succession,
  };
}
```

### Default Degree Per Relationship

```typescript
// Source: relationship-enum.md — degree defaults
const DEFAULT_DEGREE: Record<Relationship, number> = {
  LegitimateChild: 1,
  LegitimatedChild: 1,
  AdoptedChild: 1,
  IllegitimateChild: 1,
  SurvivingSpouse: 1,
  LegitimateParent: 1,
  LegitimateAscendant: 2,
  Sibling: 2,
  NephewNiece: 3,
  OtherCollateral: 4,
  Stranger: 0,
};

const DEGREE_RANGE: Record<Relationship, [min: number, max: number] | null> = {
  LegitimateChild: [1, 5],
  LegitimatedChild: [1, 5],
  AdoptedChild: null,          // fixed at 1
  IllegitimateChild: [1, 5],
  SurvivingSpouse: null,       // fixed at 1
  LegitimateParent: null,      // fixed at 1
  LegitimateAscendant: [2, 5],
  Sibling: null,               // fixed at 2
  NephewNiece: null,           // fixed at 3
  OtherCollateral: [3, 5],
  Stranger: null,              // fixed at 0
};
```

### Relationship Change Reset

When `relationship_to_decedent` changes, all relationship-conditional fields must reset:

```typescript
// Source: person.md — reset on relationship change
function resetPersonForRelationship(relationship: Relationship): Partial<Person> {
  return {
    degree: DEFAULT_DEGREE[relationship],
    line: null,                              // cleared unless LegitimateParent/LegitimateAscendant
    filiation_proved: true,                  // re-default (only visible for IC)
    filiation_proof_type: null,              // cleared unless IC
    adoption: null,                          // cleared unless AdoptedChild
    blood_type: null,                        // cleared unless Sibling
    is_guilty_party_in_legal_separation: false, // cleared unless SurvivingSpouse
  };
}
```

---

## 4. Adoption Sub-Form (within Person, Step 3)

Visible only when `relationship_to_decedent === "AdoptedChild"`.

### Internal Visibility

```
adoption sub-form visible (relationship === "AdoptedChild")
├── decree_date              (DateInput, required)
├── regime                   (Select: Ra8552/Ra11642, default Ra8552)
├── adopter                  (auto-filled: decedent.id, hidden)
├── adoptee                  (auto-filled: person.id, hidden)
├── is_stepparent_adoption   (Toggle, default false)
│   └── biological_parent_spouse  (PersonPicker, visible when true)
└── is_rescinded             (Toggle, default false)
    └── rescission_date      (DateInput, visible & required when true)
        └── Warning: "This person will be excluded from inheritance"
```

**Source:** `adoption.md`, `step1_classify.rs:182-191`

```typescript
// Source: adoption.md — adoption sub-form visibility
interface AdoptionVisibility {
  biological_parent_spouse: boolean;
  rescission_date: boolean;
  rescissionWarning: boolean;
}

function getAdoptionVisibility(adoption: {
  is_stepparent_adoption: boolean;
  is_rescinded: boolean;
}): AdoptionVisibility {
  return {
    biological_parent_spouse: adoption.is_stepparent_adoption,
    rescission_date: adoption.is_rescinded,
    rescissionWarning: adoption.is_rescinded,
  };
}
```

---

## 5. Filiation Sub-Fields (within Person, Step 3)

Visible only when `relationship_to_decedent === "IllegitimateChild"`.

```
relationship === "IllegitimateChild"
├── filiation_proved          (Toggle, default true)
│   ├── true → filiation_proof_type  (Select: 6 variants, required)
│   └── false → Warning: "This illegitimate child will be INELIGIBLE to inherit"
```

**Source:** `filiation-proof.md`, `step1_classify.rs:178`

```typescript
// Source: filiation-proof.md — filiation visibility
interface FiliationVisibility {
  filiation_proved: boolean;      // visible when IC
  filiation_proof_type: boolean;  // visible when IC + proved=true
  ineligibleWarning: boolean;     // shown when IC + proved=false
}

function getFiliationVisibility(
  relationship: Relationship,
  filiationProved: boolean,
): FiliationVisibility {
  const isIC = relationship === "IllegitimateChild";
  return {
    filiation_proved: isIC,
    filiation_proof_type: isIC && filiationProved,
    ineligibleWarning: isIC && !filiationProved,
  };
}
```

---

## 6. Will Step (Step 4) — Internal Visibility

The entire step is gated on `hasWill`. Within the step, four repeater sub-forms are always
available (each can be empty):

| Sub-Form | Always Visible (within Step 4) | Internal Conditions |
|----------|-------------------------------|---------------------|
| `date_executed` | Yes | Cross-field: must be ≤ `decedent.date_of_death` |
| `institutions[]` | Yes (repeater) | `share` hidden when `is_residuary === true` |
| `legacies[]` | Yes (repeater) | Variant-specific fields per `LegacySpec` |
| `devises[]` | Yes (repeater) | Variant-specific fields per `DeviseSpec` |
| `disinheritances[]` | Yes (repeater) | `cause_code` filtered by heir relationship |

### Institution of Heir — Internal Visibility

```
institution entry
├── heir (HeirReference)
│   ├── person_id             (PersonPicker from family_tree, or null for stranger)
│   ├── name                  (read-only when person_id set; editable when null)
│   ├── is_collective         (Toggle, default false)
│   │   └── class_designation (TextInput, visible when is_collective=true)
│   └── (person_id fills name automatically)
├── share (ShareSpec)          ← HIDDEN when is_residuary=true
│   ├── type selector          (Select: 6 variants)
│   └── Fraction → numerator + denominator  (NumberInputs, visible when "Fraction" selected)
├── is_residuary              (Toggle, default false)
├── conditions[]              (Collapsible repeater)
└── substitutes[]             (Collapsible repeater)
```

**Source:** `institution-of-heir.md`, `step6_validation.rs:298`

```typescript
// Source: institution-of-heir.md — institution visibility
interface InstitutionVisibility {
  share: boolean;                    // hidden when is_residuary
  share_fraction_inputs: boolean;    // visible when share type = "Fraction"
  class_designation: boolean;        // visible when heir.is_collective
  heir_name_editable: boolean;       // editable when person_id is null (stranger)
}

function getInstitutionVisibility(institution: {
  is_residuary: boolean;
  share_type: string;
  heir: { person_id: string | null; is_collective: boolean };
}): InstitutionVisibility {
  return {
    share: !institution.is_residuary,
    share_fraction_inputs: !institution.is_residuary && institution.share_type === "Fraction",
    class_designation: institution.heir.is_collective,
    heir_name_editable: institution.heir.person_id === null,
  };
}
```

### Legacy — Variant-Specific Fields

```
legacy entry
├── heir (HeirReference)           (same as institution)
├── property (LegacySpec selector)
│   ├── FixedAmount   → MoneyInput (pesos, converted to centavos)
│   ├── SpecificAsset → TextInput  (asset identifier)
│   └── GenericClass  → TextInput  (description) + MoneyInput (estimated value)
├── is_preferred                   (Toggle, default false)
├── conditions[]                   (Collapsible repeater)
└── substitutes[]                  (Collapsible repeater)
```

**Source:** `legacy.md`

```typescript
// Source: legacy.md — legacy variant visibility
type LegacySpecType = "FixedAmount" | "SpecificAsset" | "GenericClass";

interface LegacyVisibility {
  money_input: boolean;          // FixedAmount or GenericClass
  asset_text_input: boolean;     // SpecificAsset
  description_input: boolean;    // GenericClass
  estimated_value_input: boolean; // GenericClass
}

function getLegacyVisibility(specType: LegacySpecType): LegacyVisibility {
  return {
    money_input: specType === "FixedAmount",
    asset_text_input: specType === "SpecificAsset",
    description_input: specType === "GenericClass",
    estimated_value_input: specType === "GenericClass",
  };
}
```

### Devise — Variant-Specific Fields

```
devise entry
├── heir (HeirReference)           (same as institution)
├── property (DeviseSpec selector)
│   ├── SpecificProperty     → TextInput (property identifier)
│   └── FractionalInterest   → TextInput (property id) + FractionInput (numer/denom)
├── is_preferred                   (Toggle, default false)
├── conditions[]                   (Collapsible repeater)
└── substitutes[]                  (Collapsible repeater)
```

**Source:** `devise.md`

```typescript
// Source: devise.md — devise variant visibility
type DeviseSpecType = "SpecificProperty" | "FractionalInterest";

interface DeviseVisibility {
  property_text_input: boolean;    // both variants
  fraction_input: boolean;         // FractionalInterest only
}

function getDeviseVisibility(specType: DeviseSpecType): DeviseVisibility {
  return {
    property_text_input: true,     // always shown for both variants
    fraction_input: specType === "FractionalInterest",
  };
}
```

### Disinheritance — Relationship-Filtered Cause Codes

```
disinheritance entry
├── heir_reference.person_id       (PersonPicker, filtered to compulsory heirs only)
├── cause_code                     (Select, FILTERED by heir's relationship)
├── cause_specified_in_will        (Toggle, default true)
├── cause_proven                   (Toggle, default true)
└── reconciliation_occurred        (Toggle, default false)
```

**Source:** `disinheritance.md`, `step6_validation.rs:370-435`

```typescript
// Source: disinheritance.md — cause code filtering by relationship
// Art. 919: children, Art. 920: parents/ascendants, Art. 921: spouse
type CauseGroup = "Child" | "Parent" | "Spouse" | "None";

const RELATIONSHIP_TO_CAUSE_GROUP: Record<Relationship, CauseGroup> = {
  LegitimateChild: "Child",
  LegitimatedChild: "Child",
  AdoptedChild: "Child",
  IllegitimateChild: "Child",
  SurvivingSpouse: "Spouse",
  LegitimateParent: "Parent",
  LegitimateAscendant: "Parent",
  Sibling: "None",              // cannot be disinherited
  NephewNiece: "None",          // cannot be disinherited
  OtherCollateral: "None",      // cannot be disinherited
  Stranger: "None",             // cannot be disinherited
};

// Filter person picker to compulsory heirs only (non-compulsory cannot be disinherited)
function canBeDisinherited(relationship: Relationship): boolean {
  return RELATIONSHIP_TO_CAUSE_GROUP[relationship] !== "None";
}
```

### Substitute — Fideicommissary Sub-Fields

```
substitute entry
├── substitution_type           (Select: Simple/Reciprocal/Fideicommissary)
│   └── "Fideicommissary" →
│       ├── fiduciary           (PersonPicker)
│       ├── fideicommissary     (PersonPicker)
│       ├── property_scope      (ShareSpec input)
│       ├── is_express          (Toggle)
│       └── is_valid            (Toggle)
│           └── false → invalidity_reason  (TextArea)
├── substitute_heir             (HeirReference)
└── triggers                    (Multi-select: Predecease/Incapacity/Renunciation)
```

**Source:** `condition-substitute.md`
**Note:** Fideicommissary fields are NOT consumed by any current pipeline step — they exist for future engine support.

```typescript
// Source: condition-substitute.md — substitute type visibility
type SubstitutionType = "Simple" | "Reciprocal" | "Fideicommissary";

interface SubstituteVisibility {
  fideicommissary_fields: boolean;
  invalidity_reason: boolean;
}

function getSubstituteVisibility(sub: {
  substitution_type: SubstitutionType;
  is_valid?: boolean;
}): SubstituteVisibility {
  const isFidei = sub.substitution_type === "Fideicommissary";
  return {
    fideicommissary_fields: isFidei,
    invalidity_reason: isFidei && sub.is_valid === false,
  };
}
```

---

## 7. Donations Step (Step 5) — Stranger Toggle Cascade

### Visibility Tree

```
donation entry
├── recipient_is_stranger       (Toggle, default false)
│   ├── false →
│   │   ├── recipient_heir_id   (PersonPicker from family_tree)
│   │   └── [11 exemption flags visible]
│   │       ├── is_expressly_exempt
│   │       ├── is_support_education_medical
│   │       ├── is_customary_gift
│   │       ├── is_professional_expense
│   │       │   └── true →
│   │       │       ├── professional_expense_parent_required
│   │       │       │   └── true → professional_expense_imputed_savings (MoneyInput)
│   │       │       └── (parent_required=false → imputed_savings hidden)
│   │       ├── is_joint_from_both_parents
│   │       ├── is_to_child_spouse_only
│   │       ├── is_joint_to_child_and_spouse
│   │       ├── is_wedding_gift
│   │       ├── is_debt_payment_for_child
│   │       ├── is_election_expense
│   │       └── is_fine_payment
│   └── true →
│       ├── recipient_heir_id   (HIDDEN, set to null)
│       └── [all 11 exemption flags HIDDEN]
│           (stranger donations are always collatable per Art. 909 ¶2)
├── value_at_time_of_donation   (MoneyInput, always visible)
├── date                        (DateInput, always visible)
└── description                 (TextInput, always visible)
```

**Source:** `donation.md`, `step4_estate_base.rs` (collation decision tree)

```typescript
// Source: donation.md — donation field visibility
interface DonationVisibility {
  recipient_heir_id: boolean;
  exemption_flags: boolean;        // all 11 flags as a group
  professional_expense_parent_required: boolean;
  professional_expense_imputed_savings: boolean;
}

function getDonationVisibility(donation: {
  recipient_is_stranger: boolean;
  is_professional_expense: boolean;
  professional_expense_parent_required: boolean;
}): DonationVisibility {
  const isHeir = !donation.recipient_is_stranger;
  return {
    recipient_heir_id: isHeir,
    exemption_flags: isHeir,
    professional_expense_parent_required:
      isHeir && donation.is_professional_expense,
    professional_expense_imputed_savings:
      isHeir && donation.is_professional_expense &&
      donation.professional_expense_parent_required,
  };
}
```

### Stranger Reset

When `recipient_is_stranger` toggles to `true`, reset all exemption flags to `false`,
set `recipient_heir_id` to `null`, and set `professional_expense_imputed_savings` to `null`.

---

## 8. Config Step (Step 6) — Contextual Hints

The config panel itself is always visible (collapsed by default). No fields are conditionally
hidden, but contextual hints should appear based on family tree state.

```typescript
// Source: engine-config.md, adoption.md — config hint visibility
interface ConfigHints {
  retroactiveRa11642Hint: boolean;  // "Relevant when family tree has RA 8552 adoptee"
}

function getConfigHints(familyTree: Array<{
  relationship_to_decedent: Relationship;
  adoption: { regime: string } | null;
}>): ConfigHints {
  const hasRa8552Adoptee = familyTree.some(
    (p) => p.relationship_to_decedent === "AdoptedChild" &&
           p.adoption?.regime === "Ra8552"
  );
  return {
    retroactiveRa11642Hint: hasRa8552Adoptee,
  };
}
```

---

## 9. Cross-Step Dependencies

These are visibility rules where a field in one step affects a field in a different step.

### 9.1 Decedent → Family Tree

| Decedent Field | Effect on Family Tree |
|---|---|
| `is_married` toggled ON | Prompt user: "Add a Surviving Spouse?" in Family Tree |
| `is_married` toggled OFF | Warn if SurvivingSpouse exists in family_tree |
| `has_legal_separation` | Gates `is_guilty_party_in_legal_separation` on SurvivingSpouse persons |

**Source:** `decedent.md`, `person.md`

### 9.2 Family Tree → Will Dispositions

| Family Tree State | Effect on Will Step |
|---|---|
| `family_tree` persons list | Populates `person_id` dropdown in HeirReference across institutions, legacies, devises |
| Compulsory heirs only | Populates `person_id` dropdown in disinheritances (filtered) |
| Person added/removed | Available options in all HeirReference pickers update |

**Source:** `institution-of-heir.md`, `disinheritance.md`

### 9.3 Family Tree → Donations

| Family Tree State | Effect on Donations Step |
|---|---|
| `family_tree` persons list | Populates `recipient_heir_id` dropdown (when `!recipient_is_stranger`) |

**Source:** `donation.md`

### 9.4 Family Tree → Config Hints

| Family Tree State | Effect on Config Step |
|---|---|
| Any AdoptedChild with `adoption.regime === "Ra8552"` | Show contextual hint on `retroactive_ra_11642` toggle |

**Source:** `engine-config.md`

### 9.5 Will Toggle → Step 4 Visibility

| State | Effect |
|---|---|
| `hasWill === true` | Entire Will & Dispositions step (Step 4) becomes visible |
| `hasWill === false` | Step 4 hidden; `will` serialized as `null` |

**Source:** `pipeline.rs:76`, `will.md`

---

## 10. Mutual Exclusion Rules (Informational Warnings)

These don't hide fields but should display warnings/info badges based on family tree composition.

### 10.1 Legitimate Children Exclude Ascendants

When any alive, non-renounced heir in `{LegitimateChild, LegitimatedChild, AdoptedChild}` exists,
ALL `{LegitimateParent, LegitimateAscendant}` heirs become ineligible (excluded by the engine).

**Source:** `step1_classify.rs:108-120`

```typescript
// Source: step1_classify.rs:108-120 — mutual exclusion warning
function shouldWarnAscendantsExcluded(familyTree: Array<{
  relationship_to_decedent: Relationship;
  is_alive_at_succession: boolean;
  has_renounced: boolean;
}>): boolean {
  const hasLegitimateDescendant = familyTree.some(
    (p) =>
      ["LegitimateChild", "LegitimatedChild", "AdoptedChild"].includes(
        p.relationship_to_decedent
      ) &&
      p.is_alive_at_succession &&
      !p.has_renounced
  );
  const hasAscendant = familyTree.some(
    (p) =>
      ["LegitimateParent", "LegitimateAscendant"].includes(
        p.relationship_to_decedent
      )
  );
  return hasLegitimateDescendant && hasAscendant;
}
```

**UI:** When this returns `true`, show an info badge on each ascendant person card:
> "This heir will be excluded — legitimate descendants take priority (Art. 887)."

### 10.2 Compulsory Heirs Exclude Collaterals

When any compulsory heir (LC/LtC/AC/IC/SS/LP/LA) is alive and eligible, collateral relatives
(Sibling, NephewNiece, OtherCollateral) will not inherit in intestate succession.

**Source:** `step3_scenario.rs:163-235` — collaterals only in scenarios I11-I14.

**UI:** When compulsory heirs exist AND collateral relatives are added, show info badge:
> "Collateral relatives only inherit when no compulsory heirs exist."

---

## 11. Comprehensive Visibility Dependency Graph

```
hasWill ──────────────────────────────────────► Step 4 visibility
                                                  │
decedent.is_married ──────────────────────────► 6 marriage fields
  │                                               │
  ├── marriage_solemnized_in_articulo_mortis ──► was_ill_at_marriage
  │     └── was_ill_at_marriage ──────────────► illness_caused_death
  │
  └── [prompt to add SurvivingSpouse] ────────► family_tree
        │
decedent.has_legal_separation ────────────────► person.is_guilty_party (if Spouse)
                                                  │
person.relationship_to_decedent ──────────────► 7 conditional fields (line, filiation,
  │                                               adoption, blood_type, guilty_party,
  │                                               degree editability, children)
  │
  ├── IllegitimateChild ──► filiation_proved ──► filiation_proof_type
  ├── AdoptedChild ──► adoption sub-form
  │     ├── is_stepparent_adoption ──► biological_parent_spouse
  │     └── is_rescinded ──► rescission_date + warning
  ├── Sibling ──► blood_type
  ├── SurvivingSpouse ──► is_guilty_party (if legal sep)
  └── LegitimateParent/Ascendant ──► line
                                                  │
person.is_unworthy ───────────────────────────► unworthiness_condoned
person.is_alive_at_succession ────────────────► children sub-form (representation)
                                                  │
institution.is_residuary ─────────────────────► share selector hidden
institution.share_type ───────────────────────► fraction inputs (if "Fraction")
heir.is_collective ───────────────────────────► class_designation
heir.person_id ───────────────────────────────► name (read-only vs editable)
                                                  │
legacy.spec_type ─────────────────────────────► variant-specific inputs
devise.spec_type ─────────────────────────────► variant-specific inputs
                                                  │
disinheritance.heir.relationship ─────────────► cause_code filter
                                                  │
substitute.substitution_type ─────────────────► fideicommissary fields
substitute.is_valid ──────────────────────────► invalidity_reason
                                                  │
donation.recipient_is_stranger ───────────────► heir_id picker + 11 exemption flags
donation.is_professional_expense ─────────────► parent_required
donation.professional_expense_parent_required ─► imputed_savings
                                                  │
family_tree[*].adoption.regime ───────────────► config hint on retroactive_ra_11642
```

---

## 12. Test Case Evidence Matrix

Analysis of all 20 test cases confirms the conditional patterns:

| Conditional Field | Cases Present | Cases Absent | Pattern |
|---|---|---|---|
| `will` (non-null) | 06, 14 (testate) | 18 other cases | Testate only |
| `filiation_proof_type` (non-null) | 03, 09, 10, 18, 19 | All non-IC cases | IllegitimateChild only |
| `blood_type` (non-null) | 11 | All non-Sibling cases | Sibling only |
| `adoption` (non-null) | 17 | All non-AC cases | AdoptedChild only |
| `line` (non-null) | 05, 08, 16 | All non-LP cases | LegitimateParent only |
| `children` (non-empty) | 15 | All alive-heir cases | Dead heir (representation) only |
| `donations` (non-empty) | 20 | 19 other cases | Optional, any scenario |
| SurvivingSpouse in tree | 02,04,05,10,13,14,16,18,19 | All `is_married=false` cases | `is_married=true` only |

**Observation:** No test case exercises `disinheritances` (non-empty), `devises` (non-empty),
`LegitimateAscendant` (degree > 1), or `OtherCollateral`. These are structurally valid but
lack test coverage — the frontend should still implement their visibility rules per the
Rust type definitions.

---

## 13. Wave 1 Types Affected

| Wave 1 Analysis | Visibility Rules Extracted |
|---|---|
| `engine-input-root.md` | Step 4 gating (will toggle), donations always available |
| `decedent.md` | Marriage cascade (6 fields), articulo mortis warning |
| `person.md` | Relationship → 7 conditional fields, is_unworthy → condoned, alive → children |
| `relationship-enum.md` | RELATIONSHIP_FIELD_EFFECTS map (11 variants × 8 fields) |
| `filiation-proof.md` | IC → filiation_proved → proof_type cascade |
| `blood-type.md` | Sibling → blood_type |
| `adoption.md` | AC → adoption sub-form (stepparent, rescission cascades) |
| `will.md` | All fields gated on hasWill |
| `institution-of-heir.md` | is_residuary → share; is_collective → class_designation; person_id → name |
| `legacy.md` | LegacySpec variant → variant-specific inputs |
| `devise.md` | DeviseSpec variant → variant-specific inputs |
| `condition-substitute.md` | SubstitutionType → fideicommissary fields; is_valid → reason |
| `disinheritance.md` | Heir relationship → cause_code filter |
| `donation.md` | recipient_is_stranger → 11 flags; professional_expense cascade |
| `engine-config.md` | Contextual hint when RA 8552 adoptee exists |
| `engine-output.md` | (output, no input visibility rules) |
| `money.md` | (shared component, no visibility rules) |
