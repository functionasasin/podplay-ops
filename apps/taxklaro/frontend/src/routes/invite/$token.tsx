import { createRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { publicRootRoute } from '../__root';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';

export const InviteTokenRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/invite/$token',
  component: InvitePage,
});

interface InviteData {
  id: string;
  email: string;
  role: string;
  orgName: string;
  status: string;
  expiresAt: string;
}

function InvitePage() {
  const { token } = InviteTokenRoute.useParams();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<InviteData | null | undefined>(undefined);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data, error: fetchError } = await supabase
        .from('organization_invitations')
        .select('id, email, role, status, expires_at, organizations(name)')
        .eq('token', token)
        .single();

      if (fetchError || !data) {
        setInvite(null);
        return;
      }

      setInvite({
        id: data.id,
        email: data.email,
        role: data.role,
        orgName: (data.organizations as { name: string } | null)?.name ?? 'Unknown Organization',
        status: data.status,
        expiresAt: data.expires_at,
      });
    }
    load();
  }, [token]);

  async function handleAccept() {
    if (!invite) return;
    setIsAccepting(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from('organization_invitations')
        .update({ status: 'accepted' })
        .eq('id', invite.id);
      if (updateError) throw updateError;
      navigate({ to: '/dashboard' });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsAccepting(false);
    }
  }

  if (invite === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" data-testid="invite-page">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (invite === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" data-testid="invite-page">
        <div className="text-center space-y-4">
          <h1 className="font-display text-xl text-foreground">Invitation Not Found</h1>
          <p className="text-sm text-muted-foreground">This invitation link is invalid or has expired.</p>
          <Button variant="outline" onClick={() => navigate({ to: '/auth', search: { redirect: '/', mode: 'signin' } })}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const isExpired = new Date(invite.expiresAt) < new Date();
  const isUsed = invite.status !== 'pending';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background" data-testid="invite-page">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="font-display text-3xl tracking-tight text-foreground">
            <span className="text-primary">₱</span>TaxKlaro
          </span>
        </div>
        <div className="bg-white rounded-xl p-6 sm:p-8 shadow-[var(--shadow-lg)]">
          <h1
            className="font-display text-foreground mb-2"
            style={{ fontSize: 'var(--text-h2)', lineHeight: 'var(--text-h2-lh)' }}
          >
            You&apos;re Invited
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            You&apos;ve been invited to join{' '}
            <strong className="text-foreground">{invite.orgName}</strong> as a{' '}
            <strong className="text-foreground capitalize">{invite.role}</strong>.
          </p>

          {(isExpired || isUsed) && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
              {isExpired ? 'This invitation has expired.' : 'This invitation has already been used.'}
            </p>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
          )}

          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={handleAccept}
              disabled={isAccepting || isExpired || isUsed}
            >
              {isAccepting ? 'Accepting...' : 'Accept Invitation'}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate({ to: '/auth', search: { redirect: '/', mode: 'signin' } })}
            >
              Sign In Instead
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
