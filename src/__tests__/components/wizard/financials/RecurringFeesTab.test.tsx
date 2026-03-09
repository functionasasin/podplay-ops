import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecurringFeesTab } from '@/components/wizard/financials/RecurringFeesTab';

// ── Supabase mock ────────────────────────────────────────────────────────────

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Universal chain: every method returns chain, single() / then are both wired.
function makeChain(data: unknown[], error: null | { message: string } = null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chain: any = {};
  chain.select = () => chain;
  chain.insert = () => chain;
  chain.update = () => chain;
  chain.delete = () => chain;
  chain.eq = () => chain;
  chain.order = () => chain;
  chain.limit = () => chain;
  chain.single = () => Promise.resolve({ data: data[0] ?? null, error });
  chain.then = (
    onfulfilled: (v: unknown) => unknown,
    onrejected?: (e: unknown) => unknown,
  ) => Promise.resolve({ data, error }).then(onfulfilled, onrejected);
  return chain;
}

// ── Types + helpers ──────────────────────────────────────────────────────────

type FeeFrequency = 'monthly' | 'quarterly' | 'annually';

interface FeeRow {
  id: string;
  label: string;
  description: null | string;
  amount: number;
  frequency: FeeFrequency;
  start_date: string;
  end_date: null | string;
  is_active: boolean;
  vendor: null | string;
  notes: null | string;
}

function makeFee(
  overrides: Partial<FeeRow> & {
    id: string;
    label: string;
    amount: number;
    frequency: FeeFrequency;
  },
): FeeRow {
  return {
    description: null,
    start_date: '2025-01-01',
    end_date: null,
    is_active: true,
    vendor: null,
    notes: null,
    ...overrides,
  };
}

const PROJECT_ID = 'proj-test-123';

async function renderLoaded(fees: FeeRow[]) {
  mockFrom.mockReturnValue(makeChain(fees));
  render(<RecurringFeesTab projectId={PROJECT_ID} />);
  await waitFor(() =>
    expect(screen.queryByText('Loading recurring fees...')).toBeNull(),
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('RecurringFeesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('RF-01: renders empty state when no fees exist', async () => {
    await renderLoaded([]);
    expect(
      screen.getByText('No recurring fees recorded yet.'),
    ).toBeInTheDocument();
  });

  it('RF-02: renders table with fee data', async () => {
    const fees = [
      makeFee({ id: 'f1', label: 'Replay License', amount: 100, frequency: 'monthly' }),
      makeFee({ id: 'f2', label: 'Starlink', amount: 300, frequency: 'quarterly', vendor: 'SpaceX' }),
    ];
    await renderLoaded(fees);
    expect(screen.getByText('Replay License')).toBeInTheDocument();
    expect(screen.getByText('Starlink')).toBeInTheDocument();
    expect(screen.getByText('SpaceX')).toBeInTheDocument();
    // Table headers are present
    const headers = screen.getAllByRole('columnheader').map((th) => th.textContent?.trim());
    expect(headers).toContain('Label');
    expect(headers).toContain('Amount');
    expect(headers).toContain('Frequency');
  });

  it('RF-03: Add Fee button opens add form', async () => {
    await renderLoaded([]);
    fireEvent.click(screen.getByText('Add Fee'));
    expect(screen.getByText('New Recurring Fee')).toBeInTheDocument();
    expect(screen.getByText('Save Fee')).toBeInTheDocument();
  });

  it('RF-04: Cancel button after opening add form hides the form', async () => {
    await renderLoaded([]);
    fireEvent.click(screen.getByText('Add Fee'));
    expect(screen.getByText('New Recurring Fee')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('New Recurring Fee')).toBeNull();
  });

  it('RF-05: Edit button shows inline edit form pre-filled with fee data', async () => {
    const fees = [
      makeFee({ id: 'f1', label: 'Replay License', amount: 100, frequency: 'monthly' }),
    ];
    await renderLoaded(fees);
    fireEvent.click(screen.getByText('Edit'));
    // Label input should be pre-filled
    const labelInput = document.querySelector('input[name="label"]') as HTMLInputElement;
    expect(labelInput).not.toBeNull();
    expect(labelInput.value).toBe('Replay License');
    // Save and Cancel buttons appear in edit row
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('RF-06: Delete button opens confirm dialog', async () => {
    const fees = [
      makeFee({ id: 'f1', label: 'Replay License', amount: 100, frequency: 'monthly' }),
    ];
    await renderLoaded(fees);
    fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByText('Delete Recurring Fee?')).toBeInTheDocument();
  });

  // ── Monthly equivalent calculation tests ──────────────────────────────────

  it('RF-07: monthly fee of $100 → $100.00/mo total', async () => {
    await renderLoaded([
      makeFee({ id: 'f1', label: 'Monthly Fee', amount: 100, frequency: 'monthly' }),
    ]);
    const tfoot = document.querySelector('tfoot');
    expect(tfoot?.textContent).toContain('$100.00');
  });

  it('RF-08: quarterly fee of $300 → $100.00/mo total', async () => {
    await renderLoaded([
      makeFee({ id: 'f1', label: 'Quarterly Fee', amount: 300, frequency: 'quarterly' }),
    ]);
    const tfoot = document.querySelector('tfoot');
    // 300 / 3 = 100 per month
    expect(tfoot?.textContent).toContain('$100.00');
  });

  it('RF-09: annually fee of $1200 → $100.00/mo total', async () => {
    await renderLoaded([
      makeFee({ id: 'f1', label: 'Annual Fee', amount: 1200, frequency: 'annually' }),
    ]);
    const tfoot = document.querySelector('tfoot');
    // 1200 / 12 = 100 per month
    expect(tfoot?.textContent).toContain('$100.00');
  });

  it('RF-10: summary row shows correct total across mixed frequencies', async () => {
    // monthly $100 = $100/mo
    // quarterly $300 = $100/mo
    // annually $1200 = $100/mo
    // total = $300/mo
    const fees = [
      makeFee({ id: 'f1', label: 'Monthly Fee', amount: 100, frequency: 'monthly' }),
      makeFee({ id: 'f2', label: 'Quarterly Fee', amount: 300, frequency: 'quarterly' }),
      makeFee({ id: 'f3', label: 'Annual Fee', amount: 1200, frequency: 'annually' }),
    ];
    await renderLoaded(fees);
    const tfoot = document.querySelector('tfoot');
    expect(tfoot?.textContent).toContain('$300.00');
    expect(tfoot?.textContent).toContain('Total Monthly Recurring');
  });

  it('RF-11: inactive fees are excluded from total', async () => {
    const fees = [
      makeFee({ id: 'f1', label: 'Active Fee', amount: 100, frequency: 'monthly' }),
      makeFee({ id: 'f2', label: 'Inactive Fee', amount: 500, frequency: 'monthly', is_active: false }),
    ];
    await renderLoaded(fees);
    const tfoot = document.querySelector('tfoot');
    // Only active fee (100) should be in total
    expect(tfoot?.textContent).toContain('$100.00');
  });
});
