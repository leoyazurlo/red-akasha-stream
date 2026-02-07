import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  Bug,
  Wand2,
  FileSearch,
  Lightbulb,
  Zap,
  Code,
  Shield,
  RefreshCw,
  Settings,
  MessageSquare,
  Eye,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  Braces,
  FileCode,
  Palette,
  Gauge,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AIAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  category: "analyze" | "generate" | "refactor" | "debug";
  prompt: string;
}

const AI_ACTIONS: AIAction[] = [
  {
    id: "analyze-code",
    label: "Analizar Código",
    description: "Revisa calidad, patrones y posibles mejoras",
    icon: FileSearch,
    category: "analyze",
    prompt: "Analiza este código y proporciona un informe de calidad, patrones utilizados, posibles mejoras y vulnerabilidades de seguridad:",
  },
  {
    id: "suggest-improvements",
    label: "Sugerir Mejoras",
    description: "Recomendaciones de optimización",
    icon: Lightbulb,
    category: "analyze",
    prompt: "Sugiere mejoras específicas para optimizar este código en términos de rendimiento, legibilidad y mantenibilidad:",
  },
  {
    id: "find-bugs",
    label: "Detectar Bugs",
    description: "Encuentra errores potenciales",
    icon: Bug,
    category: "debug",
    prompt: "Analiza este código en busca de bugs potenciales, condiciones de carrera, memory leaks y otros problemas:",
  },
  {
    id: "add-comments",
    label: "Documentar",
    description: "Añade comentarios explicativos",
    icon: MessageSquare,
    category: "refactor",
    prompt: "Añade comentarios JSDoc y documentación inline a este código explicando su funcionamiento:",
  },
  {
    id: "add-types",
    label: "Añadir Tipos",
    description: "Mejora tipado TypeScript",
    icon: Braces,
    category: "refactor",
    prompt: "Mejora el tipado TypeScript de este código añadiendo interfaces, tipos genéricos y type guards donde sea necesario:",
  },
  {
    id: "optimize-perf",
    label: "Optimizar Rendimiento",
    description: "Mejora el performance",
    icon: Gauge,
    category: "refactor",
    prompt: "Optimiza este código para mejor rendimiento: memoización, lazy loading, optimización de renders:",
  },
  {
    id: "add-tests",
    label: "Generar Tests",
    description: "Crea tests unitarios",
    icon: Shield,
    category: "generate",
    prompt: "Genera tests unitarios completos para este código usando Vitest y Testing Library:",
  },
  {
    id: "convert-component",
    label: "Extraer Componente",
    description: "Separa en componentes reutilizables",
    icon: FileCode,
    category: "refactor",
    prompt: "Analiza este código y extrae componentes reutilizables siguiendo el principio de responsabilidad única:",
  },
  {
    id: "add-styling",
    label: "Mejorar Estilos",
    description: "Mejora el diseño visual",
    icon: Palette,
    category: "generate",
    prompt: "Mejora los estilos de este componente usando Tailwind CSS con animaciones, transiciones y un diseño más moderno:",
  },
  {
    id: "explain-code",
    label: "Explicar Código",
    description: "Explica paso a paso",
    icon: Eye,
    category: "analyze",
    prompt: "Explica este código paso a paso de forma clara para alguien que está aprendiendo:",
  },
];

interface AIActionsToolbarProps {
  code: string;
  language: string;
  onCodeUpdate?: (newCode: string) => void;
  onAIResponse?: (response: string) => void;
}

export function AIActionsToolbar({
  code,
  language,
  onCodeUpdate,
  onAIResponse,
}: AIActionsToolbarProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ action: string; success: boolean } | null>(null);

  const executeAction = async (action: AIAction) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setActiveAction(action.id);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error("Debes iniciar sesión para usar esta función");
      }

      const { data, error } = await supabase.functions.invoke("akasha-ia-chat", {
        body: {
          messages: [
            {
              role: "system",
              content: `Eres un experto desarrollador de Red Akasha. Responde siempre en español. 
                        Cuando generes código, usa bloques markdown con el lenguaje apropiado.
                        Sé conciso pero completo en tus respuestas.`,
            },
            {
              role: "user",
              content: `${action.prompt}\n\n\`\`\`${language}\n${code}\n\`\`\``,
            },
          ],
        },
      });

      if (error) throw error;

      const responseContent = data?.content || data?.response || "";

      // Extract code if present
      const codeMatch = responseContent.match(/```(?:typescript|tsx|javascript|jsx|sql)?\n([\s\S]*?)```/);
      
      if (codeMatch && onCodeUpdate && ["refactor", "generate"].includes(action.category)) {
        // Offer to apply the code
        const confirmed = window.confirm("¿Deseas aplicar los cambios sugeridos al código?");
        if (confirmed) {
          onCodeUpdate(codeMatch[1].trim());
          toast.success("Código actualizado");
        }
      }

      onAIResponse?.(responseContent);
      setLastResult({ action: action.id, success: true });
      toast.success(`${action.label} completado`);
    } catch (err) {
      console.error("AI Action error:", err);
      setLastResult({ action: action.id, success: false });
      toast.error(err instanceof Error ? err.message : "Error al ejecutar acción");
    } finally {
      setIsProcessing(false);
      setActiveAction(null);
    }
  };

  const categories = {
    analyze: { label: "Analizar", icon: FileSearch, color: "text-blue-400" },
    debug: { label: "Debug", icon: Bug, color: "text-red-400" },
    refactor: { label: "Refactorizar", icon: RefreshCw, color: "text-yellow-400" },
    generate: { label: "Generar", icon: Zap, color: "text-green-400" },
  };

  return (
    <div className="flex items-center gap-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 gap-1 text-xs hover:bg-cyan-500/20"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
            ) : (
              <Wand2 className="h-3.5 w-3.5 text-cyan-400" />
            )}
            <span className="hidden sm:inline">Acciones IA</span>
            <Sparkles className="h-3 w-3 text-cyan-400/60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-3 border-b border-cyan-500/20">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="font-medium text-sm">Herramientas de IA</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Acciones inteligentes para tu código
            </p>
          </div>

          <ScrollArea className="max-h-80">
            <div className="p-2 space-y-3">
              {Object.entries(categories).map(([catKey, catInfo]) => {
                const Icon = catInfo.icon;
                const actions = AI_ACTIONS.filter((a) => a.category === catKey);

                return (
                  <div key={catKey}>
                    <div className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium ${catInfo.color}`}>
                      <Icon className="h-3 w-3" />
                      {catInfo.label}
                    </div>
                    <div className="space-y-0.5">
                      {actions.map((action) => {
                        const ActionIcon = action.icon;
                        const isActive = activeAction === action.id;
                        const wasSuccessful = lastResult?.action === action.id && lastResult.success;

                        return (
                          <Button
                            key={action.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start h-auto py-2 px-2 hover:bg-muted/50"
                            onClick={() => executeAction(action)}
                            disabled={isProcessing}
                          >
                            <div className="flex items-start gap-2 w-full">
                              {isActive ? (
                                <Loader2 className="h-4 w-4 animate-spin text-cyan-400 shrink-0 mt-0.5" />
                              ) : wasSuccessful ? (
                                <CheckCircle className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                              ) : (
                                <ActionIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                              )}
                              <div className="text-left">
                                <div className="text-xs font-medium">{action.label}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  {action.description}
                                </div>
                              </div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="p-2 border-t border-cyan-500/20 bg-muted/30">
            <p className="text-[10px] text-muted-foreground text-center">
              Potenciado por Akasha IA • Gemini & GPT
            </p>
          </div>
        </PopoverContent>
      </Popover>

      {/* Quick actions */}
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        onClick={() => executeAction(AI_ACTIONS.find((a) => a.id === "find-bugs")!)}
        disabled={isProcessing}
        title="Detectar Bugs"
      >
        <Bug className="h-3.5 w-3.5" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7"
        onClick={() => executeAction(AI_ACTIONS.find((a) => a.id === "suggest-improvements")!)}
        disabled={isProcessing}
        title="Sugerir Mejoras"
      >
        <Lightbulb className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
