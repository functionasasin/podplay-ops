// Tests: BomReviewTable — inline editing, cost override, and SKU swap.
// Verifies table renders all items, qty changes update totals,
// cost overrides recalculate totals, and SKU swaps update item fields.

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// --- Hoist Supabase mock (must define data inside hoisted to avoid TDZ) ---
const { mockFrom } = vi.hoisted(() => {
  const CATALOG = [
    { id: 'cat-1', sku: 'NW-SW-01', name: 'Network Switch 8-port', vendor: 'Netgear', vendor_url: null, unit_cost: 149.99 },
    { id: 'cat-2', sku: 'NW-SW-02', name: 'Network Switch 16-port', vendor: 'Netgear', vendor_url: null, unit_cost: 249.99 },
    { id: 'cat-3', sku: 'SSD-01', name: 'SSD 1TB', vendor: 'Samsung', vendor_url: 'https://samsung.com', unit_cost: 89.99 },
  ];

  const BOM_ROWS = [
    {
      id: 'row-1',
      hardware_catalog_id: 'cat-1',
      qty: 2,
      unit_cost: 149.99,
      hardware_catalog: { sku: 'NW-SW-01', name: 'Network Switch 8-port', vendor: 'Netgear', vendor_url: null },
    },
    {
      id: 'row-2',
      hardware_catalog_id: 'cat-3',
      qty: 1,
      unit_cost: 89.99,
      hardware_catalog: { sku: 'SSD-01', name: 'SSD 1TB', vendor: 'Samsung', vendor_url: 'https://samsung.com' },
    },
    {
      id: 'row-3',
      hardware_catalog_id: 'cat-2',
      qty: 4,
      unit_cost: 249.99,
      hardware_catalog: { sku: 'NW-SW-02', name: 'Network Switch 16-port', vendor: 'Netgear', vendor_url: null },
    },
  ];

  // BOM query chain: .from('project_bom_items').select(...).eq(...).order(...)
  const mockBomOrder = vi.fn().mockResolvedValue({ data: BOM_ROWS });
  const mockBomEq = vi.fn(() => ({ order: mockBomOrder }));
  const mockBomSelect = vi.fn(() => ({ eq: mockBomEq }));

  // Catalog query chain: .from('hardware_catalog').select(...).eq(...).order(...)
  const mockCatalogOrder = vi.fn().mockResolvedValue({ data: CATALOG });
  const mockCatalogEq = vi.fn(() => ({ order: mockCatalogOrder }));
  const mockCatalogSelect = vi.fn(() => ({ eq: mockCatalogEq }));

  const mockFrom = vi.fn((table: string) => {
    if (table === 'project_bom_items') return { select: mockBomSelect };
    if (table === 'hardware_catalog') return { select: mockCatalogSelect };
    return { select: vi.fn() };
  });

  return { mockFrom };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

import { BomReviewTable } from '@/components/wizard/procurement/BomReviewTable';

function renderTable() {
  return render(React.createElement(BomReviewTable, { projectId: 'proj-abc' }));
}

// 1. Table renders all 3 mocked items
test('renders all 3 BOM items by name', async () => {
  renderTable();
  await waitFor(() => {
    expect(screen.getByText('Network Switch 8-port')).toBeInTheDocument();
    expect(screen.getByText('SSD 1TB')).toBeInTheDocument();
    expect(screen.getByText('Network Switch 16-port')).toBeInTheDocument();
  });
});

// 2. SKUs appear in the table
test('renders SKU values for each row', async () => {
  renderTable();
  await waitFor(() => {
    expect(screen.getByText('NW-SW-01')).toBeInTheDocument();
    expect(screen.getByText('SSD-01')).toBeInTheDocument();
    expect(screen.getByText('NW-SW-02')).toBeInTheDocument();
  });
});

// 3. Vendor names appear
test('renders vendor for each row', async () => {
  renderTable();
  await waitFor(() => {
    const netgear = screen.getAllByText('Netgear');
    expect(netgear.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Samsung')).toBeInTheDocument();
  });
});

// 4. Initial totals are correct (qty x unit_cost)
test('renders correct initial total for each row', async () => {
  renderTable();
  await waitFor(() => {
    // row-1: 2 * 149.99 = 299.98
    expect(screen.getByText('$299.98')).toBeInTheDocument();
    // row-2: 1 * 89.99 = 89.99
    expect(screen.getByText('$89.99')).toBeInTheDocument();
    // row-3: 4 * 249.99 = 999.96
    expect(screen.getByText('$999.96')).toBeInTheDocument();
  });
});

// 5. Changing qty updates the row total
test('changing qty recalculates the row total', async () => {
  renderTable();
  await waitFor(() => expect(screen.getByText('$299.98')).toBeInTheDocument());

  // row-1 qty input: currently 2, change to 5 => 5 * 149.99 = 749.95
  // spinbuttons are interleaved: [row1-qty, row1-cost, row2-qty, row2-cost, row3-qty, row3-cost]
  const inputs = screen.getAllByRole('spinbutton');
  fireEvent.change(inputs[0], { target: { value: '5' } });

  expect(screen.getByText('$749.95')).toBeInTheDocument();
  expect(screen.queryByText('$299.98')).not.toBeInTheDocument();
});

// 6. Cost override recalculates row total
test('changing unit cost recalculates the row total', async () => {
  renderTable();
  await waitFor(() => expect(screen.getByText('$89.99')).toBeInTheDocument());

  // row-2 unit_cost: currently 89.99, change to 100 => 1 * 100 = 100.00
  // unit cost for row-2 is at index 3 (row1qty=0, row1cost=1, row2qty=2, row2cost=3)
  const inputs = screen.getAllByRole('spinbutton');
  fireEvent.change(inputs[3], { target: { value: '100' } });

  expect(screen.getByText('$100.00')).toBeInTheDocument();
  expect(screen.queryByText('$89.99')).not.toBeInTheDocument();
});

// 7. SKU swap updates item name, vendor, and unit cost
test('swapping SKU updates item name, vendor, and unit cost', async () => {
  renderTable();
  await waitFor(() => expect(screen.getByText('Network Switch 8-port')).toBeInTheDocument());

  // row-1 currently shows 'Network Switch 8-port' (cat-1)
  // Swap to cat-3 (SSD-01, Samsung, $89.99), qty stays 2 => total = 2 * 89.99 = 179.98
  const swapSelects = screen.getAllByRole('combobox');
  fireEvent.change(swapSelects[0], { target: { value: 'cat-3' } });

  // row-1 name should now be 'SSD 1TB'
  const ssdItems = screen.getAllByText('SSD 1TB');
  expect(ssdItems.length).toBeGreaterThanOrEqual(1);

  // Vendor for row-1 should now be Samsung (2 rows now have Samsung)
  const samsungCells = screen.getAllByText('Samsung');
  expect(samsungCells.length).toBeGreaterThanOrEqual(2);

  // Total for row-1: 2 * 89.99 = 179.98
  expect(screen.getByText('$179.98')).toBeInTheDocument();

  // Old name should be gone
  expect(screen.queryByText('Network Switch 8-port')).not.toBeInTheDocument();
});
