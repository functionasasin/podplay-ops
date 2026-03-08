// Tests: HerCalculation — HER ratio calculation and color-coded display
// HER = hardware_revenue / team_hardware_spend
// Thresholds (from spec + implementation):
//   < 1.0   → loss       → red    (text-red-700)
//   1.0–1.5 → break_even → yellow (text-yellow-600)
//   1.5–2.0 → healthy    → green  (text-green-600)
//   >= 2.0  → strong     → green  (text-green-800)
//
// Note: stage 118 description listed HER=1.4→red, HER=1.7→yellow, HER=2.5→green
// but the spec/implementation thresholds give HER=1.4→yellow, HER=1.7→green, HER=2.5→green.
// Tests reflect actual implementation behavior.

import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

// --- Hoist Supabase mock ---
const { mockFrom } = vi.hoisted(() => {
  // Default: 2 snapshots giving known HER
  // hardware_revenue total = 30000, team_hardware_spend total = 15000 → HER = 2.0
  const DEFAULT_SNAPSHOTS = [
    {
      period_year: 2026,
      period_month: 2,
      hardware_revenue: 15000,
      team_hardware_spend: 7500,
      her_ratio: 2.0,
    },
    {
      period_year: 2026,
      period_month: 1,
      hardware_revenue: 15000,
      team_hardware_spend: 7500,
      her_ratio: 2.0,
    },
  ];

  const mockFrom = vi.fn((_table: string) => ({
    select: vi.fn(() => ({
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: DEFAULT_SNAPSHOTS, error: null }),
    })),
  }));

  return { mockFrom };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockFrom },
}));

import { HerCalculation } from '@/components/wizard/financials/HerCalculation';

function renderHer() {
  return render(React.createElement(HerCalculation));
}

async function waitForLoad() {
  await waitFor(() =>
    expect(screen.queryByText(/loading her data/i)).not.toBeInTheDocument(),
  );
}

// Helper: set snapshots so period HER = hardware_revenue_total / spend_total
function mockSnapshots(snapshots: {
  period_year: number;
  period_month: number;
  hardware_revenue: number;
  team_hardware_spend: number;
  her_ratio: number | null;
}[]) {
  mockFrom.mockImplementation((_table: string) => ({
    select: vi.fn(() => ({
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: snapshots, error: null }),
    })),
  }));
}

// 1. HER ratio calculated correctly with known values
// hardware_revenue=30000, team_hardware_spend=15000 → HER = 2.00
test('HER ratio calculated correctly from known values', async () => {
  mockSnapshots([
    {
      period_year: 2026,
      period_month: 3,
      hardware_revenue: 30000,
      team_hardware_spend: 15000,
      her_ratio: 2.0,
    },
  ]);
  renderHer();
  await waitForLoad();
  // Period HER = 30000 / 15000 = 2.00
  expect(screen.getByTestId('her-ratio')).toHaveTextContent('2.00');
});

// 2. HER ratio with fractional result (hardware_revenue=17000, spend=10000 → 1.70)
test('HER ratio is correct for fractional result', async () => {
  mockSnapshots([
    {
      period_year: 2026,
      period_month: 3,
      hardware_revenue: 17000,
      team_hardware_spend: 10000,
      her_ratio: 1.7,
    },
  ]);
  renderHer();
  await waitForLoad();
  // Period HER = 17000 / 10000 = 1.70
  expect(screen.getByTestId('her-ratio')).toHaveTextContent('1.70');
});

// 3. Color = red when HER < 1.0 (loss zone)
// hardware_revenue=8000, team_hardware_spend=10000 → HER=0.80 → loss → text-red-700
test('her-ratio element has red color class when HER is in loss zone (< 1.0)', async () => {
  mockSnapshots([
    {
      period_year: 2026,
      period_month: 3,
      hardware_revenue: 8000,
      team_hardware_spend: 10000,
      her_ratio: 0.8,
    },
  ]);
  renderHer();
  await waitForLoad();
  const ratioEl = screen.getByTestId('her-ratio');
  expect(ratioEl.className).toContain('red');
});

// 4. Color = yellow when HER = 1.4 (break-even zone: 1.0–1.5)
// hardware_revenue=14000, team_hardware_spend=10000 → HER=1.40 → break_even → text-yellow-600
test('her-ratio element has yellow color class when HER = 1.4 (break-even zone)', async () => {
  mockSnapshots([
    {
      period_year: 2026,
      period_month: 3,
      hardware_revenue: 14000,
      team_hardware_spend: 10000,
      her_ratio: 1.4,
    },
  ]);
  renderHer();
  await waitForLoad();
  const ratioEl = screen.getByTestId('her-ratio');
  expect(ratioEl.className).toContain('yellow');
});

// 5. Color = green when HER = 2.5 (strong zone: >= 2.0)
// hardware_revenue=25000, team_hardware_spend=10000 → HER=2.50 → strong → text-green-800
test('her-ratio element has green color class when HER = 2.5 (strong zone)', async () => {
  mockSnapshots([
    {
      period_year: 2026,
      period_month: 3,
      hardware_revenue: 25000,
      team_hardware_spend: 10000,
      her_ratio: 2.5,
    },
  ]);
  renderHer();
  await waitForLoad();
  const ratioEl = screen.getByTestId('her-ratio');
  expect(ratioEl.className).toContain('green');
});

// 6. HER = null when team_hardware_spend = 0 (no division by zero)
test('HER displays dash when team_hardware_spend is zero', async () => {
  mockSnapshots([
    {
      period_year: 2026,
      period_month: 3,
      hardware_revenue: 20000,
      team_hardware_spend: 0,
      her_ratio: null,
    },
  ]);
  renderHer();
  await waitForLoad();
  expect(screen.getByTestId('her-ratio')).toHaveTextContent('—');
});

// 7. Status badge renders for break-even zone
test('status badge shows Break-even label when HER is in break-even zone', async () => {
  mockSnapshots([
    {
      period_year: 2026,
      period_month: 3,
      hardware_revenue: 12000,
      team_hardware_spend: 10000,
      her_ratio: 1.2,
    },
  ]);
  renderHer();
  await waitForLoad();
  expect(screen.getByTestId('her-status-badge')).toHaveTextContent(/break-even/i);
});

// 8. Status badge renders for loss zone
test('status badge shows Loss label when HER is in loss zone', async () => {
  mockSnapshots([
    {
      period_year: 2026,
      period_month: 3,
      hardware_revenue: 5000,
      team_hardware_spend: 10000,
      her_ratio: 0.5,
    },
  ]);
  renderHer();
  await waitForLoad();
  expect(screen.getByTestId('her-status-badge')).toHaveTextContent(/loss/i);
});

// 9. Status badge renders for strong zone
test('status badge shows Strong label when HER >= 2.0', async () => {
  mockSnapshots([
    {
      period_year: 2026,
      period_month: 3,
      hardware_revenue: 25000,
      team_hardware_spend: 10000,
      her_ratio: 2.5,
    },
  ]);
  renderHer();
  await waitForLoad();
  expect(screen.getByTestId('her-status-badge')).toHaveTextContent(/strong/i);
});

// 10. Multi-month aggregate: period HER = sum(revenue) / sum(spend)
// Month A: 12000 / 5000, Month B: 8000 / 5000 → total 20000 / 10000 = 2.00
test('period HER aggregates multiple monthly snapshots', async () => {
  mockSnapshots([
    {
      period_year: 2026,
      period_month: 3,
      hardware_revenue: 12000,
      team_hardware_spend: 5000,
      her_ratio: 2.4,
    },
    {
      period_year: 2026,
      period_month: 2,
      hardware_revenue: 8000,
      team_hardware_spend: 5000,
      her_ratio: 1.6,
    },
  ]);
  renderHer();
  await waitForLoad();
  // Total: 20000 / 10000 = 2.00
  expect(screen.getByTestId('her-ratio')).toHaveTextContent('2.00');
});
