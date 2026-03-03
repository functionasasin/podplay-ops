-- 009_cases_intake_data.sql
-- Stage 19: Add intake_data JSONB column to cases table
-- Stores additional guided intake form data not in EngineInput:
--   decedent TIN, asset category flags, will status, settlement track,
--   relationship to decedent, and other intake-specific fields.
-- Source: docs/plans/inheritance-premium-spec.md §4.18

ALTER TABLE cases ADD COLUMN IF NOT EXISTS intake_data JSONB;

-- Index for querying intake data fields (e.g., settlement track)
CREATE INDEX IF NOT EXISTS idx_cases_intake_data ON cases
  USING gin(intake_data) WHERE intake_data IS NOT NULL;
