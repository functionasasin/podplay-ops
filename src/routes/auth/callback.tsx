import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { AuthCallback } from '@/components/auth/AuthCallback';

const callbackSearchSchema = z.object({
  code: z.string().optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute('/auth/callback')({
  validateSearch: callbackSearchSchema,
  component: AuthCallbackRoute,
});

function AuthCallbackRoute() {
  const search = Route.useSearch();
  return <AuthCallback code={search.code} redirectTo={search.redirect} />;
}
