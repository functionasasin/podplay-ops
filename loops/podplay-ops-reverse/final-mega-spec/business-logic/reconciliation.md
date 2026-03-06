# Business Logic: Reconciliation

**Aspect**: logic-reconciliation
**Wave**: 3 — Business Logic & Workflows
**Date**: 2026-03-06
**MRP Source**: Cross-sheet verification between ORDER INPUT, INVENTORY, CUSTOMER MASTER, COST ANALYSIS, INVOICING, EXPENSES tabs
**Schema Reference**: `final-mega-spec/data-model/schema.md` — `inventory`, `inventory_movements`, `purchase_orders`, `purchase_order_items`, `project_bom_items`, `invoices`, `expenses`, `projects`
**Depends On**: `logic-inventory-management`, `logic-invoicing`, `logic-financial-reporting`, `logic-cost-analysis`

---

## Overview

Reconciliation is the process of verifying that data across multiple tables remains internally consistent. In the original Google Sheets MRP, reconciliation was performed manually by cross-checking tabs (ORDER INPUT vs INVENTORY vs CUSTOMER MASTER vs COST ANALYSIS vs INVOICING). Broken INDIRECT formulas silently produced discrepancies.

The webapp replaces this with five automated reconciliation checks, each surfaced in the Global Financials page under a "Reconciliation" tab. Every check returns a list of discrepancy rows; an empty list means the check passes.

### The Five Reconciliation Checks

| ID | Name | What It Verifies | Tables |
|----|------|-----------------|--------|
| R1 | Inventory ↔ Movement Log | `qty_on_hand` = Σ(movement deltas) | `inventory`, `inventory_movements` |
| R2 | PO Receipts ↔ Inventory Movements | Every received PO line has a matching `purchase_order_received` movement | `purchase_order_items`, `inventory_movements` |
| R3 | Project BOM ↔ PO Costs | Actual PO unit costs match BOM `unit_cost` values | `project_bom_items`, `purchase_order_items` |
| R4 | Project Cost ↔ Invoice Amount | Hardware subtotal + expenses ≈ total project cost; margin is reasonable | `project_bom_items`, `expenses`, `invoices` |
| R5 | Revenue Stage ↔ Invoice Status | `projects.revenue_stage` matches the most advanced invoice status | `projects`, `invoices` |

---

## R1: Inventory ↔ Movement Log

### Definition

`inventory.qty_on_hand` must equal the net sum of all `inventory_movements.qty_delta` for that hardware item.

### Formula

```
expected_qty_on_hand = SUM(inventory_movements.qty_delta WHERE hardware_catalog_id = X)
discrepancy = inventory.qty_on_hand - expected_qty_on_hand
```

### SQL Query

```sql
WITH movement_totals AS (
  SELECT
    hardware_catalog_id,
    SUM(qty_delta) AS movement_implied_qty
  FROM inventory_movements
  GROUP BY hardware_catalog_id
)
SELECT
  hc.id                                          AS hardware_catalog_id,
  hc.name                                        AS item_name,
  hc.sku,
  inv.qty_on_hand                                AS actual_qty,
  COALESCE(mt.movement_implied_qty, 0)           AS movement_implied_qty,
  inv.qty_on_hand - COALESCE(mt.movement_implied_qty, 0) AS discrepancy,
  'R1' AS check_id
FROM inventory inv
JOIN hardware_catalog hc ON hc.id = inv.hardware_catalog_id
LEFT JOIN movement_totals mt ON mt.hardware_catalog_id = inv.hardware_catalog_id
WHERE inv.qty_on_hand != COALESCE(mt.movement_implied_qty, 0)
ORDER BY ABS(inv.qty_on_hand - COALESCE(mt.movement_implied_qty, 0)) DESC;
```

### Expected Results

- Empty result: pass — inventory is perfectly reconciled with movement log.
- Non-empty rows: indicate data corruption, a missing movement record, or a manual SQL update that bypassed the movement log.

### Resolution Steps

1. Review the inventory movements for the flagged item (`getInventoryMovements({ hardwareCatalogId })`).
2. Identify missing or double-counted movements.
3. Post a manual adjustment (`adjustInventory`) with `reason` explaining the correction.
4. Re-run R1 — it should now be empty.

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| New inventory item, no movements yet | `movement_implied_qty = 0`, `qty_on_hand = 0` → no discrepancy if both are 0 |
| Item has movements but no `inventory` row | Not possible — `increment_inventory` creates the row on first receiving |
| De-allocation movements (qty_delta = 0) | Do not affect sum; they are audit events only |

---

## R2: PO Receipts ↔ Inventory Movements

### Definition

Every received `purchase_order_items` line must have a corresponding `inventory_movements` record of type `purchase_order_received`. The sum of received quantities must match the sum of `purchase_order_received` movement deltas for that item sourced from that PO.

### Formula

```
For each PO item where qty_received > 0:
  expected_movement_delta = qty_received (for each individual receiving event)
  actual_movement_delta   = SUM(inventory_movements.qty_delta
                                WHERE movement_type = 'purchase_order_received'
                                AND notes LIKE 'PO {purchase_order_id} received')
  discrepancy = expected_movement_delta - actual_movement_delta
```

### SQL Query

```sql
WITH po_received AS (
  SELECT
    poi.purchase_order_id,
    poi.hardware_catalog_id,
    SUM(poi.qty_received)                        AS total_received
  FROM purchase_order_items poi
  WHERE poi.qty_received > 0
  GROUP BY poi.purchase_order_id, poi.hardware_catalog_id
),
movements_for_pos AS (
  SELECT
    -- Extract purchase_order_id from the notes field "PO {uuid} received"
    SUBSTRING(im.notes FROM 'PO ([0-9a-f\-]+) received')::UUID AS purchase_order_id,
    im.hardware_catalog_id,
    SUM(im.qty_delta)                            AS total_movement_delta
  FROM inventory_movements im
  WHERE im.movement_type = 'purchase_order_received'
    AND im.notes LIKE 'PO % received'
  GROUP BY SUBSTRING(im.notes FROM 'PO ([0-9a-f\-]+) received')::UUID, im.hardware_catalog_id
)
SELECT
  pr.purchase_order_id,
  po.po_number,
  hc.name                                        AS item_name,
  hc.sku,
  pr.total_received                              AS po_qty_received,
  COALESCE(mfp.total_movement_delta, 0)          AS movement_delta,
  pr.total_received - COALESCE(mfp.total_movement_delta, 0) AS discrepancy,
  'R2' AS check_id
FROM po_received pr
JOIN purchase_orders po ON po.id = pr.purchase_order_id
JOIN hardware_catalog hc ON hc.id = pr.hardware_catalog_id
LEFT JOIN movements_for_pos mfp
  ON mfp.purchase_order_id = pr.purchase_order_id
  AND mfp.hardware_catalog_id = pr.hardware_catalog_id
WHERE pr.total_received != COALESCE(mfp.total_movement_delta, 0)
ORDER BY po.po_number, hc.name;
```

### Expected Results

- Empty result: pass — every PO receiving event has an inventory movement.
- Non-empty rows: a receiving event was recorded in `purchase_order_items` but the corresponding movement was not written to `inventory_movements` (or was deleted).

### Resolution Steps

1. Identify the PO and item from the discrepancy row.
2. Verify the movement log for the item around the receiving date.
3. Post a manual `adjustment_increase` with reason: `"R2 reconciliation: missing receiving movement for PO {po_number}"`.
4. Re-run R2.

### Implementation Note

The PO ID is embedded in `inventory_movements.notes` as `"PO {uuid} received"`. This pattern is enforced in `receivePOItems()`. Future receiving events must maintain this exact format to make R2 parseable. An alternative — adding a `reference_id` UUID column to `inventory_movements` linking to `purchase_order_id` — would be cleaner but is not in the current schema; the notes-parsing approach is the specified implementation.

---

## R3: Project BOM ↔ PO Costs

### Definition

When a PO is created for a project, the `unit_cost` on the PO item should match the `unit_cost` on the project BOM item. Discrepancies indicate that a price changed between BOM generation and PO creation, resulting in an understated or overstated cost analysis.

### Formula

```
For each project_bom_item with a corresponding purchase_order_item:
  bom_unit_cost  = project_bom_items.unit_cost
  po_unit_cost   = purchase_order_items.unit_cost
  cost_variance  = po_unit_cost - bom_unit_cost
  variance_pct   = cost_variance / bom_unit_cost × 100
  FLAG if ABS(variance_pct) > 5%  (tolerance: ±5%)
```

### SQL Query

```sql
WITH project_po_items AS (
  -- Join BOM items to PO items via hardware_catalog_id + project linkage
  SELECT
    pbi.project_id,
    pbi.hardware_catalog_id,
    pbi.qty                                      AS bom_qty,
    pbi.unit_cost                                AS bom_unit_cost,
    poi.unit_cost                                AS po_unit_cost,
    poi.qty_ordered                              AS po_qty,
    po.po_number,
    po.id                                        AS purchase_order_id
  FROM project_bom_items pbi
  JOIN purchase_orders po ON po.project_id = pbi.project_id
  JOIN purchase_order_items poi
    ON poi.purchase_order_id = po.id
    AND poi.hardware_catalog_id = pbi.hardware_catalog_id
  WHERE po.status != 'cancelled'
)
SELECT
  ppi.project_id,
  p.customer_name,
  hc.name                                        AS item_name,
  hc.sku,
  ppi.po_number,
  ppi.bom_unit_cost,
  ppi.po_unit_cost,
  ppi.po_unit_cost - ppi.bom_unit_cost          AS unit_cost_variance,
  ROUND(
    (ppi.po_unit_cost - ppi.bom_unit_cost) / NULLIF(ppi.bom_unit_cost, 0) * 100, 2
  )                                              AS variance_pct,
  ppi.bom_qty * (ppi.po_unit_cost - ppi.bom_unit_cost) AS total_cost_impact,
  'R3' AS check_id
FROM project_po_items ppi
JOIN projects p ON p.id = ppi.project_id
JOIN hardware_catalog hc ON hc.id = ppi.hardware_catalog_id
WHERE ABS(
  (ppi.po_unit_cost - ppi.bom_unit_cost) / NULLIF(ppi.bom_unit_cost, 0)
) > 0.05  -- 5% tolerance
ORDER BY ABS(ppi.po_unit_cost - ppi.bom_unit_cost) DESC;
```

### Expected Results

- Empty result: pass — PO costs match BOM costs within 5% tolerance.
- Non-empty rows: a price discrepancy exists. Positive `unit_cost_variance` means the PO was more expensive than the BOM assumed (margin is lower than expected). Negative means cheaper (margin higher).

### Resolution Steps

1. Determine if the BOM cost should be updated to match the actual PO cost:
   - If yes: update `project_bom_items.unit_cost` and recalculate `customer_price` for that line.
   - If no (vendor gave a discount or the BOM was aspirational): document via note on the PO.
2. After updating BOM costs, recalculate the project's cost analysis (re-run `computeCostAnalysis(projectId)`).
3. If customer invoices have already been sent, note the variance but do not change invoice amounts (no retroactive pricing).
4. Re-run R3.

### Tolerance Rationale

5% tolerance accounts for minor vendor price fluctuations, rounding, and currency effects. Variances ≥ 5% are operationally significant and may require customer price renegotiation.

---

## R4: Project Cost ↔ Invoice Amount

### Definition

For each completed (revenue_stage = `final_paid`) or invoiced project, the total invoice amount should approximately equal the sum of hardware costs (BOM), service fees, and a reasonable margin. This check verifies that no project was under-billed or over-billed relative to its actual costs.

### Formula

```
hardware_cost     = SUM(project_bom_items.unit_cost × qty)     [actual landed cost]
total_expenses    = SUM(expenses.amount WHERE project_id = X)
actual_total_cost = hardware_cost + total_expenses

invoice_total     = SUM(invoices.amount WHERE project_id = X AND status IN ('sent','paid'))
gross_margin      = invoice_total - actual_total_cost
gross_margin_pct  = gross_margin / invoice_total × 100

FLAG if gross_margin_pct < 0%   (project lost money)
FLAG if gross_margin_pct < 15%  (warning: margin too thin)
```

### SQL Query

```sql
WITH project_hardware_cost AS (
  SELECT
    project_id,
    SUM(unit_cost * qty)                         AS hardware_cost
  FROM project_bom_items
  GROUP BY project_id
),
project_expense_total AS (
  SELECT
    project_id,
    SUM(amount)                                  AS total_expenses
  FROM expenses
  GROUP BY project_id
),
project_invoice_total AS (
  SELECT
    project_id,
    SUM(amount)                                  AS invoice_total
  FROM invoices
  WHERE status IN ('sent', 'paid')
  GROUP BY project_id
)
SELECT
  p.id                                           AS project_id,
  p.customer_name,
  p.tier,
  p.court_count,
  p.revenue_stage,
  COALESCE(phc.hardware_cost, 0)                AS hardware_cost,
  COALESCE(pet.total_expenses, 0)               AS total_expenses,
  COALESCE(phc.hardware_cost, 0)
    + COALESCE(pet.total_expenses, 0)            AS actual_total_cost,
  COALESCE(pit.invoice_total, 0)                AS invoice_total,
  COALESCE(pit.invoice_total, 0)
    - COALESCE(phc.hardware_cost, 0)
    - COALESCE(pet.total_expenses, 0)            AS gross_margin,
  ROUND(
    (COALESCE(pit.invoice_total, 0)
      - COALESCE(phc.hardware_cost, 0)
      - COALESCE(pet.total_expenses, 0))
    / NULLIF(COALESCE(pit.invoice_total, 0), 0) * 100, 2
  )                                              AS gross_margin_pct,
  CASE
    WHEN COALESCE(pit.invoice_total, 0) = 0 THEN 'no_invoices'
    WHEN (COALESCE(pit.invoice_total, 0)
           - COALESCE(phc.hardware_cost, 0)
           - COALESCE(pet.total_expenses, 0))
         / NULLIF(COALESCE(pit.invoice_total, 0), 0) < 0 THEN 'loss'
    WHEN (COALESCE(pit.invoice_total, 0)
           - COALESCE(phc.hardware_cost, 0)
           - COALESCE(pet.total_expenses, 0))
         / NULLIF(COALESCE(pit.invoice_total, 0), 0) < 0.15 THEN 'thin_margin'
    ELSE 'ok'
  END                                            AS margin_flag,
  'R4' AS check_id
FROM projects p
LEFT JOIN project_hardware_cost phc ON phc.project_id = p.id
LEFT JOIN project_expense_total pet ON pet.project_id = p.id
LEFT JOIN project_invoice_total pit ON pit.project_id = p.id
WHERE p.revenue_stage IN ('deposit_invoiced','deposit_paid','final_invoiced','final_paid')
  AND (
    COALESCE(pit.invoice_total, 0) = 0
    OR (COALESCE(pit.invoice_total, 0)
         - COALESCE(phc.hardware_cost, 0)
         - COALESCE(pet.total_expenses, 0))
       / NULLIF(COALESCE(pit.invoice_total, 0), 0) < 0.15
  )
ORDER BY gross_margin_pct ASC NULLS LAST;
```

### Flag Definitions

| `margin_flag` | Meaning | Action Required |
|--------------|---------|----------------|
| `no_invoices` | Project is in revenue pipeline but no invoice has been sent | Send deposit invoice or investigate |
| `loss` | Invoice total < actual costs — project lost money | Management review; document cause |
| `thin_margin` | Gross margin < 15% | Warning only; may be acceptable for strategic customers |
| `ok` | Margin ≥ 15% | No action |

### Resolution Steps

**For `no_invoices`**: Check if the project's deposit invoice was supposed to be sent. Navigate to Stage 4 wizard to generate and send.

**For `loss`**: Review BOM costs for errors (wrong unit_cost), expense for uncategorized items, and invoice for billing mistakes. Do not adjust historical invoices without customer agreement.

**For `thin_margin`**: No required action. Flag for ops awareness during monthly review.

---

## R5: Revenue Stage ↔ Invoice Status

### Definition

`projects.revenue_stage` must be consistent with the actual invoice states in the `invoices` table. The revenue stage should always reflect the most advanced invoice status for the project.

### Mapping Rules

| Condition | Required `revenue_stage` |
|-----------|------------------------|
| No invoices exist | `proposal` or `signed` |
| Deposit invoice exists, status = `draft` | `signed` |
| Deposit invoice exists, status = `sent` | `deposit_invoiced` |
| Deposit invoice exists, status = `paid`; no final invoice | `deposit_paid` |
| Final invoice exists, status = `sent` or `draft` | `final_invoiced` |
| Final invoice exists, status = `paid` | `final_paid` |

### SQL Query

```sql
WITH invoice_summary AS (
  SELECT
    project_id,
    MAX(CASE WHEN invoice_type = 'deposit' THEN status END)  AS deposit_status,
    MAX(CASE WHEN invoice_type = 'final'   THEN status END)  AS final_status
  FROM invoices
  GROUP BY project_id
),
expected_stage AS (
  SELECT
    p.id AS project_id,
    CASE
      WHEN ins.final_status = 'paid'                         THEN 'final_paid'
      WHEN ins.final_status IN ('sent', 'draft')             THEN 'final_invoiced'
      WHEN ins.deposit_status = 'paid' AND ins.final_status IS NULL THEN 'deposit_paid'
      WHEN ins.deposit_status = 'sent'                       THEN 'deposit_invoiced'
      WHEN ins.deposit_status = 'draft'                      THEN 'signed'
      WHEN ins.deposit_status IS NULL                        THEN 'signed'
      ELSE 'proposal'
    END AS expected_revenue_stage
  FROM projects p
  LEFT JOIN invoice_summary ins ON ins.project_id = p.id
  WHERE p.status NOT IN ('cancelled')
)
SELECT
  es.project_id,
  p.customer_name,
  p.revenue_stage                                AS actual_stage,
  es.expected_revenue_stage,
  'R5' AS check_id
FROM expected_stage es
JOIN projects p ON p.id = es.project_id
WHERE p.revenue_stage::text != es.expected_revenue_stage
ORDER BY p.customer_name;
```

### Expected Results

- Empty result: pass — all projects have consistent revenue stages.
- Non-empty rows: a project's `revenue_stage` is out of sync with its invoices. This happens when an invoice status is updated manually without updating the project stage (or vice versa).

### Resolution Steps

1. Inspect the project's invoices (`getProjectInvoices(projectId)`).
2. Determine which state is correct — the invoice state or the revenue_stage.
3. Call `syncRevenueStage(projectId)` which re-derives `revenue_stage` from invoice states:

```typescript
async function syncRevenueStage(projectId: string): Promise<void> {
  const { data: invoices } = await supabase
    .from('invoices')
    .select('invoice_type, status')
    .eq('project_id', projectId);

  const depositInv = invoices?.find(i => i.invoice_type === 'deposit');
  const finalInv   = invoices?.find(i => i.invoice_type === 'final');

  let newStage: RevenueStage = 'proposal';

  if (finalInv?.status === 'paid')             newStage = 'final_paid';
  else if (finalInv?.status === 'sent')        newStage = 'final_invoiced';
  else if (depositInv?.status === 'paid')      newStage = 'deposit_paid';
  else if (depositInv?.status === 'sent')      newStage = 'deposit_invoiced';
  else if (depositInv?.status === 'draft')     newStage = 'signed';

  await supabase
    .from('projects')
    .update({ revenue_stage: newStage })
    .eq('id', projectId);
}
```

4. Re-run R5.

---

## Monthly Close Reconciliation Workflow

At the end of each calendar month, ops performs a monthly close. This is a manual checklist-driven process executed from the Financials page "Monthly Close" modal.

### Step 1: Run All Five Reconciliation Checks

```typescript
async function runAllReconciliationChecks(): Promise<ReconciliationReport> {
  const [r1, r2, r3, r4, r5] = await Promise.all([
    reconcileInventoryVsMovements(),
    reconcilePOReceiptsVsMovements(),
    reconcileBOMVsPOCosts(),
    reconcileProjectCostVsInvoice(),
    reconcileRevenueStageVsInvoiceStatus(),
  ]);

  return {
    r1_inventory_movement:       r1,
    r2_po_receipts_movements:    r2,
    r3_bom_po_costs:             r3,
    r4_project_cost_invoice:     r4,
    r5_revenue_stage_invoice:    r5,
    all_passed: [r1, r2, r3, r4, r5].every(rows => rows.length === 0),
    run_at: new Date().toISOString(),
  };
}
```

### Step 2: Resolve All Discrepancies

- R1 discrepancies: post manual adjustments.
- R2 discrepancies: post missing receiving movements.
- R3 discrepancies: update BOM unit costs if needed; note any PO price changes.
- R4 loss/no_invoice flags: investigate and resolve or document exceptions.
- R5 mismatches: call `syncRevenueStage()` for each flagged project.

### Step 3: Snapshot Monthly OpEx

Once all checks pass, create the monthly OpEx snapshot (see `logic-financial-reporting` Section 4):

```typescript
await snapshotMonthlyOpEx(year, month);
```

### Step 4: Verify HER

Compute the Hardware Efficiency Ratio for the closing month and verify it is > 1.0:

```
HER = hardware_revenue_this_month / team_hardware_spend_this_month
```

If HER < 1.0, flag for management review (more was spent on hardware and team than earned in revenue).

### Step 5: Mark Month Closed

The month is considered closed when:
1. All five reconciliation checks return zero rows.
2. `monthly_opex_snapshots` row exists for (year, month).
3. HER has been computed and noted.

There is no formal "closed" flag in the database — the monthly snapshot existing is the implicit close marker.

---

## Reconciliation UI Surface

### Location

Global Financials page → "Reconciliation" tab.

### Components

#### Reconciliation Summary Card

```
+--------------------------------------------------+
|  Reconciliation Status          [Run Checks]     |
|                                                  |
|  R1 Inventory ↔ Movements       ✅ Pass (0)      |
|  R2 PO Receipts ↔ Movements     ⚠️  3 issues     |
|  R3 BOM ↔ PO Costs              ✅ Pass (0)      |
|  R4 Project Cost ↔ Invoice      ⚠️  1 loss       |
|  R5 Revenue Stage ↔ Invoices    ✅ Pass (0)      |
|                                                  |
|  Last run: 2026-03-06 14:32 UTC                  |
+--------------------------------------------------+
```

- Green checkmark (✅): check returned 0 rows.
- Orange warning (⚠️): check returned ≥ 1 row. Shows count.
- Red X (❌): check returned ≥ 1 `loss` row (R4 only).
- "Run Checks" button: executes all 5 queries and refreshes the display. No caching — always fresh from DB.

#### Per-Check Discrepancy Table

Each check expands to show its discrepancy rows. Columns vary by check:

**R1 — Inventory ↔ Movements**

| Item Name | SKU | Actual Qty | Movement-Implied Qty | Discrepancy | Action |
|-----------|-----|-----------|---------------------|-------------|--------|
| UniFi Dream Machine Pro | UDM-PRO | 5 | 4 | +1 | [Post Adjustment] |

**R2 — PO Receipts ↔ Movements**

| PO Number | Item Name | SKU | PO Qty Received | Movement Delta | Discrepancy | Action |
|-----------|-----------|-----|----------------|----------------|-------------|--------|
| PO-2026-003 | PoE Switch | USW-16-POE | 2 | 0 | +2 | [Post Movement] |

**R3 — BOM ↔ PO Costs**

| Customer | Item Name | BOM Unit Cost | PO Unit Cost | Variance | Total Impact | Action |
|----------|-----------|--------------|--------------|----------|-------------|--------|
| Plex Arena | iPad 10th Gen | $429.00 | $449.00 | +$20 (+4.7%) | +$80 | [Update BOM] |

**R4 — Project Cost ↔ Invoice**

| Customer | Tier | Hardware Cost | Expenses | Invoice Total | Gross Margin | Margin % | Flag | Action |
|----------|------|--------------|----------|--------------|-------------|---------|------|--------|
| Smash City | autonomous | $18,400 | $3,200 | $19,800 | -$1,800 | -9.1% | loss | [Review] |

**R5 — Revenue Stage ↔ Invoices**

| Customer | Actual Stage | Expected Stage | Action |
|----------|-------------|---------------|--------|
| Pickleball HQ | deposit_invoiced | deposit_paid | [Sync Stage] |

#### Action Buttons

Each discrepancy row has an action button that deep-links to the resolution flow:

| Check | Button | Navigates To |
|-------|--------|-------------|
| R1 | [Post Adjustment] | Opens adjustment modal pre-filled with item and delta |
| R2 | [Post Movement] | Opens receiving modal pre-filled with PO and item |
| R3 | [Update BOM] | Opens Stage 2 BOM editor for the project |
| R4 | [Review] | Opens project's Stage 4 financial view |
| R5 | [Sync Stage] | Calls `syncRevenueStage()` immediately; no modal |

---

## Service Function Signatures

All functions in `src/services/reconciliation.ts`:

```typescript
// R1: Inventory vs movement log
reconcileInventoryVsMovements(): Promise<R1DiscrepancyRow[]>

// R2: PO receipts vs inventory movements
reconcilePOReceiptsVsMovements(): Promise<R2DiscrepancyRow[]>

// R3: BOM unit costs vs PO unit costs (5% tolerance)
reconcileBOMVsPOCosts(): Promise<R3DiscrepancyRow[]>

// R4: Project actual cost vs invoice total (margin check)
reconcileProjectCostVsInvoice(): Promise<R4DiscrepancyRow[]>

// R5: Revenue stage consistency with invoice states
reconcileRevenueStageVsInvoiceStatus(): Promise<R5DiscrepancyRow[]>

// Run all 5 checks in parallel
runAllReconciliationChecks(): Promise<ReconciliationReport>

// Auto-fix R5 for a specific project
syncRevenueStage(projectId: string): Promise<void>
```

---

## Return Types

```typescript
interface R1DiscrepancyRow {
  hardware_catalog_id: string;
  item_name: string;
  sku: string;
  actual_qty: number;
  movement_implied_qty: number;
  discrepancy: number;           // actual_qty - movement_implied_qty
}

interface R2DiscrepancyRow {
  purchase_order_id: string;
  po_number: string;
  item_name: string;
  sku: string;
  po_qty_received: number;
  movement_delta: number;
  discrepancy: number;           // po_qty_received - movement_delta
}

interface R3DiscrepancyRow {
  project_id: string;
  customer_name: string;
  item_name: string;
  sku: string;
  po_number: string;
  bom_unit_cost: number;
  po_unit_cost: number;
  unit_cost_variance: number;    // po_unit_cost - bom_unit_cost
  variance_pct: number;          // as decimal, e.g. 0.047 = 4.7%
  total_cost_impact: number;     // unit_cost_variance × bom_qty
}

interface R4DiscrepancyRow {
  project_id: string;
  customer_name: string;
  tier: ServiceTier;
  court_count: number;
  revenue_stage: RevenueStage;
  hardware_cost: number;
  total_expenses: number;
  actual_total_cost: number;
  invoice_total: number;
  gross_margin: number;
  gross_margin_pct: number;      // as decimal, e.g. -0.091 = -9.1%
  margin_flag: 'no_invoices' | 'loss' | 'thin_margin' | 'ok';
}

interface R5DiscrepancyRow {
  project_id: string;
  customer_name: string;
  actual_stage: RevenueStage;
  expected_revenue_stage: RevenueStage;
}

interface ReconciliationReport {
  r1_inventory_movement:    R1DiscrepancyRow[];
  r2_po_receipts_movements: R2DiscrepancyRow[];
  r3_bom_po_costs:          R3DiscrepancyRow[];
  r4_project_cost_invoice:  R4DiscrepancyRow[];
  r5_revenue_stage_invoice: R5DiscrepancyRow[];
  all_passed: boolean;
  run_at: string;            // ISO timestamp
}
```

---

## Data Invariants Enforced by Reconciliation

| Invariant | Check | Violation Meaning |
|-----------|-------|------------------|
| `qty_on_hand` = Σ movements | R1 | Manual DB edit or missing movement |
| Every PO receipt → movement | R2 | `receivePOItems()` was bypassed |
| BOM cost ≈ PO cost (±5%) | R3 | Price changed between BOM generation and PO placement |
| Invoice total > actual cost | R4 | Project is unprofitable |
| Revenue stage matches invoices | R5 | Stage update missed after invoice status change |

---

## Concrete Example: Full R1 Pass / R2 Failure Scenario

**Scenario**: PodPlay receives 3x UniFi UDM-Pro (PO-2026-007). The receiving was entered in `purchase_order_items` (qty_received = 3) but the `receivePOItems()` function crashed before writing to `inventory_movements`.

**R1 Check Result**:

| Item | Actual Qty | Movement-Implied | Discrepancy |
|------|-----------|-----------------|-------------|
| UniFi Dream Machine Pro | 5 | 2 | +3 |

**R2 Check Result**:

| PO Number | Item | PO Qty Received | Movement Delta | Discrepancy |
|-----------|------|----------------|----------------|-------------|
| PO-2026-007 | UniFi Dream Machine Pro | 3 | 0 | +3 |

**Resolution**:
1. R2 identifies the root cause: PO-2026-007 receiving has no movement.
2. Ops clicks [Post Movement] → adjustment modal pre-filled: item = UDM-Pro, delta = +3, reason = "R2 reconciliation: missing receiving movement for PO PO-2026-007".
3. `adjustInventory({ hardware_catalog_id, adjustment_qty: 3, movement_type: 'purchase_order_received', reason: '...' })` called.
4. Both R1 and R2 now pass.
