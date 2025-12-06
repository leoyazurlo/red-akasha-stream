-- Create function to increment likes count
CREATE OR REPLACE FUNCTION public.increment_likes(content_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE content_uploads
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = content_id;
END;
$$;

-- Create function to decrement likes count
CREATE OR REPLACE FUNCTION public.decrement_likes(content_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE content_uploads
  SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
  WHERE id = content_id;
END;
$$;