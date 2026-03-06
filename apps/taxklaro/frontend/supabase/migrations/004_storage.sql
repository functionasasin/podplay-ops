-- firm-logos bucket for PDF branding
INSERT INTO storage.buckets (id, name, public)
VALUES ('firm-logos', 'firm-logos', false)
ON CONFLICT (id) DO NOTHING;

-- Only authenticated users can upload to their own folder
CREATE POLICY "firm_logo_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'firm-logos' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "firm_logo_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'firm-logos' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "firm_logo_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'firm-logos' AND (storage.foldername(name))[1] = auth.uid()::TEXT);
