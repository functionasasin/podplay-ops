# engine-input-root — EngineInput Struct Analysis

> **Rust source:** `../inheritance-rust-forward/src/types.rs:287-295`
> **Entry point:** `../inheritance-rust-forward/src/main.rs:34` — `serde_json::from_str::<EngineInput>()`
> **Pipeline consumer:** `../inheritance-rust-forward/src/pipeline.rs:20` — `run_pipeline(&EngineInput)`

## Rust Definition

```rust
// types.rs:287-295
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineInput {
    pub net_distributable_estate: Money,
    pub decedent: Decedent,
    pub family_tree: Vec<Person>,
    pub will: Option<Will>,
    pub donations: Vec<Donation>,
    pub config: EngineConfig,
}
```

**Serde config:** Standard `#[derive(Serialize, Deserialize)]` — no `rename_all`, no `default`, no custom attributes. All field names are snake_case in JSON.

## TypeScript Interface

```typescript
// Mirrors: ../inheritance-rust-forward/src/types.rs:287-295
export interface EngineInput {
  /** Net distributable estate in centavos. Required. */
  net_distributable_estate: Money;

  /** Decedent information. Required. */
  decedent: Decedent;

  /** All heirs and relatives in the family tree. Can be empty []. */
  family_tree: Person[];

  /** Will data. null for intestate succession. */
  will: Will | null;

  /** Prior donations subject to collation. Can be empty []. */
  donations: Donation[];

  /** Engine configuration flags. Required. */
  config: EngineConfig;
}
```

## Zod Schema

```typescript
import { z } from "zod";

// Mirrors: ../inheritance-rust-forward/src/types.rs:287-295
// Validation: serde_json deserialization at main.rs:34 — all fields required at JSON level
export const EngineInputSchema = z.object({
  net_distributable_estate: MoneySchema, // See analysis/money.md
  decedent: DecedentSchema,              // See analysis/decedent.md
  family_tree: z.array(PersonSchema),    // See analysis/person.md — can be empty
  will: WillSchema.nullable(),           // See analysis/will.md — null = intestate
  donations: z.array(DonationSchema),    // See analysis/donation.md — can be empty
  config: EngineConfigSchema,            // See analysis/engine-config.md
});

export type EngineInput = z.infer<typeof EngineInputSchema>;
```

## Field Metadata Table

| Field | Label | Input Type | Required | Default | Conditional Visibility | Wizard Step | Validation Error |
|-------|-------|-----------|----------|---------|----------------------|-------------|------------------|
| `net_distributable_estate` | Net Distributable Estate | MoneyInput (pesos) | Yes | — | Always visible | 1: Estate | "Net distributable estate is required" |
| `decedent` | Decedent Information | Sub-form | Yes | — | Always visible | 2: Decedent | (field-level errors in decedent sub-form) |
| `family_tree` | Family Members | PersonPicker[] | Yes (array, can be empty) | `[]` | Always visible | 3: Family Tree | (field-level errors per person) |
| `will` | Will | Sub-form | No | `null` | Visible when user selects "Testate" or "Mixed" succession | 4: Will | (field-level errors in will sub-form) |
| `donations` | Prior Donations | Donation[] | Yes (array, can be empty) | `[]` | Always visible (but step can be skipped) | 5: Donations | (field-level errors per donation) |
| `config` | Engine Configuration | Sub-form | Yes | `{ retroactive_ra_11642: false, max_pipeline_restarts: 10 }` | Advanced settings (collapsed by default) | 6: Config (advanced) |  |

## Pipeline Consumption Pattern

The pipeline (`pipeline.rs:20-157`) reads `EngineInput` fields as follows:

1. **`net_distributable_estate.centavos`** (line 21) — Immediately converted to `Frac` via `money_to_frac()`. Only used once at pipeline entry.
2. **`decedent`** (lines 30, 54) — Cloned into Step 1 (classify heirs) and Step 3 (scenario determination).
3. **`family_tree`** (lines 31, 41-50) — Cloned into Step 1. Also iterated directly to check for siblings/nephews/collaterals alive at succession for Step 3.
4. **`will`** (lines 24-28, 53) — Checked for `Some`/`None` to determine testate vs intestate. Disinheritances extracted from will for Step 1. Will content passed to Step 6 (validation) and Step 7 (distribution).
5. **`donations`** (line 60+) — Passed to Step 4 (estate base computation) and Step 8 (collation adjustment).
6. **`config.max_pipeline_restarts`** (line 121+) — Controls maximum restart loop iterations.

## Edge Cases & Gotchas

### Testate vs Intestate Determination

The engine determines testate/intestate purely from `will: Option<Will>`:
- `will: null` → intestate succession
- `will: { ... }` → testate succession (even if all sub-arrays are empty)

The frontend wizard should gate the entire Will step on a user toggle: "Did the decedent leave a will?"

### Empty Family Tree

A `family_tree: []` is valid JSON — it means no known heirs. The engine will still run (edge case: estate may escheat to the state). The frontend should allow but warn about this.

### Config Defaults

`EngineConfig` has a Rust `Default` impl (`types.rs:348-353`):
```rust
impl Default for EngineConfig {
    fn default() -> Self {
        Self {
            retroactive_ra_11642: false,
            max_pipeline_restarts: 10,
        }
    }
}
```
However, `EngineInput` itself has NO `#[serde(default)]`, so the `config` field is **required in JSON**. The frontend must always include it. The wizard should pre-populate with defaults and only expose config in an "Advanced" section.

### No Runtime Validation Beyond Deserialization

The engine does **not** have a separate validation pass on `EngineInput` before running the pipeline. If `serde_json::from_str` succeeds, the pipeline runs. This means:
- All structural validation lives in the type system (required fields, enum variants)
- Business logic validation happens within individual pipeline steps (e.g., Step 1 classifies heirs, Step 3 determines scenario)
- The frontend should do more validation than the engine requires (e.g., warn if `net_distributable_estate` is 0)

### JSON Shape — Canonical Example

```json
{
  "net_distributable_estate": { "centavos": 100000000 },
  "decedent": { "..." },
  "family_tree": [ { "..." } ],
  "will": null,
  "donations": [],
  "config": {
    "retroactive_ra_11642": false,
    "max_pipeline_restarts": 10
  }
}
```

## Serialization Notes

| Child Type | JSON Serialization | Notes |
|-----------|-------------------|-------|
| `Money` | `{"centavos": <int\|string>}` | Custom serde. Frontend displays pesos (÷100), sends centavos. Large values (>i64) serialized as strings. |
| `Frac` | `"n/d"` string | Custom serde. E.g. `"1/2"`, `"3/7"`. NOT `{numer, denom}` object. |
| All enums | PascalCase variant names | Standard serde. E.g. `"LegitimateChild"`, `"Paternal"`. |
| `Date` | ISO-8601 string | Type alias for `String`. E.g. `"2026-01-15"`. |
| `PersonId`, `HeirId`, etc. | Plain strings | Type aliases for `String`. |

## Wizard Step Mapping (Preliminary)

Based on the 6 top-level fields, a natural wizard flow is:

1. **Estate Value** — `net_distributable_estate` (single MoneyInput)
2. **Decedent Details** — `decedent` (sub-form with marriage/death details)
3. **Family Tree** — `family_tree` (dynamic list of Person entries)
4. **Will** — `will` (conditionally shown; sub-form with institutions/legacies/devises/disinheritances)
5. **Donations** — `donations` (dynamic list of Donation entries)
6. **Review & Config** — `config` (advanced settings + review all inputs)

This mapping will be refined in Wave 2 analysis (conditional-visibility, shared-components).
