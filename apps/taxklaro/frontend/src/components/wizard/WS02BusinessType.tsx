import type { WizardFormData } from '@/types/wizard';

export type BusinessCategory =
  | 'PROFESSIONAL_SERVICES'
  | 'REGULATED_PROFESSIONAL'
  | 'TRADER'
  | 'MIXED_BUSINESS'
  | 'NOT_SURE';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function WS02BusinessType(_props: Props) {
  return null;
}

export default WS02BusinessType;
