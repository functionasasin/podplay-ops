import type { TaxComputationResult } from '@/types/engine-output';

interface QuarterlyBreakdownViewProps {
  results: TaxComputationResult[];
  taxYear: number;
}

export function QuarterlyBreakdownView({ results, taxYear }: QuarterlyBreakdownViewProps) {
  const quarters = ['Q1', 'Q2', 'Q3', 'Annual'] as const;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-foreground">Quarterly Breakdown — {taxYear}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quarters.map((q, i) => {
          const result = results[i];
          return (
            <div key={q} className="bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{q}</p>
              {result ? (
                <>
                  <p className="text-[0.8125rem] text-muted-foreground">Tax Due</p>
                  <p className="font-display text-2xl text-foreground tabular-nums">
                    ₱{result.recommendedPath.taxDue}
                  </p>
                </>
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
