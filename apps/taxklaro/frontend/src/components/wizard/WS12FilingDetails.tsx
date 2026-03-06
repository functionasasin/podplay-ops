import type { WizardFormData } from '@/types/wizard';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export type ReturnTypeOption = 'ORIGINAL' | 'AMENDED';

export function WS12FilingDetails(_props: Props) {
  return null;
}

export default WS12FilingDetails;
