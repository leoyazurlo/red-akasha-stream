-- Crear tabla para historial de reproducciones
CREATE TABLE public.playback_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content_uploads(id) ON DELETE CASCADE,
  last_position INTEGER NOT NULL DEFAULT 0, -- Posición en segundos
  duration INTEGER, -- Duración total en segundos
  completed BOOLEAN NOT NULL DEFAULT false, -- Si terminó de ver el contenido
  last_watched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, content_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_playback_history_user_id ON public.playback_history(user_id);
CREATE INDEX idx_playback_history_content_id ON public.playback_history(content_id);
CREATE INDEX idx_playback_history_last_watched ON public.playback_history(last_watched_at DESC);

-- Habilitar RLS
ALTER TABLE public.playback_history ENABLE ROW LEVEL SECURITY;

-- Política para que usuarios vean solo su propio historial
CREATE POLICY "Usuarios pueden ver su propio historial"
  ON public.playback_history FOR SELECT
  USING (auth.uid() = user_id);

-- Política para que usuarios inserten en su propio historial
CREATE POLICY "Usuarios pueden crear su historial"
  ON public.playback_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para que usuarios actualicen su propio historial
CREATE POLICY "Usuarios pueden actualizar su historial"
  ON public.playback_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Política para que usuarios eliminen su propio historial
CREATE POLICY "Usuarios pueden eliminar su historial"
  ON public.playback_history FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_playback_history_updated_at
  BEFORE UPDATE ON public.playback_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE public.playback_history IS 'Historial de reproducciones de contenido para usuarios';
COMMENT ON COLUMN public.playback_history.last_position IS 'Última posición de reproducción en segundos';
COMMENT ON COLUMN public.playback_history.completed IS 'Indica si el usuario completó la reproducción del contenido';