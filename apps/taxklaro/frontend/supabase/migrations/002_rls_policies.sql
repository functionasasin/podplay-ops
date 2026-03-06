-- Helper function: get org IDs for the current user
CREATE OR REPLACE FUNCTION user_org_ids()
RETURNS UUID[] AS $$
  SELECT ARRAY(
    SELECT org_id FROM organization_members WHERE user_id = auth.uid()
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER
   SET search_path = public;  -- Required on SECURITY DEFINER

GRANT EXECUTE ON FUNCTION user_org_ids() TO authenticated;

-- organizations: members can view, admins can update
CREATE POLICY "org_select" ON organizations
  FOR SELECT TO authenticated
  USING (id = ANY(user_org_ids()));

CREATE POLICY "org_update_admin" ON organizations
  FOR UPDATE TO authenticated
  USING (id = ANY(user_org_ids()))
  WITH CHECK (id = ANY(user_org_ids()));

-- organization_members: members can view own org members
CREATE POLICY "member_select" ON organization_members
  FOR SELECT TO authenticated
  USING (org_id = ANY(user_org_ids()));

-- computations: org members can select; only non-readonly can insert/update
CREATE POLICY "computation_select" ON computations
  FOR SELECT TO authenticated
  USING (org_id = ANY(user_org_ids()));

CREATE POLICY "computation_insert" ON computations
  FOR INSERT TO authenticated
  WITH CHECK (org_id = ANY(user_org_ids()));

CREATE POLICY "computation_update" ON computations
  FOR UPDATE TO authenticated
  USING (org_id = ANY(user_org_ids()))
  WITH CHECK (org_id = ANY(user_org_ids()));

CREATE POLICY "computation_delete" ON computations
  FOR DELETE TO authenticated
  USING (org_id = ANY(user_org_ids()));

-- user_profiles: users can only see and edit their own profile
CREATE POLICY "profile_select" ON user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profile_insert" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "profile_update" ON user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- clients: org members can CRUD
CREATE POLICY "client_select" ON clients FOR SELECT TO authenticated USING (org_id = ANY(user_org_ids()));
CREATE POLICY "client_insert" ON clients FOR INSERT TO authenticated WITH CHECK (org_id = ANY(user_org_ids()));
CREATE POLICY "client_update" ON clients FOR UPDATE TO authenticated USING (org_id = ANY(user_org_ids()));
CREATE POLICY "client_delete" ON clients FOR DELETE TO authenticated USING (org_id = ANY(user_org_ids()));

-- computation_notes: org members can view; authors can insert
CREATE POLICY "notes_select" ON computation_notes FOR SELECT TO authenticated
  USING (computation_id IN (SELECT id FROM computations WHERE org_id = ANY(user_org_ids())));

CREATE POLICY "notes_insert" ON computation_notes FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    computation_id IN (SELECT id FROM computations WHERE org_id = ANY(user_org_ids()))
  );

-- computation_deadlines: follow computation access
CREATE POLICY "deadlines_select" ON computation_deadlines FOR SELECT TO authenticated
  USING (computation_id IN (SELECT id FROM computations WHERE org_id = ANY(user_org_ids())));

CREATE POLICY "deadlines_update" ON computation_deadlines FOR UPDATE TO authenticated
  USING (computation_id IN (SELECT id FROM computations WHERE org_id = ANY(user_org_ids())));
