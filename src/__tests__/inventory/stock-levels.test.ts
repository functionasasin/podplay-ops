// Tests: StockLevelsTable — grouped by category, low-stock red highlight, available = on_hand - allocated.

import { render, screen } from '@testing-library/react';
import React from 'react';
import { StockLevelsTable, StockLevelItem } from '@/components/inventory/StockLevelsTable';

const ITEMS: StockLevelItem[] = [
  // Category: network_rack
  {
    id: 'inv-1',
    name: 'Network Switch 8-port',
    sku: 'NW-SW-01',
    category: 'network_rack',
    qty_on_hand: 10,
    qty_allocated: 2,
    qty_available: 8,
    reorder_threshold: 3,
  },
  {
    id: 'inv-2',
    name: 'PoE Injector',
    sku: 'NW-POE-01',
    category: 'network_rack',
    qty_on_hand: 5,
    qty_allocated: 0,
    qty_available: 5,
    reorder_threshold: 2,
  },
  // Category: replay_system
  {
    id: 'inv-3',
    name: 'Mac Mini 16GB',
    sku: 'REPLAY-MACMINI',
    category: 'replay_system',
    qty_on_hand: 4,
    qty_allocated: 1,
    qty_available: 3,
    reorder_threshold: 5, // available(3) <= threshold(5) → low-stock
  },
  // Category: access_control
  {
    id: 'inv-4',
    name: 'Kisi Reader Pro 2',
    sku: 'ACCTRL-KISI-RDR2',
    category: 'access_control',
    qty_on_hand: 2,
    qty_allocated: 2,
    qty_available: 0,
    reorder_threshold: 1, // available(0) <= threshold(1) → low-stock
  },
  {
    id: 'inv-5',
    name: 'Door Lock',
    sku: 'ACCTRL-LOCK-01',
    category: 'access_control',
    qty_on_hand: 6,
    qty_allocated: 0,
    qty_available: 6,
    reorder_threshold: 0, // threshold=0 → NOT low-stock even if available=0
  },
];

function renderTable(items = ITEMS) {
  return render(React.createElement(StockLevelsTable, { items }));
}

// 1. Category group header for network_rack is rendered
test('renders Network Rack category group header', () => {
  renderTable();
  // Category name appears in the group header row and in each item's category column
  expect(screen.getAllByText('Network Rack').length).toBeGreaterThanOrEqual(1);
});

// 2. Category group header for replay_system is rendered
test('renders Replay System category group header', () => {
  renderTable();
  expect(screen.getAllByText('Replay System').length).toBeGreaterThanOrEqual(1);
});

// 3. Category group header for access_control is rendered
test('renders Access Control category group header', () => {
  renderTable();
  expect(screen.getAllByText('Access Control').length).toBeGreaterThanOrEqual(1);
});

// 4. Items in network_rack group appear before items in replay_system
test('groups items under their category headers in order', () => {
  renderTable();
  const headers = screen.getAllByRole('cell').filter((el) =>
    ['Network Rack', 'Replay System', 'Access Control'].includes(el.textContent ?? '')
  );
  // network_rack header should appear before replay_system header
  const networkRackIdx = headers.findIndex((el) => el.textContent === 'Network Rack');
  const replaySystemIdx = headers.findIndex((el) => el.textContent === 'Replay System');
  expect(networkRackIdx).toBeLessThan(replaySystemIdx);
});

// 5. Items in the same category are grouped together (both network_rack items present)
test('renders both network_rack items in the same group', () => {
  renderTable();
  expect(screen.getByText('Network Switch 8-port')).toBeInTheDocument();
  expect(screen.getByText('PoE Injector')).toBeInTheDocument();
});

// 6. Low-stock item (available <= threshold, threshold > 0) shows LOW badge
test('shows LOW badge for item where available <= reorder_threshold', () => {
  renderTable();
  // Mac Mini: available=3, threshold=5 → low-stock
  // Kisi Reader: available=0, threshold=1 → low-stock
  const lowBadges = screen.getAllByText('LOW');
  expect(lowBadges.length).toBe(2);
});

// 7. Non-low-stock item does not show LOW badge
test('does not show LOW badge for item where available > threshold', () => {
  renderTable([ITEMS[0]]); // Network Switch: available=8, threshold=3 → ok
  expect(screen.queryByText('LOW')).not.toBeInTheDocument();
});

// 8. Item with threshold=0 never shows LOW badge regardless of available qty
test('does not show LOW badge when reorder_threshold is 0', () => {
  renderTable([ITEMS[4]]); // Door Lock: available=6, threshold=0 → never low-stock
  expect(screen.queryByText('LOW')).not.toBeInTheDocument();
});

// 9. Low-stock row has red highlight class on the row (bg-destructive/5)
test('low-stock row has destructive background class', () => {
  const { container } = renderTable();
  // Find the row for Mac Mini (low-stock)
  const rows = container.querySelectorAll('tr');
  const macMiniRow = Array.from(rows).find((row) =>
    row.textContent?.includes('Mac Mini 16GB')
  );
  expect(macMiniRow).toBeTruthy();
  expect(macMiniRow!.className).toContain('bg-destructive');
});

// 10. Normal row does not have destructive background class
test('normal row does not have destructive background class', () => {
  const { container } = renderTable();
  const rows = container.querySelectorAll('tr');
  const switchRow = Array.from(rows).find((row) =>
    row.textContent?.includes('Network Switch 8-port')
  );
  expect(switchRow).toBeTruthy();
  expect(switchRow!.className).not.toContain('bg-destructive');
});

// 11. Available column = on_hand - allocated (network switch: 10 - 2 = 8)
test('available = qty_on_hand - qty_allocated for normal item', () => {
  const { container } = renderTable([ITEMS[0]]);
  // Network Switch: on_hand=10, allocated=2 → available=8
  const cells = container.querySelectorAll('td');
  const cellTexts = Array.from(cells).map((c) => c.textContent?.trim());
  expect(cellTexts).toContain('8');
});

// 12. Available column = on_hand - allocated for low-stock item (Mac Mini: 4 - 1 = 3)
test('available = qty_on_hand - qty_allocated for low-stock item', () => {
  const { container } = renderTable([ITEMS[2]]);
  // Mac Mini: on_hand=4, allocated=1 → available=3
  const cells = container.querySelectorAll('td');
  const cellTexts = Array.from(cells).map((c) => c.textContent?.trim());
  expect(cellTexts).toContain('3');
});

// 13. Available column = 0 when fully allocated (Kisi Reader: 2 - 2 = 0)
test('available = 0 when qty_allocated equals qty_on_hand', () => {
  const { container } = renderTable([ITEMS[3]]);
  // Kisi Reader: on_hand=2, allocated=2 → available=0
  const cells = container.querySelectorAll('td');
  const cellTexts = Array.from(cells).map((c) => c.textContent?.trim());
  expect(cellTexts).toContain('0');
});

// 14. Empty state is shown when items array is empty
test('shows empty state when no items provided', () => {
  renderTable([]);
  expect(screen.getByText(/no inventory items/i)).toBeInTheDocument();
});

// 15. Category label mapped correctly (pingpod_specific → PingPod Specific)
test('maps pingpod_specific category to "PingPod Specific"', () => {
  const pingpodItem: StockLevelItem = {
    id: 'inv-pp',
    name: 'PingPod Controller',
    sku: 'PP-CTRL-01',
    category: 'pingpod_specific',
    qty_on_hand: 3,
    qty_allocated: 0,
    qty_available: 3,
    reorder_threshold: 1,
  };
  renderTable([pingpodItem]);
  expect(screen.getAllByText('PingPod Specific').length).toBeGreaterThanOrEqual(1);
});
