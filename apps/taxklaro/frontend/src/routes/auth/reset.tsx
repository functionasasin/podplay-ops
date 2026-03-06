import { createRoute } from '@tanstack/react-router';
import { publicRootRoute } from '../__root';

export const AuthResetRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/auth/reset',
  component: AuthResetPage,
});

function AuthResetPage() {
  return <div data-testid="auth-reset-page">Reset Password</div>;
}
