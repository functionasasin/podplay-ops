/**
 * ConflictCheckStep — Step 1: Conflict Check gate (§4.18 + §4.17)
 * Stub — implementation in next iteration.
 */

import type { ConflictCheckStepState } from '@/types/intake';

export interface ConflictCheckStepProps {
  state: ConflictCheckStepState;
  onStateChange: (state: ConflictCheckStepState) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function ConflictCheckStep(_props: ConflictCheckStepProps) {
  return <div data-testid="conflict-check-step">Conflict check step stub</div>;
}
