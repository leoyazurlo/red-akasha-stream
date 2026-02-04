import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Copy, 
  Check, 
  FileCode,
  Database,
  Server,
  Wand2,
  ExternalLink,
  Sparkles
} from "lucide-react";

interface LovableInstructionsGeneratorProps {
  proposalId: string;
  title: string;
  description: string;
  frontendCode: string;
  backendCode: string;
  databaseCode: string;
}

export function LovableInstructionsGenerator({
  title,
  description,
  frontendCode,
  backendCode,
  databaseCode,
}: LovableInstructionsGeneratorProps) {
  const [copied, setCopied] = useState(false);

  const generateLovablePrompt = () => {
    const sections: string[] = [];
    
    sections.push(`# Implementación: ${title}\n`);
    sections.push(`## Descripción\n${description}\n`);

    if (databaseCode && databaseCode !== "-- No se generó código de base de datos") {
      sections.push(`## 1. Cambios en Base de Datos\nEjecuta la siguiente migración SQL:\n\n\`\`\`sql\n${databaseCode}\n\`\`\`\n`);
    }

    if (backendCode && backendCode !== "// No se generó código backend") {
      sections.push(`## 2. Edge Function\nCrea o actualiza la siguiente edge function:\n\n\`\`\`typescript\n${backendCode}\n\`\`\`\n`);
    }

    if (frontendCode && frontendCode !== "// No se generó código frontend") {
      sections.push(`## 3. Componentes Frontend\nImplementa los siguientes componentes React:\n\n\`\`\`tsx\n${frontendCode}\n\`\`\`\n`);
    }

    sections.push(`\n---\n*Generado por Akasha IA para Red Akasha*`);

    return sections.join("\n");
  };

  const copyToClipboard = async () => {
    const instructions = generateLovablePrompt();
    await navigator.clipboard.writeText(instructions);
    setCopied(true);
    toast.success("Instrucciones copiadas - Pégalas en Lovable para implementar");
    setTimeout(() => setCopied(false), 3000);
  };

  const hasCode = (frontendCode && frontendCode !== "// No se generó código frontend") ||
                  (backendCode && backendCode !== "// No se generó código backend") ||
                  (databaseCode && databaseCode !== "-- No se generó código de base de datos");

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
          <Badge className="bg-green-500/20 text-green-400">
            Listo para implementar
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className={`p-3 rounded-lg ${databaseCode && databaseCode !== "-- No se generó código de base de datos" ? "bg-purple-500/10" : "bg-muted/30"}`}>
            <Database className={`h-5 w-5 mx-auto mb-1 ${databaseCode && databaseCode !== "-- No se generó código de base de datos" ? "text-purple-400" : "text-muted-foreground"}`} />
            <span className="text-xs">{databaseCode && databaseCode !== "-- No se generó código de base de datos" ? "SQL ✓" : "Sin SQL"}</span>
          </div>
          <div className={`p-3 rounded-lg ${backendCode && backendCode !== "// No se generó código backend" ? "bg-blue-500/10" : "bg-muted/30"}`}>
            <Server className={`h-5 w-5 mx-auto mb-1 ${backendCode && backendCode !== "// No se generó código backend" ? "text-blue-400" : "text-muted-foreground"}`} />
            <span className="text-xs">{backendCode && backendCode !== "// No se generó código backend" ? "Backend ✓" : "Sin Backend"}</span>
          </div>
          <div className={`p-3 rounded-lg ${frontendCode && frontendCode !== "// No se generó código frontend" ? "bg-cyan-500/10" : "bg-muted/30"}`}>
            <FileCode className={`h-5 w-5 mx-auto mb-1 ${frontendCode && frontendCode !== "// No se generó código frontend" ? "text-cyan-400" : "text-muted-foreground"}`} />
            <span className="text-xs">{frontendCode && frontendCode !== "// No se generó código frontend" ? "Frontend ✓" : "Sin Frontend"}</span>
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-sm">Pasos para implementar:</h4>
          <ol className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="bg-cyan-500/20 text-cyan-400 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">1</span>
              <span>Haz clic en "Copiar Instrucciones" abajo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-cyan-500/20 text-cyan-400 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">2</span>
              <span>Ve al chat de Lovable y pega las instrucciones</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-cyan-500/20 text-cyan-400 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0">3</span>
              <span>Lovable implementará los cambios automáticamente</span>
            </li>
          </ol>
        </div>

        <ScrollArea className="h-[150px] rounded-md border border-muted bg-muted/20">
          <pre className="p-3 text-xs font-mono whitespace-pre-wrap text-muted-foreground">
            {generateLovablePrompt().slice(0, 500)}...
          </pre>
        </ScrollArea>

        <div className="flex gap-2">
          <Button 
            className="flex-1 bg-green-600 hover:bg-green-700" 
            onClick={copyToClipboard}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                ¡Copiado!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copiar Instrucciones para Lovable
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.open("https://lovable.dev", "_blank")}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Al pegar en Lovable, la IA implementará los cambios directamente en el código
        </p>
      </CardContent>
    </Card>
  );
}
