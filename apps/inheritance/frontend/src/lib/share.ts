import { supabase } from './supabase';
import type { EngineInput, EngineOutput } from '@/types';

export interface SharedCaseData {
  title: string;
  status: string;
  input_json: EngineInput | null;
  output_json: EngineOutput | null;
  decedent_name: string | null;
  date_of_death: string | null;
}

export async function toggleShare(
  caseId: string,
  enabled: boolean,
): Promise<{ shareToken: string; shareEnabled: boolean }> {
  const { data, error } = await supabase
    .from('cases')
    .update({ share_enabled: enabled })
    .eq('id', caseId)
    .select('share_token, share_enabled')
    .single();

  if (error) throw error;
  return { shareToken: data.share_token, shareEnabled: data.share_enabled };
}

export async function getSharedCase(
  token: string,
): Promise<SharedCaseData | null> {
  const { data, error } = await supabase.rpc('get_shared_case', {
    p_token: token,
  });

  if (error) throw error;
  if (!data || (Array.isArray(data) && data.length === 0)) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return row as SharedCaseData;
}
