import { createRoute, useNavigate } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { Users, Loader2, Plus } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { ClientList } from '@/components/clients/ClientList';
import { listClients } from '@/lib/clients';
import { Button } from '@/components/ui/button';
import type { ClientListItem, ClientStatus } from '@/types/client';

export const clientsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clients',
  component: ClientsPage,
});

function ClientsPage() {
  const { user, loading: authLoading } = useAuth();
  const { organization } = useOrganization(user?.id ?? null);
  const navigate = useNavigate();
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'intake_date' | 'status'>('name');

  const fetchClients = useCallback(async () => {
    if (!organization) return;
    setLoading(true);
    try {
      const filter = statusFilter === 'all' ? undefined : statusFilter;
      const result = await listClients(organization.id, filter, searchQuery || undefined);
      setClients(result);
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [organization, statusFilter, searchQuery]);

  useEffect(() => {
    if (organization) {
      fetchClients();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [organization, fetchClients, authLoading]);

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight font-serif">
            Clients
          </h1>
        </div>
        <p className="text-muted-foreground">
          Sign in to manage your clients.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight font-serif">
          Clients
        </h1>
        <Button
          className="ml-auto"
          size="sm"
          onClick={() => navigate({ to: '/clients/new' })}
        >
          <Plus className="h-4 w-4 mr-1" />
          New Client
        </Button>
      </div>

      <ClientList
        clients={clients}
        loading={loading}
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        sortBy={sortBy}
        onStatusFilterChange={setStatusFilter}
        onSearchChange={setSearchQuery}
        onSortChange={setSortBy}
        onClientClick={(clientId) => navigate({ to: '/clients/$clientId', params: { clientId } })}
      />
    </div>
  );
}
