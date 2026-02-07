import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  Play,
  RotateCcw,
  Plus,
  Clock,
  Sparkles,
} from "lucide-react";
import { CodePreviewPanel } from "./CodePreviewPanel";

interface GeneratedCode {
  frontend: string;
  backend: string;
  database: string;
}

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: string;
  lifecycle_stage: string | null;
  validation_score: number | null;
  approvals_count: number | null;
  required_approvals: number | null;
  proposed_code: string | null;
  created_at: string;
}

interface Validation {
  id: string;
  validation_type: string;
  status: string;
  ai_feedback: string | null;
}

interface Approval {
  id: string;
  approver_id: string;
  decision: string;
  comments: string | null;
  created_at: string;
  approver_name?: string;
}

interface Deployment {
  id: string;
  pr_url: string | null;
  status: string;
  environment: string;
  deployed_at: string;
}

const LIFECYCLE_STAGES = [
  { key: "draft", label: "Borrador", icon: FileCode, description: "Propuesta creada" },
  { key: "generating", label: "Generando", icon: Code, description: "IA generando código" },
  { key: "validating", label: "Validando", icon: Shield, description: "Pruebas automáticas" },
  { key: "pending_approval", label: "Aprobación", icon: Users, description: "Votación comunitaria" },
  { key: "approved", label: "Aprobado", icon: CheckCircle, description: "Listo para PR" },
  { key: "merged", label: "Integrado", icon: GitBranch, description: "PR en GitHub" },
  { key: "deployed", label: "Producción", icon: Rocket, description: "En vivo" },
];

export function DevelopmentCyclePanel() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [validations, setValidations] = useState<Validation[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [approvalComment, setApprovalComment] = useState("");
  const [newProposalTitle, setNewProposalTitle] = useState("");
  const [newProposalDescription, setNewProposalDescription] = useState("");
  const [showNewProposal, setShowNewProposal] = useState(false);

  useEffect(() => {
    loadProposals();
  }, []);

  useEffect(() => {
    if (selectedProposal) {
      loadProposalDetails(selectedProposal.id);
    }
  }, [selectedProposal?.id]);

  const loadProposals = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("ia_feature_proposals")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) {
      setProposals(data as Proposal[]);
      if (data.length > 0 && !selectedProposal) {
        setSelectedProposal(data[0] as Proposal);
      }
    }
    setIsLoading(false);
  };

  const loadProposalDetails = async (proposalId: string) => {
    // Load validations
    const { data: validationData } = await supabase
      .from("ia_code_validations")
      .select("*")
      .eq("proposal_id", proposalId);
    setValidations((validationData as Validation[]) || []);

    // Load approvals with profile info
    const { data: approvalData } = await supabase
      .from("ia_code_approvals")
      .select("*")
      .eq("proposal_id", proposalId);
    
    if (approvalData && approvalData.length > 0) {
      const approverIds = approvalData.map(a => a.approver_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .in("id", approverIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p.username || p.full_name || "Usuario"]) || []);
      setApprovals(approvalData.map(a => ({
        ...a,
        approver_name: profileMap.get(a.approver_id)
      })) as Approval[]);
    } else {
      setApprovals([]);
    }

    // Load deployments
    const { data: deploymentData } = await supabase
      .from("ia_deployments")
      .select("*")
      .eq("proposal_id", proposalId);
    setDeployments((deploymentData as Deployment[]) || []);

    // Parse generated code if exists
    if (selectedProposal?.proposed_code) {
      try {
        const parsed = JSON.parse(selectedProposal.proposed_code);
        setGeneratedCode(parsed);
      } catch {
        setGeneratedCode(null);
      }
    }
  };

  const createNewProposal = async () => {
    if (!newProposalTitle.trim() || !newProposalDescription.trim()) {
      toast.error("Completa título y descripción");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase.from("ia_feature_proposals").insert([{
      title: newProposalTitle,
      description: newProposalDescription,
      requested_by: user?.id,
      lifecycle_stage: "generating" as const,
      status: "pending",
    }]).select().single();

    if (error) {
      toast.error("Error al crear propuesta");
      return;
    }

    toast.success("Propuesta creada");
    setNewProposalTitle("");
    setNewProposalDescription("");
    setShowNewProposal(false);
    loadProposals();
    if (data) setSelectedProposal(data as Proposal);
  };

  const generateCode = async () => {
    if (!selectedProposal) return;
    
    setIsGenerating(true);
    try {
      await supabase
        .from("ia_feature_proposals")
        .update({ lifecycle_stage: "generating" })
        .eq("id", selectedProposal.id);

      const { data, error } = await supabase.functions.invoke("generate-implementation", {
        body: {
          proposalId: selectedProposal.id,
          title: selectedProposal.title,
          description: selectedProposal.description,
        },
      });

      if (error) throw error;

      const code: GeneratedCode = {
        frontend: data.frontend || "// Sin código frontend",
        backend: data.backend || "// Sin código backend",
        database: data.database || "-- Sin SQL",
      };

      setGeneratedCode(code);

      // Save code to proposal
      await supabase
        .from("ia_feature_proposals")
        .update({ proposed_code: JSON.stringify(code) })
        .eq("id", selectedProposal.id);

      toast.success("Código generado");
      
      // Auto-start validation
      setTimeout(() => validateCode(code), 500);
    } catch (err) {
      console.error(err);
      toast.error("Error al generar código");
    } finally {
      setIsGenerating(false);
      loadProposals();
    }
  };

  const validateCode = async (code?: GeneratedCode) => {
    if (!selectedProposal) return;
    const codeToValidate = code || generatedCode;
    if (!codeToValidate) {
      toast.error("No hay código para validar");
      return;
    }

    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-code", {
        body: {
          proposalId: selectedProposal.id,
          code: codeToValidate,
          title: selectedProposal.title,
          description: selectedProposal.description,
        },
      });

      if (error) throw error;

      if (data.passed) {
        toast.success(`Validación exitosa (${data.score}/100)`);
      } else {
        toast.error(`Validación fallida (${data.score}/100)`);
      }

      loadProposalDetails(selectedProposal.id);
    } catch (err) {
      console.error(err);
      toast.error("Error en validación");
    } finally {
      setIsValidating(false);
      loadProposals();
    }
  };

  const submitApproval = async (decision: "approved" | "rejected") => {
    if (!selectedProposal) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      await supabase.from("ia_code_approvals").upsert({
        proposal_id: selectedProposal.id,
        approver_id: user.id,
        decision,
        comments: approvalComment || null,
      });

      // Check if enough approvals
      const { data: proposal } = await supabase
        .from("ia_feature_proposals")
        .select("approvals_count, required_approvals")
        .eq("id", selectedProposal.id)
        .single();

      if (decision === "approved" && proposal && 
          (proposal.approvals_count || 0) + 1 >= (proposal.required_approvals || 1)) {
        await supabase
          .from("ia_feature_proposals")
          .update({ lifecycle_stage: "approved" })
          .eq("id", selectedProposal.id);
        toast.success("Propuesta aprobada - lista para PR");
      } else if (decision === "rejected") {
        await supabase
          .from("ia_feature_proposals")
          .update({ lifecycle_stage: "rejected" })
          .eq("id", selectedProposal.id);
        toast.error("Propuesta rechazada");
      } else {
        toast.success("Voto registrado");
      }

      setApprovalComment("");
      loadProposalDetails(selectedProposal.id);
      loadProposals();
    } catch (err) {
      console.error(err);
      toast.error("Error al votar");
    }
  };

  const createPullRequest = async () => {
    if (!selectedProposal || !generatedCode) {
      toast.error("Genera código primero");
      return;
    }

    setIsCreatingPR(true);
    try {
      const { data, error } = await supabase.functions.invoke("github-create-pr", {
        body: {
          proposalId: selectedProposal.id,
          title: `[Akasha IA] ${selectedProposal.title}`,
          description: selectedProposal.description,
          frontend: generatedCode.frontend,
          backend: generatedCode.backend,
          database: generatedCode.database,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Create deployment record
      await supabase.from("ia_deployments").insert({
        proposal_id: selectedProposal.id,
        pr_url: data.pullRequestUrl,
        environment: "staging",
        status: "pending",
      });

      await supabase
        .from("ia_feature_proposals")
        .update({ lifecycle_stage: "merged", status: "implementing" })
        .eq("id", selectedProposal.id);

      toast.success("Pull Request creado");
      loadProposalDetails(selectedProposal.id);
      loadProposals();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Error";
      if (msg.includes("GitHub no está configurado")) {
        toast.error("Configura GitHub en Admin > Plataforma");
      } else {
        toast.error(msg);
      }
    } finally {
      setIsCreatingPR(false);
    }
  };

  const markAsDeployed = async () => {
    if (!selectedProposal) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase
        .from("ia_deployments")
        .update({ status: "success", deployed_by: user?.id })
        .eq("proposal_id", selectedProposal.id)
        .eq("status", "pending");

      await supabase
        .from("ia_feature_proposals")
        .update({ lifecycle_stage: "deployed", status: "implemented" })
        .eq("id", selectedProposal.id);

      toast.success("Desplegado en producción");
      loadProposals();
      loadProposalDetails(selectedProposal.id);
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar");
    }
  };

  const getStageIndex = (stage: string | null) => {
    return LIFECYCLE_STAGES.findIndex(s => s.key === stage) || 0;
  };

  const getStageColor = (stage: string | null) => {
    const colors: Record<string, string> = {
      draft: "text-gray-400",
      generating: "text-blue-400",
      validating: "text-yellow-400",
      pending_approval: "text-orange-400",
      approved: "text-green-400",
      merged: "text-purple-400",
      deployed: "text-cyan-400",
      rejected: "text-red-400",
      validation_failed: "text-red-400",
    };
    return colors[stage || "draft"] || "text-gray-400";
  };

  return (
    <div className="space-y-6">
      {/* Lifecycle Overview */}
      <Card className="bg-card/50 border-cyan-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-cyan-400" />
            Ciclo de Desarrollo Completo
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Creación → Prueba → Integración → Producción
          </p>
        </CardHeader>
        <CardContent>
          {/* Visual Lifecycle Steps */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            {LIFECYCLE_STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const currentIdx = getStageIndex(selectedProposal?.lifecycle_stage);
              const isActive = idx === currentIdx;
              const isComplete = idx < currentIdx;
              const isFailed = selectedProposal?.lifecycle_stage === "validation_failed" && stage.key === "validating";
              const isRejected = selectedProposal?.lifecycle_stage === "rejected" && stage.key === "pending_approval";

              return (
                <div key={stage.key} className="flex items-center">
                  <div className={`flex flex-col items-center min-w-[70px] ${
                    isActive ? getStageColor(stage.key) :
                    isComplete ? "text-green-400" :
                    isFailed || isRejected ? "text-red-400" :
                    "text-muted-foreground/40"
                  }`}>
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                      ${isActive ? "border-current bg-current/20 ring-2 ring-current/30" :
                        isComplete ? "border-green-500 bg-green-500/20" :
                        isFailed || isRejected ? "border-red-500 bg-red-500/20" :
                        "border-muted-foreground/30"}
                    `}>
                      {isComplete ? <CheckCircle className="h-5 w-5" /> :
                       isFailed || isRejected ? <XCircle className="h-5 w-5" /> :
                       <Icon className="h-5 w-5" />}
                    </div>
                    <span className="text-xs mt-1.5 font-medium">{stage.label}</span>
                    <span className="text-[10px] text-muted-foreground hidden sm:block">{stage.description}</span>
                  </div>
                  {idx < LIFECYCLE_STAGES.length - 1 && (
                    <ArrowRight className={`h-4 w-4 mx-1 flex-shrink-0 ${isComplete ? "text-green-500" : "text-muted-foreground/30"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Proposals List */}
        <Card className="bg-card/50 border-cyan-500/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Propuestas</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setShowNewProposal(!showNewProposal)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            {showNewProposal && (
              <div className="p-3 mb-2 space-y-2 bg-muted/30 rounded-lg">
                <Input
                  placeholder="Título de la propuesta"
                  value={newProposalTitle}
                  onChange={(e) => setNewProposalTitle(e.target.value)}
                  className="bg-muted/50"
                />
                <Textarea
                  placeholder="Descripción detallada..."
                  value={newProposalDescription}
                  onChange={(e) => setNewProposalDescription(e.target.value)}
                  className="bg-muted/50 min-h-[60px]"
                />
                <Button size="sm" onClick={createNewProposal} className="w-full bg-cyan-500 hover:bg-cyan-600">
                  Crear Propuesta
                </Button>
              </div>
            )}
            <ScrollArea className="h-[300px]">
              <div className="space-y-1">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                  </div>
                ) : proposals.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay propuestas
                  </p>
                ) : (
                  proposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className={`p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedProposal?.id === proposal.id ? "bg-cyan-500/10 border border-cyan-500/30" : ""
                      }`}
                      onClick={() => setSelectedProposal(proposal)}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          proposal.lifecycle_stage === "deployed" ? "bg-cyan-400" :
                          proposal.lifecycle_stage === "rejected" ? "bg-red-400" :
                          proposal.lifecycle_stage === "approved" ? "bg-green-400" :
                          "bg-yellow-400"
                        }`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{proposal.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] h-4">
                              {LIFECYCLE_STAGES.find(s => s.key === proposal.lifecycle_stage)?.label || proposal.status}
                            </Badge>
                            {proposal.validation_score && (
                              <span className="text-[10px] text-muted-foreground">
                                {proposal.validation_score}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Proposal Details & Actions */}
        <Card className="lg:col-span-2 bg-card/50 border-cyan-500/20">
          <CardContent className="p-4">
            {!selectedProposal ? (
              <div className="text-center py-12 text-muted-foreground">
                <Code className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Selecciona una propuesta para ver su ciclo de desarrollo</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedProposal.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{selectedProposal.description}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {(!selectedProposal.lifecycle_stage || selectedProposal.lifecycle_stage === "draft") && (
                    <Button onClick={generateCode} disabled={isGenerating} className="bg-cyan-500 hover:bg-cyan-600">
                      {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Code className="h-4 w-4 mr-2" />}
                      1. Generar Código
                    </Button>
                  )}

                  {(selectedProposal.lifecycle_stage === "generating" || selectedProposal.lifecycle_stage === "validation_failed") && generatedCode && (
                    <Button onClick={() => validateCode()} disabled={isValidating} variant="outline" className="border-yellow-500/30 text-yellow-400">
                      {isValidating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                      2. Validar Código
                    </Button>
                  )}

                  {selectedProposal.lifecycle_stage === "approved" && (
                    <Button onClick={createPullRequest} disabled={isCreatingPR} variant="outline" className="border-purple-500/30 text-purple-400">
                      {isCreatingPR ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <GitBranch className="h-4 w-4 mr-2" />}
                      4. Crear Pull Request
                    </Button>
                  )}

                  {selectedProposal.lifecycle_stage === "merged" && (
                    <Button onClick={markAsDeployed} variant="outline" className="border-cyan-500/30 text-cyan-400">
                      <Rocket className="h-4 w-4 mr-2" />
                      5. Marcar como Desplegado
                    </Button>
                  )}
                </div>

                {/* Tabs for Details */}
                <Tabs defaultValue="validations" className="mt-4">
                  <TabsList className="bg-muted/50">
                    <TabsTrigger value="validations" className="gap-1.5">
                      <Shield className="h-3.5 w-3.5" />
                      Pruebas
                    </TabsTrigger>
                    <TabsTrigger value="governance" className="gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Gobernanza
                    </TabsTrigger>
                    <TabsTrigger value="code" className="gap-1.5">
                      <FileCode className="h-3.5 w-3.5" />
                      Código
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </TabsTrigger>
                    <TabsTrigger value="deployment" className="gap-1.5">
                      <Rocket className="h-3.5 w-3.5" />
                      Despliegue
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="validations" className="mt-4">
                    {validations.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        Genera código para iniciar las pruebas automáticas
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {validations.map((v) => (
                          <div key={v.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                            {v.status === "passed" ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : v.status === "failed" ? (
                              <XCircle className="h-4 w-4 text-red-400" />
                            ) : (
                              <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium capitalize">{v.validation_type}</p>
                              {v.ai_feedback && (
                                <p className="text-xs text-muted-foreground">{v.ai_feedback}</p>
                              )}
                            </div>
                            <Badge variant={v.status === "passed" ? "default" : v.status === "failed" ? "destructive" : "secondary"}>
                              {v.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="governance" className="mt-4 space-y-4">
                    {selectedProposal.lifecycle_stage === "pending_approval" && (
                      <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <p className="text-sm text-orange-400 mb-3">
                          Esta propuesta está pendiente de aprobación comunitaria
                        </p>
                        <Textarea
                          placeholder="Comentario opcional..."
                          value={approvalComment}
                          onChange={(e) => setApprovalComment(e.target.value)}
                          className="mb-3 bg-muted/30"
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => submitApproval("approved")} className="flex-1 bg-green-600 hover:bg-green-700">
                            <ThumbsUp className="h-4 w-4 mr-2" />
                            Aprobar
                          </Button>
                          <Button onClick={() => submitApproval("rejected")} variant="destructive" className="flex-1">
                            <ThumbsDown className="h-4 w-4 mr-2" />
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    )}

                    {approvals.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Votos ({approvals.length})</p>
                        {approvals.map((a) => (
                          <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                            {a.decision === "approved" ? (
                              <ThumbsUp className="h-4 w-4 text-green-400" />
                            ) : (
                              <ThumbsDown className="h-4 w-4 text-red-400" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm">{a.approver_name || "Usuario"}</p>
                              {a.comments && <p className="text-xs text-muted-foreground">{a.comments}</p>}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(a.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="code" className="mt-4">
                    {generatedCode ? (
                      <Tabs defaultValue="frontend">
                        <TabsList className="bg-muted/30 mb-2">
                          <TabsTrigger value="frontend">Frontend</TabsTrigger>
                          <TabsTrigger value="backend">Backend</TabsTrigger>
                          <TabsTrigger value="database">Database</TabsTrigger>
                        </TabsList>
                        <TabsContent value="frontend">
                          <ScrollArea className="h-[200px] rounded-md border border-cyan-500/20 bg-black/50">
                            <pre className="p-4 text-sm text-green-400 font-mono whitespace-pre-wrap">
                              {generatedCode.frontend}
                            </pre>
                          </ScrollArea>
                        </TabsContent>
                        <TabsContent value="backend">
                          <ScrollArea className="h-[200px] rounded-md border border-cyan-500/20 bg-black/50">
                            <pre className="p-4 text-sm text-blue-400 font-mono whitespace-pre-wrap">
                              {generatedCode.backend}
                            </pre>
                          </ScrollArea>
                        </TabsContent>
                        <TabsContent value="database">
                          <ScrollArea className="h-[200px] rounded-md border border-cyan-500/20 bg-black/50">
                            <pre className="p-4 text-sm text-yellow-400 font-mono whitespace-pre-wrap">
                              {generatedCode.database}
                            </pre>
                          </ScrollArea>
                        </TabsContent>
                      </Tabs>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No hay código generado
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="preview" className="mt-4">
                    {generatedCode ? (
                      <CodePreviewPanel code={generatedCode} title={selectedProposal.title} />
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        Genera código para ver la vista previa
                      </p>
                    )}
                  </TabsContent>

                  <TabsContent value="deployment" className="mt-4">
                    {deployments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        Sin despliegues aún
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {deployments.map((d) => (
                          <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                            {d.status === "success" ? (
                              <CheckCircle className="h-5 w-5 text-green-400" />
                            ) : (
                              <Clock className="h-5 w-5 text-yellow-400" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium capitalize">{d.environment}</p>
                              {d.pr_url && (
                                <a href={d.pr_url} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
                                  Ver PR <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                            <Badge variant={d.status === "success" ? "default" : "secondary"}>
                              {d.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
