# PodPlay Ops Wizard — Supabase Database Schema

Complete Supabase/Postgres schema for the PodPlay Ops Wizard webapp.
Every `CREATE TABLE` statement, enum, index, RLS policy, and trigger is specified here.

**Source mapping**:
- "Form Responses" → MRP tab where Andy fills in new customer details
- "CUSTOMER MASTER" → MRP tab with one row per project, lifecycle columns
- "Status tabs" → Per-customer MRP tabs tracking deployment phases

---

## Enums

```sql
-- Tier of PodPlay installation
CREATE TYPE service_tier AS ENUM (
  'pro',            -- Display + kiosk + replay camera per court + network rack
  'autonomous',     -- Pro + access control (Kisi) + security cameras (UniFi G5)
  'autonomous_plus',-- Autonomous + NVR (UNVR/UNVR-Pro) with hard drives
  'pbk'             -- Pickleball Kingdom custom pricing tier
);

-- Overall wizard stage / project lifecycle status
CREATE TYPE project_status AS ENUM (
  'intake',         -- Stage 1: intake form in progress or complete
  'procurement',    -- Stage 2: BOM reviewed, POs/inventory in progress
  'deployment',     -- Stage 3: 15-phase deployment checklist active
  'financial_close',-- Stage 4: invoicing, expenses, P&L review
  'completed',      -- All done — final invoice paid, project closed
  'cancelled'       -- Project cancelled at any stage
);

-- Granular deployment sub-status (within Stage 3)
-- Maps to CUSTOMER MASTER "Status" column in MRP
CREATE TYPE deployment_status AS ENUM (
  'not_started',    -- Deployment stage not yet begun
  'config',         -- Hardware being configured in PodPlay office (NJ lab)
  'ready_to_ship',  -- Configured, tested, packed — awaiting shipment
  'shipped',        -- Shipped to venue
  'installing',     -- On-site installation in progress
  'qc',             -- Quality check / end-to-end testing at venue
  'completed'       -- Fully deployed, verified working, ready for handoff
);

-- Revenue pipeline stage (financial tracking)
-- Maps to MRP revenue pipeline / invoicing columns
CREATE TYPE revenue_stage AS ENUM (
  'proposal',         -- SOW sent, not yet signed
  'signed',           -- Contract signed, deposit not yet invoiced
  'deposit_invoiced', -- Deposit invoice sent to customer
  'deposit_paid',     -- Deposit payment received
  'final_invoiced',   -- Final invoice sent (after go-live)
  'final_paid'        -- Final payment received — fully closed
);

-- Installer source: PodPlay-vetted or client's own
CREATE TYPE installer_type AS ENUM (
  'podplay_vetted', -- Installer from PodPlay's vetted network (NY, CT, NJ)
  'client_own'      -- Client's own installer (cheaper, may need remote troubleshooting)
);

-- ISP connection type at venue
CREATE TYPE isp_type AS ENUM (
  'fiber',      -- Fiber (symmetrical preferred)
  'cable',      -- Cable (asymmetric — upload speed is the constraint)
  'dedicated',  -- Dedicated circuit (symmetric)
  'other'       -- DSL, fixed wireless, etc.
);

-- Replay service version
CREATE TYPE replay_service_version AS ENUM (
  'v1', -- Current: deploy.py + VPN, UDP, pixelation known issue
  'v2'  -- Coming April 2026: GitHub deploy, TCP, config via dashboard
);

-- Expense category for project expenses
-- Maps to MRP EXPENSES sheet "Category" column
CREATE TYPE expense_category AS ENUM (
  'airfare',
  'car',
  'fuel',
  'lodging',
  'meals',
  'misc_hardware',
  'outbound_shipping',
  'professional_services',
  'taxi',
  'train',
  'parking',
  'other'
);

-- How an expense was paid
-- Maps to MRP EXPENSES sheet "Payment Method" column
CREATE TYPE payment_method AS ENUM (
  'podplay_card',   -- Company Ramp card
  'ramp_reimburse'  -- Personal card, reimbursed via Ramp
);

-- Invoice status for deposit and final invoices
CREATE TYPE invoice_status AS ENUM (
  'not_sent', -- Invoice not yet generated or sent
  'sent',     -- Invoice sent, awaiting payment
  'paid'      -- Payment received
);

-- BOM item category for UI grouping and filtering
CREATE TYPE bom_category AS ENUM (
  'network_rack',    -- UDM, switch, PDU, patch panel, SFP, patch cables
  'replay_system',   -- Mac Mini, SSD, replay cameras, junction boxes, Flic buttons
  'displays',        -- Apple TV, HDMI cable, mount, iPad, PoE adapter, kiosk case
  'access_control',  -- Kisi controller and readers
  'surveillance',    -- NVR, hard drives, security cameras, junction boxes
  'front_desk',      -- CC terminal, QR scanner, webcam
  'cabling',         -- Cat6 bulk cable, conduit, hardware kit, fasteners
  'signage',         -- Aluminum printed signs, labels
  'infrastructure',  -- UPS, rack enclosure, rack shelf, rack accessories
  'pingpod_specific' -- WiFi AP (UniFi U6-Plus) for PingPod venues only
);

-- Inventory movement type
CREATE TYPE inventory_movement_type AS ENUM (
  'purchase_order_received', -- Items received from vendor PO
  'project_allocated',       -- Items allocated to a specific project
  'project_shipped',         -- Items shipped to project venue
  'adjustment_increase',     -- Manual positive stock adjustment
  'adjustment_decrease',     -- Manual negative stock adjustment
  'return'                   -- Items returned to stock from project
);

-- Replay sign fulfillment status
-- Maps to MRP "Customer Replay Signs" sheet lifecycle columns
CREATE TYPE sign_status AS ENUM (
  'staged',    -- Signs queued for order
  'shipped',   -- Signs shipped to venue
  'delivered', -- Signs received at venue
  'installed'  -- Signs physically installed on courts
);

-- CC terminal (BBPOS WisePOS E) order status
-- Maps to MRP "CC Form" sheet
CREATE TYPE cc_terminal_status AS ENUM (
  'not_ordered',
  'ordered',
  'delivered',
  'installed'
);
```

---

## Table: projects

Central entity. One row per customer installation project.

**MRP source**:
- Customer name, venue, contact, tier, court count → "Form Responses" tab
- Status, revenue stage, installer, go-live date → "CUSTOMER MASTER" tab
- Deployment sub-status → per-customer "Status" tabs
- DDNS subdomain, UniFi name, Mac Mini credentials → "MASTER ACCOUNTS" tab

```sql
CREATE TABLE projects (
  -- Primary key
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- -------------------------------------------------------------------------
  -- Customer & Venue Info (from Form Responses tab)
  -- -------------------------------------------------------------------------
  customer_name               TEXT        NOT NULL,
  -- Business/club name (e.g., "Telepark Pickleball Club")

  venue_name                  TEXT        NOT NULL,
  -- Location name for multi-venue clients; same as customer_name for single-venue
  -- (e.g., "Telepark - Jersey City")

  venue_address_line1         TEXT,
  venue_address_line2         TEXT,
  venue_city                  TEXT        NOT NULL DEFAULT '',
  venue_state                 TEXT        NOT NULL DEFAULT '',
  venue_country               TEXT        NOT NULL DEFAULT 'US',
  -- 'US' or 'PH' (Philippines) — affects ISP requirements and power specs
  venue_zip                   TEXT,

  contact_name                TEXT        NOT NULL DEFAULT '',
  -- Primary contact at venue (owner or ops manager)

  contact_email               TEXT        NOT NULL DEFAULT '',
  contact_phone               TEXT,

  -- -------------------------------------------------------------------------
  -- Project Parameters (set at intake, drive BOM generation)
  -- -------------------------------------------------------------------------
  tier                        service_tier NOT NULL,
  -- Determines which BOM template is used and base pricing

  court_count                 INTEGER     NOT NULL DEFAULT 1
                              CHECK (court_count >= 1 AND court_count <= 50),
  -- Number of pickleball courts; drives per-court BOM items

  door_count                  INTEGER     NOT NULL DEFAULT 0
                              CHECK (door_count >= 0),
  -- Number of access-controlled doors; Autonomous/Autonomous+ only
  -- Drives per-door BOM items (Kisi reader per door)

  security_camera_count       INTEGER     NOT NULL DEFAULT 0
                              CHECK (security_camera_count >= 0),
  -- Number of surveillance security cameras; Autonomous+ only
  -- Drives per-camera BOM items (NVR, junction boxes)

  replay_sign_count           INTEGER     GENERATED ALWAYS AS (court_count * 2) STORED,
  -- 2 replay signs per court (auto-computed); drives replay sign fulfillment order

  has_nvr                     BOOLEAN     NOT NULL DEFAULT false,
  -- True for Autonomous+ tier (NVR + hard drives ordered)
  -- Derived: tier = 'autonomous_plus', but stored explicitly for clarity

  has_pingpod_wifi            BOOLEAN     NOT NULL DEFAULT false,
  -- True for PingPod venues requiring UniFi U6-Plus WiFi AP

  has_front_desk              BOOLEAN     NOT NULL DEFAULT false,
  -- True if venue needs front desk equipment (webcam, QR scanner, CC terminal)

  -- -------------------------------------------------------------------------
  -- ISP & Networking (from intake form / Phase 0 checklist)
  -- -------------------------------------------------------------------------
  isp_provider                TEXT,
  -- Vendor name (e.g., "Verizon", "Optimum", "Spectrum", "Google Fiber", "PLDT", "Globe")

  isp_type                    isp_type,
  -- fiber | cable | dedicated | other

  has_static_ip               BOOLEAN     DEFAULT false,
  -- True if ISP provides static IP ($10–$20/month extra)
  -- Static IP preferred; DMZ second; port forward last resort

  has_backup_isp              BOOLEAN     DEFAULT false,
  -- Autonomous 24/7 venues require dual ISP backbone

  internet_download_mbps      INTEGER,
  internet_upload_mbps        INTEGER,
  -- Actual or committed speeds from ISP; validated against court_count thresholds:
  -- 1–4 courts: 50/100 fiber, 60 upload cable, 30/30 dedicated
  -- 5–11 courts: 150/150 fiber, highest cable, 50/50 dedicated
  -- 12–19 courts: 200/200 fiber, 50/50 dedicated
  -- 20–24 courts: 300/300 fiber, 100/100 dedicated
  -- 25+ courts: 400/400 fiber, 150/150 dedicated

  starlink_warning_acknowledged BOOLEAN   DEFAULT false,
  -- Must be true before project can proceed if isp_provider = 'Starlink'
  -- WARNING: Starlink uses CGNAT which blocks port 4000 — NOT compatible

  rack_size_u                 INTEGER,
  -- Rack size in U (7–12U depending on court count and tier)

  -- -------------------------------------------------------------------------
  -- Deployment Infrastructure (from MASTER ACCOUNTS tab)
  -- -------------------------------------------------------------------------
  ddns_subdomain              TEXT,
  -- FreeDNS subdomain under podplaydns.com (e.g., 'telepark')
  -- Full URL: http://{ddns_subdomain}.podplaydns.com:4000
  -- Constraints: lowercase, no spaces, no special chars, unique

  unifi_site_name             TEXT,
  -- UniFi network site name: format PL-{CUSTOMERNAME} (e.g., 'PL-TELEPARK')

  mac_mini_username           TEXT,
  -- macOS login username on the replay server Mac Mini

  mac_mini_password           TEXT,
  -- macOS login password; stored in plain text per MRP convention
  -- NOTE: future hardening should encrypt or move to secrets vault (1Password)

  replay_api_url              TEXT,
  -- Auto-derived: http://{ddns_subdomain}.podplaydns.com:4000
  -- Stored for quick reference; regenerated when ddns_subdomain changes

  replay_local_url            TEXT        DEFAULT 'http://192.168.32.100:4000',
  -- Always static: Mac Mini fixed IP on REPLAY VLAN

  replay_service_version      replay_service_version NOT NULL DEFAULT 'v1',
  -- v1: deploy.py + VPN + UDP (current)
  -- v2: GitHub + TCP + dashboard config (coming April 2026)

  -- -------------------------------------------------------------------------
  -- Lifecycle Status (from CUSTOMER MASTER tab)
  -- -------------------------------------------------------------------------
  project_status              project_status NOT NULL DEFAULT 'intake',
  -- Overall wizard stage

  deployment_status           deployment_status NOT NULL DEFAULT 'not_started',
  -- Sub-status within Stage 3; only meaningful when project_status = 'deployment'

  revenue_stage               revenue_stage NOT NULL DEFAULT 'proposal',
  -- Financial pipeline stage; updated as invoices are sent/paid

  -- -------------------------------------------------------------------------
  -- Dates (from CUSTOMER MASTER tab)
  -- -------------------------------------------------------------------------
  kickoff_call_date           DATE,
  -- Date of initial call with Andy Korzeniacki (917-937-6896)

  signed_date                 DATE,
  -- Date customer signed SOW/contract; triggers deposit_invoiced stage

  installation_start_date     DATE,
  installation_end_date       DATE,
  -- On-site installation window dates

  go_live_date                DATE,
  -- Date venue went live (replay working, app active); triggers final invoice

  -- -------------------------------------------------------------------------
  -- Installation (from CUSTOMER MASTER tab)
  -- -------------------------------------------------------------------------
  installer_id                UUID        REFERENCES installers(id) ON DELETE SET NULL,
  -- Which installer was assigned; NULL if TBD or self-installed

  installer_type              installer_type,
  -- podplay_vetted | client_own

  installer_hours             NUMERIC(10, 2) NOT NULL DEFAULT 0,
  -- Actual hours worked; feeds labor cost calculation
  -- labor_cost = installer_hours × settings.labor_rate_per_hour

  -- -------------------------------------------------------------------------
  -- Notes
  -- -------------------------------------------------------------------------
  notes                       TEXT,
  -- Customer-facing notes; included in SOW or handoff docs

  internal_notes              TEXT
  -- Internal ops notes; not shared with customer
);

-- Auto-update updated_at on any row modification
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX idx_projects_project_status  ON projects (project_status);
CREATE INDEX idx_projects_revenue_stage   ON projects (revenue_stage);
CREATE INDEX idx_projects_deployment_status ON projects (deployment_status);
CREATE INDEX idx_projects_tier            ON projects (tier);
CREATE INDEX idx_projects_created_at      ON projects (created_at DESC);
CREATE INDEX idx_projects_customer_name   ON projects (customer_name);

-- Unique constraint on DDNS subdomain (one subdomain per venue)
CREATE UNIQUE INDEX idx_projects_ddns_subdomain ON projects (ddns_subdomain)
  WHERE ddns_subdomain IS NOT NULL;

-- RLS Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Phase 1: Single authenticated user (sole ops person) sees all projects.
-- Phase 2 (future): org_id column added; policy scoped to user's org.
CREATE POLICY "authenticated users can read projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "authenticated users can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "authenticated users can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated users can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (true);
```

### Field Source Map

| Field | MRP Source Sheet | MRP Column / Notes |
|-------|-----------------|-------------------|
| customer_name | Form Responses | "Customer / Club Name" |
| venue_name | Form Responses | "Venue / Location Name" |
| venue_address_* | Form Responses | "Venue Address" (parsed) |
| contact_name | Form Responses | "Primary Contact Name" |
| contact_email | Form Responses | "Primary Contact Email" |
| contact_phone | Form Responses | "Primary Contact Phone" |
| tier | Form Responses | "Service Tier" dropdown |
| court_count | Form Responses | "Number of Courts" |
| door_count | Form Responses | "Number of Doors" |
| security_camera_count | Form Responses | "Number of Security Cameras" |
| has_front_desk | Form Responses | "Front Desk Equipment?" checkbox |
| isp_provider | Form Responses | "ISP Provider" |
| isp_type | Form Responses | "Connection Type" dropdown |
| has_static_ip | Form Responses | "Static IP Available?" |
| internet_download_mbps | Form Responses | "Download Speed (Mbps)" |
| internet_upload_mbps | Form Responses | "Upload Speed (Mbps)" |
| kickoff_call_date | CUSTOMER MASTER | "Kickoff Call Date" |
| signed_date | CUSTOMER MASTER | "Signed Date" |
| go_live_date | CUSTOMER MASTER | "Go-Live Date" |
| project_status | CUSTOMER MASTER | Derived from wizard stage |
| deployment_status | CUSTOMER MASTER | "Status" column |
| revenue_stage | CUSTOMER MASTER | Derived from invoicing columns |
| installer_id | CUSTOMER MASTER | "Installer" (name linked to installer directory) |
| installer_type | CUSTOMER MASTER | "Installer Type" |
| installer_hours | CUSTOMER MASTER | "Installer Hours" |
| ddns_subdomain | MASTER ACCOUNTS | "DDNS Subdomain" |
| unifi_site_name | MASTER ACCOUNTS | "UniFi Site Name" |
| mac_mini_username | MASTER ACCOUNTS | "Mac Mini Username" |
| mac_mini_password | MASTER ACCOUNTS | "Mac Mini Password" |

---

## Table: installers

Installer directory. PodPlay maintains a vetted network in NY, CT, NJ.

**MRP source**: Installer directory tab (sheet name unknown; referenced in CUSTOMER MASTER)

```sql
CREATE TABLE installers (
  id           UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  name         TEXT  NOT NULL,          -- Full name (e.g., "John Smith")
  company      TEXT,                    -- Company name if a contractor business
  email        TEXT,                    -- Contact email
  phone        TEXT,                    -- Contact phone
  regions      TEXT[],                  -- Service regions (e.g., ['NY', 'NJ', 'CT'])
  is_active    BOOLEAN NOT NULL DEFAULT true,
  notes        TEXT
);

CREATE TRIGGER installers_updated_at
  BEFORE UPDATE ON installers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_installers_is_active ON installers (is_active);

ALTER TABLE installers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access installers"
  ON installers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## Table: settings

Global configurable values. Single row (id = 'default').
All pricing defaults, rates, and thresholds live here.

**MRP source**: Settings tab (exact sheet name unknown); pricing tiers from COST ANALYSIS tab.

```sql
CREATE TABLE settings (
  id                          TEXT        PRIMARY KEY DEFAULT 'default',
  -- Always 'default'; single-row table for global settings

  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- -------------------------------------------------------------------------
  -- Pricing: Service Tier Fees
  -- -------------------------------------------------------------------------
  pro_venue_fee               NUMERIC(10, 2) NOT NULL DEFAULT 5000.00,
  -- Customer-facing venue fee for Pro tier

  pro_court_fee               NUMERIC(10, 2) NOT NULL DEFAULT 2500.00,
  -- Customer-facing per-court fee for Pro tier

  autonomous_venue_fee        NUMERIC(10, 2) NOT NULL DEFAULT 7500.00,
  -- Customer-facing venue fee for Autonomous and Autonomous+ tiers

  autonomous_court_fee        NUMERIC(10, 2) NOT NULL DEFAULT 2500.00,
  -- Customer-facing per-court fee for Autonomous and Autonomous+ tiers

  pbk_venue_fee               NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  -- Pickleball Kingdom custom venue fee (exact value requires PBK contract)

  pbk_court_fee               NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  -- Pickleball Kingdom custom per-court fee (exact value requires PBK contract)

  -- -------------------------------------------------------------------------
  -- Cost Chain Multipliers
  -- -------------------------------------------------------------------------
  sales_tax_rate              NUMERIC(6, 4) NOT NULL DEFAULT 0.1025,
  -- 10.25% sales tax applied to invoice total at billing time

  shipping_rate               NUMERIC(6, 4) NOT NULL DEFAULT 0.10,
  -- 10% applied to est_total_cost → landed_cost
  -- landed_cost = est_total_cost × (1 + shipping_rate)

  target_margin               NUMERIC(6, 4) NOT NULL DEFAULT 0.10,
  -- 10% margin applied to landed_cost → customer hardware price
  -- customer_price = landed_cost / (1 - target_margin)

  -- -------------------------------------------------------------------------
  -- Labor
  -- -------------------------------------------------------------------------
  labor_rate_per_hour         NUMERIC(10, 2) NOT NULL DEFAULT 120.00,
  -- Hourly rate for installation labor
  -- labor_cost = installer_hours × labor_rate_per_hour

  hours_per_day               INTEGER     NOT NULL DEFAULT 10,
  -- Standard installer working hours per day (for scheduling estimates)

  -- -------------------------------------------------------------------------
  -- Travel Defaults (pre-populated on new expense entries)
  -- -------------------------------------------------------------------------
  lodging_per_day             NUMERIC(10, 2) NOT NULL DEFAULT 250.00,
  -- Default lodging cost per night

  airfare_default             NUMERIC(10, 2) NOT NULL DEFAULT 1800.00,
  -- Default round-trip airfare estimate

  -- -------------------------------------------------------------------------
  -- Financial Reporting
  -- -------------------------------------------------------------------------
  -- Team OpEx allocations for HER (Hardware Efficiency Ratio) calculation:
  -- HER = hardware_revenue / team_hardware_spend
  -- team_hardware_spend = direct salaries + allocated indirect overhead

  niko_annual_salary          NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  -- Niko's annual salary; 50% allocated to direct hardware work
  -- (50% direct / 50% indirect per frontier model-team-opex)

  niko_direct_allocation      NUMERIC(6, 4) NOT NULL DEFAULT 0.50,
  -- Fraction of Niko's time allocated to direct hardware/installs

  chad_annual_salary          NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  -- Chad's annual salary; 20% allocated to indirect hardware overhead

  chad_indirect_allocation    NUMERIC(6, 4) NOT NULL DEFAULT 0.20,
  -- Fraction of Chad's time allocated to indirect hardware overhead

  annual_rent                 NUMERIC(10, 2) NOT NULL DEFAULT 27600.00,
  -- Annual rent for NJ lab / office space ($27,600/year)

  annual_indirect_salaries    NUMERIC(10, 2) NOT NULL DEFAULT 147000.00,
  -- Total indirect salary pool (non-hardware staff) ($147,000/year)

  CONSTRAINT settings_single_row CHECK (id = 'default')
);

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access settings"
  ON settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## Table: hardware_catalog

Master list of all hardware items. Populated from seed data.
Used as source for BOM templates and inventory tracking.

**MRP source**: Hardware BOM sheet / COST ANALYSIS catalog section

```sql
CREATE TABLE hardware_catalog (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  sku             TEXT        NOT NULL UNIQUE,
  -- Internal SKU for referencing in BOM templates and inventory
  -- Naming: CATEGORY-SHORTNAME (e.g., 'NET-UDM-SE', 'REPLAY-MACMINI')

  name            TEXT        NOT NULL,
  -- Display name (e.g., "Mac Mini 16GB 256GB")

  model           TEXT,
  -- Manufacturer model number (e.g., "USW-Pro-24-POE", "IPC-T54IR-ZE")

  vendor          TEXT        NOT NULL,
  -- Primary vendor name (e.g., "UniFi", "Amazon", "Apple Business", "EmpireTech")

  vendor_url      TEXT,
  -- Direct order URL or vendor product page

  unit_cost       NUMERIC(10, 2),
  -- Purchase cost in USD (NULL = unknown, requires XLSX data)
  -- Source: COST ANALYSIS sheet "Unit Cost" column in MRP

  category        bom_category NOT NULL,
  -- For UI grouping and BOM template filtering

  notes           TEXT,
  -- Additional notes (e.g., "PingPod venues only", "Autonomous+ only")

  is_active       BOOLEAN     NOT NULL DEFAULT true
  -- Soft-delete; inactive items remain in historical BOMs but not selectable
);

CREATE TRIGGER hardware_catalog_updated_at
  BEFORE UPDATE ON hardware_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_hardware_catalog_category ON hardware_catalog (category);
CREATE INDEX idx_hardware_catalog_vendor    ON hardware_catalog (vendor);
CREATE INDEX idx_hardware_catalog_sku       ON hardware_catalog (sku);

ALTER TABLE hardware_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access hardware_catalog"
  ON hardware_catalog FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## Table: bom_templates

Per-tier BOM template. Defines which hardware items appear in a BOM and
their quantity formula multipliers. One row per (tier, hardware_catalog_id) pair.

**MRP source**: BOM template sheet (one template per tier in MRP)

```sql
CREATE TABLE bom_templates (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  tier                service_tier NOT NULL,
  -- Which tier this template row applies to

  hardware_catalog_id UUID        NOT NULL REFERENCES hardware_catalog(id) ON DELETE CASCADE,
  -- The hardware item

  qty_per_venue       INTEGER     NOT NULL DEFAULT 0,
  -- Flat quantity added once per installation regardless of court/door/camera count
  -- Examples: Mac Mini (1), UDM (1), Switch (varies), PDU (1), UPS (1)

  qty_per_court       INTEGER     NOT NULL DEFAULT 0,
  -- Multiplied by project.court_count
  -- Examples: iPad (1), Apple TV (1), Replay Camera (1), Flic Button (2)

  qty_per_door        INTEGER     NOT NULL DEFAULT 0,
  -- Multiplied by project.door_count (Autonomous/Autonomous+ only)
  -- Examples: Kisi Reader Pro 2 (1 per door)

  qty_per_camera      INTEGER     NOT NULL DEFAULT 0,
  -- Multiplied by project.security_camera_count (Autonomous+ only)
  -- Examples: Security Camera Junction Box (1 per camera)

  sort_order          INTEGER     NOT NULL DEFAULT 0,
  -- Display order within category in BOM view

  UNIQUE (tier, hardware_catalog_id)
);

-- Final quantity formula (computed client-side when generating BOM):
-- qty = qty_per_venue
--     + (qty_per_court × project.court_count)
--     + (qty_per_door × project.door_count)
--     + (qty_per_camera × project.security_camera_count)

CREATE INDEX idx_bom_templates_tier ON bom_templates (tier);
CREATE INDEX idx_bom_templates_item ON bom_templates (hardware_catalog_id);

ALTER TABLE bom_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access bom_templates"
  ON bom_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## Table: project_bom_items

Materialized BOM for a specific project. Generated from bom_templates on
project creation (or BOM regeneration). Stores computed quantities and actual costs.

**MRP source**: Per-customer BOM tab; COST ANALYSIS sheet columns

```sql
CREATE TABLE project_bom_items (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  project_id          UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  hardware_catalog_id UUID        NOT NULL REFERENCES hardware_catalog(id),

  -- Computed quantity (from formula at time of BOM generation)
  qty                 INTEGER     NOT NULL DEFAULT 0,

  -- Cost chain (all in USD)
  unit_cost           NUMERIC(10, 2),
  -- Copied from hardware_catalog.unit_cost at BOM generation time
  -- Editable per-project to reflect actual PO costs

  est_total_cost      NUMERIC(10, 2) GENERATED ALWAYS AS (
    CASE WHEN unit_cost IS NOT NULL THEN qty * unit_cost ELSE NULL END
  ) STORED,
  -- est_total_cost = qty × unit_cost

  shipping_rate       NUMERIC(6, 4),
  -- Copied from settings.shipping_rate at BOM generation; overridable

  landed_cost         NUMERIC(10, 2) GENERATED ALWAYS AS (
    CASE WHEN unit_cost IS NOT NULL THEN
      qty * unit_cost * (1 + COALESCE(shipping_rate, 0.10))
    ELSE NULL END
  ) STORED,
  -- landed_cost = est_total_cost × (1 + shipping_rate)

  margin              NUMERIC(6, 4),
  -- Copied from settings.target_margin; overridable per line item

  customer_price      NUMERIC(10, 2) GENERATED ALWAYS AS (
    CASE WHEN unit_cost IS NOT NULL AND margin IS NOT NULL AND margin < 1.0 THEN
      (qty * unit_cost * (1 + COALESCE(shipping_rate, 0.10))) / (1 - margin)
    ELSE NULL END
  ) STORED,
  -- customer_price = landed_cost / (1 - margin)

  -- Inventory state for this BOM line
  allocated           BOOLEAN     NOT NULL DEFAULT false,
  -- True when inventory has been reserved for this project

  shipped             BOOLEAN     NOT NULL DEFAULT false,
  -- True when items have shipped to the venue

  notes               TEXT,
  -- Per-line notes (e.g., "substitute part", "backordered")

  UNIQUE (project_id, hardware_catalog_id)
);

CREATE TRIGGER project_bom_items_updated_at
  BEFORE UPDATE ON project_bom_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_project_bom_items_project ON project_bom_items (project_id);
CREATE INDEX idx_project_bom_items_item    ON project_bom_items (hardware_catalog_id);

ALTER TABLE project_bom_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access project_bom_items"
  ON project_bom_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## Table: inventory

Current stock levels for hardware items. One row per hardware_catalog item.

**MRP source**: INVENTORY sheet — "Stock Level", "On Hand", "Allocated", "Available" columns

```sql
CREATE TABLE inventory (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  hardware_catalog_id UUID        NOT NULL UNIQUE REFERENCES hardware_catalog(id),

  qty_on_hand         INTEGER     NOT NULL DEFAULT 0,
  -- Total units physically in the NJ lab / warehouse

  qty_allocated       INTEGER     NOT NULL DEFAULT 0,
  -- Units reserved for active projects (allocated but not yet shipped)

  qty_available       INTEGER     GENERATED ALWAYS AS (qty_on_hand - qty_allocated) STORED,
  -- Available for new projects: qty_on_hand - qty_allocated

  reorder_threshold   INTEGER     NOT NULL DEFAULT 0,
  -- Low stock alert fires when qty_available <= reorder_threshold

  notes               TEXT
);

CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access inventory"
  ON inventory FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## Table: inventory_movements

Audit log of every stock change. Enables reconciliation.

**MRP source**: INVENTORY sheet movement rows (PO received, shipped, adjusted)

```sql
CREATE TABLE inventory_movements (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  hardware_catalog_id UUID        NOT NULL REFERENCES hardware_catalog(id),
  project_id          UUID        REFERENCES projects(id) ON DELETE SET NULL,
  -- NULL for non-project movements (PO received, adjustments)

  movement_type       inventory_movement_type NOT NULL,

  qty_delta           INTEGER     NOT NULL,
  -- Positive = increase, Negative = decrease

  reference           TEXT,
  -- PO number, shipment tracking number, or note

  notes               TEXT
);

CREATE INDEX idx_inventory_movements_item    ON inventory_movements (hardware_catalog_id);
CREATE INDEX idx_inventory_movements_project ON inventory_movements (project_id);
CREATE INDEX idx_inventory_movements_created ON inventory_movements (created_at DESC);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access inventory_movements"
  ON inventory_movements FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## Table: purchase_orders

PO tracking. One PO per vendor order.

**MRP source**: ORDER INPUT sheet — vendor, date, items, total cost

```sql
CREATE TABLE purchase_orders (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  po_number       TEXT        NOT NULL UNIQUE,
  -- Internal PO number (e.g., "PO-2026-001")

  vendor          TEXT        NOT NULL,
  project_id      UUID        REFERENCES projects(id) ON DELETE SET NULL,
  -- If project-specific PO; NULL for stock replenishment

  order_date      DATE        NOT NULL,
  expected_date   DATE,
  received_date   DATE,

  total_cost      NUMERIC(10, 2),
  -- Sum of all PO line items

  status          TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'ordered', 'partial', 'received', 'cancelled')),

  tracking_number TEXT,
  notes           TEXT
);

CREATE TRIGGER purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_purchase_orders_project ON purchase_orders (project_id);
CREATE INDEX idx_purchase_orders_status  ON purchase_orders (status);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access purchase_orders"
  ON purchase_orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## Table: purchase_order_items

Line items within a PO.

```sql
CREATE TABLE purchase_order_items (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id   UUID        NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  hardware_catalog_id UUID        NOT NULL REFERENCES hardware_catalog(id),

  qty_ordered         INTEGER     NOT NULL,
  qty_received        INTEGER     NOT NULL DEFAULT 0,
  unit_cost           NUMERIC(10, 2) NOT NULL,
  line_total          NUMERIC(10, 2) GENERATED ALWAYS AS (qty_ordered * unit_cost) STORED,
  notes               TEXT
);

CREATE INDEX idx_po_items_po   ON purchase_order_items (purchase_order_id);
CREATE INDEX idx_po_items_item ON purchase_order_items (hardware_catalog_id);

ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access purchase_order_items"
  ON purchase_order_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## Table: deployment_checklist_templates

Seed data for deployment phases. 16 phases (0–15), each with ordered steps.
Stored as templates; instantiated into deployment_checklist_items on project creation.

**MRP source**: Deployment checklist tabs; Venue Deployment Guide phases 0–15

```sql
CREATE TABLE deployment_checklist_templates (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),

  phase           INTEGER NOT NULL CHECK (phase >= 0 AND phase <= 15),
  -- Phase 0: Pre-Purchase & Planning
  -- Phase 1: Pre-Configuration (PodPlay Office)
  -- Phase 2: Unboxing & Labeling
  -- Phase 3: Network Rack Assembly
  -- Phase 4: Networking Setup (UniFi)
  -- Phase 5: ISP Router Configuration
  -- Phase 6: DDNS Setup (FreeDNS)
  -- Phase 7: Camera Configuration
  -- Phase 8: iPad Setup
  -- Phase 9: Apple TV Setup
  -- Phase 10: Mac Mini Setup
  -- Phase 11: Replay Service Deployment
  -- Phase 12: Testing & Verification
  -- Phase 13: Packing & Shipping
  -- Phase 14: On-Site Installation
  -- Phase 15: Go-Live & Handoff

  phase_name      TEXT    NOT NULL,
  -- Human-readable phase name (e.g., "Phase 4: Networking Setup (UniFi)")

  step_number     INTEGER NOT NULL,
  -- Step number within phase (1-based, sequential within phase)

  title           TEXT    NOT NULL,
  -- Short action title (e.g., "Create REPLAY VLAN")

  description     TEXT    NOT NULL,
  -- Full step instructions; may include tokens {{CUSTOMER_NAME}}, {{COURT_COUNT}},
  -- {{DDNS_SUBDOMAIN}}, {{UNIFI_SITE_NAME}}, {{MAC_MINI_USERNAME}}

  warnings        TEXT[],
  -- Critical red-box warnings shown before step can be checked off
  -- Example: 'WARNING: Starlink is NOT compatible — CGNAT blocks port 4000'
  -- Example: 'Configure ONE camera at a time — all default to 192.168.1.108'

  auto_fill_tokens TEXT[],
  -- Which tokens this step auto-fills from project data (for display/validation)
  -- Example: ['CUSTOMER_NAME', 'DDNS_SUBDOMAIN']

  applicable_tiers service_tier[],
  -- Which tiers this step applies to; NULL means all tiers
  -- Example: Kisi steps only apply to ['autonomous', 'autonomous_plus', 'pbk']
  -- Example: NVR steps only apply to ['autonomous_plus']

  is_v2_only      BOOLEAN NOT NULL DEFAULT false,
  -- True if step only applies when replay_service_version = 'v2'

  sort_order      INTEGER NOT NULL,
  -- Global sort order for non-linear navigation (phase × 100 + step_number)

  UNIQUE (phase, step_number)
);

CREATE INDEX idx_checklist_templates_phase ON deployment_checklist_templates (phase);

ALTER TABLE deployment_checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users read checklist_templates"
  ON deployment_checklist_templates FOR SELECT
  TO authenticated
  USING (true);
```

---

## Table: deployment_checklist_items

Per-project checklist. Instantiated from templates when project enters Stage 3.
Tokens in description/warnings are replaced with actual project values.

**MRP source**: Per-customer status tab in MRP; each row = one checkbox

```sql
CREATE TABLE deployment_checklist_items (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  project_id      UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  template_id     UUID        NOT NULL REFERENCES deployment_checklist_templates(id),

  phase           INTEGER     NOT NULL,
  step_number     INTEGER     NOT NULL,
  sort_order      INTEGER     NOT NULL,

  title           TEXT        NOT NULL,
  -- Copied from template (no tokens)

  description     TEXT        NOT NULL,
  -- Copied from template with tokens replaced by project values

  warnings        TEXT[],
  -- Copied from template

  is_completed    BOOLEAN     NOT NULL DEFAULT false,
  completed_at    TIMESTAMPTZ,
  -- Timestamp when checked off

  notes           TEXT,
  -- Free-form notes added by ops person during this step

  UNIQUE (project_id, template_id)
);

CREATE TRIGGER deployment_checklist_items_updated_at
  BEFORE UPDATE ON deployment_checklist_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_checklist_items_project ON deployment_checklist_items (project_id);
CREATE INDEX idx_checklist_items_phase   ON deployment_checklist_items (project_id, phase);

ALTER TABLE deployment_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access deployment_checklist_items"
  ON deployment_checklist_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## Table: invoices

Two invoices per project: deposit and final.

**MRP source**: INVOICING sheet — invoice number, amount, date sent, date paid

```sql
CREATE TABLE invoices (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  project_id      UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  invoice_type    TEXT        NOT NULL CHECK (invoice_type IN ('deposit', 'final')),
  -- 'deposit': sent after contract signing (~50% of total)
  -- 'final': sent after go-live

  invoice_number  TEXT,
  -- External invoice number (from billing system, e.g., QuickBooks/Stripe)

  -- Amounts
  hardware_subtotal  NUMERIC(10, 2),
  -- Sum of customer_price across all BOM items

  service_fee        NUMERIC(10, 2),
  -- Tier venue fee + (court_count × tier court fee)
  -- Pro: 5000 + (courts × 2500); Autonomous/Autonomous+: 7500 + (courts × 2500)

  subtotal           NUMERIC(10, 2) GENERATED ALWAYS AS (
    COALESCE(hardware_subtotal, 0) + COALESCE(service_fee, 0)
  ) STORED,

  tax_rate           NUMERIC(6, 4),
  -- Copied from settings.sales_tax_rate at invoice creation; 10.25% default

  tax_amount         NUMERIC(10, 2) GENERATED ALWAYS AS (
    (COALESCE(hardware_subtotal, 0) + COALESCE(service_fee, 0))
    * COALESCE(tax_rate, 0.1025)
  ) STORED,

  total_amount       NUMERIC(10, 2) GENERATED ALWAYS AS (
    (COALESCE(hardware_subtotal, 0) + COALESCE(service_fee, 0))
    * (1 + COALESCE(tax_rate, 0.1025))
  ) STORED,

  deposit_pct        NUMERIC(6, 4) DEFAULT 0.50,
  -- Fraction of total billed on this invoice (0.50 = 50%)
  -- Deposit invoice: deposit_pct = 0.50; Final: 1 - deposit_pct of remaining

  -- Status
  status             invoice_status NOT NULL DEFAULT 'not_sent',
  date_sent          DATE,
  date_paid          DATE,

  notes              TEXT,

  UNIQUE (project_id, invoice_type)
);

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_invoices_project ON invoices (project_id);
CREATE INDEX idx_invoices_status  ON invoices (status);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## Table: expenses

All project expenses tracked per category.

**MRP source**: EXPENSES sheet — date, project, category, amount, payment method, notes

```sql
CREATE TABLE expenses (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  project_id      UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  expense_date    DATE        NOT NULL,
  category        expense_category NOT NULL,
  amount          NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  payment_method  payment_method NOT NULL,

  description     TEXT,
  -- What the expense was for (e.g., "Delta ATL-EWR round trip", "Marriott 3 nights")

  receipt_url     TEXT,
  -- URL to receipt image (Supabase Storage or external)

  notes           TEXT
);

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_expenses_project  ON expenses (project_id);
CREATE INDEX idx_expenses_category ON expenses (category);
CREATE INDEX idx_expenses_date     ON expenses (expense_date DESC);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access expenses"
  ON expenses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## Table: replay_signs

Replay sign fulfillment tracking per project.
Two signs per court ordered, tracked through fulfillment lifecycle.

**MRP source**: "Customer Replay Signs" sheet — customer, qty, outreach status, shipping, install

```sql
CREATE TABLE replay_signs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  project_id      UUID        NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  -- One row per project; qty derived from project.replay_sign_count

  qty             INTEGER     NOT NULL,
  -- Copied from project.replay_sign_count at creation (court_count × 2)

  status          sign_status NOT NULL DEFAULT 'staged',

  outreach_channel TEXT,
  -- How the order was communicated: 'slack' | 'email' | 'other'

  outreach_date   DATE,
  -- When PodPlay ops contacted vendor (Fast Signs)

  shipped_date    DATE,
  delivered_date  DATE,
  installed_date  DATE,

  tracking_number TEXT,
  vendor_order_id TEXT,
  -- Fast Signs order reference

  notes           TEXT
);

CREATE TRIGGER replay_signs_updated_at
  BEFORE UPDATE ON replay_signs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE replay_signs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access replay_signs"
  ON replay_signs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## Table: cc_terminals

BBPOS WisePOS E terminal ordering and delivery tracking per project.

**MRP source**: "CC Form" sheet — customer, terminal count, ordered date, delivered date, status

```sql
CREATE TABLE cc_terminals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  project_id      UUID        NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,

  qty             INTEGER     NOT NULL DEFAULT 1,
  -- Number of BBPOS WisePOS E terminals ordered

  status          cc_terminal_status NOT NULL DEFAULT 'not_ordered',

  order_date      DATE,
  expected_date   DATE,
  delivered_date  DATE,
  installed_date  DATE,

  square_order_id TEXT,
  -- Square (BBPOS vendor) order reference number

  cost_per_unit   NUMERIC(10, 2),
  -- Actual cost paid; used in project expense tracking

  notes           TEXT
);

CREATE TRIGGER cc_terminals_updated_at
  BEFORE UPDATE ON cc_terminals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE cc_terminals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access cc_terminals"
  ON cc_terminals FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## Derived Calculations (client-side, not stored)

These values are computed in React client code, not stored in DB:

```typescript
// Progress percentage for deployment stage
// Count completed checklist items / total applicable items
function deploymentProgressPct(items: DeploymentChecklistItem[]): number {
  if (items.length === 0) return 0;
  return Math.round((items.filter(i => i.is_completed).length / items.length) * 100);
}

// Project P&L
function projectPnL(bom: ProjectBomItem[], expenses: Expense[], project: Project) {
  const revenue = bom.reduce((s, i) => s + (i.customer_price ?? 0), 0)
    + getServiceFee(project);                     // tier venue + court fees
  const cogs = bom.reduce((s, i) => s + (i.est_total_cost ?? 0), 0);
  const laborCost = project.installer_hours * settings.labor_rate_per_hour;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0) + laborCost;
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - totalExpenses;
  return { revenue, cogs, grossProfit, grossMarginPct: grossProfit / revenue,
           totalExpenses, netProfit, netMarginPct: netProfit / revenue };
}

// Service fee by tier
function getServiceFee(project: Project): number {
  const s = settings;
  if (project.tier === 'pro')
    return s.pro_venue_fee + project.court_count * s.pro_court_fee;
  if (project.tier === 'autonomous' || project.tier === 'autonomous_plus')
    return s.autonomous_venue_fee + project.court_count * s.autonomous_court_fee;
  if (project.tier === 'pbk')
    return s.pbk_venue_fee + project.court_count * s.pbk_court_fee;
  return 0;
}

// HER (Hardware Efficiency Ratio) — period-based
// HER = hardware_revenue / team_hardware_spend
// hardware_revenue = sum of hardware customer prices for invoices paid in period
// team_hardware_spend = (niko_salary × niko_direct_allocation)
//                     + (niko_salary × (1 - niko_direct_allocation) × 0.5)  // niko indirect
//                     + (chad_salary × chad_indirect_allocation)
//                     + rent_allocation
//                     + (indirect_salaries × period_fraction)
// NOTE: Exact formula requires XLSX FINANCIALS sheet for confirmation
```

---

## Migration Order

Run migrations in this order to satisfy foreign key dependencies:

1. Create all enums
2. `installers` (no foreign keys)
3. `settings` (no foreign keys)
4. `hardware_catalog` (no foreign keys)
5. `projects` (references installers)
6. `bom_templates` (references hardware_catalog)
7. `project_bom_items` (references projects, hardware_catalog)
8. `inventory` (references hardware_catalog)
9. `inventory_movements` (references hardware_catalog, projects)
10. `purchase_orders` (references projects)
11. `purchase_order_items` (references purchase_orders, hardware_catalog)
12. `deployment_checklist_templates` (no foreign keys)
13. `deployment_checklist_items` (references projects, templates)
14. `invoices` (references projects)
15. `expenses` (references projects)
16. `replay_signs` (references projects)
17. `cc_terminals` (references projects)
18. `update_updated_at` function (used by all triggers — create before triggers)

---

## BOM Model: Hardware Catalog, Templates & Cost Chain

**Aspect**: model-bom
**Date**: 2026-03-06
**Sources**: research/podplay-hardware-bom.md, analysis/source-hardware-guide.md, analysis/source-pricing-model.md, docs/plans/2026-03-06-podplay-ops-wizard-design.md

---

### Field Source Maps

#### hardware_catalog

| Field | MRP Source | Notes |
|-------|-----------|-------|
| sku | Internal convention | CATEGORY-SHORTNAME (e.g., NET-UDM-SE, REPLAY-MACMINI) |
| name | Hardware BOM research | Display name matching BOM doc |
| model | Hardware BOM research | Manufacturer model number |
| vendor | Hardware BOM research | Primary vendor (UniFi / Amazon / EmpireTech / Apple Business / Kisi / Flic / Fast Signs / RC Fasteners / HIDEit / Ingram) |
| vendor_url | Manual entry | Direct order page URL |
| unit_cost | MRP COST ANALYSIS sheet | **Unknown — XLSX not in repo. Must be populated from seed data when XLSX is available** |
| category | Hardware BOM categories | Maps to bom_category enum |
| notes | Hardware BOM notes | Conditional usage notes |
| is_active | Default true | Soft delete |

#### bom_templates

| Field | MRP Source | Notes |
|-------|-----------|-------|
| tier | BOM template tabs in MRP | One template per tier |
| hardware_catalog_id | FK to hardware_catalog | Maps to item |
| qty_per_venue | BOM template column | Flat quantity per install |
| qty_per_court | BOM template column | Multiplied by project.court_count |
| qty_per_door | BOM template column | Multiplied by project.door_count (Autonomous/Autonomous+ only) |
| qty_per_camera | BOM template column | Multiplied by project.security_camera_count (Autonomous+ only) |
| sort_order | Manual ordering by category | For consistent BOM display |

#### project_bom_items

| Field | MRP Source | Notes |
|-------|-----------|-------|
| project_id | FK to projects | |
| hardware_catalog_id | FK to hardware_catalog | |
| qty | Computed at BOM generation | qty_per_venue + (qty_per_court × court_count) + (qty_per_door × door_count) + (qty_per_camera × camera_count) |
| unit_cost | Copied from hardware_catalog.unit_cost | Editable to reflect actual PO cost |
| est_total_cost | Generated column | qty × unit_cost |
| shipping_rate | Copied from settings.shipping_rate | Editable per line |
| landed_cost | Generated column | est_total_cost × (1 + shipping_rate) |
| margin | Copied from settings.target_margin | Editable per line |
| customer_price | Generated column | landed_cost / (1 - margin) |
| allocated | Manual | True when inventory reserved |
| shipped | Manual | True when shipped to venue |
| notes | Manual | Per-line notes |

---

### Complete Hardware Catalog — All Items

47 hardware items across 9 categories. SKU convention: `CATEGORY_PREFIX-SHORTNAME`.

#### Category: network_rack (prefix NET-)

| SKU | Name | Model | Vendor | qty Formula | Notes |
|-----|------|-------|--------|-------------|-------|
| NET-PDU | TrippLite 12 Outlet PDU | RS-1215-RA | Ingram | 1 per venue | Power distribution unit for rack |
| NET-UDM-SE | UniFi Dream Machine SE | UDM-SE | UniFi | 1 per venue | Gateway/console with built-in PoE — used for smaller venues |
| NET-UDM-PRO | UniFi Dream Machine Pro | UDM-Pro | UniFi | 1 per venue | Gateway/console without PoE — standard |
| NET-UDM-PROMAX | UniFi Dream Machine Pro Max | UDM-Pro-Max | UniFi | 1 per venue | Gateway/console without PoE — large venues |
| NET-SW24-PRO | UniFi Switch Pro 24 PoE | USW-Pro-24-POE | UniFi | CONDITIONAL — see sizing rules | 24-port PoE managed switch |
| NET-SW24 | UniFi Switch 24 PoE | USW-24-POE | UniFi | CONDITIONAL — see sizing rules | 24-port PoE standard switch |
| NET-SW48-PRO | UniFi Switch Pro 48 PoE | USW-Pro-48-POE | UniFi | CONDITIONAL — see sizing rules | 48-port PoE managed switch |
| NET-SFP-DAC | SFP+ DAC Cable 0.5m | UACC-DAC-SFP10-0.5M | UniFi | 1 per venue | UDM ↔ Switch interconnect |
| NET-PATCH-1FT | Cat6 Patch Cable 1ft | Monoprice Cat6 1' | Amazon | varies per venue | Switch-to-panel patch |
| NET-PATCH-3FT | Cat6 Patch Cable 3ft | Monoprice Cat6 3' | Amazon | varies per venue | Mac Mini, PDU connections |
| NET-PATCH-10FT | Cat6 Patch Cable 10ft | Monoprice Cat6 10' | Amazon | varies per venue | Kisi controller connections |
| NET-PANEL-24C | 24-Port Patch Panel w/ Couplers | iwillink 24 w/ Couplers | Amazon | 1 per venue | Keystone coupler panel |
| NET-PANEL-BLANK | Blank Patch Panel 24-Port | UACC-Rack-Panel-Patch-Blank-24 | UniFi | 1 per venue | Blank fill panel for rack |
| NET-PANEL-PASSTHRU | 24-Port PassThru Patch Panel | Rapink 24 PassThru | Amazon | 1 per venue | Pre-installed keystone panel |

#### Category: replay_system (prefix REPLAY-)

| SKU | Name | Model | Vendor | qty Formula | Notes |
|-----|------|-------|--------|-------------|-------|
| REPLAY-MACMINI | Mac Mini 16GB 256GB | Mac Mini (M-series, 16GB RAM, 256GB SSD) | Apple Business | 1 per venue | Replay server; chip year TBD (M1/M2/M4) |
| REPLAY-SSD-1TB | Samsung T7 1TB SSD | Samsung T7 Shield 1TB | Amazon | CONDITIONAL — 1-4 courts | External SSD for replay storage |
| REPLAY-SSD-2TB | Samsung T7 2TB SSD | Samsung T7 Shield 2TB | Amazon | CONDITIONAL — 5-12 courts | External SSD for replay storage |
| REPLAY-SSD-4TB | Samsung T7 4TB SSD | Samsung T7 Shield 4TB | Amazon | CONDITIONAL — 13+ courts | External SSD for replay storage |
| REPLAY-CAM-WHITE | EmpireTech Replay Camera White | IPC-T54IR-ZE White | EmpireTech | 1 per court | 4MP varifocal turret (Dahua OEM); white — pickleball clubs |
| REPLAY-CAM-BLACK | EmpireTech Replay Camera Black | IPC-T54IR-ZE Black | EmpireTech | 1 per court | 4MP varifocal turret (Dahua OEM); black — PingPods |
| REPLAY-JB-WHITE | EmpireTech Camera Junction Box White | PFA130-E White | EmpireTech | 1 per court | White junction box for replay camera mount |
| REPLAY-JB-BLACK | EmpireTech Camera Junction Box Black | PFA130-E Black | EmpireTech | 1 per court | Black junction box for replay camera; PingPod venues |
| REPLAY-BTN | Flic Score Button | Flic 2 Button | Flic | 2 per court | Bluetooth score buttons — Left + Right per court |
| REPLAY-HW-KIT | Hardware Fastener Kit | RC Fasteners Kit | RC Fasteners | 1 per venue | Bolts, nuts, screws, zip ties for sign/camera mounting |

#### Category: displays (prefix DISP-)

| SKU | Name | Model | Vendor | qty Formula | Notes |
|-----|------|-------|--------|-------------|-------|
| DISP-TV-65 | 65" Display TV | Various (drop-shipped) | Various | 1 per court | VESA 400×300; center court net-side; 8'9" AFF |
| DISP-APPLETV | Apple TV 4K with Ethernet | Apple TV 4K (3rd gen) + Ethernet adapter | Apple Business | 1 per court | Connected via HDMI to TV |
| DISP-ATV-MOUNT | HIDEit Apple TV Mount | HIDEit AV Mount | HIDEit | 1 per court | Wall/rack mount for Apple TV |
| DISP-HDMI-3FT | HDMI Cable 3ft | Amazon Basics 3ft HDMI 2.0 | Amazon | 1 per court | Apple TV to TV |
| DISP-IPAD | iPad | iPad (10th gen or current) | Apple Business | 1 per court | Kiosk; 4'8" AFF; PoE-powered |
| DISP-IPAD-POE | iPad PoE Adapter | (model TBD — confirm during NJ training) | TBD | 1 per court | Powers iPad via Cat6 |
| DISP-IPAD-CASE | iPad Kiosk Case | (model TBD — confirm during NJ training) | TBD | 1 per court | Enclosure for iPad kiosk |

#### Category: access_control (prefix AC-)

| SKU | Name | Model | Vendor | qty Formula | Notes |
|-----|------|-------|--------|-------------|-------|
| AC-KISI-CTRL | Kisi Controller Pro 2 | Kisi Controller Pro 2 | Kisi | 1 per venue | Access control hub; Autonomous/Autonomous+ only |
| AC-KISI-READER | Kisi Reader Pro 2 | Kisi Reader Pro 2 | Kisi | 1 per door | One reader per access-controlled door |

#### Category: surveillance (prefix SURV-)

| SKU | Name | Model | Vendor | qty Formula | Notes |
|-----|------|-------|--------|-------------|-------|
| SURV-NVR-4BAY | UniFi NVR 4-Bay | UNVR | UniFi | CONDITIONAL — ≤4 cameras | Network Video Recorder; Autonomous+ only |
| SURV-NVR-7BAY | UniFi NVR Pro 7-Bay | UNVR-Pro | UniFi | CONDITIONAL — >4 cameras | Larger NVR; Autonomous+ only |
| SURV-HDD-8TB | WD Purple 8TB Hard Drive | WD Purple Pro 8TB | Amazon | CONDITIONAL — 1 per NVR bay used | NVR storage drive |
| SURV-CAM-G5-WHITE | UniFi G5 Turret Ultra White | G5 Turret Ultra (White) | UniFi | 1 per security camera (Autonomous/Autonomous+) | Pickleball club venues |
| SURV-JB-WHITE | UniFi Camera Junction Box White | UACC-Camera-CJB-White | UniFi | 1 per security camera (white) | Junction box for G5 White |
| SURV-CAM-G5-BLACK | UniFi G5 Turret Ultra Black | G5 Turret Ultra (Black) | UniFi | 1 per security camera (Autonomous/Autonomous+) | PingPod venues |
| SURV-JB-BLACK | UniFi Camera Junction Box Black | UACC-Camera-CJB-Black | UniFi | 1 per security camera (black) | Junction box for G5 Black |
| SURV-CAM-DOME | UniFi G5 Dome Camera | G5 Dome | UniFi | 1 per security camera (alternative) | 2K dome camera for security |
| SURV-CAM-DOME-BLK | UniFi G5 Dome Ultra Black | G5 Dome Ultra | UniFi | 1 per security camera (alternative) | Smaller form, black; PingPods |

#### Category: front_desk (prefix DESK-)

| SKU | Name | Model | Vendor | qty Formula | Notes |
|-----|------|-------|--------|-------------|-------|
| DESK-WEBCAM | Anker PowerConf C200 2K Webcam | Anker PowerConf C200 | Amazon | 1 per venue | Check-in photo capture; optional, front-desk only |
| DESK-QR-SCANNER | 2D QR Barcode Scanner | 2D QR Barcode Scanner (USB) | Amazon | 1 per venue | Member QR code scan at check-in; front-desk only |

#### Category: infrastructure (prefix INFRA-)

| SKU | Name | Model | Vendor | qty Formula | Notes |
|-----|------|-------|--------|-------------|-------|
| INFRA-RACK-SHELF | Pyle 19" 1U Vented Rack Shelf | Pyle PSHELF19 (1U Vented) | Amazon | 1 per venue | Holds Mac Mini in rack |

#### Category: pingpod_specific (prefix PING-)

| SKU | Name | Model | Vendor | qty Formula | Notes |
|-----|------|-------|--------|-------------|-------|
| PING-WIFI-AP | UniFi WiFi 6 Access Point | U6-Plus | UniFi | 1 per venue | WiFi AP for PingPod venues only; conditional on project.has_pingpod_wifi |

#### Category: signage (prefix SIGN-)

| SKU | Name | Model | Vendor | qty Formula | Notes |
|-----|------|-------|--------|-------------|-------|
| SIGN-REPLAY | Aluminum Printed Replay Sign 6×8" | Custom Print 6x8 Aluminum | Fast Signs | Tracked via replay_signs table (court_count × 2) | NOT a BOM line item; managed separately in replay_signs table |

---

### BOM Template Matrix

Complete specification of which items appear in each tier's BOM template and at what multipliers.

**Quantity formula**:
```
qty = (qty_per_venue × 1)
    + (qty_per_court × project.court_count)
    + (qty_per_door × project.door_count)
    + (qty_per_camera × project.security_camera_count)
```

**Tier inheritance**: Each tier builds on the previous:
- Pro: network_rack + replay_system + displays + infrastructure + signage hardware
- Autonomous: Pro + access_control + surveillance cameras (no NVR)
- Autonomous+: Autonomous + NVR + hard drives

Items marked **CONDITIONAL** use special sizing logic (see next section) — they are NOT in the bom_templates table directly but are added by the BOM generation algorithm.

#### Pro Tier BOM Template

| SKU | qty_per_venue | qty_per_court | qty_per_door | qty_per_camera | Notes |
|-----|--------------|--------------|-------------|----------------|-------|
| NET-PDU | 1 | 0 | 0 | 0 | |
| NET-UDM-SE | CONDITIONAL | — | — | — | One of UDM-SE/PRO/PROMAX selected by court count |
| NET-UDM-PRO | CONDITIONAL | — | — | — | |
| NET-UDM-PROMAX | CONDITIONAL | — | — | — | |
| NET-SW24-PRO | CONDITIONAL | — | — | — | Switch selected by court count |
| NET-SW48-PRO | CONDITIONAL | — | — | — | |
| NET-SFP-DAC | 1 | 0 | 0 | 0 | |
| NET-PATCH-1FT | 1 | 1 | 0 | 0 | Estimate: 1 per venue + 1 per court; exact from XLSX |
| NET-PATCH-3FT | 1 | 0 | 0 | 0 | Mac Mini + PDU connections; ~2 per venue |
| NET-PATCH-10FT | 0 | 0 | 0 | 0 | Only for Kisi (Autonomous tier) |
| NET-PANEL-24C | 1 | 0 | 0 | 0 | |
| NET-PANEL-BLANK | 1 | 0 | 0 | 0 | |
| NET-PANEL-PASSTHRU | 1 | 0 | 0 | 0 | |
| REPLAY-MACMINI | 1 | 0 | 0 | 0 | |
| REPLAY-SSD-1TB | CONDITIONAL | — | — | — | SSD selected by court count |
| REPLAY-SSD-2TB | CONDITIONAL | — | — | — | |
| REPLAY-SSD-4TB | CONDITIONAL | — | — | — | |
| REPLAY-CAM-WHITE | 0 | 1 | 0 | 0 | Default white; swap for BLACK for PingPod |
| REPLAY-JB-WHITE | 0 | 1 | 0 | 0 | Default white; swap for BLACK for PingPod |
| REPLAY-BTN | 0 | 2 | 0 | 0 | 2 buttons per court (Left + Right) |
| REPLAY-HW-KIT | 1 | 0 | 0 | 0 | |
| DISP-TV-65 | 0 | 1 | 0 | 0 | |
| DISP-APPLETV | 0 | 1 | 0 | 0 | |
| DISP-ATV-MOUNT | 0 | 1 | 0 | 0 | |
| DISP-HDMI-3FT | 0 | 1 | 0 | 0 | |
| DISP-IPAD | 0 | 1 | 0 | 0 | |
| DISP-IPAD-POE | 0 | 1 | 0 | 0 | |
| DISP-IPAD-CASE | 0 | 1 | 0 | 0 | |
| INFRA-RACK-SHELF | 1 | 0 | 0 | 0 | |

**Front desk items** (added when project.has_front_desk = true — all per-venue):
| SKU | qty_per_venue |
|-----|--------------|
| DESK-WEBCAM | 1 |
| DESK-QR-SCANNER | 1 |

**PingPod items** (added when project.has_pingpod_wifi = true):
| SKU | qty_per_venue |
|-----|--------------|
| PING-WIFI-AP | 1 |

#### Autonomous Tier BOM Template

All Pro items PLUS:

| SKU | qty_per_venue | qty_per_court | qty_per_door | qty_per_camera | Notes |
|-----|--------------|--------------|-------------|----------------|-------|
| NET-PATCH-10FT | 0 | 0 | 1 | 0 | Kisi controller cable per door |
| AC-KISI-CTRL | 1 | 0 | 0 | 0 | One controller for entire venue |
| AC-KISI-READER | 0 | 0 | 1 | 0 | One reader per access-controlled door |
| SURV-CAM-G5-WHITE | 0 | 0 | 0 | 1 | Default white; swap for BLACK at PingPod |
| SURV-JB-WHITE | 0 | 0 | 0 | 1 | Default white junction box |

#### Autonomous+ Tier BOM Template

All Autonomous items PLUS:

| SKU | qty_per_venue | qty_per_court | qty_per_door | qty_per_camera | Notes |
|-----|--------------|--------------|-------------|----------------|-------|
| SURV-NVR-4BAY | CONDITIONAL | — | — | — | UNVR when security_camera_count ≤ 4 |
| SURV-NVR-7BAY | CONDITIONAL | — | — | — | UNVR-Pro when security_camera_count > 4 |
| SURV-HDD-8TB | CONDITIONAL | — | — | — | Qty = NVR bay count (4 or 7) |

---

### Special Sizing Rules

These items cannot use simple multipliers and require conditional logic in the BOM generation algorithm. The BOM generation service selects the appropriate item and removes the alternatives.

#### Switch Sizing (Pro, Autonomous, Autonomous+)

Selection based on `project.court_count` (each court needs 3 PoE ports: replay camera, iPad, Apple TV; plus additional ports for doors and security cameras):

| court_count | Switch Selection | Qty |
|-------------|-----------------|-----|
| 1–8 | NET-SW24-PRO (USW-Pro-24-POE) | 1 |
| 9–16 | NET-SW24-PRO (USW-Pro-24-POE) | 2 |
| 17–30 | NET-SW48-PRO (USW-Pro-48-POE) | 1 |

**Note**: Exact breakpoints are estimates — the XLSX BOM template sheet has the authoritative breakpoints. These should be confirmed before shipping to seed data.

**Port budget**:
- Each court = 3 ports (camera, iPad, Apple TV)
- Each door (Autonomous) = 1 port (Kisi reader)
- Each security camera (Autonomous/Autonomous+) = 1 port
- Mac Mini = 1 port
- Kisi Controller = 1 port
- NVR (Autonomous+) = 1 port (via SFP or ethernet)
- Reserve = 2 ports minimum

#### SSD Sizing (Replay System — Pro, Autonomous, Autonomous+)

One Samsung T7 SSD per Mac Mini. Size based on `project.court_count`:

| court_count | SSD Selection | Capacity Rationale |
|-------------|-------------|-------------------|
| 1–4 | REPLAY-SSD-1TB (Samsung T7 1TB) | ~250GB per court storage at standard retention |
| 5–12 | REPLAY-SSD-2TB (Samsung T7 2TB) | ~165GB per court |
| 13–30 | REPLAY-SSD-4TB (Samsung T7 4TB) | ~130GB per court |

**Note**: Exact breakpoints from XLSX BOM sheet — these are estimates based on storage math. Confirm before seeding.

#### NVR Sizing (Autonomous+ only)

One NVR per venue. Size based on `project.security_camera_count`:

| security_camera_count | NVR Selection | Hard Drive Qty |
|----------------------|-------------|---------------|
| 1–4 | SURV-NVR-4BAY (UNVR, 4-bay) | 4 × SURV-HDD-8TB |
| 5–7 | SURV-NVR-7BAY (UNVR-Pro, 7-bay) | security_camera_count × SURV-HDD-8TB |

**Note**: NVR bay count = one drive per camera + spare bay. Exact rule from XLSX — confirm before seeding.

#### UDM / Gateway Selection

The UDM variant (SE, Pro, Pro Max) is selected based on court count and configuration complexity. Current known rule: one gateway per venue regardless of size. The specific variant is typically selected during intake based on venue needs. Default: NET-UDM-PRO.

| Scenario | Gateway |
|----------|---------|
| Standard venue (any size) | NET-UDM-PRO (UDM-Pro) |
| Venue with built-in PoE needed | NET-UDM-SE (UDM-SE) |
| Very large / complex venue | NET-UDM-PROMAX (UDM-Pro-Max) |

**Note**: Exact selection rule from XLSX — confirm before seeding. Default to NET-UDM-PRO.

---

### Cost Chain — Complete Formula

The full cost chain is applied per BOM line item in `project_bom_items`:

```
Step 1: Quantity
  qty = bom_template.qty_per_venue
      + (bom_template.qty_per_court × project.court_count)
      + (bom_template.qty_per_door × project.door_count)
      + (bom_template.qty_per_camera × project.security_camera_count)

Step 2: Hardware cost (COGS)
  unit_cost = hardware_catalog.unit_cost   [copied at BOM generation]
  est_total_cost = qty × unit_cost
  -- This is COGS: actual amount PodPlay pays vendor

Step 3: Landed cost (add shipping/handling)
  shipping_rate = settings.shipping_rate   [default 0.10 = 10%]
  landed_cost = est_total_cost × (1 + shipping_rate)
  -- Represents total cost to PodPlay including logistics

Step 4: Customer price (apply margin)
  margin = settings.target_margin         [default 0.10 = 10%]
  customer_price = landed_cost / (1 - margin)
  -- customer_price = est_total_cost × 1.10 / 0.90
  -- Net margin on landed: 10%; gross margin on unit cost: ~22%

Step 5: BOM totals (per project, computed client-side)
  total_est_cost   = SUM(project_bom_items.est_total_cost)
  total_landed     = SUM(project_bom_items.landed_cost)
  total_hw_revenue = SUM(project_bom_items.customer_price)

Step 6: Service fee (computed client-side from project.tier)
  service_fee = tier_venue_fee + (court_count × tier_court_fee)
  -- Pro:         $5,000 + (courts × $2,500)
  -- Autonomous:  $7,500 + (courts × $2,500)
  -- Autonomous+: $7,500 + (courts × $2,500) [+ surveillance add-on TBD]
  -- PBK:         pbk_venue_fee + (courts × pbk_court_fee) [unknown — requires XLSX]

Step 7: Invoice total
  invoice_subtotal = total_hw_revenue + service_fee
  tax_amount       = invoice_subtotal × settings.sales_tax_rate  [default 0.1025]
  invoice_total    = invoice_subtotal + tax_amount
  deposit_amount   = invoice_total × 0.50  [50% assumed; confirm from XLSX]
  final_amount     = invoice_total - deposit_amount

Step 8: P&L
  gross_profit     = total_hw_revenue + service_fee - total_est_cost
  gross_margin_pct = gross_profit / (total_hw_revenue + service_fee)
  labor_cost       = project.installer_hours × settings.labor_rate_per_hour
  total_expenses   = SUM(expenses.amount) + labor_cost
  net_profit       = gross_profit - total_expenses
  net_margin_pct   = net_profit / (total_hw_revenue + service_fee)
```

**Concrete example** (6-court Pro, estimated unit costs):
```
Tier: Pro | Courts: 6 | Doors: 0 | Cameras: 0

Mac Mini (qty=1, unit=$699):   est=$699  → landed=$769  → cust=$854
Apple TV (qty=6, unit=$149):   est=$894  → landed=$983  → cust=$1,093
iPad (qty=6, unit=$349):       est=$2,094 → landed=$2,303 → cust=$2,559
EmpireTech Cam (qty=6, $180):  est=$1,080 → landed=$1,188 → cust=$1,320
... (remaining items)

total_est_cost   ≈ $12,000  (COGS — actual unit costs TBD from XLSX)
total_landed     ≈ $13,200  (×1.10)
total_hw_revenue ≈ $14,667  (÷0.90)

service_fee = $5,000 + (6 × $2,500) = $20,000
invoice_subtotal = $14,667 + $20,000 = $34,667
tax = $34,667 × 0.1025 = $3,553
invoice_total = $38,220
deposit = $19,110 (50%)
```

**All unit costs above are ILLUSTRATIVE ESTIMATES. Actual unit costs require the XLSX.**

---

### BOM Generation Algorithm (Client-Side)

When a project is created (or BOM is regenerated), the following steps run:

```typescript
function generateProjectBOM(project: Project, templates: BomTemplate[], catalog: HardwareCatalog[], settings: Settings): ProjectBomItem[] {
  const items: ProjectBomItem[] = [];

  for (const template of templates.filter(t => t.tier === project.tier || isSubTier(project.tier, t.tier))) {
    const catalogItem = catalog.find(c => c.id === template.hardware_catalog_id);
    if (!catalogItem) continue;

    // Skip tier-specific items for wrong tier
    if (template.tier === 'autonomous' && project.tier === 'pro') continue;
    if (template.tier === 'autonomous_plus' && project.tier !== 'autonomous_plus') continue;

    const qty = template.qty_per_venue
      + (template.qty_per_court * project.court_count)
      + (template.qty_per_door * project.door_count)
      + (template.qty_per_camera * project.security_camera_count);

    if (qty === 0) continue;

    items.push({
      project_id: project.id,
      hardware_catalog_id: catalogItem.id,
      qty,
      unit_cost: catalogItem.unit_cost,
      shipping_rate: settings.shipping_rate,
      margin: settings.target_margin,
      allocated: false,
      shipped: false,
    });
  }

  // Apply special sizing rules (replace conditional items)
  applyConditionalSizing(items, project, catalog);

  // Add conditional items (front desk, PingPod)
  if (project.has_front_desk) {
    addFrontDeskItems(items, project, catalog, settings);
  }
  if (project.has_pingpod_wifi) {
    addPingPodItems(items, project, catalog, settings);
  }

  return items;
}

function applyConditionalSizing(items: ProjectBomItem[], project: Project, catalog: HardwareCatalog[]) {
  // Switch sizing
  const swSku = project.court_count <= 8 ? 'NET-SW24-PRO'
    : project.court_count <= 16 ? 'NET-SW24-PRO'  // qty=2
    : 'NET-SW48-PRO';
  const swQty = project.court_count <= 16 ? (project.court_count <= 8 ? 1 : 2) : 1;
  replaceConditionalItem(items, ['NET-SW24-PRO', 'NET-SW24', 'NET-SW48-PRO'], swSku, swQty, catalog);

  // SSD sizing
  const ssdSku = project.court_count <= 4 ? 'REPLAY-SSD-1TB'
    : project.court_count <= 12 ? 'REPLAY-SSD-2TB'
    : 'REPLAY-SSD-4TB';
  replaceConditionalItem(items, ['REPLAY-SSD-1TB', 'REPLAY-SSD-2TB', 'REPLAY-SSD-4TB'], ssdSku, 1, catalog);

  // NVR sizing (Autonomous+ only)
  if (project.tier === 'autonomous_plus') {
    const nvrSku = project.security_camera_count <= 4 ? 'SURV-NVR-4BAY' : 'SURV-NVR-7BAY';
    const bayCount = project.security_camera_count <= 4 ? 4 : 7;
    replaceConditionalItem(items, ['SURV-NVR-4BAY', 'SURV-NVR-7BAY'], nvrSku, 1, catalog);
    // Hard drives: one per NVR bay
    addItem(items, 'SURV-HDD-8TB', bayCount, catalog, settings);
  }
}
```

---

### Known Gaps in BOM Model

| Gap | Impact | Resolution Needed |
|----|--------|-------------------|
| All hardware unit_costs are NULL | Cannot compute customer prices or project P&L | Requires XLSX COST ANALYSIS sheet or vendor quotes |
| iPad model (exact) | Cannot confirm DISP-IPAD sku/model | Confirm during NJ lab visit |
| iPad PoE adapter model | DISP-IPAD-POE has TBD model | Confirm during NJ lab visit |
| iPad kiosk case model | DISP-IPAD-CASE has TBD model | Confirm during NJ lab visit |
| Switch/SSD/NVR breakpoints | Sizing rules above are estimates | Confirm from XLSX BOM template tabs |
| PBK tier BOM template | PBK may have different hardware config | Requires PBK contract/XLSX |
| patch cable quantities per venue | NET-PATCH-* qty_per_venue is estimated | Confirm from XLSX |
| UPS | Not in hardware BOM doc; likely in rack | Confirm model and add if in XLSX |
| Rack enclosure | Not in hardware BOM doc; may be customer-supplied | Confirm from XLSX |
| Mac Mini chip generation | M1/M2/M4 — affects ABM enrollment and local PH sourcing | Confirm from Apple Business orders |
