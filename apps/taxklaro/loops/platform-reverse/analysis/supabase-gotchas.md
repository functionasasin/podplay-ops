# Supabase Gotchas — TaxKlaro

**Wave:** 6 (Testing + Deployment)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** supabase-migrations, supabase-auth-flow, migration-verification

---

## Summary

This document catalogs every Supabase-specific requirement that differs from vanilla PostgreSQL or standard web app patterns. These are not bugs in Supabase — they are intentional design decisions that are poorly documented and have caused production failures in the inheritance app and other projects. Every item here is a forward loop guard, not background knowledge.

---

## Gotcha 1: SECURITY DEFINER Alone Does Not Grant Anon Access

### The Failure Mode

A SECURITY DEFINER function executes as its owner (typically `postgres`). This bypasses RLS. However, the `anon` role still needs EXECUTE permission on the function itself. If you forget the GRANT, the function is invisible to unauthenticated requests.

### What Happens

```
Error: permission denied for function get_shared_computation
```

This error appears in the browser console when visiting `/share/$token` without being logged in. The function exists, the data exists, but the anonymous user cannot call it.

### The Fix

Every RPC function that must be callable without authentication MUST have:

```sql
GRANT EXECUTE ON FUNCTION get_shared_computation(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION accept_invitation(UUID) TO anon, authenticated;
```

Functions that require authentication omit `anon`:

```sql
GRANT EXECUTE ON FUNCTION create_organization(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_computation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_upcoming_deadlines(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_deadlines_for_computation(UUID, INTEGER) TO authenticated;
```

### TaxKlaro Public RPC Inventory (must have anon GRANT)

| Function | Why Public |
|---|---|
| `get_shared_computation(p_token UUID)` | Shared computation links work without login |
| `accept_invitation(p_token UUID)` | Invitation acceptance page loads before auth |

All other RPCs: authenticated only.

### Verification

```sql
-- Run after supabase db reset to verify grants:
SELECT routine_name, grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND grantee = 'anon';
-- Expected: 2 rows: get_shared_computation, accept_invitation

-- Simulate anon call:
SET LOCAL ROLE anon;
SELECT COUNT(*) FROM get_shared_computation('00000000-0000-0000-0000-000000000000'::UUID);
-- Expected: 0 (empty result, NOT "permission denied")
RESET ROLE;
```

---

## Gotcha 2: search_path on SECURITY DEFINER Functions

### The Failure Mode

A SECURITY DEFINER function runs as `postgres`. If an attacker (or confused migration) creates a table or function in a different schema with the same name as a system table, a SECURITY DEFINER function without `SET search_path` might resolve to the wrong schema.

### The Fix

Every SECURITY DEFINER function must include:

```sql
CREATE OR REPLACE FUNCTION get_shared_computation(p_token UUID)
RETURNS TABLE (...)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- REQUIRED: prevents schema injection
AS $$
...
$$;
```

### TaxKlaro Functions That Need This

All 6 RPCs in `003_rpc_functions.sql` are SECURITY DEFINER and must include `SET search_path = public`:
- `get_shared_computation`
- `create_organization`
- `accept_invitation`
- `soft_delete_computation`
- `get_upcoming_deadlines`
- `generate_deadlines_for_computation`

Also the helper function in `002_rls_policies.sql`:
- `user_org_ids()`

### Verification

```sql
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND security_type = 'DEFINER';
-- Expected: 7 rows — all SECURITY DEFINER functions listed above
```

To verify `search_path` setting:
```sql
SELECT proname, proconfig
FROM pg_proc
JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
WHERE pg_namespace.nspname = 'public'
  AND proconfig IS NOT NULL;
-- Expected: each function shows search_path=public in proconfig array
```

---

## Gotcha 3: SECURITY DEFINER Bypasses RLS — Audit for Data Leakage

### The Behavior

A SECURITY DEFINER function executes as its owner and bypasses all RLS policies. This is intentional and correct for `get_shared_computation` (we want it to read computations that the anonymous user couldn't read via RLS). But it means every SECURITY DEFINER function must manually implement the authorization logic that RLS would normally provide.

### The Risk

If `get_shared_computation` didn't explicitly filter `WHERE share_enabled = true AND deleted_at IS NULL`, it would expose ALL computations to anyone with a valid (or guessed) UUID.

### TaxKlaro SECURITY DEFINER Authorization Checklist

| Function | What Authorization It Implements Manually |
|---|---|
| `get_shared_computation` | `WHERE share_enabled = true AND deleted_at IS NULL` — only shared, non-deleted |
| `create_organization` | `auth.uid() IS NULL` check — refuses anon calls (returns error JSON) |
| `accept_invitation` | Email match check: invitation.email = auth.email() (when authenticated) |
| `soft_delete_computation` | Owner or admin check: `user_id = auth.uid() OR EXISTS (SELECT 1 FROM org_members WHERE role = 'admin')` |
| `get_upcoming_deadlines` | `WHERE org_id IN (user_org_ids())` — scoped to user's orgs |
| `generate_deadlines_for_computation` | `WHERE user_id = auth.uid() OR org_id IN (user_org_ids())` |
| `user_org_ids` | Returns only orgs for `auth.uid()` — safe to expose |

### The Rule

**Every SECURITY DEFINER function must contain explicit WHERE clauses that would be equivalent to (or stricter than) the RLS policy for that table.** Never return raw table data from a SECURITY DEFINER function without filtering.

---

## Gotcha 4: Storage Bucket Policies on storage.objects

### The Failure Mode

Creating a Supabase Storage bucket via `INSERT INTO storage.buckets` does NOT automatically create access policies. Without policies, all storage operations are denied (even for authenticated users). The bucket exists, but nothing can be uploaded or downloaded.

### The Fix

For the `firm-logos` bucket, `004_storage.sql` must create policies on `storage.objects`:

```sql
-- SELECT: authenticated users can read their own logos
CREATE POLICY "firm-logos-select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'firm-logos'
  AND auth.uid()::TEXT = (storage.foldername(name))[1]
);

-- INSERT: authenticated users can upload to their own folder
CREATE POLICY "firm-logos-insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'firm-logos'
  AND auth.uid()::TEXT = (storage.foldername(name))[1]
);

-- UPDATE: users can replace their own logos
CREATE POLICY "firm-logos-update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'firm-logos'
  AND auth.uid()::TEXT = (storage.foldername(name))[1]
);

-- DELETE: users can remove their own logos
CREATE POLICY "firm-logos-delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'firm-logos'
  AND auth.uid()::TEXT = (storage.foldername(name))[1]
);
```

### File Path Convention

Logo files must be stored as `{user-uuid}/{filename}` so that `storage.foldername(name)[1]` returns the user's UUID. The upload path in `src/lib/profile.ts`:

```typescript
const filePath = `${userId}/${Date.now()}-${file.name}`;
const { error } = await supabase.storage
  .from('firm-logos')
  .upload(filePath, file, { upsert: true });
```

### Verification

```sql
SELECT name, definition FROM storage.policies WHERE bucket_id = 'firm-logos';
-- Expected: 4 rows: firm-logos-select, firm-logos-insert, firm-logos-update, firm-logos-delete
```

Also test via client:
```typescript
// In a Playwright test after auth:
const { data, error } = await supabase.storage
  .from('firm-logos')
  .upload(`${userId}/test-logo.png`, testFile);
// Expected: data.path is set, error is null
```

---

## Gotcha 5: onAuthStateChange Fires on Page Load — Handle Initial Session

### The Failure Mode

`supabase.auth.onAuthStateChange` fires two events on page load:
1. `INITIAL_SESSION` with the current session (if logged in) or `null` (if not)
2. `SIGNED_IN` if the session is valid and loaded from storage

If the app subscribes to `onAuthStateChange` before calling `getSession()`, there's a race condition where the initial render shows a "not logged in" flash before the session loads. This causes:
- Brief redirect to `/auth` before correcting to the authenticated route
- Unstyled "loading" flash in the nav bar

### The Fix (from inheritance app pattern)

Always call `getSession()` first to get the initial session synchronously from storage, then subscribe to changes:

```typescript
// src/main.tsx — correct bootstrap sequence
useEffect(() => {
  // 1. Get initial session first (no await needed — we handle it synchronously)
  supabase.auth.getSession().then(({ data: { session } }) => {
    setAuth({ user: session?.user ?? null, loading: false });
  });

  // 2. Subscribe to subsequent changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setAuth({ user: session?.user ?? null, loading: false });
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

**Critical**: Set `loading: true` initially and only set `loading: false` after `getSession()` resolves. The `<RouterProvider>` must not render until `loading === false`. This prevents the auth flash.

```typescript
const [auth, setAuth] = useState<AuthState>({ user: null, loading: true });

// In render:
if (auth.loading) {
  return <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>;
}
```

### The INITIAL_SESSION Event

In newer Supabase JS SDK versions (v2.38+), `onAuthStateChange` emits `INITIAL_SESSION` as the first event. You can rely on this instead of calling `getSession()` separately:

```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    if (event === 'INITIAL_SESSION') {
      setAuth({ user: session?.user ?? null, loading: false });
    } else {
      setAuth({ user: session?.user ?? null, loading: false });
    }
  }
);
```

Both approaches work. The `getSession()` approach is more explicit and works with all SDK versions.

---

## Gotcha 6: Email Confirmation in Local Dev

### The Behavior

By default, `supabase start` (local Docker stack) auto-confirms email addresses. This means:
- Sign-up immediately logs the user in (no email needed)
- The PKCE callback route (`/auth/callback`) never triggers in local dev
- A bug in the PKCE callback handler will not be caught until staging/production

### How to Test PKCE Callback Locally

Edit `supabase/config.toml`:

```toml
[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true  # Set this to true to require email confirmation
```

Then restart local Supabase:
```bash
supabase stop && supabase start
```

Confirmation emails are captured by Inbucket (local email server). Access at `http://localhost:54324` to view and click confirmation links.

### What to Test in PKCE Callback

The `/auth/callback` route must:
1. Read `code` from URL params: `const code = new URLSearchParams(window.location.search).get('code')`
2. Call `supabase.auth.exchangeCodeForSession(code)`
3. On success: redirect to `/` (or the stored `next` param)
4. On error: redirect to `/auth?error=email_confirmation_failed`

```typescript
// src/routes/auth/callback.tsx
export function AuthCallbackRoute() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      navigate({ to: '/auth', search: { error: 'missing_code' } });
      return;
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        navigate({ to: '/auth', search: { error: 'confirmation_failed' } });
      } else {
        navigate({ to: '/' });
      }
    });
  }, []);
  return <LoadingSpinner />;
}
```

### Password Reset in Local Dev

Password reset emails are also captured by Inbucket. The reset flow:
1. User requests reset at `/auth/reset`
2. Supabase sends email with link to `{VITE_APP_URL}/auth/reset-confirm?token=...`
3. `VITE_APP_URL` must be set to `http://localhost:5173` in `.env.local` for local dev

---

## Gotcha 7: Connection Pooling — Use Project URL, Not Direct DB URL

### The Failure Mode

Supabase projects have two connection strings:
1. **Project URL**: `https://{project-ref}.supabase.co` — routes through Supabase's REST API and connection pooler (PgBouncer)
2. **Direct DB URL**: `postgresql://postgres:{password}@db.{project-ref}.supabase.co:5432/postgres` — direct connection

The direct DB URL bypasses connection pooling. In serverless or browser contexts with many concurrent users, this hits the PostgreSQL connection limit (100 connections by default on free tier).

### The Rule for TaxKlaro

The Supabase JavaScript client (`@supabase/supabase-js`) ALWAYS uses the project URL (the REST API / PostgREST). This is correct and should not be changed.

```typescript
// src/lib/supabase.ts — correct
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,    // Project URL: https://*.supabase.co
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

**Never** expose or use the direct DB URL from browser code. The direct DB URL is only for:
- `supabase db reset` (local dev)
- Migration scripts
- Admin tasks

### RPC Calls vs Direct Table Access

For all database operations, prefer:
```typescript
// Prefer: Supabase client table access (routes through REST API)
const { data } = await supabase.from('computations').select('*');

// Prefer: RPC calls for complex operations
const { data } = await supabase.rpc('create_organization', { p_name: name, p_slug: slug });
```

Never import `pg` or `postgres` packages in frontend code. The frontend uses only `@supabase/supabase-js`.

---

## Gotcha 8: Realtime Subscriptions Require Replication

### Context

TaxKlaro does not currently use Supabase Realtime (live data push). However, if the forward loop adds real-time features (e.g., collaborative computation editing, live deadline updates), this gotcha applies.

### The Requirement

Supabase Realtime only streams changes from tables that have replication enabled:

```sql
-- Required for each table you want to stream:
ALTER TABLE computations REPLICA IDENTITY FULL;
ALTER TABLE computation_notes REPLICA IDENTITY FULL;
```

Also must add the table to the Realtime publication:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE computations;
ALTER PUBLICATION supabase_realtime ADD TABLE computation_notes;
```

**TaxKlaro does NOT include Realtime in current spec.** This section is here to prevent a forward loop from accidentally enabling Realtime without the required replication setup.

---

## Gotcha 9: Row-Level Security Must Be Explicitly Enabled

### The Behavior

Creating a table in Supabase does NOT automatically enable RLS. A table without RLS enabled is fully public — any authenticated user can read/write any row.

### The Fix

Every table created in `001_initial_schema.sql` must be followed by:

```sql
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE computations ENABLE ROW LEVEL SECURITY;
ALTER TABLE computation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE computation_deadlines ENABLE ROW LEVEL SECURITY;
```

These `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statements must appear in `001_initial_schema.sql`, BEFORE the policies in `002_rls_policies.sql`.

### Verification

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- Expected: ALL 8 tables show rowsecurity = true
```

---

## Gotcha 10: Supabase Auth Redirect URLs Must Be Whitelisted

### The Behavior

Supabase Auth redirects (email confirmation, password reset, OAuth) will fail with an "invalid redirect URL" error if the destination URL is not in the project's allowed redirect URLs list.

### Configuration Required

In Supabase Dashboard → Authentication → URL Configuration:

**Site URL**: `https://taxklaro.ph` (production) or `http://localhost:5173` (local dev)

**Redirect URLs** (must include all of these):
```
https://taxklaro.ph/**
http://localhost:5173/**
http://localhost:5173/auth/callback
http://localhost:5173/auth/reset-confirm
https://taxklaro.ph/auth/callback
https://taxklaro.ph/auth/reset-confirm
```

The wildcard `https://taxklaro.ph/**` covers all paths. Add the specific callback paths as well for clarity.

### For Local Dev with Multiple Ports

If the dev server ever runs on a port other than 5173:
```
http://localhost:4173/**   (vite preview port)
http://localhost:8080/**   (Docker serve port)
```

### What Breaks Without This

- Email confirmation links fail: user clicks link, gets "invalid URL" error
- Password reset links fail: user can't set new password
- Magic link login fails: link is rejected before token exchange

---

## Gotcha 11: Supabase Free Tier Pauses After 1 Week of Inactivity

### The Behavior

Free tier Supabase projects pause (stop the database) after 7 days without any API activity. The first request after pausing takes 30-60 seconds to "wake up" the project.

### For TaxKlaro

This is relevant during development when the project hasn't been accessed recently. It is NOT relevant in production if the app has regular users.

**Warning sign**: App loads but all Supabase queries time out. Dashboard shows "Project is paused. Resume to continue."

**Fix**: Click "Resume project" in the Supabase dashboard. Wait 30-60 seconds for the database to wake.

**Prevention during dev**: Keep the project active by hitting it at least once per week, or upgrade to Pro ($25/month) to disable auto-pause.

---

## Gotcha 12: Supabase Storage Public URL vs Signed URL

### The Context

TaxKlaro uses `firm-logos` as a **private** bucket (not public). This means:
- Direct public URLs (`supabase.storage.from('firm-logos').getPublicUrl(path)`) return a URL but requests to it will be denied with 403
- To display the logo, a **signed URL** must be generated with a TTL

### The Correct Pattern

```typescript
// WRONG — will return 403 for private buckets:
const { data } = supabase.storage.from('firm-logos').getPublicUrl(path);
img.src = data.publicUrl; // 403 Forbidden

// CORRECT — generates a time-limited signed URL:
const { data, error } = await supabase.storage
  .from('firm-logos')
  .createSignedUrl(path, 3600); // 1 hour TTL
img.src = data.signedUrl;
```

### Implementation in user_profiles.ts

The `getFirmLogoUrl(path: string)` function:

```typescript
export async function getFirmLogoUrl(logoPath: string): Promise<string | null> {
  if (!logoPath) return null;
  const { data, error } = await supabase.storage
    .from('firm-logos')
    .createSignedUrl(logoPath, 3600);
  if (error) return null;
  return data.signedUrl;
}
```

This signed URL is used:
1. In the Settings page to display the current firm logo
2. In the PDF export to embed the firm logo
3. In the AppLayout sidebar to show a small firm logo next to the org name

**Cache the signed URL** to avoid redundant API calls. Re-generate when it expires (1 hour) or when the user uploads a new logo.

---

## Complete Gotcha Reference Table

| # | Gotcha | Symptom | Fix |
|---|--------|---------|-----|
| 1 | Missing anon GRANT | `permission denied for function` on share/invite pages | Add `GRANT EXECUTE ... TO anon` for public RPCs |
| 2 | Missing search_path | Schema injection risk (latent) | Add `SET search_path = public` to all SECURITY DEFINER functions |
| 3 | SECURITY DEFINER bypasses RLS | Data leakage if WHERE clauses missing | Manually implement auth checks inside each SECURITY DEFINER function |
| 4 | Storage bucket without policies | 403 on all storage operations | Create 4 policies on `storage.objects` per bucket |
| 5 | Auth state race condition | Unauthenticated flash before redirect | Call `getSession()` before subscribing to `onAuthStateChange` |
| 6 | Email confirmation not tested locally | PKCE callback bugs not caught until prod | Set `enable_confirmations = true` in config.toml; test with Inbucket |
| 7 | Direct DB URL in frontend | Connection limit exhaustion | Use project URL only; never use direct DB URL in browser code |
| 8 | Realtime without replication | No events streamed | Add REPLICA IDENTITY FULL and supabase_realtime publication (only if using Realtime) |
| 9 | RLS not enabled on table | All rows publicly accessible | `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for every table |
| 10 | Redirect URL not whitelisted | Auth redirects fail with invalid URL | Add all redirect URLs in Supabase dashboard + `.env.local` |
| 11 | Free tier project pauses | All queries time out after 7 days | Resume in dashboard; consider Pro plan for active dev |
| 12 | Public URL for private bucket | 403 on logo display/PDF | Use `createSignedUrl()` instead of `getPublicUrl()` for private buckets |

---

## Forward Loop Integration Points

Every gotcha has a corresponding check in the forward loop. These must appear in **Phase 5 (Platform) verification**:

1. **Gotcha 1** — Covered in `migration-verification.md` Step 8: "Verify GRANTS for anonymous functions"
2. **Gotcha 2** — The forward loop must add `SET search_path = public` to every SECURITY DEFINER function in `003_rpc_functions.sql` and `002_rls_policies.sql`
3. **Gotcha 3** — Code review: every SECURITY DEFINER function in `003_rpc_functions.sql` must contain explicit WHERE clauses
4. **Gotcha 4** — Covered in `migration-verification.md` Step 5: "Verify storage bucket" — verify 4 policies created
5. **Gotcha 5** — `main.tsx` must call `getSession()` before `onAuthStateChange`, with `loading: true` guard
6. **Gotcha 6** — E2E test: Playwright test for `/auth/callback` route must run with `enable_confirmations = true`
7. **Gotcha 7** — Static analysis: `grep -r "postgresql://"` in `src/` must return 0 results
8. **Gotcha 8** — N/A for TaxKlaro (no Realtime)
9. **Gotcha 9** — Covered in `migration-verification.md` Step 2: check `rowsecurity = true` for all tables
10. **Gotcha 10** — Supabase dashboard setup checklist in `fly-io-deployment.md`
11. **Gotcha 11** — Not a code issue; document in developer setup guide
12. **Gotcha 12** — Code check: `grep -r "getPublicUrl" src/` must return 0 results (all logo access uses `createSignedUrl`)
