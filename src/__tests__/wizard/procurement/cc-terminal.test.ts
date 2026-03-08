// Tests: CcTerminalOrder — form submits, row created with serial + status='ordered', status transitions work.

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';

// --- Hoist Supabase mock ---
const { mockFrom, mockInsert, mockUpdate } = vi.hoisted(() => {
  const TERMINALS = [
    {
      id: 'term-1',
      serial_number: 'SN-11111111',
      model: 'Clover Flex',
      status: 'ordered',
      deployed_date: null,
      notes: null,
    },
    {
      id: 'term-2',
      serial_number: 'SN-22222222',
      model: 'Clover Mini',
      status: 'received',
      deployed_date: null,
      notes: 'Court 1',
    },
  ];

  const mockOrder = vi.fn().mockResolvedValue({ data: TERMINALS });
  const mockEq = vi.fn(() => ({ order: mockOrder }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));

  const mockInsert = vi.fn().mockResolvedValue({ error: null });

  const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
  const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));

  const mockFrom = vi.fn((table: string) => {
    if (table === 'cc_terminals') {
      return {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
      };
    }
    return { select: mockSelect, insert: mockInsert, update: mockUpdate };
  });

  return { mockFrom, mockInsert, mockUpdate };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

import { CcTerminalOrder } from '@/components/wizard/procurement/CcTerminalOrder';

function renderComponent() {
  return render(React.createElement(CcTerminalOrder, { projectId: 'proj-abc' }));
}

// 1. Shows loading state initially
test('shows loading state before data loads', () => {
  renderComponent();
  expect(screen.getByText(/loading cc terminals/i)).toBeInTheDocument();
});

// 2. Renders serial numbers from fetched data
test('renders serial numbers from fetched terminals', async () => {
  renderComponent();
  await waitFor(() => {
    expect(screen.getByText('SN-11111111')).toBeInTheDocument();
    expect(screen.getByText('SN-22222222')).toBeInTheDocument();
  });
});

// 3. Renders model names from fetched data
test('renders model names from fetched terminals', async () => {
  renderComponent();
  await waitFor(() => {
    expect(screen.getByText('Clover Flex')).toBeInTheDocument();
    expect(screen.getByText('Clover Mini')).toBeInTheDocument();
  });
});

// 4. "Add CC Terminal" button opens form
test('Add CC Terminal button shows form', async () => {
  renderComponent();
  await waitFor(() => screen.getByText('Add CC Terminal'));
  fireEvent.click(screen.getByText('Add CC Terminal'));
  expect(screen.getByLabelText(/serial number/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
});

// 5. Form submits insert with serial_number and status='ordered' by default
test('form submits insert with serial + status ordered by default', async () => {
  renderComponent();
  await waitFor(() => screen.getByText('Add CC Terminal'));
  fireEvent.click(screen.getByText('Add CC Terminal'));

  fireEvent.change(screen.getByLabelText(/serial number/i), { target: { value: 'SN-99999999' } });
  fireEvent.change(screen.getByLabelText(/^model/i), { target: { value: 'Clover Station' } });

  fireEvent.click(screen.getByRole('button', { name: /add terminal/i }));

  await waitFor(() => {
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'proj-abc',
        serial_number: 'SN-99999999',
        model: 'Clover Station',
        status: 'ordered',
      })
    );
  });
});

// 6. Validation error shown when serial number is blank (whitespace-only satisfies HTML required, trimmed by component)
test('shows error when serial number is missing', async () => {
  renderComponent();
  await waitFor(() => screen.getByText('Add CC Terminal'));
  fireEvent.click(screen.getByText('Add CC Terminal'));

  // Use spaces so HTML required is satisfied, but component trims to empty
  fireEvent.change(screen.getByLabelText(/serial number/i), { target: { value: '   ' } });
  fireEvent.change(screen.getByLabelText(/^model/i), { target: { value: 'Clover Flex' } });
  fireEvent.click(screen.getByRole('button', { name: /add terminal/i }));

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/serial number is required/i);
  });
});

// 7. Validation error shown when model is blank (whitespace-only satisfies HTML required, trimmed by component)
test('shows error when model is missing', async () => {
  renderComponent();
  await waitFor(() => screen.getByText('Add CC Terminal'));
  fireEvent.click(screen.getByText('Add CC Terminal'));

  fireEvent.change(screen.getByLabelText(/serial number/i), { target: { value: 'SN-12345678' } });
  // Use spaces so HTML required is satisfied, but component trims to empty
  fireEvent.change(screen.getByLabelText(/^model/i), { target: { value: '   ' } });
  fireEvent.click(screen.getByRole('button', { name: /add terminal/i }));

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/model is required/i);
  });
});

// 8. Status dropdown has all 5 options (ordered/received/configured/deployed/returned)
test('status dropdown contains all 5 status options', async () => {
  renderComponent();
  await waitFor(() => screen.getByText('Add CC Terminal'));
  fireEvent.click(screen.getByText('Add CC Terminal'));

  const statusSelect = screen.getByLabelText(/^status/i);
  const options = Array.from((statusSelect as HTMLSelectElement).options).map((o) => o.value);

  expect(options).toContain('ordered');
  expect(options).toContain('received');
  expect(options).toContain('configured');
  expect(options).toContain('deployed');
  expect(options).toContain('returned');
});

// 9. Inline status update calls update with new status
test('inline status select calls update with new status', async () => {
  renderComponent();
  await waitFor(() => {
    expect(screen.getByText('SN-11111111')).toBeInTheDocument();
  });

  const updateSelects = screen.getAllByRole('combobox');
  // First select in the list corresponds to term-1
  fireEvent.change(updateSelects[0], { target: { value: 'configured' } });

  await waitFor(() => {
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'configured' })
    );
  });
});

// 10. Deployed status sets deployed_date in update payload
test('updating status to deployed includes deployed_date', async () => {
  renderComponent();
  await waitFor(() => {
    expect(screen.getByText('SN-11111111')).toBeInTheDocument();
  });

  const updateSelects = screen.getAllByRole('combobox');
  fireEvent.change(updateSelects[0], { target: { value: 'deployed' } });

  await waitFor(() => {
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'deployed',
        deployed_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      })
    );
  });
});
