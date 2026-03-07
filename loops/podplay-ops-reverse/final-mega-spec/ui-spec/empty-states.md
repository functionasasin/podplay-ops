# PodPlay Ops Wizard — Empty States

**Aspect**: qa-empty-states
**Wave**: 7 — QA-Readiness
**Date**: 2026-03-07

Every list, table, and view that can contain zero records must show a specific empty state. This file specifies the icon, heading, description, and CTA for each.

---

## Implementation Pattern

All empty states use the same structural wrapper:

```tsx
// src/components/ui/EmptyState.tsx
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  heading: string
  description: string
  cta?: {
    label: string
    onClick?: () => void
    href?: string
  }
}

export function EmptyState({ icon: Icon, heading, description, cta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-base font-semibold mb-1">{heading}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>
      {cta && (
        cta.href
          ? <Button variant="outline" asChild><a href={cta.href}>{cta.label}</a></Button>
          : <Button variant="outline" onClick={cta.onClick}>{cta.label}</Button>
      )}
    </div>
  )
}
```

---

## 1. Dashboard — Project List

**Component**: `src/components/dashboard/ProjectsEmptyState.tsx`
**Trigger**: `projects.length === 0` from loader result
**Two variants** based on `hasFilters` prop (`!!search.status || !!search.tier || !!search.q`):

### Variant A: No projects in database (hasFilters = false)

| Field | Value |
|-------|-------|
| Icon | `FolderOpen` (lucide) |
| Heading | "No projects yet" |
| Description | "Start by creating your first installation project." |
| CTA label | "+ New Project" |
| CTA action | `navigate({ to: '/projects/new' })` |

### Variant B: No results for current filters (hasFilters = true)

| Field | Value |
|-------|-------|
| Icon | `SearchX` (lucide) |
| Heading | "No projects found" |
| Description | "Try adjusting your filters or search term." |
| CTA label | "Clear filters" |
| CTA action | `navigate({ search: { page: 1 } })` (clears all filters) |

---

## 2. Inventory Page — Inventory Table

**Component**: `src/components/inventory/InventoryPage.tsx` (inline, not a separate component)
**Trigger**: `items.length === 0` from loader result
**Two variants**:

### Variant A: No inventory records (database empty — seed not run)

| Field | Value |
|-------|-------|
| Icon | `Package` (lucide) |
| Heading | "Inventory not set up yet" |
| Description | "Run the seed data migration to populate the hardware catalog." |
| CTA | None |

### Variant B: No items match filters (filters active)

| Field | Value |
|-------|-------|
| Icon | `Package` (lucide) |
| Heading | "No items found" |
| Description | "Try adjusting your search or filters." |
| CTA label | "Clear Filters" |
| CTA action | `navigate({ search: {} })` |

**Detection**: `items.length === 0 && (search.q || search.category || search.low_stock)` → Variant B; otherwise Variant A.

---

## 3. Inventory — Movement History Sheet

**Component**: `src/components/inventory/MovementHistorySheet.tsx`
**Trigger**: `movements?.length === 0` (after query resolves)

| Field | Value |
|-------|-------|
| Icon | None (text only) |
| Heading | None |
| Description | "No movements recorded yet." |
| CTA | None |

**Implementation**:
```tsx
{movements?.length === 0 ? (
  <p className="text-sm text-muted-foreground text-center py-8">
    No movements recorded yet.
  </p>
) : (
  <div className="space-y-1">
    {movements?.map((m) => <MovementRow key={m.id} movement={m} />)}
  </div>
)}
```

---

## 4. Inventory — Reconciliation Dialog (Clean State)

**Component**: `src/components/inventory/ReconciliationDialog.tsx`
**Trigger**: `reconciliationRows.length === 0` after `runReconciliation()` resolves

| Field | Value |
|-------|-------|
| Icon | `CheckCircle2` (lucide), `text-green-500` |
| Heading | "Inventory is clean" |
| Description | "All inventory levels match the movement log." |
| CTA | None |

---

## 5. Procurement Wizard — BOM Review Tab

**Component**: `src/components/wizard/procurement/BomReviewTab.tsx`
**Trigger**: `bom.length === 0` (BOM not generated or all items removed)

| Field | Value |
|-------|-------|
| Icon | `ClipboardList` (lucide) |
| Heading | "No BOM items" |
| Description | "The bill of materials is empty. Regenerate it from the project configuration or add items manually." |
| CTA label | "Regenerate BOM" |
| CTA action | Opens regeneration confirmation dialog |

**Note**: This state should not occur in normal flow (BOM is auto-generated at intake completion). It can occur if someone removes all items or if BOM generation failed.

---

## 6. Procurement Wizard — Inventory Check Tab

**Component**: `src/components/wizard/procurement/InventoryCheckTab.tsx`
**Trigger**: `inventoryRows.length === 0` (BOM is empty, so no items to check)

| Field | Value |
|-------|-------|
| Icon | `PackageSearch` (lucide) |
| Heading | "No items to check" |
| Description | "The BOM is empty. Add items to the BOM before checking inventory availability." |
| CTA label | "Go to BOM Review" |
| CTA action | `navigate({ search: (prev) => ({ ...prev, tab: 'bom' }) })` |

---

## 7. Procurement Wizard — Purchase Orders Tab

**Component**: `src/components/wizard/procurement/PurchaseOrdersTab.tsx`
**Trigger**: `purchaseOrders.length === 0` (no POs created for this project yet)

| Field | Value |
|-------|-------|
| Icon | `ShoppingCart` (lucide) |
| Heading | "No purchase orders yet" |
| Description | "Create a PO for items not currently in stock." |
| CTA label | "Create PO" |
| CTA action | Opens New PO dialog (same as clicking "New PO" button) |

---

## 8. Procurement Wizard — Packing Tab

**Component**: `src/components/wizard/procurement/PackingTab.tsx`
**Trigger**: `bom.length === 0` (no items to pack)

| Field | Value |
|-------|-------|
| Icon | `PackageOpen` (lucide) |
| Heading | "Nothing to pack" |
| Description | "Add items to the BOM before confirming the packing list." |
| CTA label | "Go to BOM Review" |
| CTA action | `navigate({ search: (prev) => ({ ...prev, tab: 'bom' }) })` |

---

## 9. Deployment Wizard — Phase Checklist

**Component**: `src/components/wizard/deployment/DeploymentChecklist.tsx`
**Trigger**: `phases.length === 0` (checklist not seeded — should not occur in normal flow)

| Field | Value |
|-------|-------|
| Icon | `ClipboardCheck` (lucide) |
| Heading | "Checklist not generated" |
| Description | "The deployment checklist was not created. Contact support or re-advance the project from Procurement." |
| CTA | None |

**Note**: The deployment checklist is seeded from templates when the project advances from Procurement to Deployment. This state is a guard against data corruption — it is not a normal user flow.

---

## 10. Deployment Wizard — Phase Steps (within a phase)

**Component**: `src/components/wizard/deployment/PhasePanel.tsx`
**Trigger**: `phase.steps.length === 0` (a phase has no steps — should not occur with seeded templates)

| Field | Value |
|-------|-------|
| Icon | None |
| Heading | None |
| Description | "No steps in this phase." |
| CTA | None |

**Implementation**: Simple text fallback inline, not a full `EmptyState` component:
```tsx
{phase.steps.length === 0 && (
  <p className="text-sm text-muted-foreground py-4 text-center">No steps in this phase.</p>
)}
```

---

## 11. Financials — Pipeline Tab

**Component**: `src/components/financials/PipelineTab.tsx`
**Trigger**: `pipeline.total_projects === 0` (no projects in any revenue stage)

| Field | Value |
|-------|-------|
| Icon | `TrendingUp` (lucide) |
| Heading | "No projects in pipeline" |
| Description | "Create your first project to start tracking revenue." |
| CTA label | "New Project" |
| CTA action | `navigate({ to: '/projects/new' })` |

---

## 12. Financials — P&L Tab

**Component**: `src/components/financials/PLTab.tsx`
**Trigger**: `monthlyRows.length === 0` (no closed months with data for selected period)

| Field | Value |
|-------|-------|
| Icon | `BarChart3` (lucide) |
| Heading | "No P&L data for this period" |
| Description | "Close a month using the Monthly Close tab to generate P&L snapshots." |
| CTA label | "Go to Monthly Close" |
| CTA action | `navigate({ search: (prev) => ({ ...prev, tab: 'monthly-close' }) })` |

---

## 13. Financials — HER Tab

**Component**: `src/components/financials/HERTab.tsx`
**Trigger**: `herHistory.length === 0` (no monthly snapshots exist)

| Field | Value |
|-------|-------|
| Icon | `Activity` (lucide) |
| Heading | "No HER data yet" |
| Description | "Hardware Efficiency Ratio is calculated from monthly snapshots. Close your first month to see HER trends." |
| CTA label | "Go to Monthly Close" |
| CTA action | `navigate({ search: (prev) => ({ ...prev, tab: 'monthly-close' }) })` |

---

## 14. Financials — Receivables Tab

**Component**: `src/components/financials/ReceivablesTab.tsx`
**Trigger**: `receivables.length === 0` (no outstanding unpaid invoices)

| Field | Value |
|-------|-------|
| Icon | `CheckCircle2` (lucide), `text-green-500` |
| Heading | "No outstanding invoices" |
| Description | "All invoices have been paid or none have been sent yet." |
| CTA | None |

---

## 15. Financials — Per-Project Tab

**Component**: `src/components/financials/PerProjectTab.tsx`
**Trigger**: `projectSummaries.length === 0` (no non-cancelled projects exist)

| Field | Value |
|-------|-------|
| Icon | `FolderOpen` (lucide) |
| Heading | "No projects yet" |
| Description | "Create a project to start tracking per-project P&L." |
| CTA label | "New Project" |
| CTA action | `navigate({ to: '/projects/new' })` |

---

## 16. Financials — Reconciliation Tab

**Component**: `src/components/financials/ReconciliationTab.tsx`
**Trigger**: `report.has_issues === false` (all 5 checks passed — no discrepancies found)

| Field | Value |
|-------|-------|
| Icon | `CheckCircle2` (lucide), `text-green-500` |
| Heading | "All checks passed" |
| Description | "No discrepancies found across inventory, POs, BOM costs, project costs, and revenue stages." |
| CTA | None |

---

## 17. Financials — Monthly Close Tab (no snapshot for selected month)

**Component**: `src/components/financials/MonthlyCloseTab.tsx`
**Trigger**: `snapshot === null` (selected month has not been closed yet)

| Field | Value |
|-------|-------|
| Icon | `Calendar` (lucide) |
| Heading | "{MonthName YYYY} not closed yet" (e.g., "February 2026 not closed yet") |
| Description | "Review expenses and OpEx below, then click 'Close Month' to save a snapshot." |
| CTA | None (the "Close Month" form is shown below this message) |

**Note**: This is an informational banner, not a true empty state — the monthly close form is still rendered below. Use a muted info card pattern instead of `EmptyState`:
```tsx
<div className="rounded-lg border border-muted bg-muted/30 px-4 py-3 flex items-center gap-3 mb-6">
  <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
  <p className="text-sm text-muted-foreground">
    {formatMonth(selectedYear, selectedMonth)} has not been closed yet.
    Review expenses below, then click <strong>Close Month</strong>.
  </p>
</div>
```

---

## 18. Settings — Hardware Catalog Tab

**Component**: `src/components/settings/CatalogSettings.tsx`
**Trigger**: `catalogItems.length === 0` (no items in hardware_catalog — seed not run)

| Field | Value |
|-------|-------|
| Icon | `Package` (lucide) |
| Heading | "Hardware catalog is empty" |
| Description | "Run the seed data migration to populate the default hardware catalog, or add items manually." |
| CTA label | "Add Item" |
| CTA action | Opens "Add Catalog Item" dialog (same as clicking "+ Add Item" button) |

---

## 19. Settings — Team Contacts Tab

**Component**: `src/components/settings/TeamSettings.tsx`
**Trigger**: `contacts.length === 0` (no entries in team_contacts table)

| Field | Value |
|-------|-------|
| Icon | `Users` (lucide) |
| Heading | "No team contacts" |
| Description | "Add team members to show their info in the project wizard." |
| CTA label | "Add Contact" |
| CTA action | Opens "Add Contact" dialog (same as clicking "+ Add Contact" button) |

---

## Summary Table

| # | View | Trigger | Icon | Heading | Has CTA |
|---|------|---------|------|---------|---------|
| 1A | Dashboard / no projects | DB empty | `FolderOpen` | "No projects yet" | Yes — New Project |
| 1B | Dashboard / no filter results | Filters active, 0 results | `SearchX` | "No projects found" | Yes — Clear filters |
| 2A | Inventory / DB empty | `items.length === 0`, no filters | `Package` | "Inventory not set up yet" | No |
| 2B | Inventory / no filter results | `items.length === 0`, filters active | `Package` | "No items found" | Yes — Clear Filters |
| 3 | Movement History Sheet | 0 movements | (text only) | — | No |
| 4 | Reconciliation Dialog (clean) | 0 discrepancies | `CheckCircle2` | "Inventory is clean" | No |
| 5 | Procurement / BOM tab | 0 BOM items | `ClipboardList` | "No BOM items" | Yes — Regenerate BOM |
| 6 | Procurement / Inventory tab | 0 BOM items | `PackageSearch` | "No items to check" | Yes — Go to BOM Review |
| 7 | Procurement / POs tab | 0 POs | `ShoppingCart` | "No purchase orders yet" | Yes — Create PO |
| 8 | Procurement / Packing tab | 0 BOM items | `PackageOpen` | "Nothing to pack" | Yes — Go to BOM Review |
| 9 | Deployment / phase list | 0 phases | `ClipboardCheck` | "Checklist not generated" | No |
| 10 | Deployment / phase steps | 0 steps | (text only) | — | No |
| 11 | Financials / Pipeline tab | 0 projects | `TrendingUp` | "No projects in pipeline" | Yes — New Project |
| 12 | Financials / P&L tab | 0 monthly rows | `BarChart3` | "No P&L data for this period" | Yes — Monthly Close tab |
| 13 | Financials / HER tab | 0 snapshots | `Activity` | "No HER data yet" | Yes — Monthly Close tab |
| 14 | Financials / Receivables tab | 0 receivables | `CheckCircle2` | "No outstanding invoices" | No |
| 15 | Financials / Per-Project tab | 0 projects | `FolderOpen` | "No projects yet" | Yes — New Project |
| 16 | Financials / Reconciliation tab | all checks pass | `CheckCircle2` | "All checks passed" | No |
| 17 | Financials / Monthly Close tab | month not closed | `Calendar` | "{Month} not closed yet" | No (form below) |
| 18 | Settings / Catalog tab | 0 catalog items | `Package` | "Hardware catalog is empty" | Yes — Add Item |
| 19 | Settings / Team tab | 0 contacts | `Users` | "No team contacts" | Yes — Add Contact |

---

## Lucide Icons Used

| Icon | Import | Usage |
|------|--------|-------|
| `FolderOpen` | `lucide-react` | Dashboard no projects; Financials per-project |
| `SearchX` | `lucide-react` | Dashboard no filter results |
| `Package` | `lucide-react` | Inventory empty states; Settings catalog empty |
| `CheckCircle2` | `lucide-react` | Reconciliation clean; Receivables clear; Financials recon pass |
| `ClipboardList` | `lucide-react` | Procurement BOM tab empty |
| `PackageSearch` | `lucide-react` | Procurement inventory tab empty |
| `ShoppingCart` | `lucide-react` | Procurement POs tab empty |
| `PackageOpen` | `lucide-react` | Procurement packing tab empty |
| `ClipboardCheck` | `lucide-react` | Deployment checklist not generated |
| `TrendingUp` | `lucide-react` | Financials pipeline empty |
| `BarChart3` | `lucide-react` | Financials P&L no data |
| `Activity` | `lucide-react` | Financials HER no data |
| `Calendar` | `lucide-react` | Monthly close not closed yet |
| `Users` | `lucide-react` | Settings team contacts empty |
