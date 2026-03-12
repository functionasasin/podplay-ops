/**
 * Confirmation dialog configs for all 17 destructive / irreversible actions.
 * Each factory returns props suitable for <ConfirmDialog>.
 */

import type { ConfirmDialogProps } from '@/components/ui/ConfirmDialog';

type DialogConfig = Pick<
  ConfirmDialogProps,
  'title' | 'body' | 'confirmLabel' | 'cancelLabel' | 'destructive'
>;

// D-01: Remove BOM Item (not allocated)
export function removeBomItemDialog(itemName: string): DialogConfig {
  return {
    title: 'Remove Item?',
    body: `Remove "${itemName}" from the BOM? This cannot be undone.`,
    confirmLabel: 'Remove Item',
    cancelLabel: 'Cancel',
    destructive: true,
  };
}

// D-02: Remove BOM Item (allocated)
export function removeAllocatedBomItemDialog(itemName: string): DialogConfig {
  return {
    title: 'Remove Allocated Item?',
    body: `"${itemName}" is already reserved in inventory for this project. Removing it will release that inventory allocation. This cannot be undone.`,
    confirmLabel: 'Remove and Release',
    cancelLabel: 'Cancel',
    destructive: true,
  };
}

// D-03: Regenerate BOM
export function regenerateBomDialog(
  itemCount: number,
  customItemCount: number,
): DialogConfig {
  const autoCount = itemCount - customItemCount;
  const preserveNote =
    customItemCount > 0
      ? ` Your ${customItemCount} manually added item(s) will be preserved.`
      : '';
  return {
    title: 'Regenerate BOM?',
    body: `This will discard all quantity overrides, cost overrides, and the ${autoCount} auto-generated items — resetting them to the values calculated from your intake settings.${preserveNote} This cannot be undone.`,
    confirmLabel: 'Regenerate BOM',
    cancelLabel: 'Cancel',
    destructive: true,
  };
}

// D-04: Cancel PO (no items received)
export function cancelPoDialog(poNumber: string, vendor: string): DialogConfig {
  return {
    title: 'Cancel Purchase Order?',
    body: `Cancel ${poNumber} from ${vendor}? No inventory has been received, so stock levels will not be affected.`,
    confirmLabel: 'Cancel PO',
    cancelLabel: 'Keep PO',
    destructive: true,
  };
}

// D-05: Cancel PO (partial receipt)
export function cancelPartialPoDialog(
  poNumber: string,
  receivedCount: number,
  pendingCount: number,
): DialogConfig {
  return {
    title: 'Cancel Remaining Items?',
    body: `${poNumber} has already received ${receivedCount} items, which will remain in inventory. The remaining ${pendingCount} undelivered items will be marked as cancelled.`,
    confirmLabel: 'Cancel Remaining',
    cancelLabel: 'Keep PO',
    destructive: true,
  };
}

// D-06: Mark PO as Ordered
export function markOrderedDialog(poNumber: string, vendor: string): DialogConfig {
  return {
    title: 'Confirm Order Placed',
    body: `Has ${poNumber} been placed with ${vendor}? Once marked as ordered, the PO status will update to "Ordered" and the order will appear in the on-order count for inventory checks.`,
    confirmLabel: 'Yes, Mark as Ordered',
    cancelLabel: 'Not Yet',
    destructive: false,
  };
}

// D-07: Mark All Items Shipped
export function markAllShippedDialog(itemCount: number): DialogConfig {
  return {
    title: 'Mark All Items as Shipped?',
    body: `This will mark all ${itemCount} BOM items as shipped and deduct them from inventory stock. Only do this once the kit has been handed to the shipping carrier.`,
    confirmLabel: 'Mark Shipped',
    cancelLabel: 'Cancel',
    destructive: false,
  };
}

// D-08: Un-ship Item
export function unshipItemDialog(itemName: string, qty: number): DialogConfig {
  return {
    title: 'Un-ship Item?',
    body: `Un-shipping "${itemName}" will add ${qty} unit(s) back to inventory stock. Use this to correct a packing mistake before the shipment leaves.`,
    confirmLabel: 'Un-ship',
    cancelLabel: 'Cancel',
    destructive: false,
  };
}

// D-09: Advance to Deployment
export function advanceToDeploymentDialog(venueName: string, tier: string): DialogConfig {
  return {
    title: 'Advance to Deployment?',
    body: `This will seed the deployment checklist for ${venueName} (${tier} tier) from the template and move the project to Stage 3: Deployment. The procurement stage will become read-only.`,
    confirmLabel: 'Advance to Deployment',
    cancelLabel: 'Cancel',
    destructive: false,
  };
}

// D-09b: Advance to Financial Close
export function advanceToFinancialCloseDialog(venueName: string): DialogConfig {
  return {
    title: 'Advance to Financial Close?',
    body: `This will move ${venueName} to Stage 4: Financial Close. The deployment stage will become read-only. You can still view checklists but items can no longer be toggled.`,
    confirmLabel: 'Advance to Financial Close',
    cancelLabel: 'Cancel',
    destructive: false,
  };
}

// D-10: Cancel Project
export function cancelProjectDialog(venueName: string): DialogConfig {
  return {
    title: 'Cancel this project?',
    body: `This will mark ${venueName} as cancelled. No data will be deleted — you can view it in the project list by filtering for "Cancelled" status.`,
    confirmLabel: 'Yes, Cancel Project',
    cancelLabel: 'Keep Project',
    destructive: true,
  };
}

// D-11: Delete Project (Hard Delete)
export function deleteProjectDialog(projectName: string): DialogConfig {
  return {
    title: 'Delete Project',
    body: `Are you sure you want to delete ${projectName}? This action cannot be undone. All project data including intake, procurement, deployment, and financial records will be permanently deleted.`,
    confirmLabel: 'Delete Project',
    cancelLabel: 'Cancel',
    destructive: true,
  };
}

// D-12: Delete Expense
export function deleteExpenseDialog(
  amount: string,
  categoryLabel: string,
  date: string,
): DialogConfig {
  return {
    title: 'Delete Expense?',
    body: `This will permanently delete the ${amount} ${categoryLabel} expense from ${date}. This cannot be undone.`,
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    destructive: true,
  };
}

// D-13: Mark Final Paid — Close Project
export function markFinalPaidDialog(venueName: string, finalAmount: string): DialogConfig {
  return {
    title: 'Close this project?',
    body: `Recording final payment of ${finalAmount} for ${venueName} will mark the project as Completed and lock all financial data. You can unlock it for editing from the financials page if needed.`,
    confirmLabel: 'Mark Paid & Close',
    cancelLabel: 'Cancel',
    destructive: false,
  };
}

// D-14: Unlock Deployment for Editing
export function unlockDeploymentDialog(): DialogConfig {
  return {
    title: 'Unlock Deployment for Editing?',
    body: 'Re-opening the deployment checklist for editing will allow step changes and notes updates. The project\'s current stage will not change. Use this only to correct configuration records after go-live.',
    confirmLabel: 'Unlock',
    cancelLabel: 'Cancel',
    destructive: false,
  };
}

// D-15: Unlock Completed Project for Editing
export function unlockCompletedProjectDialog(venueName: string): DialogConfig {
  return {
    title: 'Unlock completed project?',
    body: `${venueName} is marked as Completed. Unlocking will allow editing of invoices and expenses. The project status will remain "Completed" until you re-lock it by clicking "Re-lock Project" in the financials page.`,
    confirmLabel: 'Unlock for Editing',
    cancelLabel: 'Cancel',
    destructive: false,
  };
}

// D-16: Deactivate Catalog Item
export function deactivateCatalogItemDialog(itemName: string, sku: string): DialogConfig {
  return {
    title: 'Deactivate item?',
    body: `"${itemName}" (${sku}) will no longer appear in BOM item selections or the "Add Custom Item" picker. It will remain in all existing project BOMs and can be reactivated at any time.`,
    confirmLabel: 'Deactivate',
    cancelLabel: 'Cancel',
    destructive: true,
  };
}

// D-17: Deactivate Team Contact
export function deactivateContactDialog(contactName: string, role: string): DialogConfig {
  return {
    title: 'Deactivate contact?',
    body: `${contactName} (${role}) will be hidden from the active contacts list. They can be reactivated at any time by checking "Show inactive" in the Team settings.`,
    confirmLabel: 'Deactivate',
    cancelLabel: 'Cancel',
    destructive: false,
  };
}
