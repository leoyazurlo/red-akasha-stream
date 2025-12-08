-- Table for RTMP streaming destinations
CREATE TABLE public.streaming_destinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL, -- youtube, facebook, instagram, twitch, vimeo, x, custom
  name TEXT NOT NULL,
  rtmp_url TEXT NOT NULL,
  stream_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_connected_at TIMESTAMP WITH TIME ZONE,
  connection_status TEXT DEFAULT 'disconnected', -- connected, disconnected, error
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for scheduled streams
CREATE TABLE public.scheduled_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  destination_ids UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'scheduled', -- scheduled, live, completed, cancelled
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for stream overlays
CREATE TABLE public.stream_overlays_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  overlay_type TEXT NOT NULL, -- logo, banner, ticker, alert, frame
  position TEXT DEFAULT 'top-left', -- top-left, top-right, bottom-left, bottom-right, center
  image_url TEXT,
  text_content TEXT,
  styles JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for stream analytics
CREATE TABLE public.stream_analytics_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  destination_id UUID REFERENCES public.streaming_destinations(id) ON DELETE CASCADE,
  stream_date DATE NOT NULL DEFAULT CURRENT_DATE,
  platform TEXT NOT NULL,
  viewers_peak INTEGER DEFAULT 0,
  viewers_average INTEGER DEFAULT 0,
  duration_minutes INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.streaming_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_overlays_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_analytics_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for streaming_destinations
CREATE POLICY "Users can view their own destinations" ON public.streaming_destinations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own destinations" ON public.streaming_destinations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own destinations" ON public.streaming_destinations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own destinations" ON public.streaming_destinations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for scheduled_streams
CREATE POLICY "Users can view their own scheduled streams" ON public.scheduled_streams
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own scheduled streams" ON public.scheduled_streams
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own scheduled streams" ON public.scheduled_streams
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own scheduled streams" ON public.scheduled_streams
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for stream_overlays_config
CREATE POLICY "Users can view their own overlays" ON public.stream_overlays_config
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own overlays" ON public.stream_overlays_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own overlays" ON public.stream_overlays_config
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own overlays" ON public.stream_overlays_config
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for stream_analytics_log
CREATE POLICY "Users can view their own analytics" ON public.stream_analytics_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own analytics" ON public.stream_analytics_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_streaming_destinations_updated_at
  BEFORE UPDATE ON public.streaming_destinations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scheduled_streams_updated_at
  BEFORE UPDATE ON public.scheduled_streams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stream_overlays_config_updated_at
  BEFORE UPDATE ON public.stream_overlays_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();