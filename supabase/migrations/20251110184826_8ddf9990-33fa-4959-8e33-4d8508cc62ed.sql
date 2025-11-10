-- Create storage buckets for content uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('content-videos', 'content-videos', true, 524288000, ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']),
  ('content-audios', 'content-audios', true, 104857600, ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac']),
  ('content-photos', 'content-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for content-videos bucket
CREATE POLICY "Users can upload their own videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'content-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Videos are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'content-videos');

CREATE POLICY "Users can update their own videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'content-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'content-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS policies for content-audios bucket
CREATE POLICY "Users can upload their own audios"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'content-audios' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Audios are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'content-audios');

CREATE POLICY "Users can update their own audios"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'content-audios' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audios"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'content-audios' AND auth.uid()::text = (storage.foldername(name))[1]);

-- RLS policies for content-photos bucket
CREATE POLICY "Users can upload their own photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'content-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Photos are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'content-photos');

CREATE POLICY "Users can update their own photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'content-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'content-photos' AND auth.uid()::text = (storage.foldername(name))[1]);