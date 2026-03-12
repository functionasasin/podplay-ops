-- Add missing settings columns that PricingSettings form expects
-- autonomous_plus tier fees
ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS autonomous_plus_venue_fee  NUMERIC(10,2) NOT NULL DEFAULT 7500.00,
  ADD COLUMN IF NOT EXISTS autonomous_plus_court_fee  NUMERIC(10,2) NOT NULL DEFAULT 2500.00,

  -- deposit percentage (decimal: 0.50 = 50%)
  ADD COLUMN IF NOT EXISTS deposit_pct                NUMERIC(6,4)  NOT NULL DEFAULT 0.50,

  -- BOM sizing thresholds
  ADD COLUMN IF NOT EXISTS switch_24_max_courts       INTEGER       NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS switch_48_max_courts       INTEGER       NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS ssd_1tb_max_courts         INTEGER       NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS ssd_2tb_max_courts         INTEGER       NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS nvr_4bay_max_cameras       INTEGER       NOT NULL DEFAULT 4,

  -- ISP thresholds
  ADD COLUMN IF NOT EXISTS isp_fiber_mbps_per_court   INTEGER       NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS isp_cable_upload_min_mbps  INTEGER       NOT NULL DEFAULT 60,

  -- Operational defaults
  ADD COLUMN IF NOT EXISTS default_replay_service_version TEXT NOT NULL DEFAULT 'v1'
    CHECK (default_replay_service_version IN ('v1','v2')),
  ADD COLUMN IF NOT EXISTS po_number_prefix           TEXT          NOT NULL DEFAULT 'PO',
  ADD COLUMN IF NOT EXISTS mac_mini_local_ip          TEXT          NOT NULL DEFAULT '192.168.32.100',
  ADD COLUMN IF NOT EXISTS replay_port               INTEGER       NOT NULL DEFAULT 4000,
  ADD COLUMN IF NOT EXISTS ddns_domain               TEXT          NOT NULL DEFAULT 'podplaydns.com',
  ADD COLUMN IF NOT EXISTS label_sets_per_court       INTEGER       NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS default_vlan_id            INTEGER       NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS replay_vlan_id             INTEGER       NOT NULL DEFAULT 32,
  ADD COLUMN IF NOT EXISTS surveillance_vlan_id       INTEGER       NOT NULL DEFAULT 31,
  ADD COLUMN IF NOT EXISTS access_control_vlan_id     INTEGER       NOT NULL DEFAULT 33;
