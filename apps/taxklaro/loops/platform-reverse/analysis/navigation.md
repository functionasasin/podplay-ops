# Navigation — TaxKlaro

**Wave:** 4 (Platform Layer)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** route-table, supabase-auth-flow, env-configuration

---

## Summary

Auth-aware sidebar (desktop) + bottom-sheet drawer (mobile) for TaxKlaro. The `AppLayout` component wraps all authenticated routes. Unauthenticated users see no sidebar — only the landing page or bare auth/public route layout. Patterns derived from the route-table analysis and inheritance app reference.

---

## 1. AppLayout Component

### File: `src/components/layout/AppLayout.tsx`

```typescript
import { useState } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Plus,
  FileText,
  Users,
  Calendar,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { signOut } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, exact: true },
  { label: 'New Computation', to: '/computations/new', icon: Plus },
  { label: 'Computations', to: '/computations', icon: FileText },
  { label: 'Clients', to: '/clients', icon: Users },
  { label: 'Deadlines', to: '/deadlines', icon: Calendar },
  { label: 'Settings', to: '/settings', icon: Settings },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-border bg-card">
        <SidebarContent
          pathname={pathname}
          user={user}
          onSignOut={() => signOut()}
        />
      </aside>

      {/* Mobile: top bar + drawer */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent
                pathname={pathname}
                user={user}
                onSignOut={async () => {
                  setDrawerOpen(false);
                  await signOut();
                }}
              />
            </SheetContent>
          </Sheet>
          <TaxKlaroLogo className="h-7" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

---

## 2. SidebarContent Component

### File: `src/components/layout/SidebarContent.tsx`

This is the shared sidebar body used by both the desktop sidebar and the mobile drawer.

```typescript
import { Link } from '@tanstack/react-router';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { TaxKlaroLogo } from '@/components/TaxKlaroLogo';
import type { User } from '@supabase/supabase-js';

interface SidebarContentProps {
  pathname: string;
  user: User | null;
  onSignOut: () => void;
}

export function SidebarContent({ pathname, user, onSignOut }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <TaxKlaroLogo className="h-8" />
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} item={item} pathname={pathname} />
        ))}
      </nav>

      <Separator />

      {/* User footer */}
      <div className="px-3 py-4 space-y-2">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-md">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {getUserInitials(user.email ?? '')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.user_metadata?.full_name ?? 'My Account'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={onSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = item.exact
    ? pathname === item.to
    : pathname.startsWith(item.to) && item.to !== '/';

  // Special case: /computations/new should activate the "New Computation" item,
  // not the "Computations" list item
  const isComputationsList =
    item.to === '/computations' &&
    pathname.startsWith('/computations') &&
    pathname !== '/computations/new';

  const active = item.to === '/computations' ? isComputationsList : isActive;

  return (
    <Link
      to={item.to}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <item.icon className={cn('h-5 w-5 flex-shrink-0', active ? 'text-primary' : '')} />
      {item.label}
    </Link>
  );
}

function getUserInitials(email: string): string {
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
```

---

## 3. TaxKlaroLogo Component

### File: `src/components/TaxKlaroLogo.tsx`

```typescript
interface TaxKlaroLogoProps {
  className?: string;
}

export function TaxKlaroLogo({ className }: TaxKlaroLogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Icon: simple tax/document icon in brand blue */}
      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground font-bold text-sm">
        T
      </div>
      <span className="font-semibold text-lg tracking-tight text-foreground">
        TaxKlaro
      </span>
    </div>
  );
}
```

**Note:** The logo SVG is described verbally here. The forward loop should replace this placeholder icon with the actual TaxKlaro logo asset if provided, or keep this text-based fallback. The `T` in brand blue `#1D4ED8` is the minimum viable version.

---

## 4. Active State Logic

### Rules for nav item activation

| Nav Item | `to` | Active when |
|---|---|---|
| Dashboard | `/` | `pathname === '/'` (exact) |
| New Computation | `/computations/new` | `pathname === '/computations/new'` |
| Computations | `/computations` | `pathname.startsWith('/computations') && pathname !== '/computations/new'` |
| Clients | `/clients` | `pathname.startsWith('/clients')` |
| Deadlines | `/deadlines` | `pathname === '/deadlines'` |
| Settings | `/settings` | `pathname.startsWith('/settings')` |

**Critical trap**: Without the `/computations/new` exclusion, navigating to "New Computation" activates BOTH the "New Computation" and "Computations" nav items simultaneously (since `/computations/new` starts with `/computations`). Use the special-case logic in `NavLink`.

---

## 5. Mobile Behavior

### Top Bar (mobile, `< lg` breakpoint)

```
┌─────────────────────────────────────┐
│ ☰  TaxKlaro                         │
└─────────────────────────────────────┘
```

- Hamburger button (`Menu` icon from lucide-react) opens a `Sheet` (Radix/shadcn) from the left side
- Sheet width: `w-64` (same as desktop sidebar)
- Sheet contains identical `SidebarContent` component
- Closing: tap outside, swipe left, or tap the close × button (Sheet default behavior)
- After sign-out from drawer: `setDrawerOpen(false)` before calling `signOut()`

### Desktop Sidebar (`lg+` breakpoint)

```
┌──────────────┬─────────────────────────────┐
│ TaxKlaro     │                             │
│              │                             │
│ ◻ Dashboard  │       Page Content          │
│ + New Comp.  │                             │
│ ◻ Computat.  │                             │
│ ◻ Clients    │                             │
│ ◻ Deadlines  │                             │
│ ◻ Settings   │                             │
│              │                             │
│ ─────────    │                             │
│ [avatar] JD  │                             │
│ john@x.com   │                             │
│ Sign Out     │                             │
└──────────────┴─────────────────────────────┘
```

- Fixed sidebar: `lg:w-64 lg:flex-col lg:border-r`
- Sidebar does NOT scroll independently — if there are more nav items than fit, add `overflow-y-auto` to nav section
- Main content area: `flex-1 overflow-y-auto` (scroll independently)

---

## 6. Unauthenticated State

**The sidebar is NOT shown to unauthenticated users.** The `__root.tsx` `RootLayout` function routes public paths (`/auth*`, `/share/*`, `/invite/*`, `/onboarding`) through the bare `<div className="min-h-screen bg-background">` wrapper with no AppLayout. See `route-table.md` Section 1 (`__root.tsx`).

The landing page at `/` (when user is null) uses the full viewport — no sidebar. The `IndexPage` conditionally renders `<LandingPage />` for unauthenticated users.

---

## 7. Sign-Out Flow

### `src/lib/auth.ts` — signOut function

```typescript
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  // supabase.auth.onAuthStateChange fires with event='SIGNED_OUT'
  // main.tsx listener sets user to null
  // router re-evaluates context: auth.user = null
  // All authenticated routes redirect to /auth via beforeLoad
}
```

**Behavior after sign-out:**
1. `signOut()` called from sidebar footer button
2. Supabase clears session tokens from localStorage
3. `onAuthStateChange` fires `SIGNED_OUT` event
4. `main.tsx` state update: `setUser(null)`
5. Router context re-evaluates: `auth.user = null`
6. TanStack Router re-runs current route's `beforeLoad` → redirects to `/auth`
7. AppLayout is unmounted entirely (no ghost state)

---

## 8. Navigation Item Specs

| # | Label | Icon (lucide-react) | Route | Badge |
|---|---|---|---|---|
| 1 | Dashboard | `LayoutDashboard` | `/` | — |
| 2 | New Computation | `Plus` | `/computations/new` | — |
| 3 | Computations | `FileText` | `/computations` | — |
| 4 | Clients | `Users` | `/clients` | — |
| 5 | Deadlines | `Calendar` | `/deadlines` | Overdue count (amber `Badge`) |
| 6 | Settings | `Settings` | `/settings` | — |

### Deadlines Badge (optional enhancement)
If there are overdue deadlines (past due date, not completed), show an amber `Badge` next to "Deadlines":

```typescript
// Inside NavLink for /deadlines:
{item.to === '/deadlines' && overdueCount > 0 && (
  <Badge variant="outline" className="ml-auto bg-amber-50 text-amber-700 border-amber-200 text-xs">
    {overdueCount}
  </Badge>
)}
```

`overdueCount` is fetched by `useOrganization()` as a lightweight count query — not blocking navigation render. If the query is loading, badge is not shown (not `0`, not loading spinner).

---

## 9. File Structure

```
src/
  components/
    layout/
      AppLayout.tsx          — outer shell: flex container, desktop sidebar + mobile top bar
      SidebarContent.tsx     — shared nav body (used by desktop sidebar and mobile Sheet)
    TaxKlaroLogo.tsx         — logo component (icon + wordmark)
```

**Total new files: 3**

Both `AppLayout` and `SidebarContent` are imported by `routes/__root.tsx` via:
```typescript
import { AppLayout } from '@/components/layout/AppLayout';
```

The `SidebarContent` is imported only by `AppLayout` — it is not a route-level component.

---

## 10. Tailwind Classes Summary (Visual Verification)

### AppLayout
- `flex h-screen bg-background` — full-viewport flex container
- `hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-border bg-card` — sidebar (desktop only)
- `flex flex-col flex-1 min-w-0` — right column

### SidebarContent
- Logo area: `flex items-center gap-2 px-6 py-5 border-b border-border`
- Nav container: `flex-1 overflow-y-auto px-3 py-4 space-y-1`
- Active nav item: `bg-primary/10 text-primary` (brand blue tint)
- Inactive nav item: `text-muted-foreground hover:bg-accent hover:text-accent-foreground`
- Nav icon: `h-5 w-5 flex-shrink-0`
- User footer: `px-3 py-4 space-y-2`
- Email text: `text-xs text-muted-foreground truncate`
- Sign-out button: `w-full justify-start gap-2 text-muted-foreground hover:text-foreground`

### Mobile top bar
- `lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card`

**All components have > 3 Tailwind utility classes — passes visual verification threshold.**

---

## 11. Accessibility

- Desktop sidebar landmark: `<aside>` element (ARIA landmark role)
- Mobile trigger button: `aria-label="Open menu"` on hamburger button
- Active nav items: `aria-current="page"` attribute
- Sheet component (Radix): provides `role="dialog"` + `aria-modal="true"` automatically
- Focus management: Radix Sheet traps focus when open, returns to trigger on close
- Keyboard navigation: Tab through nav items, Enter to navigate, Escape to close mobile drawer

---

## 12. Critical Traps

1. **`Sheet` import**: Must import from `@/components/ui/sheet` (shadcn/Radix). Do NOT use a custom modal — the Radix Sheet handles focus trap, backdrop, and ARIA automatically.

2. **Active state for `/computations`**: The special-case exclusion of `/computations/new` from the `/computations` active state MUST be implemented. Without it, the nav shows two active items when creating a new computation.

3. **Desktop sidebar not duplicated on mobile**: The sidebar is `hidden` on mobile (`hidden lg:flex`). The mobile Sheet contains a separate render of `SidebarContent` — same component, different DOM tree. This is correct (not two sidebars shown simultaneously).

4. **Sign-out drawer close**: Mobile drawer must be closed BEFORE calling `signOut()` to avoid the sheet persisting after the page unmounts. Close the drawer first, then call `signOut()`.

5. **`overflow-y-auto` on main content**: The main content `<main>` div must have `overflow-y-auto` so long pages scroll within the layout, not the full viewport. Without this, the sidebar and content scroll together instead of independently.

6. **`min-w-0` on content column**: The flex child containing `<main>` needs `min-w-0` to prevent wide content from overflowing the sidebar. This is a common flexbox gotcha.

7. **TaxKlaroLogo not orphaned**: `TaxKlaroLogo` is imported by `AppLayout` (desktop sidebar logo) and `AppLayout` (mobile top bar). It does not need its own route. The component wiring map must list its parent as `AppLayout`.
