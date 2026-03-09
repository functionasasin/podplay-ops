CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  lead_time_days INTEGER,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO vendors (name, notes, is_active) VALUES
  ('Ubiquiti', 'Network equipment — UDM, switches, APs, cameras', true),
  ('Apple', 'Mac Mini, Apple TV, iPad', true),
  ('Samsung', 'Displays and TVs', true),
  ('Kisi', 'Access control — controllers and readers', true),
  ('Replay', 'Replay system hardware kits and signs', true),
  ('APC', 'UPS and power protection', true),
  ('Generic', 'Cables, patch panels, mounts, misc hardware', true);
