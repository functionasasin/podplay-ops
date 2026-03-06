import type { WizardFormData } from '@/types/wizard';

interface Props {
  data: Partial<WizardFormData>;
  onBack: () => void;
  onSubmit: () => void;
}

export function WizardReview(_props: Props) {
  return null;
}

export default WizardReview;
