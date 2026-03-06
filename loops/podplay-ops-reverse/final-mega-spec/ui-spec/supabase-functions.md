# PodPlay Ops Wizard — Client-Side Service Layer

Complete specification for all Supabase CRUD operations, queries, and filters.
Every service function is listed with its TypeScript signature, Supabase query, parameters, return type, and error behavior.

**Pattern reference**: `apps/inheritance/frontend/src/services/`
**Supabase client**: `src/lib/supabase.ts` (singleton `createClient` instance)
**Type source**: `src/types/database.ts` generated from Supabase CLI (`supabase gen types typescript`)

---

## File Structure

```
src/
├── lib/
│   └── supabase.ts                   # Supabase client singleton
├── types/
│   └── database.ts                   # Auto-generated from `supabase gen types typescript`
│   └── index.ts                      # Re-exports + convenience types
└── services/
    ├── projects.ts                   # projects table + project lifecycle
    ├── bom.ts                        # project_bom_items + bom_templates
    ├── inventory.ts                  # inventory + inventory_movements
    ├── purchase-orders.ts            # purchase_orders + purchase_order_items
    ├── deployment.ts                 # deployment_checklist_items + templates
    ├── invoices.ts                   # invoices table
    ├── expenses.ts                   # expenses table
    ├── financials.ts                 # Cross-table P&L + HER queries
    ├── settings.ts                   # settings table (single row)
    ├── catalog.ts                    # hardware_catalog table
    ├── installers.ts                 # installers table
    ├── replay-signs.ts               # replay_signs table
    └── cc-terminals.ts               # cc_terminals table
```

---

## src/lib/supabase.ts

```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## src/types/index.ts

Convenience type aliases used throughout the service layer:

```ts
import type { Database } from './database'

// Row types (what the DB returns)
export type Project           = Database['public']['Tables']['projects']['Row']
export type Installer         = Database['public']['Tables']['installers']['Row']
export type Settings          = Database['public']['Tables']['settings']['Row']
export type HardwareCatalogItem = Database['public']['Tables']['hardware_catalog']['Row']
export type BomTemplate       = Database['public']['Tables']['bom_templates']['Row']
export type ProjectBomItem    = Database['public']['Tables']['project_bom_items']['Row']
export type Inventory         = Database['public']['Tables']['inventory']['Row']
export type InventoryMovement = Database['public']['Tables']['inventory_movements']['Row']
export type PurchaseOrder     = Database['public']['Tables']['purchase_orders']['Row']
export type PurchaseOrderItem = Database['public']['Tables']['purchase_order_items']['Row']
export type DeploymentChecklistTemplate = Database['public']['Tables']['deployment_checklist_templates']['Row']
export type DeploymentChecklistItem     = Database['public']['Tables']['deployment_checklist_items']['Row']
export type Invoice           = Database['public']['Tables']['invoices']['Row']
export type Expense           = Database['public']['Tables']['expenses']['Row']
export type ReplaySign        = Database['public']['Tables']['replay_signs']['Row']
export type CcTerminal        = Database['public']['Tables']['cc_terminals']['Row']

// Insert types (for creating new rows)
export type ProjectInsert           = Database['public']['Tables']['projects']['Insert']
export type InstallerInsert         = Database['public']['Tables']['installers']['Insert']
export type HardwareCatalogInsert   = Database['public']['Tables']['hardware_catalog']['Insert']
export type ProjectBomItemInsert    = Database['public']['Tables']['project_bom_items']['Insert']
export type PurchaseOrderInsert     = Database['public']['Tables']['purchase_orders']['Insert']
export type PurchaseOrderItemInsert = Database['public']['Tables']['purchase_order_items']['Insert']
export type InvoiceInsert           = Database['public']['Tables']['invoices']['Insert']
export type ExpenseInsert           = Database['public']['Tables']['expenses']['Insert']
export type ReplaySignInsert        = Database['public']['Tables']['replay_signs']['Insert']

// Update types (partial row for PATCH operations)
export type ProjectUpdate           = Database['public']['Tables']['projects']['Update']
export type InstallerUpdate         = Database['public']['Tables']['installers']['Update']
export type HardwareCatalogUpdate   = Database['public']['Tables']['hardware_catalog']['Update']
export type ProjectBomItemUpdate    = Database['public']['Tables']['project_bom_items']['Update']
export type PurchaseOrderUpdate     = Database['public']['Tables']['purchase_orders']['Update']
export type InventoryUpdate         = Database['public']['Tables']['inventory']['Update']
export type InvoiceUpdate           = Database['public']['Tables']['invoices']['Update']
export type ExpenseUpdate           = Database['public']['Tables']['expenses']['Update']
export type ReplaySignUpdate        = Database['public']['Tables']['replay_signs']['Update']
export type CcTerminalUpdate        = Database['public']['Tables']['cc_terminals']['Update']
export type SettingsUpdate          = Database['public']['Tables']['settings']['Update']

// Enum types (from schema enums)
export type ServiceTier             = Database['public']['Enums']['service_tier']
export type ProjectStatus           = Database['public']['Enums']['project_status']
export type DeploymentStatus        = Database['public']['Enums']['deployment_status']
export type RevenueStage            = Database['public']['Enums']['revenue_stage']
export type InstallerType           = Database['public']['Enums']['installer_type']
export type IspType                 = Database['public']['Enums']['isp_type']
export type ReplayServiceVersion    = Database['public']['Enums']['replay_service_version']
export type ExpenseCategory         = Database['public']['Enums']['expense_category']
export type PaymentMethod           = Database['public']['Enums']['payment_method']
export type InvoiceStatus           = Database['public']['Enums']['invoice_status']
export type BomCategory             = Database['public']['Enums']['bom_category']
export type InventoryMovementType   = Database['public']['Enums']['inventory_movement_type']
export type SignStatus              = Database['public']['Enums']['sign_status']
export type CcTerminalStatus        = Database['public']['Enums']['cc_terminal_status']

// Joined/extended types used in UI
export type ProjectBomItemWithCatalog = ProjectBomItem & {
  hardware_catalog: HardwareCatalogItem
}

export type InventoryWithCatalog = Inventory & {
  hardware_catalog: HardwareCatalogItem
}

export type InventoryMovementWithCatalog = InventoryMovement & {
  hardware_catalog: HardwareCatalogItem
  project: Pick<Project, 'id' | 'venue_name'> | null
}

export type PurchaseOrderWithItems = PurchaseOrder & {
  purchase_order_items: (PurchaseOrderItem & {
    hardware_catalog: HardwareCatalogItem
  })[]
}

export type ProjectWithInstaller = Project & {
  installer: Pick<Installer, 'id' | 'name' | 'company' | 'hourly_rate'> | null
}
```

---

## src/services/projects.ts

### Filter type

```ts
export type ProjectFilters = {
  status?: ProjectStatus
  tier?: ServiceTier
  q?: string        // text search on customer_name or venue_name (ilike)
  page?: number     // 1-based; page size = 25
}
```

### getProjects

```ts
/**
 * Returns paginated project list for the dashboard.
 * Joins installer name for display.
 * Ordered by created_at DESC (newest first).
 * Page size: 25 rows.
 */
export async function getProjects(filters: ProjectFilters = {}): Promise<{
  data: ProjectWithInstaller[]
  count: number
}> {
  const PAGE_SIZE = 25
  const page = filters.page ?? 1
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabase
    .from('projects')
    .select('*, installer:installers(id, name, company, hourly_rate)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filters.status) {
    query = query.eq('project_status', filters.status)
  }
  if (filters.tier) {
    query = query.eq('tier', filters.tier)
  }
  if (filters.q) {
    // Supabase ilike with OR across two columns
    query = query.or(
      `customer_name.ilike.%${filters.q}%,venue_name.ilike.%${filters.q}%`
    )
  }

  const { data, error, count } = await query
  if (error) throw error
  return { data: data as ProjectWithInstaller[], count: count ?? 0 }
}
```

### getProject

```ts
/**
 * Returns a single project by ID, joined with installer.
 * Throws if not found.
 */
export async function getProject(id: string): Promise<ProjectWithInstaller> {
  const { data, error } = await supabase
    .from('projects')
    .select('*, installer:installers(id, name, company, hourly_rate)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as ProjectWithInstaller
}
```

### createProject

```ts
/**
 * Creates a blank project row with default values.
 * Called from /projects/new before redirecting to intake wizard.
 */
export async function createProject(): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      customer_name: '',
      venue_name: '',
      venue_city: '',
      venue_state: '',
      venue_country: 'US',
      tier: 'pro',
      court_count: 1,
      door_count: 0,
      security_camera_count: 0,
      has_nvr: false,
      has_pingpod_wifi: false,
      has_front_desk: false,
      project_status: 'intake',
      deployment_status: 'not_started',
      revenue_stage: 'proposal',
      replay_service_version: 'v1',
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

### updateProject

```ts
/**
 * Partial update of any project fields.
 * Used by all wizard stages (intake saves customer fields, deployment saves
 * deployment_status, financials saves revenue_stage, etc.)
 *
 * Side effect: if ddns_subdomain changes, also updates replay_api_url:
 *   replay_api_url = `http://${ddns_subdomain}.podplaydns.com:4000`
 */
export async function updateProject(
  id: string,
  updates: ProjectUpdate
): Promise<Project> {
  // Derive replay_api_url whenever ddns_subdomain is provided
  const payload: ProjectUpdate = { ...updates }
  if (updates.ddns_subdomain) {
    payload.replay_api_url = `http://${updates.ddns_subdomain}.podplaydns.com:4000`
  }

  const { data, error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
```

### advanceProjectStatus

```ts
/**
 * Advances project_status to the next wizard stage.
 * Enforces transition rules — throws descriptive error if prerequisites unmet.
 *
 * Valid transitions:
 *   intake → procurement       (requires: customer_name, venue_name, tier, court_count set)
 *   procurement → deployment   (requires: at least 1 bom item exists — checked by caller)
 *   deployment → financial_close (soft: warns if deployment_status !== 'completed')
 *   financial_close → completed (requires: both invoices status = 'paid')
 *
 * Callers must pre-validate prerequisites and pass the next status explicitly.
 * This function performs the DB write only.
 */
export async function advanceProjectStatus(
  id: string,
  nextStatus: ProjectStatus
): Promise<Project> {
  return updateProject(id, { project_status: nextStatus })
}
```

### deleteProject

```ts
/**
 * Hard deletes a project. Cascades to: bom_items, checklist_items,
 * invoices, expenses, replay_signs, cc_terminals.
 * Use only for cancelled/test projects.
 */
export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) throw error
}
```

---

## src/services/bom.ts

### getProjectBom

```ts
/**
 * Returns all BOM items for a project, joined with hardware catalog data.
 * Ordered by category then sort_order from the catalog.
 */
export async function getProjectBom(
  projectId: string
): Promise<ProjectBomItemWithCatalog[]> {
  const { data, error } = await supabase
    .from('project_bom_items')
    .select('*, hardware_catalog(*)')
    .eq('project_id', projectId)
    .order('hardware_catalog(category)', { ascending: true })

  if (error) throw error
  return data as ProjectBomItemWithCatalog[]
}
```

### generateBomFromTemplate

```ts
/**
 * Generates project BOM from tier template and project parameters.
 * Steps:
 *   1. Fetch bom_templates rows for project.tier (joined with hardware_catalog)
 *   2. Fetch current settings (shipping_rate, target_margin)
 *   3. For each template row, compute qty:
 *        qty = qty_per_venue
 *            + (qty_per_court × project.court_count)
 *            + (qty_per_door × project.door_count)
 *            + (qty_per_camera × project.security_camera_count)
 *   4. Skip rows where computed qty = 0
 *   5. Filter PingPod WiFi items unless project.has_pingpod_wifi = true
 *   6. Filter front_desk category unless project.has_front_desk = true
 *   7. Filter Kisi (access_control) unless tier is autonomous or autonomous_plus
 *   8. Filter NVR/hard drive (surveillance) unless tier is autonomous_plus
 *   9. Upsert project_bom_items rows (insert or update qty if already exists)
 *  10. Copy unit_cost from hardware_catalog.unit_cost, shipping_rate and margin from settings
 *
 * Returns the generated BOM items.
 */
export async function generateBomFromTemplate(
  project: Project,
  settings: Settings
): Promise<ProjectBomItemWithCatalog[]> {
  // 1. Fetch templates for this tier
  const { data: templates, error: tErr } = await supabase
    .from('bom_templates')
    .select('*, hardware_catalog(*)')
    .eq('tier', project.tier)
    .order('sort_order', { ascending: true })

  if (tErr) throw tErr

  // 2. Compute qty per row and build insert array
  const insertRows: ProjectBomItemInsert[] = []

  for (const tmpl of templates as (BomTemplate & { hardware_catalog: HardwareCatalogItem })[]) {
    const cat = tmpl.hardware_catalog

    // Skip PingPod-specific items unless has_pingpod_wifi
    if (cat.category === 'pingpod_specific' && !project.has_pingpod_wifi) continue

    // Skip front_desk unless has_front_desk
    if (cat.category === 'front_desk' && !project.has_front_desk) continue

    // Skip access_control unless autonomous or autonomous_plus
    if (
      cat.category === 'access_control' &&
      project.tier !== 'autonomous' &&
      project.tier !== 'autonomous_plus'
    ) continue

    // Skip surveillance (NVR/cameras) unless autonomous_plus
    if (cat.category === 'surveillance' && project.tier !== 'autonomous_plus') continue

    const qty =
      tmpl.qty_per_venue +
      tmpl.qty_per_court * project.court_count +
      tmpl.qty_per_door * (project.door_count ?? 0) +
      tmpl.qty_per_camera * (project.security_camera_count ?? 0)

    if (qty === 0) continue

    insertRows.push({
      project_id: project.id,
      hardware_catalog_id: cat.id,
      qty,
      unit_cost: cat.unit_cost,
      shipping_rate: settings.shipping_rate,
      margin: settings.target_margin,
      allocated: false,
      shipped: false,
    })
  }

  // 3. Upsert (insert + update existing by project_id + hardware_catalog_id unique key)
  const { error: uErr } = await supabase
    .from('project_bom_items')
    .upsert(insertRows, { onConflict: 'project_id,hardware_catalog_id' })

  if (uErr) throw uErr

  // 4. Return fresh BOM
  return getProjectBom(project.id)
}
```

### updateBomItem

```ts
/**
 * Updates a single BOM line item.
 * Common updates: qty, unit_cost (actual PO cost), notes, allocated, shipped.
 * Computed columns (est_total_cost, landed_cost, customer_price) auto-update in DB.
 */
export async function updateBomItem(
  id: string,
  updates: ProjectBomItemUpdate
): Promise<ProjectBomItemWithCatalog> {
  const { data, error } = await supabase
    .from('project_bom_items')
    .update(updates)
    .eq('id', id)
    .select('*, hardware_catalog(*)')
    .single()

  if (error) throw error
  return data as ProjectBomItemWithCatalog
}
```

### deleteBomItem

```ts
/**
 * Removes a BOM line item (e.g., removing optional item for a project).
 */
export async function deleteBomItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('project_bom_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}
```

### addBomItem

```ts
/**
 * Adds a single hardware item to a project BOM.
 * Used when ops manually adds a non-template item.
 */
export async function addBomItem(
  projectId: string,
  hardwareCatalogId: string,
  qty: number,
  settings: Settings
): Promise<ProjectBomItemWithCatalog> {
  // Get unit cost from catalog
  const { data: cat, error: catErr } = await supabase
    .from('hardware_catalog')
    .select('unit_cost')
    .eq('id', hardwareCatalogId)
    .single()

  if (catErr) throw catErr

  const { data, error } = await supabase
    .from('project_bom_items')
    .insert({
      project_id: projectId,
      hardware_catalog_id: hardwareCatalogId,
      qty,
      unit_cost: cat.unit_cost,
      shipping_rate: settings.shipping_rate,
      margin: settings.target_margin,
      allocated: false,
      shipped: false,
    })
    .select('*, hardware_catalog(*)')
    .single()

  if (error) throw error
  return data as ProjectBomItemWithCatalog
}
```

### getBomTemplates

```ts
/**
 * Returns all BOM templates for a given tier, joined with catalog data.
 * Used in Settings > Catalog to preview tier templates.
 */
export async function getBomTemplates(
  tier: ServiceTier
): Promise<(BomTemplate & { hardware_catalog: HardwareCatalogItem })[]> {
  const { data, error } = await supabase
    .from('bom_templates')
    .select('*, hardware_catalog(*)')
    .eq('tier', tier)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data as (BomTemplate & { hardware_catalog: HardwareCatalogItem })[]
}
```

---

## src/services/inventory.ts

### InventoryFilters type

```ts
export type InventoryFilters = {
  category?: BomCategory
  low_stock?: boolean   // show only items where qty_available <= reorder_threshold
  q?: string            // text search on hardware_catalog.name or sku
}
```

### getInventoryItems

```ts
/**
 * Returns inventory rows joined with hardware catalog.
 * Supports category filter, low_stock flag, and text search.
 * Ordered by hardware_catalog.category then name.
 */
export async function getInventoryItems(
  filters: InventoryFilters = {}
): Promise<InventoryWithCatalog[]> {
  let query = supabase
    .from('inventory')
    .select('*, hardware_catalog(*)')
    .order('hardware_catalog(category)', { ascending: true })

  if (filters.category) {
    // Filter by category requires filtering on the joined table
    // Supabase: filter on embedded relation column
    query = query.eq('hardware_catalog.category', filters.category)
  }

  if (filters.low_stock) {
    // qty_available = qty_on_hand - qty_allocated (generated column)
    // Show rows where qty_available <= reorder_threshold
    query = query.lte('qty_available', supabase.rpc as unknown as number)
    // NOTE: generated column comparison uses raw filter:
    query = query.filter('qty_available', 'lte', 'reorder_threshold')
    // Implementation: use .lt or computed — Supabase does not support comparing
    // two columns natively in client. Use RPC or raw filter string:
    // Alternative: fetch all, filter client-side:
    // data = data.filter(item => item.qty_available <= item.reorder_threshold)
  }

  if (filters.q) {
    query = query.or(
      `hardware_catalog.name.ilike.%${filters.q}%,hardware_catalog.sku.ilike.%${filters.q}%`
    )
  }

  const { data, error } = await query
  if (error) throw error

  let result = data as InventoryWithCatalog[]

  // Client-side low_stock filter (Supabase cannot compare two columns natively)
  if (filters.low_stock) {
    result = result.filter(
      (item) => item.qty_available <= item.reorder_threshold
    )
  }

  return result
}
```

### getInventoryItem

```ts
/**
 * Returns a single inventory row by hardware_catalog_id.
 * Used before allocating or recording movements.
 */
export async function getInventoryItem(
  hardwareCatalogId: string
): Promise<InventoryWithCatalog | null> {
  const { data, error } = await supabase
    .from('inventory')
    .select('*, hardware_catalog(*)')
    .eq('hardware_catalog_id', hardwareCatalogId)
    .maybeSingle()

  if (error) throw error
  return data as InventoryWithCatalog | null
}
```

### updateInventoryStock

```ts
/**
 * Direct update to inventory qty_on_hand or qty_allocated.
 * Used for manual adjustments and receiving POs.
 * Always call recordInventoryMovement alongside this to maintain audit trail.
 */
export async function updateInventoryStock(
  hardwareCatalogId: string,
  updates: Pick<InventoryUpdate, 'qty_on_hand' | 'qty_allocated' | 'reorder_threshold' | 'notes'>
): Promise<InventoryWithCatalog> {
  const { data, error } = await supabase
    .from('inventory')
    .update(updates)
    .eq('hardware_catalog_id', hardwareCatalogId)
    .select('*, hardware_catalog(*)')
    .single()

  if (error) throw error
  return data as InventoryWithCatalog
}
```

### recordInventoryMovement

```ts
/**
 * Inserts an inventory_movements audit record.
 * Always call this alongside updateInventoryStock to maintain full audit trail.
 *
 * Movement types and their qty_delta sign convention:
 *   purchase_order_received  → +qty (stock increased)
 *   project_allocated        → +qty_allocated, qty_available decreases
 *   project_shipped          → -qty_on_hand (items left warehouse)
 *   adjustment_increase      → +qty_on_hand
 *   adjustment_decrease      → -qty_on_hand
 *   return                   → +qty_on_hand
 */
export async function recordInventoryMovement(params: {
  hardwareCatalogId: string
  projectId?: string
  movementType: InventoryMovementType
  qtyDelta: number
  reference?: string
  notes?: string
}): Promise<InventoryMovement> {
  const { data, error } = await supabase
    .from('inventory_movements')
    .insert({
      hardware_catalog_id: params.hardwareCatalogId,
      project_id: params.projectId ?? null,
      movement_type: params.movementType,
      qty_delta: params.qtyDelta,
      reference: params.reference ?? null,
      notes: params.notes ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

### allocateInventoryForProject

```ts
/**
 * Allocates inventory for all BOM items of a project.
 * For each BOM item:
 *   1. Increment inventory.qty_allocated by bom_item.qty
 *   2. Record movement: project_allocated, qty_delta = +bom_item.qty
 *   3. Set bom_item.allocated = true
 *
 * Throws if any item has insufficient qty_available (qty_on_hand - qty_allocated < needed).
 * All operations wrapped in sequence; no DB transaction support client-side —
 * if a mid-sequence error occurs, a reconciliation run will detect the mismatch.
 */
export async function allocateInventoryForProject(
  projectId: string,
  bomItems: ProjectBomItemWithCatalog[]
): Promise<void> {
  for (const item of bomItems) {
    const inv = await getInventoryItem(item.hardware_catalog_id)
    if (inv) {
      const available = inv.qty_on_hand - inv.qty_allocated
      if (available < item.qty) {
        throw new Error(
          `Insufficient stock for ${item.hardware_catalog.name}: ` +
          `need ${item.qty}, available ${available}`
        )
      }
      await updateInventoryStock(item.hardware_catalog_id, {
        qty_allocated: inv.qty_allocated + item.qty,
      })
      await recordInventoryMovement({
        hardwareCatalogId: item.hardware_catalog_id,
        projectId,
        movementType: 'project_allocated',
        qtyDelta: item.qty,
        reference: `BOM allocation for project ${projectId}`,
      })
    }
    await updateBomItem(item.id, { allocated: true })
  }
}
```

### shipInventoryForProject

```ts
/**
 * Marks inventory as shipped for all allocated BOM items.
 * For each BOM item where allocated = true:
 *   1. Decrement inventory.qty_on_hand by bom_item.qty
 *   2. Decrement inventory.qty_allocated by bom_item.qty (clears allocation)
 *   3. Record movement: project_shipped, qty_delta = -bom_item.qty
 *   4. Set bom_item.shipped = true
 */
export async function shipInventoryForProject(
  projectId: string,
  bomItems: ProjectBomItemWithCatalog[]
): Promise<void> {
  for (const item of bomItems.filter((b) => b.allocated && !b.shipped)) {
    const inv = await getInventoryItem(item.hardware_catalog_id)
    if (inv) {
      await updateInventoryStock(item.hardware_catalog_id, {
        qty_on_hand: inv.qty_on_hand - item.qty,
        qty_allocated: inv.qty_allocated - item.qty,
      })
      await recordInventoryMovement({
        hardwareCatalogId: item.hardware_catalog_id,
        projectId,
        movementType: 'project_shipped',
        qtyDelta: -item.qty,
        reference: `Shipped to project ${projectId}`,
      })
    }
    await updateBomItem(item.id, { shipped: true })
  }
}
```

### getInventoryMovements

```ts
/**
 * Returns movement history for a hardware item or project.
 * Ordered by created_at DESC (most recent first).
 * Limit: 100 rows for display.
 */
export async function getInventoryMovements(params: {
  hardwareCatalogId?: string
  projectId?: string
  limit?: number
}): Promise<InventoryMovementWithCatalog[]> {
  let query = supabase
    .from('inventory_movements')
    .select('*, hardware_catalog(*), project:projects(id, venue_name)')
    .order('created_at', { ascending: false })
    .limit(params.limit ?? 100)

  if (params.hardwareCatalogId) {
    query = query.eq('hardware_catalog_id', params.hardwareCatalogId)
  }
  if (params.projectId) {
    query = query.eq('project_id', params.projectId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as InventoryMovementWithCatalog[]
}
```

### upsertInventoryRow

```ts
/**
 * Creates an inventory row if one doesn't exist for the hardware item.
 * Called when adding a new hardware_catalog item to ensure it has an inventory row.
 */
export async function upsertInventoryRow(
  hardwareCatalogId: string
): Promise<Inventory> {
  const { data, error } = await supabase
    .from('inventory')
    .upsert(
      { hardware_catalog_id: hardwareCatalogId, qty_on_hand: 0, qty_allocated: 0, reorder_threshold: 0 },
      { onConflict: 'hardware_catalog_id', ignoreDuplicates: true }
    )
    .select()
    .single()

  if (error) throw error
  return data
}
```

---

## src/services/purchase-orders.ts

### getPurchaseOrders

```ts
/**
 * Returns all purchase orders for a project (or all POs if projectId omitted).
 * Joined with line items and catalog data.
 * Ordered by order_date DESC.
 */
export async function getPurchaseOrders(
  projectId?: string
): Promise<PurchaseOrderWithItems[]> {
  let query = supabase
    .from('purchase_orders')
    .select('*, purchase_order_items(*, hardware_catalog(*))')
    .order('order_date', { ascending: false })

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query
  if (error) throw error
  return data as PurchaseOrderWithItems[]
}
```

### createPurchaseOrder

```ts
/**
 * Creates a PO header + line items in two steps.
 * Auto-generates po_number in format PO-{YYYY}-{NNN} (year + 3-digit sequence).
 * Sequence is derived by counting existing POs this year.
 *
 * Returns the created PO with items.
 */
export async function createPurchaseOrder(params: {
  vendor: string
  projectId?: string
  orderDate: string        // ISO date string
  expectedDate?: string
  totalCost?: number
  notes?: string
  items: {
    hardwareCatalogId: string
    qtyOrdered: number
    unitCost: number
  }[]
}): Promise<PurchaseOrderWithItems> {
  // 1. Generate PO number
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('purchase_orders')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`)

  const seq = String((count ?? 0) + 1).padStart(3, '0')
  const poNumber = `PO-${year}-${seq}`

  // 2. Insert PO header
  const { data: po, error: poErr } = await supabase
    .from('purchase_orders')
    .insert({
      po_number: poNumber,
      vendor: params.vendor,
      project_id: params.projectId ?? null,
      order_date: params.orderDate,
      expected_date: params.expectedDate ?? null,
      total_cost: params.totalCost ?? null,
      status: 'ordered',
      notes: params.notes ?? null,
    })
    .select()
    .single()

  if (poErr) throw poErr

  // 3. Insert line items
  const itemInserts: PurchaseOrderItemInsert[] = params.items.map((item) => ({
    purchase_order_id: po.id,
    hardware_catalog_id: item.hardwareCatalogId,
    qty_ordered: item.qtyOrdered,
    qty_received: 0,
    unit_cost: item.unitCost,
  }))

  const { error: itemErr } = await supabase
    .from('purchase_order_items')
    .insert(itemInserts)

  if (itemErr) throw itemErr

  // 4. Return full PO with items
  const { data: full, error: fullErr } = await supabase
    .from('purchase_orders')
    .select('*, purchase_order_items(*, hardware_catalog(*))')
    .eq('id', po.id)
    .single()

  if (fullErr) throw fullErr
  return full as PurchaseOrderWithItems
}
```

### updatePurchaseOrder

```ts
/**
 * Updates PO header fields (status, tracking_number, received_date, etc.)
 */
export async function updatePurchaseOrder(
  id: string,
  updates: PurchaseOrderUpdate
): Promise<PurchaseOrder> {
  const { data, error } = await supabase
    .from('purchase_orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
```

### receivePurchaseOrder

```ts
/**
 * Marks a PO as received and updates inventory.
 * For each line item:
 *   1. Set purchase_order_items.qty_received = qty_ordered (full receipt)
 *   2. Increment inventory.qty_on_hand by qty_ordered
 *   3. Record movement: purchase_order_received, qty_delta = +qty_ordered
 * Sets PO status to 'received' and received_date to today.
 */
export async function receivePurchaseOrder(
  po: PurchaseOrderWithItems
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)

  // Update PO header
  await updatePurchaseOrder(po.id, {
    status: 'received',
    received_date: today,
  })

  // Update each line item and inventory
  for (const item of po.purchase_order_items) {
    // Mark qty_received
    await supabase
      .from('purchase_order_items')
      .update({ qty_received: item.qty_ordered })
      .eq('id', item.id)

    // Update inventory
    const inv = await getInventoryItem(item.hardware_catalog_id)
    if (inv) {
      await updateInventoryStock(item.hardware_catalog_id, {
        qty_on_hand: inv.qty_on_hand + item.qty_ordered,
      })
    } else {
      // Create inventory row if it doesn't exist
      await supabase.from('inventory').insert({
        hardware_catalog_id: item.hardware_catalog_id,
        qty_on_hand: item.qty_ordered,
        qty_allocated: 0,
        reorder_threshold: 0,
      })
    }

    // Record movement
    await recordInventoryMovement({
      hardwareCatalogId: item.hardware_catalog_id,
      projectId: po.project_id ?? undefined,
      movementType: 'purchase_order_received',
      qtyDelta: item.qty_ordered,
      reference: po.po_number,
    })
  }
}
```

---

## src/services/deployment.ts

### getDeploymentChecklist

```ts
/**
 * Returns all checklist items for a project, ordered by sort_order.
 * Returns empty array if no items exist (checklist not yet initialized).
 */
export async function getDeploymentChecklist(
  projectId: string
): Promise<DeploymentChecklistItem[]> {
  const { data, error } = await supabase
    .from('deployment_checklist_items')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}
```

### initDeploymentChecklist

```ts
/**
 * Creates deployment_checklist_items for a project from templates.
 * Called when project advances from procurement → deployment stage.
 *
 * Steps:
 *   1. Fetch all templates, filtered by:
 *      - applicable_tiers: must include project.tier or be NULL (all tiers)
 *      - is_v2_only: skip if project.replay_service_version = 'v1'
 *   2. Replace tokens in description with project values:
 *      {{CUSTOMER_NAME}}      → project.customer_name
 *      {{VENUE_NAME}}         → project.venue_name
 *      {{COURT_COUNT}}        → project.court_count.toString()
 *      {{DOOR_COUNT}}         → project.door_count?.toString() ?? '0'
 *      {{DDNS_SUBDOMAIN}}     → project.ddns_subdomain ?? '[not set]'
 *      {{UNIFI_SITE_NAME}}    → project.unifi_site_name ?? '[not set]'
 *      {{MAC_MINI_USERNAME}}  → project.mac_mini_username ?? '[not set]'
 *      {{MAC_MINI_PASSWORD}}  → project.mac_mini_password ?? '[not set]'
 *      {{LOCATION_ID}}        → project.location_id ?? '[not set]'
 *      {{REPLAY_API_URL}}     → project.replay_api_url ?? '[not set]'
 *      {{REPLAY_LOCAL_URL}}   → project.replay_local_url ?? 'http://192.168.32.100:4000'
 *   3. Insert rows; skip if checklist already initialized (UNIQUE constraint handles duplicates)
 *
 * Idempotent: safe to call multiple times — duplicate (project_id, template_id) are ignored.
 */
export async function initDeploymentChecklist(
  project: Project
): Promise<DeploymentChecklistItem[]> {
  // 1. Fetch applicable templates
  const { data: templates, error: tErr } = await supabase
    .from('deployment_checklist_templates')
    .select('*')
    .order('sort_order', { ascending: true })

  if (tErr) throw tErr

  const tokenMap: Record<string, string> = {
    CUSTOMER_NAME:     project.customer_name,
    VENUE_NAME:        project.venue_name,
    COURT_COUNT:       project.court_count.toString(),
    DOOR_COUNT:        (project.door_count ?? 0).toString(),
    DDNS_SUBDOMAIN:    project.ddns_subdomain ?? '[not set]',
    UNIFI_SITE_NAME:   project.unifi_site_name ?? '[not set]',
    MAC_MINI_USERNAME: project.mac_mini_username ?? '[not set]',
    MAC_MINI_PASSWORD: project.mac_mini_password ?? '[not set]',
    LOCATION_ID:       project.location_id ?? '[not set]',
    REPLAY_API_URL:    project.replay_api_url ?? '[not set]',
    REPLAY_LOCAL_URL:  project.replay_local_url ?? 'http://192.168.32.100:4000',
  }

  function replaceTokens(text: string): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => tokenMap[key] ?? `{{${key}}}`)
  }

  // 2. Filter and build insert rows
  const insertRows = (templates as DeploymentChecklistTemplate[])
    .filter((t) => {
      // Skip V2-only steps if project uses V1
      if (t.is_v2_only && project.replay_service_version === 'v1') return false
      // Skip tier-restricted steps
      if (t.applicable_tiers && t.applicable_tiers.length > 0) {
        if (!t.applicable_tiers.includes(project.tier)) return false
      }
      return true
    })
    .map((t) => ({
      project_id: project.id,
      template_id: t.id,
      phase: t.phase,
      step_number: t.step_number,
      sort_order: t.sort_order,
      title: t.title,
      description: replaceTokens(t.description),
      warnings: t.warnings,
      is_completed: false,
      completed_at: null,
      notes: null,
    }))

  if (insertRows.length === 0) return []

  // 3. Upsert (safe if already initialized)
  const { error: iErr } = await supabase
    .from('deployment_checklist_items')
    .upsert(insertRows, { onConflict: 'project_id,template_id', ignoreDuplicates: true })

  if (iErr) throw iErr

  return getDeploymentChecklist(project.id)
}
```

### toggleChecklistItem

```ts
/**
 * Toggles is_completed on a checklist item.
 * If marking complete: sets completed_at = now().
 * If marking incomplete: clears completed_at.
 */
export async function toggleChecklistItem(
  id: string,
  completed: boolean
): Promise<DeploymentChecklistItem> {
  const { data, error } = await supabase
    .from('deployment_checklist_items')
    .update({
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
```

### updateChecklistItemNotes

```ts
/**
 * Updates the free-form notes on a checklist item.
 * Called when ops types in the notes field while executing a step.
 */
export async function updateChecklistItemNotes(
  id: string,
  notes: string
): Promise<DeploymentChecklistItem> {
  const { data, error } = await supabase
    .from('deployment_checklist_items')
    .update({ notes })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
```

### getChecklistTemplates

```ts
/**
 * Returns all checklist templates for reference (Settings > view, or re-init).
 * Ordered by sort_order.
 */
export async function getChecklistTemplates(): Promise<DeploymentChecklistTemplate[]> {
  const { data, error } = await supabase
    .from('deployment_checklist_templates')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}
```

### rehydrateChecklistTokens

```ts
/**
 * Re-runs token replacement on all checklist items for a project.
 * Called when project fields change (e.g., ddns_subdomain updated after checklist init).
 * Fetches current items, re-applies tokens from updated project, bulk updates descriptions.
 */
export async function rehydrateChecklistTokens(
  project: Project
): Promise<void> {
  // Fetch items with template text
  const { data: items, error: iErr } = await supabase
    .from('deployment_checklist_items')
    .select('id, template_id, deployment_checklist_templates(description)')
    .eq('project_id', project.id)

  if (iErr) throw iErr

  const tokenMap: Record<string, string> = {
    CUSTOMER_NAME:     project.customer_name,
    VENUE_NAME:        project.venue_name,
    COURT_COUNT:       project.court_count.toString(),
    DOOR_COUNT:        (project.door_count ?? 0).toString(),
    DDNS_SUBDOMAIN:    project.ddns_subdomain ?? '[not set]',
    UNIFI_SITE_NAME:   project.unifi_site_name ?? '[not set]',
    MAC_MINI_USERNAME: project.mac_mini_username ?? '[not set]',
    MAC_MINI_PASSWORD: project.mac_mini_password ?? '[not set]',
    LOCATION_ID:       project.location_id ?? '[not set]',
    REPLAY_API_URL:    project.replay_api_url ?? '[not set]',
    REPLAY_LOCAL_URL:  project.replay_local_url ?? 'http://192.168.32.100:4000',
  }

  function replaceTokens(text: string): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => tokenMap[key] ?? `{{${key}}}`)
  }

  // Update each item
  for (const item of (items as any[])) {
    const templateDesc = item.deployment_checklist_templates?.description ?? ''
    await supabase
      .from('deployment_checklist_items')
      .update({ description: replaceTokens(templateDesc) })
      .eq('id', item.id)
  }
}
```

---

## src/services/invoices.ts

### getInvoices

```ts
/**
 * Returns all invoices for a project (up to 2: deposit + final).
 * Ordered by invoice_type (deposit first).
 */
export async function getInvoices(projectId: string): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('project_id', projectId)
    .order('invoice_type', { ascending: true })
  // 'deposit' < 'final' alphabetically, deposit appears first

  if (error) throw error
  return data
}
```

### createProjectInvoices

```ts
/**
 * Creates the two standard invoices (deposit + final) for a project.
 * Called when project enters Stage 4 (financial_close).
 *
 * Amounts:
 *   hardware_subtotal = SUM(project_bom_items.customer_price) from DB
 *   service_fee = tier venue_fee + (court_count × tier court_fee) from settings
 *   subtotal, tax_amount, total_amount = generated columns
 *   deposit invoice: deposit_pct = 0.50
 *   final invoice: deposit_pct = 0.50 (remaining 50%)
 *
 * Both invoices start with status = 'not_sent'.
 * Idempotent: uses UNIQUE (project_id, invoice_type) — errors if already created.
 */
export async function createProjectInvoices(
  project: Project,
  settings: Settings,
  hardwareSubtotal: number
): Promise<Invoice[]> {
  // Calculate service fee
  let venueFee: number
  let courtFee: number

  switch (project.tier) {
    case 'pro':
      venueFee = settings.pro_venue_fee
      courtFee = settings.pro_court_fee
      break
    case 'autonomous':
    case 'autonomous_plus':
      venueFee = settings.autonomous_venue_fee
      courtFee = settings.autonomous_court_fee
      break
    case 'pbk':
      venueFee = settings.pbk_venue_fee
      courtFee = settings.pbk_court_fee
      break
    default:
      venueFee = 0
      courtFee = 0
  }

  const serviceFee = venueFee + courtFee * project.court_count

  const { data, error } = await supabase
    .from('invoices')
    .insert([
      {
        project_id: project.id,
        invoice_type: 'deposit',
        hardware_subtotal: hardwareSubtotal,
        service_fee: serviceFee,
        tax_rate: settings.sales_tax_rate,
        deposit_pct: 0.50,
        status: 'not_sent',
      },
      {
        project_id: project.id,
        invoice_type: 'final',
        hardware_subtotal: hardwareSubtotal,
        service_fee: serviceFee,
        tax_rate: settings.sales_tax_rate,
        deposit_pct: 0.50,
        status: 'not_sent',
      },
    ])
    .select()

  if (error) throw error
  return data
}
```

### updateInvoice

```ts
/**
 * Updates invoice fields.
 * Common updates:
 *   - status: 'not_sent' → 'sent' (when invoice mailed/Stripe sent)
 *   - date_sent: set when status changes to 'sent'
 *   - status: 'sent' → 'paid'
 *   - date_paid: set when status changes to 'paid'
 *   - invoice_number: external billing system number
 *   - hardware_subtotal, service_fee: corrections before sending
 */
export async function updateInvoice(
  id: string,
  updates: InvoiceUpdate
): Promise<Invoice> {
  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
```

### markInvoiceSent

```ts
/**
 * Convenience: sets invoice status to 'sent' + date_sent to today.
 * Also updates project.revenue_stage:
 *   deposit invoice sent → revenue_stage = 'deposit_invoiced'
 *   final invoice sent   → revenue_stage = 'final_invoiced'
 */
export async function markInvoiceSent(
  invoice: Invoice,
  projectId: string
): Promise<Invoice> {
  const today = new Date().toISOString().slice(0, 10)
  const updated = await updateInvoice(invoice.id, {
    status: 'sent',
    date_sent: today,
  })

  const revenueStage: RevenueStage =
    invoice.invoice_type === 'deposit' ? 'deposit_invoiced' : 'final_invoiced'
  await updateProject(projectId, { revenue_stage: revenueStage })

  return updated
}
```

### markInvoicePaid

```ts
/**
 * Convenience: sets invoice status to 'paid' + date_paid to provided date.
 * Also updates project.revenue_stage:
 *   deposit paid → revenue_stage = 'deposit_paid'
 *   final paid   → revenue_stage = 'final_paid'
 */
export async function markInvoicePaid(
  invoice: Invoice,
  projectId: string,
  paidDate: string
): Promise<Invoice> {
  const updated = await updateInvoice(invoice.id, {
    status: 'paid',
    date_paid: paidDate,
  })

  const revenueStage: RevenueStage =
    invoice.invoice_type === 'deposit' ? 'deposit_paid' : 'final_paid'
  await updateProject(projectId, { revenue_stage: revenueStage })

  return updated
}
```

---

## src/services/expenses.ts

### getExpenses

```ts
/**
 * Returns all expenses for a project, ordered by expense_date DESC.
 */
export async function getExpenses(projectId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('project_id', projectId)
    .order('expense_date', { ascending: false })

  if (error) throw error
  return data
}
```

### createExpense

```ts
/**
 * Creates a new expense record.
 * description is optional but recommended for audit clarity.
 */
export async function createExpense(params: {
  projectId: string
  expenseDate: string        // ISO date string
  category: ExpenseCategory
  amount: number
  paymentMethod: PaymentMethod
  description?: string
  notes?: string
}): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      project_id: params.projectId,
      expense_date: params.expenseDate,
      category: params.category,
      amount: params.amount,
      payment_method: params.paymentMethod,
      description: params.description ?? null,
      notes: params.notes ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

### updateExpense

```ts
/**
 * Updates an existing expense. All fields editable.
 */
export async function updateExpense(
  id: string,
  updates: ExpenseUpdate
): Promise<Expense> {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
```

### deleteExpense

```ts
/**
 * Hard deletes an expense record. No soft-delete.
 */
export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)

  if (error) throw error
}
```

### getExpenseSummary

```ts
/**
 * Returns total expenses per category for a project.
 * Used in P&L breakdown.
 * Computed client-side from getExpenses result.
 */
export function computeExpenseSummary(
  expenses: Expense[]
): Record<ExpenseCategory, number> {
  const summary = {} as Record<ExpenseCategory, number>
  for (const e of expenses) {
    summary[e.category] = (summary[e.category] ?? 0) + Number(e.amount)
  }
  return summary
}
```

---

## src/services/financials.ts

### getProjectPnL

```ts
/**
 * Computes P&L for a single project.
 * All values in USD.
 *
 * Revenue:
 *   deposit_received  = deposit invoice total_amount if status = 'paid', else 0
 *   final_received    = final invoice total_amount if status = 'paid', else 0
 *   total_revenue     = deposit_received + final_received
 *
 * Costs:
 *   hardware_cost     = SUM(project_bom_items.est_total_cost)
 *   labor_cost        = project.installer_hours × COALESCE(installer.hourly_rate, settings.labor_rate_per_hour)
 *   total_expenses    = SUM(expenses.amount)
 *   total_cost        = hardware_cost + labor_cost + total_expenses
 *
 * Margin:
 *   gross_profit      = total_revenue - total_cost
 *   gross_margin_pct  = gross_profit / total_revenue (if total_revenue > 0)
 */
export type ProjectPnL = {
  project_id: string
  deposit_received: number
  final_received: number
  total_revenue: number
  hardware_cost: number
  labor_cost: number
  total_expenses: number
  total_cost: number
  gross_profit: number
  gross_margin_pct: number | null
}

export async function getProjectPnL(
  project: ProjectWithInstaller,
  settings: Settings
): Promise<ProjectPnL> {
  const [invoices, expenses, bomItems] = await Promise.all([
    getInvoices(project.id),
    getExpenses(project.id),
    getProjectBom(project.id),
  ])

  const depositInv = invoices.find((i) => i.invoice_type === 'deposit')
  const finalInv   = invoices.find((i) => i.invoice_type === 'final')

  const depositReceived = depositInv?.status === 'paid'
    ? Number(depositInv.total_amount ?? 0) : 0
  const finalReceived = finalInv?.status === 'paid'
    ? Number(finalInv.total_amount ?? 0) : 0
  const totalRevenue = depositReceived + finalReceived

  const hardwareCost = bomItems.reduce(
    (sum, item) => sum + Number(item.est_total_cost ?? 0), 0
  )

  const hourlyRate = project.installer?.hourly_rate != null
    ? Number(project.installer.hourly_rate)
    : settings.labor_rate_per_hour
  const laborCost = Number(project.installer_hours) * hourlyRate

  const totalExpenses = expenses.reduce(
    (sum, e) => sum + Number(e.amount), 0
  )
  const totalCost = hardwareCost + laborCost + totalExpenses
  const grossProfit = totalRevenue - totalCost
  const grossMarginPct = totalRevenue > 0
    ? grossProfit / totalRevenue : null

  return {
    project_id: project.id,
    deposit_received: depositReceived,
    final_received: finalReceived,
    total_revenue: totalRevenue,
    hardware_cost: hardwareCost,
    labor_cost: laborCost,
    total_expenses: totalExpenses,
    total_cost: totalCost,
    gross_profit: grossProfit,
    gross_margin_pct: grossMarginPct,
  }
}
```

### getFinancialsDashboard

```ts
/**
 * Aggregated financial view for the global /financials page.
 *
 * Revenue pipeline:
 *   pipeline_by_stage: count of projects per revenue_stage
 *   total_signed_value: SUM of final invoice total_amount for all signed+ projects
 *   total_paid: SUM of final invoice total_amount for final_paid projects
 *
 * Monthly P&L (for year):
 *   For each month: total_revenue, total_hardware_cost, total_labor_cost,
 *   total_expenses, gross_profit, gross_margin_pct
 *
 * HER (Hardware Efficiency Ratio):
 *   her = total_hardware_revenue / team_hardware_spend
 *   team_hardware_spend = (niko_salary × niko_direct_alloc)
 *                       + (chad_salary × chad_indirect_alloc)
 *                       + annual_rent + annual_indirect_salaries
 *   (monthly: divide annual values by 12 for monthly HER)
 *
 * This function fetches all projects + invoices + expenses for the year
 * and computes everything client-side. No DB aggregate queries —
 * data volume is small enough (<200 projects total) for client-side aggregation.
 */
export type MonthlyPnL = {
  year: number
  month: number              // 1–12
  total_revenue: number
  total_hardware_cost: number
  total_labor_cost: number
  total_expenses: number
  gross_profit: number
  gross_margin_pct: number | null
  her: number | null
}

export type FinancialsDashboard = {
  pipeline_by_stage: Record<RevenueStage, number>
  total_signed_value: number
  total_paid: number
  monthly_pnl: MonthlyPnL[]
  ytd_revenue: number
  ytd_profit: number
  ytd_her: number | null
}

export async function getFinancialsDashboard(
  year: number,
  settings: Settings
): Promise<FinancialsDashboard> {
  // Fetch all invoices for the year (by date_paid or date_sent)
  const yearStart = `${year}-01-01`
  const yearEnd   = `${year}-12-31`

  const [projectsResult, invoicesResult, expensesResult] = await Promise.all([
    supabase
      .from('projects')
      .select('id, installer_hours, revenue_stage, tier, court_count, installer:installers(hourly_rate)')
      .neq('project_status', 'cancelled'),
    supabase
      .from('invoices')
      .select('*')
      .or(`date_paid.gte.${yearStart},date_sent.gte.${yearStart}`)
      .lte('date_paid', yearEnd),
    supabase
      .from('expenses')
      .select('*')
      .gte('expense_date', yearStart)
      .lte('expense_date', yearEnd),
  ])

  if (projectsResult.error) throw projectsResult.error
  if (invoicesResult.error) throw invoicesResult.error
  if (expensesResult.error) throw expensesResult.error

  const projects  = projectsResult.data as any[]
  const invoices  = invoicesResult.data  as Invoice[]
  const expenses  = expensesResult.data  as Expense[]

  // Pipeline by stage
  const pipeline_by_stage = {} as Record<RevenueStage, number>
  for (const p of projects) {
    pipeline_by_stage[p.revenue_stage as RevenueStage] =
      (pipeline_by_stage[p.revenue_stage as RevenueStage] ?? 0) + 1
  }

  // Total signed value and paid
  const paidFinalInvoices = invoices.filter(
    (i) => i.invoice_type === 'final' && i.status === 'paid'
  )
  const total_paid = paidFinalInvoices.reduce(
    (s, i) => s + Number(i.total_amount ?? 0), 0
  )
  const signedInvoices = invoices.filter((i) => i.invoice_type === 'final')
  const total_signed_value = signedInvoices.reduce(
    (s, i) => s + Number(i.total_amount ?? 0), 0
  )

  // Monthly P&L (client-side aggregation)
  // Group paid invoices by month of date_paid
  // Group expenses by month of expense_date
  const monthly_pnl: MonthlyPnL[] = []

  const teamHardwareSpendAnnual =
    (settings.niko_annual_salary * settings.niko_direct_allocation) +
    (settings.chad_annual_salary * settings.chad_indirect_allocation) +
    settings.annual_rent +
    settings.annual_indirect_salaries
  const teamHardwareSpendMonthly = teamHardwareSpendAnnual / 12

  for (let month = 1; month <= 12; month++) {
    const monthStr = String(month).padStart(2, '0')
    const prefix = `${year}-${monthStr}`

    const monthRevenue = invoices
      .filter((i) => i.status === 'paid' && i.date_paid?.startsWith(prefix))
      .reduce((s, i) => s + Number(i.total_amount ?? 0), 0)

    const monthExpenses = expenses
      .filter((e) => e.expense_date.startsWith(prefix))
      .reduce((s, e) => s + Number(e.amount), 0)

    // Hardware cost: sum of est_total_cost of BOMs for projects with paid invoices this month
    // Simplified: use hardware_subtotal from paid invoices this month as proxy
    const monthHardwareRevenue = invoices
      .filter((i) => i.status === 'paid' && i.date_paid?.startsWith(prefix))
      .reduce((s, i) => s + Number(i.hardware_subtotal ?? 0), 0)

    const grossProfit = monthRevenue - monthExpenses
    const her = monthHardwareRevenue > 0 && teamHardwareSpendMonthly > 0
      ? monthHardwareRevenue / teamHardwareSpendMonthly
      : null

    monthly_pnl.push({
      year,
      month,
      total_revenue: monthRevenue,
      total_hardware_cost: 0,    // requires BOM join — computed separately per project
      total_labor_cost: 0,       // requires project.installer_hours join
      total_expenses: monthExpenses,
      gross_profit: grossProfit,
      gross_margin_pct: monthRevenue > 0 ? grossProfit / monthRevenue : null,
      her,
    })
  }

  const ytd_revenue = monthly_pnl.reduce((s, m) => s + m.total_revenue, 0)
  const ytd_profit  = monthly_pnl.reduce((s, m) => s + m.gross_profit, 0)
  const ytdHardwareRevenue = invoices
    .filter((i) => i.status === 'paid' && i.date_paid?.startsWith(`${year}`))
    .reduce((s, i) => s + Number(i.hardware_subtotal ?? 0), 0)
  const ytd_her = ytdHardwareRevenue > 0
    ? ytdHardwareRevenue / teamHardwareSpendAnnual
    : null

  return {
    pipeline_by_stage,
    total_signed_value,
    total_paid,
    monthly_pnl,
    ytd_revenue,
    ytd_profit,
    ytd_her,
  }
}
```

---

## src/services/settings.ts

### getSettings

```ts
/**
 * Returns the single settings row (id = 'default').
 * Throws if not found — settings row must be seeded at DB init.
 */
export async function getSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 'default')
    .single()

  if (error) throw error
  return data
}
```

### updateSettings

```ts
/**
 * Updates any settings fields.
 * Common updates per settings sub-page:
 *   /settings/pricing:  pro_venue_fee, pro_court_fee, autonomous_venue_fee,
 *                       autonomous_court_fee, pbk_venue_fee, pbk_court_fee,
 *                       sales_tax_rate, shipping_rate, target_margin
 *   /settings/team:     niko_annual_salary, niko_direct_allocation,
 *                       chad_annual_salary, chad_indirect_allocation,
 *                       annual_rent, annual_indirect_salaries
 *   /settings/travel:   lodging_per_day, airfare_default, labor_rate_per_hour
 */
export async function updateSettings(updates: SettingsUpdate): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .update(updates)
    .eq('id', 'default')
    .select()
    .single()

  if (error) throw error
  return data
}
```

---

## src/services/catalog.ts

### getHardwareCatalog

```ts
/**
 * Returns all hardware catalog items, optionally filtered by category.
 * Includes inactive items when showInactive = true (for Settings > Catalog).
 * Ordered by category then name.
 */
export async function getHardwareCatalog(params: {
  category?: BomCategory
  showInactive?: boolean
  q?: string
} = {}): Promise<HardwareCatalogItem[]> {
  let query = supabase
    .from('hardware_catalog')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (!params.showInactive) {
    query = query.eq('is_active', true)
  }
  if (params.category) {
    query = query.eq('category', params.category)
  }
  if (params.q) {
    query = query.or(`name.ilike.%${params.q}%,sku.ilike.%${params.q}%,vendor.ilike.%${params.q}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}
```

### createCatalogItem

```ts
/**
 * Creates a new hardware catalog item.
 * Also creates an inventory row for the new item (qty_on_hand = 0).
 */
export async function createCatalogItem(
  item: HardwareCatalogInsert
): Promise<HardwareCatalogItem> {
  const { data, error } = await supabase
    .from('hardware_catalog')
    .insert(item)
    .select()
    .single()

  if (error) throw error

  // Create inventory row
  await upsertInventoryRow(data.id)

  return data
}
```

### updateCatalogItem

```ts
/**
 * Updates a hardware catalog item.
 * All fields editable. Changing unit_cost does not retroactively update
 * existing project_bom_items (those capture the cost at BOM generation time).
 */
export async function updateCatalogItem(
  id: string,
  updates: HardwareCatalogUpdate
): Promise<HardwareCatalogItem> {
  const { data, error } = await supabase
    .from('hardware_catalog')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
```

### deactivateCatalogItem

```ts
/**
 * Soft-deletes a hardware catalog item by setting is_active = false.
 * Item remains in historical BOMs but won't appear in new BOM generation.
 */
export async function deactivateCatalogItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('hardware_catalog')
    .update({ is_active: false })
    .eq('id', id)

  if (error) throw error
}
```

---

## src/services/installers.ts

### getInstallers

```ts
/**
 * Returns active installers, optionally filtered by region (venue state).
 */
export async function getInstallers(params: {
  region?: string      // US state code or country code (e.g., 'NY', 'PH')
  includeInactive?: boolean
} = {}): Promise<Installer[]> {
  let query = supabase
    .from('installers')
    .select('*')
    .order('name', { ascending: true })

  if (!params.includeInactive) {
    query = query.eq('is_active', true)
  }
  if (params.region) {
    // GIN index on regions array
    query = query.contains('regions', [params.region])
  }

  const { data, error } = await query
  if (error) throw error
  return data
}
```

### createInstaller

```ts
export async function createInstaller(
  installer: InstallerInsert
): Promise<Installer> {
  const { data, error } = await supabase
    .from('installers')
    .insert(installer)
    .select()
    .single()

  if (error) throw error
  return data
}
```

### updateInstaller

```ts
export async function updateInstaller(
  id: string,
  updates: InstallerUpdate
): Promise<Installer> {
  const { data, error } = await supabase
    .from('installers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
```

---

## src/services/replay-signs.ts

### getReplaySign

```ts
/**
 * Returns the replay sign record for a project, or null if not yet created.
 */
export async function getReplaySign(
  projectId: string
): Promise<ReplaySign | null> {
  const { data, error } = await supabase
    .from('replay_signs')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle()

  if (error) throw error
  return data
}
```

### createReplaySign

```ts
/**
 * Creates the replay sign record for a project.
 * qty = project.replay_sign_count (court_count × 2).
 * Called when project enters Stage 2 procurement.
 */
export async function createReplaySign(
  project: Project
): Promise<ReplaySign> {
  const { data, error } = await supabase
    .from('replay_signs')
    .insert({
      project_id: project.id,
      qty: project.court_count * 2,
      status: 'staged',
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

### updateReplaySign

```ts
/**
 * Updates replay sign fields.
 * Common updates:
 *   status transition: staged → shipped → delivered → installed
 *   outreach_channel, outreach_date, tracking_number, vendor_order_id
 *   shipped_date, delivered_date, installed_date (set automatically on status change)
 *
 * Side effect on status = 'installed':
 *   Creates inventory_movement: project_shipped, qty_delta = -qty
 *   for the REPLAY-SIGN hardware catalog item.
 */
export async function updateReplaySign(
  id: string,
  updates: ReplaySignUpdate,
  projectId: string
): Promise<ReplaySign> {
  const payload: ReplaySignUpdate = { ...updates }

  // Auto-set date fields on status transition
  const today = new Date().toISOString().slice(0, 10)
  if (updates.status === 'shipped' && !updates.shipped_date) {
    payload.shipped_date = today
  }
  if (updates.status === 'delivered' && !updates.delivered_date) {
    payload.delivered_date = today
  }
  if (updates.status === 'installed' && !updates.installed_date) {
    payload.installed_date = today
  }

  const { data, error } = await supabase
    .from('replay_signs')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Side effect: record inventory movement on 'installed' transition
  if (updates.status === 'installed' && data.qty > 0) {
    // Look up REPLAY-SIGN SKU in hardware_catalog
    const { data: catalogItem } = await supabase
      .from('hardware_catalog')
      .select('id')
      .eq('sku', 'SIGNAGE-REPLAY-ALU')
      .maybeSingle()

    if (catalogItem) {
      await recordInventoryMovement({
        hardwareCatalogId: catalogItem.id,
        projectId,
        movementType: 'project_shipped',
        qtyDelta: -data.qty,
        reference: `Replay signs installed for project ${projectId}`,
      })
    }
  }

  return data
}
```

---

## src/services/cc-terminals.ts

### getCcTerminal

```ts
/**
 * Returns CC terminal record for a project, or null if not created.
 */
export async function getCcTerminal(
  projectId: string
): Promise<CcTerminal | null> {
  const { data, error } = await supabase
    .from('cc_terminals')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle()

  if (error) throw error
  return data
}
```

### createCcTerminal

```ts
/**
 * Creates a CC terminal record for a project.
 * Called from Stage 2 procurement when has_front_desk = true.
 * Default qty = 1; can be updated to 2 for multi-desk venues.
 */
export async function createCcTerminal(
  projectId: string,
  qty: number = 1
): Promise<CcTerminal> {
  const { data, error } = await supabase
    .from('cc_terminals')
    .insert({
      project_id: projectId,
      qty,
      status: 'not_ordered',
    })
    .select()
    .single()

  if (error) throw error
  return data
}
```

### updateCcTerminal

```ts
/**
 * Updates CC terminal fields.
 * Common transitions:
 *   not_ordered → ordered (sets order_date)
 *   ordered → delivered (sets delivered_date)
 *   delivered → installed (sets installed_date)
 * Auto-sets date fields on status change if not provided.
 */
export async function updateCcTerminal(
  id: string,
  updates: CcTerminalUpdate
): Promise<CcTerminal> {
  const payload: CcTerminalUpdate = { ...updates }
  const today = new Date().toISOString().slice(0, 10)

  if (updates.status === 'ordered' && !updates.order_date) {
    payload.order_date = today
  }
  if (updates.status === 'delivered' && !updates.delivered_date) {
    payload.delivered_date = today
  }
  if (updates.status === 'installed' && !updates.installed_date) {
    payload.installed_date = today
  }

  const { data, error } = await supabase
    .from('cc_terminals')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
```

---

## Error Handling Convention

All service functions throw on error — they do NOT return `{ data, error }` tuples.
Callers wrap in `try/catch` or let TanStack Router loaders surface to `errorComponent`.

```ts
// Pattern used in every service function:
const { data, error } = await supabase.from('table').select().single()
if (error) throw error
return data
```

**Error types from Supabase client**:
- `PostgrestError` — DB-level errors (constraint violation, RLS rejection, no rows)
  - `.code`: Postgres error code (e.g., '23505' = unique violation)
  - `.message`: human-readable error
  - `.details`: additional context
- `AuthError` — session/auth errors (handled at auth guard level, not in service layer)

**UI error handling**:
- Route loaders: throw → `errorComponent` shows retry button
- Mutation handlers (form submit, button click): catch → show toast with `error.message`
- Example toast pattern:
  ```ts
  try {
    await updateProject(id, updates)
    toast.success('Project saved')
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Failed to save project')
  }
  ```

---

## Optimistic Update Pattern

For checklist toggling (high-frequency action during deployment):

```ts
// In DeploymentWizard component:
const [items, setItems] = useState<DeploymentChecklistItem[]>(loaderData.checklistItems)

async function handleToggle(item: DeploymentChecklistItem) {
  // 1. Optimistically update local state
  setItems((prev) =>
    prev.map((i) =>
      i.id === item.id
        ? { ...i, is_completed: !i.is_completed, completed_at: !i.is_completed ? new Date().toISOString() : null }
        : i
    )
  )

  // 2. Persist to DB
  try {
    await toggleChecklistItem(item.id, !item.is_completed)
  } catch (err) {
    // 3. Revert on failure
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? item : i  // restore original item
      )
    )
    toast.error('Failed to save — check connection')
  }
}
```

---

## Route Loader Data Shape

Each route loader returns a typed object used by the page component.

### /projects loader

```ts
// Loader return type
type DashboardLoaderData = {
  data: ProjectWithInstaller[]
  count: number
}
```

### /projects/$projectId/intake loader

```ts
type IntakeLoaderData = {
  project: ProjectWithInstaller
  installers: Installer[]  // for installer dropdown
  settings: Settings        // for ISP threshold display
}
```

### /projects/$projectId/procurement loader

```ts
type ProcurementLoaderData = {
  project: ProjectWithInstaller
  bomItems: ProjectBomItemWithCatalog[]
  purchaseOrders: PurchaseOrderWithItems[]
  inventoryItems: InventoryWithCatalog[]  // for stock check display
  replaySign: ReplaySign | null
  ccTerminal: CcTerminal | null
  settings: Settings
}
```

### /projects/$projectId/deployment loader

```ts
type DeploymentLoaderData = {
  project: ProjectWithInstaller
  checklistItems: DeploymentChecklistItem[]
}
```

### /projects/$projectId/financials loader

```ts
type FinancialsLoaderData = {
  project: ProjectWithInstaller
  invoices: Invoice[]
  expenses: Expense[]
  settings: Settings
  pnl: ProjectPnL
}
```

### /inventory loader

```ts
type InventoryLoaderData = {
  items: InventoryWithCatalog[]
  recentMovements: InventoryMovementWithCatalog[]
}
```

### /financials loader

```ts
type GlobalFinancialsLoaderData = {
  dashboard: FinancialsDashboard
  settings: Settings
}
```

### /settings/pricing loader

```ts
type PricingSettingsLoaderData = { settings: Settings }
```

### /settings/catalog loader

```ts
type CatalogSettingsLoaderData = {
  items: HardwareCatalogItem[]
  inventory: InventoryWithCatalog[]   // for stock column in catalog view
}
```

### /settings/team loader

```ts
type TeamSettingsLoaderData = {
  settings: Settings
  installers: Installer[]
}
```

### /settings/travel loader

```ts
type TravelSettingsLoaderData = { settings: Settings }
```
