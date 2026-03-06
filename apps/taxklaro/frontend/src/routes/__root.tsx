import { createRootRouteWithContext, createRoute, Outlet } from '@tanstack/react-router';
import type { User } from '@supabase/supabase-js';

export interface RouterContext {
  auth: { user: User | null };
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
});

// Public sub-root: wraps auth/share/invite routes — no AppLayout
export const publicRootRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'public',
  component: Outlet,
});
