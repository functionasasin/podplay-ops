CREATE TYPE fee_frequency AS ENUM ('monthly', 'quarterly', 'annually');

CREATE TABLE recurring_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  frequency fee_frequency NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  vendor TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_recurring_fees_project ON recurring_fees(project_id);
