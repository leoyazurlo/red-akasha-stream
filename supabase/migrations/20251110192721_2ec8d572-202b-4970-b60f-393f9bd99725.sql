-- Agregar campos de metadatos a la tabla content_uploads
ALTER TABLE content_uploads 
ADD COLUMN IF NOT EXISTS video_width integer,
ADD COLUMN IF NOT EXISTS video_height integer,
ADD COLUMN IF NOT EXISTS file_size bigint,
ADD COLUMN IF NOT EXISTS video_duration_seconds numeric,
ADD COLUMN IF NOT EXISTS audio_duration_seconds numeric;

-- Agregar comentarios para documentar los campos
COMMENT ON COLUMN content_uploads.video_width IS 'Ancho del video en píxeles';
COMMENT ON COLUMN content_uploads.video_height IS 'Alto del video en píxeles';
COMMENT ON COLUMN content_uploads.file_size IS 'Tamaño del archivo en bytes';
COMMENT ON COLUMN content_uploads.video_duration_seconds IS 'Duración del video en segundos';
COMMENT ON COLUMN content_uploads.audio_duration_seconds IS 'Duración del audio en segundos';

-- Crear índice para búsquedas por tipo de contenido
CREATE INDEX IF NOT EXISTS idx_content_uploads_content_type ON content_uploads(content_type);

-- Crear índice para búsquedas por estado
CREATE INDEX IF NOT EXISTS idx_content_uploads_status ON content_uploads(status);

-- Crear índice para búsquedas por uploader
CREATE INDEX IF NOT EXISTS idx_content_uploads_uploader_id ON content_uploads(uploader_id);