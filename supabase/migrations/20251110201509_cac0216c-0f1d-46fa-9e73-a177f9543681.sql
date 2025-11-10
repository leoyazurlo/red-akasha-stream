-- Actualizar el bucket content-videos para aceptar imágenes (thumbnails)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
WHERE id = 'content-videos';

-- Asegurar que las políticas permiten subir thumbnails
-- La política existente debería funcionar, pero vamos a verificar que exista una para INSERT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload their own videos and thumbnails'
  ) THEN
    CREATE POLICY "Users can upload their own videos and thumbnails"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'content-videos' 
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;