# PodPlay Ops Wizard — Toast Messages

**Aspect**: qa-toast-messages
**Wave**: 7 — QA-Readiness
**Date**: 2026-03-07
**Source**: Derived from wizard-intake.md, wizard-procurement.md, wizard-deployment.md, wizard-financials.md, inventory-view.md, settings-view.md, dashboard.md

---

## Overview

This file specifies the **exact text** of every toast notification shown in response to a mutating
operation in the PodPlay Ops Wizard.

### Global Conventions

| Attribute | Value |
|-----------|-------|
| Library | `sonner` (via shadcn `<Toaster>` in `src/components/ui/sonner.tsx`) |
| Position | `bottom-right` — `position="bottom-right"` on `<Toaster>` |
| Success duration | 3 000 ms |
| Error duration | 5 000 ms |
| Warning duration | 4 000 ms |
| Success style | Green background, white text, checkmark icon |
| Error style | Red background, white text, X icon |
| Warning style | Amber background, dark text, triangle-alert icon |

### Function signatures used

```typescript
import { toast } from 'sonner'

// Success — 3s
toast.success('Message text')

// Error — 5s
toast.error('Message text')

// Warning — 4s
toast.warning('Message text')

// With dynamic content (template literal)
toast.success(`PO ${po_number} created`)
toast.error(`Failed to save: ${error.message}`)
```

### Dynamic placeholders

In the tables below, `{variable}` denotes a runtime value interpolated via template literal.

---

## 1. Auth

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 1.1 | Sign out | `Signed out` | `Failed to sign out` |

> Sign-in has no toast — successful login redirects to `/projects`. Auth errors are shown inline in the login form, not as toasts.

---

## 2. Dashboard / Project Creation

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 2.1 | Create new project (click "New Project" on dashboard) | *(no toast — immediate redirect to `/projects/{id}/intake`)* | `Failed to create project` |
| 2.2 | Cancel project (set `project_status = 'cancelled'`) | `Project cancelled` | `Failed to cancel project` |

---

## 3. Stage 1 — Intake Wizard

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 3.1 | Submit Step 6 (save intake + advance to procurement) | `Project intake complete. BOM generated.` | `Failed to save intake` |
| 3.2 | Re-save edited intake data (edit mode) | `Intake updated` | `Failed to update intake` |
| 3.3 | Advance to Procurement (intake review screen button) | *(no toast — redirect to procurement route)* | `Failed to advance to procurement` |

> Note: BOM generation is triggered server-side as a side effect of the Step 6 submit. The success toast for 3.1 confirms both actions.

---

## 4. Stage 2 — Procurement Wizard

### 4.1 BOM Review Tab

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 4.1.1 | Inline edit: update BOM item qty, unit_cost, notes (blur / Enter) | *(no toast — optimistic update; silent on success)* | `Failed to save change` |
| 4.1.2 | Add custom BOM item (sheet form submit) | `Item added to BOM` | `Failed to add item` |
| 4.1.3 | Add custom BOM item — duplicate SKU | *(inline field error, not a toast: "Item already in BOM — edit the existing row instead")* | — |
| 4.1.4 | Remove BOM item (confirmation confirm) | `Item removed from BOM` | `Failed to remove item` |
| 4.1.5 | Reset BOM item to catalog cost | `Reset to catalog cost` | `Failed to reset cost` |
| 4.1.6 | Regenerate BOM (confirmation confirm) | `BOM regenerated` | `Failed to regenerate BOM` |

> For 4.1.1, the optimistic update pattern shows no toast on success. On error, the row reverts to its previous value and an error toast appears. This matches the pattern from loading-states.md §Deployment Checklist Optimistic Toggle.

### 4.2 Inventory Tab

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 4.2.1 | Allocate all in-stock items | `{n} items allocated to this project` | `Failed to allocate items` |

> `{n}` is the count of items that were successfully allocated in this operation.

### 4.3 Purchase Orders Tab

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 4.3.1 | Create PO (sheet form submit) | `PO {po_number} created` | `Failed to create PO` |
| 4.3.2 | Mark PO as ordered | `PO marked as ordered` | `Failed to update PO` |
| 4.3.3 | Receive PO items (modal confirm) | `Received {n} items — inventory updated` | `Failed to record receipt` |
| 4.3.4 | Cancel PO (dialog confirm) | `PO {po_number} cancelled` | `Failed to cancel PO` |

> For 4.3.3, `{n}` is the total unit count received across all line items in that submission.

### 4.4 Packing Tab

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 4.4.1 | Check single item as shipped | *(no toast — optimistic checkbox update; silent on success)* | `Failed to mark item as shipped` |
| 4.4.2 | Uncheck single item (un-ship) | *(no toast — optimistic; silent on success)* | `Failed to revert shipment` |
| 4.4.3 | Mark all items as shipped (confirmation confirm) | `All {n} items marked as shipped` | `Failed to mark items as shipped` |

> For 4.4.1 and 4.4.2, silent success matches the checklist toggle pattern. An error reverts the checkbox and shows a toast.

### 4.5 CC Terminal Tab

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 4.5.1 | Save CC terminal changes (qty, cost, dates, stripe order ID, notes) | `CC terminal saved` | `Failed to save CC terminal` |
| 4.5.2 | Mark CC terminal as ordered | `CC terminal marked as ordered` | `Failed to update terminal status` |
| 4.5.3 | Mark CC terminal as delivered | `CC terminal marked as delivered` | `Failed to update terminal status` |
| 4.5.4 | Mark CC terminal as installed | `CC terminal marked as installed` | `Failed to update terminal status` |

### 4.6 Replay Signs Tab

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 4.6.1 | Save replay signs changes (qty, outreach channel, dates, tracking, notes) | `Replay signs saved` | `Failed to save replay signs` |
| 4.6.2 | Mark signs as shipped | `Replay signs marked as shipped` | `Failed to update signs status` |
| 4.6.3 | Mark signs as delivered | `Replay signs marked as delivered` | `Failed to update signs status` |
| 4.6.4 | Mark signs as installed (triggers inventory decrement) | `Replay signs installed — inventory updated` | `Failed to mark signs as installed` |

### 4.7 Stage Advancement

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 4.7.1 | Advance to Deployment (Mark Ready for Deployment — confirmation confirm) | *(no toast — redirect to deployment route with checklist seeded)* | `Failed to advance to deployment` |

---

## 5. Stage 3 — Deployment Wizard

### 5.1 Checklist Interactions

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 5.1.1 | Toggle checklist step (check or uncheck) | *(no toast — optimistic update; silent on success)* | `Failed to save step — change reverted` |
| 5.1.2 | Auto-save step note (blur, 300 ms debounce) | *(no toast — inline "Saved" indicator replaces "Saving..." text; see loading-states.md)* | *(inline "Save failed" text in red; no toast)* |

### 5.2 Token Field Updates

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 5.2.1 | Set project token field via inline popover (DDNS subdomain, UniFi site name, Mac Mini username, Location ID) | `{fieldLabel} saved` | `Failed to save {fieldLabel}` |

**`{fieldLabel}` values**:
- `{{DDNS_SUBDOMAIN}}` → `DDNS subdomain saved`
- `{{UNIFI_SITE_NAME}}` → `UniFi site name saved`
- `{{MAC_MINI_USERNAME}}` → `Mac Mini username saved`
- `{{LOCATION_ID}}` → `Location ID saved`

### 5.3 Phase-Specific Auto-Saves

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 5.3.1 | ISP config method change (radio — Phase 5 panel, auto-saves) | *(no toast — silent save)* | `Failed to save ISP config method` |
| 5.3.2 | Replay service version change (radio — Phase 9 panel, auto-saves) | *(no toast — silent save)* | `Failed to save replay service version` |

### 5.4 Status Advancement Modals

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 5.4.1 | Mark Ready to Ship (Modal 1 confirm) | `Marked as Ready to Ship` | `Failed to update deployment status` |
| 5.4.2 | Mark as Shipped (Modal 2 confirm) | `Marked as Shipped — tracking: {tracking_number}` | `Failed to mark as shipped` |
| 5.4.3 | Mark as Installing (Modal 3 confirm) | `Installation started — Phase 12 unlocked` | `Failed to update deployment status` |
| 5.4.4 | Start QA (Modal 4 confirm) | `QA phase started` | `Failed to update deployment status` |
| 5.4.5 | Mark Deployment Complete (Modal 5 confirm) | `Deployment complete! Stage 4 (Financials) is now unlocked.` | `Failed to complete deployment` |

> Toast 5.4.5 is followed by an automatic redirect to `/projects/{id}/financials`.

---

## 6. Stage 4 — Financials Wizard

### 6.1 Contract & Invoicing Tab

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 6.1.1 | Mark contract signed | `Contract marked as signed` | `Failed to mark contract as signed` |
| 6.1.2 | Send deposit invoice | `Deposit invoice marked as sent` | `Failed to send deposit invoice` |
| 6.1.3 | Mark deposit paid | `Deposit payment recorded` | `Failed to record deposit payment` |
| 6.1.4 | Send final invoice | `Final invoice marked as sent` | `Failed to send final invoice` |
| 6.1.5 | Mark final paid (closes project) | `Project completed! Final payment recorded.` | `Failed to record final payment` |

### 6.2 Expenses Tab

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 6.2.1 | Add expense (dialog submit) | `Expense added` | `Failed to add expense` |
| 6.2.2 | Edit expense (dialog submit) | `Expense updated` | `Failed to update expense` |
| 6.2.3 | Delete expense (alert dialog confirm) | `Expense deleted` | `Failed to delete expense` |
| 6.2.4 | Log installer labor (quick action button) | `Installer labor logged: ${formatCurrency(amount)}` | `Failed to log installer labor` |

> For 6.2.4, `{amount}` is computed as `installer_hours × labor_rate_per_hour`. The success text uses precise currency formatting: e.g., `Installer labor logged: $1,200.00`.

### 6.3 Go-Live & Handoff Tab

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 6.3.1 | Save go-live date | `Go-live date saved` | `Failed to save go-live date` |
| 6.3.2 | Save handoff notes | `Notes saved` | `Failed to save notes` |
| 6.3.3 | Mark project complete (alert dialog confirm — final project closure) | `Project marked as completed!` | `Failed to close project` |

> Note: Toast 6.1.5 (`Project completed! Final payment recorded.`) fires when marking the final invoice paid (which simultaneously closes the project). Toast 6.3.3 fires when the project is already in `final_paid` state and the "Mark Project Complete" button closes it without a simultaneous payment action.

---

## 7. Global Inventory Page

### 7.1 Stock Adjustment Dialog

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 7.1.1 | Adjust stock — increase | `Stock adjusted successfully` | `Failed to adjust stock: {error.message}` |
| 7.1.2 | Adjust stock — decrease | `Stock adjusted successfully` | `Failed to adjust stock: {error.message}` |
| 7.1.3 | Adjust stock — return from project | `Stock adjusted successfully` | `Failed to adjust stock: {error.message}` |

> All three adjustment types use the same toast text. The movement type is recorded in the audit trail, not in the toast.

### 7.2 Reorder Threshold Inline Edit

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 7.2.1 | Save reorder threshold (Enter or checkmark) | *(no toast — silent inline save; the cell updates immediately)* | `Failed to save threshold` |

### 7.3 New PO Dialog (Global)

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 7.3.1 | Create global PO (inventory replenishment) | `PO {po_number} created` | `Failed to create PO: {error.message}` |

### 7.4 PO Status Transitions (from Inventory PO list, if applicable)

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 7.4.1 | Mark global PO as ordered | `PO marked as ordered` | `Failed to update PO` |
| 7.4.2 | Receive global PO items | `Received {n} items — inventory updated` | `Failed to record receipt` |
| 7.4.3 | Cancel global PO | `PO {po_number} cancelled` | `Failed to cancel PO` |

### 7.5 Reconciliation

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 7.5.1 | Run reconciliation — completes without errors | *(no toast — result shown inline in ReconciliationDialog success state)* | `Reconciliation failed: {error.message}` |

---

## 8. Settings Pages

### 8.1 Pricing Tab (`/settings/pricing`)

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 8.1.1 | Save pricing settings (full form submit) | `Settings saved` | `Failed to save settings: {error.message}` |

### 8.2 Catalog Tab (`/settings/catalog`)

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 8.2.1 | Add hardware catalog item (sheet submit) | `Item added` | `Failed to add item` |
| 8.2.2 | Edit hardware catalog item (sheet submit) | `Item updated` | `Failed to update item` |
| 8.2.3 | Deactivate catalog item (alert dialog confirm) | `Item deactivated` | `Failed to deactivate item` |
| 8.2.4 | Reactivate catalog item (immediate, no dialog) | `Item reactivated` | `Failed to reactivate item` |

### 8.3 Team Tab (`/settings/team`)

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 8.3.1 | Save OpEx settings (rent + indirect salaries) | `OpEx settings saved` | `Failed to save OpEx settings` |
| 8.3.2 | Add team contact (sheet submit) | `Contact saved` | `Failed to save contact` |
| 8.3.3 | Edit team contact (sheet submit) | `Contact saved` | `Failed to save contact` |
| 8.3.4 | Deactivate team contact (alert dialog confirm) | `Contact deactivated` | `Failed to deactivate contact` |
| 8.3.5 | Reactivate team contact (immediate, no dialog) | `Contact reactivated` | `Failed to reactivate contact` |

### 8.4 Travel Tab (`/settings/travel`)

| # | Operation | Success Toast | Error Toast |
|---|-----------|--------------|-------------|
| 8.4.1 | Save travel defaults (lodging, airfare, hours/day) | `Travel defaults saved` | `Failed to save travel defaults` |

---

## 9. Guard / Navigation Toasts

These toasts appear when a user attempts to access a route that is blocked by a status guard, and
the route module redirects them away.

| # | Trigger | Warning Toast |
|---|---------|---------------|
| 9.1 | Navigate to `/procurement` when `project_status === 'intake'` | *(redirect to intake; no toast — redirect is silent)* |
| 9.2 | Navigate to `/deployment` when `project_status` is `'intake'` or `'procurement'` | `Complete procurement before accessing deployment.` |
| 9.3 | Navigate to `/financials` when `project_status` is `'intake'`, `'procurement'`, or `'deployment'` | `Complete deployment before accessing financials.` |

> Guard toasts use `toast.warning(...)` (amber, 4 000 ms) because they explain why the redirect
> happened rather than indicating an error the user caused.

---

## 10. Implementation Pattern

All toast calls follow this pattern in mutation handlers:

```typescript
// Success pattern
async function handleMutation() {
  setIsPending(true)
  try {
    await serviceFunction(input)
    toast.success('Operation completed')
    router.invalidate()   // or onSuccess() callback
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    toast.error(`Failed to complete: ${message}`)
    // or for fixed-text errors:
    toast.error('Failed to complete operation')
  } finally {
    setIsPending(false)
  }
}
```

**When to include `{error.message}` in the error toast**:
- Include it when the error message is likely to be actionable (e.g., Supabase constraint violations, network errors with descriptive messages): inventory adjustments (7.1.x), PO creation (7.3.1), settings save (8.1.1).
- Use fixed text (no interpolation) for all wizard stage toasts (3.x–6.x) — these errors are unlikely to produce user-readable Supabase messages, and the fixed text is cleaner.

**Optimistic update error pattern** (checklist steps, BOM inline edits):

```typescript
// Step: optimistic toggle
async function handleToggle(itemId: string, checked: boolean) {
  // 1. Apply optimistic update immediately (no toast)
  setItems(prev => prev.map(i => i.id === itemId ? { ...i, is_completed: checked } : i))
  try {
    await toggleChecklistItem(itemId, checked)
    // silent — no toast
  } catch (err) {
    // 2. Revert optimistic update on failure
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, is_completed: !checked } : i))
    // 3. Show error toast
    toast.error('Failed to save step — change reverted')
  }
}
```

---

## 11. Complete Summary Table

Total toast operations: **65** (40 success/silent + 25 error variations)

| Section | Silent-on-success ops | Toast-on-success ops | Error-only ops |
|---------|----------------------|---------------------|----------------|
| Auth | 0 | 1 | 0 |
| Dashboard | 1 (create redirects) | 1 | 0 |
| Intake | 1 (advance redirects) | 2 | 0 |
| Procurement: BOM | 2 (inline edit, duplicate) | 3 | 1 |
| Procurement: Inventory | 0 | 1 | 0 |
| Procurement: PO | 0 | 4 | 0 |
| Procurement: Packing | 2 (row toggle) | 1 | 0 |
| Procurement: CC Terminal | 0 | 4 | 0 |
| Procurement: Signs | 0 | 4 | 0 |
| Procurement: Advance | 1 (redirect) | 0 | 1 |
| Deployment: Checklist | 1 (step toggle) + 1 (note inline) | 0 | 2 |
| Deployment: Token fields | 0 | 4 | 4 |
| Deployment: Phase panels | 2 (auto-save) | 0 | 2 |
| Deployment: Status advance | 0 | 5 | 5 |
| Financials: Invoicing | 0 | 5 | 5 |
| Financials: Expenses | 0 | 4 | 4 |
| Financials: Go-Live | 0 | 3 | 3 |
| Inventory: Adjust | 0 | 3 | 3 |
| Inventory: Threshold | 1 (silent) | 0 | 1 |
| Inventory: PO | 0 | 4 | 4 |
| Inventory: Reconciliation | 1 (inline result) | 0 | 1 |
| Settings: Pricing | 0 | 1 | 1 |
| Settings: Catalog | 0 | 4 | 4 |
| Settings: Team | 0 | 5 | 5 |
| Settings: Travel | 0 | 1 | 1 |
| Guards / navigation | — | 2 warnings | — |

---

## 12. Sonner `<Toaster>` Configuration

**File**: `src/components/ui/sonner.tsx` (shadcn generated)

```tsx
import { Toaster as Sonner } from 'sonner'

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        duration: 3000,          // default (success); overridden per-call for error (5000) and warning (4000)
        classNames: {
          toast: 'font-sans text-sm',
        },
      }}
    />
  )
}
```

**File**: `src/main.tsx` — `<Toaster />` mounted once at root level, outside of route tree:

```tsx
import { Toaster } from '@/components/ui/sonner'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Toaster />
  </React.StrictMode>
)
```

**Duration override pattern** — pass `duration` explicitly for non-default durations:

```typescript
toast.error('Failed to save settings: ' + error.message, { duration: 5000 })
toast.warning('Complete procurement before accessing deployment.', { duration: 4000 })
```

Since `toast.success` defaults to 3 000 ms (the configured default), no explicit `duration` is
needed for success toasts.
