-- Fix circular RLS: organization_members SELECT policy references itself
-- Replace with direct user_id check

DROP POLICY "Members can view org members" ON organization_members;

CREATE POLICY "Members can view org members"
  ON organization_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR org_id IN (SELECT om.org_id FROM organization_members om WHERE om.user_id = auth.uid())
  );
