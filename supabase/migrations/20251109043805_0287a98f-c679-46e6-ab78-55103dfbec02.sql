-- Crear tabla de seguidores
CREATE TABLE public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);

-- Habilitar RLS
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_follows
CREATE POLICY "Usuarios pueden ver seguidores"
  ON public.user_follows FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden seguir a otros"
  ON public.user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Usuarios pueden dejar de seguir"
  ON public.user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Crear tabla de notificaciones
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  related_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  related_thread_id UUID REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  related_post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE
);

-- Índices para notificaciones
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notificaciones
CREATE POLICY "Usuarios pueden ver sus propias notificaciones"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Sistema puede crear notificaciones"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar sus notificaciones"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus notificaciones"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Función para crear notificación cuando alguien te sigue
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_name TEXT;
BEGIN
  -- Obtener el nombre del seguidor
  SELECT COALESCE(username, email)
  INTO follower_name
  FROM profiles
  WHERE id = NEW.follower_id;

  -- Crear notificación para el usuario seguido
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    link,
    related_user_id
  ) VALUES (
    NEW.following_id,
    'new_follower',
    'Nuevo seguidor',
    follower_name || ' ha comenzado a seguirte',
    '/perfil/' || NEW.follower_id,
    NEW.follower_id
  );

  RETURN NEW;
END;
$$;

-- Trigger para notificar nuevo seguidor
CREATE TRIGGER on_new_follower
  AFTER INSERT ON public.user_follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_follower();

-- Habilitar realtime para notificaciones
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;