import { useState } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { publicRootRoute } from '../__root';
import { resetPassword } from '../../lib/auth';

export const AuthResetRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/auth/reset',
  component: AuthResetPage,
});

function AuthResetPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const { error: resetError } = await resetPassword(email);
      if (resetError) {
        setError(resetError.message);
      } else {
        setSent(true);
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
      data-testid="auth-reset-page"
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="font-display text-3xl tracking-tight text-foreground">
            <span className="text-primary">₱</span>TaxKlaro
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl p-8 shadow-[var(--shadow-lg)]">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-foreground">Reset Password</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your email and we will send you a link to reset your password.
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                Check your email for a password reset link.
              </p>
              <button
                className="text-sm text-primary hover:underline"
                onClick={() => navigate({ to: '/auth', search: { redirect: '/', mode: 'signin' } })}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-11 rounded-lg border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => navigate({ to: '/auth', search: { redirect: '/', mode: 'signin' } })}
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
