-- Add isp_config_method field to projects for ISP Router Configuration phase
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS isp_config_method TEXT
  CHECK (isp_config_method IN ('static_ip', 'dmz', 'port_forward'));
