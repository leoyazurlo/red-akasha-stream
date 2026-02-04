import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Wand2 } from "lucide-react";
import { ImplementationPanel } from "./ImplementationPanel";

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  proposed_code?: string | null;
  created_at: string;
}

interface ProposalCardProps {
  proposal: Proposal;
  showImplementation?: boolean;
}

export function ProposalCard({ proposal, showImplementation = false }: ProposalCardProps) {
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

  const existingCode = proposal.proposed_code ? JSON.parse(proposal.proposed_code) : null;
  const canImplement = showImplementation && ["approved", "reviewing"].includes(proposal.status);

  return (
    <Card className="bg-muted/30 border border-cyan-500/10 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-medium text-foreground">{proposal.title}</h4>
          <div className="flex items-center gap-2">
            {getStatusBadge(proposal.status)}
          </div>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
          {proposal.description}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(proposal.created_at).toLocaleDateString()}
        </p>

        {canImplement && (
          <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-cyan-500/30 text-cyan-400"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {isOpen ? "Ocultar" : "Implementar con IA"}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <ImplementationPanel
                proposalId={proposal.id}
                title={proposal.title}
                description={proposal.description}
                existingCode={existingCode}
              />
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
