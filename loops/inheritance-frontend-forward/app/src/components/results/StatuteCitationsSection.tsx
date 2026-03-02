/**
 * StatuteCitationsSection — renders legal_basis[] as chips with expandable
 * article descriptions (spec §4.5).
 *
 * Displayed in the expanded heir row, below the ShareBreakdownSection.
 * When `forcedExpanded` is true (print mode), all descriptions are shown
 * without requiring a click.
 */

export interface StatuteCitationsSectionProps {
  legalBasis: string[];
  heirName: string;
  forcedExpanded?: boolean;
}

export function StatuteCitationsSection(_props: StatuteCitationsSectionProps) {
  return null;
}
