import type { Donation, Person } from '../../types';

export interface DonationsSummaryPanelProps {
  donations: Donation[];
  persons: Person[];
}

/**
 * DonationsSummaryPanel — shows all donations from EngineInput in the results view.
 * Stub — to be implemented in the next iteration.
 */
export function DonationsSummaryPanel({ donations }: DonationsSummaryPanelProps) {
  if (donations.length === 0) return null;

  return (
    <div data-testid="donations-summary-panel">
      {/* Stub: to be implemented */}
    </div>
  );
}
