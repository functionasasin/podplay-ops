// Tests: FinalInvoice — balance = total_price - deposit_amount, form blocked before go-live,
// submit creates type='final', invoice status tracking.

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';

const PROJECT_ID = 'proj-abc-1234-5678';
const TOTAL_PRICE = 10000;
const DEPOSIT_AMOUNT = 2500;
const BALANCE = TOTAL_PRICE - DEPOSIT_AMOUNT; // 7500

// --- Hoist Supabase mock ---
const { mockFrom, mockInsert, mockSelectEq } = vi.hoisted(() => {
  const INVOICES = [
    {
      id: 'inv-1',
      type: 'final',
      amount: 7500,
      status: 'not_sent',
      issued_date: '2026-03-10',
      payment_method: 'podplay_card',
      notes: 'Balance due',
    },
    {
      id: 'inv-2',
      type: 'final',
      amount: 7500,
      status: 'sent',
      issued_date: '2026-03-11',
      payment_method: null,
      notes: null,
    },
    {
      id: 'inv-3',
      type: 'final',
      amount: 7500,
      status: 'paid',
      issued_date: '2026-03-12',
      payment_method: 'ramp_reimburse',
      notes: null,
    },
  ];

  const mockSelectEq = vi.fn().mockResolvedValue({ data: INVOICES });
  const mockEq = vi.fn(() => ({ eq: mockSelectEq }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));

  const mockSingle = vi.fn().mockResolvedValue({
    data: {
      id: 'inv-new',
      type: 'final',
      amount: 7500,
      status: 'not_sent',
      issued_date: '2026-03-10',
      payment_method: null,
      notes: null,
    },
    error: null,
  });
  const mockInsertSelect = vi.fn(() => ({ single: mockSingle }));
  const mockInsert = vi.fn(() => ({ select: mockInsertSelect }));

  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
  }));

  return { mockFrom, mockInsert, mockSelectEq };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

import { FinalInvoice } from '@/components/wizard/financials/FinalInvoice';

function renderComponent(overrides: {
  totalPrice?: number;
  depositAmount?: number;
  projectStatus?: string;
  goLiveDate?: string | null;
} = {}) {
  return render(
    React.createElement(FinalInvoice, {
      projectId: PROJECT_ID,
      totalPrice: TOTAL_PRICE,
      depositAmount: DEPOSIT_AMOUNT,
      ...overrides,
    }),
  );
}

// 1. Balance = total_price - deposit_amount displayed correctly
test('balance equals total_price minus deposit_amount', () => {
  renderComponent({ goLiveDate: '2026-03-10' });
  expect(screen.getByText(`$${BALANCE.toFixed(2)}`)).toBeInTheDocument();
});

// 2. Total price and deposit amount shown in summary panel
test('shows total price and deposit amount in summary', () => {
  renderComponent({ goLiveDate: '2026-03-10' });
  expect(screen.getByText(`$${TOTAL_PRICE.toFixed(2)}`)).toBeInTheDocument();
  expect(screen.getByText(`$${DEPOSIT_AMOUNT.toFixed(2)}`)).toBeInTheDocument();
});

// 3. Shows loading state before invoices load
test('shows loading state before invoices load', () => {
  renderComponent({ goLiveDate: '2026-03-10' });
  expect(screen.getByText(/loading invoices/i)).toBeInTheDocument();
});

// 4. Form is blocked (disabled) when no go-live date and status not completed
test('form inputs are disabled when no go-live date and not completed', () => {
  renderComponent({ goLiveDate: null });
  const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;
  expect(amountInput.disabled).toBe(true);
  const submitBtn = screen.getByRole('button', { name: /create final invoice/i });
  expect(submitBtn).toBeDisabled();
});

// 5. Go-live gate banner shown when no go-live
test('shows go-live gate banner when go-live date is not set', () => {
  renderComponent({ goLiveDate: null });
  expect(screen.getByText(/go-live required/i)).toBeInTheDocument();
});

// 6. Form is unlocked when goLiveDate is provided
test('form inputs are enabled when go-live date is set', () => {
  renderComponent({ goLiveDate: '2026-03-10' });
  const amountInput = screen.getByLabelText(/amount/i) as HTMLInputElement;
  expect(amountInput.disabled).toBe(false);
  const submitBtn = screen.getByRole('button', { name: /create final invoice/i });
  expect(submitBtn).not.toBeDisabled();
});

// 7. Form is unlocked when projectStatus='completed' even without go-live date
test('form is unlocked when project status is completed', () => {
  renderComponent({ goLiveDate: null, projectStatus: 'completed' });
  const submitBtn = screen.getByRole('button', { name: /create final invoice/i });
  expect(submitBtn).not.toBeDisabled();
});

// 8. Submit creates invoice with type='final'
test('submit inserts invoice with type final', async () => {
  renderComponent({ goLiveDate: '2026-03-10' });

  await waitFor(() =>
    expect(screen.queryByText(/loading invoices/i)).not.toBeInTheDocument(),
  );

  const paymentMethodSelect = screen.getByLabelText(/payment method/i);
  fireEvent.change(paymentMethodSelect, { target: { value: 'podplay_card' } });

  const dateInput = screen.getByLabelText(/invoice date/i);
  fireEvent.change(dateInput, { target: { value: '2026-03-10' } });

  fireEvent.click(screen.getByRole('button', { name: /create final invoice/i }));

  await waitFor(() => {
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: PROJECT_ID,
        type: 'final',
        status: 'not_sent',
      }),
    );
  });
});

// 9. Invoice fetch filters by type='final'
test('invoice fetch filters by type final', async () => {
  renderComponent({ goLiveDate: '2026-03-10' });
  await waitFor(() =>
    expect(screen.queryByText(/loading invoices/i)).not.toBeInTheDocument(),
  );
  expect(mockSelectEq).toHaveBeenCalledWith('type', 'final');
});

// 10. Status badges shown: Draft, Sent, Paid
test('not_sent shows Draft badge, sent shows Sent badge, paid shows Paid badge', async () => {
  renderComponent({ goLiveDate: '2026-03-10' });
  await waitFor(() => {
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Sent')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });
});
