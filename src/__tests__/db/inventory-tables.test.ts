// Integration tests: inventory tables (inventory, inventory_movements)
// Requires local Supabase running: npx supabase start
// Run: cd apps/podplay && npx vitest run src/__tests__/db/

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
// Local dev defaults — not secret
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ─── inventory ─────────────────────────────────────────────────────────────────

describe('inventory table', () => {
  const catalogIds: string[] = [];
  const inventoryIds: string[] = [];

  afterEach(async () => {
    if (inventoryIds.length > 0) {
      await admin.from('inventory').delete().in('id', inventoryIds);
      inventoryIds.length = 0;
    }
    if (catalogIds.length > 0) {
      await admin.from('hardware_catalog').delete().in('id', catalogIds);
      catalogIds.length = 0;
    }
  });

  it('inserts an inventory row and verifies quantity_on_hand and reorder_point', async () => {
    const { data: catalogItem, error: catalogError } = await admin
      .from('hardware_catalog')
      .insert({ sku: 'INV-TEST-001', name: 'Inventory Test Camera', unit_cost: 199.99 })
      .select()
      .single();

    expect(catalogError).toBeNull();
    catalogIds.push(catalogItem!.id);

    const { data: inv, error } = await admin
      .from('inventory')
      .insert({
        item_id: catalogItem!.id,
        quantity_on_hand: 25,
        reorder_point: 5,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(inv).not.toBeNull();
    inventoryIds.push(inv!.id);

    expect(inv!.item_id).toBe(catalogItem!.id);
    expect(inv!.quantity_on_hand).toBe(25);
    expect(inv!.reorder_point).toBe(5);
    expect(inv!.quantity_allocated).toBe(0); // default
    expect(inv!.id).toBeTruthy();
    expect(inv!.updated_at).toBeTruthy();
  });

  it('enforces unique constraint: only one inventory row per item_id', async () => {
    const { data: catalogItem, error: catalogError } = await admin
      .from('hardware_catalog')
      .insert({ sku: 'INV-UNIQUE-001', name: 'Unique Inventory Item', unit_cost: 50.0 })
      .select()
      .single();

    expect(catalogError).toBeNull();
    catalogIds.push(catalogItem!.id);

    const { data: first, error: firstError } = await admin
      .from('inventory')
      .insert({ item_id: catalogItem!.id, quantity_on_hand: 10 })
      .select()
      .single();

    expect(firstError).toBeNull();
    inventoryIds.push(first!.id);

    const { error: dupeError } = await admin
      .from('inventory')
      .insert({ item_id: catalogItem!.id, quantity_on_hand: 5 })
      .select()
      .single();

    expect(dupeError).not.toBeNull();
    // Postgres unique violation code
    expect(dupeError!.code).toBe('23505');
  });

  it('enforces FK: item_id must reference a valid hardware_catalog row', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000001';

    const { error } = await admin
      .from('inventory')
      .insert({ item_id: fakeId, quantity_on_hand: 10 })
      .select()
      .single();

    expect(error).not.toBeNull();
    // Postgres FK violation code
    expect(error!.code).toBe('23503');
  });
});

// ─── inventory_movements ───────────────────────────────────────────────────────

describe('inventory_movements table', () => {
  const catalogIds: string[] = [];
  const movementIds: string[] = [];

  afterEach(async () => {
    if (movementIds.length > 0) {
      await admin.from('inventory_movements').delete().in('id', movementIds);
      movementIds.length = 0;
    }
    if (catalogIds.length > 0) {
      await admin.from('hardware_catalog').delete().in('id', catalogIds);
      catalogIds.length = 0;
    }
  });

  it('inserts a movement of type received and verifies it records correctly', async () => {
    const { data: catalogItem, error: catalogError } = await admin
      .from('hardware_catalog')
      .insert({ sku: 'MOV-TEST-001', name: 'Movement Test Item', unit_cost: 75.0 })
      .select()
      .single();

    expect(catalogError).toBeNull();
    catalogIds.push(catalogItem!.id);

    const { data: movement, error } = await admin
      .from('inventory_movements')
      .insert({
        hardware_catalog_id: catalogItem!.id,
        movement_type: 'purchase_order_received',
        qty_delta: 10,
        notes: 'Initial stock received',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(movement).not.toBeNull();
    movementIds.push(movement!.id);

    expect(movement!.hardware_catalog_id).toBe(catalogItem!.id);
    expect(movement!.movement_type).toBe('purchase_order_received');
    expect(movement!.qty_delta).toBe(10);
    expect(movement!.notes).toBe('Initial stock received');
    expect(movement!.id).toBeTruthy();
    expect(movement!.created_at).toBeTruthy();
  });

  it('inserts movements of each type: received, allocated, shipped, adjusted, returned', async () => {
    const { data: catalogItem, error: catalogError } = await admin
      .from('hardware_catalog')
      .insert({ sku: 'MOV-TYPES-001', name: 'Movement Types Item', unit_cost: 30.0 })
      .select()
      .single();

    expect(catalogError).toBeNull();
    catalogIds.push(catalogItem!.id);

    const movementTypes = [
      'purchase_order_received',
      'project_allocated',
      'project_shipped',
      'adjustment_increase',
      'adjustment_decrease',
      'return',
    ] as const;

    for (const movementType of movementTypes) {
      const { data: movement, error } = await admin
        .from('inventory_movements')
        .insert({
          hardware_catalog_id: catalogItem!.id,
          movement_type: movementType,
          qty_delta: 1,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(movement).not.toBeNull();
      movementIds.push(movement!.id);
      expect(movement!.movement_type).toBe(movementType);
    }
  });

  it('reference and project_id are nullable: insert with and without reference', async () => {
    const { data: catalogItem, error: catalogError } = await admin
      .from('hardware_catalog')
      .insert({ sku: 'MOV-REF-001', name: 'Reference Test Item', unit_cost: 45.0 })
      .select()
      .single();

    expect(catalogError).toBeNull();
    catalogIds.push(catalogItem!.id);

    // Insert without reference
    const { data: noRef, error: noRefError } = await admin
      .from('inventory_movements')
      .insert({
        hardware_catalog_id: catalogItem!.id,
        movement_type: 'adjustment_increase',
        qty_delta: 2,
      })
      .select()
      .single();

    expect(noRefError).toBeNull();
    movementIds.push(noRef!.id);
    expect(noRef!.reference).toBeNull();
    expect(noRef!.project_id).toBeNull();

    // Insert with reference
    const { data: withRef, error: withRefError } = await admin
      .from('inventory_movements')
      .insert({
        hardware_catalog_id: catalogItem!.id,
        movement_type: 'project_allocated',
        qty_delta: 3,
        reference: 'PO-2026-001',
      })
      .select()
      .single();

    expect(withRefError).toBeNull();
    movementIds.push(withRef!.id);
    expect(withRef!.reference).toBe('PO-2026-001');
  });
});
