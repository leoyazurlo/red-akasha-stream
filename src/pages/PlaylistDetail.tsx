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
import { Play, Video, ArrowLeft, Trash2, Loader2, GripVertical, Grid3x3, List as ListIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { PlaylistGridView } from "@/components/playlist/PlaylistGridView";
import { PlaylistListView } from "@/components/playlist/PlaylistListView";

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
  const { playlists, getPlaylistItems, removeFromPlaylist, reorderPlaylistItems } = usePlaylists();
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingItem, setDeletingItem] = useState<PlaylistItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('playlist-view-mode');
    return (saved === 'list' ? 'list' : 'grid') as 'grid' | 'list';
  });

  const playlist = playlists.find(p => p.id === id);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    const newItems = arrayMove(items, oldIndex, newIndex);
    
    // Update order_index for all items
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order_index: index,
    }));

    // Optimistically update UI
    setItems(updatedItems);

    // Update in database
    const itemsToUpdate = updatedItems.map(item => ({
      id: item.id,
      order_index: item.order_index,
    }));

    await reorderPlaylistItems(id, itemsToUpdate);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openDeleteDialog = (item: PlaylistItem) => {
    setDeletingItem(item);
    setShowDeleteDialog(true);
  };

  const handleViewModeChange = (value: string) => {
    if (value === 'grid' || value === 'list') {
      setViewMode(value);
      localStorage.setItem('playlist-view-mode', value);
    }
  };

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
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                      {playlist.name}
                    </h1>
                    {playlist.description && (
                      <p className="text-lg text-muted-foreground mb-2">
                        {playlist.description}
                      </p>
                    )}
                  </div>

                  {/* View Mode Toggle */}
                  {items.length > 0 && (
                    <ToggleGroup 
                      type="single" 
                      value={viewMode} 
                      onValueChange={handleViewModeChange}
                      className="border border-border rounded-md"
                    >
                      <ToggleGroupItem value="grid" aria-label="Vista de cuadrícula">
                        <Grid3x3 className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="list" aria-label="Vista de lista">
                        <ListIcon className="h-4 w-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    {items.length} video{items.length !== 1 ? 's' : ''}
                  </p>
                  {items.length > 0 && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <GripVertical className="h-4 w-4" />
                      Arrastra los videos para reordenarlos
                    </p>
                  )}
                </div>
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((item) => (
                      <PlaylistGridView
                        key={item.id}
                        item={item}
                        onRemove={openDeleteDialog}
                        onClick={(contentId) => navigate(`/video/${contentId}`)}
                        formatDuration={formatDuration}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <PlaylistListView
                        key={item.id}
                        item={item}
                        index={index}
                        onRemove={openDeleteDialog}
                        onClick={(contentId) => navigate(`/video/${contentId}`)}
                        formatDuration={formatDuration}
                      />
                    ))}
                  </div>
                )}
              </SortableContext>
            </DndContext>
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
