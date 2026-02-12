import { useState, useEffect, useRef, useCallback } from "react";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions<T> {
  saveFn: (data: T) => Promise<void>;
  data: T;
  delay?: number;
  enabled?: boolean;
}

interface UseAutoSaveResult {
  status: AutoSaveStatus;
  lastSaved: Date | null;
  retry: () => void;
}

export function useAutoSave<T>({
  saveFn,
  data,
  delay = 2000,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveResult {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveFnRef = useRef(saveFn);
  const dataRef = useRef(data);
  const initialDataRef = useRef<string>("");
  const isFirstRender = useRef(true);

  saveFnRef.current = saveFn;
  dataRef.current = data;

  // Capture initial data to avoid saving on first render
  useEffect(() => {
    if (isFirstRender.current) {
      initialDataRef.current = JSON.stringify(data);
      isFirstRender.current = false;
    }
  }, [data]);

  const doSave = useCallback(async () => {
    setStatus("saving");
    try {
      await saveFnRef.current(dataRef.current);
      setStatus("saved");
      setLastSaved(new Date());
      // Reset to idle after 3s
      setTimeout(() => setStatus((s) => (s === "saved" ? "idle" : s)), 3000);
    } catch {
      setStatus("error");
    }
  }, []);

  // Debounced auto-save on data changes
  useEffect(() => {
    if (!enabled || isFirstRender.current) return;

    const serialized = JSON.stringify(data);
    if (serialized === initialDataRef.current) return;

    const timeout = setTimeout(doSave, delay);
    return () => clearTimeout(timeout);
  }, [data, delay, enabled, doSave]);

  return { status, lastSaved, retry: doSave };
}
