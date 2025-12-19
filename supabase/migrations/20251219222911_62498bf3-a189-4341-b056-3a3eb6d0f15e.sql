-- Drop the existing constraint and create a new one with 700 character limit
ALTER TABLE public.profile_details DROP CONSTRAINT IF EXISTS check_bio_length;
ALTER TABLE public.profile_details ADD CONSTRAINT check_bio_length CHECK (bio IS NULL OR char_length(bio) <= 700);