import type { TaxComputationResult } from '@/types/engine-output';
import { ResultsView } from '@/components/computation/ResultsView';

interface SharedComputationViewProps {
  title: string;
  taxYear: number;
  orgName: string;
  result: TaxComputationResult;
}

export function SharedComputationView({ title, taxYear, orgName, result }: SharedComputationViewProps) {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">
          Tax Year {taxYear} · Shared by {orgName}
        </p>
      </div>
      <ResultsView result={result} readOnly={true} />
    </div>
  );
}

export default SharedComputationView;
