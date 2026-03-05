-- 007_conflict_check.sql
-- Conflict of Interest Check RPC (§4.17)
-- Searches existing clients and case heir names using pg_trgm similarity
-- Source: docs/plans/inheritance-premium-spec.md §4.17

-- Ensure pg_trgm is available (already created in 001 but safe to repeat)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Set similarity threshold for session (0.35 — intentionally broad)
-- Note: This is a session-level setting; the function sets it internally.

CREATE OR REPLACE FUNCTION run_conflict_check(
  p_name TEXT,
  p_tin  TEXT DEFAULT NULL
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_client_matches JSONB := '[]'::JSONB;
  v_heir_matches JSONB := '[]'::JSONB;
  v_tin_matches JSONB := '[]'::JSONB;
  v_total INT := 0;
  v_outcome TEXT := 'clear';
  v_result JSONB;
BEGIN
  -- Set trigram similarity threshold
  PERFORM set_limit(0.35);

  -- 1. Search existing clients by trigram name similarity (threshold 0.35)
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
    INNER JOIN organization_members om ON om.org_id = c.org_id
    WHERE om.user_id = v_uid
      AND similarity(c.full_name, p_name) >= 0.35
    ORDER BY similarity(c.full_name, p_name) DESC
    LIMIT 20
  ) m;

  -- 2. Search heir names embedded in cases.input_json->family_tree->heirs
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
    INNER JOIN organization_members om ON om.org_id = cs.org_id
    CROSS JOIN LATERAL jsonb_array_elements(
      COALESCE(cs.input_json->'family_tree'->'heirs', '[]'::JSONB)
    ) AS heir
    WHERE om.user_id = v_uid
      AND cs.input_json IS NOT NULL
      AND heir.value->>'name' IS NOT NULL
      AND similarity(heir.value->>'name', p_name) >= 0.35
    ORDER BY heir_name, similarity(heir.value->>'name', p_name) DESC
    LIMIT 20
  ) m;

  -- 3. TIN exact match regardless of name similarity
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
      INNER JOIN organization_members om ON om.org_id = c.org_id
      WHERE om.user_id = v_uid
        AND c.tin = p_tin
      LIMIT 10
    ) m;
  END IF;

  -- Calculate total matches (deduplicate client matches that appear in both name and TIN)
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

  -- Log the check
  INSERT INTO conflict_check_log (
    user_id, checked_name, checked_tin, result_json, match_count, outcome
  ) VALUES (
    v_uid, p_name, p_tin, v_result, v_total, v_outcome::conflict_outcome
  );

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION run_conflict_check(TEXT, TEXT) TO authenticated;
