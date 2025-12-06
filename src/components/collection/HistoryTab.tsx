import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Play, Video, Trash2, ListPlus, RotateCcw } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { AddToPlaylistDialog } from "@/components/AddToPlaylistDialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format, isToday, isYesterday, isThisWeek } from "date-fns";
import { es } from "date-fns/locale";

interface HistoryItem {
  id: string;
  content_id: string;
  last_position: number;
  duration: number | null;
  completed: boolean;
  last_watched_at: string;
  content: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    duration: number | null;
    band_name: string | null;
    content_type: string;
  };
}

export const HistoryTab = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('playback_history')
        .select(`
          id,
          content_id,
          last_position,
          duration,
          completed,
          last_watched_at,
          content:content_uploads (
            id,
            title,
            thumbnail_url,
            duration,
            band_name,
            content_type
          )
        `)
        .eq('user_id', user.id)
        .order('last_watched_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter out items where content is null (deleted content)
      const validHistory = (data || []).filter((item: any) => item.content !== null) as HistoryItem[];
      setHistory(validHistory);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('playback_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setHistory([]);
      toast({
        title: "Historial borrado",
        description: "Tu historial de reproducción ha sido eliminado.",
      });
    } catch (error) {
      console.error('Error clearing history:', error);
      toast({
        title: "Error",
        description: "No se pudo borrar el historial.",
        variant: "destructive",
      });
    } finally {
      setShowClearDialog(false);
    }
  };

  const removeFromHistory = async (historyId: string) => {
    try {
      const { error } = await supabase
        .from('playback_history')
        .delete()
        .eq('id', historyId);

      if (error) throw error;

      setHistory(prev => prev.filter(item => item.id !== historyId));
    } catch (error) {
      console.error('Error removing from history:', error);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatWatchedDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Hoy";
    if (isYesterday(date)) return "Ayer";
    if (isThisWeek(date)) return format(date, "EEEE", { locale: es });
    return format(date, "d 'de' MMMM", { locale: es });
  };

  const getProgress = (item: HistoryItem) => {
    const duration = item.duration || item.content?.duration || 0;
    if (!duration) return 0;
    return Math.min((item.last_position / duration) * 100, 100);
  };

  const handleContentClick = (contentId: string) => {
    navigate(`/video/${contentId}`);
  };

  // Group history by date
  const groupedHistory = history.reduce((groups, item) => {
    const date = formatWatchedDate(item.last_watched_at);
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
    return groups;
  }, {} as Record<string, HistoryItem[]>);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-40 h-24 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Historial de Reproducción</h2>
          <p className="text-muted-foreground text-sm">
            {history.length} video{history.length !== 1 ? 's' : ''} reproducido{history.length !== 1 ? 's' : ''}
          </p>
        </div>
        {history.length > 0 && (
          <Button 
            variant="outline" 
            onClick={() => setShowClearDialog(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Borrar Historial
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary/20 flex items-center justify-center">
            <Clock className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Tu historial está vacío</h3>
          <p className="text-muted-foreground mb-6">
            Los videos que reproduzcas aparecerán aquí
          </p>
          <Button onClick={() => navigate('/on-demand')}>
            Explorar Contenido
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedHistory).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wide">{date}</h3>
              <div className="space-y-3">
                {items.map((item) => (
                  <Card 
                    key={item.id}
                    className="group overflow-hidden border-border bg-card/30 backdrop-blur-sm hover:bg-card/60 transition-all"
                  >
                    <div className="flex">
                      {/* Thumbnail */}
                      <div 
                        className="relative w-40 sm:w-48 flex-shrink-0 cursor-pointer"
                        onClick={() => handleContentClick(item.content_id)}
                      >
                        <AspectRatio ratio={16 / 9}>
                          {item.content?.thumbnail_url ? (
                            <img
                              src={item.content.thumbnail_url}
                              alt={item.content.title}
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                              <Video className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </AspectRatio>
                        
                        {/* Duration Badge */}
                        {item.content?.duration && (
                          <Badge className="absolute bottom-2 right-2 bg-black/70 text-white border-none text-xs">
                            {formatDuration(item.content.duration)}
                          </Badge>
                        )}

                        {/* Progress Bar */}
                        {!item.completed && getProgress(item) > 0 && (
                          <div className="absolute bottom-0 left-0 right-0">
                            <Progress value={getProgress(item)} className="h-1 rounded-none bg-black/50" />
                          </div>
                        )}

                        {/* Play Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          {item.completed ? (
                            <RotateCcw className="w-8 h-8 text-white" />
                          ) : (
                            <Play className="w-8 h-8 text-white" fill="white" />
                          )}
                        </div>
                      </div>

                      {/* Content Info */}
                      <CardContent className="flex-1 p-3 flex flex-col justify-between">
                        <div>
                          <h3 
                            className="font-medium text-sm line-clamp-2 mb-1 cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleContentClick(item.content_id)}
                          >
                            {item.content?.title}
                          </h3>
                          
                          {item.content?.band_name && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {item.content.band_name}
                            </p>
                          )}

                          {/* Progress Text */}
                          {!item.completed && item.last_position > 0 && (
                            <p className="text-xs text-primary mt-1">
                              {formatDuration(item.last_position)} reproducidos
                            </p>
                          )}
                          {item.completed && (
                            <p className="text-xs text-green-500 mt-1">
                              ✓ Completado
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedContentId(item.content_id);
                              setShowAddToPlaylist(true);
                            }}
                          >
                            <ListPlus className="h-4 w-4 mr-1" />
                            Playlist
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromHistory(item.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add to Playlist Dialog */}
      {selectedContentId && (
        <AddToPlaylistDialog
          open={showAddToPlaylist}
          onOpenChange={setShowAddToPlaylist}
          contentId={selectedContentId}
        />
      )}

      {/* Clear History Confirmation */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Borrar todo el historial?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará todo tu historial de reproducción.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={clearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Borrar Todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
