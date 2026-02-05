-- Create storage bucket for content uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-uploads',
  'content-uploads',
  true,
  524288000, -- 500MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime', 'audio/mpeg', 'audio/wav', 'audio/ogg']
);

-- Allow public read access
CREATE POLICY "Public read access for content uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'content-uploads');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload content"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'content-uploads' AND auth.role() = 'authenticated');

-- Allow users to update their own uploads
CREATE POLICY "Users can update their own uploads"
ON storage.objects FOR UPDATE
USING (bucket_id = 'content-uploads' AND auth.uid()::text = (storage.foldername(name))[2]);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'content-uploads' AND auth.uid()::text = (storage.foldername(name))[2]);