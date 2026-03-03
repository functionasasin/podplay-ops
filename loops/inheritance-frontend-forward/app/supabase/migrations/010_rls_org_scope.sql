-- 010_rls_org_scope.sql
-- Stage 25: Multi-Seat Firm Accounts — RLS org-scoping (§4.11)
-- Updates RLS policies from user_id to org_id scoping so all firm
-- members share access to cases, clients, deadlines, documents,
-- and conflict logs within their organization.

-- ============================================================
-- Helper: get user's org_ids (used in multiple policies)
-- ============================================================
CREATE OR REPLACE FUNCTION user_org_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT org_id FROM organization_members WHERE user_id = auth.uid();
$$;

-- ============================================================
-- Organizations: members can see their own org(s)
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "organizations_select" ON organizations
  FOR SELECT USING (
    id IN (SELECT user_org_ids())
  );

-- Only admins can update org details (name, plan, etc.)
CREATE POLICY "organizations_update" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  ) WITH CHECK (
    id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Organization Members: org members can see co-members
-- ============================================================
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_select" ON organization_members
  FOR SELECT USING (
    org_id IN (SELECT user_org_ids())
  );

-- Only admins can add members (via accept invite flow)
CREATE POLICY "org_members_insert" ON organization_members
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    -- Allow self-insert when accepting an invitation
    OR (user_id = auth.uid() AND org_id IN (
      SELECT org_id FROM organization_invitations
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        AND status = 'pending'
        AND expires_at > NOW()
    ))
  );

-- Only admins can remove members (not themselves)
CREATE POLICY "org_members_delete" ON organization_members
  FOR DELETE USING (
    org_id IN (
      SELECT om.org_id FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.role = 'admin'
    )
    AND user_id != auth.uid()
  );

-- Only admins can update member roles
CREATE POLICY "org_members_update" ON organization_members
  FOR UPDATE USING (
    org_id IN (
      SELECT om.org_id FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.role = 'admin'
    )
  ) WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM organization_members om
      WHERE om.user_id = auth.uid() AND om.role = 'admin'
    )
  );

-- ============================================================
-- Organization Invitations: admin-only create/manage
-- ============================================================
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- Org members can see pending invitations for their org
CREATE POLICY "invitations_select" ON organization_invitations
  FOR SELECT USING (
    org_id IN (SELECT user_org_ids())
  );

-- Only admins can create invitations
CREATE POLICY "invitations_insert" ON organization_invitations
  FOR INSERT WITH CHECK (
    invited_by = auth.uid()
    AND org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update (revoke) invitations
CREATE POLICY "invitations_update" ON organization_invitations
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  ) WITH CHECK (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Case Deadlines: switch from user_id to org-scoped
-- ============================================================
DROP POLICY IF EXISTS "deadlines_all_own" ON case_deadlines;

CREATE POLICY "deadlines_select" ON case_deadlines
  FOR SELECT USING (
    case_id IN (
      SELECT id FROM cases WHERE org_id IN (SELECT user_org_ids())
    )
  );

CREATE POLICY "deadlines_insert" ON case_deadlines
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND case_id IN (
      SELECT id FROM cases WHERE org_id IN (SELECT user_org_ids())
    )
  );

CREATE POLICY "deadlines_update" ON case_deadlines
  FOR UPDATE USING (
    case_id IN (
      SELECT id FROM cases WHERE org_id IN (SELECT user_org_ids())
    )
  );

CREATE POLICY "deadlines_delete" ON case_deadlines
  FOR DELETE USING (
    case_id IN (
      SELECT id FROM cases WHERE org_id IN (
        SELECT org_id FROM organization_members
        WHERE user_id = auth.uid() AND role IN ('admin', 'attorney')
      )
    )
  );

-- ============================================================
-- Case Documents: switch from user_id to org-scoped
-- ============================================================
DROP POLICY IF EXISTS "case_documents_own" ON case_documents;

CREATE POLICY "case_documents_select" ON case_documents
  FOR SELECT USING (
    case_id IN (
      SELECT id FROM cases WHERE org_id IN (SELECT user_org_ids())
    )
  );

CREATE POLICY "case_documents_insert" ON case_documents
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND case_id IN (
      SELECT id FROM cases WHERE org_id IN (SELECT user_org_ids())
    )
  );

CREATE POLICY "case_documents_update" ON case_documents
  FOR UPDATE USING (
    case_id IN (
      SELECT id FROM cases WHERE org_id IN (SELECT user_org_ids())
    )
  );

CREATE POLICY "case_documents_delete" ON case_documents
  FOR DELETE USING (
    case_id IN (
      SELECT id FROM cases WHERE org_id IN (
        SELECT org_id FROM organization_members
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );

-- ============================================================
-- Conflict Check Log: switch from user_id to org-scoped
-- ============================================================
DROP POLICY IF EXISTS "conflict_log_own" ON conflict_check_log;

-- Add org_id column to conflict_check_log for direct org scoping
ALTER TABLE conflict_check_log ADD COLUMN IF NOT EXISTS org_id UUID
  REFERENCES organizations(id) ON DELETE CASCADE;

-- Backfill org_id from the user's organization membership
UPDATE conflict_check_log cl
SET org_id = (
  SELECT om.org_id FROM organization_members om
  WHERE om.user_id = cl.user_id
  LIMIT 1
)
WHERE cl.org_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_conflict_log_org ON conflict_check_log(org_id);

CREATE POLICY "conflict_log_select" ON conflict_check_log
  FOR SELECT USING (
    org_id IN (SELECT user_org_ids())
  );

CREATE POLICY "conflict_log_insert" ON conflict_check_log
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND org_id IN (SELECT user_org_ids())
  );

-- ============================================================
-- Update get_case_deadline_summaries to use org-scoped access
-- ============================================================
CREATE OR REPLACE FUNCTION get_case_deadline_summaries(p_case_ids UUID[])
RETURNS TABLE (
  case_id UUID,
  total_milestones BIGINT,
  completed_milestones BIGINT,
  most_urgent_label TEXT,
  most_urgent_due_date DATE,
  days_until_most_urgent INT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_org_ids UUID[];
BEGIN
  -- Get the user's org IDs for scoping
  SELECT ARRAY(
    SELECT om.org_id FROM organization_members om WHERE om.user_id = auth.uid()
  ) INTO v_org_ids;

  RETURN QUERY
  WITH deadline_stats AS (
    SELECT
      cd.case_id,
      COUNT(*)::BIGINT AS total_milestones,
      COUNT(cd.completed_date)::BIGINT AS completed_milestones,
      MIN(cd.due_date) FILTER (WHERE cd.completed_date IS NULL) AS earliest_pending_due
    FROM case_deadlines cd
    INNER JOIN cases c ON c.id = cd.case_id
    WHERE cd.case_id = ANY(p_case_ids)
      AND c.org_id = ANY(v_org_ids)
    GROUP BY cd.case_id
  ),
  urgent_labels AS (
    SELECT DISTINCT ON (cd.case_id)
      cd.case_id,
      cd.label AS most_urgent_label,
      cd.due_date AS most_urgent_due_date
    FROM case_deadlines cd
    INNER JOIN deadline_stats ds ON ds.case_id = cd.case_id
    WHERE cd.completed_date IS NULL
      AND cd.due_date = ds.earliest_pending_due
    ORDER BY cd.case_id, cd.created_at ASC
  )
  SELECT
    ds.case_id,
    ds.total_milestones,
    ds.completed_milestones,
    ul.most_urgent_label,
    ul.most_urgent_due_date,
    (ul.most_urgent_due_date - CURRENT_DATE)::INT AS days_until_most_urgent
  FROM deadline_stats ds
  LEFT JOIN urgent_labels ul ON ul.case_id = ds.case_id;
END;
$$;

-- ============================================================
-- Update run_conflict_check to include org_id in log entry
-- ============================================================
CREATE OR REPLACE FUNCTION run_conflict_check(
  p_name TEXT,
  p_tin  TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_org_id UUID;
  v_client_matches JSONB := '[]'::JSONB;
  v_heir_matches JSONB := '[]'::JSONB;
  v_tin_matches JSONB := '[]'::JSONB;
  v_total INT := 0;
  v_outcome TEXT := 'clear';
  v_result JSONB;
BEGIN
  -- Get the user's org_id
  SELECT om.org_id INTO v_org_id
  FROM organization_members om
  WHERE om.user_id = v_uid
  LIMIT 1;

  -- Set trigram similarity threshold
  PERFORM set_limit(0.35);

  -- 1. Search existing clients by trigram name similarity (org-scoped)
  SELECT COALESCE(jsonb_agg(row_to_json(m)::JSONB), '[]'::JSONB)
  INTO v_client_matches
  FROM (
    SELECT
      c.id,
      c.full_name,
      c.tin,
      c.status::TEXT AS status,
      c.conflict_cleared,
      ROUND(similarity(c.full_name, p_name)::NUMERIC, 2) AS similarity_score,
      'client' AS match_type
    FROM clients c
    WHERE c.org_id = v_org_id
      AND similarity(c.full_name, p_name) >= 0.35
    ORDER BY similarity(c.full_name, p_name) DESC
    LIMIT 20
  ) m;

  -- 2. Search heir names in cases (org-scoped)
  SELECT COALESCE(jsonb_agg(row_to_json(m)::JSONB), '[]'::JSONB)
  INTO v_heir_matches
  FROM (
    SELECT DISTINCT ON (heir_name)
      cs.id AS case_id,
      cs.title AS case_title,
      cs.decedent_name,
      heir.value->>'name' AS heir_name,
      ROUND(similarity(heir.value->>'name', p_name)::NUMERIC, 2) AS similarity_score,
      'heir' AS match_type
    FROM cases cs
    CROSS JOIN LATERAL jsonb_array_elements(
      COALESCE(cs.input_json->'family_tree'->'heirs', '[]'::JSONB)
    ) AS heir
    WHERE cs.org_id = v_org_id
      AND cs.input_json IS NOT NULL
      AND heir.value->>'name' IS NOT NULL
      AND similarity(heir.value->>'name', p_name) >= 0.35
    ORDER BY heir_name, similarity(heir.value->>'name', p_name) DESC
    LIMIT 20
  ) m;

  -- 3. TIN exact match (org-scoped)
  IF p_tin IS NOT NULL AND p_tin != '' THEN
    SELECT COALESCE(jsonb_agg(row_to_json(m)::JSONB), '[]'::JSONB)
    INTO v_tin_matches
    FROM (
      SELECT
        c.id,
        c.full_name,
        c.tin,
        c.status::TEXT AS status,
        c.conflict_cleared,
        1.00::NUMERIC AS similarity_score,
        'tin_match' AS match_type
      FROM clients c
      WHERE c.org_id = v_org_id
        AND c.tin = p_tin
      LIMIT 10
    ) m;
  END IF;

  -- Calculate total matches
  v_total := (
    SELECT COUNT(DISTINCT id) FROM (
      SELECT (m->>'id')::TEXT AS id FROM jsonb_array_elements(v_client_matches) m
      UNION
      SELECT (m->>'case_id')::TEXT || ':' || (m->>'heir_name') AS id FROM jsonb_array_elements(v_heir_matches) m
      UNION
      SELECT (m->>'id')::TEXT AS id FROM jsonb_array_elements(v_tin_matches) m
    ) all_matches
  );

  -- Determine outcome
  IF v_total > 0 THEN
    v_outcome := 'flagged';
  ELSE
    v_outcome := 'clear';
  END IF;

  -- Build result
  v_result := jsonb_build_object(
    'client_matches', v_client_matches,
    'heir_matches', v_heir_matches,
    'tin_matches', v_tin_matches,
    'total_matches', v_total,
    'outcome', v_outcome,
    'checked_name', p_name,
    'checked_tin', p_tin,
    'checked_at', NOW()
  );

  -- Log the check (now includes org_id)
  INSERT INTO conflict_check_log (
    user_id, org_id, checked_name, checked_tin, result_json, match_count, outcome
  ) VALUES (
    v_uid, v_org_id, p_name, p_tin, v_result, v_total, v_outcome::conflict_outcome
  );

  RETURN v_result;
END;
$$;

-- ============================================================
-- Accept invitation RPC
-- ============================================================
CREATE OR REPLACE FUNCTION accept_invitation(p_token UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT;
  v_invitation RECORD;
  v_seat_count INT;
  v_seat_limit INT;
BEGIN
  -- Get user email
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;

  -- Find the invitation
  SELECT * INTO v_invitation
  FROM organization_invitations
  WHERE token = p_token
    AND status = 'pending'
    AND email = v_email
    AND expires_at > NOW();

  IF v_invitation IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invitation expired, revoked, or not found'
    );
  END IF;

  -- Check seat limit
  SELECT seat_limit INTO v_seat_limit
  FROM organizations WHERE id = v_invitation.org_id;

  SELECT COUNT(*) INTO v_seat_count
  FROM organization_members WHERE org_id = v_invitation.org_id;

  IF v_seat_count >= v_seat_limit THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Organization has reached its seat limit'
    );
  END IF;

  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM organization_members
    WHERE org_id = v_invitation.org_id AND user_id = v_uid
  ) THEN
    -- Update invitation status anyway
    UPDATE organization_invitations
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = v_invitation.id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Already a member of this organization'
    );
  END IF;

  -- Create member
  INSERT INTO organization_members (org_id, user_id, role)
  VALUES (v_invitation.org_id, v_uid, v_invitation.role);

  -- Update invitation
  UPDATE organization_invitations
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object(
    'success', true,
    'org_id', v_invitation.org_id,
    'role', v_invitation.role::TEXT
  );
END;
$$;

GRANT EXECUTE ON FUNCTION accept_invitation(UUID) TO authenticated;
