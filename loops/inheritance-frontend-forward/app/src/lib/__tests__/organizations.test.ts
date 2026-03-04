import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Supabase mock ──────────────────────────────────────────────
const { mockFrom, mockRpc } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
  },
}));

import {
  getOrganization,
  getUserOrganization,
  listMembers,
  inviteMember,
  revokeInvitation,
  listPendingInvitations,
  acceptInvitation,
  removeMember,
  updateMemberRole,
  canPerformAction,
  getSeatUsage,
} from '../organizations';
import type { OrganizationMember } from '@/types';
import { ROLE_PERMISSIONS } from '@/types';

// ─── Fixtures ───────────────────────────────────────────────────
const mockOrg = {
  id: 'org-1',
  name: 'Santos Law Firm',
  slug: 'santos-law',
  plan: 'team',
  seat_limit: 5,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockMember = {
  id: 'mem-1',
  org_id: 'org-1',
  user_id: 'user-1',
  role: 'admin',
  joined_at: '2026-01-01T00:00:00Z',
};

const mockInvitation = {
  id: 'inv-1',
  org_id: 'org-1',
  email: 'jose@firm.ph',
  role: 'attorney',
  token: 'abc-123-token',
  status: 'pending',
  invited_by: 'user-1',
  expires_at: '2026-01-08T00:00:00Z',
  accepted_at: null,
  created_at: '2026-01-01T00:00:00Z',
};

// ─── Helper: mock a Supabase query chain ────────────────────────
function mockQueryChain(result: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result);
  const order = vi.fn().mockReturnValue({ data: result.data, error: result.error });
  const limit = vi.fn().mockReturnValue({ single });
  const eq2 = vi.fn().mockReturnValue({ order, single, limit, data: result.data, error: result.error });
  const eq = vi.fn().mockReturnValue({ eq: eq2, single, order, limit, data: result.data, error: result.error });
  const select = vi.fn().mockReturnValue({ eq, single, order, data: result.data, error: result.error });
  const insert = vi.fn().mockReturnValue({ select });
  const update = vi.fn().mockReturnValue({ eq });
  const deleteFn = vi.fn().mockReturnValue({ eq });

  mockFrom.mockReturnValue({
    select,
    insert,
    update,
    delete: deleteFn,
  });

  return { select, eq, eq2, single, order, insert, update, delete: deleteFn, limit };
}

// ─── Tests ──────────────────────────────────────────────────────
describe('organizations lib', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────────
  // getOrganization
  // ────────────────────────────────────────────────────────────────
  describe('getOrganization', () => {
    it('returns organization for valid orgId', async () => {
      mockQueryChain({ data: mockOrg, error: null });

      const result = await getOrganization('org-1');
      expect(mockFrom).toHaveBeenCalledWith('organizations');
      expect(result).toEqual(mockOrg);
    });

    it('returns null when organization not found', async () => {
      mockQueryChain({ data: null, error: new Error('Not found') });

      const result = await getOrganization('nonexistent');
      expect(result).toBeNull();
    });
  });

  // ────────────────────────────────────────────────────────────────
  // getUserOrganization
  // ────────────────────────────────────────────────────────────────
  describe('getUserOrganization', () => {
    it('returns org for user who has membership', async () => {
      // First call: organization_members → returns org_id
      // Second call: organizations → returns org
      let callCount = 0;
      mockFrom.mockImplementation((table: string) => {
        if (table === 'organization_members') {
          callCount++;
          const single = vi.fn().mockResolvedValue({ data: { org_id: 'org-1' }, error: null });
          const limit = vi.fn().mockReturnValue({ single });
          const eq = vi.fn().mockReturnValue({ limit });
          const select = vi.fn().mockReturnValue({ eq });
          return { select };
        }
        if (table === 'organizations') {
          const single = vi.fn().mockResolvedValue({ data: mockOrg, error: null });
          const eq = vi.fn().mockReturnValue({ single });
          const select = vi.fn().mockReturnValue({ eq });
          return { select };
        }
        return {};
      });

      const result = await getUserOrganization('user-1');
      expect(result).toEqual(mockOrg);
    });

    it('returns null when user has no membership', async () => {
      mockFrom.mockImplementation(() => {
        const single = vi.fn().mockResolvedValue({ data: null, error: new Error('No rows') });
        const limit = vi.fn().mockReturnValue({ single });
        const eq = vi.fn().mockReturnValue({ limit });
        const select = vi.fn().mockReturnValue({ eq });
        return { select };
      });

      const result = await getUserOrganization('orphan-user');
      expect(result).toBeNull();
    });
  });

  // ────────────────────────────────────────────────────────────────
  // listMembers
  // ────────────────────────────────────────────────────────────────
  describe('listMembers', () => {
    it('returns members for org', async () => {
      const members = [mockMember, { ...mockMember, id: 'mem-2', user_id: 'user-2', role: 'attorney' }];
      const order = vi.fn().mockResolvedValue({ data: members, error: null });
      const eq = vi.fn().mockReturnValue({ order });
      const select = vi.fn().mockReturnValue({ eq });
      mockFrom.mockReturnValue({ select });

      const result = await listMembers('org-1');
      expect(mockFrom).toHaveBeenCalledWith('organization_members');
      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('admin');
      expect(result[1].role).toBe('attorney');
    });

    it('throws on error', async () => {
      const order = vi.fn().mockResolvedValue({ data: null, error: new Error('RLS error') });
      const eq = vi.fn().mockReturnValue({ order });
      const select = vi.fn().mockReturnValue({ eq });
      mockFrom.mockReturnValue({ select });

      await expect(listMembers('org-1')).rejects.toThrow('RLS error');
    });
  });

  // ────────────────────────────────────────────────────────────────
  // inviteMember
  // ────────────────────────────────────────────────────────────────
  describe('inviteMember', () => {
    it('creates pending invitation row', async () => {
      const single = vi.fn().mockResolvedValue({ data: mockInvitation, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const insert = vi.fn().mockReturnValue({ select });
      mockFrom.mockReturnValue({ insert });

      const result = await inviteMember('org-1', 'jose@firm.ph', 'attorney', 'user-1');
      expect(mockFrom).toHaveBeenCalledWith('organization_invitations');
      expect(insert).toHaveBeenCalledWith({
        org_id: 'org-1',
        email: 'jose@firm.ph',
        role: 'attorney',
        invited_by: 'user-1',
      });
      expect(result.status).toBe('pending');
      expect(result.email).toBe('jose@firm.ph');
    });

    it('throws when RLS blocks non-admin invite', async () => {
      const single = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('new row violates row-level security policy'),
      });
      const select = vi.fn().mockReturnValue({ single });
      const insert = vi.fn().mockReturnValue({ select });
      mockFrom.mockReturnValue({ insert });

      await expect(
        inviteMember('org-1', 'new@firm.ph', 'attorney', 'non-admin-user'),
      ).rejects.toThrow('row-level security');
    });
  });

  // ────────────────────────────────────────────────────────────────
  // revokeInvitation
  // ────────────────────────────────────────────────────────────────
  describe('revokeInvitation', () => {
    it('updates invitation status to revoked', async () => {
      const eq = vi.fn().mockResolvedValue({ error: null });
      const update = vi.fn().mockReturnValue({ eq });
      mockFrom.mockReturnValue({ update });

      await revokeInvitation('inv-1');
      expect(mockFrom).toHaveBeenCalledWith('organization_invitations');
      expect(update).toHaveBeenCalledWith({ status: 'revoked' });
    });

    it('throws on error', async () => {
      const eq = vi.fn().mockResolvedValue({ error: new Error('RLS error') });
      const update = vi.fn().mockReturnValue({ eq });
      mockFrom.mockReturnValue({ update });

      await expect(revokeInvitation('inv-1')).rejects.toThrow('RLS error');
    });
  });

  // ────────────────────────────────────────────────────────────────
  // listPendingInvitations
  // ────────────────────────────────────────────────────────────────
  describe('listPendingInvitations', () => {
    it('returns pending invitations for org', async () => {
      const invitations = [mockInvitation];
      const order = vi.fn().mockResolvedValue({ data: invitations, error: null });
      const eq2 = vi.fn().mockReturnValue({ order });
      const eq = vi.fn().mockReturnValue({ eq: eq2 });
      const select = vi.fn().mockReturnValue({ eq });
      mockFrom.mockReturnValue({ select });

      const result = await listPendingInvitations('org-1');
      expect(mockFrom).toHaveBeenCalledWith('organization_invitations');
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
    });

    it('returns empty array when no pending invitations', async () => {
      const order = vi.fn().mockResolvedValue({ data: [], error: null });
      const eq2 = vi.fn().mockReturnValue({ order });
      const eq = vi.fn().mockReturnValue({ eq: eq2 });
      const select = vi.fn().mockReturnValue({ eq });
      mockFrom.mockReturnValue({ select });

      const result = await listPendingInvitations('org-1');
      expect(result).toEqual([]);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // acceptInvitation
  // ────────────────────────────────────────────────────────────────
  describe('acceptInvitation', () => {
    it('calls RPC accept_invitation with token', async () => {
      mockRpc.mockResolvedValue({
        data: { success: true, org_id: 'org-1', role: 'attorney' },
        error: null,
      });

      const result = await acceptInvitation('abc-123-token');
      expect(mockRpc).toHaveBeenCalledWith('accept_invitation', { p_token: 'abc-123-token' });
      expect(result.success).toBe(true);
      expect(result.org_id).toBe('org-1');
      expect(result.role).toBe('attorney');
    });

    it('returns error for expired invitation', async () => {
      mockRpc.mockResolvedValue({
        data: { success: false, error: 'Invitation expired, revoked, or not found' },
        error: null,
      });

      const result = await acceptInvitation('expired-token');
      expect(result.success).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('returns error when seat limit reached', async () => {
      mockRpc.mockResolvedValue({
        data: { success: false, error: 'Organization has reached its seat limit' },
        error: null,
      });

      const result = await acceptInvitation('some-token');
      expect(result.success).toBe(false);
      expect(result.error).toContain('seat limit');
    });

    it('handles already-member case gracefully', async () => {
      mockRpc.mockResolvedValue({
        data: { success: true, message: 'Already a member of this organization' },
        error: null,
      });

      const result = await acceptInvitation('already-member-token');
      expect(result.success).toBe(true);
    });

    it('throws on RPC error', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: new Error('Network error'),
      });

      await expect(acceptInvitation('bad-token')).rejects.toThrow('Network error');
    });
  });

  // ────────────────────────────────────────────────────────────────
  // removeMember
  // ────────────────────────────────────────────────────────────────
  describe('removeMember', () => {
    it('deletes member row', async () => {
      const eq = vi.fn().mockResolvedValue({ error: null });
      const deleteFn = vi.fn().mockReturnValue({ eq });
      mockFrom.mockReturnValue({ delete: deleteFn });

      await removeMember('mem-2');
      expect(mockFrom).toHaveBeenCalledWith('organization_members');
      expect(eq).toHaveBeenCalledWith('id', 'mem-2');
    });

    it('throws on error', async () => {
      const eq = vi.fn().mockResolvedValue({ error: new Error('Cannot delete admin') });
      const deleteFn = vi.fn().mockReturnValue({ eq });
      mockFrom.mockReturnValue({ delete: deleteFn });

      await expect(removeMember('mem-1')).rejects.toThrow('Cannot delete admin');
    });
  });

  // ────────────────────────────────────────────────────────────────
  // updateMemberRole
  // ────────────────────────────────────────────────────────────────
  describe('updateMemberRole', () => {
    it('updates role for member', async () => {
      const eq = vi.fn().mockResolvedValue({ error: null });
      const update = vi.fn().mockReturnValue({ eq });
      mockFrom.mockReturnValue({ update });

      await updateMemberRole('mem-2', 'paralegal');
      expect(mockFrom).toHaveBeenCalledWith('organization_members');
      expect(update).toHaveBeenCalledWith({ role: 'paralegal' });
      expect(eq).toHaveBeenCalledWith('id', 'mem-2');
    });

    it('throws on error', async () => {
      const eq = vi.fn().mockResolvedValue({ error: new Error('RLS denied') });
      const update = vi.fn().mockReturnValue({ eq });
      mockFrom.mockReturnValue({ update });

      await expect(updateMemberRole('mem-2', 'admin')).rejects.toThrow('RLS denied');
    });
  });

  // ────────────────────────────────────────────────────────────────
  // canPerformAction — role permission matrix
  // ────────────────────────────────────────────────────────────────
  describe('canPerformAction', () => {
    it('admin can finalize cases', () => {
      expect(canPerformAction('admin', 'canFinalizeCase')).toBe(true);
    });

    it('admin can delete cases', () => {
      expect(canPerformAction('admin', 'canDeleteCase')).toBe(true);
    });

    it('admin can invite members', () => {
      expect(canPerformAction('admin', 'canInviteMembers')).toBe(true);
    });

    it('admin can remove members', () => {
      expect(canPerformAction('admin', 'canRemoveMembers')).toBe(true);
    });

    it('attorney can finalize cases', () => {
      expect(canPerformAction('attorney', 'canFinalizeCase')).toBe(true);
    });

    it('attorney cannot delete cases', () => {
      expect(canPerformAction('attorney', 'canDeleteCase')).toBe(false);
    });

    it('attorney cannot invite members', () => {
      expect(canPerformAction('attorney', 'canInviteMembers')).toBe(false);
    });

    it('paralegal cannot finalize cases', () => {
      expect(canPerformAction('paralegal', 'canFinalizeCase')).toBe(false);
    });

    it('paralegal can edit cases', () => {
      expect(canPerformAction('paralegal', 'canEditCase')).toBe(true);
    });

    it('paralegal can manage clients', () => {
      expect(canPerformAction('paralegal', 'canManageClients')).toBe(true);
    });

    it('readonly cannot edit cases', () => {
      expect(canPerformAction('readonly', 'canEditCase')).toBe(false);
    });

    it('readonly cannot create cases', () => {
      expect(canPerformAction('readonly', 'canCreateCase')).toBe(false);
    });

    it('readonly cannot manage clients', () => {
      expect(canPerformAction('readonly', 'canManageClients')).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // getSeatUsage
  // ────────────────────────────────────────────────────────────────
  describe('getSeatUsage', () => {
    it('solo plan allows 1 seat only', () => {
      const members = [mockMember] as OrganizationMember[];
      const usage = getSeatUsage(members, 1);
      expect(usage.used).toBe(1);
      expect(usage.limit).toBe(1);
      expect(usage.available).toBe(0);
      expect(usage.isFull).toBe(true);
    });

    it('team plan allows up to 5 seats', () => {
      const members = [
        { ...mockMember, id: 'mem-1' },
        { ...mockMember, id: 'mem-2', user_id: 'user-2' },
      ] as OrganizationMember[];
      const usage = getSeatUsage(members, 5);
      expect(usage.used).toBe(2);
      expect(usage.limit).toBe(5);
      expect(usage.available).toBe(3);
      expect(usage.isFull).toBe(false);
    });

    it('team plan reports full at 5 seats', () => {
      const members = Array.from({ length: 5 }, (_, i) => ({
        ...mockMember,
        id: `mem-${i}`,
        user_id: `user-${i}`,
      })) as OrganizationMember[];
      const usage = getSeatUsage(members, 5);
      expect(usage.isFull).toBe(true);
      expect(usage.available).toBe(0);
    });

    it('firm plan with unlimited seats', () => {
      const members = Array.from({ length: 50 }, (_, i) => ({
        ...mockMember,
        id: `mem-${i}`,
        user_id: `user-${i}`,
      })) as OrganizationMember[];
      const usage = getSeatUsage(members, Infinity);
      expect(usage.used).toBe(50);
      expect(usage.isFull).toBe(false);
      expect(usage.available).toBe(Infinity);
    });

    it('empty org has 0 used', () => {
      const usage = getSeatUsage([], 5);
      expect(usage.used).toBe(0);
      expect(usage.available).toBe(5);
      expect(usage.isFull).toBe(false);
    });
  });
});

// ────────────────────────────────────────────────────────────────
// ROLE_PERMISSIONS type-level tests
// ────────────────────────────────────────────────────────────────
describe('ROLE_PERMISSIONS constant', () => {
  it('defines all 4 roles', () => {
    expect(Object.keys(ROLE_PERMISSIONS)).toEqual(['admin', 'attorney', 'paralegal', 'readonly']);
  });

  it('admin has all permissions set to true', () => {
    const perms = ROLE_PERMISSIONS.admin;
    expect(perms.canCreateCase).toBe(true);
    expect(perms.canEditCase).toBe(true);
    expect(perms.canFinalizeCase).toBe(true);
    expect(perms.canDeleteCase).toBe(true);
    expect(perms.canManageClients).toBe(true);
    expect(perms.canInviteMembers).toBe(true);
    expect(perms.canRemoveMembers).toBe(true);
    expect(perms.canManageBilling).toBe(true);
  });

  it('readonly has all permissions set to false', () => {
    const perms = ROLE_PERMISSIONS.readonly;
    Object.values(perms).forEach((v) => expect(v).toBe(false));
  });

  it('attorney can finalize but not delete', () => {
    expect(ROLE_PERMISSIONS.attorney.canFinalizeCase).toBe(true);
    expect(ROLE_PERMISSIONS.attorney.canDeleteCase).toBe(false);
  });

  it('paralegal can edit but not finalize or delete', () => {
    expect(ROLE_PERMISSIONS.paralegal.canEditCase).toBe(true);
    expect(ROLE_PERMISSIONS.paralegal.canFinalizeCase).toBe(false);
    expect(ROLE_PERMISSIONS.paralegal.canDeleteCase).toBe(false);
  });
});
