# Environment Variables and Configuration — TaxKlaro

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- Infrastructure (where each component runs): [deployment/infrastructure.md](infrastructure.md)
- CI/CD (GitHub Actions secrets, local dev setup): [deployment/ci-cd.md](ci-cd.md)
- Auth spec (session/cookie security model): [api/auth.md](../api/auth.md)
- DNS and domain config: [deployment/domains.md](domains.md)
- Monitoring (Sentry DSNs, GA4): [deployment/monitoring.md](monitoring.md)
- Branding (favicon HTML, OG meta): [ui/branding.md](../ui/branding.md)
- SEO (GA4 property ID, Search Console): [seo-and-growth/seo-strategy.md](../seo-and-growth/seo-strategy.md)

---

## Table of Contents

1. [Overview and Secret Management](#1-overview-and-secret-management)
2. [API Server Environment Variables](#2-api-server-environment-variables)
3. [Frontend (Next.js / Vercel) Environment Variables](#3-frontend-nextjs--vercel-environment-variables)
4. [PDF Worker Environment Variables](#4-pdf-worker-environment-variables)
5. [Batch Worker Environment Variables](#5-batch-worker-environment-variables)
6. [Local Development `.env.local` Template](#6-local-development-envlocal-template)
7. [Staging Environment Overrides](#7-staging-environment-overrides)
8. [Variable Rotation Procedures](#8-variable-rotation-procedures)
9. [HTML Head Template (Meta Tags and Favicon)](#9-html-head-template-meta-tags-and-favicon)

---

## 1. Overview and Secret Management

### 1.1 Components and Their Config Sources

| Component | Config Source | Tool |
|-----------|--------------|------|
| API server (Fly.io) | Fly.io secrets | `flyctl secrets set VAR=value -a taxoptimizer-api` |
| PDF worker (Fly.io) | Fly.io secrets | `flyctl secrets set VAR=value -a taxoptimizer-pdf` |
| Batch worker (Fly.io) | Fly.io secrets + auto-injected `REDIS_URL` | `flyctl secrets set VAR=value -a taxoptimizer-batch` |
| Frontend (Vercel) | Vercel environment variables | Vercel Dashboard or `vercel env add` |
| GitHub Actions CI | Repository/Environment secrets | GitHub Settings → Secrets |
| Local development | `.env.local` file (gitignored) | Copy from `.env.example`, fill in values |

### 1.2 Non-Secret Variables vs. Secrets

**Non-secret variables** (safe to commit to `fly.toml` `[env]` block or Vercel environment config):
- `NODE_ENV`
- `PORT`
- `BATCH_CONCURRENCY`
- `LOG_LEVEL`
- `NEXT_PUBLIC_API_URL` (public, non-sensitive)
- `SENTRY_ORG`, `SENTRY_PROJECT` (not sensitive)

**Secret variables** (must NEVER be committed to source control):
- All API keys (Resend, PayMongo, Stripe, R2, Sentry, GA4)
- All OAuth client secrets
- All signing/encryption keys (APPLICATION_SECRET_KEY, ARGON2ID_DUMMY_HASH)
- All connection strings (DATABASE_URL, REDIS_URL, DATABASE_DIRECT_URL)
- Webhook signing secrets

### 1.3 Environments

| Environment | Purpose | Domain | Data |
|-------------|---------|--------|------|
| `production` | Live product | `taxoptimizer.ph` | Real user data |
| `staging` | Pre-release QA | `staging.taxoptimizer.ph` | Synthetic test data; isolated Supabase project |
| `development` | Local developer machines | `localhost:3000` / `localhost:3001` | Local Supabase instance |

---

## 2. API Server Environment Variables

Set via `flyctl secrets set ... -a taxoptimizer-api`. All variables are required in production unless marked **Optional**.

| Variable | Required | Production Value Format | Description |
|----------|----------|------------------------|-------------|
| `NODE_ENV` | Yes | `production` | Enables strict CORS, secure cookies, reduced log verbosity. Set `staging` for staging, `development` for local. |
| `PORT` | Yes | `3001` | TCP port the Express server listens on. Set in `fly.toml [env]` block (not a secret). |
| `DATABASE_URL` | Yes | `postgres://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10` | Supabase PgBouncer pooler URL (transaction mode). Used by all runtime database queries. The `[project-ref]` is the 20-character Supabase project reference. |
| `DATABASE_DIRECT_URL` | Yes | `postgres://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres` | Supabase direct connection URL (session mode). Used ONLY by migration runner (`npm run db:migrate`). Do NOT use in runtime code — the pooler does not support session-mode features like `LISTEN/NOTIFY` or `SET` commands at the session level. |
| `REDIS_URL` | Yes | `rediss://default:[password]@[host]:6379` | Redis connection URL with TLS (`rediss://` scheme). Injected automatically by Fly.io Upstash extension into batch worker. Must be manually set for API server (used for OAuth state parameters). |
| `APPLICATION_SECRET_KEY` | Yes | 64 hex characters (32 bytes) | Master cryptographic secret. Used for: CSRF token derivation (HMAC-SHA256 key), OAuth state encryption (AES-256-GCM key). Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Rotate every 12 months or after suspected compromise. |
| `ARGON2ID_DUMMY_HASH` | Yes | PHC string format (`$argon2id$v=19$m=65536,t=3,p=4$...`) | Pre-computed Argon2id hash used for timing normalization when login attempt uses a non-existent email (prevents timing oracle). Generate with: `node -e "const argon2=require('argon2'); argon2.hash('dummypassword_taxoptimizer').then(h => console.log(h))"`. Regenerate if Argon2 parameters change. |
| `GOOGLE_CLIENT_ID` | Yes | `[digits]-[alphanum].apps.googleusercontent.com` | Google OAuth 2.0 client ID. Obtain from Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs. The client must have Authorized Redirect URI: `https://api.taxoptimizer.ph/v1/auth/oauth/google/callback` (production) and `http://localhost:3001/v1/auth/oauth/google/callback` (development). |
| `GOOGLE_CLIENT_SECRET` | Yes | `GOCSPX-[alphanum]` (40 chars) | Google OAuth 2.0 client secret. Same credential entry as `GOOGLE_CLIENT_ID`. |
| `GOOGLE_REDIRECT_URI` | Yes | `https://api.taxoptimizer.ph/v1/auth/oauth/google/callback` | Must match exactly the registered Authorized Redirect URI in Google Cloud Console. For staging: `https://api.staging.taxoptimizer.ph/v1/auth/oauth/google/callback`. For local dev: `http://localhost:3001/v1/auth/oauth/google/callback`. |
| `SESSION_COOKIE_DOMAIN` | Yes | `taxoptimizer.ph` | Domain attribute for the `tax_session` HTTP-only cookie. Set to `.taxoptimizer.ph` (with leading dot) to cover `api.taxoptimizer.ph` and `taxoptimizer.ph` subdomains. For staging: `staging.taxoptimizer.ph`. |
| `CORS_ALLOWED_ORIGINS` | Yes | `https://taxoptimizer.ph,https://www.taxoptimizer.ph` | Comma-separated list of allowed CORS origins. Must include all frontend deployment URLs. For staging, add `https://staging.taxoptimizer.ph`. For development: `http://localhost:3000`. |
| `RESEND_API_KEY` | Yes | `re_[alphanum]` | Resend.com transactional email API key. Obtain from Resend Dashboard → API Keys → Create. Permission: Sending access. Domain must be verified (`mail.taxoptimizer.ph`). |
| `EMAIL_FROM_ADDRESS` | Yes | `noreply@mail.taxoptimizer.ph` | From address for all transactional emails. Must use the verified Resend sending domain. |
| `EMAIL_FROM_NAME` | Yes | `TaxOptimizer PH` | Display name for transactional email From header. |
| `PAYMONGO_SECRET_KEY` | Yes | `sk_live_[alphanum]` | PayMongo secret API key. Obtain from PayMongo Dashboard → Developers → API Keys → Live secret key. Used for creating PaymentIntents and subscriptions. |
| `PAYMONGO_PUBLIC_KEY` | Yes | `pk_live_[alphanum]` | PayMongo publishable key (also needed server-side for webhook validation). Obtain alongside secret key. |
| `PAYMONGO_WEBHOOK_SECRET` | Yes | `whsk_[alphanum]` | PayMongo webhook signing secret. Obtain after creating the webhook endpoint in PayMongo Dashboard. Used to validate `paymongo-signature` header on incoming webhooks. |
| `STRIPE_SECRET_KEY` | Yes | `sk_live_[alphanum]` | Stripe secret API key for international card payments. Obtain from Stripe Dashboard → Developers → API Keys → Secret key (live mode). |
| `STRIPE_WEBHOOK_SECRET` | Yes | `whsec_[alphanum]` | Stripe webhook signing secret. Obtain after creating webhook endpoint via `stripe webhook_endpoints create` or Stripe Dashboard. Used to validate `Stripe-Signature` header. |
| `SENTRY_DSN` | Yes | `https://[key]@[org].ingest.sentry.io/[project-id]` | Sentry DSN for the API server project (`taxoptimizer-ph-api`). Obtain from Sentry Dashboard → taxoptimizer-ph-api → Settings → Client Keys (DSN). |
| `R2_ACCOUNT_ID` | Yes | `[32 hex chars]` | Cloudflare account ID. Obtain from Cloudflare Dashboard → Right panel → Account ID. |
| `R2_ACCESS_KEY_ID` | Yes | `[alphanum]` | Cloudflare R2 API token access key ID. Create in Cloudflare Dashboard → R2 → Manage R2 API Tokens → Create API token. Permission: Object Read & Write on `taxoptimizer-exports` bucket only. |
| `R2_SECRET_ACCESS_KEY` | Yes | `[alphanum]` | Cloudflare R2 API token secret access key. Shown once at creation. |
| `R2_BUCKET_NAME` | Yes | `taxoptimizer-exports` | Name of the Cloudflare R2 bucket for PDF exports. Created in Cloudflare Dashboard → R2 → Create bucket. Set in `fly.toml [env]` (not a secret). |
| `R2_PUBLIC_URL` | Yes | `https://exports.taxoptimizer.ph` | Public base URL for R2 objects (via Cloudflare custom domain on R2). Used to construct signed download URLs. |
| `INTERNAL_API_SECRET` | Yes | 32+ character random string | Shared secret for internal service-to-service calls (API server → PDF worker, API server → batch worker). Set the same value in all three services. Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `GA4_MEASUREMENT_ID` | Yes | `G-XXXXXXXXXX` | Google Analytics 4 measurement ID. Obtain from GA4 Dashboard → Admin → Data Streams → Web stream → Measurement ID. Used server-side for server-to-server event tracking (not client-side). |
| `GA4_API_SECRET` | Yes | `[alphanum]` | GA4 Measurement Protocol API secret. Obtain from GA4 Dashboard → Admin → Data Streams → Web stream → Measurement Protocol API secrets → Create. Required for server-side event tracking. |
| `LOG_LEVEL` | Optional | `info` | Pino logger level. Values: `trace`, `debug`, `info`, `warn`, `error`, `fatal`. Production: `info`. Development: `debug`. Set in `fly.toml [env]`. |

---

## 3. Frontend (Next.js / Vercel) Environment Variables

Set in Vercel Dashboard → Project Settings → Environment Variables, or via `vercel env add`. Variables prefixed `NEXT_PUBLIC_` are embedded into the client-side JavaScript bundle — they are visible to all users and must NOT contain secrets.

| Variable | Required | Production Value | Environment (Vercel) | Description |
|----------|----------|-----------------|---------------------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `https://api.taxoptimizer.ph/v1` | Production, Preview, Development | Base URL for all frontend API calls. Preview deployments use staging API: `https://api.staging.taxoptimizer.ph/v1`. Development: `http://localhost:3001/v1`. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Yes | `[digits]-[alphanum].apps.googleusercontent.com` | Production, Preview | Google OAuth 2.0 client ID (same value as `GOOGLE_CLIENT_ID` in API server — it's the public client ID that appears in OAuth redirect URLs). |
| `NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY` | Yes | `pk_live_[alphanum]` | Production | PayMongo publishable key for client-side PaymentIntent creation (GCash, Maya, card forms). Preview uses `pk_test_[alphanum]`. |
| `NEXT_PUBLIC_SENTRY_DSN` | Yes | `https://[key]@[org].ingest.sentry.io/[project-id]` | Production, Preview | Sentry DSN for the **frontend** project (`taxoptimizer-ph-frontend`). Obtain from Sentry Dashboard → taxoptimizer-ph-frontend → Settings → Client Keys. Different from the API server DSN. |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | Yes | `G-XXXXXXXXXX` | Production | Google Analytics 4 measurement ID (same value as `GA4_MEASUREMENT_ID` in API server). Embedded in Next.js `<Script>` component for client-side page view tracking. |
| `NEXT_PUBLIC_SITE_URL` | Yes | `https://taxoptimizer.ph` | Production | Used for constructing canonical URLs, OG image URLs, and sitemap entries. Preview: `https://staging.taxoptimizer.ph`. |
| `SENTRY_AUTH_TOKEN` | Yes | `[Sentry internal integration token]` | Production, Preview | Sentry auth token for source map upload during build (`@sentry/cli`). Scopes required: `project:releases`, `org:read`. Set as a Vercel **secret** (not NEXT_PUBLIC_). |
| `SENTRY_ORG` | Yes | `taxoptimizer-ph` | Production, Preview | Sentry organization slug. Set in `next.config.js` `withSentryConfig` options. |
| `SENTRY_PROJECT` | Yes | `taxoptimizer-ph-frontend` | Production, Preview | Sentry project slug for source map association. |
| `NEXT_PUBLIC_SEARCH_CONSOLE_VERIFICATION` | Yes | `[verification token]` | Production | Google Search Console HTML tag verification token. Rendered in `<head>` as `<meta name="google-site-verification" content="[token]" />`. Obtain from Google Search Console → Add property → HTML tag method. |

---

## 4. PDF Worker Environment Variables

Set via `flyctl secrets set ... -a taxoptimizer-pdf`. The PDF worker is a Node.js service running Puppeteer — it does not need most of the application secrets.

| Variable | Required | Production Value Format | Description |
|----------|----------|------------------------|-------------|
| `NODE_ENV` | Yes | `production` | Set in `fly-pdf.toml [env]` block. |
| `PORT` | Yes | `3002` | TCP port the PDF worker HTTP server listens on. Set in `fly-pdf.toml [env]` block. |
| `INTERNAL_API_SECRET` | Yes | Same value as API server `INTERNAL_API_SECRET` | Validates `X-Internal-Secret` header on all requests to the PDF worker. Requests without a valid header are rejected with `401 Unauthorized`. |
| `R2_ACCOUNT_ID` | Yes | `[32 hex chars]` | Same value as API server (for writing PDF objects to R2). |
| `R2_ACCESS_KEY_ID` | Yes | `[alphanum]` | Same value as API server. |
| `R2_SECRET_ACCESS_KEY` | Yes | `[alphanum]` | Same value as API server. |
| `R2_BUCKET_NAME` | Yes | `taxoptimizer-exports` | Set in `fly-pdf.toml [env]` block (not a secret). |
| `SENTRY_DSN` | Yes | `https://[key]@[org].ingest.sentry.io/[project-id]` | Sentry DSN for the PDF worker (use the `taxoptimizer-ph-api` project DSN — PDF worker errors appear alongside API errors). |
| `LOG_LEVEL` | Optional | `info` | Set in `fly-pdf.toml [env]` block. |

---

## 5. Batch Worker Environment Variables

Set via `flyctl secrets set ... -a taxoptimizer-batch`. The `REDIS_URL` is injected automatically by Fly.io's Upstash Redis extension — do not set it manually.

| Variable | Required | Production Value Format | Description |
|----------|----------|------------------------|-------------|
| `NODE_ENV` | Yes | `production` | Set in `fly-batch.toml [env]` block. |
| `PORT` | Yes | `3003` | TCP port for the batch worker health check endpoint. Set in `fly-batch.toml [env]` block. |
| `BATCH_CONCURRENCY` | Yes | `5` | Number of concurrent batch job computations. Set in `fly-batch.toml [env]` block. Reduce to `2` if memory pressure observed. |
| `DATABASE_URL` | Yes | PgBouncer pooler URL (same format as API server `DATABASE_URL`) | For reading taxpayer profiles and writing batch results. |
| `REDIS_URL` | Auto-injected | `rediss://default:[password]@[upstash-host]:6379` | Injected by Fly.io Upstash Redis extension. Bull queue connection. Do NOT set manually. |
| `INTERNAL_API_SECRET` | Yes | Same value as API server `INTERNAL_API_SECRET` | For authenticating callbacks to the API server (batch job status updates). |
| `SENTRY_DSN` | Yes | `https://[key]@[org].ingest.sentry.io/[project-id]` | Same as API server Sentry DSN. |
| `LOG_LEVEL` | Optional | `info` | Set in `fly-batch.toml [env]` block. |

---

## 6. Local Development `.env.local` Template

The file `.env.example` is committed to the repository root. Developers copy it to `.env.local` (gitignored) and fill in values.

**Full `.env.example` contents (every variable the API server needs in development):**

```dotenv
# ─── Core ─────────────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug

# ─── Database ─────────────────────────────────────────────────────────────────
# Local Supabase (started with: npx supabase start)
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
DATABASE_DIRECT_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# ─── Redis ────────────────────────────────────────────────────────────────────
# Local Redis (started with: docker run -d --name taxoptimizer-redis -p 6379:6379 redis:7-alpine)
REDIS_URL=redis://localhost:6379

# ─── Cryptographic Secrets ────────────────────────────────────────────────────
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
APPLICATION_SECRET_KEY=00000000000000000000000000000000000000000000000000000000000000ab
# Generate with: node -e "const argon2=require('argon2'); argon2.hash('dummypassword_taxoptimizer').then(h => console.log(h))"
ARGON2ID_DUMMY_HASH=

# ─── Google OAuth ─────────────────────────────────────────────────────────────
# Obtain from Google Cloud Console — must add http://localhost:3001/v1/auth/oauth/google/callback as authorized redirect URI
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/v1/auth/oauth/google/callback

# ─── Session / CORS ───────────────────────────────────────────────────────────
SESSION_COOKIE_DOMAIN=localhost
CORS_ALLOWED_ORIGINS=http://localhost:3000

# ─── Email ────────────────────────────────────────────────────────────────────
# Use Resend test API key (emails go to Resend email testing dashboard, not real inboxes)
RESEND_API_KEY=re_test_
EMAIL_FROM_ADDRESS=noreply@mail.taxoptimizer.ph
EMAIL_FROM_NAME=TaxOptimizer PH (Dev)

# ─── Payments ─────────────────────────────────────────────────────────────────
# PayMongo test keys (no real charges)
PAYMONGO_SECRET_KEY=sk_test_
PAYMONGO_PUBLIC_KEY=pk_test_
PAYMONGO_WEBHOOK_SECRET=whsk_test_
# Stripe test keys (no real charges)
STRIPE_SECRET_KEY=sk_test_
STRIPE_WEBHOOK_SECRET=whsec_test_  # From: stripe listen --forward-to localhost:3001/v1/billing/webhooks/stripe

# ─── Object Storage ───────────────────────────────────────────────────────────
# Local: use MinIO (docker run -d -p 9000:9000 --name minio minio/minio server /data)
# Or use real Cloudflare R2 dev bucket
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=taxoptimizer-exports-dev
R2_PUBLIC_URL=http://localhost:9000/taxoptimizer-exports-dev

# ─── Internal Services ────────────────────────────────────────────────────────
INTERNAL_API_SECRET=local-internal-secret-for-dev-only

# ─── Monitoring ───────────────────────────────────────────────────────────────
# Leave blank in development to disable Sentry (errors go to console only)
SENTRY_DSN=

# ─── Analytics ────────────────────────────────────────────────────────────────
# Leave blank in development to disable GA4 tracking
GA4_MEASUREMENT_ID=
GA4_API_SECRET=
```

**Frontend `.env.local` (in `apps/frontend/`):**

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:3001/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=     # Same value as GOOGLE_CLIENT_ID in API server .env.local
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_
NEXT_PUBLIC_SENTRY_DSN=           # Leave blank to disable Sentry in dev
NEXT_PUBLIC_GA4_MEASUREMENT_ID=   # Leave blank to disable GA4 in dev
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SEARCH_CONSOLE_VERIFICATION=
```

---

## 7. Staging Environment Overrides

Staging uses the same variable names as production but with staging-specific values. Key differences:

| Variable | Staging Value | Difference |
|----------|--------------|------------|
| `NODE_ENV` | `staging` | Enables staging-specific behavior (relaxed CORS for preview URLs) |
| `DATABASE_URL` | PgBouncer pooler URL for staging Supabase project | Separate Supabase project: `taxoptimizer-staging` |
| `DATABASE_DIRECT_URL` | Direct URL for staging Supabase project | Same project ref but different credentials |
| `GOOGLE_REDIRECT_URI` | `https://api.staging.taxoptimizer.ph/v1/auth/oauth/google/callback` | Must be registered in Google Cloud Console |
| `SESSION_COOKIE_DOMAIN` | `staging.taxoptimizer.ph` | Cookie scoped to staging domain |
| `CORS_ALLOWED_ORIGINS` | `https://staging.taxoptimizer.ph` | Staging frontend URL |
| `PAYMONGO_SECRET_KEY` | `sk_test_[alphanum]` | PayMongo test mode key |
| `PAYMONGO_PUBLIC_KEY` | `pk_test_[alphanum]` | PayMongo test mode public key |
| `STRIPE_SECRET_KEY` | `sk_test_[alphanum]` | Stripe test mode key |
| `R2_BUCKET_NAME` | `taxoptimizer-exports-staging` | Separate R2 bucket (avoid polluting production) |
| `NEXT_PUBLIC_API_URL` | `https://api.staging.taxoptimizer.ph/v1` | Staging API endpoint |
| `NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY` | `pk_test_[alphanum]` | Test mode key |
| `NEXT_PUBLIC_SITE_URL` | `https://staging.taxoptimizer.ph` | Staging base URL |

---

## 8. Variable Rotation Procedures

### 8.1 `APPLICATION_SECRET_KEY` Rotation

1. Generate new key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Set new key in Fly.io: `flyctl secrets set APPLICATION_SECRET_KEY="<new-key>" -a taxoptimizer-api`
3. Deploy API server: `flyctl deploy --remote-only -a taxoptimizer-api`
4. **Impact:** All existing sessions will generate new CSRF tokens on next request (transparent to users). CSRF tokens in in-flight forms will fail validation on the next submission — users will see a "Session expired, please retry" error at most once.
5. Old sessions remain valid until their `expires_at` (up to 365 days). Sessions do NOT need to be revoked.
6. No database migration required.

### 8.2 `RESEND_API_KEY` Rotation

1. Create new API key in Resend Dashboard.
2. Set in Fly.io: `flyctl secrets set RESEND_API_KEY="re_..." -a taxoptimizer-api`
3. Deploy: `flyctl deploy --remote-only -a taxoptimizer-api`
4. Revoke old key in Resend Dashboard.

### 8.3 `PAYMONGO_WEBHOOK_SECRET` Rotation

1. In PayMongo Dashboard, regenerate the webhook signing secret for the endpoint.
2. Set new secret: `flyctl secrets set PAYMONGO_WEBHOOK_SECRET="whsk_..." -a taxoptimizer-api`
3. Deploy: `flyctl deploy --remote-only -a taxoptimizer-api`
4. **Impact:** A brief window between step 1 and step 3 will cause webhook signature validation failures — PayMongo will retry failed webhooks for up to 24 hours, so no events are permanently lost.

### 8.4 `DATABASE_URL` (Supabase Password) Rotation

1. Generate new Supabase database password in Supabase Dashboard → Project Settings → Database → Reset database password.
2. Update `DATABASE_URL` and `DATABASE_DIRECT_URL` in Fly.io secrets for all three services:
   ```bash
   flyctl secrets set DATABASE_URL="postgres://..." DATABASE_DIRECT_URL="postgres://..." -a taxoptimizer-api
   flyctl secrets set DATABASE_URL="postgres://..." -a taxoptimizer-batch
   ```
3. Update `DATABASE_DIRECT_URL` in GitHub Actions environment secrets.
4. Deploy all services simultaneously to minimize downtime.

### 8.5 `INTERNAL_API_SECRET` Rotation

1. Generate new secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Set in ALL three services atomically (API server, PDF worker, batch worker):
   ```bash
   flyctl secrets set INTERNAL_API_SECRET="<new-secret>" -a taxoptimizer-api
   flyctl secrets set INTERNAL_API_SECRET="<new-secret>" -a taxoptimizer-pdf
   flyctl secrets set INTERNAL_API_SECRET="<new-secret>" -a taxoptimizer-batch
   ```
3. Deploy all three simultaneously. There is a brief window during rolling deployment where old and new secrets coexist — internal requests may fail. Deploy during low-traffic periods (02:00–04:00 PHT).

---

## 9. HTML Head Template (Meta Tags and Favicon)

The following meta tags and link elements belong in the Next.js `<head>` component (`apps/frontend/src/app/layout.tsx` metadata export and root layout). These require environment variables to be set at build time.

### 9.1 Favicon Link Tags

```html
<!-- Standard favicon -->
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
```

Files required in `apps/frontend/public/`:
- `favicon.ico` — 32×32 and 16×16 combined ICO file
- `favicon.svg` — SVG favicon (see [ui/branding.md §4](../ui/branding.md))
- `apple-touch-icon.png` — 180×180 PNG
- `site.webmanifest` — Web App Manifest (see §9.3 below)

### 9.2 Google Search Console Verification

```html
<meta name="google-site-verification" content="${NEXT_PUBLIC_SEARCH_CONSOLE_VERIFICATION}" />
```

Set `NEXT_PUBLIC_SEARCH_CONSOLE_VERIFICATION` to the token provided by Google Search Console (HTML tag method). Obtain from Google Search Console → Add property (`taxoptimizer.ph`) → Verify → HTML tag method → copy content value.

### 9.3 `site.webmanifest` Contents

```json
{
  "name": "TaxOptimizer PH",
  "short_name": "TaxOptimizer",
  "description": "Philippine freelance income tax optimizer — compute and compare all three BIR tax regimes",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#0F4C81",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icon-512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### 9.4 Google Analytics 4 Script

In `apps/frontend/src/app/layout.tsx`, add after `<body>` open tag (using Next.js `<Script>` component with `strategy="afterInteractive"`):

```tsx
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID}`}
  strategy="afterInteractive"
/>
<Script id="ga4-init" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID}', {
      page_path: window.location.pathname,
      cookie_flags: 'SameSite=None;Secure',
      anonymize_ip: true
    });
  `}
</Script>
```

If `NEXT_PUBLIC_GA4_MEASUREMENT_ID` is not set (development), the Script tags are omitted: `process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID && <Script .../>`.
