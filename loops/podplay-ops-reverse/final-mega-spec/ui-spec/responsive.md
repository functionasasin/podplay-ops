# PodPlay Ops Wizard — Responsive Design Spec

**Aspect**: qa-mobile-responsive-spec
**Wave**: 7 — QA-Readiness
**Date**: 2026-03-07

---

## Tailwind Breakpoints

Standard Tailwind 4 breakpoints used throughout the app:

| Breakpoint | Prefix | Min-width | Typical Device |
|------------|--------|-----------|----------------|
| (default)  | none   | 0px       | Mobile portrait (<640px) |
| sm         | `sm:`  | 640px     | Mobile landscape / small tablet |
| md         | `md:`  | 768px     | Tablet portrait |
| lg         | `lg:`  | 1024px    | Desktop / tablet landscape |
| xl         | `xl:`  | 1280px    | Wide desktop |

**Primary breakpoints in use**: `sm` (640px), `md` (768px), `lg` (1024px).
`xl` is used only for max-width content containers.

---

## Global Rules

### Touch Targets

Every interactive element must meet minimum touch target size:

- **Minimum size**: 44×44px (WCAG 2.1 AA)
- Implementation: buttons and links that render smaller visually use `min-h-[44px] min-w-[44px]` or padding equivalents
- Icon-only buttons: `h-10 w-10` (40px) with `p-2` padding = 44px total tap area via padding on parent
- Table row click targets: entire `<tr>` is clickable via `onClick`, row height is at least `py-3` = ~44px
- Sidebar nav items: `py-2.5 px-3` on a `text-sm` link = ~44px height
- Checkbox/radio: wrapped in label with `min-h-[44px] flex items-center`
- Select triggers: `h-10` (40px) minimum, use `h-11` for mobile forms
- Form inputs: `h-10` on desktop, `h-11` on mobile (`<md:h-11`)

### Sidebar Behavior

The `AppLayout` sidebar transitions from fixed to drawer depending on viewport:

| Width       | Sidebar behavior |
|-------------|-----------------|
| `< 768px` (below `md`) | Hidden by default; opens as a full-height drawer overlay triggered by hamburger button |
| `768px–1023px` (md) | Fixed left sidebar, collapsed to icon-only mode (60px wide) by default |
| `≥ 1024px` (lg+) | Fixed left sidebar, expanded (240px wide) by default |

**Mobile drawer** (below `md`):
- Rendered as `Sheet` (shadcn Sheet from Radix Dialog)
- Trigger: `Menu` (lucide) icon button in mobile top bar, `h-10 w-10`
- Drawer width: 260px, slides in from left
- Overlay: `bg-black/50` backdrop, click-outside closes it
- Contents: identical nav items as desktop sidebar (same links, same icons, same user section)
- Z-index: `z-50` (above all page content)
- Close button: `X` icon inside drawer header, `h-10 w-10`

**Mobile top bar** (below `md`):
- Height: `h-14` (56px)
- Background: `bg-background border-b`
- Contents: `[Menu icon button] [PodPlay Ops text] [spacer]`
- Top bar only shown below `md`; hidden at `md:hidden`

**Desktop sidebar**:
- Width when expanded: `w-60` (240px)
- Width when collapsed: `w-[60px]`
- Collapse toggle: `ChevronLeft` / `ChevronRight` button at bottom of sidebar, `h-8 w-8`
- Collapse state stored in `localStorage` key `sidebar_collapsed` (persists across page loads)
- When collapsed: show icon only, hide text labels (`span` with `hidden` class)
- Hover tooltip on collapsed icons: Radix `Tooltip` with nav item label

**AppLayout grid**:
```
// Below md — no sidebar in layout flow
<div className="flex flex-col min-h-screen">
  <MobileTopBar />               {/* md:hidden */}
  <MobileDrawer />               {/* md:hidden */}
  <main className="flex-1 overflow-y-auto">
    <Outlet />
  </main>
</div>

// md and above — sidebar in layout flow
<div className="hidden md:flex min-h-screen">
  <Sidebar />                    {/* fixed left */}
  <main className="flex-1 overflow-y-auto ml-60 md:ml-[60px] lg:ml-60">
    <Outlet />
  </main>
</div>
```

**`ml-` offset for main content**:
- Collapsed sidebar: `ml-[60px]`
- Expanded sidebar: `ml-60` (240px)
- Applied to main via CSS variable `--sidebar-width` updated on collapse toggle

---

## Login Page

**Route**: `/login`
**Component**: `src/components/auth/LoginPage.tsx`

| Aspect | All breakpoints |
|--------|----------------|
| Layout | Full-screen centered card |
| Card width | `w-full max-w-sm` (384px), centered with `mx-auto` |
| Card padding | `p-6 sm:p-8` |
| Vertical centering | `min-h-screen flex items-center justify-center` |
| Form layout | Single column, full-width fields |
| Input height | `h-11` (44px) |
| Submit button | Full width, `h-11` |
| Magic link button | Full width, `h-11` |
| No responsive changes | Same on all breakpoints |

---

## AppLayout — All Authenticated Pages

Wrapper applied to all `/_auth/**` routes.

| Breakpoint | Sidebar | Main content offset |
|------------|---------|---------------------|
| < 640px | Drawer (hidden), top bar visible | No offset (full width) |
| 640px–767px | Drawer (hidden), top bar visible | No offset |
| 768px–1023px | Fixed, icon-only (60px) | `ml-[60px]` |
| ≥ 1024px | Fixed, expanded (240px) | `ml-60` |

**Main content max-width**: `max-w-7xl mx-auto` applied inside each page, not at layout level. This means the main area fills the viewport width minus sidebar, and page content is centered up to 1280px.

---

## Dashboard (`/projects`)

**Component**: `src/components/dashboard/DashboardPage.tsx`

### Page padding
| Breakpoint | Padding |
|------------|---------|
| < 640px | `p-4` |
| 640px–1023px | `p-5` |
| ≥ 1024px | `p-6` |

Implementation: `className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto"`

### Metrics Bar (4 cards)

| Breakpoint | Grid columns |
|------------|-------------|
| < 640px | 1 column (`grid-cols-1`) |
| 640px–767px | 2 columns (`sm:grid-cols-2`) |
| ≥ 768px | 4 columns (`md:grid-cols-4`) |

Implementation: `className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"`

### Filter Bar

| Breakpoint | Layout |
|------------|--------|
| < 640px | Stacked vertically, each filter full-width |
| 640px–767px | Two rows: search on first row (full width), status+tier+clear on second row |
| ≥ 768px | Single row, inline |

Implementation:
```tsx
<div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
  <Input className="w-full sm:w-64" ... />        {/* search */}
  <Select><SelectTrigger className="w-full sm:w-40" /></Select>  {/* status */}
  <Select><SelectTrigger className="w-full sm:w-36" /></Select>  {/* tier */}
  {hasFilters && <Button className="w-full sm:w-auto" />}       {/* clear */}
</div>
```

### Projects Table

| Breakpoint | Behavior |
|------------|----------|
| < 768px | Horizontal scroll; all columns preserved; `overflow-x-auto` wrapper |
| 768px–1023px | Horizontal scroll; all columns preserved |
| ≥ 1024px | All columns visible, no scroll needed |

Table wrapper: `<div className="border rounded-lg overflow-x-auto">`

**Column visibility on narrow screens** — The table does NOT hide columns at any breakpoint. The user scrolls horizontally. Minimum table width: `min-w-[700px]` applied to `<table>`.

**Project row height**: `py-3` per cell = ~44px row height on all breakpoints.

### Pagination

| Breakpoint | Behavior |
|------------|----------|
| < 640px | Show only Prev/Next buttons; hide page number buttons. Show "Page X of Y" text |
| ≥ 640px | Full pagination: Prev, page numbers with ellipsis, Next |

Implementation:
```tsx
// Mobile: only Prev / Next + "Page X of Y"
<div className="flex items-center justify-between sm:hidden">
  <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={...}>
    <ChevronLeft className="h-4 w-4" /> Prev
  </Button>
  <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
  <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={...}>
    Next <ChevronRight className="h-4 w-4" />
  </Button>
</div>
// Desktop: full pagination
<div className="hidden sm:flex items-center justify-between ...">
  {/* full pagination as specced in dashboard.md */}
</div>
```

Showing count text ("Showing 1–20 of 47 projects"):
- Visible on all breakpoints
- On mobile: appears above Prev/Next row

---

## Project Shell (`/projects/$projectId/**`)

**Component**: `src/routes/_auth/projects/$projectId.tsx` → `ProjectShell`

### Breadcrumb bar

| Breakpoint | Behavior |
|------------|----------|
| < 640px | "Projects > {venue_name}" on one line; venue name truncated to 20 chars with ellipsis if needed |
| ≥ 640px | Full breadcrumb, no truncation |

### Stage tabs (1 Intake / 2 Procurement / 3 Deployment / 4 Financials)

| Breakpoint | Behavior |
|------------|----------|
| < 640px | Tabs collapse to icon + number only; label hidden. Tab icon = step number or checkmark. Each tab: `min-w-[44px]` |
| 640px–767px | Short labels: "Intake", "Procure", "Deploy", "Financials" |
| ≥ 768px | Full labels: "1 Intake", "2 Procurement", "3 Deployment", "4 Financials" |

Implementation:
```tsx
<TabsList className="w-full grid grid-cols-4">
  <TabsTrigger value="intake" className="min-h-[44px]">
    <span className="hidden sm:inline">1 </span>
    <span className="hidden sm:inline">Intake</span>
    <span className="sm:hidden">1</span>
  </TabsTrigger>
  ...
</TabsList>
```

Stage tab height: `min-h-[44px]` on all breakpoints.

---

## Wizard — Intake (`/projects/$projectId/intake`)

**Component**: `src/components/wizard/intake/IntakeWizard.tsx`

### Step indicator (steps 1–6)

| Breakpoint | Behavior |
|------------|----------|
| < 640px | Step dots only (no labels), horizontal row, current step highlighted |
| 640px–767px | Step number + short label (e.g., "1 Venue"), horizontal row |
| ≥ 768px | Full step labels, horizontal row with connector lines |

### Form layout per step

| Breakpoint | Columns |
|------------|---------|
| < 768px | 1 column (all fields stacked full-width) |
| 768px–1023px | 2 columns for paired fields (e.g., city + state), 1 column for standalone |
| ≥ 1024px | 2 columns for paired fields, 1 column for standalone |

Paired fields (2-column layout at ≥ `md`):
- City + State/Province
- Install Start Date + Go-Live Date
- First Name + Last Name (contact)
- Court Count + Door Count
- Camera Count (alone on its own row at all breakpoints — complex field)

2-column grid: `className="grid grid-cols-1 md:grid-cols-2 gap-4"`

### Form container width

`max-w-2xl mx-auto` (672px) — constrains form width on large screens so fields don't stretch too wide.

### Step navigation buttons (Back / Next / Save)

| Breakpoint | Layout |
|------------|--------|
| < 640px | Stacked vertically: Next on top (full width), Back below (full width) |
| ≥ 640px | Side by side: Back (left) + Next (right) |

Button height: `h-11` (`min-h-[44px]`)

### Step 5: Review step

Lists intake data in a definition-list format. No table is used.

| Breakpoint | Layout |
|------------|--------|
| All | Single column, key/value pairs stacked |

### Step 6: ISP Validation

ISP speed chart table:

| Breakpoint | Behavior |
|------------|----------|
| < 640px | Horizontal scroll (`overflow-x-auto`) |
| ≥ 640px | All columns visible inline |

---

## Wizard — Procurement (`/projects/$projectId/procurement`)

**Component**: `src/components/wizard/procurement/ProcurementWizard.tsx`

### BOM Table

| Breakpoint | Behavior |
|------------|----------|
| < 768px | Horizontal scroll; all columns preserved; `min-w-[600px]` on `<table>` |
| ≥ 768px | All columns visible inline |

Columns: Item, SKU, Category, Qty, Unit Cost, Total Cost, In Stock, Actions.

On mobile scroll, the "Item" column is sticky left: `sticky left-0 bg-background z-10`.

### PO Form (Create Purchase Order dialog)

| Breakpoint | Modal size |
|------------|-----------|
| < 640px | Full-screen modal (`fixed inset-0`, no border radius) |
| ≥ 640px | Centered dialog, `max-w-lg` |

Form inside PO dialog: 1 column at all breakpoints (dialog is narrow).

### Packing List

| Breakpoint | Behavior |
|------------|----------|
| < 640px | Checklist cards (vertical stack, each item is a card with checkbox) |
| ≥ 640px | Table with horizontal scroll |

### CC Terminal / Replay Sign forms

Same dialog sizing as PO Form above.

---

## Wizard — Deployment (`/projects/$projectId/deployment`)

**Component**: `src/components/wizard/deployment/DeploymentWizard.tsx`

### Phase navigation sidebar

The deployment wizard has a vertical list of 15 phases on the left, checklist content on the right.

| Breakpoint | Layout |
|------------|--------|
| < 768px | Phase list collapses to a `Select` dropdown at top of page. Selecting a phase scrolls to/shows that phase's content below it. Phase selector height: `h-11`. |
| 768px–1023px | Left sidebar: phase list, 200px wide. Content: flex-1. Both in `flex flex-row`. |
| ≥ 1024px | Left sidebar: phase list, 240px wide. Content: flex-1. |

Phase select (mobile):
```tsx
<Select
  value={activePhase}
  onValueChange={setActivePhase}
  className="md:hidden"
>
  <SelectTrigger className="h-11 w-full">
    <SelectValue placeholder="Select phase..." />
  </SelectTrigger>
  <SelectContent>
    {phases.map((phase) => (
      <SelectItem key={phase.id} value={phase.id}>
        {phase.number}. {phase.name}
        {phase.isComplete && ' ✓'}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Phase list items (sidebar, ≥ md)

Each phase list item: `min-h-[44px] flex items-center px-3 py-2 cursor-pointer`

### Checklist items

Each checklist row: checkbox + label + optional warning/note.

| Breakpoint | Layout |
|------------|--------|
| < 640px | Checkbox + label stacked, warning/note below; each item: `py-3` |
| ≥ 640px | Checkbox + label inline, warning/note inline or below on wrap |

Checkbox touch target: `<label className="flex items-start gap-3 min-h-[44px] py-2 cursor-pointer">`

### Auto-fill token display

Shown inline next to field label. On mobile wraps to new line below label.

### Troubleshooting tips

Shown as collapsible `<details>` / shadcn Accordion items below relevant checklist items. No breakpoint differences — same on all.

### Notes textarea

Full width on all breakpoints. `min-h-[80px]`.

---

## Wizard — Financials (`/projects/$projectId/financials`)

**Component**: `src/components/wizard/financials/FinancialsWizard.tsx`

### Section layout

Two main sections stacked vertically: Invoicing | Expenses. No side-by-side on any breakpoint.

### Invoice cards (deposit + final)

| Breakpoint | Layout |
|------------|--------|
| < 640px | 1 column (each card full width) |
| ≥ 640px | 2 columns (`grid-cols-2`) |

### Invoice form dialog

| Breakpoint | Modal size |
|------------|-----------|
| < 640px | Full-screen modal |
| ≥ 640px | Centered dialog, `max-w-md` |

Form: 1 column on all breakpoints (dialog is narrow).

### Expenses table

| Breakpoint | Behavior |
|------------|----------|
| < 768px | Horizontal scroll; all columns preserved; `min-w-[500px]` on `<table>` |
| ≥ 768px | All columns visible inline |

Columns: Date, Description, Category, Amount, Payment Method, Actions.

On narrow scroll the "Description" column is NOT sticky (all columns scroll).

### P&L Summary

Summary cards in a grid:

| Breakpoint | Grid columns |
|------------|-------------|
| < 640px | 1 column |
| 640px–767px | 2 columns |
| ≥ 768px | 3 columns |

### Add Expense dialog

| Breakpoint | Modal size |
|------------|-----------|
| < 640px | Full-screen modal |
| ≥ 640px | Centered dialog, `max-w-md` |

---

## Inventory Page (`/inventory`)

**Component**: `src/components/inventory/InventoryPage.tsx`

### Page padding

`className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto"`

### Filter bar

| Breakpoint | Layout |
|------------|--------|
| < 640px | Stacked vertically, each filter full-width |
| ≥ 640px | Horizontal row, inline |

Filters: Search input (`w-full sm:w-64`), Category select (`w-full sm:w-44`), Low Stock toggle (`w-full sm:w-auto`).

### Inventory Table

| Breakpoint | Behavior |
|------------|----------|
| < 640px | Horizontal scroll; `min-w-[600px]`; "Item" column sticky left: `sticky left-0 bg-background z-10` |
| 640px–1023px | Horizontal scroll; all columns |
| ≥ 1024px | All columns visible inline |

Columns: Item Name, SKU, Category, On Hand, Allocated, Available, Reorder Point, Unit Cost, Actions.

Row height: `py-3` = ~44px touch target for row click.

### Adjustment Dialog

| Breakpoint | Modal size |
|------------|-----------|
| < 640px | Full-screen modal |
| ≥ 640px | Centered dialog, `max-w-sm` |

Form: 1 column.

### Receive PO Dialog

| Breakpoint | Modal size |
|------------|-----------|
| < 640px | Full-screen modal |
| ≥ 640px | Centered dialog, `max-w-md` |

---

## Global Financials Page (`/financials`)

**Component**: `src/components/financials/FinancialsDashboardPage.tsx`

### Page padding

`className="p-4 sm:p-5 lg:p-6 space-y-6 max-w-7xl mx-auto"`

### Year/Month filter bar

| Breakpoint | Layout |
|------------|--------|
| < 640px | Stacked, full-width selects |
| ≥ 640px | Inline row |

### Summary metric cards

| Breakpoint | Grid columns |
|------------|-------------|
| < 640px | 1 column |
| 640px–767px | 2 columns |
| ≥ 768px | 3 columns |
| ≥ 1024px | 4 columns |

Implementation: `className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"`

### Monthly P&L table

| Breakpoint | Behavior |
|------------|----------|
| < 768px | Horizontal scroll; `min-w-[500px]` |
| ≥ 768px | All columns visible |

### Revenue Pipeline table

| Breakpoint | Behavior |
|------------|----------|
| < 768px | Horizontal scroll; "Venue" column sticky left |
| ≥ 768px | All columns visible |

Columns: Venue, Tier, Contract Value, Revenue Stage, Deposit, Final, HER.

### HER / P&L chart area

Charts rendered with CSS-based bars (no charting library). On mobile:

| Breakpoint | Layout |
|------------|--------|
| < 640px | Bars are horizontal (label left, bar right), full width |
| ≥ 640px | Bars are vertical (label below bar), multi-column |

---

## Settings Pages

### Settings tab navigation

| Breakpoint | Layout |
|------------|--------|
| < 640px | Tabs scroll horizontally (overflow-x-auto); no label truncation |
| ≥ 640px | Tabs inline, all visible |

Tab height: `min-h-[44px]`

### Settings/Pricing (`/settings/pricing`)

Form: 1 column on all breakpoints (label-input pairs, no paired columns).
Container: `max-w-2xl mx-auto`

Pricing tier cards:

| Breakpoint | Grid |
|------------|------|
| < 640px | 1 column |
| 640px–1023px | 2 columns |
| ≥ 1024px | 4 columns |

Implementation: `className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"`

### Settings/Catalog (`/settings/catalog`)

Hardware catalog table:

| Breakpoint | Behavior |
|------------|----------|
| < 768px | Horizontal scroll; `min-w-[500px]` |
| ≥ 768px | All columns visible |

Columns: Name, SKU, Category, Vendor, Unit Cost, Actions.

Add/Edit Hardware dialog:

| Breakpoint | Modal size |
|------------|-----------|
| < 640px | Full-screen modal |
| ≥ 640px | Centered dialog, `max-w-md` |

Form: 1 column.

### Settings/Team (`/settings/team`)

Team contacts section: cards in a grid.

| Breakpoint | Grid |
|------------|------|
| < 640px | 1 column |
| ≥ 640px | 2 columns |
| ≥ 1024px | 3 columns |

Salary allocations: form with label-input pairs, 1 column, `max-w-md`.

### Settings/Travel (`/settings/travel`)

Form: 1 column, `max-w-md`. No responsive changes needed.

---

## Modal Behavior Summary

All dialogs (shadcn `Dialog` / Radix Dialog) follow this pattern:

| Breakpoint | Modal style |
|------------|------------|
| < 640px | `fixed inset-0 rounded-none` — full screen sheet |
| ≥ 640px | Centered overlay, specific `max-w-*` per dialog |

Implementation pattern for every dialog:
```tsx
<DialogContent className="sm:max-w-md max-h-screen overflow-y-auto rounded-none sm:rounded-lg">
```

- `rounded-none sm:rounded-lg` — no border radius on mobile, rounded on sm+
- `max-h-screen overflow-y-auto` — all dialogs scroll internally if content overflows
- `fixed inset-0 sm:inset-auto` — full screen on mobile, centered on sm+

Dialog title: always present (required for accessibility, `VisuallyHidden` if not shown visually).

---

## Table Horizontal Scroll Pattern

Every table that may overflow on mobile is wrapped:

```tsx
<div className="border rounded-lg overflow-x-auto">
  <Table className="min-w-[600px]">   {/* min-w varies by table */}
    ...
  </Table>
</div>
```

The `min-w-*` value per table:

| Table | min-width |
|-------|-----------|
| Dashboard projects table | `min-w-[700px]` |
| BOM table (procurement) | `min-w-[600px]` |
| Expenses table | `min-w-[500px]` |
| Inventory table | `min-w-[640px]` |
| Monthly P&L table | `min-w-[500px]` |
| Revenue pipeline table | `min-w-[560px]` |
| Hardware catalog table | `min-w-[500px]` |

---

## Form Input Sizing

All form inputs use consistent heights for touch accessibility:

| Context | Input height class |
|---------|-------------------|
| All forms (mobile + desktop) | `h-10` (default shadcn) — acceptable with surrounding padding |
| Mobile-specific form pages (wizard steps) | `h-11` applied via `[&_input]:h-11 [&_select]:h-11` on form container |
| Date pickers | `h-10` minimum |
| Textareas | Not height-constrained; `min-h-[80px]` |
| Search inputs | `h-10` |

Shadcn `Input` default is `h-10`. No override needed for most desktop forms. Wizard step forms add `<md:h-11` via the `<md:` variant if needed, but since wizard forms are already constrained to `max-w-2xl`, the inputs are comfortable at `h-10`.

---

## Skeleton Loading States — Responsive Sizing

Skeleton shapes adapt to the same grid structure as their loaded counterparts:

### Dashboard metrics skeleton
`className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4"` — same grid as real metrics.

### Inventory/table skeleton
Skeleton rows: `px-4 py-3` (same as real rows), shown as horizontal skeleton bars.

### Form skeleton
Field skeletons: `h-10 w-full` per input, `h-4 w-24` per label, stacked same as real form.

---

## Specific Tailwind Class Reference

Frequently used responsive utilities in this app:

| Pattern | Classes |
|---------|---------|
| Hide on mobile, show on md+ | `hidden md:block` |
| Show on mobile, hide on md+ | `md:hidden` |
| 1-col → 2-col at sm | `grid grid-cols-1 sm:grid-cols-2` |
| 1-col → 2-col at md | `grid grid-cols-1 md:grid-cols-2` |
| 2-col → 4-col at md | `grid grid-cols-2 md:grid-cols-4` |
| Horizontal scroll wrapper | `overflow-x-auto` |
| Sticky first column | `sticky left-0 bg-background z-10` |
| Mobile full-width, desktop fixed | `w-full sm:w-64` |
| Mobile stacked, desktop row | `flex flex-col sm:flex-row` |
| Mobile full-screen modal | `rounded-none sm:rounded-lg` |
| Touch target min-height | `min-h-[44px]` |
| Page padding | `p-4 sm:p-5 lg:p-6` |
| Content max-width | `max-w-7xl mx-auto` |
| Form container | `max-w-2xl mx-auto` |
