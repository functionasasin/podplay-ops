import { createFileRoute } from '@tanstack/react-router';
import { getSettings } from '@/services/settingsService';
import { TravelSettings } from '@/components/settings/TravelSettings';

export const Route = createFileRoute('/_auth/settings/travel')({
  loader: async () => getSettings(),
  component: () => {
    const settings = Route.useLoaderData();
    return <TravelSettings settings={settings} />;
  },
});
