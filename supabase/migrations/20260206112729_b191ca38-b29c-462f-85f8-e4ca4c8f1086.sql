-- ==========================================
-- AKASHA IA 2.0 - INFRAESTRUCTURA COMPLETA
-- ==========================================

-- 1. Tabla para archivos subidos a Akasha IA
CREATE TABLE public.ia_uploaded_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.ia_conversations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'document', 'image', 'audio', 'code'
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  analysis_status TEXT DEFAULT 'pending', -- 'pending', 'analyzing', 'completed', 'failed'
  analysis_result JSONB, -- Resultado del análisis de la IA
  extracted_text TEXT, -- Texto extraído de documentos
  metadata JSONB, -- Metadatos adicionales (duración audio, dimensiones imagen, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Tabla para memoria persistente de la IA
CREATE TABLE public.ia_user_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  preferences JSONB DEFAULT '{}', -- Preferencias del usuario
  context_summary TEXT, -- Resumen del contexto acumulado
  topics_of_interest TEXT[], -- Temas de interés detectados
  interaction_patterns JSONB DEFAULT '{}', -- Patrones de interacción
  last_activity_summary TEXT, -- Resumen de última actividad
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Tabla para imágenes generadas por la IA
CREATE TABLE public.ia_generated_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.ia_conversations(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_type TEXT DEFAULT 'general', -- 'flyer', 'banner', 'artwork', 'promotional', 'general'
  style TEXT, -- Estilo artístico usado
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Tabla para transcripciones de voz
CREATE TABLE public.ia_voice_transcriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.ia_conversations(id) ON DELETE CASCADE,
  audio_url TEXT,
  transcription TEXT NOT NULL,
  language TEXT DEFAULT 'es',
  duration_seconds NUMERIC,
  confidence_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Tabla para acciones de agentes autónomos
CREATE TABLE public.ia_agent_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID REFERENCES public.ia_conversations(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'create_content', 'send_notification', 'update_profile', 'analyze_data', etc.
  action_description TEXT NOT NULL,
  action_parameters JSONB,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'executing', 'completed', 'failed', 'rejected'
  result JSONB,
  requires_approval BOOLEAN DEFAULT true,
  approved_at TIMESTAMP WITH TIME ZONE,
  executed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Tabla para analítica predictiva
CREATE TABLE public.ia_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_type TEXT NOT NULL, -- 'trend', 'collaboration', 'content_performance', 'user_growth', 'revenue'
  title TEXT NOT NULL,
  description TEXT,
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
  prediction_data JSONB NOT NULL,
  time_horizon TEXT, -- 'week', 'month', 'quarter', 'year'
  is_active BOOLEAN DEFAULT true,
  accuracy_result NUMERIC, -- Resultado real vs predicción (para aprendizaje)
  generated_by UUID, -- Usuario o sistema que generó
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- 7. Tabla para sugerencias de colaboración
CREATE TABLE public.ia_collaboration_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_1_id UUID NOT NULL,
  profile_2_id UUID NOT NULL,
  compatibility_score NUMERIC CHECK (compatibility_score >= 0 AND compatibility_score <= 1),
  reasons JSONB, -- Razones de la sugerencia
  collaboration_type TEXT, -- 'musical', 'production', 'event', 'content'
  status TEXT DEFAULT 'suggested', -- 'suggested', 'viewed', 'accepted', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_1_id, profile_2_id)
);

-- 8. Actualizar tabla de conversaciones para incluir modo y contexto
ALTER TABLE public.ia_conversations 
ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'chat', -- 'chat', 'analysis', 'generation', 'prediction'
ADD COLUMN IF NOT EXISTS has_files BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_voice BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS active_agent_actions INTEGER DEFAULT 0;

-- Habilitar RLS en todas las tablas
ALTER TABLE public.ia_uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_user_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_voice_transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_collaboration_suggestions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para archivos subidos
CREATE POLICY "Users can view own uploaded files" ON public.ia_uploaded_files
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload files" ON public.ia_uploaded_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own files" ON public.ia_uploaded_files
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para memoria
CREATE POLICY "Users can view own memory" ON public.ia_user_memory
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own memory" ON public.ia_user_memory
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para imágenes generadas
CREATE POLICY "Users can view own generated images" ON public.ia_generated_images
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create generated images" ON public.ia_generated_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para transcripciones
CREATE POLICY "Users can view own transcriptions" ON public.ia_voice_transcriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create transcriptions" ON public.ia_voice_transcriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para acciones de agentes
CREATE POLICY "Users can view own agent actions" ON public.ia_agent_actions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create agent actions" ON public.ia_agent_actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own agent actions" ON public.ia_agent_actions
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para predicciones (solo admins pueden crear, todos pueden ver activas)
CREATE POLICY "Anyone can view active predictions" ON public.ia_predictions
  FOR SELECT USING (is_active = true);

-- Políticas RLS para sugerencias de colaboración
CREATE POLICY "Users can view their collaboration suggestions" ON public.ia_collaboration_suggestions
  FOR SELECT USING (
    profile_1_id IN (SELECT id FROM public.profile_details WHERE user_id = auth.uid()) OR
    profile_2_id IN (SELECT id FROM public.profile_details WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update their collaboration suggestions" ON public.ia_collaboration_suggestions
  FOR UPDATE USING (
    profile_1_id IN (SELECT id FROM public.profile_details WHERE user_id = auth.uid()) OR
    profile_2_id IN (SELECT id FROM public.profile_details WHERE user_id = auth.uid())
  );

-- Crear bucket para archivos de Akasha IA
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('akasha-ia-files', 'akasha-ia-files', false, 52428800) -- 50MB limit
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para archivos de IA
CREATE POLICY "Users can upload to akasha-ia-files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'akasha-ia-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own akasha-ia-files" ON storage.objects
  FOR SELECT USING (bucket_id = 'akasha-ia-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own akasha-ia-files" ON storage.objects
  FOR DELETE USING (bucket_id = 'akasha-ia-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Función para actualizar memoria del usuario
CREATE OR REPLACE FUNCTION public.update_user_memory()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.ia_user_memory (user_id, total_conversations, total_messages, updated_at)
  VALUES (NEW.user_id, 1, 1, now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_conversations = ia_user_memory.total_conversations + 1,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para actualizar memoria cuando se crea conversación
CREATE TRIGGER on_conversation_created
  AFTER INSERT ON public.ia_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_memory();

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_ia_files_user ON public.ia_uploaded_files(user_id);
CREATE INDEX IF NOT EXISTS idx_ia_files_conversation ON public.ia_uploaded_files(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ia_predictions_type ON public.ia_predictions(prediction_type, is_active);
CREATE INDEX IF NOT EXISTS idx_ia_collab_profiles ON public.ia_collaboration_suggestions(profile_1_id, profile_2_id);