-- Create table for user banking information
CREATE TABLE public.user_banking_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    bank_name TEXT,
    account_holder_name TEXT,
    account_number_encrypted TEXT,
    account_type TEXT CHECK (account_type IN ('checking', 'savings')),
    cbu_cvu TEXT,
    mercadopago_email TEXT,
    paypal_email TEXT,
    crypto_wallet_address TEXT,
    crypto_wallet_type TEXT,
    preferred_payment_method TEXT DEFAULT 'bank_transfer',
    country TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for tracking user earnings
CREATE TABLE public.user_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    content_id UUID REFERENCES public.content_uploads(id) ON DELETE SET NULL,
    purchase_id UUID REFERENCES public.content_purchases(id) ON DELETE SET NULL,
    gross_amount NUMERIC(10,2) NOT NULL,
    platform_fee_percentage NUMERIC(5,2) NOT NULL,
    platform_fee_amount NUMERIC(10,2) NOT NULL,
    net_amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_user_earnings_user_id ON public.user_earnings(user_id);
CREATE INDEX idx_user_earnings_status ON public.user_earnings(status);

-- Enable RLS
ALTER TABLE public.user_banking_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_earnings ENABLE ROW LEVEL SECURITY;

-- RLS policies for banking info
CREATE POLICY "Users can view their own banking info"
ON public.user_banking_info FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own banking info"
ON public.user_banking_info FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own banking info"
ON public.user_banking_info FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for earnings
CREATE POLICY "Users can view their own earnings"
ON public.user_earnings FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all (using has_role function if exists, otherwise public for now)
CREATE POLICY "Admins can view all banking info"
ON public.user_banking_info FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all earnings"
ON public.user_earnings FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage earnings"
ON public.user_earnings FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_user_banking_info_updated_at
BEFORE UPDATE ON public.user_banking_info
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();