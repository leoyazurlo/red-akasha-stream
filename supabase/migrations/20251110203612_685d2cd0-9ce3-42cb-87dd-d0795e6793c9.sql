
-- Cambiar el default status de content_uploads de vuelta a 'pending' para curaduría obligatoria
ALTER TABLE content_uploads 
ALTER COLUMN status SET DEFAULT 'pending';

-- Cambiar todos los videos actuales a pending para que pasen por curaduría
UPDATE content_uploads 
SET status = 'pending' 
WHERE status = 'approved';
