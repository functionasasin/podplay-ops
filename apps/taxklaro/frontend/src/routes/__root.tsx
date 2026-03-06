import { createRootRouteWithContext, createRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import type { User } from '@supabase/supabase-js';

export interface RouterContext {
  auth: { user: User | null };
}

function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster position="top-right" richColors toastOptions={{ classNames: { toast: 'font-sans text-sm' } }} />
    </>
  );
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

// Public sub-root: wraps auth/share/invite routes — no AppLayout
export const publicRootRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'public',
  component: Outlet,
});
