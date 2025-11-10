-- Agregar campos para thumbnails en múltiples tamaños
ALTER TABLE user_media_library
ADD COLUMN IF NOT EXISTS thumbnail_small TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_medium TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_large TEXT;

-- Actualizar tabla content_uploads para soportar múltiples thumbnails
ALTER TABLE content_uploads
ADD COLUMN IF NOT EXISTS thumbnail_small TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_medium TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_large TEXT;

-- Agregar constraints para los nuevos campos de thumbnails
ALTER TABLE user_media_library
ADD CONSTRAINT check_thumbnail_small_format 
  CHECK (thumbnail_small IS NULL OR (
    thumbnail_small ~* '^https?://' AND
    thumbnail_small !~* '^https?://(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)'
  )),
ADD CONSTRAINT check_thumbnail_medium_format 
  CHECK (thumbnail_medium IS NULL OR (
    thumbnail_medium ~* '^https?://' AND
    thumbnail_medium !~* '^https?://(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)'
  )),
ADD CONSTRAINT check_thumbnail_large_format 
  CHECK (thumbnail_large IS NULL OR (
    thumbnail_large ~* '^https?://' AND
    thumbnail_large !~* '^https?://(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)'
  ));

ALTER TABLE content_uploads
ADD CONSTRAINT check_thumbnail_small_format_uploads 
  CHECK (thumbnail_small IS NULL OR (
    thumbnail_small ~* '^https?://' AND
    thumbnail_small !~* '^https?://(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)'
  )),
ADD CONSTRAINT check_thumbnail_medium_format_uploads 
  CHECK (thumbnail_medium IS NULL OR (
    thumbnail_medium ~* '^https?://' AND
    thumbnail_medium !~* '^https?://(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)'
  )),
ADD CONSTRAINT check_thumbnail_large_format_uploads 
  CHECK (thumbnail_large IS NULL OR (
    thumbnail_large ~* '^https?://' AND
    thumbnail_large !~* '^https?://(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)'
  ));