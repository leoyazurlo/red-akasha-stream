import { useState, useEffect, useCallback } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoAkasha from "@/assets/logo-akasha-cyan.png";

const DISMISSED_KEY = "pwa-banner-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const InstallPWABanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // User already dismissed
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setVisible(false);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "1");
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up md:left-auto md:right-6 md:max-w-sm">
      <div className="relative flex items-center gap-3 rounded-xl border border-primary/20 bg-card/80 p-4 shadow-lg backdrop-blur-xl">
        <img src={logoAkasha} alt="Red Akasha" className="h-10 w-10 shrink-0 rounded-lg" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Instala Red Akasha</p>
          <p className="text-xs text-muted-foreground truncate">Accede sin conexión desde tu dispositivo</p>
        </div>

        <Button size="sm" onClick={handleInstall} className="shrink-0 gap-1.5">
          <Download className="h-4 w-4" />
          Instalar
        </Button>

        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};
