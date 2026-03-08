import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { Music } from "lucide-react";

const OnDemandAudio = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <CosmicBackground />
      <Header />
      <main id="main-content" className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-cyan-500/20 via-cyan-400/10 to-transparent border border-cyan-500/20 p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
              <Music className="h-8 w-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Audio On Demand</h1>
              <p className="text-muted-foreground">Próximamente</p>
            </div>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Music className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-semibold text-muted-foreground mb-2">Sin contenido de audio disponible</h2>
          <p className="text-muted-foreground/70 max-w-md">
            Esta sección estará disponible próximamente con podcasts, música y más contenido de audio.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OnDemandAudio;
