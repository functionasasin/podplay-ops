# PodPlay Ops Wizard — Stage 2: Procurement Wizard

**Aspect**: design-wizard-procurement
**Wave**: 4 — Full-Stack Product Design
**Date**: 2026-03-06
**Route**: `/projects/$projectId/procurement`
**Route file**: `src/routes/_auth/projects/$projectId/procurement/index.tsx`
**Component file**: `src/components/wizard/procurement/ProcurementWizard.tsx`
**Schema reference**: `final-mega-spec/data-model/schema.md` — `project_bom_items`, `hardware_catalog`, `inventory`, `purchase_orders`, `purchase_order_items`, `inventory_movements`, `cc_terminals`, `replay_signs`
**Logic reference**: `final-mega-spec/business-logic/bom-generation.md`, `inventory-management.md`, `sign-fulfillment.md`, `cost-analysis.md`

---

## Overview

The Procurement Wizard is Stage 2 of the project lifecycle. It covers everything between intake approval and handing off hardware to the deployment team: BOM review, inventory availability check, vendor PO creation, receiving, packing confirmation, CC terminal ordering (conditional), and replay sign fulfillment.

**Entry**: Project transitions from `project_status = 'intake'` to `project_status = 'procurement'` when the ops person clicks "Advance to Procurement" on the intake review screen. On entry, the system calls `ensureReplaySignRecord()` and `ensureCCTerminalRecord()` if applicable.

**Exit**: "Mark Ready for Deployment" button advances project to `project_status = 'deployment'` and seeds the deployment checklist from templates. Button is enabled only when all five exit conditions are met (see §9).

**Two modes**:
1. **Active mode** — `project_status = 'procurement'`: full editing capability on all tabs.
2. **View mode** — `project_status` is `deployment`, `financial_close`, or `completed`: all inputs are read-only; no action buttons active except "Back to Procurement" which does nothing (navigation only).

---

## Route Configuration

**File**: `src/routes/_auth/projects/$projectId/procurement/index.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { getProject } from '@/services/projects'
import { getProjectBom } from '@/services/bom'
import { getInventoryForProject } from '@/services/inventory'
import { getProjectPurchaseOrders } from '@/services/purchaseOrders'
import { getCCTerminal } from '@/services/ccTerminals'
import { getReplaySigns } from '@/services/replaySigns'
import { getSettings } from '@/services/settings'
import { ProcurementWizard } from '@/components/wizard/procurement/ProcurementWizard'

export const Route = createFileRoute(
  '/_auth/projects/$projectId/procurement/'
)({
  loader: async ({ params }) => {
    const [project, bom, inventory, purchaseOrders, ccTerminal, replaySigns, settings] =
      await Promise.all([
        getProject(params.projectId),
        getProjectBom(params.projectId),
        getInventoryForProject(params.projectId),
        getProjectPurchaseOrders(params.projectId),
        getCCTerminal(params.projectId),      // null if !has_front_desk
        getReplaySigns(params.projectId),
        getSettings(),
      ])
    return { project, bom, inventory, purchaseOrders, ccTerminal, replaySigns, settings }
  },
  component: ProcurementWizard,
  pendingComponent: ProcurementSkeleton,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-destructive">
      <p className="font-medium">Failed to load procurement data</p>
      <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
    </div>
  ),
})
```

**Redirect guard**: If `project.project_status === 'intake'`, redirect to `/projects/$projectId/intake` (project has not yet been advanced). Implemented in the loader:

```tsx
loader: async ({ params }) => {
  const project = await getProject(params.projectId)
  if (project.project_status === 'intake') {
    throw redirect({ to: `/projects/${params.projectId}/intake` })
  }
  // ...rest of parallel loads
}
```

---

## Component Tree

```
ProcurementWizard                      (src/components/wizard/procurement/ProcurementWizard.tsx)
├── WizardSidebar                      (shared, from intake — marks Stage 2 active)
├── ProcurementTabs                    (shadcn Tabs — 5 or 7 tabs depending on has_front_desk)
│   ├── Tab: "BOM Review"              → BomReviewTab
│   ├── Tab: "Inventory"               → InventoryCheckTab
│   ├── Tab: "Purchase Orders"         → PurchaseOrdersTab
│   ├── Tab: "Packing"                 → PackingTab
│   ├── Tab: "CC Terminal"             → CcTerminalTab   (rendered only if has_front_desk)
│   └── Tab: "Replay Signs"            → ReplaySignsTab
└── ProcurementFooter                  (progress summary + "Mark Ready for Deployment" button)
```

**Tab persistence**: Active tab stored in URL search param `?tab=bom|inventory|pos|packing|cc|signs`. Default tab is `bom`. Navigation between tabs does not trigger a full page reload; only the tab panel re-renders.

```tsx
// URL search schema
const procurementSearchSchema = z.object({
  tab: z.enum(['bom', 'inventory', 'pos', 'packing', 'cc', 'signs']).default('bom'),
})
```

---

## Tab 1: BOM Review (`BomReviewTab`)

**File**: `src/components/wizard/procurement/BomReviewTab.tsx`

**Purpose**: Display the auto-generated BOM (seeded at intake completion), allow ops to adjust quantities and costs, and show the full cost chain breakdown. This replaces the per-customer BOM tab in the MRP.

### Data Shown

One row per `project_bom_items` record, grouped by `hardware_catalog.category` (using `bom_category` enum order):

| Group order | Category label |
|-------------|----------------|
| 1 | Network Rack |
| 2 | Replay System |
| 3 | Displays |
| 4 | Access Control (Autonomous/Autonomous+ only — hidden for Pro/PBK) |
| 5 | Surveillance (Autonomous+ only — hidden for Pro/PBK/Autonomous) |
| 6 | Front Desk (visible only if `project.has_front_desk = true`) |
| 7 | Cabling |
| 8 | Signage |
| 9 | Infrastructure |
| 10 | PingPod Specific (visible only if `project.has_pingpod_wifi = true`) |

### Column Spec

| Column | Source | Notes |
|--------|--------|-------|
| SKU | `hardware_catalog.sku` | Monospace font, gray |
| Item Name | `hardware_catalog.name` | Link to `hardware_catalog.vendor_url` if set (opens new tab) |
| Qty | `project_bom_items.qty` | Editable number input; min=0, max=999 |
| Unit Cost | `project_bom_items.unit_cost` | Editable currency input; NULL shown as "—" with yellow ⚠ |
| Est. Total | `project_bom_items.est_total_cost` | Read-only generated; NULL if unit_cost is NULL |
| Shipping | `project_bom_items.shipping_rate` | Editable %; shown as "10%" — click to edit |
| Landed Cost | `project_bom_items.landed_cost` | Read-only generated |
| Margin | `project_bom_items.margin` | Editable %; shown as "10%" |
| Customer Price | `project_bom_items.customer_price` | Read-only generated; bold |
| Notes | `project_bom_items.notes` | Editable text; truncated to 1 line with expand |
| Actions | — | Row-level action menu: "Remove Item", "Reset to Catalog Cost" |

**Totals row** (sticky at bottom of table, outside category groups):

| Label | Value |
|-------|-------|
| Total Est. Hardware Cost | `SUM(est_total_cost)` |
| Total Landed Cost | `SUM(landed_cost)` |
| Total Customer Price | `SUM(customer_price)` |
| Service Fee | `getServiceFee(project, settings)` (tier venue fee + courts × court fee) |
| **Grand Total (pre-tax)** | Total Customer Price + Service Fee |
| Sales Tax (10.25%) | Grand Total × `settings.sales_tax_rate` |
| **Invoice Total** | Grand Total + Tax |

### PingPod Color Swap Banner

Rendered when `project.has_pingpod_wifi = true`:

```
[info banner — blue]
PingPod venue detected. Consider swapping camera colors:
  REPLAY-CAMERA-WHITE → REPLAY-CAMERA-BLACK
  SURV-CAMERA-WHITE → SURV-CAMERA-BLACK
Adjust quantities manually in the rows above.
```

### Inline Editing Behavior

All three editable columns (`qty`, `unit_cost`, `notes`) use inline editing:
- Click cell → input appears in place (no modal)
- `Enter` or blur → save via `updateBomItem()` call
- `Escape` → cancel without saving
- Optimistic update: row rerenders immediately; if save fails, row reverts and error toast appears

**`updateBomItem` service function**:

```typescript
// src/services/bom.ts
export async function updateBomItem(
  itemId: string,
  patch: Partial<Pick<ProjectBomItem, 'qty' | 'unit_cost' | 'shipping_rate' | 'margin' | 'notes'>>
): Promise<void> {
  const { error } = await supabase
    .from('project_bom_items')
    .update(patch)
    .eq('id', itemId)
  if (error) throw new Error(error.message)
}
```

**Validation rules (Zod)**:
- `qty`: `z.number().int().min(0).max(999)`
- `unit_cost`: `z.number().min(0).max(100000).nullable()`
- `shipping_rate`: `z.number().min(0).max(1)` (0.00–1.00 as decimal)
- `margin`: `z.number().min(0).max(0.99)` (0.00–0.99 as decimal)

### Add Custom Item

Button "Add Custom Item" (below the table, left-aligned):
- Opens a slide-over (`Sheet` from shadcn) with a form:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Hardware Item | Combobox from `hardware_catalog` | Yes | Searchable by SKU or name; shows only `is_active = true` items |
| Qty | Number input | Yes | min=1 |
| Unit Cost Override | Currency input | No | Pre-fills from catalog; editable |
| Notes | Textarea | No | |

- On submit: calls `addBomItem()` service function:

```typescript
// src/services/bom.ts
export async function addBomItem(
  projectId: string,
  input: { hardware_catalog_id: string; qty: number; unit_cost?: number; notes?: string }
): Promise<void> {
  const catalog = await supabase
    .from('hardware_catalog')
    .select('unit_cost, category')
    .eq('id', input.hardware_catalog_id)
    .single()

  const settings = await getSettings()

  const { error } = await supabase
    .from('project_bom_items')
    .insert({
      project_id: projectId,
      hardware_catalog_id: input.hardware_catalog_id,
      qty: input.qty,
      unit_cost: input.unit_cost ?? catalog.data!.unit_cost,
      shipping_rate: settings.shipping_rate,
      margin: settings.target_margin,
      notes: input.notes ?? null,
    })
  if (error) throw new Error(error.message)
  // If duplicate (UNIQUE constraint): surface error "Item already in BOM — edit the existing row instead"
}
```

### Remove Item

"Remove Item" from row action menu:
- Confirmation dialog: "Remove [Item Name] from BOM? This cannot be undone."
- On confirm: calls `removeBomItem(itemId)` → `DELETE FROM project_bom_items WHERE id = $1`
- Guard: if item is `allocated = true`, show warning: "This item is allocated in inventory. Removing it will release the allocation. Confirm?"

### Reset to Catalog Cost

"Reset to Catalog Cost" from row action menu:
- Sets `unit_cost` back to `hardware_catalog.unit_cost` for that row
- Calls `updateBomItem(itemId, { unit_cost: catalog.unit_cost })`

### BOM Regeneration

Button "Regenerate BOM" (top-right of BOM tab, secondary variant):
- Warning dialog: "Regenerating the BOM will discard all manual edits (quantities, cost overrides, custom items) and reset to the auto-generated values. This cannot be undone."
- On confirm: calls `generateBom(projectId)` after deleting all existing BOM rows:

```typescript
// src/services/bom.ts
export async function regenerateBom(projectId: string): Promise<void> {
  // 1. Delete all existing BOM rows for project
  await supabase.from('project_bom_items').delete().eq('project_id', projectId)
  // 2. Re-run generation (same algorithm as initial generation)
  await generateBom(projectId)
}
```

Guard: disabled if any `project_bom_items.allocated = true` (items already reserved in inventory cannot be regenerated without first releasing them).

---

## Tab 2: Inventory Check (`InventoryCheckTab`)

**File**: `src/components/wizard/procurement/InventoryCheckTab.tsx`

**Purpose**: Compare BOM quantities needed against current stock levels. Highlight shortfalls to drive PO creation decisions.

### Service Function

```typescript
// src/services/inventory.ts

export interface InventoryCheckRow {
  hardware_catalog_id: string
  sku: string
  name: string
  category: string
  qty_needed: number          // from project_bom_items.qty
  qty_on_hand: number         // from inventory.qty_on_hand
  qty_allocated: number       // from inventory.qty_allocated (other projects)
  qty_available: number       // inventory.qty_available (generated column)
  qty_on_order: number        // sum of open PO items qty_ordered - qty_received for this SKU
  qty_shortfall: number       // MAX(0, qty_needed - qty_available - qty_on_order)
  is_allocated_this_project: boolean  // project_bom_items.allocated
}

export async function getInventoryForProject(
  projectId: string
): Promise<InventoryCheckRow[]> {
  // 1. Load BOM items for this project
  const { data: bomItems } = await supabase
    .from('project_bom_items')
    .select(`
      qty, allocated,
      hardware_catalog!inner(id, sku, name, category)
    `)
    .eq('project_id', projectId)

  // 2. Load inventory for all BOM items
  const catalogIds = bomItems!.map(b => b.hardware_catalog.id)
  const { data: inventory } = await supabase
    .from('inventory')
    .select('hardware_catalog_id, qty_on_hand, qty_allocated, qty_available')
    .in('hardware_catalog_id', catalogIds)

  // 3. Load open PO quantities (not yet received) for each SKU
  // Open PO = purchase_orders.status IN ('pending', 'ordered', 'partial')
  const { data: openPoItems } = await supabase
    .from('purchase_order_items')
    .select(`
      hardware_catalog_id,
      qty_ordered,
      qty_received,
      purchase_orders!inner(status)
    `)
    .in('hardware_catalog_id', catalogIds)
    .in('purchase_orders.status', ['pending', 'ordered', 'partial'])

  // 4. Build and return inventory check rows
  // qty_on_order = SUM(qty_ordered - qty_received) per hardware_catalog_id across open POs
  // qty_shortfall = MAX(0, qty_needed - qty_available - qty_on_order)
}
```

### Column Spec

| Column | Source | Notes |
|--------|--------|-------|
| SKU | `hardware_catalog.sku` | Monospace |
| Item | `hardware_catalog.name` | |
| Need | `qty_needed` | From BOM |
| On Hand | `qty_on_hand` | Inventory stock |
| Allocated (others) | `qty_allocated` | Reserved by other projects |
| Available | `qty_available` | `on_hand - allocated` |
| On Order | `qty_on_order` | Open PO quantities |
| Shortfall | `qty_shortfall` | Red badge if > 0 |
| Status | — | Badge: "In Stock" (green), "On Order" (yellow), "Shortfall" (red), "Allocated" (blue) |

**Status badge logic**:
- `is_allocated_this_project = true` → "Allocated" (blue)
- `qty_shortfall > 0` → "Shortfall" (red)
- `qty_on_order >= qty_needed` → "On Order" (yellow)
- `qty_available >= qty_needed` → "In Stock" (green)

**Summary banner** at top of tab:

```
[green if all in stock, yellow if on order, red if shortfall]
{n} items in stock  |  {n} on order  |  {n} shortfall(s)
[button: "Create PO for Shortfalls →"] (only shown if any shortfall > 0)
```

Clicking "Create PO for Shortfalls" switches to the "Purchase Orders" tab with pre-populated form rows for all shortfall items.

### Allocate All Button

"Allocate All In-Stock Items" button (bottom-right):
- Allocates all BOM items where `qty_available >= qty_needed AND !allocated`
- Calls `allocateBomItems(projectId)` service function
- On success: `project_bom_items.allocated = true` for those rows, `inventory.qty_allocated += qty` for each

```typescript
// src/services/inventory.ts
export async function allocateBomItems(projectId: string): Promise<void> {
  // Load BOM items not yet allocated
  const { data: items } = await supabase
    .from('project_bom_items')
    .select('id, hardware_catalog_id, qty')
    .eq('project_id', projectId)
    .eq('allocated', false)

  for (const item of items ?? []) {
    // Check available qty
    const { data: inv } = await supabase
      .from('inventory')
      .select('qty_available')
      .eq('hardware_catalog_id', item.hardware_catalog_id)
      .single()

    if ((inv?.qty_available ?? 0) >= item.qty) {
      // Increment qty_allocated in inventory
      await supabase.rpc('increment_allocation', {
        p_hardware_catalog_id: item.hardware_catalog_id,
        p_delta: item.qty,
      })
      // Mark BOM item as allocated
      await supabase
        .from('project_bom_items')
        .update({ allocated: true })
        .eq('id', item.id)
      // Record movement
      await supabase.from('inventory_movements').insert({
        hardware_catalog_id: item.hardware_catalog_id,
        project_id: projectId,
        movement_type: 'project_allocated',
        qty_delta: item.qty,
        notes: `Allocated to project`,
      })
    }
  }
}
```

`increment_allocation` RPC:
```sql
-- Postgres function: increment or insert inventory row's qty_allocated
CREATE OR REPLACE FUNCTION increment_allocation(
  p_hardware_catalog_id UUID,
  p_delta INTEGER
) RETURNS void AS $$
BEGIN
  INSERT INTO inventory (hardware_catalog_id, qty_allocated)
  VALUES (p_hardware_catalog_id, p_delta)
  ON CONFLICT (hardware_catalog_id)
  DO UPDATE SET qty_allocated = inventory.qty_allocated + p_delta;
END;
$$ LANGUAGE plpgsql;
```

---

## Tab 3: Purchase Orders (`PurchaseOrdersTab`)

**File**: `src/components/wizard/procurement/PurchaseOrdersTab.tsx`

**Purpose**: Create and manage vendor purchase orders for items not in stock. Corresponds to the MRP ORDER INPUT sheet.

### PO List

Top section: existing POs linked to this project (`purchase_orders.project_id = projectId`).

| Column | Source | Notes |
|--------|--------|-------|
| PO # | `purchase_orders.po_number` | Click to expand |
| Vendor | `purchase_orders.vendor` | |
| Order Date | `purchase_orders.order_date` | |
| Expected | `purchase_orders.expected_date` | Yellow if overdue |
| Total | `purchase_orders.total_cost` | |
| Status | `purchase_orders.status` | Badge: pending/ordered/partial/received/cancelled |
| Actions | — | "Mark Ordered", "Receive Items", "Cancel" |

**Status badge colors**:
- `pending` → gray
- `ordered` → blue
- `partial` → yellow
- `received` → green
- `cancelled` → red, strikethrough

**Expand row** (click PO row): shows line items table:

| Column | Source |
|--------|--------|
| SKU | `hardware_catalog.sku` |
| Item | `hardware_catalog.name` |
| Qty Ordered | `purchase_order_items.qty_ordered` |
| Qty Received | `purchase_order_items.qty_received` |
| Unit Cost | `purchase_order_items.unit_cost` |
| Line Total | `purchase_order_items.line_total` (generated) |

### Create PO Form

"New Purchase Order" button (top-right) → opens a Sheet (slide-over) with form:

**Form fields**:

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Vendor | Text input with suggestions | Yes | `z.string().min(1)` | Common vendors shown as autocomplete options: "UniFi", "Apple Business", "Amazon", "Square", "Stripe", "EmpireTech", "Fast Signs" |
| Order Date | Date input | Yes | defaults to today | `z.string().date()` |
| Expected Date | Date input | No | must be >= order_date if set | |
| Notes | Textarea | No | | |
| Line Items | Array (see below) | Yes | min 1 row | |

**Line items sub-form** (repeating rows, "Add Row" button at bottom):

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| Hardware Item | Combobox from `hardware_catalog` | Yes | Searchable by SKU or name |
| Qty | Number input | Yes | `z.number().int().min(1)` |
| Unit Cost | Currency input | Yes | `z.number().min(0.01)` — pre-filled from `hardware_catalog.unit_cost` |

**Pre-population when arriving from "Create PO for Shortfalls"**: Line items table pre-populated with all shortfall items (hardware_catalog_id + shortfall qty + catalog unit_cost).

**Submit** → calls `createPurchaseOrder()`:

```typescript
// src/services/purchaseOrders.ts
export async function createPurchaseOrder(
  projectId: string,
  input: CreatePOInput
): Promise<PurchaseOrder> {
  // Generate PO number: PO-{YYYY}-{NNN}
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('purchase_orders')
    .select('id', { count: 'exact', head: true })
    .ilike('po_number', `PO-${year}-%`)
  const seq = String((count ?? 0) + 1).padStart(3, '0')
  const po_number = `PO-${year}-${seq}`

  const total_cost = input.items.reduce(
    (sum, i) => sum + i.qty_ordered * i.unit_cost, 0
  )

  const { data: po, error } = await supabase
    .from('purchase_orders')
    .insert({
      po_number,
      vendor: input.vendor,
      project_id: projectId,
      order_date: input.order_date,
      expected_date: input.expected_date ?? null,
      total_cost,
      status: 'pending',
      notes: input.notes ?? null,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)

  await supabase.from('purchase_order_items').insert(
    input.items.map(item => ({
      purchase_order_id: po.id,
      hardware_catalog_id: item.hardware_catalog_id,
      qty_ordered: item.qty_ordered,
      qty_received: 0,
      unit_cost: item.unit_cost,
    }))
  )

  return po
}
```

**Validation**:
- Duplicate `hardware_catalog_id` within one PO: merge into single line (sum qty) — show inline warning "Duplicate item merged" before submit
- `items` array min length 1; error toast if empty

### Status Transitions

**"Mark Ordered" button** (on `pending` POs):
- Inline confirmation: "Confirm that this PO has been placed with {vendor}?"
- On confirm: `UPDATE purchase_orders SET status = 'ordered' WHERE id = $1`

**"Receive Items" button** (on `ordered` or `partial` POs):
- Opens Receive Items modal (see §3.4 below)

**"Cancel" button** (on `pending` or `ordered` POs):
- Confirmation dialog: "Cancel PO {po_number}? Stock will not be adjusted since no items were received."
- On confirm: `UPDATE purchase_orders SET status = 'cancelled'`

### Receive Items Modal

Opened from "Receive Items" button on a PO row.

**Modal title**: "Receive Items — {po_number}"

**Form**: For each line item in the PO, one row:

| Column | Content |
|--------|---------|
| Item | `hardware_catalog.name` |
| Ordered | `qty_ordered` (read-only) |
| Previously Received | `qty_received` (read-only) |
| Remaining | `qty_ordered - qty_received` (read-only) |
| Receiving Now | Number input; default = remaining; `z.number().int().min(0).max(remaining)` |

**Additional fields**:
- Received Date (date input, defaults to today)
- Tracking Number (text input, optional)

**Submit** → calls `receivePOItems()`:

```typescript
// src/services/purchaseOrders.ts
export async function receivePOItems(input: ReceivePOInput): Promise<void> {
  for (const r of input.receivings) {
    if (r.qty_received_now === 0) continue  // skip rows with 0 entered

    const { data: poItem } = await supabase
      .from('purchase_order_items')
      .select('hardware_catalog_id, qty_ordered, qty_received, purchase_order_id')
      .eq('id', r.po_item_id)
      .single()

    const newQtyReceived = poItem!.qty_received + r.qty_received_now
    if (newQtyReceived > poItem!.qty_ordered) {
      throw new Error(
        `Cannot receive ${r.qty_received_now}: would exceed ordered qty ${poItem!.qty_ordered}`
      )
    }

    // Update PO item received count
    await supabase
      .from('purchase_order_items')
      .update({ qty_received: newQtyReceived })
      .eq('id', r.po_item_id)

    // Increment inventory.qty_on_hand
    await supabase.rpc('increment_inventory', {
      p_hardware_catalog_id: poItem!.hardware_catalog_id,
      p_delta: r.qty_received_now,
    })

    // Record movement
    await supabase.from('inventory_movements').insert({
      hardware_catalog_id: poItem!.hardware_catalog_id,
      project_id: null,
      movement_type: 'purchase_order_received',
      qty_delta: r.qty_received_now,
      reference: input.tracking_number ?? null,
      notes: `PO ${poItem!.purchase_order_id} received ${input.received_date}`,
    })
  }

  // Update PO status based on new totals
  // all received → 'received'; some → 'partial'
  await updatePoStatus(input.purchase_order_id)
}

async function updatePoStatus(poId: string): Promise<void> {
  const { data: items } = await supabase
    .from('purchase_order_items')
    .select('qty_ordered, qty_received')
    .eq('purchase_order_id', poId)

  const allReceived = items!.every(i => i.qty_received >= i.qty_ordered)
  const anyReceived = items!.some(i => i.qty_received > 0)
  const newStatus = allReceived ? 'received' : anyReceived ? 'partial' : 'ordered'

  await supabase
    .from('purchase_orders')
    .update({ status: newStatus })
    .eq('id', poId)
}
```

`increment_inventory` RPC:
```sql
CREATE OR REPLACE FUNCTION increment_inventory(
  p_hardware_catalog_id UUID,
  p_delta INTEGER
) RETURNS void AS $$
BEGIN
  INSERT INTO inventory (hardware_catalog_id, qty_on_hand)
  VALUES (p_hardware_catalog_id, p_delta)
  ON CONFLICT (hardware_catalog_id)
  DO UPDATE SET qty_on_hand = inventory.qty_on_hand + p_delta;
END;
$$ LANGUAGE plpgsql;
```

---

## Tab 4: Packing (`PackingTab`)

**File**: `src/components/wizard/procurement/PackingTab.tsx`

**Purpose**: Final packing confirmation before shipment to venue. Marks each BOM item as shipped, which deducts stock from inventory. Corresponds to the physical step where ops confirms the kit has been packed and handed to the shipping carrier.

### Packing List Table

Displays all `project_bom_items` in a checklist format.

| Column | Source | Notes |
|--------|--------|-------|
| ✓ | `project_bom_items.shipped` | Checkbox — toggleable |
| SKU | `hardware_catalog.sku` | |
| Item | `hardware_catalog.name` | |
| Qty | `project_bom_items.qty` | Read-only |
| Allocated | `project_bom_items.allocated` | Badge: "Yes" (green) / "No" (gray) |
| Shipped | `project_bom_items.shipped` | Badge: "Shipped" (blue) / "Pending" (gray) |
| Notes | `project_bom_items.notes` | Read-only here (edit in BOM Review tab) |

**Group by category** (same category order as BOM Review tab).

**"Mark All as Shipped"** button (top-right):
- Confirmation: "Mark all {n} BOM items as shipped? This will deduct them from inventory stock."
- Calls `shipBomItems(projectId, 'all')`

**Row checkbox toggle**:
- Checking a row → calls `shipBomItem(itemId)`
- Unchecking a row (if item is `shipped = true`) → calls `unshipBomItem(itemId)` (reversal — adds stock back)
  - Confirmation: "Un-ship this item? This will add {qty} units back to inventory stock."

### Service Functions

```typescript
// src/services/inventory.ts

export async function shipBomItem(itemId: string): Promise<void> {
  const { data: item } = await supabase
    .from('project_bom_items')
    .select('project_id, hardware_catalog_id, qty, shipped')
    .eq('id', itemId)
    .single()

  if (item!.shipped) return  // idempotent

  // 1. Deduct inventory
  await supabase.rpc('decrement_inventory_and_allocation', {
    p_hardware_catalog_id: item!.hardware_catalog_id,
    p_qty: item!.qty,
    p_is_allocated: item!.allocated ?? false,
  })

  // 2. Mark as shipped
  await supabase
    .from('project_bom_items')
    .update({ shipped: true, allocated: true })
    .eq('id', itemId)

  // 3. Record movement
  await supabase.from('inventory_movements').insert({
    hardware_catalog_id: item!.hardware_catalog_id,
    project_id: item!.project_id,
    movement_type: 'project_shipped',
    qty_delta: -item!.qty,
    notes: `Shipped to venue`,
  })
}

export async function shipBomItems(
  projectId: string,
  scope: 'all' | string[]
): Promise<void> {
  let query = supabase
    .from('project_bom_items')
    .select('id')
    .eq('project_id', projectId)
    .eq('shipped', false)

  if (scope !== 'all') {
    query = query.in('id', scope)
  }

  const { data: items } = await query
  for (const item of items ?? []) {
    await shipBomItem(item.id)
  }
}
```

`decrement_inventory_and_allocation` RPC:
```sql
CREATE OR REPLACE FUNCTION decrement_inventory_and_allocation(
  p_hardware_catalog_id UUID,
  p_qty INTEGER,
  p_is_allocated BOOLEAN
) RETURNS void AS $$
BEGIN
  UPDATE inventory
  SET
    qty_on_hand  = qty_on_hand  - p_qty,
    qty_allocated = CASE
      WHEN p_is_allocated THEN qty_allocated - p_qty
      ELSE qty_allocated
    END
  WHERE hardware_catalog_id = p_hardware_catalog_id;
END;
$$ LANGUAGE plpgsql;
```

### Packing Summary

Bottom of packing tab:

```
Items packed: {n_shipped} / {n_total}
[ProgressBar: n_shipped / n_total × 100%]
```

When `n_shipped === n_total`:

```
[green checkmark banner]
All items packed. Ready to add shipping label and dispatch.
```

---

## Tab 5: CC Terminal (`CcTerminalTab`)

**File**: `src/components/wizard/procurement/CcTerminalTab.tsx`

**Visibility**: Rendered only if `project.has_front_desk = true`. The tab is hidden (not rendered) when `has_front_desk = false`.

**Purpose**: Track the BBPOS WisePOS E credit card terminal order for the venue's front desk. Corresponds to MRP "CC Form" sheet. The terminal is ordered separately via Stripe (not a standard vendor PO) and shipped directly to the venue.

### Data Source

`cc_terminals` table, one row per project (`project_id` unique). Row is created by `ensureCCTerminalRecord()` on procurement entry (idempotent).

```typescript
// src/services/ccTerminals.ts
export async function ensureCCTerminalRecord(projectId: string): Promise<void> {
  const { data: existing } = await supabase
    .from('cc_terminals')
    .select('id')
    .eq('project_id', projectId)
    .maybeSingle()
  if (existing) return

  await supabase.from('cc_terminals').insert({
    project_id: projectId,
    qty: 1,
    status: 'not_ordered',
    cost_per_unit: 249.00,  // BBPOS WisePOS E standard price via Stripe
  })
}
```

### CC Terminal Card UI

Single card layout (not a table — only one terminal per project):

```
[CC Terminal — BBPOS WisePOS E]

Qty:         [number input, min=1, default=1]
Status:      [badge: not_ordered | ordered | delivered | installed]
Cost/Unit:   [currency input, default $249.00]
Total Cost:  [read-only: qty × cost_per_unit]

Order Date:  [date input]
Expected:    [date input]
Delivered:   [date input]
Installed:   [date input]

Stripe Order ID:  [text input]

Notes: [textarea]
```

**Action buttons** (shown based on current status):

| Current Status | Button Shown | Action |
|----------------|-------------|--------|
| `not_ordered` | "Mark Ordered" | Sets `status = 'ordered'`, sets `order_date = today` |
| `ordered` | "Mark Delivered" | Sets `status = 'delivered'`, sets `delivered_date = today` |
| `delivered` | "Mark Installed" | Sets `status = 'installed'`, sets `installed_date = today` |
| `installed` | — (status badge only) | No further action |

**Save changes** button: saves all editable fields (qty, cost_per_unit, stripe_order_id, notes, dates).

```typescript
// src/services/ccTerminals.ts
export async function updateCCTerminal(
  projectId: string,
  patch: Partial<CCTerminal>
): Promise<void> {
  const { error } = await supabase
    .from('cc_terminals')
    .update(patch)
    .eq('project_id', projectId)
  if (error) throw new Error(error.message)
}
```

**Zod schema**:
```typescript
const ccTerminalSchema = z.object({
  qty: z.number().int().min(1).max(10),
  cost_per_unit: z.number().min(0).max(10000).nullable(),
  stripe_order_id: z.string().max(100).optional().nullable(),
  order_date: z.string().date().optional().nullable(),
  expected_date: z.string().date().optional().nullable(),
  delivered_date: z.string().date().optional().nullable(),
  installed_date: z.string().date().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})
```

---

## Tab 6: Replay Signs (`ReplaySignsTab`)

**File**: `src/components/wizard/procurement/ReplaySignsTab.tsx`

**Visibility**: Always visible (every project gets replay signs regardless of tier).

**Purpose**: Track the replay sign order through the fulfillment pipeline (staged → shipped → delivered → installed). Signs are 6×8 inch aluminum prints ($25/unit) ordered from Fast Signs vendor and shipped directly to the venue. Corresponds to MRP "Customer Replay Signs" sheet.

### Data Source

`replay_signs` table, one row per project. Row created by `ensureReplaySignRecord()` on procurement entry.

### Replay Signs Card UI

Single card layout:

```
[Replay Signs — Aluminum Printed (Fast Signs)]

Qty:              [number input — default court_count × 2; shows "12 signs (6 courts × 2)"]
Cost/Unit:        [$25.00 — read-only (set from seed data in hardware_catalog)]
Total Cost:       [qty × $25.00 — read-only]

Status:           [staged | shipped | delivered | installed]

--- Outreach ---
Channel:          [select: Slack | Email | Other]
Outreach Date:    [date input]
Vendor Order ID:  [text input — Fast Signs confirmation number]

--- Shipping ---
Tracking Number:  [text input]
Shipped Date:     [date input]
Delivered Date:   [date input]
Installed Date:   [date input]

Notes: [textarea]
```

**Qty helper text**: Below the qty field: `"Auto-calculated: {court_count} courts × 2 = {replay_sign_count}. Adjust if ordering extras."`

**Action buttons** (based on current status):

| Current Status | Button | Guard | Action |
|----------------|--------|-------|--------|
| `staged` | "Mark Shipped" | `outreach_date` must be set | Sets `status = 'shipped'`, `shipped_date = today` |
| `shipped` | "Mark Delivered" | `shipped_date` must be set | Sets `status = 'delivered'`, `delivered_date = today` |
| `delivered` | "Mark Installed" | `delivered_date` must be set | Sets `status = 'installed'`, `installed_date = today`; triggers inventory decrement |
| `installed` | — (status badge only) | — | No further action |

**Guard enforcement**: If guard condition not met, the action button is disabled with a tooltip explaining what's required.

**Installed side effect** — inventory decrement:
```typescript
// Called when marking installed
async function markSignsInstalled(projectId: string): Promise<void> {
  const { data: signs } = await supabase
    .from('replay_signs')
    .select('qty')
    .eq('project_id', projectId)
    .single()

  const { data: catalogItem } = await supabase
    .from('hardware_catalog')
    .select('id')
    .eq('sku', 'REPLAY-SIGN')
    .single()

  // Update status
  await supabase
    .from('replay_signs')
    .update({ status: 'installed', installed_date: new Date().toISOString().split('T')[0] })
    .eq('project_id', projectId)

  // Record inventory movement (signs go directly to venue; decrement tracking stock)
  await supabase.from('inventory_movements').insert({
    hardware_catalog_id: catalogItem!.id,
    project_id: projectId,
    movement_type: 'project_shipped',
    qty_delta: -signs!.qty,
    notes: `Replay signs installed at venue`,
  })
}
```

**Service function**:
```typescript
// src/services/replaySigns.ts
export async function updateReplaySigns(
  projectId: string,
  patch: Partial<ReplaySigns>
): Promise<void> {
  const { error } = await supabase
    .from('replay_signs')
    .update(patch)
    .eq('project_id', projectId)
  if (error) throw new Error(error.message)
}

export async function transitionReplaySignStatus(
  projectId: string,
  newStatus: 'shipped' | 'delivered' | 'installed'
): Promise<void> {
  const dateField: Record<string, string> = {
    shipped: 'shipped_date',
    delivered: 'delivered_date',
    installed: 'installed_date',
  }

  const patch: Record<string, unknown> = {
    status: newStatus,
    [dateField[newStatus]]: new Date().toISOString().split('T')[0],
  }

  await supabase
    .from('replay_signs')
    .update(patch)
    .eq('project_id', projectId)

  if (newStatus === 'installed') {
    await markSignsInstalled(projectId)
  }
}
```

**Zod schema**:
```typescript
const replaySignsSchema = z.object({
  qty: z.number().int().min(1).max(200),
  outreach_channel: z.enum(['slack', 'email', 'other']).nullable(),
  outreach_date: z.string().date().nullable(),
  vendor_order_id: z.string().max(100).nullable(),
  tracking_number: z.string().max(100).nullable(),
  shipped_date: z.string().date().nullable(),
  delivered_date: z.string().date().nullable(),
  installed_date: z.string().date().nullable(),
  notes: z.string().max(1000).nullable(),
})
```

---

## Procurement Footer / Exit Condition

**File**: `src/components/wizard/procurement/ProcurementFooter.tsx`

Sticky footer bar at the bottom of the procurement wizard (below the tab panels, inside the Project Shell layout).

### Exit Checklist Display

Five conditions shown as checkmarks or ✗ icons:

| # | Condition | Check Logic |
|---|-----------|-------------|
| 1 | BOM approved (no zero-qty or null-cost rows) | `bom.every(i => i.qty > 0 && i.unit_cost !== null)` |
| 2 | All BOM items shipped | `bom.every(i => i.shipped === true)` |
| 3 | CC Terminal ordered (if applicable) | `!has_front_desk OR ccTerminal.status !== 'not_ordered'` |
| 4 | Replay signs outreach sent | `replaySigns.outreach_date !== null` |
| 5 | No open/overdue POs | `purchaseOrders.filter(po => ['pending','ordered','partial'].includes(po.status)).length === 0` |

**"Mark Ready for Deployment"** button:
- Disabled (gray) if any condition fails
- Tooltip on hover when disabled: lists which conditions are unmet
- Active (blue) when all 5 conditions pass

**On click**:
1. Confirmation dialog: "Advance this project to Stage 3: Deployment? The deployment checklist will be seeded from the template. This cannot be reversed."
2. On confirm:
   ```typescript
   async function advanceToDeployment(projectId: string): Promise<void> {
     // 1. Update project status
     await supabase
       .from('projects')
       .update({ project_status: 'deployment', deployment_status: 'not_started' })
       .eq('id', projectId)

     // 2. Seed deployment checklist from templates
     await seedDeploymentChecklist(projectId)

     // 3. Navigate to deployment stage
     navigate({ to: `/projects/${projectId}/deployment` })
   }
   ```

**`seedDeploymentChecklist`** service function:

```typescript
// src/services/deployment.ts
export async function seedDeploymentChecklist(projectId: string): Promise<void> {
  const { data: project } = await supabase
    .from('projects')
    .select('tier, replay_service_version')
    .eq('id', projectId)
    .single()

  // Load applicable templates for this tier and service version
  const { data: templates } = await supabase
    .from('deployment_checklist_templates')
    .select('*')
    .order('sort_order', { ascending: true })

  const applicable = templates!.filter(t => {
    // Filter by tier applicability
    if (t.applicable_tiers && t.applicable_tiers.length > 0) {
      if (!t.applicable_tiers.includes(project!.tier)) return false
    }
    // Filter V2-only steps
    if (t.is_v2_only && project!.replay_service_version !== 'v2') return false
    return true
  })

  // Resolve token substitutions and insert
  const projectData = await supabase
    .from('projects')
    .select('customer_name, court_count, ddns_subdomain, unifi_site_name, mac_mini_username, location_id')
    .eq('id', projectId)
    .single()

  const tokenMap: Record<string, string> = {
    '{{CUSTOMER_NAME}}': projectData.data!.customer_name,
    '{{COURT_COUNT}}': String(projectData.data!.court_count),
    '{{DDNS_SUBDOMAIN}}': projectData.data!.ddns_subdomain ?? '[set DDNS subdomain]',
    '{{UNIFI_SITE_NAME}}': projectData.data!.unifi_site_name ?? '[set UniFi site name]',
    '{{MAC_MINI_USERNAME}}': projectData.data!.mac_mini_username ?? '[set Mac Mini username]',
    '{{LOCATION_ID}}': projectData.data!.location_id ?? '[get Location ID from Agustin]',
  }

  function resolveTokens(text: string): string {
    return Object.entries(tokenMap).reduce(
      (s, [token, val]) => s.replaceAll(token, val),
      text
    )
  }

  await supabase.from('deployment_checklist_items').insert(
    applicable.map(t => ({
      project_id: projectId,
      template_id: t.id,
      phase: t.phase,
      step_number: t.step_number,
      sort_order: t.sort_order,
      title: t.title,
      description: resolveTokens(t.description),
      warnings: t.warnings,
      is_completed: false,
    }))
  )
}
```

---

## Service Layer Summary

All service functions for Stage 2 live in these files:

| File | Functions |
|------|-----------|
| `src/services/bom.ts` | `getProjectBom`, `updateBomItem`, `addBomItem`, `removeBomItem`, `regenerateBom` |
| `src/services/inventory.ts` | `getInventoryForProject`, `allocateBomItems`, `shipBomItem`, `shipBomItems` |
| `src/services/purchaseOrders.ts` | `getProjectPurchaseOrders`, `createPurchaseOrder`, `receivePOItems`, `updatePoStatus` |
| `src/services/ccTerminals.ts` | `getCCTerminal`, `ensureCCTerminalRecord`, `updateCCTerminal` |
| `src/services/replaySigns.ts` | `getReplaySigns`, `ensureReplaySignRecord`, `updateReplaySigns`, `transitionReplaySignStatus` |
| `src/services/deployment.ts` | `seedDeploymentChecklist` |

---

## Types

**File**: `src/types/procurement.ts`

```typescript
export interface ProjectBomItem {
  id: string
  project_id: string
  hardware_catalog_id: string
  hardware_catalog: {
    sku: string
    name: string
    vendor: string
    vendor_url: string | null
    category: BomCategory
  }
  qty: number
  unit_cost: number | null
  est_total_cost: number | null        // GENERATED ALWAYS
  shipping_rate: number | null
  landed_cost: number | null           // GENERATED ALWAYS
  margin: number | null
  customer_price: number | null        // GENERATED ALWAYS
  allocated: boolean
  shipped: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export type BomCategory =
  | 'network_rack'
  | 'replay_system'
  | 'displays'
  | 'access_control'
  | 'surveillance'
  | 'front_desk'
  | 'cabling'
  | 'signage'
  | 'infrastructure'
  | 'pingpod_specific'

export interface InventoryRow {
  hardware_catalog_id: string
  qty_on_hand: number
  qty_allocated: number
  qty_available: number       // GENERATED ALWAYS
  reorder_threshold: number
}

export interface PurchaseOrder {
  id: string
  po_number: string
  vendor: string
  project_id: string | null
  order_date: string
  expected_date: string | null
  received_date: string | null
  total_cost: number | null
  status: 'pending' | 'ordered' | 'partial' | 'received' | 'cancelled'
  tracking_number: string | null
  notes: string | null
  items: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  id: string
  purchase_order_id: string
  hardware_catalog_id: string
  hardware_catalog: { sku: string; name: string }
  qty_ordered: number
  qty_received: number
  unit_cost: number
  line_total: number          // GENERATED ALWAYS
  notes: string | null
}

export interface CCTerminal {
  id: string
  project_id: string
  qty: number
  status: 'not_ordered' | 'ordered' | 'delivered' | 'installed'
  order_date: string | null
  expected_date: string | null
  delivered_date: string | null
  installed_date: string | null
  stripe_order_id: string | null
  cost_per_unit: number | null
  notes: string | null
}

export interface ReplaySigns {
  id: string
  project_id: string
  qty: number
  status: 'staged' | 'shipped' | 'delivered' | 'installed'
  outreach_channel: 'slack' | 'email' | 'other' | null
  outreach_date: string | null
  vendor_order_id: string | null
  tracking_number: string | null
  shipped_date: string | null
  delivered_date: string | null
  installed_date: string | null
  notes: string | null
}

export interface CreatePOInput {
  vendor: string
  order_date: string
  expected_date?: string
  notes?: string
  items: Array<{
    hardware_catalog_id: string
    qty_ordered: number
    unit_cost: number
  }>
}
```

---

## Loading / Empty / Error States

| Component | Loading State | Empty State | Error State |
|-----------|--------------|-------------|-------------|
| BOM Review table | Skeleton rows (10 rows of gray bars) | "No BOM items. Click 'Regenerate BOM' to generate from template." | Error banner + retry button |
| Inventory Check table | Skeleton rows | "No BOM items to check." | Error banner |
| PO list | Skeleton rows | "No purchase orders for this project. Click 'New Purchase Order' to create one." | Error banner |
| Packing list | Skeleton rows | "No BOM items found." | Error banner |
| CC Terminal card | Spinner | Not applicable (always exists if has_front_desk) | Error banner |
| Replay Signs card | Spinner | Not applicable (always exists) | Error banner |

---

## File Structure

```
src/
├── routes/
│   └── _auth/projects/$projectId/procurement/
│       └── index.tsx                        # Route config, loader, redirect guard
├── components/wizard/procurement/
│   ├── ProcurementWizard.tsx               # Top-level: tabs + footer
│   ├── ProcurementTabs.tsx                 # shadcn Tabs wrapper
│   ├── ProcurementFooter.tsx               # Exit checklist + advance button
│   ├── BomReviewTab.tsx                    # Tab 1: BOM table, totals, add/remove
│   ├── BomItemRow.tsx                      # Single BOM row with inline editing
│   ├── BomTotalsRow.tsx                    # Sticky totals row
│   ├── AddCustomItemSheet.tsx              # Slide-over for adding custom BOM item
│   ├── InventoryCheckTab.tsx               # Tab 2: inventory availability table
│   ├── PurchaseOrdersTab.tsx               # Tab 3: PO list + create form
│   ├── CreatePoSheet.tsx                   # Slide-over for creating PO
│   ├── ReceiveItemsModal.tsx               # Dialog for receiving PO items
│   ├── PackingTab.tsx                      # Tab 4: packing checklist
│   ├── CcTerminalTab.tsx                   # Tab 5: CC terminal card (conditional)
│   └── ReplaySignsTab.tsx                  # Tab 6: replay signs fulfillment card
├── services/
│   ├── bom.ts                              # getProjectBom, updateBomItem, addBomItem, etc.
│   ├── inventory.ts                        # getInventoryForProject, allocateBomItems, shipBomItem
│   ├── purchaseOrders.ts                   # createPurchaseOrder, receivePOItems
│   ├── ccTerminals.ts                      # getCCTerminal, ensureCCTerminalRecord, updateCCTerminal
│   ├── replaySigns.ts                      # getReplaySigns, ensureReplaySignRecord, transitionStatus
│   └── deployment.ts                       # seedDeploymentChecklist (called on advance to Stage 3)
└── types/
    └── procurement.ts                      # All TypeScript types for Stage 2 entities
```
