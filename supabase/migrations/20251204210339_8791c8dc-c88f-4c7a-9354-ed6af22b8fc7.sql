-- Fix SECURITY DEFINER view by recreating it without security definer
DROP VIEW IF EXISTS public_profiles;

CREATE VIEW public_profiles AS
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