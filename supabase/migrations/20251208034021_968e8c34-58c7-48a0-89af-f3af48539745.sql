-- Create platform payment settings table
CREATE TABLE public.platform_payment_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_payment_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins can view payment settings" 
ON public.platform_payment_settings 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert payment settings" 
ON public.platform_payment_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payment settings" 
ON public.platform_payment_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete payment settings" 
ON public.platform_payment_settings 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.platform_payment_settings (setting_key, setting_value, description) VALUES
('subscription_monthly', '{"price": 9.99, "currency": "USD", "author_percentage": 70, "platform_percentage": 30}', 'Suscripción mensual'),
('subscription_annual', '{"price": 89.99, "currency": "USD", "author_percentage": 70, "platform_percentage": 30}', 'Suscripción anual'),
('single_content_purchase', '{"default_price": 4.99, "currency": "USD", "author_percentage": 65, "platform_percentage": 35}', 'Compra única de contenido'),
('latin_america_countries', '{"countries": ["AR", "BO", "BR", "CL", "CO", "CR", "CU", "DO", "EC", "SV", "GT", "HN", "MX", "NI", "PA", "PY", "PE", "PR", "UY", "VE"]}', 'Países de Latinoamérica con acceso gratuito'),
('free_access_enabled', '{"enabled": true, "regions": ["latin_america"]}', 'Configuración de acceso gratuito por región');

-- Create trigger for updated_at
CREATE TRIGGER update_platform_payment_settings_updated_at
BEFORE UPDATE ON public.platform_payment_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();