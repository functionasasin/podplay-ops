# WASM Export Signature — TaxKlaro Engine Bridge

**Wave:** 2 (Bridge Contract)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** validate-domain-spec, validate-engine-spec, audit-stack-assumptions

---

## Summary

The TaxKlaro WASM engine exposes a **single primary export function** — `compute_json` — that handles all computation scenarios (annual, quarterly, single-path, optimizer mode). No separate quarterly entry point is needed; the `filing_period` field in `TaxpayerInput` controls the computation path.

A second export `validate_json` is provided for **wizard step validation** — it runs PL-01 and PL-04 only without full computation, returning validation errors as structured JSON without the cost of a full pipeline run.

---

## 1. Primary Export: `compute_json`

### Rust Signature (src/wasm.rs)

```rust
use wasm_bindgen::prelude::*;
use crate::pipeline::run_pipeline;
use crate::types::{TaxpayerInput, WasmResult};

#[wasm_bindgen]
pub fn compute_json(input: &str) -> Result<String, JsValue> {
    let taxpayer_input: TaxpayerInput = serde_json::from_str(input)
        .map_err(|e| JsValue::from_str(&format!("Input parse error: {e}")))?;
    let result = run_pipeline(&taxpayer_input);
    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Output serialize error: {e}")))
}
```

### What It Does

1. Accepts: a JSON string conforming to the `TaxpayerInput` serde schema
2. Deserializes with `serde_json::from_str` — if deserialization fails (wrong types, missing required fields), throws a JS exception (propagated as caught Error in bridge.ts)
3. Runs the full 17-step pipeline (`run_pipeline`)
4. Returns: a JSON string conforming to the `WasmResult` envelope (see Section 3)
5. On internal serialization error: throws a JS exception

### JavaScript Call Pattern

```typescript
// In bridge.ts
const resultJson: string = compute_json(JSON.stringify(input));
const result: WasmResult = JSON.parse(resultJson);
```

### When This Function Is Used

- User clicks "Compute" button after completing the wizard
- Auto-recompute on input change (debounced, only when input is valid)
- Backend (Node.js/vitest): in test harness for conformance tests

---

## 2. Secondary Export: `validate_json`

### Rust Signature (src/wasm.rs)

```rust
#[wasm_bindgen]
pub fn validate_json(input: &str) -> Result<String, JsValue> {
    let taxpayer_input: TaxpayerInput = serde_json::from_str(input)
        .map_err(|e| JsValue::from_str(&format!("Input parse error: {e}")))?;
    let validation_result = run_validation_only(&taxpayer_input);
    serde_json::to_string(&validation_result)
        .map_err(|e| JsValue::from_str(&format!("Output serialize error: {e}")))
}
```

### Purpose

Runs only PL-01 (input validation) and PL-04 (eligibility check) — the two steps that produce user-actionable errors. Used for:

- Per-step wizard validation before advancing to the next wizard step
- Pre-flight check before committing a computation (verify no validation errors before calling `compute_json`)

### Returns

```typescript
interface ValidationOnlyResult {
  valid: boolean;
  errors: EngineError[];          // Hard validation errors from PL-01 (ERR_* codes)
  eligibility_warnings: ValidationWarning[];  // Soft warnings from PL-01 (WARN_* codes)
  path_c_eligible: boolean;       // From PL-04: whether 8% option is available
  path_c_ineligible_reasons: string[];  // From PL-04: why 8% is not available
}
```

---

## 3. Return Envelope: `WasmResult`

The `compute_json` function always returns a `WasmResult` envelope — it never throws for computation errors. Only two conditions cause a JS exception (throw):

1. JSON parse failure (input is not valid JSON)
2. Internal serde serialization error (should never happen)

All business-logic errors (validation failures, ineligibility) are returned as structured JSON.

### Rust Type

```rust
#[derive(Serialize)]
#[serde(tag = "status", rename_all = "snake_case")]
pub enum WasmResult {
    Success(TaxComputationResult),
    Error(EngineError),
}
```

### JSON Shapes

**Success:**
```json
{
  "status": "success",
  "input_summary": { ... },
  "comparison": [ ... ],
  "recommended_regime": "PATH_B",
  "balance": "1234.56",
  ...
}
```

**Error (user input problem):**
```json
{
  "status": "error",
  "code": "ERR_INVALID_TAX_YEAR",
  "message": "Tax year must be between 2018 and 2030",
  "user_message": "Please enter a valid tax year between 2018 and 2030.",
  "field": "tax_year",
  "validation_code": "VAL-001",
  "severity": "HARD_ERROR"
}
```

**Error (assertion / software bug):**
```json
{
  "status": "error",
  "code": "ERR_ASSERT_NEGATIVE_BALANCE",
  "message": "Invariant violation: balance cannot be negative",
  "user_message": "An unexpected error occurred. Please try again or contact support.",
  "field": null,
  "validation_code": null,
  "severity": "ASSERTION_ERROR"
}
```

### TypeScript Discriminated Union

```typescript
type WasmResult = WasmSuccess | WasmError;

interface WasmSuccess extends TaxComputationResult {
  status: "success";
}

interface WasmError extends EngineError {
  status: "error";
}
```

### Frontend Handling in bridge.ts

```typescript
export async function computeTax(input: TaxpayerInput): Promise<TaxComputationResult> {
  await ensureWasmInitialized();
  const rawJson = compute_json(JSON.stringify(input));  // throws only on parse/serialize failure
  const result: WasmResult = JSON.parse(rawJson);
  if (result.status === "error") {
    if (result.severity === "ASSERTION_ERROR") {
      // Software bug — log to Sentry, show generic error to user
      Sentry.captureException(new Error(result.message), { extra: { code: result.code } });
      throw new ComputeError("INTERNAL", result.user_message);
    } else {
      // User input problem — throw structured error for UI to display
      throw new ValidationError(result.code, result.user_message, result.field);
    }
  }
  return result;  // TypeScript narrows to WasmSuccess = TaxComputationResult
}
```

---

## 4. Initialization Pattern

### Rust lib.rs Entry

```rust
// src/lib.rs
pub mod types;
pub mod pipeline;
pub mod wasm;
```

### Browser vs. Node.js Initialization

```typescript
// src/wasm/bridge.ts

import initAsync, { compute_json, validate_json, initSync } from "./pkg/taxklaro_engine";

let wasmInitialized = false;

async function ensureWasmInitialized(): Promise<void> {
  if (wasmInitialized) return;

  if (typeof process !== "undefined" && process.versions?.node) {
    // Node.js (vitest) — synchronous load from disk
    const { readFileSync } = await import("node:fs");
    const { resolve, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const wasmPath = resolve(__dirname, "pkg/taxklaro_engine_bg.wasm");
    const wasmBytes = readFileSync(wasmPath);
    initSync({ module: wasmBytes });
  } else {
    // Browser — async fetch of .wasm file
    await initAsync();
  }
  wasmInitialized = true;
}
```

**Critical**: `initSync` is used in Node.js/vitest because the test runner cannot handle top-level await at test initialization time. `initAsync` fetches the `.wasm` file over HTTP in the browser (Vite handles the URL resolution via `vite-plugin-wasm`).

### WASM Package Location

```
src/wasm/pkg/
  taxklaro_engine.js          — generated JS glue
  taxklaro_engine_bg.wasm     — compiled WASM binary
  taxklaro_engine.d.ts        — TypeScript declarations (auto-generated by wasm-pack)
```

### wasm-pack Build Command

```bash
wasm-pack build --target web --out-dir frontend/src/wasm/pkg
```

**Target: `web`** (not `bundler`) — required for Vite + `vite-plugin-wasm` compatibility. The `bundler` target uses Node.js `require()` patterns incompatible with Vite's ES module pipeline.

---

## 5. Vite Plugin Configuration

The forward loop MUST include these plugins in `vite.config.ts`:

```typescript
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),  // Required for WASM async initialization
    // ...
  ],
});
```

**Production build risk — `vite-plugin-top-level-await`:**
This plugin rewrites async initialization code for browsers that don't support top-level await. In production mode, it can break prototype chains for libraries that use `new` calls (d3, recharts). The forward loop's Phase 7 MUST run `npm run build && npx serve dist` and verify the computation works — not just that `tsc` passes.

---

## 6. Decimal Serialization Decision

All `Decimal` (monetary) fields in `TaxpayerInput` and `TaxComputationResult` serialize as **JSON strings**, not JSON numbers.

**Rationale:** The Rust `rust_decimal` crate serializes `Decimal` as a string by default (e.g., `"1234567.89"`). This preserves precision for all peso amounts without floating-point rounding. JavaScript's `number` type (IEEE 754 double) loses precision above ~9 quadrillion centavos — acceptable for the amounts in scope, but using strings avoids any edge case and keeps the serde behavior consistent with the crate's default.

**Contract:**
- Rust `Decimal` → JSON `"1234567.89"` (quoted string)
- TypeScript `string` type for all monetary fields
- Zod `z.string()` (not `z.number()`) for all monetary fields
- Display layer: `parseFloat(value).toLocaleString("en-PH", { minimumFractionDigits: 2 })` for UI rendering

**Exception:** `TaxYear` is `int` → JSON `number` (integer). `Quarter` is `int` → JSON `number`. `bool` fields → JSON `true`/`false`.

---

## 7. Error Classes in bridge.ts

```typescript
export class ValidationError extends Error {
  constructor(
    public readonly code: string,
    public readonly userMessage: string,
    public readonly field: string | null
  ) {
    super(userMessage);
    this.name = "ValidationError";
  }
}

export class ComputeError extends Error {
  constructor(
    public readonly type: "INTERNAL" | "PARSE",
    message: string
  ) {
    super(message);
    this.name = "ComputeError";
  }
}
```

---

## 8. Bridge API Surface (public exports of bridge.ts)

```typescript
// Compute full tax result
export async function computeTax(input: TaxpayerInput): Promise<TaxComputationResult>

// Validate input only (for wizard step validation)
export async function validateInput(input: Partial<TaxpayerInput>): Promise<ValidationOnlyResult>

// Error types
export class ValidationError extends Error { ... }
export class ComputeError extends Error { ... }
```

---

## 9. useTaxBridge Hook Interface

The React hook wrapping the bridge (used in the computation wizard and results view):

```typescript
interface UseTaxBridgeReturn {
  compute: (input: TaxpayerInput) => Promise<void>;  // Updates state
  validate: (input: Partial<TaxpayerInput>) => Promise<ValidationOnlyResult>;
  result: TaxComputationResult | null;
  error: ValidationError | ComputeError | null;
  isComputing: boolean;
  clear: () => void;
}

export function useTaxBridge(): UseTaxBridgeReturn
```

---

## 10. File Structure

```
engine/
  Cargo.toml
  src/
    lib.rs              — pub mod types; pub mod pipeline; pub mod wasm;
    types.rs            — all Rust structs and enums
    pipeline.rs         — run_pipeline() and run_validation_only()
    wasm.rs             — #[wasm_bindgen] exports: compute_json, validate_json
    steps/
      pl01_validate.rs
      pl02_classify.rs
      ...
      pl17_assemble.rs

frontend/src/wasm/
  bridge.ts             — computeTax(), validateInput(), ensureWasmInitialized()
  pkg/
    taxklaro_engine.js
    taxklaro_engine_bg.wasm
    taxklaro_engine.d.ts
```

---

## Action Items for Subsequent Waves

| Wave | Aspect | Item |
|------|--------|------|
| Wave 2 | serde-wire-format | Define exact `#[serde(...)]` attributes for every struct/enum. Confirm `Decimal` serializes as string (or add `#[serde(with = "rust_decimal::serde::str")]` explicitly). |
| Wave 2 | error-contract | Document all `ERR_*` code strings, `field` values for each, and exact `user_message` text. |
| Wave 2 | initialization-patterns | Confirm `wasm-pack --target web` is correct for Vite. Document vitest setup file for WASM init. |
| Wave 3 | typescript-types | `WasmResult`, `ValidationError`, `ComputeError`, `ValidationOnlyResult` all need TypeScript definitions. |
| Wave 6 | production-build-verification | Flag `vite-plugin-top-level-await` as production build risk. |
