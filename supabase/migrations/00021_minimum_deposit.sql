-- Add minimum_deposit column to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS minimum_deposit numeric NOT NULL DEFAULT 500.00;
