import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';

export const ComputationsCompIdRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/computations/$compId',
  beforeLoad: authGuard,
  component: ComputationDetailPage,
});

function ComputationDetailPage() {
  return <div data-testid="computation-detail-page">Computation Detail</div>;
}
