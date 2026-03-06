import { createRouter } from '@tanstack/react-router';
import { rootRoute, publicRootRoute } from './routes/__root';

import { IndexRoute } from './routes/index';
import { AuthRoute } from './routes/auth';
import { AuthCallbackRoute } from './routes/auth/callback';
import { AuthResetRoute } from './routes/auth/reset';
import { AuthResetConfirmRoute } from './routes/auth/reset-confirm';
import { OnboardingRoute } from './routes/onboarding';
import { InviteTokenRoute } from './routes/invite/$token';
import { ShareTokenRoute } from './routes/share/$token';
import { ComputationsIndexRoute } from './routes/computations/index';
import { ComputationsNewRoute } from './routes/computations/new';
import { ComputationsCompIdRoute } from './routes/computations/$compId';
import { ComputationsCompIdQuarterlyRoute } from './routes/computations/$compId.quarterly';
import { ClientsIndexRoute } from './routes/clients/index';
import { ClientsNewRoute } from './routes/clients/new';
import { ClientsClientIdRoute } from './routes/clients/$clientId';
import { DeadlinesRoute } from './routes/deadlines';
import { SettingsIndexRoute } from './routes/settings/index';
import { SettingsTeamRoute } from './routes/settings/team';

// /computations/new MUST come before /computations/$compId
const routeTree = rootRoute.addChildren([
  IndexRoute,
  publicRootRoute.addChildren([
    AuthRoute,
    AuthCallbackRoute,
    AuthResetRoute,
    AuthResetConfirmRoute,
    OnboardingRoute,
    InviteTokenRoute,
    ShareTokenRoute,
  ]),
  ComputationsIndexRoute,
  ComputationsNewRoute,
  ComputationsCompIdRoute,
  ComputationsCompIdQuarterlyRoute,
  ClientsIndexRoute,
  ClientsNewRoute,
  ClientsClientIdRoute,
  DeadlinesRoute,
  SettingsIndexRoute,
  SettingsTeamRoute,
]);

export const router = createRouter({
  routeTree,
  context: { auth: { user: null } },
});

export type { RouterContext } from './routes/__root';

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
