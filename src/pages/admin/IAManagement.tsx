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
  Search
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

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-gray-500/20 text-gray-400",
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
            <Card>
              <CardHeader>
                <CardTitle>Proveedores de IA</CardTitle>
                <CardDescription>
                  Configura los proveedores de IA disponibles para la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apiConfigs.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-cyan-500/20 bg-muted/30"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                          <Settings className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{config.display_name}</p>
                            {config.is_default && (
                              <Badge className="bg-cyan-500/20 text-cyan-400">
                                Predeterminado
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Proveedor: {config.provider}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`active-${config.id}`} className="text-sm">
                            Activo
                          </Label>
                          <Switch
                            id={`active-${config.id}`}
                            checked={config.is_active}
                            onCheckedChange={() => toggleAPIConfig(config.id, config.is_active)}
                          />
                        </div>
                        {!config.is_default && config.is_active && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDefaultProvider(config.id)}
                          >
                            Usar como predeterminado
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  💡 Lovable AI está integrado y no requiere API key externa. Para agregar otros proveedores,
                  contacta al equipo de desarrollo.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Proposals Tab */}
          <TabsContent value="proposals">
            <Card>
              <CardHeader>
                <CardTitle>Propuestas de Funcionalidades</CardTitle>
                <CardDescription>
                  Revisa y aprueba propuestas generadas por la comunidad con ayuda de la IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Propuesta</TableHead>
                      <TableHead>Solicitante</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposals.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell>
                          <p className="font-medium line-clamp-1">{proposal.title}</p>
                        </TableCell>
                        <TableCell>
                          {proposal.profiles?.full_name || proposal.profiles?.username || "Desconocido"}
                        </TableCell>
                        <TableCell>{getPriorityBadge(proposal.priority)}</TableCell>
                        <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                        <TableCell>
                          {new Date(proposal.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setSelectedProposal(proposal)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                                <DialogHeader>
                                  <DialogTitle>{proposal.title}</DialogTitle>
                                  <DialogDescription>
                                    Propuesta de {proposal.profiles?.full_name || proposal.profiles?.username}
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Descripción</Label>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                      {proposal.description}
                                    </p>
                                  </div>
                                  {proposal.ai_reasoning && (
                                    <div>
                                      <Label>Razonamiento de IA</Label>
                                      <p className="text-sm text-muted-foreground">
                                        {proposal.ai_reasoning}
                                      </p>
                                    </div>
                                  )}
                                  {proposal.proposed_code && (
                                    <div>
                                      <Label>Código Propuesto</Label>
                                      <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-40">
                                        {proposal.proposed_code}
                                      </pre>
                                    </div>
                                  )}
                                  <div>
                                    <Label>Notas de Revisión</Label>
                                    <Textarea
                                      value={reviewNotes}
                                      onChange={(e) => setReviewNotes(e.target.value)}
                                      placeholder="Agrega notas sobre tu decisión..."
                                    />
                                  </div>
                                </div>
                                <DialogFooter className="gap-2">
                                  <Select
                                    value={proposal.priority}
                                    onValueChange={(value) => {
                                      supabase
                                        .from("ia_feature_proposals")
                                        .update({ priority: value })
                                        .eq("id", proposal.id)
                                        .then(() => loadProposals());
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
                                  <Button
                                    variant="destructive"
                                    onClick={() => updateProposalStatus(proposal.id, "rejected")}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Rechazar
                                  </Button>
                                  <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => updateProposalStatus(proposal.id, "approved")}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Aprobar
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {proposals.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No hay propuestas pendientes
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
