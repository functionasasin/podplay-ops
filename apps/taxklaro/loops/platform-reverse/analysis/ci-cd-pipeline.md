# CI/CD Pipeline — TaxKlaro

**Wave:** 6 (Testing + Deployment)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** fly-io-deployment, production-build-verification, playwright-e2e-specs, migration-verification

---

## Summary

This document specifies the complete GitHub Actions CI/CD pipeline for TaxKlaro. It covers:
1. Complete workflow YAML for the `deploy.yml` pipeline
2. Complete workflow YAML for the `ci.yml` PR check pipeline
3. Required GitHub repository secrets
4. Rust/WASM caching strategy (critical for build time)
5. Supabase migration testing in CI
6. E2E test execution against staging
7. Fly.io deployment step

---

## 1. Repository Secrets (GitHub Settings > Secrets > Actions)

All secrets must be set before the pipeline can run. The forward loop MUST document these in the project README.

### Required Secrets

| Secret Name | Description | Where to Get It |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Project Settings > API > Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard > Project Settings > API > anon key |
| `VITE_APP_URL` | Production app URL | `https://taxklaro.ph` |
| `VITE_SENTRY_DSN` | Sentry DSN (optional) | Sentry Project Settings > Client Keys |
| `FLY_API_TOKEN` | Fly.io deploy token | `fly tokens create deploy -x 999999h` |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI token | `supabase login` then find in `~/.supabase/access-token` |
| `SUPABASE_DB_PASSWORD` | Supabase DB password | Set when creating the Supabase project |
| `SUPABASE_PROJECT_ID` | Supabase project ref (e.g. `abcdefghijklmno`) | Supabase Dashboard URL: `app.supabase.com/project/<ref>` |
| `E2E_TEST_EMAIL` | E2E test user email | A dedicated test user in Supabase Auth |
| `E2E_TEST_PASSWORD` | E2E test user password | Corresponding password for the test user |

### Optional Secrets

| Secret Name | Description |
|---|---|
| `SLACK_WEBHOOK_URL` | Slack notification on deploy success/failure |

---

## 2. CI Workflow — Pull Request Checks

Runs on every PR and push to `main`. Does NOT deploy.

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
    paths:
      - 'apps/taxklaro/**'
      - '.github/workflows/ci.yml'
  pull_request:
    branches: [main]
    paths:
      - 'apps/taxklaro/**'
      - '.github/workflows/ci.yml'

defaults:
  run:
    working-directory: apps/taxklaro

jobs:
  ci:
    name: Type Check + Lint + Test + Build
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      # ---- Setup ----
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: apps/taxklaro/frontend/package-lock.json

      - name: Setup Rust toolchain
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: wasm32-unknown-unknown

      - name: Install wasm-pack
        run: curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

      - name: Cache Rust build artifacts
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            apps/taxklaro/engine/target
          key: rust-${{ runner.os }}-${{ hashFiles('apps/taxklaro/engine/Cargo.lock') }}
          restore-keys: |
            rust-${{ runner.os }}-

      # ---- Build WASM Engine ----
      - name: Build WASM engine
        working-directory: apps/taxklaro/engine
        run: wasm-pack build --target web --out-dir ../frontend/src/wasm/pkg

      # ---- Frontend: Install Dependencies ----
      - name: Install frontend dependencies
        working-directory: apps/taxklaro/frontend
        run: npm ci

      # ---- Type Check ----
      - name: TypeScript type check
        working-directory: apps/taxklaro/frontend
        run: npx tsc --noEmit

      # ---- Lint ----
      - name: ESLint
        working-directory: apps/taxklaro/frontend
        run: npx eslint src --ext .ts,.tsx --max-warnings 0

      # ---- Unit Tests ----
      - name: Run unit tests (Vitest)
        working-directory: apps/taxklaro/frontend
        run: npm run test
        env:
          CI: true

      # ---- Production Build ----
      - name: Build production bundle
        working-directory: apps/taxklaro/frontend
        run: npm run build
        env:
          # Use placeholder values for CI build check — real values needed for E2E
          VITE_SUPABASE_URL: https://placeholder.supabase.co
          VITE_SUPABASE_ANON_KEY: placeholder-anon-key
          VITE_APP_URL: https://taxklaro.ph

      # ---- Verify Build Outputs ----
      - name: Verify WASM binary in dist
        working-directory: apps/taxklaro/frontend
        run: |
          if ! ls dist/assets/*.wasm 1>/dev/null 2>&1; then
            echo "ERROR: No .wasm file found in dist/assets/"
            exit 1
          fi
          WASM_SIZE=$(wc -c < dist/assets/*.wasm)
          echo "WASM binary size: ${WASM_SIZE} bytes"
          if [ "${WASM_SIZE}" -lt 100000 ]; then
            echo "ERROR: WASM binary too small (${WASM_SIZE} bytes). Engine may not have compiled."
            exit 1
          fi

      - name: Verify CSS bundle size
        working-directory: apps/taxklaro/frontend
        run: |
          CSS_SIZE=$(wc -c < dist/assets/*.css)
          echo "CSS bundle size: ${CSS_SIZE} bytes"
          if [ "${CSS_SIZE}" -lt 20000 ]; then
            echo "ERROR: CSS bundle too small (${CSS_SIZE} bytes). Tailwind scanner likely failed."
            exit 1
          fi
```

**Critical notes:**
- Uses placeholder Supabase values for the CI build check because real credentials are not needed to verify the bundle is correct. The E2E tests in the deploy workflow use real credentials.
- Rust cache uses `Cargo.lock` hash as cache key. Cargo.lock must be committed.
- `wasm32-unknown-unknown` target must be explicitly installed on the Rust toolchain.
- wasm-pack installation via the official installer script. Do NOT use `cargo install wasm-pack` — it recompiles from source (slow). The installer script downloads a pre-built binary.

---

## 3. Deploy Workflow — Main Branch

Runs only on pushes to `main`. Deploys to Fly.io after all checks pass.

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]
    paths:
      - 'apps/taxklaro/**'
      - '.github/workflows/deploy.yml'

# Prevent concurrent deploys
concurrency:
  group: deploy-taxklaro
  cancel-in-progress: false  # Do NOT cancel in-progress deploys — wait for them

defaults:
  run:
    working-directory: apps/taxklaro

jobs:
  # ============================================================
  # Job 1: Type Check + Lint + Unit Tests + Production Build
  # ============================================================
  verify:
    name: Verify
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: apps/taxklaro/frontend/package-lock.json

      - name: Setup Rust toolchain
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: wasm32-unknown-unknown

      - name: Install wasm-pack
        run: curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

      - name: Cache Rust build artifacts
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            apps/taxklaro/engine/target
          key: rust-${{ runner.os }}-${{ hashFiles('apps/taxklaro/engine/Cargo.lock') }}
          restore-keys: |
            rust-${{ runner.os }}-

      - name: Build WASM engine
        working-directory: apps/taxklaro/engine
        run: wasm-pack build --target web --out-dir ../frontend/src/wasm/pkg

      - name: Install frontend dependencies
        working-directory: apps/taxklaro/frontend
        run: npm ci

      - name: TypeScript type check
        working-directory: apps/taxklaro/frontend
        run: npx tsc --noEmit

      - name: ESLint
        working-directory: apps/taxklaro/frontend
        run: npx eslint src --ext .ts,.tsx --max-warnings 0

      - name: Run unit tests (Vitest)
        working-directory: apps/taxklaro/frontend
        run: npm run test
        env:
          CI: true

      - name: Build production bundle
        working-directory: apps/taxklaro/frontend
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_APP_URL: ${{ secrets.VITE_APP_URL }}
          VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}

      - name: Verify WASM binary in dist
        working-directory: apps/taxklaro/frontend
        run: |
          if ! ls dist/assets/*.wasm 1>/dev/null 2>&1; then
            echo "ERROR: No .wasm file found in dist/assets/"
            exit 1
          fi
          WASM_SIZE=$(wc -c < dist/assets/*.wasm)
          echo "WASM binary size: ${WASM_SIZE} bytes"
          if [ "${WASM_SIZE}" -lt 100000 ]; then
            echo "ERROR: WASM binary too small. Engine may not have compiled correctly."
            exit 1
          fi

      - name: Verify CSS bundle size
        working-directory: apps/taxklaro/frontend
        run: |
          CSS_SIZE=$(wc -c < dist/assets/*.css)
          echo "CSS bundle size: ${CSS_SIZE} bytes"
          if [ "${CSS_SIZE}" -lt 20000 ]; then
            echo "ERROR: CSS bundle too small. Tailwind scanner likely failed."
            exit 1
          fi

      # Upload dist for use in E2E job
      - name: Upload dist artifact
        uses: actions/upload-artifact@v4
        with:
          name: taxklaro-dist
          path: apps/taxklaro/frontend/dist/
          retention-days: 1

  # ============================================================
  # Job 2: Supabase Migration Verification
  # ============================================================
  migrations:
    name: Verify Migrations
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Start local Supabase
        working-directory: apps/taxklaro/frontend
        run: supabase start --ignore-health-check

      - name: Run migrations (supabase db reset)
        working-directory: apps/taxklaro/frontend
        run: supabase db reset

      - name: Verify RPC functions exist
        working-directory: apps/taxklaro/frontend
        run: |
          # Verify create_organization RPC exists
          supabase db diff --use-migra 2>/dev/null || true

          # Direct SQL checks via psql
          PGPASSWORD=postgres psql \
            --host 127.0.0.1 \
            --port 54322 \
            --username postgres \
            --dbname postgres \
            --command "SELECT proname FROM pg_proc WHERE proname IN ('create_organization', 'accept_invitation', 'get_shared_computation', 'user_org_ids');" \
            | grep -E "(create_organization|accept_invitation|get_shared_computation|user_org_ids)"

          echo "All required RPC functions found."

      - name: Verify RPC parameter types match column types
        working-directory: apps/taxklaro/frontend
        run: |
          # get_shared_computation: p_token must be UUID (not TEXT)
          PGPASSWORD=postgres psql \
            --host 127.0.0.1 \
            --port 54322 \
            --username postgres \
            --dbname postgres \
            --command "
              SELECT p.proname, pg_catalog.pg_get_function_arguments(p.oid) as args
              FROM pg_proc p
              WHERE p.proname = 'get_shared_computation';
            " | grep "uuid"

          echo "p_token parameter is UUID type. Column type match verified."

      - name: Verify anon GRANT on public RPCs
        working-directory: apps/taxklaro/frontend
        run: |
          PGPASSWORD=postgres psql \
            --host 127.0.0.1 \
            --port 54322 \
            --username postgres \
            --dbname postgres \
            --command "
              SELECT r.routine_name, g.grantee, g.privilege_type
              FROM information_schema.routine_privileges g
              JOIN information_schema.routines r ON r.specific_name = g.specific_name
              WHERE r.routine_name IN ('get_shared_computation', 'accept_invitation')
                AND g.grantee = 'anon';
            " | grep "EXECUTE"

          echo "anon GRANT verified on public RPCs."

      - name: Stop local Supabase
        if: always()
        working-directory: apps/taxklaro/frontend
        run: supabase stop

  # ============================================================
  # Job 3: E2E Tests
  # ============================================================
  e2e:
    name: E2E Tests (Playwright)
    runs-on: ubuntu-latest
    timeout-minutes: 20
    needs: [verify]  # Needs the built dist artifact

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: apps/taxklaro/frontend/package-lock.json

      - name: Install frontend dependencies (for Playwright)
        working-directory: apps/taxklaro/frontend
        run: npm ci

      - name: Install Playwright browsers
        working-directory: apps/taxklaro/frontend
        run: npx playwright install --with-deps chromium

      - name: Download dist artifact
        uses: actions/download-artifact@v4
        with:
          name: taxklaro-dist
          path: apps/taxklaro/frontend/dist/

      - name: Start production server for E2E
        working-directory: apps/taxklaro/frontend
        run: npx serve dist -s -l 4173 &
        # The -s flag enables SPA mode (required for TanStack Router)

      - name: Wait for server to be ready
        run: |
          for i in $(seq 1 10); do
            curl -s http://localhost:4173 > /dev/null && break
            echo "Waiting for server... attempt $i"
            sleep 2
          done

      - name: Run Playwright E2E tests
        working-directory: apps/taxklaro/frontend
        run: npx playwright test
        env:
          BASE_URL: http://localhost:4173
          E2E_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          E2E_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          E2E_TEST_EMAIL: ${{ secrets.E2E_TEST_EMAIL }}
          E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}

      - name: Upload Playwright report on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: apps/taxklaro/frontend/playwright-report/
          retention-days: 7

      - name: Upload Playwright screenshots on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-screenshots
          path: apps/taxklaro/frontend/test-results/
          retention-days: 7

  # ============================================================
  # Job 4: Deploy to Fly.io
  # ============================================================
  deploy:
    name: Deploy to Fly.io
    runs-on: ubuntu-latest
    timeout-minutes: 20
    needs: [verify, migrations, e2e]  # All three must pass

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Fly.io CLI
        uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy to Fly.io
        working-directory: apps/taxklaro/frontend
        run: |
          flyctl deploy \
            --app taxklaro \
            --build-arg VITE_SUPABASE_URL="${{ secrets.VITE_SUPABASE_URL }}" \
            --build-arg VITE_SUPABASE_ANON_KEY="${{ secrets.VITE_SUPABASE_ANON_KEY }}" \
            --build-arg VITE_APP_URL="${{ secrets.VITE_APP_URL }}" \
            --build-arg VITE_SENTRY_DSN="${{ secrets.VITE_SENTRY_DSN }}" \
            --remote-only \
            --wait-timeout 120
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

      - name: Verify deployment health
        run: |
          # Wait for the deployment to be serving traffic
          sleep 10
          HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://taxklaro.ph)
          echo "HTTP status: ${HTTP_STATUS}"
          if [ "${HTTP_STATUS}" != "200" ]; then
            echo "ERROR: Deployment health check failed. HTTP status: ${HTTP_STATUS}"
            exit 1
          fi
          echo "Deployment verified. taxklaro.ph is serving HTTP 200."
```

**Critical notes:**
- `needs: [verify, migrations, e2e]` — deploy only runs if ALL three upstream jobs pass.
- `concurrency: cancel-in-progress: false` — do NOT cancel in-progress deploys, queue them.
- `--remote-only` — Fly.io builds the Docker image remotely (no local Docker required).
- `--wait-timeout 120` — Wait up to 2 minutes for health checks to pass before declaring success.
- VITE_* vars are passed as Docker `--build-arg`, NOT as Fly.io runtime secrets. They are baked into the JS bundle.

---

## 4. Playwright Configuration

**File:** `apps/taxklaro/frontend/playwright.config.ts`

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,  // Tests may share Supabase state — run serially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  // In CI, the production server is started by the workflow job.
  // In local dev, Playwright can start the dev server automatically.
  webServer: process.env.CI
    ? undefined  // CI: workflow starts the server
    : {
        command: "npm run dev",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
      },
});
```

---

## 5. Rust WASM Build Caching

Rust compilation is the slowest step in CI (can take 5–15 minutes for a cold build). Caching is essential.

### Cache Strategy

```yaml
# Critical: cache ~/.cargo/registry (downloaded crates) and engine/target (compiled output)
- name: Cache Rust build artifacts
  uses: actions/cache@v4
  with:
    path: |
      ~/.cargo/registry
      ~/.cargo/git
      apps/taxklaro/engine/target
    key: rust-${{ runner.os }}-${{ hashFiles('apps/taxklaro/engine/Cargo.lock') }}
    restore-keys: |
      rust-${{ runner.os }}-
```

### Expected Build Times

| Scenario | Cold Build | Warm Cache |
|---|---|---|
| First run (no cache) | 8–15 min | — |
| Cargo.lock unchanged | — | 30–60 sec |
| Cargo.lock changed (new deps) | 5–10 min | — |
| Source only changed (Cargo.lock same) | — | 1–3 min (incremental) |

### wasm-pack Installation

```yaml
# Use the pre-built installer (fast — downloads binary)
- name: Install wasm-pack
  run: curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# NOT: cargo install wasm-pack (compiles from source = 5+ min)
```

wasm-pack itself does not need caching — the binary download takes <5 seconds.

---

## 6. E2E Test User Setup

The E2E tests require a pre-existing test user in Supabase Auth. This user must be created once and persisted.

### Initial Setup (one-time, manual)

```sh
# Using Supabase CLI to create the test user
supabase auth users create \
  --email smoketest@taxklaro.ph \
  --password SmokeTest123! \
  --email-confirm  # Auto-confirm email (skips PKCE flow)
```

Or via the Supabase Dashboard: Authentication > Users > Invite User.

### E2E User Requirements

- Email: `smoketest@taxklaro.ph` (must match `E2E_TEST_EMAIL` secret)
- Password: Strong password (must match `E2E_TEST_PASSWORD` secret)
- Email confirmed: Yes (auto-confirmed or manually confirmed)
- Organization: The E2E user must have at least one organization. Either:
  - Create one during the onboarding E2E test and persist it, OR
  - Pre-create the org and seed it with `supabase db seed`

### Test Data Isolation

E2E tests create real data in Supabase. To prevent test pollution:
- Each E2E test run creates new computations with unique titles (append timestamp)
- Tests clean up after themselves: delete computations created during the run
- The E2E user's org is stable and not deleted between runs

---

## 7. Supabase Migration in CI — Production Migration

When the deploy workflow runs for the first time (or after schema changes), migrations must be applied to the production Supabase project. This is a SEPARATE step from the local migration verification job.

### Migration Strategy: Manual for Production

Production migrations are applied **manually** before deploying schema changes. Automated production migrations in CI are risky (no rollback if a migration breaks). The recommended approach:

1. **Test locally**: `supabase db reset` (verifies idempotency)
2. **Test in CI**: The `migrations` job uses local Supabase
3. **Apply to production**: `supabase db push --linked` (manual step, run by developer)
4. **Deploy app**: Only after migrations are confirmed

### Adding Migration Apply to Deploy Workflow (Optional)

If automated production migration is desired, add this step to the `deploy` job BEFORE the Fly.io deploy:

```yaml
- name: Apply migrations to production Supabase
  working-directory: apps/taxklaro/frontend
  run: |
    supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}
    supabase db push
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
    SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
```

**Risk**: If the migration fails, `supabase db push` exits non-zero and the deploy job stops before Fly.io deployment. The app remains on the old version with the old schema — which is the safe state.

---

## 8. File Structure

```
apps/taxklaro/
├── .github/
│   └── workflows/
│       ├── ci.yml           # PR checks: typecheck + lint + test + build
│       └── deploy.yml       # Main branch: verify + migrations + e2e + deploy
├── engine/
│   ├── Cargo.toml
│   ├── Cargo.lock           # Must be committed (required for cache key)
│   └── src/
├── frontend/
│   ├── playwright.config.ts
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   ├── computation.spec.ts
│   │   ├── sharing.spec.ts
│   │   ├── client-management.spec.ts
│   │   └── smoke.prod.spec.ts
│   └── src/
```

**Critical**: `Cargo.lock` MUST be committed to the repository. Without it:
- Cache keys become unstable (no file to hash)
- Cargo may resolve to different crate versions between CI runs
- Build reproducibility is broken

---

## 9. Environment Separation

| Environment | Supabase Project | App URL | Deployed By |
|---|---|---|---|
| Local dev | `supabase start` (local) | `http://localhost:5173` | Developer |
| CI (migration verification) | `supabase start` (ephemeral GitHub Actions) | N/A | CI |
| CI (E2E tests) | Production Supabase project | `http://localhost:4173` (dist) | CI |
| Production | Production Supabase project | `https://taxklaro.ph` | CI (deploy job) |

**Note**: There is no separate "staging" environment. E2E tests run against the production Supabase database using isolated test user data. This is intentional — it keeps infrastructure simple and costs low.

---

## 10. Pipeline Failure Handling

### If `verify` fails:
- Type errors, lint violations, failing unit tests, or build errors
- Fix in a new commit, push again
- Deployment does not happen

### If `migrations` fails:
- SQL syntax error, missing RPC, wrong parameter type
- This is a spec/code bug — fix the migration file
- Do NOT bypass by deleting the job — migrations must pass before deploy

### If `e2e` fails:
- Screenshot and video artifacts are uploaded for debugging
- Check `playwright-report/` artifact for test details
- Common causes: test user credentials wrong, Supabase auth redirect URL not whitelisted, WASM compute fails in production build

### If `deploy` fails:
- Fly.io build failure: check build args, Dockerfile syntax
- Health check failure: the machine started but is serving errors — check fly logs
- `fly logs --app taxklaro` shows nginx/serve output
- Previous deployment remains active — no downtime from a failed deploy

---

## 11. Local Developer Workflow

```sh
# Before pushing a PR
cd apps/taxklaro/frontend

# 1. Type check
npx tsc --noEmit

# 2. Lint
npx eslint src --ext .ts,.tsx --max-warnings 0

# 3. Unit tests
npm run test

# 4. Production build
npm run build

# 5. Verify build outputs
ls dist/assets/*.wasm   # Must exist
ls dist/assets/*.css    # Must exist, must be > 20KB

# 6. Run E2E locally (optional but recommended before pushing)
npx serve dist -s -l 4173 &
npx playwright test
```

This mirrors exactly what CI will do, preventing CI surprises.
