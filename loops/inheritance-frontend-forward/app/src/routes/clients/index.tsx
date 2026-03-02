import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { Users } from 'lucide-react';

export const clientsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clients',
  component: ClientsPage,
});

function ClientsPage() {
  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight font-serif">
          Clients
        </h1>
      </div>
      <p className="text-muted-foreground">
        Client management coming in Stage 17.
      </p>
    </div>
  );
}
