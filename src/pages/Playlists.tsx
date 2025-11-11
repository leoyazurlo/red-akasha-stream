import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CosmicBackground } from "@/components/CosmicBackground";
import { useAuth } from "@/hooks/useAuth";
import { usePlaylists } from "@/hooks/usePlaylists";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { List, Plus, Edit, Trash2, Lock, Globe } from "lucide-react";
import { PlaylistDialog } from "@/components/PlaylistDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
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

const Playlists = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { playlists, loading, createPlaylist, updatePlaylist, deletePlaylist } = usePlaylists();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingPlaylist, setDeletingPlaylist] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleCreate = async (name: string, description?: string, isPublic?: boolean) => {
    await createPlaylist(name, description, isPublic);
  };

  const handleEdit = async (name: string, description?: string, isPublic?: boolean) => {
    if (!editingPlaylist) return;
    await updatePlaylist(editingPlaylist.id, {
      name,
      description,
      is_public: isPublic,
    });
    setEditingPlaylist(null);
  };

  const handleDelete = async () => {
    if (!deletingPlaylist) return;
    await deletePlaylist(deletingPlaylist.id);
    setDeletingPlaylist(null);
  };

  const openEditDialog = (playlist: any) => {
    setEditingPlaylist(playlist);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (playlist: any) => {
    setDeletingPlaylist(playlist);
    setShowDeleteDialog(true);
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
          {/* Hero Section */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <List className="w-10 h-10 text-primary" />
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Mis Playlists
                </h1>
              </div>
              <p className="text-lg text-muted-foreground">
                Organiza tus videos favoritos en colecciones personalizadas
              </p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Nueva Playlist
            </Button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary/20 flex items-center justify-center">
                <List className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No tienes playlists aún</h3>
              <p className="text-muted-foreground mb-6">
                Crea tu primera playlist para organizar tus videos favoritos
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primera Playlist
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {playlists.map((playlist) => (
                <Card 
                  key={playlist.id}
                  className="group overflow-hidden border-border bg-card/30 backdrop-blur-sm hover:bg-card/60 transition-all cursor-pointer"
                  onClick={() => navigate(`/playlist/${playlist.id}`)}
                >
                  {/* Thumbnail */}
                  <div className="relative overflow-hidden bg-secondary/20">
                    <AspectRatio ratio={16 / 9}>
                      {playlist.thumbnail_url ? (
                        <img
                          src={playlist.thumbnail_url}
                          alt={playlist.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-500/20">
                          <List className="w-16 h-16 text-primary/50" />
                        </div>
                      )}
                    </AspectRatio>
                    
                    {/* Privacy Badge */}
                    <div className="absolute top-2 left-2">
                      {playlist.is_public ? (
                        <div className="bg-green-500/80 text-white px-2 py-1 rounded-md flex items-center gap-1 text-xs">
                          <Globe className="w-3 h-3" />
                          Pública
                        </div>
                      ) : (
                        <div className="bg-secondary/80 text-foreground px-2 py-1 rounded-md flex items-center gap-1 text-xs">
                          <Lock className="w-3 h-3" />
                          Privada
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 bg-background/80 hover:bg-background"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(playlist);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8 bg-destructive/80 hover:bg-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(playlist);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Content Info */}
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg line-clamp-1">{playlist.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {playlist.description || "Sin descripción"}
                    </CardDescription>
                    <p className="text-sm text-muted-foreground mt-2">
                      {playlist.items_count || 0} video{playlist.items_count !== 1 ? 's' : ''}
                    </p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </main>
        
        <Footer />
      </div>

      {/* Create Dialog */}
      <PlaylistDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreate}
      />

      {/* Edit Dialog */}
      {editingPlaylist && (
        <PlaylistDialog
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) setEditingPlaylist(null);
          }}
          onSubmit={handleEdit}
          title="Editar Playlist"
          description="Modifica los detalles de tu playlist"
          initialValues={{
            name: editingPlaylist.name,
            description: editingPlaylist.description || "",
            isPublic: editingPlaylist.is_public,
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar playlist?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará "{deletingPlaylist?.name}" y todos los videos de esta lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingPlaylist(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Playlists;
