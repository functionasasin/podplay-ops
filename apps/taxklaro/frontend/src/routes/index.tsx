import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root';

export const IndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexPage,
});

function IndexPage() {
  return <div data-testid="index-page">Dashboard</div>;
}
