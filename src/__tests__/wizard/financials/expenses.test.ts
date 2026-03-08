// Tests: ExpenseTracker — add expense creates row with correct fields,
// edit expense updates values, delete expense removes row,
// category filter narrows rows, total updates after CRUD operations.

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';

const PROJECT_ID = 'proj-test-1234-5678';

// --- Hoist Supabase mock ---
const { mockFrom, mockInsert, mockUpdateEq, mockDeleteEq } = vi.hoisted(() => {
  const EXPENSES = [
    {
      id: 'exp-1',
      category: 'airfare',
      amount: 1800,
      payment_method: 'podplay_card',
      expense_date: '2026-03-01',
      notes: 'Flight to venue',
    },
    {
      id: 'exp-2',
      category: 'lodging',
      amount: 500,
      payment_method: 'ramp_reimburse',
      expense_date: '2026-03-02',
      notes: null,
    },
    {
      id: 'exp-3',
      category: 'airfare',
      amount: 900,
      payment_method: 'podplay_card',
      expense_date: '2026-03-03',
      notes: null,
    },
  ];

  // Insert chain: .insert(...).select().single()
  const mockSingle = vi.fn().mockResolvedValue({
    data: {
      id: 'exp-new',
      category: 'meals',
      amount: 75,
      payment_method: 'podplay_card',
      expense_date: '2026-03-08',
      notes: null,
    },
    error: null,
  });
  const mockInsertSelect = vi.fn(() => ({ single: mockSingle }));
  const mockInsert = vi.fn(() => ({ select: mockInsertSelect }));

  // Update chain: .update(...).eq('id', id).select().single()
  const mockUpdateSingle = vi.fn().mockResolvedValue({
    data: {
      id: 'exp-1',
      category: 'meals',
      amount: 75,
      payment_method: 'ramp_reimburse',
      expense_date: '2026-03-01',
      notes: 'Edited note',
    },
    error: null,
  });
  const mockUpdateSelect = vi.fn(() => ({ single: mockUpdateSingle }));
  const mockUpdateEq = vi.fn(() => ({ select: mockUpdateSelect }));
  const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));

  // Delete chain: .delete().eq('id', id)
  const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });
  const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }));

  // Select chain: .select(...).eq('project_id', id).order(...)
  const mockOrder = vi.fn().mockResolvedValue({ data: EXPENSES });
  const mockSelectEq = vi.fn(() => ({ order: mockOrder }));
  const mockSelect = vi.fn(() => ({ eq: mockSelectEq }));

  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  }));

  return { mockFrom, mockInsert, mockUpdateEq, mockDeleteEq };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

import { ExpenseTracker } from '@/components/wizard/financials/ExpenseTracker';

function renderComponent() {
  return render(React.createElement(ExpenseTracker, { projectId: PROJECT_ID }));
}

async function waitForLoad() {
  await waitFor(() =>
    expect(screen.queryByText(/loading expenses/i)).not.toBeInTheDocument(),
  );
}

// 1. Shows loading state initially
test('shows loading state initially', () => {
  renderComponent();
  expect(screen.getByText(/loading expenses/i)).toBeInTheDocument();
});

// 2. Renders all 3 expense amounts in table after data loads
test('renders expense rows after loading', async () => {
  renderComponent();
  await waitForLoad();
  // Check by amounts to avoid matching dropdown option elements
  expect(screen.getByText('$1800.00')).toBeInTheDocument();
  expect(screen.getByText('$500.00')).toBeInTheDocument();
  expect(screen.getByText('$900.00')).toBeInTheDocument();
});

// 3. Add expense — insert called with correct project_id, category, amount, payment_method
test('add expense insert payload has correct fields', async () => {
  renderComponent();
  await waitForLoad();

  // Open add form
  fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

  // Use exact label text to avoid matching "Filter by category:"
  const categorySelect = screen.getByLabelText('Category');
  fireEvent.change(categorySelect, { target: { value: 'meals' } });

  const amountInput = screen.getByLabelText('Amount');
  fireEvent.change(amountInput, { target: { value: '75' } });

  const paymentSelect = screen.getByLabelText('Payment Method');
  fireEvent.change(paymentSelect, { target: { value: 'podplay_card' } });

  fireEvent.click(screen.getByRole('button', { name: /save expense/i }));

  await waitFor(() => {
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: PROJECT_ID,
        category: 'meals',
        amount: 75,
        payment_method: 'podplay_card',
      }),
    );
  });
});

// 4. Add expense — new row appears in the table (optimistic state update)
test('add expense adds new row to expense list', async () => {
  renderComponent();
  await waitForLoad();

  fireEvent.click(screen.getByRole('button', { name: /add expense/i }));

  const categorySelect = screen.getByLabelText('Category');
  fireEvent.change(categorySelect, { target: { value: 'meals' } });

  const amountInput = screen.getByLabelText('Amount');
  fireEvent.change(amountInput, { target: { value: '75' } });

  const paymentSelect = screen.getByLabelText('Payment Method');
  fireEvent.change(paymentSelect, { target: { value: 'podplay_card' } });

  fireEvent.click(screen.getByRole('button', { name: /save expense/i }));

  await waitFor(() => {
    // $75.00 row from the inserted mock response
    expect(screen.getByText('$75.00')).toBeInTheDocument();
  });
});

// 5. Edit expense — update called with correct id
test('edit expense update payload targets correct expense id', async () => {
  renderComponent();
  await waitForLoad();

  // Click the first Edit button (for exp-1)
  const editButtons = screen.getAllByRole('button', { name: /edit/i });
  fireEvent.click(editButtons[0]);

  // Inline form appears with amount pre-filled to 1800
  const amountInput = screen.getByDisplayValue('1800');
  fireEvent.change(amountInput, { target: { value: '75' } });

  fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

  await waitFor(() => {
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'exp-1');
  });
});

// 6. Edit expense — updated row reflected in table
test('edit expense updates row value in table', async () => {
  renderComponent();
  await waitForLoad();

  const editButtons = screen.getAllByRole('button', { name: /edit/i });
  fireEvent.click(editButtons[0]);

  const amountInput = screen.getByDisplayValue('1800');
  fireEvent.change(amountInput, { target: { value: '75' } });

  fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

  await waitFor(() => {
    // Mock response returns amount=75 — original $1800.00 replaced by $75.00
    const amountCells = screen.getAllByText('$75.00');
    expect(amountCells.length).toBeGreaterThanOrEqual(1);
  });
});

// 7. Delete expense — delete called with correct id
test('delete expense calls supabase delete with correct id', async () => {
  renderComponent();
  await waitForLoad();

  // Get all Delete row-action buttons (one per row)
  const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
  // Click the first Delete (row exp-1)
  fireEvent.click(deleteButtons[0]);

  // Confirmation row appears; click the Confirm Delete (destructive) button
  const confirmButtons = screen.getAllByRole('button', { name: /^delete$/i });
  fireEvent.click(confirmButtons[0]);

  await waitFor(() => {
    expect(mockDeleteEq).toHaveBeenCalledWith('id', 'exp-1');
  });
});

// 8. Delete expense — row removed from table (amount no longer present)
test('delete expense removes row from table', async () => {
  renderComponent();
  await waitForLoad();

  // $1800.00 is shown before delete
  expect(screen.getByText('$1800.00')).toBeInTheDocument();

  const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
  fireEvent.click(deleteButtons[0]);
  const confirmButtons = screen.getAllByRole('button', { name: /^delete$/i });
  fireEvent.click(confirmButtons[0]);

  await waitFor(() => {
    expect(screen.queryByText('$1800.00')).not.toBeInTheDocument();
  });
  // Other rows still present
  expect(screen.getByText('$500.00')).toBeInTheDocument();
  expect(screen.getByText('$900.00')).toBeInTheDocument();
});

// 9. Category filter narrows displayed rows
test('category filter shows only matching rows', async () => {
  renderComponent();
  await waitForLoad();

  // Filter by 'lodging' — only exp-2 ($500.00) should remain
  const filterSelect = screen.getByLabelText(/filter by category/i);
  fireEvent.change(filterSelect, { target: { value: 'lodging' } });

  // Lodging row visible (appears in row + footer — use getAllByText)
  expect(screen.getAllByText('$500.00').length).toBeGreaterThanOrEqual(1);
  // Airfare rows not visible (check by amount)
  expect(screen.queryByText('$1800.00')).not.toBeInTheDocument();
  expect(screen.queryByText('$900.00')).not.toBeInTheDocument();
});

// 10. Total footer shows correct sum for all expenses
test('total footer shows correct sum for all expenses', async () => {
  renderComponent();
  await waitForLoad();
  // 1800 + 500 + 900 = 3200
  expect(screen.getByText('$3200.00')).toBeInTheDocument();
});

// 11. Total footer updates when category filter is applied
test('total footer updates when category filter applied', async () => {
  renderComponent();
  await waitForLoad();

  const filterSelect = screen.getByLabelText(/filter by category/i);
  fireEvent.change(filterSelect, { target: { value: 'airfare' } });

  // 1800 + 900 = 2700
  expect(screen.getByText('$2700.00')).toBeInTheDocument();
});

// 12. Total footer updates after expense is deleted
test('total footer updates after expense is deleted', async () => {
  renderComponent();
  await waitForLoad();

  // Delete exp-1 ($1800)
  const deleteButtons = screen.getAllByRole('button', { name: /^delete$/i });
  fireEvent.click(deleteButtons[0]);
  const confirmButtons = screen.getAllByRole('button', { name: /^delete$/i });
  fireEvent.click(confirmButtons[0]);

  await waitFor(() => {
    // 500 + 900 = 1400
    expect(screen.getByText('$1400.00')).toBeInTheDocument();
  });
});
