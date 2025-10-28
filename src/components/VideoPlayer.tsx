import { Play } from "lucide-react";
export const VideoPlayer = () => {
  return <section className="container mx-auto px-4 py-12 mt-16" id="home">
      <div className="max-w-6xl mx-[2px]">
        {/* Live Badge */}
        <div className="flex items-center justify-center mb-4 gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary rounded-full animate-pulse-glow">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">
              En Vivo 24/7
            </span>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video bg-card rounded-2xl overflow-hidden shadow-glow border border-border group mx-[25px]">
          {/* Placeholder for video player */}
          <div className="absolute inset-0 bg-gradient-dark flex items-center justify-center mx-[80px] my-[20px] px-[80px] py-[20px]">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center group-hover:bg-primary/30 transition-all duration-300">
                <Play className="w-10 h-10 text-primary fill-primary" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">Transmisión en Vivo</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Contenido exclusivo las 24 horas
                </p>
              </div>
            </div>
          </div>

          {/* Glow effect overlay */}
          <div className="absolute inset-0 bg-gradient-glow opacity-35 pointer-events-none" />
        </div>

        {/* Info Text */}
        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            Plataforma colaborativa para artistas y productores del medio artístico
          </p>
        </div>
      </div>
    </section>;
};