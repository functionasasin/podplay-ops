# PodPlay Ops Wizard — Entity Relationships

Complete FK relationships, cascade rules, and entity relationship summary.

**Source**: `final-mega-spec/data-model/schema.md` + `migration.sql`

---

## Entity Relationship Overview

```
installers ←──────────────────────────────────── projects
                                                     │
                        ┌────────────────────────────┼──────────────────────┐
                        │                            │                      │
                   project_bom_items          invoices (2)             expenses (n)
                        │                            │
                   hardware_catalog               (revenue_stage
                        │                         derived from invoice)
                   ┌────┴────┐
              bom_templates  inventory
                             │
                    inventory_movements
                    purchase_order_items ← purchase_orders
                                          (project_id, nullable)

         projects ───► deployment_checklist_items
                              │
                    deployment_checklist_templates

         projects ───► replay_signs  (1:1, all tiers)
         projects ───► cc_terminals  (1:1, has_front_desk=true only)
         projects ───► device_migrations  (1:many, nullable)
                              │
                       device_migration_items

         -- Reference tables (no project FK) --
         deployment_regions
         network_vlans
         isp_bandwidth_requirements
         team_contacts
         team_opex
         troubleshooting_tips
         monthly_opex_snapshots
         settings (singleton)
```

---

## Foreign Key Table

| Child Table | FK Column | Parent Table | On Delete | On Update | Notes |
|-------------|-----------|--------------|-----------|-----------|-------|
| `projects` | `installer_id` | `installers.id` | SET NULL | CASCADE | Installer assignment; NULL if TBD |
| `bom_templates` | `hardware_catalog_id` | `hardware_catalog.id` | CASCADE | CASCADE | Template row deleted if catalog item deleted |
| `project_bom_items` | `project_id` | `projects.id` | CASCADE | CASCADE | BOM deleted when project deleted |
| `project_bom_items` | `hardware_catalog_id` | `hardware_catalog.id` | RESTRICT | CASCADE | Cannot delete catalog item used in project BOM |
| `inventory` | `hardware_catalog_id` | `hardware_catalog.id` | RESTRICT | CASCADE | Cannot delete catalog item with inventory row; UNIQUE |
| `inventory_movements` | `hardware_catalog_id` | `hardware_catalog.id` | RESTRICT | CASCADE | Movement log preserved for audit |
| `inventory_movements` | `project_id` | `projects.id` | SET NULL | CASCADE | Movements preserved when project deleted; project_id nulled |
| `purchase_orders` | `project_id` | `projects.id` | SET NULL | CASCADE | PO preserved for audit; project link nulled |
| `purchase_order_items` | `purchase_order_id` | `purchase_orders.id` | CASCADE | CASCADE | Line items deleted with PO |
| `purchase_order_items` | `hardware_catalog_id` | `hardware_catalog.id` | RESTRICT | CASCADE | Cannot delete catalog item with PO lines |
| `deployment_checklist_items` | `project_id` | `projects.id` | CASCADE | CASCADE | Checklist deleted when project deleted |
| `deployment_checklist_items` | `template_id` | `deployment_checklist_templates.id` | RESTRICT | CASCADE | Cannot delete template with instantiated items |
| `invoices` | `project_id` | `projects.id` | CASCADE | CASCADE | Invoices deleted when project deleted |
| `expenses` | `project_id` | `projects.id` | CASCADE | CASCADE | Expenses deleted when project deleted |
| `replay_signs` | `project_id` | `projects.id` | CASCADE | CASCADE | Sign record deleted when project deleted; UNIQUE |
| `cc_terminals` | `project_id` | `projects.id` | CASCADE | CASCADE | Terminal record deleted when project deleted; UNIQUE |
| `device_migrations` | `project_id` | `projects.id` | SET NULL | CASCADE | Migration preserved; project link nulled |
| `device_migration_items` | `migration_id` | `device_migrations.id` | CASCADE | CASCADE | Items deleted when migration deleted |

---

## Cardinality Summary

| Relationship | Cardinality | Notes |
|-------------|-------------|-------|
| `projects` → `installers` | Many:1 (optional) | A project has 0 or 1 installer; an installer has many projects |
| `projects` → `project_bom_items` | 1:Many | A project has many BOM line items |
| `projects` → `invoices` | 1:2 | Exactly 2 invoices per project (deposit + final); `UNIQUE(project_id, invoice_type)` |
| `projects` → `expenses` | 1:Many | A project has 0 or more expenses |
| `projects` → `replay_signs` | 1:1 | Exactly 1 replay_signs row per project; `UNIQUE(project_id)` |
| `projects` → `cc_terminals` | 1:1 (conditional) | 1 cc_terminals row when `has_front_desk = true`; `UNIQUE(project_id)` |
| `projects` → `deployment_checklist_items` | 1:Many | A project has one instantiated checklist item per applicable template |
| `projects` → `device_migrations` | 1:Many (optional) | A project may have 0 or more ABM migration events |
| `hardware_catalog` → `bom_templates` | 1:Many | A catalog item has 1 template row per tier where it appears |
| `hardware_catalog` → `project_bom_items` | 1:Many | A catalog item may appear in many project BOMs |
| `hardware_catalog` → `inventory` | 1:1 | One inventory record per catalog item; `UNIQUE(hardware_catalog_id)` |
| `hardware_catalog` → `inventory_movements` | 1:Many | Many movement records per item |
| `hardware_catalog` → `purchase_order_items` | 1:Many | Many PO line items per catalog item |
| `purchase_orders` → `purchase_order_items` | 1:Many | A PO has many line items |
| `deployment_checklist_templates` → `deployment_checklist_items` | 1:Many | One template instantiated per project |
| `device_migrations` → `device_migration_items` | 1:Many | Many devices per migration event |

---

## 1:1 Relationships Detail

### projects → replay_signs
- Created automatically at Stage 2 (Procurement) entry for **all tiers**.
- `UNIQUE(project_id)` enforces exactly one record.
- `qty = projects.replay_sign_count` (court_count × 2) copied at row creation.
- Service: `ensureReplaySignRecord(projectId)` — idempotent.

### projects → cc_terminals
- Created automatically at Stage 2 entry when `projects.has_front_desk = true`.
- `UNIQUE(project_id)` enforces exactly one record per project.
- Default `qty = 1` (BBPOS WisePOS E); `cost_per_unit = 249.00`.
- Service: `ensureFrontDeskRecords(projectId)` — idempotent, skips if `has_front_desk = false`.

### hardware_catalog → inventory
- One inventory row per catalog item (same `UNIQUE` constraint as PK for this relationship).
- Created in bulk as part of seed data initialization.
- `qty_on_hand` and `qty_allocated` updated via client-side service after each `inventory_movements` INSERT.

---

## Cascade Delete Behavior

When a **project** is deleted:
- `project_bom_items` → deleted (CASCADE)
- `invoices` → deleted (CASCADE)
- `expenses` → deleted (CASCADE)
- `replay_signs` → deleted (CASCADE)
- `cc_terminals` → deleted (CASCADE)
- `deployment_checklist_items` → deleted (CASCADE)
- `inventory_movements.project_id` → SET NULL (movement log preserved for audit)
- `purchase_orders.project_id` → SET NULL (PO preserved; project link nulled)
- `device_migrations.project_id` → SET NULL (migration preserved; project link nulled)

When a **purchase_order** is deleted:
- `purchase_order_items` → deleted (CASCADE)

When a **device_migration** is deleted:
- `device_migration_items` → deleted (CASCADE)

When a **hardware_catalog** item is deleted:
- `bom_templates` rows for that item → deleted (CASCADE)
- `inventory` row for that item → BLOCKED (RESTRICT) — must manually zero out or transfer
- `inventory_movements` rows → BLOCKED (RESTRICT) — audit log preserved
- `purchase_order_items` rows → BLOCKED (RESTRICT) — PO history preserved
- `project_bom_items` rows → BLOCKED (RESTRICT) — BOM history preserved

---

## Self-Referencing / Derived Relationships

### revenue_stage ↔ invoices
`projects.revenue_stage` is derived from the state of the two `invoices` rows. The client
service layer updates `revenue_stage` when invoice status changes:

```
invoice.status transitions → projects.revenue_stage:
  deposit invoice status = 'sent'  → 'deposit_invoiced'
  deposit invoice status = 'paid'  → 'deposit_paid'
  final invoice status   = 'sent'  → 'final_invoiced'
  final invoice status   = 'paid'  → 'final_paid'
```

### project_bom_items.allocated / shipped ↔ inventory
Updating `project_bom_items.allocated = true` triggers an `inventory_movements` INSERT
(`movement_type = 'project_allocated'`, `qty_delta = -qty`) and updates `inventory.qty_allocated`.

Updating `project_bom_items.shipped = true` triggers an `inventory_movements` INSERT
(`movement_type = 'project_shipped'`, `qty_delta = -qty`) and updates both
`inventory.qty_on_hand` and `inventory.qty_allocated`.

These are **client-side transactions** (no DB triggers) — the service layer performs all
three writes atomically using Supabase's `rpc` or batched inserts.

---

## Reference Tables (No FK to projects)

These tables contain static reference data managed via migrations, not per-project data:

| Table | Rows | Purpose |
|-------|------|---------|
| `settings` | 1 | Global pricing, rates, thresholds |
| `hardware_catalog` | ~47 | Master hardware item list |
| `bom_templates` | ~100 | Per-tier BOM quantity formulas |
| `deployment_checklist_templates` | ~120 | Per-phase step templates |
| `troubleshooting_tips` | 16 | Appendix A issue/solution pairs |
| `team_opex` | 4 | Team salary/allocation records |
| `deployment_regions` | 2 | US + Philippines config |
| `network_vlans` | 4 | VLAN architecture reference |
| `isp_bandwidth_requirements` | 5 | Court count → ISP speed minimums |
| `team_contacts` | 7 | Internal PodPlay team directory |
| `monthly_opex_snapshots` | 0 (grows monthly) | Period-based HER data |
| `installers` | 0 (seeded from XLSX) | Installer directory |
