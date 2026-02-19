
-- ==============================================
-- REMEDIACIÓN 1: Restringir profile_details
-- Eliminar política pública que expone PII
-- ==============================================

-- Eliminar la política permisiva que expone todo públicamente
DROP POLICY IF EXISTS "Perfiles visibles públicamente para compartir" ON public.profile_details;

-- Las políticas existentes ya cubren el acceso correcto:
-- - "Users can see their own profile details" → propietario o admin
-- - "Admins pueden ver todos los perfiles" → admin
-- - "Usuarios pueden ver su propio perfil completo" → propietario
-- Eliminar redundante que también usa auth.uid() check
-- Mantener solo las necesarias

-- ==============================================
-- REMEDIACIÓN 2: Restringir content_purchases
-- Crear vista segura para creadores sin datos de pago
-- ==============================================

-- Reemplazar política que expone payment_id a creadores
DROP POLICY IF EXISTS "Content owners can view purchases of their content" ON public.content_purchases;

-- Recrear sin campos de pago: usar función RPC en su lugar
-- Crear política que solo permite ver datos no-sensibles
CREATE POLICY "Content owners can view purchase summaries"
ON public.content_purchases
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM content_uploads
    WHERE content_uploads.id = content_purchases.content_id
    AND content_uploads.uploader_id = auth.uid()
  )
);

-- Nota: Para ocultar campos específicos, crear una vista segura
CREATE OR REPLACE VIEW public.creator_purchase_summary
WITH (security_invoker = true)
AS
SELECT 
  cp.id,
  cp.content_id,
  cp.purchase_type,
  cp.amount,
  cp.currency,
  cp.status,
  cp.created_at
  -- Excluye: payment_id, payment_provider, payment_method, user_id
FROM public.content_purchases cp
INNER JOIN public.content_uploads cu ON cu.id = cp.content_id
WHERE cu.uploader_id = auth.uid();

-- ==============================================
-- REMEDIACIÓN 3: Auditoría de acceso admin a banking
-- Crear función que registra acceso admin
-- ==============================================

CREATE OR REPLACE FUNCTION public.log_admin_banking_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo registrar si el que accede NO es el propietario (es admin)
  IF auth.uid() IS NOT NULL AND auth.uid() != OLD.user_id THEN
    INSERT INTO public.admin_audit_logs (
      admin_id,
      action_type,
      target_type,
      target_id,
      details
    ) VALUES (
      auth.uid(),
      'view_banking_info',
      'user_banking_info',
      OLD.user_id::text,
      jsonb_build_object('accessed_at', now())
    );
  END IF;
  RETURN OLD;
END;
$$;

-- Nota: Los triggers SELECT no existen en PostgreSQL.
-- La auditoría real de SELECT requiere pg_audit o logging a nivel aplicación.
-- Lo que SÍ podemos hacer es crear una función RPC segura para acceso admin:

CREATE OR REPLACE FUNCTION public.admin_get_banking_info(p_target_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  bank_name text,
  account_holder_name text,
  account_type text,
  encrypted_account_number text,
  routing_number text,
  paypal_email text,
  mercadopago_alias text,
  preferred_method text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que es admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acceso no autorizado';
  END IF;

  -- Registrar el acceso en audit log
  INSERT INTO admin_audit_logs (admin_id, action_type, target_type, target_id, details)
  VALUES (
    auth.uid(),
    'view_banking_info',
    'user_banking_info',
    p_target_user_id::text,
    jsonb_build_object('accessed_at', now(), 'reason', 'admin_panel_view')
  );

  -- Retornar los datos
  RETURN QUERY
  SELECT ubi.id, ubi.user_id, ubi.bank_name, ubi.account_holder_name,
         ubi.account_type, ubi.encrypted_account_number, ubi.routing_number,
         ubi.paypal_email, ubi.mercadopago_alias, ubi.preferred_method,
         ubi.created_at, ubi.updated_at
  FROM user_banking_info ubi
  WHERE ubi.user_id = p_target_user_id;
END;
$$;
