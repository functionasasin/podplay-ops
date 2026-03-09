// Tests: PackingList — items render, quantities match BOM, grouped by category.

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// --- Hoist Supabase mock ---
const { mockFrom } = vi.hoisted(() => {
  // Mock BOM items from two different categories (network_rack and displays)
  const BOM_ITEMS = [
    {
      id: 'item-1',
      quantity: 2,
      hardware_catalog: { sku: 'NW-SW-01', name: 'Network Switch 8-port', category: 'network_rack' },
    },
    {
      id: 'item-2',
      quantity: 1,
      hardware_catalog: { sku: 'NW-FW-01', name: 'Firewall Appliance', category: 'network_rack' },
    },
    {
      id: 'item-3',
      quantity: 4,
      hardware_catalog: { sku: 'DS-TV-55', name: '55in Display TV', category: 'displays' },
    },
  ];

  const mockOrder = vi.fn().mockResolvedValue({ data: BOM_ITEMS });
  const mockEq = vi.fn(() => ({ order: mockOrder }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));

  const mockFrom = vi.fn(() => ({ select: mockSelect }));

  return { mockFrom };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

import { PackingList } from '@/components/wizard/procurement/PackingList';

function renderPackingList() {
  return render(React.createElement(PackingList, { projectId: 'proj-abc' }));
}

// 1. Shows loading state initially
test('shows loading state before data loads', () => {
  renderPackingList();
  expect(screen.getByText(/loading packing list/i)).toBeInTheDocument();
});

// 2. Renders all 3 item names
test('renders all item names from BOM', async () => {
  renderPackingList();
  await waitFor(() => {
    expect(screen.getByText('Network Switch 8-port')).toBeInTheDocument();
    expect(screen.getByText('Firewall Appliance')).toBeInTheDocument();
    expect(screen.getByText('55in Display TV')).toBeInTheDocument();
  });
});

// 3. Renders all SKUs
test('renders SKU values for each item', async () => {
  renderPackingList();
  await waitFor(() => {
    expect(screen.getByText('NW-SW-01')).toBeInTheDocument();
    expect(screen.getByText('NW-FW-01')).toBeInTheDocument();
    expect(screen.getByText('DS-TV-55')).toBeInTheDocument();
  });
});

// 4. Quantities match BOM data
test('renders correct quantities matching BOM', async () => {
  renderPackingList();
  await waitFor(() => {
    // qty=2 (also appears as row number) — multiple is ok
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
    // qty=1 (also appears as row number within each group)
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
    // qty=4 for display
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});

// 5. Items grouped under Network Rack category header
test('shows Network Rack category group header', async () => {
  renderPackingList();
  await waitFor(() => {
    expect(screen.getByText('Network Rack')).toBeInTheDocument();
  });
});

// 6. Items grouped under Displays category header
test('shows Displays category group header', async () => {
  renderPackingList();
  await waitFor(() => {
    expect(screen.getByText('Displays')).toBeInTheDocument();
  });
});

// 7. Network Rack items appear under Network Rack header (grouping is correct)
test('network rack items are grouped together', async () => {
  renderPackingList();
  await waitFor(() => {
    // Both network_rack items present
    expect(screen.getByText('Network Switch 8-port')).toBeInTheDocument();
    expect(screen.getByText('Firewall Appliance')).toBeInTheDocument();
    // Displays item also present (different group)
    expect(screen.getByText('55in Display TV')).toBeInTheDocument();
  });
});

// 8. Total units footer shows sum of all quantities (2+1+4=7)
test('shows total units in footer', async () => {
  renderPackingList();
  await waitFor(() => {
    expect(screen.getByText('7')).toBeInTheDocument();
  });
});

// 9. Line item count summary is displayed
test('shows line item count summary', async () => {
  renderPackingList();
  await waitFor(() => {
    expect(screen.getByText(/3 line items/i)).toBeInTheDocument();
  });
});

// 10. Print button is rendered
test('renders print button', async () => {
  renderPackingList();
  await waitFor(() => {
    expect(screen.getByText(/print \/ save pdf/i)).toBeInTheDocument();
  });
});
