-- Crear bucket para fotos de perfil
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-avatars', 'profile-avatars', true);

-- Política para que todos puedan ver las fotos de perfil
CREATE POLICY "Avatares visibles por todos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-avatars');

-- Política para que usuarios autenticados puedan subir su foto
CREATE POLICY "Usuarios pueden subir su avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-avatars' 
  AND auth.uid() IS NOT NULL
);

-- Política para que usuarios puedan actualizar su foto
CREATE POLICY "Usuarios pueden actualizar su avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-avatars' 
  AND auth.uid() IS NOT NULL
);

-- Política para que usuarios puedan eliminar su foto
CREATE POLICY "Usuarios pueden eliminar su avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-avatars' 
  AND auth.uid() IS NOT NULL
);