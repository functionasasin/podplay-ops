# Analysis: Route Table — TanStack Router (File-Based Routing)

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** route-table
**Date:** 2026-03-06
**Sources:** auth-flow.md, wizard-steps.md, results-view.md, batch-upload-ui.md, nlrc-worksheet-ui.md, company-plan-ui.md, landing-page.md

---

## Overview

The app uses TanStack Router with file-based routing (`@tanstack/router-plugin/vite`). Route files
live in `apps/retirement-pay/frontend/src/routes/`. The `_authenticated` layout route prefix
means the path segment is NOT included in the URL — it's a logical grouping for the auth guard.

All protected routes use `_authenticated.tsx` as their layout parent, which runs `beforeLoad` to
check for an active Supabase session and throws `redirect({ to: "/auth/sign-in" })` if absent.

The `SetupPage` pattern: if `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are missing at
app load time, the root layout renders `<SetupPage />` instead of the router entirely.

---

## 1. File Structure

```
apps/retirement-pay/frontend/src/routes/
├── __root.tsx                              # Root layout (QueryClientProvider, AuthProvider, Toaster)
├── index.tsx                               # / — landing page (public)
├── setup.tsx                               # /setup — missing env vars page (public)
├── auth/
│   ├── sign-in.tsx                         # /auth/sign-in
│   ├── sign-up.tsx                         # /auth/sign-up
│   ├── callback.tsx                        # /auth/callback — PKCE exchange
│   ├── forgot-password.tsx                 # /auth/forgot-password
│   └── update-password.tsx                 # /auth/update-password
├── share/
│   └── $token.tsx                          # /share/$token — public shared computation
├── _authenticated.tsx                      # Auth guard layout (no URL segment)
└── _authenticated/
    ├── dashboard.tsx                       # /dashboard
    ├── compute/
    │   ├── new.tsx                         # /compute/new — single employee wizard
    │   └── $id/
    │       ├── index.tsx                   # /compute/$id — redirect to /compute/$id/results
    │       ├── results.tsx                 # /compute/$id/results — full results view
    │       ├── edit.tsx                    # /compute/$id/edit — re-enter wizard with saved data
    │       └── nlrc.tsx                    # /compute/$id/nlrc — NLRC worksheet view
    ├── batch/
    │   ├── new.tsx                         # /batch/new — CSV upload wizard
    │   └── $id.tsx                         # /batch/$id — batch results
    ├── settings.tsx                        # /settings — account settings
    └── org/
        ├── index.tsx                       # /org — org list (redirect to current org or /org/new)
        ├── new.tsx                         # /org/new — create organization
        └── $orgId/
            ├── index.tsx                   # /org/$orgId — org dashboard
            ├── members.tsx                 # /org/$orgId/members — member management
            ├── invitations.tsx             # /org/$orgId/invitations — pending invitations
            └── settings.tsx               # /org/$orgId/settings — org settings
```

---

## 2. Complete Route Table

| # | Path | File | Component | Auth | Public |
|---|------|------|-----------|------|--------|
| 1 | `/` | `routes/index.tsx` | `LandingPage` | No | Yes |
| 2 | `/setup` | `routes/setup.tsx` | `SetupPage` | No | Yes |
| 3 | `/auth/sign-in` | `routes/auth/sign-in.tsx` | `SignInPage` | No | Yes |
| 4 | `/auth/sign-up` | `routes/auth/sign-up.tsx` | `SignUpPage` | No | Yes |
| 5 | `/auth/callback` | `routes/auth/callback.tsx` | `AuthCallbackPage` | No | Yes |
| 6 | `/auth/forgot-password` | `routes/auth/forgot-password.tsx` | `ForgotPasswordPage` | No | Yes |
| 7 | `/auth/update-password` | `routes/auth/update-password.tsx` | `UpdatePasswordPage` | No (temp session) | Yes |
| 8 | `/share/$token` | `routes/share/$token.tsx` | `SharedResultsPage` | No | Yes |
| 9 | `/dashboard` | `routes/_authenticated/dashboard.tsx` | `DashboardPage` | Yes | No |
| 10 | `/compute/new` | `routes/_authenticated/compute/new.tsx` | `NewComputationPage` | Yes | No |
| 11 | `/compute/$id` | `routes/_authenticated/compute/$id/index.tsx` | redirect → `/compute/$id/results` | Yes | No |
| 12 | `/compute/$id/results` | `routes/_authenticated/compute/$id/results.tsx` | `ComputationResultsPage` | Yes | No |
| 13 | `/compute/$id/edit` | `routes/_authenticated/compute/$id/edit.tsx` | `EditComputationPage` | Yes | No |
| 14 | `/compute/$id/nlrc` | `routes/_authenticated/compute/$id/nlrc.tsx` | `NlrcWorksheetPage` | Yes | No |
| 15 | `/batch/new` | `routes/_authenticated/batch/new.tsx` | `NewBatchPage` | Yes | No |
| 16 | `/batch/$id` | `routes/_authenticated/batch/$id.tsx` | `BatchResultsPage` | Yes | No |
| 17 | `/settings` | `routes/_authenticated/settings.tsx` | `SettingsPage` | Yes | No |
| 18 | `/org` | `routes/_authenticated/org/index.tsx` | `OrgIndexPage` (redirect logic) | Yes | No |
| 19 | `/org/new` | `routes/_authenticated/org/new.tsx` | `NewOrgPage` | Yes | No |
| 20 | `/org/$orgId` | `routes/_authenticated/org/$orgId/index.tsx` | `OrgDashboardPage` | Yes | No |
| 21 | `/org/$orgId/members` | `routes/_authenticated/org/$orgId/members.tsx` | `OrgMembersPage` | Yes | No |
| 22 | `/org/$orgId/invitations` | `routes/_authenticated/org/$orgId/invitations.tsx` | `OrgInvitationsPage` | Yes | No |
| 23 | `/org/$orgId/settings` | `routes/_authenticated/org/$orgId/settings.tsx` | `OrgSettingsPage` | Yes | No |

---

## 3. Root Layout (`__root.tsx`)

**File:** `src/routes/__root.tsx`

The root layout wraps every page. It provides:
- `QueryClientProvider` from TanStack Query (for `useQuery` hooks)
- `AuthProvider` from `@/contexts/AuthContext`
- `<Toaster />` from sonner (global toast notifications)
- Env var check: if `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` are falsy, render `<SetupPage />` instead of `<Outlet />`

```typescript
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'
import { SetupPage } from '@/components/SetupPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

const supabaseConfigured =
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  if (!supabaseConfigured) {
    return <SetupPage />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  )
}
```

---

## 4. Auth Guard Layout (`_authenticated.tsx`)

**File:** `src/routes/_authenticated.tsx`

```typescript
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { AppShell } from '@/components/layout/AppShell'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw redirect({ to: '/auth/sign-in' })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
```

`AppShell` renders the sidebar navigation (desktop) + drawer (mobile) + top bar with user menu.
All child routes of `_authenticated` automatically inherit this layout and the auth guard.

---

## 5. Route Definitions (per route)

### Route 1: Landing Page — `/`

**File:** `src/routes/index.tsx`
**Component:** `LandingPage`
**Auth:** Public
**Layout:** None (standalone full-page, not inside AppShell)
**Navigation triggers:**
- "Sign In" button → `/auth/sign-in`
- "Get Started" / "Create Free Account" → `/auth/sign-up`
- "Try the Calculator" sample computation link (scroll to demo section)

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '@/pages/LandingPage'

export const Route = createFileRoute('/')({
  component: LandingPage,
})
```

---

### Route 2: Setup Page — `/setup`

**File:** `src/routes/setup.tsx`
**Component:** `SetupPage`
**Auth:** Public
**Purpose:** Rendered by root layout when env vars are missing. Also directly accessible
at `/setup` for development onboarding.

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { SetupPage } from '@/components/SetupPage'

export const Route = createFileRoute('/setup')({
  component: SetupPage,
})
```

`SetupPage` renders:
- Heading: "Setup Required"
- Instructions for creating `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- A `<pre>` code block showing the example `.env.local` content
- "Restart the dev server after saving" reminder

---

### Route 3–7: Auth Pages

All defined in `auth-flow.md`. Route definitions:

```typescript
// auth/sign-in.tsx
export const Route = createFileRoute('/auth/sign-in')({ component: SignInPage })

// auth/sign-up.tsx
export const Route = createFileRoute('/auth/sign-up')({ component: SignUpPage })

// auth/callback.tsx
export const Route = createFileRoute('/auth/callback')({ component: AuthCallbackPage })

// auth/forgot-password.tsx
export const Route = createFileRoute('/auth/forgot-password')({ component: ForgotPasswordPage })

// auth/update-password.tsx
export const Route = createFileRoute('/auth/update-password')({ component: UpdatePasswordPage })
```

All auth pages render a full-screen centered card layout (no AppShell, no sidebar).

---

### Route 8: Shared Computation — `/share/$token`

**File:** `src/routes/share/$token.tsx`
**Component:** `SharedResultsPage`
**Auth:** Public (anon Supabase RPC)
**Layout:** Minimal public layout (no sidebar, simple header with logo + sign-up link)

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { SharedResultsPage } from '@/pages/share/SharedResultsPage'

export const Route = createFileRoute('/share/$token')({
  component: SharedResultsPage,
})
```

`SharedResultsPage` calls `supabase.rpc('get_shared_computation', { p_token: token })`
where `token` is a UUID string from the URL. See results-view.md for full component breakdown.

---

### Route 9: Dashboard — `/dashboard`

**File:** `src/routes/_authenticated/dashboard.tsx`
**Component:** `DashboardPage`
**Auth:** Required (inherited from `_authenticated`)
**Layout:** AppShell with sidebar

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/pages/DashboardPage'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})
```

**`DashboardPage` contents:**
- Page heading: "Dashboard"
- "New Computation" button → `/compute/new`
- "Batch Upload" button → `/batch/new`
- `ComputationCardGrid` — grid of saved `ComputationCard` components
  - Each card shows: employee name, company, retirement date, pay amount, status badge
  - Click → `/compute/$id/results`
- Empty state when no computations exist: `EmptyComputationsState` component
- Recent activity section (last 5 computations)

---

### Route 10: New Computation Wizard — `/compute/new`

**File:** `src/routes/_authenticated/compute/new.tsx`
**Component:** `NewComputationPage`
**Auth:** Required
**Layout:** AppShell

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { NewComputationPage } from '@/pages/compute/NewComputationPage'

export const Route = createFileRoute('/_authenticated/compute/new')({
  component: NewComputationPage,
})
```

5-step wizard. On submit, calls `compute_single_json`, saves to Supabase, navigates to
`/compute/$id/results`. See wizard-steps.md for full specification.

---

### Route 11: Computation Index — `/compute/$id`

**File:** `src/routes/_authenticated/compute/$id/index.tsx`
**Component:** Redirect (no visible page)
**Auth:** Required

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/compute/$id/')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/compute/$id/results', params: { id: params.id } })
  },
})
```

---

### Route 12: Computation Results — `/compute/$id/results`

**File:** `src/routes/_authenticated/compute/$id/results.tsx`
**Component:** `ComputationResultsPage`
**Auth:** Required
**Layout:** AppShell

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { ComputationResultsPage } from '@/pages/compute/ComputationResultsPage'

export const Route = createFileRoute('/_authenticated/compute/$id/results')({
  component: ComputationResultsPage,
})
```

Full results display. See results-view.md for complete component breakdown.

---

### Route 13: Edit Computation — `/compute/$id/edit`

**File:** `src/routes/_authenticated/compute/$id/edit.tsx`
**Component:** `EditComputationPage`
**Auth:** Required
**Layout:** AppShell

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { EditComputationPage } from '@/pages/compute/EditComputationPage'

export const Route = createFileRoute('/_authenticated/compute/$id/edit')({
  component: EditComputationPage,
})
```

**`EditComputationPage` behavior:**
- Fetches existing `ComputationRecord` by `id` from Supabase
- Pre-populates wizard with `record.input as RetirementInput`
- On re-submit: updates the existing record (`supabase.from("computations").update()`)
- Navigates back to `/compute/$id/results`
- Reuses all 5 wizard step components from `NewComputationPage` but in "edit mode"

**Edit mode prop flow:**
```typescript
// EditComputationPage fetches savedInput, then renders:
<WizardContainer
  initialData={savedInput}
  onComplete={async (newInput) => {
    const output = await computeSingle(newInput)
    await supabase.from("computations").update({ input: newInput, output, status: "computed" }).eq("id", id)
    navigate({ to: "/compute/$id/results", params: { id } })
  }}
/>
```

---

### Route 14: NLRC Worksheet — `/compute/$id/nlrc`

**File:** `src/routes/_authenticated/compute/$id/nlrc.tsx`
**Component:** `NlrcWorksheetPage`
**Auth:** Required
**Layout:** AppShell (with print-specific CSS that hides sidebar on `@media print`)

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { NlrcWorksheetPage } from '@/pages/compute/NlrcWorksheetPage'

export const Route = createFileRoute('/_authenticated/compute/$id/nlrc')({
  component: NlrcWorksheetPage,
})
```

See nlrc-worksheet-ui.md for full component breakdown.

---

### Route 15: New Batch — `/batch/new`

**File:** `src/routes/_authenticated/batch/new.tsx`
**Component:** `NewBatchPage`
**Auth:** Required
**Layout:** AppShell

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { NewBatchPage } from '@/pages/batch/NewBatchPage'

export const Route = createFileRoute('/_authenticated/batch/new')({
  component: NewBatchPage,
})
```

CSV upload + processing wizard. On completion navigates to `/batch/$id`.
See batch-upload-ui.md for full component breakdown.

---

### Route 16: Batch Results — `/batch/$id`

**File:** `src/routes/_authenticated/batch/$id.tsx`
**Component:** `BatchResultsPage`
**Auth:** Required
**Layout:** AppShell

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { BatchResultsPage } from '@/pages/batch/BatchResultsPage'

export const Route = createFileRoute('/_authenticated/batch/$id')({
  component: BatchResultsPage,
})
```

Displays batch computation results: summary totals card + per-employee rows table.
Export CSV, Export PDF, View any individual employee's results.
See batch-upload-ui.md for full component breakdown.

---

### Route 17: Settings — `/settings`

**File:** `src/routes/_authenticated/settings.tsx`
**Component:** `SettingsPage`
**Auth:** Required
**Layout:** AppShell

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '@/pages/SettingsPage'

export const Route = createFileRoute('/_authenticated/settings')({
  component: SettingsPage,
})
```

**`SettingsPage` tabs:**
1. **Profile** — full name (editable via `supabase.auth.updateUser({ data: { full_name } })`), email (read-only, shown), avatar (not implemented — display initials only)
2. **Password** — change password form (current password not required when using Supabase; uses `supabase.auth.updateUser({ password })`)
3. **Organizations** — list of orgs user belongs to + "Create Organization" button → `/org/new`
4. **Danger Zone** — "Delete Account" button (requires typing email to confirm; calls `supabase.auth.admin.deleteUser()` via Edge Function)

`SettingsPage` uses `<Tabs>` from shadcn/ui with `defaultValue="profile"`.
The active tab is preserved in URL search param: `?tab=profile|password|organizations|danger`.

---

### Route 18: Org Index — `/org`

**File:** `src/routes/_authenticated/org/index.tsx`
**Component:** `OrgIndexPage`
**Auth:** Required

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_authenticated/org/')({
  beforeLoad: async () => {
    // Fetch user's first org membership
    const { data: { user } } = await supabase.auth.getUser()
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user!.id)
      .limit(1)
      .single()

    if (membership) {
      throw redirect({ to: '/org/$orgId', params: { orgId: membership.organization_id } })
    } else {
      throw redirect({ to: '/org/new' })
    }
  },
})
```

No rendered component — purely a redirect based on whether user has an org.

---

### Route 19: New Organization — `/org/new`

**File:** `src/routes/_authenticated/org/new.tsx`
**Component:** `NewOrgPage`
**Auth:** Required
**Layout:** AppShell

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { NewOrgPage } from '@/pages/org/NewOrgPage'

export const Route = createFileRoute('/_authenticated/org/new')({
  component: NewOrgPage,
})
```

**`NewOrgPage` form fields:**
- `orgName: string` — required, min 2 chars, max 80 chars (Label: "Organization Name")
- `orgSlug: string` — auto-generated from name (lowercase, hyphens), editable, must be unique (Label: "URL Slug")
- `industry: OrgIndustry` — enum select: `"manufacturing" | "retail" | "hospitality" | "healthcare" | "finance" | "bpo" | "other"` (Label: "Industry")

On submit: calls `supabase.rpc('create_organization', { p_name, p_slug, p_industry })` which
creates the org and adds the caller as `owner`. Navigates to `/org/$orgId` on success.

---

### Route 20: Org Dashboard — `/org/$orgId`

**File:** `src/routes/_authenticated/org/$orgId/index.tsx`
**Component:** `OrgDashboardPage`
**Auth:** Required (must be org member)
**Layout:** AppShell

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { OrgDashboardPage } from '@/pages/org/OrgDashboardPage'

export const Route = createFileRoute('/_authenticated/org/$orgId/')({
  component: OrgDashboardPage,
})
```

**`OrgDashboardPage` contents:**
- Org name + plan badge ("Free" | "Pro")
- Member count + "Manage Members" link → `/org/$orgId/members`
- Computations by this org (shared workspace) — `ComputationCardGrid` filtered by `org_id`
- "New Computation" button → `/compute/new` (computation will be linked to org)
- Summary stats: total computations, total retirement pay computed, number of batch runs

---

### Routes 21–23: Org Sub-pages

**`/org/$orgId/members`** — `OrgMembersPage`
- Table of current members with role badges (owner/admin/member)
- "Invite Member" button → opens `InviteMemberDialog` (email + role select)
- Remove member button (owners and admins only; cannot remove self if owner)

**`/org/$orgId/invitations`** — `OrgInvitationsPage`
- Table of pending invitations (email, role, sent date, expiry)
- "Resend" button per invitation (re-sends email)
- "Cancel" button per invitation (deletes the invitation row)

**`/org/$orgId/settings`** — `OrgSettingsPage`
- Edit org name (PATCH to `organizations` table)
- Transfer ownership (owner only) — select new owner from member list
- Danger Zone: "Delete Organization" (requires typing org name; deletes org + all related data via cascade)

---

## 6. Router Setup (`src/main.tsx`)

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'  // auto-generated by @tanstack/router-plugin

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
```

`AuthProvider` and `QueryClientProvider` are inside `__root.tsx`, not here, so they wrap
every route including the router itself (needed for `beforeLoad` to access auth state).

---

## 7. Vite Plugin Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import path from 'path'

export default defineConfig({
  plugins: [
    TanStackRouterVite({ routesDirectory: './src/routes' }),  // MUST be first
    react(),
    wasm(),
    topLevelAwait(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Plugin order is critical: `TanStackRouterVite` FIRST (generates routeTree.gen.ts before
react plugin runs), then `react()`, then WASM plugins last.

---

## 8. Navigation Paths (from any page to any destination)

| From | To | Method |
|------|----|--------|
| Landing `/` | `/auth/sign-in` | CTA button, "Sign In" nav link |
| Landing `/` | `/auth/sign-up` | "Get Started" button |
| `/auth/sign-in` | `/dashboard` | After successful sign-in |
| `/auth/sign-up` | Email confirmation sent screen | After submit |
| `/auth/callback` | `/dashboard` | After PKCE exchange (SIGNED_IN event) |
| `/auth/callback` | `/auth/update-password` | After PKCE exchange (PASSWORD_RECOVERY) |
| `/dashboard` | `/compute/new` | "New Computation" button |
| `/dashboard` | `/batch/new` | "Batch Upload" button |
| `/dashboard` | `/compute/$id/results` | Click on ComputationCard |
| `/compute/new` | `/compute/$id/results` | After wizard submit |
| `/compute/$id/results` | `/compute/$id/edit` | "Edit" button in ResultsPageHeader |
| `/compute/$id/results` | `/compute/$id/nlrc` | "NLRC Worksheet" button in ResultsActionsRow |
| `/compute/$id/results` | `/dashboard` | After delete computation |
| `/compute/$id/edit` | `/compute/$id/results` | After re-submit |
| `/batch/new` | `/batch/$id` | After batch computation completes |
| Any authenticated page | `/auth/sign-in` | Sign out (via AppShell user menu) |
| AppShell sidebar | `/dashboard` | "Dashboard" nav item |
| AppShell sidebar | `/compute/new` | "New Computation" nav item |
| AppShell sidebar | `/batch/new` | "Batch Upload" nav item |
| AppShell sidebar | `/settings` | "Settings" nav item |
| AppShell sidebar | `/org` | "Organization" nav item (redirects to org) |

---

## 9. Protected Route Behavior

**Auth state during page load:** The `beforeLoad` in `_authenticated.tsx` calls
`supabase.auth.getSession()` synchronously (returns from localStorage cache instantly).
The session check is not async-slow in practice — localStorage read.

**If session expires mid-session:** `onAuthStateChange` fires `SIGNED_OUT`. The `AuthContext`
updates `session` to `null`. Protected pages render an empty state momentarily before
`AuthGuard`-like redirection occurs. To handle this cleanly: the `AppShell` watches `useAuth()`
and navigates to `/auth/sign-in` on `SIGNED_OUT` event.

**Redirect after sign-in:** The `beforeLoad` redirect stores the attempted path in a search
param: `throw redirect({ to: '/auth/sign-in', search: { redirect: location.href } })`.
After sign-in, `SignInPage` reads `Route.useSearch().redirect` and navigates there.

---

## 10. Route Parameters

| Parameter | Type | Route | Source |
|-----------|------|-------|--------|
| `$id` (computation) | UUID string | `/compute/$id/*` | Supabase computation UUID |
| `$id` (batch) | UUID string | `/batch/$id` | Supabase batch_computation UUID |
| `$token` | UUID string | `/share/$token` | shared_links.token (UUID) |
| `$orgId` | UUID string | `/org/$orgId/*` | Supabase organization UUID |

All dynamic segments are UUID strings. TanStack Router does not coerce types — parameters
arrive as `string` regardless. Cast to string explicitly when passing to Supabase queries;
do NOT parse as anything else.

---

## 11. 404 Not Found Handling

**File:** `src/routes/__root.tsx` — add `notFoundComponent` to the root route:

```typescript
export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-800">404</h1>
        <p className="text-slate-600">Page not found.</p>
        <Button asChild>
          <Link to="/">Go to Homepage</Link>
        </Button>
      </div>
    </div>
  )
}
```

---

## Summary

23 routes total:
- 8 public routes (landing, setup, 5 auth pages, shared results)
- 15 authenticated routes (dashboard, compute CRUD, batch, settings, org management)

Key structural decisions:
- `_authenticated.tsx` layout route handles all auth guarding in one `beforeLoad` — no per-route auth logic
- `/compute/$id` index redirects to `/compute/$id/results` (canonical results URL)
- `/org` index redirects to first org or `/org/new` based on membership
- `SetupPage` handled at root layout level, not as a route guard
- TanStack Router plugin MUST be first in Vite plugins array
- All `$id` and `$token` params are UUID strings, never parsed or coerced
