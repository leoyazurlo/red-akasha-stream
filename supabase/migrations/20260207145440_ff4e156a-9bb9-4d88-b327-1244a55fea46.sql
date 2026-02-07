-- Corregir warnings de seguridad: hacer la vista SECURITY INVOKER (por defecto)
DROP VIEW IF EXISTS public.ia_proposal_vote_summary;

CREATE VIEW public.ia_proposal_vote_summary 
WITH (security_invoker = true) AS
SELECT 
  proposal_id,
  COUNT(*) FILTER (WHERE vote = 'approve') as approve_count,
  COUNT(*) FILTER (WHERE vote = 'reject') as reject_count,
  COUNT(*) FILTER (WHERE vote = 'abstain') as abstain_count,
  COUNT(*) as total_votes
FROM public.ia_community_votes
GROUP BY proposal_id;

-- Actualizar políticas RLS para ser más restrictivas en INSERT de colaboraciones
DROP POLICY IF EXISTS "System can insert collaborations" ON public.ia_agent_collaborations;

CREATE POLICY "Authenticated users can insert collaborations"
  ON public.ia_agent_collaborations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Las colaboraciones son creadas por edge functions con service role, esto es intencional
-- para permitir que el orquestador registre interacciones entre agentes