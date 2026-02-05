-- Add enable flags for each payment method
ALTER TABLE user_banking_info
ADD COLUMN IF NOT EXISTS bank_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mercadopago_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS paypal_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS crypto_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS mercadopago_alias TEXT;