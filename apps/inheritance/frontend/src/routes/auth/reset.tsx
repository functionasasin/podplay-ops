import { useState } from 'react';
import { createRoute, Link } from '@tanstack/react-router';
import { publicRootRoute } from '../__root';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const authResetRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/auth/reset',
  component: PasswordResetPage,
});

function PasswordResetPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.VITE_APP_URL}/auth/reset-confirm`,
    });
    if (err) setError(err.message);
    else setSent(true);
  };

  if (sent) return (
    <div className="max-w-sm mx-auto py-20 text-center space-y-3">
      <p className="font-medium">Check your email</p>
      <p className="text-sm text-muted-foreground">We sent a password reset link to {email}.</p>
      <Link to="/auth" search={{ mode: 'signin', redirect: '' }} className="text-primary text-sm hover:underline">Return to sign in</Link>
    </div>
  );
  return (
    <div className="max-w-sm mx-auto py-20">
      <h1 className="text-xl font-bold mb-2 font-serif">Reset your password</h1>
      <p className="text-sm text-muted-foreground mb-6">Enter your email and we'll send a reset link.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <div className="space-y-1">
          <Label htmlFor="reset-email">Email</Label>
          <Input id="reset-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <Button type="submit" className="w-full">Send reset email</Button>
      </form>
      <p className="text-center mt-4"><Link to="/auth" search={{ mode: 'signin', redirect: '' }} className="text-sm text-primary hover:underline">Back to sign in</Link></p>
    </div>
  );
}
