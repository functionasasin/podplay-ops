// Tests: PoReceiving — open PO list, receiving increments stock, partial tracking, full receive marks complete.

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// --- Hoist Supabase mock ---
const {
  mockFrom,
  mockPoItemsUpdate,
  mockRpc,
  mockMovementsInsert,
  mockPoUpdate,
  getState,
} = vi.hoisted(() => {
  // Mutable state containers
  const state = {
    posData: [
      {
        id: 'po-001',
        po_number: 'PO-2026-001',
        vendor: 'Ingram',
        status: 'ordered',
        expected_date: '2026-03-15',
      },
    ] as unknown[],
    itemsData: [
      {
        id: 'poi-aaa',
        purchase_order_id: 'po-001',
        hardware_catalog_id: 'cat-ingram',
        qty_ordered: 5,
        qty_received: 0,
        unit_cost: 300,
        hardware_catalog: { sku: 'SSD-4TB', name: 'SSD 4TB' },
      },
      {
        id: 'poi-bbb',
        purchase_order_id: 'po-001',
        hardware_catalog_id: 'cat-switch',
        qty_ordered: 2,
        qty_received: 0,
        unit_cost: 150,
        hardware_catalog: { sku: 'SW-8P', name: 'Switch 8-Port' },
      },
    ] as unknown[],
    // Data returned by allItems query after submit — partial by default
    allItemsData: [
      { qty_ordered: 5, qty_received: 3 },
      { qty_ordered: 2, qty_received: 0 },
    ] as unknown[],
  };

  const getState = () => state;

  // purchase_order_items update: .update({qty_received}).eq('id')
  const mockPoItemsUpdateEq = vi.fn().mockResolvedValue({ error: null });
  const mockPoItemsUpdate = vi.fn(() => ({ eq: mockPoItemsUpdateEq }));

  // inventory_movements insert
  const mockMovementsInsert = vi.fn().mockResolvedValue({ data: null, error: null });

  // purchase_orders update: .update({...}).eq('id')
  const mockPoUpdateEq = vi.fn().mockResolvedValue({ error: null });
  const mockPoUpdate = vi.fn(() => ({ eq: mockPoUpdateEq }));

  // RPC: increment_inventory
  const mockRpc = vi.fn().mockResolvedValue({ error: null });

  const mockFrom = vi.fn((table: string) => {
    if (table === 'purchase_orders') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({ data: state.posData }),
            })),
          })),
        })),
        update: mockPoUpdate,
      };
    }

    if (table === 'purchase_order_items') {
      return {
        select: vi.fn(() => ({
          // Used on initial load: .select(...).in('purchase_order_id', poIds)
          in: vi.fn().mockResolvedValue({ data: state.itemsData }),
          // Used after submit: .select('qty_ordered, qty_received').eq('purchase_order_id', id)
          eq: vi.fn().mockResolvedValue({ data: state.allItemsData }),
        })),
        update: mockPoItemsUpdate,
      };
    }

    if (table === 'inventory_movements') {
      return { insert: mockMovementsInsert };
    }

    return {};
  });

  return {
    mockFrom,
    mockPoItemsUpdate,
    mockRpc,
    mockMovementsInsert,
    mockPoUpdate,
    getState,
  };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
}));

import { PoReceiving } from '@/components/wizard/procurement/PoReceiving';

beforeEach(() => {
  vi.clearAllMocks();
  // Reset to defaults
  const s = getState();
  s.posData = [
    {
      id: 'po-001',
      po_number: 'PO-2026-001',
      vendor: 'Ingram',
      status: 'ordered',
      expected_date: '2026-03-15',
    },
  ];
  s.itemsData = [
    {
      id: 'poi-aaa',
      purchase_order_id: 'po-001',
      hardware_catalog_id: 'cat-ingram',
      qty_ordered: 5,
      qty_received: 0,
      unit_cost: 300,
      hardware_catalog: { sku: 'SSD-4TB', name: 'SSD 4TB' },
    },
    {
      id: 'poi-bbb',
      purchase_order_id: 'po-001',
      hardware_catalog_id: 'cat-switch',
      qty_ordered: 2,
      qty_received: 0,
      unit_cost: 150,
      hardware_catalog: { sku: 'SW-8P', name: 'Switch 8-Port' },
    },
  ];
  s.allItemsData = [
    { qty_ordered: 5, qty_received: 3 },
    { qty_ordered: 2, qty_received: 0 },
  ];
});

function renderReceiving(projectId = 'proj-abc') {
  return render(React.createElement(PoReceiving, { projectId }));
}

// 1. Loading state renders loading message
test('shows loading state while fetching open POs', () => {
  renderReceiving();
  expect(screen.getByText(/loading open purchase orders/i)).toBeInTheDocument();
});

// 2. Renders PO number and vendor in the dropdown after load
test('renders PO number and vendor in the selector', async () => {
  renderReceiving();
  await waitFor(() => {
    expect(screen.getByText(/PO-2026-001/)).toBeInTheDocument();
  });
  expect(screen.getByText(/Ingram/)).toBeInTheDocument();
});

// 3. Renders item rows with SKU, name, ordered qty
test('renders item rows with SKU and name', async () => {
  renderReceiving();
  await waitFor(() => expect(screen.getByText('SSD 4TB')).toBeInTheDocument());
  expect(screen.getByText('SSD-4TB')).toBeInTheDocument();
  expect(screen.getByText('Switch 8-Port')).toBeInTheDocument();
});

// 4. Partial receive: updates qty_received on purchase_order_items
test('partial receive calls update on purchase_order_items with incremented qty_received', async () => {
  renderReceiving();
  await waitFor(() => expect(screen.getByText('SSD 4TB')).toBeInTheDocument());

  const receiveNowInput = screen.getByLabelText(/receive now for SSD 4TB/i);
  fireEvent.change(receiveNowInput, { target: { value: '3' } });
  fireEvent.click(screen.getByRole('button', { name: /record receiving/i }));

  await waitFor(() => {
    expect(mockPoItemsUpdate).toHaveBeenCalled();
    const updatePayload = mockPoItemsUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(updatePayload.qty_received).toBe(3); // 0 + 3
  });
});

// 5. Partial receive calls increment_inventory RPC with correct delta
test('partial receive calls increment_inventory RPC with qty_received_now as delta', async () => {
  renderReceiving();
  await waitFor(() => expect(screen.getByText('SSD 4TB')).toBeInTheDocument());

  const receiveNowInput = screen.getByLabelText(/receive now for SSD 4TB/i);
  fireEvent.change(receiveNowInput, { target: { value: '3' } });
  fireEvent.click(screen.getByRole('button', { name: /record receiving/i }));

  await waitFor(() => {
    expect(mockRpc).toHaveBeenCalledWith('increment_inventory', {
      p_hardware_catalog_id: 'cat-ingram',
      p_delta: 3,
    });
  });
});

// 6. Partial receive sets PO status to 'partial' (not all items received)
test('partial receive sets PO status to partial', async () => {
  // allItemsData = [{ordered:5, received:3},{ordered:2, received:0}] → totalOrdered=7, totalReceived=3 → partial
  renderReceiving();
  await waitFor(() => expect(screen.getByText('SSD 4TB')).toBeInTheDocument());

  const receiveNowInput = screen.getByLabelText(/receive now for SSD 4TB/i);
  fireEvent.change(receiveNowInput, { target: { value: '3' } });
  fireEvent.click(screen.getByRole('button', { name: /record receiving/i }));

  await waitFor(() => {
    expect(mockPoUpdate).toHaveBeenCalled();
    const updatePayload = mockPoUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(updatePayload.status).toBe('partial');
  });
});

// 7. Full receive sets PO status to 'received'
test('full receive sets PO status to received', async () => {
  const s = getState();
  s.allItemsData = [
    { qty_ordered: 5, qty_received: 5 },
    { qty_ordered: 2, qty_received: 2 },
  ];

  renderReceiving();
  await waitFor(() => expect(screen.getByText('SSD 4TB')).toBeInTheDocument());

  const input1 = screen.getByLabelText(/receive now for SSD 4TB/i);
  fireEvent.change(input1, { target: { value: '5' } });

  fireEvent.click(screen.getByRole('button', { name: /record receiving/i }));

  await waitFor(() => {
    expect(mockPoUpdate).toHaveBeenCalled();
    const updatePayload = mockPoUpdate.mock.calls[0][0] as Record<string, unknown>;
    expect(updatePayload.status).toBe('received');
  });
});

// 8. Records inventory_movements with movement_type 'purchase_order_received'
test('records inventory_movements with type purchase_order_received and correct qty_delta', async () => {
  renderReceiving();
  await waitFor(() => expect(screen.getByText('SSD 4TB')).toBeInTheDocument());

  const receiveNowInput = screen.getByLabelText(/receive now for SSD 4TB/i);
  fireEvent.change(receiveNowInput, { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: /record receiving/i }));

  await waitFor(() => {
    expect(mockMovementsInsert).toHaveBeenCalled();
    const movement = mockMovementsInsert.mock.calls[0][0] as Record<string, unknown>;
    expect(movement.movement_type).toBe('purchase_order_received');
    expect(movement.hardware_catalog_id).toBe('cat-ingram');
    expect(movement.qty_delta).toBe(2);
  });
});

// 9. Shows error when no qty_received_now is entered (all zero)
test('shows error when submitting with no quantities entered', async () => {
  renderReceiving();
  await waitFor(() => expect(screen.getByText('SSD 4TB')).toBeInTheDocument());

  // Do not change any qty_received_now — all default to 0
  fireEvent.click(screen.getByRole('button', { name: /record receiving/i }));

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/enter a received quantity/i);
  });
});

// 10. Shows empty state when no open POs exist
test('shows empty state when there are no open POs', async () => {
  getState().posData = [];
  renderReceiving();
  await waitFor(() => {
    expect(screen.getByText(/no open purchase orders/i)).toBeInTheDocument();
  });
});
