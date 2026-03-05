-- ============================================================
-- Shareable Links: get_shared_case RPC (§4.10)
-- ============================================================
-- SECURITY DEFINER bypasses RLS so anonymous users can view
-- shared cases via /share/:token without authentication.
-- Only returns data when share_enabled = TRUE.

CREATE OR REPLACE FUNCTION get_shared_case(p_token TEXT)
RETURNS TABLE (
  title TEXT,
  status TEXT,
  input_json JSONB,
  output_json JSONB,
  decedent_name TEXT,
  date_of_death DATE
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT c.title, c.status::TEXT, c.input_json, c.output_json,
         c.decedent_name, c.date_of_death
  FROM cases c
  WHERE c.share_token = p_token::UUID AND c.share_enabled = TRUE;
END; $$;
