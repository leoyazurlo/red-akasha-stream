import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  ThumbsUp, 
  ThumbsDown, 
  MinusCircle,
  Shield,
  Vote,
  Clock,
  Loader2,
  Lock,
  UserPlus,
  Trash2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: string;
  lifecycle_stage: string;
  created_at: string;
  validation_score: number | null;
}

interface VoteSummary {
  proposal_id: string;
  approve_count: number;
  reject_count: number;
  abstain_count: number;
  total_votes: number;
}

interface UserVote {
  proposal_id: string;
  vote: "approve" | "reject" | "abstain";
  reason?: string;
}

interface AuthorizedUser {
  id: string;
  user_id: string;
  is_active: boolean;
  notes: string | null;
  username?: string;
  full_name?: string;
}

export function CommunityVoting() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [voteSummaries, setVoteSummaries] = useState<Record<string, VoteSummary>>({});
  const [userVotes, setUserVotes] = useState<Record<string, UserVote>>({});
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [voteReason, setVoteReason] = useState("");
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [addingUser, setAddingUser] = useState(false);
  
  useEffect(() => {
    if (!authLoading && user) {
      checkAuthorization();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, isAdmin]);
  
  const checkAuthorization = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    // Admins siempre están autorizados
    if (isAdmin) {
      setIsAuthorized(true);
      loadProposals();
      loadAuthorizedUsers();
      return;
    }
    
    // Verificar si el usuario está en ia_authorized_users
    const { data, error } = await supabase
      .from("ia_authorized_users")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single();
    
    if (data && !error) {
      setIsAuthorized(true);
      loadProposals();
    } else {
      setIsAuthorized(false);
      setLoading(false);
    }
  };
  
  const loadAuthorizedUsers = async () => {
    const { data } = await supabase
      .from("ia_authorized_users")
      .select("*")
      .eq("is_active", true);
    
    if (data) {
      // Cargar nombres de usuarios
      const userIds = data.map(u => u.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .in("id", userIds);
      
      const enrichedUsers: AuthorizedUser[] = data.map(au => {
        const profile = profiles?.find(p => p.id === au.user_id);
        return {
          ...au,
          username: profile?.username ?? undefined,
          full_name: profile?.full_name ?? undefined,
        };
      });
      
      setAuthorizedUsers(enrichedUsers);
    }
  };
  
  const loadProposals = async () => {
    try {
      const { data: proposalsData, error: proposalsError } = await supabase
        .from("ia_feature_proposals")
        .select("*")
        .eq("lifecycle_stage", "pending_approval")
        .order("created_at", { ascending: false });
      
      if (proposalsError) throw proposalsError;
      setProposals(proposalsData || []);
      
      const { data: summaryData, error: summaryError } = await supabase
        .from("ia_proposal_vote_summary")
        .select("*");
      
      if (!summaryError && summaryData) {
        const summaryMap: Record<string, VoteSummary> = {};
        summaryData.forEach((s: any) => {
          summaryMap[s.proposal_id] = s;
        });
        setVoteSummaries(summaryMap);
      }
      
      if (user) {
        const { data: userVotesData } = await supabase
          .from("ia_community_votes")
          .select("*")
          .eq("user_id", user.id);
        
        if (userVotesData) {
          const votesMap: Record<string, UserVote> = {};
          userVotesData.forEach((v: any) => {
            votesMap[v.proposal_id] = v;
          });
          setUserVotes(votesMap);
        }
      }
      
    } catch (error) {
      console.error("Error loading proposals:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const submitVote = async (proposalId: string, vote: "approve" | "reject" | "abstain") => {
    setVoting(proposalId);
    
    try {
      if (!user) {
        toast.error("Debes iniciar sesión para votar");
        return;
      }
      
      const existingVote = userVotes[proposalId];
      
      if (existingVote) {
        const { error } = await supabase
          .from("ia_community_votes")
          .update({ vote, reason: voteReason || null })
          .eq("proposal_id", proposalId)
          .eq("user_id", user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ia_community_votes")
          .insert({
            proposal_id: proposalId,
            user_id: user.id,
            vote,
            reason: voteReason || null,
          });
        
        if (error) throw error;
      }
      
      toast.success("Tu voto ha sido registrado");
      setVoteReason("");
      setSelectedProposal(null);
      loadProposals();
      
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast.error("Error al registrar el voto");
    } finally {
      setVoting(null);
    }
  };
  
  const addAuthorizedUser = async () => {
    if (!newUserEmail.trim() || !user) return;
    setAddingUser(true);
    
    try {
      // Buscar usuario por email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .eq("username", newUserEmail.trim().toLowerCase())
        .single();
      
      if (profileError || !profile) {
        toast.error("Usuario no encontrado");
        return;
      }
      
      // Verificar si ya está autorizado
      const { data: existing } = await supabase
        .from("ia_authorized_users")
        .select("id")
        .eq("user_id", profile.id)
        .single();
      
      if (existing) {
        toast.error("Este usuario ya está autorizado");
        return;
      }
      
      // Agregar autorización
      const { error } = await supabase
        .from("ia_authorized_users")
        .insert({
          user_id: profile.id,
          authorized_by: user.id,
          is_active: true,
        });
      
      if (error) throw error;
      
      toast.success("Usuario autorizado correctamente");
      setNewUserEmail("");
      loadAuthorizedUsers();
      
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("Error al autorizar usuario");
    } finally {
      setAddingUser(false);
    }
  };
  
  const removeAuthorizedUser = async (authId: string) => {
    try {
      const { error } = await supabase
        .from("ia_authorized_users")
        .update({ is_active: false })
        .eq("id", authId);
      
      if (error) throw error;
      
      toast.success("Autorización revocada");
      loadAuthorizedUsers();
      
    } catch (error) {
      console.error("Error removing user:", error);
      toast.error("Error al revocar autorización");
    }
  };
  
  const getVoteProgress = (summary: VoteSummary) => {
    if (!summary || summary.total_votes === 0) return { approve: 0, reject: 0 };
    return {
      approve: (summary.approve_count / summary.total_votes) * 100,
      reject: (summary.reject_count / summary.total_votes) * 100,
    };
  };
  
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // No autorizado
  if (!isAuthorized) {
    return (
      <Card className="bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Acceso Restringido</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            La gobernanza del ecosistema IA está limitada a administradores 
            y usuarios autorizados. Contacta a un administrador si necesitas acceso.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Gobernanza IA</h2>
        <Badge variant="outline" className="ml-auto">
          {isAdmin ? "Administrador" : "Autorizado"}
        </Badge>
      </div>
      
      {/* Panel de administración de usuarios (solo admins) */}
      {isAdmin && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Gestionar Usuarios Autorizados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Nombre de usuario a autorizar"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={addAuthorizedUser} 
                disabled={addingUser || !newUserEmail.trim()}
                size="sm"
              >
                {addingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : "Autorizar"}
              </Button>
            </div>
            
            {authorizedUsers.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground mb-2">
                  {authorizedUsers.length} usuario(s) autorizado(s)
                </p>
                {authorizedUsers.map((au) => (
                  <div 
                    key={au.id} 
                    className="flex items-center justify-between text-sm bg-background/50 rounded px-2 py-1"
                  >
                    <span>{au.username || au.full_name || au.user_id}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => removeAuthorizedUser(au.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Propuestas */}
      {proposals.length === 0 ? (
        <Card className="bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Vote className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1">Sin propuestas pendientes</h3>
            <p className="text-sm text-muted-foreground">
              No hay propuestas esperando aprobación
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[400px]">
          <div className="space-y-4 pr-4">
            {proposals.map((proposal) => {
              const summary = voteSummaries[proposal.id];
              const userVote = userVotes[proposal.id];
              const progress = getVoteProgress(summary);
              const isExpanded = selectedProposal === proposal.id;
              
              return (
                <Card 
                  key={proposal.id}
                  className={`transition-all ${isExpanded ? "ring-2 ring-primary" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          {proposal.title}
                          {proposal.validation_score && (
                            <Badge 
                              variant={proposal.validation_score >= 70 ? "default" : "secondary"}
                              className="ml-2"
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              {proposal.validation_score}%
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {proposal.description}
                        </CardDescription>
                      </div>
                      {userVote && (
                        <Badge 
                          variant={userVote.vote === "approve" ? "default" : userVote.vote === "reject" ? "destructive" : "secondary"}
                        >
                          {userVote.vote === "approve" ? (
                            <><ThumbsUp className="h-3 w-3 mr-1" /> Aprobado</>
                          ) : userVote.vote === "reject" ? (
                            <><ThumbsDown className="h-3 w-3 mr-1" /> Rechazado</>
                          ) : (
                            <><MinusCircle className="h-3 w-3 mr-1" /> Abstención</>
                          )}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Barra de progreso de votos */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3 text-primary" />
                          {summary?.approve_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsDown className="h-3 w-3 text-destructive" />
                          {summary?.reject_count || 0}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${progress.approve}%` }}
                        />
                        <div 
                          className="h-full bg-destructive transition-all"
                          style={{ width: `${progress.reject}%` }}
                        />
                      </div>
                      <div className="text-xs text-center text-muted-foreground">
                        {summary?.total_votes || 0} voto(s)
                      </div>
                    </div>
                    
                    {/* Botones de votación */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={userVote?.vote === "approve" ? "default" : "outline"}
                        className="flex-1"
                        disabled={voting === proposal.id}
                        onClick={() => {
                          if (selectedProposal === proposal.id) {
                            submitVote(proposal.id, "approve");
                          } else {
                            setSelectedProposal(proposal.id);
                          }
                        }}
                      >
                        {voting === proposal.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Aprobar
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant={userVote?.vote === "reject" ? "destructive" : "outline"}
                        className="flex-1"
                        disabled={voting === proposal.id}
                        onClick={() => {
                          if (selectedProposal === proposal.id) {
                            submitVote(proposal.id, "reject");
                          } else {
                            setSelectedProposal(proposal.id);
                          }
                        }}
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={voting === proposal.id}
                        onClick={() => submitVote(proposal.id, "abstain")}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Campo de razón */}
                    {isExpanded && (
                      <div className="pt-2 space-y-2 border-t">
                        <Textarea
                          placeholder="Explica tu decisión (opcional)"
                          value={voteReason}
                          onChange={(e) => setVoteReason(e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    )}
                    
                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2">
                      <Clock className="h-3 w-3" />
                      {new Date(proposal.created_at).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
