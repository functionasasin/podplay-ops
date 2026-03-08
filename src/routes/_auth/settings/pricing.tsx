import { createFileRoute } from '@tanstack/react-router';
import { getSettings } from '@/services/settingsService';
import { PricingSettings } from '@/components/settings/PricingSettings';

export const Route = createFileRoute('/_auth/settings/pricing')({
  loader: async () => getSettings(),
  component: () => {
    const settings = Route.useLoaderData();
    return <PricingSettings settings={settings} />;
  },
});
