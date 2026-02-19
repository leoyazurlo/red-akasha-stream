
-- =============================================
-- 1. ÍNDICES OPTIMIZADOS PARA QUERIES FRECUENTES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_content_type_created 
  ON content_uploads(content_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_tags 
  ON content_uploads USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_content_ranking 
  ON content_uploads(views_count DESC NULLS LAST, likes_count DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_content_uploader 
  ON content_uploads(uploader_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_forum_threads_subforo_recent 
  ON forum_threads(subforo_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_forum_threads_pinned 
  ON forum_threads(subforo_id, is_pinned DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_forum_posts_thread 
  ON forum_posts(thread_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON notifications(user_id, created_at DESC) WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_dm_unread 
  ON direct_messages(receiver_id, created_at DESC) WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_analytics_user_date 
  ON analytics_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_artists_type_country 
  ON artists(artist_type, country);

CREATE INDEX IF NOT EXISTS idx_content_likes_unique_check 
  ON content_likes(content_id, user_id);

CREATE INDEX IF NOT EXISTS idx_ia_conversations_user 
  ON ia_conversations(user_id, updated_at DESC);

-- =============================================
-- 2. TABLA DE JOB QUEUE PARA PROCESAMIENTO ASYNC
-- =============================================

CREATE TABLE IF NOT EXISTS public.ia_job_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority INT NOT NULL DEFAULT 5,
  payload JSONB NOT NULL DEFAULT '{}',
  result JSONB,
  error_message TEXT,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_queue_pending 
  ON ia_job_queue(priority ASC, scheduled_for ASC) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_job_queue_user 
  ON ia_job_queue(user_id, created_at DESC);

ALTER TABLE public.ia_job_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own jobs"
  ON ia_job_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs"
  ON ia_job_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 3. TABLA DE RATE LIMITING
-- =============================================

CREATE TABLE IF NOT EXISTS public.ia_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint_window 
  ON ia_rate_limits(user_id, endpoint, window_start);

ALTER TABLE public.ia_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages rate limits"
  ON ia_rate_limits FOR ALL
  USING (true)
  WITH CHECK (true);

-- Rate limit check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INT DEFAULT 30,
  p_window_minutes INT DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INT;
BEGIN
  v_window_start := date_trunc('minute', now());
  
  INSERT INTO ia_rate_limits (user_id, endpoint, request_count, window_start)
  VALUES (p_user_id, p_endpoint, 1, v_window_start)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET request_count = ia_rate_limits.request_count + 1
  RETURNING request_count INTO v_current_count;
  
  RETURN v_current_count <= p_max_requests;
END;
$$;

-- Cleanup functions
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM ia_rate_limits WHERE window_start < now() - INTERVAL '10 minutes';
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM ia_job_queue WHERE status IN ('completed', 'failed') AND completed_at < now() - INTERVAL '7 days';
END;
$$;

-- Enable extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
