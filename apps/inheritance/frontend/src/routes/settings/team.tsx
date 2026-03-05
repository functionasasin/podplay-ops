import { createRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { rootRoute } from '@/routes/__root';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { TeamMemberList } from '@/components/settings/TeamMemberList';
import { InviteMemberDialog } from '@/components/settings/InviteMemberDialog';
import { listPendingInvitations } from '@/lib/organizations';
import { supabase } from '@/lib/supabase';
import type { OrganizationInvitation } from '@/types';

export const settingsTeamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/team',
  component: TeamSettingsPage,
});

function TeamSettingsPage() {
  const { user } = useAuth();
  const {
    organization,
    members,
    currentRole,
    loading,
    error,
    inviteMember,
    removeMember,
    updateMemberRole,
    revokeInvitation,
    canPerform,
  } = useOrganization(user?.id ?? null);

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<OrganizationInvitation[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, { full_name: string | null; email: string }>>({});

  useEffect(() => {
    if (organization) {
      listPendingInvitations(organization.id).then(setPendingInvitations).catch(() => {});
    }
  }, [organization]);

  useEffect(() => {
    if (members.length === 0) return;
    const userIds = members.map((m) => m.user_id);
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)
      .then(({ data }: { data: Array<{ id: string; full_name: string | null; email: string }> | null }) => {
        if (!data) return;
        const map: Record<string, { full_name: string | null; email: string }> = {};
        for (const p of data) {
          map[p.id] = { full_name: p.full_name, email: p.email };
        }
        setMemberProfiles(map);
      })
      .catch(() => {});
  }, [members]);

  if (loading) {
    return <div className="p-6"><p>Loading...</p></div>;
  }

  if (error) {
    return <div className="p-6"><p className="text-destructive">{error}</p></div>;
  }

  if (!organization) {
    return (
      <div className="p-6">
        <p>No organization found. Create or join an organization to manage team members.</p>
      </div>
    );
  }

  const seatUsage = {
    used: members.length,
    limit: organization.seat_limit,
    available: Math.max(0, organization.seat_limit - members.length),
    isFull: members.length >= organization.seat_limit,
  };

  const handleInvite = async (email: string, role: Parameters<typeof inviteMember>[1]) => {
    await inviteMember(email, role);
    if (organization) {
      const updated = await listPendingInvitations(organization.id);
      setPendingInvitations(updated);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    await revokeInvitation(invitationId);
    if (organization) {
      const updated = await listPendingInvitations(organization.id);
      setPendingInvitations(updated);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-muted-foreground">{organization.name}</p>
          <p className="text-sm text-muted-foreground capitalize" data-plan={organization.plan}>
            {organization.seat_limit}-seat plan
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm">
            Seats: {members.length} / {organization.seat_limit}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Members</h2>
        {canPerform('canInviteMembers') && (
          <button
            onClick={() => setInviteDialogOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            Invite
          </button>
        )}
      </div>

      <TeamMemberList
        members={members}
        pendingInvitations={pendingInvitations}
        currentUserId={user?.id ?? ''}
        currentUserRole={currentRole ?? 'readonly'}
        onRemoveMember={removeMember}
        onUpdateRole={updateMemberRole}
        onRevokeInvitation={handleRevokeInvitation}
        memberProfiles={memberProfiles}
      />

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInvite={handleInvite}
        seatUsage={seatUsage}
      />
    </div>
  );
}
