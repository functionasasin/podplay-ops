# Business Logic: Inventory Management

**Aspect**: logic-inventory-management
**Wave**: 3 — Business Logic & Workflows
**Date**: 2026-03-06
**MRP Source**: ORDER INPUT sheet, INVENTORY sheet (derived from design doc + usage guide analysis)
**Schema Reference**: `final-mega-spec/data-model/schema.md` — `inventory`, `inventory_movements`, `purchase_orders`, `purchase_order_items`, `project_bom_items`

---

## Overview

Inventory management covers the full lifecycle of hardware stock from vendor procurement through
project shipment. The system tracks three key quantities per hardware item:

- `qty_on_hand` — physically in the NJ lab/warehouse
- `qty_allocated` — reserved for active projects (subset of on_hand)
- `qty_available` — generated column: `qty_on_hand - qty_allocated`

All stock changes produce an `inventory_movements` audit record. This enables full reconciliation:
the sum of all movements for an item equals the current `qty_on_hand`.

---

## State Machine: Stock Lifecycle

```
[vendor catalog item]
       │
       ▼
  PO created (status: pending)
       │
       ▼
  PO ordered (status: ordered)     ← vendor order placed
       │
       ▼
  PO partial (status: partial)     ← some qty_received, more expected
       │
       ▼
  PO received (status: received)   ← all qty_received
       │
       │  → inventory.qty_on_hand += qty_received
       │  → movement: purchase_order_received (positive delta)
       ▼
  Stock available (qty_available > 0)
       │
       ▼
  Allocated to project             ← Stage 2: BOM approved
       │
       │  → inventory.qty_allocated += qty
       │  → project_bom_items.allocated = true
       │  → movement: project_allocated (positive delta tracked separately)
       ▼
  Shipped to venue                 ← Stage 2: packing confirmed
       │
       │  → inventory.qty_on_hand -= qty
       │  → inventory.qty_allocated -= qty
       │  → project_bom_items.shipped = true
       │  → movement: project_shipped (negative delta)
       ▼
  Installed at venue
```

---

## Operations

### 1. Create Purchase Order

**Trigger**: Ops creates a PO in Stage 2 (Procurement) or from Global Inventory page.

**Inputs**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `vendor` | string | yes | e.g., "UniFi", "Ingram", "Amazon", "Square" |
| `project_id` | UUID \| null | no | Null for stock replenishment POs |
| `order_date` | date | yes | Defaults to today |
| `expected_date` | date | no | Estimated delivery |
| `items` | PO line items array | yes | One entry per hardware SKU |
| `items[].hardware_catalog_id` | UUID | yes | |
| `items[].qty_ordered` | integer ≥ 1 | yes | |
| `items[].unit_cost` | decimal | yes | Copy from hardware_catalog.unit_cost; overridable |
| `notes` | string | no | |

**Algorithm**:

```typescript
async function createPurchaseOrder(input: CreatePOInput): Promise<PurchaseOrder> {
  // 1. Generate PO number: "PO-{YYYY}-{NNN}" — sequential within year
  const year = new Date().getFullYear();
  const countResult = await supabase
    .from('purchase_orders')
    .select('id', { count: 'exact' })
    .ilike('po_number', `PO-${year}-%`);
  const seq = String((countResult.count ?? 0) + 1).padStart(3, '0');
  const po_number = `PO-${year}-${seq}`;

  // 2. Insert purchase_order
  const { data: po } = await supabase
    .from('purchase_orders')
    .insert({
      po_number,
      vendor: input.vendor,
      project_id: input.project_id ?? null,
      order_date: input.order_date,
      expected_date: input.expected_date ?? null,
      total_cost: input.items.reduce((sum, i) => sum + i.qty_ordered * i.unit_cost, 0),
      status: 'pending',
      notes: input.notes ?? null,
    })
    .select()
    .single();

  // 3. Insert purchase_order_items
  await supabase
    .from('purchase_order_items')
    .insert(input.items.map(item => ({
      purchase_order_id: po.id,
      hardware_catalog_id: item.hardware_catalog_id,
      qty_ordered: item.qty_ordered,
      qty_received: 0,
      unit_cost: item.unit_cost,
    })));

  return po;
}
```

**Status progression** (manual update by ops):
- `pending` → `ordered`: Ops confirms the vendor order was placed.
- `ordered` → `partial`: First receiving event (some but not all items).
- `ordered` | `partial` → `received`: All items received.
- Any → `cancelled`: Order was cancelled before delivery.

**Validation**:
- `items` array must have at least one entry.
- `qty_ordered` must be ≥ 1 for all items.
- `unit_cost` must be > 0 for all items.
- Duplicate `hardware_catalog_id` within one PO: merge into single line (sum qty).

---

### 2. Receive PO Items

**Trigger**: Ops marks items as received in the procurement view.

**Inputs**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `purchase_order_id` | UUID | yes | |
| `receivings` | array | yes | One entry per line being received |
| `receivings[].po_item_id` | UUID | yes | References `purchase_order_items.id` |
| `receivings[].qty_received_now` | integer ≥ 1 | yes | Units received in this receiving event |
| `received_date` | date | yes | Defaults to today |
| `tracking_number` | string | no | Carrier tracking number |

**Algorithm**:

```typescript
async function receivePOItems(input: ReceivePOInput): Promise<void> {
  for (const r of input.receivings) {
    // 1. Load PO item to get hardware_catalog_id and current qty_received
    const { data: poItem } = await supabase
      .from('purchase_order_items')
      .select('*')
      .eq('id', r.po_item_id)
      .single();

    const newQtyReceived = poItem.qty_received + r.qty_received_now;
    if (newQtyReceived > poItem.qty_ordered) {
      throw new Error(
        `Cannot receive ${r.qty_received_now}: would exceed ordered qty ${poItem.qty_ordered}`
      );
    }

    // 2. Update purchase_order_items.qty_received
    await supabase
      .from('purchase_order_items')
      .update({ qty_received: newQtyReceived })
      .eq('id', r.po_item_id);

    // 3. Increment inventory.qty_on_hand
    await supabase.rpc('increment_inventory', {
      p_hardware_catalog_id: poItem.hardware_catalog_id,
      p_delta: r.qty_received_now,
    });
    // increment_inventory: INSERT ... ON CONFLICT (hardware_catalog_id) DO UPDATE SET qty_on_hand = qty_on_hand + p_delta

    // 4. Record inventory movement
    await supabase
      .from('inventory_movements')
      .insert({
        hardware_catalog_id: poItem.hardware_catalog_id,
        project_id: null,
        movement_type: 'purchase_order_received',
        qty_delta: r.qty_received_now,  // positive
        reference: input.tracking_number ?? null,
        notes: `PO ${poItem.purchase_order_id} received`,
      });
  }

  // 5. Compute new PO status after all receivings
  const { data: allItems } = await supabase
    .from('purchase_order_items')
    .select('qty_ordered, qty_received')
    .eq('purchase_order_id', input.purchase_order_id);

  const totalOrdered = allItems.reduce((s, i) => s + i.qty_ordered, 0);
  const totalReceived = allItems.reduce((s, i) => s + i.qty_received, 0);
  const newStatus =
    totalReceived === 0 ? 'ordered' :
    totalReceived < totalOrdered ? 'partial' :
    'received';

  await supabase
    .from('purchase_orders')
    .update({
      status: newStatus,
      received_date: totalReceived === totalOrdered ? input.received_date : null,
      tracking_number: input.tracking_number ?? undefined,
    })
    .eq('id', input.purchase_order_id);
}
```

**Supabase RPC — `increment_inventory`**:

```sql
CREATE OR REPLACE FUNCTION increment_inventory(
  p_hardware_catalog_id UUID,
  p_delta               INTEGER
) RETURNS VOID AS $$
BEGIN
  INSERT INTO inventory (hardware_catalog_id, qty_on_hand, qty_allocated)
  VALUES (p_hardware_catalog_id, GREATEST(0, p_delta), 0)
  ON CONFLICT (hardware_catalog_id) DO UPDATE
    SET qty_on_hand = inventory.qty_on_hand + p_delta,
        updated_at  = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Note**: `qty_on_hand` must never go negative. If a receiving delta would make it negative
(e.g., receiving after an adjustment), clamp at 0 and log a warning.

---

### 3. Allocate Inventory to Project

**Trigger**: Stage 2 wizard — ops clicks "Confirm BOM" after reviewing/editing BOM items.

**Inputs**: `project_id` (UUID). All `project_bom_items` for the project are allocated at once.

**Algorithm**:

```typescript
async function allocateInventoryForProject(projectId: string): Promise<AllocationResult> {
  // 1. Load all BOM items not yet allocated
  const { data: bomItems } = await supabase
    .from('project_bom_items')
    .select('id, hardware_catalog_id, qty')
    .eq('project_id', projectId)
    .eq('allocated', false);

  const shortfalls: ShortfallItem[] = [];

  for (const item of bomItems) {
    // 2. Check available stock
    const { data: inv } = await supabase
      .from('inventory')
      .select('qty_on_hand, qty_allocated, qty_available')
      .eq('hardware_catalog_id', item.hardware_catalog_id)
      .single();

    const available = inv?.qty_available ?? 0;

    if (available < item.qty) {
      shortfalls.push({
        hardware_catalog_id: item.hardware_catalog_id,
        qty_needed: item.qty,
        qty_available: available,
        shortfall: item.qty - available,
      });
    }
  }

  // 3. If any shortfalls, return them without mutating state
  //    Ops must resolve (create PO or adjust qty) before allocation can proceed
  if (shortfalls.length > 0) {
    return { success: false, shortfalls };
  }

  // 4. All items have sufficient stock — allocate
  for (const item of bomItems) {
    // Increment qty_allocated
    await supabase.rpc('allocate_inventory', {
      p_hardware_catalog_id: item.hardware_catalog_id,
      p_qty: item.qty,
    });

    // Record movement
    await supabase
      .from('inventory_movements')
      .insert({
        hardware_catalog_id: item.hardware_catalog_id,
        project_id: projectId,
        movement_type: 'project_allocated',
        qty_delta: item.qty,  // positive (reserved but not yet deducted from on_hand)
        reference: null,
        notes: `Allocated to project ${projectId}`,
      });

    // Mark BOM line as allocated
    await supabase
      .from('project_bom_items')
      .update({ allocated: true })
      .eq('id', item.id);
  }

  return { success: true, shortfalls: [] };
}
```

**Supabase RPC — `allocate_inventory`**:

```sql
CREATE OR REPLACE FUNCTION allocate_inventory(
  p_hardware_catalog_id UUID,
  p_qty                 INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE inventory
  SET qty_allocated = qty_allocated + p_qty,
      updated_at    = now()
  WHERE hardware_catalog_id = p_hardware_catalog_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Shortfall handling** (UI requirement):
- Show a table: Item Name | Need | Have | Shortage
- Each row with shortage links to "Create PO" pre-filled for that item.
- Ops can also edit the BOM qty downward (if alternate configuration acceptable).
- Re-check runs automatically after PO received or BOM qty edited.

**Partial allocation not supported**: Either all items allocate or none do. This prevents
partial allocation confusion (some items reserved, others not).

---

### 4. Ship to Venue (Deduct from Stock)

**Trigger**: Stage 2 wizard — ops clicks "Mark as Shipped" after packing list confirmed.

**Inputs**: `project_id` (UUID).

**Algorithm**:

```typescript
async function shipProjectInventory(projectId: string): Promise<void> {
  // 1. Load allocated BOM items not yet shipped
  const { data: bomItems } = await supabase
    .from('project_bom_items')
    .select('id, hardware_catalog_id, qty')
    .eq('project_id', projectId)
    .eq('allocated', true)
    .eq('shipped', false);

  for (const item of bomItems) {
    // 2. Decrement qty_on_hand AND qty_allocated
    await supabase.rpc('ship_inventory', {
      p_hardware_catalog_id: item.hardware_catalog_id,
      p_qty: item.qty,
    });

    // 3. Record movement (negative delta)
    await supabase
      .from('inventory_movements')
      .insert({
        hardware_catalog_id: item.hardware_catalog_id,
        project_id: projectId,
        movement_type: 'project_shipped',
        qty_delta: -item.qty,  // negative: deducted from on_hand
        reference: null,
        notes: `Shipped for project ${projectId}`,
      });

    // 4. Mark BOM line as shipped
    await supabase
      .from('project_bom_items')
      .update({ shipped: true })
      .eq('id', item.id);
  }

  // 5. Update project status to 'shipped'
  await supabase
    .from('projects')
    .update({ status: 'shipped' })
    .eq('id', projectId);
}
```

**Supabase RPC — `ship_inventory`**:

```sql
CREATE OR REPLACE FUNCTION ship_inventory(
  p_hardware_catalog_id UUID,
  p_qty                 INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE inventory
  SET qty_on_hand   = qty_on_hand   - p_qty,
      qty_allocated = qty_allocated - p_qty,
      updated_at    = now()
  WHERE hardware_catalog_id = p_hardware_catalog_id;

  -- Guard: qty_on_hand must not go negative
  IF (SELECT qty_on_hand FROM inventory WHERE hardware_catalog_id = p_hardware_catalog_id) < 0 THEN
    RAISE EXCEPTION 'Inventory qty_on_hand would go negative for item %', p_hardware_catalog_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 5. Manual Inventory Adjustment

**Trigger**: Global Inventory page — ops edits stock level directly (e.g., physical count
discrepancy, damaged items, returned items).

**Inputs**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `hardware_catalog_id` | UUID | yes | |
| `adjustment_qty` | integer | yes | Positive or negative |
| `reason` | string | yes | Required note explaining adjustment |
| `movement_type` | enum | yes | `adjustment_increase`, `adjustment_decrease`, or `return` |

**Algorithm**:

```typescript
async function adjustInventory(input: AdjustmentInput): Promise<void> {
  // Validate sign matches type
  if (input.movement_type === 'adjustment_increase' && input.adjustment_qty <= 0) {
    throw new Error('adjustment_increase requires positive qty');
  }
  if (input.movement_type === 'adjustment_decrease' && input.adjustment_qty >= 0) {
    throw new Error('adjustment_decrease requires negative qty');
  }

  // Update inventory.qty_on_hand
  await supabase.rpc('increment_inventory', {
    p_hardware_catalog_id: input.hardware_catalog_id,
    p_delta: input.adjustment_qty,
  });

  // Record movement
  await supabase
    .from('inventory_movements')
    .insert({
      hardware_catalog_id: input.hardware_catalog_id,
      project_id: null,
      movement_type: input.movement_type,
      qty_delta: input.adjustment_qty,
      reference: null,
      notes: input.reason,
    });
}
```

**Return from project**: Same as adjustment_increase but `movement_type = 'return'`.
Use case: hardware shipped to venue but not installed (cancelled project, extra units sent back).

---

### 6. Low Stock Detection

**Trigger**: Computed on every inventory query. No background job needed.

**Rule**:
```
is_low_stock = (qty_available <= reorder_threshold) AND (reorder_threshold > 0)
```

**Query** (used by Global Inventory page and Dashboard alerts):

```sql
SELECT
  hc.name,
  hc.sku,
  hc.vendor,
  inv.qty_on_hand,
  inv.qty_allocated,
  inv.qty_available,
  inv.reorder_threshold,
  (inv.qty_available <= inv.reorder_threshold AND inv.reorder_threshold > 0) AS is_low_stock
FROM inventory inv
JOIN hardware_catalog hc ON hc.id = inv.hardware_catalog_id
ORDER BY is_low_stock DESC, hc.name;
```

**Dashboard alert**: Show count of low-stock items in the header bar. Badge is red if > 0.
Clicking navigates to Inventory page with "Low Stock" filter pre-applied.

---

### 7. De-allocate on Project Cancellation

**Trigger**: Project status set to `cancelled` (manual, from Stage 1 or 2).

**Rule**: If items were allocated but not yet shipped, release them back to available.

**Algorithm**:

```typescript
async function deallocateProjectInventory(projectId: string): Promise<void> {
  // Load allocated-but-not-shipped BOM items
  const { data: bomItems } = await supabase
    .from('project_bom_items')
    .select('hardware_catalog_id, qty')
    .eq('project_id', projectId)
    .eq('allocated', true)
    .eq('shipped', false);

  for (const item of bomItems) {
    // Decrement qty_allocated only (not qty_on_hand)
    await supabase
      .from('inventory')
      .update({ qty_allocated: supabase.rpc('decrement_allocated', { ... }) })
      // Use raw update:
    await supabase.rpc('deallocate_inventory', {
      p_hardware_catalog_id: item.hardware_catalog_id,
      p_qty: item.qty,
    });

    // Record movement (negative allocation reversal)
    await supabase
      .from('inventory_movements')
      .insert({
        hardware_catalog_id: item.hardware_catalog_id,
        project_id: projectId,
        movement_type: 'adjustment_increase',  // released back to available
        qty_delta: 0,  // qty_on_hand unchanged; only qty_allocated decremented
        reference: null,
        notes: `De-allocated from cancelled project ${projectId}`,
      });

    // Mark BOM line as no longer allocated
    await supabase
      .from('project_bom_items')
      .update({ allocated: false })
      .eq('project_id', projectId)
      .eq('hardware_catalog_id', item.hardware_catalog_id);
  }
}
```

**Supabase RPC — `deallocate_inventory`**:

```sql
CREATE OR REPLACE FUNCTION deallocate_inventory(
  p_hardware_catalog_id UUID,
  p_qty                 INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE inventory
  SET qty_allocated = GREATEST(0, qty_allocated - p_qty),
      updated_at    = now()
  WHERE hardware_catalog_id = p_hardware_catalog_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Note**: The movement record for de-allocation has `qty_delta = 0` because `qty_on_hand` does
not change — only `qty_allocated` changes. The audit trail captures the event through `notes`.

---

## Data Invariants

These invariants must hold at all times. Violated invariants indicate a bug or manual error:

| Invariant | Check |
|-----------|-------|
| `qty_available ≥ 0` | `qty_on_hand ≥ qty_allocated` always |
| `qty_allocated ≤ qty_on_hand` | Cannot allocate more than you have |
| `qty_on_hand ≥ 0` | Cannot ship more than on_hand |
| Sum of movements = qty_on_hand | Full audit log completeness check |
| Every allocated BOM item has a movement | `project_allocated` movement exists per bom_item |

---

## Reconciliation Check

The reconciliation query verifies that `qty_on_hand` equals what the movement log implies:

```sql
WITH received AS (
  SELECT hardware_catalog_id, SUM(qty_received) AS total_received
  FROM purchase_order_items
  GROUP BY hardware_catalog_id
),
movements AS (
  SELECT hardware_catalog_id, SUM(qty_delta) AS net_delta
  FROM inventory_movements
  GROUP BY hardware_catalog_id
)
SELECT
  hc.name,
  hc.sku,
  inv.qty_on_hand                               AS actual_qty,
  COALESCE(m.net_delta, 0)                      AS movement_implied_qty,
  inv.qty_on_hand - COALESCE(m.net_delta, 0)    AS discrepancy
FROM inventory inv
JOIN hardware_catalog hc ON hc.id = inv.hardware_catalog_id
LEFT JOIN movements m ON m.hardware_catalog_id = inv.hardware_catalog_id
WHERE inv.qty_on_hand != COALESCE(m.net_delta, 0)
ORDER BY ABS(inv.qty_on_hand - COALESCE(m.net_delta, 0)) DESC;
```

Non-empty result = inventory is out of sync with movements. Operations team must investigate
and post a correction via manual adjustment (Section 5).

---

## Stage 2 Procurement Workflow Integration

The Stage 2 wizard orchestrates inventory management in this sequence:

```
Stage 2 Entry
│
├─ Step 1: BOM Review
│   - Display all project_bom_items with current qty_available per item
│   - Flag items with insufficient stock (qty_available < qty_needed)
│   - Ops can edit qty, swap SKU, or mark item as "source externally"
│
├─ Step 2: Create POs (for items with insufficient stock)
│   - Pre-filled PO form per vendor grouping
│   - Ops confirms vendor and expected delivery
│   - createPurchaseOrder() called
│
├─ Step 3: Receive POs (when hardware arrives)
│   - List open POs with expected dates
│   - Ops enters qty_received per line item
│   - receivePOItems() called → inventory.qty_on_hand increases
│
├─ Step 4: Confirm Allocation (all items now in stock)
│   - "Confirm BOM & Allocate" button — enabled only when all items have sufficient qty_available
│   - allocateInventoryForProject() called → inventory.qty_allocated increases
│   - All project_bom_items.allocated = true
│
├─ Step 5: Pack & Ship
│   - Packing checklist: verify each BOM item physically packed
│   - Enter shipment tracking number
│   - "Confirm Shipped" button
│   - shipProjectInventory() called → qty_on_hand decremented
│   - project.status → 'shipped'
│
└─ Stage 3 Entry (Deployment)
```

---

## Edge Cases

| Case | Handling |
|------|----------|
| PO for stock replenishment (no project) | `project_id = null` on PO; movement has `project_id = null` |
| Item shipped directly from vendor to venue (drop-ship) | Create PO → receive → immediately ship in one step; qty_on_hand transits 0 net |
| Item not in hardware_catalog | Cannot be added to PO — must add to hardware_catalog first |
| Receiving more than ordered | Reject with error: "Cannot receive X: would exceed ordered qty Y" |
| Two projects need same item, insufficient total stock | First project to run allocation wins; second sees shortfall warning |
| Project BOM qty edited down after allocation | Must de-allocate old qty, re-allocate new qty; net delta applied to inventory |
| Hardware damaged on arrival | Receive as normal, then post an `adjustment_decrease` movement with reason "damaged on arrival" |
| Hardware lost in transit | Open PO stays as `partial`; new PO created for replacement units |

---

## Service Function Signatures

All functions are in `src/services/inventory.ts`:

```typescript
// Create a purchase order
createPurchaseOrder(input: CreatePOInput): Promise<PurchaseOrder>

// Receive items from a PO (updates qty_on_hand + movements)
receivePOItems(input: ReceivePOInput): Promise<void>

// Allocate stock for a project's BOM (all-or-nothing)
allocateInventoryForProject(projectId: string): Promise<AllocationResult>

// Ship project hardware to venue (deduct from qty_on_hand)
shipProjectInventory(projectId: string): Promise<void>

// Manual stock adjustment (increase/decrease/return)
adjustInventory(input: AdjustmentInput): Promise<void>

// Release allocation on project cancellation
deallocateProjectInventory(projectId: string): Promise<void>

// Get current inventory levels with low-stock flag
getInventoryLevels(): Promise<InventoryRow[]>

// Get movement history for an item or project
getInventoryMovements(filter: { hardwareCatalogId?: string; projectId?: string }): Promise<InventoryMovement[]>

// Run reconciliation check (returns discrepancies only)
reconcileInventory(): Promise<ReconciliationRow[]>
```

---

## Input Types

```typescript
interface CreatePOInput {
  vendor: string;
  project_id: string | null;
  order_date: string;           // ISO date
  expected_date?: string;       // ISO date
  items: {
    hardware_catalog_id: string;
    qty_ordered: number;
    unit_cost: number;
  }[];
  notes?: string;
}

interface ReceivePOInput {
  purchase_order_id: string;
  received_date: string;        // ISO date; defaults to today
  tracking_number?: string;
  receivings: {
    po_item_id: string;
    qty_received_now: number;
  }[];
}

interface AdjustmentInput {
  hardware_catalog_id: string;
  adjustment_qty: number;       // positive for increase, negative for decrease
  movement_type: 'adjustment_increase' | 'adjustment_decrease' | 'return';
  reason: string;               // required
}

interface AllocationResult {
  success: boolean;
  shortfalls: {
    hardware_catalog_id: string;
    item_name: string;
    qty_needed: number;
    qty_available: number;
    shortfall: number;
  }[];
}

interface InventoryRow {
  id: string;
  hardware_catalog_id: string;
  name: string;
  sku: string;
  vendor: string;
  qty_on_hand: number;
  qty_allocated: number;
  qty_available: number;
  reorder_threshold: number;
  is_low_stock: boolean;
  notes: string | null;
}
```
