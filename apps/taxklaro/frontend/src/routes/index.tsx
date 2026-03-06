import { createRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Calculator } from 'lucide-react';
import { rootRoute } from './__root';
import { listComputations } from '../lib/computations';
import { useOrganization } from '../hooks/useOrganization';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { ComputationCard } from '../components/computation/ComputationCard';
import { ComputationCardSkeleton } from '../components/computation/ComputationCardSkeleton';
import type { ComputationListItem } from '../types/org';

export const IndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
});

function IndexPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orgId } = useOrganization();
  const [recent, setRecent] = useState<ComputationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    const data = await listComputations(orgId);
    setRecent(data.slice(0, 6));
    setIsLoading(false);
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  // Not logged in — redirect to auth
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6" data-testid="index-page">
        <Calculator className="h-16 w-16 text-primary" />
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">TaxKlaro</h1>
          <p className="text-muted-foreground max-w-md">
            Philippine income tax computation for freelancers, self-employed professionals, and mixed-income earners.
          </p>
        </div>
        <Button size="lg" onClick={() => navigate({ to: '/auth' })}>
          Get Started
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="index-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Button onClick={() => navigate({ to: '/computations/new' })}>
          <Plus className="h-4 w-4 mr-2" /> New Computation
        </Button>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Recent Computations</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <ComputationCardSkeleton key={i} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-12 space-y-4 border rounded-lg">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">No computations yet. Create your first one to get started.</p>
            <Button variant="outline" onClick={() => navigate({ to: '/computations/new' })}>
              New Computation
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map((c) => (
                <ComputationCard key={c.id} computation={c} />
              ))}
            </div>
            <Button variant="link" onClick={() => navigate({ to: '/computations' })}>
              View all computations
            </Button>
          </>
        )}
      </section>
    </div>
  );
}
