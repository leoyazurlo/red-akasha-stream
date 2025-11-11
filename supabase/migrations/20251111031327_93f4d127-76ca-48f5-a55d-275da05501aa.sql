-- Crear tabla para videos de YouTube configurados por administradores
CREATE TABLE youtube_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  youtube_id TEXT NOT NULL,
  thumbnail TEXT,
  duration TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('programas', 'shorts', 'destacados')),
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para búsqueda rápida por categoría
CREATE INDEX idx_youtube_videos_category ON youtube_videos(category);
CREATE INDEX idx_youtube_videos_active ON youtube_videos(is_active);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_youtube_videos_updated_at
  BEFORE UPDATE ON youtube_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;

-- Todos pueden ver videos activos
CREATE POLICY "Videos activos visibles por todos"
  ON youtube_videos
  FOR SELECT
  USING (is_active = true);

-- Admins pueden ver todos los videos
CREATE POLICY "Admins pueden ver todos los videos"
  ON youtube_videos
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Solo admins pueden insertar videos
CREATE POLICY "Solo admins pueden insertar videos"
  ON youtube_videos
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Solo admins pueden actualizar videos
CREATE POLICY "Solo admins pueden actualizar videos"
  ON youtube_videos
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Solo admins pueden eliminar videos
CREATE POLICY "Solo admins pueden eliminar videos"
  ON youtube_videos
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insertar videos de ejemplo
INSERT INTO youtube_videos (title, youtube_id, thumbnail, duration, category, order_index) VALUES
('Arte Urbano: Nuevas Expresiones', 'dQw4w9WgXcQ', 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg', '45:30', 'programas', 0),
('Entrevista con Productores Emergentes', '9bZkp7q19f0', 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg', '38:15', 'programas', 1),
('Espacios Creativos: Estudios de Grabación', 'kJQP7kiw5Fk', 'https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg', '52:40', 'programas', 2),
('Tips de Producción: Ecualización', '3tmd-ClpJxA', 'https://img.youtube.com/vi/3tmd-ClpJxA/maxresdefault.jpg', '3:45', 'shorts', 0),
('Detrás de Cámaras: Sesión Fotográfica', 'YQHsXMglC9A', 'https://img.youtube.com/vi/YQHsXMglC9A/maxresdefault.jpg', '2:30', 'shorts', 1),
('Setup de Estudio en Casa', 'LXb3EKWsInQ', 'https://img.youtube.com/vi/LXb3EKWsInQ/maxresdefault.jpg', '4:15', 'shorts', 2),
('Concierto Acústico: Sala Íntima', 'OPf0YbXqDm0', 'https://img.youtube.com/vi/OPf0YbXqDm0/maxresdefault.jpg', '1:15:30', 'destacados', 0),
('Festival Red Akasha 2024', 'hTWKbfoikeg', 'https://img.youtube.com/vi/hTWKbfoikeg/maxresdefault.jpg', '2:30:45', 'destacados', 1),
('Documental: La Escena Underground', 'djV11Xbc914', 'https://img.youtube.com/vi/djV11Xbc914/maxresdefault.jpg', '58:20', 'destacados', 2);