import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { loadClient, updateClient } from '@/lib/clients';
import type { ClientRow } from '@/types/client';
import { GOV_ID_TYPE_LABELS, CIVIL_STATUS_LABELS } from '@/types/client';
import { ConflictCheckDialog } from '@/components/clients/ConflictCheckDialog';
import { Button } from '@/components/ui/button';

export const clientDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clients/$clientId',
  component: ClientDetailPage,
});

function ClientDetailPage() {
  const { clientId } = clientDetailRoute.useParams();
  const [client, setClient] = useState<ClientRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const row = await loadClient(clientId);
        if (!cancelled) setClient(row);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load client');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [clientId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error ?? 'Client not found'}</span>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="client-detail-page" className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <h1 className="text-xl font-bold tracking-tight font-serif mb-6">
        {client.full_name}
      </h1>

      <div className="space-y-6">
        <section data-testid="client-identity-section">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Identity</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Full Name</dt>
            <dd>{client.full_name}</dd>
            {client.nickname && <>
              <dt className="text-muted-foreground">Nickname</dt>
              <dd>{client.nickname}</dd>
            </>}
            {client.date_of_birth && <>
              <dt className="text-muted-foreground">Date of Birth</dt>
              <dd>{client.date_of_birth}</dd>
            </>}
            {client.place_of_birth && <>
              <dt className="text-muted-foreground">Place of Birth</dt>
              <dd>{client.place_of_birth}</dd>
            </>}
            {client.civil_status && <>
              <dt className="text-muted-foreground">Civil Status</dt>
              <dd>{CIVIL_STATUS_LABELS[client.civil_status]}</dd>
            </>}
          </dl>
        </section>

        <section data-testid="client-contact-section">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Contact</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {client.email && <>
              <dt className="text-muted-foreground">Email</dt>
              <dd>{client.email}</dd>
            </>}
            {client.phone && <>
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{client.phone}</dd>
            </>}
            {client.address && <>
              <dt className="text-muted-foreground">Address</dt>
              <dd>{client.address}</dd>
            </>}
          </dl>
        </section>

        <section data-testid="client-legal-section">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Legal IDs</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {client.tin && <>
              <dt className="text-muted-foreground">TIN</dt>
              <dd>{client.tin}</dd>
            </>}
            {client.gov_id_type && <>
              <dt className="text-muted-foreground">Government ID</dt>
              <dd>{GOV_ID_TYPE_LABELS[client.gov_id_type]} — {client.gov_id_number}</dd>
            </>}
          </dl>
        </section>

        <section data-testid="client-intake-section">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Intake</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Intake Date</dt>
            <dd>{client.intake_date}</dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="capitalize">{client.status}</dd>
            {client.referral_source && <>
              <dt className="text-muted-foreground">Referral Source</dt>
              <dd>{client.referral_source}</dd>
            </>}
          </dl>
        </section>

        <section data-testid="client-cases-section">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Cases</h2>
          <p className="text-sm text-muted-foreground">Linked cases will appear here.</p>
        </section>

        <section data-testid="client-conflict-log-section">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Conflict Check Log</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm mb-3">
            <dt className="text-muted-foreground">Conflict Cleared</dt>
            <dd>{client.conflict_cleared === true ? 'Yes' : client.conflict_cleared === false ? 'No' : 'N/A'}</dd>
            {client.conflict_notes && <>
              <dt className="text-muted-foreground">Notes</dt>
              <dd>{client.conflict_notes}</dd>
            </>}
          </dl>
          <Button variant="outline" size="sm" onClick={() => setConflictDialogOpen(true)}>
            Re-run Conflict Check
          </Button>
        </section>
      </div>

      <ConflictCheckDialog
        open={conflictDialogOpen}
        onOpenChange={setConflictDialogOpen}
        clientName={client.full_name}
        clientTin={client.tin}
        onClear={async () => {
          await updateClient(clientId, { conflict_cleared: true, conflict_notes: null });
          setClient({ ...client, conflict_cleared: true, conflict_notes: null });
        }}
        onClearedAfterReview={async (notes) => {
          await updateClient(clientId, { conflict_cleared: true, conflict_notes: notes });
          setClient({ ...client, conflict_cleared: true, conflict_notes: notes });
        }}
      />
    </div>
  );
}
