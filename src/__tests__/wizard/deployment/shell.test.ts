// Tests: Deployment Shell — phase list, progress bar, checklist panel

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';

// --- Hoist Supabase mock ---
const { mockFrom, mockSingle } = vi.hoisted(() => {
  const PROJECT = { project_name: 'Test Venue', customer_name: 'Test Customer' };

  const CHECKLIST_ITEMS = [
    {
      id: 'item-1',
      phase: 0,
      step_number: 1,
      sort_order: 1,
      title: 'Plan network topology',
      description: 'Draw up network diagram',
      warnings: null,
      is_completed: false,
      notes: null,
    },
    {
      id: 'item-2',
      phase: 0,
      step_number: 2,
      sort_order: 2,
      title: 'Order hardware',
      description: 'Submit purchase orders',
      warnings: null,
      is_completed: false,
      notes: null,
    },
    {
      id: 'item-3',
      phase: 1,
      step_number: 1,
      sort_order: 10,
      title: 'Flash firmware',
      description: 'Update all switch firmware',
      warnings: ['Do not disconnect during flash'],
      is_completed: false,
      notes: null,
    },
  ];

  const mockSingle = vi.fn().mockResolvedValue({ data: PROJECT });
  const mockOrderChecklist = vi.fn().mockResolvedValue({ data: CHECKLIST_ITEMS });
  const mockEqChecklist = vi.fn(() => ({ order: mockOrderChecklist }));
  const mockSelectChecklist = vi.fn(() => ({ eq: mockEqChecklist }));

  const mockEqProject = vi.fn(() => ({ single: mockSingle }));
  const mockSelectProject = vi.fn(() => ({ eq: mockEqProject }));

  const mockFrom = vi.fn((table: string) => {
    if (table === 'projects') return { select: mockSelectProject };
    return { select: mockSelectChecklist };
  });

  return { mockFrom, mockSingle };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

// TanStack Router mock
vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    createFileRoute: () => (opts: { component: React.ComponentType }) => ({
      ...opts,
      useParams: () => ({ projectId: 'proj-test' }),
    }),
    useParams: () => ({ projectId: 'proj-test' }),
  };
});

// Lazy import after mocks are set up
async function getDeploymentPage() {
  const mod = await import(
    '@/routes/_auth/projects/$projectId/deployment'
  );
  // createFileRoute returns a route object; extract component
  return mod.Route.options?.component ?? mod.Route.component;
}

function renderPage(Component: React.ComponentType) {
  return render(React.createElement(Component));
}

// 1. Shows loading state initially
test('shows loading state before data loads', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  // Both "Loading..." and "Loading checklist..." appear on initial render
  const loadingEls = screen.getAllByText(/loading/i);
  expect(loadingEls.length).toBeGreaterThanOrEqual(1);
});

// 2. 16 phase buttons are rendered in sidebar
test('renders 16 phase buttons in sidebar', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => {
    // Each phase renders as a button with "Phase N:" label
    const buttons = screen.getAllByRole('button', { name: /Phase \d+:/i });
    expect(buttons).toHaveLength(16);
  });
});

// 3. Progress bar shows 0% when no items are completed
test('progress bar shows 0% for project with no completed items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => {
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });
});

// 4. Progress bar has correct aria attributes
test('progress bar has aria-valuemin=0 and aria-valuemax=100', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => {
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });
});

// 5. Phase 0 is selected by default (aria-current)
test('Phase 0 is selected by default', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => {
    const phase0 = screen.getByRole('button', { name: /Phase 0:/i });
    expect(phase0).toHaveAttribute('aria-current', 'true');
  });
});

// 6. Checklist items for selected phase appear in right panel
// Items are rendered as "Step N: Title"
test('checklist items for Phase 0 appear in detail panel', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => {
    expect(screen.getByText(/Step 1: Plan network topology/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 2: Order hardware/i)).toBeInTheDocument();
  });
});

// 7. Clicking a phase button selects it (shows its checklist)
test('clicking Phase 1 shows Phase 1 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  const phase1Button = screen.getByRole('button', { name: /Phase 1:/i });
  fireEvent.click(phase1Button);

  await waitFor(() => {
    expect(screen.getByText(/Step 1: Flash firmware/i)).toBeInTheDocument();
  });
});

// 8. Phase 1 button gets aria-current after clicking
test('Phase 1 gets aria-current=true after clicking', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  const phase1Button = screen.getByRole('button', { name: /Phase 1:/i });
  fireEvent.click(phase1Button);

  await waitFor(() => {
    expect(phase1Button).toHaveAttribute('aria-current', 'true');
  });
});

// 9. Overall progress text is shown
test('shows overall progress text', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => {
    expect(screen.getByText(/Overall Progress/i)).toBeInTheDocument();
  });
});

// 10. Phase 15 appears in the sidebar (packaging & shipping)
test('Phase 15 Packaging & Shipping appears in phase list', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => {
    expect(screen.getByRole('button', { name: /Phase 15:/i })).toBeInTheDocument();
  });
});
