-- Agregar política para que usuarios autenticados puedan ver todos los perfiles públicos
CREATE POLICY "Usuarios autenticados pueden ver todos los perfiles públicos"
ON profile_details
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);