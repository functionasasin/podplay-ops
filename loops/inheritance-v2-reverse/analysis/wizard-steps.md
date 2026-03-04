# Wizard Steps — Philippine Inheritance Engine v2

**Aspect**: wizard-steps
**Wave**: 5b (Frontend UI)
**Depends On**: typescript-types, zod-schemas, rust-types, serde-wire-format

---

## Overview

The intake wizard collects a `ComputationInput` object across 6 steps. The wizard is linear
with one conditional step: **Step 4 (Will)** is shown only when the user indicates the
decedent had a will (a UI flag `hasWill` stored in form state, not in the Rust types).

When `hasWill = false`, `ComputationInput.will` is set to `null` before calling the engine.
When `hasWill = true`, `ComputationInput.will` is populated from the Will step.

### Step Sequence

```
Step 1: Estate      → EstateInput + hasWill flag
Step 2: Decedent    → DecedentInput
Step 3: Family Tree → HeirInput[] (add/edit/remove heirs)
Step 4: Will        → WillInput (CONDITIONAL: shown only if hasWill=true)
Step 5: Donations   → DonationInput[] (add/edit/remove donations)
Step 6: Review      → Summary, then COMPUTE
```

### Navigation Rules

- Forward: each step validates before proceeding.
- Back: always allowed without validation.
- Steps 1–3, 5–6 always present (5 base steps).
- Step 4 (Will) inserted between steps 3 and 5 when `hasWill = true`.
- The step indicator shows 5 or 6 items depending on `hasWill`.
- Skipping to a later step is allowed if all preceding steps are valid.

---

## Step 1: Estate

**Maps to**: `EstateInput` + `hasWill` UI flag

### Purpose
Captures the net hereditary estate value (after funeral expenses, debts, charges) and
establishes whether the decedent left a will (which controls step count).

### Fields

| UI Label | Field | Type | Default | Validation |
|----------|-------|------|---------|------------|
| Net Estate Value | `estate.net_value_centavos` | `number` (input as ₱ pesos, converted to centavos) | — | Required; ≥ 0; integer centavos |
| Estate Description (optional) | `estate.description` | `string \| null` | `null` | Max 500 chars |
| Did the decedent leave a will? | `hasWill` (UI state) | `boolean` | `false` | Required |

### Conditional Visibility

- `estate.description`: always visible (optional).
- "Will execution date" reminder text: shown only when `hasWill = true` (prompt to have
  will document ready for Step 4).

### Validation

```typescript
// Step 1 validation schema (subset of full ComputeInputSchema)
const Step1Schema = z.object({
  estate: EstateInputSchema,
  hasWill: z.boolean(),
});
```

- `net_value_centavos` must be a non-negative integer. The MoneyInput component collects
  value in pesos (decimal) and converts: `Math.round(pesos * 100)`.
- Zero estate is valid (produces escheat or zero distributions with appropriate warnings).

### UI Notes

- Large MoneyInput at top with peso sign (₱) and comma formatting.
- "Has Will" rendered as a toggle/radio ("Yes" / "No"), not a checkbox.
- Prominent legal note: "Net estate = gross estate minus funeral expenses, debts, and
  charges already deducted. Do not double-deduct."

---

## Step 2: Decedent

**Maps to**: `DecedentInput`

### Purpose
Identifies the decedent and captures flags that affect which Civil Code articles apply.

### Fields

| UI Label | Field | Type | Default | Validation |
|----------|-------|------|---------|------------|
| Full Name | `decedent.name` | `string` | `""` | Required; min 2 chars |
| Date of Death | `decedent.date_of_death` | `string` (ISO-8601) | — | Required; valid date; not future |
| Decedent was illegitimate | `decedent.is_illegitimate` | `boolean` | `false` | — |
| Marriage was in articulo mortis | `decedent.articulo_mortis` | `boolean` | `false` | — |
| Years of cohabitation before marriage | `decedent.cohabitation_years` | `number` | `0` | Integer ≥ 0; visible only when articulo_mortis=true |

### Conditional Visibility

- `cohabitation_years` field: **shown only when `articulo_mortis = true`**.
  - When `articulo_mortis = false`, `cohabitation_years` is sent as `0`.
  - When `articulo_mortis = true` AND `cohabitation_years ≥ 5` → Art. 900 ¶2 exception
    does NOT apply; normal ½ legitime to spouse.
  - Helper text: "If the couple cohabited for 5+ years before the in-articulo-mortis
    marriage, the spouse retains full ½ legitime."

### Validation

```typescript
const Step2Schema = z.object({
  decedent: DecedentInputSchema,
});
// DecedentInputSchema includes:
//   date_of_death: DateStringSchema (regex /^\d{4}-\d{2}-\d{2}$/)
//   is_illegitimate: z.boolean()
//   articulo_mortis: z.boolean()
//   cohabitation_years: z.number().int().min(0)
```

- Date of death must not be in the future (relative to `currentDate` context variable).
- `is_illegitimate` shows a legal tooltip: "The decedent was born outside of a valid
  marriage and their filiation was never legitimated."

### UI Notes

- `is_illegitimate` and `articulo_mortis` rendered as labeled toggles.
- A subtle info card explains the legal effect of each flag.
- DateInput shows calendar picker; also accepts typed YYYY-MM-DD.

---

## Step 3: Family Tree

**Maps to**: `HeirInput[]` (the `heirs` array)

### Purpose
Build the complete heir set. Each heir entry maps to one `HeirInput` object. This step has
the most complexity: conditional fields vary by `heir_type`, adoption flags, collateral
flags, and family tree links.

### Sub-structure

The Family Tree step renders as a list of heir cards. Each card is expand/collapsible.
An "Add Heir" button opens an heir form panel (drawer or inline expansion).

### HeirInput Fields by Category

#### Core Fields (all heir types)

| UI Label | Field | Type | Default | Validation |
|----------|-------|------|---------|------------|
| Full Name | `name` | `string` | `""` | Required |
| Heir Type | `heir_type` | `HeirType` | — | Required; EnumSelect |
| Heir is deceased | `is_deceased` | `boolean` | `false` | — |
| Date of death | `date_of_death` | `string \| null` | `null` | Visible when is_deceased=true; valid ISO date |
| Has renounced inheritance | `has_renounced` | `boolean` | `false` | — |

#### Eligibility / Unworthiness

| UI Label | Field | Type | Default | Visibility |
|----------|-------|------|---------|------------|
| Deemed unworthy (Art. 1032) | `is_unworthy` | `boolean` | `false` | Always |
| Unworthiness condoned by testator | `unworthiness_condoned` | `boolean` | `false` | Shown when is_unworthy=true |

#### Filiation

| UI Label | Field | Type | Default | Visibility |
|----------|-------|------|---------|------------|
| Filiation is legally proved | `filiation_proved` | `boolean` | `true` | Shown only for IllegitimateChild; other types: forced true |

- For `LegitimateChild`, `LegitimatedChild`, `AdoptedChild`: `filiation_proved` is
  automatically set to `true` and the field is hidden (these types imply filiation proof).
- For `IllegitimateChild`: field shown with label "Filiation legally proved (FC Art. 175)".

#### Spouse-specific

| UI Label | Field | Type | Default | Visibility |
|----------|-------|------|---------|------------|
| Legal Separation Status | `legal_separation_status` | `LegalSeparationStatus` | `"NotApplicable"` | Shown only when heir_type="Spouse" |

- Hidden (sent as `"NotApplicable"`) for all non-Spouse heir types.

#### Adoption-specific

| UI Label | Field | Type | Default | Visibility |
|----------|-------|------|---------|------------|
| Adoption was rescinded | `adoption_rescinded` | `boolean` | `false` | Shown when heir_type="AdoptedChild" |
| Date of rescission | `adoption_rescission_date` | `string \| null` | `null` | Shown when adoption_rescinded=true |
| Adopter is married to biological parent | `biological_parent_is_adopter_spouse` | `boolean` | `false` | Shown when heir_type="AdoptedChild" |

#### Legitimation

| UI Label | Field | Type | Default | Visibility |
|----------|-------|------|---------|------------|
| Heir was legitimated (FC Arts. 177–179) | `is_legitimated` | `boolean` | `false` | Shown when heir_type="LegitimatedChild" |

- `is_legitimated` is hidden for all other heir types (sent as `false`).

#### Ascendant-specific

| UI Label | Field | Type | Default | Visibility |
|----------|-------|------|---------|------------|
| Paternal line | `paternal_line` | `boolean` | `true` | Shown when heir_type="LegitimateAscendant" |
| Degree of kinship | `degree` | `number \| null` | `null` | Shown when heir_type="LegitimateAscendant" |

- `degree`: 1 = parent, 2 = grandparent, 3 = great-grandparent, etc.
- "Paternal line" toggle: "Paternal (father's side)" / "Maternal (mother's side)".

#### Collateral-specific

| UI Label | Field | Type | Default | Visibility |
|----------|-------|------|---------|------------|
| Full blood (same father AND mother) | `is_full_blood` | `boolean` | `true` | Shown when heir_type="Sibling" |
| Degree of kinship | `collateral_degree` | `number` | `2` | Shown when heir_type ∈ {Sibling, NieceNephew, OtherCollateral} |

- `is_collateral` is auto-set to `true` when heir_type ∈ {Sibling, NieceNephew, OtherCollateral}
  and `false` otherwise; never shown in UI.
- `collateral_degree` defaults: Sibling=2, NieceNephew=3, OtherCollateral=entered by user.

#### Engine-computed (hidden, fixed values from frontend)

| Field | Value always sent |
|-------|------------------|
| `is_disinherited` | `false` (engine-computed; frontend always sends false) |

#### Children (for representation)

| UI Label | Field | Type | Notes |
|----------|-------|------|-------|
| Children in this heir list | `children` | `HeirId[]` | Multi-select from existing heir IDs |

- A "Children" sub-section within the heir card shows a PersonPicker dropdown.
- Only heirs of type `LegitimateChild`, `LegitimatedChild`, `AdoptedChild`,
  `IllegitimateChild`, `NieceNephew` can meaningfully be listed as children.
- The PersonPicker excludes the current heir (no self-reference).

### Heir Type Display Logic

```
LegitimateChild    → show: filiation_proved=hidden(true), children picker
LegitimatedChild   → show: is_legitimated, children picker
AdoptedChild       → show: adoption_rescinded, adoption_rescission_date?, biological_parent_is_adopter_spouse
IllegitimateChild  → show: filiation_proved (editable), children picker
LegitimateAscendant→ show: paternal_line, degree
Spouse             → show: legal_separation_status
Sibling            → show: is_full_blood, collateral_degree=2 (hidden/fixed)
NieceNephew        → show: collateral_degree=3, children picker
OtherCollateral    → show: collateral_degree (editable)
```

### Validation

```typescript
const Step3Schema = z.object({
  heirs: z.array(HeirInputSchema).min(1, "At least one heir is required"),
});
```

- At least 1 heir required (the engine handles edge cases with 0 eligible heirs).
- Each heir ID must be unique within the heirs array.
- If `is_deceased = true`, `date_of_death` must be non-null and a valid ISO date.
- If `adoption_rescinded = true`, `adoption_rescission_date` must be non-null.
- If `is_unworthy = true` AND `unworthiness_condoned = true` → show info: "Condoned
  unworthiness means the heir remains eligible (Art. 1033)."

### Heir Card Summary (collapsed state)

Collapsed heir card shows: name, heir_type badge (colored by group), is_deceased indicator,
and quick-edit icon. Example:

```
[LC] Juan dela Cruz          [Legitimate Child] [●  Alive]   [Edit]
[IC] Maria Santos            [Illegitimate Child] [● Alive]  [Edit]
[SP] Ana dela Cruz           [Spouse]             [● Alive]  [Edit]
```

### Disinheritance in Step 3

Step 3 does NOT have disinheritance UI. Disinheritance records are entered in Step 4 (Will),
because disinheritance requires a will (Art. 916: "disinheritance can only be effected through
a will"). This means: `heirs[*].is_disinherited` is always `false` on input; the engine
computes it from `will.disinheritances`.

---

## Step 4: Will (Conditional)

**Shown when**: `hasWill = true` (set in Step 1)
**Maps to**: `WillInput`

### Purpose
Capture all testamentary dispositions: estate shares (institutions), specific bequests
(devises and legacies), explicit disinheritances, and testamentary substitutions.

The Will step uses a **tab layout** with 4 sub-sections:

```
[ Institutions ] [ Devises & Legacies ] [ Disinheritances ] [ Substitutions ]
```

### Sub-tab 1: Institutions

Each institution = `InstitutionInput`.

| UI Label | Field | Type | Default | Validation |
|----------|-------|------|---------|------------|
| Heir | `heir_id` | `HeirId` | — | Required; PersonPicker from heirs list |
| Share type | — | UI toggle: "Fraction" / "Amount" | `"Fraction"` | — |
| Fraction | `fraction` | `string \| null` | `null` | FractionInput; shown when share type="Fraction" |
| Amount | `amount_centavos` | `number \| null` | `null` | MoneyInput; shown when share type="Amount" |
| Conditions (optional) | `conditions` | `string[]` | `[]` | Free-text tags |
| Preferred (Art. 911 reduction) | `is_preferred` | `boolean` | `false` | Checkbox |

- Exactly one of `fraction` or `amount_centavos` must be non-null. The UI toggle
  enforces this: switching clears the other field.
- Note: the engine will validate that total institutions ≤ net estate and respects legitimes.
- `id` is auto-generated UUID by the frontend.

### Sub-tab 2: Devises & Legacies

Two expandable sections: **Devises** (real property) and **Legacies** (personal property / money).

#### Devise fields (`DeviseInput`):

| UI Label | Field | Type | Default | Visibility |
|----------|-------|------|---------|------------|
| Beneficiary | `beneficiary_heir_id` | `HeirId \| null` | `null` | PersonPicker (can be null for stranger) |
| Beneficiary Name | `beneficiary_name` | `string` | `""` | Always visible; pre-filled from heir if selected |
| Property Description | `property_description` | `string` | `""` | Required; text area |
| Estimated Value | `estimated_value_centavos` | `number` | — | Required; MoneyInput |
| Is Usufruct | `is_usufruct` | `boolean` | `false` | Toggle |
| Is Real Property | `is_real_property` | `boolean` | `true` | Toggle (default true for devises) |
| Conditions | `conditions` | `string[]` | `[]` | Tags |
| Preferred | `is_preferred` | `boolean` | `false` | Checkbox |

#### Legacy fields (`LegacyInput`):

| UI Label | Field | Type | Default | Visibility |
|----------|-------|------|---------|------------|
| Beneficiary | `beneficiary_heir_id` | `HeirId \| null` | `null` | PersonPicker |
| Beneficiary Name | `beneficiary_name` | `string` | `""` | Pre-filled if heir selected |
| Amount | `amount_centavos` | `number` | — | Required; MoneyInput |
| Conditions | `conditions` | `string[]` | `[]` | Tags |
| Preferred | `is_preferred` | `boolean` | `false` | Checkbox |

### Sub-tab 3: Disinheritances

Each disinheritance = `DisinheritanceRecord`.

| UI Label | Field | Type | Default | Validation |
|----------|-------|------|---------|------------|
| Heir to disinherit | `heir_id` | `HeirId` | — | Required; PersonPicker |
| Ground | `ground` | `DisinheritanceGround` | — | Required; EnumSelect (grouped by article) |
| Cause proven | `cause_proven` | `boolean` | `false` | Checkbox |
| Testator reconciled with heir | `reconciled` | `boolean` | `false` | Checkbox |

- `DisinheritanceGround` selector groups options under Art. 919 (children), Art. 920
  (parents/ascendants), Art. 921 (spouse) with human-readable labels.
- Reconciliation warning: "Reconciliation voids the disinheritance entirely (Art. 922).
  This heir will remain eligible."

### Sub-tab 4: Substitutions

Each substitution = `SubstitutionInput`.

| UI Label | Field | Type | Default | Validation |
|----------|-------|------|---------|------------|
| Primary Heir | `primary_heir_id` | `HeirId` | — | Required; PersonPicker |
| Substitute Heir | `substitute_heir_id` | `HeirId` | — | Required; PersonPicker (≠ primary) |
| Substitution Type | `substitution_type` | `SubstitutionType` | `"Simple"` | EnumSelect |

- "Simple" (Art. 857): substitute inherits if primary cannot/will not inherit.
- "Fideicommissary" (Art. 863): primary holds title, transfers to substitute on death/condition.

### Validation (Step 4)

```typescript
const Step4Schema = z.object({
  will: WillInputSchema,
});
```

- If `will.institutions` total fraction > 1 → show warning (not hard error; engine validates).
- Duplicate heir_id in disinheritances → show warning.
- `substitute_heir_id ≠ primary_heir_id` → required (hard error).

---

## Step 5: Donations

**Maps to**: `DonationInput[]` (the `donations` array)

### Purpose
Record all inter vivos donations made by the decedent during their lifetime. These are used
for collation (E_adj computation) and inofficiousness checks.

### Per-Donation Fields

| UI Label | Field | Type | Default | Visibility |
|----------|-------|------|---------|------------|
| Recipient | `recipient_heir_id` | `HeirId \| null` | `null` | PersonPicker (null = stranger) |
| Recipient Is Stranger | `recipient_is_stranger` | `boolean` | `false` | Auto-set from picker |
| Value at time of donation | `value_at_donation_centavos` | `number` | — | Required; MoneyInput |
| Date of donation | `date` | `string` | — | Required; DateInput |

#### Collatability Flags (expandable "Advanced" section)

| UI Label | Field | Type | Default | Visibility |
|----------|-------|------|---------|------------|
| Expressly exempt from collation | `is_expressly_exempt` | `boolean` | `false` | Always |
| Support/education/medical expense | `is_support_education_medical` | `boolean` | `false` | Always |
| Ordinary customary gift | `is_customary_gift` | `boolean` | `false` | Always |
| Professional/vocational expense | `is_professional_expense` | `boolean` | `false` | Always |
| Parent required this career path | `professional_expense_parent_required` | `boolean` | `false` | Shown when is_professional_expense=true |
| Imputed home-savings savings (Art. 1068) | `professional_expense_imputed_savings_centavos` | `number \| null` | `null` | Shown when is_professional_expense=true |
| Joint donation from both parents | `is_joint_from_both_parents` | `boolean` | `false` | Always |
| Donation to child's spouse only | `is_to_child_spouse_only` | `boolean` | `false` | Always |
| Joint donation to child AND spouse | `is_joint_to_child_and_spouse` | `boolean` | `false` | Always |
| Wedding gift | `is_wedding_gift` | `boolean` | `false` | Always |
| Donation for public office | `is_for_public_office` | `boolean` | `false` | Always |

These flags are collapsed by default under "Advanced Collatability Options" accordion.
Default state (unchecked) = fully collatable donation.

### Validation (Step 5)

- Donations array may be empty (no collation → E_adj = net_estate).
- If `is_professional_expense = true` AND `professional_expense_parent_required = false`:
  show info "Only expenses incurred at parent's express requirement are excluded from
  collation (Art. 1068)."
- Date must not be after decedent's date_of_death.

### DonationInput field: `is_wedding_gift`

Looking at the rust-types.md we have `is_wedding_gift` field referenced in the collation
analysis. The DonationInput struct includes (from rust-types § 4.6):

```rust
pub is_wedding_gift: bool,
pub is_for_public_office: bool,
```

These must be included in the schema and UI even though they appear late in the field list.

---

## Step 6: Review

**Maps to**: Final review before computation (no additional fields collected)

### Purpose
Display a structured summary of all entered data. User confirms and clicks "Compute".

### Review Sections

#### 6.1 Estate Summary
- Net Estate: ₱X,XXX,XXX.XX (formatted)
- Succession Type: "Testate" / "Intestate" (derived from hasWill)
- Description if provided

#### 6.2 Decedent Summary
- Name, Date of Death
- Special flags if active: "Illegitimate decedent (Art. 903)", "Articulo mortis marriage
  (Art. 900 ¶2)"

#### 6.3 Heir Summary
- Table: Name | Type | Status
- Status badges: Alive / Deceased / Renounced / Unworthy
- Warning if no compulsory heirs present: "No compulsory heirs found. Full estate goes
  to lower-priority heirs or the State."

#### 6.4 Will Summary (shown only if hasWill=true)
- Count: N institutions, M devises/legacies, P disinheritances, Q substitutions
- List of institutions with heir name and share
- Disinheritances listed with ground (short label)

#### 6.5 Donations Summary
- Count: N donations totaling ₱X,XXX,XXX.XX
- Table: Recipient | Amount | Date

#### 6.6 Warnings
- Pre-computation validation warnings displayed as amber alert cards
- E.g., "Donation dated after date of death — will be excluded from collation."

### Compute Button

- Primary CTA: "Compute Distribution"
- Disabled if any step has validation errors (step navigation shows red indicator).
- On click: serialize `ComputationInput`, call `computeJson()`, navigate to Results view.

### Loading State

- Replace button with spinner: "Computing..."
- WASM call is synchronous (post-init), but wrapped in `setTimeout(0)` to allow React to
  re-render spinner before blocking.

---

## Wizard Container Architecture

### State Management

```typescript
interface WizardState {
  // Step 1
  estate: EstateInput;
  hasWill: boolean;

  // Step 2
  decedent: DecedentInput;

  // Step 3
  heirs: HeirInput[];

  // Step 4 (conditional)
  will: WillInput | null;  // null when hasWill=false

  // Step 5
  donations: DonationInput[];

  // Wizard navigation
  currentStep: number;  // 1-6 (or 1-5 when no will)
  stepValidity: Record<number, boolean>;
}
```

### Derived ComputationInput

```typescript
function buildComputationInput(state: WizardState): ComputationInput {
  return {
    decedent: state.decedent,
    estate: state.estate,
    heirs: state.heirs,
    donations: state.donations,
    will: state.hasWill ? state.will : null,
  };
}
```

### Step Visibility Map

```typescript
function getVisibleSteps(hasWill: boolean): StepConfig[] {
  const base: StepConfig[] = [
    { id: 1, label: "Estate",      icon: "building-2" },
    { id: 2, label: "Decedent",    icon: "user" },
    { id: 3, label: "Family Tree", icon: "git-fork" },
    { id: 5, label: "Donations",   icon: "gift" },
    { id: 6, label: "Review",      icon: "check-circle" },
  ];
  if (hasWill) {
    return [
      ...base.slice(0, 3),
      { id: 4, label: "Will", icon: "scroll" },
      ...base.slice(3),
    ];
  }
  return base;
}
```

### Form Libraries

- **React Hook Form** (v7) — field registration, validation, watch()
- **Zod** (v3) — schema validation via `zodResolver`
- **Per-step schemas**: each step uses a partial Zod schema matching only its fields.

---

## Conditional Visibility Summary

| Field | Shown When |
|-------|-----------|
| `estate.description` | Always (optional) |
| Will steps (Step 4) | `hasWill = true` |
| `decedent.cohabitation_years` | `articulo_mortis = true` |
| `heir.date_of_death` | `is_deceased = true` |
| `heir.unworthiness_condoned` | `is_unworthy = true` |
| `heir.filiation_proved` (editable) | `heir_type = "IllegitimateChild"` |
| `heir.legal_separation_status` | `heir_type = "Spouse"` |
| `heir.adoption_rescinded`, `biological_parent_is_adopter_spouse` | `heir_type = "AdoptedChild"` |
| `heir.adoption_rescission_date` | `adoption_rescinded = true` |
| `heir.is_legitimated` | `heir_type = "LegitimatedChild"` |
| `heir.paternal_line`, `degree` | `heir_type = "LegitimateAscendant"` |
| `heir.is_full_blood` | `heir_type = "Sibling"` |
| `heir.collateral_degree` | `heir_type ∈ {Sibling, NieceNephew, OtherCollateral}` |
| Institution `fraction` field | Share type = "Fraction" |
| Institution `amount_centavos` field | Share type = "Amount" |
| `professional_expense_parent_required` | `is_professional_expense = true` |
| `professional_expense_imputed_savings_centavos` | `is_professional_expense = true` |

---

## Auto-Derived / Fixed Values (never shown in UI)

| Field | Value | Reason |
|-------|-------|--------|
| `heir.is_disinherited` | `false` | Engine-computed; user never inputs |
| `heir.is_collateral` | `true` iff heir_type ∈ {Sibling, NieceNephew, OtherCollateral} | Derived from heir_type |
| `heir.filiation_proved` | `true` | Auto for LegitimateChild, LegitimatedChild, AdoptedChild |
| `heir.is_legitimated` | `false` | Auto for non-LegitimatedChild types |
| `heir.paternal_line` | `false` | Auto for non-LegitimateAscendant |
| `heir.degree` | `null` | Auto for non-LegitimateAscendant |
| `heir.collateral_degree` | `0` | Auto for non-collateral (engine ignores it) |
| `heir.is_full_blood` | `false` | Auto for non-Sibling |
| `heir.adoption_rescinded` | `false` | Auto for non-AdoptedChild |
| `heir.adoption_rescission_date` | `null` | Auto for non-AdoptedChild |
| `heir.biological_parent_is_adopter_spouse` | `false` | Auto for non-AdoptedChild |
| `heir.legal_separation_status` | `"NotApplicable"` | Auto for non-Spouse |
| `donation.recipient_is_stranger` | `true` iff recipient_heir_id = null | Derived |

---

## Cross-Layer Notes

1. **HeirInput.is_disinherited**: Frontend always sends `false`. Rust engine ignores
   the input value and computes `is_disinherited` from `will.disinheritances`. This avoids
   the frontend accidentally pre-setting a value that conflicts with the engine's assessment.

2. **WillInput nullability**: `ComputationInput.will` is `null` (not absent) when `hasWill =
   false`. The Zod schema for `ComputationInput` uses `z.nullable(WillInputSchema)`, which
   allows `null` but not an absent key.

3. **DonationInput.recipient_is_stranger**: Derived from `recipient_heir_id === null` in
   the UI. However, the Rust struct requires the field explicitly (deny_unknown_fields does
   NOT complain about extra fields sent — wait, it does reject unknown fields). The field
   MUST be sent; UI must compute and include it.

4. **Heir ID generation**: The frontend generates UUID v4 for each heir. IDs are stable
   within a wizard session (React key and form registration by ID). The engine does not
   validate ID format, only uniqueness.

5. **Estate vs. EstateInput**: The Rust struct uses `net_value_centavos: i64` (not a Money
   wrapper). UI collects as pesos decimal and converts: `centavos = Math.round(pesos * 100)`.
   EstateInput does NOT use the Money struct; it has a raw `net_value_centavos: i64` field.

6. **is_wedding_gift and is_for_public_office**: These fields appear in the `DonationInput`
   struct. The UI must send them. They default to `false`.
