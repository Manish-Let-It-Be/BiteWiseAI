
UPDATE storage.buckets SET public = false WHERE id = 'food-photos';
DROP POLICY IF EXISTS "Food photos public read" ON storage.objects;
CREATE POLICY "Users read own food photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'food-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
