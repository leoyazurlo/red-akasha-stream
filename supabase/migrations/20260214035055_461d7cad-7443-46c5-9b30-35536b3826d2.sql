ALTER TABLE public.profile_details DROP CONSTRAINT check_bio_length;
ALTER TABLE public.profile_details ADD CONSTRAINT check_bio_length CHECK (bio IS NULL OR char_length(bio) <= 1000);