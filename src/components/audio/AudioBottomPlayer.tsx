import { useQueuePlayer } from "@/contexts/QueuePlayerContext";
import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat,
  Volume2, VolumeX, Heart, ListMusic, Music,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";

const formatTime = (s: number) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export const AudioBottomPlayer = () => {
  const {
    queue, currentIndex, isOpen, isPlaying, currentTime, totalDuration,
    togglePlay, playNext, playPrev, seekTo, videoRef, setExpanded,
  } = useQueuePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<"off" | "all" | "one">("off");

  const current = queue[currentIndex];

  // Volume sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = muted ? 0 : volume / 100;
      videoRef.current.muted = muted;
    }
  }, [volume, muted, videoRef]);

  // Repeat logic
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loop = repeat === "one";
    }
  }, [repeat, videoRef]);

  const handleVolumeToggle = useCallback(() => {
    setMuted((prev) => !prev);
  }, []);

  if (!isOpen || !current) return null;

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border h-20 flex items-center px-4 gap-4">
      {/* Left: Track info */}
      <div className="flex items-center gap-3 w-72 flex-shrink-0">
        <div className="w-14 h-14 rounded-md overflow-hidden bg-muted/30 flex-shrink-0">
          {current.thumbnail_url ? (
            <img
              src={current.thumbnail_url}
              alt={current.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {current.title}
          </p>
          {current.band_name && (
            <p className="text-xs text-muted-foreground truncate">
              {current.band_name}
            </p>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 flex-shrink-0"
          onClick={() => toggleFavorite(current.id)}
        >
          <Heart
            className={cn(
              "h-4 w-4",
              isFavorite(current.id)
                ? "text-primary fill-primary"
                : "text-muted-foreground"
            )}
          />
        </Button>
      </div>

      {/* Center: Controls + progress */}
      <div className="flex-1 flex flex-col items-center gap-1 max-w-2xl mx-auto">
        {/* Playback controls */}
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShuffle(!shuffle)}
            className={cn(
              "h-8 w-8",
              shuffle ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Shuffle className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={playPrev}
            disabled={currentIndex === 0}
            className="h-8 w-8 text-foreground"
          >
            <SkipBack className="h-4 w-4" fill="currentColor" />
          </Button>
          <Button
            size="icon"
            onClick={togglePlay}
            className="h-9 w-9 rounded-full bg-foreground text-background hover:bg-foreground/90 hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" fill="currentColor" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" fill="currentColor" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={playNext}
            disabled={currentIndex >= queue.length - 1}
            className="h-8 w-8 text-foreground"
          >
            <SkipForward className="h-4 w-4" fill="currentColor" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() =>
              setRepeat((prev) =>
                prev === "off" ? "all" : prev === "all" ? "one" : "off"
              )
            }
            className={cn(
              "h-8 w-8 relative",
              repeat !== "off" ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Repeat className="h-4 w-4" />
            {repeat === "one" && (
              <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold text-primary">
                1
              </span>
            )}
          </Button>
        </div>

        {/* Progress bar */}
        <div className="w-full flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground w-10 text-right tabular-nums">
            {formatTime(currentTime)}
          </span>
          <div
            className="flex-1 h-1 bg-muted/40 rounded-full cursor-pointer group relative"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              seekTo(pct * totalDuration);
            }}
          >
            <div
              className="h-full bg-foreground rounded-full transition-all relative group-hover:bg-primary"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md" />
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground w-10 tabular-nums">
            {formatTime(totalDuration)}
          </span>
        </div>
      </div>

      {/* Right: Volume + queue */}
      <div className="flex items-center gap-2 w-48 justify-end flex-shrink-0">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setExpanded(true)}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Cola de reproducción"
        >
          <ListMusic className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleVolumeToggle}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          {muted || volume === 0 ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
        <Slider
          value={[muted ? 0 : volume]}
          max={100}
          step={1}
          onValueChange={([v]) => {
            setVolume(v);
            if (v > 0 && muted) setMuted(false);
          }}
          className="w-24"
        />
      </div>
    </div>
  );
};
