import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  Code,
  Database,
  Server,
  Loader2,
  Send,
  Eye,
  FolderTree,
  Plus,
  Sparkles,
  ChevronRight,
  ChevronDown,
  File as FileIcon,
  Folder,
  Undo,
  Redo,
  Copy,
  PanelRightClose,
  PanelRight,
  Zap,
} from "lucide-react";
const MonacoEditor = lazy(() => import("./MonacoEditor").then(m => ({ default: m.MonacoEditor })));
import { SandboxPreview } from "./SandboxPreview";
import { AIActionsToolbar } from "./AIActionsToolbar";
import { AIContextPanel } from "./AIContextPanel";
import { ChatFileUpload, UploadedFile, processFileForUpload } from "./ChatFileUpload";
import { LifecycleProgressBar } from "./ide/LifecycleProgressBar";

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

const DEFAULT_CODE = `function App() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-lg w-full rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">🚀 Akasha App Builder</h1>
          <p className="text-muted-foreground text-sm">Describe tu aplicación en el chat y la construiré para ti</p>
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
}`;

const CODE_KEYWORDS = [
  "genera", "generar", "crea", "crear", "implementa", "implementar",
  "desarrolla", "desarrollar", "construye", "construir", "programa",
  "codifica", "escribe código", "create", "build", "generate", "implement",
];

const EDIT_KEYWORDS = [
  "cambia", "cambiar", "modifica", "modificar", "actualiza", "actualizar",
  "quita", "quitar", "agrega", "agregar", "arregla", "arreglar", "fix",
  "añade", "añadir", "pone", "poner", "saca", "sacar",
];

const UI_TARGETS = [
  "footer", "header", "navbar", "menú", "menu", "botón", "boton",
  "color", "estilo", "css", "layout", "diseño", "responsive", "logo",
];

export function AppBuilderIDE() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode>({
    frontend: DEFAULT_CODE,
    backend: "// El código del backend aparecerá aquí...",
    database: "-- Las migraciones SQL aparecerán aquí...",
  });
  const [activeTab, setActiveTab] = useState<"frontend" | "backend" | "database">("frontend");
  const [lifecycleStage, setLifecycleStage] = useState("draft");
  const [aiResponse, setAIResponse] = useState<string>("");
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([
    {
      id: "1", name: "src", path: "/src", type: "folder",
      children: [
        { id: "2", name: "App.tsx", path: "/src/App.tsx", type: "file", language: "typescript", content: DEFAULT_CODE },
        { id: "3", name: "components", path: "/src/components", type: "folder", children: [] },
      ],
    },
    {
      id: "4", name: "supabase", path: "/supabase", type: "folder",
      children: [
        { id: "5", name: "functions", path: "/supabase/functions", type: "folder", children: [
          { id: "6", name: "index.ts", path: "/supabase/functions/index.ts", type: "file", language: "typescript", content: "" },
        ]},
        { id: "7", name: "migrations", path: "/supabase/migrations", type: "folder", children: [
          { id: "8", name: "001_initial.sql", path: "/supabase/migrations/001_initial.sql", type: "file", language: "sql", content: "" },
        ]},
      ],
    },
  ]);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["1", "4"]));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isCodeGenerationRequest = (message: string): boolean => {
    const m = message.toLowerCase();
    const hasCodeIntent = CODE_KEYWORDS.some((k) => m.includes(k));
    const hasEditIntent = EDIT_KEYWORDS.some((k) => m.includes(k));
    const hasUiTarget = UI_TARGETS.some((k) => m.includes(k));
    return hasCodeIntent || (hasEditIntent && hasUiTarget);
  };

  const updateFileContent = (path: string, content: string) => {
    const updateFiles = (files: ProjectFile[]): ProjectFile[] => {
      return files.map((file) => {
        if (file.path === path) return { ...file, content };
        if (file.children) return { ...file, children: updateFiles(file.children) };
        return file;
      });
    };
    setProjectFiles(updateFiles(projectFiles));
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    let messageContent = input.trim();
    const completedFiles = uploadedFiles.filter(f => f.status === "completed");
    
    if (completedFiles.length > 0) {
      messageContent += "\n\n[Archivos adjuntos:";
      completedFiles.forEach(file => {
        messageContent += `\n- ${file.name} (${file.type})`;
        if (file.content) messageContent += `:\n\`\`\`\n${file.content.slice(0, 5000)}\n\`\`\``;
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
      if (!accessToken) throw new Error("No hay sesión activa");

      const shouldGenerateCode = isCodeGenerationRequest(input.trim());
      setIsAIProcessing(true);

      if (shouldGenerateCode) {
        // === SIMPLIFIED CODE GENERATION: generate → ready ===
        setLifecycleStage("generating");
        setMessages([...newMessages, { role: "assistant", content: "⚡ Generando código..." }]);

        const { data: implData, error: implError } = await supabase.functions.invoke(
          "generate-implementation",
          { body: { title: input.trim().slice(0, 100), description: messageContent } }
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

        // Go directly to "ready" - no validation/approval needed
        setLifecycleStage("ready");
        setMessages([...newMessages, {
          role: "assistant",
          content: `### ✅ Código generado\n\nEl código está listo en el editor y la vista previa se ha actualizado.`,
        }]);

        toast.success("Código generado exitosamente");
      } else {
        // === CHAT CONVERSATION ===
        const chatMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/akasha-ia-chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ messages: chatMessages }),
          }
        );

        if (!response.ok) {
          if (response.status === 401) throw new Error("Sesión expirada. Recarga la página.");
          if (response.status === 429) throw new Error("Límite excedido. Intenta de nuevo.");
          throw new Error("Error al comunicarse con la IA");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No se pudo leer la respuesta");

        const decoder = new TextDecoder();
        let assistantContent = "";
        let buffer = "";

        setMessages((prev) => [...prev, { role: "assistant", content: "..." }]);

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

        let streamDone = false;
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
            if (!trimmed || trimmed.startsWith(":") || !trimmed.startsWith("data: ")) continue;

            const payload = trimmed.slice(6).trim();
            if (payload === "[DONE]") { streamDone = true; break; }

            try {
              const data = JSON.parse(payload);
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                updateStreamingMessage(assistantContent);
              }
            } catch {
              console.warn("[AppBuilder] Skipping unparseable SSE chunk");
            }
          }
        }

        if (assistantContent) {
          updateStreamingMessage(assistantContent);
          setAIResponse(assistantContent);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Error al procesar mensaje");
      setLifecycleStage("draft");
    } finally {
      setIsLoading(false);
      setIsAIProcessing(false);
    }
  };

  const handleCodeChange = (newCode: string) => {
    setGeneratedCode((prev) => ({ ...prev, [activeTab]: newCode }));
    const pathMap: Record<string, string> = {
      frontend: "/src/App.tsx",
      backend: "/supabase/functions/index.ts",
      database: "/supabase/migrations/001_initial.sql",
    };
    updateFileContent(pathMap[activeTab], newCode);
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

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
              if (file.path.includes("/src/")) setActiveTab("frontend");
              else if (file.path.includes("/functions/")) setActiveTab("backend");
              else if (file.path.includes("/migrations/")) setActiveTab("database");
            }
          }}
        >
          {file.type === "folder" ? (
            <>
              {expandedFolders.has(file.id) ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
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

  return (
    <div className="h-[calc(100vh-200px)] min-h-[600px] flex flex-col">
      {/* Simplified 3-stage Progress Bar */}
      <LifecycleProgressBar currentStage={lifecycleStage} />

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
                      {msg.files && msg.files.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {msg.files.map((file) => (
                            <Badge key={file.id} variant="outline" className="text-[10px] gap-1 h-5">
                              {file.name.slice(0, 15)}{file.name.length > 15 ? "..." : ""}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5 prose-pre:my-2 prose-code:text-cyan-400">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : msg.content}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Procesando...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              <div className="p-2 border-t border-cyan-500/10">
                <div className="flex gap-1 items-center">
                  <ChatFileUpload files={uploadedFiles} onFilesChange={setUploadedFiles} disabled={isLoading} />
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe tu aplicación..."
                    className="text-xs h-8 flex-1"
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    disabled={isLoading}
                    onPaste={async (e) => {
                      const clipboardItems = e.clipboardData?.items;
                      if (!clipboardItems) return;
                      for (let i = 0; i < clipboardItems.length; i++) {
                        const item = clipboardItems[i];
                        if (item.type.startsWith("image/")) {
                          e.preventDefault();
                          const file = item.getAsFile();
                          if (file) {
                            const ext = item.type.split("/")[1] || "png";
                            const namedFile = new File([file], `pasted-image-${Date.now()}.${ext}`, { type: file.type });
                            toast.info("Procesando imagen...");
                            await processFileForUpload(namedFile, uploadedFiles, setUploadedFiles);
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
            <div className="flex items-center justify-between border-b border-cyan-500/10 px-2 bg-card/50 relative z-10">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1">
                <TabsList className="h-9 bg-transparent gap-0.5 border-none">
                  <TabsTrigger value="frontend" className="text-xs h-7 data-[state=active]:bg-cyan-500/20 border-none">
                    <Code className="h-3 w-3 mr-1" /> Frontend
                  </TabsTrigger>
                  <TabsTrigger value="backend" className="text-xs h-7 data-[state=active]:bg-cyan-500/20 border-none">
                    <Server className="h-3 w-3 mr-1" /> Backend
                  </TabsTrigger>
                  <TabsTrigger value="database" className="text-xs h-7 data-[state=active]:bg-cyan-500/20 border-none">
                    <Database className="h-3 w-3 mr-1" /> Database
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-1">
                <AIActionsToolbar
                  code={activeTab === "frontend" ? generatedCode.frontend : activeTab === "backend" ? generatedCode.backend : generatedCode.database}
                  language={activeTab === "database" ? "sql" : "typescript"}
                  onCodeUpdate={handleCodeChange}
                  onAIResponse={(response) => { setAIResponse(response); setShowContextPanel(true); }}
                />
                <div className="w-px h-4 bg-cyan-500/20 mx-1" />
                <Button size="icon" variant="ghost" className="h-6 w-6" title="Deshacer"><Undo className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" title="Rehacer"><Redo className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" title="Copiar"><Copy className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" title={showContextPanel ? "Ocultar Panel IA" : "Mostrar Panel IA"} onClick={() => setShowContextPanel(!showContextPanel)}>
                  {showContextPanel ? <PanelRightClose className="h-3 w-3" /> : <PanelRight className="h-3 w-3" />}
                </Button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                <MonacoEditor
                  value={activeTab === "frontend" ? generatedCode.frontend : activeTab === "backend" ? generatedCode.backend : generatedCode.database}
                  onChange={handleCodeChange}
                  language={activeTab === "database" ? "sql" : "typescript"}
                  height="calc(100vh - 380px)"
                />
              </Suspense>
            </div>

            {/* Simplified status bar */}
            <div className="flex items-center justify-between p-2 border-t border-cyan-500/10 bg-muted/30">
              <Badge variant="outline" className="text-xs gap-1">
                <Zap className="h-3 w-3" />
                Akasha IA
              </Badge>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Preview + AI Context */}
        <ResizablePanel defaultSize={showContextPanel ? 40 : 35} minSize={25} className="min-h-0">
          <div className="h-full min-h-0 flex flex-col bg-card/30 overflow-hidden">
            {showContextPanel ? (
              <ResizablePanelGroup direction="vertical" className="min-h-0">
                <ResizablePanel defaultSize={70} minSize={40} className="min-h-0">
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
                <ResizablePanel defaultSize={30} minSize={15} className="min-h-0">
                  <AIContextPanel
                    aiResponse={aiResponse}
                    isProcessing={isAIProcessing}
                    code={activeTab === "frontend" ? generatedCode.frontend : activeTab === "backend" ? generatedCode.backend : generatedCode.database}
                    language={activeTab === "database" ? "sql" : "typescript"}
                  />
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
