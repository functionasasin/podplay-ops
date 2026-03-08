import { createFileRoute } from '@tanstack/react-router';

function PricingSettingsPage() {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Pricing settings — coming soon.</p>
    </div>
  );
}

export const Route = createFileRoute('/_auth/settings/pricing')({
  component: PricingSettingsPage,
});
