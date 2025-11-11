import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { useAuth } from "@/hooks/useAuth";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Video, ArrowLeft, Trash2, Loader2 } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
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

interface PlaylistItem {
  id: string;
  content_id: string;
  order_index: number;
  added_at: string;
  content: {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    duration: number | null;
    band_name: string | null;
    content_type: string;
  };
}

const PlaylistDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { playlists, getPlaylistItems, removeFromPlaylist } = usePlaylists();
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingItem, setDeletingItem] = useState<PlaylistItem | null>(null);

  const playlist = playlists.find(p => p.id === id);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (id) {
      loadPlaylistItems();
    }
  }, [user, id, navigate]);

  const loadPlaylistItems = async () => {
    if (!id) return;
    setLoading(true);
    const data = await getPlaylistItems(id);
    setItems(data as PlaylistItem[]);
    setLoading(false);
  };

  const handleRemoveItem = async () => {
    if (!deletingItem || !id) return;
    const success = await removeFromPlaylist(id, deletingItem.content_id);
    if (success) {
      await loadPlaylistItems();
    }
    setDeletingItem(null);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getContentIcon = () => <Video className="w-5 h-5" />;

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      
      <div className="relative z-10">
        <Header />
        
        <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              className="mb-4"
              onClick={() => navigate('/playlists')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Playlists
            </Button>
            
            {playlist && (
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {playlist.name}
                </h1>
                {playlist.description && (
                  <p className="text-lg text-muted-foreground mb-2">
                    {playlist.description}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {items.length} video{items.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary/20 flex items-center justify-center">
                <Video className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Playlist vacía</h3>
              <p className="text-muted-foreground mb-6">
                Agrega videos a esta playlist desde la sección On Demand
              </p>
              <Button onClick={() => navigate('/on-demand')}>
                Explorar Videos
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <Card 
                  key={item.id}
                  className="group overflow-hidden border-border bg-card/30 backdrop-blur-sm hover:bg-card/60 transition-all"
                >
                  {/* Thumbnail */}
                  <div 
                    className="relative overflow-hidden bg-secondary/20 cursor-pointer"
                    onClick={() => navigate(`/video/${item.content.id}`)}
                  >
                    <AspectRatio ratio={16 / 9}>
                      {item.content.thumbnail_url ? (
                        <img
                          src={item.content.thumbnail_url}
                          alt={item.content.title}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary/30">
                          {getContentIcon()}
                        </div>
                      )}
                    </AspectRatio>

                    {/* Remove Button */}
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/80 hover:bg-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingItem(item);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    {/* Duration Badge */}
                    {item.content.duration && (
                      <Badge className="absolute bottom-2 right-2 bg-black/70 text-white border-none">
                        {formatDuration(item.content.duration)}
                      </Badge>
                    )}

                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Play className="w-12 h-12 text-white" fill="white" />
                    </div>
                  </div>

                  {/* Content Info */}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
                      {item.content.title}
                    </h3>
                    
                    {item.content.band_name && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {item.content.band_name}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
        
        <Footer />
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar video?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar "{deletingItem?.content.title}" de esta playlist?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingItem(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveItem} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlaylistDetail;
