-- =============================================================================
-- PodPlay Ops Wizard — Complete Supabase Migration
-- =============================================================================
-- Run this file once against a fresh Supabase project.
-- Sections:
--   1. Enums (22 types)
--   2. Shared trigger function
--   3. Tables (25 tables, in FK dependency order)
--   4. Seed data for all reference tables
--
-- Source: final-mega-spec/data-model/schema.md (consolidated)
-- =============================================================================


-- =============================================================================
-- 1. ENUMS
-- =============================================================================

-- Service tier: drives BOM template selection and pricing
CREATE TYPE service_tier AS ENUM (
  'pro',             -- Display + kiosk + replay camera per court + network rack
  'autonomous',      -- Pro + access control (Kisi) + security cameras (UniFi G5)
  'autonomous_plus', -- Autonomous + NVR (UNVR/UNVR-Pro) with hard drives
  'pbk'              -- Pickleball Kingdom custom pricing tier
);

-- Overall wizard stage / project lifecycle
CREATE TYPE project_status AS ENUM (
  'intake',          -- Stage 1: intake form in progress or complete
  'procurement',     -- Stage 2: BOM reviewed, POs/inventory in progress
  'deployment',      -- Stage 3: 15-phase deployment checklist active
  'financial_close', -- Stage 4: invoicing, expenses, P&L review
  'completed',       -- Final invoice paid, project closed
  'cancelled'
);

-- Granular deployment sub-status (within Stage 3)
CREATE TYPE deployment_status AS ENUM (
  'not_started',
  'config',          -- Hardware being configured in PodPlay NJ lab
  'ready_to_ship',   -- Configured, tested, packed — awaiting shipment
  'shipped',         -- Shipped to venue
  'installing',      -- On-site installation in progress
  'qc',              -- Quality check / end-to-end testing at venue
  'completed'
);

-- Revenue pipeline stage
CREATE TYPE revenue_stage AS ENUM (
  'proposal',         -- SOW sent, not yet signed
  'signed',           -- Contract signed
  'deposit_invoiced', -- Deposit invoice sent
  'deposit_paid',     -- Deposit received
  'final_invoiced',   -- Final invoice sent (after go-live)
  'final_paid'        -- Fully closed
);

-- Installer source
CREATE TYPE installer_type AS ENUM (
  'podplay_vetted', -- From PodPlay vetted network (NY/NJ/CT)
  'client_own'      -- Client's own installer
);

-- ISP connection type
CREATE TYPE isp_type AS ENUM (
  'fiber',
  'cable',
  'dedicated',
  'other'
);

-- Replay service version
CREATE TYPE replay_service_version AS ENUM (
  'v1', -- Current: deploy.py + VPN, UDP, pixelation known issue
  'v2'  -- Coming April 2026: GitHub deploy, TCP, config via dashboard
);

-- Expense category
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
CREATE TYPE payment_method AS ENUM (
  'podplay_card',   -- Company Ramp card
  'ramp_reimburse'  -- Personal card, reimbursed via Ramp
);

-- Invoice status
CREATE TYPE invoice_status AS ENUM (
  'not_sent',
  'sent',
  'paid'
);

-- BOM item category for UI grouping
CREATE TYPE bom_category AS ENUM (
  'network_rack',
  'replay_system',
  'displays',
  'access_control',
  'surveillance',
  'front_desk',
  'cabling',
  'signage',
  'infrastructure',
  'pingpod_specific'
);

-- Inventory movement type
CREATE TYPE inventory_movement_type AS ENUM (
  'purchase_order_received',
  'project_allocated',
  'project_shipped',
  'adjustment_increase',
  'adjustment_decrease',
  'return'
);

-- Replay sign fulfillment status
CREATE TYPE sign_status AS ENUM (
  'staged',
  'shipped',
  'delivered',
  'installed'
);

-- CC terminal order status
CREATE TYPE cc_terminal_status AS ENUM (
  'not_ordered',
  'ordered',
  'delivered',
  'installed'
);

-- MDM provider (for device migrations)
CREATE TYPE mdm_provider AS ENUM (
  'mosyle',
  'jamf',
  'other'
);

-- Device migration event status
CREATE TYPE device_migration_status AS ENUM (
  'planning',
  'released',
  'enrolled',
  'configured',
  'completed',
  'cancelled'
);

-- Device type being migrated
CREATE TYPE migration_device_type AS ENUM (
  'ipad',
  'apple_tv',
  'mac_mini'
);

-- Per-device status within a migration
CREATE TYPE migration_device_status AS ENUM (
  'pending',
  'released',
  'enrolled',
  'configured'
);

-- Geographic deployment region
CREATE TYPE deployment_region AS ENUM (
  'us',
  'philippines'
);

-- Video encoding standard
CREATE TYPE video_standard AS ENUM (
  'ntsc',  -- 60Hz — US default, all current deployments
  'pal'    -- 50Hz — Asia/Europe (Philippines open question, Appendix F Q1)
);

-- Electrical power standard
CREATE TYPE power_standard AS ENUM (
  '120v_60hz',  -- US standard — all current hardware designed for this
  '220v_60hz'   -- Philippines (same frequency, different voltage)
);


-- =============================================================================
-- 2. SHARED TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- 3. TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3.01  installers
-- Installer directory. PodPlay vetted network covers NY, NJ, CT.
-- MRP source: Installer directory tab
-- -----------------------------------------------------------------------------

CREATE TABLE installers (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  name           TEXT        NOT NULL,
  company        TEXT,
  email          TEXT,
  phone          TEXT,

  installer_type installer_type NOT NULL DEFAULT 'podplay_vetted',
  regions        TEXT[],
  -- Array of state/country codes: ARRAY['NY','NJ','CT'] or ARRAY['PH']

  hourly_rate    NUMERIC(10,2),
  -- NULL = use global settings.labor_rate_per_hour ($120/hr default)

  is_active      BOOLEAN     NOT NULL DEFAULT true,
  notes          TEXT
);

CREATE TRIGGER installers_updated_at
  BEFORE UPDATE ON installers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_installers_is_active      ON installers (is_active);
CREATE INDEX idx_installers_installer_type ON installers (installer_type);
CREATE INDEX idx_installers_regions        ON installers USING GIN (regions);

ALTER TABLE installers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "installers_all_authenticated"
  ON installers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 3.02  settings
-- Single-row global configuration. All tunable pricing, rates, thresholds.
-- MRP source: COST ANALYSIS sheet, Settings tab, design doc defaults
-- id = 1, always. CHECK constraint enforces single-row invariant.
-- -----------------------------------------------------------------------------

CREATE TABLE settings (
  id                              INTEGER     PRIMARY KEY DEFAULT 1
                                  CHECK (id = 1),

  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Pricing tier fees (customer-facing service fees, not hardware cost)
  pro_venue_fee                   NUMERIC(10,2) NOT NULL DEFAULT 5000.00,
  pro_court_fee                   NUMERIC(10,2) NOT NULL DEFAULT 2500.00,
  autonomous_venue_fee            NUMERIC(10,2) NOT NULL DEFAULT 7500.00,
  autonomous_court_fee            NUMERIC(10,2) NOT NULL DEFAULT 2500.00,
  autonomous_plus_venue_fee       NUMERIC(10,2) NOT NULL DEFAULT 7500.00,
  autonomous_plus_court_fee       NUMERIC(10,2) NOT NULL DEFAULT 2500.00,
  pbk_venue_fee                   NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  -- Must be configured before creating PBK projects; exact value requires XLSX
  pbk_court_fee                   NUMERIC(10,2) NOT NULL DEFAULT 0.00,

  -- Cost chain rates
  shipping_rate                   NUMERIC(5,4) NOT NULL DEFAULT 0.10
                                  CHECK (shipping_rate >= 0 AND shipping_rate <= 1),
  -- landed_cost = est_total_cost * (1 + shipping_rate)

  target_margin                   NUMERIC(5,4) NOT NULL DEFAULT 0.10
                                  CHECK (target_margin >= 0 AND target_margin < 1),
  -- customer_price = landed_cost / (1 - target_margin)

  sales_tax_rate                  NUMERIC(5,4) NOT NULL DEFAULT 0.1025
                                  CHECK (sales_tax_rate >= 0 AND sales_tax_rate <= 1),
  -- Applied to invoice subtotal (hardware + service fee)

  deposit_pct                     NUMERIC(5,4) NOT NULL DEFAULT 0.50
                                  CHECK (deposit_pct > 0 AND deposit_pct < 1),
  -- Fraction of invoice_total billed as first installment

  -- Labor
  labor_rate_per_hour             NUMERIC(10,2) NOT NULL DEFAULT 120.00,
  hours_per_day                   INTEGER       NOT NULL DEFAULT 10
                                  CHECK (hours_per_day >= 1 AND hours_per_day <= 24),

  -- Travel defaults (pre-fill expense entry)
  lodging_per_day                 NUMERIC(10,2) NOT NULL DEFAULT 250.00,
  airfare_default                 NUMERIC(10,2) NOT NULL DEFAULT 1800.00,

  -- Team OpEx (for HER calculation; also in team_opex table per-person)
  rent_per_year                   NUMERIC(12,2) NOT NULL DEFAULT 27600.00,
  indirect_salaries_per_year      NUMERIC(12,2) NOT NULL DEFAULT 147000.00,

  -- BOM sizing thresholds (switch, SSD, NVR selection breakpoints)
  switch_24_max_courts            INTEGER NOT NULL DEFAULT 10,
  -- Use USW-Pro-24-POE (single) for court_count <= this; above → 2x or 48-port
  switch_48_max_courts            INTEGER NOT NULL DEFAULT 20,
  ssd_1tb_max_courts              INTEGER NOT NULL DEFAULT 4,
  ssd_2tb_max_courts              INTEGER NOT NULL DEFAULT 12,
  nvr_4bay_max_cameras            INTEGER NOT NULL DEFAULT 4,
  -- Use UNVR (4-bay) for camera_count <= this; above → UNVR-Pro (7-bay)

  -- ISP speed validation thresholds
  isp_fiber_mbps_per_court        INTEGER NOT NULL DEFAULT 12,
  isp_cable_upload_min_mbps       INTEGER NOT NULL DEFAULT 60,

  -- Operational defaults
  default_replay_service_version  TEXT    NOT NULL DEFAULT 'v1'
                                  CHECK (default_replay_service_version IN ('v1','v2')),
  po_number_prefix                TEXT    NOT NULL DEFAULT 'PO',
  mac_mini_local_ip               TEXT    NOT NULL DEFAULT '192.168.32.100',
  replay_vlan_id                  INTEGER NOT NULL DEFAULT 32,
  surveillance_vlan_id            INTEGER NOT NULL DEFAULT 31,
  access_control_vlan_id          INTEGER NOT NULL DEFAULT 33,
  default_vlan_id                 INTEGER NOT NULL DEFAULT 30,
  replay_port                     INTEGER NOT NULL DEFAULT 4000,
  ddns_domain                     TEXT    NOT NULL DEFAULT 'podplaydns.com',
  cc_terminal_pin                 TEXT    NOT NULL DEFAULT '07139',
  label_sets_per_court            INTEGER NOT NULL DEFAULT 5
                                  CHECK (label_sets_per_court >= 1),
  replay_sign_multiplier          INTEGER NOT NULL DEFAULT 2
                                  CHECK (replay_sign_multiplier >= 1),

  CONSTRAINT settings_single_row CHECK (id = 1)
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_read"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "settings_update"
  ON settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
-- No INSERT beyond seed; no DELETE — row must always exist.


-- -----------------------------------------------------------------------------
-- 3.03  hardware_catalog
-- Master list of all hardware items. ~47 items across 9 categories.
-- MRP source: Hardware BOM sheet / COST ANALYSIS catalog
-- -----------------------------------------------------------------------------

CREATE TABLE hardware_catalog (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  sku         TEXT        NOT NULL UNIQUE,
  -- Internal SKU: CATEGORY-SHORTNAME (e.g., NET-UDM-SE, REPLAY-MACMINI)

  name        TEXT        NOT NULL,
  model       TEXT,        -- Manufacturer model number
  vendor      TEXT        NOT NULL,
  vendor_url  TEXT,

  unit_cost   NUMERIC(10,2),
  -- Purchase cost in USD. NULL until XLSX COST ANALYSIS sheet is available.
  -- Populated from seed-data.md when XLSX is available.

  category    bom_category NOT NULL,
  notes       TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true
);

CREATE TRIGGER hardware_catalog_updated_at
  BEFORE UPDATE ON hardware_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_hardware_catalog_category ON hardware_catalog (category);
CREATE INDEX idx_hardware_catalog_vendor   ON hardware_catalog (vendor);
CREATE INDEX idx_hardware_catalog_sku      ON hardware_catalog (sku);

ALTER TABLE hardware_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hardware_catalog_all_authenticated"
  ON hardware_catalog FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 3.04  projects
-- Central entity. One row per customer installation project.
-- MRP source: Form Responses + CUSTOMER MASTER + MASTER ACCOUNTS tabs
-- -----------------------------------------------------------------------------

CREATE TABLE projects (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Customer & Venue (from Form Responses)
  customer_name               TEXT        NOT NULL,
  venue_name                  TEXT        NOT NULL,
  venue_address_line1         TEXT,
  venue_address_line2         TEXT,
  venue_city                  TEXT        NOT NULL DEFAULT '',
  venue_state                 TEXT        NOT NULL DEFAULT '',
  venue_country               TEXT        NOT NULL DEFAULT 'US',
  venue_zip                   TEXT,
  contact_name                TEXT        NOT NULL DEFAULT '',
  contact_email               TEXT        NOT NULL DEFAULT '',
  contact_phone               TEXT,

  -- Project parameters (drive BOM generation)
  tier                        service_tier NOT NULL,
  court_count                 INTEGER     NOT NULL DEFAULT 1
                              CHECK (court_count >= 1 AND court_count <= 50),
  door_count                  INTEGER     NOT NULL DEFAULT 0
                              CHECK (door_count >= 0),
  -- Access-controlled doors; Autonomous/Autonomous+ only
  security_camera_count       INTEGER     NOT NULL DEFAULT 0
                              CHECK (security_camera_count >= 0),
  -- Surveillance cameras; Autonomous+ only
  replay_sign_count           INTEGER     GENERATED ALWAYS AS (court_count * 2) STORED,
  -- 2 replay signs per court; drives replay_signs.qty at Stage 2 entry
  has_nvr                     BOOLEAN     NOT NULL DEFAULT false,
  has_pingpod_wifi            BOOLEAN     NOT NULL DEFAULT false,
  has_front_desk              BOOLEAN     NOT NULL DEFAULT false,

  -- ISP & Networking (from intake form / Phase 0 checklist)
  isp_provider                TEXT,
  isp_type                    isp_type,
  isp_has_static_ip           BOOLEAN     NOT NULL DEFAULT false,
  -- Static IP preferred; DMZ second; port forward last resort
  isp_provider_backup         TEXT,
  -- Second ISP name; required for Autonomous 24/7 venues
  isp_has_backup_static_ip    BOOLEAN     NOT NULL DEFAULT false,
  internet_download_mbps      INTEGER,
  internet_upload_mbps        INTEGER,
  starlink_warning_acknowledged BOOLEAN   DEFAULT false,
  -- Must be true before project can proceed if isp_provider ILIKE '%starlink%'
  rack_size_u                 INTEGER,

  -- International deployment
  deployment_region           deployment_region NOT NULL DEFAULT 'us',
  video_standard              video_standard    NOT NULL DEFAULT 'ntsc',
  power_standard              power_standard    NOT NULL DEFAULT '120v_60hz',
  cosmos_entity               BOOLEAN     NOT NULL DEFAULT false,
  -- true = Cosmos franchise deployment (Philippines); triggers int'l validation warnings

  -- Deployment infrastructure (from MASTER ACCOUNTS tab)
  ddns_subdomain              TEXT,
  -- FreeDNS subdomain under podplaydns.com (e.g., 'telepark')
  -- Full URL: http://{ddns_subdomain}.podplaydns.com:4000
  unifi_site_name             TEXT,
  -- Format: PL-{CUSTOMERNAME} (e.g., 'PL-TELEPARK')
  mac_mini_username           TEXT,
  mac_mini_password           TEXT,
  location_id                 TEXT,
  -- PodPlay venue ID from dev team (Agustin)
  -- Used in Mosyle MDM P-List: <dict><key>id</key><string>LOCATION_ID</string></dict>
  replay_api_url              TEXT,
  -- Auto-derived: http://{ddns_subdomain}.podplaydns.com:4000
  replay_local_url            TEXT DEFAULT 'http://192.168.32.100:4000',
  replay_service_version      replay_service_version NOT NULL DEFAULT 'v1',

  -- Lifecycle status
  project_status              project_status   NOT NULL DEFAULT 'intake',
  deployment_status           deployment_status NOT NULL DEFAULT 'not_started',
  revenue_stage               revenue_stage    NOT NULL DEFAULT 'proposal',

  -- Dates
  kickoff_call_date           DATE,
  signed_date                 DATE,
  installation_start_date     DATE,
  installation_end_date       DATE,
  go_live_date                DATE,

  -- Installation
  installer_id                UUID REFERENCES installers(id) ON DELETE SET NULL,
  installer_type              installer_type,
  installer_hours             NUMERIC(10,2) NOT NULL DEFAULT 0,
  -- labor_cost = installer_hours × settings.labor_rate_per_hour

  notes                       TEXT,
  internal_notes              TEXT
);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_projects_project_status     ON projects (project_status);
CREATE INDEX idx_projects_revenue_stage      ON projects (revenue_stage);
CREATE INDEX idx_projects_deployment_status  ON projects (deployment_status);
CREATE INDEX idx_projects_tier               ON projects (tier);
CREATE INDEX idx_projects_created_at         ON projects (created_at DESC);
CREATE INDEX idx_projects_customer_name      ON projects (customer_name);
CREATE INDEX idx_projects_deployment_region  ON projects (deployment_region);

CREATE UNIQUE INDEX idx_projects_ddns_subdomain ON projects (ddns_subdomain)
  WHERE ddns_subdomain IS NOT NULL;

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select"  ON projects FOR SELECT  TO authenticated USING (true);
CREATE POLICY "projects_insert"  ON projects FOR INSERT  TO authenticated WITH CHECK (true);
CREATE POLICY "projects_update"  ON projects FOR UPDATE  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "projects_delete"  ON projects FOR DELETE  TO authenticated USING (true);


-- -----------------------------------------------------------------------------
-- 3.05  bom_templates
-- Per-tier BOM templates. One row per (tier, hardware_catalog_id) pair.
-- MRP source: BOM template sheet (one template per tier in MRP)
-- -----------------------------------------------------------------------------

CREATE TABLE bom_templates (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  tier                service_tier NOT NULL,
  hardware_catalog_id UUID        NOT NULL REFERENCES hardware_catalog(id) ON DELETE CASCADE,

  qty_per_venue       INTEGER     NOT NULL DEFAULT 0,
  -- Flat quantity per installation (e.g., Mac Mini: 1 per venue)
  qty_per_court       INTEGER     NOT NULL DEFAULT 0,
  -- Multiplied by project.court_count (e.g., iPad: 1 per court, Flic: 2 per court)
  qty_per_door        INTEGER     NOT NULL DEFAULT 0,
  -- Multiplied by project.door_count (Autonomous/Autonomous+ only; Kisi reader: 1/door)
  qty_per_camera      INTEGER     NOT NULL DEFAULT 0,
  -- Multiplied by project.security_camera_count (Autonomous+ only)

  sort_order          INTEGER     NOT NULL DEFAULT 0,
  -- Display order within category in BOM view

  UNIQUE (tier, hardware_catalog_id)
);
-- Quantity formula (computed client-side):
-- qty = qty_per_venue
--     + (qty_per_court  × project.court_count)
--     + (qty_per_door   × project.door_count)
--     + (qty_per_camera × project.security_camera_count)

CREATE INDEX idx_bom_templates_tier ON bom_templates (tier);
CREATE INDEX idx_bom_templates_item ON bom_templates (hardware_catalog_id);

ALTER TABLE bom_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bom_templates_all_authenticated"
  ON bom_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 3.06  project_bom_items
-- Materialized BOM for a specific project. Generated from bom_templates on
-- project creation (or BOM regeneration). Stores computed quantities and costs.
-- MRP source: Per-customer BOM tab; COST ANALYSIS sheet columns
-- -----------------------------------------------------------------------------

CREATE TABLE project_bom_items (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  project_id          UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  hardware_catalog_id UUID        NOT NULL REFERENCES hardware_catalog(id),

  qty                 INTEGER     NOT NULL DEFAULT 0,
  -- Computed from bom_templates formula at generation time

  unit_cost           NUMERIC(10,2),
  -- Copied from hardware_catalog.unit_cost at BOM generation; editable per-project

  est_total_cost      NUMERIC(10,2) GENERATED ALWAYS AS (
    CASE WHEN unit_cost IS NOT NULL THEN qty * unit_cost ELSE NULL END
  ) STORED,
  -- est_total_cost = qty × unit_cost  (COGS — actual amount PodPlay pays vendor)

  shipping_rate       NUMERIC(6,4),
  -- Copied from settings.shipping_rate at generation; overridable per line

  landed_cost         NUMERIC(10,2) GENERATED ALWAYS AS (
    CASE WHEN unit_cost IS NOT NULL
      THEN qty * unit_cost * (1 + COALESCE(shipping_rate, 0.10))
    ELSE NULL END
  ) STORED,
  -- landed_cost = est_total_cost × (1 + shipping_rate)

  margin              NUMERIC(6,4),
  -- Copied from settings.target_margin; overridable per line

  customer_price      NUMERIC(10,2) GENERATED ALWAYS AS (
    CASE WHEN unit_cost IS NOT NULL AND margin IS NOT NULL AND margin < 1.0
      THEN (qty * unit_cost * (1 + COALESCE(shipping_rate, 0.10))) / (1 - margin)
    ELSE NULL END
  ) STORED,
  -- customer_price = landed_cost / (1 - margin)

  allocated           BOOLEAN     NOT NULL DEFAULT false,
  -- True when inventory has been reserved for this project
  shipped             BOOLEAN     NOT NULL DEFAULT false,
  -- True when items have shipped to the venue

  notes               TEXT,

  UNIQUE (project_id, hardware_catalog_id)
);

CREATE TRIGGER project_bom_items_updated_at
  BEFORE UPDATE ON project_bom_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_project_bom_items_project ON project_bom_items (project_id);
CREATE INDEX idx_project_bom_items_item    ON project_bom_items (hardware_catalog_id);

ALTER TABLE project_bom_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_bom_items_all_authenticated"
  ON project_bom_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 3.07  inventory
-- Current stock levels for hardware items. One row per hardware_catalog item.
-- MRP source: INVENTORY sheet — Stock Level, On Hand, Allocated, Available
-- -----------------------------------------------------------------------------

CREATE TABLE inventory (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  hardware_catalog_id UUID        NOT NULL UNIQUE REFERENCES hardware_catalog(id),

  qty_on_hand         INTEGER     NOT NULL DEFAULT 0,
  -- Total units physically in NJ lab / warehouse

  qty_allocated       INTEGER     NOT NULL DEFAULT 0,
  -- Units reserved for active projects (allocated but not yet shipped)

  qty_available       INTEGER     GENERATED ALWAYS AS (qty_on_hand - qty_allocated) STORED,
  -- Available for new projects

  reorder_threshold   INTEGER     NOT NULL DEFAULT 0,
  -- Low stock alert when qty_available <= reorder_threshold

  notes               TEXT
);

CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory_all_authenticated"
  ON inventory FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 3.08  inventory_movements
-- Append-only audit log of every stock change. Enables reconciliation.
-- MRP source: INVENTORY sheet movement rows (PO received, shipped, adjusted)
-- -----------------------------------------------------------------------------

CREATE TABLE inventory_movements (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  hardware_catalog_id UUID        NOT NULL REFERENCES hardware_catalog(id),
  project_id          UUID        REFERENCES projects(id) ON DELETE SET NULL,
  -- NULL for non-project movements (PO received, manual adjustments)

  movement_type       inventory_movement_type NOT NULL,

  qty_delta           INTEGER     NOT NULL,
  -- Positive = increase (received, return), Negative = decrease (shipped, allocated)

  reference           TEXT,
  -- PO number, shipment tracking number, or manual note
  notes               TEXT
);

CREATE INDEX idx_inventory_movements_item    ON inventory_movements (hardware_catalog_id);
CREATE INDEX idx_inventory_movements_project ON inventory_movements (project_id);
CREATE INDEX idx_inventory_movements_created ON inventory_movements (created_at DESC);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inventory_movements_all_authenticated"
  ON inventory_movements FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 3.09  purchase_orders
-- PO header per vendor order. One PO per vendor shipment.
-- MRP source: ORDER INPUT sheet — vendor, date, items, total cost
-- PO number format: PO-{YYYY}-{NNN} (e.g., PO-2026-001)
-- -----------------------------------------------------------------------------

CREATE TABLE purchase_orders (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  po_number       TEXT        NOT NULL UNIQUE,
  -- Auto-generated: PO-{YYYY}-{NNN}

  vendor          TEXT        NOT NULL,
  project_id      UUID        REFERENCES projects(id) ON DELETE SET NULL,
  -- NULL for stock replenishment POs not tied to a specific project

  order_date      DATE        NOT NULL,
  expected_date   DATE,
  received_date   DATE,
  total_cost      NUMERIC(10,2),

  status          TEXT        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','ordered','partial','received','cancelled')),

  tracking_number TEXT,
  notes           TEXT
);

CREATE TRIGGER purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_purchase_orders_project ON purchase_orders (project_id);
CREATE INDEX idx_purchase_orders_status  ON purchase_orders (status);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "purchase_orders_all_authenticated"
  ON purchase_orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 3.10  purchase_order_items
-- Line items within a PO.
-- MRP source: ORDER INPUT sheet rows
-- -----------------------------------------------------------------------------

CREATE TABLE purchase_order_items (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id   UUID        NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  hardware_catalog_id UUID        NOT NULL REFERENCES hardware_catalog(id),

  qty_ordered         INTEGER     NOT NULL,
  qty_received        INTEGER     NOT NULL DEFAULT 0,
  unit_cost           NUMERIC(10,2) NOT NULL,
  line_total          NUMERIC(10,2) GENERATED ALWAYS AS (qty_ordered * unit_cost) STORED,
  notes               TEXT
);

CREATE INDEX idx_po_items_po   ON purchase_order_items (purchase_order_id);
CREATE INDEX idx_po_items_item ON purchase_order_items (hardware_catalog_id);

ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "po_items_all_authenticated"
  ON purchase_order_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 3.11  deployment_checklist_templates
-- Seed data for all 16 deployment phases (Phase 0–15). Instantiated per-project.
-- MRP source: Deployment checklist tabs; Venue Deployment Guide phases 0–15
-- sort_order = phase * 100 + step_number
-- Populated from seed-data.md (deployment checklist templates section)
-- -----------------------------------------------------------------------------

CREATE TABLE deployment_checklist_templates (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),

  phase           INTEGER NOT NULL CHECK (phase >= 0 AND phase <= 15),
  -- 0: Pre-Purchase & Planning
  -- 1: Pre-Configuration (PodPlay Office)
  -- 2: Unboxing & Labeling
  -- 3: Network Rack Assembly
  -- 4: Networking Setup (UniFi)
  -- 5: ISP Router Configuration
  -- 6: Camera Configuration
  -- 7: DDNS Setup (FreeDNS)
  -- 8: Mac Mini Setup
  -- 9: Replay Service Deployment (V1)
  -- 10: iPad Setup
  -- 11: Apple TV Setup
  -- 12: Physical Installation (On-Site)
  -- 13: Testing & Verification
  -- 14: Health Monitoring Setup
  -- 15: Packaging, Shipping & Handoff

  phase_name      TEXT    NOT NULL,

  step_number     INTEGER NOT NULL,
  -- 1-based, sequential within phase

  title           TEXT    NOT NULL,
  -- Short action title (e.g., "Create REPLAY VLAN")

  description     TEXT    NOT NULL,
  -- Full instructions. Tokens: {{CUSTOMER_NAME}}, {{COURT_COUNT}},
  -- {{DDNS_SUBDOMAIN}}, {{UNIFI_SITE_NAME}}, {{MAC_MINI_USERNAME}}, {{LOCATION_ID}}

  warnings        TEXT[],
  -- Critical red-box warnings shown before step can be checked off

  auto_fill_tokens TEXT[],
  -- Tokens this step resolves from project data (e.g., ARRAY['CUSTOMER_NAME','DDNS_SUBDOMAIN'])

  applicable_tiers service_tier[],
  -- NULL = all tiers. Kisi steps: ['autonomous','autonomous_plus']. NVR: ['autonomous_plus'].

  is_v2_only      BOOLEAN NOT NULL DEFAULT false,
  -- True if step only applies when replay_service_version = 'v2'

  sort_order      INTEGER NOT NULL,
  -- Global: phase * 100 + step_number

  UNIQUE (phase, step_number)
);

CREATE INDEX idx_checklist_templates_phase ON deployment_checklist_templates (phase);

ALTER TABLE deployment_checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_templates_read"
  ON deployment_checklist_templates FOR SELECT
  TO authenticated
  USING (true);
-- Templates are read-only reference data; only modified via migrations.


-- -----------------------------------------------------------------------------
-- 3.12  deployment_checklist_items
-- Per-project checklist instantiated from templates at Stage 3 entry.
-- Tokens in description/warnings replaced with actual project values.
-- MRP source: Per-customer status tab — each row = one checkbox
-- -----------------------------------------------------------------------------

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
  -- Copied from template with {{TOKEN}} placeholders replaced by project values

  warnings        TEXT[],
  -- Copied from template

  is_completed    BOOLEAN     NOT NULL DEFAULT false,
  completed_at    TIMESTAMPTZ,

  notes           TEXT,
  -- Free-form ops notes added during this step

  UNIQUE (project_id, template_id)
);

CREATE TRIGGER deployment_checklist_items_updated_at
  BEFORE UPDATE ON deployment_checklist_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_checklist_items_project ON deployment_checklist_items (project_id);
CREATE INDEX idx_checklist_items_phase   ON deployment_checklist_items (project_id, phase);

ALTER TABLE deployment_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_items_all_authenticated"
  ON deployment_checklist_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 3.13  invoices
-- Two invoices per project: deposit (50%) and final (50%).
-- MRP source: INVOICING sheet — invoice number, amount, date sent, date paid
-- Constraint: exactly one deposit + one final invoice per project.
-- -----------------------------------------------------------------------------

CREATE TABLE invoices (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  project_id      UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  invoice_type    TEXT        NOT NULL CHECK (invoice_type IN ('deposit','final')),
  -- deposit: sent after contract signing (~50% of total)
  -- final:   sent after go-live

  invoice_number  TEXT,
  -- External invoice number from billing system (QuickBooks / Stripe)

  hardware_subtotal  NUMERIC(10,2),
  -- SUM(project_bom_items.customer_price) for this project

  service_fee        NUMERIC(10,2),
  -- tier venue fee + (court_count × tier court fee)
  -- Pro:         5000 + (courts × 2500)
  -- Autonomous:  7500 + (courts × 2500)
  -- Autonomous+: 7500 + (courts × 2500)
  -- PBK:         pbk_venue_fee + (courts × pbk_court_fee)

  subtotal           NUMERIC(10,2) GENERATED ALWAYS AS (
    COALESCE(hardware_subtotal,0) + COALESCE(service_fee,0)
  ) STORED,

  tax_rate           NUMERIC(6,4),
  -- Copied from settings.sales_tax_rate at invoice creation (default 10.25%)

  tax_amount         NUMERIC(10,2) GENERATED ALWAYS AS (
    (COALESCE(hardware_subtotal,0) + COALESCE(service_fee,0))
    * COALESCE(tax_rate, 0.1025)
  ) STORED,

  total_amount       NUMERIC(10,2) GENERATED ALWAYS AS (
    (COALESCE(hardware_subtotal,0) + COALESCE(service_fee,0))
    * (1 + COALESCE(tax_rate, 0.1025))
  ) STORED,

  deposit_pct        NUMERIC(6,4) DEFAULT 0.50,
  -- Fraction of total billed on this invoice (deposit: 0.50; final: remaining)

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

CREATE POLICY "invoices_all_authenticated"
  ON invoices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 3.14  expenses
-- Per-project expenses across 12 categories.
-- MRP source: EXPENSES sheet — date, project, category, amount, payment method
-- -----------------------------------------------------------------------------

CREATE TABLE expenses (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  project_id      UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  expense_date    DATE        NOT NULL,
  category        expense_category NOT NULL,
  amount          NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  payment_method  payment_method NOT NULL,

  description     TEXT,
  -- e.g., "Delta ATL-EWR round trip", "Marriott 3 nights"
  receipt_url     TEXT,
  notes           TEXT
);

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_expenses_project  ON expenses (project_id);
CREATE INDEX idx_expenses_category ON expenses (category);
CREATE INDEX idx_expenses_date     ON expenses (expense_date DESC);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_all_authenticated"
  ON expenses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 3.15  replay_signs
-- Replay sign fulfillment per project. qty = court_count × 2.
-- Auto-created at Stage 2 entry (all tiers). One row per project.
-- MRP source: "Customer Replay Signs" sheet
-- -----------------------------------------------------------------------------

CREATE TABLE replay_signs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  project_id      UUID        NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,

  qty             INTEGER     NOT NULL,
  -- Copied from projects.replay_sign_count (court_count × 2) at row creation

  status          sign_status NOT NULL DEFAULT 'staged',

  outreach_channel TEXT CHECK (outreach_channel IN ('slack','email','other')),
  outreach_date   DATE,
  -- When PodPlay ops contacted vendor (Fast Signs)

  shipped_date    DATE,
  delivered_date  DATE,
  installed_date  DATE,

  tracking_number TEXT,
  vendor_order_id TEXT,
  -- Fast Signs order reference / confirmation number

  notes           TEXT
);

CREATE TRIGGER replay_signs_updated_at
  BEFORE UPDATE ON replay_signs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_replay_signs_project ON replay_signs (project_id);
CREATE INDEX idx_replay_signs_status  ON replay_signs (status);

ALTER TABLE replay_signs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "replay_signs_all_authenticated"
  ON replay_signs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 3.16  cc_terminals
-- BBPOS WisePOS E terminal ordering and delivery tracking per project.
-- Auto-created at Stage 2 entry when has_front_desk = true. One row per project.
-- Ordered via Stripe (NOT standard PO flow). Default PIN: settings.cc_terminal_pin.
-- MRP source: "CC Form" sheet
-- -----------------------------------------------------------------------------

CREATE TABLE cc_terminals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  project_id      UUID        NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,

  qty             INTEGER     NOT NULL DEFAULT 1,
  status          cc_terminal_status NOT NULL DEFAULT 'not_ordered',

  order_date      DATE,
  expected_date   DATE,
  delivered_date  DATE,
  installed_date  DATE,

  stripe_order_id TEXT,
  -- Stripe hardware order reference (BBPOS WisePOS E ordered via Stripe dashboard)

  cost_per_unit   NUMERIC(10,2) DEFAULT 249.00,
  -- $249.00 per BBPOS WisePOS E; used in project expense summary

  notes           TEXT
);

CREATE TRIGGER cc_terminals_updated_at
  BEFORE UPDATE ON cc_terminals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE cc_terminals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cc_terminals_all_authenticated"
  ON cc_terminals FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 3.17  monthly_opex_snapshots
-- Period-based team OpEx data for HER (Hardware Efficiency Ratio) calculation.
-- One row per calendar month. Set at month-close.
-- MRP source: FINANCIALS tab (period-based reporting)
-- -----------------------------------------------------------------------------

CREATE TABLE monthly_opex_snapshots (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  period_year     INTEGER     NOT NULL CHECK (period_year >= 2020 AND period_year <= 2050),
  period_month    INTEGER     NOT NULL CHECK (period_month >= 1 AND period_month <= 12),

  -- Team inputs (copied from settings/team_opex at month-close for historical accuracy)
  niko_monthly_salary       NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  niko_direct_allocation    NUMERIC(6,4)  NOT NULL DEFAULT 0.50,
  chad_monthly_salary       NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  chad_indirect_allocation  NUMERIC(6,4)  NOT NULL DEFAULT 0.20,
  monthly_rent              NUMERIC(10,2) NOT NULL DEFAULT 2300.00,
  -- $27,600/yr ÷ 12 = $2,300/mo
  monthly_indirect_salaries NUMERIC(10,2) NOT NULL DEFAULT 12250.00,
  -- $147,000/yr ÷ 12 = $12,250/mo

  -- Hardware revenue for this period
  hardware_revenue          NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  -- SUM(invoice.hardware_subtotal) WHERE invoice_type='final' AND date_paid IN period

  -- Computed HER fields
  team_hardware_spend       NUMERIC(10,2) GENERATED ALWAYS AS (
    (niko_monthly_salary * niko_direct_allocation)
    + (niko_monthly_salary * (1 - niko_direct_allocation) * 0.50)
    + (chad_monthly_salary * chad_indirect_allocation)
    + monthly_rent
    + (monthly_indirect_salaries * 0.20)
  ) STORED,
  -- Formula: Niko direct + Niko indirect half + Chad indirect + rent + 20% indirect pool
  -- NOTE: exact formula pending XLSX FINANCIALS sheet confirmation

  her_ratio                 NUMERIC(10,4) GENERATED ALWAYS AS (
    CASE WHEN (
      (niko_monthly_salary * niko_direct_allocation)
      + (niko_monthly_salary * (1 - niko_direct_allocation) * 0.50)
      + (chad_monthly_salary * chad_indirect_allocation)
      + monthly_rent
      + (monthly_indirect_salaries * 0.20)
    ) > 0 THEN
      hardware_revenue / (
        (niko_monthly_salary * niko_direct_allocation)
        + (niko_monthly_salary * (1 - niko_direct_allocation) * 0.50)
        + (chad_monthly_salary * chad_indirect_allocation)
        + monthly_rent
        + (monthly_indirect_salaries * 0.20)
      )
    ELSE NULL END
  ) STORED,
  -- HER = hardware_revenue / team_hardware_spend
  -- Target: > 1.0 (revenue exceeds team cost); healthy = 2.0+

  notes           TEXT,

  UNIQUE (period_year, period_month)
);

CREATE TRIGGER monthly_opex_snapshots_updated_at
  BEFORE UPDATE ON monthly_opex_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_monthly_opex_period ON monthly_opex_snapshots (period_year DESC, period_month DESC);

ALTER TABLE monthly_opex_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_opex_all_authenticated"
  ON monthly_opex_snapshots FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 3.18  troubleshooting_tips
-- 16 known issue/solution pairs from Deployment Guide Appendix A.
-- Shown contextually in deployment wizard by phase.
-- Seed data: see Section 4 of this file.
-- -----------------------------------------------------------------------------

CREATE TABLE troubleshooting_tips (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),

  phase_number    INTEGER CHECK (phase_number >= 0 AND phase_number <= 15),
  -- NULL = applies globally (not phase-specific)

  issue           TEXT    NOT NULL,
  -- Short problem description — shown as the tip title

  solution        TEXT    NOT NULL,
  -- Full resolution steps — shown as the tip body

  support_tier    INTEGER NOT NULL CHECK (support_tier IN (1,2,3)),
  -- 1 = On-site / remote ops (basic restart, button battery, connectivity check)
  -- 2 = Config specialist (Nico-level: VLAN changes, Mosyle, DDNS, service restart)
  -- 3 = Engineer / developer (Patrick-level: replay code, encoding, port 4000)

  severity        TEXT    NOT NULL DEFAULT 'warning'
                  CHECK (severity IN ('info','warning','critical')),
  -- critical = blocks deployment if not resolved
  -- warning  = watch out for
  -- info     = FYI, non-blocking

  sort_order      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_troubleshooting_phase ON troubleshooting_tips (phase_number);
CREATE INDEX idx_troubleshooting_tier  ON troubleshooting_tips (support_tier);

ALTER TABLE troubleshooting_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "troubleshooting_tips_all_authenticated"
  ON troubleshooting_tips FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 3.19  team_opex
-- Per-team-member OpEx allocations for HER and P&L reporting.
-- MRP source: HER sheet / FINANCIALS tab salary rows
-- -----------------------------------------------------------------------------

CREATE TABLE team_opex (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  name              TEXT        NOT NULL,
  role              TEXT        NOT NULL DEFAULT '',

  annual_salary     NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  -- 0 until confirmed from XLSX HER sheet

  direct_pct        NUMERIC(5,4) NOT NULL DEFAULT 0.00
                    CHECK (direct_pct >= 0 AND direct_pct <= 1),
  -- Fraction of time on direct hardware/installation work

  indirect_pct      NUMERIC(5,4) NOT NULL DEFAULT 0.00
                    CHECK (indirect_pct >= 0 AND indirect_pct <= 1),
  -- Fraction of time on indirect/overhead work

  CONSTRAINT direct_indirect_sum CHECK (direct_pct + indirect_pct <= 1.0000)
);

CREATE TRIGGER team_opex_updated_at
  BEFORE UPDATE ON team_opex
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE UNIQUE INDEX team_opex_name_unique ON team_opex (lower(name));

ALTER TABLE team_opex ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_opex_all_authenticated"
  ON team_opex FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 3.20  device_migrations
-- Apple Business Manager (ABM) org transfer events.
-- One row per migration event (may cover multiple devices for the same venue).
-- MRP source: Appendix E (ABM transfer workflow), Appendix F Q9-Q11
-- -----------------------------------------------------------------------------

CREATE TABLE device_migrations (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  project_id            UUID REFERENCES projects(id) ON DELETE SET NULL,
  -- Nullable — migration may be initiated before project is created

  migration_label       TEXT        NOT NULL,
  -- Human-readable label (e.g., "PingPod Brooklyn → Cosmos PH")

  source_org_name       TEXT        NOT NULL,
  -- e.g., "PingPod Inc"
  source_abm_org_id     TEXT,

  target_org_name       TEXT        NOT NULL,
  -- e.g., "Cosmos PH"
  target_abm_org_id     TEXT,
  target_mdm            mdm_provider NOT NULL DEFAULT 'mosyle',
  target_mosyle_group   TEXT,
  -- Pattern: "{Client} - {VenueName}" (e.g., "Cosmos PH - Quezon City")

  status                device_migration_status NOT NULL DEFAULT 'planning',

  initiated_date        DATE,
  devices_released_date DATE,
  devices_enrolled_date DATE,
  configs_applied_date  DATE,
  completed_date        DATE,

  notes                 TEXT
);

CREATE TRIGGER device_migrations_updated_at
  BEFORE UPDATE ON device_migrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_device_migrations_project ON device_migrations (project_id);
CREATE INDEX idx_device_migrations_status  ON device_migrations (status);

ALTER TABLE device_migrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "device_migrations_all_authenticated"
  ON device_migrations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 3.21  device_migration_items
-- One row per physical device within a migration event.
-- Serial number is the canonical identifier (from Apple Configurator / Mosyle).
-- MRP source: Appendix E device list
-- -----------------------------------------------------------------------------

CREATE TABLE device_migration_items (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  migration_id    UUID        NOT NULL REFERENCES device_migrations(id) ON DELETE CASCADE,

  serial_number   TEXT        NOT NULL,
  -- Apple 12-character serial number

  device_type     migration_device_type NOT NULL,

  court_number    INTEGER CHECK (court_number >= 1),
  -- NULL for Mac Mini (one per venue, not per court)

  target_mdm_label TEXT,
  -- iPad pattern:    "iPad {Client} Court {N}"    (Phase 10 Step 91)
  -- Apple TV pattern: "AppleTV {Client} Court {N}" (Phase 11 Step 96b)
  -- Mac Mini pattern: "{Client} Mac Mini"

  status          migration_device_status NOT NULL DEFAULT 'pending',

  enrolled_at     TIMESTAMPTZ,
  configured_at   TIMESTAMPTZ,

  enrollment_order INTEGER,
  -- Expected power-on sequence (1=first, 2=second...). Critical for iPad court mapping.
  -- WARNING: iPads must be powered on in court-number order.
  -- Mosyle enrolls in power-on order. Wrong order = wrong court mapping.

  notes           TEXT,

  CONSTRAINT uq_migration_serial UNIQUE (migration_id, serial_number)
);

CREATE TRIGGER device_migration_items_updated_at
  BEFORE UPDATE ON device_migration_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_migration_items_migration ON device_migration_items (migration_id);
CREATE INDEX idx_migration_items_serial    ON device_migration_items (serial_number);
CREATE INDEX idx_migration_items_status    ON device_migration_items (status);

ALTER TABLE device_migration_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "device_migration_items_all_authenticated"
  ON device_migration_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- -----------------------------------------------------------------------------
-- 3.22  deployment_regions
-- Region-specific configuration: ISP requirements, warnings, open questions.
-- Drives international validation warnings in wizard.
-- Seed data: 'us' and 'philippines' rows.
-- -----------------------------------------------------------------------------

CREATE TABLE deployment_regions (
  id                      TEXT        PRIMARY KEY,
  -- 'us', 'philippines'

  display_name            TEXT        NOT NULL,

  power_standard          power_standard NOT NULL,
  video_standard          video_standard NOT NULL,

  requires_business_plan  BOOLEAN     NOT NULL DEFAULT false,
  requires_static_ip      BOOLEAN     NOT NULL DEFAULT false,

  requires_dual_isp       TEXT,
  -- NULL = never required; 'autonomous' = required for autonomous/autonomous_plus tier

  starlink_blocked        BOOLEAN     NOT NULL DEFAULT true,

  supported_isps          JSONB       NOT NULL DEFAULT '[]',
  -- Array of {name, plan_name} objects

  isp_warning             TEXT,
  power_warning           TEXT,
  video_warning           TEXT,

  open_questions          JSONB       NOT NULL DEFAULT '[]',
  -- Array of {id, question, category, priority, status, resolution}

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER deployment_regions_updated_at
  BEFORE UPDATE ON deployment_regions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE deployment_regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deployment_regions_read"
  ON deployment_regions FOR SELECT
  TO authenticated
  USING (true);
-- Reference data — read-only for app users; managed via migrations.


-- -----------------------------------------------------------------------------
-- 3.23  network_vlans
-- VLAN architecture reference. 4 rows — one per VLAN used in PodPlay deployments.
-- Source: Deployment guide Phase 4 Steps 42-44, Appendix C.
-- Read-only reference data; not editable by app users.
-- -----------------------------------------------------------------------------

CREATE TABLE network_vlans (
  id                  TEXT        PRIMARY KEY,
  -- 'default', 'replay', 'surveillance', 'access_control'

  display_name        TEXT        NOT NULL,
  vlan_id             INTEGER,
  -- NULL for Default (untagged). 32=REPLAY, 31=SURVEILLANCE, 33=ACCESS_CONTROL.

  subnet              TEXT        NOT NULL,
  -- CIDR: 192.168.30.0/24, 192.168.32.0/24, 192.168.31.0/24, 192.168.33.0/24

  gateway_ip          TEXT        NOT NULL,
  -- REPLAY: 192.168.32.254 (Step 42). Others: .254 per convention.

  dhcp_start          TEXT,
  dhcp_end            TEXT,

  mdns_enabled        BOOLEAN     NOT NULL DEFAULT false,
  -- TRUE only for REPLAY VLAN (required for Apple TV ↔ iPad mDNS discovery)

  allows_internet     BOOLEAN     NOT NULL DEFAULT true,

  required_for_tiers  TEXT[],
  -- NULL = all tiers. ARRAY['autonomous_plus'] for SURVEILLANCE.
  -- ARRAY['autonomous','autonomous_plus'] for ACCESS_CONTROL.

  is_conditional      BOOLEAN     NOT NULL DEFAULT false,
  -- FALSE = always create (Default, REPLAY). TRUE = tier-dependent.

  notes               TEXT,
  sort_order          INTEGER     NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE network_vlans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "network_vlans_read"
  ON network_vlans FOR SELECT
  TO authenticated
  USING (true);


-- -----------------------------------------------------------------------------
-- 3.24  isp_bandwidth_requirements
-- Minimum ISP speeds per court count range. 5 rows covering 1–30+ courts.
-- Source: Deployment guide Phase 0 Step 5, Appendix C.
-- Used in intake wizard ISP validation (Stage 1, Step 5).
-- -----------------------------------------------------------------------------

CREATE TABLE isp_bandwidth_requirements (
  id                  SERIAL      PRIMARY KEY,

  court_min           INTEGER     NOT NULL,
  -- Lower bound of court count range (inclusive): 1, 5, 12, 20, 25

  court_max           INTEGER,
  -- Upper bound (inclusive). NULL = no upper limit (25+ courts)

  fiber_mbps          INTEGER     NOT NULL,
  -- Minimum symmetric Mbps for fiber ISP

  cable_upload_mbps   INTEGER,
  -- Minimum upload Mbps for cable. NULL = "highest possible" (no hard floor)

  cable_note          TEXT,
  -- Human-readable cable guidance shown in wizard

  dedicated_mbps      INTEGER     NOT NULL,
  -- Minimum symmetric Mbps for dedicated circuit

  sort_order          INTEGER     NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE isp_bandwidth_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "isp_bandwidth_read"
  ON isp_bandwidth_requirements FOR SELECT
  TO authenticated
  USING (true);


-- -----------------------------------------------------------------------------
-- 3.25  team_contacts
-- Internal PodPlay team directory. Seeded once; editable in Settings > Team.
-- Source: Appendix C Key Contacts, Appendix D Support Tiers
-- -----------------------------------------------------------------------------

CREATE TABLE team_contacts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  slug          TEXT        NOT NULL UNIQUE,
  -- 'andy', 'nico', 'chad', 'stan', 'agustin', 'cs-team', 'patrick'

  name          TEXT        NOT NULL,
  role          TEXT        NOT NULL,
  department    TEXT        NOT NULL,
  -- 'pm', 'hardware', 'operations', 'config', 'app', 'cs', 'engineering'

  phone         TEXT,
  email         TEXT,
  contact_via   TEXT,
  -- e.g., 'Via Chad', 'Slack #installs'. NULL if direct contact.

  support_tier  SMALLINT    CHECK (support_tier IN (1,2,3)),
  -- NULL if not a support escalation contact
  -- 1 = On-site / remote ops
  -- 2 = Config specialist (VLAN, Mosyle, DDNS, service restart)
  -- 3 = Engineer / developer (replay code, port 4000, encoding)

  notes         TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT true
);

CREATE TRIGGER team_contacts_updated_at
  BEFORE UPDATE ON team_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_team_contacts_slug       ON team_contacts (slug);
CREATE INDEX idx_team_contacts_department ON team_contacts (department);
CREATE INDEX idx_team_contacts_tier       ON team_contacts (support_tier)
  WHERE support_tier IS NOT NULL;

ALTER TABLE team_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_contacts_select"
  ON team_contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "team_contacts_insert"
  ON team_contacts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "team_contacts_update"
  ON team_contacts FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "team_contacts_delete"
  ON team_contacts FOR DELETE
  TO authenticated
  USING (true);


-- =============================================================================
-- 4. SEED DATA
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 4.01  settings — default row (id = 1, always present)
-- -----------------------------------------------------------------------------

INSERT INTO settings (
  id,
  pro_venue_fee, pro_court_fee,
  autonomous_venue_fee, autonomous_court_fee,
  autonomous_plus_venue_fee, autonomous_plus_court_fee,
  pbk_venue_fee, pbk_court_fee,
  shipping_rate, target_margin, sales_tax_rate, deposit_pct,
  labor_rate_per_hour, hours_per_day,
  lodging_per_day, airfare_default,
  rent_per_year, indirect_salaries_per_year,
  switch_24_max_courts, switch_48_max_courts,
  ssd_1tb_max_courts, ssd_2tb_max_courts,
  nvr_4bay_max_cameras,
  isp_fiber_mbps_per_court, isp_cable_upload_min_mbps,
  default_replay_service_version,
  po_number_prefix, mac_mini_local_ip,
  replay_vlan_id, surveillance_vlan_id, access_control_vlan_id, default_vlan_id,
  replay_port, ddns_domain, cc_terminal_pin,
  label_sets_per_court, replay_sign_multiplier
) VALUES (
  1,
  5000.00, 2500.00,                   -- pro fees
  7500.00, 2500.00,                   -- autonomous fees
  7500.00, 2500.00,                   -- autonomous_plus fees
  0.00, 0.00,                         -- pbk fees (must be configured before use)
  0.10, 0.10, 0.1025, 0.50,          -- shipping 10%, margin 10%, tax 10.25%, deposit 50%
  120.00, 10,                         -- labor $120/hr, 10 hrs/day
  250.00, 1800.00,                    -- lodging $250/night, airfare $1800 default
  27600.00, 147000.00,                -- rent $27.6K/yr, indirect salaries $147K/yr
  10, 20,                             -- switch breakpoints (estimate; confirm from XLSX)
  4, 12,                              -- SSD breakpoints (estimate; confirm from XLSX)
  4,                                  -- NVR 4-bay max cameras (estimate; confirm from XLSX)
  12, 60,                             -- ISP thresholds
  'v1',                               -- default replay service version
  'PO', '192.168.32.100',             -- PO prefix, Mac Mini fixed IP
  32, 31, 33, 30,                     -- VLAN IDs: replay, surveillance, access_control, default
  4000, 'podplaydns.com', '07139',    -- replay port, DDNS domain, CC terminal PIN
  5, 2                                -- label sets per court, replay signs per court
) ON CONFLICT (id) DO NOTHING;


-- -----------------------------------------------------------------------------
-- 4.02  team_opex — initial allocations
-- annual_salary = 0 until confirmed from XLSX HER sheet
-- -----------------------------------------------------------------------------

INSERT INTO team_opex (name, role, annual_salary, direct_pct, indirect_pct) VALUES
  ('Niko',  'Hardware & Installs Lead',  0.00, 0.50, 0.50),
  -- 50% direct (hardware config + installs), 50% indirect
  ('Chad',  'Ops / Former Installer',    0.00, 0.00, 0.20),
  -- 0% direct hardware, 20% indirect overhead
  ('Andy',  'Project Manager / Intake',  0.00, 0.00, 0.00),
  ('Stan',  'Config Specialist',         0.00, 0.50, 0.50);
-- Salaries unknown; set to 0 until confirmed from XLSX


-- -----------------------------------------------------------------------------
-- 4.03  troubleshooting_tips — 16 known issue/solution pairs from Appendix A
-- Source: Venue Deployment Guide Appendix A (troubleshooting table)
-- -----------------------------------------------------------------------------

INSERT INTO troubleshooting_tips (phase_number, issue, solution, support_tier, severity, sort_order) VALUES

  -- Mac Mini / Hardware issues
  (8,
   'Mac Mini crashes or freezes during configuration',
   'Ensure Mac Mini has breathing room in rack — overheating is the primary cause. Remove items blocking airflow above Mac Mini. If crash persists, perform SMC reset: hold Ctrl+Opt+Shift+Power for 10 seconds while unplugged, then reconnect and power on. Check Activity Monitor for runaway processes after restart.',
   2, 'critical', 10),

  -- PoE / Power issues
  (3,
   'Device not receiving power via PoE',
   'Verify the PoE switch port is enabled and the port profile includes PoE. Check cable length — PoE power loss is significant beyond 90m (under 100m rated max). Try a shorter patch cable between device and switch to isolate. Confirm device supports 802.3af/at. Check switch PoE power budget — verify total PoE draw does not exceed switch capacity (USW-Pro-24-POE: 400W; USW-Pro-48-POE: 600W).',
   2, 'warning', 20),

  -- Flic button pairing
  (9,
   'Flic buttons not pairing or not registering button presses',
   'App Lock must be OFF before Flic button pairing. Open Flic app on iPad, disable App Lock via Mosyle temporarily, pair all buttons for this court (Left and Right). Confirm each button registers in the Flic app. After pairing, re-enable App Lock (set to 2:00–3:00 AM daily window). If button is already paired to another device, hold button 10 seconds to reset Bluetooth pairing.',
   1, 'warning', 30),

  -- DDNS / port 4000 not reachable from outside
  (7,
   'DDNS subdomain not resolving or port 4000 unreachable from external network',
   'Step 1: Verify FreeDNS account has the correct subdomain pointing to the venue\'s public IP. Step 2: Confirm ISP router has port 4000 forwarded to UDM WAN IP. Step 3: Confirm UDM has port 4000 forwarded to Mac Mini at 192.168.32.100. Step 4: Test from external network (phone hotspot): curl http://{subdomain}.podplaydns.com:4000/health. If still unreachable, check if ISP uses CGNAT — Starlink and some cable providers block inbound ports. Contact Nico (Tier 2) if port forward chain is correct but still blocked.',
   2, 'critical', 40),

  -- Port 4000 architecture
  (9,
   'Replay API returns 502/503 or health check fails after service start',
   'Port 4000 is the single entry point for all replay traffic (cloud sync, instant replay, health checks). Check Mac Mini replay service is running: open Terminal, run `pm2 status` or check the replay service process. If stopped: `cd ~/replay && pm2 start ecosystem.config.js`. If pm2 shows crashed, check logs: `pm2 logs replay`. Common cause: SSD disconnected or wrong SSD path in config. Escalate to Patrick (Tier 3) if service crashes in a loop.',
   2, 'critical', 50),

  -- .DS_Store issue
  (8,
   '.DS_Store files causing issues on Samsung SSD during replay service startup',
   'MacOS automatically creates .DS_Store files on any mounted volume. The replay service may fail to find video clips if .DS_Store is in the clips directory. Run in Terminal: `find /Volumes/SSDName -name ".DS_Store" -delete`. Then prevent future creation: `defaults write com.apple.desktopservices DSDontWriteNetworkStores -bool true`. Confirm in replay service config that the clip path points to the Samsung SSD mount point.',
   2, 'info', 60),

  -- Camera pixelation (V1 known issue)
  (6,
   'Replay camera footage is pixelated or has blocky artifacts',
   'This is a known issue with the V1 replay service which uses UDP for video transport. UDP drops packets under network congestion, causing pixelation. Mitigation: reduce bitrate in camera encoding settings (Sub-stream 512Kbps is the documented working value). Permanent fix: upgrade to V2 replay service (expected April 2026) which uses TCP and eliminates this. Escalate to Patrick (Tier 3) to schedule V2 upgrade.',
   3, 'warning', 70),

  -- Firebase re-sync
  (13,
   'Replay clips appear in local replay service but not in the PodPlay app',
   'The replay service syncs clips to Firebase after recording. If clips are local but not in the app, the Firebase sync may have stalled. In Terminal on Mac Mini: check replay service logs `pm2 logs replay` for Firebase sync errors. If sync timeout: restart the service `pm2 restart replay`. If the issue persists after restart, verify `FIREBASE_CONFIG` env variable in the replay service config matches the credentials for this venue\'s location_id. Contact Patrick (Tier 3) if env is correct but sync still fails.',
   3, 'warning', 80),

  -- Camera configuration order
  (6,
   'Multiple cameras have the same IP address (192.168.1.108) and cannot be distinguished',
   'All EmpireTech cameras ship with factory default IP 192.168.1.108. You MUST configure ONE camera at a time. Unbox one camera, connect to the Default VLAN (192.168.1.x subnet), navigate to 192.168.1.108, configure encoding + VLAN assignment, then disconnect before connecting the next camera. If multiple cameras are connected simultaneously to the same switch, they will have an IP conflict and none will be reachable.',
   2, 'critical', 90),

  -- UniFi site adoption
  (4,
   'UDM not appearing in UniFi app for adoption',
   'Ensure you are signed into the PingPodIT account in the UniFi app (not a personal account). UDM must be on the same local network as the phone running the UniFi app. If UDM is not discovered: reset UDM to factory defaults (hold reset button 10 seconds), then retry. Confirm UDM is powered on and ethernet cable is connected to LAN port (not WAN). If still not discovered, try UniFi app on a laptop connected via ethernet.',
   2, 'warning', 100),

  -- iPad App Lock not activating
  (10,
   'App Lock not activating on iPad or kiosk app not staying in foreground',
   'App Lock is configured via Mosyle MDM profile. Verify the "Install App" profile with the P-List (LOCATION_ID) was pushed to the device group. In Mosyle, confirm the device appears in the correct group (e.g., "{{CUSTOMER_NAME}} iPads") and the App Lock schedule is set to 24/7 EXCEPT 2:00–3:00 AM maintenance window. If Mosyle profile shows pending: force-sync by opening Mosyle on the iPad (briefly disable App Lock, open Mosyle app, close, re-enable).',
   2, 'warning', 110),

  -- Apple TV not showing replay
  (11,
   'Apple TV displays spinning wheel or "No Signal" instead of replay content',
   'Step 1: Verify Apple TV is on the REPLAY VLAN (192.168.32.x). Check UniFi switch port profile for the Apple TV port. Step 2: Verify mDNS is enabled on the REPLAY VLAN in UniFi (required for Apple TV to discover the Mac Mini). Step 3: On Apple TV, open the PodPlay app and check if it shows the correct venue. If wrong venue, the P-List LOCATION_ID may be incorrect — check Mosyle profile. Step 4: Confirm replay service is running on Mac Mini (port 4000).',
   2, 'warning', 120),

  -- Kisi access control not working
  (4,
   'Kisi door reader not responding or access control not functioning',
   'Verify Kisi Controller Pro 2 is on the ACCESS CONTROL VLAN (192.168.33.x). Check UniFi switch port for Kisi controller is on VLAN 33. Confirm 10ft Cat6 patch cable (NET-PATCH-10FT) connects switch to Kisi controller — Kisi requires longer cable due to rack placement. Log into Kisi dashboard and verify controller is online. If controller shows offline: power cycle the controller from the rack. Contact Kisi support for firmware issues.',
   2, 'warning', 130),

  -- ISP router not cooperating with port forward
  (5,
   'ISP router does not allow port 4000 port forward or blocks access',
   'Some ISP routers (especially in business cable plans) have built-in firewalls that block non-standard port forwarding. Options in order of preference: (1) Request static IP + DMZ from ISP — put UDM WAN IP in DMZ, which passes all traffic to UDM. (2) Configure port 4000 forward in both ISP router AND UDM. (3) Ask venue to request ISP router in bridge mode so UDM controls NAT. Note: Starlink is NOT fixable via any of these methods (CGNAT, no port forward supported).',
   2, 'critical', 140),

  -- NVR not recording
  (4,
   'UniFi NVR (UNVR/UNVR-Pro) not recording security camera footage',
   'Verify NVR is on SURVEILLANCE VLAN (192.168.31.x). Check UniFi switch port for NVR is on VLAN 31. In UniFi Protect, verify security cameras are adopted and showing a live feed. If cameras not showing: confirm cameras are also on SURVEILLANCE VLAN. Check hard drives: in UniFi Protect → Storage → verify all WD Purple drives are detected and healthy. If drives not detected: reseat drives in NVR bays, power cycle NVR.',
   2, 'warning', 150),

  -- Replay service V2 deployment
  (9,
   'V2 replay service fails to deploy from GitHub or cannot connect to dashboard',
   'V2 service deploys from GitHub repository (not deploy.py). Verify Mac Mini has internet access on REPLAY VLAN. Clone the replay repo: `git clone {REPO_URL} ~/replay-v2`. Run the setup script with the location_id as parameter. Verify the dashboard config endpoint is reachable from Mac Mini: `curl https://dashboard.podplay.app/api/venues/{location_id}/config`. If config endpoint returns 404, the venue is not provisioned in the dashboard — contact Agustin.',
   3, 'warning', 160);


-- -----------------------------------------------------------------------------
-- 4.04  network_vlans — 4 VLANs used in all PodPlay deployments
-- Source: Deployment guide Phase 4 Steps 42-44, Appendix C
-- -----------------------------------------------------------------------------

INSERT INTO network_vlans
  (id, display_name, vlan_id, subnet, gateway_ip, dhcp_start, dhcp_end,
   mdns_enabled, allows_internet, required_for_tiers, is_conditional, notes, sort_order)
VALUES
  (
    'default',
    'Default (Management)',
    NULL,
    '192.168.30.0/24',
    '192.168.30.1',
    '192.168.30.2',
    '192.168.30.254',
    false, true, NULL, false,
    'Management VLAN. NOTE: During Phase 6 camera configuration, the Default network temporarily uses 192.168.1.1 (cameras factory-default to 192.168.1.108 on this subnet). After ALL cameras are configured and moved to REPLAY VLAN, change Default network to 192.168.30.1 (Step 58). DO NOT change Default network before all cameras are configured.',
    1
  ),
  (
    'replay',
    'REPLAY',
    32,
    '192.168.32.0/24',
    '192.168.32.254',
    '192.168.32.1',
    '192.168.32.254',
    true, true, NULL, false,
    'Primary PodPlay operating VLAN. Carries all replay traffic: Mac Mini (fixed 192.168.32.100), replay cameras, iPads, Apple TVs. mDNS REQUIRED for Apple TV discovery. Port 4000 forwarded to 192.168.32.100. All tiers use this VLAN. Create FIRST.',
    2
  ),
  (
    'surveillance',
    'SURVEILLANCE',
    31,
    '192.168.31.0/24',
    '192.168.31.254',
    '192.168.31.1',
    '192.168.31.254',
    false, true, ARRAY['autonomous_plus'], true,
    'Surveillance VLAN for UniFi NVR (UNVR/UNVR-Pro) and security cameras. Autonomous+ tier only (has_nvr = true). Create only if security_camera_count > 0. Gateway .254 follows REPLAY VLAN convention (Step 43 does not specify; assumed .254 — confirm with Nico).',
    3
  ),
  (
    'access_control',
    'ACCESS CONTROL',
    33,
    '192.168.33.0/24',
    '192.168.33.254',
    '192.168.33.1',
    '192.168.33.254',
    false, true, ARRAY['autonomous','autonomous_plus'], true,
    'Access control VLAN for Kisi Controller Pro 2 and door readers. Autonomous and Autonomous+ tiers. Create only if door_count > 0. Gateway .254 follows REPLAY VLAN convention (Step 44 does not specify; assumed .254 — confirm with Nico).',
    4
  );


-- -----------------------------------------------------------------------------
-- 4.05  isp_bandwidth_requirements — 5 rows covering all court count ranges
-- Source: Deployment guide Phase 0 Step 5, Appendix C
-- Validation logic: SELECT * FROM isp_bandwidth_requirements
--   WHERE court_min <= $court_count AND (court_max IS NULL OR court_max >= $court_count)
-- -----------------------------------------------------------------------------

INSERT INTO isp_bandwidth_requirements
  (court_min, court_max, fiber_mbps, cable_upload_mbps, cable_note, dedicated_mbps, sort_order)
VALUES
  (1,   4,    50,  60,   '60 Mbps upload minimum',   30,  1),
  -- "1–4 courts: Fiber 50–100/100 Mbps, Cable 60 Mbps upload, Dedicated 30/30"
  (5,  11,  150,  NULL, 'Highest possible upload',   50,  2),
  -- "5–11 courts: Fiber 150/150, Cable highest possible upload, Dedicated 50/50"
  (12, 19,  200,  NULL, 'Highest possible upload',   50,  3),
  -- "12–19 courts: Fiber 200/200, Cable highest possible, Dedicated 50/50"
  (20, 24,  300,  NULL, 'Highest possible upload',  100,  4),
  -- "20–24 courts: Fiber 300/300, Cable highest possible, Dedicated 100/100"
  (25, NULL, 400, NULL, 'Highest possible upload',  150,  5);
  -- "25+ courts: Fiber 400/400, Cable highest possible, Dedicated 150/150"


-- -----------------------------------------------------------------------------
-- 4.06  deployment_regions — 2 rows: us and philippines
-- Source: Appendix F (Philippines open questions), Appendix C
-- -----------------------------------------------------------------------------

INSERT INTO deployment_regions (
  id, display_name, power_standard, video_standard,
  requires_business_plan, requires_static_ip, requires_dual_isp, starlink_blocked,
  supported_isps, isp_warning, power_warning, video_warning, open_questions
) VALUES
(
  'us',
  'United States',
  '120v_60hz',
  'ntsc',
  false, false, 'autonomous', true,
  '[
    {"name": "Verizon", "plan_name": "Fios Business"},
    {"name": "Optimum", "plan_name": "Business Internet"},
    {"name": "Spectrum", "plan_name": "Business Internet"},
    {"name": "Google Fiber", "plan_name": "Fiber Business"}
  ]',
  'ISP must support port 4000 forwarding or provide a static IP with DMZ. Starlink is NOT compatible (CGNAT blocks port 4000).',
  NULL,
  NULL,
  '[]'
),
(
  'philippines',
  'Philippines',
  '220v_60hz',
  'ntsc',
  -- ntsc pending Appendix F Q1 resolution (PAL vs NTSC open question)
  true, true, 'autonomous', true,
  '[
    {"name": "PLDT", "plan_name": "PLDT Beyond Fiber (Business)"},
    {"name": "Globe", "plan_name": "Globe GFiber Biz"},
    {"name": "Converge", "plan_name": "Converge FlexiBIZ"}
  ]',
  'Philippines deployments REQUIRE a business plan with static IP. Residential plans use CGNAT which blocks port 4000. For Autonomous/24hr venues, dual ISP is required — use PLDT + Converge (different backbones). Do NOT pair PLDT + Globe (shared backbone).',
  'WARNING: Power standard is 220V/60Hz. Verify all hardware SKUs support 220V before ordering: EmpireTech cameras, Flic buttons, Mac Mini, UDM Pro, all switches. (Appendix F Q3 — CRITICAL, unresolved)',
  'WARNING: PAL vs NTSC video standard for Philippines replay pipeline is unresolved (Appendix F Q1 — CRITICAL). Camera firmware region-lock status unresolved (Q2). Deploying as NTSC until resolved with Stan/Patrick.',
  '[
    {"id": 1, "question": "PAL vs NTSC — does changing video standard break replay pipeline?", "category": "Video", "priority": "CRITICAL", "status": "open", "resolution": null},
    {"id": 2, "question": "Camera firmware region-locked?", "category": "Video", "priority": "CRITICAL", "status": "open", "resolution": null},
    {"id": 3, "question": "All hardware confirmed 220V/60Hz compatible?", "category": "Power", "priority": "CRITICAL", "status": "open", "resolution": null},
    {"id": 5, "question": "Fallback if port 4000 blocked by ISP?", "category": "Architecture", "priority": "CRITICAL", "status": "open", "resolution": null},
    {"id": 6, "question": "Deployment server accessible remotely from Philippines?", "category": "Deployment", "priority": "CRITICAL", "status": "open", "resolution": null},
    {"id": 7, "question": "What does deploy.py produce? Can Cosmos run own deployment server?", "category": "Deployment", "priority": "CRITICAL", "status": "open", "resolution": null},
    {"id": 8, "question": "Admin Dashboard — shared PodPlay instance or own Cosmos instance?", "category": "Accounts", "priority": "CRITICAL", "status": "open", "resolution": null},
    {"id": 12, "question": "FreeDNS — same podplaydns.com domain for Asia venues?", "category": "Accounts", "priority": "CRITICAL", "status": "open", "resolution": null},
    {"id": 15, "question": "Mac Mini chip (M1/M2/M4) and year?", "category": "Hardware", "priority": "HIGH", "status": "open", "resolution": null},
    {"id": 16, "question": "EmpireTech cameras available in Philippines?", "category": "Sourcing", "priority": "MEDIUM", "status": "open", "resolution": null},
    {"id": 17, "question": "Flic buttons available in Philippines?", "category": "Sourcing", "priority": "MEDIUM", "status": "open", "resolution": null},
    {"id": 18, "question": "Kisi ships to Philippines?", "category": "Sourcing", "priority": "MEDIUM", "status": "open", "resolution": null}
  ]'
);


-- -----------------------------------------------------------------------------
-- 4.07  team_contacts — 7 rows: Andy, Nico, Chad, Stan, Agustin, CS Team, Patrick
-- Source: Appendix C Key Contacts, Appendix D Support Tiers
-- -----------------------------------------------------------------------------

INSERT INTO team_contacts (slug, name, role, department, phone, email, contact_via, support_tier, notes) VALUES

  ('andy',
   'Andy Korzeniacki',
   'Project Manager — specs, kickoff, camera positions, site survey',
   'pm',
   '917-937-6896',
   'andyk@podplay.app',
   NULL, NULL,
   'First contact for all new venue deployments. Schedule kickoff call at Phase 0. Provides site survey, hardware specs, camera positioning, tier determination. Author of the hardware installation guide.'),

  ('nico',
   'Nico',
   'Hardware & Installs Lead — replay service, device configuration, live monitoring',
   'hardware',
   NULL, NULL,
   'Via Chad',
   2,
   'Contact via Chad. VLAN changes, camera re-config, Mosyle profile issues, DDNS troubleshooting, replay service restart. Monitors ~70 live locations via GCP health checks + Slack.'),

  ('chad',
   'Chad',
   'Head of Operations — account decisions, credentials, shipping',
   'operations',
   NULL, NULL, NULL, NULL,
   'Holds credentials for UniFi PingPodIT, FreeDNS, 1Password. Gateway to Nico. BOM mismatch resolution (Phase 2). Account and billing decisions.'),

  ('stan',
   'Stan Wu',
   'Config Specialist — hardware expert, camera configuration',
   'config',
   NULL, NULL, NULL,
   2,
   'Author of PodPlay Configuration Guide v1.0. Expert in camera encoding settings, VLAN setup, Mac Mini deployment. Tier 2 support for hardware configuration issues.'),

  ('agustin',
   'Agustin',
   'App Readiness — LOCATION_ID creation, app release confirmation',
   'app',
   NULL, NULL, NULL, NULL,
   'Contact at Phase 1 before hardware ships. Creates LOCATION_ID per facility for Mosyle P-List config (<key>id</key><string>LOCATION_ID</string>). Manages white-labeled app binaries for VPP distribution.'),

  ('cs-team',
   'CS Team',
   'Customer Success — booking and replay credits',
   'cs',
   NULL, NULL, NULL, NULL,
   'Group contact. Booking questions and free replay credit additions. Contact when creating test reservations during deployment Phase 13 (Testing & Verification).'),

  ('patrick',
   'Patrick',
   'Engineer/Developer — replay service, video encoding, port 4000 architecture',
   'engineering',
   NULL, NULL, NULL,
   3,
   'Tier 3 only. Owns replay service (V1 UDP, V2 TCP). Contact for: pixelated video (V1 known issue — escalate for V2 upgrade), stream corruption, port 4000 architecture questions, firmware-level camera bugs. Weekly developer call for outstanding issues.');


-- =============================================================================
-- MIGRATION ORDER SUMMARY
-- =============================================================================
-- Sections 3+4 above execute in this dependency order:
--
--  Enums (22 types)
--  update_updated_at() function
--  3.01  installers
--  3.02  settings  + 4.01 seed
--  3.03  hardware_catalog
--  3.04  projects  (references installers)
--  3.05  bom_templates  (references hardware_catalog)
--  3.06  project_bom_items  (references projects, hardware_catalog)
--  3.07  inventory  (references hardware_catalog)
--  3.08  inventory_movements  (references hardware_catalog, projects)
--  3.09  purchase_orders  (references projects)
--  3.10  purchase_order_items  (references purchase_orders, hardware_catalog)
--  3.11  deployment_checklist_templates
--  3.12  deployment_checklist_items  (references projects, templates)
--  3.13  invoices  (references projects)
--  3.14  expenses  (references projects)
--  3.15  replay_signs  (references projects)
--  3.16  cc_terminals  (references projects)
--  3.17  monthly_opex_snapshots
--  3.18  troubleshooting_tips  + 4.03 seed
--  3.19  team_opex  + 4.02 seed
--  3.20  device_migrations  (references projects — nullable FK)
--  3.21  device_migration_items  (references device_migrations — cascade)
--  3.22  deployment_regions  + 4.06 seed
--  3.23  network_vlans  + 4.04 seed
--  3.24  isp_bandwidth_requirements  + 4.05 seed
--  3.25  team_contacts  + 4.07 seed
--
-- After running this file, populate:
--   hardware_catalog    — from final-mega-spec/data-model/seed-data.md
--   bom_templates       — from final-mega-spec/data-model/seed-data.md
--   deployment_checklist_templates — from final-mega-spec/data-model/seed-data.md
--
-- Note on hardware_catalog unit_cost: values are NULL until the XLSX
-- COST ANALYSIS sheet is available (aspect source-mrp-sheets, BLOCKED).
-- =============================================================================
