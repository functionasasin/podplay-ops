// Tests: Dashboard route query behaviour
// Mocks Supabase client and TanStack Router so no real network calls are made

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// --- Hoist mock helpers so vi.mock factory can reference them ---
const { mockFrom, mockSelect, resolvers } = vi.hoisted(() => {
  const resolvers: Array<
    (result: { data: unknown[] | null; error: { message: string } | null }) => void
  > = [];

  const mockSelect = vi.fn(
    () =>
      new Promise<{ data: unknown[] | null; error: { message: string } | null }>((resolve) => {
        resolvers.push(resolve);
      }),
  );
  const mockFrom = vi.fn(() => ({ select: mockSelect }));

  return { mockFrom, mockSelect, resolvers };
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

import { ProjectsPage } from '@/routes/_auth/projects/index';

function resolveLatest(result: { data: unknown[] | null; error: { message: string } | null }) {
  const resolve = resolvers.pop();
  if (resolve) resolve(result);
}

function renderPage() {
  return render(React.createElement(ProjectsPage));
}

beforeEach(() => {
  mockFrom.mockClear();
  mockSelect.mockClear();
  resolvers.length = 0;
  // Each call to mockSelect returns a fresh promise whose resolver is pushed to `resolvers`
  mockSelect.mockImplementation(
    () =>
      new Promise<{ data: unknown[] | null; error: { message: string } | null }>((resolve) => {
        resolvers.push(resolve);
      }),
  );
});

// 1. Calls supabase.from('projects') on mount
test('calls supabase.from("projects") on mount', async () => {
  renderPage();
  expect(mockFrom).toHaveBeenCalledWith('projects');
  expect(mockSelect).toHaveBeenCalledWith('*');
  resolveLatest({ data: [], error: null });
  await waitFor(() => expect(document.querySelector('.animate-spin')).toBeNull());
});

// 2. Loading state renders while query is pending
test('renders loading spinner while query is pending', () => {
  renderPage();
  const spinner = document.querySelector('.animate-spin');
  expect(spinner).not.toBeNull();
  resolveLatest({ data: [], error: null });
});

// 3. After query resolves, project data is rendered (ProjectList renders a table)
test('renders project rows after query resolves', async () => {
  renderPage();
  const rows = [
    { id: 'proj-1', customer_name: 'Alpha Site', project_status: 'active', tier: 'pro', go_live_date: null },
    { id: 'proj-2', customer_name: 'Beta Site', project_status: 'planning', tier: 'lite', go_live_date: null },
  ];
  resolveLatest({ data: rows, error: null });
  await waitFor(() => {
    expect(document.querySelector('.animate-spin')).toBeNull();
  });
  expect(screen.getAllByText('Alpha Site')[0]).toBeInTheDocument();
  expect(screen.getAllByText('Beta Site')[0]).toBeInTheDocument();
});

// 4. When query errors, error message is displayed
test('renders error message when query rejects', async () => {
  renderPage();
  resolveLatest({ data: null, error: { message: 'Connection refused' } });
  await waitFor(() => {
    expect(screen.getByText(/failed to load projects/i)).toBeInTheDocument();
  });
  expect(screen.getByText('Connection refused')).toBeInTheDocument();
});
