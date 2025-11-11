-- Crear tabla para tracking de compartidos
CREATE TABLE IF NOT EXISTS public.content_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content_uploads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'facebook', 'twitter', 'linkedin', 'telegram', 'instagram', 'native', 'copy_link')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Agregar índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_content_shares_content_id ON public.content_shares(content_id);
CREATE INDEX IF NOT EXISTS idx_content_shares_user_id ON public.content_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_content_shares_platform ON public.content_shares(platform);
CREATE INDEX IF NOT EXISTS idx_content_shares_created_at ON public.content_shares(created_at DESC);

-- Agregar columna de contador de shares en content_uploads
ALTER TABLE public.content_uploads 
ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- Función para actualizar el contador de shares
CREATE OR REPLACE FUNCTION public.update_content_shares_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE content_uploads
    SET shares_count = shares_count + 1
    WHERE id = NEW.content_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE content_uploads
    SET shares_count = GREATEST(shares_count - 1, 0)
    WHERE id = OLD.content_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger para actualizar automáticamente el contador
DROP TRIGGER IF EXISTS trigger_update_content_shares_count ON public.content_shares;
CREATE TRIGGER trigger_update_content_shares_count
  AFTER INSERT OR DELETE ON public.content_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_content_shares_count();

-- Habilitar Row Level Security
ALTER TABLE public.content_shares ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Cualquiera puede crear un registro de share (para tracking anónimo también)
CREATE POLICY "Cualquiera puede registrar shares"
  ON public.content_shares
  FOR INSERT
  WITH CHECK (true);

-- Solo admins pueden ver todos los shares
CREATE POLICY "Admins pueden ver todos los shares"
  ON public.content_shares
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Usuarios pueden ver sus propios shares
CREATE POLICY "Usuarios pueden ver sus propios shares"
  ON public.content_shares
  FOR SELECT
  USING (auth.uid() = user_id);

-- Los shares no se pueden actualizar ni eliminar (datos de auditoría)
CREATE POLICY "Shares no se pueden actualizar"
  ON public.content_shares
  FOR UPDATE
  USING (false);

CREATE POLICY "Solo admins pueden eliminar shares"
  ON public.content_shares
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));