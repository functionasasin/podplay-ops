/**
 * DecedentInfoStep — Step 3: About the Decedent (§4.18)
 * Stub — implementation in next iteration.
 */

import type { DecedentInfoStepState } from '@/types/intake';

export interface DecedentInfoStepProps {
  state: DecedentInfoStepState;
  onStateChange: (state: DecedentInfoStepState) => void;
  onNext: () => void;
  onBack: () => void;
}

export function DecedentInfoStep(_props: DecedentInfoStepProps) {
  return <div data-testid="decedent-info-step">Decedent info step stub</div>;
}
