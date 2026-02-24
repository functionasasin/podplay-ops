# Relationship Enum — Frontend Spec

**Rust source**: `../inheritance-rust-forward/src/types.rs:96–108`
**Pipeline consumer**: `../inheritance-rust-forward/src/step1_classify.rs:130–143` (`raw_category_from_relationship`)
**Also checked**: `pipeline.rs:41–56` (scenario inputs from relationship)

---

## TypeScript Type

```typescript
// Mirrors Rust enum Relationship (types.rs:96–108).
// JSON serialization: PascalCase string exactly as written below.
export type Relationship =
  | "LegitimateChild"
  | "LegitimatedChild"
  | "AdoptedChild"
  | "IllegitimateChild"
  | "SurvivingSpouse"
  | "LegitimateParent"
  | "LegitimateAscendant"
  | "Sibling"
  | "NephewNiece"
  | "OtherCollateral"
  | "Stranger";
```

---

## Zod Schema

```typescript
import { z } from "zod";

// step1_classify.rs:130–143 — raw_category_from_relationship exhaustive match.
// All 11 variants are valid engine inputs; "Stranger" is a legal no-op (engine skips).
export const RelationshipSchema = z.enum([
  "LegitimateChild",
  "LegitimatedChild",
  "AdoptedChild",
  "IllegitimateChild",
  "SurvivingSpouse",
  "LegitimateParent",
  "LegitimateAscendant",
  "Sibling",
  "NephewNiece",
  "OtherCollateral",
  "Stranger",
]);
```

---

## Variant Details Table

| Variant | JSON String | Compulsory Heir? | Effective Category | Legal Basis | Special Field Requirements |
|---------|------------|------------------|--------------------|-------------|----------------------------|
| `LegitimateChild` | `"LegitimateChild"` | Yes | `LegitimateChildGroup` | Art. 887(1) | None (base case) |
| `LegitimatedChild` | `"LegitimatedChild"` | Yes | `LegitimateChildGroup` | FC Art. 179 | None (same rights as LC) |
| `AdoptedChild` | `"AdoptedChild"` | Yes | `LegitimateChildGroup` | RA 8552 Sec. 17 | Requires `adoption` sub-form |
| `IllegitimateChild` | `"IllegitimateChild"` | Yes | `IllegitimateChildGroup` | Art. 887(4), FC Art. 172 | `filiation_proved = true` required for eligibility |
| `SurvivingSpouse` | `"SurvivingSpouse"` | Yes | `SurvivingSpouseGroup` | Art. 887(3) | Max 1 per estate; check `is_guilty_party_in_legal_separation` |
| `LegitimateParent` | `"LegitimateParent"` | Yes | `LegitimateAscendantGroup` | Art. 887(2) | Requires `line` (Paternal/Maternal); excluded when LC-group exists |
| `LegitimateAscendant` | `"LegitimateAscendant"` | Yes | `LegitimateAscendantGroup` | Art. 887(2) | Requires `line` (Paternal/Maternal); excluded when LC-group exists |
| `Sibling` | `"Sibling"` | No | `CollateralGroup` | Art. 1003–1009 | Requires `blood_type` (Full/Half); non-compulsory intestate only |
| `NephewNiece` | `"NephewNiece"` | No | `CollateralGroup` | Art. 1005, 1009 | Non-compulsory intestate only |
| `OtherCollateral` | `"OtherCollateral"` | No | `CollateralGroup` | Art. 1009–1010 | Non-compulsory intestate only; checked separately in pipeline.rs:47–49 |
| `Stranger` | `"Stranger"` | No | *(none — skipped)* | — | Skipped by engine entirely; only appears in Will `HeirReference` contexts |

---

## Eligibility Rules by Relationship

The following rules are enforced in `step1_classify.rs:176–204` (`check_eligibility`):

| Relationship | Eligibility Condition | Rust Location | Error / Legal Basis |
|---|---|---|---|
| `IllegitimateChild` | `filiation_proved === true` | `step1_classify.rs:177–179` | FC Art. 172, 176 — filiation must be duly proved |
| `AdoptedChild` | `adoption !== null && !adoption.is_rescinded` | `step1_classify.rs:183–191` | RA 8552 Sec. 20 — rescinded adoption removes rights |
| `SurvivingSpouse` | `!is_guilty_party_in_legal_separation` | `step1_classify.rs:194–196` | Art. 1002 — guilty party excluded |
| Any | `!is_unworthy || unworthiness_condoned` | `step1_classify.rs:199–201` | Art. 1032–1033 — unworthiness, unless condoned |
| `LegitimateParent` / `LegitimateAscendant` | No alive, non-renounced LC-group heir | `step1_classify.rs:108–120` | Art. 887(2) — mutual exclusion (§4.2) |

---

## Mutual Exclusion (§4.2)

`step1_classify.rs:105–120`:

```rust
// If any alive, non-renounced LC-group heir exists,
// all ascendants are marked ineligible.
let has_lc_descendants = heirs.iter().any(|h| {
    h.effective_category == EffectiveCategory::LegitimateChildGroup
        && h.is_alive
        && !h.has_renounced
});
if has_lc_descendants {
    for heir in &mut heirs {
        if heir.effective_category == EffectiveCategory::LegitimateAscendantGroup {
            heir.is_eligible = false;
        }
    }
}
```

**Frontend implication**: Show an info banner when `LegitimateParent`/`LegitimateAscendant` persons are entered alongside any `LegitimateChild`/`LegitimatedChild`/`AdoptedChild`: "Note: ascendants are excluded from compulsory succession when any surviving legitimate descendant exists (Art. 887)."

---

## Scenario Input Derivation (pipeline.rs:41–56)

The pipeline derives two boolean flags from `relationship_to_decedent` before calling Step 3:

```typescript
// pipeline.rs:41–56 (translated to TS)
const hasSiblingsOrNephews = familyTree.some(
  (p) =>
    (p.relationship_to_decedent === "Sibling" ||
      p.relationship_to_decedent === "NephewNiece") &&
    p.is_alive_at_succession
);
const hasOtherCollaterals = familyTree.some(
  (p) =>
    p.relationship_to_decedent === "OtherCollateral" &&
    p.is_alive_at_succession
);
```

These are passed to `step3_determine_scenario` and influence which intestate scenario code (I10–I15) is selected. The frontend doesn't need to compute this — it's engine logic — but it explains why collateral variants matter for output.

---

## Field Metadata: `relationship_to_decedent` on Person

| Property | Value |
|----------|-------|
| **Label** | Relationship to Decedent |
| **Input type** | `select` |
| **Options** | See variant display labels below |
| **Default** | *(required — no default; user must choose)* |
| **Wizard step** | Step 2: Family Tree → Add Person sub-form |
| **Conditional visibility** | Always visible in person sub-form |
| **Validation error** | "Please select the heir's relationship to the decedent." |

### Select Option Labels (Display → JSON value)

```typescript
export const RELATIONSHIP_OPTIONS = [
  // Compulsory heirs (Art. 887)
  { label: "Legitimate Child", value: "LegitimateChild" },
  { label: "Legitimated Child", value: "LegitimatedChild" },
  { label: "Adopted Child", value: "AdoptedChild" },
  { label: "Illegitimate Child", value: "IllegitimateChild" },
  { label: "Surviving Spouse", value: "SurvivingSpouse" },
  { label: "Legitimate Parent", value: "LegitimateParent" },
  { label: "Legitimate Ascendant (grandparent, etc.)", value: "LegitimateAscendant" },
  // Non-compulsory intestate heirs
  { label: "Sibling", value: "Sibling" },
  { label: "Nephew / Niece", value: "NephewNiece" },
  { label: "Other Collateral Relative", value: "OtherCollateral" },
  // Testamentary only (no inheritance right without will)
  { label: "Stranger (testamentary only)", value: "Stranger" },
] as const;
```

**UX note**: Group options under headings: "Compulsory Heirs", "Non-Compulsory Intestate Heirs", "Testamentary Only". Selecting `Stranger` should display an info tooltip: "Strangers have no intestate succession rights and may only receive through a will's free portion."

---

## Conditional Sub-Form Visibility

Selecting a Relationship drives which sub-fields appear on the Person form:

| Relationship | Sub-Form / Field Shown |
|---|---|
| `AdoptedChild` | `adoption` sub-form (adoption decree date, regime, adopter, adoptee, rescission) |
| `IllegitimateChild` | `filiation_proved` toggle + `filiation_proof_type` select |
| `SurvivingSpouse` | `is_guilty_party_in_legal_separation` toggle |
| `LegitimateParent` / `LegitimateAscendant` | `line` select (Paternal / Maternal) |
| `Sibling` | `blood_type` select (Full / Half) — required, not optional |
| All others | None beyond base Person fields |

---

## Edge Cases

### 1. Stranger Skipped by Engine
`step1_classify.rs:43–46`: `raw_category_from_relationship(Relationship::Stranger)` returns `None` — the person is not added to the `heirs` vec at all. A stranger in `family_tree` is silently ignored for inheritance computation. Strangers can appear in Will `HeirReference` as legatees/devisees. The frontend should warn users that adding a Stranger to the family tree has no effect unless they are named in the will.

### 2. Grandchildren use `LegitimateChild` + `degree = 2`
Test case `15-representation.json`: grandchildren are entered as `relationship_to_decedent: "LegitimateChild"` with `degree: 2`. There is no `Grandchild` variant. The engine uses `degree` to distinguish generations within the same relationship type. The frontend wizard should expose `degree` and explain: "Grandchildren inherit as Legitimate Children at degree 2."

### 3. LegitimatedChild vs LegitimateChild
`step1_classify.rs:971–990` (test `test_legitimated_child_same_as_legitimate`): `LegitimatedChild` maps to the same `EffectiveCategory::LegitimateChildGroup` as `LegitimateChild`. FC Art. 179 — legitimated children have identical succession rights. The frontend need not distinguish them post-classification, but must accept both as distinct inputs.

### 4. LegitimateParent vs LegitimateAscendant
Both map to `LegitimateAscendantGroup`. Use `LegitimateParent` (degree 1) for biological parents, `LegitimateAscendant` (degree 2+) for grandparents and beyond. Both require `line` (Paternal/Maternal).

### 5. No test cases for LegitimatedChild, LegitimateAscendant, NephewNiece, OtherCollateral, Stranger
These 5 variants have no coverage in `examples/cases/*.json`. They are exercised only in unit tests within `step1_classify.rs`. The frontend must handle them correctly but they are uncommon in real-world scenarios covered by current test corpus.

---

## Observed Test Case Usage

Across all 20 example cases (`examples/cases/*.json`):

| Relationship | Occurrences | Cases |
|---|---|---|
| `LegitimateChild` | 25 | 01, 02, 03, 06, 07, 10, 13–16, 19, 20 |
| `SurvivingSpouse` | 9 | 02, 04, 05, 06, 07, 10, 13, 16, 18, 19 |
| `IllegitimateChild` | 8 | 03, 09, 10, 18, 19 |
| `LegitimateParent` | 5 | 05, 08, 16 |
| `Sibling` | 2 | 11 |
| `AdoptedChild` | 1 | 17 |
| `LegitimatedChild` | 0 | *(unit tests only)* |
| `LegitimateAscendant` | 0 | *(unit tests only)* |
| `NephewNiece` | 0 | *(not tested in cases)* |
| `OtherCollateral` | 0 | *(not tested in cases)* |
| `Stranger` | 0 | *(not tested in cases)* |

---

## Rust → TypeScript Serialization

- Rust: `#[derive(Serialize, Deserialize)]` with default serde behavior → PascalCase variant names
- JSON wire format: plain string, e.g. `"LegitimateChild"`, `"SurvivingSpouse"`
- No transformation needed: TypeScript `string` literal union matches Rust variant names exactly
- **Never use snake_case** (`"legitimate_child"` is rejected by serde)
