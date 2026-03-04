import { describe, it, expect, vi, beforeEach } from 'vitest';

// Build a chain-style mock for supabase query builder
function createQueryMock(resolvedValue: { data: unknown; error: unknown }) {
  const mock: Record<string, ReturnType<typeof vi.fn>> = {};
  const terminal = vi.fn().mockResolvedValue(resolvedValue);

  mock.single = terminal;
  mock.select = vi.fn().mockReturnValue(mock);
  mock.insert = vi.fn().mockReturnValue(mock);
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

import { addNote, deleteNote, listNotes } from '../case-notes';

describe('case-notes CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addNote', () => {
    it('inserts note with correct case_id, user_id, and content', async () => {
      const savedNote = {
        id: 'note-1',
        case_id: 'case-123',
        user_id: 'user-1',
        content: 'Filed BIR Form 1904 at RDO 40.',
        created_at: '2026-03-01T14:15:00Z',
      };
      const queryMock = createQueryMock({ data: savedNote, error: null });
      mockFrom.mockReturnValue(queryMock);

      const result = await addNote('case-123', 'user-1', 'Filed BIR Form 1904 at RDO 40.');

      expect(mockFrom).toHaveBeenCalledWith('case_notes');
      expect(queryMock.insert).toHaveBeenCalledWith({
        case_id: 'case-123',
        user_id: 'user-1',
        content: 'Filed BIR Form 1904 at RDO 40.',
      });
      expect(queryMock.select).toHaveBeenCalledWith('*');
      expect(result.id).toBe('note-1');
      expect(result.content).toBe('Filed BIR Form 1904 at RDO 40.');
    });

    it('trims whitespace from content before saving', async () => {
      const savedNote = {
        id: 'note-2',
        case_id: 'case-123',
        user_id: 'user-1',
        content: 'Trimmed content',
        created_at: '2026-03-01T14:15:00Z',
      };
      const queryMock = createQueryMock({ data: savedNote, error: null });
      mockFrom.mockReturnValue(queryMock);

      await addNote('case-123', 'user-1', '  Trimmed content  ');

      expect(queryMock.insert).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Trimmed content' }),
      );
    });

    it('rejects empty note (min 1 char)', async () => {
      await expect(addNote('case-123', 'user-1', '')).rejects.toThrow(
        'Note content cannot be empty',
      );
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('rejects whitespace-only note', async () => {
      await expect(addNote('case-123', 'user-1', '   ')).rejects.toThrow(
        'Note content cannot be empty',
      );
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('throws on database error', async () => {
      const queryMock = createQueryMock({
        data: null,
        error: new Error('RLS violation'),
      });
      mockFrom.mockReturnValue(queryMock);

      await expect(
        addNote('case-123', 'user-1', 'Some content'),
      ).rejects.toThrow('RLS violation');
    });

    it('returns full CaseNote with all fields', async () => {
      const savedNote = {
        id: 'note-3',
        case_id: 'case-456',
        user_id: 'user-2',
        content: 'Client confirmed **3 real properties** in Makati.',
        created_at: '2026-02-28T16:00:00Z',
      };
      const queryMock = createQueryMock({ data: savedNote, error: null });
      mockFrom.mockReturnValue(queryMock);

      const result = await addNote(
        'case-456',
        'user-2',
        'Client confirmed **3 real properties** in Makati.',
      );

      expect(result).toEqual(savedNote);
    });
  });

  describe('deleteNote', () => {
    it('deletes note by id', async () => {
      const queryMock = createQueryMock({ data: null, error: null });
      queryMock.eq = vi.fn().mockResolvedValue({ data: null, error: null });
      mockFrom.mockReturnValue(queryMock);

      await deleteNote('note-1');

      expect(mockFrom).toHaveBeenCalledWith('case_notes');
      expect(queryMock.delete).toHaveBeenCalled();
      expect(queryMock.eq).toHaveBeenCalledWith('id', 'note-1');
    });

    it('throws on delete error', async () => {
      const queryMock = createQueryMock({ data: null, error: null });
      queryMock.eq = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Permission denied'),
      });
      mockFrom.mockReturnValue(queryMock);

      await expect(deleteNote('note-1')).rejects.toThrow('Permission denied');
    });
  });

  describe('listNotes', () => {
    it('returns notes for case ordered by created_at desc', async () => {
      const mockNotes = [
        {
          id: 'note-2',
          case_id: 'case-123',
          user_id: 'user-1',
          content: 'Second note',
          created_at: '2026-03-02T10:00:00Z',
        },
        {
          id: 'note-1',
          case_id: 'case-123',
          user_id: 'user-1',
          content: 'First note',
          created_at: '2026-03-01T10:00:00Z',
        },
      ];
      const queryMock = createQueryMock({ data: null, error: null });
      queryMock.order = vi.fn().mockResolvedValue({ data: mockNotes, error: null });
      mockFrom.mockReturnValue(queryMock);

      const result = await listNotes('case-123');

      expect(mockFrom).toHaveBeenCalledWith('case_notes');
      expect(queryMock.select).toHaveBeenCalledWith('*');
      expect(queryMock.eq).toHaveBeenCalledWith('case_id', 'case-123');
      expect(queryMock.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('note-2');
      expect(result[1].id).toBe('note-1');
    });

    it('returns empty array when no notes exist', async () => {
      const queryMock = createQueryMock({ data: null, error: null });
      queryMock.order = vi.fn().mockResolvedValue({ data: [], error: null });
      mockFrom.mockReturnValue(queryMock);

      const result = await listNotes('case-123');
      expect(result).toEqual([]);
    });

    it('throws on database error', async () => {
      const queryMock = createQueryMock({ data: null, error: null });
      queryMock.order = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Connection failed'),
      });
      mockFrom.mockReturnValue(queryMock);

      await expect(listNotes('case-123')).rejects.toThrow('Connection failed');
    });
  });
});
