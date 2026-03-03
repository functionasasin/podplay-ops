import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../__root';

export const clientDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clients/$clientId',
  component: ClientDetailPage,
});

function ClientDetailPage() {
  // stub — implementation in next iteration
  return (
    <div data-testid="client-detail-page" className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <h1 className="text-xl font-bold tracking-tight font-serif mb-6">
        Client Detail
      </h1>
      <section data-testid="client-identity-section">
        <h2>Identity</h2>
      </section>
      <section data-testid="client-contact-section">
        <h2>Contact</h2>
      </section>
      <section data-testid="client-legal-section">
        <h2>Legal IDs</h2>
      </section>
      <section data-testid="client-intake-section">
        <h2>Intake</h2>
      </section>
      <section data-testid="client-cases-section">
        <h2>Cases</h2>
      </section>
      <section data-testid="client-conflict-log-section">
        <h2>Conflict Check Log</h2>
      </section>
    </div>
  );
}
