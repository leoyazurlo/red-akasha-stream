-- Paso 1: Solo agregar nuevos roles
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'producer';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'streamer';