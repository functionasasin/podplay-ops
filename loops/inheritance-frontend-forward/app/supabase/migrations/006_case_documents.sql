-- Stage 21: Document Checklist (§4.22)
-- case_documents table for per-case document tracking

CREATE TABLE case_documents (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id           UUID        NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL REFERENCES auth.users(id),
  document_key      TEXT        NOT NULL,
  label             TEXT        NOT NULL,
  category          TEXT        NOT NULL,
  description       TEXT        NOT NULL,
  required_when     TEXT        NOT NULL,
  is_obtained       BOOLEAN     NOT NULL DEFAULT FALSE,
  is_not_applicable BOOLEAN     NOT NULL DEFAULT FALSE,
  obtained_date     DATE,
  note              TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (case_id, document_key)
);

ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_case_documents_case_id ON case_documents(case_id);

CREATE POLICY "case_documents_own" ON case_documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_case_documents_updated_at
  BEFORE UPDATE ON case_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
