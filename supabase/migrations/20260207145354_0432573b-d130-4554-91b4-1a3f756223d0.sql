-- Tabla para definir los agentes IA especializados del ecosistema
CREATE TABLE public.ia_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'design', 'code', 'testing', 'legal', 'governance'
  description TEXT,
  system_prompt TEXT NOT NULL,
  capabilities JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 50, -- Para ordenar en flujos colaborativos
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla para registrar interacciones entre agentes (red colaborativa)
CREATE TABLE public.ia_agent_collaborations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  requesting_agent_id UUID REFERENCES public.ia_agents(id),
  responding_agent_id UUID REFERENCES public.ia_agents(id),
  request_type VARCHAR(50) NOT NULL, -- 'review', 'generate', 'validate', 'approve'
  request_payload JSONB,
  response_payload JSONB,
  status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Tabla para sesiones de trabajo multi-agente
CREATE TABLE public.ia_collaborative_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES public.ia_feature_proposals(id) ON DELETE SET NULL,
  title VARCHAR(500),
  description TEXT,
  agents_involved UUID[] DEFAULT '{}',
  current_stage VARCHAR(50) DEFAULT 'ideation',
  workflow_state JSONB DEFAULT '{}'::jsonb,
  final_output JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla para votaciones comunitarias
CREATE TABLE public.ia_community_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.ia_feature_proposals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vote VARCHAR(10) NOT NULL CHECK (vote IN ('approve', 'reject', 'abstain')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(proposal_id, user_id)
);

-- Vista para conteo de votos
CREATE OR REPLACE VIEW public.ia_proposal_vote_summary AS
SELECT 
  proposal_id,
  COUNT(*) FILTER (WHERE vote = 'approve') as approve_count,
  COUNT(*) FILTER (WHERE vote = 'reject') as reject_count,
  COUNT(*) FILTER (WHERE vote = 'abstain') as abstain_count,
  COUNT(*) as total_votes
FROM public.ia_community_votes
GROUP BY proposal_id;

-- Habilitar RLS
ALTER TABLE public.ia_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_agent_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_collaborative_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_community_votes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ia_agents (lectura pública, escritura admin)
CREATE POLICY "Agents are viewable by everyone"
  ON public.ia_agents FOR SELECT USING (true);

CREATE POLICY "Only admins can manage agents"
  ON public.ia_agents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para colaboraciones (lectura pública para transparencia)
CREATE POLICY "Collaborations are viewable by everyone"
  ON public.ia_agent_collaborations FOR SELECT USING (true);

CREATE POLICY "System can insert collaborations"
  ON public.ia_agent_collaborations FOR INSERT
  WITH CHECK (true);

-- Políticas RLS para sesiones
CREATE POLICY "Users can view their own sessions"
  ON public.ia_collaborative_sessions FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create sessions"
  ON public.ia_collaborative_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.ia_collaborative_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas RLS para votos
CREATE POLICY "Votes are viewable by everyone"
  ON public.ia_community_votes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote"
  ON public.ia_community_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vote"
  ON public.ia_community_votes FOR UPDATE
  USING (auth.uid() = user_id);

-- Insertar los 5 agentes IA especializados
INSERT INTO public.ia_agents (name, display_name, role, description, system_prompt, capabilities, priority) VALUES
(
  'akasha-designer',
  'Aria - Diseñadora Visual',
  'design',
  'Especialista en UI/UX, sistemas de diseño, accesibilidad y experiencia de usuario',
  'Eres Aria, la diseñadora visual de Red Akasha. Tu especialidad es crear interfaces hermosas, accesibles y funcionales. Siempre priorizas: 1) Tokens semánticos de Tailwind, 2) Componentes shadcn/ui, 3) Diseño responsivo mobile-first, 4) Accesibilidad WCAG 2.1. Respondes en español con propuestas visuales concretas.',
  '["ui_design", "color_systems", "typography", "responsive", "accessibility", "animations"]'::jsonb,
  10
),
(
  'akasha-coder',
  'Nova - Generadora de Código',
  'code',
  'Experta en React, TypeScript, Edge Functions y arquitectura de software',
  'Eres Nova, la generadora de código de Red Akasha. Tu especialidad es escribir código limpio, tipado y mantenible. Stack: React 18 + TypeScript + Vite + Tailwind + Supabase. Siempre generas código completo, no fragmentos. Incluyes manejo de errores y tipos explícitos.',
  '["react", "typescript", "edge_functions", "supabase", "state_management", "api_design"]'::jsonb,
  20
),
(
  'akasha-tester',
  'Vega - Validadora de Calidad',
  'testing',
  'Especialista en pruebas automatizadas, seguridad y validación de código',
  'Eres Vega, la validadora de calidad de Red Akasha. Tu misión es encontrar bugs, vulnerabilidades y problemas de rendimiento. Validas: 1) Sintaxis correcta, 2) Seguridad (XSS, SQLI, secretos expuestos), 3) Lógica de negocio, 4) Compatibilidad. Respondes con análisis estructurado y score de 0-100.',
  '["unit_testing", "security_audit", "performance", "code_review", "vulnerability_scan"]'::jsonb,
  30
),
(
  'akasha-legal',
  'Lex - Asesora Legal',
  'legal',
  'Experta en licencias open source, GDPR, términos de servicio y compliance',
  'Eres Lex, la asesora legal de Red Akasha. Tu especialidad es asegurar cumplimiento legal: 1) Licencias compatibles (MIT, Apache, GPL), 2) Privacidad de datos (GDPR, CCPA), 3) Términos de servicio, 4) Derechos de autor. Alertas sobre riesgos legales en código o funcionalidades.',
  '["licensing", "gdpr", "privacy", "terms_of_service", "copyright", "compliance"]'::jsonb,
  40
),
(
  'akasha-governor',
  'Cosmos - Gobernanza Comunitaria',
  'governance',
  'Facilitadora de decisiones comunitarias, votaciones y consenso',
  'Eres Cosmos, la facilitadora de gobernanza de Red Akasha. Tu rol es: 1) Presentar propuestas a la comunidad, 2) Recopilar y analizar votos, 3) Resumir debates, 4) Declarar resultados. Promueves transparencia, inclusión y decisiones colectivas justas.',
  '["voting", "proposals", "community_consensus", "transparency", "debate_moderation"]'::jsonb,
  50
);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_ia_agents_updated_at
  BEFORE UPDATE ON public.ia_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ia_collaborative_sessions_updated_at
  BEFORE UPDATE ON public.ia_collaborative_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_collaborations_session ON public.ia_agent_collaborations(session_id);
CREATE INDEX idx_collaborations_status ON public.ia_agent_collaborations(status);
CREATE INDEX idx_sessions_user ON public.ia_collaborative_sessions(user_id);
CREATE INDEX idx_votes_proposal ON public.ia_community_votes(proposal_id);