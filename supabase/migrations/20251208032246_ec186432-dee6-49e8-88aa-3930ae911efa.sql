-- Add monetization fields to content_uploads
ALTER TABLE public.content_uploads 
ADD COLUMN IF NOT EXISTS access_type TEXT DEFAULT 'free' CHECK (access_type IN ('free', 'purchase', 'rental', 'subscription')),
ADD COLUMN IF NOT EXISTS rental_price NUMERIC(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rental_duration_hours INTEGER DEFAULT 48,
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS accepted_payment_methods TEXT[] DEFAULT ARRAY['stripe', 'mercadopago', 'paypal'];

-- Create table for content purchases
CREATE TABLE IF NOT EXISTS public.content_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL REFERENCES public.content_uploads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('purchase', 'rental')),
  payment_method TEXT NOT NULL,
  payment_provider TEXT NOT NULL,
  payment_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'premium', 'vip')),
  payment_method TEXT NOT NULL,
  payment_provider TEXT NOT NULL,
  subscription_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'paused')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment methods configuration table
CREATE TABLE IF NOT EXISTS public.payment_methods_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  icon_name TEXT,
  is_active BOOLEAN DEFAULT true,
  supported_currencies TEXT[] DEFAULT ARRAY['USD', 'EUR'],
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default payment methods
INSERT INTO public.payment_methods_config (provider, display_name, icon_name, is_active, supported_currencies) VALUES
('stripe', 'Tarjeta de Crédito/Débito', 'credit-card', true, ARRAY['USD', 'EUR', 'MXN', 'ARS', 'COP', 'CLP', 'BRL']),
('mercadopago', 'MercadoPago', 'wallet', true, ARRAY['ARS', 'MXN', 'BRL', 'CLP', 'COP', 'PEN', 'UYU']),
('paypal', 'PayPal', 'paypal', true, ARRAY['USD', 'EUR', 'MXN', 'BRL']),
('crypto', 'Criptomonedas', 'bitcoin', true, ARRAY['BTC', 'ETH', 'USDT', 'USDC']),
('bank_transfer', 'Transferencia Bancaria', 'building-2', true, ARRAY['USD', 'EUR', 'ARS', 'MXN', 'COP', 'CLP', 'BRL'])
ON CONFLICT (provider) DO NOTHING;

-- Enable RLS
ALTER TABLE public.content_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_purchases
CREATE POLICY "Users can view their own purchases"
ON public.content_purchases
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases"
ON public.content_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Content owners can view purchases of their content"
ON public.content_purchases
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.content_uploads
    WHERE content_uploads.id = content_purchases.content_id
    AND content_uploads.uploader_id = auth.uid()
  )
);

-- RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create subscriptions"
ON public.user_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
ON public.user_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for payment_methods_config (public read)
CREATE POLICY "Anyone can view active payment methods"
ON public.payment_methods_config
FOR SELECT
USING (is_active = true);

-- Create function to check if user has access to content
CREATE OR REPLACE FUNCTION public.check_content_access(p_content_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_content RECORD;
  v_has_purchase BOOLEAN;
  v_has_subscription BOOLEAN;
BEGIN
  -- Get content info
  SELECT is_free, access_type, uploader_id INTO v_content
  FROM content_uploads WHERE id = p_content_id;
  
  -- Free content or owner always has access
  IF v_content.is_free OR v_content.uploader_id = p_user_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check for valid purchase
  SELECT EXISTS (
    SELECT 1 FROM content_purchases
    WHERE content_id = p_content_id
    AND user_id = p_user_id
    AND status = 'completed'
    AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_has_purchase;
  
  IF v_has_purchase THEN
    RETURN TRUE;
  END IF;
  
  -- Check for active subscription if content requires it
  IF v_content.access_type = 'subscription' THEN
    SELECT EXISTS (
      SELECT 1 FROM user_subscriptions
      WHERE user_id = p_user_id
      AND status = 'active'
      AND current_period_end > now()
    ) INTO v_has_subscription;
    
    RETURN v_has_subscription;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_content_purchases_updated_at
BEFORE UPDATE ON public.content_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();