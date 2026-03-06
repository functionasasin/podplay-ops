import { useState, useEffect, useCallback } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { Plus, Users } from 'lucide-react';
import { rootRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';
import { supabase } from '../../lib/supabase';
import { useOrganization } from '../../hooks/useOrganization';
import { ClientsTable } from '../../components/clients/ClientsTable';
import { Button } from '../../components/ui/button';

export const ClientsIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clients',
  beforeLoad: authGuard,
  component: ClientsPage,
});

interface ClientRow {
  id: string;
  name: string;
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
        .select('id, name, email')
        .eq('org_id', orgId)
        .order('name');

      if (fetchError) throw fetchError;
      setClients(
        (data ?? []).map((c) => ({
          id: c.id,
          name: c.name,
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
    <div className="p-6 space-y-6" data-testid="clients-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Button onClick={() => navigate({ to: '/clients/new' })}>
          <Plus className="h-4 w-4 mr-2" /> New Client
        </Button>
      </div>

      {error ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Unable to load clients. {error}</p>
          <Button variant="outline" onClick={load}>Try again</Button>
        </div>
      ) : clients.length === 0 && !isLoading ? (
        <div className="text-center py-16 space-y-4" data-testid="empty-clients">
          <Users className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <p className="text-lg font-medium">No clients yet</p>
            <p className="text-sm text-muted-foreground mt-1">
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
