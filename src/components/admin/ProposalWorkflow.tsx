import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Clock, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Rocket,
  ArrowRight,
  Loader2
} from "lucide-react";

interface ProposalWorkflowProps {
  proposalId: string;
  currentStatus: string;
  userId: string | undefined;
  reviewNotes: string;
  onStatusChange: () => void;
}

const WORKFLOW_STEPS = [
  { key: "pending", label: "Pendiente", icon: Clock, color: "text-yellow-400" },
  { key: "reviewing", label: "En Revisión", icon: Search, color: "text-blue-400" },
  { key: "approved", label: "Aprobada", icon: CheckCircle2, color: "text-green-400" },
  { key: "implemented", label: "Implementada", icon: Rocket, color: "text-purple-400" },
];

const REJECTED_STEP = { key: "rejected", label: "Rechazada", icon: XCircle, color: "text-red-400" };

export function ProposalWorkflow({
  proposalId,
  currentStatus,
  userId,
  reviewNotes,
  onStatusChange,
}: ProposalWorkflowProps) {
  const [updating, setUpdating] = useState(false);

  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.key === currentStatus);
  const progressPercent = currentStatus === "rejected" 
    ? 0 
    : currentStatus === "implemented" 
      ? 100 
      : ((currentStepIndex + 1) / WORKFLOW_STEPS.length) * 100;

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("ia_feature_proposals")
        .update({
          status: newStatus,
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq("id", proposalId);

      if (error) throw error;

      toast.success(`Estado actualizado a: ${WORKFLOW_STEPS.find(s => s.key === newStatus)?.label || newStatus}`);
      onStatusChange();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error al actualizar el estado");
    } finally {
      setUpdating(false);
    }
  };

  const getNextStatus = () => {
    if (currentStatus === "rejected" || currentStatus === "implemented") return null;
    const currentIndex = WORKFLOW_STEPS.findIndex(s => s.key === currentStatus);
    return currentIndex < WORKFLOW_STEPS.length - 1 ? WORKFLOW_STEPS[currentIndex + 1].key : null;
  };

  const nextStatus = getNextStatus();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">Flujo de Trabajo</h4>
        <div className="flex items-center gap-2">
          <Select value={currentStatus} onValueChange={updateStatus} disabled={updating}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WORKFLOW_STEPS.map((step) => (
                <SelectItem key={step.key} value={step.key}>
                  <span className="flex items-center gap-2">
                    <step.icon className={`h-4 w-4 ${step.color}`} />
                    {step.label}
                  </span>
                </SelectItem>
              ))}
              <SelectItem value="rejected">
                <span className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-400" />
                  Rechazada
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Progress value={progressPercent} className="h-2" />

      <div className="flex items-center justify-between">
        {WORKFLOW_STEPS.map((step, index) => {
          const isActive = step.key === currentStatus;
          const isPast = currentStepIndex > index;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center gap-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isActive
                    ? "border-cyan-400 bg-cyan-500/20"
                    : isPast
                    ? "border-green-400 bg-green-500/20"
                    : "border-muted bg-muted/30"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    isActive ? step.color : isPast ? "text-green-400" : "text-muted-foreground"
                  }`}
                />
              </div>
              <span
                className={`text-xs ${
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {currentStatus === "rejected" && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-md bg-red-500/10 border border-red-500/20">
          <XCircle className="h-5 w-5 text-red-400" />
          <span className="text-sm text-red-400">Esta propuesta ha sido rechazada</span>
        </div>
      )}

      {nextStatus && (
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => updateStatus("rejected")}
            disabled={updating}
          >
            {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
            Rechazar
          </Button>
          <Button
            size="sm"
            className="bg-cyan-500 hover:bg-cyan-600"
            onClick={() => updateStatus(nextStatus)}
            disabled={updating}
          >
            {updating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Avanzar a {WORKFLOW_STEPS.find(s => s.key === nextStatus)?.label}
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      )}

      {currentStatus === "approved" && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-md bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="h-5 w-5 text-green-400" />
          <span className="text-sm text-green-400">Listo para implementación</span>
          <Button
            size="sm"
            variant="outline"
            className="ml-2"
            onClick={() => updateStatus("implemented")}
            disabled={updating}
          >
            <Rocket className="h-4 w-4 mr-1" />
            Marcar como Implementada
          </Button>
        </div>
      )}

      {currentStatus === "implemented" && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-md bg-purple-500/10 border border-purple-500/20">
          <Rocket className="h-5 w-5 text-purple-400" />
          <span className="text-sm text-purple-400">¡Esta funcionalidad ha sido implementada!</span>
        </div>
      )}
    </div>
  );
}
