// Tests: Deployment Phases 4-6 — step counts, Supabase toggle, VLAN panel, ISP panel

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

  // Phase 4: 12 steps, Phase 5: 2 steps, Phase 6: 13 steps (per seed migration)
  const CHECKLIST_ITEMS = [
    ...makeItems(4, 12),
    ...makeItems(5, 2),
    ...makeItems(6, 13),
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

// 1. Phase 4 shows 12 checklist items (checkboxes)
test('Phase 4 shows 12 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 4:/i }));

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(12);
  });
});

// 2. Phase 4 sidebar badge shows 0/12 progress
test('Phase 4 sidebar shows 0/12 progress badge', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => {
    const phase4Button = screen.getByRole('button', { name: /Phase 4:/i });
    expect(phase4Button).toHaveTextContent('0/12');
  });
});

// 3. Phase 5 shows 2 checklist items
test('Phase 5 shows 2 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 5:/i }));

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
  });
});

// 4. Phase 5 sidebar badge shows 0/2 progress
test('Phase 5 sidebar shows 0/2 progress badge', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => {
    const phase5Button = screen.getByRole('button', { name: /Phase 5:/i });
    expect(phase5Button).toHaveTextContent('0/2');
  });
});

// 5. Phase 6 shows 13 checklist items
test('Phase 6 shows 13 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 6:/i }));

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(13);
  });
});

// 6. Phase 6 sidebar badge shows 0/13 progress
test('Phase 6 sidebar shows 0/13 progress badge', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => {
    const phase6Button = screen.getByRole('button', { name: /Phase 6:/i });
    expect(phase6Button).toHaveTextContent('0/13');
  });
});

// 7. Checking a Phase 4 item calls Supabase update with is_completed=true
test('checking Phase 4 item calls Supabase update with is_completed=true', async () => {
  mockUpdate.mockClear();

  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 4:/i }));
  await waitFor(() => screen.getAllByRole('checkbox'));

  fireEvent.click(screen.getAllByRole('checkbox')[0]);

  await waitFor(() => {
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ is_completed: true }),
    );
  });
});

// 8. Supabase update eq targets the correct Phase 4 item id
test('Supabase update eq filters by the toggled Phase 4 item id', async () => {
  mockUpdateEq.mockClear();

  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 4:/i }));
  await waitFor(() => screen.getAllByRole('checkbox'));

  fireEvent.click(screen.getAllByRole('checkbox')[0]);

  await waitFor(() => {
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'p4-item-1');
  });
});

// 9. Phase 4 shows VLAN Architecture Reference panel
test('Phase 4 shows VLAN Architecture Reference panel', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 4:/i }));

  await waitFor(() => {
    expect(screen.getByText(/VLAN Architecture Reference/i)).toBeInTheDocument();
  });
});

// 10. Phase 5 shows ISP Router Configuration Method panel with 3 radio options
test('Phase 5 shows ISP config method panel with 3 radio options', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 5:/i }));

  await waitFor(() => {
    expect(screen.getByText(/ISP Router Configuration Method/i)).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
  });
});
