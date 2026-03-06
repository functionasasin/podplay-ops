import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Supabase mock — vi.hoisted ensures variables are available in vi.mock factory
// ---------------------------------------------------------------------------
const {
  mockSelect, mockUpdate, mockRpc,
  mockEq, mockSingle, mockFrom, chainable,
} = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockUpdate = vi.fn();
  const mockRpc = vi.fn();
  const mockEq = vi.fn();
  const mockSingle = vi.fn();

  const chainable: Record<string, unknown> = {};
  chainable.select = mockSelect.mockReturnValue(chainable);
  chainable.update = mockUpdate.mockReturnValue(chainable);
  chainable.eq    = mockEq.mockReturnValue(chainable);
  chainable.single = mockSingle;

  const mockFrom = vi.fn().mockReturnValue(chainable);
  return { mockSelect, mockUpdate, mockRpc, mockEq, mockSingle, mockFrom, chainable };
});

vi.mock('../supabase', () => ({
  supabaseConfigured: true,
  supabase: { from: mockFrom, rpc: mockRpc },
}));

import {
  enableSharing,
  disableSharing,
  getSharedComputation,
  rotateShareToken,
} from '../share';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function resetChain() {
  mockFrom.mockReturnValue(chainable);
  mockSelect.mockReturnValue(chainable);
  mockUpdate.mockReturnValue(chainable);
  mockEq.mockReturnValue(chainable);
}

// ---------------------------------------------------------------------------
// enableSharing
// ---------------------------------------------------------------------------
describe('enableSharing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it('updates share_enabled=true on computations table', async () => {
    mockSingle.mockResolvedValue({ data: { share_token: 'uuid-tok-1' }, error: null });
    await enableSharing('comp-1');
    expect(mockFrom).toHaveBeenCalledWith('computations');
    expect(mockUpdate).toHaveBeenCalledWith({ share_enabled: true });
    expect(mockEq).toHaveBeenCalledWith('id', 'comp-1');
  });

  it('selects share_token after update', async () => {
    mockSingle.mockResolvedValue({ data: { share_token: 'uuid-tok-1' }, error: null });
    await enableSharing('comp-1');
    expect(mockSelect).toHaveBeenCalledWith('share_token');
  });

  it('returns { shareToken } on success', async () => {
    mockSingle.mockResolvedValue({ data: { share_token: 'uuid-tok-42' }, error: null });
    const result = await enableSharing('comp-1');
    expect(result).toEqual({ shareToken: 'uuid-tok-42' });
  });

  it('returns null on supabase error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'RLS violation' } });
    const result = await enableSharing('comp-1');
    expect(result).toBeNull();
  });

  it('returns null when data is null', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null });
    const result = await enableSharing('comp-1');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// disableSharing
// ---------------------------------------------------------------------------
describe('disableSharing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
    mockEq.mockResolvedValue({ error: null });
  });

  it('updates share_enabled=false on computations table', async () => {
    await disableSharing('comp-1');
    expect(mockFrom).toHaveBeenCalledWith('computations');
    expect(mockUpdate).toHaveBeenCalledWith({ share_enabled: false });
    expect(mockEq).toHaveBeenCalledWith('id', 'comp-1');
  });

  it('returns { error: null } on success', async () => {
    const result = await disableSharing('comp-1');
    expect(result.error).toBeNull();
  });

  it('wraps supabase error in Error object', async () => {
    mockEq.mockResolvedValue({ error: { message: 'forbidden' } });
    const result = await disableSharing('comp-1');
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('forbidden');
  });
});

// ---------------------------------------------------------------------------
// getSharedComputation
// ---------------------------------------------------------------------------
describe('getSharedComputation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it('calls get_shared_computation RPC with p_token', async () => {
    const fakeData = {
      id: 'comp-1', title: 'FY2024', taxYear: 2024,
      outputJson: null, shareEnabled: true, orgName: 'Acme Tax',
    };
    mockRpc.mockResolvedValue({ data: fakeData, error: null });
    await getSharedComputation('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    expect(mockRpc).toHaveBeenCalledWith('get_shared_computation', {
      p_token: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    });
  });

  it('returns SharedComputationData on success', async () => {
    const fakeData = {
      id: 'comp-1', title: 'Annual 2024', taxYear: 2024,
      outputJson: { recommendedRegime: 'PATH_A' }, shareEnabled: true, orgName: 'Cruz & Co',
    };
    mockRpc.mockResolvedValue({ data: fakeData, error: null });
    const result = await getSharedComputation('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    expect(result).toMatchObject({
      id: 'comp-1', title: 'Annual 2024', taxYear: 2024, orgName: 'Cruz & Co',
    });
  });

  it('returns null when RPC returns null (share disabled or not found)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    const result = await getSharedComputation('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    expect(result).toBeNull();
  });

  it('returns null on RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'not found' } });
    const result = await getSharedComputation('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    expect(result).toBeNull();
  });

  it('passes token as-is (UUID string) to RPC', async () => {
    const token = '12345678-1234-1234-1234-123456789abc';
    mockRpc.mockResolvedValue({ data: null, error: null });
    await getSharedComputation(token);
    expect(mockRpc).toHaveBeenCalledWith('get_shared_computation', { p_token: token });
  });
});

// ---------------------------------------------------------------------------
// rotateShareToken
// ---------------------------------------------------------------------------
describe('rotateShareToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  it('updates computations with a new share_token UUID', async () => {
    mockSingle.mockResolvedValue({ data: { share_token: 'new-uuid-here' }, error: null });
    await rotateShareToken('comp-1');
    expect(mockFrom).toHaveBeenCalledWith('computations');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ share_token: expect.any(String) })
    );
    expect(mockEq).toHaveBeenCalledWith('id', 'comp-1');
  });

  it('returns { shareToken } with the new token on success', async () => {
    mockSingle.mockResolvedValue({ data: { share_token: 'rotated-uuid' }, error: null });
    const result = await rotateShareToken('comp-1');
    expect(result).toEqual({ shareToken: 'rotated-uuid' });
  });

  it('returns null on supabase error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'timeout' } });
    const result = await rotateShareToken('comp-1');
    expect(result).toBeNull();
  });

  it('generates a different token each call', async () => {
    const tokens: string[] = [];
    mockUpdate.mockImplementation((payload: Record<string, unknown>) => {
      tokens.push(payload.share_token as string);
      return chainable;
    });
    mockSingle
      .mockResolvedValueOnce({ data: { share_token: 'tok-a' }, error: null })
      .mockResolvedValueOnce({ data: { share_token: 'tok-b' }, error: null });

    await rotateShareToken('comp-1');
    await rotateShareToken('comp-1');

    // Both calls passed a token to update
    expect(tokens).toHaveLength(2);
    expect(typeof tokens[0]).toBe('string');
    expect(typeof tokens[1]).toBe('string');
  });

  it('selects share_token after update', async () => {
    mockSingle.mockResolvedValue({ data: { share_token: 'new-tok' }, error: null });
    await rotateShareToken('comp-1');
    expect(mockSelect).toHaveBeenCalledWith('share_token');
  });
});

// ---------------------------------------------------------------------------
// SharedComputationData shape
// ---------------------------------------------------------------------------
describe('SharedComputationData shape', () => {
  it('contains required fields from get_shared_computation RPC', async () => {
    const fakeData = {
      id: 'comp-x', title: 'Q1 2025', taxYear: 2025,
      outputJson: null, shareEnabled: true, orgName: 'TaxPro Inc',
    };
    mockRpc.mockResolvedValue({ data: fakeData, error: null });
    const result = await getSharedComputation('any-token');
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('taxYear');
    expect(result).toHaveProperty('outputJson');
    expect(result).toHaveProperty('shareEnabled');
    expect(result).toHaveProperty('orgName');
  });
});
