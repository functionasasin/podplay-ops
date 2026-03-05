-- create_organization: call after sign-up to create org + make user admin
CREATE OR REPLACE FUNCTION create_organization(p_name TEXT, p_slug TEXT DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_org_id UUID;
  v_slug TEXT := COALESCE(p_slug, lower(regexp_replace(p_name, '[^a-zA-Z0-9]', '-', 'g')));
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  INSERT INTO organizations (name, slug, plan, seat_limit)
  VALUES (p_name, v_slug, 'solo', 1)
  RETURNING id INTO v_org_id;

  INSERT INTO organization_members (org_id, user_id, role)
  VALUES (v_org_id, v_uid, 'admin');

  RETURN jsonb_build_object('success', true, 'org_id', v_org_id);
END; $$;

GRANT EXECUTE ON FUNCTION create_organization(TEXT, TEXT) TO authenticated;

-- handle_new_user: auto-create user_profiles row on sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO user_profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update get_shared_case to include tax and comparison output
CREATE OR REPLACE FUNCTION get_shared_case(p_token TEXT)
RETURNS TABLE (
  title TEXT,
  status TEXT,
  input_json JSONB,
  output_json JSONB,
  tax_output_json JSONB,
  comparison_output_json JSONB,
  decedent_name TEXT,
  date_of_death DATE
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.title,
    c.status::TEXT,
    c.input_json,
    c.output_json,
    c.tax_output_json,
    c.comparison_output_json,
    c.decedent_name,
    c.date_of_death
  FROM cases c
  WHERE c.share_token = p_token
    AND c.share_enabled = TRUE;
END; $$;
