import { supabase } from './supabase';
import type {
  ClientRow,
  ClientListItem,
  ClientStatus,
  CreateClientData,
  UpdateClientData,
} from '@/types/client';

export async function createClient(
  data: CreateClientData,
): Promise<{ id: string }> {
  const { data: result, error } = await supabase
    .from('clients')
    .insert(data)
    .select('id')
    .single();

  if (error) throw error;
  return { id: result.id };
}

export async function loadClient(clientId: string): Promise<ClientRow> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error) throw error;
  return data as ClientRow;
}

export async function updateClient(
  clientId: string,
  data: UpdateClientData,
): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update(data)
    .eq('id', clientId);

  if (error) throw error;
}

export async function listClients(
  orgId: string,
  statusFilter?: ClientStatus,
  searchQuery?: string,
): Promise<ClientListItem[]> {
  let query = supabase
    .from('clients')
    .select('id, full_name, tin, status, intake_date, conflict_cleared, case_count')
    .eq('org_id', orgId);

  if (statusFilter) {
    query = query.eq('status', statusFilter);
  }

  if (searchQuery) {
    query = query.ilike('full_name', `%${searchQuery}%`);
  }

  const { data, error } = await query.order('intake_date', { ascending: false });

  if (error) throw error;
  return data as ClientListItem[];
}

export async function deleteClient(clientId: string): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId);

  if (error) throw error;
}
