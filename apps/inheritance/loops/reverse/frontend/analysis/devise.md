# Analysis: `devise` — Devise struct, DeviseSpec enum

**Rust source**: `../inheritance-rust-forward/src/types.rs:416–429`
**Pipeline consumption**: `step6_validation.rs` (addressed-heir check, Art. 911 reduction), `step7_distribute.rs` (disposition totalling), `step9_vacancy.rs` (substitute resolution)

---

## Rust Definitions

```rust
// types.rs:416–423
pub struct Devise {
    pub id: DispositionId,          // = String
    pub devisee: HeirReference,
    pub property: DeviseSpec,
    pub conditions: Vec<Condition>,
    pub substitutes: Vec<Substitute>,
    pub is_preferred: bool,
}

// types.rs:425–429
pub enum DeviseSpec {
    SpecificProperty(AssetId),              // entire ownership of one asset
    FractionalInterest(AssetId, Frac),      // undivided fraction of one asset
}

// type aliases (types.rs:13–15)
pub type DispositionId = String;
pub type AssetId = String;
```

---

## JSON Serialization Notes

### DeviseSpec Variants

Serde default external tagging. Newtype and tuple variants wrap content in an object keyed by variant name:

| Variant | JSON example |
|---------|-------------|
| `SpecificProperty(AssetId)` | `{"SpecificProperty": "lot-1-tagaytay"}` |
| `FractionalInterest(AssetId, Frac)` | `{"FractionalInterest": ["lot-1-tagaytay", "1/3"]}` |

**Frac serialization**: `"numer/denom"` string (fraction.rs:241–243, e.g. `"1/3"`). The Frac field in `FractionalInterest` appears as the second element of a 2-tuple array.

### Full Devise JSON example

```json
{
  "id": "dev-1",
  "devisee": {
    "person_id": "c1",
    "name": "Jose Santos",
    "is_collective": false,
    "class_designation": null
  },
  "property": { "SpecificProperty": "lot-1-tagaytay" },
  "conditions": [],
  "substitutes": [],
  "is_preferred": false
}
```

```json
{
  "id": "dev-2",
  "devisee": {
    "person_id": "c2",
    "name": "Maria Santos",
    "is_collective": false,
    "class_designation": null
  },
  "property": { "FractionalInterest": ["house-manila", "1/2"] },
  "conditions": [],
  "substitutes": [],
  "is_preferred": true
}
```

---

## TypeScript Interface

```typescript
// Mirrors types.rs:416–429

/**
 * A testamentary devise — gift of real property (immovable) in a will.
 * Distinguished from Legacy (personal property / money) by Philippine Civil Code.
 * Mirrors types.rs:416–423 Devise.
 */
export interface Devise {
  /** Unique identifier within this will. Frontend generates (e.g. "dev-1"). */
  id: string;
  /** Who receives the property. Reuses HeirReference (same as InstitutionOfHeir). */
  devisee: HeirReference;
  /** What specific property is devised. */
  property: DeviseSpec;
  /** Conditions attached to this devise (Art. 871–877). Can be empty. */
  conditions: Condition[];
  /** Substitute devisees (Arts. 857–870). Can be empty. */
  substitutes: Substitute[];
  /**
   * Preferred devises survive longer in Art. 911 reduction:
   * non-preferred devises/legacies are reduced first (Phase 1a),
   * preferred reduced only after non-preferred exhausted (Phase 1b).
   * step6_validation.rs:578–630.
   *
   * NOTE: current engine assigns Frac::zero() to all devises in
   * compute_devise_value (step7_distribute.rs:164–168), so devises
   * currently do not affect monetary reduction calculations.
   * is_preferred still matters for correctness when that is implemented.
   */
  is_preferred: boolean;
}

/**
 * What real property is being devised.
 * Mirrors types.rs:425–429 DeviseSpec.
 *
 * JSON serialization uses serde external tagging:
 *   SpecificProperty  → { "SpecificProperty": "asset-id" }
 *   FractionalInterest → { "FractionalInterest": ["asset-id", "n/d"] }
 *
 * Frac field is a "numer/denom" string (fraction.rs:241–243).
 */
export type DeviseSpec =
  | { SpecificProperty: string }                   // AssetId: entire property
  | { FractionalInterest: [string, string] };      // [AssetId, Frac "n/d"]
```

---

## Zod Schema

```typescript
import { z } from "zod";

// Origin: fraction.rs:246–265 — Frac deserializer requires "n/d" format, denom ≠ 0
const FracSchema = z
  .string()
  .regex(/^-?\d+\/-?\d+$/, 'Must be in "n/d" format, e.g. "1/3"')
  .refine(
    (s) => {
      const parts = s.split("/");
      return parts[1] !== "0";
    },
    { message: "Denominator cannot be zero" }
  )
  .refine(
    (s) => {
      const [n, d] = s.split("/").map(Number);
      return n > 0 && d > 0;
    },
    { message: "Fractional interest must be positive (numerator > 0, denominator > 0)" }
  )
  .refine(
    (s) => {
      const [n, d] = s.split("/").map(Number);
      return n <= d; // fraction ≤ 1: can't devise more than 100% of an asset
    },
    { message: "Fractional interest cannot exceed 100% of the property" }
  );

// Origin: types.rs:425–429 DeviseSpec enum
const DeviseSpecSchema = z.union([
  z.object({ SpecificProperty: z.string().min(1, "Asset ID is required") }),
  z.object({
    FractionalInterest: z
      .tuple([
        z.string().min(1, "Asset ID is required"),
        FracSchema,
      ]),
  }),
]);

// Origin: types.rs:416–423 Devise
// Condition/Substitute schemas defined in condition-substitute analysis
export const DeviseSchema = z.object({
  id: z.string().min(1, "Devise ID is required"),
  devisee: HeirReferenceSchema,           // from institution-of-heir analysis
  property: DeviseSpecSchema,
  conditions: z.array(ConditionSchema).default([]),
  substitutes: z.array(SubstituteSchema).default([]),
  is_preferred: z.boolean().default(false),
});
```

---

## Field Metadata Table

### Devise top-level fields

| Field | Label | Input Type | Default | Conditional Visibility | Validation Error | Wizard Step |
|-------|-------|-----------|---------|----------------------|-----------------|-------------|
| `id` | — | Hidden (auto-generated) | `"dev-{n}"` | — | — | Will — Devises |
| `devisee` | Devisee | Composite (HeirReference sub-form) | — | Always visible | — | Will — Devises |
| `property` | Property type | Select (SpecificProperty / FractionalInterest) | `"SpecificProperty"` | Always visible | — | Will — Devises |
| `property.SpecificProperty` | Asset ID | Text | `""` | When property type = SpecificProperty | "Asset ID is required" | Will — Devises |
| `property.FractionalInterest[0]` | Asset ID | Text | `""` | When property type = FractionalInterest | "Asset ID is required" | Will — Devises |
| `property.FractionalInterest[1]` | Fractional interest | Text (`"n/d"`) | `""` | When property type = FractionalInterest | `'Enter as "n/d", e.g. "1/3"'`; "Denom ≠ 0"; "Cannot exceed 100%" | Will — Devises |
| `conditions` | Conditions | Repeatable sub-form (collapsible) | `[]` | Always visible | — | Will — Devises |
| `substitutes` | Substitutes | Repeatable sub-form (collapsible) | `[]` | Always visible | — | Will — Devises |
| `is_preferred` | Preferred devise | Toggle | `false` | Always visible | — | Will — Devises |

### DeviseSpec type selector options

| Value | Display label | Description |
|-------|--------------|-------------|
| `"SpecificProperty"` | Specific property | Entire ownership of one asset (e.g. a parcel of land) |
| `"FractionalInterest"` | Fractional interest | An undivided portion of one asset (e.g. 1/3 of a house) |

### HeirReference sub-fields (devisee)

Same sub-fields as `InstitutionOfHeir.heir` — see `analysis/institution-of-heir.md` for the full table.

| Field | Label | Default | Conditional |
|-------|-------|---------|-------------|
| `person_id` | Select person | `null` | Visible when `is_collective = false` |
| `name` | Devisee name | `""` | Always visible |
| `is_collective` | Collective | `false` | Always visible |
| `class_designation` | Class description | `null` | Visible when `is_collective = true` |

---

## Pipeline Consumption Details

### 1. Addressed-heir check (step6_validation.rs:841–844)

Devises count as "addressing" a compulsory heir for preterition purposes. If a compulsory heir is mentioned in a devise but nowhere else, the will has not totally omitted them (Art. 854).

```typescript
// Frontend preterition-risk check must include devises:
function heirAddressedInWill(will: Will, personId: string): boolean {
  const inInstitution = will.institutions.some(
    (i) => i.heir.person_id === personId
  );
  const inLegacy = will.legacies.some(
    (l) => l.legatee.person_id === personId
  );
  const inDevise = will.devises.some(
    (d) => d.devisee.person_id === personId
  );
  const inDisinheritance = will.disinheritances.some(
    (d) => d.heir_reference.person_id === personId
  );
  return inInstitution || inLegacy || inDevise || inDisinheritance;
}
```

### 2. Art. 911 reduction — monetary value currently zero (step7_distribute.rs:163–168, step6_validation.rs:586)

`compute_devise_value` returns `Frac::zero()` for **both** `DeviseSpec` variants. The engine comment (step6_validation.rs:586) explicitly notes: *"Devises don't have monetary amounts in current model — skip for now"*.

This means:
- Devises do **not** affect the total inofficious-disposition calculation.
- Devises do **not** trigger Art. 911 monetary reduction against the legitime.
- The `is_preferred` flag is stored but has no current effect on devises.

Frontend implication: No monetary validation is needed for devise amounts. Display an informational note: *"Specific property devises require appraisal to determine if they exceed the free portion. The engine does not currently compute this."*

### 3. Substitute resolution on vacancy (step9_vacancy.rs:629–649)

When a devisee's position becomes vacant (predecease, renunciation, incapacity), the engine checks `devise.substitutes` in the same way as institution/legacy substitutes. The first eligible (alive + eligible) substitute is activated.

### 4. Disposition total (step7_distribute.rs:1025–1027)

```rust
for devise in &will.devises {
    total_will_dispositions = total_will_dispositions + compute_devise_value(devise);
}
```

Returns zero — no effect on totals currently.

---

## Devise vs Legacy Comparison

| Aspect | Devise | Legacy |
|--------|--------|--------|
| Civil Code concept | Real property (immovable) | Personal property / money |
| Rust enum | `DeviseSpec` | `LegacySpec` |
| Monetary value | None (`Frac::zero()`) | Can carry `Money` (FixedAmount) |
| Art. 911 reduction | Skipped (no value) | Included when `FixedAmount` |
| Struct field | `devisee: HeirReference` | `legatee: HeirReference` |
| `is_preferred` | Same semantics | Same semantics |
| Substitutes | Supported | Supported |

---

## Edge Cases

1. **FractionalInterest fraction > 1**: e.g. `"3/2"`. The engine does not currently validate this (devises return 0 in compute_devise_value). The Zod schema should reject fractions > 1 with "Cannot exceed 100% of the property."

2. **Same AssetId in multiple devises**: Two devises could reference the same property — e.g., 1/2 to person A and 1/2 to person B. This is valid and common for co-ownership. Alternatively, two SpecificProperty devises on the same asset would create a conflict (100% + 100% = over-disposition). Frontend should warn when the same asset appears multiple times.

3. **AssetId as free text**: The engine treats `AssetId = String` as an opaque identifier. There is no asset catalog in the engine input — the frontend must either (a) allow free-text entry or (b) maintain a local asset catalog. An asset catalog is recommended so the same asset can be referenced consistently across devises, legacies, and FractionalInterest tuples.

4. **Devise to collective devisee**: `is_collective: true` in HeirReference. Engine cannot resolve collective designations to specific Heir records. Devise will not be linked to any person — substitute resolution won't fire. Frontend should warn: "Collective devises cannot be resolved to specific heirs by the engine."

5. **Devise with no substitutes on vacancy**: If devisee predeceases and no substitute is set, the devise lapses (Art. 1024). The vacated devise share returns to the estate for accretion (step9_vacancy.rs). Frontend should prompt: "Add a substitute to prevent lapse if the devisee predeceases."

6. **FractionalInterest with Frac "0/1"**: Mathematically valid but semantically meaningless — devises a 0% interest. Zod should reject `n = 0` with "Numerator must be greater than 0."

---

## Rust → TS Mapping Notes

| Rust | TypeScript | Serialization |
|------|-----------|---------------|
| `DispositionId` (= String) | `string` | JSON string |
| `HeirReference` | `HeirReference` interface | JSON object |
| `DeviseSpec::SpecificProperty(AssetId)` | `{ SpecificProperty: string }` | `{"SpecificProperty": "asset-id"}` |
| `DeviseSpec::FractionalInterest(AssetId, Frac)` | `{ FractionalInterest: [string, string] }` | `{"FractionalInterest": ["asset-id", "1/3"]}` |
| `Frac` in FractionalInterest | `string` | `"numer/denom"` (fraction.rs:241–243) |
| `Vec<Condition>` | `Condition[]` | JSON array |
| `Vec<Substitute>` | `Substitute[]` | JSON array |
| `is_preferred: bool` | `boolean` | JSON boolean |

**Frac serialization reminder**: `"numer/denom"` string, e.g. `"1/3"` (fraction.rs:241–243). NOT `{numer, denom}` object. Applied to the second element of the `FractionalInterest` tuple.

**Money note**: Devises carry no `Money` field. The engine cannot compute monetary value for specific property devises without appraisal data not present in the input schema.
