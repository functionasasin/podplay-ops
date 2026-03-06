import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';

export const ClientsClientIdRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clients/$clientId',
  beforeLoad: authGuard,
  component: ClientDetailPage,
});

function ClientDetailPage() {
  return <div data-testid="client-detail-page">Client Detail</div>;
}
