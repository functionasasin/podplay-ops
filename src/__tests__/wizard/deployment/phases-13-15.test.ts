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

// 1. Phase 13 shows 8 checklist items (checkboxes)
test('Phase 13 shows 8 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 13:/i }));

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(8);
  });
});

// 2. Phase 13 sidebar badge shows 0/8 progress
test('Phase 13 sidebar shows 0/8 progress badge', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => {
    const phase13Button = screen.getByRole('button', { name: /Phase 13:/i });
    expect(phase13Button).toHaveTextContent('0/8');
  });
});

// 3. Phase 14 shows 3 checklist items
test('Phase 14 shows 3 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 14:/i }));

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
  });
});

// 4. Phase 14 sidebar badge shows 0/3 progress
test('Phase 14 sidebar shows 0/3 progress badge', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => {
    const phase14Button = screen.getByRole('button', { name: /Phase 14:/i });
    expect(phase14Button).toHaveTextContent('0/3');
  });
});

// 5. Phase 15 shows 6 checklist items
test('Phase 15 shows 6 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 15:/i }));

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(6);
  });
});

// 6. Phase 15 sidebar badge shows 0/6 progress
test('Phase 15 sidebar shows 0/6 progress badge', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => {
    const phase15Button = screen.getByRole('button', { name: /Phase 15:/i });
    expect(phase15Button).toHaveTextContent('0/6');
  });
});

// 7. Checking a Phase 13 item calls Supabase update with is_completed=true
test('checking Phase 13 item calls Supabase update with is_completed=true', async () => {
  mockUpdate.mockClear();

  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 13:/i }));
  await waitFor(() => screen.getAllByRole('checkbox'));

  fireEvent.click(screen.getAllByRole('checkbox')[0]);

  await waitFor(() => {
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ is_completed: true }),
    );
  });
});

// 8. Supabase update eq targets the correct Phase 13 item id
test('Supabase update eq filters by the toggled Phase 13 item id', async () => {
  mockUpdateEq.mockClear();

  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 13:/i }));
  await waitFor(() => screen.getAllByRole('checkbox'));

  fireEvent.click(screen.getAllByRole('checkbox')[0]);

  await waitFor(() => {
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'p13-item-1');
  });
});

// 9. Checking all Phase 14 items marks phase complete (0/3 → 3/3)
test('checking all Phase 14 items updates sidebar badge to 3/3', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 14:/i }));
  await waitFor(() => screen.getAllByRole('checkbox'));

  const checkboxes = screen.getAllByRole('checkbox');
  expect(checkboxes).toHaveLength(3);

  for (const cb of checkboxes) {
    fireEvent.click(cb);
  }

  await waitFor(() => {
    const phase14Button = screen.getByRole('button', { name: /Phase 14:/i });
    expect(phase14Button).toHaveTextContent('3/3');
  });
});

// 10. Supabase update includes completed_at when toggling a Phase 15 item
test('toggling Phase 15 item sends completed_at timestamp', async () => {
  mockUpdate.mockClear();

  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 15:/i }));
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
});
