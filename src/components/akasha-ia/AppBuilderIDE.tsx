import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notifySuccess, notifyError, notifyLoading, dismissNotification } from "@/lib/notifications";
import ReactMarkdown from "react-markdown";
import {
  Code,
  Database,
  Server,
  GitBranch,
  Loader2,
  CheckCircle,
  XCircle,
  Send,
  FileCode,
  Eye,
  Rocket,
  Shield,
  Users,
  Play,
  Save,
  FolderTree,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Terminal,
  Settings,
  Undo,
  Redo,
  Copy,
  Download,
  ChevronRight,
  ChevronDown,
  File as FileIcon,
  Folder,
  Brain,
  Wand2,
  Zap,
  PanelRightClose,
  PanelRight,
} from "lucide-react";
const MonacoEditor = lazy(() => import("./MonacoEditor").then(m => ({ default: m.MonacoEditor })));
import { SandboxPreview } from "./SandboxPreview";
import { AIActionsToolbar } from "./AIActionsToolbar";
import { AIContextPanel } from "./AIContextPanel";
import { ChatFileUpload, UploadedFile, processFileForUpload } from "./ChatFileUpload";
import { MultiAgentPanel } from "./MultiAgentPanel";
import { CommunityVoting } from "./CommunityVoting";

interface GeneratedCode {
  frontend: string;
  backend: string;
  database: string;
}

interface ProjectFile {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  language?: "typescript" | "javascript" | "sql" | "json" | "css";
  content?: string;
  children?: ProjectFile[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  files?: UploadedFile[];
}

const LIFECYCLE_STAGES = [
  { key: "draft", label: "Borrador", icon: FileCode },
  { key: "generating", label: "Generando", icon: Code },
  { key: "validating", label: "Validando", icon: Shield },
  { key: "pending_approval", label: "Aprobación", icon: Users },
  { key: "approved", label: "Aprobado", icon: CheckCircle },
  { key: "merged", label: "Integrado", icon: GitBranch },
  { key: "deployed", label: "Producción", icon: Rocket },
];

export function AppBuilderIDE() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode>({
    frontend: `function App() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-lg w-full rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">🚀 Akasha App Builder</h1>
          <p className="text-muted-foreground text-sm">Describe tu aplicación en el chat y la construiré para ti</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
            <span className="text-sm text-foreground">Escribe qué quieres crear</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
            <span className="text-sm text-foreground">Revisa el código generado</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
            <span className="text-sm text-foreground">Ve el resultado aquí</span>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-border text-center">
          <button 
            onClick={() => setCount(c => c + 1)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Clicks: {count}
          </button>
        </div>
      </div>
    </div>
  );
}`,
    backend: "// El código del backend aparecerá aquí...",
    database: "-- Las migraciones SQL aparecerán aquí...",
  });
  const [activeTab, setActiveTab] = useState<"frontend" | "backend" | "database">("frontend");
  const [lifecycleStage, setLifecycleStage] = useState("draft");
  const [validationScore, setValidationScore] = useState<number | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [aiResponse, setAIResponse] = useState<string>("");
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([
    {
      id: "1",
      name: "src",
      path: "/src",
      type: "folder",
      children: [
        {
          id: "2",
          name: "App.tsx",
          path: "/src/App.tsx",
          type: "file",
          language: "typescript",
          content: generatedCode.frontend,
        },
        {
          id: "3",
          name: "components",
          path: "/src/components",
          type: "folder",
          children: [],
        },
      ],
    },
    {
      id: "4",
      name: "supabase",
      path: "/supabase",
      type: "folder",
      children: [
        {
          id: "5",
          name: "functions",
          path: "/supabase/functions",
          type: "folder",
          children: [
            {
              id: "6",
              name: "index.ts",
              path: "/supabase/functions/index.ts",
              type: "file",
              language: "typescript",
              content: generatedCode.backend,
            },
          ],
        },
        {
          id: "7",
          name: "migrations",
          path: "/supabase/migrations",
          type: "folder",
          children: [
            {
              id: "8",
              name: "001_initial.sql",
              path: "/supabase/migrations/001_initial.sql",
              type: "file",
              language: "sql",
              content: generatedCode.database,
            },
          ],
        },
      ],
    },
  ]);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["1", "4"]));
  const [proposalId, setProposalId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const appendAssistantMessage = (content: string) => {
    setMessages((prev) => [...prev, { role: "assistant", content }]);
    setAIResponse(content);
  };
  const isCodeGenerationRequest = (message: string): boolean => {
    const m = message.toLowerCase();

    // Explicit "build/code" intents
    const codeKeywords = [
      "genera",
      "generar",
      "crea",
      "crear",
      "implementa",
      "implementar",
      "desarrolla",
      "desarrollar",
      "construye",
      "construir",
      "programa",
      "codifica",
      "escribe código",
      "haz código",
      "nuevo componente",
      "nueva función",
      "nueva feature",
      "add feature",
      "create",
      "build",
      "generate",
      "implement",
      "develop",
    ];

    // Edit/modify intents (common when users want a change like Lovable)
    const editKeywords = [
      "cambia",
      "cambiar",
      "modifica",
      "modificar",
      "actualiza",
      "actualizar",
      "reemplaza",
      "reemplazar",
      "saca",
      "sacar",
      "quita",
      "quitar",
      "pone",
      "poner",
      "agrega",
      "agregar",
      "añade",
      "añadir",
      "ajusta",
      "ajustar",
      "arregla",
      "arreglar",
      "fix",
      "corrige",
      "corregir",
      "refactoriza",
      "refactorizar",
      "optimiza",
      "optimizar",
    ];

    // Typical UI targets
    const uiTargets = [
      "footer",
      "header",
      "navbar",
      "menú",
      "menu",
      "logo",
      "icono",
      "ícono",
      "texto",
      "botón",
      "boton",
      "color",
      "estilo",
      "css",
      "tailwind",
      "layout",
      "diseño",
      "diseno",
      "responsive",
      "mobile",
      "móvil",
      "movil",
    ];

    const hasExplicitCodeIntent = codeKeywords.some((k) => m.includes(k));
    const hasEditIntent = editKeywords.some((k) => m.includes(k));
    const hasUiTarget = uiTargets.some((k) => m.includes(k));

    // Treat as implementation if explicit, OR it looks like an edit request on UI
    return hasExplicitCodeIntent || (hasEditIntent && hasUiTarget);
  };

  // Send message to AI - supports both chat and code generation
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // Build message with file context
    let messageContent = input.trim();
    const completedFiles = uploadedFiles.filter(f => f.status === "completed");
    
    if (completedFiles.length > 0) {
      messageContent += "\n\n[Archivos adjuntos:";
      completedFiles.forEach(file => {
        messageContent += `\n- ${file.name} (${file.type})`;
        if (file.content) {
          messageContent += `:\n\`\`\`\n${file.content.slice(0, 5000)}\n\`\`\``;
        }
      });
      messageContent += "]";
    }

    const userMessage: Message = { role: "user", content: input.trim(), files: completedFiles };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error("No hay sesión activa");
      }

      // Determine if this is a code generation request or a chat conversation
      const shouldGenerateCode = isCodeGenerationRequest(input.trim());

      // Set processing state for AI Context Panel
      setIsAIProcessing(true);

      if (shouldGenerateCode) {
        // Code generation flow - Automated pipeline like Lovable
        setLifecycleStage("generating");

        // Step 1: Generate code
        const genMessage = "⚡ Generando código...";
        appendAssistantMessage(genMessage);

        const { data: implData, error: implError } = await supabase.functions.invoke(
          "generate-implementation",
          {
            body: {
              title: input.trim().slice(0, 100),
              description: messageContent,
            },
          }
        );

        if (implError) throw implError;

        const newCode: GeneratedCode = {
          frontend: implData.frontend || generatedCode.frontend,
          backend: implData.backend || generatedCode.backend,
          database: implData.database || generatedCode.database,
        };

        setGeneratedCode(newCode);
        updateFileContent("/src/App.tsx", newCode.frontend);
        updateFileContent("/supabase/functions/index.ts", newCode.backend);
        updateFileContent("/supabase/migrations/001_initial.sql", newCode.database);

        // Step 2: Auto-validate immediately
        appendAssistantMessage("✅ Código generado. Validando...");
        setLifecycleStage("validating");

        // Create proposal for tracking
        const { data: { user } } = await supabase.auth.getUser();
        const { data: proposal } = await supabase
          .from("ia_feature_proposals")
          .insert([{
            title: input.trim().slice(0, 100),
            description: input.trim(),
            proposed_code: JSON.stringify(newCode),
            requested_by: user?.id,
            lifecycle_stage: "validating" as const,
            status: "pending",
          }])
          .select()
          .single();

        const currentProposalId = proposal?.id;
        if (currentProposalId) {
          setProposalId(currentProposalId);
        }

        // Step 3: Run validation automatically
        try {
          const { data: valData, error: valError } = await supabase.functions.invoke("validate-code", {
            body: {
              proposalId: currentProposalId,
              code: newCode,
              title: input.trim().slice(0, 100),
              description: input.trim(),
            },
          });

          if (valError) throw valError;

          setValidationScore(valData.score);

          if (valData.passed) {
            setLifecycleStage("pending_approval");
            const successMsg = `### ✅ Listo para producción\n\n**Score:** ${valData.score}/100\n\nEl código está en el editor. Usa el botón **"Crear PR"** para integrarlo.`;
            appendAssistantMessage(successMsg);
          } else {
            setLifecycleStage("draft");
            const adjustMsg = `### ⚠️ Necesita ajustes (${valData.score}/100)\n\n${valData.summary || "Revisa el código en el editor"}`;
            appendAssistantMessage(adjustMsg);
          }
        } catch (valErr) {
          // Validation failed but code is ready
          console.error("Validation error:", valErr);
          setLifecycleStage("draft");
          const fallbackMsg = `### ✅ Código generado\n\nNo se pudo validar automáticamente. Revisa el código en el editor.`;
          appendAssistantMessage(fallbackMsg);
        }

        toast.success("Código generado exitosamente");
      } else {
        // Chat conversation flow - use akasha-ia-chat for real AI responses
        const chatMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/akasha-ia-chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              messages: chatMessages,
              // Keep chat fast/light by default. Enable only when the user asks for stats/artists.
              includePlatformStats: false,
              includeArtistsContext: false,
            }),
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Sesión expirada. Por favor recarga la página.");
          }
          if (response.status === 429) {
            throw new Error("Límite de solicitudes excedido. Intenta de nuevo en unos segundos.");
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Error al comunicarse con la IA");
        }

        // Stream the response
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No se pudo leer la respuesta");

        const decoder = new TextDecoder();
        let assistantContent = "";
        let buffer = "";

        // Add placeholder message
        setMessages((prev) => [...prev, { role: "assistant", content: "..." }]);

        let streamDone = false;

        const updateStreamingMessage = (content: string) => {
          setMessages((prev) => {
            const next = [...prev];
            const lastIdx = next.length - 1;
            if (lastIdx >= 0 && next[lastIdx]?.role === "assistant") {
              next[lastIdx] = { ...next[lastIdx], content };
              return next;
            }
            return [...next, { role: "assistant", content }];
          });
        };

        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":")) continue; // keepalive/comments
            if (!trimmed.startsWith("data: ")) continue;

            const payload = trimmed.slice(6).trim();
            if (payload === "[DONE]") {
              streamDone = true;
              break;
            }

            try {
              const data = JSON.parse(payload);
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                updateStreamingMessage(assistantContent);
              }
            } catch {
              // Partial JSON split across chunks: put the line back and wait for more data
              buffer = line + "\n" + buffer;
              break;
            }
          }
        }

        // Flush any remaining buffered line (optional best-effort)
        const leftover = buffer.trim();
        if (leftover.startsWith("data: ")) {
          const payload = leftover.slice(6).trim();
          if (payload !== "[DONE]") {
            try {
              const data = JSON.parse(payload);
              const content = data.choices?.[0]?.delta?.content;
              if (content) assistantContent += content;
            } catch {
              // ignore
            }
          }
        }

        // Final update with complete response
        if (assistantContent) {
          updateStreamingMessage(assistantContent);
          setAIResponse(assistantContent); // Sync with AI Context Panel
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error al procesar mensaje");
      setAIResponse(""); // Clear on error
      setLifecycleStage("draft");
    } finally {
      setIsLoading(false);
      setIsAIProcessing(false);
    }
  };

  // Update file content helper
  const updateFileContent = (path: string, content: string) => {
    const updateFiles = (files: ProjectFile[]): ProjectFile[] => {
      return files.map((file) => {
        if (file.path === path) {
          return { ...file, content };
        }
        if (file.children) {
          return { ...file, children: updateFiles(file.children) };
        }
        return file;
      });
    };
    setProjectFiles(updateFiles(projectFiles));
  };

  // Validate code
  const validateCode = async () => {
    if (!proposalId) {
      toast.error("Genera código primero");
      return;
    }

    setIsValidating(true);
    setLifecycleStage("validating");

    try {
      const { data, error } = await supabase.functions.invoke("validate-code", {
        body: {
          proposalId,
          code: generatedCode,
          title: messages[0]?.content || "Aplicación",
          description: messages[0]?.content || "",
        },
      });

      if (error) throw error;

      setValidationScore(data.score);

      if (data.passed) {
        setLifecycleStage("pending_approval");
        toast.success(`Validación exitosa (${data.score}/100)`);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `✅ **Validación completada**: ${data.score}/100\n\n${data.summary}\n\nEl código está listo para revisión de la comunidad.`,
          },
        ]);
      } else {
        setLifecycleStage("draft");
        toast.error(`Validación fallida (${data.score}/100)`);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `❌ **Validación fallida**: ${data.score}/100\n\n${data.summary}\n\n**Recomendaciones:**\n${data.recommendations?.map((r: string) => `- ${r}`).join("\n") || "Revisa el código manualmente"}`,
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error en validación");
      setLifecycleStage("draft");
    } finally {
      setIsValidating(false);
    }
  };

  // Create PR
  const createPullRequest = async () => {
    if (!proposalId) {
      toast.error("No hay propuesta activa");
      return;
    }

    setIsCreatingPR(true);

    try {
      const { data, error } = await supabase.functions.invoke("github-create-pr", {
        body: {
          proposalId,
          title: messages[0]?.content?.slice(0, 50) || "Nueva característica",
          description: messages[0]?.content || "",
          frontendCode: generatedCode.frontend,
          backendCode: generatedCode.backend,
          databaseCode: generatedCode.database,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setLifecycleStage("merged");
      toast.success("Pull Request creado");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `🎉 **Pull Request creado exitosamente**\n\n[Ver PR en GitHub](${data.prUrl})\n\nUna vez aprobado y mergeado, el código se desplegará automáticamente.`,
        },
      ]);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Error";
      toast.error(msg);
    } finally {
      setIsCreatingPR(false);
    }
  };

  // Handle code change in editor
  const handleCodeChange = (newCode: string) => {
    const key = activeTab;
    setGeneratedCode((prev) => ({ ...prev, [key]: newCode }));

    // Update file tree
    const pathMap: Record<string, string> = {
      frontend: "/src/App.tsx",
      backend: "/supabase/functions/index.ts",
      database: "/supabase/migrations/001_initial.sql",
    };
    updateFileContent(pathMap[key], newCode);
  };

  // Toggle folder expansion
  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Render file tree
  const renderFileTree = (files: ProjectFile[], depth = 0) => {
    return files.map((file) => (
      <div key={file.id}>
        <div
          className={`flex items-center gap-1.5 px-2 py-1 hover:bg-muted/50 cursor-pointer rounded text-sm ${
            selectedFile?.id === file.id ? "bg-cyan-500/20 text-cyan-400" : ""
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (file.type === "folder") {
              toggleFolder(file.id);
            } else {
              setSelectedFile(file);
              if (file.path.includes("/src/")) {
                setActiveTab("frontend");
              } else if (file.path.includes("/functions/")) {
                setActiveTab("backend");
              } else if (file.path.includes("/migrations/")) {
                setActiveTab("database");
              }
            }
          }}
        >
          {file.type === "folder" ? (
            <>
              {expandedFolders.has(file.id) ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <Folder className="h-4 w-4 text-cyan-400" />
            </>
          ) : (
            <>
              <span className="w-3.5" />
              <FileIcon className="h-4 w-4 text-muted-foreground" />
            </>
          )}
          <span className="truncate">{file.name}</span>
        </div>
        {file.type === "folder" && expandedFolders.has(file.id) && file.children && (
          <div>{renderFileTree(file.children, depth + 1)}</div>
        )}
      </div>
    ));
  };

  // Get stage index
  const getStageIndex = (stage: string) => {
    return LIFECYCLE_STAGES.findIndex((s) => s.key === stage);
  };

  return (
    <div className="h-[calc(100vh-200px)] min-h-[600px] flex flex-col">
      {/* Lifecycle Progress Bar */}
      <Card className="mb-4 bg-card/50 border-cyan-500/20">
        <CardContent className="py-3">
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            {LIFECYCLE_STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const currentIdx = getStageIndex(lifecycleStage);
              const isActive = idx === currentIdx;
              const isComplete = idx < currentIdx;

              return (
                <div key={stage.key} className="flex items-center">
                  <div
                    className={`flex flex-col items-center min-w-[60px] ${
                      isActive
                        ? "text-cyan-400"
                        : isComplete
                        ? "text-green-400"
                        : "text-muted-foreground/40"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                        isActive
                          ? "border-cyan-400 bg-cyan-400/20 ring-2 ring-cyan-400/30"
                          : isComplete
                          ? "border-green-500 bg-green-500/20"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {isComplete ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className="text-[10px] mt-1 font-medium">{stage.label}</span>
                  </div>
                  {idx < LIFECYCLE_STAGES.length - 1 && (
                    <ArrowRight
                      className={`h-3 w-3 mx-1 ${isComplete ? "text-green-500" : "text-muted-foreground/30"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main IDE Layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0 rounded-lg border border-cyan-500/20">
        {/* Left: File Explorer + Chat */}
        <ResizablePanel defaultSize={25} minSize={15} maxSize={35} className="min-h-0">
          <div className="h-full min-h-0 flex flex-col bg-card/50">
            {/* File Explorer */}
            <div className="border-b border-cyan-500/10">
              <div className="flex items-center justify-between p-2 border-b border-cyan-500/10">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <FolderTree className="h-3.5 w-3.5" />
                  EXPLORER
                </span>
                <Button size="icon" variant="ghost" className="h-5 w-5">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <ScrollArea className="h-40">
                <div className="py-1">{renderFileTree(projectFiles)}</div>
              </ScrollArea>
            </div>

            {/* AI Chat */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center gap-2 p-2 border-b border-cyan-500/10 flex-shrink-0">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-medium">AKASHA IA</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 min-h-0">
                <div className="space-y-3">
                  {messages.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Describe qué quieres crear...
                    </p>
                  )}
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`text-xs p-2 rounded-lg break-words ${
                        msg.role === "user"
                          ? "bg-cyan-500/20 text-foreground ml-4"
                          : "bg-muted/50 text-muted-foreground mr-4"
                      }`}
                    >
                      {/* Show attached files */}
                      {msg.files && msg.files.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {msg.files.map((file) => (
                            <Badge
                              key={file.id}
                              variant="outline"
                              className="text-[10px] gap-1 h-5"
                            >
                              {file.type === "image" && <Eye className="h-2.5 w-2.5" />}
                              {file.type === "code" && <Code className="h-2.5 w-2.5" />}
                              {file.type === "document" && <FileCode className="h-2.5 w-2.5" />}
                              {file.name.slice(0, 15)}{file.name.length > 15 ? "..." : ""}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5 prose-pre:my-2 prose-code:text-cyan-400">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Generando código...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              <div className="p-2 border-t border-cyan-500/10">
                <div className="flex gap-1 items-center">
                  <ChatFileUpload
                    files={uploadedFiles}
                    onFilesChange={setUploadedFiles}
                    disabled={isLoading}
                  />
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={uploadedFiles.length > 0 ? "Describe qué hacer con los archivos..." : "Describe tu aplicación... (Ctrl+V para pegar imágenes)"}
                    className="text-xs h-8 flex-1"
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    disabled={isLoading}
                    onPaste={async (e) => {
                      console.log("[Akasha IA] Paste event detected");
                      const clipboardItems = e.clipboardData?.items;
                      if (!clipboardItems) {
                        console.log("[Akasha IA] No clipboard items found");
                        return;
                      }
                      
                      console.log("[Akasha IA] Clipboard items count:", clipboardItems.length);
                      
                      for (let i = 0; i < clipboardItems.length; i++) {
                        const item = clipboardItems[i];
                        console.log("[Akasha IA] Item type:", item.type, "kind:", item.kind);
                        
                        // Handle images from clipboard
                        if (item.type.startsWith("image/")) {
                          e.preventDefault();
                          const file = item.getAsFile();
                          if (file) {
                            console.log("[Akasha IA] Processing pasted image:", file.name || "unnamed", file.type);
                            const timestamp = Date.now();
                            const ext = item.type.split("/")[1] || "png";
                            const namedFile = new File([file], `pasted-image-${timestamp}.${ext}`, { type: file.type });
                            toast.info("Procesando imagen pegada...");
                            await processFileForUpload(namedFile, uploadedFiles, setUploadedFiles);
                          }
                        }
                        
                        // Handle other files
                        if (item.kind === "file" && !item.type.startsWith("image/")) {
                          e.preventDefault();
                          const file = item.getAsFile();
                          if (file) {
                            console.log("[Akasha IA] Processing pasted file:", file.name, file.type);
                            toast.info("Procesando archivo pegado...");
                            await processFileForUpload(file, uploadedFiles, setUploadedFiles);
                          }
                        }
                      }
                    }}
                  />
                  <Button size="icon" className="h-8 w-8" onClick={sendMessage} disabled={isLoading || (!input.trim() && uploadedFiles.length === 0)}>
                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Center: Code Editor */}
        <ResizablePanel defaultSize={showContextPanel ? 35 : 45} minSize={25} className="min-h-0">
          <div className="h-full min-h-0 flex flex-col bg-card/30">
            {/* Editor Tabs */}
            <div className="flex items-center justify-between border-b border-cyan-500/10 px-2 bg-card/50 relative z-10">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1">
                <TabsList className="h-9 bg-transparent gap-0.5 border-none">
                  <TabsTrigger
                    value="frontend"
                    className="text-xs h-7 data-[state=active]:bg-cyan-500/20 border-none"
                  >
                    <Code className="h-3 w-3 mr-1" />
                    Frontend
                  </TabsTrigger>
                  <TabsTrigger
                    value="backend"
                    className="text-xs h-7 data-[state=active]:bg-cyan-500/20 border-none"
                  >
                    <Server className="h-3 w-3 mr-1" />
                    Backend
                  </TabsTrigger>
                  <TabsTrigger
                    value="database"
                    className="text-xs h-7 data-[state=active]:bg-cyan-500/20 border-none"
                  >
                    <Database className="h-3 w-3 mr-1" />
                    Database
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-1">
                {/* AI Actions Toolbar */}
                <AIActionsToolbar
                  code={
                    activeTab === "frontend"
                      ? generatedCode.frontend
                      : activeTab === "backend"
                      ? generatedCode.backend
                      : generatedCode.database
                  }
                  language={activeTab === "database" ? "sql" : "typescript"}
                  onCodeUpdate={handleCodeChange}
                  onAIResponse={(response) => {
                    setAIResponse(response);
                    setShowContextPanel(true);
                  }}
                />
                <div className="w-px h-4 bg-cyan-500/20 mx-1" />
                <Button size="icon" variant="ghost" className="h-6 w-6" title="Deshacer">
                  <Undo className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" title="Rehacer">
                  <Redo className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" title="Copiar">
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  title={showContextPanel ? "Ocultar Panel IA" : "Mostrar Panel IA"}
                  onClick={() => setShowContextPanel(!showContextPanel)}
                >
                  {showContextPanel ? (
                    <PanelRightClose className="h-3 w-3" />
                  ) : (
                    <PanelRight className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                <MonacoEditor
                  value={
                    activeTab === "frontend"
                      ? generatedCode.frontend
                      : activeTab === "backend"
                      ? generatedCode.backend
                      : generatedCode.database
                  }
                  onChange={handleCodeChange}
                  language={activeTab === "database" ? "sql" : "typescript"}
                  height="calc(100vh - 380px)"
                />
              </Suspense>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between p-2 border-t border-cyan-500/10 bg-muted/30">
              <div className="flex items-center gap-2">
                {validationScore !== null && (
                  <Badge
                    variant={validationScore >= 70 ? "default" : "destructive"}
                    className={validationScore >= 70 ? "bg-accent/20 text-accent" : ""}
                  >
                    Score: {validationScore}/100
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs gap-1">
                  <Zap className="h-3 w-3" />
                  Akasha IA
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={validateCode}
                  disabled={isValidating || lifecycleStage === "generating"}
                  className="h-7 text-xs"
                >
                  {isValidating ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Shield className="h-3 w-3 mr-1" />
                  )}
                  Validar
                </Button>
                <Button
                  size="sm"
                  onClick={createPullRequest}
                  disabled={
                    isCreatingPR ||
                    lifecycleStage === "generating" ||
                    lifecycleStage === "draft" ||
                    lifecycleStage === "validating"
                  }
                  className="h-7 text-xs"
                >
                  {isCreatingPR ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <GitBranch className="h-3 w-3 mr-1" />
                  )}
                  Crear PR
                </Button>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Preview + AI Context */}
        <ResizablePanel defaultSize={showContextPanel ? 40 : 35} minSize={25} className="min-h-0">
          <div className="h-full min-h-0 flex flex-col bg-card/30 overflow-hidden">
            {showContextPanel ? (
              <ResizablePanelGroup direction="vertical" className="min-h-0">
                {/* Live Preview */}
                <ResizablePanel defaultSize={55} minSize={30} className="min-h-0">
                  <div className="h-full min-h-0 flex flex-col">
                    <div className="flex items-center gap-2 p-2 border-b border-cyan-500/10 shrink-0">
                      <Eye className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs font-medium">VISTA PREVIA</span>
                    </div>
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <SandboxPreview code={generatedCode} />
                    </div>
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* AI Context Panel */}
                <ResizablePanel defaultSize={45} minSize={20} className="min-h-0">
                  <Tabs defaultValue="context" className="h-full min-h-0 flex flex-col">
                    <TabsList className="mx-2 mt-2 shrink-0">
                      <TabsTrigger value="context" className="text-xs">Contexto IA</TabsTrigger>
                      <TabsTrigger value="agents" className="text-xs">Multi-Agente</TabsTrigger>
                      <TabsTrigger value="voting" className="text-xs">Gobernanza</TabsTrigger>
                    </TabsList>
                    <TabsContent value="context" className="flex-1 min-h-0 overflow-hidden flex">
                      <div className="flex-1 min-h-0">
                        <AIContextPanel
                          aiResponse={aiResponse}
                          isProcessing={isAIProcessing}
                          code={
                            activeTab === "frontend"
                              ? generatedCode.frontend
                              : activeTab === "backend"
                              ? generatedCode.backend
                              : generatedCode.database
                          }
                          language={activeTab === "database" ? "sql" : "typescript"}
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="agents" className="flex-1 min-h-0 overflow-auto p-2">
                      <MultiAgentPanel 
                        currentCode={generatedCode}
                        onCollaborativeResponse={(resp) => {
                          if (resp.summary) {
                            setAIResponse(resp.summary);
                          }
                        }}
                      />
                    </TabsContent>
                    <TabsContent value="voting" className="flex-1 min-h-0 overflow-auto p-2">
                      <CommunityVoting />
                    </TabsContent>
                  </Tabs>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="h-full min-h-0 flex flex-col">
                <div className="flex items-center gap-2 p-2 border-b border-cyan-500/10 shrink-0">
                  <Eye className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-medium">VISTA PREVIA</span>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <SandboxPreview code={generatedCode} />
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
