import { supabase } from '@/lib/supabase';
import type { InstallerType } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const installersTable = () => supabase.from('installers') as any;

export interface Installer {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  installer_type: InstallerType;
  regions?: string[] | null;
  hourly_rate?: number | null;
  is_active: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export async function getInstallers(opts?: {
  includeInactive?: boolean;
}): Promise<Installer[]> {
  let query = installersTable()
    .select('*')
    .order('installer_type')
    .order('name');

  if (!opts?.includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Installer[];
}

export async function createInstaller(
  installer: Omit<Installer, 'id' | 'created_at' | 'updated_at'>,
): Promise<Installer> {
  const { data, error } = await installersTable()
    .insert(installer)
    .select()
    .single();
  if (error) throw error;
  return data as Installer;
}

export async function updateInstaller(
  id: string,
  patch: Partial<Omit<Installer, 'id' | 'created_at' | 'updated_at'>>,
): Promise<Installer> {
  const { data, error } = await installersTable()
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Installer;
}

export async function deactivateInstaller(id: string): Promise<void> {
  const { error } = await installersTable()
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}

export async function reactivateInstaller(id: string): Promise<void> {
  const { error } = await installersTable()
    .update({ is_active: true })
    .eq('id', id);
  if (error) throw error;
}
