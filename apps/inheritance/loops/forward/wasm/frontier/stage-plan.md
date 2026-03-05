# Inheritance WASM Integration — Stage Plan

## Overview

Wire the real Rust inheritance engine into the React frontend via WebAssembly,
replacing the mock bridge. 5 stages, sequential dependency chain.

## Stages

### Stage 1: Rust WASM Export
- Add `wasm-bindgen` to Cargo.toml
- Add `[lib] crate-type = ["cdylib", "rlib"]`
- Create `src/wasm.rs` with `#[wasm_bindgen] pub fn compute_json(&str) -> Result<String, JsValue>`
- Verify `cargo check --target wasm32-unknown-unknown --lib` passes
- Verify `cargo test` still passes (no regression)

### Stage 2: wasm-pack Build
- Install wasm-pack if needed
- Run `wasm-pack build --target web --out-dir pkg`
- Copy pkg/ to frontend `app/src/wasm/pkg/`
- Create reusable `build-wasm.sh` script

### Stage 3: Frontend WASM Integration
- Install `vite-plugin-wasm` and `vite-plugin-top-level-await`
- Update `vite.config.ts` with WASM plugins
- Rewrite `bridge.ts` to use real WASM import
- Write `wasm-live.test.ts` with basic smoke tests
- Keep `computeMock()` as named export for other tests

### Stage 4: Form Data Conformance
- Write `conformance.test.ts` testing form defaults → real engine
- Fix type coercion issues (string↔bool, string↔number)
- Test married decedent, illegitimate child, adopted child, testate, donations
- Ensure `JSON.stringify(formData)` → `serde_json::from_str()` succeeds

### Stage 5: Scenario Coverage
- Write `scenario-coverage.test.ts` covering representative scenarios
- Test I1, I2, I4, I5, I7, I11, I13, I15, T1, T6, T13 at minimum
- Validate shares sum = estate, correct scenario_code, narrative count
- Skip any tests that hit known Rust engine bugs (BUG-001: multiple disinheritance)

## Dependencies

```
Stage 1 → Stage 2 → Stage 3 → Stage 4 → Stage 5
```

All stages are strictly sequential — each requires the previous.
