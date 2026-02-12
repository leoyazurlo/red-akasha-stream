import { Loader2, Check, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AutoSaveStatus } from "@/hooks/use-auto-save";

interface SaveIndicatorProps {
  status: AutoSaveStatus;
  onRetry?: () => void;
  className?: string;
}

export function SaveIndicator({ status, onRetry, className = "" }: SaveIndicatorProps) {
  if (status === "idle") return null;

  return (
    <div
      className={`flex items-center gap-1.5 text-xs text-muted-foreground transition-opacity duration-300 ${className}`}
    >
      {status === "saving" && (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Guardando...</span>
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="h-3 w-3 text-green-400" />
          <span>Guardado</span>
        </>
      )}
      {status === "error" && (
        <>
          <X className="h-3 w-3 text-destructive" />
          <span>Error</span>
          {onRetry && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={onRetry}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reintentar
            </Button>
          )}
        </>
      )}
    </div>
  );
}
