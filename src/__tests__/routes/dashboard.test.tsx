// Tests: Dashboard ProjectList route — status-based link hrefs

import { render, screen } from '@testing-library/react';
import React from 'react';
import { ProjectList, type Project } from '@/components/dashboard/ProjectList';

vi.mock('@/lib/empty-state-configs', () => ({
  EMPTY_STATES: {
    dashboardNoProjects: {
      icon: 'folder',
      heading: 'No projects',
      description: 'Create your first project',
      cta: { label: 'New Project', href: '/projects/new' },
    },
    dashboardNoResults: {
      icon: 'search',
      heading: 'No results',
      description: 'Try adjusting filters',
      cta: { label: 'Clear filters', onClick: undefined },
    },
  },
}));

function makeProject(overrides: Partial<Project>): Project {
  return {
    id: 'proj-abc',
    customer_name: 'Test Customer',
    project_status: 'intake',
    tier: 'pro',
    go_live_date: null,
    ...overrides,
  };
}

function renderList(projects: Project[]) {
  return render(React.createElement(ProjectList, { projects }));
}

// 1. Project with status 'intake': link goes to /projects/$id/intake
test('project with status intake has link to /projects/$id/intake', () => {
  renderList([makeProject({ id: 'proj-111', project_status: 'intake' })]);
  const link = screen.getAllByRole('link')[0] as HTMLAnchorElement;
  expect(link.href).toContain('/projects/proj-111/intake');
});

// 2. Project with status 'procurement': link goes to /projects/$id/procurement
test('project with status procurement has link to /projects/$id/procurement', () => {
  renderList([makeProject({ id: 'proj-222', project_status: 'procurement' })]);
  const link = screen.getAllByRole('link')[0] as HTMLAnchorElement;
  expect(link.href).toContain('/projects/proj-222/procurement');
});

// 3. Project with status 'deployment': link goes to /projects/$id/deployment
test('project with status deployment has link to /projects/$id/deployment', () => {
  renderList([makeProject({ id: 'proj-333', project_status: 'deployment' })]);
  const link = screen.getAllByRole('link')[0] as HTMLAnchorElement;
  expect(link.href).toContain('/projects/proj-333/deployment');
});

// 4. Project with status 'financial_close': link goes to /projects/$id/financials
test('project with status financial_close has link to /projects/$id/financials', () => {
  renderList([makeProject({ id: 'proj-444', project_status: 'financial_close' })]);
  const link = screen.getAllByRole('link')[0] as HTMLAnchorElement;
  expect(link.href).toContain('/projects/proj-444/financials');
});

// 5. Project with status 'completed': link goes to /projects/$id/financials
test('project with status completed has link to /projects/$id/financials', () => {
  renderList([makeProject({ id: 'proj-555', project_status: 'completed' })]);
  const link = screen.getAllByRole('link')[0] as HTMLAnchorElement;
  expect(link.href).toContain('/projects/proj-555/financials');
});
