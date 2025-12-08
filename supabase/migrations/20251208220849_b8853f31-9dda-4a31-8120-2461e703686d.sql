-- Agregar política para permitir que cualquier persona vea los destinos de streaming activos
CREATE POLICY "Anyone can view active streaming destinations" 
ON public.streaming_destinations 
FOR SELECT 
USING (is_active = true AND playback_url IS NOT NULL);