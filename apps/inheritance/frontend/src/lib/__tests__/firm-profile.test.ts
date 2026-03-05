import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ──────────────────────────────────────────────────────────
const { mockFrom, mockStorage } = vi.hoisted(() => {
  const mockUpload = vi.fn();
  const mockRemove = vi.fn();
  const mockGetPublicUrl = vi.fn();
  const mockList = vi.fn();

  return {
    mockFrom: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    mockStorage: {
      from: vi.fn().mockReturnValue({
        upload: mockUpload,
        remove: mockRemove,
        getPublicUrl: mockGetPublicUrl,
        list: mockList,
      }),
      _upload: mockUpload,
      _remove: mockRemove,
      _getPublicUrl: mockGetPublicUrl,
      _list: mockList,
    },
  };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
    storage: { from: mockStorage.from },
  },
}));

import {
  defaultFirmProfile,
  validateLogoFile,
  rowToFirmProfile,
  firmProfileToRow,
  loadFirmProfile,
  saveFirmProfile,
  uploadLogo,
  deleteLogo,
  DEFAULT_LETTERHEAD_COLOR,
  DEFAULT_SECONDARY_COLOR,
  MAX_LOGO_SIZE_BYTES,
  ALLOWED_LOGO_TYPES,
  LOGO_BUCKET,
} from '@/lib/firm-profile';
import type { FirmProfile } from '@/lib/firm-profile';

// ── Helpers ────────────────────────────────────────────────────────

function makeFile(name: string, type: string, sizeBytes: number): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

function makeFirmRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'user-1',
    email: 'atty@example.com',
    full_name: 'Atty. Santos',
    firm_name: 'Santos Law',
    firm_address: '123 Makati Ave',
    firm_phone: '+63 2 1234 5678',
    firm_email: 'info@santoslaw.ph',
    counsel_name: 'Atty. Juan Santos',
    counsel_email: 'juan@santoslaw.ph',
    counsel_phone: '+63 917 123 4567',
    ibp_roll_no: '123456',
    ptr_no: '7891011',
    mcle_compliance_no: 'VII-0012345',
    logo_url: 'firm-logos/user-1/logo.png',
    letterhead_color: '#1E3A5F',
    secondary_color: '#C9A84C',
    ...overrides,
  };
}

// ── Tests ──────────────────────────────────────────────────────────

describe('firm-branding > firm-profile lib', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Constants ──────────────────────────────────────────────────

  describe('constants', () => {
    it('DEFAULT_LETTERHEAD_COLOR is #1E3A5F', () => {
      expect(DEFAULT_LETTERHEAD_COLOR).toBe('#1E3A5F');
    });

    it('DEFAULT_SECONDARY_COLOR is #C9A84C', () => {
      expect(DEFAULT_SECONDARY_COLOR).toBe('#C9A84C');
    });

    it('MAX_LOGO_SIZE_BYTES is 2MB', () => {
      expect(MAX_LOGO_SIZE_BYTES).toBe(2 * 1024 * 1024);
    });

    it('ALLOWED_LOGO_TYPES includes PNG, JPEG, and SVG', () => {
      expect(ALLOWED_LOGO_TYPES).toContain('image/png');
      expect(ALLOWED_LOGO_TYPES).toContain('image/jpeg');
      expect(ALLOWED_LOGO_TYPES).toContain('image/svg+xml');
    });

    it('LOGO_BUCKET is firm-logos', () => {
      expect(LOGO_BUCKET).toBe('firm-logos');
    });
  });

  // ── defaultFirmProfile ────────────────────────────────────────

  describe('defaultFirmProfile', () => {
    it('returns all null fields except colors', () => {
      const p = defaultFirmProfile();
      expect(p.firmName).toBeNull();
      expect(p.firmAddress).toBeNull();
      expect(p.firmPhone).toBeNull();
      expect(p.firmEmail).toBeNull();
      expect(p.counselName).toBeNull();
      expect(p.counselEmail).toBeNull();
      expect(p.counselPhone).toBeNull();
      expect(p.ibpRollNo).toBeNull();
      expect(p.ptrNo).toBeNull();
      expect(p.mcleComplianceNo).toBeNull();
      expect(p.logoUrl).toBeNull();
    });

    it('defaults letterheadColor to #1E3A5F', () => {
      expect(defaultFirmProfile().letterheadColor).toBe('#1E3A5F');
    });

    it('defaults secondaryColor to #C9A84C', () => {
      expect(defaultFirmProfile().secondaryColor).toBe('#C9A84C');
    });
  });

  // ── rowToFirmProfile ──────────────────────────────────────────

  describe('rowToFirmProfile', () => {
    it('converts snake_case DB row to camelCase FirmProfile', () => {
      const row = makeFirmRow();
      const profile = rowToFirmProfile(row);
      expect(profile.firmName).toBe('Santos Law');
      expect(profile.firmAddress).toBe('123 Makati Ave');
      expect(profile.firmPhone).toBe('+63 2 1234 5678');
      expect(profile.firmEmail).toBe('info@santoslaw.ph');
      expect(profile.counselName).toBe('Atty. Juan Santos');
      expect(profile.counselEmail).toBe('juan@santoslaw.ph');
      expect(profile.counselPhone).toBe('+63 917 123 4567');
      expect(profile.ibpRollNo).toBe('123456');
      expect(profile.ptrNo).toBe('7891011');
      expect(profile.mcleComplianceNo).toBe('VII-0012345');
      expect(profile.logoUrl).toBe('firm-logos/user-1/logo.png');
      expect(profile.letterheadColor).toBe('#1E3A5F');
      expect(profile.secondaryColor).toBe('#C9A84C');
    });

    it('handles null fields gracefully', () => {
      const row = makeFirmRow({
        firm_name: null,
        counsel_name: null,
        logo_url: null,
      });
      const profile = rowToFirmProfile(row);
      expect(profile.firmName).toBeNull();
      expect(profile.counselName).toBeNull();
      expect(profile.logoUrl).toBeNull();
    });

    it('uses default colors when not provided', () => {
      const row = makeFirmRow({
        letterhead_color: undefined,
        secondary_color: undefined,
      });
      const profile = rowToFirmProfile(row);
      expect(profile.letterheadColor).toBe(DEFAULT_LETTERHEAD_COLOR);
      expect(profile.secondaryColor).toBe(DEFAULT_SECONDARY_COLOR);
    });
  });

  // ── firmProfileToRow ──────────────────────────────────────────

  describe('firmProfileToRow', () => {
    it('converts camelCase FirmProfile to snake_case DB payload', () => {
      const profile: FirmProfile = {
        firmName: 'Santos Law',
        firmAddress: '123 Makati Ave',
        firmPhone: '+63 2 1234 5678',
        firmEmail: 'info@santoslaw.ph',
        counselName: 'Atty. Juan Santos',
        counselEmail: 'juan@santoslaw.ph',
        counselPhone: '+63 917 123 4567',
        ibpRollNo: '123456',
        ptrNo: '7891011',
        mcleComplianceNo: 'VII-0012345',
        logoUrl: null,
        letterheadColor: '#1E3A5F',
        secondaryColor: '#C9A84C',
      };
      const row = firmProfileToRow(profile);
      expect(row).toHaveProperty('firm_name', 'Santos Law');
      expect(row).toHaveProperty('firm_address', '123 Makati Ave');
      expect(row).toHaveProperty('counsel_name', 'Atty. Juan Santos');
      expect(row).toHaveProperty('counsel_email', 'juan@santoslaw.ph');
      expect(row).toHaveProperty('counsel_phone', '+63 917 123 4567');
      expect(row).toHaveProperty('ibp_roll_no', '123456');
      expect(row).toHaveProperty('ptr_no', '7891011');
      expect(row).toHaveProperty('mcle_compliance_no', 'VII-0012345');
      expect(row).toHaveProperty('letterhead_color', '#1E3A5F');
      expect(row).toHaveProperty('secondary_color', '#C9A84C');
    });
  });

  // ── validateLogoFile ──────────────────────────────────────────

  describe('validateLogoFile', () => {
    it('accepts a PNG file under 2MB', () => {
      const file = makeFile('logo.png', 'image/png', 500_000);
      const result = validateLogoFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts a JPEG file under 2MB', () => {
      const file = makeFile('logo.jpg', 'image/jpeg', 1_000_000);
      const result = validateLogoFile(file);
      expect(result.valid).toBe(true);
    });

    it('accepts an SVG file under 2MB', () => {
      const file = makeFile('logo.svg', 'image/svg+xml', 50_000);
      const result = validateLogoFile(file);
      expect(result.valid).toBe(true);
    });

    it('rejects a file exceeding 2MB', () => {
      const file = makeFile('huge.png', 'image/png', MAX_LOGO_SIZE_BYTES + 1);
      const result = validateLogoFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/size|2\s?MB/i);
    });

    it('rejects a GIF file type', () => {
      const file = makeFile('logo.gif', 'image/gif', 100_000);
      const result = validateLogoFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toMatch(/type|format|PNG|JPG|SVG/i);
    });

    it('rejects a PDF file type', () => {
      const file = makeFile('doc.pdf', 'application/pdf', 100_000);
      const result = validateLogoFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/type|format/i);
    });

    it('rejects a file that is exactly 2MB + 1 byte', () => {
      const file = makeFile('edge.png', 'image/png', MAX_LOGO_SIZE_BYTES + 1);
      const result = validateLogoFile(file);
      expect(result.valid).toBe(false);
    });

    it('accepts a file that is exactly 2MB', () => {
      const file = makeFile('edge.png', 'image/png', MAX_LOGO_SIZE_BYTES);
      const result = validateLogoFile(file);
      expect(result.valid).toBe(true);
    });
  });

  // ── loadFirmProfile ───────────────────────────────────────────

  describe('loadFirmProfile', () => {
    it('calls supabase.from("user_profiles").select().eq().single()', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: makeFirmRow(),
        error: null,
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const profile = await loadFirmProfile('user-1');
      expect(mockFrom).toHaveBeenCalledWith('user_profiles');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('id', 'user-1');
      expect(profile.firmName).toBe('Santos Law');
    });

    it('returns default profile when row not found', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'not found' },
      });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      mockFrom.mockReturnValue({ select: mockSelect });

      const profile = await loadFirmProfile('nonexistent');
      expect(profile.firmName).toBeNull();
      expect(profile.letterheadColor).toBe(DEFAULT_LETTERHEAD_COLOR);
    });
  });

  // ── saveFirmProfile ───────────────────────────────────────────

  describe('saveFirmProfile', () => {
    it('calls supabase upsert with snake_case fields', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockReturnValue({ upsert: mockUpsert });

      await saveFirmProfile('user-1', { firmName: 'New Firm', letterheadColor: '#FF0000' });
      expect(mockFrom).toHaveBeenCalledWith('user_profiles');
      expect(mockUpsert).toHaveBeenCalled();
      const payload = mockUpsert.mock.calls[0][0];
      expect(payload).toHaveProperty('id', 'user-1');
      expect(payload).toHaveProperty('firm_name', 'New Firm');
      expect(payload).toHaveProperty('letterhead_color', '#FF0000');
    });

    it('throws on Supabase error', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'RLS violation' },
      });
      mockFrom.mockReturnValue({ upsert: mockUpsert });

      await expect(saveFirmProfile('user-1', { firmName: 'Test' })).rejects.toThrow();
    });
  });

  // ── uploadLogo ────────────────────────────────────────────────

  describe('uploadLogo', () => {
    it('uploads to firm-logos/{userId}/logo.{ext} path', async () => {
      mockStorage._upload.mockResolvedValue({ data: { path: 'firm-logos/user-1/logo.png' }, error: null });
      mockStorage._list.mockResolvedValue({ data: [], error: null });
      mockStorage._remove.mockResolvedValue({ data: null, error: null });

      const file = makeFile('my-logo.png', 'image/png', 100_000);
      const path = await uploadLogo('user-1', file);
      expect(mockStorage.from).toHaveBeenCalledWith('firm-logos');
      expect(path).toContain('user-1');
      expect(path).toMatch(/\.png$/);
    });

    it('deletes previous logo before uploading new one', async () => {
      mockStorage._list.mockResolvedValue({
        data: [{ name: 'logo.png' }],
        error: null,
      });
      mockStorage._remove.mockResolvedValue({ data: null, error: null });
      mockStorage._upload.mockResolvedValue({ data: { path: 'firm-logos/user-1/logo.jpg' }, error: null });

      const file = makeFile('new-logo.jpg', 'image/jpeg', 100_000);
      await uploadLogo('user-1', file);
      expect(mockStorage._remove).toHaveBeenCalled();
    });
  });

  // ── deleteLogo ────────────────────────────────────────────────

  describe('deleteLogo', () => {
    it('removes the file at the given path from storage', async () => {
      mockStorage._remove.mockResolvedValue({ data: null, error: null });

      await deleteLogo('user-1', 'firm-logos/user-1/logo.png');
      expect(mockStorage.from).toHaveBeenCalledWith('firm-logos');
      expect(mockStorage._remove).toHaveBeenCalled();
    });
  });
});
