/**
 * @fileoverview Panel contextual de IA con respuestas y sugerencias.
 */
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AIContextPanelProps {
  aiResponse: string;
  isProcessing: boolean;
  code: string;
  language: string;
}

export function AIContextPanel({ aiResponse, isProcessing, code, language }: AIContextPanelProps) {
  return (
    <div className="h-full flex flex-col bg-background/50">
      <div className="p-2 border-b border-border flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium">Contexto IA</span>
        <Badge variant="outline" className="text-[10px] ml-auto">{language}</Badge>
        {isProcessing && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
      </div>
      <ScrollArea className="flex-1 p-3">
        {aiResponse ? (
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown>{aiResponse}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Las respuestas de la IA aparecerán aquí...
          </p>
        )}
      </ScrollArea>
    </div>
  );
}
