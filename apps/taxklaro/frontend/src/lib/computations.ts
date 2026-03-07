import { supabase } from './supabase';
import type { TaxpayerInput } from '../types/engine-input';
import type { TaxComputationResult } from '../types/engine-output';
import type { ComputationRow, ComputationListItem, ComputationStatus } from '../types/org';

export async function createComputation(
  orgId: string,
  clientId: string | null,
  title: string,
  inputJson: TaxpayerInput
): Promise<{ id: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('computations')
    .insert({
      org_id: orgId,
      client_id: clientId,
      created_by: user.id,
      title,
      input_json: inputJson,
      tax_year: (inputJson as Record<string, unknown>).taxYear ?? new Date().getFullYear(),
    })
    .select('id')
    .single();
  if (error || !data) return null;
  return { id: data.id };
}

export async function loadComputation(id: string): Promise<ComputationRow | null> {
  const { data, error } = await supabase
    .from('computations')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    orgId: data.org_id,
    clientId: data.client_id,
    createdBy: data.created_by,
    title: data.title,
    taxYear: data.tax_year,
    status: data.status,
    inputJson: data.input_json,
    outputJson: data.output_json,
    regimeSelected: data.regime_selected,
    shareToken: data.share_token,
    shareEnabled: data.share_enabled,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function updateComputationInput(
  id: string,
  inputJson: TaxpayerInput
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('computations')
    .update({ input_json: inputJson })
    .eq('id', id);
  return { error: error ? new Error(error.message) : null };
}

export async function saveComputationOutput(
  id: string,
  outputJson: TaxComputationResult
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('computations')
    .update({
      output_json: outputJson,
      status: 'computed',
      regime_selected: (outputJson as Record<string, unknown>).recommendedRegime ?? null,
    })
    .eq('id', id);
  return { error: error ? new Error(error.message) : null };
}

export async function listComputations(orgId: string): Promise<ComputationListItem[]> {
  const { data, error } = await supabase
    .from('computations')
    .select('id, title, tax_year, status, regime_selected, share_enabled, created_at, updated_at, client_id')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    taxYear: row.tax_year,
    status: row.status,
    regimeSelected: row.regime_selected,
    shareEnabled: row.share_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clientId: row.client_id,
  }));
}

export async function updateComputationStatus(
  id: string,
  fromStatus: ComputationStatus,
  toStatus: ComputationStatus
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('computations')
    .update({ status: toStatus })
    .eq('id', id)
    .eq('status', fromStatus);
  return { error: error ? new Error(error.message) : null };
}

export async function deleteComputation(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('computations')
    .delete()
    .eq('id', id);
  return { error: error ? new Error(error.message) : null };
}
