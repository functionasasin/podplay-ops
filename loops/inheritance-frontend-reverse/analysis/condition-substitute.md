# Condition & Substitute — Frontend Spec

> Rust source: `types.rs:181–185` (enum ConditionType), `types.rs:188–193` (enum ConditionStatus), `types.rs:196–200` (enum SubstitutionType), `types.rs:203–207` (enum SubstitutionTrigger), `types.rs:210–214` (enum FideicommissaryValidationResult), `types.rs:432–436` (struct Condition), `types.rs:439–443` (struct Substitute), `types.rs:446–453` (struct FideicommissarySubstitution)
> Consumed by: `step6_validation.rs:708–766` (Check 5: condition stripping, Art. 872), `step9_vacancy.rs:568–652` (try_substitution, Art. 859), `step10_finalize.rs:47–49` (narrative section types: Condition, Substitution)
> Test cases: No test case JSON has non-empty `conditions` or `substitutes` arrays — all use `[]`. Unit tests only: `step6_validation.rs:1771–1870` (condition stripping 3 tests), `step9_vacancy.rs:883–916` (make_will_with_substitute helper), `step9_vacancy.rs:1144–1167` (substitution 3 tests)

## TypeScript Interfaces

### Condition

```typescript
/**
 * A condition attached to a testamentary disposition (institution, legacy, or devise).
 * Maps 1:1 to Rust `Condition` struct (types.rs:432–436).
 *
 * Pipeline consumption:
 * - Step 6 Check 5 — Condition Stripping (Art. 872, step6_validation.rs:708–766):
 *   For COMPULSORY heirs only, conditions on their legitime portion are VOID.
 *   The engine splits the heir's share into:
 *     (a) unconditional legitime portion (conditions stripped), and
 *     (b) conditional free portion (conditions retained only here).
 *   Voluntary (non-compulsory) heirs retain all conditions (step6_validation.rs:730–735).
 * - Step 10 narrative (step10_finalize.rs:47): NarrativeSectionType::Condition
 *   generates a narrative paragraph about conditions applied.
 *
 * IMPORTANT: The engine reads condition_type and status but the primary logic
 * only uses `description` (the stripped_conditions list is built from
 * description strings, step6_validation.rs:741–745). condition_type and status
 * are informational for pipeline output/display.
 */
export interface Condition {
  /**
   * The type of condition imposed.
   * Engine type: `ConditionType` enum (types.rs:181–185).
   * Serializes as PascalCase string: "Suspensive" | "Resolutory" | "Modal".
   *
   * Legal meaning:
   * - Suspensive: disposition takes effect only IF condition is fulfilled
   *   (e.g., "if you pass the bar exam")
   * - Resolutory: disposition takes effect immediately but is REVOKED if
   *   condition is fulfilled (e.g., "until you remarry")
   * - Modal: disposition with an obligation imposed on the heir
   *   (e.g., "provided you maintain the family chapel")
   *
   * Art. 872: regardless of type, conditions on a compulsory heir's
   * legitime portion are void — the engine strips them all equally
   * (step6_validation.rs:741–745 maps ALL conditions, not filtering by type).
   */
  condition_type: ConditionType;

  /**
   * Free-text description of the condition.
   * Engine type: `String` (types.rs:434).
   * This is the primary consumed field — condition stripping collects
   * description strings into ConditionStrippingResult.stripped_conditions
   * (step6_validation.rs:741–745).
   * Must be non-empty — serves as the human-readable condition text
   * displayed in both input review and results narrative.
   */
  description: string;

  /**
   * Current status of the condition.
   * Engine type: `ConditionStatus` enum (types.rs:188–193).
   * Serializes as PascalCase string: "Pending" | "Fulfilled" | "Failed" | "NotApplicable".
   *
   * Not consumed by condition stripping logic — all conditions on a
   * compulsory heir's legitime are stripped regardless of status.
   * Informational for display: tells user whether the condition has
   * been evaluated.
   */
  status: ConditionStatus;
}

/**
 * Types of conditions that may be attached to testamentary dispositions.
 * Maps 1:1 to Rust `ConditionType` enum (types.rs:181–185).
 * Serializes as PascalCase string.
 */
export type ConditionType = "Suspensive" | "Resolutory" | "Modal";

/**
 * Status of a condition's evaluation.
 * Maps 1:1 to Rust `ConditionStatus` enum (types.rs:188–193).
 * Serializes as PascalCase string.
 */
export type ConditionStatus = "Pending" | "Fulfilled" | "Failed" | "NotApplicable";
```

### Substitute

```typescript
/**
 * A testamentary substitute for a disposition — a named replacement heir
 * who steps in if the original heir's share becomes vacant.
 * Maps 1:1 to Rust `Substitute` struct (types.rs:439–443).
 *
 * Pipeline consumption:
 * - Step 9 vacancy resolution (step9_vacancy.rs:568–652):
 *   When an heir's share becomes vacant (predecease, renunciation, incapacity,
 *   or disinheritance), the engine checks try_substitution() which iterates
 *   through the disposition's substitutes array looking for a named substitute
 *   whose person_id matches an alive & eligible heir in the family tree.
 *   Substitution (Art. 859) is attempted FIRST, before representation or
 *   accretion. Legal basis: "Art. 859".
 *   Checked across all disposition types: institutions (line 581–604),
 *   legacies (line 607–627), devises (line 629–649).
 * - Step 10 narrative (step10_finalize.rs:49): NarrativeSectionType::Substitution
 *   generates a narrative paragraph about substitution events.
 *
 * NOTE: The engine does NOT check substitute.triggers — the try_substitution
 * function only verifies that the substitute's person_id matches an alive &
 * eligible heir (step9_vacancy.rs:594–601). Trigger values are informational
 * for display purposes and legal documentation.
 */
export interface Substitute {
  /**
   * The type of substitution.
   * Engine type: `SubstitutionType` enum (types.rs:196–200).
   * Serializes as PascalCase string: "Simple" | "Reciprocal" | "Fideicommissary".
   *
   * Legal meaning:
   * - Simple (Art. 857): testator designates a person to substitute the heir
   *   in case the heir cannot or does not accept the inheritance.
   * - Reciprocal (Art. 858): co-heirs are designated to substitute each other.
   * - Fideicommissary (Arts. 863–870): testator charges the first heir
   *   (fiduciary) to preserve and transmit to a second heir (fideicommissary).
   *   Subject to special validity rules — see FideicommissarySubstitution below.
   *
   * NOTE: The engine's try_substitution does NOT differentiate by type —
   * all types are treated identically for vacancy resolution. Type is
   * informational for legal documentation.
   */
  substitution_type: SubstitutionType;

  /**
   * Reference to the substitute heir.
   * Engine type: `HeirReference` (types.rs:391–396).
   * Must have person_id set to a valid Person ID from the family tree
   * for the engine to resolve substitution (step9_vacancy.rs:595).
   * Strangers (person_id=null) cannot be resolved as substitutes
   * because the engine checks `heirs.iter().find(|h| &h.id == sub_person_id)`
   * which requires a classified heir.
   */
  substitute_heir: HeirReference;

  /**
   * Events that trigger this substitution.
   * Engine type: `Vec<SubstitutionTrigger>` (types.rs:203–207).
   * Serializes as PascalCase string array: ("Predecease" | "Renunciation" | "Incapacity")[].
   *
   * NOTE: The engine does NOT filter by trigger — try_substitution checks
   * only alive + eligible status (step9_vacancy.rs:598). All three triggers
   * are typically specified together (see test helper at step9_vacancy.rs:903–907).
   * Informational for legal documentation and display.
   */
  triggers: SubstitutionTrigger[];
}

/**
 * Types of testamentary substitution.
 * Maps 1:1 to Rust `SubstitutionType` enum (types.rs:196–200).
 * Serializes as PascalCase string.
 */
export type SubstitutionType = "Simple" | "Reciprocal" | "Fideicommissary";

/**
 * Events that can trigger a substitution.
 * Maps 1:1 to Rust `SubstitutionTrigger` enum (types.rs:203–207).
 * Serializes as PascalCase string.
 */
export type SubstitutionTrigger = "Predecease" | "Renunciation" | "Incapacity";
```

### FideicommissarySubstitution

```typescript
/**
 * A fideicommissary substitution — a special substitution where the testator
 * charges the first heir (fiduciary) to preserve and transmit property to a
 * second heir (fideicommissary). Subject to strict validity rules.
 * Maps 1:1 to Rust `FideicommissarySubstitution` struct (types.rs:446–453).
 *
 * Pipeline consumption:
 * - NOT consumed by any pipeline step in the current engine.
 *   The type is defined in types.rs but is NOT used in any pipeline step
 *   (step1–step10), any test, or any test case JSON. It exists as a
 *   forward-looking type for future implementation of Arts. 863–870.
 *
 * Despite non-consumption, it is included in the spec because:
 * 1. It is part of the engine's type system and may be consumed in future
 * 2. It may appear in EngineInput if the engine adds support
 * 3. Frontend can offer it as an advanced fideicommissary form
 *
 * Validity rules from Civil Code (for future reference):
 * - Art. 863: valid only if imposed on one-degree-away persons
 * - Art. 864: fiduciary must preserve and transmit to fideicommissary
 * - Art. 866: fideicommissary must be alive at time of testator's death
 *   or at least conceived (Art. 868)
 * - Art. 869: fiduciary must keep at least 1/4 of the estate (usufruct)
 */
export interface FideicommissarySubstitution {
  /**
   * The first heir who receives and must preserve the property.
   * Engine type: `HeirReference` (types.rs:391–396).
   */
  fiduciary: HeirReference;

  /**
   * The second heir who ultimately receives the property.
   * Engine type: `HeirReference` (types.rs:391–396).
   */
  fideicommissary: HeirReference;

  /**
   * The scope of property subject to this substitution.
   * Engine type: `ShareSpec` enum (types.rs:381–388).
   * Reuses the same ShareSpec from InstitutionOfHeir.
   */
  property_scope: ShareSpec;

  /**
   * Whether the fideicommissary substitution was expressly stated in the will.
   * Art. 863 requires express institution for validity.
   */
  is_express: boolean;

  /**
   * Whether the substitution is legally valid.
   * Would be computed by the engine based on Arts. 863–870 rules.
   * In the current engine, this is always user-provided (not computed).
   */
  is_valid: boolean;

  /**
   * Reason for invalidity, if is_valid is false.
   * Optional — null when the substitution is valid.
   */
  invalidity_reason: string | null;
}

/**
 * Result of fideicommissary substitution validation.
 * Maps 1:1 to Rust `FideicommissaryValidationResult` enum (types.rs:210–214).
 * Serializes as PascalCase string.
 * NOT consumed by any current pipeline step.
 */
export type FideicommissaryValidationResult = "Valid" | "Invalid" | "PartialValid";
```

## Zod Validation Schemas

```typescript
import { z } from "zod";

// ── Enums ─────────────────────────────────────────────────────────

/**
 * ConditionType — 3 variants (types.rs:181–185).
 * No engine-side validation; serde deserialization enforces valid variant.
 */
export const ConditionTypeSchema = z.enum(["Suspensive", "Resolutory", "Modal"]);

/**
 * ConditionStatus — 4 variants (types.rs:188–193).
 * Default should be "Pending" for new conditions.
 * No engine-side validation beyond serde variant match.
 */
export const ConditionStatusSchema = z.enum(["Pending", "Fulfilled", "Failed", "NotApplicable"]);

/**
 * SubstitutionType — 3 variants (types.rs:196–200).
 * No engine-side validation; serde deserialization enforces valid variant.
 * "Fideicommissary" triggers additional form fields (FideicommissarySubstitution).
 */
export const SubstitutionTypeSchema = z.enum(["Simple", "Reciprocal", "Fideicommissary"]);

/**
 * SubstitutionTrigger — 3 variants (types.rs:203–207).
 * At least one trigger should be selected. Engine does not validate trigger
 * array content (step9_vacancy.rs:594–601 ignores triggers).
 */
export const SubstitutionTriggerSchema = z.enum(["Predecease", "Renunciation", "Incapacity"]);

/**
 * FideicommissaryValidationResult — 3 variants (types.rs:210–214).
 * Not consumed by pipeline. Informational.
 */
export const FideicommissaryValidationResultSchema = z.enum(["Valid", "Invalid", "PartialValid"]);

// ── Structs ───────────────────────────────────────────────────────

/**
 * Condition schema (types.rs:432–436).
 * Consumed by step6_validation.rs:708–766 (condition stripping).
 * All fields required by serde deserialization — no Option<> in Rust.
 */
export const ConditionSchema = z.object({
  /** PascalCase condition type — "Suspensive" | "Resolutory" | "Modal" */
  condition_type: ConditionTypeSchema,

  /**
   * Human-readable description of the condition.
   * This is the primary consumed field — condition stripping extracts these
   * descriptions into ConditionStrippingResult.stripped_conditions
   * (step6_validation.rs:741–745).
   * Frontend validation: non-empty string, reasonable max length.
   */
  description: z.string()
    .min(1, "Condition description is required")
    .max(500, "Condition description must be 500 characters or less"),

  /**
   * Current evaluation status. Defaults to "Pending" for new conditions.
   * Not consumed by condition stripping — informational only.
   */
  status: ConditionStatusSchema,
});

/**
 * Substitute schema (types.rs:439–443).
 * Consumed by step9_vacancy.rs:568–652 (try_substitution).
 * All fields required by serde deserialization.
 */
export const SubstituteSchema = z.object({
  /**
   * PascalCase substitution type.
   * Engine does not differentiate by type (step9_vacancy.rs:594–601).
   * "Fideicommissary" is informational — may trigger additional UI form
   * for FideicommissarySubstitution details in future.
   */
  substitution_type: SubstitutionTypeSchema,

  /**
   * Reference to the substitute heir.
   * Must reference a valid person in the family tree for engine resolution.
   * person_id is required for substitution to work — null person_id means
   * the engine skips this substitute (step9_vacancy.rs:595 checks
   * `if let Some(sub_person_id)`).
   * Reuses HeirReferenceSchema from institution-of-heir analysis.
   */
  substitute_heir: z.lazy(() => HeirReferenceSchema),

  /**
   * Triggers for this substitution — at least one should be selected.
   * Engine does NOT filter by trigger — all are checked identically.
   * Convention from test helper (step9_vacancy.rs:903–907): specify all three.
   * Frontend: default to all three selected; user can deselect.
   */
  triggers: z.array(SubstitutionTriggerSchema)
    .min(1, "At least one substitution trigger must be selected"),
});

/**
 * FideicommissarySubstitution schema (types.rs:446–453).
 * NOT consumed by any pipeline step. Forward-looking type.
 * Included for spec completeness and future engine support.
 */
export const FideicommissarySubstitutionSchema = z.object({
  fiduciary: z.lazy(() => HeirReferenceSchema),
  fideicommissary: z.lazy(() => HeirReferenceSchema),
  property_scope: z.lazy(() => ShareSpecSchema),
  is_express: z.boolean(),
  is_valid: z.boolean(),
  invalidity_reason: z.string().nullable(),
}).superRefine((data, ctx) => {
  // Art. 863: fiduciary and fideicommissary must be different persons
  if (
    data.fiduciary.person_id &&
    data.fideicommissary.person_id &&
    data.fiduciary.person_id === data.fideicommissary.person_id
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Fiduciary and fideicommissary must be different persons (Art. 863)",
      path: ["fideicommissary", "person_id"],
    });
  }
});
```

## Field Metadata Tables

### Condition Fields

| Field | Label | Input Type | Options | Default | Conditional Visibility | Validation Error | Wizard Step |
|-------|-------|-----------|---------|---------|----------------------|-----------------|-------------|
| `condition_type` | Condition Type | select | Suspensive, Resolutory, Modal | `"Suspensive"` | Always visible when adding a condition | "Select a condition type" | Will Step — within disposition sub-form (institution/legacy/devise) |
| `description` | Description | textarea | — | `""` | Always visible when adding a condition | "Condition description is required" (empty), "Condition description must be 500 characters or less" (too long) | Will Step — within disposition sub-form |
| `status` | Status | select | Pending, Fulfilled, Failed, Not Applicable | `"Pending"` | Always visible when adding a condition | "Select a condition status" | Will Step — within disposition sub-form |

### Substitute Fields

| Field | Label | Input Type | Options | Default | Conditional Visibility | Validation Error | Wizard Step |
|-------|-------|-----------|---------|---------|----------------------|-----------------|-------------|
| `substitution_type` | Substitution Type | select | Simple, Reciprocal, Fideicommissary | `"Simple"` | Always visible when adding a substitute | "Select a substitution type" | Will Step — within disposition sub-form |
| `substitute_heir` | Substitute Heir | person-picker | Persons from family tree | — | Always visible when adding a substitute | "Select a substitute heir" | Will Step — within disposition sub-form |
| `triggers` | Triggers | multi-select (checkboxes) | Predecease, Renunciation, Incapacity | All three selected | Always visible when adding a substitute | "Select at least one trigger" | Will Step — within disposition sub-form |

### FideicommissarySubstitution Fields (Future / Advanced)

| Field | Label | Input Type | Options | Default | Conditional Visibility | Validation Error | Wizard Step |
|-------|-------|-----------|---------|---------|----------------------|-----------------|-------------|
| `fiduciary` | Fiduciary (First Heir) | person-picker | Persons from family tree | — | Visible when `substitution_type === "Fideicommissary"` | "Select the fiduciary heir" | Will Step — within disposition sub-form |
| `fideicommissary` | Fideicommissary (Second Heir) | person-picker | Persons from family tree | — | Visible when `substitution_type === "Fideicommissary"` | "Select the fideicommissary heir" | Will Step — within disposition sub-form |
| `property_scope` | Property Scope | share-spec-input | ShareSpec variants | `"Unspecified"` | Visible when `substitution_type === "Fideicommissary"` | "Specify the property scope" | Will Step — within disposition sub-form |
| `is_express` | Expressly Stated in Will | toggle | — | `true` | Visible when `substitution_type === "Fideicommissary"` | — | Will Step — within disposition sub-form |
| `is_valid` | Legally Valid | toggle | — | `true` | Visible when `substitution_type === "Fideicommissary"` | — | Will Step — within disposition sub-form |
| `invalidity_reason` | Reason for Invalidity | textarea | — | `null` | Visible when `is_valid === false` | "Provide a reason for invalidity" (when shown) | Will Step — within disposition sub-form |

## UI Constants

```typescript
/**
 * Dropdown options for ConditionType.
 * Source: types.rs:181–185.
 */
export const CONDITION_TYPE_OPTIONS = [
  {
    value: "Suspensive" as const,
    label: "Suspensive",
    description: "Takes effect only IF the condition is fulfilled (e.g., \"if you pass the bar exam\")",
  },
  {
    value: "Resolutory" as const,
    label: "Resolutory",
    description: "Takes effect immediately but is revoked IF the condition occurs (e.g., \"until you remarry\")",
  },
  {
    value: "Modal" as const,
    label: "Modal",
    description: "Imposes an obligation on the heir (e.g., \"provided you maintain the family chapel\")",
  },
] as const;

/**
 * Dropdown options for ConditionStatus.
 * Source: types.rs:188–193.
 */
export const CONDITION_STATUS_OPTIONS = [
  { value: "Pending" as const, label: "Pending", description: "Condition has not yet been evaluated" },
  { value: "Fulfilled" as const, label: "Fulfilled", description: "Condition has been met" },
  { value: "Failed" as const, label: "Failed", description: "Condition was not met / is impossible" },
  { value: "NotApplicable" as const, label: "Not Applicable", description: "Condition does not apply to this disposition" },
] as const;

/**
 * Dropdown options for SubstitutionType.
 * Source: types.rs:196–200.
 */
export const SUBSTITUTION_TYPE_OPTIONS = [
  {
    value: "Simple" as const,
    label: "Simple",
    description: "Art. 857: Testator designates a person to substitute the heir if they cannot or do not accept",
  },
  {
    value: "Reciprocal" as const,
    label: "Reciprocal",
    description: "Art. 858: Co-heirs are designated to substitute each other",
  },
  {
    value: "Fideicommissary" as const,
    label: "Fideicommissary",
    description: "Arts. 863–870: First heir (fiduciary) preserves and transmits to second heir (fideicommissary)",
  },
] as const;

/**
 * Checkbox options for SubstitutionTrigger.
 * Source: types.rs:203–207.
 * Default: all three selected (per test convention, step9_vacancy.rs:903–907).
 */
export const SUBSTITUTION_TRIGGER_OPTIONS = [
  { value: "Predecease" as const, label: "Predecease", description: "Substitute steps in if original heir dies before the decedent" },
  { value: "Renunciation" as const, label: "Renunciation", description: "Substitute steps in if original heir renounces the inheritance" },
  { value: "Incapacity" as const, label: "Incapacity", description: "Substitute steps in if original heir is legally incapable of inheriting" },
] as const;
```

## Edge Cases

1. **Empty arrays are the norm**: All 90+ test case JSONs use `conditions: []` and `substitutes: []`. The frontend should default to empty arrays and provide "Add Condition" / "Add Substitute" buttons to add items incrementally. These are optional, advanced sub-forms.

2. **Condition stripping only applies to compulsory heirs**: If the instituted heir (via person_id lookup) is NOT compulsory, conditions remain fully intact. The frontend should display an informational note: "Conditions on a compulsory heir's legitime portion are void under Art. 872. The engine will automatically strip them."

3. **Condition type and status are informational**: The engine's condition stripping logic (step6_validation.rs:741–745) collects ALL conditions regardless of type or status. It maps `c.description` for all conditions unconditionally. The frontend should still collect these fields for legal documentation but should not imply they affect computation.

4. **Substitute person_id must reference a family tree person**: The engine's try_substitution (step9_vacancy.rs:595) checks `if let Some(sub_person_id)` — null person_id substitutes are silently skipped. The person-picker for substitute_heir should only offer persons from the family tree, NOT allow freeform name entry.

5. **Substitute triggers are not consumed by engine**: The try_substitution function (step9_vacancy.rs:594–601) only checks whether the substitute's person is alive and eligible. It does NOT check whether the vacancy reason matches any trigger. Frontend should default all three triggers selected (matching the test convention at step9_vacancy.rs:903–907) and note they are for legal documentation.

6. **Substitution type is not consumed by engine**: Like triggers, the SubstitutionType field is ignored by try_substitution. All types resolve identically. Informational for legal documentation only.

7. **FideicommissarySubstitution is unused**: Defined in types.rs:446–453 but not consumed by any pipeline step or test. Frontend should treat this as a future/advanced feature. If exposed, gate behind "Fideicommissary" substitution_type selection with a clear "not yet computed by engine" warning.

8. **Substitutes checked across all disposition types**: try_substitution (step9_vacancy.rs:581–649) iterates institutions, legacies, AND devises. The same Substitute sub-form should be available on all three disposition types.

9. **Conditions also appear on all disposition types**: InstitutionOfHeir (types.rs:375), Legacy (types.rs:403), and Devise (types.rs:420) all have `conditions: Vec<Condition>`. The same Condition sub-form should be reusable across all three.

10. **Serialization — no surprises**: Both Condition and Substitute use standard serde with PascalCase enum variants. No tuple variants, no custom serializers. JSON shape matches struct shape exactly:
    ```json
    {
      "condition_type": "Suspensive",
      "description": "Must pass the bar exam",
      "status": "Pending"
    }
    ```
    ```json
    {
      "substitution_type": "Simple",
      "substitute_heir": {
        "person_id": "sub1",
        "name": "Substitute Name",
        "is_collective": false,
        "class_designation": null
      },
      "triggers": ["Predecease", "Renunciation", "Incapacity"]
    }
    ```

## Rust→TS Mapping Notes

| Rust Type | TS Type | Serialization | Notes |
|-----------|---------|---------------|-------|
| `ConditionType` enum (3 variants) | `"Suspensive" \| "Resolutory" \| "Modal"` | PascalCase string | Exact string match required |
| `ConditionStatus` enum (4 variants) | `"Pending" \| "Fulfilled" \| "Failed" \| "NotApplicable"` | PascalCase string | Note: `NotApplicable` not `Not_Applicable` |
| `SubstitutionType` enum (3 variants) | `"Simple" \| "Reciprocal" \| "Fideicommissary"` | PascalCase string | Exact string match required |
| `SubstitutionTrigger` enum (3 variants) | `"Predecease" \| "Renunciation" \| "Incapacity"` | PascalCase string | Exact string match required |
| `FideicommissaryValidationResult` enum (3 variants) | `"Valid" \| "Invalid" \| "PartialValid"` | PascalCase string | Note: `PartialValid` not `Partial` |
| `Vec<Condition>` | `Condition[]` | JSON array of objects | Defaults to `[]` |
| `Vec<Substitute>` | `Substitute[]` | JSON array of objects | Defaults to `[]` |
| `Vec<SubstitutionTrigger>` | `SubstitutionTrigger[]` | JSON array of strings | Defaults to all 3 selected |
| `HeirReference` (in substitute_heir) | `HeirReference` | Standard object | person_id required for engine resolution |
| `FideicommissarySubstitution` | `FideicommissarySubstitution` | Standard object | Not consumed by engine |
| `Option<String>` (invalidity_reason) | `string \| null` | JSON null or string | Visible only when is_valid=false |
