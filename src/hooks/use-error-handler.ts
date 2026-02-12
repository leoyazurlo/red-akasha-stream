import { useCallback } from "react";
import { toast } from "sonner";

export function useErrorHandler() {
  const handleError = useCallback((error: unknown, context?: string) => {
    const message = error instanceof Error ? error.message : String(error);

    if (import.meta.env.DEV) {
      console.error(`🔴 [${context || "Error"}]:`, error);
    }

    toast.error(context ? `Error en ${context}` : "Ocurrió un error", {
      description: message.length > 120 ? message.slice(0, 120) + "…" : message,
    });
  }, []);

  return { handleError };
}
