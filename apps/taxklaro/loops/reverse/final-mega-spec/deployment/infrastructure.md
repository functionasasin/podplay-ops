# Deployment Infrastructure — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- Environment variables: [deployment/environment.md](environment.md)
- CI/CD pipeline: [deployment/ci-cd.md](ci-cd.md)
- Monitoring and alerts: [deployment/monitoring.md](monitoring.md)
- DNS and domain routing: [deployment/domains.md](domains.md)
- API endpoints and base URLs: [api/endpoints.md](../api/endpoints.md)
- Database schema: [database/schema.md](../database/schema.md)
- Auth model (session cookie settings): [api/auth.md](../api/auth.md)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Component Inventory](#2-component-inventory)
3. [Frontend — Vercel](#3-frontend--vercel)
4. [API Server — Fly.io](#4-api-server--flyio)
5. [Database — Supabase PostgreSQL](#5-database--supabase-postgresql)
6. [PDF Worker — Fly.io](#6-pdf-worker--flyio)
7. [Batch Worker — Fly.io](#7-batch-worker--flyio)
8. [Email — Resend](#8-email--resend)
9. [Payments — PayMongo and Stripe](#9-payments--paymongo-and-stripe)
10. [Error Tracking — Sentry](#10-error-tracking--sentry)
11. [CDN and Asset Storage — Cloudflare R2](#11-cdn-and-asset-storage--cloudflare-r2)
12. [Secrets Management](#12-secrets-management)
13. [Networking and Security Groups](#13-networking-and-security-groups)
14. [Disaster Recovery](#14-disaster-recovery)
15. [Cost Estimates](#15-cost-estimates)

---

## 1. Architecture Overview

```
                         ┌─────────────────────────────────────────────────────┐
                         │                   USERS                              │
                         │  Browser (taxklaro.ph) / API client / CPA tool  │
                         └───────────────────────┬─────────────────────────────┘
                                                 │ HTTPS
                         ┌───────────────────────▼─────────────────────────────┐
                         │              Cloudflare (DNS + WAF + CDN)            │
                         │  taxklaro.ph  /  api.taxklaro.ph             │
                         └────┬──────────────────────────────┬──────────────────┘
                              │ taxklaro.ph               │ api.taxklaro.ph
               ┌──────────────▼────────────┐   ┌─────────────▼──────────────────┐
               │     Vercel (Frontend)      │   │       Fly.io (API Server)       │
               │  Next.js 15 (App Router)   │   │   Node.js 22 / Express 5.x     │
               │  Region: Singapore (sin1)  │   │   Region: Singapore (sin)       │
               │  Auto-scales to 0          │   │   2 instances min (HA)          │
               └───────────────────────────┘   └────────┬───────────────────────┘
                                                         │ Private network
                              ┌──────────────────────────┼──────────────────────┐
                              │                          │                      │
              ┌───────────────▼──────┐   ┌──────────────▼────┐  ┌─────────────▼──────┐
              │  Supabase PostgreSQL │   │  PDF Worker (Fly)  │  │ Batch Worker (Fly) │
              │  PostgreSQL 16       │   │  Puppeteer + Node  │  │  Bull Queue + Node │
              │  Region: Singapore   │   │  1 instance        │  │  1 instance        │
              └──────────────────────┘   └───────────────────┘  └────────────────────┘
```

**Design principles:**
- No Kubernetes — managed platforms only at MVP. Operators are not DevOps engineers.
- All stateful components use managed services (Supabase, Fly Postgres not used — external Supabase).
- All inter-service communication inside Fly.io private network (6PN) where possible.
- Cloudflare sits in front of everything: DDoS protection, WAF, TLS termination, edge caching for static assets.
- Singapore region for all compute: lowest latency to Philippine users (≈20 ms RTT Manila→Singapore vs ≈180 ms to US).

---

## 2. Component Inventory

| Component | Service | Plan | Region | Purpose |
|-----------|---------|------|--------|---------|
| Frontend | Vercel | Pro ($20/month) | sin1 (Singapore) | Next.js SSR + static |
| API Server | Fly.io | Pay-as-you-go | sin (Singapore) | REST API, engine execution |
| PDF Worker | Fly.io | Pay-as-you-go | sin (Singapore) | PDF generation with Puppeteer |
| Batch Worker | Fly.io | Pay-as-you-go | sin (Singapore) | Async batch computation jobs |
| Database | Supabase | Pro ($25/month) | ap-southeast-1 (Singapore) | PostgreSQL 16, connection pooling |
| Email | Resend | Pro ($20/month) | N/A (global) | Transactional email delivery |
| Error Tracking | Sentry | Team ($26/month) | US (Sentry cloud) | Error capture, performance tracing |
| Payments (PH) | PayMongo | 2.9%+₱15/txn | N/A (PH-based) | Philippine GCash/card payments |
| Payments (Intl) | Stripe | 2.9%+30¢/txn | N/A (global) | International card payments |
| CDN + WAF | Cloudflare | Pro ($20/month) | Global edge | DNS, WAF, DDoS, asset CDN |
| Object Storage | Cloudflare R2 | Pay-as-you-go | Global | PDF storage, export downloads |

---

## 3. Frontend — Vercel

### 3.1 Framework and Runtime

- **Framework:** Next.js 15 with App Router
- **Runtime:** Node.js 22 (Vercel managed)
- **Rendering strategy:**
  - Marketing pages (`/`, `/pricing`, `/blog/*`): Static Site Generation (SSG) — rebuilt on each deployment
  - Auth pages (`/login`, `/register`, `/forgot-password`): SSG with client-side hydration
  - App pages (`/dashboard/*`, `/compute`, `/history/*`, `/clients/*`, `/settings/*`): Client Components (CSR) — fetched from API after session validation
  - Tax blog articles (`/blog/[slug]`): Incremental Static Regeneration (ISR), `revalidate: 3600` (1 hour)

### 3.2 Vercel Project Configuration

**Project name:** `taxklaro-ph`
**Git branch → environment mapping:**

| Branch | Vercel Environment | Domain |
|--------|-------------------|--------|
| `main` | Production | `taxklaro.ph` |
| `staging` | Preview | `staging.taxklaro.ph` |
| Any PR branch | Preview | `taxklaro-ph-git-<branch>-<team>.vercel.app` |

**Build command:**
```bash
npm run build
```

**Output directory:** `.next`

**Install command:**
```bash
npm ci
```

**Node version:** `22.x` (set in Vercel project settings → General → Node.js Version)

### 3.3 Vercel Environment Variables

All variables set in Vercel Dashboard → Project Settings → Environment Variables.

| Variable | Environments | Description |
|----------|-------------|-------------|
| `NEXT_PUBLIC_API_URL` | Production, Preview | `https://api.taxklaro.ph/v1` (Production) / `https://api.staging.taxklaro.ph/v1` (Preview) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | All | Google OAuth client ID for browser-side OAuth initiation |
| `NEXT_PUBLIC_SENTRY_DSN` | All | Sentry DSN for client-side error tracking |
| `NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY` | All | PayMongo publishable key for client-side payment element |
| `SENTRY_AUTH_TOKEN` | All | Sentry auth token for source map uploads during build |
| `SENTRY_ORG` | All | `taxklaro-ph` |
| `SENTRY_PROJECT` | All | `taxklaro-ph-frontend` |

### 3.4 Next.js Configuration (`next.config.js`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    instrumentationHook: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://accounts.google.com https://js.paymongo.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https://lh3.googleusercontent.com",
              "connect-src 'self' https://api.taxklaro.ph https://sentry.io",
              "frame-src https://accounts.google.com https://js.paymongo.com",
            ].join('; ')
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/app', destination: '/dashboard', permanent: true },
    ];
  },
};
module.exports = nextConfig;
```

### 3.5 Vercel Deployment Commands (Manual)

```bash
# Install Vercel CLI
npm install -g vercel@latest

# Login
vercel login

# Link project (one-time)
vercel link --project taxklaro-ph

# Deploy to production
vercel --prod

# Deploy to preview
vercel

# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]

# Pull environment variables to .env.local for local dev
vercel env pull .env.local
```

---

## 4. API Server — Fly.io

### 4.1 Runtime and Framework

- **Runtime:** Node.js 22
- **Framework:** Express 5.x
- **Language:** TypeScript 5.x, compiled to CommonJS with `tsc`
- **Entry point:** `dist/server.js`
- **Port:** 3001 (internal), exposed via Fly proxy on port 443

### 4.2 Fly.io Application Configuration (`fly.toml`)

```toml
app = "taxklaro-api"
primary_region = "sin"

[build]
  dockerfile = "Dockerfile.api"

[env]
  NODE_ENV = "production"
  PORT = "3001"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 2
  processes = ["app"]

  [http_service.concurrency]
    type = "requests"
    hard_limit = 200
    soft_limit = 150

[[vm]]
  size = "performance-2x"
  memory = "2gb"
  cpus = 2

[checks]
  [checks.api_health]
    grace_period = "10s"
    interval = "15s"
    method = "GET"
    path = "/v1/health/live"
    port = 3001
    timeout = "5s"
    type = "http"
    [checks.api_health.headers]
      X-Health-Check = "fly-internal"
```

### 4.3 API Server Dockerfile (`Dockerfile.api`)

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
USER nodejs
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

### 4.4 Fly.io Deployment Commands

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Create app (one-time)
flyctl apps create taxklaro-api --org taxklaro

# Set secrets (one-time per environment)
flyctl secrets set \
  DATABASE_URL="postgres://..." \
  JWT_SECRET="..." \
  SESSION_SECRET="..." \
  GOOGLE_CLIENT_ID="..." \
  GOOGLE_CLIENT_SECRET="..." \
  RESEND_API_KEY="..." \
  PAYMONGO_SECRET_KEY="..." \
  PAYMONGO_WEBHOOK_SECRET="..." \
  STRIPE_SECRET_KEY="..." \
  STRIPE_WEBHOOK_SECRET="..." \
  SENTRY_DSN="..." \
  R2_ACCOUNT_ID="..." \
  R2_ACCESS_KEY_ID="..." \
  R2_SECRET_ACCESS_KEY="..." \
  R2_BUCKET_NAME="taxklaro-exports" \
  -a taxklaro-api

# Deploy (CI uses this)
flyctl deploy --remote-only -a taxklaro-api

# Scale to 2 instances (one-time after first deploy)
flyctl scale count 2 -a taxklaro-api

# Check instance status
flyctl status -a taxklaro-api

# Tail live logs
flyctl logs -a taxklaro-api

# SSH into a running machine
flyctl ssh console -a taxklaro-api

# Rollback to previous image (get image from flyctl releases list)
flyctl deploy --image registry.fly.io/taxklaro-api:<previous-version> -a taxklaro-api
```

### 4.5 Auto-scaling Rules

- **Minimum machines:** 2 (ensures HA — if one machine fails or restarts, the other handles traffic)
- **Machine type:** `performance-2x` (2 vCPU, 2 GB RAM)
- **Auto-stop:** Enabled — machines that receive no traffic for 5 minutes are stopped (cost savings during off-peak Philippine hours: 2 AM–6 AM PHT)
- **Auto-start:** Enabled — machines restart within 1–2 seconds when a request arrives
- **Concurrency soft limit:** 150 requests per machine — Fly load-balances across running machines; starts additional machines if all hit soft limit
- **Concurrency hard limit:** 200 requests per machine — above this, Fly returns 503

### 4.6 Private Networking

The API server, PDF worker, and batch worker all run in the same Fly.io organization and can communicate over the Fly 6PN (IPv6 private network) without public internet exposure. Internal DNS:

| Service | Internal Fly DNS |
|---------|-----------------|
| API server | `taxklaro-api.internal` |
| PDF worker | `taxklaro-pdf.internal` |
| Batch worker | `taxklaro-batch.internal` |

The API server calls the PDF worker at `http://taxklaro-pdf.internal:3002/generate` and the batch worker at `http://taxklaro-batch.internal:3003/jobs`.

---

## 5. Database — Supabase PostgreSQL

### 5.1 Plan and Configuration

- **Service:** Supabase (managed PostgreSQL 16)
- **Plan:** Pro ($25/month)
- **Region:** `ap-southeast-1` (Singapore — same region as Fly.io `sin`)
- **Instance type:** `Small` (1 vCPU, 2 GB RAM) — upgradeable to `Medium` (2 vCPU, 4 GB RAM) at ~5,000 DAU
- **Storage:** 8 GB provisioned (Supabase Pro includes 8 GB; auto-expands at $0.125/GB beyond)
- **Daily backups:** Enabled by default on Pro plan, retained 7 days (Point-in-Time Recovery available)
- **Connection pooler:** PgBouncer in Transaction mode, port 5432 (pooler URL) — used by API server and workers
- **Direct connection:** Port 5432 direct — used only by migration runner in CI

### 5.2 Connection Strings

The API server and workers always connect via PgBouncer pooler:

```
# Pooler (transaction mode) — used by application code
DATABASE_URL=postgres://postgres.[project-ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10

# Direct (session mode) — used by migration runner only
DATABASE_DIRECT_URL=postgres://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres
```

The `[project-ref]` is the Supabase project reference (20-character alphanumeric string assigned at project creation).

### 5.3 Connection Pool Sizing

| Component | Pool Size | Rationale |
|-----------|-----------|-----------|
| API server (2 machines) | 10 connections each = 20 total | Each Express process handles up to 150 concurrent req; most complete in <100 ms; 10 connections ample for async operations |
| PDF worker (1 machine) | 3 connections | Low volume; PDF generation is I/O-bound not DB-bound |
| Batch worker (1 machine) | 5 connections | Processes up to 5 concurrent batch items |
| CI migration runner | 1 direct connection | Not pooled |
| **Total pooler connections** | **28** | PgBouncer Pro plan supports 200 pooler connections |

### 5.4 Database Initialization Commands

```bash
# Install Supabase CLI
npm install -g supabase@latest

# Login
supabase login

# Link to project (one-time)
supabase link --project-ref <project-ref>

# Pull remote schema to local
supabase db pull

# Run migrations (local dev)
supabase db push

# Run migrations (production — from CI using direct URL)
DATABASE_URL=$DATABASE_DIRECT_URL npx drizzle-kit migrate

# Generate migration from schema changes
npx drizzle-kit generate

# Inspect current migration state
npx drizzle-kit status

# Open Supabase Studio (local)
supabase start
```

### 5.5 Backup and Recovery

- **Automated daily backup:** Supabase Pro provides daily backups, retained 7 days. Accessible via Supabase Dashboard → Project → Database → Backups.
- **Point-in-Time Recovery (PITR):** Available on Pro plan. Supabase retains WAL logs for 7 days; any point within the last 7 days is restorable.
- **Manual backup (before risky migrations):**
  ```bash
  # Dump current schema + data to file
  pg_dump "$DATABASE_DIRECT_URL" --format=custom --file="backup-$(date +%Y%m%d-%H%M%S).dump"
  ```
- **Restore from dump:**
  ```bash
  pg_restore --dbname="$DATABASE_DIRECT_URL" --format=custom backup-20260302-120000.dump
  ```

---

## 6. PDF Worker — Fly.io

### 6.1 Purpose

The PDF worker is a separate Fly.io application that runs Puppeteer (headless Chromium) to render HTML templates into PDF files. It is separated from the main API server because:
1. Puppeteer requires Chromium — bloats the API server Docker image by ~300 MB
2. PDF generation is CPU-intensive — isolates it from API latency
3. Allows independent scaling

### 6.2 Fly.io Configuration (`fly-pdf.toml`)

```toml
app = "taxklaro-pdf"
primary_region = "sin"

[build]
  dockerfile = "Dockerfile.pdf"

[env]
  NODE_ENV = "production"
  PORT = "3002"
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "false"

[http_service]
  internal_port = 3002
  force_https = false
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

  [http_service.concurrency]
    type = "requests"
    hard_limit = 10
    soft_limit = 5

[[vm]]
  size = "performance-2x"
  memory = "4gb"
  cpus = 2
```

**Note:** `force_https = false` because the PDF worker is only accessible via Fly 6PN private network, never from the public internet. The API server calls it over the private network using HTTP.

### 6.3 PDF Worker Dockerfile (`Dockerfile.pdf`)

```dockerfile
FROM node:22-slim AS builder
WORKDIR /app
# Install Chromium system dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-khmeros \
    fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg \
    fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
USER nodejs
EXPOSE 3002
CMD ["node", "dist/pdf-server.js"]
```

### 6.4 PDF Worker API Contract

The PDF worker exposes a single internal HTTP endpoint (not public):

**`POST /generate`** (internal only, called by API server over Fly 6PN)

Request body:
```json
{
  "template": "SUMMARY" | "FORM_1701_PREFILL" | "FORM_1701A_PREFILL" | "FORM_1701Q_PREFILL" | "CWT_SCHEDULE",
  "computation_id": "uuid",
  "data": { /* TaxComputationResult */ },
  "brand": {
    "logo_url": "string | null",
    "firm_name": "string | null"
  }
}
```

Response: `application/pdf` binary stream, or `500` with `{ "error": "string" }`.

The API server passes the PDF binary stream directly to Cloudflare R2 storage and then returns a signed download URL to the client.

### 6.5 PDF Worker Deploy Commands

```bash
# Create app (one-time)
flyctl apps create taxklaro-pdf --org taxklaro

# Set secrets
flyctl secrets set \
  R2_ACCOUNT_ID="..." \
  R2_ACCESS_KEY_ID="..." \
  R2_SECRET_ACCESS_KEY="..." \
  R2_BUCKET_NAME="taxklaro-exports" \
  INTERNAL_API_SECRET="..." \
  -a taxklaro-pdf

# Deploy
flyctl deploy --config fly-pdf.toml --remote-only -a taxklaro-pdf
```

---

## 7. Batch Worker — Fly.io

### 7.1 Purpose

The batch worker processes asynchronous computation jobs submitted by Enterprise users (CPAs computing tax for multiple clients). It uses Bull (Redis-backed job queue) but Redis is not managed separately — it uses Fly.io's built-in `upstash-redis` extension.

### 7.2 Redis (Upstash on Fly.io)

```bash
# Create Upstash Redis extension for the batch worker (one-time)
flyctl ext storage create --org taxklaro --name taxklaro-redis --app taxklaro-batch
```

This creates a managed Upstash Redis instance in the same region (`sin`) as the batch worker. Fly.io injects `REDIS_URL` into the batch worker's environment automatically.

### 7.3 Fly.io Configuration (`fly-batch.toml`)

```toml
app = "taxklaro-batch"
primary_region = "sin"

[build]
  dockerfile = "Dockerfile.batch"

[env]
  NODE_ENV = "production"
  PORT = "3003"
  BATCH_CONCURRENCY = "5"

[http_service]
  internal_port = 3003
  force_https = false
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

  [http_service.concurrency]
    type = "requests"
    hard_limit = 50
    soft_limit = 30

[[vm]]
  size = "shared-cpu-2x"
  memory = "1gb"
  cpus = 2
```

### 7.4 Batch Worker Dockerfile (`Dockerfile.batch`)

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
USER nodejs
EXPOSE 3003
CMD ["node", "dist/batch-server.js"]
```

### 7.5 Batch Worker Deploy Commands

```bash
# Create app (one-time)
flyctl apps create taxklaro-batch --org taxklaro

# Create Redis extension (one-time)
flyctl ext storage create --org taxklaro --name taxklaro-redis --app taxklaro-batch

# Set secrets
flyctl secrets set \
  DATABASE_URL="postgres://..." \
  INTERNAL_API_SECRET="..." \
  RESEND_API_KEY="..." \
  SENTRY_DSN="..." \
  -a taxklaro-batch

# Deploy
flyctl deploy --config fly-batch.toml --remote-only -a taxklaro-batch
```

---

## 8. Email — Resend

### 8.1 Configuration

- **Service:** Resend (transactional email)
- **Plan:** Pro ($20/month — 50,000 emails/month)
- **Sending domain:** `mail.taxklaro.ph` (subdomain of production domain)
- **From address (transactional):** `noreply@mail.taxklaro.ph`
- **From name (transactional):** `TaxKlaro`
- **Reply-to:** `support@taxklaro.ph`

### 8.2 DNS Records for Resend

The following DNS records must be added to the `taxklaro.ph` zone in Cloudflare:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| TXT | `mail.taxklaro.ph` | `v=spf1 include:amazonses.com ~all` | 300 |
| CNAME | `resend._domainkey.mail.taxklaro.ph` | `resend._domainkey.resend.com` | 300 |
| CNAME | `em1234.mail.taxklaro.ph` | `u1234.wl234.sendgrid.net` (Resend provides actual value) | 300 |
| TXT | `_dmarc.taxklaro.ph` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@taxklaro.ph` | 300 |

The actual CNAME values for DKIM are provided by Resend upon domain verification. The DMARC `rua` address `dmarc@taxklaro.ph` must be a functional mailbox (MX records pointing to the operator's email provider of choice).

### 8.3 Email Templates and Triggers

| Template | Subject | Trigger |
|----------|---------|---------|
| `email-verification` | `Verify your TaxKlaro email address` | POST /auth/register |
| `password-reset` | `Reset your TaxKlaro password` | POST /auth/forgot-password |
| `welcome` | `Welcome to TaxKlaro — here's what to do first` | Email verified |
| `subscription-activated` | `Your PRO subscription is now active` | Subscription created (PRO or ENT) |
| `subscription-cancelling` | `Your subscription ends on [date]` | Subscription cancel-at-period-end set |
| `subscription-expired` | `Your PRO subscription has ended` | Subscription status → EXPIRED |
| `payment-failed` | `Action required: Payment failed for TaxKlaro` | PayMongo/Stripe webhook: payment_intent.payment_failed |
| `invoice-paid` | `Receipt for your TaxKlaro subscription` | Invoice paid |
| `batch-complete` | `Your batch computation is ready` | Batch job status → COMPLETED |
| `batch-failed` | `Your batch job encountered errors` | Batch job status → FAILED |

All email templates are React components rendered server-side using `@react-email/components`. Templates are located in `src/emails/` directory of the API server repository. Resend's API accepts pre-rendered HTML strings.

### 8.4 Resend API Usage

```bash
# Set Resend API key in production (Fly.io secret)
flyctl secrets set RESEND_API_KEY="re_..." -a taxklaro-api

# Verify domain (run once after adding DNS records)
# Done via Resend dashboard, not CLI
```

---

## 9. Payments — PayMongo and Stripe

### 9.1 PayMongo (Philippine GCash, Maya, Cards)

- **Purpose:** Primary payment processor for Philippine users paying in PHP
- **Supported methods:** GCash (LinkIntent), Maya (LinkIntent), Visa/Mastercard (PaymentIntent), BancNet
- **Webhook endpoint:** `POST https://api.taxklaro.ph/v1/billing/webhooks/paymongo`
- **Webhook signature validation:** `PAYMONGO_WEBHOOK_SECRET` environment variable (see environment.md)
- **PayMongo webhook events subscribed:**
  - `payment.paid` — mark invoice paid, activate subscription
  - `payment.failed` — trigger dunning sequence (see premium/pricing.md §14)
  - `subscription.payment_paid` — recurring subscription renewal
  - `subscription.payment_failed` — renewal failure, dunning
  - `subscription.cancelled` — set subscription status to CANCELLING or EXPIRED

**PayMongo dashboard setup (one-time):**
1. Create account at dashboard.paymongo.com
2. Complete KYB with business registration documents (SEC/DTI registration, valid ID)
3. Set webhook URL: `https://api.taxklaro.ph/v1/billing/webhooks/paymongo`
4. Retrieve public key → set `NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY` in Vercel
5. Retrieve secret key → set `PAYMONGO_SECRET_KEY` in Fly.io
6. Retrieve webhook signing secret → set `PAYMONGO_WEBHOOK_SECRET` in Fly.io

### 9.2 Stripe (International Cards)

- **Purpose:** Fallback payment processor for non-Philippine users or failed PayMongo payments
- **Supported methods:** Visa/Mastercard/Amex international, Apple Pay, Google Pay
- **Webhook endpoint:** `POST https://api.taxklaro.ph/v1/billing/webhooks/stripe`
- **Webhook signature validation:** `STRIPE_WEBHOOK_SECRET` environment variable
- **Stripe webhook events subscribed:**
  - `customer.subscription.created` — new Stripe subscription
  - `customer.subscription.updated` — plan change
  - `customer.subscription.deleted` — cancellation
  - `invoice.payment_succeeded` — subscription renewal paid
  - `invoice.payment_failed` — renewal failure
  - `payment_intent.payment_failed` — one-time payment failure

**Stripe CLI setup for local development:**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/v1/billing/webhooks/stripe

# Trigger test event
stripe trigger invoice.payment_succeeded
```

**Stripe production webhook setup:**
```bash
# Add webhook endpoint via Stripe CLI
stripe webhook_endpoints create \
  --url "https://api.taxklaro.ph/v1/billing/webhooks/stripe" \
  --enabled-events "customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,invoice.payment_succeeded,invoice.payment_failed,payment_intent.payment_failed"

# Retrieve signing secret (shown once on creation)
# → Set STRIPE_WEBHOOK_SECRET in Fly.io secrets
```

---

## 10. Error Tracking — Sentry

### 10.1 Configuration

- **Service:** Sentry
- **Plan:** Team ($26/month — 100K errors/month, 250K performance spans/month)
- **Organization slug:** `taxklaro-ph`
- **Projects:**
  - `taxklaro-ph-frontend` — Next.js client and server components
  - `taxklaro-ph-api` — Express API server
  - `taxklaro-ph-pdf` — PDF worker
  - `taxklaro-ph-batch` — Batch worker

### 10.2 Sentry SDK Initialization

**Frontend (`src/instrumentation.ts` in Next.js):**
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

**API server (`src/server.ts`):**
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  integrations: [
    Sentry.expressIntegration({ app }),
    Sentry.postgresIntegration(),
  ],
});
```

### 10.3 Sentry Source Maps Upload

Source maps are uploaded during CI build (see ci-cd.md). The Sentry CLI is invoked after `npm run build`:

```bash
npx @sentry/cli releases new "$SENTRY_RELEASE"
npx @sentry/cli releases set-commits "$SENTRY_RELEASE" --auto
npx @sentry/cli releases files "$SENTRY_RELEASE" upload-sourcemaps ./dist
npx @sentry/cli releases finalize "$SENTRY_RELEASE"
```

Where `SENTRY_RELEASE` is set to the Git commit SHA: `export SENTRY_RELEASE=$(git rev-parse --short HEAD)`.

---

## 11. CDN and Asset Storage — Cloudflare R2

### 11.1 Cloudflare R2 (PDF Storage)

- **Purpose:** Store generated PDF exports for download
- **Bucket name:** `taxklaro-exports`
- **Region:** Automatic (Cloudflare global; physically stored closest to Singapore)
- **Access:** Private (no public access by default). API server generates pre-signed URLs valid for 24 hours.
- **Retention:** PDFs deleted after 30 days (lifecycle rule — see database/retention.md)
- **Pricing:** $0.015/GB storage + $0.36/million Class A operations + $0.04/million Class B operations (free egress)

**R2 bucket setup:**
```bash
# Using wrangler CLI
npm install -g wrangler@latest

# Login
wrangler login

# Create bucket
wrangler r2 bucket create taxklaro-exports

# Set lifecycle rule to delete objects after 30 days
wrangler r2 bucket lifecycle add taxklaro-exports \
  --rule-name "delete-old-pdfs" \
  --prefix "" \
  --expiration-days 30

# Create API token for API server access (Cloudflare Dashboard → My Profile → API Tokens)
# Required permissions: Account → Cloudflare R2 Storage → Edit
# → Save as R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in Fly.io secrets
```

### 11.2 Cloudflare CDN Configuration

Cloudflare sits in front of both `taxklaro.ph` (proxied to Vercel) and `api.taxklaro.ph` (proxied to Fly.io).

**Page Rules (configured in Cloudflare Dashboard → Rules → Page Rules):**

| Pattern | Rule | Setting |
|---------|------|---------|
| `taxklaro.ph/blog/*` | Cache Level | Cache Everything; Edge TTL 3600s |
| `taxklaro.ph/_next/static/*` | Cache Level | Cache Everything; Browser TTL 31536000s |
| `taxklaro.ph/api/*` | Cache Level | Bypass |
| `api.taxklaro.ph/*` | Cache Level | Bypass |
| `taxklaro.ph/compute` | Cache Level | Bypass |
| `taxklaro.ph/dashboard/*` | Cache Level | Bypass |

**WAF Rules (Cloudflare Dashboard → Security → WAF):**

| Rule | Action | Purpose |
|------|--------|---------|
| OWASP Core Ruleset | Block (sensitivity: Medium) | Block common web attacks (SQLi, XSS, path traversal) |
| Rate Limit: API general | Block for 60s after 1000 req/10min from same IP | Prevent API abuse |
| Rate Limit: /auth/login | Challenge after 10 attempts in 5 min from same IP | Brute force protection |
| Rate Limit: /auth/register | Challenge after 5 attempts in 10 min from same IP | Account creation abuse |
| Bot Fight Mode | On | Block known bad bots |

---

## 12. Secrets Management

### 12.1 Secrets by Component

All production secrets are stored in the respective platform's secret manager — never in git, never in `.env` files committed to the repository.

| Secret | Stored In | Used By |
|--------|-----------|---------|
| `DATABASE_URL` | Fly.io Secrets | API server, PDF worker, batch worker |
| `DATABASE_DIRECT_URL` | GitHub Actions Secret | CI migration runner only |
| `JWT_SECRET` | Fly.io Secrets | API server |
| `SESSION_SECRET` | Fly.io Secrets | API server |
| `GOOGLE_CLIENT_ID` | Fly.io Secrets + Vercel Env | API server (callback), frontend (initiation) |
| `GOOGLE_CLIENT_SECRET` | Fly.io Secrets | API server |
| `RESEND_API_KEY` | Fly.io Secrets | API server, batch worker |
| `PAYMONGO_SECRET_KEY` | Fly.io Secrets | API server |
| `PAYMONGO_WEBHOOK_SECRET` | Fly.io Secrets | API server |
| `STRIPE_SECRET_KEY` | Fly.io Secrets | API server |
| `STRIPE_WEBHOOK_SECRET` | Fly.io Secrets | API server |
| `R2_ACCOUNT_ID` | Fly.io Secrets | API server, PDF worker |
| `R2_ACCESS_KEY_ID` | Fly.io Secrets | API server, PDF worker |
| `R2_SECRET_ACCESS_KEY` | Fly.io Secrets | API server, PDF worker |
| `SENTRY_DSN` | Fly.io Secrets + Vercel Env | All Sentry projects |
| `SENTRY_AUTH_TOKEN` | Vercel Env + GitHub Actions Secret | Build-time source map upload |
| `INTERNAL_API_SECRET` | Fly.io Secrets | API→PDF worker, API→batch worker authentication |
| `FLY_API_TOKEN` | GitHub Actions Secret | CI deployment |
| `VERCEL_TOKEN` | GitHub Actions Secret | CI deployment |

### 12.2 Secret Rotation Policy

| Secret | Rotation Frequency | Rotation Procedure |
|--------|-------------------|--------------------|
| `SESSION_SECRET` | Every 90 days | Update Fly.io secret; existing sessions invalidated; users re-login |
| `JWT_SECRET` | Every 90 days | Update Fly.io secret; existing JWTs invalidated |
| `INTERNAL_API_SECRET` | Every 180 days | Update in all 3 Fly apps simultaneously during low-traffic window |
| `GOOGLE_CLIENT_SECRET` | On compromise only | Rotate in Google Cloud Console, update Fly.io + GitHub secrets |
| `RESEND_API_KEY` | On compromise only | Rotate in Resend dashboard, update Fly.io secrets |
| `R2_ACCESS_KEY_ID/SECRET` | Every 180 days | Create new R2 API token, update Fly.io secrets, revoke old token |
| `PAYMONGO_SECRET_KEY` | On compromise only | Contact PayMongo support to rotate |
| `STRIPE_SECRET_KEY` | On compromise only | Rotate in Stripe dashboard → Developers → API keys |

---

## 13. Networking and Security Groups

### 13.1 Inbound Traffic Allowed

| Source | Destination | Protocol/Port | Condition |
|--------|-------------|--------------|-----------|
| Internet | Cloudflare edge | TCP 443 (HTTPS) | All |
| Cloudflare edge | Vercel | TCP 443 | Proxied DNS record |
| Cloudflare edge | Fly.io `taxklaro-api` | TCP 443 | Proxied DNS record |
| Fly 6PN | `taxklaro-pdf` port 3002 | TCP (private) | Only `taxklaro-api.internal` |
| Fly 6PN | `taxklaro-batch` port 3003 | TCP (private) | Only `taxklaro-api.internal` |
| Supabase | None (client-only) | N/A | App initiates; no inbound from Supabase |

### 13.2 Outbound Traffic

| Source | Destination | Purpose |
|--------|-------------|---------|
| API server | Supabase pooler | Database queries |
| API server | `taxklaro-pdf.internal` | PDF generation requests |
| API server | `taxklaro-batch.internal` | Batch job enqueue |
| API server | `api.resend.com` | Email sending |
| API server | `api.paymongo.com` | Payment operations |
| API server | `api.stripe.com` | Payment operations |
| API server | `api.cloudflare.com` (R2) | PDF upload |
| API server | `oauth2.googleapis.com` | OAuth token exchange |
| PDF worker | Supabase pooler | Read computation data |
| PDF worker | R2 | PDF upload |
| Batch worker | Supabase pooler | Read/write computation data |
| Batch worker | `api.resend.com` | Batch completion emails |

---

## 14. Disaster Recovery

### 14.1 RTO and RPO Targets

| Component | RTO (Recovery Time Objective) | RPO (Recovery Point Objective) |
|-----------|-------------------------------|--------------------------------|
| Frontend (Vercel) | 5 minutes (Vercel redeploy) | 0 (stateless SSG/CSR) |
| API server | 2 minutes (Fly auto-restarts) | 0 (stateless; all state in DB) |
| Database | 2 hours (Supabase PITR restore) | 1 day (daily backup) / 5 minutes (PITR) |
| PDF worker | 5 minutes (Fly redeploy) | 0 (idempotent generation) |
| Batch worker | 10 minutes (Fly redeploy + Bull job retry) | 0 (jobs are durable in Redis) |

### 14.2 Failure Scenarios and Responses

| Failure | Detected By | Automated Response | Manual Response |
|---------|-------------|-------------------|-----------------|
| API server machine crash | Fly health check fails within 15s | Fly restarts machine within 30s; other machine handles traffic | Tail logs, investigate root cause |
| Database connection loss | API returns 503 on DB queries | N/A (no auto-reconnect at infra level; app-level retry x3) | Check Supabase status page; verify connection string |
| Supabase planned maintenance | Supabase status page | Maintenance window is Sunday 02:00–04:00 PHT; API returns 503 | Schedule known maintenance in advance; notify users |
| PDF worker crash | PDF export requests fail (API returns 500) | Fly restarts PDF worker within 30s; pending export retried once by API | Check `taxklaro-pdf` logs; verify Chromium binary exists |
| Batch worker crash | Bull job remains `active` without completion | Bull `stalled` detection after 30s; job re-queued automatically | Check `taxklaro-batch` logs; manually mark stalled jobs |
| R2 outage | PDF upload fails | API returns 500 for export requests | Retry manually after R2 recovery; no data loss (computation stored in DB) |
| PayMongo outage | Payment fails | Frontend shows "Payment temporarily unavailable, try Stripe" | Monitor paymongostatuspage.com |
| Vercel outage | Frontend unavailable | N/A (Vercel is sole frontend host) | Deploy to Cloudflare Pages as fallback (requires separate config, not pre-provisioned) |

---

## 15. Cost Estimates

### 15.1 Monthly Baseline (At Launch, <500 MAU)

| Service | Plan/Usage | Monthly Cost |
|---------|-----------|-------------|
| Vercel | Pro | $20 |
| Fly.io API (2×performance-2x) | ~$40 | $40 |
| Fly.io PDF worker (1×performance-2x, auto-stop) | ~$10 (low volume) | $10 |
| Fly.io Batch worker (1×shared-cpu-2x, auto-stop) | ~$5 | $5 |
| Supabase | Pro | $25 |
| Resend | Pro | $20 |
| Sentry | Team | $26 |
| Cloudflare | Pro | $20 |
| Cloudflare R2 | <1 GB, minimal operations | $1 |
| PayMongo | Per-transaction (variable) | $0 base |
| Stripe | Per-transaction (variable) | $0 base |
| **Total fixed** | | **$172/month** |

### 15.2 Scaling Triggers

| MAU | New Component | Cost Increase |
|-----|--------------|--------------|
| 5,000 | Supabase → Medium instance | +$25/month |
| 10,000 | API server → 3 machines | +$20/month |
| 20,000 | Supabase → Large instance | +$50/month |
| 50,000 | PDF worker → 2 machines | +$20/month |
| 100,000 | Dedicated Redis (Upstash Pro) | +$20/month |

---

*End of infrastructure.md*
