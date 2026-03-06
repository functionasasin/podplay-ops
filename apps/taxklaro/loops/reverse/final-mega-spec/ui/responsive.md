# Responsive Design — Philippine Freelance & Self-Employed Income Tax Optimizer

**Status:** COMPLETE
**Last updated:** 2026-03-02
**Cross-references:**
- Design system (tokens, breakpoints, colors): [ui/design-system.md](design-system.md)
- Component library (component specs): [ui/component-library.md](component-library.md)
- Wizard steps (input screens): [frontend/wizard-steps.md](../frontend/wizard-steps.md)
- Results views (output screens): [frontend/results-views.md](../frontend/results-views.md)
- Accessibility (ARIA, keyboard nav): [ui/accessibility.md](accessibility.md)

---

## Table of Contents

1. [Responsive Strategy](#1-responsive-strategy)
2. [Breakpoint Definitions](#2-breakpoint-definitions)
3. [Viewport and Document Setup](#3-viewport-and-document-setup)
4. [Touch Targets](#4-touch-targets)
5. [Navigation — Responsive Behavior](#5-navigation--responsive-behavior)
6. [Wizard — Responsive Behavior](#6-wizard--responsive-behavior)
7. [Results Page — Responsive Behavior](#7-results-page--responsive-behavior)
8. [CPA Dashboard — Responsive Behavior](#8-cpa-dashboard--responsive-behavior)
9. [Landing Page — Responsive Behavior](#9-landing-page--responsive-behavior)
10. [Form Fields — Mobile Behavior](#10-form-fields--mobile-behavior)
11. [Data Tables — Responsive Behavior](#11-data-tables--responsive-behavior)
12. [Typography Scaling](#12-typography-scaling)
13. [Images and Illustrations](#13-images-and-illustrations)
14. [Sticky and Fixed Elements](#14-sticky-and-fixed-elements)
15. [Gesture Support](#15-gesture-support)
16. [Safe Areas (Notch and Home Indicator)](#16-safe-areas-notch-and-home-indicator)
17. [Performance Constraints for Mobile](#17-performance-constraints-for-mobile)
18. [Screen-by-Screen Responsive Matrix](#18-screen-by-screen-responsive-matrix)

---

## 1. Responsive Strategy

### 1.1 Mobile-First Approach

All CSS is written mobile-first. Base styles apply to the smallest screen. Media queries at `sm`, `md`, `lg`, `xl`, and `2xl` progressively enhance the layout for larger screens. No styles "undo" a mobile layout — they only add or modify.

**Framework**: Tailwind CSS v3. Utility classes use the breakpoint prefix syntax: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`. Custom utilities use the same prefix system.

### 1.2 Primary Target Devices

| Priority | Device Category | Screen Width Range | Notes |
|---|---|---|---|
| P1 — Primary | Android smartphones | 360px–412px | Most Philippine freelancer users access on Android mid-range devices |
| P1 — Primary | iPhone (standard) | 375px–390px | iPhone SE, iPhone 14/15 |
| P2 — High | Tablet portrait | 768px–820px | iPad 10th gen, Samsung Tab A |
| P2 — High | Tablet landscape | 1024px–1194px | iPad Air landscape, Surface Go |
| P3 — Medium | Laptop | 1280px–1440px | Standard 13"/14" laptops |
| P3 — Medium | Desktop monitor | 1440px–1920px | Office/home desktops |
| P4 — Low | iPhone Plus/Pro Max | 430px–440px | Wide iPhone models |
| P4 — Low | Large 4K monitor | 1920px–2560px | Capped at 1120px container |

### 1.3 Orientation Support

Both portrait and landscape orientations are supported on all devices. Layout is tested in both orientations for:
- 375px × 667px (iPhone SE portrait)
- 667px × 375px (iPhone SE landscape → maps to `sm` breakpoint)
- 768px × 1024px (iPad portrait → maps to `md` breakpoint)
- 1024px × 768px (iPad landscape → maps to `lg` breakpoint)

### 1.4 Browser Support Matrix

| Browser | Versions Supported | Notes |
|---|---|---|
| Chrome for Android | Last 2 major versions | Primary test target for P1 |
| Safari for iOS | Last 2 major versions | Required for iPhone users |
| Chrome desktop | Last 2 major versions | Primary desktop target |
| Firefox desktop | Last 2 major versions | Secondary desktop target |
| Edge (Chromium) | Last 2 major versions | Windows users |
| Samsung Internet | Last 2 major versions | Common on mid-range Android |

CSS Grid and Flexbox: full support in all targeted browsers. `min()`, `max()`, `clamp()`: full support in all targeted browsers. `env(safe-area-inset-*)`: supported in Chrome 69+, Safari 11.1+, Firefox 65+.

---

## 2. Breakpoint Definitions

### 2.1 Breakpoint Table

| Name | CSS Min-Width | Tailwind Prefix | Description | Container Max-Width | Side Padding |
|---|---|---|---|---|---|
| `default` | none (0px) | (no prefix) | Mobile portrait | `100%` | `16px` (space-4) |
| `sm` | `640px` | `sm:` | Mobile landscape / large phones | `100%` | `24px` (space-6) |
| `md` | `768px` | `md:` | Tablet portrait | `100%` | `32px` (space-8) |
| `lg` | `1024px` | `lg:` | Tablet landscape / laptop | `768px` | `32px` (space-8) |
| `xl` | `1280px` | `xl:` | Standard laptop | `960px` | `32px` (space-8) |
| `2xl` | `1536px` | `2xl:` | Large desktop | `1120px` | `32px` (space-8) |

### 2.2 CSS Custom Properties for Breakpoints

```css
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

### 2.3 JavaScript Breakpoint Detection (for conditional rendering)

```typescript
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xl2: 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// Returns the current active breakpoint name
export function getCurrentBreakpoint(): Breakpoint | 'default' {
  const width = window.innerWidth;
  if (width >= 1536) return 'xl2';
  if (width >= 1280) return 'xl';
  if (width >= 1024) return 'lg';
  if (width >= 768) return 'md';
  if (width >= 640) return 'sm';
  return 'default';
}

// Returns true if window is at least as wide as the named breakpoint
export function isAtLeast(bp: Breakpoint): boolean {
  return window.innerWidth >= BREAKPOINTS[bp];
}
```

### 2.4 Tailwind Config Breakpoints

The `tailwind.config.ts` file defines these exact breakpoints (matching Tailwind defaults; listed explicitly for the forward loop):

```typescript
// tailwind.config.ts
module.exports = {
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
};
```

---

## 3. Viewport and Document Setup

### 3.1 HTML Viewport Meta Tag

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

**`viewport-fit=cover`** is required to support safe area insets on iPhones with notches/Dynamic Island. See [Section 16](#16-safe-areas-notch-and-home-indicator).

### 3.2 Root Font Size

The root (`html`) element uses `font-size: 16px`. All `rem` units are based on this 16px root. This root size does NOT change at any breakpoint. Typography scaling is handled via specific utility classes, not root font-size changes.

### 3.3 Box Model

```css
*, *::before, *::after {
  box-sizing: border-box;
}
```

### 3.4 Scroll Behavior

```css
html {
  scroll-behavior: smooth;
}
```

The results page uses `scroll-behavior: smooth` for anchor links to sections. The wizard uses programmatic scrolling (`element.scrollIntoView({ behavior: 'smooth', block: 'start' })`) when advancing steps.

### 3.5 Overflow Strategy

- `body`: `overflow-x: hidden` to prevent horizontal scrollbar from appearing at any viewport width.
- Tables that cannot collapse: use `overflow-x: auto` on a wrapper `div`, NOT on the table itself.
- Modal overlays: `overflow: hidden` on `body` while modal is open to prevent background scroll.

---

## 4. Touch Targets

### 4.1 Minimum Touch Target Size

All interactive elements must meet the minimum touch target requirement:

| Element Type | Minimum Width | Minimum Height | Notes |
|---|---|---|---|
| Button (primary, secondary) | `48px` | `48px` | Per WCAG 2.5.5 Level AA |
| Icon button (standalone) | `44px` | `44px` | Per Apple HIG and Android guidelines |
| Checkbox (hit area) | `44px` | `44px` | Visible checkbox can be 20px; the `label` wraps to provide larger tap zone |
| Radio button (hit area) | `44px` | `44px` | Same as checkbox |
| Select / dropdown trigger | `100%` (full width) | `48px` | Full-width on mobile |
| Text input | `100%` (full width) | `48px` | Height ensures fat-finger usability |
| Link (inline text) | no min | `24px` line height | Inline links do not have a forced width |
| Navigation tab item | `44px` | `44px` | Progress bar step tap area |
| Accordion header | `100%` | `48px` | Full-width tap area |
| Toast dismiss button | `44px` | `44px` | Large enough to tap when reading message |
| Tooltip trigger (info icon) | `32px` | `32px` | Constrained by inline context; 32px minimum |

### 4.2 Touch Target Spacing

Adjacent interactive elements must have at least `8px` of non-interactive space between them to prevent accidental activation of the wrong target.

**Exception**: Segmented controls (mode selection tabs) may have 4px gaps, as these are typically wider elements with clear visual separation.

### 4.3 Implementation Pattern for Checkbox/Radio Touch Zones

```html
<!-- Checkbox with extended touch target -->
<label class="flex items-center gap-3 py-3 cursor-pointer min-h-[44px]">
  <input type="checkbox" class="sr-only" />
  <!-- Custom visual checkbox: -->
  <span class="w-5 h-5 border-2 border-neutral-300 rounded flex-shrink-0" />
  <span class="text-sm text-neutral-800">Label text</span>
</label>
```

The `py-3` (12px vertical padding on the label) combined with the `text-sm` line height ensures the full label acts as the 44px touch target.

---

## 5. Navigation — Responsive Behavior

### 5.1 Global Navigation Architecture

The global navigation has two states:

| State | Applies at | Structure |
|---|---|---|
| **Mobile nav** | `default` and `sm` (< 768px) | Top bar with logo + hamburger button; drawer slides in from right |
| **Desktop nav** | `md` and above (≥ 768px) | Horizontal top bar with logo left, nav links center-right |

### 5.2 Mobile Navigation (< 768px)

**Top bar structure:**
```
┌──────────────────────────────────────────┐
│ [Logo]                        [≡ Menu]   │
│  TaxKlaro              (44×44px)  │
└──────────────────────────────────────────┘
```

- Height: `64px` (space-16)
- Background: `neutral-0` (#FFFFFF)
- Bottom border: `1px solid neutral-200`
- Logo: SVG inline, `120px` wide, `32px` tall
- Hamburger button: `Bars3` icon, `24px`, in a `44px × 44px` hit area, positioned `right: space-4`
- `position: sticky; top: 0; z-index: 50`

**Hamburger menu tap → Slide-in drawer:**
- Drawer slides in from the right: `transform: translateX(100%)` → `transform: translateX(0)`, transition `300ms ease-in-out`
- Drawer width: `280px` (75vw on very small screens: `min(280px, 80vw)`)
- Overlay behind drawer: `rgba(0, 0, 0, 0.5)`, `z-index: 49`, tapping it closes the drawer
- Drawer background: `neutral-0`
- Close button: `XMark` icon `20px` in a `44px × 44px` area, positioned top-right inside drawer
- Drawer content, top to bottom:
  1. Close button row (`64px` tall, matching top bar)
  2. Divider (`1px neutral-200`)
  3. Nav link: "Tax Optimizer" (icon: `Calculator`) → `/`
  4. Nav link: "My History" (icon: `ClipboardDocumentList`) → `/history` (Pro; shows lock icon if free tier)
  5. Nav link: "Filing Calendar" (icon: `CalendarDays`) → `/calendar`
  6. Nav link: "CPA Dashboard" (icon: `UserGroup`) → `/cpa` (Enterprise only; hidden if not CPA tier)
  7. Divider
  8. Nav link: "Account" (icon: `Cog6Tooth`) → `/account`
  9. Nav link: "Log Out" (icon: `ArrowRightOnRectangle`) → fires logout action
  10. If unauthenticated: "Log In" and "Create Free Account" replace items 8–9

Nav links in drawer:
- Height: `56px`
- Left icon: `icon-base` (20px), `neutral-500`
- Label: `text-base` (16px), `font-medium`, `neutral-900`
- Active state: `brand-50` background, `brand-600` icon, `brand-800` text

**Focus trap**: When the drawer is open, Tab key cycles only within drawer elements. See [accessibility.md](accessibility.md) for implementation.

### 5.3 Desktop Navigation (≥ 768px)

**Top bar structure:**
```
┌──────────────────────────────────────────────────────────────┐
│ [Logo]   Tax Optimizer  History  Calendar    [Login] [Start] │
└──────────────────────────────────────────────────────────────┘
```

- Height: `72px` (space-18 approximated; exact value: `72px`)
- Background: `neutral-0`
- Bottom border: `1px solid neutral-200`
- `position: sticky; top: 0; z-index: 50`
- Logo left: `120px` wide; left-aligned in container
- Nav links: horizontal flex row, `gap: space-8` (32px), centered
- Nav link style: `text-sm font-medium neutral-700`; hover: `neutral-900`; active page: `brand-600 font-semibold` with `2px bottom border brand-600`
- Right-side CTAs:
  - If unauthenticated: "Log In" (ghost button, `text-sm`) + "Start for Free" (primary button, `text-sm`)
  - If authenticated free: "Upgrade to Pro" (secondary button with `brand-600` border) + user avatar dropdown
  - If authenticated pro: user avatar dropdown only
  - Avatar dropdown: `40px × 40px` circle with user initials or uploaded photo; click opens 4-item dropdown (Account, Billing, Help, Log Out)

### 5.4 Wizard Progress Bar — Responsive Behavior

The step progress indicator changes layout at breakpoints:

| Breakpoint | Layout | Description |
|---|---|---|
| `default` (< 640px) | Compact bar + "Step N of M" text | Thin `4px` colored progress bar across full width; "Step 2 of 7" text below in `text-xs neutral-600` |
| `sm` (640px–767px) | Compact numbered steps | Step circles (`28px`) with numbers; no labels; active step has `brand-600` fill; completed steps have `CheckCircle` icon |
| `md` (768px–1023px) | Step circles with short labels | `32px` circles; labels truncated to 12 chars; horizontal flow with connecting lines |
| `lg+` (≥ 1024px) | Full step labels | `32px` circles; full step names below (e.g., "Taxpayer Profile", "Gross Receipts"); connecting lines between steps |

**Progress bar component dimensions:**
- Mobile compact bar: `4px` height, `border-radius: 2px`, background `neutral-200`, fill `brand-600`
- Step circle diameter: `28px` (mobile/sm), `32px` (md+)
- Circle border: `2px` `neutral-300` pending; `2px` `brand-600` active; filled `brand-600` completed
- Connecting line height: `2px`; width: fills space between circles; color: `neutral-200` pending, `brand-300` completed

---

## 6. Wizard — Responsive Behavior

### 6.1 Wizard Container

| Breakpoint | Max Width | Padding | Card Shadow |
|---|---|---|---|
| `default` (< 640px) | `100%` | `16px` horizontal, `0px` vertical (no card frame) | None — content is borderless |
| `sm` (640px–767px) | `100%` | `24px` horizontal | None |
| `md` (768px–1023px) | `100%` | `0` (card inside container) | `shadow-sm` |
| `lg+` (≥ 1024px) | `640px` centered | `0` (card) | `shadow-md` |

On mobile (< 768px), the wizard steps render as a flat page — no card border/shadow. The background is `neutral-50`. On tablet/desktop, each step is a white card (`neutral-0`) with `border-radius: radius-xl` (12px) and shadow, centered in the page.

### 6.2 Wizard Step Layout — Field Arrangement

| Breakpoint | Two-Column Fields | Notes |
|---|---|---|
| `default` (< 640px) | Single column (stacked) | All fields stack vertically; no side-by-side |
| `sm` (640px–767px) | Single column | Still stacked |
| `md+` (≥ 768px) | Two-column where specified | Fields with `layout: two-col` in wizard-steps.md appear side by side with `gap: space-6` |

**Fields that use two-column layout on md+ screens:**
- Step WS-01: First Name + Last Name
- Step WS-01: Date of Birth (single field, full width regardless)
- Step WS-03: Tax Year + Quarter (when quarterly mode is selected)
- Step WS-07A: any expense pair that are logically grouped (e.g., Salaries + SSS/PhilHealth/Pag-IBIG contributions)

All other fields are full-width at all breakpoints.

### 6.3 Wizard Navigation Buttons

| Breakpoint | Button Layout |
|---|---|
| `default` (< 768px) | Full width; "Continue" stacked above "Back"; Continue = `48px` height; Back = text link below Continue |
| `md+` (≥ 768px) | Side by side; Back button left (secondary, `160px` min-width); Continue button right (primary, `160px` min-width) |

On mobile, the button stack is `position: sticky; bottom: 0; background: neutral-0; padding: space-4; border-top: 1px solid neutral-200`. This ensures navigation is always reachable without scrolling.

### 6.4 Wizard Step-Specific Responsive Notes

#### Step WS-00: Mode Selection

| Breakpoint | Layout |
|---|---|
| `default` | Two cards stacked vertically; each full width; `80px` tall |
| `sm+` | Two cards side-by-side; each 50% width minus `gap: space-4` |

#### Step WS-02: Business Type (Radio Group)

| Breakpoint | Layout |
|---|---|
| `default` | List of radio options, each a full-width tappable row `56px` tall with icon left, text, and selected indicator right |
| `lg+` | Same layout; max `480px` width, centered |

#### Step WS-04: Gross Receipts (Currency Input)

| Breakpoint | Input width |
|---|---|
| `default` | Full width (100%) |
| `md+` | `320px` — large enough for ₱3,000,000.00 display |

The peso sign prefix (₱) is rendered inside the input field as an inset icon at all breakpoints. The `₱` symbol uses `neutral-600` color and is not part of the typed value.

#### Step WS-07A–D: Itemized Expenses

| Breakpoint | Layout |
|---|---|
| `default` | Each expense category is a full-width input row; section headers visible |
| `md+` | Two-column grid for logically paired items (e.g., salaries + contributions); single column for unpaired items |

**Depreciation assets table (WS-07C):**

| Breakpoint | Table behavior |
|---|---|
| `default` | Collapsed to card-per-row format; each asset is a bordered card showing: asset name, cost, useful life, computed depreciation; Add/Edit/Delete as icon buttons |
| `md+` | Full horizontal table with columns: Asset Description, Cost (₱), Useful Life, Annual Depreciation (₱), Actions |

#### Step WS-08: CWT / Form 2307

| Breakpoint | Table behavior |
|---|---|
| `default` | Each 2307 entry is a card; fields: Payor name, ATC code, amount withheld; Delete icon top-right of card |
| `md+` | Full horizontal table: Payor Name, TIN (optional), ATC, Quarter, Amount Withheld (₱), Remove |

#### Step WS-09: Prior Quarterly Payments

| Breakpoint | Layout |
|---|---|
| `default` | Each quarter is a labeled input row: "Q1 Tax Paid (₱)", "Q2 Tax Paid (₱)", etc.; stacked |
| `md+` | All quarters in a 2×2 grid |

### 6.5 Real-Time Regime Preview (Live Computation)

The wizard displays a mini regime preview panel that updates as the user types. Its responsive behavior:

| Breakpoint | Location |
|---|---|
| `default` (< 1024px) | Collapsed accordion at the bottom of Step WS-04 (after gross receipts entered); user taps "Preview My Tax Estimate" to expand |
| `lg+` (≥ 1024px) | Persistent right sidebar, `240px` wide; sticky within the viewport |

The collapsed accordion version shows:
- Heading: "Live Tax Preview" with `Calculator` icon
- When expanded: three rows (Path A, Path B, Path C) with peso amounts; recommended path badge
- Height when expanded: approximately `180px`

The persistent sidebar version shows:
- Section header: "Live Estimate" in `text-xs font-semibold neutral-500 uppercase`
- Three rows, same as expanded accordion
- Updates in real-time with a `200ms` debounce on any field change

---

## 7. Results Page — Responsive Behavior

### 7.1 Overall Layout

| Breakpoint | Layout |
|---|---|
| `default` (< 1024px) | Single column; all sections stack vertically; action bar sticks to bottom |
| `lg+` (≥ 1024px) | Two-column: main content `col-span-8`, action panel `col-span-4` sticky right |

**Mobile action bar (< 1024px):**
```
┌──────────────────────────────────────────┐
│  [↓ Download PDF]     [New Computation]  │
│  (secondary, 48px)    (primary, 48px)    │
└──────────────────────────────────────────┘
```
- `position: fixed; bottom: 0; left: 0; right: 0; z-index: 40`
- Background: `neutral-0`; top border: `1px solid neutral-200`
- Padding: `space-3` top and bottom, `space-4` horizontal
- Buttons: flex row, each `flex: 1`, `48px` height
- Safe area bottom padding: `env(safe-area-inset-bottom)` added to the fixed bar's bottom padding (see Section 16)

### 7.2 Regime Comparison Table (RV-03)

This is the most critical table in the app. It must be readable on all devices.

| Breakpoint | Layout |
|---|---|
| `default` (< 640px) | Rotated: rows become cards; columns become rows within each card |
| `sm` (640px–767px) | Horizontal table with 4 columns (Row Label + Path A + Path B + Path C), horizontal scroll if needed |
| `md+` (≥ 768px) | Full horizontal table, no scroll needed |

**Card-per-path layout for `default` breakpoint:**

Each path is a full-width card. The recommended path card is visually elevated (border `2px brand-600`, background `brand-50`). Layout within each card:

```
┌─────────────────────────────────────────────────────┐
│  ● Path C — 8% Flat Rate         ★ RECOMMENDED       │
│─────────────────────────────────────────────────────│
│  Gross Receipts         ₱1,500,000.00               │
│  Less: ₱250,000 deduction  (₱250,000.00)            │
│  Taxable Income            ₱1,250,000.00            │
│  Tax Rate                         8%                │
│  ─────────────────────────────────────────          │
│  Income Tax Due            ₱100,000.00              │
│  Percentage Tax Waived              ₱0.00           │
│  ─────────────────────────────────────────          │
│  Total Tax (Path C)        ₱100,000.00              │
│  You save vs. Path B:       ₱38,750.00              │
└─────────────────────────────────────────────────────┘
```

The non-recommended paths are rendered in a collapsed summary:
```
┌─────────────────────────────────────────────────────┐
│  ○ Path A — Graduated + Itemized   Total: ₱142,500  │
│  [Show details ▼]                                   │
└─────────────────────────────────────────────────────┘
```

Tapping "Show details" expands to show all row values for that path.

**Horizontal scroll for `sm` breakpoint:**

When the table width exceeds the viewport at `sm` (640px–767px), a horizontal scroll wrapper is applied:

```html
<div class="overflow-x-auto -mx-4 sm:-mx-6">
  <div class="inline-block min-w-full py-2 align-middle">
    <table class="min-w-full">...</table>
  </div>
</div>
```

A left-right scroll hint shadow is shown: `linear-gradient(to right, transparent, rgba(0,0,0,0.08))` on the right edge of the overflow wrapper when there is overflow content to the right.

### 7.3 Tax Due Breakdown (RV-05)

| Breakpoint | Layout |
|---|---|
| `default` | Vertical list of labeled rows: "Income Tax (Path C): ₱100,000.00", each `48px` tall |
| `md+` | Two-column list (label + amount columns), consistent alignment |

### 7.4 BIR Form Recommendation (RV-09)

| Breakpoint | Layout |
|---|---|
| `default` | Full-width banner card: "You should file Form 1701A" with filing deadline and download button below |
| `md+` | Horizontal card: left: form name + description; right: deadline + button |

### 7.5 Manual Review Flags (RV-11)

| Breakpoint | Layout |
|---|---|
| `default` | Each flag is a full-width info card with icon, title, description, and resolution steps; stacked vertically |
| `lg+` | Same card layout but in a two-column grid when there are 3+ flags |

### 7.6 Path Detail Accordion (RV-12)

| Breakpoint | Behavior |
|---|---|
| `default` | Accordion; closed by default (to reduce initial page length); tap to expand; each step is a row |
| `md+` | Same accordion; open by default on desktop to show full computation transparency |

---

## 8. CPA Dashboard — Responsive Behavior

The CPA dashboard is an Enterprise-tier feature accessed at `/cpa`. It requires a wide screen for full functionality; on narrow screens it degrades gracefully.

### 8.1 Overall Layout

| Breakpoint | Layout |
|---|---|
| `default` (< 768px) | Single column; sidebar hidden; navigation via bottom tab bar |
| `md` (768px–1023px) | Narrow sidebar (icon-only, `64px` wide) + main content |
| `lg+` (≥ 1024px) | Full sidebar (full labels, `240px` wide) + main content |

### 8.2 Mobile Bottom Tab Bar (< 768px)

```
┌─────────────────────────────────────────────────────┐
│  [Clients]  [Computations]  [Calendar]  [Settings]  │
│  (icon+label, each 25% width, 56px tall)            │
└─────────────────────────────────────────────────────┘
```

- `position: fixed; bottom: 0; left: 0; right: 0; z-index: 40`
- Bottom padding: `env(safe-area-inset-bottom)`
- Background: `neutral-0`; top border: `1px solid neutral-200`
- Each tab: icon `20px` centered, label `text-xs` below, `10px` gap
- Active tab: `brand-600` icon and label color; inactive: `neutral-500`

### 8.3 Client List Table

| Breakpoint | Layout |
|---|---|
| `default` | Card-per-client: name large, TIN small below, status badge right, action button |
| `md+` | Full table: Name, TIN, Last Computation, Status, Actions |

### 8.4 Batch Computation Progress

| Breakpoint | Layout |
|---|---|
| `default` | Vertical list of clients processing; progress bar per client |
| `lg+` | Same but in a compact table |

---

## 9. Landing Page — Responsive Behavior

### 9.1 Hero Section

| Breakpoint | Layout |
|---|---|
| `default` (< 768px) | Single column; illustration hidden (replaced by inline icon); headline `text-3xl`; CTA button full width; `space-20` (80px) vertical padding |
| `md` (768px–1023px) | Single column; illustration shown below text, `240px` height; headline `text-4xl` |
| `lg+` (≥ 1024px) | Two column; text 7/12, illustration 5/12; headline `text-5xl`; CTAs horizontal: "Start for Free" primary + "See How It Works" ghost |

**Hero headline on each breakpoint:**
- `default`: `text-3xl` (30px/36px), `font-bold`, `neutral-900`, max-width `100%`
- `md`: `text-4xl` (36px/40px), same weight/color
- `lg+`: `text-5xl` (48px/56px), same weight/color

### 9.2 Feature Cards Section

| Breakpoint | Grid |
|---|---|
| `default` | 1 column; each card full width |
| `md` | 2 columns; `gap: space-6` |
| `lg+` | 3 columns; `gap: space-8` |

### 9.3 Comparison Table (Optimizer vs CPA vs DIY)

| Breakpoint | Layout |
|---|---|
| `default` | Horizontal scroll (`overflow-x: auto`); table minimum width `480px`; row headers pinned left |
| `md+` | Full-width table, no scroll |

### 9.4 FAQ Section

| Breakpoint | Layout |
|---|---|
| `default` | Accordion; all items closed by default |
| `lg+` | Two-column accordion; 4 items per column |

### 9.5 Social Proof / Testimonials

| Breakpoint | Layout |
|---|---|
| `default` | Carousel with dot indicators; 1 testimonial visible at a time; swipe gesture supported |
| `md` | 2 testimonials visible in a flex row |
| `lg+` | 3 testimonials in a grid |

---

## 10. Form Fields — Mobile Behavior

### 10.1 Input `type` and `inputmode` Attributes

The correct `type` and `inputmode` attributes ensure the correct mobile keyboard opens for each field.

| Field | HTML type | inputmode | autocomplete | Notes |
|---|---|---|---|---|
| Email | `email` | `email` | `email` | Opens email keyboard on iOS/Android |
| Password | `password` | (default) | `current-password` or `new-password` | Standard |
| First Name | `text` | `text` | `given-name` | |
| Last Name | `text` | `text` | `family-name` | |
| TIN | `text` | `numeric` | `off` | Numeric keyboard; `text` type keeps leading zeros |
| Gross Receipts | `text` | `decimal` | `off` | Decimal keyboard for peso amounts |
| All peso amount fields | `text` | `decimal` | `off` | See note below |
| Year (tax year) | `text` | `numeric` | `off` | 4-digit year; numeric keyboard |
| OTP code | `text` | `numeric` | `one-time-code` | For email verification |

**Peso amount fields**: All currency inputs use `type="text"` (not `type="number"`) because `type="number"` on iOS does not support comma separators and strips leading behavior. The `inputmode="decimal"` attribute triggers the numeric keyboard with decimal point on mobile. JavaScript handles comma-formatting as the user types.

### 10.2 Currency Input Formatting

```typescript
// Currency input behavior on mobile:
// 1. User types: raw digits only (no commas)
// 2. On change: format with commas for display
// 3. On submit: strip commas before sending to engine
//
// Example: user types "1500000"
// Display: "1,500,000"
// Submitted: 1500000 (number)
```

The formatted value (`1,500,000`) replaces the input value after a `300ms` debounce to avoid disrupting cursor position while typing.

### 10.3 Label Positioning on Mobile

Labels always appear **above** the input, never as floating labels or placeholder-only labels. This avoids the usability issue of placeholder text disappearing when the user focuses the field.

- Label: `text-sm font-medium neutral-900`, `margin-bottom: space-1` (4px) above input
- Placeholder: used only as a secondary hint (e.g., "e.g., ₱1,500,000"), NOT as the primary label

### 10.4 Autocomplete and Password Managers

All login/registration fields have correct `autocomplete` attributes to enable password manager autofill. The tax computation inputs explicitly set `autocomplete="off"` to prevent browsers from inserting stale autofill values into numeric fields.

### 10.5 Keyboard Avoidance

When a keyboard opens on mobile, the wizard step's sticky bottom buttons must remain visible above the keyboard. Implementation:

- On iOS: set `bottom: env(keyboard-inset-height, 0px)` on the sticky button bar (requires the JavaScript `visualViewport` API fallback for older iOS)
- On Android: the browser resizes the visual viewport when the keyboard opens; the sticky bar is positioned relative to `visualViewport` height

**JavaScript implementation:**
```typescript
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    const stickyBar = document.getElementById('wizard-nav-bar');
    if (stickyBar) {
      stickyBar.style.bottom =
        `${window.innerHeight - window.visualViewport.height}px`;
    }
  });
}
```

---

## 11. Data Tables — Responsive Behavior

### 11.1 General Table Strategy

Tables that contain 4+ columns cannot display all columns on mobile without horizontal scrolling or layout transformation. The strategy per table type:

| Table Type | Mobile Strategy |
|---|---|
| Regime Comparison (3 paths × N rows) | Card-per-path layout at `default`; see Section 7.2 |
| Itemized Deductions input | Full-width rows; single column; no horizontal scroll |
| CWT / 2307 entries | Card-per-entry; see Section 6.4 |
| Depreciation assets | Card-per-asset; see Section 6.4 |
| CPA client list | Card-per-client; see Section 8.3 |
| Filing calendar | Month view → single-column list on mobile |
| History / saved computations | Card-per-computation; 3 lines per card (date, regime, tax due) |

### 11.2 Horizontal Scroll Pattern

When horizontal scroll is necessary (e.g., `sm` breakpoint regime comparison), the scroll wrapper uses:

```html
<div class="overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6">
  <table class="min-w-[480px] w-full">...</table>
</div>
```

The negative margin + equal padding (`-mx-4 px-4`) extends the scroll area to the screen edge while keeping the table cells aligned with other content.

### 11.3 Column Priority Hiding

For tables that cannot be converted to card layout, columns hide at smaller breakpoints in priority order (lowest priority hidden first):

**Saved Computations History Table:**

| Column | Priority | Visible at |
|---|---|---|
| Date | 1 (highest) | All breakpoints |
| Tax Regime | 2 | All breakpoints |
| Tax Due (₱) | 3 | All breakpoints |
| Gross Receipts (₱) | 4 | `sm+` (≥ 640px) |
| Filing Period | 5 | `md+` (≥ 768px) |
| Form Type | 6 | `lg+` (≥ 1024px) |
| Actions | Always | All breakpoints |

**BIR Filing Calendar Table:**

| Column | Priority | Visible at |
|---|---|---|
| Due Date | 1 | All breakpoints |
| Form | 2 | All breakpoints |
| Description | 3 | `sm+` (≥ 640px) |
| Coverage Period | 4 | `md+` (≥ 768px) |
| Penalty Date | 5 | `lg+` (≥ 1024px) |

---

## 12. Typography Scaling

### 12.1 Fluid Typography

The font sizes in the design system are fixed (not fluid/clamp). Scale is controlled by applying different utility classes at different breakpoints.

### 12.2 Key Element Typography by Breakpoint

| Element | `default` | `sm` | `md` | `lg+` |
|---|---|---|---|---|
| Landing hero headline | `text-3xl` (30px) | `text-4xl` (36px) | `text-4xl` (36px) | `text-5xl` (48px) |
| Landing hero subheadline | `text-base` (16px) | `text-lg` (18px) | `text-lg` (18px) | `text-xl` (20px) |
| Wizard step title | `text-xl` (20px) | `text-xl` (20px) | `text-2xl` (24px) | `text-2xl` (24px) |
| Wizard field label | `text-sm` (14px) | `text-sm` (14px) | `text-sm` (14px) | `text-sm` (14px) |
| Results page h1 | `text-2xl` (24px) | `text-2xl` (24px) | `text-3xl` (30px) | `text-3xl` (30px) |
| Regime table header | `text-xs` (12px) | `text-sm` (14px) | `text-sm` (14px) | `text-base` (16px) |
| Regime table cell | `text-sm` (14px) | `text-sm` (14px) | `text-sm` (14px) | `text-base` (16px) |
| Savings callout amount | `text-3xl` (30px) | `text-3xl` (30px) | `text-4xl` (36px) | `text-4xl` (36px) |
| Navigation link | `text-base` (16px) drawer | `text-base` (16px) drawer | `text-sm` (14px) topbar | `text-sm` (14px) topbar |
| CPA dashboard sidebar | (hidden) | (hidden) | `text-sm` (14px) icon-only | `text-sm` (14px) full labels |

### 12.3 Line Length Control

For reading comfort, text content blocks (feature descriptions, FAQ answers, disclaimer text) have a maximum width constraint:

- `default` to `md`: full container width (naturally narrow)
- `lg+`: `max-width: 65ch` on prose paragraphs (approximately 65 characters per line)

---

## 13. Images and Illustrations

### 13.1 Hero Illustration

The hero section on the landing page features a SVG illustration of a simplified tax form being computed with a green checkmark.

| Breakpoint | Behavior |
|---|---|
| `default` (< 768px) | Illustration hidden (`hidden md:block`); replaced by a single colored icon band (`Calculator` icon, `64px`, `brand-100` background) |
| `md` (768px–1023px) | Illustration shown below the text, centered, max-width `280px`, height auto |
| `lg+` (≥ 1024px) | Illustration in right column, `5/12` grid width, fills column height, max-height `400px`, SVG scales preserving aspect ratio |

### 13.2 Feature Icons

Feature section icons on the landing page: always visible at all breakpoints. Size adjusts:

| Breakpoint | Icon container | Icon size |
|---|---|---|
| `default` | `48px × 48px`, `brand-100` background, `radius-lg` | `icon-md` (24px) |
| `md+` | `56px × 56px`, `brand-100` background, `radius-lg` | `icon-lg` (32px) |

### 13.3 OG / Social Images

Open Graph images are static pre-rendered images (`1200px × 630px`). Not responsive — always served at full size to social crawlers. Served from `/public/og-image.png`.

### 13.4 Favicon and App Icons

| Asset | Size | Format | Usage |
|---|---|---|---|
| `/public/favicon.ico` | 32×32 | ICO (contains 16×16 and 32×32) | Browser tab |
| `/public/favicon-16x16.png` | 16×16 | PNG | Legacy fallback |
| `/public/favicon-32x32.png` | 32×32 | PNG | Modern browsers |
| `/public/apple-touch-icon.png` | 180×180 | PNG | iOS home screen bookmark |
| `/public/android-chrome-192x192.png` | 192×192 | PNG | Android home screen |
| `/public/android-chrome-512x512.png` | 512×512 | PNG | Android splash screen |

All favicon assets are pre-generated from the SVG logo source. They are not generated dynamically.

---

## 14. Sticky and Fixed Elements

### 14.1 Inventory of Sticky/Fixed Elements

| Element | CSS Position | Sticky/Fixed Condition | Z-index | Mobile Behavior |
|---|---|---|---|---|
| Global top nav | `sticky` | Always | `z-50` (50) | Same: `sticky top-0` |
| Wizard nav buttons | `sticky` | `bottom-0`, always in wizard | `z-40` (40) | Sticks to bottom, above keyboard |
| Results action bar | `fixed` | `bottom-0`, on results page, `< 1024px` only | `z-40` (40) | Replaces right sidebar |
| Results action panel | `sticky` | `top: 88px`, results page, `≥ 1024px` only | `z-10` (10) | Hidden on mobile |
| CPA bottom tab bar | `fixed` | `bottom-0`, CPA dashboard, `< 768px` only | `z-40` (40) | Replaces sidebar |
| Toast notifications | `fixed` | `top: 80px; right: 16px` | `z-60` (60) | `top: 80px; left: 16px; right: 16px` on mobile (full width) |

### 14.2 Sticky Overlap Avoidance

Page content must not be hidden behind sticky/fixed elements. Required padding:

- Pages with sticky top nav: main content has `padding-top: 0` (the sticky nav takes its height from flow); this works because `sticky` elements are in flow.
- Pages with fixed bottom bars (results on mobile, CPA dashboard on mobile): main content area has `padding-bottom: calc(80px + env(safe-area-inset-bottom))` to prevent last content being hidden behind the bar.
- The `80px` accounts for the action bar height (`56px`) + top border (`1px`) + internal padding (`12px top + 12px bottom`).

---

## 15. Gesture Support

### 15.1 Supported Gestures

| Gesture | Where | Action |
|---|---|---|
| Swipe right | Mobile drawer (when open) | Closes the drawer |
| Swipe left/right | Landing page testimonials carousel | Navigates to next/previous testimonial |
| Pull-to-refresh | History page (saved computations list) | Refreshes the list from server |
| Tap outside modal | Modal overlay | Closes modal (same as close button) |
| Long press | Saved computation card | Context menu: Edit, Duplicate, Delete |
| Pinch-to-zoom | No suppression | Default browser zoom allowed (WCAG requirement) |

### 15.2 Gesture Implementation

All swipe gestures use the `@use-gesture/react` library (version 10.x). Swipe threshold: `velocity: 0.5, distance: 50px`. No custom swipe implementation to avoid reinventing pointer event handling.

Pinch-to-zoom: NOT prevented. The viewport meta tag does NOT include `user-scalable=no` (which is prohibited by WCAG 1.4.4 Resize Text and WCAG 2.5.4 Motion Actuation). Users can zoom the entire page at will.

### 15.3 Touch Feedback

All tappable elements have a touch highlight:

```css
/* Applied globally */
button, a, [role="button"] {
  -webkit-tap-highlight-color: rgba(59, 130, 246, 0.15); /* brand-500 at 15% opacity */
  tap-highlight-color: rgba(59, 130, 246, 0.15);
}
```

Pressed state: `active:scale-[0.98]` applied to primary and secondary buttons via Tailwind (slight scale-down gives physical press feedback).

---

## 16. Safe Areas (Notch and Home Indicator)

### 16.1 CSS Environment Variables

iPhones with Face ID (notch/Dynamic Island) and the home indicator at the bottom require safe area padding. The viewport meta tag must include `viewport-fit=cover` (see Section 3.1) for these variables to be non-zero.

```css
/* Safe area custom properties */
:root {
  --safe-area-inset-top: env(safe-area-inset-top, 0px);
  --safe-area-inset-right: env(safe-area-inset-right, 0px);
  --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
  --safe-area-inset-left: env(safe-area-inset-left, 0px);
}
```

### 16.2 Where Safe Area Insets Are Applied

| Element | Inset Applied | CSS |
|---|---|---|
| Global top nav | Top | `padding-top: env(safe-area-inset-top, 0px)` |
| Fixed bottom action bar (results) | Bottom | `padding-bottom: env(safe-area-inset-bottom, 0px)` |
| Fixed bottom CPA tab bar | Bottom | `padding-bottom: env(safe-area-inset-bottom, 0px)` |
| Sticky wizard nav buttons | Bottom | `padding-bottom: calc(space-4 + env(safe-area-inset-bottom, 0px))` |
| Slide-in drawer | Top + Bottom | top padding `env(safe-area-inset-top)`, bottom padding `env(safe-area-inset-bottom)` |

### 16.3 Top Nav Height on iPhone with Notch

On iPhones with a notch, the top nav effectively becomes taller:
- Base nav height: `64px`
- With notch: `64px + env(safe-area-inset-top)` (typically adds `44px–59px` on iPhone 14/15 Pro)

The nav height is not hardcoded for this reason. It is specified as `min-height: 64px` with `padding-top: env(safe-area-inset-top, 0px)`. Content inside uses flex centering.

---

## 17. Performance Constraints for Mobile

### 17.1 Mobile Performance Budget

The application must meet these performance thresholds on a mid-range Android device (Moto G Power equivalent) on a 4G connection:

| Metric | Target | Measurement Tool |
|---|---|---|
| First Contentful Paint (FCP) | ≤ 1.8s | Lighthouse, PageSpeed Insights |
| Largest Contentful Paint (LCP) | ≤ 2.5s | Lighthouse |
| Time to Interactive (TTI) | ≤ 3.5s | Lighthouse |
| Cumulative Layout Shift (CLS) | ≤ 0.1 | Lighthouse |
| First Input Delay (FID) | ≤ 100ms | CrUX data |
| JavaScript bundle (initial) | ≤ 150KB gzipped | Webpack/Next.js bundle analyzer |
| CSS bundle (initial) | ≤ 20KB gzipped | PostCSS output |

### 17.2 Responsive Image Delivery

All images served at appropriate sizes via `srcset`:

```html
<!-- Hero illustration example (not shown on mobile, so no srcset needed) -->
<img
  src="/images/hero-illustration-480.webp"
  srcset="
    /images/hero-illustration-480.webp 480w,
    /images/hero-illustration-960.webp 960w
  "
  sizes="(max-width: 1024px) 0px, 5fr"
  alt="Tax computation illustration showing three regime comparison results"
  width="480"
  height="320"
  loading="eager"
/>
```

All non-hero images use `loading="lazy"`.

### 17.3 Conditional Loading

Heavy components (CPA dashboard charts, PDF export preview) are code-split and loaded only when needed:

```typescript
// Dynamic import for PDF preview (not loaded on initial page)
const PDFPreview = dynamic(() => import('@/components/PDFPreview'), {
  loading: () => <div className="h-32 bg-neutral-100 animate-pulse rounded-lg" />,
  ssr: false,
});
```

### 17.4 CSS Optimization

Tailwind's `purge`/`content` configuration removes all unused utility classes from production builds. The final CSS bundle for the wizard + results screens should not exceed 20KB gzipped.

---

## 18. Screen-by-Screen Responsive Matrix

This table lists every distinct screen in the application and its responsive behavior at each breakpoint.

| Screen | Route | `default` Layout | `sm` Layout | `md` Layout | `lg+` Layout |
|---|---|---|---|---|---|
| Landing page | `/` | Single-col, hero stacked, no illustration | Single-col, larger hero text | Two-col hero (text + illustration below) | Two-col hero 7/5, full feature grid 3-col |
| Login | `/login` | Full-width card, stacked form | Same | Centered card `480px` max-width | Centered card `480px` max-width |
| Register | `/register` | Full-width card, stacked form | Same | Centered card `480px` max-width | Centered card `480px` max-width |
| Forgot password | `/forgot-password` | Full-width form, single email field | Same | Centered card `480px` | Centered card `480px` |
| Wizard (WS-00 to WS-13) | `/compute` | Full-width, borderless step, sticky bottom nav | Same, 24px side padding | Card in container, side-by-side nav buttons | Card `640px` centered, persistent live preview sidebar |
| Results page | `/results/:id` | Single-col, card-per-path table, fixed bottom action bar | Horizontal scroll on regime table | Same as sm but wider containers | Two-col main/action, open accordion by default |
| History (saved computations) | `/history` | Card list, no table | Same | Table layout, column hiding | Full table, all columns |
| Filing calendar | `/calendar` | Month view (single month), list on tap day | Same | Month grid with inline events | Two-month calendar, sidebar with upcoming list |
| Account settings | `/account` | Stacked sections, full-width inputs | Same | `640px` max-width card | Same |
| Billing / Subscription | `/billing` | Stacked tier cards | Two tier cards side-by-side | Three tier cards or two+one | Three-column tier comparison table |
| CPA Dashboard — Clients | `/cpa/clients` | Card list, bottom tab nav | Same | Narrow icon sidebar + card list | Full sidebar + table |
| CPA Dashboard — New Computation | `/cpa/clients/:id/compute` | Same as `/compute` wizard, with client context banner at top | Same | Same | Same |
| CPA Dashboard — Reports | `/cpa/reports` | Stacked metric cards | Two-col cards | Three-col cards | Three-col cards + sidebar filters |
| Error page (404) | `/404` | Full-width centered message, single CTA | Same | Centered within container | Same |
| Error page (500) | `/500` | Full-width centered message, single CTA | Same | Centered within container | Same |
| Email verification | `/verify-email` | Full-width centered OTP form | Same | Centered card `400px` | Same |

---

*Document complete. All breakpoints, touch targets, component behaviors, and screen-by-screen transformations are fully specified. See [ui/accessibility.md](accessibility.md) for ARIA and keyboard navigation specifications that complement this responsive design spec.*
