import { useState, useEffect } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';
import { loadComputation } from '../../lib/computations';
import { ResultsView } from '../../components/computation/ResultsView';
import type { ComputationRow } from '../../types/org';
import type { TaxComputationResult } from '../../types/engine-output';

export const ComputationsCompIdRoute = createRoute({
  getParentRoute: () => rootRoute,
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
      <div className="max-w-4xl mx-auto p-6" data-testid="computation-detail-page">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !computation) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center space-y-4" data-testid="computation-detail-page">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{computation.title || 'Untitled Computation'}</h1>
          <p className="text-sm text-muted-foreground">
            Tax Year {computation.taxYear} &middot; Status: {computation.status}
          </p>
        </div>
        <button
          className="text-sm text-primary underline"
          onClick={() => navigate({ to: '/computations' })}
        >
          Back to Computations
        </button>
      </div>

      {result ? (
        <ResultsView result={result} readOnly />
      ) : (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          <p>This computation has not been run yet.</p>
          <p className="text-sm mt-1">Input data is saved as a draft.</p>
        </div>
      )}
    </div>
  );
}
