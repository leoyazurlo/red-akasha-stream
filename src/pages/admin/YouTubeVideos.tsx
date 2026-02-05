import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MoveUp, MoveDown, Link, Play, ExternalLink } from "lucide-react";

interface HomeVideo {
  id: string;
  title: string;
  youtube_id: string;
  thumbnail: string;
  duration: string;
  category: "programas" | "shorts" | "destacados";
  order_index: number;
  is_active: boolean;
  video_url?: string;
  platform?: string;
}

// Helper para detectar plataformas de video
const getVideoPlatform = (url: string): { platform: string; videoId: string; thumbnail: string } | null => {
  try {
    const urlObj = new URL(url);
    
    // YouTube
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      let videoId = '';
      if (urlObj.hostname.includes('youtu.be')) {
        videoId = urlObj.pathname.slice(1);
      } else {
        videoId = urlObj.searchParams.get('v') || '';
      }
      if (videoId) {
        return {
          platform: 'YouTube',
          videoId,
          thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        };
      }
    }
    
    // Vimeo
    if (urlObj.hostname.includes('vimeo.com')) {
      const videoId = urlObj.pathname.split('/').pop() || '';
      if (videoId) {
        return {
          platform: 'Vimeo',
          videoId,
          thumbnail: ''
        };
      }
    }
    
    // Dailymotion
    if (urlObj.hostname.includes('dailymotion.com') || urlObj.hostname.includes('dai.ly')) {
      let videoId = '';
      if (urlObj.hostname.includes('dai.ly')) {
        videoId = urlObj.pathname.slice(1);
      } else {
        videoId = urlObj.pathname.split('/video/')[1]?.split('_')[0] || '';
      }
      if (videoId) {
        return {
          platform: 'Dailymotion',
          videoId,
          thumbnail: `https://www.dailymotion.com/thumbnail/video/${videoId}`
        };
      }
    }
    
    // URL directa de video
    if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
      return {
        platform: 'Direct',
        videoId: url,
        thumbnail: ''
      };
    }
    
    return null;
  } catch {
    return null;
  }
};

const YouTubeVideos = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<HomeVideo | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  
  const [formData, setFormData] = useState<{
    title: string;
    video_url: string;
    category: "programas" | "shorts" | "destacados";
    is_active: boolean;
  }>({
    title: "",
    video_url: "",
    category: "programas",
    is_active: true,
  });

  const [detectedPlatform, setDetectedPlatform] = useState<{ platform: string; videoId: string; thumbnail: string } | null>(null);

  // Fetch videos
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["home-videos", filterCategory],
    queryFn: async () => {
      let query = supabase
        .from("youtube_videos")
        .select("*")
        .order("category")
        .order("order_index");
      
      if (filterCategory !== "all") {
        query = query.eq("category", filterCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HomeVideo[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { title: string; video_url: string; category: string; is_active: boolean }) => {
      const platformInfo = getVideoPlatform(data.video_url);
      const youtube_id = platformInfo?.videoId || data.video_url;
      const thumbnail = platformInfo?.thumbnail || '';
      const platform = platformInfo?.platform || 'Unknown';
      
      if (editingVideo) {
        const { error } = await supabase 
          .from("youtube_videos")
          .update({
            title: data.title,
            youtube_id,
            thumbnail,
            duration: '',
            category: data.category,
            is_active: data.is_active,
          })
          .eq("id", editingVideo.id);
        if (error) throw error;
      } else {
        // Get max order_index for category
        const { data: maxOrder } = await supabase
          .from("youtube_videos")
          .select("order_index")
          .eq("category", data.category)
          .order("order_index", { ascending: false })
          .limit(1)
          .single();
        
        const { error } = await supabase.from("youtube_videos").insert([{
          title: data.title,
          youtube_id,
          thumbnail,
          duration: '',
          category: data.category,
          is_active: data.is_active ?? true,
          order_index: (maxOrder?.order_index ?? -1) + 1,
        }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-videos"] });
      toast.success(editingVideo ? "Video actualizado" : "Video agregado");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Error al guardar: " + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("youtube_videos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-videos"] });
      toast.success("Video eliminado");
    },
    onError: (error) => {
      toast.error("Error al eliminar: " + error.message);
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async ({
      id,
      newIndex,
    }: {
      id: string;
      newIndex: number;
    }) => {
      const { error } = await supabase
        .from("youtube_videos")
        .update({ order_index: newIndex })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-videos"] });
    },
  });

  const handleOpenDialog = (video?: HomeVideo) => {
    if (video) {
      setEditingVideo(video);
      // Reconstruir la URL si es YouTube
      const videoUrl = video.youtube_id.startsWith('http') 
        ? video.youtube_id 
        : `https://www.youtube.com/watch?v=${video.youtube_id}`;
      setFormData({
        title: video.title,
        video_url: videoUrl,
        category: video.category,
        is_active: video.is_active,
      });
      setDetectedPlatform(getVideoPlatform(videoUrl));
    } else {
      setEditingVideo(null);
      setFormData({
        title: "",
        video_url: "",
        category: "programas",
        is_active: true,
      });
      setDetectedPlatform(null);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingVideo(null);
    setDetectedPlatform(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleVideoUrlChange = (url: string) => {
    setFormData({ ...formData, video_url: url });
    const platform = getVideoPlatform(url);
    setDetectedPlatform(platform);
  };

  const handleReorder = (video: HomeVideo, direction: "up" | "down") => {
    const sameCategory = videos.filter((v) => v.category === video.category);
    const currentIndex = sameCategory.findIndex((v) => v.id === video.id);
    
    if (direction === "up" && currentIndex > 0) {
      const swapWith = sameCategory[currentIndex - 1];
      reorderMutation.mutate({ id: video.id, newIndex: swapWith.order_index });
      reorderMutation.mutate({
        id: swapWith.id,
        newIndex: video.order_index,
      });
    } else if (direction === "down" && currentIndex < sameCategory.length - 1) {
      const swapWith = sameCategory[currentIndex + 1];
      reorderMutation.mutate({ id: video.id, newIndex: swapWith.order_index });
      reorderMutation.mutate({
        id: swapWith.id,
        newIndex: video.order_index,
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Videos Home</h1>
            <p className="text-muted-foreground">
              Gestiona los videos de cualquier plataforma para el Home
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Video
          </Button>
        </div>

        <Alert className="border-primary/20 bg-primary/5">
          <Link className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <strong>Plataformas soportadas:</strong> YouTube, Vimeo, Dailymotion o enlace directo (mp4, webm).
            Los <strong>Shorts</strong> deben ser videos verticales.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="programas">Programas</SelectItem>
              <SelectItem value="shorts">Shorts</SelectItem>
              <SelectItem value="destacados">Destacados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : videos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No hay videos
                  </TableCell>
                </TableRow>
              ) : (
                videos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleReorder(video, "up")}
                        >
                          <MoveUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleReorder(video, "down")}
                        >
                          <MoveDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{video.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {video.thumbnail && (
                          <img src={video.thumbnail} alt="" className="w-12 h-8 object-cover rounded" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {video.youtube_id?.startsWith('http') ? 'Enlace' : 'YouTube'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{video.category}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          video.is_active ? "text-green-600" : "text-red-600"
                        }
                      >
                        {video.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(video)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(video.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVideo ? "Editar Video" : "Agregar Video"}
            </DialogTitle>
            <DialogDescription>
              Agrega un video de YouTube, Vimeo, Dailymotion u otra plataforma
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video_url">URL del Video</Label>
                <Input
                  id="video_url"
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                  required
                />
                {detectedPlatform && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">{detectedPlatform.platform} detectado</span>
                    </div>
                    {detectedPlatform.thumbnail && (
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                        <img
                          src={detectedPlatform.thumbnail}
                          alt="Thumbnail preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            if (detectedPlatform.platform === 'YouTube') {
                              e.currentTarget.src = `https://img.youtube.com/vi/${detectedPlatform.videoId}/hqdefault.jpg`;
                            }
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="w-12 h-12 text-white opacity-80" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría (Short = videos verticales)</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="programas">Programas</SelectItem>
                    <SelectItem value="shorts">Short (Vertical)</SelectItem>
                    <SelectItem value="destacados">Destacados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Video activo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default YouTubeVideos;