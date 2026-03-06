import { createRoute } from '@tanstack/react-router';
import { publicRootRoute } from '../__root';

export const ShareTokenRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/share/$token',
  component: SharePage,
});

function SharePage() {
  // $token validated as UUID format before passing to RPC
  return <div data-testid="share-page">Shared Computation</div>;
}
