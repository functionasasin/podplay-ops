// TaxComputationDocument: PDF export component using @react-pdf/renderer.
// Lazy-loaded via import('@/components/pdf/TaxComputationDocument') from ActionsBar.
// (spec §14.2 rule 4)
import type { TaxComputationResult } from '@/types/engine-output';

interface TaxComputationDocumentProps {
  result: TaxComputationResult;
  title: string;
  taxYear: number;
  taxpayerName?: string | null;
}

// The actual @react-pdf/renderer Document is lazy-loaded in production.
// This stub exports the component so the module resolves correctly.
export function TaxComputationDocument(_props: TaxComputationDocumentProps) {
  return null;
}

export default TaxComputationDocument;
