import { Play } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export const VideoPlayer = () => {
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.2 });
  
  return (
    <section 
      ref={elementRef}
      className={`container mx-auto px-4 py-8 sm:py-10 md:py-12 mt-16 transition-all duration-700 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      id="home"
    >
      <div className="max-w-3xl mx-auto">
        {/* Live Badge */}
        <div className="flex items-center justify-center mb-3 md:mb-4 gap-2">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/20 border border-primary rounded-full">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-primary font-light text-xs sm:text-sm uppercase tracking-wider">
              En Vivo 24/7
            </span>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video bg-card rounded-lg sm:rounded-xl overflow-hidden border-2 border-cyan-400/40 group shadow-[0_0_30px_hsl(180_100%_50%/0.35)] hover:shadow-[0_0_45px_hsl(180_100%_50%/0.5)] transition-shadow duration-300">
          {/* Placeholder for video player */}
          <div className="absolute inset-0 bg-gradient-dark flex items-center justify-center p-4">
            <div className="text-center space-y-2 sm:space-y-3">
              <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center group-hover:bg-primary/30 transition-all duration-300 group-hover:animate-float">
                <Play className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary fill-primary ml-0.5" />
              </div>
              <div>
                <p className="text-sm sm:text-base md:text-lg font-light text-foreground">Transmisión en Vivo</p>
                <p className="text-xs sm:text-sm font-light text-muted-foreground mt-0.5 sm:mt-1">
                  Contenido exclusivo las 24 horas
                </p>
              </div>
            </div>
          </div>

          {/* Glow effect overlay */}
          <div className="absolute inset-0 bg-gradient-glow opacity-35 pointer-events-none" />
        </div>

        {/* Info Text */}
        <div className="mt-4 sm:mt-6 text-center px-4">
          <p className="text-cyan-400 text-xs sm:text-sm font-light tracking-wide drop-shadow-[0_0_8px_hsl(180_100%_50%/0.6)]">
            Plataforma colaborativa para artistas, productores del medio artístico y cultural
          </p>
          <p className="text-cyan-400 text-xs sm:text-sm font-light tracking-wide drop-shadow-[0_0_8px_hsl(180_100%_50%/0.6)] mt-1">
            ESTE PROYECTO ES DE LIBRE USO PARA LATINOAMÉRICA
          </p>
        </div>
      </div>
    </section>
  );
};