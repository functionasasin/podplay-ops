import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { LoginPage } from '@/components/auth/LoginPage';

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute('/login')({
  validateSearch: loginSearchSchema,
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      // /projects route not yet in tree — use href redirect
      throw redirect({ href: '/projects' });
    }
  },
  component: LoginRoute,
});

function LoginRoute() {
  const search = Route.useSearch();
  const redirectTo = search.redirect ?? '/projects';

  function onSuccess() {
    // redirectTo may include routes not yet in the tree (e.g. /projects) — use href navigation
    window.location.href = redirectTo;
  }

  return <LoginPage redirectTo={redirectTo} onSuccess={onSuccess} />;
}
