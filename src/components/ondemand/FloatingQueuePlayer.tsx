import { useQueuePlayer, QueueItem } from "@/contexts/QueuePlayerContext";
import { Button } from "@/components/ui/button";
import { 
  X, ChevronUp, ChevronDown, Play, Pause, SkipBack, SkipForward, 
  Video, Music, Film, Mic2, Clapperboard, ListMusic
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const formatTime = (s: number) => {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

const categoryTabs = [
  { value: "all", label: "Todo", icon: ListMusic },
  { value: "video_musical_vivo", label: "En Vivo", icon: Video },
  { value: "video_clip", label: "Clips", icon: Video },
  { value: "podcast", label: "Podcast", icon: Mic2 },
  { value: "documental", label: "Doc", icon: Clapperboard },
  { value: "corto", label: "Cortos", icon: Film },
  { value: "pelicula", label: "Films", icon: Film },
];

export const FloatingQueuePlayer = () => {
  const {
    queue, currentIndex, isOpen, isPlaying, isExpanded,
    currentTime, totalDuration, activeCategory,
    setActiveCategory, togglePlay, playNext, playPrev,
    closePlayer, setExpanded, playItem, seekTo,
  } = useQueuePlayer();

  if (!isOpen || queue.length === 0) return null;

  const current = queue[currentIndex];
  if (!current) return null;

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const filteredQueue = activeCategory === 'all' 
    ? queue 
    : queue.filter(q => q.content_type === activeCategory);

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300",
      isExpanded ? "top-0" : ""
    )}>
      {/* Expanded overlay */}
      {isExpanded && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-xl flex flex-col">
          {/* Expanded header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <h2 className="text-lg font-semibold text-foreground">Cola de reproducción</h2>
            <Button size="icon" variant="ghost" onClick={() => setExpanded(false)}>
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>

          {/* Now playing in expanded */}
          <div className="p-6 flex items-center gap-4 border-b border-border/30">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted/20 flex-shrink-0">
              {current.thumbnail_url ? (
                <img src={current.thumbnail_url} alt={current.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {current.band_name && (
                <p className="text-sm font-semibold text-foreground truncate">{current.band_name}</p>
              )}
              <p className="text-sm text-muted-foreground truncate">{current.title}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">{formatTime(currentTime)}</span>
                <div className="flex-1 h-1 bg-muted/30 rounded-full cursor-pointer" 
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = (e.clientX - rect.left) / rect.width;
                    seekTo(pct * totalDuration);
                  }}>
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{formatTime(totalDuration)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={playPrev} disabled={currentIndex === 0} className="h-9 w-9">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button size="icon" onClick={togglePlay} className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90">
                {isPlaying ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5 ml-0.5" fill="currentColor" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={playNext} disabled={currentIndex >= queue.length - 1} className="h-9 w-9">
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 px-4 pt-3 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {categoryTabs.map(tab => {
              const Icon = tab.icon;
              const count = tab.value === 'all' ? queue.length : queue.filter(q => q.content_type === tab.value).length;
              if (count === 0 && tab.value !== 'all') return null;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveCategory(tab.value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all",
                    activeCategory === tab.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                  <span className="opacity-60">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Queue list */}
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-1 py-2">
              {filteredQueue.map((item, idx) => {
                const globalIdx = queue.findIndex(q => q.id === item.id);
                const isCurrent = globalIdx === currentIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => playItem(item)}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all",
                      isCurrent 
                        ? "bg-primary/10 border border-primary/30" 
                        : "hover:bg-card/50"
                    )}
                  >
                    <div className="w-12 h-8 rounded overflow-hidden bg-muted/20 flex-shrink-0 relative">
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}
                      {isCurrent && isPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="flex gap-0.5">
                            <span className="w-0.5 h-3 bg-primary animate-pulse rounded-full" />
                            <span className="w-0.5 h-3 bg-primary animate-pulse rounded-full" style={{ animationDelay: '150ms' }} />
                            <span className="w-0.5 h-3 bg-primary animate-pulse rounded-full" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm truncate", isCurrent ? "text-primary font-medium" : "text-foreground")}>
                        {item.band_name || item.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.band_name ? item.title : ''}
                      </p>
                    </div>
                    {item.duration && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">{formatTime(item.duration)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Collapsed mini bar */}
      {!isExpanded && (
        <div className="bg-card/95 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          {/* Progress bar */}
          <div className="h-0.5 bg-muted/20 cursor-pointer" 
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              seekTo(pct * totalDuration);
            }}>
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>

          <div className="flex items-center gap-3 px-4 py-2">
            {/* Thumbnail */}
            <div className="w-10 h-10 rounded overflow-hidden bg-muted/20 flex-shrink-0">
              {current.thumbnail_url ? (
                <img src={current.thumbnail_url} alt={current.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">
                {current.band_name || current.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {current.band_name ? current.title : formatTime(currentTime)}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={playPrev} disabled={currentIndex === 0} className="h-8 w-8">
                <SkipBack className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" onClick={togglePlay} className="h-9 w-9 rounded-full bg-primary hover:bg-primary/90">
                {isPlaying ? <Pause className="h-4 w-4" fill="currentColor" /> : <Play className="h-4 w-4 ml-0.5" fill="currentColor" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={playNext} disabled={currentIndex >= queue.length - 1} className="h-8 w-8">
                <SkipForward className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Expand */}
            <Button size="icon" variant="ghost" onClick={() => setExpanded(true)} className="h-8 w-8">
              <ChevronUp className="h-4 w-4" />
            </Button>

            {/* Close */}
            <Button size="icon" variant="ghost" onClick={closePlayer} className="h-8 w-8 hover:text-destructive">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
