/**
 * IntakeReviewStep — Step 7: Review & Save (§4.18)
 * Stub — implementation in next iteration.
 */

import type { IntakeFormState } from '@/types/intake';

export interface IntakeReviewStepProps {
  state: IntakeFormState;
  onCreateCase: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function IntakeReviewStep(_props: IntakeReviewStepProps) {
  return <div data-testid="intake-review-step">Intake review step stub</div>;
}
