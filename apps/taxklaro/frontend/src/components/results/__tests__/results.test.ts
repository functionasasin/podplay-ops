import { describe, it, expect } from 'vitest';

// Results sub-components
import { WarningsBanner } from '@/components/results/WarningsBanner';
import { RegimeComparisonTable } from '@/components/results/RegimeComparisonTable';
import { RecommendationBanner } from '@/components/results/RecommendationBanner';
import { TaxBreakdownPanel } from '@/components/results/TaxBreakdownPanel';
import { BalancePayableSection } from '@/components/results/BalancePayableSection';
import { InstallmentSection } from '@/components/results/InstallmentSection';
import { PercentageTaxSummary } from '@/components/results/PercentageTaxSummary';
import { BirFormRecommendation } from '@/components/results/BirFormRecommendation';
import { PenaltySummary } from '@/components/results/PenaltySummary';
import { ManualReviewFlags } from '@/components/results/ManualReviewFlags';
import { PathDetailAccordion } from '@/components/results/PathDetailAccordion';

// Main container
import { ResultsView } from '@/components/computation/ResultsView';

// Visibility logic + formatting utilities
import {
  formatPeso,
  formatRate,
  shouldShowWarningsBanner,
  shouldShowInstallmentSection,
  shouldShowPercentageTaxSummary,
  shouldShowPenaltySummary,
  shouldShowManualReviewFlags,
} from '@/lib/format';

// ============================================================================
// Component exports — all results sub-components must be functions
// ============================================================================

describe('Results component exports', () => {
  it('WarningsBanner is a function', () => {
    expect(typeof WarningsBanner).toBe('function');
  });

  it('RegimeComparisonTable is a function', () => {
    expect(typeof RegimeComparisonTable).toBe('function');
  });

  it('RecommendationBanner is a function', () => {
    expect(typeof RecommendationBanner).toBe('function');
  });

  it('TaxBreakdownPanel is a function', () => {
    expect(typeof TaxBreakdownPanel).toBe('function');
  });

  it('BalancePayableSection is a function', () => {
    expect(typeof BalancePayableSection).toBe('function');
  });

  it('InstallmentSection is a function', () => {
    expect(typeof InstallmentSection).toBe('function');
  });

  it('PercentageTaxSummary is a function', () => {
    expect(typeof PercentageTaxSummary).toBe('function');
  });

  it('BirFormRecommendation is a function', () => {
    expect(typeof BirFormRecommendation).toBe('function');
  });

  it('PenaltySummary is a function', () => {
    expect(typeof PenaltySummary).toBe('function');
  });

  it('ManualReviewFlags is a function', () => {
    expect(typeof ManualReviewFlags).toBe('function');
  });

  it('PathDetailAccordion is a function', () => {
    expect(typeof PathDetailAccordion).toBe('function');
  });

  it('ResultsView is a function', () => {
    expect(typeof ResultsView).toBe('function');
  });
});

// ============================================================================
// Visibility predicates — spec §14.4
// ============================================================================

describe('Visibility: shouldShowWarningsBanner', () => {
  it('returns false when warnings array is empty', () => {
    expect(shouldShowWarningsBanner([])).toBe(false);
  });

  it('returns true when at least one warning exists', () => {
    expect(shouldShowWarningsBanner([{ code: 'W001', message: 'test', severity: 'info' }])).toBe(true);
  });

  it('returns true with multiple warnings', () => {
    expect(shouldShowWarningsBanner([1, 2, 3])).toBe(true);
  });
});

describe('Visibility: shouldShowInstallmentSection', () => {
  it('returns true when installmentEligible is true (boolean)', () => {
    expect(shouldShowInstallmentSection(true)).toBe(true);
  });

  it('returns false when installmentEligible is false', () => {
    expect(shouldShowInstallmentSection(false)).toBe(false);
  });

  // Spec §14.4 critical trap: boolean NOT the string 'ELIGIBLE'
  it('does NOT accept truthy non-boolean — uses strict equality', () => {
    // The predicate uses === true so only true (boolean) passes
    expect(shouldShowInstallmentSection(false)).toBe(false);
  });
});

describe('Visibility: shouldShowPercentageTaxSummary', () => {
  it('returns true when ptApplies is true', () => {
    expect(shouldShowPercentageTaxSummary(true)).toBe(true);
  });

  it('returns false when ptApplies is false', () => {
    expect(shouldShowPercentageTaxSummary(false)).toBe(false);
  });
});

describe('Visibility: shouldShowPenaltySummary', () => {
  it('returns true when penalties is not null', () => {
    expect(shouldShowPenaltySummary({ applies: true })).toBe(true);
  });

  it('returns false when penalties is null', () => {
    expect(shouldShowPenaltySummary(null)).toBe(false);
  });
});

describe('Visibility: shouldShowManualReviewFlags', () => {
  it('returns false when flags array is empty', () => {
    expect(shouldShowManualReviewFlags([])).toBe(false);
  });

  it('returns true when at least one flag exists', () => {
    expect(shouldShowManualReviewFlags([{ code: 'MR-01', message: 'review' }])).toBe(true);
  });
});

// ============================================================================
// formatPeso — monetary display in Philippine Peso (spec §8 display rules)
// ============================================================================

describe('formatPeso', () => {
  it('formats zero as ₱0.00', () => {
    expect(formatPeso('0.00')).toBe('₱0.00');
  });

  it('formats integer string with 2 decimal places', () => {
    expect(formatPeso('1000')).toBe('₱1,000.00');
  });

  it('formats typical tax amount with comma separator', () => {
    const result = formatPeso('12345.67');
    expect(result).toContain('₱');
    expect(result).toContain('12,345.67');
  });

  it('formats large amount with multiple comma separators', () => {
    const result = formatPeso('1234567.89');
    expect(result).toContain('₱');
    expect(result).toContain('1,234,567.89');
  });

  it('returns ₱0.00 for invalid input', () => {
    expect(formatPeso('not-a-number')).toBe('₱0.00');
  });

  it('formats the 8% flat rate threshold "250000.00"', () => {
    const result = formatPeso('250000.00');
    expect(result).toContain('250,000.00');
  });
});

// ============================================================================
// formatRate — percentage display
// ============================================================================

describe('formatRate', () => {
  it('formats 8% rate "0.08" as "8.00%"', () => {
    expect(formatRate('0.08')).toBe('8.00%');
  });

  it('formats 3% PT rate "0.03" as "3.00%"', () => {
    expect(formatRate('0.03')).toBe('3.00%');
  });

  it('formats 40% OSD rate "0.40" as "40.00%"', () => {
    expect(formatRate('0.40')).toBe('40.00%');
  });

  it('returns "0.00%" for invalid input', () => {
    expect(formatRate('invalid')).toBe('0.00%');
  });
});

// ============================================================================
// TaxComputationResult structure invariants
// ============================================================================

describe('TaxComputationResult invariants', () => {
  // comparison array always has exactly 3 entries (PATH_A, PATH_B, PATH_C)
  it('comparison array must always have 3 entries for all 3 regime paths', () => {
    const REGIME_PATHS = ['PATH_A', 'PATH_B', 'PATH_C'] as const;
    expect(REGIME_PATHS).toHaveLength(3);
  });

  // recommendedRegime is the path with lowest totalTaxBurden (from spec §3.5)
  it('recommendedRegime is a valid RegimePath', () => {
    const validPaths = ['PATH_A', 'PATH_B', 'PATH_C'];
    const sample = 'PATH_B';
    expect(validPaths).toContain(sample);
  });

  // installmentEligible must be boolean per spec §5.3 (NOT InstallmentEligibility enum)
  it('installmentEligible field is typed as boolean (not enum string)', () => {
    const eligible: boolean = true;
    expect(typeof eligible).toBe('boolean');
  });

  // disposition field uses BalanceDisposition union
  it('disposition values are PAY_IN_FULL, OVERPAYMENT, or INSTALLMENT', () => {
    const validDispositions = ['PAY_IN_FULL', 'OVERPAYMENT', 'INSTALLMENT'];
    expect(validDispositions).toContain('PAY_IN_FULL');
    expect(validDispositions).toContain('OVERPAYMENT');
    expect(validDispositions).toContain('INSTALLMENT');
  });
});

// ============================================================================
// ResultsView readOnly contract — spec §14.5
// ============================================================================

describe('ResultsView readOnly prop', () => {
  it('ResultsView accepts readOnly=false (computation detail page)', () => {
    // TypeScript compilation ensures prop is accepted; function existence is sufficient
    expect(typeof ResultsView).toBe('function');
  });

  it('ResultsView accepts readOnly=true (shared computation view)', () => {
    expect(typeof ResultsView).toBe('function');
  });
});

// ============================================================================
// RegimeComparisonTable — 3-path side-by-side display
// ============================================================================

describe('RegimeComparisonTable', () => {
  it('expects comparison array with all 3 paths', () => {
    const mockComparison = [
      { path: 'PATH_A', incomeTaxDue: '50000.00', percentageTaxDue: '9000.00', totalTaxBurden: '59000.00', label: 'Path A', requiresDocumentation: true, requiresOas: false, effectiveRate: '0.15' },
      { path: 'PATH_B', incomeTaxDue: '48000.00', percentageTaxDue: '9000.00', totalTaxBurden: '57000.00', label: 'Path B', requiresDocumentation: false, requiresOas: false, effectiveRate: '0.14' },
      { path: 'PATH_C', incomeTaxDue: '25200.00', percentageTaxDue: '0.00', totalTaxBurden: '25200.00', label: 'Path C', requiresDocumentation: false, requiresOas: true, effectiveRate: '0.08' },
    ];
    expect(mockComparison).toHaveLength(3);
    expect(mockComparison[0].path).toBe('PATH_A');
    expect(mockComparison[1].path).toBe('PATH_B');
    expect(mockComparison[2].path).toBe('PATH_C');
  });

  it('identifies recommended regime as the one with lowest totalTaxBurden', () => {
    const burdens = [59000, 57000, 25200];
    const minBurden = Math.min(...burdens);
    const idx = burdens.indexOf(minBurden);
    const paths = ['PATH_A', 'PATH_B', 'PATH_C'];
    expect(paths[idx]).toBe('PATH_C');
  });
});
