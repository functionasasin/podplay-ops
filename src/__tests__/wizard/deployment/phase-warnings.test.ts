// Tests: PhaseWarnings — PoE budget, UPS runtime, circuit load warning banners

import { render, screen } from '@testing-library/react';
import React from 'react';

// ─── Stub Supabase so bom.ts imports without env vars ───────────────────────
const { mockSupabaseFrom } = vi.hoisted(() => {
  const mockSupabaseFrom = vi.fn();
  return { mockSupabaseFrom };
});

vi.mock('@/lib/supabase', () => ({
  supabase: { from: mockSupabaseFrom },
}));

import { PhaseWarnings } from '@/components/wizard/deployment/PhaseWarnings';
import * as powerModule from '@/services/power';
import type { PowerSummary } from '@/services/power';

// ─── helpers ────────────────────────────────────────────────────────────────

function makeSummary(overrides: Partial<PowerSummary>): PowerSummary {
  return {
    totalPoeLoad: 160,
    switchSku: 'NET-USW-PRO-24-POE',
    switchQty: 1,
    switchBudgetPerUnit: 400,
    poeLoadPerSwitch: 160,
    poeBudgetUtilizationPct: 40,
    poeOverBudget: false,
    poeBudgetWarning: null,
    totalUpsLoad: 262,
    estimatedRuntimeMin: 54,
    upsWarning: null,
    totalRackU: 7,
    recommendedRackSize: 9,
    availableRackU: 2,
    circuitAmpRequired: 20,
    circuitLoadW: 262,
    circuitWarning: null,
    ...overrides,
  };
}

// ─── 1. No warnings — 4-court Pro ───────────────────────────────────────────

test('renders nothing (null) when no warnings — 4-court Pro', () => {
  // 4-court Pro: PoE 160W < 340W threshold; UPS runtime ~54 min; circuit 262W < 1600W
  const { container } = render(
    React.createElement(PhaseWarnings, {
      courtCount: 4,
      securityCameraCount: 0,
      tier: 'pro',
    }),
  );
  expect(container.firstChild).toBeNull();
});

test('phase-warnings container absent when no warnings', () => {
  render(
    React.createElement(PhaseWarnings, {
      courtCount: 4,
      securityCameraCount: 0,
      tier: 'pro',
    }),
  );
  expect(screen.queryByTestId('phase-warnings')).toBeNull();
});

// ─── 2. PoE budget warning — 13-court Pro ───────────────────────────────────

test('shows PoE budget warning when load per switch exceeds 85% threshold', () => {
  // 13-court Pro: PoE = 13×40 = 520W; switch USW-Pro-48-POE (600W, threshold 510W)
  // loadPerSwitch 520W > 510W → PoE warning fires (UPS warning may also fire)
  render(
    React.createElement(PhaseWarnings, {
      courtCount: 13,
      securityCameraCount: 0,
      tier: 'pro',
    }),
  );
  expect(screen.getByTestId('phase-warnings')).toBeInTheDocument();
  const alerts = screen.getAllByRole('alert');
  const poeAlert = alerts.find((a) => a.textContent?.includes('PoE load per switch'));
  expect(poeAlert).toBeDefined();
  expect(poeAlert).toHaveTextContent('PoE load per switch');
});

test('PoE warning banner has warning (yellow) level styling', () => {
  render(
    React.createElement(PhaseWarnings, {
      courtCount: 13,
      securityCameraCount: 0,
      tier: 'pro',
    }),
  );
  const alerts = screen.getAllByRole('alert');
  const poeAlert = alerts.find((a) => a.textContent?.includes('PoE load per switch'));
  expect(poeAlert?.className).toContain('yellow');
});

test('no PoE warning when within safe threshold — 8-court Pro (320W < 340W)', () => {
  // 8-court Pro: PoE = 320W, threshold = 340W → no warning
  const { container } = render(
    React.createElement(PhaseWarnings, {
      courtCount: 8,
      securityCameraCount: 0,
      tier: 'pro',
    }),
  );
  expect(container.firstChild).toBeNull();
});

// ─── 3. UPS runtime yellow warning — 16-court Pro ───────────────────────────

test('shows yellow UPS warning when runtime is between 15 and 30 minutes', () => {
  // 16-court Pro: UPS load ≈ 751W → runtime ≈ 19 min → yellow UPS warning
  // (PoE warning also fires at 16 courts; find the UPS alert by text)
  render(
    React.createElement(PhaseWarnings, {
      courtCount: 16,
      securityCameraCount: 0,
      tier: 'pro',
    }),
  );
  expect(screen.getByTestId('phase-warnings')).toBeInTheDocument();
  const alerts = screen.getAllByRole('alert');
  const upsAlert = alerts.find((a) => a.textContent?.includes('Estimated UPS runtime'));
  expect(upsAlert).toBeDefined();
  expect(upsAlert).toHaveTextContent('Sufficient for brief outages');
});

test('UPS warning banner at 16-court Pro has warning (yellow) level', () => {
  render(
    React.createElement(PhaseWarnings, {
      courtCount: 16,
      securityCameraCount: 0,
      tier: 'pro',
    }),
  );
  const alerts = screen.getAllByRole('alert');
  const upsAlert = alerts.find((a) => a.textContent?.includes('Estimated UPS runtime'));
  expect(upsAlert?.className).toContain('yellow');
});

// ─── 4. UPS runtime critical — 17-court autonomous_plus + 8 cameras ─────────

test('shows critical UPS warning when runtime is below 15 minutes', () => {
  // 17-court autonomous_plus + 8 cameras: UPS load ≈ 959W → runtime ≈ 14.9 min < 15 → critical
  render(
    React.createElement(PhaseWarnings, {
      courtCount: 17,
      securityCameraCount: 8,
      tier: 'autonomous_plus',
    }),
  );
  expect(screen.getByTestId('phase-warnings')).toBeInTheDocument();
  const alerts = screen.getAllByRole('alert');
  const upsAlert = alerts.find((a) => a.textContent?.includes('Estimated UPS runtime'));
  expect(upsAlert).toBeDefined();
  expect(upsAlert).toHaveTextContent('higher-capacity UPS');
});

test('critical UPS banner has critical (red) styling when runtime < 15 min', () => {
  render(
    React.createElement(PhaseWarnings, {
      courtCount: 17,
      securityCameraCount: 8,
      tier: 'autonomous_plus',
    }),
  );
  const alerts = screen.getAllByRole('alert');
  const upsAlert = alerts.find((a) => a.textContent?.includes('Estimated UPS runtime'));
  expect(upsAlert?.className).toContain('red');
});

// ─── 5. Circuit warning via mock ─────────────────────────────────────────────

test('shows circuit warning banner when UPS load exceeds 1600W', () => {
  const mockLoad = 1650;
  vi.spyOn(powerModule, 'calcPowerSummary').mockReturnValueOnce(
    makeSummary({
      totalUpsLoad: mockLoad,
      circuitLoadW: mockLoad,
      circuitWarning:
        `Total rack load (${mockLoad}W) approaches the 20A circuit limit (1920W max at 80% NEC). ` +
        `Contact venue electrician to confirm circuit capacity before proceeding.`,
    }),
  );
  render(
    React.createElement(PhaseWarnings, {
      courtCount: 4,
      securityCameraCount: 0,
      tier: 'pro',
    }),
  );
  expect(screen.getByTestId('phase-warnings')).toBeInTheDocument();
  const alert = screen.getByRole('alert');
  expect(alert).toHaveTextContent('20A circuit limit');
  expect(alert.className).toContain('red');
});

test('no circuit warning when load below 1600W', () => {
  // 4-court Pro UPS load ~262W — well below 1600W
  const { container } = render(
    React.createElement(PhaseWarnings, {
      courtCount: 4,
      securityCameraCount: 0,
      tier: 'pro',
    }),
  );
  expect(container.firstChild).toBeNull();
});

// ─── 6. Multiple warnings coexist ───────────────────────────────────────────

test('renders multiple warning banners when multiple thresholds exceeded', () => {
  vi.spyOn(powerModule, 'calcPowerSummary').mockReturnValueOnce(
    makeSummary({
      poeOverBudget: true,
      poeBudgetWarning:
        'PoE load per switch (520W) exceeds 85% safe threshold (510W). Consider upgrading to USW-Pro-48-POE or adding a second switch.',
      estimatedRuntimeMin: 20,
      upsWarning:
        'Estimated UPS runtime is 20 minutes. Sufficient for brief outages; automated shutdown recommended for extended outages.',
    }),
  );
  render(
    React.createElement(PhaseWarnings, {
      courtCount: 4,
      securityCameraCount: 0,
      tier: 'pro',
    }),
  );
  const alerts = screen.getAllByRole('alert');
  expect(alerts).toHaveLength(2);
  expect(alerts[0]).toHaveTextContent('PoE load per switch');
  expect(alerts[1]).toHaveTextContent('Estimated UPS runtime');
});
