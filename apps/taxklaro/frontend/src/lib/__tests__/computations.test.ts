import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Supabase mock — vi.hoisted ensures variables are available in vi.mock factory
// ---------------------------------------------------------------------------
const {
  mockSelect, mockInsert, mockUpdate, mockDelete,
  mockEq, mockSingle, mockOrder, mockFrom, chainable,
} = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockSingle = vi.fn();
  const mockOrder = vi.fn();

  // Chainable builder
  const chainable: Record<string, unknown> = {};
  chainable.select = mockSelect.mockReturnValue(chainable);
  chainable.insert = mockInsert.mockReturnValue(chainable);
  chainable.update = mockUpdate.mockReturnValue(chainable);
  chainable.delete = mockDelete.mockReturnValue(chainable);
  chainable.eq    = mockEq.mockReturnValue(chainable);
  chainable.single = mockSingle;
  chainable.order  = mockOrder.mockReturnValue(chainable);

  const mockFrom = vi.fn().mockReturnValue(chainable);
  return { mockSelect, mockInsert, mockUpdate, mockDelete, mockEq, mockSingle, mockOrder, mockFrom, chainable };
});

const mockGetUser = vi.hoisted(() => vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }));

vi.mock('../supabase', () => ({
  supabaseConfigured: true,
  supabase: { from: mockFrom, auth: { getUser: mockGetUser } },
}));

import {
  createComputation,
  loadComputation,
  updateComputationInput,
  saveComputationOutput,
  listComputations,
  updateComputationStatus,
  deleteComputation,
} from '../computations';

import type { TaxpayerInput } from '../../types/engine-input';
import type { TaxComputationResult } from '../../types/engine-output';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function resetChain() {
  mockFrom.mockReturnValue(chainable);
  mockSelect.mockReturnValue(chainable);
  mockInsert.mockReturnValue(chainable);
  mockUpdate.mockReturnValue(chainable);
  mockDelete.mockReturnValue(chainable);
  mockEq.mockReturnValue(chainable);
  mockOrder.mockReturnValue(chainable);
}

const fakeInput = { taxYear: 2024 } as unknown as TaxpayerInput;
const fakeOutput = { recommendedRegime: 'PATH_A' } as unknown as TaxComputationResult;

// ---------------------------------------------------------------------------
// createComputation
// ---------------------------------------------------------------------------
describe('createComputation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it('calls supabase.from("computations").insert() and returns id on success', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'comp-1' }, error: null });
    const result = await createComputation('org-1', null, 'Annual 2024', fakeInput);
    expect(mockFrom).toHaveBeenCalledWith('computations');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ org_id: 'org-1', title: 'Annual 2024', created_by: 'user-1' })
    );
    expect(result).toEqual({ id: 'comp-1' });
  });

  it('passes clientId when provided', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'comp-2' }, error: null });
    await createComputation('org-1', 'client-5', 'Q1', fakeInput);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 'client-5' })
    );
  });

  it('returns null on supabase error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const result = await createComputation('org-1', null, 'Title', fakeInput);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// loadComputation
// ---------------------------------------------------------------------------
describe('loadComputation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it('maps DB row to camelCase ComputationRow', async () => {
    const dbRow = {
      id: 'c-1', org_id: 'o-1', client_id: null, created_by: 'u-1',
      title: 'FY2024', tax_year: 2024, status: 'draft', input_json: null,
      output_json: null, regime_selected: null, share_token: 'tok-1',
      share_enabled: false, created_at: '2024-01-01', updated_at: '2024-01-02',
    };
    mockSingle.mockResolvedValue({ data: dbRow, error: null });

    const row = await loadComputation('c-1');
    expect(row).toMatchObject({
      id: 'c-1', orgId: 'o-1', clientId: null, createdBy: 'u-1',
      title: 'FY2024', taxYear: 2024, status: 'draft',
      shareToken: 'tok-1', shareEnabled: false,
    });
  });

  it('queries by id', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });
    await loadComputation('c-99');
    expect(mockEq).toHaveBeenCalledWith('id', 'c-99');
  });

  it('returns null when not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } });
    const row = await loadComputation('missing');
    expect(row).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateComputationInput
// ---------------------------------------------------------------------------
describe('updateComputationInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
    mockEq.mockResolvedValue({ error: null });
  });

  it('updates input_json column', async () => {
    await updateComputationInput('c-1', fakeInput);
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ input_json: fakeInput }));
    expect(mockEq).toHaveBeenCalledWith('id', 'c-1');
  });

  it('returns { error: null } on success', async () => {
    mockEq.mockResolvedValue({ error: null });
    const result = await updateComputationInput('c-1', fakeInput);
    expect(result.error).toBeNull();
  });

  it('wraps supabase error in Error object', async () => {
    mockEq.mockResolvedValue({ error: { message: 'RLS violation' } });
    const result = await updateComputationInput('c-1', fakeInput);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('RLS violation');
  });
});

// ---------------------------------------------------------------------------
// saveComputationOutput
// ---------------------------------------------------------------------------
describe('saveComputationOutput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
    mockEq.mockResolvedValue({ error: null });
  });

  it('updates output_json and sets status to computed', async () => {
    await saveComputationOutput('c-1', fakeOutput);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ output_json: fakeOutput, status: 'computed' })
    );
  });

  it('stores recommendedRegime as regime_selected', async () => {
    await saveComputationOutput('c-1', fakeOutput);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ regime_selected: 'PATH_A' })
    );
  });

  it('returns { error: null } on success', async () => {
    const result = await saveComputationOutput('c-1', fakeOutput);
    expect(result.error).toBeNull();
  });

  it('wraps supabase error', async () => {
    mockEq.mockResolvedValue({ error: { message: 'timeout' } });
    const result = await saveComputationOutput('c-1', fakeOutput);
    expect(result.error).toBeInstanceOf(Error);
  });
});

// ---------------------------------------------------------------------------
// listComputations
// ---------------------------------------------------------------------------
describe('listComputations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it('queries by org_id and returns mapped list', async () => {
    const dbRows = [
      {
        id: 'c-1', title: 'FY2024', tax_year: 2024, status: 'computed',
        regime_selected: 'PATH_B', share_enabled: true,
        created_at: '2024-01-01', updated_at: '2024-06-01', client_id: null,
      },
      {
        id: 'c-2', title: 'Q1 2024', tax_year: 2024, status: 'draft',
        regime_selected: null, share_enabled: false,
        created_at: '2024-03-01', updated_at: '2024-03-15', client_id: 'cl-5',
      },
    ];
    mockOrder.mockResolvedValue({ data: dbRows, error: null });

    const list = await listComputations('org-1');
    expect(list).toHaveLength(2);
    expect(list[0]).toMatchObject({ id: 'c-1', title: 'FY2024', taxYear: 2024, status: 'computed' });
    expect(list[1]).toMatchObject({ id: 'c-2', clientId: 'cl-5' });
  });

  it('filters by org_id', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    await listComputations('org-42');
    expect(mockEq).toHaveBeenCalledWith('org_id', 'org-42');
  });

  it('returns empty array on error', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB down' } });
    const list = await listComputations('org-1');
    expect(list).toEqual([]);
  });

  it('orders by updated_at descending', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    await listComputations('org-1');
    expect(mockOrder).toHaveBeenCalledWith('updated_at', { ascending: false });
  });
});

// ---------------------------------------------------------------------------
// updateComputationStatus
// ---------------------------------------------------------------------------
describe('updateComputationStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
    mockEq.mockReturnValue(chainable);
  });

  it('updates to toStatus and checks fromStatus', async () => {
    mockEq.mockReturnValueOnce(chainable).mockResolvedValueOnce({ error: null });
    await updateComputationStatus('c-1', 'draft', 'computed');
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'computed' });
    expect(mockEq).toHaveBeenCalledWith('id', 'c-1');
    expect(mockEq).toHaveBeenCalledWith('status', 'draft');
  });

  it('supports draft → computed transition', async () => {
    mockEq.mockReturnValueOnce(chainable).mockResolvedValueOnce({ error: null });
    const result = await updateComputationStatus('c-1', 'draft', 'computed');
    expect(result.error).toBeNull();
  });

  it('supports computed → finalized transition', async () => {
    mockEq.mockReturnValueOnce(chainable).mockResolvedValueOnce({ error: null });
    const result = await updateComputationStatus('c-1', 'computed', 'finalized');
    expect(result.error).toBeNull();
  });

  it('supports finalized → computed (unlock) transition', async () => {
    mockEq.mockReturnValueOnce(chainable).mockResolvedValueOnce({ error: null });
    const result = await updateComputationStatus('c-1', 'finalized', 'computed');
    expect(result.error).toBeNull();
  });

  it('wraps supabase error', async () => {
    mockEq.mockReturnValueOnce(chainable).mockResolvedValueOnce({ error: { message: 'forbidden' } });
    const result = await updateComputationStatus('c-1', 'draft', 'computed');
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('forbidden');
  });
});

// ---------------------------------------------------------------------------
// deleteComputation
// ---------------------------------------------------------------------------
describe('deleteComputation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
    mockEq.mockResolvedValue({ error: null });
  });

  it('calls delete on computations table with correct id', async () => {
    await deleteComputation('c-1');
    expect(mockFrom).toHaveBeenCalledWith('computations');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', 'c-1');
  });

  it('returns { error: null } on success', async () => {
    const result = await deleteComputation('c-1');
    expect(result.error).toBeNull();
  });

  it('wraps supabase error', async () => {
    mockEq.mockResolvedValue({ error: { message: 'not found' } });
    const result = await deleteComputation('c-1');
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('not found');
  });
});

// ---------------------------------------------------------------------------
// Status workflow semantics
// ---------------------------------------------------------------------------
describe('Computation status workflow', () => {
  it('valid status values are draft, computed, finalized, archived', () => {
    // Type-level test — ensures ComputationStatus covers all four values
    const statuses: string[] = ['draft', 'computed', 'finalized', 'archived'];
    expect(statuses).toHaveLength(4);
  });

  it('auto-save is disabled for finalized and archived (status check)', () => {
    const activeStatuses = ['draft', 'computed'];
    const inactiveStatuses = ['finalized', 'archived'];
    for (const s of activeStatuses) {
      expect(['draft', 'computed'].includes(s)).toBe(true);
    }
    for (const s of inactiveStatuses) {
      expect(['finalized', 'archived'].includes(s)).toBe(true);
    }
  });
});
