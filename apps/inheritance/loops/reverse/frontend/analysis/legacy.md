# Analysis: Legacy & LegacySpec

**Rust source**: `types.rs:399–413`
**Pipeline consumers**: `step6_validation.rs`, `step7_distribute.rs`, `step9_vacancy.rs`
**Test case with legacies**: `examples/cases/14-testate-legacy.json`

---

## Rust Definitions

```rust
// types.rs:399–406
pub struct Legacy {
    pub id: DispositionId,         // String alias
    pub legatee: HeirReference,
    pub property: LegacySpec,
    pub conditions: Vec<Condition>,
    pub substitutes: Vec<Substitute>,
    pub is_preferred: bool,
}

// types.rs:408–413
pub enum LegacySpec {
    FixedAmount(Money),
    SpecificAsset(AssetId),          // AssetId = String alias
    GenericClass(String, Money),      // (class_description, estimated_value)
}
```

---

## JSON Serialization

Rust serde uses external tagging for enums. Observed from `14-testate-legacy.json`:

| Variant | JSON format |
|---------|------------|
| `FixedAmount(money)` | `{"FixedAmount": {"centavos": 200000000}}` |
| `SpecificAsset(id)` | `{"SpecificAsset": "some-asset-id"}` |
| `GenericClass(desc, money)` | `{"GenericClass": ["class description", {"centavos": 50000}]}` |

`GenericClass` serializes as a 2-tuple JSON array: `[string, Money]`.

Full example from test case 14:
```json
{
  "id": "l1",
  "legatee": {"person_id": null, "name": "Church of Manila", "is_collective": false, "class_designation": null},
  "property": {"FixedAmount": {"centavos": 200000000}},
  "conditions": [],
  "substitutes": [],
  "is_preferred": false
}
```

---

## TypeScript Interface

```typescript
// Mirrors Rust Legacy struct (types.rs:399–406)
interface Legacy {
  id: string;                   // DispositionId — wizard-generated, e.g. "legacy-1"
  legatee: HeirReference;       // See analysis/institution-of-heir.md for HeirReference
  property: LegacySpec;
  conditions: Condition[];      // See analysis/condition-substitute.md; [] is valid
  substitutes: Substitute[];    // See analysis/condition-substitute.md; [] is valid
  is_preferred: boolean;        // Art. 911 reduction priority; default false
}

// Mirrors Rust LegacySpec enum (types.rs:408–413)
type LegacySpec =
  | { FixedAmount: Money }                          // Fixed monetary bequest
  | { SpecificAsset: string }                       // Asset ID reference
  | { GenericClass: [string, Money] };              // [class_description, estimated_value]

// Discriminant key for form switching
type LegacySpecKind = "FixedAmount" | "SpecificAsset" | "GenericClass";
```

---

## Zod Validation Schema

```typescript
import { z } from "zod";
import { MoneySchema } from "./schemas"; // from analysis/money.md
import { HeirReferenceSchema } from "./schemas"; // from analysis/institution-of-heir.md
import { ConditionSchema, SubstituteSchema } from "./schemas"; // from analysis/condition-substitute.md

// Constraint origins:
// - FixedAmount: centavos must be > 0 — enforced by step6_validation.rs:resolve_legacy_amount
//   (zero-value legacies have no effect; engine doesn't error but frontend should warn)
// - SpecificAsset: non-empty asset ID — no engine validation; frontend enforces referential presence
// - GenericClass: description non-empty + centavos > 0 — same origin as FixedAmount
// - is_preferred: Art. 911 ¶2 (step6_validation.rs:580–632) — no constraint beyond bool
// - conditions/substitutes: [] valid (step6_validation.rs implicitly allows empty)

const LegacySpecSchema = z.union([
  z.object({
    FixedAmount: MoneySchema,
    // Constraint: centavos > 0 (step6_validation.rs:resolve_legacy_amount — zero has no effect)
  }).refine(
    (v) => BigInt(v.FixedAmount.centavos) > 0n,
    { message: "Legacy amount must be greater than ₱0.00", path: ["FixedAmount"] }
  ),
  z.object({
    SpecificAsset: z.string().min(1, "Asset ID is required for SpecificAsset legacy"),
    // Note: engine treats SpecificAsset as Frac::zero for computation (step6_validation.rs:819)
    // Needs appraisal — engine does not compute its monetary value
  }),
  z.object({
    GenericClass: z.tuple([
      z.string().min(1, "Generic class description is required"),
      MoneySchema,
      // Constraint: centavos > 0 (step6_validation.rs:resolve_legacy_amount)
    ]).refine(
      ([, money]) => BigInt(money.centavos) > 0n,
      { message: "Estimated value must be greater than ₱0.00" }
    ),
  }),
]);

const LegacySchema = z.object({
  id: z.string().min(1),
  legatee: HeirReferenceSchema,
  property: LegacySpecSchema,
  conditions: z.array(ConditionSchema).default([]),
  substitutes: z.array(SubstituteSchema).default([]),
  is_preferred: z.boolean().default(false),
});
```

---

## Field Metadata Table

All fields below appear in the **Will Step → Legacies sub-section**.

| Field | Label | Input Type | Default | Conditional Visibility | Error Message | Validation Origin |
|-------|-------|-----------|---------|----------------------|---------------|-------------------|
| `id` | — | hidden/auto | `"legacy-{n}"` | always | — | Frontend-generated |
| `legatee.person_id` | Legatee | select + "Stranger" option | `null` | always | — | None (engine uses name if null) |
| `legatee.name` | Legatee Name | text | `""` | required when person_id is null | "Name is required for stranger legatees" | Frontend |
| `legatee.is_collective` | Collective Legatee | toggle | `false` | show when person_id is null | — | Informational only |
| `legatee.class_designation` | Class Description | text | `null` | show when is_collective=true | — | Informational only |
| `property` (kind selector) | Legacy Type | radio/select | `"FixedAmount"` | always | "Select legacy type" | Frontend |
| `property.FixedAmount` | Amount (₱) | MoneyInput | — | when kind=FixedAmount | "Amount must be greater than ₱0.00" | step6_validation.rs:resolve_legacy_amount |
| `property.SpecificAsset` | Asset ID | text | `""` | when kind=SpecificAsset | "Asset ID is required" | Frontend |
| `property.GenericClass[0]` | Class Description | text | `""` | when kind=GenericClass | "Description is required" | Frontend |
| `property.GenericClass[1]` | Estimated Value (₱) | MoneyInput | — | when kind=GenericClass | "Estimated value must be greater than ₱0.00" | step6_validation.rs:resolve_legacy_amount |
| `conditions` | Conditions | repeater (Condition sub-form) | `[]` | collapsible; show when expanded | — | step6_validation.rs (applied to all dispositions) |
| `substitutes` | Substitutes | repeater (Substitute sub-form) | `[]` | collapsible; show when expanded | — | step9_vacancy.rs:607–621 |
| `is_preferred` | Preferred Legacy | toggle | `false` | always | — | Art. 911 ¶2 (step6_validation.rs:580) |

---

## Engine Behavior — Pipeline Walkthrough

### Step 6: Validation & Inofficiousness (step6_validation.rs)

**`resolve_legacy_amount()`** (line ~816):
```rust
fn resolve_legacy_amount(spec: &LegacySpec) -> Frac {
    match spec {
        LegacySpec::FixedAmount(money) => Frac::from_money_centavos(&money.centavos),
        LegacySpec::SpecificAsset(_) => Frac::zero(),   // ← NOT computed; needs appraisal
        LegacySpec::GenericClass(_, money) => Frac::from_money_centavos(&money.centavos),
    }
}
```

**Inofficiousness check** (step6_validation.rs:505–514):
- All legacy amounts summed together with institution amounts
- Total compared against `fp_disposable` (Free Portion disposable)
- If total > fp_disposable → excess triggers Art. 911 reductions

**Art. 911 reduction order** (step6_validation.rs:574–632):
- **Phase 1a**: Non-preferred legacies (`is_preferred=false`) reduced pro rata until excess absorbed
- **Phase 1b**: Preferred legacies (`is_preferred=true`) reduced only after all non-preferred exhausted

**Preterition check** (step6_validation.rs:836–839):
- A legacy with `legatee.person_id` matching a compulsory heir's ID counts as "addressing" that heir
- Defeats preterition even if amount is minimal (₱1 token legacy — Art. 855)

### Step 7: Distribution (step7_distribute.rs)

**`compute_legacy_value()`** (line ~155): identical logic to `resolve_legacy_amount()`

**Legacy distribution** (step7_distribute.rs:328–351):
- Legacies paid from the Free Portion, after institutions
- If Step 6 inofficiousness detected: uses reduced amount from `reduction.remaining_amount`
- Legatee ID: uses `legatee.person_id` if present, else `legatee.name` as key
- **Capped at remaining FP**: if FP exhausted by institutions, legacy receives ₱0

### Step 9: Vacancy (step9_vacancy.rs)

**Substitute resolution** (step9_vacancy.rs:607–621):
- If legatee is dead or ineligible, `legacy.substitutes` are checked in order
- First eligible substitute heir receives the legacy instead

---

## Edge Cases

### 1. SpecificAsset — Engine Treats as Zero
`SpecificAsset` legacies have zero monetary value in the engine's computation. The engine does not look up any asset inventory. Frontend must warn:
> "Specific asset legacies are not included in the engine's monetary computation. The asset will be shown in output narratives but won't affect share calculations."

### 2. GenericClass — Two-Tuple Array Serialization
The JSON for `GenericClass` is a JSON array, not an object:
```json
{"GenericClass": ["Books from library of decedent", {"centavos": 50000}]}
```
Frontend form must serialize in this exact format.

### 3. Stranger Legatees (person_id: null)
From case 14: `"Church of Manila"` has `person_id: null`. The engine uses `legatee.name` as the distribution key. This legatee does NOT appear in `per_heir_shares` since it's not in `family_tree`. Frontend note: stranger legatees will only appear in the computation log / FP distribution, not in the heirs table.

### 4. Token Legacy and Preterition (Art. 855)
Even a ₱1 legacy (`{"centavos": 1}`) with `legatee.person_id` set to a compulsory heir's ID defeats preterition for that heir. Frontend should not prevent small-amount legacies.

### 5. Preferred vs Non-Preferred — No Cross-Validation
The engine does not require any non-preferred legacy to exist before a preferred one. A will with only preferred legacies is valid; they reduce in Phase 1b from the start.

### 6. is_preferred Applies to All Variant Types
`is_preferred` affects reduction order regardless of `LegacySpec` variant. A preferred `SpecificAsset` legacy has zero monetary value anyway (Frac::zero), so preference has no practical effect for that variant.

### 7. Conditions and Substitutes — Delegation
`conditions` and `substitutes` on a Legacy follow the same schemas as on InstitutionOfHeir. See `analysis/condition-substitute.md` (to be written) for full specs.

---

## Rust → TypeScript Mapping Notes

| Rust | TypeScript / JSON | Notes |
|------|-------------------|-------|
| `DispositionId` (= `String`) | `string` | Frontend auto-generates as `"legacy-{n}"` |
| `HeirReference` | `HeirReference` | Shared type — see analysis/institution-of-heir.md |
| `LegacySpec::FixedAmount(Money)` | `{ FixedAmount: { centavos: number \| string } }` | Same Money rules: i64→number, BigInt→string |
| `LegacySpec::SpecificAsset(AssetId)` | `{ SpecificAsset: string }` | AssetId is plain String |
| `LegacySpec::GenericClass(String, Money)` | `{ GenericClass: [string, { centavos: number \| string }] }` | 2-tuple JSON array |
| `Vec<Condition>` | `Condition[]` | Empty array `[]` is default and valid |
| `Vec<Substitute>` | `Substitute[]` | Empty array `[]` is default and valid |
| `is_preferred: bool` | `boolean` | Default `false` |

### Money Conversion
- **Engine input**: centavos (integer)
- **Frontend display**: pesos = centavos ÷ 100 with `₱` prefix
- `FixedAmount` and `GenericClass[1]` both use MoneyInput component (from analysis/money.md)

---

## Wizard Step Placement

**Step**: Will (shown only when `will` is not null — i.e., testate)
**Sub-section**: "Legacies" (collapsible, default collapsed if empty)
**Order within Will step**: after Institutions, before Devises

Each legacy entry is a card with:
1. Legatee selector (family_tree members + "Add stranger" option)
2. Legacy Type radio (Fixed Amount | Specific Asset | Generic Class)
3. Conditional property fields (per type)
4. Preferred toggle with tooltip: "Preferred legacies are reduced only after non-preferred are exhausted (Art. 911)"
5. [+ Condition] and [+ Substitute] expandable sections
6. [Remove] button

Add Legacy button: `[+ Add Legacy]`
Min count: 0 (array can be empty)
Max count: no engine limit; frontend may cap at 20 for UX

---

## Dependencies on Other Aspects

- `HeirReference` — from `analysis/institution-of-heir.md` (already analyzed)
- `Money` — from `analysis/money.md` (already analyzed)
- `Condition`, `Substitute` — from `analysis/condition-substitute.md` (pending)
- `Devise` — sibling type, parallel structure (pending in `analysis/devise.md`)
