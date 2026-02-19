
-- ═══════════════════════════════════════════════
-- Error Logs: captura errores de frontend y edge functions
-- ═══════════════════════════════════════════════
CREATE TABLE public.error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_type TEXT NOT NULL DEFAULT 'uncaught', -- 'uncaught', 'boundary', 'edge_function', 'api'
  severity TEXT NOT NULL DEFAULT 'error', -- 'warning', 'error', 'critical'
  component TEXT, -- React component name or edge function name
  page TEXT, -- URL/route where error occurred
  user_id UUID, -- nullable for unauthenticated errors
  session_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb, -- browser info, request details, etc
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for common queries
CREATE INDEX idx_error_logs_created_at ON public.error_logs (created_at DESC);
CREATE INDEX idx_error_logs_severity ON public.error_logs (severity, created_at DESC);
CREATE INDEX idx_error_logs_unresolved ON public.error_logs (resolved, created_at DESC) WHERE resolved = false;
CREATE INDEX idx_error_logs_type ON public.error_logs (error_type, created_at DESC);

-- RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert errors (including unauthenticated users)
CREATE POLICY "Anyone can report errors"
  ON public.error_logs FOR INSERT
  WITH CHECK (true);

-- Only admins can read/update errors
CREATE POLICY "Admins can view error logs"
  ON public.error_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update error logs"
  ON public.error_logs FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for critical error alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.error_logs;

-- ═══════════════════════════════════════════════
-- Performance Metrics: Web Vitals y métricas de rendimiento
-- ═══════════════════════════════════════════════
CREATE TABLE public.performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL, -- 'LCP', 'CLS', 'INP', 'FCP', 'TTFB', 'custom'
  metric_value DOUBLE PRECISION NOT NULL,
  rating TEXT, -- 'good', 'needs-improvement', 'poor'
  page TEXT,
  user_id UUID,
  session_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb, -- navigation type, element info, etc
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_perf_metrics_name_created ON public.performance_metrics (metric_name, created_at DESC);
CREATE INDEX idx_perf_metrics_rating ON public.performance_metrics (rating, created_at DESC);
CREATE INDEX idx_perf_metrics_page ON public.performance_metrics (page, created_at DESC);

-- RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Anyone can insert metrics
CREATE POLICY "Anyone can report metrics"
  ON public.performance_metrics FOR INSERT
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can view performance metrics"
  ON public.performance_metrics FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ═══════════════════════════════════════════════
-- Cleanup: purgar logs viejos (30 días)
-- ═══════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.cleanup_old_monitoring_logs()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM error_logs WHERE created_at < now() - INTERVAL '30 days' AND resolved = true;
  DELETE FROM performance_metrics WHERE created_at < now() - INTERVAL '30 days';
END;
$$;
