import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Link2,
  Scissors,
  BookOpen,
  Music,
  Plus,
  Trash2,
  Copy,
  Play,
  Clock,
} from "lucide-react";

interface Chapter {
  id: string;
  timestamp_seconds: number;
  title: string;
  created_by: string;
}

interface LyricLine {
  id: string;
  timestamp_seconds: number;
  text: string;
}

interface VideoSocialFeaturesProps {
  contentId: string;
  uploaderId: string;
  currentTime: number;
  onSeek: (time: number) => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export const VideoSocialFeatures = ({
  contentId,
  uploaderId,
  currentTime,
  onSeek,
}: VideoSocialFeaturesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Chapters
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterTime, setNewChapterTime] = useState("");

  // Lyrics
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [newLyricText, setNewLyricText] = useState("");
  const [newLyricTime, setNewLyricTime] = useState("");
  const [activeLyricId, setActiveLyricId] = useState<string | null>(null);

  // Clip
  const [clipStart, setClipStart] = useState<number | null>(null);
  const [clipEnd, setClipEnd] = useState<number | null>(null);

  const isOwner = user?.id === uploaderId;

  // Fetch chapters & lyrics
  useEffect(() => {
    fetchChapters();
    fetchLyrics();
  }, [contentId]);

  // Track active lyric
  useEffect(() => {
    if (lyrics.length === 0) return;
    const sorted = [...lyrics].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);
    let active: string | null = null;
    for (const line of sorted) {
      if (currentTime >= line.timestamp_seconds) {
        active = line.id;
      }
    }
    setActiveLyricId(active);
  }, [currentTime, lyrics]);

  const fetchChapters = async () => {
    const { data } = await supabase
      .from("content_chapters")
      .select("*")
      .eq("content_id", contentId)
      .order("timestamp_seconds", { ascending: true });
    setChapters((data as Chapter[]) || []);
  };

  const fetchLyrics = async () => {
    const { data } = await supabase
      .from("content_lyrics")
      .select("*")
      .eq("content_id", contentId)
      .order("timestamp_seconds", { ascending: true });
    setLyrics((data as LyricLine[]) || []);
  };

  const addChapter = async () => {
    if (!user || !newChapterTitle.trim()) return;
    const time = newChapterTime ? parseTimeInput(newChapterTime) : Math.floor(currentTime);
    const { error } = await supabase.from("content_chapters").insert({
      content_id: contentId,
      timestamp_seconds: time,
      title: newChapterTitle.trim(),
      created_by: user.id,
    });
    if (!error) {
      setNewChapterTitle("");
      setNewChapterTime("");
      fetchChapters();
      toast({ title: "Capítulo agregado" });
    }
  };

  const deleteChapter = async (id: string) => {
    await supabase.from("content_chapters").delete().eq("id", id);
    fetchChapters();
  };

  const addLyric = async () => {
    if (!user || !newLyricText.trim()) return;
    const time = newLyricTime ? parseTimeInput(newLyricTime) : currentTime;
    const { error } = await supabase.from("content_lyrics").insert({
      content_id: contentId,
      timestamp_seconds: time,
      text: newLyricText.trim(),
      created_by: user.id,
    });
    if (!error) {
      setNewLyricText("");
      setNewLyricTime("");
      fetchLyrics();
    }
  };

  const deleteLyric = async (id: string) => {
    await supabase.from("content_lyrics").delete().eq("id", id);
    fetchLyrics();
  };

  const parseTimeInput = (input: string): number => {
    const parts = input.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return Number(input) || 0;
  };

  // Share with timestamp
  const shareWithTimestamp = useCallback(() => {
    const t = Math.floor(currentTime);
    const url = `${window.location.origin}/video/${contentId}?t=${t}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Enlace copiado", description: `Compartido en ${formatTime(t)}` });
  }, [contentId, currentTime, toast]);

  // Share clip
  const shareClip = useCallback(() => {
    if (clipStart === null || clipEnd === null) return;
    const url = `${window.location.origin}/video/${contentId}?start=${Math.floor(clipStart)}&end=${Math.floor(clipEnd)}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Clip copiado",
      description: `${formatTime(clipStart)} → ${formatTime(clipEnd)}`,
    });
    setClipStart(null);
    setClipEnd(null);
  }, [contentId, clipStart, clipEnd, toast]);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border">
      <Tabs defaultValue="timestamp" className="w-full">
        <CardHeader className="pb-2">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="timestamp" className="text-xs gap-1 py-1.5">
              <Link2 className="w-3 h-3" /> Timestamp
            </TabsTrigger>
            <TabsTrigger value="clip" className="text-xs gap-1 py-1.5">
              <Scissors className="w-3 h-3" /> Clip
            </TabsTrigger>
            <TabsTrigger value="chapters" className="text-xs gap-1 py-1.5">
              <BookOpen className="w-3 h-3" /> Capítulos
            </TabsTrigger>
            <TabsTrigger value="lyrics" className="text-xs gap-1 py-1.5">
              <Music className="w-3 h-3" /> Letras
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent className="pt-2">
          {/* Timestamp Share */}
          <TabsContent value="timestamp" className="mt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Comparte el video en el momento actual ({formatTime(currentTime)})
            </p>
            <Button onClick={shareWithTimestamp} size="sm" className="gap-2">
              <Copy className="w-3.5 h-3.5" />
              Copiar enlace con timestamp
            </Button>
          </TabsContent>

          {/* Clip */}
          <TabsContent value="clip" className="mt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Selecciona inicio y fin para crear un clip compartible
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClipStart(currentTime)}
                className="gap-1"
              >
                <Clock className="w-3 h-3" />
                Inicio {clipStart !== null && `(${formatTime(clipStart)})`}
              </Button>
              <span className="text-muted-foreground">→</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClipEnd(currentTime)}
                className="gap-1"
              >
                <Clock className="w-3 h-3" />
                Fin {clipEnd !== null && `(${formatTime(clipEnd)})`}
              </Button>
              <Button
                size="sm"
                onClick={shareClip}
                disabled={clipStart === null || clipEnd === null}
                className="gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                Copiar clip
              </Button>
            </div>
          </TabsContent>

          {/* Chapters */}
          <TabsContent value="chapters" className="mt-0 space-y-3">
            {chapters.length > 0 ? (
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-1">
                  {chapters.map((ch) => (
                    <div
                      key={ch.id}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-secondary/50 group transition-colors",
                        currentTime >= ch.timestamp_seconds &&
                          (chapters.findIndex((c) => c.id === ch.id) === chapters.length - 1 ||
                            currentTime < chapters[chapters.findIndex((c) => c.id === ch.id) + 1]?.timestamp_seconds)
                          ? "bg-primary/10 border-l-2 border-primary"
                          : ""
                      )}
                      onClick={() => onSeek(ch.timestamp_seconds)}
                    >
                      <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
                        {formatTime(ch.timestamp_seconds)}
                      </Badge>
                      <span className="text-sm flex-1 truncate">{ch.title}</span>
                      {isOwner && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChapter(ch.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay capítulos aún
              </p>
            )}
            {(isOwner || user) && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="0:00"
                  value={newChapterTime}
                  onChange={(e) => setNewChapterTime(e.target.value)}
                  className="w-16 text-xs h-8"
                />
                <Input
                  placeholder="Título del capítulo"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  className="flex-1 text-xs h-8"
                  onKeyDown={(e) => e.key === "Enter" && addChapter()}
                />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={addChapter} disabled={!newChapterTitle.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Lyrics */}
          <TabsContent value="lyrics" className="mt-0 space-y-3">
            {lyrics.length > 0 ? (
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-1 text-center">
                  {lyrics.map((line) => (
                    <p
                      key={line.id}
                      className={cn(
                        "text-sm py-1 px-2 rounded cursor-pointer transition-all duration-300 group relative",
                        activeLyricId === line.id
                          ? "text-primary font-semibold scale-105 bg-primary/5"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => onSeek(line.timestamp_seconds)}
                    >
                      {line.text}
                      {isOwner && (
                        <button
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLyric(line.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      )}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay letras disponibles
              </p>
            )}
            {isOwner && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="0:00"
                  value={newLyricTime}
                  onChange={(e) => setNewLyricTime(e.target.value)}
                  className="w-16 text-xs h-8"
                />
                <Input
                  placeholder="Línea de letra..."
                  value={newLyricText}
                  onChange={(e) => setNewLyricText(e.target.value)}
                  className="flex-1 text-xs h-8"
                  onKeyDown={(e) => e.key === "Enter" && addLyric()}
                />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={addLyric} disabled={!newLyricText.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};
