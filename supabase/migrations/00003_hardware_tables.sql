-- Migration 00003: Hardware Tables (hardware_catalog, bom_templates, project_bom_items)

-- ============================================================
-- Table: hardware_catalog
-- ============================================================
CREATE TABLE hardware_catalog (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  sku         TEXT        NOT NULL UNIQUE,
  name        TEXT        NOT NULL,
  vendor      TEXT,
  category    TEXT,
  unit_cost   NUMERIC(10, 2),
  description TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true
);

CREATE TRIGGER hardware_catalog_updated_at
  BEFORE UPDATE ON hardware_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_hardware_catalog_sku      ON hardware_catalog (sku);
CREATE INDEX idx_hardware_catalog_category ON hardware_catalog (category);

ALTER TABLE hardware_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access hardware_catalog"
  ON hardware_catalog FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Table: bom_templates
-- ============================================================
CREATE TABLE bom_templates (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  tier             service_tier NOT NULL,
  item_id          UUID        NOT NULL REFERENCES hardware_catalog(id) ON DELETE RESTRICT,
  default_quantity INTEGER     NOT NULL DEFAULT 1,
  quantity_rule    JSONB,
  is_required      BOOLEAN     NOT NULL DEFAULT true
);

ALTER TABLE bom_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access bom_templates"
  ON bom_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Table: project_bom_items
-- ============================================================
CREATE TABLE project_bom_items (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

  project_id         UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  catalog_item_id    UUID        NOT NULL REFERENCES hardware_catalog(id) ON DELETE RESTRICT,
  quantity           INTEGER     NOT NULL DEFAULT 1,
  unit_cost_override NUMERIC(10, 2),
  notes              TEXT
);

CREATE TRIGGER project_bom_items_updated_at
  BEFORE UPDATE ON project_bom_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_project_bom_items_project_id ON project_bom_items (project_id);

ALTER TABLE project_bom_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access project_bom_items"
  ON project_bom_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
