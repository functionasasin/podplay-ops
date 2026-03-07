import { createRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { Plus, FileText } from 'lucide-react';
import { authenticatedRoute } from './__root';
import { authGuard } from '../lib/auth-guard';
import { listComputations } from '../lib/computations';
import { useOrganization } from '../hooks/useOrganization';
import { Button } from '../components/ui/button';
import { ComputationCard } from '../components/computation/ComputationCard';
import { ComputationCardSkeleton } from '../components/computation/ComputationCardSkeleton';
import type { ComputationListItem } from '../types/org';

export const DashboardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/dashboard',
  beforeLoad: authGuard,
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
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

  return (
    <div className="max-w-5xl mx-auto space-y-6" data-testid="dashboard-page">
      <div className="flex items-center justify-between flex-wrap gap-y-3">
        <h1
          className="font-display text-foreground"
          style={{ fontSize: 'var(--text-h1)', lineHeight: 'var(--text-h1-lh)' }}
        >
          Dashboard
        </h1>
        <Button onClick={() => navigate({ to: '/computations/new' })}>
          <Plus className="h-4 w-4 mr-2" /> New Computation
        </Button>
      </div>

      <section className="space-y-4">
        <h2
          className="font-semibold text-foreground"
          style={{ fontSize: 'var(--text-h3)', lineHeight: 'var(--text-h3-lh)' }}
        >
          Recent Computations
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <ComputationCardSkeleton key={i} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-12 space-y-4 bg-white rounded-xl shadow-[var(--shadow-sm)]">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground" style={{ fontSize: 'var(--text-body)' }}>
              No computations yet. Create your first one to get started.
            </p>
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
