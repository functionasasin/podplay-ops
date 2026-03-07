-- Migration 00002: Core Tables (projects, installers, settings)

-- ============================================================
-- Auto-update updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Table: installers
-- Must be created before projects (FK dependency)
-- ============================================================
CREATE TABLE installers (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  name              TEXT        NOT NULL,
  company           TEXT,

  email             TEXT,
  phone             TEXT,

  installer_type    installer_type NOT NULL DEFAULT 'podplay_vetted',

  regions           TEXT[],

  hourly_rate       NUMERIC(10, 2),

  is_active         BOOLEAN     NOT NULL DEFAULT true,

  notes             TEXT
);

CREATE TRIGGER installers_updated_at
  BEFORE UPDATE ON installers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_installers_is_active      ON installers (is_active);
CREATE INDEX idx_installers_installer_type ON installers (installer_type);
CREATE INDEX idx_installers_regions        ON installers USING GIN (regions);

ALTER TABLE installers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access installers"
  ON installers FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Table: projects
-- ============================================================
CREATE TABLE projects (
  -- Primary key
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Customer & Venue Info
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

  -- Project Parameters
  tier                        service_tier NOT NULL,
  court_count                 INTEGER     NOT NULL DEFAULT 1
                              CHECK (court_count >= 1 AND court_count <= 50),
  door_count                  INTEGER     NOT NULL DEFAULT 0
                              CHECK (door_count >= 0),
  security_camera_count       INTEGER     NOT NULL DEFAULT 0
                              CHECK (security_camera_count >= 0),
  replay_sign_count           INTEGER     GENERATED ALWAYS AS (court_count * 2) STORED,
  has_nvr                     BOOLEAN     NOT NULL DEFAULT false,
  has_pingpod_wifi            BOOLEAN     NOT NULL DEFAULT false,
  has_front_desk              BOOLEAN     NOT NULL DEFAULT false,

  -- ISP & Networking
  isp_provider                TEXT,
  isp_type                    isp_type,
  has_static_ip               BOOLEAN     DEFAULT false,
  has_backup_isp              BOOLEAN     DEFAULT false,
  internet_download_mbps      INTEGER,
  internet_upload_mbps        INTEGER,
  starlink_warning_acknowledged BOOLEAN   DEFAULT false,
  rack_size_u                 INTEGER,

  -- Deployment Infrastructure
  ddns_subdomain              TEXT,
  unifi_site_name             TEXT,
  mac_mini_username           TEXT,
  mac_mini_password           TEXT,
  location_id                 TEXT,
  replay_api_url              TEXT,
  replay_local_url            TEXT        DEFAULT 'http://192.168.32.100:4000',
  replay_service_version      replay_service_version NOT NULL DEFAULT 'v1',

  -- Lifecycle Status
  project_status              project_status NOT NULL DEFAULT 'intake',
  deployment_status           deployment_status NOT NULL DEFAULT 'not_started',
  revenue_stage               revenue_stage NOT NULL DEFAULT 'proposal',

  -- Dates
  kickoff_call_date           DATE,
  signed_date                 DATE,
  installation_start_date     DATE,
  installation_end_date       DATE,
  go_live_date                DATE,

  -- Installation
  installer_id                UUID        REFERENCES installers(id) ON DELETE SET NULL,
  installer_type              installer_type,
  installer_hours             NUMERIC(10, 2) NOT NULL DEFAULT 0,

  -- Notes
  notes                       TEXT,
  internal_notes              TEXT
);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_projects_project_status    ON projects (project_status);
CREATE INDEX idx_projects_revenue_stage     ON projects (revenue_stage);
CREATE INDEX idx_projects_deployment_status ON projects (deployment_status);
CREATE INDEX idx_projects_tier              ON projects (tier);
CREATE INDEX idx_projects_created_at        ON projects (created_at DESC);
CREATE INDEX idx_projects_customer_name     ON projects (customer_name);

CREATE UNIQUE INDEX idx_projects_ddns_subdomain ON projects (ddns_subdomain)
  WHERE ddns_subdomain IS NOT NULL;

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

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

-- ============================================================
-- Table: settings
-- Single-row global configuration (id = 'default')
-- ============================================================
CREATE TABLE settings (
  id                          TEXT        PRIMARY KEY DEFAULT 'default',
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Pricing: Service Tier Fees
  pro_venue_fee               NUMERIC(10, 2) NOT NULL DEFAULT 5000.00,
  pro_court_fee               NUMERIC(10, 2) NOT NULL DEFAULT 2500.00,
  autonomous_venue_fee        NUMERIC(10, 2) NOT NULL DEFAULT 7500.00,
  autonomous_court_fee        NUMERIC(10, 2) NOT NULL DEFAULT 2500.00,
  pbk_venue_fee               NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  pbk_court_fee               NUMERIC(10, 2) NOT NULL DEFAULT 0.00,

  -- Cost Chain Multipliers
  sales_tax_rate              NUMERIC(6, 4) NOT NULL DEFAULT 0.1025,
  shipping_rate               NUMERIC(6, 4) NOT NULL DEFAULT 0.10,
  target_margin               NUMERIC(6, 4) NOT NULL DEFAULT 0.10,

  -- Labor
  labor_rate_per_hour         NUMERIC(10, 2) NOT NULL DEFAULT 120.00,
  hours_per_day               INTEGER     NOT NULL DEFAULT 10,

  -- Travel Defaults
  lodging_per_day             NUMERIC(10, 2) NOT NULL DEFAULT 250.00,
  airfare_default             NUMERIC(10, 2) NOT NULL DEFAULT 1800.00,

  -- Financial Reporting (HER calculation)
  niko_annual_salary          NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  niko_direct_allocation      NUMERIC(6, 4) NOT NULL DEFAULT 0.50,
  chad_annual_salary          NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  chad_indirect_allocation    NUMERIC(6, 4) NOT NULL DEFAULT 0.20,
  annual_rent                 NUMERIC(10, 2) NOT NULL DEFAULT 27600.00,
  annual_indirect_salaries    NUMERIC(10, 2) NOT NULL DEFAULT 147000.00,

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

-- Seed the single default settings row
INSERT INTO settings (id) VALUES ('default');
