import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { LayoutDashboard } from 'lucide-react';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <div className="flex items-center gap-2 mb-6">
        <LayoutDashboard className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight font-serif">
          Dashboard
        </h1>
      </div>
      <p className="text-muted-foreground">
        Sign in to view your cases. Use "New Case" to start an inheritance
        computation.
      </p>
    </div>
  );
}
