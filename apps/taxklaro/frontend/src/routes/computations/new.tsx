import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';

// Must be registered BEFORE /computations/$compId so "new" wins over dynamic param
export const ComputationsNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/computations/new',
  beforeLoad: authGuard,
  component: ComputationsNewPage,
});

function ComputationsNewPage() {
  return <div data-testid="computations-new-page">New Computation</div>;
}
