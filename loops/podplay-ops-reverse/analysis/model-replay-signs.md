# Analysis: model-replay-signs
**Aspect**: model-replay-signs
**Wave**: 2 — Data Model Extraction
**Date**: 2026-03-06

---

## Goal

Specify the complete `replay_signs` data model:
- Sign fulfillment lifecycle: Staged → Shipped → Delivered → Installed
- Qty calculation: 2 signs per court (court_count × 2)
- Outreach tracking: how ops communicates the order to Fast Signs
- Inventory decrement: `REPLAY-SIGN` SKU movement when status → `installed`
- Auto-row creation: when project enters Stage 2 (Procurement)

---

## MRP Source Mapping

**MRP Sheet**: "Customer Replay Signs"

This sheet is a fulfillment tracker for the branded aluminum signs (6×8 inches, Fast Signs vendor, $25/unit)
that are placed on each court to indicate the replay button location and scoring procedure.
The sheet is separate from the main inventory/PO system — it is a side-channel procurement
tracked manually (Slack DM or email to vendor, then shipping tracking).

**Columns mapped** (derived from frontier description + vendor context; XLSX not available):

| Column Name (MRP) | DB Field | Notes |
|--------------------|----------|-------|
| Customer Name | projects.customer_name (FK) | Links replay sign row to project |
| Qty | replay_signs.qty | = court_count × 2 |
| Status | replay_signs.status | sign_status enum |
| Outreach Channel | replay_signs.outreach_channel | 'slack' \| 'email' \| 'other' |
| Outreach Date | replay_signs.outreach_date | Date ops sent order request to Fast Signs |
| Shipped Date | replay_signs.shipped_date | Date Fast Signs shipped |
| Delivered Date | replay_signs.delivered_date | Date package arrived at venue |
| Installed Date | replay_signs.installed_date | Date signs mounted on courts |
| Tracking Number | replay_signs.tracking_number | Carrier tracking (UPS/FedEx) |
| Order Reference | replay_signs.vendor_order_id | Fast Signs order ID |
| Notes | replay_signs.notes | Free-form |

---

## State Machine: sign_status

```
staged → shipped → delivered → installed
```

| Transition | Trigger | Side Effect |
|------------|---------|-------------|
| staged → shipped | Ops marks shipped after Fast Signs ships | Set shipped_date = today |
| shipped → delivered | Ops confirms package arrived at venue | Set delivered_date = today |
| delivered → installed | Ops confirms venue installed signs on courts | Set installed_date = today; create inventory_movements record |

### Inventory Decrement on `installed`

When `status` transitions to `installed`:
- Create `inventory_movements` row:
  - `hardware_catalog_id`: REPLAY-SIGN SKU from hardware_catalog
  - `movement_type`: `'project_shipped'`
  - `qty_delta`: negative (= -replay_signs.qty)
  - `project_id`: replay_signs.project_id
  - `notes`: 'Auto-decrement: replay signs installed at venue'
- This deducts sign inventory from global stock (REPLAY-SIGN SKU quantity_on_hand updated via trigger or client-side)

---

## Qty Calculation

```
replay_sign_count = court_count × 2
```

This is a GENERATED ALWAYS STORED computed column on the `projects` table:
```sql
replay_sign_count INTEGER GENERATED ALWAYS AS (court_count * 2) STORED
```

When `replay_signs` row is created at Stage 2 entry, `qty` is copied from `projects.replay_sign_count`
(snapshot at creation time). This allows qty to be overridden if actual order differs
(e.g., one extra sign ordered as backup) without changing the formula on projects.

**Standard values**:
| Courts | Signs |
|--------|-------|
| 1 | 2 |
| 4 | 8 |
| 6 | 12 |
| 8 | 16 |
| 10 | 20 |
| 12 | 24 |

---

## Outreach Tracking

The `outreach_channel` and `outreach_date` fields track how PodPlay ops communicated
the order to Fast Signs (vendor). This is not a standard PO — it is a Slack message
or email to the vendor account.

- `outreach_channel`: `'slack'` | `'email'` | `'other'`
  - `'slack'`: ops sent a Slack message directly to Fast Signs rep
  - `'email'`: ops sent an email to Fast Signs ordering contact
  - `'other'`: any other communication (phone call, web form, etc.)
- `outreach_date`: the date the initial order request was sent
- `vendor_order_id`: Fast Signs order confirmation number (received back from vendor)
- `tracking_number`: carrier tracking once shipped (UPS/FedEx)

**Workflow**:
1. Stage 2 entry → `replay_signs` row created with `status = 'staged'`
2. Ops contacts Fast Signs via Slack or email → set `outreach_channel`, `outreach_date`
3. Fast Signs confirms order → set `vendor_order_id`
4. Fast Signs ships → set `status = 'shipped'`, `shipped_date`
5. Venue receives → set `status = 'delivered'`, `delivered_date`, `tracking_number`
6. Venue installs signs on courts → set `status = 'installed'`, `installed_date`
   → triggers inventory decrement

---

## Auto-Row Creation on Stage 2 Entry

Every project gets a `replay_signs` row when it enters Procurement stage.
Unlike `cc_terminals` (which only creates if `has_front_desk = true`),
**replay signs are always created** — every installation gets signs regardless of tier.

```typescript
// Called when project transitions to procurement stage
async function ensureReplaySignRecord(projectId: string): Promise<void> {
  const { data: project } = await supabase
    .from('projects')
    .select('id, replay_sign_count')
    .eq('id', projectId)
    .single();

  const { data: existing } = await supabase
    .from('replay_signs')
    .select('id')
    .eq('project_id', projectId)
    .maybeSingle();

  if (existing) return; // Idempotent — already created

  await supabase.from('replay_signs').insert({
    project_id: projectId,
    qty: project.replay_sign_count,  // court_count × 2
    status: 'staged',
  });
}
```

---

## Schema Gaps Found

1. **Missing indexes**: `replay_signs` table in schema.md has no indexes. Need:
   - `idx_replay_signs_project ON replay_signs (project_id)` — query by project
   - `idx_replay_signs_status ON replay_signs (status)` — filter by stage

2. **Missing CHECK constraint**: `outreach_channel` is TEXT without constraint.
   Should add: `CHECK (outreach_channel IN ('slack', 'email', 'other'))`

3. **Vendor cost field**: No `cost_per_unit` field on `replay_signs`. The hardware_catalog
   entry for REPLAY-SIGN has unit cost $25.00. Costs flow through project_bom_items
   (REPLAY-SIGN is in the BOM), not through replay_signs directly. This is correct
   by design — no cost field needed on replay_signs.

4. **Bulk order scenario**: If a client orders signs for two separate projects (same venue,
   second phase), the `UNIQUE` constraint on `project_id` is correct — one row per project.
   Multi-phase venues create separate projects.

---

## TypeScript Service Functions

```typescript
// Get replay sign record for a project (Stage 2+ only)
async function getReplaySign(projectId: string) {
  const { data, error } = await supabase
    .from('replay_signs')
    .select('*')
    .eq('project_id', projectId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Update outreach info when ops contacts Fast Signs
async function recordReplaySignOutreach(
  projectId: string,
  channel: 'slack' | 'email' | 'other',
  outreachDate: string  // ISO date
) {
  const { error } = await supabase
    .from('replay_signs')
    .update({ outreach_channel: channel, outreach_date: outreachDate })
    .eq('project_id', projectId);
  if (error) throw error;
}

// Advance status with date stamping and inventory side-effect
async function advanceReplaySignStatus(
  signId: string,
  newStatus: 'shipped' | 'delivered' | 'installed',
  date: string  // ISO date
) {
  const dateField = {
    shipped:   'shipped_date',
    delivered: 'delivered_date',
    installed: 'installed_date',
  }[newStatus];

  const { data: sign, error: fetchErr } = await supabase
    .from('replay_signs')
    .select('id, project_id, qty')
    .eq('id', signId)
    .single();
  if (fetchErr) throw fetchErr;

  const { error: updateErr } = await supabase
    .from('replay_signs')
    .update({ status: newStatus, [dateField]: date })
    .eq('id', signId);
  if (updateErr) throw updateErr;

  // Decrement inventory when installed
  if (newStatus === 'installed') {
    const { data: catalogItem } = await supabase
      .from('hardware_catalog')
      .select('id')
      .eq('sku', 'REPLAY-SIGN')
      .single();

    await supabase.from('inventory_movements').insert({
      hardware_catalog_id: catalogItem.id,
      movement_type: 'project_shipped',
      qty_delta: -sign.qty,
      project_id: sign.project_id,
      notes: 'Auto-decrement: replay signs installed at venue',
    });
  }
}
```

---

## Output Written

- `analysis/model-replay-signs.md` — this file
- `final-mega-spec/data-model/schema.md` — patched `replay_signs` table with:
  - `CHECK` constraint on `outreach_channel`
  - `idx_replay_signs_project` index
  - `idx_replay_signs_status` index
  - "Replay Signs Model" documentation section appended
