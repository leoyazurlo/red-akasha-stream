-- Drop and recreate the public_profiles view to include whatsapp field
DROP VIEW IF EXISTS public_profiles;

CREATE VIEW public_profiles AS
SELECT 
  id,
  user_id,
  display_name,
  avatar_url,
  profile_type,
  pais,
  provincia,
  ciudad,
  bio,
  instagram,
  facebook,
  linkedin,
  whatsapp,
  created_at,
  updated_at
FROM profile_details;