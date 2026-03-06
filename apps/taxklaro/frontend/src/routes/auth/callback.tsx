import { useEffect, useState } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { publicRootRoute } from '../__root';
import { supabase } from '../../lib/supabase';

export const AuthCallbackRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/auth/callback',
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  // Extracts PKCE code from window.location.search (?code=), NOT from hash
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function exchangeCode() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (!code) {
        setError('No authorization code found in URL.');
        return;
      }

      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      navigate({ to: '/' });
    }

    exchangeCode();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]" data-testid="auth-callback-page">
      {error ? (
        <div className="text-center space-y-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            className="text-sm text-primary underline"
            onClick={() => navigate({ to: '/auth', search: { redirect: '/', mode: 'signin' } })}
          >
            Back to Sign In
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Processing authentication...</p>
      )}
    </div>
  );
}
