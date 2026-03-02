# Frontend Responsive Behavior — TaxKlaro

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- Full responsive design specification (breakpoints, components, touch targets): [ui/responsive.md](../ui/responsive.md)
- Design system (colors, typography, spacing tokens): [ui/design-system.md](../ui/design-system.md)
- Wizard steps (input screens): [frontend/wizard-steps.md](wizard-steps.md)
- Results views (output screens): [frontend/results-views.md](results-views.md)
- User journeys (flows): [frontend/user-journeys.md](user-journeys.md)
- Landing page copy: [seo-and-growth/landing-page.md](../seo-and-growth/landing-page.md)
- Accessibility: [ui/accessibility.md](../ui/accessibility.md)

---

## Purpose

This file specifies how the TaxKlaro frontend behaves across mobile, tablet, and desktop screen sizes. It is the **frontend implementor's reference** — providing the exact breakpoints, layout rules, and per-screen responsive decisions needed to write Next.js component code.

For the underlying design system (breakpoints defined, touch target minimums, spacing scale), see [ui/responsive.md](../ui/responsive.md). This file synthesizes those rules into **screen-by-screen implementation guidance**.

---

## Table of Contents

1. [Breakpoint Reference](#1-breakpoint-reference)
2. [Global Layout Rules](#2-global-layout-rules)
3. [Landing Page — Responsive Layout](#3-landing-page--responsive-layout)
4. [Tax Wizard — Responsive Layout](#4-tax-wizard--responsive-layout)
5. [Results Page — Responsive Layout](#5-results-page--responsive-layout)
6. [Auth Pages (Login / Register) — Responsive Layout](#6-auth-pages-login--register--responsive-layout)
7. [Account / Settings — Responsive Layout](#7-account--settings--responsive-layout)
8. [History Page — Responsive Layout](#8-history-page--responsive-layout)
9. [CPA Dashboard — Responsive Layout](#9-cpa-dashboard--responsive-layout)
10. [Filing Calendar — Responsive Layout](#10-filing-calendar--responsive-layout)
11. [Navigation — Responsive Behavior](#11-navigation--responsive-behavior)
12. [Form Fields — Mobile-Specific Behavior](#12-form-fields--mobile-specific-behavior)
13. [Data Tables — Mobile Collapse Rules](#13-data-tables--mobile-collapse-rules)
14. [Modals and Drawers — Responsive Behavior](#14-modals-and-drawers--responsive-behavior)
15. [Typography Scaling by Screen](#15-typography-scaling-by-screen)
16. [Next.js Implementation Notes](#16-nextjs-implementation-notes)

---

## 1. Breakpoint Reference

These are the exact Tailwind CSS breakpoints used throughout the product. All CSS is mobile-first — base styles apply at the smallest viewport; breakpoint prefixes (`sm:`, `md:`, etc.) add or modify styles for larger viewports only.

| Tailwind Prefix | CSS Min-Width | Description | Container Max-Width | Side Padding |
|----------------|--------------|-------------|---------------------|--------------|
| (none / default) | 0px | Mobile portrait (360px–639px) | 100% | 16px |
| `sm:` | 640px | Mobile landscape / large phones | 100% | 24px |
| `md:` | 768px | Tablet portrait | 100% | 32px |
| `lg:` | 1024px | Tablet landscape / laptop | 768px | 32px |
| `xl:` | 1280px | Standard laptop (13"–14") | 960px | 32px |
| `2xl:` | 1536px | Large desktop | 1120px | 32px |

**Primary targets**: Android smartphones (360px–412px) and iPhones (375px–390px) are P1. Design all layouts for 375px first.

---

## 2. Global Layout Rules

### 2.1 Container

All pages use a centered container with responsive max-width:

```tsx
// Tailwind: w-full mx-auto px-4 sm:px-6 md:px-8 lg:max-w-3xl xl:max-w-5xl 2xl:max-w-6xl
```

The container is always full-width on mobile and tablet (up to `md:`), then constrained to 768px/960px/1120px on larger screens.

### 2.2 Sticky Header

The global navigation header is `position: sticky; top: 0; z-index: 50` on all screen sizes. Height is `64px` on all breakpoints. The sticky header reduces available viewport height on mobile — the tax wizard's visible form area accounts for the `64px` header offset.

### 2.3 Safe Area Insets (Mobile Notch/Home Bar)

All full-screen or bottom-anchored elements use CSS `env()` safe area insets:

```css
padding-bottom: max(16px, env(safe-area-inset-bottom));
padding-top: max(0px, env(safe-area-inset-top));
```

Applied to: the sticky "Calculate" CTA button on mobile wizard, the slide-in drawer navigation, and the bottom toast notification area.

### 2.4 Scroll Behavior

- `html { scroll-behavior: smooth; }` — for anchor navigation within the landing page.
- The wizard and results page do NOT use smooth scroll (avoids disorientation when moving between long steps).
- Mobile: standard browser rubber-band scroll. No custom scroll implementation.

---

## 3. Landing Page — Responsive Layout

The landing page URL is `/` (root). It is a static Next.js page (no authentication required).

### 3.1 Hero Section

**Mobile (< 768px):**
```
┌──────────────────────────────────────────┐
│  [Headline — 30px/36px, center-aligned]  │
│  "Stop Overpaying Tax.                   │
│   Know Your Best                         │
│   BIR Option."                           │
│                                          │
│  [Subheadline — 16px, center, neutral-600│
│   2-3 lines]                             │
│                                          │
│  [CTA Button — full-width, 48px tall]    │
│  "Compute My Tax Free"                   │
│                                          │
│  [Social proof — "Join 12,000+           │
│   freelancers. Free forever."]           │
│                                          │
│  [Hero illustration — full-width,        │
│   max-height: 280px, aspect-auto]        │
└──────────────────────────────────────────┘
```

**Tablet (768px–1023px):**
```
┌──────────────────────────────────────────────────┐
│  [Headline — 36px/44px, center-aligned]          │
│  [Subheadline — 18px, center, max-width: 480px]  │
│  [CTA — 320px wide, centered, 52px tall]         │
│  [Illustration — max-width: 480px, centered]     │
└──────────────────────────────────────────────────┘
```

**Desktop (≥ 1024px):**
```
┌───────────────────────────────────────────────────────────┐
│  [Left: 50%]                    [Right: 50%]              │
│  Headline — 42px/52px           [Hero illustration SVG]   │
│  Subheadline — 18px, left       max-width: 480px          │
│  CTA Button — 240px, left-aligned                         │
│  Social proof line                                        │
└───────────────────────────────────────────────────────────┘
```

Layout switch: `md:` switches from column to row (`flex-col md:flex-row`). Illustration appears below text on mobile, beside text on `md:` and above.

### 3.2 Features/Benefits Section (3 cards)

**Mobile**: Single column stack. Each card: full-width, `rounded-xl`, `p-6`.
**Tablet (≥ 768px)**: 3-column grid (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3`). At `sm` (640px): 2-column. At `md` (768px): 3-column.
**Desktop**: Same 3-column layout, cards have more internal padding (`p-8`).

### 3.3 How It Works Section (3 steps)

**Mobile**: Vertical list with numbered circles. Step icon `48px` circle. Step text below icon. Full-width.
**Tablet/Desktop**: Horizontal row of 3 steps. Each step: `flex-1`, with connecting arrow between steps (`hidden` on mobile, `block` on `lg:`).

### 3.4 Tax Savings Comparison (regime table)

**Mobile**: Stacked cards, one per regime (3 cards). Each card shows regime name, tax amount, and "Recommended" badge if applicable. No columns — all fields in a vertical list within the card.
**Tablet/Desktop**: Side-by-side comparison table. Standard HTML table with `table-fixed`. Columns: Regime | Tax Due | Key Condition | Typical For.

### 3.5 Testimonials Section

**Mobile**: Vertical stack of testimonial cards. Each card: full-width.
**Tablet (≥ 768px)**: 2-column grid.
**Desktop (≥ 1024px)**: 3-column grid.

### 3.6 Pricing Section

**Mobile**: Vertical stack of 3 pricing tier cards. Cards stacked top-to-bottom: Free → Pro → Enterprise. Each card full-width.
**Tablet (≥ 768px)**: 3-column grid.
**Desktop**: Same 3-column grid but Pro card is visually elevated (`scale-105 shadow-xl`).

### 3.7 FAQ Section (accordion)

All screen sizes: full-width accordion. Each item: `w-full`. No column splitting. Question text wraps normally at all sizes.

### 3.8 Footer

**Mobile**: 2-column grid for link columns. Logo and tagline above. Copyright below.
**Tablet/Desktop**: 4-column grid for link columns (Product | Company | Legal | Social).

---

## 4. Tax Wizard — Responsive Layout

The wizard is the core product experience at `/compute`. It is a multi-step form.

### 4.1 Overall Wizard Container

**Mobile (< 768px):**
- Full-viewport-width container (no horizontal margin beyond `px-4`)
- Sticky progress bar at top (below global nav) — see §4.2
- Each step takes the full width
- "Next" and "Back" buttons pinned to the bottom of the viewport using a sticky footer:
  ```css
  position: fixed; bottom: 0; left: 0; right: 0;
  padding: 12px 16px max(12px, env(safe-area-inset-bottom)) 16px;
  background: white;
  border-top: 1px solid #E5E7EB;
  z-index: 40;
  ```
- The page content has `pb-[88px]` (88px padding at bottom) to prevent the sticky footer from covering the last form field.

**Tablet (768px–1023px):**
- Max-width `640px`, centered
- Buttons in-line with form (not sticky footer), `mt-8` below last field
- Step indicator moves to a sidebar pill on the left

**Desktop (≥ 1024px):**
- Two-column layout: progress indicator on left (`w-64`, sticky), form on right (remaining width)
- Max-width for the entire wizard container: `960px`
- Buttons below form content, right-aligned

### 4.2 Progress Bar / Step Indicator

**Mobile:**
```
┌──────────────────────────────────────────┐
│  [Step 1 of 4]  ████████░░░░░░  50%      │
│  "Taxpayer Profile"                      │
└──────────────────────────────────────────┘
```
- Height: `52px`, sticky below global nav (`top: 64px; z-index: 45`)
- Linear progress bar (filled ÷ total steps)
- Current step name displayed right of the bar

**Desktop:**
Left sidebar step indicator (vertical list of 4 steps, each with circle + label):
```
  ●  1. Taxpayer Profile     ← completed (filled circle, brand-600)
  ●  2. Income Details       ← completed
  ⬤  3. Deductions           ← current (ring, brand-600 fill)
  ○  4. Credits & Payments   ← pending (empty circle, neutral-300)
```

### 4.3 Wizard Form Fields

All form fields are full-width (`w-full`) on mobile. On `md:` and above, fields use a 2-column grid for related pairs (e.g., "First Name" | "Last Name"). Field height is `48px` on all sizes.

Numeric currency inputs: right-aligned input text on all sizes. Peso sign prefix `₱` inside the input box.

Select dropdowns: use native `<select>` on mobile (triggers iOS/Android native picker). On desktop, custom styled select with search is used.

Toggles (e.g., "Has CWT?", "Has quarterly payments?"): full-width toggle rows on mobile. `48px` tall including label.

### 4.4 Step 1: Taxpayer Profile — Layout

**Mobile**: All fields stacked vertically. Fields: full_name (text), tin (text, format hint), tax_year (select), rdo_code (select with search), taxpayer_type (segmented control: 3 options).
**Desktop**: 2-column grid for full_name + tin, 2-column for tax_year + rdo_code. Segmented control full-width (3 equal segments).

### 4.5 Step 2: Income Details — Layout

**Mobile**: Fields stacked. Toggle switches for income_type (segmented: "Service Only" | "Mixed (Employee + Freelance)" | "Trading").
**Desktop**: Toggle switches inline. Conditional fields (compensation_income, de_minimis_benefits) appear in 2-column grid only when "Mixed" is selected.

### 4.6 Step 3: Deductions — Layout

**Mobile**: Regime selector at top (3 cards stacked: "Compute All Three (Recommended)" default | "Skip — I know my regime"). Below: conditional itemized deduction inputs (accordion panels per category). OSD section collapses to a pill: "OSD: 40% of ₱X,XXX = ₱Y,YYY".
**Desktop**: 3-column regime preview panel (shows real-time tax estimate for each regime as user types in income). Itemized deductions panel on right with categorized inputs.

**Real-time update behavior (all screen sizes)**: When gross_receipts is entered, the results preview at the bottom of the wizard (or in the sidebar on desktop) updates instantly showing all three regime estimates. On mobile, this preview collapses to a single line: "Estimated tax: ₱X (using best option)". Tap to expand.

### 4.7 Step 4: Credits & Payments — Layout

**Mobile**: CWT entries as a list. "Add CWT Entry" button at bottom of list. Each entry row: 3 fields (name/ATC, amount, period) arranged vertically. Quarterly payments section below.
**Desktop**: CWT entries as a table with inline editing. 4 columns: Source | ATC Code | Amount | Quarter.

---

## 5. Results Page — Responsive Layout

The results page URL is `/compute/results` or `/history/{id}`.

### 5.1 Recommendation Header

**All screen sizes**: Full-width banner at top.
```
┌──────────────────────────────────────────────────┐
│  ✓  Best Option: 8% Flat Rate                   │
│  You save ₱24,500 vs. graduated tax              │
│  Tax Due: ₱42,000   Percentage Tax: ₱4,800      │
│  [Download PDF]  [Save Results]  [Start New]    │
└──────────────────────────────────────────────────┘
```

**Mobile (< 768px)**: Banner is 3 rows tall. Action buttons are a horizontal scroll row (pill buttons, no wrap).
**Desktop**: Banner is 2 rows. Buttons right-aligned, inline.

### 5.2 Regime Comparison Table

**Mobile**: Stacked cards (one per regime). Each card:
```
┌──────────────────────────────────────────┐
│  8% Flat Rate           [★ BEST]         │
│  Tax Due: ₱42,000                        │
│  └─ Percentage Tax: ₱4,800              │
│  Total Liability: ₱46,800               │
│  [See breakdown ↓]                       │
└──────────────────────────────────────────┘
```

**Tablet/Desktop**: Standard comparison table with all 3 regimes as columns. Rows: Tax Due | PT/VAT | Total Liability | Effective Rate | Key Conditions.

### 5.3 Detailed Breakdown (Accordion)

**All screen sizes**: Accordion panel per regime. On mobile, only the recommended regime is expanded by default. Other regimes collapsed.

Content within each accordion: Step-by-step computation table. On mobile, the table uses 2 columns (Item | Amount). On desktop, 3 columns (Item | Computation | Amount).

### 5.4 BIR Form Prefill Preview

**Mobile**: Below the comparison section. Collapsed by default with toggle "See how this maps to BIR Form 1701A". Expanded view shows the form fields in a 2-column grid (field name | value).
**Desktop**: Right-side panel (30% width, sticky) showing form field values alongside the computation breakdown.

### 5.5 Filing Calendar Section

**All screen sizes**: Compact calendar view showing next 3 filing deadlines. On mobile: vertical list. On desktop: horizontal row with date/form/amount cards.

---

## 6. Auth Pages (Login / Register) — Responsive Layout

Auth pages: `/login`, `/register`, `/forgot-password`, `/reset-password`.

**Mobile (< 768px):**
- Full-width form, `px-4` padding
- No decorative left panel
- Logo + headline centered above form
- Form fields: full-width, `48px` height

**Tablet/Desktop (≥ 768px):**
- Two-panel layout: left panel (40% width) with brand color background (`brand-600`), logo, and benefit bullets; right panel (60%) with the form centered in a `480px` max-width card.

**Field layout (all sizes)**:
- Email: full-width, single row
- Password: full-width, with show/hide eye icon toggle
- Submit button: full-width, `52px` height
- OAuth "Continue with Google" button: full-width, `48px`, above or below email/password form (above on mobile, below the divider on desktop)

---

## 7. Account / Settings — Responsive Layout

Route: `/account`.

**Mobile**: Tabbed interface. Tabs: "Profile" | "Subscription" | "Security" | "API Keys". Tab list is a horizontal scroll row. Each tab content is a full-width single-column form.

**Desktop**: Left sidebar navigation (160px) with tab links. Content area fills remaining width. Max-width: `720px` for form content.

---

## 8. History Page — Responsive Layout

Route: `/history`. Pro and Enterprise tier only.

**Mobile**:
- Full-width list of computation records. Each record: card style.
- Card shows: tax year, gross receipts (₱ formatted), best regime, tax due, date.
- Tap to expand: shows full results inline (accordion) or navigates to `/history/{id}`.
- Filter controls (year, regime): collapsed behind "Filter" button; slide-in drawer from bottom.

**Tablet/Desktop**:
- Table layout. Columns: Tax Year | Gross Receipts | Best Regime | Tax Due | Savings vs. Graduated | Computed On | Actions.
- Clicking a row navigates to `/history/{id}` (full results page).
- Filter controls: inline above table (year selector, regime filter dropdown, sort).

---

## 9. CPA Dashboard — Responsive Layout

Route: `/cpa`. Enterprise tier only.

**Mobile**:
- Summary metrics at top (4 cards in 2×2 grid): Total Clients | Active Batch Jobs | Avg Savings per Client | Last 30 Days Computations.
- Client list: scrollable list with search. Each client: card with name, TIN (masked), last computed date, total savings.
- "New Batch Job" button: prominent, full-width.

**Tablet/Desktop**:
- Left sidebar: client list with search (`w-72`, sticky).
- Right content area: client detail view or batch job status.
- Summary metrics in a horizontal 4-column row at top of content area.
- Batch job table: full-width with columns: Job ID | Submitted | Status | Clients | Completed | Actions.

---

## 10. Filing Calendar — Responsive Layout

Route: `/calendar`.

**Mobile**:
- Month view calendar: 7-column grid, each day cell `calc(100% / 7)` wide. Minimum day cell height: `40px`. Filing due dates shown as colored dots. Tap a dot to see the filing details panel (slides up from bottom).
- Below calendar: list view of upcoming deadlines within the next 90 days.

**Tablet/Desktop**:
- Standard month calendar view with full deadline labels in each cell.
- Right panel (300px): upcoming deadlines list (sticky).

---

## 11. Navigation — Responsive Behavior

See [ui/responsive.md §5](../ui/responsive.md) for the detailed navigation spec (mobile drawer, desktop top bar, active state rules). Summary:

| Screen Size | Navigation Style |
|-------------|-----------------|
| < 768px (mobile) | Top bar with hamburger → slide-in right drawer, `280px` wide |
| ≥ 768px (tablet/desktop) | Horizontal top bar with inline nav links |

The CTA button "Compute My Tax" appears in the top bar navigation on desktop at all times. On mobile, it is hidden from the top bar (available only on the landing page or via the drawer).

---

## 12. Form Fields — Mobile-Specific Behavior

### 12.1 Input Types for Mobile Keyboards

| Field | `type` attribute | Mobile Keyboard |
|-------|-----------------|-----------------|
| Gross receipts (₱) | `type="text" inputmode="decimal"` | Numeric keyboard with decimal point |
| TIN | `type="text" inputmode="numeric" pattern="[0-9\-]+"` | Numeric keyboard |
| Tax year | `type="text" inputmode="numeric"` | Numeric keyboard |
| Email | `type="email"` | Email keyboard (@ key visible) |
| Password | `type="password"` | Standard keyboard |
| Business name | `type="text"` | Standard keyboard |
| RDO code | Select (native) | iOS/Android native picker |
| Percentage tax (₱) | `type="text" inputmode="decimal"` | Numeric keyboard |

### 12.2 Currency Field Formatting

Currency fields use a **live formatting hook** (`useCurrencyInput`):
- User types digits: `1234567`
- On `blur`: formats to ₱ 1,234,567 display
- Stored internally as raw number: `1234567`
- On mobile, display formatting is applied only after the field loses focus (not on every keystroke, to avoid cursor position issues)

### 12.3 Scrolling to Errors

On form submit validation failure, the page scrolls to the first error field with a 100ms delay:
```typescript
// After validation runs:
setTimeout(() => {
  document.querySelector('[data-invalid="true"]')?.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
}, 100);
```

The `100ms` delay allows the error state to render before scrolling begins.

### 12.4 Label and Error Text Placement

On all screen sizes:
- Label: above the field, `mb-1`, `text-sm font-medium text-neutral-700`
- Help text: below the field, `mt-1`, `text-xs text-neutral-500`
- Error message: below the field (replaces help text position), `mt-1`, `text-xs text-danger-600`

No inline (side-by-side) labels on any screen size. Labels are always above the input.

---

## 13. Data Tables — Mobile Collapse Rules

Long data tables in the product (CWT schedule, quarterly payments, deduction categories) collapse differently on mobile:

### 13.1 CWT Entries Table (Wizard Step 4)

**Desktop**: 4-column table (Source | ATC | Amount | Quarter).
**Mobile**: Each entry is a collapsible row-card:
```
┌──────────────────────────────────┐
│  Accenture (WI100 — 10%)         │
│  ₱2,000  •  Q1 2025   [Edit][×] │
└──────────────────────────────────┘
```

### 13.2 Quarterly Payments Table

**Desktop**: 4-column table (Quarter | Tax Due | CWT Credit | Balance Paid).
**Mobile**: Vertically stacked cards, one per quarter. Card shows quarter label + the 3 amounts in `flex-row justify-between` rows within the card.

### 13.3 Regime Comparison Table (Results)

**Desktop**: Standard table, 4 columns (regime name + 3 numeric columns).
**Mobile**: Replaced by 3 stacked cards (see §5.2). The HTML table is `hidden` on mobile; the card layout is `block md:hidden`.

---

## 14. Modals and Drawers — Responsive Behavior

### 14.1 Modals

- On mobile (< 768px): Modals render as **bottom sheets** (slide up from bottom, `border-radius: 16px 16px 0 0`). Max height: `90vh`. Handle bar at top (32px × 4px pill, `neutral-300`).
- On tablet/desktop (≥ 768px): Standard centered modal dialog, `max-w-lg`, `rounded-2xl`.
- Implementation: a single `<Modal>` component detects viewport size and applies either bottom-sheet or center-dialog styles.

### 14.2 Tooltips

- On desktop: standard CSS tooltip (`:hover` trigger). Appears above the trigger element by default.
- On mobile: tooltips triggered by `click` (not hover). Clicking the ⓘ info icon opens a **bottom sheet** or **small popover** depending on content length:
  - Short tooltip (< 100 chars): popover anchored to the icon, `max-w-xs`
  - Long tooltip (≥ 100 chars): bottom sheet, scrollable, with close button

### 14.3 Slide-in Panels

Used in: CPA Dashboard client detail, Filing Calendar day detail.

- On mobile: Panel slides in from **bottom** (drawer), full-width, 80vh max height.
- On desktop: Panel slides in from **right** (sidebar), full-height, `w-[400px]`.

---

## 15. Typography Scaling by Screen

See [ui/design-system.md §2](../ui/design-system.md) for the complete type scale. Screen-specific application:

| Element | Mobile (default) | Tablet (`md:`) | Desktop (`lg:`) |
|---------|-----------------|----------------|-----------------|
| Hero headline | `text-3xl` (30px) | `text-4xl` (36px) | `text-5xl` (48px) |
| Page title (H1) | `text-2xl` (24px) | `text-3xl` (30px) | `text-3xl` (30px) |
| Section heading (H2) | `text-xl` (20px) | `text-2xl` (24px) | `text-2xl` (24px) |
| Card heading (H3) | `text-lg` (18px) | `text-lg` (18px) | `text-lg` (18px) |
| Body text | `text-base` (16px) | `text-base` (16px) | `text-base` (16px) |
| Form label | `text-sm` (14px) | `text-sm` (14px) | `text-sm` (14px) |
| Caption / footnote | `text-xs` (12px) | `text-xs` (12px) | `text-xs` (12px) |
| Tax amount (prominent) | `text-2xl font-bold` | `text-3xl font-bold` | `text-4xl font-bold` |
| Tax savings highlight | `text-xl font-semibold` | `text-2xl font-semibold` | `text-2xl font-semibold` |

Line heights: `leading-tight` (1.25) for headings; `leading-normal` (1.5) for body; `leading-relaxed` (1.625) for long-form text (disclaimers, help text).

---

## 16. Next.js Implementation Notes

### 16.1 Responsive CSS Strategy

All responsive styles use **Tailwind CSS v3 utility classes** with breakpoint prefixes. Custom responsive CSS (non-Tailwind) uses CSS modules with `@media` queries at the same breakpoints. There is no `useState`-based responsive logic — all layout changes are CSS-only (no JavaScript breakpoint detection for layout purposes).

Exception: the navigation drawer open/close state is managed in React state (keyboard accessibility requires JavaScript control). But the *layout* switch between mobile drawer and desktop nav bar is CSS-only.

### 16.2 `useMediaQuery` Hook (Analytics Only)

A `useMediaQuery` hook is used exclusively for analytics events — to log which breakpoint the user is on when they interact with specific elements (e.g., "computed on mobile"). It is NOT used for conditional rendering of layout.

```typescript
// Used ONLY for analytics, NOT for layout:
const isMobile = useMediaQuery('(max-width: 767px)');
// Track wizard completion with device context
trackEvent('wizard_completed', { device: isMobile ? 'mobile' : 'desktop' });
```

### 16.3 Image Optimization

All images use Next.js `<Image>` component with `sizes` prop for responsive srcsets:

```tsx
// Hero illustration
<Image
  src="/illustrations/tax-hero.svg"
  alt="Filipino freelancer computing taxes"
  width={480}
  height={360}
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 480px"
  priority  // LCP element — preload
/>
```

### 16.4 Viewport Meta Tag

The root layout (`apps/frontend/src/app/layout.tsx`) must include:

```tsx
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,  // Allow user zoom up to 5x (accessibility requirement)
  userScalable: true,  // Do NOT set to false — WCAG 1.4.4 violation
  themeColor: '#0F4C81',
};
```

`maximumScale: 1` or `user-scalable=no` is explicitly forbidden — this violates WCAG 1.4.4 (Resize Text) and degrades accessibility for low-vision users.

### 16.5 Server-Side Rendering Considerations

The wizard, results page, and account pages are rendered **client-side** (using `'use client'` directive) because they depend on browser APIs (localStorage for draft state, window dimensions for progressive enhancement). The landing page, auth pages, and legal pages are server-rendered for SEO performance.

The responsive behavior documented in this file applies to client-rendered pages — the CSS is the same regardless of rendering mode.
