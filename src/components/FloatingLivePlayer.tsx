import React, { useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Maximize2, Minimize2, Radio, Volume2, VolumeX } from "lucide-react";
import { useLiveStream } from "@/contexts/LiveStreamContext";
import { useNavigate } from 'react-router-dom';

export const FloatingLivePlayer = () => {
  const { liveData, isFloating, isPlaying, closeLivePlayer } = useLiveStream();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  if (!isFloating || !liveData || !isPlaying) return null;

  const isYouTubeUrl = liveData.playbackUrl?.includes('youtube.com') || liveData.playbackUrl?.includes('youtu.be');
  
  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const youtubeVideoId = liveData.playbackUrl ? getYouTubeVideoId(liveData.playbackUrl) : null;

  const goToHome = () => {
    navigate('/');
  };

  return (
    <Card 
      className={`fixed z-50 bg-card/95 backdrop-blur-xl border-primary/30 shadow-glow transition-all duration-300 overflow-hidden ${
        isMinimized 
          ? 'bottom-4 right-4 w-72 h-auto' 
          : 'bottom-4 right-4 w-80 sm:w-96'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-2 border-b border-primary/10 bg-card/50">
        <div className="flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded text-xs font-semibold text-white">
          <Radio className="w-3 h-3 animate-pulse" />
          EN VIVO
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{liveData.title}</p>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-6 w-6"
            aria-label={isMinimized ? "Expandir reproductor" : "Minimizar reproductor"}
          >
            {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={closeLivePlayer}
            className="h-6 w-6 hover:text-destructive"
            aria-label="Cerrar reproductor en vivo"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Video */}
      {!isMinimized && (
        <div className="relative aspect-video bg-black cursor-pointer" onClick={goToHome}>
          {isYouTubeUrl && youtubeVideoId ? (
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&modestbranding=1&playsinline=1`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`Stream en vivo: ${liveData.title}`}
            />
          ) : (
            <video
              src={liveData.playbackUrl}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted={isMuted}
              playsInline
            />
          )}
          
          {/* Overlay hint */}
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
            <span className="text-white/0 hover:text-white/80 text-xs font-medium opacity-0 group-hover:opacity-100">
              Ir al Home
            </span>
          </div>
        </div>
      )}

      {/* Controls for minimized */}
      {isMinimized && (
        <div className="p-2 flex items-center justify-between">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsMuted(!isMuted)}
            className="h-7"
            aria-label={isMuted ? "Activar sonido" : "Silenciar"}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={goToHome}
            className="h-7 text-xs"
          >
            Volver al stream
          </Button>
        </div>
      )}
    </Card>
  );
};
