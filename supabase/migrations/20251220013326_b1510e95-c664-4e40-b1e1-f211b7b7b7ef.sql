-- Corregir la función notify_new_follower para usar solo username (sin email que no existe)
CREATE OR REPLACE FUNCTION public.notify_new_follower()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  follower_name TEXT;
BEGIN
  -- Obtener el nombre del seguidor (solo username, sin email)
  SELECT COALESCE(username, full_name, 'Usuario')
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
$function$;