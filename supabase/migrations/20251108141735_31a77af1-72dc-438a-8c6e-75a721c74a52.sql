-- Crear enum para tipos de artistas
CREATE TYPE artist_type AS ENUM (
  'banda_musical',
  'musico_solista',
  'podcast',
  'documental',
  'cortometraje',
  'fotografia',
  'radio_show'
);

-- Tabla principal de artistas
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  artist_type artist_type NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  city TEXT,
  country TEXT,
  instagram TEXT,
  facebook TEXT,
  linkedin TEXT,
  spotify_url TEXT,
  youtube_url TEXT,
  website TEXT,
  followers_count INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de seguidores
CREATE TABLE artist_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id, follower_id)
);

-- Tabla de valoraciones
CREATE TABLE artist_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id, user_id)
);

-- Habilitar RLS
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE artist_ratings ENABLE ROW LEVEL SECURITY;

-- Políticas para artists
CREATE POLICY "Artistas públicos visibles por todos"
  ON artists FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden crear su perfil de artista"
  ON artists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Artistas pueden actualizar su perfil"
  ON artists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Artistas pueden eliminar su perfil"
  ON artists FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para artist_followers
CREATE POLICY "Seguidores visibles por todos"
  ON artist_followers FOR SELECT
  USING (true);

CREATE POLICY "Usuarios autenticados pueden seguir artistas"
  ON artist_followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Usuarios pueden dejar de seguir"
  ON artist_followers FOR DELETE
  USING (auth.uid() = follower_id);

-- Políticas para artist_ratings
CREATE POLICY "Valoraciones visibles por todos"
  ON artist_ratings FOR SELECT
  USING (true);

CREATE POLICY "Usuarios autenticados pueden valorar"
  ON artist_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar su valoración"
  ON artist_ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar su valoración"
  ON artist_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- Función para actualizar contador de seguidores
CREATE OR REPLACE FUNCTION update_artist_followers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE artists 
    SET followers_count = followers_count + 1
    WHERE id = NEW.artist_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE artists 
    SET followers_count = GREATEST(followers_count - 1, 0)
    WHERE id = OLD.artist_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para contador de seguidores
CREATE TRIGGER artist_followers_count_trigger
AFTER INSERT OR DELETE ON artist_followers
FOR EACH ROW EXECUTE FUNCTION update_artist_followers_count();

-- Función para actualizar rating promedio
CREATE OR REPLACE FUNCTION update_artist_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE artists 
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM artist_ratings
      WHERE artist_id = COALESCE(NEW.artist_id, OLD.artist_id)
    ),
    total_votes = (
      SELECT COUNT(*)
      FROM artist_ratings
      WHERE artist_id = COALESCE(NEW.artist_id, OLD.artist_id)
    )
  WHERE id = COALESCE(NEW.artist_id, OLD.artist_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para rating
CREATE TRIGGER artist_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON artist_ratings
FOR EACH ROW EXECUTE FUNCTION update_artist_rating();

-- Trigger para updated_at en artists
CREATE TRIGGER update_artists_updated_at
BEFORE UPDATE ON artists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at en artist_ratings
CREATE TRIGGER update_artist_ratings_updated_at
BEFORE UPDATE ON artist_ratings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Índices para mejorar performance
CREATE INDEX idx_artists_type ON artists(artist_type);
CREATE INDEX idx_artists_followers_count ON artists(followers_count DESC);
CREATE INDEX idx_artists_rating ON artists(average_rating DESC);
CREATE INDEX idx_artist_followers_artist ON artist_followers(artist_id);
CREATE INDEX idx_artist_followers_user ON artist_followers(follower_id);
CREATE INDEX idx_artist_ratings_artist ON artist_ratings(artist_id);