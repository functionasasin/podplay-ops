import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';

export const ComputationsIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/computations',
  beforeLoad: authGuard,
  component: ComputationsPage,
});

function ComputationsPage() {
  return <div data-testid="computations-page">Computations</div>;
}
