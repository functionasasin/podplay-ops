# design-layout-nav — AppLayout, Sidebar, Mobile Header Modernization

**Wave**: 3 — Design Modernization Audit
**Date**: 2026-03-04
**Source file**: `loops/inheritance-frontend-forward/app/src/components/layout/AppLayout.tsx`
**Design direction**: Navy (#1e3a5f) + Gold (#c5a44e) stays. Modernize everything else.

---

## Current State Inventory

### AppLayout.tsx — Full Component Analysis

```
File: app/src/components/layout/AppLayout.tsx
Lines: 97
```

**Sidebar (lines 27–57):**
- `className="hidden md:flex w-56 flex-col border-r bg-card no-print"`
- `bg-card` = #ffffff (WHITE sidebar — NOT using `--sidebar: #1e3a5f` tokens despite being defined in index.css)
- Width: `w-56` = 224px
- Logo area: `px-4 py-4` with Scale icon + "Inheritance" text + subtitle
- Nav items: loop over `navItems`, active = `variant='secondary'`, inactive = `variant='ghost'`
- No auth-conditional rendering anywhere
- No user/org info in sidebar footer
- No collapse toggle
- No transitions on nav items
- No left accent bar on active item
- No sign-out button

**navItems array (lines 13–19):**
```tsx
{ to: '/',          label: 'Dashboard',  icon: LayoutDashboard }
{ to: '/cases/new', label: 'New Case',   icon: FilePlus        }
{ to: '/clients',   label: 'Clients',    icon: Users           }
{ to: '/deadlines', label: 'Deadlines',  icon: CalendarClock   }
{ to: '/settings',  label: 'Settings',   icon: Settings        }
```
**MISSING**: No `/cases` (case list) link — users have no way to navigate to their cases list (confirmed broken in journey-return-visit: JRV-003).

**Mobile header (lines 61–90):**
- `className="md:hidden bg-primary text-primary-foreground shadow-md no-print"`
- Correct: navy background (`bg-primary` = #1e3a5f)
- Nav: horizontal scroll tab bar (`flex gap-1 px-2 py-1.5 overflow-x-auto`)
- Touch targets: `size="sm"` Button = 32px height → below 44px minimum
- No hamburger menu / drawer — just a scrollable tab row
- No sign-out in mobile nav
- Active: `variant='secondary'` → white background with navy text on navy bg → low contrast

**Main content (lines 92–94):**
- `<main className="flex-1">{children}</main>` — no padding, no max-width constraint
- Pages are fully responsible for their own padding

---

## Gaps Identified

### GAP-DLN-001 — Sidebar uses wrong background (CRITICAL)
**Current**: `bg-card` (#ffffff) — white sidebar
**Problem**: CSS tokens define `--sidebar: #1e3a5f` (navy), `--sidebar-foreground: #ffffff`, `--sidebar-accent: #2a4d7a`, etc. These are defined but never used. The sidebar renders white.
**Impact**: The legal-professional Navy branding is completely absent from the sidebar.

### GAP-DLN-002 — Active nav item has wrong active style (HIGH)
**Current**: `variant='secondary'` = `bg-secondary` (#f1f5f9) with navy text — works on white sidebar but is the wrong pattern
**Target**: Navy sidebar background with `bg-sidebar-accent (#2a4d7a)` fill + `border-left: 3px solid var(--accent)` gold accent bar

### GAP-DLN-003 — Hover state not styled for Navy sidebar (HIGH)
**Current**: Ghost variant hover = Tailwind default (`bg-accent/10` or similar)
**Target**: `rgba(255,255,255,0.08)` on navy, 100ms transition

### GAP-DLN-004 — No auth-conditional navigation (CRITICAL)
**Current**: Same nav shown to all users — no Sign In/Up for unauthenticated, no Sign Out for authenticated
**Impact**: Unauthenticated users see all nav items (confirmed: JNV-003 in journey-new-visitor). No way to sign out anywhere.
**Target**: Auth-aware sidebar:
- Unauthenticated: show only logo + "Sign In" link, hide workspace nav
- Authenticated: show full nav + user/org name in footer + Sign Out

### GAP-DLN-005 — Missing Cases list nav link (HIGH)
**Current**: navItems has no `/cases` route
**Impact**: No way to navigate to case list — confirmed JRV-003 / JFC-017
**Target**: Add `{ to: '/cases', label: 'Cases', icon: FolderOpen }` between Dashboard and New Case

### GAP-DLN-006 — No sidebar footer with user/org info (MEDIUM)
**Current**: Nav takes full height, no user section at bottom
**Target**: Bottom section with org name, user email, sign-out button (Linear pattern)

### GAP-DLN-007 — No collapse behavior on desktop sidebar (LOW)
**Current**: Fixed 224px width, no toggle
**Target**: Collapsible to 56px icon-only mode with label opacity transition and tooltips on hover

### GAP-DLN-008 — Mobile nav is a scrollable tab bar (HIGH)
**Current**: Horizontal `overflow-x-auto` Button row — poor UX, touch targets 32px
**Target**: Hamburger (☰) icon in header → Drawer slide-in from left with full nav list

### GAP-DLN-009 — Mobile active state illegible (HIGH)
**Current**: `variant='secondary'` on navy background = white button on navy = visible but no gold accent
**Target**: On navy mobile header, active = `bg-primary-foreground/20` + gold underline or left border

### GAP-DLN-010 — No transitions on any nav element (MEDIUM)
**Current**: Instant state changes on hover/active
**Target**: `transition: background-color 100ms ease-out, border-color 100ms ease-out` on all nav items

### GAP-DLN-011 — No sign-out in navigation (CRITICAL)
**Current**: No sign-out button anywhere in AppLayout
**Impact**: Users cannot sign out (confirmed JNV-003)
**Target**: Sign Out button in sidebar footer (desktop) and drawer (mobile)

---

## Modernization Proposals

### MOD-DLN-001: Switch Sidebar to Navy Background

**File**: `app/src/components/layout/AppLayout.tsx`

**Change**: Replace `bg-card` with `bg-sidebar` class on the `<aside>` element, and update all text/icon colors to use sidebar tokens.

**Current** (line 27):
```tsx
<aside className="hidden md:flex w-56 flex-col border-r bg-card no-print">
```

**Target**:
```tsx
<aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground no-print shadow-[var(--shadow-sidebar)]">
```

Changes:
- `bg-card` → `bg-sidebar` (applies `--sidebar: #1e3a5f`)
- `text-sidebar-foreground` (applies `--sidebar-foreground: #ffffff`)
- Remove `border-r` (navy sidebar has its own shadow separation, not a border)
- `w-56` → `w-64` (240px is the Linear standard for a sidebar with icon+label at comfortable density)
- Add `shadow-[var(--shadow-sidebar)]` (requires shadow token from index.css — see MOD-DLN-010)

**Logo area** (lines 28–38) — update text colors:
```tsx
<div className="px-4 py-5 flex items-center gap-2.5 border-b border-sidebar-border">
  <Scale className="h-5 w-5 text-sidebar-primary flex-shrink-0" />
  <div>
    <span className="text-sm font-bold tracking-tight font-serif text-sidebar-foreground">
      Inheritance
    </span>
    <p className="text-xs text-sidebar-foreground/60 mt-0.5">
      Philippine Succession Law
    </p>
  </div>
</div>
```

Changes:
- `text-primary` → `text-sidebar-primary` (gold #c5a44e on navy)
- `text-muted-foreground` → `text-sidebar-foreground/60` (white 60% opacity)
- Replace `<Separator />` with inline `border-b border-sidebar-border` on the div

**Result**: Sidebar renders with navy (#1e3a5f) background, gold Scale icon, white product name, white/60 subtitle — the professional legal look the design tokens intended.

---

### MOD-DLN-002: Active State — Gold Left Accent Bar

**File**: `app/src/components/layout/AppLayout.tsx`

Replace Button-based nav items with custom `<Link>` + `<div>` structure that supports the left-border accent pattern. The shadcn Button `variant='secondary'` and `variant='ghost'` are designed for light backgrounds and don't apply correctly on the navy sidebar.

**Current** (lines 41–55):
```tsx
<Link key={to} to={to}>
  <Button
    variant={isActive ? 'secondary' : 'ghost'}
    className="w-full justify-start gap-2 text-sm"
    size="sm"
  >
    <Icon className="h-4 w-4" />
    {label}
  </Button>
</Link>
```

**Target**:
```tsx
<Link
  key={to}
  to={to}
  className={[
    'group flex items-center gap-3 h-9 px-3 rounded-md text-sm',
    'transition-colors duration-100 ease-out',
    'border-l-[3px]',
    isActive
      ? 'bg-sidebar-accent border-sidebar-primary text-sidebar-foreground font-medium'
      : 'border-transparent text-sidebar-foreground/75 hover:bg-white/[0.08] hover:text-sidebar-foreground',
  ].join(' ')}
>
  <Icon className="h-4 w-4 flex-shrink-0" />
  <span>{label}</span>
</Link>
```

Changes:
- Remove `<Button>` wrapper — use direct link styling
- Active: `bg-sidebar-accent` (#2a4d7a) fill + `border-sidebar-primary` (#c5a44e) gold left border
- Hover: `bg-white/[0.08]` (rgba(255,255,255,0.08)) on navy = 8% white tint
- Text: `text-sidebar-foreground` (#ffffff) active, `text-sidebar-foreground/75` (75% white) inactive
- Height: `h-9` = 36px (Linear compact density)
- Transition: `transition-colors duration-100 ease-out`

**Nav container** (line 40): update class:
```tsx
<nav className="flex-1 px-3 py-3 space-y-0.5">
```
Change `px-2 py-3 space-y-1` → `px-3 py-3 space-y-0.5` for tighter, more modern density.

**Result**: Active nav item shows: `#2a4d7a` fill (medium navy) + 3px gold left border. Inactive items show at 75% white opacity. Hover adds subtle 8% white tint. All with 100ms transition.

---

### MOD-DLN-003: Add Cases Nav Link

**File**: `app/src/components/layout/AppLayout.tsx`

**Current** navItems (line 13–19):
```tsx
const navItems = [
  { to: '/' as const, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cases/new' as const, label: 'New Case', icon: FilePlus },
  { to: '/clients' as const, label: 'Clients', icon: Users },
  { to: '/deadlines' as const, label: 'Deadlines', icon: CalendarClock },
  { to: '/settings' as const, label: 'Settings', icon: Settings },
] as const;
```

**Target**:
```tsx
import { LayoutDashboard, FilePlus, FolderOpen, Users, CalendarClock, Settings, Scale } from 'lucide-react';

const navItems = [
  { to: '/' as const, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cases' as const, label: 'Cases', icon: FolderOpen },
  { to: '/cases/new' as const, label: 'New Case', icon: FilePlus },
  { to: '/clients' as const, label: 'Clients', icon: Users },
  { to: '/deadlines' as const, label: 'Deadlines', icon: CalendarClock },
  { to: '/settings' as const, label: 'Settings', icon: Settings },
] as const;
```

Changes:
- Add `FolderOpen` to lucide-react import
- Add `/cases` route item between Dashboard and New Case
- Note: `/cases` route also needs to be registered in the router (tracked separately in journey-return-visit gap JRV-002)

---

### MOD-DLN-004: Auth-Aware Sidebar with Footer Sign-Out

**File**: `app/src/components/layout/AppLayout.tsx`

Import `useAuth`:
```tsx
import { useAuth } from '@/hooks/useAuth';
```

Split navItems into main nav (requires auth) and settings:
```tsx
const mainNavItems = [
  { to: '/' as const, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cases' as const, label: 'Cases', icon: FolderOpen },
  { to: '/cases/new' as const, label: 'New Case', icon: FilePlus },
  { to: '/clients' as const, label: 'Clients', icon: Users },
  { to: '/deadlines' as const, label: 'Deadlines', icon: CalendarClock },
] as const;

const settingsNavItems = [
  { to: '/settings' as const, label: 'Settings', icon: Settings },
] as const;
```

Full sidebar structure with auth-conditional sections:
```tsx
export function AppLayout({ children }: { children: React.ReactNode }) {
  const matchRoute = useMatchRoute();
  const { user, signOut } = useAuth();

  const renderNavItem = (to: string, label: string, Icon: React.ElementType) => {
    const isActive = matchRoute({ to, fuzzy: true });
    return (
      <Link
        key={to}
        to={to}
        className={[
          'group flex items-center gap-3 h-9 px-3 rounded-md text-sm',
          'transition-colors duration-100 ease-out border-l-[3px]',
          isActive
            ? 'bg-sidebar-accent border-sidebar-primary text-sidebar-foreground font-medium'
            : 'border-transparent text-sidebar-foreground/75 hover:bg-white/[0.08] hover:text-sidebar-foreground',
        ].join(' ')}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground no-print shadow-[2px_0_8px_rgba(30,58,95,0.15)]">
        {/* Logo */}
        <div className="px-4 py-5 flex items-center gap-2.5 border-b border-sidebar-border">
          <Scale className="h-5 w-5 text-sidebar-primary flex-shrink-0" />
          <div>
            <span className="text-sm font-bold tracking-tight font-serif text-sidebar-foreground">
              Inheritance
            </span>
            <p className="text-xs text-sidebar-foreground/60 mt-0.5">
              Philippine Succession Law
            </p>
          </div>
        </div>

        {/* Main nav (only shown when authenticated) */}
        {user ? (
          <nav className="flex-1 px-3 py-3 space-y-0.5">
            {mainNavItems.map(({ to, label, icon: Icon }) =>
              renderNavItem(to, label, Icon)
            )}
            <div className="h-px bg-sidebar-border my-2" />
            {settingsNavItems.map(({ to, label, icon: Icon }) =>
              renderNavItem(to, label, Icon)
            )}
          </nav>
        ) : (
          <nav className="flex-1 px-3 py-3">
            <Link
              to="/auth"
              className="flex items-center gap-3 h-9 px-3 rounded-md text-sm border-l-[3px] border-transparent text-sidebar-foreground/75 hover:bg-white/[0.08] hover:text-sidebar-foreground transition-colors duration-100"
            >
              <LogIn className="h-4 w-4 flex-shrink-0" />
              <span>Sign In</span>
            </Link>
          </nav>
        )}

        {/* Footer: org name + sign out (only authenticated) */}
        {user && (
          <div className="border-t border-sidebar-border px-3 py-3 space-y-1">
            <div className="px-3 py-1">
              <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="group flex items-center gap-3 h-9 px-3 w-full rounded-md text-sm border-l-[3px] border-transparent text-sidebar-foreground/75 hover:bg-white/[0.08] hover:text-sidebar-foreground transition-colors duration-100 ease-out"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </aside>

      {/* ... rest of layout */}
    </div>
  );
}
```

Add to lucide-react imports: `LogIn`, `LogOut`.

**Result**: Unauthenticated users see logo + Sign In link only. Authenticated users see full nav with divider before Settings, and a footer with their email + Sign Out.

---

### MOD-DLN-005: Replace Mobile Tab Bar with Hamburger + Drawer

**File**: `app/src/components/layout/AppLayout.tsx`

**Current mobile header (lines 61–90)**: Horizontal scroll tab bar — poor UX at small sizes, touch targets 32px.

**Target**: Standard mobile drawer pattern.

Add state at component top:
```tsx
const [drawerOpen, setDrawerOpen] = React.useState(false);
```

**Mobile header** (replaces lines 61–90):
```tsx
{/* Mobile header */}
<header className="md:hidden bg-sidebar text-sidebar-foreground no-print">
  <div className="h-14 px-4 flex items-center justify-between border-b border-sidebar-border">
    <div className="flex items-center gap-2">
      <Scale className="h-5 w-5 text-sidebar-primary" />
      <span className="text-sm font-bold tracking-tight font-serif">Inheritance</span>
    </div>
    <button
      onClick={() => setDrawerOpen(true)}
      aria-label="Open navigation"
      className="p-2 rounded-md text-sidebar-foreground/75 hover:bg-white/[0.08] transition-colors duration-100"
    >
      <Menu className="h-5 w-5" />
    </button>
  </div>
</header>

{/* Mobile drawer overlay */}
{drawerOpen && (
  <div className="md:hidden fixed inset-0 z-50 flex">
    {/* Backdrop */}
    <div
      className="absolute inset-0 bg-black/40"
      onClick={() => setDrawerOpen(false)}
    />
    {/* Drawer panel */}
    <div className="relative w-72 bg-sidebar text-sidebar-foreground flex flex-col shadow-xl animate-in slide-in-from-left duration-200">
      {/* Drawer header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-sidebar-primary" />
          <span className="text-sm font-bold tracking-tight font-serif">Inheritance</span>
        </div>
        <button
          onClick={() => setDrawerOpen(false)}
          aria-label="Close navigation"
          className="p-2 rounded-md text-sidebar-foreground/75 hover:bg-white/[0.08] transition-colors duration-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Drawer nav */}
      {user ? (
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {mainNavItems.map(({ to, label, icon: Icon }) => {
            const isActive = matchRoute({ to, fuzzy: true });
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setDrawerOpen(false)}
                className={[
                  'flex items-center gap-3 h-11 px-3 rounded-md text-sm border-l-[3px]',
                  'transition-colors duration-100 ease-out',
                  isActive
                    ? 'bg-sidebar-accent border-sidebar-primary text-sidebar-foreground font-medium'
                    : 'border-transparent text-sidebar-foreground/75 hover:bg-white/[0.08] hover:text-sidebar-foreground',
                ].join(' ')}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
          <div className="h-px bg-sidebar-border my-2" />
          {settingsNavItems.map(({ to, label, icon: Icon }) => {
            const isActive = matchRoute({ to, fuzzy: true });
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setDrawerOpen(false)}
                className={[
                  'flex items-center gap-3 h-11 px-3 rounded-md text-sm border-l-[3px]',
                  'transition-colors duration-100 ease-out',
                  isActive
                    ? 'bg-sidebar-accent border-sidebar-primary text-sidebar-foreground font-medium'
                    : 'border-transparent text-sidebar-foreground/75 hover:bg-white/[0.08] hover:text-sidebar-foreground',
                ].join(' ')}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      ) : (
        <nav className="flex-1 px-3 py-3">
          <Link
            to="/auth"
            onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-3 h-11 px-3 rounded-md text-sm border-l-[3px] border-transparent text-sidebar-foreground/75 hover:bg-white/[0.08] hover:text-sidebar-foreground transition-colors duration-100"
          >
            <LogIn className="h-5 w-5 flex-shrink-0" />
            <span>Sign In</span>
          </Link>
        </nav>
      )}

      {/* Drawer footer */}
      {user && (
        <div className="border-t border-sidebar-border px-3 py-3">
          <div className="px-3 py-1 mb-1">
            <p className="text-xs text-sidebar-foreground/60 truncate">{user.email}</p>
          </div>
          <button
            onClick={() => { signOut(); setDrawerOpen(false); }}
            className="flex items-center gap-3 h-11 px-3 w-full rounded-md text-sm border-l-[3px] border-transparent text-sidebar-foreground/75 hover:bg-white/[0.08] hover:text-sidebar-foreground transition-colors duration-100 ease-out"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  </div>
)}
```

Add to lucide-react imports: `Menu`, `X`.
Add to React imports: `React.useState`.

Mobile drawer touch targets: `h-11` = 44px (meets WCAG 2.5.5 minimum).

**Result**: Mobile has a compact 56px navy header with Scale logo + hamburger. Tap ☰ → drawer slides in from left with full nav, correct active states, Sign Out, user email. Tap backdrop or ✕ to close.

---

### MOD-DLN-006: Add Shadow Token to index.css

The sidebar shadow `2px 0 8px rgba(30,58,95,0.15)` is referenced in MOD-DLN-001 and MOD-DLN-005 as an inline value. Add it as a CSS token.

**File**: `app/src/index.css`

Add to `:root` block (after `--sidebar-ring: #c5a44e;`):
```css
/* Shadow scale */
--shadow-xs:  0 1px 2px rgba(0,0,0,0.06);
--shadow-sm:  0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md:  0 4px 8px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
--shadow-lg:  0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.04);
--shadow-xl:  0 16px 48px rgba(0,0,0,0.14), 0 8px 16px rgba(0,0,0,0.06);
--shadow-sidebar: 2px 0 8px rgba(30, 58, 95, 0.15);

/* Animation scale */
--duration-fast:    100ms;
--duration-default: 200ms;
--duration-slow:    300ms;
--duration-page:    400ms;
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-out: cubic-bezier(0.0, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);

/* Skeleton */
--skeleton-base: #e2e8f0;
--skeleton-highlight: #f1f5f9;
```

Also add skeleton animation and reduced-motion override to the `@layer base` block:
```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-sans);
  }

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
}
```

---

### MOD-DLN-007: Full navItems Lucide Import List

**File**: `app/src/components/layout/AppLayout.tsx`

Replace current imports (lines 2–9):
```tsx
import {
  LayoutDashboard,
  FilePlus,
  FolderOpen,
  Users,
  CalendarClock,
  Settings,
  Scale,
  LogIn,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
```

Remove: `Separator` import (no longer needed — replaced by inline `border-b` and `h-px bg-sidebar-border`).
Remove: `Button` import (no longer used in sidebar/mobile nav).

---

## Summary of All Changes

### File: `app/src/components/layout/AppLayout.tsx`

| Change | Gap Fixed | Priority |
|--------|-----------|----------|
| Switch `<aside>` to `bg-sidebar` (navy) | GAP-DLN-001 | Critical |
| Active nav: `bg-sidebar-accent` + `border-l-[3px] border-sidebar-primary` (gold) | GAP-DLN-002 | High |
| Hover nav: `hover:bg-white/[0.08]` with 100ms transition | GAP-DLN-003 | High |
| Add `useAuth` + auth-conditional nav rendering | GAP-DLN-004 | Critical |
| Add `/cases` link with `FolderOpen` icon | GAP-DLN-005 | High |
| Add sidebar footer: user email + Sign Out button | GAP-DLN-006 | Medium |
| Replace mobile tab bar with hamburger + drawer | GAP-DLN-008 | High |
| Mobile active state on nav items (same as desktop) | GAP-DLN-009 | High |
| All transitions: `duration-100 ease-out` | GAP-DLN-010 | Medium |
| Sign Out in sidebar footer + drawer footer | GAP-DLN-011 | Critical |
| Update lucide imports (add: FolderOpen, LogIn, LogOut, Menu, X) | — | Required |
| Remove Button + Separator imports (no longer used in nav) | — | Cleanup |

### File: `app/src/index.css`

| Change | Gap Fixed | Priority |
|--------|-----------|----------|
| Add shadow scale tokens | MOD-DLN-006 | Medium |
| Add animation/duration tokens | MOD-DLN-006 | Medium |
| Add skeleton token + @keyframes shimmer | MOD-DLN-006 | Medium |
| Add `@media (prefers-reduced-motion: reduce)` | MOD-DLN-006 | Medium |

---

## Before / After Visual Comparison

### Desktop Sidebar — Before
```
┌─────────────────────┐
│  ⚖ Inheritance      │  ← white background, navy logo
│  Philippine Succ.   │
│ ─────────────────── │
│ [📋 Dashboard    ]  │  ← white Button, slate-100 when active
│ [+ New Case      ]  │
│ [👥 Clients      ]  │
│ [🗓 Deadlines    ]  │
│ [⚙ Settings     ]  │
└─────────────────────┘
No auth awareness. No sign out.
```

### Desktop Sidebar — After
```
┌─────────────────────┐
│  ⚖ Inheritance      │  ← navy (#1e3a5f) bg, white text, gold icon
│  Philippine Succ.   │
│ ─────────────────── │  ← sidebar-border divider
│|📋 Dashboard        │  ← active: navy-accent bg + gold left bar
│ 📂 Cases           │  ← new item
│ + New Case         │  ← 75% white text
│ 👥 Clients         │
│ 🗓 Deadlines       │
│ ─────────────────── │
│ ⚙ Settings        │
│ ─────────────────── │  ← footer divider
│ user@firm.com       │  ← user email, 60% white
│ [↩ Sign Out]       │  ← hover: 8% white tint
└─────────────────────┘
```

### Mobile Header — Before
```
┌────────────────────────────────────────────────┐
│  Inheritance Calculator                         │  ← 56px navbar
│  Philippine Succession Law Engine               │
│─────────────────────────────────────────────── │
│ [📋 Dash] [+ New] [👥 Clients] [🗓 Dead] [⚙] │  ← scrollable 32px button row
└────────────────────────────────────────────────┘
```

### Mobile Header — After
```
┌─────────────────────────────────────┐
│  ⚖ Inheritance              [☰]    │  ← 56px, navy, hamburger right
└─────────────────────────────────────┘
       (tap ☰) → drawer slides in:
┌──────────────────────┐ ░░░░░░░░░░
│  ⚖ Inheritance   [✕]│ ░ (dark  ░
│ ──────────────────── │ ░  overlay░
│|📋 Dashboard         │ ░) tap to ░
│ 📂 Cases            │ ░  close  ░
│ + New Case          │ ░░░░░░░░░░
│ 👥 Clients          │
│ 🗓 Deadlines        │
│ ──────────────────── │
│ ⚙ Settings         │
│ ──────────────────── │
│ user@firm.com        │
│ [↩ Sign Out]        │
└──────────────────────┘
44px touch targets throughout
```
