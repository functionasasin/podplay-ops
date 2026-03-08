// Stage 150 — Tests: Confirmation Dialogs
// For each of the 17 configs: render ConfirmDialog with the config and assert
// title, body text, confirm button text, and destructive flag match the spec.
// Assert destructive dialogs render confirm button with destructive variant styling.
// Assert onConfirm fires on confirm click and onCancel fires on cancel click.

import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  advanceToDeploymentDialog,
  cancelPartialPoDialog,
  cancelPoDialog,
  cancelProjectDialog,
  deactivateCatalogItemDialog,
  deactivateContactDialog,
  deleteExpenseDialog,
  deleteProjectDialog,
  markAllShippedDialog,
  markFinalPaidDialog,
  markOrderedDialog,
  regenerateBomDialog,
  removeAllocatedBomItemDialog,
  removeBomItemDialog,
  unlockCompletedProjectDialog,
  unlockDeploymentDialog,
  unshipItemDialog,
} from '@/lib/confirmation-dialogs';

// Inline mock — avoids portal rendering so events reach React root
vi.mock('@/components/ui/alert-dialog', async () => {
  const r = await import('react');
  return {
    AlertDialog: ({ children, open }: { children: r.ReactNode; open?: boolean }) =>
      open ? r.createElement('div', { 'data-testid': 'alert-dialog' }, children) : null,
    AlertDialogContent: ({ children }: { children: r.ReactNode }) =>
      r.createElement('div', { 'data-testid': 'alert-dialog-content' }, children),
    AlertDialogHeader: ({ children }: { children: r.ReactNode }) =>
      r.createElement('div', null, children),
    AlertDialogFooter: ({ children }: { children: r.ReactNode }) =>
      r.createElement('div', null, children),
    AlertDialogTitle: ({ children }: { children: r.ReactNode }) =>
      r.createElement('h2', null, children),
    AlertDialogDescription: ({ children }: { children: r.ReactNode }) =>
      r.createElement('p', null, children),
    AlertDialogAction: r.forwardRef(function AlertDialogAction(
      props: r.ButtonHTMLAttributes<HTMLButtonElement>,
      ref: r.Ref<HTMLButtonElement>,
    ) {
      return r.createElement('button', {
        ...props,
        ref,
        'data-testid': 'dialog-action',
      });
    }),
    AlertDialogCancel: r.forwardRef(function AlertDialogCancel(
      props: r.ButtonHTMLAttributes<HTMLButtonElement>,
      ref: r.Ref<HTMLButtonElement>,
    ) {
      return r.createElement('button', {
        ...props,
        ref,
        'data-testid': 'dialog-cancel',
      });
    }),
  };
});

type DialogConfig = {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
};

function renderDialog(
  config: DialogConfig,
  onConfirm = vi.fn(),
  onCancel = vi.fn(),
) {
  render(
    React.createElement(ConfirmDialog, {
      open: true,
      onOpenChange: vi.fn(),
      title: config.title,
      body: config.body,
      confirmLabel: config.confirmLabel,
      cancelLabel: config.cancelLabel,
      destructive: config.destructive,
      onConfirm,
      onCancel,
    }),
  );
  return { onConfirm, onCancel };
}

describe('confirmation-dialogs', () => {
  it('D-01: Remove BOM Item (standard)', async () => {
    const config = removeBomItemDialog('UniFi Dream Machine SE');
    const { onConfirm, onCancel } = renderDialog(config);

    expect(screen.getByText('Remove Item?')).toBeTruthy();
    expect(
      screen.getByText(/Remove "UniFi Dream Machine SE" from the BOM\? This cannot be undone\./),
    ).toBeTruthy();
    const confirmBtn = screen.getByTestId('dialog-action');
    expect(confirmBtn.textContent).toBe('Remove Item');
    expect(config.destructive).toBe(true);
    expect(confirmBtn.className).toContain('destructive');

    await act(async () => { fireEvent.click(confirmBtn); });
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('dialog-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('D-02: Remove BOM Item (allocated)', async () => {
    const config = removeAllocatedBomItemDialog('Mac Mini 16GB 256GB');
    const { onConfirm, onCancel } = renderDialog(config);

    expect(screen.getByText('Remove Allocated Item?')).toBeTruthy();
    expect(
      screen.getByText(/"Mac Mini 16GB 256GB" is already reserved in inventory for this project/),
    ).toBeTruthy();
    const confirmBtn = screen.getByTestId('dialog-action');
    expect(confirmBtn.textContent).toBe('Remove and Release');
    expect(config.destructive).toBe(true);
    expect(confirmBtn.className).toContain('destructive');

    await act(async () => { fireEvent.click(confirmBtn); });
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('dialog-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('D-03: Regenerate BOM', async () => {
    const config = regenerateBomDialog(24, 2);
    const { onConfirm, onCancel } = renderDialog(config);

    expect(screen.getByText('Regenerate BOM?')).toBeTruthy();
    expect(screen.getByText(/22 auto-generated items/)).toBeTruthy();
    expect(screen.getByText(/Your 2 manually added item\(s\) will be preserved/)).toBeTruthy();
    const confirmBtn = screen.getByTestId('dialog-action');
    expect(confirmBtn.textContent).toBe('Regenerate BOM');
    expect(config.destructive).toBe(true);
    expect(confirmBtn.className).toContain('destructive');

    await act(async () => { fireEvent.click(confirmBtn); });
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('dialog-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('D-04: Cancel PO (no items received)', async () => {
    const config = cancelPoDialog('PO-2026-004', 'UniFi');
    const { onConfirm, onCancel } = renderDialog(config);

    expect(screen.getByText('Cancel Purchase Order?')).toBeTruthy();
    expect(
      screen.getByText(/Cancel PO-2026-004 from UniFi\? No inventory has been received/),
    ).toBeTruthy();
    const confirmBtn = screen.getByTestId('dialog-action');
    expect(confirmBtn.textContent).toBe('Cancel PO');
    expect(config.destructive).toBe(true);
    expect(confirmBtn.className).toContain('destructive');

    await act(async () => { fireEvent.click(confirmBtn); });
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('dialog-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('D-05: Cancel PO (partial receipt)', async () => {
    const config = cancelPartialPoDialog('PO-2026-004', 3, 5);
    const { onConfirm, onCancel } = renderDialog(config);

    expect(screen.getByText('Cancel Remaining Items?')).toBeTruthy();
    expect(screen.getByText(/PO-2026-004 has already received 3 items/)).toBeTruthy();
    expect(screen.getByText(/remaining 5 undelivered items will be marked as cancelled/)).toBeTruthy();
    const confirmBtn = screen.getByTestId('dialog-action');
    expect(confirmBtn.textContent).toBe('Cancel Remaining');
    expect(config.destructive).toBe(true);
    expect(confirmBtn.className).toContain('destructive');

    await act(async () => { fireEvent.click(confirmBtn); });
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('dialog-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('D-06: Mark PO as Ordered', async () => {
    const config = markOrderedDialog('PO-2026-004', 'UniFi');
    const { onConfirm, onCancel } = renderDialog(config);

    expect(screen.getByText('Confirm Order Placed')).toBeTruthy();
    expect(screen.getByText(/Has PO-2026-004 been placed with UniFi\?/)).toBeTruthy();
    const confirmBtn = screen.getByTestId('dialog-action');
    expect(confirmBtn.textContent).toBe('Yes, Mark as Ordered');
    expect(config.destructive).toBe(false);
    expect(confirmBtn.className).not.toContain('text-destructive');

    await act(async () => { fireEvent.click(confirmBtn); });
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('dialog-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('D-07: Mark All Items Shipped', async () => {
    const config = markAllShippedDialog(28);
    const { onConfirm, onCancel } = renderDialog(config);

    expect(screen.getByText('Mark All Items as Shipped?')).toBeTruthy();
    expect(screen.getByText(/This will mark all 28 BOM items as shipped/)).toBeTruthy();
    const confirmBtn = screen.getByTestId('dialog-action');
    expect(confirmBtn.textContent).toBe('Mark Shipped');
    expect(config.destructive).toBe(false);
    expect(confirmBtn.className).not.toContain('text-destructive');

    await act(async () => { fireEvent.click(confirmBtn); });
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('dialog-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('D-08: Un-ship Item', async () => {
    const config = unshipItemDialog('Mac Mini 16GB 256GB', 1);
    const { onConfirm, onCancel } = renderDialog(config);

    expect(screen.getByText('Un-ship Item?')).toBeTruthy();
    expect(
      screen.getByText(/Un-shipping "Mac Mini 16GB 256GB" will add 1 unit\(s\) back to inventory/),
    ).toBeTruthy();
    const confirmBtn = screen.getByTestId('dialog-action');
    expect(confirmBtn.textContent).toBe('Un-ship');
    expect(config.destructive).toBe(false);
    expect(confirmBtn.className).not.toContain('text-destructive');

    await act(async () => { fireEvent.click(confirmBtn); });
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('dialog-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('D-09: Advance to Deployment', async () => {
    const config = advanceToDeploymentDialog('Telepark Jersey City', 'Pro');
    const { onConfirm, onCancel } = renderDialog(config);

    expect(screen.getByText('Advance to Deployment?')).toBeTruthy();
    expect(
      screen.getByText(/deployment checklist for Telepark Jersey City \(Pro tier\)/),
    ).toBeTruthy();
    const confirmBtn = screen.getByTestId('dialog-action');
    expect(confirmBtn.textContent).toBe('Advance to Deployment');
    expect(config.destructive).toBe(false);
    expect(confirmBtn.className).not.toContain('text-destructive');

    await act(async () => { fireEvent.click(confirmBtn); });
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('dialog-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('D-10: Cancel Project', async () => {
    const config = cancelProjectDialog('Telepark Jersey City');
    const { onConfirm, onCancel } = renderDialog(config);

    expect(screen.getByText('Cancel this project?')).toBeTruthy();
    expect(
      screen.getByText(/This will mark Telepark Jersey City as cancelled/),
    ).toBeTruthy();
    const confirmBtn = screen.getByTestId('dialog-action');
    expect(confirmBtn.textContent).toBe('Yes, Cancel Project');
    expect(config.destructive).toBe(true);
    expect(confirmBtn.className).toContain('destructive');

    await act(async () => { fireEvent.click(confirmBtn); });
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('dialog-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('D-11: Delete Project', async () => {
    const config = deleteProjectDialog('Telepark Jersey City', 'Acme Sports');
    const { onConfirm, onCancel } = renderDialog(config);

    expect(screen.getByText('Delete Project?')).toBeTruthy();
    expect(
      screen.getByText(/Permanently delete "Telepark Jersey City" \(Acme Sports\)\?/),
    ).toBeTruthy();
    const confirmBtn = screen.getByTestId('dialog-action');
    expect(confirmBtn.textContent).toBe('Delete Project');
    expect(config.destructive).toBe(true);
    expect(confirmBtn.className).toContain('destructive');

    await act(async () => { fireEvent.click(confirmBtn); });
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('dialog-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('D-12: Delete Expense', async () => {
    const config = deleteExpenseDialog('$1,800.00', 'Airfare', 'Mar 5, 2026');
    const { onConfirm, onCancel } = renderDialog(config);

    expect(screen.getByText('Delete Expense?')).toBeTruthy();
    expect(
      screen.getByText(/permanently delete the \$1,800\.00 Airfare expense from Mar 5, 2026/),
    ).toBeTruthy();
    const confirmBtn = screen.getByTestId('dialog-action');
    expect(confirmBtn.textContent).toBe('Delete');
    expect(config.destructive).toBe(true);
    expect(confirmBtn.className).toContain('destructive');

    await act(async () => { fireEvent.click(confirmBtn); });
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('dialog-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('D-13: Mark Final Paid — Close Project', async () => {
    const config = markFinalPaidDialog('Telepark Jersey City', '$21,131.06');
    const { onConfirm, onCancel } = renderDialog(config);

    expect(screen.getByText('Close this project?')).toBeTruthy();
    expect(
      screen.getByText(/Recording final payment of \$21,131\.06 for Telepark Jersey City/),
    ).toBeTruthy();
    const confirmBtn = screen.getByTestId('dialog-action');
    expect(confirmBtn.textContent).toBe('Mark Paid & Close');
    expect(config.destructive).toBe(false);
    expect(confirmBtn.className).not.toContain('text-destructive');

    await act(async () => { fireEvent.click(confirmBtn); });
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('dialog-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('D-14: Unlock Deployment for Editing', async () => {
    const config = unlockDeploymentDialog();
    const { onConfirm, onCancel } = renderDialog(config);

    expect(screen.getByText('Unlock Deployment for Editing?')).toBeTruthy();
    expect(
      screen.getByText(/Re-opening the deployment checklist for editing/),
    ).toBeTruthy();
    const confirmBtn = screen.getByTestId('dialog-action');
    expect(confirmBtn.textContent).toBe('Unlock');
    expect(config.destructive).toBe(false);
    expect(confirmBtn.className).not.toContain('text-destructive');

    await act(async () => { fireEvent.click(confirmBtn); });
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('dialog-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('D-15: Unlock Completed Project', async () => {
    const config = unlockCompletedProjectDialog('Telepark Jersey City');
    const { onConfirm, onCancel } = renderDialog(config);

    expect(screen.getByText('Unlock completed project?')).toBeTruthy();
    expect(
      screen.getByText(/Telepark Jersey City is marked as Completed\. Unlocking will allow editing/),
    ).toBeTruthy();
    const confirmBtn = screen.getByTestId('dialog-action');
    expect(confirmBtn.textContent).toBe('Unlock for Editing');
    expect(config.destructive).toBe(false);
    expect(confirmBtn.className).not.toContain('text-destructive');

    await act(async () => { fireEvent.click(confirmBtn); });
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('dialog-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('D-16: Deactivate Catalog Item', async () => {
    const config = deactivateCatalogItemDialog('UniFi Dream Machine SE', 'NET-UDM-SE');
    const { onConfirm, onCancel } = renderDialog(config);

    expect(screen.getByText('Deactivate item?')).toBeTruthy();
    expect(
      screen.getByText(/"UniFi Dream Machine SE" \(NET-UDM-SE\) will no longer appear/),
    ).toBeTruthy();
    const confirmBtn = screen.getByTestId('dialog-action');
    expect(confirmBtn.textContent).toBe('Deactivate');
    expect(config.destructive).toBe(true);
    expect(confirmBtn.className).toContain('destructive');

    await act(async () => { fireEvent.click(confirmBtn); });
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('dialog-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('D-17: Deactivate Team Contact', async () => {
    const config = deactivateContactDialog('Nico', 'Hardware & Installations');
    const { onConfirm, onCancel } = renderDialog(config);

    expect(screen.getByText('Deactivate contact?')).toBeTruthy();
    expect(
      screen.getByText(/Nico \(Hardware & Installations\) will be hidden from the active contacts/),
    ).toBeTruthy();
    const confirmBtn = screen.getByTestId('dialog-action');
    expect(confirmBtn.textContent).toBe('Deactivate');
    expect(config.destructive).toBe(false);
    expect(confirmBtn.className).not.toContain('text-destructive');

    await act(async () => { fireEvent.click(confirmBtn); });
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('dialog-cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
