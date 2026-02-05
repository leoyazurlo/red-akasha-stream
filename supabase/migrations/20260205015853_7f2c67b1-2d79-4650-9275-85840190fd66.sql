-- Actualizar porcentajes de compra única a 70/30
UPDATE platform_payment_settings 
SET setting_value = jsonb_set(
  jsonb_set(setting_value::jsonb, '{author_percentage}', '70'),
  '{platform_percentage}', '30'
)
WHERE setting_key = 'single_content_purchase';

-- Agregar configuración de cuentas de pago de la plataforma (Red Akasha)
INSERT INTO platform_payment_settings (setting_key, setting_value, description)
VALUES (
  'platform_payment_accounts',
  '{
    "mercadopago": {
      "enabled": false,
      "email": "",
      "alias": ""
    },
    "paypal": {
      "enabled": false,
      "email": ""
    },
    "bank_transfer": {
      "enabled": false,
      "bank_name": "",
      "account_holder": "Red Akasha",
      "account_number": "",
      "cbu_cvu": "",
      "swift_code": ""
    },
    "crypto": {
      "enabled": false,
      "btc_address": "",
      "eth_address": "",
      "usdt_address": ""
    }
  }'::jsonb,
  'Cuentas de pago de la plataforma Red Akasha para recibir el porcentaje de ventas'
)
ON CONFLICT (setting_key) DO NOTHING;