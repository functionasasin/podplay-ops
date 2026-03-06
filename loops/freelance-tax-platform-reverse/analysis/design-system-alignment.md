# Design System Alignment — TaxKlaro

**Wave:** 5 (Component Wiring + UI)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** component-wiring-map, visual-verification-checklist, action-trigger-map

---

## Purpose

Adapt the TaxKlaro design system (from `ui/design-system.md`) to the shadcn/ui + Radix + Tailwind CSS 4 stack. Maps every design token to CSS custom properties, every old custom component to a shadcn/ui equivalent, and specifies what custom components must be built from scratch.

---

## 1. Technology Stack

| Layer | Choice |
|-------|--------|
| Component primitives | shadcn/ui (Radix UI underneath) |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite` plugin) |
| Icon library | **lucide-react** (shadcn default — replaces Heroicons from old spec) |
| Font loading | `@fontsource/inter` + `@fontsource/jetbrains-mono` (npm packages, not Google Fonts CDN) |
| Theme system | shadcn/ui CSS variables + `class` strategy dark mode |
| Toast library | Sonner (`sonner` npm package) |

---

## 2. Tailwind CSS 4 Configuration

### 2.1 `src/index.css` — CSS Custom Properties

```css
@import "tailwindcss";
@import "@fontsource/inter/400.css";
@import "@fontsource/inter/500.css";
@import "@fontsource/inter/600.css";
@import "@fontsource/inter/700.css";
@import "@fontsource/inter/800.css";
@import "@fontsource/jetbrains-mono/400.css";
@import "@fontsource/jetbrains-mono/500.css";

@layer base {
  :root {
    /* Brand colors — TaxKlaro blue */
    --brand-50:  239 246 255;   /* #EFF6FF */
    --brand-100: 219 234 254;   /* #DBEAFE */
    --brand-200: 191 219 254;   /* #BFDBFE */
    --brand-300: 147 197 253;   /* #93C5FD */
    --brand-400:  96 165 250;   /* #60A5FA */
    --brand-500:  59 130 246;   /* #3B82F6 */
    --brand-600:  29  78 216;   /* #1D4ED8 — PRIMARY */
    --brand-700:  30  64 175;   /* #1E40AF */
    --brand-800:  30  58 138;   /* #1E3A8A */
    --brand-900:  30  58 123;   /* #1E3A7B */

    /* Semantic — Success */
    --success-50:  240 253 244;  /* #F0FDF4 */
    --success-100: 220 252 231;  /* #DCFCE7 */
    --success-200: 187 247 208;  /* #BBF7D0 */
    --success-500:  34 197  94;  /* #22C55E */
    --success-600:  22 163  74;  /* #16A34A */
    --success-700:  21 128  61;  /* #15803D */

    /* Semantic — Warning */
    --warning-100: 254 243 199;  /* #FEF3C7 */
    --warning-200: 253 230 138;  /* #FDE68A */
    --warning-500: 245 158  11;  /* #F59E0B */
    --warning-600: 217 119   6;  /* #D97706 */
    --warning-700: 180  83   9;  /* #B45309 */

    /* Semantic — Danger */
    --danger-100: 254 242 242;   /* #FEF2F2 */
    --danger-200: 254 202 202;   /* #FECACA */
    --danger-500: 239  68  68;   /* #EF4444 */
    --danger-600: 220  38  38;   /* #DC2626 */
    --danger-700: 185  28  28;   /* #B91C1C */

    /* Semantic — Info */
    --info-100: 224 242 254;     /* #E0F2FE */
    --info-200: 186 230 253;     /* #BAE6FD */
    --info-500:  14 165 233;     /* #0EA5E9 */
    --info-600:   2 132 199;     /* #0284C7 */
    --info-700:   3 105 161;     /* #0369A1 */

    /* Tax-specific */
    --peso-savings:   5 150 105;  /* #059669 */
    --peso-tax-due: 124  58 237;  /* #7C3AED */
    --regime-optimal-bg: 240 253 244; /* #F0FDF4 */

    /* shadcn/ui semantic mappings */
    --background: 250 250 249;   /* neutral-50 #FAFAF9 */
    --foreground:  28  25  23;   /* neutral-900 #1C1917 */
    --card: 255 255 255;         /* neutral-0 white */
    --card-foreground: 28 25 23;
    --popover: 255 255 255;
    --popover-foreground: 28 25 23;
    --primary: 29 78 216;        /* brand-600 #1D4ED8 */
    --primary-foreground: 255 255 255;
    --secondary: 245 245 244;    /* neutral-100 */
    --secondary-foreground: 28 25 23;
    --muted: 245 245 244;        /* neutral-100 */
    --muted-foreground: 120 113 108; /* neutral-500 */
    --accent: 219 234 254;       /* brand-100 */
    --accent-foreground: 29 78 216;
    --destructive: 220 38 38;    /* danger-600 */
    --destructive-foreground: 255 255 255;
    --border: 214 211 209;       /* neutral-300 */
    --input: 214 211 209;        /* neutral-300 */
    --ring: 59 130 246;          /* brand-500 — focus ring */
    --radius: 0.5rem;            /* 8px — maps to radius-md */

    /* Sidebar */
    --sidebar: 255 255 255;
    --sidebar-foreground: 28 25 23;
    --sidebar-accent: 219 234 254;  /* brand-100 */
    --sidebar-accent-foreground: 29 78 216;
    --sidebar-border: 214 211 209;
    --sidebar-ring: 59 130 246;
  }

  .dark {
    --background:  15  23  42;    /* slate-900 #0F172A */
    --foreground: 248 250 252;    /* slate-50 */
    --card:  30  41  59;          /* slate-800 #1E293B */
    --card-foreground: 248 250 252;
    --popover:  30  41  59;
    --popover-foreground: 248 250 252;
    --primary:  96 165 250;       /* brand-400 — lighter on dark */
    --primary-foreground: 15 23 42;
    --secondary:  30  41  59;
    --secondary-foreground: 226 232 240;
    --muted:  30  41  59;
    --muted-foreground: 148 163 184; /* slate-400 */
    --accent:  30  58  95;        /* dark brand tint */
    --accent-foreground: 96 165 250;
    --destructive: 185 28 28;
    --destructive-foreground: 255 255 255;
    --border:  51  65  85;        /* slate-700 */
    --input:  51  65  85;
    --ring:  96 165 250;

    /* Tax-specific dark overrides */
    --peso-savings:  74 222 128;  /* green-400 */
    --peso-tax-due: 167 139 250;  /* violet-400 */

    --sidebar:  30  41  59;
    --sidebar-foreground: 226 232 240;
    --sidebar-accent:  30  58  95;
    --sidebar-border:  51  65  85;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  }
  /* Monospace for peso amounts */
  .font-mono {
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  }
  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

### 2.2 `tailwind.config.ts`

With Tailwind CSS 4, configuration is minimal — most theming happens in CSS:

```typescript
// tailwind.config.ts (Tailwind CSS 4 style — minimal)
// With @tailwindcss/vite, the CSS file is the primary config source.
// This file only needed for content paths and any JS-side plugins.

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
};
```

### 2.3 `vite.config.ts` plugins

```typescript
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import react from "@vitejs/plugin-react";

export default {
  plugins: [
    tailwindcss(),
    tanstackRouter({ routesDirectory: "./src/routes" }),
    react(),
    wasm(),
    topLevelAwait(),
  ],
};
```

---

## 3. Icon Library: lucide-react

The old spec specified Heroicons. The forward loop MUST use **lucide-react** (the shadcn/ui default). Icon name mappings:

| Old (Heroicons) | New (lucide-react) | Where used |
|---|---|---|
| `CheckCircle` (solid) | `CheckCircle2` | Optimal regime badge, success confirmation |
| `ExclamationTriangle` (solid) | `AlertTriangle` | Advisory warnings (WARN codes) |
| `ExclamationCircle` (solid) | `AlertCircle` | Field validation errors |
| `InformationCircle` (solid) | `Info` | Manual review flags, info tooltips |
| `ChevronRight` (outline) | `ChevronRight` | Wizard navigation, breadcrumb |
| `ChevronDown` (outline) | `ChevronDown` | Accordion, select dropdown |
| `ArrowDownTray` (outline) | `Download` | PDF export button |
| `DocumentText` (solid) | `FileText` | BIR form reference links |
| `Calculator` (outline) | `Calculator` | Compute button icon, logo |
| `UserPlus` (outline) | `UserPlus` | Registration CTA |
| `ArrowRightOnRectangle` (outline) | `LogIn` | Login CTA |
| `Cog6Tooth` (outline) | `Settings` | Settings nav, preferences |
| `MagnifyingGlass` (outline) | `Search` | Client search |
| `PlusCircle` (solid) | `PlusCircle` | Add new client/computation |
| `Trash` (outline) | `Trash2` | Delete computation |
| `PencilSquare` (outline) | `Pencil` | Edit saved computation |
| `ClipboardDocumentList` (solid) | `ClipboardList` | Computation history |
| `CalendarDays` (outline) | `CalendarDays` | Filing deadline calendar |
| `BanknotesIcon` (solid) | `Banknote` | Savings amount display |
| `XMark` (outline) | `X` | Close modal, dismiss toast |
| `Bars3` (outline) | `Menu` | Mobile hamburger |
| `ArrowUpTray` | `Upload` | File upload zone |
| `SunIcon` | `Sun` | Dark mode toggle (light) |
| `MoonIcon` | `Moon` | Dark mode toggle (dark) |
| `Share2` | `Share2` | Share computation |
| `Copy` | `Copy` | Copy share URL |
| `Link` | `Link` | Share link display |
| `Users` | `Users` | Team management nav |
| `Building2` | `Building2` | Organization |
| `Shield` | `Shield` | Security/trust on landing page |
| `Zap` | `Zap` | Speed feature on landing page |
| `Eye` | `Eye` | View results |
| `EyeOff` | `EyeOff` | Password toggle |
| `Check` | `Check` | Checkmark (small inline) |
| `Loader2` | `Loader2` | Spinner (animate-spin) |
| `MoreVertical` | `MoreVertical` | Computation card actions menu |
| `ArrowLeft` | `ArrowLeft` | Back navigation |
| `Bell` | `Bell` | Deadline notifications |
| `LayoutDashboard` | `LayoutDashboard` | Dashboard nav item |
| `ListChecks` | `ListChecks` | Computations list nav |

**Import pattern:**
```typescript
import { Calculator, Download, AlertTriangle, ChevronRight } from "lucide-react";
// Usage: <Calculator className="size-5 text-primary" />
// shadcn/ui uses size-* classes (size-4 = 16px, size-5 = 20px, size-6 = 24px)
```

---

## 4. shadcn/ui Component Mapping

The old spec defined 22 custom components. Every one maps to a shadcn/ui primitive or a thin wrapper around one.

### 4.1 shadcn/ui Components to Install

Run: `npx shadcn@latest add <component>` for each:

```
button
input
select
checkbox
radio-group
switch
card
alert
tooltip
progress
badge
dialog
sheet
separator
label
textarea
table
tabs
dropdown-menu
navigation-menu
scroll-area
skeleton
sonner
avatar
popover
```

### 4.2 Mapping Table: Old Custom Component → shadcn/ui Equivalent

| Old Custom Component | shadcn/ui Equivalent | Notes |
|---|---|---|
| `Button` | `Button` | Use `variant` + `size` props. Add `loading` prop wrapper. |
| `Input Field` | `Input` + `Label` + custom wrapper | Wrap in `FormField` pattern with label, hint, error |
| `Select / Dropdown` | `Select`, `SelectContent`, `SelectItem` | Radix-based, accessible |
| `Radio Group` | `RadioGroup`, `RadioGroupItem` | For taxpayer type: wrap items as Cards with custom CSS |
| `Checkbox` | `Checkbox` | shadcn Checkbox with Label |
| `Toggle Switch` | `Switch` | shadcn Switch with Label |
| `Card` | `Card`, `CardHeader`, `CardContent`, `CardFooter` | Use `className` for variant styles |
| `Alert / Callout` | `Alert`, `AlertTitle`, `AlertDescription` | Use `variant="destructive"` for danger; add custom variants |
| `Tooltip` | `Tooltip`, `TooltipContent`, `TooltipTrigger` | Radix-based |
| `Progress Stepper` | Custom — no direct shadcn equivalent | Build custom (see §5) |
| `Regime Comparison Table` | Custom — no direct shadcn equivalent | Build custom using `table` HTML + Tailwind |
| `Summary Card` | `Card` + custom grid | |
| `Badge / Chip` | `Badge` | Use `variant` prop + custom variants |
| `Modal` | `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter` | |
| `Toast Notification` | Sonner (`toast()` function) | Replaces custom toast entirely |
| `Data Table` | Custom using `table` HTML | shadcn `Table` components + custom sort/pagination |
| `Pagination` | Custom using `Button` primitives | |
| `Navigation Bar` | Custom shell + shadcn `Sheet` for mobile | |
| `Accordion` | `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` | |
| `Empty State` | Custom component (EmptyState) | Uses lucide icon + shadcn `Button` |
| `Number Input with Auto-Computation Badge` | Custom wrapper around `Input` | MoneyInput.tsx |
| `File Upload (BIR Form 2307 CSV)` | Custom drop zone | No shadcn equivalent |

### 4.3 Custom Components Not in shadcn (must build from scratch)

These components have no shadcn equivalent and must be written as custom Tailwind components:

| Component | File | Description |
|---|---|---|
| `WizardProgressBar` | `components/wizard/WizardProgressBar.tsx` | Step circles + connector lines |
| `WizardNavControls` | `components/wizard/WizardNavControls.tsx` | Back / Continue buttons |
| `RegimeComparisonTable` | `components/results/RegimeComparisonTable.tsx` | 3-row table with optimal highlight |
| `EmptyState` | `components/ui/empty-state.tsx` | Icon + title + description + CTA |
| `MoneyInput` | `components/ui/money-input.tsx` | Input + ₱ prefix + peso formatting |
| `PercentInput` | `components/ui/percent-input.tsx` | Input + % suffix + clamping |
| `FileDropZone` | `components/ui/file-drop-zone.tsx` | Drag-and-drop CSV upload |
| `AutoSaveIndicator` | `components/computation/AutoSaveIndicator.tsx` | Saving… / Saved / Error status |
| `PesoAmount` | `components/ui/peso-amount.tsx` | Formatted ₱ display (JetBrains Mono) |
| `TaxKlaroLogo` | `components/TaxKlaroLogo.tsx` | Logo with Calculator icon |
| `CardRadioGroup` | `components/ui/card-radio-group.tsx` | Radio options rendered as selectable cards |
| `ShareToggle` | `components/computation/ShareToggle.tsx` | Toggle + URL display + copy button |
| `ComputationCard` | `components/computation/ComputationCard.tsx` | Grid card for computation list |
| `ComputationCardSkeleton` | `components/computation/ComputationCardSkeleton.tsx` | Loading skeleton |
| `WarningsBanner` | `components/results/WarningsBanner.tsx` | Stacked WARN_* alerts |
| `MRFBadge` | `components/results/MRFBadge.tsx` | Manual review flag display |
| `SetupPage` | `components/pages/SetupPage.tsx` | Missing env vars page |

---

## 5. Component Specifications: shadcn Variants + Custom CSS

### 5.1 Alert Component — Custom Variants

shadcn/ui's `Alert` only has `default` and `destructive`. TaxKlaro needs 4 semantic variants. Add to `components/ui/alert.tsx`:

```typescript
// Extend Alert with TaxKlaro variants
const alertVariants = cva(
  "relative w-full rounded-md border-l-4 p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg+div]:translate-y-[-3px] [&:has(svg)]:pl-11",
  {
    variants: {
      variant: {
        default: "bg-info-100 border-info-600 text-info-700 [&>svg]:text-info-600",
        success: "bg-success-100 border-success-600 text-success-700 [&>svg]:text-success-600",
        warning: "bg-warning-100 border-warning-600 text-warning-700 [&>svg]:text-warning-600",
        destructive: "bg-danger-100 border-danger-600 text-danger-700 [&>svg]:text-danger-600",
      },
    },
    defaultVariants: { variant: "default" },
  }
);
```

CSS classes needed in `index.css` (Tailwind CSS 4 uses `@layer utilities` for custom colors):

```css
@layer utilities {
  .bg-info-100 { background-color: rgb(var(--info-100)); }
  .border-info-600 { border-color: rgb(var(--info-600)); }
  .text-info-700 { color: rgb(var(--info-700)); }
  .text-info-600 { color: rgb(var(--info-600)); }
  .bg-success-100 { background-color: rgb(var(--success-100)); }
  .border-success-600 { border-color: rgb(var(--success-600)); }
  .text-success-700 { color: rgb(var(--success-700)); }
  .text-success-600 { color: rgb(var(--success-600)); }
  .bg-warning-100 { background-color: rgb(var(--warning-100)); }
  .border-warning-600 { border-color: rgb(var(--warning-600)); }
  .text-warning-700 { color: rgb(var(--warning-700)); }
  .text-warning-600 { color: rgb(var(--warning-600)); }
  .bg-danger-100 { background-color: rgb(var(--danger-100)); }
  .border-danger-600 { border-color: rgb(var(--danger-600)); }
  .text-danger-700 { color: rgb(var(--danger-700)); }
  .text-danger-600 { color: rgb(var(--danger-600)); }
  /* Peso colors */
  .text-peso-savings { color: rgb(var(--peso-savings)); }
  .text-peso-tax-due { color: rgb(var(--peso-tax-due)); }
  .bg-regime-optimal { background-color: rgb(var(--regime-optimal-bg)); }
  /* Brand utilities */
  .text-brand-600 { color: rgb(var(--brand-600)); }
  .bg-brand-50 { background-color: rgb(var(--brand-50)); }
  .bg-brand-100 { background-color: rgb(var(--brand-100)); }
  .bg-brand-200 { background-color: rgb(var(--brand-200)); }
  .border-brand-600 { border-color: rgb(var(--brand-600)); }
  .text-brand-700 { color: rgb(var(--brand-700)); }
}
```

### 5.2 Badge Component — Custom Variants

shadcn/ui Badge needs extra variants for TaxKlaro's semantic colors:

```typescript
const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground border border-border",
        brand: "bg-brand-200 text-brand-700",
        success: "bg-success-100 text-success-700",
        warning: "bg-warning-100 text-warning-700",
        destructive: "bg-danger-100 text-danger-700",
        info: "bg-info-100 text-info-700",
        outline: "border border-border text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);
```

### 5.3 Button — Loading State Wrapper

shadcn Button doesn't have a `loading` prop. Wrap it:

```typescript
// components/ui/loading-button.tsx
interface LoadingButtonProps extends React.ComponentProps<typeof Button> {
  loading?: boolean;
  loadingText?: string;
}

export function LoadingButton({ loading, loadingText = "Loading...", children, disabled, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={loading || disabled} {...props}>
      {loading ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" />
          {loadingText}
        </>
      ) : children}
    </Button>
  );
}
```

### 5.4 MoneyInput — Peso Input with JetBrains Mono

```typescript
// components/ui/money-input.tsx
interface MoneyInputProps {
  label: string;
  name: string;
  value: string;           // always string — matches Decimal wire format
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

// Visual:
// - Left prefix "₱" in JetBrains Mono, neutral-600
// - Input value in JetBrains Mono
// - On focus: show raw decimal string (e.g., "1200000.00")
// - On blur: format with commas (e.g., "1,200,000.00")
// - Error: red border + red message below (uses danger-600)
// - Root: flex flex-col gap-1.5
// - Input wrapper: relative flex items-center
// - Prefix: absolute left-3 text-muted-foreground font-mono text-sm
// - Input: pl-8 font-mono (to clear ₱ prefix)
```

### 5.5 WizardProgressBar — No shadcn Equivalent

```typescript
// components/wizard/WizardProgressBar.tsx
// Props: { steps: {id: string, label: string}[], currentStep: number, completedSteps: number[] }
//
// Desktop (>= sm): horizontal stepper
//   - Container: flex items-center w-full mb-8
//   - For each step: flex items-center
//     - Circle: size-8 rounded-full flex items-center justify-center
//       Incomplete: bg-muted text-muted-foreground
//       Active: bg-primary text-primary-foreground ring-2 ring-ring ring-offset-2
//       Complete: bg-primary text-primary-foreground
//     - Label: hidden sm:block text-sm below circle, ml-2
//   - Connector: flex-1 h-px bg-border (brand-600 if step complete)
//
// Mobile (< sm): compact progress
//   - "Step {n} of {total} — {label}" in text-sm font-medium text-primary
//   - Below: w-full h-1 bg-muted rounded-full
//     - Fill: h-full bg-primary rounded-full (width: {n/total * 100}%)
//     - Transition: transition-all duration-300
```

### 5.6 RegimeComparisonTable — Core Output Component

```typescript
// components/results/RegimeComparisonTable.tsx
// Props:
//   pathA: RegimeResult | null   (Graduated + Itemized)
//   pathB: RegimeResult | null   (Graduated + OSD)
//   pathC: RegimeResult | null   (8% flat — null if ineligible)
//   optimalPath: 'A' | 'B' | 'C'
//   percentageTax: string        (Decimal string — from engine output)
//   onViewDetails: (path: 'A' | 'B' | 'C') => void
//
// Structure: div.overflow-x-auto > table.w-full.border-collapse
//
// Header row: bg-muted
//   th: text-xs font-semibold uppercase tracking-wide text-muted-foreground px-4 py-3
//   Columns: Regime | Tax Due | vs. Next Option | Status
//
// Optimal row styling:
//   tr.bg-regime-optimal.border-l-4.border-success-600
//   Tax due: font-mono text-2xl font-bold text-peso-savings
//   Status badge: <Badge variant="success"><CheckCircle2 className="mr-1 size-3" />Optimal</Badge>
//
// Non-optimal eligible row:
//   tr.bg-card.border-l-4.border-border
//   Tax due: font-mono text-xl text-muted-foreground
//
// Ineligible row (pathC when gross > ₱3M):
//   tr.bg-muted
//   Tax due cell: italic text-muted-foreground
//   Tooltip: <Tooltip><TooltipTrigger>Not available</TooltipTrigger><TooltipContent>...</TooltipContent></Tooltip>
//
// Percentage Tax row (always shown, informational):
//   tr.bg-info-100
//   Label: "Percentage Tax (additional obligation)"
//   Amount: font-mono text-info-700
//   Tooltip explaining it's additional, not alternative
```

### 5.7 EmptyState — Standard Pattern

```typescript
// components/ui/empty-state.tsx
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; variant?: ButtonVariant };
}
// Visual:
//   Container: flex flex-col items-center justify-center py-16 text-center
//   Icon: <Icon className="size-12 text-muted-foreground mb-4" />
//   Title: text-xl font-semibold text-foreground mt-4
//   Description: text-base text-muted-foreground mt-2 max-w-sm
//   Button: mt-6, default variant="default"
```

### 5.8 CardRadioGroup — Selectable Card Options

For taxpayer type selection — radio options rendered as bordered cards:

```typescript
// components/ui/card-radio-group.tsx
interface CardRadioOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;  // e.g., "Recommended"
}
interface CardRadioGroupProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: CardRadioOption[];
  error?: string;
}
// Visual per option:
//   Unselected: border border-border rounded-lg p-4 cursor-pointer hover:border-ring
//   Selected: border-2 border-primary rounded-lg p-4 bg-accent cursor-pointer
//   Radio circle: uses shadcn RadioGroup + RadioGroupItem (visually hidden, card acts as trigger)
//   Label: text-base font-semibold
//   Description: text-sm text-muted-foreground mt-0.5
//   Badge: <Badge variant="brand">{badge}</Badge>
```

### 5.9 ComputationCard — Grid Card

```typescript
// components/computation/ComputationCard.tsx
// Wraps: shadcn Card
// Visual:
//   <Card className="hover:shadow-md transition-shadow cursor-pointer">
//     <CardHeader className="pb-2">
//       <div className="flex items-start justify-between">
//         <CardTitle className="text-base font-semibold line-clamp-2">{title}</CardTitle>
//         <DropdownMenu>  {/* ... | Edit | Delete */}
//           <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="size-4" /></Button></DropdownMenuTrigger>
//         </DropdownMenu>
//       </div>
//     </CardHeader>
//     <CardContent className="space-y-2">
//       <div className="flex items-center gap-2 text-sm text-muted-foreground">
//         <CalendarDays className="size-4" />
//         <span>TY {taxYear}</span>
//       </div>
//       <div className="flex items-center gap-2">
//         <Badge variant={statusVariant}>{status}</Badge>
//         <Badge variant="outline">{regimeLabel}</Badge>
//       </div>
//       {optimalTaxDue && (
//         <p className="font-mono text-lg font-bold text-peso-savings">₱ {optimalTaxDue}</p>
//       )}
//     </CardContent>
//   </Card>
```

Status badge variants: `draft→default`, `computed→brand`, `finalized→success`, `archived→outline`

---

## 6. Typography — Tailwind Classes

| Old spec token | Tailwind CSS 4 equivalent |
|---|---|
| `text-xs` | `text-xs` (12px) |
| `text-sm` | `text-sm` (14px) |
| `text-base` | `text-base` (16px) |
| `text-lg` | `text-lg` (18px) |
| `text-xl` | `text-xl` (20px) |
| `text-2xl` | `text-2xl` (24px) |
| `text-3xl` | `text-3xl` (30px) |
| `text-4xl` | `text-4xl` (36px) |
| `text-5xl` | `text-5xl` (48px) |
| `text-6xl` | `text-6xl` (60px) |
| `peso-large` (JBMono 3rem w700) | `font-mono text-5xl font-bold text-peso-tax-due` |
| `peso-savings-large` (JBMono 2.25rem w700) | `font-mono text-4xl font-bold text-peso-savings` |
| `peso-inline` (JBMono 1rem w500) | `font-mono text-base font-medium text-foreground` |
| `label-required` (w500 14px red asterisk) | `text-sm font-medium` + `after:content-['*'] after:text-destructive after:ml-0.5` |
| `form-hint` (12px w400 neutral-600) | `text-xs text-muted-foreground` |
| `table-header` (12px w600 uppercase) | `text-xs font-semibold uppercase tracking-wide text-muted-foreground` |
| `step-counter` (14px w700 brand-600) | `text-sm font-bold text-primary` |

---

## 7. Spacing — Tailwind Classes

Tailwind's default spacing scale aligns with the old spec. Key mappings:

| Old token | Tailwind CSS 4 |
|---|---|
| `space-1` (4px) | `p-1`, `gap-1`, `m-1` |
| `space-2` (8px) | `p-2`, `gap-2`, `m-2` |
| `space-3` (12px) | `p-3`, `gap-3` |
| `space-4` (16px) | `p-4`, `gap-4` |
| `space-6` (24px) | `p-6`, `gap-6` |
| `space-8` (32px) | `p-8`, `gap-8` |

Card padding:
- Mobile `p-4` (16px), Desktop `p-6` (24px) — use `p-4 sm:p-6`
- Large card: `p-5 sm:p-8`

---

## 8. Dark Mode Toggle

Dark mode is controlled via the `class` strategy. The toggle adds/removes `"dark"` from `document.documentElement.classList`.

```typescript
// hooks/useColorScheme.ts
type ColorScheme = "system" | "light" | "dark";

export function useColorScheme() {
  const [scheme, setScheme] = useState<ColorScheme>(() => {
    return (localStorage.getItem("taxklaro-color-scheme") as ColorScheme) ?? "system";
  });

  useEffect(() => {
    const root = document.documentElement;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = scheme === "dark" || (scheme === "system" && systemDark);
    root.classList.toggle("dark", isDark);
    localStorage.setItem("taxklaro-color-scheme", scheme);
    // Also persist to user_profiles.color_scheme_preference via Supabase if user is logged in
  }, [scheme]);

  return { scheme, setScheme };
}
```

Toggle button in sidebar footer:
```typescript
// Uses lucide-react Sun / Moon icons
// Cycles: light → dark → system
<Button variant="ghost" size="icon" onClick={cycleScheme}>
  {scheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
</Button>
```

---

## 9. Sonner Toast Configuration

Replace the old custom toast system with Sonner:

```typescript
// main.tsx — add Toaster
import { Toaster } from "sonner";
// Inside root render:
<Toaster position="bottom-right" richColors expand={false} />

// Usage anywhere via:
import { toast } from "sonner";
toast.success("Computation saved");
toast.error("Error saving computation");
toast("Share link disabled");  // neutral
```

Sonner's `richColors` prop provides semantic coloring matching TaxKlaro's palette when combined with shadcn/ui CSS variables.

---

## 10. Shadow and Border Radius — Tailwind Mapping

| Old token | Tailwind CSS 4 |
|---|---|
| `shadow-xs` | `shadow-xs` |
| `shadow-sm` | `shadow-sm` |
| `shadow-base` | `shadow` |
| `shadow-md` | `shadow-md` |
| `shadow-lg` | `shadow-lg` |
| `shadow-xl` | `shadow-xl` |
| `shadow-focus` (3px brand-500 ring) | `ring-2 ring-ring ring-offset-2` (shadcn pattern) |
| `radius-sm` (4px) | `rounded` |
| `radius-base` (6px) | `rounded-md` |
| `radius-md` (8px) | `rounded-lg` |
| `radius-lg` (12px) | `rounded-xl` |
| `radius-xl` (16px) | `rounded-2xl` |
| `radius-full` (9999px) | `rounded-full` |

shadcn/ui uses `--radius: 0.5rem` (8px) as its base. TaxKlaro's primary card radius is `radius-lg` (12px) = `rounded-xl`.

---

## 11. Z-Index — Tailwind Mapping

| Old token | Tailwind CSS 4 | Note |
|---|---|---|
| `z-base` (0) | `z-0` | Default |
| `z-raised` (10) | `z-10` | Sticky wizard header |
| `z-dropdown` (100) | `z-50` | Radix Popover/Select default |
| `z-sticky` (200) | `z-40` | Sticky navbar |
| `z-overlay` (300) | `z-50` | Radix Dialog backdrop |
| `z-modal` (400) | `z-50` | Radix Dialog content (above backdrop) |
| `z-toast` (500) | `z-50` | Sonner toast (above modals) |
| `z-tooltip` (600) | `z-50` | Radix Tooltip (always on top) |

Radix/shadcn components handle z-index internally via portals. Custom components should use `z-10`/`z-40`/`z-50`.

---

## 12. Print Styles

```css
@media print {
  /* Hide nav, wizard controls, action buttons */
  .no-print, nav, aside, [data-print="hidden"] { display: none !important; }
  /* Show all content */
  body { background: white !important; color: black !important; }
  /* Preserve colors for regime table */
  .bg-regime-optimal { background-color: #f0fdf4 !important; -webkit-print-color-adjust: exact; }
  /* Page breaks */
  .results-card, .regime-comparison-table { page-break-inside: avoid; }
  /* A4 */
  @page { size: A4 portrait; margin: 15mm; }
}
```

---

## 13. `package.json` Dependencies

Additions needed for design system:

```json
{
  "dependencies": {
    "@fontsource/inter": "^5.0.0",
    "@fontsource/jetbrains-mono": "^5.0.0",
    "lucide-react": "^0.400.0",
    "sonner": "^1.5.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0"
  }
}
```

The `cn()` utility (standard shadcn pattern):
```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 14. Critical: Production Build Risks for Design System

| Risk | Cause | Mitigation |
|---|---|---|
| CSS missing in prod | `@tailwindcss/vite` not processing | Check prod CSS bundle size > 20KB. If tiny, plugin failed. |
| JetBrains Mono missing | Font not bundled | Use `@fontsource/*` (bundled via npm) not CDN URL |
| Dark mode flash | Class applied after hydration | Set `class` on `<html>` from `localStorage` BEFORE React renders |
| Icon tree-shaking | Importing entire lucide-react | Always use named imports: `import { Calculator } from "lucide-react"` |
| Custom CSS vars not found | Typos in `rgb(var(--brand-600))` | All custom colors must be defined in `:root` before use |

---

## Summary

- **Brand primary:** `#1D4ED8` — mapped to `--primary` and `text-primary`, `bg-primary`
- **Icon library:** lucide-react (not Heroicons)
- **Toast:** Sonner (not custom toast)
- **Font loading:** @fontsource npm packages (not Google Fonts CDN)
- **Custom components needed:** 17 (listed in §4.3)
- **shadcn/ui components to install:** 25 (listed in §4.1)
- **Dark mode:** class strategy, `useColorScheme` hook, persisted to localStorage + Supabase
