// Tests: InstallerSelectionStep — Supabase fetch, MultiSelect options, loading/empty states,
// installer_ids form state (array), chips display, chip removal, disabled Next until selected.

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

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

const INSTALLERS = [
  { id: 'inst-1', name: 'Alpha Install Co', company: 'Alpha Corp', regions: ['Denver, CO'] },
  { id: 'inst-2', name: 'Beta Networks', company: null, regions: ['Austin, TX'] },
  { id: 'inst-3', name: 'Gamma Pro AV', company: null, regions: null },
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

// 2. SearchableSelect renders all 3 installer names after data loads
test('renders all 3 installer names in the dropdown', async () => {
  renderStep();
  resolveLatest(INSTALLERS);
  await waitFor(() => {
    expect(screen.getByPlaceholderText(/Select an installer/i)).toBeInTheDocument();
  });
  const input = screen.getByPlaceholderText(/Select an installer/i);
  fireEvent.focus(input);
  expect(screen.getByRole('option', { name: /Alpha Install Co/ })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: /Beta Networks/ })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: /Gamma Pro AV/ })).toBeInTheDocument();
});

// 3. Installer with company shows company name in option label
test('installer with company shows name and company in option', async () => {
  renderStep();
  resolveLatest(INSTALLERS);
  await waitFor(() => {
    expect(screen.getByPlaceholderText(/Select an installer/i)).toBeInTheDocument();
  });
  const input = screen.getByPlaceholderText(/Select an installer/i);
  fireEvent.focus(input);
  expect(screen.getByRole('option', { name: 'Alpha Install Co (Alpha Corp)' })).toBeInTheDocument();
  expect(screen.getByRole('option', { name: 'Beta Networks' })).toBeInTheDocument();
});

// 4. Selecting an installer stores the correct installer_ids and calls onNext
test('selecting an installer and submitting calls onNext with correct installer_ids', async () => {
  const onNext = vi.fn();
  renderStep(onNext);
  resolveLatest(INSTALLERS);
  await waitFor(() => {
    expect(screen.getByPlaceholderText(/Select an installer/i)).toBeInTheDocument();
  });
  const input = screen.getByPlaceholderText(/Select an installer/i);
  fireEvent.focus(input);
  fireEvent.mouseDown(screen.getByRole('option', { name: 'Beta Networks' }));
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(onNext).toHaveBeenCalledWith({ installer_ids: ['inst-2'] });
  });
});

// 5. Continue button is disabled when no installer is selected
test('Continue button is disabled when no installer selected', async () => {
  renderStep();
  resolveLatest(INSTALLERS);
  await waitFor(() => {
    expect(screen.getByPlaceholderText(/Select an installer/i)).toBeInTheDocument();
  });
  const button = screen.getByRole('button', { name: /continue/i }) as HTMLButtonElement;
  expect(button.disabled).toBe(true);
});

// 6. Continue button is enabled after selecting an installer
test('Continue button is enabled after selecting an installer', async () => {
  renderStep();
  resolveLatest(INSTALLERS);
  await waitFor(() => {
    expect(screen.getByPlaceholderText(/Select an installer/i)).toBeInTheDocument();
  });
  const input = screen.getByPlaceholderText(/Select an installer/i);
  fireEvent.focus(input);
  fireEvent.mouseDown(screen.getByRole('option', { name: 'Alpha Install Co (Alpha Corp)' }));
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
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
});

// 8. Selecting an installer shows it as a removable chip
test('selected installer appears as a chip with remove button', async () => {
  renderStep();
  resolveLatest(INSTALLERS);
  await waitFor(() => {
    expect(screen.getByPlaceholderText(/Select an installer/i)).toBeInTheDocument();
  });
  const input = screen.getByPlaceholderText(/Select an installer/i);
  fireEvent.focus(input);
  fireEvent.mouseDown(screen.getByRole('option', { name: 'Alpha Install Co (Alpha Corp)' }));
  expect(screen.getByRole('button', { name: /Remove Alpha Install Co/i })).toBeInTheDocument();
});

// 9. Multiple installers can be selected and all show as chips
test('can select multiple installers and both appear as chips', async () => {
  renderStep();
  resolveLatest(INSTALLERS);
  await waitFor(() => {
    expect(screen.getByPlaceholderText(/Select an installer/i)).toBeInTheDocument();
  });
  // select first
  const input = screen.getByPlaceholderText(/Select an installer/i);
  fireEvent.focus(input);
  fireEvent.mouseDown(screen.getByRole('option', { name: 'Alpha Install Co (Alpha Corp)' }));
  // dropdown stays open — select second
  fireEvent.mouseDown(screen.getByRole('option', { name: 'Beta Networks' }));
  // both chips are present
  expect(screen.getByRole('button', { name: /Remove Alpha Install Co/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Remove Beta Networks/i })).toBeInTheDocument();
});

// 10. Removing a chip deselects that installer and disables Continue again
test('removing a chip deselects the installer', async () => {
  renderStep();
  resolveLatest(INSTALLERS);
  await waitFor(() => {
    expect(screen.getByPlaceholderText(/Select an installer/i)).toBeInTheDocument();
  });
  const input = screen.getByPlaceholderText(/Select an installer/i);
  fireEvent.focus(input);
  fireEvent.mouseDown(screen.getByRole('option', { name: 'Alpha Install Co (Alpha Corp)' }));
  // chip + enabled Continue
  expect(screen.getByRole('button', { name: /Remove Alpha Install Co/i })).toBeInTheDocument();
  // remove chip
  fireEvent.click(screen.getByRole('button', { name: /Remove Alpha Install Co/i }));
  // chip gone, Continue disabled
  expect(screen.queryByRole('button', { name: /Remove Alpha Install Co/i })).not.toBeInTheDocument();
  const continueBtn = screen.getByRole('button', { name: /continue/i }) as HTMLButtonElement;
  expect(continueBtn.disabled).toBe(true);
});

// 11. Submitting with two installers calls onNext with array of two IDs
test('submitting with two selected installers calls onNext with array of two IDs', async () => {
  const onNext = vi.fn();
  renderStep(onNext);
  resolveLatest(INSTALLERS);
  await waitFor(() => {
    expect(screen.getByPlaceholderText(/Select an installer/i)).toBeInTheDocument();
  });
  const input = screen.getByPlaceholderText(/Select an installer/i);
  fireEvent.focus(input);
  fireEvent.mouseDown(screen.getByRole('option', { name: 'Alpha Install Co (Alpha Corp)' }));
  fireEvent.mouseDown(screen.getByRole('option', { name: 'Beta Networks' }));
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(onNext).toHaveBeenCalledWith({ installer_ids: ['inst-1', 'inst-2'] });
  });
});
