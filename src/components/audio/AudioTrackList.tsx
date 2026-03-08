import { useQueuePlayer, QueueItem } from "@/contexts/QueuePlayerContext";
import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import { Heart, Play, Pause, Clock, Music, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AudioSearchFilters } from "./AudioSearchFilters";
import { AudioShareButton } from "./AudioShareButton";
import { AudioEqualizer } from "./AudioEqualizer";
import { useState, useMemo } from "react";

interface AudioContent {
  id: string;
  title: string;
  band_name: string | null;
  audio_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  content_type: string;
  duration: number | null;
  views_count: number | null;
  audio_duration_seconds: number | null;
}

interface AudioTrackListProps {
  tracks: AudioContent[];
  title: string;
  subtitle?: string;
  headerImage?: React.ReactNode;
  loading?: boolean;
}

const formatTime = (s: number | null) => {
  if (!s || isNaN(s)) return "--:--";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const formatNumber = (n: number | null) => {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
};

export const AudioTrackList = ({
  tracks,
  title,
  subtitle,
  headerImage,
  loading,
}: AudioTrackListProps) => {
  const { playItem, setQueue, queue, currentIndex, isPlaying, togglePlay } =
    useQueuePlayer();
  const { isFavorite, toggleFavorite } = useFavorites();

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  // Filter and sort tracks
  const filteredTracks = useMemo(() => {
    let result = tracks;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.band_name && t.band_name.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (activeCategory !== "all") {
      result = result.filter((t) => t.content_type === activeCategory);
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (b.views_count || 0) - (a.views_count || 0);
        case "alphabetical":
          return a.title.localeCompare(b.title);
        case "duration":
          return (
            (b.audio_duration_seconds || b.duration || 0) -
            (a.audio_duration_seconds || a.duration || 0)
          );
        default:
          return 0; // already ordered by created_at desc
      }
    });

    return result;
  }, [tracks, searchQuery, activeCategory, sortBy]);

  const toQueueItem = (t: AudioContent): QueueItem => ({
    id: t.id,
    title: t.title,
    video_url: t.video_url,
    audio_url: t.audio_url,
    thumbnail_url: t.thumbnail_url,
    content_type: t.content_type,
    band_name: t.band_name,
    duration: t.audio_duration_seconds || t.duration,
  });

  const handlePlayAll = () => {
    if (filteredTracks.length === 0) return;
    setQueue(filteredTracks.map(toQueueItem), 0);
  };

  // Radio mode: shuffle similar tracks into queue
  const handleRadioMode = () => {
    if (filteredTracks.length === 0) return;
    const shuffled = [...filteredTracks].sort(() => Math.random() - 0.5);
    setQueue(shuffled.map(toQueueItem), 0);
  };

  const handlePlayTrack = (track: AudioContent, index: number) => {
    const currentItem = queue[currentIndex];
    if (currentItem?.id === track.id) {
      togglePlay();
      return;
    }
    setQueue(filteredTracks.map(toQueueItem), index);
  };

  const isCurrentTrack = (id: string) => {
    const current = queue[currentIndex];
    return current?.id === id;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header section */}
      <div className="p-6 pb-4 flex items-end gap-6 bg-gradient-to-b from-secondary/40 to-transparent">
        {headerImage || (
          <div className="w-48 h-48 rounded-lg bg-gradient-to-br from-primary/40 to-accent/40 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Music className="h-16 w-16 text-primary-foreground/80" />
          </div>
        )}
        <div className="min-w-0 pb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Playlist
          </p>
          <h1 className="text-4xl font-bold text-foreground mb-2 leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            {filteredTracks.length} canciones
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div className="px-6 py-3 flex items-center gap-4">
        <Button
          size="icon"
          onClick={handlePlayAll}
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 hover:scale-105 transition-transform shadow-lg"
          disabled={filteredTracks.length === 0}
        >
          <Play className="h-7 w-7 ml-0.5" fill="currentColor" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRadioMode}
          className="gap-2 rounded-full"
          disabled={filteredTracks.length === 0}
        >
          <Radio className="h-4 w-4" />
          Radio
        </Button>
      </div>

      {/* Search & Filters */}
      <AudioSearchFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Track list header */}
      <div className="px-6 grid grid-cols-[40px_1fr_minmax(100px,1fr)_80px_80px] gap-4 items-center py-2 border-b border-border/50 text-xs text-muted-foreground uppercase tracking-wider">
        <span className="text-center">#</span>
        <span>Título</span>
        <span className="hidden md:block">Reproducciones</span>
        <span className="flex items-center justify-end">
          <Clock className="h-4 w-4" />
        </span>
        <span />
      </div>

      {/* Tracks */}
      <ScrollArea className="flex-1">
        <div className="px-6 pb-32">
          {filteredTracks.length === 0 ? (
            <div className="py-16 text-center">
              <Music className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No se encontraron resultados"
                  : "No hay contenido de audio disponible"}
              </p>
            </div>
          ) : (
            filteredTracks.map((track, index) => {
              const playing = isCurrentTrack(track.id);
              const isTrackPlaying = playing && isPlaying;
              return (
                <button
                  key={track.id}
                  onClick={() => handlePlayTrack(track, index)}
                  className={cn(
                    "w-full grid grid-cols-[40px_1fr_minmax(100px,1fr)_80px_80px] gap-4 items-center py-2.5 px-0 rounded-md text-left transition-colors group",
                    playing
                      ? "bg-secondary/50"
                      : "hover:bg-secondary/30"
                  )}
                >
                  {/* Number / playing indicator */}
                  <span className="text-center text-sm">
                    {isTrackPlaying ? (
                      <AudioEqualizer isPlaying={true} size="sm" barCount={4} className="justify-center" />
                    ) : playing ? (
                      <Pause className="h-4 w-4 text-primary mx-auto" />
                    ) : (
                      <span className="text-muted-foreground group-hover:hidden">
                        {index + 1}
                      </span>
                    )}
                    {!playing && (
                      <Play className="h-4 w-4 text-foreground mx-auto hidden group-hover:block" />
                    )}
                  </span>

                  {/* Title + artist */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded bg-muted/30 flex-shrink-0 overflow-hidden">
                      {track.thumbnail_url ? (
                        <img
                          src={track.thumbnail_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-sm truncate",
                          playing
                            ? "text-primary font-medium"
                            : "text-foreground"
                        )}
                      >
                        {track.title}
                      </p>
                      {track.band_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {track.band_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Views */}
                  <span className="text-sm text-muted-foreground hidden md:block">
                    {formatNumber(track.views_count)}
                  </span>

                  {/* Duration */}
                  <span className="text-sm text-muted-foreground text-right">
                    {formatTime(
                      track.audio_duration_seconds || track.duration
                    )}
                  </span>

                  {/* Actions: Favorite + Share */}
                  <span className="flex items-center justify-center gap-1">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(track.id);
                      }}
                    >
                      <Heart
                        className={cn(
                          "h-4 w-4 transition-colors cursor-pointer",
                          isFavorite(track.id)
                            ? "text-primary fill-primary"
                            : "text-muted-foreground/50 opacity-0 group-hover:opacity-100"
                        )}
                      />
                    </span>
                    <AudioShareButton
                      trackId={track.id}
                      title={track.title}
                      artist={track.band_name}
                    />
                  </span>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
