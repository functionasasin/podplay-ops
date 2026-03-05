import { createRootRoute, createRoute, Outlet, useRouterState } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/AppLayout';

export const rootRoute = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPublicRoute =
    pathname.startsWith('/auth') ||
    pathname.startsWith('/share/') ||
    pathname.startsWith('/invite/');
  if (isPublicRoute) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Outlet />
      </div>
    );
  }
  return <AppLayout><Outlet /></AppLayout>;
}

function MinimalLayout() {
  return (
    <main className="min-h-screen bg-background">
      <Outlet />
    </main>
  );
}

export const publicRootRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_public',
  component: MinimalLayout,
});
