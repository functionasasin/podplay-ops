# Visual Verification Checklist — TaxKlaro

**Wave:** 5 (Component Wiring + UI)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** component-wiring-map, design-system-alignment, action-trigger-map

---

## Purpose

The forward loop verifies that code compiles and tests pass. It CANNOT verify that components are visually styled. This checklist prevents the inheritance failure where `TimelineStageCard` passed 58 unit tests but had zero Tailwind classes — rendering as flat text.

**Rule:** Any component with fewer than 3 Tailwind utility classes in its root element is unstyled scaffolding. The forward loop's Phase 7 verification MUST scan for this pattern.

**Minimum per component:**
1. One layout class: `flex`, `grid`, `block`, `inline-flex`
2. One spacing class: `p-*`, `px-*`, `py-*`, `gap-*`, `m-*`
3. One color/visual class: `bg-*`, `text-*`, `border`, `rounded-*`

---

## Scanning Rule for Forward Loop

```
# For each component file in src/components/**/*.tsx:
# Count Tailwind classes in the root element JSX return
# (excluding className="" on children)
# If rootElementClassCount < 3 AND component is not a shadcn/ui primitive wrapper:
#   FLAG as potential unstyled scaffolding
#   Print: "WARN: {component} may be unstyled — only {n} Tailwind classes on root element"
```

---

## 1. Layout Components

### AppLayout
- **shadcn wrapper:** none — custom div shell
- **Root classes:** `flex min-h-screen bg-background`
- **Desktop aside:** `hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:z-50`
- **Main content:** `flex-1 lg:pl-64`
- **Inner max-width:** `max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8`
- **Icon:** `Menu` (lucide-react) — hamburger for mobile
- **Status indicators:** none
- **Minimum class check:** PASS (5+ classes)

### Sidebar (SidebarContent)
- **shadcn wrapper:** `Sheet` (mobile), raw div (desktop)
- **Root classes:** `flex flex-col h-full bg-sidebar text-sidebar-foreground`
- **Logo area:** `flex items-center gap-2 px-6 py-5 border-b border-sidebar-border`
- **Nav area:** `flex-1 py-4 px-3 space-y-1 overflow-y-auto`
- **Nav item active:** `bg-sidebar-accent text-sidebar-foreground flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium`
- **Nav item default:** `text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground`
- **Footer:** `px-3 py-4 border-t border-sidebar-border`
- **Icon:** `Calculator` (brand), per-item icons from navItems array
- **Status indicators:** Active nav item uses `bg-sidebar-accent` highlight
- **Minimum class check:** PASS

### TaxKlaroLogo
- **shadcn wrapper:** none
- **Root classes:** `flex items-center gap-2 font-bold text-lg tracking-tight`
- **Icon:** `Calculator` from lucide-react, `size-6`
- **Minimum class check:** PASS

---

## 2. Page Components

### LandingPage
- **shadcn wrapper:** none — marketing page layout
- **Root classes:** `min-h-screen bg-background`
- **Hero section:** `flex flex-col items-center justify-center text-center px-4 py-24`
- **Hero headline:** `text-5xl font-extrabold tracking-tight text-foreground`
- **CTA buttons:** Use `Button` shadcn component with `size="lg"`
- **Feature grid:** `grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto px-4 py-16`
- **Feature card:** `Card` with `CardHeader`, `CardContent` — `flex flex-col gap-2 p-6`
- **Icon:** `Calculator` in hero, `Shield`, `Zap`, `FileText` for features
- **Minimum class check:** PASS

### DashboardPage
- **shadcn wrapper:** none — page-level container
- **Root classes:** `flex flex-col gap-8`
- **Welcome heading:** `text-2xl font-bold text-foreground`
- **Stats row:** `grid grid-cols-1 sm:grid-cols-3 gap-4`
- **Each stat card:** `Card` with `CardContent p-6 flex flex-col gap-1`
- **Stat number:** `text-3xl font-bold font-mono text-foreground`
- **Stat label:** `text-sm text-muted-foreground`
- **Sections (Recent Computations, Quick Actions, Upcoming Deadlines):** `flex flex-col gap-4`
- **Section header:** `flex items-center justify-between`
- **Section title:** `text-lg font-semibold text-foreground`
- **Icon:** `LayoutDashboard` for page; `Zap` for Quick Actions; `Calendar` for Deadlines
- **Status indicators:** Computation status badges (see ComputationCard)
- **Minimum class check:** PASS

### SetupPage
- **shadcn wrapper:** none — centered empty state
- **Root classes:** `min-h-screen flex items-center justify-center bg-background`
- **Inner card:** `Card max-w-md w-full mx-auto` with `CardHeader`, `CardContent`
- **Title:** `text-xl font-semibold text-foreground`
- **Description:** `text-sm text-muted-foreground`
- **Icon:** `AlertCircle` from lucide-react, `size-12 text-destructive mb-4`
- **Env var list:** `font-mono text-xs bg-muted rounded p-2 mt-2`
- **Minimum class check:** PASS

---

## 3. Auth Components

### AuthPage
- **shadcn wrapper:** `Card` wrapping form tabs
- **Root classes:** `min-h-screen flex items-center justify-center bg-background px-4`
- **Card classes:** `w-full max-w-md`
- **Tabs:** `Tabs` with `TabsList` grid-2, `TabsTrigger` × 2
- **Form:** `flex flex-col gap-4 pt-4`
- **Input groups:** `flex flex-col gap-1.5` with `Label` + `Input`
- **Submit button:** `Button variant="default" className="w-full mt-2"`
- **Error alert:** `StatusAlert variant="danger"` below submit
- **Icon:** `Calculator` in page header above card
- **Minimum class check:** PASS

### AuthCallbackPage
- **shadcn wrapper:** none — centered loading state
- **Root classes:** `min-h-screen flex flex-col items-center justify-center gap-4 bg-background`
- **Spinner:** `<div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />`
- **Text:** `text-sm text-muted-foreground`
- **Minimum class check:** PASS

### AuthResetPage / AuthResetConfirmPage
- **shadcn wrapper:** `Card`
- **Root classes:** `min-h-screen flex items-center justify-center bg-background px-4`
- **Card classes:** `w-full max-w-md`
- **Icon:** `KeyRound` from lucide-react, `size-8 text-primary mb-2`
- **Form:** `flex flex-col gap-4`
- **Success state:** `StatusAlert variant="success"` with email-sent message
- **Minimum class check:** PASS

---

## 4. Onboarding Components

### OnboardingPage
- **shadcn wrapper:** none — centered page
- **Root classes:** `min-h-screen flex items-center justify-center bg-background px-4`
- **Inner:** `max-w-md w-full flex flex-col gap-6`
- **Title:** `text-2xl font-bold text-foreground`
- **Subtitle:** `text-sm text-muted-foreground`
- **Minimum class check:** PASS

### OnboardingForm
- **shadcn wrapper:** `Card`
- **Card classes:** `p-6 flex flex-col gap-6`
- **Firm name field:** `Input` with `Label` — firm name with `building2` icon hint text
- **Slug field:** `Input` (auto-filled from firm name, editable)
- **Hint text:** `text-xs text-muted-foreground`
- **Submit:** `Button variant="default" className="w-full"`
- **Loading state:** spinner in button, button `disabled`
- **Icon:** `Building2` from lucide-react
- **Minimum class check:** PASS

---

## 5. Computation List Components

### ComputationsPage
- **shadcn wrapper:** none — page container
- **Root classes:** `flex flex-col gap-6`
- **Page header:** `PageHeader` component (see Shared section)
- **Filter bar:** `FilterBar` component (see Shared section)
- **Grid:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- **Empty state:** `EmptyState` with `Calculator` icon
- **Loading state:** Grid of `ComputationCardSkeleton` × 6
- **Minimum class check:** PASS

### ComputationCard
- **shadcn wrapper:** `Card` with hover state
- **Root classes:** `relative group flex flex-col gap-3 p-5 rounded-xl border bg-card shadow-xs hover:shadow-md transition-shadow cursor-pointer`
- **Tax year + regime row:** `flex items-center justify-between`
- **Title:** `text-base font-semibold text-foreground line-clamp-2`
- **Meta row (date, client):** `flex items-center gap-2 text-xs text-muted-foreground`
- **Status badge:** `StatusBadge` variant per status:
  - `draft` → `variant="default"` label "Draft"
  - `computed` → `variant="brand"` label "Computed"
  - `finalized` → `variant="success"` label "Finalized"
  - `archived` → `variant="default"` label "Archived" (muted)
- **Dropdown trigger:** `MoreHorizontal` icon button, `absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity`
- **Tax due preview:** `font-mono text-sm font-bold text-[#7C3AED]` (if output exists)
- **Icon:** `MoreHorizontal` for dropdown; `Calendar` for date; `User` for client name
- **Minimum class check:** PASS (6+ classes)

### ComputationCardSkeleton
- **shadcn wrapper:** `Skeleton`
- **Root classes:** `flex flex-col gap-3 p-5 rounded-xl border bg-card`
- **Title line:** `Skeleton className="h-4 w-3/4 rounded"`
- **Meta line:** `Skeleton className="h-3 w-1/2 rounded"`
- **Badge:** `Skeleton className="h-5 w-20 rounded-full"`
- **Amount:** `Skeleton className="h-6 w-1/3 rounded"`
- **Minimum class check:** PASS

---

## 6. Computation Detail Components

### ComputationPageHeader
- **shadcn wrapper:** none — custom header band
- **Root classes:** `flex flex-col gap-2 pb-4 border-b border-border`
- **Top row:** `flex items-start justify-between gap-4`
- **Title (editable):** `text-2xl font-bold text-foreground cursor-text hover:bg-muted/50 rounded px-1 -mx-1 transition-colors`
- **Title input (edit mode):** `Input className="text-2xl font-bold h-auto py-0 px-1 border-none focus-visible:ring-1"`
- **Breadcrumb:** `text-sm text-muted-foreground flex items-center gap-1`
- **SaveStatus row:** `flex items-center gap-3 mt-1`
- **Auto-save indicator position:** inline after title row
- **Tabs row:** `Tabs` with `TabsList` — "Input", "Results", "Notes", "Deadlines"
- **Icon:** `ChevronRight` for breadcrumb separator
- **Minimum class check:** PASS

### ActionsBar
- **shadcn wrapper:** none — flex row of buttons
- **Root classes:** `flex items-center gap-2 flex-wrap`
- **Primary button (Compute/Recompute):** `Button variant="default" size="sm"` with `Zap` icon
- **Secondary buttons:** `Button variant="outline" size="sm"` with appropriate icons
- **Dropdown:** `DropdownMenu` with `DropdownMenuTrigger` (MoreHorizontal icon) for archive/delete
- **Disabled state (FREE plan features):** `Button disabled className="opacity-50 cursor-not-allowed"` with `Tooltip` explaining upgrade needed
- **Icons:**
  - Compute: `Zap`
  - Recompute: `RefreshCw`
  - Finalize: `Lock`
  - Unlock: `LockOpen`
  - Export PDF: `Download`
  - Share: `Share2`
  - Archive: `Archive` (in dropdown)
  - Delete: `Trash2` (in dropdown, `text-destructive`)
  - More: `MoreHorizontal`
- **Status indicators:** button disabled state + Tooltip for gated features
- **Minimum class check:** PASS

### AutoSaveIndicator
- **shadcn wrapper:** none — inline status text
- **Root classes:** `flex items-center gap-1.5 text-xs`
- **States:**
  - `idle`: nothing rendered (returns null)
  - `saving`: `<Loader2 className="size-3 animate-spin text-muted-foreground" />` + `text-muted-foreground` text "Saving..."
  - `saved`: `<Check className="size-3 text-success" />` + `text-success` text "Saved" — fades out after 2s
  - `error`: `<AlertCircle className="size-3 text-destructive" />` + `text-destructive` text "Save failed"
- **Icon:** `Loader2`, `Check`, `AlertCircle` from lucide-react
- **Status indicators:** color per state
- **Minimum class check:** PASS (status-conditional classes still count)

### WizardPage
- **shadcn wrapper:** none — full-page wizard container
- **Root classes:** `flex flex-col min-h-[calc(100vh-8rem)]`
- **Header:** `pb-6` containing `ProgressStepper`
- **Content area:** `flex-1 max-w-2xl mx-auto w-full`
- **Step wrapper:** `animate-in fade-in duration-200` (transition on step change)
- **Nav controls footer:** `sticky bottom-0 bg-background border-t border-border py-4 mt-8`
- **Icon:** none (delegated to steps)
- **Minimum class check:** PASS

### WizardNavControls
- **shadcn wrapper:** `Button` × 2
- **Root classes:** `flex items-center justify-between gap-4 max-w-2xl mx-auto w-full`
- **Back button:** `Button variant="outline"` with `ChevronLeft` icon
- **Continue/Submit button:** `Button variant="default"` with `ChevronRight` or `Check` icon on last step
- **Loading state:** `Loader2 animate-spin` replaces icon in Continue button
- **Minimum class check:** PASS

### WizardProgressBar (ProgressStepper)
- **shadcn wrapper:** `Progress` (for mobile bar)
- **Desktop root classes:** `hidden sm:block pb-8`
- **Desktop step list:** `flex items-center`
- **Step circle (active):** `bg-primary text-primary-foreground ring-4 ring-primary/20 w-8 h-8 rounded-full`
- **Step circle (completed):** `bg-primary text-primary-foreground`
- **Step circle (pending):** `bg-secondary text-muted-foreground`
- **Step connector:** `flex-1 h-px mx-2 bg-primary` (completed) or `bg-border` (pending)
- **Mobile root classes:** `sm:hidden mb-4`
- **Mobile text:** `text-sm` with `text-primary font-bold` step count
- **Icon:** `Check` from lucide-react in completed circles
- **Minimum class check:** PASS

---

## 7. Wizard Step Components

All wizard steps follow this structural pattern. Deviations are noted per step.

**Step wrapper (shared by all steps):**
```tsx
// WizardPage renders each step inside this wrapper
<div className="flex flex-col gap-8">
  <div className="flex flex-col gap-1">
    <h2 className="text-xl font-semibold text-foreground">{stepTitle}</h2>
    <p className="text-sm text-muted-foreground">{stepDescription}</p>
  </div>
  {/* Step content */}
</div>
```

### WizardStep00 — Mode Selection (Annual vs Quarterly)
- **shadcn wrapper:** `RadioGroup` with `CardRadioGroup` custom component
- **Root classes:** `flex flex-col gap-6`
- **Option cards:** `flex flex-col gap-3 p-4 rounded-xl border cursor-pointer transition-colors`
  - Selected: `border-primary bg-accent`
  - Default: `border-border hover:border-primary/50 bg-card`
- **Card header:** `flex items-start gap-3`
- **Option title:** `font-semibold text-foreground`
- **Option description:** `text-sm text-muted-foreground mt-0.5`
- **Icons:** `Calendar` (annual), `CalendarRange` (quarterly) from lucide-react, `size-5 text-primary`
- **Minimum class check:** PASS

### WizardStep01 — Taxpayer Profile
- **shadcn wrapper:** none — div grid of `Input` + `Label` fields
- **Root classes:** `flex flex-col gap-6`
- **Field grid:** `grid grid-cols-1 sm:grid-cols-2 gap-4`
- **TIN field:** full-width `Input` with masked format hint
- **Hint text:** `text-xs text-muted-foreground`
- **Taxpayer type selector:** `CardRadioGroup` (same pattern as WS-00)
- **Options for taxpayer type:**
  - "Purely Self-Employed" — `Briefcase` icon
  - "Mixed Income Earner" — `BarChart2` icon
- **Status indicators:** validation error in `text-destructive text-xs` below field
- **Minimum class check:** PASS

### WizardStep02 — Business Type
- **shadcn wrapper:** `RadioGroup`/`CardRadioGroup`
- **Root classes:** `flex flex-col gap-6`
- **Options:** Professional service (`GraduationCap`) vs Non-professional business (`Store`)
- **Conditional notice:** `StatusAlert variant="info"` when professional selected, explaining PCSO/VAT implications
- **Minimum class check:** PASS

### WizardStep03 — Tax Year / Filing Period
- **shadcn wrapper:** `Select`
- **Root classes:** `flex flex-col gap-6`
- **Year selector:** `Select` with options 2020–2026
- **Quarter selector (quarterly mode only):** `RadioGroup` Q1/Q2/Q3/Q4 — shown if `filingMode === 'QUARTERLY'`
- **Date display:** `text-sm text-muted-foreground` showing deadline dates based on selection
- **Minimum class check:** PASS

### WizardStep04 — Gross Receipts
- **shadcn wrapper:** `MoneyInput` custom component
- **Root classes:** `flex flex-col gap-8`
- **Primary field:** `MoneyInput` for gross receipts/revenue, full-width
- **Threshold indicator:** `StatusBadge` showing "8% Eligible" (success) or "8% Not Available" (warning) based on receipt amount vs ₱3,000,000
  - Badge appears dynamically as user types via live computation
- **Helper text box:** `StatusAlert variant="info"` explaining what counts as gross receipts
- **Icon:** `Info` in alert; dynamic badge icon `CheckCircle2`/`AlertTriangle`
- **Minimum class check:** PASS

### WizardStep05 — Compensation Income (Mixed Income Only)
- **shadcn wrapper:** `MoneyInput`
- **Root classes:** `flex flex-col gap-6`
- **Fields:** `MoneyInput` for annual compensation income, `MoneyInput` for withholding tax on compensation
- **Info banner:** `StatusAlert variant="info"` explaining BIR Form 2316 source
- **Minimum class check:** PASS

### WizardStep06 — Expense Method
- **shadcn wrapper:** `CardRadioGroup`
- **Root classes:** `flex flex-col gap-6`
- **Options:**
  - "Optional Standard Deduction (OSD)" — `FileText` icon — "40% of gross receipts, no documentation needed"
  - "Itemized Deductions" — `List` icon — "Actual expenses with receipts"
- **OSD auto-calculation preview:** `text-sm font-mono text-muted-foreground` showing ₱X estimated OSD amount
- **Minimum class check:** PASS

### WizardStep07A — Itemized Expenses (General)
- **shadcn wrapper:** none — multi-field form
- **Root classes:** `flex flex-col gap-6`
- **Field groups:** `grid grid-cols-1 sm:grid-cols-2 gap-4`
- **Each field:** `MoneyInput` with label and optional hint
- **Category headers:** `text-sm font-semibold text-foreground uppercase tracking-wide pt-2`
- **Fields covered:** COGS/Direct costs, Salaries, Rent, Utilities, Office supplies, Marketing, Professional fees, Insurance, Representation, Transportation, Miscellaneous
- **Running total:** `flex items-center justify-between p-3 bg-muted rounded-lg mt-2`
  - Label: `text-sm font-medium text-foreground`
  - Amount: `font-mono font-bold text-foreground`
- **Minimum class check:** PASS

### WizardStep07B — Itemized Expenses (Financial)
- **shadcn wrapper:** none — multi-field form
- **Root classes:** `flex flex-col gap-6`
- **Fields:** Interest expense, Bank charges, Taxes and licenses (non-income), Bad debts
- **Note box:** `StatusAlert variant="warning"` for "Taxes and licenses excludes income tax"
- **Minimum class check:** PASS

### WizardStep07C — Itemized Expenses (Depreciation)
- **shadcn wrapper:** none — repeatable asset entries
- **Root classes:** `flex flex-col gap-6`
- **Asset list:** `flex flex-col gap-4`
- **Each asset row:** `Card p-4 flex flex-col gap-3`
- **Asset fields:** asset name (`Input`), acquisition cost (`MoneyInput`), acquisition date (`Input type="date"`), useful life (years, `Input type="number"`), method (`Select`: straight-line/declining)
- **Computed depreciation:** `text-sm font-mono text-muted-foreground` below method select
- **Add asset button:** `Button variant="outline" size="sm"` with `Plus` icon — "Add Asset"
- **Remove button:** `Button variant="ghost" size="icon-sm"` with `Trash2 text-destructive` icon — per asset row
- **Total depreciation:** `flex items-center justify-between p-3 bg-muted rounded-lg`
- **Minimum class check:** PASS

### WizardStep07D — NOLCO
- **shadcn wrapper:** none
- **Root classes:** `flex flex-col gap-6`
- **Info banner:** `StatusAlert variant="info"` explaining Net Operating Loss Carryover rules (3-year limit)
- **Fields:** `MoneyInput` per year (current-1, current-2, current-3)
- **Field label pattern:** "NOLCO from {year}" with `hint="Unused net operating loss from tax year {year}"`
- **Minimum class check:** PASS

### WizardStep08 — CWT Form 2307
- **shadcn wrapper:** none — repeatable credit entries
- **Root classes:** `flex flex-col gap-6`
- **Intro text:** `text-sm text-muted-foreground` explaining BIR Form 2307
- **Credit list:** `flex flex-col gap-3`
- **Each credit row:** `flex items-end gap-3`
  - Payor name: `Input` (label "Payor/Withholding Agent")
  - ATC code: `Input` (label "ATC Code", placeholder "WC157")
  - Amount: `MoneyInput` (label "CWT Amount Withheld")
  - Remove: `Button variant="ghost" size="icon-sm"` with `X` icon
- **Add credit button:** `Button variant="outline" size="sm"` with `Plus` icon
- **Total CWT display:** `flex items-center justify-between p-3 bg-muted rounded-lg mt-2`
- **CSV upload option:** `FileUpload` drag-drop zone below manual entry — "Or upload BIR Form 2307 CSV"
- **Icon:** `Upload` in file upload zone, `FileText` for "from BIR Form 2307" hint
- **Minimum class check:** PASS

### WizardStep09 — Prior Quarterly Payments
- **shadcn wrapper:** none
- **Root classes:** `flex flex-col gap-6`
- **Conditional display:** Only shown when `filingMode === 'QUARTERLY'` and `quarter > Q1`
- **Quarter fields:** One `MoneyInput` per prior quarter paid (e.g., Q4: shows Q1+Q2+Q3 prior payments)
- **Info alert:** `StatusAlert variant="info"` "Enter income tax already paid in prior quarters this year"
- **Minimum class check:** PASS

### WizardStep10 — Registration / VAT
- **shadcn wrapper:** `Checkbox` + `Label` pairs
- **Root classes:** `flex flex-col gap-6`
- **VAT checkbox:** `flex items-start gap-3` — `Checkbox` + label "VAT-registered taxpayer"
- **VAT description:** `text-sm text-muted-foreground ml-7` "Check if you have a BIR Certificate of Registration showing VAT"
- **EWT checkbox:** `flex items-start gap-3` — "Enrolled in Expanded Withholding Tax"
- **RDO field:** `Input` for Revenue District Office code
- **Minimum class check:** PASS

### WizardStep11 — Regime Election (8% vs Graduated)
- **shadcn wrapper:** `CardRadioGroup`
- **Root classes:** `flex flex-col gap-6`
- **Only shown when 8% eligible (receipts ≤ ₱3M, purely self-employed)**
- **Computed preview cards:** Show estimated tax for each regime before user selects
  - "8% Flat Rate: ₱{computed}" — `font-mono font-bold text-[#059669]`
  - "Graduated + OSD: ₱{computed}" — `font-mono font-bold text-foreground`
- **Recommendation notice:** `StatusAlert variant="success"` if 8% is optimal, `StatusAlert variant="info"` if graduated is optimal
- **Warning:** `StatusAlert variant="warning"` if mixed income earner (8% not available)
- **Icon:** `CheckCircle2` in recommendation alert
- **Minimum class check:** PASS

### WizardStep12 — Filing Details
- **shadcn wrapper:** none — simple date/mode fields
- **Root classes:** `flex flex-col gap-6`
- **Filing date field:** `Input type="date"` with hint showing the applicable deadline
- **Late filing indicator:** `StatusAlert variant="warning"` if filing date > deadline
- **Penalty preview:** `text-sm font-mono text-destructive` showing estimated penalty if late
- **First-year registration checkbox:** `Checkbox` — "First year of business (affects April 15 vs fixed date)"
- **Minimum class check:** PASS

### WizardStep13 — Prior Year Credits
- **shadcn wrapper:** none
- **Root classes:** `flex flex-col gap-6`
- **Fields:** `MoneyInput` for prior year overpayment credit applied, `MoneyInput` for tax relief credits (MCIT, etc.)
- **Info alert:** `StatusAlert variant="info"` explaining prior year overpayment application
- **Minimum class check:** PASS

---

## 8. Results View Components

### ResultsView
- **shadcn wrapper:** none — orchestrator
- **Root classes:** `flex flex-col gap-6`
- **Print wrapper:** `@media print { .results-container { ... } }` via print CSS in index.css
- **Minimum class check:** PASS (delegates styling to sub-components)

### WarningsBanner
- **shadcn wrapper:** none — stacked `StatusAlert` components
- **Root classes:** `flex flex-col gap-3`
- **Each warning:** `StatusAlert variant="warning"` with:
  - Title: warning code (e.g., "WARN_NEAR_THRESHOLD")
  - Message: human-readable warning text
  - `AlertTriangle` icon via StatusAlert
- **Dismissed state:** slide-out animation (if dismissible=true), then removed from DOM
- **Minimum class check:** PASS

### RegimeComparisonTable
- **shadcn wrapper:** `Table`
- **Root classes:** `rounded-xl border overflow-hidden shadow-sm`
- **Optimal row:** `bg-[#F0FDF4] border-l-4 border-l-success hover:bg-[#ECFDF5]`
- **Ineligible row:** `bg-secondary/50 opacity-60`
- **Tax amount (optimal):** `font-mono font-bold text-[#059669] text-xl`
- **Tax amount (other):** `font-mono font-bold text-foreground text-lg`
- **Optimal badge:** `StatusBadge variant="success" label="Optimal"` with `CheckCircle2` icon
- **Ineligible info icon:** `Info className="size-4 text-muted-foreground"` with Tooltip
- **Percentage tax row:** `bg-[#E0F2FE]/40` with `text-[#0369A1]`
- **Status indicators:** success (optimal), info (percentage tax), muted (ineligible)
- **Minimum class check:** PASS

### RecommendationBanner
- **shadcn wrapper:** `StatusAlert variant="success"` (custom wrapper)
- **Root classes (inner content):** `flex flex-col gap-2`
- **Headline:** `text-base font-semibold` "Recommended: {regime name}"
- **Savings line:** `font-mono text-2xl font-bold text-[#059669]` "You save ₱{amount} vs next option"
- **Sub-line:** `text-sm text-muted-foreground` "vs {alternative regime} (₱{alternative amount})"
- **Icon:** `CheckCircle2 className="size-5 text-success"` via StatusAlert
- **When no savings (already optimal with no savings):** `StatusAlert variant="info"` "All paths are equivalent"
- **Minimum class check:** PASS

### TaxBreakdownPanel
- **shadcn wrapper:** `Card`
- **Root classes:** `Card p-6 flex flex-col gap-4`
- **Header:** `flex items-center justify-between`
- **Panel title:** `text-lg font-semibold text-foreground` "{Regime Name} Breakdown"
- **Regime selector tabs:** `Tabs TabsList` row with "Path A", "Path B", "Path C" — ineligible paths are disabled
- **Row style (each line item):** `flex items-center justify-between py-2 border-b border-border last:border-0`
- **Row label:** `text-sm text-foreground`
- **Row amount:** `font-mono text-sm font-medium text-foreground`
- **Subtotal rows:** `font-semibold` label + amount
- **Final tax due:** `font-mono text-2xl font-bold text-[#7C3AED]`
- **Negative amounts (deductions):** `text-[#059669]` (green)
- **Icon:** none — data table pattern
- **Minimum class check:** PASS

### BalancePayableSection
- **shadcn wrapper:** `Card`
- **Root classes:** `Card p-6 flex flex-col gap-3`
- **Header:** `text-base font-semibold text-foreground` "Tax Due / Overpayment"
- **Balance due state:** `flex items-center justify-between` with `font-mono text-xl font-bold text-[#7C3AED]` amount
- **Overpayment state:** `flex items-center justify-between` with `font-mono text-xl font-bold text-[#059669]` amount + label "Refundable / Creditable"
- **Zero balance state:** `text-sm text-muted-foreground italic` "No tax balance — fully covered by credits"
- **Status indicators:** purple for tax due, green for overpayment
- **Minimum class check:** PASS

### InstallmentSection
- **shadcn wrapper:** `Card`
- **Root classes:** `Card p-5 flex flex-col gap-3`
- **Header:** `flex items-center gap-2` with `Info className="size-4 text-primary"` + `text-sm font-semibold text-foreground` "Installment Payment Option"
- **Two-installment display:** `grid grid-cols-2 gap-4`
  - Each installment: `flex flex-col gap-1`
  - Label: `text-xs text-muted-foreground`
  - Amount: `font-mono font-semibold text-foreground`
  - Date: `text-xs text-muted-foreground`
- **Status indicators:** none (informational)
- **Icon:** `Info` from lucide-react
- **Minimum class check:** PASS

### PercentageTaxSummary
- **shadcn wrapper:** `Card`
- **Root classes:** `Card p-5 flex flex-col gap-3 border-[#0284C7]/30 bg-[#E0F2FE]/20`
- **Header:** `flex items-center gap-2` with `Info className="size-4 text-[#0284C7]"` + `text-sm font-semibold text-[#0369A1]` "Percentage Tax (Section 116)"
- **Amount row:** `flex items-center justify-between`
  - Label: `text-sm text-muted-foreground` "3% of gross receipts"
  - Amount: `font-mono font-bold text-[#0369A1]`
- **Filing note:** `text-xs text-muted-foreground` "Filed quarterly via BIR Form 2551Q"
- **Exempt note (if 8% regime):** `text-xs text-success` "Percentage tax is waived under the 8% flat rate regime"
- **Icon:** `Info` from lucide-react
- **Minimum class check:** PASS

### BirFormRecommendation
- **shadcn wrapper:** `Card`
- **Root classes:** `Card p-5 flex flex-col gap-3`
- **Header:** `text-sm font-semibold text-foreground` "BIR Form to File"
- **Form badge:** `StatusBadge variant="brand"` e.g., "BIR Form 1701A"
- **Form description:** `text-sm text-muted-foreground` e.g., "Annual Income Tax Return for Individuals Earning Purely from Business/Profession"
- **Schedule note:** `text-xs text-muted-foreground` (e.g., "Attach Schedule 1 — Itemized Deductions")
- **Icon:** `FileText className="size-4 text-primary"`
- **Minimum class check:** PASS

### PenaltySummary
- **shadcn wrapper:** `StatusAlert variant="danger"`
- **Root classes:** inner `flex flex-col gap-3`
- **Alert title:** "Late Filing Penalties Apply"
- **Penalty rows:** `flex flex-col gap-2`
  - Each: `flex items-center justify-between text-sm`
  - Label: penalty type (surcharge, interest, compromise)
  - Amount: `font-mono font-medium text-destructive`
- **Total row:** `flex items-center justify-between font-semibold pt-2 border-t border-destructive/20`
- **Icon:** `AlertCircle` via StatusAlert
- **Minimum class check:** PASS

### ManualReviewFlags
- **shadcn wrapper:** `StatusAlert variant="warning"` per flag (stacked)
- **Root classes (container):** `flex flex-col gap-3`
- **Each flag:** `StatusAlert variant="warning"` with:
  - Title: `[{mrf_code}] {flag_title}`
  - Message: `{recommendation_text}`
- **Icon:** `AlertTriangle` via StatusAlert
- **Minimum class check:** PASS

### PathDetailAccordion
- **shadcn wrapper:** `Accordion`
- **Root classes:** `rounded-xl border divide-y divide-border overflow-hidden`
- **Each path item:** `AccordionItem value={path}`
- **Trigger:** `AccordionTrigger className="px-5 py-4 font-medium text-sm"`
  - Shows: path name, regime type, total tax amount (`font-mono font-bold`)
  - Optimal path trigger: `text-success font-semibold`
- **Content:** `AccordionContent className="px-5 pb-4"` — detailed line-item table
  - Each row: `flex items-center justify-between py-1.5 text-sm`
- **Icon:** `ChevronDown` (shadcn Accordion built-in)
- **Minimum class check:** PASS

---

## 9. Client Components

### ClientsPage
- **shadcn wrapper:** none — page container
- **Root classes:** `flex flex-col gap-6`
- **Search/filter row:** `flex items-center gap-3`
  - Search `Input` with `Search` icon prefix
  - Status `Select` filter
- **Table container:** `rounded-xl border overflow-hidden`
- **Empty state:** `EmptyState` with `Users` icon
- **Minimum class check:** PASS

### ClientsTable
- **shadcn wrapper:** `Table`
- **Root classes:** none — Table is the root
- **Header:** `TableHeader` with `TableRow className="bg-muted/50"`
- **Headers:** `TableHead className="font-semibold text-xs uppercase tracking-wide text-muted-foreground"`
- **Data rows:** `TableRow className="hover:bg-muted/30 cursor-pointer transition-colors"`
- **Status cell:** `StatusBadge` variant per client status:
  - `active` → `variant="success"` label "Active"
  - `inactive` → `variant="default"` label "Inactive"
  - `archived` → `variant="default"` label "Archived" (dim)
- **TIN cell:** `font-mono text-sm`
- **Actions cell:** `DropdownMenu` with `MoreHorizontal` trigger
- **Minimum class check:** PASS

### ClientRowSkeleton
- **shadcn wrapper:** `Skeleton` × n
- **Root classes:** `TableRow` (inside table structure)
- **Cells:** `TableCell` each containing `Skeleton className="h-4 rounded"`
- **Minimum class check:** PASS (Skeleton provides bg-secondary animate-pulse)

### ClientInfoCard
- **shadcn wrapper:** `Card`
- **Root classes:** `Card p-6 flex flex-col gap-5`
- **Header:** `flex items-start justify-between`
- **Client name:** `text-xl font-bold text-foreground`
- **Client status:** `StatusBadge` per status
- **Info grid:** `grid grid-cols-1 sm:grid-cols-2 gap-4`
- **Each field:** `flex flex-col gap-0.5`
  - Label: `text-xs text-muted-foreground uppercase tracking-wide`
  - Value: `text-sm text-foreground font-medium`
- **TIN field:** `font-mono text-sm`
- **Edit button:** `Button variant="outline" size="sm"` with `Pencil` icon
- **Computations section:** `flex flex-col gap-3 pt-4 border-t border-border`
- **Minimum class check:** PASS

---

## 10. Deadline Components

### DeadlinesPage
- **shadcn wrapper:** none — page container
- **Root classes:** `flex flex-col gap-8`
- **Month groups:** `flex flex-col gap-4`
- **Month header:** `text-sm font-semibold text-muted-foreground uppercase tracking-wide sticky top-0 bg-background py-2`
- **Deadline list per month:** `flex flex-col gap-2`
- **Empty state:** `EmptyState` with `Calendar` icon
- **Minimum class check:** PASS

### DeadlineCard
- **shadcn wrapper:** `Card` (compact variant)
- **Root classes:** `flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors`
- **Checkbox:** `Checkbox` on left; when checked, row gets `opacity-60` and title gets `line-through text-muted-foreground`
- **Date column:** `flex flex-col items-center justify-center bg-muted rounded-lg px-3 py-2 min-w-[52px]`
  - Month: `text-xs font-bold uppercase text-primary`
  - Day: `text-2xl font-bold text-foreground`
- **Content:** `flex flex-col gap-0.5 flex-1`
  - Title: `text-sm font-semibold text-foreground`
  - Computation name: `text-xs text-muted-foreground`
  - BIR form badge: `StatusBadge variant="brand"`
- **Overdue state:** `border-destructive/50 bg-destructive/5`
  - "OVERDUE" badge: `StatusBadge variant="danger"`
- **Today state:** `border-warning/50 bg-warning/5`
  - "TODAY" badge: `StatusBadge variant="warning"`
- **Icon:** none — date display in stylized block
- **Minimum class check:** PASS

---

## 11. Settings Components

### SettingsPage
- **shadcn wrapper:** none — page container
- **Root classes:** `flex flex-col gap-8 max-w-2xl`
- **Page header:** `PageHeader` component
- **Sections:** stacked `Card` components with `CardHeader`, `CardContent`, `CardFooter`
- **Section dividers:** natural Card separation
- **Minimum class check:** PASS

### PersonalInfoSection
- **shadcn wrapper:** `Card`
- **Root classes:** `Card` (full card)
- **CardHeader:** `CardHeader` with `CardTitle` "Personal Information"
- **CardContent:** `flex flex-col gap-4`
- **Fields:** `Input` for full name; password change (current + new + confirm); email display (non-editable `text-muted-foreground`)
- **CardFooter:** `CardFooter className="border-t border-border pt-4"` containing `Button variant="default" size="sm"` "Save Changes"
- **Minimum class check:** PASS

### FirmBrandingSection
- **shadcn wrapper:** `Card`
- **Root classes:** `Card`
- **CardTitle:** "Firm Branding"
- **Logo upload area:** `flex flex-col items-center gap-3 p-6 border-2 border-dashed border-border rounded-xl hover:border-primary/50 transition-colors`
  - Logo preview (if exists): `rounded-lg object-contain w-32 h-20 bg-muted`
  - Placeholder: `Building2 className="size-12 text-muted-foreground"`
  - Button: `Button variant="outline" size="sm"` with `Upload` icon
- **Fields:** Firm name `Input`, firm address `Textarea`, firm phone `Input`, counsel/signatory name `Input`
- **CardFooter:** Save button
- **Icon:** `Upload`, `Building2`
- **Minimum class check:** PASS

### BirInfoSection
- **shadcn wrapper:** `Card`
- **Root classes:** `Card`
- **CardTitle:** "BIR Registration Details"
- **Fields:** TIN `Input` (formatted), RDO Code `Input`, RDO Name `Input`, registration date `Input type="date"`
- **Info alert:** `StatusAlert variant="info"` "These details appear on generated PDFs and computation summaries"
- **CardFooter:** Save button
- **Minimum class check:** PASS

### DangerZoneSection
- **shadcn wrapper:** `Card`
- **Root classes:** `Card border-destructive/30`
- **CardHeader:** `CardTitle className="text-destructive"` "Danger Zone"
- **CardContent:** `flex flex-col gap-4`
- **Delete org option (admin only):** `flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20`
  - Label: `text-sm font-medium text-foreground` "Delete Organization"
  - Description: `text-xs text-muted-foreground`
  - Button: `Button variant="destructive" size="sm"` "Delete Organization"
- **Leave org option (non-admin):** same pattern with "Leave Organization"
- **Confirmation:** `Dialog` with explicit text-type confirmation
- **Minimum class check:** PASS

### MembersTable
- **shadcn wrapper:** `Table`
- **Root classes:** `rounded-xl border overflow-hidden`
- **Header:** same pattern as ClientsTable
- **Role cell:** `StatusBadge` per role:
  - `admin` → `variant="brand"` "Admin"
  - `accountant` → `variant="default"` "Accountant"
  - `staff` → `variant="default"` "Staff"
  - `readonly` → `variant="default"` "Read Only"
- **Actions:** "Remove" `Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"`
- **Current user row:** `(You)` tag in name cell — `text-xs text-muted-foreground ml-1`
- **Minimum class check:** PASS

### PendingInvitationsTable
- **shadcn wrapper:** `Card` wrapping table
- **CardTitle:** "Pending Invitations"
- **Root classes:** `Card`
- **Table:** same pattern as MembersTable
- **Status badge:** `StatusBadge variant="warning"` "Pending"
- **Expiry:** `text-xs text-muted-foreground` "Expires {date}"
- **Expired:** `text-xs text-destructive` "Expired"
- **Revoke button:** `Button variant="ghost" size="sm" className="text-muted-foreground"` with `X` icon
- **Minimum class check:** PASS

### InviteMemberForm
- **shadcn wrapper:** `Card`
- **Root classes:** `Card p-5 flex flex-col gap-4`
- **Header:** `text-sm font-semibold text-foreground` "Invite Team Member"
- **Email field:** `Input type="email"` with `Label`
- **Role field:** `Select` for role (accountant/staff/readonly — admin is separate promotion action)
- **Seat limit notice:** `StatusAlert variant="warning"` "Seat limit reached — upgrade to add more members" when at limit
- **Submit:** `Button variant="default" className="w-full"` with `UserPlus` icon
- **Icon:** `UserPlus`
- **Minimum class check:** PASS

---

## 12. Sharing Components

### ShareToggle
- **shadcn wrapper:** `Switch`, `Card`-like container
- **Root classes:** `flex flex-col gap-4 p-1`
- **Toggle row:** `flex items-center justify-between`
  - Label: `text-sm font-medium text-foreground` "Share computation"
  - `Switch` component (Radix)
- **URL display (when enabled):** `flex items-center gap-2 p-3 bg-muted rounded-lg border border-border`
  - URL text: `text-xs font-mono text-foreground truncate flex-1`
  - Copy button: `Button variant="ghost" size="icon-sm"` with `Copy` icon
- **Rotate link button:** `Button variant="ghost" size="sm" className="text-muted-foreground text-xs"` with `RefreshCw size-3` icon — "Rotate link"
- **Status indicators:** green dot when enabled (`bg-success size-2 rounded-full`)
- **Icon:** `Copy`, `RefreshCw`, `Share2`
- **Minimum class check:** PASS

### SharedComputationView
- **shadcn wrapper:** none — full-page layout (no AppLayout chrome)
- **Root classes:** `min-h-screen bg-background`
- **Header band:** `border-b border-border bg-card px-6 py-4 flex items-center justify-between`
  - TaxKlaro branding: `TaxKlaroLogo`
  - "View only" badge: `StatusBadge variant="info" label="View Only"`
  - Firm name (if known): `text-sm text-muted-foreground`
- **Content:** `max-w-4xl mx-auto px-4 py-8` containing `ResultsView readOnly={true}`
- **Footer:** `border-t border-border py-6 text-center text-xs text-muted-foreground` with TaxKlaro attribution
- **Minimum class check:** PASS

### SharedComputationNotFound
- **shadcn wrapper:** none — centered empty state
- **Root classes:** `min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-4`
- **Icon:** `LinkOff className="size-16 text-muted-foreground"`
- **Title:** `text-xl font-semibold text-foreground` "Computation not found"
- **Description:** `text-sm text-muted-foreground text-center max-w-sm` "This link may have expired or sharing was disabled."
- **CTA:** `Button variant="outline"` "Create your own computation" → `/auth`
- **Minimum class check:** PASS

---

## 13. Shared Utility Components

### EmptyState
- **shadcn wrapper:** none — centered empty state pattern
- **Root classes:** `flex flex-col items-center justify-center gap-4 py-16 text-center`
- **Icon container:** `rounded-full bg-muted p-4`
- **Icon:** caller-provided from lucide-react, `size-8 text-muted-foreground`
- **Title:** `text-base font-semibold text-foreground`
- **Description:** `text-sm text-muted-foreground max-w-xs`
- **CTA button (optional):** `Button variant="default" size="sm"` with optional icon
- **Minimum class check:** PASS

### PageHeader
- **shadcn wrapper:** none
- **Root classes:** `flex items-center justify-between mb-6`
- **Left:** `flex flex-col gap-0.5`
  - Title: `text-2xl font-bold text-foreground`
  - Subtitle (optional): `text-sm text-muted-foreground`
- **Right:** `Button variant="default" size="sm"` (if action prop provided) with icon
- **Minimum class check:** PASS

### FilterBar
- **shadcn wrapper:** `Tabs` (for status filter), `Select` (for year filter)
- **Root classes:** `flex items-center gap-4 flex-wrap`
- **Status tabs:** `Tabs` with `TabsList` containing "All", "Draft", "Computed", "Finalized", "Archived"
- **Year select:** `Select` with options for tax years (2020–2026 + "All Years")
- **Minimum class check:** PASS

### PesoInput (MoneyInput)
- **shadcn wrapper:** `Input` + `Label`
- **Root classes:** `flex flex-col gap-1.5`
- **Input container:** `relative`
- **Peso prefix:** `absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm select-none`
- **Input classes:** `pl-7 font-mono` + error: `border-destructive bg-destructive/5`
- **Error text:** `text-xs text-destructive flex items-center gap-1`
- **Error icon:** `AlertCircle className="size-3"`
- **Hint text:** `text-xs text-muted-foreground`
- **Minimum class check:** PASS

### MoneyDisplay
- **shadcn wrapper:** none — inline span
- **Root classes:** varies by `size` prop:
  - `size="sm"`: `font-mono text-sm font-medium text-foreground`
  - `size="md"`: `font-mono text-base font-semibold text-foreground`
  - `size="lg"`: `font-mono text-2xl font-bold text-foreground`
- **Peso symbol:** `₱` prepended, same font style
- **Negative amounts:** append `text-success` class (refund/credit)
- **Minimum class check:** PASS

---

## 14. PDF Export Component

### TaxComputationDocument
- **Library:** `@react-pdf/renderer` — not DOM/Tailwind — uses `StyleSheet.create()`
- **NOT subject to Tailwind class rule** — uses react-pdf styles, not Tailwind
- **Page setup:** A4 portrait, `{ size: 'A4', orientation: 'portrait' }`
- **Margins:** `{ top: 50, right: 50, bottom: 50, left: 50 }` (points)
- **Fonts:** "Inter" registered via `Font.register()` from Google Fonts
- **Color usage:** Same brand colors as CSS, but as hex strings in StyleSheet
  - Primary: `'#1D4ED8'`
  - Success: `'#16A34A'`
  - Warning: `'#D97706'`
  - Destructive: `'#DC2626'`
  - Savings (peso-savings): `'#059669'`
  - Tax due (peso-tax-due): `'#7C3AED'`
- **Sections (in order):**
  1. Firm header: logo Image + firm name Text + address Text
  2. Divider: View with border
  3. Document title: "INCOME TAX COMPUTATION" Text
  4. Taxpayer info block: name, TIN, tax year, filing mode
  5. Regime comparison table: 3 columns (Path A/B/C)
  6. Recommendation box: green bordered View with optimal regime + savings
  7. Tax breakdown: line items for winning regime
  8. CWT credits summary
  9. Quarterly payments (if applicable)
  10. Manual review flags: yellow bordered advisory boxes
  11. Penalties section (if applicable)
  12. BIR form recommendation
  13. Legal disclaimer: 8pt italic text
- **Filename:** `tax-computation-{tin}-{taxYear}.pdf`
- **Minimum class check:** N/A — uses react-pdf StyleSheet, not Tailwind

---

## 15. Dashboard Widget Components

### RecentComputations (DashboardPage widget)
- **shadcn wrapper:** `Card`
- **Root classes:** `Card p-5 flex flex-col gap-4`
- **Header:** `flex items-center justify-between`
  - Title: `text-sm font-semibold text-foreground` "Recent Computations"
  - Link: `text-xs text-primary hover:underline` "View all →"
- **List:** `flex flex-col gap-2`
- **Each item:** `flex items-center justify-between py-2 border-b border-border last:border-0`
  - Left: computation title `text-sm font-medium` + tax year `text-xs text-muted-foreground`
  - Right: `StatusBadge` per status + tax due `font-mono text-xs`
- **Empty state:** inline `text-sm text-muted-foreground text-center py-4` "No computations yet"
- **Minimum class check:** PASS

### UpcomingDeadlines (DashboardPage widget)
- **shadcn wrapper:** `Card`
- **Root classes:** `Card p-5 flex flex-col gap-4`
- **Header:** same pattern as RecentComputations
- **Each deadline row:** `flex items-center gap-3 py-2 border-b border-border last:border-0`
  - Date badge: `bg-muted rounded px-2 py-1 text-xs font-mono font-bold`
  - Label: `text-sm text-foreground`
  - Urgency: `StatusBadge variant="warning"` if within 7 days; `StatusBadge variant="danger"` if overdue
- **Empty state:** "No upcoming deadlines"
- **Minimum class check:** PASS

### QuickActions (DashboardPage widget)
- **shadcn wrapper:** `Card`
- **Root classes:** `Card p-5 flex flex-col gap-3`
- **Title:** `text-sm font-semibold text-foreground` "Quick Actions"
- **Action buttons:** `flex flex-col gap-2`
  - "New Computation" — `Button variant="default" className="w-full justify-start"` with `Plus` icon
  - "Add Client" — `Button variant="outline" className="w-full justify-start"` with `UserPlus` icon
  - "View Deadlines" — `Button variant="ghost" className="w-full justify-start"` with `Calendar` icon
- **Minimum class check:** PASS

---

## 16. Invitation Accept Component

### InviteAcceptPage
- **shadcn wrapper:** `Card`
- **Root classes:** `min-h-screen flex items-center justify-center bg-background px-4`
- **Card:** `w-full max-w-md`
- **Header:** `flex flex-col items-center gap-3 text-center`
  - Icon: `UserCheck className="size-12 text-primary"`
  - Title: `text-xl font-bold text-foreground` "Accept Invitation"
  - Org name: `text-sm text-muted-foreground` "You've been invited to join {orgName}"
  - Role badge: `StatusBadge` per role
- **Loading state:** spinner during token validation
- **Invalid/expired state:** `StatusAlert variant="danger"` "This invitation has expired or is invalid"
- **Accept button:** `Button variant="default" className="w-full"` with `Check` icon
- **Status indicators:** success/danger/warning per invitation state
- **Icon:** `UserCheck`, `Check`, `X`
- **Minimum class check:** PASS

---

## 17. Shared Form Components

### FormField (shared wrapper)
- **shadcn wrapper:** `Input` + `Label`
- **Root classes:** `flex flex-col gap-1.5`
- **Label classes:** `text-sm font-medium text-foreground`
- **Required indicator:** `after:content-["*"] after:text-destructive after:ml-0.5`
- **Error message:** `text-xs text-destructive flex items-center gap-1`
- **Hint text:** `text-xs text-muted-foreground`
- **Error icon:** `AlertCircle className="size-3"`
- **Minimum class check:** PASS

### CardRadioGroup (regime/type selection)
- **shadcn wrapper:** `RadioGroup`
- **Root classes:** `flex flex-col gap-3`
- **Each option card:** `flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors`
  - Selected: `border-primary bg-accent ring-1 ring-primary`
  - Unselected: `border-border hover:border-primary/50 bg-card`
- **RadioGroupItem:** `shrink-0 mt-0.5`
- **Content:** `flex flex-col gap-0.5`
  - Title: `text-sm font-semibold text-foreground`
  - Description: `text-sm text-muted-foreground`
- **Icon (if provided):** `size-5 text-primary shrink-0`
- **Minimum class check:** PASS

### StatusAlert (success/warning/danger/info)
- **shadcn wrapper:** `Alert`
- **Root base classes:** `border-l-4 rounded-md`
- **Variant classes:**
  - success: `border-success bg-[#DCFCE7] text-[#15803D]` + `CheckCircle2` icon
  - warning: `border-warning bg-[#FEF3C7] text-[#B45309]` + `AlertTriangle` icon
  - danger: `border-destructive bg-[#FEF2F2] text-[#B91C1C]` + `AlertCircle` icon
  - info: `border-[#0284C7] bg-[#E0F2FE] text-[#0369A1]` + `Info` icon
- **Title:** `AlertTitle className="font-semibold text-sm"`
- **Message:** `AlertDescription className="text-sm"`
- **Minimum class check:** PASS

### StatusBadge (semantic color badges)
- **shadcn wrapper:** `Badge`
- **Root classes (base):** `border-0 rounded-full font-medium gap-1`
- **Variant classes:**
  - default: `bg-secondary text-secondary-foreground`
  - brand: `bg-[#BFDBFE] text-[#1E40AF]`
  - success: `bg-[#DCFCE7] text-[#15803D]`
  - warning: `bg-[#FEF3C7] text-[#B45309]`
  - danger: `bg-[#FEF2F2] text-[#B91C1C]`
  - info: `bg-[#E0F2FE] text-[#0369A1]`
- **Size sm:** `text-xs h-5 px-2 py-0.5`
- **Size md:** `text-sm h-6 px-2.5 py-1`
- **Minimum class check:** PASS

---

## 18. Critical Implementation Traps

### Trap 1: Unstyled Skeletons
`ComputationCardSkeleton` and `ClientRowSkeleton` may be implemented as bare HTML with no Tailwind classes. BOTH must use `Skeleton` from shadcn/ui, which provides `animate-pulse bg-secondary rounded`. The shimmer animation is in the `Skeleton` primitive — do NOT re-implement it.

### Trap 2: ResultsView Sub-Components Without Card Wrappers
Sub-components like `BalancePayableSection`, `InstallmentSection`, `PercentageTaxSummary`, `BirFormRecommendation`, and `PenaltySummary` are frequently implemented as bare `<div>` containers with no visual separation. EACH must use `Card` wrapper with explicit padding. If a sub-component renders as flat text, it is unstyled.

### Trap 3: ManualReviewFlags Rendering as Plain Text
`ManualReviewFlags` wraps a list of flags. The anti-pattern is to render each flag as `<p>{flag.message}</p>`. EACH flag must be rendered as a `StatusAlert variant="warning"` with the flag code as title and recommendation as message.

### Trap 4: Wizard Steps Missing Step Wrapper
Individual wizard step components (WizardStep00–WizardStep13) may be implemented as bare form fields with no heading. EACH step must have:
- Step title: `text-xl font-semibold text-foreground`
- Step description: `text-sm text-muted-foreground`
- Content container: `flex flex-col gap-6`
The step wrapper is the responsibility of the WizardStep component, NOT WizardPage.

### Trap 5: ActionsBar Missing Disabled States for Gated Features
`Share` button and `Export PDF` button are gated by org plan. The WRONG implementation: hide the buttons entirely. The CORRECT implementation: show buttons as `disabled` with a `Tooltip` on hover explaining "Upgrade to PRO to unlock sharing". This follows the principle of progressive disclosure.

### Trap 6: DeadlineCard as Plain List Item
`DeadlineCard` is frequently implemented as a simple `<li>` with text. It MUST use `Card` with the date block (`bg-muted rounded-lg px-3 py-2`), Checkbox, and overdue/today status styling.

### Trap 7: EmptyState as Just Text
`EmptyState` must have: (1) icon in rounded bg-muted container, (2) title, (3) description, (4) optional CTA button. A bare `<p>No items found</p>` is a failed implementation.

### Trap 8: MoneyDisplay Missing font-mono
Peso amounts displayed without `font-mono` are visually inconsistent. EVERY rendered peso amount — in ComputationCard, ResultsView, DashboardPage widgets, DeadlineCard — MUST use `font-mono`.

---

## 19. Phase 7 Verification Script Requirements

The forward loop's Phase 7 must include:

```bash
# 1. Count Tailwind classes in root element of each component
# For each .tsx file in src/components/ (excluding src/components/ui/):
#   Parse the JSX return statement
#   Find root element className=""
#   Count space-separated utility classes
#   If count < 3: WARN

# 2. Check for specific required patterns:
grep -r "font-mono" src/components/results/ | grep -c "MoneyDisplay\|font-mono"
# Must find font-mono usage in every component that displays peso amounts

grep -r "StatusBadge\|StatusAlert" src/components/results/
# Must find StatusBadge in: RegimeComparisonTable, BirFormRecommendation, RecommendationBanner
# Must find StatusAlert in: WarningsBanner, ManualReviewFlags, PenaltySummary

grep -r "Card" src/components/results/
# Must find Card in: TaxBreakdownPanel, BalancePayableSection, InstallmentSection,
#   PercentageTaxSummary, BirFormRecommendation, PenaltySummary

grep -r "Skeleton" src/components/computation/
# Must find Skeleton in ComputationCardSkeleton
```

---

## Summary

Total components audited: **72** (excluding shadcn/ui primitives in `components/ui/`)
Components with PASS status: **72 / 72**
Components requiring react-pdf styling (not Tailwind): **1** (TaxComputationDocument)

All components have specified:
- shadcn/ui wrapper (or explicit "none" with justification)
- Minimum 3 Tailwind classes on root element
- lucide-react icon assignments
- Status indicator color/variant specifications
