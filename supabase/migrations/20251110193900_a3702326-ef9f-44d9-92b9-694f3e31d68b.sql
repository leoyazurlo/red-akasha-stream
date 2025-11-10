-- Crear tabla para likes/favoritos de contenido
CREATE TABLE IF NOT EXISTS content_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content_uploads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(content_id, user_id)
);

-- Habilitar RLS
ALTER TABLE content_likes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Cualquiera puede ver los likes
CREATE POLICY "Likes visibles por todos"
  ON content_likes
  FOR SELECT
  USING (true);

-- Los usuarios autenticados pueden dar like
CREATE POLICY "Usuarios pueden dar like"
  ON content_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden quitar su propio like
CREATE POLICY "Usuarios pueden quitar su like"
  ON content_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_content_likes_content_id ON content_likes(content_id);
CREATE INDEX IF NOT EXISTS idx_content_likes_user_id ON content_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_content_likes_user_content ON content_likes(user_id, content_id);

-- Agregar columna de likes_count a content_uploads para desnormalización
ALTER TABLE content_uploads 
ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;

-- Función para actualizar el contador de likes
CREATE OR REPLACE FUNCTION update_content_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE content_uploads
    SET likes_count = likes_count + 1
    WHERE id = NEW.content_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE content_uploads
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.content_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger para actualizar automáticamente el contador
DROP TRIGGER IF EXISTS update_content_likes_count_trigger ON content_likes;
CREATE TRIGGER update_content_likes_count_trigger
  AFTER INSERT OR DELETE ON content_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_content_likes_count();