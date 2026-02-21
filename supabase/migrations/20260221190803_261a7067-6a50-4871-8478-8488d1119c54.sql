
-- Function to notify followers when a user uploads new content
CREATE OR REPLACE FUNCTION public.notify_followers_new_content()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  uploader_name TEXT;
  content_title TEXT;
  follower RECORD;
BEGIN
  -- Only notify for approved content
  IF NEW.status IS NOT NULL AND NEW.status != 'approved' THEN
    RETURN NEW;
  END IF;

  -- Get uploader display name
  SELECT COALESCE(p.full_name, p.username, 'Un usuario')
  INTO uploader_name
  FROM profiles p
  WHERE p.id = NEW.uploader_id;

  content_title := COALESCE(NEW.title, 'Nuevo contenido');

  -- Notify all followers
  INSERT INTO notifications (user_id, type, title, message, link, related_user_id)
  SELECT
    uf.follower_id,
    'new_content',
    '🎬 Nuevo contenido de ' || uploader_name,
    uploader_name || ' subió: ' || content_title,
    '/video/' || NEW.id,
    NEW.uploader_id
  FROM user_follows uf
  WHERE uf.following_id = NEW.uploader_id;

  RETURN NEW;
END;
$$;

-- Create trigger on content_uploads
CREATE TRIGGER notify_followers_on_new_content
AFTER INSERT ON public.content_uploads
FOR EACH ROW
EXECUTE FUNCTION public.notify_followers_new_content();
