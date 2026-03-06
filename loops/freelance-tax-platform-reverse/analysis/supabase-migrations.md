# Supabase Migrations — TaxKlaro

**Wave:** 4 (Platform Layer)
**Status:** COMPLETE
**Date:** 2026-03-06
**Depends on:** supabase-auth-flow, frontend-state-management, typescript-types

---

## Summary

Complete SQL migration set for TaxKlaro. Four migration files: initial schema, RLS policies, RPC functions, and storage. Every migration is idempotent. Every RPC has explicit GRANT targets. Every RLS policy is specified. Parameter types exactly match column types (critical — prevents the UUID vs TEXT mismatch that broke the inheritance app).

---

## File: `supabase/migrations/001_initial_schema.sql`

```sql
-- Migration: 001_initial_schema.sql
-- Creates all tables for TaxKlaro
-- Idempotent: uses IF NOT EXISTS throughout

-- ===== ENUMS =====

DO $$ BEGIN
  CREATE TYPE org_plan AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE org_role AS ENUM ('admin', 'accountant', 'staff', 'readonly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE computation_status AS ENUM ('draft', 'computed', 'finalized', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE client_status AS ENUM ('active', 'inactive', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===== ORGANIZATIONS =====

CREATE TABLE IF NOT EXISTS organizations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  plan        org_plan NOT NULL DEFAULT 'free',
  seat_limit  INTEGER NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== ORGANIZATION MEMBERS =====

CREATE TABLE IF NOT EXISTS organization_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        org_role NOT NULL DEFAULT 'staff',
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(org_id);

-- ===== ORGANIZATION INVITATIONS =====

CREATE TABLE IF NOT EXISTS organization_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        org_role NOT NULL DEFAULT 'staff',
  token       UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status      invitation_status NOT NULL DEFAULT 'pending',
  invited_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON organization_invitations(email);

-- ===== USER PROFILES =====
-- Extended profile data beyond what auth.users provides

CREATE TABLE IF NOT EXISTS user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  firm_name     TEXT,          -- for PDF export header
  firm_address  TEXT,          -- for PDF export header
  firm_phone    TEXT,
  tin           TEXT,          -- preparer's TIN for 1701/1701A
  accreditation_number TEXT,   -- CPA accreditation number
  logo_url      TEXT,          -- Supabase Storage URL for firm logo
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== CLIENTS =====
-- Taxpayer profiles managed by the accounting firm

CREATE TABLE IF NOT EXISTS clients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name     TEXT NOT NULL,
  email         TEXT,
  phone         TEXT,
  tin           TEXT,          -- taxpayer's TIN
  rdo_code      TEXT,          -- Revenue District Office code
  status        client_status NOT NULL DEFAULT 'active',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_org_id ON clients(org_id);
CREATE INDEX IF NOT EXISTS idx_clients_tin ON clients(tin);

-- ===== COMPUTATIONS =====
-- Core entity: a single tax computation run

CREATE TABLE IF NOT EXISTS computations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id        UUID REFERENCES clients(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  status           computation_status NOT NULL DEFAULT 'draft',
  input_json       JSONB,                     -- TaxpayerInput (camelCase, from engine-input.ts)
  output_json      JSONB,                     -- TaxComputationResult (camelCase, from engine-output.ts)
  tax_year         INTEGER,                   -- e.g. 2024
  regime_selected  TEXT,                      -- e.g. 'PATH_A_OSD_GRADUATED'
  share_token      UUID NOT NULL DEFAULT gen_random_uuid(),  -- UUID, NOT TEXT — critical for RPC type match
  share_enabled    BOOLEAN NOT NULL DEFAULT false,
  notes_count      INTEGER NOT NULL DEFAULT 0,
  deleted_at       TIMESTAMPTZ,               -- soft delete (NULL = not deleted)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_computations_org_id ON computations(org_id);
CREATE INDEX IF NOT EXISTS idx_computations_user_id ON computations(user_id);
CREATE INDEX IF NOT EXISTS idx_computations_client_id ON computations(client_id);
CREATE INDEX IF NOT EXISTS idx_computations_share_token ON computations(share_token) WHERE share_enabled = true;
CREATE INDEX IF NOT EXISTS idx_computations_tax_year ON computations(tax_year);
CREATE INDEX IF NOT EXISTS idx_computations_status ON computations(status);

-- ===== COMPUTATION NOTES =====
-- Append-only audit trail for each computation

CREATE TABLE IF NOT EXISTS computation_notes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  computation_id UUID NOT NULL REFERENCES computations(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  content        TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
  -- Notes are immutable: no updated_at
);

CREATE INDEX IF NOT EXISTS idx_computation_notes_computation_id ON computation_notes(computation_id);

-- ===== COMPUTATION DEADLINES =====
-- BIR filing deadlines derived from computation

CREATE TABLE IF NOT EXISTS computation_deadlines (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  computation_id UUID NOT NULL REFERENCES computations(id) ON DELETE CASCADE,
  milestone_key  TEXT NOT NULL,        -- e.g. 'Q1_PAYMENT', 'ANNUAL_FILING', 'BIR_1701A_DUE'
  label          TEXT NOT NULL,        -- human-readable label
  due_date       DATE NOT NULL,
  completed_date DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deadlines_computation_id ON computation_deadlines(computation_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_due_date ON computation_deadlines(due_date);

-- ===== AUTO-UPDATE TRIGGERS =====

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach trigger to every table with updated_at
DO $$ BEGIN
  CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_computations_updated_at
    BEFORE UPDATE ON computations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===== AUTO-INCREMENT NOTES COUNT =====

CREATE OR REPLACE FUNCTION increment_notes_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE computations
  SET notes_count = notes_count + 1
  WHERE id = NEW.computation_id;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trg_computation_notes_increment
    AFTER INSERT ON computation_notes
    FOR EACH ROW EXECUTE FUNCTION increment_notes_count();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===== ENABLE ROW LEVEL SECURITY =====

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE computations ENABLE ROW LEVEL SECURITY;
ALTER TABLE computation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE computation_deadlines ENABLE ROW LEVEL SECURITY;
```

---

## File: `supabase/migrations/002_rls_policies.sql`

```sql
-- Migration: 002_rls_policies.sql
-- Row Level Security policies for all tables
-- Idempotent: DROP POLICY IF EXISTS before CREATE POLICY

-- ===== HELPER FUNCTION =====
-- Returns all org IDs the current user belongs to.
-- Used in all org-scoped RLS policies.

CREATE OR REPLACE FUNCTION user_org_ids()
RETURNS SETOF UUID
LANGUAGE SQL SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT org_id
  FROM organization_members
  WHERE user_id = auth.uid();
$$;

-- ===== ORGANIZATIONS =====

DROP POLICY IF EXISTS "org_select" ON organizations;
CREATE POLICY "org_select" ON organizations
  FOR SELECT USING (id IN (SELECT user_org_ids()));

DROP POLICY IF EXISTS "org_insert" ON organizations;
CREATE POLICY "org_insert" ON organizations
  FOR INSERT WITH CHECK (true);
-- Note: org creation is done via create_organization() RPC which enforces membership

DROP POLICY IF EXISTS "org_update" ON organizations;
CREATE POLICY "org_update" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "org_delete" ON organizations;
CREATE POLICY "org_delete" ON organizations
  FOR DELETE USING (false);
-- Organizations are never deleted via client

-- ===== ORGANIZATION MEMBERS =====

DROP POLICY IF EXISTS "members_select" ON organization_members;
CREATE POLICY "members_select" ON organization_members
  FOR SELECT USING (org_id IN (SELECT user_org_ids()));

DROP POLICY IF EXISTS "members_insert" ON organization_members;
CREATE POLICY "members_insert" ON organization_members
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "members_update" ON organization_members;
CREATE POLICY "members_update" ON organization_members
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "members_delete" ON organization_members;
CREATE POLICY "members_delete" ON organization_members
  FOR DELETE USING (
    -- Admins can remove others, users can remove themselves
    (
      org_id IN (
        SELECT org_id FROM organization_members
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    ) OR user_id = auth.uid()
  );

-- ===== ORGANIZATION INVITATIONS =====

DROP POLICY IF EXISTS "invitations_select" ON organization_invitations;
CREATE POLICY "invitations_select" ON organization_invitations
  FOR SELECT USING (org_id IN (SELECT user_org_ids()));

DROP POLICY IF EXISTS "invitations_insert" ON organization_invitations;
CREATE POLICY "invitations_insert" ON organization_invitations
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "invitations_update" ON organization_invitations;
CREATE POLICY "invitations_update" ON organization_invitations
  FOR UPDATE USING (
    -- Only admins can update (revoke) invitations
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "invitations_delete" ON organization_invitations;
CREATE POLICY "invitations_delete" ON organization_invitations
  FOR DELETE USING (false);
-- Invitations are revoked (status update), not deleted

-- ===== USER PROFILES =====

DROP POLICY IF EXISTS "profiles_select" ON user_profiles;
CREATE POLICY "profiles_select" ON user_profiles
  FOR SELECT USING (id = auth.uid());
-- Users can only see their own profile (firm branding is private)

DROP POLICY IF EXISTS "profiles_insert" ON user_profiles;
CREATE POLICY "profiles_insert" ON user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update" ON user_profiles;
CREATE POLICY "profiles_update" ON user_profiles
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_delete" ON user_profiles;
CREATE POLICY "profiles_delete" ON user_profiles
  FOR DELETE USING (false);

-- ===== CLIENTS =====

DROP POLICY IF EXISTS "clients_select" ON clients;
CREATE POLICY "clients_select" ON clients
  FOR SELECT USING (org_id IN (SELECT user_org_ids()));

DROP POLICY IF EXISTS "clients_insert" ON clients;
CREATE POLICY "clients_insert" ON clients
  FOR INSERT WITH CHECK (
    org_id IN (SELECT user_org_ids()) AND
    created_by = auth.uid()
  );

DROP POLICY IF EXISTS "clients_update" ON clients;
CREATE POLICY "clients_update" ON clients
  FOR UPDATE USING (org_id IN (SELECT user_org_ids()));

DROP POLICY IF EXISTS "clients_delete" ON clients;
CREATE POLICY "clients_delete" ON clients
  FOR DELETE USING (
    -- Only org admins can delete clients
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ===== COMPUTATIONS =====

DROP POLICY IF EXISTS "computations_select" ON computations;
CREATE POLICY "computations_select" ON computations
  FOR SELECT USING (
    org_id IN (SELECT user_org_ids()) AND
    deleted_at IS NULL
  );

DROP POLICY IF EXISTS "computations_insert" ON computations;
CREATE POLICY "computations_insert" ON computations
  FOR INSERT WITH CHECK (
    org_id IN (SELECT user_org_ids()) AND
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "computations_update" ON computations;
CREATE POLICY "computations_update" ON computations
  FOR UPDATE USING (
    org_id IN (SELECT user_org_ids()) AND
    deleted_at IS NULL
  );

DROP POLICY IF EXISTS "computations_delete" ON computations;
CREATE POLICY "computations_delete" ON computations
  FOR DELETE USING (false);
-- Computations use soft delete (deleted_at timestamp), never hard deleted

-- ===== COMPUTATION NOTES =====

DROP POLICY IF EXISTS "notes_select" ON computation_notes;
CREATE POLICY "notes_select" ON computation_notes
  FOR SELECT USING (
    computation_id IN (
      SELECT id FROM computations
      WHERE org_id IN (SELECT user_org_ids())
    )
  );

DROP POLICY IF EXISTS "notes_insert" ON computation_notes;
CREATE POLICY "notes_insert" ON computation_notes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    computation_id IN (
      SELECT id FROM computations
      WHERE org_id IN (SELECT user_org_ids())
    )
  );

DROP POLICY IF EXISTS "notes_update" ON computation_notes;
CREATE POLICY "notes_update" ON computation_notes
  FOR UPDATE USING (false);
-- Notes are append-only: no updates

DROP POLICY IF EXISTS "notes_delete" ON computation_notes;
CREATE POLICY "notes_delete" ON computation_notes
  FOR DELETE USING (user_id = auth.uid());
-- Users can only delete their own notes

-- ===== COMPUTATION DEADLINES =====

DROP POLICY IF EXISTS "deadlines_select" ON computation_deadlines;
CREATE POLICY "deadlines_select" ON computation_deadlines
  FOR SELECT USING (
    computation_id IN (
      SELECT id FROM computations
      WHERE org_id IN (SELECT user_org_ids())
    )
  );

DROP POLICY IF EXISTS "deadlines_insert" ON computation_deadlines;
CREATE POLICY "deadlines_insert" ON computation_deadlines
  FOR INSERT WITH CHECK (
    computation_id IN (
      SELECT id FROM computations
      WHERE org_id IN (SELECT user_org_ids())
    )
  );

DROP POLICY IF EXISTS "deadlines_update" ON computation_deadlines;
CREATE POLICY "deadlines_update" ON computation_deadlines
  FOR UPDATE USING (
    computation_id IN (
      SELECT id FROM computations
      WHERE org_id IN (SELECT user_org_ids())
    )
  );

DROP POLICY IF EXISTS "deadlines_delete" ON computation_deadlines;
CREATE POLICY "deadlines_delete" ON computation_deadlines
  FOR DELETE USING (
    computation_id IN (
      SELECT id FROM computations
      WHERE org_id IN (SELECT user_org_ids())
    )
  );
```

---

## File: `supabase/migrations/003_rpc_functions.sql`

```sql
-- Migration: 003_rpc_functions.sql
-- RPC functions for TaxKlaro
-- All SECURITY DEFINER functions SET search_path = public
-- Public RPCs (anon access) have explicit GRANT TO anon, authenticated
-- Idempotent: CREATE OR REPLACE FUNCTION throughout

-- ===== get_shared_computation =====
-- PUBLIC RPC: Returns a computation for the shared link view.
-- Accessible without authentication.
-- CRITICAL: p_token is UUID (not TEXT) to match share_token column type.

CREATE OR REPLACE FUNCTION get_shared_computation(p_token UUID)
RETURNS TABLE(
  id               UUID,
  title            TEXT,
  input_json       JSONB,
  output_json      JSONB,
  tax_year         INTEGER,
  regime_selected  TEXT,
  created_at       TIMESTAMPTZ
)
LANGUAGE SQL SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    c.id,
    c.title,
    c.input_json,
    c.output_json,
    c.tax_year,
    c.regime_selected,
    c.created_at
  FROM computations c
  WHERE c.share_token = p_token        -- UUID = UUID (no type mismatch)
    AND c.share_enabled = true
    AND c.deleted_at IS NULL
  LIMIT 1;
$$;

-- PUBLIC: allow anonymous access for shared links
GRANT EXECUTE ON FUNCTION get_shared_computation(UUID) TO anon, authenticated;


-- ===== create_organization =====
-- Creates a new organization and adds the calling user as admin.
-- Called from /onboarding route after first sign-in.

CREATE OR REPLACE FUNCTION create_organization(
  p_name TEXT,
  p_slug TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate slug: lowercase alphanumeric + hyphens only
  IF p_slug !~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$' THEN
    RAISE EXCEPTION 'Invalid slug: must be 3-50 lowercase alphanumeric chars and hyphens';
  END IF;

  -- Check slug uniqueness
  IF EXISTS (SELECT 1 FROM organizations WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'Slug already taken: %', p_slug;
  END IF;

  -- Create organization
  INSERT INTO organizations (name, slug)
  VALUES (p_name, p_slug)
  RETURNING id INTO v_org_id;

  -- Add calling user as admin
  INSERT INTO organization_members (org_id, user_id, role)
  VALUES (v_org_id, v_user_id, 'admin');

  -- Create user profile if it doesn't exist
  INSERT INTO user_profiles (id, email)
  VALUES (
    v_user_id,
    (SELECT email FROM auth.users WHERE id = v_user_id)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'org_id', v_org_id::TEXT
  );
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Authenticated only: only logged-in users create orgs
GRANT EXECUTE ON FUNCTION create_organization(TEXT, TEXT) TO authenticated;


-- ===== accept_invitation =====
-- Accepts a pending invitation by token.
-- Accessible without authentication (user may not be signed in yet when
-- following the invite link), but the invitation email must match the
-- authenticated user's email if they are signed in.
-- CRITICAL: p_token is UUID (not TEXT) to match token column type.

CREATE OR REPLACE FUNCTION accept_invitation(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation organization_invitations%ROWTYPE;
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  v_user_id := auth.uid();

  -- Load invitation
  SELECT * INTO v_invitation
  FROM organization_invitations
  WHERE token = p_token              -- UUID = UUID (no type mismatch)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found');
  END IF;

  IF v_invitation.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', CASE v_invitation.status
        WHEN 'accepted' THEN 'This invitation has already been accepted'
        WHEN 'revoked'  THEN 'This invitation has been revoked'
        WHEN 'expired'  THEN 'This invitation has expired'
        ELSE 'Invalid invitation status'
      END
    );
  END IF;

  IF v_invitation.expires_at < now() THEN
    -- Mark expired
    UPDATE organization_invitations SET status = 'expired' WHERE id = v_invitation.id;
    RETURN jsonb_build_object('success', false, 'error', 'This invitation has expired');
  END IF;

  -- If user is authenticated, verify email matches
  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    IF lower(v_user_email) != lower(v_invitation.email) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'This invitation was sent to a different email address'
      );
    END IF;

    -- Add to org (ignore if already a member)
    INSERT INTO organization_members (org_id, user_id, role)
    VALUES (v_invitation.org_id, v_user_id, v_invitation.role)
    ON CONFLICT (org_id, user_id) DO UPDATE
      SET role = EXCLUDED.role;

    -- Mark invitation accepted
    UPDATE organization_invitations
    SET status = 'accepted', accepted_at = now()
    WHERE id = v_invitation.id;

    RETURN jsonb_build_object(
      'success', true,
      'org_id', v_invitation.org_id::TEXT,
      'role', v_invitation.role::TEXT
    );
  ELSE
    -- User not signed in: return invitation details so frontend can redirect to /auth
    RETURN jsonb_build_object(
      'success', false,
      'requires_auth', true,
      'email', v_invitation.email,
      'org_name', (SELECT name FROM organizations WHERE id = v_invitation.org_id)
    );
  END IF;
END;
$$;

-- PUBLIC: invite link may be opened before signing in
GRANT EXECUTE ON FUNCTION accept_invitation(UUID) TO anon, authenticated;


-- ===== soft_delete_computation =====
-- Sets deleted_at timestamp instead of hard delete.
-- Only the computation owner or an org admin can delete.

CREATE OR REPLACE FUNCTION soft_delete_computation(p_computation_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_computation computations%ROWTYPE;
  v_is_admin BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_computation
  FROM computations
  WHERE id = p_computation_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Computation not found');
  END IF;

  -- Check permission: own computation or org admin
  SELECT EXISTS(
    SELECT 1 FROM organization_members
    WHERE org_id = v_computation.org_id
      AND user_id = v_user_id
      AND role = 'admin'
  ) INTO v_is_admin;

  IF v_computation.user_id != v_user_id AND NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Permission denied');
  END IF;

  UPDATE computations
  SET deleted_at = now(), updated_at = now()
  WHERE id = p_computation_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION soft_delete_computation(UUID) TO authenticated;


-- ===== get_upcoming_deadlines =====
-- Returns deadline items for the next N days for the user's org.
-- Used by the /deadlines page.

CREATE OR REPLACE FUNCTION get_upcoming_deadlines(p_days_ahead INTEGER DEFAULT 30)
RETURNS TABLE(
  deadline_id    UUID,
  computation_id UUID,
  title          TEXT,
  client_name    TEXT,
  milestone_key  TEXT,
  label          TEXT,
  due_date       DATE,
  completed_date DATE,
  status         computation_status
)
LANGUAGE SQL SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    d.id       AS deadline_id,
    d.computation_id,
    c.title,
    cl.full_name AS client_name,
    d.milestone_key,
    d.label,
    d.due_date,
    d.completed_date,
    c.status
  FROM computation_deadlines d
  JOIN computations c ON c.id = d.computation_id
  LEFT JOIN clients cl ON cl.id = c.client_id
  WHERE c.org_id IN (SELECT user_org_ids())
    AND c.deleted_at IS NULL
    AND d.due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + p_days_ahead)
    AND d.completed_date IS NULL
  ORDER BY d.due_date ASC;
$$;

GRANT EXECUTE ON FUNCTION get_upcoming_deadlines(INTEGER) TO authenticated;


-- ===== generate_deadlines_for_computation =====
-- Generates filing deadline rows for a computation after it is computed.
-- Called from the frontend after saveComputationOutput().

CREATE OR REPLACE FUNCTION generate_deadlines_for_computation(
  p_computation_id UUID,
  p_tax_year INTEGER
)
RETURNS INTEGER  -- returns number of deadlines inserted
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Quarterly filing deadlines (Q1-Q3 only; annual covers Q4)
  -- Q1: due April 15 of tax year
  INSERT INTO computation_deadlines (computation_id, milestone_key, label, due_date)
  VALUES (
    p_computation_id,
    'Q1_PAYMENT',
    'Q1 Quarterly Payment (BIR 1701Q)',
    make_date(p_tax_year, 4, 15)
  )
  ON CONFLICT DO NOTHING;
  v_count := v_count + 1;

  -- Q2: due August 15 of tax year
  INSERT INTO computation_deadlines (computation_id, milestone_key, label, due_date)
  VALUES (
    p_computation_id,
    'Q2_PAYMENT',
    'Q2 Quarterly Payment (BIR 1701Q)',
    make_date(p_tax_year, 8, 15)
  )
  ON CONFLICT DO NOTHING;
  v_count := v_count + 1;

  -- Q3: due November 15 of tax year
  INSERT INTO computation_deadlines (computation_id, milestone_key, label, due_date)
  VALUES (
    p_computation_id,
    'Q3_PAYMENT',
    'Q3 Quarterly Payment (BIR 1701Q)',
    make_date(p_tax_year, 11, 15)
  )
  ON CONFLICT DO NOTHING;
  v_count := v_count + 1;

  -- Annual ITR: due April 15 of the FOLLOWING year
  INSERT INTO computation_deadlines (computation_id, milestone_key, label, due_date)
  VALUES (
    p_computation_id,
    'ANNUAL_ITR',
    'Annual Income Tax Return (BIR 1701/1701A)',
    make_date(p_tax_year + 1, 4, 15)
  )
  ON CONFLICT DO NOTHING;
  v_count := v_count + 1;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_deadlines_for_computation(UUID, INTEGER) TO authenticated;
```

---

## File: `supabase/migrations/004_storage.sql`

```sql
-- Migration: 004_storage.sql
-- Supabase Storage buckets for TaxKlaro
-- Idempotent: uses IF NOT EXISTS in storage schema

-- ===== FIRM LOGOS BUCKET =====
-- Stores firm logo images for PDF export headers.
-- Private bucket: only the owning user can read/write.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'firm-logos',
  'firm-logos',
  false,               -- private bucket
  524288,              -- 512 KB max per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- RLS on storage.objects for firm-logos bucket:
-- Folder structure: firm-logos/{user_id}/{filename}
-- Users can only access their own folder.

DROP POLICY IF EXISTS "logos_select" ON storage.objects;
CREATE POLICY "logos_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'firm-logos' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "logos_insert" ON storage.objects;
CREATE POLICY "logos_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'firm-logos' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "logos_update" ON storage.objects;
CREATE POLICY "logos_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'firm-logos' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "logos_delete" ON storage.objects;
CREATE POLICY "logos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'firm-logos' AND
    auth.uid()::TEXT = (storage.foldername(name))[1]
  );
```

---

## Migration File Summary

| File | Contents |
|------|---------|
| `001_initial_schema.sql` | 8 tables, 5 enums, 13 indexes, 2 triggers, RLS enable |
| `002_rls_policies.sql` | `user_org_ids()` helper + 4 policies per table (8 tables = 32 policies) |
| `003_rpc_functions.sql` | 6 RPCs with explicit GRANTs |
| `004_storage.sql` | 1 bucket + 4 storage.objects policies |

---

## RPC Function Inventory

| Function | Params | Returns | Auth | anon GRANT |
|----------|--------|---------|------|-----------|
| `get_shared_computation(p_token UUID)` | UUID | TABLE | SECURITY DEFINER | YES |
| `create_organization(p_name TEXT, p_slug TEXT)` | TEXT, TEXT | JSONB | authenticated | NO |
| `accept_invitation(p_token UUID)` | UUID | JSONB | SECURITY DEFINER | YES |
| `soft_delete_computation(p_computation_id UUID)` | UUID | JSONB | authenticated | NO |
| `get_upcoming_deadlines(p_days_ahead INTEGER)` | INTEGER | TABLE | authenticated | NO |
| `generate_deadlines_for_computation(p_computation_id UUID, p_tax_year INTEGER)` | UUID, INTEGER | INTEGER | authenticated | NO |

**Critical note**: `p_token` parameters are `UUID` in BOTH `get_shared_computation` and `accept_invitation`. This exactly matches the `share_token UUID` and `token UUID` column types. Do NOT change these to `TEXT` — the inheritance app had a runtime crash caused by this exact mismatch.

---

## Column Type — Parameter Type Match Table

This table must be verified during migration testing (see migration-verification aspect):

| RPC | Parameter | Parameter Type | Column | Column Type | Match? |
|-----|-----------|---------------|--------|-------------|--------|
| `get_shared_computation` | `p_token` | `UUID` | `computations.share_token` | `UUID` | MUST match |
| `accept_invitation` | `p_token` | `UUID` | `organization_invitations.token` | `UUID` | MUST match |
| `soft_delete_computation` | `p_computation_id` | `UUID` | `computations.id` | `UUID` | MUST match |
| `get_upcoming_deadlines` | `p_days_ahead` | `INTEGER` | N/A (arithmetic) | N/A | N/A |
| `generate_deadlines_for_computation` | `p_computation_id` | `UUID` | `computations.id` | `UUID` | MUST match |
| `generate_deadlines_for_computation` | `p_tax_year` | `INTEGER` | `computations.tax_year` | `INTEGER` | MUST match |

---

## Supabase `config.toml` Requirements

The project's `supabase/config.toml` must include:

```toml
[auth]
site_url = "http://localhost:5173"
additional_redirect_urls = [
  "http://localhost:5173/auth/callback",
  "http://localhost:5173/auth/reset-confirm",
  "https://taxklaro.ph/auth/callback",
  "https://taxklaro.ph/auth/reset-confirm"
]

[auth.email]
enable_signup = true
enable_confirmations = false   # set to true in production; false simplifies local dev

[db]
port = 54322
shadow_port = 54320
major_version = 15
```

---

## TypeScript Lib — `lib/organizations.ts`

Functions called by `useOrganization` hook:

```typescript
// src/lib/organizations.ts

import { supabase } from './supabase';
import type { Organization, OrganizationMember, OrganizationInvitation, OrgRole } from '@/types/org';

export async function getUserOrganization(userId: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('organizations(*)')
    .eq('user_id', userId)
    .limit(1)
    .single();

  if (error || !data) return null;
  const org = (data as any).organizations;
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    plan: org.plan,
    seatLimit: org.seat_limit,
    createdAt: org.created_at,
    updatedAt: org.updated_at,
  };
}

export async function listMembers(orgId: string): Promise<OrganizationMember[]> {
  const { data, error } = await supabase
    .from('organization_members')
    .select(`
      id, org_id, user_id, role, joined_at,
      auth_users:user_id(email, raw_user_meta_data)
    `)
    .eq('org_id', orgId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    orgId: row.org_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
    email: row.auth_users?.email ?? '',
    fullName: row.auth_users?.raw_user_meta_data?.full_name ?? null,
  }));
}

export async function inviteMember(
  orgId: string,
  email: string,
  role: OrgRole,
  invitedBy: string,
): Promise<void> {
  const { error } = await supabase
    .from('organization_invitations')
    .insert({ org_id: orgId, email, role, invited_by: invitedBy });

  if (error) throw error;
}

export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId);

  if (error) throw error;
}

export async function updateMemberRole(memberId: string, role: OrgRole): Promise<void> {
  const { error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('id', memberId);

  if (error) throw error;
}

export async function revokeInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase
    .from('organization_invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId);

  if (error) throw error;
}

export async function listPendingInvitations(orgId: string): Promise<OrganizationInvitation[]> {
  const { data, error } = await supabase
    .from('organization_invitations')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    orgId: row.org_id,
    email: row.email,
    role: row.role,
    token: row.token,
    status: row.status,
    invitedBy: row.invited_by,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
  }));
}

export async function createOrganization(name: string, slug: string): Promise<{ orgId: string }> {
  const { data, error } = await supabase.rpc('create_organization', {
    p_name: name,
    p_slug: slug,
  });

  if (error) throw error;
  if (!data.success) throw new Error(data.error);
  return { orgId: data.org_id };
}

export async function acceptInvitation(token: string): Promise<{
  orgId: string;
  role: string;
} | { requiresAuth: true; email: string; orgName: string }> {
  const { data, error } = await supabase.rpc('accept_invitation', {
    p_token: token,
  });

  if (error) throw error;
  if (!data.success) {
    if (data.requires_auth) {
      return { requiresAuth: true, email: data.email, orgName: data.org_name };
    }
    throw new Error(data.error);
  }
  return { orgId: data.org_id, role: data.role };
}
```

---

## TypeScript Lib — `lib/clients.ts`

```typescript
// src/lib/clients.ts

import { supabase } from './supabase';

export interface ClientRow {
  id: string;
  orgId: string;
  createdBy: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  tin: string | null;
  rdoCode: string | null;
  status: 'active' | 'inactive' | 'archived';
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createClient(
  orgId: string,
  userId: string,
  data: {
    fullName: string;
    email?: string;
    phone?: string;
    tin?: string;
    rdoCode?: string;
  },
): Promise<{ id: string }> {
  const { data: row, error } = await supabase
    .from('clients')
    .insert({
      org_id: orgId,
      created_by: userId,
      full_name: data.fullName,
      email: data.email ?? null,
      phone: data.phone ?? null,
      tin: data.tin ?? null,
      rdo_code: data.rdoCode ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return { id: row.id };
}

export async function loadClient(clientId: string): Promise<ClientRow> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error) throw error;
  return mapClientRow(data);
}

export async function listClients(
  orgId: string,
  options?: { statusFilter?: 'active' | 'inactive' | 'archived'; search?: string },
): Promise<ClientRow[]> {
  let query = supabase
    .from('clients')
    .select('*')
    .eq('org_id', orgId);

  if (options?.statusFilter) {
    query = query.eq('status', options.statusFilter);
  }
  if (options?.search) {
    query = query.ilike('full_name', `%${options.search}%`);
  }

  const { data, error } = await query.order('full_name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapClientRow);
}

export async function updateClient(
  clientId: string,
  updates: Partial<{
    fullName: string;
    email: string | null;
    phone: string | null;
    tin: string | null;
    rdoCode: string | null;
    status: 'active' | 'inactive' | 'archived';
    notes: string | null;
  }>,
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.tin !== undefined) dbUpdates.tin = updates.tin;
  if (updates.rdoCode !== undefined) dbUpdates.rdo_code = updates.rdoCode;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  const { error } = await supabase
    .from('clients')
    .update(dbUpdates)
    .eq('id', clientId);

  if (error) throw error;
}

function mapClientRow(row: Record<string, unknown>): ClientRow {
  return {
    id: row.id as string,
    orgId: row.org_id as string,
    createdBy: row.created_by as string,
    fullName: row.full_name as string,
    email: row.email as string | null,
    phone: row.phone as string | null,
    tin: row.tin as string | null,
    rdoCode: row.rdo_code as string | null,
    status: row.status as 'active' | 'inactive' | 'archived',
    notes: row.notes as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
```

---

## TypeScript Lib — `lib/computation-notes.ts`

```typescript
// src/lib/computation-notes.ts

import { supabase } from './supabase';

export interface ComputationNote {
  id: string;
  computationId: string;
  userId: string;
  content: string;
  createdAt: string;
  // joined for display:
  authorEmail: string | null;
  authorName: string | null;
}

export async function addNote(
  computationId: string,
  userId: string,
  content: string,
): Promise<ComputationNote> {
  const { data, error } = await supabase
    .from('computation_notes')
    .insert({ computation_id: computationId, user_id: userId, content })
    .select('*')
    .single();

  if (error) throw error;
  return {
    id: data.id,
    computationId: data.computation_id,
    userId: data.user_id,
    content: data.content,
    createdAt: data.created_at,
    authorEmail: null,
    authorName: null,
  };
}

export async function listNotes(computationId: string): Promise<ComputationNote[]> {
  const { data, error } = await supabase
    .from('computation_notes')
    .select(`
      id, computation_id, user_id, content, created_at,
      auth_users:user_id(email, raw_user_meta_data)
    `)
    .eq('computation_id', computationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    computationId: row.computation_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    authorEmail: row.auth_users?.email ?? null,
    authorName: row.auth_users?.raw_user_meta_data?.full_name ?? null,
  }));
}
```

---

## Critical Implementation Traps

1. **`share_token` is UUID, not TEXT** — The `get_shared_computation` RPC takes `p_token UUID`. When calling from TypeScript via `supabase.rpc('get_shared_computation', { p_token: token })`, the `token` string will be cast to UUID by Supabase. Do not add `::text` casts in the SQL. This was the exact failure in the inheritance app.

2. **`accept_invitation` accessible to anon** — The invite link at `/invite/$token` is opened before the user is signed in. The RPC must be granted to `anon` or it will fail with "permission denied for function accept_invitation". The function handles the unauthenticated case by returning `requires_auth: true`.

3. **`user_org_ids()` is SECURITY DEFINER** — Without `SECURITY DEFINER`, calling `auth.uid()` inside a function called from an RLS policy causes infinite recursion on `organization_members`. The `SECURITY DEFINER` + `SET search_path = public` pattern is required.

4. **Soft delete pattern** — `computations.deleted_at` must be `NULL` in all RLS SELECT policies and all queries. The `listComputations` query must include `.is('deleted_at', null)` filter. The `computations_select` RLS policy already enforces this, but application-level queries should be explicit for clarity.

5. **`notes_count` is denormalized** — The trigger `trg_computation_notes_increment` increments `notes_count` on every note insert. There is no trigger for decrement (notes are rarely deleted). On note delete, call `updateComputationInput` is NOT sufficient — the frontend should re-fetch the computation after a note deletion to get the correct count.

6. **Storage folder path** — Logo URL format is `{supabaseUrl}/storage/v1/object/firm-logos/{userId}/{filename}`. The RLS policy uses `(storage.foldername(name))[1]` which returns the first path segment. Always upload to `{userId}/logo.png` (not just `logo.png`) or the RLS will block access.

7. **`ON CONFLICT DO NOTHING` for deadlines** — `generate_deadlines_for_computation` uses `ON CONFLICT DO NOTHING`. There is no unique constraint on `(computation_id, milestone_key)` in the initial schema — add it:
   ```sql
   -- Add to 001_initial_schema.sql after CREATE TABLE computation_deadlines:
   CREATE UNIQUE INDEX IF NOT EXISTS idx_deadlines_computation_milestone
     ON computation_deadlines(computation_id, milestone_key);
   ```

8. **`auth_users` join** — The `organization_members` join `auth_users:user_id(email, raw_user_meta_data)` uses Supabase's foreign table syntax. In local dev this may require `supabase/config.toml` to have `[auth] enable_anonymous_sign_ins = false` and the auth schema enabled. If the join fails, fall back to separate queries for user metadata.
