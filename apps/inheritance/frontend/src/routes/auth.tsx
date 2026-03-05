import { useState } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';

export const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        navigate({ to: '/' });
      } else {
        await signUp(email, password, fullName || undefined);
        setSignUpSuccess(true);
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
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
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSignUpSuccess(false);
                setMode('signin');
                setPassword('');
              }}
            >
              Back to Sign In
            </Button>
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
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juan dela Cruz"
                />
              </div>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting
                ? 'Please wait...'
                : mode === 'signin'
                  ? 'Sign In'
                  : 'Create Account'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === 'signin' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  className="text-primary underline hover:no-underline"
                  onClick={() => { setMode('signup'); setError(''); }}
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
