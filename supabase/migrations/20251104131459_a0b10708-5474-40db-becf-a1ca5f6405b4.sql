-- Corregir funciones con search_path seguro

CREATE OR REPLACE FUNCTION generate_rtmp_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$;

CREATE OR REPLACE FUNCTION update_stream_peak_viewers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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