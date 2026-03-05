import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InviteMemberDialog, type InviteMemberDialogProps } from '../InviteMemberDialog';

function renderDialog(overrides: Partial<InviteMemberDialogProps> = {}) {
  const defaultProps: InviteMemberDialogProps = {
    open: true,
    onOpenChange: vi.fn(),
    onInvite: vi.fn().mockResolvedValue(undefined),
    seatUsage: { used: 2, limit: 5, available: 3, isFull: false },
    ...overrides,
  };

  return { ...render(<InviteMemberDialog {...defaultProps} />), props: defaultProps };
}

describe('InviteMemberDialog', () => {
  it('renders dialog when open', () => {
    renderDialog();

    expect(screen.getByText(/invite member/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderDialog({ open: false });

    expect(screen.queryByText(/invite member/i)).not.toBeInTheDocument();
  });

  it('shows email input field', () => {
    renderDialog();

    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toBeInTheDocument();
  });

  it('shows role dropdown with 4 options', async () => {
    const user = userEvent.setup();
    renderDialog();

    const roleSelect = screen.getByLabelText(/role/i);
    expect(roleSelect).toBeInTheDocument();

    // Click to open the dropdown
    await user.click(roleSelect);

    // All four roles should be available
    expect(screen.getByText(/admin/i)).toBeInTheDocument();
    expect(screen.getByText(/attorney/i)).toBeInTheDocument();
    expect(screen.getByText(/paralegal/i)).toBeInTheDocument();
    expect(screen.getByText(/readonly/i)).toBeInTheDocument();
  });

  it('shows seat usage info', () => {
    renderDialog();

    expect(screen.getByText(/2.*\/.*5/)).toBeInTheDocument();
  });

  it('submit creates invitation with email and role', async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onInvite });

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'new@firm.ph');

    // Select a role
    const roleSelect = screen.getByLabelText(/role/i);
    await user.click(roleSelect);
    await user.click(screen.getByText(/attorney/i));

    // Submit
    const submitButton = screen.getByRole('button', { name: /invite/i });
    await user.click(submitButton);

    expect(onInvite).toHaveBeenCalledWith('new@firm.ph', 'attorney');
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn();
    renderDialog({ onInvite });

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'not-an-email');

    const submitButton = screen.getByRole('button', { name: /invite/i });
    await user.click(submitButton);

    expect(onInvite).not.toHaveBeenCalled();
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
  });

  it('requires email field', async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn();
    renderDialog({ onInvite });

    const submitButton = screen.getByRole('button', { name: /invite/i });
    await user.click(submitButton);

    expect(onInvite).not.toHaveBeenCalled();
  });

  it('shows error when seat limit reached', () => {
    renderDialog({
      seatUsage: { used: 5, limit: 5, available: 0, isFull: true },
    });

    expect(screen.getByText(/seat limit/i)).toBeInTheDocument();

    // Submit button should be disabled when full
    const submitButton = screen.getByRole('button', { name: /invite/i });
    expect(submitButton).toBeDisabled();
  });

  it('shows error when invitation fails', async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn().mockRejectedValue(new Error('RLS policy violation'));
    renderDialog({ onInvite });

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'new@firm.ph');

    const submitButton = screen.getByRole('button', { name: /invite/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });

  it('closes dialog on cancel', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('clears form on successful submission', async () => {
    const user = userEvent.setup();
    const onInvite = vi.fn().mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    renderDialog({ onInvite, onOpenChange });

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'new@firm.ph');

    const submitButton = screen.getByRole('button', { name: /invite/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('displays seat usage for solo plan', () => {
    renderDialog({
      seatUsage: { used: 1, limit: 1, available: 0, isFull: true },
    });

    expect(screen.getByText(/1.*\/.*1/)).toBeInTheDocument();
    expect(screen.getByText(/seat limit/i)).toBeInTheDocument();
  });
});
