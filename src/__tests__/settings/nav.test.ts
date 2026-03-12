// Stage 134 — Tests: Settings Nav
// Asserts all 5 tabs render (Pricing, Catalog, Team, Installers, Vendors)
// and each tab links to the correct route.

import { render, screen } from '@testing-library/react';
import React from 'react';

// ── Mock setup ───────────────────────────────────────────────────────────────

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => config,
  Link: ({
    to,
    children,
    className,
  }: {
    to: string;
    children: React.ReactNode;
    className?: string;
  }) => React.createElement('a', { href: to, className }, children),
  Outlet: () => null,
  useMatchRoute: vi.fn(() => (_params: unknown) => false),
}));

// ── Import after mocks ───────────────────────────────────────────────────────

import { Route } from '@/routes/_auth/settings';

function getSettingsLayout(): React.ComponentType {
  return (Route as unknown as { component: React.ComponentType }).component;
}

function renderLayout() {
  return render(React.createElement(getSettingsLayout()));
}

// ── Tests ────────────────────────────────────────────────────────────────────

// 1. All 5 tab labels render
test('renders all 5 tab labels', () => {
  renderLayout();
  expect(screen.getByText('Pricing')).toBeInTheDocument();
  expect(screen.getByText('Catalog')).toBeInTheDocument();
  expect(screen.getByText('Team')).toBeInTheDocument();
  expect(screen.getByText('Installers')).toBeInTheDocument();
  expect(screen.getByText('Vendors')).toBeInTheDocument();
});

// 2. Pricing tab links to /settings/pricing
test('Pricing tab links to /settings/pricing', () => {
  renderLayout();
  const link = screen.getByText('Pricing').closest('a');
  expect(link).not.toBeNull();
  expect(link!.getAttribute('href')).toBe('/settings/pricing');
});

// 3. Catalog tab links to /settings/catalog
test('Catalog tab links to /settings/catalog', () => {
  renderLayout();
  const link = screen.getByText('Catalog').closest('a');
  expect(link).not.toBeNull();
  expect(link!.getAttribute('href')).toBe('/settings/catalog');
});

// 4. Team tab links to /settings/team
test('Team tab links to /settings/team', () => {
  renderLayout();
  const link = screen.getByText('Team').closest('a');
  expect(link).not.toBeNull();
  expect(link!.getAttribute('href')).toBe('/settings/team');
});

// 5. Vendors tab links to /settings/vendors
test('Vendors tab links to /settings/vendors', () => {
  renderLayout();
  const link = screen.getByText('Vendors').closest('a');
  expect(link).not.toBeNull();
  expect(link!.getAttribute('href')).toBe('/settings/vendors');
});
