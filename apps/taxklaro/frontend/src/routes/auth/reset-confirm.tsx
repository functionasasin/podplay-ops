import { useState, useEffect } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { publicRootRoute } from '../__root';
import { supabase } from '../../lib/supabase';

export const AuthResetConfirmRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/auth/reset-confirm',
  component: AuthResetConfirmPage,
});

function AuthResetConfirmPage() {
  // Reads #access_token= from URL HASH, not query params
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hashReady, setHashReady] = useState(false);

  useEffect(() => {
    // Supabase client auto-detects the hash fragment and sets the session.
    // We just need to wait for the auth state to resolve.
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      setHashReady(true);
    } else {
      setError('Invalid or expired reset link. Please request a new one.');
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]" data-testid="auth-reset-confirm-page">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">Set New Password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your new password below.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-green-600">
              Your password has been updated successfully.
            </p>
            <button
              className="text-sm text-primary underline"
              onClick={() => navigate({ to: '/' })}
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                disabled={!hashReady}
                className="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                placeholder="Min. 6 characters"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting || !hashReady}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-primary underline"
                onClick={() => navigate({ to: '/auth', search: { redirect: '/', mode: 'signin' } })}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
