# Analysis: Design System — RA 7641 Retirement Pay Calculator

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** design-system
**Date:** 2026-03-06
**Sources:** results-view.md, shared-components.md, wizard-steps.md, nlrc-worksheet-ui.md, batch-upload-ui.md

---

## Overview

The design system defines the visual language for a **labor law compliance application**. The tone
is professional, trustworthy, and authoritative — like a law firm's internal tool, not a consumer
fintech app. Colors signal meaning: green = correct/compliant, amber = attention/underpayment,
red = deficit/ineligible, blue = informational/legal context.

**Tech stack:** shadcn/ui + Radix UI primitives + Tailwind CSS 4. No custom component library —
only shadcn component wrappers with consistent class patterns.

---

## 1. Color Palette

### CSS Custom Properties

Define in `apps/retirement-pay/frontend/src/index.css` (Tailwind CSS 4 `@layer base`):

```css
/* apps/retirement-pay/frontend/src/index.css */

@import "tailwindcss";
@import "@shadcn/ui/styles";

@layer base {
  :root {
    /* shadcn/ui base tokens (oklch color space for Tailwind CSS 4) */
    --background: oklch(1 0 0);            /* white */
    --foreground: oklch(0.145 0 0);        /* near-black gray-900 */
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.145 0 0);
    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.145 0 0);
    --primary: oklch(0.205 0 0);           /* gray-900 — main CTA buttons */
    --primary-foreground: oklch(0.985 0 0);
    --secondary: oklch(0.97 0 0);          /* gray-50 — secondary buttons */
    --secondary-foreground: oklch(0.205 0 0);
    --muted: oklch(0.97 0 0);
    --muted-foreground: oklch(0.556 0 0);  /* gray-500 */
    --accent: oklch(0.97 0 0);
    --accent-foreground: oklch(0.205 0 0);
    --destructive: oklch(0.577 0.245 27.325);  /* red-600 */
    --destructive-foreground: oklch(0.985 0 0);
    --border: oklch(0.922 0 0);            /* gray-200 */
    --input: oklch(0.922 0 0);
    --ring: oklch(0.708 0 0);              /* gray-400 */
    --radius: 0.5rem;

    /* === Application-specific semantic tokens === */

    /* Correct computation (22.5-day formula) */
    --color-correct: oklch(0.627 0.194 149.214);   /* green-600 */
    --color-correct-bg: oklch(0.969 0.015 149.214); /* green-50 */
    --color-correct-border: oklch(0.792 0.077 149.214); /* green-300 */
    --color-correct-text: oklch(0.449 0.15 149.214);    /* green-800 */

    /* Underpayment / attention */
    --color-underpay: oklch(0.769 0.188 70.08);    /* amber-500 */
    --color-underpay-bg: oklch(0.987 0.022 95.277); /* amber-50 */
    --color-underpay-border: oklch(0.863 0.092 88.364); /* amber-300 */
    --color-underpay-text: oklch(0.414 0.112 70.08);    /* amber-900 */

    /* Error / ineligible / deficit */
    --color-error: oklch(0.577 0.245 27.325);      /* red-600 */
    --color-error-bg: oklch(0.971 0.013 17.38);    /* red-50 */
    --color-error-border: oklch(0.769 0.128 22.07); /* red-300 */
    --color-error-text: oklch(0.396 0.195 27.325);  /* red-800 */

    /* Legal citation / informational */
    --color-legal: oklch(0.546 0.245 262.881);     /* blue-600 */
    --color-legal-bg: oklch(0.97 0.014 254.604);   /* blue-50 */
    --color-legal-border: oklch(0.789 0.097 258.659); /* blue-300 */
    --color-legal-text: oklch(0.379 0.146 265.522);   /* blue-800 */

    /* Warning / partial compliance */
    --color-warning: oklch(0.661 0.173 89.876);    /* yellow-600 */
    --color-warning-bg: oklch(0.987 0.026 102.212); /* yellow-50 */
    --color-warning-border: oklch(0.852 0.128 90.74); /* yellow-300 */
    --color-warning-text: oklch(0.421 0.111 90.34);   /* yellow-800 */
  }

  .dark {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    --card: oklch(0.205 0 0);
    --card-foreground: oklch(0.985 0 0);
    --popover: oklch(0.205 0 0);
    --popover-foreground: oklch(0.985 0 0);
    --primary: oklch(0.985 0 0);
    --primary-foreground: oklch(0.205 0 0);
    --secondary: oklch(0.269 0 0);
    --secondary-foreground: oklch(0.985 0 0);
    --muted: oklch(0.269 0 0);
    --muted-foreground: oklch(0.708 0 0);
    --accent: oklch(0.269 0 0);
    --accent-foreground: oklch(0.985 0 0);
    --destructive: oklch(0.704 0.191 22.216);
    --destructive-foreground: oklch(0.985 0 0);
    --border: oklch(0.269 0 0);
    --input: oklch(0.269 0 0);
    --ring: oklch(0.556 0 0);
  }
}
```

### Semantic Color Usage Map

| Context | Background | Border | Text | Icon |
|---------|------------|--------|------|------|
| Eligible / Correct amount (22.5-day) | `bg-green-50` | `border-green-500` | `text-green-800` | `text-green-600` |
| Underpayment highlight | `bg-amber-50` | `border-amber-200` | `text-amber-900` | `text-amber-700` |
| Ineligible / Gap / Deficit | `bg-red-50` | `border-red-500` | `text-red-800` | `text-red-600` |
| Legal citation / Info | `bg-blue-50` | `border-blue-200` | `text-blue-800` | `text-blue-500` |
| Warning / Partial | `bg-yellow-50` | `border-yellow-500` | `text-yellow-800` | `text-yellow-600` |
| Erroneous 15-day amount | `bg-white` | `border-gray-200` | `text-gray-400 line-through` | — |
| Neutral data rows | — | — | `text-gray-600` | `text-gray-400` |
| Total / Emphasis rows | `bg-green-50` | `border-t-2` | `text-green-800 font-bold` | — |

### Do NOT Use

- Purple, pink, or cyan — outside the defined semantic palette
- Raw hex colors in JSX (always use Tailwind classes or CSS custom properties)
- `text-black` — use `text-gray-900` or `text-foreground`
- Pure `white` / `black` backgrounds — use `bg-background` or `bg-white`

---

## 2. Typography

### Font Stack

```css
/* In tailwind.config.ts (Tailwind CSS 4 with @config) */
/* Or directly in CSS @layer base */

@layer base {
  :root {
    font-family:
      "Inter",
      ui-sans-serif,
      system-ui,
      -apple-system,
      "Segoe UI",
      sans-serif;
  }
}
```

Install Inter: `npm install @fontsource-variable/inter`

```tsx
// apps/retirement-pay/frontend/src/main.tsx
import "@fontsource-variable/inter";
```

### Monospace Font (for money amounts)

Money values rendered with `font-mono` use the system monospace stack:

```
font-family: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace;
```

No additional monospace font install needed — system fonts suffice.

### Type Scale

| Class | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `text-2xl font-bold` | 24px / 1.5rem | 700 | 1.2 | Page titles (employee name, page heading) |
| `text-xl font-semibold` | 20px / 1.25rem | 600 | 1.4 | Section headings in NLRC worksheet |
| `text-lg font-bold font-mono` | 18px / 1.125rem | 700 | 1.4 | Underpayment delta amount in amber card |
| `text-base font-bold` | 16px / 1rem | 700 | 1.5 | Card titles (`CardTitle`), final result rows |
| `text-base font-semibold` | 16px / 1rem | 600 | 1.5 | Form labels for major sections |
| `text-sm` | 14px / 0.875rem | 400 | 1.5 | Body text, table cell content, descriptions |
| `text-sm font-medium` | 14px / 0.875rem | 500 | 1.5 | Row labels in breakdown tables |
| `text-sm font-mono` | 14px / 0.875rem | 400 | 1.5 | Monetary values in table cells |
| `text-xs` | 12px / 0.75rem | 400 | 1.5 | Helper text, hints, error messages, footnotes |
| `text-xs font-medium` | 12px / 0.75rem | 500 | 1.5 | Semantic labels above comparison columns |
| `text-2xl font-bold font-mono` | 24px / 1.5rem | 700 | 1.2 | Hero money amounts in UnderpaymentHighlightCard |

### Money Formatting Rule

All monetary values in display use `font-mono`. Large hero amounts use `text-2xl font-bold font-mono`.
Table amounts use `text-sm font-mono`. The `₱` symbol is NOT monospace (part of label prefix, not value).

### Text Color Hierarchy

| Class | Purpose |
|-------|---------|
| `text-gray-900` / `text-foreground` | Primary text — headings, labels |
| `text-gray-700` | Body content |
| `text-gray-600` | Secondary labels in table cells |
| `text-gray-500` | Helper/hint text, metadata |
| `text-gray-400` | Placeholder text, subtle footnotes |

---

## 3. Spacing System

Tailwind CSS 4 spacing scale (4px base unit). Specific patterns used across the app:

### Card Internal Spacing

```
Card > CardHeader: pb-2 (removes default bottom padding, tightens header-to-content gap)
Card > CardContent: (default pt-0 after pb-2 CardHeader = 0 gap)
```

### Page Layout

```
max-w-3xl mx-auto py-8 px-4 space-y-6
```

- Max width 3xl (48rem / 768px) — keeps computation layout readable
- `space-y-6` between result cards (24px vertical gap)
- `py-8 px-4` page padding (32px top/bottom, 16px sides on mobile)

### Form Layout (Wizard Steps)

```
space-y-4           — between form field groups
space-y-1.5         — within each field (label → input → hint/error)
gap-4               — grid columns for side-by-side fields
grid-cols-2         — used for date fields, salary+allowance combos
```

### Table Internal Spacing (shadcn Table)

```
TableCell: px-4 py-3          — default
TableCell (sub-item): pl-8    — indented sub-rows (15-day, SIL, 13th month in breakdown)
TableHead: px-4 py-3 font-medium text-gray-600 text-sm
```

### Button Spacing

```
flex gap-2          — between buttons in a button row (header actions)
flex gap-3          — between buttons in ResultsActionsRow
flex flex-wrap gap-3 — wrapping button rows on narrow viewports
```

---

## 4. shadcn/ui Component Configuration

### Installation

```bash
npx shadcn@latest init
```

Configuration at `apps/retirement-pay/frontend/components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "gray",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### Required shadcn Components (install via `npx shadcn@latest add <name>`)

| Component | Used By | Install Command |
|-----------|---------|-----------------|
| `alert` | TaxTreatmentAlert, EligibilityBadgeCard, CompanyPlanComparisonCard, SharedResultsPage | `add alert` |
| `alert-dialog` | ResultsActionsRow delete confirm | `add alert-dialog` |
| `badge` | EligibilityBadgeCard, SeparationPayComparisonCard, ComparisonTable | `add badge` |
| `button` | All interactive elements | `add button` |
| `card` | Every result card, wizard step container, batch summary | `add card` |
| `dialog` | ShareDialog | `add dialog` |
| `input` | MoneyInput, DateInput | `add input` |
| `label` | MoneyInput, DateInput, EnumSelect | `add label` |
| `progress` | Batch upload progress bar | `add progress` |
| `select` | EnumSelect | `add select` |
| `separator` | Sidebar navigation | `add separator` |
| `skeleton` | ResultsPageSkeleton, DashboardSkeleton | `add skeleton` |
| `table` | PayBreakdownCard, ComparisonTable, BatchResultsTable, NlrcWorksheetDisplay | `add table` |
| `tabs` | BatchResultsPage (Summary / By Employee tabs) | `add tabs` |
| `toast` / `sonner` | Toast notifications for save/delete/share/PDF | `add sonner` |
| `tooltip` | Icon buttons without text labels | `add tooltip` |

**Note:** Use **sonner** (via `npx shadcn@latest add sonner`) not the older `toast` component.
Sonner integrates with `react-hot-toast` patterns. Call `toast.success()`, `toast.error()` from `sonner`.

Import: `import { toast } from "sonner";`
Root provider: `<Toaster />` in `apps/retirement-pay/frontend/src/main.tsx` inside `<RouterProvider>`.

### shadcn/ui Component Variants in Use

**Badge variants used:**
```tsx
<Badge variant="default">     // green-ish primary — "Eligible", "Higher", "Recommended"
<Badge variant="secondary">   // gray — "Optional", informational badges
<Badge variant="destructive"> // red — "Ineligible", error badges
<Badge variant="outline">     // outline — neutral labels in batch table
```

**Button variants used:**
```tsx
<Button variant="default">   // black primary — "Compute", "Save", submit actions
<Button variant="outline">   // bordered — secondary actions (Edit, NLRC Worksheet)
<Button variant="ghost">     // no border — Delete (red text override), icon-only
<Button variant="secondary"> // gray fill — "New Computation", back buttons
```

Button sizes used: `size="default"` for primary submit, `size="sm"` for all action rows.

**Alert variants used:**
```tsx
<Alert>                          // default — informational (share banner, legal tips)
<Alert variant="destructive">    // red — company plan gap, ineligibility, taxable amount
// Custom className overrides for green/amber/yellow — shadcn Alert accepts className
<Alert className="border-green-500 bg-green-50"> // eligible, sufficient plan
<Alert className="border-amber-300 bg-amber-50"> // underpayment highlight context
<Alert className="border-yellow-500 bg-yellow-50"> // partial exemption warning
```

---

## 5. Component Patterns

### Pattern 1: Semantic Color Card (Card with colored left border)

Used for: EligibilityBadgeCard, CompanyPlanComparisonCard

```tsx
<Card className="border-l-4 border-green-500">
  <CardHeader className="pb-2">
    <CardTitle className="text-base flex items-center gap-2">
      <CheckCircle2 className="w-5 h-5 text-green-600" />
      Eligible for Retirement Pay
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>
```

Color variants:
- Eligible: `border-green-500`, icon `text-green-600`
- Warning: `border-yellow-500`, icon `text-yellow-600`
- Ineligible: `border-red-500`, icon `text-red-600`
- Info: `border-blue-200`, icon `text-blue-500`

### Pattern 2: Highlight Card (Colored background card)

Used for: UnderpaymentHighlightCard

```tsx
<Card className="bg-amber-50 border-amber-200">
  <CardHeader className="pb-3">
    <CardTitle className="text-base flex items-center gap-2">
      <TrendingUp className="w-4 h-4 text-amber-700" />
      Title
    </CardTitle>
    <CardDescription className="text-amber-800 text-xs">
      Subtitle text
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>
```

### Pattern 3: Wizard Step Container

Used for: All 5 wizard steps

```tsx
<Card className="max-w-2xl mx-auto">
  <CardHeader>
    <div className="flex items-center gap-3 mb-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white text-sm font-bold">
        {stepNumber}
      </div>
      <div>
        <CardTitle className="text-lg">{stepTitle}</CardTitle>
        <CardDescription>{stepSubtitle}</CardDescription>
      </div>
    </div>
    {/* Progress indicator */}
    <div className="flex gap-1 mt-2">
      {[1, 2, 3, 4, 5].map((s) => (
        <div
          key={s}
          className={cn(
            "h-1 flex-1 rounded-full",
            s < stepNumber ? "bg-gray-900" : s === stepNumber ? "bg-gray-600" : "bg-gray-200"
          )}
        />
      ))}
    </div>
  </CardHeader>
  <CardContent>
    {/* form fields */}
  </CardContent>
  <CardFooter className="flex justify-between">
    {/* Back / Next buttons */}
  </CardFooter>
</Card>
```

### Pattern 4: Data Breakdown Table

Used for: PayBreakdownCard, NLRC Worksheet breakdown section

```tsx
<Table>
  <TableBody>
    {/* Normal data row */}
    <TableRow>
      <TableCell className="text-sm text-gray-600">Label</TableCell>
      <TableCell className="text-right text-sm font-mono">{formatCentavos(value)}</TableCell>
    </TableRow>
    {/* Indented sub-row (15-day, SIL, 13th month components) */}
    <TableRow>
      <TableCell className="text-sm text-gray-600 pl-8">Sub-item label</TableCell>
      <TableCell className="text-right text-sm font-mono">{formatCentavos(value)}</TableCell>
    </TableRow>
    {/* Total row with separator */}
    <TableRow className="border-t-2">
      <TableCell className="text-sm font-medium">Total</TableCell>
      <TableCell className="text-right text-sm font-mono font-medium">{formatCentavos(total)}</TableCell>
    </TableRow>
    {/* Grand total row with highlight */}
    <TableRow className="border-t-2 bg-green-50">
      <TableCell className="text-base font-bold text-green-800">Grand Total</TableCell>
      <TableCell className="text-right text-base font-bold font-mono text-green-800">
        {formatCentavos(grandTotal)}
      </TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Pattern 5: Form Field Group

Used for: All shared input components (MoneyInput, DateInput, EnumSelect)

```tsx
<div className="space-y-1.5">
  <Label htmlFor={id} className={cn(error && "text-red-600")}>
    {label}
  </Label>
  {/* Input component */}
  {hint && !error && (
    <p className="text-xs text-gray-500">{hint}</p>
  )}
  {error && (
    <p className="text-xs text-red-600">{error}</p>
  )}
</div>
```

### Pattern 6: Action Button Row

Used for: ResultsActionsRow, wizard navigation, batch export

```tsx
<div className="flex flex-wrap gap-3 pt-2 border-t mt-2">
  {/* Primary / most common actions first */}
  <Button variant="outline" size="sm">
    <FileText className="w-4 h-4 mr-1" /> Label
  </Button>
  {/* Destructive action — right-aligned */}
  <div className="ml-auto">
    <Button
      variant="ghost"
      size="sm"
      className="text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      <Trash2 className="w-4 h-4 mr-1" /> Delete
    </Button>
  </div>
</div>
```

### Pattern 7: Empty State

Used for: Dashboard (no computations), Batch (no file), Org (no members)

```tsx
<div className="text-center py-12">
  <div className="mx-auto w-12 h-12 text-gray-300 mb-4">
    <FileQuestion className="w-full h-full" />
  </div>
  <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
  <p className="text-sm text-gray-500 mb-4">{description}</p>
  {actionButton}
</div>
```

### Pattern 8: Legal Citation Block

Used for: NLRC Worksheet, Results breakdown footer

```tsx
<div className="border-l-4 border-blue-200 bg-blue-50 rounded-r-md px-4 py-3 text-sm text-gray-700">
  <div className="flex items-center gap-2 mb-1">
    <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
    <span>
      <strong className="text-gray-900">RA 7641</strong>, <em>Sec. 1</em>
      <span className="text-gray-500 text-xs"> — Retirement Pay Law</span>
    </span>
  </div>
  <blockquote className="text-xs text-gray-600 italic mt-1 leading-relaxed">
    &ldquo;one-half (1/2) month salary shall include...&rdquo;
  </blockquote>
</div>
```

---

## 6. Lucide Icon Assignments

All icons from `lucide-react`. Consistent icon-to-meaning mapping:

| Icon | Import | Meaning / Component |
|------|--------|---------------------|
| `CheckCircle2` | `lucide-react` | Eligible, sufficient, success |
| `AlertTriangle` | `lucide-react` | Warning, partial compliance, underpayment |
| `XCircle` | `lucide-react` | Ineligible, not found, error |
| `TrendingUp` | `lucide-react` | Underpayment highlight card header |
| `Calculator` | `lucide-react` | PayBreakdownCard header |
| `Scale` | `lucide-react` | SeparationPayComparisonCard, inline LegalCitation |
| `BookOpen` | `lucide-react` | Block LegalCitation, NLRC legal basis |
| `Building2` | `lucide-react` | CompanyPlanComparisonCard, org settings |
| `FileText` | `lucide-react` | NLRC Worksheet button, computation list item |
| `Download` | `lucide-react` | PDF Export button, CSV download |
| `Upload` | `lucide-react` | CsvUploader drop zone |
| `FileSpreadsheet` | `lucide-react` | CsvUploader selected state |
| `CalendarDays` | `lucide-react` | DateInput calendar trigger |
| `ShieldCheck` | `lucide-react` | TaxTreatmentAlert — fully exempt |
| `ShieldAlert` | `lucide-react` | TaxTreatmentAlert — partially exempt |
| `ShieldX` | `lucide-react` | TaxTreatmentAlert — fully taxable |
| `Pencil` | `lucide-react` | Edit button |
| `Trash2` | `lucide-react` | Delete button |
| `Plus` | `lucide-react` | New Computation button |
| `Share2` | `lucide-react` | Share button, share mode banner |
| `Loader2` | `lucide-react` | Loading spinner (animate-spin class) |
| `X` | `lucide-react` | Close / Remove (CsvUploader clear button) |
| `Users` | `lucide-react` | Organization sidebar nav item |
| `Settings` | `lucide-react` | Settings sidebar nav item |
| `LayoutDashboard` | `lucide-react` | Dashboard sidebar nav item |
| `LogOut` | `lucide-react` | Sign out button in sidebar footer |
| `ChevronRight` | `lucide-react` | Wizard step progress indicator |
| `FileQuestion` | `lucide-react` | Empty state illustrations |
| `BarChart3` | `lucide-react` | Batch results summary card |

Icon sizing conventions:
- `w-3 h-3` — inline icons in small text (xs)
- `w-4 h-4` — standard action icons, card header icons
- `w-5 h-5` — eligibility badge card status icon
- `w-8 h-8` — drop zone illustration icon, empty state
- `w-12 h-12` — empty state large illustration

---

## 7. Layout Structure

### Application Shell

```
+--------------------------------------------------+
| TopBar (mobile only): hamburger + app logo        |
+------------------+-------------------------------+
| Sidebar          | Main Content Area             |
| (desktop ≥ lg)   | max-w-3xl mx-auto py-8 px-4   |
|                  |                               |
| Logo             |  [Page Content]               |
| Nav links        |                               |
| ---              |                               |
| Org switcher     |                               |
| User/sign out    |                               |
+------------------+-------------------------------+
```

Responsive breakpoints:
- `< lg` (< 1024px): sidebar hidden, top bar visible with drawer
- `≥ lg` (≥ 1024px): sidebar always visible, no top bar

### Sidebar Width and Classes

```tsx
<aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white">
  {/* Sidebar content */}
</aside>
<main className="lg:pl-64">
  {/* Page content */}
</main>
```

### Content Widths

| Context | Max Width | Class |
|---------|-----------|-------|
| Single computation wizard | 672px | `max-w-2xl mx-auto` |
| Results view | 768px | `max-w-3xl mx-auto` |
| Batch results table | Full width minus sidebar | `w-full` |
| NLRC worksheet (print) | 672px | `max-w-2xl mx-auto` |
| Auth pages | 448px | `max-w-md mx-auto` |
| Landing page sections | 1024px | `max-w-4xl mx-auto` |

---

## 8. Tailwind CSS 4 Configuration

### `tailwind.config.ts`

```typescript
// apps/retirement-pay/frontend/tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["InterVariable", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "Cascadia Code", "Source Code Pro", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "oklch(var(--background) / <alpha-value>)",
        foreground: "oklch(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "oklch(var(--card) / <alpha-value>)",
          foreground: "oklch(var(--card-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground) / <alpha-value>)",
        },
        border: "oklch(var(--border) / <alpha-value>)",
        input: "oklch(var(--input) / <alpha-value>)",
        ring: "oklch(var(--ring) / <alpha-value>)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## 9. Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Color contrast (WCAG AA) | All foreground/background pairs meet 4.5:1. `text-gray-600` on white = 5.74:1. `text-green-800` on `bg-green-50` = 7.2:1. `text-amber-900` on `bg-amber-50` = 9.1:1. |
| Focus rings | shadcn default `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` on all interactive elements. |
| Motion sensitivity | `animate-spin` on Loader2 only (async operations < 2 seconds). No auto-playing animations. |
| Screen reader labels | `sr-only` labels on icon-only buttons. `aria-label` on MoneyInput with `labelHidden`. `aria-invalid` + `aria-describedby` on all form fields. |
| Table semantics | All tables use `<Table>`, `<TableHeader>`, `<TableHead>`, `<TableBody>`, `<TableRow>`, `<TableCell>`. `<TableCaption className="sr-only">` on non-visual tables. |
| Print styles | NLRC worksheet print view: `@media print { .no-print { display: none; } .print-only { display: block; } }`. Sidebar, action buttons hidden in print. |

---

## 10. Summary

**Palette:** Five semantic color roles (correct/green, underpayment/amber, error/red, legal/blue, warning/yellow) with consistent bg/border/text/icon variants. Neutral gray scale for text hierarchy.

**Typography:** Inter variable font, monospace for all money values, five-level text size hierarchy from `text-xs` (hints) to `text-2xl font-bold` (page titles and hero amounts).

**Spacing:** 4px base unit. `space-y-6` between result cards, `space-y-4` between form fields, `space-y-1.5` within each field. `max-w-3xl` for results, `max-w-2xl` for wizard.

**Components:** 15 shadcn components installed. 8 named design patterns cover every UI surface in the app. Sonner for toasts. Lucide for all icons with consistent 26-icon vocabulary.

**Tailwind CSS 4:** oklch color space, InterVariable font, `tailwindcss-animate` plugin, CSS custom properties for all semantic tokens, dark mode via `class` strategy.
