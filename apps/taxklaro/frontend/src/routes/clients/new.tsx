import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';

export const ClientsNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clients/new',
  beforeLoad: authGuard,
  component: ClientsNewPage,
});

function ClientsNewPage() {
  return <div data-testid="clients-new-page">New Client</div>;
}
