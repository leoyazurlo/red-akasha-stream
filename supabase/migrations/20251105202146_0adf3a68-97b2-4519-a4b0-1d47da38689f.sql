-- Crear tabla para rastrear interacciones entre perfiles
CREATE TABLE IF NOT EXISTS public.profile_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_profile_id UUID NOT NULL REFERENCES public.profile_details(id) ON DELETE CASCADE,
  to_profile_id UUID NOT NULL REFERENCES public.profile_details(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('view', 'contact', 'collaboration', 'message')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_profile_interactions_from ON public.profile_interactions(from_profile_id);
CREATE INDEX idx_profile_interactions_to ON public.profile_interactions(to_profile_id);
CREATE INDEX idx_profile_interactions_created_at ON public.profile_interactions(created_at);

-- Habilitar RLS
ALTER TABLE public.profile_interactions ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden crear interacciones
CREATE POLICY "Usuarios pueden registrar interacciones"
ON public.profile_interactions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profile_details
    WHERE profile_details.id = from_profile_id
    AND profile_details.user_id = auth.uid()
  )
);

-- Política: Usuarios pueden ver interacciones relacionadas a sus perfiles
CREATE POLICY "Usuarios pueden ver interacciones de sus perfiles"
ON public.profile_interactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profile_details
    WHERE (profile_details.id = from_profile_id OR profile_details.id = to_profile_id)
    AND profile_details.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Política: Todos pueden ver estadísticas agregadas (contador)
CREATE POLICY "Estadísticas públicas de interacciones"
ON public.profile_interactions
FOR SELECT
USING (true);