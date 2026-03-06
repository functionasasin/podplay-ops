# Business Logic: Replay Sign Fulfillment

**Aspect**: logic-sign-fulfillment
**Wave**: 3 — Business Logic & Workflows
**Date**: 2026-03-06
**MRP Source**: "Customer Replay Signs" sheet — side-channel fulfillment tracker for branded aluminum signs
**Schema Reference**: `final-mega-spec/data-model/schema.md` — `replay_signs`, `inventory_movements`, `hardware_catalog`, `projects`
**Depends On**: `model-replay-signs` (data model), `logic-inventory-management` (stock decrement), `logic-bom-generation` (REPLAY-SIGN in BOM)

---

## Overview

Every PodPlay installation includes branded aluminum signs (6×8 inches, printed by Fast Signs vendor at $25/unit) that are mounted on each court to indicate the replay button location and scoring procedure. The signs are ordered and tracked separately from the main BOM/inventory system — they go directly from Fast Signs vendor to the venue rather than through PodPlay's warehouse, so they follow a distinct fulfillment pipeline.

**Key rule**: Every project gets replay signs regardless of tier (Pro, Autonomous, Autonomous+, PBK). Signs are always ordered.

**Qty formula**: `qty = court_count × 2` (2 signs per court)

---

## 1. Quantity Calculation

### Formula

```
replay_sign_qty = court_count × 2
```

This is computed as a `GENERATED ALWAYS AS` column on `projects`:

```sql
replay_sign_count INTEGER GENERATED ALWAYS AS (court_count * 2) STORED
```

### Reference Table

| Court Count | Signs Ordered |
|-------------|--------------|
| 1 | 2 |
| 2 | 4 |
| 3 | 6 |
| 4 | 8 |
| 5 | 10 |
| 6 | 12 |
| 8 | 16 |
| 10 | 20 |
| 12 | 24 |
| 16 | 32 |

### Qty Override

When the `replay_signs` row is created, `qty` is copied from `projects.replay_sign_count` as a **snapshot**. After creation, `qty` can be manually adjusted (e.g., ops orders 1 extra as a backup). The override does not change `projects.replay_sign_count`.

**Validation**: `qty >= 1`. Zero signs is invalid; if court_count is ever set to 0 that would be a project data error caught at intake.

---

## 2. State Machine

### States

```
staged → shipped → delivered → installed
```

| State | Meaning |
|-------|---------|
| `staged` | Signs queued — `replay_signs` row created, not yet ordered from Fast Signs |
| `shipped` | Fast Signs has shipped the order to the venue |
| `delivered` | Package arrived at the venue |
| `installed` | Signs physically mounted on the courts |

### Transitions

| From | To | Trigger | Fields Set | Side Effect |
|------|----|---------|------------|-------------|
| `staged` | `shipped` | Ops marks shipped after Fast Signs confirms dispatch | `shipped_date = today` | None |
| `shipped` | `delivered` | Ops confirms package arrived at venue | `delivered_date = today` | None |
| `delivered` | `installed` | Ops confirms venue staff mounted signs on courts | `installed_date = today` | Inventory decrement (see §4) |

### Transition Guards

- `staged → shipped`: `outreach_date` MUST be set before shipping (can't ship before ordering)
- `shipped → delivered`: `shipped_date` must be set (enforced by transition sequence)
- `delivered → installed`: `delivered_date` must be set (enforced by transition sequence)
- No backward transitions are permitted. If an error is made (e.g., marked delivered prematurely), ops must use the notes field and contact an admin to reset. The UI shows a confirmation dialog for each transition.

---

## 3. Outreach Tracking

Signs are not procured via standard PO — ops sends an order request directly to Fast Signs via Slack or email.

### Fields

| Field | Type | Purpose |
|-------|------|---------|
| `outreach_channel` | `'slack' \| 'email' \| 'other'` | How ops communicated the order to Fast Signs |
| `outreach_date` | `DATE` | Date the initial order request was sent |
| `vendor_order_id` | `TEXT` | Fast Signs order confirmation number received back from vendor |
| `tracking_number` | `TEXT` | Carrier tracking number (UPS or FedEx) once Fast Signs ships |

### Outreach Channel Values

- `'slack'`: Ops sent a Slack message directly to Fast Signs representative
- `'email'`: Ops sent an email to Fast Signs ordering contact
- `'other'`: Phone call, web order form, or any other channel

### Workflow Sequence

1. Stage 2 entry → `replay_signs` row auto-created with `status = 'staged'`
2. Ops contacts Fast Signs (Slack or email) with sign specs, qty, venue ship-to address
   → set `outreach_channel` and `outreach_date`
3. Fast Signs confirms order → set `vendor_order_id`
4. Fast Signs ships → set `status = 'shipped'`, `shipped_date = today`
5. Venue receives package → set `status = 'delivered'`, `delivered_date = today`, `tracking_number`
6. Venue staff mounts signs on courts → set `status = 'installed'`, `installed_date = today`
   → **triggers inventory decrement** (see §4)

### Validation Rules

- `outreach_date` must be `<= today` (cannot record a future outreach)
- `shipped_date` must be `>= outreach_date`
- `delivered_date` must be `>= shipped_date`
- `installed_date` must be `>= delivered_date`
- `outreach_channel` is required when setting `outreach_date` (both fields set together)

---

## 4. Inventory Decrement on Installed

When `status` transitions to `'installed'`, a `inventory_movements` row is inserted to decrement the `REPLAY-SIGN` SKU from global stock. Signs go directly to the venue without passing through PodPlay's warehouse, so the decrement happens at confirmed installation rather than at shipment.

### Decrement Logic

```typescript
async function decrementReplaySignInventory(signId: string): Promise<void> {
  // Fetch sign record
  const { data: sign, error: signErr } = await supabase
    .from('replay_signs')
    .select('id, project_id, qty')
    .eq('id', signId)
    .single();
  if (signErr) throw signErr;

  // Lookup REPLAY-SIGN catalog entry
  const { data: catalogItem, error: catErr } = await supabase
    .from('hardware_catalog')
    .select('id')
    .eq('sku', 'REPLAY-SIGN')
    .single();
  if (catErr) throw catErr;

  // Insert negative movement to deduct from stock
  const { error: movErr } = await supabase
    .from('inventory_movements')
    .insert({
      hardware_catalog_id: catalogItem.id,
      movement_type: 'project_shipped',
      qty_delta: -sign.qty,          // negative: e.g., -12 for 6-court venue
      project_id: sign.project_id,
      notes: 'Auto-decrement: replay signs installed at venue',
    });
  if (movErr) throw movErr;
}
```

### Idempotency Guard

The `installed_date` being set is the source of truth. Before inserting the movement, check if a `project_shipped` movement for `REPLAY-SIGN` + `project_id` already exists:

```typescript
const { data: existing } = await supabase
  .from('inventory_movements')
  .select('id')
  .eq('project_id', sign.project_id)
  .eq('hardware_catalog_id', catalogItem.id)
  .eq('movement_type', 'project_shipped')
  .maybeSingle();

if (existing) return; // Already decremented — no-op
```

This prevents double-decrement if the status update is retried.

### Inventory Impact

- `hardware_catalog` row for `REPLAY-SIGN` has its effective `quantity_on_hand` reduced by `sign.qty`
- `quantity_on_hand` is derived (not stored): computed as sum of all `inventory_movements.qty_delta` for that catalog item
- If `quantity_on_hand` drops below 0 after decrement, the UI shows a warning ("Replay sign inventory went negative — please reconcile") but does NOT block the installation confirmation

---

## 5. Auto-Row Creation on Stage 2 Entry

Every project gets a `replay_signs` row automatically when it transitions to `procurement` stage. This is called from `advanceProjectStage` when `new_status = 'procurement'`.

### Function

```typescript
async function ensureReplaySignRecord(projectId: string): Promise<void> {
  // Fetch project for court count
  const { data: project, error: projErr } = await supabase
    .from('projects')
    .select('id, replay_sign_count')
    .eq('id', projectId)
    .single();
  if (projErr) throw projErr;

  // Idempotent: check if already exists
  const { data: existing } = await supabase
    .from('replay_signs')
    .select('id')
    .eq('project_id', projectId)
    .maybeSingle();

  if (existing) return; // Already created — skip

  // Create staged row
  const { error: insertErr } = await supabase
    .from('replay_signs')
    .insert({
      project_id: projectId,
      qty: project.replay_sign_count,  // court_count × 2 (snapshot)
      status: 'staged',
    });
  if (insertErr) throw insertErr;
}
```

### Difference from CC Terminals

`cc_terminals` rows are only created when `projects.has_front_desk = true`. Replay signs are always created — no conditional. Every tier, every project.

---

## 6. Service Layer Functions

### getReplaySign

```typescript
async function getReplaySign(
  projectId: string
): Promise<ReplaySign | null> {
  const { data, error } = await supabase
    .from('replay_signs')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
```

### recordOutreach

```typescript
async function recordReplaySignOutreach(
  projectId: string,
  channel: 'slack' | 'email' | 'other',
  outreachDate: string  // ISO date string, e.g. '2026-04-01'
): Promise<void> {
  const { error } = await supabase
    .from('replay_signs')
    .update({
      outreach_channel: channel,
      outreach_date: outreachDate,
    })
    .eq('project_id', projectId);
  if (error) throw error;
}
```

### recordVendorOrderId

```typescript
async function recordVendorOrderId(
  projectId: string,
  vendorOrderId: string
): Promise<void> {
  const { error } = await supabase
    .from('replay_signs')
    .update({ vendor_order_id: vendorOrderId })
    .eq('project_id', projectId);
  if (error) throw error;
}
```

### advanceStatus

```typescript
async function advanceReplaySignStatus(
  signId: string,
  newStatus: 'shipped' | 'delivered' | 'installed',
  date: string,             // ISO date string
  trackingNumber?: string   // Only relevant when newStatus = 'delivered'
): Promise<void> {
  const dateFieldMap: Record<string, string> = {
    shipped:   'shipped_date',
    delivered: 'delivered_date',
    installed: 'installed_date',
  };

  const updatePayload: Record<string, unknown> = {
    status: newStatus,
    [dateFieldMap[newStatus]]: date,
  };
  if (newStatus === 'delivered' && trackingNumber) {
    updatePayload.tracking_number = trackingNumber;
  }

  const { error: updateErr } = await supabase
    .from('replay_signs')
    .update(updatePayload)
    .eq('id', signId);
  if (updateErr) throw updateErr;

  // Trigger inventory decrement on installed
  if (newStatus === 'installed') {
    await decrementReplaySignInventory(signId);
  }
}
```

### updateQty (manual override)

```typescript
async function updateReplaySignQty(
  projectId: string,
  qty: number  // must be >= 1
): Promise<void> {
  if (qty < 1) throw new Error('Replay sign qty must be >= 1');

  const { error } = await supabase
    .from('replay_signs')
    .update({ qty })
    .eq('project_id', projectId);
  if (error) throw error;
}
// Only permitted while status = 'staged' — after shipping, qty is locked
```

---

## 7. Validation Rules Summary

| Rule | Condition | Error Message |
|------|-----------|--------------|
| Qty minimum | `qty >= 1` | "Quantity must be at least 1" |
| Outreach date not future | `outreach_date <= today` | "Outreach date cannot be in the future" |
| Ship date after outreach | `shipped_date >= outreach_date` | "Shipped date must be on or after outreach date" |
| Delivery after ship | `delivered_date >= shipped_date` | "Delivered date must be on or after shipped date" |
| Install after delivery | `installed_date >= delivered_date` | "Installed date must be on or after delivered date" |
| Channel required with date | `outreach_channel != null when outreach_date set` | "Select outreach channel (Slack, Email, or Other)" |
| No backward transitions | State can only advance forward | "Cannot revert sign status" |
| Qty locked after staged | `status == 'staged'` to edit qty | "Cannot change qty after signs have been shipped" |

---

## 8. Edge Cases

### Court Count Changed After Stage 2

If `projects.court_count` is updated after the `replay_signs` row was created, `projects.replay_sign_count` auto-updates (GENERATED column), but `replay_signs.qty` does NOT auto-update (it is a snapshot). The UI should detect the mismatch and show a warning:

```
"Court count changed to X (now requires Y signs). Current sign order is for Z signs. Update?"
```

Detection logic:
```typescript
const expectedQty = project.replay_sign_count;  // court_count × 2
const actualQty = replaySign.qty;
if (expectedQty !== actualQty && replaySign.status === 'staged') {
  // Show resync warning with "Update to Y signs" button
}
```

If status is already `shipped` or beyond, only show informational note — do not offer to update.

### Zero Inventory Available

Signs go directly from Fast Signs to the venue; PodPlay does not stock them in-warehouse by default. The `REPLAY-SIGN` catalog entry tracks received inventory if bulk stock is held. If `quantity_on_hand < 0` after decrement, display a reconciliation alert but do not block.

### Multiple Phases at Same Venue

Multi-phase venues (e.g., venue expanding from 4 to 8 courts in a second project) create separate `projects` rows. Each project gets its own `replay_signs` row. No deduplication or merging.

### PBK Tier

PBK (Pickleball Kingdom custom pricing) still uses the same `qty = court_count × 2` formula and the same fulfillment workflow. No tier-specific exceptions for replay signs.

---

## 9. Concrete Example

**Project**: Telepark Pickleball Club, 6 courts, Pro tier

1. Project enters Stage 2 (Procurement):
   - `ensureReplaySignRecord('project-uuid')` called
   - `replay_signs` row created: `{ qty: 12, status: 'staged' }`
   - (6 courts × 2 = 12 signs)

2. Ops messages Fast Signs on Slack, March 10, 2026:
   - `recordReplaySignOutreach(projectId, 'slack', '2026-03-10')`
   - Fast Signs confirms order #FS-2892 → `recordVendorOrderId(projectId, 'FS-2892')`

3. Fast Signs ships March 13, 2026:
   - `advanceReplaySignStatus(signId, 'shipped', '2026-03-13')`
   - `replay_signs.status = 'shipped'`, `shipped_date = '2026-03-13'`

4. Venue receives March 15, 2026, UPS tracking 1Z999:
   - `advanceReplaySignStatus(signId, 'delivered', '2026-03-15', '1Z999')`
   - `replay_signs.status = 'delivered'`, `delivered_date = '2026-03-15'`, `tracking_number = '1Z999'`

5. Venue installs signs on courts March 22, 2026 (installation day):
   - `advanceReplaySignStatus(signId, 'installed', '2026-03-22')`
   - `replay_signs.status = 'installed'`, `installed_date = '2026-03-22'`
   - `inventory_movements` row inserted: `{ movement_type: 'project_shipped', qty_delta: -12, notes: 'Auto-decrement: replay signs installed at venue' }`
   - REPLAY-SIGN `quantity_on_hand` decreases by 12

**Total cost**: 12 signs × $25.00/unit = $300.00 (tracked via BOM item REPLAY-SIGN, not via replay_signs table)
