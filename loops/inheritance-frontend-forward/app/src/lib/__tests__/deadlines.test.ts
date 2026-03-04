import { describe, it, expect, vi, beforeEach } from 'vitest';

// --------------------------------------------------------------------------
// Mock supabase before importing
// --------------------------------------------------------------------------

const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

import {
  computeDeadlineStatus,
  generateAndSaveDeadlines,
  markDeadlineComplete,
  addCustomDeadline,
  listDeadlines,
  getCaseDeadlineSummaries,
} from '../deadlines';

// --------------------------------------------------------------------------
// Tests — computeDeadlineStatus
// --------------------------------------------------------------------------

describe('deadline > computeDeadlineStatus', () => {
  it('returns "done" when completedDate is not null', () => {
    const result = computeDeadlineStatus('2020-01-01', '2020-01-01');
    expect(result).toBe('done');
  });

  it('returns "done" even if due date is in the future', () => {
    const future = new Date();
    future.setDate(future.getDate() + 100);
    const result = computeDeadlineStatus(
      future.toISOString().slice(0, 10),
      '2026-01-01',
    );
    expect(result).toBe('done');
  });

  it('returns "overdue" when due date is in the past and not completed', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const result = computeDeadlineStatus(past.toISOString().slice(0, 10), null);
    expect(result).toBe('overdue');
  });

  it('returns "urgent" when due date is within 14 days', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);
    const result = computeDeadlineStatus(soon.toISOString().slice(0, 10), null);
    expect(result).toBe('urgent');
  });

  it('returns "urgent" when due date is exactly 14 days away', () => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    const result = computeDeadlineStatus(d.toISOString().slice(0, 10), null);
    expect(result).toBe('urgent');
  });

  it('returns "upcoming" when due date is 16 days away', () => {
    // Use 16 days because 15 can be boundary (time-of-day makes floor() = 14)
    const d = new Date();
    d.setDate(d.getDate() + 16);
    const result = computeDeadlineStatus(d.toISOString().slice(0, 10), null);
    expect(result).toBe('upcoming');
  });

  it('returns "upcoming" when due date is exactly 30 days away', () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const result = computeDeadlineStatus(d.toISOString().slice(0, 10), null);
    expect(result).toBe('upcoming');
  });

  it('returns "future" when due date is more than 30 days away', () => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    const result = computeDeadlineStatus(d.toISOString().slice(0, 10), null);
    expect(result).toBe('future');
  });

  it('returns "overdue" or "urgent" for today depending on time-of-day', () => {
    // Due date at midnight is before current time, so daysUntil rounds to 0 or -1
    const today = new Date().toISOString().slice(0, 10);
    const result = computeDeadlineStatus(today, null);
    expect(['overdue', 'urgent']).toContain(result);
  });
});

// --------------------------------------------------------------------------
// Tests — generateAndSaveDeadlines
// --------------------------------------------------------------------------

describe('deadline > generateAndSaveDeadlines', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates 9 milestones for EJS track', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await generateAndSaveDeadlines('case-1', 'user-1', '2026-01-15', 'ejs');

    expect(mockFrom).toHaveBeenCalledWith('case_deadlines');
    expect(mockUpsert).toHaveBeenCalledTimes(1);

    const [rows] = mockUpsert.mock.calls[0];
    expect(rows).toHaveLength(9);
  });

  it('generates 4 milestones for judicial track', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await generateAndSaveDeadlines('case-1', 'user-1', '2026-01-15', 'judicial');

    const [rows] = mockUpsert.mock.calls[0];
    expect(rows).toHaveLength(4);
  });

  it('calculates correct due dates from DOD + offset_days', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await generateAndSaveDeadlines('case-1', 'user-1', '2026-01-15', 'ejs');

    const [rows] = mockUpsert.mock.calls[0];
    // First EJS milestone is offset_days=7 → 2026-01-22
    expect(rows[0].due_date).toBe('2026-01-22');
    // Second EJS milestone is offset_days=30 → 2026-02-14
    expect(rows[1].due_date).toBe('2026-02-14');
  });

  it('sets is_auto=true for generated milestones', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await generateAndSaveDeadlines('case-1', 'user-1', '2026-01-15', 'ejs');

    const [rows] = mockUpsert.mock.calls[0];
    rows.forEach((row: Record<string, unknown>) => {
      expect(row.is_auto).toBe(true);
    });
  });

  it('uses milestone_key format "{track}-{index}"', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await generateAndSaveDeadlines('case-1', 'user-1', '2026-01-15', 'ejs');

    const [rows] = mockUpsert.mock.calls[0];
    expect(rows[0].milestone_key).toBe('ejs-0');
    expect(rows[1].milestone_key).toBe('ejs-1');
    expect(rows[8].milestone_key).toBe('ejs-8');
  });

  it('passes case_id and user_id to all rows', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await generateAndSaveDeadlines('case-42', 'user-7', '2026-01-15', 'ejs');

    const [rows] = mockUpsert.mock.calls[0];
    rows.forEach((row: Record<string, unknown>) => {
      expect(row.case_id).toBe('case-42');
      expect(row.user_id).toBe('user-7');
    });
  });

  it('upserts on conflict (case_id, milestone_key)', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await generateAndSaveDeadlines('case-1', 'user-1', '2026-01-15', 'ejs');

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.any(Array),
      { onConflict: 'case_id,milestone_key' },
    );
  });

  it('throws on supabase error', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({
      error: { message: 'upsert failed' },
    });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await expect(
      generateAndSaveDeadlines('case-1', 'user-1', '2026-01-15', 'ejs'),
    ).rejects.toEqual({ message: 'upsert failed' });
  });

  it('includes label and description from milestone seeds', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await generateAndSaveDeadlines('case-1', 'user-1', '2026-01-15', 'ejs');

    const [rows] = mockUpsert.mock.calls[0];
    expect(rows[0].label).toBe('Secure PSA Death Certificate');
    expect(rows[0].description).toContain('PSA death certificate');
  });
});

// --------------------------------------------------------------------------
// Tests — markDeadlineComplete
// --------------------------------------------------------------------------

describe('deadline > markDeadlineComplete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates completed_date for the deadline', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });

    await markDeadlineComplete('dl-1', '2026-03-01');

    expect(mockFrom).toHaveBeenCalledWith('case_deadlines');
    expect(mockUpdate).toHaveBeenCalledWith({ completed_date: '2026-03-01' });
    expect(mockEq).toHaveBeenCalledWith('id', 'dl-1');
  });

  it('includes note when provided', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });

    await markDeadlineComplete('dl-1', '2026-03-01', 'Filed at RDO 40');

    expect(mockUpdate).toHaveBeenCalledWith({
      completed_date: '2026-03-01',
      note: 'Filed at RDO 40',
    });
  });

  it('throws on supabase error', async () => {
    const mockEq = vi.fn().mockResolvedValue({
      error: { message: 'update failed' },
    });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });

    await expect(
      markDeadlineComplete('dl-1', '2026-03-01'),
    ).rejects.toEqual({ message: 'update failed' });
  });
});

// --------------------------------------------------------------------------
// Tests — addCustomDeadline
// --------------------------------------------------------------------------

describe('deadline > addCustomDeadline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a custom deadline with is_auto=false', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'dl-new', is_auto: false },
      error: null,
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const result = await addCustomDeadline('case-1', 'user-1', {
      label: 'Custom milestone',
      due_date: '2026-06-01',
      description: 'A custom deadline',
    });

    expect(mockFrom).toHaveBeenCalledWith('case_deadlines');
    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg.is_auto).toBe(false);
    expect(insertArg.label).toBe('Custom milestone');
    expect(insertArg.case_id).toBe('case-1');
    expect(insertArg.user_id).toBe('user-1');
    expect(result.id).toBe('dl-new');
  });

  it('uses "custom-{timestamp}" as milestone_key', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: 'dl-new' },
      error: null,
    });
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });

    await addCustomDeadline('case-1', 'user-1', {
      label: 'Test',
      due_date: '2026-06-01',
      description: 'Test desc',
    });

    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg.milestone_key).toMatch(/^custom-\d+$/);
  });
});

// --------------------------------------------------------------------------
// Tests — listDeadlines
// --------------------------------------------------------------------------

describe('deadline > listDeadlines', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries case_deadlines by case_id ordered by due_date', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: [{ id: 'dl-1' }, { id: 'dl-2' }],
      error: null,
    });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const result = await listDeadlines('case-1');

    expect(mockFrom).toHaveBeenCalledWith('case_deadlines');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('case_id', 'case-1');
    expect(mockOrder).toHaveBeenCalledWith('due_date', { ascending: true });
    expect(result).toHaveLength(2);
  });

  it('returns empty array when no deadlines exist', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const result = await listDeadlines('case-empty');
    expect(result).toEqual([]);
  });
});

// --------------------------------------------------------------------------
// Tests — getCaseDeadlineSummaries
// --------------------------------------------------------------------------

describe('deadline > getCaseDeadlineSummaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the get_case_deadline_summaries RPC with case IDs', async () => {
    mockRpc.mockResolvedValue({
      data: [
        {
          case_id: 'c-1',
          total_milestones: 9,
          completed_milestones: 3,
          most_urgent_label: 'File BIR Estate Tax Return',
          days_until_most_urgent: 45,
        },
      ],
      error: null,
    });

    const result = await getCaseDeadlineSummaries(['c-1', 'c-2']);

    expect(mockRpc).toHaveBeenCalledWith('get_case_deadline_summaries', {
      p_case_ids: ['c-1', 'c-2'],
    });
    expect(result).toHaveLength(1);
    expect(result[0].total_milestones).toBe(9);
  });
});
