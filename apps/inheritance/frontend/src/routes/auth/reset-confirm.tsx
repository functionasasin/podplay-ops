import { useState, useEffect } from 'react';
import { createRoute, useNavigate } from '@tanstack/react-router';
import { publicRootRoute } from '../__root';
import { supabase } from '@/lib/supabase';
import type { AuthError } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then((result: { error: AuthError | null }) => {
        if (result.error) setError('Reset link is invalid or expired.');
      });
    }
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) setError(err.message);
    else setDone(true);
  };

  if (done) return (
    <div className="max-w-sm mx-auto py-20 text-center space-y-3">
      <p className="font-medium">Password updated</p>
      <Button onClick={() => navigate({ to: '/' })}>Go to dashboard</Button>
    </div>
  );
  return (
    <div className="max-w-sm mx-auto py-20 space-y-4">
      <h1 className="text-xl font-bold font-serif">Set new password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && !error.includes('match') && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <div className="space-y-1">
          <Label>New Password</Label>
          <Input type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Confirm Password</Label>
          <Input type="password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error.includes('match') && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <Button type="submit" className="w-full">Update password</Button>
      </form>
    </div>
  );
}
