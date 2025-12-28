-- Eliminar la política actual que tiene la condición incorrecta
DROP POLICY IF EXISTS "Public can view playback info only" ON public.streaming_destinations;

-- Crear una nueva política que permita a CUALQUIER persona ver destinos activos con URL de reproducción
CREATE POLICY "Cualquiera puede ver destinos activos para streaming público"
ON public.streaming_destinations
FOR SELECT
USING (is_active = true AND playback_url IS NOT NULL);