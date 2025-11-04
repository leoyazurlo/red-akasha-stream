-- Crear tipos enumerados para los diferentes tipos de perfiles y contenido
CREATE TYPE profile_type AS ENUM (
  'disfruto_musica',
  'productor_artistico',
  'estudio_grabacion',
  'promotor_artistico',
  'sala_concierto',
  'agrupacion_musical'
);

CREATE TYPE content_type AS ENUM (
  'video_musical_vivo',
  'video_clip',
  'podcast',
  'documental',
  'corto',
  'pelicula'
);

CREATE TYPE podcast_category AS ENUM (
  'produccion',
  'marketing_digital',
  'derecho_autor',
  'management',
  'composicion'
);

CREATE TYPE sala_type AS ENUM (
  'teatro',
  'auditorio',
  'discoteque',
  'club',
  'bar',
  'anfiteatro'
);

CREATE TYPE music_genre AS ENUM (
  'rock', 'pop', 'jazz', 'blues', 'reggae', 'hip_hop', 'rap', 
  'electronica', 'house', 'techno', 'trance', 'country', 'folk', 
  'soul', 'funk', 'rnb', 'metal', 'punk', 'ska', 'clasica', 
  'opera', 'flamenco', 'tango', 'salsa', 'merengue', 'cumbia', 
  'bachata', 'kpop', 'jpop', 'andina', 'celta', 'gospel', 
  'arabe', 'africana', 'india'
);

-- Tabla para detalles específicos de perfiles
CREATE TABLE public.profile_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  profile_type profile_type NOT NULL,
  
  -- Campos comunes
  display_name TEXT NOT NULL,
  bio TEXT,
  pais TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  instagram TEXT,
  facebook TEXT,
  linkedin TEXT,
  email TEXT,
  telefono TEXT,
  whatsapp TEXT,
  
  -- Estudio de grabación
  technical_specs JSONB,
  map_location TEXT,
  
  -- Sala de concierto
  venue_type sala_type,
  capacity INTEGER,
  
  -- Agrupación musical
  genre music_genre,
  formation_date DATE,
  members JSONB, -- Array de {nombre, apellido, instrumento}
  producer_instagram TEXT,
  recorded_at TEXT,
  
  -- Productor artístico
  produced_artists JSONB, -- Array de artistas producidos
  
  -- Promotor artístico
  venues_produced JSONB, -- Array de salas donde produce
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, profile_type)
);

-- Tabla para galerías (fotos y videos)
CREATE TABLE public.profile_galleries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profile_details(id) ON DELETE CASCADE NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para playlist de audio
CREATE TABLE public.audio_playlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profile_details(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration INTEGER, -- en segundos
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para contenido subido (videos, podcasts, etc.)
CREATE TABLE public.content_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uploader_id UUID REFERENCES auth.users(id) NOT NULL,
  content_type content_type NOT NULL,
  
  -- Campos generales
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  
  -- Podcast específico
  podcast_category podcast_category,
  audio_url TEXT,
  duration INTEGER, -- en segundos
  
  -- Ficha técnica
  band_name TEXT,
  producer_name TEXT,
  recording_studio TEXT,
  venue_name TEXT,
  promoter_name TEXT,
  
  tags TEXT[],
  views_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_profile_details_user_id ON public.profile_details(user_id);
CREATE INDEX idx_profile_details_type ON public.profile_details(profile_type);
CREATE INDEX idx_profile_galleries_profile_id ON public.profile_galleries(profile_id);
CREATE INDEX idx_audio_playlist_profile_id ON public.audio_playlist(profile_id);
CREATE INDEX idx_content_uploads_uploader ON public.content_uploads(uploader_id);
CREATE INDEX idx_content_uploads_type ON public.content_uploads(content_type);
CREATE INDEX idx_content_uploads_status ON public.content_uploads(status);

-- Trigger para updated_at
CREATE TRIGGER update_profile_details_updated_at
  BEFORE UPDATE ON public.profile_details
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_uploads_updated_at
  BEFORE UPDATE ON public.content_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies para profile_details
ALTER TABLE public.profile_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfiles públicos visibles por todos"
  ON public.profile_details FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden crear su perfil"
  ON public.profile_details FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar su perfil"
  ON public.profile_details FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar su perfil"
  ON public.profile_details FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies para profile_galleries
ALTER TABLE public.profile_galleries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Galerías visibles por todos"
  ON public.profile_galleries FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden agregar a su galería"
  ON public.profile_galleries FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profile_details
      WHERE id = profile_galleries.profile_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden actualizar su galería"
  ON public.profile_galleries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_details
      WHERE id = profile_galleries.profile_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden eliminar de su galería"
  ON public.profile_galleries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_details
      WHERE id = profile_galleries.profile_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies para audio_playlist
ALTER TABLE public.audio_playlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Playlist visible por todos"
  ON public.audio_playlist FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden agregar a su playlist"
  ON public.audio_playlist FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profile_details
      WHERE id = audio_playlist.profile_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden actualizar su playlist"
  ON public.audio_playlist FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_details
      WHERE id = audio_playlist.profile_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden eliminar de su playlist"
  ON public.audio_playlist FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profile_details
      WHERE id = audio_playlist.profile_id
      AND user_id = auth.uid()
    )
  );

-- RLS Policies para content_uploads
ALTER TABLE public.content_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contenido aprobado visible por todos"
  ON public.content_uploads FOR SELECT
  USING (status = 'approved' OR auth.uid() = uploader_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuarios autenticados pueden subir contenido"
  ON public.content_uploads FOR INSERT
  WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY "Usuarios pueden actualizar su contenido"
  ON public.content_uploads FOR UPDATE
  USING (auth.uid() = uploader_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Usuarios pueden eliminar su contenido"
  ON public.content_uploads FOR DELETE
  USING (auth.uid() = uploader_id OR has_role(auth.uid(), 'admin'::app_role));