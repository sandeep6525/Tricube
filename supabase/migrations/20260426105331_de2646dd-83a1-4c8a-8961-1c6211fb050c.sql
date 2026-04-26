ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS photo_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('staff-photos', 'staff-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "staff_photos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'staff-photos');

CREATE POLICY "staff_photos_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'staff-photos' AND public.is_admin(auth.uid()));

CREATE POLICY "staff_photos_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'staff-photos' AND public.is_admin(auth.uid()));

CREATE POLICY "staff_photos_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'staff-photos' AND public.is_admin(auth.uid()));