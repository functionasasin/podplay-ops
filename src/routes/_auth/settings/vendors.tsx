import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';
import { VendorSettings } from '@/components/settings/VendorSettings';

export const Route = createFileRoute('/_auth/settings/vendors')({
  loader: async () => {
    const { data } = await supabase.from('vendors').select('*').order('name');
    return data ?? [];
  },
  component: () => {
    const data = Route.useLoaderData();
    return <VendorSettings vendors={data} />;
  },
});
