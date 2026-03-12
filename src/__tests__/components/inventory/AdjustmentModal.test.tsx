import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdjustmentModal } from '@/components/inventory/AdjustmentModal';

// --- Supabase mock ---
const mockInsert = vi.hoisted(() => vi.fn());
const mockEq = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockFrom = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Default happy-path mock setup
function setupSuccessMocks() {
  mockInsert.mockResolvedValue({ error: null });
  mockEq.mockResolvedValue({ error: null });
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockFrom.mockImplementation((table: string) => {
    if (table === 'inventory_movements') return { insert: mockInsert };
    if (table === 'inventory') return { update: mockUpdate };
    return {};
  });
}

const DEFAULT_PROPS = {
  itemId: 'item-001',
  itemName: 'Cat5e Cable (50m)',
  currentQty: 20,
  isOpen: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
};

function renderModal(overrides: Partial<typeof DEFAULT_PROPS> = {}) {
  const props = { ...DEFAULT_PROPS, onClose: vi.fn(), onSuccess: vi.fn(), ...overrides };
  render(<AdjustmentModal {...props} />);
  return props;
}

describe('AdjustmentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSuccessMocks();
  });

  it('AM-01: renders with item name and current quantity', () => {
    renderModal();
    expect(screen.getByText(/Adjust Inventory: Cat5e Cable \(50m\)/)).toBeInTheDocument();
  });

  it('AM-02: defaults to Increase direction', () => {
    renderModal();
    const increaseRadio = screen.getByRole('radio', { name: 'Increase' }) as HTMLInputElement;
    const decreaseRadio = screen.getByRole('radio', { name: 'Decrease' }) as HTMLInputElement;
    expect(increaseRadio.checked).toBe(true);
    expect(decreaseRadio.checked).toBe(false);
  });

  it('AM-03: direction toggle switches between Increase and Decrease', () => {
    renderModal();
    const decreaseRadio = screen.getByRole('radio', { name: 'Decrease' }) as HTMLInputElement;
    fireEvent.click(decreaseRadio);
    expect(decreaseRadio.checked).toBe(true);
    const increaseRadio = screen.getByRole('radio', { name: 'Increase' }) as HTMLInputElement;
    fireEvent.click(increaseRadio);
    expect(increaseRadio.checked).toBe(true);
    expect(decreaseRadio.checked).toBe(false);
  });

  it('AM-04: shows error when quantity is 0 and form is submitted', async () => {
    renderModal();
    // Use fireEvent.submit to bypass jsdom native required-field validation
    const form = document.querySelector('form')!;
    fireEvent.submit(form);
    await waitFor(() =>
      expect(screen.getByText('Quantity must be at least 1')).toBeInTheDocument(),
    );
  });

  it('AM-05: shows error when reason is empty and form is submitted', async () => {
    renderModal();
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '5' } });
    // Use fireEvent.submit to bypass jsdom native required-field validation on empty reason
    const form = document.querySelector('form')!;
    fireEvent.submit(form);
    await waitFor(() =>
      expect(screen.getByText('Reason is required')).toBeInTheDocument(),
    );
  });

  it('AM-06: decrease cannot exceed current quantity', async () => {
    renderModal({ currentQty: 10 });
    // Switch to decrease
    fireEvent.click(screen.getByRole('radio', { name: 'Decrease' }));
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Correction' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() =>
      expect(screen.getByText(/Cannot decrease by 15 — only 10 on hand/)).toBeInTheDocument(),
    );
  });

  it('AM-07: submit calls inventory_movements insert then inventory update', async () => {
    const props = renderModal({ currentQty: 20 });
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Received shipment' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('inventory_movements');
      expect(mockInsert).toHaveBeenCalledWith({
        hardware_catalog_id: props.itemId,
        movement_type: 'adjustment_increase',
        qty_delta: 5,
        notes: 'Received shipment',
      });
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('inventory');
      expect(mockUpdate).toHaveBeenCalledWith({ quantity_on_hand: 25 });
      expect(mockEq).toHaveBeenCalledWith('item_id', props.itemId);
    });
  });

  it('AM-08: decrease submit uses adjustment_decrease and subtracts quantity', async () => {
    const props = renderModal({ currentQty: 20 });
    fireEvent.click(screen.getByRole('radio', { name: 'Decrease' }));
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Correction' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ movement_type: 'adjustment_decrease', qty_delta: -3 }),
      );
      expect(mockUpdate).toHaveBeenCalledWith({ quantity_on_hand: 17 });
    });
  });

  it('AM-09: onSuccess callback is called after successful submission', async () => {
    const props = renderModal();
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(props.onSuccess).toHaveBeenCalledTimes(1));
  });

  it('AM-10: cancel button calls onClose without submitting', () => {
    const props = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
