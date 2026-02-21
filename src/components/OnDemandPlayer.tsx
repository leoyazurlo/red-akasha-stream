import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize2,
  X,
  Lock,
  DollarSign,
  SkipForward,
  SkipBack,
  Globe
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useContentAccess } from "@/hooks/useContentAccess";

const PREVIEW_LIMIT_SECONDS = 40;

interface OnDemandPlayerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: {
    id: string;
    title: string;
    description: string | null;
    content_type: string;
    video_url: string | null;
    audio_url: string | null;
    thumbnail_url: string | null;
    is_free: boolean;
    price: number;
    currency: string;
    band_name: string | null;
    producer_name: string | null;
    venue_name: string | null;
    views_count: number;
  };
  isPurchased?: boolean;
  onPurchase?: () => void;
  initialPosition?: number;
  // Playlist continuos playback
  playlistContext?: {
    items: Array<{ id: string; title: string }>;
    currentIndex: number;
    onNext?: () => void;
    onPrevious?: () => void;
    repeatMode?: 'none' | 'all' | 'one';
  };
}

export const OnDemandPlayer = ({ 
  open, 
  onOpenChange, 
  content,
  isPurchased = false,
  onPurchase,
  initialPosition = 0,
  playlistContext
}: OnDemandPlayerProps) => {
  const { user } = useAuth();
  const contentAccess = useContentAccess(content.id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [previewLimitReached, setPreviewLimitReached] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isVideo = content.content_type !== 'podcast';
  const mediaRef = isVideo ? videoRef : audioRef;
  const mediaUrl = isVideo ? content.video_url : content.audio_url;

  // Determine if user has full access or only preview
  // Paid content: only 20s preview unless purchased/subscribed. Creator decides free vs paid.
  const hasFullAccess = content.is_free || isPurchased || contentAccess.accessType === 'subscription';
  const isPreviewMode = !content.is_free && !hasFullAccess;
  
  const canPlay = content.is_free || isPurchased || isPreviewMode || hasFullAccess;

  useEffect(() => {
    if (!open) {
      setIsPlaying(false);
      setPreviewLimitReached(false);
      // Guardar progreso al cerrar
      if (user && hasStarted) {
        savePlaybackPosition(false);
      }
      // Limpiar interval
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    } else {
      // Restaurar posición inicial al abrir
      if (initialPosition > 0 && mediaRef.current) {
        mediaRef.current.currentTime = initialPosition;
        setCurrentTime(initialPosition);
      }
    }
  }, [open]);

  // Guardar progreso periódicamente mientras reproduce
  useEffect(() => {
    if (isPlaying && user && canPlay) {
      setHasStarted(true);
      // Guardar cada 5 segundos
      saveIntervalRef.current = setInterval(() => {
        savePlaybackPosition(false);
      }, 5000);
    } else {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    }

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [isPlaying, user, canPlay]);

  // Check preview limit for non-LATAM users on paid content
  useEffect(() => {
    if (isPreviewMode && currentTime >= PREVIEW_LIMIT_SECONDS && !previewLimitReached) {
      setPreviewLimitReached(true);
      setIsPlaying(false);
      const media = mediaRef.current;
      if (media) {
        media.pause();
      }
    }
  }, [currentTime, isPreviewMode, previewLimitReached]);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleTimeUpdate = () => {
      const time = media.currentTime;
      setCurrentTime(time);
      
      // Stop at preview limit for non-LATAM users
      if (isPreviewMode && time >= PREVIEW_LIMIT_SECONDS) {
        media.pause();
        setIsPlaying(false);
        setPreviewLimitReached(true);
      }
    };
    const handleDurationChange = () => setDuration(media.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      // Marcar como completado
      if (user) {
        savePlaybackPosition(true);
      }
      
      // Handle repeat modes
      if (playlistContext?.repeatMode === 'one' && canPlay && hasFullAccess) {
        // Repeat current video
        setTimeout(() => {
          const media = mediaRef.current;
          if (media) {
            media.currentTime = 0;
            media.play();
            setIsPlaying(true);
          }
        }, 500);
      } else if (playlistContext?.onNext && canPlay && hasFullAccess) {
        // Auto-play next video in playlist (works for both 'all' and 'none' repeat modes)
        setTimeout(() => {
          playlistContext.onNext?.();
        }, 1000);
      }
    };

    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('durationchange', handleDurationChange);
    media.addEventListener('ended', handleEnded);

    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('durationchange', handleDurationChange);
      media.removeEventListener('ended', handleEnded);
    };
  }, [mediaRef, user, isPreviewMode, hasFullAccess]);

  const savePlaybackPosition = async (completed: boolean) => {
    if (!user) return;

    const media = mediaRef.current;
    if (!media) return;

    try {
      const position = Math.floor(media.currentTime);
      const totalDuration = Math.floor(media.duration);

      // Determinar si está completado (vio más del 90% o llegó al final)
      const isCompleted = completed || (position / totalDuration) > 0.9;

      await supabase
        .from('playback_history')
        .upsert({
          user_id: user.id,
          content_id: content.id,
          last_position: position,
          duration: totalDuration,
          completed: isCompleted,
          last_watched_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,content_id'
        });
    } catch (error) {
      console.error('Error saving playback position:', error);
    }
  };

  const togglePlayPause = () => {
    const media = mediaRef.current;
    if (!media || !canPlay || previewLimitReached) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const media = mediaRef.current;
    if (!media || !canPlay) return;
    
    // Limit seeking in preview mode
    let seekTime = value[0];
    if (isPreviewMode && seekTime >= PREVIEW_LIMIT_SECONDS) {
      seekTime = PREVIEW_LIMIT_SECONDS - 1;
    }
    
    media.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const media = mediaRef.current;
    if (!media) return;

    const newVolume = value[0];
    media.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isMuted) {
      media.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      media.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  // Sync fullscreen state with browser events (e.g. pressing Escape)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getContentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      video_musical_vivo: "Video Musical en Vivo",
      video_clip: "Video Clip",
      podcast: "Podcast",
      corto: "Cortometraje",
      documental: "Documental",
      pelicula: "Película"
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden">
        <div ref={containerRef} className="relative bg-black">
          {/* Exit Fullscreen Button - always visible in fullscreen */}
          {isFullscreen && (
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 z-50 text-white bg-black/60 hover:bg-black/80 rounded-full w-10 h-10"
              aria-label="Salir de pantalla completa"
            >
              <Minimize2 className="w-5 h-5" />
            </Button>
          )}
          {/* Header */}
          <DialogHeader className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-6 pb-12">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-white/20 text-white">
                    {getContentTypeLabel(content.content_type)}
                  </Badge>
                  {content.is_free ? (
                    <Badge className="bg-green-500/80 text-white border-none">
                      Gratis
                    </Badge>
                  ) : (
                    <Badge className="bg-primary/80 text-white border-none flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {content.price} {content.currency}
                    </Badge>
                  )}
                </div>
                {content.band_name && (
                  <DialogTitle className="text-white text-xl md:text-2xl font-light tracking-wide font-sans">{content.band_name}</DialogTitle>
                )}
                {!content.band_name && (
                  <DialogTitle className="text-white text-xl md:text-2xl font-light tracking-wide font-sans">{content.title}</DialogTitle>
                )}
                <p className="text-white/70 mt-1 text-sm font-light tracking-wide font-sans">{content.title}</p>
                {content.description && (
                  <DialogDescription className="text-white/80 mt-2 font-light tracking-wide font-sans">
                    {content.description}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Player Area */}
          <div className="relative">
            {canPlay ? (
              <>
                {isVideo ? (
                  <AspectRatio ratio={16 / 9} className="bg-black">
                    <video
                      ref={videoRef}
                      src={mediaUrl || ''}
                      poster={content.thumbnail_url || ''}
                      playsInline
                      className="w-full h-full object-contain"
                      onClick={togglePlayPause}
                      onError={() => {
                        setIsPlaying(false);
                      }}
                    />
                  </AspectRatio>
                ) : (
                  <div className="relative">
                    <AspectRatio ratio={16 / 9} className="bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20">
                      <div className="w-full h-full flex items-center justify-center">
                        {content.thumbnail_url ? (
                          <img 
                            src={content.thumbnail_url} 
                            alt={content.title}
                            className="w-full h-full object-cover opacity-50"
                          />
                        ) : (
                          <div className="text-center">
                            <Play className="w-24 h-24 text-white/50 mx-auto mb-4" />
                            <p className="text-white/70 text-lg">Reproduciendo Audio</p>
                          </div>
                        )}
                      </div>
                    </AspectRatio>
                    <audio ref={audioRef} src={mediaUrl || ''} />
                  </div>
                )}
              </>
            ) : (
              <AspectRatio ratio={16 / 9} className="bg-gradient-to-br from-secondary/20 to-secondary/5">
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                  <Lock className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-2xl font-bold text-foreground mb-2">Contenido de Pago</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Este contenido requiere una compra para poder reproducirse
                  </p>
                  <Button size="lg" onClick={onPurchase} className="gap-2">
                    <DollarSign className="w-4 h-4" />
                    Comprar por {content.price} {content.currency}
                  </Button>
                </div>
              </AspectRatio>
            )}

            {/* Preview Limit Overlay for paid content */}
            {previewLimitReached && isPreviewMode && (
              <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/90 backdrop-blur-sm">
                <div className="text-center p-10 max-w-lg">
                  <Lock className="w-24 h-24 text-cyan-400 mx-auto mb-6 drop-shadow-[0_0_20px_hsl(180_100%_50%/0.7)]" />
                  <h3 className="text-3xl font-bold text-cyan-400 mb-3 drop-shadow-[0_0_15px_hsl(180_100%_50%/0.5)]">Vista previa finalizada</h3>
                  <p className="text-cyan-200/90 text-lg mb-2">
                    Has visto {PREVIEW_LIMIT_SECONDS} segundos de vista previa.
                  </p>
                  <p className="text-cyan-300/60 text-base mb-8">
                    Compra este contenido para verlo completo.
                  </p>
                  <div className="flex flex-col gap-3">
                    <Button size="lg" onClick={onPurchase} className="gap-2 w-full bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-lg px-8 py-3 shadow-[0_0_25px_hsl(180_100%_50%/0.5)]">
                      <DollarSign className="w-5 h-5" />
                      Comprar por {content.price} {content.currency}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Mode Indicator */}
            {isPreviewMode && !previewLimitReached && isPlaying && (
              <div className="absolute top-20 right-4 z-20">
                <Badge variant="outline" className="bg-black/60 border-primary/50 text-primary">
                  Vista previa: {Math.max(0, PREVIEW_LIMIT_SECONDS - Math.floor(currentTime))}s restantes
                </Badge>
              </div>
            )}

            {/* Play/Pause Overlay (only when can play and not limit reached) */}
            {canPlay && !isPlaying && !previewLimitReached && (
              <div 
                className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
                onClick={togglePlayPause}
              >
                <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors">
                  <Play className="w-10 h-10 text-white ml-1" fill="white" />
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          {canPlay && (
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 to-transparent p-6 pt-12">
              {/* Progress Bar */}
              <div className="mb-4">
                <Slider
                  value={[currentTime]}
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="cursor-pointer"
                  aria-label="Progreso de reproducción"
                />
                <div className="flex justify-between text-xs text-white/70 mt-1 font-sans font-light tracking-wide">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Playlist Previous Button */}
                  {playlistContext && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={playlistContext.onPrevious}
                      disabled={!playlistContext.onPrevious || playlistContext.currentIndex === 0}
                      className="text-white hover:bg-white/20 disabled:opacity-30"
                      aria-label="Pista anterior"
                    >
                      <SkipBack className="w-5 h-5" />
                    </Button>
                  )}

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={togglePlayPause}
                    className="text-white hover:bg-white/20"
                    aria-label={isPlaying ? "Pausar" : "Reproducir"}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6" />
                    )}
                  </Button>

                  {/* Playlist Next Button */}
                  {playlistContext && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={playlistContext.onNext}
                      disabled={!playlistContext.onNext || playlistContext.currentIndex === playlistContext.items.length - 1}
                      className="text-white hover:bg-white/20 disabled:opacity-30"
                      aria-label="Pista siguiente"
                    >
                      <SkipForward className="w-5 h-5" />
                    </Button>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                      aria-label={isMuted ? "Activar sonido" : "Silenciar"}
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </Button>
                    <div className="w-24">
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        min={0}
                        max={1}
                        step={0.01}
                        onValueChange={handleVolumeChange}
                        aria-label="Volumen"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Playlist info */}
                  {playlistContext && (
                    <div className="text-xs text-white/70 mr-2 font-sans font-light tracking-wide">
                      {playlistContext.currentIndex + 1} / {playlistContext.items.length}
                    </div>
                  )}
                  
                  {isVideo && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={toggleFullscreen}
                      className="text-white hover:bg-white/20"
                    >
                      <Maximize className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-sans">
            {content.band_name && (
              <div>
                <p className="text-muted-foreground mb-1 font-light tracking-wide text-xs uppercase">Banda</p>
                <p className="font-light tracking-wide">{content.band_name}</p>
              </div>
            )}
            {content.producer_name && (
              <div>
                <p className="text-muted-foreground mb-1 font-light tracking-wide text-xs uppercase">Productor</p>
                <p className="font-light tracking-wide">{content.producer_name}</p>
              </div>
            )}
            {content.venue_name && (
              <div>
                <p className="text-muted-foreground mb-1 font-light tracking-wide text-xs uppercase">Sala</p>
                <p className="font-light tracking-wide">{content.venue_name}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground mb-1 font-light tracking-wide text-xs uppercase">Reproducciones</p>
              <p className="font-light tracking-wide">{content.views_count.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};