import { useState, useCallback } from "react";
import { toast } from "sonner";

/**
 * Hook to surface async errors into React's error boundary mechanism.
 * Call `throwAsync(error)` inside a catch block — the next render will throw,
 * letting the nearest ErrorBoundary catch it.
 *
 * Also shows a toast and logs in dev.
 */
export function useAsyncError() {
  const [, setError] = useState<Error | null>(null);

  const throwAsync = useCallback((error: unknown, friendlyMessage?: string) => {
    const err = error instanceof Error ? error : new Error(String(error));

    if (import.meta.env.DEV) {
      console.error("🔴 [AsyncError]:", err);
    }

    toast.error(friendlyMessage || "Ocurrió un error inesperado", {
      description: err.message.length > 120 ? err.message.slice(0, 120) + "…" : err.message,
    });

    // Re-throw inside setState to propagate to ErrorBoundary
    setError(() => {
      throw err;
    });
  }, []);

  return { throwAsync };
}
