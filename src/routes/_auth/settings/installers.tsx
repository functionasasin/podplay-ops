import { createFileRoute } from '@tanstack/react-router';
import { getInstallers } from '@/services/installersService';
import { InstallerSettings } from '@/components/settings/InstallerSettings';

export const Route = createFileRoute('/_auth/settings/installers')({
  loader: async () => {
    return getInstallers({ includeInactive: true });
  },
  component: () => {
    const data = Route.useLoaderData();
    return <InstallerSettings installers={data} />;
  },
});
