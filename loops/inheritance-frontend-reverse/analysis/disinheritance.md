# Disinheritance — Frontend Spec

> Rust source: `types.rs:456–462` (struct Disinheritance), `types.rs:217–243` (enum DisinheritanceCause)
> Consumed by: `pipeline.rs:24–32` (extracted from Will), `step1_classify.rs:52–58` (Heir flags), `step1_classify.rs:207–210` (is_disinheritance_valid), `step2_lines.rs:162–178` (RepresentationTrigger), `step6_validation.rs:225–231` (Check 2: validity gate), `step6_validation.rs:363–434` (check_disinheritance_validity), `step6_validation.rs:847–852` (heir_addressed_in_will defeats preterition)
> Test cases: `fuzz-cases/057-testate-disinherit-1of4-sp.json`, `fuzz-cases/058-testate-disinherit-3of4-gc-sp.json`, `fuzz-cases/091-stress-maxdisinherit-5of6.json`, 15+ fuzz cases (046–060, 091, 098), step1/step2/step6 unit tests

## TypeScript Interfaces

```typescript
/**
 * A disinheritance clause from the will — the testator's express exclusion
 * of a compulsory heir from their legitime.
 * Maps 1:1 to Rust `Disinheritance` struct (types.rs:456–462).
 *
 * Pipeline consumption:
 * - pipeline.rs:24–32: extracted from Will.disinheritances at pipeline start
 * - step1_classify.rs:52–58: matched to Person by heir_reference.person_id,
 *   sets Heir.is_disinherited + Heir.disinheritance_valid flags
 * - step1_classify.rs:207–210: validity = cause_specified_in_will && cause_proven
 *   && !reconciliation_occurred
 * - step2_lines.rs:176–178: valid disinheritance triggers representation
 *   (descendants inherit per stirpes via Art. 923)
 * - step6_validation.rs:225–231: Check 2 detailed 4-check validity gate
 * - step6_validation.rs:847–852: disinheritance clause (even invalid) counts as
 *   "addressing" the heir, defeating preterition (Art. 854)
 *
 * Legal basis: Arts. 915–923 (Civil Code), Arts. 919–921 (causes by relationship)
 */
export interface Disinheritance {
  /**
   * Reference to the heir being disinherited.
   * Engine type: `HeirReference` (types.rs:391–396).
   * Must reference a person in the family tree (person_id required — cannot
   * disinherit a stranger since strangers have no legitime).
   * See HeirReference in institution-of-heir.md.
   */
  heir_reference: HeirReference;

  /**
   * The specific cause code for disinheritance.
   * Engine type: `DisinheritanceCause` enum (types.rs:217–243).
   * Must match the heir's relationship: Child causes for children/descendants,
   * Parent causes for ascendants, Spouse causes for surviving spouse.
   * Serializes as PascalCase string (e.g., "ChildAttemptOnLife").
   */
  cause_code: DisinheritanceCause;

  /**
   * Whether the cause is expressly stated in the will.
   * Required for validity (Art. 916: "must be specified in the will").
   * Engine check: step1_classify.rs:209, step6_validation.rs:383.
   */
  cause_specified_in_will: boolean;

  /**
   * Whether the cause has been proven (e.g., via court judgment).
   * Required for validity (Art. 917: "cause must be proven, if contested").
   * Engine check: step1_classify.rs:209, step6_validation.rs:385.
   */
  cause_proven: boolean;

  /**
   * Whether reconciliation between decedent and heir occurred after the cause.
   * If true, disinheritance is invalid (Art. 922: "reconciliation deprives
   * the disinheritance of any effect").
   * Engine check: step1_classify.rs:209, step6_validation.rs:387.
   */
  reconciliation_occurred: boolean;
}

/**
 * Cause codes for disinheritance, grouped by the relationship of the heir
 * to the decedent. Each group corresponds to a specific Civil Code article.
 * Maps 1:1 to Rust `DisinheritanceCause` enum (types.rs:217–243).
 *
 * Serializes as PascalCase string (JSON: "ChildAttemptOnLife", etc.).
 * The frontend MUST filter available causes based on the disinherited heir's
 * relationship category.
 */
export type DisinheritanceCause =
  // Art. 919 — Causes for disinheriting children/descendants
  | "ChildAttemptOnLife"
  | "ChildGroundlessAccusation"
  | "ChildAdulteryWithSpouse"
  | "ChildFraudUndueInfluence"
  | "ChildRefusalToSupport"
  | "ChildMaltreatment"
  | "ChildDishonorableLife"
  | "ChildCivilInterdiction"
  // Art. 920 — Causes for disinheriting parents/ascendants
  | "ParentAbandonmentCorruption"
  | "ParentAttemptOnLife"
  | "ParentGroundlessAccusation"
  | "ParentAdulteryWithSpouse"
  | "ParentFraudUndueInfluence"
  | "ParentLossParentalAuthority"
  | "ParentRefusalToSupport"
  | "ParentAttemptOnOther"
  // Art. 921 — Causes for disinheriting spouse
  | "SpouseAttemptOnLife"
  | "SpouseGroundlessAccusation"
  | "SpouseFraudUndueInfluence"
  | "SpouseCauseLegalSeparation"
  | "SpouseLossParentalAuthority"
  | "SpouseRefusalToSupport";
```

## Zod Validation Schemas

```typescript
import { z } from "zod";
import { HeirReferenceSchema } from "./institution-of-heir";

/**
 * Disinheritance cause codes grouped by applicable relationship.
 * The engine enforces no cross-validation between cause_code and heir
 * relationship, but the frontend SHOULD enforce it for correctness.
 */
const CHILD_CAUSES = [
  "ChildAttemptOnLife",
  "ChildGroundlessAccusation",
  "ChildAdulteryWithSpouse",
  "ChildFraudUndueInfluence",
  "ChildRefusalToSupport",
  "ChildMaltreatment",
  "ChildDishonorableLife",
  "ChildCivilInterdiction",
] as const;

const PARENT_CAUSES = [
  "ParentAbandonmentCorruption",
  "ParentAttemptOnLife",
  "ParentGroundlessAccusation",
  "ParentAdulteryWithSpouse",
  "ParentFraudUndueInfluence",
  "ParentLossParentalAuthority",
  "ParentRefusalToSupport",
  "ParentAttemptOnOther",
] as const;

const SPOUSE_CAUSES = [
  "SpouseAttemptOnLife",
  "SpouseGroundlessAccusation",
  "SpouseFraudUndueInfluence",
  "SpouseCauseLegalSeparation",
  "SpouseLossParentalAuthority",
  "SpouseRefusalToSupport",
] as const;

/**
 * All 22 disinheritance cause codes.
 * Source: types.rs:217–243.
 * Validation: must be one of these exact PascalCase strings.
 */
export const DisinheritanceCauseSchema = z.enum([
  ...CHILD_CAUSES,
  ...PARENT_CAUSES,
  ...SPOUSE_CAUSES,
]);

/**
 * Disinheritance struct schema.
 * Source: types.rs:456–462.
 *
 * Validity logic (step1_classify.rs:207–210):
 *   valid = cause_specified_in_will && cause_proven && !reconciliation_occurred
 *
 * Even an invalid disinheritance counts as "addressing" the heir in the will,
 * defeating preterition (step6_validation.rs:847–852).
 */
export const DisinheritanceSchema = z.object({
  /** Must reference a person in the family tree. person_id is required
   *  (cannot disinherit strangers — they have no legitime).
   *  Constraint origin: step1_classify.rs:53–55 matches on person_id.
   */
  heir_reference: HeirReferenceSchema.refine(
    (ref) => ref.person_id !== null && ref.person_id !== undefined && ref.person_id !== "",
    { message: "Disinherited heir must reference a person in the family tree" }
  ),

  /** PascalCase enum string. Source: types.rs:217–243.
   *  Frontend filters by heir relationship (see CAUSE_BY_RELATIONSHIP below).
   */
  cause_code: DisinheritanceCauseSchema,

  /** Art. 916: cause must be specified in the will.
   *  Source: step6_validation.rs:383.
   */
  cause_specified_in_will: z.boolean(),

  /** Art. 917: cause must be proven if contested.
   *  Source: step6_validation.rs:385.
   */
  cause_proven: z.boolean(),

  /** Art. 922: reconciliation nullifies disinheritance.
   *  Source: step6_validation.rs:387.
   */
  reconciliation_occurred: z.boolean(),
});
```

## Disinheritance Cause Options (Frontend Constants)

```typescript
/**
 * Cause code metadata for UI rendering.
 * Each cause has a human-readable label, the legal article, and a brief description.
 */
export const DISINHERITANCE_CAUSE_OPTIONS: Record<
  DisinheritanceCause,
  { label: string; article: string; description: string; group: "child" | "parent" | "spouse" }
> = {
  // Art. 919 — Children/descendants (8 causes)
  ChildAttemptOnLife: {
    label: "Attempt on testator's life",
    article: "Art. 919(1)",
    description: "Found guilty of an attempt against the life of the testator, his/her spouse, descendants, or ascendants",
    group: "child",
  },
  ChildGroundlessAccusation: {
    label: "Groundless criminal accusation",
    article: "Art. 919(2)",
    description: "Accused the testator of a crime punishable by 6+ years imprisonment, if the accusation has been found to be groundless",
    group: "child",
  },
  ChildAdulteryWithSpouse: {
    label: "Adultery/concubinage with testator's spouse",
    article: "Art. 919(3)",
    description: "Convicted of adultery or concubinage with the spouse of the testator",
    group: "child",
  },
  ChildFraudUndueInfluence: {
    label: "Fraud, violence, or undue influence on will",
    article: "Art. 919(4)",
    description: "By fraud, violence, intimidation, or undue influence, caused the testator to make or change a will",
    group: "child",
  },
  ChildRefusalToSupport: {
    label: "Refusal to support parent",
    article: "Art. 919(5)",
    description: "Refusal without justifiable cause to give support to the parent/testator",
    group: "child",
  },
  ChildMaltreatment: {
    label: "Maltreatment by word or deed",
    article: "Art. 919(6)",
    description: "Maltreatment of the testator by word or deed, by the child or descendant",
    group: "child",
  },
  ChildDishonorableLife: {
    label: "Leading a dishonorable or disgraceful life",
    article: "Art. 919(7)",
    description: "Leading a dishonorable or disgraceful life",
    group: "child",
  },
  ChildCivilInterdiction: {
    label: "Conviction with civil interdiction",
    article: "Art. 919(8)",
    description: "Conviction of a crime which carries with it the penalty of civil interdiction",
    group: "child",
  },

  // Art. 920 — Parents/ascendants (8 causes)
  ParentAbandonmentCorruption: {
    label: "Abandonment or corruption of children",
    article: "Art. 920(1)",
    description: "Abandoned their children, induced them to live a corrupt/immoral life, or attempted against their virtue",
    group: "parent",
  },
  ParentAttemptOnLife: {
    label: "Attempt on testator's life",
    article: "Art. 920(2)",
    description: "Found guilty of an attempt against the life of the testator, his/her spouse, descendants, or ascendants",
    group: "parent",
  },
  ParentGroundlessAccusation: {
    label: "Groundless criminal accusation",
    article: "Art. 920(3)",
    description: "Accused the testator of a crime punishable by 6+ years imprisonment, if found groundless",
    group: "parent",
  },
  ParentAdulteryWithSpouse: {
    label: "Adultery/concubinage with testator's spouse",
    article: "Art. 920(4)",
    description: "Convicted of adultery or concubinage with the spouse of the testator",
    group: "parent",
  },
  ParentFraudUndueInfluence: {
    label: "Fraud, violence, or undue influence on will",
    article: "Art. 920(5)",
    description: "By fraud, violence, intimidation, or undue influence, caused the testator to make or change a will",
    group: "parent",
  },
  ParentLossParentalAuthority: {
    label: "Loss of parental authority",
    article: "Art. 920(6)",
    description: "Loss of parental authority for causes specified in the Family Code",
    group: "parent",
  },
  ParentRefusalToSupport: {
    label: "Refusal to support child",
    article: "Art. 920(7)",
    description: "Refusal without justifiable cause to give support to the child/testator",
    group: "parent",
  },
  ParentAttemptOnOther: {
    label: "Attempt on life of other parent",
    article: "Art. 920(8)",
    description: "Attempt by one of the parents against the life of the other, unless there has been a reconciliation",
    group: "parent",
  },

  // Art. 921 — Spouse (6 causes)
  SpouseAttemptOnLife: {
    label: "Attempt on testator's life",
    article: "Art. 921(1)",
    description: "Found guilty of an attempt against the life of the testator, his/her descendants or ascendants",
    group: "spouse",
  },
  SpouseGroundlessAccusation: {
    label: "Groundless criminal accusation",
    article: "Art. 921(2)",
    description: "Accused the testator of a crime punishable by 6+ years imprisonment, if found groundless",
    group: "spouse",
  },
  SpouseFraudUndueInfluence: {
    label: "Fraud, violence, or undue influence on will",
    article: "Art. 921(3)",
    description: "By fraud, violence, intimidation, or undue influence, caused the testator to make or change a will",
    group: "spouse",
  },
  SpouseCauseLegalSeparation: {
    label: "Cause for legal separation",
    article: "Art. 921(4)",
    description: "Gave cause for legal separation",
    group: "spouse",
  },
  SpouseLossParentalAuthority: {
    label: "Loss of parental authority",
    article: "Art. 921(5)",
    description: "Loss of parental authority for causes specified in the Family Code",
    group: "spouse",
  },
  SpouseRefusalToSupport: {
    label: "Refusal to support testator",
    article: "Art. 921(6)",
    description: "Refusal without justifiable cause to give support to the testator",
    group: "spouse",
  },
};

/**
 * Maps relationship category to allowed disinheritance cause codes.
 * Used to filter the cause_code dropdown based on the selected heir's relationship.
 *
 * Note: The engine does NOT cross-validate cause_code vs. relationship at runtime.
 * This is a frontend-only correctness guard based on the Civil Code articles.
 */
export const CAUSE_BY_RELATIONSHIP: Record<string, readonly DisinheritanceCause[]> = {
  // Art. 919: children and descendants
  LegitimateChild: CHILD_CAUSES,
  LegitimatedChild: CHILD_CAUSES,
  AdoptedChild: CHILD_CAUSES,
  IllegitimateChild: CHILD_CAUSES,
  // Art. 920: parents and ascendants
  LegitimateParent: PARENT_CAUSES,
  LegitimateAscendant: PARENT_CAUSES,
  // Art. 921: spouse
  SurvivingSpouse: SPOUSE_CAUSES,
  // Collaterals and strangers cannot be disinherited (they have no legitime)
  // Sibling, NephewNiece, OtherCollateral, Stranger → not applicable
};
```

## Field Metadata Table

| Field | Label | Input Type | Options/Format | Default | Conditional Visibility | Validation Error | Wizard Step |
|-------|-------|-----------|----------------|---------|----------------------|------------------|-------------|
| `heir_reference.person_id` | Heir to disinherit | select (person picker) | Family tree persons with compulsory relationship types only | — (required) | Always visible when adding disinheritance | "Select a compulsory heir to disinherit" | Will → Disinheritances |
| `heir_reference.name` | Heir name | text (auto-filled) | Auto-populated from selected person | — | Always (auto-filled from person_id) | — | Will → Disinheritances |
| `heir_reference.is_collective` | — | hidden | Always `false` for disinheritance | `false` | Never shown | — | — |
| `heir_reference.class_designation` | — | hidden | Always `null` for disinheritance | `null` | Never shown | — | — |
| `cause_code` | Cause for disinheritance | select (grouped) | Filtered by heir's relationship type — see `CAUSE_BY_RELATIONSHIP` | — (required) | Visible after heir selected | "Select a valid cause for disinheritance" | Will → Disinheritances |
| `cause_specified_in_will` | Cause stated in the will | toggle | boolean | `true` | Always visible | — | Will → Disinheritances |
| `cause_proven` | Cause has been proven | toggle | boolean | `true` | Always visible | — | Will → Disinheritances |
| `reconciliation_occurred` | Reconciliation occurred | toggle | boolean | `false` | Always visible | — | Will → Disinheritances |

### Validity Preview (informational, frontend-only)

The frontend should show a real-time validity indicator based on the three boolean fields:

```typescript
/**
 * Mirrors is_disinheritance_valid() from step1_classify.rs:207–210.
 * Display as: ✓ Valid / ✗ Invalid (with reason)
 */
function isDisinheritanceValid(d: Disinheritance): boolean {
  return d.cause_specified_in_will && d.cause_proven && !d.reconciliation_occurred;
}

/**
 * Returns human-readable reasons why a disinheritance is invalid.
 * Based on step6_validation.rs:411–421 legal basis generation.
 */
function getInvalidityReasons(d: Disinheritance): string[] {
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
  if (reasons.length > 0) {
    reasons.push("Art. 918: Invalid disinheritance — heir reinstated with full legitime");
  }
  return reasons;
}
```

## Wizard Step Placement

Disinheritances are part of the **Will** step, appearing as a repeater sub-form alongside institutions, legacies, and devises. They are only visible when the will toggle is enabled (testate succession).

### Sub-form layout:

1. **Heir picker** — Select from compulsory heirs in family tree. Filter out:
   - Non-compulsory heirs (Sibling, NephewNiece, OtherCollateral, Stranger) — they have no legitime
   - Heirs already disinherited in another entry (no duplicate disinheritances)
2. **Cause code** — Grouped select, filtered by the selected heir's relationship
3. **Three boolean toggles** arranged horizontally:
   - "Cause stated in will" (default: true)
   - "Cause proven" (default: true)
   - "Reconciliation occurred" (default: false)
4. **Validity indicator** — Real-time display showing "Valid" or "Invalid (reason)"

## Edge Cases

1. **Cause-relationship mismatch**: The engine does NOT validate that cause_code matches the heir's relationship (e.g., using `ChildAttemptOnLife` for a spouse). The frontend MUST enforce this via `CAUSE_BY_RELATIONSHIP` filtering since incorrect causes have no legal basis.

2. **Disinherited heir with descendants (representation)**: A validly disinherited heir's descendants can represent them per stirpes (Art. 923, step2_lines.rs:176–178). The frontend should note when a disinherited heir has children in the family tree — their line survives through representation. No representation for disinherited spouse (step6_validation.rs:401).

3. **Invalid disinheritance still defeats preterition**: Even if `cause_proven=false` or `reconciliation_occurred=true`, the disinheritance clause in the will means the heir is "addressed" (step6_validation.rs:847–852). The heir is reinstated with full legitime (Art. 918), but preterition is NOT triggered.

4. **Multiple disinheritances in one will**: Test case `091-stress-maxdisinherit-5of6.json` shows 5 of 6 children disinherited. No engine limit on number of disinheritances. Each is validated independently (step6_validation.rs:225–231).

5. **Duplicate heir disinheritance**: The engine processes all entries in order — if the same heir appears twice, they get two independent validity checks. Frontend should prevent duplicates.

6. **Disinheritance without any institution**: Test case `057-testate-disinherit-1of4-sp.json` shows `institutions: []` with only disinheritances. This is valid — the will has no heir institutions, so FP is undisposed and goes to mixed succession. The disinherited heir is excluded from both testate and intestate portions.

7. **Heir with children: representation survives disinheritance**: In `058-testate-disinherit-3of4-gc-sp.json`, lc3 is disinherited but has child gc3_1 who represents them. The line survives. Test: step2_lines.rs:543–551 (`test_disinherited_heir_descendants_represent`).

8. **Reconciliation after cause**: Art. 922 is absolute — any reconciliation nullifies the disinheritance regardless of severity of cause. The toggle should have a tooltip explaining this.

9. **Cause proven toggle semantics**: Art. 917 states the burden of proof is on the heirs of the testator, not the testator. The toggle represents the factual status (has it been proven in court), not the testator's assertion.

10. **No disinheritance for non-compulsory heirs**: Only compulsory heirs (LC, LtC, AC, IC, LP, LA, SS) can be disinherited because only they have a forced legitime. Collaterals and strangers inherit only if included in the will, so there's nothing to "disinherit" them from. The frontend heir picker must filter accordingly.

## Rust→TS Mapping Notes

- **No special serialization**: All fields use standard serde. No Money, Frac, or tagged enum complications.
- **cause_code**: Serializes as bare PascalCase string (e.g., `"ChildAttemptOnLife"`). NOT a tagged object.
- **heir_reference**: Same `HeirReference` struct used by institutions, legacies, devises. See `analysis/institution-of-heir.md` for full spec. For disinheritances, `person_id` is effectively required (though the Rust type allows `Option<String>`).
- **is_collective/class_designation**: Always `false`/`null` for disinheritances (class-based disinheritance is not a legal concept). Frontend hardcodes these.
- **Boolean defaults**: `cause_specified_in_will` and `cause_proven` default to `true` (the common case is a valid disinheritance). `reconciliation_occurred` defaults to `false`.
- **Array container**: `Will.disinheritances: Vec<Disinheritance>` serializes as JSON array `[]`. Empty array is the default (no disinheritances).

## JSON Serialization Example

From test case `057-testate-disinherit-1of4-sp.json`:

```json
{
  "disinheritances": [
    {
      "heir_reference": {
        "person_id": "lc1",
        "name": "Nora Aquino",
        "is_collective": false,
        "class_designation": null
      },
      "cause_code": "ChildRefusalToSupport",
      "cause_specified_in_will": true,
      "cause_proven": true,
      "reconciliation_occurred": false
    }
  ]
}
```
