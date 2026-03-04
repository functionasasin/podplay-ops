# WASM Export — Compute JSON Bridge Entry Point

**Aspect**: wasm-export
**Wave**: 4 (Bridge Contract)
**Depends On**: rust-types, pipeline-design

---

## Overview

The WASM bridge exposes a **single exported function** to JavaScript: `compute_json`. All
frontend-to-engine communication passes through this one entry point. The function accepts a
JSON string, runs the full 10-step pipeline, and returns a JSON string (success) or a JSON
string describing the error (failure).

This document specifies:
1. The exact Rust function signature with `wasm-bindgen` attributes
2. The Cargo.toml changes required
3. The panic hook setup for `PanicRecovered` errors
4. The v2 error wrapping contract (structured JSON vs plain string)
5. The module file layout for `wasm.rs` and `lib.rs`

---

## §1. Function Signature

```rust
use wasm_bindgen::prelude::*;
use crate::pipeline::run_pipeline;
use crate::types::{ComputationInput, ComputationOutput, ComputationError};

/// Primary WASM entry point.
///
/// # Arguments
/// * `input` — UTF-8 JSON string representing `ComputationInput`.
///
/// # Return
/// * `Ok(String)` — UTF-8 JSON string representing `ComputationOutput`.
/// * `Err(JsValue)` — UTF-8 JSON string representing `ComputationError`.
///
/// The `Err` branch ALWAYS returns a JSON string (not a plain error message).
/// The frontend MUST parse the error string as `ComputationError` to display structured errors.
///
/// # Panics
/// The `console_error_panic_hook` wasm panic hook is installed on first call.
/// Any panic that escapes the hook is caught by the `std::panic::catch_unwind` wrapper
/// and returned as `ComputationError::PanicRecovered`.
#[wasm_bindgen]
pub fn compute_json(input: &str) -> Result<String, JsValue> {
    // Install panic hook on every call (cheap after first install).
    console_error_panic_hook::set_once();

    // Wrap the entire computation in catch_unwind to recover from panics.
    let result = std::panic::catch_unwind(|| inner_compute(input));

    match result {
        Ok(Ok(json)) => Ok(json),
        Ok(Err(err)) => {
            let err_json = serde_json::to_string(&err)
                .unwrap_or_else(|_| r#"{"error_type":"ArithmeticError","message":"Failed to serialize error"}"#.to_string());
            Err(JsValue::from_str(&err_json))
        }
        Err(panic_payload) => {
            let msg = panic_payload
                .downcast_ref::<String>()
                .map(|s| s.clone())
                .or_else(|| panic_payload.downcast_ref::<&str>().map(|s| s.to_string()))
                .unwrap_or_else(|| "Unknown panic".to_string());
            let err = ComputationError::PanicRecovered { message: msg };
            let err_json = serde_json::to_string(&err)
                .unwrap_or_else(|_| r#"{"error_type":"PanicRecovered","message":"Unknown panic"}"#.to_string());
            Err(JsValue::from_str(&err_json))
        }
    }
}

fn inner_compute(input: &str) -> Result<String, ComputationError> {
    // Step 1: Deserialize input (serde deny_unknown_fields enforced by type attribute).
    let computation_input: ComputationInput = serde_json::from_str(input)
        .map_err(|e| ComputationError::InputValidation {
            message: e.to_string(),
            field_path: extract_field_path(&e),
        })?;

    // Step 2: Run the deterministic pipeline.
    let output: ComputationOutput = run_pipeline(computation_input)?;

    // Step 3: Serialize output.
    serde_json::to_string(&output)
        .map_err(|e| ComputationError::ArithmeticError {
            message: format!("Output serialization failed: {e}"),
        })
}

/// Attempt to extract a dotted field path from a serde_json error message.
/// Returns None if the error message does not contain path information.
fn extract_field_path(e: &serde_json::Error) -> Option<String> {
    // serde_json includes field path in the error string for deny_unknown_fields errors.
    // Example: "unknown field `foo`, expected one of ..."
    // This is best-effort extraction; the frontend should display message if path is None.
    let msg = e.to_string();
    if msg.contains("unknown field `") {
        let start = msg.find('`')? + 1;
        let end = msg[start..].find('`')?;
        Some(msg[start..start + end].to_string())
    } else {
        None
    }
}
```

---

## §2. Cargo.toml Changes

```toml
[lib]
# cdylib: shared library for WASM compilation target.
# rlib: Rust library for native test compilation target.
# Both must be present to allow `cargo test` (uses rlib) AND `wasm-pack build` (uses cdylib).
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
num-rational = { version = "0.4", features = ["bigint"] }
num-bigint = "0.4"
console_error_panic_hook = "0.1"

[dev-dependencies]
wasm-bindgen-test = "0.3"
```

**Why both `cdylib` AND `rlib`?**

| Target | Crate type | Use |
|--------|-----------|-----|
| `wasm-pack build` | `cdylib` | Produces `.wasm` + JS glue for browser/Node.js |
| `cargo test` | `rlib` | Runs native unit tests for pipeline logic |
| `wasm-bindgen-test` | `cdylib` via browser/Node | Runs integration tests in WASM context |

Without `rlib`, `cargo test` fails because the test runner cannot link to the library.
Without `cdylib`, `wasm-pack build` fails because WASM requires a C-compatible dynamic library.

---

## §3. lib.rs Layout

```rust
//! Philippine Inheritance Distribution Engine v2
//!
//! Entry point for both WASM compilation (cdylib) and native testing (rlib).

// Re-export all public types for tests and downstream crates.
pub mod types;
pub mod pipeline;

// Step modules (one per pipeline step).
pub mod step1_validate_input;
pub mod step2_classify_heirs;
pub mod step3_add_representation;
pub mod step4_determine_scenario;
pub mod step5_compute_collation;
pub mod step6_compute_legitimes;
pub mod step7_validate_testate;
pub mod step8_compute_free_portion;
pub mod step9_distribute;
pub mod step10_resolve_vacancies;

// WASM entry point. Only compiled when targeting wasm32-unknown-unknown.
// Also compiled for native testing via wasm-bindgen-test.
pub mod wasm;
```

**Conditional compilation note**: The `wasm` module is compiled for ALL targets (not
`#[cfg(target_arch = "wasm32")]`) because `wasm-bindgen-test` runs against the WASM binary
built from `cdylib`, not the native rlib. Native unit tests that import `wasm.rs` directly
are `#[cfg(not(target_arch = "wasm32"))]` to avoid `JsValue` link errors on native targets.

---

## §4. Error Return Contract

**CRITICAL**: The Err branch of `compute_json` returns a `JsValue` that is ALWAYS a valid
JSON string parseable as `ComputationError`. This is a v2 improvement over the v1 engine
which returned plain-text error strings.

### V1 behavior (do NOT replicate):
```js
// V1: plain string error — frontend had to string-match for error type
const result = compute_json(input);
// On error: result was "Input parse error: unknown field `foo`"
```

### V2 behavior (required):
```js
// V2: structured JSON error — frontend parses ComputationError
try {
    const jsonStr = compute_json(inputStr);
    const output = JSON.parse(jsonStr) as ComputationOutput;
} catch (e) {
    // e is a string (JsValue coerced to JS string)
    const error = JSON.parse(e as string) as ComputationError;
    // error.error_type is one of: "InputValidation" | "DomainValidation" |
    //   "MaxRestartsExceeded" | "ArithmeticError" | "PanicRecovered"
}
```

### ComputationError JSON shapes (from rust-types.md §12):

**InputValidation** (serde parse failure):
```json
{
  "error_type": "InputValidation",
  "message": "unknown field `foo`, expected one of ...",
  "field_path": "foo"
}
```

**DomainValidation** (pre-computation logic error):
```json
{
  "error_type": "DomainValidation",
  "message": "Heir ID 'heir_1' appears more than once",
  "related_heir_ids": ["heir_1"]
}
```

**MaxRestartsExceeded** (infinite loop guard):
```json
{
  "error_type": "MaxRestartsExceeded",
  "restart_count": 10,
  "last_step": "step7_validate_testate"
}
```

**ArithmeticError** (output serialization failure — should never occur):
```json
{
  "error_type": "ArithmeticError",
  "message": "Output serialization failed: ..."
}
```

**PanicRecovered** (unexpected panic):
```json
{
  "error_type": "PanicRecovered",
  "message": "attempt to divide by zero"
}
```

### Serde attribute for ComputationError (from rust-types.md):
```rust
#[serde(tag = "error_type")]
#[serde(rename_all = "PascalCase")]
pub enum ComputationError { ... }
```

The `#[serde(tag = "error_type")]` attribute produces an internally-tagged JSON object.
The `error_type` field matches the PascalCase enum variant name.

---

## §5. WASM Build Command

The standard build command used by the build script:

```bash
wasm-pack build --target web --out-dir pkg
```

**Flags**:
- `--target web`: Produces ES module output compatible with Vite's WASM plugin
- `--out-dir pkg`: Output to `pkg/` inside the Rust crate directory

The output directory is then copied to `frontend/src/wasm/pkg/` (or equivalent).

**Alternative targets**:
- `--target bundler`: For webpack-based bundlers (NOT used in this project — Vite uses `web`)
- `--target nodejs`: For server-side Node.js ONLY (cannot be imported in browser)

**Test command**:
```bash
# Native unit tests (uses rlib, no WASM):
cargo test

# WASM integration tests (requires wasm-pack):
wasm-pack test --node
```

---

## §6. `#[wasm_bindgen]` Attribute Rules

1. **Only `compute_json` is exported.** No other functions are `#[wasm_bindgen]`.
   All pipeline internals are Rust-only.

2. **Input type must be `&str`.** wasm-bindgen coerces JS strings to `&str` via the UTF-8
   representation of the `JsValue`. Do not use `String` as it would require an extra allocation.

3. **Return type `Result<String, JsValue>`** is the idiomatic wasm-bindgen error pattern.
   On `Ok(String)`, JS receives a string. On `Err(JsValue)`, JS throws the JsValue.

4. **No complex types in the signature.** All complex types are serialized/deserialized as
   JSON strings. Do NOT pass `JsValue` for the input or use `serde-wasm-bindgen` — the JSON
   string approach is simpler and avoids wasm-bindgen version coupling.

---

## §7. wasm-bindgen Version Pinning

wasm-bindgen must be pinned to the same version in Cargo.toml AND in the installed wasm-pack:

```toml
# Cargo.toml
wasm-bindgen = "0.2"
```

Mismatch between Cargo.toml version and wasm-pack's bundled wasm-bindgen CLI causes:
```
it looks like the Rust project used to create this Wasm file was linked against
version of wasm-bindgen that uses a different encoding than this version of the
JavaScript bindings
```

**Resolution**: Pin `wasm-bindgen` to the exact version used by the installed wasm-pack:
```bash
wasm-pack --version      # e.g., wasm-pack 0.13.1
# Check wasm-pack's bundled wasm-bindgen version in its release notes
# Pin Cargo.toml accordingly: wasm-bindgen = "=0.2.100"
```

---

## §8. Relationship to Other Bridge Contract Aspects

| Aspect | Content |
|--------|---------|
| **wasm-export** (this file) | Function signature, Cargo.toml, panic hook, error contract |
| `serde-wire-format` | Exact JSON serialization rules for every field of every type |
| `error-contract` | Detailed frontend error handling and display logic |
| `wasm-initialization` | `initSync()` vs `init()`, dual-path init pattern |

---

## §9. Key Decisions vs V1

| Decision | V1 | V2 | Rationale |
|----------|----|----|-----------|
| Error format | Plain string | Structured JSON (`ComputationError`) | Frontend can display typed errors |
| Panic recovery | None (panic = unrecoverable) | `catch_unwind` + `PanicRecovered` | Prevents silent WASM crash |
| Field path in InputValidation | Not extracted | Best-effort field path extraction | Better form error highlighting |
| Exported functions | `compute_json` | `compute_json` (unchanged) | Minimal surface area |
| Input type | `&str` | `&str` (unchanged) | Idiomatic, no extra alloc |
| Output serde | Direct `serde_json::to_string` | Same | No change needed |
