-- Agregar campos para thumbnails en múltiples tamaños (solo columnas)
ALTER TABLE user_media_library
ADD COLUMN IF NOT EXISTS thumbnail_small TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_medium TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_large TEXT;

-- Actualizar tabla content_uploads para soportar múltiples thumbnails
ALTER TABLE content_uploads
ADD COLUMN IF NOT EXISTS thumbnail_small TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_medium TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_large TEXT;