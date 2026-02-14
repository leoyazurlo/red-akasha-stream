import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Code,
  Database,
  Server,
  GitBranch,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Wand2,
  FileCode,
  Eye,
  ArrowRight,
  Rocket,
  Shield,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Users,
  Settings,
  Play,
  RotateCcw,
} from "lucide-react";
import { CodePreviewPanel } from "./CodePreviewPanel";

interface GeneratedCode {
  frontend: string;
  backend: string;
  database: string;
  rawResponse?: string;
  generatedAt?: string;
}

interface Validation {
  id: string;
  validation_type: string;
  status: string;
  ai_feedback: string | null;
  details: Record<string, unknown> | null;
}

interface Approval {
  id: string;
  approver_id: string;
  decision: string;
  comments: string | null;
  created_at: string;
  profiles?: {
    username: string | null;
    full_name: string | null;
  };
}

interface Deployment {
  id: string;
  pr_url: string | null;
  merge_commit: string | null;
  deployed_at: string;
  environment: string;
  status: string;
}

interface CodeLifecyclePanelProps {
  proposalId: string;
  title: string;
  description: string;
  existingCode?: GeneratedCode | null;
  lifecycleStage?: string;
  validationScore?: number;
  approvalsCount?: number;
  requiredApprovals?: number;
  onCodeGenerated?: (code: GeneratedCode) => void;
  onStageChange?: () => void;
}

const LIFECYCLE_STAGES = [
  { key: "generating", label: "Generando", icon: Code, color: "text-blue-400" },
  { key: "validating", label: "Validando", icon: Shield, color: "text-yellow-400" },
  { key: "pending_approval", label: "Aprobación", icon: Users, color: "text-orange-400" },
  { key: "approved", label: "Aprobado", icon: CheckCircle, color: "text-green-400" },
  { key: "merged", label: "Integrado", icon: GitBranch, color: "text-purple-400" },
  { key: "deployed", label: "Producción", icon: Rocket, color: "text-cyan-400" },
];

export function CodeLifecyclePanel({
  proposalId,
  title,
  description,
  existingCode,
  lifecycleStage = "generating",
  validationScore = 0,
  approvalsCount = 0,
  requiredApprovals = 1,
  onCodeGenerated,
  onStageChange,
}: CodeLifecyclePanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(existingCode || null);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validations, setValidations] = useState<Validation[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [approvalComment, setApprovalComment] = useState("");
  const [currentStage, setCurrentStage] = useState(lifecycleStage);

  useEffect(() => {
    loadValidations();
    loadApprovals();
    loadDeployments();
  }, [proposalId]);

  useEffect(() => {
    setCurrentStage(lifecycleStage);
  }, [lifecycleStage]);

  const loadValidations = async () => {
    const { data } = await supabase
      .from("ia_code_validations")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("created_at");
    if (data) setValidations(data as Validation[]);
  };

  const loadApprovals = async () => {
    const { data } = await supabase
      .from("ia_code_approvals")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("created_at", { ascending: false });
    
    if (data) {
      // Fetch profiles
      const approverIds = data.map(a => a.approver_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .in("id", approverIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      setApprovals(data.map(a => ({
        ...a,
        profiles: profileMap.get(a.approver_id)
      })) as Approval[]);
    }
  };

  const loadDeployments = async () => {
    const { data } = await supabase
      .from("ia_deployments")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("deployed_at", { ascending: false });
    if (data) setDeployments(data as Deployment[]);
  };

  const getCurrentStageIndex = () => {
    return LIFECYCLE_STAGES.findIndex(s => s.key === currentStage);
  };

  const generateImplementation = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Update stage
      await supabase
        .from("ia_feature_proposals")
        .update({ lifecycle_stage: "generating" })
        .eq("id", proposalId);
      setCurrentStage("generating");

      const { data, error: fnError } = await supabase.functions.invoke("generate-implementation", {
        body: { proposalId, title, description },
      });

      if (fnError) throw fnError;

      const code: GeneratedCode = {
        frontend: data.frontend || "// No se generó código frontend",
        backend: data.backend || "// No se generó código backend",
        database: data.database || "-- No se generó código de base de datos",
      };

      setGeneratedCode(code);
      onCodeGenerated?.(code);
      toast.success("Código generado exitosamente");
      
      // Auto-start validation
      setTimeout(() => validateCode(code), 500);
    } catch (err) {
      console.error("Error generating implementation:", err);
      setError("Error al generar la implementación");
      toast.error("Error al generar código");
    } finally {
      setIsGenerating(false);
    }
  };

  const validateCode = async (code?: GeneratedCode) => {
    const codeToValidate = code || generatedCode;
    if (!codeToValidate) {
      toast.error("No hay código para validar");
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("validate-code", {
        body: {
          proposalId,
          code: codeToValidate,
          title,
          description,
        },
      });

      if (fnError) throw fnError;

      await loadValidations();
      
      if (data.passed) {
        setCurrentStage("pending_approval");
        toast.success(`Validación exitosa (${data.score}/100)`);
      } else {
        setCurrentStage("validation_failed");
        toast.error(`Validación fallida (${data.score}/100)`);
      }
      
      onStageChange?.();
    } catch (err) {
      console.error("Error validating code:", err);
      setError("Error al validar el código");
      toast.error("Error en la validación");
    } finally {
      setIsValidating(false);
    }
  };

  const submitApproval = async (decision: "approved" | "rejected") => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const { error } = await supabase.from("ia_code_approvals").upsert({
        proposal_id: proposalId,
        approver_id: user.id,
        decision,
        comments: approvalComment || null,
      });

      if (error) throw error;

      // Check if we have enough approvals
      const { data: proposal } = await supabase
        .from("ia_feature_proposals")
        .select("approvals_count, required_approvals")
        .eq("id", proposalId)
        .single();

      if (decision === "approved" && proposal && (proposal.approvals_count || 0) + 1 >= (proposal.required_approvals || 1)) {
        await supabase
          .from("ia_feature_proposals")
          .update({ lifecycle_stage: "approved" })
          .eq("id", proposalId);
        setCurrentStage("approved");
        toast.success("Propuesta aprobada - lista para integración");
      } else if (decision === "rejected") {
        await supabase
          .from("ia_feature_proposals")
          .update({ lifecycle_stage: "rejected" })
          .eq("id", proposalId);
        setCurrentStage("rejected");
        toast.error("Propuesta rechazada");
      } else {
        toast.success(`Voto registrado: ${decision === "approved" ? "Aprobado" : "Rechazado"}`);
      }

      setApprovalComment("");
      await loadApprovals();
      onStageChange?.();
    } catch (err) {
      console.error("Error submitting approval:", err);
      toast.error("Error al registrar el voto");
    }
  };

  const createPullRequest = async () => {
    if (!generatedCode) {
      toast.error("Primero genera el código");
      return;
    }

    setIsCreatingPR(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("github-create-pr", {
        body: {
          proposalId,
          title: `[Akasha IA] ${title}`,
          description,
          frontend: generatedCode.frontend,
          backend: generatedCode.backend,
          database: generatedCode.database,
        },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setPrUrl(data.pullRequestUrl);

      // Create deployment record
      await supabase.from("ia_deployments").insert({
        proposal_id: proposalId,
        pr_url: data.pullRequestUrl,
        environment: "staging",
        status: "pending",
      });

      // Update stage
      await supabase
        .from("ia_feature_proposals")
        .update({ lifecycle_stage: "merged", review_notes: `PR: ${data.pullRequestUrl}` })
        .eq("id", proposalId);
      
      setCurrentStage("merged");
      toast.success("Pull Request creado exitosamente");
      await loadDeployments();
      onStageChange?.();
    } catch (err: any) {
      console.error("Error creating PR:", err);
      let message = "Error al crear el PR";
      if (err instanceof Error) message = err.message;
      if (message.includes("Token") || message.includes("token") || message.includes("Bad credentials") || message.includes("non-2xx")) {
        setError("Token de GitHub inválido o expirado. Actualízalo en Admin → Configuración → GitHub.");
        toast.error("Token de GitHub expirado", { description: "Actualízalo en Admin → Configuración de Plataforma → GitHub" });
      } else if (message.includes("GitHub no está configurado")) {
        setError(message);
        toast.error("Configura GitHub en Ajustes de Plataforma");
      } else {
        setError(message);
        toast.error(message);
      }
    } finally {
      setIsCreatingPR(false);
    }
  };

  const markAsDeployed = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from("ia_deployments")
        .update({ status: "success", deployed_by: user?.id })
        .eq("proposal_id", proposalId)
        .eq("status", "pending");

      await supabase
        .from("ia_feature_proposals")
        .update({ lifecycle_stage: "deployed", status: "implemented" })
        .eq("id", proposalId);

      setCurrentStage("deployed");
      toast.success("Marcado como desplegado en producción");
      await loadDeployments();
      onStageChange?.();
    } catch (err) {
      console.error("Error marking as deployed:", err);
      toast.error("Error al actualizar el estado");
    }
  };

  const getValidationIcon = (status: string) => {
    switch (status) {
      case "passed": return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-400" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      default: return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
  };

  const hasCode = generatedCode && (
    generatedCode.frontend !== "// No se generó código frontend" ||
    generatedCode.backend !== "// No se generó código backend" ||
    generatedCode.database !== "-- No se generó código de base de datos"
  );

  return (
    <Card className="bg-card/50 border-cyan-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wand2 className="h-5 w-5 text-cyan-400" />
          Ciclo de Desarrollo IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lifecycle Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso del ciclo</span>
            <Badge className="bg-cyan-500/20 text-cyan-400">
              {LIFECYCLE_STAGES.find(s => s.key === currentStage)?.label || currentStage}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            {LIFECYCLE_STAGES.map((stage, index) => {
              const StageIcon = stage.icon;
              const currentIndex = getCurrentStageIndex();
              const isActive = index === currentIndex;
              const isComplete = index < currentIndex;
              const isFailed = currentStage === "validation_failed" && stage.key === "validating";
              const isRejected = currentStage === "rejected" && stage.key === "pending_approval";
              
              return (
                <div key={stage.key} className="flex items-center flex-1">
                  <div className={`
                    flex flex-col items-center flex-1
                    ${isActive ? stage.color : isComplete ? "text-green-400" : isFailed || isRejected ? "text-red-400" : "text-muted-foreground/40"}
                  `}>
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                      ${isActive ? `border-current bg-current/20` : 
                        isComplete ? "border-green-500 bg-green-500/20" : 
                        isFailed || isRejected ? "border-red-500 bg-red-500/20" :
                        "border-muted-foreground/30"}
                    `}>
                      {isComplete ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : isFailed || isRejected ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <StageIcon className="h-4 w-4" />
                      )}
                    </div>
                    <span className="text-[10px] mt-1 text-center leading-tight">{stage.label}</span>
                  </div>
                  {index < LIFECYCLE_STAGES.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 ${isComplete ? "bg-green-500" : "bg-muted-foreground/20"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons Based on Stage */}
        <div className="flex flex-wrap gap-2">
          {(currentStage === "generating" || !hasCode) && (
            <Button
              onClick={generateImplementation}
              disabled={isGenerating}
              className="bg-cyan-500 hover:bg-cyan-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Code className="h-4 w-4 mr-2" />
                  1. Generar Código
                </>
              )}
            </Button>
          )}

          {hasCode && (currentStage === "validation_failed" || currentStage === "generating") && (
            <Button
              onClick={() => validateCode()}
              disabled={isValidating}
              variant="outline"
              className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  2. Validar con IA
                </>
              )}
            </Button>
          )}

          {currentStage === "approved" && (
            <Button
              onClick={createPullRequest}
              disabled={isCreatingPR}
              className="bg-green-500 hover:bg-green-600"
            >
              {isCreatingPR ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando PR...
                </>
              ) : (
                <>
                  <GitBranch className="h-4 w-4 mr-2" />
                  4. Crear Pull Request
                </>
              )}
            </Button>
          )}

          {currentStage === "merged" && (
            <Button
              onClick={markAsDeployed}
              className="bg-purple-500 hover:bg-purple-600"
            >
              <Rocket className="h-4 w-4 mr-2" />
              5. Marcar como Desplegado
            </Button>
          )}

          {(currentStage === "validation_failed" || currentStage === "rejected") && (
            <Button
              onClick={generateImplementation}
              variant="outline"
              className="border-cyan-500/30"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Regenerar Código
            </Button>
          )}
        </div>

        {/* Validation Results */}
        {validations.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-yellow-400" />
                Resultados de Validación
              </span>
              {validationScore > 0 && (
                <Badge className={validationScore >= 70 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                  {validationScore}/100
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {validations.map(v => (
                <div key={v.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border/50">
                  {getValidationIcon(v.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium capitalize">{v.validation_type}</p>
                    {v.ai_feedback && (
                      <p className="text-[10px] text-muted-foreground line-clamp-1">{v.ai_feedback}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approval Section */}
        {currentStage === "pending_approval" && (
          <div className="space-y-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-400" />
                Aprobaciones ({approvalsCount}/{requiredApprovals})
              </span>
              <Progress value={(approvalsCount / requiredApprovals) * 100} className="w-24 h-2" />
            </div>
            
            {approvals.length > 0 && (
              <div className="space-y-1">
                {approvals.map(a => (
                  <div key={a.id} className="flex items-center gap-2 text-xs">
                    {a.decision === "approved" ? (
                      <ThumbsUp className="h-3 w-3 text-green-400" />
                    ) : (
                      <ThumbsDown className="h-3 w-3 text-red-400" />
                    )}
                    <span>{a.profiles?.full_name || a.profiles?.username || "Admin"}</span>
                    {a.comments && <span className="text-muted-foreground">- {a.comments}</span>}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Textarea
                placeholder="Comentarios sobre tu decisión..."
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => submitApproval("approved")}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600"
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  Aprobar
                </Button>
                <Button
                  onClick={() => submitApproval("rejected")}
                  size="sm"
                  variant="destructive"
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  Rechazar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* PR Status */}
        {(prUrl || deployments.some(d => d.pr_url)) && (
          <div className="space-y-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-400">Pull Request Creado</span>
            </div>
            <a
              href={prUrl || deployments[0]?.pr_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-cyan-400 hover:underline flex items-center gap-1"
            >
              Ver en GitHub <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Deployment History */}
        {deployments.length > 0 && currentStage === "deployed" && (
          <div className="space-y-2 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Desplegado en Producción</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Desplegado el {new Date(deployments[0]?.deployed_at).toLocaleString()}
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <XCircle className="h-5 w-5 text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

        {/* Generated Code Preview with Visual Preview Tab */}
        {generatedCode && (
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="bg-muted/50 w-full justify-start flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="preview" className="gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                Vista Previa
              </TabsTrigger>
              <TabsTrigger value="frontend" className="gap-1.5">
                <FileCode className="h-3.5 w-3.5" />
                Frontend
              </TabsTrigger>
              <TabsTrigger value="backend" className="gap-1.5">
                <Server className="h-3.5 w-3.5" />
                Backend
              </TabsTrigger>
              <TabsTrigger value="database" className="gap-1.5">
                <Database className="h-3.5 w-3.5" />
                Database
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-4">
              <CodePreviewPanel code={generatedCode} title={title} />
            </TabsContent>

            <TabsContent value="frontend">
              <ScrollArea className="h-[300px] rounded-md border border-primary/20 bg-black/50">
                <pre className="p-4 text-sm text-green-400 font-mono whitespace-pre-wrap">
                  {generatedCode.frontend}
                </pre>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="backend">
              <ScrollArea className="h-[300px] rounded-md border border-primary/20 bg-black/50">
                <pre className="p-4 text-sm text-blue-400 font-mono whitespace-pre-wrap">
                  {generatedCode.backend}
                </pre>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="database">
              <ScrollArea className="h-[300px] rounded-md border border-primary/20 bg-black/50">
                <pre className="p-4 text-sm text-yellow-400 font-mono whitespace-pre-wrap">
                  {generatedCode.database}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        {!generatedCode && !isGenerating && (
          <div className="text-center py-8 text-muted-foreground">
            <Code className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              Haz clic en "Generar Código" para iniciar el ciclo de desarrollo
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
