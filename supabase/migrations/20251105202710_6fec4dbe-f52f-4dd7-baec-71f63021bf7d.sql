-- Crear tabla para valoraciones de perfiles
CREATE TABLE IF NOT EXISTS public.profile_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rated_profile_id UUID NOT NULL REFERENCES public.profile_details(id) ON DELETE CASCADE,
  rater_profile_id UUID NOT NULL REFERENCES public.profile_details(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(rated_profile_id, rater_profile_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_profile_ratings_rated ON public.profile_ratings(rated_profile_id);
CREATE INDEX idx_profile_ratings_rater ON public.profile_ratings(rater_profile_id);

-- Habilitar RLS
ALTER TABLE public.profile_ratings ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden crear valoraciones de sus perfiles
CREATE POLICY "Usuarios pueden valorar otros perfiles"
ON public.profile_ratings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profile_details
    WHERE profile_details.id = rater_profile_id
    AND profile_details.user_id = auth.uid()
  )
  AND rater_profile_id != rated_profile_id
);

-- Política: Usuarios pueden actualizar sus propias valoraciones
CREATE POLICY "Usuarios pueden actualizar sus valoraciones"
ON public.profile_ratings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profile_details
    WHERE profile_details.id = rater_profile_id
    AND profile_details.user_id = auth.uid()
  )
);

-- Política: Todos pueden ver valoraciones
CREATE POLICY "Valoraciones públicas"
ON public.profile_ratings
FOR SELECT
USING (true);

-- Política: Usuarios pueden eliminar sus valoraciones
CREATE POLICY "Usuarios pueden eliminar sus valoraciones"
ON public.profile_ratings
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profile_details
    WHERE profile_details.id = rater_profile_id
    AND profile_details.user_id = auth.uid()
  )
);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_profile_ratings_updated_at
BEFORE UPDATE ON public.profile_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();