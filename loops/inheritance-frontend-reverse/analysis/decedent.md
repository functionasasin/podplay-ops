# decedent — Decedent Struct Analysis

> **Rust source:** `../inheritance-rust-forward/src/types.rs:297-310`
> **Pipeline consumers:** Step 1 (`step1_classify.rs:64-68`), Step 3 (`step3_scenario.rs:133`), Step 5 (`step5_legitimes.rs:373-376`), Step 10 (metadata/narrative)
> **Key logic:** `is_articulo_mortis()` — duplicated at `step1_classify.rs:226-231` and `step5_legitimes.rs:431-436`

## Rust Definition

```rust
// types.rs:297-310
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Decedent {
    pub id: PersonId,
    pub name: String,
    pub date_of_death: Date,
    pub is_married: bool,
    pub date_of_marriage: Option<Date>,
    pub marriage_solemnized_in_articulo_mortis: bool,
    pub was_ill_at_marriage: bool,
    pub illness_caused_death: bool,
    pub years_of_cohabitation: i32,
    pub has_legal_separation: bool,
    pub is_illegitimate: bool,
}
```

**Serde config:** Standard `#[derive(Serialize, Deserialize)]` — no `rename_all`, no `default`, no custom attributes. All field names are snake_case in JSON. All fields required at JSON level (no `Option` except `date_of_marriage`).

## TypeScript Interface

```typescript
// Mirrors: ../inheritance-rust-forward/src/types.rs:297-310
export interface Decedent {
  /** Unique identifier for the decedent. */
  id: string;

  /** Full name of the decedent. */
  name: string;

  /** Date of death (ISO-8601 string, e.g. "2026-01-15"). */
  date_of_death: string;

  /**
   * Whether the decedent was married at time of death.
   *
   * NOTE: This field is NOT directly consumed by any pipeline computation step.
   * Spouse presence is determined from family_tree (SurvivingSpouse relationship).
   * However, the field is required in JSON and should gate the marriage sub-section
   * in the wizard UI. When true, the user should add a SurvivingSpouse to family_tree.
   */
  is_married: boolean;

  /** Date of marriage (ISO-8601 string). null when is_married is false. */
  date_of_marriage: string | null;

  /**
   * Whether the marriage was solemnized while the decedent was at the point of death.
   * Part of the 4-field articulo mortis test (Art. 900).
   *
   * Pipeline: step1_classify.rs:226, step5_legitimes.rs:431
   */
  marriage_solemnized_in_articulo_mortis: boolean;

  /**
   * Whether the decedent was already ill at the time of marriage.
   * Part of the 4-field articulo mortis test (Art. 900).
   *
   * Pipeline: step1_classify.rs:228, step5_legitimes.rs:433
   */
  was_ill_at_marriage: boolean;

  /**
   * Whether the illness the decedent had at marriage caused the death.
   * Part of the 4-field articulo mortis test (Art. 900).
   *
   * Pipeline: step1_classify.rs:229, step5_legitimes.rs:434
   */
  illness_caused_death: boolean;

  /**
   * Years of cohabitation between decedent and spouse.
   * Part of the 4-field articulo mortis test: must be < 5 for reduction to apply.
   *
   * Pipeline: step1_classify.rs:230, step5_legitimes.rs:435
   */
  years_of_cohabitation: number;

  /**
   * Whether the decedent had a legal separation decree.
   *
   * NOTE: This field is NOT directly consumed by any pipeline computation step.
   * Actual legal separation exclusion operates on Person.is_guilty_party_in_legal_separation
   * (heir-side, step1_classify.rs:195). This field exists for informational/narrative purposes
   * and to gate the guilty-party question on the spouse Person entry.
   */
  has_legal_separation: boolean;

  /**
   * Whether the decedent was illegitimate (born out of wedlock).
   * Drives Art. 903 scenarios: T14 (illegitimate decedent + ascendants only)
   * and T15 (illegitimate decedent + ascendants + spouse).
   *
   * Pipeline: step3_scenario.rs:133 — selects T14/T15 over Regime B
   */
  is_illegitimate: boolean;
}
```

## Zod Schema

```typescript
import { z } from "zod";

// Mirrors: ../inheritance-rust-forward/src/types.rs:297-310
// Validation sources documented per-field below.

/** ISO-8601 date string validation. */
const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be in YYYY-MM-DD format" });

export const DecedentSchema = z.object({
  // --- Identity fields (record-keeping, not consumed by pipeline computation) ---

  /** Required by serde deserialization at types.rs:299. */
  id: z.string().min(1, { message: "Decedent ID is required" }),

  /** Required by serde deserialization at types.rs:300. */
  name: z.string().min(1, { message: "Decedent name is required" }),

  /**
   * Required by serde deserialization at types.rs:301.
   * Stored for narrative/metadata purposes. Not consumed by any pipeline step.
   */
  date_of_death: DateSchema,

  // --- Marriage fields ---

  /**
   * Required by serde deserialization at types.rs:302.
   * Not consumed by pipeline — spouse presence comes from family_tree.
   * Frontend uses this to gate marriage sub-section visibility.
   */
  is_married: z.boolean(),

  /**
   * types.rs:303 — Option<Date>, serializes as string or null.
   * Required when is_married is true (frontend validation, not engine-enforced).
   */
  date_of_marriage: DateSchema.nullable(),

  // --- Articulo mortis fields (Art. 900) ---
  // All four fields evaluated together by is_articulo_mortis() at:
  //   step1_classify.rs:226-231 and step5_legitimes.rs:431-436
  // Effect: when all four conditions hold, surviving spouse's legitime reduced
  //   from E/2 to E/3 in scenario T12 (step5_legitimes.rs:373-376)

  /**
   * types.rs:304 — bool, required.
   * Articulo mortis condition 1 of 4.
   */
  marriage_solemnized_in_articulo_mortis: z.boolean(),

  /**
   * types.rs:305 — bool, required.
   * Articulo mortis condition 2 of 4.
   */
  was_ill_at_marriage: z.boolean(),

  /**
   * types.rs:306 — bool, required.
   * Articulo mortis condition 3 of 4.
   */
  illness_caused_death: z.boolean(),

  /**
   * types.rs:307 — i32, required.
   * Articulo mortis condition 4 of 4: cohabitation must be < 5 years for reduction.
   * Frontend validation: non-negative integer (engine has no explicit range check,
   * but negative years are nonsensical).
   */
  years_of_cohabitation: z
    .number()
    .int({ message: "Years of cohabitation must be a whole number" })
    .nonnegative({ message: "Years of cohabitation cannot be negative" }),

  // --- Other status fields ---

  /**
   * types.rs:308 — bool, required.
   * Not consumed by pipeline computation (see analysis notes).
   * Gates the guilty-party question on spouse Person in UI.
   */
  has_legal_separation: z.boolean(),

  /**
   * types.rs:309 — bool, required.
   * Consumed by step3_scenario.rs:133 — selects T14/T15 over Regime B for
   * illegitimate decedent with ascendants (Art. 903).
   */
  is_illegitimate: z.boolean(),
}).superRefine((data, ctx) => {
  // Cross-field validation: date_of_marriage required when married
  // Not enforced by engine (Option<Date> allows null even when is_married=true),
  // but semantically required by frontend.
  if (data.is_married && data.date_of_marriage === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["date_of_marriage"],
      message: "Date of marriage is required when decedent was married",
    });
  }

  // Cross-field validation: articulo mortis fields only meaningful when married
  // Not enforced by engine — these are just booleans that happen to be false when unmarried.
  // Frontend should not error, but should visually disable these fields when unmarried.

  // Cross-field validation: illness_caused_death only meaningful when was_ill_at_marriage
  // Again, not engine-enforced, but frontend should disable this field when was_ill=false.
});

export type Decedent = z.infer<typeof DecedentSchema>;
```

## Field Metadata Table

| Field | Label | Input Type | Required | Default | Conditional Visibility | Wizard Step | Validation Error |
|-------|-------|-----------|----------|---------|----------------------|-------------|------------------|
| `id` | (auto-generated) | hidden | Yes | `"d"` (auto-generated) | Never shown to user | 2: Decedent | — |
| `name` | Decedent's Full Name | text | Yes | — | Always visible | 2: Decedent | "Decedent name is required" |
| `date_of_death` | Date of Death | DateInput | Yes | — | Always visible | 2: Decedent | "Date must be in YYYY-MM-DD format" |
| `is_married` | Was the decedent married? | toggle | Yes | `false` | Always visible | 2: Decedent | — |
| `date_of_marriage` | Date of Marriage | DateInput | When married | `null` | Visible when `is_married === true` | 2: Decedent | "Date of marriage is required when decedent was married" |
| `marriage_solemnized_in_articulo_mortis` | Was the marriage solemnized at the point of death (articulo mortis)? | toggle | Yes | `false` | Visible when `is_married === true` | 2: Decedent | — |
| `was_ill_at_marriage` | Was the decedent ill at the time of marriage? | toggle | Yes | `false` | Visible when `marriage_solemnized_in_articulo_mortis === true` | 2: Decedent | — |
| `illness_caused_death` | Did the illness at marriage cause the death? | toggle | Yes | `false` | Visible when `was_ill_at_marriage === true` | 2: Decedent | — |
| `years_of_cohabitation` | Years of cohabitation with spouse | number (integer) | Yes | `0` | Visible when `is_married === true` | 2: Decedent | "Years of cohabitation must be a whole number" / "Years of cohabitation cannot be negative" |
| `has_legal_separation` | Was there a legal separation? | toggle | Yes | `false` | Visible when `is_married === true` | 2: Decedent | — |
| `is_illegitimate` | Was the decedent born out of wedlock (illegitimate)? | toggle | Yes | `false` | Always visible | 2: Decedent | — |

## Pipeline Consumption Detail

The `decedent` field from `EngineInput` is cloned into pipeline step inputs:

| Step | Input Struct Field | Fields Actually Read | Purpose |
|------|-------------------|---------------------|---------|
| Step 1 (`step1_classify.rs`) | `Step1Input.decedent` | `marriage_solemnized_in_articulo_mortis`, `was_ill_at_marriage`, `illness_caused_death`, `years_of_cohabitation` | `is_articulo_mortis()` check → stamps `Heir.articulo_mortis_marriage` on spouse (line 64-68, 92) |
| Step 3 (`step3_scenario.rs`) | `Step3Input.decedent` | `is_illegitimate` | Selects T14/T15 scenario codes when illegitimate decedent has ascendants (line 133) |
| Step 5 (`step5_legitimes.rs`) | `Step5Input.decedent` | `marriage_solemnized_in_articulo_mortis`, `was_ill_at_marriage`, `illness_caused_death`, `years_of_cohabitation` | `is_articulo_mortis()` check → reduces spouse legitime from E/2 to E/3 in T12 (line 373-376) |
| Step 10 (`step10_finalize.rs`) | `Step10Input.decedent` | (carried for metadata/narrative) | Output packaging |

### `is_articulo_mortis()` — The Key Computation

```rust
// step1_classify.rs:226-231 (and identical copy at step5_legitimes.rs:431-436)
pub fn is_articulo_mortis(decedent: &Decedent) -> bool {
    decedent.marriage_solemnized_in_articulo_mortis
        && decedent.was_ill_at_marriage
        && decedent.illness_caused_death
        && decedent.years_of_cohabitation < 5
}
```

All four conditions must be **simultaneously true** for the articulo mortis reduction to apply. The effect is:
- **T12 (Spouse only):** Spouse legitime reduced from `E/2` to `E/3` (Art. 900)
- **Other scenarios with spouse:** The `Heir.articulo_mortis_marriage` flag is stamped but not currently used outside T12

### `is_illegitimate` — Art. 903 Branching

```rust
// step3_scenario.rs:130-140
if decedent.is_illegitimate && has_asc {
    let code = if has_spouse {
        ScenarioCode::T15  // Illegitimate decedent: parents + spouse
    } else {
        ScenarioCode::T14  // Illegitimate decedent: parents only
    };
    return (code, warnings);
}
```

This overrides the normal Regime B scenario selection. T14/T15 compute different legitime fractions under Art. 903:
- **T14:** Parents collective = `E/2`, free portion = `E/2`
- **T15:** Parents = `E/4`, Spouse = `E/4`, free portion = `E/2` (but spouse gets from FP too)

## Field Activity Classification

### Actively Drive Computation

| Field | Where | Effect |
|-------|-------|--------|
| `is_illegitimate` | `step3_scenario.rs:133` | Selects T14/T15 scenario codes (Art. 903) |
| `marriage_solemnized_in_articulo_mortis` | `step1_classify.rs:227`, `step5_legitimes.rs:432` | Articulo mortis condition 1/4 |
| `was_ill_at_marriage` | `step1_classify.rs:228`, `step5_legitimes.rs:433` | Articulo mortis condition 2/4 |
| `illness_caused_death` | `step1_classify.rs:229`, `step5_legitimes.rs:434` | Articulo mortis condition 3/4 |
| `years_of_cohabitation` | `step1_classify.rs:230`, `step5_legitimes.rs:435` | Articulo mortis condition 4/4 (threshold: < 5) |

### Present But Not Consumed by Computation

| Field | Notes |
|-------|-------|
| `id` | Identity field. Always `"d"` in test cases. Auto-generated by frontend. |
| `name` | Identity field. Used in narratives/display only. |
| `date_of_death` | Record-keeping. Not read by any pipeline step computation. |
| `is_married` | **Not read by any pipeline step.** Spouse existence determined from `family_tree` (presence of a `SurvivingSpouse` relationship). Frontend uses it to gate marriage sub-section. |
| `date_of_marriage` | Record-keeping only. Not read by any pipeline step. |
| `has_legal_separation` | **Not read by any pipeline step.** Actual legal separation exclusion operates on `Person.is_guilty_party_in_legal_separation` (step1_classify.rs:195, Art. 1002). Frontend uses it to gate the guilty-party question on the spouse Person. |

## Wizard Step 2: Decedent Details — Layout Spec

### Section 1: Identity (always visible)

```
┌──────────────────────────────────────┐
│ Decedent's Full Name    [text input] │
│ Date of Death           [date input] │
└──────────────────────────────────────┘
```

### Section 2: Legitimacy (always visible)

```
┌──────────────────────────────────────┐
│ Was the decedent born out of         │
│ wedlock (illegitimate)?    [toggle]  │
│                                      │
│ ⓘ Affects inheritance shares for     │
│   parents/ascendants under Art. 903  │
└──────────────────────────────────────┘
```

### Section 3: Marriage (always visible, sub-fields conditional)

```
┌──────────────────────────────────────┐
│ Was the decedent married?  [toggle]  │
│                                      │
│ ┌─ if is_married ──────────────────┐ │
│ │ Date of Marriage    [date input] │ │
│ │ Years of Cohabitation [number]   │ │
│ │                                  │ │
│ │ Legal Separation?      [toggle]  │ │
│ │ ⓘ The guilty party is set on the │ │
│ │   spouse in the Family Tree step │ │
│ │                                  │ │
│ │ ┌─ Articulo Mortis (Art. 900) ─┐ │ │
│ │ │ Marriage at point of death?   │ │ │
│ │ │                    [toggle]   │ │ │
│ │ │                               │ │ │
│ │ │ ┌─ if articulo mortis ──────┐ │ │ │
│ │ │ │ Ill at time of marriage?  │ │ │ │
│ │ │ │               [toggle]    │ │ │ │
│ │ │ │                           │ │ │ │
│ │ │ │ ┌─ if was_ill ──────────┐ │ │ │ │
│ │ │ │ │ Illness caused death? │ │ │ │ │
│ │ │ │ │           [toggle]    │ │ │ │ │
│ │ │ │ └──────────────────────┘ │ │ │ │
│ │ │ └─────────────────────────┘ │ │ │
│ │ │                               │ │ │
│ │ │ ⓘ All 4 conditions + <5 yrs  │ │ │
│ │ │   cohabitation = spouse       │ │ │
│ │ │   legitime reduced E/2 → E/3  │ │ │
│ │ └──────────────────────────────┘ │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

### Articulo Mortis Status Indicator

When `is_married === true`, display a computed badge:

```typescript
// Mirrors: step1_classify.rs:226-231 / step5_legitimes.rs:431-436
function isArticuloMortis(decedent: Decedent): boolean {
  return (
    decedent.marriage_solemnized_in_articulo_mortis &&
    decedent.was_ill_at_marriage &&
    decedent.illness_caused_death &&
    decedent.years_of_cohabitation < 5
  );
}
```

When `isArticuloMortis()` returns true, show a warning badge:
> "Articulo mortis marriage detected — surviving spouse's legitime will be reduced under Art. 900."

## Edge Cases & Gotchas

### 1. `is_married` Does Not Gate Spouse Inheritance

The engine determines spouse inheritance solely from the presence of a `Person` with `relationship_to_decedent: "SurvivingSpouse"` in `family_tree`. Setting `is_married: false` while including a surviving spouse person will still result in the spouse inheriting. The frontend should enforce consistency:
- When `is_married` is toggled off, warn if a SurvivingSpouse exists in family_tree
- When `is_married` is toggled on, prompt user to add a SurvivingSpouse in the Family Tree step

### 2. `has_legal_separation` Is Informational Only on Decedent

The decedent-level `has_legal_separation` field does **not** directly exclude the spouse. Exclusion happens via `Person.is_guilty_party_in_legal_separation` on the spouse person (step1_classify.rs:195, Art. 1002). The frontend should:
- When `has_legal_separation` is toggled on, add an info note directing user to mark the guilty party on the spouse in the Family Tree step
- Do NOT auto-exclude the spouse based on this field alone

### 3. Articulo Mortis Is All-Or-Nothing

All four conditions must hold simultaneously. If any one is false, the standard spouse legitime applies. The frontend should cascade the toggle visibility:
- `was_ill_at_marriage` only shown when `marriage_solemnized_in_articulo_mortis === true`
- `illness_caused_death` only shown when `was_ill_at_marriage === true`
- `years_of_cohabitation` is always visible when married (used independently for context), but the `< 5` threshold only matters for articulo mortis

### 4. `years_of_cohabitation` Threshold

The threshold is **strictly less than 5** (`< 5`, not `<= 5`). So:
- 0, 1, 2, 3, 4 years → articulo mortis can apply (if other conditions met)
- 5+ years → articulo mortis does NOT apply, even if all boolean conditions are true

Test case values observed: `0` (default), `1` (testate case 11), `4` and `5` (Rust unit tests for boundary testing).

### 5. `id` Field — Auto-Generated

All test cases use `"d"` as the decedent ID. The frontend should auto-generate this (e.g., always `"d"`) and hide it from the user. The ID is used internally for cross-referencing (e.g., `Adoption.adopter` may reference it).

### 6. Default Values for Clean State

When initializing the wizard, all boolean fields on Decedent default to `false`, and `years_of_cohabitation` defaults to `0`. This corresponds to the simplest case: an unmarried, legitimate decedent with no special circumstances. The default JSON:

```json
{
  "id": "d",
  "name": "",
  "date_of_death": "",
  "is_married": false,
  "date_of_marriage": null,
  "marriage_solemnized_in_articulo_mortis": false,
  "was_ill_at_marriage": false,
  "illness_caused_death": false,
  "years_of_cohabitation": 0,
  "has_legal_separation": false,
  "is_illegitimate": false
}
```

### 7. No MarriageType Enum

There is no `MarriageType` or property regime enum in the Rust source. The marriage is modeled entirely through boolean flags. The concept of "Regime A/B/C" in the engine refers to heir-group classification regimes, not marital property regimes.

## Rust→TS Mapping Notes

| Rust | TypeScript | Notes |
|------|-----------|-------|
| `PersonId` (type alias for `String`) | `string` | Always `"d"` for decedent |
| `Date` (type alias for `String`) | `string` | ISO-8601 format, e.g. `"2026-01-15"` |
| `Option<Date>` | `string \| null` | `null` in JSON when `None` |
| `bool` | `boolean` | Direct mapping, no serialization quirks |
| `i32` | `number` | `years_of_cohabitation` — safe in JS number range |
| All field names | identical snake_case | No `rename_all` — JSON field names match Rust exactly |

## Test Case Values Observed

| Case | `is_married` | `date_of_marriage` | `articulo_mortis` | `was_ill` | `illness_caused` | `cohabitation` | `legal_sep` | `is_illegitimate` |
|------|-------------|-------------------|-------------------|-----------|-----------------|----------------|-------------|-------------------|
| 01-single-lc | `false` | `null` | `false` | `false` | `false` | `0` | `false` | `false` |
| 02-married-3lc | `true` | `"2000-01-01"` | `false` | `false` | `false` | `0` | `false` | `false` |
| 05-parents-spouse | `true` | `"2010-03-15"` | `false` | `false` | `false` | `0` | `false` | `false` |
| 12-escheat | `false` | `null` | `false` | `false` | `false` | `0` | `false` | `false` |
| testate/11 | `true` | `"2000-01-01"` | **`true`** | **`true`** | **`true`** | **`1`** | `false` | `false` |
| fuzz/085-legal-sep | `true` | `"2000-01-01"` | `false` | `false` | `false` | `0` | **`true`** | `false` |
| (Rust test TV-20) | `true` | — | `false` | `false` | `false` | `0` | `false` | **`true`** |

Notable: Only 1 of ~140 test cases exercises articulo mortis (`true`). Only 4 fuzz cases exercise `has_legal_separation: true`. Only the Rust integration test `test_tv20_iron_curtain` sets `is_illegitimate: true`.
