import type { WizardFormData } from '@/types/wizard';

export type ExpenseInputMethod = 'ITEMIZED' | 'OSD' | 'NO_EXPENSES';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function WS06ExpenseMethod(_props: Props) {
  return null;
}

export default WS06ExpenseMethod;
