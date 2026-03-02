import { supabase } from './supabase';
import type { EngineInput, EngineOutput, CaseRow, CaseListItem, CaseStatus } from '@/types';
import { VALID_STATUS_TRANSITIONS } from '@/types';

export async function createCase(
  userId: string,
  orgId: string,
  input: EngineInput | null,
  output: EngineOutput | null,
): Promise<{ id: string }> {
  const title = input?.decedent?.name
    ? `Estate of ${input.decedent.name}`
    : 'Untitled Case';

  const { data, error } = await supabase
    .from('cases')
    .insert({
      user_id: userId,
      org_id: orgId,
      title,
      status: output ? 'computed' : 'draft',
      input_json: input,
      output_json: output,
      decedent_name: input?.decedent?.name ?? null,
      date_of_death: input?.decedent?.date_of_death ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return { id: data.id };
}

export async function loadCase(caseId: string): Promise<CaseRow> {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', caseId)
    .single();

  if (error) throw error;
  return data as CaseRow;
}

export async function updateCaseInput(
  caseId: string,
  input: EngineInput,
): Promise<void> {
  const { error } = await supabase
    .from('cases')
    .update({
      input_json: input,
      decedent_name: input.decedent?.name ?? null,
      date_of_death: input.decedent?.date_of_death ?? null,
    })
    .eq('id', caseId);

  if (error) throw error;
}

export async function updateCaseOutput(
  caseId: string,
  output: EngineOutput,
): Promise<void> {
  const { error } = await supabase
    .from('cases')
    .update({
      output_json: output,
      status: 'computed',
    })
    .eq('id', caseId);

  if (error) throw error;
}

export async function updateCaseStatus(
  caseId: string,
  newStatus: CaseStatus,
): Promise<void> {
  const { error } = await supabase
    .from('cases')
    .update({ status: newStatus })
    .eq('id', caseId);

  if (error) throw error;
}

export function isValidStatusTransition(
  from: CaseStatus,
  to: CaseStatus,
): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function listCases(
  orgId: string,
  statusFilter?: CaseStatus,
): Promise<CaseListItem[]> {
  let query = supabase
    .from('cases')
    .select('id, title, status, decedent_name, date_of_death, gross_estate, updated_at, notes_count')
    .eq('org_id', orgId);

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query.order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as CaseListItem[];
}

export async function deleteCase(caseId: string): Promise<void> {
  const { error } = await supabase
    .from('cases')
    .delete()
    .eq('id', caseId);

  if (error) throw error;
}
