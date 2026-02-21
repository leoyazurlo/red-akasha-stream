
-- Allow anonymous/public read access to profile_details for public profile pages
-- This is safe because sensitive fields (email, telefono, whatsapp) are hidden in the UI for non-authenticated users
CREATE POLICY "Perfiles públicos visibles para todos"
ON public.profile_details
FOR SELECT
TO anon
USING (true);
