-- Fix the security definer view warning by using SECURITY INVOKER
DROP VIEW IF EXISTS public_profiles;

-- Recreate the view with SECURITY INVOKER (default, but explicit for clarity)
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
    provincia,
    profile_type,
    instagram,
    facebook,
    linkedin,
    created_at,
    updated_at
  FROM profile_details;

-- Grant access to the view
GRANT SELECT ON public_profiles TO anon, authenticated;
