/**
 * ShareBreakdownSection — expandable per-heir breakdown (§4.12).
 * Stub: will be implemented in the next iteration.
 */
import type { InheritanceShare } from '../../types';

export interface ShareBreakdownSectionProps {
  shares: InheritanceShare[];
}

export function ShareBreakdownSection({ shares: _shares }: ShareBreakdownSectionProps) {
  return <div data-testid="share-breakdown-section" />;
}
