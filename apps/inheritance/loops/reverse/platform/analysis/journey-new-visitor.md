# Analysis: journey-new-visitor
**Wave**: 2 — User Journey Audit
**Date**: 2026-03-04
**Method**: Walk every step of the new visitor journey from `/` through sign-up and post-auth landing

---

## Journey Overview

**Entry**: User types `https://app.example.com/` in browser — no account, no prior session.

**Overall rating**: **BROKEN** (multiple hard-stop failures before any value is delivered)

---

## Step-by-Step Walkthrough

### Step 0: App Bootstrap — Pre-render

Before any UI renders, `src/lib/supabase.ts` executes at module load time:

```ts
// supabase.ts lines 6–11
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}
if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}
```

This throw propagates through the import chain:
`supabase.ts` → `auth.ts` → `useAuth.ts` → `routes/index.tsx` (and every other route)

**Result**: If env vars are missing, the entire module graph throws before React mounts → **white screen, no error message, no setup instructions**.

**Gap JNV-001** (CRITICAL): New developer cloning the repo sees white screen with an unhandled JS error in the browser console. There is no `src/setup-instructions.tsx` fallback, no graceful degradation, no `.env.local.example` file in the repo. The developer has no in-app guidance on how to fix it.

---

### Step 1: App Load (env vars set)

`useAuth` fires → `loading: true`.

`DashboardPage` renders a centered spinner:
```tsx
// routes/index.tsx lines 17–22
<div className="flex items-center justify-center py-20">
  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
</div>
```

`onAuthStateChange` fires (immediately, synchronously buffered by Supabase client) → `callback(null)` → `setUser(null)`, `setLoading(false)`.

**Spinner duration**: ~50–100ms in practice. Acceptable but no skeleton layout.

---

### Step 2: Unauthenticated Landing Page (`/`)

**Component tree rendered**:
```
RootLayout (routes/__root.tsx)
  └── AppLayout (components/layout/AppLayout.tsx)
        ├── <aside> (desktop sidebar — ALWAYS visible)
        │     ├── Logo: Scale icon + "Inheritance" + "Philippine Succession Law"
        │     └── nav: Dashboard / New Case / Clients / Deadlines / Settings
        └── <main>
              └── DashboardPage (unauthenticated branch)
                    ├── h1: "Inheritance Calculator"
                    ├── p: "Philippine Succession Law Engine. Sign in to save cases..."
                    ├── Button "Sign In" → Link to="/auth"
                    └── Button outline "Create Account" → Link to="/auth"
```

**What the visitor sees on desktop**:
- Left sidebar with navigation links (Dashboard, New Case, Clients, Deadlines, Settings) — same nav an authenticated user sees
- A small centered card with a 2-line description and two buttons
- No product screenshots, no feature breakdown, no social proof, no pricing teaser

**What the visitor sees on mobile**:
- Full `AppLayout` mobile header with "Inheritance Calculator" heading and horizontal scrollable nav buttons (Dashboard, New Case, Clients, Deadlines, Settings)
- Then the same minimal content below

**Gap JNV-002**: The sidebar nav is identical for authenticated and unauthenticated users. An unauthenticated user clicking "Clients" or "Deadlines" sees a "Sign in to..." message, but "New Case" works without auth (wizard runs but doesn't persist). This is confusing — the nav implies full access.

**Gap JNV-003**: No "Sign Out" option anywhere in the nav. Once signed in, users have no way to sign out through the UI. There is no user avatar, profile dropdown, or sign-out button anywhere in `AppLayout.tsx` (lines 1–97 confirmed — no auth state, no sign-out).

**Gap JNV-004**: The landing page value proposition is 2 lines of text. No screenshots, no feature list, no "try it now" CTA. The "New Case" nav link technically works without an account — this anonymous compute path is completely undiscoverable.

**Gap JNV-005**: Both "Sign In" and "Create Account" buttons (`routes/index.tsx` lines 35–47) both link to `to="/auth"` with no query params or router state. The `/auth` route always initializes in `mode: 'signin'` (`routes/auth.tsx` line 19). A visitor who clicks "Create Account" lands on the Sign In form — they must then find and click the "Sign up" text link at the bottom.

---

### Step 3: Auth Page (`/auth`)

**Component tree rendered**:
```
RootLayout
  └── AppLayout  ← PROBLEM: full sidebar/nav chrome visible on auth page
        └── AuthPage
              └── Card (max-w-md, centered)
                    ├── Icon: LogIn (8w 8h, text-primary)
                    ├── CardTitle: "Sign In"
                    ├── CardDescription: "Sign in to save cases and access premium features."
                    └── CardContent
                          ├── form: email + password + submit button
                          └── footer: "Don't have an account? Sign up"
```

**Gap JNV-006** (CRITICAL — same as GAP-006 from routes catalog): `AppLayout` wraps every route via `__root.tsx`. The full sidebar and mobile nav chrome render on the auth page. A new user trying to sign up sees "Dashboard / New Case / Clients / Deadlines / Settings" in the sidebar. This is visually confusing and looks broken — nav links lead to "Sign in to..." dead ends.

**Fix**: Auth routes need a separate layout. Options:
1. Split `__root.tsx` into two roots (not standard TanStack Router pattern)
2. Use route `component` to conditionally apply layout inside the root
3. **Recommended**: In `__root.tsx`, wrap `<Outlet />` directly without `AppLayout`, and have each protected route explicitly import a `<ProtectedLayout>` wrapper. This is the correct TanStack Router pattern.

**Gap JNV-007**: No "Forgot password?" link anywhere in `routes/auth.tsx` (lines 1–179 confirmed — no mention of reset). Users who forget their password are permanently locked out.

**Gap JNV-008**: No query param / router state handling for mode. The `AuthPage` component (`auth.tsx` line 19) initializes `mode` from local state only: `const [mode, setMode] = useState<'signin' | 'signup'>('signin')`. There is no `useSearch()` or `useLocation()` to read `?mode=signup`.

---

### Step 4: User Fills Sign-Up Form

After clicking "Sign up" text link → mode switches to `signup` → form shows:
- Full Name (optional — no required, no asterisk indicator)
- Email (required, browser validation)
- Password (required, minLength=6, browser validation only)

**Gap JNV-009**: No password confirmation field. User can mistype password with no detection.

**Gap JNV-010**: No terms of service / privacy policy checkbox. Minor but standard for SaaS.

**Gap JNV-011**: No firm name field during sign-up. After sign-up, the app expects an organization to exist (many features query by `org_id`). There is no org creation flow — the `createOrganization` function was confirmed missing from `lib/` in the `catalog-lib-hooks` analysis. New users will have `org_id = null` and many silent failures will follow.

---

### Step 5: Sign-Up Submission

`handleSubmit` → `signUp(email, password, fullName)` → `supabase.auth.signUp(...)`.

**Case A: Supabase `enable_confirmations = false` (current config.toml state)**

Per `catalog-config` analysis: `enable_confirmations = false` in `supabase/config.toml`. This means Supabase auto-confirms the user on sign-up — a session is returned immediately. The user is now authenticated.

**But**: The `signUp` function (`lib/auth.ts` lines 10–18) returns `data` but `AuthPage` ignores the returned session. After `signUp` resolves, the code does `setSignUpSuccess(true)` — showing "Check your email" with no redirect.

**Gap JNV-012** (CRITICAL): When confirmations are disabled, user is auto-signed-in after `signUp` but `AuthPage` shows "Check your email" and stays on `/auth`. The user is confused: the email message is wrong, and they don't know they can already use the app. No redirect happens. The user must click "Back to Sign In" → fill in credentials again → submit sign-in form → navigate to `/`.

**Case B: Supabase `enable_confirmations = true` (production config)**

The "Check your email" card shows — appropriate. But:
- No "Resend confirmation email" button
- No countdown or explanation of email validity window
- No deep link back to the app from the email (Supabase handles this via redirect URL, but `VITE_APP_URL` is not set — per `catalog-config` analysis)

**Gap JNV-013**: `VITE_APP_URL` is not defined and has no `.env.local.example` entry. Supabase email confirmation links use `SITE_URL` from the Supabase project config. If this isn't configured to match the deployed app URL, confirmation links redirect to wrong host.

---

### Step 6: Sign-In Submission

`handleSubmit` in `signin` mode → `signIn(email, password)` → `supabase.auth.signInWithPassword(...)` → `navigate({ to: '/' })`.

**Gap JNV-014**: Sign-in always redirects to `/` regardless of the originally requested URL. If a user tried to access `/settings` while unauthenticated (got the "Sign in to manage firm settings" message), went to `/auth`, signed in — they land at `/` and have to navigate to `/settings` manually. TanStack Router supports `search.redirect` for this; it's not implemented.

**Error handling**: `catch (err)` → `setError(err.message ?? 'Something went wrong')` → `<Alert variant="destructive">` inline.

Supabase error messages returned: "Invalid login credentials", "Email not confirmed", "User not found" — these are surfaced directly without user-friendly rewording.

**Gap JNV-015**: Raw Supabase error messages shown to users. "Invalid login credentials" is technically accurate but less friendly than "Incorrect email or password."

---

### Step 7: Post-Sign-In Landing (`/`)

User lands at `/`. `useAuth` now returns `{ user: <User>, loading: false }`. `DashboardPage` renders the authenticated branch:

```tsx
// routes/index.tsx lines 52–70
<div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
  <div className="flex items-center gap-2 mb-6">
    <LayoutDashboard className="h-5 w-5 text-primary" />
    <h1 className="text-xl font-bold tracking-tight font-serif">Dashboard</h1>
  </div>
  <p className="text-muted-foreground mb-4">
    Welcome back. Use "New Case" to start an inheritance computation.
  </p>
  <Link to="/cases/new">
    <Button className="gap-2">
      <FilePlus className="h-4 w-4" />
      New Case
    </Button>
  </Link>
</div>
```

**What the new user sees**: A heading, one line of instructional text, and a button. Nothing else.

**Gap JNV-016**: No onboarding flow. A brand-new user with no organization, no cases, no firm profile has no guidance on what to do first. No "Set up your firm profile" prompt. No "Create your first case" wizard with context. No "Invite team members" CTA.

**Gap JNV-017**: The dashboard says "Welcome back" for a first-time user. No first-time user detection (e.g., check if `profile.created_at` is within the last 5 minutes, or check if cases.length === 0).

**Gap JNV-018**: No organization creation prompt. The `FirmProfileProvider` mentioned in the premium spec is missing. Without an org, `/clients`, `/deadlines` org-level queries, and team features all silently fail or show empty state without explanation.

**Gap JNV-019** (same as GAP-003 / JNV-003): No Sign Out in nav. The user has no way to sign out. `useAuth` exposes `signOut` but no UI element calls it anywhere in `AppLayout.tsx` or any nav component.

---

## Gap Registry

| ID | Location | Severity | Description |
|----|----------|----------|-------------|
| JNV-001 | `lib/supabase.ts:6-11` | CRITICAL | White screen if env vars missing — no fallback UI or setup instructions |
| JNV-002 | `components/layout/AppLayout.tsx:13-19` | HIGH | Nav identical for auth/unauth — unauth users see nav with dead-end links |
| JNV-003 | `components/layout/AppLayout.tsx:1-97` | HIGH | No Sign Out option anywhere in nav — users cannot log out |
| JNV-004 | `routes/index.tsx:24-49` | MEDIUM | Landing page has minimal value proposition (2 lines) — no screenshots, features, or try CTA |
| JNV-005 | `routes/index.tsx:41` | HIGH | "Create Account" button links to `/auth` in signin mode — user sees wrong form |
| JNV-006 | `routes/__root.tsx:8-14` | CRITICAL | AppLayout wraps auth page — full nav chrome on sign-in/sign-up is confusing and broken-looking |
| JNV-007 | `routes/auth.tsx:1-179` | HIGH | No "Forgot password?" link — users locked out permanently if they forget password |
| JNV-008 | `routes/auth.tsx:19` | MEDIUM | No `?mode=signup` query param support — "Create Account" CTA can't preset the mode |
| JNV-009 | `routes/auth.tsx:120-131` | LOW | No password confirmation field on sign-up |
| JNV-010 | `routes/auth.tsx:96-148` | LOW | No ToS / privacy checkbox |
| JNV-011 | `routes/auth.tsx` + `lib/` | CRITICAL | No org creation after sign-up — createOrganization() missing, new users have no org_id |
| JNV-012 | `routes/auth.tsx:37-39` | CRITICAL | When confirmations disabled, user is auto-signed-in but sees "Check your email" and is not redirected |
| JNV-013 | `lib/supabase.ts` + env config | HIGH | VITE_APP_URL not set — Supabase confirmation email redirects to wrong host in production |
| JNV-014 | `routes/auth.tsx:36` | MEDIUM | Sign-in always redirects to `/` — no "redirect to intended page" after auth |
| JNV-015 | `routes/auth.tsx:41-43` | LOW | Raw Supabase error messages shown to users (e.g., "Invalid login credentials") |
| JNV-016 | `routes/index.tsx:52-70` | HIGH | No onboarding flow for new users — no firm profile setup, no first-case guidance |
| JNV-017 | `routes/index.tsx:60` | LOW | "Welcome back" shown to first-time users |
| JNV-018 | `routes/index.tsx:52-70` | CRITICAL | No org creation prompt on first login — silent failures throughout app |
| JNV-019 | `components/layout/AppLayout.tsx` | HIGH | No Sign Out in nav (duplicate of JNV-003 — same root cause) |

---

## Fix Specifications

### FIX-JNV-001: Graceful env var handling
**File**: `src/lib/supabase.ts`
**Change**: Replace throw with graceful fallback that returns a mock client and renders setup instructions:
```ts
// Instead of throwing, return a sentinel
export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
export const supabase = supabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null as any;
```
**File**: `src/main.tsx`
**Change**: Before mounting router, check `supabaseConfigured`. If false, render `<SetupPage>` component showing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` setup instructions with a code block of `.env.local` example content.

### FIX-JNV-005 + FIX-JNV-008: "Create Account" mode preset
**File**: `src/routes/index.tsx` line 41
**Change**: Add search param to Create Account link:
```tsx
<Link to="/auth" search={{ mode: 'signup' }}>
```
**File**: `src/routes/auth.tsx`
**Change**: Add `validateSearch` to `authRoute`, read `mode` from search:
```ts
export const authRoute = createRoute({
  ...
  validateSearch: (search) => ({ mode: (search.mode as 'signin' | 'signup') ?? 'signin' }),
  component: AuthPage,
});
function AuthPage() {
  const { mode: initialMode } = authRoute.useSearch();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  ...
}
```

### FIX-JNV-006: Auth layout isolation
**File**: `src/routes/__root.tsx`
**Change**: Replace unconditional `<AppLayout>` wrap with route-aware layout:
```tsx
import { useRouterState } from '@tanstack/react-router';
function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthRoute = pathname.startsWith('/auth');
  const isShareRoute = pathname.startsWith('/share/');
  if (isAuthRoute || isShareRoute) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Outlet />
      </div>
    );
  }
  return <AppLayout><Outlet /></AppLayout>;
}
```
**Result**: Auth page is full-screen centered (no sidebar). Share page is full-screen read-only.

### FIX-JNV-003: Sign Out in nav
**File**: `src/components/layout/AppLayout.tsx`
**Change**: Import `useAuth`, add user avatar / sign-out section at bottom of sidebar and in mobile header:
```tsx
const { user, signOut } = useAuth();
// In sidebar footer (below nav, above bottom):
{user ? (
  <div className="px-2 py-3 border-t">
    <div className="text-xs text-muted-foreground px-2 mb-1 truncate">{user.email}</div>
    <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-sm text-destructive hover:text-destructive" onClick={signOut}>
      <LogOut className="h-4 w-4" />
      Sign Out
    </Button>
  </div>
) : (
  <div className="px-2 py-3 border-t">
    <Link to="/auth"><Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-sm"><LogIn className="h-4 w-4" />Sign In</Button></Link>
  </div>
)}
```
**Result**: Authenticated users see email + Sign Out button at sidebar bottom. Unauthenticated users see a Sign In link.

### FIX-JNV-007: Forgot password link
**File**: `src/routes/auth.tsx`
**Change**: Add "Forgot password?" link under the password field:
```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <Label htmlFor="password">Password</Label>
    {mode === 'signin' && (
      <Link to="/auth/reset" className="text-xs text-primary hover:underline">Forgot password?</Link>
    )}
  </div>
  <Input id="password" type="password" required minLength={6} ... />
</div>
```
Also add new route `src/routes/auth/reset.tsx` with a "Send reset email" form calling `supabase.auth.resetPasswordForEmail(email, { redirectTo: VITE_APP_URL + '/auth/reset-confirm' })`.

### FIX-JNV-011 + FIX-JNV-018: Org creation after sign-up
**File**: `src/lib/organizations.ts` (create new)
**Change**: Add `createOrganization(userId: string, firmName: string): Promise<Organization>` that inserts into `organizations` table and inserts the user as `owner` in `org_members`.

**File**: `src/routes/auth.tsx`
**Change**: After `signUp` resolves (in both confirmation flows):
1. If confirmations off: after `signUp`, call `createOrganization(data.user!.id, firmName || 'My Firm')`, then `navigate({ to: '/' })`
2. If confirmations on: on email confirmation callback (Supabase auth state change with `event === 'SIGNED_IN'` after magic-link click), check if user has an org; if not, redirect to `/onboarding`

**New route**: `src/routes/onboarding.tsx` — a 3-step wizard: (1) Firm name + phone + address, (2) Confirm member count, (3) "Create your first case" CTA. Stores to `organizations` table and `user_profiles`.

### FIX-JNV-012: Sign-up with confirmations disabled — redirect
**File**: `src/routes/auth.tsx`
**Change**: In `handleSubmit` sign-up branch, after `signUp` resolves, check if `data.session` is non-null (confirmations off → session returned):
```ts
const result = await signUp(email, password, fullName || undefined);
if (result?.session) {
  // Auto-confirmed — create org and redirect
  await createOrganization(result.user!.id, 'My Firm');
  navigate({ to: '/onboarding' });
} else {
  setSignUpSuccess(true);
}
```
This requires `signUp` in `lib/auth.ts` to return `data` (currently it does: `return data`), but `useAuth.ts` wrapper discards the return value. Fix: pass through the return value in `useAuth.ts`.

### FIX-JNV-014: Redirect-after-auth
**File**: `src/routes/auth.tsx`
**Change**: Read `redirect` search param, use after sign-in:
```ts
const { redirect: redirectTo } = authRoute.useSearch();
// ...
await signIn(email, password);
navigate({ to: (redirectTo as any) ?? '/' });
```

**File**: Protected route components (clients, deadlines, settings)
**Change**: When showing "Sign in to..." message, link to `/auth?redirect=/clients` etc.

### FIX-JNV-016: New user onboarding
**File**: `src/routes/index.tsx`
**Change**: In authenticated branch, check if user has org and cases:
```tsx
const { organization, loading: orgLoading } = useFirmProfile();
const [cases, setCases] = useState<CaseListItem[]>([]);
const [casesLoading, setCasesLoading] = useState(true);
// fetch first few cases
useEffect(() => { listCases(user.id).then(setCases).finally(() => setCasesLoading(false)); }, []);

// If no org or no cases:
if (!orgLoading && !organization) {
  return <OnboardingPrompt /> // "Set up your firm profile to unlock clients, deadlines, and team features"
}
if (!casesLoading && cases.length === 0) {
  return <FirstCasePrompt /> // large CTA with product description + "New Case" button
}
// Else: render dashboard with case list, deadline summary
```

---

## Journey Rating

| Metric | Rating |
|--------|--------|
| Pre-render (env var safety) | BROKEN |
| Landing page value proposition | PARTIAL |
| Auth mode routing (Create Account → signup form) | BROKEN |
| Auth page layout | BROKEN (nav chrome) |
| Sign-up form completeness | PARTIAL |
| Sign-up success + redirect | BROKEN (wrong message if confirmations off) |
| Sign-in + redirect | PARTIAL (always → `/`, no intended URL) |
| Post-sign-in dashboard | PARTIAL (nearly empty) |
| Onboarding flow | MISSING |
| Sign Out | MISSING |
| Forgot password | MISSING |
| **Overall** | **BROKEN** |

---

## New Aspects Discovered

No new Wave 1 aspects needed — all sources already read.
No new Wave 2 aspects — gaps above will feed into subsequent journey audits and the spec.
Existing `journey-signup-signin` aspect covers auth form detail; defer deeper password reset spec to that aspect.
