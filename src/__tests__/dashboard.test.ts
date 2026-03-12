// Tests: Dashboard route query behaviour
// Mocks Supabase client and TanStack Router so no real network calls are made

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';

// --- Hoist mock helpers so vi.mock factory can reference them ---
const { mockFrom, mockSelect, mockDelete, mockEq, resolvers, deleteResolvers } = vi.hoisted(() => {
  const resolvers: Array<
    (result: { data: unknown[] | null; error: { message: string } | null }) => void
  > = [];
  const deleteResolvers: Array<
    (result: { data: null; error: { message: string } | null }) => void
  > = [];

  const mockSelect = vi.fn(
    () =>
      new Promise<{ data: unknown[] | null; error: { message: string } | null }>((resolve) => {
        resolvers.push(resolve);
      }),
  );
  const mockEq = vi.fn(
    () =>
      new Promise<{ data: null; error: { message: string } | null }>((resolve) => {
        deleteResolvers.push(resolve);
      }),
  );
  const mockDelete = vi.fn(() => ({ eq: mockEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect, delete: mockDelete }));

  return { mockFrom, mockSelect, mockDelete, mockEq, resolvers, deleteResolvers };
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

function resolveLatestDelete(result: { data: null; error: { message: string } | null }) {
  const resolve = deleteResolvers.pop();
  if (resolve) resolve(result);
}

function renderPage() {
  return render(React.createElement(ProjectsPage));
}

beforeEach(() => {
  mockFrom.mockClear();
  mockSelect.mockClear();
  mockDelete.mockClear();
  mockEq.mockClear();
  resolvers.length = 0;
  deleteResolvers.length = 0;
  // Each call to mockSelect returns a fresh promise whose resolver is pushed to `resolvers`
  mockSelect.mockImplementation(
    () =>
      new Promise<{ data: unknown[] | null; error: { message: string } | null }>((resolve) => {
        resolvers.push(resolve);
      }),
  );
  mockEq.mockImplementation(
    () =>
      new Promise<{ data: null; error: { message: string } | null }>((resolve) => {
        deleteResolvers.push(resolve);
      }),
  );
  mockDelete.mockImplementation(() => ({ eq: mockEq }));
  mockFrom.mockImplementation(() => ({ select: mockSelect, delete: mockDelete }));
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

const sampleRows = [
  { id: 'proj-1', customer_name: 'Alpha Site', project_status: 'active', tier: 'pro', go_live_date: null },
];

// 5. Delete button renders on project cards/rows
test('renders delete button for each project', async () => {
  renderPage();
  resolveLatest({ data: sampleRows, error: null });
  await waitFor(() => expect(document.querySelector('.animate-spin')).toBeNull());
  const deleteButtons = screen.getAllByRole('button', { name: /delete project/i });
  expect(deleteButtons.length).toBeGreaterThan(0);
});

// 6. Clicking delete shows confirmation dialog
test('clicking delete button opens confirmation dialog', async () => {
  renderPage();
  resolveLatest({ data: sampleRows, error: null });
  await waitFor(() => expect(document.querySelector('.animate-spin')).toBeNull());
  const [firstDeleteBtn] = screen.getAllByRole('button', { name: /delete project/i });
  fireEvent.click(firstDeleteBtn);
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'Delete Project' })).toBeInTheDocument();
  });
});

// 7. Confirming delete calls supabase delete with correct id
test('confirming delete calls supabase.from("projects").delete().eq("id", id)', async () => {
  renderPage();
  resolveLatest({ data: sampleRows, error: null });
  await waitFor(() => expect(document.querySelector('.animate-spin')).toBeNull());

  const [firstDeleteBtn] = screen.getAllByRole('button', { name: /delete project/i });
  fireEvent.click(firstDeleteBtn);
  await waitFor(() => screen.getByRole('heading', { name: 'Delete Project' }));

  const confirmBtn = screen.getByRole('button', { name: 'Delete Project' });
  fireEvent.click(confirmBtn);

  // Resolve the delete
  resolveLatestDelete({ data: null, error: null });
  // Resolve the refetch that follows
  resolveLatest({ data: [], error: null });

  await waitFor(() => {
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', 'proj-1');
  });
});

// 8. Canceling dialog does not call supabase delete
test('canceling delete dialog does not call supabase delete', async () => {
  renderPage();
  resolveLatest({ data: sampleRows, error: null });
  await waitFor(() => expect(document.querySelector('.animate-spin')).toBeNull());

  const [firstDeleteBtn] = screen.getAllByRole('button', { name: /delete project/i });
  fireEvent.click(firstDeleteBtn);
  await waitFor(() => screen.getByRole('heading', { name: 'Delete Project' }));

  const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
  fireEvent.click(cancelBtn);

  await waitFor(() =>
    expect(screen.queryByRole('heading', { name: 'Delete Project' })).toBeNull(),
  );
  expect(mockDelete).not.toHaveBeenCalled();
});
