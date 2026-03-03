import type { OrganizationMember, OrganizationInvitation, OrgRole } from '@/types';

export interface TeamMemberListProps {
  members: OrganizationMember[];
  pendingInvitations: OrganizationInvitation[];
  currentUserId: string;
  currentUserRole: OrgRole;
  onRemoveMember: (memberId: string) => void;
  onUpdateRole: (memberId: string, newRole: OrgRole) => void;
  onRevokeInvitation: (invitationId: string) => void;
  memberProfiles?: Record<string, { full_name: string | null; email: string }>;
}

export function TeamMemberList(_props: TeamMemberListProps) {
  return null; // stub — implementation in next iteration
}
