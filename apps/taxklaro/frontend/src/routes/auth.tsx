import { useState } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { publicRootRoute } from './__root';
import { signInWithPassword, signUp, signInWithOtp } from '../lib/auth';

export const AuthRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/auth',
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) ?? '/',
    mode: (search.mode as string) ?? 'signin',
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect: redirectTo, mode: initialMode } = AuthRoute.useSearch();
  const [mode, setMode] = useState<'signin' | 'signup' | 'magic'>(
    initialMode === 'signup' ? 'signup' : initialMode === 'magic' ? 'magic' : 'signin',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    try {
      if (mode === 'magic') {
        const { error: otpError } = await signInWithOtp(email);
        if (otpError) {
          setError(otpError.message);
        } else {
          setInfo('Check your email for a magic link to sign in.');
        }
      } else if (mode === 'signup') {
        const { error: signUpError } = await signUp(email, password);
        if (signUpError) {
          setError(signUpError.message);
        } else {
          setInfo('Check your email to confirm your account.');
        }
      } else {
        const { error: signInError } = await signInWithPassword(email, password);
        if (signInError) {
          setError(signInError.message);
        } else {
          navigate({ to: redirectTo });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]" data-testid="auth-page">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold">
            {mode === 'signup' ? 'Create Account' : 'Sign In'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'magic'
              ? 'We will send a magic link to your email.'
              : mode === 'signup'
                ? 'Create a new TaxKlaro account.'
                : 'Sign in to your TaxKlaro account.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="auth-email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="you@example.com"
            />
          </div>

          {mode !== 'magic' && (
            <div className="space-y-2">
              <label htmlFor="auth-password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Min. 6 characters"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-600">{info}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting
              ? 'Please wait...'
              : mode === 'magic'
                ? 'Send Magic Link'
                : mode === 'signup'
                  ? 'Create Account'
                  : 'Sign In'}
          </button>
        </form>

        <div className="text-center space-y-2 text-sm">
          {mode === 'signin' && (
            <>
              <button
                className="text-primary underline"
                onClick={() => { setMode('magic'); setError(null); setInfo(null); }}
              >
                Sign in with magic link instead
              </button>
              <div>
                <span className="text-muted-foreground">No account? </span>
                <button
                  className="text-primary underline"
                  onClick={() => { setMode('signup'); setError(null); setInfo(null); }}
                >
                  Create one
                </button>
              </div>
              <button
                className="text-muted-foreground underline"
                onClick={() => navigate({ to: '/auth/reset' })}
              >
                Forgot password?
              </button>
            </>
          )}
          {mode === 'signup' && (
            <div>
              <span className="text-muted-foreground">Already have an account? </span>
              <button
                className="text-primary underline"
                onClick={() => { setMode('signin'); setError(null); setInfo(null); }}
              >
                Sign in
              </button>
            </div>
          )}
          {mode === 'magic' && (
            <button
              className="text-primary underline"
              onClick={() => { setMode('signin'); setError(null); setInfo(null); }}
            >
              Sign in with password instead
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
