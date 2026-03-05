# Analysis: `institution-of-heir` — InstitutionOfHeir, HeirReference, ShareSpec

**Rust source**: `../inheritance-rust-forward/src/types.rs:371–396`
**Pipeline consumption**: `step6_validation.rs` (preterition + reduction), `step7_distribute.rs` (distribution)

---

## Rust Definitions

```rust
// types.rs:371–378
pub struct InstitutionOfHeir {
    pub id: DispositionId,         // = String
    pub heir: HeirReference,
    pub share: ShareSpec,
    pub conditions: Vec<Condition>,
    pub substitutes: Vec<Substitute>,
    pub is_residuary: bool,
}

// types.rs:391–396
pub struct HeirReference {
    pub person_id: Option<PersonId>,   // null for strangers/charities not in family_tree
    pub name: String,
    pub is_collective: bool,           // true for class designations ("all my LCs")
    pub class_designation: Option<String>,
}

// types.rs:381–388
pub enum ShareSpec {
    Fraction(Frac),       // specific fraction of estate
    EqualWithOthers,      // equal share with co-instituted heirs
    EntireEstate,         // entire estate value
    EntireFreePort,       // entire free portion (1/2 of estate in typical cases)
    Unspecified,          // no fraction stated in will
    Residuary,            // residue of free port after other dispositions
}
```

---

## JSON Serialization Notes

### ShareSpec Variants

Serde default (external tagging). Unit variants serialize as plain strings; newtype variant uses `{"VariantName": value}`:

| Variant | JSON |
|---------|------|
| `Fraction(Frac)` | `{"Fraction": "1/2"}` — Frac is `"numer/denom"` string |
| `EqualWithOthers` | `"EqualWithOthers"` |
| `EntireEstate` | `"EntireEstate"` |
| `EntireFreePort` | `"EntireFreePort"` |
| `Unspecified` | `"Unspecified"` |
| `Residuary` | `"Residuary"` |

Confirmed from test case `06-testate-charity.json`:
```json
"share": "EntireFreePort"
```

And from step6_validation.rs tests:
```json
"share": {"Fraction": "1/3"}
```

### HeirReference in Practice

For a known family member:
```json
{
  "person_id": "c1",
  "name": "Jose",
  "is_collective": false,
  "class_designation": null
}
```

For a stranger/charity:
```json
{
  "person_id": null,
  "name": "Red Cross PH",
  "is_collective": false,
  "class_designation": null
}
```

---

## TypeScript Interface

```typescript
// Mirrors types.rs:371–396

/** DispositionId is an opaque string primary key for will dispositions. */
type DispositionId = string;

/**
 * A reference to a will beneficiary — may be a known Person from family_tree
 * (person_id set) or an unnamed stranger/charity (person_id null).
 * Mirrors types.rs:391–396 HeirReference.
 */
export interface HeirReference {
  /** PersonId from family_tree, or null for strangers/charities. */
  person_id: string | null;
  /** Display name (always required; used for narrative output). */
  name: string;
  /**
   * True for class designations like "all my legitimate children".
   * When true, class_designation should be set; person_id should be null.
   */
  is_collective: boolean;
  /** Description of the class, e.g. "all legitimate children". Required when is_collective=true. */
  class_designation: string | null;
}

/**
 * How the share of an instituted heir is specified in the will.
 * Mirrors types.rs:381–388 ShareSpec.
 *
 * JSON serialization uses serde external tagging:
 *   - Unit variants → plain string literals
 *   - Fraction → { "Fraction": "n/d" } (Frac as "numer/denom" string)
 */
export type ShareSpec =
  | { Fraction: string }       // "n/d" format, e.g. "1/2"
  | "EqualWithOthers"
  | "EntireEstate"
  | "EntireFreePort"
  | "Unspecified"
  | "Residuary";

/**
 * A testamentary institution of an heir — the primary disposition type in a will.
 * Mirrors types.rs:371–378 InstitutionOfHeir.
 * Belongs to Will.institutions (types.rs:363).
 */
export interface InstitutionOfHeir {
  /** Unique identifier within this will. Frontend generates (e.g. "inst-1"). */
  id: string;
  /** Who receives the institution. */
  heir: HeirReference;
  /** How much the heir receives. */
  share: ShareSpec;
  /** Conditions on this institution (Art. 871–877). Can be empty. */
  conditions: Condition[];
  /** Substitute heirs (Arts. 857–870). Can be empty. */
  substitutes: Substitute[];
  /**
   * True if this institution captures the residue of the free portion
   * after all other dispositions (legacies, devises, fixed-fraction institutions).
   * Triggers residuary distribution in step7_distribute.rs:987.
   * Note: is_residuary=true is independent of share=Residuary;
   * the flag is the actual trigger, not the ShareSpec variant.
   */
  is_residuary: boolean;
}
```

---

## Zod Schema

```typescript
import { z } from "zod";

// Origin: fraction.rs:246–265 (deserializer validates "n/d" format, denom ≠ 0)
const FracSchema = z
  .string()
  .regex(/^-?\d+\/-?\d+$/, 'Must be in "n/d" format, e.g. "1/2"')
  .refine(
    (s) => {
      const [, d] = s.split("/");
      return d !== "0";
    },
    { message: "Denominator cannot be zero" }
  )
  .refine(
    (s) => {
      const [n, d] = s.split("/").map(Number);
      return n >= 0 && d > 0;
    },
    { message: "Fraction must be positive (numerator ≥ 0, denominator > 0)" }
  );

// Origin: types.rs:381–388 ShareSpec enum
// Validation: Fraction numer/denom > 0 to prevent negative share
const ShareSpecSchema = z.union([
  z.object({ Fraction: FracSchema }),
  z.literal("EqualWithOthers"),
  z.literal("EntireEstate"),
  z.literal("EntireFreePort"),
  z.literal("Unspecified"),
  z.literal("Residuary"),
]);

// Origin: types.rs:391–396 HeirReference
// Constraint: class_designation required when is_collective=true (logical requirement)
const HeirReferenceSchema = z
  .object({
    // person_id may be null for strangers; no engine validation, frontend allows null
    person_id: z.string().nullable(),
    // name always required for output narratives (step10_finalize.rs)
    name: z.string().min(1, "Heir name is required"),
    is_collective: z.boolean(),
    class_designation: z.string().nullable(),
  })
  .refine(
    (ref) => !ref.is_collective || (ref.class_designation?.trim().length ?? 0) > 0,
    {
      message: "Class designation is required for collective institutions",
      path: ["class_designation"],
    }
  )
  .refine(
    // If collective, person_id should be null (no single person resolves to a class)
    (ref) => !ref.is_collective || ref.person_id === null,
    {
      message: "Collective institutions reference a class, not an individual person",
      path: ["person_id"],
    }
  );

// Origin: types.rs:371–378 InstitutionOfHeir
// Art. 854: preterition check is pipeline-side, not schema-side
// Residuary note: at most one institution should have is_residuary=true
//   (enforced by cross-institution validator in wizard, not per-item schema)
export const InstitutionOfHeirSchema = z.object({
  id: z.string().min(1, "Institution ID is required"),
  heir: HeirReferenceSchema,
  share: ShareSpecSchema,
  conditions: z.array(ConditionSchema).default([]),
  substitutes: z.array(SubstituteSchema).default([]),
  is_residuary: z.boolean().default(false),
});
```

---

## Field Metadata Table

### HeirReference fields

| Field | Label | Input Type | Default | Conditional | Error Message | Wizard Step |
|-------|-------|-----------|---------|-------------|---------------|-------------|
| `person_id` | Select person | Select (from family_tree) or null | `null` | Visible when `is_collective=false` | — | Will — Institutions |
| `name` | Heir name | Text | `""` | Always visible | "Heir name is required" | Will — Institutions |
| `is_collective` | Collective institution | Toggle | `false` | Always visible | — | Will — Institutions |
| `class_designation` | Class description | Text | `null` | Visible when `is_collective=true` | "Class designation is required" | Will — Institutions |

### InstitutionOfHeir fields

| Field | Label | Input Type | Default | Conditional | Error Message | Wizard Step |
|-------|-------|-----------|---------|-------------|---------------|-------------|
| `id` | — | Hidden (auto-generated) | `"inst-{n}"` | — | — | Will — Institutions |
| `heir` | Heir | Composite sub-form | — | Always visible | — | Will — Institutions |
| `share` | Share type | Select (enum) | `"EqualWithOthers"` | Always visible | — | Will — Institutions |
| `share.Fraction` | Fraction | Text `"n/d"` | `null` | Visible when `share = "Fraction"` | 'Enter as "n/d", e.g. "1/2"'; "Denom ≠ 0" | Will — Institutions |
| `conditions` | Conditions | Repeatable sub-form | `[]` | Always visible (collapsible) | — | Will — Institutions |
| `substitutes` | Substitutes | Repeatable sub-form | `[]` | Always visible (collapsible) | — | Will — Institutions |
| `is_residuary` | Residuary clause | Toggle | `false` | Always visible | — | Will — Institutions |

### ShareSpec Select Options

| Option value | Display label | Description |
|-------------|--------------|-------------|
| `"Fraction"` | Specific fraction | Set a precise fraction (e.g. 1/3) |
| `"EqualWithOthers"` | Equal share | Divide equally with other co-heirs |
| `"EntireEstate"` | Entire estate | Entire estate (subject to legitime reduction) |
| `"EntireFreePort"` | Entire free portion | All of the disposable free portion |
| `"Unspecified"` | Unspecified | No fraction stated (engine treats as 0) |
| `"Residuary"` | Residuary | Whatever remains after other dispositions |

---

## Pipeline Validation Rules

### Art. 854 — Preterition (`step6_validation.rs:294–356`)

If any compulsory heir is **totally omitted** from the will (no institution, legacy, devise, or disinheritance mention), ALL institutions are annulled:

```typescript
// Frontend warning logic (not a hard block — engine handles this):
function checkPreteritionRisk(
  will: Will,
  familyTree: Person[]
): string | null {
  if (will.institutions.length === 0) return null; // No institutions → no preterition risk

  const instituted = new Set(
    will.institutions
      .map((i) => i.heir.person_id)
      .filter(Boolean)
  );

  // ICs are only at risk of preterition when at least one other IC is instituted
  const icIds = familyTree
    .filter((p) => p.relationship_to_decedent === "IllegitimateChild")
    .map((p) => p.id);
  const anyIcInstituted = icIds.some((id) => instituted.has(id));

  const compulsoryOmitted = familyTree.filter((p) => {
    const isCompulsory = [
      "LegitimateChild", "LegitimatedChild", "AdoptedChild",
      "LegitimateParent", "LegitimateAscendant",
      // IllegitimateChild is only compulsory when another IC is instituted
    ].includes(p.relationship_to_decedent);
    const isIc = p.relationship_to_decedent === "IllegitimateChild";
    const eligible = isCompulsory || (isIc && anyIcInstituted);
    // Spouse omission is NEVER preterition (step6_validation.rs:325)
    return eligible && !instituted.has(p.id) && !heirAddressedElsewhere(will, p.id);
  });

  if (compulsoryOmitted.length > 0) {
    return `Warning: ${compulsoryOmitted.map((p) => p.name).join(", ")} totally omitted — Art. 854 will annul ALL institutions`;
  }
  return null;
}
```

### Residuary Uniqueness

Only one institution should have `is_residuary: true`. If two institutions claim the residue, the engine takes the first one it finds (step7_distribute.rs:987 uses `.any()`, then loops to find it). Frontend should enforce max one residuary.

### is_residuary vs. ShareSpec::Residuary

These are **independent** flags:
- `ShareSpec::Residuary` in `share` → engine resolves to Frac::zero() (step7:150). Intended as a semantic label.
- `is_residuary: true` on the struct → engine captures leftover FP (step7:283–291). This is the **actual trigger**.
- Correct usage: `share: "Residuary"` + `is_residuary: true`. Frontend should enforce this coupling.

---

## Conditional Visibility Summary

| Condition | Fields shown |
|-----------|-------------|
| `will !== null` (testate) | All InstitutionOfHeir fields |
| `is_collective = false` | `person_id` person picker |
| `is_collective = true` | `class_designation` text input |
| `share = "Fraction"` | Fraction `"n/d"` input |
| `is_residuary = true` | Recommend setting `share = "Residuary"` (soft hint) |

---

## Edge Cases

1. **Stranger/charity with no family_tree entry**: `person_id: null`, `name: "Red Cross PH"`. Valid. The engine cannot link this to an Heir record — it distributes to them from the free portion but no preterition check applies (they are not compulsory heirs). Confirmed by case 06-testate-charity.json.

2. **person_id points to non-existent Person**: Engine won't find an Heir record, so the institution is processed with an unknown heir. Frontend should validate that `person_id` references an ID in `family_tree`.

3. **Multiple residuary institutions**: Engine takes the last one found in the loop (step7:283–291 sets residuary_amount, but only credits the first encountered). Frontend should prevent this with "at most one residuary institution" validation.

4. **Fraction > 1**: e.g. `"3/2"`. Engine doesn't reject this but it would violate Art. 886 (cannot dispose of more than free portion). Frontend should warn (not hard-block) if sum of Fraction shares > 1.

5. **EqualWithOthers with no other co-heirs**: Engine resolves to Frac::zero() (step6:809). Frontend should warn if `EqualWithOthers` is used but only one institution exists.

6. **EntireEstate + legitimate children**: Engine reduces this to free portion via Step 6 legitime reduction (Art. 911). Safe to allow but frontend should show educational note.

7. **Collective institution with class_designation**: Engine does not resolve class designations — it only processes `person_id`-linked institutions. Collective institutions without `person_id` will be distributed only if the engine can match them (currently no matching logic found). Frontend should note this limitation.

---

## Rust → TS Mapping Notes

| Rust | TypeScript | Serialization |
|------|-----------|---------------|
| `DispositionId` (= String) | `string` | JSON string |
| `HeirReference.person_id: Option<PersonId>` | `string \| null` | JSON null or string |
| `ShareSpec::Fraction(Frac)` | `{ Fraction: string }` | `{"Fraction": "1/2"}` |
| `ShareSpec` unit variants | string literals | e.g. `"EntireFreePort"` |
| `Vec<Condition>` | `Condition[]` | JSON array |
| `Vec<Substitute>` | `Substitute[]` | JSON array |
| `is_residuary: bool` | `boolean` | JSON boolean |

**Frac serialization reminder**: `"numer/denom"` string (fraction.rs:240–243), NOT `{numer, denom}` object. This applies to `ShareSpec::Fraction` content.
