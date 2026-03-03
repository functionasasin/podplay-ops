/**
 * SettlementTrackStep — Step 6: Settlement Track selection (§4.18)
 * Stub — implementation in next iteration.
 */

import type { SettlementTrackStepState } from '@/types/intake';

export interface SettlementTrackStepProps {
  state: SettlementTrackStepState;
  onStateChange: (state: SettlementTrackStepState) => void;
  onNext: () => void;
  onBack: () => void;
}

export function SettlementTrackStep(_props: SettlementTrackStepProps) {
  return <div data-testid="settlement-track-step">Settlement track step stub</div>;
}
