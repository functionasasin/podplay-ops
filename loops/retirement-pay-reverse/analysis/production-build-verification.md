# Analysis: Production Build Verification — RA 7641 Retirement Pay Calculator

**Wave:** 6 — Testing + Deployment
**Aspect:** production-build-verification
**Date:** 2026-03-06
**Sources:** initialization-patterns.md, playwright-e2e-specs.md, database-migrations.md

---

## Overview

Lesson Failure 1 from the inheritance app: the forward loop declared "complete" while only
testing in `npm run dev` mode. The production build (`npm run build` + `npx serve dist`) had
different behavior due to:
- Vite plugin ordering affecting WASM asset emission
- Tree-shaking removing code dev mode kept loaded
- WASM URL rewriting that only happens at build time
- Static file serving vs hot-module-replacement dev server

This aspect specifies every check the forward loop MUST perform before declaring the
production build complete.

---

## 1. Vite Plugin Inventory (Exact Order)

```typescript
// apps/retirement-pay/frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react(),           // 1st: JSX/TSX transform (must precede WASM plugins)
    wasm(),            // 2nd: WASM URL asset emission (must precede topLevelAwait)
    topLevelAwait(),   // 3rd: top-level await support for WASM init module
    tsconfigPaths(),   // 4th: tsconfig path aliases (@/... resolution)
  ],
  build: {
    target: 'esnext',  // Required for top-level await in output bundles
    rollupOptions: {
      output: {
        // Emit .wasm as a separate file — do NOT inline as base64 data URL
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
  assetsInclude: ['**/*.wasm'],  // Treat .wasm as a static asset, not JS
  optimizeDeps: {
    exclude: ['retirement-pay-engine'],  // Do not pre-bundle the WASM package
  },
});
```

### Why Plugin Order Is Non-Negotiable

| Order violation | Effect |
|----------------|--------|
| `wasm()` after `topLevelAwait()` | `topLevelAwait` processes raw WASM imports before they are transformed to URL references; output is broken |
| `react()` after `wasm()` | JSX in files that import WASM modules is not transformed; build errors |
| Missing `topLevelAwait()` | WASM init module uses top-level `await`; bundled output throws SyntaxError in older browsers |
| Missing `tsconfigPaths()` | `@/components/...` imports resolve to unresolvable paths; build errors |

### Required npm Packages

```json
{
  "devDependencies": {
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vite-plugin-wasm": "^3.3.0",
    "vite-plugin-top-level-await": "^1.4.4",
    "vite-tsconfig-paths": "^5.0.0"
  }
}
```

---

## 2. Production Build Command Sequence

The forward loop MUST execute this exact sequence (not just `npm run dev`) before marking
any stage as complete:

```bash
# Step 1: Build the WASM engine
cd apps/retirement-pay/engine
wasm-pack build --target web --out-dir ../frontend/src/wasm/pkg

# Step 2: Build the frontend for production
cd ../frontend
npm run build
# Equivalent to: vite build

# Step 3: Serve the production build
npx serve dist --single
# --single: all 404s → index.html (required for client-side routing)
# Default port: 3000

# Step 4: Run smoke tests against http://localhost:3000
```

`package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "build:engine": "cd ../engine && wasm-pack build --target web --out-dir ../frontend/src/wasm/pkg",
    "preview": "npx serve dist --single",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx --max-warnings 0"
  }
}
```

---

## 3. Production Build Output Verification Checklist

After `npm run build`, verify the `dist/` directory contains:

```
dist/
├── index.html                           # Entry point — must have <script type="module">
├── assets/
│   ├── index-[hash].js                  # Main bundle
│   ├── index-[hash].css                 # Tailwind styles
│   ├── retirement_pay_engine_bg-[hash].wasm  # WASM binary (MUST be present)
│   └── retirement_pay_engine-[hash].js  # WASM JS glue code
└── favicon.ico
```

**Critical checks:**
1. `dist/assets/` MUST contain a `.wasm` file. If missing: check `assetsInclude: ['**/*.wasm']` in `vite.config.ts` and that `vite-plugin-wasm` is installed.
2. The `.wasm` file MUST have a content-hash suffix (e.g., `-Abc123Def456.wasm`). If no hash: check `rollupOptions.output.assetFileNames` config.
3. `dist/index.html` must contain `<script type="module"` (not `<script` without module). If missing: `build.target` is not `esnext`.
4. No `.wasm` file larger than 10MB in assets (check for accidental binary duplication).

---

## 4. WASM Loading in Production Mode

### How It Works

In `npm run build`, the Vite wasm plugin:
1. Detects the import of `retirement_pay_engine_bg.wasm` inside `retirement_pay_engine.js`
2. Copies `retirement_pay_engine_bg.wasm` to `dist/assets/retirement_pay_engine_bg-[hash].wasm`
3. Rewrites the URL string inside the bundled `retirement_pay_engine-[hash].js` to the hashed path

The `bridge.ts` `init()` call (with no arguments) uses the URL embedded in the bundled JS,
which after Vite rewrites points to the correct `dist/assets/...wasm` path.

### Browser Network Tab Verification

After `npx serve dist --single`, open DevTools > Network tab and:
1. Load `http://localhost:3000`
2. Filter by `wasm` type
3. Verify: ONE request to `/assets/retirement_pay_engine_bg-[hash].wasm` with status 200
4. Verify: Response `Content-Type` header is `application/wasm`
5. Verify: No 404 errors in Network tab
6. Verify: No errors in Console tab

If WASM request is 404: the file is not in `dist/assets/`. See checklist above.
If WASM loads but app errors: check Console for JS errors. Common cause: wrong `init()` call.

### Static File Server Requirements

`npx serve dist --single` is required (not `npx serve dist`). The `--single` flag makes the
server return `index.html` for all unmatched paths, which is required for client-side routing
(TanStack Router). Without `--single`:
- Navigation to `/dashboard` after page load works (JS router handles it)
- But direct URL access to `http://localhost:3000/dashboard` returns 404 (server has no `/dashboard`)
- The smoke test MUST test direct URL access, not just click navigation

Fly.io also requires this — the Dockerfile must configure Nginx or Caddy with `try_files` (see `fly-io-deployment.md`).

---

## 5. Tree-Shaking Sensitive Libraries

These libraries have known tree-shaking issues in Vite/Rollup production builds:

### @react-pdf/renderer

**Problem:** `@react-pdf/renderer` imports many Node.js polyfills (Buffer, stream, etc.) that
are not tree-shaken correctly in some Vite versions. The production bundle may be 2-3x larger
than expected, or build may fail with "Buffer is not defined" at runtime.

**Fix in `vite.config.ts`:**

```typescript
export default defineConfig({
  // ... plugins
  resolve: {
    alias: {
      // Prevent @react-pdf/renderer from trying to load Node.js built-ins
      stream: 'stream-browserify',
      buffer: 'buffer',
    },
  },
  define: {
    // Polyfill process.env for @react-pdf/renderer
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  optimizeDeps: {
    exclude: ['retirement-pay-engine'],
    include: ['buffer', 'stream-browserify'],
  },
});
```

**Additional package deps:**
```json
{
  "dependencies": {
    "buffer": "^6.0.3",
    "stream-browserify": "^3.0.0"
  }
}
```

**Smoke test:** After `npm run build`, verify the bundle size of `dist/assets/index-[hash].js` is under 5MB. If over 5MB, `@react-pdf/renderer` is likely pulling in unnecessary polyfills.

### Supabase JS Client (`@supabase/supabase-js`)

**Problem:** The Supabase client bundles all auth providers and storage adapters by default.
In production, Vite may not tree-shake unused sub-packages because they use CJS interop.

**Fix:** Import only what is needed:
```typescript
// CORRECT — tree-shakeable
import { createClient } from '@supabase/supabase-js';

// WRONG — imports everything including unused realtime/storage
import * as supabase from '@supabase/supabase-js';
```

**No additional config needed** as long as named imports are used.

### lucide-react

**Problem:** Importing `lucide-react` with a wildcard or the entire namespace pulls in all
~1000 icons. Production bundle will be enormous.

**Fix:** Always use named imports:
```typescript
// CORRECT — tree-shakeable
import { Calculator, Upload, FileText, Share2, AlertCircle } from 'lucide-react';

// WRONG — bundles all icons
import * as Icons from 'lucide-react';
```

**Smoke test:** If `dist/assets/index-[hash].js` > 3MB, check for wildcard icon imports.

### TanStack Router

**Problem:** TanStack Router's file-based routing uses code generation (`tsr generate`). If
the generated `routeTree.gen.ts` is stale (i.e., routes added but `tsr generate` not re-run),
the production build will be missing routes that appear to work in dev (because dev mode
regenerates on the fly).

**Fix:** Run `tsr generate` as part of the build command:
```json
{
  "scripts": {
    "build": "tsr generate && tsc --noEmit && vite build"
  }
}
```

**Smoke test:** After `npm run build`, check that `src/routeTree.gen.ts` has a modified
timestamp after the build started. If it is older than the build, routes may be missing.

---

## 6. Production Smoke Test Script

The forward loop MUST run these manual checks after `npm run build && npx serve dist --single`:

```
SMOKE TEST CHECKLIST — Run against http://localhost:3000

[ ] Landing page loads (200, no console errors)
[ ] "Sign Up" button navigates to /auth (client-side, no 404)
[ ] Direct URL access: open http://localhost:3000/auth — loads sign-in page (not 404)
[ ] Sign up with test@example.com / TestPassword123! — redirects to /dashboard
[ ] Dashboard shows empty state (no computations yet)
[ ] "New Computation" button → navigates to /compute/new
[ ] Wizard Step 1 loads (no WASM errors in console)
[ ] Complete wizard through all 5 steps with valid data
[ ] Results page shows retirement pay amount (not 0, not undefined)
[ ] "Export PDF" button triggers download (file appears in Downloads, not 0 bytes)
[ ] "Share" button copies link to clipboard — navigate to /share/[token] in incognito
[ ] Batch upload: navigate to /batch/new, upload a 3-row CSV, verify results table
[ ] NLRC worksheet: navigate to /compute/[id]/nlrc, verify formatted output
[ ] Direct URL access: http://localhost:3000/dashboard (after login) — no 404
[ ] Reload page at /compute/[id]/results — stays on results, not 404
[ ] Sign out — redirects to /
[ ] Direct URL access: http://localhost:3000/share/[token] in incognito — loads shared result
```

### Automated Smoke Test (Playwright against `npx serve dist`)

The CI/CD pipeline runs Playwright against the production build. The `playwright.config.ts`
must support a `PROD` environment variable to run against the served production build:

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

const baseURL = process.env.PROD === '1'
  ? 'http://localhost:3000'   // Production build (npx serve dist --single)
  : 'http://localhost:5173';  // Dev server (vite)

export default defineConfig({
  use: { baseURL },
  webServer: process.env.PROD === '1'
    ? {
        command: 'npx serve dist --single --port 3000',
        url: 'http://localhost:3000',
        reuseExistingServer: false,
      }
    : {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
      },
});
```

Run production E2E:
```bash
PROD=1 npx playwright test
```

---

## 7. TypeScript Build Verification

`npm run build` includes `tsc --noEmit` before `vite build`. This catches type errors that
are silently ignored during dev (Vite does not type-check; it only transpiles).

**Common type errors that appear only in production build:**

1. **Missing `ReturnType` annotations on WASM bridge functions** — `compute_single_json`
   returns `string`, not a typed object. The `unwrapWasmResult<T>()` helper casts with
   `JSON.parse()`. If `T` is never specified, TypeScript infers `any`, which passes but
   is a type hole.

2. **Implicit `any` from JSON.parse** — `JSON.parse(result) as T` is technically unsafe.
   The Zod schemas in `src/schemas/` must be used to validate the parsed result.

3. **`import.meta.env` type errors** — All `VITE_` env vars must be declared in
   `src/vite-env.d.ts`:
   ```typescript
   interface ImportMeta {
     readonly env: {
       readonly VITE_SUPABASE_URL: string;
       readonly VITE_SUPABASE_ANON_KEY: string;
       readonly MODE: string;
       readonly DEV: boolean;
       readonly PROD: boolean;
     };
   }
   ```

**Build must complete with zero TypeScript errors and zero ESLint warnings.**

---

## 8. Content Security Policy Compatibility

When deployed to Fly.io behind Nginx, the Content Security Policy (CSP) must permit WASM:

```nginx
# Nginx config snippet (nginx.conf)
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  frame-ancestors 'none';
" always;
```

**`'wasm-unsafe-eval'`** is required for WASM compilation. Without it, Chrome throws:
`EvalError: WebAssembly.instantiate(): Wasm code generation disallowed by embedder`

**Note:** `'unsafe-eval'` is NOT the same as `'wasm-unsafe-eval'`. Use the specific wasm
directive which was added in 2021 and is supported in all modern browsers.

**Smoke test:** Open DevTools > Console after loading the prod build. Zero CSP violations.

---

## 9. Build Size Budget

Track these in CI to detect accidental bundle bloat:

| Asset | Max Size (gzip) | What causes bloat |
|-------|----------------|-------------------|
| `dist/assets/index-[hash].js` | 500 KB | wildcard icon imports, unused supabase modules |
| `dist/assets/index-[hash].css` | 50 KB | unused Tailwind classes (purge not working) |
| `dist/assets/*.wasm` | 2 MB | large Rust dependencies (num crate, regex crate) |
| Total `dist/` | 5 MB | everything above |

**Bundle analyzer command (run after build to investigate bloat):**
```bash
npx vite-bundle-visualizer
# Opens a treemap in the browser showing which modules contribute to bundle size
```

---

## 10. Pre-Build CI Step Order

The CI pipeline MUST run these steps in order before running Playwright E2E tests:

```yaml
# CI build sequence (before E2E)
steps:
  - name: Install Rust + wasm-pack
    run: |
      rustup target add wasm32-unknown-unknown
      cargo install wasm-pack

  - name: Build WASM engine
    working-directory: apps/retirement-pay/engine
    run: wasm-pack build --target web --out-dir ../frontend/src/wasm/pkg

  - name: Install frontend dependencies
    working-directory: apps/retirement-pay/frontend
    run: npm ci

  - name: TypeScript typecheck
    working-directory: apps/retirement-pay/frontend
    run: npm run typecheck

  - name: ESLint
    working-directory: apps/retirement-pay/frontend
    run: npm run lint

  - name: Vitest unit tests
    working-directory: apps/retirement-pay/frontend
    run: npx vitest run

  - name: Production build
    working-directory: apps/retirement-pay/frontend
    run: npm run build

  - name: Verify WASM in dist
    working-directory: apps/retirement-pay/frontend
    run: |
      if ! ls dist/assets/*.wasm 1>/dev/null 2>&1; then
        echo "ERROR: No .wasm file in dist/assets/"
        exit 1
      fi
      echo "WASM file found: $(ls dist/assets/*.wasm)"

  - name: Playwright E2E against production build
    working-directory: apps/retirement-pay/frontend
    run: PROD=1 npx playwright test
```

**Step order rationale:**
- TypeScript check before build: catches type errors before Vite silently ignores them
- Vitest before Playwright: fast unit tests fail fast before slow E2E tests run
- WASM verification step: explicit check that `dist/assets/*.wasm` exists (prevents silent 404)
- Playwright runs against `npm run build` output: tests the exact artifact that will deploy

---

## 11. Known Production-Only Failure Modes

| Failure | Symptom | Root Cause | Fix |
|---------|---------|-----------|-----|
| WASM 404 in production | App loads but all computations fail silently | `.wasm` not in `dist/assets/` | Add `assetsInclude: ['**/*.wasm']` to vite.config.ts |
| White screen on direct URL | Navigating to `/dashboard` gives blank page | Static server not configured with `try_files` / `--single` | Use `npx serve dist --single`; Nginx `try_files $uri $uri/ /index.html` |
| PDF export silently fails | Click "Export PDF" — nothing happens | `@react-pdf/renderer` tree-shaken but `BlobProvider` not tree-shakeable; requires explicit lazy import | Use `React.lazy(() => import('./PdfDocument'))` for all react-pdf components |
| CSP WASM error | Console error about wasm-unsafe-eval | Nginx CSP missing `'wasm-unsafe-eval'` directive | Add to `script-src` in nginx.conf |
| Missing Tailwind styles | Components look unstyled | Tailwind purge not finding component files | Check `content` array in `tailwind.config.ts` includes `./src/**/*.{tsx,ts}` |
| stale routeTree.gen.ts | Routes that work in dev return 404 in build | `tsr generate` not run before `vite build` | Add `tsr generate &&` prefix to build script |
| Buffer undefined (react-pdf) | PDF export crashes with `ReferenceError: Buffer is not defined` | @react-pdf/renderer needs Buffer polyfill | Add `buffer` package, configure in vite.config.ts `resolve.alias` |

---

## Summary

The production build verification aspect covers:

1. **Vite plugin order**: `react` > `wasm` > `topLevelAwait` > `tsconfigPaths` — violation breaks builds
2. **Build sequence**: `wasm-pack build` → `npm run build` → `npx serve dist --single`
3. **Dist output check**: `.wasm` file MUST be in `dist/assets/` with content-hash suffix
4. **WASM URL rewriting**: Vite automatically rewrites the embedded URL at build time; no manual config needed
5. **Tree-shaking**: `@react-pdf/renderer` (Buffer polyfill), `lucide-react` (named imports only), TanStack Router (`tsr generate` before build)
6. **Smoke test checklist**: 18 specific checks to run against `npx serve dist`
7. **TypeScript build**: `tsc --noEmit` runs before `vite build`; must have zero errors
8. **CSP**: Nginx must include `'wasm-unsafe-eval'` in `script-src`
9. **Bundle size budget**: index.js < 500KB gzip, total dist < 5MB
10. **CI step order**: wasm-pack → npm ci → typecheck → lint → vitest → build → verify wasm → playwright
