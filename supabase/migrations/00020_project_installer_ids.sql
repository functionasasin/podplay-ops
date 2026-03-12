-- Migration 00020: Add installer_ids array to projects (multi-select installer support)
-- Replaces the single installer_id FK with a UUID array to allow multiple installers per project.

ALTER TABLE projects
  ADD COLUMN installer_ids UUID[] NOT NULL DEFAULT '{}';

-- Migrate any existing single installer_id into the new array column
UPDATE projects
  SET installer_ids = ARRAY[installer_id]
  WHERE installer_id IS NOT NULL;

-- Remove the old single-FK column
ALTER TABLE projects DROP COLUMN installer_id;
