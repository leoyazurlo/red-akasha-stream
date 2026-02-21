
-- Enforce one profile per user
ALTER TABLE public.profile_details ADD CONSTRAINT profile_details_user_id_unique UNIQUE (user_id);
