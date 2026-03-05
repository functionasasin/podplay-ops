import { supabase } from './supabase';
import type {
  Organization,
  OrganizationMember,
  OrganizationInvitation,
  OrgRole,
} from '@/types';
import { ROLE_PERMISSIONS } from '@/types';

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();
  if (error) return null;
  return data as Organization;
}

export async function getUserOrganization(userId: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .single();
  if (error || !data) return null;
  return getOrganization(data.org_id);
}

export async function listMembers(orgId: string): Promise<OrganizationMember[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('*')
    .eq('org_id', orgId)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as OrganizationMember[];
}

export async function inviteMember(
  orgId: string,
  email: string,
  role: OrgRole,
  invitedBy: string,
): Promise<OrganizationInvitation> {
  const { data, error } = await supabase
    .from('organization_invitations')
    .insert({ org_id: orgId, email, role, invited_by: invitedBy })
    .select()
    .single();
  if (error) throw error;
  return data as OrganizationInvitation;
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase
    .from('organization_invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId);
  if (error) throw error;
}

export async function listPendingInvitations(orgId: string): Promise<OrganizationInvitation[]> {
  const { data, error } = await supabase
    .from('organization_invitations')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as OrganizationInvitation[];
}

export async function acceptInvitation(token: string): Promise<{ success: boolean; error?: string; org_id?: string; role?: string }> {
  const { data, error } = await supabase.rpc('accept_invitation', { p_token: token });
  if (error) throw error;
  return data as { success: boolean; error?: string; org_id?: string; role?: string };
}

export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId);
  if (error) throw error;
}

export async function updateMemberRole(memberId: string, newRole: OrgRole): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .update({ role: newRole })
    .eq('id', memberId);
  if (error) throw error;
}

export function canPerformAction(
  role: OrgRole,
  action: keyof typeof ROLE_PERMISSIONS['admin'],
): boolean {
  return ROLE_PERMISSIONS[role]?.[action] ?? false;
}

export function getSeatUsage(members: OrganizationMember[], seatLimit: number): {
  used: number;
  limit: number;
  available: number;
  isFull: boolean;
} {
  const used = members.length;
  return {
    used,
    limit: seatLimit,
    available: Math.max(0, seatLimit - used),
    isFull: used >= seatLimit,
  };
}
