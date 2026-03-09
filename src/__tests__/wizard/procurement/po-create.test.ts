// Tests: PoCreateForm — vendor dropdown, item listing, PO insert, PO items insert, inventory movements.

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// --- Hoist Supabase mock ---
const { mockFrom, mockPoInsert, mockPoItemsInsert, mockMovementsInsert } = vi.hoisted(() => {
  // BOM: 2 vendors — "Ingram" (1 item, has shortfall) and "UniFi" (1 item, no shortfall)
  const BOM_ITEMS = [
    {
      quantity: 3,
      hardware_catalog: {
        id: 'cat-ingram',
        sku: 'SSD-4TB',
        name: 'SSD 4TB',
        vendor: 'Ingram',
        unit_cost: 300,
      },
    },
    {
      quantity: 2,
      hardware_catalog: {
        id: 'cat-unifi',
        sku: 'UAP-PRO',
        name: 'UniFi AP Pro',
        vendor: 'UniFi',
        unit_cost: 200,
      },
    },
  ];

  // Inventory: Ingram item has 1 on_hand (shortfall=2), UniFi item has 5 on_hand (surplus)
  const INVENTORY = [
    { item_id: 'cat-ingram', quantity_on_hand: 1 },
    { item_id: 'cat-unifi', quantity_on_hand: 5 },
  ];

  // BOM query: .from('project_bom_items').select(...).eq(...)
  const mockBomEq = vi.fn().mockResolvedValue({ data: BOM_ITEMS });
  const mockBomSelect = vi.fn(() => ({ eq: mockBomEq }));

  // Inventory query: .from('inventory').select(...).in(...)
  const mockInvIn = vi.fn().mockResolvedValue({ data: INVENTORY });
  const mockInvSelect = vi.fn(() => ({ in: mockInvIn }));

  // PO count query: .from('purchase_orders').select('id', {...}).ilike(...)
  const mockPoIlike = vi.fn().mockResolvedValue({ count: 0 });
  const mockPoCountSelect = vi.fn(() => ({ ilike: mockPoIlike }));

  // PO insert: .from('purchase_orders').insert({...}).select().single()
  const mockPoInsertSingle = vi.fn().mockResolvedValue({
    data: { id: 'po-new', po_number: 'PO-2026-001' },
    error: null,
  });
  const mockPoInsertSelectChain = vi.fn(() => ({ single: mockPoInsertSingle }));
  const mockPoInsert = vi.fn(() => ({ select: mockPoInsertSelectChain }));

  // purchase_order_items insert: .from('purchase_order_items').insert([...])
  const mockPoItemsInsert = vi.fn().mockResolvedValue({ error: null });

  // inventory_movements insert: .from('inventory_movements').insert([...])
  const mockMovementsInsert = vi.fn().mockResolvedValue({ data: null, error: null });

  const mockFrom = vi.fn((table: string) => {
    if (table === 'project_bom_items') return { select: mockBomSelect };
    if (table === 'inventory') return { select: mockInvSelect };
    if (table === 'purchase_orders')
      return { select: mockPoCountSelect, insert: mockPoInsert };
    if (table === 'purchase_order_items') return { insert: mockPoItemsInsert };
    if (table === 'inventory_movements') return { insert: mockMovementsInsert };
    return {};
  });

  return { mockFrom, mockPoInsert, mockPoItemsInsert, mockMovementsInsert };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

import { PoCreateForm } from '@/components/wizard/procurement/PoCreateForm';

beforeEach(() => {
  vi.clearAllMocks();
});

function renderForm() {
  return render(React.createElement(PoCreateForm, { projectId: 'proj-abc' }));
}

// 1. Vendor dropdown shows all unique vendors from BOM
test('vendor dropdown shows all unique vendors from BOM', async () => {
  renderForm();
  await waitFor(() => {
    const select = screen.getByLabelText(/vendor/i) as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toContain('Ingram');
    expect(options).toContain('UniFi');
  });
});

// 2. Default vendor is the first alphabetically (Ingram)
test('default selected vendor is the first alphabetically', async () => {
  renderForm();
  await waitFor(() => {
    const select = screen.getByLabelText(/vendor/i) as HTMLSelectElement;
    expect(select.value).toBe('Ingram');
  });
});

// 3. Items for the selected vendor are shown in the table
test('shows item name and SKU for the selected vendor', async () => {
  renderForm();
  await waitFor(() => {
    expect(screen.getByText('SSD 4TB')).toBeInTheDocument();
    expect(screen.getByText('SSD-4TB')).toBeInTheDocument();
  });
});

// 4. Item with shortfall is pre-selected (checkbox checked)
test('item with shortfall is pre-checked', async () => {
  renderForm();
  await waitFor(() => {
    const checkbox = screen.getByLabelText('Select SSD 4TB') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });
});

// 5. Submit inserts purchase_order with correct vendor, project_id, and status='pending'
test('submit inserts purchase_order with vendor, project_id, and status=pending', async () => {
  renderForm();
  await waitFor(() => expect(screen.getByText('SSD 4TB')).toBeInTheDocument());

  fireEvent.submit(screen.getByRole('button', { name: /create purchase order/i }).closest('form')!);

  await waitFor(() => {
    expect(mockPoInsert).toHaveBeenCalledOnce();
    const payload = mockPoInsert.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.vendor).toBe('Ingram');
    expect(payload.project_id).toBe('proj-abc');
    expect(payload.status).toBe('pending');
  });
});

// 6. Submit inserts purchase_order_items with correct hardware_catalog_id and qty_ordered
test('submit inserts purchase_order_items with correct catalog_id and qty', async () => {
  renderForm();
  await waitFor(() => expect(screen.getByText('SSD 4TB')).toBeInTheDocument());

  fireEvent.submit(screen.getByRole('button', { name: /create purchase order/i }).closest('form')!);

  await waitFor(() => {
    expect(mockPoItemsInsert).toHaveBeenCalledOnce();
    const items = mockPoItemsInsert.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(items).toHaveLength(1);
    expect(items[0].hardware_catalog_id).toBe('cat-ingram');
    // shortfall = 3 - 1 = 2 → qty_ordered pre-filled as 2
    expect(items[0].qty_ordered).toBe(2);
    expect(items[0].qty_received).toBe(0);
  });
});

// 7. Submit creates inventory_movements records
test('submit creates inventory_movements for ordered items', async () => {
  renderForm();
  await waitFor(() => expect(screen.getByText('SSD 4TB')).toBeInTheDocument());

  fireEvent.submit(screen.getByRole('button', { name: /create purchase order/i }).closest('form')!);

  await waitFor(() => {
    expect(mockMovementsInsert).toHaveBeenCalledOnce();
    const movements = mockMovementsInsert.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(movements).toHaveLength(1);
    expect(movements[0].hardware_catalog_id).toBe('cat-ingram');
    expect(movements[0].project_id).toBe('proj-abc');
  });
});

// 8. Shows error when all items are deselected before submit
test('shows error when no items are selected on submit', async () => {
  renderForm();
  await waitFor(() => expect(screen.getByText('SSD 4TB')).toBeInTheDocument());

  // Deselect the pre-checked item
  const checkbox = screen.getByLabelText('Select SSD 4TB');
  fireEvent.click(checkbox);

  fireEvent.submit(screen.getByRole('button', { name: /create purchase order/i }).closest('form')!);

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/select at least one item/i);
  });
});
