// Tests: AppLayout renders sidebar nav links
// Mocks useAuth + TanStack Router primitives so no full router setup needed

import { render, screen } from '@testing-library/react';
import React from 'react';

// --- Stub TanStack Router ---
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) =>
    React.createElement('a', { href: to, className }, children),
  Outlet: () => null,
}));

// --- Stub useAuth with authenticated user ---
vi.mock('@/lib/auth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-1', email: 'ops@podplay.com' },
    session: { access_token: 'tok' },
    loading: false,
    signOut: vi.fn(),
    signIn: vi.fn(),
    signUp: vi.fn(),
  })),
}));

import { AppLayout } from '@/components/layout/AppLayout';

// 1. Sidebar element renders
test('AppLayout renders the sidebar element', () => {
  render(React.createElement(AppLayout));
  const sidebar = document.querySelector('aside');
  expect(sidebar).not.toBeNull();
});

// 2. App title "PodPlay Ops" is visible
test('AppLayout shows the app title "PodPlay Ops"', () => {
  render(React.createElement(AppLayout));
  // Title appears in both sidebar header and mobile header — at least one should be visible
  const titles = screen.getAllByText('PodPlay Ops');
  expect(titles.length).toBeGreaterThan(0);
});

// 3. Nav link for /projects
test('AppLayout renders a nav link to /projects', () => {
  render(React.createElement(AppLayout));
  const link = document.querySelector('a[href="/projects"]');
  expect(link).not.toBeNull();
});

// 4. Nav link for /inventory
test('AppLayout renders a nav link to /inventory', () => {
  render(React.createElement(AppLayout));
  const link = document.querySelector('a[href="/inventory"]');
  expect(link).not.toBeNull();
});

// 5. Nav link for /financials
test('AppLayout renders a nav link to /financials', () => {
  render(React.createElement(AppLayout));
  const link = document.querySelector('a[href="/financials"]');
  expect(link).not.toBeNull();
});

// 6. Nav link for /settings/pricing
test('AppLayout renders a nav link to /settings/pricing', () => {
  render(React.createElement(AppLayout));
  const link = document.querySelector('a[href="/settings/pricing"]');
  expect(link).not.toBeNull();
});

// 7. Sign-out button is present
test('AppLayout renders a sign-out button', () => {
  render(React.createElement(AppLayout));
  const btn = screen.getByRole('button', { name: /sign out/i });
  expect(btn).toBeInTheDocument();
});
