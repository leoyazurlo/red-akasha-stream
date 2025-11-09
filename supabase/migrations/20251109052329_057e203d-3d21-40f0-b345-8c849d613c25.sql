-- Eliminar la política demasiado permisiva
DROP POLICY IF EXISTS "Perfiles públicos visibles por todos" ON profile_details;

-- Crear política para que usuarios vean su propio perfil completo
CREATE POLICY "Usuarios pueden ver su propio perfil completo"
  ON profile_details FOR SELECT
  USING (auth.uid() = user_id);

-- Crear política para que admins vean todos los perfiles
CREATE POLICY "Admins pueden ver todos los perfiles"
  ON profile_details FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Crear vista pública que excluye información sensible (PII)
CREATE OR REPLACE VIEW public_profiles AS
  SELECT 
    id,
    user_id,
    display_name,
    bio,
    avatar_url,
    pais,
    ciudad,
    profile_type,
    instagram,
    facebook,
    linkedin,
    created_at,
    updated_at,
    genre,
    formation_date,
    members,
    produced_artists,
    recorded_at,
    technical_specs,
    venue_type,
    capacity,
    venues_produced,
    latitude,
    longitude,
    map_location
    -- Excluimos explícitamente: email, telefono, whatsapp, provincia
  FROM profile_details;

-- Dar permisos de lectura en la vista pública a todos
GRANT SELECT ON public_profiles TO anon, authenticated;

-- Comentar la vista para documentación
COMMENT ON VIEW public_profiles IS 'Vista pública de perfiles sin información personal sensible (email, teléfono, whatsapp)';