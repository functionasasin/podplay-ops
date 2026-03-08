import { createFileRoute } from '@tanstack/react-router';
import { getSettings } from '@/services/settingsService';
import { getTeamContacts } from '@/services/teamContactsService';
import { TeamSettings } from '@/components/settings/TeamSettings';

export const Route = createFileRoute('/_auth/settings/team')({
  loader: async () => {
    const [settings, contacts] = await Promise.all([
      getSettings(),
      getTeamContacts({ includeInactive: false }),
    ]);
    return { settings, contacts };
  },
  component: () => {
    const { settings, contacts } = Route.useLoaderData();
    return <TeamSettings settings={settings} contacts={contacts} />;
  },
});
