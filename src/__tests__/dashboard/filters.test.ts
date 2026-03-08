// Stage 040 — Tests: Dashboard Filters
// Verifies status/tier dropdowns, text search, AND logic, reset, and count label.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';

const { mockFrom, mockSelect } = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockFrom = vi.fn(() => ({ select: mockSelect }));
  return { mockFrom, mockSelect };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => config,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) =>
    React.createElement('a', { href: to }, children),
  Outlet: () => null,
}));

import { ProjectsPage } from '@/routes/_auth/projects/index';

const MOCK_PROJECTS = [
  { id: '1', customer_name: 'Alpha Corp', venue_name: 'Alpha Venue', project_status: 'intake', tier: 'pro', go_live_date: null },
  { id: '2', customer_name: 'Beta Corp', venue_name: 'Beta Venue', project_status: 'deployment', tier: 'pro', go_live_date: null },
  { id: '3', customer_name: 'Gamma Corp', venue_name: 'Gamma Spot', project_status: 'deployment', tier: 'autonomous', go_live_date: null },
  { id: '4', customer_name: 'Delta LLC', venue_name: 'Delta Place', project_status: 'completed', tier: 'autonomous', go_live_date: null },
  { id: '5', customer_name: 'Echo Inc', venue_name: 'Echo Bar', project_status: 'cancelled', tier: 'pbk', go_live_date: null },
];

beforeEach(() => {
  mockFrom.mockClear();
  mockSelect.mockClear();
  mockSelect.mockResolvedValue({ data: MOCK_PROJECTS, error: null });
});

async function renderLoaded() {
  const result = render(React.createElement(ProjectsPage));
  await waitFor(() => expect(document.querySelector('.animate-spin')).toBeNull());
  return result;
}

// ─── status filter ────────────────────────────────────────────────────────────

describe('status filter', () => {
  it('narrows list to only projects with selected status', async () => {
    await renderLoaded();
    fireEvent.change(screen.getByDisplayValue('All Statuses'), { target: { value: 'deployment' } });

    // deployment: Beta Venue, Gamma Spot
    expect(screen.getByText('Beta Venue')).toBeInTheDocument();
    expect(screen.getByText('Gamma Spot')).toBeInTheDocument();
    // other statuses hidden
    expect(screen.queryByText('Alpha Venue')).toBeNull();
    expect(screen.queryByText('Delta Place')).toBeNull();
    expect(screen.queryByText('Echo Bar')).toBeNull();
  });
});

// ─── tier filter ──────────────────────────────────────────────────────────────

describe('tier filter', () => {
  it('narrows list to only projects with selected tier', async () => {
    await renderLoaded();
    fireEvent.change(screen.getByDisplayValue('All Tiers'), { target: { value: 'autonomous' } });

    // autonomous: Gamma Spot, Delta Place
    expect(screen.getByText('Gamma Spot')).toBeInTheDocument();
    expect(screen.getByText('Delta Place')).toBeInTheDocument();
    // other tiers hidden
    expect(screen.queryByText('Alpha Venue')).toBeNull();
    expect(screen.queryByText('Beta Venue')).toBeNull();
    expect(screen.queryByText('Echo Bar')).toBeNull();
  });
});

// ─── text search — venue name ─────────────────────────────────────────────────

describe('text search by venue name', () => {
  it('matches venue name case-insensitively', async () => {
    await renderLoaded();
    fireEvent.change(screen.getByPlaceholderText('Search projects...'), { target: { value: 'ALPHA' } });

    expect(screen.getByText('Alpha Venue')).toBeInTheDocument();
    expect(screen.queryByText('Beta Venue')).toBeNull();
    expect(screen.queryByText('Gamma Spot')).toBeNull();
    expect(screen.queryByText('Delta Place')).toBeNull();
    expect(screen.queryByText('Echo Bar')).toBeNull();
  });
});

// ─── text search — customer name ──────────────────────────────────────────────

describe('text search by customer name', () => {
  it('matches customer name case-insensitively', async () => {
    await renderLoaded();
    fireEvent.change(screen.getByPlaceholderText('Search projects...'), { target: { value: 'echo inc' } });

    expect(screen.getByText('Echo Bar')).toBeInTheDocument();
    expect(screen.queryByText('Alpha Venue')).toBeNull();
    expect(screen.queryByText('Beta Venue')).toBeNull();
  });
});

// ─── AND logic (status + text) ────────────────────────────────────────────────

describe('combined status filter + text search (AND logic)', () => {
  it('applies both filters simultaneously', async () => {
    await renderLoaded();
    fireEvent.change(screen.getByDisplayValue('All Statuses'), { target: { value: 'deployment' } });
    fireEvent.change(screen.getByPlaceholderText('Search projects...'), { target: { value: 'gamma' } });

    // Only Gamma Spot passes both: deployment status AND name contains 'gamma'
    expect(screen.getByText('Gamma Spot')).toBeInTheDocument();
    // Beta Venue is deployment but name doesn't contain 'gamma'
    expect(screen.queryByText('Beta Venue')).toBeNull();
    expect(screen.queryByText('Alpha Venue')).toBeNull();
    expect(screen.queryByText('Delta Place')).toBeNull();
    expect(screen.queryByText('Echo Bar')).toBeNull();
  });
});

// ─── reset filter ─────────────────────────────────────────────────────────────

describe('resetting filters', () => {
  it('selecting "All" in status dropdown restores full list', async () => {
    const { container } = await renderLoaded();
    const statusSelect = container.querySelectorAll('select')[0];

    fireEvent.change(statusSelect, { target: { value: 'intake' } });
    expect(screen.queryByText('Beta Venue')).toBeNull();

    // Reset to all
    fireEvent.change(statusSelect, { target: { value: 'all' } });
    expect(screen.getByText('Alpha Venue')).toBeInTheDocument();
    expect(screen.getByText('Beta Venue')).toBeInTheDocument();
    expect(screen.getByText('Gamma Spot')).toBeInTheDocument();
    expect(screen.getByText('Delta Place')).toBeInTheDocument();
    expect(screen.getByText('Echo Bar')).toBeInTheDocument();
  });

  it('selecting "All" in tier dropdown restores full list', async () => {
    const { container } = await renderLoaded();
    const tierSelect = container.querySelectorAll('select')[1];

    fireEvent.change(tierSelect, { target: { value: 'pbk' } });
    expect(screen.queryByText('Alpha Venue')).toBeNull();

    // Reset to all
    fireEvent.change(tierSelect, { target: { value: 'all' } });
    expect(screen.getByText('Alpha Venue')).toBeInTheDocument();
    expect(screen.getByText('Beta Venue')).toBeInTheDocument();
    expect(screen.getByText('Echo Bar')).toBeInTheDocument();
  });
});

// ─── count label ──────────────────────────────────────────────────────────────

describe('filtered count label', () => {
  it('shows "Showing 5 of 5 projects" with no filter applied', async () => {
    await renderLoaded();
    expect(screen.getByText('Showing 5 of 5 projects')).toBeInTheDocument();
  });

  it('updates count after status filter narrows to 2', async () => {
    await renderLoaded();
    fireEvent.change(screen.getByDisplayValue('All Statuses'), { target: { value: 'deployment' } });
    expect(screen.getByText('Showing 2 of 5 projects')).toBeInTheDocument();
  });

  it('updates count after text search narrows to 1', async () => {
    await renderLoaded();
    fireEvent.change(screen.getByPlaceholderText('Search projects...'), { target: { value: 'gamma spot' } });
    expect(screen.getByText('Showing 1 of 5 projects')).toBeInTheDocument();
  });
});
