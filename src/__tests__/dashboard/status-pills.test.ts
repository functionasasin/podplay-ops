// Stage 038 — Tests: Status Pills
// Verifies status pills, tier badges, date formatting, and progress formatting in ProjectList.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ProjectList, type Project } from '@/components/dashboard/ProjectList';

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'test-id',
    customer_name: 'Test Customer',
    venue_name: 'Test Venue',
    project_status: 'intake',
    tier: 'pro',
    go_live_date: null,
    deployment_progress_pct: undefined,
    ...overrides,
  };
}

function renderProjectList(project: Project) {
  return render(React.createElement(ProjectList, { projects: [project] }));
}

// ─── project_status labels ────────────────────────────────────────────────────

describe('project_status labels', () => {
  const cases: Array<[Project['project_status'], string]> = [
    ['intake',          'Intake'],
    ['procurement',     'Procurement'],
    ['deployment',      'Deployment'],
    ['financial_close', 'Financial Close'],
    ['completed',       'Completed'],
    ['cancelled',       'Cancelled'],
  ];

  it.each(cases)('status "%s" renders label "%s"', (status, label) => {
    renderProjectList(makeProject({ project_status: status }));
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

// ─── project_status badge classes ─────────────────────────────────────────────

describe('project_status badge classes', () => {
  const cases: Array<[Project['project_status'], string]> = [
    ['intake',          'bg-slate-400'],
    ['procurement',     'bg-yellow-400'],
    ['deployment',      'bg-blue-500'],
    ['financial_close', 'bg-orange-400'],
    ['completed',       'bg-green-500'],
    ['cancelled',       'bg-red-400'],
  ];

  it.each(cases)('status "%s" dot has class "%s"', (status, expectedClass) => {
    const { container } = renderProjectList(makeProject({ project_status: status }));
    // The dot is a span with the badge class applied
    const dot = container.querySelector(`span.${expectedClass}`);
    expect(dot).not.toBeNull();
  });
});

// ─── tier badges ──────────────────────────────────────────────────────────────

describe('tier badges', () => {
  it('tier "pro" renders label "PRO" with blue styling', () => {
    const { container } = renderProjectList(makeProject({ tier: 'pro' }));
    expect(screen.getByText('PRO')).toBeInTheDocument();
    const badge = container.querySelector('span.bg-blue-100');
    expect(badge).not.toBeNull();
  });

  it('tier "autonomous" renders label "AUTO" with purple styling', () => {
    const { container } = renderProjectList(makeProject({ tier: 'autonomous' }));
    expect(screen.getByText('AUTO')).toBeInTheDocument();
    const badge = container.querySelector('span.bg-purple-100');
    expect(badge).not.toBeNull();
  });

  it('tier "autonomous_plus" renders label "A+" with indigo styling', () => {
    const { container } = renderProjectList(makeProject({ tier: 'autonomous_plus' }));
    expect(screen.getByText('A+')).toBeInTheDocument();
    const badge = container.querySelector('span.bg-indigo-100');
    expect(badge).not.toBeNull();
  });

  it('tier "pbk" renders label "PBK" with orange styling', () => {
    const { container } = renderProjectList(makeProject({ tier: 'pbk' }));
    expect(screen.getByText('PBK')).toBeInTheDocument();
    const badge = container.querySelector('span.bg-orange-100');
    expect(badge).not.toBeNull();
  });
});

// ─── go-live date formatting ──────────────────────────────────────────────────

describe('go-live date formatting', () => {
  it('formats ISO date to display string (not raw ISO)', () => {
    renderProjectList(makeProject({ go_live_date: '2026-03-15' }));
    // Should NOT show raw ISO string
    expect(screen.queryByText('2026-03-15')).toBeNull();
    // Should show formatted date like "Mar 15, 2026"
    expect(screen.getByText('Mar 15, 2026')).toBeInTheDocument();
  });

  it('renders em dash when go_live_date is null', () => {
    const { container } = renderProjectList(makeProject({ go_live_date: null }));
    // em dash character U+2014
    expect(container.textContent).toContain('—');
  });
});

// ─── progress percentage formatting ──────────────────────────────────────────

describe('deployment progress formatting', () => {
  it('formats raw integer to percentage string', () => {
    renderProjectList(makeProject({ deployment_progress_pct: 63 }));
    // Should NOT show raw 0–100 decimal without %
    expect(screen.queryByText('63')).toBeNull();
    // Should show formatted percentage
    expect(screen.getByText('63%')).toBeInTheDocument();
  });

  it('formats 0 progress as "0%"', () => {
    renderProjectList(makeProject({ deployment_progress_pct: 0 }));
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders em dash when deployment_progress_pct is undefined', () => {
    const { container } = renderProjectList(makeProject({ deployment_progress_pct: undefined }));
    expect(container.textContent).toContain('—');
  });
});
