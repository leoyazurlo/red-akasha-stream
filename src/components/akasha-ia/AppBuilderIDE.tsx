import { useState, useEffect, useRef } from "react";
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
  File,
  Folder,
  Brain,
  Wand2,
  Zap,
  PanelRightClose,
  PanelRight,
} from "lucide-react";
import { MonacoEditor } from "./MonacoEditor";
import { SandboxPreview } from "./SandboxPreview";
import { AIActionsToolbar } from "./AIActionsToolbar";
import { AIContextPanel } from "./AIContextPanel";
import { ChatFileUpload, UploadedFile } from "./ChatFileUpload";

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
    frontend: "// Describe tu aplicación para generar código...",
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

  // Send message to AI
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
    setUploadedFiles([]); // Clear files after sending
    setIsLoading(true);
    setLifecycleStage("generating");

    let assistantContent = "";

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error("No hay sesión activa");
      }

      // Generate implementation with file context
      const { data: implData, error: implError } = await supabase.functions.invoke(
        "generate-implementation",
        {
          body: {
            title: input.trim().slice(0, 100),
            description: messageContent, // Include file context
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

      assistantContent = `He generado el código para tu aplicación:\n\n**Frontend:** Componente React con TypeScript\n**Backend:** Edge Function para la lógica del servidor\n**Database:** Migración SQL con políticas RLS\n\n¿Quieres que valide el código o realice algún cambio?`;

      setMessages([...newMessages, { role: "assistant", content: assistantContent }]);
      setLifecycleStage("draft");

      // Create proposal record
      const { data: { user } } = await supabase.auth.getUser();
      const { data: proposal } = await supabase
        .from("ia_feature_proposals")
        .insert([{
          title: input.trim().slice(0, 100),
          description: input.trim(),
          proposed_code: JSON.stringify(newCode),
          requested_by: user?.id,
          lifecycle_stage: "generating" as const,
          status: "pending",
        }])
        .select()
        .single();

      if (proposal) {
        setProposalId(proposal.id);
      }

      toast.success("Código generado exitosamente");
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error al generar código");
      setLifecycleStage("draft");
    } finally {
      setIsLoading(false);
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
              <File className="h-4 w-4 text-muted-foreground" />
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
      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border border-cyan-500/20">
        {/* Left: File Explorer + Chat */}
        <ResizablePanel defaultSize={25} minSize={15} maxSize={35}>
          <div className="h-full flex flex-col bg-card/50">
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
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 p-2 border-b border-cyan-500/10">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-medium">AKASHA IA</span>
              </div>
              <ScrollArea className="flex-1 p-2">
                <div className="space-y-3">
                  {messages.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Describe qué quieres crear...
                    </p>
                  )}
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`text-xs p-2 rounded-lg ${
                        msg.role === "user"
                          ? "bg-cyan-500/20 text-foreground ml-4"
                          : "bg-muted/50 text-muted-foreground mr-4"
                      }`}
                    >
                      {msg.content}
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
              </ScrollArea>
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
                    placeholder={uploadedFiles.length > 0 ? "Describe qué hacer con los archivos..." : "Describe tu aplicación..."}
                    className="text-xs h-8 flex-1"
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    disabled={isLoading}
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
        <ResizablePanel defaultSize={showContextPanel ? 35 : 45} minSize={25}>
          <div className="h-full flex flex-col bg-card/30">
            {/* Editor Tabs */}
            <div className="flex items-center justify-between border-b border-cyan-500/10 px-2">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1">
                <TabsList className="h-9 bg-transparent gap-0.5">
                  <TabsTrigger
                    value="frontend"
                    className="text-xs h-7 data-[state=active]:bg-cyan-500/20 rounded-b-none"
                  >
                    <Code className="h-3 w-3 mr-1" />
                    Frontend
                  </TabsTrigger>
                  <TabsTrigger
                    value="backend"
                    className="text-xs h-7 data-[state=active]:bg-cyan-500/20 rounded-b-none"
                  >
                    <Server className="h-3 w-3 mr-1" />
                    Backend
                  </TabsTrigger>
                  <TabsTrigger
                    value="database"
                    className="text-xs h-7 data-[state=active]:bg-cyan-500/20 rounded-b-none"
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
            <div className="flex-1">
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
                height="100%"
              />
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
        <ResizablePanel defaultSize={showContextPanel ? 40 : 35} minSize={25}>
          <div className="h-full flex flex-col bg-card/30">
            {showContextPanel ? (
              <ResizablePanelGroup direction="vertical">
                {/* Live Preview */}
                <ResizablePanel defaultSize={55} minSize={30}>
                  <div className="h-full flex flex-col">
                    <div className="flex items-center gap-2 p-2 border-b border-cyan-500/10">
                      <Eye className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs font-medium">VISTA PREVIA</span>
                    </div>
                    <div className="flex-1">
                      <SandboxPreview code={generatedCode} />
                    </div>
                  </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* AI Context Panel */}
                <ResizablePanel defaultSize={45} minSize={20}>
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
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-2 p-2 border-b border-cyan-500/10">
                  <Eye className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs font-medium">VISTA PREVIA</span>
                </div>
                <div className="flex-1">
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
