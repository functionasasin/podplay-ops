import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';

export const SettingsIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  beforeLoad: authGuard,
  component: SettingsPage,
});

function SettingsPage() {
  return <div data-testid="settings-page">Settings</div>;
}
