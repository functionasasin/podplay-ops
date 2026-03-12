ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated users full access vendors"
  ON vendors FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
