// Tests: Deployment Phases 1-3 — step counts, Supabase toggle, phase completion

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';

// --- Hoist Supabase mock ---
const { mockFrom, mockUpdate, mockUpdateEq } = vi.hoisted(() => {
  const PROJECT = {
    project_name: 'Test Venue',
    customer_name: 'Test Customer',
    court_count: 6,
    ddns_subdomain: 'test',
    unifi_site_name: 'test-site',
    mac_mini_username: 'admin',
    location_id: 'loc-1',
  };

  // Build items per phase inline
  function makeItems(phase: number, count: number) {
    return Array.from({ length: count }, (_, i) => ({
      id: `p${phase}-item-${i + 1}`,
      phase,
      step_number: i + 1,
      sort_order: phase * 100 + i + 1,
      title: `Phase ${phase} Step ${i + 1} Title`,
      description: `Phase ${phase} step ${i + 1} description`,
      warnings: null,
      is_completed: false,
      notes: null,
    }));
  }

  // Phase 1: 7 steps, Phase 2: 7 steps, Phase 3: 6 steps (per spec)
  const CHECKLIST_ITEMS = [
    ...makeItems(1, 7),
    ...makeItems(2, 7),
    ...makeItems(3, 6),
  ];

  const mockUpdateEq = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));

  const mockSingle = vi.fn().mockResolvedValue({ data: PROJECT });
  const mockOrderChecklist = vi.fn().mockResolvedValue({ data: CHECKLIST_ITEMS });
  const mockEqChecklist = vi.fn(() => ({ order: mockOrderChecklist }));
  const mockSelectChecklist = vi.fn(() => ({ eq: mockEqChecklist }));

  const mockEqProject = vi.fn(() => ({ single: mockSingle }));
  const mockSelectProject = vi.fn(() => ({ eq: mockEqProject }));

  const mockFrom = vi.fn((table: string) => {
    if (table === 'projects') return { select: mockSelectProject };
    return { select: mockSelectChecklist, update: mockUpdate };
  });

  return { mockFrom, mockUpdate, mockUpdateEq };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

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

async function getDeploymentPage() {
  const mod = await import('@/routes/_auth/projects/$projectId/deployment');
  return mod.Route.options?.component ?? mod.Route.component;
}

function renderPage(Component: React.ComponentType) {
  return render(React.createElement(Component));
}

// Helper: navigate to display index N by clicking Next N times
async function navigateToDisplayIndex(n: number) {
  await waitFor(() => screen.getByRole('progressbar'));
  for (let i = 0; i < n; i++) {
    fireEvent.click(screen.getByRole('button', { name: /Next/ }));
  }
}

// 1. Phase 1 shows 7 checklist items (checkboxes)
test('Phase 1 shows 7 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  // Phase 1 is at display index 1 → click Next once
  await navigateToDisplayIndex(1);

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(7);
  });
});

// 2. Phase 1 content area shows correct heading
test('Phase 1 content area shows Phase 1 heading', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await navigateToDisplayIndex(1);

  await waitFor(() => {
    expect(screen.getByText(/Phase 1:/i)).toBeInTheDocument();
  });
});

// 3. Phase 2 shows 7 checklist items
test('Phase 2 shows 7 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  // Phase 2 is at display index 2 → click Next twice
  await navigateToDisplayIndex(2);

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(7);
  });
});

// 4. Phase 2 content area shows correct heading
test('Phase 2 content area shows Phase 2 heading', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await navigateToDisplayIndex(2);

  await waitFor(() => {
    expect(screen.getByText(/Phase 2:/i)).toBeInTheDocument();
  });
});

// 5. Phase 3 shows 6 checklist items
test('Phase 3 shows 6 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  // Phase 3 is at display index 3 → click Next 3 times
  await navigateToDisplayIndex(3);

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(6);
  });
});

// 6. Phase 3 content area shows correct heading
test('Phase 3 content area shows Phase 3 heading', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await navigateToDisplayIndex(3);

  await waitFor(() => {
    expect(screen.getByText(/Phase 3:/i)).toBeInTheDocument();
  });
});

// 7. Checking a Phase 1 item calls Supabase update with is_completed=true
test('checking Phase 1 item calls Supabase update with is_completed=true', async () => {
  mockUpdate.mockClear();

  const Component = await getDeploymentPage();
  renderPage(Component);
  await navigateToDisplayIndex(1);
  await waitFor(() => screen.getAllByRole('checkbox'));

  fireEvent.click(screen.getAllByRole('checkbox')[0]);

  await waitFor(() => {
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ is_completed: true }),
    );
  });
});

// 8. Supabase update includes completed_at ISO string when checking an item
test('checking an item sends non-null completed_at in Supabase update', async () => {
  mockUpdate.mockClear();

  const Component = await getDeploymentPage();
  renderPage(Component);
  await navigateToDisplayIndex(1);
  await waitFor(() => screen.getAllByRole('checkbox'));

  fireEvent.click(screen.getAllByRole('checkbox')[0]);

  await waitFor(() => {
    const payload = mockUpdate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload).toBeDefined();
    expect(payload.completed_at).toBeTruthy();
    expect(typeof payload.completed_at).toBe('string');
  });
});

// 9. Supabase update eq targets the correct item id
test('Supabase update eq filters by the toggled item id', async () => {
  mockUpdateEq.mockClear();

  const Component = await getDeploymentPage();
  renderPage(Component);
  await navigateToDisplayIndex(1);
  await waitFor(() => screen.getAllByRole('checkbox'));

  fireEvent.click(screen.getAllByRole('checkbox')[0]);

  await waitFor(() => {
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'p1-item-1');
  });
});

// 10. Phase 1 step button has aria-current=step after navigating to it
test('Phase 1 step button is active after navigating', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await navigateToDisplayIndex(1);

  await waitFor(() => {
    const phase1Button = screen.getByRole('button', { name: /Pre-Configuration/i });
    expect(phase1Button).toHaveAttribute('aria-current', 'step');
  });
});
