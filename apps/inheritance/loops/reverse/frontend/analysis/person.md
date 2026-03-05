# Person — Frontend Spec

> Rust source: `types.rs:312–330` (struct Person)
> Consumed by: `step1_classify.rs:42–102` (classification), `step2_lines.rs` (line building / representation)

## TypeScript Interface

```typescript
/**
 * A family member of the decedent who may be an heir.
 * Maps 1:1 to Rust `Person` struct (types.rs:312–330).
 *
 * Each Person in `family_tree` is classified by the engine into an `Heir`
 * during Step 1 (step1_classify.rs). The engine skips Persons with
 * relationship `Stranger` — they produce no Heir record.
 */
export interface Person {
  /** Unique identifier within the case. Engine uses this for cross-references. */
  id: string; // PersonId alias

  /** Display name. Required, non-empty. */
  name: string;

  /** Whether this person is alive at the time of the decedent's death. */
  is_alive_at_succession: boolean;

  /** Relationship to the decedent. Determines HeirCategory classification. */
  relationship_to_decedent: Relationship;

  /**
   * Degree of kinship from the decedent.
   * - Children/parents/spouse: 1
   * - Grandchildren/grandparents/siblings: 2
   * - Great-grandchildren/nephews-nieces: 3
   * - Other collaterals: up to 5 (Art. 1010 limit)
   *
   * Used in step5_legitimes.rs for ascendant nearest-degree selection
   * and step7_distribute.rs:957 for collateral ≤5 degree filter.
   */
  degree: number;

  /**
   * Line of descent — Paternal or Maternal.
   * Only relevant for:
   * - LegitimateParent / LegitimateAscendant: determines paternal/maternal split
   *   (step5_legitimes.rs:488–493)
   * - null for all other relationship types
   */
  line: LineOfDescent | null;

  /**
   * IDs of this person's children who also appear in family_tree.
   * Used by step2_lines.rs:235 for representation line-building:
   * when a person predeceases/is disinherited, their children
   * inherit by representation.
   */
  children: string[]; // PersonId[]

  /**
   * Whether filiation has been duly proved (FC Art. 172, 176).
   * CRITICAL for IllegitimateChild: if false, heir is INELIGIBLE
   * (step1_classify.rs:178, Art. 887 ¶3).
   * For other relationship types, this is always true and not checked.
   */
  filiation_proved: boolean;

  /**
   * Type of filiation proof, if applicable.
   * Only meaningful when relationship is IllegitimateChild.
   * Informational — engine checks filiation_proved boolean only,
   * does not validate proof type.
   */
  filiation_proof_type: FiliationProof | null;

  /**
   * Whether this person is the guilty party in legal separation from decedent.
   * Only relevant for SurvivingSpouse: if true, heir is INELIGIBLE
   * (step1_classify.rs:195, Art. 1002).
   */
  is_guilty_party_in_legal_separation: boolean;

  /**
   * Adoption record, if this person is an adopted child.
   * REQUIRED when relationship is AdoptedChild — if null, heir is INELIGIBLE
   * (step1_classify.rs:188–189).
   * null for all other relationship types.
   */
  adoption: Adoption | null;

  /**
   * Whether this person has been declared unworthy (Art. 1032).
   * If true AND unworthiness_condoned is false, heir is INELIGIBLE
   * (step1_classify.rs:200).
   */
  is_unworthy: boolean;

  /**
   * Whether the decedent condoned the unworthiness (Art. 1033).
   * Only meaningful when is_unworthy is true.
   * If true, restores eligibility.
   */
  unworthiness_condoned: boolean;

  /**
   * Whether this person has renounced their inheritance.
   * Does NOT affect eligibility directly (heir is still classified).
   * Renounced heirs don't count for mutual exclusion
   * (step1_classify.rs:111) and are handled in Step 2 line building.
   * Art. 977: renunciation is NOT a representation trigger.
   */
  has_renounced: boolean;

  /**
   * Blood type for collateral heirs (siblings).
   * Full = full sibling (shares both parents with decedent) — gets 2 units
   * Half = half sibling (shares one parent) — gets 1 unit
   * (step7_distribute.rs:847–851, Art. 1006)
   *
   * Only applicable when relationship is Sibling.
   * null for all other relationship types.
   */
  blood_type: BloodType | null;
}
```

## Zod Validation Schema

```typescript
import { z } from "zod";

/**
 * Zod schema for Person with all validation constraints.
 * Constraints sourced from engine pipeline logic and Philippine Civil Code articles.
 */
export const PersonSchema = z
  .object({
    id: z
      .string()
      .min(1, "Person ID is required")
      .regex(/^[a-zA-Z0-9_-]+$/, "Person ID must be alphanumeric with hyphens/underscores"),
    // Origin: engine uses string IDs for cross-referencing (types.rs:16)

    name: z
      .string()
      .min(1, "Person name is required")
      .max(200, "Person name too long"),
    // Origin: displayed in output narratives (step1_classify.rs:72)

    is_alive_at_succession: z.boolean(),
    // Origin: step1_classify.rs:76, pipeline.rs:45,49

    relationship_to_decedent: RelationshipSchema,
    // Origin: step1_classify.rs:43 — determines heir classification

    degree: z
      .number()
      .int("Degree must be a whole number")
      .min(1, "Degree must be at least 1")
      .max(5, "Other collaterals beyond 5th degree cannot inherit (Art. 1010)"),
    // Origin: step7_distribute.rs:957 filters degree ≤ 5
    // step5_legitimes.rs:100,129 checks degree == 1 for direct children

    line: z
      .enum(["Paternal", "Maternal"])
      .nullable(),
    // Origin: step5_legitimes.rs:488–493 — paternal/maternal split for ascendants

    children: z.array(
      z.string().min(1, "Child ID must not be empty")
    ),
    // Origin: step2_lines.rs:235, step9_vacancy.rs:265 — representation line building

    filiation_proved: z.boolean(),
    // Origin: step1_classify.rs:178 — Art. 887 ¶3 (illegitimate child gate)

    filiation_proof_type: z
      .enum([
        "BirthCertificate",
        "FinalJudgment",
        "PublicDocumentAdmission",
        "PrivateHandwrittenAdmission",
        "OpenContinuousPossession",
        "OtherEvidence",
      ])
      .nullable(),
    // Origin: types.rs:111–118 — FC Art. 172, 176

    is_guilty_party_in_legal_separation: z.boolean(),
    // Origin: step1_classify.rs:195 — Art. 1002

    adoption: AdoptionSchema.nullable(),
    // Origin: step1_classify.rs:84–90, 183–189

    is_unworthy: z.boolean(),
    // Origin: step1_classify.rs:200 — Art. 1032

    unworthiness_condoned: z.boolean(),
    // Origin: step1_classify.rs:200 — Art. 1033

    has_renounced: z.boolean(),
    // Origin: step1_classify.rs:84, step2_lines.rs — Art. 977

    blood_type: z
      .enum(["Full", "Half"])
      .nullable(),
    // Origin: step7_distribute.rs:847–851 — Art. 1006
  })
  .superRefine((person, ctx) => {
    // ── Cross-field validation rules ────────────────────────────────

    // Rule 1: IllegitimateChild MUST have filiation_proved = true to be eligible
    // (step1_classify.rs:178, Art. 887 ¶3)
    // We warn but don't block — engine handles ineligibility
    if (
      person.relationship_to_decedent === "IllegitimateChild" &&
      !person.filiation_proved
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Illegitimate child without filiation proof will be ineligible (Art. 887 ¶3). Select a proof type to make eligible.",
        path: ["filiation_proved"],
      });
    }

    // Rule 2: IllegitimateChild with filiation_proved should have proof type
    if (
      person.relationship_to_decedent === "IllegitimateChild" &&
      person.filiation_proved &&
      person.filiation_proof_type === null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select the type of filiation proof",
        path: ["filiation_proof_type"],
      });
    }

    // Rule 3: AdoptedChild MUST have adoption record
    // (step1_classify.rs:188–189 — returns ineligible if no adoption)
    if (
      person.relationship_to_decedent === "AdoptedChild" &&
      person.adoption === null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Adopted child requires an adoption record",
        path: ["adoption"],
      });
    }

    // Rule 4: blood_type required for Sibling relationship
    // (step7_distribute.rs:820 — filters on blood_type.is_some())
    if (
      person.relationship_to_decedent === "Sibling" &&
      person.blood_type === null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Siblings must specify Full or Half blood type (Art. 1006)",
        path: ["blood_type"],
      });
    }

    // Rule 5: line required for LegitimateParent and LegitimateAscendant
    // (step5_legitimes.rs:488–493 — paternal/maternal split)
    if (
      (person.relationship_to_decedent === "LegitimateParent" ||
        person.relationship_to_decedent === "LegitimateAscendant") &&
      person.line === null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ascendants must specify Paternal or Maternal line",
        path: ["line"],
      });
    }

    // Rule 6: unworthiness_condoned only meaningful when is_unworthy is true
    if (!person.is_unworthy && person.unworthiness_condoned) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cannot condone unworthiness if person is not unworthy",
        path: ["unworthiness_condoned"],
      });
    }

    // Rule 7: is_guilty_party_in_legal_separation only for SurvivingSpouse
    if (
      person.relationship_to_decedent !== "SurvivingSpouse" &&
      person.is_guilty_party_in_legal_separation
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Legal separation guilt is only applicable to the surviving spouse",
        path: ["is_guilty_party_in_legal_separation"],
      });
    }

    // Rule 8: degree validation per relationship type
    if (
      ["LegitimateChild", "LegitimatedChild", "AdoptedChild",
       "IllegitimateChild", "SurvivingSpouse", "LegitimateParent"].includes(
        person.relationship_to_decedent
      ) &&
      person.degree !== 1
    ) {
      // Direct children, spouse, and parents are always degree 1
      // Grandchildren inheriting by representation are degree 2 but
      // relationship is still LegitimateChild with degree 2
      // So we only warn for spouse and parents
      if (
        person.relationship_to_decedent === "SurvivingSpouse" ||
        person.relationship_to_decedent === "LegitimateParent"
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${person.relationship_to_decedent} should have degree 1`,
          path: ["degree"],
        });
      }
    }

    // Rule 9: children array referential integrity
    // Children IDs should reference other Persons in the family tree
    // (validated at form level, not per-person)

    // Rule 10: Dead persons should have children if representation is expected
    // (informational — not a hard constraint)
  });
```

## Field Metadata Table

| Field | Label | Input Type | Options | Default | Conditional Visibility | Validation Error | Wizard Step |
|-------|-------|-----------|---------|---------|----------------------|-----------------|-------------|
| `id` | — | auto-generated | — | UUID/slug | Always (hidden) | "Person ID is required" | Family Tree |
| `name` | Full Name | text | — | `""` | Always visible | "Person name is required" | Family Tree |
| `is_alive_at_succession` | Alive at time of death? | toggle | — | `true` | Always visible | — | Family Tree |
| `relationship_to_decedent` | Relationship | select | 11 Relationship variants | — (required) | Always visible | "Select a relationship" | Family Tree |
| `degree` | Degree of kinship | number | 1–5 | Auto-calculated from relationship | Editable only for `LegitimateChild` (grandchildren=2), `LegitimateAscendant` (grandparents=2+), collaterals | "Degree must be between 1 and 5" | Family Tree |
| `line` | Line of descent | select | `Paternal`, `Maternal` | `null` | **Visible only when** `relationship` is `LegitimateParent` or `LegitimateAscendant` | "Ascendants must specify line" | Family Tree |
| `children` | Children (in family tree) | multi-select (person picker) | Other Persons in family_tree | `[]` | Visible when `is_alive_at_succession` is `false` OR when adding grandchildren for representation | — | Family Tree |
| `filiation_proved` | Filiation proven? | toggle | — | `true` | **Visible only when** `relationship` is `IllegitimateChild` | "Required for eligibility (Art. 887)" | Family Tree |
| `filiation_proof_type` | Proof of filiation | select | 6 FiliationProof variants | `null` | **Visible only when** `relationship` is `IllegitimateChild` AND `filiation_proved` is `true` | "Select proof type" | Family Tree |
| `is_guilty_party_in_legal_separation` | Guilty party in legal separation? | toggle | — | `false` | **Visible only when** `relationship` is `SurvivingSpouse` AND decedent `has_legal_separation` is `true` | — | Family Tree |
| `adoption` | Adoption details | sub-form | (see adoption.md) | `null` | **Visible only when** `relationship` is `AdoptedChild` | "Adoption record required" | Family Tree |
| `is_unworthy` | Declared unworthy? | toggle | — | `false` | Always visible (in "Advanced" collapse) | — | Family Tree |
| `unworthiness_condoned` | Unworthiness condoned? | toggle | — | `false` | **Visible only when** `is_unworthy` is `true` | — | Family Tree |
| `has_renounced` | Renounced inheritance? | toggle | — | `false` | Always visible (in "Advanced" collapse) | — | Family Tree |
| `blood_type` | Blood relationship | select | `Full`, `Half` | `null` | **Visible only when** `relationship` is `Sibling` | "Full or Half required for siblings (Art. 1006)" | Family Tree |

## Conditional Visibility Rules (Summary)

```
relationship === "IllegitimateChild"
  → SHOW: filiation_proved, filiation_proof_type (if proved)

relationship === "AdoptedChild"
  → SHOW: adoption sub-form

relationship === "SurvivingSpouse" && decedent.has_legal_separation
  → SHOW: is_guilty_party_in_legal_separation

relationship === "LegitimateParent" || relationship === "LegitimateAscendant"
  → SHOW: line (Paternal/Maternal)

relationship === "Sibling"
  → SHOW: blood_type (Full/Half)

is_unworthy === true
  → SHOW: unworthiness_condoned

relationship is "LegitimateChild" || "LegitimatedChild" || "AdoptedChild"
  degree > 1 (grandchild+)
  → Auto-purpose: this is a grandchild for representation purposes
```

## Auto-Calculated Defaults

The frontend should compute sensible defaults based on `relationship_to_decedent`:

| Relationship | degree | line | filiation_proved | blood_type | adoption |
|-------------|--------|------|-----------------|------------|----------|
| LegitimateChild | 1 (editable to 2+ for grandchildren) | null | true | null | null |
| LegitimatedChild | 1 | null | true | null | null |
| AdoptedChild | 1 | null | true | null | **required sub-form** |
| IllegitimateChild | 1 | null | **user must confirm** | null | null |
| SurvivingSpouse | 1 | null | true | null | null |
| LegitimateParent | 1 | **user must select** | true | null | null |
| LegitimateAscendant | 2+ | **user must select** | true | null | null |
| Sibling | 2 | null | true | **user must select** | null |
| NephewNiece | 3 | null | true | null | null |
| OtherCollateral | 3–5 | null | true | null | null |
| Stranger | — | null | true | null | null |

## Edge Cases

1. **Stranger skipped by engine**: `Relationship::Stranger` produces no `Heir` in Step 1 (step1_classify.rs:46). Strangers can still receive testamentary dispositions (legacies/devises). The frontend should allow adding Strangers to family_tree but note they won't appear in intestate distribution.

2. **Dead persons still classified**: A person with `is_alive_at_succession: false` is still fully classified as an `Heir` (step1_classify.rs:76 just copies the boolean). Step 2 handles dead persons for representation line-building. The frontend should clearly mark dead heirs and prompt for their `children` IDs.

3. **Grandchildren as LegitimateChild with degree 2**: In test case 15-representation.json, grandchildren have `relationship_to_decedent: "LegitimateChild"` with `degree: 2`. The engine uses `degree` to distinguish direct children from representational descendants. The frontend must allow this combination.

4. **Renounced heirs don't block mutual exclusion**: `step1_classify.rs:111` — a renounced heir doesn't count when checking whether living descendants exist (for ascendant exclusion). The renounced heir is still classified and appears in output.

5. **children IDs must reference other Persons**: The `children` array contains `PersonId` strings that must match `id` fields of other Persons in the same `family_tree`. The frontend should enforce referential integrity (person picker from existing family members).

6. **No filiation_proof_type required by engine**: The engine only checks `filiation_proved: bool` (step1_classify.rs:178). The `filiation_proof_type` is informational — carried through to output but not validated. The frontend should still encourage selecting a type for completeness.

7. **SurvivingSpouse at most 1**: While the Rust type allows multiple SurvivingSpouse entries in `family_tree`, legally there can be only one. The frontend should enforce max 1 surviving spouse.

8. **blood_type defaults to Full if missing in engine**: `step7_distribute.rs:894` — `blood_type.unwrap_or(BloodType::Full)`. If a sibling's blood_type is null, the engine treats them as full-blooded. The frontend should still require explicit selection to avoid implicit assumptions.

## Rust → TS Mapping Notes

| Rust | TypeScript | Notes |
|------|-----------|-------|
| `PersonId` (String alias) | `string` | Plain string, no special serialization |
| `Option<LineOfDescent>` | `LineOfDescent \| null` | JSON: `null` or `"Paternal"`/`"Maternal"` |
| `Vec<PersonId>` | `string[]` | JSON: `[]` when empty, never null |
| `Option<FiliationProof>` | `FiliationProof \| null` | JSON: `null` or string variant |
| `Option<Adoption>` | `Adoption \| null` | JSON: `null` or nested object (see adoption.md) |
| `Option<BloodType>` | `BloodType \| null` | JSON: `null` or `"Full"`/`"Half"` |
| `i32` (degree) | `number` | Integer, 1–5 range |
| `bool` fields | `boolean` | JSON: `true`/`false` |

All enum values use PascalCase serialization matching the Rust `#[derive(Serialize, Deserialize)]` — e.g., `"LegitimateChild"`, `"Paternal"`, `"BirthCertificate"`, `"Full"`.
