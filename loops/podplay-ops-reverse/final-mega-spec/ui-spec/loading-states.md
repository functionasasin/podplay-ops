# PodPlay Ops Wizard — Loading States

**Aspect**: qa-loading-states
**Wave**: 7 — QA-Readiness
**Date**: 2026-03-07

For every async operation in the app this file specifies: the skeleton shape (or spinner placement), pending text, and exact Tailwind/component implementation. Zero async operation is left without a defined loading treatment.

---

## Shared Primitives

### `LoadingSpinner` Component

**File**: `src/components/ui/LoadingSpinner.tsx`

Used for full-page blocking spinners (auth callback, new project creation).

```tsx
interface LoadingSpinnerProps {
  text?: string      // optional caption below spinner
  size?: 'sm' | 'md' | 'lg'   // default: 'md'
}

// size → icon class
// sm  → h-4 w-4
// md  → h-6 w-6
// lg  → h-8 w-8

export function LoadingSpinner({ text, size = 'md' }: LoadingSpinnerProps) {
  const sizeClass = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }[size]
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizeClass} animate-spin text-muted-foreground`} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}
```

### `InlineSpinner` Component

**File**: `src/components/ui/InlineSpinner.tsx`

Used inside buttons and inline save indicators.

```tsx
// Always h-4 w-4, no text
export function InlineSpinner({ className }: { className?: string }) {
  return <Loader2 className={`h-4 w-4 animate-spin ${className ?? ''}`} />
}
```

### Button Pending Pattern

All form submit buttons use this pattern:

```tsx
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting
    ? <><InlineSpinner className="mr-2" /> {pendingLabel}</>
    : actionLabel
  }
</Button>
```

While `isSubmitting = true`:
- Button is `disabled` (prevents double-submit)
- Spinner renders inline to the left of the label
- All other form inputs are also `disabled` (prevent edits mid-flight)

### Skeleton Component

All skeletons use shadcn `Skeleton` from `@/components/ui/skeleton`:

```tsx
// Renders a gray pulsing rectangle
<Skeleton className="h-{height} w-{width} {optional-rounded}" />
```

Skeleton animation: `animate-pulse` with `bg-muted` fill (defined in shadcn component).

---

## Page Load Skeletons (TanStack Router `pendingComponent`)

Each route with a loader defines a `pendingComponent`. These are shown while the loader is in flight (typically 200–800ms for Supabase queries). TanStack Router shows the `pendingComponent` after a 200ms threshold by default — configure with `pendingMs: 200`.

---

### 1. Dashboard — `DashboardSkeleton`

**File**: `src/components/dashboard/DashboardSkeleton.tsx`
**Shown when**: `/projects` loader is in flight (page load or filter change)

```
┌──────────────────────────────────────────────────────┐
│  [■■■■■■■■  32px×8]              [■■■■■■■■■  9px×32] │  ← header row
├──────────────────────────────────────────────────────┤
│  [Card] [Card] [Card] [Card]                          │  ← 4 metric cards
│  Each card: icon(5×5) + label(3×24) + value(7×16)    │
├──────────────────────────────────────────────────────┤
│  [■■■■■■■■■  9px×64] [■■■  9px×40] [■■  9px×36]     │  ← filter bar
├──────────────────────────────────────────────────────┤
│  Table header: full-width 4px bar                    │
│  8 rows × [flex-1 48px wide] [80px] [70px] [180px]   │
│           [130px] [110px] [60px]                     │
└──────────────────────────────────────────────────────┘
```

```tsx
export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Metrics: 4 cards, 2-col on sm, 4-col on lg */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/40 px-4 py-3">
          <Skeleton className="h-4 w-full max-w-sm" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-4 py-3 border-t flex items-center gap-4">
            <div className="flex-1 min-w-0 space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-12 shrink-0" />
            <Skeleton className="h-4 w-8 shrink-0" />
            <Skeleton className="h-4 w-36 shrink-0" />
            <Skeleton className="h-4 w-28 shrink-0" />
            <Skeleton className="h-4 w-20 shrink-0" />
            <Skeleton className="h-7 w-14 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Filter change behavior**: When the user changes a filter (status dropdown, tier dropdown, or search input), TanStack Router re-runs the loader. The `pendingComponent` replaces the table region only after 200ms (to avoid flash for fast queries). Before 200ms, the page stays visible. After 200ms, the `DashboardSkeleton` replaces the whole page. The filter bar inputs remain interactive (user can change filters while loading).

---

### 2. Intake Wizard — `IntakeSkeleton`

**File**: `src/components/wizard/intake/IntakeSkeleton.tsx`
**Shown when**: `/projects/$projectId/intake` loader is in flight

Shape: project shell header + step progress bar + single form card

```tsx
export function IntakeSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Step progress bar: 6 circles connected by lines */}
      <div className="flex items-center gap-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <Fragment key={i}>
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            {i < 5 && <Skeleton className="h-1 flex-1" />}
          </Fragment>
        ))}
      </div>

      {/* Step title */}
      <div className="space-y-1">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      {/* Form fields: 4 rows of label + input */}
      <div className="space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>

      {/* Form footer: Back + Next buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  )
}
```

---

### 3. Procurement Wizard — `ProcurementSkeleton`

**File**: `src/components/wizard/procurement/ProcurementSkeleton.tsx`
**Shown when**: `/projects/$projectId/procurement` loader is in flight

Shape: 4 tab headers + table card skeleton

```tsx
export function ProcurementSkeleton() {
  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Tab bar: 4 tabs */}
      <div className="flex gap-1 border-b pb-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-t" />
        ))}
      </div>

      {/* Tab content: table card */}
      <Card className="p-4 space-y-4">
        {/* Card header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-28" />
        </div>

        {/* Table header */}
        <div className="flex gap-4 border-b pb-2">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* 5 rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}

        {/* Footer total row */}
        <div className="flex justify-end gap-4 pt-2 border-t">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-28" />
        </div>
      </Card>

      {/* Status panel */}
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-48" />
      </div>
    </div>
  )
}
```

---

### 4. Deployment Wizard — `DeploymentWizardSkeleton`

**File**: `src/components/wizard/deployment/DeploymentWizardSkeleton.tsx`
**Shown when**: `/projects/$projectId/deployment` loader is in flight

Shape: two-column layout (phase sidebar + phase detail)

```tsx
export function DeploymentWizardSkeleton() {
  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Left: phase list sidebar (240px) */}
      <div className="w-60 shrink-0 border-r p-3 space-y-1 overflow-y-auto">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 p-2">
            <Skeleton className="h-5 w-5 rounded-full shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-8 shrink-0" />
          </div>
        ))}
      </div>

      {/* Right: phase detail panel */}
      <div className="flex-1 p-6 space-y-5 overflow-y-auto">
        {/* Phase header */}
        <div className="space-y-1">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Warning banner placeholder */}
        <Skeleton className="h-12 w-full rounded" />

        {/* Checklist steps: 8 items */}
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 rounded shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
    </div>
  )
}
```

---

### 5. Financials Wizard — `FinancialsWizardSkeleton`

**File**: `src/components/wizard/financials/FinancialsWizardSkeleton.tsx`
**Shown when**: `/projects/$projectId/financials` loader is in flight

Shape: 4 tab headers + invoice card skeleton

```tsx
export function FinancialsWizardSkeleton() {
  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* Tab bar: 4 tabs */}
      <div className="flex gap-1 border-b">
        {['Invoicing', 'Expenses', 'P&L', 'Go-Live'].map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-t" />
        ))}
      </div>

      {/* Invoice cards: 2 cards stacked */}
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-28" />
          </div>
        </Card>
      ))}
    </div>
  )
}
```

---

### 6. Inventory Page — `InventorySkeleton`

**File**: `src/components/inventory/InventorySkeleton.tsx`
**Shown when**: `/inventory` loader is in flight

Shape: filter bar + table with stock indicator column

```tsx
export function InventorySkeleton() {
  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/40 px-4 py-3 flex gap-4">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="px-4 py-3 border-t flex items-center gap-4">
            <div className="flex-1 min-w-0 space-y-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="h-4 w-20 shrink-0" />
            <Skeleton className="h-4 w-20 shrink-0" />
            <Skeleton className="h-4 w-20 shrink-0" />
            {/* Stock level bar */}
            <div className="w-24 shrink-0 space-y-1">
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-4 w-24 shrink-0" />
            <Skeleton className="h-7 w-16 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

### 7. Global Financials — `FinancialsDashboardSkeleton`

**File**: `src/components/financials/FinancialsDashboardSkeleton.tsx`
**Shown when**: `/financials` loader is in flight

Shape: metric cards + chart area + table

```tsx
export function FinancialsDashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header + year picker */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-36" />
      </div>

      {/* HER + summary metric cards: 3 cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-40" />
          </Card>
        ))}
      </div>

      {/* Monthly chart area */}
      <Card className="p-4 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-48 w-full rounded" />
      </Card>

      {/* Per-project P&L table */}
      <Card className="p-4 space-y-3">
        <Skeleton className="h-5 w-36" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-24 shrink-0" />
              <Skeleton className="h-4 w-24 shrink-0" />
              <Skeleton className="h-4 w-24 shrink-0" />
              <Skeleton className="h-4 w-20 shrink-0" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
```

---

### 8. Settings Pages — `SettingsSkeleton`

**File**: `src/components/settings/SettingsSkeleton.tsx`
**Shown when**: any `/settings/*` route loader is in flight

Shape: tab bar + form sections (label + input pairs)

```tsx
export function SettingsSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Settings page heading */}
      <Skeleton className="h-8 w-28" />

      {/* Settings tab bar: 4 tabs */}
      <div className="flex gap-1 border-b pb-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-t" />
        ))}
      </div>

      {/* Form section 1 */}
      <div className="space-y-1">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Save button */}
      <div className="flex justify-end pt-4 border-t">
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  )
}
```

---

### 9. Auth Callback — Full-Page Spinner

**File**: `src/components/auth/AuthCallback.tsx`
**Shown when**: `/auth/callback` is exchanging PKCE code for session

```tsx
// Centered in full viewport
<div className="flex items-center justify-center min-h-screen">
  <LoadingSpinner size="lg" text="Signing you in..." />
</div>
```

No skeleton — the transition is sub-second. Spinner appears immediately on mount.

---

### 10. New Project Creation — Full-Page Spinner

**File**: `src/routes/_auth/projects/new.tsx`
**Shown when**: `createProject()` Supabase insert is in flight (before redirect to intake)

```tsx
// Centered in available content area (inside AppLayout)
<div className="flex items-center justify-center h-64">
  <LoadingSpinner size="md" text="Creating project..." />
</div>
```

---

## Form Submit Loading States

All form-submission loading states follow the shared button pending pattern. Below every mutating action is catalogued with its exact label changes.

### Intake Wizard

| Action | Button idle label | Button pending label | Pending duration |
|--------|-------------------|---------------------|-----------------|
| Step 1–5 "Save & Continue" | "Continue" | "Saving..." | ~300ms (single row update) |
| Step 6 "Submit Intake" | "Submit & Generate BOM" | "Generating BOM..." | ~1–2s (BOM + checklist seed) |
| Edit mode "Save Changes" | "Save Changes" | "Saving..." | ~300ms |

**Step 6 specific behavior** (BOM generation is the slowest intake operation):
- Button label cycles: "Generating BOM..." (first 800ms) then "Seeding checklist..." if still pending
- Implemented via `useEffect` on `isSubmitting` + `setTimeout(800, setLabel)`
- All 6 step-form inputs disabled during submission
- After success: router navigate to procurement with toast "BOM generated — {n} items"

```tsx
// Step 6 submit button
const [submitLabel, setSubmitLabel] = useState<string | null>(null)

useEffect(() => {
  if (!isSubmitting) { setSubmitLabel(null); return }
  setSubmitLabel('Generating BOM...')
  const t = setTimeout(() => setSubmitLabel('Seeding checklist...'), 800)
  return () => clearTimeout(t)
}, [isSubmitting])

<Button type="submit" disabled={isSubmitting}>
  {isSubmitting
    ? <><InlineSpinner className="mr-2" />{submitLabel ?? 'Generating BOM...'}</>
    : 'Submit & Generate BOM'
  }
</Button>
```

---

### Procurement Wizard

| Action | Button idle label | Button pending label |
|--------|-------------------|---------------------|
| "Add BOM Item" dialog submit | "Add Item" | "Adding..." |
| "Edit BOM Item" dialog submit | "Save Changes" | "Saving..." |
| "Delete BOM Item" | "Delete" | "Deleting..." |
| "Create Purchase Order" dialog submit | "Create PO" | "Creating..." |
| "Mark Items Received" | "Mark Received" | "Saving..." |
| "Confirm Packing Complete" | "Confirm Packing" | "Confirming..." |
| "Order CC Terminal" | "Place Order" | "Ordering..." |
| "Update CC Terminal Status" | "Save" | "Saving..." |
| "Update Sign Status" | "Save" | "Saving..." |
| "Mark Ready for Deployment" | "Mark Ready for Deployment" | "Advancing..." |

**Dialog behavior during submit**:
- Dialog `close` button (X) and "Cancel" button are `disabled` while `isSubmitting`
- Form inputs inside dialog are `disabled` while `isSubmitting`
- Dialog does not close until mutation resolves (success → close + toast; error → stay open + error message)

**"Mark Ready for Deployment" specific**:
- This is a stage-advance action — it seeds the deployment checklist (slow: ~1s)
- Button label: "Advancing..." with spinner
- Full tab area shows `opacity-50 pointer-events-none` overlay on the procurement wizard while pending (prevents any interaction)
- On success: navigate to `/projects/$projectId/deployment`

---

### Deployment Wizard

#### Checklist Item Toggle (Optimistic)

The checklist checkbox is **optimistic** — the UI updates instantly, then confirms/rolls back:

```tsx
// Optimistic update pattern
async function toggleChecklistItem(itemId: string, currentValue: boolean) {
  // 1. Instantly update local state (no spinner shown)
  setItems(prev => prev.map(i =>
    i.id === itemId ? { ...i, is_completed: !currentValue } : i
  ))

  // 2. Persist to Supabase
  const { error } = await supabase
    .from('deployment_checklist_items')
    .update({ is_completed: !currentValue })
    .eq('id', itemId)

  if (error) {
    // 3. Roll back local state on error
    setItems(prev => prev.map(i =>
      i.id === itemId ? { ...i, is_completed: currentValue } : i
    ))
    toast.error('Failed to save — please try again', { duration: 5000 })
  }
}
```

No spinner shown for checkbox toggle. Failure shows error toast and reverts checkbox. The checkbox is never `disabled` during the async call — optimistic means no waiting.

#### Note Auto-Save

Phase notes are auto-saved with debounce:

```tsx
// 1s debounce after user stops typing
// While pending save:
//   - Textarea NOT disabled (user can keep typing)
//   - Inline indicator below textarea: "Saving..." (text-xs text-muted-foreground)
// After save success:
//   - Indicator changes to: "Saved" with CheckCircle2 icon (shown for 2s then hidden)
// After save error:
//   - Indicator changes to: "Failed to save" (text-destructive) with retry link
```

**Inline save indicator below textarea**:
```tsx
{saveState === 'saving' && (
  <span className="flex items-center gap-1 text-xs text-muted-foreground">
    <InlineSpinner className="h-3 w-3" /> Saving...
  </span>
)}
{saveState === 'saved' && (
  <span className="flex items-center gap-1 text-xs text-muted-foreground">
    <CheckCircle2 className="h-3 w-3" /> Saved
  </span>
)}
{saveState === 'error' && (
  <span className="flex items-center gap-1 text-xs text-destructive">
    <AlertCircle className="h-3 w-3" /> Failed to save
    <button className="underline ml-1" onClick={retrySave}>Retry</button>
  </span>
)}
```

#### Status Transition Buttons

| Action | Button idle label | Button pending label |
|--------|-------------------|---------------------|
| "Start Configuration" | "Start Configuration" | "Updating..." |
| "Mark Ready to Ship" | "Mark Ready to Ship" | "Updating..." |
| "Mark Shipped" | "Mark Shipped" | "Updating..." |
| "Mark Installing" | "Mark Installing" | "Updating..." |
| "Start QC" | "Start QC" | "Updating..." |
| "Mark Deployment Complete" | "Mark Deployment Complete" | "Completing..." |

"Mark Deployment Complete" advances to `financial_close` — same slow operation behavior as "Mark Ready for Deployment": `opacity-50 pointer-events-none` overlay on the deployment wizard while pending, then navigate to financials.

---

### Financials Wizard

| Action | Button idle label | Button pending label |
|--------|-------------------|---------------------|
| "Mark Contract Signed" | "Mark as Signed" | "Saving..." |
| Send deposit invoice | "Send Invoice" | "Sending..." |
| "Mark Deposit Paid" (dialog submit) | "Mark as Paid" | "Saving..." |
| Send final invoice | "Send Invoice" | "Sending..." |
| "Mark Final Paid" (dialog submit) | "Mark as Paid" | "Saving..." |
| "Add Expense" dialog submit | "Add Expense" | "Adding..." |
| "Edit Expense" dialog submit | "Save Changes" | "Saving..." |
| "Delete Expense" | "Delete" | "Deleting..." |
| "Set Go-Live Date" | "Save Date" | "Saving..." |
| "Mark Project Complete" | "Mark Complete" | "Completing..." |

**"Mark Project Complete" specific**:
- Confirmation dialog required before submission (see `qa-confirmation-dialogs.md`)
- After user confirms: dialog closes, button on financials page enters pending state
- While pending: entire financials wizard is `opacity-50 pointer-events-none`
- On success: page re-renders in read-only mode with "Project Completed" banner

---

### Inventory Page

| Action | Button idle label | Button pending label |
|--------|-------------------|---------------------|
| "Adjust Stock" dialog submit | "Save Adjustment" | "Saving..." |
| "Create PO" dialog submit | "Create PO" | "Creating..." |
| "Mark PO Received" | "Mark Received" | "Saving..." |
| "Update Reorder Threshold" (inline) | "Save" | "Saving..." |

**Inline reorder threshold edit**:
- Clicking the threshold value shows an inline edit input + "Save" / "Cancel" buttons
- "Save" button shows `InlineSpinner` while pending
- On success: input collapses back to display mode; no toast (silent save)
- On error: input stays open with error text below; toast error

---

### Settings Pages

| Action | Button idle label | Button pending label |
|--------|-------------------|---------------------|
| Pricing tab "Save Pricing" | "Save Changes" | "Saving..." |
| Catalog tab "Add Item" dialog submit | "Add Item" | "Adding..." |
| Catalog tab "Edit Item" dialog submit | "Save Changes" | "Saving..." |
| Catalog tab "Delete Item" | "Delete" | "Deleting..." |
| Team tab "Save Team Settings" | "Save Changes" | "Saving..." |
| Travel tab "Save Travel Defaults" | "Save Changes" | "Saving..." |

**Settings save behavior**:
- All settings are saved with a single "Save Changes" button per tab
- No auto-save on settings tabs
- Unsaved changes indicator: if any field has been modified (dirty), button label stays "Save Changes" (not grayed out)
- After save success: button returns to idle state, `toast.success("Settings saved", { duration: 3000 })`

---

## Filter Change Loading (Dashboard + Inventory)

When a filter/search changes on the dashboard or inventory page, TanStack Router re-runs the loader. Behavior during re-fetch:

**Dashboard filter change**:
- After 200ms threshold (`pendingMs: 200`), entire `DashboardSkeleton` replaces the page
- For search input (debounced 300ms): loader does not fire until debounce settles; during the 300ms debounce window there is no loading indicator
- Filter selects (status, tier): loader fires immediately on value change; skeleton appears after 200ms if query is slow
- No "Loading..." text is shown in filter inputs while pending

**Inventory filter change**:
- Same 200ms skeleton threshold behavior as dashboard
- `InventorySkeleton` replaces the page

---

## Pagination Loading (Dashboard)

Clicking a page number or Prev/Next:
- TanStack Router re-runs the loader with the new `page` param
- After 200ms: `DashboardSkeleton` replaces the page
- The scroll-to-top call (`window.scrollTo({ top: 0, behavior: 'smooth' })`) fires before the loader, so the skeleton appears at the top of the page

---

## Project Shell Loader (Breadcrumb + Stage Tabs)

The `$projectId.tsx` layout route also has a loader (`getProject`). Its `pendingComponent`:

**File**: `src/components/layout/ProjectShellSkeleton.tsx`

```tsx
export function ProjectShellSkeleton() {
  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <span className="text-muted-foreground">/</span>
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Stage tabs: 4 tabs */}
      <div className="flex gap-1 border-b pb-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32 rounded-t" />
        ))}
      </div>

      {/* Content area */}
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="md" />
      </div>
    </div>
  )
}
```

This skeleton shows while the project record itself is loading (before the stage-specific skeleton can render). In practice it appears only on hard refresh of a project URL.

---

## Login Page — Submit Loading State

**File**: `src/components/auth/LoginPage.tsx`

| Action | Button idle | Button pending |
|--------|-------------|----------------|
| "Sign In" (password) | "Sign In" | "Signing in..." |
| "Send magic link" | "Send magic link" | "Sending..." |

While sign-in is pending:
- Email and password inputs are `disabled`
- Both buttons are `disabled`
- No full-page overlay — only the button state changes

After magic link success (pending resolves):
- Button returns to idle
- Green success message below form: "Check your email for a login link."
- No navigation — user must click the email link

---

## Summary Table

| Location | Operation | Loading treatment |
|----------|-----------|-------------------|
| `/projects` page load | Route loader | `DashboardSkeleton` full page |
| `/projects` filter change | Route loader re-run | `DashboardSkeleton` after 200ms |
| `/projects` pagination | Route loader re-run | `DashboardSkeleton` after 200ms |
| `/projects/new` | Project create | `LoadingSpinner` "Creating project..." |
| `/auth/callback` | PKCE exchange | `LoadingSpinner` "Signing you in..." |
| `/projects/$id/intake` page load | Route loader | `IntakeSkeleton` |
| Intake Step 1–5 submit | Row update | Button: "Saving..." + inputs disabled |
| Intake Step 6 submit | BOM + checklist seed | Button: "Generating BOM..." / "Seeding checklist..." |
| `/projects/$id/procurement` page load | Route loader | `ProcurementSkeleton` |
| Procurement any dialog submit | Mutation | Button pending + dialog inputs disabled |
| Procurement "Mark Ready for Deployment" | Stage advance | Button: "Advancing..." + wizard overlay |
| `/projects/$id/deployment` page load | Route loader | `DeploymentWizardSkeleton` |
| Deployment checklist toggle | Optimistic update | No spinner — instant with rollback on error |
| Deployment note save | Debounced auto-save | Inline: "Saving..." / "Saved" / "Failed to save" |
| Deployment status transition buttons | Row update | Button: "Updating..." |
| Deployment "Mark Complete" | Stage advance | Button: "Completing..." + wizard overlay |
| `/projects/$id/financials` page load | Route loader | `FinancialsWizardSkeleton` |
| Financials any dialog submit | Mutation | Button pending + dialog inputs disabled |
| Financials "Mark Project Complete" | Stage advance | Button: "Completing..." + wizard overlay |
| `/inventory` page load | Route loader | `InventorySkeleton` |
| `/inventory` filter change | Route loader re-run | `InventorySkeleton` after 200ms |
| Inventory dialog submit | Mutation | Button pending + dialog inputs disabled |
| Inventory inline threshold edit | Row update | Button: "Saving..." (inline) |
| `/financials` page load | Route loader | `FinancialsDashboardSkeleton` |
| Any settings page load | Route loader | `SettingsSkeleton` |
| Settings "Save Changes" | Settings upsert | Button: "Saving..." + form inputs disabled |
| Settings catalog dialog submit | Mutation | Button pending + dialog inputs disabled |
| Login "Sign In" | Auth | Button: "Signing in..." + inputs disabled |
| Login "Send magic link" | Auth OTP | Button: "Sending..." + inputs disabled |
| `$projectId.tsx` layout load | Project fetch | `ProjectShellSkeleton` |

---

## Implementation Notes

### TanStack Router Pending Threshold

Configure 200ms pending threshold globally in `createRouter` to avoid skeleton flashes on fast queries:

```ts
// src/main.tsx
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPendingMs: 200,         // wait 200ms before showing pendingComponent
  defaultPendingMinMs: 300,      // keep skeleton visible at least 300ms to avoid flash
})
```

### Stage Advance Overlay Pattern

For stage-advance operations ("Mark Ready for Deployment", "Mark Deployment Complete", "Mark Project Complete"):

```tsx
// Wrap the wizard content area
<div className={cn('relative', isAdvancing && 'opacity-50 pointer-events-none')}>
  {/* wizard content */}
</div>

// Optional: spinning overlay on top for extra clarity
{isAdvancing && (
  <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded z-10">
    <LoadingSpinner size="lg" text="Please wait..." />
  </div>
)}
```

### Skeleton Shimmer Direction

All `Skeleton` components use shadcn's default `animate-pulse` (opacity pulse), not a directional shimmer. This keeps implementation simple and consistent with the shadcn design system.
