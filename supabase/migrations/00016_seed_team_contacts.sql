DELETE FROM team_contacts;

INSERT INTO team_contacts (slug, name, role, department, email, phone, is_active) VALUES
  ('niko', 'Niko', 'Operations Lead', 'Operations', 'niko@podplay.co', NULL, true),
  ('chad', 'Chad', 'Technical Lead', 'Engineering', 'chad@podplay.co', NULL, true),
  ('andy', 'Andy', 'Project Manager', 'Operations', 'andy@podplay.co', NULL, true),
  ('ernesto', 'Ernesto', 'Field Installer', 'Operations', 'ernesto@podplay.co', NULL, true),
  ('carlos', 'Carlos', 'Field Installer', 'Operations', 'carlos@podplay.co', NULL, true),
  ('marco', 'Marco', 'Field Installer', 'Operations', 'marco@podplay.co', NULL, true);
