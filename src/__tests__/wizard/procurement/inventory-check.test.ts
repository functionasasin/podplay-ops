// Tests: InventoryCheckPanel — stock level display, low-stock flag, surplus indicator, delta column.
// Mocks a mix of sufficient, low-stock, and surplus inventory items.

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// --- Hoist Supabase mock (must define data inside hoisted to avoid TDZ) ---
const { mockFrom } = vi.hoisted(() => {
  const BOM_ITEMS = [
    { qty: 4, hardware_catalog: { id: 'cat-1', sku: 'NW-SW-01', name: 'Network Switch 8-port' } },
    { qty: 2, hardware_catalog: { id: 'cat-2', sku: 'SSD-01', name: 'SSD 1TB' } },
    { qty: 3, hardware_catalog: { id: 'cat-3', sku: 'CAM-01', name: 'IP Camera' } },
  ];

  // Inventory: cat-1 has plenty (surplus), cat-2 is low-stock, cat-3 is exact
  const INVENTORY = [
    { item_id: 'cat-1', quantity_on_hand: 10 }, // surplus: 10 - 4 = +6
    { item_id: 'cat-2', quantity_on_hand: 1 },  // low-stock: 1 - 2 = -1
    { item_id: 'cat-3', quantity_on_hand: 3 },  // exact: 3 - 3 = 0
  ];

  // BOM query chain: .from('project_bom_items').select(...).eq(...)
  const mockBomEq = vi.fn().mockResolvedValue({ data: BOM_ITEMS });
  const mockBomSelect = vi.fn(() => ({ eq: mockBomEq }));

  // Inventory query chain: .from('inventory').select(...).in(...)
  const mockInvIn = vi.fn().mockResolvedValue({ data: INVENTORY });
  const mockInvSelect = vi.fn(() => ({ in: mockInvIn }));

  const mockFrom = vi.fn((table: string) => {
    if (table === 'project_bom_items') return { select: mockBomSelect };
    if (table === 'inventory') return { select: mockInvSelect };
    return { select: vi.fn() };
  });

  return { mockFrom };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

import { InventoryCheckPanel } from '@/components/wizard/procurement/InventoryCheckPanel';

function renderPanel() {
  return render(React.createElement(InventoryCheckPanel, { projectId: 'proj-abc' }));
}

// 1. Renders item names for all 3 items
test('renders all 3 item names', async () => {
  renderPanel();
  await waitFor(() => {
    expect(screen.getByText('Network Switch 8-port')).toBeInTheDocument();
    expect(screen.getByText('SSD 1TB')).toBeInTheDocument();
    expect(screen.getByText('IP Camera')).toBeInTheDocument();
  });
});

// 2. Renders SKUs for all 3 items
test('renders SKU values for each item', async () => {
  renderPanel();
  await waitFor(() => {
    expect(screen.getByText('NW-SW-01')).toBeInTheDocument();
    expect(screen.getByText('SSD-01')).toBeInTheDocument();
    expect(screen.getByText('CAM-01')).toBeInTheDocument();
  });
});

// 3. Shows needed quantities
test('shows needed quantities for each item', async () => {
  renderPanel();
  await waitFor(() => {
    expect(screen.getByText('4')).toBeInTheDocument(); // cat-1 needed
    expect(screen.getByText('2')).toBeInTheDocument(); // cat-2 needed
    // cat-3: needed=3 and on_hand=3 both appear → use getAllByText
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(2);
  });
});

// 4. Shows on-hand quantities
test('shows on_hand quantities for each item', async () => {
  renderPanel();
  await waitFor(() => {
    expect(screen.getByText('10')).toBeInTheDocument(); // cat-1 on_hand (surplus)
    expect(screen.getByText('1')).toBeInTheDocument();  // cat-2 on_hand (low-stock)
    // cat-3 on_hand=3 is also the needed qty, shown in needed column
  });
});

// 5. Low-stock flag shown when on_hand < needed
test('shows low-stock warning icon when on_hand < needed', async () => {
  renderPanel();
  await waitFor(() => {
    // cat-2: on_hand=1, needed=2 → low stock
    const lowStockIcon = screen.getByLabelText('low stock');
    expect(lowStockIcon).toBeInTheDocument();
  });
});

// 6. Surplus indicator shown when on_hand > needed
test('shows surplus indicator when on_hand > needed', async () => {
  renderPanel();
  await waitFor(() => {
    // cat-1: on_hand=10, needed=4 → surplus
    const surplusIcon = screen.getByLabelText('surplus');
    expect(surplusIcon).toBeInTheDocument();
  });
});

// 7. Surplus delta value is positive
test('shows positive delta for surplus item', async () => {
  renderPanel();
  await waitFor(() => {
    // cat-1: delta = 10 - 4 = +6
    expect(screen.getByText('+6')).toBeInTheDocument();
  });
});

// 8. Low-stock delta value is negative
test('shows negative delta for low-stock item', async () => {
  renderPanel();
  await waitFor(() => {
    // cat-2: delta = 1 - 2 = -1
    expect(screen.getByText('-1')).toBeInTheDocument();
  });
});

// 9. Exact match shows zero delta
test('shows zero delta when on_hand equals needed', async () => {
  renderPanel();
  await waitFor(() => {
    // cat-3: delta = 3 - 3 = 0 → shown as neutral "0"
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});

// 10. Loading state is shown initially
test('shows loading state before data loads', () => {
  renderPanel();
  expect(screen.getByText(/loading inventory/i)).toBeInTheDocument();
});
