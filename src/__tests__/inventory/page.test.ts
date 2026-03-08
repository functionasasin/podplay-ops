// Tests: Inventory page — renders inside AppLayout, table rows, loading state.
// Mocks Supabase client (from→select→order chain) and TanStack Router.

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// --- Hoist mock helpers ---
const { mockFrom, mockSelect, mockOrder, resolvers } = vi.hoisted(() => {
  const resolvers: Array<
    (result: { data: unknown[] | null; error: { message: string } | null }) => void
  > = [];

  const mockOrder = vi.fn(
    () =>
      new Promise<{ data: unknown[] | null; error: { message: string } | null }>((resolve) => {
        resolvers.push(resolve);
      }),
  );
  const mockSelect = vi.fn(() => ({ order: mockOrder }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));

  return { mockFrom, mockSelect, mockOrder, resolvers };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => config,
  Link: ({
    to,
    children,
    className,
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
  }) => React.createElement('a', { href: to, className }, children),
  Outlet: () => null,
}));

vi.mock('@/lib/auth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', email: 'ops@podplay.com' },
    session: { access_token: 'tok' },
    loading: false,
    signOut: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
  })),
}));

import { AppLayout } from '@/components/layout/AppLayout';
import { Route } from '@/routes/_auth/inventory/index';

function getInventoryPage(): React.ComponentType {
  return (Route as unknown as { component: React.ComponentType }).component;
}

function resolveLatest(result: {
  data: unknown[] | null;
  error: { message: string } | null;
}) {
  const resolve = resolvers.pop();
  if (resolve) resolve(result);
}

const MOCK_ITEMS = [
  {
    id: 'inv-1',
    hardware_catalog_id: 'cat-1',
    qty_on_hand: 5,
    qty_allocated: 1,
    qty_available: 4,
    reorder_threshold: 2,
    notes: null,
    hardware_catalog: {
      sku: 'NW-SW-01',
      name: 'Network Switch 8-port',
      vendor: 'Cisco',
      category: 'network_rack',
      is_active: true,
    },
  },
  {
    id: 'inv-2',
    hardware_catalog_id: 'cat-2',
    qty_on_hand: 3,
    qty_allocated: 0,
    qty_available: 3,
    reorder_threshold: 0,
    notes: null,
    hardware_catalog: {
      sku: 'REPLAY-MM',
      name: 'Mac Mini 16GB',
      vendor: 'Apple',
      category: 'replay_system',
      is_active: true,
    },
  },
];

beforeEach(() => {
  mockFrom.mockClear();
  mockSelect.mockClear();
  mockOrder.mockClear();
  resolvers.length = 0;
  mockOrder.mockImplementation(
    () =>
      new Promise<{ data: unknown[] | null; error: { message: string } | null }>((resolve) => {
        resolvers.push(resolve);
      }),
  );
});

// 1. Page renders inside AppLayout — sidebar nav link to /inventory is present
test('renders inside AppLayout with nav link to /inventory', () => {
  const InventoryPage = getInventoryPage();
  render(
    React.createElement(
      'div',
      null,
      React.createElement(AppLayout, null),
      React.createElement(InventoryPage, null),
    ),
  );
  const link = document.querySelector('a[href="/inventory"]');
  expect(link).not.toBeNull();
  resolveLatest({ data: [], error: null });
});

// 2. Loading state renders while Supabase query is pending
test('shows loading spinner while query is pending', () => {
  const InventoryPage = getInventoryPage();
  render(React.createElement(InventoryPage));
  const spinner = document.querySelector('.animate-spin');
  expect(spinner).not.toBeNull();
  resolveLatest({ data: [], error: null });
});

// 3. Table shows inventory rows after data loads
test('renders inventory table rows from mock data', async () => {
  const InventoryPage = getInventoryPage();
  render(React.createElement(InventoryPage));
  resolveLatest({ data: MOCK_ITEMS, error: null });
  await waitFor(() => {
    expect(document.querySelector('.animate-spin')).toBeNull();
  });
  expect(screen.getByText('Network Switch 8-port')).toBeInTheDocument();
  expect(screen.getByText('Mac Mini 16GB')).toBeInTheDocument();
  // SKU + vendor appear together in one span: "NW-SW-01 · Cisco"
  expect(screen.getByText(/NW-SW-01/)).toBeInTheDocument();
  expect(screen.getByText(/REPLAY-MM/)).toBeInTheDocument();
});
