import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  ThumbsUp, 
  ThumbsDown, 
  MinusCircle,
  Users,
  Vote,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Loader2,
  Shield,
  TrendingUp
} from "lucide-react";

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

export function CommunityVoting() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [voteSummaries, setVoteSummaries] = useState<Record<string, VoteSummary>>({});
  const [userVotes, setUserVotes] = useState<Record<string, UserVote>>({});
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [voteReason, setVoteReason] = useState("");
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  
  useEffect(() => {
    loadProposals();
  }, []);
  
  const loadProposals = async () => {
    try {
      // Cargar propuestas en etapa de aprobación pendiente
      const { data: proposalsData, error: proposalsError } = await supabase
        .from("ia_feature_proposals")
        .select("*")
        .eq("lifecycle_stage", "pending_approval")
        .order("created_at", { ascending: false });
      
      if (proposalsError) throw proposalsError;
      setProposals(proposalsData || []);
      
      // Cargar resumen de votos
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
      
      // Cargar votos del usuario actual
      const { data: { user } } = await supabase.auth.getUser();
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes iniciar sesión para votar");
        return;
      }
      
      const existingVote = userVotes[proposalId];
      
      if (existingVote) {
        // Actualizar voto existente
        const { error } = await supabase
          .from("ia_community_votes")
          .update({ vote, reason: voteReason || null })
          .eq("proposal_id", proposalId)
          .eq("user_id", user.id);
        
        if (error) throw error;
      } else {
        // Crear nuevo voto
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
      loadProposals(); // Recargar para actualizar conteos
      
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast.error("Error al registrar el voto");
    } finally {
      setVoting(null);
    }
  };
  
  const getVoteProgress = (summary: VoteSummary) => {
    if (!summary || summary.total_votes === 0) return { approve: 0, reject: 0 };
    return {
      approve: (summary.approve_count / summary.total_votes) * 100,
      reject: (summary.reject_count / summary.total_votes) * 100,
    };
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (proposals.length === 0) {
    return (
      <Card className="bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Vote className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="font-medium mb-1">Sin propuestas pendientes</h3>
          <p className="text-sm text-muted-foreground">
            No hay propuestas esperando votación comunitaria
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Votación Comunitaria</h2>
        <Badge variant="secondary">{proposals.length} propuestas</Badge>
      </div>
      
      <ScrollArea className="h-[500px]">
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
                        {summary?.approve_count || 0} aprobar
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsDown className="h-3 w-3 text-destructive" />
                        {summary?.reject_count || 0} rechazar
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
                      {summary?.total_votes || 0} votos totales
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
                  
                  {/* Campo de razón (expandido) */}
                  {isExpanded && (
                    <div className="pt-2 space-y-2 border-t">
                      <Textarea
                        placeholder="Explica tu voto (opcional)"
                        value={voteReason}
                        onChange={(e) => setVoteReason(e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Tu razón será visible para la comunidad
                      </p>
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
    </div>
  );
}
