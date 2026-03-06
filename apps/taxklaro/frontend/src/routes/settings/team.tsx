import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';

export const SettingsTeamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/team',
  beforeLoad: authGuard,
  component: SettingsTeamPage,
});

function SettingsTeamPage() {
  return <div data-testid="settings-team-page">Team Settings</div>;
}
