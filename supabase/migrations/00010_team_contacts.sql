-- team_contacts
-- Internal PodPlay team directory — seeded once, editable in Settings > Team
CREATE TABLE team_contacts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT        NOT NULL UNIQUE,
  name          TEXT        NOT NULL,
  role          TEXT        NOT NULL,
  department    TEXT        NOT NULL,
  phone         TEXT,
  email         TEXT,
  contact_via   TEXT,
  support_tier  SMALLINT    CHECK (support_tier IN (1, 2, 3)),
  notes         TEXT,
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
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_team_contacts_slug       ON team_contacts (slug);
CREATE INDEX idx_team_contacts_department ON team_contacts (department);
CREATE INDEX idx_team_contacts_tier       ON team_contacts (support_tier) WHERE support_tier IS NOT NULL;

INSERT INTO team_contacts (slug, name, role, department, phone, email, contact_via, support_tier, notes) VALUES
  ('andy', 'Andy Korzeniacki', 'Project Manager — specs, kickoff, camera positions, site survey', 'pm', '917-937-6896', 'andyk@podplay.app', NULL, NULL, 'Primary PM contact'),
  ('nico', 'Nico', 'Hardware & Installation Lead', 'hardware', NULL, NULL, NULL, 2, 'Hardware install lead'),
  ('chad', 'Chad', 'Head of Operations', 'operations', NULL, NULL, NULL, NULL, 'Head of Ops'),
  ('stan', 'Stan Wu', 'Config Specialist', 'config', NULL, NULL, NULL, 2, 'Network config specialist'),
  ('agustin', 'Agustin', 'App Readiness', 'app', NULL, NULL, NULL, NULL, 'App readiness'),
  ('cs-team', 'CS Team', 'Customer Success', 'cs', NULL, NULL, NULL, NULL, 'Customer success team'),
  ('patrick', 'Patrick', 'Engineer/Dev', 'engineering', NULL, NULL, NULL, 3, 'Engineering escalation');
