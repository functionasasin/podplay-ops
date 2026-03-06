-- Fix: INSERT...RETURNING requires SELECT. During onboarding, user inserts org
-- before member row exists, so the member-based SELECT policy blocks .select('id').
-- Solution: use a DB function to handle onboarding atomically.

-- Create a function that creates org + member in one transaction
CREATE OR REPLACE FUNCTION create_org_with_member(org_name TEXT, org_slug TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
BEGIN
  INSERT INTO organizations (name, slug)
  VALUES (org_name, org_slug)
  RETURNING id INTO new_org_id;

  INSERT INTO organization_members (org_id, user_id, role)
  VALUES (new_org_id, auth.uid(), 'admin');

  INSERT INTO user_profiles (id)
  VALUES (auth.uid())
  ON CONFLICT (id) DO NOTHING;

  RETURN new_org_id;
END;
$$;
