-- Primero, eliminamos la vista que depende de profile_type
DROP VIEW IF EXISTS public_profiles;

-- Crear un nuevo enum con todos los valores
CREATE TYPE profile_type_new AS ENUM (
  'productor_audiovisual',
  'productor_artistico',
  'estudio_grabacion',
  'promotor_artistico',
  'sala_concierto',
  'agrupacion_musical',
  'marketing_digital',
  'musico',
  'sello_discografico',
  'perfil_contenido',
  'arte_digital',
  'management',
  'me_gusta_arte',
  'representante',
  'dj',
  'vj'
);

-- Actualizar la columna profile_type en profile_details
ALTER TABLE profile_details 
  ALTER COLUMN profile_type TYPE profile_type_new 
  USING profile_type::text::profile_type_new;

-- Eliminar el enum viejo y renombrar el nuevo
DROP TYPE profile_type;
ALTER TYPE profile_type_new RENAME TO profile_type;

-- Recrear la vista public_profiles
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
  id,
  user_id,
  display_name,
  avatar_url,
  bio,
  profile_type,
  pais,
  provincia,
  ciudad,
  instagram,
  facebook,
  linkedin,
  email,
  created_at,
  updated_at
FROM profile_details;