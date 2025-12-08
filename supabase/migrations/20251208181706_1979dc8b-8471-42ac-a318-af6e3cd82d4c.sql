-- Enable realtime for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Create function to notify on new direct message
CREATE OR REPLACE FUNCTION public.notify_on_direct_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for the receiver
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    link,
    related_user_id
  )
  SELECT
    NEW.receiver_id,
    'direct_message',
    'Nuevo mensaje',
    'Has recibido un nuevo mensaje',
    '/mi-perfil?tab=mensajes',
    NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for direct messages
DROP TRIGGER IF EXISTS trigger_notify_on_direct_message ON public.direct_messages;
CREATE TRIGGER trigger_notify_on_direct_message
  AFTER INSERT ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_direct_message();

-- Create table for platform announcements (broadcast messages)
CREATE TABLE IF NOT EXISTS public.platform_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;

-- Announcements visible by all authenticated users
CREATE POLICY "Anuncios visibles por todos los autenticados"
ON public.platform_announcements
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Only admins can manage announcements
CREATE POLICY "Solo admins pueden crear anuncios"
ON public.platform_announcements
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Solo admins pueden actualizar anuncios"
ON public.platform_announcements
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Solo admins pueden eliminar anuncios"
ON public.platform_announcements
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for announcements
ALTER TABLE public.platform_announcements REPLICA IDENTITY FULL;