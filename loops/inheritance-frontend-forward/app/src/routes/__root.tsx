import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AppLayout } from '@/components/layout/AppLayout';

export const rootRoute = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
