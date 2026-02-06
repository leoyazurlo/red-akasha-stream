import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ProposalCodePreview } from "@/components/admin/ProposalCodePreview";
import { ProposalWorkflow } from "@/components/admin/ProposalWorkflow";
import { AIProviderManager } from "@/components/admin/AIProviderManager";
import { LovableInstructionsGenerator } from "@/components/admin/LovableInstructionsGenerator";
import { CodeLifecyclePanel } from "@/components/akasha-ia/CodeLifecyclePanel";
import { GovernanceSettings } from "@/components/admin/GovernanceSettings";
import { 
  Bot, 
  Users, 
  Key, 
  Lightbulb, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Eye,
  Settings,
  Loader2,
  Search,
  Sparkles,
  RefreshCw,
  MessageSquare,
  Code,
  ArrowRight,
  Shield,
  Rocket,
  GitBranch,
} from "lucide-react";

interface AuthorizedUser {
  id: string;
  user_id: string;
  is_active: boolean;
  authorized_at: string;
  notes: string | null;
  profiles?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface APIConfig {
  id: string;
  provider: string;
  display_name: string;
  is_active: boolean;
  is_default: boolean;
  config: Record<string, unknown>;
}

interface FeatureProposal {
  id: string;
  title: string;
  description: string;
  proposed_code: string | null;
  ai_reasoning: string | null;
  status: string;
  priority: string;
  category: string | null;
  review_notes: string | null;
  created_at: string;
  requested_by: string | null;
  lifecycle_stage: string | null;
  validation_score: number | null;
  approvals_count: number | null;
  required_approvals: number | null;
  profiles?: {
    username: string | null;
    full_name: string | null;
  };
}

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
}

export default function IAManagement() {
  const { user } = useAuth(true);
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([]);
  const [apiConfigs, setApiConfigs] = useState<APIConfig[]>([]);
  const [proposals, setProposals] = useState<FeatureProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<FeatureProposal | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [analyzingForum, setAnalyzingForum] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadAuthorizedUsers(),
      loadAPIConfigs(),
      loadProposals(),
    ]);
    setLoading(false);
  };

  const loadAuthorizedUsers = async () => {
    const { data } = await supabase
      .from("ia_authorized_users")
      .select("*")
      .order("authorized_at", { ascending: false });

    if (data) {
      // Fetch profiles separately
      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      setAuthorizedUsers(data.map(d => ({
        ...d,
        profiles: profileMap.get(d.user_id) || { username: null, full_name: null, avatar_url: null }
      })) as AuthorizedUser[]);
    }
  };

  const loadAPIConfigs = async () => {
    const { data } = await supabase
      .from("ia_api_configs")
      .select("*")
      .order("created_at");

    if (data) {
      setApiConfigs(data.map(c => ({
        ...c,
        config: (c.config as Record<string, unknown>) || {}
      })));
    }
  };

  const loadProposals = async () => {
    const { data } = await supabase
      .from("ia_feature_proposals")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch profiles separately
      const userIds = data.filter(d => d.requested_by).map(d => d.requested_by!);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      setProposals(data.map(d => ({
        ...d,
        profiles: d.requested_by ? profileMap.get(d.requested_by) || { username: null, full_name: null } : undefined
      })) as FeatureProposal[]);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, full_name")
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10);

    setSearchResults(data || []);
    setSearching(false);
  };

  const authorizeUser = async (userId: string) => {
    const { error } = await supabase.from("ia_authorized_users").insert({
      user_id: userId,
      authorized_by: user?.id,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("Este usuario ya está autorizado");
      } else {
        toast.error("Error al autorizar usuario");
      }
    } else {
      toast.success("Usuario autorizado");
      loadAuthorizedUsers();
      setAddUserDialogOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  const toggleUserAccess = async (id: string, isActive: boolean) => {
    await supabase
      .from("ia_authorized_users")
      .update({ is_active: !isActive })
      .eq("id", id);

    toast.success(isActive ? "Acceso desactivado" : "Acceso activado");
    loadAuthorizedUsers();
  };

  const removeAuthorization = async (id: string) => {
    await supabase.from("ia_authorized_users").delete().eq("id", id);
    toast.success("Autorización eliminada");
    loadAuthorizedUsers();
  };

  const toggleAPIConfig = async (id: string, isActive: boolean) => {
    await supabase
      .from("ia_api_configs")
      .update({ is_active: !isActive })
      .eq("id", id);

    toast.success(isActive ? "Proveedor desactivado" : "Proveedor activado");
    loadAPIConfigs();
  };

  const setDefaultProvider = async (id: string) => {
    // First, unset all defaults
    await supabase.from("ia_api_configs").update({ is_default: false }).neq("id", "");
    // Set the new default
    await supabase.from("ia_api_configs").update({ is_default: true }).eq("id", id);
    toast.success("Proveedor predeterminado actualizado");
    loadAPIConfigs();
  };

  const analyzeForumWithAI = async () => {
    setAnalyzingForum(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-forum`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Error al analizar el foro");
      }

      toast.success(data.message || "Análisis completado");
      loadProposals();
    } catch (error) {
      console.error("Error analyzing forum:", error);
      toast.error(error instanceof Error ? error.message : "Error al analizar el foro");
    } finally {
      setAnalyzingForum(false);
    }
  };

  const updateProposalStatus = async (id: string, status: string) => {
    await supabase
      .from("ia_feature_proposals")
      .update({
        status,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes || null,
      })
      .eq("id", id);

    toast.success(`Propuesta ${status === "approved" ? "aprobada" : status === "rejected" ? "rechazada" : "actualizada"}`);
    setSelectedProposal(null);
    setReviewNotes("");
    loadProposals();
  };

  const filteredProposals = proposals.filter(p => 
    statusFilter === "all" || p.status === statusFilter
  );

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400",
      reviewing: "bg-blue-500/20 text-blue-400",
      approved: "bg-green-500/20 text-green-400",
      rejected: "bg-red-500/20 text-red-400",
      implemented: "bg-purple-500/20 text-purple-400",
    };
    const labels: Record<string, string> = {
      pending: "Pendiente",
      reviewing: "En Revisión",
      approved: "Aprobada",
      rejected: "Rechazada",
      implemented: "Implementada",
    };
    return <Badge className={colors[status] || ""}>{labels[status] || status}</Badge>;
  };

  const getLifecycleBadge = (stage: string | null) => {
    if (!stage) return null;
    const colors: Record<string, string> = {
      generating: "bg-blue-500/20 text-blue-400",
      validating: "bg-yellow-500/20 text-yellow-400",
      validation_failed: "bg-red-500/20 text-red-400",
      pending_approval: "bg-orange-500/20 text-orange-400",
      approved: "bg-green-500/20 text-green-400",
      merged: "bg-purple-500/20 text-purple-400",
      deployed: "bg-cyan-500/20 text-cyan-400",
      rejected: "bg-red-500/20 text-red-400",
    };
    const labels: Record<string, string> = {
      generating: "Generando",
      validating: "Validando",
      validation_failed: "Validación Fallida",
      pending_approval: "Esperando Aprobación",
      approved: "Aprobado",
      merged: "Integrado",
      deployed: "En Producción",
      rejected: "Rechazado",
    };
    const icons: Record<string, React.ReactNode> = {
      generating: <Code className="h-3 w-3" />,
      validating: <Shield className="h-3 w-3" />,
      pending_approval: <Users className="h-3 w-3" />,
      approved: <Check className="h-3 w-3" />,
      merged: <GitBranch className="h-3 w-3" />,
      deployed: <Rocket className="h-3 w-3" />,
    };
    return (
      <Badge className={`${colors[stage] || ""} flex items-center gap-1`}>
        {icons[stage]}
        {labels[stage] || stage}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-muted text-muted-foreground",
      medium: "bg-blue-500/20 text-blue-400",
      high: "bg-orange-500/20 text-orange-400",
      critical: "bg-red-500/20 text-red-400",
    };
    return <Badge className={colors[priority] || ""}>{priority}</Badge>;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Akasha IA</h1>
            <p className="text-muted-foreground">
              Administra usuarios autorizados, API keys y propuestas de funcionalidades
            </p>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuarios Autorizados
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Key className="h-4 w-4" />
              Proveedores IA
            </TabsTrigger>
            <TabsTrigger value="proposals" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Propuestas
            </TabsTrigger>
            <TabsTrigger value="governance" className="gap-2">
              <Shield className="h-4 w-4" />
              Gobernanza
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Usuarios Autorizados</CardTitle>
                    <CardDescription>
                      Usuarios que pueden acceder a Akasha IA
                    </CardDescription>
                  </div>
                  <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-cyan-500 hover:bg-cyan-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Autorizar Usuario
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Autorizar Usuario</DialogTitle>
                        <DialogDescription>
                          Busca y selecciona un usuario para darle acceso a Akasha IA
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar por nombre o username..."
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              searchUsers(e.target.value);
                            }}
                            className="pl-10"
                          />
                        </div>
                        {searching && (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                        {searchResults.length > 0 && (
                          <div className="space-y-2 max-h-60 overflow-auto">
                            {searchResults.map((profile) => (
                              <div
                                key={profile.id}
                                className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                                onClick={() => authorizeUser(profile.id)}
                              >
                                <div>
                                  <p className="font-medium">
                                    {profile.full_name || profile.username || "Sin nombre"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    @{profile.username || "sin-username"}
                                  </p>
                                </div>
                                <Plus className="h-4 w-4 text-cyan-400" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Fecha Autorización</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {authorizedUsers.map((authUser) => (
                      <TableRow key={authUser.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {authUser.profiles?.full_name || authUser.profiles?.username || "Sin nombre"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              @{authUser.profiles?.username || "sin-username"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(authUser.authorized_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={authUser.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                            {authUser.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Switch
                              checked={authUser.is_active}
                              onCheckedChange={() => toggleUserAccess(authUser.id, authUser.is_active)}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeAuthorization(authUser.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {authorizedUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No hay usuarios autorizados
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api">
            <AIProviderManager
              configs={apiConfigs}
              userId={user?.id}
              onConfigsChange={loadAPIConfigs}
            />
          </TabsContent>

          {/* Proposals Tab */}
          <TabsContent value="proposals">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      Propuestas de Funcionalidades
                    </CardTitle>
                    <CardDescription>
                      Revisa y aprueba propuestas generadas por la comunidad y la IA
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Filtrar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="pending">Pendientes</SelectItem>
                        <SelectItem value="reviewing">En Revisión</SelectItem>
                        <SelectItem value="approved">Aprobadas</SelectItem>
                        <SelectItem value="rejected">Rechazadas</SelectItem>
                        <SelectItem value="implemented">Implementadas</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={analyzeForumWithAI}
                      disabled={analyzingForum}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {analyzingForum ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Analizar Foro con IA
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Propuesta</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Ciclo</TableHead>
                      <TableHead>Aprobaciones</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProposals.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium line-clamp-1">{proposal.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {proposal.profiles?.full_name || proposal.profiles?.username || "Auto-generada"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {proposal.category || "otro"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getLifecycleBadge(proposal.lifecycle_stage)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {proposal.approvals_count || 0}/{proposal.required_approvals || 1}
                          </span>
                        </TableCell>
                        <TableCell>{getPriorityBadge(proposal.priority)}</TableCell>
                        <TableCell>
                          {new Date(proposal.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedProposal(proposal);
                                    setReviewNotes(proposal.review_notes || "");
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Ver
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                                <DialogHeader>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <DialogTitle className="flex items-center gap-2">
                                        {proposal.title}
                                        {getPriorityBadge(proposal.priority)}
                                      </DialogTitle>
                                      <DialogDescription className="flex items-center gap-2 mt-1">
                                        {proposal.profiles?.full_name || proposal.profiles?.username ? (
                                          <span>Propuesta de {proposal.profiles?.full_name || proposal.profiles?.username}</span>
                                        ) : (
                                          <span className="flex items-center gap-1">
                                            <Sparkles className="h-3 w-3" />
                                            Auto-generada por IA
                                          </span>
                                        )}
                                        <span className="text-muted-foreground">•</span>
                                        <Badge variant="outline" className="text-xs">{proposal.category || "otro"}</Badge>
                                      </DialogDescription>
                                    </div>
                                  </div>
                                </DialogHeader>
                                
                                <ScrollArea className="flex-1 pr-4">
                                  <div className="space-y-6">
                                    {/* Workflow Status */}
                                    <ProposalWorkflow
                                      proposalId={proposal.id}
                                      currentStatus={proposal.status}
                                      userId={user?.id}
                                      reviewNotes={reviewNotes}
                                      onStatusChange={loadProposals}
                                    />

                                    {/* Description */}
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium">Descripción</Label>
                                      <div className="text-sm text-muted-foreground whitespace-pre-wrap p-3 rounded-md bg-muted/30 border border-border/50">
                                        {proposal.description}
                                      </div>
                                    </div>

                                    {/* AI Reasoning */}
                                    {proposal.ai_reasoning && (
                                      <div className="space-y-2">
                                        <Label className="text-sm font-medium flex items-center gap-2">
                                          <Sparkles className="h-4 w-4 text-primary" />
                                          Razonamiento de IA
                                        </Label>
                                        <div className="text-sm text-muted-foreground p-3 rounded-md bg-primary/5 border border-primary/20">
                                          {proposal.ai_reasoning}
                                        </div>
                                      </div>
                                    )}

                                    {/* Code Lifecycle Panel - Full Development Cycle */}
                                    <CodeLifecyclePanel
                                      proposalId={proposal.id}
                                      title={proposal.title}
                                      description={proposal.description}
                                      lifecycleStage={proposal.lifecycle_stage || "generating"}
                                      validationScore={proposal.validation_score || 0}
                                      approvalsCount={proposal.approvals_count || 0}
                                      requiredApprovals={proposal.required_approvals || 1}
                                      existingCode={proposal.proposed_code ? (() => {
                                        try {
                                          const parsed = JSON.parse(proposal.proposed_code);
                                          return {
                                            frontend: parsed.frontend || "",
                                            backend: parsed.backend || "",
                                            database: parsed.database || "",
                                          };
                                        } catch {
                                          return null;
                                        }
                                      })() : null}
                                      onCodeGenerated={() => loadProposals()}
                                      onStageChange={() => loadProposals()}
                                    />

                                    {/* Review Notes */}
                                    <div className="space-y-2">
                                      <Label className="text-sm font-medium">Notas de Revisión</Label>
                                      <Textarea
                                        value={reviewNotes}
                                        onChange={(e) => setReviewNotes(e.target.value)}
                                        placeholder="Agrega notas sobre tu decisión, feedback o instrucciones de implementación..."
                                        className="min-h-[80px]"
                                      />
                                    </div>

                                    {/* Priority Selector */}
                                    <div className="flex items-center gap-4 p-3 rounded-md bg-muted/30 border border-border/50">
                                      <Label className="text-sm font-medium">Prioridad:</Label>
                                      <Select
                                        value={proposal.priority}
                                        onValueChange={(value) => {
                                          supabase
                                            .from("ia_feature_proposals")
                                            .update({ priority: value })
                                            .eq("id", proposal.id)
                                            .then(() => {
                                              toast.success("Prioridad actualizada");
                                              loadProposals();
                                            });
                                        }}
                                      >
                                        <SelectTrigger className="w-32">
                                          <SelectValue placeholder="Prioridad" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="low">Baja</SelectItem>
                                          <SelectItem value="medium">Media</SelectItem>
                                          <SelectItem value="high">Alta</SelectItem>
                                          <SelectItem value="critical">Crítica</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </ScrollArea>
                              </DialogContent>
                            </Dialog>
                            {proposal.proposed_code && (
                              <Badge variant="outline" className="text-xs">
                                <Code className="h-3 w-3 mr-1" />
                                Código
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {proposals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No hay propuestas pendientes
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Governance Tab */}
          <TabsContent value="governance">
            <div className="grid gap-6 md:grid-cols-2">
              <GovernanceSettings />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-purple-400" />
                    Estadísticas del Ciclo
                  </CardTitle>
                  <CardDescription>
                    Resumen del estado de las propuestas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-2xl font-bold text-blue-400">
                        {proposals.filter(p => p.lifecycle_stage === "generating" || p.lifecycle_stage === "validating").length}
                      </p>
                      <p className="text-xs text-muted-foreground">En Generación</p>
                    </div>
                    <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <p className="text-2xl font-bold text-orange-400">
                        {proposals.filter(p => p.lifecycle_stage === "pending_approval").length}
                      </p>
                      <p className="text-xs text-muted-foreground">Esperando Aprobación</p>
                    </div>
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-2xl font-bold text-green-400">
                        {proposals.filter(p => p.lifecycle_stage === "approved" || p.lifecycle_stage === "merged").length}
                      </p>
                      <p className="text-xs text-muted-foreground">Aprobadas/Integradas</p>
                    </div>
                    <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                      <p className="text-2xl font-bold text-cyan-400">
                        {proposals.filter(p => p.lifecycle_stage === "deployed").length}
                      </p>
                      <p className="text-xs text-muted-foreground">En Producción</p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-red-400">
                          {proposals.filter(p => p.lifecycle_stage === "validation_failed" || p.lifecycle_stage === "rejected").length}
                        </p>
                        <p className="text-xs text-muted-foreground">Fallidas/Rechazadas</p>
                      </div>
                      <Shield className="h-8 w-8 text-red-400/30" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
