-- Agregar columna para rastrear ediciones de comentarios
ALTER TABLE public.content_comments
ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Comentario: La columna edited_at será NULL para comentarios no editados
-- y contendrá la fecha de la última edición cuando el comentario sea modificado