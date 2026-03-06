# PodPlay Ops Wizard — Data Migration Plan

XLSX → Supabase initial import for existing customer, inventory, financial, and fulfillment data.

**Source file**: `docs/Kim Lapus PodPlay MRP.xlsx` (24 sheets)
**Target**: Supabase Postgres as specified in `final-mega-spec/data-model/schema.md`

---

## Overview

The migration is a one-time operation performed after the Supabase project is created and all
schema migrations have run. It imports live operational data from the MRP XLSX so the new
webapp launches with all active and historical projects intact.

**What gets migrated** (from XLSX):
- Projects (customers, venues, lifecycle status, dates, credentials)
- Installers directory
- Inventory stock levels and purchase orders
- Invoices and expenses
- CC terminal orders (CC Form sheet)
- Replay sign fulfillment records (Customer Replay Signs sheet)

**What does NOT get migrated** (seeded by `seed-data.md` instead):
- Hardware catalog (47 items, seeded from spec)
- BOM templates (per-tier formulas, seeded from spec)
- Deployment checklist templates (all 16 phases, seeded from spec)
- Settings singleton (defaults seeded from spec; salary fields set to 0.00, updated post-launch)
- Network VLANs, ISP bandwidth table, troubleshooting entries (seeded from spec)
- Support tier definitions, contact directory (seeded from spec)

**Migration is NOT re-runnable in a naive way.** Run it once on a fresh database after seeding.
Subsequent re-runs must use upsert logic with `ON CONFLICT DO UPDATE` to avoid duplicates.

---

## Prerequisites

1. Supabase project created and all schema migrations applied (run `supabase db push`)
2. Seed data inserted (`seed-data.md` SQL blocks executed)
3. Python environment with dependencies:
   ```
   pip install pandas openpyxl psycopg2-binary python-dotenv
   ```
4. `.env` file with Supabase connection string:
   ```
   DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
   ```
5. The XLSX file available at `docs/Kim Lapus PodPlay MRP.xlsx`

---

## Migration Order

Foreign key dependencies require this exact order:

```
1. installers           (no FKs)
2. projects             (FK: installer_id → installers)
3. project_bom_items    (FK: project_id → projects, hardware_catalog_id → hardware_catalog)
4. inventory            (FK: hardware_catalog_id → hardware_catalog)
5. inventory_movements  (FK: hardware_catalog_id, project_id)
6. purchase_orders      (FK: project_id → projects)
7. purchase_order_items (FK: purchase_order_id, hardware_catalog_id)
8. deployment_checklist_items (FK: project_id, template_id → deployment_checklist_templates)
9. invoices             (FK: project_id → projects)
10. expenses            (FK: project_id → projects)
11. replay_signs        (FK: project_id → projects)
12. cc_terminals        (FK: project_id → projects)
```

---

## Sheet-by-Sheet Migration Map

### 1. Installer Directory → `installers`

**MRP Sheet**: "Installer Directory" (exact tab name may vary)

**Column mapping**:

| MRP Column | DB Field | Type | Notes |
|-----------|---------|------|-------|
| Full Name | `name` | TEXT NOT NULL | Required |
| Company / Business Name | `company` | TEXT | NULL if sole contractor |
| Email | `email` | TEXT | |
| Phone | `phone` | TEXT | |
| Type | `installer_type` | enum | "PodPlay Vetted" → `podplay_vetted`; "Client's Own" → `client_own` |
| Service Area / States | `regions` | TEXT[] | Split comma-separated state codes into array |
| Hourly Rate | `hourly_rate` | NUMERIC | NULL if using global default |
| Active | `is_active` | BOOLEAN | "Yes"/"Active" → true; blank/No → false |
| Notes | `notes` | TEXT | |

**Data cleaning**:
- Normalize installer_type: any variation of "vetted", "PodPlay" → `podplay_vetted`; "client", "own" → `client_own`
- If `hourly_rate` cell is blank or "$0.00", set to NULL (uses global `settings.labor_rate_per_hour`)
- `regions` array: split on comma or slash, strip whitespace, uppercase state codes (e.g., "NY, NJ" → `['NY', 'NJ']`)

**Python pattern**:
```python
import pandas as pd
from openpyxl import load_workbook

df = pd.read_excel('docs/Kim Lapus PodPlay MRP.xlsx', sheet_name='Installer Directory')

installers = []
for _, row in df.iterrows():
    if pd.isna(row['Full Name']) or str(row['Full Name']).strip() == '':
        continue  # skip blank rows

    regions_raw = str(row.get('Service Area', '') or '')
    regions = [s.strip().upper() for s in regions_raw.split(',') if s.strip()] or None

    rate = row.get('Hourly Rate')
    hourly_rate = float(str(rate).replace('$','').replace(',','').strip()) \
                  if rate and str(rate).strip() not in ('', '0', '$0', '$0.00') else None

    installer_type_raw = str(row.get('Type', 'PodPlay Vetted')).lower()
    installer_type = 'client_own' if 'client' in installer_type_raw or 'own' in installer_type_raw \
                     else 'podplay_vetted'

    installers.append({
        'name': str(row['Full Name']).strip(),
        'company': str(row.get('Company', '') or '') or None,
        'email': str(row.get('Email', '') or '') or None,
        'phone': str(row.get('Phone', '') or '') or None,
        'installer_type': installer_type,
        'regions': regions,
        'hourly_rate': hourly_rate,
        'is_active': str(row.get('Active', 'Yes')).lower() not in ('no', 'false', 'inactive', '0'),
        'notes': str(row.get('Notes', '') or '') or None,
    })
```

---

### 2. CUSTOMER MASTER + Form Responses + MASTER ACCOUNTS → `projects`

**MRP Sheets**: "Form Responses", "CUSTOMER MASTER", "MASTER ACCOUNTS"
All three sheets share the same customer key (customer name). The migration joins them.

**Column mapping — Form Responses tab**:

| MRP Column | DB Field | Type | Notes |
|-----------|---------|------|-------|
| Customer / Club Name | `customer_name` | TEXT | Required |
| Venue / Location Name | `venue_name` | TEXT | Use customer_name if blank |
| Venue Address (line 1) | `venue_address_line1` | TEXT | |
| Venue Address (line 2) | `venue_address_line2` | TEXT | |
| City | `venue_city` | TEXT | |
| State | `venue_state` | TEXT | 2-letter code; PH for Philippines |
| Country | `venue_country` | TEXT | 'US' default; 'PH' for Philippines |
| ZIP | `venue_zip` | TEXT | |
| Primary Contact Name | `contact_name` | TEXT | |
| Primary Contact Email | `contact_email` | TEXT | |
| Primary Contact Phone | `contact_phone` | TEXT | |
| Service Tier | `tier` | enum | See tier normalization below |
| Number of Courts | `court_count` | INTEGER | |
| Number of Doors | `door_count` | INTEGER | 0 if blank |
| Number of Security Cameras | `security_camera_count` | INTEGER | 0 if blank |
| Front Desk Equipment? | `has_front_desk` | BOOLEAN | Yes/checkbox → true |
| ISP Provider | `isp_provider` | TEXT | |
| Connection Type | `isp_type` | enum | See isp_type normalization below |
| Static IP Available? | `has_static_ip` | BOOLEAN | |
| Backup ISP? | `has_backup_isp` | BOOLEAN | |
| Download Speed (Mbps) | `internet_download_mbps` | INTEGER | |
| Upload Speed (Mbps) | `internet_upload_mbps` | INTEGER | |

**Column mapping — CUSTOMER MASTER tab**:

| MRP Column | DB Field | Type | Notes |
|-----------|---------|------|-------|
| Status | `deployment_status` | enum | See status normalization below |
| Kickoff Call Date | `kickoff_call_date` | DATE | |
| Signed Date | `signed_date` | DATE | |
| Installation Start | `installation_start_date` | DATE | |
| Installation End | `installation_end_date` | DATE | |
| Go-Live Date | `go_live_date` | DATE | |
| Installer | `installer_id` | UUID | Name lookup against `installers` table |
| Installer Type | `installer_type` | enum | |
| Installer Hours | `installer_hours` | NUMERIC | |
| Revenue Stage | Derive `revenue_stage` | enum | See revenue_stage derivation below |
| Notes | `notes` | TEXT | |
| Internal Notes | `internal_notes` | TEXT | |

**Column mapping — MASTER ACCOUNTS tab**:

| MRP Column | DB Field | Type | Notes |
|-----------|---------|------|-------|
| DDNS Subdomain | `ddns_subdomain` | TEXT | Lowercase, no spaces |
| UniFi Site Name | `unifi_site_name` | TEXT | |
| Mac Mini Username | `mac_mini_username` | TEXT | |
| Mac Mini Password | `mac_mini_password` | TEXT | |
| Location ID | `location_id` | TEXT | PodPlay backend venue ID |

**Tier normalization**:
```python
TIER_MAP = {
    'pro': 'pro',
    'Pro': 'pro',
    'PRO': 'pro',
    'autonomous': 'autonomous',
    'Autonomous': 'autonomous',
    'autonomous+': 'autonomous_plus',
    'Autonomous+': 'autonomous_plus',
    'AUTONOMOUS+': 'autonomous_plus',
    'autonomous plus': 'autonomous_plus',
    'pbk': 'pbk',
    'PBK': 'pbk',
    'pickleball kingdom': 'pbk',
}
```

**ISP type normalization**:
```python
ISP_TYPE_MAP = {
    'fiber': 'fiber', 'Fiber': 'fiber',
    'cable': 'cable', 'Cable': 'cable',
    'dedicated': 'dedicated', 'Dedicated': 'dedicated',
}
# Any unmatched value → 'other'
```

**Deployment status normalization** (from MRP "Status" column):
```python
DEPLOYMENT_STATUS_MAP = {
    'Not Started': 'not_started',
    'Config': 'config',
    'Configuring': 'config',
    'Ready to Ship': 'ready_to_ship',
    'Ready To Ship': 'ready_to_ship',
    'Shipped': 'shipped',
    'Installing': 'installing',
    'On-Site': 'installing',
    'QC': 'qc',
    'Quality Check': 'qc',
    'Completed': 'completed',
    'Complete': 'completed',
}
# Blank / NULL → 'not_started'
```

**Project status derivation** (from wizard stage — derive from data):
```python
def derive_project_status(row):
    # If go_live_date is set and final invoice paid → 'completed'
    if row.get('go_live_date') and row.get('final_paid'):
        return 'completed'
    # If any deployment checklist activity → 'deployment'
    if row.get('deployment_status') not in ('not_started', None, ''):
        return 'deployment'
    # If signed → 'procurement'
    if row.get('signed_date'):
        return 'procurement'
    # Default → 'intake'
    return 'intake'
```

**Revenue stage derivation** (from CUSTOMER MASTER invoicing columns):
```python
def derive_revenue_stage(row):
    # MRP has boolean columns: Signed, Deposit Invoiced, Deposit Paid, Final Invoiced, Final Paid
    if row.get('final_paid'):      return 'final_paid'
    if row.get('final_invoiced'):  return 'final_invoiced'
    if row.get('deposit_paid'):    return 'deposit_paid'
    if row.get('deposit_invoiced'):return 'deposit_invoiced'
    if row.get('signed_date'):     return 'signed'
    return 'proposal'
```

**Installer ID lookup** (join on name):
```python
# After inserting installers, build a name→UUID lookup dict:
installer_lookup = {row['name']: row['id'] for row in inserted_installers}

# For each project:
installer_name = row.get('Installer', '')
installer_id = installer_lookup.get(installer_name)  # None if unmatched
```

**replay_api_url auto-derive**:
```python
if ddns_subdomain:
    replay_api_url = f'http://{ddns_subdomain}.podplaydns.com:4000'
else:
    replay_api_url = None
```

---

### 3. Per-Customer BOM Tabs → `project_bom_items`

**MRP Sheet**: One tab per customer with BOM data (tab name = customer name)

For most projects, the BOM can be **regenerated** from `bom_templates` rather than manually
migrated. The migration script should call the BOM generation logic for each imported project
rather than parsing individual customer tabs.

**Regeneration approach** (recommended):
```python
# For each imported project, call the same function the webapp uses:
# SELECT * FROM bom_templates WHERE tier = project.tier
# Then compute qty = qty_per_venue
#                  + (qty_per_court × court_count)
#                  + (qty_per_door × door_count)
#                  + (qty_per_camera × security_camera_count)
# INSERT INTO project_bom_items with unit_cost copied from hardware_catalog

def generate_bom_for_project(project_id, tier, court_count, door_count, security_camera_count,
                               conn):
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO project_bom_items
            (project_id, hardware_catalog_id, qty, unit_cost, shipping_rate, margin)
        SELECT
            %s,
            bt.hardware_catalog_id,
            bt.qty_per_venue
              + (bt.qty_per_court × %s)
              + (bt.qty_per_door × %s)
              + (bt.qty_per_camera × %s),
            hc.unit_cost,
            (SELECT shipping_rate FROM settings WHERE id = 'default'),
            (SELECT target_margin FROM settings WHERE id = 'default')
        FROM bom_templates bt
        JOIN hardware_catalog hc ON hc.id = bt.hardware_catalog_id
        WHERE bt.tier = %s
          AND (bt.qty_per_venue
             + bt.qty_per_court * %s
             + bt.qty_per_door * %s
             + bt.qty_per_camera * %s) > 0
        ON CONFLICT (project_id, hardware_catalog_id) DO NOTHING
    """, (project_id, court_count, door_count, security_camera_count, tier,
          court_count, door_count, security_camera_count))
    conn.commit()
```

**When to parse individual customer BOM tabs instead**:
Only if a project has custom/overridden BOM items that differ from the template. In that case:
- Read the customer's BOM tab
- Match item names to `hardware_catalog.name` (fuzzy match on SKU or name)
- Insert with the actual `qty` and `unit_cost` from the tab
- Set `notes = 'Imported from MRP — verify against template'`

---

### 4. INVENTORY Sheet → `inventory` + `inventory_movements`

**MRP Sheet**: "INVENTORY"

**Column mapping → `inventory`**:

| MRP Column | DB Field | Notes |
|-----------|---------|-------|
| Item Name | `hardware_catalog_id` | Name lookup against `hardware_catalog.name` |
| Stock / On Hand | `qty_on_hand` | Total units in NJ lab |
| Allocated | `qty_allocated` | Units reserved for active projects |
| Reorder Point | `reorder_threshold` | Low stock alert level |
| Notes | `notes` | |

**Item name matching**:
```python
# Build name→UUID lookup from hardware_catalog (seeded):
catalog_lookup = {row['name'].lower(): row['id'] for row in hardware_catalog_rows}

# Also try SKU lookup:
sku_lookup = {row['sku'].lower(): row['id'] for row in hardware_catalog_rows}

def resolve_catalog_id(item_name):
    name_lower = str(item_name).lower().strip()
    if name_lower in catalog_lookup:
        return catalog_lookup[name_lower]
    # Partial match fallback:
    for known_name, uid in catalog_lookup.items():
        if name_lower in known_name or known_name in name_lower:
            return uid
    print(f'WARNING: No catalog match for "{item_name}" — skipping')
    return None
```

**Initial movement record**: For each inventory row with `qty_on_hand > 0`, create one
`inventory_movements` record as a bootstrap opening balance:
```python
{
    'hardware_catalog_id': item_id,
    'project_id': None,
    'movement_type': 'adjustment_increase',
    'qty_delta': qty_on_hand,
    'reference': 'MRP-MIGRATION-OPENING-BALANCE',
    'notes': f'Opening balance imported from MRP INVENTORY sheet on {migration_date}'
}
```

---

### 5. ORDER INPUT Sheet → `purchase_orders` + `purchase_order_items`

**MRP Sheet**: "ORDER INPUT" (may also be "PURCHASE ORDERS" or similar)

**Column mapping → `purchase_orders`**:

| MRP Column | DB Field | Notes |
|-----------|---------|-------|
| PO Number | `po_number` | If blank, generate: `LEGACY-{row_number:04d}` |
| Vendor | `vendor` | |
| Customer / Project | `project_id` | Name lookup; NULL for stock replenishment POs |
| Order Date | `order_date` | Required |
| Expected Date | `expected_date` | |
| Received Date | `received_date` | If set, status = 'received' |
| Total Cost | `total_cost` | |
| Status | `status` | See PO status normalization below |
| Tracking Number | `tracking_number` | |
| Notes | `notes` | |

**PO status normalization**:
```python
PO_STATUS_MAP = {
    'Pending': 'pending',
    'Ordered': 'ordered',
    'Partial': 'partial',
    'Received': 'received',
    'Cancelled': 'cancelled',
    'Canceled': 'cancelled',
}
# If received_date is set and status is blank → 'received'
# If order_date is set and status is blank → 'ordered'
# Default → 'pending'
```

**Column mapping → `purchase_order_items`** (line items within each PO):

| MRP Column | DB Field | Notes |
|-----------|---------|-------|
| Item Name | `hardware_catalog_id` | Name lookup |
| Qty Ordered | `qty_ordered` | |
| Qty Received | `qty_received` | 0 if blank |
| Unit Cost | `unit_cost` | |

If the MRP stores PO line items on a separate tab or as columns in the ORDER INPUT sheet,
adapt the parsing accordingly. Each PO must have at least one `purchase_order_items` row.

---

### 6. INVOICING Sheet → `invoices`

**MRP Sheet**: "INVOICING" (or "Revenue Pipeline" — exact name may vary)

The MRP likely has one section for deposit invoices and one for final invoices per customer,
or alternately one row per customer with separate columns for deposit and final.

**Column mapping**:

| MRP Column | DB Field | Notes |
|-----------|---------|-------|
| Customer / Project | `project_id` | Name lookup |
| Invoice Type | `invoice_type` | "Deposit"/"deposit" → `deposit`; "Final"/"final" → `final` |
| Invoice # | `invoice_number` | External billing number |
| Hardware Total | `hardware_subtotal` | |
| Service Fee | `service_fee` | |
| Tax Rate | `tax_rate` | Default 0.1025 if blank |
| Deposit % | `deposit_pct` | Default 0.50 if blank |
| Invoiced? / Date Sent | `status`, `date_sent` | If date present → 'sent'; if paid → 'paid' |
| Paid? / Date Paid | `status`, `date_paid` | |
| Notes | `notes` | |

**Status derivation from MRP boolean columns**:
```python
def derive_invoice_status(date_paid, date_sent):
    if date_paid:   return 'paid'
    if date_sent:   return 'sent'
    return 'not_sent'
```

**If MRP has per-customer columns rather than separate rows** (e.g., "Deposit Invoice #",
"Deposit Date Sent", "Deposit Date Paid", "Final Invoice #", "Final Date Sent", "Final Date Paid"):
Generate two rows per customer, one for each invoice_type.

---

### 7. EXPENSES Sheet → `expenses`

**MRP Sheet**: "EXPENSES"

**Column mapping**:

| MRP Column | DB Field | Notes |
|-----------|---------|-------|
| Date | `expense_date` | DATE format |
| Customer / Project | `project_id` | Name lookup |
| Category | `category` | See category normalization below |
| Amount | `amount` | Positive NUMERIC |
| Payment Method | `payment_method` | See payment_method normalization below |
| Description / Notes | `description` | Free-form text |

**Category normalization**:
```python
CATEGORY_MAP = {
    'Airfare': 'airfare', 'Air': 'airfare', 'Flight': 'airfare',
    'Car': 'car', 'Car Rental': 'car', 'Rental Car': 'car',
    'Fuel': 'fuel', 'Gas': 'fuel',
    'Lodging': 'lodging', 'Hotel': 'lodging',
    'Meals': 'meals', 'Food': 'meals',
    'Misc Hardware': 'misc_hardware', 'Hardware': 'misc_hardware',
    'Outbound Shipping': 'outbound_shipping', 'Shipping': 'outbound_shipping',
    'Professional Services': 'professional_services', 'Services': 'professional_services',
    'Taxi': 'taxi', 'Uber': 'taxi', 'Lyft': 'taxi', 'Rideshare': 'taxi',
    'Train': 'train',
    'Parking': 'parking',
}
# Unmatched → 'other'
```

**Payment method normalization**:
```python
PAYMENT_METHOD_MAP = {
    'PodPlay Card': 'podplay_card',
    'Ramp Card': 'podplay_card',
    'Company Card': 'podplay_card',
    'Ramp Reimburse': 'ramp_reimburse',
    'Personal Card': 'ramp_reimburse',
    'Reimbursement': 'ramp_reimburse',
    'Reimburse': 'ramp_reimburse',
}
# Default → 'podplay_card'
```

---

### 8. CC Form Sheet → `cc_terminals`

**MRP Sheet**: "CC Form"

This sheet tracks BBPOS WisePOS E credit card terminal orders. One row per project that has
front desk equipment (`has_front_desk = true`).

**Column mapping**:

| MRP Column | DB Field | Notes |
|-----------|---------|-------|
| Customer / Venue | `project_id` | Name lookup against projects |
| Qty | `qty` | Number of terminals ordered; default 1 |
| Status | `status` | See status normalization below |
| Order Date | `order_date` | |
| Expected Delivery | `expected_date` | |
| Delivered Date | `delivered_date` | |
| Installed Date | `installed_date` | |
| Stripe Order ID | `stripe_order_id` | Stripe order reference |
| Cost Per Unit | `cost_per_unit` | USD; multiply by qty for total cost |
| Notes | `notes` | |

**CC terminal status normalization**:
```python
CC_STATUS_MAP = {
    'Not Ordered': 'not_ordered',
    'Ordered': 'ordered',
    'Delivered': 'delivered',
    'Installed': 'installed',
}
# If delivered_date is set and status blank → 'delivered'
# If order_date is set and status blank → 'ordered'
# Default → 'not_ordered'
```

**Migration note**: Only insert a `cc_terminals` row for projects that have `has_front_desk = true`
OR that appear in the CC Form sheet. Do not create cc_terminals rows for projects without
front desk equipment.

**Post-migration sync**: After importing, update `projects.has_front_desk = true` for any
project that now has a `cc_terminals` row with `status != 'not_ordered'`.

---

### 9. Customer Replay Signs Sheet → `replay_signs`

**MRP Sheet**: "Customer Replay Signs"

This sheet tracks 6×8 inch aluminum sign orders (vendor: Fast Signs, $25/unit) for each project.
One row per project.

**Column mapping**:

| MRP Column | DB Field | Notes |
|-----------|---------|-------|
| Customer / Venue | `project_id` | Name lookup |
| Qty | `qty` | Should equal court_count × 2; import as-is (may include overrides) |
| Status | `status` | See status normalization below |
| Outreach Channel | `outreach_channel` | 'slack' \| 'email' \| 'other' |
| Outreach Date | `outreach_date` | When ops contacted Fast Signs |
| Shipped Date | `shipped_date` | |
| Delivered Date | `delivered_date` | |
| Installed Date | `installed_date` | |
| Tracking Number | `tracking_number` | Carrier tracking |
| Order Ref / Order ID | `vendor_order_id` | Fast Signs order number |
| Notes | `notes` | |

**Sign status normalization**:
```python
SIGN_STATUS_MAP = {
    'Staged': 'staged',
    'Queued': 'staged',
    'Shipped': 'shipped',
    'Delivered': 'delivered',
    'Installed': 'installed',
    'Complete': 'installed',
}
# Derive from dates if status column is blank:
def derive_sign_status(row):
    if row.get('installed_date'): return 'installed'
    if row.get('delivered_date'): return 'delivered'
    if row.get('shipped_date'):   return 'shipped'
    return 'staged'
```

**Outreach channel normalization**:
```python
def normalize_outreach_channel(raw):
    if not raw: return None
    raw = str(raw).lower()
    if 'slack' in raw: return 'slack'
    if 'email' in raw: return 'email'
    return 'other'
```

**Uniqueness**: `replay_signs` has `UNIQUE (project_id)`. If a project appears multiple
times in the sheet (data error), import only the most recent / most complete row.

---

### 10. Per-Customer Status Tabs → `deployment_checklist_items`

**MRP Sheets**: One tab per customer with phase-by-phase checkboxes

The deployment checklist items are generated from templates when a project enters Stage 3.
For projects already in deployment or completed in the MRP, the migration should:

1. Generate all checklist items from templates (same as webapp does at Stage 3 entry)
2. For completed projects (`project_status = 'completed'`): mark ALL items `is_completed = true`,
   `completed_at = go_live_date`
3. For in-progress projects (`deployment_status` in `['config', 'ready_to_ship', 'shipped',
   'installing', 'qc']`): generate items but leave `is_completed = false` (ops will manually
   check off progress in the new app)

Parsing individual customer tabs for per-step completion state is not recommended because:
- MRP checkboxes are stored as TRUE/FALSE cell values that are fragile to parse
- Token replacement in step descriptions must be applied at generation time
- The operational cost of re-checking ~20 steps per active project in the new UI is low

**Generation SQL** (run per-project when populating checklist items):
```sql
INSERT INTO deployment_checklist_items
    (project_id, template_id, phase, step_number, sort_order,
     title, description, warnings, is_completed, completed_at)
SELECT
    $project_id,
    t.id,
    t.phase,
    t.step_number,
    t.sort_order,
    t.title,
    -- Token replacement done client-side; store raw template description at import time
    t.description,
    t.warnings,
    $mark_all_complete,  -- true for completed projects, false for in-progress
    CASE WHEN $mark_all_complete THEN $go_live_date::timestamptz ELSE NULL END
FROM deployment_checklist_templates t
WHERE (t.applicable_tiers IS NULL OR $project_tier = ANY(t.applicable_tiers))
  AND ($replay_version = 'v2' OR NOT t.is_v2_only)
ORDER BY t.sort_order
ON CONFLICT (project_id, template_id) DO NOTHING;
```

---

## Full Migration Script Structure

```
scripts/
└── migrate-from-xlsx/
    ├── migrate.py          # Main orchestrator — calls each step in order
    ├── connect.py          # DB connection from DATABASE_URL env
    ├── 01_installers.py    # Read Installer Directory → insert installers
    ├── 02_projects.py      # Read CUSTOMER MASTER + Form Responses + MASTER ACCOUNTS → projects
    ├── 03_bom_items.py     # Generate BOMs from templates for each project
    ├── 04_inventory.py     # Read INVENTORY → inventory + opening balance movements
    ├── 05_purchase_orders.py  # Read ORDER INPUT → purchase_orders + items
    ├── 06_checklist_items.py  # Generate checklist items from templates per project
    ├── 07_invoices.py      # Read INVOICING → invoices (deposit + final per project)
    ├── 08_expenses.py      # Read EXPENSES → expenses
    ├── 09_replay_signs.py  # Read Customer Replay Signs → replay_signs
    ├── 10_cc_terminals.py  # Read CC Form → cc_terminals
    └── validate.py         # Post-migration validation checks
```

**`migrate.py` orchestrator**:
```python
#!/usr/bin/env python3
"""One-time MRP XLSX → Supabase migration."""

import sys
from connect import get_conn
from scripts import (
    migrate_installers,
    migrate_projects,
    generate_bom_items,
    migrate_inventory,
    migrate_purchase_orders,
    generate_checklist_items,
    migrate_invoices,
    migrate_expenses,
    migrate_replay_signs,
    migrate_cc_terminals,
    validate,
)

XLSX_PATH = 'docs/Kim Lapus PodPlay MRP.xlsx'

def main():
    conn = get_conn()
    print('=== PodPlay MRP Migration ===')

    print('Step 1: Installers...')
    installer_lookup = migrate_installers(conn, XLSX_PATH)

    print('Step 2: Projects...')
    project_lookup = migrate_projects(conn, XLSX_PATH, installer_lookup)

    print('Step 3: BOM items (generate from templates)...')
    generate_bom_items(conn, project_lookup)

    print('Step 4: Inventory...')
    migrate_inventory(conn, XLSX_PATH)

    print('Step 5: Purchase orders...')
    migrate_purchase_orders(conn, XLSX_PATH, project_lookup)

    print('Step 6: Deployment checklist items...')
    generate_checklist_items(conn, project_lookup)

    print('Step 7: Invoices...')
    migrate_invoices(conn, XLSX_PATH, project_lookup)

    print('Step 8: Expenses...')
    migrate_expenses(conn, XLSX_PATH, project_lookup)

    print('Step 9: Replay signs...')
    migrate_replay_signs(conn, XLSX_PATH, project_lookup)

    print('Step 10: CC terminals...')
    migrate_cc_terminals(conn, XLSX_PATH, project_lookup)

    print('Step 11: Validation...')
    errors = validate(conn, project_lookup)
    if errors:
        print(f'VALIDATION FAILED: {len(errors)} errors')
        for e in errors: print(f'  - {e}')
        sys.exit(1)

    print('Migration complete.')
    conn.close()

if __name__ == '__main__':
    main()
```

---

## Post-Migration Validation (`validate.py`)

Run these checks after migration completes. Any failure must be investigated before go-live.

```python
def validate(conn, project_lookup):
    errors = []
    cur = conn.cursor()

    # 1. Every project must have at least 1 BOM item
    cur.execute("""
        SELECT p.customer_name FROM projects p
        LEFT JOIN project_bom_items b ON b.project_id = p.id
        WHERE b.id IS NULL
    """)
    for row in cur.fetchall():
        errors.append(f'Project "{row[0]}" has no BOM items')

    # 2. Every project in deployment/completed must have checklist items
    cur.execute("""
        SELECT p.customer_name FROM projects p
        LEFT JOIN deployment_checklist_items c ON c.project_id = p.id
        WHERE p.project_status IN ('deployment', 'completed')
          AND c.id IS NULL
    """)
    for row in cur.fetchall():
        errors.append(f'Project "{row[0]}" in deployment has no checklist items')

    # 3. Revenue stage consistency: if signed_date is set, revenue_stage must not be 'proposal'
    cur.execute("""
        SELECT customer_name FROM projects
        WHERE signed_date IS NOT NULL
          AND revenue_stage = 'proposal'
    """)
    for row in cur.fetchall():
        errors.append(f'Project "{row[0]}" has signed_date but revenue_stage = proposal')

    # 4. No duplicate DDNS subdomains
    cur.execute("""
        SELECT ddns_subdomain, COUNT(*) FROM projects
        WHERE ddns_subdomain IS NOT NULL
        GROUP BY ddns_subdomain
        HAVING COUNT(*) > 1
    """)
    for row in cur.fetchall():
        errors.append(f'Duplicate DDNS subdomain: "{row[0]}" appears {row[1]} times')

    # 5. Every active project (not cancelled) has a tier
    cur.execute("""
        SELECT customer_name FROM projects
        WHERE project_status != 'cancelled'
          AND tier IS NULL
    """)
    for row in cur.fetchall():
        errors.append(f'Project "{row[0]}" is missing tier')

    # 6. Inventory qty_allocated matches sum of allocated BOM items
    cur.execute("""
        SELECT hc.name,
               i.qty_allocated AS stored,
               COUNT(b.id) FILTER (WHERE b.allocated AND NOT b.shipped) AS computed
        FROM inventory i
        JOIN hardware_catalog hc ON hc.id = i.hardware_catalog_id
        LEFT JOIN project_bom_items b ON b.hardware_catalog_id = i.hardware_catalog_id
        GROUP BY i.id, hc.name, i.qty_allocated
        HAVING i.qty_allocated != COUNT(b.id) FILTER (WHERE b.allocated AND NOT b.shipped)
    """)
    for row in cur.fetchall():
        errors.append(f'Inventory mismatch for "{row[0]}": '
                      f'stored allocated={row[1]}, computed={row[2]}')

    # 7. CC terminals only for has_front_desk projects
    cur.execute("""
        SELECT p.customer_name FROM cc_terminals ct
        JOIN projects p ON p.id = ct.project_id
        WHERE p.has_front_desk = false
    """)
    for row in cur.fetchall():
        errors.append(f'Project "{row[0]}" has cc_terminals row but has_front_desk = false '
                      f'— update has_front_desk = true')

    # 8. Replay sign qty should equal court_count × 2 (warn on mismatch)
    cur.execute("""
        SELECT p.customer_name, rs.qty AS sign_qty, p.court_count * 2 AS expected_qty
        FROM replay_signs rs
        JOIN projects p ON p.id = rs.project_id
        WHERE rs.qty != p.court_count * 2
    """)
    for row in cur.fetchall():
        errors.append(f'Replay sign qty mismatch for "{row[0]}": '
                      f'imported={row[1]}, expected (courts×2)={row[2]}')

    return errors
```

---

## Known Data Quality Issues

**1. XLSX not in CI repo**: The file `docs/Kim Lapus PodPlay MRP.xlsx` is not committed to the
repo (blocked in `source-mrp-sheets`). The migration script must be run locally with the XLSX
present in the `docs/` directory. The XLSX should NOT be committed to git (contains PII and
credentials).

**2. Customer name inconsistencies**: The same customer may appear under slightly different
spellings across tabs (e.g., "Telepark Pickleball" vs "Telepark"). Use the CUSTOMER MASTER
tab as the canonical customer name list. Cross-reference by normalizing: `.strip().title()`.

**3. MASTER ACCOUNTS credentials**: `mac_mini_password` is stored in plain text in the MRP.
After migration, passwords are stored in `projects.mac_mini_password` in Supabase. This is
consistent with the current MRP approach. Future hardening: move to a secrets vault (1Password)
and store only a vault reference.

**4. Unmatched hardware items**: If the INVENTORY or ORDER INPUT sheets contain item names that
do not match the seeded `hardware_catalog`, the migration script logs a warning and skips those
items. Review warnings after migration and manually add any missing catalog items via Settings.

**5. Partially configured projects**: Projects with `deployment_status = 'config'` or
`'ready_to_ship'` have partial deployment progress in the MRP. Their checklist items are
imported as all-unchecked; ops must manually re-check completed steps in the new wizard.
This is the expected behavior: the migration script does not attempt to parse per-step
checkbox states from individual customer MRP tabs.

**6. Philippines projects**: If any project has `venue_country = 'PH'`, verify:
- `isp_type` is set correctly (business plan + static IP required: see `logic-isp-validation.md`)
- Power specs are noted in `internal_notes`
- `installer_type` is `client_own` (local PH contractor)

**7. PBK projects**: `pbk_venue_fee` and `pbk_court_fee` in settings are set to 0.00 at
deployment. After migration, review PBK project contracts and update these settings fields
to the actual negotiated values before generating invoices.

---

## Settings Post-Migration Updates

After migration completes, update the `settings` row with actual values from the MRP HER sheet:

```sql
-- Update with actual salary values from MRP FINANCIALS/HER sheet
UPDATE settings SET
    niko_annual_salary = <actual value from HER sheet>,
    chad_annual_salary = <actual value from HER sheet>,
    -- Leave all other defaults in place
WHERE id = 'default';
```

Salary values are left at 0.00 at deployment because they contain personal compensation data
that should not be committed to this spec. Look up the HER sheet in the XLSX to obtain the
actual values and update the settings row immediately after migration.
