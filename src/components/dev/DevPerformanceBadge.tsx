import { useState, useEffect } from "react";
import { X, Activity } from "lucide-react";

export function DevPerformanceBadge() {
  const [visible, setVisible] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [memoryMB, setMemoryMB] = useState<number | null>(null);

  useEffect(() => {
    // Measure page load time
    const measure = () => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (nav) {
        setLoadTime(Math.round(nav.loadEventEnd - nav.startTime));
      } else {
        setLoadTime(Math.round(performance.now()));
      }

      // Memory (Chrome only)
      const perfMemory = (performance as any).memory;
      if (perfMemory) {
        setMemoryMB(Math.round(perfMemory.usedJSHeapSize / 1048576));
      }
    };

    // Wait for load event to complete
    if (document.readyState === "complete") {
      requestAnimationFrame(measure);
    } else {
      window.addEventListener("load", () => requestAnimationFrame(measure), { once: true });
    }
  }, []);

  if (!visible) return null;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-[9999] w-10 h-10 rounded-full bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg hover:bg-black/90 transition-colors"
        title="Performance"
      >
        <Activity className="h-4 w-4 text-emerald-400" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-black/85 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 shadow-lg text-xs font-mono text-white/80 flex items-center gap-3 select-none">
      <Activity className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
      <div className="flex items-center gap-3">
        <span>
          ⏱ {loadTime !== null ? `${loadTime}ms` : "..."}
        </span>
        {memoryMB !== null && (
          <span>🧠 {memoryMB}MB</span>
        )}
      </div>
      <div className="flex items-center gap-1 ml-1">
        <button
          onClick={() => setMinimized(true)}
          className="hover:text-white transition-colors p-0.5"
          title="Minimizar"
        >
          <span className="text-[10px]">—</span>
        </button>
        <button
          onClick={() => setVisible(false)}
          className="hover:text-white transition-colors p-0.5"
          title="Cerrar"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
