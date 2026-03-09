import { supabase } from '@/lib/supabase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const vendorsTable = () => supabase.from('vendors') as any;

export interface Vendor {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  lead_time_days: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getVendors(opts?: {
  includeInactive?: boolean;
}): Promise<Vendor[]> {
  let query = vendorsTable()
    .select('*')
    .order('name');

  if (!opts?.includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Vendor[];
}

export async function createVendor(
  vendor: Omit<Vendor, 'id' | 'created_at' | 'updated_at'>,
): Promise<Vendor> {
  const { data, error } = await vendorsTable()
    .insert(vendor)
    .select()
    .single();
  if (error) throw error;
  return data as Vendor;
}

export async function updateVendor(
  id: string,
  patch: Partial<Omit<Vendor, 'id' | 'created_at' | 'updated_at'>>,
): Promise<Vendor> {
  const { data, error } = await vendorsTable()
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Vendor;
}

export async function deactivateVendor(id: string): Promise<void> {
  const { error } = await vendorsTable()
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}

export async function reactivateVendor(id: string): Promise<void> {
  const { error } = await vendorsTable()
    .update({ is_active: true })
    .eq('id', id);
  if (error) throw error;
}
