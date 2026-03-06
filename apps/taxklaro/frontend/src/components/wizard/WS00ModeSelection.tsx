import type { WizardFormData } from '@/types/wizard';

export type WizardMode = 'ANNUAL' | 'QUARTERLY' | 'PENALTY';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
}

export function WS00ModeSelection(_props: Props) {
  return null;
}

export default WS00ModeSelection;
