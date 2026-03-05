import { createRouter } from '@tanstack/react-router';
import type { User } from '@supabase/supabase-js';
import { rootRoute, publicRootRoute } from './routes/__root';
import { indexRoute } from './routes/index';
import { authRoute } from './routes/auth';
import { authCallbackRoute } from './routes/auth/callback';
import { authResetRoute } from './routes/auth/reset';
import { authResetConfirmRoute } from './routes/auth/reset-confirm';
import { casesNewRoute } from './routes/cases/new';
import { caseIdRoute } from './routes/cases/$caseId';
import { clientsRoute } from './routes/clients/index';
import { newClientRoute } from './routes/clients/new';
import { clientDetailRoute } from './routes/clients/$clientId';
import { deadlinesRoute } from './routes/deadlines';
import { settingsRoute } from './routes/settings/index';
import { shareTokenRoute } from './routes/share/$token';

const routeTree = rootRoute.addChildren([
  publicRootRoute.addChildren([
    authRoute,
    authCallbackRoute,
    authResetRoute,
    authResetConfirmRoute,
    shareTokenRoute,
  ]),
  indexRoute,
  casesNewRoute,
  caseIdRoute,
  clientsRoute,
  newClientRoute,
  clientDetailRoute,
  deadlinesRoute,
  settingsRoute,
]);

export const router = createRouter({
  routeTree,
  context: {
    auth: undefined as { user: User | null } | undefined,
  },
});

// Type-safe route registration
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
