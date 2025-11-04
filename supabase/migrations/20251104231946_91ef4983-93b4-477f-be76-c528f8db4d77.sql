-- Add photo_url column to content_uploads table
ALTER TABLE public.content_uploads 
ADD COLUMN IF NOT EXISTS photo_url TEXT;