-- Create program_schedules table
CREATE TABLE public.program_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day TEXT NOT NULL,
  time TEXT NOT NULL,
  image_url TEXT,
  program_name TEXT,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.program_schedules ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active schedules
CREATE POLICY "Horarios activos visibles por todos"
  ON public.program_schedules FOR SELECT
  USING (is_active = true);

-- Policy: Admins can view all schedules
CREATE POLICY "Admins pueden ver todos los horarios"
  ON public.program_schedules FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can insert schedules
CREATE POLICY "Admins pueden crear horarios"
  ON public.program_schedules FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can update schedules
CREATE POLICY "Admins pueden actualizar horarios"
  ON public.program_schedules FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can delete schedules
CREATE POLICY "Admins pueden eliminar horarios"
  ON public.program_schedules FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for program schedule images
INSERT INTO storage.buckets (id, name, public)
VALUES ('program-schedules', 'program-schedules', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for program schedule images
CREATE POLICY "Program schedule images are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'program-schedules');

CREATE POLICY "Admins can upload program schedule images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'program-schedules' AND
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can update program schedule images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'program-schedules' AND
    has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete program schedule images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'program-schedules' AND
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Trigger for updated_at
CREATE TRIGGER update_program_schedules_updated_at
  BEFORE UPDATE ON public.program_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();