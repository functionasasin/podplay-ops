import { redirect } from '@tanstack/react-router';
import type { RouterContext } from '../routes/__root';

// Applied to all 11 authenticated routes
export function authGuard({
  context,
  location,
}: {
  context: RouterContext;
  location: { href: string };
}) {
  if (!context.auth.user) {
    throw redirect({
      to: '/auth',
      search: { redirect: location.href, mode: 'signin' },
    });
  }
}
