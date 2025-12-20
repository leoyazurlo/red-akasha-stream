-- Drop existing delete policy
DROP POLICY IF EXISTS "Usuarios pueden eliminar su perfil" ON public.profile_details;

-- Create new delete policy that allows users to delete their own profile AND admins to delete any profile
CREATE POLICY "Usuarios y admins pueden eliminar perfiles" 
ON public.profile_details 
FOR DELETE 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));