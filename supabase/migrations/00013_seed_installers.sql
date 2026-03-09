INSERT INTO installers (name, company, email, phone, installer_type, regions, hourly_rate, is_active) VALUES
  ('PodPlay Install Team', 'PodPlay', 'installs@podplay.co', NULL, 'podplay_vetted', ARRAY['NCR', 'Calabarzon', 'Central Luzon'], 500.00, true),
  ('External Installer (TBD)', NULL, NULL, NULL, 'client_own', ARRAY[]::TEXT[], NULL, true);
