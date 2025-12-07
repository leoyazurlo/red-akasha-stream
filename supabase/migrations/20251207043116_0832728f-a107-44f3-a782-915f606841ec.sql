-- Add column for additional profile types (the main profile_type stays as the primary)
ALTER TABLE public.profile_details 
ADD COLUMN IF NOT EXISTS additional_profile_types text[] DEFAULT '{}'::text[];