import { createRoute } from '@tanstack/react-router';
import { publicRootRoute } from '../__root';

export const AuthResetConfirmRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/auth/reset-confirm',
  component: AuthResetConfirmPage,
});

function AuthResetConfirmPage() {
  // Reads #access_token= from URL HASH, not query params
  return <div data-testid="auth-reset-confirm-page">Set New Password</div>;
}
