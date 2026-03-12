// Tests: DepositInvoice — amount pre-filled from depositAmount, submit creates type='deposit',
// invoice status tracking (Draft/Sent/Paid badges), loading state, error state.

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';

const PROJECT_ID = 'proj-abc-1234-5678';
const DEPOSIT_AMOUNT = 1500;

// --- Hoist Supabase mock ---
const { mockFrom, mockInsert, mockSelectEq } = vi.hoisted(() => {
  const INVOICES = [
    {
      id: 'inv-1',
      type: 'deposit',
      amount: 1500,
      status: 'not_sent',
      issued_date: '2026-03-08',
      payment_method: 'podplay_card',
      notes: 'First deposit',
    },
    {
      id: 'inv-2',
      type: 'deposit',
      amount: 2000,
      status: 'sent',
      issued_date: '2026-03-09',
      payment_method: null,
      notes: null,
    },
    {
      id: 'inv-3',
      type: 'deposit',
      amount: 500,
      status: 'paid',
      issued_date: '2026-03-10',
      payment_method: 'ramp_reimburse',
      notes: null,
    },
  ];

  const mockSelectEq = vi.fn().mockResolvedValue({ data: INVOICES });
  const mockEq = vi.fn(() => ({ eq: mockSelectEq }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));

  const mockSingle = vi.fn().mockResolvedValue({
    data: { id: 'inv-new', type: 'deposit', amount: 1500, status: 'not_sent', issued_date: '2026-03-08', payment_method: null, notes: null },
    error: null,
  });
  const mockInsertSelect = vi.fn(() => ({ single: mockSingle }));
  const mockInsert = vi.fn(() => ({ select: mockInsertSelect }));

  const mockSettingsSingle = vi.fn().mockResolvedValue({ data: { minimum_deposit: 500 }, error: null });
  const mockFrom = vi.fn((table: string) => {
    if (table === 'settings') return { select: vi.fn(() => ({ single: mockSettingsSingle })) };
    return {
      select: mockSelect,
      insert: mockInsert,
    };
  });

  return { mockFrom, mockInsert, mockSelectEq };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

import { DepositInvoice } from '@/components/wizard/financials/DepositInvoice';

function renderComponent(depositAmount?: number) {
  return render(
    React.createElement(DepositInvoice, {
      projectId: PROJECT_ID,
      depositAmount,
    }),
  );
}

// 1. Amount field is pre-filled from depositAmount prop
test('amount field is pre-filled from depositAmount prop', () => {
  renderComponent(DEPOSIT_AMOUNT);
  const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;
  expect(Number(amountInput.value)).toBe(DEPOSIT_AMOUNT);
});

// 2. Shows loading state before data loads
test('shows loading state before invoices load', () => {
  renderComponent(DEPOSIT_AMOUNT);
  expect(screen.getByText(/loading invoices/i)).toBeInTheDocument();
});

// 3. Submit inserts invoice with type='deposit'
test('submit inserts invoice with type deposit', async () => {
  renderComponent(DEPOSIT_AMOUNT);

  await waitFor(() =>
    expect(screen.queryByText(/loading invoices/i)).not.toBeInTheDocument(),
  );

  // Set a valid payment method to pass Zod enum validation
  const paymentMethodSelect = screen.getByLabelText(/payment method/i);
  fireEvent.change(paymentMethodSelect, { target: { value: 'podplay_card' } });

  const dateInput = screen.getByLabelText(/invoice date/i);
  fireEvent.change(dateInput, { target: { value: '2026-03-08' } });

  fireEvent.click(screen.getByRole('button', { name: /create deposit invoice/i }));

  await waitFor(() => {
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: PROJECT_ID,
        type: 'deposit',
        status: 'not_sent',
      }),
    );
  });
});

// 4. Invoice amount is displayed in status list
test('invoice amount displayed in status list', async () => {
  renderComponent(DEPOSIT_AMOUNT);
  await waitFor(() => {
    expect(screen.getByText('$1500.00')).toBeInTheDocument();
  });
});

// 5. not_sent status shows "Draft" badge
test('not_sent status shows Draft badge', async () => {
  renderComponent(DEPOSIT_AMOUNT);
  await waitFor(() => {
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });
});

// 6. sent status shows "Sent" badge
test('sent status shows Sent badge', async () => {
  renderComponent(DEPOSIT_AMOUNT);
  await waitFor(() => {
    expect(screen.getByText('Sent')).toBeInTheDocument();
  });
});

// 7. paid status shows "Paid" badge
test('paid status shows Paid badge', async () => {
  renderComponent(DEPOSIT_AMOUNT);
  await waitFor(() => {
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });
});

// 8. Payment method options include podplay_card and ramp_reimburse
test('payment method dropdown has podplay_card and ramp_reimburse options', async () => {
  renderComponent(DEPOSIT_AMOUNT);
  await waitFor(() =>
    expect(screen.queryByText(/loading invoices/i)).not.toBeInTheDocument(),
  );

  const select = screen.getByLabelText(/payment method/i) as HTMLSelectElement;
  const values = Array.from(select.options).map((o) => o.value);
  expect(values).toContain('podplay_card');
  expect(values).toContain('ramp_reimburse');
});

// 9. Queried invoices filtered by type='deposit'
test('invoice fetch filters by type deposit', async () => {
  renderComponent(DEPOSIT_AMOUNT);
  await waitFor(() =>
    expect(screen.queryByText(/loading invoices/i)).not.toBeInTheDocument(),
  );
  // mockSelectEq is the second .eq() call (filters by type)
  expect(mockSelectEq).toHaveBeenCalledWith('type', 'deposit');
});

// 10. Invoice with payment_method shows PodPlay Card label
test('invoice payment method podplay_card shows PodPlay Card label', async () => {
  renderComponent(DEPOSIT_AMOUNT);
  await waitFor(() => {
    expect(screen.getByText(/podplay card/i)).toBeInTheDocument();
  });
});
