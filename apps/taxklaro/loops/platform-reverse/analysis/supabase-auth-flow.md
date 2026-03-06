# Supabase Auth Flow — TaxKlaro

**Wave:** 4 (Platform Layer)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** frontend-state-management, zod-schemas, typescript-types

---

## Summary

This document specifies the complete Supabase authentication flow for TaxKlaro: all route files, component implementations, lib/auth.ts, lib/supabase.ts, main.tsx setup, and the onboarding flow. Patterns are derived directly from the inheritance app reference implementation.

---

## 1. Environment and Supabase Client

### `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null as any; // Callers must guard on supabaseConfigured before use
```

**Critical**: If `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing, `supabaseConfigured` is `false`. `main.tsx` renders `<SetupPage />` instead of the router. This prevents cryptic null-pointer crashes.

---

## 2. Application Bootstrap — `src/main.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import '@fontsource-variable/inter';
import './index.css';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { router } from './router';
import { SetupPage } from '@/components/SetupPage';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

function RouterWithAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get the current session synchronously from local storage
    supabase.auth.getSession().then(
      (result: { data: { session: Session | null } }) => {
        setUser(result.data.session?.user ?? null);
        setLoading(false);
      }
    );
    // 2. Subscribe to future changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // Show full-screen spinner while resolving initial session.
  // This prevents flash-of-unauthenticated-content.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <RouterProvider router={router} context={{ auth: { user } }} />
      <Toaster position="bottom-right" richColors />
    </>
  );
}

if (!supabaseConfigured) {
  ReactDOM.createRoot(document.getElementById('root')!).render(<SetupPage />);
} else {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <RouterWithAuth />
    </React.StrictMode>
  );
}
```

**Key patterns:**
- `getSession()` is called BEFORE subscribing to `onAuthStateChange`. This resolves the initial session from localStorage so the first render has correct auth state.
- The `loading` spinner prevents flash-of-unauthenticated-content on page load.
- Router context carries `{ auth: { user } }` so `beforeLoad` guards in all routes can check auth.
- `supabaseConfigured` guard shows `<SetupPage />` if env vars are missing.

---

## 3. Router Context Type

```typescript
// src/router.ts

import { createRouter } from '@tanstack/react-router';
import type { User } from '@supabase/supabase-js';
import { rootRoute } from './routes/__root';
// ... all route imports

export interface RouterContext {
  auth: {
    user: User | null;
  };
}

const routeTree = rootRoute.addChildren([
  // ... all routes
]);

export const router = createRouter({
  routeTree,
  context: {
    auth: { user: null }, // default — overridden in RouterProvider context prop
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

---

## 4. Root Route — `src/routes/__root.tsx`

```typescript
import { createRootRouteWithContext, createRoute, Outlet, useRouterState } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import type { RouterContext } from '@/router';

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPublicRoute =
    pathname.startsWith('/auth') ||
    pathname.startsWith('/share/') ||
    pathname.startsWith('/invite/') ||
    pathname === '/onboarding';

  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    );
  }
  return <AppLayout><Outlet /></AppLayout>;
}

// Sub-route for public pages (no AppLayout, no auth guard)
export const publicRootRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_public',
  component: () => <Outlet />,
});
```

**Note:** `createRootRouteWithContext<RouterContext>()` is the correct TanStack Router v1 API for typed router context. `beforeLoad` guards in child routes access `context.auth.user`.

---

## 5. Auth Page — `src/routes/auth.tsx`

Single page with toggling Sign In / Create Account modes (no separate tabs component — state toggle in URL search param).

```typescript
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

// Map Supabase error messages to user-friendly copy
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

  // Redirect already-authenticated users to dashboard
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
          // Auto-confirmed (dev mode, enable_confirmations=false):
          // Create initial org immediately
          await createOrganization(firmName || 'My Firm');
          navigate({ to: '/onboarding' as any });
        } else {
          // Email confirmation required (production):
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

  // Post-signup email confirmation waiting state
  if (signUpSuccess) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent a confirmation link to <strong>{email}</strong>.
              Click it to activate your account, then come back to sign in.
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
              <Button
                variant="ghost"
                size="sm"
                disabled={resendStatus !== 'idle'}
                onClick={handleResend}
              >
                {resendStatus === 'idle'
                  ? 'Resend confirmation email'
                  : resendStatus === 'sending'
                  ? 'Sending...'
                  : 'Sent!'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="flex items-center justify-center gap-2 mb-8">
        {/* TaxKlaro logo mark — Calculator icon + brand name */}
        <span className="text-2xl font-bold text-primary">TaxKlaro</span>
      </div>
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            {mode === 'signin' ? (
              <LogIn className="h-8 w-8 text-primary" />
            ) : (
              <UserPlus className="h-8 w-8 text-primary" />
            )}
          </div>
          <CardTitle>
            {mode === 'signin' ? 'Sign In to TaxKlaro' : 'Create Account'}
          </CardTitle>
          <CardDescription>
            {mode === 'signin'
              ? 'Sign in to save computations and access premium features.'
              : 'Create an account for your accounting firm.'}
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
                    placeholder="Reyes & Associates CPA"
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Your Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan dela Cruz, CPA"
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
                <Link
                  to="/auth/reset"
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </Link>
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={resendStatus !== 'idle'}
                onClick={handleResend}
              >
                {resendStatus === 'idle'
                  ? 'Resend confirmation email'
                  : resendStatus === 'sending'
                  ? 'Sending...'
                  : 'Sent!'}
              </Button>
            )}

            <Button type="submit" className="w-full gap-2" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Please wait...
                </>
              ) : mode === 'signin' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
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
```

---

## 6. PKCE Email Confirmation Callback — `src/routes/auth/callback.tsx`

Handles the `?code=...` query parameter from Supabase email confirmation links.

```typescript
import { useState, useEffect } from 'react';
import { createRoute, useNavigate, Link } from '@tanstack/react-router';
import { publicRootRoute } from '../__root';
import { supabase } from '@/lib/supabase';
import { createOrganization } from '@/lib/organizations';
import type { AuthError, User, Session } from '@supabase/supabase-js';

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
    if (!code) {
      navigate({ to: '/auth', search: { mode: 'signin', redirect: '' } });
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(
      async (result: {
        data: { user: User | null; session: Session | null };
        error: AuthError | null;
      }) => {
        const { data, error: err } = result;
        if (err || !data.user) {
          setError(err?.message ?? 'Confirmation failed. The link may have expired.');
          return;
        }

        // Check if user already has an org (re-confirming existing account)
        const { data: orgData } = await supabase
          .from('organization_members')
          .select('org_id')
          .eq('user_id', data.user.id)
          .limit(1);

        if (!orgData?.length) {
          // New user — create default org, go to onboarding to fill details
          await createOrganization('My Firm');
          navigate({ to: '/onboarding' as any });
        } else {
          // Existing user — go to dashboard
          navigate({ to: '/' });
        }
      }
    );
  }, [code]);

  if (error) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <p className="text-destructive font-medium">{error}</p>
        <p className="text-sm text-muted-foreground">
          Your confirmation link may have expired. Request a new one below.
        </p>
        <Link
          to="/auth"
          search={{ mode: 'signin', redirect: '' }}
          className="text-primary text-sm underline"
        >
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
        Confirming your account...
      </div>
    </div>
  );
}
```

---

## 7. Password Reset Request — `src/routes/auth/reset.tsx`

```typescript
import { useState } from 'react';
import { createRoute, Link } from '@tanstack/react-router';
import { publicRootRoute } from '../__root';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const authResetRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/auth/reset',
  component: PasswordResetPage,
});

function PasswordResetPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${import.meta.env.VITE_APP_URL}/auth/reset-confirm`,
      });
      if (err) setError(err.message);
      else setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-sm mx-auto py-20 text-center space-y-3">
        <p className="font-medium text-lg">Check your email</p>
        <p className="text-sm text-muted-foreground">
          We sent a password reset link to <strong>{email}</strong>.
          The link expires in 1 hour.
        </p>
        <Link
          to="/auth"
          search={{ mode: 'signin', redirect: '' }}
          className="text-primary text-sm hover:underline"
        >
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto py-20 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            Enter your email and we'll send a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={submitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send reset email'}
            </Button>
          </form>
          <p className="text-center mt-4">
            <Link
              to="/auth"
              search={{ mode: 'signin', redirect: '' }}
              className="text-sm text-primary hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 8. Password Reset Confirm — `src/routes/auth/reset-confirm.tsx`

```typescript
import { useState, useEffect } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { publicRootRoute } from '../__root';
import { supabase } from '@/lib/supabase';
import type { AuthError } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const authResetConfirmRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/auth/reset-confirm',
  validateSearch: (search) => ({ code: (search.code as string) ?? '' }),
  component: ResetConfirmPage,
});

function ResetConfirmPage() {
  const { code } = authResetConfirmRoute.useSearch();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Exchange the reset code for a session so updateUser() works
  useEffect(() => {
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(
        (result: { error: AuthError | null }) => {
          if (result.error) setError('Reset link is invalid or expired.');
        }
      );
    }
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) setError(err.message);
      else setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-sm mx-auto py-20 text-center space-y-4">
        <p className="font-medium text-lg">Password updated</p>
        <p className="text-sm text-muted-foreground">
          You can now sign in with your new password.
        </p>
        <Button onClick={() => navigate({ to: '/' })}>Go to dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto py-20 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Set new password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && !error.includes('match') && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                minLength={8}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your new password"
                disabled={submitting}
              />
              {error.includes('match') && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 9. Onboarding — `src/routes/onboarding.tsx`

Runs after first sign-up. Collects firm name, accountant name, and TIN for PDF reports.

```typescript
import { useState, useEffect } from 'react';
import { createRoute, useNavigate, Link } from '@tanstack/react-router';
import { publicRootRoute } from './__root';
import { Calculator, Loader2, FilePlus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { createOrganization } from '@/lib/organizations';
import { saveFirmProfile } from '@/lib/firm-profile';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export const onboardingRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/onboarding',
  component: OnboardingPage,
});

type OnboardingStep = 'firm' | 'profile' | 'done';

function OnboardingPage() {
  const { user, loading } = useAuth();
  const { organization } = useOrganization(user?.id ?? null);
  const navigate = useNavigate();
  const [step, setStep] = useState<OnboardingStep>('firm');
  const [submitting, setSubmitting] = useState(false);

  // Firm step fields
  const [firmName, setFirmName] = useState('');
  const [firmPhone, setFirmPhone] = useState('');
  const [firmAddress, setFirmAddress] = useState('');

  // Profile step fields (accountant/CPA info for PDF header)
  const [accountantName, setAccountantName] = useState('');
  const [tin, setTin] = useState('');
  const [prcId, setPrcId] = useState('');

  // Guard: redirect if not logged in or already onboarded
  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: '/auth', search: { mode: 'signin' as const, redirect: '' } });
    }
    if (!loading && organization) {
      navigate({ to: '/' }); // already completed onboarding
    }
  }, [user, loading, organization]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const STEPS: OnboardingStep[] = ['firm', 'profile', 'done'];
  const stepIndex = STEPS.indexOf(step);

  const handleFirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmName.trim()) return;
    setSubmitting(true);
    try {
      await createOrganization(firmName.trim());
      // Save optional firm contact info to user_profiles
      if (user && (firmPhone || firmAddress)) {
        await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            firm_name: firmName.trim(),
            firm_phone: firmPhone || null,
            firm_address: firmAddress || null,
          });
      }
      setStep('profile');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create firm');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (user) {
        await saveFirmProfile(user.id, {
          accountantName,
          tin: tin || null,
          prcId: prcId || null,
        });
      }
    } catch {
      // Non-fatal — profile can be completed later in Settings
    } finally {
      setSubmitting(false);
      setStep('done');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Calculator className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-foreground">TaxKlaro</span>
        </div>

        {/* Step progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={cn(
                'h-2 w-2 rounded-full transition-colors duration-200',
                i <= stepIndex ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>

        {step === 'firm' && (
          <Card>
            <CardHeader>
              <CardTitle>Set up your firm</CardTitle>
              <CardDescription>
                This takes 30 seconds and unlocks computation history and PDF export.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFirmSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firm-name">
                    Firm Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firm-name"
                    required
                    placeholder="Santos & Reyes CPA Firm"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firm-phone">
                    Phone <span className="text-xs text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="firm-phone"
                    type="tel"
                    placeholder="+63 2 1234 5678"
                    value={firmPhone}
                    onChange={(e) => setFirmPhone(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firm-address">
                    Address <span className="text-xs text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="firm-address"
                    placeholder="Unit 5, Bldg A, Makati City"
                    value={firmAddress}
                    onChange={(e) => setFirmAddress(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={submitting || !firmName.trim()}
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Creating...</>
                  ) : (
                    'Continue →'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>Your CPA profile</CardTitle>
              <CardDescription>
                Used in PDF tax computation reports. You can update this later in Settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountant-name">Full Name</Label>
                  <Input
                    id="accountant-name"
                    placeholder="Juan dela Cruz, CPA"
                    value={accountantName}
                    onChange={(e) => setAccountantName(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tin">
                    TIN <span className="text-xs text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="tin"
                    placeholder="123-456-789-000"
                    value={tin}
                    onChange={(e) => setTin(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prc-id">
                    PRC ID No. <span className="text-xs text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="prc-id"
                    placeholder="0012345"
                    value={prcId}
                    onChange={(e) => setPrcId(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1 gap-2" disabled={submitting}>
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />Saving...</>
                    ) : (
                      'Continue →'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('done')}
                    disabled={submitting}
                  >
                    Skip
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'done' && (
          <Card>
            <CardContent className="py-8 text-center space-y-4">
              <div className="inline-flex items-center justify-center rounded-full bg-green-100 p-4 mb-2">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">You're all set!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Your firm profile is configured. Start computing freelance taxes.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Link to="/computations/new">
                  <Button className="w-full gap-2">
                    <FilePlus className="h-4 w-4" />
                    Compute Your First Tax
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="ghost" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

---

## 10. `lib/auth.ts` — Auth Operation Wrappers

```typescript
// src/lib/auth.ts

import { supabase } from './supabase';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange(
    (_event: AuthChangeEvent, session: Session | null) => {
      callback(session?.user ?? null);
    }
  );
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp(
  email: string,
  password: string,
  fullName?: string,
): Promise<{ user: User | null; session: Session | null } | null> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName ?? '' },
      emailRedirectTo: `${import.meta.env.VITE_APP_URL}/auth/callback`,
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${import.meta.env.VITE_APP_URL}/auth/reset-confirm`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}
```

---

## 11. `lib/firm-profile.ts` — CPA Profile

```typescript
// src/lib/firm-profile.ts

import { supabase } from './supabase';

export interface FirmProfile {
  accountantName: string;
  tin: string | null;
  prcId: string | null;
}

export async function saveFirmProfile(userId: string, profile: FirmProfile): Promise<void> {
  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      accountant_name: profile.accountantName,
      tin: profile.tin,
      prc_id: profile.prcId,
    });
  if (error) throw error;
}

export async function loadFirmProfile(userId: string): Promise<FirmProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('accountant_name, tin, prc_id')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return {
    accountantName: data.accountant_name ?? '',
    tin: data.tin,
    prcId: data.prc_id,
  };
}
```

---

## 12. SetupPage — `src/components/SetupPage.tsx`

Shown when Supabase env vars are missing (dev/misconfigured deployments).

```typescript
// src/components/SetupPage.tsx

import { AlertCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SetupPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">TaxKlaro</h1>
          <p className="text-muted-foreground text-sm mt-1">Setup Required</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Missing Environment Variables</AlertTitle>
          <AlertDescription>
            <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>{' '}
            must be set before TaxKlaro can start.
          </AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>1. Create a Supabase project at supabase.com</p>
            <p>2. Copy your project URL and anon key</p>
            <p>3. Create <code>.env.local</code> in the frontend root:</p>
            <pre className="bg-muted p-3 rounded text-xs overflow-auto">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=http://localhost:5173`}
            </pre>
            <p>4. Restart the dev server</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## 13. `beforeLoad` Auth Guard Pattern

For all authenticated routes, apply this pattern:

```typescript
import { createRoute, redirect } from '@tanstack/react-router';
import { rootRoute } from './__root';
import type { RouterContext } from '@/router';

export const computationsIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/computations',
  beforeLoad: ({ context }: { context: RouterContext }) => {
    if (!context.auth.user) {
      throw redirect({
        to: '/auth',
        search: { mode: 'signin', redirect: '/computations' },
      });
    }
  },
  component: ComputationsPage,
});
```

**Rules:**
- `beforeLoad` receives `context` typed as `RouterContext`
- If `!context.auth.user`, throw `redirect(...)` to `/auth` with current path as `redirect` query param
- After sign-in, `navigate({ to: redirectTo || '/' })` returns user to original destination
- Public routes (`/auth`, `/share/*`, `/invite/*`, `/onboarding`) use `publicRootRoute` as parent — they do NOT have `beforeLoad` guards

---

## 14. Auth Flow State Machine

```
[Unauthenticated] → /auth?mode=signup → fill form → submit
  → if auto-confirmed: createOrg → /onboarding
  → if email-required: show "Check your email"
    → user clicks email link → /auth/callback?code=XXX
      → exchangeCodeForSession → createOrg → /onboarding

[/onboarding] → fill firm name → Continue → fill CPA profile → Continue
  → "You're all set!" → /computations/new OR /

[Authenticated] → any protected route → beforeLoad checks auth.user
  → if null: redirect to /auth?redirect=original-path
  → after sign-in: navigate to original-path

[Password reset] → /auth → "Forgot password?" link → /auth/reset
  → enter email → "Send reset email" → check email
  → user clicks email link → /auth/reset-confirm?code=XXX
    → exchangeCodeForSession → set new password → updateUser → /

[Sign out] → AppLayout sign-out button → supabase.auth.signOut()
  → onAuthStateChange fires → user = null → router redirects to /auth
```

---

## 15. Supabase Email Redirect URLs (must be configured in Supabase dashboard)

| Event | Redirect URL |
|-------|--------------|
| Email confirmation | `{VITE_APP_URL}/auth/callback` |
| Password reset | `{VITE_APP_URL}/auth/reset-confirm` |
| Magic link (if used) | `{VITE_APP_URL}/auth/callback` |

In Supabase dashboard: **Authentication > URL Configuration > Redirect URLs**, add both:
- `http://localhost:5173/auth/callback` (development)
- `https://taxklaro.ph/auth/callback` (production)
- `https://taxklaro.ph/auth/reset-confirm` (production)

---

## 16. Critical Traps (Avoid These)

1. **Do NOT call `onAuthStateChange` before `getSession`** in `main.tsx`. `getSession` resolves the cached session from localStorage synchronously; `onAuthStateChange` is event-driven. If you only use `onAuthStateChange`, the initial render sees `user = null` for a brief flash, triggering a redirect to `/auth`.

2. **Do NOT use `createRootRoute` for typed context** — use `createRootRouteWithContext<RouterContext>()`. Otherwise `context.auth` is typed as `unknown` in `beforeLoad`.

3. **`exchangeCodeForSession` must be called with the raw `?code` from the URL** — do NOT use `?token` (that's the old Supabase v1 pattern). The PKCE flow always uses `?code`.

4. **`signUp` emailRedirectTo must be set** in `lib/auth.ts` `signUp()` call, not just in the Supabase dashboard. Dashboard URL is a security allowlist; the actual redirect per-request is set in `options.emailRedirectTo`.

5. **Password minLength must be 8 in the HTML `<Input minLength={8}>` AND validated client-side** — Supabase's default minimum is 6, but TaxKlaro enforces 8 characters.

6. **Do NOT create the org in both `auth.tsx` (auto-confirm path) and `auth/callback.tsx`** — only one path executes. The callback route checks for existing org membership before creating to handle re-confirmation gracefully.

---

## 17. File Summary

| File | Description |
|------|-------------|
| `src/lib/supabase.ts` | Supabase client singleton + `supabaseConfigured` |
| `src/lib/auth.ts` | `signIn`, `signUp`, `signOut`, `resetPassword`, `updatePassword`, `onAuthStateChange` |
| `src/lib/firm-profile.ts` | `saveFirmProfile`, `loadFirmProfile` |
| `src/lib/organizations.ts` | `createOrganization`, `getUserOrganization`, `listMembers` (see org-model aspect) |
| `src/routes/__root.tsx` | `rootRoute` (context-typed), `publicRootRoute`, `RootLayout` |
| `src/routes/auth.tsx` | Sign in / Create Account page |
| `src/routes/auth/callback.tsx` | PKCE email confirmation handler |
| `src/routes/auth/reset.tsx` | Password reset request page |
| `src/routes/auth/reset-confirm.tsx` | Set new password page |
| `src/routes/onboarding.tsx` | Post-signup firm + profile setup wizard |
| `src/components/SetupPage.tsx` | Shown when env vars are missing |
| `src/main.tsx` | App bootstrap, auth state init, `supabaseConfigured` guard |
| `src/router.ts` | Router + `RouterContext` type declaration |
