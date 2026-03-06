# Analysis: Supabase Gotchas — Auth, RLS, RPCs, Storage

**Wave:** 6 — Testing + Deployment
**Aspect:** supabase-gotchas
**Date:** 2026-03-06
**Sources:** database-migrations.md, sharing.md, migration-verification.md, auth-flow.md

---

## Overview

This aspect catalogs every Supabase-specific failure mode that the forward loop must handle
correctly. It is organized into five areas: anon role grants, SECURITY DEFINER search_path,
RLS bypass patterns, storage bucket policies, and auth email confirmation in development.

Each item includes: what goes wrong, how to detect it, and the exact fix.

---

## 1. Anon Grants for Public RPCs

### The Problem

Supabase Postgres functions default to requiring authentication. Any function called from the
browser without a session uses the `anon` role. Without an explicit `GRANT EXECUTE TO anon`,
the function returns empty results or a "permission denied" error — not always an explicit error
message. The inheritance app experienced exactly this: `get_shared_computation` silently returned
null for all tokens because the `anon` role had no `EXECUTE` grant.

### Which RPCs Need `anon` Grants

| Function | Needs anon? | Reason |
|----------|-------------|--------|
| `get_shared_computation(p_token UUID)` | **YES** | Public share links work without login |
| `create_organization(...)` | No | Requires authenticated user (`auth.uid()` used in function body) |

### The Fix (in migration SQL)

```sql
-- 20240101000008_create_rpc_get_shared_computation.sql

-- ALWAYS revoke from PUBLIC first, then grant only to specific roles
REVOKE ALL ON FUNCTION public.get_shared_computation(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_computation(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_shared_computation(UUID) TO authenticated;
```

### Verification

```sql
-- Must return true — if false, share links silently fail
SELECT has_function_privilege('anon', 'public.get_shared_computation(uuid)', 'execute');
-- Expected: true

-- Must return false — anon cannot create orgs
SELECT has_function_privilege('anon', 'public.create_organization(text,text,text)', 'execute');
-- Expected: false
```

### Detection Pattern in Code

If `supabase.rpc('get_shared_computation', ...)` always returns `{ data: null, error: null }`
for valid tokens when called from an unauthenticated client — the anon grant is missing.
The frontend `SharedResultsPage` will always show `InvalidShareLinkView` with no error logged.

---

## 2. `search_path` on SECURITY DEFINER Functions

### The Problem

`SECURITY DEFINER` functions run with the permissions of the function owner (usually `postgres`),
not the caller. This bypasses RLS — intentionally, for functions like `get_shared_computation`
that need to join `shared_links` and `computations` without the anon user having direct table
access.

However, without `SET search_path = public`, a malicious or unintentional schema injection could
cause the function to resolve table names against a different schema, leading to privilege
escalation or unexpected behavior. PostgreSQL documentation recommends always setting `search_path`
explicitly on `SECURITY DEFINER` functions.

### The Fix

Every `SECURITY DEFINER` function in this app must include `SET search_path = public`:

```sql
CREATE OR REPLACE FUNCTION public.get_shared_computation(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public    -- REQUIRED: prevents search_path injection
AS $$
...
$$;

CREATE OR REPLACE FUNCTION public.create_organization(
  p_name TEXT, p_slug TEXT, p_industry TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public    -- REQUIRED
AS $$
...
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public    -- REQUIRED even for non-SECURITY DEFINER trigger functions
AS $$
...
$$;
```

### Verification

```sql
-- Verify search_path is set on all functions
SELECT proname, proconfig
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND proname IN ('get_shared_computation', 'create_organization', 'handle_updated_at');
-- Expected: proconfig includes 'search_path=public' for each function
```

---

## 3. RLS Bypass Patterns for Shared Data

### Pattern 1: SECURITY DEFINER + anon GRANT (the sharing pattern)

The `anon` role cannot read `computations` or `shared_links` directly — RLS policies on both
tables require `auth.uid()` which returns null for unauthenticated users. To allow public access
to shared computations, the app uses a `SECURITY DEFINER` function that runs as `postgres`,
bypasses RLS, and returns only the authorized subset of data.

```
anon browser → supabase.rpc('get_shared_computation', {p_token}) →
  [PostgREST checks EXECUTE grant for anon role → passes] →
  [function runs as postgres owner, bypasses RLS] →
  [WHERE sl.token = p_token AND c.status = 'shared' AND c.output IS NOT NULL] →
  returns JSONB or NULL
```

**Critical detail:** Even though the function bypasses RLS internally, it applies its own data
filter (token match + status check). This is the "manual RLS" inside the function body.

### Pattern 2: Never Grant Table Access to anon

The `anon` role must never have direct SELECT on `computations`, `shared_links`, or any other
app table. The RPC is the sole access point for unauthenticated data retrieval.

```sql
-- Verify anon cannot read computations directly (no explicit GRANT needed — RLS blocks it)
-- RLS policies on computations use USING (user_id = auth.uid())
-- auth.uid() returns NULL for anon role → policy evaluates to false → empty result set
```

**Verification:**
```typescript
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const { data } = await anonClient.from('computations').select('*')
// data must be [] — not an error, just empty (RLS silently filters everything)
```

### Pattern 3: Service Role Bypasses ALL RLS

The Supabase service role key (`SUPABASE_SERVICE_ROLE_KEY`) bypasses all RLS policies. It is
used only in:
- Server-side integration tests (to seed test data)
- CI/CD migration scripts

**The service role key must NEVER be included in the frontend bundle or .env.local committed
to the repository.** The frontend uses only `VITE_SUPABASE_ANON_KEY`.

```bash
# .env.local.example (safe to commit — no real keys)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<from supabase start output>
# SUPABASE_SERVICE_ROLE_KEY is only used in server-side tests, never in frontend
```

### Pattern 4: RLS on organization_members Is Self-Referential

The `organization_members` SELECT policy uses:
```sql
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid()
  )
)
```

This is a self-referential join — `organization_members` reads from itself. This works because
PostgreSQL evaluates the subquery with the same user's RLS context, and `user_id = auth.uid()`
is a direct column check (not another RLS-gated query). However, this creates a recursive policy
evaluation that can be slow on large tables. For the expected scale of this app (tens of thousands
of members, not millions), this is acceptable.

**If performance becomes an issue:** Add an explicit GIN index on `organization_id` (already
specified in database-migrations.md) and consider denormalizing org membership into the JWT
claims via a custom Supabase auth hook.

---

## 4. Storage Bucket Policies

This app does not use Supabase Storage for its primary data path (computations are stored as
JSONB in PostgreSQL). However, storage may be needed for:

- CSV file uploads for batch computation
- PDF exports cached for sharing

### Option A: No Storage (Recommended for V1)

Process CSV files entirely in the browser (parse with Papa Parse, pass array to WASM engine,
never upload the file to Supabase). Generate PDFs client-side with @react-pdf/renderer and
trigger browser download. This eliminates storage complexity entirely.

**This is the V1 approach.** No Supabase Storage buckets are needed.

### Option B: Storage for Large Batch Files (Future)

If batch CSVs exceed browser memory limits (files > 50MB), upload to Supabase Storage and
process server-side via an edge function.

**If Option B is implemented, these bucket policies are required:**

```sql
-- Create a private bucket for batch CSV uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'batch-uploads',
  'batch-uploads',
  false,              -- private bucket (not public)
  52428800,           -- 50MB limit
  ARRAY['text/csv', 'application/csv', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: users can upload to their own folder
CREATE POLICY "users_upload_own_files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'batch-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- RLS policy: users can read their own files
CREATE POLICY "users_read_own_files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'batch-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );

-- RLS policy: users can delete their own files
CREATE POLICY "users_delete_own_files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'batch-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
  );
```

**File path convention:** `{user_id}/{batch_computation_id}.csv`

For V1, this entire section is skipped. The forward loop must NOT create any storage buckets
or storage-related migrations.

---

## 5. Auth Email Confirmation in Development

### The Problem

Supabase Auth requires email confirmation by default. In local development, this means every
new account creation redirects to a "Check your email" page and the user cannot sign in until
they click the confirmation link. This slows down development and E2E testing.

### The Fix: Disable Confirmation in Dev Config

In `supabase/config.toml` (local development config, not production):

```toml
[auth]
site_url = "http://localhost:5173"
additional_redirect_urls = ["http://localhost:5173/auth/callback"]

# Disable email confirmation for local development — speeds up manual testing and E2E
enable_confirmations = false

# Optional: Use Supabase's built-in Inbucket for email preview
[auth.email]
enable_signup = true
double_confirm_changes = false
enable_confirmations = false
```

**For E2E tests (Playwright):** The `enable_confirmations = false` setting allows test accounts
to sign in immediately after `signUp()` completes without waiting for email confirmation.

### Production Config

Production uses the Supabase dashboard settings (not `config.toml`). Email confirmation should
be **enabled** in production. The forward loop sets `enable_confirmations = false` only for the
local `supabase/config.toml` — this file is never deployed.

### Auth Email Redirects for Production

Production requires `site_url` and `additional_redirect_urls` to be configured in the Supabase
dashboard (not in `config.toml`):

- Site URL: `https://retirementpay.app`
- Additional redirect URLs: `https://retirementpay.app/auth/callback`

The auth callback route (`/auth/callback`) handles:
- Email confirmation redirect (`?code=...&type=signup`)
- Password reset redirect (`?code=...&type=recovery`)
- Magic link redirect (`?code=...&type=magiclink`)

All use the PKCE code exchange flow: `supabase.auth.exchangeCodeForSession(code)`.

### Inbucket for Local Email Testing

Supabase local dev includes Inbucket, an email catcher available at `http://localhost:54324`.
When `enable_confirmations = true` is needed for local testing (e.g., testing the confirmation
flow itself), check Inbucket for the confirmation email and click the link.

```bash
# Check Inbucket UI
open http://localhost:54324
```

---

## 6. Additional Supabase Gotchas

### 6a. Supabase Client Singleton

The Supabase client must be instantiated once and reused across the app. Creating multiple
instances causes auth state desync.

```typescript
// src/lib/supabase.ts — SINGLE instance, import everywhere
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,  // Required for PKCE callback
  },
})
```

### 6b. PKCE Flow Requires `detectSessionInUrl: true`

Magic link and OAuth flows pass the auth code as a URL query parameter
(`?code=...`). The Supabase client must have `detectSessionInUrl: true` (the default) to
automatically exchange the code for a session when the auth callback page loads.

Without this, the `/auth/callback` route must manually call
`supabase.auth.exchangeCodeForSession(code)` after extracting `code` from the URL.
The spec uses the manual approach for clarity:

```typescript
// src/pages/auth/AuthCallbackPage.tsx
import { useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/auth/callback' })

  useEffect(() => {
    const code = (search as Record<string, string>).code
    if (!code) {
      navigate({ to: '/auth/sign-in' })
      return
    }
    supabase.auth.exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          navigate({ to: '/auth/sign-in', search: { error: 'auth_callback_failed' } })
        } else {
          navigate({ to: '/dashboard' })
        }
      })
  }, [])

  return <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
  </div>
}
```

### 6c. `onAuthStateChange` Listener Cleanup

The `AuthContext` subscribes to auth state changes. If the subscription is not cleaned up,
it leaks across component unmounts.

```typescript
// src/contexts/AuthContext.tsx
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    setUser(session?.user ?? null)
    setIsLoading(false)
  })

  return () => {
    subscription.unsubscribe()  // REQUIRED: prevents memory leak
  }
}, [])
```

### 6d. RPC Return Type Inference

Supabase TypeScript types generated by `supabase gen types typescript` do not always correctly
type RPC return values. The `get_shared_computation` function returns `JSONB`, which TypeScript
infers as `Json | null`. The app must cast and validate via Zod:

```typescript
const { data, error } = await supabase.rpc('get_shared_computation', { p_token: token })
// TypeScript type of data: Json | null

// Cast and validate:
if (!data) return null
const parsed = SharedComputationDataSchema.safeParse(data)
if (!parsed.success) throw new Error('Invalid RPC response shape')
return parsed.data
```

This pattern (RPC → nullable Json → Zod parse) is used for ALL RPC calls that return JSONB.

### 6e. Supabase `maybeSingle()` vs `single()`

- `.single()` throws if 0 or 2+ rows are returned
- `.maybeSingle()` returns `null` if 0 rows, throws only if 2+ rows

Use `.maybeSingle()` when querying for optional data (e.g., checking for an existing share link):

```typescript
// Correct: maybeSingle() for "find if exists"
const { data } = await supabase
  .from('shared_links')
  .select('*')
  .eq('computation_id', computationId)
  .maybeSingle()
// data is SharedLink or null — no error if not found

// Correct: single() for "must exist exactly once"
const { data } = await supabase
  .from('computations')
  .select('*')
  .eq('id', id)
  .eq('user_id', userId)
  .single()
// data is ComputationRow — throws if not found
```

### 6f. Supabase Local Port Defaults

When running `supabase start`, local services bind to these default ports:

| Service | URL |
|---------|-----|
| API (PostgREST) | `http://localhost:54321` |
| Studio | `http://localhost:54323` |
| Inbucket | `http://localhost:54324` |
| Database (direct) | `postgresql://postgres:postgres@localhost:54322/postgres` |

The `VITE_SUPABASE_URL` for local dev is `http://localhost:54321` (the PostgREST API, not the
database direct URL).

### 6g. TypeScript Type Generation After Each Migration

After running any migration that adds a table, column, or function, regenerate types:

```bash
supabase gen types typescript --local > apps/retirement-pay/frontend/src/lib/database.types.ts
```

Commit the updated `database.types.ts`. If the file is out of sync with the database schema,
the mapper functions in `src/lib/mappers.ts` will have TypeScript errors that `npx tsc --noEmit`
will catch.

---

## 7. Complete Gotchas Checklist (for Forward Loop)

```
[ ] get_shared_computation has GRANT EXECUTE TO anon
[ ] create_organization has GRANT EXECUTE TO authenticated (not anon)
[ ] All SECURITY DEFINER functions have SET search_path = public
[ ] handle_updated_at trigger function has SET search_path = public
[ ] anon role cannot SELECT from computations, shared_links, organizations directly
[ ] supabase/config.toml has enable_confirmations = false (dev only)
[ ] supabase/config.toml has correct site_url and additional_redirect_urls
[ ] Supabase client created once in src/lib/supabase.ts — no duplicate instances
[ ] AuthContext onAuthStateChange subscription cleaned up in useEffect return
[ ] All JSONB RPC return values validated via Zod after call
[ ] .maybeSingle() for optional queries, .single() for required queries
[ ] VITE_SUPABASE_URL = http://localhost:54321 in .env.local (not DB direct port)
[ ] SUPABASE_SERVICE_ROLE_KEY never imported in any frontend file
[ ] database.types.ts regenerated after every migration change
[ ] No Supabase Storage buckets created (V1 uses in-memory CSV processing)
```

---

## Summary

| Gotcha | Failure Mode | Fix |
|--------|-------------|-----|
| Missing anon GRANT on get_shared_computation | Share links silently return null | `GRANT EXECUTE ON FUNCTION ... TO anon` in migration |
| No `SET search_path = public` on SECURITY DEFINER | Potential schema injection | Add `SET search_path = public` to every function definition |
| RLS allows anon direct table access | Data leak | Default RLS policies block anon; only RPCs expose public data |
| Email confirmation enabled in dev | E2E tests require manual email confirmation | `enable_confirmations = false` in supabase/config.toml |
| Multiple Supabase client instances | Auth state desync, session not shared | Single instance in src/lib/supabase.ts |
| Missing `detectSessionInUrl` or manual code exchange | PKCE callback fails | Explicit `exchangeCodeForSession(code)` in AuthCallbackPage |
| Auth subscription not cleaned up | Memory leak | `subscription.unsubscribe()` in useEffect return |
| JSONB RPC return not Zod-validated | Runtime type mismatch | Parse every JSONB RPC response through Zod schema |
| `.single()` on optional query | Throws error instead of null | Use `.maybeSingle()` for existence checks |
| Stale database.types.ts | TypeScript type errors on mappers | Regenerate after every migration |
