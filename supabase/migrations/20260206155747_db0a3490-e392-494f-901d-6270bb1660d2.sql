-- Add rejection_reason column to registration_requests
ALTER TABLE public.registration_requests 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;