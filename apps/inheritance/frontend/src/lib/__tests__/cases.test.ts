import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { EngineInput, EngineOutput } from '@/types';
import { VALID_STATUS_TRANSITIONS } from '@/types';

// Build a chain-style mock for supabase query builder
function createQueryMock(resolvedValue: { data: unknown; error: unknown }) {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {};
  const terminal = vi.fn().mockResolvedValue(resolvedValue);

  // Terminal methods
  mock.single = terminal;

  // Chain methods that can end or continue
  mock.select = vi.fn().mockReturnValue(mock);
  mock.insert = vi.fn().mockReturnValue(mock);
  mock.update = vi.fn().mockReturnValue(mock);
  mock.delete = vi.fn().mockReturnValue(mock);
  mock.eq = vi.fn().mockReturnValue(mock);
  mock.order = vi.fn().mockResolvedValue(resolvedValue);

  return mock;
}

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: mockFrom,
  },
}));

import { createCase, loadCase, updateCaseInput, updateCaseOutput, updateCaseStatus, listCases, deleteCase, isValidStatusTransition } from '../cases';

// Minimal valid EngineInput for testing
const mockInput: EngineInput = {
  net_distributable_estate: { centavos: 1000000 },
  decedent: {
    id: 'p1',
    name: 'Juan dela Cruz',
    date_of_death: '2024-03-15',
    is_married: true,
    date_of_marriage: '1990-01-01',
    marriage_solemnized_in_articulo_mortis: false,
    was_ill_at_marriage: false,
    illness_caused_death: false,
    years_of_cohabitation: 34,
    has_legal_separation: false,
    is_illegitimate: false,
  },
  family_tree: [],
  will: null,
  donations: [],
  config: { retroactive_ra_11642: false, max_pipeline_restarts: 5 },
};

const mockOutput: EngineOutput = {
  per_heir_shares: [],
  narratives: [],
  computation_log: { steps: [], total_restarts: 0, final_scenario: 'I1' },
  warnings: [],
  succession_type: 'Intestate',
  scenario_code: 'I1',
};

describe('cases CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCase', () => {
    it('creates a case with correct fields from input and output', async () => {
      const queryMock = createQueryMock({
        data: { id: 'case-123' },
        error: null,
      });
      mockFrom.mockReturnValue(queryMock);

      const result = await createCase('user-1', 'org-1', mockInput, mockOutput);

      expect(mockFrom).toHaveBeenCalledWith('cases');
      expect(queryMock.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          org_id: 'org-1',
          title: 'Estate of Juan dela Cruz',
          status: 'computed',
          input_json: mockInput,
          output_json: mockOutput,
          decedent_name: 'Juan dela Cruz',
          date_of_death: '2024-03-15',
        }),
      );
      expect(result.id).toBe('case-123');
    });

    it('creates case with draft status when output is null', async () => {
      const queryMock = createQueryMock({
        data: { id: 'case-456' },
        error: null,
      });
      mockFrom.mockReturnValue(queryMock);

      await createCase('user-1', 'org-1', mockInput, null);

      expect(queryMock.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'draft',
        }),
      );
    });

    it('uses "Untitled Case" when input is null', async () => {
      const queryMock = createQueryMock({
        data: { id: 'case-789' },
        error: null,
      });
      mockFrom.mockReturnValue(queryMock);

      await createCase('user-1', 'org-1', null, null);

      expect(queryMock.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Untitled Case',
        }),
      );
    });

    it('throws on database error', async () => {
      const queryMock = createQueryMock({
        data: null,
        error: new Error('RLS violation'),
      });
      mockFrom.mockReturnValue(queryMock);

      await expect(createCase('user-1', 'org-1', mockInput, mockOutput)).rejects.toThrow('RLS violation');
    });
  });

  describe('loadCase', () => {
    it('returns full CaseRow', async () => {
      const mockCase = {
        id: 'case-123',
        org_id: 'org-1',
        user_id: 'user-1',
        client_id: null,
        title: 'Estate of Juan dela Cruz',
        status: 'computed',
        input_json: mockInput,
        output_json: mockOutput,
        tax_input_json: null,
        tax_output_json: null,
        comparison_input_json: null,
        comparison_output_json: null,
        comparison_ran_at: null,
        decedent_name: 'Juan dela Cruz',
        date_of_death: '2024-03-15',
        gross_estate: null,
        share_token: 'abc-def-123',
        share_enabled: false,
        notes_count: 0,
        created_at: '2024-03-15T00:00:00Z',
        updated_at: '2024-03-15T00:00:00Z',
      };

      const queryMock = createQueryMock({ data: mockCase, error: null });
      mockFrom.mockReturnValue(queryMock);

      const result = await loadCase('case-123');
      expect(mockFrom).toHaveBeenCalledWith('cases');
      expect(result.id).toBe('case-123');
      expect(result.status).toBe('computed');
      expect(result.input_json).toEqual(mockInput);
      expect(result.output_json).toEqual(mockOutput);
      expect(result.decedent_name).toBe('Juan dela Cruz');
    });

    it('throws when case not found', async () => {
      const queryMock = createQueryMock({
        data: null,
        error: new Error('Row not found'),
      });
      mockFrom.mockReturnValue(queryMock);

      await expect(loadCase('nonexistent')).rejects.toThrow('Row not found');
    });
  });

  describe('updateCaseInput', () => {
    it('updates input_json and denormalized fields', async () => {
      const queryMock = createQueryMock({ data: null, error: null });
      queryMock.eq = vi.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockReturnValue(queryMock);

      await updateCaseInput('case-123', mockInput);

      expect(queryMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          input_json: mockInput,
          decedent_name: 'Juan dela Cruz',
          date_of_death: '2024-03-15',
        }),
      );
      expect(queryMock.eq).toHaveBeenCalledWith('id', 'case-123');
    });
  });

  describe('updateCaseOutput', () => {
    it('updates output_json and sets status to computed', async () => {
      const queryMock = createQueryMock({ data: null, error: null });
      queryMock.eq = vi.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockReturnValue(queryMock);

      await updateCaseOutput('case-123', mockOutput);

      expect(queryMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          output_json: mockOutput,
          status: 'computed',
        }),
      );
    });
  });

  describe('listCases', () => {
    it('returns cases for org ordered by updated_at desc', async () => {
      const mockCases = [
        { id: 'c1', title: 'Case 1', status: 'draft', decedent_name: 'A', date_of_death: null, gross_estate: null, updated_at: '2024-03-15', notes_count: 0 },
        { id: 'c2', title: 'Case 2', status: 'computed', decedent_name: 'B', date_of_death: '2024-01-01', gross_estate: 5000000, updated_at: '2024-03-10', notes_count: 2 },
      ];

      const queryMock = createQueryMock({ data: null, error: null });
      queryMock.order = vi.fn().mockResolvedValue({ data: mockCases, error: null });
      mockFrom.mockReturnValue(queryMock);

      const result = await listCases('org-1');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('c1');
    });

    it('filters by status when provided', async () => {
      const orderFn = vi.fn().mockResolvedValue({ data: [], error: null });
      // eq returns an object with eq and order methods for chaining
      const eqMock: Record<string, ReturnType<typeof vi.fn>> = {};
      eqMock.eq = vi.fn().mockReturnValue({ order: orderFn });
      eqMock.order = orderFn;

      const queryMock = createQueryMock({ data: null, error: null });
      queryMock.eq = vi.fn().mockReturnValue(eqMock);
      mockFrom.mockReturnValue(queryMock);

      await listCases('org-1', 'draft');

      // First .eq call is for org_id, second is for status filter
      expect(queryMock.eq).toHaveBeenCalledWith('org_id', 'org-1');
      expect(eqMock.eq).toHaveBeenCalledWith('status', 'draft');
    });

    it('returns empty array when no cases exist', async () => {
      const queryMock = createQueryMock({ data: null, error: null });
      queryMock.order = vi.fn().mockResolvedValue({ data: [], error: null });
      mockFrom.mockReturnValue(queryMock);

      const result = await listCases('org-1');
      expect(result).toEqual([]);
    });
  });

  describe('deleteCase', () => {
    it('deletes case by id', async () => {
      const queryMock = createQueryMock({ data: null, error: null });
      queryMock.eq = vi.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockReturnValue(queryMock);

      await deleteCase('case-123');

      expect(mockFrom).toHaveBeenCalledWith('cases');
      expect(queryMock.delete).toHaveBeenCalled();
      expect(queryMock.eq).toHaveBeenCalledWith('id', 'case-123');
    });

    it('throws on delete error', async () => {
      const queryMock = createQueryMock({ data: null, error: null });
      queryMock.eq = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Permission denied'),
      });
      mockFrom.mockReturnValue(queryMock);

      await expect(deleteCase('case-123')).rejects.toThrow('Permission denied');
    });
  });

  describe('isValidStatusTransition', () => {
    it('draft → computed is valid', () => {
      expect(isValidStatusTransition('draft', 'computed')).toBe(true);
    });

    it('computed → finalized is valid', () => {
      expect(isValidStatusTransition('computed', 'finalized')).toBe(true);
    });

    it('finalized → archived is valid', () => {
      expect(isValidStatusTransition('finalized', 'archived')).toBe(true);
    });

    it('archived → finalized is valid (admin re-open)', () => {
      expect(isValidStatusTransition('archived', 'finalized')).toBe(true);
    });

    it('archived → draft is rejected', () => {
      expect(isValidStatusTransition('archived', 'draft')).toBe(false);
    });

    it('draft → finalized is rejected (must go through computed)', () => {
      expect(isValidStatusTransition('draft', 'finalized')).toBe(false);
    });

    it('computed → draft is rejected (no backwards)', () => {
      expect(isValidStatusTransition('computed', 'draft')).toBe(false);
    });

    it('finalized → draft is rejected', () => {
      expect(isValidStatusTransition('finalized', 'draft')).toBe(false);
    });
  });

  describe('VALID_STATUS_TRANSITIONS constant', () => {
    it('defines transitions for all four statuses', () => {
      expect(VALID_STATUS_TRANSITIONS).toHaveProperty('draft');
      expect(VALID_STATUS_TRANSITIONS).toHaveProperty('computed');
      expect(VALID_STATUS_TRANSITIONS).toHaveProperty('finalized');
      expect(VALID_STATUS_TRANSITIONS).toHaveProperty('archived');
    });

    it('draft can only transition to computed', () => {
      expect(VALID_STATUS_TRANSITIONS.draft).toEqual(['computed']);
    });

    it('archived can only transition to finalized', () => {
      expect(VALID_STATUS_TRANSITIONS.archived).toEqual(['finalized']);
    });
  });
});
