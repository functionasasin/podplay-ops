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
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-background"
      data-testid="auth-page"
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="font-display text-3xl tracking-tight text-foreground">
            <span className="text-primary">₱</span>TaxKlaro
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl p-4 sm:p-8 shadow-[var(--shadow-lg)]">
          <div className="mb-6">
            <h1 className="font-display text-foreground" style={{ fontSize: 'var(--text-h2)', lineHeight: 'var(--text-h2-lh)' }}>
              {mode === 'signup' ? 'Create Account' : mode === 'magic' ? 'Magic Link' : 'Sign In'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'magic'
                ? 'We will send a magic link to your email.'
                : mode === 'signup'
                  ? 'Create a new TaxKlaro account.'
                  : 'Sign in to your TaxKlaro account.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="auth-email"
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-11 rounded-lg border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                placeholder="you@example.com"
              />
            </div>

            {mode !== 'magic' && (
              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Password
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full h-11 rounded-lg border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder="Min. 6 characters"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            {info && (
              <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{info}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50 mt-1"
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

          <div className="mt-5 space-y-2 text-center text-sm">
            {mode === 'signin' && (
              <>
                <div>
                  <button
                    className="text-primary hover:underline"
                    onClick={() => { setMode('magic'); setError(null); setInfo(null); }}
                  >
                    Sign in with magic link instead
                  </button>
                </div>
                <div>
                  <span className="text-muted-foreground">No account? </span>
                  <button
                    className="text-primary hover:underline"
                    onClick={() => { setMode('signup'); setError(null); setInfo(null); }}
                  >
                    Create one
                  </button>
                </div>
                <div>
                  <button
                    className="text-muted-foreground hover:text-foreground hover:underline"
                    onClick={() => navigate({ to: '/auth/reset' })}
                  >
                    Forgot password?
                  </button>
                </div>
              </>
            )}
            {mode === 'signup' && (
              <div>
                <span className="text-muted-foreground">Already have an account? </span>
                <button
                  className="text-primary hover:underline"
                  onClick={() => { setMode('signin'); setError(null); setInfo(null); }}
                >
                  Sign in
                </button>
              </div>
            )}
            {mode === 'magic' && (
              <button
                className="text-primary hover:underline"
                onClick={() => { setMode('signin'); setError(null); setInfo(null); }}
              >
                Sign in with password instead
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
