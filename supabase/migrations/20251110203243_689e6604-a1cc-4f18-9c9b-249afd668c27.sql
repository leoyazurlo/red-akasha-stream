
-- Cambiar el default status de content_uploads a 'approved' en lugar de 'pending'
ALTER TABLE content_uploads 
ALTER COLUMN status SET DEFAULT 'approved';

-- Actualizar todos los videos existentes a approved (ya que son uploads de usuarios registrados)
UPDATE content_uploads 
SET status = 'approved' 
WHERE status = 'pending' 
AND content_type IN ('video_musical_vivo', 'video_clip', 'corto', 'documental', 'pelicula');
