import { createRoute } from '@tanstack/react-router';
import { publicRootRoute } from '../__root';

export const InviteTokenRoute = createRoute({
  getParentRoute: () => publicRootRoute,
  path: '/invite/$token',
  component: InvitePage,
});

function InvitePage() {
  return <div data-testid="invite-page">Accept Invitation</div>;
}
