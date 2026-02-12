import { WifiOff, CheckCircle } from "lucide-react";
import { useNetworkStatus } from "@/hooks/use-network-status";

export const OfflineBanner = () => {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[60] animate-slide-in">
      <div className="flex items-center justify-center gap-3 bg-amber-900/90 backdrop-blur-md px-4 py-2.5 text-sm text-amber-50 border-b border-amber-700/40">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span className="font-medium">Sin conexión</span>
        <span className="hidden sm:inline text-amber-200/80">— Algunas funciones no están disponibles</span>
        <span className="ml-2 hidden md:inline-flex items-center gap-1 text-xs text-amber-300/70">
          <CheckCircle className="h-3 w-3" /> Contenido cacheado disponible
        </span>
      </div>
    </div>
  );
};
