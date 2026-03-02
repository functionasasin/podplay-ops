import type { Donation, Person } from '../../types';

export type CollationStatus = 'collatable' | 'exempt' | 'stranger';

export interface CollationResult {
  status: CollationStatus;
  exemptionType?: string;
  article?: string;
}

/**
 * Determine the collation status of a donation based on its properties.
 * Stub — to be implemented in the next iteration.
 */
export function getDonationCollationStatus(
  _donation: Donation,
  _persons: Person[],
): CollationResult {
  // Stub: will be implemented
  return { status: 'collatable' };
}
