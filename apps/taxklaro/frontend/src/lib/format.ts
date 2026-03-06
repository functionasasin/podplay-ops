/**
 * Format a Decimal string (e.g. "12345.67") as Philippine Peso with ₱ prefix.
 * Uses comma thousands separator and 2 decimal places.
 */
export function formatPeso(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return '₱0.00';
  return '₱' + num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Format a Rate string (e.g. "0.08") as percentage (e.g. "8.00%").
 */
export function formatRate(rate: string): string {
  const num = parseFloat(rate);
  if (isNaN(num)) return '0.00%';
  return (num * 100).toFixed(2) + '%';
}

/**
 * Visibility predicates matching spec §14.4
 */
export function shouldShowWarningsBanner(warnings: unknown[]): boolean {
  return warnings.length > 0;
}

export function shouldShowInstallmentSection(installmentEligible: boolean): boolean {
  return installmentEligible === true;
}

export function shouldShowPercentageTaxSummary(ptApplies: boolean): boolean {
  return ptApplies === true;
}

export function shouldShowPenaltySummary(penalties: unknown): boolean {
  return penalties !== null;
}

export function shouldShowManualReviewFlags(flags: unknown[]): boolean {
  return flags.length > 0;
}
