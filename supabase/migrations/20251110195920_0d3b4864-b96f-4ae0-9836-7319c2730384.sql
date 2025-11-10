-- Crear tabla para biblioteca de medios del usuario
CREATE TABLE IF NOT EXISTS public.user_media_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('video', 'audio', 'image')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  duration_seconds NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_user_media_library_user ON public.user_media_library(user_id);
CREATE INDEX idx_user_media_library_type ON public.user_media_library(user_id, media_type);

-- Habilitar RLS
ALTER TABLE public.user_media_library ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: usuarios solo pueden ver y gestionar sus propios archivos
CREATE POLICY "Usuarios pueden ver su propia biblioteca"
  ON public.user_media_library
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden agregar a su biblioteca"
  ON public.user_media_library
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar de su biblioteca"
  ON public.user_media_library
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentarios
COMMENT ON TABLE public.user_media_library IS 'Biblioteca de archivos multimedia subidos por usuarios para reutilización';
COMMENT ON COLUMN public.user_media_library.media_type IS 'Tipo de medio: video, audio o image';