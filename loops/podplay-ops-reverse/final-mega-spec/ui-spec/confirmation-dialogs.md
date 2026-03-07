# PodPlay Ops Wizard — Confirmation Dialogs

**Aspect**: qa-confirmation-dialogs
**Wave**: 7 — QA-Readiness
**Date**: 2026-03-07

---

## Overview

Every destructive or irreversible action in the app uses a shadcn `<AlertDialog>` for confirmation. This file specifies the exact title, body text, button labels, default focus, and component name for all 16 confirmation dialogs.

**Pattern**: All dialogs use shadcn `AlertDialog` from `@/components/ui/alert-dialog`. Import `AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger` from `@/components/ui/alert-dialog`.

**Destructive button pattern**: Use `cn(buttonVariants({ variant: 'destructive' }))` as the className on `<AlertDialogAction>` for irreversible deletes. Use the default variant for forward-progress confirmations (advance stage, mark shipped, mark paid).

**Focus on open**: For all dialogs where the confirm action permanently destroys data, the `<AlertDialogCancel>` receives `autoFocus` so keyboard users cannot accidentally confirm by pressing Enter.

**File location**: All dialog components live in `src/components/dialogs/`. Each dialog is a standalone component accepting the entity it acts on as a prop plus `open`, `onOpenChange`, and `onConfirm` callbacks.

---

## Dialog Reference Table

| ID | Dialog Name | Trigger | Confirm Button | Focus Default |
|----|------------|---------|---------------|---------------|
| D-01 | `RemoveBomItemDialog` | Row action "Remove Item" (not allocated) | "Remove Item" (destructive) | Cancel |
| D-02 | `RemoveBomItemDialog` | Row action "Remove Item" (allocated variant) | "Remove and Release" (destructive) | Cancel |
| D-03 | `RegenerateBomDialog` | "Regenerate BOM" button on BOM tab | "Regenerate BOM" (destructive) | Cancel |
| D-04 | `CancelPODialog` | "Cancel" action on PO row (pending/ordered) | "Cancel PO" (destructive) | Cancel |
| D-05 | `CancelPODialog` | "Cancel" action on PO row (partial received) | "Cancel Remaining" (destructive) | Cancel |
| D-06 | `MarkOrderedDialog` | "Mark Ordered" on PO row (pending) | "Yes, Mark as Ordered" (default) | Confirm |
| D-07 | `MarkAllShippedDialog` | "Mark All Shipped" on Packing tab | "Mark Shipped" (default) | Confirm |
| D-08 | `UnshipItemDialog` | "Un-ship" on shipped row in Packing tab | "Un-ship" (outline) | Cancel |
| D-09 | `AdvanceToDeploymentDialog` | "Mark Ready for Deployment" exit button | "Advance to Deployment" (default) | Confirm |
| D-10 | `CancelProjectDialog` | "Cancel Project" on intake view mode | "Yes, Cancel Project" (destructive) | Cancel |
| D-11 | `DeleteProjectDialog` | Kebab "Delete" on dashboard row | "Delete Project" (destructive) | Cancel |
| D-12 | `DeleteExpenseDialog` | Trash icon on expense row | "Delete" (destructive) | Cancel |
| D-13 | `MarkFinalPaidDialog` | "Mark Final Paid — Close Project" | "Mark Paid & Close" (default) | Confirm |
| D-14 | `UnlockDeploymentDialog` | "Unlock to Edit" banner on deployment read-only | "Unlock" (default) | Cancel |
| D-15 | `UnlockCompletedProjectDialog` | "Unlock for editing" on financials completed banner | "Unlock for Editing" (default) | Cancel |
| D-16 | `DeactivateCatalogItemDialog` | Kebab "Deactivate" on catalog row | "Deactivate" (destructive) | Cancel |
| D-17 | `DeactivateContactDialog` | Kebab "Deactivate" on team contacts row | "Deactivate" (outline) | Cancel |

---

## D-01: Remove BOM Item (Standard)

**Component**: `src/components/dialogs/RemoveBomItemDialog.tsx`

**Trigger**: Row action "Remove Item" on a BOM table row where `project_bom_items.allocated = false`.

**Props**:
```typescript
interface RemoveBomItemDialogProps {
  item: { id: string; name: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}
```

**Dialog content**:
```
Title:  Remove Item?
Body:   Remove "[item.name]" from the BOM? This cannot be undone.
```

**Buttons**:
- Cancel: `<AlertDialogCancel autoFocus>Cancel</AlertDialogCancel>`
- Confirm: `<AlertDialogAction className={cn(buttonVariants({ variant: 'destructive' }))} onClick={onConfirm}>Remove Item</AlertDialogAction>`

**Example body text**: Remove "UniFi Dream Machine SE" from the BOM? This cannot be undone.

**Toast on confirm**: "Item removed from BOM" (success, 3s) / "Failed to remove item" (error, 5s)

---

## D-02: Remove BOM Item (Allocated Variant)

**Component**: `src/components/dialogs/RemoveBomItemDialog.tsx` (same component, variant prop)

**Trigger**: Row action "Remove Item" when `project_bom_items.allocated = true`.

**Props**: Same as D-01 plus `isAllocated: true`.

**Dialog content**:
```
Title:  Remove Allocated Item?
Body:   "[item.name]" is already reserved in inventory for this project.
        Removing it will release that inventory allocation.
        This cannot be undone.
```

**Buttons**:
- Cancel: `<AlertDialogCancel autoFocus>Cancel</AlertDialogCancel>`
- Confirm: `<AlertDialogAction className={cn(buttonVariants({ variant: 'destructive' }))} onClick={onConfirm}>Remove and Release</AlertDialogAction>`

**Example body text**: "Mac Mini 16GB 256GB" is already reserved in inventory for this project. Removing it will release that inventory allocation. This cannot be undone.

**Toast on confirm**: "Item removed and allocation released" (success, 3s) / "Failed to remove item" (error, 5s)

---

## D-03: Regenerate BOM

**Component**: `src/components/dialogs/RegenerateBomDialog.tsx`

**Trigger**: "Regenerate BOM" button in the top-right of the BOM tab.

**Disabled condition**: If any `project_bom_items.allocated = true`, the button is disabled with tooltip: "Release all inventory allocations before regenerating the BOM."

**Props**:
```typescript
interface RegenerateBomDialogProps {
  itemCount: number        // current project_bom_items count
  customItemCount: number  // count of items where is_manual = true (will be preserved)
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}
```

**Dialog content**:
```
Title:  Regenerate BOM?
Body:   This will discard all quantity overrides, cost overrides, and the [itemCount - customItemCount]
        auto-generated items — resetting them to the values calculated from your intake settings.
        [If customItemCount > 0:]
        Your [customItemCount] manually added item(s) will be preserved.
        This cannot be undone.
```

**Buttons**:
- Cancel: `<AlertDialogCancel autoFocus>Cancel</AlertDialogCancel>`
- Confirm: `<AlertDialogAction className={cn(buttonVariants({ variant: 'destructive' }))} onClick={onConfirm}>Regenerate BOM</AlertDialogAction>`

**Example body text (with custom items)**:
This will discard all quantity overrides, cost overrides, and the 22 auto-generated items — resetting them to the values calculated from your intake settings. Your 2 manually added item(s) will be preserved. This cannot be undone.

**Example body text (no custom items)**:
This will discard all quantity overrides, cost overrides, and the 24 auto-generated items — resetting them to the values calculated from your intake settings. This cannot be undone.

**Toast on confirm**: "BOM regenerated" (success, 3s) / "Failed to regenerate BOM" (error, 5s)

---

## D-04: Cancel Purchase Order (No Items Received)

**Component**: `src/components/dialogs/CancelPODialog.tsx`

**Trigger**: "Cancel" action button on a PO row where `purchase_orders.status = 'pending'` or `'ordered'` and no items have been received (`qty_received = 0` on all line items).

**Props**:
```typescript
interface CancelPODialogProps {
  po: { id: string; po_number: string; vendor: string }
  partiallyReceived: boolean   // true if any qty_received > 0
  receivedCount?: number       // total qty received if partiallyReceived
  pendingCount?: number        // total qty not yet received if partiallyReceived
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}
```

**Dialog content** (no items received):
```
Title:  Cancel Purchase Order?
Body:   Cancel [po.po_number] from [po.vendor]?
        No inventory has been received, so stock levels will not be affected.
```

**Buttons**:
- Cancel: `<AlertDialogCancel autoFocus>Keep PO</AlertDialogCancel>`
- Confirm: `<AlertDialogAction className={cn(buttonVariants({ variant: 'destructive' }))} onClick={onConfirm}>Cancel PO</AlertDialogAction>`

**Example body text**: Cancel PO-2026-004 from UniFi? No inventory has been received, so stock levels will not be affected.

**Toast on confirm**: "Purchase order cancelled" (success, 3s) / "Failed to cancel PO" (error, 5s)

---

## D-05: Cancel Purchase Order (Partial Receipt)

**Component**: `src/components/dialogs/CancelPODialog.tsx` (same component, conditional body)

**Trigger**: "Cancel" action button on a PO row where `purchase_orders.status = 'partial'` (some items received, some pending).

**Dialog content** (partial):
```
Title:  Cancel Remaining Items?
Body:   [po.po_number] has already received [receivedCount] items, which will remain in inventory.
        The remaining [pendingCount] undelivered items will be marked as cancelled.
```

**Buttons**:
- Cancel: `<AlertDialogCancel autoFocus>Keep PO</AlertDialogCancel>`
- Confirm: `<AlertDialogAction className={cn(buttonVariants({ variant: 'destructive' }))} onClick={onConfirm}>Cancel Remaining</AlertDialogAction>`

**Example body text**: PO-2026-004 has already received 3 items, which will remain in inventory. The remaining 5 undelivered items will be marked as cancelled.

**Toast on confirm**: "Remaining PO items cancelled" (success, 3s) / "Failed to cancel PO" (error, 5s)

---

## D-06: Mark PO as Ordered

**Component**: `src/components/dialogs/MarkOrderedDialog.tsx`

**Trigger**: "Mark Ordered" button on a PO row where `status = 'pending'`.

**Note**: This is a forward-progress confirmation (not destructive). It confirms that the ops person has actually placed the order with the vendor.

**Props**:
```typescript
interface MarkOrderedDialogProps {
  po: { id: string; po_number: string; vendor: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}
```

**Dialog content**:
```
Title:  Confirm Order Placed
Body:   Has [po.po_number] been placed with [po.vendor]?
        Once marked as ordered, the PO status will update to "Ordered" and
        the order will appear in the on-order count for inventory checks.
```

**Buttons**:
- Cancel: `<AlertDialogCancel>Not Yet</AlertDialogCancel>`
- Confirm: `<AlertDialogAction autoFocus onClick={onConfirm}>Yes, Mark as Ordered</AlertDialogAction>` (default variant)

**Example body text**: Has PO-2026-004 been placed with UniFi? Once marked as ordered, the PO status will update to "Ordered" and the order will appear in the on-order count for inventory checks.

**Toast on confirm**: "PO marked as ordered" (success, 3s) / "Failed to update PO status" (error, 5s)

---

## D-07: Mark All Items Shipped

**Component**: `src/components/dialogs/MarkAllShippedDialog.tsx`

**Trigger**: "Mark All Shipped" button on the Packing tab when packing is confirmed.

**Props**:
```typescript
interface MarkAllShippedDialogProps {
  itemCount: number        // count of BOM items not yet shipped
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}
```

**Dialog content**:
```
Title:  Mark All Items as Shipped?
Body:   This will mark all [itemCount] BOM items as shipped and deduct them from
        inventory stock. Only do this once the kit has been handed to the
        shipping carrier.
```

**Buttons**:
- Cancel: `<AlertDialogCancel>Cancel</AlertDialogCancel>`
- Confirm: `<AlertDialogAction autoFocus onClick={onConfirm}>Mark Shipped</AlertDialogAction>` (default variant)

**Example body text**: This will mark all 28 BOM items as shipped and deduct them from inventory stock. Only do this once the kit has been handed to the shipping carrier.

**Toast on confirm**: "All 28 items marked as shipped" (success, 3s) / "Failed to mark items as shipped" (error, 5s)

---

## D-08: Un-ship Item

**Component**: `src/components/dialogs/UnshipItemDialog.tsx`

**Trigger**: "Un-ship" button on a shipped BOM item row in the Packing tab.

**Props**:
```typescript
interface UnshipItemDialogProps {
  item: { id: string; name: string; qty: number }
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}
```

**Dialog content**:
```
Title:  Un-ship Item?
Body:   Un-shipping "[item.name]" will add [item.qty] unit(s) back to inventory stock.
        Use this to correct a packing mistake before the shipment leaves.
```

**Buttons**:
- Cancel: `<AlertDialogCancel autoFocus>Cancel</AlertDialogCancel>`
- Confirm: `<AlertDialogAction className={cn(buttonVariants({ variant: 'outline' }))} onClick={onConfirm}>Un-ship</AlertDialogAction>`

**Example body text**: Un-shipping "Mac Mini 16GB 256GB" will add 1 unit(s) back to inventory stock. Use this to correct a packing mistake before the shipment leaves.

**Note**: Uses `outline` variant (not destructive) since the action restores stock — it's corrective, not destructive.

**Toast on confirm**: "Item un-shipped, stock restored" (success, 3s) / "Failed to un-ship item" (error, 5s)

---

## D-09: Advance to Deployment

**Component**: `src/components/dialogs/AdvanceToDeploymentDialog.tsx`

**Trigger**: "Mark Ready for Deployment" button on Procurement wizard exit guard (all 5 exit conditions met).

**Props**:
```typescript
interface AdvanceToDeploymentDialogProps {
  venueName: string
  tier: string             // display label, e.g., "Pro"
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}
```

**Dialog content**:
```
Title:  Advance to Deployment?
Body:   This will seed the deployment checklist for [venueName] ([tier] tier)
        from the template and move the project to Stage 3: Deployment.
        The procurement stage will become read-only.
```

**Buttons**:
- Cancel: `<AlertDialogCancel>Cancel</AlertDialogCancel>`
- Confirm: `<AlertDialogAction autoFocus onClick={onConfirm}>Advance to Deployment</AlertDialogAction>` (default variant)

**Example body text**: This will seed the deployment checklist for Telepark Jersey City (Pro tier) from the template and move the project to Stage 3: Deployment. The procurement stage will become read-only.

**Toast on confirm**: None — redirect to `/projects/$projectId/deployment` with checklist seeded. On error: "Failed to advance to deployment" (error toast, 5s).

---

## D-10: Cancel Project

**Component**: `src/components/dialogs/CancelProjectDialog.tsx`

**Trigger**: "Cancel Project" button shown in intake view mode when `project.project_status = 'intake'` or `'procurement'`.

**Location**: `src/components/wizard/intake/IntakeViewMode.tsx` — bottom action row.

**Props**:
```typescript
interface CancelProjectDialogProps {
  venueName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}
```

**Dialog content**:
```
Title:  Cancel this project?
Body:   This will mark [venueName] as cancelled. No data will be deleted —
        you can view it in the project list by filtering for "Cancelled" status.
```

**Buttons**:
- Cancel: `<AlertDialogCancel autoFocus>Keep Project</AlertDialogCancel>`
- Confirm: `<AlertDialogAction className={cn(buttonVariants({ variant: 'destructive' }))} onClick={onConfirm}>Yes, Cancel Project</AlertDialogAction>`

**Example body text**: This will mark Telepark Jersey City as cancelled. No data will be deleted — you can view it in the project list by filtering for "Cancelled" status.

**On confirm**: Calls `advanceProjectStatus(project.id, 'cancelled')` → navigate to `/projects`.

**Toast on confirm**: None — navigate to `/projects` (dashboard shows the updated list). On error: "Failed to cancel project" (error, 5s).

---

## D-11: Delete Project (Hard Delete)

**Component**: `src/components/dialogs/DeleteProjectDialog.tsx`

**Trigger**: Row action kebab "Delete" on dashboard project table. Only visible when `project_status = 'intake'` or `project_status = 'cancelled'` AND no invoices are paid (`deposit_paid = false` AND `final_paid = false`).

**Guard**: If neither condition met, the "Delete" menu item is hidden. Only projects with no financial history can be deleted.

**Props**:
```typescript
interface DeleteProjectDialogProps {
  project: { id: string; venue_name: string; customer_name: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}
```

**Dialog content**:
```
Title:  Delete Project?
Body:   Permanently delete "[project.venue_name]" ([project.customer_name])?
        All BOM items, the deployment checklist, invoices, and expenses
        associated with this project will be deleted.
        This cannot be undone.
```

**Buttons**:
- Cancel: `<AlertDialogCancel autoFocus>Cancel</AlertDialogCancel>`
- Confirm: `<AlertDialogAction className={cn(buttonVariants({ variant: 'destructive' }))} onClick={onConfirm}>Delete Project</AlertDialogAction>`

**Example body text**: Permanently delete "Telepark Jersey City" (Acme Sports)? All BOM items, the deployment checklist, invoices, and expenses associated with this project will be deleted. This cannot be undone.

**On confirm**: Calls `deleteProject(project.id)` → hard DELETE in Supabase (CASCADE deletes all child rows). Navigate to `/projects`.

**Toast on confirm**: None — navigate away. On error: "Failed to delete project" (error, 5s).

---

## D-12: Delete Expense

**Component**: `src/components/dialogs/DeleteExpenseDialog.tsx`

**Trigger**: Trash icon button on an expense table row in the Financials wizard Expenses tab.

**Props**:
```typescript
interface DeleteExpenseDialogProps {
  expense: {
    id: string
    amount: number
    category: ExpenseCategory      // enum value, e.g., 'airfare'
    categoryLabel: string          // display label, e.g., 'Airfare'
    expense_date: string           // ISO date string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}
```

**Dialog content**:
```
Title:  Delete Expense?
Body:   This will permanently delete the $[formatCurrency(expense.amount)] [expense.categoryLabel]
        expense from [formatDate(expense.expense_date)].
        This cannot be undone.
```

**Buttons**:
- Cancel: `<AlertDialogCancel autoFocus>Cancel</AlertDialogCancel>`
- Confirm: `<AlertDialogAction className={cn(buttonVariants({ variant: 'destructive' }))} onClick={onConfirm}>Delete</AlertDialogAction>`

**Example body text**: This will permanently delete the $1,800.00 Airfare expense from Mar 5, 2026. This cannot be undone.

**Currency formatting**: Use `formatCurrencyPrecise(expense.amount)` — always 2 decimal places (e.g., $1,800.00).

**Date formatting**: Use `formatDate(expense.expense_date)` — format "Mar 5, 2026".

**Toast on confirm**: "Expense deleted" (success, 3s) / "Failed to delete expense" (error, 5s)

---

## D-13: Mark Final Paid — Close Project

**Component**: `src/components/dialogs/MarkFinalPaidDialog.tsx`

**Trigger**: "Mark Final Paid — Close Project" button in the Final Invoice card (State D: `status = 'sent'`) after the user has filled in the `date_paid` field.

**Note**: This is a significant milestone, not strictly destructive, but irreversible — it locks the project. Uses default button variant (positive action).

**Props**:
```typescript
interface MarkFinalPaidDialogProps {
  project: { id: string; venue_name: string }
  finalAmount: number      // invoice total_amount for the final invoice
  datePaid: string         // date string selected by user
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}
```

**Dialog content**:
```
Title:  Close this project?
Body:   Recording final payment of $[formatCurrency(finalAmount)] for [project.venue_name]
        will mark the project as Completed and lock all financial data.
        You can unlock it for editing from the financials page if needed.
```

**Buttons**:
- Cancel: `<AlertDialogCancel>Cancel</AlertDialogCancel>`
- Confirm: `<AlertDialogAction autoFocus onClick={onConfirm}>Mark Paid & Close</AlertDialogAction>` (default variant)

**Example body text**: Recording final payment of $21,131.06 for Telepark Jersey City will mark the project as Completed and lock all financial data. You can unlock it for editing from the financials page if needed.

**Toast on confirm**: "Project completed! Final payment recorded." (success, 3s) / "Failed to record final payment" (error, 5s)

---

## D-14: Unlock Deployment for Editing

**Component**: `src/components/dialogs/UnlockDeploymentDialog.tsx`

**Trigger**: "Unlock to Edit" button on the read-only banner in the Deployment wizard when `project_status = 'financial_close'` or `'completed'`.

**Props**:
```typescript
interface UnlockDeploymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}
```

**Dialog content**:
```
Title:  Unlock Deployment for Editing?
Body:   Re-opening the deployment checklist for editing will allow step
        changes and notes updates. The project's current stage will not change.
        Use this only to correct configuration records after go-live.
```

**Buttons**:
- Cancel: `<AlertDialogCancel autoFocus>Cancel</AlertDialogCancel>`
- Confirm: `<AlertDialogAction onClick={onConfirm}>Unlock</AlertDialogAction>` (default variant)

**On confirm**: Sets `project.deployment_status` back to `'qc'` (or whichever the last active sub-status was) to allow checklist editing. Does NOT change `project_status`.

**Toast on confirm**: "Deployment unlocked for editing" (success, 3s) / "Failed to unlock deployment" (error, 5s)

---

## D-15: Unlock Completed Project for Editing

**Component**: `src/components/dialogs/UnlockCompletedProjectDialog.tsx`

**Trigger**: "Unlock for editing" override button shown in the Financials wizard when `project_status = 'completed'`. The button appears in the read-only banner: "This project is completed. All financial data is locked. [Unlock for editing]"

**Props**:
```typescript
interface UnlockCompletedProjectDialogProps {
  venueName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}
```

**Dialog content**:
```
Title:  Unlock completed project?
Body:   [venueName] is marked as Completed. Unlocking will allow editing
        of invoices and expenses. The project status will remain "Completed"
        until you re-lock it by clicking "Re-lock Project" in the financials page.
```

**Buttons**:
- Cancel: `<AlertDialogCancel autoFocus>Cancel</AlertDialogCancel>`
- Confirm: `<AlertDialogAction onClick={onConfirm}>Unlock for Editing</AlertDialogAction>` (default variant)

**On confirm**: Sets a local `isUnlocked` state flag (`useState<boolean>`) — does NOT change `project_status` in the database. The financials wizard re-renders in edit mode. A "Re-lock Project" button appears in the page header. Clicking "Re-lock" clears the `isUnlocked` flag (returns to read-only), no DB write needed.

**Toast on confirm**: None — the page visually transitions to edit mode. "Save" actions within the unlocked state show normal success/error toasts.

---

## D-16: Deactivate Catalog Item

**Component**: `src/components/dialogs/DeactivateCatalogItemDialog.tsx`

**Trigger**: Kebab menu "Deactivate" on a hardware catalog table row in Settings → Catalog.

**Props**:
```typescript
interface DeactivateCatalogItemDialogProps {
  item: { id: string; name: string; sku: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}
```

**Dialog content**:
```
Title:  Deactivate item?
Body:   "[item.name]" ([item.sku]) will no longer appear in BOM item selections
        or the "Add Custom Item" picker. It will remain in all existing project
        BOMs and can be reactivated at any time.
```

**Buttons**:
- Cancel: `<AlertDialogCancel autoFocus>Cancel</AlertDialogCancel>`
- Confirm: `<AlertDialogAction className={cn(buttonVariants({ variant: 'destructive' }))} onClick={onConfirm}>Deactivate</AlertDialogAction>`

**Example body text**: "UniFi Dream Machine SE" (NET-UDM-SE) will no longer appear in BOM item selections or the "Add Custom Item" picker. It will remain in all existing project BOMs and can be reactivated at any time.

**Toast on confirm**: "Item deactivated" (success, 3s) / "Failed to deactivate item" (error, 5s)

---

## D-17: Deactivate Team Contact

**Component**: `src/components/dialogs/DeactivateContactDialog.tsx`

**Trigger**: Kebab menu "Deactivate" on a team contacts table row in Settings → Team.

**Props**:
```typescript
interface DeactivateContactDialogProps {
  contact: { id: string; name: string; role: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}
```

**Dialog content**:
```
Title:  Deactivate contact?
Body:   [contact.name] ([contact.role]) will be hidden from the active contacts list.
        They can be reactivated at any time by checking "Show inactive" in the
        Team settings.
```

**Buttons**:
- Cancel: `<AlertDialogCancel autoFocus>Cancel</AlertDialogCancel>`
- Confirm: `<AlertDialogAction className={cn(buttonVariants({ variant: 'outline' }))} onClick={onConfirm}>Deactivate</AlertDialogAction>`

**Example body text**: Nico (Hardware & Installations) will be hidden from the active contacts list. They can be reactivated at any time by checking "Show inactive" in the Team settings.

**Note**: Uses `outline` variant (not `destructive`) because deactivation is reversible.

**Toast on confirm**: "Contact deactivated" (success, 3s) / "Failed to deactivate contact" (error, 5s)

---

## Common AlertDialog Component Pattern

All dialogs follow this structural pattern:

```tsx
// src/components/dialogs/ExampleDialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface ExampleDialogProps {
  // entity fields
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function ExampleDialog({ open, onOpenChange, onConfirm }: ExampleDialogProps) {
  const [isPending, setIsPending] = useState(false)

  async function handleConfirm() {
    setIsPending(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch {
      // toast error is handled by caller
    } finally {
      setIsPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Dialog Title?</AlertDialogTitle>
          <AlertDialogDescription>
            Body text here. Cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel autoFocus disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: 'destructive' }))}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### Pending State Button Labels

| Dialog | Idle Label | Pending Label |
|--------|-----------|---------------|
| D-01/D-02 Remove BOM Item | "Remove Item" / "Remove and Release" | "Removing..." |
| D-03 Regenerate BOM | "Regenerate BOM" | "Regenerating..." |
| D-04 Cancel PO | "Cancel PO" | "Cancelling..." |
| D-05 Cancel PO (partial) | "Cancel Remaining" | "Cancelling..." |
| D-06 Mark Ordered | "Yes, Mark as Ordered" | "Updating..." |
| D-07 Mark All Shipped | "Mark Shipped" | "Shipping..." |
| D-08 Un-ship | "Un-ship" | "Updating..." |
| D-09 Advance to Deployment | "Advance to Deployment" | "Advancing..." |
| D-10 Cancel Project | "Yes, Cancel Project" | "Cancelling..." |
| D-11 Delete Project | "Delete Project" | "Deleting..." |
| D-12 Delete Expense | "Delete" | "Deleting..." |
| D-13 Mark Final Paid | "Mark Paid & Close" | "Saving..." |
| D-14 Unlock Deployment | "Unlock" | "Unlocking..." |
| D-15 Unlock Completed | "Unlock for Editing" | "Unlocking..." |
| D-16 Deactivate Catalog Item | "Deactivate" | "Deactivating..." |
| D-17 Deactivate Contact | "Deactivate" | "Deactivating..." |

---

## Keyboard Behavior (All Dialogs)

Per `keyboard-nav.md` §Dialogs:

- **Escape key**: Always closes the dialog (Radix handles this natively). No state changes on close without confirm.
- **Tab key**: Cycles between Cancel and Confirm buttons only (focus trap within dialog).
- **Enter key on Confirm button**: Triggers `onConfirm`.
- **Enter key on Cancel button**: Closes dialog without action.
- **autoFocus placement**: Set on Cancel button for D-01 through D-05, D-08, D-10, D-11, D-12, D-14, D-15, D-16, D-17 (all destructive dialogs). Set on Confirm button for D-06, D-07, D-09, D-13 (forward-progress confirmations).

---

## Summary: Actions NOT Requiring Dialogs

These actions complete immediately or use alternative UX patterns:

| Action | Pattern |
|--------|---------|
| Reactivate catalog item | Immediate call, no dialog. Toast: "Item reactivated" |
| Reactivate team contact | Immediate call, no dialog. Toast: "Contact reactivated" |
| Mark contract signed | Standard form submit, no confirm needed |
| Send deposit / final invoice | Standard form submit, no confirm needed |
| Mark deposit / final paid (non-close) | Standard form submit, no confirm needed |
| Add BOM item | Standard form submit |
| Add / edit expense | Standard form submit |
| Log installer labor | Immediate call. Toast: "Installer labor logged: $X" |
| Stock adjustment (any type) | Standard form dialog — the dialog IS the form (AdjustStockDialog), no extra confirm layer |
| Create PO | Standard form submit |
| Update reorder threshold | Inline edit with Enter/blur save, no confirm |
| Save pricing/team/travel settings | "Save Changes" button — direct submit, no confirm |
| Toggle deployment checklist step | Optimistic toggle, no confirm (undo via re-toggle) |
| Unlock deployment via "Unlock to Edit" banner | D-14 — DOES require dialog (because it modifies read-only historical data) |
