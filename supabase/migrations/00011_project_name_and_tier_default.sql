-- Add project_name column (used as display name for the project)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_name TEXT NOT NULL DEFAULT '';

-- Add a default for tier so new projects can be created before tier selection in intake
ALTER TABLE projects
  ALTER COLUMN tier SET DEFAULT 'pro';

-- Allow venue_name to be null (it may be collected later in intake)
ALTER TABLE projects
  ALTER COLUMN venue_name DROP NOT NULL;
