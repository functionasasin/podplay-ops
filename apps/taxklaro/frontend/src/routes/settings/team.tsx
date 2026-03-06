import { createRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { rootRoute } from '../__root';
import { authGuard } from '../../lib/auth-guard';
import { useAuth } from '../../hooks/useAuth';
import { useOrganization } from '../../hooks/useOrganization';
import { InviteMemberForm } from '../../components/settings/InviteMemberForm';
import { MembersTable } from '../../components/settings/MembersTable';
import { PendingInvitationsTable } from '../../components/settings/PendingInvitationsTable';
import { supabase } from '../../lib/supabase';

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export const SettingsTeamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings/team',
  beforeLoad: authGuard,
  component: SettingsTeamPage,
});

function SettingsTeamPage() {
  const { user } = useAuth();
  const { orgId, canInvite, isLoading } = useOrganization();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const loadMembers = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase
      .from('organization_members')
      .select('user_id, role, profiles(full_name, email)')
      .eq('org_id', orgId);

    if (data) {
      setMembers(
        data.map((m: any) => ({
          id: m.user_id,
          name: m.profiles?.full_name ?? '',
          email: m.profiles?.email ?? '',
          role: m.role,
        }))
      );
    }
  }, [orgId]);

  const loadInvitations = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase
      .from('invitations')
      .select('id, email, role, created_at')
      .eq('org_id', orgId)
      .eq('status', 'pending');

    if (data) {
      setInvitations(
        data.map((inv: any) => ({
          id: inv.id,
          email: inv.email,
          role: inv.role,
          createdAt: inv.created_at,
        }))
      );
    }
  }, [orgId]);

  useEffect(() => {
    loadMembers();
    loadInvitations();
  }, [loadMembers, loadInvitations]);

  if (isLoading) {
    return (
      <div data-testid="settings-team-page" className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Loading team…</p>
      </div>
    );
  }

  async function handleInvite(email: string, role: string) {
    if (!orgId) return;
    await supabase.from('invitations').insert({ org_id: orgId, email, role });
    await loadInvitations();
  }

  async function handleRemoveMember(memberId: string) {
    if (!orgId) return;
    await supabase
      .from('organization_members')
      .delete()
      .eq('org_id', orgId)
      .eq('user_id', memberId);
    await loadMembers();
  }

  async function handleRevokeInvitation(invitationId: string) {
    await supabase.from('invitations').delete().eq('id', invitationId);
    await loadInvitations();
  }

  return (
    <div data-testid="settings-team-page" className="space-y-8 max-w-3xl">
      <h1 className="text-2xl font-semibold">Team Management</h1>

      {canInvite && <InviteMemberForm onInvite={handleInvite} />}

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Members</h2>
        <MembersTable
          members={members}
          currentUserId={user?.id}
          onRemove={canInvite ? handleRemoveMember : undefined}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Pending Invitations</h2>
        <PendingInvitationsTable
          invitations={invitations}
          onRevoke={canInvite ? handleRevokeInvitation : undefined}
        />
      </section>
    </div>
  );
}
