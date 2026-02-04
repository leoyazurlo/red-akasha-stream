import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Bot, 
  Send, 
  Sparkles, 
  Lock, 
  MessageSquare, 
  Lightbulb,
  Code,
  Loader2,
  Plus,
  Trash2,
  History,
  Wand2,
  GitBranch,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ProposalCard } from "@/components/akasha-ia/ProposalCard";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string | null;
  messages: Message[];
  created_at: string;
}

interface FeatureProposal {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  proposed_code?: string | null;
  created_at: string;
}

export default function AkashaIA() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [proposals, setProposals] = useState<FeatureProposal[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      checkAuthorization();
      loadConversations();
      loadMyProposals();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const checkAuthorization = async () => {
    try {
      // Check if user is admin (admins always have access)
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user?.id)
        .eq("role", "admin")
        .single();

      if (roleData) {
        setIsAuthorized(true);
        setCheckingAuth(false);
        return;
      }

      // Check if user is specifically authorized
      const { data: authData } = await supabase
        .from("ia_authorized_users")
        .select("is_active")
        .eq("user_id", user?.id)
        .single();

      setIsAuthorized(authData?.is_active === true);
    } catch (error) {
      setIsAuthorized(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const loadConversations = async () => {
    const { data } = await supabase
      .from("ia_conversations")
      .select("*")
      .eq("user_id", user?.id)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (data) {
      setConversations(data.map(c => ({
        ...c,
        messages: (c.messages as unknown as Message[]) || []
      })));
    }
  };

  const loadMyProposals = async () => {
    const { data } = await supabase
      .from("ia_feature_proposals")
      .select("*")
      .eq("requested_by", user?.id)
      .order("created_at", { ascending: false });

    if (data) {
      setProposals(data as FeatureProposal[]);
    }
  };

  const startNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
  };

  const loadConversation = (conv: Conversation) => {
    setCurrentConversationId(conv.id);
    setMessages(conv.messages);
  };

  const deleteConversation = async (id: string) => {
    await supabase.from("ia_conversations").delete().eq("id", id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      startNewConversation();
    }
    toast.success("Conversación eliminada");
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/akasha-ia-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: newMessages }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al comunicarse con la IA");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                assistantContent += content;
                setMessages(prev => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant") {
                    return prev.map((m, i) => 
                      i === prev.length - 1 ? { ...m, content: assistantContent } : m
                    );
                  }
                  return [...prev, { role: "assistant", content: assistantContent }];
                });
              }
            } catch {
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }
      }

      // Save conversation
      const finalMessages = [...newMessages, { role: "assistant" as const, content: assistantContent }];
      const messagesJson = JSON.parse(JSON.stringify(finalMessages));
      
      if (currentConversationId) {
        await supabase
          .from("ia_conversations")
          .update({ messages: messagesJson, updated_at: new Date().toISOString() })
          .eq("id", currentConversationId);
      } else {
        const title = userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? "..." : "");
        const { data: newConv } = await supabase
          .from("ia_conversations")
          .insert([{ 
            user_id: user?.id!, 
            title, 
            messages: messagesJson
          }])
          .select()
          .single();
        
        if (newConv) {
          setCurrentConversationId(newConv.id);
          loadConversations();
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error al comunicarse con la IA");
    } finally {
      setIsLoading(false);
    }
  };

  const createProposal = async () => {
    if (messages.length < 2) {
      toast.error("Primero inicia una conversación con la IA");
      return;
    }

    const lastAssistantMessage = [...messages].reverse().find(m => m.role === "assistant");
    if (!lastAssistantMessage) return;

    const { error } = await supabase.from("ia_feature_proposals").insert({
      title: messages[0].content.slice(0, 100),
      description: lastAssistantMessage.content,
      ai_reasoning: "Propuesta generada desde conversación con Akasha IA",
      requested_by: user?.id,
    });

    if (error) {
      toast.error("Error al crear la propuesta");
    } else {
      toast.success("Propuesta enviada para revisión del administrador");
      loadMyProposals();
    }
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

  if (authLoading || checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Card className="max-w-md w-full bg-card/50 border-cyan-500/20">
            <CardContent className="pt-8 text-center">
              <Lock className="h-16 w-16 mx-auto text-cyan-400/50 mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Acceso Restringido</h2>
              <p className="text-muted-foreground mb-6">
                Esta funcionalidad está disponible solo para usuarios autorizados por los administradores de Red Akasha.
              </p>
              <Button variant="outline" onClick={() => navigate("/foro")}>
                Volver al Foro
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="h-8 w-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-foreground">Akasha IA</h1>
            <Badge className="bg-cyan-500/20 text-cyan-400">
              <Sparkles className="h-3 w-3 mr-1" />
              Beta
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Asistente inteligente para proponer y desarrollar nuevas funcionalidades para Red Akasha
          </p>
        </div>

        <Tabs defaultValue="chat" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat con IA
            </TabsTrigger>
            <TabsTrigger value="proposals" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Mis Propuestas
            </TabsTrigger>
            <TabsTrigger value="implement" className="gap-2">
              <Wand2 className="h-4 w-4" />
              Implementar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Sidebar de conversaciones */}
              <Card className="lg:col-span-1 bg-card/50 border-cyan-500/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Historial</CardTitle>
                    <Button size="sm" variant="ghost" onClick={startNewConversation}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-2">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-1">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          className={`group flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 ${
                            currentConversationId === conv.id ? "bg-cyan-500/10" : ""
                          }`}
                          onClick={() => loadConversation(conv)}
                        >
                          <History className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm truncate flex-1">
                            {conv.title || "Sin título"}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conv.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {conversations.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No hay conversaciones
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Chat principal */}
              <Card className="lg:col-span-3 bg-card/50 border-cyan-500/20">
                <CardContent className="p-4">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {messages.length === 0 && (
                        <div className="text-center py-12">
                          <Bot className="h-12 w-12 mx-auto text-cyan-400/50 mb-4" />
                          <h3 className="text-lg font-medium text-foreground mb-2">
                            ¡Hola! Soy Akasha IA
                          </h3>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            Puedo ayudarte a proponer nuevas funcionalidades, analizar necesidades
                            de la comunidad y generar ideas para mejorar la plataforma.
                          </p>
                        </div>
                      )}
                      {messages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                        >
                          {msg.role === "assistant" && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-cyan-400" />
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.role === "user"
                                ? "bg-cyan-500/20 text-foreground"
                                : "bg-muted/50 text-foreground"
                            }`}
                          >
                            {msg.role === "assistant" ? (
                              <div className="prose prose-sm prose-invert max-w-none">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            ) : (
                              <p className="text-sm">{msg.content}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {isLoading && messages[messages.length - 1]?.role === "user" && (
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-cyan-400" />
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3">
                            <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="mt-4 space-y-2">
                    <div className="flex gap-2">
                      <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Describe la funcionalidad que quieres proponer..."
                        className="min-h-[60px] bg-muted/30 border-cyan-500/20"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={isLoading || !input.trim()}
                        className="bg-cyan-500 hover:bg-cyan-600"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    {messages.length >= 2 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={createProposal}
                        className="w-full border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                      >
                        <Code className="h-4 w-4 mr-2" />
                        Crear propuesta de esta conversación
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="proposals">
            <Card className="bg-card/50 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-cyan-400" />
                  Mis Propuestas de Funcionalidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                {proposals.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No tienes propuestas aún. Usa el chat para generar ideas y crear propuestas.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {proposals.map((proposal) => (
                      <ProposalCard key={proposal.id} proposal={proposal} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="implement">
            <Card className="bg-card/50 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-cyan-400" />
                  Implementar Cambios en la Plataforma
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Aquí puedes ver tus propuestas aprobadas y generar código para implementarlas automáticamente.
                </p>
              </CardHeader>
              <CardContent>
                {proposals.filter(p => ["approved", "reviewing", "implementing"].includes(p.status)).length === 0 ? (
                  <div className="text-center py-12">
                    <Wand2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground mb-2">
                      No tienes propuestas listas para implementar
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Crea propuestas en el chat y espera la aprobación de un administrador
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {proposals
                      .filter(p => ["approved", "reviewing", "implementing"].includes(p.status))
                      .map((proposal) => (
                        <ProposalCard 
                          key={proposal.id} 
                          proposal={proposal} 
                          showImplementation={true}
                        />
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
