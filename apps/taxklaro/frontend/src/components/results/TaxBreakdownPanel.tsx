import type { Peso } from '@/types/common';
import type { RegimePath } from '@/types/common';

interface TaxBreakdownPanelProps {
  selectedPath: RegimePath;
  selectedIncomeTaxDue: Peso;
  selectedPercentageTaxDue: Peso;
  selectedTotalTax: Peso;
}

export function TaxBreakdownPanel(_props: TaxBreakdownPanelProps) {
  return null;
}

export default TaxBreakdownPanel;
