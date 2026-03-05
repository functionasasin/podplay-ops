# Adoption — Frontend Spec

> Rust source: `types.rs:333–342` (struct Adoption), `types.rs:121–124` (enum AdoptionRegime)
> Consumed by: `step1_classify.rs:60–61, 85–90, 182–190, 212–218` (validity + eligibility gate)
> Legal basis: RA 8552 Sec. 17 (adopted = legitimate), RA 8552 Sec. 20 (rescission removes rights)

## TypeScript Types

```typescript
/**
 * Adoption regime under which the adoption decree was issued.
 * Maps 1:1 to Rust `AdoptionRegime` enum (types.rs:121–124).
 *
 * JSON serialization: PascalCase variant names verbatim (serde derive).
 * Note: "Ra8552" and "Ra11642" keep the "Ra" prefix as-is.
 */
export type AdoptionRegime =
  | "Ra8552"   // Domestic Adoption Act of 1998 (judicial process)
  | "Ra11642"; // Domestic Administrative Adoption Act of 2022 (administrative process)

/**
 * Adoption decree record attached to a Person with relationship = "AdoptedChild".
 * Maps 1:1 to Rust `Adoption` struct (types.rs:333–342).
 *
 * Required when relationship_to_decedent === "AdoptedChild".
 * The engine REJECTS an AdoptedChild with no adoption record (step1_classify.rs:189).
 *
 * RA 8552 Sec. 17: adopted child has ALL rights of a legitimate child.
 * RA 8552 Sec. 20: rescinded adoption strips succession rights entirely.
 */
export interface Adoption {
  /** ISO-8601 date: "YYYY-MM-DD". Date the court (RA 8552) or NACC (RA 11642) issued the decree. */
  decree_date: string;

  /** Which adoption law governs this decree. */
  regime: AdoptionRegime;

  /**
   * PersonId of the adopting parent.
   * In practice, this will always be the decedent's ID (since the engine only
   * processes adoptions by the decedent). Frontend should auto-fill from decedent.id.
   */
  adopter: string;

  /**
   * PersonId of the adoptee.
   * In practice, always the same as the containing Person's id.
   * Frontend should auto-fill from the Person's id field.
   */
  adoptee: string;

  /**
   * True if this is a stepparent adoption (adopter is the spouse of one biological parent).
   * When true, biological_parent_spouse must be set.
   * Tracked as `is_stepparent_adoptee` on the Heir (step1_classify.rs:87–90).
   */
  is_stepparent_adoption: boolean;

  /**
   * PersonId of the biological parent who is also the decedent's spouse.
   * Required when is_stepparent_adoption === true, null otherwise.
   * Must reference an existing Person in family_tree with relationship = "SurvivingSpouse".
   */
  biological_parent_spouse: string | null;

  /**
   * True if the adoption decree was subsequently rescinded.
   * Rescinded adoption → AdoptedChild becomes INELIGIBLE (RA 8552 Sec. 20,
   * step1_classify.rs:182–186).
   */
  is_rescinded: boolean;

  /**
   * ISO-8601 date: "YYYY-MM-DD". Date the rescission was granted.
   * Required when is_rescinded === true, null otherwise.
   */
  rescission_date: string | null;
}
```

## Zod Schemas

```typescript
import { z } from "zod";

/**
 * Zod schema for AdoptionRegime enum.
 * Origin: types.rs:121–124 — serde derives produce PascalCase variant names.
 * Values must match EXACTLY (case-sensitive).
 */
export const AdoptionRegimeSchema = z.enum(["Ra8552", "Ra11642"]);
// Origin: types.rs:121–124

/**
 * Zod schema for the Adoption struct.
 * Origin: types.rs:333–342
 *
 * Cross-field validation is applied via .superRefine():
 *   - is_stepparent_adoption = true → biological_parent_spouse must be non-null
 *   - is_rescinded = true → rescission_date must be non-null ISO-8601 date
 *   - rescission_date must be after decree_date (if both provided)
 */
export const AdoptionSchema = z
  .object({
    // Origin: types.rs:334 — ISO-8601 Date string
    decree_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Decree date must be YYYY-MM-DD"),

    // Origin: types.rs:335 — AdoptionRegime enum
    regime: AdoptionRegimeSchema,

    // Origin: types.rs:336 — PersonId (non-empty string referencing a person)
    adopter: z.string().min(1, "Adopter ID is required"),

    // Origin: types.rs:337 — PersonId (non-empty string)
    adoptee: z.string().min(1, "Adoptee ID is required"),

    // Origin: types.rs:338 — bool
    is_stepparent_adoption: z.boolean(),

    // Origin: types.rs:339 — Option<PersonId>; required when is_stepparent_adoption = true
    biological_parent_spouse: z.string().nullable(),

    // Origin: types.rs:340 — bool; RA 8552 Sec. 20
    is_rescinded: z.boolean(),

    // Origin: types.rs:341 — Option<Date>; required when is_rescinded = true
    rescission_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Rescission date must be YYYY-MM-DD")
      .nullable(),
  })
  .superRefine((val, ctx) => {
    // Origin: step1_classify.rs:87–90 — biological_parent_spouse is only meaningful
    // when is_stepparent_adoption = true. Engine carries the flag forward.
    if (val.is_stepparent_adoption && !val.biological_parent_spouse) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["biological_parent_spouse"],
        message:
          "Biological parent/spouse must be specified for stepparent adoptions",
      });
    }

    // Origin: step1_classify.rs:182–186 (RA 8552 Sec. 20): rescission strips rights.
    // rescission_date needed for audit trail; engine does not validate the date itself
    // but frontend should require it for legal completeness.
    if (val.is_rescinded && !val.rescission_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rescission_date"],
        message: "Rescission date is required when adoption is rescinded",
      });
    }

    // Logical ordering: rescission must be after decree
    if (val.is_rescinded && val.rescission_date && val.decree_date) {
      if (val.rescission_date <= val.decree_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rescission_date"],
          message: "Rescission date must be after the adoption decree date",
        });
      }
    }
  });
```

## Field Metadata Table

All fields appear in the **Adoption Sub-Form** nested inside the Person entry form
in the **Family Tree** wizard step. The sub-form is conditionally visible only when
`relationship_to_decedent === "AdoptedChild"`.

| Field | Label | Input Type | Default | Conditional Visibility | Required | Validation Error | Wizard Step |
|-------|-------|-----------|---------|----------------------|----------|-----------------|-------------|
| `decree_date` | Adoption Decree Date | `date` | `""` | Always (within sub-form) | Yes | "Decree date is required" / "Must be YYYY-MM-DD" | Family Tree |
| `regime` | Adoption Regime | `select` (2 options) | `"Ra8552"` | Always (within sub-form) | Yes | "Adoption regime is required" | Family Tree |
| `adopter` | Adopter (auto-filled) | `hidden` / read-only text | Decedent ID | Always (within sub-form) | Yes (auto) | — | Family Tree |
| `adoptee` | Adoptee (auto-filled) | `hidden` / read-only text | This Person's ID | Always (within sub-form) | Yes (auto) | — | Family Tree |
| `is_stepparent_adoption` | Stepparent Adoption? | `toggle` | `false` | Always (within sub-form) | Yes | — | Family Tree |
| `biological_parent_spouse` | Biological Parent/Spouse | `select` (from SurvivingSpouse heirs) | `null` | Show when `is_stepparent_adoption === true` | Conditional | "Required for stepparent adoptions" | Family Tree |
| `is_rescinded` | Adoption Rescinded? | `toggle` | `false` | Always (within sub-form) | Yes | — | Family Tree |
| `rescission_date` | Rescission Date | `date` | `null` | Show when `is_rescinded === true` | Conditional | "Required when adoption is rescinded" | Family Tree |

## Conditional Visibility Logic

```typescript
// In the Person sub-form within the Family Tree step:

const showAdoptionForm =
  person.relationship_to_decedent === "AdoptedChild";

// Within AdoptionForm:
const showBiologicalParentSpouse =
  adoption.is_stepparent_adoption === true;

const showRescissionDate =
  adoption.is_rescinded === true;

// UI layout:
// [AdoptedChild selected]
//   → show: AdoptionForm
//     ├─ decree_date (date picker)
//     ├─ regime (select: Ra8552 | Ra11642)
//     ├─ is_stepparent_adoption (toggle)
//     │   [is_stepparent_adoption = true]
//     │     → show: biological_parent_spouse (person picker, SurvivingSpouse only)
//     ├─ is_rescinded (toggle)
//         [is_rescinded = true]
//           → show: rescission_date (date picker)
//           → WARNING: "Rescinded adoption — this heir loses succession rights (RA 8552 Sec. 20)"
```

## AdoptionRegime Select Options

```typescript
export const ADOPTION_REGIME_OPTIONS: Array<{
  value: AdoptionRegime;
  label: string;
  description: string;
}> = [
  {
    value: "Ra8552",
    label: "RA 8552 — Domestic Adoption Act of 1998",
    description: "Judicial adoption process through Family Court",
  },
  {
    value: "Ra11642",
    label: "RA 11642 — Domestic Administrative Adoption Act of 2022",
    description: "Administrative adoption process through NACC",
  },
];
```

## Engine Eligibility Logic

```
// step1_classify.rs:183–190 — check_eligibility() for AdoptedChild:
//
//   if category == HeirCategory::AdoptedChild:
//     if person.adoption is None       → is_eligible = false   (no record)
//     if adoption.is_rescinded = true  → is_eligible = false   (RA 8552 Sec. 20)
//     otherwise                        → is_eligible = true
//
// step1_classify.rs:212–218 — is_adoption_valid():
//
//   match person.adoption:
//     Some(adoption) → !adoption.is_rescinded
//     None           → false
//
// RA 8552 Sec. 17 (step1_classify.rs:319–325 test comment):
//   Adopted child → EffectiveCategory::LegitimateChildGroup
//   (same shares as LegitimateChild and LegitimatedChild)
```

## Eligibility Matrix

| Condition | `has_valid_adoption` | `is_eligible` | Engine result |
|-----------|---------------------|---------------|---------------|
| `adoption` = null | `false` | `false` | Excluded entirely |
| `is_rescinded` = false | `true` | `true` | Full LC-group share |
| `is_rescinded` = true | `false` | `false` | Excluded (RA 8552 Sec. 20) |

## Adoption Sub-Form Default State

```typescript
// Default Adoption object when user selects relationship = "AdoptedChild":
const DEFAULT_ADOPTION: Adoption = {
  decree_date: "",
  regime: "Ra8552",           // Most common (pre-2022 adoptions)
  adopter: decedent.id,       // Auto-filled from decedent
  adoptee: person.id,         // Auto-filled from this Person
  is_stepparent_adoption: false,
  biological_parent_spouse: null,
  is_rescinded: false,
  rescission_date: null,
};
```

## Edge Cases

### 1. Missing adoption record for AdoptedChild
If a user sets `relationship = "AdoptedChild"` but leaves `adoption = null`,
the engine marks the heir **ineligible** (`step1_classify.rs:189`). Frontend
must require the adoption sub-form to be completed before submission.

### 2. Rescinded adoption — UI warning
When `is_rescinded = true`, the frontend should display a prominent warning:
> "Rescinded adoption: this heir loses all succession rights under RA 8552 Sec. 20."

The heir will still appear in the results view with a zero share and an explanation.

### 3. Stepparent adoption — biological_parent_spouse picker
`biological_parent_spouse` must reference a PersonId already in the `family_tree`
with `relationship = "SurvivingSpouse"`. The picker should be filtered to only
show SurvivingSpouse persons. If no SurvivingSpouse exists in the family tree,
the `is_stepparent_adoption` toggle should be disabled with a tooltip:
> "A surviving spouse must be added to the family tree first."

### 4. RA 11642 and retroactive_ra_11642 config
`EngineConfig.retroactive_ra_11642` (engine-config.md) is a forward-looking flag
for RA 11642 retroactivity — the engine does NOT currently act on it in any pipeline
step. The regime field on Adoption is independent of this config flag. A decree under
RA 11642 is simply recorded as `regime: "Ra11642"` regardless of the config flag.

### 5. adopter / adoptee auto-fill
In practice, the adopter is always the decedent and the adoptee is always the
Person being entered. The engine does not validate this relationship — the fields
exist for audit trail. Frontend should auto-fill both and hide them from the user
(or show as read-only), preventing data entry errors.

### 6. Adopted child as LegitimateChildGroup member
The adoption sub-form affects classification only through the eligibility gate.
Once eligible, an adopted child competes for shares identically to a legitimate
child (same EffectiveCategory, same legitime fraction). No special share calculation
is needed on the frontend results view.

## Test Case Evidence

From `examples/cases/17-adopted-child.json`:
```json
{
  "id": "ac1",
  "name": "Adopted Child",
  "relationship_to_decedent": "AdoptedChild",
  "degree": 1,
  "filiation_proved": true,
  "filiation_proof_type": null,
  "adoption": {
    "decree_date": "2015-01-01",
    "regime": "Ra8552",
    "adopter": "d",
    "adoptee": "ac1",
    "is_stepparent_adoption": false,
    "biological_parent_spouse": null,
    "is_rescinded": false,
    "rescission_date": null
  }
}
```

Pattern observed:
- `regime` = `"Ra8552"` — only regime seen in test cases (RA 11642 has zero coverage)
- `adopter` = decedent ID, `adoptee` = self ID — confirms auto-fill design
- `filiation_proof_type` = null for AdoptedChild (proof type is IC-only)
- The adopted child and a biological LC share the estate equally (I1 scenario)

## Rust → TS Mapping Notes

| Rust | TypeScript | JSON | Notes |
|------|-----------|------|-------|
| `AdoptionRegime::Ra8552` | `"Ra8552"` | `"Ra8552"` | PascalCase, literal digits retained |
| `AdoptionRegime::Ra11642` | `"Ra11642"` | `"Ra11642"` | PascalCase, literal digits retained |
| `Adoption.decree_date: Date` | `string` | `"YYYY-MM-DD"` | ISO-8601 string; no special wrapper |
| `Adoption.adopter: PersonId` | `string` | `"d"` | References decedent.id |
| `Adoption.adoptee: PersonId` | `string` | `"ac1"` | References Person.id |
| `Adoption.biological_parent_spouse: Option<PersonId>` | `string \| null` | `null` or string | Null when not stepparent |
| `Adoption.rescission_date: Option<Date>` | `string \| null` | `null` or `"YYYY-MM-DD"` | Null when not rescinded |
| `Person.adoption: Option<Adoption>` | `Adoption \| null` | `null` or object | Null for non-AdoptedChild persons |
