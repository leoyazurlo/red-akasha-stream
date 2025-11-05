-- Crear bucket para avatares de perfil
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-avatars', 'profile-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Política para que cualquier usuario autenticado pueda subir su avatar
CREATE POLICY "Usuarios pueden subir sus avatares"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para que usuarios puedan actualizar sus propios avatares
CREATE POLICY "Usuarios pueden actualizar sus avatares"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para que usuarios puedan eliminar sus propios avatares
CREATE POLICY "Usuarios pueden eliminar sus avatares"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para que todos puedan ver los avatares (bucket público)
CREATE POLICY "Avatares visibles públicamente"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-avatars');