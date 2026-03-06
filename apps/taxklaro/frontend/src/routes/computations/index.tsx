import { createRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, FileText } from 'lucide-react';
import { rootRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';
import { listComputations, deleteComputation, updateComputationStatus } from '../../lib/computations';
import { useOrganization } from '../../hooks/useOrganization';
import { ComputationCard } from '../../components/computation/ComputationCard';
import { ComputationCardSkeleton } from '../../components/computation/ComputationCardSkeleton';
import { Button } from '../../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import type { ComputationListItem, ComputationStatus } from '../../types/org';

export const ComputationsIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
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
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Computations</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ComputationCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Computations</h1>
          <Button onClick={() => navigate({ to: '/computations/new' })}>
            <Plus className="h-4 w-4 mr-2" /> New Computation
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Unable to load computations. There was a problem fetching your computations. Please try again.</p>
          <Button variant="outline" onClick={load}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Computations</h1>
        <Button onClick={() => navigate({ to: '/computations/new' })}>
          <Plus className="h-4 w-4 mr-2" /> New Computation
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="computed">Computed</TabsTrigger>
          <TabsTrigger value="finalized">Finalized</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {computations.length === 0 ? (
        <div className="text-center py-16 space-y-4" data-testid="empty-computations">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <p className="text-lg font-medium">No computations yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create a computation to get BIR-compliant tax analysis for any freelancer or self-employed client.
            </p>
          </div>
          <Button onClick={() => navigate({ to: '/computations/new' })}>New Computation</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-lg font-medium">No results</p>
          <p className="text-sm text-muted-foreground">
            No computations match the selected filters. Try adjusting your status or tax year filters.
          </p>
          <Button variant="outline" onClick={() => setStatusFilter('all')}>Clear filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
