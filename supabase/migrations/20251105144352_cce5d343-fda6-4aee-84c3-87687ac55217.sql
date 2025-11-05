-- Crear tabla de logs de auditoría
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'approve_content', 'reject_content', 'delete_user', 'approve_request', 'reject_request'
  target_type TEXT NOT NULL, -- 'content', 'user', 'registration_request'
  target_id UUID NOT NULL,
  details JSONB, -- Información adicional sobre la acción
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_action_type ON public.admin_audit_logs(action_type);
CREATE INDEX idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX idx_admin_audit_logs_target ON public.admin_audit_logs(target_type, target_id);

-- Habilitar RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Solo admins pueden ver los logs
CREATE POLICY "Solo admins pueden ver logs de auditoría"
ON public.admin_audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Policy: Solo admins pueden insertar logs
CREATE POLICY "Solo admins pueden crear logs de auditoría"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

-- Comentarios para documentación
COMMENT ON TABLE public.admin_audit_logs IS 'Registro de auditoría de todas las acciones administrativas';
COMMENT ON COLUMN public.admin_audit_logs.action_type IS 'Tipo de acción realizada por el administrador';
COMMENT ON COLUMN public.admin_audit_logs.target_type IS 'Tipo de entidad sobre la que se realizó la acción';
COMMENT ON COLUMN public.admin_audit_logs.target_id IS 'ID de la entidad afectada';
COMMENT ON COLUMN public.admin_audit_logs.details IS 'Información adicional en formato JSON sobre la acción';