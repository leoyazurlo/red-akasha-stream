import React, { createContext, useCallback, useContext, useRef, useState } from "react";

interface LiveRegionContextType {
  announce: (message: string, priority?: "polite" | "assertive") => void;
}

const LiveRegionContext = createContext<LiveRegionContextType | null>(null);

export function useLiveRegion() {
  const ctx = useContext(LiveRegionContext);
  if (!ctx) {
    // Fallback no-op when used outside provider
    return { announce: (_msg: string) => {} };
  }
  return ctx;
}

export function LiveRegionProvider({ children }: { children: React.ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const announce = useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    // Clear previous to force re-announce even if same text
    if (priority === "assertive") {
      setAssertiveMessage("");
    } else {
      setPoliteMessage("");
    }

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (priority === "assertive") {
        setAssertiveMessage(message);
      } else {
        setPoliteMessage(message);
      }
    }, 50);
  }, []);

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
      {/* Polite announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      {/* Assertive announcements */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </LiveRegionContext.Provider>
  );
}
