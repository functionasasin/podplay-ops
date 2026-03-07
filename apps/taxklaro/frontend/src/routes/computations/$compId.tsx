import { useState, useEffect } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { authenticatedRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';
import { loadComputation } from '../../lib/computations';
import { ResultsView } from '../../components/computation/ResultsView';
import { Badge } from '../../components/ui/badge';
import type { ComputationRow } from '../../types/org';
import type { TaxComputationResult } from '../../types/engine-output';

export const ComputationsCompIdRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/computations/$compId',
  beforeLoad: authGuard,
  component: ComputationDetailPage,
});

function ComputationDetailPage() {
  const { compId } = ComputationsCompIdRoute.useParams();
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
      <div className="max-w-4xl mx-auto" data-testid="computation-detail-page">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !computation) {
    return (
      <div className="max-w-4xl mx-auto text-center space-y-4" data-testid="computation-detail-page">
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
    <div className="max-w-4xl mx-auto space-y-6" data-testid="computation-detail-page">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <h1 className="font-display text-foreground truncate" style={{ fontSize: 'var(--text-h1)', lineHeight: 'var(--text-h1-lh)' }}>
            {computation.title || 'Untitled Computation'}
          </h1>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-sm text-muted-foreground">Tax Year {computation.taxYear}</span>
            <Badge
              variant={computation.status === 'complete' ? 'default' : 'secondary'}
              className={`capitalize text-xs ${computation.status === 'complete' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
            >
              {computation.status}
            </Badge>
          </div>
        </div>
        <button
          className="inline-flex items-center py-2.5 text-sm text-primary hover:text-primary/80 underline underline-offset-2 shrink-0 transition-colors"
          onClick={() => navigate({ to: '/computations' })}
        >
          ← Back
        </button>
      </div>

      {result ? (
        <ResultsView result={result} readOnly />
      ) : (
        <div className="rounded-xl border p-10 text-center text-muted-foreground shadow-sm">
          <p className="text-[0.9375rem]">This computation has not been run yet.</p>
          <p className="text-sm mt-1">Input data is saved as a draft.</p>
        </div>
      )}
    </div>
  );
}
