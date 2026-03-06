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

  location_id                 TEXT,
  -- PodPlay backend venue ID provided by dev team (Agustin)
  -- Used in Mosyle MDM P-List config: <dict><key>id</key><string>LOCATION_ID</string></dict>
  -- Routes iPad/Apple TV app to correct venue backend
  -- Set during Phase 1 (Pre-Configuration), confirmed with Agustin before iPad setup
  -- Token {{LOCATION_ID}} in checklist templates resolves from this field

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
| location_id | dev team (Agustin) | PodPlay venue ID for MDM P-List config |

---

## Table: installers

Installer directory. PodPlay maintains a vetted network in NY, CT, NJ.
Installers are assigned to projects; their hourly rate drives the labor cost calculation.

**MRP source**: Installer directory tab (referenced as "Installer" column in CUSTOMER MASTER).
Sheet name not confirmed from XLSX; content derived from design doc and training transcripts.

**Relationship to projects**:
- `projects.installer_id` → `installers.id` (FK, SET NULL on delete)
- `projects.installer_type` records whether the installer for that project is `podplay_vetted` or `client_own`
- `projects.installer_hours` × `COALESCE(installers.hourly_rate, settings.labor_rate_per_hour)` = labor cost

```sql
CREATE TABLE installers (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- -------------------------------------------------------------------------
  -- Identity
  -- -------------------------------------------------------------------------
  name              TEXT        NOT NULL,
  -- Full name of the installer (e.g., "Mike Torres")

  company           TEXT,
  -- Company name if the installer operates as a business (e.g., "Torres AV Services")
  -- NULL for individual contractors

  -- -------------------------------------------------------------------------
  -- Contact
  -- -------------------------------------------------------------------------
  email             TEXT,
  -- Contact email; used for coordination emails and SOW copies

  phone             TEXT,
  -- Cell phone preferred — needed for on-site coordination during installation

  -- -------------------------------------------------------------------------
  -- Classification
  -- -------------------------------------------------------------------------
  installer_type    installer_type NOT NULL DEFAULT 'podplay_vetted',
  -- podplay_vetted: from PodPlay's pre-vetted contractor network (NY/NJ/CT area)
  --   → higher confidence in quality; PodPlay manages relationship
  -- client_own: client's own installer
  --   → client manages; PodPlay provides remote troubleshooting support
  -- NOTE: projects.installer_type also records the classification per-project,
  -- but this field acts as the default/classification for the installer record itself.

  -- -------------------------------------------------------------------------
  -- Service Area
  -- -------------------------------------------------------------------------
  regions           TEXT[],
  -- List of US state codes where this installer is available
  -- (e.g., ARRAY['NY', 'NJ', 'CT'])
  -- Used to filter/suggest installers based on project.venue_state
  -- International installers: use country codes (e.g., ARRAY['PH'] for Philippines)

  -- -------------------------------------------------------------------------
  -- Pricing
  -- -------------------------------------------------------------------------
  hourly_rate       NUMERIC(10, 2),
  -- Negotiated hourly rate in USD. NULL = use global settings.labor_rate_per_hour
  -- When set, overrides global default for all projects assigned to this installer:
  --   labor_cost = project.installer_hours
  --              × COALESCE(installers.hourly_rate, settings.labor_rate_per_hour)
  -- Typical range: $75–$150/hr for AV/network contractors in NY metro area
  -- PodPlay default from settings: $120.00/hr

  -- -------------------------------------------------------------------------
  -- Availability & History
  -- -------------------------------------------------------------------------
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  -- false = retired or unavailable installer
  -- Inactive installers: hidden from new project dropdowns but retained on
  -- historical projects for data integrity (FK SET NULL does NOT apply here —
  -- SET NULL only fires on DELETE; use is_active = false to hide from UI)

  -- -------------------------------------------------------------------------
  -- Notes
  -- -------------------------------------------------------------------------
  notes             TEXT
  -- Internal ops notes: specializations, past project feedback, any issues
  -- Examples:
  --   "Strong networking background — good for complex Autonomous+ installs"
  --   "NJ/NY only — does not travel"
  --   "Client's own electrician — no AV experience, needs full remote support"
);

CREATE TRIGGER installers_updated_at
  BEFORE UPDATE ON installers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX idx_installers_is_active      ON installers (is_active);
CREATE INDEX idx_installers_installer_type ON installers (installer_type);
CREATE INDEX idx_installers_regions        ON installers USING GIN (regions);
-- GIN index on regions array supports: WHERE 'NY' = ANY(regions)

ALTER TABLE installers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access installers"
  ON installers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### Field Source Map

| Field | MRP Source | Notes |
|-------|-----------|-------|
| name | Installer directory tab | Full name column |
| company | Installer directory tab | Company/business name column |
| email | Installer directory tab | Email contact column |
| phone | Installer directory tab | Phone contact column |
| installer_type | Installer directory tab / CUSTOMER MASTER | Derived from whether PodPlay or client sourced |
| regions | Installer directory tab | Service area column (state codes) |
| hourly_rate | Installer directory tab | Negotiated rate; NULL if using global default |
| is_active | Installer directory tab | Active/inactive flag |
| notes | Installer directory tab | Notes column |

### Seed Data: Known PodPlay Installer Network

PodPlay's vetted installer network (NY/NJ/CT area) is populated at launch. Exact names
from the MRP installer directory tab require the XLSX (blocked: `source-mrp-sheets`).
The following structure is confirmed; names/rates are placeholders to be filled from XLSX:

```sql
-- Seed: PodPlay vetted network (NY/NJ/CT)
-- INSERT INTO installers (name, company, installer_type, regions, is_active)
-- VALUES
--   ('TBD from XLSX', NULL, 'podplay_vetted', ARRAY['NY', 'NJ', 'CT'], true),
--   ...;
-- NOTE: Unlock when source-mrp-sheets is unblocked (XLSX available)
```

Confirmed from design doc: PodPlay has vetted contractors covering NY, NJ, CT.
International venues (Philippines) use local contractors sourced per-project.

### Querying Installers

**Find active installers for a venue state:**
```sql
SELECT * FROM installers
WHERE is_active = true
  AND (
    venue_state = ANY(regions)
    OR regions IS NULL  -- available anywhere (remote support only)
  )
ORDER BY name;
```
Where `venue_state` comes from `projects.venue_state`.

**Count projects per installer:**
```sql
SELECT i.name, COUNT(p.id) AS project_count
FROM installers i
LEFT JOIN projects p ON p.installer_id = i.id
GROUP BY i.id, i.name
ORDER BY project_count DESC;
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
  -- Phase 0:  Pre-Purchase & Planning
  -- Phase 1:  Pre-Configuration (PodPlay Office)
  -- Phase 2:  Unboxing & Labeling
  -- Phase 3:  Network Rack Assembly
  -- Phase 4:  Networking Setup (UniFi)
  -- Phase 5:  ISP Router Configuration
  -- Phase 6:  Camera Configuration
  -- Phase 7:  DDNS Setup (FreeDNS)
  -- Phase 8:  Mac Mini Setup
  -- Phase 9:  Replay Service Deployment (V1)
  -- Phase 10: iPad Setup
  -- Phase 11: Apple TV Setup
  -- Phase 12: Physical Installation (On-Site)
  -- Phase 13: Testing & Verification
  -- Phase 14: Health Monitoring Setup
  -- Phase 15: Packaging & Shipping

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

  outreach_channel TEXT CHECK (outreach_channel IN ('slack', 'email', 'other')),
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

CREATE INDEX idx_replay_signs_project ON replay_signs (project_id);
CREATE INDEX idx_replay_signs_status  ON replay_signs (status);

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

  stripe_order_id TEXT,
  -- Stripe order reference number (BBPOS WisePOS E is ordered via Stripe, not Square)

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

## Replay Signs Model
**Aspect**: model-replay-signs
**Date**: 2026-03-06
**MRP Source**: "Customer Replay Signs" sheet

### Overview

Replay signs are 6×8 inch aluminum printed signs (Fast Signs vendor, $25/unit) placed on
each court to indicate the replay button location and scoring procedure. Every project gets
a `replay_signs` row created at Stage 2 entry, regardless of tier.

### Qty Rule

```
qty = court_count × 2
```

Copied from `projects.replay_sign_count` (GENERATED ALWAYS computed column) at row creation.
Stored as a snapshot — can be overridden in edge cases (extra backup sign ordered).

### State Machine

```
staged → shipped → delivered → installed
```

| Status | Description | Date Field Set |
|--------|-------------|---------------|
| staged | Queued for order, outreach not yet sent | — |
| shipped | Fast Signs shipped the order | shipped_date |
| delivered | Package received at venue | delivered_date |
| installed | Signs mounted on courts by venue staff | installed_date |

**Side effect on `installed` transition**: Creates an `inventory_movements` record:
- `movement_type = 'project_shipped'`
- `qty_delta = -replay_signs.qty`
- `hardware_catalog_id` = REPLAY-SIGN SKU
- `project_id` = this project

### Outreach Tracking

`outreach_channel` records how ops communicated the order to Fast Signs:
- `'slack'` — Slack DM to Fast Signs rep
- `'email'` — Email to Fast Signs ordering contact
- `'other'` — Phone, web form, or other

`outreach_date` = date the initial request was sent.
`vendor_order_id` = Fast Signs confirmation number.

### Field Source Map

| Field | MRP Column | Notes |
|-------|------------|-------|
| project_id | Customer Name (FK lookup) | Links to projects |
| qty | Qty | court_count × 2 at creation |
| status | Status | staged/shipped/delivered/installed |
| outreach_channel | (implied) | slack/email/other |
| outreach_date | Outreach Date | When ops contacted Fast Signs |
| shipped_date | Shipped Date | Fast Signs shipping date |
| delivered_date | Delivered Date | Arrival at venue |
| installed_date | Installed Date | Signs mounted on courts |
| tracking_number | Tracking | Carrier tracking number |
| vendor_order_id | Order Ref | Fast Signs order ID |
| notes | Notes | Free-form |

### Auto-Row Creation

Called when project transitions to `procurement` wizard stage (idempotent):

```typescript
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

  if (existing) return;  // Idempotent

  await supabase.from('replay_signs').insert({
    project_id: projectId,
    qty: project.replay_sign_count,  // court_count × 2
    status: 'staged',
  });
}
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

## Financial Model: Invoices, Expenses, P&L, HER, Reconciliation

**Aspect**: model-financials
**Date**: 2026-03-06
**Sources**: analysis/source-pricing-model.md, analysis/source-mrp-usage-guide.md, final-mega-spec/data-model/schema.md (existing tables), docs/plans design doc

---

### Overview

PodPlay's financial model has five components:

1. **Invoicing** — Two invoices per project (deposit + final), each tracked signed→sent→paid
2. **Expenses** — Per-project expenses across 12 categories, two payment methods
3. **Per-Project P&L** — Revenue (hardware + service) minus COGS minus expenses = net profit
4. **HER (Hardware Efficiency Ratio)** — Period-based: hardware revenue ÷ team hardware spend
5. **Revenue Pipeline** — All projects bucketed by revenue stage for cash flow visibility

All MRP source sheets mapped: **INVOICING**, **EXPENSES**, **FINANCIALS** (P&L/HER), **CUSTOMER MASTER** (revenue stage column).

---

### Table: invoices — Field Source Map

**MRP source sheet**: "INVOICING" tab
MRP columns (reconstructed from usage guide partial analysis and design doc):

| Field | MRP Column | Notes |
|-------|-----------|-------|
| `project_id` | Customer name column (FK to customer master) | Link invoice to project |
| `invoice_type` | Derived: "Deposit Invoice" vs "Final Invoice" rows | MRP likely has one section per type |
| `invoice_number` | "Invoice #" or "Invoice Number" | External billing system number |
| `hardware_subtotal` | "Hardware Total" | Sum of customer_price across BOM items |
| `service_fee` | "Service Fee" | Tier venue fee + (courts × court fee) |
| `subtotal` | Generated: hardware + service | Pre-tax total |
| `tax_rate` | "Tax Rate" (default 10.25%) | Applied at invoice time |
| `tax_amount` | Generated: subtotal × tax_rate | |
| `total_amount` | Generated: subtotal × (1 + tax_rate) | Grand total on invoice |
| `deposit_pct` | "Deposit %" (0.50 assumed) | Fraction of total billed on this invoice |
| `status` | "Invoiced?" / "Paid?" checkboxes | MRP has boolean columns |
| `date_sent` | "Invoice Date" or "Date Sent" | When invoice was emailed to customer |
| `date_paid` | "Date Paid" | When payment was received |
| `notes` | "Notes" | Free-form invoice notes |

**Invoice amount calculation — concrete example (6-court Pro)**:
```
hardware_subtotal = sum(customer_price for all BOM items) = $18,333 (example)
service_fee       = 5000 + (6 × 2500) = $20,000
subtotal          = $18,333 + $20,000 = $38,333
tax_amount        = $38,333 × 0.1025  = $3,929
total_amount      = $38,333 + $3,929  = $42,262

Deposit invoice:  total_amount × 0.50 = $21,131
Final invoice:    total_amount × 0.50 = $21,131
```

**Two-invoice uniqueness constraint**: `UNIQUE (project_id, invoice_type)` — exactly one deposit and one final invoice per project.

**Revenue stage driven by invoice lifecycle**:
```
project.revenue_stage transitions:
  proposal         → SOW sent, not signed
  signed           → signed_date set
  deposit_invoiced → deposit invoice.status = 'sent'
  deposit_paid     → deposit invoice.status = 'paid'
  final_invoiced   → final invoice.status = 'sent'
  final_paid       → final invoice.status = 'paid'
```

---

### Table: expenses — Field Source Map

**MRP source sheet**: "EXPENSES" tab
MRP columns (reconstructed):

| Field | MRP Column | Notes |
|-------|-----------|-------|
| `project_id` | "Customer" or "Project" | FK to project |
| `expense_date` | "Date" | Date expense was incurred |
| `category` | "Category" dropdown | 12 values (see enum) |
| `amount` | "Amount" | USD, always positive |
| `payment_method` | "Payment Method" | podplay_card \| ramp_reimburse |
| `description` | "Description" or "Notes" | e.g., "Delta ATL-EWR round trip" |
| `receipt_url` | Not in MRP (new field) | URL to receipt scan in Supabase Storage |
| `notes` | Additional notes column | If separate from description |

**Expense categories and typical amounts** (from source-pricing-model analysis):

| Category | Description | Typical Amount |
|----------|-------------|---------------|
| `airfare` | Round-trip flights | $1,800 default |
| `car` | Rental car | Varies |
| `fuel` | Gas/fuel | Varies |
| `lodging` | Hotel/lodging | $250/night default |
| `meals` | Per diem meals | Varies |
| `misc_hardware` | Incidental hardware not in BOM | Varies |
| `outbound_shipping` | Shipping rack to venue | Varies |
| `professional_services` | Installer payments (if paid separately) | Varies |
| `taxi` | Rideshare/taxi | Varies |
| `train` | Rail travel | Varies |
| `parking` | Parking fees | Varies |
| `other` | Catch-all | Varies |

**Payment methods**:
- `podplay_card` — Company Ramp card; no reimbursement needed
- `ramp_reimburse` — Personal card; submitted to Ramp for reimbursement

---

### New Table: monthly_opex_snapshots

Stores period-based team OpEx data for HER (Hardware Efficiency Ratio) calculation.
One row per calendar month. Used by the Global Financials view for period-based reporting.

**MRP source**: "FINANCIALS" tab (exact structure unknown — XLSX blocked); derived from frontier `model-team-opex` and design doc.

```sql
CREATE TABLE monthly_opex_snapshots (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  period_year     INTEGER     NOT NULL CHECK (period_year >= 2020 AND period_year <= 2050),
  -- Calendar year (e.g., 2026)

  period_month    INTEGER     NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
  -- Calendar month 1–12 (e.g., 3 for March)

  -- -------------------------------------------------------------------------
  -- Team OpEx Inputs (copied from settings at month-close, allows historical accuracy)
  -- -------------------------------------------------------------------------
  niko_monthly_salary       NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  -- Niko's gross salary for this month (annual ÷ 12 or actual if variable)

  niko_direct_allocation    NUMERIC(6, 4)  NOT NULL DEFAULT 0.50,
  -- Fraction of Niko's time on direct hardware work this month (default 50%)
  -- Allows per-month override (e.g., heavy install month → 0.70)

  chad_monthly_salary       NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  -- Chad's gross salary for this month

  chad_indirect_allocation  NUMERIC(6, 4)  NOT NULL DEFAULT 0.20,
  -- Fraction of Chad's time as indirect hardware overhead this month

  monthly_rent              NUMERIC(10, 2) NOT NULL DEFAULT 2300.00,
  -- Monthly rent for NJ lab (27,600 ÷ 12 = $2,300)

  monthly_indirect_salaries NUMERIC(10, 2) NOT NULL DEFAULT 12250.00,
  -- Monthly indirect salaries (147,000 ÷ 12 = $12,250)

  -- -------------------------------------------------------------------------
  -- Computed HER Inputs (set at month close)
  -- -------------------------------------------------------------------------
  hardware_revenue          NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  -- Sum of all hardware customer_price for FINAL invoices paid this month
  -- (deposit invoices excluded — revenue recognized on final payment)
  -- Formula: SUM(invoice.hardware_subtotal) WHERE invoice_type='final'
  --          AND date_paid BETWEEN period start AND period end

  -- -------------------------------------------------------------------------
  -- HER Calculation (stored for fast reporting; recomputable from above fields)
  -- -------------------------------------------------------------------------
  team_hardware_spend       NUMERIC(10, 2) GENERATED ALWAYS AS (
    -- Direct hardware spend:
    --   Niko direct:  niko_monthly_salary × niko_direct_allocation
    -- Indirect hardware overhead (allocated fraction of total indirect pool):
    --   Niko indirect portion:  niko_monthly_salary × (1 - niko_direct_allocation) × 0.50
    --   Chad indirect:          chad_monthly_salary × chad_indirect_allocation
    --   Rent:                   monthly_rent (full amount — lab is hardware ops space)
    --   Indirect salaries:      monthly_indirect_salaries × 0.20 (20% overhead allocation)
    --
    -- NOTE: Exact formula pending XLSX FINANCIALS sheet confirmation.
    -- Current formula is best approximation from frontier model-team-opex:
    (niko_monthly_salary * niko_direct_allocation)
    + (niko_monthly_salary * (1 - niko_direct_allocation) * 0.50)
    + (chad_monthly_salary * chad_indirect_allocation)
    + monthly_rent
    + (monthly_indirect_salaries * 0.20)
  ) STORED,

  her_ratio                 NUMERIC(10, 4) GENERATED ALWAYS AS (
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
  -- Month close notes (e.g., "Included 3 final payments", "Niko at 70% install month")

  UNIQUE (period_year, period_month)
);

CREATE TRIGGER monthly_opex_snapshots_updated_at
  BEFORE UPDATE ON monthly_opex_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_monthly_opex_period ON monthly_opex_snapshots (period_year DESC, period_month DESC);

ALTER TABLE monthly_opex_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access monthly_opex_snapshots"
  ON monthly_opex_snapshots FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

**Field Source Map**:

| Field | MRP Source | Notes |
|-------|-----------|-------|
| `period_year` / `period_month` | FINANCIALS tab header rows | Monthly columns in MRP |
| `niko_monthly_salary` | FINANCIALS tab "Niko Salary" row | Derived: annual ÷ 12 |
| `niko_direct_allocation` | FINANCIALS tab "Direct %" | 50% default |
| `chad_monthly_salary` | FINANCIALS tab "Chad Salary" row | Derived: annual ÷ 12 |
| `chad_indirect_allocation` | FINANCIALS tab "Chad Indirect %" | 20% default |
| `monthly_rent` | FINANCIALS tab "Rent" | $27,600/yr ÷ 12 = $2,300/mo |
| `monthly_indirect_salaries` | FINANCIALS tab "Indirect Salaries" | $147,000/yr ÷ 12 |
| `hardware_revenue` | INVOICING tab, filtered by date_paid | Sum of final invoices paid in period |
| `team_hardware_spend` | Computed | Niko direct + indirect allocations + overhead |
| `her_ratio` | FINANCIALS tab "HER" row | hardware_revenue / team_hardware_spend |

---

### Per-Project P&L — Complete Calculation Spec

All P&L is computed client-side (not stored). Inputs are fetched from Supabase; computation runs in the React service layer.

**Function signature**:
```typescript
interface ProjectPnL {
  // Revenue
  hardware_revenue:    number;  // Sum of bom_item.customer_price across all BOM items
  service_fee:         number;  // Tier venue fee + (court_count × court fee)
  total_revenue:       number;  // hardware_revenue + service_fee

  // Cost of Goods Sold
  cogs:                number;  // Sum of bom_item.est_total_cost (qty × unit_cost, no shipping markup)

  // Gross Profit
  gross_profit:        number;  // total_revenue - cogs
  gross_margin_pct:    number;  // gross_profit / total_revenue

  // Operating Expenses
  labor_cost:          number;  // project.installer_hours × settings.labor_rate_per_hour
  travel_expenses:     number;  // Sum of expenses WHERE category IN (airfare, car, fuel, lodging, meals, taxi, train, parking)
  other_expenses:      number;  // Sum of expenses WHERE category NOT IN travel categories
  total_expenses:      number;  // labor_cost + travel_expenses + other_expenses

  // Net Profit
  net_profit:          number;  // gross_profit - total_expenses
  net_margin_pct:      number;  // net_profit / total_revenue
}

function computeProjectPnL(
  project: Project,
  bomItems: ProjectBomItem[],
  expenses: Expense[],
  settings: Settings
): ProjectPnL
```

**Step-by-step formula**:
```
1. hardware_revenue
   = Σ(bom_item.customer_price)
   where customer_price = (qty × unit_cost × (1 + shipping_rate)) / (1 - margin)

2. service_fee
   if tier = 'pro':            settings.pro_venue_fee + court_count × settings.pro_court_fee
   if tier = 'autonomous'
      or 'autonomous_plus':    settings.autonomous_venue_fee + court_count × settings.autonomous_court_fee
   if tier = 'pbk':            settings.pbk_venue_fee + court_count × settings.pbk_court_fee

3. total_revenue = hardware_revenue + service_fee

4. cogs = Σ(bom_item.est_total_cost)
   where est_total_cost = qty × unit_cost  [no shipping; shipping goes to margin]

5. gross_profit = total_revenue - cogs
   gross_margin_pct = gross_profit / total_revenue

6. labor_cost = project.installer_hours × settings.labor_rate_per_hour

7. total_expenses = labor_cost + Σ(expense.amount for all project expenses)

8. net_profit = gross_profit - total_expenses
   net_margin_pct = net_profit / total_revenue
```

**Concrete example (6-court Pro, assumed unit costs)**:
```
hardware_revenue = $18,333 (from BOM customer_price sum)
service_fee      = $5,000 + (6 × $2,500) = $20,000
total_revenue    = $38,333

cogs             = $15,000 (BOM est_total_cost sum — raw hardware cost)
gross_profit     = $38,333 - $15,000 = $23,333
gross_margin_pct = $23,333 / $38,333 = 60.9%

installer_hours  = 40 hrs
labor_cost       = 40 × $120 = $4,800
travel_expenses  = $1,800 (airfare) + $1,500 (3 nights lodging) + $300 (rental car) = $3,600
total_expenses   = $4,800 + $3,600 = $8,400

net_profit       = $23,333 - $8,400 = $14,933
net_margin_pct   = $14,933 / $38,333 = 38.9%
```

---

### Revenue Pipeline — Bucketing Logic

The revenue pipeline view groups all projects by `revenue_stage` for cash flow visibility.

**Pipeline stages and amounts**:

| Stage | Bucket Label | Amount in Pipeline |
|-------|-------------|-------------------|
| `proposal` | "In Proposal" | invoice total (estimated, unsigned) |
| `signed` | "Signed / Not Invoiced" | invoice total (confirmed, deposit pending) |
| `deposit_invoiced` | "Deposit Sent" | deposit invoice total_amount × (1 - deposit_pct) remaining |
| `deposit_paid` | "Deposit Received" | final invoice total_amount |
| `final_invoiced` | "Final Invoice Sent" | final invoice total_amount |
| `final_paid` | "Closed" | $0 remaining (historical) |

**Pipeline total query** (client-side):
```typescript
// Sum of all outstanding receivables by stage
function pipelineSummary(projects: Project[], invoices: Invoice[]): PipelineBucket[] {
  return REVENUE_STAGES.map(stage => ({
    stage,
    count: projects.filter(p => p.revenue_stage === stage).length,
    total_amount: projects
      .filter(p => p.revenue_stage === stage)
      .reduce((sum, p) => sum + getOutstandingAmount(p, invoices), 0)
  }));
}
```

---

### Aging Receivables — Calculation Logic

Outstanding unpaid invoices grouped by days since `date_sent`.

**Buckets**:
- **Current (0–30 days)**: invoice.date_sent within last 30 days
- **31–60 days**: invoice.date_sent 31–60 days ago
- **61–90 days**: invoice.date_sent 61–90 days ago
- **90+ days**: invoice.date_sent > 90 days ago

**Query** (client-side):
```typescript
function agingReceivables(invoices: Invoice[]): AgingBucket[] {
  const today = new Date();
  const unpaid = invoices.filter(i => i.status !== 'paid' && i.date_sent !== null);
  return [
    { label: '0–30 days',  invoices: unpaid.filter(i => daysSince(i.date_sent!, today) <= 30) },
    { label: '31–60 days', invoices: unpaid.filter(i => daysSince(i.date_sent!, today) <= 60 && daysSince(i.date_sent!, today) > 30) },
    { label: '61–90 days', invoices: unpaid.filter(i => daysSince(i.date_sent!, today) <= 90 && daysSince(i.date_sent!, today) > 60) },
    { label: '90+ days',   invoices: unpaid.filter(i => daysSince(i.date_sent!, today) > 90) },
  ];
}
```

---

### Reconciliation — Cross-Table Verification

The MRP has a reconciliation check that compares inventory vs POs vs project BOM costs.
In the webapp, reconciliation is a read-only report computed client-side:

**Check 1: Inventory vs POs received**
```typescript
// For each hardware item:
// qty_on_hand should equal SUM(po_items.qty_received) - SUM(shipped to projects)
// Discrepancy = qty_on_hand - (total_received - total_shipped)
```

**Check 2: BOM cost vs Invoice**
```typescript
// For each project:
// invoice.hardware_subtotal should equal SUM(bom_item.customer_price)
// Discrepancy = invoice.hardware_subtotal - sum(bom.customer_price)
```

**Check 3: Expense totals vs P&L**
```typescript
// For each project:
// P&L total_expenses should match SUM(expense.amount) + labor_cost
// No stored discrepancy — P&L is computed fresh from expense records
```

**Check 4: Revenue stage consistency**
```typescript
// projects.revenue_stage should be consistent with invoice states:
// If deposit invoice.status = 'paid' → revenue_stage should be >= 'deposit_paid'
// If final invoice.status = 'paid' → revenue_stage should be 'final_paid'
```

Reconciliation report query (SQL) for inventory check:
```sql
WITH received AS (
  SELECT hardware_catalog_id, SUM(qty_received) AS total_received
  FROM purchase_order_items
  GROUP BY hardware_catalog_id
),
shipped AS (
  SELECT hardware_catalog_id,
         SUM(-qty_delta) AS total_shipped  -- movements are negative for shipments
  FROM inventory_movements
  WHERE movement_type IN ('project_shipped')
  GROUP BY hardware_catalog_id
)
SELECT
  hc.sku,
  hc.name,
  inv.qty_on_hand                       AS actual_qty,
  COALESCE(r.total_received, 0)
    - COALESCE(s.total_shipped, 0)      AS expected_qty,
  inv.qty_on_hand
    - (COALESCE(r.total_received, 0)
       - COALESCE(s.total_shipped, 0))  AS discrepancy
FROM inventory inv
JOIN hardware_catalog hc ON hc.id = inv.hardware_catalog_id
LEFT JOIN received r ON r.hardware_catalog_id = inv.hardware_catalog_id
LEFT JOIN shipped  s ON s.hardware_catalog_id = inv.hardware_catalog_id
WHERE inv.qty_on_hand != (COALESCE(r.total_received, 0) - COALESCE(s.total_shipped, 0))
ORDER BY ABS(inv.qty_on_hand - (COALESCE(r.total_received, 0) - COALESCE(s.total_shipped, 0))) DESC;
```

---

---

## Support Tiers Model

**Aspect**: model-support-tiers
**Date**: 2026-03-06
**Source**: analysis/source-deployment-guide.md (Appendix D + Appendix A)

Three fixed support tiers (integers 1/2/3 — no separate reference table):

| Tier | Handled By | Examples |
|------|------------|---------|
| 1 | On-site staff / remote monitoring | Device restart, app lock toggle, button battery replacement, basic connectivity checks |
| 2 | Config specialist (Nico-level) | VLAN changes, camera re-config, Mosyle issues, DDNS troubleshooting, replay service restart |
| 3 | Engineer / Developer (Patrick-level) | Replay service code bugs, video encoding issues, port 4000 architecture, firmware-level camera problems |

### Table: troubleshooting_tips

16 known issue/solution pairs from Appendix A, tagged by phase and support tier.
Used in the deployment wizard to show contextual troubleshooting per phase.

**MRP source**: Venue Deployment Guide Appendix A (troubleshooting table)

```sql
CREATE TABLE troubleshooting_tips (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),

  phase_number    INTEGER CHECK (phase_number >= 0 AND phase_number <= 15),
  -- NULL = applies globally (not phase-specific)

  issue           TEXT    NOT NULL,
  -- Short problem description — shown as the tip title

  solution        TEXT    NOT NULL,
  -- Full resolution steps — shown as the tip body

  support_tier    INTEGER NOT NULL CHECK (support_tier IN (1, 2, 3)),
  -- 1 = On-site / remote ops
  -- 2 = Config specialist (Nico-level)
  -- 3 = Engineer / developer (Patrick-level)

  severity        TEXT    NOT NULL DEFAULT 'warning'
                  CHECK (severity IN ('info', 'warning', 'critical')),
  -- info     = FYI, non-blocking
  -- warning  = Something to watch out for
  -- critical = Blocks deployment if not resolved

  sort_order      INTEGER NOT NULL DEFAULT 0
  -- Ordering within same phase (lower = shown first)
);

CREATE INDEX idx_troubleshooting_tips_phase ON troubleshooting_tips (phase_number);
CREATE INDEX idx_troubleshooting_tips_tier  ON troubleshooting_tips (support_tier);

ALTER TABLE troubleshooting_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access troubleshooting_tips"
  ON troubleshooting_tips FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

**UI integration**:
- Deployment wizard Phase panels: query `WHERE phase_number = $current_phase`, show in collapsed accordion
- Severity badge: critical=red, warning=amber, info=blue
- Support tier badge: T1=gray, T2=yellow, T3=red
- Tier 2+ tips show escalation callout: "Escalate to Config Specialist" / "Escalate to Engineer"

**Seed data**: See `seed-data.md` — "Troubleshooting Tips" section (16 rows).

---

### Updated Migration Order

Insert `monthly_opex_snapshots` after `expenses` (no foreign keys):

```
18. monthly_opex_snapshots  (no foreign keys — standalone OpEx records)
```

Updated full migration order (replacing prior list):

1. Create all enums
2. `update_updated_at()` function
3. `installers`
4. `settings`
5. `hardware_catalog`
6. `projects` (references installers)
7. `bom_templates` (references hardware_catalog)
8. `project_bom_items` (references projects, hardware_catalog)
9. `inventory` (references hardware_catalog)
10. `inventory_movements` (references hardware_catalog, projects)
11. `purchase_orders` (references projects)
12. `purchase_order_items` (references purchase_orders, hardware_catalog)
13. `deployment_checklist_templates`
14. `deployment_checklist_items` (references projects, templates)
15. `invoices` (references projects)
16. `expenses` (references projects)
17. `replay_signs` (references projects)
18. `cc_terminals` (references projects)
19. `monthly_opex_snapshots` (no foreign keys)
20. `troubleshooting_tips` (no foreign keys — standalone reference data)

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

---

## Inventory Model — Lifecycle, Movements, Purchase Orders

**Aspect**: model-inventory
**Date**: 2026-03-06
**Sources**: analysis/source-mrp-usage-guide.md, analysis/source-pricing-model.md, analysis/source-hardware-guide.md, research/podplay-hardware-bom.md, frontier/aspects.md (model-inventory description)

---

### Overview

PodPlay maintains a physical inventory of hardware at the NJ lab/warehouse. The ops person orders hardware, receives it, allocates items to projects, packs boxes, and ships to venues. The inventory system must track every stock change with a full movement log to enable reconciliation.

**Four tables** handle inventory:
1. `inventory` — current stock levels per hardware item (one row per hardware_catalog item)
2. `inventory_movements` — append-only audit log; every qty change recorded here
3. `purchase_orders` — PO header per vendor order
4. `purchase_order_items` — line items within each PO

**MRP source sheets** (from MRP Usage Guide analysis, partially derived):
- `ORDER INPUT` sheet — one row per PO line item: vendor, date, item, qty ordered, unit cost
- `INVENTORY INPUT` sheet — received quantities, adjustments
- `INVENTORY` sheet — computed stock levels: On Hand, Allocated, Available, Reorder Point

---

### Field Source Maps

#### inventory

| Field | MRP Source Sheet | MRP Column / Notes |
|-------|-----------------|-------------------|
| hardware_catalog_id | INVENTORY sheet | Row per SKU; linked to item name |
| qty_on_hand | INVENTORY sheet | "On Hand" column — physical count in NJ lab |
| qty_allocated | INVENTORY sheet | "Allocated" column — reserved for active projects |
| qty_available | INVENTORY sheet | "Available" column — derived: On Hand − Allocated |
| reorder_threshold | INVENTORY sheet | "Reorder Point" column — triggers low-stock alert |
| notes | INVENTORY sheet | Notes column for item-level remarks |

#### inventory_movements

| Field | MRP Source Sheet | MRP Column / Notes |
|-------|-----------------|-------------------|
| hardware_catalog_id | ORDER INPUT / INVENTORY INPUT | Item name column |
| project_id | CUSTOMER MASTER | Project association (NULL for stock orders) |
| movement_type | Derived from sheet | purchase_order_received (ORDER INPUT), project_allocated/shipped (per-project tabs), adjustment (INVENTORY INPUT manual rows) |
| qty_delta | ORDER INPUT / INVENTORY INPUT | Positive for receipts, negative for shipments |
| reference | ORDER INPUT | PO number or tracking number |
| notes | ORDER INPUT / INVENTORY INPUT | Notes column |

#### purchase_orders

| Field | MRP Source Sheet | MRP Column / Notes |
|-------|-----------------|-------------------|
| po_number | ORDER INPUT | "PO Number" column (e.g., "PO-2026-001") |
| vendor | ORDER INPUT | "Vendor" column (e.g., "UniFi", "EmpireTech", "Apple Business") |
| project_id | ORDER INPUT | "Project" column — NULL for stock replenishment POs |
| order_date | ORDER INPUT | "Order Date" column |
| expected_date | ORDER INPUT | "Expected Date" column |
| received_date | ORDER INPUT | "Received Date" column — filled when PO fully received |
| total_cost | ORDER INPUT | Sum of line items (formula in MRP) |
| status | ORDER INPUT | Derived: pending → ordered → partial → received → cancelled |
| tracking_number | ORDER INPUT | "Tracking #" column |
| notes | ORDER INPUT | Notes column |

#### purchase_order_items

| Field | MRP Source Sheet | MRP Column / Notes |
|-------|-----------------|-------------------|
| purchase_order_id | ORDER INPUT | FK to parent PO |
| hardware_catalog_id | ORDER INPUT | "Item" column, matched to hardware_catalog.sku |
| qty_ordered | ORDER INPUT | "Qty Ordered" column |
| qty_received | ORDER INPUT | "Qty Received" column — updated on receipt |
| unit_cost | ORDER INPUT | "Unit Cost" column — actual vendor invoice cost |
| line_total | ORDER INPUT | "Line Total" = qty_ordered × unit_cost (formula) |
| notes | ORDER INPUT | Per-line notes (e.g., "backordered", "substitute part") |

---

### Stock Lifecycle State Machine

Every unit of hardware flows through these states. The `inventory_movements` table records each transition.

```
[VENDOR] → purchase_order_received → [NJ LAB STOCK]
                                           │
                                    project_allocated
                                           │
                                    [ALLOCATED — reserved for project]
                                           │
                                     project_shipped
                                           │
                                    [AT VENUE — deducted from on_hand]
                                           │
                                        (or)
                                         return
                                           │
                                    [BACK TO NJ STOCK]

[MANUAL CORRECTION] → adjustment_increase / adjustment_decrease → [CORRECTED STOCK]
```

#### Movement Type Rules

| movement_type | qty_delta sign | Triggers qty_on_hand | Triggers qty_allocated | When |
|---------------|----------------|---------------------|----------------------|------|
| `purchase_order_received` | + positive | +qty_delta | no change | PO marked received; purchase_order_items.qty_received updated |
| `project_allocated` | − negative | no change | +abs(qty_delta) | project_bom_items.allocated set to true for a line |
| `project_shipped` | − negative | −abs(qty_delta) | −abs(qty_delta) | project_bom_items.shipped set to true; items leave NJ lab |
| `adjustment_increase` | + positive | +qty_delta | no change | Manual positive correction (received stock without formal PO, found miscount) |
| `adjustment_decrease` | − negative | −abs(qty_delta) | no change | Manual negative correction (damage, loss, miscount) |
| `return` | + positive | +qty_delta | −abs(qty_delta) | Items returned from project to NJ stock; project_bom_items.allocated and shipped reset |

#### Invariants

- `qty_on_hand` must always equal the sum of all `inventory_movements.qty_delta` for that item since time_zero.
- `qty_available` = `qty_on_hand` − `qty_allocated` — generated column, never set directly.
- `qty_allocated` must never exceed `qty_on_hand`.
- `qty_on_hand` must never go below 0 — the UI enforces this; no DB constraint because adjustments can correct errors.

#### Reconciliation Formula

```
-- Verify qty_on_hand is consistent with movement log:
SELECT
  hc.sku,
  i.qty_on_hand AS stored_on_hand,
  SUM(im.qty_delta) AS computed_on_hand,
  i.qty_on_hand - SUM(im.qty_delta) AS discrepancy
FROM inventory i
JOIN hardware_catalog hc ON hc.id = i.hardware_catalog_id
LEFT JOIN inventory_movements im ON im.hardware_catalog_id = i.hardware_catalog_id
GROUP BY hc.sku, i.qty_on_hand
HAVING i.qty_on_hand != SUM(COALESCE(im.qty_delta, 0));

-- If discrepancy found: create adjustment_increase or adjustment_decrease movement to reconcile.
```

---

### Allocation Workflow (Project → Inventory)

When the ops person reviews a project BOM in Stage 2 (Procurement):

1. **Check availability**: For each BOM line item, compare `project_bom_items.qty` against `inventory.qty_available`.
   - Sufficient stock: qty_available >= bom_item.qty → show green checkmark.
   - Insufficient stock: qty_available < bom_item.qty → show red warning with shortfall count.
   - Out of stock: qty_available = 0 → show "Order Required" badge.

2. **Allocate**: Ops clicks "Allocate All" or allocates individual line items.
   - For each allocated item:
     - `project_bom_items.allocated` → `true`
     - Insert `inventory_movements` row: `movement_type = 'project_allocated'`, `qty_delta = −bom_item.qty`, `project_id = project.id`
     - `inventory.qty_allocated` += bom_item.qty  *(updated via trigger or client-side)*

3. **Mark Shipped (Pack & Ship)**: Ops marks the shipment packed and sent.
   - For each shipped item:
     - `project_bom_items.shipped` → `true`
     - Insert `inventory_movements` row: `movement_type = 'project_shipped'`, `qty_delta = −bom_item.qty`, `project_id = project.id`
     - `inventory.qty_on_hand` -= bom_item.qty
     - `inventory.qty_allocated` -= bom_item.qty  *(net: allocated reversal; on_hand decremented)*

4. **Return** (if project cancelled or wrong item shipped):
   - `project_bom_items.allocated` → `false`, `project_bom_items.shipped` → `false`
   - Insert `inventory_movements` row: `movement_type = 'return'`, `qty_delta = +bom_item.qty`
   - `inventory.qty_on_hand` += bom_item.qty
   - `inventory.qty_allocated` -= bom_item.qty

---

### Purchase Order Lifecycle

```
not_yet_created → [pending] → [ordered] → [partial] → [received]
                                                ↓
                                           [cancelled]
```

| Status | Meaning | Transition Trigger |
|--------|---------|-------------------|
| `pending` | PO drafted but not yet submitted to vendor | PO created in UI |
| `ordered` | PO submitted to vendor; awaiting delivery | Ops marks "Ordered" after placing with vendor |
| `partial` | Some line items received, not all | qty_received > 0 but qty_received < qty_ordered for ≥1 item |
| `received` | All line items fully received | All purchase_order_items.qty_received == qty_ordered |
| `cancelled` | PO cancelled before or during fulfillment | Ops marks cancelled; any received items create adjustment movements |

**On receipt of PO line items**:
1. Ops enters `qty_received` for each PO line item.
2. System inserts `inventory_movements` row: `movement_type = 'purchase_order_received'`, `qty_delta = +qty_received`, `reference = po.po_number`.
3. `inventory.qty_on_hand` += qty_received.
4. PO status auto-updated: partial if some received, received if all received.

---

### Reorder Thresholds by Category

Default reorder thresholds per hardware category. These are seeded as starting values in the `inventory` table. The ops person can override per item in Settings.

| Category | Default reorder_threshold | Rationale |
|----------|--------------------------|-----------|
| network_rack | 1 | Keep 1 spare UDM and switch in stock |
| replay_system | 1 | Keep 1 spare Mac Mini; cameras ordered per project |
| displays | 0 | TVs drop-shipped directly to venue; never stocked in NJ |
| access_control | 1 | Keep 1 spare Kisi controller |
| surveillance | 0 | NVR and cameras ordered per project |
| front_desk | 0 | Ordered as needed |
| infrastructure | 1 | Keep 1 spare rack shelf |
| pingpod_specific | 0 | PingPod-only; ordered per project |
| signage | 0 | Managed via replay_signs table, not inventory |

**Low-stock alert rule**: When `inventory.qty_available <= inventory.reorder_threshold` AND `reorder_threshold > 0`, the UI shows a yellow "Low Stock" badge on the inventory view and a warning on any project BOM referencing that item.

---

### Inventory View Grouping Logic

The inventory page groups items by `hardware_catalog.category` in this display order:

1. `network_rack` — Network Rack
2. `replay_system` — Replay System
3. `displays` — Displays & Kiosk
4. `access_control` — Access Control
5. `surveillance` — Surveillance
6. `front_desk` — Front Desk
7. `infrastructure` — Infrastructure
8. `pingpod_specific` — PingPod-Specific
9. `signage` — Signage *(typically qty = 0 — managed via replay_signs)*

Within each category, items are ordered by `hardware_catalog.sku` alphabetically.

---

### PO Number Convention

PO numbers follow the format: `PO-{YYYY}-{NNN}` where NNN is zero-padded sequential per year.

Examples:
- `PO-2026-001` — first PO of 2026
- `PO-2026-002` — second PO of 2026
- `PO-2026-015` — fifteenth PO of 2026

Auto-generated by the UI on PO creation:
```typescript
function generatePoNumber(year: number, sequence: number): string {
  return `PO-${year}-${String(sequence).padStart(3, '0')}`;
}
// Query max existing PO for year to determine next sequence number
```

---

### Known Gaps in Inventory Model

| Gap | Impact | Resolution |
|----|--------|-----------|
| Exact MRP ORDER INPUT sheet column names | Field source map uses derived names | Requires XLSX (source-existing-data aspect) |
| Actual reorder thresholds per item | Defaults above are estimates | Confirm from XLSX INVENTORY sheet "Reorder Point" column |
| Whether MRP tracks per-item serial numbers | Serial tracking not in model | Confirm from XLSX — if yes, add serial_number field to inventory_movements |
| TV drop-ship workflow detail | TVs go direct to venue; not in NJ stock | Confirm from XLSX whether TVs are in inventory or always 0 |
| qty_on_hand update mechanism | Model assumes client-side update after movement insert | May need Postgres trigger to auto-update inventory.qty_on_hand from movements |

---

## Table: settings

Single-row configuration table. All tunable values that affect pricing calculations, cost
chains, travel estimates, and team OpEx reporting. The webapp reads this table on startup
and caches it in React context. The Settings page provides a UI to edit all fields.

**MRP source**: Design document defaults; exact values cross-referenced from
`source-pricing-model` analysis and `source-mrp-usage-guide` analysis.

**Single-row enforcement**: The table is constrained to exactly one row via a
`CHECK (id = 1)` constraint and a unique primary key. No multi-tenant isolation needed
at this layer — settings are global for the single PodPlay ops user.

```sql
CREATE TABLE settings (
  id                          INTEGER     PRIMARY KEY DEFAULT 1
                              CHECK (id = 1),
  -- Enforces single-row invariant. id is always 1.

  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- -------------------------------------------------------------------------
  -- Pricing Tier Fees (customer-facing service fees, not hardware cost)
  -- Source: source-pricing-model analysis, confirmed from design document
  -- -------------------------------------------------------------------------
  pro_venue_fee               NUMERIC(10,2) NOT NULL DEFAULT 5000.00,
  -- One-time venue fee for Pro tier installations
  -- MRP: COST ANALYSIS sheet "Venue Fee" row for Pro tier

  pro_court_fee               NUMERIC(10,2) NOT NULL DEFAULT 2500.00,
  -- Per-court service fee for Pro tier
  -- MRP: COST ANALYSIS sheet "Per Court Fee" row for Pro tier

  autonomous_venue_fee        NUMERIC(10,2) NOT NULL DEFAULT 7500.00,
  -- One-time venue fee for Autonomous tier (includes access control + security cameras)
  -- MRP: COST ANALYSIS sheet "Venue Fee" row for Autonomous tier

  autonomous_court_fee        NUMERIC(10,2) NOT NULL DEFAULT 2500.00,
  -- Per-court service fee for Autonomous tier
  -- MRP: COST ANALYSIS sheet "Per Court Fee" row for Autonomous tier

  autonomous_plus_venue_fee   NUMERIC(10,2) NOT NULL DEFAULT 7500.00,
  -- One-time venue fee for Autonomous+ tier (same base as Autonomous; surveillance is add-on)
  -- MRP: COST ANALYSIS sheet "Venue Fee" row for Autonomous+ tier

  autonomous_plus_court_fee   NUMERIC(10,2) NOT NULL DEFAULT 2500.00,
  -- Per-court service fee for Autonomous+ tier
  -- MRP: COST ANALYSIS sheet "Per Court Fee" row for Autonomous+ tier

  pbk_venue_fee               NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  -- One-time venue fee for PBK (Pickleball Kingdom) custom tier
  -- MRP: COST ANALYSIS sheet "Venue Fee" row for PBK tier
  -- Default 0.00 — must be set by ops admin before creating PBK projects
  -- Source: XLSX required for exact value; not available from current sources

  pbk_court_fee               NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  -- Per-court service fee for PBK tier
  -- MRP: COST ANALYSIS sheet "Per Court Fee" row for PBK tier
  -- Default 0.00 — must be set by ops admin before creating PBK projects

  -- -------------------------------------------------------------------------
  -- Cost Chain Rates (applied during BOM cost calculation)
  -- Source: source-pricing-model analysis Section 3
  -- -------------------------------------------------------------------------
  shipping_rate               NUMERIC(5,4) NOT NULL DEFAULT 0.10
                              CHECK (shipping_rate >= 0 AND shipping_rate <= 1),
  -- Multiplied onto est_total_cost to get landed_cost
  -- Formula: landed_cost = est_total_cost * (1 + shipping_rate)
  -- Default: 10% (0.10)
  -- MRP: COST ANALYSIS sheet "Shipping Rate" or "Freight %" column

  target_margin               NUMERIC(5,4) NOT NULL DEFAULT 0.10
                              CHECK (target_margin >= 0 AND target_margin < 1),
  -- Markup rate: customer_price = landed_cost / (1 - target_margin)
  -- Default: 10% (0.10) — a 10% margin over landed cost
  -- MRP: COST ANALYSIS sheet "Margin" or "Markup %" column
  -- Note: This produces ~11.1% markup on landed cost, 10% of selling price

  sales_tax_rate              NUMERIC(5,4) NOT NULL DEFAULT 0.1025
                              CHECK (sales_tax_rate >= 0 AND sales_tax_rate <= 1),
  -- Applied to invoice subtotal (hardware + service fees) at invoice time
  -- Formula: tax_amount = invoice_subtotal * sales_tax_rate
  -- Default: 10.25% (0.1025) — reflects California sales tax rate
  -- MRP: INVOICING sheet "Tax Rate" or applied as fixed percentage in invoice formula
  -- Note: Tax is NOT embedded in cost chain; it is added on top at invoice generation

  deposit_pct                 NUMERIC(5,4) NOT NULL DEFAULT 0.50
                              CHECK (deposit_pct > 0 AND deposit_pct < 1),
  -- Fraction of invoice_total charged as the first (deposit) installment
  -- Formula: deposit_amount = invoice_total * deposit_pct
  -- Default: 50% (0.50) — assumed 50/50 split; exact value requires XLSX INVOICING sheet
  -- MRP: INVOICING sheet "Deposit %" column

  -- -------------------------------------------------------------------------
  -- Labor Rate
  -- Source: source-pricing-model analysis Section 4
  -- -------------------------------------------------------------------------
  labor_rate_per_hour         NUMERIC(10,2) NOT NULL DEFAULT 120.00,
  -- Hourly rate applied to installer hours for project P&L labor cost
  -- Formula: labor_cost = installer_hours * labor_rate_per_hour
  -- MRP: COST ANALYSIS or EXPENSES sheet "Labor Rate" value
  -- Applies to both PodPlay staff and vetted installer time

  -- -------------------------------------------------------------------------
  -- Travel Defaults (pre-populated when creating travel expense estimates)
  -- Source: source-pricing-model analysis Section 4
  -- -------------------------------------------------------------------------
  lodging_per_day             NUMERIC(10,2) NOT NULL DEFAULT 250.00,
  -- Default lodging estimate per night (hotel)
  -- Pre-fills expense entry when category = 'lodging'
  -- MRP: EXPENSES sheet default value or usage guide reference

  airfare_default             NUMERIC(10,2) NOT NULL DEFAULT 1800.00,
  -- Default airfare estimate for a round trip
  -- Pre-fills expense entry when category = 'airfare'
  -- MRP: EXPENSES sheet default value or usage guide reference

  hours_per_day               INTEGER NOT NULL DEFAULT 10
                              CHECK (hours_per_day >= 1 AND hours_per_day <= 24),
  -- Standard installer working hours per day; used to estimate multi-day jobs
  -- Formula: estimated_days = ceil(total_estimated_hours / hours_per_day)
  -- MRP: referenced in usage guide as 10-hour workdays for installation crews

  -- -------------------------------------------------------------------------
  -- Team OpEx Allocations (used in HER and P&L reporting)
  -- Source: frontier aspect model-team-opex; confirmed in source-pricing-model Section 6
  -- These allocate annual team costs between hardware-direct and indirect overhead
  -- -------------------------------------------------------------------------
  rent_per_year               NUMERIC(12,2) NOT NULL DEFAULT 27600.00,
  -- Annual NJ lab/office rent allocated to OpEx
  -- Source: frontier aspect model-team-opex — "$27.6K/yr"
  -- Used in HER denominator as indirect overhead

  indirect_salaries_per_year  NUMERIC(12,2) NOT NULL DEFAULT 147000.00,
  -- Annual sum of indirect salary allocations across the team
  -- Source: frontier aspect model-team-opex — "$147K/yr indirect salaries"
  -- Includes: Chad 20% indirect + other indirect allocations
  -- Used in HER denominator

  -- -------------------------------------------------------------------------
  -- BOM Sizing Thresholds (switch, SSD, NVR selection breakpoints)
  -- Source: source-pricing-model analysis Section 8
  -- These drive conditional BOM item selection based on project parameters
  -- -------------------------------------------------------------------------
  switch_24_max_courts        INTEGER NOT NULL DEFAULT 10,
  -- Use USW-Pro-24-POE (single) for court_count <= this value
  -- Use USW-Pro-48-POE or 2x USW-Pro-24-POE for court_count > this value
  -- Exact breakpoint: requires XLSX BOM template sheet; 10 is best estimate

  switch_48_max_courts        INTEGER NOT NULL DEFAULT 20,
  -- Use 2x USW-Pro-24-POE or 1x USW-Pro-48-POE for court_count <= this value
  -- Use 2x USW-Pro-48-POE for court_count > this value
  -- Exact breakpoint: requires XLSX BOM template sheet; 20 is best estimate

  ssd_1tb_max_courts          INTEGER NOT NULL DEFAULT 4,
  -- Use Samsung T7 1TB for court_count <= this value
  -- MRP: BOM template sheet; exact breakpoint requires XLSX

  ssd_2tb_max_courts          INTEGER NOT NULL DEFAULT 12,
  -- Use Samsung T7 2TB for court_count <= this value (and > ssd_1tb_max_courts)
  -- Use Samsung T7 4TB for court_count > this value
  -- MRP: BOM template sheet; exact breakpoint requires XLSX

  nvr_4bay_max_cameras        INTEGER NOT NULL DEFAULT 4,
  -- Use UNVR (4-bay) for security_camera_count <= this value
  -- Use UNVR-Pro (7-bay) for security_camera_count > this value
  -- MRP: BOM template sheet; exact breakpoint requires XLSX

  -- -------------------------------------------------------------------------
  -- ISP Speed Thresholds (internet requirement validation by court count)
  -- Source: source-deployment-guide analysis (Appendix or Phase 0)
  -- Used to warn ops if venue's reported ISP speed is insufficient
  -- -------------------------------------------------------------------------
  isp_fiber_mbps_per_court    INTEGER NOT NULL DEFAULT 12,
  -- Minimum fiber upload Mbps per court (approx: 150Mbps / 12 courts = 12.5/court)
  -- Rounded recommendation; exact table stored in seed data (isp_speed_thresholds)

  isp_cable_upload_min_mbps   INTEGER NOT NULL DEFAULT 60,
  -- Minimum cable upload Mbps for any installation (cable is upload-constrained)

  -- -------------------------------------------------------------------------
  -- Miscellaneous Operational Defaults
  -- -------------------------------------------------------------------------
  default_replay_service_version  TEXT NOT NULL DEFAULT 'v1'
                              CHECK (default_replay_service_version IN ('v1', 'v2')),
  -- Which replay service version new projects default to
  -- 'v1' until V2 launches April 2026; ops admin changes to 'v2' at launch

  po_number_prefix            TEXT NOT NULL DEFAULT 'PO',
  -- Prefix for auto-generated PO numbers: '{prefix}-{YYYY}-{NNN}'
  -- Default: 'PO' → produces 'PO-2026-001'

  mac_mini_local_ip           TEXT NOT NULL DEFAULT '192.168.32.100',
  -- Fixed IP address assigned to Mac Mini on REPLAY VLAN (.32 subnet)
  -- Source: source-mrp-usage-guide analysis Section 1 (VLAN setup)
  -- This is the port-forward target for port 4000

  replay_vlan_id              INTEGER NOT NULL DEFAULT 32,
  -- VLAN ID for the REPLAY network segment
  -- Source: source-mrp-usage-guide analysis (VLAN ID 32)

  surveillance_vlan_id        INTEGER NOT NULL DEFAULT 31,
  -- VLAN ID for the SURVEILLANCE network segment
  -- Source: source-mrp-usage-guide analysis (VLAN .31)

  access_control_vlan_id      INTEGER NOT NULL DEFAULT 33,
  -- VLAN ID for the ACCESS CONTROL network segment
  -- Source: source-mrp-usage-guide analysis (VLAN .33)

  default_vlan_id             INTEGER NOT NULL DEFAULT 30,
  -- VLAN ID for the DEFAULT network segment (management, non-AV traffic)
  -- Source: source-mrp-usage-guide analysis (default .30 subnet)

  replay_port                 INTEGER NOT NULL DEFAULT 4000,
  -- TCP/UDP port used by the replay service on Mac Mini
  -- Port-forwarded from ISP router → UDM → Mac Mini
  -- Source: source-mrp-usage-guide analysis — port 4000 reference

  ddns_domain                 TEXT NOT NULL DEFAULT 'podplaydns.com',
  -- Base domain for DDNS subdomains
  -- Full URL pattern: http://{customer_subdomain}.{ddns_domain}:{replay_port}
  -- Source: source-mrp-usage-guide analysis Section 1 (DDNS Setup)

  cc_terminal_pin             TEXT NOT NULL DEFAULT '07139',
  -- Default PIN for BBPOS WisePOS E credit card terminal
  -- Source: source-mrp-usage-guide analysis (hardware BOM notes)
  -- Stored here for reference; not security-sensitive (it's a device PIN, not a password)

  label_sets_per_court        INTEGER NOT NULL DEFAULT 5
                              CHECK (label_sets_per_court >= 1),
  -- Number of device labels printed per court during unboxing
  -- Set: remote, iPad, camera, Apple TV, PoE adapter
  -- Source: source-mrp-usage-guide analysis Section 1 (Unboxing & Labeling)

  replay_sign_multiplier      INTEGER NOT NULL DEFAULT 2
                              CHECK (replay_sign_multiplier >= 1),
  -- Number of replay signs per court (default: 2)
  -- Formula: replay_sign_count = court_count * replay_sign_multiplier
  -- Source: frontier aspect model-replay-signs
  -- Note: Also enforced at DB level via projects.replay_sign_count GENERATED column
  -- This setting allows overriding the default if PodPlay changes the sign count per court

  CONSTRAINT settings_single_row CHECK (id = 1)
);
```

### Default Row Insert

On first Supabase migration run, insert the single settings row:

```sql
INSERT INTO settings (
  id,
  pro_venue_fee,
  pro_court_fee,
  autonomous_venue_fee,
  autonomous_court_fee,
  autonomous_plus_venue_fee,
  autonomous_plus_court_fee,
  pbk_venue_fee,
  pbk_court_fee,
  shipping_rate,
  target_margin,
  sales_tax_rate,
  deposit_pct,
  labor_rate_per_hour,
  lodging_per_day,
  airfare_default,
  hours_per_day,
  rent_per_year,
  indirect_salaries_per_year,
  switch_24_max_courts,
  switch_48_max_courts,
  ssd_1tb_max_courts,
  ssd_2tb_max_courts,
  nvr_4bay_max_cameras,
  isp_fiber_mbps_per_court,
  isp_cable_upload_min_mbps,
  default_replay_service_version,
  po_number_prefix,
  mac_mini_local_ip,
  replay_vlan_id,
  surveillance_vlan_id,
  access_control_vlan_id,
  default_vlan_id,
  replay_port,
  ddns_domain,
  cc_terminal_pin,
  label_sets_per_court,
  replay_sign_multiplier
) VALUES (
  1,
  5000.00,     -- pro_venue_fee
  2500.00,     -- pro_court_fee
  7500.00,     -- autonomous_venue_fee
  2500.00,     -- autonomous_court_fee
  7500.00,     -- autonomous_plus_venue_fee
  2500.00,     -- autonomous_plus_court_fee
  0.00,        -- pbk_venue_fee (must be configured before creating PBK projects)
  0.00,        -- pbk_court_fee (must be configured before creating PBK projects)
  0.10,        -- shipping_rate (10%)
  0.10,        -- target_margin (10%)
  0.1025,      -- sales_tax_rate (10.25%)
  0.50,        -- deposit_pct (50%)
  120.00,      -- labor_rate_per_hour
  250.00,      -- lodging_per_day
  1800.00,     -- airfare_default
  10,          -- hours_per_day
  27600.00,    -- rent_per_year
  147000.00,   -- indirect_salaries_per_year
  10,          -- switch_24_max_courts
  20,          -- switch_48_max_courts
  4,           -- ssd_1tb_max_courts
  12,          -- ssd_2tb_max_courts
  4,           -- nvr_4bay_max_cameras
  12,          -- isp_fiber_mbps_per_court
  60,          -- isp_cable_upload_min_mbps
  'v1',        -- default_replay_service_version
  'PO',        -- po_number_prefix
  '192.168.32.100', -- mac_mini_local_ip
  32,          -- replay_vlan_id
  31,          -- surveillance_vlan_id
  33,          -- access_control_vlan_id
  30,          -- default_vlan_id
  4000,        -- replay_port
  'podplaydns.com', -- ddns_domain
  '07139',     -- cc_terminal_pin
  5,           -- label_sets_per_court
  2            -- replay_sign_multiplier
) ON CONFLICT (id) DO NOTHING;
```

### RLS Policy for settings

```sql
-- Settings is readable by authenticated users only
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
-- No INSERT policy beyond migration seed — table has exactly one row
-- No DELETE policy — the row must always exist
```

### No index needed — single row, always full-table scan via PK.

---

## Table: team_opex

Per-team-member OpEx allocations for HER (Hardware Efficiency Ratio) and P&L reporting.
Each row represents one team member's annual salary and their allocation percentages
between direct hardware work and indirect overhead.

**MRP source**: Frontier aspect `model-team-opex` — Niko 50/50 direct/indirect,
Chad 20% indirect, rent $27.6K/yr, indirect salaries $147K/yr.

**Note**: `rent_per_year` and `indirect_salaries_per_year` are in `settings` (global).
This table is for per-person allocations.

```sql
CREATE TABLE team_opex (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

  name                        TEXT        NOT NULL,
  -- Team member name (e.g., "Niko", "Chad", "Andy")
  -- MRP: CUSTOMER MASTER or HER sheet team member rows

  role                        TEXT        NOT NULL DEFAULT '',
  -- Job title / role description (e.g., "Hardware & Installs Lead", "Ops")
  -- Informational only; not used in calculations

  annual_salary               NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  -- Total annual salary for this team member in USD
  -- MRP: HER sheet or EXPENSES sheet salary row

  direct_pct                  NUMERIC(5,4) NOT NULL DEFAULT 0.00
                              CHECK (direct_pct >= 0 AND direct_pct <= 1),
  -- Fraction of this person's time allocated to direct hardware/installation work
  -- Used in HER numerator (direct hardware team cost)
  -- Example: Niko = 0.50 (50% direct)

  indirect_pct                NUMERIC(5,4) NOT NULL DEFAULT 0.00
                              CHECK (indirect_pct >= 0 AND indirect_pct <= 1),
  -- Fraction of this person's time allocated to indirect/overhead work
  -- Used in HER denominator or excluded from hardware efficiency calc
  -- Example: Niko = 0.50 (50% indirect); Chad = 0.20 (20% indirect)

  CONSTRAINT direct_indirect_sum_lte_one
    CHECK (direct_pct + indirect_pct <= 1.0000)
  -- direct + indirect must not exceed 100%; remainder is non-hardware (e.g., software work)
);
```

### team_opex Indexes

```sql
CREATE UNIQUE INDEX team_opex_name_unique ON team_opex (lower(name));
-- Prevent duplicate team member entries (case-insensitive)
```

### team_opex RLS

```sql
ALTER TABLE team_opex ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read team_opex"
  ON team_opex FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage team_opex"
  ON team_opex FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

### team_opex Seed Data

```sql
INSERT INTO team_opex (name, role, annual_salary, direct_pct, indirect_pct) VALUES
  ('Niko',  'Hardware & Installs Lead',  0.00,  0.50,  0.50),
  -- annual_salary: unknown — requires XLSX HER sheet; set to 0 until confirmed
  -- 50% direct (hardware config + installs), 50% indirect
  -- Source: frontier aspect model-team-opex

  ('Chad',  'Ops / Former Installer',    0.00,  0.00,  0.20),
  -- annual_salary: unknown — requires XLSX HER sheet; set to 0 until confirmed
  -- 0% direct hardware, 20% indirect overhead
  -- Source: frontier aspect model-team-opex

  ('Andy',  'Project Manager / Intake',  0.00,  0.00,  0.00),
  -- Included for completeness; allocation TBD (requires XLSX)
  -- Source: frontier aspect model-contacts-directory

  ('Stan',  'Config Specialist',         0.00,  0.50,  0.50);
  -- Included for completeness; allocation TBD (requires XLSX)
  -- Assumed 50/50 split as config work is direct hardware; verify from XLSX
```

### HER Calculation Using Settings + team_opex

```
-- Hardware Efficiency Ratio (HER) for a given time period:

direct_team_cost = SUM(annual_salary * direct_pct) for all team members
                   / 12 * months_in_period
                   + (rent_per_year / 12 * months_in_period)  -- only rent if direct
                   -- Note: exact allocation of rent to direct vs indirect unclear;
                   -- requires XLSX HER sheet formula to confirm

indirect_team_cost = SUM(annual_salary * indirect_pct) for all team members
                     / 12 * months_in_period
                     + (indirect_salaries_per_year / 12 * months_in_period)

hardware_revenue = SUM(customer_price) for all BOM items invoiced in period

HER = hardware_revenue / direct_team_cost
-- Higher HER = more hardware revenue generated per dollar of direct team spend
-- Target HER > 1.0 to be profitable on hardware alone
```

---

### Settings Field Source Map

| Field | Default | Source | MRP Sheet |
|-------|---------|--------|-----------|
| `pro_venue_fee` | $5,000 | Design doc + source-pricing-model | COST ANALYSIS |
| `pro_court_fee` | $2,500 | Design doc + source-pricing-model | COST ANALYSIS |
| `autonomous_venue_fee` | $7,500 | Design doc + source-pricing-model | COST ANALYSIS |
| `autonomous_court_fee` | $2,500 | Design doc + source-pricing-model | COST ANALYSIS |
| `autonomous_plus_venue_fee` | $7,500 | Same as autonomous (surveillance is add-on) | COST ANALYSIS |
| `autonomous_plus_court_fee` | $2,500 | Same as autonomous | COST ANALYSIS |
| `pbk_venue_fee` | $0 (unknown) | Requires XLSX | COST ANALYSIS |
| `pbk_court_fee` | $0 (unknown) | Requires XLSX | COST ANALYSIS |
| `shipping_rate` | 10% | source-pricing-model Section 3 | COST ANALYSIS |
| `target_margin` | 10% | source-pricing-model Section 3 | COST ANALYSIS |
| `sales_tax_rate` | 10.25% | source-pricing-model Section 3 | INVOICING |
| `deposit_pct` | 50% (assumed) | source-pricing-model Section 5 | INVOICING |
| `labor_rate_per_hour` | $120/hr | source-pricing-model Section 4 | COST ANALYSIS |
| `lodging_per_day` | $250 | source-pricing-model Section 4 | EXPENSES |
| `airfare_default` | $1,800 | source-pricing-model Section 4 | EXPENSES |
| `hours_per_day` | 10 | source-mrp-usage-guide Section 1 | Usage Guide |
| `rent_per_year` | $27,600 | model-team-opex frontier | HER/P&L |
| `indirect_salaries_per_year` | $147,000 | model-team-opex frontier | HER/P&L |
| `switch_24_max_courts` | 10 | source-pricing-model Section 8 (estimate) | BOM template |
| `switch_48_max_courts` | 20 | source-pricing-model Section 8 (estimate) | BOM template |
| `ssd_1tb_max_courts` | 4 | source-pricing-model Section 8 (estimate) | BOM template |
| `ssd_2tb_max_courts` | 12 | source-pricing-model Section 8 (estimate) | BOM template |
| `nvr_4bay_max_cameras` | 4 | source-pricing-model Section 8 (estimate) | BOM template |
| `isp_fiber_mbps_per_court` | 12 | source-deployment-guide (ISP table) | Deployment Guide |
| `isp_cable_upload_min_mbps` | 60 | source-deployment-guide (ISP table) | Deployment Guide |
| `default_replay_service_version` | 'v1' | source-mrp-usage-guide Section 5 | Config Guide |
| `po_number_prefix` | 'PO' | Derived from model-inventory | POs |
| `mac_mini_local_ip` | 192.168.32.100 | source-mrp-usage-guide Section 1 | Config Guide |
| `replay_vlan_id` | 32 | source-mrp-usage-guide Section 1 | Config Guide |
| `surveillance_vlan_id` | 31 | source-mrp-usage-guide Section 1 | Config Guide |
| `access_control_vlan_id` | 33 | source-mrp-usage-guide Section 1 | Config Guide |
| `default_vlan_id` | 30 | source-mrp-usage-guide Section 1 | Config Guide |
| `replay_port` | 4000 | source-mrp-usage-guide Section 1 | Config Guide |
| `ddns_domain` | podplaydns.com | source-mrp-usage-guide Section 1 | Config Guide |
| `cc_terminal_pin` | 07139 | source-mrp-usage-guide (HW BOM notes) | Hardware BOM |
| `label_sets_per_court` | 5 | source-mrp-usage-guide Section 1 | Config Guide |
| `replay_sign_multiplier` | 2 | model-replay-signs frontier | Customer Replay Signs |

---

## CC Terminal & Front Desk Equipment Model

**Aspect**: model-cc-terminals
**MRP Sources**: "CC Form" sheet (terminal ordering), "Customer Replay Signs" sheet (sign fulfillment)

---

### Overview

Two parallel fulfillment workflows run alongside the standard BOM/PO flow:

1. **CC Terminal Ordering** — BBPOS WisePOS E Stripe terminals ordered separately per-project when `has_front_desk = true`. Tracked in `cc_terminals` table. Does NOT go through standard PO flow.
2. **Replay Sign Fulfillment** — Aluminum printed signs ordered from Fast Signs, qty = `court_count × 2`. Tracked in `replay_signs` table. Does NOT go through standard PO flow.

Both use their own status enums with distinct lifecycles. Both rows are auto-created when a project reaches the Procurement stage (Stage 2).

---

### Field Source Map: cc_terminals

**MRP Source**: "CC Form" sheet — one row per customer with terminal ordering details.

| Field | MRP Column | Type | Notes |
|-------|-----------|------|-------|
| `id` | — | UUID | PK, auto-generated |
| `project_id` | "Customer Name" column | UUID FK → projects | One row per project |
| `qty` | "# Terminals" | INTEGER DEFAULT 1 | Always 1 for standard venues; edge case may be 2 if large front desk |
| `status` | Derived from date columns | cc_terminal_status | Computed from which date columns are filled |
| `order_date` | "Date Ordered" | DATE | When ops placed order via Stripe dashboard |
| `expected_date` | "Expected Delivery" | DATE | Estimated arrival at NJ lab; from Stripe order confirmation |
| `delivered_date` | "Date Delivered" | DATE | When terminal arrived at NJ lab |
| `installed_date` | "Date Installed" | DATE | When terminal was set up at venue front desk |
| `stripe_order_id` | "Stripe Order #" / "Order Reference" | TEXT | Stripe hardware order number |
| `cost_per_unit` | Implicit | NUMERIC(10,2) DEFAULT 249.00 | $249 per BBPOS WisePOS E; from hardware catalog FD-CC-TERMINAL |
| `notes` | "Notes" | TEXT | Free text; e.g., "Delivered to Kim directly" |

**Derived**: `total_cost = qty × cost_per_unit` (computed client-side; not stored)

---

### CC Terminal Status State Machine

```
not_ordered ──order placed──→ ordered ──arrives at NJ lab──→ delivered ──set up at venue──→ installed
```

| Transition | Condition | Who Triggers |
|-----------|-----------|-------------|
| `not_ordered → ordered` | Ops enters `order_date` + `stripe_order_id` in webapp | Ops (Stage 2 Procurement) |
| `ordered → delivered` | Ops enters `delivered_date` | Ops (when box arrives at NJ lab) |
| `delivered → installed` | Ops enters `installed_date` | Ops (during on-site Stage 3 or Stage 4) |

Status is stored explicitly in `status` column and must be updated manually. The UI shows a status stepper with inline date fields for each transition.

**Admin PIN**: `settings.cc_terminal_pin` = `'07139'`
- Displayed to ops in the deployment checklist during Phase 15 (Handoff & Training).
- Used to configure the BBPOS WisePOS E terminal during on-site setup.
- Stored in settings so it can be updated org-wide if Stripe issues a new PIN.

---

### Field Source Map: replay_signs

**MRP Source**: "Customer Replay Signs" sheet — one row per customer.

| Field | MRP Column | Type | Notes |
|-------|-----------|------|-------|
| `id` | — | UUID | PK, auto-generated |
| `project_id` | "Customer" | UUID FK → projects | One row per project |
| `qty` | Computed: courts × 2 | INTEGER | Copied from `projects.replay_sign_count` at row creation |
| `status` | Derived / explicit | sign_status DEFAULT 'staged' | Manual status tracking |
| `outreach_channel` | "Outreach Method" | TEXT | 'slack' \| 'email' \| 'other' |
| `outreach_date` | "Date Outreach Sent" | DATE | When PodPlay ops contacted Fast Signs |
| `shipped_date` | "Date Shipped" | DATE | When Fast Signs shipped the order |
| `delivered_date` | "Date Delivered" | DATE | When signs arrived at venue |
| `installed_date` | "Date Installed" | DATE | When ops/installer mounted signs on courts |
| `tracking_number` | "Tracking #" | TEXT | Carrier tracking number |
| `vendor_order_id` | "Fast Signs Order #" | TEXT | Fast Signs order reference |
| `notes` | "Notes" | TEXT | Free text |

**Qty formula**: `qty = projects.court_count × settings.replay_sign_multiplier` (default: `court_count × 2`)

**Note**: `projects.replay_sign_count` is a generated column (`court_count * 2`) that stores this at the DB level. The `replay_signs.qty` column copies this value at row creation time. If `court_count` changes post-creation, `replay_signs.qty` must be manually updated.

---

### Replay Sign Status State Machine

```
staged ──outreach sent──→ shipped ──arrives at venue──→ delivered ──mounted on courts──→ installed
```

| Status | Meaning | Transition Trigger |
|--------|---------|-------------------|
| `staged` | Signs queued; no order placed yet | Default at row creation |
| `shipped` | Fast Signs has shipped the order | Ops enters `shipped_date` + `tracking_number` |
| `delivered` | Signs at venue | Ops enters `delivered_date` |
| `installed` | Mounted on courts | Ops enters `installed_date` |

**Note**: Outreach is tracked separately (`outreach_date` + `outreach_channel`) and does not change status. Status transitions when shipping/delivery/install dates are entered.

---

### Front Desk Equipment Bundling Logic

The `has_front_desk` flag on a project triggers three BOM items AND one `cc_terminals` row:

**BOM items added** (all `qty_per_venue = 1`):

| SKU | Item | Unit Cost | Notes |
|-----|------|-----------|-------|
| `FD-CC-TERMINAL` | BBPOS WisePOS E Credit Card Terminal | $249.00 | Ordered via Stripe separately — NOT via standard PO |
| `FD-QR-SCANNER` | 2D QR Code Barcode Scanner | $40.00 | Ordered via standard PO (Amazon) |
| `FD-WEBCAM` | Anker PowerConf C200 2K Webcam | $46.00 | Ordered via standard PO (Amazon) |

**Important distinction**: `FD-CC-TERMINAL` appears in the BOM for cost analysis and invoicing purposes, but its **physical procurement** is tracked exclusively in the `cc_terminals` table. It is NOT ordered via a `purchase_orders` row. The QR scanner and webcam ARE ordered via standard POs.

**Auto-row creation**: When a project transitions to Stage 2 (Procurement) with `has_front_desk = true`, the service layer calls `ensureFrontDeskRecords()`:

```typescript
// services/procurementService.ts
async function ensureFrontDeskRecords(projectId: string): Promise<void> {
  const project = await getProject(projectId);
  if (!project.has_front_desk) return;

  // Check if cc_terminals row already exists
  const { data: existing } = await supabase
    .from('cc_terminals')
    .select('id')
    .eq('project_id', projectId)
    .maybeSingle();

  if (!existing) {
    await supabase.from('cc_terminals').insert({
      project_id: projectId,
      qty: 1,
      status: 'not_ordered',
      cost_per_unit: 249.00,
    });
  }
}
```

**Auto-row creation for replay_signs**: When a project transitions to Stage 2 (Procurement), a `replay_signs` row is ALWAYS created (all tiers include replay cameras → all get signs):

```typescript
// services/procurementService.ts
async function ensureReplaySignRecord(projectId: string): Promise<void> {
  const project = await getProject(projectId);

  const { data: existing } = await supabase
    .from('replay_signs')
    .select('id')
    .eq('project_id', projectId)
    .maybeSingle();

  if (!existing) {
    await supabase.from('replay_signs').insert({
      project_id: projectId,
      qty: project.replay_sign_count,  // court_count * 2
      status: 'staged',
    });
  }
}
```

---

### Stage Entry Trigger (Stage 2 → Procurement)

When `projects.status` is updated to `'procurement'`, call both:

```typescript
await ensureFrontDeskRecords(projectId);
await ensureReplaySignRecord(projectId);
```

These are idempotent — safe to call multiple times.

---

### CC Terminal Ordering Workflow (Replaces MRP "CC Form" Sheet)

Step-by-step workflow as it appears in the webapp:

1. **Stage 2 entry**: System auto-creates `cc_terminals` row (status: `not_ordered`) when `has_front_desk = true`.

2. **Procurement stage UI**: The "Front Desk" section in Stage 2 wizard shows:
   - Status stepper: `not_ordered → ordered → delivered → installed`
   - "Order Terminal" button (enabled when status = `not_ordered`)
   - Clicking opens a form: qty (default 1), Stripe order reference, expected date
   - On submit: inserts `order_date = today`, `stripe_order_id`, `expected_date`, `status = 'ordered'`

3. **Delivery confirmation**: When terminal arrives at NJ lab:
   - Ops clicks "Mark Delivered" in Stage 2 UI
   - Enters `delivered_date` (defaults to today)
   - Status → `'delivered'`

4. **On-site installation**: During Stage 3 deployment or Stage 4 financial close:
   - Ops clicks "Mark Installed"
   - Enters `installed_date`
   - Status → `'installed'`

5. **Cost tracking**: `cc_terminals.cost_per_unit × qty` feeds into project expense summary (shown in Stage 4 P&L review as a front desk line item).

---

### Replay Sign Ordering Workflow (Replaces MRP "Customer Replay Signs" Sheet)

1. **Stage 2 entry**: System auto-creates `replay_signs` row (status: `staged`, qty = `court_count × 2`).

2. **Procurement stage UI**: "Replay Signs" section in Stage 2 wizard shows:
   - Qty: `{court_count × 2} signs` (read-only, derived)
   - Status stepper: `staged → shipped → delivered → installed`
   - Outreach tracking: "Record Outreach" button → form with `outreach_channel` (dropdown: Slack / Email / Other) + `outreach_date`
   - "Mark Shipped" button: enter `shipped_date`, `tracking_number`, `vendor_order_id`
   - "Mark Delivered" button: enter `delivered_date`
   - "Mark Installed" button: enter `installed_date`

3. **Inventory decrement**: When status → `'installed'`, the system decrements inventory for `REPLAY-SIGN` SKU:
   ```typescript
   await createInventoryMovement({
     hardware_catalog_id: replaySignCatalogId,
     project_id: projectId,
     movement_type: 'shipped',
     qty_delta: -(replay_signs.qty),
     reference: `Replay signs installed for project ${project.customer_name}`,
   });
   ```

---

### Known Gaps in CC Terminal Model

| Gap | Impact | Resolution |
|----|--------|-----------|
| Exact "CC Form" sheet column names | Field source map derived from frontier aspect description, not XLSX inspection | Requires source-existing-data aspect (XLSX blocked) |
| Whether `qty > 1` ever occurs | Model assumes 1 per venue; real data may show 2 for large front desks | Requires XLSX real data |
| Stripe hardware ordering URL/process | Unknown whether Stripe has a dedicated hardware portal or reps handle manually | Requires Kim Lapus input |
| Sign status vs outreach status distinction | Current model separates them; MRP may have treated outreach as a status change | Requires XLSX "Customer Replay Signs" sheet inspection |
| Whether replay sign qty ever deviates from `court_count × 2` | `replay_sign_count` generated column enforces 2×; real data may have exceptions | Requires XLSX real data |

### Known Gaps in Settings Model

| Gap | Impact | Resolution |
|----|--------|-----------|
| `pbk_venue_fee` and `pbk_court_fee` exact values | PBK projects will have $0 fees until admin manually sets them | Requires XLSX or Kim Lapus input |
| `deposit_pct` exact value (assumed 50%) | Deposit invoices may be wrong amount | Requires XLSX INVOICING sheet |
| Switch/SSD/NVR sizing breakpoints (`switch_24_max_courts`, etc.) | BOM may select wrong item for edge-case court counts | Requires XLSX BOM template |
| All `team_opex.annual_salary` values | HER calculation returns 0 until populated | Requires XLSX HER sheet |
| Whether rent is split direct/indirect or all-indirect | HER denominator may be over/understated | Requires XLSX HER formula |
| `isp_fiber_mbps_per_court` and `isp_cable_upload_min_mbps` precise thresholds | ISP validation warnings may fire incorrectly | Requires deployment guide ISP speed table (see source-deployment-guide analysis) |

---

## Device Migration Model (ABM Transfer Workflow)

**Aspect**: model-device-migration
**Date**: 2026-03-06
**Sources**: analysis/source-deployment-guide.md (Appendix E, Appendix F Q9-Q11), analysis/model-device-migration.md

Tracks Apple Business Manager (ABM) org transfer events — when devices from one ABM/MDM
environment must be migrated to another (e.g., PingPod Inc → Cosmos PH for Asia expansion).

---

### New Enums (Device Migration)

```sql
-- MDM provider options for target org
CREATE TYPE mdm_provider AS ENUM (
  'mosyle',  -- Apple-only, cheaper, current PodPlay choice
  'jamf',    -- Apple-only, premier, more configuration options
  'other'    -- Cross-platform or custom MDM (needed if Android added)
);

-- Overall migration event status
CREATE TYPE device_migration_status AS ENUM (
  'planning',    -- Migration planned; source org not yet contacted
  'released',    -- Source org confirmed device release in their ABM
  'enrolled',    -- Devices powered on and auto-enrolled in target MDM
  'configured',  -- Naming + apps + App Lock + P-List all re-applied
  'completed',   -- End-to-end verified; migration closed
  'cancelled'    -- Migration cancelled before completion
);

-- Physical device type being migrated
CREATE TYPE migration_device_type AS ENUM (
  'ipad',       -- iPad kiosk (App Lock, VPP, P-List LOCATION_ID)
  'apple_tv',   -- Apple TV 4K display (App Install, naming)
  'mac_mini'    -- Mac Mini replay server (re-enroll only; replay service unaffected)
);

-- Per-device item status within a migration
CREATE TYPE migration_device_status AS ENUM (
  'pending',     -- Not yet released from source ABM
  'released',    -- Released from source ABM; factory reset occurs on next boot
  'enrolled',    -- Auto-enrolled in target MDM (confirmed in Mosyle/Jamf console)
  'configured'   -- Naming, apps, App Lock, P-List all re-applied and verified
);
```

---

### Table: `device_migrations`

One row per ABM transfer event. May cover multiple device types for the same venue.
`project_id` is optional — a migration may be initiated before a project is created,
or may relate to an existing project during a handoff.

```sql
CREATE TABLE device_migrations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Linked project (nullable — can migrate a device pool before project assignment)
  project_id            UUID REFERENCES projects(id) ON DELETE SET NULL,
  -- Human-readable label for this migration event
  migration_label       TEXT NOT NULL,
  -- Source organization (the org releasing devices from their ABM)
  source_org_name       TEXT NOT NULL,   -- e.g., "PingPod Inc"
  source_abm_org_id     TEXT,            -- Apple internal org ID (optional, informational)
  -- Target organization (receiving devices into their ABM + MDM)
  target_org_name       TEXT NOT NULL,   -- e.g., "Cosmos PH"
  target_abm_org_id     TEXT,
  target_mdm            mdm_provider NOT NULL DEFAULT 'mosyle',
  -- Mosyle group to create for this venue after enrollment
  -- Pattern: "{Client} - {VenueName}" (e.g., "Cosmos PH - Quezon City")
  target_mosyle_group   TEXT,
  -- Migration status
  status                device_migration_status NOT NULL DEFAULT 'planning',
  -- Timeline — each state transition stamps a date
  initiated_date        DATE,            -- When ops contacts source org to request release
  devices_released_date DATE,            -- When source org confirms release in their ABM
  devices_enrolled_date DATE,            -- When all/most devices appear in target MDM
  configs_applied_date  DATE,            -- When naming/apps/App Lock all re-applied
  completed_date        DATE,
  -- Free-form notes (async coordination with Andy, Nico, external contacts)
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_device_migrations_project ON device_migrations(project_id);
CREATE INDEX idx_device_migrations_status  ON device_migrations(status);

CREATE TRIGGER update_device_migrations_updated_at
  BEFORE UPDATE ON device_migrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

### Table: `device_migration_items`

One row per physical device. Serial numbers are the canonical identifier (from
Apple Configurator or Mosyle device list). Items advance independently — partial
enrollment is normal (some devices may fail on first attempt).

```sql
CREATE TABLE device_migration_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_id      UUID NOT NULL REFERENCES device_migrations(id) ON DELETE CASCADE,
  serial_number     TEXT NOT NULL,                    -- Apple serial (12 chars)
  device_type       migration_device_type NOT NULL,
  -- Court assignment (NULL for Mac Mini — one per venue, not per court)
  court_number      INTEGER CHECK (court_number >= 1),
  -- Target label to apply in MDM after enrollment
  -- iPad pattern:    "iPad {Client} Court {N}"    — Phase 10, Step 91
  -- AppleTV pattern: "AppleTV {Client} Court {N}" — Phase 11, Step 96b
  -- Mac Mini pattern: "{Client} Mac Mini"
  target_mdm_label  TEXT,
  -- Item-level status (independent of migration-level status)
  status            migration_device_status NOT NULL DEFAULT 'pending',
  -- Per-device step timestamps
  enrolled_at       TIMESTAMPTZ,         -- When confirmed in Mosyle/Jamf
  configured_at     TIMESTAMPTZ,         -- When naming/apps/App Lock verified
  -- iPad-specific: power-on sequence must match court-number order
  -- (Mosyle enrolls devices in the order they power on)
  -- WARNING from Phase 10: "If you power on out of order, device-to-court mapping will be wrong"
  enrollment_order  INTEGER,             -- Expected power-on sequence (1=first, 2=second...)
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Serial must be unique within a migration event
  CONSTRAINT uq_migration_serial UNIQUE (migration_id, serial_number)
);

CREATE INDEX idx_migration_items_migration ON device_migration_items(migration_id);
CREATE INDEX idx_migration_items_serial    ON device_migration_items(serial_number);
CREATE INDEX idx_migration_items_status    ON device_migration_items(status);

CREATE TRIGGER update_device_migration_items_updated_at
  BEFORE UPDATE ON device_migration_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

### RLS Policies

```sql
ALTER TABLE device_migrations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_migration_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY device_migrations_all      ON device_migrations      USING (true) WITH CHECK (true);
CREATE POLICY device_migration_items_all ON device_migration_items USING (true) WITH CHECK (true);
```

---

### Field Source Map — `device_migrations`

| Field | Source | Notes |
|-------|--------|-------|
| project_id | New field | Links migration to project; NULL allowed |
| migration_label | No MRP equivalent | Internal ops label |
| source_org_name | Appendix F Q9 — "PingPod Inc" | Known source for Asia migration |
| target_org_name | Appendix F Q9 — "Cosmos PH" | Known target for Asia migration |
| target_mdm | Appendix E — Mosyle (current) | Jamf mentioned as alternative |
| target_mosyle_group | Phase 10 Step 91 — naming group | Created per venue in Mosyle |
| status | Appendix E 6-step workflow → 5 status values | planning through completed |
| initiated_date | Appendix E Step 1 | When ops asks source to release |
| devices_released_date | Appendix E Step 2 | Factory reset follows automatically |
| devices_enrolled_date | Appendix E Step 5 | Auto-enrollment on device power-on |
| configs_applied_date | Appendix E Step 6 | Naming + apps + App Lock |

### Field Source Map — `device_migration_items`

| Field | Source | Notes |
|-------|--------|-------|
| serial_number | Apple Business Manager / Configurator | 12-char Apple serial |
| device_type | Appendix E device list | Determines which configs to re-apply |
| court_number | Phase 10 Step 91 naming scheme | NULL for Mac Mini (1 per venue) |
| target_mdm_label | Phase 10 Step 91 + Phase 11 Step 96b naming | Formatted at config time |
| status | Per-device tracking | Independent of migration-level status |
| enrollment_order | Phase 10 WARNING — power-on order critical | Must be 1, 2, 3... in court order |

---

### Migration Progress Calculation

Migration-level status derives from item statuses plus manual ops advancement:

| Transition | Trigger |
|------------|---------|
| `planning` → `released` | Ops manually advances when source org confirms release |
| `released` → `enrolled` | Auto-derived: ALL items have `status IN ('enrolled', 'configured')` |
| `enrolled` → `configured` | Auto-derived: ALL items have `status = 'configured'` |
| `configured` → `completed` | Ops manually marks complete after end-to-end test |
| Any → `cancelled` | Ops manually cancels |

Progress percentage (for UI progress bar):
```typescript
// Weights: pending=0%, released=25%, enrolled=75%, configured=100%
const WEIGHT: Record<MigrationDeviceStatus, number> = {
  pending: 0, released: 25, enrolled: 75, configured: 100
};
const migrationProgress = (items: DeviceMigrationItem[]): number => {
  if (items.length === 0) return 0;
  const total = items.reduce((sum, i) => sum + WEIGHT[i.status], 0);
  return Math.round(total / items.length);
};
```

---

### Key Business Rules

1. **iPad enrollment order is critical**: Power on iPads sequentially in court-number order.
   Mosyle assigns devices in power-on order. If out of order, court mapping is wrong.
   After enrollment, verify by filtering Mosyle by "enrolled date" — should match court 1, 2, 3...
   The `enrollment_order` field documents the intended sequence.

2. **Mac Mini replay service survives**: Factory reset removes MDM profiles only.
   Samsung SSD content (clips, cache folders), DDNS cron, and replay service binary all persist.
   Mac Mini still needs ABM re-enrollment to receive future MDM configuration pushes.

3. **App Lock must be OFF before Flic button re-pairing**: After re-enrollment,
   Bluetooth buttons must be re-paired. Turn App Lock to 24/7 OFF until all pairing is complete.
   Then schedule the 2:00–3:00 AM daily window.

4. **VPP licenses are not auto-transferred**: New ABM org must have VPP licenses for
   PodPlay's white-labeled app before app installation can proceed.
   Coordinate with Agustin (app readiness) before device power-on.

---

### Updated Migration Order (Full)

```
1.  Create all enums (including mdm_provider, device_migration_status, migration_device_type, migration_device_status)
2.  update_updated_at() function
3.  installers
4.  settings
5.  hardware_catalog
6.  projects
7.  bom_templates
8.  project_bom_items
9.  inventory
10. inventory_movements
11. purchase_orders
12. purchase_order_items
13. deployment_checklist_templates
14. deployment_checklist_items
15. invoices
16. expenses
17. replay_signs
18. cc_terminals
19. monthly_opex_snapshots
20. troubleshooting_tips
21. device_migrations     (references projects — nullable FK)
22. device_migration_items (references device_migrations — cascade delete)
```

---

### Known Gaps in Device Migration Model

| Gap | Impact | Resolution |
|----|--------|-----------|
| VPP license transfer process | Migration completes but apps won't install without licenses in new org | Requires Agustin / Apple Business Manager confirmation |
| `source_abm_org_id` / `target_abm_org_id` exact format | Apple's internal org ID format not documented | Non-blocking — fields are optional TEXT |
| Android MDM path | If Android kiosks added, Mosyle/Jamf won't work | Requires product decision — not a current concern |
| Jamf pricing | Unknown — Mosyle is current choice | Non-blocking |
| Serial numbers may not be available before migration | Items can be added progressively as serials are gathered | `device_migration_items` rows added as needed; no blocking constraint |

---

## International Deployment

**Source**: `analysis/model-international-deployment.md`
**Covers**: Philippines (Cosmos franchise entity), Asia deployment constraints, region-specific ISP/power/video requirements

### New Enums

```sql
-- Geographic deployment region
CREATE TYPE deployment_region AS ENUM (
  'us',          -- United States (default for all current venues)
  'philippines'  -- Philippines (Asia deployment via Cosmos franchise entity)
);

-- Video encoding standard (impacts Mac Mini setup and camera firmware)
CREATE TYPE video_standard AS ENUM (
  'ntsc',  -- 60Hz (US default — all current deployments)
  'pal'    -- 50Hz (Asia/Europe — open question for Philippines replay pipeline)
);

-- Electrical power standard
CREATE TYPE power_standard AS ENUM (
  '120v_60hz',  -- US standard — all current hardware designed for this
  '220v_60hz'   -- Philippines (same frequency as US, different voltage — compatibility TBD)
);
```

### Fields Added to `projects` Table

```sql
-- Append these columns to the projects table CREATE statement:
deployment_region         deployment_region    NOT NULL DEFAULT 'us',
video_standard            video_standard       NOT NULL DEFAULT 'ntsc',
power_standard            power_standard       NOT NULL DEFAULT '120v_60hz',
isp_provider              TEXT,
-- e.g. 'PLDT Beyond Fiber', 'Globe GFiber Biz', 'Converge FlexiBIZ', 'Verizon Fios'
isp_provider_backup       TEXT,
-- Second ISP for Autonomous/24hr venues (required for Philippines autonomous)
isp_has_static_ip         BOOLEAN              NOT NULL DEFAULT false,
isp_has_backup_static_ip  BOOLEAN              NOT NULL DEFAULT false,
cosmos_entity             BOOLEAN              NOT NULL DEFAULT false,
-- true = Cosmos franchise deployment; triggers international validation warnings in wizard
```

### New Table: `deployment_regions`

Reference table with region-specific configuration, ISP requirements, and open questions. Drives wizard validation warnings.

```sql
CREATE TABLE deployment_regions (
  id              TEXT PRIMARY KEY,          -- 'us', 'philippines'
  display_name    TEXT          NOT NULL,    -- 'United States', 'Philippines'
  power_standard  power_standard NOT NULL,
  video_standard  video_standard NOT NULL,

  -- ISP requirements
  requires_business_plan  BOOLEAN  NOT NULL DEFAULT false,
  -- true = residential ISP plans (CGNAT) are incompatible
  requires_static_ip      BOOLEAN  NOT NULL DEFAULT false,
  requires_dual_isp       TEXT,
  -- NULL = never required; 'autonomous' = required for autonomous/autonomous_plus tier
  starlink_blocked        BOOLEAN  NOT NULL DEFAULT true,
  -- Starlink uses CGNAT and blocks port 4000 in all regions

  -- Supported ISPs (JSON array of {name: string, plan_name: string})
  supported_isps          JSONB    NOT NULL DEFAULT '[]',

  -- Wizard warning messages
  isp_warning             TEXT,   -- Shown if isp_has_static_ip = false
  power_warning           TEXT,   -- Shown until power compatibility confirmed
  video_warning           TEXT,   -- Shown until video_standard confirmed

  -- Open questions from Appendix F (Philippines-specific)
  -- JSON array: [{id, question, category, priority, status: 'open'|'answered', resolution}]
  open_questions          JSONB    NOT NULL DEFAULT '[]',

  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TRIGGER deployment_regions_updated_at
  BEFORE UPDATE ON deployment_regions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: read-only reference data for all authenticated users
ALTER TABLE deployment_regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY deployment_regions_read ON deployment_regions
  FOR SELECT TO authenticated USING (true);
```

### Seed Data: `deployment_regions`

#### United States

```sql
INSERT INTO deployment_regions (
  id, display_name, power_standard, video_standard,
  requires_business_plan, requires_static_ip, requires_dual_isp, starlink_blocked,
  supported_isps, isp_warning, power_warning, video_warning, open_questions
) VALUES (
  'us',
  'United States',
  '120v_60hz',
  'ntsc',
  false,
  false,
  'autonomous',
  true,
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
);
```

#### Philippines

```sql
INSERT INTO deployment_regions (
  id, display_name, power_standard, video_standard,
  requires_business_plan, requires_static_ip, requires_dual_isp, starlink_blocked,
  supported_isps, isp_warning, power_warning, video_warning, open_questions
) VALUES (
  'philippines',
  'Philippines',
  '220v_60hz',
  'ntsc',
  -- video_standard set to 'ntsc' pending resolution of Appendix F Q1
  true,
  true,
  'autonomous',
  true,
  '[
    {"name": "PLDT", "plan_name": "PLDT Beyond Fiber (Business)"},
    {"name": "Globe", "plan_name": "Globe GFiber Biz"},
    {"name": "Converge", "plan_name": "Converge FlexiBIZ"}
  ]',
  'Philippines deployments REQUIRE a business plan with static IP. Residential plans use CGNAT which blocks port 4000. For Autonomous/24hr venues, dual ISP is required — use PLDT + Converge (different backbones). Do NOT pair PLDT + Globe (shared backbone).',
  'WARNING: Power standard is 220V/60Hz. Verify all hardware SKUs support 220V before ordering: EmpireTech cameras, Flic buttons, Mac Mini, UDM Pro, all switches. (Appendix F, Q3 — CRITICAL, unresolved)',
  'WARNING: PAL vs NTSC video standard for Philippines replay pipeline is unresolved (Appendix F, Q1 — CRITICAL). Camera firmware region-lock status unresolved (Q2). Deploying as NTSC until resolved with Stan/Patrick.',
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
```

### Wizard Validation Rules (International)

When `projects.deployment_region = 'philippines'`:

1. **ISP static IP gate** (Stage 1, blocking): Block advancement past Intake until `isp_has_static_ip = true`.
   Warning: "Philippines deployments require a business ISP plan with static IP. Residential CGNAT will block port 4000."

2. **Dual ISP warning for Autonomous** (Stage 1, non-blocking): If `tier IN ('autonomous', 'autonomous_plus')` and `isp_provider_backup IS NULL`.
   Warning: "Autonomous venues operating 24/7 require two ISPs from different providers. PLDT + Converge recommended. Do NOT use PLDT + Globe."

3. **Power standard warning** (Stage 1, non-blocking): Show on project creation.
   Warning: "220V/60Hz hardware compatibility is unconfirmed. Resolve Appendix F Q3 before ordering."

4. **Video standard warning** (Stage 1, non-blocking): Show on project creation.
   Warning: "PAL vs NTSC replay pipeline impact is unresolved (Appendix F Q1). Deploying as NTSC — verify with Stan/Patrick."

5. **BOM vendor flags** (Stage 2): For Philippines projects, annotate hardware items in BOM review:
   - EmpireTech cameras, Flic buttons, Kisi → `sourcing_status: 'unconfirmed_philippines'`
   - UniFi, Apple devices, Samsung SSD → `sourcing_status: 'available'`

### Updated Migration Order

```
-- Additions to migration order (inserts around existing items):
1a. CREATE TYPE deployment_region      (before projects table)
1b. CREATE TYPE video_standard         (before projects table)
1c. CREATE TYPE power_standard         (before projects table)
 6. projects                           (with new deployment_region columns)
22. device_migrations
23. device_migration_items
24. deployment_regions                 (reference table — no FK deps)
25. INSERT seed data for deployment_regions
```

### Known Gaps

| Gap | Impact | Resolution |
|-----|--------|-----------|
| PAL vs NTSC replay impact | Cannot finalize video_standard default for Philippines | Resolve Appendix F Q1 during NJ Training (March 2–10, 2026) |
| 220V/60Hz hardware compatibility | Cannot confirm BOM for Philippines shipping | Resolve Appendix F Q3 per-SKU during NJ Training |
| EmpireTech/Flic/Kisi Philippines availability | BOM may require alternate sourcing or import | Resolve Q16/Q17/Q18 during NJ Training |
| deploy.py availability for Cosmos | Philippines replay service deployment may be blocked | Resolve Q6/Q7 — may need own deployment server in Manila |
| FreeDNS domain for Asia | DDNS subdomain format may differ (podplaydns.com vs cosmos-specific) | Resolve Q12 — product decision |
| Admin Dashboard sharing | If Cosmos needs own instance, provisioning differs from US venues | Resolve Q8 — requires PodPlay/Cosmos agreement |

---

## Network Reference Model

**Source**: `analysis/model-network-reference.md`
**Aspect**: model-network-reference

Two new reference/seed tables: `network_vlans` (4 VLANs used in every PodPlay deployment) and `isp_bandwidth_requirements` (court count → minimum ISP speeds).

---

## Table: network_vlans

VLAN architecture reference. One row per VLAN. All PodPlay deployments use the REPLAY VLAN; SURVEILLANCE and ACCESS CONTROL are conditional by tier.

**Source**: Deployment guide Phase 4 Steps 42–44, Appendix C.

```sql
CREATE TABLE network_vlans (
  id                   TEXT        PRIMARY KEY,
  -- 'default', 'replay', 'surveillance', 'access_control'

  display_name         TEXT        NOT NULL,
  -- 'Default (Management)', 'REPLAY', 'SURVEILLANCE', 'ACCESS CONTROL'

  vlan_id              INTEGER,
  -- VLAN tag. NULL for Default (untagged). 32=REPLAY, 31=SURVEILLANCE, 33=ACCESS_CONTROL.
  -- UniFi "Manual" VLAN ID entry. REPLAY ID 32 is fixed; others follow the same convention.

  subnet               TEXT        NOT NULL,
  -- CIDR notation: '192.168.30.0/24', '192.168.32.0/24', '192.168.31.0/24', '192.168.33.0/24'

  gateway_ip           TEXT        NOT NULL,
  -- UDM gateway IP for this VLAN.
  -- REPLAY: 192.168.32.254 (explicitly documented in Step 42 settings table).
  -- Default: 192.168.30.1 (post-camera-config final state; initially 192.168.1.1).
  -- SURVEILLANCE/ACCESS CONTROL: .254 per subnet (same convention as REPLAY; confirm with Nico).

  dhcp_start           TEXT,
  -- DHCP pool start IP. '192.168.32.1' for REPLAY. NULL = not a DHCP server.

  dhcp_end             TEXT,
  -- DHCP pool end IP. '192.168.32.254' for REPLAY. NULL = not a DHCP server.

  mdns_enabled         BOOLEAN     NOT NULL DEFAULT false,
  -- TRUE only for REPLAY VLAN. Required for Apple TV <-> iPad mDNS discovery.
  -- Explicitly specified: Step 42 "mDNS: Yes (required for Apple TV discovery)".

  allows_internet      BOOLEAN     NOT NULL DEFAULT true,
  -- All VLANs allow internet access. Step 42: "Allow Internet Access: Yes".

  required_for_tiers   TEXT[],
  -- NULL = all tiers require this VLAN (Default and REPLAY).
  -- ['autonomous_plus'] = SURVEILLANCE (NVR + security cameras).
  -- ['autonomous', 'autonomous_plus'] = ACCESS CONTROL (Kisi/UniFi Access).

  is_conditional       BOOLEAN     NOT NULL DEFAULT false,
  -- FALSE = always create (Default, REPLAY).
  -- TRUE = only create if tier requires it (SURVEILLANCE, ACCESS CONTROL).

  notes                TEXT,
  -- Deployment context and warnings for the wizard checklist.

  sort_order           INTEGER     NOT NULL DEFAULT 0,
  -- Display order: 1=Default, 2=REPLAY, 3=SURVEILLANCE, 4=ACCESS CONTROL.

  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS needed — read-only reference data for all authenticated users.
ALTER TABLE network_vlans ENABLE ROW LEVEL SECURITY;
CREATE POLICY network_vlans_read ON network_vlans
  FOR SELECT TO authenticated USING (true);
-- No INSERT/UPDATE/DELETE for non-admin users — managed via migrations.
```

**Indexes**: None beyond PK — table has 4 rows.

### Seed Data: network_vlans

```sql
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
    false,
    true,
    NULL,
    false,
    'Management VLAN. NOTE: During Phase 6 camera configuration the Default network temporarily uses 192.168.1.1 (cameras factory-default to 192.168.1.108 on this subnet). After all cameras are configured and moved to REPLAY VLAN, change Default network to 192.168.30.1 subnet (Step 58). Do NOT change the Default network before all cameras are configured.',
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
    true,
    true,
    NULL,
    false,
    'Primary PodPlay operating VLAN. Carries all replay traffic: Mac Mini (fixed 192.168.32.100), replay cameras (DHCP-fixed per court), iPads, Apple TVs. mDNS REQUIRED for Apple TV discovery. Port 4000 forwarded to 192.168.32.100. All tiers use this VLAN. Create first.',
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
    false,
    true,
    ARRAY['autonomous_plus'],
    true,
    'Surveillance VLAN for UniFi NVR and security cameras. Autonomous+ tier only (has_nvr = true). Create only if security_camera_count > 0. Gateway .254 follows REPLAY VLAN convention (Step 43 does not specify gateway; assumed .254).',
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
    false,
    true,
    ARRAY['autonomous', 'autonomous_plus'],
    true,
    'Access control VLAN for Kisi Controller Pro 2 or UniFi Access hub and door readers. Autonomous and Autonomous+ tiers. Create only if door_count > 0. Gateway .254 follows REPLAY VLAN convention (Step 44 does not specify gateway; assumed .254).',
    4
  );
```

### Fixed IP Reference (not a table — constants used in config)

| Device | IP | VLAN | Notes |
|--------|----|------|-------|
| Mac Mini (replay server) | 192.168.32.100 | REPLAY (32) | Always this IP. Fixed assignment in UniFi. Port 4000 forwards here. Step 71: "assign Mac Mini to REPLAY VLAN with fixed address 192.168.32.100". |
| REPLAY VLAN gateway (UDM) | 192.168.32.254 | REPLAY (32) | UDM acts as gateway. Exact value from Step 42 settings table. |
| Camera (factory default) | 192.168.1.108 | Default (initial) | All cameras ship with this IP. Configure ONE AT A TIME while Default is 192.168.1.x. Step 49: "Navigate to 192.168.1.108 in browser". |
| Cameras (post-config) | 192.168.32.x (DHCP fixed) | REPLAY (32) | Assigned per-venue in UniFi after initial config. Court 1 = 192.168.32.101 by convention (not documented — confirm per-venue). |
| Default VLAN gateway (UDM) | 192.168.30.1 | Default (30) | Final state after camera config is complete (Step 58). |

These constants are stored in `settings` table:
- `settings.mac_mini_fixed_ip = '192.168.32.100'` (already in settings seed)
- `settings.replay_vlan_gateway = '192.168.32.254'`
- `settings.camera_factory_default_ip = '192.168.1.108'`
- `settings.replay_vlan_id = 32`
- `settings.surveillance_vlan_id = 31`
- `settings.access_control_vlan_id = 33`
- `settings.default_vlan_subnet = '192.168.30'`

**Source**: settings table already stores `vlan_id_default = 30`, `vlan_id_replay = 32`, `vlan_id_surveillance = 31`, `vlan_id_access_control = 33`, `mac_mini_fixed_ip = '192.168.32.100'`, `replay_service_port = 4000`.

---

## Table: isp_bandwidth_requirements

Reference table for minimum ISP speeds per court count range. Drives intake wizard validation.

**Source**: Deployment guide Phase 0 Step 5 (exact table), Appendix C.

```sql
CREATE TABLE isp_bandwidth_requirements (
  id                      SERIAL      PRIMARY KEY,

  court_min               INTEGER     NOT NULL,
  -- Lower bound of court count range (inclusive): 1, 5, 12, 20, 25.

  court_max               INTEGER,
  -- Upper bound (inclusive). NULL = no upper limit (25+ courts row).

  fiber_mbps              INTEGER     NOT NULL,
  -- Minimum symmetric Mbps required for fiber ISP.
  -- Fiber is symmetrical (equal upload and download).
  -- Row 1 (1–4 courts): 50 = minimum (range 50–100 Mbps is acceptable; 50 is the floor).

  cable_upload_mbps       INTEGER,
  -- Minimum upload Mbps for cable ISP. NULL = "highest possible" (no fixed minimum).
  -- Only row 1 (1–4 courts) has a specific cable requirement: 60 Mbps upload.
  -- For cable, download speed is not the constraint — upload is.

  cable_note              TEXT,
  -- Human-readable cable note shown in wizard.
  -- '60 Mbps upload minimum' or 'Highest possible upload'.

  dedicated_mbps          INTEGER     NOT NULL,
  -- Minimum symmetric Mbps for a dedicated ISP circuit (equal up/down).

  sort_order              INTEGER     NOT NULL DEFAULT 0,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS needed — read-only reference data.
ALTER TABLE isp_bandwidth_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY isp_bandwidth_read ON isp_bandwidth_requirements
  FOR SELECT TO authenticated USING (true);
```

**Indexes**: None beyond PK — 5 rows, full scan is trivially fast.

### Seed Data: isp_bandwidth_requirements

```sql
INSERT INTO isp_bandwidth_requirements
  (court_min, court_max, fiber_mbps, cable_upload_mbps, cable_note, dedicated_mbps, sort_order)
VALUES
  (1,   4,    50,  60,   '60 Mbps upload minimum',   30,  1),
  -- Source: "1–4 courts: Fiber 50–100/100 Mbps, Cable 60 Mbps upload, Dedicated 30/30"
  -- Fiber: 50 Mbps symmetric minimum (range 50–100 Mbps acceptable; store minimum)
  -- Cable: 60 Mbps upload is the only court-band with a hard cable floor
  -- Dedicated: 30 Mbps symmetric

  (5,  11,  150,  NULL, 'Highest possible upload',   50,  2),
  -- Source: "5–11 courts: Fiber 150/150 Mbps, Cable highest possible upload, Dedicated 50/50"
  -- Fiber: 150 Mbps symmetric
  -- Cable: no fixed minimum — highest available upload tier
  -- Dedicated: 50 Mbps symmetric

  (12, 19,  200,  NULL, 'Highest possible upload',   50,  3),
  -- Source: "12–19 courts: Fiber 200/200 Mbps, Cable highest possible upload, Dedicated 50/50"
  -- Fiber: 200 Mbps symmetric
  -- Dedicated: 50 Mbps symmetric

  (20, 24,  300,  NULL, 'Highest possible upload',  100,  4),
  -- Source: "20–24 courts: Fiber 300/300 Mbps, Cable highest possible upload, Dedicated 100/100"
  -- Fiber: 300 Mbps symmetric
  -- Dedicated: 100 Mbps symmetric

  (25, NULL, 400, NULL, 'Highest possible upload',  150,  5);
  -- Source: "25+ courts: Fiber 400/400 Mbps, Cable highest possible upload, Dedicated 150/150"
  -- Fiber: 400 Mbps symmetric; court_max NULL = no upper bound
  -- Dedicated: 150 Mbps symmetric
```

### ISP Validation Logic

Used in intake wizard Stage 1 (Step 5 — "Confirm internet speed meets requirements"):

```typescript
// 1. Fetch the requirement row for this project's court count:
//    SELECT * FROM isp_bandwidth_requirements
//    WHERE court_min <= court_count AND (court_max IS NULL OR court_max >= court_count)
//    LIMIT 1;

// 2. Validation by ISP type:
//    fiber:     internet_upload_mbps >= req.fiber_mbps (symmetric — upload = download)
//    cable:     req.cable_upload_mbps IS NULL → show cable_note as advisory (no hard block)
//               req.cable_upload_mbps IS NOT NULL → internet_upload_mbps >= req.cable_upload_mbps
//    dedicated: internet_upload_mbps >= req.dedicated_mbps AND internet_download_mbps >= req.dedicated_mbps
//    other:     advisory warning only — no hard minimum defined

// 3. Starlink hard block (any ISP type):
//    isp_provider ILIKE '%starlink%' → BLOCKING error:
//    "PodPlay systems are NOT compatible with Starlink. Starlink uses CGNAT which blocks
//     port 4000. The entire replay system will not function. Select a different ISP."
```

### Updated Migration Order

```
-- Additions (append after existing 25-item migration order):
26. network_vlans              (no FK dependencies)
27. INSERT seed data for network_vlans    (4 rows)
28. isp_bandwidth_requirements (no FK dependencies)
29. INSERT seed data for isp_bandwidth_requirements    (5 rows)
```

### Known Gaps

| Gap | Impact | Resolution |
|-----|--------|-----------|
| SURVEILLANCE VLAN gateway not explicitly documented | Could be .1 or .254 | Assumed .254 (REPLAY convention); confirm with Nico during Phase 4 |
| ACCESS CONTROL VLAN gateway not explicitly documented | Same | Same |
| Camera DHCP fixed IPs (per-court in REPLAY VLAN) | Not normalized — venue-specific | Stored as notes in deployment checklist items; not a reference table concern |
| Fiber speed for 1–4 courts: "50–100/100" interpretation | Stored as 50 Mbps minimum; actual range is 50–100 | If any plan 50/50 is acceptable, 50 is correct minimum |

---

## 30–31. Team Contacts Directory

**Aspect**: model-contacts-directory
**Source**: Appendix C (Key Contacts table), Appendix D (Support Tiers), deployment guide training refs

### `team_contacts`

```sql
-- team_contacts
-- Internal PodPlay team directory — seeded once, editable in Settings > Team
-- Source: Appendix C Key Contacts + Appendix D Support Tiers
CREATE TABLE team_contacts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT        NOT NULL UNIQUE,          -- 'andy', 'nico', 'chad', 'stan', 'agustin', 'cs-team', 'patrick'
  name          TEXT        NOT NULL,                 -- Full name or team name
  role          TEXT        NOT NULL,                 -- Human-readable role description
  department    TEXT        NOT NULL,                 -- 'pm', 'hardware', 'operations', 'config', 'app', 'cs', 'engineering'
  phone         TEXT,                                 -- E.164 or formatted; NULL if unknown
  email         TEXT,                                 -- NULL if unknown
  contact_via   TEXT,                                 -- Free text: 'Via Chad', 'Slack #installs', etc. NULL if direct
  support_tier  SMALLINT    CHECK (support_tier IN (1, 2, 3)),  -- NULL if not a support escalation contact
  notes         TEXT,                                 -- Responsibilities, when to contact
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE team_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users can read contacts"
  ON team_contacts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated users can insert contacts"
  ON team_contacts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "authenticated users can update contacts"
  ON team_contacts FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated users can delete contacts"
  ON team_contacts FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE TRIGGER team_contacts_updated_at
  BEFORE UPDATE ON team_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_team_contacts_slug       ON team_contacts (slug);
CREATE INDEX idx_team_contacts_department ON team_contacts (department);
CREATE INDEX idx_team_contacts_tier       ON team_contacts (support_tier) WHERE support_tier IS NOT NULL;
```

### Seed Data: `team_contacts` (7 rows)

```sql
INSERT INTO team_contacts (slug, name, role, department, phone, email, contact_via, support_tier, notes) VALUES

  ('andy',
   'Andy Korzeniacki',
   'Project Manager — specs, kickoff, camera positions, site survey',
   'pm',
   '917-937-6896',
   'andyk@podplay.app',
   NULL, NULL,
   'First contact for all new venue deployments. Schedule kickoff call at Phase 0. Provides site survey, hardware specs, camera positioning, tier determination. Author of hardware installation guide.'),

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
   'Holds credentials for UniFi PingPodIT, FreeDNS, 1Password. Gateway to Nico. BOM mismatch resolution (Step 125). Account and billing decisions.'),

  ('stan',
   'Stan Wu',
   'Config Specialist — hardware expert, camera configuration',
   'config',
   NULL, NULL, NULL,
   2,
   'Author of PodPlay Configuration Guide v1.0. Expert in camera encoding settings, VLAN setup, Mac Mini deployment. BOM mismatch resolution (Step 125). Tier 2 support.'),

  ('agustin',
   'Agustin',
   'App Readiness — LOCATION_ID creation, app release confirmation',
   'app',
   NULL, NULL, NULL, NULL,
   'Contact at Phase 1 Step 16 before hardware ships. Creates LOCATION_ID per facility for Mosyle P-List config (<key>id</key><string>CUSTOMERNAME</string>). Manages white-labeled app binaries for international VPP distribution.'),

  ('cs-team',
   'CS Team',
   'Customer Success — booking and replay credits',
   'cs',
   NULL, NULL, NULL, NULL,
   'Group contact. Booking questions and free replay credit additions. Contact when creating test reservations during deployment Step 117.'),

  ('patrick',
   'Patrick',
   'Engineer/Developer — replay service, video encoding, port 4000 architecture',
   'engineering',
   NULL, NULL, NULL,
   3,
   'Tier 3 only. Owns replay service (V1 UDP, V2 TCP). Contact for: pixelated video (V1 known issue — upgrade to V2), stream corruption, port 4000 architecture, firmware-level camera bugs. Weekly developer call for outstanding issues.');
```

### Migration Order Update

```
-- Additions (append after item 29):
30. team_contacts              (no FK dependencies)
31. INSERT seed data for team_contacts    (7 rows)
```
| Internal LAN bandwidth limit (1 Gbps / ~20 cameras) | No enforcement in app | Informational note in Phase 4 networking step |
