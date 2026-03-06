# Analysis: Initialization Patterns — RA 7641 Retirement Pay Engine

**Wave:** 4 — Bridge Contract
**Aspect:** initialization-patterns
**Date:** 2026-03-06
**Sources:** wasm-export-signature.md, serde-wire-format.md, error-contract.md

---

## Overview

The Rust engine is compiled to WASM via `wasm-pack build --target web`. This target produces
an ESM module with two init functions:

- `init()` — async, fetches the `.wasm` binary via `fetch()`. Used in the browser.
- `initSync()` — synchronous, accepts `ArrayBuffer` or `BufferSource`. Used in Node.js/vitest.

Both must be called exactly once before any exported WASM function (`compute_single_json`,
`compute_batch_json`, `generate_nlrc_json`) is invoked. Calling an export before initialization
throws a JavaScript error: `"Cannot read properties of undefined (reading 'exports')"`.

This document specifies the exact file contents, config settings, and integration patterns
for each execution context.

---

## 1. Build Command and Output

```bash
# Run from apps/retirement-pay/engine/
wasm-pack build --target web --out-dir ../../frontend/src/wasm/pkg
```

This produces:

```
apps/retirement-pay/frontend/src/wasm/pkg/
├── retirement_pay_engine.js          # ESM loader — exports init, initSync, and all #[wasm_bindgen] fns
├── retirement_pay_engine_bg.wasm     # WASM binary (referenced by retirement_pay_engine.js)
├── retirement_pay_engine.d.ts        # TypeScript declarations (auto-generated)
├── retirement_pay_engine_bg.wasm.d.ts
└── package.json                      # { "name": "retirement-pay-engine", "type": "module" }
```

The `pkg/` directory is **gitignored** and must be rebuilt before running tests or the dev
server. CI runs `wasm-pack build` before `npm run dev` / `vitest`.

The generated `.d.ts` declares:

```typescript
// retirement_pay_engine.d.ts (auto-generated — do not edit)
export function compute_single_json(input_json: string): string;
export function compute_batch_json(input_json: string): string;
export function generate_nlrc_json(input_json: string): string;
export function initSync(module: WebAssembly.Module | BufferSource): InitOutput;
export default function init(
  input?: RequestInfo | URL | Response | BufferSource
): Promise<InitOutput>;
```

---

## 2. File: `src/wasm/bridge.ts` (Browser — Main Thread)

Used by the React app in production and development. Initializes with async `init()`.

```typescript
// apps/retirement-pay/frontend/src/wasm/bridge.ts
import init, {
  compute_single_json,
  compute_batch_json,
  generate_nlrc_json,
} from './pkg/retirement_pay_engine.js';

let _initialized = false;
let _initPromise: Promise<void> | null = null;

/**
 * Initialize the WASM engine. Safe to call multiple times — subsequent calls are no-ops.
 * Must be awaited before any compute function is called.
 * Throws if the .wasm binary cannot be fetched (network error or missing file).
 */
export async function initWasm(): Promise<void> {
  if (_initialized) return;
  if (_initPromise) return _initPromise;

  _initPromise = init().then(() => {
    _initialized = true;
  });

  return _initPromise;
}

export { compute_single_json, compute_batch_json, generate_nlrc_json };
```

**Key design decisions:**
- The `_initPromise` guard prevents multiple concurrent `init()` calls during app startup
  (e.g., if two components call `initWasm()` simultaneously before the first resolves).
- `init()` with no arguments uses the URL embedded in `retirement_pay_engine.js` to fetch
  the WASM binary. In Vite dev mode, this URL is served by the dev server. In production,
  Vite copies the `.wasm` file to `dist/assets/` and rewrites the URL during build.
- Do NOT pass an explicit URL to `init()`. The embedded URL is correct for both dev and prod
  when Vite is configured correctly (see Section 4).

---

## 3. File: `src/wasm/bridge.node.ts` (Node.js — Vitest)

Used by vitest test files. Initializes with synchronous `initSync()` using Node.js `fs`.

```typescript
// apps/retirement-pay/frontend/src/wasm/bridge.node.ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initSync } from './pkg/retirement_pay_engine.js';

// ESM-compatible __dirname replacement (wasm-pack output is ESM; no __dirname in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const wasmPath = join(__dirname, './pkg/retirement_pay_engine_bg.wasm');
const wasmBytes = readFileSync(wasmPath);
initSync(wasmBytes);

export { compute_single_json, compute_batch_json, generate_nlrc_json } from './pkg/retirement_pay_engine.js';
```

**Critical notes:**
- `import.meta.url` is the ESM-safe way to get the current file's path. `__dirname` is not
  available in ESM modules. The `fileURLToPath` + `dirname` pattern is the standard replacement.
- `initSync(wasmBytes)` is synchronous and blocks the event loop briefly. For tests this is
  acceptable — WASM compilation is fast (<50ms for this module).
- The import from `./pkg/retirement_pay_engine.js` works in Node.js when vitest is configured
  with `pool: 'forks'` (see Section 5). The default `pool: 'threads'` (Worker threads) has
  issues with WASM in some Node.js versions.
- This file is listed as `setupFiles` in `vitest.config.ts` and runs once per test worker
  process before any test file.

---

## 4. Vite Config (`vite.config.ts`)

Three Vite plugins are required in exact order:

```typescript
// apps/retirement-pay/frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react(),
    wasm(),              // MUST come before topLevelAwait
    topLevelAwait(),     // Enables top-level await in WASM module
    tsconfigPaths(),
  ],
  build: {
    target: 'esnext',   // Required for top-level await support in output
    rollupOptions: {
      output: {
        // Prevent Rollup from inlining the .wasm file as a data URL —
        // always emit it as a separate asset file in dist/assets/
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  // Ensure Vite treats .wasm as a URL asset, not a raw binary import
  assetsInclude: ['**/*.wasm'],
});
```

**Plugin order is mandatory:**
- `wasm()` must precede `topLevelAwait()`. The wasm plugin transforms WASM imports into
  proper URL references. The topLevelAwait plugin then wraps the async initialization in
  top-level await syntax. Reversing the order causes the topLevelAwait plugin to process
  WASM imports before they are transformed, producing broken output.
- `react()` must precede both WASM plugins.

**`build.target: 'esnext'`** is required because top-level await is an ES2022+ feature. If
set to `es2015` or similar, Vite will refuse to build with an error about top-level await.

**`assetsInclude: ['**/*.wasm']`** tells Vite to treat `.wasm` files as static assets that
are copied to `dist/assets/`. Without this, Vite may try to process the WASM binary as
JavaScript and fail.

**Production behavior:** In `npm run build`, Vite:
1. Copies `retirement_pay_engine_bg.wasm` to `dist/assets/retirement_pay_engine_bg-[hash].wasm`
2. Rewrites the URL inside `retirement_pay_engine.js` to point to the hashed asset path
3. The `init()` call in `bridge.ts` uses this rewritten URL automatically

---

## 5. Vitest Config (`vitest.config.ts`)

```typescript
// apps/retirement-pay/frontend/vitest.config.ts
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',       // NOT jsdom — WASM requires Node.js APIs (fs, WebAssembly)
    pool: 'forks',             // Use child_process.fork — avoids Worker thread WASM issues
    setupFiles: ['src/wasm/bridge.node.ts'],  // Runs initSync before any test
    globals: true,             // Enables describe/it/expect without imports
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
  },
});
```

**`pool: 'forks'`** is critical. Vitest's default pool is `threads` (Node.js Worker threads).
Some Node.js versions have issues compiling WASM modules inside Worker threads (the
`WebAssembly.compile` API may be unavailable or restricted). Using `forks` runs each worker
as a separate child process with full Node.js API access, eliminating this problem.

**`environment: 'node'`** (not `jsdom`) is required because:
- `fs.readFileSync` is used in `bridge.node.ts` to load the `.wasm` file.
- `jsdom` emulates a browser environment where `fs` is not available.
- The WASM engine tests are pure unit tests; no DOM is needed.

**`setupFiles`** path is relative to the vitest config file. Vitest resolves it against the
project root (where `package.json` is). The file runs once per worker process, before any
test in that worker's test suite.

---

## 6. React App Startup (`src/main.tsx`)

```typescript
// apps/retirement-pay/frontend/src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { initWasm } from './wasm/bridge';

async function bootstrap() {
  try {
    await initWasm();
  } catch (error) {
    // WASM failed to load — render a fatal error page instead of the app
    const root = createRoot(document.getElementById('root')!);
    root.render(
      <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <h1>Failed to Load Computation Engine</h1>
        <p>
          The computation engine could not be initialized. This may be a network error.
          Please check your connection and{' '}
          <button onClick={() => window.location.reload()}>refresh the page</button>.
        </p>
        <details>
          <summary>Error details</summary>
          <pre>{String(error)}</pre>
        </details>
      </div>
    );
    return;
  }

  const root = createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}

bootstrap();
```

**Design decisions:**
- `bootstrap()` is `async` to allow `await initWasm()`. Since this is the top-level entry
  point, this is safe — there is no caller expecting a return value.
- The WASM is initialized BEFORE the React router is mounted. This ensures no route component
  ever calls `computeSingle()` before the engine is ready.
- The error page uses inline styles (no Tailwind) because Tailwind CSS may not be loaded yet
  if the WASM init failure occurs before the React app renders. This guarantees the error
  message is always visible.
- `window.location.reload()` is the correct recovery path — there is no way to retry `init()`
  after a network failure without reloading the page, because the WASM module loader is
  stateful.

---

## 7. Web Worker for Large Batch Computations (`src/workers/batch.worker.ts`)

For batch jobs with more than 50 employees, computation runs in a Web Worker to avoid
blocking the main thread UI. The worker has its own WASM initialization lifecycle.

```typescript
// apps/retirement-pay/frontend/src/workers/batch.worker.ts

// Import WASM functions directly — NOT from bridge.ts (which uses main-thread init)
import { initSync, compute_batch_json } from '../wasm/pkg/retirement_pay_engine.js';
import type { BatchInput, BatchOutput } from '../types/engine';

type WorkerMessage =
  | { type: 'INIT'; wasmUrl: string }
  | { type: 'COMPUTE'; input: BatchInput }

type WorkerResponse =
  | { type: 'READY' }
  | { type: 'RESULT'; result: string }
  | { type: 'ERROR'; message: string }

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;

  if (msg.type === 'INIT') {
    try {
      // Browser Worker cannot use fs — must fetch the WASM binary via HTTP
      const response = await fetch(msg.wasmUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch WASM: ${response.status} ${response.statusText}`);
      }
      const bytes = await response.arrayBuffer();
      initSync(bytes);
      self.postMessage({ type: 'READY' } satisfies WorkerResponse);
    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        message: `Worker WASM init failed: ${String(error)}`,
      } satisfies WorkerResponse);
    }
  } else if (msg.type === 'COMPUTE') {
    // compute_batch_json is synchronous — result is a JSON string
    const result = compute_batch_json(JSON.stringify(msg.input));
    self.postMessage({ type: 'RESULT', result } satisfies WorkerResponse);
  }
};
```

**Main thread caller:**

```typescript
// src/wasm/batch-worker-client.ts
import type { BatchInput, BatchOutput } from '../types/engine';
import { unwrapWasmResult } from './helpers';

// Vite resolves the worker URL at build time via the new URL() pattern
function createBatchWorker(): Worker {
  return new Worker(
    new URL('../workers/batch.worker.ts', import.meta.url),
    { type: 'module' }
  );
}

export async function computeBatchInWorker(input: BatchInput): Promise<BatchOutput> {
  return new Promise((resolve, reject) => {
    const worker = createBatchWorker();
    let initialized = false;

    worker.onmessage = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === 'READY') {
        initialized = true;
        worker.postMessage({ type: 'COMPUTE', input });
      } else if (msg.type === 'RESULT') {
        worker.terminate();
        try {
          const output = unwrapWasmResult<BatchOutput>(msg.result, 'compute_batch_json');
          resolve(output);
        } catch (error) {
          reject(error);
        }
      } else if (msg.type === 'ERROR') {
        worker.terminate();
        reject(new Error(msg.message));
      }
    };

    worker.onerror = (error) => {
      worker.terminate();
      reject(new Error(`Batch worker error: ${error.message}`));
    };

    // Send INIT with the WASM URL — Vite provides import.meta.url for asset resolution
    // The WASM binary URL is extracted from the pkg's package.json "module" field
    // In practice, we use a known relative path that Vite resolves correctly
    const wasmUrl = new URL(
      '../wasm/pkg/retirement_pay_engine_bg.wasm',
      import.meta.url
    ).href;

    worker.postMessage({ type: 'INIT', wasmUrl });
  });
}
```

**Threshold for worker vs main thread:**

```typescript
// src/wasm/api.ts
import { computeBatch } from './bridge-helpers';
import { computeBatchInWorker } from './batch-worker-client';
import type { BatchInput, BatchOutput } from '../types/engine';

const BATCH_WORKER_THRESHOLD = 50;

export async function computeBatchAuto(input: BatchInput): Promise<BatchOutput> {
  if (input.employees.length > BATCH_WORKER_THRESHOLD) {
    return computeBatchInWorker(input);
  } else {
    // Synchronous — no Worker overhead for small batches
    const { compute_batch_json } = await import('./bridge');
    const result = compute_batch_json(JSON.stringify(input));
    return unwrapWasmResult<BatchOutput>(result, 'compute_batch_json');
  }
}
```

---

## 8. WASM URL Resolution: Dev vs Production

| Context | WASM Binary Location | How `init()` Finds It |
|---------|---------------------|----------------------|
| Vite dev server | `src/wasm/pkg/retirement_pay_engine_bg.wasm` | Vite dev server serves it at `/src/wasm/pkg/...` |
| Production (`npm run build`) | `dist/assets/retirement_pay_engine_bg-[hash].wasm` | Vite rewrites URL in `.js` bundle at build time |
| Vitest (Node.js) | `src/wasm/pkg/retirement_pay_engine_bg.wasm` | `readFileSync` with absolute path from `__dirname` |
| Web Worker (browser) | Same as production | Passed explicitly as `wasmUrl` in INIT message |

**Production verification requirement (from lessons learned):**
After `npm run build`, run `npx serve dist` and verify:
1. Network tab shows `.wasm` file being fetched (not 404)
2. The fetched URL has the content-hash suffix (e.g., `retirement_pay_engine_bg-Abc123.wasm`)
3. App loads and a computation succeeds without console errors

If the WASM file is not in `dist/assets/`, check that `assetsInclude: ['**/*.wasm']` is in
`vite.config.ts` and that `vite-plugin-wasm` is installed and listed before `topLevelAwait`.

---

## 9. Package Dependencies

```json
// apps/retirement-pay/frontend/package.json (relevant sections)
{
  "devDependencies": {
    "vite": "^5.0.0",
    "vite-plugin-wasm": "^3.3.0",
    "vite-plugin-top-level-await": "^1.4.4",
    "@vitejs/plugin-react": "^4.0.0",
    "vitest": "^1.0.0",
    "wasm-pack": "^0.12.0"
  }
}
```

**`vite-plugin-wasm`** handles:
- Converting WASM imports to URL-based async loading
- Emitting the `.wasm` file as a build asset
- Setting `Content-Type: application/wasm` in dev server responses

**`vite-plugin-top-level-await`** handles:
- Transforming top-level `await` in the WASM init module to be compatible with
  browsers/environments that don't support it natively (adds an IIFE wrapper)
- Required because `wasm-pack --target web` output uses top-level await in some Node versions

---

## 10. TypeScript Config Requirements

```jsonc
// apps/retirement-pay/frontend/tsconfig.json (relevant fields)
{
  "compilerOptions": {
    "target": "ES2022",        // Required for top-level await in type-checking
    "module": "ESNext",        // Required for ESM import resolution
    "moduleResolution": "Bundler",  // Vite-compatible module resolution
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],  // Provides import.meta.url and import.meta.env types
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "skipLibCheck": true       // Skip checking wasm-bindgen generated .d.ts files
  }
}
```

`"skipLibCheck": true` is particularly important because the auto-generated `retirement_pay_engine.d.ts`
may have type errors in some wasm-bindgen versions. Skipping lib checking prevents build
failures from generated code outside our control.

---

## 11. File Locations Summary

```
apps/retirement-pay/
├── engine/
│   ├── Cargo.toml
│   └── src/lib.rs             # #[wasm_bindgen] exports
└── frontend/
    ├── vite.config.ts         # Plugin order: react > wasm > topLevelAwait
    ├── vitest.config.ts       # pool: 'forks', environment: 'node', setupFiles
    ├── tsconfig.json          # target: ES2022, module: ESNext
    └── src/
        └── wasm/
            ├── pkg/           # wasm-pack output (gitignored)
            │   ├── retirement_pay_engine.js
            │   ├── retirement_pay_engine_bg.wasm
            │   └── retirement_pay_engine.d.ts
            ├── bridge.ts          # Browser init (async init())
            ├── bridge.node.ts     # Node.js/vitest init (sync initSync())
            ├── api.ts             # computeSingle(), computeBatch(), generateNlrcWorksheet()
            └── helpers.ts         # unwrapWasmResult(), WasmEngineError
        └── workers/
            └── batch.worker.ts    # Web Worker for large batch jobs (>50 employees)
```

---

## 12. Initialization Error States

| Failure mode | When it occurs | Recovery |
|--------------|---------------|----------|
| `init()` network error | .wasm file not found (404) in production | Render fatal error page with "refresh" button |
| `init()` WebAssembly compile error | Corrupt .wasm binary or browser bug | Same — refresh |
| `initSync()` file not found | `pkg/` directory not built before vitest | Run `wasm-pack build` first; add to CI pre-test step |
| `initSync()` permission error | WASM file not readable | Check file permissions in Docker build |
| Worker WASM fetch 404 | `wasmUrl` resolved incorrectly | Verify `new URL('../wasm/pkg/..., import.meta.url)` path |
| Called before `initWasm()` | Route rendered before bootstrap completes | Prevented by awaiting `initWasm()` before mounting router |
| Double `initSync()` call | `setupFiles` runs in multiple workers | Safe — `initSync` is idempotent |

---

## Summary

| Context | Init Function | File | Blocking? |
|---------|--------------|------|-----------|
| Browser (main thread) | `init()` — async | `bridge.ts` | No — awaited at startup |
| Vitest (Node.js) | `initSync(bytes)` — sync | `bridge.node.ts` | Yes — runs in setupFiles |
| Web Worker (large batch) | `initSync(arrayBuffer)` — sync | `batch.worker.ts` | Yes — runs before COMPUTE |
| React app startup | Delegates to `bridge.ts` | `main.tsx` | `await initWasm()` before router mount |

**The singleton pattern in `bridge.ts`** (double-guard with `_initialized` + `_initPromise`)
ensures `init()` is called exactly once even if multiple components call `initWasm()` concurrently
during app startup.

**The `pool: 'forks'` vitest setting** is non-negotiable for WASM compatibility in Node.js.

**The Vite plugin order** (`react` > `wasm` > `topLevelAwait`) is non-negotiable for correct
production builds.
