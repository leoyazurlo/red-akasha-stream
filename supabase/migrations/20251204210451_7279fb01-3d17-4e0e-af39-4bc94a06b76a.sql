-- Fix SECURITY DEFINER view by setting security_invoker = true
DROP VIEW IF EXISTS public_profiles;

CREATE VIEW public_profiles
WITH (security_invoker = true)
AS
SELECT 
    id,
    user_id,
    display_name,
    avatar_url,
    bio,
    profile_type,
    pais,
    provincia,
    ciudad,
    instagram,
    facebook,
    linkedin,
    email,
    created_at,
    updated_at
FROM profile_details;