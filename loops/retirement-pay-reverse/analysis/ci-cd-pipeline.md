# Analysis: CI/CD Pipeline — RA 7641 Retirement Pay Calculator

**Wave:** 6 — Testing + Deployment
**Aspect:** ci-cd-pipeline
**Date:** 2026-03-06
**Sources:** fly-io-deployment.md, production-build-verification.md, playwright-e2e-specs.md, supabase-gotchas.md, migration-verification.md

---

## Overview

GitHub Actions pipeline for the `apps/retirement-pay/` workspace. The pipeline runs on every push
and pull request. Deploy to Fly.io only triggers on pushes to `main` after all quality gates pass.

Pipeline stages in dependency order:
1. **typecheck** — TypeScript compiler (`tsc --noEmit`) zero errors
2. **lint** — ESLint zero warnings
3. **vitest** — Unit + integration tests (WASM engine tests via `initSync`)
4. **build** — Vite production build with WASM verification
5. **playwright** — E2E tests against the production build artifact
6. **deploy** — `fly deploy` with build-arg secret injection (main only)

---

## 1. Workflow File

**Path:** `.github/workflows/retirement-pay.yml`
(Monorepo — scoped to `apps/retirement-pay/**` changes)

```yaml
name: retirement-pay

on:
  push:
    branches: [main]
    paths:
      - 'apps/retirement-pay/**'
      - '.github/workflows/retirement-pay.yml'
  pull_request:
    branches: [main]
    paths:
      - 'apps/retirement-pay/**'
      - '.github/workflows/retirement-pay.yml'

concurrency:
  group: retirement-pay-${{ github.ref }}
  cancel-in-progress: true

env:
  RUST_VERSION: "1.82"
  NODE_VERSION: "22"
  WORKING_DIR_ENGINE: apps/retirement-pay/engine
  WORKING_DIR_FRONTEND: apps/retirement-pay/frontend

jobs:
  # ─────────────────────────────────────────────────────
  # Job 1: TypeScript typecheck
  # ─────────────────────────────────────────────────────
  typecheck:
    name: TypeScript Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: apps/retirement-pay/frontend/package-lock.json

      - name: Install frontend dependencies
        working-directory: ${{ env.WORKING_DIR_FRONTEND }}
        run: npm ci

      - name: TypeScript typecheck
        working-directory: ${{ env.WORKING_DIR_FRONTEND }}
        run: npm run typecheck

  # ─────────────────────────────────────────────────────
  # Job 2: ESLint
  # ─────────────────────────────────────────────────────
  lint:
    name: ESLint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: apps/retirement-pay/frontend/package-lock.json

      - name: Install frontend dependencies
        working-directory: ${{ env.WORKING_DIR_FRONTEND }}
        run: npm ci

      - name: ESLint (zero warnings)
        working-directory: ${{ env.WORKING_DIR_FRONTEND }}
        run: npm run lint

  # ─────────────────────────────────────────────────────
  # Job 3: Rust engine unit tests (native, not WASM)
  # ─────────────────────────────────────────────────────
  rust-test:
    name: Rust Engine Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust ${{ env.RUST_VERSION }}
        uses: dtolnay/rust-toolchain@stable
        with:
          toolchain: ${{ env.RUST_VERSION }}
          components: clippy

      - name: Cache Rust build artifacts
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            ${{ env.WORKING_DIR_ENGINE }}/target
          key: rust-${{ env.RUST_VERSION }}-${{ hashFiles('apps/retirement-pay/engine/Cargo.lock') }}
          restore-keys: rust-${{ env.RUST_VERSION }}-

      - name: Run Rust unit tests
        working-directory: ${{ env.WORKING_DIR_ENGINE }}
        run: cargo test --all-features

      - name: Clippy (zero warnings)
        working-directory: ${{ env.WORKING_DIR_ENGINE }}
        run: cargo clippy --all-features -- -D warnings

  # ─────────────────────────────────────────────────────
  # Job 4: Build WASM + Run Vitest
  # ─────────────────────────────────────────────────────
  vitest:
    name: Vitest (Unit + Integration)
    runs-on: ubuntu-latest
    needs: [rust-test]
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust + wasm32 target
        uses: dtolnay/rust-toolchain@stable
        with:
          toolchain: ${{ env.RUST_VERSION }}
          targets: wasm32-unknown-unknown

      - name: Cache Rust build artifacts
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            ${{ env.WORKING_DIR_ENGINE }}/target
          key: rust-wasm-${{ env.RUST_VERSION }}-${{ hashFiles('apps/retirement-pay/engine/Cargo.lock') }}
          restore-keys: rust-wasm-${{ env.RUST_VERSION }}-

      - name: Install wasm-pack
        run: curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

      - name: Build WASM engine
        working-directory: ${{ env.WORKING_DIR_ENGINE }}
        run: wasm-pack build --target web --out-dir ../frontend/src/wasm/pkg

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: apps/retirement-pay/frontend/package-lock.json

      - name: Install frontend dependencies
        working-directory: ${{ env.WORKING_DIR_FRONTEND }}
        run: npm ci

      - name: Run Vitest
        working-directory: ${{ env.WORKING_DIR_FRONTEND }}
        run: npx vitest run --reporter=verbose

      - name: Upload Vitest results
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: vitest-results
          path: apps/retirement-pay/frontend/test-results/

  # ─────────────────────────────────────────────────────
  # Job 5: Production build + verify WASM in dist
  # ─────────────────────────────────────────────────────
  build:
    name: Production Build
    runs-on: ubuntu-latest
    needs: [typecheck, lint, vitest]
    outputs:
      dist-artifact-key: ${{ steps.artifact-key.outputs.key }}
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust + wasm32 target
        uses: dtolnay/rust-toolchain@stable
        with:
          toolchain: ${{ env.RUST_VERSION }}
          targets: wasm32-unknown-unknown

      - name: Cache Rust build artifacts
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            ${{ env.WORKING_DIR_ENGINE }}/target
          key: rust-wasm-${{ env.RUST_VERSION }}-${{ hashFiles('apps/retirement-pay/engine/Cargo.lock') }}
          restore-keys: rust-wasm-${{ env.RUST_VERSION }}-

      - name: Install wasm-pack
        run: curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

      - name: Build WASM engine
        working-directory: ${{ env.WORKING_DIR_ENGINE }}
        run: wasm-pack build --target web --out-dir ../frontend/src/wasm/pkg

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: apps/retirement-pay/frontend/package-lock.json

      - name: Install frontend dependencies
        working-directory: ${{ env.WORKING_DIR_FRONTEND }}
        run: npm ci

      - name: Vite production build
        working-directory: ${{ env.WORKING_DIR_FRONTEND }}
        env:
          # Use placeholder values for CI build — Supabase features work but auth is non-functional
          # Real values are only injected during fly deploy (deploy job below)
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        run: npm run build

      - name: Verify WASM file in dist/assets/
        working-directory: ${{ env.WORKING_DIR_FRONTEND }}
        run: |
          WASM_FILES=$(ls dist/assets/*.wasm 2>/dev/null | wc -l)
          if [ "$WASM_FILES" -eq 0 ]; then
            echo "ERROR: No .wasm file found in dist/assets/"
            echo "dist/assets/ contents:"
            ls -la dist/assets/ || echo "(dist/assets/ not found)"
            exit 1
          fi
          echo "WASM files found: $(ls dist/assets/*.wasm)"

      - name: Verify dist/index.html has module script
        working-directory: ${{ env.WORKING_DIR_FRONTEND }}
        run: |
          if ! grep -q 'type="module"' dist/index.html; then
            echo "ERROR: dist/index.html does not contain <script type=\"module\">"
            echo "This indicates build.target is not 'esnext' in vite.config.ts"
            cat dist/index.html
            exit 1
          fi
          echo "dist/index.html contains type=\"module\" - OK"

      - name: Check bundle size budget
        working-directory: ${{ env.WORKING_DIR_FRONTEND }}
        run: |
          # JS bundle: warn if over 500KB gzip
          JS_FILE=$(ls dist/assets/index-*.js 2>/dev/null | head -1)
          if [ -n "$JS_FILE" ]; then
            JS_SIZE=$(gzip -c "$JS_FILE" | wc -c)
            JS_SIZE_KB=$((JS_SIZE / 1024))
            echo "JS bundle (gzip): ${JS_SIZE_KB}KB"
            if [ "$JS_SIZE" -gt 512000 ]; then
              echo "WARNING: JS bundle exceeds 500KB gzip budget (${JS_SIZE_KB}KB)"
              echo "Check for wildcard icon imports or unused supabase modules"
            fi
          fi
          # Total dist size: warn if over 5MB
          TOTAL_SIZE=$(du -sb dist/ | cut -f1)
          TOTAL_MB=$((TOTAL_SIZE / 1024 / 1024))
          echo "Total dist size: ${TOTAL_MB}MB"
          if [ "$TOTAL_SIZE" -gt 5242880 ]; then
            echo "WARNING: Total dist/ exceeds 5MB budget (${TOTAL_MB}MB)"
          fi

      - name: Generate artifact key
        id: artifact-key
        run: echo "key=dist-${{ github.sha }}" >> $GITHUB_OUTPUT

      - name: Upload dist artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist-${{ github.sha }}
          path: apps/retirement-pay/frontend/dist/
          retention-days: 1

  # ─────────────────────────────────────────────────────
  # Job 6: Playwright E2E against production build
  # ─────────────────────────────────────────────────────
  playwright:
    name: Playwright E2E (Production Build)
    runs-on: ubuntu-latest
    needs: [build]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: apps/retirement-pay/frontend/package-lock.json

      - name: Install frontend dependencies (including Playwright)
        working-directory: ${{ env.WORKING_DIR_FRONTEND }}
        run: npm ci

      - name: Install Playwright browsers
        working-directory: ${{ env.WORKING_DIR_FRONTEND }}
        run: npx playwright install --with-deps chromium

      - name: Download dist artifact
        uses: actions/download-artifact@v4
        with:
          name: dist-${{ github.sha }}
          path: apps/retirement-pay/frontend/dist/

      - name: Run Playwright E2E against production build
        working-directory: ${{ env.WORKING_DIR_FRONTEND }}
        env:
          PROD: "1"
          # Supabase credentials for auth-dependent E2E tests
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          # Test user credentials (separate Supabase test account)
          E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
          E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}
        run: npx playwright test

      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ github.sha }}
          path: apps/retirement-pay/frontend/playwright-report/
          retention-days: 7

      - name: Upload Playwright traces (on failure)
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-traces-${{ github.sha }}
          path: apps/retirement-pay/frontend/test-results/
          retention-days: 7

  # ─────────────────────────────────────────────────────
  # Job 7: Deploy to Fly.io (main branch only)
  # ─────────────────────────────────────────────────────
  deploy:
    name: Deploy to Fly.io
    runs-on: ubuntu-latest
    needs: [playwright]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: production
      url: https://retirement-pay-ph.fly.dev
    steps:
      - uses: actions/checkout@v4

      - name: Install flyctl
        uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy to Fly.io
        working-directory: apps/retirement-pay
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
        run: |
          flyctl deploy \
            --app retirement-pay-ph \
            --build-arg VITE_SUPABASE_URL="${{ secrets.VITE_SUPABASE_URL }}" \
            --build-arg VITE_SUPABASE_ANON_KEY="${{ secrets.VITE_SUPABASE_ANON_KEY }}" \
            --remote-only \
            --wait-timeout 300

      - name: Verify deployment health
        run: |
          echo "Waiting 15s for deployment to stabilize..."
          sleep 15
          # Hit the health check endpoint
          HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://retirement-pay-ph.fly.dev/_health)
          if [ "$HTTP_STATUS" != "200" ]; then
            echo "ERROR: Health check failed — HTTP $HTTP_STATUS"
            exit 1
          fi
          echo "Health check passed — HTTP $HTTP_STATUS"

      - name: Verify WASM loads in production
        run: |
          # Check that the app HTML loads (landing page)
          HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://retirement-pay-ph.fly.dev/)
          if [ "$HTTP_STATUS" != "200" ]; then
            echo "ERROR: Landing page returned HTTP $HTTP_STATUS"
            exit 1
          fi
          echo "Landing page OK — HTTP $HTTP_STATUS"
```

---

## 2. Required GitHub Repository Secrets

Configure these in: Repository Settings > Secrets and Variables > Actions > Repository Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|-----------|
| `FLY_API_TOKEN` | Fly.io deploy token | `fly tokens create deploy --app retirement-pay-ph` |
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Settings > API > Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | Supabase Dashboard > Settings > API > anon public key |
| `E2E_TEST_EMAIL` | Email for Playwright auth tests | Create a dedicated test account in Supabase Auth |
| `E2E_TEST_PASSWORD` | Password for Playwright auth tests | Set when creating test account |

**Important:** `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are used in two places:
1. **Build job** — injected as `ENV` vars so Vite embeds them at build time (for the test build)
2. **Deploy job** — passed as `--build-arg` to `flyctl deploy` so the production Docker build embeds them

The dist artifact uploaded in the `build` job contains the real Supabase values (since secrets
are available in CI). This artifact is downloaded by the `playwright` job and served locally.
The Playwright tests make real Supabase API calls using the embedded credentials.

---

## 3. Playwright Configuration for CI

```typescript
// apps/retirement-pay/frontend/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

const isProd = process.env.PROD === '1';
const baseURL = isProd ? 'http://localhost:3000' : 'http://localhost:5173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,          // Tests share Supabase state; run sequentially
  forbidOnly: !!process.env.CI,  // Fail if test.only is left in code
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,  // Single worker in CI to avoid auth conflicts
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',  // Save traces for failed tests
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Firefox and WebKit are optional for MVP; add when all Chromium tests pass
  ],
  webServer: isProd
    ? {
        command: 'npx serve dist --single --port 3000 --no-clipboard',
        url: 'http://localhost:3000',
        reuseExistingServer: false,
        stdout: 'ignore',
        stderr: 'pipe',
      }
    : {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
      },
});
```

**Key decisions:**
- `fullyParallel: false` + `workers: 1` — Playwright auth tests create/delete rows in shared
  Supabase test project. Parallel runs would create race conditions.
- `retries: 1` in CI — One retry for flaky Supabase network calls; fail definitively on second failure.
- `trace: 'retain-on-failure'` — Playwright traces enable exact reproduction of CI failures locally.

---

## 4. E2E Test Environment Setup File

```typescript
// apps/retirement-pay/frontend/e2e/helpers/auth.ts
import { Page } from '@playwright/test';

// Read from environment variables (set by CI from GitHub secrets)
export const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'test@retirement-pay-e2e.example';
export const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'TestPassword123!';

export async function signIn(page: Page): Promise<void> {
  await page.goto('/auth');
  await page.getByLabel('Email address').fill(TEST_EMAIL);
  await page.getByLabel('Password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard');
}

export async function signOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('/');
}
```

The test account must be pre-created in the Supabase test project with email confirmation already
confirmed. This is done once manually:
```
1. Open https://supabase.com/dashboard > project > Authentication > Users
2. Click "Invite user"
3. Enter E2E_TEST_EMAIL, set password E2E_TEST_PASSWORD
4. Confirm the email in Supabase Dashboard (Auto-confirm)
```

---

## 5. Workflow File for Database Migrations (Separate Workflow)

Migrations run separately from the main pipeline, triggered manually or on changes to migration files.

**Path:** `.github/workflows/retirement-pay-migrations.yml`

```yaml
name: retirement-pay-migrations

on:
  workflow_dispatch:       # Manual trigger from GitHub Actions UI
    inputs:
      environment:
        description: 'Target environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production
  push:
    branches: [main]
    paths:
      - 'apps/retirement-pay/supabase/migrations/**'

jobs:
  migrate:
    name: Apply Supabase Migrations
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Apply migrations
        working-directory: apps/retirement-pay
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
          supabase db push

      - name: Verify migrations (smoke test RPCs)
        working-directory: apps/retirement-pay
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        run: |
          # Test get_shared_computation RPC with a known non-existent UUID
          # Should return empty array (not error, not null)
          RESULT=$(curl -s -X POST \
            "${SUPABASE_URL}/rest/v1/rpc/get_shared_computation" \
            -H "apikey: ${SUPABASE_ANON_KEY}" \
            -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
            -H "Content-Type: application/json" \
            -d '{"share_token": "00000000-0000-0000-0000-000000000000"}')
          echo "get_shared_computation result: $RESULT"
          # Expected: [] or {} — anything but an error object
          if echo "$RESULT" | grep -q '"code":'; then
            echo "ERROR: RPC returned an error"
            echo "$RESULT"
            exit 1
          fi
          echo "RPC smoke test passed"
```

**Additional secrets for migration workflow:**

| Secret Name | Description |
|-------------|-------------|
| `SUPABASE_ACCESS_TOKEN` | Personal access token from supabase.com/dashboard/account/tokens |
| `SUPABASE_PROJECT_REF` | Project reference (e.g., `abcdefghijklmnop`) from project URL |

---

## 6. Branch Protection Rules

Configure in: Repository Settings > Branches > Add rule for `main`

```
Branch name pattern: main

Required status checks before merging:
  - TypeScript Typecheck
  - ESLint
  - Rust Engine Tests
  - Vitest (Unit + Integration)
  - Production Build
  - Playwright E2E (Production Build)

Require branches to be up to date before merging: YES
Require linear history: YES (squash merge or rebase)
Restrict who can push to matching branches: (set to team maintainers)
Do not allow bypassing the above settings: YES
```

---

## 7. Caching Strategy

### Rust + Cargo cache
```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.cargo/registry
      ~/.cargo/git
      apps/retirement-pay/engine/target
    key: rust-${{ env.RUST_VERSION }}-${{ hashFiles('apps/retirement-pay/engine/Cargo.lock') }}
    restore-keys: rust-${{ env.RUST_VERSION }}-
```
Cache key includes `Cargo.lock` hash — invalidated only when dependencies change.
Saves ~5-8 minutes on builds where only frontend code changed.

### npm cache
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: "22"
    cache: 'npm'
    cache-dependency-path: apps/retirement-pay/frontend/package-lock.json
```
`actions/setup-node` handles npm cache automatically when `cache: 'npm'` and `cache-dependency-path` are set.

### wasm-pack binary cache
wasm-pack is installed via `curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh`.
This installs to `~/.cargo/bin/wasm-pack`. Since `~/.cargo` is in the Rust cache above,
wasm-pack is cached with the rest of the Cargo toolchain.

---

## 8. Pipeline Duration Estimates

| Job | Duration (cold) | Duration (cached) |
|-----|----------------|-------------------|
| typecheck | 2 min | 1 min |
| lint | 2 min | 1 min |
| rust-test | 8 min | 3 min |
| vitest | 12 min | 6 min |
| build | 15 min | 8 min |
| playwright | 8 min | 8 min |
| deploy | 5 min | 5 min |

Total time to deploy (main push): ~20-25 min with parallelism
- typecheck, lint, rust-test run in parallel
- vitest runs after rust-test (depends on WASM output)
- build runs after typecheck + lint + vitest pass
- playwright runs after build
- deploy runs after playwright (main only)

Critical path: rust-test → vitest → build → playwright → deploy

---

## 9. Concurrency and Cancel-In-Progress

```yaml
concurrency:
  group: retirement-pay-${{ github.ref }}
  cancel-in-progress: true
```

This cancels in-progress workflows for the same branch when a new push arrives. Prevents queuing
of stale builds when developers push multiple commits rapidly.

**Exception:** The `deploy` job should NOT be cancelled mid-flight. The `flyctl deploy` command
is atomic — Fly.io only switches traffic after the new deployment passes health checks. A partial
deploy is safe. GitHub's cancel-in-progress does not interrupt running Docker builds on Fly.io's
remote builder; it only prevents the `flyctl deploy` CLI from being invoked.

---

## 10. Local Development Pipeline Equivalents

Developers should be able to run the exact same checks locally before pushing:

```bash
# From: apps/retirement-pay/

# 1. TypeScript typecheck
cd frontend && npm run typecheck

# 2. ESLint
cd frontend && npm run lint

# 3. Rust tests
cd engine && cargo test --all-features

# 4. Build WASM + Vitest
cd engine && wasm-pack build --target web --out-dir ../frontend/src/wasm/pkg
cd frontend && npx vitest run

# 5. Production build
cd frontend && npm run build

# 6. Playwright E2E against production build
cd frontend && PROD=1 npx playwright test

# Or run everything with:
make ci  # (if Makefile is provided — see below)
```

**Optional Makefile at `apps/retirement-pay/Makefile`:**

```makefile
.PHONY: ci typecheck lint rust-test vitest build playwright

ci: typecheck lint rust-test vitest build playwright

typecheck:
	cd frontend && npm run typecheck

lint:
	cd frontend && npm run lint

rust-test:
	cd engine && cargo test --all-features && cargo clippy --all-features -- -D warnings

vitest:
	cd engine && wasm-pack build --target web --out-dir ../frontend/src/wasm/pkg
	cd frontend && npx vitest run

build:
	cd frontend && npm run build

playwright:
	cd frontend && PROD=1 npx playwright test
```

---

## 11. Rollback Procedure (Via CI)

If a deploy introduces a regression, rollback is done manually via `flyctl`:

```bash
# List recent deployments
fly releases list --app retirement-pay-ph

# Roll back to previous release (v3 in this example)
PREV_IMAGE=$(fly releases --app retirement-pay-ph --json | jq -r '.[1].ImageRef')
fly deploy --image "$PREV_IMAGE" --app retirement-pay-ph

# Verify health after rollback
curl https://retirement-pay-ph.fly.dev/_health
```

There is no automated rollback in the CI pipeline. Fly.io's atomic deployment model means
the old version stays live until the new version passes health checks, so a deployment failure
does not cause downtime — the old version continues serving traffic.

---

## Summary

| Item | Value |
|------|-------|
| Workflow file | `.github/workflows/retirement-pay.yml` |
| Trigger | push/PR to `main` affecting `apps/retirement-pay/**` |
| Required secrets | `FLY_API_TOKEN`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `E2E_TEST_EMAIL`, `E2E_TEST_PASSWORD` |
| Migration secrets | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` |
| Job parallelism | typecheck + lint + rust-test in parallel; vitest after rust-test; build after all three; playwright after build; deploy after playwright |
| WASM verification | Explicit `ls dist/assets/*.wasm` check in build job — fail fast if missing |
| E2E target | Production build (`PROD=1`), served by `npx serve dist --single` on port 3000 |
| Deploy gate | All jobs pass + `github.ref == 'refs/heads/main'` + `github.event_name == 'push'` |
| Deploy method | `flyctl deploy --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_ANON_KEY=... --remote-only` |
| Health check after deploy | `curl https://retirement-pay-ph.fly.dev/_health` must return 200 |
| Cancel-in-progress | Enabled — cancels stale builds on same branch |
| Rust cache key | `Cargo.lock` hash (invalidated only on dependency changes) |
| npm cache | Automatic via `actions/setup-node@v4` |
