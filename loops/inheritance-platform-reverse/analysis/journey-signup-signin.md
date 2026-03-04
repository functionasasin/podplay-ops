# Analysis: journey-signup-signin
**Wave**: 2 — User Journey Audit
**Date**: 2026-03-04
**Method**: Walk every step of sign-up → email confirm → sign-in → landing, tracing all handlers, API calls, and state transitions.

---

## Journey Overview

**Entry**: User is on `/` or `/auth`, decides to create an account.

**Overall rating**: **BROKEN** — 3 critical failure paths prevent a new user from completing auth:
1. PKCE callback route missing → email confirmation silently fails
2. `useAuth.signUp()` return value discarded → auto-confirm redirect impossible
3. No org creation after sign-up → silent failures throughout the app post-auth

---

## Step-by-Step Walkthrough

### Step 1: User clicks "Create Account" or "Sign up" link

From `routes/index.tsx` line 41:
```tsx
<Link to="/auth">
  <Button variant="outline" className="w-full gap-2">
    <UserPlus className="h-4 w-4" />
    Create Account
  </Button>
</Link>
```

Both "Sign In" and "Create Account" link to `/auth` with no query params. `AuthPage` initializes with
`useState<'signin' | 'signup'>('signin')` (line 19 of `routes/auth.tsx`) — so clicking "Create Account"
shows the **Sign In** form first. The user must find and click the "Sign up" text-link at the bottom.

**Gap JSS-001** (HIGH): "Create Account" button lands on Sign In form. From `journey-new-visitor`: JNV-005.
- **File**: `src/routes/index.tsx` line 41
- **File**: `src/routes/auth.tsx` lines 12–16
- **Fix**: Add `validateSearch` to `authRoute` for `mode` param; link with `to="/auth" search={{ mode: 'signup' }}` from index.tsx; initialize `useState` from `authRoute.useSearch().mode`.

---

### Step 2: Sign-up form rendered

After clicking "Sign up" toggle → `mode = 'signup'`. Form fields:
- **Full Name** (optional, no asterisk, no `required` attribute): `routes/auth.tsx` line 98–108
- **Email** (required, browser validation): lines 110–119
- **Password** (required, `minLength={6}`, browser validation only): lines 121–131

No password confirmation field. No firm name field. No ToS checkbox.

**Gap JSS-002** (LOW): No password confirmation field.
- User can typo password with no detection.
- **File**: `src/routes/auth.tsx`
- **Fix**: Add `confirmPassword` state; add a second `<Input type="password">` labeled "Confirm Password"; validate `password === confirmPassword` before `handleSubmit` fires; show inline `<p className="text-sm text-destructive">` under the field if mismatch.

**Gap JSS-003** (MEDIUM): No firm name field during sign-up.
- The app requires an organization for most features. There is no `createOrganization` in `lib/organizations.ts`. New users permanently lack an org.
- **File**: `src/routes/auth.tsx` (signup form section)
- **Fix**: Add optional `firmName` field to signup form (placeholder "Law Office of…"); pass to `handleSubmit`; call `createOrganization(userId, firmName || 'My Firm')` after successful sign-up. Also requires adding `createOrganization` to `lib/organizations.ts`.

---

### Step 3: Sign-up submission

`handleSubmit` (lines 29–46 of `routes/auth.tsx`):
```ts
await signUp(email, password, fullName || undefined);
setSignUpSuccess(true);
```

`useAuth.signUp` (lines 32–34 of `hooks/useAuth.ts`):
```ts
const signUp = async (...) => {
  await authLib.signUp(email, password, fullName);
  // return value DISCARDED
};
```

`lib/auth.signUp` returns `{ data, error }` where `data.session` is non-null when `enable_confirmations = false`.

**Gap JSS-004** (CRITICAL): `useAuth.signUp()` discards the return value.
- `lib/auth.ts` line 17: `return data` — data includes `{ user, session }`.
- `hooks/useAuth.ts` line 33: result of `authLib.signUp()` is not returned.
- Consequence: callers of `useAuth().signUp()` cannot detect auto-confirm (session returned) vs. pending confirm (session null).
- **File**: `src/hooks/useAuth.ts` lines 32–34
- **Fix**:
  ```ts
  const signUp = async (email: string, password: string, fullName?: string) => {
    return await authLib.signUp(email, password, fullName);
  };
  ```
  Also update `UseAuthReturn` interface: `signUp: (email: string, password: string, fullName?: string) => Promise<{ user: User | null; session: Session | null }>;`

**Gap JSS-005** (CRITICAL — same as JNV-012): When `enable_confirmations = false`, user is auto-signed-in but sees "Check your email".
- `routes/auth.tsx` lines 37–39: `await signUp(...)` then always `setSignUpSuccess(true)`.
- With local config (`enable_confirmations = false`), `signUp` returns `data.session !== null` — user is already authenticated.
- User sees "Check your email. We sent a confirmation link…" — this is factually wrong (no email sent).
- User must click "Back to Sign In" → manually fill form again → sign in → land at `/`.
- **File**: `src/routes/auth.tsx` lines 37–39
- **Fix** (after JSS-004 fix):
  ```ts
  const result = await signUp(email, password, firmName || undefined, fullName || undefined);
  if (result?.session) {
    // Auto-confirmed: create org and redirect to onboarding
    await createOrganization(result.user!.id, firmName || 'My Firm');
    navigate({ to: '/onboarding' });
  } else {
    // Pending confirmation
    setSignUpSuccess(true);
  }
  ```

---

### Step 4: "Check your email" state (confirmations ON path)

`AuthPage` renders when `signUpSuccess === true` (lines 48–73 of `routes/auth.tsx`):
```tsx
<Card>
  <CardHeader className="text-center">
    <CardTitle>Check your email</CardTitle>
    <CardDescription>
      We sent a confirmation link to <strong>{email}</strong>. Click it to activate your
      account, then come back and sign in.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Button variant="outline" onClick={() => { setSignUpSuccess(false); setMode('signin'); setPassword(''); }}>
      Back to Sign In
    </Button>
  </CardContent>
</Card>
```

Note: `AppLayout` still wraps this — full sidebar visible. (From JNV-006; fix is layout isolation.)

**Gap JSS-006** (HIGH): No "Resend confirmation email" button.
- If user never receives the email, there is no way to resend from the UI.
- Supabase supports `supabase.auth.resend({ type: 'signup', email })`.
- **File**: `src/routes/auth.tsx` (signUpSuccess branch, lines 48–73)
- **Fix**: Add resend state and button:
  ```tsx
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const handleResend = async () => {
    setResendStatus('sending');
    await supabase.auth.resend({ type: 'signup', email });
    setResendStatus('sent');
  };
  // In render:
  <Button variant="ghost" size="sm" disabled={resendStatus !== 'idle'} onClick={handleResend}>
    {resendStatus === 'idle' ? 'Resend email' : resendStatus === 'sending' ? 'Sending…' : 'Email sent!'}
  </Button>
  ```

**Gap JSS-007** (LOW): No expiry information in "Check your email" card.
- Config: `otp_expiry = 3600` (1 hour). User doesn't know the link expires.
- **File**: `src/routes/auth.tsx` line 54–56
- **Fix**: Add sentence: "The link expires in 1 hour." below the current CardDescription text.

---

### Step 5: User clicks confirmation link in email

With `enable_confirmations = true`, Supabase sends an email with a magic link.

Supabase JS v2 defaults to **PKCE flow** when `createClient` is called without specifying
`auth: { flowType: 'implicit' }`. The `supabase.ts` file (line 13) uses bare `createClient(url, key)`.

**PKCE email confirmation flow**:
1. `supabase.auth.signUp()` generates a `code_verifier` and stores it in `localStorage`
2. Supabase sends email with link: `https://project.supabase.co/auth/v1/verify?token=…&type=signup&redirect_to={SITE_URL}`
3. Supabase verifies the token, generates a `code`
4. Redirects to: `{SITE_URL}?code={code}` (e.g., `http://localhost:3000?code=abc123`)
5. App must call `supabase.auth.exchangeCodeForSession(code)` to obtain the session

**Gap JSS-008** (CRITICAL — NEW): No auth callback route — PKCE email confirmation is broken.
- The app has 10 registered routes (from `router.ts` lines 14–25). None handles `?code=` from Supabase confirmation redirect.
- When user clicks confirmation link, they are sent to `http://localhost:3000?code=abc123`.
- TanStack Router matches this to the `indexRoute` (`/`). The `?code=` param is unused.
- No route calls `supabase.auth.exchangeCodeForSession(code)`.
- Result: the code is discarded, the session is never established, and the user sees the unauthenticated landing page. Email confirmation silently fails.
- **Files to create**: `src/routes/auth/callback.tsx`
- **Fix**:
  ```tsx
  // src/routes/auth/callback.tsx
  import { createRoute, useNavigate, useSearch } from '@tanstack/react-router';
  import { useEffect, useState } from 'react';
  import { rootRoute } from '../__root';
  import { supabase } from '@/lib/supabase';

  export const authCallbackRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/auth/callback',
    validateSearch: (search) => ({ code: search.code as string | undefined }),
    component: AuthCallbackPage,
  });

  function AuthCallbackPage() {
    const { code } = authCallbackRoute.useSearch();
    const navigate = useNavigate();
    const [error, setError] = useState('');

    useEffect(() => {
      if (!code) { navigate({ to: '/' }); return; }
      supabase.auth.exchangeCodeForSession(code)
        .then(({ error: err }) => {
          if (err) setError(err.message);
          else navigate({ to: '/onboarding' });
        });
    }, [code]);

    if (error) return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-destructive">{error}</p>
        <a href="/auth" className="text-primary underline">Return to sign in</a>
      </div>
    );
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        <span className="ml-3 text-muted-foreground">Confirming your account…</span>
      </div>
    );
  }
  ```
  Register `authCallbackRoute` in `src/router.ts` (add to routeTree).
  Set `SITE_URL` in Supabase project config to `https://yourapp.com/auth/callback` so confirmation links redirect to the correct route.

---

### Step 6: Sign-in submission

`handleSubmit` in `signin` mode (lines 34–36 of `routes/auth.tsx`):
```ts
await signIn(email, password);
navigate({ to: '/' });
```

**During submission**: `submitting: true` → button shows "Please wait…" text. Input fields remain enabled (user can still type). No spinner icon in button.

**Gap JSS-009** (MEDIUM): Input fields remain enabled during submission.
- User can modify email/password while form is submitting.
- **File**: `src/routes/auth.tsx` lines 101, 112, 123
- **Fix**: Add `disabled={submitting}` to all three `<Input>` elements.

**Gap JSS-010** (MEDIUM): No spinner in submit button.
- "Please wait…" text is the only feedback. No visual loading indicator.
- **File**: `src/routes/auth.tsx` line 141–147
- **Fix**:
  ```tsx
  <Button type="submit" className="w-full gap-2" disabled={submitting}>
    {submitting ? (
      <>
        <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        Please wait…
      </>
    ) : mode === 'signin' ? 'Sign In' : 'Create Account'}
  </Button>
  ```

---

### Step 7: Sign-in error states

`catch (err)` → `setError(err.message ?? 'Something went wrong')` → `<Alert variant="destructive">`.

Supabase error messages surfaced verbatim:
- `"Invalid login credentials"` — wrong email or password
- `"Email not confirmed"` — account exists but email not confirmed
- `"User already registered"` — account already exists during sign-up
- `"Password should be at least 6 characters"` — Supabase-side validation

**Gap JSS-011** (MEDIUM): Raw Supabase error messages shown without user-friendly rewriting.
- "Invalid login credentials" is technically accurate but "Incorrect email or password" is more user-friendly.
- "Email not confirmed" shows no path to resend the confirmation.
- **File**: `src/routes/auth.tsx` lines 41–43
- **Fix**: Add error message mapping in `handleSubmit`:
  ```ts
  const friendlyMessages: Record<string, string> = {
    'Invalid login credentials': 'Incorrect email or password. Please try again.',
    'Email not confirmed': 'Please confirm your email address before signing in.',
    'User already registered': 'An account with this email already exists. Try signing in instead.',
    'Password should be at least 6 characters': 'Password must be at least 6 characters.',
  };
  const msg = err.message ?? 'Something went wrong';
  setError(friendlyMessages[msg] ?? msg);
  ```
  For "Email not confirmed" specifically, also show a resend link:
  ```tsx
  {error.includes('confirm your email') && (
    <button onClick={handleResend} className="text-sm text-primary underline mt-1">
      Resend confirmation email
    </button>
  )}
  ```

---

### Step 8: Post-sign-in landing (`/`)

`navigate({ to: '/' })` after `signIn` (line 36 of `routes/auth.tsx`).

`DashboardPage` authenticated branch (lines 52–70 of `routes/index.tsx`):
- Heading "Dashboard", muted text "Welcome back. Use 'New Case' to start…", one "New Case" button.
- No case list. No deadline summary. No org status. No onboarding prompts.

**Gap JSS-012** (HIGH): Always redirects to `/` — no "redirect to intended URL" pattern.
- Covered in JNV-014. Reinforced here: a user trying to access `/settings` who gets sent to `/auth` will land at `/` after sign-in, not `/settings`.
- **File**: `src/routes/auth.tsx` line 36
- **Fix**: Read `redirect` search param from `authRoute.useSearch()`, navigate to `(redirectTo as any) ?? '/'`.
  Protected routes that show "Sign in to…" message must pass `search={{ redirect: currentPath }}` in their sign-in links.

**Gap JSS-013** (HIGH): No already-authenticated redirect on `/auth`.
- A signed-in user can navigate to `/auth` and see the sign-in form.
- **File**: `src/routes/auth.tsx` (component)
- **Fix**: In `AuthPage`, check auth state on mount:
  ```tsx
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) navigate({ to: '/' });
  }, [user, loading]);
  if (loading) return <Spinner />;
  ```

---

### Step 9: Post-sign-in — new user with no org

After successful sign-in, user lands at `/`. `useAuth` returns `{ user, loading: false }`.

The app has no org-creation flow. All org-dependent features silently fail:
- `/clients`: `listClients` filters by `org_id` — returns empty, no explanation
- `/deadlines`: queries `cases` by `user_id` — returns empty if no cases
- `/settings`: `loadFirmProfile` reads from `user_profiles` — works, but team section unreachable
- Case creation: `createCase` inserts with `user_id` only (no `org_id`?) — must verify

**Gap JSS-014** (CRITICAL — same as JNV-011/018): No org creation anywhere in auth flow.
- `lib/organizations.ts` confirmed to have no `createOrganization` function.
- New users have `org_id = null` permanently unless manually fixed in DB.
- **Files**:
  - `src/lib/organizations.ts`: Add `createOrganization(userId: string, firmName: string, plan?: string): Promise<Organization>` that inserts into `organizations` and inserts the user as `owner` in `org_members`.
  - `src/routes/auth.tsx`: Call `createOrganization(result.user.id, firmName)` after auto-confirm sign-up.
  - `src/routes/auth/callback.tsx`: After `exchangeCodeForSession`, check if user has an org. If not, create one from a stored firmName (or redirect to `/onboarding`).
  - `src/routes/onboarding.tsx`: New 3-step page: (1) firm name + details, (2) seat count, (3) first-case CTA.

---

## Gap Registry (journey-signup-signin)

| ID | File | Severity | Description |
|----|------|----------|-------------|
| JSS-001 | `routes/index.tsx:41` + `routes/auth.tsx:19` | HIGH | "Create Account" button renders Sign In form — user must find the toggle |
| JSS-002 | `routes/auth.tsx` signup form | LOW | No password confirmation field |
| JSS-003 | `routes/auth.tsx` signup form | MEDIUM | No firm name field — no org creation path |
| JSS-004 | `hooks/useAuth.ts:32-34` | CRITICAL | `signUp()` discards return value — auto-confirm detection impossible |
| JSS-005 | `routes/auth.tsx:37-39` | CRITICAL | With confirmations off: user auto-signed-in but shown "Check your email" (wrong message, no redirect) |
| JSS-006 | `routes/auth.tsx:48-73` | HIGH | No "Resend confirmation email" button in success state |
| JSS-007 | `routes/auth.tsx:54-56` | LOW | No "link expires in 1 hour" info in confirmation card |
| JSS-008 | `src/router.ts` + no callback route | CRITICAL | No `/auth/callback` route — PKCE email confirmation code discarded, session never established |
| JSS-009 | `routes/auth.tsx:101,112,123` | MEDIUM | Input fields remain enabled during form submission |
| JSS-010 | `routes/auth.tsx:141-147` | MEDIUM | No spinner in submit button — only text changes during loading |
| JSS-011 | `routes/auth.tsx:41-43` | MEDIUM | Raw Supabase error messages shown verbatim ("Invalid login credentials", "Email not confirmed") |
| JSS-012 | `routes/auth.tsx:36` | HIGH | Sign-in always redirects to `/` — no "redirect to intended URL" pattern |
| JSS-013 | `routes/auth.tsx` component | MEDIUM | Already-authenticated users can visit `/auth` and see the sign-in form |
| JSS-014 | `lib/organizations.ts` + `routes/auth.tsx` | CRITICAL | No org creation after sign-up — `createOrganization` missing, new users have no `org_id` |

---

## Fix Specifications

### FIX-JSS-008: Auth callback route (CRITICAL — must be first)
**File to create**: `src/routes/auth/callback.tsx`
```tsx
import { createRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { rootRoute } from '../__root';
import { supabase } from '@/lib/supabase';
import { createOrganization } from '@/lib/organizations';

export const authCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
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
      // Create org if user has none
      const { data: orgData } = await supabase.from('org_members').select('org_id').eq('user_id', data.user.id).limit(1);
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
      <a href="/auth" className="text-primary text-sm underline">Return to sign in</a>
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
**File**: `src/router.ts` — add `authCallbackRoute` to routeTree.

### FIX-JSS-004: Expose signUp return value
**File**: `src/hooks/useAuth.ts` lines 32–34
```ts
// Change:
const signUp = async (email: string, password: string, fullName?: string) => {
  await authLib.signUp(email, password, fullName);
};
// To:
const signUp = async (email: string, password: string, fullName?: string) => {
  return await authLib.signUp(email, password, fullName);
};
```
Also update `UseAuthReturn` interface line 8:
```ts
signUp: (email: string, password: string, fullName?: string) => Promise<{ user: User | null; session: Session | null } | null>;
```

### FIX-JSS-005: Auto-confirm redirect
**File**: `src/routes/auth.tsx` lines 37–39
```ts
// Change:
await signUp(email, password, fullName || undefined);
setSignUpSuccess(true);
// To:
const result = await signUp(email, password, fullName || undefined);
if (result?.session) {
  await createOrganization(result.user!.id, 'My Firm');
  navigate({ to: '/onboarding' });
} else {
  setSignUpSuccess(true);
}
```
Requires `FIX-JSS-004` and `createOrganization` in `lib/organizations.ts`.

### FIX-JSS-006: Resend confirmation email
**File**: `src/routes/auth.tsx` (signUpSuccess branch, lines 58–70)
```tsx
const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
const handleResend = async () => {
  setResendStatus('sending');
  await supabase.auth.resend({ type: 'signup', email });
  setResendStatus('sent');
  setTimeout(() => setResendStatus('idle'), 5000);
};
// In CardContent, after Back to Sign In button:
<Button variant="ghost" size="sm" disabled={resendStatus !== 'idle'} onClick={handleResend} className="w-full mt-2">
  {resendStatus === 'idle' ? 'Resend confirmation email' : resendStatus === 'sending' ? 'Sending…' : 'Sent! Check your inbox.'}
</Button>
```

### FIX-JSS-012: Redirect-after-auth
**File**: `src/routes/auth.tsx`
```ts
// Add to authRoute definition:
validateSearch: (search) => ({
  mode: (search.mode as 'signin' | 'signup') ?? 'signin',
  redirect: (search.redirect as string) ?? '',
}),
// In AuthPage:
const { mode: initialMode, redirect: redirectTo } = authRoute.useSearch();
const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
// In handleSubmit signin branch:
await signIn(email, password);
navigate({ to: (redirectTo || '/') as any });
```

### FIX-JSS-013: Already-authenticated redirect
**File**: `src/routes/auth.tsx` (AuthPage component top)
```tsx
const { user, loading } = useAuth();
const navigate = useNavigate();
useEffect(() => {
  if (!loading && user) navigate({ to: '/' });
}, [user, loading]);
if (loading) return (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
  </div>
);
```

### FIX-JSS-011: Friendly error messages
**File**: `src/routes/auth.tsx` lines 41–43
```ts
const SUPABASE_ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Incorrect email or password. Please try again.',
  'Email not confirmed': 'Please confirm your email address first.',
  'User already registered': 'An account with this email already exists. Sign in instead.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters.',
  'signup is disabled': 'New registrations are temporarily disabled.',
};
// In catch:
const raw = err.message ?? 'Something went wrong';
setError(SUPABASE_ERROR_MAP[raw] ?? raw);
// If email-not-confirmed error, also offer resend:
if (raw === 'Email not confirmed') setShowResend(true);
// Additional state: const [showResend, setShowResend] = useState(false)
// In form, after Alert:
{showResend && (
  <Button variant="ghost" size="sm" onClick={handleResend} className="w-full">
    Resend confirmation email
  </Button>
)}
```

---

## Journey Rating

| Metric | Rating |
|--------|--------|
| "Create Account" → sign-up form (mode routing) | BROKEN |
| Sign-up form completeness | PARTIAL (no firm name, no password confirm) |
| Sign-up submission (auto-confirm path) | BROKEN (wrong message, no redirect) |
| Sign-up submission (confirm-required path) | PARTIAL (confirmation card shown but PKCE broken) |
| Email confirmation click → session established | BROKEN (no callback route) |
| "Check your email" card usability | PARTIAL (no resend button, no expiry info) |
| Sign-in form loading states | PARTIAL (text feedback only, inputs stay enabled) |
| Sign-in error messages | PARTIAL (surfaced but raw Supabase text) |
| "Email not confirmed" error handling | PARTIAL (shown but no resend CTA) |
| Post-sign-in redirect | PARTIAL (always `/`, no intended URL) |
| Already-signed-in redirect away from `/auth` | MISSING |
| Post-sign-in org setup | MISSING |
| **Overall** | **BROKEN** |

---

## New Aspects Discovered

No new Wave 1 aspects needed — all source material was already read.
No new Wave 2 aspects — remaining journeys (journey-first-case, journey-share-case, etc.) are already in the frontier.
