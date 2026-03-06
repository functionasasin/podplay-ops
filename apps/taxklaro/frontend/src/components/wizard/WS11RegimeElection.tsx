import type { WizardFormData } from '@/types/wizard';

interface Props {
  data: Partial<WizardFormData>;
  onChange: (updates: Partial<WizardFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export type RegimeElectionOption = 'ELECT_EIGHT_PCT' | 'ELECT_OSD' | 'ELECT_ITEMIZED' | null;

export function WS11RegimeElection(_props: Props) {
  return null;
}

export default WS11RegimeElection;
