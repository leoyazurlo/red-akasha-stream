import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  Palette, 
  Code, 
  Shield, 
  Scale, 
  Users,
  Loader2,
  CheckCircle,
  Circle,
  Sparkles,
  Network,
  Zap,
  MessageSquare
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Agent {
  id: string;
  name: string;
  display_name: string;
  role: string;
  description: string | null;
  capabilities: unknown;
  is_active: boolean;
}

interface AgentResponse {
  agentId: string;
  agentName: string;
  agentRole: string;
  response: string;
  processingTimeMs: number;
  suggestedNextAgents?: string[];
}

interface CollaborativeResponse {
  success: boolean;
  sessionId?: string;
  responses: AgentResponse[];
  totalAgents: number;
  totalProcessingTimeMs: number;
  summary: string;
}

const ROLE_CONFIG: Record<string, { icon: React.ComponentType<any>; color: string; bgColor: string }> = {
  design: { icon: Palette, color: "text-pink-400", bgColor: "bg-pink-500/20" },
  code: { icon: Code, color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
  testing: { icon: Shield, color: "text-amber-400", bgColor: "bg-amber-500/20" },
  legal: { icon: Scale, color: "text-purple-400", bgColor: "bg-purple-500/20" },
  governance: { icon: Users, color: "text-green-400", bgColor: "bg-green-500/20" },
};

interface MultiAgentPanelProps {
  onCollaborativeResponse?: (response: CollaborativeResponse) => void;
  currentCode?: { frontend?: string; backend?: string; database?: string };
}

export function MultiAgentPanel({ onCollaborativeResponse, currentCode }: MultiAgentPanelProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeAgents, setActiveAgents] = useState<string[]>([]);
  const [lastResponse, setLastResponse] = useState<CollaborativeResponse | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  
  useEffect(() => {
    loadAgents();
  }, []);
  
  const loadAgents = async () => {
    const { data, error } = await supabase
      .from("ia_agents")
      .select("*")
      .eq("is_active", true)
      .order("priority");
    
    if (data && !error) {
      setAgents(data);
    }
    setLoading(false);
  };
  
  const toggleAgentSelection = (role: string) => {
    setSelectedAgents(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };
  
  const invokeCollaborativeSession = async (message: string) => {
    setProcessing(true);
    setActiveAgents([]);
    
    try {
      // Simular progreso de agentes
      const selectedRoles = selectedAgents.length > 0 ? selectedAgents : agents.map(a => a.role);
      
      for (const role of selectedRoles) {
        setActiveAgents(prev => [...prev, role]);
        await new Promise(r => setTimeout(r, 500));
      }
      
      const { data, error } = await supabase.functions.invoke("multi-agent-orchestrator", {
        body: {
          message,
          context: { code: currentCode },
          requestedAgents: selectedAgents.length > 0 ? selectedAgents : undefined,
        },
      });
      
      if (error) throw error;
      
      setLastResponse(data);
      onCollaborativeResponse?.(data);
      
    } catch (error) {
      console.error("Error en sesión colaborativa:", error);
    } finally {
      setProcessing(false);
      setActiveAgents([]);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Header con visualización de red */}
      <Card className="bg-gradient-to-br from-background to-muted/20 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Network className="h-5 w-5 text-primary" />
            Ecosistema Multi-IA
            <Badge variant="outline" className="ml-auto">
              {agents.length} Agentes Activos
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Grid de agentes con selección */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {agents.map((agent) => {
              const config = ROLE_CONFIG[agent.role] || ROLE_CONFIG.code;
              const Icon = config.icon;
              const isSelected = selectedAgents.includes(agent.role);
              const isActive = activeAgents.includes(agent.role);
              
              return (
                <button
                  key={agent.id}
                  onClick={() => toggleAgentSelection(agent.role)}
                  disabled={processing}
                  className={`
                    relative flex flex-col items-center p-3 rounded-lg transition-all
                    ${isSelected ? `${config.bgColor} ring-2 ring-primary` : "bg-muted/30 hover:bg-muted/50"}
                    ${isActive ? "animate-pulse" : ""}
                  `}
                >
                  {isActive && (
                    <div className="absolute -top-1 -right-1">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                      </span>
                    </div>
                  )}
                  <Avatar className={`h-10 w-10 ${config.bgColor}`}>
                    <AvatarFallback className={config.color}>
                      <Icon className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs mt-1 text-center leading-tight">
                    {agent.display_name.split(" - ")[0]}
                  </span>
                  {isSelected && (
                    <CheckCircle className="absolute top-1 left-1 h-3 w-3 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Indicador de colaboración */}
          {processing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Sparkles className="h-4 w-4 animate-pulse text-primary" />
              <span>Los agentes están colaborando...</span>
              <Progress value={(activeAgents.length / agents.length) * 100} className="w-24 h-2" />
            </div>
          )}
          
          {/* Texto de ayuda */}
          <p className="text-xs text-muted-foreground">
            {selectedAgents.length === 0 
              ? "Selecciona agentes específicos o deja vacío para auto-detección"
              : `${selectedAgents.length} agente(s) seleccionado(s)`
            }
          </p>
        </CardContent>
      </Card>
      
      {/* Última respuesta colaborativa */}
      {lastResponse && lastResponse.responses.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Última Colaboración
              <Badge variant="secondary" className="ml-auto">
                {lastResponse.totalAgents} agentes • {lastResponse.totalProcessingTimeMs}ms
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {lastResponse.responses.map((resp, idx) => {
                  const config = ROLE_CONFIG[resp.agentRole] || ROLE_CONFIG.code;
                  const Icon = config.icon;
                  
                  return (
                    <div key={idx} className={`p-3 rounded-lg ${config.bgColor}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className={`h-4 w-4 ${config.color}`} />
                        <span className="font-medium text-sm">{resp.agentName}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {resp.processingTimeMs}ms
                        </Badge>
                      </div>
                      <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>
                          {resp.response.length > 500 
                            ? resp.response.substring(0, 500) + "..." 
                            : resp.response}
                        </ReactMarkdown>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
      
      {/* Capacidades de los agentes */}
      <Card className="bg-muted/20">
        <CardHeader className="py-2">
          <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Capacidades del Ecosistema
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1">
            {agents.flatMap(a => {
              const caps = Array.isArray(a.capabilities) ? a.capabilities : [];
              return (caps as string[]).slice(0, 3);
            }).map((cap, i) => (
              <Badge key={i} variant="outline" className="text-[10px]">
                {String(cap).replace("_", " ")}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
