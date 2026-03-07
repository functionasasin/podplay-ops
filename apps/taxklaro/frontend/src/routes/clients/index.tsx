import { useState, useEffect, useCallback } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { Plus, Users } from 'lucide-react';
import { authenticatedRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';
import { supabase } from '../../lib/supabase';
import { useOrganization } from '../../hooks/useOrganization';
import { ClientsTable } from '../../components/clients/ClientsTable';
import { Button } from '../../components/ui/button';

export const ClientsIndexRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/clients',
  beforeLoad: authGuard,
  component: ClientsPage,
});

interface ClientRow {
  id: string;
  fullName: string;
  email?: string | null;
  computationCount?: number;
}

function ClientsPage() {
  const navigate = useNavigate();
  const { orgId } = useOrganization();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('id, full_name, email')
        .eq('org_id', orgId)
        .order('full_name');

      if (fetchError) throw fetchError;
      setClients(
        (data ?? []).map((c) => ({
          id: c.id,
          fullName: c.full_name,
          email: c.email,
        })),
      );
    } catch (err) {
      setError((err as Error).message ?? 'Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6" data-testid="clients-page">
      <div className="flex items-center justify-between flex-wrap gap-y-3">
        <h1 className="font-display text-foreground" style={{ fontSize: 'var(--text-h1)', lineHeight: 'var(--text-h1-lh)' }}>Clients</h1>
        <Button onClick={() => navigate({ to: '/clients/new' })}>
          <Plus className="h-4 w-4 mr-2" /> New Client
        </Button>
      </div>

      {error ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Unable to load clients. {error}</p>
          <Button variant="outline" onClick={load}>Try again</Button>
        </div>
      ) : clients.length === 0 && !isLoading ? (
        <div className="text-center py-20 space-y-4" data-testid="empty-clients">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-display text-xl font-normal">No clients yet</p>
            <p className="text-[0.9375rem] text-muted-foreground mt-1">
              Add a client to start organizing your computations.
            </p>
          </div>
          <Button onClick={() => navigate({ to: '/clients/new' })}>New Client</Button>
        </div>
      ) : (
        <ClientsTable
          clients={clients}
          isLoading={isLoading}
          onSelect={(id) => navigate({ to: '/clients/$clientId', params: { clientId: id } })}
        />
      )}
    </div>
  );
}
