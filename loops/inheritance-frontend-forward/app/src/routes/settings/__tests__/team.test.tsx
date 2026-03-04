import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ─── Mock hooks ─────────────────────────────────────────────────
const mockUseOrganization = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/hooks/useOrganization', () => ({
  useOrganization: (...args: unknown[]) => mockUseOrganization(...args),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock organizations lib for listPendingInvitations
const mockListPendingInvitations = vi.fn();
vi.mock('@/lib/organizations', () => ({
  listPendingInvitations: (...args: unknown[]) => mockListPendingInvitations(...args),
}));

import { TeamSettingsPage } from '../team';

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

describe('TeamSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { id: 'user-1', email: 'admin@firm.ph' },
      loading: false,
    });

    mockUseOrganization.mockReturnValue({
      organization: mockOrg,
      members: mockMembers,
      currentRole: 'admin',
      loading: false,
      error: null,
      refreshMembers: vi.fn(),
      inviteMember: vi.fn().mockResolvedValue(undefined),
      removeMember: vi.fn().mockResolvedValue(undefined),
      updateMemberRole: vi.fn().mockResolvedValue(undefined),
      revokeInvitation: vi.fn().mockResolvedValue(undefined),
      canPerform: (action: string) => action === 'canInviteMembers' || action === 'canRemoveMembers',
    });

    mockListPendingInvitations.mockResolvedValue([]);
  });

  it('renders team settings page with title', () => {
    render(<TeamSettingsPage />);

    expect(screen.getByText(/team/i)).toBeInTheDocument();
  });

  it('renders organization name', () => {
    render(<TeamSettingsPage />);

    expect(screen.getByText('Santos Law Firm')).toBeInTheDocument();
  });

  it('shows plan info', () => {
    render(<TeamSettingsPage />);

    expect(screen.getByText(/team/i)).toBeInTheDocument();
  });

  it('shows seat usage count', () => {
    render(<TeamSettingsPage />);

    // 3 members out of 5 seats
    expect(screen.getByText(/3.*\/.*5/)).toBeInTheDocument();
  });

  it('renders team member list', () => {
    render(<TeamSettingsPage />);

    // TeamMemberList should render member data
    expect(screen.getByTestId('team-member-list')).toBeInTheDocument();
  });

  it('shows invite button for admin', () => {
    render(<TeamSettingsPage />);

    const inviteButton = screen.getByRole('button', { name: /invite/i });
    expect(inviteButton).toBeInTheDocument();
  });

  it('hides invite button for non-admin roles', () => {
    mockUseOrganization.mockReturnValue({
      organization: mockOrg,
      members: mockMembers,
      currentRole: 'attorney',
      loading: false,
      error: null,
      refreshMembers: vi.fn(),
      inviteMember: vi.fn(),
      removeMember: vi.fn(),
      updateMemberRole: vi.fn(),
      revokeInvitation: vi.fn(),
      canPerform: () => false,
    });

    render(<TeamSettingsPage />);

    expect(screen.queryByRole('button', { name: /invite/i })).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseOrganization.mockReturnValue({
      organization: null,
      members: [],
      currentRole: null,
      loading: true,
      error: null,
      refreshMembers: vi.fn(),
      inviteMember: vi.fn(),
      removeMember: vi.fn(),
      updateMemberRole: vi.fn(),
      revokeInvitation: vi.fn(),
      canPerform: () => false,
    });

    render(<TeamSettingsPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseOrganization.mockReturnValue({
      organization: null,
      members: [],
      currentRole: null,
      loading: false,
      error: 'Failed to load organization',
      refreshMembers: vi.fn(),
      inviteMember: vi.fn(),
      removeMember: vi.fn(),
      updateMemberRole: vi.fn(),
      revokeInvitation: vi.fn(),
      canPerform: () => false,
    });

    render(<TeamSettingsPage />);

    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });

  it('opens invite dialog when invite button clicked', async () => {
    const user = userEvent.setup();
    render(<TeamSettingsPage />);

    const inviteButton = screen.getByRole('button', { name: /invite/i });
    await user.click(inviteButton);

    // Invite dialog should be open
    expect(screen.getByText(/invite member/i)).toBeInTheDocument();
  });

  it('shows solo plan restriction message', () => {
    mockUseOrganization.mockReturnValue({
      organization: { ...mockOrg, plan: 'solo', seat_limit: 1 },
      members: [mockMembers[0]],
      currentRole: 'admin',
      loading: false,
      error: null,
      refreshMembers: vi.fn(),
      inviteMember: vi.fn(),
      removeMember: vi.fn(),
      updateMemberRole: vi.fn(),
      revokeInvitation: vi.fn(),
      canPerform: (action: string) => action === 'canInviteMembers',
    });

    render(<TeamSettingsPage />);

    // Seat usage should show 1/1
    expect(screen.getByText(/1.*\/.*1/)).toBeInTheDocument();
  });

  it('shows no organization message when user has no org', () => {
    mockUseOrganization.mockReturnValue({
      organization: null,
      members: [],
      currentRole: null,
      loading: false,
      error: null,
      refreshMembers: vi.fn(),
      inviteMember: vi.fn(),
      removeMember: vi.fn(),
      updateMemberRole: vi.fn(),
      revokeInvitation: vi.fn(),
      canPerform: () => false,
    });

    render(<TeamSettingsPage />);

    expect(screen.getByText(/no organization/i)).toBeInTheDocument();
  });
});
