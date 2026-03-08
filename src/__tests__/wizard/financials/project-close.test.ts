// Tests: GoLive — project close flow
// Stage 120: close button blocked when invoices unpaid or deployment incomplete,
// confirmation dialog appears before close, successful close sets status=completed + completed_at.

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';

// --- Hoist Supabase mock ---
const { mockFrom, buildMockFrom } = vi.hoisted(() => {
  type ProjectData = {
    project_name: string;
    venue_name: string;
    project_status: string;
    go_live_date: string | null;
    notes: string | null;
    completed_at: string | null;
  };
  type InvoiceRow = { id: string; invoice_type: string; status: string };
  type ChecklistItem = { id: string; is_completed: boolean };

  function buildMockFrom(opts: {
    projectData: ProjectData;
    invoices: InvoiceRow[];
    checklist: ChecklistItem[];
    updateResult?: { error: null | { message: string } };
  }) {
    return (table: string) => {
      if (table === 'projects') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({ data: opts.projectData, error: null }),
            })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue(opts.updateResult ?? { error: null }),
          })),
        };
      }
      if (table === 'invoices') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: opts.invoices, error: null }),
          })),
        };
      }
      if (table === 'deployment_checklist') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: opts.checklist, error: null }),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        })),
      };
    };
  }

  const DEFAULT_PROJECT: ProjectData = {
    project_name: 'Test Project',
    venue_name: 'Test Venue',
    project_status: 'deployment',
    go_live_date: null,
    notes: null,
    completed_at: null,
  };
  const DEFAULT_INVOICES: InvoiceRow[] = [
    { id: 'inv-1', invoice_type: 'deposit', status: 'paid' },
    { id: 'inv-2', invoice_type: 'final', status: 'sent' },
  ];
  const DEFAULT_CHECKLIST: ChecklistItem[] = [
    { id: 'c1', is_completed: true },
    { id: 'c2', is_completed: true },
    { id: 'c3', is_completed: true },
  ];

  const mockFrom = vi.fn(
    buildMockFrom({
      projectData: DEFAULT_PROJECT,
      invoices: DEFAULT_INVOICES,
      checklist: DEFAULT_CHECKLIST,
    }),
  );

  return { mockFrom, buildMockFrom };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

import { GoLive } from '@/components/wizard/financials/GoLive';

const DEFAULT_PROJECT = {
  project_name: 'Test Project',
  venue_name: 'Test Venue',
  project_status: 'deployment',
  go_live_date: null as string | null,
  notes: null as string | null,
  completed_at: null as string | null,
};
const DEFAULT_INVOICES = [
  { id: 'inv-1', invoice_type: 'deposit', status: 'paid' },
  { id: 'inv-2', invoice_type: 'final', status: 'sent' },
];
const DEFAULT_CHECKLIST = [
  { id: 'c1', is_completed: true },
  { id: 'c2', is_completed: true },
  { id: 'c3', is_completed: true },
];

function setMock(opts: {
  projectData?: typeof DEFAULT_PROJECT;
  invoices?: typeof DEFAULT_INVOICES;
  checklist?: typeof DEFAULT_CHECKLIST;
  updateResult?: { error: null | { message: string } };
}) {
  mockFrom.mockImplementation(
    buildMockFrom({
      projectData: opts.projectData ?? DEFAULT_PROJECT,
      invoices: opts.invoices ?? DEFAULT_INVOICES,
      checklist: opts.checklist ?? DEFAULT_CHECKLIST,
      updateResult: opts.updateResult,
    }),
  );
}

beforeEach(() => {
  setMock({});
});

function renderGoLive(projectId = 'proj-1') {
  return render(React.createElement(GoLive, { projectId }));
}

async function waitForLoad() {
  await waitFor(() =>
    expect(screen.queryByText(/loading go-live data/i)).not.toBeInTheDocument(),
  );
}

// 1. Loading state renders
test('renders loading state initially', () => {
  renderGoLive();
  expect(screen.getByText(/loading go-live data/i)).toBeInTheDocument();
});

// 2. Close button is visible when canClose = true (all conditions met)
test('close project button is visible when all conditions are met', async () => {
  renderGoLive();
  await waitForLoad();
  expect(screen.getByTestId('close-project-btn')).toBeInTheDocument();
});

// 3. Close button is disabled when deployment is incomplete
test('close project button is disabled when deployment phases are incomplete', async () => {
  setMock({
    checklist: [
      { id: 'c1', is_completed: true },
      { id: 'c2', is_completed: false },
      { id: 'c3', is_completed: true },
    ],
  });
  renderGoLive();
  await waitForLoad();
  expect(screen.getByTestId('close-project-btn')).toBeDisabled();
});

// 4. Close button is disabled when deposit invoice is not paid
test('close project button is disabled when deposit invoice is not paid', async () => {
  setMock({
    invoices: [
      { id: 'inv-1', invoice_type: 'deposit', status: 'sent' },
      { id: 'inv-2', invoice_type: 'final', status: 'sent' },
    ],
  });
  renderGoLive();
  await waitForLoad();
  expect(screen.getByTestId('close-project-btn')).toBeDisabled();
});

// 5. Close button is disabled when final invoice has not been sent
test('close project button is disabled when final invoice is not sent', async () => {
  setMock({
    invoices: [
      { id: 'inv-1', invoice_type: 'deposit', status: 'paid' },
      { id: 'inv-2', invoice_type: 'final', status: 'draft' },
    ],
  });
  renderGoLive();
  await waitForLoad();
  expect(screen.getByTestId('close-project-btn')).toBeDisabled();
});

// 6. Confirmation dialog appears after clicking the close button
test('confirmation dialog appears when close project button is clicked', async () => {
  renderGoLive();
  await waitForLoad();

  fireEvent.click(screen.getByTestId('close-project-btn'));

  expect(screen.getByText(/close this project\?/i)).toBeInTheDocument();
});

// 7. Confirmation dialog contains venue_name in the message
test('confirmation dialog displays the venue name', async () => {
  renderGoLive();
  await waitForLoad();

  fireEvent.click(screen.getByTestId('close-project-btn'));

  expect(screen.getByText(/Test Venue/)).toBeInTheDocument();
});

// 8. Clicking Cancel in the confirmation dialog hides it
test('cancel button in confirmation dialog hides the dialog', async () => {
  renderGoLive();
  await waitForLoad();

  fireEvent.click(screen.getByTestId('close-project-btn'));
  expect(screen.getByText(/close this project\?/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
  expect(screen.queryByText(/close this project\?/i)).not.toBeInTheDocument();
});

// 9. Successful close calls update with status='completed' and completed_at set
test('successful close updates project with status=completed and completed_at', async () => {
  const updateSpy = vi.fn(() => ({
    eq: vi.fn().mockResolvedValue({ error: null }),
  }));

  mockFrom.mockImplementation((table: string) => {
    if (table === 'projects') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: DEFAULT_PROJECT, error: null }),
          })),
        })),
        update: updateSpy,
      };
    }
    if (table === 'invoices') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: DEFAULT_INVOICES, error: null }),
        })),
      };
    }
    if (table === 'deployment_checklist') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: DEFAULT_CHECKLIST, error: null }),
        })),
      };
    }
    return { select: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) })) };
  });

  renderGoLive();
  await waitForLoad();

  fireEvent.click(screen.getByTestId('close-project-btn'));
  fireEvent.click(screen.getByRole('button', { name: /mark complete/i }));

  await waitFor(() => {
    expect(updateSpy).toHaveBeenCalled();
    const updateArg = updateSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(updateArg.project_status).toBe('completed');
    expect(typeof updateArg.completed_at).toBe('string');
    expect(new Date(updateArg.completed_at as string).getFullYear()).toBeGreaterThanOrEqual(2026);
  });
});

// 10. Completed banner shows when project is already closed
test('completed banner is shown when project status is already completed', async () => {
  setMock({
    projectData: {
      project_name: 'Closed Project',
      venue_name: 'Closed Venue',
      project_status: 'completed',
      go_live_date: '2026-01-15',
      notes: null,
      completed_at: '2026-01-15T10:00:00Z',
    },
  });

  renderGoLive();
  await waitForLoad();

  // Completed banner with date should appear
  expect(screen.getByText(/project completed on/i)).toBeInTheDocument();
  // Close Project section should not be shown
  expect(screen.queryByTestId('close-project-btn')).not.toBeInTheDocument();
});
