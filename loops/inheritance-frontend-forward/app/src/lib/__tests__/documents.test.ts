import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CaseDocument } from '@/types';

// --------------------------------------------------------------------------
// Mock supabase before importing
// --------------------------------------------------------------------------

const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import {
  seedDocuments,
  checkOffDocument,
  markNotApplicable,
  listDocuments,
  computeProgress,
} from '../documents';

// --------------------------------------------------------------------------
// Helper: build a mock CaseDocument
// --------------------------------------------------------------------------

function makeDoc(overrides: Partial<CaseDocument> = {}): CaseDocument {
  return {
    id: 'doc-1',
    case_id: 'case-1',
    user_id: 'user-1',
    document_key: 'psa-death-cert',
    label: 'PSA Death Certificate',
    category: 'Identity',
    description: 'Authenticated PSA Death Certificate.',
    required_when: 'always',
    is_obtained: false,
    is_not_applicable: false,
    obtained_date: null,
    note: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// --------------------------------------------------------------------------
// Tests — seedDocuments
// --------------------------------------------------------------------------

describe('doc-check > seedDocuments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls upsert on case_documents with applicable templates', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await seedDocuments('case-1', 'user-1', {
      is_married: false,
      has_real_property: false,
      has_bank_account: false,
      has_business_interest: false,
      has_overseas_heir: false,
      settlement_track: 'ejs',
    });

    expect(mockFrom).toHaveBeenCalledWith('case_documents');
    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });

  it('seeds 4 always-required docs for minimal context', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await seedDocuments('case-1', 'user-1', {
      is_married: false,
      has_real_property: false,
      has_bank_account: false,
      has_business_interest: false,
      has_overseas_heir: false,
      settlement_track: 'judicial',
    });

    const [rows] = mockUpsert.mock.calls[0];
    // 4 always + 2 judicial = 6
    expect(rows).toHaveLength(6);
  });

  it('seeds marriage cert when is_married is true', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await seedDocuments('case-1', 'user-1', {
      is_married: true,
      has_real_property: false,
      has_bank_account: false,
      has_business_interest: false,
      has_overseas_heir: false,
      settlement_track: 'ejs',
    });

    const [rows] = mockUpsert.mock.calls[0];
    const keys = rows.map((r: Record<string, unknown>) => r.document_key);
    expect(keys).toContain('psa-marriage-cert');
  });

  it('seeds property docs when has_real_property is true', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await seedDocuments('case-1', 'user-1', {
      is_married: false,
      has_real_property: true,
      has_bank_account: false,
      has_business_interest: false,
      has_overseas_heir: false,
      settlement_track: 'ejs',
    });

    const [rows] = mockUpsert.mock.calls[0];
    const keys = rows.map((r: Record<string, unknown>) => r.document_key);
    expect(keys).toContain('tct-cct');
    expect(keys).toContain('tax-declaration');
    expect(keys).toContain('zonal-value-cert');
  });

  it('passes case_id and user_id to all rows', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await seedDocuments('case-42', 'user-7', {
      is_married: false,
      has_real_property: false,
      has_bank_account: false,
      has_business_interest: false,
      has_overseas_heir: false,
      settlement_track: 'ejs',
    });

    const [rows] = mockUpsert.mock.calls[0];
    rows.forEach((row: Record<string, unknown>) => {
      expect(row.case_id).toBe('case-42');
      expect(row.user_id).toBe('user-7');
    });
  });

  it('sets is_obtained=false and is_not_applicable=false for all rows', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await seedDocuments('case-1', 'user-1', {
      is_married: true,
      has_real_property: true,
      has_bank_account: true,
      has_business_interest: true,
      has_overseas_heir: true,
      settlement_track: 'ejs',
    });

    const [rows] = mockUpsert.mock.calls[0];
    rows.forEach((row: Record<string, unknown>) => {
      expect(row.is_obtained).toBe(false);
      expect(row.is_not_applicable).toBe(false);
    });
  });

  it('upserts on conflict (case_id, document_key)', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await seedDocuments('case-1', 'user-1', {
      is_married: false,
      has_real_property: false,
      has_bank_account: false,
      has_business_interest: false,
      has_overseas_heir: false,
      settlement_track: 'ejs',
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.any(Array),
      { onConflict: 'case_id,document_key' },
    );
  });

  it('throws on supabase error', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({
      error: { message: 'upsert failed' },
    });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await expect(
      seedDocuments('case-1', 'user-1', {
        is_married: false,
        has_real_property: false,
        has_bank_account: false,
        has_business_interest: false,
        has_overseas_heir: false,
        settlement_track: 'ejs',
      }),
    ).rejects.toEqual({ message: 'upsert failed' });
  });
});

// --------------------------------------------------------------------------
// Tests — checkOffDocument
// --------------------------------------------------------------------------

describe('doc-check > checkOffDocument', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates is_obtained and obtained_date for the document', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });

    await checkOffDocument('doc-1', '2026-02-01');

    expect(mockFrom).toHaveBeenCalledWith('case_documents');
    expect(mockUpdate).toHaveBeenCalledWith({
      is_obtained: true,
      obtained_date: '2026-02-01',
    });
    expect(mockEq).toHaveBeenCalledWith('id', 'doc-1');
  });

  it('includes note when provided', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });

    await checkOffDocument('doc-1', '2026-02-01', 'Received authenticated copy from PSA');

    expect(mockUpdate).toHaveBeenCalledWith({
      is_obtained: true,
      obtained_date: '2026-02-01',
      note: 'Received authenticated copy from PSA',
    });
  });

  it('throws on supabase error', async () => {
    const mockEq = vi.fn().mockResolvedValue({
      error: { message: 'update failed' },
    });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });

    await expect(
      checkOffDocument('doc-1', '2026-02-01'),
    ).rejects.toEqual({ message: 'update failed' });
  });
});

// --------------------------------------------------------------------------
// Tests — markNotApplicable
// --------------------------------------------------------------------------

describe('doc-check > markNotApplicable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates is_not_applicable to true', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });

    await markNotApplicable('doc-1');

    expect(mockFrom).toHaveBeenCalledWith('case_documents');
    expect(mockUpdate).toHaveBeenCalledWith({ is_not_applicable: true });
    expect(mockEq).toHaveBeenCalledWith('id', 'doc-1');
  });

  it('throws on supabase error', async () => {
    const mockEq = vi.fn().mockResolvedValue({
      error: { message: 'update failed' },
    });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });

    await expect(markNotApplicable('doc-1')).rejects.toEqual({
      message: 'update failed',
    });
  });
});

// --------------------------------------------------------------------------
// Tests — listDocuments
// --------------------------------------------------------------------------

describe('doc-check > listDocuments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries case_documents by case_id ordered by category and label', async () => {
    const mockOrder2 = vi.fn().mockResolvedValue({
      data: [makeDoc(), makeDoc({ id: 'doc-2', document_key: 'psa-birth-certs' })],
      error: null,
    });
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder1 });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const result = await listDocuments('case-1');

    expect(mockFrom).toHaveBeenCalledWith('case_documents');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('case_id', 'case-1');
    expect(mockOrder1).toHaveBeenCalledWith('category', { ascending: true });
    expect(mockOrder2).toHaveBeenCalledWith('label', { ascending: true });
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no documents exist', async () => {
    const mockOrder2 = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder1 });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const result = await listDocuments('case-empty');
    expect(result).toEqual([]);
  });

  it('throws on supabase error', async () => {
    const mockOrder2 = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'select failed' },
    });
    const mockOrder1 = vi.fn().mockReturnValue({ order: mockOrder2 });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder1 });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    await expect(listDocuments('case-1')).rejects.toEqual({
      message: 'select failed',
    });
  });
});

// --------------------------------------------------------------------------
// Tests — computeProgress
// --------------------------------------------------------------------------

describe('doc-check > computeProgress', () => {
  it('returns 0% for empty documents array', () => {
    const result = computeProgress([]);
    expect(result).toEqual({ obtained: 0, total: 0, percentage: 0 });
  });

  it('returns correct counts when no documents obtained', () => {
    const docs = [
      makeDoc({ id: '1', is_obtained: false }),
      makeDoc({ id: '2', is_obtained: false }),
      makeDoc({ id: '3', is_obtained: false }),
    ];
    const result = computeProgress(docs);
    expect(result.obtained).toBe(0);
    expect(result.total).toBe(3);
    expect(result.percentage).toBe(0);
  });

  it('returns correct counts when some documents obtained', () => {
    const docs = [
      makeDoc({ id: '1', is_obtained: true }),
      makeDoc({ id: '2', is_obtained: true }),
      makeDoc({ id: '3', is_obtained: false }),
      makeDoc({ id: '4', is_obtained: false }),
    ];
    const result = computeProgress(docs);
    expect(result.obtained).toBe(2);
    expect(result.total).toBe(4);
    expect(result.percentage).toBe(50);
  });

  it('returns 100% when all documents obtained', () => {
    const docs = [
      makeDoc({ id: '1', is_obtained: true }),
      makeDoc({ id: '2', is_obtained: true }),
    ];
    const result = computeProgress(docs);
    expect(result.obtained).toBe(2);
    expect(result.total).toBe(2);
    expect(result.percentage).toBe(100);
  });

  it('excludes N/A documents from denominator', () => {
    const docs = [
      makeDoc({ id: '1', is_obtained: true }),
      makeDoc({ id: '2', is_obtained: false }),
      makeDoc({ id: '3', is_not_applicable: true }),
    ];
    const result = computeProgress(docs);
    // total = 3 - 1 (N/A) = 2; obtained = 1
    expect(result.obtained).toBe(1);
    expect(result.total).toBe(2);
    expect(result.percentage).toBe(50);
  });

  it('excludes N/A documents that are also marked obtained from obtained count', () => {
    const docs = [
      makeDoc({ id: '1', is_obtained: true }),
      makeDoc({ id: '2', is_obtained: true, is_not_applicable: true }),
      makeDoc({ id: '3', is_obtained: false }),
    ];
    const result = computeProgress(docs);
    // N/A doc excluded from both numerator and denominator
    // total = 3 - 1 = 2; obtained = 1 (only doc-1)
    expect(result.obtained).toBe(1);
    expect(result.total).toBe(2);
    expect(result.percentage).toBe(50);
  });

  it('returns 0% when all documents are N/A (edge case, total = 0)', () => {
    const docs = [
      makeDoc({ id: '1', is_not_applicable: true }),
      makeDoc({ id: '2', is_not_applicable: true }),
    ];
    const result = computeProgress(docs);
    expect(result.obtained).toBe(0);
    expect(result.total).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it('rounds percentage to nearest integer', () => {
    const docs = [
      makeDoc({ id: '1', is_obtained: true }),
      makeDoc({ id: '2', is_obtained: false }),
      makeDoc({ id: '3', is_obtained: false }),
    ];
    const result = computeProgress(docs);
    // 1/3 = 33.33... → 33
    expect(result.percentage).toBe(33);
  });
});
