-- Fix infinite recursion: organization_members SELECT policy referenced itself
DROP POLICY "Members can view org members" ON organization_members;

-- Simple policy: you can see all members in orgs you belong to
-- Use a security definer helper to avoid recursion
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT org_id FROM organization_members WHERE user_id = auth.uid();
$$;

CREATE POLICY "Members can view org members"
  ON organization_members FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT get_user_org_ids()));

-- Also fix other policies that reference organization_members in subqueries
-- to use the helper function instead

DROP POLICY IF EXISTS "Members can view their organization" ON organizations;
CREATE POLICY "Members can view their organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Admins can update their organization" ON organizations;
CREATE POLICY "Admins can update their organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can update members" ON organization_members;
CREATE POLICY "Admins can update members"
  ON organization_members FOR UPDATE
  TO authenticated
  USING (org_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Admins can delete members" ON organization_members;
CREATE POLICY "Admins can delete members"
  ON organization_members FOR DELETE
  TO authenticated
  USING (org_id IN (SELECT get_user_org_ids()));
