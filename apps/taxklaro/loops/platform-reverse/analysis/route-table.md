# Route Table — TaxKlaro

**Wave:** 4 (Platform Layer)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** supabase-auth-flow, supabase-migrations, frontend-state-management

---

## Summary

Complete TanStack Router v1 route table for TaxKlaro. 20 routes total: 7 public, 13 authenticated. Every route specifies file path, component, auth guard, data loaded, error state, and layout wrapper. Patterns derived from `supabase-auth-flow` analysis and inheritance app reference.

---

## 1. Router Setup Files

### `src/router.ts`

```typescript
import { createRouter } from '@tanstack/react-router';
import type { User } from '@supabase/supabase-js';
import { rootRoute } from './routes/__root';
import { indexRoute } from './routes/index';
import { authRoute } from './routes/auth';
import { authCallbackRoute } from './routes/auth/callback';
import { authResetRoute } from './routes/auth/reset';
import { authResetConfirmRoute } from './routes/auth/reset-confirm';
import { onboardingRoute } from './routes/onboarding';
import { inviteTokenRoute } from './routes/invite/$token';
import { computationsIndexRoute } from './routes/computations/index';
import { computationsNewRoute } from './routes/computations/new';
import { computationDetailRoute } from './routes/computations/$compId';
import { computationQuarterlyRoute } from './routes/computations/$compId.quarterly';
import { clientsIndexRoute } from './routes/clients/index';
import { clientsNewRoute } from './routes/clients/new';
import { clientDetailRoute } from './routes/clients/$clientId';
import { deadlinesRoute } from './routes/deadlines';
import { settingsIndexRoute } from './routes/settings/index';
import { settingsTeamRoute } from './routes/settings/team';
import { shareTokenRoute } from './routes/share/$token';
import { publicRootRoute } from './routes/__root';

export interface RouterContext {
  auth: {
    user: User | null;
  };
}

const routeTree = rootRoute.addChildren([
  indexRoute,
  publicRootRoute.addChildren([
    authRoute,
    authCallbackRoute,
    authResetRoute,
    authResetConfirmRoute,
    onboardingRoute,
    inviteTokenRoute,
    shareTokenRoute,
  ]),
  computationsIndexRoute,
  computationsNewRoute,
  computationDetailRoute,
  computationQuarterlyRoute,
  clientsIndexRoute,
  clientsNewRoute,
  clientDetailRoute,
  deadlinesRoute,
  settingsIndexRoute,
  settingsTeamRoute,
]);

export const router = createRouter({
  routeTree,
  context: {
    auth: { user: null }, // overridden via RouterProvider context prop in main.tsx
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

### `src/routes/__root.tsx`

```typescript
import { createRootRouteWithContext, createRoute, Outlet, useRouterState } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import type { RouterContext } from '@/router';

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Routes that bypass AppLayout (no sidebar, no auth chrome)
  const isPublicRoute =
    pathname.startsWith('/auth') ||
    pathname.startsWith('/share/') ||
    pathname.startsWith('/invite/') ||
    pathname === '/onboarding';

  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    );
  }

  return <AppLayout><Outlet /></AppLayout>;
}

// Sub-route for public pages (no AppLayout, no auth guard)
export const publicRootRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_public',
  component: () => <Outlet />,
});
```

---

## 2. beforeLoad Guard Pattern

All authenticated routes use this exact `beforeLoad` pattern:

```typescript
import { redirect } from '@tanstack/react-router';

beforeLoad: ({ context, location }) => {
  if (!context.auth.user) {
    throw redirect({
      to: '/auth',
      search: {
        redirect: location.href,
        mode: 'signin',
      },
    });
  }
},
```

**Rules:**
- `context.auth.user` is the Supabase `User | null` from the router context
- If null, redirect to `/auth?redirect=<current-path>&mode=signin`
- After successful sign-in, the auth page navigates to the `redirect` search param
- Public routes (`/auth`, `/share/$token`, `/invite/$token`) do NOT have `beforeLoad`

---

## 3. Complete Route Table

| # | Path | File | Component | Auth | Layout | Data Loaded |
|---|------|------|-----------|------|--------|-------------|
| 1 | `/` | `routes/index.tsx` | `IndexPage` | Conditional | AppLayout (auth) / none | user session |
| 2 | `/auth` | `routes/auth.tsx` | `AuthPage` | Public | Bare | — |
| 3 | `/auth/callback` | `routes/auth/callback.tsx` | `AuthCallbackPage` | Public | Bare | PKCE code exchange |
| 4 | `/auth/reset` | `routes/auth/reset.tsx` | `AuthResetPage` | Public | Bare | — |
| 5 | `/auth/reset-confirm` | `routes/auth/reset-confirm.tsx` | `AuthResetConfirmPage` | Public | Bare | access_token from URL hash |
| 6 | `/onboarding` | `routes/onboarding.tsx` | `OnboardingPage` | Auth + beforeLoad | Bare | user profile |
| 7 | `/invite/$token` | `routes/invite/$token.tsx` | `InviteAcceptPage` | Public | Bare | invitation by token |
| 8 | `/computations` | `routes/computations/index.tsx` | `ComputationsPage` | Auth + beforeLoad | AppLayout | computations list + org |
| 9 | `/computations/new` | `routes/computations/new.tsx` | `NewComputationPage` | Auth + beforeLoad | AppLayout | org context + client list |
| 10 | `/computations/$compId` | `routes/computations/$compId.tsx` | `ComputationDetailPage` | Auth + beforeLoad | AppLayout | computation by ID |
| 11 | `/computations/$compId/quarterly` | `routes/computations/$compId.quarterly.tsx` | `ComputationQuarterlyPage` | Auth + beforeLoad | AppLayout | computation by ID |
| 12 | `/clients` | `routes/clients/index.tsx` | `ClientsPage` | Auth + beforeLoad | AppLayout | clients list |
| 13 | `/clients/new` | `routes/clients/new.tsx` | `NewClientPage` | Auth + beforeLoad | AppLayout | org context |
| 14 | `/clients/$clientId` | `routes/clients/$clientId.tsx` | `ClientDetailPage` | Auth + beforeLoad | AppLayout | client by ID + computations |
| 15 | `/deadlines` | `routes/deadlines.tsx` | `DeadlinesPage` | Auth + beforeLoad | AppLayout | upcoming deadlines |
| 16 | `/settings` | `routes/settings/index.tsx` | `SettingsPage` | Auth + beforeLoad | AppLayout | user profile + org |
| 17 | `/settings/team` | `routes/settings/team.tsx` | `TeamSettingsPage` | Auth + beforeLoad (admin) | AppLayout | org members + invitations |
| 18 | `/share/$token` | `routes/share/$token.tsx` | `SharePage` | Public | Bare | RPC get_shared_computation |

**Total: 18 routes** (7 public, 11 authenticated)

---

## 4. Route Specifications

### Route 1: `/` — Index

```typescript
// src/routes/index.tsx
import { createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { DashboardPage } from '@/components/pages/DashboardPage';
import { LandingPage } from '@/components/pages/LandingPage';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
});

function IndexPage() {
  const { auth: { user } } = indexRoute.useRouteContext();
  if (!user) return <LandingPage />;
  return <DashboardPage />;
}
```

**Notes:**
- No `beforeLoad` redirect — the index route shows landing page for unauth users
- `DashboardPage` shows: recent computations (last 5), upcoming deadlines (next 3), quick CTA for "New Computation"
- `LandingPage` shows: product description, feature list, sign-up CTA

---

### Route 2: `/auth` — Authentication

```typescript
// src/routes/auth.tsx
export const authRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/auth',
  validateSearch: (search: Record<string, unknown>) => ({
    mode: (search.mode as 'signin' | 'signup') ?? 'signin',
    redirect: (search.redirect as string) ?? '',
  }),
  component: AuthPage,
});
```

**Search params:** `?mode=signin|signup&redirect=/path`
**Behavior:**
- If user is already authenticated: `useEffect` navigates to `/` (or redirect param)
- `mode=signin`: shows email/password form with "Sign in" submit
- `mode=signup`: shows email + password + confirm password + full name + firm name
- Toggle between modes with link: "Don't have an account? Create one" / "Already have an account? Sign in"
- Error mapping: see SUPABASE_ERROR_MAP in auth-flow analysis

---

### Route 3: `/auth/callback` — PKCE Email Confirmation

```typescript
// src/routes/auth/callback.tsx
export const authCallbackRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/auth/callback',
  component: AuthCallbackPage,
});
```

**Behavior:**
- Called by Supabase after email confirmation link is clicked
- URL contains `code` query param (PKCE authorization code)
- `useEffect` runs `supabase.auth.exchangeCodeForSession(code)` on mount
- Success: navigate to `/onboarding` if no org, else `/`
- Error: show error card with "Try again" link to `/auth`

```typescript
// Implementation:
function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const search = useSearch({ from: '/auth/callback' });

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) {
      setError('Invalid confirmation link. Please request a new one.');
      return;
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setError(error.message);
        return;
      }
      // Check if user has an org — if not, send to onboarding
      navigate({ to: '/onboarding' });
    });
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Confirmation Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button asChild className="mt-4 w-full" variant="outline">
              <Link to="/auth">Back to Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground">Confirming your email...</p>
      </div>
    </div>
  );
}
```

---

### Route 4: `/auth/reset` — Password Reset Request

```typescript
// src/routes/auth/reset.tsx
export const authResetRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/auth/reset',
  component: AuthResetPage,
});
```

**Behavior:**
- Email input form
- On submit: `supabase.auth.resetPasswordForEmail(email, { redirectTo: VITE_APP_URL + '/auth/reset-confirm' })`
- Success: show confirmation card ("Check your email for a reset link")
- Does NOT navigate away — user sees confirmation in-place

---

### Route 5: `/auth/reset-confirm` — Set New Password

```typescript
// src/routes/auth/reset-confirm.tsx
export const authResetConfirmRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/auth/reset-confirm',
  component: AuthResetConfirmPage,
});
```

**Behavior:**
- Supabase sends user to this URL with `#access_token=...&type=recovery` in the URL hash
- `useEffect` parses `window.location.hash` to extract access_token
- Shows new password + confirm password form
- On submit: `supabase.auth.updateUser({ password: newPassword })`
- Success: navigate to `/` (user is now signed in)
- Error: "Reset link is invalid or expired. Request a new one."

---

### Route 6: `/onboarding` — First-Use Org Creation

```typescript
// src/routes/onboarding.tsx
export const onboardingRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/onboarding',
  beforeLoad: ({ context }) => {
    // Must be authenticated to onboard
    if (!context.auth.user) {
      throw redirect({ to: '/auth', search: { mode: 'signin', redirect: '/onboarding' } });
    }
  },
  component: OnboardingPage,
});
```

**Behavior:**
- Only shown to new users who have no organization membership
- If user already has an org (e.g. navigates here directly), redirect to `/`
- Form: firm name (required), slug (auto-generated from firm name, editable), your role (accountant / bookkeeper / CPA / other)
- On submit: calls `create_organization(name, slug)` RPC
- After success: navigate to `/computations`
- Layout: centered card, TaxKlaro logo at top, no AppLayout sidebar

**Data check on mount:**
```typescript
useEffect(() => {
  supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .then(({ data }) => {
      if (data && data.length > 0) navigate({ to: '/' });
    });
}, []);
```

---

### Route 7: `/invite/$token` — Accept Team Invitation

```typescript
// src/routes/invite/$token.tsx
export const inviteTokenRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/invite/$token',
  component: InviteAcceptPage,
});
```

**Behavior:**
- Public route — user may not be signed in when they click the invitation link
- On mount: fetch invitation details via RPC `get_invitation_by_token(token UUID)`
- States:
  - Loading: spinner
  - Not found or expired: error card with "Request a new invitation from your team admin"
  - Already accepted: "You're already a member of [Org Name]" with link to sign in
  - Valid: show invitation details (org name, inviter name, role) + "Accept" button
- If not authenticated: "Accept" button navigates to `/auth?mode=signup&redirect=/invite/$token` (or `signin` if email already registered)
- After auth + return: re-render, show "Accept" button, click calls `accept_invitation(token UUID)` RPC
- Success: navigate to `/` (now an org member)
- Error: "Something went wrong. Please try again or contact support."

---

### Route 8: `/computations` — Computations List

```typescript
// src/routes/computations/index.tsx
export const computationsIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/computations',
  beforeLoad: ({ context, location }) => {
    if (!context.auth.user) {
      throw redirect({ to: '/auth', search: { redirect: location.href, mode: 'signin' } });
    }
  },
  component: ComputationsPage,
});
```

**Data loaded (inside component via hooks):**
```typescript
// Supabase query:
const { data: computations } = await supabase
  .from('computations')
  .select('id, title, tax_year, status, regime_selected, created_at, updated_at, client_id, clients(full_name)')
  .eq('org_id', orgId)
  .order('updated_at', { ascending: false })
  .limit(50);
```

**States:**
- Loading: `ComputationCardSkeleton` × 6 in a grid
- Empty: `EmptyState` with FileText icon, "No computations yet", "Create your first computation" button → `/computations/new`
- Error: `Alert` destructive, "Failed to load computations. Refresh the page."
- List: grid of `ComputationCard` components

**ComputationCard fields shown:** title, tax year, client name (if linked), status badge (draft/computed/finalized/archived), updated-at timestamp, "View" link

---

### Route 9: `/computations/new` — Tax Wizard (New Computation)

```typescript
// src/routes/computations/new.tsx
export const computationsNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/computations/new',
  beforeLoad: ({ context, location }) => {
    if (!context.auth.user) {
      throw redirect({ to: '/auth', search: { redirect: location.href, mode: 'signin' } });
    }
  },
  validateSearch: (search: Record<string, unknown>) => ({
    clientId: (search.clientId as string) ?? '',
  }),
  component: NewComputationPage,
});
```

**Search params:** `?clientId=<uuid>` — pre-fills client if navigating from client profile
**Component:** `TaxWizard` — the multi-step wizard (WS-00 through WS-13)
**On save:** creates a `computations` record, navigates to `/computations/$compId`

---

### Route 10: `/computations/$compId` — Computation Detail

```typescript
// src/routes/computations/$compId.tsx
export const computationDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/computations/$compId',
  beforeLoad: ({ context, location }) => {
    if (!context.auth.user) {
      throw redirect({ to: '/auth', search: { redirect: location.href, mode: 'signin' } });
    }
  },
  component: ComputationDetailPage,
});
```

**Route params:** `$compId` — UUID from URL
**Data loaded:**
```typescript
const { data: computation } = await supabase
  .from('computations')
  .select('*, clients(full_name, tin, email), computation_notes(id, content, created_at, user_id, user_profiles(full_name))')
  .eq('id', compId)
  .eq('org_id', orgId)
  .single();
```

**States:**
- Loading: `ComputationDetailSkeleton`
- Not found (data is null): `Alert` destructive "Computation not found", Back to list button
- Access denied (org mismatch): same as not found (do not leak existence)
- Draft (no output_json): show input editor with "Compute" button
- Computed/Finalized: show `ResultsView` with all result panels + `ActionsBar`

**ActionsBar buttons:** "Export PDF", "Share", "Edit Inputs", "Mark as Finalized", "Archive", notes count badge

---

### Route 11: `/computations/$compId/quarterly` — Quarterly Breakdown

```typescript
// src/routes/computations/$compId.quarterly.tsx
export const computationQuarterlyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/computations/$compId/quarterly',
  beforeLoad: ({ context, location }) => {
    if (!context.auth.user) {
      throw redirect({ to: '/auth', search: { redirect: location.href, mode: 'signin' } });
    }
  },
  component: ComputationQuarterlyPage,
});
```

**Data loaded:** Same as Route 10 but renders `QuarterlyBreakdownView` instead of full `ResultsView`
**Access guard:** Same org ownership check; if output_json is null or regime is not quarterly-applicable, show `Alert` info "No quarterly data available — run a computation first."

---

### Route 12: `/clients` — Clients List

```typescript
// src/routes/clients/index.tsx
export const clientsIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clients',
  beforeLoad: ({ context, location }) => {
    if (!context.auth.user) {
      throw redirect({ to: '/auth', search: { redirect: location.href, mode: 'signin' } });
    }
  },
  component: ClientsPage,
});
```

**Data loaded:**
```typescript
const { data: clients } = await supabase
  .from('clients')
  .select('id, full_name, email, phone, tin, status, created_at')
  .eq('org_id', orgId)
  .eq('status', 'active')
  .order('full_name', { ascending: true });
```

**States:**
- Loading: `ClientRowSkeleton` × 8 in a table
- Empty: `EmptyState` with Users icon, "No clients yet", "Add your first client" button → `/clients/new`
- Error: `Alert` destructive
- List: `ClientsTable` with columns: Name, TIN, Email, Phone, # Computations, Actions (View, Archive)

---

### Route 13: `/clients/new` — Add New Client

```typescript
// src/routes/clients/new.tsx
export const clientsNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clients/new',
  beforeLoad: ({ context, location }) => {
    if (!context.auth.user) {
      throw redirect({ to: '/auth', search: { redirect: location.href, mode: 'signin' } });
    }
  },
  component: NewClientPage,
});
```

**Form fields:** Full Name (required), Email, Phone, TIN, Notes
**On submit:** `INSERT INTO clients (org_id, full_name, email, phone, tin, notes, created_by)`
**Success:** navigate to `/clients/$clientId` with toast "Client added successfully"
**Error:** inline form errors + toast "Failed to save client"

---

### Route 14: `/clients/$clientId` — Client Profile

```typescript
// src/routes/clients/$clientId.tsx
export const clientDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clients/$clientId',
  beforeLoad: ({ context, location }) => {
    if (!context.auth.user) {
      throw redirect({ to: '/auth', search: { redirect: location.href, mode: 'signin' } });
    }
  },
  component: ClientDetailPage,
});
```

**Data loaded:**
```typescript
// Client details + their computations
const [clientResult, computationsResult] = await Promise.all([
  supabase.from('clients').select('*').eq('id', clientId).eq('org_id', orgId).single(),
  supabase.from('computations').select('id, title, tax_year, status, updated_at')
    .eq('client_id', clientId).eq('org_id', orgId).order('updated_at', { ascending: false }),
]);
```

**States:**
- Loading: skeleton
- Not found: "Client not found" with Back button
- Loaded: client info card + computations list + "New Computation for This Client" button → `/computations/new?clientId=$clientId`

---

### Route 15: `/deadlines` — Filing Deadlines

```typescript
// src/routes/deadlines.tsx
export const deadlinesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/deadlines',
  beforeLoad: ({ context, location }) => {
    if (!context.auth.user) {
      throw redirect({ to: '/auth', search: { redirect: location.href, mode: 'signin' } });
    }
  },
  component: DeadlinesPage,
});
```

**Data loaded:**
```typescript
const { data: deadlines } = await supabase
  .from('computation_deadlines')
  .select('*, computations(id, title, clients(full_name))')
  .eq('computations.org_id', orgId)
  .gte('due_date', new Date().toISOString().split('T')[0])
  .order('due_date', { ascending: true })
  .limit(100);
```

**Display:** Grouped by month, `DeadlineCard` per deadline with: label, due date, computation title, client name, completion toggle

---

### Route 16: `/settings` — Firm Profile & Branding

```typescript
// src/routes/settings/index.tsx
export const settingsIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  beforeLoad: ({ context, location }) => {
    if (!context.auth.user) {
      throw redirect({ to: '/auth', search: { redirect: location.href, mode: 'signin' } });
    }
  },
  component: SettingsPage,
});
```

**Data loaded:**
```typescript
const [profileResult, orgResult] = await Promise.all([
  supabase.from('user_profiles').select('*').eq('id', user.id).single(),
  supabase.from('organizations').select('*').eq('id', orgId).single(),
]);
```

**Sections:**
1. Personal Info: full name, email (read-only from Supabase auth), password change link
2. Firm Branding: firm name, firm address, logo upload (Supabase Storage), PDF accent color
3. BIR Info: RDO number, TIN, PTR number, attorney's roll number (for CPA firms)
4. Danger Zone: Delete account (admin only)

---

### Route 17: `/settings/team` — Team Management

```typescript
// src/routes/settings/team.tsx
export const settingsTeamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/team',
  beforeLoad: ({ context, location }) => {
    if (!context.auth.user) {
      throw redirect({ to: '/auth', search: { redirect: location.href, mode: 'signin' } });
    }
    // Additional guard: only admin or accountant roles can manage team
    // Role check happens inside component (cannot check role in beforeLoad without DB call)
  },
  component: TeamSettingsPage,
});
```

**Data loaded:**
```typescript
const [membersResult, invitationsResult] = await Promise.all([
  supabase.from('organization_members')
    .select('id, role, joined_at, user_profiles(full_name, email)')
    .eq('org_id', orgId),
  supabase.from('organization_invitations')
    .select('id, email, role, status, invited_by, expires_at')
    .eq('org_id', orgId)
    .eq('status', 'pending'),
]);
```

**Sections:**
- Current Members: table with name, email, role, joined date; Remove button (disabled for own row and last admin)
- Pending Invitations: table with email, role, expires; Revoke button
- Invite New Member: email input + role select + Send Invitation button (calls `invite_member` function)
- Plan limits: if at seat limit, show upgrade CTA instead of invite form

---

### Route 18: `/share/$token` — Public Shared Computation

```typescript
// src/routes/share/$token.tsx
export const shareTokenRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/share/$token',
  component: SharePage,
});
```

**Public route** — no auth guard. Anyone with the link can view.
**Data loaded:**
```typescript
// Calls SECURITY DEFINER RPC — bypasses RLS for public access
const { data, error } = await supabase.rpc('get_shared_computation', {
  p_token: token, // UUID — must match share_token column type (see migration-verification)
});
```

**States:**
- Loading: spinner
- Not found (data null or share_enabled false): `Card` with "This link is no longer valid or sharing has been disabled."
- Error: "Something went wrong loading this computation."
- Loaded: `ResultsView` in read-only mode with firm branding header

**Layout:** No AppLayout — clean centered layout with TaxKlaro logo + "Created with TaxKlaro" attribution footer

---

## 5. Route File Index

All route files must exist and be registered in `src/router.ts`:

```
src/
  router.ts
  routes/
    __root.tsx
    index.tsx
    auth.tsx
    auth/
      callback.tsx
      reset.tsx
      reset-confirm.tsx
    onboarding.tsx
    invite/
      $token.tsx
    computations/
      index.tsx
      new.tsx
      $compId.tsx
      $compId.quarterly.tsx
    clients/
      index.tsx
      new.tsx
      $clientId.tsx
    deadlines.tsx
    settings/
      index.tsx
      team.tsx
    share/
      $token.tsx
```

**Total: 18 route files** — every file must be created AND registered in `router.ts`. Missing registration = white page with no error.

---

## 6. Navigation Guards Summary

| Guard Type | Routes | Redirect Target |
|------------|--------|-----------------|
| `beforeLoad` (unauthenticated) | 11 routes | `/auth?mode=signin&redirect=<current>` |
| Org membership check (in-component) | All authenticated routes | `/onboarding` |
| Admin-only check (in-component) | Team settings | `Alert` "Admin access required" |
| `share_enabled` check (in-component) | `/share/$token` | "Link not valid" card |

**Org check pattern** (runs in `AppLayout` or `useOrganization` hook):
```typescript
// In useOrganization hook — runs for every authenticated page
const { data: membership } = await supabase
  .from('organization_members')
  .select('org_id, role')
  .eq('user_id', user.id)
  .limit(1)
  .single();

if (!membership) {
  navigate({ to: '/onboarding' });
}
```

---

## 7. Critical Traps

1. **Missing router registration**: Every route file must be imported AND added to `routeTree` in `router.ts`. TanStack Router will silently render nothing for unregistered paths.

2. **publicRootRoute nesting**: Public routes (`/auth/callback`, `/share/$token`, `/invite/$token`) MUST be children of `publicRootRoute` to avoid getting AppLayout applied via `RootLayout`.

3. **`$compId.quarterly.tsx` naming**: The dot in `$compId.quarterly.tsx` makes it a sibling route of `$compId.tsx`, not a nested child. This is the correct pattern for TanStack Router (not `$compId/quarterly.tsx`) when you want it to share the same URL segment level.

4. **Search param validation**: Routes with `validateSearch` must handle unknown keys gracefully — use `?? defaultValue` for every field.

5. **Redirect loop**: The `/onboarding` route has `beforeLoad` for authentication but NOT for org membership (that check is in-component). If the org check redirected to `/onboarding` from `beforeLoad`, and `/onboarding`'s `beforeLoad` checked for org, it would loop.

6. **`/share/$token` and UUID param**: The `$token` route param is a string in TanStack Router. When passing to the RPC, it must be cast/validated as UUID format before the database call. Invalid UUIDs should return the "not found" state, not a 500.

7. **`/auth/callback` code extraction**: The PKCE code is in `window.location.search` (query param `?code=`), NOT in `window.location.hash`. Do not use hash parsing for PKCE.

8. **Route order in routeTree**: `/computations/new` must be registered before `/computations/$compId` so the literal segment "new" wins over the dynamic `$compId` pattern.
