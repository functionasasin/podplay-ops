# Audit: Stack Assumptions — TaxKlaro Old Spec vs New Stack

**Date:** 2026-03-06
**Wave:** 1
**Status:** COMPLETE

---

## 1. Executive Summary

The old spec (`loops/freelance-tax-reverse/final-mega-spec/`) specced a 3-tier server-rendered architecture:
- **Frontend**: Next.js 15 App Router on Vercel
- **API**: Express 5.x on Fly.io (separate service)
- **Database**: PostgreSQL via Drizzle ORM + Redis/Upstash for rate limiting

The new stack is a client-side SPA architecture:
- **Frontend**: React 19 + Vite + TanStack Router on Fly.io (Docker)
- **Engine**: Rust compiled to WASM, runs in browser
- **Backend**: Supabase (Auth, PostgreSQL with RLS, RPC functions, Storage)
- **No API server** — computation is client-side WASM, persistence is Supabase direct

This audit catalogs every wrong-stack assumption and provides a translation map for subsequent waves.

---

## 2. Files to DISCARD (Entirely Wrong Stack)

These files contain content that has no analog in the new architecture. They must NOT be imported into the final mega-spec. Their domain concepts (tiers, features, roles) may be reused but the implementation details are irrelevant.

### 2.1 `api/endpoints.md`
**What it contains:** ~270 lines of Express 5.x REST API endpoint definitions including:
- `POST /api/v1/compute` — server-side tax computation
- `POST /api/v1/auth/login`, `POST /api/v1/auth/register`
- `GET/POST /api/v1/computations` — CRUD
- `POST /api/v1/batch/compute` — batch computation job queue
- `GET/POST /api/v1/clients` — CPA client management
- `POST /api/v1/pdf/export` — server-side PDF generation
- `GET/POST /api/v1/api-keys` — API key management
- HTTP status codes, rate limit headers, pagination patterns

**Translation:** No REST API. Computation → WASM call. CRUD → Supabase client SDK. PDF → `@react-pdf/renderer` in browser. Batch → multiple WASM calls. API keys → not applicable (ENTERPRISE feature becomes Supabase service role access if needed).

### 2.2 `api/auth.md`
**What it contains:** Custom auth system:
- Session cookie authentication with BLAKE2b-256 token hashing
- Argon2id password hashing (iterations=3, parallelism=1, memory=65536KB)
- Google OAuth 2.0 with account linking logic
- API key auth with scopes (compute:read, clients:write, batch:execute, admin)
- Session rotation on every request
- CSRF protection via Double Submit Cookie pattern
- `user_sessions` table, `oauth_accounts` table, `password_reset_tokens` table
- `email_verification_tokens` table
- Redis-backed rate limiting per user/IP

**Translation:** Supabase Auth handles ALL of this. PKCE email/password, optional magic link, session refresh via `supabase.auth.onAuthStateChange`. No custom session tables. No custom hashing. No Redis. CSRF not needed (Supabase uses PKCE, not cookies for cross-origin).

### 2.3 `api/rate-limiting.md`
**What it contains:** Server-side token bucket rate limiting:
- Redis/Upstash token bucket implementation
- Per-tier limits (FREE: 10 req/min, PRO: 60 req/min, ENTERPRISE: 300 req/min)
- IP-based rate limiting for anonymous users
- Sliding window algorithm specifics
- Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-Retry-After)

**Translation:** Not applicable. WASM computation runs locally — no rate limiting needed for compute. Supabase has built-in rate limiting for auth endpoints. Application-level limits (max computations per tier) enforced via RLS policies on the `computations` table (e.g., `COUNT(*) < seat_limit` check in INSERT policy).

### 2.4 `api/webhooks.md`
**What it contains:** Server webhook system:
- PayMongo webhook for payment events
- Stripe webhook for subscription events
- HMAC-SHA256 webhook signature verification
- Bull Queue for async webhook processing
- Webhook retry logic with exponential backoff

**Translation:** Supabase-native patterns. Supabase Edge Functions (if needed) or direct Stripe/PayMongo webhooks handled via Supabase Database Webhooks or serverless functions. For MVP, billing integration is deferred — payment collection is external (GCash/Maya invoicing), not automated subscription management.

### 2.5 `database/schema.md`
**What it contains:** Drizzle ORM schema for:
- `users` table with soft delete and `user_role_enum` (TAXPAYER/CPA/ADMIN)
- `user_sessions` table (custom session storage)
- `oauth_accounts` table (Google OAuth linking)
- `password_reset_tokens` table (BLAKE2b hashed)
- `email_verification_tokens` table
- `computations` table (reusable concept — column names differ)
- `computation_cwt_entries` and `computation_quarterly_payments` (reusable concept)
- `subscriptions` and `invoices` tables (Stripe/PayMongo billing)
- `cpa_clients` and `cpa_client_computations` tables (reusable → becomes `clients`)
- `api_keys` table with BLAKE2b hashing
- `audit_logs` and `pdf_exports` tables
- Token hashing: BLAKE2b-256

**What to reuse (as concepts only):** Table purposes for computations, clients, subscriptions. Column names and types need rewriting for Supabase (no Drizzle ORM syntax, use raw SQL with RLS).
**What to discard:** user_sessions, oauth_accounts, password_reset_tokens, email_verification_tokens (all handled by `auth.users`), api_keys, audit_logs as designed.

### 2.6 `database/migrations.md`
**What it contains:** Drizzle ORM migration tooling:
- `drizzle/meta/_journal.json` format
- `drizzle-kit generate` and `drizzle-kit migrate` commands
- Migration runner via Drizzle
- Seed script at `scripts/seed.ts` via `tsx`

**Translation:** Supabase SQL migrations in `supabase/migrations/` with sequential filenames (`001_initial_schema.sql`, `002_rls_policies.sql`, etc.). Run via `supabase db reset` and `supabase db push`. No Drizzle tooling.

### 2.7 `database/indexes.md`
**What it contains:** PostgreSQL index definitions designed around Express API query patterns (e.g., `idx_computations_user_id_created_at` for paginated list endpoints).

**Translation:** Index design is largely reusable concept-wise, but must be rewritten as raw SQL without Drizzle syntax. Index targets shift slightly (no session lookup indexes, no token hash lookup indexes).

### 2.8 `database/retention.md`
**What it contains:** Data retention policies with server-side scheduled jobs (Bull cron jobs) for purging deleted users' computations after 90 days.

**Translation:** Supabase pg_cron extension or Supabase Edge Functions cron for scheduled cleanup. The 90-day retention policy is reusable; the implementation mechanism changes.

### 2.9 `deployment/infrastructure.md`
**What it contains:** Multi-service architecture:
- Vercel (Next.js frontend) — `sin1` region
- Fly.io API server (Express, Node.js 22) — `sin` region, 2 instances
- Fly.io PDF Worker (Puppeteer + Node.js) — separate Fly app
- Fly.io Batch Worker (Bull Queue + Node.js) — separate Fly app
- Supabase PostgreSQL
- Redis (Upstash) for rate limiting
- Resend for email
- PayMongo + Stripe for billing
- Cloudflare R2 for assets
- Sentry for errors

**Translation:** Single Fly.io deployment (Docker → serve static build on port 8080). No API server. No PDF worker (PDF is client-side). No Batch worker (batch is multiple WASM calls). No Redis. Email via Supabase Auth built-in (magic links, confirmation) + Resend for custom notifications (optional). Supabase Storage replaces Cloudflare R2.

### 2.10 `deployment/ci-cd.md`
**What it contains:** GitHub Actions pipeline for:
- Node.js tests (vitest)
- Next.js type checking
- ESLint
- Vercel deployment
- Fly.io API deployment
- Fly.io PDF/Batch worker deployment
- Database migration run

**Translation:** Simplified pipeline: typecheck (tsc) → lint → vitest → vite build → playwright E2E → fly deploy (single app). No multi-service coordination. No Vercel CLI.

### 2.11 `deployment/monitoring.md`
**What it contains:** Server-side monitoring:
- Fly.io Prometheus metrics for Express server
- Redis memory usage alerts
- Express request latency (p50/p95/p99)
- Bull Queue depth monitoring
- Custom health check endpoint at `/api/health`

**Translation:** Client-side monitoring via Sentry (error rates, WASM computation failures). Fly.io health check on port 8080 (HTTP GET /). No server metrics. No queue monitoring.

### 2.12 `deployment/domains.md`
**What it contains:** Split domain routing:
- `taxklaro.ph` → Vercel (Next.js)
- `api.taxklaro.ph` → Fly.io (Express API)
- Cloudflare WAF rules for `api.taxklaro.ph`

**Translation:** Single domain `taxklaro.ph` → Fly.io. Supabase project URL used directly for all backend calls (no custom `api.taxklaro.ph`). Cloudflare DNS → Fly.io only.

### 2.13 `deployment/environment.md`
**What it contains:** Environment variables for multiple services:
- API server: `DATABASE_URL`, `REDIS_URL`, `SESSION_SECRET`, `APPLICATION_SECRET_KEY`, `ARGON2ID_DUMMY_HASH`, `RESEND_API_KEY`, `PAYMONGO_*`, `STRIPE_*`, `R2_*`, `SENTRY_DSN`
- Frontend: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_GA4_MEASUREMENT_ID`
- PDF/Batch workers: their own sets

**Translation:** Only VITE_* env vars for the frontend Vite build:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`
- `VITE_SENTRY_DSN` (optional)
- `VITE_GA4_MEASUREMENT_ID` (optional)

---

## 3. Files Needing Adaptation (Reusable Content, Wrong-Stack References)

These files have reusable content but contain specific wrong-stack references that must be translated.

### 3.1 `frontend/responsive-behavior.md`

**Wrong-stack references:**
| Line | What it says | What it should say |
|------|-------------|-------------------|
| 18 | "...needed to write Next.js component code" | "...needed to write React/Vite component code" |
| 41 | Section heading: "Next.js Implementation Notes" | "Vite/React Implementation Notes" |
| 99 | "It is a static Next.js page (no authentication required)" | "It is a static React route (no authentication required)" |
| 536-587 | Entire Section 16 "Next.js Implementation Notes" | Rewrite for Vite/React patterns (no `<Image>` component, no SSR, no `next/image`) |
| 557 | `Next.js <Image>` component with `sizes` prop | Standard `<img>` with `srcset` or `vite-imagetools` |
| 587 | "Server-Side Rendering Considerations" | Remove entirely — app is client-side SPA |

**Reusable content:** Breakpoints (mobile 375-767px, tablet 768-1023px, desktop 1024px+), layout rules, component-level responsive behavior — all framework-agnostic.

### 3.2 `frontend/results-views.md`

**Wrong-stack references:**
| Line | What it says | What it should say |
|------|-------------|-------------------|
| 12 | `- API endpoints: [api/endpoints.md]` | Remove — computation is WASM, no API endpoint |

**Reusable content:** All 25 sections describing result sections (RV-01 through RV-13), layout specs, formatting rules, mobile adaptations, loading/error/empty states — all framework-agnostic and fully reusable.

### 3.3 `frontend/validation-rules.md`

**Wrong-stack references:**
| Location | What it says | What it should say |
|----------|-------------|-------------------|
| Section 9 title | "Client-Side vs Server-Side Validation Boundary" | "Client-Side vs Engine Validation Boundary" |
| §9.2 heading | "Server-Side Only (API required)" | "Engine-Only (WASM required)" |
| Line 544 | "submit to `POST /api/v1/compute`" | "call `compute(input)` on the WASM bridge" |
| §9.2 table | "Why server-side" column refers to HTTP API | "Why engine-only" — validation that requires full data model (e.g., regime eligibility) runs in WASM engine |
| Layer 2 description | "Server-Side (Engine)" | "WASM Engine (client-side)" — must clarify engine runs in browser |

**Reusable content:** All per-field validation rules (§1-§8), min/max values, regex patterns, cross-field dependencies, error messages. The validation LOGIC is unchanged; only the execution context changes from "HTTP POST" to "WASM call".

### 3.4 `frontend/wizard-steps.md`

**Wrong-stack references:**
| Location | What it says | What it should say |
|----------|-------------|-------------------|
| §1.1 | `"Save and continue later" link (Pro feature): saves current wizard state to user's account; visible after authentication` | Reusable concept; save goes to Supabase `computations` table via Supabase client SDK, not to Express API |

**Reusable content:** All 14 wizard step specifications (WS-00 through WS-13), all field specs, routing matrix, global validation constraints, dynamic advisories. Fully reusable with minor translation.

### 3.5 `frontend/user-journeys.md`

**Wrong-stack references:**
| Location | What it says | What it should say |
|----------|-------------|-------------------|
| UJ-01 Option A | "Save computation (requires free account creation)" — implies server API POST | Save via Supabase client SDK to `computations` table |
| UJ-07 (CPA) | References client management API (`/clients/*` endpoints) | Client management via Supabase CRUD (no API server) |
| UJ-01 Option B | "Download summary PDF (requires Pro upgrade)" | PDF via `@react-pdf/renderer` in browser, gated by org plan in Supabase |

**Reusable content:** All 8 user journeys (UJ-01 through UJ-08), screen flows, step-by-step details, edge case handling. Journeys describe USER experience — technology is an implementation detail.

### 3.6 `ui/component-library.md`

**Wrong-stack references:**
- Entirely custom component implementations. Must be REPLACED with shadcn/ui equivalents.
- The 13 custom components (Button, Input, Select, Checkbox, RadioGroup, Spinner, ProgressBar, Alert, Badge, Tooltip, Table, Tabs, Modal/Dialog) map 1:1 to shadcn/ui components.
- The exact visual specs (colors, sizes, variants) are reusable as the DESIGN SPEC for customizing shadcn defaults.

**Mapping (old custom → shadcn/ui):**
| Old Component | shadcn/ui Equivalent | Notes |
|---|---|---|
| Button | `Button` | Keep variants (primary/secondary/ghost/danger/link) via variant prop |
| TextInput / PesoInput | `Input` + custom wrapper | Peso prefix needs custom InputGroup pattern |
| Select / ComboBox | `Select` or `Combobox` (cmdk) | |
| Checkbox | `Checkbox` | |
| RadioGroup | `RadioGroup` | |
| Spinner | Not in shadcn — use `lucide-react` `Loader2` with `animate-spin` | |
| ProgressBar | `Progress` | |
| Alert / Banner | `Alert` with `AlertTitle` + `AlertDescription` | |
| Badge / StatusPill | `Badge` | |
| Tooltip | `Tooltip` with `TooltipContent` | |
| DataTable | `Table` | |
| Tabs | `Tabs` with `TabsList`, `TabsTrigger`, `TabsContent` | |
| Modal/Dialog | `Dialog` | |

### 3.7 `premium/tiers.md`

**Wrong-stack references:**
| Location | What it says | What it should say |
|----------|-------------|-------------------|
| §6 | "API-Level Gate Enforcement" — references Express middleware, `req.user.subscription_tier` | Supabase RLS policies: `WHERE org.plan = 'PRO'` in SELECT policies on gated tables |
| §6 | Rate limit enforcement via Redis token bucket | Not applicable for WASM-based compute. Application-level limits (max saves per month) via RLS COUNT check |
| §7 | "Frontend Gate Behavior" — references API returning 403 | Frontend checks `organization.plan` from `useOrganization()` hook. Show upgrade prompt if plan insufficient. |
| §8 | Plan resolution via `req.user` on API server | Plan resolution via `useOrganization()` hook reading `organizations.plan` from Supabase |
| §12 | API keys as ENTERPRISE feature | API key system not applicable in client-side WASM architecture. ENTERPRISE → multi-seat org + batch WASM processing in browser. |
| §14 | PayMongo + Stripe integration via server webhooks | External invoicing for MVP. Automated billing deferred post-launch. |

**Reusable content:** Tier names (FREE/PRO/ENTERPRISE), monthly/annual pricing (₱0/₱200/₱1,499/₱1,999/₱14,999), feature lists (what's in each tier), trial periods (14 days PRO, 7 days ENTERPRISE), upgrade/downgrade rules, money-back guarantee. All pricing/feature content is reusable.

### 3.8 `premium/professional-features.md`

**Wrong-stack references:**
- Section 4 ("API Key System") — entirely Express-based, no analog in new stack
- All references to `POST /api-keys/*` endpoints
- Batch API via API key authentication

**Reusable content:**
- Section 1 (Client Management overview) — reusable concept → maps to `clients` table + Supabase CRUD
- Section 2 (White-label PDF) — reusable concept → `@react-pdf/renderer` with firm branding from `user_profiles`
- Section 3 (Batch Computation) — reusable concept → multiple WASM calls in browser, not server-side queue
- Section 5 (Team/Org Management) — reusable concept → org model via Supabase

### 3.9 `premium/features-by-tier.md`

**Wrong-stack references:**
- References to API access, API keys, rate limits per tier

**Reusable content:** The feature matrix table itself is highly reusable — it defines exactly what each tier can/cannot do. Only the enforcement mechanism changes (from Express middleware to Supabase RLS + frontend gate).

---

## 4. Files Fully Reusable (No Adaptation Needed)

These files contain content that is technology-agnostic and can be imported verbatim into the final mega-spec.

| File | Why Reusable |
|------|-------------|
| `domain/legal-basis.md` | Pure legal/regulatory content |
| `domain/computation-rules.md` | Pure business logic |
| `domain/decision-trees.md` | Pure business logic |
| `domain/scenarios.md` | Pure business logic |
| `domain/edge-cases.md` | Pure business logic |
| `domain/manual-review-flags.md` | Pure business logic |
| `domain/bir-form-1701-field-mapping.md` | Pure regulatory content |
| `domain/bir-form-1701a-field-mapping.md` | Pure regulatory content |
| `domain/lookup-tables/*.md` | All pure tables |
| `engine/pipeline.md` | Pure Rust algorithm |
| `engine/data-model.md` | Pure Rust type definitions |
| `engine/invariants.md` | Pure mathematical invariants |
| `engine/error-states.md` | Error codes/messages (implementation-agnostic) |
| `engine/test-vectors/*.md` | Pure test data |
| `frontend/copy.md` | User-facing text only; "Resend email" is Supabase-compatible |
| `ui/design-system.md` | Color tokens, typography — keep brand blue #1D4ED8 |
| `ui/responsive.md` | Breakpoints and layout rules — framework-agnostic |
| `ui/branding.md` | Brand identity content |
| `ui/accessibility.md` | a11y requirements — framework-agnostic |
| `legal/terms-of-service.md` | Legal text |
| `legal/privacy-policy.md` | Legal text |
| `legal/disclaimers.md` | Legal text |
| `legal/limitations.md` | Legal text |
| `seo-and-growth/seo-strategy.md` | SEO content/strategy |
| `seo-and-growth/content-strategy.md` | Content strategy |
| `seo-and-growth/landing-page.md` | Landing page copy/layout |
| `premium/pricing.md` | Pricing copy/rationale |

---

## 5. Comprehensive Translation Map

This is the reference table for subsequent waves. Every time a wrong-stack concept appears, use this table.

### 5.1 Runtime and Execution

| Old Concept | Old Implementation | New Implementation |
|-------------|-------------------|-------------------|
| Tax computation | Express POST /api/v1/compute | WASM `compute_json(input_json: string): string` |
| Server-side validation | Express middleware + Zod on server | WASM engine validates input; client-side Zod for pre-submit |
| PDF generation | Puppeteer on Fly.io PDF Worker | `@react-pdf/renderer` in browser (lazy-loaded) |
| Batch computation | Bull Queue + Node.js worker | Multiple WASM calls in browser loop |
| Real-time updates | Server-Sent Events / WebSocket | N/A — WASM is synchronous, no streaming needed |

### 5.2 Authentication

| Old Concept | Old Implementation | New Implementation |
|-------------|-------------------|-------------------|
| Session auth | BLAKE2b session tokens in HttpOnly cookie | Supabase JWT in localStorage (managed by Supabase SDK) |
| Password hashing | Argon2id (custom server code) | Supabase Auth (Bcrypt + Scrypt internally) |
| Password reset | Custom token (BLAKE2b), stored in `password_reset_tokens` | Supabase `supabase.auth.resetPasswordForEmail()` |
| Email verification | Custom token flow | Supabase email confirmation (PKCE) |
| OAuth (Google) | Custom OAuth 2.0 + `oauth_accounts` table | Supabase `supabase.auth.signInWithOAuth({provider: 'google'})` |
| API keys | Custom `api_keys` table with BLAKE2b hashes, scope enum | Not applicable in new architecture |
| CSRF protection | Double Submit Cookie pattern | Not needed (JWT in Authorization header, not cookie) |
| Session rotation | Per-request session refresh | Supabase handles token refresh automatically |
| Session storage | `user_sessions` PostgreSQL table | Supabase `auth.sessions` (managed, not custom) |

### 5.3 Database Access

| Old Concept | Old Implementation | New Implementation |
|-------------|-------------------|-------------------|
| ORM | Drizzle ORM v0.38 | No ORM — Supabase client SDK + raw SQL in migrations |
| Migrations | `drizzle-kit generate` + `drizzle-kit migrate` | `supabase/migrations/*.sql` + `supabase db push` |
| Schema definition | TypeScript Drizzle schema files | Raw SQL `CREATE TABLE` in migration files |
| Authorization | Server middleware reads `req.user.role` | Supabase RLS policies on every table |
| Row-level filtering | SQL WHERE clauses in Express query builders | RLS: `auth.uid() = user_id` or `org_id IN (SELECT user_org_ids())` |
| Rate limiting storage | Redis/Upstash token bucket | Not applicable (no server) |
| Transactions | Drizzle `db.transaction()` | Supabase RPC with `BEGIN`/`COMMIT` in SQL |
| Stored procedures | None | Supabase RPC functions (PostgreSQL functions) |

### 5.4 Deployment and Infrastructure

| Old Concept | Old Implementation | New Implementation |
|-------------|-------------------|-------------------|
| Frontend hosting | Vercel (Next.js edge network) | Fly.io (Docker → static file serve on port 8080) |
| Frontend framework | Next.js 15 App Router | React 19 + Vite + TanStack Router |
| API hosting | Fly.io (Express 5.x, Node.js 22) | No API server |
| PDF worker | Fly.io (Puppeteer, separate Fly app) | No separate worker — client-side PDF |
| Batch worker | Fly.io (Bull Queue, Node.js, separate Fly app) | No separate worker — client-side WASM loop |
| CDN/Assets | Cloudflare R2 + CDN | Supabase Storage (S3-compatible) |
| Email service | Resend (server webhook) | Supabase Auth built-in for auth emails; Resend optional for custom |
| Redis/cache | Upstash Redis | Not needed |
| Frontend env vars | `NEXT_PUBLIC_*` | `VITE_*` |
| Environment variable injection | Vercel Dashboard / `vercel env add` | Fly.io build args (`--build-arg VITE_SUPABASE_URL=...`) |

### 5.5 Premium Feature Gating

| Old Concept | Old Implementation | New Implementation |
|-------------|-------------------|-------------------|
| Tier check | Express middleware reads `req.user.subscription_tier` | `useOrganization()` hook reads `organizations.plan` |
| Feature gate (API) | HTTP 403 with `ERR_SUBSCRIPTION_REQUIRED` | Client-side: show `<UpgradePrompt>` component |
| Feature gate (DB) | SQL WHERE filters in Express queries | Supabase RLS: INSERT policy checks `org.plan IN ('PRO', 'ENTERPRISE')` |
| Compute rate limit | Redis token bucket, tier-specific | Not applicable — WASM is local, no rate limit |
| Save limit (10/month free) | Redis counter + SQL count | RLS INSERT policy: `(SELECT COUNT(*) FROM computations WHERE user_id=auth.uid() AND created_at > date_trunc('month', now())) < 10` |
| API key access | ENTERPRISE tier, `api_keys` table | Not applicable |
| Batch API | POST /api/v1/batch + Bull Queue | ENTERPRISE: client-side WASM loop, UI shows progress bar |

### 5.6 Routing

| Old Concept | Old Implementation | New Implementation |
|-------------|-------------------|-------------------|
| Page routing | Next.js App Router (`app/page.tsx`, `app/compute/page.tsx`) | TanStack Router file-based (`routes/index.tsx`, `routes/computations/new.tsx`) |
| Auth guards | Next.js middleware (`middleware.ts`) | TanStack Router `beforeLoad` with `throw redirect()` |
| Dynamic routes | `app/computations/[id]/page.tsx` | `routes/computations/$compId.tsx` |
| Server Components | React Server Components (RSC) | No RSC — all components are client components |
| Data fetching | `async` Server Components, `fetch()` on server | Supabase client queries in hooks/useEffect |
| Image optimization | `next/image` `<Image>` | Standard `<img>` or Vite's `import.meta.glob` for local assets |

---

## 6. Key Database Concept Translations

The old `database/schema.md` has reusable TABLE CONCEPTS but wrong column definitions. Here is the mapping:

### 6.1 Users / Auth
Old spec has: `users` (with custom session/token fields), `user_sessions`, `oauth_accounts`, `password_reset_tokens`, `email_verification_tokens`

New spec: Only `user_profiles` table extending `auth.users`. All auth state lives in Supabase `auth` schema (managed). User profile extends with: `full_name`, `firm_name`, `firm_address`, `logo_url`, `tin`, `rdo_code`.

### 6.2 Computations
Old spec: `computations` + `computation_cwt_entries` + `computation_quarterly_payments`

New spec: Keep the same concept with these changes:
- Remove foreign key to `users.id` — use `user_id UUID REFERENCES auth.users(id)`
- Add `org_id UUID REFERENCES organizations(id)` for org-scoped access
- Add `share_token UUID DEFAULT gen_random_uuid()` and `share_enabled BOOLEAN DEFAULT false`
- `status` enum: `draft | computed | finalized | archived` (matches inheritance pattern)
- `computation_cwt_entries` and `computation_quarterly_payments` tables are reusable as-is (just change FK constraint to reference Supabase UUID pattern)

### 6.3 CPA Clients → `clients`
Old spec: `cpa_clients` (only accessible to `CPA` role)

New spec: `clients` table scoped to `org_id`. Role is controlled by org membership (`organization_members.role`), not a user-level enum. Any org member can manage clients; role within org determines permissions.

### 6.4 Subscriptions → `organizations.plan`
Old spec: Separate `subscriptions` table linked to `users.id` (Stripe/PayMongo managed)

New spec: `plan` column on `organizations` table (`free | pro | enterprise`). No automated billing for MVP. Plan is set manually or via Supabase admin. Subscription management deferred.

---

## 7. Summary of New Aspects Needed

Based on this audit, no new aspects need to be added to the frontier — the existing Wave 2-6 aspects already cover everything discovered here. Key reminders for subsequent waves:

1. **Wave 2 (Bridge):** `validation-rules.md §9` uses "POST /api/v1/compute" — must translate to WASM call in bridge contract
2. **Wave 3 (Frontend Data Model):** `premium/tiers.md §7` frontend gate behavior must use `useOrganization()` hook, not API 403 response
3. **Wave 4 (Platform):** `supabase-migrations` must cover: org model (not user-level plan), share_token on computations, `clients` table (not `cpa_clients`), `user_profiles` (not `users`)
4. **Wave 4 (Premium gating):** Monthly save limit enforced via RLS COUNT subquery on INSERT, not Redis
5. **Wave 5 (UI):** `ui/component-library.md` must be replaced with shadcn/ui mapping (see §3.6 above)
6. **Wave 6 (Deployment):** Single Fly.io app, not 4 services. No Redis. No Vercel. No Upstash.

---

## 8. Files Classification Summary

| Category | Files | Action |
|----------|-------|--------|
| **DISCARD** | `api/endpoints.md`, `api/auth.md`, `api/rate-limiting.md`, `api/webhooks.md`, `database/schema.md`, `database/migrations.md`, `database/indexes.md`, `database/retention.md`, `deployment/infrastructure.md`, `deployment/ci-cd.md`, `deployment/monitoring.md`, `deployment/domains.md`, `deployment/environment.md` | Do not import into mega-spec |
| **ADAPT** | `frontend/responsive-behavior.md`, `frontend/results-views.md`, `frontend/validation-rules.md`, `frontend/wizard-steps.md`, `frontend/user-journeys.md`, `ui/component-library.md`, `premium/tiers.md`, `premium/professional-features.md`, `premium/features-by-tier.md` | Import with corrections per §3 |
| **IMPORT AS-IS** | All `domain/`, all `engine/`, `frontend/copy.md`, `ui/design-system.md`, `ui/responsive.md`, `ui/branding.md`, `ui/accessibility.md`, all `legal/`, all `seo-and-growth/`, `premium/pricing.md` | Copy verbatim |
