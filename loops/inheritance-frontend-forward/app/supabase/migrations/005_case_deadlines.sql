-- 005_case_deadlines.sql
-- Deadline Tracker RPC (§4.20)
-- Returns urgency summary for N cases at once (dashboard, avoids N+1 queries).
-- Table case_deadlines already exists in 001_initial_schema.sql.

CREATE OR REPLACE FUNCTION get_case_deadline_summaries(p_case_ids UUID[])
RETURNS TABLE (
  case_id UUID,
  total_milestones BIGINT,
  completed_milestones BIGINT,
  most_urgent_label TEXT,
  most_urgent_due_date DATE,
  days_until_most_urgent INT
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  WITH deadline_stats AS (
    SELECT
      cd.case_id,
      COUNT(*)::BIGINT AS total_milestones,
      COUNT(cd.completed_date)::BIGINT AS completed_milestones,
      -- Most urgent = earliest non-completed deadline
      MIN(cd.due_date) FILTER (WHERE cd.completed_date IS NULL) AS earliest_pending_due
    FROM case_deadlines cd
    WHERE cd.case_id = ANY(p_case_ids)
      AND cd.user_id = auth.uid()
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

GRANT EXECUTE ON FUNCTION get_case_deadline_summaries(UUID[]) TO authenticated;
