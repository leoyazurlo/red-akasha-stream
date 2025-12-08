-- Agregar columna playback_url para la URL de reproducción del stream en vivo
ALTER TABLE public.streaming_destinations
ADD COLUMN playback_url TEXT;

-- Agregar comentario explicativo
COMMENT ON COLUMN public.streaming_destinations.playback_url IS 'URL de reproducción/embed del stream en vivo (ej: URL de YouTube Live, Twitch embed, etc.)';