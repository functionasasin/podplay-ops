import { useState, useEffect } from 'react';
import { createRoute, useNavigate, Link } from '@tanstack/react-router';
import { publicRootRoute } from './__root';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { createOrganization } from '@/lib/organizations';

export const authRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/auth',
  validateSearch: (search) => ({
    mode: (search.mode as 'signin' | 'signup') ?? 'signin',
    redirect: (search.redirect as string) ?? '',
  }),
  component: AuthPage,
});

const SUPABASE_ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Incorrect email or password. Please try again.',
  'Email not confirmed': 'Please confirm your email address first.',
  'User already registered': 'An account with this email already exists. Sign in instead.',
  'Password should be at least 6 characters': 'Password must be at least 8 characters.',
  'signup is disabled': 'New registrations are temporarily disabled.',
};

function AuthPage() {
  const { mode: initialMode, redirect: redirectTo } = authRoute.useSearch();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: '/' });
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleResend = async () => {
    setResendStatus('sending');
    await supabase.auth.resend({ type: 'signup', email });
    setResendStatus('sent');
    setTimeout(() => setResendStatus('idle'), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        navigate({ to: (redirectTo as any) || '/' });
      } else {
        const result = await signUp(email, password, fullName || undefined);
        if (result?.session) {
          // Auto-confirmed (enable_confirmations = false in dev):
          await createOrganization(result.user!.id, firmName || 'My Firm');
          navigate({ to: '/onboarding' as any });
        } else {
          // Pending confirmation (production with enable_confirmations = true):
          setSignUpSuccess(true);
        }
      }
    } catch (err: any) {
      const raw = err.message ?? 'Something went wrong';
      setError(SUPABASE_ERROR_MAP[raw] ?? raw);
      if (raw === 'Email not confirmed') setShowResend(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (signUpSuccess) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-serif">Check your email</CardTitle>
            <CardDescription>
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then come back and sign in.
              <p className="text-xs text-muted-foreground mt-2">The link expires in 1 hour.</p>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSignUpSuccess(false);
                setMode('signin');
                setPassword('');
                setConfirmPassword('');
              }}
            >
              Back to Sign In
            </Button>
            <div className="text-center">
              <Button variant="ghost" size="sm" disabled={resendStatus !== 'idle'} onClick={handleResend}>
                {resendStatus === 'idle' ? 'Resend confirmation email' : resendStatus === 'sending' ? 'Sending…' : 'Sent!'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            {mode === 'signin' ? (
              <LogIn className="h-8 w-8 text-primary" />
            ) : (
              <UserPlus className="h-8 w-8 text-primary" />
            )}
          </div>
          <CardTitle className="font-serif">
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {mode === 'signin'
              ? 'Sign in to save cases and access premium features.'
              : 'Create an account to get started.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="firmName">Firm Name</Label>
                  <Input
                    id="firmName"
                    type="text"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    placeholder="Law Office of…"
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan dela Cruz"
                    disabled={submitting}
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                disabled={submitting}
              />
              {mode === 'signin' && (
                <Link to="/auth/reset" className="text-xs text-primary hover:underline">Forgot password?</Link>
              )}
            </div>

            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  disabled={submitting}
                />
                {error.includes('match') && (
                  <p className="text-sm text-destructive">Passwords do not match</p>
                )}
              </div>
            )}

            {error && !error.includes('match') && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {showResend && (
              <Button variant="ghost" size="sm" disabled={resendStatus !== 'idle'} onClick={handleResend}>
                {resendStatus === 'idle' ? 'Resend confirmation email' : resendStatus === 'sending' ? 'Sending…' : 'Sent!'}
              </Button>
            )}

            <Button type="submit" className="w-full gap-2" disabled={submitting}>
              {submitting ? (
                <><div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />Please wait…</>
              ) : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === 'signin' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  className="text-primary underline hover:no-underline"
                  onClick={() => { setMode('signup'); setError(''); setShowResend(false); }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  className="text-primary underline hover:no-underline"
                  onClick={() => { setMode('signin'); setError(''); }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
