import { createRoute } from '@tanstack/react-router';
import { publicRootRoute } from '../__root';

export const AuthCallbackRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/auth/callback',
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  // Extracts PKCE code from window.location.search (?code=), NOT from hash
  return <div data-testid="auth-callback-page">Processing...</div>;
}
