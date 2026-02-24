# Analysis: BloodType Enum

**Rust source**: `types.rs:167–170`
**Pipeline consumer**: `step7_distribute.rs:843–938` (collateral sub-algorithm)

---

## Rust Definition

```rust
// types.rs:167–170
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum BloodType {
    Full,
    Half,
}
```

Used in two structs:
- `Person.blood_type: Option<BloodType>` — input field (types.rs:329)
- `Heir.blood_type: Option<BloodType>` — pipeline-internal field (types.rs:514), copied verbatim from Person in step1_classify.rs:95

---

## TypeScript Interface

```typescript
// Mirrors types.rs:167–170
/** Sibling blood relationship to decedent.
 *  Full = shares both parents; Half = shares one parent only. */
export type BloodType = "Full" | "Half";
```

JSON serialization: PascalCase strings `"Full"` and `"Half"` (serde default derive).

---

## Zod Schema

```typescript
import { z } from "zod";

// Mirrors types.rs:167–170
// Required only when relationship === "Sibling".
// For NephewNiece, optional (engine defaults to "Full" at step7_distribute.rs:911).
export const BloodTypeSchema = z.enum(["Full", "Half"]);

// Conditional field on Person:
// blood_type: z.enum(["Full", "Half"]).nullable()
//   .refine(
//     (val, ctx) => {
//       if (ctx.parent.relationship_to_decedent === "Sibling" && val === null) {
//         return false; // Origin: step7_distribute.rs:820 requires blood_type.is_some() for sibling detection
//       }
//       return true;
//     },
//     { message: "Blood type is required for sibling heirs" }
//   )
```

**Validation origin**:
- step7_distribute.rs:820: `filter(|h| h.blood_type.is_some())` — siblings without blood_type are silently excluded from collateral distribution. Frontend must require it.
- step7_distribute.rs:911: `unwrap_or(BloodType::Full)` — NephewNiece heirs default to Full if null. Frontend may omit or default.

---

## Field Metadata Table

| Field | Person.blood_type |
|-------|------------------|
| **Rust path** | `Person.blood_type` (types.rs:329); `Heir.blood_type` (types.rs:514) |
| **Label** | "Blood Relationship" |
| **Input type** | Radio group (2 options) |
| **Options** | `"Full"` → "Full Blood (same father and mother)", `"Half"` → "Half Blood (one parent in common)" |
| **Default** | `null` (engine defaults Half→Full in NephewNiece context) |
| **Required** | Yes, when `relationship_to_decedent === "Sibling"` |
| **Conditional visibility** | Show only when `relationship_to_decedent === "Sibling"` OR `relationship_to_decedent === "NephewNiece"` |
| **Validation error** | "Blood type is required for sibling heirs" |
| **Wizard step** | Step: Family Tree → Person sub-form, after `relationship_to_decedent` |
| **Legal basis** | Arts. 1004, 1006, 1007, 1008 Civil Code |

---

## Distribution Logic (step7_distribute.rs)

BloodType drives the collateral distribution sub-algorithm in `distribute_collaterals` (step7_distribute.rs:817).

### Who is a sibling for distribution?

```
step7_distribute.rs:818–821:
siblings = heirs where:
  - inherits_by == OwnRight
  - blood_type.is_some()        ← null blood_type EXCLUDES from sibling distribution
```

A `Relationship::Sibling` person with `blood_type: null` will be **silently excluded** from the collateral distribution. The engine will not error — it will simply not give that person any share. This makes it a critical frontend validation requirement.

### Sibling-only distribution (Art. 1004 / Art. 1006)

```
step7_distribute.rs:855–873:
If all same blood type → equal shares (Art. 1004 for all-Full; Art. 1006 all-Half)
If mixed → 2:1 ratio:
  - Full blood sibling: 2 units
  - Half blood sibling: 1 unit
  per_unit = total_estate / (full_count × 2 + half_count × 1)
  full_sibling_share = per_unit × 2
  half_sibling_share = per_unit × 1
```

### Nephews/nieces by representation (Arts. 1005, 1006, 1008)

```
step7_distribute.rs:900–911:
nephew_blood[ancestor_id] = nephew.blood_type (first one encountered per ancestor group)
  → if no nephew in the group has blood_type set, defaults to BloodType::Full
```

Each group of nephews representing a predeceased sibling inherits **that sibling's blood type** for per-stirpes weighting. In the input, the NephewNiece Person should have `blood_type` set to the blood type of their predeceased sibling-parent relative to the decedent.

### Test case: 11-siblings.json

```json
{
  "id": "s1", "name": "Full Brother",
  "relationship_to_decedent": "Sibling",
  "blood_type": "Full"
},
{
  "id": "s2", "name": "Half Sister",
  "relationship_to_decedent": "Sibling",
  "blood_type": "Half"
}
```

Estate: ₱3,600,000 (360,000,000 centavos).
- Full Brother: 2/3 × ₱3,600,000 = ₱2,400,000 (Art. 1006)
- Half Sister: 1/3 × ₱3,600,000 = ₱1,200,000 (Art. 1006)

---

## Edge Cases

### 1. Sibling with `blood_type: null` — silent exclusion

If a person with `relationship_to_decedent: "Sibling"` has `blood_type: null`, step7_distribute.rs:820 excludes them from the `siblings` list. They receive **zero share** with no error. Frontend **must validate** this field is set before submission.

### 2. All siblings are half-blood — equal shares, not 2:1

Art. 1004 applies when all collaterals are of the same blood type. If all siblings are Half, they share equally (no 2:1 penalty). The 2:1 ratio only applies in mixed-blood scenarios.

### 3. NephewNiece without blood_type — defaults to Full

If a NephewNiece Person has `blood_type: null`, the engine defaults their ancestor's line to `BloodType::Full` (step7_distribute.rs:911). The frontend should prompt for blood_type on NephewNiece forms but may use "Full" as a pre-selected default (unlike Sibling which must be explicit).

### 4. OtherCollateral — blood_type is irrelevant

`Relationship::OtherCollateral` persons go through `distribute_other_collaterals` (step7_distribute.rs:840), which does not use blood_type. Blood type on an OtherCollateral person is ignored by the engine. The field should be hidden in the UI for this relationship type.

### 5. Non-collateral relationships — blood_type is always null

For all non-collateral relationships (LegitimateChild, SurvivingSpouse, etc.), `blood_type` is `null` in every test case. The engine never reads this field for non-collaterals. The field must be hidden in the UI.

---

## Rust → TypeScript Mapping Notes

| Rust | TypeScript | Notes |
|------|------------|-------|
| `BloodType::Full` | `"Full"` | Exact PascalCase string match |
| `BloodType::Half` | `"Half"` | Exact PascalCase string match |
| `Option<BloodType>` | `BloodType \| null` | null = not applicable for non-collaterals |

No centavos or Frac concerns — this is a pure string enum.

---

## Wizard Integration

**Where in the wizard**: Person sub-form (within Family Tree step), shown conditionally.

**Visibility rule**:
```typescript
// Show blood_type radio group when:
const showBloodType = (relationship: Relationship): boolean =>
  relationship === "Sibling" || relationship === "NephewNiece";
```

**Required rule**:
```typescript
// Required (not just shown) when:
const bloodTypeRequired = (relationship: Relationship): boolean =>
  relationship === "Sibling";
// For NephewNiece: optional, engine defaults to "Full"
```

**UI recommendation**: Radio buttons (not a dropdown), since there are exactly 2 mutually exclusive options. Label each option with a plain-language description: "Full Blood — shared both parents" / "Half Blood — shared one parent only (same father or same mother)".
