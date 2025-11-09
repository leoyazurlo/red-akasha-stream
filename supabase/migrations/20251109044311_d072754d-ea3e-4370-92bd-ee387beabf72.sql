-- Crear función para extraer menciones de un texto
CREATE OR REPLACE FUNCTION extract_mentions(content_text TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  mentions TEXT[];
BEGIN
  -- Extraer todos los @username del texto
  SELECT array_agg(DISTINCT lower(trim(both '@' from match[1])))
  INTO mentions
  FROM regexp_matches(content_text, '@([a-zA-Z0-9_]+)', 'g') AS match;
  
  RETURN COALESCE(mentions, ARRAY[]::TEXT[]);
END;
$$;

-- Función para crear notificaciones de menciones en hilos
CREATE OR REPLACE FUNCTION notify_thread_mentions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentioned_username TEXT;
  mentioned_user_id UUID;
  author_name TEXT;
  mentions TEXT[];
BEGIN
  -- Obtener nombre del autor
  SELECT COALESCE(username, email)
  INTO author_name
  FROM profiles
  WHERE id = NEW.author_id;
  
  -- Extraer menciones del contenido
  mentions := extract_mentions(NEW.content);
  
  -- Para cada mención, crear notificación
  FOREACH mentioned_username IN ARRAY mentions
  LOOP
    -- Buscar el usuario mencionado
    SELECT id INTO mentioned_user_id
    FROM profiles
    WHERE lower(username) = mentioned_username
    AND id != NEW.author_id; -- No notificar al autor
    
    -- Si existe el usuario, crear notificación
    IF mentioned_user_id IS NOT NULL THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link,
        related_user_id,
        related_thread_id
      ) VALUES (
        mentioned_user_id,
        'mention_thread',
        'Te mencionaron en un hilo',
        author_name || ' te mencionó en: ' || NEW.title,
        '/hilo/' || NEW.id,
        NEW.author_id,
        NEW.id
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Función para crear notificaciones de menciones en posts
CREATE OR REPLACE FUNCTION notify_post_mentions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mentioned_username TEXT;
  mentioned_user_id UUID;
  author_name TEXT;
  thread_title TEXT;
  mentions TEXT[];
BEGIN
  -- Obtener nombre del autor
  SELECT COALESCE(username, email)
  INTO author_name
  FROM profiles
  WHERE id = NEW.author_id;
  
  -- Obtener título del hilo
  SELECT title INTO thread_title
  FROM forum_threads
  WHERE id = NEW.thread_id;
  
  -- Extraer menciones del contenido
  mentions := extract_mentions(NEW.content);
  
  -- Para cada mención, crear notificación
  FOREACH mentioned_username IN ARRAY mentions
  LOOP
    -- Buscar el usuario mencionado
    SELECT id INTO mentioned_user_id
    FROM profiles
    WHERE lower(username) = mentioned_username
    AND id != NEW.author_id; -- No notificar al autor
    
    -- Si existe el usuario, crear notificación
    IF mentioned_user_id IS NOT NULL THEN
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link,
        related_user_id,
        related_post_id,
        related_thread_id
      ) VALUES (
        mentioned_user_id,
        'mention_post',
        'Te mencionaron en un comentario',
        author_name || ' te mencionó en: ' || thread_title,
        '/hilo/' || NEW.thread_id,
        NEW.author_id,
        NEW.id,
        NEW.thread_id
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger para menciones en hilos
CREATE TRIGGER on_thread_mention
  AFTER INSERT OR UPDATE OF content ON public.forum_threads
  FOR EACH ROW
  EXECUTE FUNCTION notify_thread_mentions();

-- Trigger para menciones en posts
CREATE TRIGGER on_post_mention
  AFTER INSERT OR UPDATE OF content ON public.forum_posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_mentions();