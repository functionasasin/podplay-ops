import type { WizardFormData, WizardStepId } from '@/types/wizard';

/**
 * Computes the ordered list of active wizard steps based on current form state.
 * Matches spec §7.3 routing matrix exactly.
 *
 * Key rules:
 * - WS05 (compensation) shown only for MIXED_INCOME
 * - 8% flat path (WS11) shown only when: PURELY_SE + not VAT-registered + gross ≤ ₱3M
 * - Otherwise WS06 (expense method) is shown
 * - WS07A/B/C shown when ELECT_ITEMIZED or (no electedRegime AND osdElected === false)
 * - WS07D shown only when NOLCO entries exist
 * - WS09 (prior quarterly) shown only for non-ANNUAL filing periods
 */
export function computeActiveSteps(input: Partial<WizardFormData>): WizardStepId[] {
  const steps: WizardStepId[] = ['WS00', 'WS01', 'WS02', 'WS03', 'WS04'];

  if (input.taxpayerType === 'MIXED_INCOME') steps.push('WS05');

  const grossReceiptsNum = parseFloat(input.grossReceipts ?? '0');  // NOT grossReceiptsAmount
  const eightPctEligible =
    input.taxpayerType === 'PURELY_SE' &&    // NOT 'PURELY_SELF_EMPLOYED'
    !input.isVatRegistered &&                 // NOT vatStatus check
    grossReceiptsNum <= 3_000_000;

  if (!eightPctEligible) {
    steps.push('WS06');
    // electedRegime === 'ELECT_ITEMIZED' or osdElected === false → show itemized steps
    const showItemized =
      input.electedRegime === 'ELECT_ITEMIZED' ||
      (input.electedRegime == null && input.osdElected === false);
    if (showItemized) {
      steps.push('WS07A', 'WS07B', 'WS07C');
      const hasNolco = (input.itemizedExpenses?.nolcoEntries?.length ?? 0) > 0;
      if (hasNolco) steps.push('WS07D');
    }
  } else {
    steps.push('WS11');
  }

  steps.push('WS08');
  // filingPeriod is 'Q1'|'Q2'|'Q3' for quarterly — NOT 'QUARTERLY'
  if (input.filingPeriod !== 'ANNUAL' && input.filingPeriod != null) steps.push('WS09');
  steps.push('WS10', 'WS12', 'WS13');

  return steps;
}
