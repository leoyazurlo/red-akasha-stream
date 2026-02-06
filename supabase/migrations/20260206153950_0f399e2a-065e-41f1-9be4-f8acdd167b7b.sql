-- Add RLS policy for admins to UPDATE registration_requests
CREATE POLICY "Administradores pueden actualizar solicitudes"
ON registration_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to DELETE registration_requests (if needed)
CREATE POLICY "Administradores pueden eliminar solicitudes"
ON registration_requests
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));