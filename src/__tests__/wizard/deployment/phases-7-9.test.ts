// Tests: Deployment Phases 7-9 — step counts, Supabase toggle, Replay Service Version panel

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

  // Phase 7: 5 steps, Phase 8: 8 steps, Phase 9: 10 steps (per seed migration)
  const CHECKLIST_ITEMS = [
    ...makeItems(7, 5),
    ...makeItems(8, 8),
    ...makeItems(9, 10),
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

// 1. Phase 7 shows 5 checklist items (checkboxes)
test('Phase 7 shows 5 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 7:/i }));

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(5);
  });
});

// 2. Phase 7 sidebar badge shows 0/5 progress
test('Phase 7 sidebar shows 0/5 progress badge', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => {
    const phase7Button = screen.getByRole('button', { name: /Phase 7:/i });
    expect(phase7Button).toHaveTextContent('0/5');
  });
});

// 3. Phase 8 shows 8 checklist items
test('Phase 8 shows 8 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 8:/i }));

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(8);
  });
});

// 4. Phase 8 sidebar badge shows 0/8 progress
test('Phase 8 sidebar shows 0/8 progress badge', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => {
    const phase8Button = screen.getByRole('button', { name: /Phase 8:/i });
    expect(phase8Button).toHaveTextContent('0/8');
  });
});

// 5. Phase 9 shows 10 checklist items
test('Phase 9 shows 10 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 9:/i }));

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(10);
  });
});

// 6. Phase 9 sidebar badge shows 0/10 progress
test('Phase 9 sidebar shows 0/10 progress badge', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => {
    const phase9Button = screen.getByRole('button', { name: /Phase 9:/i });
    expect(phase9Button).toHaveTextContent('0/10');
  });
});

// 7. Checking a Phase 7 item calls Supabase update with is_completed=true
test('checking Phase 7 item calls Supabase update with is_completed=true', async () => {
  mockUpdate.mockClear();

  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 7:/i }));
  await waitFor(() => screen.getAllByRole('checkbox'));

  fireEvent.click(screen.getAllByRole('checkbox')[0]);

  await waitFor(() => {
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ is_completed: true }),
    );
  });
});

// 8. Supabase update eq targets the correct Phase 7 item id
test('Supabase update eq filters by the toggled Phase 7 item id', async () => {
  mockUpdateEq.mockClear();

  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 7:/i }));
  await waitFor(() => screen.getAllByRole('checkbox'));

  fireEvent.click(screen.getAllByRole('checkbox')[0]);

  await waitFor(() => {
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'p7-item-1');
  });
});

// 9. Phase 9 shows Replay Service Version panel
test('Phase 9 shows Replay Service Version panel', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 9:/i }));

  await waitFor(() => {
    expect(screen.getByText(/Replay Service Version/i)).toBeInTheDocument();
  });
});

// 10. Phase 9 Replay Service Version panel has 2 radio options (V1 and V2)
test('Phase 9 Replay Service Version panel shows 2 radio options', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 9:/i }));

  await waitFor(() => {
    expect(screen.getByText(/Replay Service Version/i)).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
  });
});
