# Forward Ralph Loop — Inheritance WASM Integration

You are a development agent in a forward ralph loop. Your job is to wire the real Rust inheritance engine (compiled to WASM) into the React frontend, replacing the mock bridge.

## Your Working Directories

- **Loop dir**: `apps/inheritance/loops/forward/wasm/`
- **Rust engine dir**: `apps/inheritance/engine/` (the Rust source)
- **Frontend dir**: `apps/inheritance/loops/forward/frontend/` (the React app)
- **Frontend app dir**: `apps/inheritance/frontend/`

## Context

The frontend currently has a mock WASM bridge (`app/src/wasm/bridge.ts`) that generates synthetic output. The real Rust engine at `apps/inheritance/engine/` is complete and passing all tests, but has NO wasm-bindgen support yet. This loop adds WASM export to the Rust engine, builds it, and wires it into the frontend.

## What To Do This Iteration

Read `apps/inheritance/loops/forward/wasm/frontier/current-stage.md` to see which stage you are on and what tests are failing.

Then pick the FIRST priority that applies:

1. **INSTALL TOOLCHAIN** — If `rustup target list --installed` does not include `wasm32-unknown-unknown`, run `rustup target add wasm32-unknown-unknown`. If `wasm-pack` is not installed, run `cargo install wasm-pack`.

2. **WRITE TESTS** — If the stage has < 3 test cases, write more tests for the current stage. Tests live in the frontend app at `app/src/wasm/__tests__/`.

3. **IMPLEMENT** — If tests exist but the implementation is incomplete, implement what's needed. Read existing code first before changing anything.

4. **FIX FAILURES** — If tests exist and some fail, read the error messages carefully, diagnose the root cause, and fix it. Do ONE fix per iteration.

5. **DONE** — All tests for the current stage pass. This shouldn't happen (the loop driver handles it). Just exit.

## Stage Table

| Stage | Name | Test Command | Depends On |
|-------|------|-------------|-----------|
| 1 | Rust WASM Export | `cargo check --target wasm32-unknown-unknown --lib` in Rust dir | — |
| 2 | wasm-pack Build | `wasm-pack build --target web` in Rust dir produces valid pkg/ | 1 |
| 3 | Frontend WASM Integration | `npx vitest run wasm-live` in frontend app dir | 2 |
| 4 | Form Data Conformance | `npx vitest run conformance` in frontend app dir | 3 |
| 5 | Scenario Coverage | `npx vitest run scenario-coverage` in frontend app dir | 4 |

## Stage Details

### Stage 1 — Rust WASM Export

**Goal**: Make the Rust engine compilable to `wasm32-unknown-unknown` with a JSON-in/JSON-out entry point.

**Steps**:
1. Ensure `wasm32-unknown-unknown` target is installed: `rustup target add wasm32-unknown-unknown`
2. Edit `apps/inheritance/engine/Cargo.toml`:
   - Add `wasm-bindgen = "0.2"` to `[dependencies]`
   - Add a `[lib]` section: `crate-type = ["cdylib", "rlib"]`
3. Create `apps/inheritance/engine/src/wasm.rs`:
   ```rust
   use wasm_bindgen::prelude::*;
   use crate::pipeline::run_pipeline;
   use crate::types::EngineInput;

   #[wasm_bindgen]
   pub fn compute_json(input: &str) -> Result<String, JsValue> {
       let engine_input: EngineInput = serde_json::from_str(input)
           .map_err(|e| JsValue::from_str(&format!("Input parse error: {e}")))?;
       let output = run_pipeline(&engine_input);
       serde_json::to_string(&output)
           .map_err(|e| JsValue::from_str(&format!("Output serialize error: {e}")))
   }
   ```
4. Add `pub mod wasm;` to `apps/inheritance/engine/src/lib.rs`

**Test**: `cd apps/inheritance/engine && cargo check --target wasm32-unknown-unknown --lib`

**IMPORTANT**: The existing `main.rs` CLI must continue working. The `[lib]` section's crate-type with `"rlib"` ensures this. Do NOT break the existing `cargo test` or `cargo run` workflows. Run `cargo test` after your changes to verify.

### Stage 2 — wasm-pack Build

**Goal**: Build the WASM package that the frontend can import.

**Steps**:
1. Ensure `wasm-pack` is installed: `cargo install wasm-pack` (if not already)
2. Run: `cd apps/inheritance/engine && wasm-pack build --target web --out-dir pkg`
3. Verify the following files exist:
   - `apps/inheritance/engine/pkg/inheritance_engine_bg.wasm`
   - `apps/inheritance/engine/pkg/inheritance_engine.js`
   - `apps/inheritance/engine/pkg/inheritance_engine.d.ts`
4. Copy or symlink the pkg/ directory into the frontend:
   - `cp -r apps/inheritance/engine/pkg apps/inheritance/frontend/src/wasm/pkg`
5. Add `app/src/wasm/pkg/` to the frontend's `.gitignore` (the WASM binary shouldn't be committed — it's a build artifact)
6. Create a build script at `apps/inheritance/loops/forward/wasm/build-wasm.sh` that automates steps 2-4

**Test**: The build script runs successfully AND `apps/inheritance/frontend/src/wasm/pkg/inheritance_engine_bg.wasm` exists.

### Stage 3 — Frontend WASM Integration

**Goal**: Replace the mock bridge with the real WASM engine.

**Steps**:
1. Install Vite WASM plugins in the frontend app:
   ```bash
   cd apps/inheritance/loops/forward/frontend/app
   npm install --save-dev vite-plugin-wasm vite-plugin-top-level-await
   ```
2. Update `apps/inheritance/frontend/vite.config.ts`:
   ```typescript
   import wasm from 'vite-plugin-wasm'
   import topLevelAwait from 'vite-plugin-top-level-await'

   export default defineConfig({
     plugins: [tailwindcss(), react(), wasm(), topLevelAwait()],
     // ... rest unchanged
   })
   ```
3. Rewrite `apps/inheritance/frontend/src/wasm/bridge.ts`:
   - Import `init, { compute_json }` from `./pkg/inheritance_engine`
   - Replace `computeWasm()` body with real WASM call
   - Keep `computeMock()` available as a named export (tests may still use it)
   - Add lazy initialization: `let initialized = false;`
   - Handle WASM init errors gracefully
   ```typescript
   import init, { compute_json } from './pkg/inheritance_engine';

   let initialized = false;

   export async function computeWasm(input: EngineInput): Promise<EngineOutput> {
     if (!initialized) {
       await init();
       initialized = true;
     }
     const resultJson = compute_json(JSON.stringify(input));
     return JSON.parse(resultJson) as EngineOutput;
   }
   ```
4. Create test file `apps/inheritance/frontend/src/wasm/__tests__/wasm-live.test.ts`:
   - Test that `computeWasm()` with the simple-intestate example returns valid output
   - Test that output has correct scenario_code (I1) and succession_type (Intestate)
   - Test that shares sum to estate total
   - Test that narratives are non-empty
   - Test that invalid input (negative centavos) throws
5. Update vitest config if needed to handle .wasm file imports

**Test**: `cd apps/inheritance/loops/forward/frontend/app && npx vitest run wasm-live`

**IMPORTANT**: The existing `wasm-real` tests may break because they tested mock behavior. That's OK — the `wasm-live` tests are the new source of truth. If `wasm-real` tests are incompatible with real engine output, update them.

**IMPORTANT**: If vitest cannot load .wasm files, you may need to configure vitest separately from Vite. Check if `vitest.config.ts` exists or if vitest config is in `vite.config.ts`. You might need to add the WASM plugin to the test config too, or mock the WASM module in tests and test the bridge separately.

### Stage 4 — Form Data Conformance

**Goal**: Ensure the frontend's form serialization produces JSON that the Rust engine accepts without errors.

The user reported "invalid string boolean etc" errors when computing. This means the form produces data with type mismatches that the Rust `serde_json::from_str` rejects. The mock was lenient (Zod coerces types), but the real engine is strict.

**Steps**:
1. Create test file `apps/inheritance/frontend/src/wasm/__tests__/conformance.test.ts`
2. Import the `DEFAULT_ENGINE_INPUT` from `WizardContainer` or reconstruct the form defaults
3. For each test:
   - Construct an `EngineInput` the way the form would (using form defaults)
   - Serialize with `JSON.stringify()`
   - Pass to `compute_json()` or `computeWasm()`
   - Assert no error thrown
4. Test cases:
   - **Default form state**: Empty form with no heirs (should produce I15 escheat)
   - **Single legitimate child**: Add one LC with all required fields
   - **Married decedent with spouse**: Test boolean fields (is_married, has_legal_separation, etc.)
   - **Illegitimate child with filiation**: Test filiation_proved=true + proof_type
   - **Adopted child with adoption record**: Test nested adoption object
   - **Testate with will**: Test will object with date, empty dispositions
   - **Donation with Money fields**: Test nested Money objects in donation (value, professional_expense_imputed_savings)
5. For each failing case, trace the exact field causing the serde error and fix the form's serialization
6. Common fixes:
   - Ensure booleans are `true`/`false`, not `"true"`/`"false"`
   - Ensure numbers are numbers, not strings (except centavos which accepts both)
   - Ensure null fields are `null`, not `undefined` or `""`
   - Ensure enum values match exact PascalCase strings

**Test**: `cd apps/inheritance/loops/forward/frontend/app && npx vitest run conformance`

### Stage 5 — Scenario Coverage

**Goal**: Validate that the real engine produces correct results for representative scenarios from each major category.

**Steps**:
1. Create test file `apps/inheritance/frontend/src/wasm/__tests__/scenario-coverage.test.ts`
2. Copy the example JSON files from `apps/inheritance/engine/examples/` as test fixtures
3. Test cases (at minimum):
   - **I1**: Single LC intestate (from `examples/simple-intestate.json`)
   - **I2**: LC + spouse intestate
   - **I4**: LC + IC + spouse intestate
   - **I5**: Ascendants only intestate
   - **I7**: IC only intestate
   - **I11**: Spouse only intestate
   - **I13**: Siblings only intestate
   - **I15**: Escheat (empty family tree)
   - **T1**: Single LC testate
   - **T6**: Ascendants testate
   - **T13**: No compulsory heirs testate
4. For each test:
   - Construct valid EngineInput
   - Call `computeWasm(input)`
   - Assert `scenario_code` matches expected
   - Assert `per_heir_shares` total equals estate
   - Assert all `per_heir_shares[].heir_id` reference valid heirs
   - Assert `narratives` count matches `per_heir_shares` count
5. If any scenario fails with a deserialization error, fix the input construction (Stage 4 issue)
6. If any scenario fails with wrong distribution, that's a Rust engine bug — log it but don't try to fix the engine

**Test**: `cd apps/inheritance/loops/forward/frontend/app && npx vitest run scenario-coverage`

## Serialization Rules (CRITICAL)

The Rust engine uses `serde_json` for deserialization. It is STRICT:

| Field Type | Valid JSON | Invalid JSON |
|-----------|-----------|-------------|
| `bool` | `true`, `false` | `"true"`, `"false"`, `0`, `1` |
| `i64` / `u32` | `42` | `"42"` (except Money.centavos) |
| `String` | `"hello"` | `null` (unless `Option<String>`) |
| `Option<T>` | `null` or valid T | missing field (serde may reject) |
| `Money.centavos` | `100` or `"100"` | `"abc"`, `true` |
| Enum | `"LegitimateChild"` | `"legitimateChild"`, `"legitimate_child"` |
| `Vec<T>` | `[]` or `[...]` | `null`, missing |

**Key difference from the Zod mock**: The mock's `EngineInputSchema.safeParse()` uses Zod which can coerce types. The Rust engine's `serde_json::from_str()` will NOT coerce — types must match exactly.

## Rules

- Do ONE unit of work per iteration, then exit
- Always read existing code before modifying it
- Run `cargo test` in the Rust dir after any Rust changes to ensure you didn't break anything
- Run `npx vitest run` with the appropriate filter after frontend changes
- Keep `computeMock()` as a named export — don't delete it
- Don't modify the Rust engine's computation logic (pipeline, steps) — only add WASM export
- Commit with `wasm-forward: stage {N} - {description}`
- If a test failure is caused by a Rust engine bug (not a serialization issue), note it in the test as `.skip` with a comment and move on
