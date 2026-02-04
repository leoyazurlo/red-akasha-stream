import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Code, 
  FileCode, 
  Database, 
  Loader2, 
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Wand2
} from "lucide-react";

interface ProposalCodePreviewProps {
  proposalId: string;
  title: string;
  description: string;
  proposedCode: string | null;
  onCodeUpdate: () => void;
}

export function ProposalCodePreview({
  proposalId,
  title,
  description,
  proposedCode,
  onCodeUpdate,
}: ProposalCodePreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<{
    frontend: string;
    backend: string;
    database: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");

  const generateCode = async (additionalContext?: string) => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/akasha-ia-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Genera código de implementación para la siguiente propuesta de funcionalidad:

**Título:** ${title}

**Descripción:** ${description}

${additionalContext ? `**Contexto adicional:** ${additionalContext}` : ""}

Por favor, proporciona código específico y listo para usar en las siguientes secciones:

## FRONTEND (React/TypeScript)
[Código de componentes React]

## BACKEND (Supabase Edge Function)
[Código de Edge Function si es necesario]

## DATABASE (SQL Migrations)
[SQL para crear/modificar tablas si es necesario]

Asegúrate de que el código siga los patrones existentes de Red Akasha y use los tokens de diseño definidos.`,
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Error al generar código");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ") && !line.includes("[DONE]")) {
              try {
                const json = JSON.parse(line.slice(6));
                const content = json.choices?.[0]?.delta?.content;
                if (content) fullContent += content;
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      }

      // Parse the sections from the response
      const frontendMatch = fullContent.match(/## FRONTEND.*?\n([\s\S]*?)(?=## BACKEND|## DATABASE|$)/i);
      const backendMatch = fullContent.match(/## BACKEND.*?\n([\s\S]*?)(?=## DATABASE|$)/i);
      const databaseMatch = fullContent.match(/## DATABASE.*?\n([\s\S]*?)$/i);

      const parsed = {
        frontend: frontendMatch?.[1]?.trim() || "// No se generó código frontend",
        backend: backendMatch?.[1]?.trim() || "// No se generó código backend",
        database: databaseMatch?.[1]?.trim() || "-- No se generó código de base de datos",
      };

      setGeneratedCode(parsed);

      // Save the full generated code to the proposal
      const fullCode = `// FRONTEND\n${parsed.frontend}\n\n// BACKEND\n${parsed.backend}\n\n-- DATABASE\n${parsed.database}`;
      
      await supabase
        .from("ia_feature_proposals")
        .update({ proposed_code: fullCode })
        .eq("id", proposalId);

      toast.success("Código generado exitosamente");
      onCodeUpdate();
    } catch (error) {
      console.error("Error generating code:", error);
      toast.error("Error al generar código");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, section: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(section);
    setTimeout(() => setCopied(null), 2000);
  };

  const parseExistingCode = () => {
    if (!proposedCode) return null;
    
    const frontendMatch = proposedCode.match(/\/\/ FRONTEND\n([\s\S]*?)(?=\/\/ BACKEND|-- DATABASE|$)/);
    const backendMatch = proposedCode.match(/\/\/ BACKEND\n([\s\S]*?)(?=-- DATABASE|$)/);
    const databaseMatch = proposedCode.match(/-- DATABASE\n([\s\S]*?)$/);

    return {
      frontend: frontendMatch?.[1]?.trim() || proposedCode,
      backend: backendMatch?.[1]?.trim() || "",
      database: databaseMatch?.[1]?.trim() || "",
    };
  };

  const displayCode = generatedCode || parseExistingCode();

  return (
    <Card className="bg-card/50 border-cyan-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Code className="h-5 w-5 text-cyan-400" />
            Preview de Código
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateCode(customPrompt)}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : proposedCode ? (
                <RefreshCw className="h-4 w-4 mr-2" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              {proposedCode ? "Regenerar" : "Generar Código"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!displayCode && !isGenerating && (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay código generado aún.</p>
            <p className="text-sm">Haz clic en "Generar Código" para que la IA cree una implementación.</p>
          </div>
        )}

        {isGenerating && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-cyan-400" />
            <p className="text-muted-foreground">Generando código de implementación...</p>
          </div>
        )}

        {displayCode && !isGenerating && (
          <>
            <div className="space-y-2">
              <Label>Contexto adicional (opcional)</Label>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Añade detalles específicos para la regeneración del código..."
                className="h-20"
              />
            </div>

            <Tabs defaultValue="frontend" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="frontend" className="gap-2">
                  <FileCode className="h-4 w-4" />
                  Frontend
                </TabsTrigger>
                <TabsTrigger value="backend" className="gap-2">
                  <Code className="h-4 w-4" />
                  Backend
                </TabsTrigger>
                <TabsTrigger value="database" className="gap-2">
                  <Database className="h-4 w-4" />
                  Database
                </TabsTrigger>
              </TabsList>

              {(["frontend", "backend", "database"] as const).map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-4">
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 z-10"
                      onClick={() => copyToClipboard(displayCode[tab], tab)}
                    >
                      {copied === tab ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <ScrollArea className="h-[300px] rounded-md border border-cyan-500/20 bg-muted/30">
                      <pre className="p-4 text-xs font-mono whitespace-pre-wrap">
                        {displayCode[tab] || "// Sin código en esta sección"}
                      </pre>
                    </ScrollArea>
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            <div className="flex items-center gap-2 pt-2">
              <Badge variant="outline" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Generado por IA
              </Badge>
              <span className="text-xs text-muted-foreground">
                Este código es una sugerencia y debe ser revisado antes de implementarse.
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
