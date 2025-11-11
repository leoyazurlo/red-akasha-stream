import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePlaylists } from "@/hooks/usePlaylists";
import { Plus, List, Loader2 } from "lucide-react";
import { PlaylistDialog } from "./PlaylistDialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddToPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: string;
}

export const AddToPlaylistDialog = ({
  open,
  onOpenChange,
  contentId,
}: AddToPlaylistDialogProps) => {
  const { playlists, addToPlaylist, createPlaylist, loading } = usePlaylists();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const handleAddToPlaylist = async (playlistId: string) => {
    setAddingTo(playlistId);
    const success = await addToPlaylist(playlistId, contentId);
    setAddingTo(null);
    if (success) {
      onOpenChange(false);
    }
  };

  const handleCreatePlaylist = async (name: string, description?: string, isPublic?: boolean) => {
    const playlist = await createPlaylist(name, description, isPublic);
    if (playlist) {
      setShowCreateDialog(false);
      await addToPlaylist(playlist.id, contentId);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agregar a Playlist</DialogTitle>
            <DialogDescription>
              Selecciona una playlist o crea una nueva
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear nueva playlist
            </Button>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : playlists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <List className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tienes playlists aún</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {playlists.map((playlist) => (
                    <Button
                      key={playlist.id}
                      variant="ghost"
                      className="w-full justify-start h-auto py-3"
                      onClick={() => handleAddToPlaylist(playlist.id)}
                      disabled={addingTo !== null}
                    >
                      <div className="flex flex-col items-start flex-1">
                        <div className="flex items-center gap-2 w-full">
                          <List className="h-4 w-4 shrink-0" />
                          <span className="font-medium truncate">{playlist.name}</span>
                          {addingTo === playlist.id && (
                            <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground ml-6">
                          {playlist.items_count || 0} video{playlist.items_count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PlaylistDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSubmit={handleCreatePlaylist}
        title="Nueva Playlist"
        description="Crea una nueva playlist y agrega este video"
      />
    </>
  );
};
