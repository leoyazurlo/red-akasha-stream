-- Add encrypted_password column to store the user's chosen password
ALTER TABLE public.registration_requests ADD COLUMN encrypted_password TEXT;