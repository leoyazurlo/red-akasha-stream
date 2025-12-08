import { useState, useRef, useEffect } from "react";
import { Play, Radio, Maximize } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Button } from "@/components/ui/button";
import { useLiveStream } from "@/contexts/LiveStreamContext";

export const VideoPlayer = () => {
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.2 });
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const [isPlayingLocal, setIsPlayingLocal] = useState(false);
  const { liveData, setIsPlaying } = useLiveStream();

  const hasLiveStream = !!liveData?.playbackUrl;

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const handlePlay = () => {
    setIsPlayingLocal(true);
    setIsPlaying(true);
  };

  // Sincronizar estado global cuando se reproduce
  useEffect(() => {
    if (isPlayingLocal) {
      setIsPlaying(true);
    }
  }, [isPlayingLocal, setIsPlaying]);

  // Determinar si es un video de YouTube para usar iframe
  const isYouTubeUrl = liveData?.playbackUrl?.includes('youtube.com') || liveData?.playbackUrl?.includes('youtu.be');
  
  // Extraer video ID de YouTube si es necesario
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const youtubeVideoId = liveData?.playbackUrl ? getYouTubeVideoId(liveData.playbackUrl) : null;

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
          <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 ${
            hasLiveStream
              ? 'bg-red-500/20 border-red-500' 
              : 'bg-primary/20 border-primary'
          } border rounded-full`}>
            <div className={`w-2 h-2 ${hasLiveStream ? 'bg-red-500' : 'bg-primary'} rounded-full animate-pulse`} />
            <span className={`${hasLiveStream ? 'text-red-400' : 'text-primary'} font-light text-xs sm:text-sm uppercase tracking-widest font-sans`}>
              {hasLiveStream ? 'En Vivo Ahora' : 'En Vivo 24/7'}
            </span>
          </div>
        </div>

        {/* Video Player Container */}
        <div 
          ref={containerRef}
          className="relative aspect-video bg-card rounded-lg sm:rounded-xl overflow-hidden border-2 border-cyan-400/40 group shadow-[0_0_30px_hsl(180_100%_50%/0.35)] hover:shadow-[0_0_45px_hsl(180_100%_50%/0.5)] transition-shadow duration-300"
        >
          {hasLiveStream && isYouTubeUrl && youtubeVideoId ? (
            <>
              {/* YouTube iframe */}
              {isPlayingLocal ? (
                <iframe
                  ref={iframeRef}
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0`}
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div 
                  className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer z-10"
                  onClick={handlePlay}
                >
                  {/* Thumbnail */}
                  <img 
                    src={`https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`}
                    alt={liveData.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-primary/30 rounded-full flex items-center justify-center hover:bg-primary/50 transition-all">
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary fill-primary ml-1" />
                  </div>
                  
                  <div className="absolute bottom-8 left-4 right-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded text-xs font-semibold text-white">
                        <Radio className="w-3 h-3" />
                        EN VIVO
                      </div>
                    </div>
                    <p className="text-white text-lg font-semibold">{liveData.title}</p>
                    {liveData.description && (
                      <p className="text-white/70 text-sm mt-1 line-clamp-2">{liveData.description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Fullscreen button when playing */}
              {isPlayingLocal && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="absolute bottom-4 right-4 text-white hover:bg-white/20 z-20"
                >
                  <Maximize className="w-5 h-5" />
                </Button>
              )}
            </>
          ) : hasLiveStream && liveData?.playbackUrl ? (
            <>
              {/* Video nativo para otras URLs */}
              <video
                src={liveData.playbackUrl}
                className="absolute inset-0 w-full h-full object-cover"
                controls
                autoPlay={isPlayingLocal}
                playsInline
                onPlay={() => {
                  setIsPlayingLocal(true);
                  setIsPlaying(true);
                }}
              />
            </>
          ) : (
            /* Placeholder when no live stream */
            <div className="absolute inset-0 bg-gradient-dark flex items-center justify-center p-4">
              <div className="text-center space-y-2 sm:space-y-3">
                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center group-hover:bg-primary/30 transition-all duration-300 group-hover:animate-float">
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary fill-primary ml-0.5" />
                </div>
                <div>
                  <p className="text-sm sm:text-base md:text-lg font-light text-foreground tracking-wide font-sans">Transmisión en Vivo</p>
                  <p className="text-xs sm:text-sm font-light text-muted-foreground mt-0.5 sm:mt-1 tracking-wide font-sans">
                    Contenido exclusivo las 24 horas
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Glow effect overlay */}
          <div className="absolute inset-0 bg-gradient-glow opacity-35 pointer-events-none" />
        </div>

        {/* Info Text */}
        <div className="mt-4 sm:mt-6 text-center px-4">
          <p className="text-cyan-400 text-xs sm:text-sm font-light tracking-wide drop-shadow-[0_0_8px_hsl(180_100%_50%/0.6)] font-sans">
            Plataforma colaborativa para artistas, productores del medio artístico y cultural
          </p>
          <p className="text-cyan-400 text-xs sm:text-sm font-light tracking-wide drop-shadow-[0_0_8px_hsl(180_100%_50%/0.6)] mt-1 font-sans">
            ESTE PROYECTO ES DE LIBRE USO PARA LATINOAMÉRICA
          </p>
        </div>
      </div>
    </section>
  );
};
