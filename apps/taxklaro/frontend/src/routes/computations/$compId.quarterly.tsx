import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';

// Dot notation makes this a sibling, not a nested child of $compId
export const ComputationsCompIdQuarterlyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/computations/$compId/quarterly',
  beforeLoad: authGuard,
  component: QuarterlyPage,
});

function QuarterlyPage() {
  return <div data-testid="quarterly-page">Quarterly Breakdown</div>;
}
