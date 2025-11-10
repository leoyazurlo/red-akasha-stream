import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Image as ImageIcon, Video, Music, Trash2, Check, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface MediaItem {
  id: string;
  media_type: string;
  file_url: string;
  file_name: string;
  file_size: number;
  thumbnail_url: string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  created_at: string;
  tags: string[] | null;
  folder: string | null;
}

interface MediaLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaType: 'video' | 'audio' | 'image';
  onSelect: (item: MediaItem) => void;
}

export const MediaLibrary = ({ open, onOpenChange, mediaType, onSelect }: MediaLibraryProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  useEffect(() => {
    if (open) {
      loadLibrary();
    }
  }, [open, mediaType]);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_media_library')
        .select('*')
        .eq('user_id', user.id)
        .eq('media_type', mediaType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading media library:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la biblioteca de archivos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    setDeleting(itemId);
    try {
      const { error } = await supabase
        .from('user_media_library')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(items.filter(item => item.id !== itemId));
      toast({
        title: "Archivo eliminado",
        description: "El archivo se eliminó de tu biblioteca",
      });
    } catch (error) {
      console.error('Error deleting media:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el archivo",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleSelect = () => {
    const selected = items.find(item => item.id === selectedId);
    if (selected) {
      onSelect(selected);
      onOpenChange(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getMediaIcon = () => {
    switch (mediaType) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      case 'image': return <ImageIcon className="w-4 h-4" />;
    }
  };

  // Get unique folders and tags
  const folders = ['all', ...new Set(items.map(item => item.folder || 'Sin categoría'))];
  const tags = ['all', ...new Set(items.flatMap(item => item.tags || []))];

  // Filter items based on selected folder and tag
  const filteredItems = items.filter(item => {
    const folderMatch = selectedFolder === 'all' || (item.folder || 'Sin categoría') === selectedFolder;
    const tagMatch = selectedTag === 'all' || (item.tags || []).includes(selectedTag);
    return folderMatch && tagMatch;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getMediaIcon()}
            Mi Biblioteca de {mediaType === 'video' ? 'Videos' : mediaType === 'audio' ? 'Audios' : 'Imágenes'}
          </DialogTitle>
          <DialogDescription>
            Selecciona un archivo de tu biblioteca para reutilizarlo
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No tienes archivos de este tipo en tu biblioteca
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Los archivos que subas se guardarán automáticamente aquí
            </p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex gap-3 pb-4 border-b">
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Carpeta</label>
                <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map((folder) => (
                      <SelectItem key={folder} value={folder}>
                        {folder === 'all' ? 'Todas las carpetas' : folder}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Etiqueta</label>
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las etiquetas</SelectItem>
                    {tags.filter(t => t !== 'all').map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredItems.map((item) => (
                  <Card
                    key={item.id}
                    className={`relative cursor-pointer transition-all hover:border-primary/50 ${
                      selectedId === item.id ? 'border-primary ring-2 ring-primary/20' : ''
                    }`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    {/* Preview */}
                    <div className="aspect-video bg-muted relative overflow-hidden rounded-t-lg">
                      {mediaType === 'video' && item.thumbnail_url && (
                        <img
                          src={item.thumbnail_url}
                          alt={item.file_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {mediaType === 'video' && !item.thumbnail_url && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      {mediaType === 'audio' && (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                          <Music className="w-12 h-12 text-primary" />
                        </div>
                      )}
                      {mediaType === 'image' && (
                        <img
                          src={item.file_url}
                          alt={item.file_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      
                      {selectedId === item.id && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="w-4 h-4" />
                        </div>
                      )}

                      {/* Delete button */}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute bottom-2 right-2 h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        disabled={deleting === item.id}
                      >
                        {deleting === item.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    </div>

                    {/* Info */}
                    <div className="p-2 space-y-1">
                      <p className="text-xs font-medium truncate">{item.file_name}</p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatFileSize(item.file_size)}</span>
                        {item.duration_seconds && (
                          <span>{formatDuration(item.duration_seconds)}</span>
                        )}
                        {item.width && item.height && (
                          <span>{item.width}x{item.height}</span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSelect} disabled={!selectedId}>
                Usar Seleccionado
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
