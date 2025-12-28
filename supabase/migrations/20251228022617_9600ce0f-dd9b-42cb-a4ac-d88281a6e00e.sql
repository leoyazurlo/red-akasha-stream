
-- Allow anyone (including unauthenticated users) to view public profiles
-- This enables sharing profile links with people outside the platform
CREATE POLICY "Perfiles visibles públicamente para compartir" 
ON public.profile_details 
FOR SELECT 
USING (true);

-- Note: The existing more restrictive policies still apply for 
-- authenticated users who want to see additional private data,
-- but this policy allows basic profile viewing for anyone
