-- Drop the existing public_profiles view and recreate without sensitive PII
DROP VIEW IF EXISTS public_profiles;

-- Recreate the view WITHOUT email, telefono, whatsapp (sensitive PII)
CREATE VIEW public_profiles AS
  SELECT 
    id,
    user_id,
    display_name,
    bio,
    avatar_url,
    pais,
    ciudad,
    provincia,
    profile_type,
    instagram,
    facebook,
    linkedin,
    created_at,
    updated_at
    -- Explicitly excluded: email, telefono, whatsapp, latitude, longitude, map_location
  FROM profile_details;

-- Grant access to the view
GRANT SELECT ON public_profiles TO anon, authenticated;

-- Now update the RLS policy on profile_details to be more restrictive
DROP POLICY IF EXISTS "Perfiles públicos visibles por todos" ON profile_details;

-- Only allow users to see their own full profile or admins to see all
CREATE POLICY "Users can see their own profile details"
  ON profile_details FOR SELECT
  USING (
    auth.uid() = user_id
    OR has_role(auth.uid(), 'admin')
  );
