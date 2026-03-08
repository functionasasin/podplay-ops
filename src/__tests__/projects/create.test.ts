// Tests: New Project creation form
// Mocks Supabase, toast, and TanStack Router so no real network calls are made

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// --- Hoist mock helpers ---
const { mockFrom, mockInsert, mockSelectChain, mockSingle, mockNavigate, mockShowToast } =
  vi.hoisted(() => {
    const mockSingle = vi.fn();
    const mockSelectChain = vi.fn(() => ({ single: mockSingle }));
    const mockInsert = vi.fn(() => ({ select: mockSelectChain }));
    const mockFrom = vi.fn(() => ({ insert: mockInsert }));
    const mockNavigate = vi.fn();
    const mockShowToast = vi.fn();
    return { mockFrom, mockInsert, mockSelectChain, mockSingle, mockNavigate, mockShowToast };
  });

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

vi.mock('@/lib/toast', () => ({
  showToast: mockShowToast,
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => config,
  useNavigate: () => mockNavigate,
}));

import { NewProjectPage } from '@/routes/_auth/projects/new';

function renderPage() {
  return render(React.createElement(NewProjectPage));
}

beforeEach(() => {
  mockFrom.mockClear();
  mockInsert.mockClear();
  mockSelectChain.mockClear();
  mockSingle.mockClear();
  mockNavigate.mockClear();
  mockShowToast.mockClear();
});

// 1. Form renders all required fields (project_name, customer_name) and optional field (venue_name)
test('renders project_name, customer_name, and venue_name fields', () => {
  renderPage();
  expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/customer name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/venue name/i)).toBeInTheDocument();
});

// 2. Submitting with empty required fields shows validation errors and does not call Supabase
test('shows validation errors for empty required fields and does not call Supabase', async () => {
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: /create project/i }));
  await waitFor(() => {
    expect(screen.getAllByText(/at least 2 characters/i).length).toBeGreaterThan(0);
  });
  expect(mockFrom).not.toHaveBeenCalled();
});

// 3. Submitting with valid data calls supabase.from('projects').insert() with correct payload
test('calls supabase insert with status=intake on valid submit', async () => {
  mockSingle.mockResolvedValue({ data: { id: 'proj-abc' }, error: null });
  renderPage();

  fireEvent.change(screen.getByLabelText(/project name/i), {
    target: { value: 'Alpha Site' },
  });
  fireEvent.change(screen.getByLabelText(/customer name/i), {
    target: { value: 'Acme Corp' },
  });
  fireEvent.change(screen.getByLabelText(/venue name/i), {
    target: { value: 'Grand Hall' },
  });
  fireEvent.click(screen.getByRole('button', { name: /create project/i }));

  await waitFor(() => expect(mockInsert).toHaveBeenCalled());
  expect(mockFrom).toHaveBeenCalledWith('projects');
  expect(mockInsert).toHaveBeenCalledWith({
    project_name: 'Alpha Site',
    customer_name: 'Acme Corp',
    venue_name: 'Grand Hall',
    project_status: 'intake',
  });
});

// 4. On successful insert, redirects to /projects/{id}/intake via window.location.href
test('redirects to /projects/{id}/intake on successful insert', async () => {
  mockSingle.mockResolvedValue({ data: { id: 'proj-123' }, error: null });

  // Stub window.location so href assignment is observable
  const locationStub = { href: '' };
  vi.stubGlobal('location', locationStub);

  renderPage();
  fireEvent.change(screen.getByLabelText(/project name/i), {
    target: { value: 'New Site' },
  });
  fireEvent.change(screen.getByLabelText(/customer name/i), {
    target: { value: 'Some Customer' },
  });
  fireEvent.click(screen.getByRole('button', { name: /create project/i }));

  await waitFor(() => {
    expect(locationStub.href).toBe('/projects/proj-123/intake');
  });

  vi.unstubAllGlobals();
});

// 5. On insert error, shows toast and does not redirect
test('shows CREATE_PROJECT_ERROR toast on insert error and does not redirect', async () => {
  mockSingle.mockResolvedValue({ data: null, error: { message: 'DB failure' } });

  const locationStub = { href: '' };
  vi.stubGlobal('location', locationStub);

  renderPage();
  fireEvent.change(screen.getByLabelText(/project name/i), {
    target: { value: 'Error Site' },
  });
  fireEvent.change(screen.getByLabelText(/customer name/i), {
    target: { value: 'Error Corp' },
  });
  fireEvent.click(screen.getByRole('button', { name: /create project/i }));

  await waitFor(() =>
    expect(mockShowToast).toHaveBeenCalledWith('CREATE_PROJECT_ERROR'),
  );
  expect(locationStub.href).toBe('');

  vi.unstubAllGlobals();
});

// 6. Cancel button calls navigate({ to: '/projects' })
test('cancel button navigates to /projects', async () => {
  renderPage();
  fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
  await waitFor(() =>
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/projects' }),
  );
});
