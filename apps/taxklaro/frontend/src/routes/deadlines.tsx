import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { authGuard } from '../lib/auth-guard';

export const DeadlinesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/deadlines',
  beforeLoad: authGuard,
  component: DeadlinesPage,
});

function DeadlinesPage() {
  return <div data-testid="deadlines-page">Deadlines</div>;
}
