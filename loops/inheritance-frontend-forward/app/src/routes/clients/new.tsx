import { createRoute, useNavigate } from '@tanstack/react-router';
import { rootRoute } from '../__root';
import { ClientForm, type ClientFormData } from '@/components/clients/ClientForm';
import { createClient } from '@/lib/clients';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useState } from 'react';
import type { GovIdType, CivilStatus } from '@/types/client';

export const newClientRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/clients/new',
  component: NewClientPage,
});

function NewClientPage() {
  const { user } = useAuth();
  const { organization } = useOrganization(user?.id ?? null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: ClientFormData) => {
    if (!user || !organization) return;
    setLoading(true);
    try {
      const { id } = await createClient({
        org_id: organization.id,
        full_name: data.full_name,
        nickname: data.nickname || null,
        date_of_birth: data.date_of_birth || null,
        place_of_birth: data.place_of_birth || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        tin: data.tin || null,
        gov_id_type: (data.gov_id_type || null) as GovIdType | null,
        gov_id_number: data.gov_id_number || null,
        civil_status: (data.civil_status || null) as CivilStatus | null,
        intake_date: data.intake_date || new Date().toISOString().slice(0, 10),
        referral_source: data.referral_source || null,
        created_by: user.id,
      });
      navigate({ to: '/clients/$clientId', params: { clientId: id } });
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      <h1 className="text-xl font-bold tracking-tight font-serif mb-6">
        New Client
      </h1>
      <ClientForm onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
