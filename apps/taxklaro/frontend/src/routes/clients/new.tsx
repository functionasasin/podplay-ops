import { useState } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { authenticatedRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';
import { supabase } from '../../lib/supabase';
import { useOrganization } from '../../hooks/useOrganization';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

export const ClientsNewRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/clients/new',
  beforeLoad: authGuard,
  component: ClientsNewPage,
});

function ClientsNewPage() {
  const navigate = useNavigate();
  const { orgId } = useOrganization();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tin, setTin] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId || !name.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from('clients').insert({
        org_id: orgId,
        name: name.trim(),
        email: email.trim() || null,
        tin: tin.trim() || null,
        address: address.trim() || null,
      });

      if (insertError) throw insertError;
      navigate({ to: '/clients' });
    } catch (err) {
      setError((err as Error).message ?? 'Failed to create client');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-8 space-y-6" data-testid="clients-new-page">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-normal">New Client</h1>
        <button
          className="text-[0.8125rem] text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => navigate({ to: '/clients' })}
        >
          ← Back to Clients
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-xl bg-card shadow-md p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Client Name *</Label>
            <Input
              id="name"
              data-testid="client-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Juan dela Cruz"
              className="h-11"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tin">TIN</Label>
            <Input
              id="tin"
              data-testid="client-tin-input"
              value={tin}
              onChange={(e) => setTin(e.target.value)}
              placeholder="e.g. 123-456-789-000"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              data-testid="client-email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. juan@example.com"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              data-testid="client-address-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Rizal Ave, Manila"
              className="h-11"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Creating...' : 'Create Client'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: '/clients' })}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
