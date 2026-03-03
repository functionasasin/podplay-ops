/**
 * ClientDetailsStep — Step 2: Client details (§4.18 + §4.3)
 * Stub — implementation in next iteration.
 */

import type { ClientDetailsStepState } from '@/types/intake';

export interface ClientDetailsStepProps {
  state: ClientDetailsStepState;
  onStateChange: (state: ClientDetailsStepState) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ClientDetailsStep(_props: ClientDetailsStepProps) {
  return <div data-testid="client-details-step">Client details step stub</div>;
}
