-- Recrear la vista sin SECURITY DEFINER
DROP VIEW IF EXISTS public_profiles;

CREATE VIEW public_profiles 
WITH (security_invoker = true)
AS
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
  FROM profile_details;

-- Dar permisos de lectura en la vista pública a todos
GRANT SELECT ON public_profiles TO anon, authenticated;

COMMENT ON VIEW public_profiles IS 'Vista pública de perfiles sin información personal sensible (email, teléfono, whatsapp)';