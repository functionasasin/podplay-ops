import { createFileRoute } from '@tanstack/react-router';

function TeamSettingsPage() {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Team settings — coming soon.</p>
    </div>
  );
}

export const Route = createFileRoute('/_auth/settings/team')({
  component: TeamSettingsPage,
});
