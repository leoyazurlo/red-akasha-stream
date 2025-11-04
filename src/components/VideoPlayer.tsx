import { Play } from "lucide-react";
export const VideoPlayer = () => {
  return <section className="container mx-auto px-4 py-12 mt-16" id="home">
      <div className="max-w-3xl mx-auto">
        {/* Live Badge */}
        <div className="flex items-center justify-center mb-4 gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary rounded-full">
            <div className="w-2 h-2 bg-primary rounded-full" />
            <span className="text-primary font-light text-sm uppercase tracking-wider">
              En Vivo 24/7
            </span>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video bg-card rounded-xl overflow-hidden shadow-glow border border-border group mx-[12px]">
          {/* Placeholder for video player */}
          <div className="absolute inset-0 bg-gradient-dark flex items-center justify-center mx-[25px] my-[8px] px-[25px] py-[8px]">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 mx-auto bg-primary/20 rounded-full flex items-center justify-center group-hover:bg-primary/30 transition-all duration-300 group-hover:animate-float">
                <Play className="w-5 h-5 text-primary fill-primary" />
              </div>
              <div>
                <p className="text-base font-light text-foreground">Transmisión en Vivo</p>
                <p className="text-xs font-light text-muted-foreground mt-0.5">
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
          <p className="text-muted-foreground text-sm font-light tracking-wide">
            Plataforma colaborativa para artistas y productores del medio artístico
          </p>
        </div>
      </div>
    </section>;
};