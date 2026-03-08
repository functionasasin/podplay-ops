// Tests: MovementHistory — sorted newest-first, all movement types, reference links.

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// --- Hoist mock helpers ---
const { mockFrom, mockSelect, mockEq, mockOrder, mockLimit, resolvers } = vi.hoisted(() => {
  const resolvers: Array<
    (result: { data: unknown[] | null; error: { message: string } | null }) => void
  > = [];

  const mockLimit = vi.fn(
    () =>
      new Promise<{ data: unknown[] | null; error: { message: string } | null }>((resolve) => {
        resolvers.push(resolve);
      }),
  );
  const mockOrder = vi.fn(() => ({ limit: mockLimit }));
  const mockEq = vi.fn(() => ({ order: mockOrder }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));

  return { mockFrom, mockSelect, mockEq, mockOrder, mockLimit, resolvers };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

import { MovementHistory, InventoryMovement } from '@/components/inventory/MovementHistory';

// Helper: build a movement with defaults
function makeMovement(overrides: Partial<InventoryMovement> = {}): InventoryMovement {
  return {
    id: 'mv-1',
    created_at: '2026-03-01T10:00:00Z',
    hardware_catalog_id: 'hc-1',
    project_id: null,
    movement_type: 'purchase_order_received',
    qty_delta: 5,
    reference: null,
    notes: null,
    project_venue_name: null,
    ...overrides,
  };
}

function mapToRaw(movement: InventoryMovement) {
  return {
    id: movement.id,
    created_at: movement.created_at,
    hardware_catalog_id: movement.hardware_catalog_id,
    project_id: movement.project_id,
    movement_type: movement.movement_type,
    qty_delta: movement.qty_delta,
    reference: movement.reference,
    notes: movement.notes,
    projects: movement.project_venue_name ? { venue_name: movement.project_venue_name } : null,
  };
}

function resolveWith(movements: InventoryMovement[]) {
  const resolve = resolvers.pop();
  if (resolve) resolve({ data: movements.map(mapToRaw), error: null });
}

beforeEach(() => {
  mockFrom.mockClear();
  mockSelect.mockClear();
  mockEq.mockClear();
  mockOrder.mockClear();
  mockLimit.mockClear();
  resolvers.length = 0;
  mockLimit.mockImplementation(
    () =>
      new Promise<{ data: unknown[] | null; error: { message: string } | null }>((resolve) => {
        resolvers.push(resolve);
      }),
  );
});

// 1. Loading state shown initially (before fetch resolves)
test('shows loading spinner on initial render', () => {
  const { container } = render(
    React.createElement(MovementHistory, { hardwareCatalogId: 'hc-1' }),
  );
  const spinner = container.querySelector('.animate-spin');
  expect(spinner).toBeTruthy();
  resolveWith([]);
});

// 2. Supabase is queried with ascending: false (newest-first ordering)
test('queries inventory_movements ordered by created_at descending', async () => {
  render(React.createElement(MovementHistory, { hardwareCatalogId: 'hc-abc' }));
  resolveWith([]);
  await waitFor(() => {
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
  });
});

// 3. Queried with correct hardware_catalog_id filter
test('filters by hardware_catalog_id', async () => {
  render(React.createElement(MovementHistory, { hardwareCatalogId: 'hc-xyz' }));
  resolveWith([]);
  await waitFor(() => {
    expect(mockEq).toHaveBeenCalledWith('hardware_catalog_id', 'hc-xyz');
  });
});

// 4–9. All six movement types render correct labels

test('renders "Received from PO" for purchase_order_received', async () => {
  render(React.createElement(MovementHistory, { hardwareCatalogId: 'hc-1' }));
  resolveWith([makeMovement({ movement_type: 'purchase_order_received', qty_delta: 10 })]);
  await screen.findByText('Received from PO');
});

test('renders "Allocated to project" for project_allocated', async () => {
  render(React.createElement(MovementHistory, { hardwareCatalogId: 'hc-1' }));
  resolveWith([makeMovement({ movement_type: 'project_allocated', qty_delta: -2 })]);
  await screen.findByText('Allocated to project');
});

test('renders "Shipped to venue" for project_shipped', async () => {
  render(React.createElement(MovementHistory, { hardwareCatalogId: 'hc-1' }));
  resolveWith([makeMovement({ movement_type: 'project_shipped', qty_delta: -3 })]);
  await screen.findByText('Shipped to venue');
});

test('renders "Manual increase" for adjustment_increase', async () => {
  render(React.createElement(MovementHistory, { hardwareCatalogId: 'hc-1' }));
  resolveWith([makeMovement({ movement_type: 'adjustment_increase', qty_delta: 4 })]);
  await screen.findByText('Manual increase');
});

test('renders "Manual decrease" for adjustment_decrease', async () => {
  render(React.createElement(MovementHistory, { hardwareCatalogId: 'hc-1' }));
  resolveWith([makeMovement({ movement_type: 'adjustment_decrease', qty_delta: -1 })]);
  await screen.findByText('Manual decrease');
});

test('renders "Returned to stock" for return', async () => {
  render(React.createElement(MovementHistory, { hardwareCatalogId: 'hc-1' }));
  resolveWith([makeMovement({ movement_type: 'return', qty_delta: 2 })]);
  await screen.findByText('Returned to stock');
});

// 10. Positive delta shows "+" prefix
test('positive qty_delta displays with + prefix', async () => {
  render(React.createElement(MovementHistory, { hardwareCatalogId: 'hc-1' }));
  resolveWith([makeMovement({ movement_type: 'purchase_order_received', qty_delta: 7 })]);
  await screen.findByText('+7');
});

// 11. Negative delta displayed as-is (no double minus)
test('negative qty_delta displays as negative number', async () => {
  render(React.createElement(MovementHistory, { hardwareCatalogId: 'hc-1' }));
  resolveWith([makeMovement({ movement_type: 'project_shipped', qty_delta: -3 })]);
  await screen.findByText('-3');
});

// 12. Reference field rendered when present
test('renders reference value when movement has a reference', async () => {
  render(React.createElement(MovementHistory, { hardwareCatalogId: 'hc-1' }));
  resolveWith([makeMovement({ reference: 'PO-2026-001' })]);
  await screen.findByText(/PO-2026-001/);
});

// 13. Project venue name rendered as link when project is set
test('renders project venue name as a link when project is associated', async () => {
  render(React.createElement(MovementHistory, { hardwareCatalogId: 'hc-1' }));
  resolveWith([
    makeMovement({
      movement_type: 'project_allocated',
      qty_delta: -2,
      project_id: 'proj-abc',
      project_venue_name: 'Downtown PingPod',
    }),
  ]);
  await screen.findByText(/Downtown PingPod/);
});

// 14. Project link href contains the project_id
test('project link href contains the project_id', async () => {
  render(React.createElement(MovementHistory, { hardwareCatalogId: 'hc-1' }));
  resolveWith([
    makeMovement({
      movement_type: 'project_shipped',
      qty_delta: -1,
      project_id: 'proj-xyz',
      project_venue_name: 'Uptown Court',
    }),
  ]);
  const link = await screen.findByRole('link', { name: /Uptown Court/ });
  expect(link.getAttribute('href')).toContain('proj-xyz');
});

// 15. Empty state message shown when there are no movements
test('shows "No movements recorded yet" when movements list is empty', async () => {
  render(React.createElement(MovementHistory, { hardwareCatalogId: 'hc-1' }));
  resolveWith([]);
  await screen.findByText(/no movements recorded yet/i);
});
