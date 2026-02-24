-- Add first_name and last_name columns to profile_details
ALTER TABLE public.profile_details 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;