-- Tabla para usuarios autorizados a usar la IA
CREATE TABLE public.ia_authorized_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  authorized_by UUID NOT NULL,
  authorized_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  UNIQUE(user_id)
);

-- Tabla para configuración de API keys de IA
CREATE TABLE public.ia_api_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- 'openai', 'google', 'anthropic', 'lovable'
  display_name TEXT NOT NULL,
  api_key_encrypted TEXT, -- NULL si usa Lovable AI (ya tiene key)
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID,
  UNIQUE(provider)
);

-- Tabla para propuestas de funciones generadas por IA
CREATE TABLE public.ia_feature_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  proposed_code TEXT,
  ai_reasoning TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'implemented')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT,
  requested_by UUID,
  reviewed_by UUID,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Tabla para historial de conversaciones con IA
CREATE TABLE public.ia_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  messages JSONB DEFAULT '[]',
  context TEXT, -- contexto adicional para la IA
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ia_authorized_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_api_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_feature_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_conversations ENABLE ROW LEVEL SECURITY;

-- Policies para ia_authorized_users
CREATE POLICY "Admins can manage authorized users"
  ON public.ia_authorized_users
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own authorization"
  ON public.ia_authorized_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policies para ia_api_configs (solo admins)
CREATE POLICY "Admins can manage API configs"
  ON public.ia_api_configs
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policies para ia_feature_proposals
CREATE POLICY "Admins can manage all proposals"
  ON public.ia_feature_proposals
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authorized users can create proposals"
  ON public.ia_feature_proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ia_authorized_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can view their own proposals"
  ON public.ia_feature_proposals
  FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid());

-- Policies para ia_conversations
CREATE POLICY "Users can manage their own conversations"
  ON public.ia_conversations
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all conversations"
  ON public.ia_conversations
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_ia_api_configs_updated_at
  BEFORE UPDATE ON public.ia_api_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ia_feature_proposals_updated_at
  BEFORE UPDATE ON public.ia_feature_proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ia_conversations_updated_at
  BEFORE UPDATE ON public.ia_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insertar configuración por defecto de Lovable AI
INSERT INTO public.ia_api_configs (provider, display_name, is_active, is_default, config)
VALUES ('lovable', 'Lovable AI (Integrado)', true, true, '{"model": "google/gemini-3-flash-preview", "description": "IA integrada sin necesidad de API key externa"}');