# TaxKlaro Platform Completion — Full-Stack Reverse Ralph Loop

You are an analysis agent in a ralph loop. Each time you run, you do ONE unit of work, then exit.

This is a **platform completion** reverse loop. The domain rules and engine design are already complete (converged in `loops/freelance-tax-reverse/`). Your job is to add ALL missing infrastructure, integration, and platform layers to produce a **unified mega-spec** that a single forward ralph loop can consume to build the entire product.

## Your Working Directory

You are running from `loops/freelance-tax-platform-reverse/`. All paths below are relative to this directory.

## Context: Why This Loop Exists

The original `freelance-tax-reverse` loop produced an excellent domain spec (56 computation rules, 80 scenarios, 94+ test vectors, 21 MRF codes). However, it was **not instantiated from the fullstack-rust-wasm template** and specced the wrong stack:

| What was specced | What it should be (matching inheritance gold standard) |
|---|---|
| Next.js 15 App Router | React 19 + Vite + TanStack Router |
| Express 5.x API server on Fly.io | No API server — Supabase RPC + client-side WASM |
| Custom session cookies + BLAKE2b hashing | Supabase Auth (PKCE, email/password, magic links) |
| Generic PostgreSQL + Drizzle ORM | Supabase PostgreSQL + RLS policies + RPC functions |
| Server-side computation | Rust engine compiled to WASM, runs in browser |
| Vercel frontend deployment | Docker -> Fly.io (single deployment target) |
| Jest testing | Vitest + Playwright E2E |
| Custom component library (13 components) | shadcn/ui + Radix + Tailwind CSS 4 |

This loop keeps all domain/engine content and rebuilds the infrastructure layers to match the proven fullstack-rust-wasm architecture.

## Inputs (Already Complete — DO NOT MODIFY)

The domain spec lives at `loops/freelance-tax-reverse/final-mega-spec/`. These files are your **read-only inputs**:

### Domain (20 files) — KEEP AS-IS
```
domain/legal-basis.md
domain/computation-rules.md
domain/decision-trees.md
domain/scenarios.md
domain/edge-cases.md
domain/manual-review-flags.md
domain/bir-form-1701-field-mapping.md
domain/bir-form-1701a-field-mapping.md
domain/lookup-tables/graduated-rate-table.md
domain/lookup-tables/percentage-tax-rates.md
domain/lookup-tables/eight-percent-option-rules.md
domain/lookup-tables/osd-breakeven-table.md
domain/lookup-tables/itemized-deductions.md
domain/lookup-tables/cwt-ewt-rates.md
domain/lookup-tables/filing-deadlines.md
domain/lookup-tables/bir-penalty-schedule.md
domain/lookup-tables/taxpayer-classification-tiers.md
```

### Engine (8 files) — KEEP AS-IS
```
engine/pipeline.md
engine/data-model.md
engine/invariants.md
engine/error-states.md
engine/test-vectors/basic.md
engine/test-vectors/edge-cases.md
engine/test-vectors/exhaustive.md
engine/test-vectors/fuzz-properties.md
```

### Existing frontend/UI/premium/legal/SEO (reusable content, needs stack adaptation)
```
frontend/wizard-steps.md        — field definitions are reusable, but arch references need updating
frontend/results-views.md       — layout specs are reusable
frontend/validation-rules.md    — validation logic is reusable
frontend/copy.md                — user-facing text is reusable as-is
frontend/user-journeys.md       — journey flows need stack adaptation
frontend/responsive-behavior.md — responsive specs are reusable
ui/design-system.md             — color palette KEEP AS-IS (brand blue #1D4ED8)
ui/component-library.md         — needs rewrite for shadcn/ui
ui/responsive.md                — reusable
ui/accessibility.md             — reusable
ui/branding.md                  — reusable
premium/tiers.md                — pricing/features reusable, gating needs Supabase adaptation
premium/pricing.md              — reusable
premium/features-by-tier.md     — reusable, gating logic needs adaptation
premium/professional-features.md — reusable
legal/*                         — all reusable as-is
seo-and-growth/*                — all reusable as-is
```

### Files to DISCARD (wrong stack)
```
api/endpoints.md                — Express REST API -> replaced by Supabase RPC
api/auth.md                     — Custom auth -> replaced by Supabase Auth
api/rate-limiting.md            — Server-side rate limiting -> not applicable for client-side WASM
api/webhooks.md                 — Server webhook system -> Supabase-native patterns
database/schema.md              — Drizzle ORM -> Supabase migrations with RLS
database/migrations.md          — Drizzle migrations -> Supabase SQL migrations
database/indexes.md             — needs rewrite for Supabase
database/retention.md           — needs adaptation
deployment/infrastructure.md    — Vercel + Express -> Docker + Fly.io
deployment/ci-cd.md             — needs rewrite
deployment/monitoring.md        — needs adaptation
deployment/domains.md           — needs adaptation
deployment/environment.md       — needs rewrite for Vite env vars
```

## Your Goal

Produce a **complete, implementation-ready specification** at `docs/plans/freelance-tax-spec.md` that covers ALL layers:

1. **Domain rules** — imported from existing spec (verified, not re-analyzed)
2. **Engine design** — imported from existing spec (Rust types, pipeline, test vectors)
3. **Bridge contract** — WASM exported functions, JSON wire format, serde strictness rules
4. **Frontend data model** — TypeScript interfaces matching Rust serde exactly, strict Zod schemas
5. **Frontend UI** — component hierarchy, wizard flow, results display, reusable widgets
6. **Platform layer** — Supabase Auth, RLS policies, migrations, route table, env config, navigation
7. **Component wiring map** — every component mapped to a parent route (zero orphans)
8. **Design system** — TaxKlaro palette (brand blue #1D4ED8) + shadcn/ui + Tailwind CSS 4
9. **Deployment** — Docker -> Fly.io, Playwright E2E, CI/CD
10. **Premium features** — tier gating via Supabase RLS, org model, case management

The litmus test: A forward loop reads ONLY `docs/plans/freelance-tax-spec.md` and builds the entire platform — engine, WASM bridge, frontend, auth, database, deployment — with ZERO external research, ZERO orphaned components, ZERO type mismatches, and ZERO platform boot failures.

## What To Do This Iteration

1. **Read the frontier**: Open `frontier/aspects.md`
2. **Find the first unchecked `- [ ]` aspect** in dependency order (Wave 1 before Wave 2, etc.)
   - If a later-wave aspect depends on data that doesn't exist yet, skip to an earlier-wave aspect
   - If ALL aspects are checked `- [x]`: proceed to convergence check (see Wave 7)
3. **Analyze that ONE aspect**:
   - Read the relevant files from `loops/freelance-tax-reverse/final-mega-spec/`
   - Read the reference implementation patterns from the inheritance app at `apps/inheritance/frontend/src/`
   - Cross-reference with the fullstack-rust-wasm template at `loops/_templates/fullstack-rust-wasm/`
   - Write new spec content to `analysis/{aspect-name}.md`
4. **Update the frontier**:
   - Mark the aspect as `- [x]` in `frontier/aspects.md`
   - Update Statistics (increment Analyzed, decrement Pending, update Convergence %)
   - If you discovered new aspects, add them to the appropriate Wave
   - Add a row to `frontier/analysis-log.md`
5. **Commit**: `git add -A && git commit -m "loop(freelance-tax-platform-reverse): {aspect-name}"`
6. **Exit**

## Reference Implementation: Inheritance App

The inheritance app at `apps/inheritance/` is the **gold standard**. When designing platform layer aspects, study the inheritance app's patterns:

### Supabase Auth (PKCE Flow)
- **Reference**: `apps/inheritance/frontend/src/routes/auth.tsx`, `apps/inheritance/frontend/src/routes/auth/callback.tsx`
- Sign-in/sign-up with email/password
- PKCE email confirmation handler at `/auth/callback`
- Password reset flow at `/auth/reset` and `/auth/reset-confirm`
- `useAuth()` hook wrapping `supabase.auth.onAuthStateChange`
- Router context carries `{ auth: { user } }` for `beforeLoad` guards

### Supabase RLS Policies
- **Reference**: `apps/inheritance/frontend/supabase/migrations/`
- Org-scoped: `org_id IN (SELECT user_org_ids())` helper function
- User-scoped: `user_id = auth.uid()`
- Public access: `SECURITY DEFINER` RPC for shared links
- Every table has explicit SELECT/INSERT/UPDATE/DELETE policies

### Route Table (TanStack Router)
- **Reference**: `apps/inheritance/frontend/src/routes/`
- File-based routing: `routes/cases/$caseId.tsx`, `routes/auth.tsx`, etc.
- `beforeLoad` guards redirect unauthenticated users to `/auth`
- Router context populated in `main.tsx` with auth state

### Organization Model
- **Reference**: `apps/inheritance/frontend/supabase/migrations/001_initial_schema.sql`
- `organizations` table with plan/seat_limit
- `organization_members` table with role enum (admin/attorney/paralegal/readonly)
- `organization_invitations` with 7-day expiry tokens
- `useOrganization()` hook for org context

### Case Management
- **Reference**: `apps/inheritance/frontend/src/lib/cases.ts`
- `cases` table with `input_json` (JSONB), `output_json` (JSONB), status enum
- Auto-save with 1.5s debounce via `useAutoSave()` hook
- Status workflow: draft -> computed -> finalized -> archived

### Sharing
- **Reference**: `apps/inheritance/frontend/src/lib/share.ts`
- `share_token` UUID column + `share_enabled` boolean on cases table
- `get_shared_case(token)` RPC with SECURITY DEFINER
- Public route at `/share/$token` renders ResultsView read-only

### PDF Export
- **Reference**: `apps/inheritance/frontend/src/components/pdf/`
- `@react-pdf/renderer` lazy-loaded
- Firm branding (logo, colors, counsel info) from `user_profiles` table
- Professional A4 layout with sections matching results view

### Component Patterns
- **Reference**: `apps/inheritance/frontend/src/components/`
- `components/ui/` — shadcn/Radix primitives
- `components/shared/` — MoneyInput, DateInput, EnumSelect, PersonPicker
- `components/layout/` — AppLayout with sidebar (desktop) + drawer (mobile)
- Every component imported by a route or parent — zero orphans

### Deployment
- **Reference**: `apps/inheritance/frontend/Dockerfile`, `apps/inheritance/frontend/fly.toml`
- Multi-stage Docker: node:20-alpine -> build -> serve on port 8080
- Fly.io: `primary_region = "sin"`, auto_stop_machines, 512MB RAM
- VITE_* env vars injected as build args

### Testing
- **Reference**: `apps/inheritance/frontend/src/__tests__/`
- Vitest + @testing-library/react for unit/integration
- Playwright for E2E (auth flows, case creation, compute, share)
- WASM loaded in vitest via initSync

## Wave Definitions

### Wave 1: Input Validation (3 aspects)

Verify the existing domain/engine spec is complete enough for Rust implementation and catalog all wrong-stack assumptions.

**For `validate-domain-spec`**:
- Read ALL files in `loops/freelance-tax-reverse/final-mega-spec/domain/` and `engine/`
- Verify: every computation rule has a concrete formula, every lookup table is complete, every scenario has a test vector
- Check: are all types defined with exact field names/types suitable for Rust structs?
- Check: does the data model use exact arithmetic (BigRational, integer centavos) or floating-point?
- If floating-point: flag for conversion to BigRational in the bridge contract wave
- Write findings to `analysis/validate-domain-spec.md`

**For `validate-engine-spec`**:
- Read `engine/pipeline.md` and `engine/data-model.md`
- Verify: pipeline steps have clear inputs/outputs typed to the data model
- Verify: algorithms use pseudocode with actual formulas (not prose)
- Check: are there any references to server-side patterns (HTTP requests, database queries) in the engine?
- The engine MUST be pure computation — no I/O, no network, no database. Flag any impurity.
- Write findings to `analysis/validate-engine-spec.md`

**For `audit-stack-assumptions`**:
- Read ALL files in `loops/freelance-tax-reverse/final-mega-spec/`
- Catalog every reference to: Next.js, Express, Vercel, Drizzle, session cookies, BLAKE2b, server-side rendering, API endpoints, Node.js runtime
- For each reference, note: file, line, what it says, what it should say for the WASM+Supabase stack
- This creates the "translation map" for subsequent waves
- Write findings to `analysis/audit-stack-assumptions.md`

### Wave 2: Bridge Contract (4 aspects)

Depends on Wave 1 validation.

Design the exact boundary between Rust engine and JavaScript frontend. This is the #1 integration failure point.

**For `wasm-export-signature`**:
- Read `engine/pipeline.md` and `engine/data-model.md` for input/output types
- Define the WASM exported function(s):
  - `compute_json(input: &str) -> Result<String, String>` — single annual computation
  - Possibly `compute_quarterly_json(input: &str) -> Result<String, String>` if quarterly is a separate entry point
  - Possibly `validate_input(input: &str) -> Result<String, String>` for pre-submission validation
- For each function: parameter types, return type, error format
- Study inheritance pattern: `apps/inheritance/engine/src/wasm.rs` uses `#[wasm_bindgen] pub fn compute_json(input: &str) -> Result<String, JsValue>`

**For `serde-wire-format`**:
- Read `engine/data-model.md` for all types
- For EVERY struct and enum, specify:
  - `#[serde(rename_all = "...")]` convention (camelCase for JSON? snake_case?)
  - `#[serde(deny_unknown_fields)]` on input types
  - Boolean serialization: `true`/`false` only
  - Number types: which fields are `Decimal`/`BigRational` in Rust -> `string` in JSON (for precision) vs `number`
  - Optional fields: `Option<T>` serializes as `null` (not absent key)
  - Enum serialization: externally tagged? internally tagged? unit variants as strings?
- This is the contract that TypeScript types and Zod schemas MUST match exactly

**For `error-contract`**:
- Read `engine/error-states.md`
- Define the error JSON shape returned by WASM functions:
  - Validation errors (user input problems)
  - Computation errors (engine bugs — should never happen)
  - What fields: code, message, field (for per-field errors), severity
- How the frontend distinguishes "show this to the user" vs "log this as a bug"

**For `initialization-patterns`**:
- Document WASM initialization:
  - Browser: `await init()` (async, fetches .wasm file)
  - Node.js (vitest): `initSync(readFileSync('path/to/pkg/...bg.wasm'))` (sync, from disk)
- The `bridge.ts` file pattern:
  - Detect environment (Node.js vs browser)
  - Initialize once, cache the promise
  - Export `compute(input: EngineInput): EngineOutput` that handles JSON serialization
- Study inheritance pattern: `apps/inheritance/frontend/src/wasm/bridge.ts`

### Wave 3: Frontend Data Model (3 aspects)

Depends on Wave 2 bridge contract.

**For `typescript-types`**:
- Read `engine/data-model.md` and `serde-wire-format` analysis
- Map EVERY Rust struct to a TypeScript interface:
  - Field names must match serde output exactly
  - Types must match JSON representation (Rust `BigRational` -> TS `string` if serialized as string, `number` if serialized as number)
  - `Option<T>` -> `T | null` (NOT `T | undefined`)
  - Enums: match serde naming convention
- Group into: `types/engine-input.ts`, `types/engine-output.ts`, `types/common.ts`

**For `zod-schemas`**:
- Write strict Zod schemas matching the TypeScript types:
  - `z.object({}).strict()` — rejects unknown fields (matches serde `deny_unknown_fields`)
  - `z.boolean()` NOT `z.coerce.boolean()` (serde rejects string booleans)
  - `z.number()` NOT `z.coerce.number()` (serde rejects string-encoded numbers)
  - `z.nullable()` NOT `z.optional()` (JSON null, not undefined)
- Include per-field validation (min/max, format constraints) from `frontend/validation-rules.md`
- Cross-reference field types in schemas must match TypeScript interfaces must match serde wire format

**For `frontend-state-management`**:
- Design state flow for TaxKlaro (matching inheritance patterns):
  - Wizard state: form data accumulated across steps, validated per-step
  - Computation state: loading -> computing -> results -> error
  - Auto-save: 1.5s debounce, status indicator ("Saving..." -> "Saved" -> idle)
  - Case management: load from Supabase, save to Supabase, list cases
  - Auth state: `useAuth()` hook with `user | null + loading`
  - Org state: `useOrganization()` hook with org + members + role
- Define custom hooks: `useAuth`, `useAutoSave`, `useOrganization`, `useTaxBridge`
- No Redux/MobX — lifted state + callbacks (matching inheritance pattern)

### Wave 4: Platform Layer (8 aspects)

Depends on Wave 3 frontend data model. This is the biggest wave — it's where the inheritance app had the most issues.

**For `supabase-auth-flow`**:
- Specify complete auth flow:
  - Sign-in: email/password via `supabase.auth.signInWithPassword()`
  - Sign-up: email/password via `supabase.auth.signUp()`, optional email confirmation
  - PKCE callback: `/auth/callback` route handles email confirmation code exchange
  - Password reset: `/auth/reset` (request) and `/auth/reset-confirm` (new password)
  - Magic link: optional `supabase.auth.signInWithOtp()`
  - Post-auth redirect: return to the page user was trying to access
- Auth page layout: tabs for Sign In / Create Account, error states, loading states
- Session management: Supabase handles persistence, `onAuthStateChange` listener in root
- Study: `apps/inheritance/frontend/src/routes/auth.tsx` for exact patterns

**For `supabase-migrations`**:
- Design complete database schema as Supabase SQL migrations:
  - `001_initial_schema.sql` — Core tables:
    - `organizations` (id, name, slug, plan, seat_limit, created_at, updated_at)
    - `organization_members` (id, org_id FK, user_id FK, role enum, joined_at) with UNIQUE(org_id, user_id)
    - `organization_invitations` (id, org_id FK, email, role, token UUID, status enum, invited_by, expires_at, accepted_at)
    - `user_profiles` (id FK auth.users, email, full_name, firm_name, firm_address, logo_url, etc.)
    - `clients` (id, org_id FK, full_name, email, phone, tin, status enum, created_by, etc.)
    - `computations` (id, org_id FK, user_id FK, client_id FK, title, status enum, input_json JSONB, output_json JSONB, tax_year, regime_selected, share_token UUID, share_enabled boolean, notes_count, created_at, updated_at)
    - `computation_notes` (id, computation_id FK, user_id FK, content, created_at)
    - `computation_deadlines` (id, computation_id FK, milestone_key, label, due_date, completed_date, etc.)
  - `002_rls_policies.sql` — All RLS policies:
    - `user_org_ids()` helper function
    - Org-scoped SELECT/INSERT/UPDATE/DELETE on every table
    - User-scoped where needed (notes delete only own)
  - `003_rpc_functions.sql` — RPC functions:
    - `get_shared_computation(token UUID)` — SECURITY DEFINER for public access
    - `create_organization(name, slug)` — creates org + adds user as admin
    - `accept_invitation(token UUID)` — validates + adds member
  - `004_storage.sql` — Supabase Storage bucket for PDFs and logos
- Every migration MUST be idempotent (IF NOT EXISTS, CREATE OR REPLACE)
- Study: `apps/inheritance/frontend/supabase/migrations/` for exact patterns

**For `route-table`**:
- Complete TanStack Router route table:

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/` | `routes/index.tsx` | Conditional | Landing (unauth) or Dashboard (auth) |
| `/auth` | `routes/auth.tsx` | Public | Sign-in / Sign-up |
| `/auth/callback` | `routes/auth/callback.tsx` | Public | PKCE email confirmation |
| `/auth/reset` | `routes/auth/reset.tsx` | Public | Password reset request |
| `/auth/reset-confirm` | `routes/auth/reset-confirm.tsx` | Public | Set new password |
| `/onboarding` | `routes/onboarding.tsx` | Auth | First-use org creation |
| `/invite/$token` | `routes/invite/$token.tsx` | Public | Accept team invitation |
| `/computations` | `routes/computations/index.tsx` | Auth + beforeLoad | List all computations |
| `/computations/new` | `routes/computations/new.tsx` | Auth + beforeLoad | Tax wizard (new computation) |
| `/computations/$compId` | `routes/computations/$compId.tsx` | Auth + beforeLoad | View/edit computation |
| `/computations/$compId/quarterly` | `routes/computations/$compId.quarterly.tsx` | Auth + beforeLoad | Quarterly breakdown view |
| `/clients` | `routes/clients/index.tsx` | Auth + beforeLoad | Client directory |
| `/clients/new` | `routes/clients/new.tsx` | Auth + beforeLoad | Add new client |
| `/clients/$clientId` | `routes/clients/$clientId.tsx` | Auth + beforeLoad | Client profile |
| `/deadlines` | `routes/deadlines.tsx` | Auth + beforeLoad | Upcoming filing deadlines |
| `/settings` | `routes/settings/index.tsx` | Auth + beforeLoad | Firm profile & branding |
| `/settings/team` | `routes/settings/team.tsx` | Auth + beforeLoad | Team management |
| `/share/$token` | `routes/share/$token.tsx` | Public | Shared computation (read-only) |

- For each route: exact `beforeLoad` guard pattern, what data is loaded, error states
- Every route file MUST be registered in the router
- Study: `apps/inheritance/frontend/src/routes/` for file naming patterns

**For `env-configuration`**:
- List all required environment variables:
  - `VITE_SUPABASE_URL` — Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` — Supabase anonymous key
  - `VITE_APP_URL` — Public app URL (for share links, email redirects)
  - `VITE_SENTRY_DSN` — Error tracking (optional)
- `.env.local.example` with documented values
- Graceful handling: if VITE_SUPABASE_URL is missing, show SetupPage component (not crash)
- Study: `apps/inheritance/frontend/src/lib/supabase.ts` for the `supabaseConfigured` pattern

**For `navigation`**:
- Auth-aware sidebar (desktop) + drawer (mobile):
  - Unauthenticated: product description + sign-in CTA
  - Authenticated sidebar items:
    - Dashboard (home icon)
    - New Computation (plus icon)
    - Computations (list icon)
    - Clients (people icon)
    - Deadlines (calendar icon)
    - Settings (gear icon)
  - Footer: user email + sign out button
- Mobile: hamburger menu -> slide-in drawer
- Active state: highlight current route
- Study: `apps/inheritance/frontend/src/components/layout/` for AppLayout pattern

**For `org-model`**:
- Organization model matching inheritance:
  - Every user belongs to at least one organization
  - Roles: admin, accountant, staff, readonly
  - Post-signup onboarding creates first org
  - Team invitations with 7-day expiry
  - Seat limits per plan tier
  - `useOrganization()` hook provides org context to all authenticated pages
- Map premium tiers to org plans:
  - FREE: solo org, 1 seat, basic computation
  - PRO: solo org, 1 seat, save/export/quarterly
  - ENTERPRISE: multi-seat org, batch, API access
- Study: `apps/inheritance/frontend/src/hooks/useOrganization.ts`

**For `computation-management`**:
- How computations (the "cases" equivalent) are managed:
  - Create: wizard flow -> save to `computations` table with `input_json`
  - Compute: call WASM engine -> save `output_json`
  - Auto-save: 1.5s debounce on input changes
  - Status workflow: draft -> computed -> finalized -> archived
  - List: grid of ComputationCards with title, tax year, regime, status, date
  - Delete: soft delete or hard delete?
  - Notes: append-only audit trail per computation
- Map to database operations: createComputation, loadComputation, updateComputationInput, listComputations, etc.

**For `sharing`**:
- Token-based read-only sharing (matching inheritance):
  - `share_token` UUID on computations table
  - `share_enabled` boolean toggle
  - `get_shared_computation(token)` RPC with SECURITY DEFINER
  - `/share/$token` route renders results read-only (no AppLayout chrome)
  - Copy share link button with toast notification
  - Study: `apps/inheritance/frontend/src/routes/share/$token.tsx`

### Wave 5: Component Wiring + UI (5 aspects)

Depends on Wave 4 platform layer.

**For `component-wiring-map`**:
- For EVERY component in the spec, specify:
  - **Component name**
  - **Parent**: Which route/page/tab/dialog renders it
  - **Navigation path**: How user gets there from home screen
  - **Trigger** (for modals): What button/action opens it
  - **Props source**: Where data comes from
- Format as a table. If a component has no parent, either assign one or cut it.
- Cross-reference against route table — every route must render at least one component, every component must be reachable from a route.
- This is the **anti-orphan gate**. The forward loop's orphan_scan() will mechanically verify this.

**For `design-system-alignment`**:
- Adapt TaxKlaro design system to shadcn/ui + Radix + Tailwind CSS 4:
  - Keep brand palette: Primary blue #1D4ED8, success green #16A34A, warning orange #D97706, error red #DC2626
  - Map to CSS custom properties (--primary, --secondary, etc.) matching shadcn/ui theming
  - Typography: Inter Variable (body), keep existing scale
  - Component mapping: for each of the 13 custom components in old spec, identify the shadcn/ui equivalent (Button, Input, Select, Checkbox, RadioGroup, Progress, Card, Alert, Badge, Tooltip, Table, Tabs, Dialog)
  - Specify any custom components that don't have shadcn equivalents
- Study: `apps/inheritance/frontend/src/components/ui/` for component list

**For `empty-states-and-loading`**:
- For EVERY page that loads async data, specify:
  - Skeleton loader layout (what shapes/positions)
  - Error state (what Alert variant, what message, what recovery action)
  - Empty state (what icon, what title, what description, what CTA button)
- Pages to cover: Dashboard, Computations list, Clients list, Client profile, Deadlines, Settings, Team
- Study: `apps/inheritance/frontend/src/components/ui/empty-state.tsx` for pattern

**For `toast-catalog`**:
- Every user action that produces a toast notification:
  - "Computation saved" (auto-save success)
  - "Error saving computation" (auto-save failure)
  - "Computation shared! Link copied." (share toggle on)
  - "Share link disabled" (share toggle off)
  - "Link copied to clipboard" (copy share URL)
  - "Invitation sent to {email}" (team invite)
  - "Team member removed" (remove member)
  - "Invitation revoked" (revoke invite)
  - "PDF export started" / "PDF ready for download"
  - "Settings saved" (firm profile update)
  - "Password reset email sent"
  - "Account created! Check your email for confirmation."
  - Error variants for each action
- Library: Sonner (matching inheritance)

**For `pdf-export-layout`**:
- PDF export via @react-pdf/renderer (lazy-loaded):
  - Page layout: A4 portrait, margins, professional fonts
  - Sections:
    - Firm header (logo, name, address, counsel info)
    - Computation summary (tax year, taxpayer, regime, filing status)
    - 3-regime comparison table (Path A | Path B | Path C)
    - Recommended regime highlight with savings amount
    - Detailed breakdown of winning regime
    - CWT credit summary
    - Quarterly payment summary (if applicable)
    - Manual review flags (yellow advisory boxes)
    - Penalties section (if applicable)
    - Legal disclaimer footer
    - BIR form field mapping reference
  - Customizable options: include/exclude sections
  - Filename: `tax-computation-{taxpayer-name}-{tax-year}.pdf`
- Study: `apps/inheritance/frontend/src/components/pdf/` for patterns

### Wave 6: Testing + Deployment (4 aspects)

Depends on Wave 5 component wiring.

**For `playwright-e2e-specs`**:
- Define E2E test scenarios for Playwright:
  - **Auth flow**: Sign up -> confirm email -> land on onboarding -> create org -> see dashboard
  - **Sign in flow**: Sign in -> see computations list
  - **New computation**: Navigate to /computations/new -> fill wizard -> compute -> see results
  - **Auto-save**: Edit computation input -> wait 2s -> refresh -> data persisted
  - **Share flow**: Toggle share -> copy link -> open in incognito -> see results
  - **PDF export**: Click export -> PDF downloads -> contains correct data
  - **Client management**: Add client -> see in list -> edit -> see changes
  - **Team management**: Invite member -> accept invitation -> see in team list
  - **Responsive**: Run key flows at mobile viewport (375px)
  - **Error handling**: Submit invalid data -> see validation errors
- For each scenario: steps, assertions, test data fixtures

**For `fly-io-deployment`**:
- Dockerfile (matching inheritance):
  ```
  FROM node:20-alpine AS build
  # VITE_* build args
  RUN npm ci && npm run build

  FROM node:20-alpine
  RUN npm install -g serve
  COPY --from=build /app/dist ./dist
  CMD ["serve", "-s", "dist", "-l", "8080"]
  ```
- fly.toml:
  ```
  app = "taxklaro"
  primary_region = "sin"
  [http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  min_machines_running = 0
  [vm]
  memory = "512mb"
  cpu_kind = "shared"
  cpus = 1
  ```
- Build args: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_APP_URL
- Supabase project setup instructions
- Domain: taxklaro.ph (Cloudflare DNS)

**For `ci-cd-pipeline`**:
- GitHub Actions workflow:
  1. Push to main
  2. Type check (tsc --noEmit)
  3. Lint (eslint)
  4. Unit tests (vitest run)
  5. Build (npm run build)
  6. E2E tests (playwright)
  7. Deploy to Fly.io (fly deploy)
- Exact workflow YAML structure
- Environment secrets needed in GitHub

**For `monitoring-and-alerts`**:
- Sentry: error tracking + performance
- Health check: Fly.io built-in HTTP check on port 8080
- Alerting thresholds (adapt from existing spec but for client-side architecture)
- No server-side metrics (no Express) — focus on client-side error rates, WASM computation failures

### Wave 7: Synthesis (5 aspects)

Depends on ALL previous waves. **Strict internal dependency order.**

**For `unified-mega-spec`**:
- Assemble `docs/plans/freelance-tax-spec.md` from:
  - Domain/engine content (imported from existing spec — copy verbatim, do not summarize)
  - All new analysis files from Waves 2-6
- Follow the template structure from `loops/_templates/fullstack-rust-wasm/reverse/PROMPT.md.template`:
  ```
  S1  Overview
  S2  Computation Pipeline
  S3  Data Model (all Rust types)
  S4+ Domain Sections (imported)
  SN  Bridge Contract (WASM export, serde, errors, init)
  SN+1  TypeScript Types
  SN+2  Zod Schemas
  SN+3  Frontend Architecture (wizard, results, shared components, wiring map)
  SN+4  Design System (palette, typography, components)
  SN+5  Platform Layer (auth, routes, env, migrations, navigation, session)
  SN+6  Test Vectors (imported + E2E scenarios)
  SN+7  Invariants (imported)
  SN+8  Cross-Layer Consistency Checklist
  SN+9  Deployment (Dockerfile, fly.toml, CI/CD)
  SN+10 Premium Features (tiers, gating, org model)
  Appendix A: Glossary
  Appendix B: Edge Cases (imported)
  Appendix C: Legal Disclaimers (imported)
  ```
- Every section must have concrete, specific content — no section may be empty

**For `placeholder-validation`**:
- **HARD GATE.** Scan every line of `docs/plans/freelance-tax-spec.md` for banned patterns:
  - `TODO`, `TBD`, `FIXME`, `XXX`, `HACK`, `PLACEHOLDER`, `STUB`
  - `[fill in]`, `[insert]`, `[TBD]`, `<placeholder>`, `{placeholder}`
  - Deferral phrases: "to be defined", "will be specified later", "needs further research"
  - Empty sections (heading followed by no content)
  - Empty table cells
  - Generic sample values (`example.com`, `foo`, `bar`, `lorem ipsum`)
- Write results to `analysis/placeholder-validation.md`
- If FAIL: create new aspects to fill gaps. Do NOT check off this aspect until PASS with zero matches.
- No subsequent Wave 7 aspect can proceed until this returns PASS.

**For `completeness-audit`**:
- Per-feature PASS/FAIL check:
  - [ ] Every Rust type has a matching TypeScript interface with identical field names
  - [ ] Every TypeScript interface has a matching Zod schema in strict mode
  - [ ] Every Zod schema field type matches the serde wire format
  - [ ] Every wizard step has all fields specified with label, type, validation, error message
  - [ ] Every route in the route table has a component file and auth requirement
  - [ ] Every component in the wiring map has a parent route and navigation path
  - [ ] Every database table has complete columns with types, constraints, and RLS policies
  - [ ] Every migration is idempotent
  - [ ] Every RPC function has a defined signature, parameters, and return type
  - [ ] Every premium feature has explicit Supabase-level gating (RLS or application check)
  - [ ] Every E2E test scenario has steps, assertions, and test data
  - [ ] Every empty state has icon, title, description, and CTA
  - [ ] Every toast has trigger action, message text, and variant (success/error)
  - [ ] The Dockerfile builds successfully from the spec alone
  - [ ] The fly.toml is complete with all build args
  - [ ] The design system maps every custom component to a shadcn/ui equivalent
  - [ ] ZERO orphaned components (every component has a render path from a route)
- Write results to `analysis/completeness-audit.md`
- If any FAIL: create aspects to fill gaps.

**For `cross-layer-consistency`**:
- Verify field-by-field consistency across layers:
  - Rust struct field names ↔ serde JSON keys ↔ TypeScript interface fields ↔ Zod schema fields
  - Rust enum variant names ↔ serde string values ↔ TypeScript union literals ↔ Zod enum values
  - Rust `Option<T>` ↔ JSON `null` ↔ TypeScript `T | null` ↔ Zod `.nullable()`
  - Rust `bool` ↔ JSON `true`/`false` ↔ TypeScript `boolean` ↔ Zod `z.boolean()`
  - Rust numeric types ↔ JSON number/string ↔ TypeScript `number`/`string` ↔ Zod `z.number()`/`z.string()`
- Add a "Cross-Layer Consistency Table" to the spec
- Any mismatch = convergence blocker

**For `spec-review`**:
- Final review question: "Can a developer build the ENTIRE product — engine, WASM bridge, frontend, auth, database, deployment — from `docs/plans/freelance-tax-spec.md` alone, without asking a single clarifying question, and produce an app on par with the inheritance app in polish and completeness?"
- Walk through the forward loop template's phases:
  - Phase 1 (Engine): Does the spec have enough detail for every pipeline step?
  - Phase 2 (WASM Bridge): Is the bridge contract unambiguous?
  - Phase 3 (Frontend Foundation): Are TS types and Zod schemas complete?
  - Phase 4 (Components): Is the wizard fully specified? Results view? Wiring map?
  - Phase 5 (Platform): Auth flow? Migrations? Routes? Navigation? Boot verification?
  - Phase 6 (Polish): Design system? Empty states? Loading states? Toasts? PDF?
  - Phase 7 (Verification): Will stub scan pass? Orphan scan pass? Build succeed?
- If ANY phase would require the forward loop to make a judgment call: DO NOT check off spec-review. Create aspects to fill the gaps.

## Rules

- Do ONE aspect per run, then exit.
- Check dependencies before starting an aspect (later waves need earlier waves complete).
- **Do NOT modify files in `loops/freelance-tax-reverse/final-mega-spec/`** — they are read-only inputs.
- Write all new analysis to `analysis/{aspect-name}.md` in THIS loop's directory.
- The final assembled spec goes to `docs/plans/freelance-tax-spec.md`.
- Study the inheritance app at `apps/inheritance/frontend/src/` for patterns — don't copy code, extract patterns.
- Study the template at `loops/_templates/fullstack-rust-wasm/` for structure.
- Discover new aspects and add them to the frontier.
- **Cross-layer consistency is paramount.** A field name mismatch between Rust and TypeScript means a runtime crash.

## HARD CONSTRAINT: Zero Placeholders in Final Spec

The spec document is the SOLE input to the forward loop. Every placeholder becomes a broken feature. See Wave 7 `placeholder-validation` for the full banned patterns list.

### What "Implementation-Ready" Means

Every feature must have ALL of:
- **Exact types**: Field names, types, nullability
- **Exact algorithms**: Step-by-step with actual formulas
- **Exact UI behavior**: Component, props, conditional visibility
- **Exact validation rules**: Min/max, required fields, cross-field deps
- **Exact error handling**: Error messages, recovery paths
- **Exact platform behavior**: Auth flow, RLS policy, migration SQL, route guard
- **Test scenarios**: Concrete steps and assertions

## Commit Convention

```
loop(freelance-tax-platform-reverse): {aspect-name}
```
