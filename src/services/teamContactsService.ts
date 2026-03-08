import { supabase } from '@/lib/supabase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const teamTable = () => supabase.from('team_contacts') as any;

export interface TeamContact {
  id: string;
  slug: string;
  name: string;
  role: string;
  department: string;
  phone?: string | null;
  email?: string | null;
  contact_via?: string | null;
  support_tier?: number | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getTeamContacts(opts?: {
  includeInactive?: boolean;
}): Promise<TeamContact[]> {
  let query = teamTable()
    .select('*')
    .order('department')
    .order('name');

  if (!opts?.includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as TeamContact[];
}

export async function createTeamContact(
  contact: Omit<TeamContact, 'id' | 'created_at' | 'updated_at'>,
): Promise<TeamContact> {
  const { data, error } = await teamTable()
    .insert(contact)
    .select()
    .single();
  if (error) throw error;
  return data as TeamContact;
}

export async function updateTeamContact(
  id: string,
  patch: Partial<Omit<TeamContact, 'id' | 'created_at' | 'updated_at'>>,
): Promise<TeamContact> {
  const { data, error } = await teamTable()
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as TeamContact;
}

export async function deactivateTeamContact(id: string): Promise<void> {
  const { error } = await teamTable()
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}

export async function reactivateTeamContact(id: string): Promise<void> {
  const { error } = await teamTable()
    .update({ is_active: true })
    .eq('id', id);
  if (error) throw error;
}
