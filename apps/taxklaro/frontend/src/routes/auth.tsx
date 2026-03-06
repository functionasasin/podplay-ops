import { createRoute } from '@tanstack/react-router';
import { publicRootRoute } from './__root';

export const AuthRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/auth',
  component: AuthPage,
});

function AuthPage() {
  return <div data-testid="auth-page">Sign In</div>;
}
