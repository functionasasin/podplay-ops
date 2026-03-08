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

// 1. Phase 1 shows 7 checklist items (checkboxes)
test('Phase 1 shows 7 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 1:/i }));

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(7);
  });
});

// 2. Phase 1 sidebar badge shows 0/7 progress
test('Phase 1 sidebar shows 0/7 progress badge', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => {
    const phase1Button = screen.getByRole('button', { name: /Phase 1:/i });
    expect(phase1Button).toHaveTextContent('0/7');
  });
});

// 3. Phase 2 shows 7 checklist items
test('Phase 2 shows 7 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 2:/i }));

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(7);
  });
});

// 4. Phase 2 sidebar badge shows 0/7 progress
test('Phase 2 sidebar shows 0/7 progress badge', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => {
    const phase2Button = screen.getByRole('button', { name: /Phase 2:/i });
    expect(phase2Button).toHaveTextContent('0/7');
  });
});

// 5. Phase 3 shows 6 checklist items
test('Phase 3 shows 6 checklist items', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 3:/i }));

  await waitFor(() => {
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(6);
  });
});

// 6. Phase 3 sidebar badge shows 0/6 progress
test('Phase 3 sidebar shows 0/6 progress badge', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => {
    const phase3Button = screen.getByRole('button', { name: /Phase 3:/i });
    expect(phase3Button).toHaveTextContent('0/6');
  });
});

// 7. Checking a Phase 1 item calls Supabase update with is_completed=true
test('checking Phase 1 item calls Supabase update with is_completed=true', async () => {
  mockUpdate.mockClear();

  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 1:/i }));
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
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 1:/i }));
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
  await waitFor(() => screen.getAllByRole('button', { name: /Phase \d+:/i }));

  fireEvent.click(screen.getByRole('button', { name: /Phase 1:/i }));
  await waitFor(() => screen.getAllByRole('checkbox'));

  fireEvent.click(screen.getAllByRole('checkbox')[0]);

  await waitFor(() => {
    expect(mockUpdateEq).toHaveBeenCalledWith('id', 'p1-item-1');
  });
});

// 10. Phase 1 icon is ○ (empty circle) before any items are checked
test('Phase 1 sidebar icon is ○ when no items are completed', async () => {
  const Component = await getDeploymentPage();
  renderPage(Component);
  await waitFor(() => {
    const phase1Button = screen.getByRole('button', { name: /Phase 1:/i });
    expect(phase1Button.textContent).toContain('○');
  });
});
