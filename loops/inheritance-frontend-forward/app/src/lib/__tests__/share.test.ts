import { describe, it, expect, vi, beforeEach } from 'vitest';

// Chain-style mock for supabase query builder
function createQueryMock(resolvedValue: { data: unknown; error: unknown }) {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {};
  const terminal = vi.fn().mockResolvedValue(resolvedValue);

  mock.single = terminal;
  mock.select = vi.fn().mockReturnValue(mock);
  mock.insert = vi.fn().mockReturnValue(mock);
  mock.update = vi.fn().mockReturnValue(mock);
  mock.delete = vi.fn().mockReturnValue(mock);
  mock.eq = vi.fn().mockReturnValue(mock);

  return mock;
}

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

import { toggleShare, getSharedCase } from '../share';
import type { SharedCaseData } from '../share';

describe('share lib', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toggleShare', () => {
    it('enables sharing and returns share token', async () => {
      const queryMock = createQueryMock({
        data: {
          share_token: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          share_enabled: true,
        },
        error: null,
      });
      mockFrom.mockReturnValue(queryMock);

      const result = await toggleShare('case-123', true);

      expect(mockFrom).toHaveBeenCalledWith('cases');
      expect(queryMock.update).toHaveBeenCalledWith({ share_enabled: true });
      expect(queryMock.eq).toHaveBeenCalledWith('id', 'case-123');
      expect(result.shareToken).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
      expect(result.shareEnabled).toBe(true);
    });

    it('disables sharing and returns share token', async () => {
      const queryMock = createQueryMock({
        data: {
          share_token: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          share_enabled: false,
        },
        error: null,
      });
      mockFrom.mockReturnValue(queryMock);

      const result = await toggleShare('case-123', false);

      expect(queryMock.update).toHaveBeenCalledWith({ share_enabled: false });
      expect(result.shareEnabled).toBe(false);
    });

    it('throws on supabase error', async () => {
      const queryMock = createQueryMock({
        data: null,
        error: { message: 'RLS violation', code: '42501' },
      });
      mockFrom.mockReturnValue(queryMock);

      await expect(toggleShare('case-123', true)).rejects.toEqual({
        message: 'RLS violation',
        code: '42501',
      });
    });
  });

  describe('getSharedCase', () => {
    it('returns case data for valid token with sharing enabled', async () => {
      const caseData: SharedCaseData = {
        title: 'Estate of Juan dela Cruz',
        status: 'computed',
        input_json: null,
        output_json: null,
        decedent_name: 'Juan dela Cruz',
        date_of_death: '2024-03-15',
      };
      mockRpc.mockResolvedValue({ data: [caseData], error: null });

      const result = await getSharedCase('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');

      expect(mockRpc).toHaveBeenCalledWith('get_shared_case', {
        p_token: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      });
      expect(result).toEqual(caseData);
    });

    it('returns null when share is disabled (RPC returns empty)', async () => {
      mockRpc.mockResolvedValue({ data: [], error: null });

      const result = await getSharedCase('disabled-token');

      expect(result).toBeNull();
    });

    it('returns null when token does not exist', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });

      const result = await getSharedCase('nonexistent-token');

      expect(result).toBeNull();
    });

    it('throws on supabase error', async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Function not found', code: '42883' },
      });

      await expect(
        getSharedCase('some-token'),
      ).rejects.toEqual({
        message: 'Function not found',
        code: '42883',
      });
    });

    it('returns complete SharedCaseData with all fields', async () => {
      const fullCase: SharedCaseData = {
        title: 'Estate of Maria Santos',
        status: 'finalized',
        input_json: {
          net_distributable_estate: { centavos: 5000000 },
          decedent: {
            id: 'p1',
            name: 'Maria Santos',
            date_of_death: '2024-06-20',
            is_married: false,
            date_of_marriage: null,
            marriage_solemnized_in_articulo_mortis: false,
            was_ill_at_marriage: false,
            illness_caused_death: false,
            years_of_cohabitation: 0,
            has_legal_separation: false,
            is_illegitimate: false,
          },
          family_tree: [],
          will: null,
          donations: [],
          config: { retroactive_ra_11642: false, max_pipeline_restarts: 5 },
        },
        output_json: {
          per_heir_shares: [],
          narratives: [],
          computation_log: { steps: [], total_restarts: 0, final_scenario: 'I1' },
          warnings: [],
          succession_type: 'Intestate',
          scenario_code: 'I1',
        },
        decedent_name: 'Maria Santos',
        date_of_death: '2024-06-20',
      };
      mockRpc.mockResolvedValue({ data: [fullCase], error: null });

      const result = await getSharedCase('valid-token');

      expect(result).not.toBeNull();
      expect(result!.title).toBe('Estate of Maria Santos');
      expect(result!.input_json).not.toBeNull();
      expect(result!.output_json).not.toBeNull();
      expect(result!.decedent_name).toBe('Maria Santos');
      expect(result!.date_of_death).toBe('2024-06-20');
    });
  });
});
