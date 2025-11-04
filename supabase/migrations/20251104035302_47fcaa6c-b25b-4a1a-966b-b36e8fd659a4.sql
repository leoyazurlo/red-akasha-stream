-- Fase 1: Crear tabla de solicitudes de registro
CREATE TABLE public.registration_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT,
  ciudad TEXT NOT NULL,
  motivacion TEXT NOT NULL,
  areas_interes TEXT[],
  que_buscas TEXT[],
  perfil TEXT[],
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para registration_requests
CREATE POLICY "Usuarios autenticados pueden crear solicitudes"
ON public.registration_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Usuarios pueden ver sus propias solicitudes"
ON public.registration_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Solo admins pueden actualizar solicitudes"
ON public.registration_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_registration_requests_updated_at
BEFORE UPDATE ON public.registration_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Fase 2: Actualizar políticas RLS existentes

-- Restringir acceso a perfiles
DROP POLICY IF EXISTS "Perfiles visibles por todos" ON public.profiles;
CREATE POLICY "Perfiles visibles solo para autenticados"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Restringir visibilidad de roles
DROP POLICY IF EXISTS "Roles visibles por todos" ON public.user_roles;
CREATE POLICY "Usuarios ven su rol o admins ven todos"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Restringir visibilidad de votos
DROP POLICY IF EXISTS "Votos visibles por todos" ON public.forum_votes;
CREATE POLICY "Votos visibles solo para autenticados"
ON public.forum_votes
FOR SELECT
TO authenticated
USING (true);

-- Restringir visibilidad de badges de usuarios
DROP POLICY IF EXISTS "Badges de usuarios visibles por todos" ON public.user_badges;
CREATE POLICY "Badges visibles solo para autenticados"
ON public.user_badges
FOR SELECT
TO authenticated
USING (true);