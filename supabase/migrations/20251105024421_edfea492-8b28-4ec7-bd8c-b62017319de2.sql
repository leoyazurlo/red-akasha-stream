-- Actualizar el enum profile_type para reemplazar 'disfruto_musica' con 'productor_audiovisual'
-- Primero, actualizamos los registros existentes
UPDATE profile_details 
SET profile_type = 'productor_audiovisual'::text::profile_type 
WHERE profile_type = 'disfruto_musica';

-- Luego, modificamos el enum usando ALTER TYPE
ALTER TYPE profile_type RENAME VALUE 'disfruto_musica' TO 'productor_audiovisual';