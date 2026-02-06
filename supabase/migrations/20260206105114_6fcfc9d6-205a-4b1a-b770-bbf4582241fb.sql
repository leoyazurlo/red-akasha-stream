-- =============================================
-- GOVERNANCE SYSTEM FOR AKASHA IA CODE CYCLE
-- =============================================

-- Enum for proposal workflow stages
CREATE TYPE public.code_lifecycle_stage AS ENUM (
  'generating',     -- IA está generando código
  'validating',     -- Ejecutando validación IA
  'validation_failed', -- Falló la validación
  'pending_approval', -- Esperando aprobaciones
  'approved',       -- Aprobado, listo para merge
  'merged',         -- Mergeado a rama principal
  'deployed',       -- Desplegado a producción
  'rejected'        -- Rechazado
);

-- Table to track code validations
CREATE TABLE public.ia_code_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.ia_feature_proposals(id) ON DELETE CASCADE,
  validation_type TEXT NOT NULL, -- 'syntax', 'security', 'logic', 'compatibility'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'passed', 'failed'
  details JSONB DEFAULT '{}',
  ai_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Table to track approvals
CREATE TABLE public.ia_code_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.ia_feature_proposals(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision TEXT NOT NULL, -- 'approved', 'rejected', 'changes_requested'
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(proposal_id, approver_id)
);

-- Table for deployment history
CREATE TABLE public.ia_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.ia_feature_proposals(id) ON DELETE CASCADE,
  pr_url TEXT,
  merge_commit TEXT,
  deployed_by UUID REFERENCES auth.users(id),
  deployed_at TIMESTAMPTZ DEFAULT now(),
  environment TEXT DEFAULT 'production', -- 'staging', 'production'
  status TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed'
  deployment_notes TEXT
);

-- Add lifecycle stage to proposals
ALTER TABLE public.ia_feature_proposals 
ADD COLUMN IF NOT EXISTS lifecycle_stage public.code_lifecycle_stage DEFAULT 'generating';

ALTER TABLE public.ia_feature_proposals 
ADD COLUMN IF NOT EXISTS validation_score INTEGER DEFAULT 0;

ALTER TABLE public.ia_feature_proposals 
ADD COLUMN IF NOT EXISTS approvals_count INTEGER DEFAULT 0;

ALTER TABLE public.ia_feature_proposals 
ADD COLUMN IF NOT EXISTS required_approvals INTEGER DEFAULT 1;

-- Platform setting for default required approvals
INSERT INTO public.platform_payment_settings (setting_key, setting_value, description)
VALUES ('ia_required_approvals', '1', 'Número mínimo de aprobaciones requeridas para integrar código')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable RLS
ALTER TABLE public.ia_code_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_code_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ia_deployments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for validations (admins only)
CREATE POLICY "Admins can view all validations"
ON public.ia_code_validations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert validations"
ON public.ia_code_validations FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update validations"
ON public.ia_code_validations FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for approvals (admins only)
CREATE POLICY "Admins can view all approvals"
ON public.ia_code_approvals FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert approvals"
ON public.ia_code_approvals FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update own approvals"
ON public.ia_code_approvals FOR UPDATE
TO authenticated
USING (approver_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete own approvals"
ON public.ia_code_approvals FOR DELETE
TO authenticated
USING (approver_id = auth.uid() AND public.has_role(auth.uid(), 'admin'));

-- RLS Policies for deployments (admins only)
CREATE POLICY "Admins can view all deployments"
ON public.ia_deployments FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert deployments"
ON public.ia_deployments FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update deployments"
ON public.ia_deployments FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to update approvals count
CREATE OR REPLACE FUNCTION public.update_proposal_approvals_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE ia_feature_proposals
    SET approvals_count = (
      SELECT COUNT(*) FROM ia_code_approvals
      WHERE proposal_id = NEW.proposal_id AND decision = 'approved'
    )
    WHERE id = NEW.proposal_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ia_feature_proposals
    SET approvals_count = (
      SELECT COUNT(*) FROM ia_code_approvals
      WHERE proposal_id = OLD.proposal_id AND decision = 'approved'
    )
    WHERE id = OLD.proposal_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger for approvals count
CREATE TRIGGER trigger_update_approvals_count
AFTER INSERT OR UPDATE OR DELETE ON public.ia_code_approvals
FOR EACH ROW EXECUTE FUNCTION public.update_proposal_approvals_count();

-- Index for performance
CREATE INDEX idx_validations_proposal ON public.ia_code_validations(proposal_id);
CREATE INDEX idx_approvals_proposal ON public.ia_code_approvals(proposal_id);
CREATE INDEX idx_deployments_proposal ON public.ia_deployments(proposal_id);