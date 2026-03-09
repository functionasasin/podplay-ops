// Tests: Procurement route — tab rendering and tab switching.
// Verifies all 6 tab labels render, first tab is active by default,
// and clicking each tab shows its content panel.

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

const PROJECT_ID = 'test-project-id';

// --- Hoist mock helpers ---
const { mockSingle, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn().mockResolvedValue({
    data: { project_name: 'Test Project', customer_name: 'Test Customer' },
  });
  const emptyResult = { data: [], error: null };
  const terminal = {
    single: mockSingle,
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: undefined as unknown,
  };
  // chainable: returns an object with all known chain methods + terminal resolvers
  const chain: Record<string, unknown> = {};
  const chainFn = vi.fn(() => chain);
  chain['select'] = chainFn;
  chain['eq'] = chainFn;
  chain['in'] = chainFn;
  chain['insert'] = chainFn;
  chain['update'] = chainFn;
  chain['order'] = vi.fn().mockResolvedValue(emptyResult);
  chain['single'] = terminal.single;
  chain['maybeSingle'] = terminal.maybeSingle;
  const mockFrom = vi.fn(() => chain);
  return { mockSingle, mockFrom };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => ({
    ...config,
    useParams: vi.fn(() => ({ projectId: PROJECT_ID })),
  }),
}));

import { Route } from '@/routes/_auth/projects/$projectId/procurement';

function getProcurementPage(): React.ComponentType {
  return (Route as unknown as { component: React.ComponentType }).component;
}

function renderPage() {
  return render(React.createElement(getProcurementPage()));
}

// 1. All 6 tab labels render
test('renders all 6 tab labels', () => {
  renderPage();
  expect(screen.getByRole('button', { name: 'BOM Review' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Inventory Check' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Purchase Orders' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Packing List' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'CC Terminals' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Replay Signs' })).toBeInTheDocument();
});

// 2. First tab (BOM Review) is selected by default — its content heading is visible
test('BOM Review content is visible by default (first tab selected)', () => {
  renderPage();
  expect(screen.getByRole('heading', { name: 'BOM Review' })).toBeInTheDocument();
});

// 3. Clicking "Inventory Check" shows its content panel
test('clicking Inventory Check tab shows Inventory Check content', () => {
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: 'Inventory Check' }));
  expect(screen.getByRole('heading', { name: 'Inventory Check' })).toBeInTheDocument();
});

// 4. Clicking "Purchase Orders" shows its content panel
test('clicking Purchase Orders tab shows Purchase Orders content', () => {
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: 'Purchase Orders' }));
  expect(screen.getByRole('heading', { name: 'Purchase Orders' })).toBeInTheDocument();
});

// 5. Clicking "Packing List" shows its content panel
test('clicking Packing List tab shows Packing List content', () => {
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: 'Packing List' }));
  expect(screen.getByRole('heading', { name: 'Packing List' })).toBeInTheDocument();
});

// 6. Clicking "CC Terminals" shows its content panel
test('clicking CC Terminals tab shows CC Terminals content', () => {
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: 'CC Terminals' }));
  expect(screen.getByRole('heading', { name: 'CC Terminals' })).toBeInTheDocument();
});

// 7. Clicking "Replay Signs" shows its content panel
test('clicking Replay Signs tab shows Replay Signs content', () => {
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: 'Replay Signs' }));
  expect(screen.getByRole('heading', { name: 'Replay Signs' })).toBeInTheDocument();
});

// 8. Project name appears after Supabase resolves
test('project name appears after data loads', async () => {
  renderPage();
  await waitFor(() => expect(screen.getByText(/Test Project/)).toBeInTheDocument());
});
