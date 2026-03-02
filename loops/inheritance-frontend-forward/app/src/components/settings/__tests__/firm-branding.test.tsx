import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {},
    from: vi.fn(),
    storage: { from: vi.fn() },
  },
}));

import { FirmProfileForm } from '@/components/settings/FirmProfileForm';
import { LogoUpload } from '@/components/settings/LogoUpload';
import { ColorPickers } from '@/components/settings/ColorPickers';
import type { FirmProfile } from '@/lib/firm-profile';
import { DEFAULT_LETTERHEAD_COLOR, DEFAULT_SECONDARY_COLOR } from '@/lib/firm-profile';

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

function makeFile(name: string, type: string, sizeBytes: number): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

// ── FirmProfileForm Tests ──────────────────────────────────────────

describe('firm-branding > FirmProfileForm', () => {
  let mockOnSave: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSave = vi.fn().mockResolvedValue(undefined);
  });

  function renderForm(overrides: Partial<FirmProfile> = {}) {
    return render(
      <FirmProfileForm
        profile={makeProfile(overrides)}
        onSave={mockOnSave}
      />,
    );
  }

  describe('settings page renders all form fields', () => {
    it('renders firm name input', () => {
      renderForm();
      expect(screen.getByLabelText(/firm name/i)).toBeInTheDocument();
    });

    it('renders firm address input', () => {
      renderForm();
      expect(screen.getByLabelText(/firm address/i)).toBeInTheDocument();
    });

    it('renders firm phone input', () => {
      renderForm();
      expect(screen.getByLabelText(/firm phone/i)).toBeInTheDocument();
    });

    it('renders firm email input', () => {
      renderForm();
      expect(screen.getByLabelText(/firm email/i)).toBeInTheDocument();
    });

    it('renders counsel name input', () => {
      renderForm();
      expect(screen.getByLabelText(/counsel name/i)).toBeInTheDocument();
    });

    it('renders counsel email input', () => {
      renderForm();
      expect(screen.getByLabelText(/counsel email/i)).toBeInTheDocument();
    });

    it('renders counsel phone input', () => {
      renderForm();
      expect(screen.getByLabelText(/counsel phone/i)).toBeInTheDocument();
    });

    it('renders IBP Roll No. input', () => {
      renderForm();
      expect(screen.getByLabelText(/ibp roll/i)).toBeInTheDocument();
    });

    it('renders PTR No. input', () => {
      renderForm();
      expect(screen.getByLabelText(/ptr/i)).toBeInTheDocument();
    });

    it('renders MCLE Compliance No. input', () => {
      renderForm();
      expect(screen.getByLabelText(/mcle/i)).toBeInTheDocument();
    });
  });

  describe('form pre-population', () => {
    it('pre-populates firm name from profile', () => {
      renderForm({ firmName: 'Test Firm' });
      expect(screen.getByLabelText(/firm name/i)).toHaveValue('Test Firm');
    });

    it('pre-populates counsel name from profile', () => {
      renderForm({ counselName: 'Atty. Test' });
      expect(screen.getByLabelText(/counsel name/i)).toHaveValue('Atty. Test');
    });

    it('pre-populates IBP Roll No. from profile', () => {
      renderForm({ ibpRollNo: '999888' });
      expect(screen.getByLabelText(/ibp roll/i)).toHaveValue('999888');
    });
  });

  describe('form submission', () => {
    it('renders a save button', () => {
      renderForm();
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });

    it('calls onSave with updated fields when save clicked', async () => {
      const user = userEvent.setup();
      renderForm({ firmName: '' });

      const firmNameInput = screen.getByLabelText(/firm name/i);
      await user.clear(firmNameInput);
      await user.type(firmNameInput, 'New Firm Name');
      await user.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        const savedData = mockOnSave.mock.calls[0][0];
        expect(savedData.firmName).toBe('New Firm Name');
      });
    });

    it('shows saving indicator when saving', () => {
      render(
        <FirmProfileForm
          profile={makeProfile()}
          onSave={mockOnSave}
          saving={true}
        />,
      );
      // Either button is disabled or shows saving text
      const saveBtn = screen.getByRole('button', { name: /sav/i });
      expect(
        saveBtn.hasAttribute('disabled') ||
        saveBtn.textContent?.toLowerCase().includes('saving'),
      ).toBe(true);
    });
  });
});

// ── LogoUpload Tests ───────────────────────────────────────────────

describe('firm-branding > LogoUpload', () => {
  let mockOnUpload: ReturnType<typeof vi.fn>;
  let mockOnRemove: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnUpload = vi.fn().mockResolvedValue(undefined);
    mockOnRemove = vi.fn().mockResolvedValue(undefined);
  });

  function renderUpload(logoUrl: string | null = null) {
    return render(
      <LogoUpload
        currentLogoUrl={logoUrl}
        onUpload={mockOnUpload}
        onRemove={mockOnRemove}
      />,
    );
  }

  it('renders upload area', () => {
    renderUpload();
    expect(screen.getByTestId('logo-upload')).toBeInTheDocument();
  });

  it('renders file input accepting images', () => {
    renderUpload();
    const input = screen.getByLabelText(/logo|upload/i) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.accept).toMatch(/image/);
  });

  it('shows current logo preview when logo exists', () => {
    renderUpload('https://example.com/logo.png');
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('does not show preview when no logo', () => {
    renderUpload(null);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows remove button when logo exists', () => {
    renderUpload('https://example.com/logo.png');
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  it('calls onRemove when remove button clicked', async () => {
    const user = userEvent.setup();
    renderUpload('https://example.com/logo.png');
    await user.click(screen.getByRole('button', { name: /remove/i }));
    expect(mockOnRemove).toHaveBeenCalled();
  });

  it('calls onUpload with selected file', async () => {
    const user = userEvent.setup();
    renderUpload();
    const file = makeFile('logo.png', 'image/png', 100_000);
    const input = screen.getByLabelText(/logo|upload/i) as HTMLInputElement;
    await user.upload(input, file);

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(file);
    });
  });

  it('rejects file over 2MB and shows error', async () => {
    const user = userEvent.setup();
    renderUpload();
    const bigFile = makeFile('huge.png', 'image/png', 3 * 1024 * 1024);
    const input = screen.getByLabelText(/logo|upload/i) as HTMLInputElement;
    await user.upload(input, bigFile);

    await waitFor(() => {
      expect(mockOnUpload).not.toHaveBeenCalled();
      expect(screen.getByText(/2\s?MB|too large|size/i)).toBeInTheDocument();
    });
  });

  it('rejects non-image file type and shows error', async () => {
    const user = userEvent.setup();
    renderUpload();
    const pdfFile = makeFile('doc.pdf', 'application/pdf', 100_000);
    const input = screen.getByLabelText(/logo|upload/i) as HTMLInputElement;
    await user.upload(input, pdfFile);

    await waitFor(() => {
      expect(mockOnUpload).not.toHaveBeenCalled();
      expect(screen.getByText(/type|format|PNG|JPG|SVG/i)).toBeInTheDocument();
    });
  });
});

// ── ColorPickers Tests ─────────────────────────────────────────────

describe('firm-branding > ColorPickers', () => {
  let mockLetterheadChange: ReturnType<typeof vi.fn>;
  let mockSecondaryChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLetterheadChange = vi.fn();
    mockSecondaryChange = vi.fn();
  });

  function renderPickers(
    letterhead = DEFAULT_LETTERHEAD_COLOR,
    secondary = DEFAULT_SECONDARY_COLOR,
  ) {
    return render(
      <ColorPickers
        letterheadColor={letterhead}
        secondaryColor={secondary}
        onLetterheadChange={mockLetterheadChange}
        onSecondaryChange={mockSecondaryChange}
      />,
    );
  }

  it('renders color pickers container', () => {
    renderPickers();
    expect(screen.getByTestId('color-pickers')).toBeInTheDocument();
  });

  it('renders letterhead color label', () => {
    renderPickers();
    expect(screen.getByText(/letterhead/i)).toBeInTheDocument();
  });

  it('renders secondary color label', () => {
    renderPickers();
    expect(screen.getByText(/secondary/i)).toBeInTheDocument();
  });

  it('letterhead color input defaults to #1E3A5F', () => {
    renderPickers();
    const colorInput = screen.getByLabelText(/letterhead/i) as HTMLInputElement;
    expect(colorInput.value).toBe('#1E3A5F');
  });

  it('secondary color input defaults to #C9A84C', () => {
    renderPickers();
    const colorInput = screen.getByLabelText(/secondary/i) as HTMLInputElement;
    expect(colorInput.value).toBe('#C9A84C');
  });

  it('displays custom letterhead color when provided', () => {
    renderPickers('#FF0000');
    const colorInput = screen.getByLabelText(/letterhead/i) as HTMLInputElement;
    expect(colorInput.value).toBe('#FF0000');
  });

  it('displays custom secondary color when provided', () => {
    renderPickers(DEFAULT_LETTERHEAD_COLOR, '#00FF00');
    const colorInput = screen.getByLabelText(/secondary/i) as HTMLInputElement;
    expect(colorInput.value).toBe('#00FF00');
  });
});

// ── Settings Route Tests ───────────────────────────────────────────

describe('firm-branding > Settings page integration', () => {
  it('settings page renders all major sections', () => {
    // This will be tested once SettingsPage is implemented with the sub-components
    // For now, verify the components can render together
    const profile = makeProfile();
    const mockSave = vi.fn().mockResolvedValue(undefined);

    render(
      <div>
        <FirmProfileForm profile={profile} onSave={mockSave} />
        <LogoUpload
          currentLogoUrl={profile.logoUrl}
          onUpload={vi.fn()}
          onRemove={vi.fn()}
        />
        <ColorPickers
          letterheadColor={profile.letterheadColor}
          secondaryColor={profile.secondaryColor}
          onLetterheadChange={vi.fn()}
          onSecondaryChange={vi.fn()}
        />
      </div>,
    );

    expect(screen.getByTestId('firm-profile-form')).toBeInTheDocument();
    expect(screen.getByTestId('logo-upload')).toBeInTheDocument();
    expect(screen.getByTestId('color-pickers')).toBeInTheDocument();
  });
});
