import { useState, useEffect } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { authenticatedRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';
import { loadComputation } from '../../lib/computations';
import { QuarterlyBreakdownView } from '../../components/computation/QuarterlyBreakdownView';
import type { ComputationRow } from '../../types/org';
import type { TaxComputationResult } from '../../types/engine-output';

// Dot notation makes this a sibling, not a nested child of $compId
export const ComputationsCompIdQuarterlyRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/computations/$compId/quarterly',
  beforeLoad: authGuard,
  component: QuarterlyPage,
});

function QuarterlyPage() {
  const { compId } = ComputationsCompIdQuarterlyRoute.useParams();
  const navigate = useNavigate();
  const [computation, setComputation] = useState<ComputationRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      const row = await loadComputation(compId);
      if (cancelled) return;
      if (!row) {
        setError('Computation not found');
      } else {
        setComputation(row);
      }
      setIsLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [compId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto" data-testid="quarterly-page">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !computation) {
    return (
      <div className="max-w-4xl mx-auto text-center space-y-4" data-testid="quarterly-page">
        <p className="text-muted-foreground">{error ?? 'Computation not found'}</p>
        <button
          className="text-sm text-primary underline"
          onClick={() => navigate({ to: '/computations' })}
        >
          Back to Computations
        </button>
      </div>
    );
  }

  const result = computation.outputJson as TaxComputationResult | null;

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="quarterly-page">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-foreground">{computation.title || 'Untitled Computation'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tax Year {computation.taxYear} · Quarterly View
          </p>
        </div>
        <button
          className="inline-flex items-center py-2.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors shrink-0"
          onClick={() => navigate({ to: '/computations/$compId', params: { compId } })}
        >
          ← Back to Computation
        </button>
      </div>

      {result ? (
        <QuarterlyBreakdownView results={[result]} taxYear={computation.taxYear} />
      ) : (
        <div className="bg-card rounded-xl shadow-sm border border-border/50 p-10 text-center space-y-2">
          <p className="font-medium text-foreground">No results yet</p>
          <p className="text-sm text-muted-foreground">Run the computation to see the quarterly breakdown.</p>
        </div>
      )}
    </div>
  );
}
