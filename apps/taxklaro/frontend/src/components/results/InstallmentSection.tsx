import type { Peso } from '@/types/common';

interface InstallmentSectionProps {
  installmentEligible: boolean;
  installmentFirstDue: Peso;
  installmentSecondDue: Peso;
}

export function InstallmentSection(_props: InstallmentSectionProps) {
  return null;
}

export default InstallmentSection;
