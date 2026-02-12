import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { useAuth } from "@/hooks/useAuth";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useMiniPlayer } from "@/contexts/MiniPlayerContext";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Video, ArrowLeft, Trash2, Loader2, GripVertical, Grid3x3, List as ListIcon, Search, X, Edit3, CheckSquare, Square, Move, Eye, Shuffle, PictureInPicture, Repeat, Repeat1 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";
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
import { OnDemandPlayer } from "@/components/OnDemandPlayer";
import { supabase } from "@/integrations/supabase/client";

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
  const { openMiniPlayer } = useMiniPlayer();
  const { playlists, getPlaylistItems, removeFromPlaylist, removeMultipleFromPlaylist, moveToPlaylist, reorderPlaylistItems } = usePlaylists();
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingItem, setDeletingItem] = useState<PlaylistItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('playlist-view-mode');
    return (saved === 'list' ? 'list' : 'grid') as 'grid' | 'list';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [playerContent, setPlayerContent] = useState<any>(null);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [playedVideos, setPlayedVideos] = useState<Set<number>>(new Set());
  const [repeatMode, setRepeatMode] = useState<'none' | 'all' | 'one'>('none');

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

  const toggleEditMode = () => {
    setEditMode(!editMode);
    setSelectedItems(new Set());
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    setSelectedItems(new Set(filteredItems.map(item => item.id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleBulkDelete = async () => {
    if (!id || selectedItems.size === 0) return;

    const contentIds = filteredItems
      .filter(item => selectedItems.has(item.id))
      .map(item => item.content_id);

    const success = await removeMultipleFromPlaylist(id, contentIds);
    if (success) {
      setSelectedItems(new Set());
      setEditMode(false);
      await loadPlaylistItems();
    }
  };

  const handleBulkMove = async (targetPlaylistId: string) => {
    if (!id || selectedItems.size === 0) return;

    const contentIds = filteredItems
      .filter(item => selectedItems.has(item.id))
      .map(item => item.content_id);

    const success = await moveToPlaylist(id, targetPlaylistId, contentIds);
    if (success) {
      setSelectedItems(new Set());
      setEditMode(false);
      setShowMoveDialog(false);
      await loadPlaylistItems();
    }
  };

  const handlePlayVideo = async (contentId: string, index: number) => {
    try {
      const { data, error } = await supabase
        .from('content_uploads')
        .select('*')
        .eq('id', contentId)
        .single();

      if (error) throw error;

      setPlayerContent(data);
      setCurrentVideoIndex(index);
      setShowPlayer(true);
      
      // Track played videos in shuffle mode
      if (shuffleMode) {
        setPlayedVideos(prev => new Set([...prev, index]));
      }
    } catch (error) {
      console.error('Error loading video:', error);
    }
  };

  const handlePlayInMiniPlayer = async (contentId: string) => {
    try {
      const { data, error } = await supabase
        .from('content_uploads')
        .select('*')
        .eq('id', contentId)
        .single();

      if (error) throw error;

      openMiniPlayer({
        id: data.id,
        title: data.title,
        video_url: data.video_url,
        audio_url: data.audio_url,
        thumbnail_url: data.thumbnail_url,
        content_type: data.content_type,
        band_name: data.band_name,
      });
    } catch (error) {
      console.error('Error loading video for mini player:', error);
    }
  };

  const getRandomUnplayedIndex = () => {
    // Get unplayed videos
    const unplayedIndices = filteredItems
      .map((_, index) => index)
      .filter(index => !playedVideos.has(index) && index !== currentVideoIndex);
    
    // If all videos have been played, reset
    if (unplayedIndices.length === 0) {
      setPlayedVideos(new Set([currentVideoIndex]));
      return filteredItems
        .map((_, index) => index)
        .filter(index => index !== currentVideoIndex)[0];
    }
    
    // Pick random from unplayed
    return unplayedIndices[Math.floor(Math.random() * unplayedIndices.length)];
  };

  const handleNextVideo = () => {
    if (shuffleMode) {
      // Shuffle mode: pick random unplayed video
      const randomIndex = getRandomUnplayedIndex();
      if (randomIndex !== undefined) {
        const nextItem = filteredItems[randomIndex];
        handlePlayVideo(nextItem.content_id, randomIndex);
      } else if (repeatMode === 'all') {
        // If all videos played and repeat all is on, restart
        setPlayedVideos(new Set());
        const randomIndex = getRandomUnplayedIndex();
        if (randomIndex !== undefined) {
          const nextItem = filteredItems[randomIndex];
          handlePlayVideo(nextItem.content_id, randomIndex);
        }
      }
    } else {
      // Normal mode: next in sequence
      if (currentVideoIndex < filteredItems.length - 1) {
        const nextItem = filteredItems[currentVideoIndex + 1];
        handlePlayVideo(nextItem.content_id, currentVideoIndex + 1);
      } else if (repeatMode === 'all') {
        // Loop back to first video
        const firstItem = filteredItems[0];
        handlePlayVideo(firstItem.content_id, 0);
      }
    }
  };

  const handlePreviousVideo = () => {
    if (shuffleMode) {
      // In shuffle mode, previous goes to last played
      const playedArray = Array.from(playedVideos).sort((a, b) => b - a);
      const previousIndex = playedArray.find(idx => idx < currentVideoIndex);
      if (previousIndex !== undefined) {
        const prevItem = filteredItems[previousIndex];
        handlePlayVideo(prevItem.content_id, previousIndex);
      }
    } else {
      // Normal mode: previous in sequence
      if (currentVideoIndex > 0) {
        const prevItem = filteredItems[currentVideoIndex - 1];
        handlePlayVideo(prevItem.content_id, currentVideoIndex - 1);
      } else if (repeatMode === 'all') {
        // Loop back to last video
        const lastItem = filteredItems[filteredItems.length - 1];
        handlePlayVideo(lastItem.content_id, filteredItems.length - 1);
      }
    }
  };

  const toggleShuffleMode = () => {
    setShuffleMode(!shuffleMode);
    setPlayedVideos(new Set([currentVideoIndex]));
  };

  const toggleRepeatMode = () => {
    const modes: Array<'none' | 'all' | 'one'> = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one':
        return <Repeat1 className="h-4 w-4 mr-2" />;
      case 'all':
        return <Repeat className="h-4 w-4 mr-2" />;
      default:
        return <Repeat className="h-4 w-4 mr-2" />;
    }
  };

  const getRepeatLabel = () => {
    switch (repeatMode) {
      case 'one':
        return 'Repetir uno';
      case 'all':
        return 'Repetir todo';
      default:
        return 'Sin repetir';
    }
  };

  // Filter items based on search query
  const filteredItems = searchQuery.trim() === '' 
    ? items 
    : items.filter(item => {
        const query = searchQuery.toLowerCase();
        return (
          item.content.title.toLowerCase().includes(query) ||
          item.content.band_name?.toLowerCase().includes(query) ||
          item.content.description?.toLowerCase().includes(query)
        );
      });

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen relative">
      <CosmicBackground />
      
      <div className="relative z-10">
        <Header />
        
        <main id="main-content" className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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
                    <div className="flex items-center gap-2">
                      <Button
                        variant={shuffleMode ? "default" : "outline"}
                        size="sm"
                        onClick={toggleShuffleMode}
                        className={shuffleMode ? "bg-primary" : ""}
                      >
                        <Shuffle className="h-4 w-4 mr-2" />
                        Aleatorio
                      </Button>

                      <Button
                        variant={repeatMode !== 'none' ? "default" : "outline"}
                        size="sm"
                        onClick={toggleRepeatMode}
                        className={repeatMode !== 'none' ? "bg-primary" : ""}
                      >
                        {getRepeatIcon()}
                        {getRepeatLabel()}
                      </Button>

                      <Button
                        variant={editMode ? "default" : "outline"}
                        size="sm"
                        onClick={toggleEditMode}
                      >
                        {editMode ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </>
                        ) : (
                          <>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Editar
                          </>
                        )}
                      </Button>

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
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <p className="text-sm text-muted-foreground">
                    {items.length} video{items.length !== 1 ? 's' : ''}
                    {searchQuery && filteredItems.length !== items.length && (
                      <span className="ml-2">
                        ({filteredItems.length} {filteredItems.length === 1 ? 'resultado' : 'resultados'})
                      </span>
                    )}
                  </p>
                  {items.length > 0 && !searchQuery && !editMode && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <GripVertical className="h-4 w-4" />
                      Arrastra los videos para reordenarlos
                    </p>
                  )}
                  {editMode && (
                    <p className="text-sm text-primary font-medium">
                      {selectedItems.size} seleccionado{selectedItems.size !== 1 ? 's' : ''}
                    </p>
                  )}
                  {items.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePlayInMiniPlayer(filteredItems[0].content_id)}
                    >
                      <PictureInPicture className="h-4 w-4 mr-2" />
                      Reproducir en minireproductor
                    </Button>
                  )}
                </div>

                {/* Search Bar */}
                {items.length > 0 && (
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar en esta playlist..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {searchQuery && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                        onClick={() => setSearchQuery('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
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
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary/20 flex items-center justify-center">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No se encontraron resultados</h3>
              <p className="text-muted-foreground mb-6">
                No hay videos que coincidan con "{searchQuery}"
              </p>
              <Button onClick={() => setSearchQuery('')} variant="outline">
                Limpiar búsqueda
              </Button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredItems.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredItems.map((item) => (
                      <PlaylistGridView
                        key={item.id}
                        item={item}
                        onRemove={openDeleteDialog}
                        onClick={(contentId) => {
                          const index = filteredItems.findIndex(i => i.content_id === contentId);
                          handlePlayVideo(contentId, index);
                        }}
                        formatDuration={formatDuration}
                        editMode={editMode}
                        isSelected={selectedItems.has(item.id)}
                        onToggleSelect={toggleItemSelection}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredItems.map((item, index) => (
                      <PlaylistListView
                        key={item.id}
                        item={item}
                        index={index}
                        onRemove={openDeleteDialog}
                        onClick={(contentId) => {
                          const idx = filteredItems.findIndex(i => i.content_id === contentId);
                          handlePlayVideo(contentId, idx);
                        }}
                        formatDuration={formatDuration}
                        editMode={editMode}
                        isSelected={selectedItems.has(item.id)}
                        onToggleSelect={toggleItemSelection}
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

      {/* Bulk Actions Bar */}
      {editMode && selectedItems.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <Card className="bg-card/95 backdrop-blur-md border-border shadow-2xl">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={selectedItems.size === filteredItems.length ? deselectAll : selectAll}
                >
                  {selectedItems.size === filteredItems.length ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Deseleccionar todo
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Seleccionar todo
                    </>
                  )}
                </Button>
                
                <div className="h-6 w-px bg-border" />
                
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {selectedItems.size} {selectedItems.size === 1 ? 'video' : 'videos'}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setShowMoveDialog(true)}
                  disabled={playlists.filter(p => p.id !== id).length === 0}
                >
                  <Move className="h-4 w-4 mr-2" />
                  Mover a...
                </Button>
                
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Move to Playlist Dialog */}
      <AlertDialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mover a otra playlist</AlertDialogTitle>
            <AlertDialogDescription>
              Selecciona la playlist de destino para mover {selectedItems.size} video{selectedItems.size !== 1 ? 's' : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto py-4">
            {playlists
              .filter(p => p.id !== id)
              .map((targetPlaylist) => (
                <Button
                  key={targetPlaylist.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleBulkMove(targetPlaylist.id)}
                >
                  <ListIcon className="h-4 w-4 mr-2" />
                  <div className="flex-1 text-left">
                    <p className="font-medium">{targetPlaylist.name}</p>
                    {targetPlaylist.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {targetPlaylist.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">
                    {targetPlaylist.items_count || 0} videos
                  </Badge>
                </Button>
              ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Video Player with Playlist Context */}
      {playerContent && (
        <OnDemandPlayer
          open={showPlayer}
          onOpenChange={setShowPlayer}
          content={playerContent}
          isPurchased={playerContent.is_free}
          playlistContext={{
            items: filteredItems.map(item => ({
              id: item.content_id,
              title: item.content.title
            })),
            currentIndex: currentVideoIndex,
            onNext: repeatMode === 'one' ? undefined : (currentVideoIndex < filteredItems.length - 1 || repeatMode === 'all' ? handleNextVideo : undefined),
            onPrevious: currentVideoIndex > 0 || repeatMode === 'all' ? handlePreviousVideo : undefined,
            repeatMode: repeatMode
          }}
        />
      )}
    </div>
  );
};

export default PlaylistDetail;
