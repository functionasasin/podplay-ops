# Inheritance Platform Layer Spec

**Version**: 1.0
**Date**: 2026-03-04
**Status**: Implementation-Ready
**Sources**: 21 analysis files from `loops/inheritance-platform-reverse/analysis/`

---

## §1 Overview

This spec covers every platform-layer gap, stub, UX dead end, and design modernization opportunity in the Philippine Inheritance Calculator app (`loops/inheritance-frontend-forward/app/src/`).

**What this spec is based on:**
- Full codebase audit: every route, component, lib module, hook, migration, and config file
- Premium spec (`docs/plans/inheritance-premium-spec.md`) cross-reference
- 6 user journey audits (new visitor, sign-up/sign-in, first case, share case, return visit, settings/team), each walked step-by-step through the actual code
- 6 design audits (layout/nav, wizard, results, shared components, mobile/responsive, loading/empty states)
- 2 upstream failure logs (forward loop + reverse loop frontier docs)

**Overall app status**: BROKEN at the platform layer. Core engine (computation, WASM, results display) is functional. Everything else — auth flow, case persistence, navigation, share, team management — has critical gaps that prevent a user from completing any meaningful end-to-end journey.

**Design direction**: Navy (`#1e3a5f`) + Gold (`#c5a44e`) palette stays unchanged. Everything else modernizes: Linear/Vercel dashboard layout, proper skeleton loading, icon+CTA empty states, 100ms nav transitions, mobile drawer nav.

---

## §2 Route Table

| Path | Component File | Auth Required | Status | Key Gaps |
|------|---------------|---------------|--------|----------|
| `/` | `routes/index.tsx` | No (conditional render) | PARTIAL | Dashboard empty; no case list; no org detection |
| `/auth` | `routes/auth.tsx` | Public | BROKEN | AppLayout wraps it; no callback route; wrong mode on Create Account |
| `/auth/callback` | *(missing)* | Public | **MISSING** | PKCE email confirmation code discarded without this route |
| `/auth/reset` | *(missing)* | Public | **MISSING** | No password reset flow in the app |
| `/onboarding` | *(missing)* | Auth | **MISSING** | New users have no org creation or first-use guidance |
| `/cases` | *(missing)* | Auth | **MISSING** | No case list page exists — return users cannot find their work |
| `/cases/new` | `routes/cases/new.tsx` | None (no guard) | BROKEN | No case record created; ephemeral only; GuidedIntakeForm orphaned |
| `/cases/$caseId` | `routes/cases/$caseId.tsx` | None (no guard) | PARTIAL | Loads and saves correctly; useAutoSave imported but never called; no back-to-results shortcut |
| `/cases/$caseId/tax` | *(missing)* | Auth | **MISSING** | EstateTaxWizard exists but no route mounts it |
| `/clients` | `routes/clients/index.tsx` | Conditional render | PARTIAL | Raw HTML table; error silently swallowed; no org-creation prompt |
| `/clients/new` | `routes/clients/new.tsx` | Conditional render | BROKEN | Silent fail if no org; no error display; no auth guard |
| `/clients/$clientId` | `routes/clients/$clientId.tsx` | None (no guard) | PARTIAL | Cases section is a stub placeholder |
| `/deadlines` | `routes/deadlines.tsx` | Conditional render | PARTIAL | Queries by `user_id` not `org_id`; no mark-complete action |
| `/settings` | `routes/settings/index.tsx` | Conditional render | PARTIAL | Logo upload uses `window.location.reload()`; no sub-nav to Team |
| `/settings/team` | `routes/settings/team.tsx` | Conditional render | **BROKEN** | Component exists but `createRoute` is missing — unreachable |
| `/settings/billing` | *(missing)* | Auth | **MISSING** | Seat upgrade CTA links nowhere |
| `/share/$token` | `routes/share/$token.tsx` | Public | BROKEN | Results not rendered (TODO comment); AppLayout chrome shown to recipients |
| `/invite/$token` | *(missing)* | Public | **MISSING** | `acceptInvitation()` exists in lib but no route calls it |

**Router file**: `src/router.ts`
**Router library**: `@tanstack/react-router`
**Auth mechanism**: Per-component conditional rendering — **zero route-level auth guards**. Must be replaced with `beforeLoad` guards.

### Route-Level Auth Guard Pattern

**File**: `src/router.ts`

Every protected route needs a `beforeLoad` that redirects unauthenticated users. The router must be given auth context via a `context`:

```ts
// src/router.ts
import { getSession } from '@/lib/auth';

export const router = createRouter({
  routeTree,
  context: {
    auth: undefined as { user: User | null } | undefined,
  },
});

// Per protected route (e.g., cases/$caseId.tsx):
export const caseIdRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/cases/$caseId',
  beforeLoad: ({ context }) => {
    if (!context.auth?.user) {
      throw redirect({ to: '/auth', search: { redirect: '/cases/$caseId' } });
    }
  },
  component: CaseEditorPage,
});
```

---

## §3 Authentication Flow

### §3.1 Sign-up

**Entry point**: `/auth` with `?mode=signup` search param
**Component**: `src/routes/auth.tsx`

**Fields**:
- Firm Name (optional, stored to organization on creation, placeholder "Law Office of…")
- Full Name (optional)
- Email (required, browser validation)
- Password (required, minLength 8)
- Confirm Password (required, must match password)

**Fix — File**: `src/routes/auth.tsx`

1. Add `validateSearch` to `authRoute`:
   ```ts
   validateSearch: (search) => ({
     mode: (search.mode as 'signin' | 'signup') ?? 'signin',
     redirect: (search.redirect as string) ?? '',
   }),
   ```
2. Initialize `mode` from search: `const { mode: initialMode, redirect: redirectTo } = authRoute.useSearch(); const [mode, setMode] = useState(initialMode);`
3. Add `firmName` state, `confirmPassword` state.
4. Validate `password === confirmPassword` before submit. Show `<p className="text-sm text-destructive">Passwords do not match</p>` under the confirm field if mismatch.
5. Fix "Create Account" link in `src/routes/index.tsx:41`: `<Link to="/auth" search={{ mode: 'signup' }}>Create Account</Link>`

**Fix — File**: `src/hooks/useAuth.ts` lines 32–34

Return the signUp result so callers can detect auto-confirm:
```ts
const signUp = async (email: string, password: string, fullName?: string) => {
  return await authLib.signUp(email, password, fullName);
};
```
Update `UseAuthReturn` interface: `signUp: (...) => Promise<{ user: User | null; session: Session | null } | null>`

**Post-sign-up handling** (in `src/routes/auth.tsx` submit handler):
```ts
const result = await signUp(email, password, fullName || undefined);
if (result?.session) {
  // Auto-confirmed (enable_confirmations = false in dev):
  await createOrganization(result.user!.id, firmName || 'My Firm');
  navigate({ to: '/onboarding' });
} else {
  // Pending confirmation (production with enable_confirmations = true):
  setSignUpSuccess(true);
}
```

**"Check your email" card** additions:
- Add `Resend confirmation email` button calling `supabase.auth.resend({ type: 'signup', email })`:
  ```tsx
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const handleResend = async () => {
    setResendStatus('sending');
    await supabase.auth.resend({ type: 'signup', email });
    setResendStatus('sent');
    setTimeout(() => setResendStatus('idle'), 5000);
  };
  <Button variant="ghost" size="sm" disabled={resendStatus !== 'idle'} onClick={handleResend}>
    {resendStatus === 'idle' ? 'Resend confirmation email' : resendStatus === 'sending' ? 'Sending…' : 'Sent!'}
  </Button>
  ```
- Add `<p className="text-xs text-muted-foreground mt-2">The link expires in 1 hour.</p>` to the card description.

### §3.2 Sign-in

**Fix — File**: `src/routes/auth.tsx`

1. Disable all input fields during submission: add `disabled={submitting}` to all three `<Input>` elements (lines 101, 112, 123).
2. Add spinner to submit button:
   ```tsx
   <Button type="submit" className="w-full gap-2" disabled={submitting}>
     {submitting ? (
       <><div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />Please wait…</>
     ) : mode === 'signin' ? 'Sign In' : 'Create Account'}
   </Button>
   ```
3. Friendly error message mapping in catch block:
   ```ts
   const SUPABASE_ERROR_MAP: Record<string, string> = {
     'Invalid login credentials': 'Incorrect email or password. Please try again.',
     'Email not confirmed': 'Please confirm your email address first.',
     'User already registered': 'An account with this email already exists. Sign in instead.',
     'Password should be at least 6 characters': 'Password must be at least 8 characters.',
     'signup is disabled': 'New registrations are temporarily disabled.',
   };
   const raw = err.message ?? 'Something went wrong';
   setError(SUPABASE_ERROR_MAP[raw] ?? raw);
   if (raw === 'Email not confirmed') setShowResend(true);
   ```
4. When `showResend` is true, render the resend button below the Alert.
5. Add "Forgot password?" link under the password field in signin mode:
   ```tsx
   {mode === 'signin' && (
     <Link to="/auth/reset" className="text-xs text-primary hover:underline">Forgot password?</Link>
   )}
   ```

**Already-authenticated redirect**: Add at top of `AuthPage` component:
```tsx
const { user, loading } = useAuth();
const navigate = useNavigate();
useEffect(() => {
  if (!loading && user) navigate({ to: '/' });
}, [user, loading]);
if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" /></div>;
```

**Post-sign-in redirect**: Read redirect param and navigate to it:
```ts
await signIn(email, password);
navigate({ to: (redirectTo as any) || '/' });
```

### §3.3 Session Management

**Token persistence**: Handled by `@supabase/supabase-js` via localStorage. The `onAuthStateChange` listener in `useAuth.ts` keeps React state in sync. No changes needed to the session management itself.

**Session duration**: `jwt_expiry = 3600` (1 hour) with refresh token rotation (`enable_refresh_token_rotation = true`). Supabase JS auto-refreshes silently. No app-level refresh logic needed.

**Flash of unauthenticated content**: `useAuth` starts with `loading: true`. Routes that show auth-conditional content should show a spinner or skeleton during the `loading` phase (most do already; the Dashboard uses a hand-rolled spinner — fix: replace with Skeleton pattern per §9.4).

### §3.4 Sign-out

**File**: `src/components/layout/AppLayout.tsx`

Add `useAuth` hook and sign-out button to sidebar footer and mobile drawer (full spec in §6.1):
```tsx
const { user, signOut } = useAuth();
// In sidebar footer:
{user && (
  <button onClick={() => signOut()} className="...text-sidebar-foreground/75 hover:bg-white/[0.08]...">
    <LogOut className="h-4 w-4" />Sign Out
  </button>
)}
```

After `signOut()`, `onAuthStateChange` fires with `null` → `setUser(null)` → app shows unauthenticated state automatically. No manual redirect needed from the sign-out button.

### §3.5 Password Reset

**New file**: `src/routes/auth/reset.tsx`

```tsx
export const authResetRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/auth/reset',
  component: PasswordResetPage,
});

function PasswordResetPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.VITE_APP_URL}/auth/reset-confirm`,
    });
    if (err) setError(err.message);
    else setSent(true);
  };

  if (sent) return (
    <div className="max-w-sm mx-auto py-20 text-center space-y-3">
      <p className="font-medium">Check your email</p>
      <p className="text-sm text-muted-foreground">We sent a password reset link to {email}.</p>
      <Link to="/auth" className="text-primary text-sm hover:underline">Return to sign in</Link>
    </div>
  );
  return (
    <div className="max-w-sm mx-auto py-20">
      <h1 className="text-xl font-bold mb-2 font-serif">Reset your password</h1>
      <p className="text-sm text-muted-foreground mb-6">Enter your email and we'll send a reset link.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <div className="space-y-1">
          <Label htmlFor="reset-email">Email</Label>
          <Input id="reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button type="submit" className="w-full">Send reset email</Button>
      </form>
      <p className="text-center mt-4"><Link to="/auth" className="text-sm text-primary hover:underline">Back to sign in</Link></p>
    </div>
  );
}
```

**New file**: `src/routes/auth/reset-confirm.tsx` — handles `?code=` from the reset email:
```tsx
export const authResetConfirmRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/auth/reset-confirm',
  validateSearch: (search) => ({ code: (search.code as string) ?? '' }),
  component: ResetConfirmPage,
});

function ResetConfirmPage() {
  const { code } = authResetConfirmRoute.useSearch();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error: err }) => {
        if (err) setError('Reset link is invalid or expired.');
      });
    }
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) setError(err.message);
    else setDone(true);
  };

  if (done) return (
    <div className="max-w-sm mx-auto py-20 text-center space-y-3">
      <p className="font-medium">Password updated</p>
      <Button onClick={() => navigate({ to: '/' })}>Go to dashboard</Button>
    </div>
  );
  return (
    <div className="max-w-sm mx-auto py-20 space-y-4">
      <h1 className="text-xl font-bold font-serif">Set new password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <div className="space-y-1">
          <Label>New Password</Label>
          <Input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Confirm Password</Label>
          <Input type="password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error.includes('match') && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <Button type="submit" className="w-full">Update password</Button>
      </form>
    </div>
  );
}
```

Register both routes in `src/router.ts` as children of `publicRootRoute`.

### §3.6 Auth Callback Route (PKCE Email Confirmation)

**New file**: `src/routes/auth/callback.tsx`

```tsx
export const authCallbackRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/auth/callback',
  validateSearch: (search) => ({ code: (search.code as string) ?? '' }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const { code } = authCallbackRoute.useSearch();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) { navigate({ to: '/auth' }); return; }
    supabase.auth.exchangeCodeForSession(code).then(async ({ data, error: err }) => {
      if (err || !data.user) { setError(err?.message ?? 'Confirmation failed.'); return; }
      // Check if user has an org
      const { data: orgData } = await supabase
        .from('organization_members')
        .select('org_id')
        .eq('user_id', data.user.id)
        .limit(1);
      if (!orgData?.length) {
        await createOrganization(data.user.id, 'My Firm');
        navigate({ to: '/onboarding' });
      } else {
        navigate({ to: '/' });
      }
    });
  }, [code]);

  if (error) return (
    <div className="max-w-md mx-auto py-20 text-center space-y-4">
      <p className="text-destructive font-medium">{error}</p>
      <p className="text-sm text-muted-foreground">Your confirmation link may have expired.</p>
      <Link to="/auth" className="text-primary text-sm underline">Return to sign in</Link>
    </div>
  );
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
        Confirming your account…
      </div>
    </div>
  );
}
```

Register in `src/router.ts` as child of `publicRootRoute`. Set Supabase project `site_url` to `https://yourapp.com/auth/callback` so confirmation emails redirect here.

### §3.7 Auth Layout Isolation

**File**: `src/routes/__root.tsx`

Auth and share routes must render without AppLayout chrome. Replace unconditional `<AppLayout>` wrap:

```tsx
import { useRouterState } from '@tanstack/react-router';

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPublicRoute = pathname.startsWith('/auth') || pathname.startsWith('/share/') || pathname.startsWith('/invite/');
  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Outlet />
      </div>
    );
  }
  return <AppLayout><Outlet /></AppLayout>;
}
```

**Result**: `/auth`, `/auth/callback`, `/auth/reset`, `/auth/reset-confirm`, `/share/$token`, and `/invite/$token` render without the sidebar nav.

---

## §4 Environment Configuration

### §4.1 Required Env Vars

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` (prod) or `http://localhost:54321` (dev) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key (safe to expose client-side) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_APP_URL` | App's own public URL (needed for share links, QR codes, password reset redirect) | `https://inheritance.yourdomain.com` |

### §4.2 `.env.local.example` Exact Contents

**File**: `loops/inheritance-frontend-forward/app/.env.local.example`

Replace current 2-line file with:
```
# Required — Supabase connection
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key-from-supabase-start

# Required for share links, QR codes, password reset emails
VITE_APP_URL=http://localhost:3000

# Optional — Billing portal (used in InviteMemberDialog seat-limit CTA)
# VITE_BILLING_URL=https://billing.yourdomain.com
```

### §4.3 Graceful Missing-Var Handling

**File**: `src/lib/supabase.ts`

Replace the throw-on-missing pattern with a graceful fallback:

```ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null as any;  // Callers guard on supabaseConfigured before use
```

**File**: `src/main.tsx`

Before mounting the router, check `supabaseConfigured`. If false, render a setup instructions page instead of the router:

```tsx
import { supabaseConfigured } from '@/lib/supabase';

if (!supabaseConfigured) {
  document.body.innerHTML = '';
  const root = document.createElement('div');
  root.id = 'setup-root';
  document.body.appendChild(root);
  ReactDOM.createRoot(root).render(<SetupPage />);
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode><RouterProvider router={router} /></React.StrictMode>
  );
}
```

**New file**: `src/components/SetupPage.tsx`

```tsx
export function SetupPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-sm border p-8 space-y-4">
        <div className="flex items-center gap-2 text-navy">
          <Scale className="h-6 w-6 text-[#1e3a5f]" />
          <h1 className="text-xl font-bold font-serif text-[#1e3a5f]">Inheritance Calculator</h1>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="font-medium text-amber-900 mb-1">Setup Required</p>
          <p className="text-sm text-amber-800">Missing Supabase environment variables. Create <code className="bg-amber-100 px-1 rounded">app/.env.local</code> with:</p>
        </div>
        <pre className="bg-slate-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto">
{`VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-key-here
VITE_APP_URL=http://localhost:3000`}
        </pre>
        <p className="text-sm text-slate-600">Run <code className="bg-slate-100 px-1 rounded">supabase start</code> to get your local keys, then restart the dev server.</p>
      </div>
    </div>
  );
}
```

---

## §5 Database Migrations

### §5.1 Migration Inventory

| File | Status | What It Does |
|------|--------|--------------|
| `001_initial_schema.sql` | EXISTS | All tables, enums, triggers, partial RLS. **Note**: Organizations/members/invitations tables have NO RLS in this file — must apply 010 immediately after. |
| `002_*.sql` | MISSING (never written) | See `_MIGRATION_NOTES.md` |
| `003_*.sql` | MISSING (never written) | See `_MIGRATION_NOTES.md` |
| `004_shared_case_rpc.sql` | EXISTS | `get_shared_case()` SECURITY DEFINER RPC. Correct. |
| `005_case_deadlines.sql` | EXISTS (stale) | `get_case_deadline_summaries()` with user_id scoping — superseded by 010. |
| `006_case_documents.sql` | EXISTS (no-op) | Duplicate — `case_documents` already created in 001. |
| `007_conflict_check.sql` | EXISTS (stale) | `run_conflict_check()` with user_id scoping — superseded by 010. |
| `008_*.sql` | MISSING (never written) | See `_MIGRATION_NOTES.md` |
| `009_cases_intake_data.sql` | EXISTS | Adds `intake_data JSONB` column to `cases`. Correct. |
| `010_rls_org_scope.sql` | EXISTS | Full RLS for org tables, `accept_invitation()` RPC, re-scopes stale RPCs to org. **Must be applied.** |
| `011_create_org_rpc.sql` | **MUST CREATE** | `create_organization()` RPC, `handle_new_user()` trigger, update `get_shared_case` to include tax/comparison output. |
| `012_pdf_storage.sql` | **MUST CREATE** | `case_pdfs` table for PDF metadata storage. |

### §5.2 Idempotency Rules

All 6 `CREATE TYPE` statements in `001_initial_schema.sql` use bare `CREATE TYPE` without `IF NOT EXISTS`. PostgreSQL does not support `CREATE TYPE IF NOT EXISTS` before v16. Wrap each with the exception-safe pattern:

```sql
-- In 001_initial_schema.sql, replace each CREATE TYPE block with:
DO $$ BEGIN
  CREATE TYPE case_status AS ENUM ('draft', 'computed', 'finalized', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- Repeat for: client_status, org_role, invitation_status, conflict_outcome, gov_id_type
```

For local dev: `supabase db reset` drops and recreates all tables before replaying migrations — the enum issue is avoided. For production: always apply migrations sequentially, never replay 001 against a live database.

### §5.3 Migration 011 — `create_organization` + `handle_new_user`

**New file**: `app/supabase/migrations/011_create_org_rpc.sql`

```sql
-- create_organization: call after sign-up to create org + make user admin
CREATE OR REPLACE FUNCTION create_organization(p_name TEXT, p_slug TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_org_id UUID;
  v_slug TEXT := COALESCE(p_slug, lower(regexp_replace(p_name, '[^a-zA-Z0-9]', '-', 'g')));
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  INSERT INTO organizations (name, slug, plan, seat_limit)
  VALUES (p_name, v_slug, 'solo', 1)
  RETURNING id INTO v_org_id;

  INSERT INTO organization_members (org_id, user_id, role)
  VALUES (v_org_id, v_uid, 'admin');

  RETURN jsonb_build_object('success', true, 'org_id', v_org_id);
END; $$;

GRANT EXECUTE ON FUNCTION create_organization(TEXT, TEXT) TO authenticated;

-- handle_new_user: auto-create user_profiles row on sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO user_profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update get_shared_case to include tax and comparison output
CREATE OR REPLACE FUNCTION get_shared_case(p_token TEXT)
RETURNS TABLE (
  title TEXT,
  status TEXT,
  input_json JSONB,
  output_json JSONB,
  tax_output_json JSONB,
  comparison_output_json JSONB,
  decedent_name TEXT,
  date_of_death DATE
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.title,
    c.status::TEXT,
    c.input_json,
    c.output_json,
    c.tax_output_json,
    c.comparison_output_json,
    c.decedent_name,
    c.date_of_death
  FROM cases c
  WHERE c.share_token = p_token
    AND c.share_enabled = TRUE;
END; $$;
```

**Add to `src/lib/organizations.ts`**:

```ts
export async function createOrganization(
  firmName: string,
  slug?: string
): Promise<{ orgId: string }> {
  const { data, error } = await supabase.rpc('create_organization', {
    p_name: firmName,
    p_slug: slug ?? null,
  });
  if (error) throw error;
  return { orgId: (data as any).org_id };
}
```

### §5.4 Migration 012 — PDF Storage

**New file**: `app/supabase/migrations/012_pdf_storage.sql`

```sql
CREATE TABLE IF NOT EXISTS case_pdfs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID        NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id),
  org_id      UUID        NOT NULL REFERENCES organizations(id),
  pdf_type    TEXT        NOT NULL CHECK (pdf_type IN ('distribution_summary', 'tax_computation', 'demand_letter')),
  storage_key TEXT        NOT NULL,
  file_size   INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE case_pdfs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "case_pdfs_org" ON case_pdfs
  FOR ALL USING (org_id IN (SELECT user_org_ids()));
```

### §5.5 Fresh Project Setup

```
# Apply in this order:
supabase db reset  # local dev — drops and recreates cleanly

# OR for production (sequential apply):
001_initial_schema.sql
004_shared_case_rpc.sql
005_case_deadlines.sql
006_case_documents.sql   (no-op)
007_conflict_check.sql
009_cases_intake_data.sql
010_rls_org_scope.sql
011_create_org_rpc.sql   (NEW — must create)
012_pdf_storage.sql      (NEW — must create)
```

**After migrations, create storage bucket** (Supabase dashboard or SQL):
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('firm-logos', 'firm-logos', false);
CREATE POLICY "logo_owner_access" ON storage.objects FOR ALL
  USING (bucket_id = 'firm-logos' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
```

Create `app/supabase/_MIGRATION_NOTES.md` explaining:
- 002 and 003 were never written — initial schema was consolidated into 001
- 006 is a no-op because `case_documents` was already in 001
- 008 was skipped — the features in the spec that would have gone there are in 009 and 010

---

## §6 Navigation

### §6.1 Sidebar (Desktop)

**File**: `src/components/layout/AppLayout.tsx`

Full rewrite of the sidebar. Replace `bg-card` with `bg-sidebar`. Remove shadcn `Button` wrapper from nav items. Add auth-conditional rendering. Add footer with user email and Sign Out.

**navItems** (replace current array at lines 13–19):
```tsx
const mainNavItems = [
  { to: '/' as const,          label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cases' as const,     label: 'Cases',     icon: FolderOpen      },
  { to: '/cases/new' as const, label: 'New Case',  icon: FilePlus        },
  { to: '/clients' as const,   label: 'Clients',   icon: Users           },
  { to: '/deadlines' as const, label: 'Deadlines', icon: CalendarClock   },
] as const;

const settingsNavItems = [
  { to: '/settings' as const,  label: 'Settings',  icon: Settings        },
] as const;
```

**Sidebar structure** (replaces lines 27–57):
```tsx
<aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground no-print shadow-[2px_0_8px_rgba(30,58,95,0.15)]">
  {/* Logo */}
  <div className="px-4 py-5 flex items-center gap-2.5 border-b border-sidebar-border">
    <Scale className="h-5 w-5 text-sidebar-primary flex-shrink-0" />
    <div>
      <span className="text-sm font-bold tracking-tight font-serif text-sidebar-foreground">Inheritance</span>
      <p className="text-xs text-sidebar-foreground/60 mt-0.5">Philippine Succession Law</p>
    </div>
  </div>
  {/* Nav — authenticated only */}
  {user ? (
    <nav className="flex-1 px-3 py-3 space-y-0.5">
      {mainNavItems.map(({ to, label, icon: Icon }) => renderNavItem(to, label, Icon))}
      <div className="h-px bg-sidebar-border my-2" />
      {settingsNavItems.map(({ to, label, icon: Icon }) => renderNavItem(to, label, Icon))}
    </nav>
  ) : (
    <nav className="flex-1 px-3 py-3">
      {renderNavItem('/auth', 'Sign In', LogIn)}
    </nav>
  )}
  {/* Footer — authenticated only */}
  {user && (
    <div className="border-t border-sidebar-border px-3 py-3 space-y-1">
      <div className="px-3 py-1">
        <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
      </div>
      <button
        onClick={() => signOut()}
        className="group flex items-center gap-3 h-9 px-3 w-full rounded-md text-sm border-l-[3px] border-transparent text-sidebar-foreground/75 hover:bg-white/[0.08] hover:text-sidebar-foreground transition-colors duration-100 ease-out"
      >
        <LogOut className="h-4 w-4 flex-shrink-0" />Sign Out
      </button>
    </div>
  )}
</aside>
```

**`renderNavItem` function**:
```tsx
const renderNavItem = (to: string, label: string, Icon: React.ElementType) => {
  const isActive = !!matchRoute({ to, fuzzy: false });
  return (
    <Link key={to} to={to} className={cn(
      'group flex items-center gap-3 h-9 px-3 rounded-md text-sm transition-colors duration-100 ease-out border-l-[3px]',
      isActive
        ? 'bg-sidebar-accent border-sidebar-primary text-sidebar-foreground font-medium'
        : 'border-transparent text-sidebar-foreground/75 hover:bg-white/[0.08] hover:text-sidebar-foreground'
    )}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
};
```

**Active state**: `bg-sidebar-accent` (#2a4d7a fill) + `border-sidebar-primary` (#c5a44e gold left bar)
**Hover state**: `bg-white/[0.08]` (8% white tint on navy)
**Transition**: `duration-100 ease-out`

**Required imports** (replace lines 2–9):
```tsx
import { LayoutDashboard, FilePlus, FolderOpen, Users, CalendarClock, Settings, Scale, LogIn, LogOut, Menu, X } from 'lucide-react';
import { useMatchRoute, Link } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
```

### §6.2 Mobile Header + Navigation

**Replace current mobile tab bar** (lines 61–90) with hamburger header + drawer:

**Mobile header** (56px height, navy, hamburger on right):
```tsx
<header className="md:hidden bg-sidebar text-sidebar-foreground no-print">
  <div className="h-14 px-4 flex items-center justify-between border-b border-sidebar-border">
    <div className="flex items-center gap-2">
      <Scale className="h-5 w-5 text-sidebar-primary" />
      <span className="text-sm font-bold tracking-tight font-serif">Inheritance</span>
    </div>
    <button onClick={() => setDrawerOpen(true)} aria-label="Open navigation"
      className="p-2 rounded-md text-sidebar-foreground/75 hover:bg-white/[0.08] transition-colors duration-100">
      <Menu className="h-5 w-5" />
    </button>
  </div>
</header>
```

**Drawer** (slides in from left on tap, 288px wide, full nav + footer, 44px touch targets):
```tsx
{drawerOpen && (
  <div className="md:hidden fixed inset-0 z-50 flex">
    <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
    <div className="relative w-72 bg-sidebar text-sidebar-foreground flex flex-col shadow-xl animate-in slide-in-from-left duration-200">
      {/* Drawer header with close button */}
      {/* Nav items — h-11 = 44px touch target */}
      {/* Footer with email + Sign Out */}
    </div>
  </div>
)}
```

Nav items in drawer use `h-11` (44px) instead of `h-9` for WCAG 2.5.5 compliance. Tap on any nav item calls `setDrawerOpen(false)` to close the drawer.

### §6.3 Auth-Aware Rendering

| Auth State | Desktop Sidebar | Mobile Header | Nav Items |
|-----------|-----------------|---------------|-----------|
| Unauthenticated | Logo + Sign In link only | Logo + hamburger | Sign In only |
| Authenticated | Logo + full nav + email + Sign Out | Logo + hamburger | All pages + Sign Out |
| Loading | Logo only (useAuth loading state) | Logo only | None |

---

## §7 Landing Page

### §7.1 Unauthenticated View

**File**: `src/routes/index.tsx` (unauthenticated branch, lines 24–49)

**Current**: 2-line description + two buttons.

**Target** (spec-compliant landing page):
```tsx
// Unauthenticated branch — replace lines 24-49
<div className="max-w-2xl mx-auto py-12 sm:py-20 px-4 sm:px-6">
  {/* Hero */}
  <div className="text-center mb-10">
    <div className="inline-flex items-center gap-2 bg-accent/10 text-[#c5a44e] text-xs font-medium px-3 py-1 rounded-full border border-accent/20 mb-4">
      Philippine Succession Law
    </div>
    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight font-serif text-foreground mb-3">
      Estate Distribution<br />Made Simple
    </h1>
    <p className="text-base text-muted-foreground max-w-md mx-auto mb-6">
      Compute Philippine inheritance shares instantly. Handles testate, intestate, mixed succession, preterition, and representation.
    </p>
    <div className="flex items-center justify-center gap-3">
      <Link to="/auth" search={{ mode: 'signup' }}>
        <Button className="gap-2"><UserPlus className="h-4 w-4" />Create Account</Button>
      </Link>
      <Link to="/auth" search={{ mode: 'signin' }}>
        <Button variant="outline" className="gap-2"><LogIn className="h-4 w-4" />Sign In</Button>
      </Link>
    </div>
    <p className="text-xs text-muted-foreground mt-3">
      Or <Link to="/cases/new" className="text-primary hover:underline">try without an account</Link> — results won't be saved
    </p>
  </div>

  {/* Feature grid */}
  <div className="grid sm:grid-cols-3 gap-4 text-sm">
    {[
      { icon: Calculator, title: 'All Succession Types', desc: 'Testate, intestate, mixed, preterition' },
      { icon: Users, title: 'Full Family Tree', desc: 'Representation, illegitimate heirs, collateral' },
      { icon: FileText, title: 'Professional PDF', desc: 'Firm-branded reports for client delivery' },
    ].map(({ icon: Icon, title, desc }) => (
      <div key={title} className="flex gap-3 p-4 rounded-xl border bg-card">
        <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div><p className="font-medium">{title}</p><p className="text-muted-foreground text-xs mt-0.5">{desc}</p></div>
      </div>
    ))}
  </div>
</div>
```

### §7.2 Authenticated View (Dashboard)

**File**: `src/routes/index.tsx` (authenticated branch, lines 52–70)

**Current**: Heading + one-line text + single New Case button.

**Target**: Dashboard showing recent cases, deadline summary, quick actions.

```tsx
// Authenticated branch — complete replacement
function AuthenticatedDashboard({ user }: { user: User }) {
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const { organization } = useOrganization();
  const navigate = useNavigate();

  useEffect(() => {
    if (!organization) return;
    listCases(organization.id, { limit: 5 })
      .then(setCases)
      .finally(() => setCasesLoading(false));
  }, [organization?.id]);

  if (!organization) {
    return (
      <EmptyState
        icon={Building2}
        title="Set up your firm first"
        description="Create your organization to unlock clients, deadlines, and team features."
        action={{ label: 'Set Up Firm Profile', onClick: () => navigate({ to: '/settings' }) }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6 space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight font-serif">Dashboard</h1>
        </div>
        <Link to="/cases/new">
          <Button className="gap-2"><FilePlus className="h-4 w-4" />New Case</Button>
        </Link>
      </div>

      {/* Recent cases */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Recent Cases</h2>
          <Link to="/cases" className="text-sm text-primary hover:underline">View all →</Link>
        </div>
        {casesLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : cases.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No cases yet"
            description="Create your first estate case to start computing inheritance distributions."
            action={{ label: 'Create First Case', onClick: () => navigate({ to: '/cases/new' }) }}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {cases.map(c => (
              <Link key={c.id} to="/cases/$caseId" params={{ caseId: c.id }}>
                <CaseCard caseItem={c} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## §8 User Journey Fixes

### Journey: New Visitor (Overall: BROKEN → target: WORKING)

| Gap ID | Severity | Fix Summary |
|--------|----------|-------------|
| JNV-001 | CRITICAL | `src/lib/supabase.ts`: replace throw with graceful `supabaseConfigured` flag; `src/main.tsx`: show `<SetupPage>` if not configured (full spec §4.3) |
| JNV-005/JNV-008 | HIGH | `src/routes/index.tsx:41`: `<Link to="/auth" search={{ mode: 'signup' }}>`. `src/routes/auth.tsx`: add `validateSearch` with `mode` param |
| JNV-006 | CRITICAL | `src/routes/__root.tsx`: layout isolation (full spec §3.7) |
| JNV-003/JNV-019 | HIGH | `src/components/layout/AppLayout.tsx`: add Sign Out to sidebar footer + drawer (full spec §6.1) |
| JNV-007 | HIGH | `src/routes/auth.tsx`: add "Forgot password?" link → `/auth/reset` (full spec §3.5) |
| JNV-011/JNV-018 | CRITICAL | `src/lib/organizations.ts`: add `createOrganization()`; `src/routes/auth.tsx` + `src/routes/auth/callback.tsx`: call after sign-up (full spec §5.3) |
| JNV-012 | CRITICAL | `src/hooks/useAuth.ts:32-34`: return signUp result; `src/routes/auth.tsx:37-39`: check `result?.session` for auto-confirm (full spec §3.1) |
| JNV-016 | HIGH | `src/routes/index.tsx`: authenticated dashboard shows case list and onboarding prompt (full spec §7.2) |

### Journey: Sign-Up / Sign-In (Overall: BROKEN → target: WORKING)

| Gap ID | Severity | Fix Summary |
|--------|----------|-------------|
| JSS-004 | CRITICAL | `src/hooks/useAuth.ts:32-34`: `return await authLib.signUp(...)` |
| JSS-005 | CRITICAL | `src/routes/auth.tsx:37-39`: branch on `result?.session` (full spec §3.1) |
| JSS-008 | CRITICAL | Create `src/routes/auth/callback.tsx` + register in router (full spec §3.6) |
| JSS-014 | CRITICAL | `src/lib/organizations.ts`: add `createOrganization()`; call after auto-confirm sign-up |
| JSS-006 | HIGH | `src/routes/auth.tsx` signUpSuccess block: add Resend confirmation email button (full spec §3.1) |
| JSS-012 | HIGH | `src/routes/auth.tsx:36`: `navigate({ to: (redirectTo as any) || '/' })` |
| JSS-013 | MEDIUM | `src/routes/auth.tsx` top: check `!loading && user` → redirect to `/` |
| JSS-009/JSS-010 | MEDIUM | `src/routes/auth.tsx`: `disabled={submitting}` on inputs; spinner in submit button (full spec §3.2) |
| JSS-011 | MEDIUM | `src/routes/auth.tsx:41-43`: `SUPABASE_ERROR_MAP` friendly messages (full spec §3.2) |

### Journey: First Case (Overall: BROKEN → target: WORKING)

| Gap ID | Severity | Fix Summary |
|--------|----------|-------------|
| JFC-009/JFC-010 | CRITICAL | `src/routes/cases/new.tsx`: swap `<WizardContainer>` for `<GuidedIntakeForm orgId={org.id} userId={user.id} onComplete={(caseId) => navigate({ to: '/cases/$caseId', params: { caseId } })} onCancel={() => navigate({ to: '/' })} />` |
| JFC-011/JFC-012 | CRITICAL | `src/components/results/ResultsView.tsx`: add `caseId?: string; shareToken?: string; shareEnabled?: boolean; onToggleShare?: (e: boolean) => Promise<void>` to `ResultsViewProps`; pass through to `ActionsBar` |
| JFC-017/JFC-018 | CRITICAL | Create `src/routes/cases/index.tsx` `CasesListPage`; add to router; update Dashboard to show cases (full spec §7.2) |
| JFC-019 | CRITICAL | After `compute()` at `/cases/new`, call `createCase(orgId, userId, data, output)` → redirect to `/cases/${caseId}`. Alternatively, use `GuidedIntakeForm` which already does this. |
| JFC-013 | HIGH | `src/components/results/ActionsBar.tsx`: add PDF export button using `<PDFDownloadLink document={<EstatePDF input={input} output={output} profile={firmProfile} />} fileName={buildPDFFilename(input)}>` |
| JFC-006 | LOW | `src/components/wizard/WizardContainer.tsx`: when `currentStep === 'review'`, hide the nav-level Submit button (`hidden`); let ReviewStep's "Compute Distribution" be the sole CTA |
| JFC-007 | LOW | `src/routes/cases/new.tsx:50-54`: replace raw CSS spinner with `<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />` |

### Journey: Share Case (Overall: BROKEN → target: WORKING)

| Gap ID | Severity | Fix Summary |
|--------|----------|-------------|
| JSC-001/JSC-004/JSC-005 | CRITICAL | Wire share state through component tree. In `src/routes/cases/$caseId.tsx`: add `shareToken`, `shareEnabled` state; initialize from `caseRow`; add `handleToggleShare`; pass all three + `caseId` to `ResultsView`. In `ResultsView.tsx`: add to props, pass to `ActionsBar`. In `ActionsBar.tsx`: add Share button + `<ShareDialog>` (full fix spec in `analysis/journey-share-case.md` §FIX JSC-001`) |
| JSC-002 | CRITICAL | `src/routes/share/$token.tsx:97-101`: replace TODO comment with full ResultsHeader + DistributionSection + NarrativePanel + WarningsPanel + ComputationLog rendering (full spec in `analysis/journey-share-case.md` §FIX JSC-002) |
| JSC-003 | HIGH | Layout isolation: share route → `publicRootRoute` (full spec §3.7) |
| JSC-006 | MEDIUM | `src/components/case/ShareDialog.tsx:39-41`: add `copied` state; `setCopied(true); setTimeout(() => setCopied(false), 2000)` |
| JSC-007 | MEDIUM | `src/routes/share/$token.tsx`: replace loading text with `<Loader2>` spinner |
| JSC-008 | LOW | Verify `qrcode.react` in `package.json`; if absent: `npm install qrcode.react` in `app/` directory |

### Journey: Return Visit (Overall: BROKEN → target: WORKING)

| Gap ID | Severity | Fix Summary |
|--------|----------|-------------|
| JRV-001 | CRITICAL | `src/routes/index.tsx`: call `listCases(org.id, { limit: 5 })` on mount; render `<CaseCard>` grid with "View all" link (full spec §7.2) |
| JRV-002 | CRITICAL | Create `src/routes/cases/index.tsx` with `CasesListPage`; register in `src/router.ts` |
| JRV-012 | CRITICAL | `src/routes/settings/team.tsx`: add `export const settingsTeamRoute = createRoute({ getParentRoute: () => rootRoute, path: '/settings/team', component: TeamSettingsPage })`; import and register in router.ts |
| JRV-003 | HIGH | `src/components/layout/AppLayout.tsx`: add `{ to: '/cases', label: 'Cases', icon: FolderOpen }` to navItems (full spec §6.1) |
| JRV-007 | HIGH | `src/routes/cases/$caseId.tsx:12`: call `const { status: saveStatus } = useAutoSave(caseId, currentInput)` during wizard phase; pass `saveStatus` to display near wizard nav |
| JRV-010 | MEDIUM | `src/routes/settings/index.tsx:73`: replace `window.location.reload()` with `await updateProfile({ logoUrl: newUrl })` — `uploadLogo` returns the public URL |
| JRV-014 | HIGH | `src/routes/settings/team.tsx:100-109`: fetch profiles for all member user_ids; build `memberProfiles` map; pass to `<TeamMemberList>` |
| JRV-015 | HIGH | `src/components/settings/InviteMemberDialog.tsx:71`: replace root `<div role="dialog">` with shadcn `<Dialog open={open} onOpenChange={onOpenChange}><DialogContent>` |

### Journey: Settings → Team (Overall: BROKEN → target: WORKING)

| Gap ID | Severity | Fix Summary |
|--------|----------|-------------|
| JST-001 | CRITICAL | `src/routes/settings/team.tsx`: add `createRoute` wrapper; register in `router.ts` |
| JST-002 | CRITICAL | Create `src/routes/invite/$token.tsx`: call `acceptInvitation(token)` on mount → redirect to `/settings/team` on success |
| JST-003 | CRITICAL | `src/lib/organizations.ts:41-53 inviteMember()`: create Supabase Edge Function `send-invitation-email` (triggered by insert on `organization_invitations`) OR add explicit Supabase `inviteUserByEmail` call to generate the magic invite link |
| JST-004 | CRITICAL | `src/routes/settings/index.tsx`: add settings tab navigation: `<Tabs defaultValue="profile"><TabsList><TabsTrigger value="profile">Firm Profile</TabsTrigger><TabsTrigger value="team" onClick={() => navigate({ to: '/settings/team' })}>Team</TabsTrigger></TabsList>` |
| JST-005 | HIGH | `src/components/settings/InviteMemberDialog.tsx`: replace all raw HTML with shadcn components — `Dialog`, `Input`, `Select`, `Button` |
| JST-007 | HIGH | `src/routes/settings/team.tsx:101-109`: pass `memberProfiles` — `supabase.from('profiles').select('id,full_name,email').in('id', members.map(m => m.user_id))` |
| JST-008 | HIGH | `src/components/settings/TeamMemberList.tsx:64-78`: add "Change role" to dropdown; inline role `<Select>` on click; call `onUpdateRole(member.id, newRole)` |
| JST-011 | MEDIUM | `src/routes/settings/index.tsx:123-125`: wrap `updateProfile` color calls in `useDebouncedCallback(..., 600)` — add `use-debounce` to `package.json` |

---

## §9 Design Modernization

### §9.1 Design Tokens Update

**File**: `src/index.css`

Add to `:root` block (after `--sidebar-ring: #c5a44e;`):

```css
/* Shadow scale */
--shadow-xs:      0 1px 2px rgba(0,0,0,0.06);
--shadow-sm:      0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md:      0 4px 8px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
--shadow-lg:      0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.04);
--shadow-xl:      0 16px 48px rgba(0,0,0,0.14), 0 8px 16px rgba(0,0,0,0.06);
--shadow-sidebar: 2px 0 8px rgba(30, 58, 95, 0.15);

/* Animation/transition scale */
--duration-fast:    100ms;
--duration-default: 200ms;
--duration-slow:    300ms;
--ease-default:     cubic-bezier(0.4, 0, 0.2, 1);
--ease-out:         cubic-bezier(0.0, 0, 0.2, 1);
--ease-in:          cubic-bezier(0.4, 0, 1, 1);

/* Skeleton */
--skeleton-base:      #e2e8f0;
--skeleton-highlight: #f1f5f9;
```

Add to `@layer base` block:

```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--skeleton-base) 25%,
    var(--skeleton-highlight) 50%,
    var(--skeleton-base) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Also add import for print styles. **File**: `src/index.css` — add after existing imports:
```css
@import "./styles/print.css";
```
This fixes GAP-DSC-001: `PrintHeader` component renders visibly on screen because `print.css` was never imported.

### §9.2 Per-Component Modernization Specs

#### AppLayout (sidebar + mobile)
Full spec in §6.1 and §6.2. Summary:
- Sidebar: `bg-card` → `bg-sidebar` (navy). Gold active left bar. Auth-aware nav. Footer with sign-out.
- Mobile: scrollable tab bar → hamburger + 288px drawer with 44px touch targets.

#### WizardContainer
**File**: `src/components/wizard/WizardContainer.tsx`

- **GAP-DWC-001** (mobile progress): Add `<div className="sm:hidden mb-6">` with gold progress bar (`bg-accent`) + "Step N of M / Step Name" text above the desktop step pills. Desktop pills keep `hidden sm:flex`.
- **GAP-DWC-002** (hidden step title): Remove `sr-only` from step title `<h2>` in each step component. Replace with visible `<h2 className="text-lg font-semibold font-serif mb-4">{stepTitle}</h2>`.
- **GAP-DWC-003** (no animation): Wrap `<div className="wizard-step">` content in a fade/slide transition using `tw-animate-css` classes: add `animate-in fade-in slide-in-from-right-2 duration-200` to the step card on mount.
- **GAP-DWC-004** (dual Submit): In `WizardContainer.tsx` nav button logic, when `currentStepIndex === visibleSteps.length - 1`, hide the nav-level Submit button: `{currentStepIndex < visibleSteps.length - 1 && <Button type="submit">Submit</Button>}`.
- **GAP-DWC-008** (native checkboxes/radios): Replace throughout with shadcn `Checkbox` and `RadioGroup`/`RadioGroupItem` from `@radix-ui/react-radio-group` (already in `radix-ui` package).
- **GAP-DWC-013** (native selects): Replace all `<select>` in wizard/intake with shadcn `<Select>` from `@/components/ui/select`.
- **GAP-DWC-014** (WillStep hand-rolled tabs): **File** `src/components/wizard/WillStep.tsx`: Replace custom `activeTab` state + `<button>` tab bar with shadcn `<Tabs defaultValue="Institutions">` component.
- **GAP-DWC-019** (hardcoded `[hsl(var(--accent))]`): Replace with `bg-accent` Tailwind class. The `accent` token maps to `#c5a44e` — no need for the `hsl()` wrapper.
- **GAP-DWC-024** (no validation): Each wizard step's "Next" button should call `trigger(stepFieldNames)` from react-hook-form before advancing. Each field with `required` must show `<p className="text-xs text-destructive mt-1">{error?.message}</p>` when error state is set.

#### PersonCard (RelationshipBadge)
**File**: `src/components/wizard/PersonCard.tsx`

- **GAP-DWC-012**: Replace hardcoded off-palette colors (blue/purple/emerald) for relationship badge with design system colors:
  - Legitimate child: `bg-primary/10 text-primary border border-primary/20`
  - Illegitimate child: `bg-muted text-muted-foreground border border-border`
  - Spouse: `bg-accent/10 text-[#c5a44e] border border-accent/20`
  - Ascendant: `bg-foreground/5 text-foreground border border-border`
  - All other: `bg-muted text-muted-foreground border border-border`

#### ReviewStep
**File**: `src/components/wizard/ReviewStep.tsx`

- **GAP-DWC-017**: Replace sparse summary cards with KPI card pattern:
  ```tsx
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
    <div className="border rounded-xl p-4 bg-card">
      <p className="text-xs text-muted-foreground mb-1">Gross Estate</p>
      <p className="text-lg font-bold text-foreground">₱{formatAmount}</p>
    </div>
    {/* ... repeat for key values */}
  </div>
  ```
- **GAP-DWC-019**: Replace `bg-[hsl(var(--accent))]` with `bg-accent`.

#### GuidedIntakeForm
**File**: `src/components/intake/GuidedIntakeForm.tsx`

- **GAP-DWC-020**: Replace `bg-green-100 text-green-800` for completed steps with `bg-success/10 text-success border border-success/20`.
- **GAP-DWC-023**: Wrap `console.error` at line 103 with a toast: `toast.error('Failed to create case. Please try again.')` — requires sonner installed (see §9.3).

#### ResultsView
**File**: `src/components/results/ResultsView.tsx`

- **GAP-DRC-001**: Add the 4 orphaned components to the results render. After `<ComputationLog>`, add:
  ```tsx
  {output.per_heir_shares && <ShareBreakdownSection shares={output.per_heir_shares} />}
  {output.comparison && <ComparisonPanel input={input} output={output} caseId={caseId} />}
  {input.donations?.length > 0 && <DonationsSummaryPanel donations={input.donations} shares={output.per_heir_shares} />}
  ```
- **GAP-DRC-002/DRC-003**: Add `caseId`, `shareToken`, `shareEnabled`, `onToggleShare` to `ResultsViewProps` (full spec in §8 Journey: Share Case).

#### DistributionSection
**File**: `src/components/results/DistributionSection.tsx`

- **GAP-DRC-005** (no pie chart legend): Add `<Legend>` component from recharts inside the `<PieChart>`:
  ```tsx
  <Legend
    layout="horizontal"
    verticalAlign="bottom"
    align="center"
    iconType="circle"
    iconSize={10}
    formatter={(value) => <span className="text-xs text-foreground/70">{value}</span>}
  />
  ```

#### ActionsBar
**File**: `src/components/results/ActionsBar.tsx`

Add props: `caseId?: string`, `shareToken?: string`, `shareEnabled?: boolean`, `onToggleShare?: (e: boolean) => Promise<void>`, `firmProfile?: FirmProfile | null`

Add Share button (when `caseId` present):
```tsx
{caseId && shareToken !== undefined && (
  <>
    <Button variant="outline" onClick={() => setShareOpen(true)}>
      <Share2 className="size-4 mr-2" />Share
    </Button>
    <ShareDialog open={shareOpen} onOpenChange={setShareOpen}
      shareToken={shareToken} shareEnabled={shareEnabled ?? false}
      onToggleShare={onToggleShare!} />
  </>
)}
```

Add PDF export button (when `caseId` present):
```tsx
{caseId && (
  <PDFDownloadLink
    document={<EstatePDF input={input} output={output} profile={firmProfile ?? null} options={DEFAULT_PDF_OPTIONS} />}
    fileName={buildPDFFilename(input)}
  >
    {({ loading }) => (
      <Button variant="outline" disabled={loading}>
        {loading ? <Loader2 className="size-4 mr-2 animate-spin" /> : <FileDown className="size-4 mr-2" />}
        {loading ? 'Preparing…' : 'Export PDF'}
      </Button>
    )}
  </PDFDownloadLink>
)}
```

Clipboard feedback for Copy Narratives:
```tsx
const [copied, setCopied] = useState(false);
const handleCopyNarratives = async () => {
  try {
    await navigator.clipboard.writeText(narrativeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch { toast.error('Copy failed — clipboard access denied'); }
};
<Button variant="outline" onClick={handleCopyNarratives}>
  {copied ? <Check className="size-4 mr-2 text-success" /> : <Copy className="size-4 mr-2" />}
  {copied ? 'Copied!' : 'Copy Narratives'}
</Button>
```

#### Shared Form Components (PersonPicker, EnumSelect, ClientDetailsStep)

**GAP-DSC-002/DSC-003/DSC-004/DSC-005**: Replace all native `<select>` elements in:
- `src/components/shared/PersonPicker.tsx`
- `src/components/shared/EnumSelect.tsx`
- `src/components/intake/ClientDetailsStep.tsx`
- `src/components/intake/FamilyCompositionStep.tsx`

With shadcn `<Select>` / `<SelectTrigger>` / `<SelectContent>` / `<SelectItem>` from `@/components/ui/select`.

#### ClientForm, ClientList, InviteMemberDialog
**GAP** from catalog-components: These three use raw HTML elements throughout.

- **ClientForm** (`src/components/clients/ClientForm.tsx`): Replace all `<input>`, `<select>` with shadcn `Input`, `Select`. Add `react-hook-form` + `zod` validation (schema from `@/types/client`).
- **ClientList** (`src/components/clients/ClientList.tsx`): Replace raw `<table>` with shadcn `Table` / `TableHeader` / `TableBody` / `TableRow` / `TableHead` / `TableCell` from `@/components/ui/table`.
- **InviteMemberDialog** (`src/components/settings/InviteMemberDialog.tsx`): Replace root `<div role="dialog">` with shadcn `<Dialog>`. Replace `<input>` with `<Input>`. Replace `<select>` with `<Select>`. Replace `<button>` with `<Button>`.

### §9.3 Animation/Transition Standards

All transitions in the app should use these standards:

| Context | Duration | Easing | CSS Class |
|---------|----------|--------|-----------|
| Nav item hover/active | 100ms | ease-out | `transition-colors duration-100 ease-out` |
| Modal/dialog open | 200ms | ease-out | `animate-in fade-in zoom-in-95 duration-200` |
| Drawer slide-in | 200ms | ease-out | `animate-in slide-in-from-left duration-200` |
| Step transition | 200ms | ease-default | `animate-in fade-in slide-in-from-right-2 duration-200` |
| Toast entry | 300ms | ease-out | Handled by sonner |
| Skeleton shimmer | 1500ms | linear | `.skeleton` CSS class (infinite) |

**Install sonner toast library** (currently missing):
```
npm install sonner
```

**File**: `src/main.tsx` — add `<Toaster />` component from sonner at root:
```tsx
import { Toaster } from 'sonner';
// In root render:
<><RouterProvider router={router} /><Toaster position="bottom-right" /></>
```

**Usage pattern** throughout the app:
```ts
import { toast } from 'sonner';
toast.success('Case saved');
toast.error('Failed to save case');
```

### §9.4 Loading States

**New file**: `src/components/ui/skeleton.tsx`
```tsx
import { cn } from "@/lib/utils"
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />
}
export { Skeleton }
```

| Location | Current State | Fix |
|----------|--------------|-----|
| `routes/index.tsx:16-21` | Hand-rolled border spinner | Replace with Skeleton dashboard layout (4 card grid) |
| `components/clients/ClientList.tsx:60` | `Loading...` text | 5 skeleton table rows maintaining column widths |
| `routes/cases/$caseId.tsx:86-89` | Hand-rolled border spinner | Skeleton wizard layout (progress bar + form fields) |
| `routes/cases/$caseId.tsx:96-103` | Hand-rolled spinner + text | `<Loader2 className="h-16 w-16 animate-spin text-primary">` with track circle + "Computing distribution…" + "Applying Philippine succession law rules" subtitle |
| `routes/share/$token.tsx:53-63` | Static text only | Add `<Loader2>` inside loading card |
| `components/case/DocumentChecklist.tsx:44-45` | `Loading documents...` text | 6 skeleton document rows |
| `routes/settings/team.tsx:33-35` | `<p>Loading...</p>` | Skeleton member list (avatar + name + role per row) |
| `components/settings/FirmProfileForm.tsx` submit button | Text only | `<Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...` when `saving` prop is true |
| `components/case/NoteEditor.tsx` save button | Text only | `<Loader2>` + `Saving...` when `saving` prop is true |
| `components/settings/InviteMemberDialog.tsx` submit | No loading state | Add `inviting` state; disable button + show spinner during invite API call |
| `components/intake/IntakeReviewStep.tsx` | Button text only when `isSubmitting` | Replace card content with centered `<Loader2>` + "Creating case…" when `isSubmitting` |

**Standardize all spinners**: Replace all hand-rolled CSS spinner divs (`animate-spin border-4 border-primary border-t-transparent rounded-full`) with `<Loader2 className="h-N w-N animate-spin text-muted-foreground" />` from lucide-react.

### §9.5 Empty States

**New file**: `src/components/ui/empty-state.tsx`
```tsx
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground/60" />
      </div>
      <h3 className="font-medium text-sm mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>
      {action && <Button size="sm" onClick={action.onClick}>{action.label}</Button>}
    </div>
  )
}
```

| Location | Empty Trigger | Icon | Title | Description | Action |
|----------|--------------|------|-------|-------------|--------|
| `routes/index.tsx` (auth, no cases) | `cases.length === 0` | `FolderOpen` | No cases yet | Create your first estate case | "Create First Case" → `/cases/new` |
| `routes/deadlines.tsx:206-208` | No deadlines | `CheckCircle2` | All caught up | No pending deadlines across your active cases | — |
| `components/clients/ClientList.tsx` | `clients.length === 0` | `Users` | No clients yet | Add your first client to start tracking estate cases | — (parent route has Add Client button) |
| `components/case/CaseNotesPanel.tsx` | `notes.length === 0` | `FileText` | No notes yet | Add notes to track research, decisions, and client communications | "Add Note" → `setShowEditor(true)` |
| `components/settings/TeamMemberList.tsx` | `members.length === 0` | `Users2` | Just you for now | Invite colleagues to collaborate on estate cases | — (parent page has Invite button) |
| `components/case/DocumentChecklist.tsx` | `documents.length === 0` | `FolderOpen` | No documents configured | Document checklist populates automatically when a case is computed | — |
| `components/case/DeadlineTimeline.tsx` | `deadlines.length === 0` | `CalendarX` | No deadlines yet | Settlement deadlines appear automatically after computing the distribution | — |
| `routes/settings/team.tsx:41-46` | No organization | `Building2` | No organization found | Complete your firm profile setup to manage team members | "Set Up Firm Profile" → `/settings` |

### §9.6 Mobile/Responsive Audit

| Gap ID | Severity | File | Fix |
|--------|----------|------|-----|
| GAP-DMR-001 | CRITICAL | `components/layout/AppLayout.tsx` | Mobile nav button text invisible on navy bg; full fix in §6.2 (hamburger+drawer replaces tab bar entirely) |
| GAP-DMR-002 | CRITICAL | `components/wizard/WillStep.tsx:45-62` | 4-tab bar overflows 375px viewport; fix: replace with shadcn `<Tabs>` (GAP-DWC-014 above) |
| GAP-DMR-003 | CRITICAL | `components/results/DistributionSection.tsx` | Distribution table overflows narrow viewports; add `<div className="overflow-x-auto">` wrapper around `<table>` |
| GAP-DMR-004 | CRITICAL | `routes/clients/index.tsx` + `ClientList.tsx` | Client table overflows mobile; same `overflow-x-auto` wrapper fix; consider stacked card layout below `sm` breakpoint |
| GAP-DMR-005 | CRITICAL | Multiple | Nav touch targets 32px (below 44px WCAG 2.5.5 min); full fix: drawer nav with `h-11` (44px) items |
| GAP-DMR-006 | HIGH | `routes/deadlines.tsx` | `<table>` for deadline groups has no mobile treatment; add `overflow-x-auto` wrapper |
| GAP-DMR-007 | HIGH | `components/case/DocumentChecklist.tsx` | Document rows have 3-column layout that collapses poorly; use flexbox `flex-wrap` or stack at `sm` |
| GAP-DMR-008 | HIGH | `components/wizard/WizardContainer.tsx` | Step indicator pills with `hidden sm:inline` labels have no mobile progress indicator; full fix: gold progress bar for mobile (GAP-DWC-001 above) |
| GAP-DMR-009 | MEDIUM | `routes/cases/$caseId.tsx` + `routes/cases/new.tsx` | WizardContainer has `p-4 sm:p-6 lg:p-8` padding but card width lacks a `max-w-2xl` constraint on desktop; add `<div className="max-w-2xl mx-auto">` wrapper around wizard |
| GAP-DMR-010 | MEDIUM | `routes/share/$token.tsx` | Shared case view has no responsive treatment for results tables |
| GAP-DMR-011 | MEDIUM | `components/results/NarrativePanel.tsx` | Accordion items have no word-break treatment; long names overflow |
| GAP-DMR-012 | MEDIUM | `routes/settings/index.tsx` | Color pickers: `flex gap-4` becomes cramped at 375px; add `flex-wrap` |
| GAP-DMR-013 | MEDIUM | `routes/deadlines.tsx:79` | Queries `cases` by `user_id` instead of `org_id`; breaks multi-seat teams; fix: use `useOrganization()` to get `org_id`, query `cases.org_id` |

---

## §10 Onboarding Flow

**New file**: `src/routes/onboarding.tsx`

This route is reached immediately after:
1. Auto-confirm sign-up (when `enable_confirmations = false`)
2. Email confirmation via `/auth/callback` for new users with no org

**Guard**: If `user` is null (not authenticated), redirect to `/auth`. If `user` has an org, redirect to `/`.

**3-step flow**:

**Step 1 — Firm Details** (required):
- Firm Name (required, placeholder "Reyes & Associates Law Offices")
- Firm Phone (optional)
- Firm Address (optional)
- CTA: "Continue →"

On Submit: call `createOrganization(firmName)` → stores `org_id` in component state.

**Step 2 — Profile Setup** (optional, skippable):
- Counsel Full Name
- IBP Roll No.
- PTR No.
- CTA: "Continue →" / "Skip for now"

On Submit: call `updateProfile({ counselName, ibpRollNo, ptrNo })`.

**Step 3 — First Case CTA** (final):
- Heading: "You're all set!"
- Description: "Your firm profile is configured. Start your first estate distribution computation."
- Primary CTA: `<Button><FilePlus />Create Your First Case</Button>` → navigate to `/cases/new`
- Secondary: `<Link to="/">Go to Dashboard</Link>`

**Layout**: Full-screen centered, no sidebar, with a step progress indicator (3 dots or numbered pills) and the firm logo placeholder.

```tsx
export const onboardingRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/onboarding',
  component: OnboardingPage,
});
```

Register in `src/router.ts` as child of `publicRootRoute`.

---

## Appendix A: Complete File Inventory

### Routes (`src/routes/`)

| File | Status | Primary Gap |
|------|--------|-------------|
| `__root.tsx` | BROKEN | AppLayout wraps all routes including auth/share |
| `index.tsx` | PARTIAL | Dashboard empty; no case list |
| `auth.tsx` | BROKEN | Wrong mode on Create Account; no PKCE callback; no org creation |
| `cases/new.tsx` | BROKEN | No case record created; ephemeral only |
| `cases/$caseId.tsx` | PARTIAL | useAutoSave unused; no back-to-results shortcut |
| `clients/index.tsx` | PARTIAL | Raw HTML table (ClientList); error swallowed |
| `clients/new.tsx` | BROKEN | Silent fail if no org; no error display |
| `clients/$clientId.tsx` | PARTIAL | Cases section stub |
| `deadlines.tsx` | PARTIAL | user_id not org_id; no mark-complete |
| `settings/index.tsx` | PARTIAL | window.location.reload hack; no Team sub-nav |
| `settings/team.tsx` | BROKEN | createRoute missing — route does not exist |
| `share/$token.tsx` | BROKEN | Results are a TODO comment |
| `auth/callback.tsx` | **MISSING** | Must create — PKCE confirmation |
| `auth/reset.tsx` | **MISSING** | Must create — password reset |
| `auth/reset-confirm.tsx` | **MISSING** | Must create — reset confirmation |
| `onboarding.tsx` | **MISSING** | Must create — new user flow |
| `cases/index.tsx` | **MISSING** | Must create — case list |
| `invite/$token.tsx` | **MISSING** | Must create — accept team invite |

### Components (`src/components/`)

| Subdirectory | Files | Status Summary |
|-------------|-------|----------------|
| `layout/` | AppLayout.tsx | PARTIAL — navy sidebar tokens unused; no auth-conditional nav |
| `dashboard/` | CaseCard.tsx | COMPLETE |
| `intake/` | 8 files | PARTIAL — GuidedIntakeForm complete but orphaned; GAP-DWC-023 error not surfaced |
| `wizard/` | 10 files | PARTIAL — native inputs throughout; dual Submit; no field validation |
| `results/` | 12 files + 3 utils | PARTIAL — 4 components orphaned (never rendered); ActionsBar missing Save/Share/PDF |
| `case/` | 7 files | PARTIAL — DocumentChecklist backend stubs; DeadlineTimeline "Check Off" has no handler |
| `clients/` | 4 files | STUB — ClientForm + ClientList use raw HTML |
| `settings/` | 5 files | STUB — InviteMemberDialog raw HTML div |
| `shared/` | 6 files + index | PARTIAL — PersonPicker/EnumSelect use native `<select>`; print.css not imported |
| `ui/` | 14 files | PARTIAL — missing Skeleton, EmptyState, Toast/Sonner |
| `pdf/` | 9 files | COMPLETE |
| `tax/` | 1 + tabs | COMPLETE — EstateTaxWizard has no route |

### Lib (`src/lib/`)

| File | Status | Key Gap |
|------|--------|---------|
| `supabase.ts` | BROKEN | Throws on missing env vars — white screen |
| `auth.ts` | PARTIAL | No resetPassword / updatePassword |
| `cases.ts` | COMPLETE | — |
| `clients.ts` | COMPLETE | — |
| `organizations.ts` | PARTIAL | Missing `createOrganization` |
| `intake.ts` | PARTIAL | Non-null assertion crash on `track!` at line 222 |
| `comparison.ts` | PARTIAL | Static WASM import blocks UI thread |
| `firm-profile.ts` | COMPLETE | — |
| `deadlines.ts` | COMPLETE | — |
| `documents.ts` | COMPLETE (data layer) | Backend fn stubs in DocumentChecklist component |
| `share.ts` | COMPLETE | — |
| `pdf-export.ts` | COMPLETE | — |
| `export-zip.ts` | COMPLETE | — |
| `tax-bridge.ts` | COMPLETE | — |
| `case-notes.ts` | COMPLETE | — |
| `conflict-check.ts` | COMPLETE | Raw Tailwind color strings bypass design system |
| `timeline.ts` | COMPLETE | Custom deadlines invisible in timeline stages |
| `utils.ts` | COMPLETE | — |

### Hooks (`src/hooks/`)

| File | Status | Key Gap |
|------|--------|---------|
| `useAuth.ts` | PARTIAL | signUp discards return value; no error state |
| `useOrganization.ts` | PARTIAL | No createOrganization action |
| `useAutoSave.ts` | COMPLETE | Never called from CaseEditorPage |
| `useTaxBridge.ts` | COMPLETE | — |
| `usePrintExpand.ts` | COMPLETE | — |

---

## Appendix B: Known Failures

All failures documented in upstream frontier logs, with fix status per this spec.

### From `loops/inheritance-frontend-forward/frontier/analysis-log.md`

| Failure | Root Cause | Fix in This Spec |
|---------|-----------|-----------------|
| `/auth` route was placeholder stub | Route had no component | Fixed in codebase before this loop; auth.tsx exists |
| `/settings/team` unregistered | `createRoute` never called | §8 JRV-012: add createRoute + register in router |
| Duplicate migration (006 = no-op) | `case_documents` already in 001 | §5.1: documented as deliberate no-op; add `_MIGRATION_NOTES.md` |
| Auth page shown behind AppLayout | `__root.tsx` unconditional AppLayout wrap | §3.7: layout isolation using pathname check |
| PKCE callback missing | No `/auth/callback` route | §3.6: new `auth/callback.tsx` route |

### From `loops/inheritance-frontend-reverse/frontier/aspects.md` (3 documented failures)

| Failure | Root Cause | Fix in This Spec |
|---------|-----------|-----------------|
| Children for representation missing | Frontend spec gap | Confirmed working in `representation.ts`; spec acknowledges |
| Auth flow absent | No callback route, no org creation | §3.1–3.6 and §5.3 cover full auth fix |
| Duplicate migration 006 | Explained above | §5.1 and §5.5 |

### Critical Gaps by Count

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Routes | 5 missing | 0 | 0 | 0 | 5 |
| Auth flow | 4 | 3 | 5 | 3 | 15 |
| Case persistence | 4 | 4 | 3 | 4 | 15 |
| Share feature | 2 | 3 | 2 | 2 | 9 |
| Navigation | 3 | 4 | 3 | 2 | 12 |
| Team settings | 4 | 4 | 5 | 3 | 16 |
| Design/loading/empty | 0 | 9 | 8 | 6 | 23 |
| Migrations | 2 | 4 | 3 | 0 | 9 |
| **Total** | **24** | **31** | **29** | **20** | **104** |

---

*End of Inheritance Platform Layer Spec v1.0*
