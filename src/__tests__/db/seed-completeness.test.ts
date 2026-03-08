// Integration tests: seed data completeness verification
// Requires local Supabase running: npx supabase start
// Run: cd apps/podplay && npx vitest run src/__tests__/db/seed-completeness.test.ts

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
// Local dev defaults — not secret
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ============================================================
// BOM Templates
// ============================================================

describe('bom_templates seed completeness', () => {
  it('has exactly 4 distinct tiers (pro, autonomous, autonomous_plus, pbk)', async () => {
    const { data, error } = await admin
      .from('bom_templates')
      .select('tier');

    expect(error).toBeNull();
    const tiers = new Set(data!.map((row) => row.tier));
    expect(tiers.size).toBe(4);
    expect(tiers).toContain('pro');
    expect(tiers).toContain('autonomous');
    expect(tiers).toContain('autonomous_plus');
    expect(tiers).toContain('pbk');
  });

  it('pro tier has 25 BOM items', async () => {
    const { count, error } = await admin
      .from('bom_templates')
      .select('*', { count: 'exact', head: true })
      .eq('tier', 'pro');

    expect(error).toBeNull();
    expect(count).toBe(25);
  });

  it('autonomous tier has 30 BOM items', async () => {
    const { count, error } = await admin
      .from('bom_templates')
      .select('*', { count: 'exact', head: true })
      .eq('tier', 'autonomous');

    expect(error).toBeNull();
    expect(count).toBe(30);
  });

  it('autonomous_plus tier has 32 BOM items', async () => {
    const { count, error } = await admin
      .from('bom_templates')
      .select('*', { count: 'exact', head: true })
      .eq('tier', 'autonomous_plus');

    expect(error).toBeNull();
    expect(count).toBe(32);
  });

  it('pbk tier has 25 BOM items', async () => {
    const { count, error } = await admin
      .from('bom_templates')
      .select('*', { count: 'exact', head: true })
      .eq('tier', 'pbk');

    expect(error).toBeNull();
    expect(count).toBe(25);
  });

  it('total BOM template rows = 112 (spec: 4 tiers × items)', async () => {
    const { count, error } = await admin
      .from('bom_templates')
      .select('*', { count: 'exact', head: true });

    expect(error).toBeNull();
    expect(count).toBe(112);
  });
});

// ============================================================
// Deployment Checklist Templates
// ============================================================

describe('deployment_checklist_templates seed completeness', () => {
  it('has exactly 16 distinct phases (Phase 0–15)', async () => {
    const { data, error } = await admin
      .from('deployment_checklist_templates')
      .select('phase');

    expect(error).toBeNull();
    const phases = new Set(data!.map((row) => row.phase));
    expect(phases.size).toBe(16);
  });

  it('has all phases 0–15', async () => {
    const { data, error } = await admin
      .from('deployment_checklist_templates')
      .select('phase');

    expect(error).toBeNull();
    const phases = new Set(data!.map((row) => row.phase));
    for (let i = 0; i <= 15; i++) {
      expect(phases).toContain(i);
    }
  });

  it('has exactly 121 total checklist steps (spec: 121 rows, phases 0–15)', async () => {
    const { count, error } = await admin
      .from('deployment_checklist_templates')
      .select('*', { count: 'exact', head: true });

    expect(error).toBeNull();
    expect(count).toBe(121);
  });

  it('each phase has at least 1 step', async () => {
    const { data, error } = await admin
      .from('deployment_checklist_templates')
      .select('phase, step_number');

    expect(error).toBeNull();
    const stepsByPhase = new Map<number, number>();
    for (const row of data!) {
      stepsByPhase.set(row.phase, (stepsByPhase.get(row.phase) ?? 0) + 1);
    }
    for (let i = 0; i <= 15; i++) {
      expect(stepsByPhase.get(i)).toBeGreaterThanOrEqual(1);
    }
  });
});

// ============================================================
// Settings
// ============================================================

describe('settings seed completeness', () => {
  it('default settings row exists with id = "default"', async () => {
    const { data, error } = await admin
      .from('settings')
      .select('id')
      .eq('id', 'default')
      .single();

    expect(error).toBeNull();
    expect(data!.id).toBe('default');
  });

  it('sales_tax_rate = 0.1025 (spec: 10.25% NJ sales tax)', async () => {
    const { data, error } = await admin
      .from('settings')
      .select('sales_tax_rate')
      .eq('id', 'default')
      .single();

    expect(error).toBeNull();
    expect(parseFloat(data!.sales_tax_rate)).toBe(0.1025);
  });

  it('shipping_rate = 0.10 (spec: 10% of hardware total)', async () => {
    const { data, error } = await admin
      .from('settings')
      .select('shipping_rate')
      .eq('id', 'default')
      .single();

    expect(error).toBeNull();
    expect(parseFloat(data!.shipping_rate)).toBe(0.10);
  });

  it('target_margin = 0.10 (spec: 10% margin)', async () => {
    const { data, error } = await admin
      .from('settings')
      .select('target_margin')
      .eq('id', 'default')
      .single();

    expect(error).toBeNull();
    expect(parseFloat(data!.target_margin)).toBe(0.10);
  });

  it('pro tier fees: pro_venue_fee = 5000, pro_court_fee = 2500', async () => {
    const { data, error } = await admin
      .from('settings')
      .select('pro_venue_fee, pro_court_fee')
      .eq('id', 'default')
      .single();

    expect(error).toBeNull();
    expect(parseFloat(data!.pro_venue_fee)).toBe(5000.00);
    expect(parseFloat(data!.pro_court_fee)).toBe(2500.00);
  });

  it('autonomous tier fees: autonomous_venue_fee = 7500, autonomous_court_fee = 2500', async () => {
    const { data, error } = await admin
      .from('settings')
      .select('autonomous_venue_fee, autonomous_court_fee')
      .eq('id', 'default')
      .single();

    expect(error).toBeNull();
    expect(parseFloat(data!.autonomous_venue_fee)).toBe(7500.00);
    expect(parseFloat(data!.autonomous_court_fee)).toBe(2500.00);
  });

  it('pbk tier fees: pbk_venue_fee = 0, pbk_court_fee = 0 (configured before use)', async () => {
    const { data, error } = await admin
      .from('settings')
      .select('pbk_venue_fee, pbk_court_fee')
      .eq('id', 'default')
      .single();

    expect(error).toBeNull();
    expect(parseFloat(data!.pbk_venue_fee)).toBe(0.00);
    expect(parseFloat(data!.pbk_court_fee)).toBe(0.00);
  });
});
