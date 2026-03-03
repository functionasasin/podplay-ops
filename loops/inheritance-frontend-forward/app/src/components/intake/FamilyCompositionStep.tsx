/**
 * FamilyCompositionStep — Step 4: Family Composition / Heirs (§4.18)
 * Stub — implementation in next iteration.
 */

import type { FamilyCompositionStepState } from '@/types/intake';

export interface FamilyCompositionStepProps {
  state: FamilyCompositionStepState;
  onStateChange: (state: FamilyCompositionStepState) => void;
  onNext: () => void;
  onBack: () => void;
}

export function FamilyCompositionStep(_props: FamilyCompositionStepProps) {
  return <div data-testid="family-composition-step">Family composition step stub</div>;
}
