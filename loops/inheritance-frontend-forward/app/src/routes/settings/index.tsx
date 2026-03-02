import { createRoute } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { Settings } from 'lucide-react';

export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight font-serif">
          Settings
        </h1>
      </div>
      <p className="text-muted-foreground">
        Firm branding settings coming in Stage 10.
      </p>
    </div>
  );
}
