// Stage 128 — Tests: Financials Page
// Asserts all 3 sections render (Revenue Funnel, P&L Overview, HER Chart)
// and that a loading spinner appears while data is fetching.

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// ── Mock setup ──────────────────────────────────────────────────────────────

// tableDataMap is mutated in beforeEach to set per-test data.
const tableDataMap: Record<string, unknown[]> = {};

// Returns a thenable chain: any method can be the "last" awaited call.
// Plain functions (not vi.fn) to avoid mockReturnValue wiring issues.
function makeChain(tableName: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {};
  const getResult = () => ({ data: tableDataMap[tableName] ?? [], error: null });
  chain.select = () => chain;
  chain.neq = () => chain;
  chain.order = () => chain;
  chain.limit = () => chain;
  // Thenable — makes `await chain` resolve to the data
  chain.then = (
    onfulfilled: (v: unknown) => unknown,
    onrejected?: (e: unknown) => unknown,
  ) => Promise.resolve(getResult()).then(onfulfilled, onrejected);
  return chain;
}

// Pending chain that never resolves (for loading-state test).
function makePendingChain() {
  const pending: Promise<never> = new Promise(() => {});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {};
  chain.select = () => chain;
  chain.neq = () => chain;
  chain.order = () => chain;
  chain.limit = () => chain;
  chain.then = (
    onfulfilled: (v: unknown) => unknown,
    onrejected?: (e: unknown) => unknown,
  ) => pending.then(onfulfilled, onrejected);
  return chain;
}

const { mockFrom } = vi.hoisted(() => {
  const mockFrom = vi.fn();
  return { mockFrom };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => config,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) =>
    React.createElement('a', { href: to }, children),
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

// ── Import after mocks ──────────────────────────────────────────────────────

import { Route } from '@/routes/_auth/financials/index';

function getPage(): React.ComponentType {
  return (Route as unknown as { component: React.ComponentType }).component;
}

// ── Shared test data ────────────────────────────────────────────────────────

const MOCK_PROJECTS = [
  {
    id: 'p-1',
    customer_name: 'Ace Sports',
    venue_name: 'Ace Arena',
    tier: 'pro',
    project_status: 'deployment',
    revenue_stage: 'deposit_paid',
  },
  {
    id: 'p-2',
    customer_name: 'Blue Courts',
    venue_name: 'Blue Venue',
    tier: 'basic',
    project_status: 'procurement',
    revenue_stage: 'signed',
  },
];

const MOCK_INVOICES = [
  { total_amount: 10000, hardware_subtotal: 8000, service_fee: 2000, status: 'paid' },
  { total_amount: 5000, hardware_subtotal: 4000, service_fee: 1000, status: 'sent' },
];

const MOCK_EXPENSES = [{ amount: 1200 }, { amount: 800 }];

const MOCK_BOM_ITEMS = [{ quantity: 1, unit_cost_override: 6000 }, { quantity: 1, unit_cost_override: 2000 }];

const MOCK_SNAPSHOTS = [
  {
    period_year: 2026,
    period_month: 2,
    hardware_revenue: 18000,
    team_hardware_spend: 9000,
    her_ratio: 2.0,
  },
  {
    period_year: 2026,
    period_month: 1,
    hardware_revenue: 12000,
    team_hardware_spend: 8000,
    her_ratio: 1.5,
  },
];

function seedDefaults() {
  tableDataMap['projects'] = MOCK_PROJECTS;
  tableDataMap['invoices'] = MOCK_INVOICES;
  tableDataMap['expenses'] = MOCK_EXPENSES;
  tableDataMap['project_bom_items'] = MOCK_BOM_ITEMS;
  tableDataMap['monthly_opex_snapshots'] = MOCK_SNAPSHOTS;
}

beforeEach(() => {
  mockFrom.mockReset();
  seedDefaults();
  mockFrom.mockImplementation((table: string) => makeChain(table));
});

async function renderLoaded() {
  const Page = getPage();
  const result = render(React.createElement(Page));
  await waitFor(() => expect(document.querySelector('.animate-spin')).toBeNull());
  return result;
}

// ── Tests ───────────────────────────────────────────────────────────────────

// 1. Loading spinner shows while queries are pending
test('shows loading spinner while data is fetching', () => {
  mockFrom.mockImplementation(() => makePendingChain());
  const Page = getPage();
  render(React.createElement(Page));
  expect(document.querySelector('.animate-spin')).not.toBeNull();
});

// 2. Revenue Funnel section heading renders
test('renders Revenue Funnel section heading', async () => {
  await renderLoaded();
  expect(screen.getByText('Revenue Funnel')).toBeInTheDocument();
});

// 3. P&L Overview section heading renders
test('renders P&L Overview section heading', async () => {
  await renderLoaded();
  expect(screen.getByText('P&L Overview')).toBeInTheDocument();
});

// 4. HER Chart section heading renders
test('renders HER section heading', async () => {
  await renderLoaded();
  expect(screen.getByText(/HER.*Hardware Efficiency Ratio/)).toBeInTheDocument();
});

// 5. Revenue Funnel shows project count summary
test('Revenue Funnel shows project count summary', async () => {
  await renderLoaded();
  expect(screen.getByText(/2 projects/)).toBeInTheDocument();
});

// 6. Revenue Funnel groups by stage — shows stage labels from mock projects
test('Revenue Funnel shows revenue stage labels from mock projects', async () => {
  await renderLoaded();
  expect(screen.getByText('Deposit Paid')).toBeInTheDocument();
  expect(screen.getByText('Signed')).toBeInTheDocument();
});

// 7. P&L Overview shows Revenue card value (sum of all invoices)
test('P&L Overview shows total revenue from invoices', async () => {
  await renderLoaded();
  // totalRevenue = 10000 + 5000 = 15000
  expect(screen.getByText('$15,000.00')).toBeInTheDocument();
});

// 8. P&L Overview shows Gross Profit
test('P&L Overview shows gross profit', async () => {
  await renderLoaded();
  // grossProfit = 15000 - 8000 (COGS) - 2000 (expenses) = 5000
  expect(screen.getByText('$5,000.00')).toBeInTheDocument();
});

// 9. HER summary card renders with computed ratio
test('HER summary card displays computed ratio', async () => {
  await renderLoaded();
  // totalHwRevenue = 18000 + 12000 = 30000
  // totalHwSpend   =  9000 +  8000 = 17000
  // periodHer = 30000 / 17000 ≈ 1.76
  const ratioEl = document.querySelector('[data-testid="her-ratio"]');
  expect(ratioEl).not.toBeNull();
  expect(ratioEl?.textContent).toMatch(/1\.\d+/);
});

// 10. HER status badge renders inside summary card
test('HER status badge renders inside summary card', async () => {
  await renderLoaded();
  const badge = document.querySelector('[data-testid="her-status-badge"]');
  expect(badge).not.toBeNull();
});
