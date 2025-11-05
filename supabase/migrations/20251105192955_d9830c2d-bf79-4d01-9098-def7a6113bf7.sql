-- Agregar columnas de latitud y longitud a profile_details
ALTER TABLE public.profile_details
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

-- Crear índice para búsquedas geoespaciales
CREATE INDEX IF NOT EXISTS idx_profile_details_coordinates 
ON public.profile_details (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN public.profile_details.latitude IS 'Latitud geocodificada del perfil';
COMMENT ON COLUMN public.profile_details.longitude IS 'Longitud geocodificada del perfil';