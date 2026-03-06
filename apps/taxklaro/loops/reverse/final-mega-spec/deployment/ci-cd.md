# CI/CD Pipeline — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- Infrastructure: [deployment/infrastructure.md](infrastructure.md)
- Environment variables: [deployment/environment.md](environment.md)
- Monitoring and alerts: [deployment/monitoring.md](monitoring.md)
- Database schema: [database/schema.md](../database/schema.md)

---

## Table of Contents

1. [Repository Structure](#1-repository-structure)
2. [Package Scripts Reference](#2-package-scripts-reference)
3. [Workflow: CI — Lint, Type Check, Test, Build](#3-workflow-ci--lint-type-check-test-build)
4. [Workflow: Deploy Staging](#4-workflow-deploy-staging)
5. [Workflow: Deploy Production](#5-workflow-deploy-production)
6. [Workflow: Nightly Tests](#6-workflow-nightly-tests)
7. [GitHub Repository Configuration](#7-github-repository-configuration)
8. [GitHub Actions Secrets Reference](#8-github-actions-secrets-reference)
9. [Local Development Setup](#9-local-development-setup)
10. [Database Migration Workflow](#10-database-migration-workflow)
11. [Manual Deployment Commands](#11-manual-deployment-commands)
12. [Rollback Procedures](#12-rollback-procedures)

---

## 1. Repository Structure

All code lives in a single GitHub repository named `taxklaro-ph`. The layout below is the complete directory structure the forward loop must create.

```
taxklaro-ph/
│
├── .github/
│   └── workflows/
│       ├── ci.yml                   # Checks on every push + PR
│       ├── deploy-staging.yml       # Deploys to staging on push to `staging`
│       ├── deploy-production.yml    # Deploys to production on push to `main`
│       └── nightly.yml              # Nightly fuzz + exhaustive test run
│
├── apps/
│   └── frontend/                    # Next.js 15 App Router application
│       ├── package.json             # Frontend-only dependencies
│       ├── package-lock.json
│       ├── tsconfig.json
│       ├── next.config.js           # (see infrastructure.md §3.4)
│       ├── vitest.config.ts
│       ├── playwright.config.ts
│       └── src/
│           ├── app/                 # Next.js App Router pages
│           ├── components/          # React components
│           ├── hooks/               # Custom React hooks
│           ├── lib/                 # Utility functions, API client
│           └── emails/              # React Email templates (frontend copy)
│
├── src/                             # All backend TypeScript source
│   ├── server.ts                    # API server entry point (Express 5)
│   ├── pdf-server.ts                # PDF worker entry point
│   ├── batch-server.ts              # Batch worker entry point
│   │
│   ├── engine/                      # Tax computation engine (packages/engine)
│   │   ├── index.ts                 # Engine public API: computeTax()
│   │   ├── pipeline.ts              # 17-step pipeline implementation
│   │   ├── types.ts                 # All enums, structs, input/output types
│   │   ├── validators.ts            # PL-01 input validation (ERR_* codes)
│   │   ├── classifier.ts            # PL-02 taxpayer classification
│   │   ├── aggregates.ts            # PL-03 gross aggregates
│   │   ├── eligibility.ts           # PL-04 eligibility check
│   │   ├── itemized.ts              # PL-05 itemized deductions
│   │   ├── osd.ts                   # PL-06 OSD computation
│   │   ├── cwt.ts                   # PL-07 CWT aggregation
│   │   ├── paths.ts                 # PL-08/09/10 Path A/B/C computation
│   │   ├── percentage-tax.ts        # PL-11 percentage tax
│   │   ├── quarterly.ts             # PL-12 quarterly payments aggregation
│   │   ├── regime.ts                # PL-13 regime comparison
│   │   ├── balance.ts               # PL-14 balance computation
│   │   ├── forms.ts                 # PL-15 form selection
│   │   ├── penalties.ts             # PL-16 penalty computation
│   │   ├── assembler.ts             # PL-17 result assembly
│   │   ├── lookup-tables/           # All static lookup tables as TS constants
│   │   │   ├── graduated-rate.ts    # TRAIN rate table Schedule 1 & 2
│   │   │   ├── filing-deadlines.ts  # All deadline constants
│   │   │   ├── cwt-rates.ts         # EWT ATC codes and rates
│   │   │   └── penalty-schedule.ts  # Compromise penalty table
│   │   └── __tests__/
│   │       ├── basic.test.ts        # 8 happy-path vectors
│   │       ├── edge-cases.test.ts   # 16 edge-case vectors
│   │       ├── exhaustive.test.ts   # 66+ exhaustive vectors (all 14 groups)
│   │       └── fuzz.test.ts         # 68 fast-check property-based tests
│   │
│   ├── routes/                      # Express route handlers
│   │   ├── auth.routes.ts
│   │   ├── compute.routes.ts
│   │   ├── computations.routes.ts
│   │   ├── exports.routes.ts
│   │   ├── clients.routes.ts
│   │   ├── batch.routes.ts
│   │   ├── api-keys.routes.ts
│   │   ├── billing.routes.ts
│   │   └── health.routes.ts
│   │
│   ├── middleware/                  # Express middleware
│   │   ├── auth.middleware.ts       # Session + API key validation
│   │   ├── rate-limit.middleware.ts # Rate limiting by tier
│   │   ├── tier-gate.middleware.ts  # Subscription feature gating
│   │   └── error.middleware.ts      # Global error handler + Sentry
│   │
│   ├── services/                    # Business logic
│   │   ├── auth.service.ts
│   │   ├── billing.service.ts
│   │   ├── email.service.ts
│   │   ├── pdf.service.ts
│   │   └── batch.service.ts
│   │
│   ├── db/                          # Database access
│   │   ├── schema.ts                # Drizzle ORM schema (matches database/schema.md)
│   │   ├── client.ts                # Drizzle client singleton
│   │   └── queries/                 # Per-table query functions
│   │
│   ├── workers/                     # Bull job handlers
│   │   └── batch-computation.worker.ts
│   │
│   └── __tests__/                   # API integration tests
│       ├── setup.ts                 # Test DB setup/teardown
│       ├── auth.test.ts
│       ├── compute.test.ts
│       ├── computations.test.ts
│       ├── exports.test.ts
│       ├── clients.test.ts
│       ├── batch.test.ts
│       ├── api-keys.test.ts
│       └── billing.test.ts
│
├── migrations/                      # Drizzle migration files (auto-generated)
│   └── 0001_initial_schema.sql      # First migration from database/schema.md DDL
│
├── package.json                     # Backend dependencies
├── package-lock.json
├── tsconfig.json                    # TypeScript config for backend
├── tsconfig.build.json              # Production build config (excludes test files)
├── vitest.config.ts                 # Backend test config
├── drizzle.config.ts                # Drizzle-kit config
│
├── fly.toml                         # API server Fly config (see infrastructure.md §4.2)
├── fly-pdf.toml                     # PDF worker Fly config (see infrastructure.md §6.2)
├── fly-batch.toml                   # Batch worker Fly config (see infrastructure.md §7.3)
│
├── Dockerfile.api                   # (see infrastructure.md §4.3)
├── Dockerfile.pdf                   # (see infrastructure.md §6.3)
├── Dockerfile.batch                 # (see infrastructure.md §7.4)
│
├── .dockerignore                    # Excludes node_modules, .env, test files, apps/
├── .eslintrc.json                   # ESLint config for TypeScript
├── .prettierrc                      # Prettier config
└── .gitignore
```

### 1.1 Fly.toml Build Context Note

Each `fly.toml` references a Dockerfile at the root. The Docker build context is the repository root. The `Dockerfile.api` copies `src/` from this root, which contains the backend source. The `apps/frontend/` directory is excluded from the Docker build context via `.dockerignore`.

`.dockerignore` content:
```
node_modules
apps/
.env
.env.*
*.test.ts
__tests__/
coverage/
.git
.github
*.md
dist/
```

### 1.2 Staging vs Production App Names

| Component | Production Fly App | Staging Fly App |
|-----------|-------------------|----------------|
| API server | `taxklaro-api` | `taxklaro-api-staging` |
| PDF worker | `taxklaro-pdf` | `taxklaro-pdf-staging` |
| Batch worker | `taxklaro-batch` | `taxklaro-batch-staging` |
| Frontend | Vercel `main` branch → `taxklaro.ph` | Vercel `staging` branch → `staging.taxklaro.ph` |
| Database | Supabase project `taxklaro-prod` | Supabase project `taxklaro-staging` |

Staging Fly apps are configured with the same `fly.toml`/`fly-pdf.toml`/`fly-batch.toml` files but deployed with the staging app name flag: `flyctl deploy -a taxklaro-api-staging`.

---

## 2. Package Scripts Reference

### 2.1 Backend `package.json` Scripts

```json
{
  "name": "taxklaro-api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "tsc --project tsconfig.build.json",
    "build:watch": "tsc --project tsconfig.build.json --watch",
    "dev": "tsx watch src/server.ts",
    "dev:pdf": "tsx watch src/pdf-server.ts",
    "dev:batch": "tsx watch src/batch-server.ts",
    "start": "node dist/server.js",
    "start:pdf": "node dist/pdf-server.js",
    "start:batch": "node dist/batch-server.js",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts --max-warnings 0",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write src",
    "format:check": "prettier --check src",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:engine": "vitest run src/engine/__tests__",
    "test:engine:watch": "vitest src/engine/__tests__",
    "test:api": "vitest run src/__tests__",
    "test:api:watch": "vitest src/__tests__",
    "test:fuzz": "vitest run src/engine/__tests__/fuzz.test.ts --pool=forks --reporter=verbose",
    "test:exhaustive": "vitest run src/engine/__tests__/exhaustive.test.ts --reporter=verbose",
    "test:coverage": "vitest run --coverage",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:migrate:production": "cross-env DATABASE_URL=$DATABASE_DIRECT_URL drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "db:push": "drizzle-kit push"
  }
}
```

### 2.2 Frontend `apps/frontend/package.json` Scripts

```json
{
  "name": "taxklaro-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "next lint --max-warnings 0",
    "lint:fix": "next lint --fix",
    "format": "prettier --write src",
    "format:check": "prettier --check src",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 2.3 Backend `tsconfig.build.json`

This excludes test files from the production build:

```json
{
  "extends": "./tsconfig.json",
  "exclude": [
    "node_modules",
    "dist",
    "apps",
    "src/**/__tests__",
    "src/**/*.test.ts",
    "src/**/*.spec.ts"
  ],
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": false,
    "sourceMap": true
  }
}
```

### 2.4 Backend `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/engine/**/*.ts'],
      exclude: ['src/engine/__tests__/**'],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
    testTimeout: 30000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 2.5 Backend `drizzle.config.ts`

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

---

## 3. Workflow: CI — Lint, Type Check, Test, Build

**File:** `.github/workflows/ci.yml`

**Triggers:**
- Push to any branch
- Pull request targeting `main` or `staging`

**Behavior:** Cancel in-flight runs on the same branch (saves CI minutes). Does NOT deploy anywhere.

**Full YAML:**

```yaml
name: CI

on:
  push:
    branches:
      - '**'
    paths-ignore:
      - '**.md'
      - 'docs/**'
      - 'loops/**'
  pull_request:
    branches:
      - main
      - staging

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ─────────────────────────────────────────────
  # Job 1: Backend — Lint and Type Check
  # ─────────────────────────────────────────────
  backend-lint-typecheck:
    name: Backend — Lint & Type Check
    runs-on: ubuntu-22.04
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install backend dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run Prettier check
        run: npm run format:check

      - name: Run TypeScript type check
        run: npm run typecheck

  # ─────────────────────────────────────────────
  # Job 2: Frontend — Lint and Type Check
  # ─────────────────────────────────────────────
  frontend-lint-typecheck:
    name: Frontend — Lint & Type Check
    runs-on: ubuntu-22.04
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: 'apps/frontend/package-lock.json'

      - name: Install frontend dependencies
        working-directory: apps/frontend
        run: npm ci

      - name: Run ESLint (Next.js)
        working-directory: apps/frontend
        run: npm run lint

      - name: Run Prettier check
        working-directory: apps/frontend
        run: npm run format:check

      - name: Run TypeScript type check
        working-directory: apps/frontend
        run: npm run typecheck

  # ─────────────────────────────────────────────
  # Job 3: Engine Unit Tests (tax computation vectors)
  # ─────────────────────────────────────────────
  engine-tests:
    name: Engine — Unit Test Vectors
    runs-on: ubuntu-22.04
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install backend dependencies
        run: npm ci

      - name: Run engine test vectors (basic + edge-cases)
        run: npm run test:engine -- --reporter=verbose
        env:
          NODE_ENV: test

      - name: Upload engine coverage report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: engine-coverage-${{ github.run_id }}
          path: coverage/
          retention-days: 7

  # ─────────────────────────────────────────────
  # Job 4: API Integration Tests
  # ─────────────────────────────────────────────
  api-integration-tests:
    name: API — Integration Tests
    runs-on: ubuntu-22.04
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: ci_test_db_password_2026
          POSTGRES_DB: taxklaro_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    env:
      NODE_ENV: test
      DATABASE_URL: postgres://postgres:ci_test_db_password_2026@localhost:5432/taxklaro_test
      REDIS_URL: redis://localhost:6379
      JWT_SECRET: ci-test-jwt-secret-must-be-at-least-32-chars
      SESSION_SECRET: ci-test-session-secret-at-least-32-chars
      INTERNAL_API_SECRET: ci-test-internal-api-secret
      APPLICATION_SECRET_KEY: ci-test-application-secret-key-32ch
      ARGON2ID_DUMMY_HASH: $argon2id$v=19$m=65536,t=3,p=4$dummyhashforcitesting$dummyhashoutputfortesting123456
      GOOGLE_CLIENT_ID: 000000000000-citest.apps.googleusercontent.com
      GOOGLE_CLIENT_SECRET: ci-test-google-client-secret
      GOOGLE_REDIRECT_URI: http://localhost:3001/v1/auth/oauth/google/callback
      RESEND_API_KEY: re_ci_test_key_not_real
      PAYMONGO_SECRET_KEY: sk_test_ci_dummy_key
      PAYMONGO_WEBHOOK_SECRET: ci_test_paymongo_webhook_secret
      STRIPE_SECRET_KEY: sk_test_ci_dummy_key
      STRIPE_WEBHOOK_SECRET: whsec_ci_test_dummy_stripe_webhook_secret
      SESSION_COOKIE_DOMAIN: localhost
      CORS_ALLOWED_ORIGINS: http://localhost:3000
      EMAIL_FROM_ADDRESS: noreply@mail.taxklaro.ph
      EMAIL_FROM_NAME: TaxKlaro
      R2_ACCOUNT_ID: ci-test-r2-account-id
      R2_ACCESS_KEY_ID: ci-test-r2-access-key
      R2_SECRET_ACCESS_KEY: ci-test-r2-secret-key
      R2_BUCKET_NAME: taxklaro-exports-test
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install backend dependencies
        run: npm ci

      - name: Run database migrations on test DB
        run: npm run db:migrate
        env:
          DATABASE_URL: postgres://postgres:ci_test_db_password_2026@localhost:5432/taxklaro_test

      - name: Run API integration tests
        run: npm run test:api -- --reporter=verbose

  # ─────────────────────────────────────────────
  # Job 5: Frontend Unit Tests
  # ─────────────────────────────────────────────
  frontend-tests:
    name: Frontend — Unit Tests
    runs-on: ubuntu-22.04
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: 'apps/frontend/package-lock.json'

      - name: Install frontend dependencies
        working-directory: apps/frontend
        run: npm ci

      - name: Run frontend tests
        working-directory: apps/frontend
        run: npm run test -- --reporter=verbose
        env:
          NODE_ENV: test

  # ─────────────────────────────────────────────
  # Job 6: Backend Build Check
  # ─────────────────────────────────────────────
  backend-build:
    name: Backend — Build Check
    runs-on: ubuntu-22.04
    needs: [backend-lint-typecheck]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install backend dependencies
        run: npm ci

      - name: Compile TypeScript (production build)
        run: npm run build

      - name: Verify compiled entry points exist
        run: |
          test -f dist/server.js && echo "dist/server.js OK"
          test -f dist/pdf-server.js && echo "dist/pdf-server.js OK"
          test -f dist/batch-server.js && echo "dist/batch-server.js OK"

  # ─────────────────────────────────────────────
  # Job 7: Frontend Build Check
  # ─────────────────────────────────────────────
  frontend-build:
    name: Frontend — Build Check
    runs-on: ubuntu-22.04
    needs: [frontend-lint-typecheck]
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: 'apps/frontend/package-lock.json'

      - name: Install frontend dependencies
        working-directory: apps/frontend
        run: npm ci

      - name: Build Next.js (production)
        working-directory: apps/frontend
        run: npm run build
        env:
          # Build-time variables — real values set in Vercel project settings;
          # these dummy values allow CI build to succeed for compilation check.
          NEXT_PUBLIC_API_URL: https://api.taxklaro.ph/v1
          NEXT_PUBLIC_GOOGLE_CLIENT_ID: 000000000000-citest.apps.googleusercontent.com
          NEXT_PUBLIC_SENTRY_DSN: https://abc123@o0000000.ingest.sentry.io/0
          NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY: pk_test_ci_dummy_key
          # SENTRY_AUTH_TOKEN intentionally not set — source map upload
          # is skipped for build check; only runs in deploy workflows.
          NEXT_PUBLIC_SKIP_SENTRY_SOURCEMAPS: 'true'
```

---

## 4. Workflow: Deploy Staging

**File:** `.github/workflows/deploy-staging.yml`

**Trigger:** Push to the `staging` branch.

**What it does:**
1. Runs all CI checks (same as ci.yml)
2. Runs database migrations against the staging Supabase instance
3. Deploys API server → `taxklaro-api-staging`
4. Deploys PDF worker → `taxklaro-pdf-staging`
5. Deploys batch worker → `taxklaro-batch-staging`
6. Deploys frontend → Vercel `staging` environment (maps to `staging.taxklaro.ph`)
7. Uploads Sentry source maps for staging

**Full YAML:**

```yaml
name: Deploy Staging

on:
  push:
    branches:
      - staging

concurrency:
  group: deploy-staging
  cancel-in-progress: true

jobs:
  # ─────────────────────────────────────────────
  # Run all CI checks first
  # ─────────────────────────────────────────────
  ci-checks:
    name: Run CI Checks
    uses: ./.github/workflows/ci.yml

  # ─────────────────────────────────────────────
  # Database migrations (staging)
  # ─────────────────────────────────────────────
  migrate-staging:
    name: Database — Migrate Staging
    runs-on: ubuntu-22.04
    needs: [ci-checks]
    environment: staging
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install backend dependencies
        run: npm ci

      - name: Run migrations against staging database
        run: npm run db:migrate
        env:
          # Direct connection (not pooler) required for migrations
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_DIRECT_URL }}

  # ─────────────────────────────────────────────
  # Deploy API server (staging)
  # ─────────────────────────────────────────────
  deploy-api-staging:
    name: Deploy API → taxklaro-api-staging
    runs-on: ubuntu-22.04
    needs: [migrate-staging]
    environment: staging
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Fly CLI
        uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy API server to staging
        run: flyctl deploy --remote-only -a taxklaro-api-staging
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  # ─────────────────────────────────────────────
  # Deploy PDF worker (staging)
  # ─────────────────────────────────────────────
  deploy-pdf-staging:
    name: Deploy PDF Worker → taxklaro-pdf-staging
    runs-on: ubuntu-22.04
    needs: [migrate-staging]
    environment: staging
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Fly CLI
        uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy PDF worker to staging
        run: flyctl deploy --config fly-pdf.toml --remote-only -a taxklaro-pdf-staging
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  # ─────────────────────────────────────────────
  # Deploy batch worker (staging)
  # ─────────────────────────────────────────────
  deploy-batch-staging:
    name: Deploy Batch Worker → taxklaro-batch-staging
    runs-on: ubuntu-22.04
    needs: [migrate-staging]
    environment: staging
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Fly CLI
        uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy batch worker to staging
        run: flyctl deploy --config fly-batch.toml --remote-only -a taxklaro-batch-staging
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  # ─────────────────────────────────────────────
  # Deploy frontend to Vercel staging
  # ─────────────────────────────────────────────
  deploy-frontend-staging:
    name: Deploy Frontend → staging.taxklaro.ph
    runs-on: ubuntu-22.04
    needs: [deploy-api-staging]
    environment: staging
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: 'apps/frontend/package-lock.json'

      - name: Install frontend dependencies
        working-directory: apps/frontend
        run: npm ci

      - name: Install Vercel CLI
        run: npm install -g vercel@latest

      - name: Pull Vercel environment variables (staging)
        working-directory: apps/frontend
        run: vercel env pull .env.staging --environment preview --token ${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Build frontend
        working-directory: apps/frontend
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: https://api.staging.taxklaro.ph/v1
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: taxklaro-ph
          SENTRY_PROJECT: taxklaro-ph-frontend

      - name: Deploy to Vercel (preview/staging environment)
        working-directory: apps/frontend
        run: |
          DEPLOY_URL=$(vercel --token ${{ secrets.VERCEL_TOKEN }} \
            --env NEXT_PUBLIC_API_URL=https://api.staging.taxklaro.ph/v1 \
            2>&1 | tail -1)
          echo "Staging deployment URL: $DEPLOY_URL"

          # Alias to staging.taxklaro.ph
          vercel alias $DEPLOY_URL staging.taxklaro.ph --token ${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

  # ─────────────────────────────────────────────
  # Upload Sentry source maps (staging)
  # ─────────────────────────────────────────────
  sentry-sourcemaps-staging:
    name: Upload Sentry Source Maps (Staging)
    runs-on: ubuntu-22.04
    needs: [deploy-api-staging]
    environment: staging
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install backend dependencies
        run: npm ci

      - name: Build backend (to generate source maps)
        run: npm run build

      - name: Upload source maps to Sentry
        run: |
          export SENTRY_RELEASE=$(git rev-parse --short HEAD)
          npx @sentry/cli releases new "$SENTRY_RELEASE"
          npx @sentry/cli releases set-commits "$SENTRY_RELEASE" --auto
          npx @sentry/cli releases files "$SENTRY_RELEASE" upload-sourcemaps ./dist
          npx @sentry/cli releases finalize "$SENTRY_RELEASE"
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: taxklaro-ph
          SENTRY_PROJECT: taxklaro-ph-api
```

---

## 5. Workflow: Deploy Production

**File:** `.github/workflows/deploy-production.yml`

**Trigger:** Push to the `main` branch.

**Branch protection requirement:** `main` branch must have protection rules (see §7). Pushes to `main` only happen via merged pull requests with all status checks passing.

**What it does:**
1. Runs all CI checks
2. Requires manual approval via GitHub Environment protection (configured in GitHub Settings → Environments → production → Required reviewers)
3. Runs database migrations against production Supabase
4. Deploys API, PDF worker, batch worker to production Fly.io apps
5. Deploys frontend to Vercel production (`taxklaro.ph`)
6. Uploads Sentry source maps for production

**Full YAML:**

```yaml
name: Deploy Production

on:
  push:
    branches:
      - main

concurrency:
  group: deploy-production
  cancel-in-progress: false  # Never cancel in-flight production deployments

jobs:
  # ─────────────────────────────────────────────
  # Run all CI checks first
  # ─────────────────────────────────────────────
  ci-checks:
    name: Run CI Checks
    uses: ./.github/workflows/ci.yml

  # ─────────────────────────────────────────────
  # Manual approval gate (GitHub Environment)
  # ─────────────────────────────────────────────
  approval:
    name: Await Production Approval
    runs-on: ubuntu-22.04
    needs: [ci-checks]
    environment: production
    steps:
      - name: Approval gate
        run: echo "Production deployment approved. Proceeding."

  # ─────────────────────────────────────────────
  # Database migrations (production)
  # ─────────────────────────────────────────────
  migrate-production:
    name: Database — Migrate Production
    runs-on: ubuntu-22.04
    needs: [approval]
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install backend dependencies
        run: npm ci

      - name: Run migrations against production database
        run: npm run db:migrate
        env:
          # Direct connection URL (not pooler) required for migrations.
          # Secret name: DATABASE_DIRECT_URL
          DATABASE_URL: ${{ secrets.DATABASE_DIRECT_URL }}

  # ─────────────────────────────────────────────
  # Deploy API server (production)
  # ─────────────────────────────────────────────
  deploy-api:
    name: Deploy API → taxklaro-api
    runs-on: ubuntu-22.04
    needs: [migrate-production]
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Fly CLI
        uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy API server
        run: flyctl deploy --remote-only -a taxklaro-api
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  # ─────────────────────────────────────────────
  # Deploy PDF worker (production)
  # ─────────────────────────────────────────────
  deploy-pdf:
    name: Deploy PDF Worker → taxklaro-pdf
    runs-on: ubuntu-22.04
    needs: [migrate-production]
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Fly CLI
        uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy PDF worker
        run: flyctl deploy --config fly-pdf.toml --remote-only -a taxklaro-pdf
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  # ─────────────────────────────────────────────
  # Deploy batch worker (production)
  # ─────────────────────────────────────────────
  deploy-batch:
    name: Deploy Batch Worker → taxklaro-batch
    runs-on: ubuntu-22.04
    needs: [migrate-production]
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Fly CLI
        uses: superfly/flyctl-actions/setup-flyctl@master

      - name: Deploy batch worker
        run: flyctl deploy --config fly-batch.toml --remote-only -a taxklaro-batch
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  # ─────────────────────────────────────────────
  # Deploy frontend to Vercel production
  # ─────────────────────────────────────────────
  deploy-frontend:
    name: Deploy Frontend → taxklaro.ph
    runs-on: ubuntu-22.04
    needs: [deploy-api]
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: 'apps/frontend/package-lock.json'

      - name: Install frontend dependencies
        working-directory: apps/frontend
        run: npm ci

      - name: Install Vercel CLI
        run: npm install -g vercel@latest

      - name: Build frontend
        working-directory: apps/frontend
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: https://api.taxklaro.ph/v1
          NEXT_PUBLIC_GOOGLE_CLIENT_ID: ${{ secrets.NEXT_PUBLIC_GOOGLE_CLIENT_ID }}
          NEXT_PUBLIC_SENTRY_DSN: ${{ secrets.NEXT_PUBLIC_SENTRY_DSN }}
          NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY: ${{ secrets.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY }}
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: taxklaro-ph
          SENTRY_PROJECT: taxklaro-ph-frontend

      - name: Deploy to Vercel (production)
        working-directory: apps/frontend
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

  # ─────────────────────────────────────────────
  # Upload Sentry source maps (production)
  # ─────────────────────────────────────────────
  sentry-sourcemaps:
    name: Upload Sentry Source Maps (Production)
    runs-on: ubuntu-22.04
    needs: [deploy-api]
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install backend dependencies
        run: npm ci

      - name: Build backend
        run: npm run build

      - name: Upload source maps to Sentry
        run: |
          export SENTRY_RELEASE=$(git rev-parse --short HEAD)
          npx @sentry/cli releases new "$SENTRY_RELEASE"
          npx @sentry/cli releases set-commits "$SENTRY_RELEASE" --auto
          npx @sentry/cli releases files "$SENTRY_RELEASE" upload-sourcemaps ./dist
          npx @sentry/cli releases finalize "$SENTRY_RELEASE"
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: taxklaro-ph
          SENTRY_PROJECT: taxklaro-ph-api

  # ─────────────────────────────────────────────
  # Post-deployment smoke test
  # ─────────────────────────────────────────────
  smoke-test:
    name: Post-Deployment Smoke Test
    runs-on: ubuntu-22.04
    needs: [deploy-api, deploy-frontend]
    environment: production
    steps:
      - name: Wait for Fly.io machines to stabilize
        run: sleep 30

      - name: Health check — API liveness
        run: |
          HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            https://api.taxklaro.ph/v1/health/live)
          if [ "$HTTP_CODE" != "200" ]; then
            echo "API health check FAILED: HTTP $HTTP_CODE"
            exit 1
          fi
          echo "API liveness OK (HTTP 200)"

      - name: Health check — API readiness
        run: |
          HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            https://api.taxklaro.ph/v1/health/ready)
          if [ "$HTTP_CODE" != "200" ]; then
            echo "API readiness check FAILED: HTTP $HTTP_CODE"
            echo "Response body:"
            curl -s https://api.taxklaro.ph/v1/health/ready
            exit 1
          fi
          echo "API readiness OK (HTTP 200)"

      - name: Health check — Frontend
        run: |
          HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://taxklaro.ph)
          if [ "$HTTP_CODE" != "200" ]; then
            echo "Frontend health check FAILED: HTTP $HTTP_CODE"
            exit 1
          fi
          echo "Frontend OK (HTTP 200)"

      - name: Compute smoke test — POST /v1/compute (unauthenticated basic)
        run: |
          RESPONSE=$(curl -s -X POST https://api.taxklaro.ph/v1/compute \
            -H "Content-Type: application/json" \
            -d '{
              "taxpayer_type": "PURELY_SE",
              "taxpayer_class": "SERVICE",
              "filing_period": "ANNUAL",
              "tax_year": 2025,
              "gross_receipts": 700000,
              "non_operating_income": 0,
              "has_compensation_income": false,
              "compensation_income": 0,
              "deduction_method": "OPTIMAL",
              "regime_election": "OPTIMAL",
              "itemized_expenses": null,
              "form_2307_entries": [],
              "quarterly_payments": [],
              "depreciation_entries": [],
              "nolco_entries": [],
              "is_vat_registered": false,
              "registration_date": null,
              "prior_year_carry_over": 0
            }')
          RECOMMENDED=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['regime_comparison']['recommended_path'])")
          if [ "$RECOMMENDED" != "PATH_C" ]; then
            echo "Smoke test FAILED: expected PATH_C, got $RECOMMENDED"
            echo "Full response: $RESPONSE"
            exit 1
          fi
          echo "Compute smoke test PASSED: PATH_C recommended as expected"
```

---

## 6. Workflow: Nightly Tests

**File:** `.github/workflows/nightly.yml`

**Trigger:** Schedule — every day at 02:00 PHT (18:00 UTC previous day).

**What it does:**
1. Runs the full exhaustive test suite (all 80 scenario vectors across 14 groups)
2. Runs the fuzz/property-based tests (10,000 iterations per property, 68 properties)
3. Runs Playwright E2E tests against the staging environment
4. Reports failures to Sentry and sends an email to `ops@taxklaro.ph` if any tests fail

**Full YAML:**

```yaml
name: Nightly Tests

on:
  schedule:
    # 18:00 UTC = 02:00 PHT (+08:00) every day
    - cron: '0 18 * * *'
  workflow_dispatch:
    # Allow manual trigger from GitHub Actions UI

jobs:
  # ─────────────────────────────────────────────
  # Exhaustive engine test vectors (all 80 scenario codes)
  # ─────────────────────────────────────────────
  exhaustive-engine-tests:
    name: Engine — Exhaustive Test Vectors (80 scenarios)
    runs-on: ubuntu-22.04
    timeout-minutes: 30
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install backend dependencies
        run: npm ci

      - name: Run exhaustive test vectors (all 14 groups)
        run: npm run test:exhaustive
        env:
          NODE_ENV: test

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: exhaustive-test-results-${{ github.run_id }}
          path: test-results/
          retention-days: 30

  # ─────────────────────────────────────────────
  # Fuzz / property-based tests (68 properties × 10,000 iterations)
  # ─────────────────────────────────────────────
  fuzz-tests:
    name: Engine — Fuzz Tests (68 properties × 10,000 iterations)
    runs-on: ubuntu-22.04
    timeout-minutes: 60
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install backend dependencies
        run: npm ci

      - name: Run fuzz/property-based tests
        run: npm run test:fuzz
        env:
          NODE_ENV: test
          # Seed for reproducible runs; change to 0 to use random seed
          FAST_CHECK_SEED: '20260302'
          FAST_CHECK_NUM_RUNS: '10000'

      - name: Upload fuzz corpus on failure
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: fuzz-failure-corpus-${{ github.run_id }}
          path: .fast-check-corpus/
          retention-days: 30

  # ─────────────────────────────────────────────
  # Playwright E2E tests (against staging)
  # ─────────────────────────────────────────────
  e2e-tests:
    name: E2E — Playwright Tests (staging.taxklaro.ph)
    runs-on: ubuntu-22.04
    timeout-minutes: 30
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: 'apps/frontend/package-lock.json'

      - name: Install frontend dependencies
        working-directory: apps/frontend
        run: npm ci

      - name: Install Playwright browsers
        working-directory: apps/frontend
        run: npx playwright install --with-deps chromium

      - name: Run Playwright E2E tests
        working-directory: apps/frontend
        run: npm run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: https://staging.taxklaro.ph
          E2E_TEST_USER_EMAIL: e2e-test@taxklaro.ph
          E2E_TEST_USER_PASSWORD: ${{ secrets.E2E_TEST_USER_PASSWORD }}
          E2E_PRO_USER_EMAIL: e2e-pro@taxklaro.ph
          E2E_PRO_USER_PASSWORD: ${{ secrets.E2E_PRO_USER_PASSWORD }}

      - name: Upload Playwright test report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-${{ github.run_id }}
          path: apps/frontend/playwright-report/
          retention-days: 30

  # ─────────────────────────────────────────────
  # Notify on failure
  # ─────────────────────────────────────────────
  notify-failure:
    name: Notify on Failure
    runs-on: ubuntu-22.04
    needs: [exhaustive-engine-tests, fuzz-tests, e2e-tests]
    if: failure()
    steps:
      - name: Send failure notification email
        run: |
          curl -s -X POST https://api.resend.com/emails \
            -H "Authorization: Bearer ${{ secrets.RESEND_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{
              "from": "noreply@mail.taxklaro.ph",
              "to": ["ops@taxklaro.ph"],
              "subject": "ALERT: Nightly tests failed — TaxKlaro",
              "html": "<p>One or more nightly tests failed.</p><p>Run ID: ${{ github.run_id }}</p><p>View details at: https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}</p>"
            }'
```

---

## 7. GitHub Repository Configuration

### 7.1 Branch Protection Rules

Configure in: **Repository Settings → Branches → Add rule**

#### Rule for `main`:

| Setting | Value |
|---------|-------|
| Branch name pattern | `main` |
| Require a pull request before merging | Enabled |
| Required approving reviews | 1 |
| Dismiss stale reviews when new commits are pushed | Enabled |
| Require status checks to pass before merging | Enabled |
| Required status checks | `Backend — Lint & Type Check`, `Frontend — Lint & Type Check`, `Engine — Unit Test Vectors`, `API — Integration Tests`, `Frontend — Unit Tests`, `Backend — Build Check`, `Frontend — Build Check` |
| Require branches to be up to date before merging | Enabled |
| Require conversation resolution before merging | Enabled |
| Restrict who can push to matching branches | Enabled — only admins and automated deploy user |
| Do not allow bypassing the above settings | Enabled |

#### Rule for `staging`:

| Setting | Value |
|---------|-------|
| Branch name pattern | `staging` |
| Require status checks to pass before merging | Enabled |
| Required status checks | `Backend — Lint & Type Check`, `Frontend — Lint & Type Check`, `Engine — Unit Test Vectors`, `API — Integration Tests`, `Backend — Build Check` |
| Require branches to be up to date before merging | Enabled |

### 7.2 GitHub Environments

Configure in: **Repository Settings → Environments**

#### Environment: `production`

| Setting | Value |
|---------|-------|
| Required reviewers | 1 reviewer from the `@taxklaro-ph/deployers` team |
| Wait timer | 0 minutes |
| Deployment branches | Selected branches: `main` only |
| Environment secrets | (all production secrets — see §8) |

#### Environment: `staging`

| Setting | Value |
|---------|-------|
| Required reviewers | None (auto-approve) |
| Deployment branches | Selected branches: `staging` only |
| Environment secrets | (all staging secrets — see §8) |

### 7.3 Vercel GitHub Integration Settings

In Vercel project settings → Git:
- **Connect repository:** `github.com/taxklaro-ph/taxklaro-ph`
- **Production branch:** `main`
- **Auto-deploy on push to `main`:** **DISABLED** — production deploys are controlled by `deploy-production.yml`
- **Auto-deploy on push to other branches:** **ENABLED** for PR preview deployments only
- **Root directory:** `apps/frontend`

With auto-deploy disabled for `main`, Vercel's GitHub integration creates PR preview deployments but does NOT auto-deploy production pushes. The `deploy-production.yml` workflow drives the production Vercel deployment explicitly via `vercel --prod`.

---

## 8. GitHub Actions Secrets Reference

Configure in: **Repository Settings → Secrets and variables → Actions → Secrets**

Secrets that differ between staging and production are stored as **Environment Secrets** (under the `production` or `staging` environment). Secrets shared across all deployments are stored as **Repository Secrets**.

### 8.1 Repository Secrets (shared, non-environment-specific)

| Secret Name | Description | How to Obtain |
|-------------|-------------|---------------|
| `FLY_API_TOKEN` | Fly.io API token for CI deployments. Has deploy access to all apps in the `taxklaro` org. | Fly.io Dashboard → Account → Access Tokens → Create token. Name: `ci-deploy`. Scope: Organization (taxklaro). |
| `VERCEL_TOKEN` | Vercel API token for CLI deployments. | Vercel Dashboard → Account Settings → Tokens → Create token. Name: `ci-deploy`. Scope: Full Account. |
| `VERCEL_ORG_ID` | Vercel organization/team ID. Format: `team_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (32 hex chars). | Vercel Dashboard → Team Settings → General → Team ID. |
| `VERCEL_PROJECT_ID` | Vercel project ID for `taxklaro-ph`. Format: `prj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`. | Vercel Dashboard → Project Settings → General → Project ID. |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source map uploads. | Sentry Dashboard → Settings → Auth Tokens → Create Internal Integration Token. Scopes: `project:releases`, `org:read`. |
| `RESEND_API_KEY` | Resend API key for nightly-test failure notifications (shared across environments). | Resend Dashboard → API Keys → Create API key. Name: `ci-notifications`. Permission: Sending access. |
| `E2E_TEST_USER_PASSWORD` | Password for the Playwright E2E test user account (`e2e-test@taxklaro.ph`) on staging. Must be set in staging DB before first nightly run. Minimum 12 characters. | Set manually: generate a secure 16-char password, create the user account in staging, store the same password here. |
| `E2E_PRO_USER_PASSWORD` | Password for the Playwright E2E PRO-tier test user (`e2e-pro@taxklaro.ph`) on staging. | Same as above for the PRO-tier test account. |

### 8.2 Production Environment Secrets

Store under **Settings → Environments → production → Secrets**:

| Secret Name | Description | How to Obtain |
|-------------|-------------|---------------|
| `DATABASE_DIRECT_URL` | Supabase direct (non-pooler) connection string for production DB migrations. Format: `postgres://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres` | Supabase Dashboard → Project → Settings → Database → Connection string → URI (session mode). |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID (public). Format: `XXXXXXXXXX-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com` | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs. |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for frontend error tracking. Format: `https://[key]@[org].ingest.sentry.io/[project-id]` | Sentry Dashboard → taxklaro-ph-frontend → Settings → Client Keys (DSN). |
| `NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY` | PayMongo publishable key (public). Format: `pk_live_xxxxxxxxxxxxxxxxxxxxxxxx` | PayMongo Dashboard → Developers → API Keys → Live publishable key. |

### 8.3 Staging Environment Secrets

Store under **Settings → Environments → staging → Secrets**:

| Secret Name | Description | How to Obtain |
|-------------|-------------|---------------|
| `STAGING_DATABASE_DIRECT_URL` | Supabase direct connection string for staging DB. Format: `postgres://postgres.[staging-project-ref]:[password]@db.[staging-project-ref].supabase.co:5432/postgres` | Supabase Dashboard → staging project → Settings → Database → Connection string → URI. |

---

## 9. Local Development Setup

### 9.1 Prerequisites

The following tools must be installed on the developer's machine before running the project locally:

| Tool | Version | Install Command |
|------|---------|-----------------|
| Node.js | 22.x | `nvm install 22 && nvm use 22` |
| npm | 10.x (bundled with Node 22) | Included with Node 22 |
| Docker Desktop | 4.x | https://docs.docker.com/desktop/ |
| Fly CLI | latest | `curl -L https://fly.io/install.sh \| sh` |
| Vercel CLI | latest | `npm install -g vercel@latest` |
| Stripe CLI | latest | `brew install stripe/stripe-cli/stripe` |

### 9.2 First-Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/taxklaro-ph/taxklaro-ph.git
cd taxklaro-ph

# 2. Install backend dependencies
npm ci

# 3. Install frontend dependencies
cd apps/frontend && npm ci && cd ../..

# 4. Start local Supabase (PostgreSQL + Studio)
npx supabase start
# This starts PostgreSQL on port 54322 and Supabase Studio at http://127.0.0.1:54323

# 5. Run database migrations
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" npm run db:migrate

# 6. Start a local Redis instance (required for batch worker)
docker run -d --name taxklaro-redis -p 6379:6379 redis:7-alpine

# 7. Copy environment file template and fill in values
cp .env.example .env.local
# Edit .env.local — see deployment/environment.md for all required variables.
# For local dev, the minimum required variables are:
#   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
#   REDIS_URL=redis://localhost:6379
#   JWT_SECRET=any-32-char-local-dev-secret-here
#   SESSION_SECRET=any-32-char-local-session-secret
#   INTERNAL_API_SECRET=any-local-internal-secret
#   APPLICATION_SECRET_KEY=any-32-char-local-application-key
#   ARGON2ID_DUMMY_HASH=[generate with: node -e "const argon2=require('argon2'); argon2.hash('dummy').then(console.log)"]
#   GOOGLE_CLIENT_ID=[from Google Cloud Console — localhost redirect required]
#   GOOGLE_CLIENT_SECRET=[from Google Cloud Console]
#   GOOGLE_REDIRECT_URI=http://localhost:3001/v1/auth/oauth/google/callback
#   RESEND_API_KEY=re_test_[from Resend — test API key]
#   PAYMONGO_SECRET_KEY=sk_test_[from PayMongo test dashboard]
#   STRIPE_SECRET_KEY=sk_test_[from Stripe test dashboard]
#   SESSION_COOKIE_DOMAIN=localhost
#   CORS_ALLOWED_ORIGINS=http://localhost:3000

# 8. (Optional) Forward Stripe webhooks to local server
stripe login
stripe listen --forward-to localhost:3001/v1/billing/webhooks/stripe &

# 9. (Optional) Forward PayMongo webhooks
# PayMongo does not have a CLI equivalent; use ngrok to expose localhost:3001
# and update the webhook URL in PayMongo test dashboard.
```

### 9.3 Running the Development Servers

Run each command in a separate terminal:

```bash
# Terminal 1: API server (hot reload via tsx watch)
npm run dev
# API runs at http://localhost:3001

# Terminal 2: Frontend (Next.js dev server)
cd apps/frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/v1 npm run dev
# Frontend runs at http://localhost:3000

# Terminal 3: PDF worker (optional — only needed for PDF export testing)
npm run dev:pdf
# PDF worker runs at http://localhost:3002

# Terminal 4: Batch worker (optional — only needed for batch job testing)
npm run dev:batch
# Batch worker runs at http://localhost:3003
```

### 9.4 Running Tests Locally

```bash
# Run all backend tests
npm run test

# Run only engine test vectors (fast — ~2 seconds)
npm run test:engine

# Run engine tests in watch mode
npm run test:engine:watch

# Run API integration tests (requires local Supabase + Redis running)
npm run test:api

# Run fuzz tests (slow — 10 minutes, 10,000 iterations per property)
npm run test:fuzz

# Run exhaustive vectors (all 80 scenario codes)
npm run test:exhaustive

# Run frontend tests
cd apps/frontend && npm run test

# Run E2E tests (requires staging or local server running)
cd apps/frontend
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:e2e

# Run with code coverage
npm run test:coverage
```

### 9.5 Stopping Local Services

```bash
# Stop Supabase
npx supabase stop

# Stop Redis
docker stop taxklaro-redis && docker rm taxklaro-redis

# Stop Stripe CLI webhook forwarder
# Kill the background process: find its PID and kill it
pkill -f "stripe listen"
```

---

## 10. Database Migration Workflow

### 10.1 Migration Naming Convention

Migration files are auto-generated by drizzle-kit in the `migrations/` directory. File names follow the pattern: `NNNN_description.sql` where `NNNN` is a zero-padded 4-digit sequential number.

Example:
```
migrations/
├── 0001_initial_schema.sql
├── 0002_add_promo_code_usage_table.sql
├── 0003_add_nolco_entries_column.sql
```

### 10.2 Creating a New Migration

```bash
# Step 1: Modify src/db/schema.ts with the desired schema change

# Step 2: Generate migration file
npm run db:generate
# Drizzle-kit compares current schema.ts to the last migration and generates
# a new SQL file in migrations/

# Step 3: Review the generated SQL file
cat migrations/000N_new_migration.sql

# Step 4: Apply locally to test
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" npm run db:migrate

# Step 5: Verify schema is correct via Supabase Studio
# http://127.0.0.1:54323 → Table editor

# Step 6: Commit both schema.ts and the new migration file
git add src/db/schema.ts migrations/000N_new_migration.sql
git commit -m "feat(db): add [description of change]"
```

### 10.3 Migration Rules

1. **Always backward-compatible**: A migration must not break the currently-deployed version of the API. Use the expand-contract pattern:
   - **Expand phase**: Add new columns as nullable, add new tables, add new indexes. Old API still works.
   - **Deploy phase**: Deploy new API code that reads/writes new columns.
   - **Contract phase** (separate PR): Remove old columns, tighten constraints, add NOT NULL after backfill.
2. **No data migrations in DDL migrations**: Never write `UPDATE` statements in migration files that touch production data. Use a separate one-off script.
3. **Idempotent preferred**: Where possible, use `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`.
4. **Never edit past migration files**: Once a migration file is committed and deployed, it is immutable. Create a new migration to undo or change it.

### 10.4 Emergency Rollback of a Bad Migration

If a migration causes production issues and must be rolled back:

```bash
# Step 1: Identify the previous migration version
npx drizzle-kit status --url $DATABASE_DIRECT_URL

# Step 2: Write a compensating migration (reverse the bad change)
# Edit src/db/schema.ts to revert the change
npm run db:generate
# Review the compensating migration SQL

# Step 3: Apply the compensating migration to production
# This is done via the CI pipeline — push to main triggers deploy-production.yml
# which runs migrations before deploy

# Alternatively, for emergency hotfix, apply directly:
DATABASE_URL=$DATABASE_DIRECT_URL npm run db:migrate

# Step 4: Deploy a fixed version of the API
```

---

## 11. Manual Deployment Commands

Use these commands when the CI/CD pipeline is unavailable or for emergency hotfixes. All commands require the relevant CLI tools installed and authenticated.

### 11.1 Deploy API Server Manually

```bash
# Ensure you are authenticated
flyctl auth login

# Deploy to production
flyctl deploy --remote-only -a taxklaro-api

# Deploy to staging
flyctl deploy --remote-only -a taxklaro-api-staging

# Deploy a specific Docker image (for rollback)
flyctl deploy --image registry.fly.io/taxklaro-api:<git-sha> -a taxklaro-api
```

### 11.2 Deploy PDF Worker Manually

```bash
flyctl deploy --config fly-pdf.toml --remote-only -a taxklaro-pdf
flyctl deploy --config fly-pdf.toml --remote-only -a taxklaro-pdf-staging
```

### 11.3 Deploy Batch Worker Manually

```bash
flyctl deploy --config fly-batch.toml --remote-only -a taxklaro-batch
flyctl deploy --config fly-batch.toml --remote-only -a taxklaro-batch-staging
```

### 11.4 Deploy Frontend Manually

```bash
# Navigate to frontend directory
cd apps/frontend
npm ci

# Install Vercel CLI if not present
npm install -g vercel@latest

# Deploy to production
vercel --prod --token $VERCEL_TOKEN

# Deploy to staging (creates preview deployment, then alias)
DEPLOY_URL=$(vercel --token $VERCEL_TOKEN 2>&1 | tail -1)
vercel alias $DEPLOY_URL staging.taxklaro.ph --token $VERCEL_TOKEN
```

### 11.5 Run Database Migrations Manually

```bash
# Production
DATABASE_URL=$DATABASE_DIRECT_URL npm run db:migrate

# Staging
DATABASE_URL=$STAGING_DATABASE_DIRECT_URL npm run db:migrate
```

### 11.6 Check Deployment Status

```bash
# API server status and recent logs
flyctl status -a taxklaro-api
flyctl logs -a taxklaro-api

# PDF worker status
flyctl status -a taxklaro-pdf

# Batch worker status
flyctl status -a taxklaro-batch

# List recent Vercel deployments
vercel ls --token $VERCEL_TOKEN

# List recent Fly.io releases (for rollback reference)
flyctl releases list -a taxklaro-api
```

---

## 12. Rollback Procedures

### 12.1 API Server Rollback

**Trigger:** Production smoke test fails after deployment, or Sentry shows spike in 5xx errors within 5 minutes of a deploy.

```bash
# Step 1: List recent releases to find the previous working image
flyctl releases list -a taxklaro-api
# Output shows: VERSION  STATUS  DESCRIPTION  USER  DATE
# e.g.:
# v42      complete  Deployed   ci    2026-03-02T10:00:00Z  ← current (bad)
# v41      complete  Deployed   ci    2026-03-01T09:00:00Z  ← rollback target

# Step 2: Find the image for v41
flyctl releases show v41 -a taxklaro-api
# Shows: Image = registry.fly.io/taxklaro-api:<sha>

# Step 3: Deploy the previous image
flyctl deploy --image registry.fly.io/taxklaro-api:<sha-from-v41> -a taxklaro-api

# Step 4: Verify health checks pass
flyctl status -a taxklaro-api
curl -s https://api.taxklaro.ph/v1/health/ready

# Step 5: If the bad deploy included a database migration, run a
# compensating migration (see §10.4). Do NOT revert migrations automatically.
```

**Expected rollback time:** 2–5 minutes.

### 12.2 Frontend Rollback

```bash
# Step 1: List recent Vercel deployments
vercel ls taxklaro-ph --token $VERCEL_TOKEN
# Output: URL    STATE   AGE
# e.g.: taxklaro-ph-abc123.vercel.app   READY   5m  ← current
#       taxklaro-ph-xyz789.vercel.app   READY   1d  ← rollback target

# Step 2: Alias production domain back to the previous deployment
vercel alias taxklaro-ph-xyz789.vercel.app taxklaro.ph --token $VERCEL_TOKEN

# Step 3: Verify
curl -s -o /dev/null -w "%{http_code}" https://taxklaro.ph
# Expected: 200
```

**Expected rollback time:** Under 1 minute (alias switch is near-instant via Cloudflare).

### 12.3 Database Rollback

Database rollbacks are handled via compensating migrations (forward-only). There is no `migrate down` command.

**If a migration introduced an incorrect schema change:**

```bash
# Step 1: Write a compensating migration that reverses the change
# Example: if 0005_add_bad_column.sql added a column, write 0006_remove_bad_column.sql
# Edit src/db/schema.ts to revert
npm run db:generate
# Review migrations/0006_remove_bad_column.sql

# Step 2: Apply immediately to production
DATABASE_URL=$DATABASE_DIRECT_URL npm run db:migrate
```

**If data was corrupted (requires PITR):**

Use Supabase Point-in-Time Recovery:
1. Log in to Supabase Dashboard → taxklaro-prod project
2. Navigate to Project Settings → Database → Backups
3. Click "Restore" → Select "Point in time"
4. Enter the exact timestamp to restore to (must be within last 7 days)
5. Confirm the restore — this creates a new Supabase database instance
6. Update `DATABASE_URL` and `DATABASE_DIRECT_URL` Fly.io secrets to point to the new instance
7. Redeploy API, PDF worker, and batch worker

**Expected PITR time:** 1–2 hours.

### 12.4 Rollback Decision Matrix

| Symptom | Severity | Rollback Target | Action |
|---------|----------|----------------|--------|
| Smoke test POST /v1/health/ready returns non-200 | Critical | API server | Roll back API immediately (§12.1) |
| Smoke test POST /v1/compute returns wrong PATH_C | Critical | API server | Roll back API immediately |
| Frontend returns 5xx on homepage | Critical | Frontend | Roll back frontend (§12.2) |
| Sentry error rate >5% within 10 min of deploy | High | API server | Roll back API within 15 min |
| Payment webhook failures (PayMongo/Stripe) | High | API server | Roll back API; check billing service |
| PDF export failures >20% | Medium | PDF worker | Roll back PDF worker |
| Batch job stuck or failing | Medium | Batch worker | Roll back batch worker |
| Database migration applied incorrectly | Critical | Database | Apply compensating migration immediately |
| Database data corruption | Critical | Database | PITR restore (§12.3) |

---

*End of ci-cd.md*
