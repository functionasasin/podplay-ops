import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { ClientForm } from '@/components/clients/ClientForm';

export const newClientRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clients/new',
  component: NewClientPage,
});

function NewClientPage() {
  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <h1 className="text-xl font-bold tracking-tight font-serif mb-6">
        New Client
      </h1>
      <ClientForm
        onSubmit={() => {
          // stub — implementation in next iteration
        }}
      />
    </div>
  );
}
