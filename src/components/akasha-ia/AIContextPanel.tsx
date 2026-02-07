import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain,
  History,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  FileText,
  Code,
  Clock,
  Sparkles,
  ChevronRight,
  Copy,
  MessageSquare,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface Suggestion {
  id: string;
  type: "improvement" | "warning" | "tip";
  title: string;
  description: string;
  code?: string;
}

interface HistoryItem {
  id: string;
  action: string;
  timestamp: Date;
  status: "success" | "error" | "pending";
}

interface AIContextPanelProps {
  aiResponse?: string;
  isProcessing?: boolean;
  code?: string;
  language?: string;
}

export function AIContextPanel({
  aiResponse,
  isProcessing = false,
  code = "",
  language = "typescript",
}: AIContextPanelProps) {
  const [activeTab, setActiveTab] = useState("response");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Parse AI response for suggestions
  useEffect(() => {
    if (aiResponse) {
      // Add to history
      setHistory((prev) => [
        {
          id: Date.now().toString(),
          action: "Respuesta IA",
          timestamp: new Date(),
          status: "success",
        },
        ...prev.slice(0, 19),
      ]);

      // Extract suggestions from response
      const newSuggestions: Suggestion[] = [];

      // Look for improvement patterns
      const improvementPatterns = [
        /(?:puedes|deberías|considera|recomiendo|sugiero)\s+(.+?)(?:\.|$)/gi,
        /(?:mejor|optimiza|refactoriza)\s+(.+?)(?:\.|$)/gi,
      ];

      improvementPatterns.forEach((pattern) => {
        let match;
        while ((match = pattern.exec(aiResponse)) !== null) {
          if (match[1]?.length > 10 && match[1]?.length < 200) {
            newSuggestions.push({
              id: `sug-${Date.now()}-${Math.random()}`,
              type: "improvement",
              title: "Mejora sugerida",
              description: match[1].trim(),
            });
          }
        }
      });

      // Look for warnings
      const warningPatterns = [/(?:cuidado|atención|problema|error|bug|vulnerabilidad)\s*[:\s]+(.+?)(?:\.|$)/gi];

      warningPatterns.forEach((pattern) => {
        let match;
        while ((match = pattern.exec(aiResponse)) !== null) {
          if (match[1]?.length > 10 && match[1]?.length < 200) {
            newSuggestions.push({
              id: `warn-${Date.now()}-${Math.random()}`,
              type: "warning",
              title: "Advertencia",
              description: match[1].trim(),
            });
          }
        }
      });

      setSuggestions((prev) => [...newSuggestions, ...prev].slice(0, 10));
    }
  }, [aiResponse]);

  // Analyze code for basic suggestions
  useEffect(() => {
    if (code.length > 50) {
      const tips: Suggestion[] = [];

      // Check for console.log
      if (code.includes("console.log")) {
        tips.push({
          id: "tip-console",
          type: "tip",
          title: "Logs de desarrollo",
          description: "Hay console.log en el código. Considera eliminarlos en producción.",
        });
      }

      // Check for any type
      if (code.includes(": any")) {
        tips.push({
          id: "tip-any",
          type: "warning",
          title: "Tipado débil",
          description: "Se detectó uso de 'any'. Considera usar tipos más específicos.",
        });
      }

      // Check for inline styles
      if (code.includes('style={{')) {
        tips.push({
          id: "tip-inline",
          type: "tip",
          title: "Estilos inline",
          description: "Considera usar clases de Tailwind en lugar de estilos inline.",
        });
      }

      // Check for missing error handling
      if (code.includes("async") && !code.includes("catch") && !code.includes("try")) {
        tips.push({
          id: "tip-error",
          type: "warning",
          title: "Sin manejo de errores",
          description: "Funciones async sin try/catch. Añade manejo de errores.",
        });
      }

      setSuggestions((prev) => {
        const existingIds = prev.map((s) => s.id);
        const newTips = tips.filter((t) => !existingIds.includes(t.id));
        return [...newTips, ...prev].slice(0, 10);
      });
    }
  }, [code]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  const getSuggestionIcon = (type: Suggestion["type"]) => {
    switch (type) {
      case "improvement":
        return <Lightbulb className="h-4 w-4 text-green-400" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case "tip":
        return <Sparkles className="h-4 w-4 text-cyan-400" />;
    }
  };

  return (
    <Card className="h-full bg-card/50 border-cyan-500/20 flex flex-col">
      <CardHeader className="py-2 px-3 border-b border-cyan-500/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-cyan-400" />
            Contexto IA
          </CardTitle>
          {isProcessing && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Loader2 className="h-3 w-3 animate-spin" />
              Procesando
            </Badge>
          )}
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="h-8 bg-transparent border-b border-cyan-500/10 rounded-none px-2 gap-1">
          <TabsTrigger value="response" className="text-xs h-7 data-[state=active]:bg-cyan-500/20">
            <MessageSquare className="h-3 w-3 mr-1" />
            Respuesta
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="text-xs h-7 data-[state=active]:bg-cyan-500/20">
            <Lightbulb className="h-3 w-3 mr-1" />
            Tips
            {suggestions.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 text-[10px]">
                {suggestions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs h-7 data-[state=active]:bg-cyan-500/20">
            <History className="h-3 w-3 mr-1" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="response" className="flex-1 m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-3">
              {aiResponse ? (
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      code: ({ className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || "");
                        const codeString = String(children).replace(/\n$/, "");
                        
                        if (match) {
                          return (
                            <div className="relative group my-2">
                              <div className="flex items-center justify-between bg-muted/50 px-3 py-1 rounded-t-md border border-cyan-500/20 border-b-0">
                                <span className="text-[10px] text-muted-foreground uppercase">
                                  {match[1]}
                                </span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => copyToClipboard(codeString)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              <pre className="bg-muted/30 p-3 rounded-b-md overflow-x-auto border border-cyan-500/20 border-t-0">
                                <code className="text-xs">{codeString}</code>
                              </pre>
                            </div>
                          );
                        }
                        
                        return (
                          <code className="bg-muted/50 px-1 py-0.5 rounded text-xs text-cyan-400" {...props}>
                            {children}
                          </code>
                        );
                      },
                      p: ({ children }) => <p className="text-sm text-muted-foreground mb-2">{children}</p>,
                      h1: ({ children }) => <h1 className="text-lg font-bold text-foreground mb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-semibold text-foreground mb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold text-foreground mb-1">{children}</h3>,
                      ul: ({ children }) => <ul className="list-disc list-inside text-sm text-muted-foreground mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside text-sm text-muted-foreground mb-2 space-y-1">{children}</ol>,
                      li: ({ children }) => <li>{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                    }}
                  >
                    {aiResponse}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Las respuestas de IA aparecerán aquí</p>
                  <p className="text-xs mt-1">Usa las herramientas de IA para analizar tu código</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="suggestions" className="flex-1 m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-2">
              {suggestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sin sugerencias aún</p>
                  <p className="text-xs mt-1">Las sugerencias aparecerán al analizar tu código</p>
                </div>
              ) : (
                suggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="bg-muted/30 border-cyan-500/10">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        {getSuggestionIcon(suggestion.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium">{suggestion.title}</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                suggestion.type === "warning"
                                  ? "border-yellow-500/50 text-yellow-400"
                                  : suggestion.type === "improvement"
                                  ? "border-green-500/50 text-green-400"
                                  : "border-cyan-500/50 text-cyan-400"
                              }`}
                            >
                              {suggestion.type === "warning"
                                ? "Advertencia"
                                : suggestion.type === "improvement"
                                ? "Mejora"
                                : "Tip"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {suggestion.description}
                          </p>
                          {suggestion.code && (
                            <pre className="bg-muted/50 p-2 rounded text-[10px] mt-2 overflow-x-auto">
                              <code>{suggestion.code}</code>
                            </pre>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="history" className="flex-1 m-0 p-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sin historial</p>
                  <p className="text-xs mt-1">Tus acciones de IA aparecerán aquí</p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/30"
                  >
                    {item.status === "success" ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-400 shrink-0" />
                    ) : item.status === "error" ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    ) : (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs truncate block">{item.action}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {item.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
