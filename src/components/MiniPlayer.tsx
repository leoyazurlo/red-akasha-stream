import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2,
  X 
} from "lucide-react";
import { useMiniPlayer } from "@/contexts/MiniPlayerContext";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export const MiniPlayer = () => {
  const { isOpen, content, closeMiniPlayer, isMinimized, setIsMinimized } = useMiniPlayer();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const isVideo = content?.content_type !== 'podcast';
  const mediaRef = isVideo ? videoRef : audioRef;
  const mediaUrl = isVideo ? content?.video_url : content?.audio_url;

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const handleTimeUpdate = () => setCurrentTime(media.currentTime);
    const handleDurationChange = () => setDuration(media.duration);
    const handleEnded = () => setIsPlaying(false);

    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('durationchange', handleDurationChange);
    media.addEventListener('ended', handleEnded);

    return () => {
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('durationchange', handleDurationChange);
      media.removeEventListener('ended', handleEnded);
    };
  }, [mediaRef, content]);

  const togglePlayPause = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const media = mediaRef.current;
    if (!media) return;
    
    media.currentTime = value[0];
    setCurrentTime(value[0]);
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

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen || !content) return null;

  return (
    <Card 
      className={`fixed z-50 bg-card border-border shadow-2xl transition-all duration-300 ${
        isMinimized 
          ? 'bottom-4 right-4 w-80' 
          : 'bottom-4 right-4 w-96'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-card/50">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{content.title}</p>
          {content.band_name && (
            <p className="text-xs text-muted-foreground truncate">{content.band_name}</p>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={closeMiniPlayer}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Video/Audio Player */}
      {!isMinimized && (
        <div className="relative bg-black">
          {isVideo ? (
            <AspectRatio ratio={16 / 9}>
              <video
                ref={videoRef}
                src={mediaUrl || ''}
                poster={content.thumbnail_url || ''}
                className="w-full h-full object-contain"
                onClick={togglePlayPause}
              />
            </AspectRatio>
          ) : (
            <div className="h-32 flex items-center justify-center bg-gradient-to-br from-primary/20 via-purple-500/20 to-pink-500/20">
              {content.thumbnail_url ? (
                <img 
                  src={content.thumbnail_url} 
                  alt={content.title}
                  className="w-full h-full object-cover opacity-50"
                />
              ) : (
                <div className="text-center">
                  <Play className="w-12 h-12 text-white/50 mx-auto" />
                </div>
              )}
            </div>
          )}
          <audio ref={audioRef} src={mediaUrl || ''} />

          {/* Play/Pause Overlay */}
          {!isPlaying && (
            <div 
              className="absolute inset-0 flex items-center justify-center cursor-pointer"
              onClick={togglePlayPause}
            >
              <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors">
                <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      <div className="p-3 space-y-2">
        {/* Progress Bar */}
        <div>
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <Button
            size="icon"
            variant="ghost"
            onClick={togglePlayPause}
            className="h-8 w-8"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <div className="flex items-center gap-2 flex-1 max-w-32">
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleMute}
              className="h-8 w-8"
            >
              {isMuted ? (
                <VolumeX className="h-3 w-3" />
              ) : (
                <Volume2 className="h-3 w-3" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};