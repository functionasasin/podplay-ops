import { createFileRoute } from '@tanstack/react-router';

function CatalogSettingsPage() {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Catalog settings — coming soon.</p>
    </div>
  );
}

export const Route = createFileRoute('/_auth/settings/catalog')({
  component: CatalogSettingsPage,
});
