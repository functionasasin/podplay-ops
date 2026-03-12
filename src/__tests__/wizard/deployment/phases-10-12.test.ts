// Tests: Deployment Phases 10-12 — step counts, Supabase toggle, AppLockWarningBanner

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

  // Phase 10: 11 steps, Phase 11: 5 steps, Phase 12: 10 steps (per seed migration)
  const CHECKLIST_ITEMS = [
    ...makeItems(10, 11),
    ...makeItems(11, 5),
    ...makeItems(12, 10),
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
// Phase 10 → display index 10
// Phase 11 → display index 11
// Phase 12 (Physical Installation) → display index 13

// 1. Phase 10 shows 11 checklist items (checkboxes)
test('Phase 10 shows 11 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  // Phase 10 is at display index 10 → click Next 10 times
  await navigateToDisplayIndex(10);

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(11);
  });
}, 15000);

// 2. Phase 10 content area shows correct heading
test('Phase 10 content area shows Phase 10 heading', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await navigateToDisplayIndex(10);

  await waitFor(() => {
    expect(screen.getByText(/Phase 10:/i)).toBeInTheDocument();
  });
}, 15000);

// 3. Phase 11 shows 5 checklist items
test('Phase 11 shows 5 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  // Phase 11 is at display index 11 → click Next 11 times
  await navigateToDisplayIndex(11);

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(5);
  });
}, 15000);

// 4. Phase 11 content area shows correct heading
test('Phase 11 content area shows Phase 11 heading', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await navigateToDisplayIndex(11);

  await waitFor(() => {
    expect(screen.getByText(/Phase 11:/i)).toBeInTheDocument();
  });
}, 15000);

// 5. Phase 12 shows 10 checklist items
test('Phase 12 shows 10 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  // Phase 12 (Physical Installation) is at display index 13 → click Next 13 times
  await navigateToDisplayIndex(13);

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(10);
  });
}, 15000);

// 6. Phase 12 content area shows correct heading
test('Phase 12 content area shows Phase 12 heading', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await navigateToDisplayIndex(13);

  await waitFor(() => {
    expect(screen.getByText(/Phase 12:/i)).toBeInTheDocument();
  });
}, 15000);

// 7. Checking a Phase 10 item calls Supabase update with is_completed=true
test('checking Phase 10 item calls Supabase update with is_completed=true', async () => {
  mockUpdate.mockClear();

  const Component = await getDeploymentPage();
  renderPage(Component);
  await navigateToDisplayIndex(10);
  await waitFor(() => screen.getAllByRole('checkbox'));

  fireEvent.click(screen.getAllByRole('checkbox')[0]);

  await waitFor(() => {
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ is_completed: true }),
    );
  });
}, 15000);

// 8. Supabase update eq targets the correct Phase 10 item id
test('Supabase update eq filters by the toggled Phase 10 item id', async () => {
  mockUpdateEq.mockClear();

  const Component = await getDeploymentPage();
  renderPage(Component);
  await navigateToDisplayIndex(10);
  await waitFor(() => screen.getAllByRole('checkbox'));

  fireEvent.click(screen.getAllByRole('checkbox')[0]);

  await waitFor(() => {
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'p10-item-1');
  });
}, 15000);

// 9. Phase 12 shows AppLockWarningBanner
test('Phase 12 shows AppLockWarningBanner', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  // Phase 12 (Physical Installation) is at display index 13
  await navigateToDisplayIndex(13);

  await waitFor(() => {
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/App Lock must be OFF before pairing Flic buttons/i)).toBeInTheDocument();
  });
}, 15000);

// 10. Phase 12 AppLockWarningBanner contains all required instructions
test('Phase 12 AppLockWarningBanner shows Mosyle and Guided Access instructions', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  // Phase 12 (Physical Installation) is at display index 13
  await navigateToDisplayIndex(13);

  await waitFor(() => {
    expect(screen.getByText(/Mosyle/i)).toBeInTheDocument();
    expect(screen.getByText(/Guided Access/i)).toBeInTheDocument();
  });
}, 15000);
