-- ENUMS (idempotent)
DO $$ BEGIN CREATE TYPE org_plan AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE org_role AS ENUM ('admin', 'accountant', 'staff', 'readonly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE computation_status AS ENUM ('draft', 'computed', 'finalized', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE client_status AS ENUM ('active', 'inactive', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  plan        org_plan NOT NULL DEFAULT 'free',
  seat_limit  INT NOT NULL DEFAULT 3,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ORGANIZATION MEMBERS
CREATE TABLE IF NOT EXISTS organization_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        org_role NOT NULL DEFAULT 'staff',
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- ORGANIZATION INVITATIONS
CREATE TABLE IF NOT EXISTS organization_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        org_role NOT NULL DEFAULT 'staff',
  status      invitation_status NOT NULL DEFAULT 'pending',
  token       UUID NOT NULL DEFAULT gen_random_uuid(),  -- UUID, not TEXT
  invited_by  UUID NOT NULL REFERENCES auth.users(id),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- USER PROFILES
CREATE TABLE IF NOT EXISTS user_profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT,
  firm_name       TEXT,
  bir_rdo_code    TEXT,
  tin             TEXT,
  ptr_number      TEXT,
  roll_number     TEXT,
  firm_address    TEXT,
  logo_url        TEXT,
  pdf_accent_color TEXT DEFAULT '#1D4ED8',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CLIENTS
CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT,
  phone       TEXT,
  tin         TEXT,
  notes       TEXT,
  status      client_status NOT NULL DEFAULT 'active',
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COMPUTATIONS
CREATE TABLE IF NOT EXISTS computations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_by      UUID NOT NULL REFERENCES auth.users(id),
  title           TEXT NOT NULL,
  tax_year        INT NOT NULL,
  status          computation_status NOT NULL DEFAULT 'draft',
  input_json      JSONB,
  output_json     JSONB,
  regime_selected TEXT,                    -- 'PATH_A', 'PATH_B', 'PATH_C'
  share_token     UUID NOT NULL DEFAULT gen_random_uuid(),  -- UUID NOT TEXT
  share_enabled   BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COMPUTATION NOTES
CREATE TABLE IF NOT EXISTS computation_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  computation_id  UUID NOT NULL REFERENCES computations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- COMPUTATION DEADLINES
CREATE TABLE IF NOT EXISTS computation_deadlines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  computation_id  UUID NOT NULL REFERENCES computations(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  due_date        DATE NOT NULL,
  completed_date  DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_computations_org_id ON computations(org_id);
CREATE INDEX IF NOT EXISTS idx_computations_share_token ON computations(share_token);
CREATE INDEX IF NOT EXISTS idx_computations_status ON computations(status);
CREATE INDEX IF NOT EXISTS idx_computations_tax_year ON computations(tax_year);
CREATE INDEX IF NOT EXISTS idx_clients_org_id ON clients(org_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_due_date ON computation_deadlines(due_date);

-- TRIGGERS: updated_at auto-update
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_computations_updated_at
  BEFORE UPDATE ON computations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ENABLE RLS (must be explicit)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE computations ENABLE ROW LEVEL SECURITY;
ALTER TABLE computation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE computation_deadlines ENABLE ROW LEVEL SECURITY;
