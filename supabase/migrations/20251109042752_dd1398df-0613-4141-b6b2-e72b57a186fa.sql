-- Función para otorgar el badge de bienvenida cuando se crea un perfil
CREATE OR REPLACE FUNCTION grant_welcome_badge()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Otorgar badge de bienvenida
  PERFORM award_badge_if_eligible(NEW.id, 'Bienvenido');
  
  RETURN NEW;
END;
$$;

-- Trigger para otorgar badge de bienvenida
DROP TRIGGER IF EXISTS trigger_grant_welcome_badge ON profiles;
CREATE TRIGGER trigger_grant_welcome_badge
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION grant_welcome_badge();