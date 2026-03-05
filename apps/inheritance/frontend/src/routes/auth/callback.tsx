import { useState, useEffect } from 'react';
import { createRoute, useNavigate, Link } from '@tanstack/react-router';
import { publicRootRoute } from '../__root';
import { supabase } from '@/lib/supabase';
import type { AuthError, User, Session } from '@supabase/supabase-js';
import { createOrganization } from '@/lib/organizations';

export const authCallbackRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/auth/callback',
  validateSearch: (search) => ({ code: (search.code as string) ?? '' }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const { code } = authCallbackRoute.useSearch();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) { navigate({ to: '/auth', search: { mode: 'signin', redirect: '' } }); return; }
    supabase.auth.exchangeCodeForSession(code).then(async (result: { data: { user: User | null; session: Session | null }; error: AuthError | null }) => {
      const { data, error: err } = result;
      if (err || !data.user) { setError(err?.message ?? 'Confirmation failed.'); return; }
      // Check if user has an org
      const { data: orgData } = await supabase
        .from('organization_members')
        .select('org_id')
        .eq('user_id', data.user.id)
        .limit(1);
      if (!orgData?.length) {
        await createOrganization(data.user.id, 'My Firm');
        navigate({ to: '/onboarding' as any });
      } else {
        navigate({ to: '/' });
      }
    });
  }, [code]);

  if (error) return (
    <div className="max-w-md mx-auto py-20 text-center space-y-4">
      <p className="text-destructive font-medium">{error}</p>
      <p className="text-sm text-muted-foreground">Your confirmation link may have expired.</p>
      <Link to="/auth" search={{ mode: 'signin', redirect: '' }} className="text-primary text-sm underline">Return to sign in</Link>
    </div>
  );
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
        Confirming your account…
      </div>
    </div>
  );
}
