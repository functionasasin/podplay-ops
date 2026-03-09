// Tests: BOM cost chain recalculation in BomReviewTable.
// Verifies that changing qty or unit cost recalculates total, landed cost,
// customer price, subtotal, and grand total using calculateCostChain.

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// BomReviewTable uses DEFAULT_SHIPPING_RATE=0.10 and DEFAULT_MARGIN=0.10, taxRate=0
// calculateCostChain formulas:
//   total       = unitCost * qty
//   landedCost  = total * 1.10   (total + 10% shipping, 0 tax)
//   customerPrice = landedCost * 1.10  (landed + 10% margin)

// Mock data: row-1 unit_cost=100 qty=2, row-2 unit_cost=50 qty=3
//   row-1 initial: total=200, landedCost=220, customerPrice=242
//   row-2 initial: total=150, landedCost=165, customerPrice=181.50
//   subtotal=350, grandTotal=423.50

const { mockFrom } = vi.hoisted(() => {
  const CATALOG = [
    { id: 'cat-1', sku: 'NW-SW-01', name: 'Network Switch', vendor: 'Netgear', vendor_url: null, unit_cost: 100 },
    { id: 'cat-2', sku: 'SSD-01', name: 'SSD 1TB', vendor: 'Samsung', vendor_url: null, unit_cost: 50 },
  ];

  const BOM_ROWS = [
    {
      id: 'row-1',
      hardware_catalog_id: 'cat-1',
      quantity: 2,
      unit_cost_override: 100,
      hardware_catalog: { sku: 'NW-SW-01', name: 'Network Switch', vendor: 'Netgear', vendor_url: null },
    },
    {
      id: 'row-2',
      hardware_catalog_id: 'cat-2',
      quantity: 3,
      unit_cost_override: 50,
      hardware_catalog: { sku: 'SSD-01', name: 'SSD 1TB', vendor: 'Samsung', vendor_url: null },
    },
  ];

  const mockBomOrder = vi.fn().mockResolvedValue({ data: BOM_ROWS });
  const mockBomEq = vi.fn(() => ({ order: mockBomOrder }));
  const mockBomSelect = vi.fn(() => ({ eq: mockBomEq }));

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
  return render(React.createElement(BomReviewTable, { projectId: 'proj-test' }));
}

// Helper to wait for table to load
async function waitForTable() {
  await waitFor(() => expect(screen.getAllByText('Network Switch')[0]).toBeInTheDocument());
}

// 1. Changing qty from 2 to 5 updates the row total to new qty x unit cost
test('changing qty from 2 to 5 updates total to 5 x unit_cost', async () => {
  renderTable();
  await waitForTable();

  // Initial total for row-1: 2 * 100 = 200.00
  expect(screen.getAllByText('$200.00')[0]).toBeInTheDocument();

  // spinbuttons: [row1-qty, row1-cost, row2-qty, row2-cost]
  const inputs = screen.getAllByRole('spinbutton');
  fireEvent.change(inputs[0], { target: { value: '5' } });

  // New total: 5 * 100 = 500.00
  expect(screen.getAllByText('$500.00')[0]).toBeInTheDocument();
  expect(screen.queryByText('$200.00')).not.toBeInTheDocument();
});

// 2. Landed cost is recalculated via calculateCostChain after qty change
test('landed cost recalculates after qty change', async () => {
  renderTable();
  await waitForTable();

  // Initial landed cost row-1: 200 * 1.10 = 220.00
  expect(screen.getAllByText('$220.00')[0]).toBeInTheDocument();

  const inputs = screen.getAllByRole('spinbutton');
  fireEvent.change(inputs[0], { target: { value: '5' } });

  // New landed cost: 500 * 1.10 = 550.00
  expect(screen.getAllByText('$550.00')[0]).toBeInTheDocument();
  expect(screen.queryByText('$220.00')).not.toBeInTheDocument();
});

// 3. Customer price is updated after cost chain recalculation
test('customer price updates after qty change', async () => {
  renderTable();
  await waitForTable();

  // Initial customer price row-1: 220 * 1.10 = 242.00
  expect(screen.getAllByText('$242.00')[0]).toBeInTheDocument();

  const inputs = screen.getAllByRole('spinbutton');
  fireEvent.change(inputs[0], { target: { value: '5' } });

  // New customer price: 550 * 1.10 = 605.00
  expect(screen.getAllByText('$605.00')[0]).toBeInTheDocument();
  expect(screen.queryByText('$242.00')).not.toBeInTheDocument();
});

// 4. Subtotal (sum of totals) updates when a line item changes
test('subtotal updates when qty changes', async () => {
  renderTable();
  await waitForTable();

  // Initial subtotal: row-1 total (200) + row-2 total (150) = 350.00
  expect(screen.getAllByText('$350.00')[0]).toBeInTheDocument();

  const inputs = screen.getAllByRole('spinbutton');
  fireEvent.change(inputs[0], { target: { value: '5' } });

  // New subtotal: 500 + 150 = 650.00
  expect(screen.getAllByText('$650.00')[0]).toBeInTheDocument();
  expect(screen.queryByText('$350.00')).not.toBeInTheDocument();
});

// 5. Grand total (sum of customer prices) updates when a line item changes
test('grand total updates when qty changes', async () => {
  renderTable();
  await waitForTable();

  // Initial grand total: row-1 customerPrice (242) + row-2 customerPrice (181.50) = 423.50
  expect(screen.getAllByText('$423.50')[0]).toBeInTheDocument();

  const inputs = screen.getAllByRole('spinbutton');
  fireEvent.change(inputs[0], { target: { value: '5' } });

  // New grand total: 605 + 181.50 = 786.50
  expect(screen.getAllByText('$786.50')[0]).toBeInTheDocument();
  expect(screen.queryByText('$423.50')).not.toBeInTheDocument();
});

// 6. Changing unit cost recalculates landed cost and customer price
test('changing unit cost recalculates landed cost and customer price', async () => {
  renderTable();
  await waitForTable();

  // row-2: qty=3, unit_cost=50 => total=150, landedCost=165, customerPrice=181.50
  expect(screen.getAllByText('$165.00')[0]).toBeInTheDocument();
  expect(screen.getAllByText('$181.50')[0]).toBeInTheDocument();

  // Change row-2 unit cost to 80: total=240, landedCost=264, customerPrice=290.40
  const inputs = screen.getAllByRole('spinbutton');
  fireEvent.change(inputs[3], { target: { value: '80' } });

  expect(screen.getAllByText('$264.00')[0]).toBeInTheDocument();
  expect(screen.getAllByText('$290.40')[0]).toBeInTheDocument();
  expect(screen.queryByText('$165.00')).not.toBeInTheDocument();
});
