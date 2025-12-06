-- Eliminar la política existente de INSERT en content_likes
DROP POLICY IF EXISTS "Usuarios pueden dar like" ON public.content_likes;

-- Crear nueva política que impida dar like a contenido propio
CREATE POLICY "Usuarios pueden dar like a contenido ajeno"
ON public.content_likes
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND NOT EXISTS (
    SELECT 1 FROM content_uploads 
    WHERE content_uploads.id = content_likes.content_id 
    AND content_uploads.uploader_id = auth.uid()
  )
);