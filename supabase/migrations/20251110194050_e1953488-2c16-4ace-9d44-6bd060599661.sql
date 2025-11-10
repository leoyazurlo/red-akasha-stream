-- Crear tabla para comentarios de contenido
CREATE TABLE IF NOT EXISTS content_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES content_uploads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE content_comments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Cualquiera puede ver los comentarios
CREATE POLICY "Comentarios visibles por todos"
  ON content_comments
  FOR SELECT
  USING (true);

-- Los usuarios autenticados pueden crear comentarios
CREATE POLICY "Usuarios autenticados pueden comentar"
  ON content_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propios comentarios
CREATE POLICY "Usuarios pueden actualizar sus comentarios"
  ON content_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propios comentarios
CREATE POLICY "Usuarios pueden eliminar sus comentarios"
  ON content_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins pueden eliminar cualquier comentario
CREATE POLICY "Admins pueden eliminar comentarios"
  ON content_comments
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_content_comments_content_id ON content_comments(content_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_user_id ON content_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_content_comments_created_at ON content_comments(created_at DESC);

-- Agregar columna de comments_count a content_uploads
ALTER TABLE content_uploads 
ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;

-- Función para actualizar el contador de comentarios
CREATE OR REPLACE FUNCTION update_content_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE content_uploads
    SET comments_count = comments_count + 1
    WHERE id = NEW.content_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE content_uploads
    SET comments_count = GREATEST(comments_count - 1, 0)
    WHERE id = OLD.content_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger para actualizar automáticamente el contador
DROP TRIGGER IF EXISTS update_content_comments_count_trigger ON content_comments;
CREATE TRIGGER update_content_comments_count_trigger
  AFTER INSERT OR DELETE ON content_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_content_comments_count();

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_content_comments_updated_at ON content_comments;
CREATE TRIGGER update_content_comments_updated_at
  BEFORE UPDATE ON content_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar realtime para comentarios
ALTER TABLE content_comments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE content_comments;