-- Migration 00008: deployment_checklist_items table
-- Per-project checklist items, instantiated from deployment_checklist_templates on project creation.
-- Tokens in description are replaced with project-specific values at seed time.

CREATE TABLE IF NOT EXISTS deployment_checklist_items (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  project_id   UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  template_id  UUID        NOT NULL REFERENCES deployment_checklist_templates(id),

  phase        INTEGER     NOT NULL,
  step_number  INTEGER     NOT NULL,
  sort_order   INTEGER     NOT NULL,

  title        TEXT        NOT NULL,
  description  TEXT        NOT NULL,
  warnings     TEXT[],

  is_completed BOOLEAN     NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  notes        TEXT,

  UNIQUE (project_id, template_id)
);

CREATE OR REPLACE FUNCTION update_updated_at_checklist_items()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER deployment_checklist_items_updated_at
  BEFORE UPDATE ON deployment_checklist_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_checklist_items();

CREATE INDEX IF NOT EXISTS idx_checklist_items_project ON deployment_checklist_items (project_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_phase   ON deployment_checklist_items (project_id, phase);

ALTER TABLE deployment_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access deployment_checklist_items"
  ON deployment_checklist_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
