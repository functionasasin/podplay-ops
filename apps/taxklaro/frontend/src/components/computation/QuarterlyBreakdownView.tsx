import type { TaxComputationResult } from '@/types/engine-output';

interface QuarterlyBreakdownViewProps {
  results: TaxComputationResult[];
  taxYear: number;
}

export function QuarterlyBreakdownView({ results, taxYear }: QuarterlyBreakdownViewProps) {
  const quarters = ['Q1', 'Q2', 'Q3', 'Annual'] as const;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Quarterly Breakdown — {taxYear}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quarters.map((q, i) => {
          const result = results[i];
          return (
            <div key={q} className="border rounded-lg p-4 space-y-2">
              <p className="font-medium">{q}</p>
              {result ? (
                <p className="text-sm">
                  Tax Due: ₱{result.recommendedPath.taxDue}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No data</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default QuarterlyBreakdownView;
