-- Add completed_at column to projects table
-- GoLive.tsx records when a project is fully closed out

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
