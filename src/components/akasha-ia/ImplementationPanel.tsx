import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ExternalLink,
  Wand2,
  FileCode,
  Eye,
  ArrowRight,
  Rocket,
} from "lucide-react";

interface GeneratedCode {
  frontend: string;
  backend: string;
  database: string;
  rawResponse?: string;
  generatedAt?: string;
}

interface ImplementationPanelProps {
  proposalId: string;
  title: string;
  description: string;
  existingCode?: GeneratedCode | null;
  onCodeGenerated?: (code: GeneratedCode) => void;
}

// Workflow steps component
function WorkflowSteps({ currentStep }: { currentStep: number }) {
  const steps = [
    { icon: Code, label: "Generar", desc: "IA crea código" },
    { icon: GitBranch, label: "PR", desc: "Push a GitHub" },
    { icon: Eye, label: "Preview", desc: "Revisar cambios" },
    { icon: Rocket, label: "Publicar", desc: "Merge y deploy" },
  ];

  return (
    <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/30 border border-cyan-500/10">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div className={`flex flex-col items-center ${index <= currentStep ? 'text-cyan-400' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              index < currentStep ? 'bg-cyan-500 border-cyan-500' : 
              index === currentStep ? 'border-cyan-500 bg-cyan-500/20' : 
              'border-muted-foreground/30'
            }`}>
              {index < currentStep ? (
                <CheckCircle className="h-4 w-4 text-white" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
            </div>
            <span className="text-xs mt-1 font-medium">{step.label}</span>
            <span className="text-[10px] text-muted-foreground">{step.desc}</span>
          </div>
          {index < steps.length - 1 && (
            <ArrowRight className={`h-4 w-4 mx-2 ${index < currentStep ? 'text-cyan-500' : 'text-muted-foreground/30'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function ImplementationPanel({
  proposalId,
  title,
  description,
  existingCode,
  onCodeGenerated,
}: ImplementationPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(existingCode || null);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate current workflow step
  const getCurrentStep = () => {
    if (prUrl) return 2; // PR created, ready to preview
    if (generatedCode) return 1; // Code generated
    return 0; // Initial state
  };

  const generateImplementation = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-implementation", {
        body: {
          proposalId,
          title,
          description,
        },
      });

      if (fnError) throw fnError;

      const code: GeneratedCode = {
        frontend: data.frontend || "// No se generó código frontend",
        backend: data.backend || "// No se generó código backend",
        database: data.database || "-- No se generó código de base de datos",
      };

      setGeneratedCode(code);
      onCodeGenerated?.(code);
      toast.success("Código generado exitosamente");
    } catch (err) {
      console.error("Error generating implementation:", err);
      setError("Error al generar la implementación");
      toast.error("Error al generar código");
    } finally {
      setIsGenerating(false);
    }
  };

  const createPullRequest = async () => {
    if (!generatedCode) {
      toast.error("Primero genera el código");
      return;
    }

    setIsCreatingPR(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("github-create-pr", {
        body: {
          proposalId,
          title: `[Akasha IA] ${title}`,
          description,
          frontend: generatedCode.frontend,
          backend: generatedCode.backend,
          database: generatedCode.database,
        },
      });

      if (fnError) throw fnError;

      if (data.error) {
        throw new Error(data.error);
      }

      setPrUrl(data.pullRequestUrl);
      toast.success("Pull Request creado exitosamente");

      // Update proposal status
      await supabase
        .from("ia_feature_proposals")
        .update({ 
          status: "implementing",
          review_notes: `PR creado: ${data.pullRequestUrl}`,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", proposalId);

    } catch (err) {
      console.error("Error creating PR:", err);
      const message = err instanceof Error ? err.message : "Error al crear el PR";
      setError(message);
      
      if (message.includes("GitHub no está configurado")) {
        toast.error("Configura GitHub en Ajustes de Plataforma primero");
      } else {
        toast.error(message);
      }
    } finally {
      setIsCreatingPR(false);
    }
  };

  const hasCode = generatedCode && (
    generatedCode.frontend !== "// No se generó código frontend" ||
    generatedCode.backend !== "// No se generó código backend" ||
    generatedCode.database !== "-- No se generó código de base de datos"
  );

  return (
    <Card className="bg-card/50 border-cyan-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wand2 className="h-5 w-5 text-cyan-400" />
          Panel de Implementación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Workflow Steps Indicator */}
        <WorkflowSteps currentStep={getCurrentStep()} />
        
        {/* Botones de acción */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={generateImplementation}
            disabled={isGenerating}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Code className="h-4 w-4 mr-2" />
                1. Generar Código
              </>
            )}
          </Button>

          {hasCode && (
            <Button
              onClick={createPullRequest}
              disabled={isCreatingPR}
              variant="outline"
              className="border-green-500/30 text-green-400 hover:bg-green-500/10"
            >
              {isCreatingPR ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando PR...
                </>
              ) : (
                <>
                  <GitBranch className="h-4 w-4 mr-2" />
                  2. Crear Pull Request
                </>
              )}
            </Button>
          )}
        </div>

        {/* Estado del PR con instrucciones de preview */}
        {prUrl && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-sm text-green-400">PR Creado:</span>
              <a
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-cyan-400 hover:underline flex items-center gap-1"
              >
                Ver en GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            
            {/* Preview instructions */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-400">
                    3. Revisar en Preview
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Los cambios del PR se sincronizarán automáticamente con Lovable. 
                    Revisa el preview antes de mergear:
                  </p>
                  <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
                    <li>Espera a que Lovable sincronice los cambios (~1-2 min)</li>
                    <li>Revisa el preview en vivo para verificar los cambios</li>
                    <li>Si todo está bien, mergea el PR en GitHub</li>
                    <li>Publica la app desde Lovable cuando estés listo</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <XCircle className="h-5 w-5 text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

        {/* Código generado */}
        {generatedCode && (
          <Tabs defaultValue="frontend" className="w-full">
            <TabsList className="bg-muted/50 w-full justify-start">
              <TabsTrigger value="frontend" className="gap-1.5">
                <FileCode className="h-3.5 w-3.5" />
                Frontend
              </TabsTrigger>
              <TabsTrigger value="backend" className="gap-1.5">
                <Server className="h-3.5 w-3.5" />
                Backend
              </TabsTrigger>
              <TabsTrigger value="database" className="gap-1.5">
                <Database className="h-3.5 w-3.5" />
                Database
              </TabsTrigger>
            </TabsList>

            <TabsContent value="frontend">
              <ScrollArea className="h-[300px] rounded-md border border-cyan-500/20 bg-black/50">
                <pre className="p-4 text-sm text-green-400 font-mono whitespace-pre-wrap">
                  {generatedCode.frontend}
                </pre>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="backend">
              <ScrollArea className="h-[300px] rounded-md border border-cyan-500/20 bg-black/50">
                <pre className="p-4 text-sm text-blue-400 font-mono whitespace-pre-wrap">
                  {generatedCode.backend}
                </pre>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="database">
              <ScrollArea className="h-[300px] rounded-md border border-cyan-500/20 bg-black/50">
                <pre className="p-4 text-sm text-yellow-400 font-mono whitespace-pre-wrap">
                  {generatedCode.database}
                </pre>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        {!generatedCode && !isGenerating && (
          <div className="text-center py-8 text-muted-foreground">
            <Code className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              Haz clic en "Generar Código" para que la IA cree la implementación
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
