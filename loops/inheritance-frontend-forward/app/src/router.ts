import { createRouter } from '@tanstack/react-router';
import { rootRoute } from './routes/__root';
import { indexRoute } from './routes/index';
import { authRoute } from './routes/auth';
import { casesNewRoute } from './routes/cases/new';
import { caseIdRoute } from './routes/cases/$caseId';
import { clientsRoute } from './routes/clients/index';
import { newClientRoute } from './routes/clients/new';
import { clientDetailRoute } from './routes/clients/$clientId';
import { deadlinesRoute } from './routes/deadlines';
import { settingsRoute } from './routes/settings/index';
import { shareTokenRoute } from './routes/share/$token';

const routeTree = rootRoute.addChildren([
  indexRoute,
  authRoute,
  casesNewRoute,
  caseIdRoute,
  clientsRoute,
  newClientRoute,
  clientDetailRoute,
  deadlinesRoute,
  settingsRoute,
  shareTokenRoute,
]);

export const router = createRouter({ routeTree });

// Type-safe route registration
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
