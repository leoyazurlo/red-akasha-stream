-- Drop existing restrictive INSERT policy
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear solicitudes" ON registration_requests;

-- Create new policy that allows anonymous inserts (for registration requests)
CREATE POLICY "Cualquier persona puede crear solicitudes de registro"
ON registration_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Also allow anonymous users to read their own request by email (optional, for status check)
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias solicitudes" ON registration_requests;

CREATE POLICY "Usuarios pueden ver sus propias solicitudes"
ON registration_requests
FOR SELECT
TO anon, authenticated
USING (
  (auth.uid() = user_id) 
  OR has_role(auth.uid(), 'admin'::app_role)
);