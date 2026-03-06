# Analysis: WASM Export Signatures — RA 7641 Retirement Pay Engine

**Wave:** 4 — Bridge Contract
**Aspect:** wasm-export-signature
**Date:** 2026-03-06
**Sources:** data-model.md, computation-pipeline.md, algorithms.md, batch-engine.md, nlrc-worksheet-generator.md

---

## Overview

The Rust engine is compiled to WASM via `wasm-pack build --target web`. Three functions are
exported via `#[wasm_bindgen]`. All three share the same transport contract: JSON string in,
JSON string out. No panics may cross the WASM boundary; all errors are serialized as JSON.

---

## 1. Cargo.toml Configuration

```toml
[package]
name = "retirement-pay-engine"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
chrono = { version = "0.4", features = ["serde"] }

[dev-dependencies]
wasm-bindgen-test = "0.3"

[profile.release]
opt-level = "s"      # optimize for size (WASM binary size matters)
lto = true
```

**Build command:**
```bash
wasm-pack build --target web --out-dir ../../frontend/src/wasm/pkg
```

---

## 2. WASM Export Signatures

### 2.1 `compute_single_json`

Computes RA 7641 retirement pay for one employee.

**Signature:**
```rust
#[wasm_bindgen]
pub fn compute_single_json(input_json: &str) -> String
```

**Input:** JSON string matching `RetirementInput` schema (camelCase, all fields required unless
optional).

**Output:** JSON string. Always one of two shapes:

```jsonc
// Success
{ "Ok": { /* RetirementOutput fields */ } }

// Error
{ "Err": { "code": "validation_failed", "message": "...", "fields": [...] } }
```

**Never panics.** Parse errors are caught and returned as `Err`.

**Implementation:**
```rust
#[wasm_bindgen]
pub fn compute_single_json(input_json: &str) -> String {
    let result: Result<RetirementOutput, EngineError> = (|| {
        let input: RetirementInput = serde_json::from_str(input_json)
            .map_err(|e| EngineError {
                code: "parse_error".to_string(),
                message: format!("JSON parse failed: {}", e),
                fields: vec![],
            })?;
        compute_single(input).map_err(|e| e.into())
    })();
    serde_json::to_string(&result).unwrap_or_else(|_| {
        r#"{"Err":{"code":"serialization_error","message":"Output serialization failed","fields":[]}}"#
            .to_string()
    })
}
```

**Callers:** Single-employee wizard (frontend), test suite (vitest via `initSync`).

---

### 2.2 `compute_batch_json`

Computes RA 7641 retirement pay for multiple employees from a CSV-derived payload.

**Signature:**
```rust
#[wasm_bindgen]
pub fn compute_batch_json(input_json: &str) -> String
```

**Input:** JSON string matching `BatchInput` schema.

**Output:** JSON string. Always one of two shapes:

```jsonc
// Success (even if some rows have errors — batch never fails atomically)
{ "Ok": { /* BatchOutput fields */ } }

// Fatal error (JSON parse failure of the BatchInput envelope itself)
{ "Err": { "code": "parse_error", "message": "...", "fields": [] } }
```

**Key distinction from single-employee:** Per-row errors do NOT produce a top-level `Err`. Each
row's `BatchRowResult.result` carries its own `Ok`/`Err`. The top-level `Ok` always appears if
the `BatchInput` envelope parses successfully.

**Implementation:**
```rust
#[wasm_bindgen]
pub fn compute_batch_json(input_json: &str) -> String {
    let result: Result<BatchOutput, EngineError> = (|| {
        let input: BatchInput = serde_json::from_str(input_json)
            .map_err(|e| EngineError {
                code: "parse_error".to_string(),
                message: format!("Batch JSON parse failed: {}", e),
                fields: vec![],
            })?;
        Ok(compute_batch(input))
    })();
    serde_json::to_string(&result).unwrap_or_else(|_| {
        r#"{"Err":{"code":"serialization_error","message":"Output serialization failed","fields":[]}}"#
            .to_string()
    })
}
```

**Callers:** Batch upload UI (frontend), test suite.

---

### 2.3 `generate_nlrc_json`

Runs the single-employee pipeline and then generates an NLRC money claim worksheet.

**Signature:**
```rust
#[wasm_bindgen]
pub fn generate_nlrc_json(input_json: &str) -> String
```

**Input:** JSON string matching `RetirementInput` schema (same as `compute_single_json`).

**Output:** JSON string. Always one of two shapes:

```jsonc
// Success
{ "Ok": { /* NlrcWorksheet fields */ } }

// Error (parse failure or computation error)
{ "Err": { "code": "...", "message": "...", "fields": [...] } }
```

**Note:** This function FIRST runs `compute_single()` internally, THEN calls
`generate_nlrc_worksheet()`. Any computation error (e.g., validation failure) is returned as
`Err` — the NLRC worksheet requires a successful computation as its input.

**Implementation:**
```rust
#[wasm_bindgen]
pub fn generate_nlrc_json(input_json: &str) -> String {
    let result: Result<NlrcWorksheet, EngineError> = (|| {
        let input: RetirementInput = serde_json::from_str(input_json)
            .map_err(|e| EngineError {
                code: "parse_error".to_string(),
                message: format!("JSON parse failed: {}", e),
                fields: vec![],
            })?;
        let output = compute_single(input.clone()).map_err(|e| e.into())?;
        Ok(generate_nlrc_worksheet(input, output))
    })();
    serde_json::to_string(&result).unwrap_or_else(|_| {
        r#"{"Err":{"code":"serialization_error","message":"Output serialization failed","fields":[]}}"#
            .to_string()
    })
}
```

**Callers:** NLRC worksheet UI tab (frontend), test suite.

---

## 3. Internal (Non-Exported) Functions

These are the pure Rust functions called by the WASM exports. They are NOT exported via
`#[wasm_bindgen]` but ARE exported as `pub` for unit testing with `cargo test` and vitest
(via `initSync`).

```rust
pub fn compute_single(input: RetirementInput) -> Result<RetirementOutput, ComputeError>;
pub fn compute_batch(input: BatchInput) -> BatchOutput;
pub fn generate_nlrc_worksheet(input: RetirementInput, output: RetirementOutput) -> NlrcWorksheet;
```

`ComputeError` is a Rust enum with variants for validation failure, unsupported input, and
arithmetic overflow (the last should not occur given validated bounds, but is kept as a safety
net).

---

## 4. WASM Package Output Structure

After `wasm-pack build --target web --out-dir ../../frontend/src/wasm/pkg`:

```
frontend/src/wasm/pkg/
├── retirement_pay_engine.js         # ESM loader (for browser)
├── retirement_pay_engine_bg.wasm    # WASM binary
├── retirement_pay_engine.d.ts       # TypeScript declarations
├── retirement_pay_engine_bg.wasm.d.ts
└── package.json                     # { "name": "retirement-pay-engine", "type": "module" }
```

The `.d.ts` file generated by `wasm-bindgen` will declare:

```typescript
// Auto-generated by wasm-bindgen — do not edit
export function compute_single_json(input_json: string): string;
export function compute_batch_json(input_json: string): string;
export function generate_nlrc_json(input_json: string): string;
export function initSync(module: WebAssembly.Module | BufferSource): InitOutput;
export default function init(input?: RequestInfo | URL | Response | BufferSource): Promise<InitOutput>;
```

---

## 5. Initialization Contract

### 5.1 Browser (Production + Vite Dev)

Use the async `init()` exported from the package:

```typescript
// src/wasm/bridge.ts
import init, {
  compute_single_json,
  compute_batch_json,
  generate_nlrc_json,
} from './pkg/retirement_pay_engine.js';

let initialized = false;

export async function initWasm(): Promise<void> {
  if (initialized) return;
  await init(); // fetches and compiles the .wasm file
  initialized = true;
}

export { compute_single_json, compute_batch_json, generate_nlrc_json };
```

`init()` fetches the `.wasm` binary from the Vite-served URL. In production, the `.wasm` file
is placed in the `dist/assets/` directory by Vite and fetched via `fetch()` internally.

**Vite plugin requirement:** The `vite-plugin-wasm` plugin must be listed BEFORE
`vite-plugin-top-level-await` in `vite.config.ts`:

```typescript
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    react(),
    wasm(),              // MUST come before topLevelAwait
    topLevelAwait(),
  ],
});
```

### 5.2 Node.js / Vitest (Test Environment)

Use `initSync()` with the binary loaded via Node's `fs`:

```typescript
// src/wasm/bridge.node.ts (vitest setup file)
import { readFileSync } from 'fs';
import { join } from 'path';
import { initSync } from './pkg/retirement_pay_engine.js';

const wasmPath = join(__dirname, './pkg/retirement_pay_engine_bg.wasm');
const wasmBytes = readFileSync(wasmPath);
initSync(wasmBytes);

export { compute_single_json, compute_batch_json, generate_nlrc_json } from './pkg/retirement_pay_engine.js';
```

Vitest config must set `environment: 'node'` (not `jsdom`) for WASM tests:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['src/wasm/bridge.node.ts'],
  },
});
```

### 5.3 React Integration (App Startup)

The `initWasm()` call happens once at app startup, before any route renders:

```typescript
// src/main.tsx
import { initWasm } from './wasm/bridge';

async function bootstrap() {
  await initWasm();
  // render router after WASM is ready
  const root = createRoot(document.getElementById('root')!);
  root.render(<RouterProvider router={router} />);
}

bootstrap();
```

If `initWasm()` fails (network error fetching .wasm), the app renders a full-page error:
`"Failed to load computation engine. Please refresh the page."` with a retry button.

---

## 6. JSON Wrapping Convention

All three exported functions use Rust's `Result<T, E>` serialization with serde. The wire
shape is:

```json
{ "Ok": <T> }
// or
{ "Err": <E> }
```

This is the standard serde serialization of `Result<T, E>`. The frontend bridge unwraps this:

```typescript
// src/wasm/helpers.ts

export interface WasmResult<T> {
  Ok?: T;
  Err?: EngineError;
}

export interface EngineError {
  code: string;
  message: string;
  fields: FieldError[];
}

export interface FieldError {
  field: string;
  code: string;
  message: string;
}

export function unwrapWasmResult<T>(json: string, fnName: string): T {
  let parsed: WasmResult<T>;
  try {
    parsed = JSON.parse(json) as WasmResult<T>;
  } catch {
    throw new Error(`[wasm/${fnName}] JSON parse failed: ${json}`);
  }
  if (parsed.Err !== undefined) {
    throw Object.assign(new Error(parsed.Err.message), { engineError: parsed.Err });
  }
  if (parsed.Ok === undefined) {
    throw new Error(`[wasm/${fnName}] Neither Ok nor Err in response`);
  }
  return parsed.Ok;
}
```

---

## 7. Per-Export Usage Patterns

### `compute_single_json`

```typescript
// src/wasm/api.ts
import { compute_single_json } from './bridge';
import { unwrapWasmResult } from './helpers';
import type { RetirementInput, RetirementOutput } from '../types/engine';

export function computeSingle(input: RetirementInput): RetirementOutput {
  const json = compute_single_json(JSON.stringify(input));
  return unwrapWasmResult<RetirementOutput>(json, 'compute_single_json');
}
```

**Calling convention:** Synchronous (no `await`). WASM execution is synchronous once the module
is initialized.

### `compute_batch_json`

```typescript
import { compute_batch_json } from './bridge';
import { unwrapWasmResult } from './helpers';
import type { BatchInput, BatchOutput } from '../types/engine';

export function computeBatch(input: BatchInput): BatchOutput {
  const json = compute_batch_json(JSON.stringify(input));
  return unwrapWasmResult<BatchOutput>(json, 'compute_batch_json');
}
```

**Performance note:** For large batches (100+ employees), call `computeBatch` inside a Web
Worker to avoid blocking the main thread. The bridge.ts wrapper in the worker uses the same
`initSync` pattern as Node.js.

### `generate_nlrc_json`

```typescript
import { generate_nlrc_json } from './bridge';
import { unwrapWasmResult } from './helpers';
import type { RetirementInput, NlrcWorksheet } from '../types/engine';

export function generateNlrcWorksheet(input: RetirementInput): NlrcWorksheet {
  const json = generate_nlrc_json(JSON.stringify(input));
  return unwrapWasmResult<NlrcWorksheet>(json, 'generate_nlrc_json');
}
```

---

## 8. Web Worker for Batch (Large Payloads)

For batch computations with more than 50 employees, the frontend uses a Web Worker to prevent
UI freezing. The worker file:

```typescript
// src/workers/batch.worker.ts
import { initSync, compute_batch_json } from '../wasm/pkg/retirement_pay_engine.js';
import { readFileSync } from 'fs'; // NOT available in browser worker

// Browser worker: fetch the wasm bytes synchronously using importScripts trick
// wasm-bindgen generates initSync which accepts ArrayBuffer
self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;
  if (type === 'INIT') {
    const response = await fetch(payload.wasmUrl);
    const bytes = await response.arrayBuffer();
    initSync(bytes);
    self.postMessage({ type: 'READY' });
  } else if (type === 'COMPUTE') {
    const result = compute_batch_json(JSON.stringify(payload.input));
    self.postMessage({ type: 'RESULT', result });
  }
};
```

The worker is created with:
```typescript
const worker = new Worker(new URL('../workers/batch.worker.ts', import.meta.url), {
  type: 'module',
});
```

Vite handles bundling the worker file into a separate chunk automatically when using
`new URL(...)` syntax.

**Threshold:** If `BatchInput.employees.length <= 50`, call `computeBatch()` synchronously on
the main thread. If `> 50`, use the worker.

---

## 9. File Locations in Monorepo

```
apps/retirement-pay/
├── engine/                          # Rust crate
│   ├── Cargo.toml
│   └── src/
│       ├── lib.rs                   # #[wasm_bindgen] exports here
│       ├── types.rs                 # RetirementInput, RetirementOutput, all structs
│       ├── pipeline.rs              # compute_single() — all 9 steps
│       ├── batch.rs                 # compute_batch()
│       ├── nlrc.rs                  # generate_nlrc_worksheet()
│       └── arithmetic.rs            # full_months_between(), rational helpers
└── frontend/
    └── src/
        ├── wasm/
        │   ├── pkg/                 # wasm-pack output (gitignored)
        │   ├── bridge.ts            # Browser init + re-exports
        │   ├── bridge.node.ts       # Node.js/vitest init
        │   ├── api.ts               # computeSingle(), computeBatch(), generateNlrcWorksheet()
        │   └── helpers.ts           # unwrapWasmResult(), WasmResult<T>, EngineError
        └── workers/
            └── batch.worker.ts      # Web Worker for large batch jobs
```

---

## 10. Error Propagation Summary

| Scenario | Export Function | Return Shape |
|----------|----------------|--------------|
| JSON parse error (malformed input) | All three | `{"Err":{"code":"parse_error","message":"..."}}` |
| Validation error (invalid field values) | `compute_single_json`, `generate_nlrc_json` | `{"Err":{"code":"validation_failed","message":"...","fields":[...]}}` |
| Ineligible employee (age/service) | `compute_single_json` | `{"Ok":{..."eligibility":{"status":"Ineligible",...}}}` — NOT an Err |
| Per-row batch error | `compute_batch_json` | `{"Ok":{"rows":[...{"result":{"Err":{...}}}...]}}` |
| Computation logic error (should never occur) | All three | `{"Err":{"code":"internal_error","message":"..."}}` |
| Serialization error (should never occur) | All three | Raw string: `{"Err":{"code":"serialization_error",...}}` |

---

## 11. Type Safety Guarantees

1. The three `#[wasm_bindgen]` functions accept only `&str` and return `String`. No Rust types
   cross the boundary — all data is serialized to/from JSON.
2. `wasm-bindgen` generates TypeScript `.d.ts` declarations from the `#[wasm_bindgen]`
   attributes. These declarations type the functions as `(input: string) => string`.
3. The `WasmResult<T>` wrapper and `unwrapWasmResult<T>()` helper in the frontend provide
   typed access to both `Ok` and `Err` branches.
4. Zod schemas (Wave 5) validate the `Ok` payload before it reaches React components.
   This is the second line of defense after serde's `deny_unknown_fields`.

---

## Summary

Three WASM exports, all with the shape `(input_json: &str) -> String`:

| Export | Input Type | Output Type | Internal Call |
|--------|-----------|-------------|---------------|
| `compute_single_json` | `RetirementInput` JSON | `Result<RetirementOutput>` JSON | `compute_single()` |
| `compute_batch_json` | `BatchInput` JSON | `Result<BatchOutput>` JSON | `compute_batch()` |
| `generate_nlrc_json` | `RetirementInput` JSON | `Result<NlrcWorksheet>` JSON | `compute_single()` + `generate_nlrc_worksheet()` |

Initialization: `init()` (async) for browser, `initSync(bytes)` for Node.js/vitest. Bridge
wraps exports in typed helpers. Batch jobs > 50 employees use a Web Worker.
