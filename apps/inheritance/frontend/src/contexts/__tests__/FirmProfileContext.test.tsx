import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { FirmProfileProvider, useFirmProfile } from '@/contexts/FirmProfileContext';
import type { FirmProfile } from '@/lib/firm-profile';
import { DEFAULT_LETTERHEAD_COLOR, DEFAULT_SECONDARY_COLOR } from '@/lib/firm-profile';

// ── Mocks ──────────────────────────────────────────────────────────
const { mockLoadFirmProfile, mockSaveFirmProfile } = vi.hoisted(() => ({
  mockLoadFirmProfile: vi.fn(),
  mockSaveFirmProfile: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {},
    from: vi.fn(),
    storage: { from: vi.fn() },
  },
}));

vi.mock('@/lib/firm-profile', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/firm-profile')>();
  return {
    ...actual,
    loadFirmProfile: mockLoadFirmProfile,
    saveFirmProfile: mockSaveFirmProfile,
  };
});

// ── Helpers ────────────────────────────────────────────────────────

function makeProfile(overrides: Partial<FirmProfile> = {}): FirmProfile {
  return {
    firmName: 'Santos Law Office',
    firmAddress: '123 Makati Ave, Makati City',
    firmPhone: '+63 2 1234 5678',
    firmEmail: 'info@santoslaw.ph',
    counselName: 'Atty. Juan Santos',
    counselEmail: 'juan@santoslaw.ph',
    counselPhone: '+63 917 123 4567',
    ibpRollNo: '123456',
    ptrNo: '7891011',
    mcleComplianceNo: 'VII-0012345',
    logoUrl: null,
    letterheadColor: DEFAULT_LETTERHEAD_COLOR,
    secondaryColor: DEFAULT_SECONDARY_COLOR,
    ...overrides,
  };
}

/** Consumer component that renders profile values for assertion */
function ProfileConsumer() {
  const { profile, loading, error } = useFirmProfile();
  if (loading) return <div data-testid="loading">Loading...</div>;
  if (error) return <div data-testid="error">{error}</div>;
  return (
    <div data-testid="profile-data">
      <span data-testid="firm-name">{profile.firmName ?? 'N/A'}</span>
      <span data-testid="counsel-name">{profile.counselName ?? 'N/A'}</span>
      <span data-testid="letterhead-color">{profile.letterheadColor}</span>
      <span data-testid="secondary-color">{profile.secondaryColor}</span>
      <span data-testid="logo-url">{profile.logoUrl ?? 'none'}</span>
    </div>
  );
}

/** Consumer that can update profile */
function ProfileUpdater({ updates }: { updates: Partial<FirmProfile> }) {
  const { updateProfile } = useFirmProfile();
  return (
    <button
      data-testid="update-btn"
      onClick={() => updateProfile(updates)}
    >
      Update
    </button>
  );
}

function renderWithProvider(userId: string | null = 'user-1') {
  return render(
    <FirmProfileProvider userId={userId}>
      <ProfileConsumer />
    </FirmProfileProvider>,
  );
}

// ── Tests ──────────────────────────────────────────────────────────

describe('firm-branding > FirmProfileContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadFirmProfile.mockResolvedValue(makeProfile());
    mockSaveFirmProfile.mockResolvedValue(undefined);
  });

  describe('provider rendering', () => {
    it('supplies profile data to children', async () => {
      renderWithProvider('user-1');
      await waitFor(() => {
        expect(screen.getByTestId('firm-name')).toHaveTextContent('Santos Law Office');
      });
    });

    it('supplies counsel name to children', async () => {
      renderWithProvider('user-1');
      await waitFor(() => {
        expect(screen.getByTestId('counsel-name')).toHaveTextContent('Atty. Juan Santos');
      });
    });

    it('supplies default letterhead color', async () => {
      renderWithProvider('user-1');
      await waitFor(() => {
        expect(screen.getByTestId('letterhead-color')).toHaveTextContent('#1E3A5F');
      });
    });

    it('supplies default secondary color', async () => {
      renderWithProvider('user-1');
      await waitFor(() => {
        expect(screen.getByTestId('secondary-color')).toHaveTextContent('#C9A84C');
      });
    });

    it('shows loading state initially', () => {
      mockLoadFirmProfile.mockReturnValue(new Promise(() => {})); // never resolves
      renderWithProvider('user-1');
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  describe('data fetching', () => {
    it('calls loadFirmProfile with the userId', async () => {
      renderWithProvider('user-42');
      await waitFor(() => {
        expect(mockLoadFirmProfile).toHaveBeenCalledWith('user-42');
      });
    });

    it('does not call loadFirmProfile when userId is null', async () => {
      renderWithProvider(null);
      // Short wait to confirm it was NOT called
      await act(async () => {
        await new Promise((r) => setTimeout(r, 50));
      });
      expect(mockLoadFirmProfile).not.toHaveBeenCalled();
    });

    it('shows error state when load fails', async () => {
      mockLoadFirmProfile.mockRejectedValue(new Error('Network error'));
      renderWithProvider('user-1');
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(/Network error|failed/i);
      });
    });
  });

  describe('updateProfile', () => {
    it('calls saveFirmProfile with userId and updates', async () => {
      render(
        <FirmProfileProvider userId="user-1">
          <ProfileConsumer />
          <ProfileUpdater updates={{ firmName: 'Updated Firm' }} />
        </FirmProfileProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('firm-name')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByTestId('update-btn').click();
      });

      await waitFor(() => {
        expect(mockSaveFirmProfile).toHaveBeenCalledWith('user-1', { firmName: 'Updated Firm' });
      });
    });

    it('optimistically updates profile in context', async () => {
      render(
        <FirmProfileProvider userId="user-1">
          <ProfileConsumer />
          <ProfileUpdater updates={{ firmName: 'New Name' }} />
        </FirmProfileProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId('firm-name')).toHaveTextContent('Santos Law Office');
      });

      await act(async () => {
        screen.getByTestId('update-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('firm-name')).toHaveTextContent('New Name');
      });
    });
  });

  describe('useFirmProfile outside provider', () => {
    it('throws when used outside FirmProfileProvider', () => {
      // Suppress React error boundary logs
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<ProfileConsumer />)).toThrow(
        /useFirmProfile must be used within a FirmProfileProvider/,
      );
      spy.mockRestore();
    });
  });
});
