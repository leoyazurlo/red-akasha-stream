-- Tipos enumerados para streaming
CREATE TYPE stream_status AS ENUM ('scheduled', 'live', 'ended', 'cancelled');
CREATE TYPE stream_quality AS ENUM ('source', '1080p', '720p', '480p', '360p', 'audio_only');
CREATE TYPE vod_status AS ENUM ('processing', 'ready', 'failed', 'archived');
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium', 'enterprise');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- =====================================================
-- TABLA: Streams (Transmisiones en vivo)
-- =====================================================
CREATE TABLE streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) <= 200),
  description text CHECK (char_length(description) <= 2000),
  streamer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Configuración técnica
  rtmp_key text UNIQUE,
  stream_key_expires_at timestamptz,
  ingest_url text,
  playback_url text,
  
  -- Estado y metadata
  status stream_status DEFAULT 'scheduled',
  scheduled_start_time timestamptz,
  actual_start_time timestamptz,
  end_time timestamptz,
  
  -- Configuración de calidad
  enable_recording boolean DEFAULT true,
  enable_transcoding boolean DEFAULT true,
  enable_chat boolean DEFAULT true,
  
  -- Categorización
  category text,
  tags text[],
  thumbnail_url text,
  
  -- Analytics
  peak_viewers integer DEFAULT 0,
  total_views integer DEFAULT 0,
  average_watch_time interval,
  
  -- Monetización
  is_paid_event boolean DEFAULT false,
  ticket_price decimal(10, 2),
  enable_donations boolean DEFAULT true,
  
  -- Social
  auto_post_to_social boolean DEFAULT false,
  social_platforms text[],
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLA: VOD Videos
-- =====================================================
CREATE TABLE vod_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) <= 200),
  description text CHECK (char_length(description) <= 5000),
  uploader_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Archivo fuente
  source_file_url text,
  source_file_size bigint,
  duration interval,
  
  -- Archivos procesados
  status vod_status DEFAULT 'processing',
  hls_manifest_url text,
  dash_manifest_url text,
  thumbnail_url text,
  preview_url text,
  
  -- Metadata
  series_name text,
  season_number integer,
  episode_number integer,
  release_date date,
  
  -- Categorización
  category text,
  tags text[],
  language text,
  
  -- Subtítulos y audio
  subtitle_tracks jsonb DEFAULT '[]'::jsonb,
  audio_tracks jsonb DEFAULT '[]'::jsonb,
  
  -- Analytics
  total_views integer DEFAULT 0,
  average_rating decimal(3, 2),
  total_ratings integer DEFAULT 0,
  
  -- Monetización
  is_premium boolean DEFAULT false,
  price decimal(10, 2),
  
  -- SEO
  seo_title text CHECK (char_length(seo_title) <= 60),
  seo_description text CHECK (char_length(seo_description) <= 160),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLA: Podcast Episodes
-- =====================================================
CREATE TABLE podcast_episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) <= 200),
  description text CHECK (char_length(description) <= 4000),
  creator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Podcast info
  podcast_name text NOT NULL,
  episode_number integer,
  season_number integer,
  
  -- Archivos
  audio_file_url text NOT NULL,
  audio_file_size bigint,
  duration interval,
  
  -- RSS y distribución
  guid text UNIQUE,
  published_at timestamptz,
  apple_podcasts_url text,
  spotify_url text,
  google_podcasts_url text,
  
  -- Transcripción
  transcript_text text,
  transcript_url text,
  transcript_status text DEFAULT 'pending',
  
  -- Chapters
  chapters jsonb DEFAULT '[]'::jsonb,
  
  -- Metadata
  explicit_content boolean DEFAULT false,
  tags text[],
  category text,
  
  -- Analytics
  download_count integer DEFAULT 0,
  play_count integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLA: Stream Schedule (Programación)
-- =====================================================
CREATE TABLE stream_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid REFERENCES streams(id) ON DELETE CASCADE,
  streamer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  title text NOT NULL CHECK (char_length(title) <= 200),
  description text CHECK (char_length(description) <= 1000),
  
  scheduled_start timestamptz NOT NULL,
  estimated_duration interval,
  
  -- Repetición
  is_recurring boolean DEFAULT false,
  recurrence_rule text,
  
  -- Notificaciones
  send_notifications boolean DEFAULT true,
  notification_sent boolean DEFAULT false,
  
  -- Assets
  thumbnail_url text,
  overlay_config jsonb,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLA: Quality Presets
-- =====================================================
CREATE TABLE stream_quality_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Configuración de video
  video_bitrate integer NOT NULL,
  video_codec text DEFAULT 'h264',
  resolution_width integer NOT NULL,
  resolution_height integer NOT NULL,
  framerate integer DEFAULT 30,
  
  -- Configuración de audio
  audio_bitrate integer NOT NULL,
  audio_codec text DEFAULT 'aac',
  audio_sample_rate integer DEFAULT 44100,
  
  -- Opciones avanzadas
  keyframe_interval integer DEFAULT 2,
  profile text DEFAULT 'main',
  
  is_default boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLA: Viewer Analytics
-- =====================================================
CREATE TABLE viewer_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencia (puede ser stream o VOD)
  stream_id uuid REFERENCES streams(id) ON DELETE CASCADE,
  vod_id uuid REFERENCES vod_videos(id) ON DELETE CASCADE,
  
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Sesión
  session_id uuid NOT NULL,
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  watch_duration interval,
  
  -- Calidad y rendimiento
  quality_level stream_quality,
  buffer_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  average_bitrate integer,
  
  -- Ubicación (anonimizada)
  country_code text,
  city text,
  
  -- Dispositivo
  device_type text,
  browser text,
  os text,
  
  created_at timestamptz DEFAULT now(),
  
  CHECK (stream_id IS NOT NULL OR vod_id IS NOT NULL)
);

-- =====================================================
-- TABLA: Subscriptions
-- =====================================================
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  tier subscription_tier DEFAULT 'free',
  
  -- Stripe
  stripe_customer_id text,
  stripe_subscription_id text,
  
  -- Estado
  is_active boolean DEFAULT false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  
  -- Límites del tier
  max_concurrent_viewers integer,
  max_storage_gb integer,
  max_streaming_hours integer,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLA: Donations
-- =====================================================
CREATE TABLE donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid REFERENCES streams(id) ON DELETE CASCADE NOT NULL,
  donor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  amount decimal(10, 2) NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'USD',
  
  message text CHECK (char_length(message) <= 500),
  display_name text,
  is_anonymous boolean DEFAULT false,
  
  -- Stripe
  stripe_payment_intent_id text,
  payment_status payment_status DEFAULT 'pending',
  
  -- Mostrar en stream
  show_on_stream boolean DEFAULT true,
  shown_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLA: Chat Messages
-- =====================================================
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid REFERENCES streams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  message text NOT NULL CHECK (char_length(message) <= 500),
  
  -- Moderación
  is_deleted boolean DEFAULT false,
  deleted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at timestamptz,
  
  -- Metadata
  is_moderator_message boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- TABLA: Stream Overlays
-- =====================================================
CREATE TABLE stream_overlays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  name text NOT NULL CHECK (char_length(name) <= 100),
  
  -- Configuración
  overlay_type text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Assets
  image_url text,
  css_styles text,
  
  is_active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX idx_streams_streamer ON streams(streamer_id);
CREATE INDEX idx_streams_status ON streams(status);
CREATE INDEX idx_streams_scheduled ON streams(scheduled_start_time);

CREATE INDEX idx_vod_uploader ON vod_videos(uploader_id);
CREATE INDEX idx_vod_status ON vod_videos(status);
CREATE INDEX idx_vod_series ON vod_videos(series_name, season_number, episode_number);

CREATE INDEX idx_podcast_creator ON podcast_episodes(creator_id);
CREATE INDEX idx_podcast_name ON podcast_episodes(podcast_name);

CREATE INDEX idx_analytics_stream ON viewer_analytics(stream_id);
CREATE INDEX idx_analytics_vod ON viewer_analytics(vod_id);
CREATE INDEX idx_analytics_viewer ON viewer_analytics(viewer_id);

CREATE INDEX idx_chat_stream ON chat_messages(stream_id, created_at);
CREATE INDEX idx_chat_user ON chat_messages(user_id);

-- =====================================================
-- TRIGGERS para updated_at
-- =====================================================
CREATE TRIGGER update_streams_updated_at
  BEFORE UPDATE ON streams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vod_updated_at
  BEFORE UPDATE ON vod_videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_podcast_updated_at
  BEFORE UPDATE ON podcast_episodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedule_updated_at
  BEFORE UPDATE ON stream_schedule
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_overlays_updated_at
  BEFORE UPDATE ON stream_overlays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- STREAMS
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Streams públicos visibles por todos"
  ON streams FOR SELECT
  USING (status = 'live' OR status = 'ended');

CREATE POLICY "Streamers pueden ver sus propios streams"
  ON streams FOR SELECT
  USING (auth.uid() = streamer_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Streamers pueden crear streams"
  ON streams FOR INSERT
  WITH CHECK (auth.uid() = streamer_id AND (has_role(auth.uid(), 'streamer') OR has_role(auth.uid(), 'producer') OR has_role(auth.uid(), 'admin')));

CREATE POLICY "Streamers pueden actualizar sus streams"
  ON streams FOR UPDATE
  USING (auth.uid() = streamer_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden eliminar streams"
  ON streams FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- VOD VIDEOS
ALTER TABLE vod_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "VOD públicos visibles por todos"
  ON vod_videos FOR SELECT
  USING (status = 'ready' AND (NOT is_premium OR auth.uid() IS NOT NULL));

CREATE POLICY "Uploaders pueden ver sus videos"
  ON vod_videos FOR SELECT
  USING (auth.uid() = uploader_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Productores pueden subir videos"
  ON vod_videos FOR INSERT
  WITH CHECK (auth.uid() = uploader_id AND (has_role(auth.uid(), 'producer') OR has_role(auth.uid(), 'admin')));

CREATE POLICY "Uploaders pueden actualizar sus videos"
  ON vod_videos FOR UPDATE
  USING (auth.uid() = uploader_id OR has_role(auth.uid(), 'admin'));

-- PODCAST EPISODES
ALTER TABLE podcast_episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Podcasts visibles por todos"
  ON podcast_episodes FOR SELECT
  USING (published_at IS NOT NULL AND published_at <= now());

CREATE POLICY "Creadores pueden ver sus episodios"
  ON podcast_episodes FOR SELECT
  USING (auth.uid() = creator_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Productores pueden crear episodios"
  ON podcast_episodes FOR INSERT
  WITH CHECK (auth.uid() = creator_id AND (has_role(auth.uid(), 'producer') OR has_role(auth.uid(), 'admin')));

CREATE POLICY "Creadores pueden actualizar sus episodios"
  ON podcast_episodes FOR UPDATE
  USING (auth.uid() = creator_id OR has_role(auth.uid(), 'admin'));

-- STREAM SCHEDULE
ALTER TABLE stream_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Horarios visibles por todos"
  ON stream_schedule FOR SELECT
  USING (true);

CREATE POLICY "Streamers pueden crear horarios"
  ON stream_schedule FOR INSERT
  WITH CHECK (auth.uid() = streamer_id AND (has_role(auth.uid(), 'streamer') OR has_role(auth.uid(), 'producer') OR has_role(auth.uid(), 'admin')));

CREATE POLICY "Streamers pueden actualizar sus horarios"
  ON stream_schedule FOR UPDATE
  USING (auth.uid() = streamer_id OR has_role(auth.uid(), 'admin'));

-- VIEWER ANALYTICS
ALTER TABLE viewer_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Solo creadores y admins ven analytics"
  ON viewer_analytics FOR SELECT
  USING (
    has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM streams WHERE streams.id = viewer_analytics.stream_id AND streams.streamer_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM vod_videos WHERE vod_videos.id = viewer_analytics.vod_id AND vod_videos.uploader_id = auth.uid())
  );

CREATE POLICY "Sistema puede insertar analytics"
  ON viewer_analytics FOR INSERT
  WITH CHECK (true);

-- SUBSCRIPTIONS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven su propia suscripción"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuarios pueden crear su suscripción"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar su suscripción"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- DONATIONS
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donaciones visibles para el streamer"
  ON donations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM streams WHERE streams.id = donations.stream_id AND streams.streamer_id = auth.uid()) OR
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Usuarios autenticados pueden donar"
  ON donations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- CHAT MESSAGES
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chat visible para espectadores del stream"
  ON chat_messages FOR SELECT
  USING (NOT is_deleted);

CREATE POLICY "Usuarios autenticados pueden enviar mensajes"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Moderadores pueden eliminar mensajes"
  ON chat_messages FOR UPDATE
  USING (has_role(auth.uid(), 'moderator') OR has_role(auth.uid(), 'admin'));

-- STREAM OVERLAYS
ALTER TABLE stream_overlays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus propios overlays"
  ON stream_overlays FOR SELECT
  USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Streamers pueden crear overlays"
  ON stream_overlays FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND (has_role(auth.uid(), 'streamer') OR has_role(auth.uid(), 'producer') OR has_role(auth.uid(), 'admin')));

CREATE POLICY "Usuarios pueden actualizar sus overlays"
  ON stream_overlays FOR UPDATE
  USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'));

-- QUALITY PRESETS
ALTER TABLE stream_quality_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven sus presets"
  ON stream_quality_presets FOR SELECT
  USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Streamers pueden crear presets"
  ON stream_quality_presets FOR INSERT
  WITH CHECK (auth.uid() = owner_id AND (has_role(auth.uid(), 'streamer') OR has_role(auth.uid(), 'producer') OR has_role(auth.uid(), 'admin')));

CREATE POLICY "Usuarios pueden actualizar sus presets"
  ON stream_quality_presets FOR UPDATE
  USING (auth.uid() = owner_id);

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Generar RTMP key única
CREATE OR REPLACE FUNCTION generate_rtmp_key()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$;

-- Actualizar peak viewers automáticamente
CREATE OR REPLACE FUNCTION update_stream_peak_viewers()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  current_viewers integer;
BEGIN
  SELECT COUNT(*) INTO current_viewers
  FROM viewer_analytics
  WHERE stream_id = NEW.stream_id
    AND left_at IS NULL;
  
  UPDATE streams
  SET peak_viewers = GREATEST(peak_viewers, current_viewers)
  WHERE id = NEW.stream_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_peak_viewers_on_join
  AFTER INSERT ON viewer_analytics
  FOR EACH ROW
  WHEN (NEW.stream_id IS NOT NULL)
  EXECUTE FUNCTION update_stream_peak_viewers();