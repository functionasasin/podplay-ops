import { supabase } from './supabase';

/**
 * Conflict Check types and functions (§4.17)
 * Source: docs/plans/inheritance-premium-spec.md §4.17
 */

export type ConflictOutcome = 'clear' | 'flagged' | 'cleared_after_review' | 'skipped';

export interface ConflictMatch {
  id?: string;
  case_id?: string;
  full_name?: string;
  heir_name?: string;
  case_title?: string;
  decedent_name?: string;
  tin?: string | null;
  status?: string;
  conflict_cleared?: boolean | null;
  similarity_score: number;
  match_type: 'client' | 'heir' | 'tin_match';
}

export interface ConflictCheckResult {
  client_matches: ConflictMatch[];
  heir_matches: ConflictMatch[];
  tin_matches: ConflictMatch[];
  total_matches: number;
  outcome: ConflictOutcome;
  checked_name: string;
  checked_tin: string | null;
  checked_at: string;
}

/**
 * Get the color class for a similarity score.
 * ≥1.00 = red "Exact", ≥0.70 = amber "High", ≥0.50 = yellow "Moderate", <0.50 = gray "Low"
 */
export function getSimilarityColor(score: number): {
  color: string;
  label: string;
  className: string;
} {
  if (score >= 1.0) {
    return { color: 'red', label: 'Exact', className: 'bg-red-100 text-red-800 border-red-300' };
  }
  if (score >= 0.7) {
    return { color: 'amber', label: 'High', className: 'bg-amber-100 text-amber-800 border-amber-300' };
  }
  if (score >= 0.5) {
    return { color: 'yellow', label: 'Moderate', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
  }
  return { color: 'gray', label: 'Low', className: 'bg-gray-100 text-gray-800 border-gray-300' };
}

/**
 * Run conflict check via Supabase RPC.
 * Calls the run_conflict_check SECURITY DEFINER function.
 */
export async function runConflictCheck(
  name: string,
  tin?: string,
): Promise<ConflictCheckResult> {
  const { data, error } = await supabase.rpc('run_conflict_check', {
    p_name: name,
    ...(tin ? { p_tin: tin } : {}),
  });

  if (error) throw error;
  return data as ConflictCheckResult;
}
