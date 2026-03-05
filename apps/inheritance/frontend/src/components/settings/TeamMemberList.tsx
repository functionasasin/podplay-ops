import { useState } from 'react';
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

export function TeamMemberList({
  members,
  pendingInvitations,
  currentUserId,
  currentUserRole,
  onRemoveMember,
  onRevokeInvitation,
  memberProfiles = {},
}: TeamMemberListProps) {
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const isAdmin = currentUserRole === 'admin';

  return (
    <div data-testid="team-member-list">
      {/* Members list */}
      {members.map((member) => {
        const profile = memberProfiles[member.user_id];
        const isSelf = member.user_id === currentUserId;

        return (
          <div key={member.id} data-testid="member-row" className="flex items-center justify-between py-2 border-b">
            <div className="flex-1">
              <span className="font-medium">
                {profile?.full_name ?? member.user_id}
              </span>
              {profile?.email && (
                <span className="text-sm text-muted-foreground ml-2">
                  {profile.email}
                </span>
              )}
            </div>

            <span className="text-sm px-2 py-0.5 rounded bg-muted">
              {member.role}
            </span>

            {isAdmin && !isSelf && (
              <div className="relative ml-2">
                <button
                  data-testid="member-actions"
                  onClick={() =>
                    setOpenActionId(openActionId === member.id ? null : member.id)
                  }
                  className="p-1 rounded hover:bg-muted"
                  aria-label="Member actions"
                >
                  ···
                </button>
                {openActionId === member.id && (
                  <div className="absolute right-0 mt-1 bg-white border rounded shadow-lg z-10 min-w-[120px]">
                    <button
                      onClick={() => {
                        onRemoveMember(member.id);
                        setOpenActionId(null);
                      }}
                      className="block w-full text-left px-3 py-1.5 text-sm hover:bg-muted text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            Pending Invitations ({pendingInvitations.length})
          </h3>
          {pendingInvitations.map((inv) => (
            <div key={inv.id} data-testid="invitation-row" className="flex items-center justify-between py-2 border-b">
              <div className="flex-1">
                <span>{inv.email}</span>
                <span className="text-sm text-muted-foreground ml-2">({inv.role})</span>
              </div>
              {isAdmin && (
                <button
                  onClick={() => onRevokeInvitation(inv.id)}
                  className="text-sm text-destructive hover:underline"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
