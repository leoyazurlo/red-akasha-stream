import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2,
  X,
  SkipBack,
  SkipForward,
  Music2
} from "lucide-react";
import { useMiniPlayer } from "@/contexts/MiniPlayerContext";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export const MiniPlayer = () => {
  const { 
    isOpen, 
    content, 
    closeMiniPlayer, 
    isMinimized, 
    setIsMinimized,
    isPlaying,
    setIsPlaying,
    currentTime,
    duration,
    currentTrackIndex,
    setCurrentTrackIndex,
    audioRef
  } = useMiniPlayer();
  
  const [volume, setVolume] = React.useState(1);
  const [isMuted, setIsMuted] = React.useState(false);

  const isVideo = content?.content_type !== 'podcast' && content?.content_type !== 'profile_audio' && content?.video_url;
  const hasPlaylist = content?.playlist && content.playlist.length > 0;
  const currentTrack = hasPlaylist ? content.playlist[currentTrackIndex] : null;

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
  };

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;

    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const playNext = () => {
    if (hasPlaylist && currentTrackIndex < content.playlist!.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    }
  };

  const playPrevious = () => {
    if (hasPlaylist && currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
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
      className={`fixed z-50 bg-card/95 backdrop-blur-xl border-primary/20 shadow-glow transition-all duration-300 ${
        isMinimized 
          ? 'bottom-4 right-4 w-72' 
          : 'bottom-4 right-4 w-96'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-primary/10">
        {/* Avatar/Thumbnail */}
        {content.profileAvatar || content.thumbnail_url ? (
          <Avatar className="w-10 h-10 border border-primary/20">
            <AvatarImage src={content.profileAvatar || content.thumbnail_url || ''} />
            <AvatarFallback className="bg-primary/20">
              <Music2 className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
            <Music2 className="w-5 h-5 text-primary-foreground" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {currentTrack?.title || content.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {content.profileName || content.band_name || 'Reproduciendo'}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-7 w-7"
          >
            {isMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={closeMiniPlayer}
            className="h-7 w-7 hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Playlist (when expanded) */}
      {!isMinimized && hasPlaylist && (
        <div className="max-h-32 overflow-y-auto p-2 border-b border-primary/10">
          {content.playlist!.map((track, index) => (
            <button
              key={track.id}
              onClick={() => setCurrentTrackIndex(index)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                currentTrackIndex === index 
                  ? 'bg-primary/20 text-primary' 
                  : 'hover:bg-muted/50 text-muted-foreground'
              }`}
            >
              <span className="font-medium">{index + 1}.</span> {track.title}
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="p-3 space-y-3">
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
          <div className="flex items-center gap-1">
            {hasPlaylist && (
              <Button
                size="icon"
                variant="ghost"
                onClick={playPrevious}
                disabled={currentTrackIndex === 0}
                className="h-8 w-8"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              size="icon"
              onClick={togglePlayPause}
              className="h-10 w-10 rounded-full bg-gradient-primary text-primary-foreground hover:shadow-glow"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            
            {hasPlaylist && (
              <Button
                size="icon"
                variant="ghost"
                onClick={playNext}
                disabled={currentTrackIndex === content.playlist!.length - 1}
                className="h-8 w-8"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-28 ml-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleMute}
              className="h-7 w-7"
            >
              {isMuted ? (
                <VolumeX className="h-3.5 w-3.5" />
              ) : (
                <Volume2 className="h-3.5 w-3.5" />
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