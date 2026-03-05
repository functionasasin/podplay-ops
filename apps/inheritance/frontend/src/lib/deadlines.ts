/**
 * Deadline Tracker functions (§4.20)
 * Source: docs/plans/inheritance-premium-spec.md §4.20
 */

import { supabase } from './supabase';
import { getSettlementMilestones } from './intake';
import type { DeadlineStatus, CaseDeadline } from '@/types';
import type { SettlementTrack } from '@/types/intake';

/**
 * Compute the status of a deadline based on its due date and completion.
 * This is a client-side computation — status is never stored in the database.
 */
export function computeDeadlineStatus(
  dueDate: string,
  completedDate: string | null,
): DeadlineStatus {
  if (completedDate !== null) return 'done';
  const daysUntil = Math.floor(
    (new Date(dueDate).getTime() - new Date().getTime()) / 86_400_000,
  );
  if (daysUntil < 0) return 'overdue';
  if (daysUntil <= 14) return 'urgent';
  if (daysUntil <= 30) return 'upcoming';
  return 'future';
}

/**
 * Generate and save deadlines for a case. Uses upsert to preserve
 * completed_date and note when recalculating due_date on DOD change.
 */
export async function generateAndSaveDeadlines(
  caseId: string,
  userId: string,
  dateOfDeath: string,
  track: SettlementTrack,
): Promise<void> {
  const milestones = getSettlementMilestones(track);
  const dod = new Date(dateOfDeath);

  const rows = milestones.map((m, i) => {
    const due = new Date(dod);
    due.setDate(due.getDate() + m.offset_days);

    return {
      case_id: caseId,
      user_id: userId,
      milestone_key: `${track}-${i}`,
      label: m.label,
      description: m.description,
      due_date: due.toISOString().slice(0, 10),
      legal_basis: m.legal_basis ?? '',
      is_auto: true,
    };
  });

  const { error } = await supabase
    .from('case_deadlines')
    .upsert(rows, { onConflict: 'case_id,milestone_key' });

  if (error) throw error;
}

/**
 * Mark a deadline as complete with a date and optional note.
 */
export async function markDeadlineComplete(
  deadlineId: string,
  completedDate: string,
  note?: string,
): Promise<void> {
  const update: Record<string, unknown> = {
    completed_date: completedDate,
  };
  if (note !== undefined) {
    update.note = note;
  }

  const { error } = await supabase
    .from('case_deadlines')
    .update(update)
    .eq('id', deadlineId);

  if (error) throw error;
}

/**
 * Add a custom (non-auto) deadline to a case.
 */
export async function addCustomDeadline(
  caseId: string,
  userId: string,
  data: {
    label: string;
    due_date: string;
    description: string;
    legal_basis?: string;
  },
): Promise<CaseDeadline> {
  const { data: row, error } = await supabase
    .from('case_deadlines')
    .insert({
      case_id: caseId,
      user_id: userId,
      milestone_key: `custom-${Date.now()}`,
      label: data.label,
      description: data.description,
      due_date: data.due_date,
      legal_basis: data.legal_basis ?? '',
      is_auto: false,
    })
    .select('*')
    .single();

  if (error) throw error;
  return row as CaseDeadline;
}

/**
 * List all deadlines for a case, ordered by due_date.
 */
export async function listDeadlines(caseId: string): Promise<CaseDeadline[]> {
  const { data, error } = await supabase
    .from('case_deadlines')
    .select('*')
    .eq('case_id', caseId)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return (data ?? []) as CaseDeadline[];
}

/**
 * Get deadline summaries for multiple cases (dashboard).
 */
export async function getCaseDeadlineSummaries(caseIds: string[]) {
  const { data, error } = await supabase.rpc('get_case_deadline_summaries', {
    p_case_ids: caseIds,
  });

  if (error) throw error;
  return data;
}
