# PodPlay Ops Wizard — Design Document

**Date**: 2026-03-06
**Status**: Approved
**Author**: Claude + clsandoval

## Problem

PodPlay's single ops person manages the entire client onboarding lifecycle — from intake through hardware procurement, 15-phase device configuration, installation, and financial close — using a fragile 24-sheet Google Sheets MRP. The spreadsheet is slow, breaks easily (INDIRECT formulas, DUMMYFUNCTION exports), and the 15-phase deployment process has too many manual steps to track reliably.

## Solution

A wizard-centric webapp that replaces the Google Sheets MRP entirely. Each client deployment is a "project" that progresses through guided phases. The wizard tells the operator exactly what to do next, auto-generates BOMs and cost analysis, and tracks inventory, financials, and deployment checklists — all in one place.

## Target User

Single PodPlay ops person who does everything end-to-end.

## Tech Stack

- **Frontend**: React 19 + Vite + TypeScript (strict) + TanStack Router + Tailwind 4 + shadcn/radix
- **Forms**: React Hook Form + Zod
- **Database**: Supabase (Postgres) with RLS, Supabase Auth
- **Deploy**: Fly.io (nginx + static build, same pattern as inheritance app)
- **No backend server** — Supabase handles auth, DB, RLS. All logic client-side.

## Data Model

### Project (one client deployment)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| brand_name | text | Must be unique, used as display name everywhere |
| company | text | Parent company |
| tier | enum | pro / autonomous / autonomous_plus |
| court_count | int | |
| autonomous_doors | int | 0 if not autonomous |
| security_cameras | int | 0 if not autonomous_plus |
| contacts | jsonb | { owner, delivery, gc_installer } each with name/email/phone |
| ship_to_address | text | |
| go_live_date | date | Target operational date |
| operational_date | date | Actual go-live |
| status | enum | not_started / config_started / ready_to_ship / shipped / installing / qc / completed |
| progress | int | 0-100, derived from checklist completion |
| notes | text | General project notes |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### ProjectBOM (per-project hardware line items)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| project_id | uuid | FK → Project |
| inventory_item_id | uuid | FK → InventoryItem |
| category | text | Network Rack / Replay System / Displays / Kiosks / Access Control / Surveillance / Misc |
| qty_needed | int | Auto-calculated from tier + courts, editable |
| est_unit_cost | decimal | From inventory item |
| est_total_cost | decimal | qty * unit_cost |
| source | enum | stock / drop_ship / n_a |
| status | enum | not_started / ordered / in_progress / in_transit / delivered / installed / complete |
| purchase_date | date | |
| actual_cost | decimal | For variance tracking |
| tracking_number | text | |
| packed | bool | |

### DeploymentChecklist (per-project, seeded from template)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| project_id | uuid | FK → Project |
| phase | int | 0-15 (maps to deployment guide phases) |
| step_number | int | Global step number within phase |
| title | text | Step title |
| description | text | What to do, with auto-filled customer values |
| warnings | text[] | Critical gotchas (red warnings from deployment guide) |
| completed | bool | |
| completed_at | timestamptz | |
| notes | text | Operator notes per step per client |

### Invoice

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| project_id | uuid | FK → Project |
| invoice_number | text | |
| amount | decimal | |
| type | enum | deposit / final |
| signed_date | date | |
| invoice_date | date | |
| payment_date | date | |
| status | enum | draft / sent / paid |

### Expense

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| project_id | uuid | FK → Project |
| category | enum | airfare / car / fuel / lodging / meals / misc_hardware / outbound_shipping / professional_services / taxi / train / parking / other |
| vendor | text | |
| amount | decimal | |
| payment_method | enum | podplay_card / ramp_reimburse |
| receipt_url | text | |
| transaction_date | date | |
| notes | text | |

### InventoryItem (global catalog)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| name | text | e.g. "Network Rack" |
| model | text | e.g. "Strong Contractor Series 12U" |
| category | text | |
| vendor | text | |
| unit_cost | decimal | Current cost |
| qty_on_hand | int | |
| qty_on_order | int | |
| min_stock_level | int | For low stock alerts |
| ship_type | enum | warehouse / drop_ship |
| active | bool | |

### PurchaseOrder (global)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| order_date | date | |
| inventory_item_id | uuid | FK → InventoryItem |
| qty | int | |
| vendor | text | |
| total_cost | decimal | |
| unit_cost | decimal | |
| invoice_url | text | |
| tracking_url | text | |
| status | enum | ordered / received / stocked |
| project_id | uuid | FK → Project (nullable, for project-specific orders) |

### Installer

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| company | text | |
| contact_name | text | |
| email | text | |
| phone | text | |
| city | text | |
| state | text | |
| website | text | |

### BOMTemplate (seeding data)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| tier | enum | pro / autonomous / autonomous_plus |
| inventory_item_id | uuid | FK → InventoryItem |
| qty_per_venue | int | 0 or 1 (per-venue items) |
| qty_per_court | int | 0 or N (per-court items) |
| qty_per_door | int | 0 or N (access control) |
| qty_per_camera | int | 0 or N (surveillance) |

### ChecklistTemplate (seeding data)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| tier | enum | pro / autonomous / autonomous_plus |
| phase | int | 0-15 |
| step_number | int | |
| title | text | |
| description | text | Supports {{CUSTOMER_NAME}} tokens |
| warnings | text[] | |

### Settings (single-row config)

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | PK |
| sales_tax_rate | decimal | Default 10.25% |
| shipping_rate | decimal | Default 10% |
| target_margin | decimal | Default 10% |
| hourly_labor_rate | decimal | Default $120/hr |
| pro_venue_fee | decimal | Default $5,000 |
| pro_court_fee | decimal | Default $2,500 |
| autonomous_venue_fee | decimal | Default $7,500 |
| autonomous_court_fee | decimal | Default $2,500 |
| lodging_per_day | decimal | Default $250 |
| airfare_default | decimal | Default $1,800 |
| hours_per_day | decimal | Default 10 |

## Wizard Flow

### Stage 1: Client Intake (Steps 1-6)
1. Basic Info — brand name, company, email, location, operational date
2. Court Setup — court count, tier selection (Pro/Autonomous/Autonomous+)
3. Autonomous Options — doors, security cameras (conditional on tier)
4. Contacts — owner, delivery, GC/installer (name/email/phone each)
5. Shipping — ship-to address, special instructions
6. Review & Create — summary card, confirm → auto-generates BOM + checklist + cost analysis

### Stage 2: Hardware & Procurement (Steps 7-11)
7. BOM Review — auto-generated, editable, grouped by category with costs
8. Inventory Check — in-stock vs. needs ordering, shortage flags
9. Purchase Orders — create POs for missing items
10. Receiving & Stocking — mark received, auto-update inventory
11. Packing & Shipping — pack checklist, tracking numbers, print BOM manifest

### Stage 3: Configuration & Deployment (Steps 12-26, the 15-phase checklist)
12. Pre-Config (Office) — Mosyle MDM, admin dashboard, hardware verification
13. Unboxing & Labeling — label devices with court numbers
14. Network Rack Assembly — rack order with warnings (UPS battery, Mac Mini heat)
15. Networking (UniFi) — UDM, switch, VLANs, port forwarding with exact values
16. ISP Router — static IP / DMZ / port forward with ISP-specific notes
17. Camera Config — one-at-a-time flow, encoding settings pre-filled
18. DDNS Setup — FreeDNS steps, template cron (auto-fills customer name)
19. Mac Mini Setup — SSD, cache folders, VLAN, symlinks
20. Replay Service — deployment server, security permissions
21. iPad Setup — enrollment order warning, Mosyle, VPP, App Lock schedule
22. Apple TV Setup — enrollment, Mosyle, app config
23. Physical Installation — camera heights (auto-calc from distance), mounts, buttons, access control
24. Testing & Verification — DDNS test URLs auto-generated, replay test, button test
25. Health Monitoring — GCP alerting, endpoint URL pre-filled
26. Packaging & Shipping — BOM count verification, label printing

### Stage 4: Financials & Close-Out (Steps 27-30)
27. Invoicing — two-installment billing, generate/track payment
28. Expenses — log travel/installation expenses
29. P&L Review — per-project profitability (revenue - hardware - labor - travel)
30. Go-Live — set date, mark completed, customer handoff

Steps are non-linear — operator can jump anywhere but sees warnings for incomplete prerequisites. Each deployment step shows contextual warnings from the deployment guide. Template values auto-fill with customer name (e.g., `http://CUSTOMERNAME.podplaydns.com:4000`).

## Global Views

### Dashboard (Home)
- Active projects sorted by status + go-live date
- Each row: brand name, tier, courts, status pill, progress bar, go-live, days remaining
- Filters: by status, by tier
- Top metrics: total clubs, queue count, signed not invoiced, invoiced not paid, total paid

### Inventory
- Stock levels for all ~50 items grouped by category
- Low stock flags, on-order indicators
- Total inventory value
- Quick actions: adjust stock, view movement history

### Purchase Orders
- All POs across projects, filterable by status
- Linked to associated project

### Financials
- Hardware Funnel: cumulative signed → invoiced → paid
- Monthly P&L: revenue - COGS - labor - OpEx = operating profit
- HER: trailing 3-month and 12-month, target >1.0x
- Per-project P&L across all projects
- Reconciliation: cross-check inventory vs. PO totals vs. project costs

### Installers Directory
- Searchable by state/city
- Linked to projects

### Settings
- Pricing tiers, tax/shipping/margin rates
- Travel cost defaults
- Hardware catalog management (add/edit/discontinue)

## Routes

```
/                        → Dashboard
/projects/new            → Wizard Stage 1
/projects/:id            → Project overview (current phase, next action)
/projects/:id/bom        → Stage 2
/projects/:id/deploy     → Stage 3
/projects/:id/financials → Stage 4
/inventory               → Global inventory
/orders                  → Purchase orders
/financials              → Global financial dashboard
/installers              → Contractor directory
/settings                → Pricing, catalog, defaults
```

## BOM Auto-Generation Logic

When a project is created:
1. Query `bom_templates` for the selected tier
2. For each template row: `qty = qty_per_venue + (qty_per_court * court_count) + (qty_per_door * doors) + (qty_per_camera * cameras)`
3. Pull current `unit_cost` from `inventory_items`
4. Calculate: `est_total_cost = qty * unit_cost`
5. Customer pricing: `landed_cost = est_total_cost * (1 + shipping_rate)`, `customer_price = landed_cost / (1 - margin)`
6. Insert all rows into `project_bom`

## Deployment Checklist Seeding

On project creation:
1. Query `checklist_templates` for the selected tier
2. Copy all steps into `deployment_checklist`
3. Replace `{{CUSTOMER_NAME}}` tokens with `brand_name` in descriptions
4. Replace `{{COURT_COUNT}}` with court count where applicable

## Pricing Reference (Seed Data)

| Tier | Venue Fee | Court Fee |
|------|-----------|-----------|
| Pro | $5,000 | $2,500 |
| Autonomous | $7,500 | $2,500 |
| Autonomous+ | $7,500 + surveillance | $2,500 |

## Key Vendor Seed Data

UniFi, Apple Business, Samsung/Ingram, EmpireTech, Flic, Amazon, SnapOne, Kisi, PoE Texas, CTA Digital, Fast Signs, RC Fasteners, HIDEit

## Source Documents

- `docs/Kim Lapus PodPlay MRP.xlsx` — 24-sheet MRP spreadsheet (full operational data)
- `docs/PodPlay_MRP_Usage_Guide.pdf` — 30-page usage guide for the MRP
- `docs/podplay-venue-deployment-guide.pdf` — 25-page deployment guide (15 phases)
- `docs/podplay-hardware-installation-guide.md` — Physical installation reference
