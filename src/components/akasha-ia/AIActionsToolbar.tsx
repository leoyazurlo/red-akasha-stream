/**
 * @fileoverview Toolbar de acciones de IA para el editor de código.
 */
import { Button } from "@/components/ui/button";
import { Sparkles, Bug, Zap } from "lucide-react";
import { toast } from "sonner";

interface AIActionsToolbarProps {
  code: string;
  language: string;
  onCodeUpdate: (code: string) => void;
  onAIResponse: (response: string) => void;
}

export function AIActionsToolbar({ code, language, onCodeUpdate, onAIResponse }: AIActionsToolbarProps) {
  const handleAction = (action: string) => {
    toast.info(`Acción IA: ${action} (${language})`);
    onAIResponse(`Analizando código ${language}...`);
  };

  return (
    <div className="flex items-center gap-1">
      <Button size="icon" variant="ghost" className="h-6 w-6" title="Mejorar código" onClick={() => handleAction("mejorar")}>
        <Sparkles className="h-3 w-3" />
      </Button>
      <Button size="icon" variant="ghost" className="h-6 w-6" title="Depurar" onClick={() => handleAction("depurar")}>
        <Bug className="h-3 w-3" />
      </Button>
      <Button size="icon" variant="ghost" className="h-6 w-6" title="Optimizar" onClick={() => handleAction("optimizar")}>
        <Zap className="h-3 w-3" />
      </Button>
    </div>
  );
}
