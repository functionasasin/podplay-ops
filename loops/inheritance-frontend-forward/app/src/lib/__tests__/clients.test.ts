import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ClientRow, ClientListItem, CreateClientData } from '@/types/client';

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
  mock.ilike = vi.fn().mockReturnValue(mock);
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

import { createClient, loadClient, updateClient, listClients, deleteClient } from '../clients';

const mockClientData: CreateClientData = {
  org_id: 'org-1',
  full_name: 'Santos, Maria Cristina',
  nickname: 'Cristina',
  email: 'maria@example.com',
  tin: '123-456-789',
  civil_status: 'married',
  intake_date: '2026-03-01',
  created_by: 'user-1',
};

const mockClientRow: ClientRow = {
  id: 'client-1',
  org_id: 'org-1',
  full_name: 'Santos, Maria Cristina',
  nickname: 'Cristina',
  date_of_birth: '1985-06-15',
  place_of_birth: 'Manila',
  email: 'maria@example.com',
  phone: '+639171234567',
  address: '123 Main St, Makati City',
  tin: '123-456-789',
  gov_id_type: 'philsys_id',
  gov_id_number: 'PSN-1234567890',
  civil_status: 'married',
  status: 'active',
  intake_date: '2026-03-01',
  referral_source: 'Referral from Atty. Garcia',
  conflict_cleared: true,
  conflict_notes: null,
  created_by: 'user-1',
  created_at: '2026-03-01T00:00:00Z',
  updated_at: '2026-03-01T00:00:00Z',
};

describe('client CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createClient', () => {
    it('creates a client with correct fields', async () => {
      const queryMock = createQueryMock({
        data: { id: 'client-123' },
        error: null,
      });
      mockFrom.mockReturnValue(queryMock);

      const result = await createClient(mockClientData);

      expect(mockFrom).toHaveBeenCalledWith('clients');
      expect(queryMock.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          org_id: 'org-1',
          full_name: 'Santos, Maria Cristina',
          tin: '123-456-789',
          intake_date: '2026-03-01',
        }),
      );
      expect(result.id).toBe('client-123');
    });

    it('throws on supabase error', async () => {
      const queryMock = createQueryMock({
        data: null,
        error: new Error('DB error'),
      });
      mockFrom.mockReturnValue(queryMock);

      await expect(createClient(mockClientData)).rejects.toThrow();
    });
  });

  describe('loadClient', () => {
    it('returns full ClientRow', async () => {
      const queryMock = createQueryMock({
        data: mockClientRow,
        error: null,
      });
      mockFrom.mockReturnValue(queryMock);

      const result = await loadClient('client-1');

      expect(mockFrom).toHaveBeenCalledWith('clients');
      expect(queryMock.eq).toHaveBeenCalledWith('id', 'client-1');
      expect(result).toEqual(mockClientRow);
    });

    it('throws when client not found', async () => {
      const queryMock = createQueryMock({
        data: null,
        error: new Error('Not found'),
      });
      mockFrom.mockReturnValue(queryMock);

      await expect(loadClient('nonexistent')).rejects.toThrow();
    });
  });

  describe('updateClient', () => {
    it('updates client fields', async () => {
      const queryMock = createQueryMock({
        data: null,
        error: null,
      });
      mockFrom.mockReturnValue(queryMock);

      await updateClient('client-1', { full_name: 'Santos, Maria C.' });

      expect(mockFrom).toHaveBeenCalledWith('clients');
      expect(queryMock.update).toHaveBeenCalledWith(
        expect.objectContaining({ full_name: 'Santos, Maria C.' }),
      );
      expect(queryMock.eq).toHaveBeenCalledWith('id', 'client-1');
    });
  });

  describe('listClients', () => {
    it('returns clients for org', async () => {
      const mockList: ClientListItem[] = [
        {
          id: 'client-1',
          full_name: 'Santos, Maria Cristina',
          tin: '123-456-789',
          status: 'active',
          intake_date: '2026-03-01',
          conflict_cleared: true,
          case_count: 3,
        },
        {
          id: 'client-2',
          full_name: 'dela Cruz, Juan Roberto',
          tin: '456-789-012',
          status: 'active',
          intake_date: '2026-02-15',
          conflict_cleared: false,
          case_count: 1,
        },
      ];

      const queryMock = createQueryMock({
        data: mockList,
        error: null,
      });
      mockFrom.mockReturnValue(queryMock);

      const result = await listClients('org-1');

      expect(mockFrom).toHaveBeenCalledWith('clients');
      expect(result).toHaveLength(2);
      expect(result[0].full_name).toBe('Santos, Maria Cristina');
    });

    it('respects status filter', async () => {
      const queryMock = createQueryMock({
        data: [],
        error: null,
      });
      mockFrom.mockReturnValue(queryMock);

      await listClients('org-1', 'active');

      expect(queryMock.eq).toHaveBeenCalledWith('org_id', 'org-1');
      expect(queryMock.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('applies search query via ilike', async () => {
      const queryMock = createQueryMock({
        data: [],
        error: null,
      });
      mockFrom.mockReturnValue(queryMock);

      await listClients('org-1', undefined, 'Santos');

      expect(queryMock.ilike).toHaveBeenCalledWith('full_name', '%Santos%');
    });
  });

  describe('deleteClient', () => {
    it('deletes client by id', async () => {
      const queryMock = createQueryMock({
        data: null,
        error: null,
      });
      mockFrom.mockReturnValue(queryMock);

      await deleteClient('client-1');

      expect(mockFrom).toHaveBeenCalledWith('clients');
      expect(queryMock.delete).toHaveBeenCalled();
      expect(queryMock.eq).toHaveBeenCalledWith('id', 'client-1');
    });
  });
});
