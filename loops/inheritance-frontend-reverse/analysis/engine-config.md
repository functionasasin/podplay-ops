# engine-config — EngineConfig Struct Analysis

> **Rust source:** `../inheritance-rust-forward/src/types.rs:344-357`
> **Default impl:** `../inheritance-rust-forward/src/types.rs:350-357`
> **Pipeline consumer:** `../inheritance-rust-forward/src/pipeline.rs:131,237` — `input.config.max_pipeline_restarts`
> **Step 9 consumer:** `../inheritance-rust-forward/src/step9_vacancy.rs:148` — `input.restart_count < input.max_restarts`

## Rust Definition

```rust
// types.rs:344-348
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EngineConfig {
    pub retroactive_ra_11642: bool,
    pub max_pipeline_restarts: i32,
}

// types.rs:350-357
impl Default for EngineConfig {
    fn default() -> Self {
        Self {
            retroactive_ra_11642: false,
            max_pipeline_restarts: 10,
        }
    }
}
```

**Serde config:** Standard `#[derive(Serialize, Deserialize)]` — no `rename_all`, no `default`, no `serde(default)`. Both fields are required in JSON. The `Default` impl exists for Rust code convenience but is **not** invoked by serde deserialization.

## TypeScript Interface

```typescript
// Mirrors: ../inheritance-rust-forward/src/types.rs:344-348
export interface EngineConfig {
  /**
   * Whether to apply RA 11642 (Domestic Administrative Adoption and
   * Alternative Child Care Act, 2022) retroactively to adoptions
   * decreed under the prior RA 8552 regime.
   *
   * When `true`, adopted children under RA 8552 are treated as having
   * the same rights as RA 11642 adoptees (full legitimate child status).
   *
   * Default: false (strict regime-based treatment).
   *
   * NOTE: As of the current engine version, this flag is defined but
   * NOT yet consumed by any pipeline step. It is a forward-looking
   * config flag. The frontend should expose it but document that it
   * has no effect in the current engine version.
   */
  retroactive_ra_11642: boolean;

  /**
   * Maximum number of pipeline restarts allowed before the engine
   * stops and emits a "max_restarts" warning.
   *
   * Pipeline restarts occur when Step 9 (vacancy resolution) detects
   * that total renunciation of a degree (Art. 969) or a legitime
   * vacancy in testate succession (Art. 1021) requires complete
   * scenario re-evaluation.
   *
   * Default: 10. Guard against infinite restart loops.
   *
   * Consumed at: pipeline.rs:131,237 → step9_vacancy.rs:148
   */
  max_pipeline_restarts: number;
}
```

## Zod Schema

```typescript
import { z } from "zod";

// Mirrors: ../inheritance-rust-forward/src/types.rs:344-348
// Default impl: types.rs:350-357
// Validation:
//   - retroactive_ra_11642: boolean, no pipeline consumption yet (types.rs:346)
//   - max_pipeline_restarts: i32 in Rust, compared as `restart_count < max_restarts`
//     at step9_vacancy.rs:148. Must be >= 1 for pipeline to allow any restart.
//     Default 10. No upper bound enforced by engine.
export const EngineConfigSchema = z.object({
  retroactive_ra_11642: z
    .boolean()
    .default(false)
    .describe("Apply RA 11642 retroactively to RA 8552 adoptions"),

  max_pipeline_restarts: z
    .number()
    .int()
    .min(1, "Must allow at least 1 pipeline restart")
    .max(100, "Unreasonably high restart limit")
    .default(10)
    .describe("Maximum pipeline restart iterations"),
});

export type EngineConfig = z.infer<typeof EngineConfigSchema>;
```

### Schema Notes

The Zod schema uses `.default()` so the frontend form can omit these fields and get sensible defaults. However, when serializing to JSON for the engine, **both fields must be present** (the engine's serde has no `#[serde(default)]` on `EngineConfig`).

The `min(1)` constraint on `max_pipeline_restarts` is a frontend-only guard: if set to 0, the engine would never restart even when Art. 969 total renunciation requires it, resulting in a `"max_restarts"` warning instead of correct results. The `max(100)` is a sanity cap — the engine itself has no upper bound, but values above ~20 indicate a misconfiguration since restarts are O(n) where n is the number of heir degrees.

## Field Metadata Table

| Field | Label | Input Type | Options | Default | Conditional Visibility | Wizard Step | Validation Error |
|-------|-------|-----------|---------|---------|----------------------|-------------|------------------|
| `retroactive_ra_11642` | Apply RA 11642 Retroactively | Toggle (checkbox) | — | `false` | Always visible in Advanced Settings. Only relevant when `family_tree` contains an `AdoptedChild` with `adoption.regime = "Ra8552"` — consider showing a hint in that case. | 6: Review & Config (Advanced) | — (boolean, no invalid state) |
| `max_pipeline_restarts` | Max Pipeline Restarts | Number (stepper) | — | `10` | Always visible in Advanced Settings. | 6: Review & Config (Advanced) | "Must be between 1 and 100" |

## Pipeline Consumption Detail

### `retroactive_ra_11642`

**Current status: NOT CONSUMED by any pipeline step.**

The field is defined in `types.rs:346` and has a default of `false`, but `retroactive_ra_11642` only appears in `types.rs` — zero references in any pipeline stage file (`step1_classify.rs` through `step10_finalize.rs`), `pipeline.rs`, or any other source file.

This is a forward-looking config flag. When the engine implements RA 11642 retroactivity, it would likely be consumed in Step 1 (heir classification) where `AdoptionRegime::Ra8552` adoptees would be reclassified with full legitimate child rights.

**Frontend implication:** Expose the toggle in Advanced Settings, but display a note:
> "This option is reserved for future engine support. Currently has no effect on computation."

### `max_pipeline_restarts`

**Consumed at two points:**

1. **`pipeline.rs:131`** — Initial pipeline run passes `input.config.max_pipeline_restarts` as `max_restarts` to Step 9.
2. **`pipeline.rs:237`** — Restart pipeline run also passes `input.config.max_pipeline_restarts`.

**Step 9 guard logic** (`step9_vacancy.rs:148`):
```rust
let can_restart = input.restart_count < input.max_restarts;
```

When `can_restart` is `false`:
- **Art. 969 total renunciation** (`step9_vacancy.rs:196-203`): Emits a `ManualFlag` with `category: "max_restarts"` instead of restarting.
- **Art. 1021 legitime vacancy** (`step9_vacancy.rs:344-351`): Same warning, falls through to free-portion accretion as a degraded resolution.

**Restart scenarios:**
- Total renunciation of all heirs in a degree (Art. 969) — e.g., all legitimate children renounce
- Legitime vacancy in testate succession (Art. 1021) — e.g., an instituted compulsory heir's share is vacated

The current pipeline architecture supports exactly 1 restart (`run_pipeline_with_restart` at `pipeline.rs:160`), so values > 1 are a safety margin but unlikely to be exercised. The default of 10 is generous.

## Edge Cases

### Config is Required in JSON

Despite having a `Default` impl in Rust, the `config` field on `EngineInput` has no `#[serde(default)]`, so the JSON **must** include the `config` object. The frontend must always serialize it.

### Zero or Negative `max_pipeline_restarts`

Setting `max_pipeline_restarts: 0` means `restart_count (0) < max_restarts (0)` is `false`, so the pipeline will **never** restart. This produces degraded results with `ManualFlag` warnings when restarts are needed. The frontend should enforce `>= 1`.

Negative values (valid for Rust `i32`) would also disable restarts. The frontend Zod schema guards with `.min(1)`.

### `retroactive_ra_11642` Has No Effect

Toggling this flag changes nothing in the engine output. All 90+ fuzz test cases use `retroactive_ra_11642: false`. No test case exercises `true`. The frontend should make this clear to avoid user confusion.

## Test Case Coverage

Examined all fuzz cases in `../inheritance-rust-forward/examples/fuzz-cases/`:
- **Every case** uses `"retroactive_ra_11642": false` — no case exercises `true`
- **Every case** uses `"max_pipeline_restarts": 10` — no case exercises non-default values
- Unit test `test_step9_max_restarts_guard` (`step9_vacancy.rs:1490`) explicitly tests the guard with `restart_count: 10, max_restarts: 10` to verify the engine respects the limit

## JSON Shape

```json
{
  "config": {
    "retroactive_ra_11642": false,
    "max_pipeline_restarts": 10
  }
}
```

Both fields are snake_case. Both are required (no serde defaults on the parent struct).
