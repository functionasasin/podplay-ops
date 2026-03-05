CREATE TABLE IF NOT EXISTS case_pdfs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     UUID        NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id),
  org_id      UUID        NOT NULL REFERENCES organizations(id),
  pdf_type    TEXT        NOT NULL CHECK (pdf_type IN ('distribution_summary', 'tax_computation', 'demand_letter')),
  storage_key TEXT        NOT NULL,
  file_size   INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE case_pdfs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "case_pdfs_org" ON case_pdfs
  FOR ALL USING (org_id IN (SELECT user_org_ids()));
