import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';

export const ClientsIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clients',
  beforeLoad: authGuard,
  component: ClientsPage,
});

function ClientsPage() {
  return <div data-testid="clients-page">Clients</div>;
}
