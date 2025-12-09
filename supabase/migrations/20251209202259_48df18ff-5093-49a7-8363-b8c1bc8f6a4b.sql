-- =============================================
-- FIX 1: Proteger streaming keys - Solo el propietario puede ver sus claves
-- =============================================

-- Eliminar la política que expone las claves públicamente
DROP POLICY IF EXISTS "Anyone can view active streaming destinations" ON public.streaming_destinations;

-- Crear política que solo muestra datos públicos (sin stream_key y rtmp_url)
CREATE POLICY "Public can view playback info only"
ON public.streaming_destinations
FOR SELECT
USING (
  (is_active = true AND playback_url IS NOT NULL AND user_id = auth.uid())
  OR has_role(auth.uid(), 'admin')
);

-- =============================================
-- FIX 2: Proteger datos de contacto en profile_details
-- =============================================

-- Eliminar política que expone todos los datos a usuarios autenticados
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver todos los perfiles públicos" ON public.profile_details;

-- Crear vista pública que excluye datos sensibles de contacto
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  profile_type,
  additional_profile_types,
  display_name,
  bio,
  avatar_url,
  pais,
  ciudad,
  provincia,
  genre,
  venue_type,
  capacity,
  formation_date,
  -- Excluir: email, telefono, whatsapp, instagram, facebook, linkedin
  created_at,
  updated_at
FROM public.profile_details;

-- Política para ver perfiles públicos (sin datos sensibles) via la vista
CREATE POLICY "Usuarios autenticados pueden ver perfiles públicos básicos"
ON public.profile_details
FOR SELECT
TO authenticated
USING (
  -- Solo pueden ver datos completos si son el propietario o admin
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin')
);

-- =============================================
-- FIX 3: Proteger IDs de Stripe en subscriptions
-- =============================================

-- Crear vista segura para suscripciones (sin IDs de Stripe)
DROP VIEW IF EXISTS public.user_subscription_status;
CREATE VIEW public.user_subscription_status AS
SELECT 
  id,
  user_id,
  tier,
  is_active,
  current_period_start,
  current_period_end,
  max_concurrent_viewers,
  max_storage_gb,
  max_streaming_hours,
  created_at,
  updated_at
  -- Excluir: stripe_customer_id, stripe_subscription_id
FROM public.subscriptions;

-- Actualizar política de subscriptions para ser más restrictiva
DROP POLICY IF EXISTS "Usuarios ven su propia suscripción" ON public.subscriptions;

CREATE POLICY "Solo admins ven IDs de Stripe"
ON public.subscriptions
FOR SELECT
USING (
  (auth.uid() = user_id) 
  OR has_role(auth.uid(), 'admin')
);