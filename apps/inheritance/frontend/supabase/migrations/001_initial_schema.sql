-- 001_initial_schema.sql
-- Initial schema for Philippine Inheritance Premium Platform
-- Source: docs/plans/inheritance-premium-spec.md §3

-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Enumerated Types
-- ============================================================
CREATE TYPE case_status AS ENUM ('draft', 'computed', 'finalized', 'archived');
CREATE TYPE client_status AS ENUM ('active', 'former');
CREATE TYPE org_role AS ENUM ('admin', 'attorney', 'paralegal', 'readonly');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
CREATE TYPE conflict_outcome AS ENUM (
  'clear', 'flagged', 'cleared_after_review', 'skipped'
);
CREATE TYPE gov_id_type AS ENUM (
  'philsys_id', 'passport', 'drivers_license', 'sss', 'gsis', 'prc',
  'voters_id', 'postal_id', 'senior_citizen_id', 'umid', 'nbi_clearance'
);

-- ============================================================
-- Shared Utility Functions
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

-- ============================================================
-- Organizations
-- ============================================================
CREATE TABLE organizations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  slug        TEXT        NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9\-]{3,60}$'),
  plan        TEXT        NOT NULL DEFAULT 'solo'
                          CHECK (plan IN ('solo', 'team', 'firm')),
  seat_limit  INT         NOT NULL DEFAULT 1 CHECK (seat_limit >= 1),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Organization Members
-- ============================================================
CREATE TABLE organization_members (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       org_role    NOT NULL DEFAULT 'attorney',
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, user_id)
);

CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_org_id  ON organization_members(org_id);

-- ============================================================
-- Organization Invitations
-- ============================================================
CREATE TABLE organization_invitations (
  id          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID              NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email       TEXT              NOT NULL,
  role        org_role          NOT NULL DEFAULT 'attorney',
  token       UUID              NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status      invitation_status NOT NULL DEFAULT 'pending',
  invited_by  UUID              NOT NULL REFERENCES auth.users(id),
  expires_at  TIMESTAMPTZ       NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_token  ON organization_invitations(token);
CREATE INDEX idx_invitations_email  ON organization_invitations(email);
CREATE INDEX idx_invitations_org_id ON organization_invitations(org_id, status);

-- ============================================================
-- User Profiles (includes Firm Branding)
-- ============================================================
CREATE TABLE user_profiles (
  id                   UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                TEXT        NOT NULL,
  full_name            TEXT,
  firm_name            TEXT        CHECK (char_length(firm_name) <= 200),
  firm_address         TEXT        CHECK (char_length(firm_address) <= 500),
  firm_phone           TEXT,
  firm_email           TEXT,
  counsel_name         TEXT,
  counsel_email        TEXT,
  counsel_phone        TEXT,
  ibp_roll_no          TEXT,
  ptr_no               TEXT,
  mcle_compliance_no   TEXT,
  logo_url             TEXT,
  letterhead_color     TEXT        NOT NULL DEFAULT '#1E3A5F',
  secondary_color      TEXT        NOT NULL DEFAULT '#C9A84C',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_profiles_own" ON user_profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Clients
-- ============================================================
CREATE TABLE clients (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name         TEXT         NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 200),
  nickname          TEXT,
  date_of_birth     DATE,
  place_of_birth    TEXT,
  email             TEXT,
  phone             TEXT,
  address           TEXT,
  tin               TEXT         CHECK (tin IS NULL OR tin ~ '^\d{3}-\d{3}-\d{3}(-\d{3})?$'),
  gov_id_type       gov_id_type,
  gov_id_number     TEXT,
  civil_status      TEXT         CHECK (civil_status IN (
                                   'single', 'married', 'widowed',
                                   'legally_separated', 'annulled')),
  status            client_status NOT NULL DEFAULT 'active',
  intake_date       DATE          NOT NULL DEFAULT CURRENT_DATE,
  referral_source   TEXT,
  conflict_cleared  BOOLEAN,
  conflict_notes    TEXT,
  created_by        UUID         REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_clients_org_id    ON clients(org_id);
CREATE INDEX idx_clients_status    ON clients(org_id, status);
CREATE INDEX idx_clients_name_trgm ON clients USING gin(full_name gin_trgm_ops);
CREATE INDEX idx_clients_tin       ON clients(tin) WHERE tin IS NOT NULL;

CREATE POLICY "clients_org_member" ON clients
  FOR ALL USING (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  ) WITH CHECK (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Cases
-- ============================================================
CREATE TABLE cases (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                 UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id                UUID        NOT NULL REFERENCES auth.users(id),
  client_id              UUID        REFERENCES clients(id) ON DELETE SET NULL,
  title                  TEXT        NOT NULL DEFAULT 'Untitled Case'
                                     CHECK (char_length(title) <= 300),
  status                 case_status NOT NULL DEFAULT 'draft',
  input_json             JSONB,
  output_json            JSONB,
  tax_input_json         JSONB,
  tax_output_json        JSONB,
  comparison_input_json  JSONB,
  comparison_output_json JSONB,
  comparison_ran_at      TIMESTAMPTZ,
  decedent_name          TEXT,
  date_of_death          DATE,
  gross_estate           NUMERIC(16,2),
  share_token            UUID        UNIQUE DEFAULT gen_random_uuid(),
  share_enabled          BOOLEAN     NOT NULL DEFAULT FALSE,
  notes_count            INT         NOT NULL DEFAULT 0,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_cases_org_id      ON cases(org_id);
CREATE INDEX idx_cases_user_id     ON cases(user_id);
CREATE INDEX idx_cases_client_id   ON cases(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_cases_status      ON cases(org_id, status);
CREATE INDEX idx_cases_updated_at  ON cases(org_id, updated_at DESC);
CREATE INDEX idx_cases_share_token ON cases(share_token) WHERE share_enabled = TRUE;
CREATE INDEX idx_cases_dod         ON cases(date_of_death) WHERE date_of_death IS NOT NULL;

CREATE POLICY "cases_org_member" ON cases
  FOR ALL USING (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  ) WITH CHECK (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE TRIGGER cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Case Notes (append-only)
-- ============================================================
CREATE TABLE case_notes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id    UUID        NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES auth.users(id),
  content    TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 10000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_case_notes_case_id ON case_notes(case_id, created_at DESC);

CREATE POLICY "case_notes_select" ON case_notes
  FOR SELECT USING (
    case_id IN (SELECT id FROM cases WHERE org_id IN (
      SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    ))
  );
CREATE POLICY "case_notes_insert" ON case_notes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    case_id IN (SELECT id FROM cases WHERE org_id IN (
      SELECT org_id FROM organization_members WHERE user_id = auth.uid()
    ))
  );
CREATE POLICY "case_notes_delete" ON case_notes
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION fn_sync_notes_count() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE cases SET notes_count = notes_count + 1 WHERE id = NEW.case_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE cases SET notes_count = GREATEST(0, notes_count - 1) WHERE id = OLD.case_id;
  END IF;
  RETURN NULL;
END; $$;

CREATE TRIGGER trg_sync_notes_count
  AFTER INSERT OR DELETE ON case_notes
  FOR EACH ROW EXECUTE FUNCTION fn_sync_notes_count();

-- ============================================================
-- Case Deadlines
-- ============================================================
CREATE TABLE case_deadlines (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id          UUID        NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id),
  milestone_key    TEXT        NOT NULL,
  label            TEXT        NOT NULL,
  description      TEXT        NOT NULL,
  due_date         DATE        NOT NULL,
  completed_date   DATE,
  legal_basis      TEXT        NOT NULL,
  is_auto          BOOLEAN     NOT NULL DEFAULT TRUE,
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (case_id, milestone_key)
);

ALTER TABLE case_deadlines ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_deadlines_case_id  ON case_deadlines(case_id);
CREATE INDEX idx_deadlines_user_id  ON case_deadlines(user_id);
CREATE INDEX idx_deadlines_due_date ON case_deadlines(due_date) WHERE completed_date IS NULL;

CREATE POLICY "deadlines_all_own" ON case_deadlines
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER case_deadlines_updated_at
  BEFORE UPDATE ON case_deadlines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Case Documents (checklist)
-- ============================================================
CREATE TABLE case_documents (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id          UUID        NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  user_id          UUID        NOT NULL REFERENCES auth.users(id),
  document_key     TEXT        NOT NULL,
  label            TEXT        NOT NULL,
  category         TEXT        NOT NULL,
  description      TEXT        NOT NULL,
  required_when    TEXT        NOT NULL,
  is_obtained      BOOLEAN     NOT NULL DEFAULT FALSE,
  is_not_applicable BOOLEAN    NOT NULL DEFAULT FALSE,
  obtained_date    DATE,
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (case_id, document_key)
);

ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_case_documents_case_id ON case_documents(case_id);

CREATE POLICY "case_documents_own" ON case_documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER case_documents_updated_at
  BEFORE UPDATE ON case_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Conflict Check Log
-- ============================================================
CREATE TABLE conflict_check_log (
  id              UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID              NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id       UUID              REFERENCES clients(id) ON DELETE SET NULL,
  checked_name    TEXT              NOT NULL,
  checked_tin     TEXT,
  result_json     JSONB             NOT NULL DEFAULT '{}',
  match_count     INT               NOT NULL DEFAULT 0,
  outcome         conflict_outcome  NOT NULL DEFAULT 'clear',
  outcome_notes   TEXT,
  checked_at      TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

ALTER TABLE conflict_check_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_conflict_log_user    ON conflict_check_log(user_id);
CREATE INDEX idx_conflict_log_client  ON conflict_check_log(client_id);
CREATE INDEX idx_conflict_log_outcome ON conflict_check_log(user_id, outcome);

CREATE POLICY "conflict_log_own" ON conflict_check_log
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
