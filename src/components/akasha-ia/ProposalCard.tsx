import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Wand2 } from "lucide-react";
import { CodeLifecyclePanel } from "./CodeLifecyclePanel";

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  proposed_code?: string | null;
  created_at: string;
  lifecycle_stage?: string;
  validation_score?: number;
  approvals_count?: number;
  required_approvals?: number;
}

interface ProposalCardProps {
  proposal: Proposal;
  showImplementation?: boolean;
  onStageChange?: () => void;
}

export function ProposalCard({ proposal, showImplementation = false, onStageChange }: ProposalCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400",
      reviewing: "bg-blue-500/20 text-blue-400",
      approved: "bg-green-500/20 text-green-400",
      rejected: "bg-red-500/20 text-red-400",
      implemented: "bg-purple-500/20 text-purple-400",
      implementing: "bg-orange-500/20 text-orange-400",
    };
    const labels: Record<string, string> = {
      pending: "Pendiente",
      reviewing: "En Revisión",
      approved: "Aprobada",
      rejected: "Rechazada",
      implemented: "Implementada",
      implementing: "Implementando",
    };
    return <Badge className={colors[status] || ""}>{labels[status] || status}</Badge>;
  };

  const getLifecycleBadge = (stage?: string) => {
    if (!stage) return null;
    const colors: Record<string, string> = {
      generating: "bg-blue-500/20 text-blue-400",
      validating: "bg-yellow-500/20 text-yellow-400",
      validation_failed: "bg-red-500/20 text-red-400",
      pending_approval: "bg-orange-500/20 text-orange-400",
      approved: "bg-green-500/20 text-green-400",
      rejected: "bg-red-500/20 text-red-400",
      merged: "bg-purple-500/20 text-purple-400",
      deployed: "bg-cyan-500/20 text-cyan-400",
    };
    const labels: Record<string, string> = {
      generating: "Generando",
      validating: "Validando",
      validation_failed: "Falló Validación",
      pending_approval: "Esperando Aprobación",
      approved: "Aprobado",
      rejected: "Rechazado",
      merged: "Integrado",
      deployed: "En Producción",
    };
    return <Badge className={colors[stage] || "bg-muted"}>{labels[stage] || stage}</Badge>;
  };

  const existingCode = proposal.proposed_code ? JSON.parse(proposal.proposed_code) : null;
  const canImplement = showImplementation && ["approved", "reviewing", "pending"].includes(proposal.status);

  return (
    <Card className="bg-muted/30 border border-primary/10 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-foreground">{proposal.title}</h4>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {proposal.lifecycle_stage && getLifecycleBadge(proposal.lifecycle_stage)}
            {getStatusBadge(proposal.status)}
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
          {proposal.description}
        </p>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {new Date(proposal.created_at).toLocaleDateString()}
          </p>
          {proposal.validation_score !== undefined && proposal.validation_score > 0 && (
            <Badge variant="outline" className="text-xs">
              Score: {proposal.validation_score}/100
            </Badge>
          )}
        </div>

        {canImplement && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-primary/30 text-primary"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {isOpen ? "Ocultar Panel de Desarrollo" : "Desarrollar con IA"}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <CodeLifecyclePanel
                proposalId={proposal.id}
                title={proposal.title}
                description={proposal.description}
                existingCode={existingCode}
                lifecycleStage={proposal.lifecycle_stage}
                validationScore={proposal.validation_score}
                approvalsCount={proposal.approvals_count}
                requiredApprovals={proposal.required_approvals}
                onStageChange={onStageChange}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
