// Tests: Inventory on-order tracking — page columns, available formula, SetOnOrderModal.

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Hoisted mocks ─────────────────────────────────────────────────────────

const {
  mockFrom,
  mockSelect,
  mockOrder,
  mockUpdate,
  mockEq,
  resolvers,
} = vi.hoisted(() => {
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
  const mockEq = vi.fn();
  const mockUpdate = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));

  return { mockFrom, mockSelect, mockOrder, mockUpdate, mockEq, resolvers };
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

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// ─── Shared mock data ──────────────────────────────────────────────────────

const MOCK_ITEMS = [
  {
    id: 'inv-1',
    item_id: 'cat-1',
    quantity_on_hand: 10,
    quantity_allocated: 2,
    reorder_point: 3,
    qty_on_order: 5,
    order_status: 'ordered',
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
    item_id: 'cat-2',
    quantity_on_hand: 4,
    quantity_allocated: 0,
    reorder_point: 0,
    qty_on_order: 0,
    order_status: 'not_ordered',
    hardware_catalog: {
      sku: 'REPLAY-MM',
      name: 'Mac Mini 16GB',
      vendor: 'Apple',
      category: 'replay_system',
      is_active: true,
    },
  },
];

// ─── Part 1: Inventory page — on-order columns ────────────────────────────

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

describe('Inventory page — on-order columns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolvers.length = 0;
    mockSelect.mockReturnValue({ order: mockOrder });
    mockOrder.mockImplementation(
      () =>
        new Promise<{ data: unknown[] | null; error: { message: string } | null }>((resolve) => {
          resolvers.push(resolve);
        }),
    );
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it('OO-01: renders "On Order" column header', async () => {
    const InventoryPage = getInventoryPage();
    render(React.createElement(InventoryPage));
    resolveLatest({ data: MOCK_ITEMS, error: null });
    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeNull());
    expect(screen.getByText('On Order')).toBeInTheDocument();
  });

  it('OO-02: renders "Status" column header', async () => {
    const InventoryPage = getInventoryPage();
    render(React.createElement(InventoryPage));
    resolveLatest({ data: MOCK_ITEMS, error: null });
    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeNull());
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('OO-03: shows qty_on_order value when greater than zero', async () => {
    const InventoryPage = getInventoryPage();
    render(React.createElement(InventoryPage));
    resolveLatest({ data: MOCK_ITEMS, error: null });
    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeNull());
    // Network Switch has qty_on_order=5 → should display "5"
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('OO-04: shows "—" in On Order column when qty_on_order is zero', async () => {
    const InventoryPage = getInventoryPage();
    render(React.createElement(InventoryPage));
    resolveLatest({ data: [MOCK_ITEMS[1]], error: null });
    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeNull());
    // Mac Mini has qty_on_order=0 → display dash
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('OO-05: order status badge shows human-readable label "Ordered"', async () => {
    const InventoryPage = getInventoryPage();
    render(React.createElement(InventoryPage));
    resolveLatest({ data: [MOCK_ITEMS[0]], error: null });
    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeNull());
    // order_status='ordered' → label 'Ordered'
    expect(screen.getByText('Ordered')).toBeInTheDocument();
  });

  it('OO-06: order status badge shows "Not Ordered" for not_ordered', async () => {
    const InventoryPage = getInventoryPage();
    render(React.createElement(InventoryPage));
    resolveLatest({ data: [MOCK_ITEMS[1]], error: null });
    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeNull());
    expect(screen.getByText('Not Ordered')).toBeInTheDocument();
  });

  it('OO-07: available = on_hand - allocated + on_order (projected formula)', async () => {
    const InventoryPage = getInventoryPage();
    render(React.createElement(InventoryPage));
    // Network Switch: 10 - 2 + 5 = 13
    resolveLatest({ data: [MOCK_ITEMS[0]], error: null });
    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeNull());
    expect(screen.getByText('13')).toBeInTheDocument();
  });

  it('OO-08: available = on_hand - allocated when on_order is zero', async () => {
    const InventoryPage = getInventoryPage();
    render(React.createElement(InventoryPage));
    // Use on_hand=7, allocated=3, on_order=0 → available=4 (≠ on_hand, so "4" is unique)
    const item = { ...MOCK_ITEMS[1], quantity_on_hand: 7, quantity_allocated: 3 };
    resolveLatest({ data: [item], error: null });
    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeNull());
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('OO-09: "Set On-Order" button renders for each inventory row', async () => {
    const InventoryPage = getInventoryPage();
    render(React.createElement(InventoryPage));
    resolveLatest({ data: MOCK_ITEMS, error: null });
    await waitFor(() => expect(document.querySelector('.animate-spin')).toBeNull());
    const buttons = screen.getAllByRole('button', { name: 'Set On-Order' });
    expect(buttons).toHaveLength(MOCK_ITEMS.length);
  });
});

// ─── Part 2: SetOnOrderModal ───────────────────────────────────────────────

import { SetOnOrderModal } from '@/components/inventory/SetOnOrderModal';

const DEFAULT_MODAL_PROPS = {
  itemId: 'cat-1',
  itemName: 'Network Switch 8-port',
  currentOnOrder: 3,
  isOpen: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
};

function renderModal(overrides: Partial<typeof DEFAULT_MODAL_PROPS> = {}) {
  const props = {
    ...DEFAULT_MODAL_PROPS,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    ...overrides,
  };
  render(<SetOnOrderModal {...props} />);
  return props;
}

describe('SetOnOrderModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockResolvedValue({ error: null });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockFrom.mockImplementation(() => ({ update: mockUpdate }));
  });

  it('OOM-01: renders dialog title with item name', () => {
    renderModal();
    expect(screen.getByText(/Set On-Order: Network Switch 8-port/)).toBeInTheDocument();
  });

  it('OOM-02: shows current on-order quantity as read-only', () => {
    renderModal({ currentOnOrder: 3 });
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Current On-Order')).toBeInTheDocument();
  });

  it('OOM-03: input defaults to currentOnOrder value', () => {
    renderModal({ currentOnOrder: 7 });
    const input = screen.getByLabelText('New On-Order Quantity') as HTMLInputElement;
    expect(input.value).toBe('7');
  });

  it('OOM-04: shows validation error when negative qty is submitted', async () => {
    renderModal();
    const input = screen.getByLabelText('New On-Order Quantity');
    fireEvent.change(input, { target: { value: '-1' } });
    const form = document.querySelector('form')!;
    fireEvent.submit(form);
    await waitFor(() =>
      expect(screen.getByText('Quantity cannot be negative.')).toBeInTheDocument(),
    );
  });

  it('OOM-05: submit calls update with qty and "ordered" status when qty > 0', async () => {
    const props = renderModal({ currentOnOrder: 0 });
    const input = screen.getByLabelText('New On-Order Quantity');
    fireEvent.change(input, { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('inventory');
      expect(mockUpdate).toHaveBeenCalledWith({ qty_on_order: 10, order_status: 'ordered' });
      expect(mockEq).toHaveBeenCalledWith('item_id', props.itemId);
    });
  });

  it('OOM-06: submit calls update with qty=0 and "not_ordered" status when qty is 0', async () => {
    const props = renderModal({ currentOnOrder: 5 });
    const input = screen.getByLabelText('New On-Order Quantity');
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ qty_on_order: 0, order_status: 'not_ordered' });
      expect(mockEq).toHaveBeenCalledWith('item_id', props.itemId);
    });
  });

  it('OOM-07: onSuccess is called after successful submit', async () => {
    const props = renderModal();
    const input = screen.getByLabelText('New On-Order Quantity');
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(props.onSuccess).toHaveBeenCalledTimes(1));
  });

  it('OOM-08: cancel button calls onClose without submitting', () => {
    const props = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
