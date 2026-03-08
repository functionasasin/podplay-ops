// Tests: ReplaySignFulfillment — qty = court_count × 2, status transitions, all signs tracked.

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';

// --- Hoist Supabase mock ---
const { mockFrom, mockSignsInsert, mockMovementInsert, mockUpdate, setSignData } = vi.hoisted(() => {
  type SignStatus = 'staged' | 'shipped' | 'delivered' | 'installed';

  interface SignRecord {
    id: string;
    qty: number;
    status: SignStatus;
    outreach_channel: string | null;
    outreach_date: string | null;
    vendor_order_id: string | null;
    tracking_number: string | null;
    shipped_date: string | null;
    delivered_date: string | null;
    installed_date: string | null;
    notes: string | null;
  }

  let _signData: SignRecord = {
    id: 'sign-1',
    qty: 8,
    status: 'staged',
    outreach_channel: null,
    outreach_date: null,
    vendor_order_id: null,
    tracking_number: null,
    shipped_date: null,
    delivered_date: null,
    installed_date: null,
    notes: null,
  };

  function setSignData(d: Partial<SignRecord>) {
    _signData = { ..._signData, ...d };
  }

  const mockSignsInsert = vi.fn().mockImplementation(() => {
    const single = vi.fn().mockResolvedValue({ data: _signData });
    return { select: vi.fn(() => ({ single })) };
  });

  const mockMovementInsert = vi.fn().mockResolvedValue({ error: null });

  const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
  const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));

  const mockFrom = vi.fn((table: string) => {
    if (table === 'projects') {
      const single = vi.fn().mockResolvedValue({ data: { court_count: 4 } });
      const eq = vi.fn(() => ({ single }));
      const select = vi.fn(() => ({ eq }));
      return { select };
    }
    if (table === 'replay_signs') {
      const maybeSingle = vi.fn().mockResolvedValue({ data: _signData });
      const eq = vi.fn(() => ({ maybeSingle }));
      const select = vi.fn(() => ({ eq }));
      return { select, insert: mockSignsInsert, update: mockUpdate };
    }
    if (table === 'hardware_catalog') {
      const single = vi.fn().mockResolvedValue({ data: { id: 'cat-replay-sign' } });
      const eq = vi.fn(() => ({ single }));
      const select = vi.fn(() => ({ eq }));
      return { select };
    }
    if (table === 'inventory_movements') {
      return { insert: mockMovementInsert };
    }
    return {};
  });

  return { mockFrom, mockSignsInsert, mockMovementInsert, mockUpdate, setSignData };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

import { ReplaySignFulfillment } from '@/components/wizard/procurement/ReplaySignFulfillment';

function renderComponent() {
  return render(React.createElement(ReplaySignFulfillment, { projectId: 'proj-abc' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  // Reset to default staged record with qty=8 (court_count 4 × 2)
  setSignData({
    id: 'sign-1',
    qty: 8,
    status: 'staged',
    outreach_channel: null,
    outreach_date: null,
    vendor_order_id: null,
    tracking_number: null,
    shipped_date: null,
    delivered_date: null,
    installed_date: null,
    notes: null,
  });
});

// 1. Shows loading state initially
test('shows loading state before data loads', () => {
  renderComponent();
  expect(screen.getByText(/loading replay signs/i)).toBeInTheDocument();
});

// 2. Auto-calculated qty text shows court_count × 2
test('shows auto-calculated qty text as court_count × 2', async () => {
  renderComponent();
  await waitFor(() => {
    expect(screen.getByText(/4 courts × 2 = 8/i)).toBeInTheDocument();
  });
});

// 3. Status badge shows "Staged" for staged status
test('renders Staged status badge when status is staged', async () => {
  renderComponent();
  await waitFor(() => {
    expect(screen.getByText('Staged')).toBeInTheDocument();
  });
});

// 4. Outreach channel dropdown includes slack, email, other
test('outreach channel dropdown has slack, email, other options', async () => {
  renderComponent();
  await waitFor(() => screen.getByText('Staged'));
  const channelSelect = screen.getByLabelText(/channel/i) as HTMLSelectElement;
  const options = Array.from(channelSelect.options).map((o) => o.value);
  expect(options).toContain('slack');
  expect(options).toContain('email');
  expect(options).toContain('other');
});

// 5. Mark Shipped button is disabled when outreach_date is not set
test('Mark Shipped button is disabled without outreach_date', async () => {
  // staged with no outreach_date (default)
  renderComponent();
  await waitFor(() => screen.getByText('Mark Shipped'));
  const btn = screen.getByRole('button', { name: /mark shipped/i });
  expect(btn).toBeDisabled();
});

// 6. Mark Shipped button is enabled when outreach_date is set and calls update
test('Mark Shipped calls update with status=shipped and shipped_date when outreach_date set', async () => {
  setSignData({ outreach_date: '2026-03-01' });
  renderComponent();
  await waitFor(() => screen.getByText('Mark Shipped'));

  const btn = screen.getByRole('button', { name: /mark shipped/i });
  expect(btn).not.toBeDisabled();
  fireEvent.click(btn);

  await waitFor(() => {
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'shipped',
        shipped_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      })
    );
  });
});

// 7. Mark Delivered button visible when status is shipped
test('shows Mark Delivered button when status is shipped', async () => {
  setSignData({ status: 'shipped', shipped_date: '2026-03-02' });
  renderComponent();
  await waitFor(() => {
    expect(screen.getByText('Shipped')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark delivered/i })).toBeInTheDocument();
  });
});

// 8. Mark Installed button visible when status is delivered
test('shows Mark Installed button when status is delivered', async () => {
  setSignData({ status: 'delivered', delivered_date: '2026-03-03' });
  renderComponent();
  await waitFor(() => {
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark installed/i })).toBeInTheDocument();
  });
});

// 9. Mark Installed triggers inventory_movements insert with qty_delta = -qty
test('Mark Installed inserts inventory_movement with qty_delta = -qty', async () => {
  setSignData({ status: 'delivered', delivered_date: '2026-03-03', qty: 8 });
  renderComponent();
  await waitFor(() => screen.getByRole('button', { name: /mark installed/i }));

  fireEvent.click(screen.getByRole('button', { name: /mark installed/i }));

  await waitFor(() => {
    expect(mockMovementInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        movement_type: 'project_shipped',
        qty_delta: -8,
        project_id: 'proj-abc',
      })
    );
  });
});

// 10. Save Changes calls update with qty and outreach fields
test('Save Changes calls update with qty and outreach channel fields', async () => {
  renderComponent();
  await waitFor(() => screen.getByText('Save Changes'));

  // Change the outreach channel to email
  const channelSelect = screen.getByLabelText(/channel/i);
  fireEvent.change(channelSelect, { target: { value: 'email' } });

  fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

  await waitFor(() => {
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        qty: 8,
        outreach_channel: 'email',
      })
    );
  });
});
