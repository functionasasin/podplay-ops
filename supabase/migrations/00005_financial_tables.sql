-- Migration 00005: Financial Tables (invoices, expenses, cc_terminals, replay_signs)

-- Additional enum types needed for financial tables
-- (invoice_type not in 00001_enums.sql; cc/sign status values per stage spec)

CREATE TYPE invoice_type AS ENUM (
  'deposit',
  'final',
  'change_order'
);

CREATE TYPE cc_terminal_stage_status AS ENUM (
  'ordered',
  'received',
  'configured',
  'deployed',
  'returned'
);

CREATE TYPE replay_sign_stage_status AS ENUM (
  'ordered',
  'produced',
  'shipped',
  'installed'
);

-- ============================================================
-- Table: invoices
-- ============================================================
CREATE TABLE invoices (
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),

  project_id      UUID            NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invoice_number  TEXT            NOT NULL,
  type            invoice_type    NOT NULL,
  amount          NUMERIC(12, 2)  NOT NULL,
  tax_amount      NUMERIC(12, 2)  NOT NULL DEFAULT 0,
  total_amount    NUMERIC(12, 2)  NOT NULL,
  status          invoice_status  NOT NULL DEFAULT 'not_sent',
  payment_method  payment_method,
  issued_date     DATE            NOT NULL,
  due_date        DATE            NOT NULL,
  paid_date       DATE,
  notes           TEXT
);

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_invoices_project_id ON invoices (project_id);
CREATE INDEX idx_invoices_status     ON invoices (status);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Table: expenses
-- ============================================================
CREATE TABLE expenses (
  id              UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ       NOT NULL DEFAULT now(),

  project_id      UUID              REFERENCES projects(id) ON DELETE CASCADE,
  category        expense_category  NOT NULL,
  description     TEXT              NOT NULL,
  amount          NUMERIC(12, 2)    NOT NULL,
  payment_method  payment_method    NOT NULL,
  vendor          TEXT              NOT NULL,
  receipt_url     TEXT,
  expense_date    DATE              NOT NULL,
  notes           TEXT
);

CREATE INDEX idx_expenses_project_id ON expenses (project_id);
CREATE INDEX idx_expenses_category   ON expenses (category);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access expenses"
  ON expenses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Table: cc_terminals
-- ============================================================
CREATE TABLE cc_terminals (
  id              UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ               NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ               NOT NULL DEFAULT now(),

  project_id      UUID                      NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  serial_number   TEXT                      NOT NULL,
  model           TEXT                      NOT NULL,
  status          cc_terminal_stage_status  NOT NULL DEFAULT 'ordered',
  deployed_date   DATE,
  notes           TEXT
);

CREATE TRIGGER cc_terminals_updated_at
  BEFORE UPDATE ON cc_terminals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE cc_terminals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access cc_terminals"
  ON cc_terminals FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- Table: replay_signs
-- ============================================================
CREATE TABLE replay_signs (
  id            UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ               NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ               NOT NULL DEFAULT now(),

  project_id    UUID                      NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  quantity      INTEGER                   NOT NULL,
  status        replay_sign_stage_status  NOT NULL DEFAULT 'ordered',
  order_date    DATE                      NOT NULL,
  ship_date     DATE,
  install_date  DATE,
  notes         TEXT
);

CREATE TRIGGER replay_signs_updated_at
  BEFORE UPDATE ON replay_signs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE replay_signs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access replay_signs"
  ON replay_signs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
