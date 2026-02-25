-- Fix public_profiles view: add security_invoker = true
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT id,
    user_id,
    profile_type,
    additional_profile_types,
    display_name,
    bio,
    avatar_url,
    pais,
    ciudad,
    provincia,
    genre,
    venue_type,
    capacity,
    formation_date,
    created_at,
    updated_at
FROM profile_details;

-- Fix user_subscription_status view: add security_invoker = true
CREATE OR REPLACE VIEW public.user_subscription_status
WITH (security_invoker = true)
AS
SELECT id,
    user_id,
    tier,
    is_active,
    current_period_start,
    current_period_end,
    max_concurrent_viewers,
    max_storage_gb,
    max_streaming_hours,
    created_at,
    updated_at
FROM subscriptions;