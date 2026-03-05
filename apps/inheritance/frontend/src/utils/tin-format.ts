/**
 * TIN (Tax Identification Number) formatting utility.
 * Format: XXX-XXX-XXX or XXX-XXX-XXX-XXX (9 or 12 digit)
 */

/**
 * Auto-inserts hyphens into a raw TIN string as user types.
 * Strips non-digit characters first, then inserts hyphens at positions 3, 6, and 9.
 */
export function formatTIN(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 12);
  if (digits.length === 0) return '';

  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 3) {
    parts.push(digits.slice(i, i + 3));
  }
  return parts.join('-');
}
