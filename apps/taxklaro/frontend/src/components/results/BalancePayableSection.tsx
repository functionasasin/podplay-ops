import type { Peso, BalanceDisposition, OverpaymentDisposition } from '@/types/common';

interface BalancePayableSectionProps {
  balance: Peso;
  disposition: BalanceDisposition;
  overpayment: Peso;
  overpaymentDisposition: OverpaymentDisposition | null;
  totalItCredits: Peso;
  cwtCredits: Peso;
  quarterlyPayments: Peso;
  priorYearExcess: Peso;
}

export function BalancePayableSection(_props: BalancePayableSectionProps) {
  return null;
}

export default BalancePayableSection;
