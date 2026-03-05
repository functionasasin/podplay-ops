# Shared Components — Philippine Inheritance Engine v2

**Aspect**: shared-components
**Wave**: 5c (Frontend UI — Reusable Widgets)
**Depends On**: typescript-types, zod-schemas, wizard-steps, results-view

---

## Overview

Five primary shared form widgets and several display utilities cover every reusable
interaction pattern in the wizard and results view. This file specifies each component's
props interface, behavior, constraints, and cross-layer notes.

---

## §1. MoneyInput

### Purpose

Collects a Philippine peso amount from the user. Internally stores as **integer centavos**
(matching `i64` / `InputMoney` on the wire), but displays and receives input as **decimal
pesos** (e.g., `₱1,250,000.00`).

### Used In

| Step / Component | Field |
|---|---|
| Step 1 — Estate | `estate.net_value_centavos` |
| Step 4 — Will → Institutions | `institution.amount_centavos` |
| Step 4 — Will → Devises | `devise.estimated_value_centavos` |
| Step 4 — Will → Legacies | `legacy.amount_centavos` |
| Step 5 — Donations | `donation.value_at_donation_centavos` |
| Step 5 — Donations (advanced) | `donation.professional_expense_imputed_savings_centavos` |

### Props Interface

```typescript
interface MoneyInputProps {
  /** Display label shown above the input */
  label: string;

  /** Current value in **centavos** (integer). Null = empty/unset. */
  value: number | null;

  /** Called with new centavo integer on every valid change */
  onChange: (centavos: number | null) => void;

  /** If true, renders as read-only display (no text input, just formatted amount) */
  readOnly?: boolean;

  /** Minimum allowed centavo value (inclusive). Default: 0 */
  min?: number;

  /** Maximum allowed centavo value (inclusive). Default: Number.MAX_SAFE_INTEGER */
  max?: number;

  /** If true, null/empty is allowed (field is optional). Default: false */
  nullable?: boolean;

  /** Help text shown below the input */
  helpText?: string;

  /** Error message from form controller (React Hook Form) */
  errorMessage?: string;

  /** HTML id for label association */
  id?: string;

  /** Disabled state */
  disabled?: boolean;
}
```

### Behavior

**Display ↔ Centavo Conversion**:
- On render: convert stored centavos → display pesos using `centavos / 100`, formatted to
  2 decimal places.
- On user input change: parse pesos string → centavos using `Math.round(parseFloat(raw) * 100)`.
- Invalid input (non-numeric, NaN) → call `onChange(null)` and show inline error.

**Formatting**:
- Input field shows raw typed value while focused (unformatted string).
- On blur: format to `toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })`.
- Prefix: `₱` rendered as a non-editable adornment inside the input border (left side).

**Validation (internal)**:
- Value must be a non-negative integer (after centavo conversion).
- If `min` set and centavos < min → report error via `errorMessage` prop or internal state.
- Zero is valid (net estate = 0 triggers escheat/zero distribution warnings).

**Implementation Note — Wire Format**:
- The Rust `InputMoney` type accepts `number | string` for `centavos` (to support BigInt on
  the wire). The frontend ALWAYS sends a plain JSON `number` (not a string). MoneyInput
  converts to integer centavos before handing off to form state.
- `net_value_centavos` on `EstateInput` is a direct `i64` field (not wrapped in `InputMoney`
  struct). MoneyInput for this field submits the integer directly.

```typescript
// Internal conversion utilities
function pesosToCentavos(pesos: string): number | null {
  const n = parseFloat(pesos.replace(/,/g, ""));
  if (isNaN(n) || n < 0) return null;
  return Math.round(n * 100);
}

function centavosToPesosDisplay(centavos: number): string {
  return (centavos / 100).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
```

### Shadcn/Tailwind Implementation

```tsx
<div className="relative">
  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium select-none">₱</span>
  <Input
    type="text"
    inputMode="decimal"
    className="pl-8"
    value={displayValue}
    onChange={handleChange}
    onBlur={handleBlur}
    onFocus={handleFocus}
    aria-label={label}
    aria-describedby={helpText ? `${id}-help` : undefined}
  />
</div>
```

---

## §2. DateInput

### Purpose

Collects an ISO-8601 date string (`"YYYY-MM-DD"`) from the user. Supports both
calendar picker (native `<input type="date">`) and free-form typed entry with format
validation.

### Used In

| Step / Component | Field |
|---|---|
| Step 2 — Decedent | `decedent.date_of_death` |
| Step 3 — Family Tree | `heir.date_of_death` |
| Step 3 — Family Tree | `heir.adoption_rescission_date` |
| Step 5 — Donations | `donation.date` |

### Props Interface

```typescript
interface DateInputProps {
  label: string;

  /** ISO-8601 string "YYYY-MM-DD", or null if unset */
  value: DateString | null;

  onChange: (date: DateString | null) => void;

  /** If provided, rejects dates after this date (inclusive). */
  maxDate?: DateString;

  /** If provided, rejects dates before this date (inclusive). */
  minDate?: DateString;

  nullable?: boolean;
  readOnly?: boolean;
  helpText?: string;
  errorMessage?: string;
  id?: string;
  disabled?: boolean;
}
```

### Behavior

- Renders as `<input type="date">` (browser native calendar picker).
- Value attribute is the ISO-8601 string directly (native date input accepts `YYYY-MM-DD`).
- On change: validate against `DateStringSchema` regex `/^\d{4}-\d{2}-\d{2}$/`.
- `maxDate` enforcement: if `value > maxDate`, report error "Date must not be after
  [maxDate_formatted]". Used for decedent DOD (must not be in the future relative to today)
  and donation dates (must not be after decedent's death).
- On clear/empty: call `onChange(null)` only if `nullable = true`.

**Cross-Layer Note**: The Rust engine expects ISO-8601 `"YYYY-MM-DD"` strings. The native
`<input type="date">` value attribute is already in this format; no conversion needed.

```typescript
// Validate date constraints
function validateDate(
  value: DateString,
  maxDate?: DateString,
  minDate?: DateString,
): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Invalid date format (YYYY-MM-DD)";
  if (maxDate && value > maxDate) return `Must be on or before ${maxDate}`;
  if (minDate && value < minDate) return `Must be on or after ${minDate}`;
  return null; // valid
}
```

### Implementation Note

For the "date must not be in the future" constraint on `decedent.date_of_death`:

```typescript
const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
<DateInput
  label="Date of Death"
  value={value}
  onChange={onChange}
  maxDate={today}
  errorMessage={errors.decedent?.date_of_death?.message}
/>
```

---

## §3. FractionInput

### Purpose

Collects a rational fraction string in `"numer/denom"` format. Used for will institution
shares (e.g., `"1/2"`, `"1/3"`, `"2/5"`). Validates that denominator is a positive integer
and numerator is a non-negative integer.

### Used In

| Step / Component | Field |
|---|---|
| Step 4 — Will → Institutions | `institution.fraction` |

### Props Interface

```typescript
interface FractionInputProps {
  label: string;

  /** Fraction string "numer/denom" or null */
  value: FractionString | null;

  onChange: (fraction: FractionString | null) => void;

  nullable?: boolean;
  readOnly?: boolean;
  helpText?: string;
  errorMessage?: string;
  id?: string;
  disabled?: boolean;
}
```

### Behavior

- Renders as a single text input with placeholder `"e.g. 1/2"`.
- On blur: validate against `FractionStringSchema` regex `/^-?\d+\/[1-9]\d*$/`.
- Accepts only strings of form `digits/digits` (no negative fractions in institution context;
  the regex allows negative for completeness matching Rust engine, but UI warns if negative).
- Helper text: `"Enter as fraction, e.g. 1/3 for one-third"`.
- Parsing helper exposed for summary display:

```typescript
function parseFraction(frac: FractionString): { numer: number; denom: number } | null {
  const match = frac.match(/^(-?\d+)\/([1-9]\d*)$/);
  if (!match) return null;
  return { numer: parseInt(match[1], 10), denom: parseInt(match[2], 10) };
}

function fractionToDecimalDisplay(frac: FractionString): string {
  const parsed = parseFraction(frac);
  if (!parsed) return frac;
  return (parsed.numer / parsed.denom * 100).toFixed(2) + "%";
}
```

- Review step summary shows both `"1/2"` and its decimal expansion `"(50.00%)"`.

---

## §4. PersonPicker

### Purpose

Selects one or more heirs from the current heirs list by `HeirId`. Used for linking
heirs to will dispositions, disinheritances, substitutions, donation recipients, and
representation children.

### Used In

| Step / Component | Field | Mode |
|---|---|---|
| Step 3 — Family Tree | `heir.children` | Multi-select |
| Step 4 — Will → Institutions | `institution.heir_id` | Single |
| Step 4 — Will → Devises | `devise.beneficiary_heir_id` | Single + nullable |
| Step 4 — Will → Legacies | `legacy.beneficiary_heir_id` | Single + nullable |
| Step 4 — Will → Disinheritances | `disinheritance.heir_id` | Single |
| Step 4 — Will → Substitutions | `substitution.primary_heir_id` | Single |
| Step 4 — Will → Substitutions | `substitution.substitute_heir_id` | Single |
| Step 5 — Donations | `donation.recipient_heir_id` | Single + nullable |

### Props Interface

```typescript
interface PersonPickerOption {
  id: HeirId;
  name: string;
  heir_type: HeirType;
  is_deceased: boolean;
}

interface PersonPickerProps {
  label: string;

  /** All heirs available for selection */
  options: PersonPickerOption[];

  /** Single-select mode: selected HeirId or null */
  value?: HeirId | null;
  onChange?: (id: HeirId | null) => void;

  /** Multi-select mode: array of selected HeirIds */
  values?: HeirId[];
  onChangeMulti?: (ids: HeirId[]) => void;

  /** Allow null selection ("None / Stranger" option). Default: false */
  nullable?: boolean;

  /** Exclude specific heir IDs from options (e.g., exclude self in children picker) */
  excludeIds?: HeirId[];

  /** Filter options to only these heir_type values */
  filterTypes?: HeirType[];

  /** Placeholder text */
  placeholder?: string;

  readOnly?: boolean;
  errorMessage?: string;
  id?: string;
  disabled?: boolean;
}
```

### Behavior

**Single-select mode** (default when `value` + `onChange` provided):
- Renders as a searchable dropdown (`<Select>` from shadcn/ui).
- Each option shows: `[TypeBadge] Name (deceased indicator)`.
- If `nullable = true`: shows a "None / Stranger" option at top with value `null`.
- `excludeIds`: removes matching IDs from options list (prevents self-selection in children).

**Multi-select mode** (when `values` + `onChangeMulti` provided):
- Renders as a multi-select combobox with checkboxes per option.
- Selected items shown as removable tags below the dropdown.
- Used only for `heir.children` field.

**Type Badge in options**:

```typescript
const HEIR_TYPE_SHORT: Record<HeirType, string> = {
  LegitimateChild:    "LC",
  LegitimatedChild:   "LgC",
  AdoptedChild:       "AC",
  IllegitimateChild:  "IC",
  LegitimateAscendant:"LA",
  Spouse:             "SP",
  Sibling:            "SB",
  NieceNephew:        "NN",
  OtherCollateral:    "OC",
};
```

**Deceased indicator**: Deceased heirs shown with a subtle `(†)` suffix or dimmed text.
They remain selectable (deceased heirs can have representation chains).

**Donation stranger case**: When `nullable = true` on the donation recipient picker, selecting
"None / Stranger" sets `recipient_heir_id = null` and the form automatically sets
`recipient_is_stranger = true`. The UI shows a text field "Stranger Name (optional)" when
stranger is selected (for review display only; not sent to engine).

---

## §5. EnumSelect

### Purpose

Renders a dropdown for selecting a value from a typed enum. Supports option groups
(for `DisinheritanceGround` which is grouped by article), option labels, and descriptive
help text per option.

### Used In

| Step / Component | Field | Enum |
|---|---|---|
| Step 3 — Family Tree (heir card) | `heir.heir_type` | `HeirType` |
| Step 3 — Family Tree (heir card) | `heir.legal_separation_status` | `LegalSeparationStatus` |
| Step 4 — Will → Disinheritances | `disinheritance.ground` | `DisinheritanceGround` |
| Step 4 — Will → Substitutions | `substitution.substitution_type` | `SubstitutionType` |

### Props Interface

```typescript
interface EnumOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface EnumOptionGroup<T extends string> {
  groupLabel: string;
  options: EnumOption<T>[];
}

interface EnumSelectProps<T extends string> {
  label: string;
  value: T | null;
  onChange: (value: T) => void;

  /** Flat options list (use when no grouping needed) */
  options?: EnumOption<T>[];

  /** Grouped options (use for DisinheritanceGround) */
  groups?: EnumOptionGroup<T>[];

  placeholder?: string;
  readOnly?: boolean;
  errorMessage?: string;
  helpText?: string;
  id?: string;
  disabled?: boolean;
}
```

### Option Label Maps

#### HeirType Labels

```typescript
const HEIR_TYPE_LABELS: Record<HeirType, string> = {
  LegitimateChild:     "Legitimate Child (FC Art. 164)",
  LegitimatedChild:    "Legitimated Child (FC Arts. 177–179)",
  AdoptedChild:        "Adopted Child (RA 8552 / RA 11642)",
  IllegitimateChild:   "Illegitimate Child (FC Art. 165)",
  LegitimateAscendant: "Legitimate Ascendant (Art. 887¶2)",
  Spouse:              "Surviving Spouse",
  Sibling:             "Sibling (Arts. 1003–1007)",
  NieceNephew:         "Niece / Nephew (Art. 972)",
  OtherCollateral:     "Other Collateral (≤ 5th degree)",
};
```

#### LegalSeparationStatus Labels

```typescript
const LEGAL_SEP_LABELS: Record<LegalSeparationStatus, string> = {
  NotApplicable:         "Not applicable",
  LegallySeparated:      "Legally separated (Art. 63 FC — bars inheritance)",
  SeparationInProgress:  "Separation proceedings in progress (Art. 63 FC — inheritance pending)",
};
```

#### DisinheritanceGround Groups (22 variants grouped by article)

```typescript
const DISINHERITANCE_GROUND_GROUPS: EnumOptionGroup<DisinheritanceGround>[] = [
  {
    groupLabel: "Art. 919 — Grounds vs Children / Descendants",
    options: [
      { value: "Art919_1", label: "1. Convicted of attempt on decedent's or spouse's life" },
      { value: "Art919_2", label: "2. Accused decedent of crime (Art. 333/334 RPC) without basis" },
      { value: "Art919_3", label: "3. Guilty of adultery/concubinage with spouse" },
      { value: "Art919_4", label: "4. Convicted of crime with civil interdiction" },
      { value: "Art919_5", label: "5. Abandoned decedent without just cause" },
      { value: "Art919_6", label: "6. Corrupted or induced to become corrupt" },
      { value: "Art919_7", label: "7. Led dishonorable or disgraceful life" },
      { value: "Art919_8", label: "8. Convicted of adultery/concubinage with parent's spouse" },
    ],
  },
  {
    groupLabel: "Art. 920 — Grounds vs Parents / Ascendants",
    options: [
      { value: "Art920_1", label: "1. Abandoned child without just cause / failed to support" },
      { value: "Art920_2", label: "2. Convicted of attempt on decedent's or spouse's life" },
      { value: "Art920_3", label: "3. Accused decedent of crime (Art. 333/334 RPC) without basis" },
      { value: "Art920_4", label: "4. Convicted of crime with civil interdiction" },
      { value: "Art920_5", label: "5. Refusal to support child without just cause" },
      { value: "Art920_6", label: "6. Induced decedent to make/change will by force/fraud" },
      { value: "Art920_7", label: "7. Led dishonorable or disgraceful life" },
      { value: "Art920_8", label: "8. Convicted of adultery/concubinage with parent's spouse" },
    ],
  },
  {
    groupLabel: "Art. 921 — Grounds vs Spouse",
    options: [
      { value: "Art921_1", label: "1. Guilty of adultery/concubinage" },
      { value: "Art921_2", label: "2. Convicted of attempt on decedent's life" },
      { value: "Art921_3", label: "3. Accused decedent of crime (Art. 333/334 RPC) without basis" },
      { value: "Art921_4", label: "4. Convicted of crime with civil interdiction" },
      { value: "Art921_5", label: "5. Abandoned decedent without just cause" },
      { value: "Art921_6", label: "6. Induced decedent to make/change will by force/fraud" },
    ],
  },
];
```

#### SubstitutionType Labels

```typescript
const SUBSTITUTION_TYPE_LABELS: Record<SubstitutionType, { label: string; description: string }> = {
  Simple:          {
    label: "Simple Substitution (Art. 857)",
    description: "Substitute inherits if primary heir cannot or will not accept inheritance.",
  },
  Fideicommissary: {
    label: "Fideicommissary Substitution (Art. 863)",
    description: "Primary heir holds title during lifetime, transfers to substitute on death or condition.",
  },
};
```

---

## §6. Supporting Display Components

These are not form inputs but are used across both wizard (Review step, heir cards) and
the Results view.

### 6.1 MoneyDisplay (read-only)

```typescript
interface MoneyDisplayProps {
  /** Centavos value */
  centavos: number;
  /** Additional CSS classes */
  className?: string;
  /** If true, display as "— excluded" for zero amounts in table */
  showExcludedIfZero?: boolean;
}

function MoneyDisplay({ centavos, className, showExcludedIfZero }: MoneyDisplayProps) {
  if (showExcludedIfZero && centavos === 0) {
    return <span className="text-slate-400 italic">— excluded</span>;
  }
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {"₱" + (centavos / 100).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}
    </span>
  );
}
```

### 6.2 HeirTypeBadge

Used in heir cards (collapsed state), distribution table, and narrative panel.

```typescript
interface HeirTypeBadgeProps {
  heirType: HeirType;
  /** Use short form (LC, IC, SP…) when true, full label when false */
  short?: boolean;
}

const HEIR_TYPE_BADGE_COLORS: Record<HeirType, string> = {
  LegitimateChild:     "bg-blue-100 text-blue-800",
  LegitimatedChild:    "bg-blue-100 text-blue-700",
  AdoptedChild:        "bg-cyan-100 text-cyan-800",
  IllegitimateChild:   "bg-indigo-100 text-indigo-800",
  LegitimateAscendant: "bg-violet-100 text-violet-800",
  Spouse:              "bg-teal-100 text-teal-800",
  Sibling:             "bg-slate-200 text-slate-700",
  NieceNephew:         "bg-slate-200 text-slate-600",
  OtherCollateral:     "bg-slate-100 text-slate-500",
};
```

### 6.3 EffectiveGroupBadge

Used in the distribution table `Group` column.

```typescript
const GROUP_LABELS: Record<EffectiveGroup, string> = {
  PrimaryCompulsory:   "G1",
  SecondaryCompulsory: "G2",
  SpouseClass:         "G3",
  OptionalHeirs:       "G4",
};

const GROUP_COLORS: Record<EffectiveGroup, string> = {
  PrimaryCompulsory:   "bg-blue-100 text-blue-800",
  SecondaryCompulsory: "bg-violet-100 text-violet-800",
  SpouseClass:         "bg-teal-100 text-teal-800",
  OptionalHeirs:       "bg-slate-100 text-slate-700",
};
```

### 6.4 AlertCard

Uniform severity-based alert box used for warnings and manual review flags.

```typescript
type AlertSeverity = "info" | "warning" | "error";

interface AlertCardProps {
  severity: AlertSeverity;
  title?: string;
  children: React.ReactNode;
}

const ALERT_STYLES: Record<AlertSeverity, { container: string; icon: string }> = {
  info:    { container: "bg-blue-50 border border-blue-200",   icon: "text-blue-500" },
  warning: { container: "bg-amber-50 border border-amber-300", icon: "text-amber-500" },
  error:   { container: "bg-red-50 border border-red-400",     icon: "text-red-600" },
};
```

### 6.5 SuccessionTypeBadge

```typescript
type SuccessionType = "Testate" | "Intestate" | "Mixed";

const SUCCESSION_TYPE_STYLES: Record<SuccessionType, string> = {
  Testate:   "bg-emerald-100 text-emerald-800",
  Intestate: "bg-orange-100 text-orange-800",
  Mixed:     "bg-yellow-100 text-yellow-800",
};
```

### 6.6 StepIndicator

Wizard navigation breadcrumb (5 or 6 steps depending on `hasWill`).

```typescript
interface StepIndicatorProps {
  steps: StepConfig[];         // from getVisibleSteps(hasWill)
  currentStep: number;
  stepValidity: Record<number, boolean>;
  onNavigate: (step: number) => void;
}
```

Step states:
- **Complete** (step < currentStep AND valid): filled checkmark circle, click allowed.
- **Current** (step === currentStep): filled with primary color.
- **Pending** (step > currentStep): outlined, click allowed only if all prior steps valid.
- **Error** (step < currentStep AND invalid): red indicator.

---

## §7. Form Integration Patterns

### React Hook Form + Zod Resolver

All wizard steps use `react-hook-form` v7 with `zodResolver`.

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Each step component pattern:
const { register, control, handleSubmit, watch, formState: { errors } } =
  useForm<Step1Fields>({
    resolver: zodResolver(Step1Schema),
    defaultValues: { estate: defaultEstateInput(), hasWill: false },
  });
```

### Controlled vs Uncontrolled Components

| Component | Mode | Notes |
|---|---|---|
| MoneyInput | Controlled (value + onChange) | `<Controller>` from RHF |
| DateInput | Controlled | `<Controller>` from RHF |
| FractionInput | Controlled | `<Controller>` from RHF |
| PersonPicker | Controlled | `<Controller>` from RHF |
| EnumSelect | Controlled | `<Controller>` from RHF |
| Text inputs (name, description) | Uncontrolled | `register()` from RHF |
| Boolean toggles | Controlled | `<Controller>` from RHF |

### Conditional Visibility with `watch()`

```typescript
// Step 2: show cohabitation_years only when articulo_mortis = true
const articuloMortis = watch("decedent.articulo_mortis");

{articuloMortis && (
  <Controller
    name="decedent.cohabitation_years"
    control={control}
    render={({ field }) => (
      <div>
        <label>Years of cohabitation before marriage</label>
        <input type="number" min={0} {...field} />
      </div>
    )}
  />
)}
```

### Default Factories

```typescript
function defaultEstateInput(): EstateInput {
  return { net_value_centavos: 0, description: null };
}

function defaultDecedentInput(): DecedentInput {
  return {
    name: "",
    date_of_death: "",
    is_illegitimate: false,
    articulo_mortis: false,
    cohabitation_years: 0,
  };
}

function defaultHeirInput(heir_type: HeirType = "LegitimateChild"): HeirInput {
  return {
    id: crypto.randomUUID(),
    name: "",
    heir_type,
    is_deceased: false,
    date_of_death: null,
    has_renounced: false,
    is_unworthy: false,
    unworthiness_condoned: false,
    filiation_proved: true,
    legal_separation_status: "NotApplicable",
    adoption_rescinded: false,
    adoption_rescission_date: null,
    biological_parent_is_adopter_spouse: false,
    is_legitimated: false,
    paternal_line: false,
    degree: null,
    is_collateral: false,
    collateral_degree: 0,
    is_full_blood: false,
    is_disinherited: false,
    children: [],
  };
}

function defaultDonationInput(): DonationInput {
  return {
    id: crypto.randomUUID(),
    recipient_heir_id: null,
    recipient_is_stranger: true,
    value_at_donation_centavos: 0,
    date: "",
    is_expressly_exempt: false,
    is_support_education_medical: false,
    is_customary_gift: false,
    is_professional_expense: false,
    professional_expense_parent_required: false,
    professional_expense_imputed_savings_centavos: null,
    is_joint_from_both_parents: false,
    is_to_child_spouse_only: false,
    is_joint_to_child_and_spouse: false,
    is_wedding_gift: false,
    is_for_public_office: false,
  };
}
```

---

## §8. Component File Layout

```
src/
  components/
    shared/
      MoneyInput.tsx         # MoneyInput + pesosToCentavos/centavosToPesosDisplay
      DateInput.tsx          # DateInput + validateDate
      FractionInput.tsx      # FractionInput + parseFraction/fractionToDecimalDisplay
      PersonPicker.tsx       # PersonPicker (single + multi)
      EnumSelect.tsx         # EnumSelect<T> generic
      MoneyDisplay.tsx       # Read-only centavos display
      HeirTypeBadge.tsx      # Heir type badge + HEIR_TYPE_SHORT/LABELS/BADGE_COLORS
      EffectiveGroupBadge.tsx # Group badge + GROUP_LABELS/COLORS
      AlertCard.tsx          # AlertCard severity variants
      SuccessionTypeBadge.tsx # SuccessionType badge
      StepIndicator.tsx      # Wizard step breadcrumb
      index.ts               # Re-export all shared components
    wizard/
      ...                    # Step components (import from shared/)
    results/
      ...                    # Results components (import from shared/)
```

---

## §9. Cross-Layer Consistency Notes

1. **MoneyInput centavo conversion**: `Math.round(pesos * 100)` must be used (not `pesos * 100 | 0`)
   to avoid floating-point truncation errors. E.g., `₱1.005` → `101` not `100`.

2. **PersonPicker option list is live**: The options list must update reactively when heirs
   are added/removed in Step 3. Use `watch("heirs")` from the wizard's RHF context to keep
   the picker in sync.

3. **EnumSelect value is the raw PascalCase string**: The enum value stored in form state and
   sent over the wire is always the PascalCase variant name (e.g., `"LegitimateChild"`, not
   `"Legitimate Child"`). Display labels are presentation-only.

4. **DateInput max on Step 5**: Donation dates must not be after `decedent.date_of_death`.
   The Step 5 form must `watch("decedent.date_of_death")` from WizardState to pass as
   `maxDate` to donation DateInput components.

5. **FractionInput and the "Amount" toggle**: Institution share type toggle (Fraction /
   Amount) clears the other field. When switching Fraction → Amount, `fraction` is set to
   `null`; when switching Amount → Fraction, `amount_centavos` is set to `null`. The wire
   format requires exactly one non-null of these two fields per `InstitutionInput`.

6. **PersonPicker `excludeIds` for self-reference**: In the heir children picker, the current
   heir's own `id` must be excluded. Also exclude any heir whose `children` list already
   contains the current heir (prevents circular representation chains).

7. **DisinheritanceGround grouped options**: The grouping in `EnumSelect` is presentation-only.
   The value stored and sent is the flat `DisinheritanceGround` string (e.g., `"Art919_1"`).
   The groups match the 22-variant enum defined in both `typescript-types.md` and
   `rust-types.md`.
