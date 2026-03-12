// Tests: Financials route — tab rendering and tab switching.
// Verifies all 4 tab labels render, first tab (Invoicing) is active by default,
// and clicking each tab shows its content panel.

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

const PROJECT_ID = 'test-project-id';

// --- Hoist mock helpers ---
const { mockSingle, mockEq, mockSelect, mockFrom } = vi.hoisted(() => {
  const mockSingle = vi.fn().mockResolvedValue({
    data: { project_name: 'Test Project', customer_name: 'Test Customer' },
  });
  const mockEqInner = vi.fn().mockResolvedValue({ data: [], error: null });
  const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
  const mockEq = vi.fn(() => ({
    single: mockSingle,
    data: [],
    eq: mockEqInner,
    order: mockOrder,
  }));
  const mockSettingsSingle = vi.fn().mockResolvedValue({ data: { minimum_deposit: 500 }, error: null });
  const mockSelect = vi.fn(() => ({ eq: mockEq, single: mockSettingsSingle }));
  const mockFrom = vi.fn((table: string) => {
    if (table === 'settings') return { select: vi.fn(() => ({ single: mockSettingsSingle })) };
    return { select: mockSelect };
  });
  return { mockSingle, mockEq, mockSelect, mockFrom };
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

import { Route } from '@/routes/_auth/projects/$projectId/financials';

function getFinancialsPage(): React.ComponentType {
  return (Route as unknown as { component: React.ComponentType }).component;
}

function renderPage() {
  return render(React.createElement(getFinancialsPage()));
}

// 1. All 4 tab labels render
test('renders all 4 tab labels', () => {
  renderPage();
  expect(screen.getByRole('button', { name: /Invoicing/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Expenses/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /P&L Summary/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Go-Live/ })).toBeInTheDocument();
});

// 2. Invoicing content is visible by default (first tab selected)
test('Invoicing content is visible by default (first tab selected)', () => {
  renderPage();
  expect(screen.getByRole('heading', { name: 'Invoicing' })).toBeInTheDocument();
});

// 3. Clicking "Expenses" shows its content panel
test('clicking Expenses tab shows Expenses content', () => {
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: /Expenses/ }));
  expect(screen.getByRole('heading', { name: 'Expenses' })).toBeInTheDocument();
});

// 4. Clicking "P&L Summary" shows its content panel
test('clicking P&L Summary tab shows P&L Summary content', async () => {
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: /P&L Summary/ }));
  await waitFor(() => expect(screen.getByRole('heading', { name: 'P&L Summary' })).toBeInTheDocument());
});

// 5. Clicking "Go-Live" shows its content panel
test('clicking Go-Live tab shows Go-Live content', () => {
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: /Go-Live/ }));
  expect(screen.getByRole('heading', { name: 'Go-Live' })).toBeInTheDocument();
});

// 6. Project name appears after Supabase resolves
test('project name appears after data loads', async () => {
  renderPage();
  await waitFor(() => expect(screen.getByText(/Test Project/)).toBeInTheDocument());
});
