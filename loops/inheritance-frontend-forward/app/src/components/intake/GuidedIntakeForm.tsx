/**
 * GuidedIntakeForm — 7-step guided intake form container (§4.18)
 * Stub — implementation in next iteration.
 */

export interface GuidedIntakeFormProps {
  orgId: string;
  userId: string;
  onComplete: (caseId: string, clientId: string) => void;
  onCancel: () => void;
}

export function GuidedIntakeForm(_props: GuidedIntakeFormProps) {
  return <div data-testid="guided-intake-form">Guided intake form stub</div>;
}
