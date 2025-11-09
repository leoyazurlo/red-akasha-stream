-- Arreglar función extract_mentions con search_path
CREATE OR REPLACE FUNCTION extract_mentions(content_text TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
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