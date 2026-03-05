import { createRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { publicRootRoute } from '@/routes/__root';
import { acceptInvitation } from '@/lib/organizations';

export const inviteTokenRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/invite/$token',
  component: InviteCallbackPage,
});

function InviteCallbackPage() {
  const { token } = inviteTokenRoute.useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setError('Invalid invitation link.'); return; }
    acceptInvitation(token)
      .then(() => navigate({ to: '/settings/team' }))
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'This invitation link is invalid or has expired.';
        setError(message);
      });
  }, [token]);

  if (error) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <p className="text-destructive font-medium">{error}</p>
        <Link to="/auth" search={{ mode: 'signin' as const, redirect: '' }} className="text-primary text-sm underline">Return to sign in</Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Accepting invitation…
      </div>
    </div>
  );
}
