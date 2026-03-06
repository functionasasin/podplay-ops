import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '../lib/supabase';
import type { Organization, OrgRole } from '../types/org';

export interface UseOrganizationResult {
  org: Organization | null;
  role: OrgRole | null;
  orgId: string | null;
  isLoading: boolean;
  canInvite: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExportPdf: boolean;
  canShare: boolean;
}

const ROLE_CAPS: Record<OrgRole, { canInvite: boolean; canEdit: boolean; canDelete: boolean }> = {
  admin:      { canInvite: true,  canEdit: true,  canDelete: true  },
  accountant: { canInvite: false, canEdit: true,  canDelete: false },
  staff:      { canInvite: false, canEdit: true,  canDelete: false },
  readonly:   { canInvite: false, canEdit: false, canDelete: false },
};

export function useOrganization(): UseOrganizationResult {
  const [org, setOrg] = useState<Organization | null>(null);
  const [role, setRole] = useState<OrgRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select('org_id, role')
        .eq('user_id', user.id)
        .single();

      if (memberError || !member) {
        if (!cancelled) {
          setIsLoading(false);
          navigate({ to: '/onboarding' });
        }
        return;
      }

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, slug, plan, seat_limit, created_at')
        .eq('id', member.org_id)
        .single();

      if (!cancelled) {
        if (!orgError && orgData) {
          setOrg({
            id: orgData.id,
            name: orgData.name,
            slug: orgData.slug,
            plan: orgData.plan,
            seatLimit: orgData.seat_limit,
            createdAt: orgData.created_at,
          });
          setRole(member.role as OrgRole);
        }
        setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [navigate]);

  const caps = role ? ROLE_CAPS[role] : { canInvite: false, canEdit: false, canDelete: false };
  const isPaidPlan = org ? org.plan !== 'free' : false;

  return {
    org,
    role,
    orgId: org?.id ?? null,
    isLoading,
    canInvite: caps.canInvite,
    canEdit: caps.canEdit,
    canDelete: caps.canDelete,
    canExportPdf: isPaidPlan,
    canShare: isPaidPlan,
  };
}
