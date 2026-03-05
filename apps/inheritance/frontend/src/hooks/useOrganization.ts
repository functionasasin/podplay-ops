import { useState, useEffect, useCallback } from 'react';
import type { Organization, OrganizationMember, OrgRole } from '@/types';
import { ROLE_PERMISSIONS } from '@/types';
import * as orgLib from '@/lib/organizations';

export interface UseOrganizationReturn {
  organization: Organization | null;
  members: OrganizationMember[];
  currentRole: OrgRole | null;
  loading: boolean;
  error: string | null;
  refreshMembers: () => Promise<void>;
  inviteMember: (email: string, role: OrgRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: OrgRole) => Promise<void>;
  revokeInvitation: (invitationId: string) => Promise<void>;
  canPerform: (action: keyof typeof ROLE_PERMISSIONS['admin']) => boolean;
}

export function useOrganization(userId: string | null): UseOrganizationReturn {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [currentRole, setCurrentRole] = useState<OrgRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshMembers = useCallback(async () => {
    if (!organization) return;
    try {
      const m = await orgLib.listMembers(organization.id);
      setMembers(m);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    }
  }, [organization]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const org = await orgLib.getUserOrganization(userId);
        if (cancelled) return;
        setOrganization(org);

        if (org) {
          const m = await orgLib.listMembers(org.id);
          if (cancelled) return;
          setMembers(m);
          const myMembership = m.find((mem) => mem.user_id === userId);
          setCurrentRole(myMembership?.role ?? null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load organization');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const inviteMember = async (email: string, role: OrgRole) => {
    if (!organization || !userId) throw new Error('No organization');
    await orgLib.inviteMember(organization.id, email, role, userId);
    await refreshMembers();
  };

  const removeMember = async (memberId: string) => {
    await orgLib.removeMember(memberId);
    await refreshMembers();
  };

  const updateMemberRole = async (memberId: string, role: OrgRole) => {
    await orgLib.updateMemberRole(memberId, role);
    await refreshMembers();
  };

  const revokeInvitation = async (invitationId: string) => {
    await orgLib.revokeInvitation(invitationId);
  };

  const canPerform = (action: keyof typeof ROLE_PERMISSIONS['admin']): boolean => {
    if (!currentRole) return false;
    return ROLE_PERMISSIONS[currentRole]?.[action] ?? false;
  };

  return {
    organization,
    members,
    currentRole,
    loading,
    error,
    refreshMembers,
    inviteMember,
    removeMember,
    updateMemberRole,
    revokeInvitation,
    canPerform,
  };
}
