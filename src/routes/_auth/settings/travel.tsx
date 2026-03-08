import { createFileRoute } from '@tanstack/react-router';

function TravelSettingsPage() {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Travel settings — coming soon.</p>
    </div>
  );
}

export const Route = createFileRoute('/_auth/settings/travel')({
  component: TravelSettingsPage,
});
