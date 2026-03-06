import { describe, it, expect } from 'vitest';
import { computeActiveSteps } from '@/lib/wizard-routing';
import type { WizardFormData } from '@/types/wizard';

// ============================================================================
// Helpers
// ============================================================================

function base(overrides: Partial<WizardFormData> = {}): Partial<WizardFormData> {
  return {
    taxpayerType: 'PURELY_SE',
    grossReceipts: '500000',
    isVatRegistered: false,
    filingPeriod: 'ANNUAL',
    electedRegime: null,
    osdElected: null,
    itemizedExpenses: {},
    ...overrides,
  };
}

// ============================================================================
// Base steps — always present
// ============================================================================

describe('computeActiveSteps — base steps', () => {
  it('always includes WS00 through WS04', () => {
    const steps = computeActiveSteps(base());
    expect(steps).toContain('WS00');
    expect(steps).toContain('WS01');
    expect(steps).toContain('WS02');
    expect(steps).toContain('WS03');
    expect(steps).toContain('WS04');
  });

  it('always includes WS08, WS10, WS12, WS13', () => {
    const steps = computeActiveSteps(base());
    expect(steps).toContain('WS08');
    expect(steps).toContain('WS10');
    expect(steps).toContain('WS12');
    expect(steps).toContain('WS13');
  });

  it('WS00 appears first', () => {
    const steps = computeActiveSteps(base());
    expect(steps[0]).toBe('WS00');
  });
});

// ============================================================================
// §7.3: MIXED_INCOME → WS05
// ============================================================================

describe('computeActiveSteps — WS05 compensation step', () => {
  it('includes WS05 for MIXED_INCOME', () => {
    const steps = computeActiveSteps(base({ taxpayerType: 'MIXED_INCOME' }));
    expect(steps).toContain('WS05');
  });

  it('does NOT include WS05 for PURELY_SE', () => {
    const steps = computeActiveSteps(base({ taxpayerType: 'PURELY_SE' }));
    expect(steps).not.toContain('WS05');
  });

  it('does NOT include WS05 for COMPENSATION_ONLY', () => {
    const steps = computeActiveSteps(base({ taxpayerType: 'COMPENSATION_ONLY' }));
    expect(steps).not.toContain('WS05');
  });
});

// ============================================================================
// §7.3: 8% eligibility → WS11 vs WS06
// ============================================================================

describe('computeActiveSteps — 8% eligibility (WS11 vs WS06)', () => {
  it('shows WS11 for 8%-eligible: PURELY_SE + not VAT + gross ≤ 3M', () => {
    const steps = computeActiveSteps(base({
      taxpayerType: 'PURELY_SE',
      isVatRegistered: false,
      grossReceipts: '2000000',
    }));
    expect(steps).toContain('WS11');
    expect(steps).not.toContain('WS06');
  });

  it('shows WS11 when gross is exactly 3,000,000', () => {
    const steps = computeActiveSteps(base({
      taxpayerType: 'PURELY_SE',
      isVatRegistered: false,
      grossReceipts: '3000000',
    }));
    expect(steps).toContain('WS11');
    expect(steps).not.toContain('WS06');
  });

  it('shows WS06 (not WS11) when gross exceeds 3,000,000', () => {
    const steps = computeActiveSteps(base({
      taxpayerType: 'PURELY_SE',
      isVatRegistered: false,
      grossReceipts: '3000001',
    }));
    expect(steps).toContain('WS06');
    expect(steps).not.toContain('WS11');
  });

  it('shows WS06 (not WS11) when VAT-registered even with low gross', () => {
    const steps = computeActiveSteps(base({
      taxpayerType: 'PURELY_SE',
      isVatRegistered: true,
      grossReceipts: '500000',
    }));
    expect(steps).toContain('WS06');
    expect(steps).not.toContain('WS11');
  });

  it('shows WS06 (not WS11) for MIXED_INCOME (not PURELY_SE)', () => {
    const steps = computeActiveSteps(base({
      taxpayerType: 'MIXED_INCOME',
      isVatRegistered: false,
      grossReceipts: '500000',
    }));
    expect(steps).toContain('WS06');
    expect(steps).not.toContain('WS11');
  });

  it('shows WS06 when grossReceipts is missing (defaults to 0 — eligible)', () => {
    // 0 ≤ 3M and PURELY_SE and not VAT → 8% eligible
    const steps = computeActiveSteps(base({ grossReceipts: undefined }));
    expect(steps).toContain('WS11');
    expect(steps).not.toContain('WS06');
  });
});

// ============================================================================
// §7.3: Itemized expense steps (WS07A/B/C/D)
// ============================================================================

describe('computeActiveSteps — itemized expense steps', () => {
  it('shows WS07A/B/C when electedRegime is ELECT_ITEMIZED', () => {
    const steps = computeActiveSteps(base({
      taxpayerType: 'PURELY_SE',
      grossReceipts: '5000000',  // Not 8% eligible → WS06 path
      isVatRegistered: false,
      electedRegime: 'ELECT_ITEMIZED',
    }));
    expect(steps).toContain('WS07A');
    expect(steps).toContain('WS07B');
    expect(steps).toContain('WS07C');
  });

  it('shows WS07A/B/C when electedRegime is null AND osdElected is false', () => {
    const steps = computeActiveSteps(base({
      taxpayerType: 'PURELY_SE',
      grossReceipts: '5000000',
      isVatRegistered: false,
      electedRegime: null,
      osdElected: false,
    }));
    expect(steps).toContain('WS07A');
    expect(steps).toContain('WS07B');
    expect(steps).toContain('WS07C');
  });

  it('does NOT show WS07A/B/C when electedRegime is ELECT_OSD', () => {
    const steps = computeActiveSteps(base({
      taxpayerType: 'PURELY_SE',
      grossReceipts: '5000000',
      isVatRegistered: false,
      electedRegime: 'ELECT_OSD',
    }));
    expect(steps).not.toContain('WS07A');
    expect(steps).not.toContain('WS07B');
    expect(steps).not.toContain('WS07C');
  });

  it('does NOT show WS07A/B/C when osdElected is null and electedRegime is null', () => {
    const steps = computeActiveSteps(base({
      taxpayerType: 'PURELY_SE',
      grossReceipts: '5000000',
      isVatRegistered: false,
      electedRegime: null,
      osdElected: null,
    }));
    expect(steps).not.toContain('WS07A');
  });

  it('does NOT show WS07A/B/C when osdElected is true and electedRegime is null', () => {
    const steps = computeActiveSteps(base({
      taxpayerType: 'PURELY_SE',
      grossReceipts: '5000000',
      isVatRegistered: false,
      electedRegime: null,
      osdElected: true,
    }));
    expect(steps).not.toContain('WS07A');
  });

  it('shows WS07D when NOLCO entries exist', () => {
    const steps = computeActiveSteps(base({
      taxpayerType: 'PURELY_SE',
      grossReceipts: '5000000',
      isVatRegistered: false,
      electedRegime: 'ELECT_ITEMIZED',
      itemizedExpenses: {
        nolcoEntries: [{
          lossYear: 2022,
          originalLoss: '100000.00',
          remainingBalance: '50000.00',
          expiryYear: 2025,
        }],
      },
    }));
    expect(steps).toContain('WS07D');
  });

  it('does NOT show WS07D when no NOLCO entries', () => {
    const steps = computeActiveSteps(base({
      taxpayerType: 'PURELY_SE',
      grossReceipts: '5000000',
      isVatRegistered: false,
      electedRegime: 'ELECT_ITEMIZED',
      itemizedExpenses: { nolcoEntries: [] },
    }));
    expect(steps).not.toContain('WS07D');
  });

  it('does NOT show WS07D when itemizedExpenses is empty object', () => {
    const steps = computeActiveSteps(base({
      taxpayerType: 'PURELY_SE',
      grossReceipts: '5000000',
      isVatRegistered: false,
      electedRegime: 'ELECT_ITEMIZED',
      itemizedExpenses: {},
    }));
    expect(steps).not.toContain('WS07D');
  });

  it('does NOT show itemized steps on 8%-eligible path even with ELECT_ITEMIZED', () => {
    // 8%-eligible path uses WS11, not WS06 — itemized steps skipped
    const steps = computeActiveSteps(base({
      taxpayerType: 'PURELY_SE',
      grossReceipts: '500000',
      isVatRegistered: false,
      electedRegime: 'ELECT_ITEMIZED',
    }));
    expect(steps).not.toContain('WS07A');
    expect(steps).not.toContain('WS07B');
    expect(steps).not.toContain('WS07C');
  });
});

// ============================================================================
// §7.3: Quarterly step (WS09)
// ============================================================================

describe('computeActiveSteps — quarterly step (WS09)', () => {
  it('shows WS09 for Q1 filing', () => {
    const steps = computeActiveSteps(base({ filingPeriod: 'Q1' }));
    expect(steps).toContain('WS09');
  });

  it('shows WS09 for Q2 filing', () => {
    const steps = computeActiveSteps(base({ filingPeriod: 'Q2' }));
    expect(steps).toContain('WS09');
  });

  it('shows WS09 for Q3 filing', () => {
    const steps = computeActiveSteps(base({ filingPeriod: 'Q3' }));
    expect(steps).toContain('WS09');
  });

  it('does NOT show WS09 for ANNUAL filing', () => {
    const steps = computeActiveSteps(base({ filingPeriod: 'ANNUAL' }));
    expect(steps).not.toContain('WS09');
  });

  it('does NOT show WS09 when filingPeriod is undefined', () => {
    const steps = computeActiveSteps(base({ filingPeriod: undefined }));
    expect(steps).not.toContain('WS09');
  });
});

// ============================================================================
// §7.3: Step ordering
// ============================================================================

describe('computeActiveSteps — step ordering', () => {
  it('WS06 appears before WS07A when both present', () => {
    const steps = computeActiveSteps(base({
      taxpayerType: 'PURELY_SE',
      grossReceipts: '5000000',
      isVatRegistered: false,
      electedRegime: 'ELECT_ITEMIZED',
    }));
    const ws06idx = steps.indexOf('WS06');
    const ws07aidx = steps.indexOf('WS07A');
    expect(ws06idx).toBeLessThan(ws07aidx);
  });

  it('WS07C appears before WS08', () => {
    const steps = computeActiveSteps(base({
      taxpayerType: 'PURELY_SE',
      grossReceipts: '5000000',
      isVatRegistered: false,
      electedRegime: 'ELECT_ITEMIZED',
    }));
    const ws07cidx = steps.indexOf('WS07C');
    const ws08idx = steps.indexOf('WS08');
    expect(ws07cidx).toBeLessThan(ws08idx);
  });

  it('WS08 appears before WS09 (quarterly)', () => {
    const steps = computeActiveSteps(base({
      filingPeriod: 'Q1',
      grossReceipts: '5000000',
      isVatRegistered: false,
    }));
    const ws08idx = steps.indexOf('WS08');
    const ws09idx = steps.indexOf('WS09');
    expect(ws08idx).toBeLessThan(ws09idx);
  });

  it('WS10, WS12, WS13 are always the last three', () => {
    const steps = computeActiveSteps(base());
    const last3 = steps.slice(-3);
    expect(last3).toEqual(['WS10', 'WS12', 'WS13']);
  });

  it('WS11 appears before WS08 on 8%-eligible path', () => {
    const steps = computeActiveSteps(base({
      taxpayerType: 'PURELY_SE',
      grossReceipts: '500000',
      isVatRegistered: false,
    }));
    const ws11idx = steps.indexOf('WS11');
    const ws08idx = steps.indexOf('WS08');
    expect(ws11idx).toBeLessThan(ws08idx);
  });
});

// ============================================================================
// §7.3: Empty/default input
// ============================================================================

describe('computeActiveSteps — edge cases', () => {
  it('handles empty input without throwing', () => {
    expect(() => computeActiveSteps({})).not.toThrow();
  });

  it('returns minimal steps for empty input', () => {
    const steps = computeActiveSteps({});
    // PURELY_SE (undefined) is falsy so not MIXED_INCOME → no WS05
    // taxpayerType undefined → not PURELY_SE → not 8%-eligible → WS06
    expect(steps).toContain('WS00');
    expect(steps).toContain('WS04');
    expect(steps).toContain('WS13');
  });

  it('handles grossReceipts as "0" — 8% eligible by default', () => {
    const steps = computeActiveSteps({
      taxpayerType: 'PURELY_SE',
      isVatRegistered: false,
      grossReceipts: '0',
    });
    expect(steps).toContain('WS11');
    expect(steps).not.toContain('WS06');
  });
});

// ============================================================================
// Module exports
// ============================================================================

describe('module exports', () => {
  it('computeActiveSteps is a function', () => {
    expect(typeof computeActiveSteps).toBe('function');
  });

  it('returns an array', () => {
    expect(Array.isArray(computeActiveSteps({}))).toBe(true);
  });
});
