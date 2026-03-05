# WASM Initialization — initSync (Node.js/vitest) vs init (browser)

**Aspect**: wasm-initialization
**Wave**: 4 (Bridge Contract)
**Depends On**: wasm-export, serde-wire-format, error-contract

---

## Overview

The WASM module produced by `wasm-pack --target web` exports two initialization
functions and a single computation function. The initialization contract defines
exactly how the frontend loads the `.wasm` binary in two distinct runtimes:

1. **Node.js / vitest**: synchronous load via `initSync` + `fs.readFileSync`
2. **Browser (Vite)**: asynchronous load via `init()` (default export) which uses `fetch`

The dual-path pattern is necessary because:
- `fetch()` is not available in Node.js (or is non-standard in test environments)
- `fs.readFileSync` is not available in browser environments
- wasm-bindgen's `--target web` generates both `initSync` and `init` exports to support both cases

---

## §1. wasm-pack Output (`--target web`)

The `wasm-pack build --target web --out-dir pkg` command produces:

```
pkg/
  inheritance_engine.js         # ES module glue (imports the .wasm)
  inheritance_engine_bg.wasm    # Compiled WASM binary
  inheritance_engine.d.ts       # TypeScript declarations
  inheritance_engine_bg.d.ts    # Background module declarations
  package.json                  # npm package manifest (name, main, module, types)
```

### Exported symbols from `inheritance_engine.js`:

| Export | Type | Purpose |
|--------|------|---------|
| `default` (= `init`) | `async function(input?: InitInput)` | Async browser init |
| `initSync` | `function(module: SyncInitInput)` | Sync Node.js init |
| `compute_json` | `function(input: string): string` | Primary computation entry point |

**Critical**: `compute_json` MUST NOT be called before either `init()` or `initSync()` completes.
Calling it before initialization throws: `"RuntimeError: memory access out of bounds"` or
`"TypeError: compute_json is not a function"`.

---

## §2. Import Statement

```typescript
// Named imports for the synchronous and async initializers, plus the compute function.
import initAsync, { compute_json, initSync } from "./pkg/inheritance_engine";
```

**`initAsync`** is the default export (wasm-bindgen names it `init` internally but the
default export pattern allows renaming). Using `initAsync` avoids shadowing the common
`init` name.

**Alternative import style** (also valid):
```typescript
import init, { compute_json, initSync } from "./pkg/inheritance_engine";
```

The v2 codebase uses `initAsync` as the alias to make the async nature explicit.

---

## §3. Dual-Path Initialization Pattern

```typescript
let wasmInitialized = false;

/**
 * Initialize the WASM module exactly once.
 *
 * - Node.js / vitest: reads the .wasm binary with fs.readFileSync, calls initSync.
 * - Browser: calls initAsync() which fetches the .wasm via the browser Fetch API.
 *
 * The `wasmInitialized` guard prevents double-initialization on re-renders or
 * multiple test runs.
 */
async function ensureWasmInitialized(): Promise<void> {
  if (wasmInitialized) return;

  if (typeof process !== "undefined" && process.versions?.node) {
    // Node.js runtime (vitest, SSR, CLI scripts).
    // Dynamic imports are used here to avoid bundling Node.js built-ins
    // in the browser bundle — Vite tree-shakes them when process is undefined.
    const { readFileSync } = await import("node:fs");
    const { resolve, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const wasmPath = resolve(__dirname, "pkg/inheritance_engine_bg.wasm");
    const wasmBytes = readFileSync(wasmPath);
    initSync({ module: wasmBytes });
  } else {
    // Browser runtime (Vite dev server, production bundle).
    // init() (default export) fetches the .wasm via HTTP and instantiates it.
    await initAsync();
  }

  wasmInitialized = true;
}
```

### Why `initSync({ module: wasmBytes })` not `initSync(wasmBytes)`:

wasm-bindgen's `initSync` since v0.2.84 accepts a `SyncInitInput` object with a
`module` property. The older single-argument form `initSync(wasmBytes)` was deprecated.
Use the object form for forward-compatibility:

```typescript
// CORRECT (v2):
initSync({ module: wasmBytes });   // SyncInitInput = { module: BufferSource | WebAssembly.Module }

// DEPRECATED (do not use):
initSync(wasmBytes);               // old API, may warn or fail with newer wasm-bindgen
```

The `readFileSync` return type is `Buffer`, which satisfies `BufferSource` — no conversion needed.

---

## §4. Environment Detection Rules

| Check | Expression | Notes |
|-------|-----------|-------|
| Is Node.js? | `typeof process !== "undefined" && process.versions?.node` | Truthy in Node.js, vitest, Bun |
| Is browser? | Fallback (not Node.js) | Covers Vite browser bundle, Chrome extension contexts |
| Is Deno? | Would need explicit check | Not a target runtime for v2 |
| Is SSR (Next.js)? | Covered by Node.js branch | Server-side rendering uses `initSync` |

**Why not `typeof window !== "undefined"`?**
Node.js with jsdom sets `window` (as used by vitest's `environment: 'jsdom'`). Testing for
`process.versions?.node` is more reliable for distinguishing test environments.

---

## §5. Vite Configuration (Browser Bundle)

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  plugins: [tailwindcss(), react(), wasm(), topLevelAwait()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Plugin purposes:

| Plugin | Version | Purpose |
|--------|---------|---------|
| `vite-plugin-wasm` | `^3.5.0` | Teaches Vite to handle `.wasm` file imports; generates correct asset URLs |
| `vite-plugin-top-level-await` | `^1.6.0` | Enables top-level `await` in the module graph (required if `ensureWasmInitialized()` is called at module scope) |

**Without `vite-plugin-wasm`**: Vite 5+ can import `.wasm` natively via `?init` URL suffix,
but wasm-bindgen's generated `.js` glue uses its own import syntax that requires the plugin.

**Without `vite-plugin-top-level-await`**: If `ensureWasmInitialized()` is awaited inside
an async component/hook (not at module level), this plugin is optional. It becomes required
only if initialization is moved to module top-level for performance.

### Production build output:

In `vite build`, the `.wasm` file is emitted as a static asset:
```
dist/
  assets/
    inheritance_engine_bg-[hash].wasm   # copied, not inlined
  index.html
  assets/index-[hash].js
```

The generated JS glue references the `.wasm` asset by URL, which Vite resolves correctly.

---

## §6. Vitest Configuration (Test Environment)

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // NOTE: vite-plugin-wasm is intentionally NOT included here.
  // vitest runs in Node.js; the bridge.ts dual-path init handles WASM loading
  // via readFileSync in the Node.js branch. No plugin needed.
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
```

**Critical**: `vite-plugin-wasm` is **NOT** added to `vitest.config.ts`. The plugin's
URL-based `.wasm` loading conflicts with Node.js's file system loading. The `bridge.ts`
Node.js branch (`readFileSync`) handles WASM loading for tests directly.

### `.wasm` file path in tests:

```typescript
// Inside ensureWasmInitialized() Node.js branch:
const __dirname = dirname(fileURLToPath(import.meta.url));
const wasmPath = resolve(__dirname, "pkg/inheritance_engine_bg.wasm");
```

This resolves relative to `bridge.ts`'s own file path, not to `process.cwd()`. This is
important because vitest may run from any working directory. The ESM `import.meta.url`
provides a stable, file-relative base.

### Typical test file layout:

```
frontend/src/
  wasm/
    bridge.ts                      ← ensureWasmInitialized() is here
    pkg/
      inheritance_engine.js        ← wasm-pack output
      inheritance_engine_bg.wasm   ← the binary (must be present at test time)
      inheritance_engine.d.ts
  __tests__/
    bridge.test.ts                 ← integration tests calling computeWasm()
```

The `pkg/` directory must be committed to the repository (or generated before `vitest run`)
because tests import from it directly.

---

## §7. Public Compute API (bridge.ts)

```typescript
import initAsync, { compute_json, initSync } from "./pkg/inheritance_engine";
import type { ComputationInput, ComputationOutput } from "../types";
import { ComputationOutputSchema, ComputationErrorSchema } from "../schemas";

let wasmInitialized = false;

async function ensureWasmInitialized(): Promise<void> {
  if (wasmInitialized) return;
  if (typeof process !== "undefined" && process.versions?.node) {
    const { readFileSync } = await import("node:fs");
    const { resolve, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const wasmPath = resolve(__dirname, "pkg/inheritance_engine_bg.wasm");
    const wasmBytes = readFileSync(wasmPath);
    initSync({ module: wasmBytes });
  } else {
    await initAsync();
  }
  wasmInitialized = true;
}

export async function computeWasm(input: ComputationInput): Promise<ComputationOutput> {
  await ensureWasmInitialized();

  let resultStr: string;
  try {
    resultStr = compute_json(JSON.stringify(input));
  } catch (e: unknown) {
    // wasm-bindgen throws the JsValue from Err(JsValue) as a JS exception.
    // The JsValue is always a JSON string representing ComputationError (from error-contract.md).
    const errorStr = typeof e === "string" ? e : String(e);
    const engineError = ComputationErrorSchema.parse(JSON.parse(errorStr));
    throw new ComputationEngineError(engineError);
  }

  return ComputationOutputSchema.parse(JSON.parse(resultStr));
}
```

**Key contract**: `computeWasm` is an `async` function even though the computation itself
is synchronous (WASM is synchronous). The `async` is needed because `ensureWasmInitialized`
must await the Node.js dynamic imports and/or the browser fetch. The async wrapper is
permanent — callers always `await computeWasm(input)`.

---

## §8. Initialization Error Handling

### §8.1 Node.js branch — file not found

```typescript
// If pkg/inheritance_engine_bg.wasm does not exist:
// Error: ENOENT: no such file or directory, open '.../pkg/inheritance_engine_bg.wasm'

// Frontend should wrap the outer call to propagate as a fatal error:
try {
  await computeWasm(input);
} catch (e) {
  if (e instanceof ComputationEngineError) {
    // Engine computation error — show in UI
  } else {
    // WASM loading failure — fatal, show generic error
    setFatalError(`WASM module not found. Run: wasm-pack build --target web --out-dir pkg`);
  }
}
```

### §8.2 Browser branch — fetch failure

```typescript
// If the .wasm asset URL cannot be fetched (network error, wrong URL):
// The `await initAsync()` call throws a TypeError or Response error.
// Same fatal error handling as above.
```

### §8.3 Double-initialization guard

The `wasmInitialized` flag prevents multiple inits from concurrent callers:

```typescript
// If two React components both call computeWasm() on mount simultaneously:
// - First call sets wasmInitialized = false → enters init
// - Second call sees wasmInitialized = false → also enters init (race)

// PROBLEM: Two simultaneous initAsync() calls may cause corruption.
// SOLUTION: Use a promise-based guard instead of a boolean:

let initPromise: Promise<void> | null = null;

async function ensureWasmInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = doInit();
  }
  await initPromise;
}
```

The promise-based guard ensures only one init call runs, even under concurrent access.
Subsequent callers await the same promise. This is the **required v2 pattern** (upgrade
from the boolean guard in v1 bridge.ts).

---

## §9. React Integration Pattern

### §9.1 Hook-based initialization

```typescript
// src/hooks/useWasmCompute.ts
import { useState, useCallback } from "react";
import { computeWasm } from "../wasm/bridge";
import type { ComputationInput, ComputationOutput } from "../types";
import { ComputationEngineError } from "../wasm/errors";

export type ComputeState =
  | { status: "idle" }
  | { status: "computing" }
  | { status: "success"; output: ComputationOutput }
  | { status: "engine_error"; error: ComputationError }
  | { status: "fatal_error"; message: string };

export function useWasmCompute() {
  const [state, setState] = useState<ComputeState>({ status: "idle" });

  const compute = useCallback(async (input: ComputationInput) => {
    setState({ status: "computing" });
    try {
      const output = await computeWasm(input);
      setState({ status: "success", output });
    } catch (e) {
      if (e instanceof ComputationEngineError) {
        setState({ status: "engine_error", error: e.engineError });
      } else {
        setState({ status: "fatal_error", message: String(e) });
      }
    }
  }, []);

  return { state, compute };
}
```

### §9.2 WASM pre-warming (optional optimization)

```typescript
// src/App.tsx — warm up WASM on app load to avoid latency on first computation:
import { useEffect } from "react";
import { ensureWasmInitialized } from "./wasm/bridge";

export function App() {
  useEffect(() => {
    // Fire-and-forget: pre-initialize WASM in background on app mount.
    // computeWasm() calls will await this same promise if it's still in flight.
    ensureWasmInitialized().catch(console.error);
  }, []);
  // ...
}
```

Note: `ensureWasmInitialized` must be exported from `bridge.ts` if pre-warming is used.

---

## §10. Test Setup for WASM Integration Tests

```typescript
// src/__tests__/bridge.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import { computeWasm } from "../wasm/bridge";
import type { ComputationInput } from "../types";

// WASM initialization is handled lazily inside computeWasm().
// No explicit beforeAll setup is needed — the Node.js init path runs on first call.

describe("WASM bridge integration", () => {
  it("computes a simple intestate distribution (I1)", async () => {
    const input: ComputationInput = {
      decedent: {
        date_of_death: "2024-01-01",
        is_illegitimate: false,
        domicile: null,
      },
      estate: {
        net_estate: { centavos: 300000000 },  // ₱3,000,000.00
        gross_estate: null,
        liabilities: null,
      },
      heirs: [
        {
          id: "h1",
          name: "Ana dela Cruz",
          heir_type: "LegitimateChild",
          is_alive: true,
          filiation_proved: null,
          children: [],
          disinheritance: null,
          date_of_birth: null,
          date_of_death: null,
        },
      ],
      will: null,
      donations: [],
    };

    const output = await computeWasm(input);
    expect(output.scenario_code).toBe("I1");
    expect(output.per_heir_shares).toHaveLength(1);
    expect(output.per_heir_shares[0].total.centavos).toBe(300000000);
  });
});
```

---

## §11. Package Dependencies

### package.json additions vs v1:

```json
{
  "devDependencies": {
    "vite-plugin-wasm": "^3.5.0",
    "vite-plugin-top-level-await": "^1.6.0"
  }
}
```

Both are dev dependencies because they are only needed at build time (Vite processing).
The generated WASM binary and its `.js` glue are included as source files in `pkg/`.

### Note on `"type": "module"`:

The `package.json` MUST have `"type": "module"` for ESM dynamic imports (`import("node:fs")`)
to work correctly in the Node.js test branch. Without it, `import()` in a `.ts`/`.js` file
in Node.js may be interpreted differently. This matches the v1 setup.

---

## §12. V1 → V2 Changes Summary

| Item | V1 | V2 |
|------|----|----|
| Init guard | `let wasmInitialized = false` (boolean) | Promise-based guard (`let initPromise: Promise<void> \| null = null`) |
| `initSync` call | `initSync({ module: wasmBytes })` | Same (no change) |
| `init` call | `await initAsync()` | Same (no change) |
| Environment detection | `typeof process !== "undefined" && process.versions?.node` | Same (no change) |
| `.wasm` path resolution | `resolve(__dirname, "pkg/inheritance_engine_bg.wasm")` | Same (no change) |
| Vite plugin | `vite-plugin-wasm` + `vite-plugin-top-level-await` | Same (no change) |
| Vitest plugin | None (intentional) | Same (intentional) |
| Pre-warming | Not implemented | Optional via exported `ensureWasmInitialized` |
| Error on init failure | Falls through to generic JS error | Explicitly caught, labeled as `fatal_error` state |

The only behavioral change is the **promise-based guard** replacing the boolean guard.
This prevents a theoretical race condition when multiple concurrent components all call
`computeWasm()` before initialization completes.

---

## §13. Key Decisions

| Decision | Rationale |
|----------|-----------|
| `--target web` not `--target bundler` | Vite uses ES modules natively; `web` target produces correct ESM output |
| `initSync` for Node.js (not `await init()`) | Vitest's `jsdom` environment does not support `fetch()` by default; sync load is simpler and reliable |
| Dynamic imports for `node:fs` etc. | Prevents Vite from attempting to bundle Node.js built-ins in the browser bundle |
| Promise guard over boolean guard | Handles concurrent initialization correctly (multiple async callers) |
| `ensureWasmInitialized` as singleton | Calling `initSync` twice is a no-op but calling `init` twice could cause issues |
| No `wasm-plugin` in vitest.config.ts | The plugin transforms `.wasm` imports for browser URL-based loading; Node.js uses file system loading |
