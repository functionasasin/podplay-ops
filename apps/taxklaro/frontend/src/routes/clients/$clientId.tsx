import { useState, useEffect } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { authenticatedRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';
import { supabase } from '../../lib/supabase';
import { ClientInfoCard } from '../../components/clients/ClientInfoCard';

export const ClientsClientIdRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/clients/$clientId',
  beforeLoad: authGuard,
  component: ClientDetailPage,
});

interface ClientDetail {
  id: string;
  name: string;
  email?: string | null;
  tin?: string | null;
  address?: string | null;
}

function ClientDetailPage() {
  const { clientId } = ClientsClientIdRoute.useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('clients')
          .select('id, name, email, tin, address')
          .eq('id', clientId)
          .single();

        if (cancelled) return;
        if (fetchError || !data) {
          setError('Client not found');
        } else {
          setClient({
            id: data.id,
            name: data.name,
            email: data.email,
            tin: data.tin,
            address: data.address,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message ?? 'Failed to load client');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [clientId]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-8" data-testid="client-detail-page">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4" data-testid="client-detail-page">
        <p className="text-muted-foreground">{error ?? 'Client not found'}</p>
        <button
          className="text-[0.8125rem] text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => navigate({ to: '/clients' })}
        >
          ← Back to Clients
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6" data-testid="client-detail-page">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-normal">{client.name}</h1>
        <button
          className="text-[0.8125rem] text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => navigate({ to: '/clients' })}
        >
          ← Back to Clients
        </button>
      </div>

      <ClientInfoCard
        id={client.id}
        name={client.name}
        email={client.email}
        tin={client.tin}
        address={client.address}
      />
    </div>
  );
}
