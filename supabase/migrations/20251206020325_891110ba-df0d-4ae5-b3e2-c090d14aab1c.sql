-- Remove the policy that exposes approved registration requests publicly
DROP POLICY IF EXISTS "Solicitudes aprobadas visibles públicamente" ON registration_requests;

-- The remaining policies are sufficient:
-- "Usuarios pueden ver sus propias solicitudes" - users see their own requests
-- "Solo admins pueden actualizar solicitudes" - only admins can update
-- "Usuarios autenticados pueden crear solicitudes" - authenticated users can create
