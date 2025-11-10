-- Agregar columna para comentarios anidados
ALTER TABLE public.content_comments
ADD COLUMN parent_comment_id UUID REFERENCES public.content_comments(id) ON DELETE CASCADE;

-- Crear índice para mejorar el rendimiento de las consultas de respuestas
CREATE INDEX idx_content_comments_parent ON public.content_comments(parent_comment_id);
CREATE INDEX idx_content_comments_content_parent ON public.content_comments(content_id, parent_comment_id);