-- Fix recursive RLS policies on user_roles table
-- Drop the problematic policies that query user_roles recursively
DROP POLICY IF EXISTS "Solo admins pueden insertar roles" ON public.user_roles;
DROP POLICY IF EXISTS "Solo admins pueden actualizar roles" ON public.user_roles;
DROP POLICY IF EXISTS "Solo admins pueden eliminar roles" ON public.user_roles;

-- Recreate policies using the has_role() function to avoid recursion
CREATE POLICY "Solo admins pueden insertar roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden actualizar roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Solo admins pueden eliminar roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policies for profile-avatars storage bucket
-- Allow users to upload only their own avatars
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update only their own avatars
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete only their own avatars
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read access for avatars (since bucket is public)
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile-avatars');