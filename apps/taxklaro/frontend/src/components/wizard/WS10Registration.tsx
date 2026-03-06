import type { WizardFormData } from '@/types/wizard';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export type VatStatus = 'YES' | 'NO';
export type BirRegistrationStatus = 'YES' | 'PLANNING';

export function WS10Registration(_props: Props) {
  return null;
}

export default WS10Registration;
