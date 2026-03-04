# Analysis: read-failure-logs

**Wave**: 1 — Source Acquisition
**Date**: 2026-03-04
**Sources**:
- `loops/inheritance-frontend-forward/frontier/analysis-log.md` — 5 documented failures from first manual run
- `loops/inheritance-frontend-reverse/frontier/aspects.md` — 3 documented spec failures

---

## Summary

Two failure logs document **8 distinct failures** across two loops. All failures stem from a common root cause: the platform layer (auth, routing, migrations, env config) was built during premium stages outside the original spec, with no spec-driven discipline or smoke-test gate.

---

## Source 1: Forward Loop — `inheritance-frontend-forward/frontier/analysis-log.md`

### Failure 1: Blank Page — Supabase Client Crashes Without Env Vars

**Severity**: CRITICAL — app completely non-functional
**File**: `src/lib/supabase.ts`

**What happened**: `supabase.ts` throws `Missing VITE_SUPABASE_URL environment variable` at module import time. This crashes the entire app before React renders anything. No `.env.local` was created during any forward loop stage (only `.env.local.example` existed).

**Fix applied**: Created `.env.local` with project credentials, created Supabase cloud project, ran migrations.

**Actionable item for spec**:
- `supabase.ts` must NOT throw at import time. Must fail gracefully with a visible setup instructions screen.
- An `.env.local.example` with all required vars and instructions must be documented.
- A "missing env vars" UI component must render instead of white-screen crash.

---

### Failure 2: Auth Page Is a Placeholder Stub

**Severity**: CRITICAL — app cannot be used at all
**File**: `src/routes/auth.tsx`

**What happened**: The auth route renders "Authentication will be implemented in Stage 3" — but Stage 3 in the plan is Zod Schemas. No auth form UI was ever built, even though:
- `lib/auth.ts` has complete signIn/signUp/signOut + Google OAuth + magic link functions
- `hooks/useAuth.ts` provides a complete React hook
- RLS policies on every table require `auth.uid()`

**Fix applied**: Replaced placeholder with functional sign-in/sign-up form using existing auth functions.

**Actionable item for spec**:
- `/auth` route needs a full sign-in/sign-up form spec: fields, validation, error states, success redirect.
- Spec must cover both sign-in and sign-up tabs/modes within the same page.
- Must cover: email/password fields, validation messages, loading state during submission, success redirect to `/`.
- Must cover: Google OAuth button placement and behavior.

---

### Failure 3: Landing Page Has No Auth CTA — Dead End for New Users

**Severity**: HIGH — new user has no path to sign up
**Files**: `src/routes/index.tsx`, `src/components/AppLayout.tsx` (sidebar)

**What happened**: `/` renders static text "Sign in to view your cases" with NO link or button to `/auth`. The sidebar nav lists Dashboard, New Case, Clients, Deadlines, Settings — but no Sign In entry. A new user visiting the app has zero affordance to discover authentication.

**Fix applied**: Added auth-aware landing page — unauthenticated users see Sign In / Create Account buttons; authenticated users see welcome message with New Case button.

**Actionable item for spec**:
- Landing page must have TWO views: unauthenticated (product description + Sign In + Create Account CTAs) and authenticated (dashboard with recent cases + New Case button).
- Sidebar must be auth-aware: unauthenticated visitors see Sign In link; authenticated users see all nav items plus Sign Out.
- Nav must NEVER show a dead-end state with no interactive path forward.

---

### Failure 4: Unregistered Routes — `/clients/new` Returns NOT FOUND

**Severity**: HIGH — features exist but are unreachable
**File**: `src/router.ts`

**What happened**: `routes/clients/new.tsx` exports `newClientRoute` and `routes/clients/$clientId.tsx` exports `clientDetailRoute`. Neither was imported or added to `router.ts` route tree. Clicking any link to these routes shows a 404 "Not Found" error.

**Fix applied**: Added both imports and route registrations to `router.ts`.

**Actionable item for spec**:
- The route table in the spec must be the single source of truth. Every exported route component must be accounted for.
- All routes in `routes/` must be registered in `router.ts` — spec must include a complete route registration checklist.
- The currently unregistered `/settings/team` route (found in `catalog-routes`) must be registered.

---

### Failure 5: Duplicate Migration Blocks Fresh Deploy

**Severity**: HIGH — blocks all fresh project deployments
**Files**: `supabase/migrations/006_case_documents.sql`, `supabase/migrations/001_initial_schema.sql`

**What happened**: Migration `006_case_documents.sql` creates `case_documents` table, which is already in `001_initial_schema.sql` (lines 291-317) with identical schema. `supabase db push` on a fresh project fails with `ERROR: relation "case_documents" already exists (SQLSTATE 42P07)`.

**Fix applied**: Replaced `006_case_documents.sql` with a no-op comment, preserving migration history consistency.

**Actionable item for spec**:
- Migration inventory must flag all duplicates.
- Rule: all premium-stage tables consolidated into `001_initial_schema.sql` must have their individual migration files replaced with no-op comments.
- Idempotency rule: never use bare `CREATE TABLE` — use `CREATE TABLE IF NOT EXISTS` or replace with no-op if 001 already covers it.

---

## Source 2: Reverse Loop — `inheritance-frontend-reverse/frontier/aspects.md`

### Failure 6: Children for Representation — Insufficiently Specified

**Severity**: MEDIUM — feature partially implemented with no picker UI
**File**: `src/components/PersonCard.tsx`

**What happened**: The spec mentioned `person.children` as a one-liner in the wizard-steps table. It was NOT sufficient because:
1. A multi-select PersonPicker doesn't exist — the shared PersonPicker is single-select only
2. No filter logic specified (exclude self, filter by relationship)
3. No helper text specified
4. No empty state specified ("Add children first, then link them here")
5. No explanation of how grandchildren work in the data model

The forward loop implemented a bare label stub with no actual picker.

**Fix applied**: Implemented `ChildrenForRepresentation` component in PersonCard.tsx with checkbox-based multi-select, self-exclusion filter, helper text, and empty state.

**Actionable item for spec**:
- `ChildrenForRepresentation` component must be documented in the component inventory.
- Any multi-select PersonPicker pattern must be explicitly specified — it cannot be derived from single-select PersonPicker.
- This is now built; spec must document the existing implementation as the reference.

---

### Failure 7: Authentication Flow — Completely Absent from Spec

**Severity**: CRITICAL — entire auth system never specified
**This is the same root failure as Failures 1, 2, 3 above, but from the reverse loop's perspective.**

**Root cause (reverse loop perspective)**: The reverse loop analyzed only the inheritance calculator domain (types, schemas, wizard, results) and entirely ignored the platform layer (auth, Supabase, routing registration, env configuration). The premium spec was never fed into the analysis pipeline. The forward loop's premium stages added auth infrastructure piecemeal without a spec.

**Actionable item for spec**:
- The entire §3 Authentication Flow section of the platform spec must be written from scratch.
- Must cover: sign-up, sign-in, session management, sign-out, password reset.
- Must specify exact form fields, validation rules, error messages, success redirects.
- Must cover Google OAuth flow from button click through callback to session establishment.

---

### Failure 8: Duplicate Migration — 006 Conflicts with 001

**Severity**: HIGH — blocks fresh deploy
**This is the same root failure as Failure 5 above, from the reverse loop's perspective.**

**Root cause (reverse loop perspective)**: The premium stages added individual migration files incrementally, then later consolidated tables into `001_initial_schema.sql` without removing the now-redundant individual files.

**Actionable item for spec**:
- The migrations spec (§5) must document the complete cleanup: which files are no-ops, which are canonical, and why.

---

## Consolidated Actionable Items

### CRITICAL
1. **supabase.ts graceful degradation** — Must not throw at import; must show setup instructions screen when env vars missing. File: `src/lib/supabase.ts`.
2. **Auth page functional form** — `/auth` route needs sign-in/sign-up form with all fields, validation, loading state, error display, success redirect. File: `src/routes/auth.tsx`.

### HIGH
3. **Landing page auth-awareness** — Two views: unauthenticated (CTA to sign up) and authenticated (dashboard). File: `src/routes/index.tsx`.
4. **Sidebar auth-awareness** — Sign In link for unauth users; Sign Out + all nav for auth users. File: `src/components/AppLayout.tsx`.
5. **Route registration completeness** — `/settings/team`, `/clients/new`, `/clients/$clientId` all registered. File: `src/router.ts`.
6. **Migration 006 no-op** — Replace with no-op comment to prevent fresh deploy failure. File: `supabase/migrations/006_case_documents.sql`.

### MEDIUM
7. **ChildrenForRepresentation component** — Already implemented; must be documented in spec as the reference multi-select person picker pattern.
8. **`CREATE TABLE IF NOT EXISTS`** — All migrations must use idempotent create syntax or be no-ops.

### NEW ASPECTS DISCOVERED
None — all items already covered by existing frontier aspects or by this spec itself.

---

## Relationship to Existing Catalog Findings

| Failure | Existing Catalog Coverage |
|---------|--------------------------|
| supabase.ts throws | `catalog-lib-hooks` — CRITICAL: supabase.ts throws on missing env vars (white-screen) |
| Auth page stub | `catalog-routes` — `/auth` route noted; `catalog-components` — stub noted |
| Landing page dead end | `catalog-routes` — dead end noted; `catalog-components` — auth-conditional nav MISSING |
| Unregistered routes | `catalog-routes` — /settings/team unregistered (CRITICAL) |
| Migration 006 duplicate | `catalog-migrations` — duplicate flagged |
| ChildrenForRepresentation | `catalog-components` — not explicitly cataloged; is a component that was patched post-failure |

All 8 failures are now accounted for in the catalog. No new frontier aspects needed.
