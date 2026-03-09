import { supabase } from '@/lib/supabase';

export type Settings = {
  id: string;
  // Service tier fees
  pro_venue_fee: number;
  pro_court_fee: number;
  autonomous_venue_fee: number;
  autonomous_court_fee: number;
  autonomous_plus_venue_fee: number;
  autonomous_plus_court_fee: number;
  pbk_venue_fee: number;
  pbk_court_fee: number;
  // Cost chain rates (decimals: 0.10 = 10%)
  shipping_rate: number;
  target_margin: number;
  sales_tax_rate: number;
  deposit_pct: number;
  // Labor
  labor_rate_per_hour: number;
  hours_per_day: number;
  // BOM thresholds
  switch_24_max_courts: number;
  switch_48_max_courts: number;
  ssd_1tb_max_courts: number;
  ssd_2tb_max_courts: number;
  nvr_4bay_max_cameras: number;
  // ISP thresholds
  isp_fiber_mbps_per_court: number;
  isp_cable_upload_min_mbps: number;
  // Operational defaults
  default_replay_service_version: 'v1' | 'v2';
  po_number_prefix: string;
  cc_terminal_pin: string;
  mac_mini_local_ip: string;
  replay_port: number;
  ddns_domain: string;
  label_sets_per_court: number;
  replay_sign_multiplier: number;
  default_vlan_id: number;
  replay_vlan_id: number;
  surveillance_vlan_id: number;
  access_control_vlan_id: number;
  // Travel / team (used by other settings tabs)
  lodging_per_day?: number;
  airfare_default?: number;
  rent_per_year?: number;
  indirect_salaries_per_year?: number;
  updated_at?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const settingsTable = () => supabase.from('settings') as any;

export async function getSettings(): Promise<Settings> {
  const { data, error } = await settingsTable()
    .select('*')
    .eq('id', 'default')
    .single();
  if (error) throw error;
  return data as Settings;
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  const { data, error } = await settingsTable()
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', 'default')
    .select()
    .single();
  if (error) throw error;
  return data as Settings;
}
