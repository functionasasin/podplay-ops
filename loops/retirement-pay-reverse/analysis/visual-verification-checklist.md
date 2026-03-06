# Analysis: Visual Verification Checklist

**Wave:** 5 — Frontend Data Model + UI Design
**Aspect:** visual-verification-checklist
**Date:** 2026-03-06
**Sources:** design-system.md, component-wiring-map.md, results-view.md, wizard-steps.md, batch-upload-ui.md, nlrc-worksheet-ui.md, shared-components.md, auth-flow.md, navigation.md, org-model.md, landing-page.md

---

## Purpose

Every major component is listed here with its required shadcn wrapper, key Tailwind classes, lucide icon, color variant, and status indicator styling. A forward loop developer must verify each row before declaring a component "complete." No plain `<div>` / `<ul>` / `<li>` raw HTML as the outermost shell of a named component — each must use the specified shadcn primitive.

**How to use:** During development, check each row's "shadcn wrapper" and "key classes" against the rendered output. If a component renders without its specified wrapper, it is unstyled test scaffolding — not complete.

---

## 1. Layout Components

| Component | shadcn Wrapper | Key Tailwind Classes | Icon | Color Variant | Status Indicator |
|-----------|---------------|---------------------|------|---------------|-----------------|
| `AppShell` | none (layout shell) | `flex h-screen overflow-hidden` | — | — | — |
| `Sidebar` | none (layout) | `hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-gray-200 bg-white` | — | — | — |
| `MobileTopBar` | none (layout) | `flex lg:hidden items-center h-14 border-b border-gray-200 bg-white px-4 gap-3` | `Menu` (hamburger) | gray-900 | — |
| `MobileDrawer` | `Sheet` (Radix Sheet / Dialog variant) | `fixed inset-0 z-50` overlay + `w-64 bg-white h-full` panel | — | — | — |
| `NavLinks` | none (list of links) | `flex flex-col gap-1 px-2` | per-link icons (see section 10.6 design-system) | active: `bg-gray-100 text-gray-900 font-medium`; inactive: `text-gray-600 hover:bg-gray-50` | Active route: `bg-gray-100 rounded-md` highlight |
| `OrgSwitcher` | `Select` (shadcn) | `w-full text-sm` trigger + `SelectContent` popover | `Building2` | gray | Selected org name in trigger |
| `UserMenu` | `DropdownMenu` (shadcn) | trigger: `flex items-center gap-2 text-sm p-2 rounded-md hover:bg-gray-50 cursor-pointer` | `LogOut` (sign-out item), `ChevronDown` (trigger) | gray | — |
| `SetupPage` | `Card` | `max-w-md mx-auto mt-24` | `AlertTriangle` | amber-50 background, amber-500 border, amber-800 text | — |

---

## 2. Public Pages

| Component | shadcn Wrapper | Key Tailwind Classes | Icon | Color Variant | Status Indicator |
|-----------|---------------|---------------------|------|---------------|-----------------|
| `LandingPage` | none (page) | Hero: `min-h-screen bg-white`; content sections `max-w-4xl mx-auto px-4 py-16` | `Scale` (hero), `CheckCircle2` (feature list items) | Blue CTA button `bg-blue-600 hover:bg-blue-700`; amber for "33% underpayment" callout `bg-amber-50 border border-amber-200` | — |
| `SignInPage` | `Card` | `max-w-md mx-auto mt-16 px-4` wrapping `Card` | — | — | Error: `Alert variant="destructive"` below button |
| `SignUpPage` | `Card` | same as SignInPage | — | — | Error: inline `p className="text-xs text-red-600"` |
| `AuthCallbackPage` | none | `flex items-center justify-center min-h-screen` | `Loader2 animate-spin` | gray-500 | Spinner + "Signing you in..." text |
| `ForgotPasswordPage` | `Card` | `max-w-md mx-auto mt-16 px-4` | — | — | Success: replace form with `Alert` (default/green) showing "Reset link sent" |
| `UpdatePasswordPage` | `Card` | `max-w-md mx-auto mt-16 px-4` | — | — | Success toast then navigate |
| `SharedResultsPage` | none (page wrapper) | `max-w-3xl mx-auto py-8 px-4 space-y-6` | `Share2` (share banner icon) | Info `Alert` at top: `bg-blue-50 border-blue-200 text-blue-800` showing "Shared view — read only" | — |

---

## 3. Dashboard Components

| Component | shadcn Wrapper | Key Tailwind Classes | Icon | Color Variant | Status Indicator |
|-----------|---------------|---------------------|------|---------------|-----------------|
| `DashboardPage` | none (page) | `max-w-5xl mx-auto py-8 px-4` | — | — | — |
| `ComputationCard` | `Card` | `hover:shadow-md transition-shadow cursor-pointer` | `FileText` (card header), `Trash2` (delete icon button) | Border-l-4 based on status: `draft`→`border-gray-300`, `computed`→`border-blue-400`, `shared`→`border-green-400` | Status `Badge`: `draft`→`outline`, `computed`→`secondary`, `shared`→`default` (green) |
| `ComputationCardGrid` | none | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` | — | — | — |
| `EmptyComputationsState` | none | `text-center py-16` | `FileQuestion className="w-12 h-12 text-gray-300 mx-auto mb-4"` | gray-300 icon, gray-900 title, gray-500 description | — |
| `BatchCard` | `Card` | `hover:shadow-md transition-shadow cursor-pointer` | `FileSpreadsheet` (card header), `Trash2` (delete) | `border-l-4 border-purple-400` (batch always computed) | `Badge variant="secondary"`: "{N} employees" |
| `BatchCardGrid` | none | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6` | — | — | — |

---

## 4. Auth Page Forms

| Component | shadcn Wrapper | Key Tailwind Classes | Icon | Color Variant | Status Indicator |
|-----------|---------------|---------------------|------|---------------|-----------------|
| Auth form in `SignInPage` | `Card > CardHeader + CardContent + CardFooter` | `CardHeader`: `text-center`; `CardContent`: `space-y-4` | App logo SVG in `CardHeader` | — | Loading: `Button disabled` + `Loader2 animate-spin mr-2` |
| Auth form in `SignUpPage` | `Card > CardHeader + CardContent` | same pattern as SignInPage | — | — | same loading pattern |
| Inline form error below button | `Alert variant="destructive"` | `mt-3` | `AlertTriangle className="h-4 w-4"` | red | — |
| Magic link confirmation screen | none (replaces form) | `text-center py-8 space-y-3` | `Mail className="w-12 h-12 text-gray-400 mx-auto"` | gray | — |
| Email confirmation pending screen | none | `text-center py-8 space-y-3` | `Mail className="w-12 h-12 text-gray-400 mx-auto"` | gray | — |

---

## 5. Wizard Components

| Component | shadcn Wrapper | Key Tailwind Classes | Icon | Color Variant | Status Indicator |
|-----------|---------------|---------------------|------|---------------|-----------------|
| `WizardContainer` | none (state container; renders step Card) | `max-w-2xl mx-auto py-8 px-4` | — | — | — |
| `WizardProgressBar` | none (custom progress dots inside Card header) | 5 `div` pills: `h-1 flex-1 rounded-full`; completed: `bg-gray-900`; current: `bg-gray-600`; upcoming: `bg-gray-200` | — | — | Current step: `bg-gray-600` (slightly lighter than complete) |
| `Step1EmployeeInfo` | `Card > CardHeader + CardContent + CardFooter` | `CardContent: space-y-4`; `CardFooter: justify-end` | Step number circle: `flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white text-sm font-bold` | — | Validation errors: `text-xs text-red-600` below each input |
| `Step2EmploymentDates` | `Card > CardHeader + CardContent + CardFooter` | same pattern; date grid: `grid grid-cols-2 gap-4` | — | — | same validation pattern |
| `Step3SalaryBenefits` | `Card > CardHeader + CardContent + CardFooter` | salary grid: `grid grid-cols-2 gap-4`; optional section: `border-t pt-4 mt-4 border-gray-100` | — | — | same validation pattern |
| `Step4RetirementDetails` | `Card > CardHeader + CardContent + CardFooter` | `CardContent: space-y-4` | — | — | same validation pattern |
| `Step5CompanyPlan` | `Card > CardHeader + CardContent + CardFooter` | Optional header: `CardDescription text-sm text-gray-500 italic`; `CardFooter: justify-between` (Back + Skip/Continue) | — | amber `Alert` at top of content: "Optional — enter your company plan for gap analysis" | Hint text: `text-xs text-gray-500 italic` |

---

## 6. Results Components

| Component | shadcn Wrapper | Key Tailwind Classes | Icon | Color Variant | Status Indicator |
|-----------|---------------|---------------------|------|---------------|-----------------|
| `ResultsPageHeader` | none (flex row) | `flex flex-wrap items-center justify-between gap-3 mb-6` | — | — | — |
| `EligibilityBadgeCard` | `Card` | `border-l-4` | `CheckCircle2` (eligible) OR `XCircle` (ineligible) | Eligible: `border-green-500`; icon `text-green-600`; Ineligible: `border-red-500`; icon `text-red-600` | `Badge`: eligible → `default` (dark); ineligible → `destructive` (red); retirement type: `secondary` (gray outline) |
| `UnderpaymentHighlightCard` | `Card` | `bg-amber-50 border-amber-200` | `TrendingUp className="w-4 h-4 text-amber-700"` | amber | Delta amount: `text-2xl font-bold font-mono text-amber-900`; label: `text-xs text-amber-700` |
| `PayBreakdownCard` | `Card` | standard card + `Table` inside | `Calculator className="w-4 h-4"` in `CardTitle` | — | Total row: `border-t-2`; Grand total row: `bg-green-50 border-t-2 text-green-800 font-bold font-mono text-base` |
| `TaxTreatmentAlert` | `Alert` | `mt-0` (fits in card spacing) | `ShieldCheck` (fully exempt), `ShieldAlert` (partial), `ShieldX` (fully taxable) | Fully exempt: `className="border-green-500 bg-green-50"` + `text-green-800`; Partial: `className="border-yellow-500 bg-yellow-50"` + `text-yellow-800`; Fully taxable: `variant="destructive"` | None — Alert itself is the status indicator |
| `SeparationPayComparisonCard` | `Card` | standard card + `Table` or `ComparisonTable` inside | `Scale className="w-4 h-4"` | Winner row highlighted: `bg-green-50 font-bold text-green-800`; loser row: `text-gray-400 line-through` | `Badge`: higher amount → `default`; lower → `secondary` |
| `CompanyPlanComparisonCard` | `Card` | `border-l-4` based on gap result | `Building2 className="w-4 h-4"` | Sufficient: `border-green-500`; Insufficient: `border-red-500` | Gap amount: `text-red-700 font-bold font-mono`; surplus: `text-green-700 font-bold font-mono`; `Badge variant="destructive"` if gap > 0 |
| `ResultsActionsRow` | none (flex row) | `flex flex-wrap gap-3 pt-4 border-t mt-4` | `FileText` (NLRC), `Download` (PDF), `Plus` (new), `Trash2` (delete) | Delete button: `variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"` | — |
| `ResultsPageSkeleton` | `Skeleton` | `space-y-4`; 4 skeleton cards each `h-32 rounded-lg` | — | gray | — |
| `ShareButton` | `Button` | `variant="outline" size="sm"` | `Share2 className="w-4 h-4 mr-1"` | — | If `status === 'shared'`: button shows `CheckCircle2` icon + "Shared" text (no badge) |
| `ShareDialog` | `Dialog > DialogContent` | `sm:max-w-md` | `Share2` in `DialogTitle` | — | Link URL in `Input readOnly className="font-mono text-sm"` |
| `PdfExportButton` | `Button` | `variant="outline" size="sm"` | `Download` idle, `Loader2 animate-spin` loading | — | Loading: `disabled` + text "Generating..." |

---

## 7. NLRC Worksheet Components

| Component | shadcn Wrapper | Key Tailwind Classes | Icon | Color Variant | Status Indicator |
|-----------|---------------|---------------------|------|---------------|-----------------|
| `NlrcWorksheetPage` | none (page) | `max-w-2xl mx-auto py-8 px-4` | — | — | — |
| `NlrcWorksheetHeader` | none (header block) | `border-b-2 border-gray-900 pb-4 mb-6 text-center` | — | — | — |
| `NlrcComputationTable` | `Table` (shadcn) | Standard table; total row: `border-t-2 font-bold`; sub-items: `TableCell className="pl-8"` | — | Grand total row: `bg-gray-50` | — |
| `NlrcLegalBasis` | none (section) | `mt-6 space-y-3` wrapping `LegalCitation` blocks | `BookOpen` inside each `LegalCitation` | blue-50 / blue-200 per legal citation | — |
| `NlrcCertification` | none (block) | `mt-8 border-t pt-6 text-sm text-gray-700 space-y-2` | — | — | — |
| `NlrcPrintButton` | `Button` | `variant="outline" size="sm"` | `Printer className="w-4 h-4 mr-1"` | — | Print: no loading state (synchronous) |
| `NlrcPdfExportButton` | `Button` | `variant="outline" size="sm"` | `Download` idle, `Loader2 animate-spin` loading | — | Loading: `disabled` + "Generating..." |

**Print styling** (`@media print`):
```css
@media print {
  .no-print { display: none !important; }   /* sidebar, top bar, action buttons */
  .print-only { display: block; }           /* printable worksheet only */
  body { font-size: 12pt; }
  .max-w-2xl { max-width: 100%; margin: 0; padding: 0; }
}
```

---

## 8. Batch Upload Components

| Component | shadcn Wrapper | Key Tailwind Classes | Icon | Color Variant | Status Indicator |
|-----------|---------------|---------------------|------|---------------|-----------------|
| `CsvDropZone` | none (styled `label`) | `flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors` | `Upload className="w-8 h-8 text-gray-400 mb-3"` | Drag-over state: `border-blue-400 bg-blue-50` | — |
| `FilePreviewCard` | `Card` | standard card | `FileSpreadsheet className="w-5 h-5 text-green-600"` (file icon in header) | green icon to signal valid CSV | Preview table: `Table` with first 5 rows; `TableHead` shows column names |
| `ComputingProgressCard` | `Card` | `text-center py-12` | `Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4"` | gray | No progress %; just spinner + filename + "Computing..." |
| `BatchErrorCard` | `Card` | `border-red-200 bg-red-50` | `XCircle className="w-8 h-8 text-red-400 mx-auto mb-4"` | red | Error message: `text-sm text-red-700`; "Try Again" `Button variant="outline"` |
| `BatchSummaryCard` | `Card` | standard; 4-stat grid: `grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4` | `BarChart3 className="w-4 h-4"` in `CardTitle` | — | Each stat: label `text-xs text-gray-500`; value `text-2xl font-bold font-mono` |
| `BatchEmployeeTable` | `Table` | `w-full`; sticky header: `TableHead className="sticky top-0 bg-white z-10"` | — | Error rows: `TableRow className="bg-red-50"`; normal: default | Per-row status: `Badge variant="outline"` or `"destructive"` for error employees |
| `BatchExportButtons` | none (flex row) | `flex gap-3` | `Download` on both buttons | — | PDF export loading: `Loader2` + disabled |
| `BatchErrorSummary` | `Alert variant="destructive"` | `mt-4` | `AlertTriangle className="h-4 w-4"` | red | Error count: `font-bold`; expandable error list below |

---

## 9. Company Plan Components

| Component | shadcn Wrapper | Key Tailwind Classes | Icon | Color Variant | Status Indicator |
|-----------|---------------|---------------------|------|---------------|-----------------|
| `CompanyPlanInputForm` | none (form) | `space-y-4` | — | — | Validation errors: `text-xs text-red-600` |
| `CompanyPlanComparisonTable` | `Table` | rows: statutory vs company side-by-side | — | Winner (higher) row: `bg-green-50 font-bold text-green-800`; loser: `text-gray-400 line-through` | `Badge`: "Statutory" or "Company Plan" labels |

---

## 10. Shared UI Components

| Component | shadcn Wrapper | Key Tailwind Classes | Icon | Color Variant | Status Indicator |
|-----------|---------------|---------------------|------|---------------|-----------------|
| `MoneyInput` | `Input` (shadcn) | Wrapper `div className="space-y-1.5"`; Input: left-padded for `₱` prefix `pl-7`; prefix `div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none"` | — | Error: `Input className="border-red-500 focus-visible:ring-red-500"` | Error msg: `p className="text-xs text-red-600"` |
| `DateInput` | `Input type="date"` (shadcn) | `space-y-1.5` wrapper; Input: `w-full` | `CalendarDays` (optional in label area) | Error: red border + text | Error msg: `p className="text-xs text-red-600"` |
| `EnumSelect` | `Select > SelectTrigger + SelectContent + SelectItem` | `space-y-1.5` wrapper; trigger: `w-full` | `ChevronDown` (built into shadcn Select trigger) | — | Error: `p className="text-xs text-red-600"` |
| `CsvUploader` | none (wraps `CsvDropZone`) | passed-through; adds file size / type validation layer | — | — | Size/type error: `toast.error()` (not inline) |
| `ComparisonTable` | `Table` | `w-full text-sm`; highlighted row: `bg-green-50 font-bold text-green-800` | — | Per-row: highlight index → green; others → default | `Badge` in header cells if needed |
| `LegalCitation` | none (styled `div`) | `border-l-4 border-blue-200 bg-blue-50 rounded-r-md px-4 py-3` | `BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0"` | blue-50 | — |
| `LoadingSkeleton` | `Skeleton` | `h-4 rounded` per line; wrap in `div className="space-y-2"` | — | gray | — |

---

## 11. Settings Components

| Component | shadcn Wrapper | Key Tailwind Classes | Icon | Color Variant | Status Indicator |
|-----------|---------------|---------------------|------|---------------|-----------------|
| `SettingsPage` | `Tabs` | `max-w-2xl mx-auto py-8 px-4`; `TabsList` horizontal with 4 items | — | — | Active tab: `TabsTrigger` active state (shadcn default underline) |
| `ProfileTab` | none (tab panel) | `space-y-4 pt-4` | — | — | Save success: `toast()` |
| `PasswordTab` | none (tab panel) | `space-y-4 pt-4` | — | — | Password mismatch: inline `p className="text-xs text-red-600"` |
| `OrganizationsTab` | none (tab panel) | `space-y-4 pt-4` | `Building2` (org list items) | — | No orgs: `EmptyState` pattern: `FileQuestion` icon + "Create your first organization" |
| `DangerZoneTab` | none (tab panel) | `pt-4`; `Card className="border-red-200"` wrapping delete section | `AlertTriangle className="text-red-600"` in section heading | red border card | Delete button: `Button variant="destructive"` |

---

## 12. Organization Components

| Component | shadcn Wrapper | Key Tailwind Classes | Icon | Color Variant | Status Indicator |
|-----------|---------------|---------------------|------|---------------|-----------------|
| `NewOrgForm` | `Card > CardHeader + CardContent + CardFooter` | `max-w-lg mx-auto mt-8` | — | — | Slug taken: inline `p className="text-xs text-red-600"` |
| `OrgMembersTable` | `Table` | `w-full` | `UserMinus` (remove row action), `UserPlus` (invite button in page header) | Role `Badge`: owner → `default`; admin → `secondary`; member → `outline` | Loading remove: row shimmer or `Loader2` in cell |
| `InviteMemberDialog` | `Dialog > DialogContent` | `sm:max-w-sm` | `UserPlus` in `DialogTitle` | — | Sending: `Button disabled` + `Loader2` |
| `OrgInvitationsTable` | `Table` | `w-full` | `X` (revoke per row) | Pending: `Badge variant="secondary"`; expired: `Badge variant="outline" className="text-gray-400"` | — |
| `OrgSettingsForm` | `Card > CardContent` | `space-y-4 pt-0` | — | — | Save success: `toast()` |
| `TransferOwnershipDialog` | `Dialog > DialogContent` | `sm:max-w-sm` | `ArrowRightLeft` in `DialogTitle` | Confirm button: `className="bg-yellow-600 hover:bg-yellow-700"` | — |
| `DeleteOrgDialog` | `AlertDialog > AlertDialogContent` | `sm:max-w-sm` | `Trash2` in `AlertDialogTitle` | `AlertDialogAction className="bg-red-600 hover:bg-red-700"` | Confirm input: `Input` with placeholder = org name; button disabled until match |

---

## 13. Landing Page Sections

| Component | shadcn Wrapper | Key Tailwind Classes | Icon | Color Variant | Status Indicator |
|-----------|---------------|---------------------|------|---------------|-----------------|
| Hero section | none | `px-4 py-20 text-center max-w-3xl mx-auto` | `Scale className="w-12 h-12 mx-auto mb-6 text-blue-600"` | — | — |
| Hero CTA buttons | `Button` | Primary: `size="lg" className="text-lg px-8 py-6"`; Secondary: `size="lg" variant="outline" className="text-lg px-8 py-6"` | `ArrowRight` on primary | Primary: `bg-blue-600 hover:bg-blue-700 text-white` | — |
| "33% Underpayment" callout | `Alert` | `className="border-amber-300 bg-amber-50 max-w-2xl mx-auto"` | `AlertTriangle className="h-5 w-5 text-amber-700"` | amber | — |
| Feature list | none | `grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto py-16 px-4` | `CheckCircle2` per feature item (green) | — | — |
| Sample computation teaser | `Card` | `max-w-lg mx-auto` | `Calculator` in `CardHeader` | `border border-gray-200 shadow-sm` | Amounts blurred with `blur-sm` + "Sign in to see full results" overlay |
| Footer | none | `border-t border-gray-100 py-8 text-center text-sm text-gray-500` | — | — | — |

---

## 14. Status Indicator Patterns (Canonical)

These patterns must be used consistently everywhere a status is shown.

### Computation Status Badge
```tsx
const statusVariant: Record<ComputationStatus, BadgeVariant> = {
  draft: "outline",
  computed: "secondary",
  shared: "default",  // dark / green-tinted
};
const statusLabel: Record<ComputationStatus, string> = {
  draft: "Draft",
  computed: "Computed",
  shared: "Shared",
};
<Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>
```

### Eligibility Status (EligibilityBadgeCard)
```tsx
// Eligible
<Card className="border-l-4 border-green-500">
  <CardTitle className="flex items-center gap-2 text-base">
    <CheckCircle2 className="w-5 h-5 text-green-600" />
    Eligible for Retirement Pay
  </CardTitle>
  <Badge variant="default" className="bg-green-700 hover:bg-green-700">Eligible</Badge>
</Card>

// Ineligible
<Card className="border-l-4 border-red-500">
  <CardTitle className="flex items-center gap-2 text-base">
    <XCircle className="w-5 h-5 text-red-600" />
    Not Eligible
  </CardTitle>
  <Badge variant="destructive">Ineligible</Badge>
</Card>
```

### Tax Treatment (TaxTreatmentAlert)
```tsx
// Fully exempt
<Alert className="border-green-500 bg-green-50">
  <ShieldCheck className="h-4 w-4 text-green-600" />
  <AlertTitle className="text-green-800">Fully Tax-Exempt</AlertTitle>
  <AlertDescription className="text-green-700 text-xs">...</AlertDescription>
</Alert>

// Partially exempt
<Alert className="border-yellow-500 bg-yellow-50">
  <ShieldAlert className="h-4 w-4 text-yellow-600" />
  <AlertTitle className="text-yellow-800">Partially Tax-Exempt</AlertTitle>
  <AlertDescription className="text-yellow-700 text-xs">...</AlertDescription>
</Alert>

// Fully taxable
<Alert variant="destructive">
  <ShieldX className="h-4 w-4" />
  <AlertTitle>Fully Taxable</AlertTitle>
  <AlertDescription className="text-xs">...</AlertDescription>
</Alert>
```

### Company Plan Gap (CompanyPlanComparisonCard)
```tsx
// Insufficient (gap > 0)
<Card className="border-l-4 border-red-500">
  <CardTitle className="flex items-center gap-2">
    <Building2 className="w-4 h-4" />
    Company Plan — Insufficient
    <Badge variant="destructive" className="ml-auto">Gap: ₱{formatCentavos(gapCentavos)}</Badge>
  </CardTitle>
</Card>

// Sufficient (gap <= 0)
<Card className="border-l-4 border-green-500">
  <CardTitle className="flex items-center gap-2">
    <Building2 className="w-4 h-4" />
    Company Plan — Sufficient
    <Badge className="ml-auto bg-green-700 hover:bg-green-700">Compliant</Badge>
  </CardTitle>
</Card>
```

### Loading States (universal pattern)
```tsx
// In buttons
<Button disabled={isLoading}>
  {isLoading ? (
    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading text...</>
  ) : (
    <>Normal label</>
  )}
</Button>

// Full page skeleton (ResultsPageSkeleton)
<div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
  <Skeleton className="h-8 w-64" />              {/* page title */}
  <Skeleton className="h-32 w-full rounded-lg" /> {/* eligibility card */}
  <Skeleton className="h-24 w-full rounded-lg" /> {/* underpayment card */}
  <Skeleton className="h-48 w-full rounded-lg" /> {/* breakdown table */}
  <Skeleton className="h-24 w-full rounded-lg" /> {/* tax treatment */}
</div>
```

---

## 15. Empty State Patterns (Canonical)

Every page that can have zero results must render an `EmptyState` instead of an empty table or blank section.

| Page / Section | Empty Condition | Icon | Title | Description | Action Button |
|----------------|----------------|------|-------|-------------|---------------|
| `DashboardPage` — computations | `computations.length === 0` | `FileQuestion w-12 h-12 text-gray-300` | "No computations yet" | "Compute your first retirement pay to see results here." | `Button asChild><Link to="/compute/new">New Computation</Link>` |
| `DashboardPage` — batch records | `batchRecords.length === 0` | `FileSpreadsheet w-12 h-12 text-gray-300` | "No batch jobs yet" | "Upload a CSV to compute retirement pay for multiple employees." | `Button variant="outline" asChild><Link to="/batch/new">Batch Upload</Link>` |
| `OrgMembersPage` | `members.length === 1` (only owner) | `Users w-12 h-12 text-gray-300` | "No other members" | "Invite team members to collaborate." | `Button size="sm"><UserPlus />Invite Member</Button>` |
| `OrgInvitationsPage` | `invitations.length === 0` | `Mail w-12 h-12 text-gray-300` | "No pending invitations" | "Invited members will appear here." | none |
| `BatchEmployeeTable` rows with errors | `errorCount > 0` | inline per-row `XCircle className="w-4 h-4 text-red-500"` | — | Error message in row | — |

Empty state wrapper (all use identical DOM structure):
```tsx
<div className="text-center py-16">
  <IconComponent className="w-12 h-12 text-gray-300 mx-auto mb-4" />
  <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
  <p className="text-sm text-gray-500 mb-6">{description}</p>
  {actionButton}
</div>
```

---

## 16. Visual Verification Checklist (per-component pass/fail)

Before marking any component complete, verify all items:

### Layout
- [ ] `Sidebar`: `hidden lg:flex` (invisible on mobile), `w-64 fixed inset-y-0 border-r`, not raw `<div>`
- [ ] `MobileTopBar`: `flex lg:hidden`, `h-14 border-b`, hamburger `Menu` icon present
- [ ] `MobileDrawer`: Radix `Sheet` or `Dialog` — not a raw positioned `div`
- [ ] `NavLinks`: active route highlighted `bg-gray-100 rounded-md`, inactive `text-gray-600`
- [ ] `OrgSwitcher`: shadcn `Select`, not raw `<select>`

### Public Pages
- [ ] `LandingPage`: "33% underpayment" callout uses `Alert className="border-amber-300 bg-amber-50"` with `AlertTriangle` icon
- [ ] `SignInPage`: form inside `Card`, errors in `Alert variant="destructive"`, loading shows `Loader2`
- [ ] `SharedResultsPage`: `Alert` info banner at top showing "Shared view — read only" (blue)

### Dashboard
- [ ] `ComputationCard`: `Card` with `border-l-4` colored by status, status `Badge`, hover shadow
- [ ] `EmptyComputationsState`: `FileQuestion` icon at `w-12 h-12 text-gray-300`, CTA button present

### Wizard
- [ ] All 5 step components: wrapped in `Card > CardHeader + CardContent + CardFooter`
- [ ] Step number circle: `rounded-full bg-gray-900 text-white`
- [ ] Progress bar: 5 pills of `h-1 flex-1 rounded-full` inside `CardHeader`
- [ ] Validation errors: `text-xs text-red-600` (not red border alone, not alert dialog)

### Results
- [ ] `EligibilityBadgeCard`: `Card border-l-4 border-green-500` (eligible) or `border-red-500` (ineligible), correct icon
- [ ] `UnderpaymentHighlightCard`: `Card bg-amber-50 border-amber-200`, delta `text-2xl font-bold font-mono text-amber-900`
- [ ] `PayBreakdownCard`: `Card` + `Table`, grand total row `bg-green-50 border-t-2 text-green-800 font-bold`
- [ ] `TaxTreatmentAlert`: `Alert` (not `Card`), correct shield icon variant per tax status
- [ ] `SeparationPayComparisonCard`: winner row highlighted green, loser row strikethrough gray
- [ ] `CompanyPlanComparisonCard`: `Card border-l-4`, gap `Badge variant="destructive"` or compliant `Badge` (green)
- [ ] `ResultsActionsRow`: flex row with `border-t mt-4`, delete button `text-red-600 ml-auto`
- [ ] `PdfExportButton`: `Button variant="outline"`, `Download` icon, `Loader2` when exporting

### NLRC Worksheet
- [ ] `NlrcWorksheetHeader`: centered, `border-b-2 border-gray-900`, no sidebar/nav in print
- [ ] `NlrcComputationTable`: shadcn `Table`, sub-items `pl-8`, total row `border-t-2 font-bold`
- [ ] `NlrcLegalBasis`: `LegalCitation` blocks with `border-l-4 border-blue-200 bg-blue-50`, `BookOpen` icon
- [ ] Print CSS: `.no-print { display: none }` hides sidebar, action buttons, top bar

### Batch
- [ ] `CsvDropZone`: dashed border, `border-dashed border-gray-300`, `Upload` icon, drag-over `border-blue-400 bg-blue-50`
- [ ] `BatchErrorCard`: `Card border-red-200 bg-red-50`, `XCircle` icon
- [ ] `BatchSummaryCard`: stat grid `grid-cols-2 sm:grid-cols-4`, amounts `text-2xl font-bold font-mono`
- [ ] `BatchEmployeeTable`: shadcn `Table`, error rows `bg-red-50`, status `Badge` per row

### Shared UI
- [ ] `MoneyInput`: `₱` prefix via absolutely positioned `div`, not plain text before input
- [ ] `LegalCitation`: `border-l-4 border-blue-200 bg-blue-50 rounded-r-md`, `BookOpen` icon
- [ ] `EnumSelect`: shadcn `Select`, not native `<select>`
- [ ] `LoadingSkeleton`: shadcn `Skeleton`, not plain `<div>` with gray background

### Settings
- [ ] `SettingsPage`: shadcn `Tabs`, not custom tab implementation
- [ ] `DangerZoneTab`: delete section wrapped in `Card className="border-red-200"`, `Button variant="destructive"`

### Org
- [ ] `OrgMembersTable`: shadcn `Table`, role `Badge` per row, `UserMinus` icon in remove button
- [ ] `InviteMemberDialog`: shadcn `Dialog`, `UserPlus` in `DialogTitle`
- [ ] `DeleteOrgDialog`: shadcn `AlertDialog`, confirm `Input` present, button disabled until name typed
- [ ] `TransferOwnershipDialog`: confirm button `bg-yellow-600`, not default shadcn primary

---

## Summary

Total components with visual specification: **68** (matches component-wiring-map count).

Key rules:
1. **No unstyled raw HTML** as outermost shell — every named component uses its specified shadcn primitive
2. **Status always visible** — eligibility, tax, computation status shown via `Card border-l-4`, `Alert`, or `Badge` — never invisible
3. **Money always mono** — all `₱` amounts use `font-mono`; large amounts `text-2xl font-bold font-mono`
4. **Loading always explicit** — every async button shows `Loader2 animate-spin` + disabled state
5. **Empty always handled** — every list/table with zero-results renders the canonical empty state (icon + title + description + optional CTA)
6. **Print CSS always present** on NLRC worksheet page
