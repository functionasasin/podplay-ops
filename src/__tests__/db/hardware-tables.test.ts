// Integration tests: hardware tables (hardware_catalog, bom_templates, project_bom_items)
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

// ─── hardware_catalog ──────────────────────────────────────────────────────────

describe('hardware_catalog table', () => {
  const insertedIds: string[] = [];

  afterEach(async () => {
    if (insertedIds.length > 0) {
      await admin.from('hardware_catalog').delete().in('id', insertedIds);
      insertedIds.length = 0;
    }
  });

  it('inserts a catalog item with all fields and selects it back', async () => {
    const { data, error } = await admin
      .from('hardware_catalog')
      .insert({
        sku: 'TEST-CAM-001',
        name: 'Test Camera',
        vendor: 'Acme Corp',
        category: 'camera',
        unit_cost: 299.99,
        description: 'A test camera for integration testing',
        is_active: true,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    insertedIds.push(data!.id);

    expect(data).toMatchObject({
      sku: 'TEST-CAM-001',
      name: 'Test Camera',
      vendor: 'Acme Corp',
      category: 'camera',
      description: 'A test camera for integration testing',
      is_active: true,
    });
    expect(parseFloat(data!.unit_cost)).toBeCloseTo(299.99, 2);
    expect(data!.id).toBeTruthy();
    expect(data!.created_at).toBeTruthy();
    expect(data!.updated_at).toBeTruthy();
  });

  it('rejects a duplicate SKU with a unique constraint violation', async () => {
    const sku = 'TEST-DUPE-SKU-001';

    const { data: first, error: firstError } = await admin
      .from('hardware_catalog')
      .insert({ sku, name: 'First Item', unit_cost: 10.0 })
      .select()
      .single();

    expect(firstError).toBeNull();
    insertedIds.push(first!.id);

    const { error: dupeError } = await admin
      .from('hardware_catalog')
      .insert({ sku, name: 'Duplicate Item', unit_cost: 20.0 })
      .select()
      .single();

    expect(dupeError).not.toBeNull();
    // Postgres unique violation code
    expect(dupeError!.code).toBe('23505');
  });
});

// ─── bom_templates ─────────────────────────────────────────────────────────────

describe('bom_templates table', () => {
  const catalogIds: string[] = [];
  const templateIds: string[] = [];

  afterEach(async () => {
    if (templateIds.length > 0) {
      await admin.from('bom_templates').delete().in('id', templateIds);
      templateIds.length = 0;
    }
    if (catalogIds.length > 0) {
      await admin.from('hardware_catalog').delete().in('id', catalogIds);
      catalogIds.length = 0;
    }
  });

  it('creates a bom_template linked to a catalog item and tier', async () => {
    const { data: catalogItem, error: catalogError } = await admin
      .from('hardware_catalog')
      .insert({ sku: 'BOM-TPL-ITEM-001', name: 'BOM Template Camera', unit_cost: 150.0 })
      .select()
      .single();

    expect(catalogError).toBeNull();
    catalogIds.push(catalogItem!.id);

    const { data: template, error: templateError } = await admin
      .from('bom_templates')
      .insert({
        tier: 'pro',
        item_id: catalogItem!.id,
        default_quantity: 4,
        is_required: true,
      })
      .select()
      .single();

    expect(templateError).toBeNull();
    expect(template).not.toBeNull();
    templateIds.push(template!.id);

    expect(template).toMatchObject({
      tier: 'pro',
      item_id: catalogItem!.id,
      default_quantity: 4,
      is_required: true,
    });
    expect(template!.id).toBeTruthy();
    expect(template!.created_at).toBeTruthy();
  });
});

// ─── project_bom_items ─────────────────────────────────────────────────────────

describe('project_bom_items table', () => {
  const projectIds: string[] = [];
  const catalogIds: string[] = [];
  const bomItemIds: string[] = [];

  afterEach(async () => {
    if (bomItemIds.length > 0) {
      await admin.from('project_bom_items').delete().in('id', bomItemIds);
      bomItemIds.length = 0;
    }
    if (projectIds.length > 0) {
      await admin.from('projects').delete().in('id', projectIds);
      projectIds.length = 0;
    }
    if (catalogIds.length > 0) {
      await admin.from('hardware_catalog').delete().in('id', catalogIds);
      catalogIds.length = 0;
    }
  });

  it('creates a project_bom_item linked to a project and catalog item', async () => {
    const { data: project, error: projectError } = await admin
      .from('projects')
      .insert({ customer_name: 'BOM Test Club', venue_name: 'BOM Venue', tier: 'pro', court_count: 2 })
      .select()
      .single();

    expect(projectError).toBeNull();
    projectIds.push(project!.id);

    const { data: catalogItem, error: catalogError } = await admin
      .from('hardware_catalog')
      .insert({ sku: 'BOM-PROJ-ITEM-001', name: 'Project BOM Camera', unit_cost: 200.0 })
      .select()
      .single();

    expect(catalogError).toBeNull();
    catalogIds.push(catalogItem!.id);

    const { data: bomItem, error: bomError } = await admin
      .from('project_bom_items')
      .insert({
        project_id: project!.id,
        catalog_item_id: catalogItem!.id,
        quantity: 3,
        notes: 'Test BOM item',
      })
      .select()
      .single();

    expect(bomError).toBeNull();
    expect(bomItem).not.toBeNull();
    bomItemIds.push(bomItem!.id);

    expect(bomItem).toMatchObject({
      project_id: project!.id,
      catalog_item_id: catalogItem!.id,
      quantity: 3,
      notes: 'Test BOM item',
    });
    expect(bomItem!.id).toBeTruthy();
    expect(bomItem!.created_at).toBeTruthy();
    expect(bomItem!.updated_at).toBeTruthy();
  });

  it('unit_cost_override is nullable; catalog unit_cost is read independently when override is null', async () => {
    const { data: project } = await admin
      .from('projects')
      .insert({ customer_name: 'Override Test Club', venue_name: 'Override Venue', tier: 'pro', court_count: 1 })
      .select()
      .single();
    projectIds.push(project!.id);

    const { data: catalogItem } = await admin
      .from('hardware_catalog')
      .insert({ sku: 'OVERRIDE-ITEM-001', name: 'Override Test Item', unit_cost: 99.99 })
      .select()
      .single();
    catalogIds.push(catalogItem!.id);

    // Insert without unit_cost_override — should be null
    const { data: bomItem, error } = await admin
      .from('project_bom_items')
      .insert({
        project_id: project!.id,
        catalog_item_id: catalogItem!.id,
        quantity: 1,
      })
      .select()
      .single();

    expect(error).toBeNull();
    bomItemIds.push(bomItem!.id);

    // unit_cost_override is null — application falls back to catalog unit_cost
    expect(bomItem!.unit_cost_override).toBeNull();

    // Catalog unit_cost is still accessible
    const { data: cat } = await admin
      .from('hardware_catalog')
      .select('unit_cost')
      .eq('id', catalogItem!.id)
      .single();
    expect(parseFloat(cat!.unit_cost)).toBeCloseTo(99.99, 2);
  });
});

// ─── FK constraint: RESTRICT on catalog delete ─────────────────────────────────

describe('FK constraint: RESTRICT on catalog item deletion', () => {
  it('prevents deleting a hardware_catalog item referenced by bom_template', async () => {
    const { data: catalogItem } = await admin
      .from('hardware_catalog')
      .insert({ sku: 'FK-RESTRICT-TEST-001', name: 'Restricted Item', unit_cost: 50.0 })
      .select()
      .single();

    const { data: template } = await admin
      .from('bom_templates')
      .insert({ tier: 'autonomous', item_id: catalogItem!.id, default_quantity: 1 })
      .select()
      .single();

    // Attempting to delete the catalog item while a bom_template references it should fail
    const { error: deleteError } = await admin
      .from('hardware_catalog')
      .delete()
      .eq('id', catalogItem!.id);

    expect(deleteError).not.toBeNull();
    // Postgres FK violation code
    expect(deleteError!.code).toBe('23503');

    // Cleanup: remove template first, then catalog item
    await admin.from('bom_templates').delete().eq('id', template!.id);
    await admin.from('hardware_catalog').delete().eq('id', catalogItem!.id);
  });
});

// ─── FK cascade: project delete cascades to project_bom_items ─────────────────

describe('FK cascade: deleting project removes project_bom_items', () => {
  it('deletes project_bom_items when the parent project is deleted', async () => {
    const { data: project } = await admin
      .from('projects')
      .insert({ customer_name: 'Cascade Test Club', venue_name: 'Cascade Venue', tier: 'pro', court_count: 1 })
      .select()
      .single();

    const { data: catalogItem } = await admin
      .from('hardware_catalog')
      .insert({ sku: 'CASCADE-ITEM-001', name: 'Cascade Test Item', unit_cost: 10.0 })
      .select()
      .single();

    const { data: bomItem } = await admin
      .from('project_bom_items')
      .insert({ project_id: project!.id, catalog_item_id: catalogItem!.id, quantity: 1 })
      .select()
      .single();

    const bomItemId = bomItem!.id;

    // Delete the project — should cascade to project_bom_items
    await admin.from('projects').delete().eq('id', project!.id);

    // Verify the bom item no longer exists
    const { data: orphan, error } = await admin
      .from('project_bom_items')
      .select()
      .eq('id', bomItemId)
      .single();

    expect(orphan).toBeNull();
    // PGRST116 = row not found
    expect(error).not.toBeNull();

    // Cleanup catalog item (bom items already cascaded away)
    await admin.from('hardware_catalog').delete().eq('id', catalogItem!.id);
  });
});
