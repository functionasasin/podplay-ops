# PodPlay Ops Wizard — Route Map

Complete route specification for the React 19 + TanStack Router app.
Every route, auth guard, layout component, and navigation element is defined here.

---

## Tech Stack Context

- **Router**: TanStack Router v1 with file-based routing (`src/routes/`)
- **Auth**: Supabase Auth — session stored in localStorage via `@supabase/supabase-js`
- **Auth guard**: Pathless layout route `_auth.tsx` checks session; redirects to `/login` if unauthenticated
- **Layout**: Two nested shells — App Shell (global nav) wraps Project Shell (wizard sidebar)
- **State**: URL is the source of truth for current wizard stage; no global wizard state

---

## File Structure

```
src/routes/
├── __root.tsx                           # Root: providers, Toaster, devtools
├── login.tsx                            # /login
├── auth/
│   └── callback.tsx                     # /auth/callback (Supabase PKCE callback)
├── _auth.tsx                            # Pathless auth guard (redirects if no session)
└── _auth/
    ├── index.tsx                        # / → redirect to /projects
    ├── projects/
    │   ├── index.tsx                    # /projects — dashboard
    │   ├── new.tsx                      # /projects/new — create project + redirect
    │   └── $projectId/
    │       ├── index.tsx                # /projects/$projectId — redirect to active stage
    │       ├── intake/
    │       │   └── index.tsx            # /projects/$projectId/intake
    │       ├── procurement/
    │       │   └── index.tsx            # /projects/$projectId/procurement
    │       ├── deployment/
    │       │   └── index.tsx            # /projects/$projectId/deployment
    │       └── financials/
    │           └── index.tsx            # /projects/$projectId/financials
    ├── inventory/
    │   └── index.tsx                    # /inventory
    ├── financials/
    │   └── index.tsx                    # /financials
    └── settings/
        ├── index.tsx                    # /settings → redirect to /settings/pricing
        ├── pricing.tsx                  # /settings/pricing
        ├── catalog.tsx                  # /settings/catalog
        ├── team.tsx                     # /settings/team
        └── travel.tsx                  # /settings/travel
```

---

## Route Table

| Route | File | Auth? | Component | Description |
|-------|------|-------|-----------|-------------|
| `/login` | `login.tsx` | No | `LoginPage` | Email/password login + magic link |
| `/auth/callback` | `auth/callback.tsx` | No | `AuthCallback` | Supabase PKCE callback; exchanges code for session |
| `/` | `_auth/index.tsx` | Yes | Redirect | Permanent redirect to `/projects` |
| `/projects` | `_auth/projects/index.tsx` | Yes | `DashboardPage` | Project list with search, filters, status pills |
| `/projects/new` | `_auth/projects/new.tsx` | Yes | `NewProjectPage` | Creates project row, redirects to intake |
| `/projects/$projectId` | `_auth/projects/$projectId/index.tsx` | Yes | Redirect | Redirects to current stage route based on `project.status` |
| `/projects/$projectId/intake` | `_auth/projects/$projectId/intake/index.tsx` | Yes | `IntakeWizard` | Stage 1: 6-step intake form |
| `/projects/$projectId/procurement` | `_auth/projects/$projectId/procurement/index.tsx` | Yes | `ProcurementWizard` | Stage 2: BOM, POs, packing |
| `/projects/$projectId/deployment` | `_auth/projects/$projectId/deployment/index.tsx` | Yes | `DeploymentWizard` | Stage 3: 15-phase checklist |
| `/projects/$projectId/financials` | `_auth/projects/$projectId/financials/index.tsx` | Yes | `FinancialsWizard` | Stage 4: invoicing, expenses, P&L |
| `/inventory` | `_auth/inventory/index.tsx` | Yes | `InventoryPage` | Global inventory stock levels |
| `/financials` | `_auth/financials/index.tsx` | Yes | `FinancialsDashboardPage` | Global P&L, HER, revenue pipeline |
| `/settings` | `_auth/settings/index.tsx` | Yes | Redirect | Permanent redirect to `/settings/pricing` |
| `/settings/pricing` | `_auth/settings/pricing.tsx` | Yes | `PricingSettingsPage` | Pricing tiers, service fees, tax rate |
| `/settings/catalog` | `_auth/settings/catalog.tsx` | Yes | `CatalogSettingsPage` | Hardware catalog management |
| `/settings/team` | `_auth/settings/team.tsx` | Yes | `TeamSettingsPage` | Team contacts, salary allocations |
| `/settings/travel` | `_auth/settings/travel.tsx` | Yes | `TravelSettingsPage` | Travel defaults (mileage rate, per diem) |

---

## Root Route — `__root.tsx`

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { queryClient } from '@/lib/queryClient'
// TanStack Router devtools: only included in dev builds via import.meta.env.DEV check

export const Route = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="bottom-right" richColors />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </QueryClientProvider>
  ),
})
```

**File**: `src/lib/queryClient.ts`
```ts
import { QueryClient } from '@tanstack/react-query'
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5 } }, // 5-minute stale time
})
```

---

## Auth Guard — `_auth.tsx`

```tsx
// src/routes/_auth.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { AppLayout } from '@/components/layout/AppLayout'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ location }) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
})
```

**Guard behavior**:
- Calls `supabase.auth.getSession()` on every navigation into `/_auth/**`
- If no session: redirects to `/login?redirect=<original_url>`
- After login success, redirects back to the original URL from `?redirect=` param
- If session exists: renders `AppLayout` with `<Outlet />`

---

## Login Route — `login.tsx`

```tsx
// src/routes/login.tsx
// Search params type: { redirect?: string }
```

**Behavior**:
- If user is already authenticated (session exists), redirect to `/projects`
- Two login methods: Email + password, Magic link (email OTP)
- On success: redirect to `search.redirect ?? '/projects'`
- Error states: "Invalid credentials", "Email not confirmed", network error
- No self-registration — admin creates accounts in Supabase dashboard

**Component**: `src/components/auth/LoginPage.tsx`
- Logo + "PodPlay Ops" heading
- Email input (type="email", required)
- Password input (type="password", required) + "Forgot password?" link
- Submit button: "Sign In"
- Divider: "or"
- "Send magic link" button — sends OTP email, shows success toast
- On magic link: `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/auth/callback' } })`
- On password: `supabase.auth.signInWithPassword({ email, password })`

---

## Auth Callback — `auth/callback.tsx`

```tsx
// src/routes/auth/callback.tsx
// Handles Supabase PKCE code exchange after magic link or OAuth
```

**Behavior**:
1. On mount: call `supabase.auth.exchangeCodeForSession(code)` where `code` comes from URL `?code=` param
2. On success: redirect to `/projects` (or `?redirect=` if present)
3. On failure: redirect to `/login` with error toast "Login link expired. Please request a new one."
4. Shows loading spinner while exchanging ("Signing you in...")

**Component**: `src/components/auth/AuthCallback.tsx`

---

## App Layout — `AppLayout`

**File**: `src/components/layout/AppLayout.tsx`

**Structure**:
```
┌─────────────────────────────────────────────────────┐
│  SIDEBAR (240px fixed, collapsible to 60px)          │
│  ┌────────────────────────────────────────────────┐  │
│  │  PodPlay Ops  [logo]                           │  │
│  │  ─────────────────────────────────────────     │  │
│  │  [≡] Projects         /projects                │  │
│  │  [📦] Inventory       /inventory               │  │
│  │  [$] Financials       /financials              │  │
│  │  [⚙] Settings        /settings                │  │
│  │  ─────────────────────────────────────────     │  │
│  │  [user email]                                  │  │
│  │  [Sign out]                                    │  │
│  └────────────────────────────────────────────────┘  │
│  MAIN CONTENT AREA (flex-1, overflow-y-auto)         │
│  ┌────────────────────────────────────────────────┐  │
│  │  <Outlet />                                    │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Nav items** (in order):
1. "Projects" — icon: `LayoutDashboard` (lucide) — href: `/projects` — active: path starts with `/projects`
2. "Inventory" — icon: `Package` — href: `/inventory` — active: path starts with `/inventory`
3. "Financials" — icon: `DollarSign` — href: `/financials` — active: path starts with `/financials`
4. "Settings" — icon: `Settings` — href: `/settings` — active: path starts with `/settings`

**Sidebar collapse**:
- Controlled by `sidebarOpen` boolean in `useState` (not persisted)
- Collapsed: show icons only (60px width), tooltip on hover shows label
- Expand/collapse button: `ChevronLeft` / `ChevronRight` at bottom of sidebar
- On mobile (< 768px): sidebar becomes a drawer, toggled by hamburger button in top bar

**Top bar (mobile only)**:
- Hamburger button (`Menu` icon) opens sidebar drawer
- "PodPlay Ops" text

**User section** (bottom of sidebar):
- Shows `session.user.email` truncated to 24 chars with `...`
- "Sign out" button: calls `supabase.auth.signOut()` then `navigate({ to: '/login' })`

**Active state**: `NavLink` uses `isActive` from TanStack Router's `useMatch` hook; active item: `bg-muted text-foreground font-medium`, inactive: `text-muted-foreground hover:text-foreground hover:bg-muted/50`

---

## Project Index Redirect — `$projectId/index.tsx`

```tsx
// src/routes/_auth/projects/$projectId/index.tsx
export const Route = createFileRoute('/_auth/projects/$projectId/')({
  loader: async ({ params }) => {
    const project = await getProject(params.projectId)
    return project
  },
  component: ProjectIndexRedirect,
})

function ProjectIndexRedirect() {
  const project = Route.useLoaderData()
  const stageRoute = {
    intake: '/_auth/projects/$projectId/intake/',
    procurement: '/_auth/projects/$projectId/procurement/',
    deployment: '/_auth/projects/$projectId/deployment/',
    financial_close: '/_auth/projects/$projectId/financials/',
    completed: '/_auth/projects/$projectId/financials/',
    cancelled: '/_auth/projects/$projectId/intake/',
  }[project.status] ?? '/_auth/projects/$projectId/intake/'

  return <Navigate to={stageRoute} params={{ projectId: project.id }} replace />
}
```

**Stage-to-route mapping**:
| `project.status` | Redirect to |
|-----------------|-------------|
| `intake` | `/projects/$projectId/intake` |
| `procurement` | `/projects/$projectId/procurement` |
| `deployment` | `/projects/$projectId/deployment` |
| `financial_close` | `/projects/$projectId/financials` |
| `completed` | `/projects/$projectId/financials` |
| `cancelled` | `/projects/$projectId/intake` |

---

## Project Shell Layout

The four wizard stage routes share a common project shell layout defined inline in each stage route's parent. In TanStack Router file-based routing, the project shell is implemented as a pathless layout in `$projectId.tsx` (the parent route file for the `$projectId/` directory).

**File**: `src/routes/_auth/projects/$projectId.tsx`

```tsx
export const Route = createFileRoute('/_auth/projects/$projectId')({
  loader: async ({ params }) => getProject(params.projectId),
  component: ProjectShell,
  notFoundComponent: () => <ProjectNotFound />,
})
```

**ProjectShell structure**:
```
┌──────────────────────────────────────────────────────────────────┐
│  BREADCRUMB BAR                                                   │
│  Projects > {project.venue_name}                                  │
│  [{stage pill}: INTAKE | PROCUREMENT | DEPLOYMENT | FINANCIALS]  │
├──────────────────────────────────────────────────────────────────┤
│  WIZARD STAGE TABS                                                │
│  [1 Intake ✓] [2 Procurement ✓] [3 Deployment →] [4 Financials] │
├──────────────────────────────────────────────────────────────────┤
│  STAGE CONTENT                                                    │
│  <Outlet />                                                       │
└──────────────────────────────────────────────────────────────────┘
```

**Breadcrumb**:
- "Projects" → link to `/projects`
- `>` separator
- `{project.venue_name}` — not a link (current location)

**Stage tabs**:
- Four tabs: "1 Intake", "2 Procurement", "3 Deployment", "4 Financials"
- Each tab shows a status indicator:
  - Completed stage: green checkmark (`CheckCircle2` icon)
  - Current stage: blue arrow (`ArrowRight` icon)
  - Future stage: gray circle (step number)
- Tab is **clickable** (non-linear navigation allowed) — navigates to stage route
- Tab is **disabled** only if stage has never been entered (no data exists yet):
  - "2 Procurement" disabled if `project.status === 'intake'` AND no BOM rows exist
  - "3 Deployment" disabled if no checklist items exist
  - "4 Financials" disabled if no invoices exist
- Tab disabled state: `opacity-50 cursor-not-allowed pointer-events-none`

**Stage tab to route mapping**:
| Tab | Route |
|-----|-------|
| 1 Intake | `/projects/$projectId/intake` |
| 2 Procurement | `/projects/$projectId/procurement` |
| 3 Deployment | `/projects/$projectId/deployment` |
| 4 Financials | `/projects/$projectId/financials` |

---

## Settings Sub-Navigation

Settings routes use a secondary horizontal tab bar within the settings layout.

**Settings layout** (inline in each settings route or via `settings.tsx` parent):

```
┌───────────────────────────────────────────────────┐
│  Settings                                          │
│  [Pricing] [Catalog] [Team] [Travel]              │
├───────────────────────────────────────────────────┤
│  <tab content>                                    │
└───────────────────────────────────────────────────┘
```

**Settings tabs**:
| Tab label | Route | Description |
|-----------|-------|-------------|
| Pricing | `/settings/pricing` | Service fees, tax rate, margins, PBK pricing |
| Catalog | `/settings/catalog` | Hardware items: name, SKU, vendor, unit cost |
| Team | `/settings/team` | Contacts (Andy/Nico/Chad/Stan/Agustin), salary allocations |
| Travel | `/settings/travel` | Mileage rate, per diem, default travel expense amounts |

---

## `/projects/new` Behavior

**File**: `src/routes/_auth/projects/new.tsx`

This route creates a blank project row and immediately redirects to intake.

```tsx
export const Route = createFileRoute('/_auth/projects/new')({
  component: NewProjectPage,
})

function NewProjectPage() {
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (creating) return
    setCreating(true)
    createProject().then((project) => {
      navigate({
        to: '/_auth/projects/$projectId/intake/',
        params: { projectId: project.id },
        replace: true,
      })
    })
  }, [])

  return <LoadingSpinner text="Creating project..." />
}
```

`createProject()` inserts a minimal row:
```ts
// src/services/projects.ts
export async function createProject(): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      customer_name: '',
      venue_name: '',
      venue_city: '',
      venue_state: '',
      tier: 'pro',          // default, overwritten in Step 1 of intake
      court_count: 1,       // default
      status: 'intake',
    })
    .select()
    .single()
  if (error) throw error
  return data
}
```

---

## Navigation Guards (Stage Advancement)

Stage advancement (moving from one wizard stage to the next) is controlled by explicit "Advance to X" buttons within each wizard stage — NOT enforced by route guards. The reason: users must be able to navigate backward freely, and the wizard tracks partial completion.

**No route-level blocking** for stage access. The project shell's tab disabled logic is the only soft gate.

**Wizard-level gates** (implemented within wizard components, not routes):
- Advancing from Stage 1 → Stage 2 requires: `customer_name`, `venue_name`, `tier`, `court_count` are non-empty
- Advancing from Stage 2 → Stage 3 requires: at least one BOM item exists
- Advancing from Stage 3 → Stage 4 requires: `deployment_status === 'completed'` (soft — can override with confirmation dialog)
- Stage 4 → "Completed" requires: both invoices `status === 'paid'`

When a gate blocks advancement, the wizard shows an inline error message listing the missing requirements. It does NOT redirect or block navigation — just prevents the "Next Stage" button action.

---

## URL Search Params

Only the dashboard uses search params for filtering.

**`/projects` search params**:
```ts
type ProjectsSearch = {
  status?: project_status    // filter by project status
  tier?: service_tier        // filter by tier
  q?: string                 // text search on customer_name, venue_name
  page?: number              // pagination (default: 1)
}
```

**`/inventory` search params**:
```ts
type InventorySearch = {
  category?: bom_category    // filter by hardware category
  low_stock?: boolean        // show only items below reorder_point
  q?: string                 // text search on item name, SKU
}
```

**`/financials` search params**:
```ts
type FinancialsSearch = {
  year?: number              // year for monthly P&L view (default: current year)
  month?: number             // month for detailed view (default: current month)
}
```

All search params are validated with Zod in the `validateSearch` function of each route definition:
```ts
export const Route = createFileRoute('/_auth/projects/')({
  validateSearch: (search) => projectsSearchSchema.parse(search),
  // ...
})
```

---

## Error Handling

**Route-level error boundary**: Each wizard route defines an `errorComponent`:

```tsx
errorComponent: ({ error }) => (
  <div className="p-8 text-center">
    <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-4" />
    <p className="text-destructive font-medium">Failed to load</p>
    <p className="text-muted-foreground text-sm mt-1">{error.message}</p>
    <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
      Retry
    </Button>
  </div>
)
```

**Pending/loading component**: Each route with a loader defines a `pendingComponent`:
```tsx
pendingComponent: () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
)
```

**Not found**: `__root.tsx` defines a `notFoundComponent` that renders a 404 page with a link back to `/projects`.

---

## Loader Data Pattern

All data fetching uses TanStack Router loaders (not `useEffect`). Loaders call service functions from `src/services/`.

**Pattern** for a project stage route:
```ts
export const Route = createFileRoute('/_auth/projects/$projectId/deployment/')({
  loader: async ({ params }) => {
    const [project, checklistItems] = await Promise.all([
      getProject(params.projectId),
      getDeploymentChecklist(params.projectId),
    ])
    return { project, checklistItems }
  },
  component: DeploymentWizard,
  pendingComponent: DeploymentSkeleton,
  errorComponent: DeploymentError,
})
```

Loaders are **not** wrapped in `try/catch` — TanStack Router's `errorComponent` catches thrown errors automatically.

---

## Service Layer Entry Points

Each route's loader calls service functions. Service function locations:

| Route | Loader calls |
|-------|-------------|
| `/projects` | `getProjects(filters)` from `src/services/projects.ts` |
| `/projects/$projectId/intake` | `getProject(id)` from `src/services/projects.ts` |
| `/projects/$projectId/procurement` | `getProject(id)`, `getProjectBom(id)`, `getPurchaseOrders(id)` |
| `/projects/$projectId/deployment` | `getProject(id)`, `getDeploymentChecklist(id)` |
| `/projects/$projectId/financials` | `getProject(id)`, `getInvoices(id)`, `getExpenses(id)` |
| `/inventory` | `getInventoryItems(filters)` from `src/services/inventory.ts` |
| `/financials` | `getFinancialsDashboard(year, month)` from `src/services/financials.ts` |
| `/settings/pricing` | `getSettings()` from `src/services/settings.ts` |
| `/settings/catalog` | `getHardwareCatalog()` from `src/services/catalog.ts` |
| `/settings/team` | `getSettings()` (team/salary fields) |
| `/settings/travel` | `getSettings()` (travel fields) |

---

## File Creation Summary

These files must be created for the routing layer:

```
src/
├── main.tsx                                          # createRouter, RouterProvider
├── lib/
│   ├── queryClient.ts                                # TanStack Query client
│   └── supabase.ts                                   # Supabase client singleton
├── routes/
│   ├── __root.tsx
│   ├── login.tsx
│   ├── auth/
│   │   └── callback.tsx
│   ├── _auth.tsx
│   └── _auth/
│       ├── index.tsx
│       ├── projects/
│       │   ├── index.tsx
│       │   ├── new.tsx
│       │   └── $projectId/
│       │       ├── index.tsx
│       │       ├── intake/
│       │       │   └── index.tsx
│       │       ├── procurement/
│       │       │   └── index.tsx
│       │       ├── deployment/
│       │       │   └── index.tsx
│       │       └── financials/
│       │           └── index.tsx
│       ├── inventory/
│       │   └── index.tsx
│       ├── financials/
│       │   └── index.tsx
│       └── settings/
│           ├── index.tsx
│           ├── pricing.tsx
│           ├── catalog.tsx
│           ├── team.tsx
│           └── travel.tsx
└── components/
    ├── auth/
    │   ├── LoginPage.tsx
    │   └── AuthCallback.tsx
    └── layout/
        └── AppLayout.tsx
```

**`src/main.tsx`**:
```tsx
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'  // auto-generated by TanStack Router CLI

const router = createRouter({ routeTree, defaultPreload: 'intent' })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
```

**`vite.config.ts`** must include TanStack Router plugin for file-based routing code generation:
```ts
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
export default defineConfig({
  plugins: [react(), TanStackRouterVite()],
})
```

---

## Package Dependencies

Required packages for routing layer:

```json
{
  "dependencies": {
    "@tanstack/react-router": "^1.x",
    "@tanstack/react-query": "^5.x",
    "@supabase/supabase-js": "^2.x",
    "react": "^19.x",
    "react-dom": "^19.x"
  },
  "devDependencies": {
    "@tanstack/router-vite-plugin": "^1.x",
    "@tanstack/router-devtools": "^1.x",
    "@tanstack/react-query-devtools": "^5.x"
  }
}
```
