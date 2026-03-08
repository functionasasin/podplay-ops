// BOM generation service — implements generateBom() and regenerateBom()
// Full algorithm from final-mega-spec/business-logic/bom-generation.md

import { supabase } from '@/lib/supabase';

interface BomItemInsert {
  project_id: string;
  hardware_catalog_id: string;
  qty: number;
  unit_cost: number | null;
  shipping_rate: number;
  margin: number;
  notes: string | null;
}

/**
 * generateBom
 *
 * Called once per project immediately after project row is inserted/updated.
 * Reads bom_templates for the project's tier, applies sizing substitutions,
 * adds conditional items, attaches cost chain from settings, and batch-inserts
 * all rows into project_bom_items.
 *
 * @param projectId - UUID of the project
 * @returns count of BOM items inserted, or error string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function generateBom(projectId: string): Promise<{ count: number; error: string | null }> {
  // Load project
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: project, error: projectErr } = await (supabase.from('projects') as any)
    .select('*')
    .eq('id', projectId)
    .single();
  if (projectErr || !project) {
    return { count: 0, error: projectErr?.message ?? 'Project not found' };
  }

  // Load settings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: settingsRows } = await (supabase.from('settings') as any)
    .select('key, value');
  const settings = buildSettingsMap(settingsRows ?? []);

  // Load BOM template rows for this tier
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: templateRows, error: templateErr } = await (supabase.from('bom_templates') as any)
    .select(`
      qty_per_venue, qty_per_court, qty_per_door, qty_per_camera,
      sort_order,
      hardware_catalog!inner (
        id, sku, name, unit_cost, category
      )
    `)
    .eq('tier', project.tier)
    .order('sort_order', { ascending: true });
  if (templateErr) return { count: 0, error: templateErr.message };

  // Load full hardware catalog for substitutions and conditional items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: catalog } = await (supabase.from('hardware_catalog') as any)
    .select('id, sku, unit_cost, category')
    .eq('is_active', true);
  const catalogBySku: Record<string, { id: string; unit_cost: number | null }> = Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (catalog ?? []).map((item: any) => [item.sku, item])
  );

  const items: BomItemInsert[] = [];

  // Step 2 + 3: Apply qty formula + sizing substitutions per template row
  for (const row of templateRows ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cat = row.hardware_catalog as any;
    let sku: string = cat.sku;
    let catalogId: string = cat.id;
    let unitCost: number | null = cat.unit_cost;

    const rawQty =
      row.qty_per_venue +
      row.qty_per_court * project.court_count +
      row.qty_per_door * (project.door_count ?? 0) +
      row.qty_per_camera * (project.security_camera_count ?? 0);

    if (rawQty === 0) continue; // Skip zero-qty items

    let qty = rawQty;

    // 3A: SSD substitution
    if (sku === 'REPLAY-SSD-1TB') {
      const targetSku = selectSsdSku(project.court_count);
      if (targetSku !== sku) {
        const sub = catalogBySku[targetSku];
        if (sub) { sku = targetSku; catalogId = sub.id; unitCost = sub.unit_cost; }
      }
    }

    // 3B: Switch substitution
    if (sku === 'NET-USW-PRO-24-POE') {
      const switchCfg =
        project.tier === 'autonomous' || project.tier === 'autonomous_plus'
          ? selectSwitchConfigAutonomous(project.court_count, project.security_camera_count ?? 0)
          : selectSwitchConfig(project.court_count);
      if (switchCfg.sku !== sku) {
        const sub = catalogBySku[switchCfg.sku];
        if (sub) { sku = switchCfg.sku; catalogId = sub.id; unitCost = sub.unit_cost; }
      }
      qty = switchCfg.qty;
    }

    // 3C: NVR substitution (autonomous_plus only)
    if (sku === 'SURV-NVR-4BAY') {
      const targetSku = selectNvrSku(project.security_camera_count ?? 0);
      if (targetSku !== sku) {
        const sub = catalogBySku[targetSku];
        if (sub) { sku = targetSku; catalogId = sub.id; unitCost = sub.unit_cost; }
      }
    }

    items.push({
      project_id: projectId,
      hardware_catalog_id: catalogId,
      qty,
      unit_cost: unitCost,
      shipping_rate: settings.shipping_rate,
      margin: settings.target_margin,
      notes: null,
    });
  }

  // Step 4A: Front desk items
  if (project.has_front_desk) {
    for (const frontDeskSku of ['DESK-CC-TERMINAL', 'DESK-QR-SCANNER', 'DESK-WEBCAM']) {
      const item = catalogBySku[frontDeskSku];
      if (item) {
        items.push({
          project_id: projectId,
          hardware_catalog_id: item.id,
          qty: 1,
          unit_cost: item.unit_cost,
          shipping_rate: settings.shipping_rate,
          margin: settings.target_margin,
          notes: null,
        });
      }
    }
  }

  // Step 4B: PingPod WiFi AP
  if (project.has_pingpod_wifi) {
    const item = catalogBySku['PP-WIFI-AP'];
    if (item) {
      items.push({
        project_id: projectId,
        hardware_catalog_id: item.id,
        qty: 1,
        unit_cost: item.unit_cost,
        shipping_rate: settings.shipping_rate,
        margin: settings.target_margin,
        notes: null,
      });
    }
  }

  // Batch insert all BOM items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertErr } = await (supabase.from('project_bom_items') as any).insert(items);

  if (insertErr) return { count: 0, error: insertErr.message };
  return { count: items.length, error: null };
}

/**
 * regenerateBom
 *
 * Deletes existing BOM items for a project and re-generates from scratch.
 */
export async function regenerateBom(projectId: string): Promise<{ count: number; error: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: deleteErr } = await (supabase.from('project_bom_items') as any)
    .delete()
    .eq('project_id', projectId);
  if (deleteErr) return { count: 0, error: deleteErr.message };

  return generateBom(projectId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Sizing helpers
// ─────────────────────────────────────────────────────────────────────────────

function selectSsdSku(courtCount: number): string {
  if (courtCount <= 4) return 'REPLAY-SSD-1TB';
  if (courtCount <= 8) return 'REPLAY-SSD-2TB';
  return 'REPLAY-SSD-4TB';
}

export function selectSwitchConfig(courtCount: number): { sku: string; qty: number } {
  if (courtCount <= 8) return { sku: 'NET-USW-PRO-24-POE', qty: 1 };
  if (courtCount <= 16) return { sku: 'NET-USW-PRO-48-POE', qty: 1 };
  return { sku: 'NET-USW-PRO-48-POE', qty: 2 };
}

export function selectSwitchConfigAutonomous(
  courtCount: number,
  securityCameraCount: number
): { sku: string; qty: number } {
  const portsNeeded = courtCount * 3 + 1 + 1 + securityCameraCount;
  if (portsNeeded <= 22) return { sku: 'NET-USW-PRO-24-POE', qty: 1 };
  if (portsNeeded <= 46) return { sku: 'NET-USW-PRO-48-POE', qty: 1 };
  return { sku: 'NET-USW-PRO-48-POE', qty: 2 };
}

function selectNvrSku(securityCameraCount: number): string {
  return securityCameraCount <= 4 ? 'SURV-NVR-4BAY' : 'SURV-NVR-7BAY';
}

function buildSettingsMap(rows: { key: string; value: string }[]): {
  shipping_rate: number;
  target_margin: number;
} {
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    shipping_rate: parseFloat(map['shipping_rate'] ?? '0.10'),
    target_margin: parseFloat(map['target_margin'] ?? '0.10'),
  };
}
