import { createRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, FileText } from 'lucide-react';
import { authenticatedRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';
import { listComputations, deleteComputation, updateComputationStatus } from '../../lib/computations';
import { useOrganization } from '../../hooks/useOrganization';
import { ComputationCard } from '../../components/computation/ComputationCard';
import { ComputationCardSkeleton } from '../../components/computation/ComputationCardSkeleton';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import type { ComputationListItem, ComputationStatus } from '../../types/org';

export const ComputationsIndexRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/computations',
  beforeLoad: authGuard,
  component: ComputationsPage,
});

type StatusFilter = 'all' | ComputationStatus;

function ComputationsPage() {
  const navigate = useNavigate();
  const { orgId } = useOrganization();
  const [computations, setComputations] = useState<ComputationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const load = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listComputations(orgId);
      setComputations(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    await deleteComputation(id);
    setComputations((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleArchive(id: string, currentStatus: ComputationStatus) {
    await updateComputationStatus(id, currentStatus, 'archived');
    setComputations((prev) =>
      prev.map((c) => c.id === id ? { ...c, status: 'archived' as ComputationStatus } : c)
    );
  }

  const filtered = statusFilter === 'all'
    ? computations
    : computations.filter((c) => c.status === statusFilter);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-normal">Computations</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <ComputationCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-normal">Computations</h1>
          <Button onClick={() => navigate({ to: '/computations/new' })}>
            <Plus className="h-4 w-4 mr-2" /> New Computation
          </Button>
        </div>
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Unable to load computations. There was a problem fetching your computations. Please try again.</p>
          <Button variant="outline" onClick={load}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-y-3">
        <h1 className="font-display text-3xl font-normal">Computations</h1>
        <Button onClick={() => navigate({ to: '/computations/new' })}>
          <Plus className="h-4 w-4 mr-2" /> New Computation
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabsList variant="line">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="computed">Computed</TabsTrigger>
          <TabsTrigger value="finalized">Finalized</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {computations.length === 0 ? (
        <div className="text-center py-20 space-y-4" data-testid="empty-computations">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-display text-xl font-normal">No computations yet</p>
            <p className="text-[0.9375rem] text-muted-foreground mt-1 max-w-sm mx-auto">
              Create a computation to get BIR-compliant tax analysis for any freelancer or self-employed client.
            </p>
          </div>
          <Button onClick={() => navigate({ to: '/computations/new' })}>New Computation</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-display text-xl font-normal">No results</p>
            <p className="text-[0.9375rem] text-muted-foreground max-w-sm mx-auto">
              No computations match the selected filters. Try adjusting your status filter.
            </p>
          </div>
          <Button variant="outline" onClick={() => setStatusFilter('all')}>Clear filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <ComputationCard
              key={c.id}
              computation={c}
              onDelete={handleDelete}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
