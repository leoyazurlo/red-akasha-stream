import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueuePlayer } from "@/contexts/QueuePlayerContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, Mic2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lyric {
  id: string;
  text: string;
  timestamp_seconds: number;
}

interface AudioLyricsPanelProps {
  open: boolean;
  onClose: () => void;
}

export const AudioLyricsPanel = ({ open, onClose }: AudioLyricsPanelProps) => {
  const { queue, currentIndex, currentTime } = useQueuePlayer();
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [loading, setLoading] = useState(false);
  const activeRef = useRef<HTMLParagraphElement>(null);
  const current = queue[currentIndex];

  useEffect(() => {
    if (!current?.id) {
      setLyrics([]);
      return;
    }
    const fetchLyrics = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("content_lyrics")
        .select("id, text, timestamp_seconds")
        .eq("content_id", current.id)
        .order("timestamp_seconds", { ascending: true });
      setLyrics((data as Lyric[]) || []);
      setLoading(false);
    };
    fetchLyrics();
  }, [current?.id]);

  // Auto-scroll to active lyric
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentTime]);

  const getActiveLyricIndex = () => {
    if (lyrics.length === 0) return -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].timestamp_seconds) return i;
    }
    return -1;
  };

  const activeIndex = getActiveLyricIndex();

  if (!open) return null;

  return (
    <div className="fixed right-0 top-16 bottom-20 w-80 bg-card/95 backdrop-blur-lg border-l border-border z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2 text-foreground">
          <Mic2 className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Letras</span>
        </div>
        <Button size="icon" variant="ghost" onClick={onClose} className="h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : lyrics.length === 0 ? (
            <div className="text-center py-12">
              <Mic2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No hay letras disponibles para esta canción
              </p>
            </div>
          ) : (
            lyrics.map((lyric, i) => (
              <p
                key={lyric.id}
                ref={i === activeIndex ? activeRef : undefined}
                className={cn(
                  "text-lg leading-relaxed transition-all duration-300 cursor-pointer",
                  i === activeIndex
                    ? "text-primary font-bold scale-105 origin-left"
                    : i < activeIndex
                    ? "text-muted-foreground/50"
                    : "text-muted-foreground/70"
                )}
              >
                {lyric.text}
              </p>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Current track info */}
      {current && (
        <div className="p-3 border-t border-border/50 bg-secondary/30">
          <p className="text-xs text-muted-foreground truncate">
            {current.title}
            {current.band_name && ` — ${current.band_name}`}
          </p>
        </div>
      )}
    </div>
  );
};
