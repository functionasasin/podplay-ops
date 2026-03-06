# Business Logic: BOM Generation

**Aspect**: logic-bom-generation
**Wave**: 3 — Business Logic & Workflows
**Date**: 2026-03-06
**MRP Source**: Per-customer BOM tabs; COST ANALYSIS sheet; BOM template sheet (per tier)
**Schema Reference**: `final-mega-spec/data-model/schema.md` — `hardware_catalog`, `bom_templates`, `project_bom_items`
**Seed Reference**: `final-mega-spec/data-model/seed-data.md` — Section 2 (hardware catalog), Section 3 (BOM templates)

---

## Overview

BOM generation is triggered once per project at the moment the intake wizard (Stage 1) is submitted.
It populates `project_bom_items` with one row per hardware item, with quantities computed from the
project's parameters and costs copied from `hardware_catalog`.

The BOM is **editable after generation** — the ops person can override quantities, swap SKUs, and
adjust costs in Stage 2 (Procurement). The generation algorithm produces a sensible starting point;
the human reviews it.

**Trigger**: `createProject()` service call at the end of Stage 1 wizard submission.
**End state**: `project_bom_items` fully populated, ready for Stage 2 review.

---

## Inputs

| Input | Source | Type | Notes |
|-------|--------|------|-------|
| `tier` | `projects.tier` | `service_tier` enum | Determines template rows |
| `court_count` | `projects.court_count` | integer ≥ 1 | Multiplier for per-court items |
| `door_count` | `projects.door_count` | integer ≥ 0 | Multiplier for per-door items; 0 for Pro/PBK |
| `security_camera_count` | `projects.security_camera_count` | integer ≥ 0 | Multiplier for per-camera items; 0 for Pro/PBK/Autonomous |
| `has_front_desk` | `projects.has_front_desk` | boolean | Adds DESK-* items when true |
| `has_pingpod_wifi` | `projects.has_pingpod_wifi` | boolean | Adds PP-WIFI-AP item when true |
| `settings` | `settings` table | object | `shipping_rate`, `target_margin` defaults |

---

## Algorithm

The generation runs in 5 sequential steps. All steps are client-side TypeScript executed inside
the `createProject()` service function. No Postgres functions or triggers are involved — the
client computes everything and INSERTs the resulting rows in a single batch.

### Step 1: Load Template Rows for Tier

```typescript
const templateRows = await supabase
  .from('bom_templates')
  .select(`
    id,
    qty_per_venue,
    qty_per_court,
    qty_per_door,
    qty_per_camera,
    sort_order,
    hardware_catalog_id,
    hardware_catalog (
      id,
      sku,
      name,
      unit_cost,
      category
    )
  `)
  .eq('tier', project.tier)
  .order('sort_order', { ascending: true });
```

Returns N rows (see counts below by tier). These are the base items before conditional modifications.

| Tier | Template row count | Notes |
|------|--------------------|-------|
| `pro` | 22 rows | Core replay + display + network rack |
| `autonomous` | 26 rows | Pro + Kisi (2) + G5 cameras (2) |
| `autonomous_plus` | 29 rows | Autonomous + NVR (1) + hard drives (1) + extra SFP DAC (1) |
| `pbk` | 22 rows | Identical to Pro; pricing handled via settings |

### Step 2: Apply Base Quantity Formula

For each template row, compute the base quantity:

```typescript
function computeBaseQty(
  row: BomTemplateRow,
  project: Project
): number {
  return (
    row.qty_per_venue +
    row.qty_per_court * project.court_count +
    row.qty_per_door * project.door_count +
    row.qty_per_camera * project.security_camera_count
  );
}
```

**Rules**:
- `door_count` is always 0 for `pro` and `pbk` tiers (enforced during intake validation); per-door
  qty terms evaluate to 0 for those tiers
- `security_camera_count` is always 0 for `pro`, `pbk`, and `autonomous` tiers; per-camera qty
  terms evaluate to 0
- Items with `qty = 0` after formula evaluation are **excluded** from `project_bom_items` entirely
  (do not insert zero-qty rows)

### Step 3: Apply Sizing Substitutions

Three items in the template default to the smallest/cheapest option. The generator must
**swap these out** based on project parameters before inserting rows.

#### 3A. SSD Sizing (Replay Storage)

The template defaults to `REPLAY-SSD-1TB`. Replace based on `court_count`:

| `court_count` range | SSD SKU | Name | Unit cost |
|--------------------|---------|------|-----------|
| 1 – 4 courts | `REPLAY-SSD-1TB` | Samsung T7 1TB | $90.00 |
| 5 – 8 courts | `REPLAY-SSD-2TB` | Samsung T7 2TB | $160.00 |
| 9+ courts | `REPLAY-SSD-4TB` | Samsung T7 4TB | $310.00 |

```typescript
function selectSsdSku(courtCount: number): string {
  if (courtCount <= 4) return 'REPLAY-SSD-1TB';
  if (courtCount <= 8) return 'REPLAY-SSD-2TB';
  return 'REPLAY-SSD-4TB';
}
```

Implementation: when processing the template row with `sku = 'REPLAY-SSD-1TB'`, replace
`hardware_catalog_id` (and the associated cost data) with the row matching the correct SKU.

#### 3B. Switch Sizing (Port Count)

The template defaults to `NET-USW-PRO-24-POE`. Replace based on `court_count`:

Each court needs 3 PoE drops (replay camera, iPad, Apple TV) plus 1 patch panel port.
Additional ports: Mac Mini (1), UDM uplink via SFP (does not consume switch PoE ports), spare (2–4).

| `court_count` range | Switch SKU | Name | qty_per_venue | Notes |
|--------------------|-----------|------|--------------|-------|
| 1 – 7 courts | `NET-USW-PRO-24-POE` | USW-Pro-24-POE | 1 | 7 courts × 3 drops = 21 ports + Mac Mini + spares = ~24 |
| 8 courts | `NET-USW-PRO-24-POE` | USW-Pro-24-POE | 1 | 8 × 3 = 24 ports — exactly fits; no spares |
| 9+ courts | `NET-USW-PRO-48-POE` | USW-Pro-48-POE | 1 | 9 × 3 = 27 ports; 48-port required |
| 17+ courts | `NET-USW-PRO-48-POE` × 2 | USW-Pro-48-POE | 2 | 17 × 3 = 51 ports > 48; second switch needed |

```typescript
function selectSwitchConfig(courtCount: number): { sku: string; qty: number } {
  if (courtCount <= 8) return { sku: 'NET-USW-PRO-24-POE', qty: 1 };
  if (courtCount <= 16) return { sku: 'NET-USW-PRO-48-POE', qty: 1 };
  return { sku: 'NET-USW-PRO-48-POE', qty: 2 };
}
```

**Autonomous/Autonomous+ note**: Kisi controller, NVR, and security cameras consume additional
switch ports. For `autonomous`/`autonomous_plus`, adjust the threshold down by the number of
non-court PoE devices:
- Kisi controller: 1 port
- NVR: 1 port (connected via SFP DAC, not a switch PoE port — does NOT reduce threshold)
- Each security camera: 1 PoE port on the Surveillance VLAN

For Autonomous tiers, effective threshold for 48-port switch:
```typescript
function selectSwitchConfigAutonomous(
  courtCount: number,
  securityCameraCount: number
): { sku: string; qty: number } {
  // Total PoE ports needed:
  // court drops (3/court) + Mac Mini (1) + Kisi controller (1)
  // + security cameras (1 each)
  const ports = courtCount * 3 + 1 + 1 + securityCameraCount;
  if (ports <= 23) return { sku: 'NET-USW-PRO-24-POE', qty: 1 }; // 23 leaves 1 spare
  if (ports <= 46) return { sku: 'NET-USW-PRO-48-POE', qty: 1 }; // 46 leaves 2 spare
  return { sku: 'NET-USW-PRO-48-POE', qty: 2 };
}
```

Apply `selectSwitchConfig` for `pro`/`pbk`; apply `selectSwitchConfigAutonomous` for
`autonomous`/`autonomous_plus`.

#### 3C. NVR Sizing (Autonomous+ only)

Applies only when `tier === 'autonomous_plus'`. Template defaults to `SURV-NVR-4BAY`.
Replace based on `security_camera_count`:

| `security_camera_count` range | NVR SKU | Name | Drive bays |
|------------------------------|---------|------|-----------|
| 1 – 4 cameras | `SURV-NVR-4BAY` | UniFi UNVR | 4-bay |
| 5+ cameras | `SURV-NVR-7BAY` | UniFi UNVR-Pro | 7-bay |

```typescript
function selectNvrSku(securityCameraCount: number): string {
  return securityCameraCount <= 4 ? 'SURV-NVR-4BAY' : 'SURV-NVR-7BAY';
}
```

Hard drive quantity (`SURV-HDD-8TB`) uses `qty_per_camera = 1` in the template — one 8TB WD Purple
per security camera. No substitution needed; the template formula handles this automatically.

### Step 4: Add Conditional Items

After processing all template rows, append additional items based on project flags.

#### 4A. Front Desk Equipment (`has_front_desk = true`)

When `project.has_front_desk === true`, add these three items at `qty = 1` each:

| SKU | Name | Category |
|-----|------|----------|
| `DESK-CC-TERMINAL` | BBPOS WisePOS E CC Terminal | `front_desk` |
| `DESK-QR-SCANNER` | 2D QR Barcode Scanner | `front_desk` |
| `DESK-WEBCAM` | Anker PowerConf C200 2K Webcam | `front_desk` |

```typescript
async function addFrontDeskItems(
  projectId: string,
  bomItems: BomItemDraft[]
): Promise<void> {
  const frontDeskSkus = ['DESK-CC-TERMINAL', 'DESK-QR-SCANNER', 'DESK-WEBCAM'];
  const frontDeskCatalog = await supabase
    .from('hardware_catalog')
    .select('*')
    .in('sku', frontDeskSkus);

  for (const item of frontDeskCatalog.data!) {
    bomItems.push({
      hardware_catalog_id: item.id,
      qty: 1,
      unit_cost: item.unit_cost,
      // cost chain computed in Step 5
    });
  }
}
```

These items are also tracked in the `cc_terminals` table (CC terminal only) — `ensureFrontDeskRecords()`
creates that row simultaneously. See `model-cc-terminals` analysis and `logic-customer-onboarding` doc.

#### 4B. PingPod WiFi AP (`has_pingpod_wifi = true`)

When `project.has_pingpod_wifi === true`, add one WiFi AP:

| SKU | Name | qty | Category |
|-----|------|-----|----------|
| `PP-WIFI-AP` | UniFi U6-Plus WiFi AP | 1 | `pingpod_specific` |

```typescript
async function addPingPodItems(
  projectId: string,
  bomItems: BomItemDraft[]
): Promise<void> {
  const ap = await supabase
    .from('hardware_catalog')
    .select('*')
    .eq('sku', 'PP-WIFI-AP')
    .single();

  bomItems.push({
    hardware_catalog_id: ap.data!.id,
    qty: 1,
    unit_cost: ap.data!.unit_cost,
  });
}
```

When `has_pingpod_wifi = true`, the UI in Stage 2 also shows a **color swap suggestion**:
> "This is a PingPod venue. Consider switching camera variants to black:
> REPLAY-CAMERA-WHITE → REPLAY-CAMERA-BLACK, SURV-CAMERA-WHITE → SURV-CAMERA-BLACK."

This is a UI warning only; the actual swap is performed manually by the operator in the BOM review
step. No automatic color swap in the generation algorithm.

### Step 5: Compute Cost Chain Per Item

For each draft BOM item, attach the cost chain values copied from `settings`:

```typescript
function computeCostChain(
  qty: number,
  unitCost: number | null,
  settings: Settings
): BomCostChain {
  if (unitCost === null) {
    return {
      unit_cost: null,
      shipping_rate: settings.shipping_rate,
      margin: settings.target_margin,
      // est_total_cost, landed_cost, customer_price = NULL (computed column via GENERATED ALWAYS)
    };
  }

  return {
    unit_cost: unitCost,
    shipping_rate: settings.shipping_rate,   // default 0.10 (10%)
    margin: settings.target_margin,           // default 0.10 (10%)
    // Postgres GENERATED ALWAYS columns compute:
    //   est_total_cost = qty × unit_cost
    //   landed_cost    = est_total_cost × (1 + shipping_rate)
    //   customer_price = landed_cost / (1 - margin)
  };
}
```

The three cost values (`est_total_cost`, `landed_cost`, `customer_price`) are Postgres
`GENERATED ALWAYS AS ... STORED` columns — they are never written by the client; they recompute
automatically whenever `qty`, `unit_cost`, `shipping_rate`, or `margin` change.

**Cost chain example — Mac Mini (1 unit)**:
```
unit_cost      = $700.00
qty            = 1
shipping_rate  = 0.10

est_total_cost = 1 × $700.00 = $700.00
landed_cost    = $700.00 × 1.10 = $770.00
customer_price = $770.00 / 0.90 = $855.56
```

**Cost chain example — Apple TV (6 courts)**:
```
unit_cost      = $180.00
qty            = 6
shipping_rate  = 0.10

est_total_cost = 6 × $180.00 = $1,080.00
landed_cost    = $1,080.00 × 1.10 = $1,188.00
customer_price = $1,188.00 / 0.90 = $1,320.00
```

---

## Complete Service Function

```typescript
// src/services/bom.ts

import { supabase } from '@/lib/supabase';
import type { Project } from '@/types/project';
import type { Settings } from '@/types/settings';

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
 * Called once per project immediately after project row is inserted.
 * Reads bom_templates for the project's tier, applies sizing substitutions,
 * adds conditional items, attaches cost chain from settings, and batch-inserts
 * all rows into project_bom_items.
 *
 * @param projectId - UUID of the newly created project
 * @returns number of BOM items inserted
 */
export async function generateBom(
  projectId: string
): Promise<{ count: number; error: string | null }> {
  // Load project
  const { data: project, error: projectErr } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  if (projectErr || !project) {
    return { count: 0, error: projectErr?.message ?? 'Project not found' };
  }

  // Load settings
  const { data: settingsRows } = await supabase
    .from('settings')
    .select('key, value');
  const settings = buildSettingsMap(settingsRows ?? []);

  // Load BOM template rows for this tier
  const { data: templateRows, error: templateErr } = await supabase
    .from('bom_templates')
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
  const { data: catalog } = await supabase
    .from('hardware_catalog')
    .select('id, sku, unit_cost, category')
    .eq('is_active', true);
  const catalogBySku = Object.fromEntries(
    (catalog ?? []).map(item => [item.sku, item])
  );

  const items: BomItemInsert[] = [];

  // Step 2 + 3: Apply qty formula + sizing substitutions per template row
  for (const row of templateRows ?? []) {
    const cat = row.hardware_catalog as { id: string; sku: string; unit_cost: number | null };
    let sku = cat.sku;
    let catalogId = cat.id;
    let unitCost = cat.unit_cost;

    const rawQty =
      row.qty_per_venue +
      row.qty_per_court * project.court_count +
      row.qty_per_door * project.door_count +
      row.qty_per_camera * project.security_camera_count;

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
          ? selectSwitchConfigAutonomous(project.court_count, project.security_camera_count)
          : selectSwitchConfig(project.court_count);
      if (switchCfg.sku !== sku) {
        const sub = catalogBySku[switchCfg.sku];
        if (sub) { sku = switchCfg.sku; catalogId = sub.id; unitCost = sub.unit_cost; }
      }
      qty = switchCfg.qty;
    }

    // 3C: NVR substitution (autonomous_plus only)
    if (sku === 'SURV-NVR-4BAY') {
      const targetSku = selectNvrSku(project.security_camera_count);
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
    for (const sku of ['DESK-CC-TERMINAL', 'DESK-QR-SCANNER', 'DESK-WEBCAM']) {
      const item = catalogBySku[sku];
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
  const { error: insertErr } = await supabase
    .from('project_bom_items')
    .insert(items);

  if (insertErr) return { count: 0, error: insertErr.message };
  return { count: items.length, error: null };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sizing helpers
// ─────────────────────────────────────────────────────────────────────────────

function selectSsdSku(courtCount: number): string {
  if (courtCount <= 4) return 'REPLAY-SSD-1TB';
  if (courtCount <= 8) return 'REPLAY-SSD-2TB';
  return 'REPLAY-SSD-4TB';
}

function selectSwitchConfig(courtCount: number): { sku: string; qty: number } {
  if (courtCount <= 8) return { sku: 'NET-USW-PRO-24-POE', qty: 1 };
  if (courtCount <= 16) return { sku: 'NET-USW-PRO-48-POE', qty: 1 };
  return { sku: 'NET-USW-PRO-48-POE', qty: 2 };
}

function selectSwitchConfigAutonomous(
  courtCount: number,
  securityCameraCount: number
): { sku: string; qty: number } {
  // PoE port budget: 3 per court + Mac Mini (1) + Kisi controller (1) + security cameras (1 each)
  const portsNeeded = courtCount * 3 + 1 + 1 + securityCameraCount;
  // Leave 1–2 spare ports per switch for headroom
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
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return {
    shipping_rate: parseFloat(map['shipping_rate'] ?? '0.10'),
    target_margin: parseFloat(map['target_margin'] ?? '0.10'),
  };
}
```

---

## BOM Regeneration

The operator can trigger BOM regeneration from Stage 2 (Procurement review) via a "Regenerate BOM"
button. This is used when project parameters change after initial creation (e.g., court count updated).

```typescript
export async function regenerateBom(projectId: string): Promise<{ count: number; error: string | null }> {
  // Delete existing BOM items for this project
  const { error: deleteErr } = await supabase
    .from('project_bom_items')
    .delete()
    .eq('project_id', projectId);
  if (deleteErr) return { count: 0, error: deleteErr.message };

  // Re-generate from scratch
  return generateBom(projectId);
}
```

**Warning**: Regeneration overwrites all manually edited quantities, SKU swaps, and per-line notes.
The UI must show a confirmation dialog before triggering:
> "Regenerating the BOM will overwrite all manual changes including custom quantities, SKU swaps,
> and notes. This cannot be undone. Continue?"

---

## Validation Guards

Before executing BOM generation, validate inputs:

```typescript
function validateBomInputs(project: Project): string | null {
  if (project.court_count < 1) return 'Court count must be at least 1';
  if (project.court_count > 50) return 'Court count cannot exceed 50';
  if ((project.tier === 'autonomous' || project.tier === 'autonomous_plus') && project.door_count < 1) {
    return 'Autonomous tier requires at least 1 door';
  }
  if (project.tier === 'autonomous_plus' && project.security_camera_count < 1) {
    return 'Autonomous+ tier requires at least 1 security camera';
  }
  return null; // valid
}
```

These validations are also enforced at the intake form level (Stage 1), so reaching BOM generation
with invalid inputs should not be possible in normal flow. The service-level guard is a safety net.

---

## BOM Totals Computation (Client-Side)

The Stage 2 BOM review page displays aggregate totals. These are computed client-side from
`project_bom_items` rows (using the `GENERATED ALWAYS` column values from Postgres):

```typescript
interface BomTotals {
  total_qty_lines: number;      // number of BOM line items
  total_est_cost: number;       // sum of est_total_cost across all lines
  total_landed_cost: number;    // sum of landed_cost across all lines
  total_customer_price: number; // sum of customer_price across all lines (hardware subtotal)
  gross_margin_pct: number;     // (total_customer_price - total_est_cost) / total_customer_price
}

function computeBomTotals(items: ProjectBomItem[]): BomTotals {
  let total_qty_lines = items.length;
  let total_est_cost = 0;
  let total_landed_cost = 0;
  let total_customer_price = 0;

  for (const item of items) {
    total_est_cost += item.est_total_cost ?? 0;
    total_landed_cost += item.landed_cost ?? 0;
    total_customer_price += item.customer_price ?? 0;
  }

  const gross_margin_pct =
    total_customer_price > 0
      ? (total_customer_price - total_est_cost) / total_customer_price
      : 0;

  return {
    total_qty_lines,
    total_est_cost,
    total_landed_cost,
    total_customer_price,
    gross_margin_pct,
  };
}
```

---

## Concrete Example: 6-Court Autonomous+ Project

**Inputs**:
- tier: `autonomous_plus`
- court_count: 6
- door_count: 4
- security_camera_count: 8
- has_front_desk: false
- has_pingpod_wifi: false

**Step 3A — SSD**: 6 courts → 5–8 range → `REPLAY-SSD-2TB`

**Step 3B — Switch** (Autonomous+ sizing):
- ports = 6 × 3 + 1 + 1 + 8 = 28 → exceeds 22 → `NET-USW-PRO-48-POE`, qty = 1

**Step 3C — NVR**: 8 cameras > 4 → `SURV-NVR-7BAY`

**Hard drives**: 8 cameras × `qty_per_camera = 1` = 8 WD Purple 8TB drives

**Kisi**: 1 controller (per-venue) + 4 readers (per-door) = 5 items

**Replay cameras**: 6 courts × 1 = 6 EmpireTech cameras + 6 junction boxes + 12 Flic buttons

**Security cameras**: 8 G5 Turret Ultra White + 8 junction boxes

**Resulting BOM line count**: ~32 items (29 template rows, with SSD/switch/NVR substituted, all
non-zero after qty formula)

**BOM totals (estimated at seed data prices)**:

| Line item | Qty | Unit cost | Est total |
|-----------|-----|-----------|-----------|
| UDM-SE | 1 | $379 | $379 |
| USW-Pro-48-POE | 1 | $519 | $519 |
| SFP DAC (×2 for NVR) | 2 | $12 | $24 |
| PDU | 1 | $45 | $45 |
| Patch Panel | 1 | $30 | $30 |
| Patch 1ft cables | 18 (6 courts × 3) | $3 | $54 |
| Patch 3ft cables | 6 | $5 | $30 |
| Patch 10ft cables | 2 | $8 | $16 |
| UPS | 1 | $250 | $250 |
| Rack | 1 | $180 | $180 |
| Rack Shelf | 1 | $20 | $20 |
| Mac Mini | 1 | $700 | $700 |
| Samsung T7 2TB SSD | 1 | $160 | $160 |
| EmpireTech camera (white) | 6 | $120 | $720 |
| Camera junction box (white) | 6 | $15 | $90 |
| Flic buttons | 12 | $30 | $360 |
| Replay signs | 6 | $25 | $150 |
| Hardware kit | 1 | $50 | $50 |
| 65" TV | 6 | $450 | $2,700 |
| TV mount | 6 | $80 | $480 |
| Apple TV | 6 | $180 | $1,080 |
| HDMI 3ft cable | 6 | $8 | $48 |
| Apple TV mount | 6 | $25 | $150 |
| iPad | 6 | $400 | $2,400 |
| iPad PoE adapter | 6 | $50 | $300 |
| iPad kiosk case | 6 | $120 | $720 |
| Kisi Controller Pro 2 | 1 | $200 | $200 |
| Kisi Reader Pro 2 | 4 | $150 | $600 |
| G5 Turret Ultra White | 8 | $150 | $1,200 |
| SURV junction box (white) | 8 | $15 | $120 |
| UNVR-Pro (7-bay) | 1 | $400 | $400 |
| WD Purple 8TB | 8 | $150 | $1,200 |
| **Total est_cost** | | | **~$16,175** |
| **landed_cost (×1.10)** | | | **~$17,793** |
| **customer_price (/0.90)** | | | **~$19,770** |

*Note: Unit costs are estimates from seed-data.md. Exact values require XLSX reconciliation.*

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| `court_count = 1` | SSD → 1TB, Switch → 24-port (qty 1). Flic buttons qty = 2, cameras qty = 1. |
| `court_count = 9` (Pro) | SSD → 4TB, Switch → 48-port. No door/camera items (tier = Pro). |
| `court_count = 17` (Autonomous) | SSD → 4TB, Switch → 48-port (qty 2). |
| `door_count = 0` on Pro/PBK | Kisi reader rows: `qty_per_door × 0 = 0` → excluded. No error. |
| `security_camera_count = 0` on Autonomous | G5 camera rows: `qty_per_camera × 0 = 0` → excluded. Template rows for cameras still in template; they just produce qty=0 and are skipped. |
| `has_front_desk = false` | No DESK-* items inserted. `cc_terminals` row not created. |
| `has_pingpod_wifi = false` | No `PP-WIFI-AP` item inserted. |
| Hardware catalog item missing (sku not found) | Sizing substitution silently falls back to original; conditional item skipped. Log warning to console. Ops person will notice missing line in BOM review. |
| `unit_cost = NULL` on catalog item | Row inserted with `unit_cost = NULL`. Cost chain columns (`est_total_cost`, `landed_cost`, `customer_price`) all NULL per `GENERATED ALWAYS` logic. Shows as "—" in BOM review with yellow flag icon: "Unit cost unknown — enter manually." |
| BOM already exists for project | `generateBom()` will fail on `UNIQUE (project_id, hardware_catalog_id)` constraint. Caller must call `regenerateBom()` (delete first) instead of `generateBom()` for re-generation. |

---

## File Location

```
src/services/bom.ts        — generateBom(), regenerateBom(), sizing helpers, computeBomTotals()
src/types/bom.ts           — BomItemInsert, BomCostChain, BomTotals interfaces
```

Following the pattern from `apps/inheritance/frontend/src/services/` — one file per domain,
typed inputs/outputs, no business logic in components.
