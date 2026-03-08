-- Migration 00004: Inventory Tables (inventory, inventory_movements)

-- ============================================================
-- Table: inventory
-- ============================================================
CREATE TABLE inventory (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  item_id             UUID        NOT NULL UNIQUE REFERENCES hardware_catalog(id) ON DELETE RESTRICT,
  quantity_on_hand    INTEGER     NOT NULL DEFAULT 0,
  quantity_allocated  INTEGER     NOT NULL DEFAULT 0,
  reorder_point       INTEGER     NOT NULL DEFAULT 0
);

CREATE TRIGGER inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_inventory_item_id ON inventory (item_id);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access inventory"
  ON inventory FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Table: inventory_movements
-- ============================================================
CREATE TABLE inventory_movements (
  id              UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ             NOT NULL DEFAULT now(),

  item_id         UUID                    NOT NULL REFERENCES hardware_catalog(id) ON DELETE RESTRICT,
  movement_type   inventory_movement_type NOT NULL,
  quantity        INTEGER                 NOT NULL,
  reference_type  TEXT,
  reference_id    UUID,
  notes           TEXT
);

CREATE INDEX idx_inventory_movements_item_id    ON inventory_movements (item_id);
CREATE INDEX idx_inventory_movements_created_at ON inventory_movements (created_at);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access inventory_movements"
  ON inventory_movements FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
