// Tests: Intake route — wizard_step persistence, redirect on non-intake status

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// --- Hoist navigate mock ---
const { mockNavigate } = vi.hoisted(() => {
  const mockNavigate = vi.fn();
  return { mockNavigate };
});

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (config: { component: React.ComponentType }) => ({
    ...config,
    useParams: () => ({ projectId: 'proj-test-id' }),
  }),
  useNavigate: () => mockNavigate,
}));

// --- Hoist supabase mock helpers ---
const { mockFrom, mockSingle, mockUpdate, mockUpdateEq } = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockUpdateEq = vi.fn(() => Promise.resolve({ error: null }));
  const mockUpdate = vi.fn(() => ({ eq: mockUpdateEq }));
  const mockSelectEq = vi.fn(() => ({ single: mockSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockSelectEq }));
  const mockFrom = vi.fn(() => ({ select: mockSelect, update: mockUpdate }));
  return { mockFrom, mockSingle, mockUpdate, mockUpdateEq };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

// Mock wizard step components to avoid form complexity
vi.mock('@/components/wizard/intake/CustomerInfoStep', () => ({
  CustomerInfoStep: ({ onNext }: { onNext: (data: unknown) => void }) =>
    React.createElement(
      'button',
      { 'data-testid': 'customer-next', onClick: () => onNext({ customer_name: 'Test' }) },
      'CustomerNext',
    ),
}));
vi.mock('@/components/wizard/intake/VenueConfigStep', () => ({
  VenueConfigStep: () => React.createElement('div', null, 'VenueConfig'),
}));
vi.mock('@/components/wizard/intake/TierSelectionStep', () => ({
  TierSelectionStep: () => React.createElement('div', null, 'TierSelection'),
}));
vi.mock('@/components/wizard/intake/IspInfoStep', () => ({
  IspInfoStep: () => React.createElement('div', null, 'IspInfo'),
}));
vi.mock('@/components/wizard/intake/InstallerSelectionStep', () => ({
  InstallerSelectionStep: () => React.createElement('div', null, 'InstallerSelection'),
}));
vi.mock('@/components/wizard/intake/FinancialSetupStep', () => ({
  FinancialSetupStep: () => React.createElement('div', null, 'FinancialSetup'),
}));
vi.mock('@/components/wizard/intake/ReviewStep', () => ({
  ReviewStep: () => React.createElement('div', null, 'Review'),
}));
vi.mock('@/lib/toast', () => ({
  showToast: vi.fn(),
}));
vi.mock('@/services/bom', () => ({
  generateBom: vi.fn(() => Promise.resolve({ error: null })),
}));

import { IntakePage as _IntakePage } from '@/routes/_auth/projects/$projectId/intake';

// The route file exports `Route`, not `IntakePage` directly; grab the component from Route
import * as IntakeModule from '@/routes/_auth/projects/$projectId/intake';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IntakePage = (IntakeModule as any).Route?.component ?? IntakeModule.default;

function renderPage() {
  return render(React.createElement(IntakePage));
}

function resolveSelect(data: { wizard_step?: number; project_status: string } | null) {
  mockSingle.mockResolvedValueOnce({ data });
}

beforeEach(() => {
  vi.clearAllMocks();
  const mockSelectEq = vi.fn(() => ({ single: mockSingle }));
  const mockSelect = vi.fn(() => ({ eq: mockSelectEq }));
  mockFrom.mockImplementation(() => ({ select: mockSelect, update: mockUpdate }));
  mockUpdateEq.mockResolvedValue({ error: null });
});

// 1. New project (wizard_step=0): wizard starts at step 0
test('new project with wizard_step=0 starts wizard at step 1 (Step 1: Customer Info)', async () => {
  resolveSelect({ wizard_step: 0, project_status: 'intake' });
  renderPage();
  await waitFor(() => {
    expect(screen.getByText(/Step 1: Customer Info/i)).toBeInTheDocument();
  });
});

// 2. Existing project (wizard_step=3): wizard starts at step 3
test('existing project with wizard_step=3 starts wizard at step 4 (Step 4: ISP Info)', async () => {
  resolveSelect({ wizard_step: 3, project_status: 'intake' });
  renderPage();
  await waitFor(() => {
    expect(screen.getByText(/Step 4: ISP Info/i)).toBeInTheDocument();
  });
});

// 3. Step transition calls supabase update with new wizard_step
test('step transition calls supabase.update with new wizard_step', async () => {
  resolveSelect({ wizard_step: 0, project_status: 'intake' });
  renderPage();
  await waitFor(() => {
    expect(screen.getByTestId('customer-next')).toBeInTheDocument();
  });
  screen.getByTestId('customer-next').click();
  await waitFor(() => {
    expect(mockUpdate).toHaveBeenCalledWith({ wizard_step: 1 });
  });
});

// 4. Project with status 'procurement': redirects away from intake
test('project with status procurement redirects to procurement page', async () => {
  resolveSelect({ wizard_step: 0, project_status: 'procurement' });
  renderPage();
  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/projects/$projectId/procurement' }),
    );
  });
});

// 5. Project with status 'deployment': redirects to deployment page
test('project with status deployment redirects to deployment page', async () => {
  resolveSelect({ wizard_step: 2, project_status: 'deployment' });
  renderPage();
  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/projects/$projectId/deployment' }),
    );
  });
});
