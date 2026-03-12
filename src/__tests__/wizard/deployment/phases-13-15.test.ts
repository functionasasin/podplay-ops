// Tests: Deployment Phases 13-15 — step counts, Supabase toggle, phase status

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';

// --- Hoist Supabase mock ---
const { mockFrom, mockUpdate, mockUpdateEq, mockProjectUpdate, mockProjectUpdateEq } = vi.hoisted(() => {
  const PROJECT = {
    project_name: 'Test Venue',
    customer_name: 'Test Customer',
    court_count: 6,
    ddns_subdomain: 'test',
    unifi_site_name: 'test-site',
    mac_mini_username: 'admin',
    location_id: 'loc-1',
    tier: 'pro',
    venue_country: 'US',
    isp_config_method: null,
    replay_service_version: null,
  };

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

  // Phase 13: 8 steps, Phase 14: 3 steps, Phase 15: 6 steps (per seed migration)
  const CHECKLIST_ITEMS = [
    ...makeItems(13, 8),
    ...makeItems(14, 3),
    ...makeItems(15, 6),
  ];

  const mockUpdateEq = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));

  const mockProjectUpdateEq = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockProjectUpdate = vi.fn(() => ({ eq: mockProjectUpdateEq }));

  const mockSingle = vi.fn().mockResolvedValue({ data: PROJECT });
  const mockOrderChecklist = vi.fn().mockResolvedValue({ data: CHECKLIST_ITEMS });
  const mockEqChecklist = vi.fn(() => ({ order: mockOrderChecklist }));
  const mockSelectChecklist = vi.fn(() => ({ eq: mockEqChecklist }));

  const mockEqProject = vi.fn(() => ({ single: mockSingle }));
  const mockSelectProject = vi.fn(() => ({ eq: mockEqProject }));

  const mockFrom = vi.fn((table: string) => {
    if (table === 'projects') return { select: mockSelectProject, update: mockProjectUpdate };
    return { select: mockSelectChecklist, update: mockUpdate };
  });

  return { mockFrom, mockUpdate, mockUpdateEq, mockProjectUpdate, mockProjectUpdateEq };
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

// PHASE_DISPLAY_ORDER = [0,1,2,3,4,5,6,7,8,9,10,11,15,12,13,14]
// Phase 13 (Testing & Verification) → display index 14
// Phase 14 (Health Monitoring Setup) → display index 15
// Phase 15 (Packaging & Shipping) → display index 12

// 1. Phase 13 shows 8 checklist items (checkboxes)
test('Phase 13 shows 8 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  // Phase 13 (Testing & Verification) is at display index 14 → click Next 14 times
  await navigateToDisplayIndex(14);

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(8);
  });
}, 15000);

// 2. Phase 13 content area shows correct heading
test('Phase 13 content area shows Phase 13 heading', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await navigateToDisplayIndex(14);

  await waitFor(() => {
    expect(screen.getByText(/Phase 13:/i)).toBeInTheDocument();
  });
}, 15000);

// 3. Phase 14 shows 3 checklist items
test('Phase 14 shows 3 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  // Phase 14 (Health Monitoring Setup) is at display index 15 → click Next 15 times
  await navigateToDisplayIndex(15);

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
  });
}, 15000);

// 4. Phase 14 content area shows correct heading
test('Phase 14 content area shows Phase 14 heading', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await navigateToDisplayIndex(15);

  await waitFor(() => {
    expect(screen.getByText(/Phase 14:/i)).toBeInTheDocument();
  });
}, 15000);

// 5. Phase 15 shows 6 checklist items
test('Phase 15 shows 6 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  // Phase 15 (Packaging & Shipping) is at display index 12 → click Next 12 times
  await navigateToDisplayIndex(12);

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(6);
  });
}, 15000);

// 6. Phase 15 content area shows correct heading
test('Phase 15 content area shows Phase 15 heading', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await navigateToDisplayIndex(12);

  await waitFor(() => {
    expect(screen.getByText(/Phase 15:/i)).toBeInTheDocument();
  });
}, 15000);

// 7. Checking a Phase 13 item calls Supabase update with is_completed=true
test('checking Phase 13 item calls Supabase update with is_completed=true', async () => {
  mockUpdate.mockClear();

  const Component = await getDeploymentPage();
  renderPage(Component);
  await navigateToDisplayIndex(14);
  await waitFor(() => screen.getAllByRole('checkbox'));

  fireEvent.click(screen.getAllByRole('checkbox')[0]);

  await waitFor(() => {
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ is_completed: true }),
    );
  });
}, 15000);

// 8. Supabase update eq targets the correct Phase 13 item id
test('Supabase update eq filters by the toggled Phase 13 item id', async () => {
  mockUpdateEq.mockClear();

  const Component = await getDeploymentPage();
  renderPage(Component);
  await navigateToDisplayIndex(14);
  await waitFor(() => screen.getAllByRole('checkbox'));

  fireEvent.click(screen.getAllByRole('checkbox')[0]);

  await waitFor(() => {
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'p13-item-1');
  });
}, 15000);

// 9. Phase 14 content area shows all 3 checklist items
test('Phase 14 shows all 3 checklist items when navigated to', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  // Phase 14 (Health Monitoring Setup) is at display index 15
  await navigateToDisplayIndex(15);
  await waitFor(() => screen.getAllByRole('checkbox'));

  const checkboxes = screen.getAllByRole('checkbox');
  expect(checkboxes).toHaveLength(3);
}, 15000);

// 10. Supabase update includes completed_at when toggling a Phase 15 item
test('toggling Phase 15 item sends completed_at timestamp', async () => {
  mockUpdate.mockClear();

  const Component = await getDeploymentPage();
  renderPage(Component);
  // Phase 15 (Packaging & Shipping) is at display index 12
  await navigateToDisplayIndex(12);
  await waitFor(() => screen.getAllByRole('checkbox'));

  fireEvent.click(screen.getAllByRole('checkbox')[0]);

  await waitFor(() => {
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        is_completed: true,
        completed_at: expect.any(String),
      }),
    );
  });
}, 15000);
