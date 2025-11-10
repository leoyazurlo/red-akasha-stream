-- Agregar campos de organización a user_media_library
ALTER TABLE user_media_library
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS folder TEXT DEFAULT 'Sin categoría';

-- Crear índice para búsqueda por tags
CREATE INDEX IF NOT EXISTS idx_user_media_library_tags ON user_media_library USING GIN(tags);

-- Crear índice para búsqueda por folder
CREATE INDEX IF NOT EXISTS idx_user_media_library_folder ON user_media_library(folder);