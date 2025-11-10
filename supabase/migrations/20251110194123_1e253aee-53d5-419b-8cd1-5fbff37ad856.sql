-- Corregir función update_updated_at_column con search_path
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recrear trigger con la función corregida
DROP TRIGGER IF EXISTS update_content_comments_updated_at ON content_comments;
CREATE TRIGGER update_content_comments_updated_at
  BEFORE UPDATE ON content_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();