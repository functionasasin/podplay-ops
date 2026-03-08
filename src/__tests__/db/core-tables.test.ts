// Integration tests: core tables (projects, installers, settings)
// Requires local Supabase running: npx supabase start
// Run: cd apps/podplay && npx vitest run src/__tests__/db/

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
// Local dev defaults — not secret
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Admin client bypasses RLS — used for CRUD test operations
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Anon client — no auth session — used for RLS rejection test
const anon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false },
});

// ─── projects ─────────────────────────────────────────────────────────────────

describe('projects table', () => {
  const insertedIds: string[] = [];

  afterEach(async () => {
    if (insertedIds.length > 0) {
      await admin.from('projects').delete().in('id', insertedIds);
      insertedIds.length = 0;
    }
  });

  it('inserts a project with required fields and selects it back', async () => {
    const { data, error } = await admin
      .from('projects')
      .insert({
        customer_name: 'Test Club',
        venue_name: 'Test Venue',
        tier: 'pro',
        court_count: 4,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    insertedIds.push(data!.id);

    // Verify column names match spec
    expect(data).toMatchObject({
      customer_name: 'Test Club',
      venue_name: 'Test Venue',
      tier: 'pro',
      court_count: 4,
      project_status: 'intake',
      deployment_status: 'not_started',
      revenue_stage: 'proposal',
      replay_service_version: 'v1',
      installer_hours: 0,
      venue_country: 'US',
    });

    // replay_sign_count is GENERATED ALWAYS AS (court_count * 2)
    expect(data!.replay_sign_count).toBe(8);

    // id, created_at, updated_at are auto-generated
    expect(data!.id).toBeTruthy();
    expect(data!.created_at).toBeTruthy();
    expect(data!.updated_at).toBeTruthy();
  });

  it('updates project_status and verifies updated_at changes', async () => {
    const { data: inserted, error: insertError } = await admin
      .from('projects')
      .insert({
        customer_name: 'Status Test Club',
        venue_name: 'Status Test Venue',
        tier: 'autonomous',
        court_count: 2,
      })
      .select('id, project_status, updated_at')
      .single();

    expect(insertError).toBeNull();
    insertedIds.push(inserted!.id);

    const updatedAtBefore = inserted!.updated_at;

    // Small pause to ensure the update timestamp differs
    await new Promise((r) => setTimeout(r, 10));

    const { data: updated, error: updateError } = await admin
      .from('projects')
      .update({ project_status: 'procurement' })
      .eq('id', inserted!.id)
      .select('id, project_status, updated_at')
      .single();

    expect(updateError).toBeNull();
    expect(updated!.project_status).toBe('procurement');
    expect(updated!.updated_at).not.toBe(updatedAtBefore);
  });
});

// ─── installers ───────────────────────────────────────────────────────────────

describe('installers table', () => {
  const insertedIds: string[] = [];

  afterEach(async () => {
    if (insertedIds.length > 0) {
      await admin.from('installers').delete().in('id', insertedIds);
      insertedIds.length = 0;
    }
  });

  it('inserts an installer row and selects it back', async () => {
    const { data, error } = await admin
      .from('installers')
      .insert({
        name: 'Mike Torres',
        company: 'Torres AV Services',
        installer_type: 'podplay_vetted',
        regions: ['NY', 'NJ', 'CT'],
        hourly_rate: 125.0,
        is_active: true,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    insertedIds.push(data!.id);

    expect(data).toMatchObject({
      name: 'Mike Torres',
      company: 'Torres AV Services',
      installer_type: 'podplay_vetted',
      regions: ['NY', 'NJ', 'CT'],
      is_active: true,
    });
    expect(parseFloat(data!.hourly_rate)).toBeCloseTo(125.0, 2);
    expect(data!.id).toBeTruthy();
    expect(data!.created_at).toBeTruthy();
    expect(data!.updated_at).toBeTruthy();
  });
});

// ─── settings ─────────────────────────────────────────────────────────────────

describe('settings table', () => {
  it('reads the default settings row and verifies key column values', async () => {
    const { data, error } = await admin
      .from('settings')
      .select()
      .eq('id', 'default')
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();

    // Verify column names and default values from spec
    expect(data!.id).toBe('default');
    expect(parseFloat(data!.pro_venue_fee)).toBeCloseTo(5000.0, 2);
    expect(parseFloat(data!.pro_court_fee)).toBeCloseTo(2500.0, 2);
    expect(parseFloat(data!.autonomous_venue_fee)).toBeCloseTo(7500.0, 2);
    expect(parseFloat(data!.labor_rate_per_hour)).toBeCloseTo(120.0, 2);
    expect(parseFloat(data!.sales_tax_rate)).toBeCloseTo(0.1025, 4);
    expect(parseFloat(data!.shipping_rate)).toBeCloseTo(0.1, 4);
    expect(parseFloat(data!.target_margin)).toBeCloseTo(0.1, 4);
    expect(data!.hours_per_day).toBe(10);
    expect(data!.updated_at).toBeTruthy();
  });

  it('updates a settings value and reads it back', async () => {
    // Record current value for restore
    const { data: before } = await admin
      .from('settings')
      .select('labor_rate_per_hour')
      .eq('id', 'default')
      .single();

    const originalRate = before!.labor_rate_per_hour;

    const { data: updated, error } = await admin
      .from('settings')
      .update({ labor_rate_per_hour: 135.0 })
      .eq('id', 'default')
      .select('labor_rate_per_hour, updated_at')
      .single();

    expect(error).toBeNull();
    expect(parseFloat(updated!.labor_rate_per_hour)).toBeCloseTo(135.0, 2);

    // Restore original value
    await admin
      .from('settings')
      .update({ labor_rate_per_hour: parseFloat(originalRate) })
      .eq('id', 'default');
  });
});

// ─── RLS: unauthenticated request is rejected ─────────────────────────────────

describe('RLS enforcement', () => {
  it('rejects unauthenticated SELECT on projects', async () => {
    const { data, error } = await anon.from('projects').select('id').limit(1);

    // RLS on projects requires authenticated role — anon gets empty result or error
    // Supabase returns empty array (not error) when RLS blocks all rows
    if (error) {
      expect(error).toBeTruthy();
    } else {
      // No rows visible to unauthenticated user
      expect(data).toEqual([]);
    }
  });

  it('rejects unauthenticated SELECT on installers', async () => {
    const { data, error } = await anon.from('installers').select('id').limit(1);

    if (error) {
      expect(error).toBeTruthy();
    } else {
      expect(data).toEqual([]);
    }
  });

  it('rejects unauthenticated SELECT on settings', async () => {
    const { data, error } = await anon.from('settings').select('id').limit(1);

    if (error) {
      expect(error).toBeTruthy();
    } else {
      expect(data).toEqual([]);
    }
  });
});
