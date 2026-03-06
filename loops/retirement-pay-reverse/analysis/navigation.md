# Analysis: Navigation — AppShell, Sidebar, Mobile Drawer, Org Switcher

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** navigation
**Date:** 2026-03-06
**Sources:** route-table.md, auth-flow.md, design-system.md, database-migrations.md

---

## Overview

The navigation system is the `AppShell` component rendered by the `_authenticated.tsx` layout
route. Every authenticated page runs inside it. The shell provides:

- **Desktop (≥ lg):** Fixed left sidebar, 256px wide
- **Mobile (< lg):** Top bar with hamburger, slide-in drawer (Sheet)
- **Org switcher:** Shows current org, dropdown to switch
- **User menu:** Email, sign out
- **Active link highlighting:** TanStack Router's `useRouterState` for current path

---

## 1. File Structure

```
apps/retirement-pay/frontend/src/
├── components/
│   └── layout/
│       ├── AppShell.tsx          # Root shell: decides desktop vs mobile layout
│       ├── Sidebar.tsx           # Desktop sidebar (fixed left panel)
│       ├── MobileTopBar.tsx      # Mobile top bar (hamburger + logo)
│       ├── MobileDrawer.tsx      # Mobile nav drawer (Sheet component)
│       ├── NavLinks.tsx          # Shared nav link list (used by Sidebar + MobileDrawer)
│       ├── OrgSwitcher.tsx       # Org switcher dropdown
│       └── UserMenu.tsx          # User info + sign out
```

---

## 2. AppShell Component

**File:** `src/components/layout/AppShell.tsx`

```tsx
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useState } from "react"
import { Sidebar } from "./Sidebar"
import { MobileTopBar } from "./MobileTopBar"
import { MobileDrawer } from "./MobileDrawer"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar: hidden below lg */}
      <Sidebar />

      {/* Mobile top bar: hidden at lg and above */}
      <MobileTopBar onMenuClick={() => setMobileOpen(true)} />

      {/* Mobile drawer */}
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main content: offset left by sidebar width on desktop */}
      <main className="lg:pl-64">
        <div className="py-8 px-4">
          {children}
        </div>
      </main>
    </div>
  )
}
```

---

## 3. Sidebar Component (Desktop)

**File:** `src/components/layout/Sidebar.tsx`

```tsx
import { NavLinks } from "./NavLinks"
import { OrgSwitcher } from "./OrgSwitcher"
import { UserMenu } from "./UserMenu"
import { Separator } from "@/components/ui/separator"

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <a href="/dashboard" className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-900">RetirePay PH</span>
        </a>
      </div>

      {/* Main nav links — scrollable if needed */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <NavLinks />
      </nav>

      {/* Bottom: org switcher + user menu */}
      <div className="border-t border-gray-200 px-3 py-3 space-y-1">
        <OrgSwitcher />
        <Separator className="my-2" />
        <UserMenu />
      </div>
    </aside>
  )
}
```

---

## 4. Mobile Top Bar

**File:** `src/components/layout/MobileTopBar.tsx`

```tsx
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"

interface MobileTopBarProps {
  onMenuClick: () => void
}

export function MobileTopBar({ onMenuClick }: MobileTopBarProps) {
  return (
    <header className="flex h-14 items-center border-b border-gray-200 bg-white px-4 lg:hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        className="mr-3"
      >
        <Menu className="w-5 h-5" />
      </Button>
      <span className="text-base font-bold text-gray-900">RetirePay PH</span>
    </header>
  )
}
```

---

## 5. Mobile Drawer

**File:** `src/components/layout/MobileDrawer.tsx`

Uses shadcn `Sheet` component for the slide-in panel.

```tsx
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { NavLinks } from "./NavLinks"
import { OrgSwitcher } from "./OrgSwitcher"
import { UserMenu } from "./UserMenu"
import { Separator } from "@/components/ui/separator"

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent side="left" className="w-64 p-0 flex flex-col">
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-gray-200 px-6">
          <span className="text-base font-bold text-gray-900">RetirePay PH</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4" onClick={onClose}>
          {/* onClick on nav closes drawer when any link is clicked */}
          <NavLinks />
        </nav>

        {/* Bottom: org switcher + user menu */}
        <div className="border-t border-gray-200 px-3 py-3 space-y-1">
          <OrgSwitcher />
          <Separator className="my-2" />
          <UserMenu />
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

**Required shadcn install:** `npx shadcn@latest add sheet`

---

## 6. NavLinks Component

**File:** `src/components/layout/NavLinks.tsx`

Shared by `Sidebar` and `MobileDrawer`. Uses TanStack Router's `Link` with active state
detection via `useRouterState`.

```tsx
import { Link, useRouterState } from "@tanstack/react-router"
import {
  LayoutDashboard,
  Calculator,
  FileSpreadsheet,
  Building2,
  Settings,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
  /** If true, only active when exact path match */
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "New Computation",
    to: "/compute/new",
    icon: Plus,
    exact: true,
  },
  {
    label: "Batch Upload",
    to: "/batch/new",
    icon: FileSpreadsheet,
    exact: true,
  },
  {
    label: "Organization",
    to: "/org",
    icon: Building2,
    exact: false,
  },
  {
    label: "Settings",
    to: "/settings",
    icon: Settings,
    exact: true,
  },
]

export function NavLinks() {
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname

  return (
    <ul className="space-y-0.5">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? currentPath === item.to
          : currentPath.startsWith(item.to)
        const Icon = item.icon

        return (
          <li key={item.to}>
            <Link
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  isActive ? "text-gray-900" : "text-gray-400"
                )}
              />
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
```

**Active state logic:**
- `/dashboard` — exact match only (so `/dashboard` is active but `/dashboard/something` is not)
- `/compute/new` — exact match (so viewing `/compute/$id/results` does NOT highlight "New Computation")
- `/batch/new` — exact match
- `/org` — prefix match (so `/org/$orgId/members` highlights "Organization")
- `/settings` — exact match

---

## 7. OrgSwitcher Component

**File:** `src/components/layout/OrgSwitcher.tsx`

Shows current org name. Dropdown lists all orgs the user belongs to + "Create Organization" option.
Uses shadcn `DropdownMenu`.

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Building2, ChevronDown, Plus, Check } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"
import { useOrganization } from "@/hooks/useOrganization"
import { cn } from "@/lib/utils"

export function OrgSwitcher() {
  const navigate = useNavigate()
  const { currentOrg, allOrgs, loading } = useOrganization()

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400">
        <Building2 className="w-4 h-4" />
        <span>Loading...</span>
      </div>
    )
  }

  // No orgs: show "Create Organization" prompt
  if (!currentOrg) {
    return (
      <button
        onClick={() => navigate({ to: "/org/new" })}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Create Organization
      </button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="flex-1 truncate text-left">{currentOrg.name}</span>
          <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Organizations
        </DropdownMenuLabel>
        {allOrgs.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => navigate({ to: "/org/$orgId", params: { orgId: org.id } })}
            className="flex items-center gap-2"
          >
            <Building2 className="w-4 h-4 text-gray-400" />
            <span className="flex-1 truncate">{org.name}</span>
            {org.id === currentOrg.id && (
              <Check className="w-4 h-4 text-gray-600" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate({ to: "/org/new" })}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

**Required shadcn install:** `npx shadcn@latest add dropdown-menu`

---

## 8. useOrganization Hook

**File:** `src/hooks/useOrganization.ts`

Fetches the user's organizations. `currentOrg` is the first org (or the one stored in
`localStorage` as `retirement_pay_current_org_id`).

```typescript
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"

interface OrgSummary {
  id: string
  name: string
  slug: string
  role: "owner" | "admin" | "member"
}

interface UseOrganizationReturn {
  currentOrg: OrgSummary | null
  allOrgs: OrgSummary[]
  loading: boolean
  setCurrentOrg: (orgId: string) => void
}

export function useOrganization(): UseOrganizationReturn {
  const { user } = useAuth()
  const [allOrgs, setAllOrgs] = useState<OrgSummary[]>([])
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(() => {
    return localStorage.getItem("retirement_pay_current_org_id")
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setAllOrgs([])
      setLoading(false)
      return
    }

    supabase
      .from("organization_members")
      .select(`
        role,
        organizations (
          id,
          name,
          slug
        )
      `)
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (error || !data) {
          setAllOrgs([])
          setLoading(false)
          return
        }

        const orgs: OrgSummary[] = data
          .filter((row) => row.organizations !== null)
          .map((row) => ({
            id: (row.organizations as any).id as string,
            name: (row.organizations as any).name as string,
            slug: (row.organizations as any).slug as string,
            role: row.role as "owner" | "admin" | "member",
          }))

        setAllOrgs(orgs)

        // Set current org: prefer stored preference, else first org
        if (orgs.length > 0) {
          const stored = localStorage.getItem("retirement_pay_current_org_id")
          const valid = stored && orgs.find((o) => o.id === stored)
          if (!valid) {
            setCurrentOrgId(orgs[0].id)
            localStorage.setItem("retirement_pay_current_org_id", orgs[0].id)
          }
        }

        setLoading(false)
      })
  }, [user])

  const setCurrentOrg = (orgId: string) => {
    setCurrentOrgId(orgId)
    localStorage.setItem("retirement_pay_current_org_id", orgId)
  }

  const currentOrg = allOrgs.find((o) => o.id === currentOrgId) ?? allOrgs[0] ?? null

  return { currentOrg, allOrgs, loading, setCurrentOrg }
}
```

---

## 9. UserMenu Component

**File:** `src/components/layout/UserMenu.tsx`

Shows user email (truncated), avatar initials, sign-out button.

```tsx
import { LogOut, User } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"

export function UserMenu() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    toast.success("Signed out")
    navigate({ to: "/auth/sign-in" })
  }

  if (!user) return null

  const email = user.email ?? ""
  const fullName = user.user_metadata?.full_name as string | undefined
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : email.slice(0, 2).toUpperCase()

  return (
    <div className="flex items-center gap-2 px-2 py-2">
      {/* Avatar: colored circle with initials */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
        {initials}
      </div>

      {/* Email */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 truncate">
          {fullName ?? email}
        </p>
        {fullName && (
          <p className="text-xs text-gray-400 truncate">{email}</p>
        )}
      </div>

      {/* Sign out button */}
      <button
        onClick={handleSignOut}
        title="Sign out"
        aria-label="Sign out"
        className="flex-shrink-0 rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  )
}
```

---

## 10. SIGNED_OUT Redirect in AppShell

When `onAuthStateChange` fires `SIGNED_OUT` mid-session (e.g. token revoked on another device),
the `AppShell` must redirect to sign-in. This is handled in `AppShell.tsx`:

```tsx
// Inside AppShell component, add this effect:
import { useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "@tanstack/react-router"

// Inside AppShell():
const { session } = useAuth()
const navigate = useNavigate()

useEffect(() => {
  if (session === null) {
    // session was set (component mounted) then became null = signed out mid-session
    // The _authenticated beforeLoad already handles initial redirect.
    // This handles mid-session sign-out.
    navigate({ to: "/auth/sign-in" })
  }
}, [session, navigate])
```

**Note:** This effect intentionally skips the initial `null` state before `getSession` resolves
because `_authenticated.tsx` `beforeLoad` handles that case. The `useEffect` fires only when
`session` changes from a non-null value to `null` after mount.

To prevent double-redirect during initial load:

```tsx
// Refined version that avoids redirect on initial null:
const [wasAuthenticated, setWasAuthenticated] = useState(false)
const { session } = useAuth()
const navigate = useNavigate()

useEffect(() => {
  if (session) {
    setWasAuthenticated(true)
  } else if (wasAuthenticated && !session) {
    navigate({ to: "/auth/sign-in" })
  }
}, [session, wasAuthenticated, navigate])
```

---

## 11. Print Media Override

The NLRC worksheet page uses `@media print` to hide the sidebar and top bar:

```css
/* In apps/retirement-pay/frontend/src/index.css */
@media print {
  aside,
  header.mobile-topbar,
  .no-print {
    display: none !important;
  }

  main {
    padding-left: 0 !important;
  }
}
```

The `MobileTopBar` must have `className="... mobile-topbar"` so the print style targets it.

---

## 12. Required shadcn Components

| Component | Install Command | Used By |
|-----------|-----------------|---------|
| `sheet` | `npx shadcn@latest add sheet` | MobileDrawer |
| `dropdown-menu` | `npx shadcn@latest add dropdown-menu` | OrgSwitcher |
| `separator` | `npx shadcn@latest add separator` | Sidebar, MobileDrawer |

---

## 13. Nav Items Summary

| Label | Route | Icon | Active Strategy |
|-------|-------|------|-----------------|
| Dashboard | `/dashboard` | `LayoutDashboard` | Exact match |
| New Computation | `/compute/new` | `Plus` | Exact match |
| Batch Upload | `/batch/new` | `FileSpreadsheet` | Exact match |
| Organization | `/org` | `Building2` | Prefix match (`/org`) |
| Settings | `/settings` | `Settings` | Exact match |

**Not in sidebar (accessed via other navigation):**
- `/compute/$id/results` — accessed by clicking ComputationCard on dashboard
- `/compute/$id/nlrc` — accessed from results page actions
- `/compute/$id/edit` — accessed from results page actions
- `/batch/$id` — navigated to automatically after batch completion
- `/org/$orgId/*` — navigated to via OrgSwitcher or Settings > Organizations tab

---

## 14. Landing Page Navigation (Public)

The landing page (`/`) renders its own header — NOT the `AppShell`. This header:

```tsx
// Inside LandingPage.tsx header section
<header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
  <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
    <span className="text-base font-bold text-gray-900">RetirePay PH</span>
    <nav className="flex items-center gap-3">
      <Link
        to="/auth/sign-in"
        className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
      >
        Sign in
      </Link>
      <Link to="/auth/sign-up">
        <Button size="sm">Get Started</Button>
      </Link>
    </nav>
  </div>
</header>
```

No sidebar, no drawer — just a sticky top bar with logo + sign-in/sign-up CTAs.

---

## 15. Shared Results Page Navigation (Public)

The shared results page (`/share/$token`) renders a minimal public header:

```tsx
// Inside SharedResultsPage.tsx
<header className="border-b border-gray-200 bg-white px-4 py-3">
  <div className="max-w-3xl mx-auto flex items-center justify-between">
    <span className="text-sm font-bold text-gray-900">RetirePay PH</span>
    <Link to="/auth/sign-up">
      <Button size="sm" variant="outline">Create Free Account</Button>
    </Link>
  </div>
</header>
```

No sidebar. The sign-up CTA converts share viewers into users.

---

## Summary

The navigation system is three components working together:

1. **AppShell** — orchestrates desktop/mobile layout, owns mobile drawer open state, handles
   mid-session sign-out redirect
2. **Sidebar** (desktop) / **MobileDrawer** (mobile) — both render `NavLinks`, `OrgSwitcher`,
   `UserMenu` with identical structure
3. **NavLinks** — single source of truth for nav items; uses `useRouterState` for active states;
   closing mobile drawer on link click is handled by `onClick` on the `<nav>` wrapper

**OrgSwitcher** uses `useOrganization()` hook which reads from Supabase and caches current org
in `localStorage` key `retirement_pay_current_org_id`.

**UserMenu** shows initials avatar (no image upload), truncated email, sign-out icon button.
Sign-out calls `supabase.auth.signOut()`, shows toast, navigates to `/auth/sign-in`.

Required additional shadcn installs: `sheet`, `dropdown-menu`, `separator`.
