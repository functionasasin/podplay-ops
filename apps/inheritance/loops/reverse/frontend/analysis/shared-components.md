# Shared Components — Cross-Cutting Analysis

> Wave 2 aspect: Identifies reusable form components from Wave 1 field metadata tables.
> All components derived from patterns appearing in 2+ Wave 1 type analyses.

## Summary

10 shared components identified from Wave 1 analysis. Each component appears in multiple
wizard contexts, justifying extraction into reusable primitives. Components are organized
into three tiers: **primitive inputs** (5), **composite sub-forms** (3), and
**utility components** (2).

---

## Tier 1: Primitive Input Components

### 1. MoneyInput

**Occurrences across Wave 1 types:**

| Context | Type Analysis | Field Path | Required | Wizard Step |
|---------|--------------|------------|----------|-------------|
| Net distributable estate | engine-input-root.md | `net_distributable_estate` | Yes | Estate |
| Donation value | donation.md | `value_at_time_of_donation` | Yes | Donations |
| Imputed savings | donation.md | `professional_expense_imputed_savings` | Conditional | Donations |
| Legacy fixed amount | legacy.md | `property.FixedAmount` | When variant=FixedAmount | Will > Legacies |
| Legacy generic class value | legacy.md | `property.GenericClass[1]` | When variant=GenericClass | Will > Legacies |
| Output display (7 fields) | engine-output.md | `InheritanceShare.*` | Read-only | Results |

**Component spec:**

```typescript
/**
 * Reusable monetary input component.
 *
 * Behavior:
 * - User enters pesos (decimal, up to 2 decimal places)
 * - ₱ prefix displayed in input
 * - Internal value stored as centavos (integer)
 * - Serializes to Money wire format: { centavos: number | string }
 *
 * Origin: money.md analysis — mirrors Rust Money struct (types.rs:22-29)
 * Display format: step10_finalize.rs:215-226 — format_peso()
 */
interface MoneyInputProps {
  /** Current value in centavos (number for safe ints, string for large values). */
  value: number | string | null;
  /** Callback when value changes. Receives centavos. */
  onChange: (centavos: number | string | null) => void;
  /** Field label (e.g., "Net Distributable Estate", "Donation Value"). */
  label: string;
  /** Whether the field is required. */
  required?: boolean;
  /** Whether the field is read-only (for output display). */
  readOnly?: boolean;
  /** Minimum value in centavos (default: 0). */
  min?: number;
  /** Placeholder text (default: "₱0"). */
  placeholder?: string;
  /** Error message from Zod validation. */
  error?: string;
  /** Whether to show a warning when value is 0 (for estate value). */
  warnOnZero?: boolean;
}
```

**Conversion utilities (from money.md):**

```typescript
// Mirrors Money::from_pesos() at types.rs:80-84
function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

// Inverse of Money::from_pesos()
function centavosToPesos(centavos: number | string): number {
  const c = typeof centavos === "string" ? Number(centavos) : centavos;
  return c / 100;
}

// Mirrors step10_finalize.rs:215-226 — format_peso()
function formatPeso(centavos: number | string): string {
  const c = typeof centavos === "string" ? BigInt(centavos) : BigInt(centavos);
  const pesos = c / 100n;
  const cents = c % 100n;
  const pesosStr = pesos.toLocaleString("en-US");
  if (cents === 0n) return `₱${pesosStr}`;
  return `₱${pesosStr}.${cents.toString().padStart(2, "0")}`;
}

// Mirrors types.ts:31-45 — custom Serialize impl
function serializeCentavos(centavos: number | bigint): number | string {
  if (typeof centavos === "bigint") {
    return centavos <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(centavos)
      : centavos.toString();
  }
  return centavos;
}
```

**Zod schema (reusable across all Money fields):**

```typescript
// Constraint origin: types.ts:47-70 (custom Deserialize impl)
const CentavosValueSchema = z.union([
  z.number().int({ message: "Centavos must be a whole number" })
    .nonnegative({ message: "Amount cannot be negative" }),
  z.string().regex(/^\d+$/, { message: "Centavos string must contain only digits" }),
]);

const MoneySchema = z.object({ centavos: CentavosValueSchema });
```

---

### 2. DateInput

**Occurrences across Wave 1 types:**

| Context | Type Analysis | Field Path | Required | Cross-Validation |
|---------|--------------|------------|----------|-----------------|
| Date of death | decedent.md | `decedent.date_of_death` | Yes | — (anchor date) |
| Date of marriage | decedent.md | `decedent.date_of_marriage` | When married | ≤ date_of_death |
| Will execution date | will.md | `will.date_executed` | Yes | ≤ date_of_death |
| Donation date | donation.md | `donations[].date` | Yes | ≤ date_of_death |
| Adoption decree date | adoption.md | `adoption.decree_date` | Yes | ≤ date_of_death |
| Rescission date | adoption.md | `adoption.rescission_date` | When rescinded | > decree_date |

**Component spec:**

```typescript
/**
 * Reusable ISO 8601 date input component.
 *
 * Behavior:
 * - Renders a date picker or manual text input
 * - Validates YYYY-MM-DD format
 * - Supports optional min/max date constraints for cross-field validation
 * - Stores value as ISO 8601 string ("2026-01-15")
 *
 * Origin: types.rs:18 — `type Date = String` (ISO 8601 convention)
 * All test cases use "YYYY-MM-DD" format exclusively.
 */
interface DateInputProps {
  /** Current ISO date string value, or empty string if unset. */
  value: string;
  /** Callback when value changes. */
  onChange: (isoDate: string) => void;
  /** Field label (e.g., "Date of Death", "Adoption Decree Date"). */
  label: string;
  /** Whether the field is required. */
  required?: boolean;
  /** Minimum date (ISO string). E.g., decree_date for rescission_date. */
  minDate?: string;
  /** Maximum date (ISO string). E.g., date_of_death for will/donation dates. */
  maxDate?: string;
  /** Hint text shown below the field. */
  hint?: string;
  /** Error message from Zod validation. */
  error?: string;
}
```

**Zod schema (reusable across all Date fields):**

```typescript
// Constraint origin: types.rs:18 — type Date = String
// Validated by serde deserialization as opaque string, but frontend enforces format.
const DateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be in YYYY-MM-DD format" });
```

---

### 3. FractionInput

**Occurrences across Wave 1 types:**

| Context | Type Analysis | Field Path | Serialization | Wizard Step |
|---------|--------------|------------|---------------|-------------|
| Institution share | institution-of-heir.md | `share.Fraction` | `"numer/denom"` string | Will > Institutions |
| Devise fractional interest | devise.md | `property.FractionalInterest[1]` | `"numer/denom"` string | Will > Devises |
| Output legitime fraction | engine-output.md | `InheritanceShare.legitime_fraction` | `"numer/denom"` string (read-only) | Results |

**Component spec:**

```typescript
/**
 * Reusable fraction input with numerator/denominator fields.
 *
 * Behavior:
 * - Two number inputs: numerator (N) and denominator (D)
 * - Visual display: "N / D" with a divider element
 * - Common preset buttons: 1/2, 1/3, 1/4, 2/3, 3/4
 * - Serializes to "numer/denom" string matching Rust Frac serde
 * - Validates: N > 0, D > 0, N ≤ D (share cannot exceed whole)
 *
 * Origin: fraction.rs:241-264 — Frac custom Serialize/Deserialize
 * Wire format: "1/2" (bare string), NOT {numer: 1, denom: 2}
 *
 * CRITICAL: The engine uses "numer/denom" string serialization.
 * See institution-of-heir.md and devise.md for context.
 */
interface FractionInputProps {
  /** Current fraction as "numer/denom" string, or null if unset. */
  value: string | null;
  /** Callback when value changes. Receives "numer/denom" string. */
  onChange: (frac: string | null) => void;
  /** Field label (e.g., "Share Fraction", "Fractional Interest"). */
  label: string;
  /** Whether the field is required. */
  required?: boolean;
  /** Whether numerator can exceed denominator (default: false). */
  allowImproper?: boolean;
  /** Whether to show preset buttons (default: true). */
  showPresets?: boolean;
  /** Whether the field is read-only (for output display). */
  readOnly?: boolean;
  /** Error message from Zod validation. */
  error?: string;
}

/**
 * Fraction presets for quick selection.
 * Common shares in Philippine inheritance law.
 */
const FRACTION_PRESETS = [
  { label: "1/2", numer: 1, denom: 2 },
  { label: "1/3", numer: 1, denom: 3 },
  { label: "1/4", numer: 1, denom: 4 },
  { label: "2/3", numer: 2, denom: 3 },
  { label: "3/4", numer: 3, denom: 4 },
] as const;
```

**Conversion utilities:**

```typescript
// Convert UI inputs to wire format
// Origin: fraction.rs:241-244 (Serialize impl)
function fracToString(numer: number, denom: number): string {
  return `${numer}/${denom}`;
}

// Parse wire format for display
// Origin: fraction.rs:247-264 (Deserialize impl)
function stringToFrac(s: string): { numer: number; denom: number } {
  const [n, d] = s.split("/").map(Number);
  return { numer: n, denom: d };
}
```

**Zod schema (reusable across all Frac fields):**

```typescript
// Constraint origin: fraction.rs:250-263 (Deserialize impl)
const FracStringSchema = z.string()
  .regex(/^-?\d+\/-?\d+$/, "Fraction must be in 'numer/denom' format (e.g. '1/2')")
  .refine(
    (val) => {
      const parts = val.split("/");
      return parts.length === 2 && parseInt(parts[1]) !== 0;
    },
    "Denominator cannot be zero"
  )
  .refine(
    (val) => {
      const parts = val.split("/").map(Number);
      return parts[0] > 0 && parts[1] > 0;
    },
    "Fraction must be positive"
  );
```

---

### 4. PersonPicker

**Occurrences across Wave 1 types:**

| Context | Type Analysis | Selection Source | Nullable | Filters | Wizard Step |
|---------|--------------|-----------------|----------|---------|-------------|
| HeirReference.person_id (institutions) | institution-of-heir.md | family_tree | Yes (null = stranger) | None | Will > Institutions |
| HeirReference.person_id (legacies) | legacy.md | family_tree | Yes (null = stranger) | None | Will > Legacies |
| HeirReference.person_id (devises) | devise.md | family_tree | Yes (null = stranger) | None | Will > Devises |
| Disinheritance.heir_reference.person_id | disinheritance.md | family_tree | No (required) | Compulsory heirs only | Will > Disinheritances |
| Substitute.substitute_heir.person_id | condition-substitute.md | family_tree | No (required) | Alive + eligible | Will > Substitutes |
| Donation.recipient_heir_id | donation.md | family_tree | Yes (null = stranger) | None | Donations |
| Person.children[] | person.md | family_tree | No | Other persons | Family Tree |
| Adoption.adopter | adoption.md | decedent + family_tree | No | Auto-fill decedent | Family Tree > Adoption |
| Adoption.biological_parent_spouse | adoption.md | family_tree | Yes | When stepparent | Family Tree > Adoption |

**Component spec:**

```typescript
/**
 * Reusable person/heir selector component.
 *
 * Behavior:
 * - Dropdown populated from EngineInput.family_tree persons
 * - Option to select "Other (not in family tree)" → person_id = null
 * - Auto-fills name when a family tree person is selected
 * - Optional filter predicate (e.g., compulsory heirs only for disinheritance)
 * - Multi-select mode for Person.children[]
 *
 * Used by: HeirReference (5 contexts), Donation recipient (1),
 * Person.children (1), Adoption.adopter/biological_parent_spouse (2)
 */
interface PersonPickerProps {
  /** Currently selected person ID(s). */
  value: string | string[] | null;
  /** Callback when selection changes. */
  onChange: (personId: string | string[] | null) => void;
  /** Field label (e.g., "Heir", "Recipient", "Children"). */
  label: string;
  /** Available persons to choose from. */
  persons: Array<{ id: string; name: string; relationship?: string }>;
  /** Whether to allow "Other (stranger)" option with null person_id. */
  allowStranger?: boolean;
  /** Whether multiple selection is supported (for children[]). */
  multiSelect?: boolean;
  /** Filter function to restrict available options. */
  filter?: (person: { id: string; name: string; relationship?: string }) => boolean;
  /** IDs to exclude from options (e.g., self, already-selected). */
  excludeIds?: string[];
  /** Whether the field is required (no null option). */
  required?: boolean;
  /** Error message from Zod validation. */
  error?: string;
}
```

**Filter presets:**

```typescript
/**
 * Common filter functions for PersonPicker.
 * Derived from cross-field validation rules in Wave 1 analyses.
 */

// Disinheritance: only compulsory heirs can be disinherited (disinheritance.md)
// Origin: step1_classify.rs:167-172 — is_compulsory_heir()
const COMPULSORY_RELATIONSHIPS = [
  "LegitimateChild", "LegitimatedChild", "AdoptedChild",
  "IllegitimateChild", "SurvivingSpouse",
  "LegitimateParent", "LegitimateAscendant",
] as const;

function filterCompulsoryHeirs(
  person: { relationship?: string }
): boolean {
  return COMPULSORY_RELATIONSHIPS.includes(
    person.relationship as (typeof COMPULSORY_RELATIONSHIPS)[number]
  );
}

// Substitutes: must be alive (condition-substitute.md)
// Origin: step9_vacancy.rs:598 — checks is_alive && is_eligible
function filterAlivePersons(
  person: { isAlive?: boolean }
): boolean {
  return person.isAlive !== false;
}
```

---

### 5. EnumSelect

**Occurrences across Wave 1 types:**

| Enum | Variants | Grouping | Type Analysis | Wizard Step |
|------|----------|----------|---------------|-------------|
| Relationship | 11 | 3 groups (Compulsory/Collateral/Other) | relationship-enum.md | Family Tree |
| DisinheritanceCause | 22 | 3 groups (Child/Parent/Spouse Art. 919-921) | disinheritance.md | Will > Disinheritances |
| FiliationProof | 6 | Flat (Art. 172 order) | filiation-proof.md | Family Tree |
| BloodType | 2 | Flat | blood-type.md | Family Tree |
| AdoptionRegime | 2 | Flat | adoption.md | Family Tree > Adoption |
| LineOfDescent | 2 | Flat | person.md | Family Tree |
| ShareSpec (variant selector) | 6 | Flat | institution-of-heir.md | Will > Institutions |
| LegacySpec (variant selector) | 3 | Flat | legacy.md | Will > Legacies |
| DeviseSpec (variant selector) | 2 | Flat | devise.md | Will > Devises |
| ConditionType | 3 | Flat | condition-substitute.md | Will > Conditions |
| ConditionStatus | 4 | Flat | condition-substitute.md | Will > Conditions |
| SubstitutionType | 3 | Flat | condition-substitute.md | Will > Substitutes |
| SubstitutionTrigger | 3 | Multi-select (checkboxes) | condition-substitute.md | Will > Substitutes |

**Component spec:**

```typescript
/**
 * Reusable enum select with optional grouping and descriptions.
 *
 * Behavior:
 * - Renders as a dropdown/select with user-friendly labels
 * - Optional group headers (e.g., "Compulsory Heirs", "Collateral Heirs")
 * - Optional description text per option
 * - Multi-select mode for checkbox arrays (SubstitutionTrigger)
 * - Dynamic filtering of available options (DisinheritanceCause by relationship)
 *
 * All enum values use PascalCase serialization matching Rust
 * #[derive(Serialize, Deserialize)].
 */
interface EnumSelectProps<T extends string> {
  /** Currently selected value(s). */
  value: T | T[] | null;
  /** Callback when selection changes. */
  onChange: (value: T | T[] | null) => void;
  /** Field label. */
  label: string;
  /** Available options. */
  options: Array<{
    value: T;
    label: string;
    description?: string;
    group?: string;
  }>;
  /** Whether multiple selection is allowed (for trigger checkboxes). */
  multiSelect?: boolean;
  /** Whether the field is required. */
  required?: boolean;
  /** Placeholder text (e.g., "Select a relationship"). */
  placeholder?: string;
  /** Filter function to restrict available options dynamically. */
  filter?: (option: { value: T; group?: string }) => boolean;
  /** Error message from Zod validation. */
  error?: string;
}
```

**Reusable option constants (already defined in Wave 1 analyses):**

| Constant | Source Analysis | Variants |
|----------|---------------|----------|
| `RELATIONSHIP_OPTIONS` | relationship-enum.md | 11 options, 3 groups |
| `FILIATION_PROOF_OPTIONS` | filiation-proof.md | 6 options, flat |
| `BLOOD_TYPE_OPTIONS` | blood-type.md | 2 options, flat |
| `ADOPTION_REGIME_OPTIONS` | adoption.md | 2 options, flat |
| `SHARE_SPEC_OPTIONS` | institution-of-heir.md | 6 options, flat |
| `LEGACY_SPEC_OPTIONS` | legacy.md | 3 options, flat |
| `DEVISE_SPEC_OPTIONS` | devise.md | 2 options, flat |
| `CONDITION_TYPE_OPTIONS` | condition-substitute.md | 3 options, flat |
| `CONDITION_STATUS_OPTIONS` | condition-substitute.md | 4 options, flat |
| `SUBSTITUTION_TYPE_OPTIONS` | condition-substitute.md | 3 options, flat |
| `SUBSTITUTION_TRIGGER_OPTIONS` | condition-substitute.md | 3 options (multi-select) |
| `DISINHERITANCE_CAUSE_OPTIONS` | disinheritance.md | 22 options, 3 groups |
| `EFFECTIVE_CATEGORY_LABELS` | engine-output.md | 5 options (display-only) |
| `SUCCESSION_TYPE_LABELS` | engine-output.md | 4 options (display-only) |
| `SCENARIO_DESCRIPTIONS` | engine-output.md | 30 options (display-only) |

---

## Tier 2: Composite Sub-Form Components

### 6. HeirReferenceForm

**Occurrences:** 5 contexts — InstitutionOfHeir.heir, Legacy.legatee, Devise.devisee,
Disinheritance.heir_reference, Substitute.substitute_heir

**Source:** institution-of-heir.md (canonical definition), reused by legacy.md, devise.md,
disinheritance.md, condition-substitute.md

```typescript
/**
 * Reusable heir reference sub-form.
 * Maps to Rust HeirReference struct (types.rs:391-396).
 *
 * Used in 5 different disposition/substitution contexts.
 * Provides: person picker + name field + collective gift toggle.
 *
 * Two modes:
 * 1. Family tree person selected → auto-fill name, set person_id
 * 2. "Other" selected → free-text name, person_id = null
 *
 * For disinheritances: person_id is REQUIRED (cannot disinherit strangers).
 * For substitutes: person_id is REQUIRED (engine needs classified heir).
 * For institutions/legacies/devises: person_id is optional (strangers allowed).
 */
interface HeirReferenceFormProps {
  /** Current HeirReference value. */
  value: HeirReference;
  /** Callback when any field changes. */
  onChange: (ref: HeirReference) => void;
  /** Available persons for the picker. */
  persons: Array<{ id: string; name: string; relationship?: string }>;
  /** Whether person_id is required (true for disinheritances/substitutes). */
  requirePersonId?: boolean;
  /** Filter for available persons (e.g., compulsory heirs only). */
  personFilter?: (person: { id: string; name: string; relationship?: string }) => boolean;
  /** Whether to show collective gift fields (hidden for disinheritances). */
  showCollectiveFields?: boolean;
  /** Person IDs to exclude from the picker. */
  excludePersonIds?: string[];
  /** Field-level errors from Zod validation. */
  errors?: Record<string, string>;
}
```

**Layout across contexts:**

| Context | person_id | name | is_collective | class_designation | showCollectiveFields |
|---------|-----------|------|---------------|-------------------|---------------------|
| Institution | Optional | Auto-fill or free text | Available | When collective=true | true |
| Legacy | Optional | Auto-fill or free text | Available | When collective=true | true |
| Devise | Optional | Auto-fill or free text | Available | When collective=true | true |
| Disinheritance | **Required** | Auto-fill only | Hidden (false) | Hidden (null) | false |
| Substitute | **Required** | Auto-fill only | Hidden (false) | Hidden (null) | false |

---

### 7. ConditionForm

**Occurrences:** 3 contexts — InstitutionOfHeir.conditions, Legacy.conditions,
Devise.conditions

**Source:** condition-substitute.md

```typescript
/**
 * Reusable condition sub-form (repeater item).
 * Maps to Rust Condition struct (types.rs:432-436).
 *
 * Appears as a collapsible repeater section within institutions,
 * legacies, and devises. Usually empty (all 90+ test cases use []).
 *
 * Fields: condition_type (select), description (textarea), status (select).
 * All fields informational — only description consumed by condition
 * stripping logic (step6_validation.rs:741-745).
 */
interface ConditionFormProps {
  /** Current Condition value. */
  value: Condition;
  /** Callback when any field changes. */
  onChange: (condition: Condition) => void;
  /** Index within the conditions array (for display). */
  index: number;
  /** Callback to remove this condition. */
  onRemove: () => void;
  /** Field-level errors from Zod validation. */
  errors?: Record<string, string>;
}
```

**Default value factory:**

```typescript
// Default condition when user clicks "Add Condition"
function createDefaultCondition(): Condition {
  return {
    condition_type: "Suspensive",
    description: "",
    status: "Pending",
  };
}
```

---

### 8. SubstituteForm

**Occurrences:** 3 contexts — InstitutionOfHeir.substitutes, Legacy.substitutes,
Devise.substitutes

**Source:** condition-substitute.md

```typescript
/**
 * Reusable substitute sub-form (repeater item).
 * Maps to Rust Substitute struct (types.rs:439-443).
 *
 * Appears as a collapsible repeater section within institutions,
 * legacies, and devises. Usually empty (all 90+ test cases use []).
 *
 * Contains: substitution_type (select), substitute_heir (HeirReferenceForm
 * with requirePersonId=true), triggers (multi-select checkboxes).
 *
 * Only substitute_heir.person_id consumed by engine (step9_vacancy.rs:595).
 */
interface SubstituteFormProps {
  /** Current Substitute value. */
  value: Substitute;
  /** Callback when any field changes. */
  onChange: (substitute: Substitute) => void;
  /** Available persons for the heir reference picker. */
  persons: Array<{ id: string; name: string; relationship?: string }>;
  /** Index within the substitutes array (for display). */
  index: number;
  /** Callback to remove this substitute. */
  onRemove: () => void;
  /** Field-level errors from Zod validation. */
  errors?: Record<string, string>;
}
```

**Default value factory:**

```typescript
// Default substitute when user clicks "Add Substitute"
// Convention: all three triggers selected (step9_vacancy.rs:903-907)
function createDefaultSubstitute(): Substitute {
  return {
    substitution_type: "Simple",
    substitute_heir: {
      person_id: null,
      name: "",
      is_collective: false,
      class_designation: null,
    },
    triggers: ["Predecease", "Renunciation", "Incapacity"],
  };
}
```

---

## Tier 3: Utility Components

### 9. DispositionIdGenerator

**Occurrences:** 3 contexts — InstitutionOfHeir.id, Legacy.id, Devise.id

**Source:** institution-of-heir.md, legacy.md, devise.md — all require unique IDs
within a shared disposition namespace

```typescript
/**
 * Utility for generating unique disposition IDs across all will dispositions.
 *
 * Constraint: IDs must be unique across institutions + legacies + devises
 * (shared namespace). The engine references IDs via Reduction.target_id
 * (step6_validation.rs) and substitute matching (step9_vacancy.rs).
 *
 * Convention from test cases:
 * - Institutions: "i1", "i2", ...
 * - Legacies: "l1", "l2", ... (or "leg1", "leg2")
 * - Devises: "dev1", "dev2", ...
 */

type DispositionType = "institution" | "legacy" | "devise";

const DISPOSITION_PREFIXES: Record<DispositionType, string> = {
  institution: "i",
  legacy: "l",
  devise: "dev",
};

/**
 * Generate a unique disposition ID.
 * Checks against all existing IDs in the will to ensure uniqueness.
 *
 * @param type - The disposition type (institution, legacy, devise)
 * @param existingIds - All current disposition IDs in the will
 * @returns A unique ID string
 */
function generateDispositionId(
  type: DispositionType,
  existingIds: Set<string>
): string {
  const prefix = DISPOSITION_PREFIXES[type];
  let counter = 1;
  while (existingIds.has(`${prefix}${counter}`)) {
    counter++;
  }
  return `${prefix}${counter}`;
}

/**
 * Collect all disposition IDs from a Will for uniqueness validation.
 * Used in Zod superRefine at the Will level.
 *
 * Origin: institution-of-heir.md, legacy.md, devise.md — all specify
 * IDs must be unique across the full disposition namespace.
 */
function collectDispositionIds(will: {
  institutions: Array<{ id: string }>;
  legacies: Array<{ id: string }>;
  devises: Array<{ id: string }>;
}): Set<string> {
  const ids = new Set<string>();
  for (const inst of will.institutions) ids.add(inst.id);
  for (const leg of will.legacies) ids.add(leg.id);
  for (const dev of will.devises) ids.add(dev.id);
  return ids;
}

/**
 * Zod refinement for disposition ID uniqueness.
 * Apply at the Will schema level via superRefine.
 */
function validateDispositionIdUniqueness(
  will: {
    institutions: Array<{ id: string }>;
    legacies: Array<{ id: string }>;
    devises: Array<{ id: string }>;
  },
  ctx: z.RefinementCtx
): void {
  const seen = new Set<string>();
  const allDispositions = [
    ...will.institutions.map((d, i) => ({ id: d.id, path: ["institutions", i, "id"] })),
    ...will.legacies.map((d, i) => ({ id: d.id, path: ["legacies", i, "id"] })),
    ...will.devises.map((d, i) => ({ id: d.id, path: ["devises", i, "id"] })),
  ];
  for (const { id, path } of allDispositions) {
    if (seen.has(id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate disposition ID "${id}" — IDs must be unique across all institutions, legacies, and devises`,
        path: path as (string | number)[],
      });
    }
    seen.add(id);
  }
}
```

---

### 10. ValidityIndicator

**Occurrences:** 2 contexts — Disinheritance validity, Articulo Mortis status

**Source:** disinheritance.md, decedent.md

```typescript
/**
 * Reusable real-time validity indicator component.
 *
 * Displays a computed status badge ("Valid" / "Invalid") with
 * optional reason text. Updates reactively as form fields change.
 *
 * Used for:
 * 1. Disinheritance validity (disinheritance.md)
 *    - Mirrors step1_classify.rs:207-210 and step6_validation.rs:383-387
 * 2. Articulo mortis status (decedent.md)
 *    - Mirrors step1_classify.rs:226-231 and step5_legitimes.rs:431-436
 */
interface ValidityIndicatorProps {
  /** Whether the condition evaluates to valid/active. */
  isValid: boolean;
  /** Label for the valid state (e.g., "Valid Disinheritance", "Articulo Mortis Applies"). */
  validLabel: string;
  /** Label for the invalid state (e.g., "Invalid Disinheritance", "Standard Marriage"). */
  invalidLabel: string;
  /** Reasons for invalidity (shown when isValid=false). */
  reasons?: string[];
  /** Optional additional note. */
  note?: string;
  /** Visual style: "badge" for inline, "banner" for full-width warning. */
  variant?: "badge" | "banner";
}
```

**Computation functions:**

```typescript
// Disinheritance validity
// Mirrors: step1_classify.rs:207-210
// Mirrors: step6_validation.rs:383-387
function isDisinheritanceValid(d: {
  cause_specified_in_will: boolean;
  cause_proven: boolean;
  reconciliation_occurred: boolean;
}): boolean {
  return d.cause_specified_in_will && d.cause_proven && !d.reconciliation_occurred;
}

function getDisinheritanceInvalidityReasons(d: {
  cause_specified_in_will: boolean;
  cause_proven: boolean;
  reconciliation_occurred: boolean;
}): string[] {
  const reasons: string[] = [];
  if (!d.cause_specified_in_will) {
    reasons.push("Art. 916: Cause not specified in the will");
  }
  if (!d.cause_proven) {
    reasons.push("Art. 917: Cause not proven");
  }
  if (d.reconciliation_occurred) {
    reasons.push("Art. 922: Reconciliation occurred — disinheritance has no effect");
  }
  return reasons;
}

// Articulo mortis status
// Mirrors: step1_classify.rs:226-231 / step5_legitimes.rs:431-436
function isArticuloMortis(decedent: {
  marriage_solemnized_in_articulo_mortis: boolean;
  was_ill_at_marriage: boolean;
  illness_caused_death: boolean;
  years_of_cohabitation: number;
}): boolean {
  return (
    decedent.marriage_solemnized_in_articulo_mortis &&
    decedent.was_ill_at_marriage &&
    decedent.illness_caused_death &&
    decedent.years_of_cohabitation < 5
  );
}
```

---

## Component Dependency Graph

```
Tier 1 (Primitives)
├── MoneyInput          ← used by: estate, donations, legacies, output display
├── DateInput           ← used by: decedent, will, donations, adoption
├── FractionInput       ← used by: institutions, devises, output display
├── PersonPicker        ← used by: HeirReferenceForm, donations, person.children, adoption
└── EnumSelect          ← used by: all enum fields across all wizard steps

Tier 2 (Composites) — built FROM Tier 1
├── HeirReferenceForm   ← uses: PersonPicker, EnumSelect (is_collective)
│   └── used by: institutions, legacies, devises, disinheritances, substitutes
├── ConditionForm       ← uses: EnumSelect (type, status), text input
│   └── used by: institutions, legacies, devises
└── SubstituteForm      ← uses: EnumSelect (type, triggers), HeirReferenceForm
    └── used by: institutions, legacies, devises

Tier 3 (Utilities)
├── DispositionIdGenerator  ← used by: institutions, legacies, devises
└── ValidityIndicator       ← used by: disinheritances, articulo mortis
```

---

## Auto-Generated ID Components

Several wizard entities require auto-generated IDs hidden from the user:

| Entity | ID Field | Convention | Source |
|--------|----------|------------|--------|
| Decedent | `decedent.id` | Always `"d"` | decedent.md — all test cases use `"d"` |
| Person | `person.id` | `"lc1"`, `"sp"`, `"ic1"`, etc. | person.md — slug from relationship + index |
| Institution | `institution.id` | `"i1"`, `"i2"`, ... | institution-of-heir.md |
| Legacy | `legacy.id` | `"l1"`, `"l2"`, ... | legacy.md |
| Devise | `devise.id` | `"dev1"`, `"dev2"`, ... | devise.md |
| Donation | `donation.id` | `"don1"`, `"don2"`, ... | donation.md |

```typescript
/**
 * Auto-generate a person ID based on relationship and index.
 * Convention from test cases (generate-fuzz-cases.py:88-91).
 */
function generatePersonId(
  relationship: Relationship,
  index: number,
  existingIds: Set<string>
): string {
  const prefixes: Partial<Record<Relationship, string>> = {
    LegitimateChild: "lc",
    LegitimatedChild: "ltc",
    AdoptedChild: "ac",
    IllegitimateChild: "ic",
    SurvivingSpouse: "sp",
    LegitimateParent: "lp",
    LegitimateAscendant: "la",
    Sibling: "sib",
    NephewNiece: "nn",
    OtherCollateral: "oc",
    Stranger: "str",
  };
  const prefix = prefixes[relationship] ?? "p";
  let id = `${prefix}${index}`;
  let counter = index;
  while (existingIds.has(id)) {
    counter++;
    id = `${prefix}${counter}`;
  }
  return id;
}
```

---

## Repeater Pattern

Multiple wizard steps use a **dynamic list (repeater)** pattern. These share a common
interaction model:

| Repeater | Array Field | Item Sub-Form | Min Items | Wizard Step |
|----------|-----------|---------------|-----------|-------------|
| Family members | `family_tree` | Person form | 0 (warn if empty) | Family Tree |
| Institutions | `will.institutions` | InstitutionOfHeir form | 0 | Will |
| Legacies | `will.legacies` | Legacy form | 0 | Will |
| Devises | `will.devises` | Devise form | 0 | Will |
| Disinheritances | `will.disinheritances` | Disinheritance form | 0 | Will |
| Donations | `donations` | Donation form | 0 | Donations |
| Conditions | `disposition.conditions` | ConditionForm | 0 | Will (nested) |
| Substitutes | `disposition.substitutes` | SubstituteForm | 0 | Will (nested) |
| Children refs | `person.children` | PersonPicker (multi-select) | 0 | Family Tree (nested) |

```typescript
/**
 * Generic repeater component spec.
 *
 * Behavior:
 * - "Add {Item}" button at bottom
 * - Each item has a remove button (trash icon)
 * - Items can be reordered (drag-to-reorder for legacies/institutions
 *   where array order affects FP distribution)
 * - Auto-generates ID for new items (where applicable)
 * - Collapsed/expanded state per item for space efficiency
 */
interface RepeaterProps<T> {
  /** Current array of items. */
  items: T[];
  /** Callback when items change (add, remove, reorder, edit). */
  onChange: (items: T[]) => void;
  /** Factory for creating a new default item. */
  createDefault: () => T;
  /** Render function for each item. */
  renderItem: (item: T, index: number, onChange: (item: T) => void) => React.ReactNode;
  /** Label for the "Add" button (e.g., "Add Institution", "Add Legacy"). */
  addLabel: string;
  /** Maximum items allowed (optional). */
  maxItems?: number;
  /** Whether items can be reordered (affects FP distribution order). */
  reorderable?: boolean;
  /** Whether items start collapsed. */
  defaultCollapsed?: boolean;
  /** Item-level errors from Zod validation. */
  errors?: Array<Record<string, string> | undefined>;
}
```

---

## Cross-Step Data Dependencies

Shared components need access to data from other wizard steps. These are the
cross-step data flows that component instances depend on:

| Source Step | Data | Consumer Components | Source Analysis |
|------------|------|-------------------|----------------|
| Family Tree (3) | `family_tree` persons | PersonPicker in Will & Donations steps | conditional-visibility.md §5 |
| Decedent (2) | `decedent.id` | Adoption.adopter auto-fill | adoption.md |
| Decedent (2) | `decedent.date_of_death` | DateInput max constraint on will/donation dates | will.md, donation.md |
| Decedent (2) | `decedent.has_legal_separation` | PersonPicker filter for guilty_party visibility | person.md |
| Decedent (2) | `decedent.is_married` | SurvivingSpouse availability hint | conditional-visibility.md §2 |
| Family Tree (3) | Person.relationship | DisinheritanceCause filter | disinheritance.md |
| Family Tree (3) | Existing person IDs | DispositionIdGenerator exclusion | person.md |

**Implementation note:** These dependencies suggest the wizard should use a shared
form state (e.g., React Context or Zustand store) so that cross-step data flows
naturally to shared components without prop drilling.

---

## Output-Specific Display Components

The results view reuses MoneyInput (read-only mode) and FractionInput (read-only mode)
but also needs output-specific display components:

| Component | Context | Source |
|-----------|---------|--------|
| MoneyInput (readOnly) | 7 Money fields per InheritanceShare | engine-output.md |
| FractionInput (readOnly) | legitime_fraction per share | engine-output.md |
| ValidityIndicator (banner) | ManualFlag warnings | engine-output.md |
| EnumSelect (display-only) | EffectiveCategory, SuccessionType, ScenarioCode badges | engine-output.md |
| NarrativeRenderer | HeirNarrative.text with Markdown bold | engine-output.md |

```typescript
/**
 * Renders HeirNarrative.text which contains Markdown bold markers.
 * Origin: step10_finalize.rs:358-448 — generate_heir_narrative()
 *
 * The narrative text uses **bold** for names and amounts.
 * The renderer should parse minimal Markdown (just bold markers)
 * and render as rich text.
 */
interface NarrativeRendererProps {
  /** The narrative text with Markdown bold markers. */
  text: string;
}
```
