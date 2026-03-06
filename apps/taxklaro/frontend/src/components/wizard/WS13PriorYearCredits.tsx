import type { WizardFormData } from '@/types/wizard';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function WS13PriorYearCredits(_props: Props) {
  return null;
}

export default WS13PriorYearCredits;
