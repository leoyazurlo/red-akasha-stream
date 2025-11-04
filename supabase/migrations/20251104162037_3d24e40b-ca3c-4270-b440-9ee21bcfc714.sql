-- Agregar columna de país a registration_requests
ALTER TABLE public.registration_requests 
ADD COLUMN pais text;

-- Actualizar RLS policy para lectura pública de solicitudes aprobadas (para el circuito)
CREATE POLICY "Solicitudes aprobadas visibles públicamente"
ON public.registration_requests
FOR SELECT
USING (status = 'approved');