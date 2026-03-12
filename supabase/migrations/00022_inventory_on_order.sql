-- Add on-order tracking columns to inventory table

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('not_ordered', 'ordered', 'partial', 'received');
  END IF;
END$$;

ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS qty_on_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS order_status order_status NOT NULL DEFAULT 'not_ordered';
