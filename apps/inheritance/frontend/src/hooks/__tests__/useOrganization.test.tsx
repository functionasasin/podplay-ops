import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// ─── Mock organization lib ──────────────────────────────────────
const mockGetUserOrganization = vi.fn();
const mockListMembers = vi.fn();
const mockInviteMember = vi.fn();
const mockRemoveMember = vi.fn();
const mockUpdateMemberRole = vi.fn();
const mockRevokeInvitation = vi.fn();

vi.mock('@/lib/organizations', () => ({
  getUserOrganization: (...args: unknown[]) => mockGetUserOrganization(...args),
  listMembers: (...args: unknown[]) => mockListMembers(...args),
  inviteMember: (...args: unknown[]) => mockInviteMember(...args),
  removeMember: (...args: unknown[]) => mockRemoveMember(...args),
  updateMemberRole: (...args: unknown[]) => mockUpdateMemberRole(...args),
  revokeInvitation: (...args: unknown[]) => mockRevokeInvitation(...args),
}));

import { useOrganization } from '../useOrganization';

// ─── Fixtures ───────────────────────────────────────────────────
const mockOrg = {
  id: 'org-1',
  name: 'Santos Law Firm',
  slug: 'santos-law',
  plan: 'team' as const,
  seat_limit: 5,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockMembers = [
  { id: 'mem-1', org_id: 'org-1', user_id: 'user-1', role: 'admin' as const, joined_at: '2026-01-01T00:00:00Z' },
  { id: 'mem-2', org_id: 'org-1', user_id: 'user-2', role: 'attorney' as const, joined_at: '2026-01-02T00:00:00Z' },
  { id: 'mem-3', org_id: 'org-1', user_id: 'user-3', role: 'paralegal' as const, joined_at: '2026-01-03T00:00:00Z' },
];

describe('useOrganization hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserOrganization.mockResolvedValue(mockOrg);
    mockListMembers.mockResolvedValue(mockMembers);
  });

  it('starts with loading=true', () => {
    const { result } = renderHook(() => useOrganization('user-1'));
    expect(result.current.loading).toBe(true);
  });

  it('returns organization and members after loading', async () => {
    const { result } = renderHook(() => useOrganization('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.organization).toEqual(mockOrg);
    expect(result.current.members).toHaveLength(3);
    expect(result.current.members[0].role).toBe('admin');
    expect(result.current.members[1].role).toBe('attorney');
  });

  it('returns current user role', async () => {
    const { result } = renderHook(() => useOrganization('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.currentRole).toBe('admin');
  });

  it('returns attorney role for user-2', async () => {
    const { result } = renderHook(() => useOrganization('user-2'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.currentRole).toBe('attorney');
  });

  it('returns null when userId is null', async () => {
    const { result } = renderHook(() => useOrganization(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.organization).toBeNull();
    expect(result.current.members).toEqual([]);
    expect(result.current.currentRole).toBeNull();
  });

  it('returns null when user has no organization', async () => {
    mockGetUserOrganization.mockResolvedValue(null);

    const { result } = renderHook(() => useOrganization('user-no-org'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.organization).toBeNull();
    expect(result.current.members).toEqual([]);
  });

  it('sets error when organization fetch fails', async () => {
    mockGetUserOrganization.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useOrganization('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
  });

  // ────────────────────────────────────────────────────────────────
  // canPerform
  // ────────────────────────────────────────────────────────────────
  describe('canPerform', () => {
    it('admin can invite members', async () => {
      const { result } = renderHook(() => useOrganization('user-1'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.canPerform('canInviteMembers')).toBe(true);
    });

    it('admin can delete cases', async () => {
      const { result } = renderHook(() => useOrganization('user-1'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.canPerform('canDeleteCase')).toBe(true);
    });

    it('attorney cannot invite members', async () => {
      const { result } = renderHook(() => useOrganization('user-2'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.canPerform('canInviteMembers')).toBe(false);
    });

    it('paralegal cannot finalize cases', async () => {
      const { result } = renderHook(() => useOrganization('user-3'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.canPerform('canFinalizeCase')).toBe(false);
    });

    it('returns false when no role is set', async () => {
      mockGetUserOrganization.mockResolvedValue(null);

      const { result } = renderHook(() => useOrganization('user-no-org'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.canPerform('canEditCase')).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // inviteMember
  // ────────────────────────────────────────────────────────────────
  describe('inviteMember', () => {
    it('calls orgLib.inviteMember and refreshes members', async () => {
      mockInviteMember.mockResolvedValue({
        id: 'inv-1',
        email: 'new@firm.ph',
        role: 'attorney',
        status: 'pending',
      });

      const { result } = renderHook(() => useOrganization('user-1'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.inviteMember('new@firm.ph', 'attorney');
      });

      expect(mockInviteMember).toHaveBeenCalledWith('org-1', 'new@firm.ph', 'attorney', 'user-1');
      // refreshMembers was called
      expect(mockListMembers).toHaveBeenCalledTimes(2); // initial + refresh
    });

    it('throws when no organization', async () => {
      mockGetUserOrganization.mockResolvedValue(null);

      const { result } = renderHook(() => useOrganization('user-no-org'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      await expect(
        act(async () => {
          await result.current.inviteMember('new@firm.ph', 'attorney');
        }),
      ).rejects.toThrow('No organization');
    });
  });

  // ────────────────────────────────────────────────────────────────
  // removeMember
  // ────────────────────────────────────────────────────────────────
  describe('removeMember', () => {
    it('calls orgLib.removeMember and refreshes members', async () => {
      mockRemoveMember.mockResolvedValue(undefined);

      const { result } = renderHook(() => useOrganization('user-1'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.removeMember('mem-2');
      });

      expect(mockRemoveMember).toHaveBeenCalledWith('mem-2');
      expect(mockListMembers).toHaveBeenCalledTimes(2);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // updateMemberRole
  // ────────────────────────────────────────────────────────────────
  describe('updateMemberRole', () => {
    it('calls orgLib.updateMemberRole and refreshes members', async () => {
      mockUpdateMemberRole.mockResolvedValue(undefined);

      const { result } = renderHook(() => useOrganization('user-1'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.updateMemberRole('mem-2', 'paralegal');
      });

      expect(mockUpdateMemberRole).toHaveBeenCalledWith('mem-2', 'paralegal');
      expect(mockListMembers).toHaveBeenCalledTimes(2);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // revokeInvitation
  // ────────────────────────────────────────────────────────────────
  describe('revokeInvitation', () => {
    it('calls orgLib.revokeInvitation', async () => {
      mockRevokeInvitation.mockResolvedValue(undefined);

      const { result } = renderHook(() => useOrganization('user-1'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.revokeInvitation('inv-1');
      });

      expect(mockRevokeInvitation).toHaveBeenCalledWith('inv-1');
    });
  });

  // ────────────────────────────────────────────────────────────────
  // exposed functions
  // ────────────────────────────────────────────────────────────────
  it('exposes all management functions', async () => {
    const { result } = renderHook(() => useOrganization('user-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(typeof result.current.inviteMember).toBe('function');
    expect(typeof result.current.removeMember).toBe('function');
    expect(typeof result.current.updateMemberRole).toBe('function');
    expect(typeof result.current.revokeInvitation).toBe('function');
    expect(typeof result.current.refreshMembers).toBe('function');
    expect(typeof result.current.canPerform).toBe('function');
  });
});
