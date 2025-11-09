-- Agregar campos para contenido libre o de pago en content_uploads
ALTER TABLE public.content_uploads 
ADD COLUMN is_free boolean DEFAULT true NOT NULL,
ADD COLUMN price numeric(10,2) DEFAULT 0 CHECK (price >= 0),
ADD COLUMN currency text DEFAULT 'USD';

-- Crear índice para consultas por contenido de pago
CREATE INDEX idx_content_uploads_is_free ON public.content_uploads(is_free);

-- Comentarios para documentación
COMMENT ON COLUMN public.content_uploads.is_free IS 'Indica si el contenido es gratuito (true) o de pago (false)';
COMMENT ON COLUMN public.content_uploads.price IS 'Precio del contenido si no es gratuito';
COMMENT ON COLUMN public.content_uploads.currency IS 'Moneda del precio (USD, EUR, ARS, etc.)';