import { supabase } from '@/lib/supabase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const catalogTable = () => supabase.from('hardware_catalog') as any;

export interface HardwareCatalogItem {
  id: string;
  sku: string;
  name: string;
  model?: string | null;
  category: string;
  vendor: string;
  vendor_url?: string | null;
  unit_cost?: number | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getCatalogItems(opts?: {
  category?: string;
  q?: string;
  includeInactive?: boolean;
}): Promise<HardwareCatalogItem[]> {
  let query = catalogTable()
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (!opts?.includeInactive) {
    query = query.eq('is_active', true);
  }
  if (opts?.category) {
    query = query.eq('category', opts.category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as HardwareCatalogItem[];
}

export async function createCatalogItem(
  item: Omit<HardwareCatalogItem, 'id' | 'created_at' | 'updated_at'>,
): Promise<HardwareCatalogItem> {
  const { data, error } = await catalogTable()
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data as HardwareCatalogItem;
}

export async function updateCatalogItem(
  id: string,
  patch: Partial<Omit<HardwareCatalogItem, 'id' | 'sku' | 'created_at' | 'updated_at'>>,
): Promise<HardwareCatalogItem> {
  const { data, error } = await catalogTable()
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as HardwareCatalogItem;
}

export async function deactivateCatalogItem(id: string): Promise<void> {
  const { error } = await catalogTable()
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}

export async function reactivateCatalogItem(id: string): Promise<void> {
  const { error } = await catalogTable()
    .update({ is_active: true })
    .eq('id', id);
  if (error) throw error;
}
