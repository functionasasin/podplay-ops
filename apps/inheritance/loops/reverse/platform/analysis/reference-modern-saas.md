# reference-modern-saas — Modern SaaS Dashboard Patterns

**Wave**: 1 — Source Acquisition
**Date**: 2026-03-04
**Sources**: Linear, Vercel, Cal.com (web research + pattern synthesis)

---

## Design Direction Constraint

> Navy (#1e3a5f) + Gold (#c5a44e) palette stays. Everything else modernizes.

Existing design tokens (from `app/src/index.css`):
- `--primary: #1e3a5f` — deep navy (buttons, sidebar bg, primary actions)
- `--accent: #c5a44e` — warm gold (highlights, CTAs, active states)
- `--sidebar-accent: #2a4d7a` — medium navy (hover, secondary sidebar items)
- `--background: #f8fafc` — slate-50 (page background)
- `--card: #ffffff` — card surfaces
- `--border: #e2e8f0` — slate-200 (card/input borders)
- `--muted-foreground: #64748b` — slate-500 (secondary text)
- `--font-sans: Inter Variable` — primary typeface
- `--radius: 0.625rem` — default corner radius

These tokens are already well-designed. Modernization means adding **missing layers**:
shadow tokens, animation tokens, skeleton shimmer, and motion standards.

---

## 1. Linear — Sidebar Navigation Patterns

### What Linear Does Well

**Sidebar structure (240–280px expanded, 48–64px collapsed):**
- Two-tier hierarchy: workspace section (top) → project/team sections (scrollable middle) → account section (bottom)
- Section headers in small caps, muted color, 11–12px font
- Nav items: 36px height, 8px horizontal padding, 12px icon, 14px label, 4px gap
- Active state: navy background fill (in our case: `--sidebar-accent: #2a4d7a`)
- Hover state: slightly lighter fill, 150ms ease transition
- Icons: 16×16 line-style, visually consistent weight

**Collapse behavior:**
```css
.sidebar {
  width: 240px;
  transition: width 200ms cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.sidebar.collapsed {
  width: 56px;
}
.sidebar-label {
  opacity: 1;
  transition: opacity 150ms ease;
}
.sidebar.collapsed .sidebar-label {
  opacity: 0;
  pointer-events: none;
}
```

**Tooltip in collapsed state:** When collapsed, hovering any icon shows a tooltip (`role="tooltip"`) with the nav item label. Use `data-tooltip` attribute + CSS absolute positioning at `left: 100%`.

**Auth-aware sections in sidebar:**
- Unauthenticated: show only "Sign In" link + product logo; hide all workspace nav
- Authenticated: show full nav with user avatar, org name, sign-out in footer section

**Pattern for our app (sidebar):**
- Keep `--sidebar: #1e3a5f` as sidebar background
- Active: `background: #2a4d7a` (sidebar-accent) with left `3px solid #c5a44e` border accent
- Hover: `background: rgba(255,255,255,0.08)`
- Transition: `background-color 150ms ease, border-color 150ms ease`
- Collapsed: icon-only at 56px width, labels fade out, tooltips appear

### Key Linear Patterns to Adopt

| Pattern | Description | Implementation |
|---------|-------------|----------------|
| Keyboard-first nav | `⌘K` command palette | Can add later; not in current scope |
| Compact density | 36px nav item height, 12px section padding | CSS: `height: 36px; padding: 0 12px` |
| Section dividers | 1px border between sidebar sections | `border-top: 1px solid var(--sidebar-border)` |
| Icon + label fade | Label fades on collapse, icon stays | `opacity` transition 150ms |
| Active left accent | 3px gold bar on active item left edge | `border-left: 3px solid var(--accent)` |

---

## 2. Vercel — Card Patterns and Status Indicators

### Card Design

Vercel cards use a consistent pattern:
- White background (`--card: #ffffff`)
- 1px border (`border: 1px solid var(--border)`)
- Subtle shadow: `box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)`
- 10px border radius (`border-radius: 10px` — close to our `--radius-lg`)
- Internal padding: 20–24px
- Header row: label left, action right (e.g., "Recent Cases" + "View All →")
- Content density: 16px gap between rows within a card

**Hover on clickable cards:**
```css
.card-interactive {
  transition: box-shadow 150ms ease, transform 150ms ease;
  cursor: pointer;
}
.card-interactive:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.06);
  transform: translateY(-1px);
}
```

### Status Indicators

Vercel uses compact status badges:
- Dot + label pattern: 8px circle + 12px text
- Semantic colors: green (active/complete), amber (pending/warning), red (error/failed), slate (draft)

For our inheritance app (mapped to our palette):
```css
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}
.status-active   { background: #dcfce7; color: #166534; }  /* success colors */
.status-draft    { background: #f1f5f9; color: #64748b; }  /* muted */
.status-warning  { background: #fef3c7; color: #92400e; }  /* warning colors */
.status-error    { background: #fee2e2; color: #991b1b; }  /* destructive colors */
```

### KPI Card Pattern (for dashboard)

```
┌─────────────────────────────────┐
│ Active Cases          [+New →]  │
│ ─────────────────────────────── │
│  12                             │
│  ↑ 3 since last week            │
└─────────────────────────────────┘
```
- Metric: 32px semibold, navy (`#1e3a5f`)
- Delta: 13px, green or red depending on direction
- Label: 12px uppercase muted, `letter-spacing: 0.05em`
- Action link: 13px, gold (`#c5a44e`), hover underline

### Deployment Flow → Adapted as Case Wizard Progress

Vercel's deployment status flow maps directly to a case wizard progress indicator:
- Step list on left (desktop) or stepper top (mobile)
- Active step: navy background, white text
- Completed step: gold checkmark indicator, full opacity
- Pending step: muted foreground, reduced opacity (0.5)
- Current step highlighted with left accent bar or underline

---

## 3. Cal.com — Onboarding Wizard and Settings Pages

### Onboarding Wizard Pattern

Cal.com's onboarding follows a 4–5 step wizard:
1. Identity (name, timezone)
2. Connections (calendar, integrations)
3. Availability (schedule setup)
4. Profile (bio, photo, booking link)
5. Completion (launch page)

**Wizard container:**
```
┌──────────────────────────────────────────────┐
│  [Step 1 ●] [Step 2 ○] [Step 3 ○] [Step 4 ○] │  ← stepper top
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Card content for current step        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [← Back]                      [Continue →] │  ← action row
└──────────────────────────────────────────────┘
```

**Pattern for our first-time user onboarding (post sign-up):**
- Step 1: Firm profile (name, address)
- Step 2: First case creation prompt
- Step 3: Tutorial or demo case option

**Wizard step indicator CSS:**
```css
.stepper-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--border);        /* inactive */
  transition: background 200ms ease, width 200ms ease;
}
.stepper-dot.active {
  width: 24px;
  border-radius: 4px;
  background: var(--accent);        /* gold bar for active */
}
.stepper-dot.completed {
  background: var(--primary);       /* navy for completed */
}
```

### Settings Pages Pattern

Cal.com settings use a two-column layout:
- Left: settings nav list (categories: Profile, Calendar, Teams, Billing, etc.)
- Right: settings content panel (form or table)

**For our settings:**
- `/settings/profile` — Firm profile form
- `/settings/team` — Team members table + invite button
- `/settings/billing` — (Future: premium)

**Settings nav pattern:**
```
┌──────────────┬──────────────────────────────────┐
│ Profile      │  Firm Profile                    │
│ Team ●       │  ─────────────────────────────── │
│ Billing      │  [form content]                  │
│ Security     │                                  │
└──────────────┴──────────────────────────────────┘
```
Active item in left nav: `background: var(--secondary)` + `border-left: 2px solid var(--primary)`.

---

## 4. Loading States — Skeleton Pattern

Based on Carbon Design System + SaaS best practices:

### When to Show Skeletons
- Initial page load with async data (case list, dashboard stats)
- After navigation to a data-heavy route
- NOT for: modals (show spinner instead), short < 300ms operations, toast notifications

### Skeleton Shimmer Implementation

```css
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #e2e8f0 25%,          /* --border color */
    #f1f5f9 50%,          /* --secondary color */
    #e2e8f0 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}
```

### Skeleton Components Needed

| Component | Skeleton Pattern |
|-----------|-----------------|
| Case list row | `h-16 w-full` rect with inner `h-4 w-48` text line + `h-3 w-32` sub-line |
| Dashboard KPI card | `h-24 w-full` with inner `h-8 w-16` number + `h-3 w-24` label |
| Case wizard step | `h-4 w-3/4` title + three `h-16` input blocks |
| Results panel | `h-64 w-full` large block |
| Sidebar org name | `h-4 w-32` text rect |

### Page-Level Loading

For full-page loads (route transitions):
- Use a 2px progress bar at the very top of the viewport (like Linear/GitHub)
- Color: `--accent` (#c5a44e)
- Animated left-to-right fill over 300–600ms

```css
.page-loader {
  position: fixed; top: 0; left: 0; right: 0;
  height: 2px;
  background: var(--accent);
  animation: page-load 600ms ease-in-out forwards;
  z-index: 9999;
}
@keyframes page-load {
  from { transform: scaleX(0); transform-origin: left; }
  to   { transform: scaleX(1); transform-origin: left; }
}
```

---

## 5. Empty States — Pattern Catalog

### Three Empty State Types (adapted for our app)

**Type A — First Use (onboarding empty state)**
> The user has signed in but has no cases yet.
```
     🏛️  (icon or SVG illustration, 64×64, navy stroke)
     No cases yet
     Create your first inheritance case to get started.
     [+ Create Case]        ← primary button, navy bg
```

**Type B — No Results (search/filter empty state)**
> User searched or filtered and got nothing.
```
     🔍  (magnifying glass icon, 48×48, muted)
     No cases found
     Try adjusting your search or filters.
     [Clear filters]        ← ghost button
```

**Type C — Error / Unavailable**
> Data failed to load.
```
     ⚠️  (warning icon, 48×48, amber)
     Couldn't load cases
     There was a problem loading your data.
     [Try again]            ← ghost button
```

### Empty State CSS Structure

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  gap: 12px;
}
.empty-state-icon {
  color: var(--muted-foreground);
  opacity: 0.5;
  margin-bottom: 4px;
}
.empty-state-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--foreground);
}
.empty-state-description {
  font-size: 14px;
  color: var(--muted-foreground);
  max-width: 280px;
}
```

---

## 6. Animation / Transition Standards

Derived from Linear + modern SaaS analysis:

### Timing Scale

| Name | Duration | Easing | Use Case |
|------|----------|--------|----------|
| `--duration-instant` | 0ms | — | No animation (reduced motion) |
| `--duration-fast` | 100ms | `ease-out` | Hover bg, border color, shadow |
| `--duration-default` | 200ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Sidebar collapse, card expand |
| `--duration-slow` | 300ms | `cubic-bezier(0.4, 0, 0.2, 1)` | Modal enter/exit, page transition |
| `--duration-page` | 400ms | `ease-in-out` | Route transitions, wizard step |

### Standard Transitions

```css
/* Hover state on interactive elements */
transition: background-color 100ms ease-out,
            border-color 100ms ease-out,
            box-shadow 100ms ease-out,
            color 100ms ease-out;

/* Layout changes (sidebar, panel open/close) */
transition: width 200ms cubic-bezier(0.4, 0, 0.2, 1),
            transform 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Overlay/modal fade */
transition: opacity 200ms ease-out;

/* Wizard step slide */
.step-enter { opacity: 0; transform: translateX(24px); }
.step-enter-active {
  opacity: 1; transform: translateX(0);
  transition: opacity 300ms ease, transform 300ms ease;
}
```

### Reduced Motion

Always wrap motion in:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Mobile/Responsive Patterns

### Breakpoints (current Tailwind defaults — verify against app)

| Name | Min Width | Notes |
|------|-----------|-------|
| `sm` | 640px | Small tablet |
| `md` | 768px | Tablet |
| `lg` | 1024px | Laptop (sidebar shows) |
| `xl` | 1280px | Desktop |

### Mobile Navigation Pattern

Below `lg` (1024px), switch from persistent sidebar to:
- **Mobile header**: 48–56px tall, logo left, hamburger right, optional quick action
- **Drawer**: slide in from left on hamburger click, overlays content, tap outside to close
- **Bottom tab bar**: optional for 4–5 primary nav items (case list, new case, settings, account)

```
Mobile header (< lg):
┌──────────────────────────────────┐
│  ☰   Inheritance Pro      [+]   │  ← 48px height
└──────────────────────────────────┘
     ↓ tap ☰
┌──────────────────────────────────┐
│  ╳  Inheritance Pro             │  ← drawer open
│  ────────────────────────────── │
│  📋 Cases                       │
│  ⚖️  New Case                   │
│  👥 Clients                     │
│  ⚙️  Settings                   │
│  ──────────────────────────────  │
│  Sign Out                       │
└──────────────────────────────────┘
```

### Tables on Mobile

Data tables (case list, client list, team members) break badly at < 640px.
Pattern: at `sm` and below, switch from `<table>` to stacked card layout:

```
Desktop: [ID] [Client Name] [Status]  [Deadline]  [Actions]
Mobile:  ┌───────────────────────────────┐
         │ John Doe Estate               │
         │ Active • Due Mar 15, 2026     │
         │                   [Open →]   │
         └───────────────────────────────┘
```

CSS: `@media (max-width: 640px) { thead { display: none } tr { display: block; border: 1px solid var(--border); border-radius: var(--radius); margin-bottom: 8px; } td { display: flex; justify-content: space-between; } }`

---

## 8. Form Modernization Patterns

### Input Focus States

Modern SaaS (Vercel, Linear, Cal.com) uses:
- Default: 1px solid `var(--border)` (slate-200)
- Focus: 2px solid `var(--ring)` (navy), slight inset box-shadow for depth
- Error: 1px solid `var(--destructive)`, error text below in red
- Disabled: 0.5 opacity, `cursor: not-allowed`

```css
input:focus-visible {
  outline: none;
  border-color: var(--ring);
  box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.12);  /* navy shadow */
}
input.error {
  border-color: var(--destructive);
  box-shadow: 0 0 0 3px rgba(153, 27, 27, 0.12);
}
```

### Money Input Pattern

The `MoneyInput` component should use:
- Currency symbol as a prefix `$` (inside input left, 40px left padding)
- Right-align the numeric value
- Format on blur: `1234567` → `$1,234,567`
- Separator: thin vertical divider `|` between `$` prefix and input area

### Wizard Form Layout

Cal.com/Linear style form within wizard steps:
- `max-width: 540px` centered in card
- 24px gap between field groups
- Field label: 13px semibold navy, 6px below label = input
- Helper text: 12px muted, 4px below input
- Error text: 12px destructive red, 4px below input, icon prefix `⚠`

---

## 9. Navy+Gold Modernization — Specific CSS Token Additions

The following tokens are **missing** from the current `index.css` and should be added for the modernized design:

### Shadow Scale

```css
:root {
  --shadow-xs:  0 1px 2px rgba(0,0,0,0.06);
  --shadow-sm:  0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md:  0 4px 8px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
  --shadow-lg:  0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.04);
  --shadow-xl:  0 16px 48px rgba(0,0,0,0.14), 0 8px 16px rgba(0,0,0,0.06);
  /* Sidebar-specific shadow (navy tint) */
  --shadow-sidebar: 2px 0 8px rgba(30, 58, 95, 0.15);
}
```

### Animation Scale

```css
:root {
  --duration-fast:    100ms;
  --duration-default: 200ms;
  --duration-slow:    300ms;
  --duration-page:    400ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-out:     cubic-bezier(0.0, 0, 0.2, 1);
  --ease-in:      cubic-bezier(0.4, 0, 1, 1);
}
```

### Skeleton Color

```css
:root {
  --skeleton-base:      #e2e8f0;  /* --border */
  --skeleton-highlight: #f1f5f9;  /* --secondary */
}
```

---

## 10. Toast / Notification System

Currently **no toast library installed** (`catalog-config` finding). Modern SaaS pattern:

**Pattern**: Bottom-right fixed toasts, stacked, auto-dismiss (4s default, 8s for errors)

```
Desktop (bottom-right):          Mobile (top-center):
                                 ┌──────────────────────┐
                                 │  ✓ Case saved         │
                                 └──────────────────────┘
  ┌─────────────────────┐
  │  ✓ Case saved        │  ← green success toast
  └─────────────────────┘
  ┌─────────────────────┐
  │  ⚠ PDF failed        │  ← amber warning toast (older, behind)
  └─────────────────────┘
```

**Implementation**: Use `sonner` (recommended — 0 config, shadcn-compatible, < 2KB):

```bash
npm install sonner
```

Add to `App.tsx`:
```tsx
import { Toaster } from 'sonner';
// In JSX root:
<Toaster position="bottom-right" richColors />
```

Usage throughout app:
```tsx
import { toast } from 'sonner';
toast.success('Case saved');
toast.error('Failed to save case');
toast.warning('Missing required fields');
```

**Theming** (Navy+Gold sonner theme):
```css
[data-sonner-toaster] [data-type="success"] {
  --normal-bg: #166534;   /* success green */
  --normal-text: #ffffff;
}
[data-sonner-toaster] [data-type="error"] {
  --normal-bg: #991b1b;   /* destructive red */
  --normal-text: #ffffff;
}
```

---

## Summary of Adoptable Patterns

| Pattern | Source | Implementation Priority | Affects |
|---------|--------|------------------------|---------|
| Collapsible sidebar with icon-only mode | Linear | High | `AppLayout`, sidebar |
| Active nav item: left gold accent bar | Linear | High | `AppLayout`, sidebar |
| Hover nav: `rgba(255,255,255,0.08)` bg | Linear | High | Sidebar CSS |
| Auth-aware sidebar (show/hide sections) | Linear | Critical | `AppLayout` |
| Card hover: lift shadow + `translateY(-1px)` | Vercel | Medium | Dashboard cards |
| Status badge: dot + label, semantic colors | Vercel | High | Case list, status fields |
| KPI card: metric + delta + label pattern | Vercel | Medium | Dashboard |
| Onboarding wizard: step dots or progress bar | Cal.com | High | First-use flow |
| Settings two-column layout | Cal.com | High | `/settings/*` pages |
| Skeleton shimmer loading | Industry | High | All async data lists |
| Top-bar progress loader (2px gold bar) | Industry | Medium | Route transitions |
| Empty state: icon + title + description + CTA | Industry | High | All list/table views |
| `sonner` toast library | Industry | Critical | All user actions |
| Shadow scale tokens | Industry | Medium | Cards, dropdowns |
| Animation tokens + `prefers-reduced-motion` | Industry | Medium | All transitions |
| Mobile: drawer nav below `lg` | Industry | High | Mobile layout |
| Mobile: stacked card tables | Industry | High | Mobile tables |
| Money input prefix `$` + right-align | Industry | Medium | `MoneyInput` |
| Wizard max-width 540px centered | Cal.com | Medium | Case wizard |
