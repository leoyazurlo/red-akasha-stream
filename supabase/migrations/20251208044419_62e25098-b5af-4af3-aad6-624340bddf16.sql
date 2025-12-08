-- Allow authenticated users to read subscription pricing settings (public data)
CREATE POLICY "Anyone can view subscription settings"
ON public.platform_payment_settings
FOR SELECT
USING (setting_key IN ('subscription_monthly', 'subscription_annual'));