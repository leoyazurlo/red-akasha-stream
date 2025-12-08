import { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Radio } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface ActiveStream {
  id: string;
  title: string;
  description: string | null;
  playback_url: string | null;
  thumbnail_url: string | null;
  status: string;
}

export const VideoPlayer = () => {
  const { elementRef, isVisible } = useScrollAnimation({ threshold: 0.2 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [showControls, setShowControls] = useState(false);

  // Buscar stream activo (status = 'live')
  const { data: activeStream } = useQuery({
    queryKey: ["active-live-stream"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("streams")
        .select("id, title, description, playback_url, thumbnail_url, status")
        .eq("status", "live")
        .order("actual_start_time", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as ActiveStream | null;
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos para detectar nuevos streams
  });

  const hasLiveStream = activeStream && activeStream.playback_url;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (newVolume > 0) setIsMuted(false);
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

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
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          {hasLiveStream ? (
            <>
              {/* Video Element */}
              <video
                ref={videoRef}
                src={activeStream.playback_url || ''}
                poster={activeStream.thumbnail_url || ''}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />

              {/* Overlay with Play Button (when paused) */}
              {!isPlaying && (
                <div 
                  className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer z-10"
                  onClick={togglePlay}
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-primary/30 rounded-full flex items-center justify-center hover:bg-primary/50 transition-all">
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary fill-primary ml-1" />
                  </div>
                  <div className="absolute bottom-8 left-4 right-4 text-center">
                    <p className="text-white text-lg font-semibold">{activeStream.title}</p>
                    {activeStream.description && (
                      <p className="text-white/70 text-sm mt-1 line-clamp-2">{activeStream.description}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
                showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
              }`}>
                <div className="flex items-center gap-3">
                  {/* Play/Pause */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={togglePlay}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                  </Button>

                  {/* Live indicator */}
                  <div className="flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded text-xs font-semibold text-white">
                    <Radio className="w-3 h-3" />
                    EN VIVO
                  </div>

                  <div className="flex-1" />

                  {/* Volume */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                      className="w-20"
                    />
                  </div>

                  {/* Fullscreen */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize className="w-5 h-5" />
                  </Button>
                </div>
              </div>
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
