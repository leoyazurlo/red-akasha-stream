import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Copy, 
  Check, 
  FileCode,
  Database,
  Server,
  Wand2,
  ExternalLink,
  Sparkles,
  Download,
  AlertTriangle,
  GitBranch,
  Loader2
} from "lucide-react";

interface LovableInstructionsGeneratorProps {
  proposalId: string;
  title: string;
  description: string;
  frontendCode: string;
  backendCode: string;
  databaseCode: string;
  provider?: string;
  model?: string;
}

export function LovableInstructionsGenerator({
  proposalId,
  title,
  description,
  frontendCode,
  backendCode,
  databaseCode,
  provider = "lovable",
  model = "default",
}: LovableInstructionsGeneratorProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("full");
  const [creatingPR, setCreatingPR] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  const hasDatabase = databaseCode && databaseCode !== "-- No se generó código de base de datos";
  const hasBackend = backendCode && backendCode !== "// No se generó código backend";
  const hasFrontend = frontendCode && frontendCode !== "// No se generó código frontend";
  const hasCode = hasDatabase || hasBackend || hasFrontend;

  const createGitHubPR = async () => {
    setCreatingPR(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/github-create-pr`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            proposalId,
            title,
            description,
            frontendCode: hasFrontend ? frontendCode : "",
            backendCode: hasBackend ? backendCode : "",
            databaseCode: hasDatabase ? databaseCode : "",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear PR");
      }

      setPrUrl(data.prUrl);
      toast.success("Pull Request creado exitosamente");
    } catch (error) {
      console.error("Error creating PR:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear PR");
    } finally {
      setCreatingPR(false);
    }
  };

  const generateFullPrompt = () => {
    const sections: string[] = [];
    
    sections.push(`# Implementación: ${title}\n`);
    sections.push(`## Descripción\n${description}\n`);
    sections.push(`*Generado por: ${provider} (${model})*\n`);

    if (hasDatabase) {
      sections.push(`## 1. Base de Datos (Migración SQL)\nEjecuta esta migración usando la herramienta de migraciones:\n\n\`\`\`sql\n${databaseCode}\n\`\`\`\n`);
    }

    if (hasBackend) {
      sections.push(`## 2. Edge Function\nCrea o actualiza esta edge function:\n\n\`\`\`typescript\n${backendCode}\n\`\`\`\n`);
    }

    if (hasFrontend) {
      sections.push(`## 3. Componentes Frontend\nImplementa estos componentes React:\n\n\`\`\`tsx\n${frontendCode}\n\`\`\`\n`);
    }

    sections.push(`\n---\n*Implementa estos cambios en orden: primero base de datos, luego backend, finalmente frontend.*`);

    return sections.join("\n");
  };

  const generateStepPrompt = (step: "database" | "backend" | "frontend") => {
    const prompts = {
      database: `# Migración SQL para: ${title}

Ejecuta esta migración en la base de datos:

\`\`\`sql
${databaseCode}
\`\`\`

**Importante:** Asegúrate de que las políticas RLS estén correctas antes de continuar.`,
      
      backend: `# Edge Function para: ${title}

Crea o actualiza esta edge function:

\`\`\`typescript
${backendCode}
\`\`\`

**Importante:** No olvides actualizar config.toml si es una función nueva.`,
      
      frontend: `# Componentes React para: ${title}

Implementa estos componentes:

\`\`\`tsx
${frontendCode}
\`\`\`

**Importante:** Asegúrate de importar los componentes donde sean necesarios.`,
    };

    return prompts[step];
  };

  const copyToClipboard = async (content: string, type: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(type);
    toast.success(`${type === "full" ? "Instrucciones completas" : type.charAt(0).toUpperCase() + type.slice(1)} copiado`);
    setTimeout(() => setCopied(null), 3000);
  };

  const downloadAsMarkdown = () => {
    const content = generateFullPrompt();
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-implementation.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Archivo descargado");
  };

  if (!hasCode) {
    return (
      <Card className="bg-card/50 border-yellow-500/20">
        <CardContent className="pt-6 text-center">
          <Wand2 className="h-10 w-10 mx-auto mb-3 text-yellow-400/50" />
          <p className="text-muted-foreground text-sm">
            Primero genera el código usando el botón "Generar Código" en la pestaña de Preview.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-green-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-green-400" />
            Aplicar en Lovable
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500/20 text-green-400">
              Listo para implementar
            </Badge>
            <Badge variant="outline" className="text-xs">
              {provider}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status indicators */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className={`p-3 rounded-lg ${hasDatabase ? "bg-purple-500/10 border border-purple-500/30" : "bg-muted/30"}`}>
            <Database className={`h-5 w-5 mx-auto mb-1 ${hasDatabase ? "text-purple-400" : "text-muted-foreground"}`} />
            <span className="text-xs">{hasDatabase ? "SQL ✓" : "Sin SQL"}</span>
          </div>
          <div className={`p-3 rounded-lg ${hasBackend ? "bg-blue-500/10 border border-blue-500/30" : "bg-muted/30"}`}>
            <Server className={`h-5 w-5 mx-auto mb-1 ${hasBackend ? "text-blue-400" : "text-muted-foreground"}`} />
            <span className="text-xs">{hasBackend ? "Backend ✓" : "Sin Backend"}</span>
          </div>
          <div className={`p-3 rounded-lg ${hasFrontend ? "bg-cyan-500/10 border border-cyan-500/30" : "bg-muted/30"}`}>
            <FileCode className={`h-5 w-5 mx-auto mb-1 ${hasFrontend ? "text-cyan-400" : "text-muted-foreground"}`} />
            <span className="text-xs">{hasFrontend ? "Frontend ✓" : "Sin Frontend"}</span>
          </div>
        </div>

        {/* Copy options */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="full" className="flex-1">Completo</TabsTrigger>
            {hasDatabase && <TabsTrigger value="database">SQL</TabsTrigger>}
            {hasBackend && <TabsTrigger value="backend">Backend</TabsTrigger>}
            {hasFrontend && <TabsTrigger value="frontend">Frontend</TabsTrigger>}
          </TabsList>

          <TabsContent value="full" className="space-y-3">
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                Pasos para implementar:
              </h4>
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="bg-cyan-500/20 text-cyan-400 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span>Copia las instrucciones completas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-cyan-500/20 text-cyan-400 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span>Pégalas en el chat de Lovable</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-cyan-500/20 text-cyan-400 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span>Lovable ejecutará los cambios automáticamente</span>
                </li>
              </ol>
            </div>

            <ScrollArea className="h-[150px] rounded-md border border-muted bg-muted/20">
              <pre className="p-3 text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                {generateFullPrompt().slice(0, 800)}...
              </pre>
            </ScrollArea>

            <div className="flex gap-2">
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700" 
                onClick={() => copyToClipboard(generateFullPrompt(), "full")}
              >
                {copied === "full" ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar para Lovable
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={downloadAsMarkdown}
                title="Descargar como Markdown"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.open("https://lovable.dev", "_blank")}
                title="Abrir Lovable"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            {/* GitHub PR Section */}
            <div className="border-t border-border pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <GitBranch className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Integración GitHub (Auto-sync)</span>
              </div>
              
              {prUrl ? (
                <div className="bg-primary/10 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">PR creado exitosamente</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => window.open(prUrl, "_blank")}>
                    Ver en GitHub
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Crea un Pull Request automáticamente. Al hacer merge, Lovable sincroniza los cambios.
                  </p>
                  <Button 
                    className="w-full"
                    variant="outline"
                    onClick={createGitHubPR}
                    disabled={creatingPR}
                  >
                    {creatingPR ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creando PR...
                      </>
                    ) : (
                      <>
                        <GitBranch className="h-4 w-4 mr-2" />
                        Crear Pull Request en GitHub
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {hasDatabase && (
            <TabsContent value="database" className="space-y-3">
              <ScrollArea className="h-[200px] rounded-md border border-purple-500/30 bg-purple-500/5">
                <pre className="p-3 text-xs font-mono whitespace-pre-wrap text-purple-300">
                  {databaseCode}
                </pre>
              </ScrollArea>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700" 
                onClick={() => copyToClipboard(generateStepPrompt("database"), "database")}
              >
                {copied === "database" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                Copiar SQL para Lovable
              </Button>
            </TabsContent>
          )}

          {hasBackend && (
            <TabsContent value="backend" className="space-y-3">
              <ScrollArea className="h-[200px] rounded-md border border-blue-500/30 bg-blue-500/5">
                <pre className="p-3 text-xs font-mono whitespace-pre-wrap text-blue-300">
                  {backendCode}
                </pre>
              </ScrollArea>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                onClick={() => copyToClipboard(generateStepPrompt("backend"), "backend")}
              >
                {copied === "backend" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                Copiar Edge Function para Lovable
              </Button>
            </TabsContent>
          )}

          {hasFrontend && (
            <TabsContent value="frontend" className="space-y-3">
              <ScrollArea className="h-[200px] rounded-md border border-cyan-500/30 bg-cyan-500/5">
                <pre className="p-3 text-xs font-mono whitespace-pre-wrap text-cyan-300">
                  {frontendCode}
                </pre>
              </ScrollArea>
              <Button 
                className="w-full bg-cyan-600 hover:bg-cyan-700" 
                onClick={() => copyToClipboard(generateStepPrompt("frontend"), "frontend")}
              >
                {copied === "frontend" ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                Copiar Frontend para Lovable
              </Button>
            </TabsContent>
          )}
        </Tabs>

        <p className="text-xs text-muted-foreground text-center">
          Al pegar en Lovable, la IA implementará los cambios directamente en el código
        </p>
      </CardContent>
    </Card>
  );
}
