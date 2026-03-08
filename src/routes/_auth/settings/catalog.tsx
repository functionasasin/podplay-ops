import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { getCatalogItems } from '@/services/catalogService';
import { CatalogSettings } from '@/components/settings/CatalogSettings';

const catalogSearchSchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  inactive: z.boolean().default(false),
});

export const Route = createFileRoute('/_auth/settings/catalog')({
  validateSearch: (s) => catalogSearchSchema.parse(s),
  loader: async ({ context: _ctx }) => getCatalogItems({ includeInactive: false }),
  component: () => {
    const items = Route.useLoaderData();
    return <CatalogSettings items={items} />;
  },
});
