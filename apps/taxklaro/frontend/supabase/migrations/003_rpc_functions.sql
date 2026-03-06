-- create_organization: creates org + makes caller the admin member
CREATE OR REPLACE FUNCTION create_organization(p_name TEXT, p_slug TEXT)
RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
BEGIN
  INSERT INTO organizations (name, slug) VALUES (p_name, p_slug)
  RETURNING id INTO v_org_id;

  INSERT INTO organization_members (org_id, user_id, role)
  VALUES (v_org_id, auth.uid(), 'admin');

  -- Create user_profile if it doesn't exist
  INSERT INTO user_profiles (id, firm_name) VALUES (auth.uid(), p_name)
  ON CONFLICT (id) DO UPDATE SET firm_name = EXCLUDED.firm_name;

  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

GRANT EXECUTE ON FUNCTION create_organization(TEXT, TEXT) TO authenticated;

-- invite_member: admin/accountant creates a pending invitation
CREATE OR REPLACE FUNCTION invite_member(p_email TEXT, p_role org_role, p_org_id UUID)
RETURNS UUID AS $$
DECLARE
  v_invitation_id UUID;
BEGIN
  -- Verify caller is admin or accountant of this org
  IF NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE org_id = p_org_id AND user_id = auth.uid() AND role IN ('admin', 'accountant')
  ) THEN
    RAISE EXCEPTION 'Not authorized to invite members';
  END IF;

  INSERT INTO organization_invitations (org_id, email, role, invited_by)
  VALUES (p_org_id, p_email, p_role, auth.uid())
  RETURNING id INTO v_invitation_id;

  RETURN v_invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

GRANT EXECUTE ON FUNCTION invite_member(TEXT, org_role, UUID) TO authenticated;

-- accept_invitation: caller accepts invite by token (UUID)
CREATE OR REPLACE FUNCTION accept_invitation(p_token UUID)
RETURNS VOID AS $$
DECLARE
  v_invite organization_invitations%ROWTYPE;
BEGIN
  SELECT * INTO v_invite FROM organization_invitations
  WHERE token = p_token AND status = 'pending' AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or expired';
  END IF;

  INSERT INTO organization_members (org_id, user_id, role)
  VALUES (v_invite.org_id, auth.uid(), v_invite.role)
  ON CONFLICT (org_id, user_id) DO NOTHING;

  UPDATE organization_invitations SET status = 'accepted' WHERE id = v_invite.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

GRANT EXECUTE ON FUNCTION accept_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_invitation(UUID) TO anon;  -- Allow pre-auth invitation acceptance flow

-- get_shared_computation: public RPC — no auth required
-- p_token is UUID (NOT TEXT — must match share_token column type)
CREATE OR REPLACE FUNCTION get_shared_computation(p_token UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', c.id,
    'title', c.title,
    'taxYear', c.tax_year,
    'outputJson', c.output_json,
    'shareEnabled', c.share_enabled,
    'orgName', o.name
  ) INTO v_result
  FROM computations c
  JOIN organizations o ON o.id = c.org_id
  WHERE c.share_token = p_token
    AND c.share_enabled = true;

  RETURN v_result;  -- NULL if not found or sharing disabled
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

GRANT EXECUTE ON FUNCTION get_shared_computation(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_shared_computation(UUID) TO authenticated;

-- get_invitation_by_token: for InviteAcceptPage
CREATE OR REPLACE FUNCTION get_invitation_by_token(p_token UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', i.id,
    'orgName', o.name,
    'email', i.email,
    'role', i.role,
    'status', i.status,
    'expiresAt', i.expires_at
  ) INTO v_result
  FROM organization_invitations i
  JOIN organizations o ON o.id = i.org_id
  WHERE i.token = p_token;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

GRANT EXECUTE ON FUNCTION get_invitation_by_token(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_invitation_by_token(UUID) TO authenticated;
