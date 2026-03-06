import { supabase } from './supabase';

export interface SharedComputationData {
  id: string;
  title: string;
  taxYear: number;
  outputJson: Record<string, unknown> | null;
  shareEnabled: boolean;
  orgName: string;
}

export async function enableSharing(computationId: string): Promise<{ shareToken: string } | null> {
  const { data, error } = await supabase
    .from('computations')
    .update({ share_enabled: true })
    .eq('id', computationId)
    .select('share_token')
    .single();
  if (error || !data) return null;
  return { shareToken: data.share_token as string };
}

export async function disableSharing(computationId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from('computations')
    .update({ share_enabled: false })
    .eq('id', computationId);
  return { error: error ? new Error(error.message) : null };
}

export async function getSharedComputation(token: string): Promise<SharedComputationData | null> {
  const { data, error } = await supabase.rpc('get_shared_computation', { p_token: token });
  if (error || !data) return null;
  return data as SharedComputationData;
}

export async function rotateShareToken(computationId: string): Promise<{ shareToken: string } | null> {
  // Generate a new UUID client-side and update the share_token column
  const newToken = crypto.randomUUID();
  const { data, error } = await supabase
    .from('computations')
    .update({ share_token: newToken })
    .eq('id', computationId)
    .select('share_token')
    .single();
  if (error || !data) return null;
  return { shareToken: data.share_token as string };
}
