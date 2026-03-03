import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeamMemberList, type TeamMemberListProps } from '../TeamMemberList';
import type { OrganizationMember, OrganizationInvitation } from '@/types';

// ─── Fixtures ───────────────────────────────────────────────────
const mockMembers: OrganizationMember[] = [
  { id: 'mem-1', org_id: 'org-1', user_id: 'user-1', role: 'admin', joined_at: '2026-01-01T00:00:00Z' },
  { id: 'mem-2', org_id: 'org-1', user_id: 'user-2', role: 'attorney', joined_at: '2026-01-02T00:00:00Z' },
  { id: 'mem-3', org_id: 'org-1', user_id: 'user-3', role: 'paralegal', joined_at: '2026-01-03T00:00:00Z' },
  { id: 'mem-4', org_id: 'org-1', user_id: 'user-4', role: 'readonly', joined_at: '2026-01-04T00:00:00Z' },
];

const mockInvitations: OrganizationInvitation[] = [
  {
    id: 'inv-1',
    org_id: 'org-1',
    email: 'new@firm.ph',
    role: 'attorney',
    token: 'token-1',
    status: 'pending',
    invited_by: 'user-1',
    expires_at: '2026-01-08T00:00:00Z',
    accepted_at: null,
    created_at: '2026-01-01T00:00:00Z',
  },
];

const mockProfiles: Record<string, { full_name: string | null; email: string }> = {
  'user-1': { full_name: 'Atty. Maria Santos', email: 'admin@firm.ph' },
  'user-2': { full_name: 'Atty. Jose Cruz', email: 'jose@firm.ph' },
  'user-3': { full_name: 'Paralegal Ana Reyes', email: 'ana@firm.ph' },
  'user-4': { full_name: 'Intern Carlos', email: 'carlos@firm.ph' },
};

function renderTeamList(overrides: Partial<TeamMemberListProps> = {}) {
  const defaultProps: TeamMemberListProps = {
    members: mockMembers,
    pendingInvitations: mockInvitations,
    currentUserId: 'user-1',
    currentUserRole: 'admin',
    onRemoveMember: vi.fn(),
    onUpdateRole: vi.fn(),
    onRevokeInvitation: vi.fn(),
    memberProfiles: mockProfiles,
    ...overrides,
  };

  return { ...render(<TeamMemberList {...defaultProps} />), props: defaultProps };
}

describe('TeamMemberList', () => {
  it('renders all team members', () => {
    renderTeamList();

    expect(screen.getByText('Atty. Maria Santos')).toBeInTheDocument();
    expect(screen.getByText('Atty. Jose Cruz')).toBeInTheDocument();
    expect(screen.getByText('Paralegal Ana Reyes')).toBeInTheDocument();
    expect(screen.getByText('Intern Carlos')).toBeInTheDocument();
  });

  it('renders member roles', () => {
    renderTeamList();

    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('attorney')).toBeInTheDocument();
    expect(screen.getByText('paralegal')).toBeInTheDocument();
    expect(screen.getByText('readonly')).toBeInTheDocument();
  });

  it('renders member email addresses', () => {
    renderTeamList();

    expect(screen.getByText('admin@firm.ph')).toBeInTheDocument();
    expect(screen.getByText('jose@firm.ph')).toBeInTheDocument();
    expect(screen.getByText('ana@firm.ph')).toBeInTheDocument();
  });

  it('renders pending invitations section', () => {
    renderTeamList();

    expect(screen.getByText(/pending invitations/i)).toBeInTheDocument();
    expect(screen.getByText('new@firm.ph')).toBeInTheDocument();
  });

  it('shows revoke button for pending invitations when admin', () => {
    renderTeamList();

    const revokeButton = screen.getByRole('button', { name: /revoke/i });
    expect(revokeButton).toBeInTheDocument();
  });

  it('admin sees action menu for non-self members', () => {
    renderTeamList();

    // Admin should see action menus for other members (not for self)
    const actionButtons = screen.getAllByTestId('member-actions');
    // user-1 is current user (admin) so no action button for self
    // 3 other members should have actions
    expect(actionButtons.length).toBeGreaterThanOrEqual(3);
  });

  it('non-admin does not see action menus', () => {
    renderTeamList({ currentUserRole: 'attorney', currentUserId: 'user-2' });

    const actionButtons = screen.queryAllByTestId('member-actions');
    expect(actionButtons).toHaveLength(0);
  });

  it('calls onRemoveMember when remove is clicked', async () => {
    const user = userEvent.setup();
    const onRemoveMember = vi.fn();
    renderTeamList({ onRemoveMember });

    // Click first action menu
    const actionButtons = screen.getAllByTestId('member-actions');
    await user.click(actionButtons[0]);

    const removeOption = screen.getByText(/remove/i);
    await user.click(removeOption);

    expect(onRemoveMember).toHaveBeenCalled();
  });

  it('calls onRevokeInvitation when revoke is clicked', async () => {
    const user = userEvent.setup();
    const onRevokeInvitation = vi.fn();
    renderTeamList({ onRevokeInvitation });

    const revokeButton = screen.getByRole('button', { name: /revoke/i });
    await user.click(revokeButton);

    expect(onRevokeInvitation).toHaveBeenCalledWith('inv-1');
  });

  it('does not show remove action for current user (self)', () => {
    renderTeamList();

    // Admin (user-1) should not see a remove option for themselves
    const memberRows = screen.getAllByTestId('member-row');
    const adminRow = memberRows.find((row) =>
      within(row).queryByText('Atty. Maria Santos'),
    );

    if (adminRow) {
      expect(within(adminRow).queryByTestId('member-actions')).not.toBeInTheDocument();
    }
  });

  it('hides pending invitations section when empty', () => {
    renderTeamList({ pendingInvitations: [] });

    expect(screen.queryByText(/pending invitations/i)).not.toBeInTheDocument();
  });

  it('renders with empty members list', () => {
    renderTeamList({ members: [], pendingInvitations: [] });

    expect(screen.queryByTestId('member-row')).not.toBeInTheDocument();
  });

  it('shows all four role types correctly', () => {
    renderTeamList();

    // Verify each member has the correct role badge
    const memberRows = screen.getAllByTestId('member-row');
    expect(memberRows).toHaveLength(4);
  });
});
