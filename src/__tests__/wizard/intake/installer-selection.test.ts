// Tests: InstallerSelectionStep — Supabase fetch, dropdown options, loading/empty states,
// installer_id form state, disabled Next until selected.

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// --- Hoist mock helpers ---
const { mockFrom, mockSelect, mockThen, resolvers } = vi.hoisted(() => {
  const resolvers: Array<(result: { data: unknown[] | null }) => void> = [];

  const mockThen = vi.fn((callback: (result: { data: unknown[] | null }) => void) => {
    resolvers.push((result) => callback(result));
    return { catch: vi.fn() };
  });

  const mockSelect = vi.fn(() => ({ then: mockThen }));
  const mockFrom = vi.fn(() => ({ select: mockSelect }));

  return { mockFrom, mockSelect, mockThen, resolvers };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

import { InstallerSelectionStep } from '@/components/wizard/intake/InstallerSelectionStep';

const INSTALLERS = [
  { id: 'inst-1', name: 'Alpha Install Co', location: 'Denver, CO' },
  { id: 'inst-2', name: 'Beta Networks', location: 'Austin, TX' },
  { id: 'inst-3', name: 'Gamma Pro AV', location: null },
];

function resolveLatest(data: unknown[] | null) {
  const resolve = resolvers.pop();
  if (resolve) resolve({ data });
}

function renderStep(onNext = vi.fn()) {
  return render(React.createElement(InstallerSelectionStep, { onNext }));
}

beforeEach(() => {
  mockFrom.mockClear();
  mockSelect.mockClear();
  mockThen.mockClear();
  resolvers.length = 0;
  mockThen.mockImplementation((callback: (result: { data: unknown[] | null }) => void) => {
    resolvers.push((result) => callback(result));
    return { catch: vi.fn() };
  });
});

// 1. Loading state shows spinner/loading message before data loads
test('shows loading message while fetching installers', () => {
  renderStep();
  expect(screen.getByLabelText('loading')).toBeInTheDocument();
  resolveLatest([]);
});

// 2. Dropdown renders all 3 installer names after data loads
test('renders all 3 installer names in the dropdown', async () => {
  renderStep();
  resolveLatest(INSTALLERS);
  await waitFor(() => {
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
  expect(screen.getByRole('option', { name: /Alpha Install Co/ })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: /Beta Networks/ })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: /Gamma Pro AV/ })).toBeInTheDocument();
});

// 3. Installer names with location include the location in option text
test('installer with location shows name and location in option', async () => {
  renderStep();
  resolveLatest(INSTALLERS);
  await waitFor(() => {
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
  expect(screen.getByRole('option', { name: 'Alpha Install Co — Denver, CO' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Beta Networks — Austin, TX' })).toBeInTheDocument();
});

// 4. Selecting an installer stores the correct installer_id and calls onNext
test('selecting an installer and submitting calls onNext with correct installer_id', async () => {
  const onNext = vi.fn();
  renderStep(onNext);
  resolveLatest(INSTALLERS);
  await waitFor(() => {
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'inst-2' } });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(onNext).toHaveBeenCalledWith({ installer_id: 'inst-2' });
  });
});

// 5. Continue button is disabled when no installer is selected
test('Continue button is disabled when no installer selected', async () => {
  renderStep();
  resolveLatest(INSTALLERS);
  await waitFor(() => {
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
  const button = screen.getByRole('button', { name: /continue/i }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
});

// 6. Continue button is enabled after selecting an installer
test('Continue button is enabled after selecting an installer', async () => {
  renderStep();
  resolveLatest(INSTALLERS);
  await waitFor(() => {
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
  fireEvent.change(screen.getByRole('combobox'), { target: { value: 'inst-1' } });
  const button = screen.getByRole('button', { name: /continue/i }) as HTMLButtonElement;
  expect(button.disabled).toBe(false);
});

// 7. Empty state shows "no installers" message when query returns []
test('shows "No installers found" when query returns empty array', async () => {
  renderStep();
  resolveLatest([]);
  await waitFor(() => {
    expect(screen.getByText(/No installers found/i)).toBeInTheDocument();
  });
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
});
