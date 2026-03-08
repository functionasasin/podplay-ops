// Integration tests: hardware_catalog seed data verification
// Requires local Supabase running: npx supabase start
// Run: cd apps/podplay && npx vitest run src/__tests__/db/seed-hardware.test.ts

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
// Local dev defaults — not secret
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

describe('hardware_catalog seed verification', () => {
  it('has exactly 47 rows (spec: 47 items across 8 categories)', async () => {
    const { count, error } = await admin
      .from('hardware_catalog')
      .select('*', { count: 'exact', head: true });

    expect(error).toBeNull();
    expect(count).toBe(47);
  });

  it('all rows have is_active = true', async () => {
    const { count: inactiveCount, error } = await admin
      .from('hardware_catalog')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', false);

    expect(error).toBeNull();
    expect(inactiveCount).toBe(0);
  });

  it('has no duplicate SKUs', async () => {
    const { data, error } = await admin
      .from('hardware_catalog')
      .select('sku');

    expect(error).toBeNull();
    const skus = data!.map((row) => row.sku);
    const uniqueSkus = new Set(skus);
    expect(uniqueSkus.size).toBe(skus.length);
  });

  it('spot-check network_rack: NET-UDM-SE matches spec vendor and unit_cost', async () => {
    const { data, error } = await admin
      .from('hardware_catalog')
      .select('sku, vendor, unit_cost')
      .eq('sku', 'NET-UDM-SE')
      .single();

    expect(error).toBeNull();
    expect(data!.vendor).toBe('UniFi');
    expect(parseFloat(data!.unit_cost)).toBe(379.00);
  });

  it('spot-check replay_system: REPLAY-CAMERA-WHITE matches spec vendor and unit_cost', async () => {
    const { data, error } = await admin
      .from('hardware_catalog')
      .select('sku, vendor, unit_cost')
      .eq('sku', 'REPLAY-CAMERA-WHITE')
      .single();

    expect(error).toBeNull();
    expect(data!.vendor).toBe('EmpireTech');
    expect(parseFloat(data!.unit_cost)).toBe(120.00);
  });

  it('spot-check displays: DISPLAY-APPLETV matches spec vendor and unit_cost', async () => {
    const { data, error } = await admin
      .from('hardware_catalog')
      .select('sku, vendor, unit_cost')
      .eq('sku', 'DISPLAY-APPLETV')
      .single();

    expect(error).toBeNull();
    expect(data!.vendor).toBe('Apple Business');
    expect(parseFloat(data!.unit_cost)).toBe(130.00);
  });

  it('spot-check infrastructure: INFRA-RACK-SHELF matches spec vendor and unit_cost', async () => {
    const { data, error } = await admin
      .from('hardware_catalog')
      .select('sku, vendor, unit_cost')
      .eq('sku', 'INFRA-RACK-SHELF')
      .single();

    expect(error).toBeNull();
    expect(data!.vendor).toBe('Amazon');
    expect(parseFloat(data!.unit_cost)).toBe(20.00);
  });

  it('spot-check surveillance: SURV-HDD matches spec vendor and unit_cost', async () => {
    const { data, error } = await admin
      .from('hardware_catalog')
      .select('sku, vendor, unit_cost')
      .eq('sku', 'SURV-HDD')
      .single();

    expect(error).toBeNull();
    expect(data!.vendor).toBe('Amazon');
    expect(parseFloat(data!.unit_cost)).toBe(140.00);
  });
});
