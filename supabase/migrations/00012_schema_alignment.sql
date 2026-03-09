-- Migration 00012: Schema alignment — rename inventory_movements columns to match
-- application code expectations, and add missing tables.

-- ============================================================
-- inventory_movements: rename columns to match code
-- ============================================================

-- item_id → hardware_catalog_id (more descriptive FK name)
ALTER TABLE inventory_movements RENAME COLUMN item_id TO hardware_catalog_id;

-- quantity → qty_delta (code uses qty_delta throughout)
ALTER TABLE inventory_movements RENAME COLUMN quantity TO qty_delta;

-- Add project_id FK (code inserts project_id for project-related movements)
ALTER TABLE inventory_movements
  ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Add reference TEXT (code stores PO numbers, tracking numbers, etc.)
ALTER TABLE inventory_movements
  ADD COLUMN reference TEXT;

-- Update index name to reflect renamed column
DROP INDEX IF EXISTS idx_inventory_movements_item_id;
CREATE INDEX idx_inventory_movements_hardware_catalog_id
  ON inventory_movements (hardware_catalog_id);

-- ============================================================
-- Table: purchase_orders
-- ============================================================
CREATE TABLE purchase_orders (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  po_number        TEXT        NOT NULL UNIQUE,
  vendor           TEXT        NOT NULL,
  project_id       UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  order_date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  expected_date    DATE,
  total_cost       NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status           TEXT        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'ordered', 'partial', 'received', 'cancelled')),
  received_date    DATE,
  tracking_number  TEXT,
  notes            TEXT
);

CREATE TRIGGER purchase_orders_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_purchase_orders_project_id ON purchase_orders (project_id);
CREATE INDEX idx_purchase_orders_status     ON purchase_orders (status);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access purchase_orders"
  ON purchase_orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Table: purchase_order_items
-- ============================================================
CREATE TABLE purchase_order_items (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  purchase_order_id    UUID        NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  hardware_catalog_id  UUID        NOT NULL REFERENCES hardware_catalog(id) ON DELETE RESTRICT,
  qty_ordered          INTEGER     NOT NULL DEFAULT 1 CHECK (qty_ordered >= 1),
  qty_received         INTEGER     NOT NULL DEFAULT 0 CHECK (qty_received >= 0),
  unit_cost            NUMERIC(10, 2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_po_items_purchase_order_id   ON purchase_order_items (purchase_order_id);
CREATE INDEX idx_po_items_hardware_catalog_id ON purchase_order_items (hardware_catalog_id);

ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access purchase_order_items"
  ON purchase_order_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Table: monthly_opex_snapshots
-- ============================================================
CREATE TABLE monthly_opex_snapshots (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  period_year         INTEGER     NOT NULL,
  period_month        INTEGER     NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  hardware_revenue    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  team_hardware_spend NUMERIC(12, 2),
  her_ratio           NUMERIC(8, 4),

  UNIQUE (period_year, period_month)
);

CREATE TRIGGER monthly_opex_snapshots_updated_at
  BEFORE UPDATE ON monthly_opex_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_monthly_opex_year_month
  ON monthly_opex_snapshots (period_year DESC, period_month DESC);

ALTER TABLE monthly_opex_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access monthly_opex_snapshots"
  ON monthly_opex_snapshots FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
